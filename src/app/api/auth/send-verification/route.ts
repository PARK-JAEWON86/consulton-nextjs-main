import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { validateEmail } from '@/lib/auth';
import { storeVerificationCode } from '@/utils/verificationStore';

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

    // 실제 프로덕션에서는 이메일 발송 서비스 사용
    // 예: SendGrid, AWS SES, Nodemailer 등
    console.log(`📧 인증 코드 발송: ${email} -> ${verificationCode}`);
    
    // 개발 환경에서는 콘솔에 코드 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 개발용 인증 코드: ${verificationCode}`);
    }

    // 실제 이메일 발송 로직 (예시)
    // await sendVerificationEmail(email, verificationCode);

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

// 실제 이메일 발송 함수 (구현 예시)
async function sendVerificationEmail(email: string, code: string) {
  // 실제 이메일 발송 서비스 연동
  // 예: SendGrid, AWS SES, Nodemailer 등
  
  const emailContent = {
    to: email,
    subject: 'ConsultOn 이메일 인증',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ConsultOn 이메일 인증</h2>
        <p>안녕하세요! ConsultOn 회원가입을 완료하기 위해 이메일 인증이 필요합니다.</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="color: #333; margin: 0;">인증 코드</h3>
          <h1 style="color: #007bff; margin: 10px 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>위 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>
        <p style="color: #666; font-size: 14px;">이 코드는 10분 후에 만료됩니다.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">이 이메일은 ConsultOn 회원가입 과정에서 발송되었습니다.</p>
      </div>
    `
  };

  // 실제 이메일 발송 로직 구현
  console.log('이메일 발송:', emailContent);
}