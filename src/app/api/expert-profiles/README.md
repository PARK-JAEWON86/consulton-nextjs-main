# Expert Profiles API

전문가 프로필을 관리하는 순수 API 엔드포인트입니다. 전문가 프로필 목록, 현재 로그인한 전문가, 프로필 검색/필터링/CRUD 기능을 제공합니다.

## 엔드포인트

`/api/expert-profiles`

## HTTP 메서드

### GET
전문가 프로필을 조회합니다.

**쿼리 파라미터:**
- `id`: 특정 ID의 프로필 조회
- `query`: 검색 쿼리로 필터링
- `specialty`: 전문 분야로 필터링
- `currentExpert`: 현재 로그인한 전문가 프로필 조회 (true/false)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": 1,
        "name": "김전문",
        "specialty": "비즈니스 컨설팅",
        "experience": 10,
        "description": "10년 경력의 비즈니스 컨설턴트",
        "avgRating": 4.8,
        "totalSessions": 150,
        "isProfileComplete": true
      }
    ],
    "total": 1,
    "currentExpertId": 1
  }
}
```

### POST
전문가 프로필 관리 액션을 실행합니다.

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

#### addOrUpdateProfile
새로운 전문가 프로필을 추가하거나 기존 프로필을 업데이트합니다.
```json
{
  "action": "addOrUpdateProfile",
  "data": {
    "id": 1,
    "name": "김전문",
    "specialty": "비즈니스 컨설팅",
    "experience": 10,
    "description": "10년 경력의 비즈니스 컨설턴트",
    "hourlyRate": 100000,
    "isProfileComplete": true
  }
}
```

#### setCurrentExpertId
현재 로그인한 전문가 ID를 설정합니다.
```json
{
  "action": "setCurrentExpertId",
  "data": {
    "id": 1
  }
}
```

#### deleteProfile
전문가 프로필을 삭제합니다.
```json
{
  "action": "deleteProfile",
  "data": {
    "id": 1
  }
}
```

#### searchProfiles
검색 쿼리로 전문가 프로필을 검색합니다.
```json
{
  "action": "searchProfiles",
  "data": {
    "query": "비즈니스"
  }
}
```

#### getProfilesBySpecialty
특정 전문 분야의 전문가 프로필을 조회합니다.
```json
{
  "action": "getProfilesBySpecialty",
  "data": {
    "specialty": "비즈니스 컨설팅"
  }
}
```

#### initializeProfiles
더미 데이터로 전문가 프로필을 초기화합니다.
```json
{
  "action": "initializeProfiles",
  "data": {}
}
```

### PATCH
전문가 프로필을 부분적으로 업데이트합니다.

**요청 본문 예시:**
```json
{
  "id": 1,
  "updates": {
    "description": "업데이트된 설명",
    "hourlyRate": 120000,
    "isOnline": false
  }
}
```

### DELETE
전문가 프로필을 삭제합니다.

**쿼리 파라미터:**
- `id`: 특정 전문가 프로필 삭제 (없으면 모든 프로필 삭제)

**예시:**
- 특정 프로필 삭제: `DELETE /api/expert-profiles?id=1`
- 모든 프로필 삭제: `DELETE /api/expert-profiles`

## 사용 예시

### React 컴포넌트에서 직접 사용

```tsx
import { useState, useEffect } from 'react';

