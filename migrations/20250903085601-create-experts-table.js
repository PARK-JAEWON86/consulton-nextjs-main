'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('experts', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      specialty: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '전문 분야'
      },
      experience: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '경력 년수'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: '평점 (0-5)'
      },
      reviewCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '리뷰 수'
      },
      totalSessions: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '총 상담 세션 수'
      },
      avgRating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: '평균 평점'
      },
      completionRate: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '상담 완료율 (0-100)'
      },
      responseTime: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "1시간 이내",
        comment: '응답 시간'
      },
      isOnline: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '온라인 상태'
      },
      isProfileComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '프로필 완성도'
      },
      isProfilePublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '프로필 공개 여부'
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: "",
        comment: '위치'
      },
      timeZone: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "Asia/Seoul",
        comment: '시간대'
      },
      languages: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '지원 언어 (JSON 배열)'
      },
      consultationTypes: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '상담 유형 (JSON 배열)'
      },
      hourlyRate: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '시간당 요금 (원)'
      },
      pricePerMinute: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '분당 요금 (원)'
      },
      profileViews: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '프로필 조회수'
      },
      lastActiveAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '마지막 활동 시간'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '가입일'
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
    await queryInterface.addIndex('experts', ['userId'], { unique: true });
    await queryInterface.addIndex('experts', ['specialty']);
    await queryInterface.addIndex('experts', ['rating']);
    await queryInterface.addIndex('experts', ['isOnline']);
    await queryInterface.addIndex('experts', ['isProfilePublic']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('experts');
  }
};
