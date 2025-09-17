import { NextRequest, NextResponse } from 'next/server';
import { Consultation, Notification, User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
import { Op } from 'sequelize';

// GET: 전문가의 상담 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('전문가 상담 신청 목록 API 호출됨');
    await initializeDatabase();

    // 인증된 사용자 확인 (전문가)
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'expert') {
      return NextResponse.json(
        { success: false, message: '전문가 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 전문가 정보 조회
    const expert = await Expert.findOne({
      where: { userId: authUser.id }
    });

    if (!expert) {
      return NextResponse.json(
        { success: false, message: '전문가 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const offset = (page - 1) * limit;

    // 쿼리 조건 설정
    const whereCondition: any = { expertId: expert.id };

    if (status) {
      whereCondition.status = status;
    }

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 상담 신청 목록 조회
    const result = await Consultation.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [
        ['status', 'ASC'], // pending을 먼저 보여주기 위해
        ['createdAt', 'DESC']
      ],
      limit,
      offset
    });

    // 상태별 통계 계산
    const statusStats = await Consultation.findAll({
      where: { expertId: expert.id },
      attributes: [
        'status',
        [Consultation.sequelize!.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const stats = {
      total: 0,
      pending: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    statusStats.forEach((stat: any) => {
      stats[stat.status as keyof typeof stats] = parseInt(stat.count);
      stats.total += parseInt(stat.count);
    });

    return NextResponse.json({
      success: true,
      data: {
        consultations: result.rows,
        total: result.count,
        stats,
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
    console.error('전문가 상담 신청 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '상담 신청 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 상담 신청 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    console.log('상담 신청 상태 업데이트 API 호출됨');
    await initializeDatabase();

    // 인증된 사용자 확인 (전문가)
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'expert') {
      return NextResponse.json(
        { success: false, message: '전문가 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 전문가 정보 조회
    const expert = await Expert.findOne({
      where: { userId: authUser.id }
    });

    if (!expert) {
      return NextResponse.json(
        { success: false, message: '전문가 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { consultationId, status, scheduledTime, notes } = body;

    // 필수 필드 검증
    if (!consultationId || !status) {
      return NextResponse.json(
        { success: false, message: '상담 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상담 신청 조회
    const consultation = await Consultation.findOne({
      where: {
        id: consultationId,
        expertId: expert.id
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, message: '해당 상담 신청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 업데이트 데이터 준비
    const updateData: any = { status };

    if (scheduledTime) {
      updateData.scheduledTime = new Date(scheduledTime);
    }

    if (notes) {
      updateData.notes = notes;
    }

    // 상담 신청 상태 업데이트
    await consultation.update(updateData);

    console.log('상담 신청 상태 업데이트 완료:', consultationId, status);

    // 상태 변경에 따른 알림 생성
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'scheduled':
        notificationTitle = '상담 일정 확정';
        notificationMessage = `${expert.specialty} 상담 일정이 확정되었습니다.`;
        if (scheduledTime) {
          const scheduleDate = new Date(scheduledTime);
          notificationMessage += ` 일정: ${scheduleDate.toLocaleDateString('ko-KR')} ${scheduleDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        break;
      case 'cancelled':
        notificationTitle = '상담 취소';
        notificationMessage = `${expert.specialty} 상담이 취소되었습니다.`;
        break;
      case 'in_progress':
        notificationTitle = '상담 시작';
        notificationMessage = `${expert.specialty} 상담이 시작되었습니다.`;
        break;
      case 'completed':
        notificationTitle = '상담 완료';
        notificationMessage = `${expert.specialty} 상담이 완료되었습니다. 리뷰를 남겨주세요.`;
        break;
    }

    if (notificationTitle && consultation.user) {
      await Notification.create({
        userId: consultation.user.id,
        type: 'consultation_status_update',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          consultationId: consultation.id,
          status,
          expertName: authUser.name,
          expertSpecialty: expert.specialty,
          scheduledTime: scheduledTime || null
        },
        priority: status === 'cancelled' ? 'high' : 'medium'
      });

      console.log('상태 변경 알림 생성 완료');
    }

    return NextResponse.json({
      success: true,
      message: '상담 신청 상태가 업데이트되었습니다.',
      data: {
        consultationId: consultation.id,
        status: consultation.status,
        scheduledTime: consultation.scheduledTime
      }
    });

  } catch (error) {
    console.error('상담 신청 상태 업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '상담 신청 상태 업데이트에 실패했습니다.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}