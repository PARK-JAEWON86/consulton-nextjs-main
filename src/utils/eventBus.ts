// 컴포넌트 간 통신을 위한 이벤트 버스 시스템

type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  // 이벤트 구독
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const callbacks = this.events.get(event)!;
    callbacks.push(callback);

    // 구독 해제 함수 반환
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // 이벤트 발행
  publish(event: string, data?: any): void {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)!;
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 콜백 실행 중 오류 발생: ${event}`, error);
        }
      });
    }
  }

  // 이벤트 구독 해제
  unsubscribe(event: string, callback: EventCallback): void {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 특정 이벤트의 모든 구독자 제거
  clearEvent(event: string): void {
    this.events.delete(event);
  }

  // 모든 이벤트 제거
  clearAll(): void {
    this.events.clear();
  }
}

// 전역 이벤트 버스 인스턴스
export const eventBus = new EventBus();

// 자주 사용되는 이벤트 타입들
export const CREDIT_EVENTS = {
  CREDITS_UPDATED: 'credits:updated',
  AI_USAGE_UPDATED: 'ai-usage:updated',
  CREDITS_PURCHASED: 'credits:purchased',
  CREDITS_DEDUCTED: 'credits:deducted'
} as const;

export const USER_EVENTS = {
  USER_LOGGED_IN: 'user:logged-in',
  USER_LOGGED_OUT: 'user:logged-out',
  USER_PROFILE_UPDATED: 'user:profile-updated'
} as const;

export const CHAT_EVENTS = {
  CHAT_STARTED: 'chat:started',
  CHAT_MESSAGE_SENT: 'chat:message-sent',
  CHAT_HISTORY_UPDATED: 'chat:history-updated'
} as const;

// 타입 안전성을 위한 이벤트 타입
export type CreditEventType = typeof CREDIT_EVENTS[keyof typeof CREDIT_EVENTS];
export type UserEventType = typeof USER_EVENTS[keyof typeof USER_EVENTS];
export type ChatEventType = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS];

export type AllEventTypes = CreditEventType | UserEventType | ChatEventType;
