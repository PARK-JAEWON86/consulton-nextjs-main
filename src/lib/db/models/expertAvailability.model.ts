import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 전문가 일정 관리 인터페이스
interface ExpertAvailabilityAttributes {
  id: number;
  expertId: number; // Expert 테이블과의 외래키
  dayOfWeek: string; // 요일 (monday, tuesday, wednesday, thursday, friday, saturday, sunday)
  availableHours: string; // 가능한 시간 (JSON 배열, 예: ["09:00", "10:00", "14:00"])
  isAvailable: boolean; // 해당 요일 가능 여부
  timeZone: string; // 시간대
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ExpertAvailabilityCreationAttributes = Optional<
  ExpertAvailabilityAttributes,
  | "id"
  | "availableHours"
  | "isAvailable"
  | "timeZone"
>;

export class ExpertAvailability
  extends Model<ExpertAvailabilityAttributes, ExpertAvailabilityCreationAttributes>
  implements ExpertAvailabilityAttributes
{
  public id!: number;
  public expertId!: number;
  public dayOfWeek!: string;
  public availableHours!: string;
  public isAvailable!: boolean;
  public timeZone!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExpertAvailability.init(
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
      }
    },
    dayOfWeek: {
      type: DataTypes.ENUM(
        'monday',
        'tuesday', 
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ),
      allowNull: false,
      comment: '요일'
    },
    availableHours: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: '가능한 시간 (JSON 배열)'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '해당 요일 가능 여부'
    },
    timeZone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Asia/Seoul",
      comment: '시간대'
    },
  },
  {
    sequelize,
    tableName: "expert_availability",
    modelName: "ExpertAvailability",
    timestamps: true,
    indexes: [
      {
        fields: ['expertId', 'dayOfWeek'],
        unique: true
      },
      {
        fields: ['expertId']
      },
      {
        fields: ['dayOfWeek']
      },
      {
        fields: ['isAvailable']
      }
    ]
  }
);
