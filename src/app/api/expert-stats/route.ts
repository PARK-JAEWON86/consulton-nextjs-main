import { NextRequest, NextResponse } from 'next/server';
import { Expert, User, Consultation, Review, ExpertProfile } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
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

// ExpertStats 인터페이스 정의
interface ExpertStats {
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
  // 랭킹 관련 필드
  ranking?: number;
  rankingScore?: number;
  totalExperts?: number;
  level?: number;
  tierInfo?: any;
  // 분야별 랭킹 필드
  specialtyRanking?: number;
  specialtyTotalExperts?: number;
}

// 공식 랭킹 점수 계산 함수는 utils/rankingCalculator.ts에서 import

// GET: 전문가 통계 정보 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const includeRanking = searchParams.get('includeRanking') === 'true';
    const rankingType = searchParams.get('rankingType'); // 'overall' 또는 'specialty'

    if (expertId) {
      // 특정 전문가 통계 조회
      const expert = await Expert.findByPk(parseInt(expertId), {
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

      if (!expert) {
        return NextResponse.json(
          { success: false, message: '전문가를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 해당 전문가의 상담 통계 조회
      const consultations = await Consultation.findAll({
        where: { expertId: parseInt(expertId) }
      });

      // 해당 전문가의 리뷰 통계 조회
      const reviews = await Review.findAll({
        where: { expertId: parseInt(expertId), isDeleted: false }
      });

      // 통계 계산
      const totalSessions = consultations.length;
      const completedSessions = consultations.filter(c => c.status === 'completed').length;
      const avgRating = reviews.length > 0 ? 
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
      
      // 평점 분포 계산
      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      // 공식 랭킹 점수 계산
      const rankingScore = calculateRankingScore({
        totalSessions,
        avgRating,
        reviewCount: reviews.length,
        repeatClients: 0, // 재방문 고객 데이터가 없으면 0
        likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
      });

      const stats: ExpertStats = {
        expertId: expert.id.toString(),
        totalSessions,
        waitingClients: consultations.filter(c => c.status === 'scheduled').length,
        repeatClients: 0, // TODO: 반복 클라이언트 계산 로직 구현
        avgRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews.length,
        likeCount: reviews.reduce((sum, review) => sum + review.helpfulCount, 0),
        ratingDistribution,
        specialty: expert.specialty || '일반',
        lastUpdated: new Date().toISOString(),
        rankingScore,
        // 랭킹점수를 기반으로 실시간 레벨 계산
        level: calculateLevelByScore(rankingScore)
      };

      // 랭킹 정보 포함 여부에 따라 응답 구성
      if (includeRanking) {
        // 전체 전문가와 비교하여 랭킹 계산
        const allExperts = await Expert.findAll();
        const allExpertStats = await Promise.all(
          allExperts.map(async (exp) => {
            const expConsultations = await Consultation.findAll({
              where: { expertId: exp.id }
            });
            const expReviews = await Review.findAll({
              where: { expertId: exp.id, isDeleted: false }
            });
            
            const expAvgRating = expReviews.length > 0 ? 
              expReviews.reduce((sum, review) => sum + review.rating, 0) / expReviews.length : 0;
            
            return {
              expertId: exp.id,
              score: calculateRankingScore({
                totalSessions: expConsultations.length,
                avgRating: expAvgRating,
                reviewCount: expReviews.length,
                repeatClients: 0, // 재방문 고객 데이터가 없으면 0
                likeCount: expReviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
              })
            };
          })
        );

        // 랭킹 계산
        allExpertStats.sort((a, b) => b.score - a.score);
        const ranking = allExpertStats.findIndex(exp => exp.expertId === parseInt(expertId)) + 1;
        
        stats.ranking = ranking;
        (stats as any).totalExperts = allExpertStats.length;
      }

      return NextResponse.json({
        success: true,
        data: stats
      });
    } else if (rankingType === 'overall') {
      // 전체 랭킹 조회
      const experts = await Expert.findAll({
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

      const allExpertStats = await Promise.all(
        experts.map(async (expert) => {
          const consultations = await Consultation.findAll({
            where: { expertId: expert.id }
          });
          const reviews = await Review.findAll({
            where: { expertId: expert.id, isDeleted: false }
          });

          const avgRating = reviews.length > 0 ? 
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

          const rankingScore = calculateRankingScore({
            totalSessions: consultations.length,
            avgRating,
            reviewCount: reviews.length,
            repeatClients: 0, // 재방문 고객 데이터가 없으면 0
            likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
          });

          return {
            expertId: expert.id.toString(),
            totalSessions: consultations.length,
            waitingClients: consultations.filter(c => c.status === 'scheduled').length,
            repeatClients: 0,
            avgRating: Math.round(avgRating * 100) / 100,
            reviewCount: reviews.length,
            likeCount: reviews.reduce((sum, review) => sum + review.helpfulCount, 0),
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
            // 프로필에서 레벨 가져오기
            level: (expert as any).profile?.level || 1
          };
        })
      );

      // 랭킹 점수로 정렬
      allExpertStats.sort((a, b) => b.rankingScore - a.rankingScore);
      allExpertStats.forEach((stats, index) => {
        (stats as any).ranking = index + 1;
        (stats as any).totalExperts = allExpertStats.length;
      });
      
      return NextResponse.json({
        success: true,
        data: {
          rankings: allExpertStats,
          total: allExpertStats.length
        }
      });
    } else if (rankingType === 'specialty') {
      // 분야별 랭킹 조회
      const specialty = searchParams.get('specialty');
      if (!specialty) {
        return NextResponse.json(
          { success: false, message: '분야 정보가 필요합니다.' },
          { status: 400 }
        );
      }
      
      const experts = await Expert.findAll({
        where: { specialty },
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

      const specialtyExpertStats = await Promise.all(
        experts.map(async (expert) => {
          const consultations = await Consultation.findAll({
            where: { expertId: expert.id }
          });
          const reviews = await Review.findAll({
            where: { expertId: expert.id, isDeleted: false }
          });

          const avgRating = reviews.length > 0 ? 
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

          const rankingScore = calculateRankingScore({
            totalSessions: consultations.length,
            avgRating,
            reviewCount: reviews.length,
            repeatClients: 0, // 재방문 고객 데이터가 없으면 0
            likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
          });

          return {
            expertId: expert.id.toString(),
            totalSessions: consultations.length,
            waitingClients: consultations.filter(c => c.status === 'scheduled').length,
            repeatClients: 0,
            avgRating: Math.round(avgRating * 100) / 100,
            reviewCount: reviews.length,
            likeCount: reviews.reduce((sum, review) => sum + review.helpfulCount, 0),
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
            // 프로필에서 레벨 가져오기
            level: (expert as any).profile?.level || 1
          };
        })
      );

      // 분야별 랭킹 점수로 정렬
      specialtyExpertStats.sort((a, b) => b.rankingScore - a.rankingScore);
      specialtyExpertStats.forEach((stats, index) => {
        (stats as any).specialtyRanking = index + 1;
        (stats as any).specialtyTotalExperts = specialtyExpertStats.length;
      });
      
      return NextResponse.json({
        success: true,
        data: {
          rankings: specialtyExpertStats,
          total: specialtyExpertStats.length,
          specialty: specialty
        }
      });
    } else {
      // 모든 전문가 통계 조회
      const experts = await Expert.findAll({
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

      const allExpertStats = await Promise.all(
        experts.map(async (expert) => {
          const consultations = await Consultation.findAll({
            where: { expertId: expert.id }
          });
          const reviews = await Review.findAll({
            where: { expertId: expert.id, isDeleted: false }
          });

          const avgRating = reviews.length > 0 ? 
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

          const rankingScore = calculateRankingScore({
            totalSessions: consultations.length,
            avgRating,
            reviewCount: reviews.length,
            repeatClients: 0, // 재방문 고객 데이터가 없으면 0
            likeCount: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
          });

          return {
            expertId: expert.id.toString(),
            totalSessions: consultations.length,
            waitingClients: consultations.filter(c => c.status === 'scheduled').length,
            repeatClients: 0,
            avgRating: Math.round(avgRating * 100) / 100,
            reviewCount: reviews.length,
            likeCount: reviews.reduce((sum, review) => sum + review.helpfulCount, 0),
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
            // 프로필에서 레벨 가져오기
            level: (expert as any).profile?.level || 1
          };
        })
      );

      // 랭킹 정보 포함 여부에 따라 정렬 및 랭킹 부여
      if (includeRanking) {
        allExpertStats.sort((a, b) => b.rankingScore - a.rankingScore);
        allExpertStats.forEach((stats, index) => {
          (stats as any).ranking = index + 1;
          (stats as any).totalExperts = allExpertStats.length;
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          stats: allExpertStats,
          total: allExpertStats.length
        }
      });
    }
  } catch (error) {
    console.error('전문가 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문가 통계 조회 실패' },
      { status: 500 }
    );
  }
}

// POST: 전문가 통계 업데이트
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 초기화 요청인 경우
    if (body.action === 'initializeStats') {
      return NextResponse.json({
        success: true,
        message: '전문가 통계는 실시간으로 계산됩니다.',
        count: 0
      });
    }
    
    // 전문가 통계는 실시간으로 계산되므로 수동 생성은 불필요
    return NextResponse.json({
      success: true,
      message: '전문가 통계는 상담과 리뷰 데이터를 기반으로 실시간으로 계산됩니다.'
    });
  } catch (error) {
    console.error('전문가 통계 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문가 통계 생성 실패' },
      { status: 500 }
    );
  }
}

// PATCH: 전문가 통계 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expertId } = body;

    // 전문가 존재 확인
    const expert = await Expert.findByPk(parseInt(expertId));
    if (!expert) {
      return NextResponse.json(
        { success: false, message: '전문가를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 전문가 통계는 실시간으로 계산되므로 수동 업데이트는 불필요
    return NextResponse.json({
      success: true,
      message: '전문가 통계는 상담과 리뷰 데이터를 기반으로 실시간으로 계산됩니다.',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('전문가 통계 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문가 통계 업데이트 실패' },
      { status: 500 }
    );
  }
}

// DELETE: 전문가 통계 삭제
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');

    if (!expertId) {
      return NextResponse.json(
        { success: false, message: '전문가 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전문가 통계는 실시간으로 계산되므로 삭제는 불필요
    return NextResponse.json({
      success: true,
      message: '전문가 통계는 실시간으로 계산되므로 삭제할 수 없습니다.'
    });
  } catch (error) {
    console.error('전문가 통계 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문가 통계 삭제 실패' },
      { status: 500 }
    );
  }
}
