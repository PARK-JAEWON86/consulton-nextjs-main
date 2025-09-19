export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "expert" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

// 리뷰 타입
export interface Review {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  expertId: string | number;
  rating: number; // 1-5 별점
  comment: string;
  consultationType: ConsultationType;
  consultationTopic: string;
  createdAt: string;
  updatedAt?: string;
  isVerified: boolean; // 실제 상담을 받은 사용자인지 검증
  expertReply?: {
    message: string;
    createdAt: string;
  };
}

// 상담 방식 타입
export type ConsultationType = "video" | "chat" | "voice";

// 요일 타입
export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// 주간 예약 가능 시간 타입
export type WeeklyAvailability = Record<WeekDay, string[]>;

// 가용성 설정 타입
export type Availability = Record<WeekDay, { available: boolean; hours: string }>;

// 상담 요약 타입 (DB 구조에 맞게 수정)
export interface ConsultationSummary {
  id: number;
  consultationId: number; // 상담 ID (외래키)
  consultationNumber?: string; // 상담 번호
  summaryTitle: string; // 요약 제목
  summaryContent: string; // 요약 내용
  title?: string; // 제목
  date?: Date; // 상담 날짜
  tags?: string[]; // 태그
  keyPoints: string; // 핵심 포인트 (JSON 배열)
  actionItems: string; // 액션 아이템 (JSON 배열)
  recommendations: string; // 추천사항 (JSON 배열)
  followUpPlan: string; // 후속 계획
  todoStatus: string; // 할일 상태 (JSON 객체)
  attachments: string; // 첨부 파일 (JSON 배열)
  isPublic: boolean; // 공개 여부
  createdAt: Date;
  updatedAt: Date;
}

// 상담 요약과 상담 정보를 함께 포함하는 타입
export interface ConsultationSummaryWithDetails extends ConsultationSummary {
  consultation?: {
    id: number;
    title: string;
    description: string;
    consultationType: string;
    status: string;
    scheduledTime: Date;
    duration: number;
    price: number;
    user?: {
      id: number;
      name: string;
      email: string;
      avatar?: string;
    };
    expert?: {
      id: number;
      user?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
      };
      profile?: {
        specialty: string;
        level: number;
        avgRating: number;
      };
    };
  };
}

// 기존 UI용 상담 요약 타입 (하위 호환성 유지)
export interface ConsultationSummaryUI {
  id: string;
  consultationNumber?: string;
  title: string;
  date: Date;
  duration: number;
  expert: {
    name: string;
    title: string;
    avatar: string | null;
  };
  client: {
    name: string;
    company?: string;
  };
  status: 'ai_generated' | 'expert_reviewed' | 'user_confirmed' | 'processing' | 'completed' | 'failed';
  summary: string;
  tags: string[];
  creditsUsed: number;
  rating?: number;
  aiSummary?: {
    keyPoints: string[];
    recommendations: string[];
    actionItems: string[];
    generatedAt: Date;
    aiModel: string;
  };
  expertReview?: {
    reviewedAt: Date;
    expertNotes: string;
    additionalRecommendations: string[];
    suggestedNextSession?: {
      date: Date;
      duration: number;
      topic: string;
    };
    priority: 'high' | 'medium' | 'low';
  };
  userActions?: {
    confirmedAt: Date;
    userNotes: string;
    todoList: TodoItem[];
    nextSessionBooked?: {
      sessionId: string;
      date: Date;
      duration: number;
      status: 'pending' | 'confirmed' | 'cancelled';
    };
    isCompleted: boolean;
  };
}

// AI 사용량 타입 (DB 구조에 맞게 정의)
export interface AiUsage {
  id: number;
  userId: number; // 사용자 ID (외래키)
  usedTokens: number; // 사용된 토큰 수
  purchasedTokens: number; // 구매한 토큰 수
  remainingPercent: number; // 남은 토큰 퍼센트
  monthlyResetDate: Date; // 월간 리셋 날짜
  totalTurns: number; // 총 턴 수
  totalTokens: number; // 총 사용된 토큰 수
  averageTokensPerTurn: number; // 턴당 평균 토큰 수
  createdAt: Date;
  updatedAt: Date;
}

// AI 사용량 상태 타입 (API용)
export interface AIUsageState {
  usedTokens: number;
  purchasedTokens: number;
  remainingPercent: number;
  monthlyResetDate: string; // ISO string
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
}

// AI 사용량 요약 정보 타입
export interface AIUsageSummary {
  totalTokens: number; // 총 토큰 수 (무료 + 구매)
  freeTokens: number; // 무료 토큰 수
  remainingFreeTokens: number; // 남은 무료 토큰 수
  remainingPurchasedTokens: number; // 남은 구매 토큰 수
  totalEstimatedTurns: number; // 총 예상 턴 수
  nextResetDate: string; // 다음 리셋 날짜
  creditToTokens: number; // 크레딧당 토큰 수
  creditToKRW: number; // 크레딧당 원화
  tokensToKRW: number; // 토큰당 원화
  creditDiscount: number; // 크레딧 할인율
}

