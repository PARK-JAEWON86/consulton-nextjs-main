/**
 * 결제 서비스
 * 크레딧 충전, 세션 결제 등 결제 관련 비즈니스 로직
 */

import {
  RepositoryContainer
} from '../../repositories/interfaces';
import {
  Payment,
  Session,
  Wallet,
  RuntimeConfig,
  Money,
  Credits,
  BasisPoints,
  TopupIntentRequest,
  TopupIntentResponse,
  SessionCompleteRequest,
  SessionCompleteResponse,
  SettlementError,
  SETTLEMENT_ERROR_CODES
} from '../../types/settlement';

export class PaymentService {
  constructor(
    private repos: RepositoryContainer
  ) {}

  /**
   * 크레딧 충전 인텐트 생성
   */
  async createTopupIntent(request: TopupIntentRequest): Promise<TopupIntentResponse> {
    const { amountKrw, userId, idempotencyKey } = request;
    
    // 입력 검증
    if (amountKrw <= 0) {
      throw new SettlementError(
        'Invalid topup amount',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { amountKrw }
      );
    }

    // 사용자 존재 확인
    const user = await this.repos.users.getUserById(userId);
    if (!user) {
      throw new SettlementError(
        'User not found',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { userId }
      );
    }

    // 크레딧 계산 (10원 = 1크레딧)
    const creditsToIssue = Math.floor(amountKrw / 10);
    if (creditsToIssue === 0) {
      throw new SettlementError(
        'Minimum topup amount is 10 KRW',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { amountKrw }
      );
    }

    // 설정 로드
    const config = await this.repos.config.getRuntimeConfig();
    const pgFeeKrw = Math.floor(amountKrw * (config.pgFeeBp / 10000));

    // 결제 ID 생성
    const paymentId = this.generatePaymentId();
    const tossOrderId = `ORDER_${paymentId}`;
    const tossPaymentKey = `PAYMENT_${paymentId}`;
    
    const finalIdempotencyKey = idempotencyKey || this.generateIdempotencyKey(userId, amountKrw);

    // 결제 레코드 생성 (pending 상태)
    const payment: Payment = {
      id: paymentId,
      userId,
      amountKrw,
      creditsIssued: creditsToIssue,
      pgFeeKrw,
      status: 'pending',
      idempotencyKey: finalIdempotencyKey,
      createdAt: Date.now(),
      tossPaymentKey,
      tossOrderId
    };

    await this.repos.payments.createPayment(payment);

    return {
      paymentId,
      tossPaymentKey,
      tossOrderId,
      amountKrw,
      creditsToIssue
    };
  }

  /**
   * 토스 웹훅 처리 (결제 완료)
   */
  async handleTossWebhook(paymentKey: string, orderId: string, amount: number): Promise<void> {
    // 결제 조회
    const payments = await this.repos.payments.getPaymentsByStatus('pending');
    const payment = payments.find(p => 
      p.tossPaymentKey === paymentKey && 
      p.tossOrderId === orderId &&
      p.amountKrw === amount
    );

    if (!payment) {
      throw new SettlementError(
        'Payment not found or amount mismatch',
        SETTLEMENT_ERROR_CODES.TRANSACTION_FAILED,
        { paymentKey, orderId, amount }
      );
    }

    await this.repos.transaction.runTransaction(async (repos) => {
      // 결제 상태 업데이트
      await repos.payments.updatePaymentStatus(payment.id, 'succeeded');
      
      // 크레딧 적립
      await repos.wallets.addCredits(payment.userId, payment.creditsIssued);
      
      // 장부 기록
      await repos.ledgers.createEntry({
        ts: Date.now(),
        type: 'CREDIT_TOPUP',
        amountKrw: payment.amountKrw,
        debit: 'cash',
        credit: 'credits_liab',
        refId: payment.id,
        splits: [
          { debit: 'cash', amountKrw: payment.amountKrw },
          { credit: 'credits_liab', amountKrw: payment.amountKrw },
          { debit: 'pg_fee_exp', amountKrw: payment.pgFeeKrw },
          { credit: 'cash', amountKrw: payment.pgFeeKrw }
        ],
        description: `Credit topup: ${payment.creditsIssued} credits for user ${payment.userId}`
      });
    });
  }

