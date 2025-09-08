/**
 * 성능 테스트 스크립트
 * 데이터베이스 쿼리 성능과 API 응답 시간을 측정합니다.
 */

import { initializeDatabase } from '../src/lib/db/init';
import { 
  User, 
  Expert, 
  ExpertProfile, 
  Consultation, 
  Review, 
  ConsultationSummary,
  Category,
  Payment
} from '../src/lib/db/models';
import { 
  getConsultationsByExpert, 
  getConsultationsByUser, 
  getReviewsByExpert,
  searchExpertProfiles,
  getPopularCategories
} from '../src/lib/db/queryOptimizations';

interface PerformanceResult {
  testName: string;
  duration: number;
  recordCount?: number;
  success: boolean;
  error?: string;
}

class PerformanceTester {
  private results: PerformanceResult[] = [];

  /**
   * 모든 성능 테스트 실행
   */
  async runAllTests(): Promise<void> {
    console.log('⚡ 성능 테스트 시작...\n');

    try {
      await initializeDatabase();
      
      // 1. 기본 쿼리 성능 테스트
      await this.testBasicQueries();
      
      // 2. 최적화된 쿼리 성능 테스트
      await this.testOptimizedQueries();
      
      // 3. 복잡한 JOIN 쿼리 성능 테스트
      await this.testComplexQueries();
      
      // 4. 대용량 데이터 처리 성능 테스트
      await this.testLargeDataQueries();
      
      // 5. 동시성 테스트
      await this.testConcurrency();
      
    } catch (error) {
      console.error('❌ 성능 테스트 실행 중 오류:', error);
    }

    // 결과 출력
    this.printResults();
  }

  /**
   * 기본 쿼리 성능 테스트
   */
  private async testBasicQueries(): Promise<void> {
    console.log('📊 기본 쿼리 성능 테스트...');
    
    // 사용자 조회 테스트
    await this.runTest('사용자 전체 조회', async () => {
      const startTime = Date.now();
      const users = await User.findAll();
      const duration = Date.now() - startTime;
      return { duration, recordCount: users.length };
    });

    // 전문가 조회 테스트
    await this.runTest('전문가 전체 조회', async () => {
      const startTime = Date.now();
      const experts = await Expert.findAll();
      const duration = Date.now() - startTime;
      return { duration, recordCount: experts.length };
    });

    // 상담 조회 테스트
    await this.runTest('상담 전체 조회', async () => {
      const startTime = Date.now();
      const consultations = await Consultation.findAll();
      const duration = Date.now() - startTime;
      return { duration, recordCount: consultations.length };
    });

    // 리뷰 조회 테스트
    await this.runTest('리뷰 전체 조회', async () => {
      const startTime = Date.now();
      const reviews = await Review.findAll();
      const duration = Date.now() - startTime;
      return { duration, recordCount: reviews.length };
    });
  }

