import { NextRequest, NextResponse } from 'next/server';
import { Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { calculateRankingScore } from '@/utils/rankingCalculator';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    // Get all experts to analyze and fix their rates
    const experts = await Expert.findAll({
      limit: 100
    });

    console.log(`Found ${experts.length} experts to analyze`);

    const results = [];

    for (const expert of experts) {
      const originalRate = expert.pricePerMinute;

      // Calculate proper rate based on reasonable hourly rates
      // Most experts should be between 30-120 credits per hour (30,000-120,000 KRW)
      // This means 0.5-2 credits per minute
      let properRate = originalRate;

      // If rate is suspiciously high (over 100 per minute = 100,000 per hour)
      if (originalRate > 100) {
        // Likely the rate was incorrectly set as hourly instead of per-minute
        // Convert back: if it's 425 (thinking it's per hour), it should be ~7 per minute
        properRate = Math.round(originalRate / 60);

        // Ensure it's within reasonable bounds (5-120 per minute)
        if (properRate < 5) properRate = 5;
        if (properRate > 120) properRate = 120;
      } else if (originalRate < 5) {
        // Too low, set to minimum
        properRate = 5;
      }

      // Update if different
      if (properRate !== originalRate) {
        await expert.update({
          pricePerMinute: properRate
        });

        results.push({
          expertId: expert.id,
          userId: expert.userId,
          specialty: expert.specialty,
          originalRate,
          newRate: properRate,
          change: properRate - originalRate,
          hourlyRate: properRate * 60
        });
      } else {
        results.push({
          expertId: expert.id,
          userId: expert.userId,
          specialty: expert.specialty,
          rate: originalRate,
          hourlyRate: originalRate * 60,
          status: 'no_change_needed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed rates for ${results.filter(r => r.change !== undefined).length} experts`,
      totalExperts: experts.length,
      results: results
    });

  } catch (error) {
    console.error('Fix all expert rates error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix expert rates'
    }, { status: 500 });
  }
}