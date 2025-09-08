import { NextRequest, NextResponse } from 'next/server';
import { Review, User, Expert, Consultation } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { getAuthenticatedUser } from '@/lib/auth';
import { 
  getReviewsByExpert, 
  calculatePagination,
  logQueryPerformance 
} from '@/lib/db/queryOptimizations';

// 리뷰 타입 정의 (API 응답용)
interface ReviewResponse {
  id: string;
  consultationId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  expertId: string;
  expertName: string;
  rating: number;
  content: string;
  category: string;
  date: string;
  isVerified: boolean;
  isPublic: boolean;
  expertReply?: {
    message: string;
    createdAt: string;
  };
}

// import { dummyReviews } from '@/data/dummy/reviews'; // 더미 데이터 제거

// 전문가 통계 업데이트 헬퍼 함수
async function updateExpertStatsAfterReview(
  expertId: string, 
  action: 'add' | 'update' | 'delete', 
  newRating?: number, 
  oldRating?: number
) {
  try {
    // 현재 전문가 통계 조회
    const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-stats?expertId=${expertId}`);
    if (!statsResponse.ok) {
      throw new Error('전문가 통계 조회 실패');
    }
    
    const statsResult = await statsResponse.json();
    if (!statsResult.success) {
      throw new Error('전문가 통계 데이터 없음');
    }
    
    const currentStats = statsResult.data;
    
    // 해당 전문가의 모든 리뷰 조회
    const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews?expertId=${expertId}`);
    if (!reviewsResponse.ok) {
      throw new Error('리뷰 조회 실패');
    }
    
    const reviewsResult = await reviewsResponse.json();
    if (!reviewsResult.success) {
      throw new Error('리뷰 데이터 없음');
    }
    
    const expertReviews = reviewsResult.data.reviews;
    
    // 새로운 통계 계산
    let newReviewCount = currentStats.reviewCount;
    let newAvgRating = currentStats.avgRating;
    
    if (action === 'add') {
      newReviewCount += 1;
      // 평균 평점 재계산
      const totalRating = expertReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      newAvgRating = totalRating / newReviewCount;
    } else if (action === 'update' && oldRating !== undefined && newRating !== undefined) {
      // 평점 변경 시 평균 재계산
      const totalRating = expertReviews.reduce((sum: number, review: any) => {
        if (review.id === currentStats.expertId) {
          return sum + newRating; // 새로운 평점 사용
        }
        return sum + review.rating;
      }, 0);
      newAvgRating = totalRating / newReviewCount;
    } else if (action === 'delete') {
      newReviewCount = Math.max(0, newReviewCount - 1);
      if (newReviewCount > 0) {
        const totalRating = expertReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        newAvgRating = totalRating / newReviewCount;
      } else {
        newAvgRating = 0;
      }
    }
    
    // 전문가 통계 업데이트
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/expert-stats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expertId,
        reviewCount: newReviewCount,
        avgRating: Math.round(newAvgRating * 10) / 10 // 소수점 첫째 자리까지 반올림
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error('전문가 통계 업데이트 실패');
    }
    
  } catch (error) {
    console.error('전문가 통계 업데이트 오류:', error);
    throw error;
  }
}

