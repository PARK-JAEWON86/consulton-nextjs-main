import { NextRequest, NextResponse } from 'next/server';
import { Expert, ExpertProfile as ExpertProfileModel, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 간단 전문가 API 호출됨');
    await initializeDatabase();

    // 기본 전문가 정보만 조회 (오류 없이)
    const experts = await Expert.findAll({
      limit: 10,
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'email', 'name'] // avatar 제외
        }
      ]
    });

    console.log(`✅ ${experts.length}명의 전문가 조회 완료`);

    const formattedExperts = experts.map(expert => ({
      id: expert.id.toString(),
      fullName: expert.user?.name || '이름 없음',
      specialty: expert.specialty,
      hourlyRate: expert.pricePerMinute ? expert.pricePerMinute * 60 : 3000,
      totalSessions: expert.totalSessions || 0,
      rating: expert.avgRating || expert.rating || 0,
      reviewCount: expert.reviewCount || 0,
      location: expert.location || '서울특별시',
      responseTime: expert.responseTime || '1시간 이내',
      languages: ['한국어'],
      consultationTypes: ['video', 'chat'],
      bio: '전문적인 상담을 제공합니다.',
      keywords: [expert.specialty],
      level: expert.level || 1,
      isOnline: true,
      isProfileComplete: true
    }));

    return NextResponse.json({
      success: true,
      data: {
        profiles: formattedExperts,
        total: formattedExperts.length
      }
    });

  } catch (error) {
    console.error('❌ 간단 전문가 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}