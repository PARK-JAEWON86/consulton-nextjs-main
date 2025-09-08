"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  FileText,
  CheckSquare,
  Tag,
  LogIn,
  Bot,
  CheckCircle,
  Target,
  AlertCircle,
  Clock3,
  CalendarDays,
} from "lucide-react";

import SummaryCard from "@/components/summary/SummaryCard";
import ToDoList from "@/components/summary/ToDoList";
import ReviewSection from "@/components/summary/ReviewSection";
import ServiceLayout from "@/components/layout/ServiceLayout";
import { ConsultationSummary, TodoItem } from "@/types";

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

interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  timeframe: string;
}

interface ActionItem {
  id: number;
  task: string;
  assignee: string;
  dueDate: Date | null;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
}

interface SummaryData {
  id: string;
  consultationNumber?: string;
  title: string;
  date: Date;
  duration: number;
  expert: {
    name: string;
    title: string;
    avatar: string | null;
  };
  client: {
    name: string;
    company: string;
  };
  status: "ai_generated" | "expert_reviewed" | "user_confirmed" | "processing" | "completed" | "failed";
  summary: {
    keyPoints: string[];
    recommendations: Recommendation[];
    actionItems: ActionItem[];
    tags: string[];
    nextSteps: string;
  };
  creditsUsed: number;
  rating: number | null;
  
  // 새로운 워크플로우 필드들
  aiSummary?: {
    keyPoints: string[];
    recommendations: string[];
    actionItems: string[];
    generatedAt: Date;
    aiModel: string;
  };
  
  expertReview?: {
    reviewedAt: Date;
    expertNotes: string;
    additionalRecommendations: string[];
    suggestedNextSession?: {
      date: Date;
      duration: number;
      topic: string;
    };
    priority: 'high' | 'medium' | 'low';
  };
  
  userActions?: {
    confirmedAt: Date;
    userNotes: string;
    todoList: TodoItem[];
    nextSessionBooked?: {
      sessionId: string;
      date: Date;
      duration: number;
      status: 'pending' | 'confirmed' | 'cancelled';
    };
    isCompleted: boolean;
  };
  
  // 녹화 관련
  transcript?: string;
}

interface ApiResponse {
  success: boolean;
  data: SummaryData;
  message?: string;
}

