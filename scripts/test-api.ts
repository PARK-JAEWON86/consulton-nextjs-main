/**
 * API 테스트 스크립트
 * 주요 API 엔드포인트들의 기능과 성능을 테스트합니다.
 */

import fetch from 'node-fetch';

// 테스트 설정
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123'
};

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

class APITester {
  private results: TestResult[] = [];
  private authToken: string | null = null;

  /**
   * 테스트 실행
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 API 테스트 시작...\n');

    try {
      // 1. 인증 테스트
      await this.testAuthentication();
      
      // 2. 사용자 관련 API 테스트
      await this.testUserAPIs();
      
      // 3. 전문가 관련 API 테스트
      await this.testExpertAPIs();
      
      // 4. 상담 관련 API 테스트
      await this.testConsultationAPIs();
      
      // 5. 리뷰 관련 API 테스트
      await this.testReviewAPIs();
      
      // 6. 통계 API 테스트
      await this.testStatsAPIs();
      
      // 7. 성능 테스트
      await this.testPerformance();
      
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
    }

    // 결과 출력
    this.printResults();
  }

  /**
   * 인증 테스트
   */
  private async testAuthentication(): Promise<void> {
    console.log('🔐 인증 테스트...');
    
    // 로그인 테스트
    await this.runTest('로그인', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });
      
      if (!response.ok) {
        throw new Error(`로그인 실패: ${response.status}`);
      }
      
      const data = await response.json() as any as any;
      if (data.success && data.token) {
        this.authToken = data.token;
        return data;
      }
      throw new Error('토큰이 없습니다');
    });

    // 사용자 정보 조회 테스트
    await this.runTest('사용자 정보 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`사용자 정보 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 사용자 관련 API 테스트
   */
  private async testUserAPIs(): Promise<void> {
    console.log('👤 사용자 API 테스트...');
    
    // 알림 조회 테스트
    await this.runTest('알림 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`알림 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 결제 내역 조회 테스트
    await this.runTest('결제 내역 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/payment-history`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`결제 내역 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 전문가 관련 API 테스트
   */
  private async testExpertAPIs(): Promise<void> {
    console.log('🎯 전문가 API 테스트...');
    
    // 전문가 프로필 조회 테스트
    await this.runTest('전문가 프로필 조회', async () => {
      const response = await fetch(`${BASE_URL}/api/expert-profiles`);
      
      if (!response.ok) {
        throw new Error(`전문가 프로필 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 전문가 통계 조회 테스트
    await this.runTest('전문가 통계 조회', async () => {
      const response = await fetch(`${BASE_URL}/api/expert-stats`);
      
      if (!response.ok) {
        throw new Error(`전문가 통계 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 전문가 검색 테스트
    await this.runTest('전문가 검색', async () => {
      const response = await fetch(`${BASE_URL}/api/expert-profiles/search?q=테스트`);
      
      if (!response.ok) {
        throw new Error(`전문가 검색 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 상담 관련 API 테스트
   */
  private async testConsultationAPIs(): Promise<void> {
    console.log('💬 상담 API 테스트...');
    
    // 상담 내역 조회 테스트
    await this.runTest('상담 내역 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/consultations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`상담 내역 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 상담 요약 조회 테스트
    await this.runTest('상담 요약 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/consultation-summaries`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`상담 요약 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 리뷰 관련 API 테스트
   */
  private async testReviewAPIs(): Promise<void> {
    console.log('⭐ 리뷰 API 테스트...');
    
    // 리뷰 조회 테스트
    await this.runTest('리뷰 조회', async () => {
      const response = await fetch(`${BASE_URL}/api/reviews`);
      
      if (!response.ok) {
        throw new Error(`리뷰 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 전문가별 리뷰 조회 테스트
    await this.runTest('전문가별 리뷰 조회', async () => {
      const response = await fetch(`${BASE_URL}/api/reviews?expertId=1`);
      
      if (!response.ok) {
        throw new Error(`전문가별 리뷰 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 통계 API 테스트
   */
  private async testStatsAPIs(): Promise<void> {
    console.log('📊 통계 API 테스트...');
    
    // 카테고리 통계 조회 테스트
    await this.runTest('카테고리 통계 조회', async () => {
      const response = await fetch(`${BASE_URL}/api/categories/popular`);
      
      if (!response.ok) {
        throw new Error(`카테고리 통계 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });

    // 플랫폼 통계 조회 테스트 (관리자 권한 필요)
    await this.runTest('플랫폼 통계 조회', async () => {
      if (!this.authToken) throw new Error('인증 토큰이 없습니다');
      
      const response = await fetch(`${BASE_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      // 403은 권한 부족으로 정상적인 응답
      if (response.status === 403) {
        return { message: '관리자 권한 필요 (정상)' };
      }
      
      if (!response.ok) {
        throw new Error(`플랫폼 통계 조회 실패: ${response.status}`);
      }
      
      return await response.json() as any;
    });
  }

  /**
   * 성능 테스트
   */
  private async testPerformance(): Promise<void> {
    console.log('⚡ 성능 테스트...');
    
    // 동시 요청 테스트
    await this.runTest('동시 요청 테스트 (10개)', async () => {
      const promises = Array(10).fill(null).map(() => 
        fetch(`${BASE_URL}/api/expert-profiles`)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.ok).length;
      
      return {
        totalRequests: 10,
        successfulRequests: successCount,
        duration: duration,
        averageResponseTime: duration / 10
      };
    });

    // 대용량 데이터 조회 테스트
    await this.runTest('대용량 데이터 조회', async () => {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/reviews?limit=100`);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`대용량 데이터 조회 실패: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      return {
        recordCount: data.reviews?.length || 0,
        duration: duration,
        responseSize: JSON.stringify(data).length
      };
    });
  }

  /**
   * 개별 테스트 실행
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const data = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        success: true,
        duration,
        data
      });
      
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`  ❌ ${name} (${duration}ms) - ${error}`);
    }
  }

  /**
   * 테스트 결과 출력
   */
  private printResults(): void {
    console.log('\n📋 테스트 결과 요약:');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / this.results.length;
    
    console.log(`총 테스트: ${this.results.length}개`);
    console.log(`성공: ${successful}개`);
    console.log(`실패: ${failed}개`);
    console.log(`총 소요 시간: ${totalDuration}ms`);
    console.log(`평균 응답 시간: ${averageDuration.toFixed(2)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ 실패한 테스트:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n✅ 성공한 테스트:');
    this.results
      .filter(r => r.success)
      .forEach(r => console.log(`  - ${r.name}: ${r.duration}ms`));
    
    console.log('\n🎉 테스트 완료!');
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

export default APITester;
