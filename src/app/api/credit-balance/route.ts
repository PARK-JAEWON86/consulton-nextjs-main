import { NextRequest, NextResponse } from 'next/server';

// GET: 사용자의 현재 크레딧 잔액 조회
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 사용자 정보입니다.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    
    // 실제 프로덕션에서는 데이터베이스에서 크레딧 잔액을 조회해야 함
    // 현재는 기본값 반환
    const currentBalance = 0;
    const recentTransactions: any[] = [];
    
    return NextResponse.json({
      success: true,
      data: {
        currentBalance,
        recentTransactions,
        summary: {
          totalEarned: 0,
          totalSpent: 0,
          totalRefunded: 0,
          totalTransactions: 0
        }
      }
    });

  } catch (error) {
    console.error('크레딧 잔액 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 크레딧 잔액 업데이트
export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 사용자 정보입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, amount, description } = body;

    if (!action || !amount || !description) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 실제 프로덕션에서는 데이터베이스에 크레딧 거래를 기록해야 함
    // 현재는 성공 응답만 반환
    return NextResponse.json({
      success: true,
      message: '크레딧 잔액이 업데이트되었습니다.',
      data: {
        action,
        amount,
        description,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('크레딧 잔액 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
