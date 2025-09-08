# 결제 수단 API

사용자의 결제 수단(신용카드, 계좌이체)을 관리하는 API입니다.

## 엔드포인트

### `GET /api/payment-methods`
사용자의 결제 수단 목록을 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_001",
      "userId": "user_001",
      "type": "card",
      "name": "신한카드",
      "last4": "1234",
      "isDefault": true,
      "expiryDate": "12/25",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/payment-methods`
새로운 결제 수단을 추가합니다.

**요청 본문:**
```json
{
  "type": "card",
  "name": "KB국민카드",
  "last4": "5678",
  "expiryDate": "06/26"
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "pm_002",
    "userId": "user_001",
    "type": "card",
    "name": "KB국민카드",
    "last4": "5678",
    "isDefault": false,
    "expiryDate": "06/26",
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  },
  "message": "결제 수단이 성공적으로 추가되었습니다."
}
```

### `PUT /api/payment-methods`
기존 결제 수단을 수정합니다.

**요청 본문:**
```json
{
  "id": "pm_001",
  "name": "신한카드 수정",
  "isDefault": true
}
```

### `DELETE /api/payment-methods?id={id}`
결제 수단을 삭제합니다.

**주의사항:**
- 기본 결제 수단은 삭제할 수 없습니다.
- 삭제된 결제 수단은 복구할 수 없습니다.

## 보안

- 모든 요청은 인증이 필요합니다.
- 사용자는 자신의 결제 수단만 조회/수정/삭제할 수 있습니다.
- 카드 번호는 마지막 4자리만 저장됩니다.
- 민감한 정보는 암호화되어 저장됩니다.

## 에러 코드

- `400`: 잘못된 요청 (필수 필드 누락, 유효하지 않은 데이터)
- `401`: 인증 실패
- `404`: 결제 수단을 찾을 수 없음
- `500`: 서버 오류

## 데이터 검증

### 카드 타입
- `name`: 필수, 문자열
- `last4`: 필수, 4자리 숫자
- `expiryDate`: 필수, MM/YY 형식

### 계좌이체 타입
- `name`: 필수, 문자열
- `bankName`: 필수, 문자열

## 사용 예시

```typescript
// 결제 수단 추가
const response = await fetch('/api/payment-methods', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'card',
    name: '삼성카드',
    last4: '9999',
    expiryDate: '12/26'
  })
});

// 결제 수단 목록 조회
const methods = await fetch('/api/payment-methods').then(res => res.json());

// 결제 수단 삭제
await fetch(`/api/payment-methods?id=pm_001`, {
  method: 'DELETE'
});
```
