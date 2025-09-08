'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
        comment: '이메일 주소'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        comment: '사용자 이름'
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
    await queryInterface.addIndex('users', ['email'], { unique: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};