import { NextRequest, NextResponse } from 'next/server';
import { Consultation, Notification, User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('상담 신청 API 호출됨');
    await initializeDatabase();

    // 인증된 사용자 확인
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      expertId,
      consultationType,
      preferredDate,
      preferredTime,
      message,
      clientName,
      clientEmail,
      urgency
    } = body;

    // 필수 필드 검증
    if (!expertId || !consultationType || !message) {
      return NextResponse.json(
        { success: false, message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 전문가 존재 확인
    const expert = await Expert.findByPk(expertId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!expert) {
      return NextResponse.json(
        { success: false, message: '전문가를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 스케줄 시간 설정 (선택적)
    let scheduledTime: Date | undefined = undefined;
    if (preferredDate && preferredTime) {
      scheduledTime = new Date(`${preferredDate}T${preferredTime}:00`);
    }

    // 상담 신청 생성
    const consultation = await Consultation.create({
      userId: authUser.id,
      expertId: parseInt(expertId),
      categoryId: 1, // 기본 카테고리 (추후 수정 가능)
      title: `${expert.specialty} 상담 신청`,
      description: message,
      consultationType,
      status: 'pending',
      scheduledTime,
      duration: 60, // 기본 60분
      price: expert.hourlyRate || 50000, // 전문가 시간당 요금 또는 기본값
      expertLevel: expert.experience || 1,
      topic: message.substring(0, 100), // 메시지의 앞 100자를 주제로 사용
      notes: JSON.stringify({
        urgency,
        clientName,
        clientEmail,
        preferredDate,
        preferredTime
      })
    });

    console.log('상담 신청 생성 완료:', consultation.id);

    // 전문가에게 알림 생성
    await Notification.create({
      userId: expert.user?.id || expert.userId,
      type: 'consultation_request',
      title: '새로운 상담 신청',
      message: `${authUser.name || clientName}님이 ${expert.specialty} 상담을 신청했습니다.`,
      data: {
        consultationId: consultation.id,
        clientName: authUser.name || clientName,
        clientEmail: authUser.email || clientEmail,
        consultationType,
        urgency,
        preferredDate,
        preferredTime,
        message: message.substring(0, 200)
      },
      priority: urgency === 'high' ? 'high' : urgency === 'low' ? 'low' : 'medium'
    });

    console.log('전문가 알림 생성 완료');

    // 신청자에게도 확인 알림 생성
    await Notification.create({
      userId: authUser.id,
      type: 'consultation_request_sent',
      title: '상담 신청 완료',
      message: `${expert.user?.name || '전문가'}님께 상담 신청이 완료되었습니다. 24시간 내에 연락드릴 예정입니다.`,
      data: {
        consultationId: consultation.id,
        expertName: expert.user?.name || '전문가',
        expertSpecialty: expert.specialty,
        consultationType,
        urgency
      },
      priority: 'medium'
    });

    console.log('신청자 알림 생성 완료');

    return NextResponse.json({
      success: true,
      message: '상담 신청이 완료되었습니다.',
      data: {
        consultationId: consultation.id,
        status: consultation.status
      }
    });

  } catch (error) {
    console.error('상담 신청 처리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '상담 신청 처리 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET: 사용자의 상담 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    // 인증된 사용자 확인
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // 쿼리 조건 설정
    const whereCondition: any = { userId: authUser.id };
    if (status) {
      whereCondition.status = status;
    }

    // 상담 신청 목록 조회
    const result = await Consultation.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Expert,
          as: 'expert',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: {
        consultations: result.rows,
        total: result.count,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(result.count / limit),
          hasNext: page * limit < result.count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('상담 신청 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '상담 신청 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}