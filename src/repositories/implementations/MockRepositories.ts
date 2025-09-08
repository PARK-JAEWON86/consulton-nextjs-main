/**
 * Mock Repository 구현체
 * 개발 초기 단계에서 사용할 메모리 기반 구현체
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
  PayoutItemStatus,
  AccountType
} from '../../types/settlement';

import {
  UserRepository,
  WalletRepository,
  PaymentRepository,
  SessionRepository,
  LedgerRepository,
  PayoutBatchRepository,
  PayoutItemRepository,
  ConfigRepository,
  TransactionManager,
  RepositoryContainer,
  ExtendedRepositoryContainer,
  StatsRepository,
  QueryOptions,
  PeriodFilter
} from '../interfaces';

/**
 * 메모리 기반 데이터 저장소
 */
class MemoryStore {
  users = new Map<string, User>();
  wallets = new Map<string, Wallet>();
  payments = new Map<string, Payment>();
  sessions = new Map<string, Session>();
  ledgers = new Map<string, LedgerEntry>();
  payoutBatches = new Map<string, PayoutBatch>();
  payoutItems = new Map<string, PayoutItem>(); // key: `${batchId}_${expertId}`
  config: RuntimeConfig = {
    withhold_3_3: true,
    platformFeeBp: 1200, // 12%
    pgFeeBp: 200, // 2%
    settlementDay: 5,
    infraCostPerMin: 6.35,
    timezone: 'Asia/Seoul'
  };

  clear() {
    this.users.clear();
    this.wallets.clear();
    this.payments.clear();
    this.sessions.clear();
    this.ledgers.clear();
    this.payoutBatches.clear();
    this.payoutItems.clear();
  }
}

// 전역 메모리 스토어 (싱글톤)
const memoryStore = new MemoryStore();

/**
 * Mock User Repository
 */
export class MockUserRepository implements UserRepository {
  async getUserById(userId: string): Promise<User | null> {
    return memoryStore.users.get(userId) || null;
  }

  async getUsersByRole(role: 'expert' | 'client' | 'admin'): Promise<User[]> {
    return Array.from(memoryStore.users.values()).filter(user => user.role === role);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { ...user, ...updates, updatedAt: Date.now() });
    }
  }

  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now();
    memoryStore.users.set(user.id, {
      ...user,
      createdAt: now,
      updatedAt: now
    });
  }
}

/**
 * Mock Wallet Repository
 */
export class MockWalletRepository implements WalletRepository {
  async getWallet(userId: string): Promise<Wallet | null> {
    return memoryStore.wallets.get(userId) || null;
  }

  async updateCredits(userId: string, credits: Credits): Promise<void> {
    memoryStore.wallets.set(userId, {
      userId,
      credits,
      updatedAt: Date.now()
    });
  }

  async addCredits(userId: string, amount: Credits): Promise<void> {
    const wallet = await this.getWallet(userId) || { userId, credits: 0, updatedAt: Date.now() };
    wallet.credits += amount;
    wallet.updatedAt = Date.now();
    memoryStore.wallets.set(userId, wallet);
  }

  async deductCredits(userId: string, amount: Credits): Promise<boolean> {
    const wallet = await this.getWallet(userId);
    if (!wallet || wallet.credits < amount) {
      return false;
    }
    
    wallet.credits -= amount;
    wallet.updatedAt = Date.now();
    memoryStore.wallets.set(userId, wallet);
    return true;
  }

  async getWalletsByUserIds(userIds: string[]): Promise<Wallet[]> {
    const wallets: Wallet[] = [];
    for (const userId of userIds) {
      const wallet = await this.getWallet(userId);
      if (wallet) {
        wallets.push(wallet);
      }
    }
    return wallets;
  }
}

/**
 * Mock Payment Repository
 */
