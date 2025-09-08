'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      consultationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'consultations', key: 'id' }
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      expertId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'experts', key: 'id' }
      },
      rating: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '평점 (1-5)'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: "",
        comment: '리뷰 제목'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
        comment: '리뷰 내용'
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '익명 여부'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '검증된 리뷰 여부'
      },
      helpfulCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '도움이 됐어요 수'
      },
      reportCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '신고 수'
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '공개 여부'
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '삭제 여부'
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
    await queryInterface.addIndex('reviews', ['consultationId'], { unique: true });
    await queryInterface.addIndex('reviews', ['userId']);
    await queryInterface.addIndex('reviews', ['expertId']);
    await queryInterface.addIndex('reviews', ['rating']);
    await queryInterface.addIndex('reviews', ['isPublic', 'isDeleted']);
    await queryInterface.addIndex('reviews', ['isVerified']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  }
};