/**
 * 정산 시스템 환경 설정
 * 환경별로 다른 구현체를 주입하기 위한 설정 관리
 */

import { ExtendedRepositoryContainer } from '../repositories/interfaces';
import { MockRepositoryFactory } from '../repositories/implementations/MockRepositories';

export interface SettlementEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_TYPE: 'mock' | 'firebase' | 'postgresql' | 'mongodb';
  
  // Firebase 설정 (Firebase 사용시)
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  
  // 토스 결제 설정
  TOSS_SECRET_KEY?: string;
  TOSS_WEBHOOK_SECRET?: string;
  
  // 정산 설정
  KST_TZ: string;
  SETTLEMENT_DAY: number;
  WITHHOLD_3_3: boolean;
  PLATFORM_FEE_BP: number;
  PG_FEE_BP: number;
  INFRA_COST_PER_MIN: number;
  
  // 보안 설정
  ADMIN_API_KEY?: string;
  WEBHOOK_SECRET?: string;
}

/**
 * 환경 변수에서 설정 로드
 */
export function loadSettlementConfig(): SettlementEnvironment {
  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    DATABASE_TYPE: (process.env.DATABASE_TYPE as any) || 'mock',
    
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
    TOSS_WEBHOOK_SECRET: process.env.TOSS_WEBHOOK_SECRET,
    
    KST_TZ: process.env.KST_TZ || 'Asia/Seoul',
    SETTLEMENT_DAY: parseInt(process.env.SETTLEMENT_DAY || '5', 10),
    WITHHOLD_3_3: process.env.WITHHOLD_3_3 === 'true',
    PLATFORM_FEE_BP: parseInt(process.env.PLATFORM_FEE_BP || '1200', 10),
    PG_FEE_BP: parseInt(process.env.PG_FEE_BP || '200', 10),
    INFRA_COST_PER_MIN: parseFloat(process.env.INFRA_COST_PER_MIN || '6.35'),
    
    ADMIN_API_KEY: process.env.ADMIN_API_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
  };
}

/**
 * Repository 팩토리 싱글톤
 */
class RepositoryManager {
  private static instance: RepositoryManager;
  private container: ExtendedRepositoryContainer | null = null;
  private config: SettlementEnvironment;

  private constructor() {
    this.config = loadSettlementConfig();
  }

  public static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  public getContainer(): ExtendedRepositoryContainer {
    if (!this.container) {
      this.container = this.createContainer();
    }
    return this.container;
  }

  private createContainer(): ExtendedRepositoryContainer {
    switch (this.config.DATABASE_TYPE) {
      case 'mock':
        return new MockRepositoryFactory().createContainer();
      
      case 'firebase':
        // TODO: Firebase 구현체 생성
        throw new Error('Firebase implementation not yet available');
      
      case 'postgresql':
        // TODO: PostgreSQL 구현체 생성
        throw new Error('PostgreSQL implementation not yet available');
      
      case 'mongodb':
        // TODO: MongoDB 구현체 생성
        throw new Error('MongoDB implementation not yet available');
      
      default:
        console.warn(`Unknown database type: ${this.config.DATABASE_TYPE}, falling back to mock`);
        return new MockRepositoryFactory().createContainer();
    }
  }

  public async cleanup(): Promise<void> {
    if (this.container && this.config.DATABASE_TYPE === 'mock') {
      const factory = new MockRepositoryFactory();
      await factory.cleanup();
    }
    this.container = null;
  }

  public getConfig(): SettlementEnvironment {
    return this.config;
  }

  public async initializeTestData(): Promise<void> {
    if (this.config.NODE_ENV === 'development' && this.config.DATABASE_TYPE === 'mock') {
      const factory = new MockRepositoryFactory();
      await factory.seedTestData();
      console.log('Test data initialized for development environment');
    }
  }
}

/**
 * 전역 Repository 컨테이너 접근자
 */
export function getRepositoryContainer(): ExtendedRepositoryContainer {
  return RepositoryManager.getInstance().getContainer();
}

/**
 * 설정 접근자
 */
export function getSettlementConfig(): SettlementEnvironment {
  return RepositoryManager.getInstance().getConfig();
}

/**
 * 테스트 데이터 초기화
 */
export async function initializeTestData(): Promise<void> {
  await RepositoryManager.getInstance().initializeTestData();
}

/**
 * 리소스 정리
 */
export async function cleanupResources(): Promise<void> {
  await RepositoryManager.getInstance().cleanup();
}

/**
 * 환경별 설정 검증
 */
export function validateConfig(config: SettlementEnvironment): string[] {
  const errors: string[] = [];

  if (config.SETTLEMENT_DAY < 1 || config.SETTLEMENT_DAY > 28) {
    errors.push('SETTLEMENT_DAY must be between 1 and 28');
  }

  if (config.PLATFORM_FEE_BP < 0 || config.PLATFORM_FEE_BP > 10000) {
    errors.push('PLATFORM_FEE_BP must be between 0 and 10000 (0-100%)');
  }

  if (config.PG_FEE_BP < 0 || config.PG_FEE_BP > 1000) {
    errors.push('PG_FEE_BP must be between 0 and 1000 (0-10%)');
  }

  if (config.INFRA_COST_PER_MIN < 0) {
    errors.push('INFRA_COST_PER_MIN must be non-negative');
  }

  if (config.DATABASE_TYPE === 'firebase') {
    if (!config.FIREBASE_PROJECT_ID) errors.push('FIREBASE_PROJECT_ID is required');
    if (!config.FIREBASE_CLIENT_EMAIL) errors.push('FIREBASE_CLIENT_EMAIL is required');
    if (!config.FIREBASE_PRIVATE_KEY) errors.push('FIREBASE_PRIVATE_KEY is required');
  }

  if (config.NODE_ENV === 'production') {
    if (!config.TOSS_SECRET_KEY) errors.push('TOSS_SECRET_KEY is required in production');
    if (!config.ADMIN_API_KEY) errors.push('ADMIN_API_KEY is required in production');
  }

  return errors;
}

/**
 * 개발용 환경 설정 예시
 */
export const DEVELOPMENT_CONFIG: Partial<SettlementEnvironment> = {
  NODE_ENV: 'development',
  DATABASE_TYPE: 'mock',
  KST_TZ: 'Asia/Seoul',
  SETTLEMENT_DAY: 5,
  WITHHOLD_3_3: true,
  PLATFORM_FEE_BP: 1200, // 12%
  PG_FEE_BP: 200, // 2%
  INFRA_COST_PER_MIN: 6.35
};

/**
 * 프로덕션용 환경 설정 템플릿
 */
export const PRODUCTION_CONFIG_TEMPLATE: Partial<SettlementEnvironment> = {
  NODE_ENV: 'production',
  DATABASE_TYPE: 'firebase', // 또는 다른 실제 DB
  KST_TZ: 'Asia/Seoul',
  SETTLEMENT_DAY: 5,
  WITHHOLD_3_3: true,
  PLATFORM_FEE_BP: 1200,
  PG_FEE_BP: 200,
  INFRA_COST_PER_MIN: 6.35,
  // 실제 환경에서는 환경 변수로 설정
  // FIREBASE_PROJECT_ID: 'your-project-id',
  // FIREBASE_CLIENT_EMAIL: 'service-account@your-project.iam.gserviceaccount.com',
  // FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\n...',
  // TOSS_SECRET_KEY: 'test_sk_...',
  // ADMIN_API_KEY: 'secure-admin-key'
};
