import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";
import { ExpertProfile } from "./expertProfile.model";
import { User } from "./user.model";

// 전문가 기본 정보 인터페이스
interface ExpertAttributes {
  id: number;
  userId: number; // User 테이블과의 외래키
  specialty: string; // 전문 분야 (예: "심리상담", "법률상담")
  experience: number; // 경력 년수
  rating: number; // 평점 (0-5)
  reviewCount: number; // 리뷰 수
  totalSessions: number; // 총 상담 세션 수
  avgRating: number; // 평균 평점
  completionRate: number; // 상담 완료율 (0-100)
  responseTime: string; // 응답 시간 (예: "30분 이내")
  isOnline: boolean; // 온라인 상태
  isProfileComplete: boolean; // 프로필 완성도
  isProfilePublic: boolean; // 프로필 공개 여부
  location: string; // 위치
  timeZone: string; // 시간대
  languages: string; // 지원 언어 (JSON 문자열)
  consultationTypes: string; // 상담 유형 (JSON 문자열)
  hourlyRate: number; // 시간당 요금
  pricePerMinute: number; // 분당 요금
  // pricePerCredit: number; // 크레딧당 요금 (1분당 크레딧 수) - DB 컬럼 추가 후 활성화
  profileViews: number; // 프로필 조회수
  lastActiveAt: Date; // 마지막 활동 시간
  joinedAt: Date; // 가입일
  // level: number; // 전문가 레벨 - 실시간 계산으로 대체
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ExpertCreationAttributes = Optional<
  ExpertAttributes,
  | "id"
  | "rating"
  | "reviewCount"
  | "totalSessions"
  | "avgRating"
  | "completionRate"
  | "responseTime"
  | "isOnline"
  | "isProfileComplete"
  | "isProfilePublic"
  | "location"
  | "timeZone"
  | "languages"
  | "consultationTypes"
  | "hourlyRate"
  | "pricePerMinute"
  // | "pricePerCredit"
  | "profileViews"
  | "lastActiveAt"
  | "joinedAt"
>;

export class Expert
  extends Model<ExpertAttributes, ExpertCreationAttributes>
  implements ExpertAttributes
{
  public id!: number;
  public userId!: number;
  public specialty!: string;
  public experience!: number;
  public rating!: number;
  public reviewCount!: number;
  public totalSessions!: number;
  public avgRating!: number;
  public completionRate!: number;
  public responseTime!: string;
  public isOnline!: boolean;
  public isProfileComplete!: boolean;
  public isProfilePublic!: boolean;
  public location!: string;
  public timeZone!: string;
  public languages!: string;
  public consultationTypes!: string;
  public hourlyRate!: number;
  public pricePerMinute!: number;
  // public pricePerCredit!: number; // DB 컬럼 추가 후 활성화
  public profileViews!: number;
  public lastActiveAt!: Date;
  public joinedAt!: Date;
  // public level!: number; // 실시간 계산으로 대체

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 관계 속성들
  public profile?: ExpertProfile;
  public user?: User;
}

Expert.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    specialty: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '전문 분야'
    },
    experience: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '경력 년수'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5
      },
      comment: '평점 (0-5)'
    },
    reviewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '리뷰 수'
    },
    totalSessions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '총 상담 세션 수'
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5
      },
      comment: '평균 평점'
    },
    completionRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: '상담 완료율 (0-100)'
    },
    responseTime: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "1시간 이내",
      comment: '응답 시간'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '온라인 상태'
    },
    isProfileComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '프로필 완성도'
    },
    isProfilePublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '프로필 공개 여부'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
      comment: '위치'
    },
    timeZone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Asia/Seoul",
      comment: '시간대'
    },
    languages: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '지원 언어 (JSON 배열)'
    },
    consultationTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '상담 유형 (JSON 배열)'
    },
    hourlyRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '시간당 요금 (원)'
    },
    pricePerMinute: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '분당 요금 (원)'
    },
    // pricePerCredit: {
    //   type: DataTypes.INTEGER.UNSIGNED,
    //   allowNull: false,
    //   defaultValue: 10,
    //   comment: '분당 크레딧 수'
    // },
    profileViews: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '프로필 조회수'
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '마지막 활동 시간'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '가입일'
    },
    // level: {
    //   type: DataTypes.INTEGER.UNSIGNED,
    //   allowNull: false,
    //   defaultValue: 1,
    //   comment: '전문가 레벨 - 실시간 계산으로 대체'
    // },
  },
  {
    sequelize,
    tableName: "experts",
    modelName: "Expert",
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        unique: true
      },
      {
        fields: ['specialty']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['isOnline']
      },
      {
        fields: ['isProfilePublic']
      }
    ]
  }
);
