import { NextRequest, NextResponse } from "next/server";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { Consultation } from "@/lib/db/models/consultation.model";

/**
 * 상담 세션 종료 API
 * POST: 상담 세션을 종료 상태로 변경
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id);
    const body = await request.json();
    const { notes, transcript, recordingUrl, attachments } = body;

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
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { 
          success: false, 
          error: "진행 중인 세션만 종료할 수 있습니다." 
        },
        { status: 400 }
      );
    }

    // 세션 종료 시간 계산
    const now = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)); // 분 단위

    // 세션 종료 업데이트
    await ConsultationSession.update(
      {
        status: 'completed',
        endTime: now,
        duration: duration,
        notes: notes || session.notes,
        transcript: transcript || session.transcript,
        recordingUrl: recordingUrl || session.recordingUrl,
        attachments: attachments || session.attachments
      },
      {
        where: { id: sessionId }
      }
    );

    // 해당 상담의 모든 세션이 완료되었는지 확인
    const remainingSessions = await ConsultationSession.count({
      where: {
        consultationId: session.consultationId,
        status: { [require('sequelize').Op.in]: ['scheduled', 'in_progress'] }
      }
    });

    // 모든 세션이 완료되었으면 상담도 완료로 변경
    if (remainingSessions === 0) {
      await Consultation.update(
        { 
          status: 'completed',
          endTime: now
        },
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
        message: "상담 세션이 종료되었습니다.",
        duration: duration
      }
    });

  } catch (error) {
    console.error("상담 세션 종료 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 종료에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
