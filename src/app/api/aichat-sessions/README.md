# AI 채팅 세션 API

AI 채팅 상담의 채팅 세션과 메시지를 관리하는 API입니다. 전문가 상담과 구분하기 위해 별도로 관리됩니다.

## 엔드포인트

### 1. 채팅 세션 목록 조회

**GET** `/api/aichat-sessions`

채팅 세션 목록을 조회합니다.

#### 쿼리 파라미터

- `userId` (string): 사용자 ID (필수)
- `category` (string): 카테고리 필터
- `status` (string): 상태 필터 (pending, in_progress, completed, cancelled)
- `limit` (number): 조회할 세션 수 제한
- `search` (string): 검색어

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "1705123456789",
      "title": "새로운 상담",
      "userId": "user1",
      "expertId": null,
      "expert": {
        "name": "AI 상담 어시스턴트",
        "title": "AI 상담사",
        "avatar": null
      },
      "lastMessage": "",
      "timestamp": "2024-01-15T14:30:00.000Z",
      "duration": 0,
      "status": "in_progress",
      "messageCount": 0,
      "creditsUsed": 0,
      "category": "일반",
      "createdAt": "2024-01-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. 새로운 채팅 세션 생성

**POST** `/api/aichat-sessions`

새로운 채팅 세션을 생성합니다.

#### 요청 본문

```json
{
  "title": "새로운 상담",
  "userId": "user1",
  "expertId": null,
  "category": "일반"
}
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1705123456789",
    "title": "새로운 상담",
    "userId": "user1",
    "expertId": null,
    "expert": {
      "name": "AI 상담 어시스턴트",
      "title": "AI 상담사",
      "avatar": null
    },
    "lastMessage": "",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "duration": 0,
    "status": "in_progress",
    "messageCount": 0,
    "creditsUsed": 0,
    "category": "일반",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  },
  "message": "새로운 채팅 세션이 생성되었습니다."
}
```

### 3. 특정 채팅 세션 조회

**GET** `/api/aichat-sessions/[id]`

특정 채팅 세션의 상세 정보를 조회합니다.

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1705123456789",
    "title": "새로운 상담",
    "userId": "user1",
    "expertId": null,
    "expert": {
      "name": "AI 상담 어시스턴트",
      "title": "AI 상담사",
      "avatar": null
    },
    "lastMessage": "",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "duration": 0,
    "status": "in_progress",
    "messageCount": 0,
    "creditsUsed": 0,
    "category": "일반",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### 4. 채팅 세션 수정

**PUT** `/api/aichat-sessions/[id]`

채팅 세션 정보를 수정합니다.

#### 요청 본문

```json
{
  "title": "수정된 상담 제목",
  "status": "completed",
  "duration": 30,
  "messageCount": 10,
  "creditsUsed": 15
}
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1705123456789",
    "title": "수정된 상담 제목",
    "userId": "user1",
    "expertId": null,
    "expert": {
      "name": "AI 상담 어시스턴트",
      "title": "AI 상담사",
      "avatar": null
    },
    "lastMessage": "",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "duration": 30,
    "status": "completed",
    "messageCount": 10,
    "creditsUsed": 15,
    "category": "일반",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T15:00:00.000Z"
  },
  "message": "채팅 세션이 업데이트되었습니다."
}
```

### 5. 채팅 세션 삭제

**DELETE** `/api/aichat-sessions?id=[id]`

채팅 세션을 삭제합니다.

#### 응답 예시

```json
{
  "success": true,
  "message": "채팅 세션이 삭제되었습니다."
}
```

## 메시지 관리

### 1. 메시지 목록 조회

**GET** `/api/aichat-sessions/[id]/messages`

특정 채팅 세션의 메시지 목록을 조회합니다.

#### 쿼리 파라미터

- `limit` (number): 조회할 메시지 수 제한
- `before` (string): 특정 메시지 ID 이전의 메시지들 조회

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "1705123456789",
      "sessionId": "1705123456789",
      "content": "안녕하세요! 상담을 시작하겠습니다.",
      "type": "user",
      "senderId": "user1",
      "senderName": "사용자",
      "senderAvatar": null,
      "timestamp": "2024-01-15T14:30:00.000Z",
      "attachments": []
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### 2. 새 메시지 전송

**POST** `/api/aichat-sessions/[id]/messages`

새로운 메시지를 전송합니다.

#### 요청 본문

```json
{
  "content": "안녕하세요! 상담을 시작하겠습니다.",
  "type": "user",
  "senderId": "user1",
  "senderName": "사용자",
  "senderAvatar": null
}
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1705123456789",
    "sessionId": "1705123456789",
    "content": "안녕하세요! 상담을 시작하겠습니다.",
    "type": "user",
    "senderId": "user1",
    "senderName": "사용자",
    "senderAvatar": null,
    "timestamp": "2024-01-15T14:30:00.000Z",
    "attachments": []
  },
  "message": "메시지가 전송되었습니다."
}
```

### 3. 메시지 삭제

**DELETE** `/api/aichat-sessions/[id]/messages?messageId=[messageId]`

특정 메시지를 삭제합니다.

#### 응답 예시

```json
{
  "success": true,
  "message": "메시지가 삭제되었습니다."
}
```

## 데이터 구조

### ChatSession

```typescript
interface ChatSession {
  id: string;
  title: string;
  userId: string;
  expertId: string | null;
  expert: {
    name: string;
    title: string;
    avatar: string | null;
  } | null;
  lastMessage: string;
  timestamp: string;
  duration: number;
  status: "in_progress" | "completed" | "pending" | "cancelled";
  messageCount: number;
  creditsUsed: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  type: "user" | "ai" | "expert" | "system";
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  timestamp: string;
  attachments: any[];
}
```

## 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

## 주의사항

- 모든 API는 실제 데이터베이스 연동을 위해 설계되었습니다.
- 현재는 localStorage 기반 메모리 저장소를 사용합니다.
- 프로덕션 환경에서는 적절한 데이터베이스로 교체해야 합니다.
- 더미 데이터는 포함되지 않으며, 실제 사용자 데이터만 처리합니다.
