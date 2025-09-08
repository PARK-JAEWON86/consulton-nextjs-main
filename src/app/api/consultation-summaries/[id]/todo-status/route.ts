import { NextRequest, NextResponse } from "next/server";

// ToDo 아이템 상태 타입
interface TodoItemStatus {
  id: string;
  consultationSummaryId: string;
  userId: string;
  itemIndex: number;
  itemType: 'expert_recommendation' | 'ai_action_item';
  content: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 더미 데이터 저장소 (실제로는 데이터베이스 사용)
const todoStatusStorage: Map<string, TodoItemStatus> = new Map();

// ToDo 아이템 상태 저장/업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, itemIndex, itemType, content, isCompleted } = body;

    // 필수 필드 검증
    if (!userId || itemIndex === undefined || !itemType || !content) {
      return NextResponse.json(
        { 
          success: false, 
          message: '필수 필드가 누락되었습니다.' 
        },
        { status: 400 }
      );
    }

    // 상담 요약 ID 검증
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: '상담 요약 ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    const todoId = `${id}_${userId}_${itemType}_${itemIndex}`;
    const now = new Date();

    // 기존 상태가 있는지 확인
    const existingStatus = todoStatusStorage.get(todoId);

    if (existingStatus) {
      // 기존 상태 업데이트
      const updatedStatus: TodoItemStatus = {
        ...existingStatus,
        isCompleted,
        completedAt: isCompleted ? now : undefined,
        updatedAt: now,
      };
      todoStatusStorage.set(todoId, updatedStatus);

      return NextResponse.json({
        success: true,
        message: 'ToDo 상태가 업데이트되었습니다.',
        data: updatedStatus,
      });
    } else {
      // 새 상태 생성
      const newStatus: TodoItemStatus = {
        id: todoId,
        consultationSummaryId: id,
        userId,
        itemIndex,
        itemType,
        content,
        isCompleted,
        completedAt: isCompleted ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
      todoStatusStorage.set(todoId, newStatus);

      return NextResponse.json({
        success: true,
        message: 'ToDo 상태가 저장되었습니다.',
        data: newStatus,
      }, { status: 201 });
    }

  } catch (error) {
    console.error('ToDo 상태 저장 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'ToDo 상태 저장 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

// ToDo 아이템 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: '사용자 ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    // 해당 상담 요약의 모든 ToDo 상태 조회
    const todoStatuses: TodoItemStatus[] = [];
    
    for (const [todoId, status] of todoStatusStorage.entries()) {
      if (status.consultationSummaryId === id && status.userId === userId) {
        todoStatuses.push(status);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ToDo 상태를 성공적으로 조회했습니다.',
      data: todoStatuses,
    });

  } catch (error) {
    console.error('ToDo 상태 조회 중 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'ToDo 상태 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
