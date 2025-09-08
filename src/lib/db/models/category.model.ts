import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 카테고리 인터페이스
interface CategoryAttributes {
  id: number;
  name: string; // 카테고리 이름 (예: "심리상담", "법률상담")
  description: string; // 카테고리 설명
  icon: string; // 아이콘 이름 (예: "Brain", "Scale")
  isActive: boolean; // 활성화 여부
  sortOrder: number; // 정렬 순서
  consultationCount: number; // 해당 카테고리 상담 수
  expertCount: number; // 해당 카테고리 전문가 수
  averageRating: number; // 평균 평점
  createdAt?: Date;
  updatedAt?: Date;
}

// 생성 시 필수 아닌 컬럼 정의
type CategoryCreationAttributes = Optional<
  CategoryAttributes,
  | "id"
  | "description"
  | "icon"
  | "isActive"
  | "sortOrder"
  | "consultationCount"
  | "expertCount"
  | "averageRating"
>;

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public icon!: string;
  public isActive!: boolean;
  public sortOrder!: number;
  public consultationCount!: number;
  public expertCount!: number;
  public averageRating!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '카테고리 이름'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
      comment: '카테고리 설명'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "",
      comment: '아이콘 이름'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '활성화 여부'
    },
    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '정렬 순서'
    },
    consultationCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '해당 카테고리 상담 수'
    },
    expertCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '해당 카테고리 전문가 수'
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5
      },
      comment: '평균 평점 (0-5)'
    },
  },
  {
    sequelize,
    tableName: "categories",
    modelName: "Category",
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['sortOrder']
      }
    ]
  }
);
