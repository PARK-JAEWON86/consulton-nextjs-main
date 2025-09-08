"use client";

import { MAX_FREE_MESSAGES } from "@/constants/chatQuota";

interface ChatQuotaBarProps {
  usedMessages: number;
}

const ChatQuotaBar: React.FC<ChatQuotaBarProps> = ({ usedMessages }) => {
  const percent = Math.max(
    0,
    ((MAX_FREE_MESSAGES - usedMessages) / MAX_FREE_MESSAGES) * 100,
  );

  return (
    <div>
      <div className="w-full bg-gray-200 rounded">
        <div className="h-1 bg-blue-500" style={{ width: `${percent}%` }}></div>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {Math.round(percent)}% 무료 채팅 남음
      </p>
    </div>
  );
};

export default ChatQuotaBar;
