const { Sequelize } = require('sequelize');

async function checkSchema() {
  console.log('🔍 데이터베이스 스키마를 확인합니다...');
  
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
      logging: false,
      dialectOptions: {
        dateStrings: true
      },
      timezone: '+09:00'
    });

    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 목록 확인
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('\n📋 현재 테이블 목록:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    // 주요 테이블 스키마 확인
    const tablesToCheck = ['users', 'experts', 'consultations'];
    
    for (const table of tablesToCheck) {
      try {
        console.log(`\n🏗️  ${table} 테이블 스키마:`);
        const [columns] = await sequelize.query(`DESCRIBE ${table}`);
        columns.forEach(col => {
          console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
        });
      } catch (error) {
        console.log(`  ⚠️  ${table} 테이블이 존재하지 않습니다.`);
      }
    }

    // users 테이블에 누락된 컬럼 개별 추가
    console.log('\n📝 users 테이블 컬럼 추가 중...');
    const columnsToAdd = [
      'nickname VARCHAR(255)',
      'phone VARCHAR(255)',
      'location VARCHAR(255)',
      'birthDate DATE',
      'bio TEXT',
      'profileImage VARCHAR(255)',
      'interestedCategories JSON',
      'profileVisibility ENUM("public", "private") DEFAULT "public"'
    ];

    for (const column of columnsToAdd) {
      try {
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${column}`);
        console.log(`  ✅ ${column.split(' ')[0]} 컬럼 추가 완료`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`  ⚠️  ${column.split(' ')[0]} 컬럼이 이미 존재합니다.`);
        } else {
          console.log(`  ❌ ${column.split(' ')[0]} 컬럼 추가 실패: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

checkSchema();
