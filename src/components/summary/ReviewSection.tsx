import { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Review {
  id: string;
  consultationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  expertId: string;
  expertName: string;
  rating: number;
  content: string;
  category: string;
  date: string;
  isVerified: boolean;
  isPublic: boolean;
}

interface ReviewSectionProps {
  consultationId: string;
  expertId: string;
  expertName: string;
  category: string;
  currentUserId: string;
  currentUserName: string;
  onReviewSuccess?: () => void;
}

export default function ReviewSection({
  consultationId,
  expertId,
  expertName,
  category,
  currentUserId,
  currentUserName,
  onReviewSuccess
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // 리뷰 로드
  useEffect(() => {
    loadReviews();
  }, [consultationId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?consultationId=${consultationId}&isPublic=true`);
      const result = await response.json();
      
      if (result.success) {
        setReviews(result.data.reviews);
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자가 작성한 리뷰 찾기
  const currentUserReview = reviews.find(review => review.userId === currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingReview ? 'PUT' : 'POST';
      const url = editingReview ? '/api/reviews' : '/api/reviews';
      const body = editingReview 
        ? { id: editingReview.id, rating: formData.rating, content: formData.content }
        : {
            consultationId,
            userId: currentUserId,
            userName: currentUserName,
            expertId,
            expertName,
            rating: formData.rating,
            content: formData.content,
            category
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.success) {
        setShowReviewForm(false);
        setEditingReview(null);
        setFormData({ rating: 5, content: '' });
        await loadReviews();
        
        if (editingReview) {
          alert('리뷰가 수정되었습니다.');
        } else {
          alert('리뷰가 성공적으로 작성되었습니다!');
          // 리뷰 작성 성공 시 콜백 함수 호출
          if (onReviewSuccess) {
            onReviewSuccess();
          }
        }
      } else {
        alert(result.message || '리뷰 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 제출 실패:', error);
      alert('리뷰 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({ rating: review.rating, content: review.content });
    setShowReviewForm(true);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        await loadReviews();
        alert('리뷰가 삭제되었습니다.');
      } else {
        alert(result.message || '리뷰 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">상담 후기</h2>
          <span className="text-sm text-gray-500">({reviews.length}개)</span>
        </div>
        
        {!currentUserReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            리뷰 작성하기
          </button>
        )}
      </div>

      {/* 리뷰 작성/수정 폼 */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-gray-900 mb-4">
            {editingReview ? '리뷰 수정' : '새 리뷰 작성'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평점
              </label>
              <div className="flex items-center space-x-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: i + 1 }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">{formData.rating}점</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 내용
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="상담에 대한 솔직한 후기를 남겨주세요..."
                required
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '처리중...' : (editingReview ? '수정하기' : '작성하기')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                  setFormData({ rating: 5, content: '' });
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
            
            {/* 리뷰 작성 안내 메시지 */}
            {!editingReview && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">i</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">💡 정성스럽게 작성한 후기는 다음과 같이 활용됩니다:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>커뮤니티 공유</strong>: 다른 사용자들과 경험을 나누어 도움을 줄 수 있어요</li>
                      <li>• <strong>전문가 피드백</strong>: 작성해주신 후기가 전문가에게 전달되어 서비스 개선에 반영돼요</li>
                      <li>• <strong>랜딩페이지 표시</strong>: 신뢰할 수 있는 후기로 서비스의 품질을 보여줘요</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">리뷰를 불러오는 중...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>아직 리뷰가 없습니다.</p>
          <p className="text-sm">첫 번째 리뷰를 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {review.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {review.userName.length > 2 
                          ? review.userName.charAt(0) + '*'.repeat(review.userName.length - 2) + review.userName.charAt(review.userName.length - 1)
                          : review.userName.charAt(0) + '*'
                        }
                      </span>
                      {review.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">{review.rating}.0</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{formatDate(review.date)}</span>
                    </div>
                  </div>
                </div>
                
                {/* 현재 사용자의 리뷰인 경우 수정/삭제 버튼 표시 */}
                {review.userId === currentUserId && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-gray-700 leading-relaxed">
                {review.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
