/**
 * 데이터베이스 모델 사용 예제
 * 
 * 이 파일은 각 모델의 사용법을 보여주는 예제 코드입니다.
 * 실제 프로덕션 코드에서는 적절한 에러 처리와 검증을 추가하세요.
 */

import { 
  User, 
  Expert, 
  ExpertProfile, 
  ExpertAvailability,
  Category, 
  Consultation, 
  ConsultationSession,
  ConsultationSummary,
  Review, 
  Payment,
  AiUsage
} from './models';

// ===== 사용자 관련 예제 =====

/**
 * 사용자 생성 예제
 */
export async function createUserExample() {
  try {
    const user = await User.create({
      email: 'user@example.com',
      name: '홍길동',
      password: 'hashedPassword123!',
      role: 'client',
      isEmailVerified: true
    });
    
    console.log('사용자 생성 완료:', user.toJSON());
    return user;
  } catch (error) {
    console.error('사용자 생성 실패:', error);
    throw error;
  }
}

/**
 * 사용자 조회 예제 (AI 사용량 포함)
 */
export async function getUserWithAiUsageExample(userId: number) {
  try {
    const user = await User.findByPk(userId, {
      include: [{
        model: AiUsage,
        as: 'aiUsage'
      }]
    });
    
    console.log('사용자 정보:', user?.toJSON());
    return user;
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    throw error;
  }
}

// ===== 전문가 관련 예제 =====

/**
 * 전문가 생성 예제
 */
export async function createExpertExample(userId: number) {
  try {
    const expert = await Expert.create({
      userId: userId,
      specialty: '심리상담',
      experience: 5,
      rating: 4.8,
      reviewCount: 0,
      totalSessions: 0,
      avgRating: 0.0,
      completionRate: 0,
      responseTime: '30분 이내',
      isOnline: true,
      isProfileComplete: false,
      isProfilePublic: true,
      location: '서울특별시 강남구',
      timeZone: 'Asia/Seoul',
      languages: JSON.stringify(['한국어', '영어']),
      consultationTypes: JSON.stringify(['video', 'chat']),
      hourlyRate: 75000,
      level: 1,
      pricePerMinute: 1250,
      profileViews: 0,
      lastActiveAt: new Date(),
      joinedAt: new Date()
    });
    
    console.log('전문가 생성 완료:', expert.toJSON());
    return expert;
  } catch (error) {
    console.error('전문가 생성 실패:', error);
    throw error;
  }
}

/**
 * 전문가 프로필 생성 예제
 */
export async function createExpertProfileExample(expertId: number) {
  try {
    const profile = await ExpertProfile.create({
      expertId: expertId,
      fullName: '김심리',
      jobTitle: '임상심리사',
      bio: '8년간의 심리상담 경험을 바탕으로...',
      description: '스트레스 관리, 불안장애, 우울증 치료 전문',
      education: JSON.stringify(['서울대학교 심리학과 박사']),
      certifications: JSON.stringify(['임상심리사 1급', '상담심리사 1급']),
      specialties: JSON.stringify(['우울증', '불안장애', '대인관계']),
      specialtyAreas: JSON.stringify(['인지행동치료', '정신분석']),
      consultationStyle: '공감적이고 체계적인 접근',
      targetAudience: JSON.stringify(['성인', '청소년', '직장인']),
      successStories: 89,
      repeatClients: 67,
      averageSessionDuration: 50,
      nextAvailableSlot: '2024-01-22T14:00:00',
      cancellationPolicy: '24시간 전 취소 가능',
      reschedulePolicy: '12시간 전 일정 변경 가능',
      portfolioItems: JSON.stringify([
        {
          title: '우울증 극복 프로그램',
          description: '8주 단위 인지행동치료 프로그램',
          type: 'program'
        }
      ]),
      socialProof: JSON.stringify({
        linkedIn: 'https://linkedin.com/in/psychology-expert',
        website: 'https://mindcare.co.kr',
        publications: ['현대인의 마음 건강', '스트레스 없는 직장생활']
      }),
      pricingTiers: JSON.stringify([
        { duration: 30, price: 40000, description: '단회 상담' },
        { duration: 50, price: 65000, description: '정규 상담' },
        { duration: 80, price: 100000, description: '심층 상담' }
      ]),
      contactInfo: JSON.stringify({
        phone: '010-1234-5678',
        email: 'expert@example.com',
        location: '서울특별시 강남구',
        website: 'https://mindcare.co.kr'
      }),
      tags: JSON.stringify(['우울증', '불안장애', '대인관계', '자존감'])
    });
    
    console.log('전문가 프로필 생성 완료:', profile.toJSON());
    return profile;
  } catch (error) {
    console.error('전문가 프로필 생성 실패:', error);
    throw error;
  }
}

