"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MessageCircle } from "lucide-react";
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
// import { getRequestsByExpert, getRequestStats, getRequestsByStatus, type ConsultationRequest } from "@/data/dummy/consultationRequests"; // 더미 데이터 제거
// API를 통한 전문가 데이터 처리로 변경
import { format } from "date-fns";
import { useRouter } from "next/navigation";
// 전문가 프로필은 전용 라우트에서 관리합니다

type ConsultationType = "video" | "chat" | "voice";

type Availability = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  { available: boolean; hours: string }
>;

type PortfolioFile = {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
};

type ExpertProfileData = {
  isProfileComplete?: boolean;
  name: string;
  specialty: string;
  experience: number | string;
  description: string;
  education: string[];
  certifications: string[];
  specialties: string[];
  consultationTypes: ConsultationType[];
  languages: string[];
  hourlyRate: number | string;
  totalSessions: number;
  avgRating: number;
  availability: Availability;
  contactInfo: {
    phone: string;
    email: string;
    location: string;
    website: string;
  };
  profileImage: string | null;
  portfolioFiles: PortfolioFile[];
};

export default function ExpertDashboardProfilePage() {
  const [initialData, setInitialData] = useState<
    Partial<ExpertProfileData> & { isProfileComplete?: boolean }
  >();
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const router = useRouter();
  
  // 상담 요청 데이터
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState<any>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  type PeriodKey = "today" | "last7" | "last30" | "thisMonth" | "lastWeek";
  const [period, setPeriod] = useState<PeriodKey>("lastWeek");

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

  const { user } = appState;

  const getRange = (key: PeriodKey): { start: Date; end: Date } => {
    const now = new Date();
    if (key === "today") {
      const d = new Date();
      return {
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        end: d,
      };
    }
    if (key === "last7") {
      const end = now;
      const start = new Date();
      start.setDate(end.getDate() - 6);
      return { start, end };
    }
    if (key === "last30") {
      const end = now;
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start, end };
    }
    if (key === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    }
    // lastWeek: Monday~Sunday of the previous week (approx using 7 days window ending yesterday)
    const end = new Date(now);
    end.setDate(now.getDate() - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end };
  };

  const { start: currentStart, end: currentEnd } = getRange(period);
  const windowDays = Math.max(
    1,
    Math.round(
      (currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1
  );
  const { prevStart, prevEnd } = useMemo(() => {
    const pStart = new Date(currentStart);
    const pEnd = new Date(currentStart);
    pStart.setDate(currentStart.getDate() - windowDays);
    pEnd.setDate(currentStart.getDate() - 1);
    return { prevStart: pStart, prevEnd: pEnd };
  }, [currentStart, windowDays]);

  function inRange(dateISO: string, start: Date, end: Date) {
    const ts = new Date(dateISO).getTime();
    return ts >= new Date(start).getTime() && ts <= new Date(end).getTime();
  }

  const completedInRange = useMemo(
    () =>
      items.filter(
        (it) =>
          it.status === "completed" &&
          inRange(it.date, currentStart, currentEnd)
      ),
    [items, currentStart, currentEnd]
  );
  const completedPrevRange = useMemo(
    () =>
      items.filter(
        (it) =>
          it.status === "completed" && inRange(it.date, prevStart, prevEnd)
      ),
    [items, prevStart, prevEnd]
  );

  const sum = (arr: { amount: number }[]) =>
    arr.reduce((acc, v) => acc + (v.amount || 0), 0);
  const totalRevenue = sum(completedInRange);
  const prevRevenue = sum(completedPrevRange);
  const avgOrder =
    completedInRange.length > 0
      ? Math.round(totalRevenue / completedInRange.length)
      : 0;
  const prevAvgOrder =
    completedPrevRange.length > 0
      ? Math.round(prevRevenue / completedPrevRange.length)
      : 0;
  const sold = completedInRange.length;
  const prevSold = completedPrevRange.length;

  const percentChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10; // 0.1 단위 반올림
  };

  const changeRevenue = percentChange(totalRevenue, prevRevenue);
  const changeAvg = percentChange(avgOrder, prevAvgOrder);
  const changeSold = percentChange(sold, prevSold);

  useEffect(() => {
    const loadData = async () => {
      try {
      const stored = localStorage.getItem("approvedExpertProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setInitialData({
          ...parsed,
          isProfileComplete: Boolean(parsed?.isProfileComplete),
        });
      } else {
        // 기본 빈 상태
        setInitialData({
          name: "",
          specialty: "",
          experience: 0,
          description: "",
          education: [""],
          certifications: [""],
          specialties: [""],
          consultationTypes: [],
          languages: ["한국어"],
          hourlyRate: "",
          totalSessions: 0,
          avgRating: 0,
          availability: {
            monday: { available: false, hours: "09:00-18:00" },
            tuesday: { available: false, hours: "09:00-18:00" },
            wednesday: { available: false, hours: "09:00-18:00" },
            thursday: { available: false, hours: "09:00-18:00" },
            friday: { available: false, hours: "09:00-18:00" },
            saturday: { available: false, hours: "09:00-18:00" },
            sunday: { available: false, hours: "09:00-18:00" },
          },
          contactInfo: { phone: "", email: "", location: "", website: "" },
          profileImage: null,
          portfolioFiles: [],
          isProfileComplete: false,
        });
      }
    } catch {
      // ignore
    }
    
    // 상담 요청 데이터 로드 및 중앙 서비스 동기화
    if (user && user.role === 'expert') {
      const expertId = user.id && typeof user.id === 'string' 
        ? parseInt(user.id.replace('expert_', '')) 
        : 0;
      if (expertId > 0) {
        // API를 통한 최신 전문가 데이터 확인
        try {
          const response = await fetch(`/api/expert-profiles/${expertId}`);
          if (response.ok) {
            const latestProfile = await response.json();
            console.log('🔄 전문가 대시보드 - API 데이터 동기화:', {
              expertId,
              name: latestProfile.name,
              experience: latestProfile.experience,
              totalSessions: latestProfile.totalSessions
            });
          }
        } catch (error) {
          console.error('전문가 프로필 로드 실패:', error);
        }
        
        // 실제 API에서 상담 요청 데이터를 가져오기
        try {
          setIsLoadingRequests(true);
          const requestsResponse = await fetch(`/api/consultation-requests?expertId=${expertId}`);
          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            setRequests(requestsData.requests || []);
            setRequestStats(requestsData.stats || null);
          } else {
            setRequests([]);
            setRequestStats(null);
          }
        } catch (error) {
          console.error('상담 요청 데이터 로드 실패:', error);
          setRequests([]);
          setRequestStats(null);
        } finally {
          setIsLoadingRequests(false);
        }
      }
    }
    };
    
    loadData();
  }, [user]);

  // 프로필 편집은 전용 페이지에서 처리합니다.

  if (!initialData) return null;



  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 오버뷰 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                안녕하세요, {user?.name || initialData?.name || "전문가"}님
              </h1>
              <p className="text-gray-600 mt-1">전문가 대시보드</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="lastWeek">지난주</option>
              <option value="today">오늘</option>
              <option value="last7">최근 7일</option>
              <option value="last30">최근 30일</option>
              <option value="thisMonth">이번 달</option>
            </select>
          </div>

          {/* 로그인된 전문가 정보 표시 */}
          {user && user.role === 'expert' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {user.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-blue-900">{user.name} (전문가)</h2>
                    <div className="flex items-center mt-2 space-x-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded flex items-center justify-center min-w-[80px] whitespace-nowrap">
                        전문가
                      </span>
                      <span className="text-blue-600">
                        상담 가능
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600 mb-2">이메일</div>
                  <div className="font-medium text-blue-900">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* 상담 요청 관리 KPI 카드 */}
          {requestStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* 전체 요청 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-600 mb-2">전체 요청</div>
                <div className="text-2xl font-bold text-gray-900">
                  {requestStats.totalRequests} 건
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  총 예산: {requestStats.totalBudget.toLocaleString()} 크레딧
                </div>
              </div>

              {/* 신규 요청 (대기 중) */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-600 mb-2">신규 요청</div>
                <div className="text-2xl font-bold text-orange-600">
                  {requestStats.pendingRequests} 건
                </div>
                <div className="mt-2 text-xs inline-flex items-center px-3 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 whitespace-nowrap">
                  {requestStats.urgentRequests}건 긴급
                </div>
              </div>

              {/* 요청 수락 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-600 mb-2">요청 수락</div>
                <div className="text-2xl font-bold text-green-600">
                  {requestStats.acceptedRequests} 건
                </div>
                <div className="mt-2 text-xs inline-flex items-center px-3 py-0.5 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap">
                  수락률 {requestStats.acceptanceRate}%
                </div>
              </div>

              {/* 완료된 상담 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-600 mb-2">완료된 상담</div>
                <div className="text-2xl font-bold text-blue-600">
                  {requestStats.completedRequests} 건
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  평균 {requestStats.avgBudget.toLocaleString()} 크레딧
                </div>
              </div>
            </div>
          )}

          {/* 상담 요청 관리 섹션 */}
          {requests.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* 신규 요청 목록 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    신규 상담 요청
                  </h3>
                  <span className="text-sm text-gray-500">최신순</span>
                </div>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">상담 요청을 불러오는 중...</p>
                    </div>
                  </div>
                ) : (() => {
                  // 실제 API에서 대기 중인 상담 요청을 가져오기
                  const pendingRequests = requests.filter((req: any) => req.status === 'pending');
                  
                  return pendingRequests.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {pendingRequests.map((req) => (
                        <li key={req.id} className="py-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {req.clientName} · {req.topic}
                                </div>
                                {req.priority === 'urgent' && (
                                  <span className="px-3 py-0.5 text-xs bg-red-100 text-red-700 rounded-full flex items-center justify-center whitespace-nowrap">
                                    긴급
                                  </span>
                                )}
                                {req.priority === 'high' && (
                                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                    높음
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                {req.description.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                {format(new Date(req.requestedAt), "MM/dd HH:mm")} · 
                                {req.consultationType} · {req.duration}분 · 
                                {req.budget.toLocaleString()}크레딧
                              </div>
                            </div>
                            <div className="ml-4 flex gap-2">
                              <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                                수락
                              </button>
                              <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                거절
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-3">
                        <MessageCircle className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-sm">새로운 상담 요청이 없습니다</p>
                      <p className="text-gray-400 text-xs mt-1">새로운 요청이 오면 여기에 표시됩니다</p>
                    </div>
                  );
                })()}
              </div>

              {/* 요청 통계 요약 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  요청 현황
                </h3>
                {requestStats && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">대기 중</span>
                      <span className="font-semibold text-orange-600">
                        {requestStats.pendingRequests}건
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">수락됨</span>
                      <span className="font-semibold text-green-600">
                        {requestStats.acceptedRequests}건
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">완료됨</span>
                      <span className="font-semibold text-blue-600">
                        {requestStats.completedRequests}건
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">거절됨</span>
                      <span className="font-semibold text-gray-600">
                        {requestStats.rejectedRequests}건
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">수락률</span>
                        <span className="font-semibold text-gray-900">
                          {requestStats.acceptanceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t text-xs text-gray-500">
                      전체 요청 관리는 상담내역 페이지에서 확인하세요.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 빠른 액션 버튼 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                빠른 액션
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard/expert/consultations")}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  전체 요청 관리
                </button>
                <button
                  onClick={() => router.push("/dashboard/expert/profile")}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  프로필 수정
                </button>
                <button
                  onClick={() => router.push("/dashboard/expert/payouts")}
                  className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  정산/출금 확인
                </button>
              </div>
            </div>

            {/* 오늘의 일정 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                오늘의 일정
              </h3>
              {(() => {
                const today = new Date();
                const todayScheduled = items.filter(item => {
                  const itemDate = new Date(item.date);
                  return item.status === 'scheduled' && 
                         itemDate.toDateString() === today.toDateString();
                });
                
                return todayScheduled.length > 0 ? (
                  <div className="space-y-2">
                    {todayScheduled.slice(0, 3).map(item => (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium text-gray-900">{item.customer}</div>
                        <div className="text-gray-500">{item.topic} · {format(new Date(item.date), "HH:mm")}</div>
                      </div>
                    ))}
                    {todayScheduled.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{todayScheduled.length - 3}개 더
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    오늘 예정된 상담이 없습니다.
                  </div>
                );
              })()}
            </div>

            {/* 알림 요약 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  알림
                </h3>
                <button
                  onClick={() => router.push('/dashboard/notifications')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  전체 보기
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {requestStats && (
                  <>
                    {requestStats.pendingRequests > 0 && (
                      <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                        <span className="text-orange-700">새 상담 신청</span>
                        <span className="font-semibold text-orange-800">
                          {requestStats.pendingRequests}건
                        </span>
                      </div>
                    )}
                    {requestStats.urgentRequests > 0 && (
                      <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-red-700">긴급 요청</span>
                        <span className="font-semibold text-red-800">
                          {requestStats.urgentRequests}건
                        </span>
                      </div>
                    )}
                    {requestStats.pendingRequests === 0 && requestStats.urgentRequests === 0 && (
                      <div className="text-gray-500">새로운 알림이 없습니다.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 최근 활동 타임라인 & 주제별 성과 */}
          {(() => {
            const activities = [
              ...items
                .filter((it) => it.status === "completed")
                .map((it) => ({
                  ts: new Date(it.date).getTime(),
                  label: `상담 완료 · ${it.customer} · ${it.topic}`,
                })),
              ...items
                .filter((it) => it.status === "scheduled")
                .map((it) => ({
                  ts: new Date(it.date).getTime(),
                  label: `상담 예약 · ${it.customer} · ${it.topic}`,
                })),
            ]
              .sort((a, b) => b.ts - a.ts)
              .slice(0, 8);

            const topicMap = new Map<
              string,
              { revenue: number; count: number }
            >();
            items.forEach((it) => {
              const key = (it.topic || "기타").split(" ")[0];
              const entry = topicMap.get(key) || { revenue: 0, count: 0 };
              entry.revenue += it.amount || 0;
              entry.count += 1;
              topicMap.set(key, entry);
            });
            const topTopics = Array.from(topicMap.entries())
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .slice(0, 3);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
                <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    최근 활동
                  </h3>
                  {activities.length > 0 ? (
                    <ul className="space-y-3 text-sm">
                      {activities.map((a, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-800 flex-1 truncate">
                            {a.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(a.ts), "MM/dd HH:mm")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">
                      최근 활동이 없습니다.
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    주제별 성과
                  </h3>
                  {topTopics.length > 0 ? (
                    <div className="space-y-4 min-w-0">
                      {topTopics.map(([name, v]) => {
                        const pct =
                          totalRevenue > 0
                            ? Math.round((v.revenue / totalRevenue) * 100)
                            : 0;
                        return (
                          <div key={name} className="min-w-0">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-700 truncate flex-1 mr-2">{name}</span>
                              <span className="text-gray-900 font-medium flex-shrink-0">
                                {v.revenue.toLocaleString()} 크레딧
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      데이터가 충분하지 않습니다.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 분석 리포트 섹션 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">분석 리포트</h2>
              <p className="text-gray-600 mt-1">
                상담 통계와 분석 데이터를 확인하세요.
              </p>
            </div>

            {/* 분석 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* 총 상담 수 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      총 상담 수
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">24</p>
                  </div>
                </div>
              </div>

              {/* 총 상담 시간 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      총 상담 시간
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      18.5시간
                    </p>
                  </div>
                </div>
              </div>

              {/* 상담 전문가 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      상담 전문가
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">8명</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 월별 상담 통계 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  월별 상담 통계
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">차트가 여기에 표시됩니다</p>
                </div>
              </div>

              {/* 전문가별 상담 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  전문가별 상담 분포
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">차트가 여기에 표시됩니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* 전문가 프로필 섹션 제거: 전용 페이지로 분리됨 */}
        </div>
      </div>
    </ProtectedRoute>
  );
}
