"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Star, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Calendar,
  Award,
  Users,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  Video,
  ArrowLeft,
  Heart,
  Share2,
  Crown
} from "lucide-react";
// import { dummyExperts, convertExpertItemToProfile } from "@/data/dummy/experts"; // 더미 데이터 제거
// import { dummyReviews, getReviewsByExpert } from "@/data/dummy/reviews"; // 더미 데이터 제거
import { ExpertProfile, Review } from "@/types";
// API를 통해 전문가 레벨 관련 정보를 가져오는 함수들
const calculateExpertLevel = async (totalSessions: number = 0, avgRating: number = 0) => {
  try {
    const response = await fetch(`/api/expert-levels?action=calculateExpertLevel&totalSessions=${totalSessions}&avgRating=${avgRating}`);
    const data = await response.json();
    return data.levelInfo;
  } catch (error) {
    console.error('전문가 레벨 계산 실패:', error);
    return {
      name: "Tier 1 (Lv.1-99)",
      levelRange: { min: 1, max: 99 },
      creditsPerMinute: 100,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-gradient-to-r from-orange-100 to-red-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-500",
    };
  }
};

const getLevelBadgeStyles = async (levelName: string) => {
  try {
    const response = await fetch(`/api/expert-levels?action=getTierInfoByName&tierName=${encodeURIComponent(levelName)}`);
    const data = await response.json();
    const tierInfo = data.tierInfo;
    return {
      gradient: tierInfo.color,
      background: tierInfo.bgColor,
      textColor: tierInfo.textColor,
      borderColor: tierInfo.borderColor,
    };
  } catch (error) {
    console.error('레벨 배지 스타일 로드 실패:', error);
    return {
      gradient: "from-orange-500 to-red-600",
      background: "bg-gradient-to-r from-orange-100 to-red-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-500",
    };
  }
};

const getKoreanLevelName = async (levelName: string): Promise<string> => {
  try {
    const response = await fetch(`/api/expert-levels?action=getKoreanTierName&tierName=${encodeURIComponent(levelName)}`);
    const data = await response.json();
    return data.koreanName || levelName;
  } catch (error) {
    console.error('한국어 레벨명 로드 실패:', error);
    return levelName;
  }
};
import ExpertCard from "@/components/expert/ExpertCard";
import ExpertLevelBadge from "@/components/expert/ExpertLevelBadge";

