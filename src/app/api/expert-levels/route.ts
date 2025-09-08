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

// 점수 기반 레벨 체계 정의
const LEVELS: LevelTier[] = [
  {
    name: "Legend (전설)",
    levelRange: { min: 999, max: 999 },
    scoreRange: { min: 950, max: 999 },
    creditsPerMinute: 600, // 6,000원/분 = 600크레딧/분 (특별 최고 요금)
    color: "from-red-600 to-pink-700",
    bgColor: "bg-gradient-to-r from-red-600 to-pink-700",
    textColor: "text-white",
    borderColor: "border-red-600",
  },
  {
    name: "Grand Master (그랜드마스터)",
    levelRange: { min: 900, max: 998 },
    scoreRange: { min: 900, max: 949.99 },
    creditsPerMinute: 500, // 5,000원/분 = 500크레딧/분 (고정 요금)
    color: "from-purple-600 to-indigo-700",
    bgColor: "bg-gradient-to-r from-purple-600 to-indigo-700",
    textColor: "text-white",
    borderColor: "border-purple-600",
  },
  {
    name: "Master (마스터)",
    levelRange: { min: 800, max: 899 },
    scoreRange: { min: 850, max: 899.99 },
    creditsPerMinute: 500, // 5,000원/분 = 500크레딧/분
    color: "from-indigo-600 to-blue-700",
    bgColor: "bg-gradient-to-r from-indigo-600 to-blue-700",
    textColor: "text-white",
    borderColor: "border-indigo-600",
  },
  {
    name: "Expert (전문가)",
    levelRange: { min: 700, max: 799 },
    scoreRange: { min: 800, max: 849.99 },
    creditsPerMinute: 450, // 4,500원/분 = 450크레딧/분
    color: "from-blue-600 to-cyan-700",
    bgColor: "bg-gradient-to-r from-blue-600 to-cyan-700",
    textColor: "text-white",
    borderColor: "border-blue-600",
  },
  {
    name: "Senior (시니어)",
    levelRange: { min: 600, max: 699 },
    scoreRange: { min: 750, max: 799.99 },
    creditsPerMinute: 400, // 4,000원/분 = 400크레딧/분
    color: "from-cyan-600 to-teal-700",
    bgColor: "bg-gradient-to-r from-cyan-600 to-teal-700",
    textColor: "text-white",
    borderColor: "border-cyan-600",
  },
  {
    name: "Professional (프로페셔널)",
    levelRange: { min: 500, max: 599 },
    scoreRange: { min: 700, max: 749.99 },
    creditsPerMinute: 350, // 3,500원/분 = 350크레딧/분
    color: "from-teal-600 to-green-700",
    bgColor: "bg-gradient-to-r from-teal-600 to-green-700",
    textColor: "text-white",
    borderColor: "border-teal-600",
  },
  {
    name: "Skilled (숙련)",
    levelRange: { min: 400, max: 499 },
    scoreRange: { min: 650, max: 699.99 },
    creditsPerMinute: 300, // 3,000원/분 = 300크레딧/분
    color: "from-green-600 to-emerald-700",
    bgColor: "bg-gradient-to-r from-green-600 to-emerald-700",
    textColor: "text-white",
    borderColor: "border-green-600",
  },
  {
    name: "Core (핵심)",
    levelRange: { min: 300, max: 399 },
    scoreRange: { min: 600, max: 649.99 },
    creditsPerMinute: 250, // 2,500원/분 = 250크레딧/분
    color: "from-emerald-600 to-lime-700",
    bgColor: "bg-gradient-to-r from-emerald-600 to-lime-700",
    textColor: "text-white",
    borderColor: "border-emerald-600",
  },
  {
    name: "Rising Star (신성)",
    levelRange: { min: 200, max: 299 },
    scoreRange: { min: 550, max: 599.99 },
    creditsPerMinute: 200, // 2,000원/분 = 200크레딧/분
    color: "from-lime-600 to-yellow-700",
    bgColor: "bg-gradient-to-r from-lime-600 to-yellow-700",
    textColor: "text-white",
    borderColor: "border-lime-600",
  },
  {
    name: "Emerging Talent (신진)",
    levelRange: { min: 100, max: 199 },
    scoreRange: { min: 500, max: 549.99 },
    creditsPerMinute: 150, // 1,500원/분 = 150크레딧/분
    color: "from-yellow-600 to-orange-700",
    bgColor: "bg-gradient-to-r from-yellow-600 to-orange-700",
    textColor: "text-white",
    borderColor: "border-yellow-600",
  },
  {
    name: "Fresh Mind (신예)",
    levelRange: { min: 1, max: 99 },
    scoreRange: { min: 0, max: 499.99 },
    creditsPerMinute: 100, // 1,000원/분 = 100크레딧/분 (최저 요금)
    color: "from-orange-600 to-red-700",
    bgColor: "bg-gradient-to-r from-orange-600 to-red-700",
    textColor: "text-white",
    borderColor: "border-orange-600",
  },
];

