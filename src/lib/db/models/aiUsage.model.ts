import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export interface AiUsageAttrs {
  id: number;
  userId: number;
  usedTokens: number;
  purchasedTokens: number;
  remainingPercent: number;
  monthlyResetDate: Date; // ISO string로 사용해도 됨
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type AiUsageCreate = Optional<
  AiUsageAttrs,
  "id" | "usedTokens" | "purchasedTokens" | "remainingPercent" | "monthlyResetDate" | "totalTurns" | "totalTokens" | "averageTokensPerTurn"
>;

export class AiUsage extends Model<AiUsageAttrs, AiUsageCreate> implements AiUsageAttrs {
  id!: number;
  userId!: number;
  usedTokens!: number;
  purchasedTokens!: number;
  remainingPercent!: number;
  monthlyResetDate!: Date;
  totalTurns!: number;
  totalTokens!: number;
  averageTokensPerTurn!: number;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

AiUsage.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    usedTokens: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    purchasedTokens: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    remainingPercent: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
    monthlyResetDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    totalTurns: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    totalTokens: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    averageTokensPerTurn: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: "ai_usages", modelName: "AiUsage", timestamps: true }
);