// Todo 아이템 타입
export interface TodoItem {
  id: string;
  task: string;
  description?: string;
  assignee: 'client' | 'expert' | 'both';
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

// 다음 상담 세션 타입
export interface NextSession {
  id: string;
  consultationId: string;
  expertId: string;
  proposedDate: Date;
  duration: number;
  topic: string;
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

// 포트폴리오 파일 타입
export interface PortfolioFile {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
}

// 포트폴리오 아이템 타입
export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  type: string;
  url?: string;
  imageUrl?: string;
  createdAt?: Date;
}

// 소셜 증명 타입
export interface SocialProof {
  linkedIn?: string;
  website?: string;
  publications: string[];
}

// 가격 티어 타입
export interface PricingTier {
  duration: number; // 분 단위
  price: number; // 크레딧 단위
  description: string;
}

// 상담 관련 세부 정보 타입
export interface ConsultationDetails {
  consultationStyle?: string; // 상담 스타일
  successStories?: number; // 성공 사례 수
  nextAvailableSlot?: string; // 다음 예약 가능 시간
  profileViews?: number; // 프로필 조회수
  lastActiveAt?: Date; // 마지막 활동 시간
  joinedAt?: Date; // 가입일
  reschedulePolicy?: string; // 일정 변경 정책
  pricingTiers?: PricingTier[]; // 가격 티어
  targetAudience?: string[]; // 타겟 고객층
}

// 통합된 전문가 프로필 타입
export interface ExpertProfile {
  id: number;
  userId?: string;
  name: string;
  specialty: string;
  experience: number;
  description: string;
  education: string[];
  certifications: string[];
  specialties: string[];
  specialtyAreas: string[];
  consultationTypes: ConsultationType[];
  languages: string[];
  hourlyRate: number;
  pricePerMinute: number;
  totalSessions: number;
  avgRating: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  repeatClients: number;
  responseTime: string;
  averageSessionDuration: number;
  cancellationPolicy: string;
  availability: Availability;
  weeklyAvailability: WeeklyAvailability;
  holidayPolicy?: string; // 공휴일 휴무 정책 (예: "공휴일 휴무", "공휴일 정상 운영" 등)
  contactInfo: {
    phone: string;
    email: string;
    location: string;
    website: string;
  };
  location: string;
  timeZone: string;
  profileImage: string | null;
  portfolioFiles: PortfolioFile[];
  portfolioItems?: PortfolioItem[];
  socialProof?: SocialProof;
  // 상담 관련 세부 정보 필드들 (ConsultationDetails에서 상속됨)
  tags: string[];
  targetAudience: string[];
  isOnline: boolean;
  isProfileComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // 기존 ExpertItem과의 호환성을 위한 추가 필드들
  price?: string; // 크레딧 표시용
  image?: string | null; // profileImage와 동일
  consultationStyle?: string;
  successStories?: number;
  nextAvailableSlot?: string;
  profileViews?: number;
  lastActiveAt?: Date;
  joinedAt?: Date;
  // socialProof는 위에서 이미 정의됨
  pricingTiers?: Array<{
    duration: number;
    price: number;
    description: string;
  }>;
  reschedulePolicy?: string;
  
  // 랭킹 및 레벨 관련 필드들
  rankingScore?: number;
  ranking?: number;
  level?: number;
  tierInfo?: {
    name: string;
    levelRange: { min: number; max: number };
    scoreRange: { min: number; max: number };
    creditsPerMinute: number;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  };
}

// 기존 Expert 인터페이스는 호환성을 위해 유지
export interface Expert {
  id: string;
  userId: string;
  name: string;
  title: string;
  description: string;
  expertise: string[];
  experience: number;
  rating: number;
  hourlyRate: number;
  avatar?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 기존 Consultation 인터페이스는 아래의 새로운 다중 세션 지원 버전으로 대체됨

// AI 채팅 메시지 타입 (AI 상담 어시스턴트용)
export interface AIChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
}

// 전문가와의 채팅 메시지 타입 (확장된 기능용)
export interface ExtendedChatMessage {
  id: string;
  type: "user" | "expert" | "ai" | "system";
  content: string;
  timestamp: Date;
  expertInfo?: {
    name: string;
    avatar?: string;
    title?: string;
  };
}

// 채팅 세션 타입
export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  expertId?: string | null;
  expert?: {
    name: string;
    title: string;
    avatar: string | null;
  };
  lastMessage: string;
  timestamp: Date;
  duration: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  messageCount: number;
  creditsUsed: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  sessionId: string;
  type: "user" | "ai" | "expert" | "system";
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  isPopular?: boolean;
}

