import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityLike, CommunityPost, CommunityComment } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const whereClause: any = { userId: parseInt(userId) };
    
    if (targetType) {
      whereClause.targetType = targetType;
    }
    
    if (targetId) {
      whereClause.targetId = parseInt(targetId);
    }
    
    const likes = await CommunityLike.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    return NextResponse.json({
      success: true,
      data: likes
    });
  } catch (error) {
    console.error('좋아요 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '좋아요 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { userId, targetType, targetId } = body;
    
    if (!userId || !targetType || !targetId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    // 중복 좋아요 확인
    const existingLike = await CommunityLike.findOne({
      where: {
        userId: parseInt(userId),
        targetType,
        targetId: parseInt(targetId)
      }
    });
    
    if (existingLike) {
      return NextResponse.json(
        { success: false, message: '이미 좋아요를 누른 상태입니다.' },
        { status: 409 }
      );
    }
    
    // 대상 존재 여부 확인
    if (targetType === 'post') {
      const post = await CommunityPost.findByPk(parseInt(targetId));
      if (!post) {
        return NextResponse.json(
          { success: false, message: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else if (targetType === 'comment') {
      const comment = await CommunityComment.findByPk(parseInt(targetId));
      if (!comment) {
        return NextResponse.json(
          { success: false, message: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }
    
    // 좋아요 생성
    const like = await CommunityLike.create({
      userId: parseInt(userId),
      targetType,
      targetId: parseInt(targetId)
    });
    
    // 대상의 좋아요 수 증가
    if (targetType === 'post') {
      await CommunityPost.increment('likes', {
        where: { id: parseInt(targetId) }
      });
    } else if (targetType === 'comment') {
      await CommunityComment.increment('likes', {
        where: { id: parseInt(targetId) }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: like,
      message: '좋아요가 추가되었습니다.'
    });
  } catch (error) {
    console.error('좋아요 생성 실패:', error);
    return NextResponse.json(
      { success: false, message: '좋아요 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    
    if (!userId || !targetType || !targetId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    // 좋아요 찾기
    const like = await CommunityLike.findOne({
      where: {
        userId: parseInt(userId),
        targetType,
        targetId: parseInt(targetId)
      }
    });
    
    if (!like) {
      return NextResponse.json(
        { success: false, message: '좋아요를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 좋아요 삭제
    await like.destroy();
    
    // 대상의 좋아요 수 감소
    if (targetType === 'post') {
      await CommunityPost.decrement('likes', {
        where: { id: parseInt(targetId) }
      });
    } else if (targetType === 'comment') {
      await CommunityComment.decrement('likes', {
        where: { id: parseInt(targetId) }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '좋아요가 취소되었습니다.'
    });
  } catch (error) {
    console.error('좋아요 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '좋아요 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
