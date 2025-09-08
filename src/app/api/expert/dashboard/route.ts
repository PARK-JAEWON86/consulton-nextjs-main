import { NextRequest, NextResponse } from 'next/server';
import { Expert, User, Consultation, Review, Payment } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
// import { getRequestsByExpert, getRequestStats } from '@/data/dummy/consultationRequests'; // 더미 데이터 제거
// import { expertDataService } from '@/services/ExpertDataService'; // 더미 데이터 제거
// import { getConsultationsByExpert } from '@/data/dummy/consultationHistory'; // 더미 데이터 제거

// 기간 타입 정의
type PeriodKey = "today" | "last7" | "last30" | "thisMonth" | "lastWeek";

interface ExpertDashboardData {
  profile: {
    id: number;
    name: string;
    specialty: string;
    level: number;
    pricePerMinute: number;
    totalSessions: number;
    avgRating: number;
    email?: string;
  };
  stats: {
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    completedRequests: number;
    rejectedRequests: number;
    urgentRequests: number;
    totalBudget: number;
    avgBudget: number;
    acceptanceRate: number;
  };
  consultations: {
    items: any[];
    revenue: {
      current: number;
      previous: number;
      change: number;
    };
    sessions: {
      current: number;
      previous: number;
      change: number;
    };
    avgOrder: {
      current: number;
      previous: number;
      change: number;
    };
  };
  requests: any[];
  todaySchedule: any[];
  recentActivities: any[];
  topTopics: Array<[string, { revenue: number; count: number }]>;
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const expertIdParam = searchParams.get('expertId');
    const period = (searchParams.get('period') || 'lastWeek') as PeriodKey;

    if (!expertIdParam) {
      return NextResponse.json(
        { error: 'expertId parameter is required' },
        { status: 400 }
      );
    }

    const expertId = parseInt(expertIdParam);
    if (isNaN(expertId)) {
      return NextResponse.json(
        { error: 'Invalid expertId' },
        { status: 400 }
      );
    }

