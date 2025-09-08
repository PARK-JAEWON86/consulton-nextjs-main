"use client";

import { Mic, MicOff } from "lucide-react";

interface MuteButtonProps {
  isAudioOn: boolean;
  onToggle: () => void;
}

const MuteButton = ({ isAudioOn, onToggle }: MuteButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={`p-3 rounded-full transition-colors ${
        isAudioOn
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
      title={isAudioOn ? "마이크 끄기" : "마이크 켜기"}
    >
      {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
    </button>
  );
};

export default MuteButton;
