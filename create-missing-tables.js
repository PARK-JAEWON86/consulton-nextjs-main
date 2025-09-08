const { Sequelize } = require('sequelize');

async function createMissingTables() {
  console.log('🏗️  누락된 테이블들을 생성합니다...');
  
  const DB_NAME = 'consulton';
  const DB_USER = 'root';
  const DB_PASS = 'Qkrthgh06!&';
  const DB_HOST = '127.0.0.1';
  const DB_PORT = 3306;

  let sequelize;
  
  try {
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

    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // consultation_sessions 테이블 생성 (외래키 제약조건 없이)
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consultation_sessions (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          consultationId INT UNSIGNED NOT NULL,
          sessionType ENUM('chat', 'voice', 'video') DEFAULT 'chat',
          status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
          startTime DATETIME,
          endTime DATETIME,
          duration INT DEFAULT 0,
          sessionData JSON,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ consultation_sessions 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  consultation_sessions 테이블 생성 건너뜀:', error.message);
    }

    // consultation_summaries 테이블 생성 (외래키 제약조건 없이)
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consultation_summaries (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          consultationId INT UNSIGNED NOT NULL,
          summaryTitle VARCHAR(255),
          summaryContent TEXT,
          keyPoints JSON,
          recommendations JSON,
          followUpTasks JSON,
          todoStatus ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ consultation_summaries 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  consultation_summaries 테이블 생성 건너뜀:', error.message);
    }

    // expert_availability 테이블 생성 (외래키 제약조건 없이)
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS expert_availability (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          expertId INT UNSIGNED NOT NULL,
          dayOfWeek ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
          startTime TIME,
          endTime TIME,
          isAvailable BOOLEAN DEFAULT true,
          timeZone VARCHAR(100) DEFAULT 'Asia/Seoul',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ expert_availability 테이블 생성 완료');
    } catch (error) {
      console.log('  ⚠️  expert_availability 테이블 생성 건너뜀:', error.message);
    }

    console.log('🎉 누락된 테이블 생성이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

createMissingTables();
