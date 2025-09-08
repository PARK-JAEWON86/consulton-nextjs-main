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
  const animationRef = useRef<HTMLDivElement>(null);
  const animationRef2 = useRef<HTMLDivElement>(null);

  // 리뷰 데이터 로드
  useEffect(() => {
    const loadReviews = async () => {
      try {
        // API에서 공개된 리뷰 데이터 가져오기
        const response = await fetch('/api/reviews?isPublic=true&limit=12');
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
        } else {
          // API에 데이터가 없으면 빈 배열 사용
          setReviews([]);
        }
      } catch (error) {
        console.error('리뷰 로드 실패:', error);
        // 에러 발생 시 빈 배열 사용
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

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
          <div className="text-center text-gray-500">
            리뷰를 불러오는 중입니다...
          </div>
        </div>
      </section>
    );
  }

  // 리뷰가 없을 때
  if (reviews.length === 0) {
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
          <div className="text-center text-gray-500">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
          </div>
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
