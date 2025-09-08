"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Star, MessageCircle, Filter, Search, ChevronDown, Calendar, User, Video, Phone, Edit2, Save, X } from "lucide-react";

import { Review } from "@/types";

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

interface ConsultationItem {
  id: number;
  date: string;
  customer: string;
  topic: string;
  amount: number;
  status: "completed" | "scheduled" | "canceled";
  method: "video" | "chat" | "voice" | "call";
  duration: number;
  summary: string;
  notes: string;
}

type SortOption = "latest" | "oldest" | "highest" | "lowest";
type FilterOption = "all" | "replied" | "unreplied" | "5" | "4" | "3" | "2" | "1";

export default function ExpertReviewsPage() {
  const searchParams = useSearchParams();
  const highlightReviewId = searchParams.get("highlight");
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  
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

  // 상담 기록 로드
  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const response = await fetch('/api/consultations');
        const result = await response.json();
        if (result.success) {
          setConsultations(result.data.items || []);
        }
      } catch (error) {
        console.error('상담 기록 로드 실패:', error);
      }
    };

    loadConsultations();
  }, []);

  const { user } = appState;
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState<{ [key: number]: string }>({});
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // 상담 기록 스토어에서 데이터 가져오기
  // const consultations = useConsultationsStore((state) => state.items);

  // 로그인한 전문가의 리뷰만 로드
  useEffect(() => {
    if (user && user.role === 'expert') {
      loadExpertReviews();
    }
  }, [user]);

  // 전문가 리뷰 로드
  const loadExpertReviews = async () => {
    try {
      // 현재 로그인한 전문가의 리뷰를 API에서 조회
      const response = await fetch(`/api/reviews?expertId=${user?.id}&isPublic=true`);
      const result = await response.json();
      
      if (result.success) {
        // API 응답을 Review 타입에 맞게 변환
        const transformedReviews = result.data.reviews.map((apiReview: any) => ({
          id: parseInt(apiReview.id),
          userId: apiReview.userId,
          userName: apiReview.userName,
          userAvatar: apiReview.userAvatar,
          rating: apiReview.rating,
          comment: apiReview.content,
          consultationTopic: apiReview.category,
          consultationType: 'video', // 기본값, 실제로는 상담 세션에서 가져와야 함
          createdAt: apiReview.date,
          isVerified: apiReview.isVerified,
          expertReply: apiReview.expertReply || null // API 응답에서 전문가 답글 가져오기
        }));
        
        setReviews(transformedReviews);
      } else {
        // API 실패 시 빈 배열 설정
        setReviews([]);
      }
    } catch (error) {
      console.error('전문가 리뷰 로드 실패:', error);
      // 에러 시 빈 배열 설정
      setReviews([]);
    }
  };

  // 하이라이트된 리뷰로 스크롤
  useEffect(() => {
    if (highlightReviewId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`review-${highlightReviewId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // 하이라이트 효과를 위해 잠시 배경색 변경
          element.style.backgroundColor = '#fef3c7';
          element.style.transition = 'background-color 2s ease';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
        }
      }, 500); // 페이지 로드 후 약간의 지연
      
      return () => clearTimeout(timer);
    }
  }, [highlightReviewId]);

  // 리뷰 통계 계산
  const stats = useMemo(() => {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const ratingDistribution = {
      5: reviews.filter(review => review.rating === 5).length,
      4: reviews.filter(review => review.rating === 4).length,
      3: reviews.filter(review => review.rating === 3).length,
      2: reviews.filter(review => review.rating === 2).length,
      1: reviews.filter(review => review.rating === 1).length
    };
    
    const repliedReviews = reviews.filter(review => review.expertReply).length;
    const replyRate = totalReviews > 0 ? (repliedReviews / totalReviews) * 100 : 0;
    
    const verifiedReviews = reviews.filter(review => review.isVerified).length;
    const verificationRate = totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0;
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      replyRate: Math.round(replyRate),
      verifiedReviews,
      verificationRate: Math.round(verificationRate)
    };
  }, [reviews]);

  // 필터링 및 정렬된 리뷰
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        review =>
          review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.consultationTopic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (filterBy === "replied") {
      filtered = filtered.filter(review => review.expertReply);
    } else if (filterBy === "unreplied") {
      filtered = filtered.filter(review => !review.expertReply);
    } else if (["1", "2", "3", "4", "5"].includes(filterBy)) {
      filtered = filtered.filter(review => review.rating === parseInt(filterBy));
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, searchTerm, sortBy, filterBy]);

  // 알림 표시 함수
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 리뷰에 답글 작성
  const handleReply = async (reviewId: number) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply) {
      showNotification("답글 내용을 입력해주세요.", "error");
      return;
    }

    try {
      // API를 통해 답글 저장
      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId.toString(),
          expertReply: {
            message: reply,
            createdAt: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 로컬 상태 업데이트
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId
              ? {
                  ...review,
                  expertReply: {
                    message: reply,
                    createdAt: new Date().toISOString()
                  }
                }
              : review
          )
        );

        setReplyText(prev => ({ ...prev, [reviewId]: "" }));
        setShowReplyForm(null);
        showNotification("답글이 성공적으로 작성되었습니다!");
      } else {
        showNotification(result.message || "답글 작성에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error('답글 작성 실패:', error);
      showNotification("답글 작성에 실패했습니다.", "error");
    }
  };

  // 답글 수정 시작
  const startEditReply = (reviewId: number, currentReply: string) => {
    setEditingReply(reviewId);
    setEditReplyText(prev => ({ ...prev, [reviewId]: currentReply }));
  };

  // 답글 수정 완료
  const handleEditReply = async (reviewId: number) => {
    const editedReply = editReplyText[reviewId]?.trim();
    if (!editedReply) {
      showNotification("답글 내용을 입력해주세요.", "error");
      return;
    }

    try {
      // API를 통해 답글 수정
      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId.toString(),
          expertReply: {
            message: editedReply,
            createdAt: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 로컬 상태 업데이트
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId && review.expertReply
              ? {
                  ...review,
                  expertReply: {
                    ...review.expertReply,
                    message: editedReply,
                    createdAt: review.expertReply.createdAt // 원래 작성일은 유지
                  }
                }
              : review
          )
        );

        setEditReplyText(prev => ({ ...prev, [reviewId]: "" }));
        setEditingReply(null);
        showNotification("답글이 성공적으로 수정되었습니다!");
      } else {
        showNotification(result.message || "답글 수정에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error('답글 수정 실패:', error);
      showNotification("답글 수정에 실패했습니다.", "error");
    }
  };

  // 답글 수정 취소
  const cancelEditReply = (reviewId: number) => {
    setEditingReply(null);
    setEditReplyText(prev => ({ ...prev, [reviewId]: "" }));
  };

  // 별점 렌더링
  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // 상담 타입 아이콘
  const getConsultationIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "voice":
        return <Phone className="w-4 h-4 text-green-500" />;
      case "chat":
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* 알림 토스트 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`rounded-lg p-4 shadow-lg border-l-4 ${
            notification.type === "success" 
              ? "bg-green-50 border-green-400 text-green-800" 
              : "bg-red-50 border-red-400 text-red-800"
          }`}>
            <div className="flex items-center">
              {notification.type === "success" ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
              <p className="text-gray-600 mt-1">
                고객들이 남긴 리뷰를 확인하고 답글을 작성하세요.
              </p>
            </div>
            <button
              onClick={loadExpertReviews}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 리뷰</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalReviews}개
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600 fill-current" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 평점</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900 mr-2">
                    {stats.averageRating}
                  </p>
                  {renderStars(Math.round(stats.averageRating))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">답글 작성률</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.replyRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">검증된 리뷰</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.verifiedReviews}개
                </p>
                <p className="text-xs text-gray-500">
                  ({stats.verificationRate}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">5점 리뷰</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.ratingDistribution[5]}개
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="리뷰 내용, 사용자명, 상담 주제로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="replied">답글 완료</option>
                <option value="unreplied">답글 미완료</option>
                <option value="5">5점</option>
                <option value="4">4점</option>
                <option value="3">3점</option>
                <option value="2">2점</option>
                <option value="1">1점</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="highest">높은 평점순</option>
                <option value="lowest">낮은 평점순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 리뷰 목록 */}
        <div className="space-y-6">
          {filteredAndSortedReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">조건에 맞는 리뷰가 없습니다.</p>
            </div>
          ) : (
            filteredAndSortedReviews.map((review) => (
              <div key={review.id} id={`review-${review.id}`} className="bg-white rounded-lg shadow p-6">
                {/* 리뷰 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900">{review.userName}</p>
                        {review.isVerified && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            인증됨
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    {getConsultationIcon(review.consultationType)}
                    <span className="ml-1">{review.consultationTopic}</span>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {/* 전문가 답글 */}
                {review.expertReply ? (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <p className="font-medium text-blue-900">전문가 답글</p>
                            <span className="ml-2 text-xs text-blue-600">
                              {formatDate(review.expertReply.createdAt)}
                            </span>
                          </div>
                          {editingReply !== review.id && (
                            <button
                              onClick={() => startEditReply(review.id, review.expertReply!.message)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              title="답글 수정"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {editingReply === review.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editReplyText[review.id] || ""}
                              onChange={(e) =>
                                setEditReplyText(prev => ({
                                  ...prev,
                                  [review.id]: e.target.value
                                }))
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-blue-800 bg-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => cancelEditReply(review.id)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                <X className="w-3 h-3 mr-1" />
                                취소
                              </button>
                              <button
                                onClick={() => handleEditReply(review.id)}
                                disabled={!editReplyText[review.id]?.trim()}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-blue-800">{review.expertReply.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 답글 작성 폼
                  <div className="border-t pt-4">
                    {showReplyForm === review.id ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start mb-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-gray-900 mb-2">답글 작성</p>
                            <textarea
                              placeholder="고객에게 정중하고 도움이 되는 답글을 작성해주세요..."
                              value={replyText[review.id] || ""}
                              onChange={(e) =>
                                setReplyText(prev => ({
                                  ...prev,
                                  [review.id]: e.target.value
                                }))
                              }
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 ml-11">
                          <button
                            onClick={() => {
                              setShowReplyForm(null);
                              setReplyText(prev => ({ ...prev, [review.id]: "" }));
                            }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            취소
                          </button>
                          <button
                            onClick={() => handleReply(review.id)}
                            disabled={!replyText[review.id]?.trim()}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            답글 작성
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReplyForm(review.id)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        답글 작성
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
