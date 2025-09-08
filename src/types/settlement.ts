/**
 * 정산/출금 시스템 타입 정의
 * DB/백엔드 교체 시에도 변경되지 않는 순수한 비즈니스 타입들
 */

// 기본 타입
export type Money = number; // KRW 정수
export type BasisPoints = number; // 1% = 100 bp
export type Credits = number; // 크레딧 (정수)

// 세션 상태
export type SessionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// 결제 상태  
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

// 정산 배치 상태
export type PayoutBatchStatus = 'draft' | 'frozen' | 'paid' | 'failed';

// 정산 항목 상태
export type PayoutItemStatus = 'pending' | 'paid' | 'failed';

// 레저 타입
export type LedgerType = 'CREDIT_TOPUP' | 'SESSION_CHARGE' | 'REFUND' | 'ADJUST' | 'PAYOUT';

// 계정 타입 (이중부기)
export type AccountType = 
  | 'cash' 
  | 'credits_liab' 
  | 'payable_expert' 
  | 'revenue_platform' 
  | 'pg_fee_exp' 
  | 'infra_exp' 
  | 'tax_withheld';

// 사용자 세금 모드
export type TaxMode = 'withhold' | 'self';

// 사용자 역할
export type UserRole = 'client' | 'expert' | 'admin';

// 전문가 레벨/티어
export type ExpertLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ExpertTier = 'basic' | 'premium' | 'enterprise';

/**
 * 핵심 도메인 엔티티
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  taxMode: TaxMode;
  bank?: BankAccount;
  expert?: ExpertInfo;
  createdAt: number;
  updatedAt: number;
}

export interface BankAccount {
  holder: string;
  bankCode: string;
  account: string;
}

export interface ExpertInfo {
  level: ExpertLevel;
  tier: ExpertTier;
  ratePerMinKrw: Money;
}

export interface Wallet {
  userId: string;
  credits: Credits;
  updatedAt: number;
}

export interface Payment {
  id: string;
  userId: string;
  amountKrw: Money;
  creditsIssued: Credits;
  pgFeeKrw: Money;
  status: PaymentStatus;
  idempotencyKey: string;
  createdAt: number;
  tossPaymentKey?: string;
  tossOrderId?: string;
}

export interface Session {
  id: string;
  clientId: string;
  expertId: string;
  startedAt: number;
  endedAt: number;
  durationMin: number;
  ratePerMinKrw: Money;
  totalKrw: Money;
  platformFeeKrw: Money;
  expertGrossKrw: Money;
  infraCostKrw: Money;
  status: SessionStatus;
  meta?: Record<string, any>;
}

export interface LedgerEntry {
  id: string;
  ts: number;
  type: LedgerType;
  amountKrw: Money;
  debit: AccountType;
  credit: AccountType;
  refId: string;
  splits?: LedgerSplit[];
  description?: string;
}

export interface LedgerSplit {
  debit?: AccountType;
  credit?: AccountType;
  amountKrw: Money;
}

export interface PayoutBatch {
  id: string;
  month: string; // 'YYYY-MM'
  scheduledAt: number;
  executedAt?: number;
  status: PayoutBatchStatus;
  totals: PayoutBatchTotals;
}

export interface PayoutBatchTotals {
  experts: number;
  grossKrw: Money;
  withheldKrw: Money;
  netPaidKrw: Money;
}

export interface PayoutItem {
  batchId: string;
  expertId: string;
  period: PayoutPeriod;
  grossKrw: Money;
  taxWithheldKrw: Money;
  netKrw: Money;
  bank: BankAccount;
  status: PayoutItemStatus;
  breakdown: PayoutBreakdown[];
  createdAt: number;
  paidAt?: number;
  failureReason?: string;
}

export interface PayoutPeriod {
  from: string; // 'YYYY-MM-DD'
  to: string;   // 'YYYY-MM-DD'
}

export interface PayoutBreakdown {
  sessionId: string;
  amountKrw: Money;
}

/**
 * 설정 및 구성
 */
export interface RuntimeConfig {
  withhold_3_3: boolean;
  platformFeeBp: BasisPoints;
  pgFeeBp: BasisPoints;
  settlementDay: number;
  infraCostPerMin: number;
  timezone: string;
}

/**
 * API 요청/응답 타입
 */
export interface TopupIntentRequest {
  amountKrw: Money;
  userId: string;
  idempotencyKey?: string;
}

export interface TopupIntentResponse {
  paymentId: string;
  tossPaymentKey: string;
  tossOrderId: string;
  amountKrw: Money;
  creditsToIssue: Credits;
}

export interface SessionCompleteRequest {
  sessionId: string;
  clientId: string;
  expertId: string;
  startedAt: number;
  endedAt: number;
  durationMin: number;
  ratePerMinKrw: Money;
}

export interface SessionCompleteResponse {
  sessionId: string;
  totalKrw: Money;
  platformFeeKrw: Money;
  expertGrossKrw: Money;
  creditsCharged: Credits;
}

export interface SettlementRunRequest {
  month: string; // 'YYYY-MM'
  dryRun?: boolean;
}

export interface SettlementRunResponse {
  batchId: string;
  month: string;
  itemsCount: number;
  totals: PayoutBatchTotals;
  dryRun?: boolean;
}

export interface SettlementConfirmRequest {
  batchId: string;
  payouts: PayoutConfirmation[];
}

export interface PayoutConfirmation {
  expertId: string;
  status: PayoutItemStatus;
  txId?: string;
  failureReason?: string;
}

/**
 * 통계 및 리포트
 */
export interface SettlementStats {
  month: string;
  totalSessions: number;
  totalRevenueKrw: Money;
  platformRevenueKrw: Money;
  expertPayoutsKrw: Money;
  infraCostKrw: Money;
  pgFeeKrw: Money;
  netProfitKrw: Money;
}

export interface ExpertEarnings {
  expertId: string;
  period: PayoutPeriod;
  totalSessions: number;
  grossEarningsKrw: Money;
  platformFeeKrw: Money;
  netEarningsKrw: Money;
  avgSessionDurationMin: number;
  avgRatePerMinKrw: Money;
}

/**
 * 에러 타입
 */
export class SettlementError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SettlementError';
  }
}

export const SETTLEMENT_ERROR_CODES = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INVALID_SESSION: 'INVALID_SESSION',
  BATCH_ALREADY_EXISTS: 'BATCH_ALREADY_EXISTS',
  BATCH_NOT_FOUND: 'BATCH_NOT_FOUND',
  PAYOUT_ALREADY_PROCESSED: 'PAYOUT_ALREADY_PROCESSED',
  INVALID_PERIOD: 'INVALID_PERIOD',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  BANK_INFO_MISSING: 'BANK_INFO_MISSING',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED'
} as const;
