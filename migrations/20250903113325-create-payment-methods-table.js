'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_methods', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '사용자 ID (User 테이블과의 외래키)',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('card', 'bank'),
        allowNull: false,
        comment: '결제 수단 타입'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '카드명 또는 계좌명'
      },
      last4: {
        type: Sequelize.STRING(4),
        allowNull: true,
        comment: '카드 뒷자리 4자리'
      },
      bankName: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '은행명'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '기본 결제 수단 여부'
      },
      expiryDate: {
        type: Sequelize.STRING(5),
        allowNull: true,
        comment: '카드 만료일 (MM/YY)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('payment_methods', ['userId'], {
      name: 'idx_payment_methods_user_id'
    });
    await queryInterface.addIndex('payment_methods', ['type'], {
      name: 'idx_payment_methods_type'
    });
    await queryInterface.addIndex('payment_methods', ['isDefault'], {
      name: 'idx_payment_methods_is_default'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_methods');
  }
};