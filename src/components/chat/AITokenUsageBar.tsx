"use client";

import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface TokenUsageData {
  remainingTokens: number;
  usedTokens: number;
  totalTokens: number;
  remainingPercent: number;
  monthlyFreeTokens: number;
  estimatedTurns: number;
  usedTurns: number;
  remainingTurns: number;
  nextResetDate: string;
  creditToTokens: number;
  creditToKRW: number;
  tokensToKRW: number;
  creditDiscount: number;
}

interface AITokenUsageBarProps {
  userId: string;
  isExtended?: boolean;
  onTurnConsumed?: () => void;
  showTurnAlert?: boolean;
  compact?: boolean; // 채팅 페이지용 컴팩트 모드
}

const AITokenUsageBar: React.FC<AITokenUsageBarProps> = ({
  userId,
  isExtended = false,
  onTurnConsumed,
  showTurnAlert = false,
  compact = false,
}) => {
  const [tokenData, setTokenData] = useState<TokenUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConsumptionAlert, setShowConsumptionAlert] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // AI 사용량 데이터 가져오기
  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        const response = await fetch('/api/ai-usage');
        const result = await response.json();
        
        if (result.success) {
          const data = result.data;
          setTokenData({
            remainingTokens: data.summary.remainingFreeTokens + data.summary.remainingPurchasedTokens,
            usedTokens: data.usedTokens,
            totalTokens: data.summary.totalTokens,
            remainingPercent: data.remainingPercent,
            monthlyFreeTokens: data.summary.freeTokens,
            estimatedTurns: data.summary.totalEstimatedTurns,
            usedTurns: data.totalTurns,
            remainingTurns: data.summary.totalEstimatedTurns,
            nextResetDate: data.summary.nextResetDate,
            creditToTokens: data.summary.creditToTokens,
            creditToKRW: data.summary.creditToKRW,
            tokensToKRW: data.summary.tokensToKRW,
            creditDiscount: data.summary.creditDiscount
          });
        }
      } catch (error) {
        console.error('토큰 사용량 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenUsage();
  }, [userId]);

  // 턴 소모 시 애니메이션
  useEffect(() => {
    if (showTurnAlert) {
      setShowConsumptionAlert(true);
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
      setTimeout(() => {
        setShowConsumptionAlert(false);
      }, 3000);
    }
  }, [showTurnAlert]);

  if (isLoading || !tokenData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // 다음 리셋까지 남은 시간 계산
  const getNextResetTime = () => {
    const now = new Date();
    const nextReset = new Date(tokenData.nextResetDate);
    const diff = nextReset.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  const { days, hours } = getNextResetTime();

  // 진행률 바 생성
  const createProgressBar = (percent: number) => {
    const filledBlocks = Math.floor(percent / 10);
    const emptyBlocks = 10 - filledBlocks;
    
    return (
      <div className="flex space-x-1">
        {Array.from({ length: filledBlocks }, (_, i) => (
          <div key={`filled-${i}`} className="w-3 h-3 bg-blue-500 rounded-full"></div>
        ))}
        {Array.from({ length: emptyBlocks }, (_, i) => (
          <div key={`empty-${i}`} className="w-3 h-3 bg-gray-200 rounded-full"></div>
        ))}
      </div>
    );
  };

  // 컴팩트 모드 (채팅 페이지용)
  if (compact) {
    return (
      <div className="relative">
        {/* 간단한 토큰 표시 */}
        <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 px-4 py-2">
          {/* 원형 진행률 표시줄 */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              {/* 배경 원 */}
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
              />
              {/* 진행률 원 */}
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - tokenData.remainingPercent / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />
            </svg>
          </div>
          
          {/* 퍼센트 텍스트 */}
          <span className="text-sm font-semibold text-gray-700">
            {tokenData.remainingPercent}%
          </span>
          

        </div>

        {/* 호버 시 상세 정보 툴팁 */}
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[250px] z-50 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
          <div className="space-y-2">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">
                남은 토큰: {tokenData.remainingTokens.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                ≈ {tokenData.remainingTurns}턴 대화 가능
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                다음 리셋까지 {days}일 {hours}시간
              </p>
            </div>
            
            {/* 토큰이 0%일 때만 크레딧 구매 안내 표시 */}
            {tokenData.remainingPercent === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">
                    토큰이 부족합니다
                  </span>
                </div>
                <p className="text-xs text-amber-700 text-center mb-2">
                  크레딧을 구매하여 추가 AI 상담을 받으세요
                </p>
                <div className="text-center">
                  <button 
                    onClick={() => window.location.href = '/credit-packages'}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    크레딧 구매
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 전체 모드 (기존)
  return (
    <div className="space-y-4">
      {/* 턴 소모 알림 */}
      {showConsumptionAlert && (
        <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg transform transition-all duration-500 ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">무료 턴 1개가 소모됩니다!</span>
          </div>
          <p className="text-sm text-center mt-1 opacity-90">
            남은 무료 턴: {tokenData.remainingTurns - 1}개
          </p>
        </div>
      )}

      {/* 메인 토큰 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {/* 이번 달 무료 토큰 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              이번 달 무료 토큰
            </h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {tokenData.remainingTokens.toLocaleString()}
            </div>
            <p className="text-gray-600">
              ≈ 약 {tokenData.remainingTurns}턴 대화 가능
            </p>
          </div>

          {/* 진행률 표시 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              무료 제공량 {Math.round(100 - tokenData.remainingPercent)}% 사용 완료
            </p>
            <div className="flex justify-center mb-2">
              {createProgressBar(100 - tokenData.remainingPercent)}
            </div>
            <p className="text-sm text-gray-600">
              {tokenData.remainingTurns}턴 남음
            </p>
          </div>

          {/* 상세 사용량 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-center">
              이번 달 무료 대화: {Math.floor(tokenData.monthlyFreeTokens / 900)}턴
            </h4>
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                현재까지: {tokenData.usedTurns}턴 사용 ({Math.floor(tokenData.monthlyFreeTokens / 900) - tokenData.usedTurns}턴 남음)
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4" />
                <span>다음 리셋까지 {days}일 {hours}시간</span>
              </div>
            </div>
          </div>

          {/* 크레딧 충전 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">더 많은 대화가 필요하다면</span>
            </div>
            <p className="text-blue-700 text-center">
              100크레딧(₩1,000)으로 토큰을 충전하세요
            </p>
            <div className="mt-3 text-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                크레딧 구매하기
              </button>
            </div>
          </div>

          {/* 크레딧 할인 정보 */}
          <div className="text-center text-sm text-gray-500">
            <p>크레딧 구매 시 {tokenData.creditDiscount}% 할인 혜택</p>
            <p>1크레딧 = ₩{tokenData.creditToKRW} = {tokenData.creditToTokens.toLocaleString()}토큰</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITokenUsageBar;
