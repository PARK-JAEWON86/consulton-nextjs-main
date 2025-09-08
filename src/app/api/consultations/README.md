# Consultations API

상담 내역을 관리하는 순수 API 엔드포인트입니다. 상담 아이템 목록, 현재 진행 중인 상담, 상담 추가/완료/업데이트 기능을 제공합니다.

## 엔드포인트

`/api/consultations`

## HTTP 메서드

### GET
상담 내역을 조회합니다.

**쿼리 파라미터:**
- `expertId`: 전문가 ID로 필터링
- `status`: 상담 상태로 필터링 (completed, scheduled, canceled, all)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "date": "2024-01-15T10:00:00.000Z",
        "customer": "김철수",
        "topic": "비즈니스 컨설팅",
        "amount": 100,
        "status": "completed",
        "method": "chat",
        "duration": 30,
        "summary": "30분 채팅 상담 완료"
      }
    ],
    "currentConsultationId": null,
    "total": 1
  }
}
```

### POST
상담 내역 관리 액션을 실행합니다.

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

#### addScheduled
새로운 상담을 예약 상태로 추가합니다.
```json
{
  "action": "addScheduled",
  "data": {
    "customer": "김철수",
    "topic": "비즈니스 컨설팅",
    "amount": 100,
    "date": "2024-01-20T10:00:00.000Z",
    "method": "video",
    "duration": 60,
    "summary": "1시간 화상 상담"
  }
}
```

#### updateCurrent
현재 진행 중인 상담 정보를 업데이트합니다.
```json
{
  "action": "updateCurrent",
  "data": {
    "duration": 45,
    "summary": "상담 내용 요약",
    "amount": 150
  }
}
```

#### updateById
특정 ID의 상담 정보를 업데이트합니다.
```json
{
  "action": "updateById",
  "data": {
    "id": 1,
    "payload": {
      "duration": 45,
      "summary": "업데이트된 요약"
    }
  }
}
```

#### completeCurrent
현재 진행 중인 상담을 완료 상태로 변경합니다.
```json
{
  "action": "completeCurrent",
  "data": {}
}
```

#### markCompleted
특정 ID의 상담을 완료 상태로 변경합니다.
```json
{
  "action": "markCompleted",
  "data": {
    "id": 1
  }
}
```

#### clearCurrent
현재 진행 중인 상담을 초기화합니다.
```json
{
  "action": "clearCurrent",
  "data": {}
}
```

#### clearAll
모든 상담 내역을 초기화합니다.
```json
{
  "action": "clearAll",
  "data": {}
}
```

#### loadExpertConsultations
전문가별 상담 내역을 로드합니다.
```json
{
  "action": "loadExpertConsultations",
  "data": {
    "expertId": 123
  }
}
```

### PATCH
상담 정보를 부분적으로 업데이트합니다.

**요청 본문 예시:**
```json
{
  "id": 1,
  "updates": {
    "duration": 45,
    "summary": "업데이트된 요약",
    "notes": "추가 메모"
  }
}
```

### DELETE
상담 내역을 삭제합니다.

**쿼리 파라미터:**
- `id`: 특정 상담 삭제 (없으면 모든 상담 삭제)

**예시:**
- 특정 상담 삭제: `DELETE /api/consultations?id=1`
- 모든 상담 삭제: `DELETE /api/consultations`

## 사용 예시

### React 컴포넌트에서 직접 사용

```tsx
import { useState, useEffect } from 'react';

