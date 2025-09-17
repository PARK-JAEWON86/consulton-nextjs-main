/**
 * 공식 랭킹 점수 계산 유틸리티
 * expert-levels/route.ts의 공식 계산 로직을 공통으로 사용
 */

export interface ExpertStats {
  totalSessions?: number;
  avgRating?: number;
  reviewCount?: number;
  repeatClients?: number;
  likeCount?: number;
}

/**
 * 개선된 랭킹 점수 계산 함수 (2자리 점수 체계, 0-100점)
 * @param stats 전문가 통계 데이터
 * @returns 계산된 랭킹 점수 (0-100점)
 */
export const calculateRankingScore = (stats: ExpertStats): number => {
  // 1. 상담 횟수 (25% 가중치) - 경험 중시하되 비율 낮춤
  const sessionScore = Math.min((stats.totalSessions || 0) / 200, 1) * 25; // 200회당 25점

  // 2. 평점 (35% 가중치) - 서비스 품질 가장 중요
  const ratingScore = ((stats.avgRating || 0) / 5) * 35; // 5점 만점에서 35점

  // 3. 리뷰 수 (15% 가중치) - 신뢰도 지표
  const reviewScore = Math.min((stats.reviewCount || 0) / 100, 1) * 15; // 100개당 15점

  // 4. 재방문 고객 비율 (20% 가중치) - 만족도 핵심 지표
  const totalSessions = stats.totalSessions || 0;
  const repeatRate = totalSessions > 0 ? (stats.repeatClients || 0) / totalSessions : 0;
  const repeatScore = repeatRate * 20; // 100% 재방문시 20점

  // 5. 좋아요 수 (5% 가중치) - 보조 지표
  const likeScore = Math.min((stats.likeCount || 0) / 200, 1) * 5; // 200개당 5점

  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
  return Math.round(totalScore * 100) / 100;
};

/**
 * 랭킹 점수 상세 분석 (디버깅용)
 * @param stats 전문가 통계 데이터
 * @returns 점수 분석 결과
 */
export const getRankingScoreBreakdown = (stats: ExpertStats) => {
  const sessionScore = Math.min((stats.totalSessions || 0) / 200, 1) * 25;
  const ratingScore = ((stats.avgRating || 0) / 5) * 35;
  const reviewScore = Math.min((stats.reviewCount || 0) / 100, 1) * 15;
  const totalSessions = stats.totalSessions || 0;
  const repeatRate = totalSessions > 0 ? (stats.repeatClients || 0) / totalSessions : 0;
  const repeatScore = repeatRate * 20;
  const likeScore = Math.min((stats.likeCount || 0) / 200, 1) * 5;

  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;

  return {
    sessionScore: Math.round(sessionScore * 100) / 100,
    ratingScore: Math.round(ratingScore * 100) / 100,
    reviewScore: Math.round(reviewScore * 100) / 100,
    repeatScore: Math.round(repeatScore * 100) / 100,
    likeScore: Math.round(likeScore * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      sessions: `${stats.totalSessions || 0}회 → ${Math.round(sessionScore * 100) / 100}점 (25%)`,
      rating: `${stats.avgRating || 0}점 → ${Math.round(ratingScore * 100) / 100}점 (35%)`,
      reviews: `${stats.reviewCount || 0}개 → ${Math.round(reviewScore * 100) / 100}점 (15%)`,
      repeat: `${Math.round(repeatRate * 100)}% → ${Math.round(repeatScore * 100) / 100}점 (20%)`,
      likes: `${stats.likeCount || 0}개 → ${Math.round(likeScore * 100) / 100}점 (5%)`
    }
  };
};
