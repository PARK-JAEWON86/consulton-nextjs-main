import { NextRequest, NextResponse } from 'next/server';
import { 
  seedAllEmptyTables, 
  seedSpecificTable,
  seedAiUsages,
  seedExpertAvailability,
  seedConsultationSessions,
  seedConsultationSummaries,
  seedPayments,
  seedNotifications,
  seedPaymentMethods
} from '@/lib/db/seedEmptyTables';

// POST: 모든 빈 테이블에 데이터 생성
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const action = searchParams.get('action') || 'all';
    
    let result;
    
    if (action === 'all') {
      // 모든 빈 테이블에 데이터 생성
      result = await seedAllEmptyTables();
    } else if (action === 'specific' && tableName) {
      // 특정 테이블에만 데이터 생성
      result = await seedSpecificTable(tableName);
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: '잘못된 요청입니다. action=all 또는 action=specific&table=테이블명을 사용하세요.' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '데이터 생성이 완료되었습니다.',
      data: result
    });
    
  } catch (error) {
    console.error('데이터 생성 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '데이터 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// GET: 사용 가능한 테이블 목록 조회
export async function GET(request: NextRequest) {
  try {
    const availableTables = [
      {
        name: 'ai_usages',
        description: 'AI 사용량 추적 데이터',
        function: 'seedAiUsages'
      },
      {
        name: 'expert_availability',
        description: '전문가 가용성 데이터',
        function: 'seedExpertAvailability'
      },
      {
        name: 'consultation_sessions',
        description: '상담 세션 데이터',
        function: 'seedConsultationSessions'
      },
      {
        name: 'consultation_summaries',
        description: '상담 요약 데이터',
        function: 'seedConsultationSummaries'
      },
      {
        name: 'payments',
        description: '결제 내역 데이터',
        function: 'seedPayments'
      },
      {
        name: 'notifications',
        description: '알림 데이터',
        function: 'seedNotifications'
      },
      {
        name: 'payment_methods',
        description: '결제 수단 데이터',
        function: 'seedPaymentMethods'
      }
    ];
    
    return NextResponse.json({
      success: true,
      message: '사용 가능한 테이블 목록',
      tables: availableTables,
      usage: {
        all: 'POST /api/seed-data?action=all - 모든 테이블에 데이터 생성',
        specific: 'POST /api/seed-data?action=specific&table=테이블명 - 특정 테이블에만 데이터 생성'
      }
    });
    
  } catch (error) {
    console.error('테이블 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '테이블 목록 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
