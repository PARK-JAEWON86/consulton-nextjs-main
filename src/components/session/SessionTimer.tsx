"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle, DollarSign, Pause, Play } from "lucide-react";

interface SessionTimerProps {
  isActive?: boolean;
  onTimeUpdate?: (time: number, credits: number) => void;
  onCreditWarning?: (remainingMinutes: number) => void;
  creditsPerMinute?: number;
  userCredits?: number;
  onSessionEnd?: (reason: string) => void;
}

const SessionTimer = ({
  isActive = false,
  onTimeUpdate,
  onCreditWarning,
  creditsPerMinute = 180,
  userCredits = 150,
  onSessionEnd,
}: SessionTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [usedCredits, setUsedCredits] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShownRef = useRef(false);

  // 타이머 시작/정지
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          const newCredits = Math.ceil((newTime / 60) * creditsPerMinute);

          // 크레딧 사용량 업데이트
          setUsedCredits(newCredits);

          // 크레딧 부족 경고 (10분 전)
          const remainingCredits = userCredits - newCredits;
          const remainingMinutes = Math.floor(
            remainingCredits / creditsPerMinute,
          );

          if (
            remainingMinutes <= 10 &&
            remainingMinutes > 0 &&
            !warningShownRef.current
          ) {
            setShowWarning(true);
            warningShownRef.current = true;
            onCreditWarning?.(remainingMinutes);
          }

          // 크레딧 소진 시 세션 종료
          if (remainingCredits <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onSessionEnd?.("credits_exhausted");
            return prev;
          }

          onTimeUpdate?.(newTime, newCredits);
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isActive,
    isPaused,
    creditsPerMinute,
    userCredits,
    onTimeUpdate,
    onCreditWarning,
    onSessionEnd,
  ]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 크레딧 포맷팅
  const formatCredits = (credits: number) => {
    return Math.ceil(credits);
  };

  // 남은 크레딧 계산
  const remainingCredits = userCredits - usedCredits;
  const remainingMinutes = Math.floor(remainingCredits / creditsPerMinute);

  // 일시정지/재개 토글
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 경고 메시지 닫기
  const closeWarning = () => {
    setShowWarning(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* 타이머 표시 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-500">
              {isActive ? (isPaused ? "일시정지됨" : "진행 중") : "대기 중"}
            </div>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        {isActive && (
          <button
            onClick={togglePause}
            className={`p-2 rounded-lg border transition-colors ${
              isPaused
                ? "bg-green-100 text-green-600 border-green-200 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            }`}
            title={isPaused ? "재개" : "일시정지"}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* 크레딧 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              사용된 크레딧
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCredits(usedCredits)} 크레딧
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">남은 시간</span>
          </div>
          <div
            className={`text-lg font-bold ${
              remainingMinutes <= 10 ? "text-red-600" : "text-gray-900"
            }`}
          >
            약 {remainingMinutes}분
          </div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>크레딧 사용률</span>
          <span>{Math.round((usedCredits / userCredits) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              usedCredits / userCredits > 0.8
                ? "bg-red-500"
                : usedCredits / userCredits > 0.6
                  ? "bg-yellow-500"
                  : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min((usedCredits / userCredits) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </div>

      {/* 크레딧 부족 경고 */}
      {showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                크레딧 부족 경고
              </p>
              <p className="text-sm text-yellow-700">
                약 {remainingMinutes}분 후 크레딧이 소진됩니다. 크레딧을
                충전하거나 상담을 마무리해주세요.
              </p>
            </div>
            <button
              onClick={closeWarning}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 상담 정보 */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>분당 요금:</span>
          <span>{creditsPerMinute} 크레딧</span>
        </div>
        <div className="flex justify-between">
          <span>총 크레딧:</span>
          <span>{userCredits} 크레딧</span>
        </div>
        <div className="flex justify-between">
          <span>남은 크레딧:</span>
          <span className={remainingCredits <= 0 ? "text-red-600" : ""}>
            {remainingCredits} 크레딧
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionTimer;
