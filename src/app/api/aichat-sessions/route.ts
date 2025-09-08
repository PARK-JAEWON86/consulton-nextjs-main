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

// GET: 채팅 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    let filteredSessions = storage.getAll();

    // 사용자 ID로 필터링
    if (userId) {
      filteredSessions = filteredSessions.filter(session => session.userId === userId);
    }

    // 카테고리로 필터링
    if (category) {
      filteredSessions = filteredSessions.filter(session => session.category === category);
    }

    // 상태로 필터링
    if (status) {
      filteredSessions = filteredSessions.filter(session => session.status === status);
    }

    // 검색어로 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSessions = filteredSessions.filter(session =>
        session.title.toLowerCase().includes(searchLower) ||
        (session.expert?.name && session.expert.name.toLowerCase().includes(searchLower)) ||
        (session.lastMessage && session.lastMessage.toLowerCase().includes(searchLower))
      );
    }

    // 최신순으로 정렬
    filteredSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 제한 적용
    if (limit) {
      filteredSessions = filteredSessions.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      success: true,
      data: filteredSessions,
      total: filteredSessions.length,
    });
  } catch (error) {
    console.error('채팅 세션 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '채팅 세션을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새로운 채팅 세션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, userId, expertId, category } = body;

    if (!title || !userId || !category) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 새로운 채팅 세션 생성
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title,
      userId,
      expertId: expertId || null,
      expert: expertId ? {
        name: "AI 상담 어시스턴트",
        title: "AI 상담사",
        avatar: null,
      } : null,
      lastMessage: "",
      timestamp: new Date().toISOString(),
      duration: 0,
      status: "in_progress",
      messageCount: 0,
      creditsUsed: 0,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 저장소에 저장
    storage.set(newSession.id, newSession);

    return NextResponse.json({
      success: true,
      data: newSession,
      message: '새로운 채팅 세션이 생성되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('채팅 세션 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '채팅 세션을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 채팅 세션 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

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
      ...updates,
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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
