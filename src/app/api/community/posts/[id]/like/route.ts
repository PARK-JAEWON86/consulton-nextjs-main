import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { CommunityPost } from "@/lib/db/models/communityPost.model";
import { CommunityLike } from "@/lib/db/models/communityLike.model";
import { User } from "@/lib/db/models/user.model";

// 좋아요 토글 (추가/제거)
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

    // 요청에서 사용자 ID 가져오기 (실제로는 JWT 토큰에서 추출해야 함)
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "사용자 정보가 필요합니다." },
        { status: 401 }
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

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await CommunityLike.findOne({
      where: {
        postId: postId,
        userId: userId
      }
    } as any);

    if (existingLike) {
      // 좋아요 제거
      await existingLike.destroy();
      
      // 게시글의 좋아요 수 감소
      await post.decrement('likes');
      
      return NextResponse.json({
        success: true,
        message: "좋아요가 취소되었습니다.",
        isLiked: false,
        likeCount: post.likes - 1
      });
    } else {
      // 좋아요 추가
      await CommunityLike.create({
        postId: postId,
        userId: userId
      } as any);
      
      // 게시글의 좋아요 수 증가
      await post.increment('likes');
      
      return NextResponse.json({
        success: true,
        message: "좋아요가 추가되었습니다.",
        isLiked: true,
        likeCount: post.likes + 1
      });
    }

  } catch (error) {
    console.error("좋아요 처리 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "좋아요 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자의 좋아요 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const postId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 게시글 ID입니다." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "사용자 정보가 필요합니다." },
        { status: 401 }
      );
    }

    // 좋아요 상태 확인
    const existingLike = await CommunityLike.findOne({
      where: {
        postId: postId,
        userId: parseInt(userId)
      }
    } as any);

    return NextResponse.json({
      success: true,
      isLiked: !!existingLike
    });

  } catch (error) {
    console.error("좋아요 상태 확인 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "좋아요 상태 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
