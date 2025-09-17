# 전문가 레벨 시스템 API

전문가 레벨 시스템을 관리하는 API입니다. 레벨별 과금 체계, 티어 정보, 진행률 등을 제공합니다.

## API 엔드포인트

### GET `/api/expert-levels`

쿼리 파라미터를 통해 다양한 레벨 정보를 조회할 수 있습니다.

#### 사용 가능한 액션들

| 액션 | 설명 | 파라미터 | 반환값 |
|------|------|----------|--------|
| `getAllLevels` | 모든 레벨 정보 조회 | 없음 | 레벨 배열 |
| `calculateCreditsByLevel` | 레벨별 분당 크레딧 계산 | `level` | 레벨과 크레딧 |
| `getTierInfo` | 레벨별 티어 정보 | `level` | 레벨과 티어 정보 |
| `getTierInfoByName` | 티어명으로 티어 정보 조회 | `tierName` | 티어명과 티어 정보 |
| `getNextTierProgress` | 다음 티어까지 진행률 | `level` | 진행률 정보 |
| `getTierBadgeStyles` | 티어 배지 스타일 | `level` | 스타일 정보 |
| `getLevelPricing` | 레벨별 요금 정보 | `level` | 요금 정보 |
| `getKoreanTierName` | 한국어 티어명 | `tierName` | 한국어 티어명 |
| `calculateExpertLevel` | 전문가 레벨 계산 | `totalSessions`, `avgRating` | 레벨 정보 |

#### 사용 예시

```typescript
// 모든 레벨 정보 조회
const levels = await fetch('/api/expert-levels?action=getAllLevels');

// 레벨 500의 분당 크레딧 계산
const credits = await fetch('/api/expert-levels?action=calculateCreditsByLevel&level=500');

// 레벨 300의 티어 정보 조회
const tierInfo = await fetch('/api/expert-levels?action=getTierInfo&level=300');

// 전문가 레벨 계산 (세션 50개, 평점 4.5)
const levelInfo = await fetch('/api/expert-levels?action=calculateExpertLevel&totalSessions=50&avgRating=4.5');
```

### POST `/api/expert-levels`

복잡한 데이터 처리를 위한 POST 요청을 지원합니다.

#### 사용 가능한 액션들

| 액션 | 설명 | 요청 바디 | 반환값 |
|------|------|------------|--------|
| `calculateTierStatistics` | 티어별 통계 계산 | `{ experts: ExpertLevelLike[] }` | 통계 정보 |
| `batchCalculate` | 여러 전문가 레벨 일괄 계산 | `{ experts: ExpertLevelLike[] }` | 계산된 전문가 목록 |

#### 사용 예시

```typescript
// 티어별 통계 계산
const stats = await fetch('/api/expert-levels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'calculateTierStatistics',
    data: { experts: expertList }
  })
});

// 일괄 계산
const calculatedExperts = await fetch('/api/expert-levels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'batchCalculate',
    data: { experts: expertList }
  })
});
```

## 레벨 시스템 구조

### 티어별 점수 요구사항

| 티어 | 레벨 범위 | 점수 범위 | 크레딧/분 | 원화/분 | 설명 |
|------|-----------|-----------|------------|---------|------|
| Tier 10 | Lv.999 | 98.0-100.0 | 600 | 6,000원 | 특별 최고 요금 |
| Tier 10 | Lv.900-998 | 92.0-97.99 | 500 | 5,000원 | 고정 요금 |
| Tier 9 | Lv.800-899 | 87.0-91.99 | 500 | 5,000원 | 고급 전문가 |
| Tier 8 | Lv.700-799 | 82.0-86.99 | 450 | 4,500원 | 중고급 전문가 |
| Tier 7 | Lv.600-699 | 77.0-81.99 | 400 | 4,000원 | 중급 전문가 |
| Tier 6 | Lv.500-599 | 72.0-76.99 | 350 | 3,500원 | 중급 전문가 |
| Tier 5 | Lv.400-499 | 67.0-71.99 | 300 | 3,000원 | 중급 전문가 |
| Tier 4 | Lv.300-399 | 62.0-66.99 | 250 | 2,500원 | 중급 전문가 |
| Tier 3 | Lv.200-299 | 57.0-61.99 | 200 | 2,000원 | 중급 전문가 |
| Tier 2 | Lv.100-199 | 52.0-56.99 | 150 | 1,500원 | 중급 전문가 |
| Tier 1 | Lv.1-99 | 0.0-51.99 | 100 | 1,000원 | 초급 전문가 |

### 점수 계산 공식

전문가 통계 API에서 계산되는 `rankingScore`는 다음 요소들의 가중 평균입니다:

- **상담 횟수 (40%)**: `Math.min(totalSessions / 1000, 1) * 40` (1000회 이상 시 만점)
- **평점 (30%)**: `(avgRating / 5) * 30`
- **리뷰 수 (15%)**: `Math.min(reviewCount / 500, 1) * 15` (500개 이상 시 만점)
- **재방문 고객 비율 (10%)**: `(repeatClients / totalSessions) * 10`
- **좋아요 수 (5%)**: `Math.min(likeCount / 1000, 1) * 5` (1000개 이상 시 만점)

### 요금 체계

1크레딧 = 10원 기준으로 계산됩니다.

## 클라이언트 사용법

### API 호출 함수 사용

```typescript
// API를 통한 크레딧 계산
const calculateCredits = async (level: number) => {
  const response = await fetch(`/api/expert-levels?action=calculateCreditsByLevel&level=${level}`);
  const data = await response.json();
  return data.creditsPerMinute;
};

// API를 통한 티어 정보 조회
const getTierInfo = async (level: number) => {
  const response = await fetch(`/api/expert-levels?action=getTierInfo&level=${level}`);
  const data = await response.json();
  return data.tierInfo;
};
```

### 직접 API 호출

```typescript
// GET 요청
const response = await fetch('/api/expert-levels?action=getTierInfo&level=500');
const data = await response.json();

// POST 요청
const response = await fetch('/api/expert-levels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'calculateTierStatistics',
    data: { experts: expertList }
  })
});
const data = await response.json();
```

## 에러 처리

API 호출 시 오류가 발생하면 다음과 같은 응답을 받습니다:

```json
{
  "error": "서버 오류가 발생했습니다."
}
```

HTTP 상태 코드는 500으로 반환됩니다.

## 성능 고려사항

- API 호출은 비동기적으로 처리됩니다
- 자주 사용되는 데이터는 클라이언트에서 캐싱하는 것을 권장합니다
- 일괄 처리가 필요한 경우 POST 요청을 사용하세요
