/**
 * Repository 인터페이스 정의
 * DB/백엔드 구현체와 무관한 순수한 데이터 접근 계약
 */

import {
  User,
  Wallet,
  Payment,
  Session,
  LedgerEntry,
  PayoutBatch,
  PayoutItem,
  RuntimeConfig,
  Money,
  Credits,
  SessionStatus,
  PaymentStatus,
  PayoutBatchStatus,
  PayoutItemStatus
} from '../../types/settlement';

/**
 * 사용자 관리 Repository
 */
export interface UserRepository {
  getUserById(userId: string): Promise<User | null>;
  getUsersByRole(role: 'expert' | 'client' | 'admin'): Promise<User[]>;
  updateUser(userId: string, updates: Partial<User>): Promise<void>;
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void>;
}

/**
 * 지갑 관리 Repository
 */
export interface WalletRepository {
  getWallet(userId: string): Promise<Wallet | null>;
  updateCredits(userId: string, credits: Credits): Promise<void>;
  addCredits(userId: string, amount: Credits): Promise<void>;
  deductCredits(userId: string, amount: Credits): Promise<boolean>; // false if insufficient
  getWalletsByUserIds(userIds: string[]): Promise<Wallet[]>;
}

/**
 * 결제 관리 Repository
 */
export interface PaymentRepository {
  createPayment(payment: Omit<Payment, 'createdAt'>): Promise<void>;
  updatePaymentStatus(paymentId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<void>;
  getPaymentById(paymentId: string): Promise<Payment | null>;
  getPaymentsByUser(userId: string, limit?: number): Promise<Payment[]>;
  getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]>;
  getPaymentsByPeriod(from: number, to: number): Promise<Payment[]>;
}

/**
 * 세션 관리 Repository
 */
export interface SessionRepository {
  createSession(session: Session): Promise<void>;
  updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void>;
  getSessionById(sessionId: string): Promise<Session | null>;
  getSessionsByExpert(expertId: string, limit?: number): Promise<Session[]>;
  getSessionsByClient(clientId: string, limit?: number): Promise<Session[]>;
  getSessionsByStatus(status: SessionStatus): Promise<Session[]>;
  getSessionsByPeriod(from: number, to: number, status?: SessionStatus): Promise<Session[]>;
  getSessionsByExpertAndPeriod(expertId: string, from: number, to: number, status?: SessionStatus): Promise<Session[]>;
}

/**
 * 장부 관리 Repository (이중부기)
 */
export interface LedgerRepository {
  createEntry(entry: Omit<LedgerEntry, 'id'>): Promise<string>; // returns entry ID
  getEntriesByType(type: string): Promise<LedgerEntry[]>;
  getEntriesByRefId(refId: string): Promise<LedgerEntry[]>;
  getEntriesByPeriod(from: number, to: number): Promise<LedgerEntry[]>;
  getEntriesByAccount(account: string): Promise<LedgerEntry[]>;
  
  // 회계 조회 메서드
  getAccountBalance(account: string, asOfDate?: number): Promise<Money>;
  getAccountBalances(accounts: string[], asOfDate?: number): Promise<Record<string, Money>>;
}

/**
 * 정산 배치 관리 Repository
 */
export interface PayoutBatchRepository {
  createBatch(batch: PayoutBatch): Promise<void>;
  updateBatchStatus(batchId: string, status: PayoutBatchStatus, executedAt?: number): Promise<void>;
  getBatchById(batchId: string): Promise<PayoutBatch | null>;
  getBatchesByStatus(status: PayoutBatchStatus): Promise<PayoutBatch[]>;
  getBatchesByMonth(month: string): Promise<PayoutBatch[]>;
  getAllBatches(limit?: number): Promise<PayoutBatch[]>;
}

/**
 * 정산 항목 관리 Repository
 */
export interface PayoutItemRepository {
  createItem(item: PayoutItem): Promise<void>;
  updateItemStatus(batchId: string, expertId: string, status: PayoutItemStatus, paidAt?: number, failureReason?: string): Promise<void>;
  getItemById(batchId: string, expertId: string): Promise<PayoutItem | null>;
  getItemsByBatch(batchId: string): Promise<PayoutItem[]>;
  getItemsByExpert(expertId: string, limit?: number): Promise<PayoutItem[]>;
  getItemsByStatus(status: PayoutItemStatus): Promise<PayoutItem[]>;
}

/**
 * 설정 관리 Repository
 */
export interface ConfigRepository {
  getRuntimeConfig(): Promise<RuntimeConfig>;
  updateRuntimeConfig(config: Partial<RuntimeConfig>): Promise<void>;
}

/**
 * 트랜잭션 관리 인터페이스
 * 복수의 Repository 작업을 원자적으로 실행
 */
export interface TransactionManager {
  runTransaction<T>(
    callback: (repositories: RepositoryContainer) => Promise<T>
  ): Promise<T>;
}

/**
 * Repository 컨테이너
 * 의존성 주입을 위한 모든 Repository 집합
 */
export interface RepositoryContainer {
  users: UserRepository;
  wallets: WalletRepository;
  payments: PaymentRepository;
  sessions: SessionRepository;
  ledgers: LedgerRepository;
  payoutBatches: PayoutBatchRepository;
  payoutItems: PayoutItemRepository;
  config: ConfigRepository;
  transaction: TransactionManager;
}

/**
 * Repository 팩토리 인터페이스
 * 환경에 따라 다른 구현체를 생성
 */
export interface RepositoryFactory {
  createContainer(): RepositoryContainer;
  cleanup?(): Promise<void>;
}

/**
 * 조회 옵션
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PeriodFilter {
  from: number;
  to: number;
}

/**
 * 집계 쿼리 인터페이스
 */
export interface AggregationQuery {
  groupBy?: string[];
  sum?: string[];
  count?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
}

/**
 * 통계 조회용 Repository 확장
 */
export interface StatsRepository {
  getSessionStats(period: PeriodFilter, expertId?: string): Promise<{
    totalSessions: number;
    totalDurationMin: number;
    totalRevenueKrw: Money;
    avgSessionDurationMin: number;
    avgRatePerMinKrw: Money;
  }>;
  
  getPaymentStats(period: PeriodFilter, userId?: string): Promise<{
    totalPayments: number;
    totalAmountKrw: Money;
    totalCreditsIssued: Credits;
    totalPgFeeKrw: Money;
    avgPaymentAmountKrw: Money;
  }>;
  
  getExpertEarnings(expertId: string, period: PeriodFilter): Promise<{
    totalSessions: number;
    grossEarningsKrw: Money;
    netEarningsKrw: Money;
    avgRatePerMinKrw: Money;
  }>;
  
  getPlatformStats(period: PeriodFilter): Promise<{
    totalRevenueKrw: Money;
    platformRevenueKrw: Money;
    expertPayoutsKrw: Money;
    infraCostKrw: Money;
    pgFeeKrw: Money;
    netProfitKrw: Money;
  }>;
}

/**
 * 확장된 Repository 컨테이너 (통계 포함)
 */
export interface ExtendedRepositoryContainer extends RepositoryContainer {
  stats: StatsRepository;
}
