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

  // 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      try {
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
        fetch('/api/app-state')
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              setIsAuthenticated(result.data.isAuthenticated);
              setCurrentUserId(result.data.userId || "");
              console.log('API에서 인증 상태 확인:', { isAuthenticated: result.data.isAuthenticated, userId: result.data.userId });
            }
          })
          .catch(error => {
            console.error('인증 상태 확인 실패:', error);
          });
      } catch (error) {
        console.error('인증 상태 확인 실패:', error);
      }
    };
    
    checkAuth();
  }, []);

  // 전문가 프로필 데이터 로드
  useEffect(() => {
    const loadExpertProfiles = () => {
      console.log('랜딩페이지: 전문가 프로필 로드 시작...');
      
      // 먼저 API 초기화 호출
      console.log('랜딩페이지: API 초기화 호출 중...');
      fetch('/api/expert-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initializeProfiles'
        })
      })
      .then(initResponse => initResponse.json())
      .then(initResult => {
        console.log('랜딩페이지: 초기화 결과:', initResult);
        
        // 그 다음 전문가 프로필 조회
        console.log('랜딩페이지: 전문가 프로필 조회 중...');
        return fetch('/api/expert-profiles');
      })
      .then(response => response.json())
      .then(result => {
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
        } else {
          console.error('랜딩페이지: API 응답 실패:', result);
          // API 호출 실패 시 빈 배열 사용
          setAllExperts([]);
        }
      })
      .catch(error => {
        console.error('랜딩페이지: 전문가 프로필 로드 실패:', error);
        // API 호출 실패 시 빈 배열 사용
        setAllExperts([]);
      });
    };

    loadExpertProfiles();
  }, []);

    // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = () => {
      setIsLoadingCategories(true);
      fetch('/api/categories?activeOnly=true')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            // API 응답을 기존 형식에 맞게 변환
            const transformedCategories = result.data.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              description: cat.description
            }));
            setCategories(transformedCategories);
          } else {
            console.error('카테고리 로드 실패:', result.message);
            // API 실패 시 기본 카테고리로 fallback
            setCategories([
              { id: "career", name: "진로상담", icon: "Target", description: "취업, 이직, 진로 탐색" },
              { id: "psychology", name: "심리상담", icon: "Brain", description: "스트레스, 우울, 불안" },
              { id: "finance", name: "재무상담", icon: "DollarSign", description: "투자, 자산관리, 세무" },
              { id: "legal", name: "법률상담", icon: "Scale", description: "계약, 분쟁, 상속" },
              { id: "education", name: "교육상담", icon: "BookOpen", description: "학습법, 입시, 유학" }
            ]);
          }
        })
        .catch(error => {
          console.error('카테고리 로드 실패:', error);
          // 네트워크 오류 시 기본 카테고리로 fallback
          setCategories([
            { id: "career", name: "진로상담", icon: "Target", description: "취업, 이직, 진로 탐색" },
            { id: "psychology", name: "심리상담", icon: "Brain", description: "스트레스, 우울, 불안" },
            { id: "finance", name: "재무상담", icon: "DollarSign", description: "투자, 자산관리, 세무" },
            { id: "legal", name: "법률상담", icon: "Scale", description: "계약, 분쟁, 상속" },
            { id: "education", name: "교육상담", icon: "BookOpen", description: "학습법, 입시, 유학" }
          ]);
        })
        .finally(() => {
          setIsLoadingCategories(false);
        });
    };

    loadCategories();
  }, []);

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

  // 검색 실행
  const handleSearch = () => {
    console.log('=== 검색 실행 시작 ===');
    console.log('검색 조건:', {
      searchCategory,
      searchStartDate,
      searchEndDate,
      searchAgeGroup
    });
    console.log('사용 가능한 카테고리 수:', categories.length);
    console.log('전체 전문가 수:', allExperts.length);

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
    
    // 실제로는 API 호출하여 전문가 검색
    setTimeout(() => {
      // 상태에서 전문가 데이터 가져오기
      const currentExperts = allExperts;
      console.log('현재 전문가 데이터:', currentExperts.length, '명');
      
      // 검색 조건에 맞는 전문가 필터링
      const filteredExperts = filterExperts(
        currentExperts, 
        searchCategory, 
        searchStartDate, 
        searchEndDate, 
        searchAgeGroup
      );
      
      console.log('필터링 결과:', filteredExperts.length, '명');
      
      // 정확한 매칭 수 저장
      setExactMatchCount(filteredExperts.length);
      
      // 결과가 적을 경우 더미 데이터 추가 (실제 서비스에서는 제거)
      let finalResults = [...filteredExperts];
      if (filteredExperts.length < 3) {
        // 부족한 경우 다른 카테고리 전문가도 추가 (관련 전문가로 표시)
        const additionalExperts = currentExperts
          .filter((expert: any) => !filteredExperts.some((filtered: any) => filtered.id === expert.id))
          .slice(0, 5 - filteredExperts.length);
        finalResults = [...filteredExperts, ...additionalExperts];
        console.log('추가 전문가:', additionalExperts.length, '명');
      }
      
      console.log('최종 검색 결과:', finalResults.length, '명');
      setSearchResults(finalResults);
      setIsSearching(false);
    }, 800);
  };




  return (
    <div className="min-h-screen bg-white">

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
