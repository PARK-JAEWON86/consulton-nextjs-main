'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('community_posts', {
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
      categoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      postType: {
        type: Sequelize.ENUM('general', 'consultation_request', 'consultation_review', 'expert_intro'),
        allowNull: false,
        defaultValue: 'general'
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'hidden', 'deleted'),
        allowNull: false,
        defaultValue: 'published'
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      likes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      comments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '태그 배열 (JSON)'
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '첨부파일 정보 (JSON)'
      },
      consultationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'consultations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '관련 상담 ID (상담후기나 상담요청인 경우)'
      },
      expertId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'experts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '관련 전문가 ID (전문가소개인 경우)'
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '게시일 (draft에서 published로 변경된 시점)'
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
    await queryInterface.addIndex('community_posts', ['userId']);
    await queryInterface.addIndex('community_posts', ['categoryId']);
    await queryInterface.addIndex('community_posts', ['postType']);
    await queryInterface.addIndex('community_posts', ['status']);
    await queryInterface.addIndex('community_posts', ['isPinned']);
    await queryInterface.addIndex('community_posts', ['publishedAt']);
    await queryInterface.addIndex('community_posts', ['createdAt']);
    await queryInterface.addIndex('community_posts', ['views']);
    await queryInterface.addIndex('community_posts', ['likes']);
    await queryInterface.addIndex('community_posts', ['consultationId']);
    await queryInterface.addIndex('community_posts', ['expertId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('community_posts');
  }
};
