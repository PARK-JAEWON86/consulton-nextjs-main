import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 상담 요약 인터페이스
interface ConsultationSummaryAttributes {
  id: number;
  consultationId: number; // Consultation 테이블과의 외래키
  summaryTitle: string; // 요약 제목
  summaryContent: string; // 요약 내용
  keyPoints: string; // 핵심 포인트 (JSON 배열)
  actionItems: string; // 액션 아이템 (JSON 배열)
  recommendations: string; // 추천사항 (JSON 배열)
  followUpPlan: string; // 후속 계획
  todoStatus: string; // 할일 상태 (JSON 객체)
  attachments: string; // 첨부 파일 (JSON 배열)
  isPublic: boolean; // 공개 여부
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ConsultationSummaryCreationAttributes = Optional<
  ConsultationSummaryAttributes,
  | "id"
  | "summaryTitle"
  | "summaryContent"
  | "keyPoints"
  | "actionItems"
  | "recommendations"
  | "followUpPlan"
  | "todoStatus"
  | "attachments"
  | "isPublic"
>;

export class ConsultationSummary
  extends Model<ConsultationSummaryAttributes, ConsultationSummaryCreationAttributes>
  implements ConsultationSummaryAttributes
{
  public id!: number;
  public consultationId!: number;
  public summaryTitle!: string;
  public summaryContent!: string;
  public keyPoints!: string;
  public actionItems!: string;
  public recommendations!: string;
  public followUpPlan!: string;
  public todoStatus!: string;
  public attachments!: string;
  public isPublic!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ConsultationSummary.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    consultationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'consultations',
        key: 'id'
      },
      unique: true
    },
    summaryTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
      comment: '요약 제목'
    },
    summaryContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '요약 내용'
    },
    keyPoints: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '핵심 포인트 (JSON 배열)'
    },
    actionItems: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '액션 아이템 (JSON 배열)'
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '추천사항 (JSON 배열)'
    },
    followUpPlan: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '후속 계획'
    },
    todoStatus: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      comment: '할일 상태 (JSON 객체)'
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '첨부 파일 (JSON 배열)'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '공개 여부'
    },
  },
  {
    sequelize,
    tableName: "consultation_summaries",
    modelName: "ConsultationSummary",
    timestamps: true,
    indexes: [
      {
        fields: ['consultationId']
      },
      {
        fields: ['isPublic']
      }
    ]
  }
);
