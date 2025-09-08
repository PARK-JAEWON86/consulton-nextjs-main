import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 리뷰 인터페이스
interface ReviewAttributes {
  id: number;
  consultationId: number; // Consultation 테이블과의 외래키
  userId: number; // User 테이블과의 외래키 (리뷰 작성자)
  expertId: number; // Expert 테이블과의 외래키 (리뷰 대상)
  rating: number; // 평점 (1-5)
  title: string; // 리뷰 제목
  content: string; // 리뷰 내용
  isAnonymous: boolean; // 익명 여부
  isVerified: boolean; // 검증된 리뷰 여부 (실제 상담 완료 후 작성)
  helpfulCount: number; // 도움이 됐어요 수
  reportCount: number; // 신고 수
  isPublic: boolean; // 공개 여부
  isDeleted: boolean; // 삭제 여부
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type ReviewCreationAttributes = Optional<
  ReviewAttributes,
  | "id"
  | "title"
  | "content"
  | "isAnonymous"
  | "isVerified"
  | "helpfulCount"
  | "reportCount"
  | "isPublic"
  | "isDeleted"
>;

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  public id!: number;
  public consultationId!: number;
  public userId!: number;
  public expertId!: number;
  public rating!: number;
  public title!: string;
  public content!: string;
  public isAnonymous!: boolean;
  public isVerified!: boolean;
  public helpfulCount!: number;
  public reportCount!: number;
  public isPublic!: boolean;
  public isDeleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
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
    rating: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: '평점 (1-5)'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "",
      comment: '리뷰 제목'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: '리뷰 내용'
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '익명 여부'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '검증된 리뷰 여부'
    },
    helpfulCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '도움이 됐어요 수'
    },
    reportCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '신고 수'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '공개 여부'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '삭제 여부'
    },
  },
  {
    sequelize,
    tableName: "reviews",
    modelName: "Review",
    timestamps: true,
    indexes: [
      {
        fields: ['consultationId'],
        unique: true
      },
      {
        fields: ['userId']
      },
      {
        fields: ['expertId']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['isPublic', 'isDeleted']
      },
      {
        fields: ['isVerified']
      }
    ]
  }
);
