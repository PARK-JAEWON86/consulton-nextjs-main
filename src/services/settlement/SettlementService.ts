/**
 * 정산 서비스
 * DB/백엔드와 무관한 순수한 비즈니스 로직
 */

import {
  RepositoryContainer,
  ExtendedRepositoryContainer
} from '../../repositories/interfaces';
import {
  Session,
  PayoutBatch,
  PayoutItem,
  PayoutPeriod,
  Money,
  Credits,
  BasisPoints,
  RuntimeConfig,
  SettlementError,
  SETTLEMENT_ERROR_CODES,
  SettlementRunRequest,
  SettlementRunResponse,
  SettlementConfirmRequest,
  SettlementStats,
  ExpertEarnings
} from '../../types/settlement';

export class SettlementService {
  constructor(
    private repos: ExtendedRepositoryContainer
  ) {}

  /**
   * 월별 정산 배치 실행
   */
  async runMonthlySettlement(request: SettlementRunRequest): Promise<SettlementRunResponse> {
    const { month, dryRun = false } = request;
    
    // 입력 검증
    this.validateMonthFormat(month);
    
    // 기존 배치 확인
    const existingBatches = await this.repos.payoutBatches.getBatchesByMonth(month);
    if (existingBatches.length > 0 && !dryRun) {
      throw new SettlementError(
        `Settlement batch already exists for month ${month}`,
        SETTLEMENT_ERROR_CODES.BATCH_ALREADY_EXISTS,
        { month, existingBatchId: existingBatches[0].id }
      );
    }

    // 설정 로드
    const config = await this.repos.config.getRuntimeConfig();
    
    // 기간 설정 (KST 기준)
    const period = this.getMonthPeriod(month, config.timezone);
    
    // 완료된 세션 조회
    const sessions = await this.repos.sessions.getSessionsByPeriod(
      period.fromTs,
      period.toTs,
      'completed'
    );

    if (sessions.length === 0) {
      throw new SettlementError(
        `No completed sessions found for month ${month}`,
        SETTLEMENT_ERROR_CODES.INVALID_PERIOD,
        { month, period }
      );
    }

    // 전문가별 세션 집계
    const expertAggregations = this.aggregateSessionsByExpert(sessions);
    
    // 정산 배치 생성
    const batchId = `SETTLE_${month.replace('-', '')}`;
    const batch: PayoutBatch = {
      id: batchId,
      month,
      scheduledAt: Date.now(),
      status: dryRun ? 'draft' : 'frozen',
      totals: {
        experts: expertAggregations.size,
        grossKrw: 0,
        withheldKrw: 0,
        netPaidKrw: 0
      }
    };

    const payoutItems: PayoutItem[] = [];
    let totalGrossKrw = 0;
    let totalWithheldKrw = 0;
    let totalNetKrw = 0;

    // 전문가별 정산 항목 생성
    for (const [expertId, aggregation] of expertAggregations.entries()) {
      const expert = await this.repos.users.getUserById(expertId);
      if (!expert || expert.role !== 'expert') {
        console.warn(`Expert not found or invalid role: ${expertId}`);
        continue;
      }

      if (!expert.bank) {
        console.warn(`Bank info missing for expert: ${expertId}`);
        continue;
      }

      // 원천징수 계산
      const taxWithheld = this.calculateTaxWithholding(
        aggregation.grossKrw,
        config.withhold_3_3,
        expert.taxMode
      );

      const netKrw = aggregation.grossKrw - taxWithheld;

      const payoutItem: PayoutItem = {
        batchId,
        expertId,
        period: {
          from: period.fromStr,
          to: period.toStr
        },
        grossKrw: aggregation.grossKrw,
        taxWithheldKrw: taxWithheld,
        netKrw,
        bank: expert.bank,
        status: 'pending',
        breakdown: aggregation.sessions.map(s => ({
          sessionId: s.id,
          amountKrw: s.expertGrossKrw
        })),
        createdAt: Date.now()
      };

      payoutItems.push(payoutItem);
      totalGrossKrw += aggregation.grossKrw;
      totalWithheldKrw += taxWithheld;
      totalNetKrw += netKrw;
    }

    // 배치 총계 업데이트
    batch.totals = {
      experts: payoutItems.length,
      grossKrw: totalGrossKrw,
      withheldKrw: totalWithheldKrw,
      netPaidKrw: totalNetKrw
    };

    // 드라이런이 아닌 경우에만 실제 저장
    if (!dryRun) {
      await this.repos.transaction.runTransaction(async (repos) => {
        // 배치 생성
        await repos.payoutBatches.createBatch(batch);
        
        // 정산 항목들 생성
        for (const item of payoutItems) {
          await repos.payoutItems.createItem(item);
        }
        
        // 장부 기록 (payable_expert → cash + tax_withheld)
        for (const item of payoutItems) {
          await repos.ledgers.createEntry({
            ts: Date.now(),
            type: 'PAYOUT',
            amountKrw: item.grossKrw,
            debit: 'payable_expert',
            credit: 'cash',
            refId: `${batchId}_${item.expertId}`,
            splits: [
              { debit: 'payable_expert' as const, amountKrw: item.grossKrw },
              { credit: 'cash' as const, amountKrw: item.netKrw },
              ...(item.taxWithheldKrw > 0 ? [{ credit: 'tax_withheld' as const, amountKrw: item.taxWithheldKrw }] : [])
            ],
            description: `Monthly settlement payout for ${item.expertId} (${month})`
          });
        }
      });
    }

    return {
      batchId,
      month,
      itemsCount: payoutItems.length,
      totals: batch.totals,
      dryRun
    };
  }

