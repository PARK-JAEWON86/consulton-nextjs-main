"use client";

import { Video, VideoOff } from "lucide-react";

interface VideoToggleButtonProps {
  isVideoOn: boolean;
  onToggle: () => void;
}

const VideoToggleButton = ({ isVideoOn, onToggle }: VideoToggleButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={`p-3 rounded-full transition-colors ${
        isVideoOn
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
      title={isVideoOn ? "비디오 끄기" : "비디오 켜기"}
    >
      {isVideoOn ? (
        <Video className="h-5 w-5" />
      ) : (
        <VideoOff className="h-5 w-5" />
      )}
    </button>
  );
};

export default VideoToggleButton;
