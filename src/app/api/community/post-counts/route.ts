import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityPost } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // 각 게시글 타입별 개수 조회
    const counts = await CommunityPost.findAll({
      attributes: [
        'postType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        status: 'published'
      },
      group: ['postType'],
      raw: true
    });

    // 결과를 객체로 변환
    const postCounts: Record<string, number> = {
      all: 0,
      general: 0,
      consultation_request: 0,
      consultation_review: 0,
      expert_intro: 0
    };

    // 전체 개수 계산
    let totalCount = 0;
    counts.forEach((item: any) => {
      const count = parseInt(item.count);
      postCounts[item.postType] = count;
      totalCount += count;
    });
    
    postCounts.all = totalCount;

    return NextResponse.json({
      success: true,
      data: postCounts
    });
  } catch (error) {
    console.error('게시글 개수 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 개수 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
