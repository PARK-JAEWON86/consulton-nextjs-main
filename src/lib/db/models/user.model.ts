import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";
import { Expert } from "./expert.model";

interface UserAttributes {
  id: number;
  email: string;
  name: string | null;
  password: string; // 해싱된 비밀번호
  role: 'client' | 'expert' | 'admin'; // 사용자 역할
  isEmailVerified: boolean; // 이메일 인증 여부
  lastLoginAt?: Date; // 마지막 로그인 시간
  // 프로필 관련 필드들
  nickname?: string | null; // 닉네임
  phone?: string | null; // 전화번호
  location?: string | null; // 거주지역
  birthDate?: Date | null; // 생년월일
  bio?: string | null; // 자기소개
  profileImage?: string | null; // 프로필 이미지 URL
  interestedCategories?: string[] | null; // 관심 카테고리 목록
  profileVisibility?: 'public' | 'experts' | 'private'; // 프로필 공개 설정
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의 (id, name, lastLoginAt은 없어도 됨)
type UserCreationAttributes = Optional<UserAttributes, "id" | "name" | "lastLoginAt">;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public name!: string | null;
  public password!: string;
  public role!: 'client' | 'expert' | 'admin';
  public isEmailVerified!: boolean;
  public lastLoginAt?: Date;
  // 프로필 관련 속성들
  public nickname?: string | null;
  public phone?: string | null;
  public location?: string | null;
  public birthDate?: Date | null;
  public bio?: string | null;
  public profileImage?: string | null;
  public interestedCategories?: string[] | null;
  public profileVisibility?: 'public' | 'experts' | 'private';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 관계 속성들
  public expert?: Expert;
  public credits?: any; // UserCredits 관계
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '해싱된 비밀번호',
    },
    role: {
      type: DataTypes.ENUM('client', 'expert', 'admin'),
      allowNull: false,
      defaultValue: 'client',
      comment: '사용자 역할',
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '이메일 인증 여부',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 로그인 시간',
    },
    // 프로필 관련 필드들
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '사용자 닉네임',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '전화번호',
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '거주지역',
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '생년월일',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '자기소개',
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '프로필 이미지 URL',
    },
    interestedCategories: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '관심 카테고리 목록',
    },
    profileVisibility: {
      type: DataTypes.ENUM('public', 'experts', 'private'),
      allowNull: false,
      defaultValue: 'experts',
      comment: '프로필 공개 설정',
    },
  },
  {
    sequelize,                // 연결(싱글턴)
    tableName: "users",       // 실제 테이블명
    modelName: "User",        // 모델명
    timestamps: true,         // createdAt/updatedAt 자동
  }
);
