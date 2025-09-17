import { NextRequest, NextResponse } from 'next/server';
import { Notification, User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  try {
    console.log('테스트 알림 데이터 생성 API 호출됨');
    await initializeDatabase();

    // 기존 전문가 중 첫 번째 전문가 찾기
    const expert = await Expert.findOne({
      include: [{ model: User, as: 'user' }],
      limit: 1
    });

    if (!expert) {
      return NextResponse.json({
        success: false,
        message: '전문가 데이터가 없습니다. 먼저 전문가 계정을 생성해주세요.'
      }, { status: 400 });
    }

    console.log('전문가 찾음:', expert.id, expert.userId);

    // 테스트 알림 데이터 생성
    const notifications = [];

    // 1. 새로운 상담 신청 알림
    const notification1 = await Notification.create({
      userId: expert.userId,
      type: 'consultation_request',
      title: '새로운 상담 신청',
      message: '김철수님이 비즈니스 전략 상담을 신청했습니다.',
      data: {
        consultationId: 1,
        clientName: '김철수',
        clientEmail: 'kim@example.com',
        consultationType: 'video',
        urgency: 'high',
        message: '새로운 사업 아이디어에 대해 조언을 구하고 싶습니다.'
      },
      priority: 'high',
      isRead: false
    });
    notifications.push(notification1);
    console.log('알림 1 생성 완료');

    // 2. 긴급 상담 신청 알림
    const notification2 = await Notification.create({
      userId: expert.userId,
      type: 'consultation_request',
      title: '긴급 상담 신청',
      message: '박영희님이 마케팅 전략 상담을 신청했습니다.',
      data: {
        consultationId: 2,
        clientName: '박영희',
        clientEmail: 'park@example.com',
        consultationType: 'chat',
        urgency: 'high',
        message: '내일 프레젠테이션이 있어서 급히 조언이 필요합니다.'
      },
      priority: 'high',
      isRead: false
    });
    notifications.push(notification2);
    console.log('알림 2 생성 완료');

    // 3. 일반 상담 신청 알림
    const notification3 = await Notification.create({
      userId: expert.userId,
      type: 'consultation_request',
      title: '새로운 상담 신청',
      message: '이미나님이 진로 상담을 신청했습니다.',
      data: {
        consultationId: 3,
        clientName: '이미나',
        clientEmail: 'lee@example.com',
        consultationType: 'voice',
        urgency: 'medium',
        message: '현재 직업에서 이직을 고려하고 있어서 조언이 필요합니다.'
      },
      priority: 'medium',
      isRead: false
    });
    notifications.push(notification3);
    console.log('알림 3 생성 완료');

    // 4. 시스템 알림
    const notification4 = await Notification.create({
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
    notifications.push(notification4);
    console.log('알림 4 생성 완료');

    // 5. 정산 알림
    const notification5 = await Notification.create({
      userId: expert.userId,
      type: 'payout',
      title: '정산 완료',
      message: '이번 달 상담료 정산이 완료되었습니다.',
      data: {
        amount: 250000,
        period: '2024-01'
      },
      priority: 'medium',
      isRead: true
    });
    notifications.push(notification5);
    console.log('알림 5 생성 완료');

    console.log(`테스트 알림 데이터 생성 완료: ${notifications.length}건`);

    return NextResponse.json({
      success: true,
      message: '테스트 알림 데이터가 성공적으로 생성되었습니다.',
      data: {
        notifications: notifications.length,
        expertId: expert.id,
        expertUserId: expert.userId,
        details: notifications.map(n => ({
          id: n.id,
          title: n.title,
          type: n.type,
          priority: n.priority,
          isRead: n.isRead
        }))
      }
    });

  } catch (error) {
    console.error('테스트 알림 데이터 생성 오류:', error);
    return NextResponse.json({
      success: false,
      message: '테스트 알림 데이터 생성에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}