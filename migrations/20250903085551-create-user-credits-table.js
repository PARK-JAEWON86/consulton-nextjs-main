'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_credits', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      aiChatTotal: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 7300,
        comment: 'AI 채팅 총 크레딧'
      },
      aiChatUsed: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'AI 채팅 사용 크레딧'
      },
      purchasedTotal: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '구매한 총 크레딧'
      },
      purchasedUsed: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '구매한 크레딧 사용량'
      },
      lastResetDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '마지막 리셋 날짜'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    // 인덱스 추가
    await queryInterface.addIndex('user_credits', ['userId'], { unique: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_credits');
  }
};