"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  role?: "expert" | "user";
  isPresenting?: boolean;
  isScreenSharing?: boolean;
  stream?: MediaStream;
  connectionStatus?: "good" | "poor" | "bad";
}

interface ParticipantVideoProps {
  participant: Participant;
  isMain?: boolean;
  isLocal?: boolean;
  showControls?: boolean;
}

const ParticipantVideo = ({
  participant,
  isMain = false,
  isLocal = false,
  showControls = true,
}: ParticipantVideoProps) => {
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // 실제로는 해당 참가자의 오디오를 음소거/해제
  };

  return (
    <div
      className={`relative bg-gray-800 rounded-lg overflow-hidden ${
        isMain ? "h-full" : "h-full"
      }`}
    >
      {/* 비디오 스트림 */}
      {participant.isVideoOn ? (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          {/* 실제로는 video 엘리먼트가 여기에 들어감 */}
          <div className="text-white text-opacity-70">
            📹 {participant.name}의 비디오
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-white" />
          </div>
          <span className="text-white font-medium">{participant.name}</span>
        </div>
      )}

      {/* 참가자 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium text-sm">
              {participant.name}
            </span>
            {participant.role === "expert" && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                전문가
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* 마이크 상태 */}
            <div
              className={`p-1 rounded ${
                participant.isAudioOn ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {participant.isAudioOn ? (
                <Mic className="w-3 h-3 text-white" />
              ) : (
                <MicOff className="w-3 h-3 text-white" />
              )}
            </div>

            {/* 비디오 상태 */}
            <div
              className={`p-1 rounded ${
                participant.isVideoOn ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {participant.isVideoOn ? (
                <Video className="w-3 h-3 text-white" />
              ) : (
                <VideoOff className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 로컬 참가자가 아닐 때 음소거 컨트롤 */}
      {!isLocal && showControls && (
        <div className="absolute top-2 right-2">
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-full ${
              isMuted ? "bg-red-600" : "bg-gray-600 bg-opacity-50"
            } text-white hover:bg-opacity-75 transition-colors`}
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* 발표 중 표시 */}
      {participant.isPresenting && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          발표 중
        </div>
      )}

      {/* 연결 상태 표시 */}
      <div
        className={`absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${
          participant.connectionStatus === "good"
            ? "bg-green-500"
            : participant.connectionStatus === "poor"
              ? "bg-yellow-500"
              : "bg-red-500"
        }`}
      />
    </div>
  );
};

export default ParticipantVideo;
