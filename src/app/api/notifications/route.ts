import { NextRequest, NextResponse } from 'next/server';
import { Notification, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { Op } from 'sequelize';

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 검색 조건 설정
    const whereConditions: any = {
      userId: parseInt(userId)
    };

    // 타입별 필터링
    if (type) {
      whereConditions.type = type;
    }

    // 읽음 상태별 필터링
    if (isRead !== null) {
      whereConditions.isRead = isRead === 'true';
    }

    // 만료되지 않은 알림만 조회
    whereConditions[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    // 알림 조회
    const { rows: notifications, count: totalCount } = await Notification.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // 읽지 않은 알림 개수 계산 (단순화)
    const unreadCount = await Notification.count({
      where: {
        userId: parseInt(userId),
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        totalCount,
        unreadCount,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('알림 목록 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '알림 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 새 알림 생성
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { userId, type, title, message, data, priority = 'medium' } = body;

    // 필수 필드 검증
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 만료 시간 설정
    let expiresAt = null;
    if (type === 'consultation_request') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후 만료
    }

    // 새 알림 생성
    const newNotification = await Notification.create({
      userId: parseInt(userId),
      type,
      title,
      message,
      data,
      isRead: false,
      priority,
      expiresAt: expiresAt || undefined
    });

    // 생성된 알림을 사용자 정보와 함께 조회
    const notificationWithUser = await Notification.findByPk(newNotification.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: notificationWithUser
    });

  } catch (error) {
    console.error('알림 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { notificationId, userId, markAllAsRead = false } = body;

    if (markAllAsRead) {
      // 사용자의 모든 알림을 읽음 처리
      if (!userId) {
        return NextResponse.json(
          { success: false, error: '사용자 ID가 필요합니다.' },
          { status: 400 }
        );
      }

      const [updatedCount] = await Notification.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            userId: parseInt(userId),
            isRead: false
          }
        }
      );

      return NextResponse.json({
        success: true,
        data: { updatedCount }
      });

    } else {
      // 특정 알림 읽음 처리
      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: '알림 ID가 필요합니다.' },
          { status: 400 }
        );
      }

      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        return NextResponse.json(
          { success: false, error: '알림을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      // 업데이트된 알림을 사용자 정보와 함께 조회
      const updatedNotification = await Notification.findByPk(notificationId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return NextResponse.json({
        success: true,
        data: updatedNotification
      });
    }

  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    return NextResponse.json(
      { success: false, error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: '알림 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인 (선택사항)
    if (userId && notification.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, error: '알림을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    await notification.destroy();

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('알림 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '알림 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}