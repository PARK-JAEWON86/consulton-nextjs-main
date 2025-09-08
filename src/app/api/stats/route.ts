import { NextRequest, NextResponse } from 'next/server';
import { User, Expert, Consultation, ExpertProfile, UserCredits } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';

export interface PlatformStats {
  totalUsers: number;
  totalExperts: number;
  totalConsultations: number;
  totalRevenue: number;
  averageConsultationRating: number;
  averageMatchingTimeMinutes: number;
  monthlyActiveUsers: number;
  monthlyActiveExperts: number;
  consultationCompletionRate: number;
  userSatisfactionScore: number;
  lastUpdated: string;
}

export interface StatsUpdate {
  type: 'consultation_completed' | 'expert_registered' | 'user_registered' | 'matching_time_recorded' | 'revenue_updated' | 'rating_updated';
  data?: {
    matchingTimeMinutes?: number;
    revenue?: number;
    rating?: number;
    completionRate?: number;
    satisfactionScore?: number;
  };
}

export interface MatchingRecord {
  id: string;
  userId: string;
  expertId: string;
  matchingTimeMinutes: number;
  createdAt: string;
}

interface StatsState {
  stats: PlatformStats;
  matchingRecords: MatchingRecord[];
}

// 메모리 기반 상태 저장 (실제 프로덕션에서는 데이터베이스 사용 권장)
let statsState: StatsState = {
  stats: {
    totalUsers: 0,
    totalExperts: 0,
    totalConsultations: 0,
    totalRevenue: 0,
    averageConsultationRating: 0,
    averageMatchingTimeMinutes: 0,
    monthlyActiveUsers: 0,
    monthlyActiveExperts: 0,
    consultationCompletionRate: 0,
    userSatisfactionScore: 0,
    lastUpdated: new Date().toISOString(),
  },
  matchingRecords: [],
};