function ExpertProfilesComponent() {
  const [profiles, setProfiles] = useState([]);
  const [currentExpertId, setCurrentExpertId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 전문가 프로필 목록 조회
  const fetchProfiles = async (query = null, specialty = null) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (specialty) params.append('specialty', specialty);
      
      const response = await fetch(`/api/expert-profiles?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setProfiles(result.data.profiles);
        setCurrentExpertId(result.data.currentExpertId);
      }
    } catch (error) {
      console.error('전문가 프로필 조회 실패:', error);
    }
  };

  // 새 전문가 프로필 추가
  const handleAddProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/expert-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addOrUpdateProfile',
          data: profileData
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // 프로필 목록 새로고침
        await fetchProfiles();
      }
    } catch (error) {
      console.error('프로필 추가 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 현재 전문가 설정
  const handleSetCurrentExpert = async (expertId) => {
    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setCurrentExpertId',
          data: { id: expertId }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setCurrentExpertId(expertId);
      }
    } catch (error) {
      console.error('현재 전문가 설정 실패:', error);
    }
  };

  // 프로필 검색
  const handleSearchProfiles = async (searchQuery) => {
    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'searchProfiles',
          data: { query: searchQuery }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setProfiles(result.data.profiles);
      }
    } catch (error) {
      console.error('프로필 검색 실패:', error);
    }
  };

  // 프로필 업데이트
  const handleUpdateProfile = async (id, updates) => {
    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      const result = await response.json();
      if (result.success) {
        // 프로필 목록 새로고침
        await fetchProfiles();
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  // 프로필 삭제
  const handleDeleteProfile = async (id) => {
    try {
      const response = await fetch(`/api/expert-profiles?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        // 프로필 목록 새로고침
        await fetchProfiles();
      }
    } catch (error) {
      console.error('프로필 삭제 실패:', error);
    }
  };

  // 프로필 초기화
  const handleInitializeProfiles = async () => {
    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initializeProfiles',
          data: {}
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setProfiles(result.data.profiles);
        setCurrentExpertId(result.data.currentExpertId);
      }
    } catch (error) {
      console.error('프로필 초기화 실패:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <div>
      <h2>전문가 프로필 관리</h2>
      
      {/* 프로필 초기화 */}
      <div>
        <button onClick={handleInitializeProfiles}>
          더미 데이터로 초기화
        </button>
      </div>

      {/* 새 프로필 추가 폼 */}
      <div>
        <h3>새 전문가 프로필 추가</h3>
        <button 
          onClick={() => handleAddProfile({
            id: Date.now(),
            name: "새 전문가",
            specialty: "IT 컨설팅",
            experience: 5,
            description: "5년 경력의 IT 컨설턴트",
            hourlyRate: 80000,
            isProfileComplete: true
          })}
          disabled={loading}
        >
          {loading ? '처리 중...' : '프로필 추가'}
        </button>
      </div>

      {/* 현재 전문가 설정 */}
      <div>
        <h3>현재 전문가 설정</h3>
        <button onClick={() => handleSetCurrentExpert(1)}>
          ID 1번을 현재 전문가로 설정
        </button>
        <button onClick={() => handleSetCurrentExpert(null)}>
          현재 전문가 해제
        </button>
      </div>

      {/* 프로필 검색 */}
      <div>
        <h3>프로필 검색</h3>
        <input 
          type="text" 
          placeholder="검색어 입력"
          onChange={(e) => handleSearchProfiles(e.target.value)}
        />
      </div>

      {/* 프로필 목록 */}
      <div>
        <h3>전문가 프로필 목록</h3>
        {profiles.map(profile => (
          <div key={profile.id}>
            <h4>{profile.name}</h4>
            <p>전문 분야: {profile.specialty}</p>
            <p>경력: {profile.experience}년</p>
            <p>평점: {profile.avgRating}⭐</p>
            <p>총 상담: {profile.totalSessions}회</p>
            
            <button onClick={() => handleUpdateProfile(profile.id, {
              description: "업데이트된 설명"
            })}>
              설명 업데이트
            </button>
            
            <button onClick={() => handleDeleteProfile(profile.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* 현재 전문가 정보 */}
      {currentExpertId && (
        <div>
          <h3>현재 전문가</h3>
          <p>전문가 ID: {currentExpertId}</p>
          <button onClick={() => handleSetCurrentExpert(null)}>
            현재 전문가 해제
          </button>
        </div>
      )}
    </div>
  );
}
```

### 유틸리티 함수로 분리

```typescript
// utils/expertProfilesAPI.ts
export const expertProfilesAPI = {
  // 프로필 조회
  async getProfiles(query = null, specialty = null) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (specialty) params.append('specialty', specialty);
    
    const response = await fetch(`/api/expert-profiles?${params}`);
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 특정 프로필 조회
  async getProfile(id: number) {
    const response = await fetch(`/api/expert-profiles?id=${id}`);
    const result = await response.json();
    return result.success ? result.data.profile : null;
  },

  // 현재 전문가 프로필 조회
  async getCurrentExpertProfile() {
    const response = await fetch('/api/expert-profiles?currentExpert=true');
    const result = await response.json();
    return result.success ? result.data.profile : null;
  },

  // 액션 실행
  async executeAction(action: string, data: any = {}) {
    const response = await fetch('/api/expert-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 편의 메서드들
  addOrUpdateProfile: (profile: any) => expertProfilesAPI.executeAction('addOrUpdateProfile', profile),
  setCurrentExpertId: (id: number | null) => expertProfilesAPI.executeAction('setCurrentExpertId', { id }),
  deleteProfile: (id: number) => expertProfilesAPI.executeAction('deleteProfile', { id }),
  searchProfiles: (query: string) => expertProfilesAPI.executeAction('searchProfiles', { query }),
  getProfilesBySpecialty: (specialty: string) => expertProfilesAPI.executeAction('getProfilesBySpecialty', { specialty }),
  initializeProfiles: () => expertProfilesAPI.executeAction('initializeProfiles'),

  // 부분 업데이트
  async updateProfile(id: number, updates: any) {
    const response = await fetch('/api/expert-profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    
    const result = await response.json();
    return result.success ? result.data : null;
  },

  // 삭제
  async deleteProfileById(id?: number) {
    const url = id ? `/api/expert-profiles?id=${id}` : '/api/expert-profiles';
    const response = await fetch(url, { method: 'DELETE' });
    
    const result = await response.json();
    return result.success ? result.data : null;
  }
};

// 사용 예시
const handleAddExpert = async () => {
  const result = await expertProfilesAPI.addOrUpdateProfile({
    id: Date.now(),
    name: "김전문",
    specialty: "비즈니스 컨설팅",
    experience: 10,
    description: "10년 경력의 비즈니스 컨설턴트",
    hourlyRate: 100000,
    isProfileComplete: true
  });
  
  if (result) {
    console.log('전문가 프로필이 추가되었습니다:', result.profile);
  }
};
```

## 장점

1. **단순함**: 복잡한 상태 관리 라이브러리 불필요
2. **유지보수성**: API만 관리하면 되므로 간단
3. **확장성**: 필요에 따라 쉽게 기능 추가/수정
4. **명확성**: 데이터 흐름이 명확하고 예측 가능
5. **테스트 용이성**: API 엔드포인트만 테스트하면 됨
6. **검색 및 필터링**: 이름, 전문 분야, 설명 등으로 검색 가능
7. **현재 전문가 관리**: 로그인한 전문가의 프로필 추적

## 주의사항

1. **메모리 기반 저장**: 현재 구현은 메모리 기반이므로 서버 재시작 시 상태가 초기화됩니다.
2. **프로덕션 환경**: 실제 프로덕션에서는 데이터베이스를 사용하여 상태를 영구 저장하는 것을 권장합니다.
3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 구현해야 합니다.
4. **상태 동기화**: 클라이언트에서 상태 변경 후 UI 업데이트를 위해 별도 처리가 필요합니다.

## 마이그레이션 가이드

기존 Zustand 스토어에서 API 기반으로 마이그레이션하는 방법:

1. `useExpertProfileStore` 제거
2. 컴포넌트에서 직접 `fetch` 사용
3. 상태 변경 후 `setState`로 로컬 상태 업데이트
4. 에러 처리 및 로딩 상태 관리 추가
