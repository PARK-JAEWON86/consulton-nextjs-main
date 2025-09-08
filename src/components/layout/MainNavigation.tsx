"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface MainNavigationProps {}

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  currentCredits: number;
}

const MainNavigation = ({}: MainNavigationProps) => {
  const router = useRouter();
  const isToggleOn = true; // 항상 ON 상태로 고정
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    currentCredits: 0
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 앱 상태 로드
  useEffect(() => {
    const loadAppState = async () => {
      try {
        // 먼저 로컬 스토리지에서 확인
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          try {
            const user = JSON.parse(storedUser);
            const isAuth = JSON.parse(storedAuth);
            
            if (isAuth) {
              setAppState({
                isAuthenticated: true,
                user: user,
                currentCredits: user.credits || 0
              });
              return;
            }
          } catch (error) {
            console.error('로컬 스토리지 파싱 오류:', error);
          }
        }
        
        // API에서 앱 상태 로드 (백업)
        const response = await fetch('/api/app-state');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setAppState({
            isAuthenticated: result.data.isAuthenticated,
            user: result.data.user,
            currentCredits: result.data.user?.credits || 0
          });
        }
      } catch (error) {
        console.error('앱 상태 로드 실패:', error);
        // API 실패 시 기본 상태로 설정
        setAppState({
          isAuthenticated: false,
          user: null,
          currentCredits: 0
        });
      }
    };

    loadAppState();
    
    // 크레딧 정보 자동 업데이트 (30초마다)
    const creditsInterval = setInterval(updateCredits, 30000);
    
    return () => clearInterval(creditsInterval);
  }, []);

  // 크레딧 정보 실시간 업데이트
  const updateCredits = async () => {
    if (appState.isAuthenticated) {
      try {
        const response = await fetch('/api/credit-transactions?limit=1');
        const data = await response.json();
        
        if (data.success && data.data.summary) {
          setAppState(prev => ({
            ...prev,
            currentCredits: data.data.summary.currentBalance
          }));
        }
      } catch (error) {
        console.error('크레딧 정보 업데이트 실패:', error);
      }
    }
  };

  // localStorage 변경 감지하여 상태 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          const user = JSON.parse(storedUser);
          const isAuthenticated = JSON.parse(storedAuth);
          
          setAppState(prev => ({
            ...prev,
            isAuthenticated,
            user: isAuthenticated ? user : null,
            currentCredits: isAuthenticated ? (user.credits || 0) : 0
          }));
        } else {
          setAppState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            currentCredits: 0
          }));
        }
      } catch (error) {
        console.error('localStorage 변경 감지 시 파싱 오류:', error);
        // 파싱 오류 시 localStorage 정리
        localStorage.removeItem('consulton-user');
        localStorage.removeItem('consulton-auth');
        setAppState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          currentCredits: 0
        }));
      }
    };

    // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // 커스텀 이벤트 리스너 (같은 탭에서의 변경 감지)
      window.addEventListener('authStateChanged', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('authStateChanged', handleStorageChange);
      };
    }
  }, []);

  // 메뉴 외부 클릭 및 ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.hamburger-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      // API에 로그아웃 요청
      const response = await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', data: {} })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 로컬 스토리지 정리
      localStorage.removeItem('consulton-user');
      localStorage.removeItem('consulton-auth');
      localStorage.removeItem('consulton-viewMode');
      
      setAppState({ isAuthenticated: false, user: null, currentCredits: 0 });
      
      // 커스텀 이벤트 발생으로 다른 컴포넌트 상태 업데이트
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { type: 'logout', name: 'user' } 
      }));
      
      router.push("/auth/login");
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // API 실패 시에도 로컬 상태는 정리
      localStorage.removeItem('consulton-user');
      localStorage.removeItem('consulton-auth');
      localStorage.removeItem('consulton-viewMode');
      
      setAppState({ isAuthenticated: false, user: null, currentCredits: 0 });
      router.push("/auth/login");
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 토글 버튼 */}
          <div className="flex items-center space-x-4">
            {/* Consult 로고와 토글 버튼 */}
            <div className="flex items-center gap-2">
              {/* Consult 텍스트 */}
              <h1
                onClick={() => router.push("/")}
                className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer hover:text-blue-700 transition-colors"
              >
                Consult
              </h1>

              {/* 토글 버튼 - 항상 ON 상태로 고정 */}
              <div
                className="relative inline-flex shrink-0 rounded-full border-2 border-transparent h-8 w-16 bg-blue-600"
                role="status"
                aria-label="Always ON"
              >
                {/* ON/OFF 텍스트 */}
                <span
                  className={`absolute top-0 bottom-0 flex items-center font-black text-white text-xs z-20 transition-all duration-500 ${
                    isToggleOn ? "left-2.5" : "right-2.5"
                  }`}
                  style={{
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.3), 0 -1px 0 rgba(0,0,0,0.7)",
                  }}
                >
                  {isToggleOn ? "ON" : "OFF"}
                </span>

                {/* 토글 슬라이더 */}
                <span
                  className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 h-5 w-5 relative z-10 transition-transform duration-500 ${
                    isToggleOn ? "translate-x-9" : "translate-x-1"
                  }`}
                  style={{ marginTop: "4px" }}
                />
              </div>
            </div>
          </div>

                    {/* 중앙 네비게이션 */}
          <nav className="hidden lg:flex space-x-8">
            {appState.isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                홈
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                홈
              </button>
            )}
            <button
              onClick={() => router.push("/experts")}
              className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              전문가 찾기
            </button>
            <button
              onClick={() => router.push("/experts/become")}
              className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              전문가 되기
            </button>
            <button
              onClick={() => router.push("/community")}
              className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              커뮤니티
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 hover:from-purple-700 hover:via-blue-600 hover:to-cyan-500 px-3 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-1 group"
            >
              <svg
                className="w-5 h-5 text-purple-500 group-hover:text-blue-500 transition-colors duration-300 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              AI채팅상담
            </button>
          </nav>

          {/* 오른쪽 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 햄버거 메뉴 - 1024px 미만에서 표시 */}
            <div className="lg:hidden relative hamburger-menu-container">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="메뉴"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {appState.isAuthenticated ? (
                    <button
                      onClick={() => {
                        router.push("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      홈
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        router.push("/auth/login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      홈
                    </button>
                  )}
                  <button
                    onClick={() => {
                      router.push("/experts");
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    전문가 찾기
                  </button>
                  <button
                    onClick={() => {
                      router.push("/experts/become");
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    전문가 되기
                  </button>
                  <button
                    onClick={() => {
                      router.push("/community");
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    커뮤니티
                  </button>
                  <button
                    onClick={() => {
                      router.push("/chat");
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    AI채팅상담
                  </button>
                </div>
              )}
            </div>

            {appState.isAuthenticated ? (
              <>
                {/* 크레딧 표시 - 768px 미만에서는 아이콘+숫자만, 768px 이상에서는 전체 텍스트 */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <span className="hidden md:inline">크레딧: {appState.currentCredits.toLocaleString()}</span>
                  <span className="md:hidden">{appState.currentCredits.toLocaleString()}</span>
                </div>
                
                {/* 로그아웃 버튼 - 768px 미만에서는 아이콘만, 768px 이상에서는 텍스트 */}
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="로그아웃"
                >
                  <span className="hidden md:inline">로그아웃</span>
                  <svg 
                    className="md:hidden w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* 로그인 버튼 - 768px 미만에서는 아이콘만, 768px 이상에서는 텍스트 */}
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="로그인"
                >
                  <span className="hidden md:inline">로그인</span>
                  <svg 
                    className="md:hidden w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNavigation;
