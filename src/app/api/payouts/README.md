# Payouts API

출금 요청을 관리하는 순수 API 엔드포인트입니다. 출금 요청 목록, 상태 변경, CRUD 기능을 제공합니다.

## 엔드포인트

`/api/payouts`

## HTTP 메서드

### GET
출금 요청 목록을 조회합니다.

**쿼리 파라미터:**
- `id`: 특정 ID의 출금 요청 조회
- `status`: 상태로 필터링 (pending, paid, rejected, all)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 1,
        "amount": 1000,
        "fee": 50,
        "requestedAt": "2024-01-20T10:00:00.000Z",
        "status": "pending"
      }
    ],
    "total": 1,
    "pendingCount": 1,
    "paidCount": 0,
    "rejectedCount": 0
  }
}
```

### POST
출금 요청 관리 액션을 실행합니다.

**요청 본문 형식:**
```json
{
  "action": "액션명",
  "data": {
    // 액션별 필요한 데이터
  }
}
```

**지원하는 액션들:**

#### addRequest
새로운 출금 요청을 생성합니다.
```json
{
  "action": "addRequest",
  "data": {
    "amount": 1000,
    "fee": 50
  }
}
```

#### markPaid
출금 요청을 완료 상태로 변경합니다.
```json
{
  "action": "markPaid",
  "data": {
    "id": 1,
    "adminNote": "정상 처리 완료"
  }
}
```

#### reject
출금 요청을 거절 상태로 변경합니다.
```json
{
  "action": "reject",
  "data": {
    "id": 1,
    "reason": "잔액 부족",
    "adminNote": "계좌 잔액 확인 필요"
  }
}
```

#### clearAll
모든 출금 요청을 초기화합니다.
```json
{
  "action": "clearAll",
  "data": {}
}
```

#### initializePayouts
더미 데이터로 출금 요청을 초기화합니다.
```json
{
  "action": "initializePayouts",
  "data": {}
}
```

### PATCH
출금 요청을 부분적으로 업데이트합니다.

**요청 본문 예시:**
```json
{
  "id": 1,
  "updates": {
    "status": "paid",
    "adminNote": "업데이트된 메모"
  }
}
```

### DELETE
출금 요청을 삭제합니다.

**쿼리 파라미터:**
- `id`: 특정 출금 요청 삭제 (없으면 모든 요청 삭제)

**예시:**
- 특정 요청 삭제: `DELETE /api/payouts?id=1`
- 모든 요청 삭제: `DELETE /api/payouts`

## 사용 예시

### React 컴포넌트에서 직접 사용

```tsx
import { useState, useEffect } from 'react';

