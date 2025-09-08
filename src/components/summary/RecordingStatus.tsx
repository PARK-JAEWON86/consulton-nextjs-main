"use client";

import {
  Play,
  Pause,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface RecordingStatusProps {
  status?: "recording" | "processing" | "completed" | "failed";
}

const RecordingStatus = ({ status = "completed" }: RecordingStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "recording":
        return {
          icon: (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          ),
          text: "녹화 중",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "processing":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "처리 중",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "완료",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "failed":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: "실패",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "알 수 없음",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color}`}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};

export default RecordingStatus;
