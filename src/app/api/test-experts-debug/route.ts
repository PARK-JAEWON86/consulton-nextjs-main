import { NextRequest, NextResponse } from 'next/server';
import { Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    // 모든 전문가 조회
    const experts = await Expert.findAll({
      limit: 5
    });

    console.log('전문가 조회 결과:', experts.length);

    const result = {
      success: true,
      totalCount: experts.length,
      sampleExperts: experts.map(expert => ({
        id: expert.id,
        specialty: expert.specialty,
        pricePerMinute: expert.pricePerMinute,
        hourlyRate: expert.pricePerMinute * 60,
        level: expert.experience || 1
      }))
    };

    console.log('API 응답:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('전문가 디버그 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}