import { NextRequest, NextResponse } from 'next/server';
import { ConsultationSummary, Consultation, User, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
// import { dummyConsultationSummaries } from '@/data/dummy/consultations'; // 더미 데이터 제거

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // 데이터베이스에서 상담 요약 조회
    const summary = await ConsultationSummary.findByPk(parseInt(id), {
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
      ]
    });
    
    if (!summary) {
      return NextResponse.json(
        { success: false, message: '상담 요약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (상담 참여자만 조회 가능)
    if (authUser.role === 'client' && (summary as any).consultation.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: '상담 요약 조회 권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (authUser.role === 'expert') {
      const expert = await Expert.findOne({ where: { userId: authUser.id } });
      if (!expert || (summary as any).consultation.expertId !== expert.id) {
        return NextResponse.json(
          { success: false, message: '상담 요약 조회 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 응답 데이터 변환
    const detailedSummary = {
      id: summary.id.toString(),
      consultationNumber: `CONS-${summary.consultationId.toString().padStart(6, '0')}`,
      title: summary.summaryTitle || (summary as any).consultation.title,
      date: (summary as any).consultation.scheduledTime?.toISOString() || summary.createdAt.toISOString(),
      status: (summary as any).consultation.status,
      expert: {
        id: (summary as any).consultation.expert?.id.toString() || '',
        name: (summary as any).consultation.expert?.user?.name || '알 수 없음',
        specialty: (summary as any).consultation.expert?.specialty || '',
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
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: detailedSummary
    });
  } catch (error) {
    console.error('상담 요약 상세 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 요약을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    
    const {
      summaryTitle,
      summaryContent,
      keyPoints,
      actionItems,
      recommendations,
      followUpPlan,
      attachments,
      isPublic
    } = body;

    // 상담 요약 존재 확인
    const summary = await ConsultationSummary.findByPk(parseInt(id), {
      include: [
        {
          model: Consultation,
          as: 'consultation',
          required: true
        }
      ]
    });

    if (!summary) {
      return NextResponse.json(
        { success: false, message: '상담 요약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (상담 참여자만 수정 가능)
    if (authUser.role === 'client' && (summary as any).consultation.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: '상담 요약 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (authUser.role === 'expert') {
      const expert = await Expert.findOne({ where: { userId: authUser.id } });
      if (!expert || (summary as any).consultation.expertId !== expert.id) {
        return NextResponse.json(
          { success: false, message: '상담 요약 수정 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 업데이트할 데이터 구성
    const updateData: any = {};
    
    if (summaryTitle !== undefined) updateData.summaryTitle = summaryTitle;
    if (summaryContent !== undefined) updateData.summaryContent = summaryContent;
    if (keyPoints !== undefined) updateData.keyPoints = JSON.stringify(keyPoints);
    if (actionItems !== undefined) updateData.actionItems = JSON.stringify(actionItems);
    if (recommendations !== undefined) updateData.recommendations = JSON.stringify(recommendations);
    if (followUpPlan !== undefined) updateData.followUpPlan = followUpPlan;
    if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // 상담 요약 업데이트
    await summary.update(updateData);

    return NextResponse.json({
      success: true,
      message: '상담 요약이 성공적으로 업데이트되었습니다.',
      data: {
        id: summary.id.toString(),
        consultationId: summary.consultationId.toString(),
        summaryTitle: summary.summaryTitle,
        summaryContent: summary.summaryContent,
        keyPoints: JSON.parse(summary.keyPoints),
        actionItems: JSON.parse(summary.actionItems),
        recommendations: JSON.parse(summary.recommendations),
        followUpPlan: summary.followUpPlan,
        attachments: JSON.parse(summary.attachments),
        isPublic: summary.isPublic,
        updatedAt: summary.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('상담 요약 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 요약 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 실제 인증 로직 구현
    const { id } = params;

    // TODO: 실제 데이터베이스에서 상담 요약 삭제
    console.log(`상담 요약 ${id} 삭제`);

    return NextResponse.json({
      success: true,
      message: '상담 요약이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('상담 요약 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 요약 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