/**
 * 전문가 일정 설정 예제
 */
export async function setExpertAvailabilityExample(expertId: number) {
  try {
    const availabilityData = [
      { dayOfWeek: 'monday', availableHours: JSON.stringify(['09:00', '10:00', '14:00', '15:00']), isAvailable: true },
      { dayOfWeek: 'tuesday', availableHours: JSON.stringify(['09:00', '10:00', '11:00', '16:00']), isAvailable: true },
      { dayOfWeek: 'wednesday', availableHours: JSON.stringify(['14:00', '15:00', '16:00']), isAvailable: true },
      { dayOfWeek: 'thursday', availableHours: JSON.stringify(['09:00', '10:00', '14:00', '15:00']), isAvailable: true },
      { dayOfWeek: 'friday', availableHours: JSON.stringify(['09:00', '11:00', '14:00']), isAvailable: true },
      { dayOfWeek: 'saturday', availableHours: JSON.stringify([]), isAvailable: false },
      { dayOfWeek: 'sunday', availableHours: JSON.stringify([]), isAvailable: false }
    ];

    const availability = await ExpertAvailability.bulkCreate(
      availabilityData.map(data => ({
        ...data,
        expertId: expertId,
        timeZone: 'Asia/Seoul'
      }))
    );
    
    console.log('전문가 일정 설정 완료:', availability.length, '개 요일');
    return availability;
  } catch (error) {
    console.error('전문가 일정 설정 실패:', error);
    throw error;
  }
}

// ===== 카테고리 관련 예제 =====

/**
 * 카테고리 조회 예제
 */
export async function getCategoriesExample() {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    
    console.log('활성 카테고리 목록:', categories.map(c => c.name));
    return categories;
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    throw error;
  }
}

// ===== 상담 관련 예제 =====

/**
 * 상담 생성 예제
 */
export async function createConsultationExample(userId: number, expertId: number, categoryId: number) {
  try {
    const consultation = await Consultation.create({
      userId: userId,
      expertId: expertId,
      categoryId: categoryId,
      title: '스트레스 관리 상담',
      description: '직장에서 받는 스트레스를 효과적으로 관리하고 싶습니다.',
      consultationType: 'video',
      status: 'scheduled',
      scheduledTime: new Date('2024-01-22T14:00:00'),
      duration: 60,
      price: 75000,
      expertLevel: 300,
      topic: '스트레스 관리 및 불안감 치료'
    });
    
    console.log('상담 생성 완료:', consultation.toJSON());
    return consultation;
  } catch (error) {
    console.error('상담 생성 실패:', error);
    throw error;
  }
}

/**
 * 상담 세션 생성 예제
 */
export async function createConsultationSessionExample(consultationId: number) {
  try {
    const session = await ConsultationSession.create({
      consultationId: consultationId,
      sessionNumber: 1,
      startTime: new Date('2024-01-22T14:00:00'),
      endTime: new Date('2024-01-22T15:00:00'),
      duration: 60,
      status: 'completed',
      notes: '첫 번째 상담 세션 완료',
      transcript: '상담 내용 요약...',
      attachments: JSON.stringify([])
    });
    
    console.log('상담 세션 생성 완료:', session.toJSON());
    return session;
  } catch (error) {
    console.error('상담 세션 생성 실패:', error);
    throw error;
  }
}

/**
 * 상담 요약 생성 예제
 */
