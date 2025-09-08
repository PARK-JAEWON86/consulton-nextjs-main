# AI Usage API

AI 사용량을 관리하는 순수 API 엔드포인트입니다. 사용된 토큰, 구매한 토큰, 턴 사용량 추가, 월간 리셋 등의 기능을 제공합니다.

## 엔드포인트

`/api/ai-usage`

## AI 토큰 정책

- **월간 무료 토큰**: 100,000 토큰 (100%)
- **1턴당 평균 토큰**: 900 토큰 (GPT-5 기준)
- **예상 월간 턴 수**: 약 111턴 (100,000 ÷ 900)
- **평균 비용**: $0.0071 / 1K 토큰
- **월간 무료 가치**: 약 $0.71 (약 ₩980원, 환율 1,385원 기준)
- **1턴당 평균 비용**: 약 ₩8.85원 (환율 1,385원 기준)

## 크레딧 시스템

### 크레딧과 토큰의 관계
- **1크레딧 = ₩10원**
- **100크레딧 = ₩1,000원 = 100,000토큰**
- **1크레딧 = 1,000토큰**
- **1,000토큰 = ₩10원**

### 크레딧 구매 옵션
- **10크레딧**: ₩100원 → 10,000토큰 (약 11턴)
- **50크레딧**: ₩500원 → 50,000토큰 (약 56턴)
- **100크레딧**: ₩1,000원 → 100,000토큰 (약 111턴)
- **500크레딧**: ₩5,000원 → 500,000토큰 (약 556턴)

## HTTP 메서드

### GET
AI 사용량을 조회합니다. 월간 리셋 체크가 자동으로 실행됩니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "usedTokens": 45000,
    "purchasedTokens": 90000,
    "remainingPercent": 70,
    "monthlyResetDate": "2024-01-21T10:00:00.000Z",
    "totalTurns": 50,
    "totalTokens": 45000,
    "averageTokensPerTurn": 900,
    "summary": {
      "totalTokens": 190000,
      "freeTokens": 100000,
      "usedFreeTokens": 45000,
      "usedPurchasedTokens": 0,
      "remainingFreeTokens": 55000,
      "remainingPurchasedTokens": 90000,
      "estimatedTurnsFromFree": 61,
      "estimatedTurnsFromPurchased": 100,
      "totalEstimatedTurns": 161,
      "nextResetDate": "2024-02-01T00:00:00.000Z",
      "averageCostPerTurn": 0.00639,
      "monthlyFreeValue": 0.71,
      "averageCostPerTurnKRW": 8.85,
      "monthlyFreeValueKRW": 980
    }
  }
}
```

### POST
AI 사용량 관리 액션을 실행합니다.

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

#### addTurnUsage
턴 사용량을 추가하고 소모된 토큰을 계산합니다.
```json
{
  "action": "addTurnUsage",
  "data": {
    "totalTokens": 900,
    "preciseMode": false
  }
}
```

**토큰 계산 규칙:**
- 기본: 실제 사용된 토큰 수
- 정밀 모드: 1.2x 토큰 소모 (더 정확한 응답을 위해)
- 1턴당 평균 900 토큰 기준으로 예상 남은 턴 수 계산

#### addPurchasedTokens
구매한 토큰을 추가합니다.
```json
{
  "action": "addPurchasedTokens",
  "data": {
    "tokens": 50000
  }
}
```

#### addPurchasedCredits
크레딧으로 토큰을 구매합니다 (1크레딧 = ₩10원 = 1,000토큰).
```json
{
  "action": "addPurchasedCredits",
  "data": {
    "credits": 100
  }
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "purchasedCredits": 100,
    "purchasedTokens": 100000,
    "costInKRW": 1000,
    "additionalTurns": 111,
    "message": "100크레딧(₩1,000)으로 100,000 토큰이 구매되었습니다. (예상 111턴)"
  }
}
```

#### grantTurns
턴 수만큼 토큰을 부여합니다 (1턴 = 900 토큰).
```json
{
  "action": "grantTurns",
  "data": {
    "turns": 10
  }
}
```

#### resetMonthly
월간 사용량을 리셋합니다 (무료 토큰만).
```json
{
  "action": "resetMonthly"
}
```

#### resetAll
모든 사용량을 리셋합니다.
```json
{
  "action": "resetAll"
}
```

#### initializeUsage
더미 데이터로 초기화합니다.
```json
{
  "action": "initializeUsage"
}
```

#### simulateUsage
사용량 시뮬레이션을 실행합니다.
```json
{
  "action": "simulateUsage",
  "data": {
    "simulationTurns": 20,
    "tokensPerTurn": 900,
    "preciseMode": false
  }
}
```

**시뮬레이션 응답:**
```json
{
  "success": true,
  "data": {
    "simulation": {
      "turns": 20,
      "tokensPerTurn": 900,
      "totalTokens": 18000,
      "preciseMode": false,
      "estimatedRemainingTurns": 141,
      "canAffordTurns": 20,
      "remainingTokens": 127000,
      "costEstimate": 0.1278
    },
    "message": "사용량 시뮬레이션이 완료되었습니다."
  }
}
```

### PATCH
AI 사용량을 부분적으로 업데이트합니다.
```json
{
  "updates": {
    "usedTokens": 50000,
    "purchasedTokens": 100000
  }
}
```

### DELETE
모든 AI 사용량을 초기화합니다.

## 상태 관리

### AIUsageState 인터페이스
```typescript
interface AIUsageState {
  usedTokens: number;           // 사용된 토큰 수
  purchasedTokens: number;      // 구매한 토큰 수
  remainingPercent: number;     // 남은 토큰 퍼센트
  monthlyResetDate: string;     // 월간 리셋 날짜
  totalTurns: number;           // 총 턴 수
  totalTokens: number;          // 총 사용된 토큰 수
  averageTokensPerTurn: number; // 턴당 평균 토큰 수
}
```

### Summary 객체
```typescript
{
  totalTokens: number;                    // 총 토큰 수 (무료 + 구매)
  freeTokens: number;                     // 무료 토큰 수
  usedFreeTokens: number;                 // 사용된 무료 토큰 수
  usedPurchasedTokens: number;            // 사용된 구매 토큰 수
  remainingFreeTokens: number;            // 남은 무료 토큰 수
  remainingPurchasedTokens: number;       // 남은 구매 토큰 수
  estimatedTurnsFromFree: number;         // 무료 토큰으로 가능한 예상 턴 수
  estimatedTurnsFromPurchased: number;    // 구매 토큰으로 가능한 예상 턴 수
  totalEstimatedTurns: number;            // 총 예상 턴 수
  nextResetDate: string;                  // 다음 리셋 날짜
  averageCostPerTurn: number;             // 턴당 평균 비용
  monthlyFreeValue: number;               // 월간 무료 가치
  averageCostPerTurnKRW: number;          // 턴당 평균 비용 (원화)
  monthlyFreeValueKRW: number;            // 월간 무료 가치 (원화)
  creditToTokens: number;                 // 1크레딧당 토큰 수
  creditToKRW: number;                    // 1크레딧당 원화 가격
  tokensToKRW: number;                    // 1,000토큰당 원화 가격
  creditDiscount: number;                 // 크레딧 할인율 (%)
}
```

## 사용 예시

### 1. AI 사용량 조회
```bash
curl -X GET /api/ai-usage
```

### 2. 턴 사용량 추가
```bash
curl -X POST /api/ai-usage \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addTurnUsage",
    "data": {
      "totalTokens": 1200,
      "preciseMode": true
    }
  }'
