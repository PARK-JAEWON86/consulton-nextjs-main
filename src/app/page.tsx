"use client";

/**
 * Consult On 메인 홈페이지
 * - 서비스 소개 및 상담 검색 기능
 * - AI 채팅상담 안내
 * - 다양한 상담 분야 소개
 */

import { useState, useEffect } from "react";
import HeroSection from "../components/home/HeroSection";
import SearchingSection from "../components/home/SearchingSection";
import MatchedExpertsSection from "../components/home/MatchedExpertsSection";
import StatsSection from "../components/home/StatsSection";
import PopularCategoriesSection from "../components/home/PopularCategoriesSection";
import UserReviewsSection from "../components/home/UserReviewsSection";
import AIChatPromoSection from "../components/home/AIChatPromoSection";
import Footer from "../components/layout/Footer";
// import { convertExpertItemToProfile } from "../data/dummy/experts"; // 더미 데이터 제거
// import { dummyExperts } from "../data/dummy/experts"; // 더미 데이터 제거
import {
  Users,
  Target,
  Brain,
  DollarSign,
  Scale,
  BookOpen,
  Heart,
  Briefcase,
  Code,
  Palette,
  Languages,
  Music,
  Trophy,
  Plane,
  ChefHat,
  Scissors,
  PawPrint,
  Sprout,
  TrendingUp,
  Receipt,
  Building2,
  GraduationCap,
  Baby,
  School,
  User,
  UserCheck,
  X,
} from "lucide-react";
// import { getExtendedAgeGroups, getExtendedDurations } from "@/data/dummy/categories"; // 더미 데이터 제거

