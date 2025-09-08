import { ChatSession, ChatMessage } from '../types';

export class AIChatService {
  private static instance: AIChatService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/aichat-sessions';
  }

  public static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  // 채팅 세션 목록 조회
  async getChatSessions(params?: {
    userId?: string;
    category?: string;
    status?: string;
    limit?: number;
    search?: string;
  }): Promise<{ success: boolean; data: ChatSession[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.userId) searchParams.append('userId', params.userId);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '채팅 세션을 가져오는 데 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('채팅 세션 조회 오류:', error);
      throw error;
    }
  }

  // 특정 채팅 세션 조회
  async getChatSession(id: string): Promise<{ success: boolean; data: ChatSession }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '채팅 세션을 가져오는 데 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('채팅 세션 조회 오류:', error);
      throw error;
    }
  }

  // 새로운 채팅 세션 생성
  async createChatSession(data: {
    title: string;
    userId: string;
    expertId?: string;
    category: string;
  }): Promise<{ success: boolean; data: ChatSession; message: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '채팅 세션 생성에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('채팅 세션 생성 오류:', error);
      throw error;
    }
  }

  // 채팅 세션 정보 수정
  async updateChatSession(id: string, data: Partial<ChatSession>): Promise<{ success: boolean; data: ChatSession; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '채팅 세션 수정에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('채팅 세션 수정 오류:', error);
      throw error;
    }
  }

  // 채팅 세션 삭제
  async deleteChatSession(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '채팅 세션 삭제에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('채팅 세션 삭제 오류:', error);
      throw error;
    }
  }

  // 채팅 메시지 목록 조회
  async getChatMessages(sessionId: string, params?: {
    limit?: number;
    before?: string;
  }): Promise<{ success: boolean; data: ChatMessage[]; total: number; hasMore: boolean }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.before) searchParams.append('before', params.before);

      const response = await fetch(`${this.baseUrl}/${sessionId}/messages?${searchParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '메시지를 가져오는 데 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('메시지 조회 오류:', error);
      throw error;
    }
  }

  // 새로운 메시지 전송
  async sendMessage(sessionId: string, data: {
    content: string;
    type: "user" | "ai" | "expert" | "system";
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
  }): Promise<{ success: boolean; data: ChatMessage; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '메시지 전송에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      throw error;
    }
  }

  // 채팅 세션 상태 업데이트 (완료, 진행 중 등)
  async updateSessionStatus(sessionId: string, status: ChatSession['status']): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { status });
    } catch (error) {
      console.error('세션 상태 업데이트 오류:', error);
      throw error;
    }
  }

  // 채팅 세션 제목 업데이트
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { title });
    } catch (error) {
      console.error('세션 제목 업데이트 오류:', error);
      throw error;
    }
  }

  // 마지막 메시지 업데이트
  async updateLastMessage(sessionId: string, lastMessage: string): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { lastMessage });
    } catch (error) {
      console.error('마지막 메시지 업데이트 오류:', error);
      throw error;
    }
  }

  // 메시지 수 업데이트
  async updateMessageCount(sessionId: string, messageCount: number): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { messageCount });
    } catch (error) {
      console.error('메시지 수 업데이트 오류:', error);
      throw error;
    }
  }

  // 크레딧 사용량 업데이트
  async updateCreditsUsed(sessionId: string, creditsUsed: number): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { creditsUsed });
    } catch (error) {
      console.error('크레딧 사용량 업데이트 오류:', error);
      throw error;
    }
  }

  // 세션 지속 시간 업데이트
  async updateSessionDuration(sessionId: string, duration: number): Promise<void> {
    try {
      await this.updateChatSession(sessionId, { duration });
    } catch (error) {
      console.error('세션 지속 시간 업데이트 오류:', error);
      throw error;
    }
  }
}
