'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // users 테이블에 인증 관련 컬럼들 추가
    await queryInterface.addColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '', // 기존 사용자들을 위해 임시 기본값
      comment: '해싱된 비밀번호'
    });

    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('client', 'expert', 'admin'),
      allowNull: false,
      defaultValue: 'client',
      comment: '사용자 역할'
    });

    await queryInterface.addColumn('users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '이메일 인증 여부'
    });

    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '마지막 로그인 시간'
    });

    // 인덱스 추가
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role'
    });
    await queryInterface.addIndex('users', ['isEmailVerified'], {
      name: 'idx_users_is_email_verified'
    });
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거
    await queryInterface.removeIndex('users', 'idx_users_role');
    await queryInterface.removeIndex('users', 'idx_users_is_email_verified');

    // 컬럼 제거
    await queryInterface.removeColumn('users', 'lastLoginAt');
    await queryInterface.removeColumn('users', 'isEmailVerified');
    await queryInterface.removeColumn('users', 'role');
    await queryInterface.removeColumn('users', 'password');
  }
};