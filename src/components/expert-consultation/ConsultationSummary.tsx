"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Download,
  Star,
  MessageCircle,
  Phone,
  Video,
  FileText,
  Calendar,
  ArrowRight,
  Share2,
} from "lucide-react";

interface ConsultationSummaryProps {
  consultation: {
    id: string;
    expertName: string;
    expertSpecialty: string;
    topic: string;
    duration: number;
    consultationType: "chat" | "voice" | "video";
    price: number;
    description?: string;
  };
  sessionData: {
    duration: number;
    isRecorded: boolean;
    chatMessageCount?: number;
  };
  onClose: () => void;
}

export default function ConsultationSummary({
  consultation,
  sessionData,
  onClose,
}: ConsultationSummaryProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleSubmitReview = async () => {
    try {
      // 리뷰 제출 로직
      console.log("리뷰 제출:", { rating, review });
      
      // 여기에 실제 리뷰 API 호출 로직을 추가할 수 있습니다
      // const response = await fetch('/api/reviews', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     consultationId: consultation.id,
      //     expertId: consultation.expertId,
      //     rating,
      //     content: review,
      //     // 기타 필요한 데이터
      //   })
      // });
      
      // 리뷰 제출 성공 시 전문가 데이터 업데이트 이벤트 발생
      try {
        window.dispatchEvent(new CustomEvent('expertDataUpdated', {
          detail: { 
            expertId: consultation.id,
            action: 'reviewSubmitted',
            rating,
            review 
          }
        }));
      } catch (error) {
        console.error('이벤트 발생 실패:', error);
      }
      
      setShowReviewForm(false);
      
      // 성공 메시지 표시
      alert('리뷰가 성공적으로 제출되었습니다!');
    } catch (error) {
      console.error('리뷰 제출 실패:', error);
      alert('리뷰 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDownloadTranscript = () => {
    // 상담 기록 다운로드 로직
    console.log("상담 기록 다운로드");
  };

  const handleShareSession = () => {
    // 상담 내용 공유 로직
    console.log("상담 내용 공유");
  };

  const handleBookFollowUp = () => {
    // 후속 상담 예약 페이지로 이동
    router.push("/experts");
  };

  const getConsultationTypeIcon = () => {
    switch (consultation.consultationType) {
      case "chat":
        return <MessageCircle className="w-5 h-5" />;
      case "voice":
        return <Phone className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getConsultationTypeLabel = () => {
    switch (consultation.consultationType) {
      case "chat":
        return "채팅 상담";
      case "voice":
        return "음성 상담";
      case "video":
        return "화상 상담";
      default:
        return "상담";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 완료 헤더 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상담이 완료되었습니다</h1>
          <p className="text-lg text-gray-600">
            {consultation.expertName} 전문가와의 상담이 성공적으로 완료되었습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 상담 요약 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">상담 요약</h2>
              
              <div className="space-y-6">
                {/* 전문가 정보 */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {consultation.expertName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{consultation.expertName} 전문가</h3>
                    <p className="text-sm text-gray-600">{consultation.expertSpecialty}</p>
                  </div>
                </div>

                {/* 상담 세부사항 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">상담 주제</span>
                    </div>
                    <p className="text-gray-900">{consultation.topic}</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      {getConsultationTypeIcon()}
                      <span className="text-sm font-medium text-gray-700">상담 방식</span>
                    </div>
                    <p className="text-gray-900">{getConsultationTypeLabel()}</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">실제 상담 시간</span>
                    </div>
                    <p className="text-gray-900">{Math.floor(sessionData.duration / 60)}분 {sessionData.duration % 60}초</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">상담료</span>
                    </div>
                    <p className="text-gray-900">{consultation.price} 크레딧</p>
                  </div>
                </div>

                {/* 상담 주제 설명 */}
                {consultation.description && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">상담 주제</h4>
                    <p className="text-gray-600">{consultation.description}</p>
                  </div>
                )}

                {/* 추가 정보 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">상담 기록</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    {sessionData.isRecorded && (
                      <p>• 상담 내용이 녹화되었습니다</p>
                    )}
                    {consultation.consultationType === "chat" && sessionData.chatMessageCount && (
                      <p>• 총 {sessionData.chatMessageCount}개의 메시지가 교환되었습니다</p>
                    )}
                    <p>• 상담 요약 및 기록을 다운로드할 수 있습니다</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바: 액션 및 리뷰 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 빠른 액션 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">빠른 액션</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadTranscript}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4" />
                    <span>상담 기록 다운로드</span>
                  </button>
                  
                  <button
                    onClick={handleShareSession}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>상담 내용 공유</span>
                  </button>
                  
                  <button
                    onClick={handleBookFollowUp}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>후속 상담 예약</span>
                  </button>
                </div>
              </div>

              {/* 리뷰 작성 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">상담 평가</h3>
                
                {!showReviewForm ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      이번 상담에 대한 평가를 남겨주세요
                    </p>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      리뷰 작성하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 별점 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        만족도
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleRatingClick(value)}
                            className={`p-1 ${
                              value <= rating ? "text-yellow-400" : "text-gray-300"
                            } hover:text-yellow-400`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 리뷰 텍스트 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상담 후기
                      </label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="상담에 대한 후기를 작성해주세요..."
                      />
                    </div>

                    {/* 제출 버튼 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        disabled={rating === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        제출
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 다음 단계 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="font-medium text-blue-900 mb-3">다음 단계</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>상담 내용을 정리하고 다음 액션 계획을 세워보세요</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>필요시 후속 상담을 예약하여 지속적인 도움을 받으세요</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>상담 내용을 메모하고 실생활에 적용해보세요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            상담 목록으로 돌아가기
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
