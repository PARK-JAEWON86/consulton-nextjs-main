import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 알림 인터페이스
interface NotificationAttributes {
  id: number;
  userId: number; // User 테이블과의 외래키
  type: string; // 알림 타입 (consultation_request, payment, system 등)
  title: string; // 알림 제목
  message: string; // 알림 메시지
  data?: any; // 추가 데이터 (JSON)
  isRead: boolean; // 읽음 여부
  priority: 'low' | 'medium' | 'high'; // 우선순위
  expiresAt?: Date; // 만료 시간
  readAt?: Date; // 읽은 시간
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 필드
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'data' | 'isRead' | 'priority' | 'expiresAt' | 'readAt' | 'createdAt' | 'updatedAt'> {}

// Notification 모델 클래스
export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public type!: string;
  public title!: string;
  public message!: string;
  public data?: any;
  public isRead!: boolean;
  public priority!: 'low' | 'medium' | 'high';
  public expiresAt?: Date;
  public readAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 모델 초기화
Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '사용자 ID (User 테이블과의 외래키)',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '알림 타입 (consultation_request, payment, system 등)',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '알림 제목',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '알림 메시지',
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '추가 데이터 (JSON 형태)',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '읽음 여부',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '우선순위',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '만료 시간',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '읽은 시간',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_notifications_user_id',
      },
      {
        fields: ['type'],
        name: 'idx_notifications_type',
      },
      {
        fields: ['isRead'],
        name: 'idx_notifications_is_read',
      },
      {
        fields: ['createdAt'],
        name: 'idx_notifications_created_at',
      },
      {
        fields: ['expiresAt'],
        name: 'idx_notifications_expires_at',
      },
    ],
    comment: '알림 정보를 저장하는 테이블',
  }
);
