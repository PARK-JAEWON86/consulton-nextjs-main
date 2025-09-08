/**
 * 세션 완료 처리 API
 * POST /api/sessions/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryContainer } from '../../../../config/SettlementConfig';
import { PaymentService } from '../../../../services/payment/PaymentService';
import { SettlementError } from '../../../../types/settlement';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const {
      sessionId,
      clientId,
      expertId,
      startedAt,
      endedAt,
      durationMin,
      ratePerMinKrw
    } = body;

    // 필수 파라미터 검증
    if (!sessionId || !clientId || !expertId || !startedAt || !endedAt || !durationMin || !ratePerMinKrw) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          code: 'MISSING_PARAMETER',
          required: ['sessionId', 'clientId', 'expertId', 'startedAt', 'endedAt', 'durationMin', 'ratePerMinKrw']
        },
        { status: 400 }
      );
    }

    // 데이터 타입 검증
    if (typeof durationMin !== 'number' || durationMin <= 0) {
      return NextResponse.json(
        { error: 'Invalid durationMin: must be a positive number', code: 'INVALID_PARAMETER' },
        { status: 400 }
      );
    }

    if (typeof ratePerMinKrw !== 'number' || ratePerMinKrw <= 0) {
      return NextResponse.json(
        { error: 'Invalid ratePerMinKrw: must be a positive number', code: 'INVALID_PARAMETER' },
        { status: 400 }
      );
    }

    if (typeof startedAt !== 'number' || typeof endedAt !== 'number') {
      return NextResponse.json(
        { error: 'Invalid timestamps: must be numbers', code: 'INVALID_PARAMETER' },
        { status: 400 }
      );
    }

    // 서비스 초기화
    const repos = getRepositoryContainer();
    const paymentService = new PaymentService(repos);

    // 세션 완료 처리
    const result = await paymentService.completeSession({
      sessionId,
      clientId,
      expertId,
      startedAt,
      endedAt,
      durationMin,
      ratePerMinKrw
    });

    // 상담 세션 완료로 인한 전문가 통계 업데이트 로그
    console.log(`전문가 ${expertId}의 상담 세션 완료: ${durationMin}분, 세션 ID: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Session completion error:', error);

    if (error instanceof SettlementError) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code,
          context: error.context 
        },
        { status: error.code === 'INSUFFICIENT_CREDITS' ? 402 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
