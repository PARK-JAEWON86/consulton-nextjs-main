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
 * 공식 랭킹 점수 계산 함수 (3자리 점수 체계)
 * @param stats 전문가 통계 데이터
 * @returns 계산된 랭킹 점수 (0-1000점)
 */
export const calculateRankingScore = (stats: ExpertStats): number => {
  // 1. 상담 횟수 (40% 가중치) - 3자리 점수 체계에 맞게 조정
  const sessionScore = Math.min((stats.totalSessions || 0) / 100, 1) * 400; // 100회당 400점
  
  // 2. 평점 (30% 가중치) - 3자리 점수 체계에 맞게 조정
  const ratingScore = ((stats.avgRating || 0) / 5) * 300; // 5점 만점에서 300점
  
  // 3. 리뷰 수 (15% 가중치) - 3자리 점수 체계에 맞게 조정
  const reviewScore = Math.min((stats.reviewCount || 0) / 50, 1) * 150; // 50개당 150점
  
  // 4. 재방문 고객 비율 (10% 가중치) - 3자리 점수 체계에 맞게 조정
  const totalSessions = stats.totalSessions || 0;
  const repeatRate = totalSessions > 0 ? (stats.repeatClients || 0) / totalSessions : 0;
  const repeatScore = repeatRate * 100; // 100% 재방문시 100점
  
  // 5. 좋아요 수 (5% 가중치) - 3자리 점수 체계에 맞게 조정
  const likeScore = Math.min((stats.likeCount || 0) / 100, 1) * 50; // 100개당 50점
  
  return Math.round((sessionScore + ratingScore + reviewScore + repeatScore + likeScore) * 100) / 100;
};

/**
 * 랭킹 점수 상세 분석 (디버깅용)
 * @param stats 전문가 통계 데이터
 * @returns 점수 분석 결과
 */
export const getRankingScoreBreakdown = (stats: ExpertStats) => {
  const sessionScore = Math.min((stats.totalSessions || 0) / 100, 1) * 400;
  const ratingScore = ((stats.avgRating || 0) / 5) * 300;
  const reviewScore = Math.min((stats.reviewCount || 0) / 50, 1) * 150;
  const totalSessions = stats.totalSessions || 0;
  const repeatRate = totalSessions > 0 ? (stats.repeatClients || 0) / totalSessions : 0;
  const repeatScore = repeatRate * 100;
  const likeScore = Math.min((stats.likeCount || 0) / 100, 1) * 50;
  
  const totalScore = sessionScore + ratingScore + reviewScore + repeatScore + likeScore;
  
  return {
    sessionScore: Math.round(sessionScore * 100) / 100,
    ratingScore: Math.round(ratingScore * 100) / 100,
    reviewScore: Math.round(reviewScore * 100) / 100,
    repeatScore: Math.round(repeatScore * 100) / 100,
    likeScore: Math.round(likeScore * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      sessions: `${stats.totalSessions || 0}회 → ${Math.round(sessionScore * 100) / 100}점`,
      rating: `${stats.avgRating || 0}점 → ${Math.round(ratingScore * 100) / 100}점`,
      reviews: `${stats.reviewCount || 0}개 → ${Math.round(reviewScore * 100) / 100}점`,
      repeat: `${Math.round(repeatRate * 100)}% → ${Math.round(repeatScore * 100) / 100}점`,
      likes: `${stats.likeCount || 0}개 → ${Math.round(likeScore * 100) / 100}점`
    }
  };
};
