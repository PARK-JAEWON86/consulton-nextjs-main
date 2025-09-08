'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 사용자 프로필 관련 필드들을 users 테이블에 추가
    await queryInterface.addColumn('users', 'nickname', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '사용자 닉네임'
    });

    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '전화번호'
    });

    await queryInterface.addColumn('users', 'location', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: '거주지역'
    });

    await queryInterface.addColumn('users', 'birthDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: '생년월일'
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '자기소개'
    });

    await queryInterface.addColumn('users', 'profileImage', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: '프로필 이미지 URL'
    });

    await queryInterface.addColumn('users', 'interestedCategories', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: '관심 카테고리 목록'
    });

    await queryInterface.addColumn('users', 'profileVisibility', {
      type: Sequelize.ENUM('public', 'experts', 'private'),
      allowNull: false,
      defaultValue: 'experts',
      comment: '프로필 공개 설정'
    });
  },

  async down (queryInterface, Sequelize) {
    // 추가된 컬럼들을 제거
    await queryInterface.removeColumn('users', 'nickname');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'location');
    await queryInterface.removeColumn('users', 'birthDate');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'profileImage');
    await queryInterface.removeColumn('users', 'interestedCategories');
    await queryInterface.removeColumn('users', 'profileVisibility');
  }
};
