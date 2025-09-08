import { NextRequest, NextResponse } from "next/server";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { Consultation } from "@/lib/db/models/consultation.model";

/**
 * 상담 세션 시작 API
 * POST: 상담 세션을 시작 상태로 변경
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "유효하지 않은 세션 ID입니다." 
        },
        { status: 400 }
      );
    }

    // 세션이 존재하는지 확인
    const session = await ConsultationSession.findByPk(sessionId, {
      include: [
        {
          model: Consultation,
          as: 'consultation'
        }
      ]
    });

    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담 세션을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 세션 상태 확인
    if (session.status !== 'scheduled') {
      return NextResponse.json(
        { 
          success: false, 
          error: "예정된 세션만 시작할 수 있습니다." 
        },
        { status: 400 }
      );
    }

    // 세션 시작 시간 업데이트
    const now = new Date();
    await ConsultationSession.update(
      {
        status: 'in_progress',
        startTime: now
      },
      {
        where: { id: sessionId }
      }
    );

    // 상담 상태도 진행 중으로 업데이트 (필요한 경우)
    if ((session as any).consultation.status === 'scheduled') {
      await Consultation.update(
        { status: 'in_progress' },
        { where: { id: session.consultationId } }
      );
    }

    // 업데이트된 세션 정보 조회
    const updatedSession = await ConsultationSession.findByPk(sessionId, {
      include: [
        {
          model: Consultation,
          as: 'consultation',
          include: [
            {
              model: require('@/lib/db/models/user.model').User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar']
            },
            {
              model: require('@/lib/db/models/expert.model').Expert,
              as: 'expert',
              include: [
                {
                  model: require('@/lib/db/models/user.model').User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'avatar']
                },
                {
                  model: require('@/lib/db/models/expertProfile.model').ExpertProfile,
                  as: 'profile',
                  attributes: ['specialty', 'level', 'avgRating']
                }
              ]
            },
            {
              model: require('@/lib/db/models/category.model').Category,
              as: 'category',
              attributes: ['id', 'name', 'description']
            }
          ]
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        message: "상담 세션이 시작되었습니다."
      }
    });

  } catch (error) {
    console.error("상담 세션 시작 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 시작에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
