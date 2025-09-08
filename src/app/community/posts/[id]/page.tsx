"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, Clock, UserCheck, Bot, Sparkles, HelpCircle, Star, Award, MessageSquare, AlertCircle, Edit, Trash2 } from "lucide-react";
import { maskPostAuthor, ProfileVisibility } from "@/utils/nameMasking";

// 상세 페이지용 날짜 포맷팅 함수
const formatDetailDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 오늘인 경우
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 0 ? '방금 전' : `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  }
  
  // 어제인 경우
  if (diffDays === 1) {
    return '어제';
  }
  
  // 7일 이내인 경우
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  
  // 1년 이내인 경우
  if (diffDays < 365) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  }
  
  // 1년 이상인 경우
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

interface Post {
  id: string;
  author: {
    id: number;
    name: string;
    avatar: string | null;
  };
  authorAvatar: string | null;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  postType: "consultation_request" | "consultation_review" | "expert_intro" | "general";
  isExpert?: boolean;
  isAISummary?: boolean;
  urgency?: string;
  preferredMethod?: string;
  likes: number;
  comments: number;
  views: number;
  profileVisibility?: ProfileVisibility;
  // 상담후기 관련 추가 필드
  consultationTopic?: string;
  rating?: number;
  expertName?: string;
  isVerified?: boolean;
  hasExpertReply?: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 댓글 삭제 모달 상태
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  
  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: [] as string[],
    postType: 'general' as string
  });

  // 수정 모달 열기
  const handleEdit = () => {
    if (!post) return;
    
    setEditForm({
      title: post.title,
      content: post.content,
      categoryId: (post as any).categoryId?.toString() || '',
      tags: post.tags || [],
      postType: post.postType
    });
    setShowEditModal(true);
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditForm({
      title: '',
      content: '',
      categoryId: '',
      tags: [],
      postType: 'general'
    });
  };

  // 게시글 수정 제출
  const handleUpdatePost = async () => {
    if (!user || !post) return;

    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/community/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : (post as any).categoryId,
          tags: editForm.tags,
          postType: editForm.postType,
          userId: user.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 게시글 정보 업데이트
        setPost({
          ...post,
          title: data.data.title,
          content: data.data.content,
          categoryId: (data.data as any).categoryId,
          tags: data.data.tags,
          postType: data.data.postType,
          updatedAt: data.data.updatedAt
        } as any);
        
        setShowEditModal(false);
        alert('게시글이 수정되었습니다.');
      } else {
        alert(data.message || '게시글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 수정 중 오류:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 삭제 모달 열기
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // 삭제 모달 닫기
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // 게시글 삭제 확인
  const handleConfirmDelete = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/community/posts/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        alert('게시글이 삭제되었습니다.');
        router.push('/community');
      } else {
        const result = await response.json();
        alert(result.message || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // 사용자 정보가 변경될 때 본인 글인지 다시 체크
  useEffect(() => {
    if (post && user) {
      const isOwnerCheck = post.author.id === user.id;
      setIsOwner(isOwnerCheck);
    } else {
      setIsOwner(false);
    }
  }, [post, user]);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        
        // 중복 조회 방지: 세션 스토리지에서 조회 기록 확인
        const viewHistory = sessionStorage.getItem('postViewHistory') || '';
        const hasViewed = viewHistory.includes(`post_${params.id}`);
        
        // 이미 조회한 게시글이면 조회수 증가 없이 조회
        const response = await fetch(`/api/community/posts/${params.id}?skipView=${hasViewed}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPost(result.data);
            setLikeCount(result.data.likes);
            
            // 조회 기록 저장 (세션 스토리지 사용)
            if (!hasViewed) {
              const newViewHistory = viewHistory ? `${viewHistory},post_${params.id}` : `post_${params.id}`;
              sessionStorage.setItem('postViewHistory', newViewHistory);
            }
          } else {
            setError(result.message || '게시글을 불러올 수 없습니다.');
          }
        } else {
          setError('게시글을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('게시글 로드 실패:', error);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  // 좋아요 상태와 댓글 로드
  useEffect(() => {
    const loadLikeAndComments = async () => {
      if (!params.id || !user) return;

      try {
        // 좋아요 상태 확인
        const likeResponse = await fetch(`/api/community/posts/${params.id}/like?userId=${user.id}`);
        const likeData = await likeResponse.json();
        if (likeData.success) {
          setIsLiked(likeData.isLiked);
        }

        // 댓글 로드
        const commentsResponse = await fetch(`/api/community/posts/${params.id}/comments`);
        const commentsData = await commentsResponse.json();
        console.log('댓글 API 응답:', commentsData);
        if (commentsData.success) {
          setComments(commentsData.comments);
        } else {
          console.error('댓글 로드 실패:', commentsData.message);
        }
      } catch (error) {
        console.error('좋아요/댓글 로드 중 오류:', error);
      }
    };

    loadLikeAndComments();
  }, [params.id, user]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "높음":
        return "text-red-600 bg-red-50 border-red-200";
      case "보통":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "낮음":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPostTypeInfo = (postType: string, isAISummary?: boolean) => {
    switch (postType) {
      case "consultation_request":
        if (isAISummary) {
          return {
            label: "AI 상담요약",
            icon: Bot,
            bgColor: "bg-purple-100",
            textColor: "text-purple-700",
            borderColor: "border-purple-200",
            cardBg: "bg-gradient-to-r from-purple-50/50 to-orange-50/50"
          };
        }
        return {
          label: "상담요청",
          icon: HelpCircle,
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
          cardBg: "bg-orange-50/30"
        };
      case "consultation_review":
        return {
          label: "상담후기",
          icon: Star,
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-200",
          cardBg: "bg-green-50/30"
        };
      case "expert_intro":
        return {
          label: "전문가소개",
          icon: Award,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          cardBg: "bg-blue-50/30"
        };
      default:
        return {
          label: "일반글",
          icon: MessageSquare,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          cardBg: "bg-white"
        };
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      } else {
        alert(data.message || '좋아요 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 댓글 작성 핸들러
  const handleSubmitComment = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/community/posts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          userId: user.id,
          isAnonymous: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        // 게시글의 댓글 수도 업데이트
        if (post) {
          setPost({ ...post, comments: post.comments + 1 });
        }
      } else {
        alert(data.message || '댓글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 삭제 모달 열기
  const handleDeleteComment = (commentId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    setCommentToDelete(commentId);
    setShowCommentDeleteModal(true);
  };

  // 댓글 삭제 모달 닫기
  const handleCloseCommentDeleteModal = () => {
    setShowCommentDeleteModal(false);
    setCommentToDelete(null);
  };

  // 댓글 삭제 확인
  const handleConfirmCommentDelete = async () => {
    if (!user || !commentToDelete) return;

    setIsDeletingComment(true);

    try {
      const response = await fetch(`/api/community/posts/${params.id}/comments/${commentToDelete}?userId=${user.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(comments.filter(comment => comment.id !== commentToDelete));
        // 게시글의 댓글 수도 업데이트
        if (post) {
          setPost({ ...post, comments: post.comments - 1 });
        }
        setShowCommentDeleteModal(false);
        setCommentToDelete(null);
      } else {
        alert(data.message || '댓글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleShare = () => {
    // 공유 로직 구현
    console.log('공유 클릭');
  };

  // 전문가 프로필 보기 핸들러
  const handleViewExpertProfile = (expertId: number) => {
    // 전문가 프로필 페이지로 이동
    router.push(`/experts/${expertId}`);
  };

  // 상담예약하기 핸들러
  const handleBookConsultation = (expertId: number) => {
    // 상담예약 페이지로 이동 (전문가 ID와 함께)
    router.push(`/expert-consultation?expertId=${expertId}`);
  };

  // 댓글 섹션으로 스크롤하는 핸들러
  const handleComment = () => {
    const commentSection = document.getElementById('comment-section');
    if (commentSection) {
      commentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">게시글을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const postTypeInfo = getPostTypeInfo(post.postType, post.isAISummary);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>목록으로 돌아가기</span>
        </button>

        {/* 게시글 상세 */}
        <div className={`bg-white rounded-lg shadow-sm border p-8 ${postTypeInfo.borderColor} ${postTypeInfo.cardBg}`}>
          {/* 헤더 */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              post.isAISummary
                ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                : post.postType === "expert_intro"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                : "bg-blue-600"
            }`}>
              {post.isAISummary ? (
                <Bot className="h-6 w-6 text-white" />
              ) : (
                <span className="text-white text-lg font-medium">
                  {post.authorAvatar || post.author.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-lg">
                    {maskPostAuthor(
                      post.author.name, 
                      post.profileVisibility || "experts",
                      false // TODO: 현재 사용자가 전문가인지 확인하는 로직 필요
                    )}
                  </span>
                  {post.isExpert && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      전문가
                    </span>
                  )}
                  
                  {/* 게시글 타입 배지 */}
                <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${postTypeInfo.bgColor} ${postTypeInfo.textColor}`}>
                  <postTypeInfo.icon className="h-4 w-4" />
                  {postTypeInfo.label}
                </span>
                
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{formatDetailDate(post.createdAt)}</span>
                <span className={`px-2 py-1 text-sm rounded-full ml-2 ${postTypeInfo.bgColor} ${postTypeInfo.textColor}`}>
                  {post.category}
                </span>
                {post.postType === "consultation_request" && post.urgency && (
                  <span
                    className={`px-2 py-1 text-sm rounded-full border ${getUrgencyColor(
                      post.urgency,
                    )}`}
                  >
                    {post.urgency}
                  </span>
                )}
                </div>
                
                {/* 본인 글인 경우 수정/삭제 버튼 */}
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* 게시글 타입별 전용 정보 */}
          {post.postType === "consultation_request" && (
            <div className={`${postTypeInfo.cardBg} border ${postTypeInfo.borderColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-6 text-sm">
                {post.preferredMethod && (
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${postTypeInfo.textColor.replace('text-', 'text-').replace('-700', '-600')}`} />
                    <span className={postTypeInfo.textColor}>
                      선호 방법: {post.preferredMethod}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <HelpCircle className={`h-4 w-4 ${postTypeInfo.textColor.replace('text-', 'text-').replace('-700', '-600')}`} />
                  <span className={postTypeInfo.textColor}>전문가 상담 요청</span>
                </div>
              </div>
            </div>
          )}

          {post.isAISummary && (
            <div className={`${postTypeInfo.cardBg} border ${postTypeInfo.borderColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-700">AI 채팅상담으로 생성된 요약</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-700">자동 익명화 처리</span>
                </div>
              </div>
            </div>
          )}

          {post.postType === "expert_intro" && (
            <div className={`${postTypeInfo.cardBg} border ${postTypeInfo.borderColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700">전문가 프로필</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700">인증된 전문가</span>
                </div>
              </div>
            </div>
          )}

          {post.postType === "consultation_review" && (
            <div className={`${postTypeInfo.cardBg} border ${postTypeInfo.borderColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-6 text-sm">
                {post.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600 fill-current" />
                    <span className="text-green-700 font-medium">{post.rating}.0점</span>
                  </div>
                )}
                {post.expertName && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">전문가: {post.expertName}</span>
                  </div>
                )}
                {post.isVerified && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">검증된 리뷰</span>
                  </div>
                )}
                {post.hasExpertReply && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-700">전문가 답글</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 내용 */}
          <div className="prose max-w-none mb-6">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>
              <button
                onClick={handleComment}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{post.comments}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="font-medium">공유</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>조회 {post.views}</span>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div id="comment-section" className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">댓글 {comments.length}</h3>
          
          {/* 댓글 작성 폼 */}
          {user ? (
            <div className="mb-6">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 작성해주세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm h-[64px]"
                >
                  {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {comment.author.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {comment.author.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{comment.author.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatDetailDate(comment.createdAt)}
                      </span>
                      {comment.author.role === 'expert' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          전문가
                        </span>
                      )}
                      {comment.expertInfo && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {comment.expertInfo.specialty}
                        </span>
                      )}
                      {comment.expertInfo && comment.expertInfo.experience && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {comment.expertInfo.experience}년 경력
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* 전문가 댓글 액션 버튼들 */}
                    {comment.author.role === 'expert' && post?.postType === 'consultation_request' && (
                      <>
                        <button
                          onClick={() => handleViewExpertProfile(comment.author.id)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          프로필 보기
                        </button>
                        <button
                          onClick={() => handleBookConsultation(comment.author.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          상담예약하기
                        </button>
                      </>
                    )}
                    {user && user.id === comment.author.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="댓글 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">게시글 수정</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="제목을 입력하세요"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="내용을 입력하세요"
                  />
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags.join(', ')}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="태그1, 태그2, 태그3"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isUpdating}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={isUpdating || !editForm.title.trim() || !editForm.content.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? '수정 중...' : '수정하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">게시글 삭제</h3>
                  <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 삭제 확인 모달 */}
      {showCommentDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">댓글 삭제</h3>
                  <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                정말로 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCloseCommentDeleteModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isDeletingComment}
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmCommentDelete}
                  disabled={isDeletingComment}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeletingComment ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
