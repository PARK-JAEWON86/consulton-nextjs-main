import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { CommunityPost, User, Expert, Category, Consultation } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const postType = searchParams.get('postType');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const profileMode = searchParams.get('profileMode'); // 'expert' 또는 'client'
    
    // 커뮤니티 게시글 조회
    const whereClause: any = {
      status: 'published'
    };
    
    if (category && category !== 'all') {
      whereClause.categoryId = parseInt(category);
    }
    
    if (postType && postType !== 'all') {
      whereClause.postType = postType;
    }
    
    if (userId) {
      whereClause.userId = parseInt(userId);
      
      // 프로필 모드에 따라 게시글 타입 필터링
      if (profileMode === 'expert') {
        // 전문가 모드: 전문가 소개글만 표시
        whereClause.postType = 'expert_intro';
      } else if (profileMode === 'client') {
        // 사용자 모드: 일반글, 상담요청, 상담후기만 표시 (전문가 소개글 제외)
        whereClause.postType = ['general', 'consultation_request', 'consultation_review'];
      }
    }
    
    // 정렬 옵션
    let orderClause: any[] = [];
    switch (sortBy) {
      case 'latest':
        orderClause = [['createdAt', 'DESC']];
        break;
      case 'popular':
        orderClause = [['likes', 'DESC'], ['views', 'DESC']];
        break;
      case 'comments':
        orderClause = [['comments', 'DESC'], ['createdAt', 'DESC']];
        break;
      case 'views':
        orderClause = [['views', 'DESC'], ['createdAt', 'DESC']];
        break;
      default:
        orderClause = [['createdAt', 'DESC']];
    }
    
    const posts = await CommunityPost.findAll({
      where: whereClause,
      order: orderClause,
      limit: limit,
      offset: (page - 1) * limit,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    // 커뮤니티 게시글 데이터 변환
    const formattedPosts = posts.map((post: any) => ({
      id: post.id.toString(),
      title: post.title,
      content: post.content,
      category: post.category?.name || '기타',
      categoryId: post.categoryId?.toString() || '1',
      postType: post.postType,
      author: {
        id: post.userId || 0,
        name: post.isAnonymous ? '익명' : (post.user?.name || '사용자'),
        avatar: post.isAnonymous ? null : null
      },
      expert: null,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      tags: post.tags || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      status: post.status,
      isPinned: post.isPinned,
      isAnonymous: post.isAnonymous,
      consultation: null
    }));
    
    // 전체 게시글 수
    const totalCount = await CommunityPost.count({ where: whereClause });
    
    return NextResponse.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('커뮤니티 게시글 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '커뮤니티 게시글 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 작성 API
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { title, content, categoryId, postType, tags, isAnonymous = false } = await request.json();

    // 입력 검증
    if (!title || !content || !postType) {
      return NextResponse.json(
        { error: '제목, 내용, 게시글 타입을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 게시글 타입 검증
    const validPostTypes = ['general', 'consultation_request', 'consultation_review', 'expert_intro'];
    if (!validPostTypes.includes(postType)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 타입입니다.' },
        { status: 400 }
      );
    }

    // 임시로 userId = 2 (김민지) 사용 (실제로는 인증된 사용자 ID 사용)
    const userId = 2;

    // 새 게시글 생성
    const newPost = await CommunityPost.create({
      userId: userId,
      categoryId: categoryId || 1, // 기본 카테고리
      title: title.trim(),
      content: content.trim(),
      postType: postType,
      status: 'published',
      isPinned: false,
      isAnonymous: isAnonymous,
      views: 0,
      likes: 0,
      comments: 0,
      tags: tags || [],
      publishedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 작성되었습니다.',
      data: {
        id: newPost.id,
        title: newPost.title,
        postType: newPost.postType
      }
    });

  } catch (error) {
    console.error('커뮤니티 게시글 작성 실패:', error);
    return NextResponse.json(
      { success: false, message: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

