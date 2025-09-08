"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  MessageCircle, 
  Star, 
  Calendar,
  RefreshCw,
  Save,
  BarChart3
} from "lucide-react";

interface PopularCategoryStats {
  categoryId: string;
  categoryName: string;
  consultationCount: number;
  reviewCount: number;
  bookingCount: number;
  totalScore: number;
  rank: number;
}

export default function PopularCategoriesAdminPage() {
  const [popularStats, setPopularStats] = useState<PopularCategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editStats, setEditStats] = useState({
    consultationCount: 0,
    reviewCount: 0,
    bookingCount: 0
  });

  // 인기 카테고리 통계 로드
  useEffect(() => {
    loadPopularStats();
  }, []);

  const loadPopularStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories/popular?limit=20');
      const result = await response.json();
      
      if (result.success) {
        setPopularStats(result.data);
      } else {
        console.error('인기 카테고리 통계 로드 실패:', result.message);
      }
    } catch (error) {
      console.error('인기 카테고리 통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 재계산
  const recalculateStats = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/categories/popular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'recalculateAll'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadPopularStats();
        alert('모든 카테고리 통계가 재계산되었습니다.');
      } else {
        alert('통계 재계산에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('통계 재계산 실패:', error);
      alert('통계 재계산 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 특정 카테고리 통계 업데이트
  const updateCategoryStats = async () => {
    if (!selectedCategory) {
      alert('업데이트할 카테고리를 선택해주세요.');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch('/api/categories/popular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStats',
          stats: {
            categoryId: selectedCategory,
            ...editStats
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadPopularStats();
        alert('카테고리 통계가 업데이트되었습니다.');
        setSelectedCategory("");
        setEditStats({ consultationCount: 0, reviewCount: 0, bookingCount: 0 });
      } else {
        alert('통계 업데이트에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('통계 업데이트 실패:', error);
      alert('통계 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    const category = popularStats.find(stat => stat.categoryId === categoryId);
    if (category) {
      setSelectedCategory(categoryId);
      setEditStats({
        consultationCount: category.consultationCount,
        reviewCount: category.reviewCount,
        bookingCount: category.bookingCount
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            인기 카테고리 통계 관리
          </h1>
          <p className="text-gray-600">
            상담 수, 리뷰 수, 예약 수를 기반으로 한 카테고리 인기도를 관리합니다.
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 카테고리</p>
                <p className="text-2xl font-bold text-gray-900">{popularStats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 상담 수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {popularStats.reduce((sum, stat) => sum + stat.consultationCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 리뷰 수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {popularStats.reduce((sum, stat) => sum + stat.reviewCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 예약 수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {popularStats.reduce((sum, stat) => sum + stat.bookingCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={recalculateStats}
            disabled={isUpdating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            전체 통계 재계산
          </button>
        </div>

        {/* 카테고리 통계 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">카테고리별 통계</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상담 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    리뷰 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularStats.map((stat, index) => (
                  <tr key={stat.categoryId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {stat.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                        {stat.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                        {stat.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                        <span className={`font-semibold ${
                          stat.rank === 1 ? 'text-yellow-600' : 
                          stat.rank === 2 ? 'text-gray-600' : 
                          stat.rank === 3 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {stat.rank}위
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.categoryName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {stat.categoryId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.consultationCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.reviewCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.bookingCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stat.totalScore.toLocaleString()}점
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleCategorySelect(stat.categoryId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 통계 수정 모달 */}
        {selectedCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  카테고리 통계 수정
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담 수
                    </label>
                    <input
                      type="number"
                      value={editStats.consultationCount}
                      onChange={(e) => setEditStats(prev => ({
                        ...prev,
                        consultationCount: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      리뷰 수
                    </label>
                    <input
                      type="number"
                      value={editStats.reviewCount}
                      onChange={(e) => setEditStats(prev => ({
                        ...prev,
                        reviewCount: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      예약 수
                    </label>
                    <input
                      type="number"
                      value={editStats.bookingCount}
                      onChange={(e) => setEditStats(prev => ({
                        ...prev,
                        bookingCount: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={updateCategoryStats}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setEditStats({ consultationCount: 0, reviewCount: 0, bookingCount: 0 });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