// 점수 계산 공식 업데이트 (3자리 점수 체계)
const calculateRankingScore = (stats: any): number => {
  // 1. 상담 횟수 (40% 가중치) - 3자리 점수 체계에 맞게 조정
  const sessionScore = Math.min(stats.totalSessions / 100, 1) * 400; // 100회당 400점
  
  // 2. 평점 (30% 가중치) - 3자리 점수 체계에 맞게 조정
  const ratingScore = (stats.avgRating / 5) * 300; // 5점 만점에서 300점
  
  // 3. 리뷰 수 (15% 가중치) - 3자리 점수 체계에 맞게 조정
  const reviewScore = Math.min(stats.reviewCount / 50, 1) * 150; // 50개당 150점
  
  // 4. 재방문 고객 비율 (10% 가중치) - 3자리 점수 체계에 맞게 조정
  const repeatRate = stats.totalSessions > 0 ? stats.repeatClients / stats.totalSessions : 0;
  const repeatScore = repeatRate * 100; // 100% 재방문시 100점
  
  // 5. 좋아요 수 (5% 가중치) - 3자리 점수 체계에 맞게 조정
  const likeScore = Math.min(stats.likeCount / 100, 1) * 50; // 100개당 50점
  
  return Math.round((sessionScore + ratingScore + reviewScore + repeatScore + likeScore) * 100) / 100;
};

