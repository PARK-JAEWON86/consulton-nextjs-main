import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 전문가 상세 프로필 인터페이스
interface ExpertProfileAttributes {
  id: number;
  expertId: number; // Expert 테이블과의 외래키
  fullName: string; // 전문가 이름
  jobTitle: string; // 직책/직업
  bio: string; // 자기소개
  description: string; // 상세 설명
  education: string; // 학력 (JSON 배열)
  certifications: string; // 자격증 (JSON 배열)
  specialties: string; // 전문 분야 태그 (JSON 배열)
  specialtyAreas: string; // 전문 영역 (JSON 배열)
  consultationStyle: string; // 상담 스타일
  targetAudience: string; // 대상 고객 (JSON 배열)
  successStories: number; // 성공 사례 수
  repeatClients: number; // 재방문 고객 수
  averageSessionDuration: number; // 평균 상담 시간 (분)
  nextAvailableSlot: string; // 다음 가능한 시간
  cancellationPolicy: string; // 취소 정책
  reschedulePolicy: string; // 일정 변경 정책
  holidayPolicy: string; // 공휴일 정책
  portfolioItems: string; // 포트폴리오 (JSON 배열)
  socialProof: string; // 사회적 증명 (JSON 객체)
  pricingTiers: string; // 가격 티어 (JSON 배열)
  contactInfo: string; // 연락처 정보 (JSON 객체)
  profileImage: string; // 프로필 이미지 URL
  portfolioFiles: string; // 포트폴리오 파일 (JSON 배열)
  tags: string; // 태그 (JSON 배열)
  consultationTypes: string; // 상담 유형 (JSON 배열)
  languages: string; // 언어 (JSON 배열)
  hourlyRate: number; // 시간당 요금
  pricePerMinute: number; // 분당 요금
  totalSessions: number; // 총 상담 수
  // avgRating: number; // 평균 평점 - 실시간 계산으로 대체
  // reviewCount: number; // 리뷰 수 - 실시간 계산으로 대체
  completionRate: number; // 완료율
  responseTime: string; // 응답 시간
  // level: number; // 전문가 레벨 - 실시간 계산으로 대체
  profileViews: number; // 프로필 조회수
  lastActiveAt: string; // 마지막 활동 시간
  joinedAt: string; // 가입일
  availability: string; // 주간 가용성 (JSON 객체)
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ExpertProfileCreationAttributes = Optional<
  ExpertProfileAttributes,
  | "id"
  | "bio"
  | "description"
  | "education"
  | "certifications"
  | "specialties"
  | "specialtyAreas"
  | "consultationStyle"
  | "targetAudience"
  | "successStories"
  | "repeatClients"
  | "averageSessionDuration"
  | "nextAvailableSlot"
  | "cancellationPolicy"
  | "reschedulePolicy"
  | "holidayPolicy"
  | "portfolioItems"
  | "socialProof"
  | "pricingTiers"
  | "contactInfo"
  | "profileImage"
  | "portfolioFiles"
  | "tags"
  | "consultationTypes"
  | "languages"
  | "hourlyRate"
  | "pricePerMinute"
  | "totalSessions"
  // | "avgRating" // 실시간 계산으로 대체
  // | "reviewCount" // 실시간 계산으로 대체
  | "completionRate"
  | "responseTime"
  // | "level" // 실시간 계산으로 대체
  | "profileViews"
  | "lastActiveAt"
  | "joinedAt"
  | "availability"
>;

export class ExpertProfile
  extends Model<ExpertProfileAttributes, ExpertProfileCreationAttributes>
  implements ExpertProfileAttributes
{
  public id!: number;
  public expertId!: number;
  public fullName!: string;
  public jobTitle!: string;
  public bio!: string;
  public description!: string;
  public education!: string;
  public certifications!: string;
  public specialties!: string;
  public specialtyAreas!: string;
  public consultationStyle!: string;
  public targetAudience!: string;
  public successStories!: number;
  public repeatClients!: number;
  public averageSessionDuration!: number;
  public nextAvailableSlot!: string;
  public cancellationPolicy!: string;
  public reschedulePolicy!: string;
  public holidayPolicy!: string;
  public portfolioItems!: string;
  public socialProof!: string;
  public pricingTiers!: string;
  public contactInfo!: string;
  public profileImage!: string;
  public portfolioFiles!: string;
  public tags!: string;
  public consultationTypes!: string;
  public languages!: string;
  public hourlyRate!: number;
  public pricePerMinute!: number;
  public totalSessions!: number;
  // public avgRating!: number; // 실시간 계산으로 대체
  // public reviewCount!: number; // 실시간 계산으로 대체
  public completionRate!: number;
  public responseTime!: string;
  // public level!: number; // 실시간 계산으로 대체
  public profileViews!: number;
  public lastActiveAt!: string;
  public joinedAt!: string;
  public availability!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExpertProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    expertId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'experts',
        key: 'id'
      },
      unique: true
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '전문가 이름'
    },
    jobTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '직책/직업'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '자기소개'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '상세 설명'
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '학력 (JSON 배열)'
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '자격증 (JSON 배열)'
    },
    specialties: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '전문 분야 태그 (JSON 배열)'
    },
    specialtyAreas: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '전문 영역 (JSON 배열)'
    },
    consultationStyle: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '상담 스타일'
    },
    targetAudience: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '대상 고객 (JSON 배열)'
    },
    successStories: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '성공 사례 수'
    },
    repeatClients: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '재방문 고객 수'
    },
    averageSessionDuration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 60,
      comment: '평균 상담 시간 (분)'
    },
    nextAvailableSlot: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "",
      comment: '다음 가능한 시간'
    },
    cancellationPolicy: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '취소 정책'
    },
    reschedulePolicy: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '일정 변경 정책'
    },
    holidayPolicy: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '공휴일 정책'
    },
    portfolioItems: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '포트폴리오 (JSON 배열)'
    },
    socialProof: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      comment: '사회적 증명 (JSON 객체)'
    },
    pricingTiers: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '가격 티어 (JSON 배열)'
    },
    contactInfo: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      comment: '연락처 정보 (JSON 객체)'
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '프로필 이미지 URL'
    },
    portfolioFiles: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '포트폴리오 파일 (JSON 배열)'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '태그 (JSON 배열)'
    },
    consultationTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '상담 유형 (JSON 배열)'
    },
    languages: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '언어 (JSON 배열)'
    },
    hourlyRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '시간당 요금'
    },
    pricePerMinute: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '분당 요금'
    },
    totalSessions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '총 상담 수'
    },
    // avgRating: {
    //   type: DataTypes.DECIMAL(3, 2),
    //   allowNull: false,
    //   defaultValue: 0.00,
    //   comment: '평균 평점 - 실시간 계산으로 대체'
    // },
    // reviewCount: {
    //   type: DataTypes.INTEGER.UNSIGNED,
    //   allowNull: false,
    //   defaultValue: 0,
    //   comment: '리뷰 수 - 실시간 계산으로 대체'
    // },
    completionRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '완료율'
    },
    responseTime: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "",
      comment: '응답 시간'
    },
    // level: {
    //   type: DataTypes.INTEGER.UNSIGNED,
    //   allowNull: false,
    //   defaultValue: 1,
    //   comment: '전문가 레벨 - 실시간 계산으로 대체'
    // },
    profileViews: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '프로필 조회수'
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 활동 시간'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '가입일'
    },
    availability: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      comment: '주간 가용성 (JSON 객체)'
    },
  },
  {
    sequelize,
    tableName: "expert_profiles",
    modelName: "ExpertProfile",
    timestamps: true,
    indexes: [
      {
        fields: ['expertId']
      },
      {
        fields: ['fullName']
      }
    ]
  }
);