function ConsultationsComponent() {
  const [consultations, setConsultations] = useState([]);
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 상담 내역 조회
  const fetchConsultations = async (expertId = null, status = null) => {
    try {
      const params = new URLSearchParams();
      if (expertId) params.append('expertId', expertId);
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/consultations?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setConsultations(result.data.items);
        setCurrentConsultationId(result.data.currentConsultationId);
      }
    } catch (error) {
      console.error('상담 내역 조회 실패:', error);
    }
  };

  // 새 상담 예약
  const handleAddConsultation = async (consultationData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addScheduled',
          data: consultationData
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setCurrentConsultationId(result.data.currentConsultationId);
        // 상담 내역 새로고침
        await fetchConsultations();
      }
    } catch (error) {
      console.error('상담 예약 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 현재 상담 완료
  const handleCompleteCurrent = async () => {
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeCurrent',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setCurrentConsultationId(null);
        // 상담 내역 새로고침
        await fetchConsultations();
      }
    } catch (error) {
      console.error('상담 완료 실패:', error);
    }
  };

  // 상담 정보 업데이트
  const handleUpdateConsultation = async (id, updates) => {
    try {
      const response = await fetch('/api/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      const result = await response.json();
      if (result.success) {
        // 상담 내역 새로고침
        await fetchConsultations();
      }
    } catch (error) {
      console.error('상담 업데이트 실패:', error);
    }
  };

  // 상담 삭제
  const handleDeleteConsultation = async (id) => {
    try {
      const response = await fetch(`/api/consultations?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        // 상담 내역 새로고침
        await fetchConsultations();
      }
    } catch (error) {
      console.error('상담 삭제 실패:', error);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return (
    <div>
      <h2>상담 내역</h2>
      
      {/* 새 상담 예약 폼 */}
      <div>
        <h3>새 상담 예약</h3>
        <button 
          onClick={() => handleAddConsultation({
            customer: "새 고객",
            topic: "상담 주제",
            amount: 100,
            method: "chat",
            duration: 30
          })}
          disabled={loading}
        >
          {loading ? '처리 중...' : '상담 예약'}
        </button>
      </div>

      {/* 현재 진행 중인 상담 */}
      {currentConsultationId && (
        <div>
          <h3>진행 중인 상담</h3>
          <p>상담 ID: {currentConsultationId}</p>
          <button onClick={handleCompleteCurrent}>
            상담 완료
          </button>
        </div>
      )}

      {/* 상담 목록 */}
      <div>
        <h3>상담 목록</h3>
        {consultations.map(consultation => (
          <div key={consultation.id}>
            <h4>{consultation.topic}</h4>
            <p>고객: {consultation.customer}</p>
            <p>상태: {consultation.status}</p>
            <p>금액: {consultation.amount} 크레딧</p>
            <p>방법: {consultation.method}</p>
            <p>소요시간: {consultation.duration}분</p>
            
            <button onClick={() => handleUpdateConsultation(consultation.id, {
              summary: "업데이트된 요약"
            })}>
              요약 업데이트
            </button>
            
            <button onClick={() => handleDeleteConsultation(consultation.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* 필터링 */}
      <div>
        <h3>필터링</h3>
        <button onClick={() => fetchConsultations(null, 'completed')}>
          완료된 상담만
        </button>
        <button onClick={() => fetchConsultations(null, 'scheduled')}>
          예약된 상담만
        </button>
        <button onClick={() => fetchConsultations(null, 'canceled')}>
          취소된 상담만
        </button>
        <button onClick={() => fetchConsultations()}>
          전체 보기
        </button>
      </div>
    </div>
  );
}
```

### 유틸리티 함수로 분리

```typescript
// utils/consultationsAPI.ts
export const consultationsAPI = {
  // 상담 내역 조회
  async getConsultations(expertId = null, status = null) {
    const params = new URLSearchParams();
    if (expertId) params.append('expertId', expertId);
    if (status) params.append('status', status);
    
    const response = await fetch(`/api/consultations?${params}`);
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 액션 실행
  async executeAction(action: string, data: any = {}) {
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 편의 메서드들
  addScheduled: (data: any) => consultationsAPI.executeAction('addScheduled', data),
  updateCurrent: (data: any) => consultationsAPI.executeAction('updateCurrent', data),
  updateById: (id: number, payload: any) => consultationsAPI.executeAction('updateById', { id, payload }),
  completeCurrent: () => consultationsAPI.executeAction('completeCurrent'),
  markCompleted: (id: number) => consultationsAPI.executeAction('markCompleted', { id }),
  clearCurrent: () => consultationsAPI.executeAction('clearCurrent'),
  clearAll: () => consultationsAPI.executeAction('clearAll'),
  loadExpertConsultations: (expertId: number) => consultationsAPI.executeAction('loadExpertConsultations', { expertId }),

  // 부분 업데이트
  async updateConsultation(id: number, updates: any) {
    const response = await fetch('/api/consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 삭제
  async deleteConsultation(id?: number) {
    const url = id ? `/api/consultations?id=${id}` : '/api/consultations';
    const response = await fetch(url, { method: 'DELETE' });
    
    const result = await response.json();
    return result.success ? result.data : null;
  }
};

// 사용 예시
const handleAddConsultation = async () => {
  const result = await consultationsAPI.addScheduled({
    customer: "김철수",
    topic: "비즈니스 컨설팅",
    amount: 100,
    method: "video",
    duration: 60
  });
  
  if (result) {
    console.log('상담이 예약되었습니다:', result.consultation);
  }
};
```

## 장점

1. **단순함**: 복잡한 상태 관리 라이브러리 불필요
2. **유지보수성**: API만 관리하면 되므로 간단
3. **확장성**: 필요에 따라 쉽게 기능 추가/수정
4. **명확성**: 데이터 흐름이 명확하고 예측 가능
5. **테스트 용이성**: API 엔드포인트만 테스트하면 됨
6. **필터링**: 전문가별, 상태별 필터링 지원

## 주의사항

1. **메모리 기반 저장**: 현재 구현은 메모리 기반이므로 서버 재시작 시 상태가 초기화됩니다.
2. **프로덕션 환경**: 실제 프로덕션에서는 데이터베이스를 사용하여 상태를 영구 저장하는 것을 권장합니다.
3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 구현해야 합니다.
4. **상태 동기화**: 클라이언트에서 상태 변경 후 UI 업데이트를 위해 별도 처리가 필요합니다.

## 마이그레이션 가이드

기존 Zustand 스토어에서 API 기반으로 마이그레이션하는 방법:

1. `useConsultationsStore` 제거
2. 컴포넌트에서 직접 `fetch` 사용
3. 상태 변경 후 `setState`로 로컬 상태 업데이트
4. 에러 처리 및 로딩 상태 관리 추가
