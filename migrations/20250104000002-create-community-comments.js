'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('community_comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'community_posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'community_comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '대댓글인 경우 부모 댓글 ID'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'hidden', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      likes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      depth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '댓글 깊이 (0: 최상위, 1: 대댓글)'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '댓글 순서 (같은 depth 내에서)'
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

    // 인덱스 추가
    await queryInterface.addIndex('community_comments', ['postId']);
    await queryInterface.addIndex('community_comments', ['userId']);
    await queryInterface.addIndex('community_comments', ['parentId']);
    await queryInterface.addIndex('community_comments', ['status']);
    await queryInterface.addIndex('community_comments', ['depth']);
    await queryInterface.addIndex('community_comments', ['order']);
    await queryInterface.addIndex('community_comments', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('community_comments');
  }
};
