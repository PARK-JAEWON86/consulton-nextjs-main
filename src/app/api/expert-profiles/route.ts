import { NextRequest, NextResponse } from 'next/server';
import { Expert, ExpertProfile as ExpertProfileModel, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
import { Op } from 'sequelize';
import { 
  searchExpertProfiles, 
  calculatePagination,
  logQueryPerformance 
} from '@/lib/db/queryOptimizations';
// import { dummyExperts, convertExpertItemToProfile } from '@/data/dummy/experts'; // 더미 데이터 제거

interface ExpertProfile {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string;
  specialty: string;
  experienceYears: number;
  bio: string;
  keywords: string[];
  consultationTypes: string[];
  availability: Record<string, { available: boolean; hours: string }>;
  certifications: Array<{ name: string; issuer: string }>;
  profileImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // 추가 필드들
  rating?: number;
  reviewCount?: number;
  totalSessions?: number;
  repeatClients?: number;
  responseTime?: string;
  languages?: string[];
  location?: string;
  timeZone?: string;
}

// 더미 데이터 관련 코드 제거 - 실제 데이터베이스 사용

// GET: 전문가 프로필 조회
export async function GET(request: NextRequest) {
  try {
    console.log('Expert-profiles API 호출됨:', request.url);
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const query = searchParams.get('query');
    const specialty = searchParams.get('specialty');
    const currentExpert = searchParams.get('currentExpert') === 'true';

    // 특정 ID로 조회
    if (id) {
      const expert = await Expert.findByPk(parseInt(id), {
        include: [
          {
            model: ExpertProfileModel,
            as: 'profile',
            required: false
          },
          {
            model: User,
            as: 'user',
            required: false
          }
        ]
      });

      if (!expert) {
        return NextResponse.json(
          { success: false, message: '전문가를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const profileData = {
        id: expert.id.toString(),
        email: expert.user?.email || '',
        fullName: expert.profile?.fullName || expert.user?.name || '',
        jobTitle: expert.profile?.jobTitle || expert.specialty,
        specialty: expert.specialty,
        experienceYears: expert.experience,
        bio: expert.profile?.bio || '',
        keywords: expert.profile?.specialties ? JSON.parse(expert.profile.specialties) : [],
        consultationTypes: expert.consultationTypes ? JSON.parse(expert.consultationTypes) : [],
        availability: {}, // TODO: ExpertAvailability 테이블과 연동
        certifications: expert.profile?.certifications ? JSON.parse(expert.profile.certifications) : [],
        profileImage: expert.profile?.profileImage,
        status: 'approved', // TODO: 상태 관리 로직 추가
        createdAt: expert.createdAt.toISOString(),
        updatedAt: expert.updatedAt.toISOString(),
        rating: expert.rating,
        reviewCount: expert.reviewCount,
        totalSessions: expert.totalSessions,
        repeatClients: expert.profile?.repeatClients || 0,
        responseTime: expert.responseTime,
        languages: expert.languages ? JSON.parse(expert.languages) : ['한국어'],
        location: expert.location,
        timeZone: expert.timeZone
      };

      return NextResponse.json({
        success: true,
        data: {
          profiles: [profileData],
          total: 1
        }
      });
    }

    // 현재 로그인한 전문가 프로필 조회 (임시로 비활성화)
    if (currentExpert) {
      console.log('현재 전문가 조회 요청 - 임시로 빈 응답 반환');
      return NextResponse.json({
        success: true,
        data: {
          profiles: [],
          total: 0
        }
      });
      // const authUser = await getAuthenticatedUser(request);
      // if (!authUser || authUser.role !== 'expert') {
      //   return NextResponse.json(
      //     { success: false, message: '전문가 권한이 필요합니다.' },
      //     { status: 403 }
      //   );
      // }

      // 임시로 빈 응답 반환 (인증 관련 코드 수정 필요)
      return NextResponse.json({
        success: true,
        data: {
          profiles: [],
          total: 0
        }
      });
    }
    
    // 기본 전문가 목록 조회
    console.log('전체 전문가 목록 조회 시작...');

    const startTime = performance.now();

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 검색 및 필터링 조건
    const where: any = {};

    if (query) {
      where[Op.or] = [
        { specialty: { [Op.like]: `%${query}%` } },
        { '$user.name$': { [Op.like]: `%${query}%` } },
        { '$profile.bio$': { [Op.like]: `%${query}%` } }
      ];
    }

    if (specialty) {
      where.specialty = specialty;
    }

    // 전문가 목록 조회 (간단한 방식으로 변경)
    const experts = await Expert.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'email', 'name']
        }
      ],
      order: [
        ['avgRating', 'DESC'],
        ['id', 'ASC']
      ],
      limit,
      offset
    });

    const result = {
      count: experts.length,
      rows: experts
    };

    console.log(`전문가 조회 완료: ${result.count}명 (${result.rows.length}명 반환)`);

    // 결과 변환 (간단하게)
    const profiles: ExpertProfile[] = result.rows.map(expert => ({
      id: expert.id.toString(),
      email: expert.user?.email || '',
      fullName: expert.user?.name || '이름 없음',
      jobTitle: expert.specialty + ' 전문가',
      specialty: expert.specialty,
      experienceYears: expert.experience || 0,
      bio: expert.specialty + ' 분야의 전문 상담을 제공합니다.',
      keywords: [expert.specialty],
      consultationTypes: ['video', 'chat'],
      availability: {},
      certifications: [],
      profileImage: undefined,
      status: 'approved' as const,
      createdAt: expert.createdAt.toISOString(),
      updatedAt: expert.updatedAt.toISOString(),
      rating: expert.avgRating || expert.rating || 4.5,
      reviewCount: expert.reviewCount || 0,
      totalSessions: expert.totalSessions || 0,
      repeatClients: 0,
      responseTime: expert.responseTime || '1시간 이내',
      languages: ['한국어'],
      location: expert.location || '서울특별시',
      timeZone: expert.timeZone || 'Asia/Seoul',
      hourlyRate: expert.pricePerMinute ? expert.pricePerMinute * 60 : 3000
    }));

    const endTime = performance.now();
    const queryTime = Math.round((endTime - startTime) * 100) / 100;

    console.log(`전문가 프로필 조회 완료: ${profiles.length}명, 처리시간: ${queryTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        profiles,
        total: result.count,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(result.count / limit),
          hasNext: page * limit < result.count,
          hasPrev: page > 1
        },
        processingTime: `${queryTime}ms`
      }
    });
    
  } catch (error) {
    console.error('전문가 프로필 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '전문가 프로필 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
