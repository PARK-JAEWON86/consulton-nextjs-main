# 상담 세션 API (다중 세션 지원)

이 API는 상담을 여러 세션으로 나누어 관리할 수 있는 기능을 제공합니다.

## 주요 기능

- **다중 세션 지원**: 하나의 상담을 여러 세션으로 나누어 진행
- **세션별 기록 관리**: 각 세션마다 별도의 노트, 대화 기록, 첨부파일 관리
- **실시간 세션 제어**: 세션 시작/종료, 상태 관리
- **녹화/녹음 지원**: 세션별 녹화 파일 관리

## API 엔드포인트

### 상담 관리 API (다중 세션 지원)
- **상담 목록 조회**: `GET /api/consultations-multi`
- **상담 생성**: `POST /api/consultations-multi`
- **상담 조회**: `GET /api/consultations-multi/{id}`
- **상담 수정**: `PUT /api/consultations-multi/{id}`
- **상담 삭제**: `DELETE /api/consultations-multi/{id}`

### 상담 세션 관리 API
### 1. 상담 세션 목록 조회
```
GET /api/consultation-sessions
```

**쿼리 파라미터:**
- `consultationId`: 특정 상담의 세션 목록 조회
- `expertId`: 전문가의 모든 세션 조회
- `userId`: 사용자의 모든 세션 조회
- `status`: 세션 상태별 필터링 (scheduled, in_progress, completed, cancelled)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "consultationId": 1,
        "sessionNumber": 1,
        "startTime": "2024-01-10T14:00:00Z",
        "endTime": "2024-01-10T14:30:00Z",
        "duration": 30,
        "status": "completed",
        "notes": "첫 번째 세션: 초기 상담",
        "transcript": "안녕하세요. 어떤 문제로 상담을 받고 싶으신가요?",
        "recordingUrl": "https://recordings.consulton.com/session_1.mp4",
        "attachments": "[]",
        "createdAt": "2024-01-10T13:30:00Z",
        "updatedAt": "2024-01-10T14:30:00Z",
        "consultation": {
          "id": 1,
          "title": "스트레스 관리 상담",
          "user": { "name": "김민수" },
          "expert": { "name": "이영희" }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3
    }
  }
}
```

### 2. 새로운 상담 세션 생성
```
POST /api/consultation-sessions
```

**요청 본문:**
```json
{
  "consultationId": 1,
  "sessionNumber": 2,
  "startTime": "2024-01-15T14:00:00Z",
  "notes": "두 번째 세션 예약"
}
```

### 3. 특정 상담 세션 조회
```
GET /api/consultation-sessions/{id}
```

### 4. 상담 세션 업데이트
```
PUT /api/consultation-sessions/{id}
```

**요청 본문:**
```json
{
  "notes": "업데이트된 세션 노트",
  "transcript": "대화 내용 기록",
  "recordingUrl": "https://recordings.consulton.com/session_1_updated.mp4",
  "attachments": "[\"document.pdf\", \"image.jpg\"]"
}
```

### 5. 상담 세션 시작
```
POST /api/consultation-sessions/{id}/start
```

세션을 'scheduled' 상태에서 'in_progress' 상태로 변경합니다.

### 6. 상담 세션 종료
```
POST /api/consultation-sessions/{id}/end
```

**요청 본문:**
```json
{
  "notes": "세션 종료 노트",
  "transcript": "전체 대화 기록",
  "recordingUrl": "https://recordings.consulton.com/session_1_final.mp4",
  "attachments": "[\"summary.pdf\"]"
}
```

### 7. 상담 세션 삭제
```
DELETE /api/consultation-sessions/{id}
```

## 데이터 모델

### ConsultationSession
```typescript
interface ConsultationSession {
  id: number;
  consultationId: number;        // 상담 ID (외래키)
  sessionNumber: number;         // 세션 번호 (1, 2, 3...)
  startTime: Date;              // 세션 시작 시간
  endTime?: Date;               // 세션 종료 시간
  duration: number;             // 실제 세션 시간 (분)
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;                // 세션 노트
  transcript: string;           // 대화 기록
  recordingUrl?: string;        // 녹화/녹음 파일 URL
  attachments: string;          // 첨부 파일 (JSON 배열)
  createdAt: Date;
  updatedAt: Date;
}
```

## 사용 예시

### 1. 상담 생성 후 첫 번째 세션 예약
```typescript
// 1. 상담 생성 (consultations-multi API 사용)
const consultation = await ConsultationSessionService.createConsultation({
  expertId: 1,
  userId: 2,
  categoryId: 1,
  title: "스트레스 관리 상담",
  description: "직장 스트레스 관리 상담",
  consultationType: "video",
  scheduledTime: new Date("2024-01-10T14:00:00Z"),
  duration: 60,
  price: 50000,
  topic: "스트레스 관리"
});

// 2. 첫 번째 세션 생성
const session1 = await ConsultationSessionService.createSession({
  consultationId: consultation.consultation.id,
  sessionNumber: 1,
  startTime: new Date("2024-01-10T14:00:00Z"),
  notes: "초기 상담 및 문제 파악"
});
```

### 2. 세션 시작 및 종료
```typescript
// 세션 시작
await ConsultationSessionService.startSession(session1.id);

// 세션 종료
await ConsultationSessionService.endSession(session1.id, {
  notes: "인지행동치료 기법 소개 완료",
  transcript: "전체 대화 내용...",
  recordingUrl: "https://recordings.consulton.com/session_1.mp4",
  attachments: JSON.stringify(["homework.pdf"])
});
```

### 3. 추가 세션 생성
```typescript
// 두 번째 세션 생성
const session2 = await ConsultationSessionService.createSession({
  consultationId: consultation.consultation.id,
  sessionNumber: 2,
  startTime: new Date("2024-01-17T14:00:00Z"),
  notes: "진행 상황 점검 및 추가 상담"
});
```

## 주의사항

1. **세션 번호 중복 방지**: 같은 상담 내에서 세션 번호는 중복될 수 없습니다.
2. **상태 전환**: 세션은 'scheduled' → 'in_progress' → 'completed' 순서로 진행됩니다.
3. **상담 완료 조건**: 모든 세션이 완료되면 상담도 자동으로 완료 상태로 변경됩니다.
4. **데이터 무결성**: 세션 삭제 시 관련된 상담이 진행 중이면 삭제할 수 없습니다.

## 에러 처리

모든 API는 일관된 에러 응답 형식을 사용합니다:

```json
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 에러 정보 (선택사항)"
}
```

일반적인 HTTP 상태 코드:
- `200`: 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `409`: 충돌 (예: 중복된 세션 번호)
- `500`: 서버 내부 오류
