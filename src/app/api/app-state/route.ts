import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { User, Expert, ExpertProfile } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
// 더미 데이터 import 제거 - 실제 서비스에서는 불필요
// import { dummyUserProfile } from '@/data/dummy/users';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  category: string;
  summary?: string;
}

interface AppState {
  hasEnteredService: boolean;
  isAuthenticated: boolean;
  sidebarOpen: boolean;
  currentPage: string;
  viewMode: "user" | "expert";
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
    nickname?: string;
    credits: number;
    expertLevel: string | null;
    role?: 'expert' | 'client' | 'admin';
    expertProfile?: any;
    phone?: string;
    location?: string;
    bio?: string;
    interestedCategories?: string[];
    profileVisibility?: string;
    paymentMethods?: {
      cards: Array<{
        id: string;
        cardNumber: string;
        cardType: "credit" | "debit";
        cardBrand: string;
        expiryMonth: string;
        expiryYear: string;
        cardholderName: string;
        isDefault: boolean;
      }>;
    };
  } | null;
  chatHistory: ChatHistoryItem[];
}

// 메모리 기반 상태 저장 (실제 프로덕션에서는 Redis나 데이터베이스 사용 권장)
let appState: AppState = {
  hasEnteredService: false,
  isAuthenticated: false,
  sidebarOpen: false,
  currentPage: "/",
  viewMode: "user",
  user: null,
  chatHistory: [], // 빈 배열로 초기화
};

// GET: 현재 앱 상태 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 쿠키에서 인증 정보 확인
    const authUser = await getAuthenticatedUser(request);
    
    if (authUser) {
      // 인증된 사용자가 있으면 데이터베이스에서 최신 정보 조회
      const user = await User.findByPk(authUser.id, {
        include: [
          {
            model: Expert,
            as: 'expert',
            required: false,
            include: [
              {
                model: ExpertProfile,
                as: 'profile',
                required: false
              }
            ]
          }
        ]
      });

      if (user) {
        // 사용자 정보가 있으면 앱 상태 업데이트
        const userData = {
          id: user.id.toString(),
          email: user.email,
          name: user.name || '',
          credits: user.credits || 0,
          expertLevel: (user.expert as any)?.level || 'Tier 1 (Lv.1-99)',
          role: user.role,
          avatar: null,
          profileImage: null,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          // 전문가 프로필 정보 추가 (있는 경우)
          expertProfile: user.expert?.profile ? {
            id: user.expert.profile.id,
            name: user.name || '',
            specialty: user.expert.specialty || '',
            experience: user.expert.experience || 0,
            description: user.expert.profile.bio || '',
            education: user.expert.profile.education ? JSON.parse(user.expert.profile.education) : [],
            certifications: user.expert.profile.certifications ? JSON.parse(user.expert.profile.certifications) : [],
            specialties: user.expert.profile.specialties ? JSON.parse(user.expert.profile.specialties) : [],
            consultationTypes: user.expert.profile.consultationTypes ? JSON.parse(user.expert.profile.consultationTypes) : [],
            languages: user.expert.profile.languages ? JSON.parse(user.expert.profile.languages) : ['한국어'],
            hourlyRate: user.expert.profile.hourlyRate || 0,
            pricePerMinute: user.expert.profile.pricePerMinute || 0,
            totalSessions: user.expert.totalSessions || 0,
            avgRating: user.expert.rating || 0,
            level: 'Tier 1 (Lv.1-99)', // 기본값 (실제로는 API에서 계산된 레벨 사용)
            completionRate: user.expert.profile.completionRate || 95,
            repeatClients: Math.floor((user.expert.totalSessions || 0) * 0.3),
            responseTime: user.expert.profile.responseTime || '2시간 내',
            averageSessionDuration: user.expert.profile.averageSessionDuration || 60,
            reviewCount: Math.floor((user.expert.totalSessions || 0) * 0.7),
            cancellationPolicy: user.expert.profile.cancellationPolicy || '24시간 전 취소 가능',
            availability: user.expert.profile.availability ? JSON.parse(user.expert.profile.availability) : {
              monday: { available: false, hours: "09:00-18:00" },
              tuesday: { available: false, hours: "09:00-18:00" },
              wednesday: { available: false, hours: "09:00-18:00" },
              thursday: { available: false, hours: "09:00-18:00" },
              friday: { available: false, hours: "09:00-18:00" },
              saturday: { available: false, hours: "09:00-18:00" },
              sunday: { available: false, hours: "09:00-18:00" },
            },
            holidayPolicy: user.expert.profile.holidayPolicy || '',
            contactInfo: {
              phone: (user.expert.profile as any).phone || '',
              email: user.email,
              location: (user.expert.profile as any).location || '',
              website: (user.expert.profile as any).website || ''
            },
            profileImage: user.expert.profile.profileImage || null,
            portfolioFiles: [],
            socialProof: user.expert.profile.socialProof ? JSON.parse(user.expert.profile.socialProof) : {
              linkedIn: '',
              website: '',
              publications: []
            },
            portfolioItems: user.expert.profile.portfolioItems ? JSON.parse(user.expert.profile.portfolioItems) : [],
            consultationStyle: user.expert.profile.consultationStyle || '',
            profileViews: user.expert.profile.profileViews || 0,
            lastActiveAt: user.expert.profile.lastActiveAt || new Date(),
            joinedAt: user.expert.profile.createdAt || new Date(),
            reschedulePolicy: user.expert.profile.reschedulePolicy || '12시간 전 일정 변경 가능',
            pricingTiers: user.expert.profile.pricingTiers ? JSON.parse(user.expert.profile.pricingTiers) : [
              { duration: 30, price: 25000, description: "기본 상담" },
              { duration: 60, price: 45000, description: "상세 상담" },
              { duration: 90, price: 65000, description: "종합 상담" }
            ],
            targetAudience: user.expert.profile.targetAudience ? JSON.parse(user.expert.profile.targetAudience) : ['성인', '직장인', '학생'],
            isProfileComplete: (user.expert.profile as any).isComplete || false
          } : null
        };

        // 앱 상태 업데이트
        appState = {
          ...appState,
          isAuthenticated: true,
          viewMode: user.role === 'expert' ? 'expert' : 'user',
          user: userData
        };
      }
    }

    const response = NextResponse.json({ 
      success: true, 
      data: appState 
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // 캐싱 헤더 추가 (5초간 캐시)
    response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
    
    return response;
  } catch (error) {
    console.error('app-state API 오류:', error);
    // 에러 발생 시 기본 상태만 반환
    const fallbackResponse = NextResponse.json({ 
      success: true, 
      data: appState
    });
    
    fallbackResponse.headers.set('Access-Control-Allow-Origin', '*');
    fallbackResponse.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
    
    return fallbackResponse;
  }
}

