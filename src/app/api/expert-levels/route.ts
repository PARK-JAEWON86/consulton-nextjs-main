import { NextRequest, NextResponse } from 'next/server';

// 타입 정의
export interface LevelTier {
  name: string;
  levelRange: { min: number; max: number };
  scoreRange: { min: number; max: number };
  creditsPerMinute: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface ExpertLevelLike {
  level?: number;
  rankingScore?: number;
}

// 점수 기반 레벨 체계 정의 (0-100점 체계)
const LEVELS: LevelTier[] = [
  {
    name: "Legend (전설)",
    levelRange: { min: 95, max: 100 },
    scoreRange: { min: 95, max: 100 },
    creditsPerMinute: 600, // 6,000원/분 = 600크레딧/분 (특별 최고 요금)
    color: "from-red-600 to-pink-700",
    bgColor: "bg-gradient-to-r from-red-600 to-pink-700",
    textColor: "text-white",
    borderColor: "border-red-600",
  },
  {
    name: "Grand Master (그랜드마스터)",
    levelRange: { min: 90, max: 94.99 },
    scoreRange: { min: 90, max: 94.99 },
    creditsPerMinute: 500, // 5,000원/분 = 500크레딧/분
    color: "from-purple-600 to-indigo-700",
    bgColor: "bg-gradient-to-r from-purple-600 to-indigo-700",
    textColor: "text-white",
    borderColor: "border-purple-600",
  },
  {
    name: "Master (마스터)",
    levelRange: { min: 85, max: 89.99 },
    scoreRange: { min: 85, max: 89.99 },
    creditsPerMinute: 450, // 4,500원/분 = 450크레딧/분
    color: "from-indigo-600 to-blue-700",
    bgColor: "bg-gradient-to-r from-indigo-600 to-blue-700",
    textColor: "text-white",
    borderColor: "border-indigo-600",
  },
  {
    name: "Expert (전문가)",
    levelRange: { min: 80, max: 84.99 },
    scoreRange: { min: 80, max: 84.99 },
    creditsPerMinute: 400, // 4,000원/분 = 400크레딧/분
    color: "from-blue-600 to-cyan-700",
    bgColor: "bg-gradient-to-r from-blue-600 to-cyan-700",
    textColor: "text-white",
    borderColor: "border-blue-600",
  },
  {
    name: "Senior (시니어)",
    levelRange: { min: 75, max: 79.99 },
    scoreRange: { min: 75, max: 79.99 },
    creditsPerMinute: 350, // 3,500원/분 = 350크레딧/분
    color: "from-cyan-600 to-teal-700",
    bgColor: "bg-gradient-to-r from-cyan-600 to-teal-700",
    textColor: "text-white",
    borderColor: "border-cyan-600",
  },
  {
    name: "Professional (프로페셔널)",
    levelRange: { min: 70, max: 74.99 },
    scoreRange: { min: 70, max: 74.99 },
    creditsPerMinute: 300, // 3,000원/분 = 300크레딧/분
    color: "from-teal-600 to-green-700",
    bgColor: "bg-gradient-to-r from-teal-600 to-green-700",
    textColor: "text-white",
    borderColor: "border-teal-600",
  },
  {
    name: "Skilled (숙련)",
    levelRange: { min: 65, max: 69.99 },
    scoreRange: { min: 65, max: 69.99 },
    creditsPerMinute: 250, // 2,500원/분 = 250크레딧/분
    color: "from-green-600 to-emerald-700",
    bgColor: "bg-gradient-to-r from-green-600 to-emerald-700",
    textColor: "text-white",
    borderColor: "border-green-600",
  },
  {
    name: "Core (핵심)",
    levelRange: { min: 60, max: 64.99 },
    scoreRange: { min: 60, max: 64.99 },
    creditsPerMinute: 200, // 2,000원/분 = 200크레딧/분
    color: "from-emerald-600 to-lime-700",
    bgColor: "bg-gradient-to-r from-emerald-600 to-lime-700",
    textColor: "text-white",
    borderColor: "border-emerald-600",
  },
  {
    name: "Rising Star (신성)",
    levelRange: { min: 55, max: 59.99 },
    scoreRange: { min: 55, max: 59.99 },
    creditsPerMinute: 150, // 1,500원/분 = 150크레딧/분
    color: "from-lime-600 to-yellow-700",
    bgColor: "bg-gradient-to-r from-lime-600 to-yellow-700",
    textColor: "text-white",
    borderColor: "border-lime-600",
  },
  {
    name: "Emerging Talent (신진)",
    levelRange: { min: 50, max: 54.99 },
    scoreRange: { min: 50, max: 54.99 },
    creditsPerMinute: 120, // 1,200원/분 = 120크레딧/분
    color: "from-yellow-600 to-orange-700",
    bgColor: "bg-gradient-to-r from-yellow-600 to-orange-700",
    textColor: "text-white",
    borderColor: "border-yellow-600",
  },
  {
    name: "Fresh Mind (신예)",
    levelRange: { min: 0, max: 49.99 },
    scoreRange: { min: 0, max: 49.99 },
    creditsPerMinute: 100, // 1,000원/분 = 100크레딧/분 (최저 요금)
    color: "from-orange-600 to-red-700",
    bgColor: "bg-gradient-to-r from-orange-600 to-red-700",
    textColor: "text-white",
    borderColor: "border-orange-600",
  },
];

// 개선된 점수 계산 공식 (0-100점 체계)
const calculateRankingScore = (stats: any): number => {
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

// 유틸리티 함수들
const calculateLevelByScore = (rankingScore: number = 0): number => {
  // 점수를 기반으로 레벨 계산 (0-100점 체계)
  const tier = LEVELS.find(
    (l) => rankingScore >= l.scoreRange.min && rankingScore <= l.scoreRange.max
  );

  if (!tier) {
    // 100점을 초과하는 경우에도 점수는 계속 쌓일 수 있음
    if (rankingScore > 100) {
      return 100; // 최고 레벨은 100으로 고정
    }
    // 기본값: 점수 그대로 레벨로 사용
    return Math.max(0, Math.min(100, Math.round(rankingScore)));
  }

  // 해당 티어 내에서 점수에 따른 세부 레벨 계산
  const tierMinLevel = tier.levelRange.min;
  const tierMaxLevel = tier.levelRange.max;
  const tierScoreRange = tier.scoreRange.max - tier.scoreRange.min;
  const scoreInTier = rankingScore - tier.scoreRange.min;

  if (tierScoreRange === 0) {
    return tierMinLevel; // 특별한 경우
  }

  const levelInTier = (scoreInTier / tierScoreRange) * (tierMaxLevel - tierMinLevel);
  return Math.max(tierMinLevel, Math.min(tierMaxLevel, tierMinLevel + levelInTier));
};

const calculateCreditsByLevel = (level: number = 1): number => {
  const tier = LEVELS.find(
    (l) => level >= l.levelRange.min && level <= l.levelRange.max
  );
  return tier
    ? tier.creditsPerMinute
    : LEVELS[LEVELS.length - 1].creditsPerMinute;
};

const getTierInfo = (level: number = 1) => {
  const tier = LEVELS.find(
    (l) => level >= l.levelRange.min && level <= l.levelRange.max
  );
  return tier || LEVELS[LEVELS.length - 1];
};

const getTierInfoByScore = (rankingScore: number = 0) => {
  // 100점을 초과하는 경우에도 최고 티어 정보 반환
  if (rankingScore > 100) {
    return LEVELS[0]; // Legend tier
  }

  const tier = LEVELS.find(
    (l) => rankingScore >= l.scoreRange.min && rankingScore <= l.scoreRange.max
  );
  return tier || LEVELS[LEVELS.length - 1];
};

const getTierInfoByName = (tierName: string) => {
  return LEVELS.find((l) => l.name === tierName) || LEVELS[LEVELS.length - 1];
};

const getNextTierProgress = (level: number = 1) => {
  const currentTier = getTierInfo(level);
  const currentTierIndex = LEVELS.findIndex((l) => l.name === currentTier.name);

  // 이미 최고 티어인 경우
  if (currentTierIndex === 0) {
    return {
      isMaxTier: true,
      progress: 100,
      nextTier: null,
      levelsNeeded: 0,
    };
  }

  const nextTier = LEVELS[currentTierIndex - 1];
  const currentTierMaxLevel = currentTier.levelRange.max;
  const nextTierMinLevel = nextTier.levelRange.min;

  const progress = Math.min(
    100,
    ((level - currentTier.levelRange.min) /
      (currentTierMaxLevel - currentTier.levelRange.min)) *
      100
  );

  return {
    isMaxTier: false,
    progress: Math.round(progress),
    nextTier,
    levelsNeeded: Math.max(0, nextTierMinLevel - level),
    currentTierMaxLevel,
    nextTierMinLevel,
  };
};

const getScoreProgress = (rankingScore: number = 0) => {
  const currentTier = getTierInfoByScore(rankingScore);
  const currentTierIndex = LEVELS.findIndex((l) => l.name === currentTier.name);

  // 이미 최고 티어인 경우
  if (currentTierIndex === 0) {
    // 100점을 초과하는 경우에도 점수는 계속 쌓일 수 있음
    if (rankingScore > 100) {
      return {
        isMaxTier: true,
        progress: 100,
        nextTier: null,
        scoreNeeded: 0,
        currentTierMaxScore: 100,
        nextTierMinScore: 100,
        // 추가 점수 정보 제공
        additionalScore: rankingScore - 100,
        totalScore: rankingScore
      };
    }
    return {
      isMaxTier: true,
      progress: 100,
      nextTier: null,
      scoreNeeded: 0,
    };
  }

  const nextTier = LEVELS[currentTierIndex - 1];
  const currentTierMaxScore = currentTier.scoreRange.max;
  const nextTierMinScore = nextTier.scoreRange.min;

  const progress = Math.min(
    100,
    ((rankingScore - currentTier.scoreRange.min) /
      (currentTierMaxScore - currentTier.scoreRange.min)) *
      100
  );

  return {
    isMaxTier: false,
    progress: Math.round(progress),
    nextTier,
    scoreNeeded: Math.max(0, nextTierMinScore - rankingScore),
    currentTierMaxScore,
    nextTierMinScore,
  };
};

const getTierBadgeStyles = (level: number) => {
  const tier = getTierInfo(level);
  return {
    gradient: tier.color,
    background: tier.bgColor,
    textColor: tier.textColor,
    borderColor: tier.borderColor,
  };
};

const getLevelPricing = (level: number) => {
  const tier = getTierInfo(level);
  return {
    creditsPerMinute: tier.creditsPerMinute,
    creditsPerHour: tier.creditsPerMinute * 60,
    tierName: tier.name,
  };
};

const calculateTierStatistics = (experts: ExpertLevelLike[] = []) => {
  const stats = LEVELS.reduce(
    (acc, tier) => {
      acc[tier.name] = { count: 0, percentage: 0 };
      return acc;
    },
    {} as Record<string, { count: number; percentage: number }>
  );

  experts.forEach((expert: ExpertLevelLike) => {
    const tier = getTierInfo(expert.level || expert.rankingScore || 1); // 랭킹점수 기반 또는 기본값
    stats[tier.name].count++;
  });

  const total = experts.length;
  if (total > 0) {
    Object.keys(stats).forEach((tierName) => {
      stats[tierName].percentage = Math.round(
        (stats[tierName].count / total) * 100
      );
    });
  }

  return stats;
};

const getKoreanTierName = (tierName: string): string => {
  const tierMap: Record<string, string> = {
    "Legend (전설)": "전설 (Lv.95-100) - 최고 레벨",
    "Grand Master (그랜드마스터)": "그랜드마스터 (Lv.90-94)",
    "Master (마스터)": "마스터 (Lv.85-89)",
    "Expert (전문가)": "전문가 (Lv.80-84)",
    "Senior (시니어)": "시니어 (Lv.75-79)",
    "Professional (프로페셔널)": "프로페셔널 (Lv.70-74)",
    "Skilled (숙련)": "숙련 (Lv.65-69)",
    "Core (핵심)": "핵심 (Lv.60-64)",
    "Rising Star (신성)": "신성 (Lv.55-59)",
    "Emerging Talent (신진)": "신진 (Lv.50-54)",
    "Fresh Mind (신예)": "신예 (Lv.0-49)",
  };
  return tierMap[tierName] || tierName;
};

// 전문가 통계에서 점수를 가져와서 레벨 계산
const getExpertLevelFromStats = async (expertId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-stats?expertId=${expertId}`);
    const data = await response.json();
    
    if (data.success && data.data.rankingScore !== undefined) {
      const rankingScore = data.data.rankingScore;
      const level = calculateLevelByScore(rankingScore);
      const tierInfo = getTierInfo(level);
      
      return {
        expertId,
        rankingScore,
        level,
        tierInfo,
        levelProgress: getNextTierProgress(level),
        scoreProgress: getScoreProgress(rankingScore)
      };
    }
    
    return null;
  } catch (error) {
    console.error('전문가 통계 조회 실패:', error);
    return null;
  }
};

// API 라우트 핸들러
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const level = searchParams.get('level');
    const tierName = searchParams.get('tierName');
    const totalSessions = searchParams.get('totalSessions');
    const avgRating = searchParams.get('avgRating');
    const expertId = searchParams.get('expertId');
    const rankingScore = searchParams.get('rankingScore');

    let result: any = {};

    switch (action) {
      case 'getAllLevels':
        result = { levels: LEVELS };
        break;
      
      case 'calculateCreditsByLevel':
        if (level) {
          result = { 
            level: parseInt(level), 
            creditsPerMinute: calculateCreditsByLevel(parseInt(level)) 
          };
        }
        break;
      
      case 'getTierInfo':
        if (level) {
          result = { level: parseInt(level), tierInfo: getTierInfo(parseInt(level)) };
        }
        break;
      
      case 'getTierInfoByName':
        if (tierName) {
          result = { tierName, tierInfo: getTierInfoByName(tierName) };
        }
        break;
      
      case 'getNextTierProgress':
        if (level) {
          result = { level: parseInt(level), progress: getNextTierProgress(parseInt(level)) };
        }
        break;
      
      case 'getTierBadgeStyles':
        if (level) {
          result = { level: parseInt(level), styles: getTierBadgeStyles(parseInt(level)) };
        }
        break;
      
      case 'getLevelPricing':
        if (level) {
          result = { level: parseInt(level), pricing: getLevelPricing(parseInt(level)) };
        }
        break;
      
      case 'getKoreanTierName':
        if (tierName) {
          result = { tierName, koreanName: getKoreanTierName(tierName) };
        }
        break;
      
      case 'calculateExpertLevel':
        if (totalSessions && avgRating) {
          result = { 
            totalSessions: parseInt(totalSessions), 
            avgRating: parseFloat(avgRating),
            levelInfo: calculateExpertLevel(parseInt(totalSessions), parseFloat(avgRating))
          };
        }
        break;
      
      case 'getExpertLevel':
        if (expertId) {
          try {
            // 전문가 통계에서 점수를 가져와서 레벨 계산
            const expertLevelData = await getExpertLevelFromStats(expertId);
            
            if (expertLevelData) {
              result = { 
                currentLevel: expertLevelData.level,
                levelTitle: expertLevelData.tierInfo.name,
                tierInfo: expertLevelData.tierInfo,
                rankingScore: expertLevelData.rankingScore,
                levelProgress: expertLevelData.levelProgress,
                scoreProgress: expertLevelData.scoreProgress,
                pricing: {
                  creditsPerMinute: expertLevelData.tierInfo.creditsPerMinute,
                  creditsPerHour: expertLevelData.tierInfo.creditsPerMinute * 60,
                  tierName: expertLevelData.tierInfo.name
                }
              };
            } else {
              // 통계 정보가 없는 경우 기본값 사용
              const mockLevel = Math.floor(Math.random() * 99) + 1;
              const tierInfo = getTierInfo(mockLevel);
              
              result = { 
                currentLevel: mockLevel,
                levelTitle: tierInfo.name,
                tierInfo: tierInfo,
                rankingScore: 25 + Math.random() * 25, // 25-50점
                levelProgress: getNextTierProgress(mockLevel),
                pricing: {
                  creditsPerMinute: tierInfo.creditsPerMinute,
                  creditsPerHour: tierInfo.creditsPerMinute * 60,
                  tierName: tierInfo.name
                }
              };
            }
          } catch (error) {
            result = { 
              error: '전문가 레벨 정보를 가져올 수 없습니다.' 
            };
          }
        }
        break;
      
      case 'calculateLevelByScore':
        if (rankingScore) {
          const score = parseFloat(rankingScore);
          const level = calculateLevelByScore(score);
          const tierInfo = getTierInfo(level);
          
          result = {
            rankingScore: score,
            calculatedLevel: level,
            tierInfo: tierInfo,
            levelProgress: getNextTierProgress(level),
            scoreProgress: getScoreProgress(score)
          };
        }
        break;
      
      case 'getScoreRequirements':
        // 각 레벨에 도달하기 위한 점수 요구사항 (0-100점 체계)
        result = {
          scoreRequirements: LEVELS.map(tier => ({
            tier: tier.name,
            minScore: tier.scoreRange.min,
            maxScore: tier.scoreRange.max,
            levelRange: tier.levelRange,
            creditsPerMinute: tier.creditsPerMinute
          })),
          // 100점 이후 점수 정보 추가
          maxScoreInfo: {
            maxLevel: 100,
            maxScore: 100,
            note: "100점 이후에도 점수는 계속 쌓일 수 있습니다. 레벨은 100으로 고정됩니다."
          }
        };
        break;
      
      case 'calculateRankingScore':
        // 새로운 점수 계산 공식 테스트
        if (totalSessions && avgRating) {
          const mockStats = {
            totalSessions: parseInt(totalSessions),
            avgRating: parseFloat(avgRating),
            reviewCount: parseInt(searchParams.get('reviewCount') || '0'),
            repeatClients: parseInt(searchParams.get('repeatClients') || '0'),
            likeCount: parseInt(searchParams.get('likeCount') || '0')
          };
          
          const rankingScore = calculateRankingScore(mockStats);
          const level = calculateLevelByScore(rankingScore);
          const tierInfo = getTierInfo(level);
          
          result = {
            stats: mockStats,
            calculatedScore: rankingScore,
            calculatedLevel: level,
            tierInfo: tierInfo,
            breakdown: {
              sessionScore: Math.min(mockStats.totalSessions / 200, 1) * 25,
              ratingScore: (mockStats.avgRating / 5) * 35,
              reviewScore: Math.min(mockStats.reviewCount / 100, 1) * 15,
              repeatScore: mockStats.totalSessions > 0 ? (mockStats.repeatClients / mockStats.totalSessions) * 20 : 0,
              likeScore: Math.min(mockStats.likeCount / 200, 1) * 5
            }
          };
        }
        break;
      
      case 'getLevelRequirements':
        // 각 레벨 달성에 필요한 구체적인 요구사항 (0-100점 체계)
        result = {
          levelRequirements: {
            "Legend (전설) 95-100점": {
              minScore: 95,
              minSessions: 200, // 200회당 25점 만점
              minRating: 4.9, // 35점 만점을 위해
              minReviews: 100, // 100개당 15점 만점
              minRepeatRate: 0.95, // 20점 만점을 위해
              minLikes: 200 // 200개당 5점 만점
            },
            "Grand Master (그랜드마스터) 90-94점": {
              minScore: 90,
              minSessions: 180,
              minRating: 4.8,
              minReviews: 90,
              minRepeatRate: 0.8,
              minLikes: 180
            },
            "Master (마스터) 85-89점": {
              minScore: 85,
              minSessions: 160,
              minRating: 4.7,
              minReviews: 80,
              minRepeatRate: 0.7,
              minLikes: 160
            },
            "Expert (전문가) 80-84점": {
              minScore: 80,
              minSessions: 140,
              minRating: 4.6,
              minReviews: 70,
              minRepeatRate: 0.6,
              minLikes: 140
            },
            "Senior (시니어) 75-79점": {
              minScore: 75,
              minSessions: 120,
              minRating: 4.5,
              minReviews: 60,
              minRepeatRate: 0.5,
              minLikes: 120
            }
          }
        };
        break;
      
      case 'getAdditionalScoreInfo':
        // 100점 이후의 추가 점수 정보 조회
        if (rankingScore) {
          const score = parseFloat(rankingScore);
          if (score > 100) {
            result = {
              currentScore: score,
              maxLevel: 100,
              additionalScore: score - 100,
              totalScore: score,
              message: "100점 이후에도 점수는 계속 쌓일 수 있습니다. 레벨은 100으로 고정됩니다.",
              tierInfo: getTierInfo(100)
            };
          } else {
            result = {
              currentScore: score,
              maxLevel: 100,
              additionalScore: 0,
              totalScore: score,
              message: "아직 최고 레벨에 도달하지 않았습니다.",
              tierInfo: getTierInfoByScore(score)
            };
          }
        }
        break;
      
      default:
        result = { 
          message: '사용 가능한 액션들',
          actions: [
            'getAllLevels',
            'calculateCreditsByLevel',
            'getTierInfo',
            'getTierInfoByName',
            'getNextTierProgress',
            'getTierBadgeStyles',
            'getLevelPricing',
            'getKoreanTierName',
            'calculateExpertLevel',
            'getExpertLevel',
            'calculateLevelByScore',
            'getScoreRequirements',
            'getLevelRequirements',
            'calculateRankingScore',
            'getAdditionalScoreInfo'
          ]
        };
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;
    console.log(`API 처리 시간: ${processingTime.toFixed(2)}ms (action: ${action}, expertId: ${expertId})`);
    
    return NextResponse.json(result);
  } catch (error) {
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    console.log(`API 에러 처리 시간: ${processingTime.toFixed(2)}ms`);
    
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    let result: any = {};

    switch (action) {
      case 'calculateTierStatistics':
        if (data?.experts) {
          result = { statistics: calculateTierStatistics(data.experts) };
        }
        break;
      
      case 'batchCalculate':
        if (data?.experts) {
          const experts = data.experts.map((expert: any) => ({
            ...expert,
            tierInfo: getTierInfo(expert.level || expert.rankingScore || 1),
            creditsPerMinute: calculateCreditsByLevel(expert.level || expert.rankingScore || 1),
            badgeStyles: getTierBadgeStyles(expert.level || expert.rankingScore || 1),
            pricing: getLevelPricing(expert.level || expert.rankingScore || 1)
          }));
          result = { experts };
        }
        break;
      
      case 'bulkUpdate':
        if (data?.experts) {
          // 전문가들의 점수를 기반으로 레벨 일괄 업데이트
          const updatedExperts = data.experts.map((expert: any) => {
            const level = calculateLevelByScore(expert.rankingScore || 0);
            const tierInfo = getTierInfo(level);
            
            return {
              expertId: expert.expertId,
              rankingScore: expert.rankingScore,
              level: level,
              tierInfo: tierInfo,
              creditsPerMinute: tierInfo.creditsPerMinute
            };
          });
          
          result = { 
            updatedExperts,
            message: `${updatedExperts.length}명의 전문가 레벨이 업데이트되었습니다.`
          };
        }
        break;
      
      default:
        result = { error: '지원하지 않는 액션입니다.' };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 기존 함수들 (하위 호환성 유지)
const calculateExpertLevel = (
  totalSessions: number = 0,
  avgRating: number = 0
) => {
  // 새로운 0-100점 체계에 맞게 조정된 레벨 계산 로직
  const mockStats = {
    totalSessions,
    avgRating,
    reviewCount: Math.floor(totalSessions * 0.3), // 대략적인 리뷰 수 추정
    repeatClients: Math.floor(totalSessions * 0.2), // 대략적인 재방문 고객 수 추정
    likeCount: Math.floor(totalSessions * 0.4) // 대략적인 좋아요 수 추정
  };

  const rankingScore = calculateRankingScore(mockStats);
  const level = calculateLevelByScore(rankingScore);
  return getTierInfo(level);
};
