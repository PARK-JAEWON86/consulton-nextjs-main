import { NextRequest, NextResponse } from 'next/server';

export interface PayoutRequest {
  id: number;
  amount: number; // credits
  fee: number; // credits deducted as fee
  requestedAt: string; // ISO
  status: "pending" | "paid" | "rejected";
  reason?: string; // 거절 사유
  processedAt?: string; // 처리 완료 시간
  adminNote?: string; // 관리자 메모
}

interface PayoutsState {
  requests: PayoutRequest[];
}

// 메모리 기반 상태 저장 (실제 프로덕션에서는 데이터베이스 사용 권장)
let payoutsState: PayoutsState = {
  requests: [],
};

// GET: 출금 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    if (id) {
      // 특정 ID의 출금 요청 조회
      const request = payoutsState.requests.find(r => r.id === parseInt(id));
      if (!request) {
        return NextResponse.json(
          { success: false, error: '출금 요청을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { request }
      });
    }
    
    let filteredRequests = payoutsState.requests;
    
    // 상태로 필터링
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }
    
    // 최신 요청부터 정렬
    filteredRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    
    return NextResponse.json({
      success: true,
      data: {
        requests: filteredRequests,
        total: filteredRequests.length,
        pendingCount: payoutsState.requests.filter(r => r.status === 'pending').length,
        paidCount: payoutsState.requests.filter(r => r.status === 'paid').length,
        rejectedCount: payoutsState.requests.filter(r => r.status === 'rejected').length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '출금 요청 조회 실패' },
      { status: 500 }
    );
  }
}

// POST: 출금 요청 관리 액션
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'addRequest':
        const newRequest: PayoutRequest = {
          id: Date.now(),
          amount: data.amount,
          fee: data.fee || 0,
          requestedAt: new Date().toISOString(),
          status: "pending",
        };
        
        payoutsState.requests = [newRequest, ...payoutsState.requests];
        
        return NextResponse.json({
          success: true,
          data: {
            request: newRequest,
            message: '출금 요청이 생성되었습니다.'
          }
        });

      case 'markPaid':
        const paidId = data.id;
        const paidRequest = payoutsState.requests.find(r => r.id === paidId);
        
        if (!paidRequest) {
          return NextResponse.json(
            { success: false, error: '출금 요청을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }
        
        if (paidRequest.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: '대기 중인 출금 요청만 완료 처리할 수 있습니다.' },
            { status: 400 }
          );
        }
        
        paidRequest.status = 'paid';
        paidRequest.processedAt = new Date().toISOString();
        paidRequest.adminNote = data.adminNote;
        
        return NextResponse.json({
          success: true,
          data: {
            request: paidRequest,
            message: '출금 요청이 완료 처리되었습니다.'
          }
        });

      case 'reject':
        const rejectedId = data.id;
        const rejectedRequest = payoutsState.requests.find(r => r.id === rejectedId);
        
        if (!rejectedRequest) {
          return NextResponse.json(
            { success: false, error: '출금 요청을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }
        
        if (rejectedRequest.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: '대기 중인 출금 요청만 거절할 수 있습니다.' },
            { status: 400 }
          );
        }
        
        rejectedRequest.status = 'rejected';
        rejectedRequest.processedAt = new Date().toISOString();
        rejectedRequest.reason = data.reason;
        rejectedRequest.adminNote = data.adminNote;
        
        return NextResponse.json({
          success: true,
          data: {
            request: rejectedRequest,
            message: '출금 요청이 거절되었습니다.'
          }
        });

      case 'clearAll':
        payoutsState.requests = [];
        
        return NextResponse.json({
          success: true,
          data: {
            message: '모든 출금 요청이 초기화되었습니다.'
          }
        });

      case 'initializePayouts':
        // 더미 데이터로 초기화
        const dummyRequests: PayoutRequest[] = [
          {
            id: 1,
            amount: 1000,
            fee: 50,
            requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
            status: "pending",
          },
          {
            id: 2,
            amount: 500,
            fee: 25,
            requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
            status: "paid",
            processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            adminNote: "정상 처리 완료"
          },
          {
            id: 3,
            amount: 2000,
            fee: 100,
            requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
            status: "rejected",
            processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            reason: "잔액 부족",
            adminNote: "계좌 잔액 확인 필요"
          }
        ];
        
        payoutsState.requests = dummyRequests;
        
        return NextResponse.json({
          success: true,
          data: {
            requests: dummyRequests,
            message: '출금 요청이 더미 데이터로 초기화되었습니다.'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '출금 요청 관리 실패' },
      { status: 500 }
    );
  }
}

// PATCH: 출금 요청 부분 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '출금 요청 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const payoutRequest = payoutsState.requests.find(r => r.id === id);
    if (!payoutRequest) {
      return NextResponse.json(
        { success: false, error: '업데이트할 출금 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 상태 변경 시 추가 정보 설정
    if (updates.status && updates.status !== payoutRequest.status) {
      if (updates.status === 'paid' || updates.status === 'rejected') {
        updates.processedAt = new Date().toISOString();
      }
    }
    
    Object.assign(payoutRequest, updates);
    
    return NextResponse.json({
      success: true,
      data: {
        request: payoutRequest,
        message: '출금 요청이 업데이트되었습니다.'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '출금 요청 업데이트 실패' },
      { status: 500 }
    );
  }
}

// DELETE: 출금 요청 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // 특정 출금 요청 삭제
      const requestId = parseInt(id);
      const requestIndex = payoutsState.requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        return NextResponse.json(
          { success: false, error: '삭제할 출금 요청을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      const deletedRequest = payoutsState.requests.splice(requestIndex, 1)[0];
      
      return NextResponse.json({
        success: true,
        data: {
          deletedRequest,
          message: '출금 요청이 삭제되었습니다.'
        }
      });
    } else {
      // 모든 출금 요청 삭제
      const deletedCount = payoutsState.requests.length;
      payoutsState.requests = [];
      
      return NextResponse.json({
        success: true,
        data: {
          deletedCount,
          message: '모든 출금 요청이 삭제되었습니다.'
        }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '출금 요청 삭제 실패' },
      { status: 500 }
    );
  }
}
