"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface User {
  id: string;
  email: string;
  name: string;
  role?: 'expert' | 'client' | 'admin';
  expertLevel?: string;
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 로드
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const isExpert = user?.role === 'expert';

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">알림</h1>
            <p className="text-gray-600 mt-1">
              {isExpert 
                ? "전문가 활동과 관련된 중요한 업데이트와 알림을 확인하세요."
                : "중요한 업데이트와 알림을 확인하세요."
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {isExpert ? (
              // 전문가 전용 알림 내용
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-medium text-gray-900">새로운 상담 요청</h3>
                  <p className="text-sm text-gray-600">김철수님이 상담을 요청했습니다.</p>
                  <p className="text-xs text-gray-500 mt-1">2시간 전</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-medium text-gray-900">리뷰 등록</h3>
                  <p className="text-sm text-gray-600">이영희님이 상담 후 리뷰를 남겼습니다.</p>
                  <p className="text-xs text-gray-500 mt-1">1일 전</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h3 className="font-medium text-gray-900">정산 완료</h3>
                  <p className="text-sm text-gray-600">이번 달 정산이 완료되었습니다.</p>
                  <p className="text-xs text-gray-500 mt-1">3일 전</p>
                </div>
              </div>
            ) : (
              // 일반 사용자 알림 내용
              <div className="text-center text-gray-500 py-8">
                <p>새로운 알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

