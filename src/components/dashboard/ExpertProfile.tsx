import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type React from "react";
import ExpertLevelBadge from "../expert/ExpertLevelBadge";
import {
  User,
  Users,
  Briefcase,
  Star,
  Calendar,
  FileText,
  Upload,
  X,
  Plus,
  Save,
  Edit,
  Camera,
  Award,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  CheckCircle,
  TrendingUp,
  Target,
  Video,
  MessageCircle,
  Linkedin,
  ExternalLink,
  BookOpen,
} from "lucide-react";
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

const getNextLevelProgress = async (totalSessions: number = 0, avgRating: number = 0) => {
  try {
    // 공식 랭킹 점수를 기반으로 레벨 계산
    const response = await fetch(`/api/expert-levels?action=getNextTierProgress&totalSessions=${totalSessions}&avgRating=${avgRating}`);
    const data = await response.json();
    return data.progress;
  } catch (error) {
    console.error('다음 레벨 진행률 로드 실패:', error);
    return {
      isMaxTier: false,
      progress: 0,
      nextTier: null,
      levelsNeeded: 0,
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

const calculateCreditsPerMinute = async (expert: any) => {
  try {
    const level = 1; // 기본값 (실제로는 API에서 계산된 레벨 사용)
    const response = await fetch(`/api/expert-levels?action=calculateCreditsByLevel&level=${level}`);
    const data = await response.json();
    return data.creditsPerMinute || 100;
  } catch (error) {
    console.error('분당 크레딧 계산 실패:', error);
    return 100; // 기본값
  }
};

const calculateCreditsByLevel = async (level: number = 1): Promise<number> => {
  try {
    const response = await fetch(`/api/expert-levels?action=calculateCreditsByLevel&level=${level}`);
    const data = await response.json();
    return data.creditsPerMinute || 100;
  } catch (error) {
    console.error('크레딧 계산 실패:', error);
    return 100; // 기본값
  }
};

type ConsultationType = "video" | "chat" | "voice";

interface ExpertProfileData {
  isProfileComplete?: boolean;
  name: string;
  specialty: string;
  experience: number | string;
  description: string;
  education: string[];
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  specialties: string[];
  consultationTypes: ConsultationType[];
  languages: string[];
  hourlyRate: number | string;
  pricePerMinute?: number;
  totalSessions: number;
  level?: string | number; // 전문가 레벨
  completionRate?: number; // 완료율
  repeatClients?: number; // 재방문 고객 수
  responseTime?: string; // 응답 시간
  averageSessionDuration?: number; // 평균 상담 시간
  reviewCount?: number; // 리뷰 수
  cancellationPolicy?: string; // 취소 정책
  avgRating: number;
  availability: Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    { available: boolean; hours: string }
  >;
  holidayPolicy?: string; // 공휴일 정책 추가
  contactInfo: {
    phone: string;
    email: string;
    location: string;
    website: string;
  };
  profileImage: string | null;
  portfolioFiles: Array<{
    id: number;
    name: string;
    type: string;
    size: number;
    data: string;
  }>;
  // 소셜 증명 필드 추가
  socialProof?: {
    linkedIn?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    threads?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    publications: string[];
  };

  // 상담 관련 세부 정보 필드들
  consultationStyle?: string;
  profileViews?: number;
  lastActiveAt?: Date;
  joinedAt?: Date;
  reschedulePolicy?: string;

  targetAudience?: string[];
}

interface ExpertProfileProps {
  expertData?: Partial<ExpertProfileData> & { isProfileComplete?: boolean };
  onSave: (updated: ExpertProfileData & { isProfileComplete: boolean }) => void;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onExpertDataUpdate?: (updated: Partial<ExpertProfileData> & { isProfileComplete?: boolean }) => void;
}

const ExpertProfile = forwardRef<any, ExpertProfileProps>(({ 
  expertData, 
  onSave, 
  isEditing: externalIsEditing, 
  onEditingChange,
  onExpertDataUpdate 
}, ref) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false); // 항상 뷰 모드로 시작
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = onEditingChange || setInternalIsEditing;
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMaxRate, setCurrentMaxRate] = useState(600); // 현재 레벨의 최고 요금
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | string[]>("");

  const [profileData, setProfileData] = useState({
    name: expertData?.name || "",
    specialty: expertData?.specialty || "",
    experience: expertData?.experience || "",
    description: expertData?.description || "",
    education: expertData?.education || [""],
    certifications: expertData?.certifications || [{ name: "", issuer: "" }],
    specialties: expertData?.specialties || [""],
    consultationTypes: expertData?.consultationTypes || [],
    languages: expertData?.languages || ["한국어"],
    hourlyRate: expertData?.hourlyRate || (() => {
      // 현재 레벨의 최고 요금을 기본값으로 설정
      const currentLevel = Number(expertData?.level) || 1;
      return calculateCreditsByLevel(currentLevel);
    })(),
    // 레벨 관련 데이터
    totalSessions: expertData?.totalSessions || 0,
    avgRating: expertData?.avgRating || 0,
    level: expertData?.level,
    completionRate: expertData?.completionRate || 95,
    repeatClients: expertData?.repeatClients || 0,
    responseTime: expertData?.responseTime || '2시간 내',
    averageSessionDuration: expertData?.averageSessionDuration || 60,
    reviewCount: expertData?.reviewCount || 0,
    cancellationPolicy: expertData?.cancellationPolicy || '24시간 전 취소 가능',
    pricePerMinute: expertData?.pricePerMinute,
    availability: expertData?.availability || {
      monday: { available: false, hours: "09:00-18:00" },
      tuesday: { available: false, hours: "09:00-18:00" },
      wednesday: { available: false, hours: "09:00-18:00" },
      thursday: { available: false, hours: "09:00-18:00" },
      friday: { available: false, hours: "09:00-18:00" },
      saturday: { available: false, hours: "09:00-18:00" },
      sunday: { available: false, hours: "09:00-18:00" },
    },
    holidayPolicy: expertData?.holidayPolicy || "", // 공휴일 정책 추가
    contactInfo: {
      phone: expertData?.contactInfo?.phone || "",
      email: expertData?.contactInfo?.email || "",
      location: expertData?.contactInfo?.location || "",
      website: expertData?.contactInfo?.website || "",
    },
    profileImage: expertData?.profileImage || null,
    portfolioFiles: expertData?.portfolioFiles || [],
    // 소셜 증명 필드 초기화
    socialProof: expertData?.socialProof || {
      linkedIn: "",
      website: "",
      instagram: "",
      facebook: "",
      threads: "",
      twitter: "",
      youtube: "",
      tiktok: "",
      publications: [""],
    },

    // 상담 관련 세부 정보 필드 초기화
    consultationStyle: expertData?.consultationStyle || "",
    profileViews: expertData?.profileViews || 0,
    lastActiveAt: expertData?.lastActiveAt || new Date(),
    joinedAt: expertData?.joinedAt || new Date(),
    reschedulePolicy: expertData?.reschedulePolicy || "12시간 전 일정 변경 가능",
    targetAudience: expertData?.targetAudience || ["성인", "직장인", "학생"],
  });

  // expertData가 변경될 때 profileData 업데이트
  useEffect(() => {
    if (expertData) {
      setProfileData(prev => ({
        ...prev,
        name: expertData?.name || prev.name,
        specialty: expertData?.specialty || prev.specialty,
        experience: expertData?.experience || prev.experience,
        description: expertData?.description || prev.description,
        education: expertData?.education || prev.education,
        certifications: expertData?.certifications || prev.certifications,
        specialties: expertData?.specialties || prev.specialties,
        consultationTypes: expertData?.consultationTypes || prev.consultationTypes,
        languages: expertData?.languages || prev.languages,
        hourlyRate: expertData?.hourlyRate || prev.hourlyRate || (() => {
          // 현재 레벨의 최고 요금을 기본값으로 설정
          const currentLevel = Number(expertData?.level) || Number(prev.level) || 1;
          return calculateCreditsByLevel(currentLevel);
        })(),
        totalSessions: expertData?.totalSessions || prev.totalSessions,
        avgRating: expertData?.avgRating || prev.avgRating,
        level: expertData?.level || prev.level,
        completionRate: expertData?.completionRate || prev.completionRate,
        repeatClients: expertData?.repeatClients || prev.repeatClients,
        responseTime: expertData?.responseTime || prev.responseTime,
        averageSessionDuration: expertData?.averageSessionDuration || prev.averageSessionDuration,
        reviewCount: expertData?.reviewCount || prev.reviewCount,
        cancellationPolicy: expertData?.cancellationPolicy || prev.cancellationPolicy,
        pricePerMinute: expertData?.pricePerMinute || prev.pricePerMinute,
        availability: expertData?.availability || prev.availability,
        holidayPolicy: expertData?.holidayPolicy || prev.holidayPolicy,
        contactInfo: expertData?.contactInfo || prev.contactInfo,
        profileImage: expertData?.profileImage || prev.profileImage,
        portfolioFiles: expertData?.portfolioFiles || prev.portfolioFiles,
        socialProof: expertData?.socialProof || prev.socialProof,

        consultationStyle: expertData?.consultationStyle || prev.consultationStyle,
        profileViews: expertData?.profileViews || prev.profileViews,
        lastActiveAt: expertData?.lastActiveAt || prev.lastActiveAt,
        joinedAt: expertData?.joinedAt || prev.joinedAt,
        reschedulePolicy: expertData?.reschedulePolicy || prev.reschedulePolicy,
        targetAudience: expertData?.targetAudience || prev.targetAudience,
      }));
    }
  }, [expertData]);

  // 레벨이 변경될 때마다 최고 요금 업데이트
  useEffect(() => {
    const updateMaxRate = async () => {
      const currentLevel = Number(profileData.level) || 1;
      const maxRate = await calculateCreditsByLevel(currentLevel);
      setCurrentMaxRate(maxRate);
    };
    
    updateMaxRate();
  }, [profileData.level]);

  // 현재 전문가의 레벨 정보 계산 (기본값 사용)
  const currentLevel = {
    name: "Tier 1 (Lv.1-99)",
    levelRange: { min: 1, max: 99 },
    creditsPerMinute: 100,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-gradient-to-r from-orange-100 to-red-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-500",
  };
  const nextLevelProgress = {
    isMaxTier: false,
    progress: 0,
    nextTier: {
      name: "Tier 2 (Lv.100-199)",
      levelRange: { min: 100, max: 199 },
      creditsPerMinute: 150,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-gradient-to-r from-yellow-100 to-orange-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-500",
    },
    levelsNeeded: 0,
  };
  const levelBadgeStyles = {
    gradient: "from-orange-500 to-red-600",
    background: "bg-gradient-to-r from-orange-100 to-red-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-500",
  };
  const creditsPerMinute = currentLevel.creditsPerMinute;

  const [dragActive, setDragActive] = useState(false);

  const dayNames = {
    monday: "월요일",
    tuesday: "화요일",
    wednesday: "수요일",
    thursday: "목요일",
    friday: "금요일",
    saturday: "토요일",
    sunday: "일요일",
  };

  const daysOrder: (
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  )[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const consultationTypeOptions = [
    { id: "video", label: "화상 상담" },
    { id: "chat", label: "채팅 상담" },
    { id: "voice", label: "음성 상담" },
  ];

  const handleInputChange = (field: string, value: unknown) => {
    // 이름과 전문분야는 승인 후 수정 불가
    if (field === "name") {
      console.warn("이름은 승인 후 수정할 수 없습니다.");
      return;
    }
    if (field === "specialty") {
      console.warn("전문분야는 승인 후 수정할 수 없습니다.");
      return;
    }
    
    if (field.includes(".")) {
      const [parent, child] = field.split(".") as [
        "contactInfo",
        keyof ExpertProfileData["contactInfo"] & string,
      ];
      if (parent === "contactInfo") {
        setProfileData((prev) => ({
          ...prev,
          contactInfo: {
            ...prev.contactInfo,
            [child]: value as string,
          },
        }));
        return;
      }
    }
    {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayChange = (
    field: "education" | "specialties",
    index: number,
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleCertificationChange = (
    index: number,
    field: "name" | "issuer",
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const addArrayItem = (
    field: "education" | "specialties"
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const addCertification = () => {
    setProfileData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "" }],
    }));
  };

  const removeArrayItem = (
    field: "education" | "specialties",
    index: number
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const removeCertification = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleConsultationTypeToggle = (typeId: ConsultationType) => {
    setProfileData((prev) => ({
      ...prev,
      consultationTypes: prev.consultationTypes.includes(typeId)
        ? prev.consultationTypes.filter((id) => id !== typeId)
        : [...prev.consultationTypes, typeId],
    }));
  };

  const handleAvailabilityChange = (
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday",
    field: "available" | "hours",
    value: boolean | string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };



  const handleFileUpload = (
    event: { target: { files: FileList | null } },
    type: "profile" | "portfolio"
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (type === "profile") {
      const file = files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          const dataUrl = typeof result === "string" ? result : null;
          setProfileData((prev) => ({
            ...prev,
            profileImage: dataUrl,
          }));
        };
        reader.readAsDataURL(file);
      }
    } else if (type === "portfolio") {
      files.forEach((file) => {
        if (
          file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          file.type.startsWith("application/")
        ) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            const dataUrl = typeof result === "string" ? result : "";
            setProfileData((prev) => ({
              ...prev,
              portfolioFiles: [
                ...prev.portfolioFiles,
                {
                  id: Date.now() + Math.random(),
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: dataUrl,
                },
              ],
            }));
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePortfolioFile = (fileId: number) => {
    setProfileData((prev) => ({
      ...prev,
      portfolioFiles: prev.portfolioFiles.filter((file) => file.id !== fileId),
    }));
  };

  // 소셜 증명 관리 함수들
  const handleSocialProofChange = (field: 'linkedIn' | 'website' | 'instagram' | 'facebook' | 'threads' | 'twitter' | 'youtube' | 'tiktok' | 'publications', value: string | string[]) => {
    setProfileData((prev) => ({
      ...prev,
      socialProof: {
        ...prev.socialProof!,
        [field]: value,
      },
    }));
  };







  const addTargetAudience = () => {
    setProfileData((prev) => ({
      ...prev,
      targetAudience: [...prev.targetAudience!, ""],
    }));
  };

  const removeTargetAudience = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience!.filter((_, i) => i !== index),
    }));
  };

  const updateTargetAudience = (index: number, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience!.map((audience, i) =>
        i === index ? value : audience
      ),
    }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(
        { target: { files: e.dataTransfer.files } },
        "portfolio"
      );
    }
  };

  const handleSave = async () => {
    try {
      // 필수항목 검증
      const requiredFields = [
        { field: 'name', label: '이름' },
        { field: 'specialty', label: '전문분야' },
        { field: 'description', label: '자기소개' },
        { field: 'experience', label: '경력' },
        { field: 'hourlyRate', label: '상담요금' },
        { field: 'consultationTypes', label: '상담방식' },
        { field: 'availability', label: '상담 가능시간' }
      ];

      const missingFields = requiredFields.filter(({ field, label }) => {
        const value = profileData[field as keyof typeof profileData];
        
        // 상담방식 검증 (배열이 비어있거나 모든 요소가 빈 문자열인 경우)
        if (field === 'consultationTypes') {
          return !value || !Array.isArray(value) || value.length === 0 || value.every(item => !item || (typeof item === 'string' && item.trim() === ''));
        }
        
        // 상담 가능시간 검증 (모든 요일이 비활성화되어 있는 경우)
        if (field === 'availability') {
          if (!value || typeof value !== 'object') return true;
          return !Object.values(value).some((dayConfig: any) => dayConfig?.available === true);
        }
        
        // 일반 필드 검증
        return !value || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && value <= 0);
      });

      if (missingFields.length > 0) {
        const missingLabels = missingFields.map(field => field.label);
        setModalMessage(missingLabels);
        setShowModal(true);
        return;
      }

      // 저장 중 상태 설정
      setIsSaving(true);
      
      // 이름과 전문분야는 원래 값으로 유지 (승인 후 수정 불가)
      const updatedData = {
        ...profileData,
        name: expertData?.name || profileData.name, // 원래 이름 값 유지
        specialty: expertData?.specialty || profileData.specialty, // 원래 전문분야 값 유지
        hourlyRate: typeof profileData.hourlyRate === 'number' ? profileData.hourlyRate : 100, // 편집된 상담요금 포함
        isProfileComplete: true,
      };
      
      // 저장 실행
      onSave(updatedData);
      
      // 부모 컴포넌트의 expertData 업데이트 (선택적)
      if (typeof onExpertDataUpdate === 'function') {
        onExpertDataUpdate(updatedData);
      }
      
      // 편집 모드 종료
      setIsEditing(false);
      
      // 로컬 상태도 즉시 업데이트하여 UI에 반영
      setProfileData(prev => ({
        ...prev,
        ...updatedData
      }));
    } catch (error) {
      console.error('프로필 저장 중 오류 발생:', error);
      setModalMessage("프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setShowModal(true);
    } finally {
      // 저장 완료 후 로딩 상태 해제
      setIsSaving(false);
    }
  };

  // ref를 통해 handleSave 함수 노출
  useImperativeHandle(ref, () => ({
    handleSave
  }));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isEditing) {
    // 프로필 보기 모드 - 사용자 페이지와 비슷한 구성
    // 보기 모드에서는 expertData를 우선적으로 사용하여 최신 데이터 표시
    const displayData = {
      ...profileData,
      ...expertData, // expertData가 우선 (최신 데이터)
    };
    
    return (
      <div>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 컨텐츠 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 전문가 기본 정보 - 카드와 비슷한 레이아웃 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
                  {/* 헤더: 왼쪽 프로필 사진, 오른쪽 모든 정보 */}
                  <div className="flex items-start space-x-6">
                    {/* 왼쪽: 프로필 사진 */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-36 h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-100 shadow-md">
              {displayData.profileImage ? (
                <img
                  src={displayData.profileImage}
                              alt={displayData.name}
                              className="w-full h-full object-cover"
                />
              ) : (
                            <span className="text-blue-600 text-4xl font-bold">
                              {displayData.name.charAt(0)}
                            </span>
              )}
            </div>

                        {/* 전문가 레벨 배지 */}
                        <div className="absolute -bottom-1 -right-1">
                          <ExpertLevelBadge 
                            expertId="1" 
                            size="sm"
                            className="border border-white rounded-full shadow-sm"
                          />
                        </div>
                </div>
              </div>

                    {/* 오른쪽: 모든 정보 */}
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* 상단: 이름과 활성 상태 */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <h1 
                            className="text-xl font-bold text-gray-900 truncate cursor-help"
                            title="이름은 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터(1588-0000)로 문의해주세요."
                          >
                            {displayData.name}
                          </h1>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            승인 후 수정 불가
                          </span>
                        </div>
                        <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                          활성화됨
                </div>
              </div>

                      {/* 전문 분야 */}
                      <div className="flex items-center space-x-2">
                        <p 
                          className="text-base text-gray-600 font-medium cursor-help"
                          title="전문분야는 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터(1588-0000)로 문의해주세요."
                        >
                          {displayData.specialty}
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          승인 후 수정 불가
                        </span>
                      </div>
                      
                      {/* 평점 및 정보 */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold text-gray-900 ml-1">{Number(displayData.avgRating || 0).toFixed(1)}</span>
                          <span className="text-sm text-gray-500 ml-1">({displayData.reviewCount || 0}개 리뷰)</span>
              </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Award className="h-4 w-4 mr-1" />
                          {displayData.experience}년 경력
            </div>
          </div>

                      {/* 설명 */}
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {displayData.description}
                      </p>

                      {/* 전문 분야 태그 */}
                      <div className="flex gap-1.5 overflow-hidden">
                        {displayData.specialties.filter(s => s).slice(0, 4).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 flex-shrink-0"
                          >
                            {tag}
                  </span>
                        ))}
                        {displayData.specialties.filter(s => s).length > 4 && (
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex-shrink-0">
                            +{displayData.specialties.filter(s => s).length - 4}
                  </span>
                        )}
                </div>

                      {/* 상담 방식 및 답변 시간 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {displayData.consultationTypes.map((type) => {
                            let Icon = MessageCircle;
                            let label = "채팅";
                            
                            if (type === "video") {
                              Icon = Video;
                              label = "화상";
                            } else if (type === "voice") {
                              Icon = Phone;
                              label = "음성";
                            }

                            return (
                              <div
                                key={type}
                                className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                                title={`${label} 상담`}
                              >
                                <Icon className="h-3 w-3 mr-1" />
                                {label}
                </div>
                            );
                          })}
                        </div>

                        {/* 답변 시간 표시 */}
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span>{"2시간 내"}</span>
                        </div>
                      </div>

                      {/* 통계 정보 */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{displayData.totalSessions || 0}회 상담</span>
                  </div>
                  <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>{displayData.completionRate || 95}% 완료율</span>
                  </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1" />
                          <span>{displayData.repeatClients || 0}명 재방문</span>
                </div>
              </div>
            </div>
            </div>
                </div>
              </div>

              {/* 전문 분야 및 자격 정보 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 전문 분야 */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      전문 분야
                    </h3>
                    <div className="space-y-2">
                      {profileData.specialties.filter(s => s).map((specialty, index) => (
                        <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">{specialty}</span>
                        </div>
                    ))}
                </div>
              </div>

                  {/* 상담 방식 */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                      상담 방식
                    </h3>
                    <div className="space-y-2">
                      {profileData.consultationTypes.map((type) => {
                        let IconComponent = MessageCircle;
                        let label = "채팅 상담";
                        
                        if (type === "video") {
                      IconComponent = Video;
                          label = "화상 상담";
                        } else if (type === "voice") {
                      IconComponent = Phone;
                          label = "음성 상담";
                    }

                    return (
                          <div key={type} className="flex items-center p-3 bg-green-50 rounded-lg">
                            <IconComponent className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                          </div>
                    );
                  })}
                </div>
              </div>
            </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* 학력 */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-2" />
                  학력
                    </h3>
                <div className="space-y-2">
                      {profileData.education.filter(edu => edu).map((edu, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Award className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">{edu}</span>
                      </div>
                    ))}
                </div>
              </div>

                  {/* 자격증 */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  자격증 및 인증
                    </h3>
                <div className="space-y-2">
                      {profileData.certifications.filter(cert => cert.name).map((cert, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{cert.name}</span>
                            {cert.issuer && (
                              <span className="text-xs text-gray-500 ml-2">({cert.issuer})</span>
                            )}
                          </div>
                      </div>
                    ))}
                    </div>
                </div>
              </div>
            </div>
          </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 레벨 및 요금 정보 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  {(() => {
                    // 공식 랭킹 점수 기반 레벨은 API에서 계산됨
                    const actualLevel = profileData.level || 1;
                    
                    return (
                      <>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {creditsPerMinute} 크레딧<span className="text-base font-normal text-gray-500">/분</span>
                        </div>
                        <p className="text-sm text-gray-600">내 전문가 레벨 요금</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Lv.{actualLevel} 레벨 요금
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">총 상담 횟수</span>
                    <span className="font-medium text-gray-900">{profileData.totalSessions || 0}회</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">평균 평점</span>
                    <span className="font-medium text-gray-900">{Number(profileData.avgRating || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">경력</span>
                    <span className="font-medium text-gray-900">{profileData.experience}년</span>
                  </div>
                </div>
              </div>

              {/* 레벨 진행률 정보 */}
              {!nextLevelProgress.isMaxTier && nextLevelProgress.nextTier && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    다음 레벨까지의 진행률
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                                              <span className="text-gray-600">
                          다음 티어: {nextLevelProgress.nextTier?.name || '최고 티어'}
                        </span>
                      <span className="font-medium text-blue-600">
                        {Math.round(nextLevelProgress.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${nextLevelProgress.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-green-600 mr-1" />
                        <span>다음 티어까지 레벨 {nextLevelProgress.levelsNeeded} 필요</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 최고 레벨 달성 메시지 */}
              {nextLevelProgress.isMaxTier && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="h-5 w-5 text-yellow-600 mr-2" />
                    최고 레벨 달성! 🎉
                  </h3>
                  <p className="text-sm text-gray-700">
                    축하합니다! 최고 티어인{" "}
                    <strong>{currentLevel.name}</strong>에
                    도달하셨습니다.
                  </p>
                </div>
              )}

              {/* 상담 가능 시간 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    상담 가능 요일
                  </h3>
                  {profileData.holidayPolicy && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                        {profileData.holidayPolicy}
                      </span>
                    </div>
                  )}
                </div>

                {/* 상담 가능 요일 간단 표시 */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(profileData.availability).map((day) => {
                      const dayNames: { [key: string]: string } = {
                        monday: "월",
                        tuesday: "화",
                        wednesday: "수",
                        thursday: "목",
                        friday: "금",
                        saturday: "토",
                        sunday: "일",
                      };
                      
                      const isAvailable = profileData.availability[day as keyof typeof profileData.availability]?.available;
                      
                      return isAvailable ? (
                        <span
                          key={day}
                          className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200"
                        >
                          {dayNames[day]}요일
                        </span>
                      ) : null;
                    })}
                  </div>
                  {!Object.keys(profileData.availability).some((day) => 
                    profileData.availability[day as keyof typeof profileData.availability]?.available
                  ) && (
                    <p className="text-sm text-gray-500">등록된 상담 가능 요일이 없습니다.</p>
                  )}
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>참고:</strong> 상담 가능 요일에는 일반적으로 오전 9시부터 오후 6시까지 상담이 가능합니다.
                    구체적인 예약 시간은 고객과 직접 조율하여 결정하세요.
                  </p>
                </div>

                {/* 공휴일 정책과 일정 변경 정책 안내 */}
                <div className="mt-4 space-y-3">
                  {profileData.holidayPolicy && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-orange-800 mb-1">공휴일 안내</h4>
                          <p className="text-sm text-orange-700">
                            {profileData.holidayPolicy === "공휴일 휴무" && "공휴일에는 상담을 진행하지 않습니다."}
                            {profileData.holidayPolicy === "공휴일 정상 운영" && "공휴일에도 평소와 동일하게 상담이 가능합니다."}
                            {profileData.holidayPolicy === "공휴일 오전만 운영" && "공휴일에는 오전 시간대만 상담이 가능합니다."}
                            {profileData.holidayPolicy === "공휴일 오후만 운영" && "공휴일에는 오후 시간대만 상담이 가능합니다."}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}
                  
                  {profileData.reschedulePolicy && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">일정 변경 정책</h4>
                          <p className="text-sm text-blue-700">{profileData.reschedulePolicy}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 상담 관련 세부 정보 섹션 */}
          <div className="max-w-6xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                상담 관련 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 상담 스타일 */}
                {displayData.consultationStyle && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">상담 스타일</h4>
                    <p className="text-sm text-blue-700">{displayData.consultationStyle}</p>
                  </div>
                )}



                {/* 프로필 조회수 */}
                {displayData.profileViews && displayData.profileViews > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">프로필 조회수</h4>
                    <p className="text-sm text-purple-700">{displayData.profileViews.toLocaleString()}회</p>
                  </div>
                )}





                {/* 가입일 */}
                {displayData.joinedAt && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-indigo-800 mb-2">가입일</h4>
                    <p className="text-sm text-indigo-700">
                      {new Date(displayData.joinedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>



              {/* 타겟 고객층 */}
              {displayData.targetAudience && displayData.targetAudience.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">주요 대상 고객</h4>
                  <div className="flex flex-wrap gap-2">
                    {displayData.targetAudience.filter(audience => audience).map((audience, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full border border-green-200"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 소셜 증명 섹션 */}
          {displayData.socialProof && (
            displayData.socialProof.linkedIn || 
            displayData.socialProof.website || 
            displayData.socialProof.instagram ||
            displayData.socialProof.facebook ||
            displayData.socialProof.threads ||
            displayData.socialProof.twitter ||
            displayData.socialProof.youtube ||
            displayData.socialProof.tiktok
          ) && (
            <div className="max-w-6xl mx-auto py-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Globe className="h-5 w-5 text-blue-600 mr-2" />
                  소셜 증명 및 링크
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* LinkedIn */}
                  {displayData.socialProof.linkedIn && (
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Linkedin className="h-6 w-6 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">LinkedIn</p>
                        <a 
                          href={displayData.socialProof.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 웹사이트 */}
                  {displayData.socialProof.website && (
                    <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <Globe className="h-6 w-6 text-green-600 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">웹사이트</p>
                        <a 
                          href={displayData.socialProof.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 flex items-center"
                        >
                          사이트 방문
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Instagram */}
                  {displayData.socialProof.instagram && (
                    <div className="flex items-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <svg className="h-6 w-6 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Instagram</p>
                        <a 
                          href={displayData.socialProof.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-600 hover:text-pink-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Facebook */}
                  {displayData.socialProof.facebook && (
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <svg className="h-6 w-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Facebook</p>
                        <a 
                          href={displayData.socialProof.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Threads */}
                  {displayData.socialProof.threads && (
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="h-6 w-6 text-gray-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.518.85-6.372 2.495-8.423C5.845 1.205 8.598.024 12.179 0h.007c3.581.024 6.334 1.205 8.184 3.509C22.65 5.56 23.5 8.414 23.5 11.932c0 3.518-.85 6.372-2.495 8.423C19.155 22.795 16.402 23.976 12.821 24h.365zm0-1.5c2.803-.02 4.963-.8 6.4-2.3 1.4-1.5 2.1-3.6 2.1-6.1s-.7-4.6-2.1-6.1c-1.4-1.5-3.6-2.3-6.4-2.3s-5 .8-6.4 2.3c-1.4 1.5-2.1 3.6-2.1 6.1s.7 4.6 2.1 6.1c1.4 1.5 3.6 2.3 6.4 2.3z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Threads</p>
                        <a 
                          href={displayData.socialProof.threads}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Twitter */}
                  {displayData.socialProof.twitter && (
                    <div className="flex items-center p-4 bg-sky-50 rounded-lg border border-sky-200">
                      <svg className="h-6 w-6 text-sky-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Twitter</p>
                        <a 
                          href={displayData.socialProof.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-sky-600 hover:text-sky-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* YouTube */}
                  {displayData.socialProof.youtube && (
                    <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <svg className="h-6 w-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">YouTube</p>
                        <a 
                          href={displayData.socialProof.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:text-red-800 flex items-center"
                        >
                          채널 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TikTok */}
                  {displayData.socialProof.tiktok && (
                    <div className="flex items-center p-4 bg-black rounded-lg border border-gray-800">
                      <svg className="h-6 w-6 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">TikTok</p>
                        <a 
                          href={displayData.socialProof.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          프로필 보기
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </div>
          )}



          {/* 포트폴리오 파일 섹션 */}
          {profileData.portfolioFiles.length > 0 && (
            <div className="max-w-6xl mx-auto py-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                포트폴리오 파일
                </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profileData.portfolioFiles.map((file) => (
                  <div
                    key={file.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-gray-50"
                  >
                    <div className="text-center">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={file.data}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg mb-3 shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <p
                        className="text-sm text-gray-700 font-medium truncate mb-1"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          )}

          {/* 출판물 및 논문 섹션 */}
          {displayData.socialProof && displayData.socialProof.publications.filter(p => p).length > 0 && (
            <div className="max-w-6xl mx-auto py-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  출판물 및 논문
                </h3>
                <div className="space-y-2">
                  {displayData.socialProof.publications.filter(p => p).map((publication, index) => (
                    <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <BookOpen className="h-4 w-4 text-purple-500 mr-3" />
                      <span className="text-sm text-gray-700">{publication}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 프로필 편집 모드
  return (
    <>
      <div className="bg-white shadow rounded-lg">

      <div className="p-6">
        <div className="space-y-8">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              기본 정보
            </h4>

            {/* 프로필 사진과 기본 정보를 가로로 배치 */}
            <div className="flex items-start space-x-6 mb-6">
              {/* 왼쪽: 프로필 사진 */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-36 h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center overflow-hidden">
                    {profileData.profileImage ? (
                      <img
                        src={profileData.profileImage}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 text-4xl font-bold">
                        {profileData.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* 사진 업로드 버튼 */}
                  <div className="mt-4 w-36">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "profile")}
                      className="hidden"
                    />
                    <label
                      htmlFor="profileImage"
                      className="cursor-pointer inline-flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      사진 변경
                    </label>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      <div>권장 사이즈: 400×600px</div>
                      <div>최대 용량: 5MB</div>
                      <div>지원 형식: JPG, PNG</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 기본 정보 입력 필드들 */}
              <div className="flex-1 space-y-4">
                {/* 첫 번째 행: 이름과 경력 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        (승인 후 수정 불가)
                      </span>
                    </label>
                    
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      disabled={true}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed transition-colors"
                      placeholder="전문가 이름을 입력하세요"
                      title="이름은 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터(1588-0000)로 문의해주세요."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      이름은 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터에 문의해주세요.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경력 (년) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={profileData.experience}
                      onChange={(e) =>
                        handleInputChange("experience", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="경력 년수"
                      min="0"
                    />
                  </div>
                </div>

                {/* 두 번째 행: 전문 분야와 세부 전문 분야 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전문 분야 <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        (승인 후 수정 불가)
                      </span>
                    </label>
                    
                    <input
                      type="text"
                      value={profileData.specialty}
                      onChange={(e) =>
                        handleInputChange("specialty", e.target.value)
                      }
                      disabled={true}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed transition-colors"
                      placeholder="예: 심리상담, 법률상담 등"
                      title="전문분야는 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터(1588-0000)로 문의해주세요."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      전문분야는 승인 후 수정할 수 없습니다. 변경이 필요한 경우 고객센터에 문의해주세요.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      세부 전문 분야
                    </label>
                    <input
                      type="text"
                      value={profileData.specialties.join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        const specialties = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        handleInputChange("specialties", specialties);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="예: 우울증, 불안장애, 대인관계, 스트레스 관리"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      콤마(,)로 구분하여 여러 전문 분야를 입력하세요
                    </p>
                  </div>
                </div>

                {/* 세 번째 행: 상담요금과 레벨별 요금 안내 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상담요금 (크레딧/분) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={typeof profileData.hourlyRate === 'number' ? profileData.hourlyRate : 100}
                      onChange={async (e) => {
                        const value = parseInt(e.target.value) || 0;
                        const currentLevel = Number(profileData.level) || 1;
                        
                        // 10크레딧 단위로만 입력 가능
                        if (value % 10 !== 0) {
                          alert("상담요금은 10크레딧 단위로만 입력 가능합니다.");
                          return;
                        }
                        
                        // 현재 레벨의 실제 최고 요금 가져오기
                        const maxAllowedRate = await calculateCreditsByLevel(currentLevel);
                        if (value <= maxAllowedRate) {
                          handleInputChange("hourlyRate", value);
                        } else {
                          alert(`현재 레벨(Lv.${currentLevel})에서는 최대 ${maxAllowedRate} 크레딧/분까지만 설정할 수 있습니다.`);
                        }
                      }}
                      onBlur={async (e) => {
                        // 포커스 아웃 시 10크레딧 단위로 자동 조정
                        const value = parseInt(e.target.value) || 0;
                        if (value % 10 !== 0) {
                          const adjustedValue = Math.round(value / 10) * 10;
                          const currentLevel = Number(profileData.level) || 1;
                          
                          // 현재 레벨의 실제 최고 요금 가져오기
                          const maxAllowedRate = await calculateCreditsByLevel(currentLevel);
                          
                          if (adjustedValue <= maxAllowedRate) {
                            handleInputChange("hourlyRate", adjustedValue);
                          } else {
                            // 최대값을 초과하는 경우 최대값으로 설정
                            handleInputChange("hourlyRate", maxAllowedRate);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="상담요금 (크레딧/분) - 10크레딧 단위"
                      min="0"
                      max={currentMaxRate}
                      step="10"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      현재 레벨 최고 요금: <span className="font-medium text-blue-600">{currentMaxRate} 크레딧/분</span>
                      <span className="ml-2 text-gray-400">• 10크레딧 단위로만 입력 가능</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      레벨별 최고 요금 확인
                    </label>
                    {/* 전문가 레벨별 최고 요금 안내 */}
                    <div className="border border-blue-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                        className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between text-left border-0 rounded-lg"
                      >
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-blue-800">
                            전문가 레벨별 최고 요금 확인하기
                          </span>
                        </div>
                        <svg 
                          className={`h-4 w-4 text-blue-400 transition-transform ${isPricingExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isPricingExpanded && (
                        <div className="p-3 bg-blue-50 border-t border-blue-200">
                          <div className="space-y-1 text-xs text-blue-700">
                            <div>• Lv.1-99: 최대 100 크레딧/분</div>
                            <div>• Lv.100-199: 최대 150 크레딧/분</div>
                            <div>• Lv.200-299: 최대 200 크레딧/분</div>
                            <div>• Lv.400-499: 최대 300 크레딧/분</div>
                            <div>• Lv.500-599: 최대 350 크레딧/분</div>
                            <div>• Lv.600-699: 최대 400 크레딧/분</div>
                            <div>• Lv.700-799: 최대 450 크레딧/분</div>
                            <div>• Lv.800-899: 최대 500 크레딧/분</div>
                            <div>• Lv.900-998: 최대 500 크레딧/분</div>
                            <div>• Lv.999: 최대 600 크레딧/분</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>



            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자기소개 <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                고객들이 보는 소개서입니다. 자신만의 상담 방식과 경험, 전문성을 잘 어필하여 고객들의 신뢰를 얻고 상담 신청을 유도하세요.
              </p>
              <textarea
                value={profileData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="안녕하세요! 저는 [전문분야] 전문가로서 [경력]년간의 경험을 바탕으로 고객님의 [목표/문제]를 해결해드립니다. [구체적인 상담 방식]을 통해 맞춤형 솔루션을 제공하며, [성공 사례/결과]를 보장합니다. 함께 성장해나가요!"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📝 효과적인 자기소개 작성 팁</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>경험과 성과</strong>: 구체적인 경력, 자격증, 성공 사례를 포함하세요</li>
                  <li>• <strong>상담 방식</strong>: 어떤 접근법과 방법으로 상담하는지 명시하세요</li>
                  <li>• <strong>고객 혜택</strong>: 상담을 받으면 어떤 도움을 받을 수 있는지 구체적으로 설명하세요</li>
                  <li>• <strong>개인적 터치</strong>: 전문성과 함께 따뜻하고 신뢰할 수 있는 모습을 보여주세요</li>
                  <li>• <strong>명확한 목표</strong>: 고객이 어떤 문제를 해결할 수 있는지 명확히 제시하세요</li>
                </ul>
              </div>
            </div>
          </div>





          {/* 상담 방식 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              상담 방식 <span className="text-red-500">*</span>
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              고객에게 제공할 수 있는 상담 방식을 선택하세요. 선택한 방식에 따라 고객들이 상담을 신청할 수 있습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {consultationTypeOptions.map((option) => {
                const isSelected = profileData.consultationTypes.includes(
                  option.id as ConsultationType
                );

                // 아이콘 결정
                let IconComponent;
                if (option.id === "video") {
                  IconComponent = Video;
                } else if (option.id === "chat") {
                  IconComponent = MessageCircle;
                } else if (option.id === "voice") {
                  IconComponent = Phone;
                }

                return (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        handleConsultationTypeToggle(
                          option.id as ConsultationType
                        )
                      }
                      className="sr-only"
                    />
                    {/* 아이콘 표시 */}
                    {IconComponent && (
                      <IconComponent className={`h-6 w-6 mr-4 ${
                        isSelected ? "text-blue-600" : "text-gray-500"
                      }`} />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-blue-500 ml-2" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 상담 가능 시간 설정 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              상담 가능 시간 <span className="text-red-500">*</span>
            </h4>
            
            {/* 상담 가능 요일과 공휴일 정책을 한 줄에 배치 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* 주간 상담 가능 요일 */}
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                  주간 상담 가능 요일
                </h5>
              
              {/* 요일 선택 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {daysOrder.map((day) => {
                  const isAvailable = profileData.availability[day]?.available;
                  
                  return (
                    <div key={day} className="text-center">
                      <label className="flex flex-col items-center cursor-pointer">
                        <div className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                          isAvailable 
                            ? "border-green-500 bg-green-50 text-green-800" 
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}>
                          <div className="text-sm font-medium mb-2">
                            {dayNames[day]}
                          </div>
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            checked={!!isAvailable}
                            onChange={() => {
                              const newAvailable = !isAvailable;
                              handleAvailabilityChange(day, "available", newAvailable);
                              // 활성화할 때 기본 시간 설정, 비활성화할 때 시간 초기화
                              if (newAvailable) {
                                handleAvailabilityChange(day, "hours", "09:00-18:00");
                              } else {
                                handleAvailabilityChange(day, "hours", "");
                              }
                            }}
                          />
                        </div>
                        <span className={`mt-2 text-xs font-medium ${
                          isAvailable ? "text-green-600" : "text-gray-500"
                        }`}>
                          {isAvailable ? "상담 가능" : "상담 불가"}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* 설명 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>사용법:</strong> 
                  상담을 제공하고 싶은 요일을 선택하세요. 선택된 요일에는 기본적으로 오전 9시부터 오후 6시까지 상담이 가능한 것으로 설정됩니다.
                </p>
              </div>
              </div>

              {/* 공휴일 정책과 일정 변경 정책 */}
              <div className="space-y-4">
                {/* 공휴일 정책 선택 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-orange-800 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 text-orange-600 mr-2" />
                    공휴일 상담 정책
                  </h5>
                  <div className="space-y-2">
                    {[
                      { value: "", label: "정책 없음" },
                      { value: "공휴일 휴무", label: "공휴일 휴무" },
                      { value: "공휴일 정상 운영", label: "정상 운영" },
                      { value: "공휴일 오전만 운영", label: "오전만 운영" },
                      { value: "공휴일 오후만 운영", label: "오후만 운영" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="holidayPolicy"
                          value={option.value}
                          checked={profileData.holidayPolicy === option.value}
                          onChange={(e) => handleInputChange("holidayPolicy", e.target.value)}
                          className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    고객에게 공휴일 상담 가능 여부를 알려줍니다.
                  </p>
                </div>

                {/* 일정 변경 정책 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    일정 변경 정책
                  </h5>
                  <select
                    value={profileData.reschedulePolicy || "12시간 전 일정 변경 가능"}
                    onChange={(e) => handleInputChange("reschedulePolicy", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="12시간 전 일정 변경 가능">12시간 전 일정 변경 가능</option>
                    <option value="24시간 전 일정 변경 가능">24시간 전 일정 변경 가능</option>
                    <option value="48시간 전 일정 변경 가능">48시간 전 일정 변경 가능</option>
                    <option value="일정 변경 불가">일정 변경 불가</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-2">
                    고객이 상담 일정을 변경할 수 있는 정책을 설정합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 학력 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 text-blue-600 mr-2" />
              학력
            </h4>

            <div className="space-y-3">
              {profileData.education.map((edu, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={edu}
                    onChange={(e) =>
                      handleArrayChange("education", index, e.target.value)
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="예: 서울대학교 심리학과 학사"
                  />
                  {profileData.education.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("education", index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addArrayItem("education")}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              학력 추가
            </button>
          </div>

          {/* 자격증 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 text-blue-600 mr-2" />
              자격증 및 인증
            </h4>

            <div className="space-y-4">
              {profileData.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">자격증 {index + 1}</h5>
                    {profileData.certifications.length > 1 && (
                      <button
                        onClick={() => removeCertification(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        자격증 이름
                      </label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) =>
                          handleCertificationChange(index, "name", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="예: 임상심리사 1급"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        발급 및 인증기관
                      </label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) =>
                          handleCertificationChange(index, "issuer", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="예: 한국심리학회, 대한변호사협회"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addCertification}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              자격증 추가
            </button>
          </div>

          {/* 포트폴리오 파일 업로드 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              포트폴리오 및 자격증
            </h4>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-gray-600">
                  파일을 드래그하여 업로드하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, PDF 파일 지원 (파일당 최대 10MB)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileUpload(e, "portfolio")}
                className="hidden"
                id="portfolioFiles"
              />
              <label
                htmlFor="portfolioFiles"
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                파일 선택
              </label>
            </div>

            {/* 업로드된 파일 목록 */}
            {profileData.portfolioFiles.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-3">
                  업로드된 파일
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profileData.portfolioFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => removePortfolioFile(file.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <div className="text-center">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.data}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <p
                          className="text-xs text-gray-600 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 출판물 및 논문 섹션 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
              출판물 및 논문
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출판물 및 논문
              </label>
              <input
                type="text"
                value={profileData.socialProof?.publications.join(', ') || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const publications = value.split(',').map(p => p.trim()).filter(p => p.length > 0);
                  handleSocialProofChange("publications", publications);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="예: '심리상담의 새로운 접근법', 'Journal of Psychology, 2023', '마음의 치유법'"
              />
              <p className="mt-1 text-xs text-gray-500">
                콤마(,)로 구분하여 여러 출판물을 입력하세요. 논문, 저서, 기고글 등 전문성을 보여주는 출판물을 추가하세요.
              </p>
            </div>
          </div>

          {/* 소셜 증명 섹션 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              소셜 증명 및 링크
            </h4>

            <div className="space-y-6">
              {/* 소셜 미디어 링크들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.linkedIn || ""}
                    onChange={(e) => handleSocialProofChange("linkedIn", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>

                {/* 웹사이트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개인/회사 웹사이트 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.website || ""}
                    onChange={(e) => handleSocialProofChange("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://your-website.com"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.instagram || ""}
                    onChange={(e) => handleSocialProofChange("instagram", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://instagram.com/your-profile"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.facebook || ""}
                    onChange={(e) => handleSocialProofChange("facebook", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://facebook.com/your-profile"
                  />
                </div>

                {/* Threads */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threads 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.threads || ""}
                    onChange={(e) => handleSocialProofChange("threads", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://threads.net/@your-profile"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.twitter || ""}
                    onChange={(e) => handleSocialProofChange("twitter", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://twitter.com/your-profile"
                  />
                </div>

                {/* YouTube */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube 채널 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.youtube || ""}
                    onChange={(e) => handleSocialProofChange("youtube", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://youtube.com/@your-channel"
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok 프로필 URL
                  </label>
                  <input
                    type="url"
                    value={profileData.socialProof?.tiktok || ""}
                    onChange={(e) => handleSocialProofChange("tiktok", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="https://tiktok.com/@your-profile"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>팁:</strong> 소셜 미디어 링크는 전문성을 보여주고 고객과의 신뢰를 쌓는 데 도움이 됩니다. 
                  관련된 콘텐츠나 전문 분야와 관련된 활동을 보여주는 계정을 연결해보세요.
                </p>
              </div>


            </div>
          </div>



          {/* 상담 관련 세부 정보 섹션 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              상담 관련 세부 정보
            </h4>

            <div className="space-y-6">
              {/* 상담 스타일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 스타일
                </label>
                <textarea
                  value={profileData.consultationStyle || ""}
                  onChange={(e) => handleInputChange("consultationStyle", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="예: 체계적이고 전문적인 접근, 공감적이고 따뜻한 상담, 실용적이고 구체적인 해결책 제시 등"
                />
                <p className="mt-1 text-xs text-gray-500">
                  고객에게 전달하고 싶은 상담 스타일이나 접근 방식을 설명해주세요.
                </p>
              </div>







              {/* 타겟 고객층 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주요 대상 고객층
                </label>
                <div className="space-y-3">
                  {profileData.targetAudience?.map((audience, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => updateTargetAudience(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="예: 성인, 청소년, 직장인, 학생, 시니어 등"
                      />
                      {profileData.targetAudience!.length > 1 && (
                        <button
                          onClick={() => removeTargetAudience(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTargetAudience}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  대상 고객층 추가
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  주로 상담하고 싶은 고객층을 추가하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 모달 */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">필수항목 입력 필요</h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">다음 필수항목을 입력해주세요:</p>
            {Array.isArray(modalMessage) ? (
              <ul className="space-y-1 text-left">
                {modalMessage.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">{modalMessage}</p>
            )}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
});

ExpertProfile.displayName = 'ExpertProfile';

export default ExpertProfile;

