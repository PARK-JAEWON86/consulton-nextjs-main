import crypto from 'crypto';

// 결제 정보 암호화/복호화를 위한 환경 변수
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'default-encryption-key-32-chars-long';
const ALGORITHM = 'aes-256-cbc';

/**
 * 민감한 결제 정보 암호화
 * @param text 암호화할 텍스트
 * @returns 암호화된 텍스트
 */
export function encryptPaymentData(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('결제 정보 암호화 오류:', error);
    throw new Error('결제 정보 암호화에 실패했습니다.');
  }
}

/**
 * 암호화된 결제 정보 복호화
 * @param encryptedText 암호화된 텍스트
 * @returns 복호화된 텍스트
 */
export function decryptPaymentData(encryptedText: string): string {
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('결제 정보 복호화 오류:', error);
    throw new Error('결제 정보 복호화에 실패했습니다.');
  }
}

/**
 * 카드 번호 마스킹 처리
 * @param cardNumber 카드 번호
 * @returns 마스킹된 카드 번호
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return cardNumber;
  }
  
  const last4 = cardNumber.slice(-4);
  const masked = '*'.repeat(cardNumber.length - 4);
  return masked + last4;
}

/**
 * 카드 번호 유효성 검사 (Luhn 알고리즘)
 * @param cardNumber 카드 번호
 * @returns 유효성 여부
 */
export function validateCardNumber(cardNumber: string): boolean {
  if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
    return false;
  }

  // 숫자가 아닌 문자 제거
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length !== cardNumber.length) {
    return false;
  }

  // Luhn 알고리즘 검증
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * 카드 만료일 유효성 검사
 * @param expiryDate 만료일 (MM/YY 형식)
 * @returns 유효성 여부
 */
export function validateExpiryDate(expiryDate: string): boolean {
  if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return false;
  }

  const [month, year] = expiryDate.split('/').map(Number);
  
  if (month < 1 || month > 12) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
}

/**
 * 금액 유효성 검사
 * @param amount 금액
 * @param minAmount 최소 금액
 * @param maxAmount 최대 금액
 * @returns 유효성 여부
 */
export function validateAmount(amount: number, minAmount: number = 0, maxAmount: number = 10000000): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  if (amount < minAmount || amount > maxAmount) {
    return false;
  }

  // 소수점 자릿수 검사 (원화는 정수만 허용)
  if (amount % 1 !== 0) {
    return false;
  }

  return true;
}

/**
 * 결제 수단 타입별 필수 필드 검증
 * @param type 결제 수단 타입
 * @param data 결제 수단 데이터
 * @returns 검증 결과
 */
export function validatePaymentMethodData(type: 'card' | 'bank', data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('결제 수단 이름이 필요합니다.');
  }

  if (type === 'card') {
    if (!data.last4 || !/^\d{4}$/.test(data.last4)) {
      errors.push('카드 번호 마지막 4자리가 필요합니다.');
    }
    
    if (!data.expiryDate || !validateExpiryDate(data.expiryDate)) {
      errors.push('유효한 카드 만료일이 필요합니다.');
    }
  }

  if (type === 'bank') {
    if (!data.bankName || typeof data.bankName !== 'string' || data.bankName.trim().length === 0) {
      errors.push('은행명이 필요합니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 결제 내역 데이터 검증
 * @param data 결제 내역 데이터
 * @returns 검증 결과
 */
export function validatePaymentHistoryData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.amount || !validateAmount(data.amount)) {
    errors.push('유효한 금액이 필요합니다.');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('결제 설명이 필요합니다.');
  }

  if (!data.type || !['topup', 'consultation', 'refund', 'withdrawal'].includes(data.type)) {
    errors.push('유효한 결제 타입이 필요합니다.');
  }

  if (data.type === 'topup' && data.amount <= 0) {
    errors.push('충전 금액은 0보다 커야 합니다.');
  }

  if (data.type === 'consultation' && data.amount >= 0) {
    errors.push('상담 결제는 음수 금액이어야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 크레딧 거래 데이터 검증
 * @param data 크레딧 거래 데이터
 * @returns 검증 결과
 */
export function validateCreditTransactionData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.type || !['earn', 'spend', 'refund', 'expire'].includes(data.type)) {
    errors.push('유효한 거래 타입이 필요합니다.');
  }

  if (!data.amount || !validateAmount(data.amount, -1000000, 1000000)) {
    errors.push('유효한 크레딧 양이 필요합니다.');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('거래 설명이 필요합니다.');
  }

  if (data.type === 'earn' && data.amount <= 0) {
    errors.push('적립 크레딧은 0보다 커야 합니다.');
  }

  if (data.type === 'spend' && data.amount >= 0) {
    errors.push('사용 크레딧은 음수여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 결제 보안 정책 검증
 * @param userId 사용자 ID
 * @param amount 금액
 * @param type 결제 타입
 * @returns 검증 결과
 */
export function validatePaymentSecurityPolicy(userId: string, amount: number, type: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 사용자 ID 검증
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    errors.push('유효한 사용자 ID가 필요합니다.');
  }

  // 금액 제한 검증
  if (type === 'topup' && amount > 1000000) {
    errors.push('한 번에 충전할 수 있는 최대 금액은 100만원입니다.');
  }

  if (type === 'consultation' && Math.abs(amount) > 100000) {
    errors.push('한 번에 사용할 수 있는 최대 크레딧은 100,000입니다.');
  }

  // 결제 빈도 제한 (실제로는 데이터베이스에서 확인해야 함)
  // if (await isPaymentRateLimited(userId)) {
  //   errors.push('결제가 너무 빈번합니다. 잠시 후 다시 시도해주세요.');
  // }

  return {
    isValid: errors.length === 0,
    errors
  };
}
