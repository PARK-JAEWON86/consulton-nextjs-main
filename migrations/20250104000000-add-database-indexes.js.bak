'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. users 테이블 인덱스
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role'
    });
    
    await queryInterface.addIndex('users', ['isActive'], {
      name: 'idx_users_isActive'
    });

    // 2. experts 테이블 인덱스
    await queryInterface.addIndex('experts', ['userId'], {
      name: 'idx_experts_userId',
      unique: true
    });
    
    await queryInterface.addIndex('experts', ['level'], {
      name: 'idx_experts_level'
    });
    
    await queryInterface.addIndex('experts', ['isActive'], {
      name: 'idx_experts_isActive'
    });

    // 3. expert_profiles 테이블 인덱스
    await queryInterface.addIndex('expert_profiles', ['expertId'], {
      name: 'idx_expert_profiles_expertId',
      unique: true
    });
    
    await queryInterface.addIndex('expert_profiles', ['avgRating'], {
      name: 'idx_expert_profiles_avgRating'
    });
    
    await queryInterface.addIndex('expert_profiles', ['totalSessions'], {
      name: 'idx_expert_profiles_totalSessions'
    });
    
    await queryInterface.addIndex('expert_profiles', ['level'], {
      name: 'idx_expert_profiles_level'
    });

    // 4. consultations 테이블 인덱스 (가장 중요한 테이블)
    await queryInterface.addIndex('consultations', ['userId'], {
      name: 'idx_consultations_userId'
    });
    
    await queryInterface.addIndex('consultations', ['expertId'], {
      name: 'idx_consultations_expertId'
    });
    
    await queryInterface.addIndex('consultations', ['status'], {
      name: 'idx_consultations_status'
    });
    
    await queryInterface.addIndex('consultations', ['categoryId'], {
      name: 'idx_consultations_categoryId'
    });
    
    await queryInterface.addIndex('consultations', ['createdAt'], {
      name: 'idx_consultations_createdAt'
    });
    
    // 복합 인덱스 - 자주 함께 사용되는 조건들
    await queryInterface.addIndex('consultations', ['expertId', 'status'], {
      name: 'idx_consultations_expertId_status'
    });
    
    await queryInterface.addIndex('consultations', ['userId', 'status'], {
      name: 'idx_consultations_userId_status'
    });
    
    await queryInterface.addIndex('consultations', ['status', 'createdAt'], {
      name: 'idx_consultations_status_createdAt'
    });

    // 5. reviews 테이블 인덱스
    await queryInterface.addIndex('reviews', ['expertId'], {
      name: 'idx_reviews_expertId'
    });
    
    await queryInterface.addIndex('reviews', ['consultationId'], {
      name: 'idx_reviews_consultationId'
    });
    
    await queryInterface.addIndex('reviews', ['userId'], {
      name: 'idx_reviews_userId'
    });
    
    await queryInterface.addIndex('reviews', ['isDeleted'], {
      name: 'idx_reviews_isDeleted'
    });
    
    await queryInterface.addIndex('reviews', ['isPublic'], {
      name: 'idx_reviews_isPublic'
    });
    
    await queryInterface.addIndex('reviews', ['rating'], {
      name: 'idx_reviews_rating'
    });
    
    await queryInterface.addIndex('reviews', ['createdAt'], {
      name: 'idx_reviews_createdAt'
    });
    
    // 복합 인덱스
    await queryInterface.addIndex('reviews', ['expertId', 'isDeleted'], {
      name: 'idx_reviews_expertId_isDeleted'
    });
    
    await queryInterface.addIndex('reviews', ['expertId', 'isPublic'], {
      name: 'idx_reviews_expertId_isPublic'
    });

    // 6. consultation_summaries 테이블 인덱스
    await queryInterface.addIndex('consultation_summaries', ['consultationId'], {
      name: 'idx_consultation_summaries_consultationId',
      unique: true
    });
    
    await queryInterface.addIndex('consultation_summaries', ['isPublic'], {
      name: 'idx_consultation_summaries_isPublic'
    });
    
    await queryInterface.addIndex('consultation_summaries', ['createdAt'], {
      name: 'idx_consultation_summaries_createdAt'
    });

    // 7. consultation_sessions 테이블 인덱스
    await queryInterface.addIndex('consultation_sessions', ['consultationId'], {
      name: 'idx_consultation_sessions_consultationId'
    });
    
    await queryInterface.addIndex('consultation_sessions', ['status'], {
      name: 'idx_consultation_sessions_status'
    });
    
    await queryInterface.addIndex('consultation_sessions', ['startTime'], {
      name: 'idx_consultation_sessions_startTime'
    });

    // 8. payments 테이블 인덱스
    await queryInterface.addIndex('payments', ['userId'], {
      name: 'idx_payments_userId'
    });
    
    await queryInterface.addIndex('payments', ['consultationId'], {
      name: 'idx_payments_consultationId'
    });
    
    await queryInterface.addIndex('payments', ['status'], {
      name: 'idx_payments_status'
    });
    
    await queryInterface.addIndex('payments', ['paymentType'], {
      name: 'idx_payments_paymentType'
    });
    
    await queryInterface.addIndex('payments', ['createdAt'], {
      name: 'idx_payments_createdAt'
    });
    
    await queryInterface.addIndex('payments', ['transactionId'], {
      name: 'idx_payments_transactionId',
      unique: true
    });
    
    // 복합 인덱스
    await queryInterface.addIndex('payments', ['userId', 'status'], {
      name: 'idx_payments_userId_status'
    });

    // 9. payment_methods 테이블 인덱스
    await queryInterface.addIndex('payment_methods', ['userId'], {
      name: 'idx_payment_methods_userId'
    });
    
    await queryInterface.addIndex('payment_methods', ['isDefault'], {
      name: 'idx_payment_methods_isDefault'
    });

    // 10. notifications 테이블 인덱스
    await queryInterface.addIndex('notifications', ['userId'], {
      name: 'idx_notifications_userId'
    });
    
    await queryInterface.addIndex('notifications', ['isRead'], {
      name: 'idx_notifications_isRead'
    });
    
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });
    
    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'idx_notifications_createdAt'
    });
    
    // 복합 인덱스
    await queryInterface.addIndex('notifications', ['userId', 'isRead'], {
      name: 'idx_notifications_userId_isRead'
    });

    // 11. expert_availability 테이블 인덱스
    await queryInterface.addIndex('expert_availability', ['expertId'], {
      name: 'idx_expert_availability_expertId'
    });
    
    await queryInterface.addIndex('expert_availability', ['dayOfWeek'], {
      name: 'idx_expert_availability_dayOfWeek'
    });
    
    await queryInterface.addIndex('expert_availability', ['isAvailable'], {
      name: 'idx_expert_availability_isAvailable'
    });

    // 12. categories 테이블 인덱스
    await queryInterface.addIndex('categories', ['isActive'], {
      name: 'idx_categories_isActive'
    });
    
    await queryInterface.addIndex('categories', ['parentId'], {
      name: 'idx_categories_parentId'
    });

    // 13. user_credits 테이블 인덱스
    await queryInterface.addIndex('user_credits', ['userId'], {
      name: 'idx_user_credits_userId'
    });
    
    await queryInterface.addIndex('user_credits', ['type'], {
      name: 'idx_user_credits_type'
    });
    
    await queryInterface.addIndex('user_credits', ['createdAt'], {
      name: 'idx_user_credits_createdAt'
    });

    // 14. ai_usages 테이블 인덱스
    await queryInterface.addIndex('ai_usages', ['userId'], {
      name: 'idx_ai_usages_userId'
    });
    
    await queryInterface.addIndex('ai_usages', ['sessionId'], {
      name: 'idx_ai_usages_sessionId'
    });
    
    await queryInterface.addIndex('ai_usages', ['createdAt'], {
      name: 'idx_ai_usages_createdAt'
    });
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거 (역순으로)
    const indexes = [
      'idx_ai_usages_createdAt',
      'idx_ai_usages_sessionId',
      'idx_ai_usages_userId',
      'idx_user_credits_createdAt',
      'idx_user_credits_type',
      'idx_user_credits_userId',
      'idx_categories_parentId',
      'idx_categories_isActive',
      'idx_expert_availability_isAvailable',
      'idx_expert_availability_dayOfWeek',
      'idx_expert_availability_expertId',
      'idx_notifications_userId_isRead',
      'idx_notifications_createdAt',
      'idx_notifications_type',
      'idx_notifications_isRead',
      'idx_notifications_userId',
      'idx_payment_methods_isDefault',
      'idx_payment_methods_userId',
      'idx_payments_userId_status',
      'idx_payments_transactionId',
      'idx_payments_createdAt',
      'idx_payments_paymentType',
      'idx_payments_status',
      'idx_payments_consultationId',
      'idx_payments_userId',
      'idx_consultation_sessions_startTime',
      'idx_consultation_sessions_status',
      'idx_consultation_sessions_consultationId',
      'idx_consultation_summaries_createdAt',
      'idx_consultation_summaries_isPublic',
      'idx_consultation_summaries_consultationId',
      'idx_reviews_expertId_isPublic',
      'idx_reviews_expertId_isDeleted',
      'idx_reviews_createdAt',
      'idx_reviews_rating',
      'idx_reviews_isPublic',
      'idx_reviews_isDeleted',
      'idx_reviews_userId',
      'idx_reviews_consultationId',
      'idx_reviews_expertId',
      'idx_consultations_status_createdAt',
      'idx_consultations_userId_status',
      'idx_consultations_expertId_status',
      'idx_consultations_createdAt',
      'idx_consultations_categoryId',
      'idx_consultations_status',
      'idx_consultations_expertId',
      'idx_consultations_userId',
      'idx_expert_profiles_level',
      'idx_expert_profiles_totalSessions',
      'idx_expert_profiles_avgRating',
      'idx_expert_profiles_expertId',
      'idx_experts_isActive',
      'idx_experts_level',
      'idx_experts_userId',
      'idx_users_isActive',
      'idx_users_role',
      'idx_users_email'
    ];

    for (const indexName of indexes) {
      try {
        await queryInterface.removeIndex('users', indexName);
      } catch (error) {
        // 인덱스가 존재하지 않을 수 있으므로 에러 무시
        console.log(`인덱스 ${indexName} 제거 중 오류 (무시됨):`, error.message);
      }
    }
  }
};
