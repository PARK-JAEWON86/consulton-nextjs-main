"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ai_usages", {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      usedTokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      purchasedTokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      remainingPercent: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
      monthlyResetDate: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      totalTurns: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      totalTokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      averageTokensPerTurn: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("ai_usages", ["userId"], { unique: true, name: "ux_ai_usages_userId" });

    // (선택) users와 FK 관계를 쓰고 싶다면 아래 주석 해제
    // await queryInterface.addConstraint("ai_usages", {
    //   fields: ["userId"],
    //   type: "foreign key",
    //   name: "fk_ai_usages_userId",
    //   references: { table: "users", field: "id" },
    //   onDelete: "CASCADE",
    //   onUpdate: "CASCADE",
    // });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ai_usages");
  },
};
