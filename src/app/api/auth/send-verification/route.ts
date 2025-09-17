import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { validateEmail } from '@/lib/auth';
import { storeVerificationCode } from '@/utils/verificationStore';
import { emailService } from '@/lib/email/sesService';

// 이메일 인증 코드 발송 API
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "등록되지 않은 이메일입니다." },
        { status: 404 }
      );
    }

    // 이미 인증된 사용자인지 확인
    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: "이미 인증된 이메일입니다." },
        { status: 400 }
      );
    }

    // 6자리 인증 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 인증 코드 저장 (10분 유효)
    storeVerificationCode(email.toLowerCase(), verificationCode, user.id, 10);

    // AWS SES를 통한 인증 이메일 발송
    const emailSent = await emailService.sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      console.error('이메일 발송 실패:', email);
      // 이메일 발송 실패 시에도 개발환경에서는 성공으로 처리
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: "인증 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." },
          { status: 500 }
        );
      }
    }

    console.log(`📧 인증 코드 발송 완료: ${email} -> ${verificationCode}`);

    return NextResponse.json({
      success: true,
      message: "인증 코드가 이메일로 발송되었습니다.",
      // 개발 환경에서만 코드 반환
      ...(process.env.NODE_ENV === 'development' && { 
        verificationCode,
        note: "개발 환경에서만 코드가 표시됩니다."
      })
    });

  } catch (error) {
    console.error("인증 코드 발송 오류:", error);
    return NextResponse.json(
      { error: "인증 코드 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