export default function HomePage() {
  // 검색 상태
  const [searchCategory, setSearchCategory] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchAgeGroup, setSearchAgeGroup] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exactMatchCount, setExactMatchCount] = useState(0);

  // 카테고리 표시 상태
  const [showAllCategories, setShowAllCategories] = useState(false);

  // 전문가 프로필 데이터
  const [allExperts, setAllExperts] = useState<any[]>([]);

  // 사용자 인증 상태
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 에러 상태 관리
  const [dataErrors, setDataErrors] = useState({
    experts: null as string | null,
    categories: null as string | null,
    auth: null as string | null,
    network: null as string | null,
  });

  // 로딩 상태 관리
  const [loadingStates, setLoadingStates] = useState({
    experts: true,
    categories: true,
    auth: false,
  });

  // 재시도 카운터
  const [retryCount, setRetryCount] = useState({
    experts: 0,
    categories: 0,
    auth: 0,
    network: 0,
  });

  // 사용자 인증 상태 확인
  const checkAuth = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, auth: true }));
      setDataErrors(prev => ({ ...prev, auth: null }));

      // 로컬 스토리지에서 사용자 정보 확인
      const storedUser = localStorage.getItem('consulton-user');
      const storedAuth = localStorage.getItem('consulton-auth');

      if (storedUser && storedAuth) {
        try {
          const user = JSON.parse(storedUser);
          const isAuth = JSON.parse(storedAuth);

          if (isAuth) {
            setIsAuthenticated(true);
            setCurrentUserId(user.id || user.email || "");
            console.log('로컬 스토리지에서 인증 성공:', { userId: user.id || user.email, isAuth });
            return;
          }
        } catch (error) {
          console.error('로컬 스토리지 파싱 오류:', error);
        }
      }

      // API에서 앱 상태 로드
      const response = await fetch('/api/app-state');

      if (!response.ok) {
        throw new Error(`인증 API 오류: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(result.data.isAuthenticated);
        setCurrentUserId(result.data.userId || "");
        setRetryCount(prev => ({ ...prev, auth: 0 })); // 성공 시 재시도 카운터 초기화
        console.log('API에서 인증 상태 확인:', { isAuthenticated: result.data.isAuthenticated, userId: result.data.userId });
      } else {
        throw new Error(result.message || '인증 상태 확인에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '인증 상태를 확인하는데 실패했습니다.';
      setDataErrors(prev => ({ ...prev, auth: errorMessage }));
    } finally {
      setLoadingStates(prev => ({ ...prev, auth: false }));
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 에러 처리 및 재시도 로직
  const handleRetry = (type: 'experts' | 'categories' | 'auth' | 'network') => {
    const maxRetries = 3;
    const currentRetries = retryCount[type] || 0;

    if (currentRetries >= maxRetries) {
      setDataErrors(prev => ({
        ...prev,
        [type]: `최대 재시도 횟수(${maxRetries})를 초과했습니다. 페이지를 새로고침해 주세요.`
      }));
      return;
    }

    setRetryCount(prev => ({ ...prev, [type]: currentRetries + 1 }));
    setDataErrors(prev => ({ ...prev, [type]: null }));

    if (type === 'experts') loadExpertProfiles();
    if (type === 'categories') loadCategories();
    if (type === 'auth') checkAuth();
    if (type === 'network') {
      // 네트워크 에러의 경우 모든 데이터 재로드
      loadExpertProfiles();
      loadCategories();
      checkAuth();
    }
  };

  // 전문가 프로필 데이터 로드
  const loadExpertProfiles = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, experts: true }));
      setDataErrors(prev => ({ ...prev, experts: null }));

      console.log('랜딩페이지: 전문가 프로필 로드 시작...');

      // 전문가 프로필 조회 (초기화 제거)
      console.log('랜딩페이지: 전문가 프로필 조회 중...');
      const response = await fetch('/api/expert-profiles');

      if (!response.ok) {
        throw new Error(`프로필 조회 API 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('랜딩페이지: 전문가 프로필 조회 결과:', result);

      if (result.success) {
        console.log('랜딩페이지: 전문가 데이터 설정:', result.data.profiles?.length || 0, '명');

        // API 응답을 ExpertProfile 타입으로 변환
        const convertedExperts = result.data.profiles.map((apiExpert: any) => ({
          id: parseInt(apiExpert.id),
          name: apiExpert.fullName,
          specialty: apiExpert.specialty,
          experience: apiExpert.experienceYears,
          description: apiExpert.bio,
          education: [],
          certifications: apiExpert.certifications?.map((cert: any) => cert.name) || [],
          specialties: apiExpert.keywords || [],
          specialtyAreas: apiExpert.keywords || [],
          consultationTypes: apiExpert.consultationTypes || [],
          languages: ['한국어'],
          hourlyRate: 0,
          pricePerMinute: 0,
          totalSessions: 0,
          avgRating: 4.5,
          rating: 4.5,
          reviewCount: 0,
          completionRate: 95,
          repeatClients: 0,
          responseTime: '1시간 이내',
          averageSessionDuration: 60,
          cancellationPolicy: '24시간 전 취소 가능',
          availability: apiExpert.availability || {},
          weeklyAvailability: {},
          holidayPolicy: undefined,
          contactInfo: {
            phone: '',
            email: apiExpert.email || '',
            location: apiExpert.location || '위치 미설정',
            website: ''
          },
          location: apiExpert.location || '위치 미설정',
          timeZone: apiExpert.timeZone || 'UTC',
          profileImage: apiExpert.profileImage || null,
          portfolioFiles: [],
          portfolioItems: [],
          tags: apiExpert.keywords || [],
          targetAudience: ['성인'],
          isOnline: true,
          isProfileComplete: true,
          createdAt: new Date(apiExpert.createdAt),
          updatedAt: new Date(apiExpert.updatedAt),
          price: apiExpert.hourlyRate ? `₩${apiExpert.hourlyRate.toLocaleString()}` : '가격 문의',
          image: apiExpert.profileImage || null,
          consultationStyle: '체계적이고 전문적인 접근',
          successStories: 50,
          nextAvailableSlot: '2024-01-22T10:00:00',
          profileViews: 500,
          lastActiveAt: new Date(apiExpert.updatedAt),
          joinedAt: new Date(apiExpert.createdAt),
          socialProof: {
            linkedIn: undefined,
            website: undefined,
            publications: []
          },
          pricingTiers: apiExpert.pricingTiers || [
            { duration: 30, price: Math.round((apiExpert.hourlyRate || 50000) * 0.5), description: '기본 상담' },
            { duration: 60, price: apiExpert.hourlyRate || 50000, description: '상세 상담' },
            { duration: 90, price: Math.round((apiExpert.hourlyRate || 50000) * 1.5), description: '종합 상담' }
          ],
          reschedulePolicy: '12시간 전 일정 변경 가능'
        }));

        console.log('랜딩페이지: 변환된 전문가 데이터:', convertedExperts.length, '명');
        setAllExperts(convertedExperts);
        setRetryCount(prev => ({ ...prev, experts: 0 })); // 성공 시 재시도 카운터 초기화
      } else {
        throw new Error(result.message || '전문가 프로필 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('랜딩페이지: 전문가 프로필 로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '전문가 데이터를 불러오는데 실패했습니다.';
      setDataErrors(prev => ({ ...prev, experts: errorMessage }));
      setAllExperts([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, experts: false }));
    }
  };

  useEffect(() => {
    loadExpertProfiles();
  }, []);

  // 인기 카테고리 데이터 로드 (통계 기반)
  const loadCategories = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, categories: true }));
      setDataErrors(prev => ({ ...prev, categories: null }));

      console.log('인기 카테고리 로드 시작...');

      // 병렬로 카테고리 기본 정보와 인기도 통계를 가져옴
      const [categoriesResponse, popularStatsResponse] = await Promise.all([
        fetch('/api/categories?activeOnly=true'),
        fetch('/api/categories/popular?limit=20&sortBy=totalScore')
      ]);

      if (!categoriesResponse.ok) {
        throw new Error(`카테고리 API 오류: ${categoriesResponse.status}`);
      }

      const categoriesResult = await categoriesResponse.json();
      let popularStatsResult = null;

      // 인기도 통계는 실패해도 기본 카테고리로 진행
      if (popularStatsResponse.ok) {
        popularStatsResult = await popularStatsResponse.json();
        console.log('인기도 통계 로드 성공:', popularStatsResult);
      } else {
        console.warn('인기도 통계 로드 실패, 기본 순서로 표시');
      }

      if (categoriesResult.success) {
        let transformedCategories = categoriesResult.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          // 기본값들
          consultationCount: 0,
          expertCount: 0,
          searchCount: 0,
          popularityScore: 0,
          popularityRank: 999
        }));

        // 인기도 통계가 있으면 병합
        if (popularStatsResult && popularStatsResult.success) {
          const popularStats = popularStatsResult.data;

          transformedCategories = transformedCategories.map((category: any) => {
            const stats = popularStats.find((stat: any) => stat.categoryId === category.id);
            if (stats) {
              return {
                ...category,
                consultationCount: stats.consultationCount || 0,
                expertCount: stats.expertCount || 0,
                searchCount: stats.searchCount || 0,
                popularityScore: stats.totalScore || 0,
                popularityRank: stats.rank || 999
              };
            }
            return category;
          });

          // 인기도 순으로 정렬
          transformedCategories.sort((a: any, b: any) => {
            if (a.popularityScore !== b.popularityScore) {
              return b.popularityScore - a.popularityScore; // 높은 점수 먼저
            }
            return a.popularityRank - b.popularityRank; // 낮은 순위 먼저
          });

          console.log('인기도 기반 정렬 완료:', transformedCategories.slice(0, 5).map((c: any) => ({
            name: c.name,
            score: c.popularityScore,
            rank: c.popularityRank
          })));
        } else {
          console.log('기본 순서로 카테고리 표시');
        }

        setCategories(transformedCategories);
        setRetryCount(prev => ({ ...prev, categories: 0 })); // 성공 시 재시도 카운터 초기화
      } else {
        throw new Error(categoriesResult.message || '카테고리 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '카테고리 데이터를 불러오는데 실패했습니다.';
      setDataErrors(prev => ({ ...prev, categories: errorMessage }));

      // 오류 발생 시 인기도 기반 기본 카테고리로 fallback
      setCategories([
        {
          id: "psychology",
          name: "심리상담",
          icon: "Brain",
          description: "스트레스, 우울, 불안",
          consultationCount: 1200,
          popularityScore: 95,
          popularityRank: 1
        },
        {
          id: "career",
          name: "진로상담",
          icon: "Target",
          description: "취업, 이직, 진로 탐색",
          consultationCount: 980,
          popularityScore: 88,
          popularityRank: 2
        },
        {
          id: "finance",
          name: "재무상담",
          icon: "DollarSign",
          description: "투자, 자산관리, 세무",
          consultationCount: 750,
          popularityScore: 82,
          popularityRank: 3
        },
        {
          id: "legal",
          name: "법률상담",
          icon: "Scale",
          description: "계약, 분쟁, 상속",
          consultationCount: 650,
          popularityScore: 75,
          popularityRank: 4
        },
        {
          id: "education",
          name: "교육상담",
          icon: "BookOpen",
          description: "학습법, 입시, 유학",
          consultationCount: 580,
          popularityScore: 70,
          popularityRank: 5
        }
      ]);
    } finally {
      setLoadingStates(prev => ({ ...prev, categories: false }));
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 실시간 데이터 동기화 (페이지 포커스 시 새로고침)
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스 - 데이터 새로고침 시작');

      // 마지막 로드 시간과 비교하여 5분 이상 지났을 때만 새로고침
      const lastLoadTime = localStorage.getItem('consulton-last-data-load');
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (!lastLoadTime || currentTime - parseInt(lastLoadTime) > fiveMinutes) {
        console.log('5분 이상 경과 - 전체 데이터 새로고침');
        loadExpertProfiles();
        loadCategories();
        checkAuth();
        localStorage.setItem('consulton-last-data-load', currentTime.toString());
      } else {
        console.log('최근 로드됨 - 새로고침 스킵');
      }
    };

    const handleOnline = () => {
      console.log('네트워크 연결 복구 - 데이터 새로고침');
      loadExpertProfiles();
      loadCategories();
      checkAuth();
    };

    // 이벤트 리스너 등록
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // 페이지 가시성 변경 감지 (탭 전환)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 커스텀 이벤트 리스너 (다른 컴포넌트에서 데이터 업데이트 요청)
    const handleDataRefresh = () => {
      console.log('데이터 새로고침 이벤트 수신');
      loadExpertProfiles();
      loadCategories();
    };

    window.addEventListener('consulton-refresh-data', handleDataRefresh);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('consulton-refresh-data', handleDataRefresh);
    };
  }, []);

  // 주기적 데이터 동기화 (10분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('주기적 데이터 동기화 (10분)');

      // 페이지가 활성 상태일 때만 실행
      if (!document.hidden) {
        loadExpertProfiles();
        loadCategories();
      }
    }, 10 * 60 * 1000); // 10분

    return () => clearInterval(interval);
  }, []);

  // 네트워크 상태 모니터링
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const handleOffline = () => {
      console.log('네트워크 연결 끊김');
      setDataErrors(prev => ({
        ...prev,
        network: '네트워크 연결이 끊어졌습니다. 연결을 확인해 주세요.'
      }));
    };

    const handleOnlineReconnect = () => {
      console.log('네트워크 연결 복구');
      setDataErrors(prev => ({
        ...prev,
        network: null
      }));

      // 연결 복구 후 3초 뒤에 데이터 재로드
      retryTimeout = setTimeout(() => {
        if (Object.values(dataErrors).some(error => error !== null)) {
          console.log('에러 상태에서 자동 재시도');
          if (dataErrors.experts) loadExpertProfiles();
          if (dataErrors.categories) loadCategories();
          if (dataErrors.auth) checkAuth();
        }
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnlineReconnect);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnlineReconnect);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [dataErrors]);

  // 상담 카테고리 옵션 (API에서 동적 로드)
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 연령대 옵션
  const ageGroups = [
    { id: "children", name: "어린이 (7-12세)", icon: Baby },
    { id: "teen", name: "청소년 (13-18세)", icon: GraduationCap },
    { id: "student", name: "학생 (19-25세)", icon: School },
    { id: "adult", name: "성인 (26-59세)", icon: User },
    { id: "senior", name: "시니어 (60세+)", icon: UserCheck },
  ];

  // 상담시간 옵션
  const durations = [
    { id: "30", name: "30분", description: "간단한 상담" },
    { id: "45", name: "45분", description: "표준 상담" },
    { id: "60", name: "60분", description: "심화 상담" },
    { id: "90", name: "90분", description: "종합 상담" },
    { id: "120", name: "120분", description: "전문 상담" },
  ];

  // 전문가 필터링 함수
  const filterExperts = (experts: any[], category: string, date: string, duration: string, ageGroup: string) => {
    console.log('=== 전문가 필터링 시작 ===');
    console.log('검색 조건:', { category, date, duration, ageGroup });
    console.log('전체 전문가 수:', experts.length);
    console.log('사용 가능한 카테고리:', categories);
    
    const selectedCategory = categories.find(c => c.id === category);
    console.log('선택된 카테고리:', selectedCategory);
    
    if (!selectedCategory) {
      console.error('선택된 카테고리를 찾을 수 없습니다:', category);
      return [];
    }
    
    const filteredResults = experts.filter(expert => {
      console.log(`\n--- 전문가 ${expert.name} (ID: ${expert.id}) 분석 ---`);
      console.log('전문가 정보:', {
        specialty: expert.specialty,
        specialtyAreas: expert.specialtyAreas,
        specialties: expert.specialties,
        tags: expert.tags,
        targetAudience: expert.targetAudience
      });
      
      // 1. 카테고리 필터링 - 더 유연한 매칭
      const categoryMatch = (
        expert.specialty === selectedCategory.name ||
        (expert.specialtyAreas && Array.isArray(expert.specialtyAreas) && 
         expert.specialtyAreas.some((area: string) => area === selectedCategory.name)) ||
        (expert.specialties && Array.isArray(expert.specialties) && 
         expert.specialties.some((specialty: string) => specialty === selectedCategory.name)) ||
        (expert.tags && Array.isArray(expert.tags) && 
         expert.tags.some((tag: string) => tag === selectedCategory.name))
      );
      
      console.log('카테고리 매칭 결과:', {
        expertSpecialty: expert.specialty,
        selectedCategoryName: selectedCategory.name,
        categoryMatch,
        matchDetails: {
          exactMatch: expert.specialty === selectedCategory.name,
          specialtyAreasMatch: expert.specialtyAreas?.some((area: string) => area === selectedCategory.name),
          specialtiesMatch: expert.specialties?.some((specialty: string) => specialty === selectedCategory.name),
          tagsMatch: expert.tags?.some((tag: string) => tag === selectedCategory.name)
        }
      });
      
      // 2. 연령대 필터링 (targetAudience 기준) - 더 유연하게
      const ageGroupName = ageGroups.find(a => a.id === ageGroup)?.name;
      let ageMatch = true;
      
      if (ageGroupName && expert.targetAudience && Array.isArray(expert.targetAudience)) {
        const targetAudience = expert.targetAudience.map((target: string) => target.toLowerCase());
        
        if (ageGroup === "teen") {
          ageMatch = targetAudience.some((target: string) => 
            target.includes("청소년") || target.includes("중학생") || target.includes("고등학생") || target.includes("10대")
          );
        } else if (ageGroup === "student") {
          ageMatch = targetAudience.some((target: string) => 
            target.includes("대학생") || target.includes("취준생") || target.includes("학생") || target.includes("20대")
          );
        } else if (ageGroup === "adult") {
          ageMatch = targetAudience.some((target: string) => 
            target.includes("성인") || target.includes("직장인") || target.includes("자영업자") || 
            target.includes("30대") || target.includes("40대") || target.includes("50대")
          );
        } else if (ageGroup === "senior") {
          ageMatch = targetAudience.some((target: string) => 
            target.includes("시니어") || target.includes("은퇴") || target.includes("60대") || target.includes("70대")
          );
        }
      }
      
      console.log('연령대 매칭 결과:', {
        targetAudience: expert.targetAudience,
        ageGroupName,
        ageMatch
      });
      
      // 3. 날짜 필터링 (현재는 모든 전문가가 가능하다고 가정)
      const dateMatch = true;
      
      // 4. 상담시간 필터링 - 더 유연하게
      let durationMatch = true;
      if (duration && duration !== "decide_after_matching") {
        const requestedDuration = parseInt(duration);
        if (expert.pricingTiers && Array.isArray(expert.pricingTiers)) {
          durationMatch = expert.pricingTiers.some((tier: any) => tier.duration === requestedDuration);
        } else {
          // pricingTiers가 없는 경우 일반적인 상담 시간을 지원한다고 가정
          durationMatch = [30, 60, 90].includes(requestedDuration);
        }
      }
      
      const finalMatch = categoryMatch && ageMatch && dateMatch && durationMatch;
      console.log('최종 매칭 결과:', {
        categoryMatch,
        ageMatch,
        dateMatch,
        durationMatch,
        finalMatch
      });
      
      return finalMatch;
    });
    
    console.log('필터링 완료: 총', filteredResults.length, '명의 전문가가 매칭되었습니다.');
    return filteredResults;
  };

  // 통합 검색 API 호출
  const handleSearch = async () => {
    console.log('=== 통합 검색 실행 시작 ===');

    if (
      !searchCategory ||
      !searchStartDate ||
      !searchEndDate ||
      !searchAgeGroup
    ) {
      alert("모든 검색 조건을 선택해주세요.");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchParams = {
        category: searchCategory,
        startDate: searchStartDate,
        endDate: searchEndDate,
        ageGroup: searchAgeGroup,
        limit: 10,
        includeAlternatives: true // 결과가 부족할 때 관련 전문가 포함
      };

      console.log('검색 API 호출:', searchParams);

      // 존재하지 않는 API 대신 클라이언트 필터링 사용
      throw new Error('검색 API가 구현되지 않음 - 클라이언트 필터링 사용');

      if (false) {
        console.log('검색 API 응답:', result);

        // API 응답을 UI에 맞는 형태로 변환
        const convertedResults = result.data.experts.map((expert: any) => ({
          id: parseInt(expert.id),
          name: expert.fullName || expert.name,
          specialty: expert.specialty,
          experience: expert.experienceYears || expert.experience,
          description: expert.bio || expert.description,
          rating: expert.rating || 4.5,
          reviewCount: expert.reviewCount || 0,
          price: expert.hourlyRate ? `₩${expert.hourlyRate.toLocaleString()}` : '가격 문의',
          image: expert.profileImage,
          tags: expert.keywords || expert.tags || [],
          availability: expert.availability || {},
          isExactMatch: expert.isExactMatch || false, // 정확한 매칭인지 여부
          matchScore: expert.matchScore || 0, // 매칭 점수
          // 기존 필드들도 유지
          education: [],
          certifications: expert.certifications?.map((cert: any) => cert.name) || [],
          specialties: expert.keywords || [],
          specialtyAreas: expert.keywords || [],
          consultationTypes: expert.consultationTypes || [],
          languages: expert.languages || ['한국어'],
          totalSessions: expert.totalSessions || 0,
          avgRating: expert.rating || 4.5,
          completionRate: 95,
          repeatClients: expert.repeatClients || 0,
          responseTime: expert.responseTime || '1시간 이내',
          location: expert.location || '위치 미설정',
          profileImage: expert.profileImage || null,
          targetAudience: expert.targetAudience || ['성인'],
          isOnline: true,
          pricingTiers: expert.pricingTiers || [
            { duration: 30, price: Math.round((expert.hourlyRate || 50000) * 0.5), description: '기본 상담' },
            { duration: 60, price: expert.hourlyRate || 50000, description: '상세 상담' },
            { duration: 90, price: Math.round((expert.hourlyRate || 50000) * 1.5), description: '종합 상담' }
          ]
        }));

        setSearchResults(convertedResults);
        setExactMatchCount(result.data.exactMatchCount || 0);

        console.log('검색 완료:', {
          totalResults: convertedResults.length,
          exactMatches: result.data.exactMatchCount,
          searchTime: result.data.searchTime
        });
      } else {
        throw new Error(result.message || '검색에 실패했습니다.');
      }
    } catch (error) {
      console.error('검색 실패:', error);

      // 검색 실패 시 기존 클라이언트 필터링으로 fallback
      console.log('클라이언트 필터링으로 fallback...');
      const filteredExperts = filterExperts(
        allExperts,
        searchCategory,
        searchStartDate,
        searchEndDate,
        searchAgeGroup
      );

      setExactMatchCount(filteredExperts.length);

      let finalResults = [...filteredExperts];
      if (filteredExperts.length < 3) {
        const additionalExperts = allExperts
          .filter((expert: any) => !filteredExperts.some((filtered: any) => filtered.id === expert.id))
          .slice(0, 5 - filteredExperts.length);
        finalResults = [...filteredExperts, ...additionalExperts];
      }

      setSearchResults(finalResults);

      // 사용자에게 검색 에러 알림 (선택적)
      if (error instanceof Error && !error.message.includes('API 오류')) {
        alert('검색 중 오류가 발생했습니다. 기본 검색으로 결과를 표시합니다.');
      }
    } finally {
      setIsSearching(false);
    }
  };




  // 에러 알림 컴포넌트
  const ErrorNotification = ({ error, onRetry, type }: { error: string, onRetry: () => void, type: string }) => (
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <X className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            데이터 로드 오류
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              다시 시도
            </button>
            <button
              onClick={() => setDataErrors(prev => ({ ...prev, [type]: null }))}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-transparent hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* 에러 알림들 */}
      {dataErrors.experts && (
        <ErrorNotification
          error={dataErrors.experts}
          onRetry={() => handleRetry('experts')}
          type="experts"
        />
      )}
      {dataErrors.categories && (
        <ErrorNotification
          error={dataErrors.categories}
          onRetry={() => handleRetry('categories')}
          type="categories"
        />
      )}
      {dataErrors.auth && (
        <ErrorNotification
          error={dataErrors.auth}
          onRetry={() => handleRetry('auth')}
          type="auth"
        />
      )}
      {dataErrors.network && (
        <ErrorNotification
          error={dataErrors.network}
          onRetry={() => handleRetry('network')}
          type="network"
        />
      )}

      <HeroSection
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
        searchStartDate={searchStartDate}
        setSearchStartDate={setSearchStartDate}
        searchEndDate={searchEndDate}
        setSearchEndDate={setSearchEndDate}
        searchAgeGroup={searchAgeGroup}
        setSearchAgeGroup={setSearchAgeGroup}
        isSearching={isSearching}
        onSearch={handleSearch}
        categories={categories}
        ageGroups={ageGroups}
        durations={durations}
        searchResults={searchResults}
        hasSearched={hasSearched}
        exactMatchCount={exactMatchCount}
      />

      {/* 검색 진행 중일 때만 표시 */}
      {isSearching && (
        <SearchingSection
          searchCategory={searchCategory}
          searchAgeGroup={searchAgeGroup}
          categories={categories}
          ageGroups={ageGroups}
        />
      )}

      {/* 통계 섹션 */}
      <StatsSection />

      {/* 인기 카테고리 섹션 */}
      <PopularCategoriesSection
        categories={categories}
        showAllCategories={showAllCategories}
        setShowAllCategories={setShowAllCategories}
        isLoading={isLoadingCategories}
      />

      {/* 사용자 리뷰 섹션 */}
      <UserReviewsSection />

      {/* AI 채팅상담 섹션 */}
      <AIChatPromoSection />

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