    // 권한 확인 (본인 또는 관리자만 접근 가능)
    if (authUser.role !== 'admin') {
      const expert = await Expert.findOne({ where: { userId: authUser.id } });
      if (!expert || expert.id !== expertId) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 전문가 프로필 정보 조회
    const expert = await Expert.findByPk(expertId, {
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    // 상담 내역 조회
    const consultations = await Consultation.findAll({
      where: { expertId },
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 리뷰 조회
    const reviews = await Review.findAll({
      where: { expertId, isDeleted: false }
    });

    // 결제 내역 조회
    const payments = await Payment.findAll({
      where: { 
        consultationId: consultations.map(c => c.id),
        status: 'completed'
      }
    });
    
    // 기간별 수익 계산
    const { currentRevenue, previousRevenue, currentSessions, previousSessions } = calculatePeriodStats(
      consultations,
      payments,
      period
    );

    // 오늘 일정
    const today = new Date();
    const todaySchedule = consultations.filter(item => {
      const itemDate = new Date(item.scheduledTime || item.createdAt);
      return item.status === 'scheduled' && 
             itemDate.toDateString() === today.toDateString();
    }).slice(0, 3);

    // 최근 활동
    const recentActivities = consultations
      .filter(item => item.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
      .map(item => ({
        ts: new Date(item.updatedAt).getTime(),
        label: `상담 완료 · ${item.user?.name || '알 수 없음'} · ${item.title}`,
      }));

    // 주제별 성과 (카테고리별)
    const topicMap = new Map<string, { revenue: number; count: number }>();
    consultations.forEach((consultation) => {
      const key = consultation.categoryId?.toString() || "기타";
      const entry = topicMap.get(key) || { revenue: 0, count: 0 };
      const consultationPayment = payments.find(p => p.consultationId === consultation.id);
      entry.revenue += consultationPayment?.amount || 0;
      entry.count += 1;
      topicMap.set(key, entry);
    });
    const topTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 3);

    // 통계 계산
    const totalSessions = consultations.length;
    const completedSessions = consultations.filter(c => c.status === 'completed').length;
    const avgRating = reviews.length > 0 ? 
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const dashboardData: ExpertDashboardData = {
      profile: {
        id: expert.id,
        name: expert.user?.name || '알 수 없음',
        specialty: expert.specialty || '일반',
        level: 1, // 기본값 (실제로는 API에서 계산된 레벨 사용)
        pricePerMinute: expert.pricePerMinute || 0,
        totalSessions,
        avgRating: Math.round(avgRating * 100) / 100,
        email: expert.user?.email,
      },
      stats: {
        totalRequests: consultations.length,
        pendingRequests: consultations.filter(c => c.status === 'scheduled').length,
        acceptedRequests: consultations.filter(c => c.status === 'scheduled').length,
        completedRequests: completedSessions,
        rejectedRequests: consultations.filter(c => c.status === 'cancelled').length,
        urgentRequests: 0, // TODO: 긴급 요청 로직 구현
        totalBudget: totalRevenue,
        avgBudget: consultations.length > 0 ? Math.round(totalRevenue / consultations.length) : 0,
        acceptanceRate: consultations.length > 0 ? Math.round((completedSessions / consultations.length) * 100) : 0,
      },
      consultations: {
        items: consultations.slice(0, 10), // 최근 10개만
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          change: calculatePercentChange(currentRevenue, previousRevenue),
        },
        sessions: {
          current: currentSessions,
          previous: previousSessions,
          change: calculatePercentChange(currentSessions, previousSessions),
        },
        avgOrder: {
          current: currentSessions > 0 ? Math.round(currentRevenue / currentSessions) : 0,
          previous: previousSessions > 0 ? Math.round(previousRevenue / previousSessions) : 0,
          change: 0, // 계산됨
        },
      },
      requests: consultations.filter(c => c.status === 'scheduled').slice(0, 5),
      todaySchedule,
      recentActivities,
      topTopics,
    };

    // avgOrder change 계산
    dashboardData.consultations.avgOrder.change = calculatePercentChange(
      dashboardData.consultations.avgOrder.current,
      dashboardData.consultations.avgOrder.previous
    );

    return NextResponse.json({
      success: true,
      data: dashboardData,
      period,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Expert dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 기간별 통계 계산 헬퍼 함수
function calculatePeriodStats(consultations: any[], payments: any[], period: PeriodKey) {
  const now = new Date();
  const { start: currentStart, end: currentEnd } = getDateRange(period, now);
  
  const windowDays = Math.max(
    1,
    Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
  
  const prevStart = new Date(currentStart);
  const prevEnd = new Date(currentStart);
  prevStart.setDate(currentStart.getDate() - windowDays);
  prevEnd.setDate(currentStart.getDate() - 1);

  const currentPeriodItems = consultations.filter(item => 
    item.status === 'completed' && inDateRange(item.updatedAt, currentStart, currentEnd)
  );
  
  const previousPeriodItems = consultations.filter(item => 
    item.status === 'completed' && inDateRange(item.updatedAt, prevStart, prevEnd)
  );

  // 현재 기간 수익 계산
  const currentRevenue = currentPeriodItems.reduce((sum, item) => {
    const payment = payments.find(p => p.consultationId === item.id);
    return sum + (payment?.amount || 0);
  }, 0);

  // 이전 기간 수익 계산
  const previousRevenue = previousPeriodItems.reduce((sum, item) => {
    const payment = payments.find(p => p.consultationId === item.id);
    return sum + (payment?.amount || 0);
  }, 0);

  return {
    currentRevenue,
    previousRevenue,
    currentSessions: currentPeriodItems.length,
    previousSessions: previousPeriodItems.length,
  };
}

// 날짜 범위 계산
function getDateRange(period: PeriodKey, now: Date): { start: Date; end: Date } {
  switch (period) {
    case "today":
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: today, end: now };
    
    case "last7":
      const last7Start = new Date(now);
      last7Start.setDate(now.getDate() - 6);
      return { start: last7Start, end: now };
    
    case "last30":
      const last30Start = new Date(now);
      last30Start.setDate(now.getDate() - 29);
      return { start: last30Start, end: now };
    
    case "thisMonth":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: monthStart, end: monthEnd };
    
    case "lastWeek":
    default:
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - 1);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      return { start: weekStart, end: weekEnd };
  }
}

// 날짜 범위 체크
function inDateRange(dateString: string | Date, start: Date, end: Date): boolean {
  const date = new Date(dateString);
  return date >= start && date <= end;
}

// 퍼센트 변화 계산
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
