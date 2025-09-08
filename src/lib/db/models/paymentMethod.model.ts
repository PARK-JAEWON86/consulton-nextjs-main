import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 결제 수단 인터페이스
interface PaymentMethodAttributes {
  id: number;
  userId: number; // User 테이블과의 외래키
  type: 'card' | 'bank'; // 결제 수단 타입
  name: string; // 카드명 또는 계좌명
  last4?: string; // 카드 뒷자리 4자리
  bankName?: string; // 은행명
  isDefault: boolean; // 기본 결제 수단 여부
  expiryDate?: string; // 카드 만료일 (MM/YY)
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 필드
interface PaymentMethodCreationAttributes extends Optional<PaymentMethodAttributes, 'id' | 'last4' | 'bankName' | 'isDefault' | 'expiryDate' | 'createdAt' | 'updatedAt'> {}

// PaymentMethod 모델 클래스
export class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'card' | 'bank';
  public name!: string;
  public last4?: string;
  public bankName?: string;
  public isDefault!: boolean;
  public expiryDate?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 모델 초기화
PaymentMethod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '사용자 ID (User 테이블과의 외래키)',
    },
    type: {
      type: DataTypes.ENUM('card', 'bank'),
      allowNull: false,
      comment: '결제 수단 타입',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '카드명 또는 계좌명',
    },
    last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: '카드 뒷자리 4자리',
    },
    bankName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '은행명',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '기본 결제 수단 여부',
    },
    expiryDate: {
      type: DataTypes.STRING(5),
      allowNull: true,
      comment: '카드 만료일 (MM/YY)',
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
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_payment_methods_user_id',
      },
      {
        fields: ['type'],
        name: 'idx_payment_methods_type',
      },
      {
        fields: ['isDefault'],
        name: 'idx_payment_methods_is_default',
      },
    ],
    comment: '결제 수단 정보를 저장하는 테이블',
  }
);
