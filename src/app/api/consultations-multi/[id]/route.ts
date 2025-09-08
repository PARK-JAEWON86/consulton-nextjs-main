import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/lib/db/models/consultation.model";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { User } from "@/lib/db/models/user.model";
import { Expert } from "@/lib/db/models/expert.model";
import { ExpertProfile } from "@/lib/db/models/expertProfile.model";
import { Category } from "@/lib/db/models/category.model";

/**
 * 개별 상담 관리 API v2
 * GET: 특정 상담 조회 (세션 정보 포함)
 * PUT: 상담 정보 업데이트
 * DELETE: 상담 삭제
 */

// 특정 상담 조회 (세션 정보 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = parseInt(params.id);

    if (isNaN(consultationId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "유효하지 않은 상담 ID입니다." 
        },
        { status: 400 }
      );
    }

    const consultation = await Consultation.findByPk(consultationId, {
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
        },
        {
          model: ConsultationSession,
          as: 'sessions',
          order: [['sessionNumber', 'ASC']]
        }
      ]
    });

    if (!consultation) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { consultation }
    });

  } catch (error) {
    console.error("상담 조회 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 조회에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 상담 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(consultationId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "유효하지 않은 상담 ID입니다." 
        },
        { status: 400 }
      );
    }

    // 상담이 존재하는지 확인
    const existingConsultation = await Consultation.findByPk(consultationId);
    if (!existingConsultation) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    
    if (body.title) {
      updateData.title = body.title;
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    if (body.consultationType) {
      updateData.consultationType = body.consultationType;
    }
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.scheduledTime) {
      updateData.scheduledTime = new Date(body.scheduledTime);
    }
    
    if (body.duration !== undefined) {
      updateData.duration = body.duration;
    }
    
    if (body.price !== undefined) {
      updateData.price = body.price;
    }
    
    if (body.topic) {
      updateData.topic = body.topic;
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
    if (body.startTime) {
      updateData.startTime = new Date(body.startTime);
    }
    
    if (body.endTime) {
      updateData.endTime = new Date(body.endTime);
    }
    
    if (body.rating !== undefined) {
      updateData.rating = body.rating;
    }
    
    if (body.review !== undefined) {
      updateData.review = body.review;
    }

    // 상담 업데이트
    await Consultation.update(updateData, {
      where: { id: consultationId }
    });

    // 업데이트된 상담 정보 조회
    const updatedConsultation = await Consultation.findByPk(consultationId, {
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
        },
        {
          model: ConsultationSession,
          as: 'sessions',
          order: [['sessionNumber', 'ASC']]
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        consultation: updatedConsultation,
        message: "상담 정보가 성공적으로 업데이트되었습니다."
      }
    });

  } catch (error) {
    console.error("상담 업데이트 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 업데이트에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 상담 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = parseInt(params.id);

    if (isNaN(consultationId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "유효하지 않은 상담 ID입니다." 
        },
        { status: 400 }
      );
    }

    // 상담이 존재하는지 확인
    const existingConsultation = await Consultation.findByPk(consultationId);
    if (!existingConsultation) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 상담 상태 확인 (진행 중인 상담은 삭제할 수 없음)
    if (existingConsultation.status === 'in_progress') {
      return NextResponse.json(
        { 
          success: false, 
          error: "진행 중인 상담은 삭제할 수 없습니다." 
        },
        { status: 400 }
      );
    }

    // 관련 세션들 먼저 삭제
    await ConsultationSession.destroy({
      where: { consultationId: consultationId }
    });

    // 상담 삭제
    await Consultation.destroy({
      where: { id: consultationId }
    });

    return NextResponse.json({
      success: true,
      message: "상담이 성공적으로 삭제되었습니다."
    });

  } catch (error) {
    console.error("상담 삭제 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 삭제에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
