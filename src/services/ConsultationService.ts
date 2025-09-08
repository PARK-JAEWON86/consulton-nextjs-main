import { ConsultationItem, ConsultationStatus } from "@/app/api/consultations/route";

/**
 * 상담 서비스 클래스
 * 기존 consultations API를 사용하여 상담 관리
 */
export class ConsultationService {
  private static baseUrl = "/api/consultations";

  /**
   * 상담 예약 및 상담번호 생성
   * @param consultationData 상담 예약 정보
   * @returns 생성된 상담 정보와 상담번호
   */
  static async scheduleConsultation(consultationData: {
    date: string;
    customer: string;
    topic: string;
    amount: number;
    method?: "chat" | "video" | "voice" | "call";
    duration?: number;
    summary?: string;
  }): Promise<{
    success: boolean;
    consultation: ConsultationItem;
    consultationNumber: string;
    message: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addScheduled",
          data: consultationData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상담 예약에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 예약 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 시작
   * @param consultationId 상담 ID
   * @returns 상담 시작 결과
   */
  static async startConsultation(consultationId: number): Promise<{
    success: boolean;
    consultation: ConsultationItem;
    consultationNumber: string;
    message: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "startConsultation",
          data: { consultationId },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상담 시작에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 시작 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 완료
   * @returns 상담 완료 결과
   */
  static async completeCurrentConsultation(): Promise<{
    success: boolean;
    completedConsultation: ConsultationItem;
    message: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "completeCurrent",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상담 완료에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 완료 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 내역 조회
   * @param filters 필터링 옵션
   * @returns 상담 내역 목록
   */
  static async getConsultations(filters?: {
    expertId?: string;
    status?: ConsultationStatus;
    consultationNumber?: string;
  }): Promise<{
    items: ConsultationItem[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.expertId) queryParams.append("expertId", filters.expertId);
      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.consultationNumber) queryParams.append("consultationNumber", filters.consultationNumber);

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("상담 내역 조회에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 내역 조회 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담번호로 상담 검색
   * @param consultationNumber 상담번호
   * @returns 상담 정보
   */
  static async getConsultationByNumber(
    consultationNumber: string
  ): Promise<ConsultationItem | null> {
    try {
      const result = await this.getConsultations({ consultationNumber });
      return result.items.find(
        (item) => item.consultationNumber === consultationNumber
      ) || null;
    } catch (error) {
      console.error("상담번호로 상담 검색 중 오류:", error);
      return null;
    }
  }

  /**
   * 상담 정보 업데이트
   * @param consultationId 상담 ID
   * @param updates 업데이트할 정보
   * @returns 업데이트된 상담 정보
   */
  static async updateConsultation(
    consultationId: number,
    updates: Partial<ConsultationItem>
  ): Promise<{
    success: boolean;
    updatedConsultation: ConsultationItem;
    message: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "updateById",
          data: {
            id: consultationId,
            payload: updates,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상담 정보 업데이트에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 정보 업데이트 중 오류:", error);
      throw error;
    }
  }

  /**
   * 상담 삭제
   * @param consultationId 상담 ID
   * @returns 삭제 결과
   */
  static async deleteConsultation(consultationId: number): Promise<{
    success: boolean;
    deletedId: number;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${consultationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상담 삭제에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("상담 삭제 중 오류:", error);
      throw error;
    }
  }

  /**
   * 전문가별 상담 내역 로드
   * @param expertId 전문가 ID
   * @returns 전문가별 상담 내역
   */
  static async loadExpertConsultations(expertId: string): Promise<{
    success: boolean;
    items: ConsultationItem[];
    message: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "loadExpertConsultations",
          data: { expertId },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "전문가별 상담 내역 로드에 실패했습니다.");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("전문가별 상담 내역 로드 중 오류:", error);
      throw error;
    }
  }
}
