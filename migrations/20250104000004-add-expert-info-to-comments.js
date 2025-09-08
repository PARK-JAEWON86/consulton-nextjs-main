'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 전문가 정보를 저장할 컬럼들 추가
    await queryInterface.addColumn('community_comments', 'expertSpecialty', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: '전문가 전문분야 (전문가 댓글인 경우에만 사용)'
    });

    await queryInterface.addColumn('community_comments', 'expertLevel', {
      type: Sequelize.ENUM('junior', 'senior', 'expert', 'master'),
      allowNull: true,
      comment: '전문가 레벨 (전문가 댓글인 경우에만 사용)'
    });

    await queryInterface.addColumn('community_comments', 'expertExperience', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '전문가 경력 (년) (전문가 댓글인 경우에만 사용)'
    });

    // 인덱스 추가
    await queryInterface.addIndex('community_comments', ['expertSpecialty']);
    await queryInterface.addIndex('community_comments', ['expertLevel']);
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거
    await queryInterface.removeIndex('community_comments', ['expertLevel']);
    await queryInterface.removeIndex('community_comments', ['expertSpecialty']);

    // 컬럼 제거
    await queryInterface.removeColumn('community_comments', 'expertExperience');
    await queryInterface.removeColumn('community_comments', 'expertLevel');
    await queryInterface.removeColumn('community_comments', 'expertSpecialty');
  }
};
