/**
 * 정산 시스템 테스트 유틸리티
 * 개발 환경에서 정산 시스템을 테스트하기 위한 헬퍼 함수들
 */

import { getRepositoryContainer, initializeTestData } from '../config/SettlementConfig';
import { PaymentService } from '../services/payment/PaymentService';
import { SettlementService } from '../services/settlement/SettlementService';

export class SettlementTester {
  private repos = getRepositoryContainer();
  private paymentService = new PaymentService(this.repos);
  private settlementService = new SettlementService(this.repos);

  /**
   * 테스트 데이터 초기화
   */
  async initializeTestData() {
    await initializeTestData();
    console.log('✅ Test data initialized');
  }

  /**
   * 테스트 크레딧 충전
   */
  async testCreditTopup(userId: string, amountKrw: number) {
    try {
      // 1. 충전 인텐트 생성
      const intent = await this.paymentService.createTopupIntent({
        amountKrw,
        userId
      });
      console.log('✅ Topup intent created:', intent);

      // 2. 웹훅 시뮬레이션 (결제 완료)
      await this.paymentService.handleTossWebhook(
        intent.tossPaymentKey,
        intent.tossOrderId,
        amountKrw
      );
      console.log('✅ Payment webhook processed');

      // 3. 지갑 잔액 확인
      const balance = await this.paymentService.getWalletBalance(userId);
      console.log('✅ Wallet balance:', balance);

      return intent;
    } catch (error) {
      console.error('❌ Credit topup failed:', error);
      throw error;
    }
  }

  /**
   * 테스트 세션 완료
   */
  async testSessionComplete(
    sessionId: string,
    clientId: string,
    expertId: string,
    durationMin: number,
    ratePerMinKrw: number
  ) {
    try {
      const now = Date.now();
      const startedAt = now - (durationMin * 60 * 1000);
      const endedAt = now;

      const result = await this.paymentService.completeSession({
        sessionId,
        clientId,
        expertId,
        startedAt,
        endedAt,
        durationMin,
        ratePerMinKrw
      });

      console.log('✅ Session completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Session completion failed:', error);
      throw error;
    }
  }

  /**
   * 테스트 월별 정산 실행
   */
  async testMonthlySettlement(month: string, dryRun = true) {
    try {
      const result = await this.settlementService.runMonthlySettlement({
        month,
        dryRun
      });

      console.log('✅ Monthly settlement completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Monthly settlement failed:', error);
      throw error;
    }
  }

  /**
   * 전체 플로우 테스트 시나리오
   */
  async runFullScenario() {
    console.log('🚀 Starting full settlement test scenario...');
    
    try {
      // 1. 테스트 데이터 초기화
      await this.initializeTestData();

      // 2. 클라이언트 크레딧 충전 (100,000원)
      await this.testCreditTopup('client_1', 100000);

      // 3. 여러 세션 완료 시뮬레이션
      const sessions = [
        { id: 'session_1', duration: 30, rate: 1000 }, // 30분, 1000원/분
        { id: 'session_2', duration: 45, rate: 1000 }, // 45분, 1000원/분  
        { id: 'session_3', duration: 60, rate: 1000 }, // 60분, 1000원/분
      ];

      for (const session of sessions) {
        await this.testSessionComplete(
          session.id,
          'client_1',
          'expert_1',
          session.duration,
          session.rate
        );
      }

      // 4. 이번 달 정산 시뮬레이션 (드라이런)
      const currentMonth = new Date().toISOString().slice(0, 7);
      await this.testMonthlySettlement(currentMonth, true);

      // 5. 통계 확인
      await this.printStats();

      console.log('🎉 Full scenario completed successfully!');
    } catch (error) {
      console.error('❌ Full scenario failed:', error);
      throw error;
    }
  }

  /**
   * 통계 출력
   */
  async printStats() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // 월별 통계
      const monthlyStats = await this.settlementService.getMonthlyStats(currentMonth);
      console.log('📊 Monthly Stats:', monthlyStats);

      // 전문가 수익
      const expertEarnings = await this.settlementService.getExpertEarnings('expert_1', currentMonth);
      console.log('💰 Expert Earnings:', expertEarnings);

      // 장부 잔액 확인
      const balances = await this.repos.ledgers.getAccountBalances([
        'cash',
        'credits_liab',
        'payable_expert',
        'revenue_platform',
        'infra_exp'
      ]);
      console.log('📚 Account Balances:', balances);

    } catch (error) {
      console.error('❌ Stats printing failed:', error);
    }
  }

  /**
   * 데이터 초기화
   */
  async clearData() {
    // Mock 구현체의 경우 메모리 클리어
    if (process.env.DATABASE_TYPE === 'mock') {
      const { MockRepositoryFactory } = await import('../repositories/implementations/MockRepositories');
      const factory = new MockRepositoryFactory();
      await factory.cleanup();
      console.log('✅ Mock data cleared');
    }
  }
}

/**
 * 개발 환경용 전역 테스터 인스턴스
 */
export const settlementTester = new SettlementTester();

/**
 * 브라우저 콘솔에서 사용할 수 있도록 window 객체에 등록
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).settlementTester = settlementTester;
  console.log('🔧 Settlement tester available as window.settlementTester');
  console.log('Try: await window.settlementTester.runFullScenario()');
}
