'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('community_likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      targetType: {
        type: Sequelize.ENUM('post', 'comment'),
        allowNull: false,
        comment: '좋아요 대상 타입 (게시글 또는 댓글)'
      },
      targetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '좋아요 대상 ID (게시글 ID 또는 댓글 ID)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 복합 인덱스 추가 (중복 방지)
    await queryInterface.addIndex('community_likes', ['userId', 'targetType', 'targetId'], {
      unique: true,
      name: 'unique_user_target_like'
    });

    // 개별 인덱스 추가
    await queryInterface.addIndex('community_likes', ['userId']);
    await queryInterface.addIndex('community_likes', ['targetType']);
    await queryInterface.addIndex('community_likes', ['targetId']);
    await queryInterface.addIndex('community_likes', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('community_likes');
  }
};
