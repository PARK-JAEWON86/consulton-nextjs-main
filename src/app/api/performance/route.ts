import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getPerformanceReport } from '@/lib/db/performanceMonitor';

/**
 * 데이터베이스 성능 모니터링 API
 * 관리자만 접근 가능
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 성능 리포트 생성
    const report = getPerformanceReport();

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('성능 모니터링 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '성능 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 성능 메트릭 초기화 (관리자만)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 메트릭 초기화
    const { performanceMonitor } = await import('@/lib/db/performanceMonitor');
    performanceMonitor.clearMetrics();

    return NextResponse.json({
      success: true,
      message: '성능 메트릭이 초기화되었습니다.'
    });

  } catch (error) {
    console.error('성능 메트릭 초기화 오류:', error);
    return NextResponse.json(
      { success: false, message: '메트릭 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
