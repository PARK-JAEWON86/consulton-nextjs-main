import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Category, CommunityPost } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 게시글에서 가장 많이 사용된 태그들을 조회
    const posts = await CommunityPost.findAll({
      where: { 
        status: 'published',
        tags: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['tags'],
      limit: 1000 // 최근 1000개 게시글에서 태그 추출
    });
    
    // 태그 빈도 계산
    const tagCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });
    
    // 빈도순으로 정렬하여 인기 태그 추출
    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
    
    // 기본 태그들 추가 (실제 데이터가 부족할 경우)
    const defaultTags = [
      '상담후기', '전문가추천', '진로고민', '투자조언', 
      '심리상담', '법률상담', '재무상담', '건강상담'
    ];
    
    // 인기 태그와 기본 태그를 합치고 중복 제거
    const allTags = [...new Set([...popularTags, ...defaultTags])].slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: allTags
    });
  } catch (error) {
    console.error('인기 태그 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '인기 태그 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
