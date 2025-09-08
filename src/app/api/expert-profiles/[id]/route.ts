import { NextRequest, NextResponse } from 'next/server';

// GET: 특정 전문가 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // app-state에서 현재 저장된 전문가 프로필들 가져오기
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-profiles`);
    const result = await response.json();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 조회 실패' },
        { status: 500 }
      );
    }
    
    const profile = result.data.find((p: any) => p.id === id);
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error) {
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
    
    // app-state에서 현재 저장된 전문가 프로필들 가져오기
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-profiles`);
    const result = await response.json();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 업데이트 실패' },
        { status: 500 }
      );
    }
    
    const profileIndex = result.data.findIndex((p: any) => p.id === id);
    
    if (profileIndex === -1) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const updatedProfile = {
      ...result.data[profileIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // 메인 API에서 업데이트
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-profiles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        ...body
      })
    });
    
    if (!updateResponse.ok) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 업데이트 실패' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: '전문가 프로필이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-profiles`);
    const result = await response.json();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 삭제 실패' },
        { status: 500 }
      );
    }
    
    const profileIndex = result.data.findIndex((p: any) => p.id === id);
    
    if (profileIndex === -1) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 메인 API에서 삭제 (PATCH로 status를 'deleted'로 변경)
    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-profiles`, {
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
