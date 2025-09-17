import { NextRequest, NextResponse } from 'next/server';
import { Expert, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    console.log('✅ Working experts API called');

    // 가장 간단한 형태로 전문가 조회
    const experts = await Expert.findAll({
      limit: 20,
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'email', 'name']
        }
      ]
    });

    console.log(`Found ${experts.length} experts`);

    // 간단한 형태로 변환
    const profiles = experts.map(expert => ({
      id: expert.id.toString(),
      email: expert.user?.email || 'expert@example.com',
      fullName: expert.user?.name || `${expert.specialty} 전문가`,
      jobTitle: expert.specialty + ' 전문가',
      specialty: expert.specialty,
      experienceYears: expert.experience || 0,
      bio: `${expert.specialty} 분야의 전문 상담을 제공합니다.`,
      keywords: [expert.specialty],
      consultationTypes: ['video', 'chat'],
      availability: {},
      certifications: [],
      profileImage: null,
      status: 'approved',
      createdAt: expert.createdAt.toISOString(),
      updatedAt: expert.updatedAt.toISOString(),
      rating: expert.avgRating || expert.rating || 4.5,
      reviewCount: expert.reviewCount || 0,
      totalSessions: expert.totalSessions || 0,
      repeatClients: 0,
      responseTime: expert.responseTime || '1시간 이내',
      languages: ['한국어'],
      location: expert.location || '서울특별시',
      timeZone: 'Asia/Seoul',
      hourlyRate: expert.pricePerMinute ? expert.pricePerMinute * 60 : 3000
    }));

    return NextResponse.json({
      success: true,
      data: {
        profiles: profiles,
        total: profiles.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Working experts API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}