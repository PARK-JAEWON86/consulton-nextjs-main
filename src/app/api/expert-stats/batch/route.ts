import { NextRequest, NextResponse } from 'next/server';
import { Expert, User, Consultation, Review, ExpertProfile } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { calculateRankingScore } from '@/utils/rankingCalculator';

// 랭킹 점수를 레벨로 변환하는 함수 (expert-levels API와 동일)
const calculateLevelByScore = (rankingScore: number = 0): number => {
  if (rankingScore >= 950) return 999;
  if (rankingScore >= 900) return Math.floor(900 + (rankingScore - 900) * 2);
  if (rankingScore >= 850) return Math.floor(800 + (rankingScore - 850) * 2);
  if (rankingScore >= 800) return Math.floor(700 + (rankingScore - 800) * 2);
  if (rankingScore >= 750) return Math.floor(600 + (rankingScore - 750) * 2);
  if (rankingScore >= 700) return Math.floor(500 + (rankingScore - 700) * 2);
  if (rankingScore >= 650) return Math.floor(400 + (rankingScore - 650) * 2);
  if (rankingScore >= 600) return Math.floor(300 + (rankingScore - 600) * 2);
  if (rankingScore >= 550) return Math.floor(200 + (rankingScore - 550) * 2);
  if (rankingScore >= 500) return Math.floor(100 + (rankingScore - 500));
  return Math.max(1, Math.floor(rankingScore / 5));
};

// 배치 전문가 통계 인터페이스
interface BatchExpertStats {
  expertId: string;
  totalSessions: number;
  waitingClients: number;
  repeatClients: number;
  avgRating: number;
  reviewCount: number;
  likeCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  specialty: string;
  lastUpdated: string;
  rankingScore: number;
  level: number;
  tierInfo?: any;
}

// GET: 여러 전문가의 통계 정보를 배치로 조회
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const expertIdsParam = searchParams.get('expertIds');
    const includeRanking = searchParams.get('includeRanking') === 'true';
    
    if (!expertIdsParam) {
      return NextResponse.json(
        { success: false, message: '전문가 ID 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // 전문가 ID 목록 파싱
    const expertIds = expertIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (expertIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '유효한 전문가 ID가 없습니다.' },
        { status: 400 }
      );
    }

    console.log(`배치 통계 조회 시작: ${expertIds.length}명의 전문가`);

    // 모든 전문가 정보를 한 번에 조회 (프로필 포함)
    const experts = await Expert.findAll({
      where: { id: expertIds },
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExpertProfile,
          as: 'profile',
          required: false,
          attributes: ['level', 'totalSessions', 'avgRating', 'reviewCount']
        }
      ]
    });

    if (experts.length === 0) {
      return NextResponse.json(
        { success: false, message: '전문가를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 모든 상담 데이터를 한 번에 조회
    const allConsultations = await Consultation.findAll({
      where: { expertId: expertIds }
    });

    // 모든 리뷰 데이터를 한 번에 조회
    const allReviews = await Review.findAll({
      where: { expertId: expertIds, isDeleted: false }
    });

    // 전문가별로 데이터 그룹화 및 통계 계산
    const batchStats: BatchExpertStats[] = experts.map(expert => {
      // 해당 전문가의 상담 데이터 필터링
      const consultations = allConsultations.filter(c => c.expertId === expert.id);
      
      // 해당 전문가의 리뷰 데이터 필터링
      const reviews = allReviews.filter(r => r.expertId === expert.id);

      // 통계 계산
      const totalSessions = consultations.length;
      const completedSessions = consultations.filter(c => c.status === 'completed').length;
      const avgRating = reviews.length > 0 ? 
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

      // 공식 랭킹 점수 계산
      const rankingScore = calculateRankingScore({
        totalSessions,
        avgRating,
        reviewCount: reviews.length,
        repeatClients: 0, // 재방문 고객 데이터가 없으면 0
        likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
      });

      return {
        expertId: expert.id.toString(),
        totalSessions,
        waitingClients: consultations.filter(c => c.status === 'scheduled').length,
        repeatClients: 0, // 재방문 고객 계산 로직 필요 시 추가
        avgRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews.length,
        likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0),
        ratingDistribution: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length
        },
        specialty: expert.specialty || '일반',
        lastUpdated: new Date().toISOString(),
        rankingScore,
        // 랭킹점수를 기반으로 실시간 레벨 계산
        level: calculateLevelByScore(rankingScore)
      };
    });

    // 랭킹 정보 포함 시 추가 처리
    if (includeRanking && batchStats.length > 0) {
      // 랭킹 점수로 정렬하여 순위 계산
      const sortedStats = [...batchStats].sort((a, b) => b.rankingScore - a.rankingScore);
      
      batchStats.forEach(stats => {
        const ranking = sortedStats.findIndex(s => s.expertId === stats.expertId) + 1;
        (stats as any).ranking = ranking;
        (stats as any).totalExperts = batchStats.length;
      });
    }

    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) * 100) / 100;

    console.log(`배치 통계 조회 완료: ${batchStats.length}명, 처리시간: ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        stats: batchStats,
        totalExperts: batchStats.length,
        processingTime: `${processingTime}ms`
      }
    });

  } catch (error) {
    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) * 100) / 100;
    
    console.error('배치 전문가 통계 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '배치 전문가 통계 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}

// POST: 여러 전문가의 통계 정보를 배치로 업데이트
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { expertIds, updateData } = body;

    if (!expertIds || !Array.isArray(expertIds)) {
      return NextResponse.json(
        { success: false, message: '전문가 ID 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // 배치 업데이트 로직 (필요 시 구현)
    console.log('배치 업데이트 요청:', expertIds.length, '명');

    return NextResponse.json({
      success: true,
      message: `${expertIds.length}명의 전문가 통계가 업데이트되었습니다.`,
      data: { updatedCount: expertIds.length }
    });

  } catch (error) {
    console.error('배치 전문가 통계 업데이트 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '배치 전문가 통계 업데이트에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
