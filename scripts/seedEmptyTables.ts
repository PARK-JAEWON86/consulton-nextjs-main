#!/usr/bin/env tsx

/**
 * 빈 테이블에 데이터 생성 스크립트
 * 
 * 사용법:
 * npx tsx scripts/seedEmptyTables.ts
 * npx tsx scripts/seedEmptyTables.ts --table=ai_usages
 * npx tsx scripts/seedEmptyTables.ts --table=payments
 */

import { 
  seedAllEmptyTables, 
  seedSpecificTable 
} from '../src/lib/db/seedEmptyTables';

async function main() {
  try {
    const args = process.argv.slice(2);
    const tableArg = args.find(arg => arg.startsWith('--table='));
    const tableName = tableArg ? tableArg.split('=')[1] : null;
    
    if (tableName) {
      console.log(`🎯 ${tableName} 테이블에 데이터 생성 중...`);
      const result = await seedSpecificTable(tableName);
      console.log(`✅ ${tableName} 테이블에 ${result}개 데이터 생성 완료!`);
    } else {
      console.log('🎯 모든 빈 테이블에 데이터 생성 중...');
      const results = await seedAllEmptyTables();
      console.log('✅ 모든 테이블 데이터 생성 완료!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

main();
