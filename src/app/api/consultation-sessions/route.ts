import { NextRequest, NextResponse } from "next/server";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { Consultation } from "@/lib/db/models/consultation.model";
import { User } from "@/lib/db/models/user.model";
import { Expert } from "@/lib/db/models/expert.model";
import { ExpertProfile } from "@/lib/db/models/expertProfile.model";
import { Category } from "@/lib/db/models/category.model";
import { 
  CreateConsultationSessionRequest, 
  UpdateConsultationSessionRequest,
  ConsultationWithSessions 
} from "@/types";

/**
 * 상담 세션 API
 * GET: 상담 세션 목록 조회
 * POST: 새로운 상담 세션 생성
 */

// 상담 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const expertId = searchParams.get('expertId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 기본 쿼리 조건
    const whereClause: any = {};
    
    if (consultationId) {
      whereClause.consultationId = parseInt(consultationId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    // 상담 세션 조회 (상담 정보와 함께)
    const sessions = await ConsultationSession.findAll({
      where: whereClause,
      include: [
        {
          model: Consultation,
          as: 'consultation',
          where: expertId ? { expertId: parseInt(expertId) } : 
                 userId ? { userId: parseInt(userId) } : {},
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
      ],
      order: [['startTime', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    });

    // 총 개수 조회
    const totalCount = await ConsultationSession.count({
      where: whereClause,
      include: [
        {
          model: Consultation,
          as: 'consultation',
          where: expertId ? { expertId: parseInt(expertId) } : 
                 userId ? { userId: parseInt(userId) } : {}
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
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

// 새로운 상담 세션 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateConsultationSessionRequest = await request.json();
    
    // 필수 필드 검증
    if (!body.consultationId || !body.sessionNumber || !body.startTime) {
      return NextResponse.json(
        { 
          success: false, 
          error: "필수 필드가 누락되었습니다. (consultationId, sessionNumber, startTime)" 
        },
        { status: 400 }
      );
    }

    // 상담이 존재하는지 확인
    const consultation = await Consultation.findByPk(body.consultationId);
    if (!consultation) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담을 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    // 동일한 상담의 세션 번호가 중복되지 않는지 확인
    const existingSession = await ConsultationSession.findOne({
      where: {
        consultationId: body.consultationId,
        sessionNumber: body.sessionNumber
      }
    });

    if (existingSession) {
      return NextResponse.json(
        { 
          success: false, 
          error: "해당 상담의 세션 번호가 이미 존재합니다." 
        },
        { status: 409 }
      );
    }

    // 상담 세션 생성
    const session = await ConsultationSession.create({
      consultationId: body.consultationId,
      sessionNumber: body.sessionNumber,
      startTime: new Date(body.startTime),
      duration: 0, // 초기값
      status: 'scheduled',
      notes: body.notes || '',
      transcript: '',
      attachments: '[]'
    });

    // 생성된 세션 정보와 함께 상담 정보도 반환
    const sessionWithDetails = await ConsultationSession.findByPk(session.id, {
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
        session: sessionWithDetails,
        message: "상담 세션이 성공적으로 생성되었습니다."
      }
    });

  } catch (error) {
    console.error("상담 세션 생성 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 세션 생성에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