```

### 3. 토큰 구매
```bash
curl -X POST /api/ai-usage \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addPurchasedTokens",
    "data": {
      "tokens": 50000
    }
  }'
```

### 4. 크레딧으로 구매
```bash
curl -X POST /api/ai-usage \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addPurchasedCredits",
    "data": {
      "credits": 100
    }
  }'
```

### 5. 사용량 시뮬레이션
```bash
curl -X POST /api/ai-usage \
  -H "Content-Type: application/json" \
  -d '{
    "action": "simulateUsage",
    "data": {
      "simulationTurns": 30,
      "tokensPerTurn": 1000,
      "preciseMode": false
    }
  }'
```

## 월간 리셋

- 매월 1일 자동으로 무료 토큰 사용량이 리셋됩니다
- 구매한 토큰은 리셋되지 않습니다
- `monthlyResetDate`를 통해 다음 리셋 날짜를 확인할 수 있습니다

## 비용 계산

- **1턴당 평균 비용**: $0.00639 (900 토큰 ÷ 1000 × $0.0071)
- **1턴당 평균 비용 (원화)**: ₩8.85 (환율 1,385원 기준)
- **월간 무료 가치**: $0.71 (100,000 토큰 ÷ 1000 × $0.0071)
- **월간 무료 가치 (원화)**: ₩980 (환율 1,385원 기준)
- **정밀 모드**: 1.2배 토큰 소모로 더 정확한 응답 제공

## 한국 사용자를 위한 비용 안내

### 월간 무료 혜택
- **무료 제공**: 100,000 토큰 (약 ₩980원 상당)
- **사용 가능 턴 수**: 약 111턴
- **1턴당 비용**: 약 ₩8.85원

### 크레딧으로 구매 시
- **10크레딧 (₩100원)**: 10,000토큰 → 약 11턴
- **50크레딧 (₩500원)**: 50,000토큰 → 약 56턴
- **100크레딧 (₩1,000원)**: 100,000토큰 → 약 111턴
- **500크레딧 (₩5,000원)**: 500,000토큰 → 약 556턴

### 정밀 모드 사용 시
- **1턴당 비용**: 약 ₩10.62원 (1.2배 증가)
- **월간 무료로 사용 가능**: 약 93턴

### 크레딧 가치
- **1크레딧 = ₩10원 = 1,000토큰**
- **1,000토큰 = ₩10원 (크레딧 구매 시)**
- **1,000토큰 = ₩7.1원 (실제 API 비용, 환율 기준)**
- **크레딧 할인율**: 약 29% 할인 (₩10원 vs ₩7.1원)

## 주의사항

1. **메모리 기반 저장**: 현재는 메모리에 상태를 저장하므로 서버 재시작 시 데이터가 초기화됩니다
2. **프로덕션 환경**: 실제 서비스에서는 데이터베이스 연동을 권장합니다
3. **토큰 정확성**: 실제 GPT API와 연동 시 정확한 토큰 수를 사용해야 합니다
4. **보안**: API 키와 같은 민감한 정보는 환경변수로 관리해야 합니다