// 통계 관련 타입
export interface PlatformStats {
  totalConsultations: number;
  averageMatchingTimeMinutes: number;
  totalExperts: number;
  totalUsers: number;
  lastUpdated: Date;
}

export interface StatsUpdate {
  type: 'consultation_completed' | 'expert_registered' | 'user_registered' | 'matching_time_recorded';
  data?: {
    matchingTimeMinutes?: number;
  };
}

export interface MatchingRecord {
  id: string;
  userId: string;
  expertId: string;
  matchingTimeMinutes: number;
  createdAt: Date;
}

// 상담 정보 타입 (상위 레벨)
export interface Consultation {
  id: number;
  userId: number; // 클라이언트 ID
  expertId: number; // 전문가 ID
  categoryId: number; // 카테고리 ID
  title: string; // 상담 제목
  description: string; // 상담 설명
  consultationType: 'video' | 'chat' | 'voice'; // 상담 유형
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; // 상담 상태
  scheduledTime: Date; // 예정된 상담 시간
  duration: number; // 상담 시간 (분)
  price: number; // 상담 가격 (원)
  expertLevel: number; // 전문가 레벨
  topic: string; // 상담 주제
  notes: string; // 상담 노트
  startTime?: Date; // 실제 시작 시간
  endTime?: Date; // 실제 종료 시간
  rating?: number; // 사용자 평점 (0-5)
  review?: string; // 사용자 리뷰
  createdAt: Date;
  updatedAt: Date;
}

// 상담 세션 타입 (개별 세션)
export interface ConsultationSession {
  id: number;
  consultationId: number; // 상담 ID (외래키)
  sessionNumber: number; // 세션 번호 (1, 2, 3...)
  startTime: Date; // 세션 시작 시간
  endTime?: Date; // 세션 종료 시간
  duration: number; // 실제 세션 시간 (분)
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; // 세션 상태
  notes: string; // 세션 노트
  transcript: string; // 대화 기록 (채팅/음성의 경우)
  recordingUrl?: string; // 녹화/녹음 파일 URL
  attachments: string; // 첨부 파일 (JSON 배열)
  createdAt: Date;
  updatedAt: Date;
}

// 상담 세션과 상담 정보를 함께 포함하는 타입
export interface ConsultationWithSessions extends Consultation {
  sessions: ConsultationSession[];
  expert?: {
    id: number;
    name: string;
    avatar: string;
    specialty: string;
    level: number;
  };
  client?: {
    id: number;
    name: string;
    avatar: string;
  };
  category?: {
    id: number;
    name: string;
    description: string;
  };
}

// 상담 생성 요청 타입
export interface CreateConsultationRequest {
  expertId: number;
  userId: number;
  categoryId: number;
  title: string;
  description: string;
  consultationType: 'video' | 'chat' | 'voice';
  scheduledTime: Date;
  duration: number;
  price: number;
  topic: string;
}

// 상담 세션 생성 요청 타입
export interface CreateConsultationSessionRequest {
  consultationId: number;
  sessionNumber: number;
  startTime: Date;
  notes?: string;
}

// 상담 세션 업데이트 요청 타입
export interface UpdateConsultationSessionRequest {
  sessionId: number;
  endTime?: Date;
  duration?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  transcript?: string;
  recordingUrl?: string;
  attachments?: string;
}

// 상담 생성 응답 타입
export interface CreateConsultationResponse {
  consultation: Consultation;
  success: boolean;
  message?: string;
}

// 상담 세션 생성 응답 타입
export interface CreateConsultationSessionResponse {
  session: ConsultationSession;
  success: boolean;
  message?: string;
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string; // 알림을 받을 사용자 ID (전문가 ID)
  type: 'consultation_request' | 'consultation_accepted' | 'consultation_rejected' | 'consultation_reminder' | 'review_received' | 'system';
  title: string;
  message: string;
  data?: {
    consultationId?: string;
    expertId?: string;
    clientId?: string;
    clientName?: string;
    consultationType?: ConsultationType;
    scheduledDate?: Date;
    [key: string]: any;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date; // 알림 만료 시간 (선택사항)
}

// 상담 신청 타입
export interface ConsultationRequest {
  id: string;
  clientId: string;
  expertId: string;
  clientName: string;
  clientEmail?: string;
  consultationType: ConsultationType;
  preferredDate?: Date;
  message?: string;
  notes?: string; // 추가 노트
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'scheduled' | 'cancelled' | 'completed';
  budget?: number; // 예산 (가격)
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // 신청 만료 시간 (예: 24시간 후)
}

// 정산 시스템 타입 re-export
export * from './settlement';