  /**
   * 세션 완료 처리 (크레딧 차감)
   */
  async completeSession(request: SessionCompleteRequest): Promise<SessionCompleteResponse> {
    const { sessionId, clientId, expertId, startedAt, endedAt, durationMin, ratePerMinKrw } = request;
    
    // 입력 검증
    if (durationMin <= 0) {
      throw new SettlementError(
        'Invalid session duration',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { durationMin }
      );
    }

    if (endedAt <= startedAt) {
      throw new SettlementError(
        'Invalid session times',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { startedAt, endedAt }
      );
    }

    // 사용자들 존재 확인
    const [client, expert] = await Promise.all([
      this.repos.users.getUserById(clientId),
      this.repos.users.getUserById(expertId)
    ]);

    if (!client || client.role !== 'client') {
      throw new SettlementError(
        'Client not found',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { clientId }
      );
    }

    if (!expert || expert.role !== 'expert') {
      throw new SettlementError(
        'Expert not found',
        SETTLEMENT_ERROR_CODES.INVALID_SESSION,
        { expertId }
      );
    }

    // 설정 로드
    const config = await this.repos.config.getRuntimeConfig();
    
    // 금액 계산
    const totalKrw = Math.floor(durationMin * ratePerMinKrw);
    const platformFeeKrw = Math.floor(totalKrw * (config.platformFeeBp / 10000));
    const expertGrossKrw = totalKrw - platformFeeKrw;
    const infraCostKrw = Math.floor(durationMin * config.infraCostPerMin);
    
    // 필요한 크레딧 계산
    const creditsNeeded = Math.floor(totalKrw / 10);

    // 세션 객체 생성
    const session: Session = {
      id: sessionId,
      clientId,
      expertId,
      startedAt,
      endedAt,
      durationMin,
      ratePerMinKrw,
      totalKrw,
      platformFeeKrw,
      expertGrossKrw,
      infraCostKrw,
      status: 'completed'
    };

    await this.repos.transaction.runTransaction(async (repos) => {
      // 크레딧 차감 (부족하면 에러)
      const success = await repos.wallets.deductCredits(clientId, creditsNeeded);
      if (!success) {
        throw new SettlementError(
          'Insufficient credits',
          SETTLEMENT_ERROR_CODES.INSUFFICIENT_CREDITS,
          { clientId, creditsNeeded, totalKrw }
        );
      }

      // 세션 생성
      await repos.sessions.createSession(session);

      // 장부 기록
      await repos.ledgers.createEntry({
        ts: Date.now(),
        type: 'SESSION_CHARGE',
        amountKrw: totalKrw,
        debit: 'credits_liab',
        credit: 'revenue_platform',
        refId: sessionId,
        splits: [
          { debit: 'credits_liab', amountKrw: totalKrw },
          { credit: 'revenue_platform', amountKrw: platformFeeKrw },
          { credit: 'payable_expert', amountKrw: expertGrossKrw },
          { debit: 'infra_exp', amountKrw: infraCostKrw },
          { credit: 'cash', amountKrw: infraCostKrw }
        ],
        description: `Session charge: ${sessionId} (${durationMin}min @ ${ratePerMinKrw}KRW/min)`
      });
    });

    return {
      sessionId,
      totalKrw,
      platformFeeKrw,
      expertGrossKrw,
      creditsCharged: creditsNeeded
    };
  }

  /**
   * 환불 처리
   */
  async processRefund(paymentId: string, reason: string): Promise<void> {
    const payment = await this.repos.payments.getPaymentById(paymentId);
    if (!payment) {
      throw new SettlementError(
        'Payment not found',
        SETTLEMENT_ERROR_CODES.TRANSACTION_FAILED,
        { paymentId }
      );
    }

    if (payment.status !== 'succeeded') {
      throw new SettlementError(
        'Cannot refund non-succeeded payment',
        SETTLEMENT_ERROR_CODES.TRANSACTION_FAILED,
        { paymentId, status: payment.status }
      );
    }

    // 사용자 크레딧 확인 (환불할 만큼 크레딧이 남아있는지)
    const wallet = await this.repos.wallets.getWallet(payment.userId);
    if (!wallet || wallet.credits < payment.creditsIssued) {
      throw new SettlementError(
        'Insufficient credits for refund',
        SETTLEMENT_ERROR_CODES.INSUFFICIENT_CREDITS,
        { 
          paymentId, 
          creditsIssued: payment.creditsIssued, 
          currentCredits: wallet?.credits || 0 
        }
      );
    }

    await this.repos.transaction.runTransaction(async (repos) => {
      // 크레딧 차감
      await repos.wallets.deductCredits(payment.userId, payment.creditsIssued);
      
      // 결제 상태는 그대로 두고 환불 장부 기록
      await repos.ledgers.createEntry({
        ts: Date.now(),
        type: 'REFUND',
        amountKrw: payment.amountKrw,
        debit: 'credits_liab',
        credit: 'cash',
        refId: payment.id,
        splits: [
          { debit: 'credits_liab', amountKrw: payment.amountKrw },
          { credit: 'cash', amountKrw: payment.amountKrw - payment.pgFeeKrw }, // PG수수료 제외
          { debit: 'cash', amountKrw: payment.pgFeeKrw },
          { credit: 'pg_fee_exp', amountKrw: payment.pgFeeKrw }
        ],
        description: `Refund: ${payment.id} - ${reason}`
      });
    });
  }

  /**
   * 사용자 지갑 조회
   */
  async getWalletBalance(userId: string): Promise<{ credits: Credits; krwValue: Money }> {
    const wallet = await this.repos.wallets.getWallet(userId);
    const credits = wallet?.credits || 0;
    const krwValue = credits * 10; // 1 크레딧 = 10원

    return { credits, krwValue };
  }

  /**
   * 프라이빗 헬퍼 메서드들
   */
  private generatePaymentId(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIdempotencyKey(userId: string, amount: number): string {
    const data = `${userId}_${amount}_${Date.now()}`;
    // 실제로는 crypto.createHash('sha256').update(data).digest('hex') 사용
    return `IDEM_${Buffer.from(data).toString('base64').substr(0, 32)}`;
  }
}
