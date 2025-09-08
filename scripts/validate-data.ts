/**
 * 데이터 정합성 검증 스크립트
 * 데이터베이스의 데이터 무결성과 일관성을 검증합니다.
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
  Payment,
  Notification,
  ExpertAvailability,
  PaymentMethod
} from '../src/lib/db/models';
import { Op } from 'sequelize';

interface ValidationResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

class DataValidator {
  private results: ValidationResult[] = [];

  /**
   * 모든 검증 실행
   */
  async runAllValidations(): Promise<void> {
    console.log('🔍 데이터 정합성 검증 시작...\n');

    try {
      await initializeDatabase();
      
      // 1. 기본 데이터 존재 검증
      await this.validateBasicData();
      
      // 2. 외래키 관계 검증
      await this.validateForeignKeys();
      
      // 3. 데이터 일관성 검증
      await this.validateDataConsistency();
      
      // 4. 비즈니스 로직 검증
      await this.validateBusinessLogic();
      
      // 5. 데이터 품질 검증
      await this.validateDataQuality();
      
    } catch (error) {
      console.error('❌ 검증 실행 중 오류:', error);
    }

    // 결과 출력
    (this as any).printResults();
  }

  /**
   * 기본 데이터 존재 검증
   */
  private async validateBasicData(): Promise<void> {
    console.log('📊 기본 데이터 존재 검증...');
    
    // 사용자 데이터 검증
    await (this as any).runValidation('사용자 데이터 존재', async () => {
      const userCount = await User.count();
      if (userCount === 0) {
        throw new Error('사용자 데이터가 없습니다');
      }
      return { userCount };
    });

    // 전문가 데이터 검증
    await (this as any).runValidation('전문가 데이터 존재', async () => {
      const expertCount = await Expert.count();
      if (expertCount === 0) {
        throw new Error('전문가 데이터가 없습니다');
      }
      return { expertCount };
    });

    // 카테고리 데이터 검증
    await (this as any).runValidation('카테고리 데이터 존재', async () => {
      const categoryCount = await Category.count();
      if (categoryCount === 0) {
        throw new Error('카테고리 데이터가 없습니다');
      }
      return { categoryCount };
    });

    // 전문가 프로필 데이터 검증
    await (this as any).runValidation('전문가 프로필 데이터 존재', async () => {
      const profileCount = await ExpertProfile.count();
      if (profileCount === 0) {
        throw new Error('전문가 프로필 데이터가 없습니다');
      }
      return { profileCount };
    });
  }

  /**
   * 외래키 관계 검증
   */
  private async validateForeignKeys(): Promise<void> {
    console.log('🔗 외래키 관계 검증...');
    
    // 전문가-사용자 관계 검증
    await (this as any).runValidation('전문가-사용자 관계', async () => {
      const orphanedExperts = await Expert.findAll({
        include: [{
          model: User,
          as: 'user',
          required: false
        }],
        where: {
          '$user.id$': null
        }
      } as any);
      
      if (orphanedExperts.length > 0) {
        throw new Error(`${orphanedExperts.length}개의 고아 전문가 레코드가 있습니다`);
      }
      return { validExperts: await Expert.count() };
    });

    // 전문가 프로필-전문가 관계 검증
    await (this as any).runValidation('전문가 프로필-전문가 관계', async () => {
      const orphanedProfiles = await ExpertProfile.findAll({
        include: [{
          model: Expert,
          as: 'expert',
          required: false
        }],
        where: {
          '$expert.id$': null
        }
      } as any);
      
      if (orphanedProfiles.length > 0) {
        throw new Error(`${orphanedProfiles.length}개의 고아 전문가 프로필이 있습니다`);
      }
      return { validProfiles: await ExpertProfile.count() };
    });

    // 상담-사용자 관계 검증
    await (this as any).runValidation('상담-사용자 관계', async () => {
      const orphanedConsultations = await Consultation.findAll({
        include: [{
          model: User,
          as: 'user',
          required: false
        }],
        where: {
          '$user.id$': null
        }
      } as any);
      
      if (orphanedConsultations.length > 0) {
        throw new Error(`${orphanedConsultations.length}개의 고아 상담 레코드가 있습니다`);
      }
      return { validConsultations: await Consultation.count() };
    });

    // 상담-전문가 관계 검증
    await (this as any).runValidation('상담-전문가 관계', async () => {
      const orphanedConsultations = await Consultation.findAll({
        include: [{
          model: Expert,
          as: 'expert',
          required: false
        }],
        where: {
          '$expert.id$': null
        }
      } as any);
      
      if (orphanedConsultations.length > 0) {
        throw new Error(`${orphanedConsultations.length}개의 고아 상담 레코드가 있습니다`);
      }
      return { validConsultations: await Consultation.count() };
    });
  }

  /**
   * 데이터 일관성 검증
   */
  private async validateDataConsistency(): Promise<void> {
    console.log('🔄 데이터 일관성 검증...');
    
    // 전문가 프로필과 전문가 데이터 일관성
    await (this as any).runValidation('전문가 프로필-전문가 일관성', async () => {
      const experts = await Expert.findAll();
      const profiles = await ExpertProfile.findAll();
      
      const expertIds = new Set(experts.map(e => e.id));
      const profileExpertIds = new Set(profiles.map(p => p.expertId));
      
      const missingProfiles = [...expertIds].filter(id => !profileExpertIds.has(id));
      const extraProfiles = [...profileExpertIds].filter(id => !expertIds.has(id));
      
      if (missingProfiles.length > 0) {
        throw new Error(`${missingProfiles.length}명의 전문가에게 프로필이 없습니다`);
      }
      
      if (extraProfiles.length > 0) {
        throw new Error(`${extraProfiles.length}개의 고아 전문가 프로필이 있습니다`);
      }
      
      return { 
        expertCount: experts.length, 
        profileCount: profiles.length 
      };
    });

    // 리뷰와 상담 관계 일관성
    await (this as any).runValidation('리뷰-상담 관계 일관성', async () => {
      const reviews = await Review.findAll({
        where: { isDeleted: false }
      });
      
      const consultationIds = new Set(
        (await Consultation.findAll({ attributes: ['id'] })).map(c => c.id)
      );
      
      const invalidReviews = reviews.filter(r => !consultationIds.has(r.consultationId));
      
      if (invalidReviews.length > 0) {
        throw new Error(`${invalidReviews.length}개의 유효하지 않은 상담 ID를 가진 리뷰가 있습니다`);
      }
      
      return { 
        validReviews: reviews.length - invalidReviews.length,
        invalidReviews: invalidReviews.length
      };
    });
  }

  /**
   * 비즈니스 로직 검증
   */
  private async validateBusinessLogic(): Promise<void> {
    console.log('💼 비즈니스 로직 검증...');
    
    // 평점 범위 검증
    await (this as any).runValidation('평점 범위 검증', async () => {
      const invalidRatings = await Review.findAll({
        where: {
          rating: {
            [Op.or]: [
              { [Op.lt]: 1 },
              { [Op.gt]: 5 }
            ]
          }
        }
      });
      
      if (invalidRatings.length > 0) {
        throw new Error(`${invalidRatings.length}개의 유효하지 않은 평점이 있습니다 (1-5 범위)`);
      }
      
      return { validRatings: await Review.count() };
    });

    // 상담 상태 검증
    await (this as any).runValidation('상담 상태 검증', async () => {
      const validStatuses = ['pending', 'scheduled', 'in_progress', 'completed', 'canceled'];
      const invalidStatuses = await Consultation.findAll({
        where: {
          status: {
            [Op.notIn]: validStatuses
          }
        }
      });
      
      if (invalidStatuses.length > 0) {
        throw new Error(`${invalidStatuses.length}개의 유효하지 않은 상담 상태가 있습니다`);
      }
      
      return { validConsultations: await Consultation.count() };
    });

    // 결제 금액 검증
    await (this as any).runValidation('결제 금액 검증', async () => {
      const invalidAmounts = await Payment.findAll({
        where: {
          amount: {
            [Op.lte]: 0
          }
        }
      });
      
      if (invalidAmounts.length > 0) {
        throw new Error(`${invalidAmounts.length}개의 유효하지 않은 결제 금액이 있습니다`);
      }
      
      return { validPayments: await Payment.count() };
    });
  }

  /**
   * 데이터 품질 검증
   */
  private async validateDataQuality(): Promise<void> {
    console.log('✨ 데이터 품질 검증...');
    
    // 필수 필드 검증
    await (this as any).runValidation('사용자 필수 필드 검증', async () => {
      const usersWithoutEmail: any = await User.count({
        where: {
          [Op.or]: [
            { email: null },
            { email: '' }
          ]
        }
      } as any);
      
      if ((usersWithoutEmail as any) > 0) {
        throw new Error(`${usersWithoutEmail}명의 사용자가 이메일이 없습니다`);
      }
      
      return { validUsers: await User.count() };
    });

    // 전문가 프로필 필수 필드 검증
    await (this as any).runValidation('전문가 프로필 필수 필드 검증', async () => {
      const profilesWithoutTitle: any = await ExpertProfile.count({
        where: {
          [Op.or]: [
            { title: null },
            { title: '' }
          ]
        }
      } as any);
      
      if ((profilesWithoutTitle as any) > 0) {
        throw new Error(`${profilesWithoutTitle}개의 전문가 프로필이 제목이 없습니다`);
      }
      
      return { validProfiles: await ExpertProfile.count() };
    });

    // 중복 데이터 검증
    await (this as any).runValidation('이메일 중복 검증', async () => {
      const duplicateEmails = await User.findAll({
        attributes: ['email'],
        group: ['email'],
        having: require('sequelize').fn('COUNT', '*'),
        order: [[require('sequelize').fn('COUNT', '*'), 'DESC']]
      });
      
      if (duplicateEmails.length > 0) {
        throw new Error(`${duplicateEmails.length}개의 중복된 이메일이 있습니다`);
      }
      
      return { uniqueEmails: await User.count() };
    });

    // 날짜 일관성 검증
    await (this as any).runValidation('날짜 일관성 검증', async () => {
      const invalidDates = await Consultation.findAll({
        where: {
          [Op.or]: [
            { createdAt: { [Op.gt]: new Date() } },
            { updatedAt: { [Op.lt]: require('sequelize').col('createdAt') } }
          ]
        }
      });
      
      if (invalidDates.length > 0) {
        throw new Error(`${invalidDates.length}개의 유효하지 않은 날짜가 있습니다`);
      }
      
      return { validConsultations: await Consultation.count() };
    });
  }

  /**
   * 개별 검증 실행
   */
  private async runValidation(testName: string, validationFn: () => Promise<any>): Promise<void> {
    try {
      const details = await validationFn();
      
      this.results.push({
        testName,
        success: true,
        message: '검증 통과',
        details
      });
      
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`  ❌ ${testName} - ${error}`);
    }
  }

  /**
   * 검증 결과 출력
   */
  private printResults(): void {
    console.log('\n📋 데이터 정합성 검증 결과:');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`총 검증: ${this.results.length}개`);
    console.log(`통과: ${successful}개`);
    console.log(`실패: ${failed}개`);
    
    if (failed > 0) {
      console.log('\n❌ 실패한 검증:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
    }
    
    console.log('\n✅ 통과한 검증:');
    this.results
      .filter(r => r.success)
      .forEach(r => console.log(`  - ${r.testName}`));
    
    console.log('\n🎉 데이터 정합성 검증 완료!');
  }
}

// 검증 실행
if (require.main === module) {
  const validator = new DataValidator();
  validator.runAllValidations().catch(console.error);
}

export default DataValidator;
