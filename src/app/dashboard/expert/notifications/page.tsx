"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
}

export default function ExpertNotificationsPage() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
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
            user: result.data.user
          });
        }
      } catch (error) {
        console.error('앱 상태 로드 실패:', error);
      }
    };

    loadAppState();
  }, []);



  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">전문가 알림</h1>
            <p className="text-gray-600 mt-1">
              전문가 계정의 중요한 업데이트와 알림을 확인하세요.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-gray-500 py-8">
              <p>새로운 전문가 알림이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
