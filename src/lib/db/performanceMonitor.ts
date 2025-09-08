/**
 * 데이터베이스 성능 모니터링 유틸리티
 * 쿼리 성능을 추적하고 느린 쿼리를 감지합니다.
 */

interface QueryMetrics {
  queryName: string;
  duration: number;
  resultCount?: number;
  timestamp: Date;
  slowQuery?: boolean;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1초
  private maxMetrics = 1000; // 최대 저장할 메트릭 수

  /**
   * 쿼리 성능 기록
   */
  recordQuery(queryName: string, duration: number, resultCount?: number): void {
    const metric: QueryMetrics = {
      queryName,
      duration,
      resultCount,
      timestamp: new Date(),
      slowQuery: duration > this.slowQueryThreshold
    };

    this.metrics.push(metric);

    // 메트릭 수 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 느린 쿼리 경고
    if (metric.slowQuery) {
      console.warn(`[Slow Query] ${queryName}: ${duration}ms${resultCount ? ` (${resultCount} results)` : ''}`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Query Performance] ${queryName}: ${duration}ms${resultCount ? ` (${resultCount} results)` : ''}`);
    }
  }

  /**
   * 느린 쿼리 통계
   */
  getSlowQueryStats(): {
    totalSlowQueries: number;
    averageSlowQueryDuration: number;
    slowQueriesByType: Record<string, number>;
  } {
    const slowQueries = this.metrics.filter(m => m.slowQuery);
    
    const slowQueriesByType = slowQueries.reduce((acc, query) => {
      acc[query.queryName] = (acc[query.queryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageSlowQueryDuration = slowQueries.length > 0
      ? slowQueries.reduce((sum, q) => sum + q.duration, 0) / slowQueries.length
      : 0;

    return {
      totalSlowQueries: slowQueries.length,
      averageSlowQueryDuration,
      slowQueriesByType
    };
  }

  /**
   * 전체 성능 통계
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueryPercentage: number;
    topSlowQueries: Array<{ queryName: string; count: number; avgDuration: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueryPercentage: 0,
        topSlowQueries: []
      };
    }

    const totalQueries = this.metrics.length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueryCount = this.metrics.filter(m => m.slowQuery).length;
    const slowQueryPercentage = (slowQueryCount / totalQueries) * 100;

    // 쿼리별 통계
    const queryStats = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.queryName]) {
        acc[metric.queryName] = { count: 0, totalDuration: 0 };
      }
      acc[metric.queryName].count++;
      acc[metric.queryName].totalDuration += metric.duration;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);

    const topSlowQueries = Object.entries(queryStats)
      .map(([queryName, stats]) => ({
        queryName,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalQueries,
      averageDuration,
      slowQueryPercentage,
      topSlowQueries
    };
  }

  /**
   * 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 느린 쿼리 임계값 설정
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/**
 * 쿼리 성능 측정 데코레이터
 */
export function measureQueryPerformance(queryName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        performanceMonitor.recordQuery(queryName, duration, Array.isArray(result) ? result.length : undefined);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        performanceMonitor.recordQuery(`${queryName}_ERROR`, duration);
        throw error;
      }
    };
  };
}

/**
 * 쿼리 성능 측정 함수
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    performanceMonitor.recordQuery(queryName, duration, Array.isArray(result) ? result.length : undefined);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.recordQuery(`${queryName}_ERROR`, duration);
    throw error;
  }
}

/**
 * 성능 통계 API 엔드포인트용
 */
export function getPerformanceReport() {
  return {
    timestamp: new Date().toISOString(),
    stats: performanceMonitor.getPerformanceStats(),
    slowQueryStats: performanceMonitor.getSlowQueryStats()
  };
}
