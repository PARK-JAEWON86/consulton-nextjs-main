import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { User, CommunityPost, CommunityComment, Review } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 전체 게시글 수
    const totalPosts = await CommunityPost.count({
      where: { status: 'published' }
    });
    
    // 활성 사용자 수 (최근 30일 내 활동한 사용자)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.count({
      where: {
        updatedAt: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    // 오늘 새글 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayPosts = await CommunityPost.count({
      where: {
        status: 'published',
        createdAt: {
          [require('sequelize').Op.between]: [today, tomorrow]
        }
      }
    });
    
    // 리뷰 수 (상담 후기)
    const totalReviews = await Review.count();
    
    return NextResponse.json({
      success: true,
      data: {
        totalPosts,
        activeUsers,
        todayPosts,
        totalReviews
      }
    });
  } catch (error) {
    console.error('커뮤니티 통계 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '커뮤니티 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
