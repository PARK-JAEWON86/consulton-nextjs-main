# App State API

앱 전역 상태를 관리하는 순수 API 엔드포인트입니다. 클라이언트에서 직접 fetch를 사용하여 상태를 관리합니다.

## 엔드포인트

`/api/app-state`

## HTTP 메서드

### GET
현재 앱 상태를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "hasEnteredService": true,
    "isAuthenticated": true,
    "sidebarOpen": false,
    "currentPage": "/dashboard",
    "viewMode": "expert",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "홍길동",
      "credits": 1000,
      "expertLevel": "senior",
      "role": "expert"
    }
  }
}
```

### POST
액션 기반으로 앱 상태를 업데이트합니다.

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

#### enterService
서비스 진입 상태를 true로 설정합니다.
```json
{
  "action": "enterService",
  "data": {}
}
```

#### exitService
서비스 종료 상태를 false로 설정합니다.
```json
{
  "action": "exitService",
  "data": {}
}
```

#### setAuthenticated
인증 상태를 설정합니다.
```json
{
  "action": "setAuthenticated",
  "data": {
    "status": true
  }
}
```

#### setSidebarOpen
사이드바 열림/닫힘 상태를 설정합니다.
```json
{
  "action": "setSidebarOpen",
  "data": {
    "open": true
  }
}
```

#### setCurrentPage
현재 페이지를 설정합니다.
```json
{
  "action": "setCurrentPage",
  "data": {
    "page": "/dashboard"
  }
}
```

#### setViewMode
뷰 모드를 설정합니다 (user/expert).
```json
{
  "action": "setViewMode",
  "data": {
    "mode": "expert"
  }
}
```

#### setUser
사용자 정보를 설정합니다.
```json
{
  "action": "setUser",
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "홍길동",
      "credits": 1000,
      "expertLevel": "senior",
      "role": "expert"
    }
  }
}
```

#### updateCredits
사용자 크레딧을 업데이트합니다.
```json
{
  "action": "updateCredits",
  "data": {
    "credits": 1500
  }
}
```

#### logout
로그아웃 상태로 초기화합니다.
```json
{
  "action": "logout",
  "data": {}
}
```

### PATCH
부분적으로 앱 상태를 업데이트합니다.

**요청 본문 예시:**
```json
{
  "sidebarOpen": true,
  "currentPage": "/chat"
}
```

### DELETE
앱 상태를 초기화합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "상태가 초기화되었습니다."
}
```

## 사용 예시

### React 컴포넌트에서 직접 사용

```tsx
import { useState, useEffect } from 'react';

function MyComponent() {
  const [appState, setAppState] = useState(null);
  const [loading, setLoading] = useState(false);

  // 상태 조회
  const fetchAppState = async () => {
    try {
      const response = await fetch('/api/app-state');
      const result = await response.json();
      if (result.success) {
        setAppState(result.data);
      }
    } catch (error) {
      console.error('상태 조회 실패:', error);
    }
  };

  // 서비스 진입
  const handleEnterService = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enterService',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAppState(result.data);
      }
    } catch (error) {
      console.error('서비스 진입 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 사이드바 토글
  const handleToggleSidebar = async () => {
    try {
      const response = await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setSidebarOpen',
          data: { open: !appState?.sidebarOpen }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAppState(result.data);
      }
    } catch (error) {
      console.error('사이드바 상태 변경 실패:', error);
    }
  };

  // 뷰 모드 변경
  const handleSwitchToExpert = async () => {
    try {
      const response = await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setViewMode',
          data: { mode: 'expert' }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAppState(result.data);
      }
    } catch (error) {
      console.error('뷰 모드 변경 실패:', error);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logout',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAppState(result.data);
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  useEffect(() => {
    fetchAppState();
  }, []);

  if (!appState) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>현재 페이지: {appState.currentPage}</h1>
      <p>사용자: {appState.user?.name}</p>
      <p>크레딧: {appState.user?.credits}</p>
      <p>뷰 모드: {appState.viewMode}</p>
      
      <button 
        onClick={handleEnterService} 
        disabled={loading}
      >
        {loading ? '처리 중...' : '서비스 진입'}
      </button>
      
      <button onClick={handleToggleSidebar}>
        사이드바 {appState.sidebarOpen ? '닫기' : '열기'}
      </button>
      
      <button onClick={handleSwitchToExpert}>
        전문가 모드로 전환
      </button>
      
      <button onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
```

### 유틸리티 함수로 분리

```typescript
// utils/appStateAPI.ts
export const appStateAPI = {
  // 상태 조회
  async getState() {
    const response = await fetch('/api/app-state');
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 액션 실행
  async executeAction(action: string, data: any = {}) {
    const response = await fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 편의 메서드들
  enterService: () => appStateAPI.executeAction('enterService'),
  exitService: () => appStateAPI.executeAction('exitService'),
  setAuthenticated: (status: boolean) => appStateAPI.executeAction('setAuthenticated', { status }),
  setSidebarOpen: (open: boolean) => appStateAPI.executeAction('setSidebarOpen', { open }),
  setCurrentPage: (page: string) => appStateAPI.executeAction('setCurrentPage', { page }),
  setViewMode: (mode: "user" | "expert") => appStateAPI.executeAction('setViewMode', { mode }),
  setUser: (user: any) => appStateAPI.executeAction('setUser', { user }),
  updateCredits: (credits: number) => appStateAPI.executeAction('updateCredits', { credits }),
  logout: () => appStateAPI.executeAction('logout'),
};

// 사용 예시
const handleLogin = async () => {
  const newState = await appStateAPI.setAuthenticated(true);
  if (newState) {
    // 상태 업데이트 성공
    console.log('로그인 완료:', newState);
  }
};
```

## 장점

1. **단순함**: 복잡한 상태 관리 라이브러리 불필요
2. **유지보수성**: API만 관리하면 되므로 간단
3. **확장성**: 필요에 따라 쉽게 기능 추가/수정
4. **명확성**: 데이터 흐름이 명확하고 예측 가능
5. **테스트 용이성**: API 엔드포인트만 테스트하면 됨

## 주의사항

1. **메모리 기반 저장**: 현재 구현은 메모리 기반이므로 서버 재시작 시 상태가 초기화됩니다.
2. **프로덕션 환경**: 실제 프로덕션에서는 Redis나 데이터베이스를 사용하여 상태를 영구 저장하는 것을 권장합니다.
3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 구현해야 합니다.
4. **상태 동기화**: 클라이언트에서 상태 변경 후 UI 업데이트를 위해 별도 처리가 필요합니다.

## 마이그레이션 가이드

기존 Zustand 스토어에서 API 기반으로 마이그레이션하는 방법:

1. `useAppStore` 제거
2. 컴포넌트에서 직접 `fetch` 사용
3. 상태 변경 후 `setState`로 로컬 상태 업데이트
4. 에러 처리 및 로딩 상태 관리 추가