export default function ExpertProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview');
  const [similarExperts, setSimilarExperts] = useState<ExpertProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // 전문가 프로필 데이터
  const [allExperts, setAllExperts] = useState<ExpertProfile[]>([]);
  
  // 전문가 통계 데이터
  const [expertStats, setExpertStats] = useState<{
    totalSessions: number;
    waitingClients: number;
    repeatClients: number;
    avgRating: number;
    reviewCount: number;
    likeCount: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    // 랭킹 관련 필드 추가
    ranking?: number;
    rankingScore?: number;
    totalExperts?: number;
    // 분야별 랭킹 필드 추가
    specialtyRanking?: number;
    specialtyTotalExperts?: number;
    specialty?: string;
    // 레벨 관련 필드 추가
    level?: number;
    tierInfo?: any;
  } | null>(null);

  // 랭킹 탭 상태
  const [activeRankingTab, setActiveRankingTab] = useState<'overall' | 'specialty'>('overall');
  
  // 랭킹 목록 상태
  const [rankingList, setRankingList] = useState<Array<{
    expertId: string;
    expertName?: string;
    rankingScore?: number;
    totalSessions: number;
    avgRating: number;
    specialty?: string;
    specialtyRanking?: number;
    specialtyTotalExperts?: number;
  }>>([]);
  
  // 좋아요 상태
  const [isLiked, setIsLiked] = useState(false);
  
  // 좋아요 상태를 로컬 스토리지에서 불러오는 함수
  const loadLikeState = (expertId: number) => {
    try {
      const likedExperts = JSON.parse(localStorage.getItem('likedExperts') || '[]');
      return likedExperts.includes(expertId);
    } catch (error) {
      console.error('좋아요 상태 로드 실패:', error);
      return false;
    }
  };

  // 좋아요 상태를 로컬 스토리지에 저장하는 함수
  const saveLikeState = (expertId: number, liked: boolean) => {
    try {
      const likedExperts = JSON.parse(localStorage.getItem('likedExperts') || '[]');
      
      if (liked) {
        // 좋아요 추가 (중복 방지)
        if (!likedExperts.includes(expertId)) {
          likedExperts.push(expertId);
        }
      } else {
        // 좋아요 제거
        const index = likedExperts.indexOf(expertId);
        if (index > -1) {
          likedExperts.splice(index, 1);
        }
      }
      
      localStorage.setItem('likedExperts', JSON.stringify(likedExperts));
    } catch (error) {
      console.error('좋아요 상태 저장 실패:', error);
    }
  };

  // 전문가가 변경될 때마다 좋아요 상태 로드
  useEffect(() => {
    if (expert) {
      const liked = loadLikeState(expert.id);
      console.log(`전문가 ${expert.id}의 좋아요 상태 로드:`, liked);
      setIsLiked(liked);
    }
  }, [expert]);

  // 랭킹 탭 변경 시 목록 로드
  useEffect(() => {
    if (expert) {
      loadRankingList(activeRankingTab, expert.specialty);
    }
  }, [activeRankingTab, expert]);

  // 전문가 정보 로드 후 초기 랭킹 목록 로드
  useEffect(() => {
    if (expert && expertStats) {
      loadRankingList('overall');
    }
  }, [expert, expertStats]);
  
  // 리뷰 페이징 상태
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 3; // 페이지당 리뷰 개수

  // 전문가 프로필 데이터 로드
  useEffect(() => {
    const loadExpertProfiles = async () => {
      try {
        const response = await fetch('/api/expert-profiles');
        const result = await response.json();
        if (result.success) {
          // API 응답을 ExpertProfile 형태로 변환
          const convertedProfiles = result.data.profiles.map((apiProfile: any) => ({
            id: parseInt(apiProfile.id),
            name: apiProfile.fullName || apiProfile.name,
            specialty: apiProfile.specialty,
            experience: apiProfile.experienceYears || apiProfile.experience,
            description: apiProfile.bio || apiProfile.description,
            education: [],
            certifications: apiProfile.certifications?.map((cert: any) => cert.name) || [],
            specialties: apiProfile.keywords || [],
            specialtyAreas: apiProfile.keywords || [],
            consultationTypes: apiProfile.consultationTypes || [],
            languages: apiProfile.languages || ['한국어'],
            hourlyRate: 0,
            pricePerMinute: 0,
            totalSessions: apiProfile.totalSessions || 0,
            avgRating: apiProfile.rating || 4.5,
            rating: apiProfile.rating || 4.5,
            reviewCount: apiProfile.reviewCount || 0,
            completionRate: 95,
            repeatClients: apiProfile.repeatClients || 0,
            responseTime: apiProfile.responseTime || '1시간 이내',
            averageSessionDuration: 60,
            cancellationPolicy: '24시간 전 취소 가능',
            availability: apiProfile.availability || {},
            weeklyAvailability: {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: []
            },
            holidayPolicy: undefined,
            contactInfo: {
              phone: '',
              email: apiProfile.email || '',
              location: apiProfile.location || '위치 미설정',
              website: ''
            },
            location: apiProfile.location || '위치 미설정',
            timeZone: apiProfile.timeZone || 'UTC',
            profileImage: apiProfile.profileImage || null,
            portfolioFiles: [],
            portfolioItems: [],
            tags: apiProfile.keywords || [],
            targetAudience: ['성인'],
            isOnline: true,
            isProfileComplete: true,
            createdAt: new Date(apiProfile.createdAt),
            updatedAt: new Date(apiProfile.updatedAt),
            price: apiProfile.hourlyRate ? `₩${apiProfile.hourlyRate.toLocaleString()}` : '가격 문의',
            image: apiProfile.profileImage || null,
            consultationStyle: '체계적이고 전문적인 접근',
            successStories: 50,
            nextAvailableSlot: '2024-01-22T10:00:00',
            profileViews: 500,
            lastActiveAt: new Date(apiProfile.updatedAt),
            joinedAt: new Date(apiProfile.createdAt),
            socialProof: {
              linkedIn: undefined,
              website: undefined,
              publications: []
            },
            pricingTiers: apiProfile.pricingTiers || [
              { duration: 30, price: Math.round((apiProfile.hourlyRate || 50000) * 0.5), description: '기본 상담' },
              { duration: 60, price: apiProfile.hourlyRate || 50000, description: '상세 상담' },
              { duration: 90, price: Math.round((apiProfile.hourlyRate || 50000) * 1.5), description: '종합 상담' }
            ],
            reschedulePolicy: '12시간 전 일정 변경 가능'
          }));
          setAllExperts(convertedProfiles);
        }
      } catch (error) {
        console.error('전문가 프로필 로드 실패:', error);
        // API 실패 시 빈 배열 사용
        setAllExperts([]);
      }
    };

    loadExpertProfiles();
  }, []);

  // 전문가 통계 데이터 로드
  const loadExpertStats = async (expertId: string) => {
    try {
      const response = await fetch(`/api/expert-stats?expertId=${expertId}&includeRanking=true`);
      const result = await response.json();
      if (result.success) {
        setExpertStats(result.data);
        console.log('전문가 통계 로드 성공:', result.data);
      }
    } catch (error) {
      console.error('전문가 통계 로드 실패:', error);
    }
  };

  // 랭킹 목록 로드
  const loadRankingList = async (type: 'overall' | 'specialty', specialty?: string) => {
    try {
      console.log(`랭킹 목록 로드 시작: ${type}`, specialty);
      
      let url = `/api/expert-stats?rankingType=${type}`;
      if (type === 'specialty' && specialty) {
        url += `&specialty=${encodeURIComponent(specialty)}`;
      }
      
      console.log('랭킹 API 호출 URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      console.log('랭킹 API 응답:', result);
      
      if (result.success) {
        const rankings = result.data.rankings || [];
        console.log('로드된 랭킹 데이터:', rankings);
        
        // 전문가 이름 정보 추가
        const rankingsWithNames = rankings.map((ranking: any) => {
          const expertProfile = allExperts.find(exp => exp.id.toString() === ranking.expertId);
          return {
            ...ranking,
            expertName: expertProfile?.name || `전문가 ${ranking.expertId}`,
            specialty: expertProfile?.specialty
          };
        });
        
        console.log('이름이 추가된 랭킹 데이터:', rankingsWithNames);
        setRankingList(rankingsWithNames);
      } else {
        console.error('랭킹 API 응답 실패:', result.error);
      }
    } catch (error) {
      console.error('랭킹 목록 로드 실패:', error);
    }
  };

  // 비슷한 전문가 찾기 함수 (검색 컨텍스트 고려)
  const findSimilarExperts = (currentExpert: ExpertProfile, allExperts: ExpertProfile[], searchContext?: any) => {
    // 먼저 동일한 specialty를 가진 전문가들을 찾기
    const sameSpecialtyExperts = allExperts.filter(expert => 
      expert.id !== currentExpert.id && expert.specialty === currentExpert.specialty
    );
    
    // 다른 specialty를 가진 전문가들
    const otherExperts = allExperts.filter(expert => 
      expert.id !== currentExpert.id && expert.specialty !== currentExpert.specialty
    );
    
    const scoreExpert = (expert: ExpertProfile) => {
      let score = 0;
      
      // 1. 같은 specialty (최우선 - 매우 높은 점수)
      if (expert.specialty === currentExpert.specialty) {
        score += 1000; // 매우 높은 기본 점수
      }
      
      // 2. 검색 컨텍스트 고려 (검색에서 온 경우 추가 가점)
      if (searchContext) {
        // 검색된 카테고리와 일치하는 경우
        if (searchContext.fromCategory && expert.specialty === currentExpert.specialty) {
          score += 100;
        }
        
        // 검색된 연령대와 일치하는 경우
        if (searchContext.fromAgeGroup) {
          const ageGroup = searchContext.fromAgeGroup;
          let ageMatch = false;
          
          if (ageGroup === "teen") {
            ageMatch = expert.targetAudience?.some((target: string) => 
              target.includes("청소년") || target.includes("중학생") || target.includes("고등학생")
            ) || false;
          } else if (ageGroup === "student") {
            ageMatch = expert.targetAudience?.some((target: string) => 
              target.includes("대학생") || target.includes("취준생") || target.includes("학생")
            ) || false;
          } else if (ageGroup === "adult") {
            ageMatch = expert.targetAudience?.some((target: string) => 
              target.includes("성인") || target.includes("직장인") || target.includes("자영업자")
            ) || false;
          } else if (ageGroup === "senior") {
            ageMatch = expert.targetAudience?.some((target: string) => 
              target.includes("시니어") || target.includes("은퇴")
            ) || false;
          }
          
          if (ageMatch) {
            score += 50;
          }
        }
      }
      
      // 3. 공통 태그 개수
      const commonTags = expert.tags?.filter(tag => currentExpert.tags?.includes(tag)) || [];
      score += commonTags.length * 20;
      
      // 4. 비슷한 평점 (±0.5 범위)
      if (Math.abs(expert.rating - currentExpert.rating) <= 0.5) {
        score += 30;
      }
      
      // 5. 비슷한 경력 (±3년 범위)
      if (Math.abs(expert.experience - currentExpert.experience) <= 3) {
        score += 25;
      }
      
      // 6. 공통 상담 방식
      const commonConsultationTypes = expert.consultationTypes?.filter(type => 
        currentExpert.consultationTypes?.includes(type)
      ) || [];
      score += commonConsultationTypes.length * 15;
      
      // 7. 공통 대상 고객
      const commonTargetAudience = expert.targetAudience?.filter(audience => 
        currentExpert.targetAudience?.includes(audience)
      ) || [];
      score += commonTargetAudience.length * 20;
      
      return score;
    };
    
    // 동일한 specialty 전문가들 점수 계산
    const scoredSameSpecialty = sameSpecialtyExperts.map(expert => ({
      ...expert,
      similarityScore: scoreExpert(expert)
    }));
    
    // 다른 specialty 전문가들 점수 계산
    const scoredOtherExperts = otherExperts.map(expert => ({
      ...expert,
      similarityScore: scoreExpert(expert)
    }));
    
    // 동일한 specialty 전문가만 추천 (우선 순위)
    if (scoredSameSpecialty.length > 0) {
      const result = scoredSameSpecialty
        .sort((a, b) => b.similarityScore - a.similarityScore);
      
      // 동일한 specialty가 6명 미만이면 그만큼만 반환
      return result.slice(0, Math.min(6, result.length));
    } else {
      // 동일한 specialty가 전혀 없는 경우에만 다른 specialty 포함
      const result = scoredOtherExperts
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 6);
      return result;
    }
  };

  useEffect(() => {
    const expertId = parseInt(params.id as string);
    
    const loadExpertProfile = async () => {
      try {
        console.log('전문가 상세 데이터 병렬 로드 시작:', expertId);
        const startTime = performance.now();

        // 모든 API를 병렬로 호출
        const [profileResponse, statsResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/expert-profiles/${expertId}`),
          fetch(`/api/expert-stats?expertId=${expertId}&includeRanking=true`),
          fetch(`/api/reviews?expertId=${expertId}&isPublic=true`)
        ]);

        // 프로필 데이터 처리
        if (profileResponse.ok) {
          const result = await profileResponse.json();
          if (result.success) {
            const apiProfile = result.data;
            // API 응답을 ExpertProfile 형태로 변환
            const foundExpert = {
              id: parseInt(apiProfile.id),
              name: apiProfile.fullName || apiProfile.name,
              specialty: apiProfile.specialty,
              experience: apiProfile.experienceYears || apiProfile.experience,
              description: apiProfile.bio || apiProfile.description,
              education: [],
              certifications: apiProfile.certifications?.map((cert: any) => cert.name) || [],
              specialties: apiProfile.keywords || [],
              specialtyAreas: apiProfile.keywords || [],
              consultationTypes: apiProfile.consultationTypes || [],
              languages: apiProfile.languages || ['한국어'],
              hourlyRate: 0,
              pricePerMinute: 0,
              totalSessions: apiProfile.totalSessions || 0,
              avgRating: apiProfile.rating || 4.5,
              rating: apiProfile.rating || 4.5,
              reviewCount: apiProfile.reviewCount || 0,
              completionRate: 95,
              repeatClients: apiProfile.repeatClients || 0,
              responseTime: apiProfile.responseTime || '1시간 이내',
              averageSessionDuration: 60,
              cancellationPolicy: '24시간 전 취소 가능',
              availability: apiProfile.availability || {},
              weeklyAvailability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
              },
              holidayPolicy: undefined,
              contactInfo: {
                phone: '',
                email: apiProfile.email || '',
                location: apiProfile.location || '위치 미설정',
                website: ''
              },
              location: apiProfile.location || '위치 미설정',
              timeZone: apiProfile.timeZone || 'UTC',
              profileImage: apiProfile.profileImage || null,
              portfolioFiles: [],
              portfolioItems: [],
              tags: apiProfile.keywords || [],
              targetAudience: ['성인'],
              isOnline: true,
              isProfileComplete: true,
              createdAt: new Date(apiProfile.createdAt),
              updatedAt: new Date(apiProfile.updatedAt),
              price: apiProfile.hourlyRate ? `₩${apiProfile.hourlyRate.toLocaleString()}` : '가격 문의',
              image: apiProfile.profileImage || null,
              consultationStyle: '체계적이고 전문적인 접근',
              successStories: 50,
              nextAvailableSlot: '2024-01-22T10:00:00',
              profileViews: 500,
              lastActiveAt: new Date(apiProfile.updatedAt),
              joinedAt: new Date(apiProfile.createdAt),
              socialProof: {
                linkedIn: undefined,
                website: undefined,
                publications: []
              },
              pricingTiers: [
                { duration: 30, price: 25000, description: '기본 상담' },
                { duration: 60, price: 45000, description: '상세 상담' },
                { duration: 90, price: 65000, description: '종합 상담' }
              ],
              reschedulePolicy: '12시간 전 일정 변경 가능'
            };
            
            setExpert(foundExpert);
            
            // 통계 데이터 처리 (병렬 호출에서 이미 가져옴)
            if (statsResponse.ok) {
              const statsResult = await statsResponse.json();
              if (statsResult.success) {
                setExpertStats(statsResult.data);
                console.log('전문가 통계 로드 성공:', statsResult.data);
              }
            }
            
            // 리뷰 데이터 처리 (병렬 호출에서 이미 가져옴)
            let expertReviews: any[] = [];
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              expertReviews = reviewsData.data?.reviews || [];
            }
            
            // 리뷰 데이터를 Review 타입으로 변환
            const transformedReviews: Review[] = expertReviews.map(review => ({
              id: parseInt(review.id),
              userId: review.userId,
              userName: review.userName,
              userAvatar: review.userAvatar,
              expertId: review.expertId,
              rating: review.rating,
              comment: review.content,
              consultationTopic: review.category,
              consultationType: 'video' as const,
              createdAt: review.date,
              isVerified: review.isVerified,
              expertReply: review.expertReply || undefined
            }));
            
            setReviews(transformedReviews);
            
            // 검색 컨텍스트 추출
            const searchContext = {
              fromCategory: searchParams.get('fromCategory'),
              fromAgeGroup: searchParams.get('fromAgeGroup'),
              fromStartDate: searchParams.get('fromStartDate'),
              fromEndDate: searchParams.get('fromEndDate'),
            };
            
            // 비슷한 전문가 찾기 (검색 컨텍스트 고려)
            const similar = findSimilarExperts(foundExpert, allExperts, searchContext);
            setSimilarExperts(similar);
            
            const endTime = performance.now();
            const totalTime = Math.round((endTime - startTime) * 100) / 100;
            console.log(`전문가 상세 데이터 병렬 로드 완료: ${totalTime}ms`);
            
            return;
          }
        }
        
        // API 실패 시 allExperts에서 찾기
        let foundExpert = allExperts.find(exp => exp.id === expertId);
        
        // allExperts에서 찾을 수 없으면 undefined 처리
        if (!foundExpert) {
          foundExpert = undefined;
        }
        
        if (foundExpert) {
          setExpert(foundExpert);
          
          // 통계 데이터 처리 (병렬 호출에서 이미 가져옴)
          if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            if (statsResult.success) {
              setExpertStats(statsResult.data);
            }
          }
          
          // 리뷰 데이터 처리 (병렬 호출에서 이미 가져옴)
          let expertReviews: any[] = [];
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            expertReviews = reviewsData.data?.reviews || [];
          }
          
          // 리뷰 데이터를 Review 타입으로 변환
          const transformedReviews: Review[] = expertReviews.map(review => ({
            id: parseInt(review.id),
            userId: review.userId,
            userName: review.userName,
            userAvatar: review.userAvatar,
            expertId: review.expertId,
            rating: review.rating,
            comment: review.content,
            consultationTopic: review.category,
            consultationType: 'video' as const,
            createdAt: review.date,
            isVerified: review.isVerified,
            expertReply: review.expertReply || undefined
          }));
          
          setReviews(transformedReviews);
          
          // 검색 컨텍스트 추출
          const searchContext = {
            fromCategory: searchParams.get('fromCategory'),
            fromAgeGroup: searchParams.get('fromAgeGroup'),
            fromStartDate: searchParams.get('fromStartDate'),
            fromEndDate: searchParams.get('fromEndDate'),
          };
          
          // 비슷한 전문가 찾기 (검색 컨텍스트 고려)
          const similar = findSimilarExperts(foundExpert, allExperts, searchContext);
          setSimilarExperts(similar);
        }
      } catch (error) {
        console.error('전문가 프로필 로드 실패:', error);
        
        // 에러 발생 시 allExperts에서 찾기
        let foundExpert = allExperts.find(exp => exp.id === expertId);
        
        if (!foundExpert) {
          foundExpert = undefined;
        }
        
        if (foundExpert) {
          setExpert(foundExpert);
          loadExpertStats(foundExpert.id.toString());
        }
      }
      
      setIsLoading(false);
    };
    
    loadExpertProfile();
  }, [params.id, searchParams, allExperts]);

  // 페이지 로드 완료 후 스크롤 리셋
  useEffect(() => {
    if (!isLoading) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }, 0);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">전문가 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-6">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">전문가를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 전문가 정보가 존재하지 않거나 삭제되었습니다.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    );
  }

  const handleConsultationRequest = () => {
    // 상담 신청 로직 (추후 구현)
    alert('상담 신청 기능은 준비 중입니다.');
  };

  // 좋아요 토글 처리
  const handleLikeToggle = async () => {
    try {
      if (!expert) return;
      
      console.log(`좋아요 토글 시작 - 현재 상태: ${isLiked}, 전문가 ID: ${expert.id}`);
      
      const newLikeCount = isLiked 
        ? (expertStats?.likeCount || 0) - 1 
        : (expertStats?.likeCount || 0) + 1;
      
      console.log(`새로운 좋아요 수: ${newLikeCount}`);
      
      // 로컬 스토리지에 먼저 저장
      saveLikeState(expert.id, !isLiked);
      console.log(`로컬 스토리지에 좋아요 상태 저장: ${!isLiked}`);
      
      // 좋아요 상태 변경 이벤트 발생 (전문가 찾기 페이지에서 감지)
      window.dispatchEvent(new CustomEvent('favoritesUpdated', {
        detail: { 
          expertId: expert.id,
          action: isLiked ? 'unlike' : 'like',
          likeCount: newLikeCount
        }
      }));
      
      // 로컬 상태 업데이트
      setIsLiked(!isLiked);
      setExpertStats(prev => prev ? { ...prev, likeCount: newLikeCount } : null);
      
      // API 업데이트 (실제 프로덕션에서는 서버에 저장)
      const response = await fetch(`/api/expert-stats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert.id.toString(),
          likeCount: newLikeCount
        })
      });
      
      if (!response.ok) {
        console.error('좋아요 업데이트 실패');
        // 실패 시 원래 상태로 되돌리기
        saveLikeState(expert.id, isLiked); // 로컬 스토리지 복원
        setIsLiked(isLiked);
        setExpertStats(prev => prev ? { ...prev, likeCount: expertStats?.likeCount || 0 } : null);
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      // 에러 시 원래 상태로 되돌리기
      saveLikeState(expert.id, isLiked); // 로컬 스토리지 복원
      setIsLiked(isLiked);
      setExpertStats(prev => prev ? { ...prev, likeCount: expertStats?.likeCount || 0 } : null);
    }
  };

  // 공유하기 처리
  const handleShare = async () => {
    try {
      if (!expert) return;
      
      const shareData = {
        title: `${expert.name} 전문가 프로필`,
        text: `${expert.name} 전문가의 ${expert.specialty} 상담 프로필을 확인해보세요.`,
        url: window.location.href
      };
      
      if (navigator.share && navigator.canShare(shareData)) {
        // 네이티브 공유 API 지원 시
        await navigator.share(shareData);
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유하기 오류:', error);
      // 클립보드 복사 실패 시 URL 표시
      alert(`링크 복사에 실패했습니다. 직접 복사해주세요: ${window.location.href}`);
    }
  };

  // 리뷰 작성 후 통계 새로고침
  const refreshExpertStats = async () => {
    if (expert) {
      await loadExpertStats(expert.id.toString());
    }
  };

  // 페이징된 리뷰 데이터 계산
  const paginatedReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  // 총 페이지 수 계산
  const totalReviewPages = Math.ceil(reviews.length / reviewsPerPage);

  // 페이지 변경 핸들러
  const handleReviewPageChange = (page: number) => {
    setCurrentReviewPage(page);
    // 페이지 변경 시 상단으로 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              이전으로
            </button>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLikeToggle}
                className={`px-3 py-2 rounded-full transition-colors flex items-center space-x-2 ${
                  isLiked 
                    ? "text-red-500 bg-red-50 border border-red-200" 
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200"
                }`}
                title={isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">
                  {isLiked ? "좋아요 취소" : "좋아요"}
                </span>
              </button>
              <button 
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="공유하기"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative flex gap-8">
          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0 w-full lg:w-auto space-y-6">
            {/* 전문가 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* 헤더: 왼쪽 프로필 사진, 오른쪽 모든 정보 */}
                <div className="flex items-start space-x-6">
                  {/* 왼쪽: 프로필 사진과 랭킹 점수 */}
                  <div className="flex-shrink-0 space-y-4">
                    <div className="relative">
                      <div className="w-36 h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center overflow-hidden">
                        {expert.profileImage ? (
                          <img
                            src={expert.profileImage}
                            alt={expert.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 text-4xl font-bold">
                            {expert.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 랭킹 점수 */}
                    {expertStats && (
                      <div className="w-36 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-700">랭킹 점수</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {expertStats.rankingScore || 0}
                          </p>
                          <div className="mt-2">
                            <p className="text-sm text-blue-600">순위</p>
                            <p className="text-lg font-semibold text-blue-900">
                              {expertStats.ranking && expertStats.totalExperts ? 
                                `${expertStats.ranking}/${expertStats.totalExperts}` : 
                                '계산 중...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 모든 정보 */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* 좋아요 수와 레벨 배지 */}
                    <div className="flex items-center justify-between">
                      <ExpertLevelBadge
                        expertId={expert.id.toString()}
                        size="like"
                      />
                      <div className="flex items-center bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm flex-shrink-0">
                        <Heart className="h-4 w-4 mr-1.5 fill-current" />
                        <span className="font-medium">{expertStats?.likeCount || 0}</span>
                      </div>
                    </div>
                    
                    {/* 전문가 이름과 전문 분야 */}
                    <div className="flex items-center space-x-3">
                      <h1 className="text-xl font-bold text-gray-900 truncate">{expert.name}</h1>
                      <p className="text-base text-gray-600 font-medium">{expert.specialty}</p>
                    </div>
                    
                    {/* 평점 및 정보 */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-900 ml-1">{expertStats?.avgRating || expert.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({expertStats?.reviewCount || expert.reviewCount}개 리뷰)</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Award className="h-4 w-4 mr-1" />
                        {expert.experience}년 경력
                      </div>
                    </div>

                    {/* 설명 */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {expert.description}
                    </p>

                    {/* 전문 분야 태그 */}
                    <div className="flex gap-1.5 overflow-hidden">
                      {expert.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 flex-shrink-0"
                        >
                          {tag}
                        </span>
                      ))}
                      {expert.tags.length > 4 && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex-shrink-0">
                          +{expert.tags.length - 4}
                        </span>
                      )}
                    </div>



                    {/* 통계 정보 */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600 pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{expertStats?.totalSessions || expert.totalSessions}회 상담</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{expertStats?.waitingClients || 0}명 대기</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        <span>{expertStats?.repeatClients || expert.repeatClients}명 재방문</span>
                      </div>
                    </div>



                    {/* 상담 방식과 구사 언어 */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        {/* 상담 방식 */}
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 font-medium">상담 방식</span>
                          <div className="flex flex-wrap gap-2 ml-2">
                            {expert.consultationTypes.map((type, index) => (
                                                          <span
                              key={index}
                              className={`px-3 py-1 text-sm rounded-full border flex items-center ${
                                type === 'video' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : type === 'chat'
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}
                            >
                              {type === 'video' && <Video className="h-3 w-3 mr-1" />}
                              {type === 'chat' && <MessageCircle className="h-3 w-3 mr-1" />}
                              {type === 'voice' && <Phone className="h-3 w-3 mr-1" />}
                              {type === 'video' && '화상 상담'}
                              {type === 'chat' && '채팅 상담'}
                              {type === 'voice' && '음성 상담'}
                            </span>
                            ))}
                          </div>
                        </div>

                        {/* 구사 언어 */}
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 font-medium">구사 언어</span>
                          <div className="flex flex-wrap gap-2 ml-2">
                            {expert.languages.map((language, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100"
                              >
                                {language}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="border-b border-gray-200 mb-6 px-6">
                <nav className="flex space-x-8">
                    {[
                      { id: 'overview', label: '개요' },
                      { id: 'reviews', label: '리뷰' },
                      { id: 'availability', label: '예약 가능 시간' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          // 리뷰 탭으로 이동 시 페이지를 1페이지로 리셋
                          if (tab.id === 'reviews') {
                            setCurrentReviewPage(1);
                          }
                        }}
                        className={`py-3 px-2 border-b-2 font-semibold text-base ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

              {/* 탭 컨텐츠 */}
              <div className="px-6 pb-8">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">소개</h3>
                      <p className="text-gray-700 leading-relaxed text-base">{expert.description}</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">전문 분야</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {expert.specialtyAreas.map((area, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                            <span className="text-gray-700 text-base">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>



                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">학력 및 자격</h3>
                      <div className="space-y-3">
                        {expert.education.map((edu, index) => (
                          <div key={index} className="flex items-center">
                            <Award className="h-5 w-5 text-blue-500 mr-3" />
                            <span className="text-gray-700 text-base">{edu}</span>
                          </div>
                        ))}
                        {expert.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center">
                            <Award className="h-5 w-5 text-green-500 mr-3" />
                            <span className="text-gray-700 text-base">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {expert.portfolioItems && expert.portfolioItems.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">포트폴리오</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {expert.portfolioItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2 text-base">{item.title}</h4>
                              <p className="text-gray-600 text-base">{item.description}</p>
                              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                                {item.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    {/* 리뷰 통계 */}
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">고객 리뷰</h3>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="h-6 w-6 text-yellow-500 fill-current" />
                            <span className="text-2xl font-bold text-gray-900 ml-2">
                              {reviews.length > 0 
                                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                                : Number(expertStats?.avgRating || expert.rating || 0).toFixed(1)
                              }
                            </span>
                            <span className="text-base text-gray-600 ml-3">({reviews.length}개 리뷰)</span>
                          </div>
                          <div className="text-base text-gray-500">
                            {reviews.filter(r => r.isVerified).length}개 인증된 리뷰
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 리뷰 목록 */}
                    <div className="space-y-6">
                      {reviews.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-base text-gray-500">아직 리뷰가 없습니다.</p>
                        </div>
                      ) : (
                        <>
                          {/* 페이징된 리뷰 표시 */}
                          {paginatedReviews.map((review) => (
                            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                              {/* 리뷰 헤더 */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-base font-medium text-gray-600">
                                      {review.userName.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="flex items-center">
                                      <p className="font-medium text-gray-900 text-base">{review.userName}</p>
                                      {review.isVerified && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                          인증됨
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center mt-2">
                                      <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-5 h-5 ${
                                              star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="ml-3 text-base text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric"
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center text-base text-gray-500">
                                  {review.consultationType === "video" && <Video className="w-5 h-5 text-blue-500 mr-2" />}
                                  {review.consultationType === "voice" && <Phone className="w-5 h-5 text-green-500 mr-2" />}
                                  {review.consultationType === "chat" && <MessageCircle className="w-5 h-5 text-purple-500 mr-2" />}
                                  <span>{review.consultationTopic}</span>
                                </div>
                              </div>

                              {/* 리뷰 내용 */}
                              <div className="mb-4">
                                <p className="text-gray-700 leading-relaxed text-base">{review.comment}</p>
                              </div>

                              {/* 전문가 답글 */}
                              {review.expertReply && (
                                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                  <div className="flex items-start">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-medium text-white">
                                        {expert.name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <div className="flex items-center mb-2">
                                        <p className="font-medium text-blue-900 text-base">{expert.name} 전문가</p>
                                        <span className="ml-2 text-sm text-blue-600">
                                          {new Date(review.expertReply.createdAt).toLocaleDateString("ko-KR", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-blue-800 text-base">{review.expertReply.message}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* 페이징 컨트롤 */}
                          {totalReviewPages > 1 && (
                            <div className="flex items-center justify-center space-x-2 mt-8">
                              {/* 이전 페이지 버튼 */}
                              <button
                                onClick={() => handleReviewPageChange(currentReviewPage - 1)}
                                disabled={currentReviewPage === 1}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                  currentReviewPage === 1
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                이전
                              </button>

                              {/* 페이지 번호들 */}
                              {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => handleReviewPageChange(page)}
                                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    currentReviewPage === page
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}

                              {/* 다음 페이지 버튼 */}
                              <button
                                onClick={() => handleReviewPageChange(currentReviewPage + 1)}
                                disabled={currentReviewPage === totalReviewPages}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                  currentReviewPage === totalReviewPages
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                다음
                              </button>
                            </div>
                          )}

                          {/* 페이지 정보 표시 */}
                          {totalReviewPages > 1 && (
                            <div className="text-center text-sm text-gray-500 mt-4">
                              {currentReviewPage} / {totalReviewPages} 페이지
                              <span className="ml-2">
                                (총 {reviews.length}개 리뷰 중 {(currentReviewPage - 1) * reviewsPerPage + 1}-{Math.min(currentReviewPage * reviewsPerPage, reviews.length)}번째)
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'availability' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">주간 상담 가능 요일</h3>
                      {expert.holidayPolicy && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-orange-500" />
                          <span className="text-base text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            {expert.holidayPolicy}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                        const dayNames: { [key: string]: string } = {
                          monday: '월요일',
                          tuesday: '화요일', 
                          wednesday: '수요일',
                          thursday: '목요일',
                          friday: '금요일',
                          saturday: '토요일',
                          sunday: '일요일'
                        };
                        
                        const isAvailable = expert.availability && expert.availability[day as keyof typeof expert.availability]?.available;
                        
                        return (
                          <div key={day} className="text-center">
                            <div className={`p-5 rounded-lg border-2 transition-all duration-200 ${
                              isAvailable 
                                ? "border-green-500 bg-green-50" 
                                : "border-gray-300 bg-gray-50"
                            }`}>
                              <div className="text-base font-medium mb-3 text-gray-900">
                                {dayNames[day]}
                              </div>
                              <div className={`text-sm font-medium ${
                                isAvailable ? "text-green-600" : "text-gray-500"
                              }`}>
                                {isAvailable ? "상담 가능" : "상담 불가"}
                              </div>
                              {isAvailable && (
                                <div className="mt-3 text-sm text-green-600 bg-green-100 px-3 py-1.5 rounded">
                                  09:00-18:00
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-6 w-6 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="text-base font-medium text-blue-800 mb-2">상담 시간 안내</h4>
                          <p className="text-base text-blue-700">
                            상담 가능 요일에는 일반적으로 오전 9시부터 오후 6시까지 상담이 가능합니다. 
                            구체적인 예약 시간은 전문가와 직접 조율하여 결정됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {expert.holidayPolicy && (
                      <div className="mt-4 p-5 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-6 w-6 text-orange-500 mt-0.5" />
                          <div>
                            <h4 className="text-base font-medium text-orange-800 mb-2">공휴일 안내</h4>
                            <p className="text-base text-orange-700">
                              {expert.holidayPolicy === "공휴일 휴무" && "공휴일에는 상담을 진행하지 않습니다."}
                              {expert.holidayPolicy === "공휴일 정상 운영" && "공휴일에도 평소와 동일하게 상담이 가능합니다."}
                              {expert.holidayPolicy === "공휴일 오전만 운영" && "공휴일에는 오전 시간대만 상담이 가능합니다."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
                      <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
              {/* 상담 신청 카드 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6">
              <div className="mb-4">
                {(() => {
                  // 공식 랭킹 점수 기반 레벨 사용 (실시간 계산)
                  const actualLevel = 1; // 기본값 (실제로는 API에서 계산된 레벨 사용)
                  
                  // 기본 크레딧 요금 (실제로는 API에서 가져와야 함)
                  const baseCreditsPerMinute = Math.max(100, actualLevel * 0.5);
                  
                  return (
                    <>
                      <p className="text-xs text-blue-700 mb-1">
                        Lv.{actualLevel} 레벨 요금
                      </p>
                      <div className="text-3xl font-bold text-blue-900 mb-1">
                        {baseCreditsPerMinute}크레딧<span className="text-lg font-normal text-blue-600">/분</span>
                      </div>
                      <p className="text-sm text-blue-600">평균 세션 시간: {expert.averageSessionDuration}분 ({baseCreditsPerMinute * expert.averageSessionDuration}크레딧)</p>
                    </>
                  );
                })()}
              </div>

                              <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">응답 시간</span>
                    <span className="font-medium text-blue-900">{expert.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">상담 대기자</span>
                    <span className="font-medium text-blue-900">{expertStats?.waitingClients || 0}명</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">재방문 고객</span>
                    <span className="font-medium text-blue-900">{expertStats?.repeatClients || expert.repeatClients}명</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">좋아요</span>
                    <span className="font-medium text-blue-900">{expertStats?.likeCount || 0}개</span>
                  </div>
                </div>

              <button
                onClick={handleConsultationRequest}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                상담 신청하기
              </button>

                              <div className="mt-4 text-center">
                  <p className="text-xs text-blue-600">
                    {expert.cancellationPolicy}
                  </p>
                </div>
            </div>



            {/* 전문가 랭킹 */}
            {expertStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                  전문가 랭킹
                </h3>
                
                {/* 랭킹 탭 */}
                <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setActiveRankingTab('overall');
                      loadRankingList('overall');
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeRankingTab === 'overall'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    전체 랭킹
                  </button>
                  <button
                    onClick={() => {
                      setActiveRankingTab('specialty');
                      loadRankingList('specialty', expert?.specialty);
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeRankingTab === 'specialty'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    분야별 랭킹
                  </button>
                </div>



                {/* 랭킹 목록 */}
                <div className="mt-4">
                  <div className="space-y-0.5 max-h-80 overflow-y-auto">
                    {rankingList.length > 0 ? (
                      <>
                        {/* 상위 5위까지만 표시 */}
                        {rankingList.slice(0, 5).map((item, index) => {
                          // 공식 랭킹 점수 기반 레벨 사용 (기본값 1)
                          const actualLevel = (item as any).level || 1;
                          
                          return (
                            <div
                              key={item.expertId}
                              className={`flex items-center justify-between py-1.5 px-2 rounded-md text-xs ${
                                item.expertId === expert.id.toString()
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {/* 순위 */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index < 3 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'bg-orange-500 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                
                                {/* 전문가 이름 (레벨) */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {item.expertName || `전문가 ${item.expertId}`}
                                    {item.specialty && (
                                      <span className="text-gray-500 font-normal ml-1">
                                        ({item.specialty})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Lv.{actualLevel}
                                  </div>
                                </div>
                              </div>
                              
                              {/* 상담횟수 - 점수 */}
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-xs text-gray-600 font-medium">
                                  {item.totalSessions}회
                                </div>
                                <div className="text-xs text-blue-600 font-bold">
                                  {Number(item.rankingScore || 0).toFixed(1)}점
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* 전체 랭킹 보러가기 버튼 */}
                        {rankingList.length > 5 && (
                          <div className="pt-2 border-t border-gray-200">
                            <button
                              onClick={() => router.push('/experts/rankings')}
                              className="w-full py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                            >
                              전체 랭킹 보러가기 ({rankingList.length}명)
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-4">
                        {rankingList.length === 0 ? '랭킹 정보를 불러오는 중...' : '랭킹 데이터가 없습니다.'}
                      </div>
                    )}
                  </div>
                  
                  {/* 랭킹 정보 요약 */}
                  {rankingList.length > 0 && (
                    <div className="mt-3 text-center text-xs text-gray-500">
                      총 {activeRankingTab === 'overall' ? (expertStats?.totalExperts || rankingList.length) : rankingList.length}명의 전문가 중 {activeRankingTab === 'overall' ? '전체' : expert?.specialty} 랭킹
                    </div>
                  )}
                </div>
              </div>
            )}




          </div>
        </div>

        {/* 비슷한 전문가 섹션 */}
        {similarExperts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchParams.get('fromCategory') ? "검색 조건에 맞는 다른 전문가" : "비슷한 전문가"}
              </h2>
              <p className="text-gray-600">
                {searchParams.get('fromCategory') 
                  ? `검색하신 조건에 맞는 ${expert?.specialty} 분야의 다른 전문가들입니다.`
                  : `${expert?.specialty} 분야의 다른 전문가들을 확인해보세요.`
                }
              </p>
            </div>

            {/* 전문가 목록 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {similarExperts.map((similarExpert: ExpertProfile) => (
                <ExpertCard
                  key={similarExpert.id}
                  expert={similarExpert}
                  showFavoriteButton={false}
                  showProfileButton={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
