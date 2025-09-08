import { NextRequest, NextResponse } from 'next/server';

// AI 토큰 정책 상수
const MONTHLY_FREE_TOKENS = 100000; // 매월 100,000 토큰 제공 (100%)
const AVERAGE_TOKENS_PER_TURN = 900; // GPT-5 기준 1턴당 평균 900 토큰
const AVERAGE_COST_PER_1K_TOKENS = 0.0071; // 1K 토큰당 평균 $0.0071
const EXCHANGE_RATE_KRW = 1385; // 환율: 1달러 = 1,385원

// 크레딧 시스템 상수
const CREDIT_TO_KRW = 10; // 1크레딧 = ₩10원
const CREDIT_TO_TOKENS = 1000; // 1크레딧 = 1,000토큰
const TOKENS_TO_KRW = 0.01; // 1,000토큰 = ₩10원 (크레딧 구매 시)

interface AIUsageState {
  usedTokens: number;
  purchasedTokens: number;
  remainingPercent: number;
  monthlyResetDate: string;
  totalTurns: number;
  totalTokens: number;
  averageTokensPerTurn: number;
}

// 토큰 사용량을 퍼센트로 변환
function tokensToPercent(tokens: number): number {
  return Math.round((tokens / MONTHLY_FREE_TOKENS) * 100);
}

// 남은 토큰 퍼센트 계산
function calcRemainingPercent(
  usedTokens: number,
  purchasedTokens: number
): number {
  const total = MONTHLY_FREE_TOKENS + purchasedTokens;
  return Math.max(0, Math.round(100 * (1 - usedTokens / total)));
}

// summary 객체 생성 helper 함수
function createSummary(aiUsageState: AIUsageState) {
  const totalFreeTokens = MONTHLY_FREE_TOKENS;
  
  // 구매 토큰이 있으면 구매 토큰을 우선 사용하도록 로직 수정
  let usedFreeTokens, usedPurchasedTokens, remainingFreeTokens, remainingPurchasedTokens;
  
  if (aiUsageState.purchasedTokens > 0) {
    // 구매 토큰이 있는 경우: 구매 토큰을 먼저 사용
    usedPurchasedTokens = Math.min(aiUsageState.usedTokens, aiUsageState.purchasedTokens);
    usedFreeTokens = Math.max(0, aiUsageState.usedTokens - aiUsageState.purchasedTokens);
    remainingPurchasedTokens = Math.max(0, aiUsageState.purchasedTokens - usedPurchasedTokens);
    remainingFreeTokens = Math.max(0, totalFreeTokens - usedFreeTokens);
  } else {
    // 구매 토큰이 없는 경우: 기존 로직
    usedFreeTokens = Math.min(aiUsageState.usedTokens, totalFreeTokens);
    usedPurchasedTokens = Math.max(0, aiUsageState.usedTokens - totalFreeTokens);
    remainingFreeTokens = Math.max(0, totalFreeTokens - aiUsageState.usedTokens);
    remainingPurchasedTokens = 0;
  }
  
  // 예상 턴 수 계산
  const estimatedTurnsFromFree = Math.floor(remainingFreeTokens / AVERAGE_TOKENS_PER_TURN);
  const estimatedTurnsFromPurchased = Math.floor(remainingPurchasedTokens / AVERAGE_TOKENS_PER_TURN);
  
  return {
    totalTokens: totalFreeTokens + aiUsageState.purchasedTokens,
    freeTokens: totalFreeTokens,
    usedFreeTokens,
    usedPurchasedTokens,
    remainingFreeTokens,
    remainingPurchasedTokens,
    estimatedTurnsFromFree,
    estimatedTurnsFromPurchased,
    totalEstimatedTurns: estimatedTurnsFromFree + estimatedTurnsFromPurchased,
    nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    // 무료 제공량 사용률 (무료 토큰만의 사용률)
    freeTokensUsagePercent: Math.round((usedFreeTokens / totalFreeTokens) * 100),
    // 비용 정보
    averageCostPerTurn: (AVERAGE_TOKENS_PER_TURN / 1000) * AVERAGE_COST_PER_1K_TOKENS,
    monthlyFreeValue: (MONTHLY_FREE_TOKENS / 1000) * AVERAGE_COST_PER_1K_TOKENS,
    // 원화 비용 정보
    averageCostPerTurnKRW: (AVERAGE_TOKENS_PER_TURN / 1000) * AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW,
    monthlyFreeValueKRW: (MONTHLY_FREE_TOKENS / 1000) * AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW,
    // 크레딧 시스템 정보
    creditToTokens: CREDIT_TO_TOKENS,
    creditToKRW: CREDIT_TO_KRW,
    tokensToKRW: TOKENS_TO_KRW,
    creditDiscount: Math.round((1 - (TOKENS_TO_KRW / (AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW))) * 100)
  };
}

