import { NextRequest, NextResponse } from 'next/server';
import { Expert, ExpertProfile as ExpertProfileModel, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
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
    
    // 기본 전문가 목록 조회 (임시로 빈 응답 반환)
    return NextResponse.json({
      success: true,
      data: {
        profiles: [],
        total: 0
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
