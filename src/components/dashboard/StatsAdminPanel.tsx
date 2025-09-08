"use client";

import { useState, useEffect } from "react";
import StatsManager from "@/utils/statsManager";

interface PlatformStats {
  totalUsers: number;
  totalExperts: number;
  totalConsultations: number;
  totalRevenue: number;
  averageConsultationRating: number;
  averageMatchingTimeMinutes: number;
  monthlyActiveUsers: number;
  monthlyActiveExperts: number;
  consultationCompletionRate: number;
  userSatisfactionScore: number;
  lastUpdated: string;
}

interface MatchingRecord {
  id: string;
  userId: string;
  expertId: string;
  matchingTimeMinutes: number;
  createdAt: string;
}

interface StatsState {
  stats: PlatformStats;
  matchingRecords: MatchingRecord[];
  isLoading: boolean;
}

export default function StatsAdminPanel() {
  const [statsState, setStatsState] = useState<StatsState>({
    stats: {
      totalUsers: 0,
      totalExperts: 0,
      totalConsultations: 0,
      totalRevenue: 0,
      averageConsultationRating: 0,
      averageMatchingTimeMinutes: 0,
      monthlyActiveUsers: 0,
      monthlyActiveExperts: 0,
      consultationCompletionRate: 0,
      userSatisfactionScore: 0,
      lastUpdated: new Date().toISOString()
    },
    matchingRecords: [],
    isLoading: false
  });

  const [showDetails, setShowDetails] = useState(false);

  // 통계 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsState(prev => ({ ...prev, isLoading: true }));
        const response = await fetch('/api/stats');
        const result = await response.json();
        if (result.success) {
          setStatsState({
            stats: result.data.stats,
            matchingRecords: result.data.matchingRecords || [],
            isLoading: false
          });
        }
      } catch (error) {
        console.error('통계 로드 실패:', error);
        setStatsState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, []);

  const { stats, matchingRecords, isLoading } = statsState;

  const handleTestUserRegistration = async () => {
    await StatsManager.handleUserRegistration(`test_user_${Date.now()}`);
  };

  const handleTestExpertRegistration = async () => {
    await StatsManager.handleExpertRegistration(`test_expert_${Date.now()}`);
  };

  const handleTestConsultationCompleted = async () => {
    await StatsManager.handleConsultationCompleted(`test_consultation_${Date.now()}`);
  };

  const handleTestMatching = async () => {
    const userId = `test_user_${Date.now()}`;
    const expertId = `test_expert_${Date.now()}`;
    const matchingTime = Math.floor(Math.random() * 15) + 1; // 1-15분 랜덤
    
    await StatsManager.handleMatchingCompleted(userId, expertId, matchingTime);
  };

  const handleResetStats = async () => {
    if (confirm('정말로 모든 통계를 초기화하시겠습니까?')) {
      try {
        setStatsState(prev => ({ ...prev, isLoading: true }));
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resetStats', data: {} })
        });
        const result = await response.json();
        if (result.success) {
          setStatsState({
            stats: result.data.stats,
            matchingRecords: result.data.matchingRecords || [],
            isLoading: false
          });
        }
      } catch (error) {
        console.error('통계 초기화 실패:', error);
        setStatsState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">통계 관리 패널</h2>
      
      {/* 현재 통계 표시 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">상담 완료</h3>
          <p className="text-2xl font-bold text-blue-700">
            {stats.totalConsultations.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">평균 매칭시간</h3>
          <p className="text-2xl font-bold text-green-700">
            {stats.averageMatchingTimeMinutes}분
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900">전문가 수</h3>
          <p className="text-2xl font-bold text-purple-700">
            {stats.totalExperts.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900">총 이용자</h3>
          <p className="text-2xl font-bold text-orange-700">
            {stats.totalUsers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 테스트 버튼들 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">테스트 액션</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleTestUserRegistration}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
          >
            사용자 등록 +1
          </button>
          
          <button
            onClick={handleTestExpertRegistration}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
          >
            전문가 등록 +1
          </button>
          
          <button
            onClick={handleTestConsultationCompleted}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
          >
            상담 완료 +1
          </button>
          
          <button
            onClick={handleTestMatching}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
          >
            매칭 완료 (랜덤시간)
          </button>
        </div>
      </div>

      {/* 상세 정보 토글 */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
        </button>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">마지막 업데이트</h4>
            <p className="text-gray-600">
              {new Date(stats.lastUpdated).toLocaleString('ko-KR')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              매칭 기록 ({matchingRecords.length}개)
            </h4>
            {matchingRecords.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                {matchingRecords.slice(-10).map((record) => (
                  <div key={record.id} className="text-sm text-gray-600 py-1">
                    {record.matchingTimeMinutes}분 - {new Date(record.createdAt).toLocaleString('ko-KR')}
                  </div>
                ))}
                {matchingRecords.length > 10 && (
                  <p className="text-sm text-gray-500 italic">
                    최근 10개만 표시 중...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">매칭 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 위험 구역 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-red-600 mb-4">위험 구역</h3>
        <button
          onClick={handleResetStats}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md"
        >
          모든 통계 초기화
        </button>
        <p className="text-sm text-gray-500 mt-2">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
    </div>
  );
}
