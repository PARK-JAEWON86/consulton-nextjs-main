import { NextRequest, NextResponse } from 'next/server';
import { Expert, ExpertProfile as ExpertProfileModel, User } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

// GET: 특정 전문가 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`🔍 개별 전문가 프로필 조회 요청: ID=${id}`);

    await initializeDatabase();

    // 특정 ID로 조회
    const expert = await Expert.findByPk(parseInt(id), {
      include: [
        {
          model: ExpertProfileModel,
          as: 'profile',
          required: false
        },
        {
          model: User,
          as: 'user',
          required: false
        }
      ]
    });

    if (!expert) {
      console.log(`❌ 전문가를 찾을 수 없음: ID=${id}`);
      return NextResponse.json(
        { success: false, error: '전문가 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const profileData = {
      id: expert.id.toString(),
      email: expert.user?.email || '',
      fullName: expert.profile?.fullName || expert.user?.name || '',
      jobTitle: expert.profile?.jobTitle || expert.specialty,
      specialty: expert.specialty,
      experienceYears: expert.experience,
      bio: expert.profile?.bio || '',
      keywords: expert.profile?.specialties ? JSON.parse(expert.profile.specialties) : [],
      consultationTypes: expert.consultationTypes ? JSON.parse(expert.consultationTypes) : [],
      availability: {}, // TODO: ExpertAvailability 테이블과 연동
      certifications: expert.profile?.certifications ? JSON.parse(expert.profile.certifications) : [],
      profileImage: expert.profile?.profileImage,
      status: 'approved', // TODO: 상태 관리 로직 추가
      createdAt: expert.createdAt.toISOString(),
      updatedAt: expert.updatedAt.toISOString(),
      rating: expert.avgRating || expert.rating,
      reviewCount: expert.reviewCount,
      totalSessions: expert.totalSessions,
      repeatClients: expert.profile?.repeatClients || 0,
      responseTime: expert.responseTime,
      languages: expert.languages ? JSON.parse(expert.languages) : [],
      location: expert.location,
      timeZone: expert.timeZone,
      hourlyRate: expert.pricePerMinute ? expert.pricePerMinute * 60 : null,
      pricePerCredit: expert.pricePerMinute ? Math.ceil(expert.pricePerMinute / 10) : 10
    };

    console.log(`✅ 전문가 프로필 조회 성공: ${profileData.fullName} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('❌ 개별 전문가 프로필 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '전문가 프로필 조회 실패' },
      { status: 500 }
    );
  }
}

// PUT: 전문가 프로필 전체 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log(`🔄 전문가 프로필 업데이트 시작: ID=${id}`, body);

    await initializeDatabase();

    // 전문가 레코드 찾기
    const expert = await Expert.findByPk(parseInt(id), {
      include: [
        {
          model: ExpertProfileModel,
          as: 'profile',
          required: false
        },
        {
          model: User,
          as: 'user',
          required: false
        }
      ]
    });

    if (!expert) {
      console.log(`❌ 전문가를 찾을 수 없음: ID=${id}`);
      return NextResponse.json(
        { success: false, error: '전문가를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Expert 테이블 업데이트
    const updateData: any = {
      specialty: body.specialty || expert.specialty,
      experience: body.experience || expert.experience,
      consultationTypes: body.consultationTypes ? JSON.stringify(body.consultationTypes) : expert.consultationTypes,
      languages: body.languages ? JSON.stringify(body.languages) : expert.languages,
      responseTime: body.responseTime || expert.responseTime,
      location: body.contactInfo?.location || expert.location
    };

    // 가격 관련 필드 처리 (크레딧 우선)
    if (body.pricePerCredit) {
      // pricePerCredit 필드는 DB에 없으므로 pricePerMinute로 변환하여 저장
      updateData.pricePerMinute = body.pricePerCredit * 10; // 1크레딧 = 10원
      updateData.hourlyRate = body.pricePerCredit * 10 * 60; // 시간당 요금
    } else if (body.pricePerMinute) {
      updateData.pricePerMinute = body.pricePerMinute;
      updateData.hourlyRate = body.pricePerMinute * 60;
    } else if (body.hourlyRate) {
      updateData.hourlyRate = body.hourlyRate;
      updateData.pricePerMinute = Math.ceil(body.hourlyRate / 60);
    }

    await expert.update(updateData);

    // ExpertProfile 테이블 업데이트 또는 생성
    let profile = expert.profile;
    const profileData = {
      fullName: body.name || expert.user?.name,
      jobTitle: body.specialty || expert.specialty,
      bio: body.description || '',
      specialties: body.specialties ? JSON.stringify(body.specialties) : JSON.stringify([]),
      certifications: body.certifications ? JSON.stringify(body.certifications) : JSON.stringify([]),
      profileImage: body.profileImage || null
    };

    if (profile) {
      await profile.update(profileData);
    } else {
      profile = await ExpertProfileModel.create({
        expertId: expert.id,
        ...profileData
      });
    }

    // User 테이블 업데이트 (이름)
    if (expert.user && body.name) {
      await expert.user.update({
        name: body.name
      });
    }

    console.log(`✅ 전문가 프로필 업데이트 완료: ID=${id}`);

    // 업데이트된 데이터 반환
    const updatedProfile = {
      id: expert.id.toString(),
      name: body.name || expert.user?.name,
      specialty: expert.specialty,
      experience: expert.experience,
      description: profile.bio,
      hourlyRate: expert.pricePerMinute * 60,
      pricePerMinute: expert.pricePerMinute,
      pricePerCredit: expert.pricePerMinute ? Math.ceil(expert.pricePerMinute / 10) : 10,
      consultationTypes: expert.consultationTypes ? JSON.parse(expert.consultationTypes) : [],
      languages: expert.languages ? JSON.parse(expert.languages) : [],
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: '전문가 프로필이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('❌ 전문가 프로필 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '전문가 프로필 업데이트 실패' },
      { status: 500 }
    );
  }
}

// DELETE: 전문가 프로필 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // app-state에서 현재 저장된 전문가 프로필들 가져오기
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/expert-profiles`);
    const result = await response.json();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 삭제 실패' },
        { status: 500 }
      );
    }
    
    const profileIndex = result.data.profiles.findIndex((p: any) => p.id === id);
    
    if (profileIndex === -1) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 메인 API에서 삭제 (PATCH로 status를 'deleted'로 변경)
    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/expert-profiles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: 'deleted'
      })
    });
    
    if (!deleteResponse.ok) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 삭제 실패' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '전문가 프로필이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '전문가 프로필 삭제 실패' },
      { status: 500 }
    );
  }
}
