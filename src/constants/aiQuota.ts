// TODO: AI 크레딧 정책이 API로 이전될 예정입니다.
// 현재는 기본 계산 로직만 유지하고, 실제 크레딧 관리는 API에서 처리할 예정입니다.

export const BASE_CREDIT_PER_TURN = 3;
export const MONTHLY_FREE_BUDGET_CREDITS = 300; // (= 100턴 × 3크레딧)

export interface LengthBracket {
  maxTokens: number;
  mult: number;
}

export const LENGTH_BRACKETS: LengthBracket[] = [
  { maxTokens: 400, mult: 1.0 },
  { maxTokens: 800, mult: 1.5 },
  { maxTokens: 1200, mult: 2.0 },
  { maxTokens: Infinity, mult: 3.0 },
];

export function estimateCreditsForTurn(
  totalTokens: number,
  preciseMode?: boolean
): number {
  // 토큰 길이에 따른 브라켓 찾기
  const bracket = LENGTH_BRACKETS.find(
    (bracket) => totalTokens <= bracket.maxTokens
  );
  if (!bracket) {
    throw new Error("Invalid token count");
  }

  // 기본 크레딧에 멀티플라이어 적용
  let credits = BASE_CREDIT_PER_TURN * bracket.mult;

  // 정밀 모드일 경우 1.5배 추가
  if (preciseMode) {
    credits *= 1.5;
  }

  // 올림하여 반환
  return Math.ceil(credits);
}

export function calcRemainingPercent(
  usedCredits: number,
  purchasedCredits: number
): number {
  const total = MONTHLY_FREE_BUDGET_CREDITS + purchasedCredits;
  return Math.max(0, Math.round(100 * (1 - usedCredits / total)));
}
