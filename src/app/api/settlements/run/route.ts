/**
 * 정산 배치 실행 API
 * POST /api/settlements/run?month=YYYY-MM
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryContainer } from '../../../../config/SettlementConfig';
import { SettlementService } from '../../../../services/settlement/SettlementService';
import { SettlementError } from '../../../../types/settlement';

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인 (실제 구현에서는 JWT 토큰 검증 등)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const dryRun = searchParams.get('dryRun') === 'true';

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)', code: 'MISSING_PARAMETER' },
        { status: 400 }
      );
    }

    // 서비스 초기화
    const repos = getRepositoryContainer();
    const settlementService = new SettlementService(repos);

    // 정산 실행
    const result = await settlementService.runMonthlySettlement({
      month,
      dryRun
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Settlement run error:', error);

    if (error instanceof SettlementError) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code,
          context: error.context 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// 개발 환경에서만 GET 메서드로 테스트 가능
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Method not allowed in production', code: 'METHOD_NOT_ALLOWED' },
      { status: 405 }
    );
  }

  // GET으로 호출된 경우 POST로 리다이렉트
  return POST(request);
}
