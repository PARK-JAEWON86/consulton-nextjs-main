import { NextRequest, NextResponse } from 'next/server';

interface UserCreditsData {
  totalCredits: number;
  aiChatCredits: {
    total: number;
    used: number;
    remaining: number;
    remainingPercent: number;
    lastResetDate: string;
  };
  purchasedCredits: {
    total: number;
    used: number;
    remaining: number;
    remainingPercent: number;
  };
  monthlyUsage: {
    currentMonth: string;
    totalUsed: number;
    breakdown: {
      aiChat: number;
      expertConsultation: number;
      other: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // 실제로는 데이터베이스에서 조회하지만, 현재는 localStorage 데이터를 시뮬레이션
    const creditsData = await getUserCreditsData(userId);

    return NextResponse.json({
      success: true,
      data: creditsData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('User credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, amount, type } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'use_ai_credits':
        result = await useAICredits(userId, amount);
        break;
      case 'add_purchased_credits':
        result = await addPurchasedCredits(userId, amount);
        break;
      case 'reset_monthly':
        result = await resetMonthlyCredits(userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('User credits update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 헬퍼 함수들 (실제로는 데이터베이스 로직)
async function getUserCreditsData(userId: string): Promise<UserCreditsData> {
  // 현재는 기본값 반환, 실제로는 DB에서 조회
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const MONTHLY_AI_CHAT_CREDITS = 7300;
  
  return {
    totalCredits: 15000, // 예시 값
    aiChatCredits: {
      total: MONTHLY_AI_CHAT_CREDITS,
      used: 2500,
      remaining: MONTHLY_AI_CHAT_CREDITS - 2500,
      remainingPercent: Math.round(((MONTHLY_AI_CHAT_CREDITS - 2500) / MONTHLY_AI_CHAT_CREDITS) * 100),
      lastResetDate: currentMonth,
    },
    purchasedCredits: {
      total: 10000,
      used: 3000,
      remaining: 7000,
      remainingPercent: 70,
    },
    monthlyUsage: {
      currentMonth,
      totalUsed: 5500,
      breakdown: {
        aiChat: 2500,
        expertConsultation: 2800,
        other: 200,
      },
    },
  };
}

async function useAICredits(userId: string, amount: number) {
  // AI 크레딧 사용 로직
  const currentData = await getUserCreditsData(userId);
  
  if (currentData.aiChatCredits.remaining < amount) {
    throw new Error('Insufficient AI chat credits');
  }

  // 실제로는 데이터베이스 업데이트
  return {
    used: amount,
    remaining: currentData.aiChatCredits.remaining - amount,
    message: `${amount} AI chat credits used successfully`,
  };
}

async function addPurchasedCredits(userId: string, amount: number) {
  // 구매 크레딧 추가 로직
  const currentData = await getUserCreditsData(userId);
  
  // 실제로는 데이터베이스 업데이트
  return {
    added: amount,
    newTotal: currentData.purchasedCredits.total + amount,
    message: `${amount} purchased credits added successfully`,
  };
}

async function resetMonthlyCredits(userId: string) {
  // 월간 크레딧 리셋 로직
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const MONTHLY_AI_CHAT_CREDITS = 7300;
  
  // 실제로는 데이터베이스 업데이트
  return {
    resetDate: currentMonth,
    newAIChatCredits: MONTHLY_AI_CHAT_CREDITS,
    message: 'Monthly AI chat credits reset successfully',
  };
}
