'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('expert_profiles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      expertId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'experts', key: 'id' },
        unique: true
      },
      fullName: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '전문가 이름'
      },
      jobTitle: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '직책/직업'
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
        comment: '자기소개'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
        comment: '상세 설명'
      },
      education: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '학력 (JSON 배열)'
      },
      certifications: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '자격증 (JSON 배열)'
      },
      specialties: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '전문 분야 태그 (JSON 배열)'
      },
      specialtyAreas: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '전문 영역 (JSON 배열)'
      },
      consultationStyle: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '상담 스타일'
      },
      targetAudience: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '대상 고객 (JSON 배열)'
      },
      successStories: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '성공 사례 수'
      },
      repeatClients: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '재방문 고객 수'
      },
      averageSessionDuration: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 60,
        comment: '평균 상담 시간 (분)'
      },
      nextAvailableSlot: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "",
        comment: '다음 가능한 시간'
      },
      cancellationPolicy: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '취소 정책'
      },
      reschedulePolicy: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "",
        comment: '일정 변경 정책'
      },
      holidayPolicy: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '공휴일 정책'
      },
      portfolioItems: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '포트폴리오 (JSON 배열)'
      },
      socialProof: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "{}",
        comment: '사회적 증명 (JSON 객체)'
      },
      pricingTiers: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '가격 티어 (JSON 배열)'
      },
      contactInfo: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "{}",
        comment: '연락처 정보 (JSON 객체)'
      },
      profileImage: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '프로필 이미지 URL'
      },
      portfolioFiles: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '포트폴리오 파일 (JSON 배열)'
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "[]",
        comment: '태그 (JSON 배열)'
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

    await queryInterface.addIndex('expert_profiles', ['expertId']);
    await queryInterface.addIndex('expert_profiles', ['fullName']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('expert_profiles');
  }
};