export class MockPaymentRepository implements PaymentRepository {
  async createPayment(payment: Omit<Payment, 'createdAt'>): Promise<void> {
    memoryStore.payments.set(payment.id, {
      ...payment,
      createdAt: Date.now()
    });
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<void> {
    const payment = memoryStore.payments.get(paymentId);
    if (payment) {
      memoryStore.payments.set(paymentId, {
        ...payment,
        status,
        ...(metadata || {})
      });
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return memoryStore.payments.get(paymentId) || null;
  }

  async getPaymentsByUser(userId: string, limit?: number): Promise<Payment[]> {
    const payments = Array.from(memoryStore.payments.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return limit ? payments.slice(0, limit) : payments;
  }

  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return Array.from(memoryStore.payments.values()).filter(p => p.status === status);
  }

  async getPaymentsByPeriod(from: number, to: number): Promise<Payment[]> {
    return Array.from(memoryStore.payments.values())
      .filter(p => p.createdAt >= from && p.createdAt <= to);
  }
}

/**
 * Mock Session Repository
 */
export class MockSessionRepository implements SessionRepository {
  async createSession(session: Session): Promise<void> {
    memoryStore.sessions.set(session.id, session);
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    const session = memoryStore.sessions.get(sessionId);
    if (session) {
      memoryStore.sessions.set(sessionId, { ...session, status });
    }
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    return memoryStore.sessions.get(sessionId) || null;
  }

  async getSessionsByExpert(expertId: string, limit?: number): Promise<Session[]> {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.expertId === expertId)
      .sort((a, b) => b.endedAt - a.endedAt);
    
    return limit ? sessions.slice(0, limit) : sessions;
  }

  async getSessionsByClient(clientId: string, limit?: number): Promise<Session[]> {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.clientId === clientId)
      .sort((a, b) => b.endedAt - a.endedAt);
    
    return limit ? sessions.slice(0, limit) : sessions;
  }

  async getSessionsByStatus(status: SessionStatus): Promise<Session[]> {
    return Array.from(memoryStore.sessions.values()).filter(s => s.status === status);
  }

  async getSessionsByPeriod(from: number, to: number, status?: SessionStatus): Promise<Session[]> {
    let sessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.endedAt >= from && s.endedAt <= to);
    
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }
    
    return sessions;
  }

  async getSessionsByExpertAndPeriod(expertId: string, from: number, to: number, status?: SessionStatus): Promise<Session[]> {
    let sessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.expertId === expertId && s.endedAt >= from && s.endedAt <= to);
    
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }
    
    return sessions;
  }
}

/**
 * Mock Ledger Repository
 */
