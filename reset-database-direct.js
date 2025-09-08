const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  console.log('🔄 데이터베이스 초기화를 시작합니다...');
  
  // 환경변수 직접 설정
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
      logging: false,
      dialectOptions: {
        dateStrings: true
      },
      timezone: '+09:00'
    });

    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. 외래키 제약조건 비활성화
    console.log('🔓 외래키 제약조건 비활성화 중...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. 테이블 데이터 삭제 (의존성 순서 고려)
    console.log('🗑️  기존 데이터를 삭제하는 중...');
    const tablesToTruncate = [
      'community_likes',
      'community_comments', 
      'community_posts',
      'ai_usages',
      'consultation_summaries',
      'consultation_sessions',
      'consultations',
      'reviews',
      'payments',
      'notifications',
      'payment_methods',
      'expert_availability',
      'expert_profiles',
      'user_credits',
      'experts',
      'users',
      'categories'
    ];

    for (const table of tablesToTruncate) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(`  ✅ ${table} 테이블 데이터 삭제`);
      } catch (error) {
        if (!error.message.includes("doesn't exist")) {
          console.log(`  ⚠️  ${table} 테이블 삭제 건너뜀: 테이블이 존재하지 않음`);
        }
      }
    }

    // 3. 외래키 제약조건 재활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 외래키 제약조건 재활성화 완료');

    // 4. 새로운 데이터 삽입
    console.log('📥 새로운 데이터를 삽입하는 중...');
    const insertSqlPath = path.join(__dirname, 'clear_and_reinsert_data.sql');
    
    if (!fs.existsSync(insertSqlPath)) {
      throw new Error(`SQL 파일을 찾을 수 없습니다: ${insertSqlPath}`);
    }
    
    const insertSql = fs.readFileSync(insertSqlPath, 'utf8');
    
    // SQL을 INSERT 문 단위로 분할
    const insertStatements = insertSql.match(/INSERT INTO[^;]+;/gi) || [];
    
    console.log(`📊 총 ${insertStatements.length}개의 INSERT 문을 실행합니다...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < insertStatements.length; i++) {
      const statement = insertStatements[i].trim();
      if (statement) {
        try {
          await sequelize.query(statement);
          successCount++;
          
          if ((i + 1) % 3 === 0 || i === insertStatements.length - 1) {
            console.log(`  📊 진행률: ${i + 1}/${insertStatements.length} (${Math.round(((i + 1) / insertStatements.length) * 100)}%) - 성공: ${successCount}, 오류: ${errorCount}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ SQL 실행 오류 (문장 ${i + 1}):`, error.message);
          
          // 오류가 너무 많으면 중단
          if (errorCount > 10) {
            console.error('❌ 오류가 너무 많아 중단합니다.');
            break;
          }
        }
      }
    }

    console.log(`📊 데이터 삽입 완료: 성공 ${successCount}개, 오류 ${errorCount}개`);

    // 5. 데이터 확인
    console.log('🔍 데이터 삽입 결과 확인 중...');
    
    const tables = [
      'categories', 
      'users', 
      'experts', 
      'expert_profiles',
      'consultations', 
      'consultation_sessions',
      'consultation_summaries',
      'community_posts',
      'community_comments',
      'ai_usages'
    ];
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  📊 ${table}: ${results[0].count}개 레코드`);
      } catch (error) {
        console.log(`  ⚠️  ${table} 테이블 확인 실패: 테이블이 존재하지 않음`);
      }
    }

    console.log('🎉 데이터베이스 초기화가 성공적으로 완료되었습니다!');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 오류가 발생했습니다:');
    console.error(error.message);
    
    if (error.message.includes('Access denied')) {
      console.log('\n💡 MySQL 연결 정보를 확인해주세요');
    }
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 데이터베이스 연결 종료');
    }
  }
}

resetDatabase();
