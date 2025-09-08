"use client";

import { useMemo, useState, useEffect } from "react";
import { getRepositoryContainer, getSettlementConfig } from "@/config/SettlementConfig";
import { SettlementService } from "@/services/settlement/SettlementService";
import { PaymentService } from "@/services/payment/PaymentService";
// import { getSettlementSummary } from "@/data/dummy/consultationHistory"; // 더미 데이터 제거
import type { PayoutItem, ExpertEarnings } from "@/types/settlement";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
  expertProfile?: any;
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
}

interface PayoutRequest {
  id: number;
  amount: number;
  fee: number;
  requestedAt: string;
  status: "pending" | "paid" | "rejected";
}

function formatCredits(n: number) {
  return `${n.toLocaleString()} 크레딧`;
}

const CREDIT_TO_KRW = 10; // 1 크레딧 = 10원
function formatKRW(n: number) {
  return `${n.toLocaleString()}원`;
}

// 매월 5일 정산 시스템 관련 함수들
function getNextSettlementDate(): Date {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  
  // 이번 달 5일이 지났으면 다음 달 5일, 아니면 이번 달 5일
  if (currentDay >= 5) {
    return new Date(currentYear, currentMonth + 1, 5);
  } else {
    return new Date(currentYear, currentMonth, 5);
  }
}

function getLastSettlementDate(): Date {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  
  // 이번 달 5일이 지났으면 이번 달 5일, 아니면 지난 달 5일
  if (currentDay >= 5) {
    return new Date(currentYear, currentMonth, 5);
  } else {
    return new Date(currentYear, currentMonth - 1, 5);
  }
}