export async function createConsultationSummaryExample(consultationId: number) {
  try {
    const summary = await ConsultationSummary.create({
      consultationId: consultationId,
      summaryTitle: '스트레스 관리 상담 요약',
      summaryContent: '상담을 통해 스트레스의 원인을 파악하고 관리 방법을 제시했습니다.',
      keyPoints: JSON.stringify([
        '스트레스의 주요 원인 파악',
        '호흡법과 명상 기법 소개',
        '일상생활에서의 스트레스 관리법'
      ]),
      actionItems: JSON.stringify([
        '매일 10분 명상하기',
        '운동 루틴 만들기',
        '충분한 수면 취하기'
      ]),
      recommendations: JSON.stringify([
        '정기적인 상담 권장',
        '스트레스 관리 앱 활용',
        '가족과의 소통 시간 늘리기'
      ]),
      followUpPlan: '2주 후 후속 상담 예정',
      todoStatus: JSON.stringify({
        meditation: 'ongoing',
        exercise: 'pending',
        sleep: 'ongoing'
      }),
      isPublic: false
    });
    
    console.log('상담 요약 생성 완료:', summary.toJSON());
    return summary;
  } catch (error) {
    console.error('상담 요약 생성 실패:', error);
    throw error;
  }
}

// ===== 리뷰 관련 예제 =====

/**
 * 리뷰 생성 예제
 */
export async function createReviewExample(consultationId: number, userId: number, expertId: number) {
  try {
    const review = await Review.create({
      consultationId: consultationId,
      userId: userId,
      expertId: expertId,
      rating: 5,
      title: '정말 도움이 되었습니다',
      content: '전문가님의 조언이 정말 도움이 되었습니다. 스트레스 관리법을 잘 알려주셔서 감사합니다.',
      isAnonymous: false,
      isVerified: true,
      helpfulCount: 0,
      reportCount: 0,
      isPublic: true,
      isDeleted: false
    });
    
    console.log('리뷰 생성 완료:', review.toJSON());
    return review;
  } catch (error) {
    console.error('리뷰 생성 실패:', error);
    throw error;
  }
}

// ===== 결제 관련 예제 =====

/**
 * 결제 생성 예제
 */
export async function createPaymentExample(userId: number, consultationId: number) {
  try {
    const payment = await Payment.create({
      userId: userId,
      consultationId: consultationId,
      paymentType: 'consultation',
      amount: 75000,
      currency: 'KRW',
      status: 'completed',
      paymentMethod: 'card',
      paymentProvider: 'toss',
      transactionId: 'TXN_' + Date.now(),
      orderId: 'ORDER_' + Date.now(),
      description: '심리상담 결제',
      metadata: JSON.stringify({
        cardType: 'credit',
        cardBrand: 'VISA'
      }),
      processedAt: new Date()
    });
    
    console.log('결제 생성 완료:', payment.toJSON());
    return payment;
  } catch (error) {
    console.error('결제 생성 실패:', error);
    throw error;
  }
}

// ===== 복합 조회 예제 =====

/**
 * 전문가 상세 정보 조회 예제 (연관 데이터 포함)
 */
export async function getExpertWithDetailsExample(expertId: number) {
  try {
    const expert = await Expert.findByPk(expertId, {
      include: [
        {
          model: ExpertProfile,
          as: 'profile'
        },
        {
          model: ExpertAvailability,
          as: 'availability'
        },
        {
          model: Consultation,
          as: 'consultations',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    console.log('전문가 상세 정보:', expert?.toJSON());
    return expert;
  } catch (error) {
    console.error('전문가 상세 정보 조회 실패:', error);
    throw error;
  }
}

/**
 * 사용자 상담 이력 조회 예제
 */
export async function getUserConsultationHistoryExample(userId: number) {
  try {
    const consultations = await Consultation.findAll({
      where: { userId: userId },
      include: [
        {
          model: Expert,
          as: 'expert',
          include: [{
            model: ExpertProfile,
            as: 'profile'
          }]
        },
        {
          model: Category,
          as: 'category'
        },
        {
          model: Review,
          as: 'review'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('사용자 상담 이력:', consultations.length, '건');
    return consultations;
  } catch (error) {
    console.error('사용자 상담 이력 조회 실패:', error);
    throw error;
  }
}
