# 채팅 세션 API

AI 채팅 상담의 채팅 세션과 메시지를 관리하는 API입니다.

## 엔드포인트

### 1. 채팅 세션 목록 조회

**GET** `/api/chat-sessions`

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
      "id": "1",
      "title": "마케팅 전략 상담",
      "userId": "user1",
      "expertId": "expert1",
      "expert": {
        "name": "이민수",
        "title": "마케팅 전문가",
        "avatar": null
      },
      "lastMessage": "네, 인스타그램 마케팅에 대해 더 자세히 알려드릴게요.",
      "timestamp": "2024-01-15T14:30:00.000Z",
      "duration": 45,
      "status": "completed",
      "messageCount": 23,
      "creditsUsed": 25,
      "category": "마케팅",
      "createdAt": "2024-01-15T14:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. 새로운 채팅 세션 생성

**POST** `/api/chat-sessions`

새로운 채팅 세션을 생성합니다.

#### 요청 본문

```json
{
  "title": "새로운 상담",
  "userId": "user1",
  "expertId": "expert1",
  "category": "마케팅"
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
    "expertId": "expert1",
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
    "category": "마케팅",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  },
  "message": "새로운 채팅 세션이 생성되었습니다."
}
```

### 3. 특정 채팅 세션 조회

**GET** `/api/chat-sessions/[id]`

특정 채팅 세션의 정보를 조회합니다.

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "마케팅 전략 상담",
    "userId": "user1",
    "expertId": "expert1",
    "expert": {
      "name": "이민수",
      "title": "마케팅 전문가",
      "avatar": null
    },
    "lastMessage": "네, 인스타그램 마케팅에 대해 더 자세히 알려드릴게요.",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "duration": 45,
    "status": "completed",
    "messageCount": 23,
    "creditsUsed": 25,
    "category": "마케팅",
    "createdAt": "2024-01-15T14:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### 4. 채팅 세션 정보 수정

**PUT** `/api/chat-sessions/[id]`

채팅 세션의 정보를 수정합니다.

#### 요청 본문

```json
{
  "title": "수정된 제목",
  "status": "completed",
  "lastMessage": "상담이 완료되었습니다.",
  "messageCount": 25,
  "creditsUsed": 30,
  "duration": 60
}
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "수정된 제목",
    "status": "completed",
    "lastMessage": "상담이 완료되었습니다.",
    "messageCount": 25,
    "creditsUsed": 30,
    "duration": 60,
    "updatedAt": "2024-01-15T15:00:00.000Z"
  },
  "message": "채팅 세션이 업데이트되었습니다."
}
```

### 5. 채팅 세션 삭제

**DELETE** `/api/chat-sessions/[id]`

채팅 세션을 삭제합니다.

#### 응답 예시

```json
{
  "success": true,
  "message": "채팅 세션이 삭제되었습니다."
}
```

### 6. 채팅 메시지 목록 조회

**GET** `/api/chat-sessions/[id]/messages`

특정 채팅 세션의 메시지 목록을 조회합니다.

#### 쿼리 파라미터

- `limit` (number): 조회할 메시지 수 제한
- `before` (string): 페이지네이션용 타임스탬프

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "msg1_1",
      "sessionId": "1",
      "type": "user",
      "content": "안녕하세요! 마케팅 전략에 대해 상담받고 싶습니다.",
      "timestamp": "2024-01-15T14:00:00.000Z",
      "senderId": "user1",
      "senderName": "사용자",
      "senderAvatar": null
    },
    {
      "id": "msg1_2",
      "sessionId": "1",
      "type": "ai",
      "content": "안녕하세요! 마케팅 전략 상담을 도와드리겠습니다.",
      "timestamp": "2024-01-15T14:00:30.000Z",
      "senderId": "ai",
      "senderName": "AI 상담사",
      "senderAvatar": null
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### 7. 새로운 메시지 전송

**POST** `/api/chat-sessions/[id]/messages`

새로운 메시지를 전송합니다.

#### 요청 본문

```json
{
  "content": "안녕하세요!",
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
    "id": "msg1_7",
    "sessionId": "1",
    "type": "user",
    "content": "안녕하세요!",
    "timestamp": "2024-01-15T16:00:00.000Z",
    "senderId": "user1",
    "senderName": "사용자",
    "senderAvatar": null
  },
  "message": "메시지가 전송되었습니다."
}
```

## 사용 예시

### 프론트엔드에서 API 사용하기

```typescript
import { ChatService } from '../../services/ChatService';

const chatService = ChatService.getInstance();

// 채팅 세션 목록 조회
const sessions = await chatService.getChatSessions({
  userId: "user1",
  limit: 20
});

// 새로운 채팅 세션 생성
const newSession = await chatService.createChatSession({
  title: "새로운 상담",
  userId: "user1",
  category: "마케팅"
});

// 메시지 전송
const message = await chatService.sendMessage(sessionId, {
  content: "안녕하세요!",
  type: "user",
  senderId: "user1"
});
```

## 에러 처리

모든 API는 에러 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 상태 코드

- `200`: 성공
- `201`: 생성됨
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

## 주의사항

1. 실제 운영 환경에서는 데이터베이스를 사용해야 합니다.
2. 사용자 인증 및 권한 검증이 필요합니다.
3. 메시지 내용의 보안 검증이 필요합니다.
4. 크레딧 시스템과 연동하여 사용량을 추적해야 합니다.
