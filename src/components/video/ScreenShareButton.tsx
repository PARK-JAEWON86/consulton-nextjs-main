"use client";

import { Monitor, MonitorOff } from "lucide-react";

interface ScreenShareButtonProps {
  isScreenSharing: boolean;
  onToggle: () => void;
}

const ScreenShareButton = ({
  isScreenSharing,
  onToggle,
}: ScreenShareButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={`p-3 rounded-full transition-colors ${
        isScreenSharing
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-700 text-white hover:bg-gray-600"
      }`}
      title={isScreenSharing ? "화면 공유 중지" : "화면 공유 시작"}
    >
      {isScreenSharing ? (
        <MonitorOff className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
    </button>
  );
};

export default ScreenShareButton;
