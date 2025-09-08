"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  Settings,
  Users,
  MoreHorizontal,
  Circle,
  Square,
} from "lucide-react";
import MuteButton from "./MuteButton";
import VideoToggleButton from "./VideoToggleButton";
import ScreenShareButton from "./ScreenShareButton";

interface VideoControlsProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onEndCall: () => void;
}

const VideoControls = ({
  isVideoOn,
  isAudioOn,
  isScreenSharing,
  isRecording,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleRecording,
  onEndCall,
}: VideoControlsProps) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const controlButtons: Array<{
    component: React.ComponentType<any>;
    props: Record<string, unknown>;
  }> = [
    // 오디오 컨트롤
    {
      component: MuteButton,
      props: { isAudioOn, onToggle: onToggleAudio },
    },
    // 비디오 컨트롤
    {
      component: VideoToggleButton,
      props: { isVideoOn, onToggle: onToggleVideo },
    },
    // 화면 공유
    {
      component: ScreenShareButton,
      props: { isScreenSharing, onToggle: onToggleScreenShare },
    },
  ];

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* 기본 컨트롤 버튼들 */}
      {controlButtons.map((button, index) => {
        const ButtonComponent = button.component;
        return <ButtonComponent key={index} {...button.props} />;
      })}

      {/* 녹화 버튼 */}
      <button
        onClick={onToggleRecording}
        className={`p-3 rounded-full transition-colors ${
          isRecording
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
        title={isRecording ? "녹화 중지" : "녹화 시작"}
      >
        {isRecording ? (
          <Square className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* 더보기 옵션 */}
      <div className="relative">
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
          title="더 많은 옵션"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {showMoreOptions && (
          <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border py-2 min-w-[150px]">
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              참가자
            </button>
          </div>
        )}
      </div>

      {/* 통화 종료 버튼 */}
      <button
        onClick={onEndCall}
        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors ml-8"
        title="통화 종료"
      >
        <Phone className="h-5 w-5 transform rotate-[135deg]" />
      </button>
    </div>
  );
};

export default VideoControls;