// 유틸리티 함수들
const calculateLevelByScore = (rankingScore: number = 0): number => {
  // 점수를 기반으로 레벨 계산 (3자리 점수 체계)
  // 점수 0-499: 레벨 1-99
  // 점수 500-549: 레벨 100-199
  // 점수 550-599: 레벨 200-299
  // 점수 600-649: 레벨 300-399
  // 점수 650-699: 레벨 400-499
  // 점수 700-749: 레벨 500-599
  // 점수 750-799: 레벨 600-699
  // 점수 800-849: 레벨 700-799
  // 점수 850-899: 레벨 800-899
  // 점수 900-949: 레벨 900-998
  // 점수 950-999: 레벨 999 (최고 레벨)
  // 점수 999+: 레벨 999 이후에도 점수는 계속 쌓임
  
  const tier = LEVELS.find(
    (l) => rankingScore >= l.scoreRange.min && rankingScore <= l.scoreRange.max
  );
  
  if (!tier) {
    // 999점을 초과하는 경우에도 점수는 계속 쌓일 수 있음
    if (rankingScore > 999) {
      return 999; // 최고 레벨은 999로 고정
    }
    // 기본값: Tier 1
    return Math.max(1, Math.floor(rankingScore / 5));
  }
  
  // 해당 티어 내에서 점수에 따른 세부 레벨 계산
  const tierMinLevel = tier.levelRange.min;
  const tierMaxLevel = tier.levelRange.max;
  const tierScoreRange = tier.scoreRange.max - tier.scoreRange.min;
  const scoreInTier = rankingScore - tier.scoreRange.min;
  
  if (tierScoreRange === 0) {
    return tierMinLevel; // 특별한 경우 (예: Lv.999)
  }
  
  const levelInTier = Math.floor((scoreInTier / tierScoreRange) * (tierMaxLevel - tierMinLevel + 1));
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
  // 999점을 초과하는 경우에도 최고 티어 정보 반환
  if (rankingScore > 999) {
    return LEVELS[0]; // Tier 10 (Lv.999)
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
    // 999점을 초과하는 경우에도 점수는 계속 쌓일 수 있음
    if (rankingScore > 999) {
      return {
        isMaxTier: true,
        progress: 100,
        nextTier: null,
        scoreNeeded: 0,
        currentTierMaxScore: 999,
        nextTierMinScore: 999,
        // 추가 점수 정보 제공
        additionalScore: rankingScore - 999,
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
    "Legend (전설)": "전설 (Lv.999) - 최고 레벨",
    "Grand Master (그랜드마스터)": "그랜드마스터 (Lv.900-998)",
    "Master (마스터)": "마스터 (Lv.800-899)",
    "Expert (전문가)": "전문가 (Lv.700-799)",
    "Senior (시니어)": "시니어 (Lv.600-699)",
    "Professional (프로페셔널)": "프로페셔널 (Lv.500-599)",
    "Skilled (숙련)": "숙련 (Lv.400-499)",
    "Core (핵심)": "핵심 (Lv.300-399)",
    "Rising Star (신성)": "신성 (Lv.200-299)",
    "Emerging Talent (신진)": "신진 (Lv.100-199)",
    "Fresh Mind (신예)": "신예 (Lv.1-99)",
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
        // 각 레벨에 도달하기 위한 점수 요구사항 (3자리 점수 체계)
        result = {
          scoreRequirements: LEVELS.map(tier => ({
            tier: tier.name,
            minScore: tier.scoreRange.min,
            maxScore: tier.scoreRange.max,
            levelRange: tier.levelRange,
            creditsPerMinute: tier.creditsPerMinute
          })),
          // 999점 이후 점수 정보 추가
          maxScoreInfo: {
            maxLevel: 999,
            maxScore: 999,
            note: "999점 이후에도 점수는 계속 쌓일 수 있습니다. 레벨은 999로 고정됩니다."
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
              sessionScore: Math.min(mockStats.totalSessions / 100, 1) * 400,
              ratingScore: (mockStats.avgRating / 5) * 300,
              reviewScore: Math.min(mockStats.reviewCount / 50, 1) * 150,
              repeatScore: (mockStats.repeatClients / mockStats.totalSessions) * 100,
              likeScore: Math.min(mockStats.likeCount / 100, 1) * 50
            }
          };
        }
        break;
      
      case 'getLevelRequirements':
        // 각 레벨 달성에 필요한 구체적인 요구사항 (3자리 점수 체계)
        result = {
          levelRequirements: {
            "Tier 10 (Lv.999+)": {
              minScore: 950,
              minSessions: 2500, // 100회당 400점이므로 950점을 위해서는 약 2500회 필요
              minRating: 4.9,
              minReviews: 1000,
              minRepeatRate: 0.8,
              minLikes: 2000
            },
            "Tier 9 (Lv.800-899)": {
              minScore: 850,
              minSessions: 2000,
              minRating: 4.8,
              minReviews: 800,
              minRepeatRate: 0.7,
              minLikes: 1500
            },
            "Tier 8 (Lv.700-799)": {
              minScore: 800,
              minSessions: 1800,
              minRating: 4.7,
              minReviews: 700,
              minRepeatRate: 0.6,
              minLikes: 1200
            },
            "Tier 7 (Lv.600-699)": {
              minScore: 750,
              minSessions: 1600,
              minRating: 4.6,
              minReviews: 600,
              minRepeatRate: 0.5,
              minLikes: 1000
            },
            "Tier 6 (Lv.500-599)": {
              minScore: 700,
              minSessions: 1400,
              minRating: 4.5,
              minReviews: 500,
              minRepeatRate: 0.4,
              minLikes: 800
            }
          }
        };
        break;
      
      case 'getAdditionalScoreInfo':
        // 999점 이후의 추가 점수 정보 조회
        if (rankingScore) {
          const score = parseFloat(rankingScore);
          if (score > 999) {
            result = {
              currentScore: score,
              maxLevel: 999,
              additionalScore: score - 999,
              totalScore: score,
              message: "999점 이후에도 점수는 계속 쌓일 수 있습니다. 레벨은 999로 고정됩니다.",
              tierInfo: getTierInfo(999)
            };
          } else {
            result = {
              currentScore: score,
              maxLevel: 999,
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
  // 레벨 계산 로직 (세션 수와 평점을 기반으로 레벨 계산)
  // 3자리 점수 체계에 맞게 조정
  const level = Math.min(
    999,
    Math.max(1, Math.floor(totalSessions / 10) + Math.floor(avgRating * 10))
  );
  return getTierInfo(level);
};