function getDaysUntilSettlement(): number {
  const today = new Date();
  const nextSettlement = getNextSettlementDate();
  const diffTime = nextSettlement.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function PayoutsPage() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [feeRate] = useState(0.12); // 12% 수수료 (예시)
  const [nextSettlementDate, setNextSettlementDate] = useState<Date>(new Date());
  const [daysUntilSettlement, setDaysUntilSettlement] = useState<number>(0);
  
  // 새로운 정산 시스템 상태
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [expertEarnings, setExpertEarnings] = useState<ExpertEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpertId, setCurrentExpertId] = useState<number | null>(null);
  const [settlementSummary, setSettlementSummary] = useState<any>(null);

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
          setItems(result.data.items || []);
        }
      } catch (error) {
        console.error('상담 기록 로드 실패:', error);
      }
    };

    loadConsultations();
  }, []);

  // 출금 요청 로드
  useEffect(() => {
    const loadPayouts = async () => {
      try {
        const response = await fetch('/api/payouts');
        const result = await response.json();
        if (result.success) {
          setRequests(result.data.requests || []);
        }
      } catch (error) {
        console.error('출금 요청 로드 실패:', error);
      }
    };

    loadPayouts();
  }, []);

  // 출금 요청 추가 함수
  const addRequest = async (amount: number, fee: number) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addRequest', data: { amount, fee } })
      });
      const result = await response.json();
      if (result.success) {
        // 로컬 상태 업데이트
        setRequests(prev => [...prev, result.data.request]);
      }
    } catch (error) {
      console.error('출금 요청 추가 실패:', error);
    }
  };

  useEffect(() => {
    const nextDate = getNextSettlementDate();
    const daysLeft = getDaysUntilSettlement();
    setNextSettlementDate(nextDate);
    setDaysUntilSettlement(daysLeft);
    
    // 로그인된 전문가 정보에서 ID 추출 및 정산 데이터 로드
    if (appState.user && appState.user.role === 'expert' && appState.user.expertProfile) {
      const expertId = appState.user.id && typeof appState.user.id === 'string' 
        ? parseInt(appState.user.id.replace('expert_', '')) 
        : 0;
      if (expertId > 0) {
        setCurrentExpertId(expertId);
        loadSettlementData(expertId);
      }
    }
  }, [appState.user]);

  const loadSettlementData = async (expertId: number) => {
    try {
      setIsLoading(true);
      
      // 실제 API에서 정산 요약 정보를 가져오기
      try {
        const settlementResponse = await fetch(`/api/payouts?expertId=${expertId}`);
        if (settlementResponse.ok) {
          const settlementData = await settlementResponse.json();
          setSettlementSummary(settlementData.summary || null);
          console.log(`✅ Loaded settlement data for expert ${expertId}:`, settlementData.summary);
        } else {
          setSettlementSummary(null);
          console.log(`❌ Failed to load settlement data for expert ${expertId}`);
        }
      } catch (error) {
        console.error('정산 데이터 로드 실패:', error);
        setSettlementSummary(null);
      }
      
    } catch (error) {
      console.error('Failed to load settlement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completed = useMemo(
    () => items.filter((it) => it.status === "completed"),
    [items]
  );
  
  // 실제 정산 데이터 사용 (더미 데이터에서 로드)
  const gross = settlementSummary ? settlementSummary.totalGrossCredits : completed.reduce((acc, v) => acc + (v.amount || 0), 0);
  const totalFees = settlementSummary ? Math.floor(settlementSummary.totalPlatformFeeKrw / 10) : Math.round(gross * feeRate);
  const taxWithheld = settlementSummary ? Math.floor(settlementSummary.taxWithheldKrw / 10) : 0;
  const net = settlementSummary ? settlementSummary.netPayoutCredits : Math.max(0, gross - totalFees);

  const pendingAmount = useMemo(() => {
    const pendingSum = requests
      .filter((r) => r.status === "pending")
      .reduce((acc, r) => acc + (r.amount || 0), 0);
    return Math.max(0, net - pendingSum);
  }, [net, requests]);

  // 월별 집계 (전문가 매출/수수료/순수입)
  const currentYear = new Date().getFullYear();

  const months = useMemo(() => {
    const toDate = (d: string | Date | undefined) =>
      d ? new Date(d) : new Date(0);

    const completedThisYear = completed.filter((it) => {
      const d = toDate((it as any).date);
      return d.getFullYear() === currentYear;
    });

    const sums: number[] = Array.from({ length: 12 }, () => 0);
    completedThisYear.forEach((it) => {
      const d = toDate((it as any).date);
      const m = d.getMonth(); // 0~11
      sums[m] += (it as any).amount || 0;
    });

    const feeOf = (v: number) => Math.round(v * feeRate);
    const netOf = (v: number) => Math.max(0, v - feeOf(v));

    return sums.map((grossM, idx) => ({
      month: idx + 1,
      label: `${currentYear}년 ${idx + 1}월`,
      gross: grossM,
      fee: feeOf(grossM),
      net: netOf(grossM),
    }));
  }, [completed, currentYear, feeRate]);

  const incomeTaxWindow = useMemo(() => {
    // 종합소득세 신고/납부 기간: 통상 5/1 - 5/31
    // 2025년은 5/31이 토요일 → 익영업일인 6/2(월)까지 연장
    if (currentYear === 2025) return "5/1 - 6/2";
    return "5/1 - 5/31";
  }, [currentYear]);

  const handleRequestPayout = () => {
    if (pendingAmount <= 0) return;
    const fee = Math.round(pendingAmount * feeRate);
    addRequest(pendingAmount, fee);
    alert(`출금 요청이 접수되었습니다. 다음 정산일(${nextSettlementDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})에 처리됩니다.`);
  };

  const downloadCSV = () => {
    const headers = ["id", "date", "customer", "topic", "amount", "status"];
    const rows = completed.map((c) => [
      c.id,
      c.date,
      c.customer,
      c.topic,
      c.amount,
      c.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReceipt = (id: number) => {
    const content = `영수증\n요청 ID: ${id}\n발행일: ${new Date().toLocaleString()}\n액수: ${formatCredits(
      (requests.find((r) => r.id === id)?.amount || 0) as number
    )}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 현재 로그인된 전문가 정보 */}
        {appState.user && appState.user.expertProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {appState.user.name?.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-bold text-blue-900">{appState.user.name}</h2>
                  <p className="text-blue-700">{appState.user.expertProfile.specialty} • {appState.user.expertProfile.pricePerMinute?.toLocaleString()}원/분</p>
                  <div className="flex items-center mt-1 space-x-3 text-sm text-blue-600">
                    <span>레벨 {appState.user.expertProfile.level}</span>
                    <span>총 {appState.user.expertProfile.totalSessions}회 상담</span>
                    <span>평점 {appState.user.expertProfile.avgRating}⭐</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">로딩 상태</div>
                <div className={`font-medium ${isLoading ? 'text-orange-600' : 'text-green-600'}`}>
                  {isLoading ? '데이터 로딩 중...' : '데이터 로드 완료'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정산/출금</h1>
            <p className="text-gray-600 mt-1">
              완료된 상담 기준 정산 내역과 출금 요청을 관리합니다.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={downloadCSV}
              className="h-10 px-4 rounded-md border text-sm hover:bg-gray-50"
            >
              CSV 다운로드
            </button>
            {process.env.NODE_ENV === 'development' && appState.user && appState.user.expertProfile && (
              <button
                onClick={() => {
                  const expertId = parseInt(appState.user?.id?.replace('expert_', '') || '0');
                  if (expertId > 0) {
                    loadSettlementData(expertId);
                  }
                }}
                className="h-10 px-4 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
              >
                데이터 새로고침
              </button>
            )}
          </div>
        </div>

        {/* 정산 일정 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                매월 5일 정산 시스템
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>다음 정산일: <span className="font-semibold">{nextSettlementDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span></p>
                <p className="mt-1">
                  정산까지 <span className="font-semibold text-blue-900">{daysUntilSettlement}일</span> 남았습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">총 상담 수</div>
            <div className="text-xl font-bold text-gray-900">
              {settlementSummary ? settlementSummary.totalConsultations : completed.length}건
            </div>
            <div className="text-xs text-gray-400 mt-1">
              평균 {settlementSummary ? settlementSummary.avgDurationMin : 0}분
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">총 정산액(완료)</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCredits(gross)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {settlementSummary ? `${(settlementSummary.totalGrossKrw / 10000).toFixed(1)}만원` : ''}
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">플랫폼 수수료 (12%)</div>
            <div className="text-xl font-bold text-red-600">
              -{formatCredits(totalFees)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {settlementSummary ? `${(settlementSummary.totalPlatformFeeKrw / 10000).toFixed(1)}만원` : ''}
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">출금 가능액</div>
            <div className="text-xl font-bold text-green-600">
              {formatCredits(net)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              원천징수 후: {formatCredits(net - taxWithheld)}
            </div>
          </div>
        </div>

        {/* 출금 요청 */}
        <div className="bg-white border rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">출금 요청</div>
              <div className="text-xs text-gray-500">
                대기 중 요청을 제외한 잔여 가능액:{" "}
                {formatCredits(pendingAmount)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                매월 5일에 자동 정산 처리됩니다
              </div>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={pendingAmount <= 0}
              className={`h-10 px-4 rounded-md text-sm font-medium border ${
                pendingAmount > 0
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
              }`}
            >
              출금금액 확정하기
            </button>
          </div>
        </div>

        {/* 요청 이력 */}
        <div className="bg-white border rounded-lg mb-8">
          <div className="px-4 py-3 border-b font-medium text-gray-900">
            요청 이력
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2">요청ID</th>
                  <th className="px-4 py-2">요청일</th>
                  <th className="px-4 py-2">액수</th>
                  <th className="px-4 py-2">수수료</th>
                  <th className="px-4 py-2">상태</th>
                  <th className="px-4 py-2">정산 예정일</th>
                  <th className="px-4 py-2 text-right">영수증</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      요청 이력이 없습니다.
                    </td>
                  </tr>
                )}
                {requests.map((r) => {
                  // 요청일 기준으로 다음 정산일 계산
                  const requestDate = new Date(r.requestedAt);
                  const settlementDate = (() => {
                    const year = requestDate.getFullYear();
                    const month = requestDate.getMonth();
                    const day = requestDate.getDate();
                    
                    // 5일 이전 요청이면 이번 달 5일, 5일 이후 요청이면 다음 달 5일
                    if (day < 5) {
                      return new Date(year, month, 5);
                    } else {
                      return new Date(year, month + 1, 5);
                    }
                  })();
                  
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2">
                        {new Date(r.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{formatCredits(r.amount)}</td>
                      <td className="px-4 py-2">{formatCredits(r.fee)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : r.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {r.status === "pending" ? "대기중" : r.status === "paid" ? "완료" : "취소"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm text-gray-600">
                          {settlementDate.toLocaleDateString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => downloadReceipt(r.id)}
                          className="h-8 px-3 border rounded-md text-xs hover:bg-gray-50"
                        >
                          영수증 다운로드
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 세무 안내 (개인 프리랜서용) */}
        <div className="bg-white border rounded-lg p-4 mb-8">
          <div className="mb-3">
            <div className="font-medium text-gray-900">
              세무 안내 (개인 프리랜서)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              분기별 완료된 상담 기준으로 매출 합계를 집계했습니다. 일반과세자
              기준 부가세 신고 일정이며, 신고 기준과 공제 가능 비용은 사업 유형
              및 세무 처리 방식에 따라 상이할 수 있습니다.
            </div>
          </div>
          <div className="rounded-md border bg-amber-50 text-amber-800 text-sm p-3 mb-3">
            <span className="font-medium">
              {currentYear}년 종합소득세 신고/납부 기간:
            </span>
            <span className="ml-2">{incomeTaxWindow}</span>
            {currentYear === 2025 && (
              <span className="ml-1 text-[12px]">
                (5/31 토요일 → 익영업일 6/2 월요일까지)
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2">월</th>
                  <th className="px-4 py-2">매출 합계</th>
                  <th className="px-4 py-2">
                    수수료(예: {Math.round(feeRate * 100)}%)
                  </th>
                  <th className="px-4 py-2">순수입(참고)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="px-4 py-2">{m.label}</td>
                    <td className="px-4 py-2">{formatCredits(m.gross)}</td>
                    <td className="px-4 py-2">{formatCredits(m.fee)}</td>
                    <td className="px-4 py-2">{`${formatKRW(
                      m.net * CREDIT_TO_KRW
                    )} (${formatCredits(m.net)})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            참고: 실무상 신고 대상 금액(공급가액)은 플랫폼 수수료 차감 전 매출을
            기준으로 판단될 수 있으며, 수수료는 비용 처리 대상이 될 수 있습니다.
            정확한 신고는 세무 전문가와 상담하세요.
          </div>
        </div>
      </div>
    </div>
  );
}
