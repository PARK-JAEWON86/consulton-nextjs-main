import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { 
  getAuthenticatedUser, 
  verifyPassword, 
  hashPassword, 
  validatePasswordStrength 
} from '@/lib/auth';

// 비밀번호 변경 API
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증된 사용자 확인
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // 입력 검증
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 새 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: '새 비밀번호가 요구사항을 만족하지 않습니다.',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await User.findByPk(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 새 비밀번호 해싱
    const hashedNewPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await user.update({ password: hashedNewPassword });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
