/**
 * 중앙 집중식 전문가 데이터 관리 서비스
 * 데이터베이스 기반으로 전문가 관련 데이터를 관리
 */

import { Expert, ExpertProfile, User } from '@/lib/db/models';
import { ExpertProfile as ExpertProfileType } from '@/types';
import { initializeDatabase } from '@/lib/db/init';

export class ExpertDataService {
  private static instance: ExpertDataService;

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): ExpertDataService {
    if (!ExpertDataService.instance) {
      ExpertDataService.instance = new ExpertDataService();
    }
    return ExpertDataService.instance;
  }

  /**
   * 데이터베이스 초기화
   */
  private async ensureDatabaseInitialized(): Promise<void> {
    await initializeDatabase();
  }

  /**
   * 모든 전문가 프로필 조회
   */
  public async getAllExpertProfiles(): Promise<ExpertProfileType[]> {
    await this.ensureDatabaseInitialized();
    
    try {
      const experts = await Expert.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExpertProfile,
            as: 'profile',
            required: false
          }
        ]
      });

      return experts.map(expert => this.convertExpertToProfile(expert));
    } catch (error) {
      console.error('전문가 프로필 조회 실패:', error);
      return [];
    }
  }

  /**
   * ID로 전문가 프로필 조회
   */
  public async getExpertProfileById(id: number): Promise<ExpertProfileType | null> {
    await this.ensureDatabaseInitialized();
    
    try {
      const expert = await Expert.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExpertProfile,
            as: 'profile',
            required: false
          }
        ]
      });

      if (!expert) return null;
      return this.convertExpertToProfile(expert);
    } catch (error) {
      console.error('전문가 프로필 조회 실패:', error);
      return null;
    }
  }

  /**
   * 전문가 프로필 업데이트
   */
  public async updateExpertProfile(id: number, updates: Partial<ExpertProfileType>): Promise<boolean> {
    await this.ensureDatabaseInitialized();
    
    try {
      const expert = await Expert.findByPk(id, {
        include: [
          {
            model: ExpertProfile,
            as: 'profile'
          }
        ]
      });

      if (!expert) return false;

      // Expert 테이블 업데이트
      const expertUpdates: any = {};
      if (updates.specialty) expertUpdates.specialty = updates.specialty;
      if (updates.experience !== undefined) expertUpdates.experience = updates.experience;
      if (updates.pricePerMinute !== undefined) expertUpdates.pricePerMinute = updates.pricePerMinute;
      if (updates.avgRating !== undefined) expertUpdates.avgRating = updates.avgRating;
      if (updates.totalSessions !== undefined) expertUpdates.totalSessions = updates.totalSessions;
      if (updates.profileViews !== undefined) expertUpdates.profileViews = updates.profileViews;
      if (updates.lastActiveAt !== undefined) expertUpdates.lastActiveAt = updates.lastActiveAt;
      if (updates.joinedAt !== undefined) expertUpdates.joinedAt = updates.joinedAt;
      if (updates.languages) expertUpdates.languages = JSON.stringify(updates.languages);
      
      if (Object.keys(expertUpdates).length > 0) {
        await expert.update(expertUpdates);
      }

      // ExpertProfile 테이블 업데이트
      if (expert.profile) {
        const profileUpdates: any = {};
        if (updates.description !== undefined) profileUpdates.description = updates.description;
        if (updates.tags) profileUpdates.tags = JSON.stringify(updates.tags);
        if (updates.certifications) profileUpdates.certifications = JSON.stringify(updates.certifications);
        if (updates.education) profileUpdates.education = JSON.stringify(updates.education);
        // languages는 Expert 모델에 있음
        if (updates.consultationStyle !== undefined) profileUpdates.consultationStyle = updates.consultationStyle;
        if (updates.successStories !== undefined) profileUpdates.successStories = updates.successStories;
        if (updates.nextAvailableSlot !== undefined) profileUpdates.nextAvailableSlot = updates.nextAvailableSlot;
        if (updates.reschedulePolicy !== undefined) profileUpdates.reschedulePolicy = updates.reschedulePolicy;
        
        if (Object.keys(profileUpdates).length > 0) {
          await expert.profile.update(profileUpdates);
        }
      } else {
        // ExpertProfile이 없으면 새로 생성
        await ExpertProfile.create({
          expertId: id,
          fullName: updates.name || '',
          jobTitle: updates.specialty || '',
          description: updates.description || '',
          tags: updates.tags ? JSON.stringify(updates.tags) : '[]',
          certifications: updates.certifications ? JSON.stringify(updates.certifications) : '[]',
          education: updates.education ? JSON.stringify(updates.education) : '[]',
          // languages는 Expert 모델에 있음
          consultationStyle: updates.consultationStyle || '',
          successStories: updates.successStories || 0,
          nextAvailableSlot: updates.nextAvailableSlot || '',
          reschedulePolicy: updates.reschedulePolicy || ''
        });
      }

      return true;
    } catch (error) {
      console.error('전문가 프로필 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 로그인용 전문가 계정 생성
   */
  public async getLoginAccounts(): Promise<Array<{
    id: number;
    email: string;
    password: string;
    name: string;
    specialty: string;
    level: string;
    description: string;
  }>> {
    await this.ensureDatabaseInitialized();
    
    try {
      const experts = await Expert.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExpertProfile,
            as: 'profile',
            required: false
          }
        ],
        limit: 10
      });

      const passwords = [
        "expert123!", "lawyer456!", "finance789!", "career2024!", "business555!",
        "health888!", "tech999!", "education777!", "design888!", "invest999!"
      ];

      const emailMap: { [key: string]: string } = {
        "박지영": "jiyoung.park",
        "이민수": "minsu.lee", 
        "이소연": "soyeon.lee",
        "김진우": "jinwoo.kim",
        "정수민": "sumin.jung",
        "박건호": "gunho.park",
        "김민정": "minjung.kim",
        "이상훈": "sanghun.lee",
        "정현아": "hyuna.jung",
        "최서연": "seoyeon.choi"
      };

      return experts.map((expert, index) => {
        const profile = this.convertExpertToProfile(expert);
        const level = profile.level || 1; // 공식 랭킹 점수 기반 레벨 사용
        const levelStr = level >= 700 ? `고급 (레벨 ${level})` :
                         level >= 500 ? `고급 (레벨 ${level})` :
                         level >= 300 ? `중급 (레벨 ${level})` :
                         level >= 200 ? `중급 (레벨 ${level})` :
                         `초급 (레벨 ${level})`;

        return {
          id: profile.id,
          email: expert.user?.email || `${emailMap[profile.name] || `expert${profile.id}`}@consulton.co.kr`,
          password: passwords[index] || "expert123!",
          name: profile.name,
          specialty: profile.specialty,
          level: levelStr,
          description: `${profile.description.substring(0, 40)}..., ${profile.experience}년 경력, ${profile.pricePerMinute}원/분`
        };
      });
    } catch (error) {
      console.error('로그인 계정 조회 실패:', error);
      return [];
    }
  }

  /**
   * 로그인 검증
   */
  public async validateLogin(email: string, password: string): Promise<{ id: number; email: string; name: string; specialty: string } | null> {
    const accounts = await this.getLoginAccounts();
    const account = accounts.find(acc => acc.email === email && acc.password === password);
    return account ? {
      id: account.id,
      email: account.email,
      name: account.name,
      specialty: account.specialty
    } : null;
  }

  // 레거시 레벨 계산 함수 제거됨 - 공식 랭킹 점수 기반 레벨 사용

  /**
   * 전문가의 완전한 사용자 정보 생성 (로그인용)
   */
  public async createUserFromExpert(expertId: number): Promise<any> {
    const profile = await this.getExpertProfileById(expertId);
    
    if (!profile) return null;

    const accounts = await this.getLoginAccounts();
    const account = accounts.find(acc => acc.id === expertId);

    return {
      id: `expert_${expertId}`,
      email: account?.email || `expert${expertId}@consulton.co.kr`,
      name: profile.name,
      credits: 0,
      expertLevel: profile.experience || 1,
      role: 'expert' as const,
      expertProfile: profile
    };
  }

  /**
   * DB Expert를 ExpertProfileType으로 변환
   */
  private convertExpertToProfile(expert: any): ExpertProfileType {
    const profile = expert.profile || {};
    
    return {
      id: expert.id,
      name: expert.user?.name || 'Unknown',
      specialty: expert.specialty || '',
      specialties: [expert.specialty || ''],
      specialtyAreas: [expert.specialty || ''],
      experience: expert.experience || 0,
      description: profile.description || '',
      pricePerMinute: expert.pricePerMinute || 0,
      hourlyRate: expert.pricePerMinute ? expert.pricePerMinute * 60 : 0,
      avgRating: expert.avgRating || 0,
      totalSessions: expert.totalSessions || 0,
      rating: expert.rating || 0,
      reviewCount: expert.reviewCount || 0,
      completionRate: expert.completionRate || 0,
      repeatClients: 0,
      averageSessionDuration: 60,
      responseTime: expert.responseTime || '2시간 내',
      cancellationPolicy: '',
      holidayPolicy: '',
      portfolioItems: [],
      contactInfo: {
        phone: '',
        email: expert.user?.email || '',
        location: '',
        website: ''
      },
      profileImage: '',
      portfolioFiles: [],
      tags: profile.tags ? JSON.parse(profile.tags) : [],
      certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
      education: profile.education ? JSON.parse(profile.education) : [],
      languages: expert.languages ? JSON.parse(expert.languages) : [],
      consultationTypes: [],
      consultationStyle: profile.consultationStyle || '',
      successStories: profile.successStories || 0,
      nextAvailableSlot: profile.nextAvailableSlot || '',
      profileViews: expert.profileViews || 0,
      lastActiveAt: expert.lastActiveAt || new Date(),
      joinedAt: expert.joinedAt || new Date(),
      reschedulePolicy: profile.reschedulePolicy || '',
      targetAudience: [],
      isOnline: true,
      isProfileComplete: expert.isProfileComplete || false,
      availability: {
        monday: { available: false, hours: "09:00-18:00" },
        tuesday: { available: false, hours: "09:00-18:00" },
        wednesday: { available: false, hours: "09:00-18:00" },
        thursday: { available: false, hours: "09:00-18:00" },
        friday: { available: false, hours: "09:00-18:00" },
        saturday: { available: false, hours: "09:00-18:00" },
        sunday: { available: false, hours: "09:00-18:00" }
      },
      weeklyAvailability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      location: expert.location || '',
      timeZone: expert.timeZone || 'Asia/Seoul',
      socialProof: {
        publications: []
      },
      pricingTiers: [
        {
          duration: 30,
          price: Math.floor((expert.pricePerMinute || 0) * 30),
          description: "30분 상담"
        },
        {
          duration: 60,
          price: Math.floor((expert.pricePerMinute || 0) * 60),
          description: "60분 상담"
        }
      ]
    };
  }

  /**
   * 디버깅용 로그인 계정 정보 출력
   */
  public async printLoginCredentials(): Promise<void> {
    const accounts = await this.getLoginAccounts();
    console.log('\n🔐 전문가 로그인 계정 정보 (DB 기반):');
    console.log('=' .repeat(80));
    
    accounts.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.name} (${account.specialty})`);
      console.log(`   📧 이메일: ${account.email}`);
      console.log(`   🔑 비밀번호: ${account.password}`);
      console.log(`   📊 레벨: ${account.level}`);
      console.log(`   📝 설명: ${account.description}`);
      console.log(`   🆔 Expert ID: ${account.id}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 사용법: 로그인 페이지에서 위 이메일/비밀번호로 로그인하세요!');
    console.log('🔗 이제 모든 데이터가 데이터베이스에서 관리됩니다!');
  }
}

// 싱글톤 인스턴스 생성
export const expertDataService = ExpertDataService.getInstance();

// 개발 환경에서 브라우저 콘솔에 등록
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).expertDataService = expertDataService;
  (window as any).printExpertCredentials = () => expertDataService.printLoginCredentials();
  
  // 페이지 로드 시 계정 정보 출력
  setTimeout(() => {
    expertDataService.printLoginCredentials();
  }, 1000);
}