  /**
   * 최적화된 쿼리 성능 테스트
   */
  private async testOptimizedQueries(): Promise<void> {
    console.log('🚀 최적화된 쿼리 성능 테스트...');
    
    // 전문가별 상담 조회 테스트
    await this.runTest('전문가별 상담 조회 (최적화)', async () => {
      const startTime = Date.now();
      const result = await getConsultationsByExpert(1, {
        pagination: { page: 1, limit: 20 }
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: result.rows.length };
    });

    // 사용자별 상담 조회 테스트
    await this.runTest('사용자별 상담 조회 (최적화)', async () => {
      const startTime = Date.now();
      const result = await getConsultationsByUser('user_001', {
        pagination: { page: 1, limit: 20 }
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: result.rows.length };
    });

    // 전문가별 리뷰 조회 테스트
    await this.runTest('전문가별 리뷰 조회 (최적화)', async () => {
      const startTime = Date.now();
      const result = await getReviewsByExpert(1, {
        pagination: { page: 1, limit: 20 }
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: result.rows.length };
    });

    // 전문가 프로필 검색 테스트
    await this.runTest('전문가 프로필 검색 (최적화)', async () => {
      const startTime = Date.now();
      const result = await searchExpertProfiles('테스트', {
        pagination: { page: 1, limit: 20 }
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: result.rows.length };
    });

    // 인기 카테고리 조회 테스트
    await this.runTest('인기 카테고리 조회 (최적화)', async () => {
      const startTime = Date.now();
      const result = await getPopularCategories(10);
      const duration = Date.now() - startTime;
      return { duration, recordCount: result.length };
    });
  }

  /**
   * 복잡한 JOIN 쿼리 성능 테스트
   */
  private async testComplexQueries(): Promise<void> {
    console.log('🔗 복잡한 JOIN 쿼리 성능 테스트...');
    
    // 상담 + 사용자 + 전문가 JOIN 테스트
    await this.runTest('상담+사용자+전문가 JOIN', async () => {
      const startTime = Date.now();
      const consultations = await Consultation.findAll({
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Expert,
            as: 'expert',
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                required: false,
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        limit: 50
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: consultations.length };
    });

    // 리뷰 + 사용자 + 전문가 + 상담 JOIN 테스트
    await this.runTest('리뷰+사용자+전문가+상담 JOIN', async () => {
      const startTime = Date.now();
      const reviews = await Review.findAll({
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Expert,
            as: 'expert',
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                required: false,
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: Consultation,
            as: 'consultation',
            required: false,
            attributes: ['id', 'title']
          }
        ],
        limit: 50
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: reviews.length };
    });

    // 전문가 프로필 + 전문가 + 사용자 JOIN 테스트
    await this.runTest('전문가 프로필+전문가+사용자 JOIN', async () => {
      const startTime = Date.now();
      const profiles = await ExpertProfile.findAll({
        include: [
          {
            model: Expert,
            as: 'expert',
            required: true,
            include: [
              {
                model: User,
                as: 'user',
                required: true,
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        limit: 50
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: profiles.length };
    });
  }

  /**
   * 대용량 데이터 처리 성능 테스트
   */
  private async testLargeDataQueries(): Promise<void> {
    console.log('📈 대용량 데이터 처리 성능 테스트...');
    
    // 대용량 상담 조회 테스트
    await this.runTest('대용량 상담 조회 (1000개)', async () => {
      const startTime = Date.now();
      const consultations = await Consultation.findAll({
        limit: 1000,
        order: [['createdAt', 'DESC']]
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: consultations.length };
    });

    // 대용량 리뷰 조회 테스트
    await this.runTest('대용량 리뷰 조회 (1000개)', async () => {
      const startTime = Date.now();
      const reviews = await Review.findAll({
        limit: 1000,
        order: [['createdAt', 'DESC']]
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: reviews.length };
    });

    // 복잡한 집계 쿼리 테스트
    await this.runTest('복잡한 집계 쿼리', async () => {
      const startTime = Date.now();
      const stats = await Consultation.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', '*'), 'count'],
          [require('sequelize').fn('AVG', require('sequelize').col('price')), 'avgPrice']
        ],
        group: ['status']
      });
      const duration = Date.now() - startTime;
      return { duration, recordCount: stats.length };
    });
  }

  /**
   * 동시성 테스트
   */
  private async testConcurrency(): Promise<void> {
    console.log('🔄 동시성 테스트...');
    
    // 동시 사용자 조회 테스트
    await this.runTest('동시 사용자 조회 (10개)', async () => {
      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() => User.findAll());
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      return { duration, recordCount: results[0].length };
    });

    // 동시 전문가 조회 테스트
    await this.runTest('동시 전문가 조회 (10개)', async () => {
      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() => Expert.findAll());
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      return { duration, recordCount: results[0].length };
    });

    // 동시 상담 조회 테스트
    await this.runTest('동시 상담 조회 (10개)', async () => {
      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() => Consultation.findAll());
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      return { duration, recordCount: results[0].length };
    });
  }

  /**
   * 개별 테스트 실행
   */
  private async runTest(testName: string, testFn: () => Promise<{ duration: number; recordCount?: number }>): Promise<void> {
    try {
      const result = await testFn();
      
      this.results.push({
        testName,
        duration: result.duration,
        recordCount: result.recordCount,
        success: true
      });
      
      const recordInfo = result.recordCount ? ` (${result.recordCount}개)` : '';
      console.log(`  ✅ ${testName}${recordInfo}: ${result.duration}ms`);
    } catch (error) {
      this.results.push({
        testName,
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`  ❌ ${testName}: ${error}`);
    }
  }

  /**
   * 성능 테스트 결과 출력
   */
  private printResults(): void {
    console.log('\n📋 성능 테스트 결과:');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = successful > 0 ? totalDuration / successful : 0;
    
    console.log(`총 테스트: ${this.results.length}개`);
    console.log(`성공: ${successful}개`);
    console.log(`실패: ${failed}개`);
    console.log(`총 소요 시간: ${totalDuration}ms`);
    console.log(`평균 응답 시간: ${averageDuration.toFixed(2)}ms`);
    
    // 성능 분석
    const slowTests = this.results.filter(r => r.success && r.duration > 1000);
    const fastTests = this.results.filter(r => r.success && r.duration < 100);
    
    if (slowTests.length > 0) {
      console.log('\n🐌 느린 쿼리 (1초 이상):');
      slowTests.forEach(r => {
        const recordInfo = r.recordCount ? ` (${r.recordCount}개)` : '';
        console.log(`  - ${r.testName}${recordInfo}: ${r.duration}ms`);
      });
    }
    
    if (fastTests.length > 0) {
      console.log('\n⚡ 빠른 쿼리 (100ms 미만):');
      fastTests.forEach(r => {
        const recordInfo = r.recordCount ? ` (${r.recordCount}개)` : '';
        console.log(`  - ${r.testName}${recordInfo}: ${r.duration}ms`);
      });
    }
    
    if (failed > 0) {
      console.log('\n❌ 실패한 테스트:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.error}`));
    }
    
    console.log('\n🎉 성능 테스트 완료!');
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
}

export default PerformanceTester;
