import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityPost, User, Expert, Category } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const postId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const skipView = searchParams.get('skipView') === 'true';
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    // 게시글 조회
    const post = await CommunityPost.findByPk(postId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profileImage', 'role']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시글 상태 확인
    if (post.status !== 'published') {
      return NextResponse.json(
        { success: false, message: '접근할 수 없는 게시글입니다.' },
        { status: 403 }
      );
    }

    // 조회수 증가 (중복 조회가 아닌 경우에만)
    if (!skipView) {
      await post.increment('views');
    }

    // 게시글 데이터 변환 (include로 가져온 데이터는 any 타입으로 처리)
    const postData = post as any;
    const formattedPost = {
      id: post.id.toString(),
      title: post.title,
      content: post.content,
      category: postData.category?.name || '기타',
      categoryId: post.categoryId?.toString() || '1',
      postType: post.postType,
      author: {
        id: post.userId || 0,
        name: post.isAnonymous ? '익명' : (postData.user?.name || '사용자'),
        avatar: post.isAnonymous ? null : (postData.user?.profileImage || null)
      },
      authorAvatar: post.isAnonymous ? null : (postData.user?.profileImage || null),
      expert: null,
      likes: post.likes,
      comments: post.comments,
      views: skipView ? post.views : post.views + 1, // 조회수 증가 여부에 따라 표시
      tags: post.tags || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      status: post.status,
      isPinned: post.isPinned,
      isAnonymous: post.isAnonymous,
      consultation: null,
      // 추가 필드들
      isExpert: postData.user?.role === 'expert',
      profileVisibility: 'experts' as const,
      urgency: post.postType === 'consultation_request' ? '보통' : undefined,
      preferredMethod: post.postType === 'consultation_request' ? '화상상담' : undefined,
      consultationTopic: post.postType === 'consultation_review' ? '심리상담' : undefined,
      rating: post.postType === 'consultation_review' ? 4.5 : undefined,
      expertName: post.postType === 'consultation_review' ? '김민지' : undefined,
      isVerified: post.postType === 'consultation_review' ? true : undefined,
      hasExpertReply: post.postType === 'consultation_review' ? true : undefined
    };

    return NextResponse.json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      content, 
      categoryId, 
      tags, 
      postType,
      userId 
    } = body;

    if (!title || !content || !userId) {
      return NextResponse.json(
        { success: false, message: '제목, 내용, 사용자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 게시글 조회
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (post.userId !== userId) {
      return NextResponse.json(
        { success: false, message: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 수정
    await post.update({
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId || post.categoryId,
      tags: tags ? tags.join(',') : post.tags,
      postType: postType || post.postType,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: '게시글이 수정되었습니다.',
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        categoryId: post.categoryId,
        tags: post.tags,
        postType: post.postType,
        updatedAt: post.updatedAt
      }
    });

  } catch (error) {
    console.error('게시글 수정 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      content, 
      categoryId, 
      tags, 
      postType,
      userId,
      isAnonymous,
      isPinned
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 게시글 조회
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (post.userId !== userId) {
      return NextResponse.json(
        { success: false, message: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 부분 수정을 위한 데이터 준비 (undefined인 필드는 제외)
    const updateData: any = {
      updatedAt: new Date()
    };

    // 각 필드가 존재하고 유효한 경우에만 업데이트
    if (title !== undefined && title.trim()) {
      updateData.title = title.trim();
    }

    if (content !== undefined && content.trim()) {
      updateData.content = content.trim();
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.join(',') : tags;
    }

    if (postType !== undefined) {
      updateData.postType = postType;
    }

    if (isAnonymous !== undefined) {
      updateData.isAnonymous = isAnonymous;
    }

    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    // 게시글 부분 수정
    await post.update(updateData);

    return NextResponse.json({
      success: true,
      message: '게시글이 부분 수정되었습니다.',
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        categoryId: post.categoryId,
        tags: post.tags,
        postType: post.postType,
        isAnonymous: post.isAnonymous,
        isPinned: post.isPinned,
        updatedAt: post.updatedAt
      }
    });

  } catch (error) {
    console.error('게시글 부분 수정 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 부분 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    // 게시글 조회
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시글 삭제 (실제로는 상태를 'deleted'로 변경)
    await post.update({ status: 'deleted' });

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
