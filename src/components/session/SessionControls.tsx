"use client";

import { useState } from "react";
import {
  Phone,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Camera,
  CameraOff,
  Download,
  Share2,
  Settings,
  HelpCircle,
  AlertTriangle,
  DollarSign,
  Pause,
  Play,
} from "lucide-react";

interface SessionControlsProps {
  onEndCall?: () => void;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onToggleRecording?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onAddCredits?: () => void;
  isAudioOn?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
  remainingCredits?: number;
  creditsPerMinute?: number;
  consultationType?: "chat" | "voice" | "video";
}

const SessionControls = ({
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onOpenSettings,
  onOpenHelp,
  onAddCredits,
  isAudioOn = true,
  isVideoOn = true,
  isScreenSharing = false,
  isRecording = false,
  isPaused = false,
  onTogglePause,
  remainingCredits = 150,
  creditsPerMinute = 180,
  consultationType = "video", // "chat", "voice", "video"
}: SessionControlsProps) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const handleEndCall = () => {
    setShowEndConfirm(true);
  };

  const confirmEndCall = () => {
    onEndCall?.();
    setShowEndConfirm(false);
  };

  const cancelEndCall = () => {
    setShowEndConfirm(false);
  };

  const handleAddCredits = () => {
    setShowCreditModal(true);
  };

  const closeCreditModal = () => {
    setShowCreditModal(false);
  };

  const remainingMinutes = Math.floor(remainingCredits / creditsPerMinute);

  return (
    <>
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 왼쪽 컨트롤 */}
          <div className="flex items-center space-x-2">
            {/* 일시정지/재개 (음성/화상 모드에서만) */}
            {(consultationType === "voice" || consultationType === "video") && (
              <button
                onClick={onTogglePause}
                className={`p-3 rounded-full border transition-colors ${
                  isPaused
                    ? "bg-green-100 text-green-600 border-green-200 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                }`}
                title={isPaused ? "재개" : "일시정지"}
              >
                {isPaused ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 마이크 (음성/화상 모드에서만) */}
            {(consultationType === "voice" || consultationType === "video") && (
              <button
                onClick={onToggleAudio}
                className={`p-3 rounded-full border transition-colors ${
                  isAudioOn
                    ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                    : "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                }`}
                title={isAudioOn ? "마이크 끄기" : "마이크 켜기"}
              >
                {isAudioOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 비디오 (화상 모드에서만) */}
            {consultationType === "video" && (
              <button
                onClick={onToggleVideo}
                className={`p-3 rounded-full border transition-colors ${
                  isVideoOn
                    ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                    : "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                }`}
                title={isVideoOn ? "비디오 끄기" : "비디오 켜기"}
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 화면 공유 (화상 모드에서만) */}
            {consultationType === "video" && (
              <button
                onClick={onToggleScreenShare}
                className={`p-3 rounded-full border transition-colors ${
                  isScreenSharing
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                }`}
                title={isScreenSharing ? "화면 공유 중지" : "화면 공유 시작"}
              >
                {isScreenSharing ? (
                  <MonitorOff className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 녹화 */}
            <button
              onClick={onToggleRecording}
              className={`p-3 rounded-full border transition-colors ${
                isRecording
                  ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              }`}
              title={isRecording ? "녹화 중지" : "녹화 시작"}
            >
              <div
                className={`w-5 h-5 rounded-full ${
                  isRecording ? "bg-red-600" : "border-2 border-current"
                }`}
              />
            </button>
          </div>

          {/* 중앙 - 크레딧 정보 */}
          <div className="flex items-center space-x-4">
            {/* 크레딧 부족 경고 */}
            {remainingMinutes <= 10 && (
              <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  약 {remainingMinutes}분 남음
                </span>
                <button
                  onClick={handleAddCredits}
                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  충전
                </button>
              </div>
            )}

            {/* 크레딧 정보 */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {remainingCredits} 크레딧
              </span>
            </div>
          </div>

          {/* 오른쪽 컨트롤 */}
          <div className="flex items-center space-x-2">
            {/* 설정 */}
            <button
              onClick={onOpenSettings}
              className="p-3 bg-gray-100 text-gray-600 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* 도움말 */}
            <button
              onClick={onOpenHelp}
              className="p-3 bg-gray-100 text-gray-600 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
              title="도움말"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* 상담 종료 */}
            <button
              onClick={handleEndCall}
              className="p-3 bg-red-600 text-white border border-red-600 rounded-full hover:bg-red-700 transition-colors"
              title="상담 종료"
            >
              <Phone className="w-5 h-5 transform rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>

      {/* 상담 종료 확인 모달 */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-red-600 transform rotate-[135deg]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                상담을 종료하시겠습니까?
              </h3>
              <p className="text-gray-600 mb-6">
                상담을 종료하면 현재까지의 내용이 저장되고 상담 요약이
                제공됩니다.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelEndCall}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmEndCall}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  상담 종료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 충전 모달 */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                크레딧 부족
              </h3>
              <p className="text-gray-600 mb-4">
                현재 {remainingCredits} 크레딧이 남아있어 약 {remainingMinutes}
                분 정도 상담이 가능합니다.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                크레딧을 충전하여 상담을 계속하시겠습니까?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={closeCreditModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  나중에
                </button>
                <button
                  onClick={() => {
                    closeCreditModal();
                    // 크레딧 충전 페이지로 이동
                    window.open("/credit-packages", "_blank");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  크레딧 충전
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionControls;