// 초기 AI 사용량 상태 (빈 상태로 시작)
let aiUsageState: AIUsageState = {
  usedTokens: 0,
  purchasedTokens: 0,
  remainingPercent: 100,
  monthlyResetDate: new Date().toISOString(),
  totalTurns: 0,
  totalTokens: 0,
  averageTokensPerTurn: 0,
};

// GET: AI 사용량 조회
export async function GET() {
  try {
    // 월간 리셋 체크
    const now = new Date();
    const lastReset = new Date(aiUsageState.monthlyResetDate);
    
    // 월이 바뀌었는지 확인
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      // 월간 리셋 실행
      aiUsageState.usedTokens = 0;
      aiUsageState.totalTurns = 0;
      aiUsageState.totalTokens = 0;
      aiUsageState.averageTokensPerTurn = 0;
      aiUsageState.monthlyResetDate = now.toISOString();
      aiUsageState.remainingPercent = calcRemainingPercent(
        aiUsageState.usedTokens,
        aiUsageState.purchasedTokens
      );
    }

    const responseData = {
      ...aiUsageState,
      summary: createSummary(aiUsageState)
    };

    const response = NextResponse.json({
      success: true,
      data: responseData
    });

    // 캐싱 헤더 추가 (3초간 캐시)
    response.headers.set('Cache-Control', 'public, s-maxage=3, stale-while-revalidate=5');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI 사용량 조회 실패' },
      { status: 500 }
    );
  }
}

