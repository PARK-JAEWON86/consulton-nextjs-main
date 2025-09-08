/**
 * 텍스트의 토큰 수를 추정합니다
 * 한국어 친화적: ~2글자 ≈ 1토큰
 */
export function estimateTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 2));
}

/**
 * 한 턴(사용자 질문 + AI 답변)의 총 토큰 수를 추정합니다
 */
export function estimateTurnTokens(userText: string, aiText: string): number {
  return estimateTokensFromText(userText) + estimateTokensFromText(aiText);
}
