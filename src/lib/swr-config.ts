// import { SWRConfiguration } from 'swr'; // swr 패키지가 설치되지 않음

// API fetcher 함수
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('API 요청 실패');
    // 에러 정보를 첨부
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  const data = await response.json();
  return data.success ? data.data : data;
};

// SWR 전역 설정 (swr 패키지가 설치되지 않아 주석 처리)
/*
export const swrConfig: SWRConfiguration = {
  fetcher,
  
  // 재시도 설정
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // 캐싱 설정
  dedupingInterval: 2000, // 2초 내 중복 요청 방지
  focusThrottleInterval: 5000, // 포커스 시 재검증 제한
  
  // 재검증 설정
  revalidateOnFocus: true, // 탭 포커스 시 재검증
  revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
  revalidateIfStale: true, // 오래된 데이터 재검증
  
  // 새로고침 간격 (기본적으로 비활성화, 필요한 곳에서 개별 설정)
  refreshInterval: 0,
  
  // 로딩 상태 관리
  loadingTimeout: 3000,
  
  // 에러 처리
  onError: (error, key) => {
    console.error('SWR 에러:', { key, error });
    
    // 특정 에러에 대한 처리
    if (error.status === 401) {
      // 인증 에러 처리
      console.log('인증 에러 - 로그인 페이지로 리다이렉트');
      // router.push('/auth/login');
    } else if (error.status === 403) {
      // 권한 에러 처리
      console.log('권한 에러 - 접근 거부');
    } else if (error.status >= 500) {
      // 서버 에러 처리
      console.log('서버 에러 - 나중에 다시 시도');
    }
  },
  
  // 성공 시 로깅 (개발 환경에서만)
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR 성공:', { key, dataType: typeof data });
    }
  },
};
*/

// 자주 사용되는 SWR 키 생성 함수들
export const swrKeys = {
  // 전문가 관련
  expertDashboard: (expertId: number, period?: string) => 
    `/api/expert/dashboard?expertId=${expertId}${period ? `&period=${period}` : ''}`,
  
  expertProfile: (expertId: number) => 
    `/api/experts/${expertId}`,
  
  // 사용자 관련
  userCredits: (userId: string) => 
    `/api/user/credits?userId=${userId}`,
  
  userProfile: (userId: string) => 
    `/api/user/profile?userId=${userId}`,
  
  // 상담 관련
  consultations: (params: {
    expertId?: number;
    clientId?: string;
    status?: string;
    method?: string;
    period?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return `/api/consultations?${searchParams.toString()}`;
  },
  
  // 상담 요청 관련
  consultationRequests: (expertId: number, status?: string) =>
    `/api/consultation-requests?expertId=${expertId}${status ? `&status=${status}` : ''}`,
};

// 캐시 무효화 헬퍼 함수들
export const invalidateCache = {
  // 전문가 대시보드 관련 캐시 무효화
  expertDashboard: (mutate: any, expertId: number) => {
    mutate((key: string) => key.startsWith(`/api/expert/dashboard?expertId=${expertId}`));
  },
  
  // 크레딧 관련 캐시 무효화
  userCredits: (mutate: any, userId: string) => {
    mutate(swrKeys.userCredits(userId));
  },
  
  // 상담 관련 캐시 무효화
  consultations: (mutate: any, expertId?: number, clientId?: string) => {
    mutate((key: string) => {
      return key.startsWith('/api/consultations') && 
             (expertId ? key.includes(`expertId=${expertId}`) : true) &&
             (clientId ? key.includes(`clientId=${clientId}`) : true);
    });
  },
};
