'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Expert 테이블에 level 컬럼 추가
    await queryInterface.addColumn('experts', 'level', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '전문가 레벨'
    });
  },

  async down (queryInterface, Sequelize) {
    // level 컬럼 제거
    await queryInterface.removeColumn('experts', 'level');
  }
};
