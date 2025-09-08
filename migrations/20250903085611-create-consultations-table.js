'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('consultations', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
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
      categoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categories', key: 'id' }
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '상담 제목'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
        comment: '상담 설명'
      },
      consultationType: {
        type: Sequelize.ENUM('video', 'chat', 'voice'),
        allowNull: false,
        comment: '상담 유형'
      },
      status: {
        type: Sequelize.ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '상담 상태'
      },
      scheduledTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '예정된 상담 시간'
      },
      duration: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 60,
        comment: '상담 시간 (분)'
      },
      price: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '상담 가격 (원)'
      },
      expertLevel: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 100,
        comment: '전문가 레벨'
      },
      topic: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '상담 주제'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
        comment: '상담 노트'
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '실제 시작 시간'
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '실제 종료 시간'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: '사용자 평점 (0-5)'
      },
      review: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '사용자 리뷰'
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
    await queryInterface.addIndex('consultations', ['userId']);
    await queryInterface.addIndex('consultations', ['expertId']);
    await queryInterface.addIndex('consultations', ['categoryId']);
    await queryInterface.addIndex('consultations', ['status']);
    await queryInterface.addIndex('consultations', ['scheduledTime']);
    await queryInterface.addIndex('consultations', ['consultationType']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('consultations');
  }
};