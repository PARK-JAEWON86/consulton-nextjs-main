export interface ExpertLevel {
  expertId: string;
  currentLevel: number;
  experiencePoints: number;
  rankingScore: number;
  levelTitle: string;
  consultationPricing: {
    basePrice: number;
    pricePerMinute: number;
    hourlyRate: number;
  };
  levelProgress: {
    current: number;
    next: number;
    percentage: number;
  };
  levelHistory: Array<{
    level: number;
    levelTitle: string;
    achievedAt: Date;
    rankingScore: number;
    reason: string;
    oldPricing?: {
      basePrice: number;
      pricePerMinute: number;
    };
    newPricing?: {
      basePrice: number;
      pricePerMinute: number;
    };
  }>;
  lastUpdated: Date;
}

export interface LevelRequirements {
  level: number;
  expRequired: number;
  title: string;
  basePrice: number;
  pricePerMinute: number;
}

export class ExpertLevelService {
  private static instance: ExpertLevelService;
  private cache: Map<string, ExpertLevel> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  static getInstance(): ExpertLevelService {
    if (!ExpertLevelService.instance) {
      ExpertLevelService.instance = new ExpertLevelService();
    }
    return ExpertLevelService.instance;
  }

  /**
   * 특정 전문가의 레벨 정보를 가져옵니다
   */
  async getExpertLevel(expertId: string): Promise<ExpertLevel | null> {
    try {
      // 캐시 확인
      const cached = this.getFromCache(expertId);
      if (cached) {
        return cached;
      }

      const response = await fetch(`/api/expert-levels?expertId=${expertId}`);
      const result = await response.json();

      if (result.success && result.data.levels.length > 0) {
        const levelData = result.data.levels[0];
        this.setCache(expertId, levelData);
        return levelData;
      }

      return null;
    } catch (error) {
      console.error('전문가 레벨 조회 실패:', error);
      return null;
    }
  }

  /**
   * 여러 전문가의 레벨 정보를 일괄로 가져옵니다
   */
  async getExpertLevels(expertIds: string[]): Promise<Map<string, ExpertLevel>> {
    const levels = new Map<string, ExpertLevel>();
    const uncachedIds: string[] = [];

    // 캐시된 데이터 먼저 확인
    for (const expertId of expertIds) {
      const cached = this.getFromCache(expertId);
      if (cached) {
        levels.set(expertId, cached);
      } else {
        uncachedIds.push(expertId);
      }
    }

    // 캐시되지 않은 데이터만 API로 조회
    if (uncachedIds.length > 0) {
      try {
        const response = await fetch('/api/expert-levels');
        const result = await response.json();

        if (result.success) {
          for (const levelData of result.data.levels) {
            if (uncachedIds.includes(levelData.expertId)) {
              levels.set(levelData.expertId, levelData);
              this.setCache(levelData.expertId, levelData);
            }
          }
        }
      } catch (error) {
        console.error('전문가 레벨 일괄 조회 실패:', error);
      }
    }

    return levels;
  }

  /**
   * 레벨 요구사항 정보를 가져옵니다
   */
  async getLevelRequirements(): Promise<LevelRequirements[]> {
    try {
      const response = await fetch('/api/expert-levels');
      const result = await response.json();

      if (result.success && result.data.levelRequirements) {
        return result.data.levelRequirements;
      }

      return [];
    } catch (error) {
      console.error('레벨 요구사항 조회 실패:', error);
      return [];
    }
  }

  /**
   * 레벨별 가격 정보를 가져옵니다
   */
  async getLevelPricing(level: number): Promise<{
    basePrice: number;
    pricePerMinute: number;
    hourlyRate: number;
    levelTitle: string;
  } | null> {
    try {
      const requirements = await this.getLevelRequirements();
      const levelReq = requirements.find(req => req.level <= level);

      if (levelReq) {
        return {
          basePrice: levelReq.basePrice,
          pricePerMinute: levelReq.pricePerMinute,
          hourlyRate: levelReq.pricePerMinute * 60,
          levelTitle: levelReq.title
        };
      }

      return null;
    } catch (error) {
      console.error('레벨 가격 정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 상담 요금을 계산합니다
   */
  async calculateConsultationPrice(
    level: number, 
    duration: number, 
    consultationType: string = 'video'
  ): Promise<{
    basePrice: number;
    pricePerMinute: number;
    consultationTypePrice: number;
    durationPrice: number;
    totalPrice: number;
    levelInfo: {
      level: number;
      title: string;
      experiencePoints: number;
    };
  } | null> {
    try {
      const response = await fetch('/api/expert-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculatePrice',
          level,
          duration,
          consultationType
        })
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('상담 요금 계산 실패:', error);
      return null;
    }
  }

  /**
   * 전문가 레벨을 업데이트합니다
   */
  async updateExpertLevel(expertId: string, rankingScore: number): Promise<ExpertLevel | null> {
    try {
      const response = await fetch('/api/expert-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateFromRanking',
          expertId,
          rankingScore
        })
      });

      const result = await response.json();

      if (result.success) {
        // 캐시 업데이트
        this.setCache(expertId, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('전문가 레벨 업데이트 실패:', error);
      return null;
    }
  }

  private getFromCache(expertId: string): ExpertLevel | null {
    const cached = this.cache.get(expertId);
    const expiry = this.cacheExpiry.get(expertId);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // 만료된 캐시 제거
    if (expiry && Date.now() >= expiry) {
      this.cache.delete(expertId);
      this.cacheExpiry.delete(expertId);
    }

    return null;
  }

  private setCache(expertId: string, levelData: ExpertLevel): void {
    this.cache.set(expertId, levelData);
    this.cacheExpiry.set(expertId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * 캐시를 초기화합니다
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export default ExpertLevelService;
