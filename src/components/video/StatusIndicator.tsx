"use client";

import { Wifi, WifiOff, Signal } from "lucide-react";

interface StatusIndicatorProps {
  status?: "connected" | "connecting" | "disconnected";
  quality?: "excellent" | "good" | "poor" | "bad";
}

const StatusIndicator = ({
  status = "connected",
  quality = "good",
}: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: Wifi,
          text: "연결됨",
          color: "text-green-500",
          bgColor: "bg-green-100",
        };
      case "connecting":
        return {
          icon: Signal,
          text: "연결 중...",
          color: "text-yellow-500",
          bgColor: "bg-yellow-100",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          text: "연결 끊김",
          color: "text-red-500",
          bgColor: "bg-red-100",
        };
      default:
        return {
          icon: Wifi,
          text: "알 수 없음",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
    }
  };

  const getQualityBars = () => {
    const bars = [];
    const barCount =
      quality === "excellent"
        ? 4
        : quality === "good"
          ? 3
          : quality === "poor"
            ? 2
            : 1;

    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 rounded-full ${
            i < barCount ? "bg-current" : "bg-gray-300"
          }`}
          style={{ height: `${(i + 1) * 3 + 2}px` }}
        />,
      );
    }

    return bars;
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
    >
      <StatusIcon className="h-4 w-4" />
      <span>{config.text}</span>

      {status === "connected" && (
        <div className="flex items-end space-x-0.5 ml-2">
          {getQualityBars()}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
