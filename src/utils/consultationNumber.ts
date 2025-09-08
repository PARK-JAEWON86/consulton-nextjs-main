/**
 * 상담번호 생성 및 관리 유틸리티
 */

export interface ConsultationNumberInfo {
  date: Date;
  sequence: number;
}

/**
 * 상담번호 생성 함수
 * @param date 상담 날짜
 * @param sequence 일련번호
 * @returns CS241219001 형식의 상담번호
 */
export function generateConsultationNumber(date: Date, sequence: number): string {
  const year = String(date.getFullYear()).slice(-2); // 뒤 2자리만
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequenceStr = String(sequence).padStart(3, '0');
  
  return `CS${year}${month}${day}${sequenceStr}`;
}

/**
 * 상담번호에서 정보 추출 함수
 * @param consultationNumber CS241219001 형식의 상담번호
 * @returns 날짜와 일련번호 정보
 */
export function parseConsultationNumber(consultationNumber: string): ConsultationNumberInfo | null {
  const match = consultationNumber.match(/CS(\d{2})(\d{2})(\d{2})(\d{3})/);
  if (match) {
    const year = parseInt('20' + match[1]); // 20xx년으로 변환
    const month = parseInt(match[2]) - 1; // JavaScript Date는 0부터 시작
    const day = parseInt(match[3]);
    const sequence = parseInt(match[4]);
    
    return {
      date: new Date(year, month, day),
      sequence
    };
  }
  return null;
}

/**
 * 상담번호 유효성 검사 함수
 * @param consultationNumber 검사할 상담번호
 * @returns 유효한 상담번호인지 여부
 */
export function isValidConsultationNumber(consultationNumber: string): boolean {
  const pattern = /^CS\d{8}$/;
  if (!pattern.test(consultationNumber)) {
    return false;
  }
  
  const info = parseConsultationNumber(consultationNumber);
  if (!info) {
    return false;
  }
  
  // 날짜 유효성 검사
  const date = info.date;
  const now = new Date();
  
  // 미래 날짜는 허용하지 않음 (상담은 과거에 이루어져야 함)
  if (date > now) {
    return false;
  }
  
  // 너무 과거 날짜는 허용하지 않음 (예: 10년 전)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  if (date < tenYearsAgo) {
    return false;
  }
  
  // 일련번호는 1-999 범위
  if (info.sequence < 1 || info.sequence > 999) {
    return false;
  }
  
  return true;
}

/**
 * 상담번호로 정렬하는 함수
 * @param a 첫 번째 상담 요약
 * @param b 두 번째 상담 요약
 * @returns 정렬 순서 (-1: a가 앞, 1: b가 앞, 0: 동일)
 */
export function sortByConsultationNumber(a: { consultationNumber?: string }, b: { consultationNumber?: string }): number {
  const aInfo = a.consultationNumber ? parseConsultationNumber(a.consultationNumber) : null;
  const bInfo = b.consultationNumber ? parseConsultationNumber(b.consultationNumber) : null;
  
  // 상담번호가 없는 경우 맨 뒤로
  if (!aInfo && !bInfo) return 0;
  if (!aInfo) return 1;
  if (!bInfo) return -1;
  
  // 날짜가 다르면 날짜로 정렬 (최신순)
  if (aInfo.date.getTime() !== bInfo.date.getTime()) {
    return bInfo.date.getTime() - aInfo.date.getTime();
  }
  
  // 날짜가 같으면 일련번호로 정렬 (최신순)
  return bInfo.sequence - aInfo.sequence;
}

/**
 * 특정 날짜의 다음 일련번호 계산 함수
 * @param date 상담 날짜
 * @param existingNumbers 해당 날짜의 기존 상담번호들
 * @returns 다음 일련번호
 */
export function getNextSequenceNumber(date: Date, existingNumbers: string[]): number {
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dateNumbers = existingNumbers
    .map(num => parseConsultationNumber(num))
    .filter(info => info && info.date.getTime() === targetDate.getTime())
    .map(info => info!.sequence);
  
  if (dateNumbers.length === 0) {
    return 1;
  }
  
  return Math.max(...dateNumbers) + 1;
}

/**
 * 상담번호 포맷팅 함수 (표시용)
 * @param consultationNumber 상담번호
 * @returns 포맷팅된 상담번호
 */
export function formatConsultationNumber(consultationNumber: string): string {
  const info = parseConsultationNumber(consultationNumber);
  if (!info) {
    return consultationNumber;
  }
  
  const dateStr = info.date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return `${dateStr} (${info.sequence}번)`;
}
