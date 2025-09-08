import { NextRequest, NextResponse } from "next/server";
import { ConsultationSummary, Consultation, User, Expert } from "@/lib/db/models";
import { initializeDatabase } from "@/lib/db/init";
import { getAuthenticatedUser } from "@/lib/auth";
import { sortByConsultationNumber } from "@/utils/consultationNumber";
import { ConsultationSummary as ConsultationSummaryType } from "@/types";
// import { dummyConsultationSummaries } from "@/data/dummy/consultations"; // 더미 데이터 제거

// ToDo 상태 타입 확장
interface TodoStatus {
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

interface ConsultationSummaryWithTodos extends ConsultationSummary {
  todoStatuses?: TodoStatus[];
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");

    // 쿼리 조건 구성
    let whereClause: any = {};
    
    // 사용자별 필터링 (본인의 상담 요약만 조회)
    if (authUser.role === 'client') {
      whereClause['$consultation.userId$'] = authUser.id;
    } else if (authUser.role === 'expert') {
      const expert = await Expert.findOne({ where: { userId: authUser.id } });
      if (expert) {
        whereClause['$consultation.expertId$'] = expert.id;
      }
    }
    // 관리자는 모든 요약 조회 가능

    // 상담 요약 조회
    const { rows: summaries, count: totalCount } = await ConsultationSummary.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Consultation,
          as: 'consultation',
          required: true,
          include: [
            {
              model: User,
              as: 'user',
              required: false,
              attributes: ['id', 'name', 'email']
            },
            {
              model: Expert,
              as: 'expert',
              required: false,
              include: [
                {
                  model: User,
                  as: 'user',
                  required: false,
                  attributes: ['id', 'name', 'email']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    // 응답 데이터 변환
    const summaryResponses = summaries.map(summary => ({
      id: summary.id.toString(),
      consultationNumber: `CONS-${summary.consultationId.toString().padStart(6, '0')}`,
      title: summary.summaryTitle || (summary as any).consultation.title,
      date: (summary as any).consultation.scheduledTime?.toISOString() || summary.createdAt.toISOString(),
      status: (summary as any).consultation.status,
      expert: {
        id: (summary as any).consultation.expert?.id.toString() || '',
        name: (summary as any).consultation.expert?.user?.name || '알 수 없음',
        title: (summary as any).consultation.expert?.specialty || '',
        avatar: null
      },
      client: {
        id: (summary as any).consultation.user?.id.toString() || '',
        name: (summary as any).consultation.user?.name || '알 수 없음',
        avatar: null
      },
      summary: summary.summaryContent || '',
      keyPoints: summary.keyPoints ? JSON.parse(summary.keyPoints) : [],
      actionItems: summary.actionItems ? JSON.parse(summary.actionItems) : [],
      recommendations: summary.recommendations ? JSON.parse(summary.recommendations) : [],
      followUpPlan: summary.followUpPlan || '',
      tags: [], // TODO: 태그 시스템 구현
      attachments: summary.attachments ? JSON.parse(summary.attachments) : [],
      isPublic: summary.isPublic,
      duration: (summary as any).consultation.duration || 0,
      creditsUsed: (summary as any).consultation.creditsUsed || 0
    }));

    // 검색 필터링 (클라이언트 사이드)
    let filteredSummaries = summaryResponses;

    // 상태별 필터링 (클라이언트 사이드)
    if (status && status !== "all") {
      filteredSummaries = filteredSummaries.filter(
        (summary) => summary.status === status
      );
    }

    // 검색 필터링 (클라이언트 사이드)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSummaries = filteredSummaries.filter(
        (summary) =>
          summary.title.toLowerCase().includes(searchLower) ||
          summary.expert.name.toLowerCase().includes(searchLower) ||
          summary.client.name.toLowerCase().includes(searchLower) ||
          summary.consultationNumber?.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션 (클라이언트 사이드)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSummaries = filteredSummaries.slice(startIndex, endIndex);

    // ToDo 상태는 현재 별도 구현이 필요하므로 일단 제외
    // TODO: ToDo 상태 시스템 구현

    const totalPages = Math.ceil(filteredSummaries.length / limit);

    return NextResponse.json({
      success: true,
      data: paginatedSummaries,
      pagination: {
        page,
        limit,
        totalCount: filteredSummaries.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("상담 요약 목록 조회 중 오류:", error);
    return NextResponse.json(
      { error: "상담 요약 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      consultationId,
      summaryTitle,
      summaryContent,
      keyPoints,
      actionItems,
      recommendations,
      followUpPlan,
      attachments
    } = body;

    // 필수 필드 검증
    if (!consultationId || !summaryContent) {
      return NextResponse.json(
        { success: false, message: '상담 ID와 요약 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 상담 존재 확인
    const consultation = await Consultation.findByPk(parseInt(consultationId));
    if (!consultation) {
      return NextResponse.json(
        { success: false, message: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (상담 참여자만 요약 생성 가능)
    if (authUser.role === 'client' && consultation.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: '상담 요약 생성 권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (authUser.role === 'expert') {
      const expert = await Expert.findOne({ where: { userId: authUser.id } });
      if (!expert || consultation.expertId !== expert.id) {
        return NextResponse.json(
          { success: false, message: '상담 요약 생성 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 상담 요약 생성
    const newSummary = await ConsultationSummary.create({
      consultationId: parseInt(consultationId),
      summaryTitle: summaryTitle || consultation.title,
      summaryContent,
      keyPoints: keyPoints ? JSON.stringify(keyPoints) : JSON.stringify([]),
      actionItems: actionItems ? JSON.stringify(actionItems) : JSON.stringify([]),
      recommendations: recommendations ? JSON.stringify(recommendations) : JSON.stringify([]),
      followUpPlan: followUpPlan || '',
      attachments: attachments ? JSON.stringify(attachments) : JSON.stringify([]),
      isPublic: false // 기본적으로 비공개
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newSummary.id.toString(),
        consultationId: newSummary.consultationId.toString(),
        summaryTitle: newSummary.summaryTitle,
        summaryContent: newSummary.summaryContent,
        keyPoints: JSON.parse(newSummary.keyPoints),
        actionItems: JSON.parse(newSummary.actionItems),
        recommendations: JSON.parse(newSummary.recommendations),
        followUpPlan: newSummary.followUpPlan,
        attachments: JSON.parse(newSummary.attachments),
        isPublic: newSummary.isPublic,
        createdAt: newSummary.createdAt.toISOString()
      },
      message: '상담 요약이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('상담 요약 생성 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 요약 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
