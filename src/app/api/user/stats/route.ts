import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityPost, CommunityComment, CommunityLike } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const profileMode = searchParams.get('profileMode'); // 'expert' 또는 'client'
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // 사용자가 작성한 게시글 수 (프로필 모드에 따라 필터링)
    let postWhereClause: any = {
      userId: userIdNum,
      status: 'published'
    };
    
    if (profileMode === 'expert') {
      // 전문가 모드: 전문가 소개글만 카운트
      postWhereClause.postType = 'expert_intro';
    } else if (profileMode === 'client') {
      // 사용자 모드: 일반글, 상담요청, 상담후기만 카운트
      postWhereClause.postType = ['general', 'consultation_request', 'consultation_review'];
    }
    
    const postCount = await CommunityPost.count({
      where: postWhereClause
    });

    // 사용자가 작성한 댓글 수
    const commentCount = await CommunityComment.count({
      where: {
        userId: userIdNum
      }
    });

    // 사용자가 받은 좋아요 수 (프로필 모드에 따라 필터링)
    const receivedLikes = await CommunityPost.sum('likes', {
      where: postWhereClause
    }) || 0;

    // 디버깅용 로그
    console.log(`사용자 ${userIdNum} (${profileMode} 모드) 통계:`, {
      postWhereClause,
      postCount,
      commentCount,
      receivedLikes
    });

    return NextResponse.json({
      success: true,
      data: {
        postCount,
        commentCount,
        receivedLikes
      }
    });
  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '사용자 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
