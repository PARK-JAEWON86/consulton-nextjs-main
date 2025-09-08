import { NextRequest, NextResponse } from 'next/server';
import { Category, Consultation, Review, Expert } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';
import { Op } from 'sequelize';

// 인기 카테고리 통계 인터페이스
interface PopularCategoryStats {
  categoryId: string;
  categoryName: string;
  consultationCount: number;
  reviewCount: number;
  bookingCount: number;
  totalScore: number;
  rank?: number; // 순위는 나중에 추가되므로 optional로 설정
}

// GET: 인기 카테고리 통계 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'totalScore';
    
    // 모든 활성 카테고리 조회
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    
    // 각 카테고리별 통계 계산
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        // 해당 카테고리의 상담 수 조회
        const consultationCount = await Consultation.count({
          where: { categoryId: category.id }
        });
        
        // 해당 카테고리의 리뷰 수 조회 (상담을 통해)
        const reviewCount = await Review.count({
          include: [
            {
              model: Consultation,
              as: 'consultation',
              where: { categoryId: category.id },
              required: true
            }
          ]
        });
        
        // 예약된 상담 수 (scheduled 상태)
        const bookingCount = await Consultation.count({
          where: { 
            categoryId: category.id,
            status: 'scheduled'
          }
        });
        
        // 총 점수 계산 (상담 수 + 리뷰 수 + 예약 수)
        const totalScore = consultationCount + reviewCount + bookingCount;
        
        return {
          categoryId: category.id.toString(),
          categoryName: category.name,
          consultationCount,
          reviewCount,
          bookingCount,
          totalScore
        };
      })
    );
    
    // 정렬 기준에 따라 정렬
    let sortedStats = [...categoryStats];
    switch (sortBy) {
      case 'consultationCount':
        sortedStats.sort((a, b) => b.consultationCount - a.consultationCount);
        break;
      case 'reviewCount':
        sortedStats.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'bookingCount':
        sortedStats.sort((a, b) => b.bookingCount - a.bookingCount);
        break;
      case 'totalScore':
      default:
        sortedStats.sort((a, b) => b.totalScore - a.totalScore);
        break;
    }
    
    // 순위 부여
    sortedStats.forEach((stat, index) => {
      (stat as PopularCategoryStats).rank = index + 1;
    });
    
    // limit만큼 반환
    const limitedStats = sortedStats.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: limitedStats,
      total: limitedStats.length,
      sortBy,
      limit
    });
  } catch (error) {
    console.error('인기 카테고리 통계 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '인기 카테고리 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 인기 카테고리 통계 업데이트
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { action, stats } = body;
    
    if (action === 'updateStats') {
      // 특정 카테고리의 통계 업데이트 (실제로는 상담/리뷰 생성 시 자동으로 업데이트됨)
      const { categoryId } = stats;
      
      const category = await Category.findByPk(parseInt(categoryId));
      if (!category) {
        return NextResponse.json(
          { success: false, message: '존재하지 않는 카테고리입니다.' },
          { status: 404 }
        );
      }
      
      // 카테고리 통계 재계산
      const consultationCount = await Consultation.count({
        where: { categoryId: category.id }
      });
      
      const reviewCount = await Review.count({
        include: [
          {
            model: Consultation,
            as: 'consultation',
            where: { categoryId: category.id },
            required: true
          }
        ]
      });
      
      const bookingCount = await Consultation.count({
        where: { 
          categoryId: category.id,
          status: 'scheduled'
        }
      });
      
      const totalScore = consultationCount + reviewCount + bookingCount;
      
      // 카테고리 테이블의 통계 필드 업데이트
      await category.update({
        consultationCount,
        expertCount: await Expert.count({
          where: { specialty: category.name }
        })
      });
      
      return NextResponse.json({
        success: true,
        message: '카테고리 통계가 성공적으로 업데이트되었습니다.',
        data: {
          categoryId: category.id.toString(),
          categoryName: category.name,
          consultationCount,
          reviewCount,
          bookingCount,
          totalScore
        }
      });
      
    } else if (action === 'recalculateAll') {
      // 모든 카테고리의 통계를 재계산
      const categories = await Category.findAll({
        where: { isActive: true }
      });
      
      const updatedStats = await Promise.all(
        categories.map(async (category) => {
          const consultationCount = await Consultation.count({
            where: { categoryId: category.id }
          });
          
          const reviewCount = await Review.count({
            include: [
              {
                model: Consultation,
                as: 'consultation',
                where: { categoryId: category.id },
                required: true
              }
            ]
          });
          
          const bookingCount = await Consultation.count({
            where: { 
              categoryId: category.id,
              status: 'scheduled'
            }
          });
          
          const expertCount = await Expert.count({
            where: { specialty: category.name }
          });
          
          // 카테고리 테이블 업데이트
          await category.update({
            consultationCount,
            expertCount
          });
          
          return {
            categoryId: category.id.toString(),
            categoryName: category.name,
            consultationCount,
            reviewCount,
            bookingCount,
            totalScore: consultationCount + reviewCount + bookingCount
          };
        })
      );
      
      // 총 점수로 정렬
      updatedStats.sort((a, b) => b.totalScore - a.totalScore);
      updatedStats.forEach((stat, index) => {
        (stat as PopularCategoryStats).rank = index + 1;
      });
      
      return NextResponse.json({
        success: true,
        message: '모든 카테고리 통계가 재계산되었습니다.',
        data: updatedStats
      });
    } else {
      return NextResponse.json(
        { success: false, message: '잘못된 액션입니다.' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('인기 카테고리 통계 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, message: '인기 카테고리 통계 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
