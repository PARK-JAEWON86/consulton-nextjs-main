"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Phone,
  User,
  FileText,
  Play,
  Square,
  Clock as ClockIcon,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import ConsultationSession from "@/components/expert-consultation/ConsultationSession";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// 전문가용 상담 세션 인터페이스
interface ExpertConsultationSession {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  topic: string;
  scheduledTime: string;
  duration: number;
  consultationType: "chat" | "voice" | "video";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  expertLevel: number;
  description?: string;
  clientRating?: number;
  clientReview?: string;
  price: number; // 크레딧 단위
}

// 전문가용 상담 통계 인터페이스
interface ExpertConsultationStats {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

export default function ExpertConsultationSessionsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<ExpertConsultationSession[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ExpertConsultationSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [stats, setStats] = useState<ExpertConsultationStats>({
    totalSessions: 0,
    completedSessions: 0,
    scheduledSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  // 상담 데이터 로드 (API에서 가져오기)
  useEffect(() => {
    const loadConsultations = async () => {
      try {
        // 전문가 상담 세션 조회
        const response = await fetch('/api/consultations-multi?expertId=current');
        if (response.ok) {
          const data = await response.json();
          const consultations = data.data || [];
          setConsultations(consultations);

          // 통계 계산
          const totalSessions = consultations.length;
          const completedSessions = consultations.filter((c: any) => c.status === "completed").length;
          const scheduledSessions = consultations.filter((c: any) => c.status === "scheduled").length;
          const totalEarnings = consultations
            .filter((c: any) => c.status === "completed")
            .reduce((sum: number, c: any) => sum + (c.price || 0), 0);
          const completedWithRating = consultations.filter((c: any) => c.status === "completed" && c.clientRating);
          const averageRating = completedWithRating.length > 0 
            ? completedWithRating.reduce((sum: number, c: any) => sum + (c.clientRating || 0), 0) / completedWithRating.length
            : 0;
          const totalReviews = completedWithRating.length;

          setStats({
            totalSessions,
            completedSessions,
            scheduledSessions,
            totalEarnings,
            averageRating,
            totalReviews,
          });
        }
      } catch (error) {
        console.error('상담 데이터 로드 실패:', error);
      }
    };

    loadConsultations();
  }, []);

  // 상담 시작
  const handleStartConsultation = (consultation: ExpertConsultationSession) => {
    try {
      setSelectedConsultation(consultation);
      setIsSessionActive(true);
      setSessionTime(0);
      
      // 상담 세션 시작 시 브라우저 히스토리에 추가
      const sessionUrl = `/dashboard/expert/consultation-sessions/session/${consultation.id}`;
      window.history.pushState(
        { 
          consultationId: consultation.id, 
          consultationName: consultation.clientName,
          fromPage: '/dashboard/expert/consultation-sessions'
        }, 
        '', 
        sessionUrl
      );
    } catch (error) {
      console.error('상담 시작 중 오류 발생:', error);
      // 오류 발생 시 상태 복원
      setIsSessionActive(false);
      setSessionTime(0);
    }
  };

  // 상담 종료
  const handleEndSession = () => {
    try {
      setIsSessionActive(false);
      setSessionTime(0);
      setSelectedConsultation(null);
      
      // 상담 세션 종료 시 원래 페이지로 돌아가기
      window.history.back();
    } catch (error) {
      console.error('상담 종료 중 오류 발생:', error);
      // 오류 발생 시에도 상태는 정리
      setIsSessionActive(false);
      setSessionTime(0);
      setSelectedConsultation(null);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 날짜 포맷팅 (방어 코드 포함)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // 유효하지 않은 날짜인 경우 처리
      if (isNaN(date.getTime())) {
        return "날짜 오류";
      }
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return "오늘";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "내일";
      } else {
        return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
      }
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return "날짜 오류";
    }
  };

  // 시간 포맷팅 (방어 코드 포함)
  const formatTimeOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // 유효하지 않은 날짜인 경우 처리
      if (isNaN(date.getTime())) {
        return "시간 오류";
      }
      
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      console.error('시간 포맷팅 오류:', error);
      return "시간 오류";
    }
  };

  // 상태별 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 상태별 한글 텍스트 반환
  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "예약됨";
      case "in-progress":
        return "진행 중";
      case "completed":
        return "완료됨";
      case "cancelled":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      try {
        // 상담 세션 중에 뒤로가기를 누른 경우
        if (isSessionActive && selectedConsultation) {
          if (confirm("진행 중인 상담이 있습니다. 정말 나가시겠습니까?")) {
            handleEndSession();
          } else {
            // 취소한 경우 현재 세션 상태 유지
            const sessionUrl = `/dashboard/expert/consultation-sessions/session/${selectedConsultation.id}`;
            window.history.pushState(
              { 
                consultationId: selectedConsultation.id, 
                consultationName: selectedConsultation.clientName,
                fromPage: '/dashboard/expert/consultation-sessions'
              }, 
              '', 
              sessionUrl
            );
          }
        }
      } catch (error) {
        console.error('브라우저 히스토리 처리 중 오류 발생:', error);
        // 오류 발생 시 상담 세션 종료
        if (isSessionActive) {
          handleEndSession();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSessionActive, selectedConsultation]);

  // 상담 세션이 활성화된 경우 기존 레이아웃 내에서 표시
  if (isSessionActive && selectedConsultation) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 페이지 헤더 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">전문가 상담 세션</h1>
              <p className="mt-2 text-gray-600">
                클라이언트와 실시간으로 상담을 진행하세요
              </p>
            </div>
            
