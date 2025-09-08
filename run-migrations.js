const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 데이터베이스 마이그레이션을 실행합니다...');
  
  const DB_NAME = 'consulton';
  const DB_USER = 'root';
  const DB_PASS = 'Qkrthgh06!&';
  const DB_HOST = '127.0.0.1';
  const DB_PORT = 3306;
  
  console.log(`📍 연결 정보: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  let sequelize;
  
  try {
    // Sequelize 연결 설정
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      logging: console.log,
      dialectOptions: {
        dateStrings: true
      },
      timezone: '+09:00'
    });

    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 누락된 컬럼 추가
    console.log('📝 누락된 컬럼들을 추가하는 중...');
    
    try {
      // users 테이블에 누락된 컬럼들 추가
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS nickname VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
        ADD COLUMN IF NOT EXISTS location VARCHAR(255),
        ADD COLUMN IF NOT EXISTS birthDate DATE,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS profileImage VARCHAR(255),
        ADD COLUMN IF NOT EXISTS interestedCategories JSON,
        ADD COLUMN IF NOT EXISTS profileVisibility ENUM('public', 'private') DEFAULT 'public'
      `);
      console.log('  ✅ users 테이블 컬럼 추가 완료');
    } catch (error) {
      console.log('  ⚠️  users 테이블 컬럼 추가 건너뜀:', error.message);
    }

    // 누락된 테이블들 생성
    console.log('🏗️  누락된 테이블들을 생성하는 중...');
    
    // consultation_sessions 테이블 생성
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consultation_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          consultationId INT NOT NULL,
          sessionType ENUM('chat', 'voice', 'video') DEFAULT 'chat',
          status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
          startTime DATETIME,
          endTime DATETIME,
          duration INT DEFAULT 0,
          sessionData JSON,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (consultationId) REFERENCES consultations(id)
        )
      `);
      console.log('  ✅ consultation_sessions 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  consultation_sessions 테이블 생성 건너뜀:', error.message);
    }

    // consultation_summaries 테이블 생성
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consultation_summaries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          consultationId INT NOT NULL,
          summaryTitle VARCHAR(255),
          summaryContent TEXT,
          keyPoints JSON,
          recommendations JSON,
          followUpTasks JSON,
          todoStatus ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (consultationId) REFERENCES consultations(id)
        )
      `);
      console.log('  ✅ consultation_summaries 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  consultation_summaries 테이블 생성 건너뜀:', error.message);
    }

    // expert_availability 테이블 생성
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS expert_availability (
          id INT AUTO_INCREMENT PRIMARY KEY,
          expertId INT NOT NULL,
          dayOfWeek ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
          startTime TIME,
          endTime TIME,
          isAvailable BOOLEAN DEFAULT true,
          timeZone VARCHAR(100) DEFAULT 'Asia/Seoul',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (expertId) REFERENCES experts(id)
        )
      `);
      console.log('  ✅ expert_availability 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  expert_availability 테이블 생성 건너뜀:', error.message);
    }

    console.log('🎉 마이그레이션이 성공적으로 완료되었습니다!');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류가 발생했습니다:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 데이터베이스 연결 종료');
    }
  }
}

runMigrations();
