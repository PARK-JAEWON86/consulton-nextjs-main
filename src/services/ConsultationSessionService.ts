import { 
  Consultation, 
  ConsultationSession, 
  ConsultationWithSessions,
  CreateConsultationRequest,
  CreateConsultationSessionRequest,
  UpdateConsultationSessionRequest,
  CreateConsultationResponse,
  CreateConsultationSessionResponse
} from "@/types";

/**
 * 상담 세션 서비스 클래스
 * 다중 세션을 지원하는 상담 관리
 */
export class ConsultationSessionService {
  private static baseUrl = "/api/consultations-multi";
  private static sessionUrl = "/api/consultation-sessions";

  /**
   * 상담 목록 조회 (세션 정보 포함)
   * @param params 조회 조건
   * @returns 상담 목록과 세션 정보
   */
  static async getConsultations(params: {
    expertId?: number;
    userId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data?: {
      consultations: ConsultationWithSessions[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.expertId) searchParams.append('expertId', params.expertId.toString());
      if (params.userId) searchParams.append('userId', params.userId.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 목록 조회에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 목록 조회 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 특정 상담 조회 (세션 정보 포함)
   * @param consultationId 상담 ID
   * @returns 상담 정보와 세션 목록
   */
  static async getConsultation(consultationId: number): Promise<{
    success: boolean;
    data?: { consultation: ConsultationWithSessions };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${consultationId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 조회에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 조회 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 새로운 상담 생성
   * @param consultationData 상담 생성 데이터
   * @returns 생성된 상담 정보
   */
  static async createConsultation(consultationData: CreateConsultationRequest): Promise<CreateConsultationResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consultationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 생성에 실패했습니다.");
      }

      return result.data;
    } catch (error) {
      console.error("상담 생성 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 정보 업데이트
   * @param consultationId 상담 ID
   * @param updateData 업데이트 데이터
   * @returns 업데이트된 상담 정보
   */
  static async updateConsultation(
    consultationId: number, 
    updateData: Partial<Consultation>
  ): Promise<{
    success: boolean;
    data?: { consultation: ConsultationWithSessions };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${consultationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 업데이트에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 업데이트 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담 삭제
   * @param consultationId 상담 ID
   * @returns 삭제 결과
   */
  static async deleteConsultation(consultationId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${consultationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 삭제에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 삭제 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담 세션 목록 조회
   * @param params 조회 조건
   * @returns 상담 세션 목록
   */
  static async getSessions(params: {
    consultationId?: number;
    expertId?: number;
    userId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data?: {
      sessions: ConsultationSession[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.consultationId) searchParams.append('consultationId', params.consultationId.toString());
      if (params.expertId) searchParams.append('expertId', params.expertId.toString());
      if (params.userId) searchParams.append('userId', params.userId.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.sessionUrl}?${searchParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 조회에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 조회 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 특정 상담 세션 조회
   * @param sessionId 세션 ID
   * @returns 상담 세션 정보
   */
  static async getSession(sessionId: number): Promise<{
    success: boolean;
    data?: { session: ConsultationSession };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.sessionUrl}/${sessionId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 조회에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 조회 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 새로운 상담 세션 생성
   * @param sessionData 세션 생성 데이터
   * @returns 생성된 세션 정보
   */
  static async createSession(sessionData: CreateConsultationSessionRequest): Promise<CreateConsultationSessionResponse> {
    try {
      const response = await fetch(this.sessionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 생성에 실패했습니다.");
      }

      return result.data;
    } catch (error) {
      console.error("상담 세션 생성 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 세션 업데이트
   * @param sessionId 세션 ID
   * @param updateData 업데이트 데이터
   * @returns 업데이트된 세션 정보
   */
  static async updateSession(
    sessionId: number, 
    updateData: UpdateConsultationSessionRequest
  ): Promise<{
    success: boolean;
    data?: { session: ConsultationSession };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.sessionUrl}/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 업데이트에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 업데이트 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담 세션 시작
   * @param sessionId 세션 ID
   * @returns 시작된 세션 정보
   */
  static async startSession(sessionId: number): Promise<{
    success: boolean;
    data?: { session: ConsultationSession };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.sessionUrl}/${sessionId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 시작에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 시작 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담 세션 종료
   * @param sessionId 세션 ID
   * @param endData 종료 데이터
   * @returns 종료된 세션 정보
   */
  static async endSession(
    sessionId: number, 
    endData: {
      notes?: string;
      transcript?: string;
      recordingUrl?: string;
      attachments?: string;
    }
  ): Promise<{
    success: boolean;
    data?: { session: ConsultationSession; duration: number };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.sessionUrl}/${sessionId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(endData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 종료에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 종료 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담 세션 삭제
   * @param sessionId 세션 ID
   * @returns 삭제 결과
   */
  static async deleteSession(sessionId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.sessionUrl}/${sessionId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상담 세션 삭제에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("상담 세션 삭제 중 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      };
    }
  }

  /**
   * 상담의 다음 세션 번호 조회
   * @param consultationId 상담 ID
   * @returns 다음 세션 번호
   */
  static async getNextSessionNumber(consultationId: number): Promise<number> {
    try {
      const sessionsResult = await this.getSessions({ consultationId });
      
      if (!sessionsResult.success || !sessionsResult.data) {
        return 1; // 첫 번째 세션
      }

      const maxSessionNumber = Math.max(
        ...sessionsResult.data.sessions.map(session => session.sessionNumber),
        0
      );

      return maxSessionNumber + 1;
    } catch (error) {
      console.error("다음 세션 번호 조회 중 오류:", error);
      return 1;
    }
  }
}
