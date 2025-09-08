"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type React from "react";
import { Grid, List, Users, Star, Award, Clock, MessageCircle, Video, Heart } from "lucide-react";
import ExpertCard from "@/components/expert/ExpertCard";

/**
 * 전문가 데이터 유효성 검사 함수
 * @param {Object} expert - 검사할 전문가 객체
 * @returns {boolean} 유효한 전문가 데이터인지 여부
 */
type ExpertItem = {
  id: string | number;
  name: string;
  rating: number;
  pricePerHour?: number;
  creditsPerMinute?: number;
  experience: string;
  availability: "available" | "busy" | "offline" | string;
  specialty?: string;
  title?: string;
  [key: string]: unknown;
};

const validateExpert = (expert: ExpertItem) => {
  return (
    expert &&
    typeof expert.id !== "undefined" &&
    typeof expert.name === "string" &&
    typeof expert.rating === "number" &&
    (typeof expert.pricePerHour !== "undefined" ||
      typeof expert.creditsPerMinute !== "undefined") &&
    typeof expert.experience === "string" &&
    typeof expert.availability === "string"
  );
};

/**
 * 전문가 목록을 표시하는 컴포넌트
 * 그리드/리스트 뷰 전환, 정렬, 페이지네이션 기능을 제공합니다.
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Array<Object>} props.experts - 전문가 데이터 배열
 * @param {Function} props.onExpertSelect - 전문가 선택 시 호출되는 함수
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.defaultViewMode - 기본 뷰 모드 ('grid' | 'list')
 * @param {string} props.defaultSortBy - 기본 정렬 기준 ('rating' | 'price' | 'experience' | 'availability')
 * @param {boolean} props.showViewModeToggle - 뷰 모드 전환 버튼 표시 여부
 * @param {boolean} props.showSortOptions - 정렬 옵션 표시 여부
 * @param {number} props.itemsPerPage - 페이지당 표시할 항목 수
 *
 * @example
 * // 기본 사용법
 * <ExpertList
 *   experts={expertsData}
 *   onExpertSelect={(expert) => console.log('Selected:', expert)}
 * />
 *
 * @example
 * // 커스텀 설정
 * <ExpertList
 *   experts={expertsData}
 *   onExpertSelect={handleExpertSelect}
 *   defaultViewMode="list"
 *   defaultSortBy="price"
 *   itemsPerPage={8}
 * />
 */
const ExpertList = ({
  experts = [],
  onExpertSelect,
  loading = false,
  defaultViewMode = "grid",
  defaultSortBy = "rating",
  showViewModeToggle = true,
  showSortOptions = true,
  itemsPerPage = 12,
}: {
  experts?: ExpertItem[];
  onExpertSelect?: (expert: ExpertItem) => void;
  loading?: boolean;
  defaultViewMode?: "grid" | "list";
  defaultSortBy?: "rating" | "price" | "experience" | "availability";
  showViewModeToggle?: boolean;
  showSortOptions?: boolean;
  itemsPerPage?: number;
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultViewMode);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience" | "availability">(defaultSortBy);
  const [currentPage, setCurrentPage] = useState(1);

  // 유효한 전문가 데이터만 필터링
  const validExperts = useMemo(() => {
    return experts.filter(validateExpert);
  }, [experts]);

  // 정렬된 전문가 목록
  const sortedExperts = useMemo(() => {
    const sorted = [...validExperts].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          const aPrice = a.creditsPerMinute || a.pricePerHour || 0;
          const bPrice = b.creditsPerMinute || b.pricePerHour || 0;
          return aPrice - bPrice;
        case "experience":
          const aExp = parseInt(a.experience) || 0;
          const bExp = parseInt(b.experience) || 0;
          return bExp - aExp;
        case "availability":
          const availabilityOrder = { available: 0, busy: 1, offline: 2 };
          const aAvail = availabilityOrder[a.availability as keyof typeof availabilityOrder] ?? 2;
          const bAvail = availabilityOrder[b.availability as keyof typeof availabilityOrder] ?? 2;
          return aAvail - bAvail;
        default:
          return 0;
      }
    });
    return sorted;
  }, [validExperts, sortBy]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedExperts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExperts = sortedExperts.slice(startIndex, endIndex);

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    setCurrentPage(1); // 뷰 모드 변경 시 첫 페이지로 이동
  }, []);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((sort: "rating" | "price" | "experience" | "availability") => {
    setSortBy(sort);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 전문가 선택 핸들러
  const handleExpertSelect = useCallback((expert: ExpertItem) => {
    onExpertSelect?.(expert);
  }, [onExpertSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* 정렬 옵션 */}
          {showSortOptions && (
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                정렬:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">평점 높은 순</option>
                <option value="price">가격 낮은 순</option>
                <option value="experience">경력 많은 순</option>
                <option value="availability">접속 가능한 순</option>
              </select>
            </div>
          )}

          {/* 뷰 모드 전환 */}
          {showViewModeToggle && (
            <div
              className="flex items-center border border-gray-300 rounded-lg overflow-hidden"
              role="group"
              aria-label="보기 모드 선택"
            >
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-2 text-sm transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-label="그리드 보기"
                aria-pressed={viewMode === "grid"}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange("list")}
                className={`p-2 text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-label="리스트 보기"
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 결과 수 표시 */}
        <div className="text-sm text-gray-500">
          총 {validExperts.length}명의 전문가
        </div>
      </div>

      {/* 전문가 목록 */}
      {currentExperts.length > 0 ? (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {currentExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                mode={viewMode}
                showProfileButton={true}
                onProfileView={() => handleExpertSelect(expert)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm border rounded-lg ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">전문가를 찾을 수 없습니다</h3>
          <p className="text-gray-500">검색 조건을 변경해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default ExpertList;
