import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 상담 세션 인터페이스
interface ConsultationSessionAttributes {
  id: number;
  consultationId: number; // Consultation 테이블과의 외래키
  sessionNumber: number; // 세션 번호 (1, 2, 3...)
  startTime: Date; // 세션 시작 시간
  endTime: Date; // 세션 종료 시간
  duration: number; // 실제 세션 시간 (분)
  status: string; // 세션 상태 (scheduled, in_progress, completed, cancelled)
  notes: string; // 세션 노트
  transcript: string; // 대화 기록 (채팅/음성의 경우)
  recordingUrl: string; // 녹화/녹음 파일 URL
  attachments: string; // 첨부 파일 (JSON 배열)
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ConsultationSessionCreationAttributes = Optional<
  ConsultationSessionAttributes,
  | "id"
  | "endTime"
  | "duration"
  | "status"
  | "notes"
  | "transcript"
  | "recordingUrl"
  | "attachments"
>;

export class ConsultationSession
  extends Model<ConsultationSessionAttributes, ConsultationSessionCreationAttributes>
  implements ConsultationSessionAttributes
{
  public id!: number;
  public consultationId!: number;
  public sessionNumber!: number;
  public startTime!: Date;
  public endTime!: Date;
  public duration!: number;
  public status!: string;
  public notes!: string;
  public transcript!: string;
  public recordingUrl!: string;
  public attachments!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ConsultationSession.init(
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
      }
    },
    sessionNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '세션 번호'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '세션 시작 시간'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '세션 종료 시간'
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '실제 세션 시간 (분)'
    },
    status: {
      type: DataTypes.ENUM(
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'scheduled',
      comment: '세션 상태'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '세션 노트'
    },
    transcript: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '대화 기록'
    },
    recordingUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '녹화/녹음 파일 URL'
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '첨부 파일 (JSON 배열)'
    },
  },
  {
    sequelize,
    tableName: "consultation_sessions",
    modelName: "ConsultationSession",
    timestamps: true,
    indexes: [
      {
        fields: ['consultationId']
      },
      {
        fields: ['consultationId', 'sessionNumber'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['startTime']
      }
    ]
  }
);
