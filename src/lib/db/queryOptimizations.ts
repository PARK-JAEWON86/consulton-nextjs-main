/**
 * 데이터베이스 쿼리 최적화 유틸리티
 * 자주 사용되는 쿼리 패턴을 최적화하고 재사용 가능한 함수들을 제공합니다.
 */

import { Op } from 'sequelize';
import { 
  User, 
  Expert, 
  ExpertProfile, 
  Consultation, 
  Review, 
  ConsultationSummary,
  Category,
  Payment,
  Notification
} from './models';
import { measureQuery } from './performanceMonitor';

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * 정렬 옵션
 */
export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * 기본 페이지네이션 설정
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100
};

/**
 * 페이지네이션 계산
 */
export function calculatePagination(page?: number, limit?: number) {
  const currentPage = Math.max(1, page || DEFAULT_PAGINATION.page);
  const pageSize = Math.min(
    Math.max(1, limit || DEFAULT_PAGINATION.limit),
    DEFAULT_PAGINATION.maxLimit
  );
  const offset = (currentPage - 1) * pageSize;
  
  return { page: currentPage, limit: pageSize, offset };
}

/**
 * 전문가별 상담 조회 최적화
 */
export async function getConsultationsByExpert(
  expertId: number,
  options: {
    status?: string;
    pagination?: PaginationOptions;
    sort?: SortOptions;
  } = {}
) {
  return measureQuery('getConsultationsByExpert', async () => {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = { expertId };
  if (options.status && options.status !== 'all') {
    whereClause.status = options.status;
  }

  const orderClause = options.sort 
    ? [[options.sort.field, options.sort.direction] as [string, 'ASC' | 'DESC']]
    : [['createdAt', 'DESC'] as [string, 'ASC' | 'DESC']];

  return await Consultation.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        required: false,
        attributes: ['id', 'name', 'email']
      },
      {
        model: Category,
        as: 'category',
        required: false,
        attributes: ['id', 'name']
      }
    ],
    order: orderClause,
    limit,
    offset
  });
  });
}

/**
 * 사용자별 상담 조회 최적화
 */
export async function getConsultationsByUser(
  userId: string | number,
  options: {
    status?: string;
    pagination?: PaginationOptions;
    sort?: SortOptions;
  } = {}
) {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = { userId };
  if (options.status && options.status !== 'all') {
    whereClause.status = options.status;
  }

  const orderClause = options.sort 
    ? [[options.sort.field, options.sort.direction] as [string, 'ASC' | 'DESC']]
    : [['createdAt', 'DESC'] as [string, 'ASC' | 'DESC']];

  return await Consultation.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Expert,
        as: 'expert',
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email']
          }
        ]
      },
      {
        model: Category,
        as: 'category',
        required: false,
        attributes: ['id', 'name']
      }
    ],
    order: orderClause,
    limit,
    offset
  });
}

/**
 * 전문가별 리뷰 조회 최적화
 */
export async function getReviewsByExpert(
  expertId: number,
  options: {
    isPublic?: boolean;
    pagination?: PaginationOptions;
    sort?: SortOptions;
  } = {}
) {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = { 
    expertId,
    isDeleted: false
  };
  
  if (options.isPublic !== undefined) {
    whereClause.isPublic = options.isPublic;
  }

  const orderClause = options.sort 
    ? [[options.sort.field, options.sort.direction] as [string, 'ASC' | 'DESC']]
    : [['createdAt', 'DESC'] as [string, 'ASC' | 'DESC']];

  return await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        required: false,
        attributes: ['id', 'name', 'email', 'profileImage']
      },
      {
        model: Consultation,
        as: 'consultation',
        required: false,
        attributes: ['id', 'title', 'categoryId']
      }
    ],
    order: orderClause,
    limit,
    offset
  });
}

/**
 * 전문가 통계 조회 최적화
 */
