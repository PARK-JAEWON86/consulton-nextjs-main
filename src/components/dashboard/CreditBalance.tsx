"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, History, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { eventBus, CREDIT_EVENTS } from "@/utils/eventBus";

interface CreditBalanceProps {
  credits: number;
  userId?: string;
}

interface AIUsageData {
  usedCredits: number;
  purchasedCredits: number;
  remainingPercent: number;
  monthlyResetDate: string;
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
  summary: {
    totalCredits: number;
    freeCredits: number;
    usedFreeCredits: number;
    usedPurchasedCredits: number;
    remainingFreeCredits: number;
    remainingPurchasedCredits: number;
    nextResetDate: string;
  };
}

interface CreditHistoryItem {
  id: number;
  type: "used" | "purchased" | "bonus";
  amount: number;
  description: string;
  date: Date;
  expertName?: string;
  transactionId?: string;
}

const CreditBalance = ({ credits }: CreditBalanceProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [aiUsageData, setAiUsageData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(credits);

  // credits prop이 변경될 때 currentCredits 상태 업데이트
  useEffect(() => {
    if (credits !== undefined && credits !== null) {
      setCurrentCredits(credits);
    }
  }, [credits]);

  // 이벤트 기반 새로고침 함수 (훅 대신 직접 구현)
  const registerRefreshFunction = useCallback((refreshFn: () => void) => {
    // 이벤트 리스너 등록
    const handleEvent = () => refreshFn();
    const unsubscribe = eventBus.subscribe(CREDIT_EVENTS.AI_USAGE_UPDATED, handleEvent);
    
    // 클린업 함수 반환
    return unsubscribe;
  }, []);

  const fetchAIUsageData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-usage', {
        // 캐시 방지
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setAiUsageData(data.data);
      } else {
        throw new Error(data.error || 'AI 사용량 조회에 실패했습니다.');
      }
    } catch (err) {
      setError("AI 사용량 데이터를 불러올 수 없습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAIUsageData();
    // 자동 새로고침 제거 - 사용자 액션 시에만 새로고침
  }, [fetchAIUsageData]);

  // 이벤트 기반 새로고침 등록
  useEffect(() => {
    registerRefreshFunction(fetchAIUsageData);
  }, [registerRefreshFunction]);

  // 실제 크레딧 거래 내역 데이터 (API에서 가져와야 함)
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>([]);

  // 크레딧 거래 내역 로드
  useEffect(() => {
    const loadCreditHistory = async () => {
      try {
        // 메인 API 사용
        const response = await fetch('/api/credit-transactions?limit=5');
        const data = await response.json();
        
        if (data.success) {
          // 크레딧 잔액은 props에서 받은 값 사용, API의 currentBalance는 무시
          // setCurrentCredits(data.data.currentBalance); // 이 줄 제거
          
          const transactions = data.data.transactions.map((txn: any) => ({
            id: txn.id,
            type: txn.type === 'earn' ? 'purchased' : 'used',
            amount: txn.amount,
            description: txn.description,
            date: new Date(txn.createdAt),
            expertName: txn.type === 'spend' ? txn.description.split(' - ')[1]?.split(' (')[0] : undefined,
            transactionId: txn.id,
          }));
          
          setCreditHistory(transactions);
        }
      } catch (error) {
        console.error('크레딧 거래 내역 로드 실패:', error);
        // 에러 시 더미 데이터 사용
        setCreditHistory([
          {
            id: 1,
            type: "used",
            amount: -150,
            description: "전문가 상담 - 김민수 (진로상담)",
            date: new Date("2024-01-10T14:20:00"),
            expertName: "김민수 전문가",
          },
          {
            id: 2,
            type: "purchased",
            amount: +5500,
            description: "베이직 충전 패키지 (5,000 + 500 보너스 크레딧)",
            date: new Date("2024-01-15T10:30:00"),
            transactionId: "ct_001",
          },
          {
            id: 3,
            type: "used",
            amount: -120,
            description: "전문가 상담 - 박지영 (심리상담)",
            date: new Date("2024-01-08T16:45:00"),
            expertName: "박지영 전문가",
          },
          {
            id: 4,
            type: "purchased",
            amount: +9200,
            description: "스탠다드 충전 패키지 (8,000 + 1,200 보너스 크레딧)",
            date: new Date("2024-01-05T09:15:00"),
            transactionId: "ct_004",
          },
        ]);
      }
    };

    // 인증 상태와 관계없이 로드 (실제로는 인증 확인 필요)
    loadCreditHistory();
  }, []);

  const handlePurchaseCredits = () => {
    // 결제 및 크레딧 페이지로 이동
    window.location.href = '/credit-packages';
  };

  const getBalanceColor = (credits: number | undefined) => {
    if (!credits || credits <= 0) return "text-red-600";
    if (credits > 100) return "text-green-600";
    if (credits > 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getBalanceIcon = (credits: number | undefined) => {
    if (!credits || credits <= 0) return "🔴";
    if (credits > 100) return "🟢";
    if (credits > 50) return "🟡";
    return "🔴";
  };

  // 사용가능한 상담 시간 계산 (분 단위)
  const getAvailableMinutes = (credits: number | undefined) => {
    if (!credits || credits <= 0) return 0;
    return Math.round(credits / 150);
  };

  // 게이지바 색상 결정
  const getGaugeColor = (credits: number | undefined) => {
    const minutes = getAvailableMinutes(credits);
    if (minutes >= 10) return "bg-blue-600";
    if (minutes >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  // 크레딧 충전 권유 메시지 표시 여부
  const shouldShowTopupRecommendation = (credits: number | undefined) => {
    return getAvailableMinutes(credits) < 10;
  };

  // 안전한 크레딧 표시 함수
  const safeDisplayCredits = (credits: number | undefined) => {
    if (credits === undefined || credits === null) return '0';
    return credits.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">크레딧 잔액을 불러오는 중입니다...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32 text-red-600">
          <Zap className="h-8 w-8" />
          <span className="ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (!aiUsageData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32 text-gray-600">
          <CreditCard className="h-8 w-8" />
          <span className="ml-2">AI 사용량 데이터를 불러올 수 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 gap-8">
        {/* 크레딧 잔액 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">크레딧 잔액</h2>
                <p className="text-sm text-gray-600">
                  상담 서비스 이용 가능 크레딧
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                console.log('크레딧 히스토리 토글:', !showHistory);
                setShowHistory(!showHistory);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <History className="h-5 w-5" />
            </button>
          </div>

          {/* 크레딧 잔액 표시 */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getBalanceIcon(currentCredits)}</span>
              <div>
                <div className={`text-3xl font-bold ${getBalanceColor(currentCredits)}`}>
                  {safeDisplayCredits(currentCredits)}
                </div>
                <div className="text-sm text-gray-500">사용 가능 크레딧</div>
              </div>
            </div>

            <button
              onClick={handlePurchaseCredits}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ${
                shouldShowTopupRecommendation(currentCredits) ? 'ring-2 ring-blue-400 ring-opacity-75 animate-pulse' : ''
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>충전하기</span>
            </button>
          </div>

          {/* 사용가능한 상담 시간 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                사용가능한 상담 시간
              </span>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">
                약 {getAvailableMinutes(currentCredits)}분
              </span>
              <span className="text-sm text-gray-500">
                평균 150크레딧/분 기준
              </span>
            </div>
            <div className="mb-2 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getGaugeColor(currentCredits)}`}
                style={{ width: `${Math.min(((currentCredits || 0) / 150) / 10 * 100, 100)}%` }}
              ></div>
            </div>
            <div className="mb-2 text-xs text-gray-500">
              현재 {safeDisplayCredits(currentCredits)} 크레딧으로 상담 가능
            </div>
            
            {/* 크레딧 충전 권유 메시지 */}
            {shouldShowTopupRecommendation(currentCredits) && (
              <div className="mt-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-orange-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      상담 시간이 부족합니다!
                    </p>
                    <p className="text-xs text-orange-700">
                      {getAvailableMinutes(currentCredits)}분 남음 • 지금 충전하고 더 많은 상담을 받아보세요
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* 크레딧 히스토리 */}
      {showHistory && (
        <div className="border-t pt-3 mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">최근 내역</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {creditHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        item.type === "used"
                          ? "text-red-600"
                          : item.type === "purchased"
                            ? "text-blue-600"
                            : "text-green-600"
                      }`}
                    >
                      {item.type === "used"
                        ? "사용"
                        : item.type === "purchased"
                          ? "구매"
                          : "보너스"}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.date.toLocaleDateString("ko-KR")}
                    {item.expertName && ` • ${item.expertName}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-sm font-semibold ${
                      item.type === "used" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {item.type === "used" ? "-" : "+"}
                    {Math.abs(item.amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">크레딧</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경고 메시지 */}
      {currentCredits < 30 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                크레딧이 부족합니다
              </p>
              <p className="text-sm text-yellow-700">
                원활한 서비스 이용을 위해 크레딧을 충전해 주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBalance;
