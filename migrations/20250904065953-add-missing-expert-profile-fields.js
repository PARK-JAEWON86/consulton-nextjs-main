'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // expert_profiles 테이블에 누락된 필드들 추가
    await queryInterface.addColumn('expert_profiles', 'consultationTypes', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '[]',
      comment: '상담 유형 (JSON 배열)'
    });

    await queryInterface.addColumn('expert_profiles', 'languages', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '[]',
      comment: '언어 (JSON 배열)'
    });

    await queryInterface.addColumn('expert_profiles', 'hourlyRate', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '시간당 요금'
    });

    await queryInterface.addColumn('expert_profiles', 'pricePerMinute', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '분당 요금'
    });

    await queryInterface.addColumn('expert_profiles', 'totalSessions', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '총 상담 수'
    });

    await queryInterface.addColumn('expert_profiles', 'avgRating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '평균 평점'
    });

    await queryInterface.addColumn('expert_profiles', 'reviewCount', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '리뷰 수'
    });

    await queryInterface.addColumn('expert_profiles', 'completionRate', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '완료율'
    });

    await queryInterface.addColumn('expert_profiles', 'responseTime', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '응답 시간'
    });

    await queryInterface.addColumn('expert_profiles', 'level', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '전문가 레벨'
    });

    await queryInterface.addColumn('expert_profiles', 'profileViews', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '프로필 조회수'
    });

    await queryInterface.addColumn('expert_profiles', 'lastActiveAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '마지막 활동 시간'
    });

    await queryInterface.addColumn('expert_profiles', 'joinedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '가입일'
    });

    await queryInterface.addColumn('expert_profiles', 'availability', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
      comment: '주간 가용성 (JSON 객체)'
    });
  },

  async down (queryInterface, Sequelize) {
    // 추가된 컬럼들 제거
    await queryInterface.removeColumn('expert_profiles', 'consultationTypes');
    await queryInterface.removeColumn('expert_profiles', 'languages');
    await queryInterface.removeColumn('expert_profiles', 'hourlyRate');
    await queryInterface.removeColumn('expert_profiles', 'pricePerMinute');
    await queryInterface.removeColumn('expert_profiles', 'totalSessions');
    await queryInterface.removeColumn('expert_profiles', 'avgRating');
    await queryInterface.removeColumn('expert_profiles', 'reviewCount');
    await queryInterface.removeColumn('expert_profiles', 'completionRate');
    await queryInterface.removeColumn('expert_profiles', 'responseTime');
    await queryInterface.removeColumn('expert_profiles', 'level');
    await queryInterface.removeColumn('expert_profiles', 'profileViews');
    await queryInterface.removeColumn('expert_profiles', 'lastActiveAt');
    await queryInterface.removeColumn('expert_profiles', 'joinedAt');
    await queryInterface.removeColumn('expert_profiles', 'availability');
  }
};