// POST: 앱 상태 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'enterService':
        appState.hasEnteredService = true;
        break;
      
      case 'exitService':
        appState.hasEnteredService = false;
        break;
      
      case 'setAuthenticated':
        appState.isAuthenticated = data.isAuthenticated;
        break;
      
      case 'setSidebarOpen':
        appState.sidebarOpen = data.open;
        break;
      
      case 'setCurrentPage':
        appState.currentPage = data.page;
        break;
      
      case 'setViewMode':
        appState.viewMode = data.viewMode;
        break;
      
      case 'setUser':
        appState.user = data.user;
        break;
      
      case 'updateCredits':
        if (appState.user) {
          appState.user.credits = data.credits;
        }
        break;
      
      case 'addChatHistory':
        // 새로운 채팅 히스토리 추가
        const newChatItem: ChatHistoryItem = {
          id: data.id || Date.now().toString(),
          title: data.title,
          timestamp: new Date(data.timestamp || Date.now()),
          category: data.category || "일반",
          summary: data.summary
        };
        appState.chatHistory.unshift(newChatItem); // 최신 항목을 맨 위에 추가
        
        // 최대 50개까지만 유지
        if (appState.chatHistory.length > 50) {
          appState.chatHistory = appState.chatHistory.slice(0, 50);
        }
        break;
      
      case 'updateChatHistory':
        // 채팅 히스토리 항목 업데이트
        const updateIndex = appState.chatHistory.findIndex(item => item.id === data.id);
        if (updateIndex !== -1) {
          appState.chatHistory[updateIndex] = {
            ...appState.chatHistory[updateIndex],
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp) : appState.chatHistory[updateIndex].timestamp
          };
        }
        break;
      
      case 'deleteChatHistory':
        // 채팅 히스토리 항목 삭제
        appState.chatHistory = appState.chatHistory.filter(item => item.id !== data.id);
        break;
      
      case 'clearChatHistory':
        // 채팅 히스토리 전체 삭제
        appState.chatHistory = [];
        break;
      
      case 'logout':
        appState = {
          hasEnteredService: false,
          isAuthenticated: false,
          sidebarOpen: false,
          currentPage: "/",
          viewMode: "user",
          user: null,
          chatHistory: [],
        };
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션' },
          { status: 400 }
        );
    }

    const response = NextResponse.json({ 
      success: true, 
      data: appState,
      message: `${action} 완료`
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, error: '상태 업데이트 실패' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// PATCH: 부분 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 부분 업데이트
    appState = { ...appState, ...body };
    
    const response = NextResponse.json({ 
      success: true, 
      data: appState,
      message: '상태 업데이트 완료'
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, error: '상태 업데이트 실패' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// DELETE: 상태 초기화
export async function DELETE() {
  try {
    appState = {
      hasEnteredService: false,
      isAuthenticated: false,
      sidebarOpen: false,
      currentPage: "/",
      viewMode: "user",
      user: null,
      chatHistory: [],
    };
    
    const response = NextResponse.json({ 
      success: true, 
      message: '상태가 초기화되었습니다.' 
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, error: '상태 초기화 실패' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// OPTIONS: CORS preflight 요청 처리
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}