// POST: AI 사용량 관리 액션
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'addTurnUsage':
        const { totalTokens, preciseMode = false } = data;
        
        if (!totalTokens || totalTokens <= 0) {
          return NextResponse.json(
            { success: false, error: '유효하지 않은 토큰 수' },
            { status: 400 }
          );
        }

        // 정밀 모드일 경우 1.2배 토큰 소모
        const actualTokensUsed = preciseMode ? Math.round(totalTokens * 1.2) : totalTokens;
        
        // 사용량 업데이트
        aiUsageState.usedTokens += actualTokensUsed;
        aiUsageState.totalTurns += 1;
        aiUsageState.totalTokens += actualTokensUsed;
        aiUsageState.averageTokensPerTurn = Math.round(aiUsageState.totalTokens / aiUsageState.totalTurns);
        
        // 남은 토큰 퍼센트 재계산
        aiUsageState.remainingPercent = calcRemainingPercent(
          aiUsageState.usedTokens,
          aiUsageState.purchasedTokens
        );

        // 예상 남은 턴 수 계산
        const remainingTokensAfterUsage = Math.max(0, (MONTHLY_FREE_TOKENS + aiUsageState.purchasedTokens) - aiUsageState.usedTokens);
        const estimatedRemainingTurnsAfterUsage = Math.floor(remainingTokensAfterUsage / AVERAGE_TOKENS_PER_TURN);

        return NextResponse.json({
          success: true,
          data: {
            spentTokens: actualTokensUsed,
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            estimatedRemainingTurns: estimatedRemainingTurnsAfterUsage,
            message: `턴 사용량이 추가되었습니다. 소모된 토큰: ${actualTokensUsed} (${preciseMode ? '정밀 모드' : '일반 모드'})`
          }
        });

      case 'addPurchasedTokens':
        const { tokens } = data;
        
        if (!tokens || tokens <= 0) {
          return NextResponse.json(
            { success: false, error: '유효하지 않은 토큰 수' },
            { status: 400 }
          );
        }

        aiUsageState.purchasedTokens += tokens;
        
        // 남은 토큰 퍼센트 재계산
        aiUsageState.remainingPercent = calcRemainingPercent(
          aiUsageState.usedTokens,
          aiUsageState.purchasedTokens
        );

        // 예상 추가 턴 수 계산
        const additionalTurns = Math.floor(tokens / AVERAGE_TOKENS_PER_TURN);

        return NextResponse.json({
          success: true,
          data: {
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            additionalTurns,
            message: `${tokens.toLocaleString()} 토큰이 구매되었습니다. (예상 ${additionalTurns}턴)`
          }
        });

      case 'addPurchasedCredits':
        const { credits } = data;
        
        if (!credits || credits <= 0) {
          return NextResponse.json(
            { success: false, error: '유효하지 않은 크레딧 수' },
            { status: 400 }
          );
        }

        // 크레딧을 토큰으로 변환
        const tokensFromCredits = credits * CREDIT_TO_TOKENS;
        const costInKRW = credits * CREDIT_TO_KRW;
        
        aiUsageState.purchasedTokens += tokensFromCredits;
        
        // 남은 토큰 퍼센트 재계산
        aiUsageState.remainingPercent = calcRemainingPercent(
          aiUsageState.usedTokens,
          aiUsageState.purchasedTokens
        );

        // 예상 추가 턴 수 계산
        const additionalTurnsFromCredits = Math.floor(tokensFromCredits / AVERAGE_TOKENS_PER_TURN);

        return NextResponse.json({
          success: true,
          data: {
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            purchasedCredits: credits,
            purchasedTokens: tokensFromCredits,
            costInKRW,
            additionalTurns: additionalTurnsFromCredits,
            message: `${credits}크레딧(₩${costInKRW.toLocaleString()})으로 ${tokensFromCredits.toLocaleString()} 토큰이 구매되었습니다. (예상 ${additionalTurnsFromCredits}턴)`
          }
        });

      case 'grantTurns':
        const { turns } = data;
        
        if (!turns || turns <= 0) {
          return NextResponse.json(
            { success: false, error: '유효하지 않은 턴 수' },
            { status: 400 }
          );
        }

        // 1턴당 평균 토큰 수로 계산
        const grantedTokens = turns * AVERAGE_TOKENS_PER_TURN;
        aiUsageState.purchasedTokens += grantedTokens;
        
        // 남은 토큰 퍼센트 재계산
        aiUsageState.remainingPercent = calcRemainingPercent(
          aiUsageState.usedTokens,
          aiUsageState.purchasedTokens
        );

        return NextResponse.json({
          success: true,
          data: {
            grantedTokens,
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            message: `${turns}턴이 부여되었습니다. (${grantedTokens.toLocaleString()} 토큰)`
          }
        });

      case 'resetMonthly':
        // 월간 리셋 (무료 토큰 사용량만 리셋)
        aiUsageState.usedTokens = 0;
        aiUsageState.totalTurns = 0;
        aiUsageState.totalTokens = 0;
        aiUsageState.averageTokensPerTurn = 0;
        aiUsageState.monthlyResetDate = new Date().toISOString();
        
        // 남은 토큰 퍼센트 재계산
        aiUsageState.remainingPercent = calcRemainingPercent(
          aiUsageState.usedTokens,
          aiUsageState.purchasedTokens
        );

        return NextResponse.json({
          success: true,
          data: {
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            message: '월간 사용량이 리셋되었습니다.'
          }
        });

      case 'resetAll':
        // 모든 사용량 리셋
        aiUsageState = {
          usedTokens: 0,
          purchasedTokens: 0,
          remainingPercent: 100,
          monthlyResetDate: new Date().toISOString(),
          totalTurns: 0,
          totalTokens: 0,
          averageTokensPerTurn: 0,
        };

        return NextResponse.json({
          success: true,
          data: {
            newState: {
              ...aiUsageState,
              summary: createSummary(aiUsageState)
            },
            message: '모든 AI 사용량이 리셋되었습니다.'
          }
        });

      case 'simulateUsage':
        // 사용량 시뮬레이션
        const { simulationTurns: simTurns, tokensPerTurn: simTokensPerTurn, preciseMode: simPreciseMode = false } = data;
        
        if (!simTurns || !simTokensPerTurn) {
          return NextResponse.json(
            { success: false, error: '시뮬레이션 파라미터가 필요합니다' },
            { status: 400 }
          );
        }

        let totalSimTokens = 0;

        for (let i = 0; i < simTurns; i++) {
          const tokensForTurn = simPreciseMode ? Math.round(simTokensPerTurn * 1.2) : simTokensPerTurn;
          totalSimTokens += tokensForTurn;
        }

        // 실제 상태에 반영하지 않고 시뮬레이션 결과만 반환
        const remainingTokensForSim = Math.max(0, (MONTHLY_FREE_TOKENS + aiUsageState.purchasedTokens) - aiUsageState.usedTokens);
        const estimatedRemainingTurnsForSim = Math.floor(remainingTokensForSim / AVERAGE_TOKENS_PER_TURN);
        const canAffordTurns = Math.floor(remainingTokensForSim / (simPreciseMode ? simTokensPerTurn * 1.2 : simTokensPerTurn));

        const simulationResult = {
          turns: simTurns,
          tokensPerTurn: simTokensPerTurn,
          totalTokens: totalSimTokens,
          preciseMode: simPreciseMode,
          estimatedRemainingTurns: estimatedRemainingTurnsForSim,
          canAffordTurns,
          remainingTokens: remainingTokensForSim,
          costEstimate: (totalSimTokens / 1000) * AVERAGE_COST_PER_1K_TOKENS,
          costEstimateKRW: (totalSimTokens / 1000) * AVERAGE_COST_PER_1K_TOKENS * EXCHANGE_RATE_KRW
        };

        return NextResponse.json({
          success: true,
          data: {
            simulation: simulationResult,
            message: '사용량 시뮬레이션이 완료되었습니다.'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI 사용량 관리 실패' },
      { status: 500 }
    );
  }
}

// PATCH: AI 사용량 부분 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;
    
    // 사용량 업데이트
    Object.assign(aiUsageState, updates);
    
    // 남은 토큰 퍼센트 재계산
    aiUsageState.remainingPercent = calcRemainingPercent(
      aiUsageState.usedTokens,
      aiUsageState.purchasedTokens
    );
    
    // 평균 토큰 수 재계산
    if (aiUsageState.totalTurns > 0) {
      aiUsageState.averageTokensPerTurn = Math.round(aiUsageState.totalTokens / aiUsageState.totalTurns);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        newState: aiUsageState,
        summary: createSummary(aiUsageState),
        message: 'AI 사용량이 업데이트되었습니다.'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI 사용량 업데이트 실패' },
      { status: 500 }
    );
  }
}

// DELETE: AI 사용량 초기화
export async function DELETE() {
  try {
    aiUsageState = {
      usedTokens: 0,
      purchasedTokens: 0,
      remainingPercent: 100,
      monthlyResetDate: new Date().toISOString(),
      totalTurns: 0,
      totalTokens: 0,
      averageTokensPerTurn: 0,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        message: '모든 AI 사용량이 초기화되었습니다.'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI 사용량 초기화 실패' },
      { status: 500 }
    );
  }
}