export default function ConsultationSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [todoStatuses, setTodoStatuses] = useState<any[]>([]);
  const [loadingTodoStatus, setLoadingTodoStatus] = useState(false);
  


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

  // 상담 요약 데이터 로드
  useEffect(() => {
    const loadSummaryData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/consultation-summaries/${id}`);
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setSummaryData(result.data);
        } else {
          setError(result.message || '상담 요약을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('상담 요약 로드 실패:', error);
        setError('상담 요약을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSummaryData();
  }, [id]);

  const { user, isAuthenticated } = appState;

  // ToDo 상태 로드
  useEffect(() => {
    if (summaryData && user?.id) {
      loadTodoStatuses();
    }
  }, [summaryData, user?.id]);

  // 페이지 포커스 시 ToDo 상태 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (summaryData && user?.id) {
        loadTodoStatuses();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [summaryData, user?.id]);

  // ToDo 상태 로드
  const loadTodoStatuses = async () => {
    if (!id || !user?.id) return;
    
    setLoadingTodoStatus(true);
    try {
      const response = await fetch(`/api/consultation-summaries/${id}/todo-status?userId=${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        setTodoStatuses(result.data || []);
      }
    } catch (error) {
      console.error('ToDo 상태 로드 실패:', error);
    } finally {
      setLoadingTodoStatus(false);
    }
  };

  // ToDo 상태 변경
  const handleTodoStatusChange = async (itemIndex: number, itemType: 'expert_recommendation' | 'ai_action_item', content: string, isCompleted: boolean) => {
    if (!id || !user?.id) return;
    
    try {
      const response = await fetch(`/api/consultation-summaries/${id}/todo-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          itemIndex,
          itemType,
          content,
          isCompleted,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 상태 업데이트
        await loadTodoStatuses();
      }
    } catch (error) {
      console.error('ToDo 상태 변경 실패:', error);
    }
  };

  // 워크플로우 단계 계산
  const getWorkflowStep = (summary: SummaryData) => {
    if (summary.status === 'ai_generated') {
      return {
        step: 1,
        text: 'AI 요약 생성 완료',
        description: '전문가 검토 대기중',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    } else if (summary.status === 'expert_reviewed') {
      return {
        step: 2,
        text: '전문가 검토 완료',
        description: '사용자 확인 대기중',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      };
    } else if (summary.status === 'user_confirmed') {
      return {
        step: 3,
        text: '사용자 확인 완료',
        description: 'ToDo 리스트 진행중',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        step: 0,
        text: '처리중',
        description: '상담 요약 생성중',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  // 상담 카테고리 추출 함수
  const getConsultationCategory = (summary: SummaryData): string => {
    // 1. summary.tags에서 첫 번째 태그 사용
    if (summary.summary?.tags && summary.summary.tags.length > 0) {
      return summary.summary.tags[0];
    }
    
    // 2. AI 요약의 첫 번째 추천사항에서 카테고리 추출
    if (summary.aiSummary?.recommendations && summary.aiSummary.recommendations.length > 0) {
      const firstRecommendation = summary.aiSummary.recommendations[0];
      // 추천사항에서 카테고리 키워드 추출
      if (firstRecommendation.includes('진로') || firstRecommendation.includes('커리어')) return '진로상담';
      if (firstRecommendation.includes('심리') || firstRecommendation.includes('스트레스')) return '심리상담';
      if (firstRecommendation.includes('재무') || firstRecommendation.includes('투자')) return '재무상담';
      if (firstRecommendation.includes('법률') || firstRecommendation.includes('계약')) return '법률상담';
      if (firstRecommendation.includes('교육') || firstRecommendation.includes('학습')) return '교육상담';
    }
    
    // 3. 전문가 제목에서 카테고리 추출
    if (summary.expert?.title) {
      const title = summary.expert.title;
      if (title.includes('진로') || title.includes('커리어')) return '진로상담';
      if (title.includes('심리')) return '심리상담';
      if (title.includes('재무') || title.includes('투자')) return '재무상담';
      if (title.includes('법률')) return '법률상담';
      if (title.includes('교육')) return '교육상담';
    }
    
    // 4. 기본값
    return '일반상담';
  };

  // 상담 요약 방문 기록 관리
  const markSummaryAsVisited = (summaryId: string) => {
    try {
      const visitedSummaries = JSON.parse(localStorage.getItem('visited-consultation-summaries') || '[]');
      if (!visitedSummaries.includes(summaryId)) {
        visitedSummaries.push(summaryId);
        localStorage.setItem('visited-consultation-summaries', JSON.stringify(visitedSummaries));
        
        // 사이드바 알림 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('summaryVisited', { 
          detail: { summaryId, action: 'markVisited' } 
        }));
      }
    } catch (error) {
      console.error('방문 기록 저장 실패:', error);
    }
  };

  // 리뷰 작성 성공 시 커뮤니티 상담후기 페이지로 이동
  const handleReviewSuccess = () => {
    // 잠시 후 커뮤니티 상담후기 페이지로 이동
    setTimeout(() => {
      router.push('/community?tab=consultation_review');
    }, 1500);
  };

  // 페이지 방문 시 방문 기록
  useEffect(() => {
    if (id && appState.isAuthenticated && appState.user) {
      markSummaryAsVisited(id);
    }
  }, [id, appState.isAuthenticated, appState.user]);

  // 페이지 이탈 시 정리 (선택적)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 페이지를 떠날 때 추가 정리 작업이 필요한 경우
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


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

  if (error || !summaryData) {
    return (
      <ServiceLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-24">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              {error || '상담 요약을 불러올 수 없습니다.'}
            </p>
            <button
              onClick={() => router.push("/summary")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  const workflowStep = getWorkflowStep(summaryData);

  return (
    <ServiceLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/summary")}
            className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
          </button>
        </div>

        {/* 헤더 */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {summaryData.title}
            </h1>
            <p className="text-gray-600 mt-1">
              상담번호 {summaryData.consultationNumber} • {summaryData.expert.name}와의 상담 요약
            </p>
          </div>

          {/* 워크플로우 상태 표시 */}
          <div className={`mt-6 ${workflowStep.bgColor} border ${workflowStep.borderColor} rounded-lg p-4`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${workflowStep.step === 1 ? 'bg-blue-100' : workflowStep.step === 2 ? 'bg-purple-100' : workflowStep.step === 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {workflowStep.step === 1 ? <Bot className="h-5 w-5 text-blue-600" /> :
                 workflowStep.step === 2 ? <CheckCircle className="h-5 w-5 text-purple-600" /> :
                 workflowStep.step === 3 ? <Target className="h-5 w-5 text-green-600" /> :
                 <Clock3 className="h-5 w-5 text-gray-600" />}
              </div>
              <div>
                <h3 className={`font-semibold ${workflowStep.color}`}>
                  {workflowStep.text}
                </h3>
                <p className="text-sm text-gray-600">
                  {workflowStep.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 워크플로우 단계별 내용 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI 요약 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI 자동 요약</h2>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {summaryData.aiSummary?.aiModel || 'GPT-4'}
                </span>
              </div>
              
              {summaryData.aiSummary ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">핵심 포인트</h3>
                    <ul className="space-y-1">
                      {summaryData.aiSummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">AI 추천사항</h3>
                    <ul className="space-y-1">
                      {summaryData.aiSummary.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    생성일시: {summaryData.aiSummary.generatedAt instanceof Date 
                      ? summaryData.aiSummary.generatedAt.toLocaleString('ko-KR')
                      : new Date(summaryData.aiSummary.generatedAt).toLocaleString('ko-KR')
                    }
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  AI 요약이 아직 생성되지 않았습니다.
                </div>
              )}
            </div>
          </div>

          {/* 전문가 검토 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">전문가 검토</h2>
              </div>
              
              {summaryData.expertReview ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">전문가 노트</h3>
                    <p className="text-gray-700 text-sm bg-purple-50 p-3 rounded border border-purple-200">
                      {summaryData.expertReview.expertNotes}
                    </p>
                  </div>
                  
                  {summaryData.expertReview.additionalRecommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">추가 추천사항</h3>
                      <ul className="space-y-1">
                        {summaryData.expertReview.additionalRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summaryData.expertReview.suggestedNextSession && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h3 className="font-medium text-blue-900 mb-2">다음 상담 제안</h3>
                      <div className="space-y-1 text-sm text-blue-800">
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>{summaryData.expertReview.suggestedNextSession.date instanceof Date 
                            ? summaryData.expertReview.suggestedNextSession.date.toLocaleDateString('ko-KR')
                            : new Date(summaryData.expertReview.suggestedNextSession.date).toLocaleDateString('ko-KR')
                          }</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{summaryData.expertReview.suggestedNextSession.duration}분</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span>{summaryData.expertReview.suggestedNextSession.topic}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    검토일시: {summaryData.expertReview.reviewedAt instanceof Date 
                      ? summaryData.expertReview.reviewedAt.toLocaleString('ko-KR')
                      : new Date(summaryData.expertReview.reviewedAt).toLocaleString('ko-KR')
                    }
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  전문가 검토가 아직 완료되지 않았습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사용자 액션 섹션 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Todo 리스트</h2>
          </div>

          {/* 전문가가 정해준 액션 리스트 */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">전문가 추천 ToDo리스트</h3>
            </div>
            
            <div className="space-y-3">
              {summaryData.expertReview?.additionalRecommendations && summaryData.expertReview.additionalRecommendations.length > 0 ? (
                summaryData.expertReview.additionalRecommendations.map((action, index) => {
                  const todoStatus = todoStatuses.find(status => 
                    status.itemIndex === index && status.itemType === 'expert_recommendation'
                  );
                  const isChecked = todoStatus?.isCompleted || false;
                  
                  return (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        id={`action-${index}`}
                        checked={isChecked}
                        onChange={(e) => handleTodoStatusChange(
                          index, 
                          'expert_recommendation', 
                          action, 
                          e.target.checked
                        )}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor={`action-${index}`} className="text-gray-900 font-medium cursor-pointer">
                          {action}
                        </label>
                      </div>
                    </div>
                  );
                })
              ) : summaryData.aiSummary?.actionItems && summaryData.aiSummary.actionItems.length > 0 ? (
                summaryData.aiSummary.actionItems.map((action, index) => {
                  const todoStatus = todoStatuses.find(status => 
                    status.itemIndex === index && status.itemType === 'ai_action_item'
                  );
                  const isChecked = todoStatus?.isCompleted || false;
                  
                  return (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        id={`action-${index}`}
                        checked={isChecked}
                        onChange={(e) => handleTodoStatusChange(
                          index, 
                          'ai_action_item', 
                          action, 
                          e.target.checked
                        )}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor={`action-${index}`} className="text-gray-900 font-medium cursor-pointer">
                          {action}
                        </label>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  아직 전문가가 추천한 액션 아이템이 없습니다.
                </div>
              )}
            </div>
          </div>




        </div>



        {/* 상담 기본 정보 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">전문가 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{summaryData.expert.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{summaryData.expert.title}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">상담 세부사항</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    {summaryData.date instanceof Date 
                      ? summaryData.date.toLocaleDateString('ko-KR')
                      : new Date(summaryData.date).toLocaleDateString('ko-KR')
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{summaryData.duration}분</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{summaryData.creditsUsed} 크레딧 사용</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 리뷰 섹션 */}
        <ReviewSection
          consultationId={id}
          expertId={summaryData.expert.name} // 실제로는 expert ID를 사용해야 함
          expertName={summaryData.expert.name}
          category={getConsultationCategory(summaryData)}
          currentUserId={user.id}
          currentUserName={user.name}
          onReviewSuccess={handleReviewSuccess}
        />
      </div>
    </ServiceLayout>
  );
}
