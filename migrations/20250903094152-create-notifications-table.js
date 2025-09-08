'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
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
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '알림 타입 (consultation_request, payment, system 등)'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '알림 제목'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '알림 메시지'
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '추가 데이터 (JSON 형태)'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '읽음 여부'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
        comment: '우선순위'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '만료 시간'
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '읽은 시간'
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
    await queryInterface.addIndex('notifications', ['userId'], {
      name: 'idx_notifications_user_id'
    });
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });
    await queryInterface.addIndex('notifications', ['isRead'], {
      name: 'idx_notifications_is_read'
    });
    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'idx_notifications_created_at'
    });
    await queryInterface.addIndex('notifications', ['expiresAt'], {
      name: 'idx_notifications_expires_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};