import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/lib/db/models/consultation.model";
import { ConsultationSession } from "@/lib/db/models/consultationSession.model";
import { User } from "@/lib/db/models/user.model";
import { Expert } from "@/lib/db/models/expert.model";
import { ExpertProfile } from "@/lib/db/models/expertProfile.model";
import { Category } from "@/lib/db/models/category.model";
import { 
  CreateConsultationRequest, 
  ConsultationWithSessions 
} from "@/types";

/**
 * 상담 관리 API v2 (다중 세션 지원)
 * GET: 상담 목록 조회 (세션 정보 포함)
 * POST: 새로운 상담 생성
 */

// 상담 목록 조회 (세션 정보 포함)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 기본 쿼리 조건
    const whereClause: any = {};
    
    if (expertId) {
      whereClause.expertId = parseInt(expertId);
    }
    
    if (userId) {
      whereClause.userId = parseInt(userId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    // 상담 조회 (세션 정보와 함께)
    const consultations = await Consultation.findAll({
      where: whereClause,
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
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    });

    // 총 개수 조회
    const totalCount = await Consultation.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      data: {
        consultations,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error("상담 목록 조회 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 목록 조회에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 새로운 상담 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateConsultationRequest = await request.json();
    
    // 필수 필드 검증
    if (!body.expertId || !body.userId || !body.categoryId || !body.title || !body.scheduledTime) {
      return NextResponse.json(
        { 
          success: false, 
          error: "필수 필드가 누락되었습니다. (expertId, userId, categoryId, title, scheduledTime)" 
        },
        { status: 400 }
      );
    }

    // 상담 생성
    const consultation = await Consultation.create({
      userId: body.userId,
      expertId: body.expertId,
      categoryId: body.categoryId,
      title: body.title,
      description: body.description || '',
      consultationType: body.consultationType,
      status: 'scheduled',
      scheduledTime: new Date(body.scheduledTime),
      duration: body.duration,
      price: body.price,
      expertLevel: (body as any).expertLevel || 1,
      topic: body.topic,
      notes: '',
      startTime: undefined,
      endTime: undefined,
      rating: undefined,
      review: undefined
    });

    // 생성된 상담 정보와 함께 관련 정보도 반환
    const consultationWithDetails = await Consultation.findByPk(consultation.id, {
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
        consultation: consultationWithDetails,
        message: "상담이 성공적으로 생성되었습니다."
      }
    });

  } catch (error) {
    console.error("상담 생성 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "상담 생성에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}
