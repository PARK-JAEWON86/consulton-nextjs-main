import { NextRequest, NextResponse } from 'next/server';
import { Expert, ExpertProfile as ExpertProfileModel, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { calculateRankingScore } from '@/utils/rankingCalculator';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    console.log('🚀 프로덕션 배포를 위한 데이터 스키마 마이그레이션 시작');

    // 1. 모든 전문가의 요금 정규화
    console.log('1. 전문가 요금 정규화 중...');
    const experts = await Expert.findAll();
    let fixedPricing = 0;

    for (const expert of experts) {
      const originalRate = expert.pricePerMinute;

      // 합리적인 범위로 정규화 (5-120 크레딧/분)
      let normalizedRate = originalRate;

      if (originalRate > 120) {
        // 잘못된 시간당 요금이 분당 요금으로 들어간 경우
        normalizedRate = Math.round(originalRate / 60);
        if (normalizedRate < 5) normalizedRate = 5;
        if (normalizedRate > 120) normalizedRate = 120;
        fixedPricing++;
      } else if (originalRate < 5) {
        normalizedRate = 5;
        fixedPricing++;
      }

      if (normalizedRate !== originalRate) {
        await expert.update({ pricePerMinute: normalizedRate });
      }
    }

    // 2. 랭킹 스코어 재계산 및 업데이트
    console.log('2. 전문가 랭킹 스코어 재계산 중...');
    let updatedRankings = 0;

    for (const expert of experts) {
      const stats = {
        totalSessions: expert.totalSessions || 0,
        avgRating: expert.avgRating || expert.rating || 0,
        reviewCount: expert.reviewCount || 0,
        repeatClients: 0, // ExpertProfile에서 가져와야 함
        likeCount: 0 // 좋아요 기능 구현 시 추가
      };

      // ExpertProfile에서 추가 데이터 가져오기
      const profile = await ExpertProfileModel.findOne({
        where: { expertId: expert.id }
      });

      if (profile && profile.repeatClients) {
        stats.repeatClients = profile.repeatClients;
      }

      const rankingScore = calculateRankingScore(stats);

      if (Math.abs(expert.rankingScore - rankingScore) > 0.1) {
        await expert.update({
          rankingScore,
          ranking: Math.round(rankingScore * 100) // 0-10000 범위로 확장
        });
        updatedRankings++;
      }
    }

    // 3. 전문가 레벨 재분류
    console.log('3. 전문가 레벨 재분류 중...');
    const levelUpdates = [];

    for (const expert of experts) {
      const score = expert.rankingScore || 0;
      let newLevel = 1;

      // 개선된 레벨 분류 시스템
      if (score >= 95) newLevel = 11; // Legend (전설)
      else if (score >= 90) newLevel = 10; // Grand Master (그랜드마스터)
      else if (score >= 85) newLevel = 9; // Master (마스터)
      else if (score >= 80) newLevel = 8; // Expert (전문가)
      else if (score >= 75) newLevel = 7; // Senior (시니어)
      else if (score >= 70) newLevel = 6; // Professional (프로페셔널)
      else if (score >= 65) newLevel = 5; // Skilled (숙련)
      else if (score >= 60) newLevel = 4; // Core (핵심)
      else if (score >= 55) newLevel = 3; // Rising Star (신성)
      else if (score >= 50) newLevel = 2; // Emerging Talent (신진)
      else newLevel = 1; // Fresh Mind (신예)

      if (expert.level !== newLevel) {
        await expert.update({ level: newLevel });
        levelUpdates.push({
          expertId: expert.id,
          oldLevel: expert.level,
          newLevel,
          score
        });
      }
    }

    // 4. 데이터 일관성 검증
    console.log('4. 데이터 일관성 검증 중...');
    const inconsistencies = [];

    for (const expert of experts) {
      const user = await User.findByPk(expert.userId);
      const profile = await ExpertProfileModel.findOne({
        where: { expertId: expert.id }
      });

      // 필수 데이터 누락 확인
      if (!user) {
        inconsistencies.push({
          type: 'missing_user',
          expertId: expert.id,
          issue: `Expert ${expert.id} has no associated user`
        });
      }

      // 가격 데이터 일관성 확인
      const hourlyRate = expert.pricePerMinute * 60;
      if (hourlyRate < 300 || hourlyRate > 12000) {
        inconsistencies.push({
          type: 'invalid_pricing',
          expertId: expert.id,
          pricePerMinute: expert.pricePerMinute,
          hourlyRate,
          issue: 'Hourly rate outside reasonable range (300-12000 credits)'
        });
      }
    }

    // 5. 통계 요약
    const finalStats = {
      totalExperts: experts.length,
      fixedPricing,
      updatedRankings,
      levelUpdates: levelUpdates.length,
      inconsistencies: inconsistencies.length
    };

    console.log('✅ 프로덕션 스키마 마이그레이션 완료');

    return NextResponse.json({
      success: true,
      message: 'Production schema migration completed successfully',
      stats: finalStats,
      details: {
        levelUpdates,
        inconsistencies
      },
      migration: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        changes: [
          'Normalized expert pricing to reasonable ranges',
          'Recalculated ranking scores for all experts',
          'Updated expert levels based on performance',
          'Validated data consistency across tables',
          'Fixed pricing tier calculations system-wide'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Production schema migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}