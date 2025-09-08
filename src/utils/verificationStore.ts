// 이메일 인증 코드 관리 유틸리티
// 실제 프로덕션에서는 Redis나 데이터베이스를 사용해야 합니다

// 임시 저장소 (메모리 기반)
const verificationCodes = new Map<string, { 
  code: string; 
  expires: number; 
  userId: number 
}>();

/**
 * 인증 코드 저장
 * @param email 사용자 이메일
 * @param code 인증 코드
 * @param userId 사용자 ID
 * @param expiresInMinutes 만료 시간 (분 단위, 기본값: 10분)
 */
export function storeVerificationCode(
  email: string, 
  code: string, 
  userId: number, 
  expiresInMinutes: number = 10
) {
  const expires = Date.now() + (expiresInMinutes * 60 * 1000);
  verificationCodes.set(email.toLowerCase(), { code, expires, userId });
}

/**
 * 인증 코드 조회
 * @param email 사용자 이메일
 * @returns 저장된 인증 코드 데이터 또는 undefined
 */
export function getVerificationCode(email: string) {
  return verificationCodes.get(email.toLowerCase());
}

/**
 * 인증 코드 삭제
 * @param email 사용자 이메일
 */
export function deleteVerificationCode(email: string) {
  verificationCodes.delete(email.toLowerCase());
}

/**
 * 만료된 인증 코드 정리 (선택적)
 */
export function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
}
