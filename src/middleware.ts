import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

// 보호된 경로들
const protectedRoutes = [
  '/dashboard',
  '/api/user',
  '/api/expert',
  '/api/consultations',
  '/api/reviews',
  '/api/payment-methods',
  '/api/payment-history',
  '/api/notifications'
];

// 전문가 전용 경로들
const expertOnlyRoutes = [
  '/dashboard/expert',
  '/api/expert/dashboard',
  '/api/expert-stats',
  '/api/payouts'
];

// 관리자 전용 경로들
const adminOnlyRoutes = [
  '/admin',
  '/api/admin'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일이나 API 문서는 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 공개 리뷰 조회는 인증 없이 허용
  if (pathname.startsWith('/api/reviews') && request.nextUrl.searchParams.get('isPublic') === 'true') {
    return NextResponse.next();
  }

  // 전문가 프로필 조회는 공개 허용
  if (pathname.startsWith('/api/expert-profiles') ||
      pathname.startsWith('/api/experts-working') ||
      pathname.startsWith('/api/experts-simple') ||
      pathname.startsWith('/api/test-experts-debug')) {
    return NextResponse.next();
  }

  // 전문가 통계 조회 - 랭킹 목적은 공개 허용
  if (pathname.startsWith('/api/expert-stats') &&
      (request.nextUrl.searchParams.get('rankingType') ||
       request.nextUrl.searchParams.get('includeRanking'))) {
    return NextResponse.next();
  }

  // 인증이 필요한 경로인지 확인
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isExpertOnlyRoute = expertOnlyRoutes.some(route => pathname.startsWith(route));
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isExpertOnlyRoute || isAdminOnlyRoute) {
    // 인증된 사용자 확인
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser) {
      // 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 전문가 전용 경로 접근 권한 확인
    if (isExpertOnlyRoute && authUser.role !== 'expert' && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: '전문가 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 관리자 전용 경로 접근 권한 확인
    if (isAdminOnlyRoute && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 사용자 정보를 헤더에 추가 (선택적)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authUser.id.toString());
    requestHeaders.set('x-user-role', authUser.role);
    requestHeaders.set('x-user-email', authUser.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};