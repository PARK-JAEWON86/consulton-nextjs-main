import { NextRequest, NextResponse } from 'next/server';

// 채팅 세션 타입 정의
interface ChatSession {
  id: string;
  title: string;
  userId: string;
  expertId: string | null;
  expert: {
    name: string;
    title: string;
    avatar: string | null;
  } | null;
  lastMessage: string;
  timestamp: string;
  duration: number;
  status: "in_progress" | "completed" | "pending" | "cancelled";
  messageCount: number;
  creditsUsed: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// localStorage를 시뮬레이션하는 메모리 기반 저장소 (실제 프로덕션에서는 데이터베이스 사용)
class PersistentStorage {
  private storage: Map<string, ChatSession> = new Map();
  private readonly STORAGE_KEY = 'consulton-aichat-sessions';

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

  get(key: string): ChatSession | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: ChatSession): void {
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

  getAll(): ChatSession[] {
    return Array.from(this.storage.values());
  }

  clear(): void {
    this.storage.clear();
    this.saveToStorage();
  }
}

// 지속성 있는 저장소 인스턴스
const storage = new PersistentStorage();

// GET: 특정 채팅 세션 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const session = storage.get(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '채팅 세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('채팅 세션 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '채팅 세션을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 채팅 세션 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const existingSession = storage.get(id);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: '채팅 세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 업데이트
    const updatedSession: ChatSession = {
      ...existingSession,
      ...body,
      updatedAt: new Date().toISOString()
    };

    storage.set(id, updatedSession);

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: '채팅 세션이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('채팅 세션 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '채팅 세션을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 채팅 세션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const existingSession = storage.get(id);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: '채팅 세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 삭제
    storage.delete(id);

    return NextResponse.json({
      success: true,
      message: '채팅 세션이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('채팅 세션 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '채팅 세션을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
