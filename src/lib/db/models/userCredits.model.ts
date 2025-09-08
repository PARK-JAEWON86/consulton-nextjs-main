import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface UserCreditsAttrs {
  id: number;
  userId: number;
  aiChatTotal: number;
  aiChatUsed: number;
  purchasedTotal: number;
  purchasedUsed: number;
  lastResetDate: string | null; // YYYY-MM-DD
  createdAt?: Date;
  updatedAt?: Date;
}
type UserCreditsCreate = Optional<UserCreditsAttrs, "id" | "lastResetDate">;

export class UserCredits extends Model<UserCreditsAttrs, UserCreditsCreate>
  implements UserCreditsAttrs {
  id!: number;
  userId!: number;
  aiChatTotal!: number;
  aiChatUsed!: number;
  purchasedTotal!: number;
  purchasedUsed!: number;
  lastResetDate!: string | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

UserCredits.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    aiChatTotal: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 7300 },
    aiChatUsed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    purchasedTotal: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    purchasedUsed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lastResetDate: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
  },
  { sequelize, tableName: "user_credits", modelName: "UserCredits", timestamps: true }
);