export class MockLedgerRepository implements LedgerRepository {
  async createEntry(entry: Omit<LedgerEntry, 'id'>): Promise<string> {
    const id = `LEDGER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    memoryStore.ledgers.set(id, { ...entry, id });
    return id;
  }

  async getEntriesByType(type: string): Promise<LedgerEntry[]> {
    return Array.from(memoryStore.ledgers.values()).filter(e => e.type === type);
  }

  async getEntriesByRefId(refId: string): Promise<LedgerEntry[]> {
    return Array.from(memoryStore.ledgers.values()).filter(e => e.refId === refId);
  }

  async getEntriesByPeriod(from: number, to: number): Promise<LedgerEntry[]> {
    return Array.from(memoryStore.ledgers.values())
      .filter(e => e.ts >= from && e.ts <= to);
  }

  async getEntriesByAccount(account: string): Promise<LedgerEntry[]> {
    return Array.from(memoryStore.ledgers.values())
      .filter(e => e.debit === account || e.credit === account);
  }

  async getAccountBalance(account: string, asOfDate?: number): Promise<Money> {
    const entries = Array.from(memoryStore.ledgers.values())
      .filter(e => {
        if (asOfDate && e.ts > asOfDate) return false;
        return e.debit === account || e.credit === account;
      });

    let balance = 0;
    for (const entry of entries) {
      if (entry.debit === account) {
        balance += entry.amountKrw;
      }
      if (entry.credit === account) {
        balance -= entry.amountKrw;
      }
      
      // splits 처리
      if (entry.splits) {
        for (const split of entry.splits) {
          if (split.debit === account) {
            balance += split.amountKrw;
          }
          if (split.credit === account) {
            balance -= split.amountKrw;
          }
        }
      }
    }

    return balance;
  }

  async getAccountBalances(accounts: string[], asOfDate?: number): Promise<Record<string, Money>> {
    const balances: Record<string, Money> = {};
    for (const account of accounts) {
      balances[account] = await this.getAccountBalance(account, asOfDate);
    }
    return balances;
  }
}

/**
 * Mock Payout Batch Repository
 */
export class MockPayoutBatchRepository implements PayoutBatchRepository {
  async createBatch(batch: PayoutBatch): Promise<void> {
    memoryStore.payoutBatches.set(batch.id, batch);
  }

  async updateBatchStatus(batchId: string, status: PayoutBatchStatus, executedAt?: number): Promise<void> {
    const batch = memoryStore.payoutBatches.get(batchId);
    if (batch) {
      memoryStore.payoutBatches.set(batchId, {
        ...batch,
        status,
        ...(executedAt ? { executedAt } : {})
      });
    }
  }

  async getBatchById(batchId: string): Promise<PayoutBatch | null> {
    return memoryStore.payoutBatches.get(batchId) || null;
  }

  async getBatchesByStatus(status: PayoutBatchStatus): Promise<PayoutBatch[]> {
    return Array.from(memoryStore.payoutBatches.values()).filter(b => b.status === status);
  }

  async getBatchesByMonth(month: string): Promise<PayoutBatch[]> {
    return Array.from(memoryStore.payoutBatches.values()).filter(b => b.month === month);
  }

  async getAllBatches(limit?: number): Promise<PayoutBatch[]> {
    const batches = Array.from(memoryStore.payoutBatches.values())
      .sort((a, b) => b.scheduledAt - a.scheduledAt);
    
    return limit ? batches.slice(0, limit) : batches;
  }
}

/**
 * Mock Payout Item Repository
 */
export class MockPayoutItemRepository implements PayoutItemRepository {
  private getKey(batchId: string, expertId: string): string {
    return `${batchId}_${expertId}`;
  }

  async createItem(item: PayoutItem): Promise<void> {
    const key = this.getKey(item.batchId, item.expertId);
    memoryStore.payoutItems.set(key, item);
  }

  async updateItemStatus(batchId: string, expertId: string, status: PayoutItemStatus, paidAt?: number, failureReason?: string): Promise<void> {
    const key = this.getKey(batchId, expertId);
    const item = memoryStore.payoutItems.get(key);
    if (item) {
      memoryStore.payoutItems.set(key, {
        ...item,
        status,
        ...(paidAt ? { paidAt } : {}),
        ...(failureReason ? { failureReason } : {})
      });
    }
  }

  async getItemById(batchId: string, expertId: string): Promise<PayoutItem | null> {
    const key = this.getKey(batchId, expertId);
    return memoryStore.payoutItems.get(key) || null;
  }

  async getItemsByBatch(batchId: string): Promise<PayoutItem[]> {
    return Array.from(memoryStore.payoutItems.values()).filter(item => item.batchId === batchId);
  }

  async getItemsByExpert(expertId: string, limit?: number): Promise<PayoutItem[]> {
    const items = Array.from(memoryStore.payoutItems.values())
      .filter(item => item.expertId === expertId)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return limit ? items.slice(0, limit) : items;
  }

  async getItemsByStatus(status: PayoutItemStatus): Promise<PayoutItem[]> {
    return Array.from(memoryStore.payoutItems.values()).filter(item => item.status === status);
  }
}

/**
 * Mock Config Repository
 */
export class MockConfigRepository implements ConfigRepository {
  async getRuntimeConfig(): Promise<RuntimeConfig> {
    return { ...memoryStore.config };
  }

  async updateRuntimeConfig(config: Partial<RuntimeConfig>): Promise<void> {
    memoryStore.config = { ...memoryStore.config, ...config };
  }
}

/**
 * Mock Transaction Manager
 */
export class MockTransactionManager implements TransactionManager {
  constructor(private container: RepositoryContainer) {}

  async runTransaction<T>(
    callback: (repositories: RepositoryContainer) => Promise<T>
  ): Promise<T> {
    // Mock에서는 실제 트랜잭션 없이 바로 실행
    // 실제 구현에서는 DB 트랜잭션을 시작하고 커밋/롤백
    return callback(this.container);
  }
}

/**
 * Mock Stats Repository
 */
export class MockStatsRepository implements StatsRepository {
  async getSessionStats(period: PeriodFilter, expertId?: string) {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter(s => {
        if (s.endedAt < period.from || s.endedAt > period.to) return false;
        if (expertId && s.expertId !== expertId) return false;
        return s.status === 'completed';
      });

    const totalSessions = sessions.length;
    const totalDurationMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
    const totalRevenueKrw = sessions.reduce((sum, s) => sum + s.totalKrw, 0);
    const avgSessionDurationMin = totalSessions > 0 ? Math.floor(totalDurationMin / totalSessions) : 0;
    const avgRatePerMinKrw = totalSessions > 0 ? Math.floor(totalRevenueKrw / totalDurationMin) : 0;

    return {
      totalSessions,
      totalDurationMin,
      totalRevenueKrw,
      avgSessionDurationMin,
      avgRatePerMinKrw
    };
  }

  async getPaymentStats(period: PeriodFilter, userId?: string) {
    const payments = Array.from(memoryStore.payments.values())
      .filter(p => {
        if (p.createdAt < period.from || p.createdAt > period.to) return false;
        if (userId && p.userId !== userId) return false;
        return p.status === 'succeeded';
      });

    const totalPayments = payments.length;
    const totalAmountKrw = payments.reduce((sum, p) => sum + p.amountKrw, 0);
    const totalCreditsIssued = payments.reduce((sum, p) => sum + p.creditsIssued, 0);
    const totalPgFeeKrw = payments.reduce((sum, p) => sum + p.pgFeeKrw, 0);
    const avgPaymentAmountKrw = totalPayments > 0 ? Math.floor(totalAmountKrw / totalPayments) : 0;

    return {
      totalPayments,
      totalAmountKrw,
      totalCreditsIssued,
      totalPgFeeKrw,
      avgPaymentAmountKrw
    };
  }

  async getExpertEarnings(expertId: string, period: PeriodFilter) {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter(s => 
        s.expertId === expertId &&
        s.endedAt >= period.from &&
        s.endedAt <= period.to &&
        s.status === 'completed'
      );

    const totalSessions = sessions.length;
    const grossEarningsKrw = sessions.reduce((sum, s) => sum + s.expertGrossKrw, 0);
    const totalDurationMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
    const avgRatePerMinKrw = totalDurationMin > 0 ? Math.floor(grossEarningsKrw / totalDurationMin) : 0;

    return {
      totalSessions,
      grossEarningsKrw,
      netEarningsKrw: grossEarningsKrw, // 세전
      avgRatePerMinKrw
    };
  }

  async getPlatformStats(period: PeriodFilter) {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter(s => 
        s.endedAt >= period.from &&
        s.endedAt <= period.to &&
        s.status === 'completed'
      );

    const totalRevenueKrw = sessions.reduce((sum, s) => sum + s.totalKrw, 0);
    const platformRevenueKrw = sessions.reduce((sum, s) => sum + s.platformFeeKrw, 0);
    const expertPayoutsKrw = sessions.reduce((sum, s) => sum + s.expertGrossKrw, 0);
    const infraCostKrw = sessions.reduce((sum, s) => sum + s.infraCostKrw, 0);

    // PG 수수료는 결제 데이터에서 계산
    const payments = Array.from(memoryStore.payments.values())
      .filter(p => 
        p.createdAt >= period.from &&
        p.createdAt <= period.to &&
        p.status === 'succeeded'
      );
    const pgFeeKrw = payments.reduce((sum, p) => sum + p.pgFeeKrw, 0);

    const netProfitKrw = platformRevenueKrw - infraCostKrw - pgFeeKrw;

    return {
      totalRevenueKrw,
      platformRevenueKrw,
      expertPayoutsKrw,
      infraCostKrw,
      pgFeeKrw,
      netProfitKrw
    };
  }
}

/**
 * Mock Repository Factory
 */
export class MockRepositoryFactory {
  private container: ExtendedRepositoryContainer | null = null;

  createContainer(): ExtendedRepositoryContainer {
    if (!this.container) {
      const users = new MockUserRepository();
      const wallets = new MockWalletRepository();
      const payments = new MockPaymentRepository();
      const sessions = new MockSessionRepository();
      const ledgers = new MockLedgerRepository();
      const payoutBatches = new MockPayoutBatchRepository();
      const payoutItems = new MockPayoutItemRepository();
      const config = new MockConfigRepository();
      const stats = new MockStatsRepository();

      const baseContainer: RepositoryContainer = {
        users,
        wallets,
        payments,
        sessions,
        ledgers,
        payoutBatches,
        payoutItems,
        config,
        transaction: new MockTransactionManager({} as RepositoryContainer)
      };

      // transaction manager에 컨테이너 참조 설정
      baseContainer.transaction = new MockTransactionManager(baseContainer);

      this.container = {
        ...baseContainer,
        stats
      };
    }

    return this.container;
  }

  async cleanup(): Promise<void> {
    memoryStore.clear();
    this.container = null;
  }

  // 테스트용 데이터 시딩
  async seedTestData(): Promise<void> {
    const container = this.createContainer();
    
    // 테스트 사용자 생성
    await container.users.createUser({
      id: 'client_1',
      email: 'client1@test.com',
      name: '클라이언트1',
      role: 'client',
      taxMode: 'self'
    });

    await container.users.createUser({
      id: 'expert_1',
      email: 'expert1@test.com',
      name: '전문가1',
      role: 'expert',
      taxMode: 'withhold',
      bank: {
        holder: '전문가1',
        bankCode: '004',
        account: '1234567890'
      },
      expert: {
        level: 'gold',
        tier: 'premium',
        ratePerMinKrw: 1000
      }
    });

    // 테스트 지갑 생성
    await container.wallets.updateCredits('client_1', 10000); // 100,000원 상당

    console.log('Mock test data seeded successfully');
  }
}