export async function getExpertStats(expertId: number) {
  const [
    totalConsultations,
    completedConsultations,
    totalReviews,
    avgRating,
    totalRevenue
  ] = await Promise.all([
    Consultation.count({ where: { expertId } }),
    Consultation.count({ where: { expertId, status: 'completed' } }),
    Review.count({ where: { expertId, isDeleted: false } }),
    Review.findOne({
      where: { expertId, isDeleted: false },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating']
      ],
      raw: true
    }),
    Consultation.sum('price', { where: { expertId, status: 'completed' } })
  ]);

  return {
    totalConsultations,
    completedConsultations,
    completionRate: totalConsultations > 0 ? (completedConsultations / totalConsultations) * 100 : 0,
    totalReviews,
    avgRating: (avgRating as any)?.avgRating || 0,
    totalRevenue: totalRevenue || 0
  };
}

/**
 * 사용자별 알림 조회 최적화
 */
export async function getNotificationsByUser(
  userId: string,
  options: {
    isRead?: boolean;
    type?: string;
    pagination?: PaginationOptions;
  } = {}
) {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = { userId };
  
  if (options.isRead !== undefined) {
    whereClause.isRead = options.isRead;
  }
  
  if (options.type) {
    whereClause.type = options.type;
  }

  return await Notification.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
}

/**
 * 전문가 프로필 검색 최적화
 */
export async function searchExpertProfiles(
  searchTerm: string,
  options: {
    categoryId?: number;
    level?: number;
    minRating?: number;
    pagination?: PaginationOptions;
  } = {}
) {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = {
    isActive: true
  };

  // 검색어가 있는 경우 전문가 이름이나 전문분야에서 검색
  if (searchTerm) {
    whereClause[Op.or] = [
      { '$expert.user.name$': { [Op.like]: `%${searchTerm}%` } },
      { specialties: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } }
    ];
  }

  // 카테고리 필터
  if (options.categoryId) {
    whereClause.categoryId = options.categoryId;
  }

  // 레벨 필터
  if (options.level) {
    whereClause.level = options.level;
  }

  // 최소 평점 필터
  if (options.minRating) {
    whereClause.avgRating = { [Op.gte]: options.minRating };
  }

  return await ExpertProfile.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Expert,
        as: 'expert',
        required: true,
        include: [
          {
            model: User,
            as: 'user',
            required: true,
            attributes: ['id', 'name', 'email', 'profileImage']
          }
        ]
      }
    ],
    order: [
      ['avgRating', 'DESC'],
      ['totalSessions', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });
}

/**
 * 인기 카테고리 통계 조회 최적화
 */
export async function getPopularCategories(limit: number = 10) {
  const categories = await Category.findAll({
    where: { isActive: true },
    include: [
      {
        model: Consultation,
        as: 'consultations',
        required: false,
        attributes: ['id'],
        where: { status: 'completed' }
      }
    ],
    attributes: [
      'id',
      'name',
      'description',
      [require('sequelize').fn('COUNT', require('sequelize').col('consultations.id')), 'consultationCount']
    ],
    group: ['Category.id'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('consultations.id')), 'DESC']],
    limit
  });

  return categories.map((category: any, index: number) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    consultationCount: parseInt(category.dataValues.consultationCount) || 0,
    rank: index + 1
  }));
}

/**
 * 결제 내역 조회 최적화
 */
export async function getPaymentHistory(
  userId: string,
  options: {
    status?: string;
    paymentType?: string;
    pagination?: PaginationOptions;
  } = {}
) {
  const { page, limit, offset } = calculatePagination(
    options.pagination?.page,
    options.pagination?.limit
  );

  const whereClause: any = { userId };
  
  if (options.status) {
    whereClause.status = options.status;
  }
  
  if (options.paymentType) {
    whereClause.paymentType = options.paymentType;
  }

  return await Payment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Consultation,
        as: 'consultation',
        required: false,
        attributes: ['id', 'title', 'expertId']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
}

/**
 * 쿼리 성능 모니터링을 위한 로깅 함수
 */
export function logQueryPerformance(queryName: string, startTime: number, resultCount?: number) {
  const duration = Date.now() - startTime;
  console.log(`[Query Performance] ${queryName}: ${duration}ms${resultCount ? ` (${resultCount} results)` : ''}`);
  
  // 느린 쿼리 경고 (1초 이상)
  if (duration > 1000) {
    console.warn(`[Slow Query Warning] ${queryName} took ${duration}ms`);
  }
}

/**
 * 캐시 키 생성 함수
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}
