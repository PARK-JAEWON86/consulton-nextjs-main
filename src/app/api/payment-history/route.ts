import { NextRequest, NextResponse } from 'next/server';
import { Payment, User, PaymentMethod, Consultation } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { Op } from 'sequelize';

// GET: 사용자의 결제 내역 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증 확인 (쿠키 기반)
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.email;
    } catch {
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 처리
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const offset = (page - 1) * limit;
    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 사용자 존재 확인
    const userExists = await User.findByPk(numericUserId);
    if (!userExists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 검색 조건 설정
    const whereConditions: any = {
      userId: numericUserId
    };

    // 타입별 필터링
    if (type) {
      whereConditions.type = type;
    }

    // 상태별 필터링
    if (status) {
      whereConditions.status = status;
    }

    // 날짜 범위 필터링
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereConditions.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // 결제 내역 조회
    const { rows: payments, count: totalCount } = await Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          required: false,
          attributes: ['id', 'type', 'name', 'last4', 'bankName']
        },
        {
          model: Consultation,
          as: 'consultation',
          required: false,
          attributes: ['id', 'title', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // 통계 계산
    const totalAmount = await Payment.sum('amount', {
      where: { userId: numericUserId, status: 'completed' }
    });

    const monthlyAmount = await Payment.sum('amount', {
      where: {
        userId: numericUserId,
        status: 'completed',
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1
        },
        statistics: {
          totalAmount: totalAmount || 0,
          monthlyAmount: monthlyAmount || 0
        }
      }
    });

  } catch (error) {
    console.error('결제 내역 조회 실패:', error);
    return NextResponse.json(
      { error: '결제 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 결제 내역 생성 (크레딧 충전 등)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증 확인
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.email;
    } catch {
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      amount, 
      description, 
      type = 'topup', 
      paymentMethodId, 
      consultationId,
      credits 
    } = body;

    // 필수 필드 검증
    if (!amount || !description) {
      return NextResponse.json(
        { error: '금액과 설명은 필수입니다.' },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 사용자 존재 확인
    const userExists = await User.findByPk(numericUserId);
    if (!userExists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 결제 수단 확인 (제공된 경우)
    if (paymentMethodId) {
      const paymentMethod = await PaymentMethod.findOne({
        where: { id: paymentMethodId, userId: numericUserId }
      });
      if (!paymentMethod) {
        return NextResponse.json(
          { error: '결제 수단을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 상담 확인 (제공된 경우)
    if (consultationId) {
      const consultation = await Consultation.findOne({
        where: { id: consultationId, userId: numericUserId }
      });
      if (!consultation) {
        return NextResponse.json(
          { error: '상담을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 새 결제 내역 생성
    const newPayment = await Payment.create({
      userId: numericUserId,
      amount,
      description,
      paymentType: type,
      status: 'completed', // 기본적으로 완료 상태로 생성
      paymentMethod: paymentMethodId ? `method_${paymentMethodId}` : 'card',
      consultationId: consultationId ? parseInt(consultationId) : undefined,
      // credits는 별도 테이블에서 관리
    });

    // 생성된 결제 내역을 관련 정보와 함께 조회
    const paymentWithDetails = await Payment.findByPk(newPayment.id, {
      include: [
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          required: false,
          attributes: ['id', 'type', 'name', 'last4', 'bankName']
        },
        {
          model: Consultation,
          as: 'consultation',
          required: false,
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: paymentWithDetails
    });

  } catch (error) {
    console.error('결제 내역 생성 실패:', error);
    return NextResponse.json(
      { error: '결제 내역 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 결제 내역 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증 확인
    const authToken = request.cookies.get('auth-token')?.value;
    const userData = request.cookies.get('user-data')?.value;
    
    if (!authToken || !userData) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.email;
    } catch {
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: '결제 내역 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 결제 내역 존재 및 소유권 확인
    const payment = await Payment.findOne({
      where: { id: parseInt(id), userId: numericUserId }
    });

    if (!payment) {
      return NextResponse.json(
        { error: '결제 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 결제 내역 업데이트
    await payment.update({
      status: status || payment.status,
      description: description || payment.description
    });

    // 업데이트된 결제 내역을 관련 정보와 함께 조회
    const updatedPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          required: false,
          attributes: ['id', 'type', 'name', 'last4', 'bankName']
        },
        {
          model: Consultation,
          as: 'consultation',
          required: false,
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: updatedPayment
    });

  } catch (error) {
    console.error('결제 내역 업데이트 실패:', error);
    return NextResponse.json(
      { error: '결제 내역 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}