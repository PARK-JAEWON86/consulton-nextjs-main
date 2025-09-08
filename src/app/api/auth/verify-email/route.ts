import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { 
  getVerificationCode, 
  deleteVerificationCode 
} from '@/utils/verificationStore';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "이메일과 인증 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // 저장된 인증 코드 확인
    const storedData = getVerificationCode(email);

    if (!storedData) {
      return NextResponse.json(
        { error: "인증 코드를 찾을 수 없습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 만료 시간 확인
    if (Date.now() > storedData.expires) {
      deleteVerificationCode(email);
      return NextResponse.json(
        { error: "인증 코드가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 인증 코드 확인
    if (storedData.code !== code) {
      return NextResponse.json(
        { error: "인증 코드가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 사용자 이메일 인증 상태 업데이트
    const user = await User.findByPk(storedData.userId);
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await user.update({ isEmailVerified: true });

    // 인증 성공 - 코드 삭제
    deleteVerificationCode(email);

    console.log(`✅ 이메일 인증 성공: ${email}`);

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
      verified: true
    });

  } catch (error) {
    console.error("이메일 인증 확인 오류:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
