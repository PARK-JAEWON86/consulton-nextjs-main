# Platform Stats API

플랫폼 통계를 관리하는 순수 API 엔드포인트입니다. 플랫폼 전체 통계, 매칭 기록, 평균 매칭 시간, 통계 업데이트/로드/저장 기능을 제공합니다.

## 엔드포인트

`/api/stats`

## HTTP 메서드

### GET
플랫폼 통계를 조회합니다.

**쿼리 파라미터:**
- `includeMatchingRecords`: 매칭 기록 포함 여부 (true/false)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1250,
      "totalExperts": 85,
      "totalConsultations": 3200,
      "totalRevenue": 12500000,
      "averageConsultationRating": 4.7,
      "averageMatchingTimeMinutes": 3,
      "monthlyActiveUsers": 450,
      "monthlyActiveExperts": 65,
      "consultationCompletionRate": 92,
      "userSatisfactionScore": 4.6,
      "lastUpdated": "2024-01-21T10:00:00.000Z"
    },
    "summary": {
      "totalUsers": 1250,
      "totalExperts": 85,
      "totalConsultations": 3200,
      "averageMatchingTime": "3분",
      "completionRate": "92%",
      "satisfactionScore": "4.6/5"
    }
  }
}
```

### POST
통계 관리 액션을 실행합니다.

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

#### updateStats
통계를 업데이트합니다.
```json
{
  "action": "updateStats",
  "data": {
    "update": {
      "type": "consultation_completed"
    }
  }
}
```

#### recordMatching
매칭 기록을 저장하고 평균 매칭 시간을 계산합니다.
```json
{
  "action": "recordMatching",
  "data": {
    "userId": "user_123",
    "expertId": "expert_456",
    "matchingTimeMinutes": 5
  }
}
```

#### completeConsultation
상담 완료 통계를 업데이트합니다.
```json
{
  "action": "completeConsultation",
  "data": {}
}
```

#### registerExpert
전문가 등록 통계를 업데이트합니다.
```json
{
  "action": "registerExpert",
  "data": {}
}
```

#### registerUser
사용자 등록 통계를 업데이트합니다.
```json
{
  "action": "registerUser",
  "data": {}
}
```

#### updateMetrics
메트릭을 업데이트합니다.
```json
{
  "action": "updateMetrics",
  "data": {
    "completionRate": 95,
    "satisfactionScore": 4.8,
    "monthlyActiveUsers": 500,
    "monthlyActiveExperts": 70
  }
}
```

#### resetStats
통계를 초기화합니다.
```json
{
  "action": "resetStats",
  "data": {}
}
```

#### initializeStats
더미 데이터로 통계를 초기화합니다.
```json
{
  "action": "initializeStats",
  "data": {}
}
```

### PATCH
통계를 부분적으로 업데이트합니다.

**요청 본문 예시:**
```json
{
  "updates": {
    "totalRevenue": 15000000,
    "averageConsultationRating": 4.8,
    "monthlyActiveUsers": 500
  }
}
```

### DELETE
모든 통계를 초기화합니다.

## 사용 예시

### React 컴포넌트에서 직접 사용

```tsx
import { useState, useEffect } from 'react';

