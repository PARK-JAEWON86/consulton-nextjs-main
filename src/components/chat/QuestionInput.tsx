"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const QuestionInput = ({
  value,
  onChange,
  onSend,
  placeholder = "질문을 입력하세요...",
  disabled = false,
}: QuestionInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      onChange("");
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="relative">
      {/* 메인 입력 영역 */}
      <div className="flex items-end space-x-3 bg-white border border-gray-300 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {/* 텍스트 입력 영역 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              if (!disabled) {
                onChange(e.target.value);
                adjustTextareaHeight();
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full resize-none border-0 outline-none focus:ring-0 text-sm placeholder-gray-500 bg-transparent ${
              disabled ? "cursor-not-allowed text-gray-400" : ""
            }`}
            rows={1}
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            value.trim() && !disabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          title="전송 (Enter)"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* 도움말 텍스트 */}
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
        <span>{value.length}/2000</span>
      </div>
    </div>
  );
};

export default QuestionInput;
