'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '카테고리 이름'
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '카테고리 설명'
      },
      icon: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "",
        comment: '아이콘 이름'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '활성화 여부'
      },
      sortOrder: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      consultationCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '해당 카테고리 상담 수'
      },
      expertCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '해당 카테고리 전문가 수'
      },
      averageRating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: '평균 평점 (0-5)'
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
    await queryInterface.addIndex('categories', ['name']);
    await queryInterface.addIndex('categories', ['isActive']);
    await queryInterface.addIndex('categories', ['sortOrder']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  }
};
