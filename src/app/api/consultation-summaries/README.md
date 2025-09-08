# 상담요약 API (Consultation Summaries API)

상담 요약 데이터를 관리하는 API 엔드포인트입니다.

## 기본 정보

- **Base URL**: `/api/consultation-summaries`
- **인증**: 현재는 더미 데이터 사용 (실제 구현 시 인증 로직 필요)

## 엔드포인트

### 1. 상담요약 목록 조회

**GET** `/api/consultation-summaries`

상담 요약 목록을 조회합니다.

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| `status` | string | ❌ | 상태 필터 (all, completed, processing, failed) | all |
| `search` | string | ❌ | 검색어 (제목, 전문가, 태그) | - |
| `page` | number | ❌ | 페이지 번호 | 1 |
| `limit` | number | ❌ | 페이지당 항목 수 | 20 |

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "summary_001",
      "title": "진로 상담 - IT 업계 전환",
      "date": "2024-05-09T10:00:00.000Z",
      "duration": 60,
      "expert": {
        "name": "김진우",
        "title": "진로 상담 전문가",
        "avatar": null
      },
      "client": {
        "name": "김민수",
        "company": "현재 제조업 종사"
      },
      "status": "completed",
      "summary": "IT 업계 전환에 대한 구체적인 로드맵을 제시...",
      "tags": ["진로전환", "IT", "웹개발", "프로그래밍"],
      "creditsUsed": 80,
      "rating": 5,
      "hasRecording": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. 상담요약 생성

**POST** `/api/consultation-summaries`

새로운 상담 요약을 생성합니다.

#### 요청 본문

```json
{
  "consultationId": "consultation_001",
  "title": "상담 제목",
  "expertId": "expert_001",
  "expertName": "전문가 이름",
  "expertTitle": "전문가 직함",
  "duration": 60,
  "summary": "상담 내용 요약",
  "tags": ["태그1", "태그2"],
  "recordingUrl": "https://example.com/recording.mp3",
  "recordingDuration": 3600
}
```

#### 응답 예시

```json
{
  "success": true,
  "message": "상담 요약이 생성되었습니다.",
  "data": {
    "id": "summary_1234567890",
    "consultationId": "consultation_001",
    "title": "상담 제목",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 60,
    "expert": {
      "id": "expert_001",
      "name": "전문가 이름",
      "title": "전문가 직함",
      "avatar": null
    },
    "client": {
      "id": "user_001",
      "name": "사용자",
      "company": null
    },
    "status": "processing",
    "summary": "상담 내용 요약",
    "tags": ["태그1", "태그2"],
    "recordingUrl": "https://example.com/recording.mp3",
    "recordingDuration": 3600,
    "creditsUsed": 0,
    "rating": null,
    "hasRecording": true
  }
}
```

### 3. 상담요약 상세 조회

**GET** `/api/consultation-summaries/{id}`

특정 상담 요약의 상세 정보를 조회합니다.

#### 경로 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | ✅ | 상담 요약 ID |

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "summary_001",
    "title": "진로 상담 - IT 업계 전환",
    "date": "2024-05-09T10:00:00.000Z",
    "duration": 60,
    "expert": {
      "name": "김진우",
      "title": "진로 상담 전문가",
      "avatar": null
    },
    "client": {
      "name": "김민수",
      "company": "현재 제조업 종사"
    },
    "status": "recording",
    "recordingUrl": "/api/recordings/summary_001.mp3",
    "recordingDuration": 3600,
    "summary": {
      "keyPoints": [
        "IT 업계 전환을 위한 단계별 로드맵 제시",
        "웹 개발 분야로의 전환 권장"
      ],
      "recommendations": [
        {
          "title": "프로그래밍 기초 학습",
          "description": "Python이나 JavaScript 기초 문법부터 시작...",
          "priority": "high",
          "timeframe": "2-3개월"
        }
      ],
      "actionItems": [
        {
          "id": 1,
          "task": "Python 기초 문법 학습",
          "assignee": "김민수",
          "dueDate": "2024-08-09T00:00:00.000Z",
          "status": "pending",
          "priority": "high"
        }
      ],
      "tags": ["진로전환", "IT", "웹개발", "프로그래밍"],
      "nextSteps": "다음 상담에서는 학습 진행 상황을 점검..."
    },
    "creditsUsed": 80,
    "rating": 5
  }
}
```

### 4. 상담요약 업데이트

**PUT** `/api/consultation-summaries/{id}`

기존 상담 요약을 업데이트합니다.

#### 경로 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | ✅ | 상담 요약 ID |

#### 요청 본문

```json
{
  "title": "업데이트된 제목",
  "summary": "업데이트된 요약",
  "tags": ["새태그1", "새태그2"],
  "status": "completed",
  "rating": 5
}
```

#### 응답 예시

```json
{
  "success": true,
  "message": "상담 요약이 업데이트되었습니다.",
  "data": {
    "id": "summary_001",
    "title": "업데이트된 제목",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 60,
    "expert": {
      "name": "김진우",
      "title": "진로 상담 전문가",
      "avatar": null
    },
    "client": {
      "name": "김민수",
      "company": "현재 제조업 종사"
    },
    "status": "completed",
    "summary": "업데이트된 요약",
    "tags": ["새태그1", "새태그2"],
    "creditsUsed": 80,
    "rating": 5
  }
}
```

### 5. 상담요약 삭제

**DELETE** `/api/consultation-summaries/{id}`

상담 요약을 삭제합니다.

#### 경로 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | ✅ | 상담 요약 ID |

#### 응답 예시

```json
{
  "success": true,
  "message": "상담 요약이 삭제되었습니다."
}
```

## 상태 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 400 | 잘못된 요청 |
| 404 | 찾을 수 없음 |
| 500 | 서버 오류 |

## 에러 응답

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

## 데이터 타입

### ConsultationSummary

```typescript
interface ConsultationSummary {
  id: string;
  title: string;
  date: Date;
  duration: number;
  expert: {
    name: string;
    title: string;
    avatar: string | null;
  };
  client: {
    name: string;
    company?: string;
  };
  status: 'completed' | 'processing' | 'failed' | 'pending';
  summary: string;
  tags: string[];
  creditsUsed: number;
  rating?: number;
}
```

## 구현 예정 사항

- [ ] 실제 데이터베이스 연동
- [ ] 사용자 인증 및 권한 검증
- [ ] 파일 업로드 (녹화 파일)
- [ ] 실시간 알림
- [ ] 캐싱 최적화
- [ ] API 레이트 리미팅
