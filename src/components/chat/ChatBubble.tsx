"use client";

import { Bot, User } from "lucide-react";
import { AIChatMessage, ExtendedChatMessage } from "@/types";

interface ChatBubbleProps {
  message: AIChatMessage | ExtendedChatMessage;
}

// 타입 가드 함수
const isExtendedChatMessage = (message: AIChatMessage | ExtendedChatMessage): message is ExtendedChatMessage => {
  return 'expertInfo' in message;
};

const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.type === "user";
  const isExpert = message.type === "expert";
  const isAI = message.type === "ai";
  const isSystem = message.type === "system";

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex ${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-start space-x-3 max-w-[70%]`}
      >
        {/* 아바타 */}
        {!isUser && (
          <div className="flex-shrink-0">
            {isAI ? (
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <Bot className="text-white w-4 h-4" />
              </div>
            ) : isExtendedChatMessage(message) && message.expertInfo?.avatar ? (
              <img
                src={message.expertInfo.avatar}
                alt={message.expertInfo.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {isExtendedChatMessage(message) && message.expertInfo?.name?.charAt(0) || "E"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 메시지 내용 */}
        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-lg max-w-full ${
              isUser
                ? "bg-blue-500 text-white rounded-br-none"
                : isAI
                ? "bg-gray-100 text-gray-900 rounded-bl-none"
                : "bg-green-100 text-gray-900 rounded-bl-none"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          
          {/* 시간 표시 */}
          <div className={`text-xs text-gray-500 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
