# 카테고리 API

상담 분야 카테고리를 관리하는 API입니다.

## 엔드포인트

### GET /api/categories

카테고리 목록을 조회합니다.

#### 쿼리 파라미터

- `activeOnly` (boolean): `true`인 경우 활성 카테고리만 반환 (기본값: `false`)

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "career",
      "name": "진로상담",
      "description": "취업, 이직, 진로 탐색",
      "icon": "Target",
      "isActive": true,
      "order": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 26
}
```

### POST /api/categories

카테고리를 생성, 수정, 삭제하거나 순서를 변경합니다.

#### 요청 본문

```json
{
  "action": "create|update|delete|reorder",
  "category": {
    // 카테고리 데이터 (action에 따라 다름)
  }
}
```

#### 액션별 사용법

##### 1. 카테고리 생성 (create)

```json
{
  "action": "create",
  "category": {
    "id": "new-category",
    "name": "새로운 상담",
    "description": "새로운 상담 분야입니다",
    "icon": "Star",
    "isActive": true,
    "order": 27
  }
}
```

##### 2. 카테고리 수정 (update)

```json
{
  "action": "update",
  "category": {
    "id": "career",
    "name": "진로상담 (수정됨)",
    "description": "수정된 설명"
  }
}
```

##### 3. 카테고리 삭제 (delete) - 비활성화

```json
{
  "action": "delete",
  "category": {
    "id": "career"
  }
}
```

##### 4. 카테고리 순서 변경 (reorder)

```json
{
  "action": "reorder",
  "categoryIds": ["career", "psychology", "finance", "legal"]
}
```

## 카테고리 구조

```typescript
interface Category {
  id: string;           // 고유 식별자
  name: string;         // 표시 이름
  description: string;  // 설명
  icon: string;         // 아이콘 이름 (Lucide React)
  isActive: boolean;    // 활성 상태
  order: number;        // 정렬 순서
  createdAt: string;    // 생성일시
  updatedAt: string;    // 수정일시
}
```

## 사용 예시

### 프론트엔드에서 카테고리 조회

```typescript
// 모든 카테고리 조회
const response = await fetch('/api/categories');
const result = await response.json();

// 활성 카테고리만 조회
const response = await fetch('/api/categories?activeOnly=true');
const result = await response.json();
```

### 새 카테고리 생성

```typescript
const response = await fetch('/api/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'create',
    category: {
      id: 'new-category',
      name: '새로운 상담',
      description: '새로운 상담 분야입니다',
      icon: 'Star'
    }
  })
});
```

## 주의사항

- 현재는 메모리 기반으로 데이터를 관리합니다 (서버 재시작 시 초기화)
- 실제 운영 환경에서는 데이터베이스 연동이 필요합니다
- 카테고리 ID는 고유해야 합니다
- 삭제는 실제 삭제가 아닌 비활성화로 처리됩니다
