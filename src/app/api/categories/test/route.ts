import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: '카테고리 API 테스트 페이지',
    endpoints: {
      'GET /api/categories': '모든 카테고리 조회',
      'GET /api/categories?activeOnly=true': '활성 카테고리만 조회',
      'POST /api/categories': '카테고리 생성/수정/삭제',
    },
    testData: {
      create: {
        method: 'POST',
        url: '/api/categories',
        body: {
          action: 'create',
          category: {
            id: 'test-category',
            name: '테스트 상담',
            description: '테스트용 상담 분야입니다',
            icon: 'Star'
          }
        }
      },
      update: {
        method: 'POST',
        url: '/api/categories',
        body: {
          action: 'update',
          category: {
            id: 'career',
            name: '진로상담 (수정됨)',
            description: '수정된 설명'
          }
        }
      },
      delete: {
        method: 'POST',
        url: '/api/categories',
        body: {
          action: 'delete',
          category: {
            id: 'test-category'
          }
        }
      },
      reorder: {
        method: 'POST',
        url: '/api/categories',
        body: {
          action: 'reorder',
          categoryIds: ['career', 'psychology', 'finance', 'legal']
        }
      }
    }
  });
}
