"use client";

import { useMemo, useState, useEffect } from "react";
import ProfileSettings from "@/components/settings/ProfileSettings";
import CalendarIntegration from "@/components/settings/CalendarIntegration";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Monitor, Sun, Moon, User, Star, CreditCard, FileText } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
  expertProfile?: any;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  viewMode: "user" | "expert";
}

export default function ExpertSettingsPage() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    viewMode: "expert"
  });
  
  // 앱 상태 로드
  useEffect(() => {
    const loadAppState = async () => {
      try {
        // 로컬 스토리지에서 먼저 로드
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        const storedViewMode = localStorage.getItem('consulton-viewMode');
        
        if (storedUser && storedAuth) {
          const user = JSON.parse(storedUser);
          const isAuthenticated = JSON.parse(storedAuth);
          const viewMode = storedViewMode ? JSON.parse(storedViewMode) : 'expert';
          
          setAppState({
            isAuthenticated,
            user,
            viewMode
          });
        } else {
          // API에서 로드
          const response = await fetch('/api/app-state');
          const result = await response.json();
          if (result.success) {
            setAppState({
              isAuthenticated: result.data.isAuthenticated,
              user: result.data.user,
              viewMode: result.data.viewMode
            });
          }
        }
      } catch (error) {
        console.error('앱 상태 로드 실패:', error);
      }
    };

    loadAppState();
  }, []);

  const { user, viewMode } = appState;
  
  // 테마 상태 관리
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("consulton-theme");
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
    return "light";
  });

  // 현재 모드 결정
  const effectiveVariant: "user" | "expert" = useMemo(() => {
    if (viewMode) return viewMode;
    if (user?.role === 'expert') return "expert";
    return "user";
  }, [viewMode, user]);

  // 테마 변경 함수
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    // 로컬 스토리지에 저장
    if (typeof window !== "undefined") {
      localStorage.setItem("consulton-theme", newTheme);
    }
    
    // 실제 테마 적용 (시스템 테마 고려)
    const applyTheme = (themeMode: "light" | "dark" | "system") => {
      if (themeMode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (themeMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    
    applyTheme(newTheme);
  };

  // 초기 테마 적용
  useEffect(() => {
    const applyTheme = (themeMode: "light" | "dark" | "system") => {
      if (themeMode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (themeMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    
    applyTheme(theme);
  }, [theme]);

  // 테마 옵션 정의
  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "라이트" },
    { value: "dark" as const, icon: Moon, label: "다크" },
    { value: "system" as const, icon: Monitor, label: "시스템" },
  ];

  // 전문가 전용 설정 메뉴
  const expertSettingsMenu = [
    { id: "profile", name: "프로필 관리", icon: User, path: "/dashboard/expert/profile" },
    { id: "reviews", name: "리뷰 관리", icon: Star, path: "/dashboard/expert/reviews" },
    { id: "payouts", name: "정산/출금", icon: CreditCard, path: "/dashboard/expert/payouts" },
    { id: "consultations", name: "상담내역", icon: FileText, path: "/dashboard/expert/consultations" },
  ];



  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전문가 설정</h1>
              <p className="text-gray-600 mt-1">전문가 계정과 앱 설정을 관리하세요.</p>
            </div>
            
            {/* 테마 선택기 */}
            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                const isActive = theme === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                    title={option.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 전문가 전용 설정 메뉴 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">전문가 전용 설정</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {expertSettingsMenu.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 text-center">{item.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            <ProfileSettings />
            <CalendarIntegration />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


