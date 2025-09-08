import { User } from './user.model';
import { UserCredits } from './userCredits.model';
import { AiUsage } from './aiUsage.model';
import { Expert } from './expert.model';
import { ExpertProfile } from './expertProfile.model';
import { ExpertAvailability } from './expertAvailability.model';
import { Consultation } from './consultation.model';
import { ConsultationSession } from './consultationSession.model';
import { ConsultationSummary } from './consultationSummary.model';
import { Category } from './category.model';
import { Review } from './review.model';
import { Payment } from './payment.model';
import { Notification } from './notification.model';
import { PaymentMethod } from './paymentMethod.model';

// User 모델 연관관계 설정
User.hasOne(UserCredits, { foreignKey: 'userId', as: 'credits' });
User.hasOne(AiUsage, { foreignKey: 'userId', as: 'aiUsage' });
User.hasOne(Expert, { foreignKey: 'userId', as: 'expert' });
User.hasMany(Consultation, { foreignKey: 'userId', as: 'consultations' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(PaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });

// Expert 모델 연관관계 설정
Expert.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Expert.hasOne(ExpertProfile, { foreignKey: 'expertId', as: 'profile' });
Expert.hasMany(ExpertAvailability, { foreignKey: 'expertId', as: 'availability' });
Expert.hasMany(Consultation, { foreignKey: 'expertId', as: 'consultations' });
Expert.hasMany(Review, { foreignKey: 'expertId', as: 'reviews' });

// ExpertProfile 모델 연관관계 설정
ExpertProfile.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

// ExpertAvailability 모델 연관관계 설정
ExpertAvailability.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

// Category 모델 연관관계 설정
Category.hasMany(Consultation, { foreignKey: 'categoryId', as: 'consultations' });

// Consultation 모델 연관관계 설정
Consultation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Consultation.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });
Consultation.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Consultation.hasMany(ConsultationSession, { foreignKey: 'consultationId', as: 'sessions' });
Consultation.hasOne(ConsultationSummary, { foreignKey: 'consultationId', as: 'summary' });
Consultation.hasOne(Review, { foreignKey: 'consultationId', as: 'reviewData' });
Consultation.hasMany(Payment, { foreignKey: 'consultationId', as: 'payments' });

// ConsultationSession 모델 연관관계 설정
ConsultationSession.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

// ConsultationSummary 모델 연관관계 설정
ConsultationSummary.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

// Review 모델 연관관계 설정
Review.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

// Payment 모델 연관관계 설정
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Payment.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

// UserCredits 모델 연관관계 설정
UserCredits.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AiUsage 모델 연관관계 설정
AiUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification 모델 연관관계 설정
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PaymentMethod 모델 연관관계 설정
PaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  User,
  UserCredits,
  AiUsage,
  Expert,
  ExpertProfile,
  ExpertAvailability,
  Consultation,
  ConsultationSession,
  ConsultationSummary,
  Category,
  Review,
  Payment,
  Notification,
  PaymentMethod
};
