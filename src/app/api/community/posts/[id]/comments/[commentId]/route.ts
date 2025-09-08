import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { CommunityComment } from "@/lib/db/models/communityComment.model";
import { CommunityPost } from "@/lib/db/models/communityPost.model";

// 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    await initializeDatabase();
    const commentId = parseInt(params.commentId);
    
    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 댓글 ID입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, userId } = body;

    if (!content || !userId) {
      return NextResponse.json(
        { success: false, message: "댓글 내용과 사용자 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 조회
    const comment = await CommunityComment.findByPk(commentId);
    if (!comment) {
      return NextResponse.json(
        { success: false, message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (comment.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "댓글을 수정할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 수정
    await comment.update({
      content: content,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "댓글이 수정되었습니다.",
      comment: {
        id: comment.id,
        content: comment.content,
        updatedAt: comment.updatedAt
      }
    });

  } catch (error) {
    console.error("댓글 수정 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "댓글 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    await initializeDatabase();
    const commentId = parseInt(params.commentId);
    const postId = parseInt(params.id);
    
    if (isNaN(commentId) || isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "사용자 정보가 필요합니다." },
        { status: 401 }
      );
    }

    // 댓글 조회
    const comment = await CommunityComment.findByPk(commentId);
    if (!comment) {
      return NextResponse.json(
        { success: false, message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (comment.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, message: "댓글을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제 (소프트 삭제)
    await comment.update({ status: 'deleted' });

    // 게시글의 댓글 수 감소
    const post = await CommunityPost.findByPk(postId);
    if (post) {
      await post.decrement('comments');
    }

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다."
    });

  } catch (error) {
    console.error("댓글 삭제 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "댓글 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
