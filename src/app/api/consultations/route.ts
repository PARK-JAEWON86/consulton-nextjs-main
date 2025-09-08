import { NextRequest, NextResponse } from 'next/server';
import { Consultation, Expert, User, Category } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
import { 
  getConsultationsByExpert, 
  getConsultationsByUser, 
  calculatePagination,
  logQueryPerformance 
} from '@/lib/db/queryOptimizations';
import { generateConsultationNumber, getNextSequenceNumber } from '@/utils/consultationNumber';
// import { dummyExperts } from '@/data/dummy/experts'; // 더미 데이터 제거

export type ConsultationStatus = "completed" | "scheduled" | "canceled" | "in_progress";

export interface ConsultationItem {
  id: number;
  consultationNumber?: string; // 상담번호 추가
  date: string; // ISO string
  customer: string;
  topic: string;
  amount: number; // credits
  status: ConsultationStatus;
  method?: "chat" | "video" | "voice" | "call";
  duration?: number; // minutes
  summary?: string;
  notes?: string;
  startDate?: string; // 상담 시작 시간
  endDate?: string; // 상담 종료 시간
  rating?: number; // 평점 추가
  issue?: {
    type: "refund" | "quality" | "other";
    reason: string;
    createdAt: string; // ISO
    status: "open" | "resolved" | "rejected";
  };
}

interface ConsultationsState {
  items: ConsultationItem[];
  currentConsultationId: number | null;
}

// 메모리 기반 상태 저장 (실제 프로덕션에서는 데이터베이스 사용 권장)
let consultationsState: ConsultationsState = {
  items: [],
  currentConsultationId: null,
};

// 상담번호 생성 함수
function createConsultationNumber(scheduledDate: Date, existingItems: ConsultationItem[]): string {
  // 해당 날짜의 기존 상담번호들 수집
  const existingNumbers = existingItems
    .filter(item => {
      if (!item.consultationNumber) return false;
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === scheduledDate.toDateString();
    })
    .map(item => item.consultationNumber!);

  // 다음 일련번호 계산
  const nextSequence = getNextSequenceNumber(scheduledDate, existingNumbers);

  // 상담번호 생성
  return generateConsultationNumber(scheduledDate, nextSequence);
}

