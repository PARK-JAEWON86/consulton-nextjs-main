import { NextRequest, NextResponse } from 'next/server';
import { PaymentMethod, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

// GET: 사용자의 결제 수단 목록 조회
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

    // 사용자 ID를 숫자로 변환 (DB의 userId는 INTEGER)
    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 사용자 존재 확인
    const userExists = await User.findByPk(numericUserId);
    if (!userExists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 결제 수단 목록 조회
    const paymentMethods = await PaymentMethod.findAll({
      where: { userId: numericUserId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return NextResponse.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('결제 수단 조회 실패:', error);
    return NextResponse.json(
      { error: '결제 수단을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 결제 수단 추가
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
    const { type, name, last4, bankName, isDefault = false, expiryDate } = body;

    // 필수 필드 검증
    if (!type || !name) {
      return NextResponse.json(
        { error: '결제 수단 타입과 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 타입 검증
    if (!['card', 'bank'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 수단 타입입니다.' },
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

    // 기본 결제 수단으로 설정하는 경우, 기존 기본 결제 수단 해제
    if (isDefault) {
      await PaymentMethod.update(
        { isDefault: false },
        { where: { userId: numericUserId, isDefault: true } }
      );
    }

    // 새 결제 수단 생성
    const newPaymentMethod = await PaymentMethod.create({
      userId: numericUserId,
      type,
      name,
      last4,
      bankName,
      isDefault,
      expiryDate
    });

    return NextResponse.json({
      success: true,
      data: newPaymentMethod
    });

  } catch (error) {
    console.error('결제 수단 추가 실패:', error);
    return NextResponse.json(
      { error: '결제 수단 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 결제 수단 수정
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
    const { id, type, name, last4, bankName, isDefault, expiryDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: '결제 수단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 결제 수단 존재 및 소유권 확인
    const paymentMethod = await PaymentMethod.findOne({
      where: { id, userId: numericUserId }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: '결제 수단을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기본 결제 수단으로 설정하는 경우, 기존 기본 결제 수단 해제
    if (isDefault && !paymentMethod.isDefault) {
      await PaymentMethod.update(
        { isDefault: false },
        { where: { userId: numericUserId, isDefault: true } }
      );
    }

    // 결제 수단 업데이트
    await paymentMethod.update({
      type: type || paymentMethod.type,
      name: name || paymentMethod.name,
      last4: last4 !== undefined ? last4 : paymentMethod.last4,
      bankName: bankName !== undefined ? bankName : paymentMethod.bankName,
      isDefault: isDefault !== undefined ? isDefault : paymentMethod.isDefault,
      expiryDate: expiryDate !== undefined ? expiryDate : paymentMethod.expiryDate
    });

    return NextResponse.json({
      success: true,
      data: paymentMethod
    });

  } catch (error) {
    console.error('결제 수단 수정 실패:', error);
    return NextResponse.json(
      { error: '결제 수단 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 결제 수단 삭제
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '결제 수단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId.replace('client_', '').replace('expert_', ''));
    
    // 결제 수단 존재 및 소유권 확인
    const paymentMethod = await PaymentMethod.findOne({
      where: { id: parseInt(id), userId: numericUserId }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: '결제 수단을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 결제 수단 삭제
    await paymentMethod.destroy();

    return NextResponse.json({
      success: true,
      message: '결제 수단이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('결제 수단 삭제 실패:', error);
    return NextResponse.json(
      { error: '결제 수단 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}