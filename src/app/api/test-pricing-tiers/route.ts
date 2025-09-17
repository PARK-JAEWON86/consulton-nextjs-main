import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test pricing tier calculations for different hourlyRates
    const testRates = [300, 360, 420, 480, 600, 900, 1200];

    const results = testRates.map(hourlyRate => {
      const pricingTiers = [
        {
          duration: 30,
          price: Math.round(hourlyRate * 0.5),
          description: "기본 상담",
          credits: Math.round(hourlyRate * 0.5),
          krw: Math.round(hourlyRate * 0.5) * 10
        },
        {
          duration: 60,
          price: hourlyRate,
          description: "상세 상담",
          credits: hourlyRate,
          krw: hourlyRate * 10
        },
        {
          duration: 90,
          price: Math.round(hourlyRate * 1.5),
          description: "종합 상담",
          credits: Math.round(hourlyRate * 1.5),
          krw: Math.round(hourlyRate * 1.5) * 10
        }
      ];

      return {
        hourlyRate,
        hourlyRateKRW: hourlyRate * 10,
        pricePerMinute: Math.round(hourlyRate / 60 * 10) / 10,
        pricingTiers
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing tier calculations test results',
      testResults: results
    });

  } catch (error) {
    console.error('Pricing tier test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test pricing tiers'
    }, { status: 500 });
  }
}