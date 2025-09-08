import { sequelize } from './sequelize';
import './models/associations'; // 연관관계 설정을 위해 import

/**
 * 데이터베이스 초기화 함수
 * 모든 모델을 동기화하고 연관관계를 설정합니다.
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 데이터베이스 연결 확인 중...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 모든 모델 동기화 (개발 환경에서만)
    // MySQL 키 제한 문제로 인해 sync 비활성화
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔄 모델 동기화 중...');
    //   await sequelize.sync({ alter: true }); // 기존 테이블 구조 변경 시 사용
    //   console.log('✅ 모델 동기화 완료');
    // }

    console.log('🎉 데이터베이스 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

/**
 * 데이터베이스 연결 종료 함수
 */
export async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✅ 데이터베이스 연결 종료');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 종료 실패:', error);
    throw error;
  }
}

/**
 * 개발 환경에서 데이터베이스 재설정
 * 주의: 모든 데이터가 삭제됩니다!
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('데이터베이스 재설정은 개발 환경에서만 가능합니다.');
  }

  try {
    console.log('⚠️  데이터베이스 재설정 시작 (모든 데이터가 삭제됩니다!)');
    
    // 모든 테이블 삭제 후 재생성
    await sequelize.sync({ force: true });
    
    console.log('✅ 데이터베이스 재설정 완료');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 재설정 실패:', error);
    throw error;
  }
}