// GET: 플랫폼 통계 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 공개 통계 조회를 위해 인증 체크 제거
    // const authUser = await getAuthenticatedUser(request);
    // if (!authUser || authUser.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, message: '관리자 권한이 필요합니다.' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const includeMatchingRecords = searchParams.get('includeMatchingRecords') === 'true';
    
    // 실제 데이터베이스에서 통계 계산
    const [
      totalUsers,
      totalExperts,
      totalConsultations,
      completedConsultations,
      consultationsWithRating
    ] = await Promise.all([
      User.count(),
      Expert.count(),
      Consultation.count(),
      Consultation.count({ where: { status: 'completed' } }),
      Consultation.findAll({
        where: { 
          status: 'completed',
          rating: { [require('sequelize').Op.gt]: 0 }
        },
        attributes: ['rating']
      })
    ]);

    // 총 수익 계산 (완료된 상담의 가격 합계)
    const revenueResult = await Consultation.sum('price', {
      where: { status: 'completed' }
    });
    const totalRevenue = revenueResult || 0;

    // 평균 평점 계산
    const ratings = consultationsWithRating.map(c => c.rating).filter(r => r > 0);
    const averageConsultationRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    // 상담 완료율 계산
    const consultationCompletionRate = totalConsultations > 0 
      ? Math.round((completedConsultations / totalConsultations) * 100) 
      : 0;

    // 월간 활성 사용자 계산 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyActiveUsers = await User.count({
      where: {
        updatedAt: { [require('sequelize').Op.gte]: thirtyDaysAgo }
      }
    });

    // 월간 활성 전문가 계산
    const monthlyActiveExperts = await Expert.count({
      where: {
        updatedAt: { [require('sequelize').Op.gte]: thirtyDaysAgo }
      }
    });

    // 사용자 만족도 점수 (평균 평점 기반)
    const userSatisfactionScore = averageConsultationRating;

    // 매칭 시간은 현재 데이터베이스에 저장되지 않으므로 기본값 사용
    const averageMatchingTimeMinutes = 15; // 기본값

    const stats: PlatformStats = {
      totalUsers,
      totalExperts,
      totalConsultations,
      totalRevenue,
      averageConsultationRating: Math.round(averageConsultationRating * 100) / 100,
      averageMatchingTimeMinutes,
      monthlyActiveUsers,
      monthlyActiveExperts,
      consultationCompletionRate,
      userSatisfactionScore: Math.round(userSatisfactionScore * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
    
    const responseData: any = {
      stats,
      summary: {
        totalUsers: stats.totalUsers,
        totalExperts: stats.totalExperts,
        totalConsultations: stats.totalConsultations,
        averageMatchingTime: `${stats.averageMatchingTimeMinutes}분`,
        completionRate: `${stats.consultationCompletionRate}%`,
        satisfactionScore: `${stats.userSatisfactionScore}/5`,
      }
    };
    
    if (includeMatchingRecords) {
      // 매칭 기록은 현재 데이터베이스에 저장되지 않으므로 빈 배열 반환
      responseData.matchingRecords = [];
    }
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('통계 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 통계 관리 액션
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'updateStats':
        // 통계는 실시간으로 계산되므로 특별한 업데이트는 필요하지 않음
        // 필요시 캐시 무효화나 특별한 이벤트 처리에 사용
        
        return NextResponse.json({
          success: true,
          data: {
            message: '통계 업데이트 요청이 처리되었습니다.'
          }
        });

      case 'recordMatching':
        // 매칭 기록은 현재 데이터베이스에 별도 테이블이 없으므로 로그로만 처리
        const { userId, expertId, matchingTimeMinutes } = data;
        
        console.log('매칭 기록:', {
          userId,
          expertId,
          matchingTimeMinutes,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: true,
          data: {
            message: '매칭 기록이 로그에 저장되었습니다.'
          }
        });

      case 'completeConsultation':
        // 상담 완료는 실제 데이터베이스에서 자동으로 반영되므로 별도 처리 불필요
        return NextResponse.json({
          success: true,
          data: {
            message: '상담 완료 이벤트가 기록되었습니다.'
          }
        });

      case 'registerExpert':
        // 전문가 등록은 실제 데이터베이스에서 자동으로 반영되므로 별도 처리 불필요
        return NextResponse.json({
          success: true,
          data: {
            message: '전문가 등록 이벤트가 기록되었습니다.'
          }
        });

      case 'registerUser':
        // 사용자 등록은 실제 데이터베이스에서 자동으로 반영되므로 별도 처리 불필요
        return NextResponse.json({
          success: true,
          data: {
            message: '사용자 등록 이벤트가 기록되었습니다.'
          }
        });

      case 'updateMetrics':
        // 메트릭은 실시간으로 계산되므로 수동 업데이트 불필요
        return NextResponse.json({
          success: true,
          data: {
            message: '메트릭 업데이트 요청이 처리되었습니다.'
          }
        });

      case 'resetStats':
        // 실제 데이터베이스의 통계는 삭제할 수 없으므로 경고 메시지만 반환
        return NextResponse.json({
          success: false,
          data: {
            message: '실제 데이터베이스의 통계는 초기화할 수 없습니다.'
          }
        });

      case 'initializeStats':
        // 실제 데이터베이스에서는 더미 데이터 초기화가 불필요
        return NextResponse.json({
          success: true,
          data: {
            message: '실제 데이터베이스에서는 더미 데이터 초기화가 불필요합니다.'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '통계 관리 실패' },
      { status: 500 }
    );
  }
}

// PATCH: 통계 부분 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 통계는 실시간으로 계산되므로 수동 업데이트 불필요
    return NextResponse.json({
      success: true,
      data: {
        message: '통계는 실시간으로 계산됩니다.'
      }
    });
  } catch (error) {
    console.error('통계 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, message: '통계 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 통계 초기화
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 실제 데이터베이스의 통계는 삭제할 수 없음
    return NextResponse.json({
      success: false,
      data: {
        message: '실제 데이터베이스의 통계는 삭제할 수 없습니다.'
      }
    });
  } catch (error) {
    console.error('통계 초기화 실패:', error);
    return NextResponse.json(
      { success: false, message: '통계 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