// GET: 상담 내역 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const status = searchParams.get('status');
    const consultationNumber = searchParams.get('consultationNumber');
    const userId = searchParams.get('userId');
    
    // 인증된 사용자 정보 가져오기
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 쿼리 조건 구성
    let whereClause: any = {};
    
    // 전문가인 경우 자신의 상담만 조회
    if (authUser.role === 'expert') {
      const expert = await Expert.findOne({
        where: { userId: authUser.id }
      });
      if (expert) {
        whereClause.expertId = expert.id;
      }
    }
    
    // 일반 사용자인 경우 자신의 상담만 조회
    if (authUser.role === 'client') {
      whereClause.userId = authUser.id;
    }
    
    // 관리자는 모든 상담 조회 가능
    if (authUser.role === 'admin') {
      // 특정 전문가 ID로 필터링
      if (expertId) {
        whereClause.expertId = parseInt(expertId);
      }
      // 특정 사용자 ID로 필터링
      if (userId) {
        whereClause.userId = parseInt(userId);
      }
    }
    
    // 상태로 필터링
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // 최적화된 상담 조회
    const startTime = Date.now();
    let result;
    
    if (authUser.role === 'expert') {
      const expert = await Expert.findOne({
        where: { userId: authUser.id }
      });
      if (expert) {
        result = await getConsultationsByExpert(expert.id, {
          status: status || undefined,
          pagination: { page: 1, limit: 100 }
        });
      } else {
        result = { rows: [], count: 0 };
      }
    } else if (authUser.role === 'client') {
      result = await getConsultationsByUser(authUser.id, {
        status: status || undefined,
        pagination: { page: 1, limit: 100 }
      });
    } else {
      // 관리자용 기존 쿼리 유지
      result = await Consultation.findAndCountAll({
        where: whereClause,
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
          },
          {
            model: Category,
            as: 'category',
            required: false,
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
      });
    }
    
    const consultations = result.rows;
    logQueryPerformance('getConsultations', startTime, consultations.length);

    // 상담번호로 추가 필터링 (클라이언트 사이드)
    let filteredConsultations = consultations;
    if (consultationNumber) {
      // 상담번호는 현재 데이터베이스에 저장되지 않으므로 ID로 대체 검색
      filteredConsultations = consultations.filter(consultation => 
        consultation.id.toString().includes(consultationNumber)
      );
    }

    // 응답 데이터 변환
    const items: ConsultationItem[] = filteredConsultations.map(consultation => ({
      id: consultation.id,
      consultationNumber: `CONS-${consultation.id.toString().padStart(6, '0')}`, // 임시 상담번호 생성
      date: consultation.scheduledTime?.toISOString() || consultation.createdAt.toISOString(),
      customer: consultation.user?.name || '알 수 없음',
      topic: consultation.title,
      amount: consultation.price || 0,
      status: consultation.status as ConsultationStatus,
      method: consultation.consultationType as "chat" | "video" | "voice" | "call",
      duration: consultation.duration || 0,
      summary: consultation.notes || '',
      startDate: consultation.startTime?.toISOString(),
      endDate: consultation.endTime?.toISOString(),
      rating: consultation.rating || 0
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        items,
        currentConsultationId: null, // TODO: 현재 진행 중인 상담 ID 로직 구현
        total: items.length
      }
    });
  } catch (error) {
    console.error('상담 내역 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '상담 내역 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 상담 내역 관리 액션
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
    const { action, data } = body;

    switch (action) {
      case 'addScheduled': {
        const {
          expertId,
          categoryId,
          title,
          description,
          consultationType,
          scheduledTime,
          duration,
          price
        } = data;

        // 입력값 검증
        if (!expertId || !categoryId || !title || !scheduledTime) {
          return NextResponse.json(
            { success: false, message: '필수 정보가 누락되었습니다.' },
            { status: 400 }
          );
        }

        // 상담 생성
        const newConsultation = await Consultation.create({
          userId: authUser.id,
          expertId: parseInt(expertId),
          categoryId: parseInt(categoryId),
          title,
          description: description || '',
          consultationType: consultationType || 'video',
          status: 'scheduled',
          scheduledTime: new Date(scheduledTime),
          duration: duration || 60,
          price: price || 0,
          topic: title
        });

        const consultationNumber = `CONS-${newConsultation.id.toString().padStart(6, '0')}`;
        
        return NextResponse.json({
          success: true,
          data: {
            consultation: {
              id: newConsultation.id,
              consultationNumber,
              date: newConsultation.scheduledTime.toISOString(),
              customer: authUser.name || '알 수 없음',
              topic: newConsultation.title,
              amount: newConsultation.price,
              status: 'scheduled',
              method: newConsultation.consultationType,
              duration: newConsultation.duration
            },
            currentConsultationId: newConsultation.id,
            message: '상담이 예약되었습니다.',
            consultationNumber
          }
        });
      }

      case 'startConsultation': {
        const consultationId = data.consultationId;
        if (!consultationId) {
          return NextResponse.json(
            { success: false, message: '상담 ID가 필요합니다.' },
            { status: 400 }
          );
        }

        const consultationToStart = await Consultation.findByPk(consultationId);
        if (!consultationToStart) {
          return NextResponse.json(
            { success: false, message: '상담을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        if (consultationToStart.status !== 'scheduled') {
          return NextResponse.json(
            { success: false, message: '예약된 상담만 시작할 수 있습니다.' },
            { status: 400 }
          );
        }

        // 상담 시작 처리
        await consultationToStart.update({
          status: 'in_progress',
          startTime: new Date()
        });

        const consultationNumber = `CONS-${consultationToStart.id.toString().padStart(6, '0')}`;

        return NextResponse.json({
          success: true,
          data: {
            consultation: {
              id: consultationToStart.id,
              consultationNumber,
              date: consultationToStart.scheduledTime.toISOString(),
              customer: '알 수 없음', // TODO: 사용자 정보 조회
              topic: consultationToStart.title,
              amount: consultationToStart.price,
              status: 'in_progress',
              method: consultationToStart.consultationType,
              duration: consultationToStart.duration,
              startDate: consultationToStart.startTime?.toISOString()
            },
            currentConsultationId: consultationId,
            message: '상담이 시작되었습니다.',
            consultationNumber
          }
        });
      }

      case 'updateCurrent': {
        const currentId = data.consultationId;
        if (!currentId) {
          return NextResponse.json(
            { success: false, message: '상담 ID가 필요합니다.' },
            { status: 400 }
          );
        }
        
        const currentConsultation = await Consultation.findByPk(currentId);
        if (!currentConsultation) {
          return NextResponse.json(
            { success: false, message: '상담을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        // 상담 정보 업데이트
        await currentConsultation.update({
          notes: data.summary || currentConsultation.notes,
          duration: data.duration || currentConsultation.duration,
          price: data.amount || currentConsultation.price
        });
        
        return NextResponse.json({
          success: true,
          data: {
            updatedConsultation: {
              id: currentConsultation.id,
              consultationNumber: `CONS-${currentConsultation.id.toString().padStart(6, '0')}`,
              date: currentConsultation.scheduledTime.toISOString(),
              customer: '알 수 없음',
              topic: currentConsultation.title,
              amount: currentConsultation.price,
              status: currentConsultation.status,
              method: currentConsultation.consultationType,
              duration: currentConsultation.duration,
              summary: currentConsultation.notes
            },
            message: '상담 정보가 업데이트되었습니다.'
          }
        });
      }

      case 'updateById': {
        const targetId = data.id;
        const targetConsultation = await Consultation.findByPk(targetId);
        if (!targetConsultation) {
          return NextResponse.json(
            { success: false, message: '상담을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        await targetConsultation.update(data.payload);
        
        return NextResponse.json({
          success: true,
          data: {
            updatedConsultation: {
              id: targetConsultation.id,
              consultationNumber: `CONS-${targetConsultation.id.toString().padStart(6, '0')}`,
              date: targetConsultation.scheduledTime.toISOString(),
              customer: '알 수 없음',
              topic: targetConsultation.title,
              amount: targetConsultation.price,
              status: targetConsultation.status,
              method: targetConsultation.consultationType,
              duration: targetConsultation.duration,
              summary: targetConsultation.notes
            },
            message: '상담 정보가 업데이트되었습니다.'
          }
        });
      }

      case 'completeCurrent': {
        const currentConsultationId = data.consultationId;
        if (!currentConsultationId) {
          return NextResponse.json(
            { success: false, message: '상담 ID가 필요합니다.' },
            { status: 400 }
          );
        }
        
        const consultationToComplete = await Consultation.findByPk(currentConsultationId);
        if (!consultationToComplete) {
          return NextResponse.json(
            { success: false, message: '상담을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        if (consultationToComplete.status !== 'in_progress') {
          return NextResponse.json(
            { success: false, message: '진행 중인 상담만 완료할 수 있습니다.' },
            { status: 400 }
          );
        }

        // 상담 완료 처리
        await consultationToComplete.update({
          status: 'completed',
          endTime: new Date(),
          rating: data.rating || consultationToComplete.rating,
          review: data.review || consultationToComplete.review
        });
        
        return NextResponse.json({
          success: true,
          data: {
            completedConsultation: {
              id: consultationToComplete.id,
              consultationNumber: `CONS-${consultationToComplete.id.toString().padStart(6, '0')}`,
              date: consultationToComplete.scheduledTime.toISOString(),
              customer: '알 수 없음',
              topic: consultationToComplete.title,
              amount: consultationToComplete.price,
              status: 'completed',
              method: consultationToComplete.consultationType,
              duration: consultationToComplete.duration,
              summary: consultationToComplete.notes,
              endDate: consultationToComplete.endTime?.toISOString(),
              rating: consultationToComplete.rating
            },
            currentConsultationId: null,
            message: '상담이 완료되었습니다.'
          }
        });
      }

      case 'markCompleted': {
        const consultationIdToComplete = data.id;
        const consultationToMark = await Consultation.findByPk(consultationIdToComplete);
        if (!consultationToMark) {
          return NextResponse.json(
            { success: false, message: '상담을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        await consultationToMark.update({
          status: 'completed',
          endTime: new Date()
        });
        
        return NextResponse.json({
          success: true,
          data: {
            updatedConsultation: {
              id: consultationToMark.id,
              consultationNumber: `CONS-${consultationToMark.id.toString().padStart(6, '0')}`,
              date: consultationToMark.scheduledTime.toISOString(),
              customer: '알 수 없음',
              topic: consultationToMark.title,
              amount: consultationToMark.price,
              status: 'completed',
              method: consultationToMark.consultationType,
              duration: consultationToMark.duration,
              summary: consultationToMark.notes,
              endDate: consultationToMark.endTime?.toISOString()
            },
            message: '상담이 완료 상태로 변경되었습니다.'
          }
        });
      }

      case 'clearCurrent': {
        return NextResponse.json({
          success: true,
          data: {
            currentConsultationId: null,
            message: '현재 상담이 초기화되었습니다.'
          }
        });
      }

      case 'clearAll': {
        // 관리자만 모든 상담 내역 초기화 가능
        if (authUser.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: '관리자 권한이 필요합니다.' },
            { status: 403 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: {
            message: '모든 상담 내역이 초기화되었습니다.'
          }
        });
      }

      case 'loadExpertConsultations': {
        const expertId = data.expertId;
        // 실제 데이터베이스에서 해당 전문가 찾기
        const expert = await Expert.findByPk(parseInt(expertId));
        
        if (expert) {
          // 실제 데이터베이스에서 해당 전문가의 상담 내역 조회
          const consultations = await Consultation.findAll({
            where: { expertId: expert.id },
            include: [
              {
                model: User,
                as: 'user',
                required: false,
                attributes: ['id', 'name', 'email']
              },
              {
                model: Category,
                as: 'category',
                required: false,
                attributes: ['id', 'name']
              }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
          });

          const items: ConsultationItem[] = consultations.map(consultation => ({
            id: consultation.id,
            consultationNumber: `CONS-${consultation.id.toString().padStart(6, '0')}`,
            date: consultation.scheduledTime?.toISOString() || consultation.createdAt.toISOString(),
            customer: consultation.user?.name || '알 수 없음',
            topic: consultation.title,
            amount: consultation.price || 0,
            status: consultation.status as ConsultationStatus,
            method: consultation.consultationType as "chat" | "video" | "voice" | "call",
            duration: consultation.duration || 0,
            summary: consultation.notes || '',
            startDate: consultation.startTime?.toISOString(),
            endDate: consultation.endTime?.toISOString(),
            rating: consultation.rating || 0
          }));
          
          return NextResponse.json({
            success: true,
            data: {
              items,
              currentConsultationId: null,
              total: items.length,
              message: `전문가의 상담 내역이 로드되었습니다.`
            }
          });
        } else {
          return NextResponse.json(
            { success: false, message: '전문가를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }
      }

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '상담 내역 관리 실패' },
      { status: 500 }
    );
  }
}

// PATCH: 상담 내역 부분 업데이트
export async function PATCH(request: NextRequest) {
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
    const { id, updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '상담 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const consultation = await Consultation.findByPk(parseInt(id));
    if (!consultation) {
      return NextResponse.json(
        { success: false, message: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인의 상담이거나 관리자만 수정 가능)
    if (authUser.role !== 'admin' && consultation.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: '상담 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    await consultation.update(updates);
    
    const updatedConsultation = {
      id: consultation.id,
      consultationNumber: `CONS-${consultation.id.toString().padStart(6, '0')}`,
      date: consultation.scheduledTime?.toISOString() || consultation.createdAt.toISOString(),
      customer: '알 수 없음',
      topic: consultation.title,
      amount: consultation.price,
      status: consultation.status,
      method: consultation.consultationType,
      duration: consultation.duration,
      summary: consultation.notes,
      startDate: consultation.startTime?.toISOString(),
      endDate: consultation.endTime?.toISOString(),
      rating: consultation.rating
    };
    
    return NextResponse.json({
      success: true,
      data: {
        updatedConsultation,
        message: '상담 정보가 업데이트되었습니다.'
      }
    });
  } catch (error) {
    console.error('상담 정보 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 상담 내역 삭제
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');
    
    if (id) {
      // 특정 상담 삭제
      const consultationId = parseInt(id);
      const consultation = await Consultation.findByPk(consultationId);
      
      if (!consultation) {
        return NextResponse.json(
          { success: false, message: '상담을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 권한 확인 (본인의 상담이거나 관리자만 삭제 가능)
      if (authUser.role !== 'admin' && consultation.userId !== authUser.id) {
        return NextResponse.json(
          { success: false, message: '상담 삭제 권한이 없습니다.' },
          { status: 403 }
        );
      }
      
      await consultation.destroy();
      
      return NextResponse.json({
        success: true,
        data: {
          deletedId: consultationId,
          message: '상담이 삭제되었습니다.'
        }
      });
    } else {
      // 모든 상담 삭제 (관리자만 가능)
      if (authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: '관리자 권한이 필요합니다.' },
          { status: 403 }
        );
      }
      
      await Consultation.destroy({ where: {} });
      
      return NextResponse.json({
        success: true,
        data: {
          message: '모든 상담 내역이 삭제되었습니다.'
        }
      });
    }
  } catch (error) {
    console.error('상담 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '상담 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
