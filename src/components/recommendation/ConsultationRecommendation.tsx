"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface ConsultationRecommendationProps {
  consultationTopic?: string;
  consultationSummary?: string;
  showRecommendation?: boolean;
  isRecommendationCollapsed?: boolean;
  setIsRecommendationCollapsed?: (collapsed: boolean) => void;
}

const ConsultationRecommendation = ({
  consultationTopic,
  consultationSummary,
  showRecommendation = true,
  isRecommendationCollapsed = false,
  setIsRecommendationCollapsed,
}: ConsultationRecommendationProps) => {
  const router = useRouter();

  if (!showRecommendation) {
    return null;
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
      <div
        className={`p-6 transition-all duration-300 ease-in-out ${
          isRecommendationCollapsed ? "pb-4" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI 상담 기반 전문가 추천
            </h2>
          </div>
          <button
            onClick={() =>
              setIsRecommendationCollapsed &&
              setIsRecommendationCollapsed(!isRecommendationCollapsed)
            }
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          >
            {isRecommendationCollapsed ? (
              <>
                <span>펼치기</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <span>접기</span>
                <ChevronUp className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isRecommendationCollapsed
              ? "max-h-0 opacity-0"
              : "max-h-96 opacity-100"
          }`}
        >
          {consultationTopic && consultationSummary ? (
            // AI 상담을 진행한 경우
            <>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">상담 주제</h3>
                <p className="text-blue-700 font-medium">{consultationTopic}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">상담 요약</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line bg-white p-3 rounded border">
                  {consultationSummary}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  상담 내용을 바탕으로 관련 전문가들을 추천해드립니다.
                </p>
              </div>
            </>
          ) : (
            // AI 상담을 진행하지 않은 경우
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                맞춤형 전문가 추천을 받아보세요
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                AI 상담을 통해 고민을 분석하고,
                <br />
                상황에 맞는 전문가를 추천받을 수 있습니다.
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                AI Quick 상담 시작하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationRecommendation;
