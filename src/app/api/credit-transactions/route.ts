import { NextRequest, NextResponse } from 'next/server';

// 크레딧 거래 내역 인터페이스
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'refund' | 'expire';
  amount: number;
  balance: number;
  description: string;
  consultationId?: string;
  createdAt: string;
}

// GET: 사용자의 크레딧 거래 내역 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.email;
    } catch {
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 처리
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // 페이지네이션 제한
    const maxLimit = Math.min(limit, 100); // 최대 100건까지 조회 가능
    const offset = (page - 1) * maxLimit;
    
    // 실제 프로덕션에서는 데이터베이스에서 크레딧 거래 내역을 조회해야 함
    // 현재는 빈 배열 반환
    const userCreditTransactions: CreditTransaction[] = [];
    
    // 필터링 적용
    let filteredTransactions = userCreditTransactions;
    
    if (type) {
      filteredTransactions = filteredTransactions.filter(transaction => transaction.type === type);
    }
    
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        new Date(transaction.createdAt) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        new Date(transaction.createdAt) <= new Date(endDate)
      );
    }
    
    // 총 개수
    const totalCount = filteredTransactions.length;
    
    // 페이지네이션 적용
    const paginatedTransactions = filteredTransactions.slice(offset, offset + maxLimit);
    
    // 통계 정보 계산
    const totalEarned = filteredTransactions
      .filter(transaction => transaction.type === 'earn')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const totalSpent = filteredTransactions
      .filter(transaction => transaction.type === 'spend')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    const totalRefunded = filteredTransactions
      .filter(transaction => transaction.type === 'refund')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const currentBalance = filteredTransactions.length > 0 
      ? filteredTransactions[filteredTransactions.length - 1].balance 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit: maxLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / maxLimit)
        },
        summary: {
          currentBalance,
          totalEarned,
          totalSpent,
          totalRefunded,
          totalTransactions: totalCount
        }
      }
    });

  } catch (error) {
    console.error('크레딧 거래 내역 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새로운 크레딧 거래 추가
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.email;
    } catch {
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, description, consultationId } = body;

    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 실제 프로덕션에서는 데이터베이스에 크레딧 거래를 저장해야 함
    // 현재는 성공 응답만 반환
    const newTransaction: CreditTransaction = {
      id: Date.now().toString(),
      userId,
      type,
      amount,
      balance: 0, // 실제로는 이전 잔액 + amount로 계산
      description,
      consultationId,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: '크레딧 거래가 추가되었습니다.',
      data: newTransaction
    }, { status: 201 });

  } catch (error) {
    console.error('크레딧 거래 추가 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


