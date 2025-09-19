import { NextRequest, NextResponse } from 'next/server';
import { Consultation, Notification, User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  try {
    console.log('테스트 데이터 생성 API 호출됨');
    await initializeDatabase();

    // 기존 사용자와 전문가 조회
    const users = await User.findAll({ limit: 5 });
    const experts = await Expert.findAll({
      include: [{ model: User, as: 'user' }],
      limit: 3
    });

    if (users.length === 0 || experts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '사용자 또는 전문가 데이터가 없습니다. 먼저 계정을 생성해주세요.'
      }, { status: 400 });
    }

    const testConsultations = [];
    const testNotifications = [];

    // 테스트 상담 신청 데이터 생성
    for (let i = 0; i < 5; i++) {
      const user = users[i % users.length];
      const expert = experts[i % experts.length];

      const consultation = await Consultation.create({
        userId: user.id,
        expertId: expert.id,
        categoryId: 1,
        title: `${expert.specialty || '상담'} 신청 ${i + 1}`,
        description: [
          '안녕하세요. 상담을 신청하고 싶습니다.',
          '현재 진행 중인 프로젝트에 대해 조언이 필요합니다.',
          '비즈니스 전략에 대해 상담받고 싶습니다.',
          '기술적인 문제 해결에 도움이 필요합니다.',
          '진로 상담을 받고 싶습니다.'
        ][i],
        consultationType: ['video', 'chat', 'voice'][i % 3],
        status: ['pending', 'scheduled', 'pending', 'completed', 'pending'][i],
        scheduledTime: i % 2 === 0 ? new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000) : undefined,
        duration: 60,
        price: expert.hourlyRate || 50000,
        expertLevel: expert.experience || 1,
        topic: `상담 주제 ${i + 1}`,
        notes: JSON.stringify({
          urgency: ['high', 'medium', 'low'][i % 3],
          clientName: user.name,
          clientEmail: user.email,
          preferredDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferredTime: ['10:00', '14:00', '16:00'][i % 3]
        })
      });

      testConsultations.push(consultation);

      // 전문가에게 상담 신청 알림 생성
      if (consultation.status === 'pending') {
        const notification = await Notification.create({
          userId: expert.userId,
          type: 'consultation_request',
          title: '새로운 상담 신청',
          message: `${user.name}님이 ${expert.specialty || '상담'}을 신청했습니다.`,
          data: {
            consultationId: consultation.id,
            clientName: user.name,
            clientEmail: user.email,
            consultationType: consultation.consultationType,
            urgency: JSON.parse(consultation.notes || '{}').urgency,
            message: consultation.description.substring(0, 200)
          },
          priority: JSON.parse(consultation.notes || '{}').urgency === 'high' ? 'high' : 'medium',
          isRead: i > 2 // 처음 3개는 읽지 않음으로 설정
        });
        testNotifications.push(notification);
      }

      // 신청자에게 확인 알림 생성
      const clientNotification = await Notification.create({
        userId: user.id,
        type: 'consultation_request_sent',
        title: '상담 신청 완료',
        message: `${expert.user?.name || '전문가'}님께 상담 신청이 완료되었습니다.`,
        data: {
          consultationId: consultation.id,
          expertName: expert.user?.name || '전문가',
          expertSpecialty: expert.specialty,
          consultationType: consultation.consultationType
        },
        priority: 'medium',
        isRead: i % 2 === 0
      });
      testNotifications.push(clientNotification);

      // 상태 변경 알림 (일부 상담에 대해)
      if (consultation.status === 'scheduled') {
        const statusNotification = await Notification.create({
          userId: user.id,
          type: 'consultation_status_update',
          title: '상담 일정 확정',
          message: `${expert.specialty || '상담'} 일정이 확정되었습니다.`,
          data: {
            consultationId: consultation.id,
            status: 'scheduled',
            expertName: expert.user?.name,
            expertSpecialty: expert.specialty,
            scheduledTime: consultation.scheduledTime
          },
          priority: 'medium',
          isRead: false
        });
        testNotifications.push(statusNotification);
      }

      if (consultation.status === 'completed') {
        const completionNotification = await Notification.create({
          userId: user.id,
          type: 'consultation_status_update',
          title: '상담 완료',
          message: `${expert.specialty || '상담'}이 완료되었습니다. 리뷰를 남겨주세요.`,
          data: {
            consultationId: consultation.id,
            status: 'completed',
            expertName: expert.user?.name,
            expertSpecialty: expert.specialty
          },
          priority: 'medium',
          isRead: false
        });
        testNotifications.push(completionNotification);
      }
    }

    // 추가 알림 데이터 (일반적인 시스템 알림)
    for (const expert of experts) {
      // 프로필 업데이트 알림
      const profileNotification = await Notification.create({
        userId: expert.userId,
        type: 'system',
        title: '프로필 업데이트 권장',
        message: '더 많은 상담 신청을 받기 위해 프로필을 업데이트해보세요.',
        data: {
          type: 'profile_update_suggestion'
        },
        priority: 'low',
        isRead: false
      });
      testNotifications.push(profileNotification);

      // 정산 관련 알림
      const payoutNotification = await Notification.create({
        userId: expert.userId,
        type: 'payout',
        title: '정산 완료',
        message: '이번 달 상담료 정산이 완료되었습니다.',
        data: {
          amount: 150000,
          period: '2024-01'
        },
        priority: 'medium',
        isRead: true
      });
      testNotifications.push(payoutNotification);
    }

    console.log(`테스트 데이터 생성 완료: 상담 ${testConsultations.length}건, 알림 ${testNotifications.length}건`);

    return NextResponse.json({
      success: true,
      message: '테스트 데이터가 성공적으로 생성되었습니다.',
      data: {
        consultations: testConsultations.length,
        notifications: testNotifications.length,
        details: {
          consultations: testConsultations.map(c => ({
            id: c.id,
            title: c.title,
            status: c.status,
            type: c.consultationType
          })),
          notifications: testNotifications.map(n => ({
            id: n.id,
            title: n.title,
            type: n.type,
            priority: n.priority,
            isRead: n.isRead
          }))
        }
      }
    });

  } catch (error) {
    console.error('테스트 데이터 생성 오류:', error);
    return NextResponse.json({
      success: false,
      message: '테스트 데이터 생성에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// 테스트 데이터 삭제 (개발용)
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    // 테스트 데이터만 삭제 (제목에 '테스트' 또는 '신청'이 포함된 것들)
    const deletedConsultations = await Consultation.destroy({
      where: {
        title: {
          [require('sequelize').Op.like]: '%신청%'
        }
      }
    });

    const deletedNotifications = await Notification.destroy({
      where: {
        type: ['consultation_request', 'consultation_request_sent', 'consultation_status_update', 'system', 'payout']
      }
    });

    return NextResponse.json({
      success: true,
      message: '테스트 데이터가 삭제되었습니다.',
      data: {
        deletedConsultations,
        deletedNotifications
      }
    });

  } catch (error) {
    console.error('테스트 데이터 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      message: '테스트 데이터 삭제에 실패했습니다.'
    }, { status: 500 });
  }
}