// GET: 리뷰 목록 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const expertId = searchParams.get('expertId');
    const isPublic = searchParams.get('isPublic');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 쿼리 조건 구성
    let whereClause: any = {
      isDeleted: false
    };

    if (consultationId) {
      whereClause.consultationId = parseInt(consultationId);
    }
    if (expertId) {
      whereClause.expertId = parseInt(expertId);
    }
    if (isPublic !== null) {
      whereClause.isPublic = isPublic === 'true';
    }

    // 최적화된 리뷰 조회
    const startTime = Date.now();
    let result;
    
    if (expertId) {
      // 전문가별 리뷰 조회 최적화
      result = await getReviewsByExpert(parseInt(expertId), {
        isPublic: isPublic !== null ? isPublic === 'true' : undefined,
        pagination: { page: Math.floor(offset / limit) + 1, limit }
      });
    } else {
      // 일반 리뷰 조회
      result = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email', 'profileImage']
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
            model: Consultation,
            as: 'consultation',
            required: false,
            attributes: ['id', 'title', 'categoryId']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    }
    
    const { rows: reviews, count: totalCount } = result;
    logQueryPerformance('getReviews', startTime, reviews.length);

    // 응답 데이터 변환
    const reviewResponses: ReviewResponse[] = reviews.map(review => ({
      id: review.id.toString(),
      consultationId: review.consultationId.toString(),
      userId: review.userId.toString(),
      userName: (review as any).user?.name || '익명',
      userAvatar: (review as any).user?.profileImage || null,
      expertId: review.expertId.toString(),
      expertName: (review as any).expert?.user?.name || '알 수 없음',
      rating: review.rating,
      content: review.content,
      category: (review as any).consultation?.categoryId?.toString() || '기타',
      date: review.createdAt.toISOString(),
      isVerified: review.isVerified,
      isPublic: review.isPublic,
      // expertReply는 현재 DB 스키마에 없으므로 제거하거나 별도 처리 필요
      ...((review as any).expertReply && {
        expertReply: {
          message: (review as any).expertReply,
          createdAt: review.updatedAt.toISOString()
        }
      })
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewResponses,
        total: totalCount,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 리뷰 생성
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
      expertId,
      rating,
      content,
      title,
      isAnonymous = false
    } = body;

    // 필수 필드 검증
    if (!consultationId || !expertId || !rating || !content) {
      return NextResponse.json(
        { success: false, message: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 평점 범위 검증
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: '평점은 1-5 사이여야 합니다.' },
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

    // 상담이 완료되었는지 확인
    if (consultation.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: '완료된 상담에만 리뷰를 작성할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 중복 리뷰 검증 (같은 상담에 대해 한 사용자가 하나의 리뷰만 작성 가능)
    const existingReview = await Review.findOne({
      where: {
        consultationId: parseInt(consultationId),
        userId: authUser.id
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: '이미 이 상담에 대한 리뷰를 작성했습니다.' },
        { status: 400 }
      );
    }

    // 새 리뷰 생성
    const newReview = await Review.create({
      consultationId: parseInt(consultationId),
      userId: authUser.id,
      expertId: parseInt(expertId),
      rating,
      title: title || '',
      content,
      isAnonymous,
      isVerified: true, // 실제 상담 완료 후 작성이므로 검증됨
      isPublic: true,
      helpfulCount: 0,
      reportCount: 0,
      isDeleted: false
    });

    // 전문가 통계 업데이트 (Expert 테이블의 reviewCount와 avgRating 업데이트)
    try {
      const expert = await Expert.findByPk(parseInt(expertId));
      if (expert) {
        // 해당 전문가의 모든 리뷰 조회하여 평균 평점 계산
        const allReviews = await Review.findAll({
          where: { expertId: parseInt(expertId), isDeleted: false }
        });
        
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        
        await expert.update({
          reviewCount: allReviews.length,
          avgRating: Math.round(avgRating * 100) / 100
        });
      }
    } catch (error) {
      console.error('전문가 통계 업데이트 실패:', error);
    }

    // 응답 데이터 변환
    const reviewResponse: ReviewResponse = {
      id: newReview.id.toString(),
      consultationId: newReview.consultationId.toString(),
      userId: newReview.userId.toString(),
      userName: authUser.name || '익명',
      userAvatar: null,
      expertId: newReview.expertId.toString(),
      expertName: '알 수 없음',
      rating: newReview.rating,
      content: newReview.content,
      category: consultation.categoryId?.toString() || '기타',
      date: newReview.createdAt.toISOString(),
      isVerified: newReview.isVerified,
      isPublic: newReview.isPublic
    };

    return NextResponse.json({
      success: true,
      data: reviewResponse,
      message: '리뷰가 성공적으로 작성되었습니다.'
    });
  } catch (error) {
    console.error('리뷰 생성 실패:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 리뷰 수정
export async function PUT(request: NextRequest) {
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
    const { id, rating, content, isPublic } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '리뷰 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const review = await Review.findByPk(parseInt(id));
    if (!review) {
      return NextResponse.json(
        { success: false, message: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인이 작성한 리뷰만 수정 가능)
    if (review.userId !== authUser.id && authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '리뷰 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const oldRating = review.rating;

    // 수정 가능한 필드만 업데이트
    const updateData: any = {};
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, message: '평점은 1-5 사이여야 합니다.' },
          { status: 400 }
        );
      }
      updateData.rating = rating;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    await review.update(updateData);

    // 평점이 변경된 경우 전문가 통계 업데이트
    if (rating !== undefined && rating !== oldRating) {
      try {
        const expert = await Expert.findByPk(review.expertId);
        if (expert) {
          // 해당 전문가의 모든 리뷰 조회하여 평균 평점 재계산
          const allReviews = await Review.findAll({
            where: { expertId: review.expertId, isDeleted: false }
          });
          
          const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
          const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
          
          await expert.update({
            reviewCount: allReviews.length,
            avgRating: Math.round(avgRating * 100) / 100
          });
        }
      } catch (error) {
        console.error('전문가 통계 업데이트 실패:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: review.id.toString(),
        consultationId: review.consultationId.toString(),
        userId: review.userId.toString(),
        expertId: review.expertId.toString(),
        rating: review.rating,
        content: review.content,
        isPublic: review.isPublic,
        date: review.updatedAt.toISOString()
      },
      message: '리뷰가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('리뷰 수정 실패:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 리뷰 삭제
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

    if (!id) {
      return NextResponse.json(
        { success: false, message: '리뷰 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const review = await Review.findByPk(parseInt(id));
    if (!review) {
      return NextResponse.json(
        { success: false, message: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인이 작성한 리뷰만 삭제 가능)
    if (review.userId !== authUser.id && authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '리뷰 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제 (isDeleted = true로 설정)
    await review.update({ isDeleted: true });

    // 전문가 통계 업데이트
    try {
      const expert = await Expert.findByPk(review.expertId);
      if (expert) {
        // 해당 전문가의 모든 리뷰 조회하여 평균 평점 재계산
        const allReviews = await Review.findAll({
          where: { expertId: review.expertId, isDeleted: false }
        });
        
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        
        await expert.update({
          reviewCount: allReviews.length,
          avgRating: Math.round(avgRating * 100) / 100
        });
      }
    } catch (error) {
      console.error('전문가 통계 업데이트 실패:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: review.id.toString(),
        message: '리뷰가 성공적으로 삭제되었습니다.'
      }
    });
  } catch (error) {
    console.error('리뷰 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
