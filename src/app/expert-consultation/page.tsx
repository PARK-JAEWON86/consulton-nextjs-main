"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Phone,
  User,
  FileText,
  Plus,
  Play,
  Square,
  Clock as ClockIcon,
  Heart,
  Star,
} from "lucide-react";
import ServiceLayout from "@/components/layout/ServiceLayout";
import ConsultationSession from "@/components/expert-consultation/ConsultationSession";

// API를 통해 레벨별 크레딧을 계산하는 함수 (동기 버전)
const calculateCreditsByLevel = (level: number = 1): number => {
  // 기본 크레딧 요금 계산 (실제로는 API 호출이 필요하지만 여기서는 기본값 사용)
  const baseCreditsPerMinute = 150; // 기본값
  const levelMultiplier = Math.max(1, level / 100); // 레벨에 따른 배수
  return Math.round(baseCreditsPerMinute * levelMultiplier);
};

interface ConsultationSession {
  id: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  expertSpecialty: string;
  topic: string;
  scheduledTime: string;
  duration: number;
  consultationType: "chat" | "voice" | "video";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  expertLevel: number;
  description?: string;
}

interface FavoriteExpert {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  expertLevel: number;
}

export default function ExpertConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consultations, setConsultations] = useState<ConsultationSession[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // 카테고리 데이터
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 즐겨찾기 전문가 데이터 (실제 API 연동 필요)
  const [favoriteExperts, setFavoriteExperts] = useState<FavoriteExpert[]>([]);

  // URL 파라미터에서 전문가 ID 처리
  useEffect(() => {
    const expertId = searchParams.get('expertId');
    if (expertId) {
      // 전문가 ID가 있으면 해당 전문가를 선택된 상태로 설정
      // setSelectedExpert(expertId); // TODO: selectedExpert state 정의 필요
      // 전문가 정보를 로드하는 로직 추가 가능
      console.log('선택된 전문가 ID:', expertId);
    }
  }, [searchParams]);

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('/api/categories?activeOnly=true');
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.data);
        } else {
          console.error('카테고리 로드 실패:', result.message);
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // 즐겨찾기 전문가 데이터 로드
  useEffect(() => {
    const loadFavoriteExperts = async () => {
      try {
        // 실제 API에서 즐겨찾기 전문가 데이터를 가져오기
        try {
          const favoritesResponse = await fetch('/api/expert-profiles?favorites=true');
          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            setFavoriteExperts(favoritesData.experts || []);
          } else {
            setFavoriteExperts([]);
          }
        } catch (error) {
          console.error('즐겨찾기 전문가 API 호출 실패:', error);
          setFavoriteExperts([]);
        }
      } catch (error) {
        console.error('즐겨찾기 전문가 로드 실패:', error);
        setFavoriteExperts([]);
      }
    };

    loadFavoriteExperts();
  }, []);

  // 상담 데이터 로드 (실제 API 연동 필요)
  useEffect(() => {
    const loadConsultations = async () => {
      try {
        // 실제 API에서 상담 데이터를 가져오기
        try {
          const consultationsResponse = await fetch('/api/consultations?status=all');
          if (consultationsResponse.ok) {
            const consultationsData = await consultationsResponse.json();
            setConsultations(consultationsData.consultations || []);
          } else {
            setConsultations([]);
          }
        } catch (error) {
          console.error('상담 데이터 API 호출 실패:', error);
          setConsultations([]);
        }
      } catch (error) {
        console.error('상담 데이터 로드 실패:', error);
        setConsultations([]);
      }
    };

    if (!isLoadingCategories) {
      loadConsultations();
    }
  }, [isLoadingCategories]);

  // 상담 시작
  const handleStartConsultation = (consultation: ConsultationSession) => {
    setSelectedConsultation(consultation);
    setIsSessionActive(true);
    setSessionTime(0);
    
    // 상담 세션 시작 시 브라우저 히스토리에 추가
    const sessionUrl = `/expert-consultation/session/${consultation.id}`;
    window.history.pushState(
      { 
        consultationId: consultation.id, 
        consultationName: consultation.expertName,
        fromPage: '/expert-consultation'
      }, 
      '', 
      sessionUrl
    );
  };

  // 상담 종료
  const handleEndSession = () => {
    setIsSessionActive(false);
    setSessionTime(0);
    setSelectedConsultation(null);
    
    // 상담 세션 종료 시 원래 페이지로 돌아가기
    window.history.back();
  };

  // 상담 예약 페이지로 이동
  const handleNewConsultation = () => {
    router.push("/experts");
  };

  // 즐겨찾기 전문가 클릭
  const handleExpertClick = (expert: FavoriteExpert) => {
    router.push(`/experts/${expert.id}`);
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  // 시간 포맷팅
  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  // 크레딧 요금 계산 (동기 버전)
  const getCreditsPerMinute = (expertLevel: number) => {
    return calculateCreditsByLevel(expertLevel);
  };

  // 총 크레딧 요금 계산
  const getTotalCredits = (expertLevel: number, duration: number) => {
    const creditsPerMinute = getCreditsPerMinute(expertLevel);
    return creditsPerMinute * duration;
  };

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 상담 세션 중에 뒤로가기를 누른 경우
      if (isSessionActive && selectedConsultation) {
        if (confirm("진행 중인 상담이 있습니다. 정말 나가시겠습니까?")) {
          handleEndSession();
        } else {
          // 취소한 경우 현재 세션 상태 유지
          const sessionUrl = `/expert-consultation/session/${selectedConsultation.id}`;
          window.history.pushState(
            { 
              consultationId: selectedConsultation.id, 
              consultationName: selectedConsultation.expertName,
              fromPage: '/expert-consultation'
            }, 
            '', 
            sessionUrl
          );
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSessionActive, selectedConsultation]);

  // 상담 세션이 활성화된 경우 기존 레이아웃 내에서 표시
  if (isSessionActive && selectedConsultation) {
    return (
      <ServiceLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 페이지 헤더 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">전문가 상담</h1>
              <p className="mt-2 text-gray-600">
                예약된 상담을 관리하고 실시간으로 전문가와 상담하세요
              </p>
            </div>
            
            {/* 상담 세션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <ConsultationSession
                consultation={{
                  ...selectedConsultation,
                  price: getTotalCredits(selectedConsultation.expertLevel, selectedConsultation.duration),
                }}
                onEndSession={handleEndSession}
              />
            </div>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">전문가 상담</h1>
            <p className="mt-2 text-gray-600">
              예약된 상담을 관리하고 실시간으로 전문가와 상담하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽 패널: 예약된 상담 목록 */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 예약된 상담 목록 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* 패널 헤더 */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">예약된 상담</h2>
                      <button
                        onClick={handleNewConsultation}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 상담
                      </button>
                    </div>
                  </div>

                  {/* 상담 목록 */}
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {consultations.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">예약된 상담이 없습니다</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          새로운 상담을 예약해보세요
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={handleNewConsultation}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            상담 예약하기
                          </button>
                        </div>
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
                                  {consultation.expertAvatar}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {consultation.expertName}
                                </p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {consultation.expertSpecialty}
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 즐겨찾는 상담가 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">즐겨찾는 상담가</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {favoriteExperts.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <Heart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">즐겨찾기한 상담가가 없습니다</p>
                        <p className="text-xs text-gray-400 mt-1">전문가 프로필에서 하트를 눌러 즐겨찾기에 추가하세요</p>
                      </div>
                    ) : (
                      favoriteExperts.map((expert) => (
                        <div
                          key={expert.id}
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleExpertClick(expert)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {expert.avatar}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {expert.name} 전문가
                                </p>
                                <Heart className="h-4 w-4 text-red-500 fill-current" />
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {expert.specialty}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                                <span>{expert.rating}</span>
                                <span className="mx-1">•</span>
                                <span>{expert.reviewCount}개 리뷰</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                            {selectedConsultation.expertAvatar}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedConsultation.expertName} 전문가
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedConsultation.expertSpecialty} • {selectedConsultation.duration}분
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
                          {getCreditsPerMinute(selectedConsultation.expertLevel)} 크레딧/분
                        </p>
                        <p className="text-sm text-gray-500">
                          총 {getTotalCredits(selectedConsultation.expertLevel, selectedConsultation.duration)} 크레딧
                        </p>
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

                  {/* 상담 컨트롤 */}
                  <div className="px-6 py-6">
                    <div className="text-center">
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">상담을 선택해주세요</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    왼쪽에서 예약된 상담을 선택하면 상담을 시작할 수 있습니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ServiceLayout>
  );
}
