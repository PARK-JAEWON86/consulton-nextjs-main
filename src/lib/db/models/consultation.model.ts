import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 상담 정보 인터페이스
interface ConsultationAttributes {
  id: number;
  userId: number; // User 테이블과의 외래키
  expertId: number; // Expert 테이블과의 외래키
  categoryId: number; // Category 테이블과의 외래키
  title: string; // 상담 제목
  description: string; // 상담 설명
  consultationType: string; // 상담 유형 (video, chat, voice)
  status: string; // 상담 상태 (pending, scheduled, in_progress, completed, cancelled)
  scheduledTime: Date; // 예정된 상담 시간
  duration: number; // 상담 시간 (분)
  price: number; // 상담 가격 (원)
  expertLevel: number; // 전문가 레벨
  topic: string; // 상담 주제
  notes: string; // 상담 노트
  startTime: Date; // 실제 시작 시간
  endTime: Date; // 실제 종료 시간
  rating: number; // 사용자 평점 (0-5)
  review: string; // 사용자 리뷰
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ConsultationCreationAttributes = Optional<
  ConsultationAttributes,
  | "id"
  | "description"
  | "status"
  | "scheduledTime"
  | "duration"
  | "price"
  | "expertLevel"
  | "topic"
  | "notes"
  | "startTime"
  | "endTime"
  | "rating"
  | "review"
>;

export class Consultation
  extends Model<ConsultationAttributes, ConsultationCreationAttributes>
  implements ConsultationAttributes
{
  public id!: number;
  public user?: any; // User 관계 속성
  public userId!: number;
  public expertId!: number;
  public categoryId!: number;
  public title!: string;
  public description!: string;
  public consultationType!: string;
  public status!: string;
  public scheduledTime!: Date;
  public duration!: number;
  public price!: number;
  public expertLevel!: number;
  public topic!: string;
  public notes!: string;
  public startTime!: Date;
  public endTime!: Date;
  public rating!: number;
  public review!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Consultation.init(
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
    expertId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'experts',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '상담 제목'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '상담 설명'
    },
    consultationType: {
      type: DataTypes.ENUM('video', 'chat', 'voice'),
      allowNull: false,
      comment: '상담 유형'
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
      comment: '상담 상태'
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '예정된 상담 시간'
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 60,
      comment: '상담 시간 (분)'
    },
    price: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '상담 가격 (원)'
    },
    expertLevel: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100,
      comment: '전문가 레벨'
    },
    topic: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '상담 주제'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '상담 노트'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '실제 시작 시간'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '실제 종료 시간'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      },
      comment: '사용자 평점 (0-5)'
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '사용자 리뷰'
    },
  },
  {
    sequelize,
    tableName: "consultations",
    modelName: "Consultation",
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['expertId']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduledTime']
      },
      {
        fields: ['consultationType']
      }
    ]
  }
);
