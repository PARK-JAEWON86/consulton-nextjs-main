"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  User,
  Calendar,
  Search,
  LogIn,
  Bot,
  CheckCircle,
  Target,
  CalendarDays,
  CheckSquare,
} from "lucide-react";
import ServiceLayout from "@/components/layout/ServiceLayout";
import { ConsultationSummary } from "@/types";

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

interface ApiResponse {
  success: boolean;
  data: ConsultationSummary[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [summaries, setSummaries] = useState<ConsultationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [visitedSummaries, setVisitedSummaries] = useState<string[]>([]);
  const itemsPerPage = 5;

  // 방문한 상담 요약 목록 로드
  useEffect(() => {
    try {
      const visited = JSON.parse(localStorage.getItem('visited-consultation-summaries') || '[]');
      setVisitedSummaries(visited);
    } catch (error) {
      console.error('방문 기록 로드 실패:', error);
    }
  }, []);

  // 방문한 상담 요약인지 확인
  const isVisited = (summaryId: string) => {
    return visitedSummaries.includes(summaryId);
  };

  // 방문하지 않은 상담 요약만 필터링
  const getUnvisitedCount = (status: string) => {
    return summaries.filter(s => (s as any).status === status && !isVisited(s.id.toString())).length;
  };

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

  const { user, isAuthenticated } = appState;

  // 상담 요약 데이터 로드 함수
  const loadSummaries = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchTerm,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        userId: user?.id || ''
      });
      
      const response = await fetch(`/api/consultation-summaries?${params}`);
      const result: ApiResponse = await response.json();
      
      console.log('API 응답:', result); // 디버깅용 로그
      
      if (result.success) {
        setSummaries(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalCount(result.pagination.totalCount);
        }
      } else {
        setError(result.message || '상담 요약을 불러오는데 실패했습니다.');
      }
          } catch (error) {
        console.error('상담 요약 로드 실패:', error);
        setError('상담 요약을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }, [isAuthenticated, user, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // 상담 요약 데이터 로드
  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user?.id) {
        loadSummaries();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user?.id, loadSummaries]);

  const filteredSummaries = summaries.filter((summary) => {
    const s = summary as any;
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ai_generated":
        return "bg-blue-100 text-blue-800";
      case "expert_reviewed":
        return "bg-purple-100 text-purple-800";
      case "user_confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ai_generated":
        return "AI 요약 생성됨";
      case "expert_reviewed":
        return "전문가 검토 완료";
      case "user_confirmed":
        return "사용자 확인 완료";
      case "completed":
        return "완료";
      case "processing":
        return "처리중";
      case "failed":
        return "실패";
      default:
        return "알 수 없음";
    }
  };





  const handleSummaryClick = (id: string) => {
    router.push(`/summary/${id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("ko-KR", { year: "numeric", month: "numeric", day: "numeric" });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "numeric" });
  };

  // 로그인하지 않은 사용자에 대한 접근 제한
  if (!isAuthenticated || !user) {
    return (
      <ServiceLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-md">
              <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                로그인이 필요합니다
              </h2>
              <p className="text-gray-600 mb-6">
                상담 요약을 보려면 먼저 로그인해주세요.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인하기
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  if (loading) {
    return (
      <ServiceLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                상담 요약을 불러오고 있습니다...
              </p>
            </div>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              상담 요약
            </h1>
                          <p className="text-gray-600 mt-1">
                AI가 생성한 상담 요약을 확인하고 전문가 검토 후 ToDo 리스트를 진행하세요.
              </p>
          </div>



          {/* 검색 및 필터 */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="상담 제목, 전문가, 태그로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="ai_generated">AI 요약 생성됨</option>
              <option value="expert_reviewed">전문가 검토 완료</option>
              <option value="user_confirmed">사용자 확인 완료</option>
              <option value="completed">완료</option>
              <option value="processing">처리중</option>
              <option value="failed">실패</option>
            </select>
          </form>

          {/* 요약 통계 */}
          {filteredSummaries.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">총 상담</p>
                    <p className="text-2xl font-semibold text-gray-900">{filteredSummaries.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">AI 요약</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredSummaries.filter(s => (s as any).status === 'ai_generated').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">전문가 검토</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {getUnvisitedCount('expert_reviewed')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">사용자 확인</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {getUnvisitedCount('user_confirmed')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">처리중</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {getUnvisitedCount('processing')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* 상담 요약 목록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상담번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상담내용
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전문가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜/시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ToDo 리스트
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSummaries.map((summary) => {
                  const isVisited = visitedSummaries.includes(summary.id.toString());
                  return (
                    <tr
                      key={summary.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isVisited ? 'bg-white' : 'bg-blue-50'}`}
                      onClick={() => handleSummaryClick(summary.id.toString())}
                    >
                      {/* 상담번호 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <div className="px-3 py-1 bg-gray-100 rounded-lg">
                            <span className="text-sm font-semibold text-gray-600">
                              {summary.consultationNumber || `CS${String(new Date(summary.date).getFullYear()).slice(-2)}${String(new Date(summary.date).getMonth() + 1).padStart(2, '0')}${String(new Date(summary.date).getDate()).padStart(2, '0')}${String(filteredSummaries.indexOf(summary) + 1).padStart(3, '0')}`}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* 상담내용 */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isVisited ? 'text-gray-600' : 'text-gray-900'}`}>
                            {summary.title}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {summary.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {summary.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                +{summary.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>



                      {/* 전문가 정보 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {summary.expert.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {summary.expert.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 날짜/시간 */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(summary.date)}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            {formatTime(summary.date)} • {summary.duration}분
                          </div>
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            (summary as any).status === 'expert_reviewed' ? 'bg-purple-100 text-purple-800' :
                            (summary as any).status === 'user_confirmed' ? 'bg-green-100 text-green-800' :
                            (summary as any).status === 'ai_generated' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText((summary as any).status)}
                          </span>

                        </div>
                      </td>

                                          {/* ToDo 리스트 */}
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {(summary as any).todoStatuses && (summary as any).todoStatuses.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <CheckSquare className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-medium">
                                  {(summary as any).todoStatuses.filter((todo: any) => todo.isCompleted).length}/
                                  {(summary as any).todoStatuses.length} 완료
                                </span>
                              </div>
                              {summary.expertReview?.suggestedNextSession && (
                                <div className="flex items-center space-x-2 text-blue-600">
                                  <CalendarDays className="h-3 w-3" />
                                  <span className="text-xs">다음 상담 제안됨</span>
                                </div>
                              )}
                            </div>
                          ) : summary.expertReview?.additionalRecommendations && summary.expertReview.additionalRecommendations.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-700 font-medium">
                                  0/{summary.expertReview.additionalRecommendations.length} 완료
                                </span>
                              </div>
                              <span className="text-xs text-blue-600">전문가 추천 ToDo</span>
                            </div>
                          ) : summary.aiSummary?.actionItems && summary.aiSummary.actionItems.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-700 font-medium">
                                  0/{summary.aiSummary.actionItems.length} 완료
                                </span>
                              </div>
                              <span className="text-xs text-blue-600">AI 추천 ToDo</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">ToDo 없음</span>
                          )}
                        </div>
                      </td>


                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 빈 상태 */}
          {filteredSummaries.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                상담 요약이 없습니다
              </h3>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "검색 조건에 맞는 상담 요약이 없습니다."
                  : "아직 상담 요약이 생성되지 않았습니다."}
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                첫 상담 시작하기
              </button>
            </div>
          )}

          {/* 페이징 */}
          {totalCount > 5 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  총 {totalCount}개 중 {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
    </ServiceLayout>
  );
}
