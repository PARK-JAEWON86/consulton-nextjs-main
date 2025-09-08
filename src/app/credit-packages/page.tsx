"use client";

import { useState, useEffect } from "react";
import { CreditCard, LogIn } from "lucide-react";
import ServiceLayout from "@/components/layout/ServiceLayout";
import PackCard from "@/components/dashboard/PackCard";
import React from "react"; // Added missing import for React

// API를 통해 레벨 정보를 가져오는 함수들
const fetchAllLevels = async () => {
  try {
    const response = await fetch('/api/expert-levels?action=getAllLevels');
    const data = await response.json();
    return data.levels || [];
  } catch (error) {
    console.error('레벨 정보 로드 실패:', error);
    return [];
  }
};

const fetchKoreanTierName = async (tierName: string) => {
  try {
    const response = await fetch(`/api/expert-levels?action=getKoreanTierName&tierName=${encodeURIComponent(tierName)}`);
    const data = await response.json();
    return data.koreanName || tierName;
  } catch (error) {
    console.error('한국어 티어명 로드 실패:', error);
    return tierName;
  }
};

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

export default function CreditPackagesPage() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });

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

  const { user, isAuthenticated } = appState;


  // 실제 이용 빈도를 고려한 평균 요금 계산 (가장 많이 분포된 전문가 레벨 기준)
  const calculateAverageRatePerMinute = () => {
    // 실제 고객이 많이 이용하는 레벨 범위: 120~180 크레딧/분
    const practicalAverageCredits = 150; // 중간값으로 설정
    return practicalAverageCredits * 10; // 1크레딧 = 10원이므로 원화로 변환
  };

  const averageRatePerMinute = calculateAverageRatePerMinute(); // 원화 요금 (₩1,500)
  const averageCreditsPerMinute = 150; // 실제 평균 크레딧 요금

  // 레벨별 요금 정보 계산
  const [pricingInfo, setPricingInfo] = useState({
    minRate: 1000, // 기본값
    maxRate: 6000, // 기본값
    minCreditsRate: 100, // 기본값
    maxCreditsRate: 600, // 기본값
    averageRate: averageRatePerMinute,
    minTier: "티어 1 (Lv.1-99)",
    maxTier: "티어 10 (Lv.999)",
  });

  // 레벨 정보 로드
  useEffect(() => {
    const loadLevelInfo = async () => {
      try {
        const levels = await fetchAllLevels();
        if (levels.length > 0) {
          const minLevel = levels[levels.length - 1]; // Tier 1 (최저 요금)
          const maxLevel = levels[0]; // Tier 10 (최고 요금)
          
          const minTier = await fetchKoreanTierName(minLevel.name);
          const maxTier = await fetchKoreanTierName(maxLevel.name);
          
          setPricingInfo({
            minRate: minLevel.creditsPerMinute * 10, // 원화로 변환
            maxRate: maxLevel.creditsPerMinute * 10, // 원화로 변환
            minCreditsRate: minLevel.creditsPerMinute,
            maxCreditsRate: maxLevel.creditsPerMinute,
            averageRate: averageRatePerMinute,
            minTier,
            maxTier,
          });
        }
      } catch (error) {
        console.error('레벨 정보 로드 실패:', error);
      }
    };

    loadLevelInfo();
  }, [averageRatePerMinute]);



  const packs = [
    // 크레딧 충전 패키지들 (충전량이 많을수록 보너스 증가)
    {
      id: 1,
      type: "credit" as const,
      name: "베이직 충전",
      description: "상담 1회를 충분히 할 수 있는 기본 패키지",
      price: 50000,
      credits: 5000,
      bonusCredits: 500, // 10% 보너스
      totalCredits: 5500,
      payPerMinute: averageRatePerMinute,
      usageMinutes: Math.floor((5500 / averageCreditsPerMinute) * 100) / 100, // 계산된 분
      usageTime: `약 ${Math.floor(5500 / averageCreditsPerMinute)}분`,
      features: [
        "5,000 + 500 보너스 크레딧",
        "총 5,500 크레딧 제공",
        "상담 1회 충분히 가능 (약 36분)",
        "AI 상담 및 전문가 상담에 사용 가능",
        "10% 보너스 혜택",
        "사용기한 없음",
      ],
    },
    {
      id: 2,
      type: "credit" as const,
      name: "스탠다드 충전",
      description: "가장 인기있는 추천 패키지, 여러 번 상담 가능",
      price: 80000,
      credits: 8000,
      bonusCredits: 1200, // 15% 보너스
      totalCredits: 9200,
      payPerMinute: averageRatePerMinute,
      usageMinutes: Math.floor((9200 / averageCreditsPerMinute) * 100) / 100, // 계산된 분
      usageTime: `약 ${Math.floor(9200 / averageCreditsPerMinute)}분`,
      isRecommended: true,
      features: [
        "8,000 + 1,200 보너스 크레딧",
        "총 9,200 크레딧 제공",
        "상담 2회 충분히 가능 (약 61분)",
        "AI 상담 및 전문가 상담에 사용 가능",
        "15% 보너스 혜택",
        "우선 고객지원",
        "사용기한 없음",
      ],
    },
    {
      id: 3,
      type: "credit" as const,
      name: "프리미엄 충전",
      description: "대용량 충전으로 최대 혜택, 장기 이용 고객용",
      price: 150000,
      credits: 15000,
      bonusCredits: 3000, // 20% 보너스
      totalCredits: 18000,
      payPerMinute: averageRatePerMinute,
      usageMinutes: Math.floor((18000 / averageCreditsPerMinute) * 100) / 100, // 계산된 분
      usageTime: `약 ${Math.floor(18000 / averageCreditsPerMinute)}분`,
      features: [
        "15,000 + 3,000 보너스 크레딧",
        "총 18,000 크레딧 제공",
        "상담 4회 충분히 가능 (약 120분)",
        "AI 상담 및 전문가 상담에 사용 가능",
        "20% 보너스 혜택",
        "VIP 고객지원",
        "전문가 우선 매칭",
        "사용기한 없음",
      ],
    },
  ];

  return (
    <ServiceLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                크레딧 충전
              </h1>
              <p className="text-gray-600 mt-1">
                상담에 필요한 크레딧을 충전하세요. 충전량이 많을수록 더 많은
                보너스 혜택을 받을 수 있습니다.
              </p>
            </div>
          </div>

          {/* 전문가 레벨별 과금 체계 안내 */}
          <div className="mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 전문가 레벨별 과금 체계
              </h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  <strong>일반적인 요금:</strong> 분당 120~180 크레딧 (₩1,200~₩1,800)
                </p>
                <p>
                  <strong>평균 요금:</strong> 분당 약 {averageCreditsPerMinute} 크레딧 (₩{averageRatePerMinute.toLocaleString()})
                </p>
                <p>
                  <strong>전체 요금 범위:</strong> {pricingInfo.minCreditsRate} ~ {pricingInfo.maxCreditsRate} 크레딧/분 (₩{pricingInfo.minRate.toLocaleString()} ~ ₩{pricingInfo.maxRate.toLocaleString()})
                </p>
                <p>
                  <strong>전문가 레벨:</strong> {pricingInfo.minTier} ~ {pricingInfo.maxTier}
                </p>
                <p className="text-blue-600 mt-2">
                  ※ 대부분의 전문가가 120~180 크레딧/분 범위에 분포되어 있습니다. 상담 예약 시 정확한 요금을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 게스트 사용자를 위한 로그인 유도 메시지 */}
          {!isAuthenticated && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-4">
                <LogIn className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    크레딧 잔액을 확인하려면 로그인하세요
                  </h3>
                  <p className="text-blue-700 mb-4">
                    로그인하시면 현재 크레딧 잔액과 사용 내역을 확인할 수 있습니다.
                  </p>
                  <button
                    onClick={() => window.location.href = "/auth/login"}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    로그인하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 패키지 카드들 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              크레딧 충전 패키지
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {packs.map((pack) => (
                <PackCard key={pack.id} pack={pack} />
              ))}
            </div>
          </div>

          {/* 패키지 비교 테이블 - 데스크톱용 */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                크레딧 충전 비교
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                각 충전 옵션의 혜택, 보너스, 사용 가능 시간을 비교해보세요.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      패키지
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기본 크레딧
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      보너스
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 크레딧
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용 가능 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packs.map((pack) => (
                    <tr key={pack.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {pack.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pack.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          ₩{pack.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {pack.credits} 크레딧
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {pack.bonusCredits && pack.bonusCredits > 0 ? (
                            <span className="text-green-600 font-medium">
                              +{pack.bonusCredits}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {pack.totalCredits} 크레딧
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-blue-600">
                          {pack.usageTime}
                        </div>
                        <div className="text-xs text-gray-500">
                          (평균 {averageCreditsPerMinute}크레딧/분
                          기준)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 패키지 비교 카드 - 모바일/태블릿용 */}
          <div className="lg:hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  크레딧 충전 비교
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  각 충전 옵션의 혜택, 보너스, 사용 가능 시간을 비교해보세요.
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {packs.map((pack) => (
                    <div
                      key={pack.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {pack.name}
                        </h4>
                        {pack.isRecommended && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            추천
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {pack.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs">가격</div>
                          <div className="font-medium text-gray-900">
                            ₩{pack.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs">
                            기본 크레딧
                          </div>
                          <div className="font-medium text-gray-900">
                            {pack.credits} 크레딧
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs">보너스</div>
                          <div className="font-medium text-green-600">
                            +{pack.bonusCredits} 크레딧
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs">총 크레딧</div>
                          <div className="font-medium text-gray-900">
                            {pack.totalCredits} 크레딧
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded col-span-2">
                          <div className="text-gray-500 text-xs">
                            사용 가능 시간
                          </div>
                          <div className="font-medium text-blue-600">
                            {pack.usageTime}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            (평균 {averageCreditsPerMinute}크레딧/분
                            기준)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    </ServiceLayout>
  );
}
