import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 결제 정보 인터페이스
interface PaymentAttributes {
  id: number;
  userId: number; // User 테이블과의 외래키
  consultationId: number; // Consultation 테이블과의 외래키 (상담 결제인 경우)
  paymentType: string; // 결제 유형 (consultation, credit_purchase, refund)
  amount: number; // 결제 금액 (원)
  currency: string; // 통화 (기본: KRW)
  status: string; // 결제 상태 (pending, completed, failed, cancelled, refunded)
  paymentMethod: string; // 결제 수단 (card, bank_transfer, virtual_account, etc.)
  paymentProvider: string; // 결제 제공업체 (toss, kakao, etc.)
  transactionId: string; // 거래 ID
  orderId: string; // 주문 ID
  description: string; // 결제 설명
  metadata: string; // 추가 메타데이터 (JSON 객체)
  processedAt: Date; // 처리 완료 시간
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  | "id"
  | "consultationId"
  | "currency"
  | "status"
  | "paymentMethod"
  | "paymentProvider"
  | "transactionId"
  | "orderId"
  | "description"
  | "metadata"
  | "processedAt"
>;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public userId!: number;
  public consultationId!: number;
  public paymentType!: string;
  public amount!: number;
  public currency!: string;
  public status!: string;
  public paymentMethod!: string;
  public paymentProvider!: string;
  public transactionId!: string;
  public orderId!: string;
  public description!: string;
  public metadata!: string;
  public processedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
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
    consultationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'consultations',
        key: 'id'
      }
    },
    paymentType: {
      type: DataTypes.ENUM('consultation', 'credit_purchase', 'refund'),
      allowNull: false,
      comment: '결제 유형'
    },
    amount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '결제 금액 (원)'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'KRW',
      comment: '통화'
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      ),
      allowNull: false,
      defaultValue: 'pending',
      comment: '결제 상태'
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "",
      comment: '결제 수단'
    },
    paymentProvider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "",
      comment: '결제 제공업체'
    },
    transactionId: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
      comment: '거래 ID'
    },
    orderId: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
      comment: '주문 ID'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '결제 설명'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "{}",
      comment: '추가 메타데이터 (JSON 객체)'
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '처리 완료 시간'
    },
  },
  {
    sequelize,
    tableName: "payments",
    modelName: "Payment",
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['consultationId']
      },
      {
        fields: ['paymentType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['transactionId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['processedAt']
      }
    ]
  }
);
