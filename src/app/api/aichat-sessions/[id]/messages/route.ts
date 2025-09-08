import { NextRequest, NextResponse } from 'next/server';

// 메시지 타입 정의
interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  type: "user" | "ai" | "expert" | "system";
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  timestamp: string;
  attachments: any[];
}

// localStorage를 시뮬레이션하는 메모리 기반 저장소 (실제 프로덕션에서는 데이터베이스 사용)
class PersistentStorage {
  private storage: Map<string, ChatMessage[]> = new Map();
  private readonly STORAGE_KEY = 'consulton-aichat-messages';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // 실제 브라우저 환경에서는 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.storage = new Map(Object.entries(data));
        }
      }
    } catch (error) {
      console.error('저장소 로드 실패:', error);
    }
  }

  private saveToStorage() {
    try {
      // 실제 브라우저 환경에서는 localStorage에 저장
      if (typeof window !== 'undefined') {
        const data = Object.fromEntries(this.storage);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('저장소 저장 실패:', error);
    }
  }

  get(key: string): ChatMessage[] {
    return this.storage.get(key) || [];
  }

  set(key: string, value: ChatMessage[]): void {
    this.storage.set(key, value);
    this.saveToStorage();
  }

  delete(key: string): void {
    this.storage.delete(key);
    this.saveToStorage();
  }

  has(key: string): boolean {
    return this.storage.has(key);
  }

  getAll(): ChatMessage[][] {
    return Array.from(this.storage.values());
  }

  clear(): void {
    this.storage.clear();
    this.saveToStorage();
  }
}

// 지속성 있는 저장소 인스턴스
const storage = new PersistentStorage();

// GET: 채팅 세션의 메시지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const before = searchParams.get('before');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 해당 세션의 메시지들을 가져옴
    const sessionMessages = storage.get(id);
    
    let filteredMessages = [...sessionMessages];

    // before 파라미터가 있으면 해당 메시지 이전의 메시지만 가져옴
    if (before) {
      const beforeIndex = filteredMessages.findIndex(msg => msg.id === before);
      if (beforeIndex !== -1) {
        filteredMessages = filteredMessages.slice(0, beforeIndex);
      }
    }

    // 최신순으로 정렬
    filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 제한 적용
    if (limit) {
      filteredMessages = filteredMessages.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      success: true,
      data: filteredMessages,
      total: sessionMessages.length,
      hasMore: sessionMessages.length > filteredMessages.length,
    });
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새로운 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, type, senderId, senderName, senderAvatar } = body;
    
    if (!id || !content || !type || !senderId) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 새로운 메시지 생성
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId: id,
      content,
      type,
      senderId,
      senderName: senderName || '사용자',
      senderAvatar: senderAvatar || null,
      timestamp: new Date().toISOString(),
      attachments: [],
    };

    // 해당 세션의 메시지 목록에 추가
    const existingMessages = storage.get(id);
    const updatedMessages = [...existingMessages, newMessage];
    storage.set(id, updatedMessages);

    return NextResponse.json({
      success: true,
      data: newMessage,
      message: '메시지가 전송되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지를 전송하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 메시지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (!id || !messageId) {
      return NextResponse.json(
        { success: false, error: '세션 ID와 메시지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 해당 세션의 메시지 목록에서 메시지 삭제
    const existingMessages = storage.get(id);
    const updatedMessages = existingMessages.filter((msg: ChatMessage) => msg.id !== messageId);
    
    if (updatedMessages.length === existingMessages.length) {
      return NextResponse.json(
        { success: false, error: '삭제할 메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    storage.set(id, updatedMessages);

    return NextResponse.json({
      success: true,
      message: '메시지가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('메시지 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
