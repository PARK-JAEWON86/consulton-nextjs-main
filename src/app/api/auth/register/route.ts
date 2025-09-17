import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import {
  hashPassword,
  validateEmail,
  validatePasswordStrength,
  generateToken,
  AuthUser
} from '@/lib/auth';
import { emailService } from '@/lib/email/sesService';

// 회원가입 API
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, password, name, role = 'client' } = await request.json();

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
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

    // 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: '비밀번호가 요구사항을 만족하지 않습니다.',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // 역할 검증
    if (!['client', 'expert', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 사용자 역할입니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: role as 'client' | 'expert' | 'admin',
      isEmailVerified: false // 이메일 인증 필요
    });

    // JWT 토큰 생성 (이메일 인증 전이지만 로그인 허용)
    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || '',
      role: newUser.role
    };

    const token = await generateToken(authUser);

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified
      },
      requiresEmailVerification: true
    });

    // 쿠키에 토큰 설정
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 사용자 데이터도 쿠키에 설정
    response.cookies.set('user-data', JSON.stringify(authUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 회원가입 환영 이메일 발송 (비동기, 실패해도 회원가입은 성공으로 처리)
    emailService.sendWelcomeEmail(newUser.email, newUser.name || '회원')
      .then(() => console.log(`✅ 환영 이메일 발송 완료: ${newUser.email}`))
      .catch(error => console.error(`❌ 환영 이메일 발송 실패: ${newUser.email}`, error));

    return response;

  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