  /**
   * 정산 확정 (지급 완료 처리)
   */
  async confirmSettlement(request: SettlementConfirmRequest): Promise<void> {
    const { batchId, payouts } = request;
    
    // 배치 존재 확인
    const batch = await this.repos.payoutBatches.getBatchById(batchId);
    if (!batch) {
      throw new SettlementError(
        `Payout batch not found: ${batchId}`,
        SETTLEMENT_ERROR_CODES.BATCH_NOT_FOUND,
        { batchId }
      );
    }

    // 배치 상태 확인
    if (batch.status === 'paid') {
      throw new SettlementError(
        `Payout batch already processed: ${batchId}`,
        SETTLEMENT_ERROR_CODES.PAYOUT_ALREADY_PROCESSED,
        { batchId, status: batch.status }
      );
    }

    await this.repos.transaction.runTransaction(async (repos) => {
      // 각 정산 항목 상태 업데이트
      for (const payout of payouts) {
        const paidAt = payout.status === 'paid' ? Date.now() : undefined;
        
        await repos.payoutItems.updateItemStatus(
          batchId,
          payout.expertId,
          payout.status,
          paidAt,
          payout.failureReason
        );
      }

      // 모든 항목이 성공적으로 지급되었는지 확인
      const allItems = await repos.payoutItems.getItemsByBatch(batchId);
      const allPaid = allItems.every(item => item.status === 'paid');
      const anyFailed = allItems.some(item => item.status === 'failed');

      // 배치 상태 업데이트
      const newBatchStatus = anyFailed ? 'failed' : (allPaid ? 'paid' : 'frozen');
      const executedAt = (allPaid || anyFailed) ? Date.now() : undefined;
      
      await repos.payoutBatches.updateBatchStatus(batchId, newBatchStatus, executedAt);
    });
  }

  /**
   * 월별 정산 통계 조회
   */
  async getMonthlyStats(month: string): Promise<SettlementStats> {
    this.validateMonthFormat(month);
    
    const config = await this.repos.config.getRuntimeConfig();
    const period = this.getMonthPeriod(month, config.timezone);
    
    const stats = await this.repos.stats.getPlatformStats({
      from: period.fromTs,
      to: period.toTs
    });

    return {
      month,
      totalSessions: 0, // TODO: 세션 수 추가 필요
      ...stats
    };
  }

  /**
   * 전문가별 수익 조회
   */
  async getExpertEarnings(expertId: string, month: string): Promise<ExpertEarnings> {
    this.validateMonthFormat(month);
    
    const config = await this.repos.config.getRuntimeConfig();
    const period = this.getMonthPeriod(month, config.timezone);
    
    const earnings = await this.repos.stats.getExpertEarnings(expertId, {
      from: period.fromTs,
      to: period.toTs
    });

    const grossEarnings = earnings.grossEarningsKrw || 0;
    const netEarnings = earnings.netEarningsKrw || 0;
    const platformFee = grossEarnings - netEarnings; // 플랫폼 수수료 계산

    return {
      expertId,
      period: {
        from: period.fromStr,
        to: period.toStr
      },
      totalSessions: earnings.totalSessions || 0,
      grossEarningsKrw: grossEarnings,
      platformFeeKrw: platformFee,
      netEarningsKrw: netEarnings,
      avgSessionDurationMin: 60, // 기본값 60분
      avgRatePerMinKrw: earnings.avgRatePerMinKrw || 0
    };
  }

  /**
   * 다음 정산일 계산
   */
  getNextSettlementDate(config: RuntimeConfig): Date {
    const now = new Date();
    const settlementDay = config.settlementDay;
    
    let nextSettlement = new Date(now.getFullYear(), now.getMonth(), settlementDay);
    
    // 이번 달 정산일이 지났으면 다음 달로
    if (nextSettlement <= now) {
      nextSettlement = new Date(now.getFullYear(), now.getMonth() + 1, settlementDay);
    }
    
    return nextSettlement;
  }

  /**
   * 프라이빗 헬퍼 메서드들
   */
  private validateMonthFormat(month: string): void {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      throw new SettlementError(
        `Invalid month format: ${month}. Expected YYYY-MM`,
        SETTLEMENT_ERROR_CODES.INVALID_PERIOD,
        { month }
      );
    }
  }

  private getMonthPeriod(month: string, timezone: string) {
    const [year, monthStr] = month.split('-');
    const monthNum = parseInt(monthStr, 10);
    
    // 해당 월 1일 00:00:00 (KST)
    const fromDate = new Date(`${year}-${monthStr}-01T00:00:00+09:00`);
    
    // 해당 월 마지막 날 23:59:59 (KST)
    const toDate = new Date(parseInt(year), monthNum, 0, 23, 59, 59, 999);
    
    return {
      fromTs: fromDate.getTime(),
      toTs: toDate.getTime(),
      fromStr: `${year}-${monthStr}-01`,
      toStr: toDate.toISOString().split('T')[0]
    };
  }

  private aggregateSessionsByExpert(sessions: Session[]): Map<string, { grossKrw: Money; sessions: Session[] }> {
    const aggregations = new Map<string, { grossKrw: Money; sessions: Session[] }>();
    
    for (const session of sessions) {
      const existing = aggregations.get(session.expertId) || { grossKrw: 0, sessions: [] };
      existing.grossKrw += session.expertGrossKrw;
      existing.sessions.push(session);
      aggregations.set(session.expertId, existing);
    }
    
    return aggregations;
  }

  private calculateTaxWithholding(grossKrw: Money, withhold3_3: boolean, taxMode: 'withhold' | 'self'): Money {
    if (!withhold3_3 || taxMode === 'self') {
      return 0;
    }
    
    // 3.3% 원천징수 (소득세 3% + 지방소득세 0.3%)
    return Math.floor(grossKrw * 0.033);
  }
}