function PayoutsComponent() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 출금 요청 목록 조회
  const fetchPayouts = async (status = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/payouts?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setPayouts(result.data.requests);
      }
    } catch (error) {
      console.error('출금 요청 조회 실패:', error);
    }
  };

  // 새 출금 요청 생성
  const handleAddRequest = async (amount, fee) => {
    try {
      setLoading(true);
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addRequest',
          data: { amount, fee }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // 출금 요청 목록 새로고침
        await fetchPayouts();
      }
    } catch (error) {
      console.error('출금 요청 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 출금 요청 완료 처리
  const handleMarkPaid = async (id, adminNote) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markPaid',
          data: { id, adminNote }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // 출금 요청 목록 새로고침
        await fetchPayouts();
      }
    } catch (error) {
      console.error('출금 요청 완료 처리 실패:', error);
    }
  };

  // 출금 요청 거절
  const handleReject = async (id, reason, adminNote) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          data: { id, reason, adminNote }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // 출금 요청 목록 새로고침
        await fetchPayouts();
      }
    } catch (error) {
      console.error('출금 요청 거절 실패:', error);
    }
  };

  // 출금 요청 업데이트
  const handleUpdatePayout = async (id, updates) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      const result = await response.json();
      if (result.success) {
        // 출금 요청 목록 새로고침
        await fetchPayouts();
      }
    } catch (error) {
      console.error('출금 요청 업데이트 실패:', error);
    }
  };

  // 출금 요청 삭제
  const handleDeletePayout = async (id) => {
    try {
      const response = await fetch(`/api/payouts?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        // 출금 요청 목록 새로고침
        await fetchPayouts();
      }
    } catch (error) {
      console.error('출금 요청 삭제 실패:', error);
    }
  };

  // 출금 요청 초기화
  const handleInitializePayouts = async () => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initializePayouts',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setPayouts(result.data.requests);
      }
    } catch (error) {
      console.error('출금 요청 초기화 실패:', error);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  return (
    <div>
      <h2>출금 요청 관리</h2>
      
      {/* 출금 요청 초기화 */}
      <div>
        <button onClick={handleInitializePayouts}>
          더미 데이터로 초기화
        </button>
      </div>

      {/* 새 출금 요청 폼 */}
      <div>
        <h3>새 출금 요청 생성</h3>
        <button 
          onClick={() => handleAddRequest(1000, 50)}
          disabled={loading}
        >
          {loading ? '처리 중...' : '1000 크레딧 출금 요청 (수수료 50)'}
        </button>
      </div>

      {/* 출금 요청 목록 */}
      <div>
        <h3>출금 요청 목록</h3>
        {payouts.map(payout => (
          <div key={payout.id}>
            <h4>출금 요청 #{payout.id}</h4>
            <p>금액: {payout.amount} 크레딧</p>
            <p>수수료: {payout.fee} 크레딧</p>
            <p>상태: {payout.status}</p>
            <p>요청일: {new Date(payout.requestedAt).toLocaleDateString()}</p>
            
            {payout.status === 'pending' && (
              <div>
                <button onClick={() => handleMarkPaid(payout.id, '정상 처리 완료')}>
                  완료 처리
                </button>
                <button onClick={() => handleReject(payout.id, '잔액 부족', '계좌 잔액 확인 필요')}>
                  거절
                </button>
              </div>
            )}
            
            {payout.status === 'paid' && (
              <p>처리 완료: {new Date(payout.processedAt).toLocaleDateString()}</p>
            )}
            
            {payout.status === 'rejected' && (
              <p>거절 사유: {payout.reason}</p>
            )}
            
            <button onClick={() => handleUpdatePayout(payout.id, {
              adminNote: "업데이트된 메모"
            })}>
              메모 업데이트
            </button>
            
            <button onClick={() => handleDeletePayout(payout.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* 필터링 */}
      <div>
        <h3>필터링</h3>
        <button onClick={() => fetchPayouts('pending')}>
          대기 중인 요청만
        </button>
        <button onClick={() => fetchPayouts('paid')}>
          완료된 요청만
        </button>
        <button onClick={() => fetchPayouts('rejected')}>
          거절된 요청만
        </button>
        <button onClick={() => fetchPayouts()}>
          전체 보기
        </button>
      </div>
    </div>
  );
}
```

### 유틸리티 함수로 분리

```typescript
// utils/payoutsAPI.ts
export const payoutsAPI = {
  // 출금 요청 목록 조회
  async getPayouts(status = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`/api/payouts?${params}`);
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 특정 출금 요청 조회
  async getPayout(id: number) {
    const response = await fetch(`/api/payouts?id=${id}`);
    const result = await response.json();
    return result.success ? result.data.request : null;
  },

  // 액션 실행
  async executeAction(action: string, data: any = {}) {
    const response = await fetch('/api/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 편의 메서드들
  addRequest: (amount: number, fee: number) => payoutsAPI.executeAction('addRequest', { amount, fee }),
  markPaid: (id: number, adminNote?: string) => payoutsAPI.executeAction('markPaid', { id, adminNote }),
  reject: (id: number, reason: string, adminNote?: string) => payoutsAPI.executeAction('reject', { id, reason, adminNote }),
  clearAll: () => payoutsAPI.executeAction('clearAll'),
  initializePayouts: () => payoutsAPI.executeAction('initializePayouts'),

  // 부분 업데이트
  async updatePayout(id: number, updates: any) {
    const response = await fetch('/api/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 삭제
  async deletePayout(id?: number) {
    const url = id ? `/api/payouts?id=${id}` : '/api/payouts';
    const response = await fetch(url, { method: 'DELETE' });
    
    const result = await response.json();
    return result.success ? result.data : null;
  }
};

// 사용 예시
const handleAddPayout = async () => {
  const result = await payoutsAPI.addRequest(1000, 50);
  if (result) {
    console.log('출금 요청이 생성되었습니다:', result.request);
  }
};

const handleCompletePayout = async () => {
  const result = await payoutsAPI.markPaid(1, '정상 처리 완료');
  if (result) {
    console.log('출금 요청이 완료 처리되었습니다:', result.request);
  }
};
```

## 장점

1. **단순함**: 복잡한 상태 관리 라이브러리 불필요
2. **유지보수성**: API만 관리하면 되므로 간단
3. **확장성**: 필요에 따라 쉽게 기능 추가/수정
4. **명확성**: 데이터 흐름이 명확하고 예측 가능
5. **테스트 용이성**: API 엔드포인트만 테스트하면 됨
6. **상태 관리**: 출금 요청의 전체 생명주기 관리
7. **통계 정보**: 상태별 개수 및 총 개수 제공

## 주의사항

1. **메모리 기반 저장**: 현재 구현은 메모리 기반이므로 서버 재시작 시 상태가 초기화됩니다.
2. **프로덕션 환경**: 실제 프로덕션에서는 데이터베이스를 사용하여 상태를 영구 저장하는 것을 권장합니다.
3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 구현해야 합니다.
4. **상태 동기화**: 클라이언트에서 상태 변경 후 UI 업데이트를 위해 별도 처리가 필요합니다.
5. **비즈니스 로직**: 출금 요청의 상태 변경 시 적절한 검증이 필요합니다.

## 마이그레이션 가이드

기존 Zustand 스토어에서 API 기반으로 마이그레이션하는 방법:

1. `usePayoutsStore` 제거
2. 컴포넌트에서 직접 `fetch` 사용
3. 상태 변경 후 `setState`로 로컬 상태 업데이트
4. 에러 처리 및 로딩 상태 관리 추가
