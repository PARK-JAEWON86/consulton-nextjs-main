'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
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
      consultationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'consultations', key: 'id' }
      },
      paymentType: {
        type: Sequelize.ENUM('consultation', 'credit_purchase', 'refund'),
        allowNull: false,
        comment: '결제 유형'
      },
      amount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '결제 금액 (원)'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'KRW',
        comment: '통화'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '결제 상태'
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "",
        comment: '결제 수단'
      },
      paymentProvider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "",
        comment: '결제 제공업체'
      },
      transactionId: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: "",
        comment: '거래 ID'
      },
      orderId: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: "",
        comment: '주문 ID'
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '결제 설명'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "{}",
        comment: '추가 메타데이터 (JSON 객체)'
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '처리 완료 시간'
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
    await queryInterface.addIndex('payments', ['userId']);
    await queryInterface.addIndex('payments', ['consultationId']);
    await queryInterface.addIndex('payments', ['paymentType']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['transactionId']);
    await queryInterface.addIndex('payments', ['orderId']);
    await queryInterface.addIndex('payments', ['processedAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};