            {/* 상담 세션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <ConsultationSession
                consultation={{
                  ...selectedConsultation,
                  expertId: "expert_1", // 실제로는 현재 로그인한 전문가 ID
                  expertName: "전문가", // 실제로는 현재 로그인한 전문가 이름
                  expertAvatar: "전",
                  expertSpecialty: "상담",
                }}
                onEndSession={handleEndSession}
                isExpertView={true} // 전문가 뷰 모드
              />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">상담 세션 관리</h1>
            <p className="mt-2 text-gray-600">
              예약된 상담을 관리하고 클라이언트와 실시간으로 상담하세요
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 상담 수</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">예약된 상담</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.scheduledSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 평점</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.averageRating > 0 ? Number(stats.averageRating).toFixed(1) : "0.0"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 수익</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalEarnings.toLocaleString()} 크레딧
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽 패널: 상담 목록 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* 패널 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">상담 목록</h2>
                </div>

                {/* 상담 목록 */}
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {consultations.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">예약된 상담이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        새로운 상담 요청을 기다려보세요
                      </p>
                    </div>
                  ) : (
                    consultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className={`px-6 py-4 cursor-pointer transition-colors ${
                          selectedConsultation?.id === consultation.id
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedConsultation(consultation)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {consultation.clientAvatar}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {consultation.clientName}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                                {getStatusText(consultation.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {consultation.topic}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDate(consultation.scheduledTime)}</span>
                              <span className="mx-1">•</span>
                              <span>{formatTimeOnly(consultation.scheduledTime)}</span>
                              <span className="mx-1">•</span>
                              <span>{consultation.duration}분</span>
                            </div>
                            <div className="flex items-center mt-2">
                              {consultation.consultationType === "chat" && (
                                <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                              )}
                              {consultation.consultationType === "voice" && (
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              )}
                              {consultation.consultationType === "video" && (
                                <Video className="h-4 w-4 text-gray-400 mr-2" />
                              )}
                              <span className="text-xs text-gray-500 capitalize">
                                {consultation.consultationType === "chat" && "채팅"}
                                {consultation.consultationType === "voice" && "음성"}
                                {consultation.consultationType === "video" && "화상"}
                              </span>
                              <span className="ml-auto text-xs font-medium text-gray-900">
                                {consultation.price.toLocaleString()} 크레딧
                              </span>
                            </div>
                            {/* 완료된 상담의 경우 평점 표시 */}
                            {consultation.status === "completed" && consultation.clientRating && (
                              <div className="flex items-center mt-2">
                                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                <span className="text-xs text-gray-600">
                                  {consultation.clientRating}점
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽 패널: 상담 세션 */}
            <div className="lg:col-span-2">
              {selectedConsultation ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* 상담 정보 헤더 */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-blue-600">
                            {selectedConsultation.clientAvatar}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedConsultation.clientName}님
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedConsultation.duration}분 상담
                          </p>
                          <div className="flex items-center mt-1">
                            {selectedConsultation.consultationType === "chat" && (
                              <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            {selectedConsultation.consultationType === "voice" && (
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            {selectedConsultation.consultationType === "video" && (
                              <Video className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-600">
                              {selectedConsultation.consultationType === "chat" && "채팅 상담"}
                              {selectedConsultation.consultationType === "voice" && "음성 상담"}
                              {selectedConsultation.consultationType === "video" && "화상 상담"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">상담료</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedConsultation.price.toLocaleString()} 크레딧
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedConsultation.status)}`}>
                          {getStatusText(selectedConsultation.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 상담 주제 */}
                  {selectedConsultation.description && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">상담 주제</h4>
                      <p className="text-sm text-gray-600">{selectedConsultation.description}</p>
                    </div>
                  )}

                  {/* 완료된 상담의 경우 리뷰 표시 */}
                  {selectedConsultation.status === "completed" && selectedConsultation.clientReview && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">클라이언트 리뷰</h4>
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {selectedConsultation.clientRating}점
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedConsultation.clientReview}</p>
                    </div>
                  )}

                  {/* 상담 컨트롤 */}
                  <div className="px-6 py-6">
                    <div className="text-center">
                      {selectedConsultation.status === "scheduled" ? (
                        <>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">상담 준비 완료</h4>
                          <p className="text-sm text-gray-600 mb-6">
                            예약된 {selectedConsultation.consultationType === "chat" ? "채팅" : 
                                   selectedConsultation.consultationType === "voice" ? "음성" : "화상"} 상담을 시작할 준비가 되었습니다.
                          </p>
                          
                          <div className="flex items-center justify-center space-x-4">
                            {!isSessionActive ? (
                              <button
                                onClick={() => handleStartConsultation(selectedConsultation)}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <Play className="h-5 w-5 mr-2" />
                                상담 시작하기
                              </button>
                            ) : (
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                                  <ClockIcon className="h-5 w-5 text-gray-600" />
                                  <span className="text-lg font-mono text-gray-900">
                                    {formatTime(sessionTime)}
                                  </span>
                                </div>
                                <button
                                  onClick={handleEndSession}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  상담 종료
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : selectedConsultation.status === "completed" ? (
                        <>
                          <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-green-100 rounded-full">
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">상담 완료</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {selectedConsultation.clientName}님과의 상담이 성공적으로 완료되었습니다.
                          </p>
                          {selectedConsultation.clientRating && (
                            <div className="flex items-center justify-center mb-4">
                              <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                              <span className="text-lg font-medium text-gray-900">
                                {selectedConsultation.clientRating}점
                              </span>
                            </div>
                          )}
                        </>
                      ) : selectedConsultation.status === "cancelled" ? (
                        <>
                          <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                              <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">상담 취소됨</h4>
                          <p className="text-sm text-gray-600">
                            이 상담은 취소되었습니다.
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">상담을 선택해주세요</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    왼쪽에서 상담을 선택하면 상담을 시작할 수 있습니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