function StatsComponent() {
  const [stats, setStats] = useState(null);
  const [matchingRecords, setMatchingRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 통계 조회
  const fetchStats = async (includeMatchingRecords = false) => {
    try {
      const params = new URLSearchParams();
      if (includeMatchingRecords) params.append('includeMatchingRecords', 'true');
      
      const response = await fetch(`/api/stats?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data.stats);
        if (result.data.matchingRecords) {
          setMatchingRecords(result.data.matchingRecords);
        }
      }
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  // 상담 완료
  const handleCompleteConsultation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeConsultation',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('상담 완료 처리 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 전문가 등록
  const handleRegisterExpert = async () => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registerExpert',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('전문가 등록 처리 실패:', error);
    }
  };

  // 사용자 등록
  const handleRegisterUser = async () => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registerUser',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('사용자 등록 처리 실패:', error);
    }
  };

  // 매칭 기록
  const handleRecordMatching = async (userId, expertId, matchingTimeMinutes) => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordMatching',
          data: { userId, expertId, matchingTimeMinutes }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
        // 매칭 기록 새로고침
        await fetchStats(true);
      }
    } catch (error) {
      console.error('매칭 기록 저장 실패:', error);
    }
  };

  // 메트릭 업데이트
  const handleUpdateMetrics = async (metrics) => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMetrics',
          data: metrics
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('메트릭 업데이트 실패:', error);
    }
  };

  // 통계 초기화
  const handleInitializeStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initializeStats',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
        setMatchingRecords(result.data.matchingRecords);
      }
    } catch (error) {
      console.error('통계 초기화 실패:', error);
    }
  };

  // 통계 리셋
  const handleResetStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetStats',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats({
          totalUsers: 0,
          totalExperts: 0,
          totalConsultations: 0,
          totalRevenue: 0,
          averageConsultationRating: 0,
          averageMatchingTimeMinutes: 0,
          monthlyActiveUsers: 0,
          monthlyActiveExperts: 0,
          consultationCompletionRate: 0,
          userSatisfactionScore: 0,
          lastUpdated: new Date().toISOString(),
        });
        setMatchingRecords([]);
      }
    } catch (error) {
      console.error('통계 리셋 실패:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>플랫폼 통계</h2>
      
      {/* 통계 초기화 */}
      <div>
        <button onClick={handleInitializeStats}>
          더미 데이터로 초기화
        </button>
        <button onClick={handleResetStats}>
          통계 리셋
        </button>
      </div>

      {/* 통계 표시 */}
      <div>
        <h3>플랫폼 개요</h3>
        <div>
          <p>총 사용자: {stats.totalUsers}명</p>
          <p>총 전문가: {stats.totalExperts}명</p>
          <p>총 상담: {stats.totalConsultations}건</p>
          <p>총 매출: {stats.totalRevenue.toLocaleString()}원</p>
          <p>평균 상담 평점: {stats.averageConsultationRating}⭐</p>
          <p>평균 매칭 시간: {stats.averageMatchingTimeMinutes}분</p>
          <p>월간 활성 사용자: {stats.monthlyActiveUsers}명</p>
          <p>월간 활성 전문가: {stats.monthlyActiveExperts}명</p>
          <p>상담 완료율: {stats.consultationCompletionRate}%</p>
          <p>사용자 만족도: {stats.userSatisfactionScore}/5</p>
          <p>마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString()}</p>
        </div>
      </div>

      {/* 통계 업데이트 */}
      <div>
        <h3>통계 업데이트</h3>
        <button 
          onClick={handleCompleteConsultation}
          disabled={loading}
        >
          {loading ? '처리 중...' : '상담 완료'}
        </button>
        <button onClick={handleRegisterExpert}>
          전문가 등록
        </button>
        <button onClick={handleRegisterUser}>
          사용자 등록
        </button>
        <button onClick={() => handleRecordMatching('user_123', 'expert_456', 3)}>
          매칭 기록 (3분)
        </button>
        <button onClick={() => handleUpdateMetrics({
          completionRate: 95,
          satisfactionScore: 4.8
        })}>
          메트릭 업데이트
        </button>
      </div>

      {/* 매칭 기록 */}
      <div>
        <h3>매칭 기록</h3>
        <button onClick={() => fetchStats(true)}>
          매칭 기록 포함 조회
        </button>
        {matchingRecords.map(record => (
          <div key={record.id}>
            <p>사용자: {record.userId} | 전문가: {record.expertId} | 시간: {record.matchingTimeMinutes}분</p>
            <p>생성일: {new Date(record.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 유틸리티 함수로 분리

```typescript
// utils/statsAPI.ts
export const statsAPI = {
  // 통계 조회
  async getStats(includeMatchingRecords = false) {
    const params = new URLSearchParams();
    if (includeMatchingRecords) params.append('includeMatchingRecords', 'true');
    
    const response = await fetch(`/api/stats?${params}`);
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 액션 실행
  async executeAction(action: string, data: any = {}) {
    const response = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 편의 메서드들
  updateStats: (update: any) => statsAPI.executeAction('updateStats', { update }),
  recordMatching: (userId: string, expertId: string, matchingTimeMinutes: number) => 
    statsAPI.executeAction('recordMatching', { userId, expertId, matchingTimeMinutes }),
  completeConsultation: () => statsAPI.executeAction('completeConsultation'),
  registerExpert: () => statsAPI.executeAction('registerExpert'),
  registerUser: () => statsAPI.executeAction('registerUser'),
  updateMetrics: (metrics: any) => statsAPI.executeAction('updateMetrics', metrics),
  resetStats: () => statsAPI.executeAction('resetStats'),
  initializeStats: () => statsAPI.executeAction('initializeStats'),

  // 부분 업데이트
  async updateStatsPartial(updates: any) {
    const response = await fetch('/api/stats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 통계 초기화
  async resetAllStats() {
    const response = await fetch('/api/stats', { method: 'DELETE' });
    
    const result = await response.json();
    return result.success ? result.data : null;
  }
};

// 사용 예시
const handleCompleteConsultation = async () => {
  const result = await statsAPI.completeConsultation();
  if (result) {
    console.log('상담 완료 통계가 업데이트되었습니다:', result.stats);
  }
};

const handleRecordMatching = async () => {
  const result = await statsAPI.recordMatching('user_123', 'expert_456', 5);
  if (result) {
    console.log('매칭 기록이 저장되었습니다:', result.record);
    console.log('새로운 평균 매칭 시간:', result.averageMatchingTime);
  }
};
```

## 장점

1. **단순함**: 복잡한 상태 관리 라이브러리 불필요
2. **유지보수성**: API만 관리하면 되므로 간단
3. **확장성**: 필요에 따라 쉽게 기능 추가/수정
4. **명확성**: 데이터 흐름이 명확하고 예측 가능
5. **테스트 용이성**: API 엔드포인트만 테스트하면 됨
6. **실시간 통계**: 매칭 시간, 상담 완료 등 실시간 업데이트
7. **종합적인 메트릭**: 플랫폼 전반의 성과 지표 제공

## 주의사항

1. **메모리 기반 저장**: 현재 구현은 메모리 기반이므로 서버 재시작 시 상태가 초기화됩니다.
2. **프로덕션 환경**: 실제 프로덕션에서는 데이터베이스를 사용하여 상태를 영구 저장하는 것을 권장합니다.
3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 구현해야 합니다.
4. **상태 동기화**: 클라이언트에서 상태 변경 후 UI 업데이트를 위해 별도 처리가 필요합니다.
5. **데이터 정확성**: 통계 계산 시 데이터 일관성을 유지해야 합니다.

## 마이그레이션 가이드

기존 Zustand 스토어에서 API 기반으로 마이그레이션하는 방법:

1. `useStatsStore` 제거
2. 컴포넌트에서 직접 `fetch` 사용
3. 상태 변경 후 `setState`로 로컬 상태 업데이트
4. 에러 처리 및 로딩 상태 관리 추가
