"use client";

import { useState, useEffect } from "react";
import ParticipantVideo from "./ParticipantVideo";

interface Participant {
  id: string;
  name: string;
  isPresenting?: boolean;
  isScreenSharing?: boolean;
  isVideoOn?: boolean;
  isAudioOn?: boolean;
  stream?: MediaStream;
}

interface VideoGridProps {
  participants: Participant[];
  isScreenSharing?: boolean;
}

const VideoGrid = ({ participants, isScreenSharing }: VideoGridProps) => {
  const [layout, setLayout] = useState("grid"); // 'grid', 'speaker', 'sidebar'

  // 화면 공유 중인 참가자 찾기
  const presentingParticipant = participants.find((p) => p.isPresenting);
  const otherParticipants = participants.filter((p) => !p.isPresenting);

  // 레이아웃에 따른 그리드 클래스
  const getGridClass = () => {
    if (isScreenSharing || presentingParticipant) {
      return "grid-cols-1"; // 화면 공유 시 전체 화면
    }

    switch (participants.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-3";
    }
  };

  return (
    <div className="h-full bg-gray-900 relative">
      {/* 메인 비디오 영역 */}
      <div className={`h-full grid gap-2 p-4 ${getGridClass()}`}>
        {participants.map((participant) => (
          <ParticipantVideo
            key={participant.id}
            participant={{
              ...participant,
              isVideoOn: participant.isVideoOn ?? true,
              isAudioOn: participant.isAudioOn ?? true,
            }}
            isMain={participants.length <= 2 || !!participant.isPresenting}
            showControls={true}
          />
        ))}
      </div>

      {/* 화면 공유 중일 때 참가자 썸네일 */}
      {(isScreenSharing || presentingParticipant) &&
        otherParticipants.length > 0 && (
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {otherParticipants.slice(0, 3).map((participant) => (
              <div key={participant.id} className="w-32 h-24">
                <ParticipantVideo
                  participant={{
                    ...participant,
                    isVideoOn: participant.isVideoOn ?? true,
                    isAudioOn: participant.isAudioOn ?? true,
                  }}
                  isMain={false}
                  showControls={false}
                />
              </div>
            ))}
            {otherParticipants.length > 3 && (
              <div className="w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">
                  +{otherParticipants.length - 3}
                </span>
              </div>
            )}
          </div>
        )}

      {/* 연결 상태 표시 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
        {participants.length}명 참여 중
      </div>
    </div>
  );
};

export default VideoGrid;
