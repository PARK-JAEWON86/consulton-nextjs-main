import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityComment, CommunityPost, User } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자가 작성한 댓글 조회
    const comments = await CommunityComment.findAll({
      where: {
        userId: parseInt(userId)
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
          model: CommunityPost,
          as: 'post',
          attributes: ['id', 'title', 'postType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 댓글 데이터 변환
    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.userId,
        name: comment.user?.name || '익명',
        avatar: comment.user?.profileImage || null
      },
      postId: comment.postId,
      postTitle: comment.post?.title || '삭제된 게시글',
      postType: comment.post?.postType || 'general'
    }));

    return NextResponse.json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('댓글 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '댓글 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
