import { NextResponse } from 'next/server';
import { Category, Consultation, Review } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

// POST: 테스트용 카테고리 데이터 초기화
export async function POST() {
  try {
    await initializeDatabase();

    console.log('카테고리 초기화 시작...');

    // 기존 카테고리 확인
    const existingCategories = await Category.findAll();
    console.log(`기존 카테고리 수: ${existingCategories.length}`);

    if (existingCategories.length > 0) {
      return NextResponse.json({
        success: true,
        message: '카테고리가 이미 존재합니다.',
        data: {
          existing: existingCategories.length,
          categories: existingCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            isActive: cat.isActive
          }))
        }
      });
    }

    // 샘플 카테고리 데이터
    const sampleCategories = [
      {
        name: '진로상담',
        description: '직업 선택과 경력 개발에 대한 전문적인 조언을 제공합니다',
        icon: 'Briefcase',
        isActive: true,
        sortOrder: 1,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '심리상담',
        description: '마음의 건강과 심리적 문제 해결을 위한 상담을 제공합니다',
        icon: 'Brain',
        isActive: true,
        sortOrder: 2,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '재정상담',
        description: '개인 재정 관리와 투자에 대한 전문적인 조언을 제공합니다',
        icon: 'DollarSign',
        isActive: true,
        sortOrder: 3,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '법률상담',
        description: '법적 문제와 권리 보호에 대한 전문가 조언을 제공합니다',
        icon: 'Scale',
        isActive: true,
        sortOrder: 4,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '학습상담',
        description: '효과적인 학습 방법과 교육 계획에 대한 상담을 제공합니다',
        icon: 'BookOpen',
        isActive: true,
        sortOrder: 5,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '건강상담',
        description: '건강 관리와 웰빙 라이프스타일에 대한 조언을 제공합니다',
        icon: 'Heart',
        isActive: true,
        sortOrder: 6,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '인간관계상담',
        description: '대인관계 개선과 소통 능력 향상을 위한 상담을 제공합니다',
        icon: 'Users',
        isActive: true,
        sortOrder: 7,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: 'IT상담',
        description: '기술 분야 진로와 개발 역량 향상에 대한 조언을 제공합니다',
        icon: 'Code',
        isActive: true,
        sortOrder: 8,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '창작상담',
        description: '예술 활동과 창작 과정에 대한 전문적인 조언을 제공합니다',
        icon: 'Palette',
        isActive: true,
        sortOrder: 9,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      },
      {
        name: '언어상담',
        description: '외국어 학습과 언어 능력 향상에 대한 상담을 제공합니다',
        icon: 'Languages',
        isActive: true,
        sortOrder: 10,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      }
    ];

    // 카테고리 생성
    const createdCategories = await Category.bulkCreate(sampleCategories);
    console.log(`새로 생성된 카테고리 수: ${createdCategories.length}`);

    // 인기도를 위한 샘플 데이터 생성 (상담과 리뷰)
    const sampleConsultations = [];
    const sampleReviews = [];

    for (let i = 0; i < createdCategories.length; i++) {
      const category = createdCategories[i];
      const consultationCount = Math.floor(Math.random() * 50) + 10; // 10-60개 상담

      for (let j = 0; j < consultationCount; j++) {
        const consultation = {
          categoryId: category.id,
          userId: Math.floor(Math.random() * 100) + 1, // 임시 userId
          expertId: Math.floor(Math.random() * 20) + 1, // 임시 expertId
          title: `${category.name} 샘플 상담 ${j + 1}`,
          description: `${category.name} 관련 상담입니다.`,
          status: Math.random() > 0.3 ? 'completed' : 'scheduled',
          price: 75000,
          duration: 60,
          scheduledTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 지난 30일 내
          sessionCount: 1,
          consultationType: 'video',
          urgencyLevel: 'medium',
          isPublic: true
        };
        sampleConsultations.push(consultation);

        // 완료된 상담에는 리뷰 추가 (70% 확률)
        if (consultation.status === 'completed' && Math.random() > 0.3) {
          sampleReviews.push({
            consultationId: 0, // 나중에 실제 ID로 교체
            userId: consultation.userId,
            expertId: consultation.expertId,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5점
            title: `${category.name} 상담 후기`,
            content: `${category.name} 상담을 받고 많은 도움이 되었습니다.`,
            isAnonymous: Math.random() > 0.5,
            isVerified: true,
            helpfulCount: Math.floor(Math.random() * 10),
            reportCount: 0,
            isPublic: true,
            isDeleted: false
          });
        }
      }
    }

    console.log(`생성할 상담 수: ${sampleConsultations.length}`);
    console.log(`생성할 리뷰 수: ${sampleReviews.length}`);

    // 실제 데이터 생성은 스킵하고 카테고리만 반환
    // (실제 상담과 리뷰는 다른 테이블과의 관계로 인해 복잡할 수 있음)

    return NextResponse.json({
      success: true,
      message: '카테고리 초기화가 완료되었습니다.',
      data: {
        categoriesCreated: createdCategories.length,
        categories: createdCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          isActive: cat.isActive,
          sortOrder: cat.sortOrder
        })),
        sampleDataPrepared: {
          consultations: sampleConsultations.length,
          reviews: sampleReviews.length
        }
      }
    });

  } catch (error) {
    console.error('카테고리 초기화 실패:', error);
    return NextResponse.json(
      {
        success: false,
        message: '카테고리 초기화에 실패했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET: 초기화 상태 확인
export async function GET() {
  try {
    await initializeDatabase();

    const categoryCount = await Category.count();
    const categories = await Category.findAll({
      limit: 10,
      order: [['sortOrder', 'ASC']]
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCategories: categoryCount,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          isActive: cat.isActive,
          consultationCount: cat.consultationCount,
          expertCount: cat.expertCount
        }))
      }
    });

  } catch (error) {
    console.error('카테고리 상태 확인 실패:', error);
    return NextResponse.json(
      {
        success: false,
        message: '카테고리 상태 확인에 실패했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}