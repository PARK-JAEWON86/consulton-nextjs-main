import { NextRequest, NextResponse } from "next/server";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { Consultation } from "@/lib/db/models/consultation.model";
import { User } from "@/lib/db/models/user.model";
import { Expert } from "@/lib/db/models/expert.model";
import { ExpertProfile } from "@/lib/db/models/expertProfile.model";
import { Category } from "@/lib/db/models/category.model";
import { UpdateConsultationSessionRequest } from "@/types";

/**
 * 개별 상담 세션 API
 * GET: 특정 상담 세션 조회
 * PUT: 상담 세션 업데이트
 * DELETE: 상담 세션 삭제
 */

// 특정 상담 세션 조회
export async function GET(
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

    const session = await ConsultationSession.findByPk(sessionId, {
      include: [
        {
          model: Consultation,
          as: 'consultation',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar']
            },
            {
              model: Expert,
              as: 'expert',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'avatar']
                },
                {
                  model: ExpertProfile,
                  as: 'profile',
                  attributes: ['specialty', 'level', 'avgRating']
                }
              ]
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'description']
            }
          ]
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

    return NextResponse.json({
      success: true,
      data: { session }
    });

  } catch (error) {
    console.error("상담 세션 조회 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 조회에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 상담 세션 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id);
    const body: UpdateConsultationSessionRequest = await request.json();

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
    const existingSession = await ConsultationSession.findByPk(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담 세션을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    
    if (body.endTime) {
      updateData.endTime = new Date(body.endTime);
    }
    
    if (body.duration !== undefined) {
      updateData.duration = body.duration;
    }
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
    if (body.transcript !== undefined) {
      updateData.transcript = body.transcript;
    }
    
    if (body.recordingUrl !== undefined) {
      updateData.recordingUrl = body.recordingUrl;
    }
    
    if (body.attachments !== undefined) {
      updateData.attachments = body.attachments;
    }

    // 세션 업데이트
    await ConsultationSession.update(updateData, {
      where: { id: sessionId }
    });

    // 업데이트된 세션 정보 조회
    const updatedSession = await ConsultationSession.findByPk(sessionId, {
      include: [
        {
          model: Consultation,
          as: 'consultation',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar']
            },
            {
              model: Expert,
              as: 'expert',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'avatar']
                },
                {
                  model: ExpertProfile,
                  as: 'profile',
                  attributes: ['specialty', 'level', 'avgRating']
                }
              ]
            },
            {
              model: Category,
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
        message: "상담 세션이 성공적으로 업데이트되었습니다."
      }
    });

  } catch (error) {
    console.error("상담 세션 업데이트 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 업데이트에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 상담 세션 삭제
export async function DELETE(
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
    const existingSession = await ConsultationSession.findByPk(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담 세션을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 세션 삭제
    await ConsultationSession.destroy({
      where: { id: sessionId }
    });

    return NextResponse.json({
      success: true,
      message: "상담 세션이 성공적으로 삭제되었습니다."
    });

  } catch (error) {
    console.error("상담 세션 삭제 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 삭제에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
