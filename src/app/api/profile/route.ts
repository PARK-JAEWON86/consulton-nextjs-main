import { NextRequest, NextResponse } from 'next/server';
import { User, UserCredits } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';

// 프로필 데이터 타입
interface ProfileData {
  id: number;
  firstName: string;
  displayName: string;
  email: string;
  phone: string;
  location?: string;
  birthDate?: string;
  bio?: string;
  profileImage?: string;
  interestedCategories: string[];
  profileVisibility: "public" | "experts" | "private";
  credits: number;
  totalConsultations: number;
  joinDate: string;
}

// GET: 프로필 정보 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증된 사용자 정보 가져오기
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 데이터베이스에서 사용자 정보 조회
    const user = await User.findByPk(authUser.id, {
      include: [
        {
          model: UserCredits,
          as: 'credits',
          required: false
        }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 크레딧 정보 계산
    const totalCredits = user.credits 
      ? (user.credits.aiChatTotal - user.credits.aiChatUsed) + 
        (user.credits.purchasedTotal - user.credits.purchasedUsed)
      : 0;

    // 프로필 데이터 구성
    const profile: ProfileData = {
      id: user.id,
      firstName: user.name || '',
      displayName: user.nickname || user.name || '',
      email: user.email,
      phone: user.phone || '',
      location: user.location || undefined,
      birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : undefined,
      bio: user.bio || undefined,
      profileImage: user.profileImage || undefined,
      interestedCategories: user.interestedCategories || [],
      profileVisibility: user.profileVisibility || 'experts',
      credits: totalCredits,
      totalConsultations: 0, // TODO: 실제 상담 수 조회
      joinDate: user.createdAt.toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '프로필 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 프로필 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 인증된 사용자 정보 가져오기
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      displayName,
      email,
      phone,
      location,
      birthDate,
      bio,
      profileImage,
      interestedCategories,
      profileVisibility
    } = body;

    // 입력값 검증
    if (!firstName || !displayName || !email) {
      return NextResponse.json(
        { success: false, message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (한국 전화번호)
    if (phone) {
      const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { success: false, message: '올바른 전화번호 형식이 아닙니다.' },
          { status: 400 }
        );
      }
    }

    // 프로필 공개설정 검증
    const validVisibilityOptions = ["public", "experts", "private"];
    if (!validVisibilityOptions.includes(profileVisibility)) {
      return NextResponse.json(
        { success: false, message: '올바르지 않은 공개설정입니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 업데이트
    const user = await User.findByPk(authUser.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이메일 중복 확인 (다른 사용자가 사용 중인지)
    if (email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: '이미 사용 중인 이메일입니다.' },
          { status: 409 }
        );
      }
    }

    // 프로필 정보 업데이트
    await user.update({
      name: firstName,
      nickname: displayName,
      email: email.toLowerCase(),
      phone: phone || null,
      location: location || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      bio: bio || null,
      profileImage: profileImage || null,
      interestedCategories: interestedCategories || null,
      profileVisibility: profileVisibility
    });

    // 업데이트된 프로필 정보 조회
    const updatedUser = await User.findByPk(authUser.id, {
      include: [
        {
          model: UserCredits,
          as: 'credits',
          required: false
        }
      ]
    });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: '업데이트된 사용자 정보를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    // 크레딧 정보 계산
    const totalCredits = updatedUser.credits 
      ? (updatedUser.credits.aiChatTotal - updatedUser.credits.aiChatUsed) + 
        (updatedUser.credits.purchasedTotal - updatedUser.credits.purchasedUsed)
      : 0;

    // 업데이트된 프로필 데이터 구성
    const updatedProfile: ProfileData = {
      id: updatedUser.id,
      firstName: updatedUser.name || '',
      displayName: updatedUser.nickname || updatedUser.name || '',
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      location: updatedUser.location || undefined,
      birthDate: updatedUser.birthDate ? updatedUser.birthDate.toISOString().split('T')[0] : undefined,
      bio: updatedUser.bio || undefined,
      profileImage: updatedUser.profileImage || undefined,
      interestedCategories: updatedUser.interestedCategories || [],
      profileVisibility: updatedUser.profileVisibility || 'experts',
      credits: totalCredits,
      totalConsultations: 0, // TODO: 실제 상담 수 조회
      joinDate: updatedUser.createdAt.toISOString().split('T')[0]
    };

    // 프로필 공개설정에 따른 제약사항 체크
    if (profileVisibility === "private") {
      console.log('비공개 설정: 커뮤니티 활동 및 전문가 매칭에 제약 적용 필요');
      // TODO: 비공개 설정 시 관련 기능 제한 로직 구현
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      data: updatedProfile
    });
  } catch (error) {
    console.error('프로필 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, message: '프로필 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
