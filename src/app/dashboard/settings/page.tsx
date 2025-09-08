"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ProfileSettings from "@/components/settings/ProfileSettings";
import CalendarIntegration from "@/components/settings/CalendarIntegration";
import PaymentSettings from "@/components/settings/PaymentSettings";
import AccountDeletion from "@/components/settings/AccountDeletion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Monitor, Sun, Moon } from "lucide-react";

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
  viewMode: "user" | "expert";
}

export default function SettingsPage() {
  const pathname = usePathname();
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    viewMode: "user"
  });
  
  // 앱 상태 로드
  useEffect(() => {
    const loadAppState = async () => {
      try {
        const response = await fetch('/api/app-state');
        const result = await response.json();
        if (result.success) {
          setAppState({
            isAuthenticated: result.data.isAuthenticated,
            user: result.data.user,
            viewMode: result.data.viewMode
          });
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

  // 현재 모드 결정 (Sidebar와 동일한 로직)
  const effectiveVariant: "user" | "expert" = useMemo(() => {
    if (viewMode) return viewMode;
    if (pathname.startsWith("/dashboard/expert")) return "expert";
    if (user?.expertLevel) return "expert";
    return "user";
  }, [viewMode, pathname, user]);

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
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">설정</h1>
              <p className="text-gray-600 mt-1">계정과 앱 설정을 관리하세요.</p>
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

          <div className="space-y-8">
            {/* 전문가 모드에서는 프로필 설정 섹션 숨김 */}
            {effectiveVariant === "user" && <ProfileSettings />}
            <PaymentSettings />
            <CalendarIntegration />
            <AccountDeletion />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
