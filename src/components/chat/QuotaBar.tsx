"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { MONTHLY_FREE_BUDGET_CREDITS } from "../../constants/aiQuota";

interface AIUsageState {
  usedCredits: number;
  purchasedCredits: number;
  remainingPercent: number;
  monthlyResetDate: string;
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
}

interface QuotaBarProps {
  isExtended?: boolean;
}

const QuotaBar: React.FC<QuotaBarProps> = ({ isExtended = false }) => {
  const [aiUsage, setAiUsage] = useState<AIUsageState>({
    usedCredits: 0,
    purchasedCredits: 0,
    remainingPercent: 100,
    monthlyResetDate: new Date().toISOString(),
    totalTurns: 0,
    totalTokens: 0,
    averageTokensPerTurn: 0
  });

  // AI 사용량 로드
  useEffect(() => {
    const loadAIUsage = async () => {
      try {
        const response = await fetch('/api/ai-usage');
        const result = await response.json();
        if (result.success) {
          setAiUsage(result.data);
        }
      } catch (error) {
        console.error('AI 사용량 로드 실패:', error);
      }
    };

    loadAIUsage();
  }, []);

  const { remainingPercent, usedCredits } = aiUsage;

  // 실제 남은 크레딧 계산 (대화연장 시 50크레딧 추가)
  const remainingCredits = Math.max(
    0,
    MONTHLY_FREE_BUDGET_CREDITS - usedCredits + (isExtended ? 50 : 0),
  );

  // 대화연장 시 퍼센트도 증가하도록 계산 (350크레딧 기준)
  const adjustedRemainingPercent = isExtended
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            100 * (1 - (usedCredits - 50) / (MONTHLY_FREE_BUDGET_CREDITS + 50)),
          ),
        ),
      )
    : remainingPercent;

  return (
    <div className="space-y-3">
      {/* 월간 무료 크레딧 정보 */}
      <div className="text-lg font-bold text-gray-800 text-center">
        {remainingCredits}
        {isExtended && (
          <div className="text-xs text-green-600 mt-1">
            +50 크레딧 (대화연장)
          </div>
        )}
      </div>

      {/* 크레딧 진행률 바 */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="bg-divider h-1 rounded">
            <div
              className="bg-accent h-1 rounded transition-all duration-300"
              style={{ width: `${adjustedRemainingPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {adjustedRemainingPercent}% 남음
          </span>
          <div
            className="flex items-center space-x-1"
            title="📊 크레딧 차감 방식:

• 기본 크레딧: 턴당 3크레딧
• 응답 길이에 따른 추가 차감:
  - 400토큰 이하: +0크레딧 (총 3크레딧)
  - 800토큰 이하: +1.5크레딧 (총 4.5크레딧)
  - 1200토큰 이하: +3크레딧 (총 6크레딧)
  - 1200토큰 초과: +6크레딧 (총 9크레딧)
• 정밀 모드: 추가 1.5배

💡 짧은 질문/응답은 사용량이 적고, 장문이나 정밀 모드 응답은 더 많이 차감됩니다."
          >
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaBar;
