import { Star, Quote } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
// import { dummyReviews } from '../../data/dummy/reviews'; // 더미 데이터 제거

// 리뷰 타입 정의
interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string;
  category: string;
  date: string;
}

export default function UserReviewsSection() {
  const [isReversed, setIsReversed] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const animationRef = useRef<HTMLDivElement>(null);
  const animationRef2 = useRef<HTMLDivElement>(null);

  // 리뷰 데이터 로드 함수
  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // API에서 공개된 리뷰 데이터 가져오기
      const response = await fetch('/api/reviews?isPublic=true&limit=12');

      if (!response.ok) {
        throw new Error(`리뷰 API 오류: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.reviews.length > 0) {
        // API에서 가져온 리뷰 데이터 사용
        const loadedReviews = result.data.reviews.map((review: any) => ({
          id: review.id,
          userName: review.userName,
          userAvatar: review.userAvatar || '',
          rating: review.rating,
          content: review.content,
          category: review.category,
          date: review.date
        }));

        setReviews(loadedReviews);
        setRetryCount(0); // 성공 시 재시도 카운터 초기화
      } else {
        // API에 데이터가 없으면 빈 배열 사용
        setReviews([]);
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '리뷰 데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 재시도 함수
  const handleRetry = () => {
    const maxRetries = 3;
    if (retryCount >= maxRetries) {
      setError(`최대 재시도 횟수(${maxRetries})를 초과했습니다.`);
      return;
    }
    setRetryCount(prev => prev + 1);
    loadReviews();
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // 애니메이션 효과
  useEffect(() => {
    // 자동으로 애니메이션 시작
    const timer = setTimeout(() => {
      setIsReversed(true);
    }, 1000);

    // 60초마다 방향 전환 (첫 번째 줄 기준)
    const interval = setInterval(() => {
      setIsReversed(prev => !prev);
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

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

  // 스켈레톤 리뷰 카드 컴포넌트
  const SkeletonReviewCard = () => (
    <div className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm animate-pulse">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-8 ml-2"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/5"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20 ml-auto"></div>
      </div>
    </div>
  );

  // 로딩 중일 때
  if (isLoading) {
    return (
      <section className="py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              사용자들의 생생한 후기
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              실제로 상담을 받은 사용자들의 솔직한 리뷰를 확인해보세요
            </p>
          </div>

          {/* 스켈레톤 UI */}
          <div className="mb-8 overflow-hidden">
            <div className="flex gap-6 w-max mx-auto">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonReviewCard key={index} />
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="flex gap-6 w-max mx-auto">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonReviewCard key={`row2-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 리뷰가 없거나 에러가 있을 때
  if (reviews.length === 0 && !isLoading) {
    return (
      <section className="py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              사용자들의 생생한 후기
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              실제로 상담을 받은 사용자들의 솔직한 리뷰를 확인해보세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error ? (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg mb-4">
                <span className="text-red-700 text-sm mr-3">{error}</span>
                {retryCount < 3 && (
                  <button
                    onClick={handleRetry}
                    className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
            </div>
          )}
        </div>
      </section>
    );
  }

  const topRowReviews = reviews.slice(0, 6);
  const bottomRowReviews = reviews.slice(6, 12);

  return (
    <section className="py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            사용자들의 생생한 후기
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            실제로 상담을 받은 사용자들의 솔직한 리뷰를 확인해보세요
          </p>
        </div>

        {/* 첫 번째 줄 - 무한 스크롤 애니메이션 */}
        <div className="mb-8 overflow-hidden">
          <div 
            ref={animationRef}
            className={`flex gap-6 w-max mx-auto transition-transform duration-[60000ms] ease-linear ${
              isReversed ? 'translate-x-0' : '-translate-x-[50%]'
            }`}
            style={{
              transform: isReversed ? 'translateX(0)' : 'translateX(-50%)'
            }}
          >
            {/* 원본 카드들 */}
            {topRowReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-full">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {review.userName.length > 2 
                          ? review.userName.charAt(0) + '*'.repeat(review.userName.length - 2) + review.userName.charAt(review.userName.length - 1)
                          : review.userName.charAt(0) + '*'
                        }
                      </h4>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {review.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(review.rating)}
                      <span className="text-sm font-semibold text-gray-700 ml-2">{review.rating}.0</span>
                    </div>
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 left-0 text-blue-300 w-5 h-5" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm line-clamp-3 font-medium">
                        {review.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium text-right">
                      {new Date(review.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* 복제된 카드들 - 무한 스크롤을 위해 */}
            {topRowReviews.map((review) => (
              <div
                key={`duplicate-${review.id}`}
                className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-full">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {review.userName.length > 2 
                          ? review.userName.charAt(0) + '*'.repeat(review.userName.length - 2) + review.userName.charAt(review.userName.length - 1)
                          : review.userName.charAt(0) + '*'
                        }
                      </h4>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {review.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(review.rating)}
                      <span className="text-sm font-semibold text-gray-700 ml-2">{review.rating}.0</span>
                    </div>
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 left-0 text-blue-300 w-5 h-5" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm line-clamp-3 font-medium">
                        {review.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium text-right">
                      {new Date(review.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 두 번째 줄 - 무한 스크롤 애니메이션 */}
        <div className="overflow-hidden">
          <div 
            ref={animationRef2}
            className={`flex gap-6 w-max mx-auto transition-transform duration-[50000ms] ease-linear ${
              isReversed ? 'translate-x-0' : '-translate-x-[50%]'
            }`}
            style={{
              transform: isReversed ? 'translateX(0)' : 'translateX(-50%)'
            }}
          >
            {/* 원본 카드들 */}
            {bottomRowReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-full">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {review.userName.length > 2 
                          ? review.userName.charAt(0) + '*'.repeat(review.userName.length - 2) + review.userName.charAt(review.userName.length - 1)
                          : review.userName.charAt(0) + '*'
                        }
                      </h4>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {review.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(review.rating)}
                      <span className="text-sm font-semibold text-gray-700 ml-2">{review.rating}.0</span>
                    </div>
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 left-0 text-emerald-300 w-5 h-5" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm line-clamp-3 font-medium">
                        {review.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium text-right">
                      {new Date(review.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* 복제된 카드들 - 무한 스크롤을 위해 */}
            {bottomRowReviews.map((review) => (
              <div
                key={`duplicate-${review.id}`}
                className="bg-white rounded-2xl p-6 border-0 w-[340px] flex-shrink-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-full">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {review.userName.length > 2 
                          ? review.userName.charAt(0) + '*'.repeat(review.userName.length - 2) + review.userName.charAt(review.userName.length - 1)
                          : review.userName.charAt(0) + '*'
                        }
                      </h4>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {review.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(review.rating)}
                      <span className="text-sm font-semibold text-gray-700 ml-2">{review.rating}.0</span>
                    </div>
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 left-0 text-emerald-300 w-5 h-5" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm line-clamp-3 font-medium">
                        {review.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium text-right">
                      {new Date(review.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
