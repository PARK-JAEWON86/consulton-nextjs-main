import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const excludeId = searchParams.get('excludeId');
    const limit = parseInt(searchParams.get('limit') || '6');
    const category = searchParams.get('category');
    const ageGroup = searchParams.get('ageGroup');

    // 부모 route에서 데이터 가져오기
    const parentResponse = await fetch(`${request.nextUrl.origin}/api/expert-profiles`);
    const parentResult = await parentResponse.json();
    
    if (!parentResult.success) {
      return NextResponse.json(
        { success: false, error: '전문가 프로필 데이터를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    let filteredProfiles = parentResult.data.profiles || [];

    // 현재 전문가 제외
    if (excludeId) {
      filteredProfiles = filteredProfiles.filter((profile: any) => profile.id !== excludeId);
    }

    // 전문분야로 필터링
    if (specialty) {
      filteredProfiles = filteredProfiles.filter((profile: any) => 
        profile.specialty === specialty || 
        profile.keywords?.some((keyword: string) => keyword.toLowerCase().includes(specialty.toLowerCase()))
      );
    }

    // 카테고리로 필터링
    if (category) {
      filteredProfiles = filteredProfiles.filter((profile: any) => 
        profile.specialty === category || 
        profile.keywords?.some((keyword: string) => keyword.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // 연령대로 필터링
    if (ageGroup) {
      filteredProfiles = filteredProfiles.filter((profile: any) => {
        // targetAudience 필드가 없는 경우 모든 연령대 허용
        if (!profile.targetAudience || profile.targetAudience.length === 0) {
          return true;
        }
        
        if (ageGroup === "teen") {
          return profile.targetAudience.some((target: string) => 
            target.includes("청소년") || target.includes("중학생") || target.includes("고등학생")
          );
        } else if (ageGroup === "student") {
          return profile.targetAudience.some((target: string) => 
            target.includes("대학생") || target.includes("취준생") || target.includes("학생")
          );
        } else if (ageGroup === "adult") {
          return profile.targetAudience.some((target: string) => 
            target.includes("성인") || target.includes("직장인") || target.includes("주부")
          );
        }
        return true;
      });
    }

    // 점수 계산 및 정렬
    const scoredProfiles = filteredProfiles.map((profile: any) => {
      let score = 0;
      
      // 평점 기반 점수 (rating 필드 사용)
      score += (profile.rating || 0) * 100;
      
      // 경력 기반 점수
      score += (profile.experienceYears || 0) * 10;
      
      // 총 세션 수 기반 점수
      score += (profile.totalSessions || 0) * 0.5;
      
      // 완료율 기반 점수 (기본값 0)
      score += 0 * 0.1;
      
      return { ...profile, score };
    });

    // 점수 순으로 정렬하고 제한
    const sortedProfiles = scoredProfiles
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...profile }: any) => profile); // score 제거

    return NextResponse.json({
      success: true,
      data: {
        profiles: sortedProfiles,
        total: sortedProfiles.length,
        filters: {
          specialty,
          excludeId,
          limit,
          category,
          ageGroup
        }
      }
    });
  } catch (error) {
    console.error('전문가 프로필 검색 오류:', error);
    return NextResponse.json(
      { success: false, error: '전문가 프로필 검색 실패' },
      { status: 500 }
    );
  }
}
