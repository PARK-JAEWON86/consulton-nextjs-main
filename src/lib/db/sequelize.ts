import { Sequelize } from "sequelize";

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASS = "",
  DB_NAME = "consulton",
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "mysql",
  timezone: "+09:00",
  dialectOptions: { 
    dateStrings: true,
    charset: 'utf8mb4'
  },
  pool: {
    max: 20,        // 최대 연결 수 증가 (동시 요청 처리)
    min: 5,         // 최소 연결 수 유지 (빠른 응답)
    acquire: 60000, // 연결 획득 대기 시간 증가
    idle: 30000,    // 유휴 연결 유지 시간 증가
    evict: 1000     // 연결 정리 주기
  },
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false
  }
});

// 선택: 연결 확인용
export async function assertDbConnection() {
  await sequelize.authenticate();
}
