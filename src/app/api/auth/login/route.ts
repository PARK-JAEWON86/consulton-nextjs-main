import { NextRequest, NextResponse } from 'next/server';
import { User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { 
  verifyPassword, 
  generateToken, 
  validateEmail,
  AuthUser 
} from '@/lib/auth';

// 로그인 API
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        {
          model: Expert,
          as: 'expert',
          required: false,
          attributes: ['id']
        }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 이메일 인증 확인 (선택적)
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { 
          error: '이메일 인증이 필요합니다.',
          requiresEmailVerification: true 
        },
        { status: 403 }
      );
    }

    // 마지막 로그인 시간 업데이트
    await user.update({ lastLoginAt: new Date() });

    // JWT 토큰 생성
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      expertId: user.expert?.id
    };

    const token = await generateToken(authUser);

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        expertId: user.expert?.id,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt
      }
    });

    // 쿠키에 토큰 설정
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 사용자 데이터도 쿠키에 설정 (선택적)
    response.cookies.set('user-data', JSON.stringify(authUser), {
      httpOnly: false, // 프론트엔드에서 접근 가능
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    return response;

  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { 
        error: '로그인 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
