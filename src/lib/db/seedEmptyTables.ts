/**
 * 데이터가 없는 테이블들에 테스트 데이터 삽입
 * Sequelize를 사용하여 모든 빈 테이블에 데이터를 생성합니다.
 */

import { 
  AiUsage,
  ExpertAvailability,
  ConsultationSession,
  ConsultationSummary,
  Review,
  Payment,
  Notification,
  PaymentMethod,
  User,
  Expert,
  Consultation,
  Category
} from './models';
import { initializeDatabase } from './init';

// ===== AI 사용량 데이터 생성 =====
export async function seedAiUsages() {
  try {
    console.log('🔄 AI 사용량 데이터 생성 중...');
    
    // 기존 users 테이블의 ID를 가져와서 AI 사용량 데이터 생성
    const users = await User.findAll({ attributes: ['id'] });
    
    const aiUsageData = users.map(user => ({
      userId: user.id,
      usedTokens: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 토큰
      purchasedTokens: Math.floor(Math.random() * 10000) + 5000, // 5000-15000 토큰
      remainingPercent: Math.floor(Math.random() * 50) + 30, // 30-80%
      monthlyResetDate: new Date(),
      totalTurns: Math.floor(Math.random() * 100) + 20, // 20-120 턴
      totalTokens: Math.floor(Math.random() * 15000) + 5000, // 5000-20000 토큰
      averageTokensPerTurn: Math.floor(Math.random() * 200) + 100 // 100-300 토큰
    }));

    await AiUsage.bulkCreate(aiUsageData);
    console.log(`✅ AI 사용량 데이터 ${aiUsageData.length}개 생성 완료`);
    
    return aiUsageData.length;
  } catch (error) {
    console.error('❌ AI 사용량 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 전문가 가용성 데이터 생성 =====
export async function seedExpertAvailability() {
  try {
    console.log('🔄 전문가 가용성 데이터 생성 중...');
    
    // 기존 experts 테이블의 ID를 가져와서 가용성 데이터 생성
    const experts = await Expert.findAll({ attributes: ['id'] });
    
    const availabilityData: any[] = [];
    
    experts.forEach(expert => {
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      daysOfWeek.forEach(day => {
        const isWeekend = day === 'saturday' || day === 'sunday';
        const isAvailable = !isWeekend || Math.random() > 0.7; // 주말은 30% 확률로 가능
        
        const availableHours = isAvailable ? 
          (isWeekend ? 
            ['10:00', '14:00', '16:00'] : 
            ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
          ) : [];
        
        availabilityData.push({
          expertId: expert.id,
          dayOfWeek: day,
          availableHours: JSON.stringify(availableHours),
          isAvailable: isAvailable,
          timeZone: 'Asia/Seoul',
          notes: isWeekend ? '주말 상담 가능' : '평일 정규 상담'
        });
      });
    });

    await ExpertAvailability.bulkCreate(availabilityData);
    console.log(`✅ 전문가 가용성 데이터 ${availabilityData.length}개 생성 완료`);
    
    return availabilityData.length;
  } catch (error) {
    console.error('❌ 전문가 가용성 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 상담 세션 데이터 생성 =====
export async function seedConsultationSessions() {
  try {
    console.log('🔄 상담 세션 데이터 생성 중...');
    
    // 기존 consultations 테이블의 ID를 가져와서 세션 데이터 생성
    const consultations = await Consultation.findAll({ 
      attributes: ['id', 'status', 'scheduledTime', 'duration'],
      where: { status: ['completed', 'in_progress'] }
    });
    
    const sessionData: any[] = [];
    
    consultations.forEach(consultation => {
      const sessionCount = Math.floor(Math.random() * 3) + 1; // 1-3 세션
      
      for (let i = 1; i <= sessionCount; i++) {
        const startTime = new Date(consultation.scheduledTime || new Date());
        startTime.setDate(startTime.getDate() + (i - 1) * 7); // 주간 간격
        startTime.setHours(14 + i, 0, 0, 0); // 오후 시간대
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (consultation.duration || 60));
        
        sessionData.push({
          consultationId: consultation.id,
          sessionNumber: i,
          startTime: startTime,
          endTime: endTime,
          duration: consultation.duration || 60,
          status: i === sessionCount ? 'completed' : 'completed',
          notes: `${i}번째 상담 세션 - ${consultation.status === 'completed' ? '완료' : '진행중'}`,
          transcript: `상담 내용 요약: ${i}번째 세션에서 주요 이슈들을 다루었습니다.`,
          attachments: JSON.stringify([]),
          recordingUrl: i === sessionCount ? `https://recordings.example.com/session_${consultation.id}_${i}.mp4` : null
        });
      }
    });

    await ConsultationSession.bulkCreate(sessionData);
    console.log(`✅ 상담 세션 데이터 ${sessionData.length}개 생성 완료`);
    
    return sessionData.length;
  } catch (error) {
    console.error('❌ 상담 세션 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 상담 요약 데이터 생성 =====
export async function seedConsultationSummaries() {
  try {
    console.log('🔄 상담 요약 데이터 생성 중...');
    
    // 완료된 상담들에 대해 요약 데이터 생성
    const consultations = await Consultation.findAll({ 
      attributes: ['id', 'title', 'categoryId'],
      where: { status: 'completed' }
    });
    
    const summaryData = consultations.map(consultation => {
      const summaryTemplates = [
        {
          title: '상담 요약 및 주요 내용',
          content: '상담을 통해 주요 이슈들을 파악하고 해결 방안을 모색했습니다.',
          keyPoints: ['문제 상황 파악', '원인 분석', '해결 방안 제시', '후속 계획 수립'],
          actionItems: ['일일 실천 과제', '주간 목표 설정', '정기 점검 일정'],
          recommendations: ['추가 상담 권장', '자기 관리 방법', '지속적 모니터링']
        },
        {
          title: '상담 진행 상황 및 결과',
          content: '체계적인 상담을 통해 긍정적인 변화를 이끌어냈습니다.',
          keyPoints: ['현재 상황 점검', '목표 설정', '실행 계획 수립', '진전 상황 평가'],
          actionItems: ['구체적 실행 계획', '일일 체크리스트', '주간 리뷰'],
          recommendations: ['지속적 관리', '추가 리소스 활용', '정기 상담 유지']
        }
      ];
      
      const template = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
      
      return {
        consultationId: consultation.id,
        summaryTitle: `${consultation.title} - ${template.title}`,
        summaryContent: template.content,
        keyPoints: JSON.stringify(template.keyPoints),
        actionItems: JSON.stringify(template.actionItems),
        recommendations: JSON.stringify(template.recommendations),
        followUpPlan: '2주 후 후속 상담 예정',
        todoStatus: JSON.stringify({
          daily_task: 'ongoing',
          weekly_goal: 'pending',
          check_in: 'scheduled'
        }),
        isPublic: false
      };
    });

    await ConsultationSummary.bulkCreate(summaryData);
    console.log(`✅ 상담 요약 데이터 ${summaryData.length}개 생성 완료`);
    
    return summaryData.length;
  } catch (error) {
    console.error('❌ 상담 요약 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 결제 데이터 생성 =====
export async function seedPayments() {
  try {
    console.log('🔄 결제 데이터 생성 중...');
    
    // 상담 완료된 것들에 대해 결제 데이터 생성
    const consultations = await Consultation.findAll({ 
      attributes: ['id', 'userId', 'price'],
      where: { status: 'completed' }
    });
    
    const paymentData = consultations.map(consultation => {
      const paymentMethods = ['card', 'bank_transfer', 'kakao_pay', 'toss'];
      const providers = ['toss', 'kakao', 'naver', 'kicc'];
      const statuses = ['completed', 'completed', 'completed', 'pending']; // 대부분 완료
      
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        userId: consultation.userId,
        consultationId: consultation.id,
        paymentType: 'consultation',
        amount: consultation.price || 75000,
        currency: 'KRW',
        status: status,
        paymentMethod: method,
        paymentProvider: provider,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: `ORDER_${consultation.id}_${Date.now()}`,
        description: '전문가 상담 결제',
        metadata: JSON.stringify({
          cardType: method === 'card' ? 'credit' : null,
          cardBrand: method === 'card' ? 'VISA' : null,
          bankName: method === 'bank_transfer' ? '국민은행' : null
        }),
        processedAt: status === 'completed' ? new Date() : undefined
      };
    });

    await Payment.bulkCreate(paymentData);
    console.log(`✅ 결제 데이터 ${paymentData.length}개 생성 완료`);
    
    return paymentData.length;
  } catch (error) {
    console.error('❌ 결제 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 알림 데이터 생성 =====
export async function seedNotifications() {
  try {
    console.log('🔄 알림 데이터 생성 중...');
    
    const users = await User.findAll({ attributes: ['id'] });
    const notificationData: any[] = [];
    
    users.forEach(user => {
      // 각 사용자당 3-5개의 알림 생성
      const notificationCount = Math.floor(Math.random() * 3) + 3;
      
      const notificationTypes = [
        { type: 'consultation_request', title: '새로운 상담 요청', message: '새로운 상담 요청이 접수되었습니다.' },
        { type: 'payment', title: '결제 완료', message: '상담 결제가 완료되었습니다.' },
        { type: 'system', title: '시스템 공지', message: '새로운 기능이 추가되었습니다.' },
        { type: 'reminder', title: '상담 일정 알림', message: '내일 상담 일정이 있습니다.' },
        { type: 'review', title: '리뷰 작성 요청', message: '상담 후기를 작성해주세요.' }
      ];
      
      for (let i = 0; i < notificationCount; i++) {
        const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const isRead = Math.random() > 0.3; // 70% 확률로 읽음
        
        notificationData.push({
          userId: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'system'
          }),
          isRead: isRead,
          priority: Math.random() > 0.8 ? 'high' : 'medium',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후 만료
          readAt: isRead ? new Date() : null
        });
      }
    });

    await Notification.bulkCreate(notificationData);
    console.log(`✅ 알림 데이터 ${notificationData.length}개 생성 완료`);
    
    return notificationData.length;
  } catch (error) {
    console.error('❌ 알림 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 결제 수단 데이터 생성 =====
export async function seedPaymentMethods() {
  try {
    console.log('🔄 결제 수단 데이터 생성 중...');
    
    const users = await User.findAll({ attributes: ['id'] });
    const paymentMethodData: any[] = [];
    
    users.forEach(user => {
      // 각 사용자당 1-2개의 결제 수단 생성
      const methodCount = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < methodCount; i++) {
        const isCard = Math.random() > 0.5;
        
        if (isCard) {
          paymentMethodData.push({
            userId: user.id,
            type: 'card',
            name: '신용카드',
            last4: Math.floor(Math.random() * 9000) + 1000, // 1000-9999
            bankName: null,
            isDefault: i === 0, // 첫 번째가 기본
            expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 5) + 25)}` // MM/YY
          });
        } else {
          const banks = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행'];
          paymentMethodData.push({
            userId: user.id,
            type: 'bank',
            name: '계좌이체',
            last4: null,
            bankName: banks[Math.floor(Math.random() * banks.length)],
            isDefault: i === 0,
            expiryDate: null
          });
        }
      }
    });

    await PaymentMethod.bulkCreate(paymentMethodData);
    console.log(`✅ 결제 수단 데이터 ${paymentMethodData.length}개 생성 완료`);
    
    return paymentMethodData.length;
  } catch (error) {
    console.error('❌ 결제 수단 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== 모든 빈 테이블에 데이터 생성 =====
export async function seedAllEmptyTables() {
  try {
    console.log('🚀 모든 빈 테이블에 데이터 생성 시작...');
    
    // 데이터베이스 초기화
    await initializeDatabase();
    
    const results = {
      aiUsages: 0,
      expertAvailability: 0,
      consultationSessions: 0,
      consultationSummaries: 0,
      payments: 0,
      notifications: 0,
      paymentMethods: 0
    };
    
    // 각 테이블에 데이터 생성
    results.aiUsages = await seedAiUsages();
    results.expertAvailability = await seedExpertAvailability();
    results.consultationSessions = await seedConsultationSessions();
    results.consultationSummaries = await seedConsultationSummaries();
    results.payments = await seedPayments();
    results.notifications = await seedNotifications();
    results.paymentMethods = await seedPaymentMethods();
    
    console.log('🎉 모든 빈 테이블 데이터 생성 완료!');
    console.log('📊 생성된 데이터 요약:');
    console.log(`   - AI 사용량: ${results.aiUsages}개`);
    console.log(`   - 전문가 가용성: ${results.expertAvailability}개`);
    console.log(`   - 상담 세션: ${results.consultationSessions}개`);
    console.log(`   - 상담 요약: ${results.consultationSummaries}개`);
    console.log(`   - 결제 내역: ${results.payments}개`);
    console.log(`   - 알림: ${results.notifications}개`);
    console.log(`   - 결제 수단: ${results.paymentMethods}개`);
    
    return results;
  } catch (error) {
    console.error('❌ 데이터 생성 중 오류 발생:', error);
    throw error;
  }
}

// ===== 개별 테이블 데이터 생성 함수들 =====
export async function seedSpecificTable(tableName: string) {
  try {
    await initializeDatabase();
    
    switch (tableName) {
      case 'ai_usages':
        return await seedAiUsages();
      case 'expert_availability':
        return await seedExpertAvailability();
      case 'consultation_sessions':
        return await seedConsultationSessions();
      case 'consultation_summaries':
        return await seedConsultationSummaries();
      case 'payments':
        return await seedPayments();
      case 'notifications':
        return await seedNotifications();
      case 'payment_methods':
        return await seedPaymentMethods();
      default:
        throw new Error(`알 수 없는 테이블: ${tableName}`);
    }
  } catch (error) {
    console.error(`❌ ${tableName} 테이블 데이터 생성 실패:`, error);
    throw error;
  }
}
