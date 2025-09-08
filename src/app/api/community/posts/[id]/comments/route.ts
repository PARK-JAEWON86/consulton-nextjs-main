import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { CommunityPost } from "@/lib/db/models/communityPost.model";
import { CommunityComment } from "@/lib/db/models/communityComment.model";
import { User } from "@/lib/db/models/user.model";

// 댓글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 조회 (사용자 정보 포함)
    const comments = await CommunityComment.findAll({
      where: {
        postId: postId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profileImage', 'role']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    console.log(`게시글 ${postId}의 댓글 조회 결과:`, comments.length, '개');
    console.log('댓글 데이터:', comments.map(c => ({ id: c.id, content: c.content, status: c.status })));

    // 댓글 포맷팅
    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.userId,
        name: comment.isAnonymous ? '익명' : comment.user?.name || '사용자',
        avatar: comment.isAnonymous ? null : comment.user?.profileImage || null,
        role: comment.user?.role || 'user'
      },
      isAnonymous: comment.isAnonymous,
      expertInfo: comment.user?.role === 'expert' ? {
        specialty: comment.expertSpecialty,
        level: comment.expertLevel,
        experience: comment.expertExperience
      } : null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    console.log('포맷팅된 댓글:', formattedComments);

    return NextResponse.json({
      success: true,
      comments: formattedComments
    });

  } catch (error) {
    console.error("댓글 조회 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "댓글 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 게시글 ID입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, userId, isAnonymous = false, expertSpecialty, expertLevel, expertExperience } = body;

    if (!content || !userId) {
      return NextResponse.json(
        { success: false, message: "댓글 내용과 사용자 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 정보 조회 (전문가 여부 확인)
    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 생성 데이터 준비
    const commentData: any = {
      postId: postId,
      userId: userId,
      content: content,
      isAnonymous: isAnonymous,
      status: 'active'
    };

    // 전문가인 경우 전문가 정보 추가
    if (user.role === 'expert') {
      commentData.expertSpecialty = expertSpecialty;
      commentData.expertLevel = expertLevel;
      commentData.expertExperience = expertExperience;
    }

    const comment = await CommunityComment.create(commentData);

    // 게시글의 댓글 수 증가
    await post.increment('comments');

    return NextResponse.json({
      success: true,
      message: "댓글이 작성되었습니다.",
      comment: {
        id: comment.id,
        content: comment.content,
        author: {
          id: userId,
          name: isAnonymous ? '익명' : user?.name || '사용자',
          avatar: isAnonymous ? null : user?.profileImage || null,
          role: user?.role || 'user'
        },
        isAnonymous: isAnonymous,
        createdAt: comment.createdAt
      }
    });

  } catch (error) {
    console.error("댓글 작성 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "댓글 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
