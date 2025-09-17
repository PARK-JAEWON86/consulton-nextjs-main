import { NextRequest, NextResponse } from 'next/server';
import { Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { calculateRankingScore } from '@/utils/rankingCalculator';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    // Lee Junho expert's actual data
    const expertStats = {
      totalSessions: 67,
      avgRating: 4.8,
      reviewCount: 89,
      repeatClients: 34,
      likeCount: 45
    };

    // Calculate proper score using new 0-100 system
    const rankingScore = calculateRankingScore(expertStats);

    // Determine proper tier based on score
    let properRate = 100; // Default Fresh Mind
    let tierName = 'Fresh Mind (신예)';

    if (rankingScore >= 95) {
      properRate = 600;
      tierName = 'Legend (전설)';
    } else if (rankingScore >= 90) {
      properRate = 500;
      tierName = 'Grand Master (그랜드마스터)';
    } else if (rankingScore >= 85) {
      properRate = 450;
      tierName = 'Master (마스터)';
    } else if (rankingScore >= 80) {
      properRate = 400;
      tierName = 'Expert (전문가)';
    } else if (rankingScore >= 75) {
      properRate = 350;
      tierName = 'Senior (시니어)';
    } else if (rankingScore >= 70) {
      properRate = 300;
      tierName = 'Professional (프로페셔널)';
    } else if (rankingScore >= 65) {
      properRate = 250;
      tierName = 'Skilled (숙련)';
    } else if (rankingScore >= 60) {
      properRate = 200;
      tierName = 'Core (핵심)';
    } else if (rankingScore >= 55) {
      properRate = 150;
      tierName = 'Rising Star (신성)';
    } else if (rankingScore >= 50) {
      properRate = 120;
      tierName = 'Emerging Talent (신진)';
    }

    // Find Lee Junho expert (userId 2)
    const expert = await Expert.findOne({
      where: { userId: 2 }
    });

    if (!expert) {
      return NextResponse.json({
        success: false,
        error: 'Lee Junho expert not found'
      }, { status: 404 });
    }

    const previousRate = expert.pricePerMinute;

    // Update with calculated values
    await expert.update({
      pricePerMinute: properRate,
      totalSessions: expertStats.totalSessions,
      avgRating: expertStats.avgRating,
      reviewCount: expertStats.reviewCount
    });

    const breakdown = {
      sessionScore: Math.min(expertStats.totalSessions / 200, 1) * 25,
      ratingScore: (expertStats.avgRating / 5) * 35,
      reviewScore: Math.min(expertStats.reviewCount / 100, 1) * 15,
      repeatScore: (expertStats.repeatClients / expertStats.totalSessions) * 20,
      likeScore: Math.min(expertStats.likeCount / 200, 1) * 5
    };

    return NextResponse.json({
      success: true,
      message: 'Lee Junho expert rate updated successfully',
      expertData: {
        userId: expert.userId,
        stats: expertStats,
        calculation: {
          rankingScore: Math.round(rankingScore * 100) / 100,
          breakdown: {
            sessionScore: Math.round(breakdown.sessionScore * 100) / 100,
            ratingScore: Math.round(breakdown.ratingScore * 100) / 100,
            reviewScore: Math.round(breakdown.reviewScore * 100) / 100,
            repeatScore: Math.round(breakdown.repeatScore * 100) / 100,
            likeScore: Math.round(breakdown.likeScore * 100) / 100
          }
        },
        tierInfo: {
          tierName: tierName,
          previousRate: previousRate,
          newRate: properRate,
          change: properRate - previousRate
        }
      }
    });

  } catch (error) {
    console.error('Fix expert rate error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update expert rate'
    }, { status: 500 });
  }
}