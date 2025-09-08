"use client";

import { useState, useEffect } from "react";
import { Clock, User, Search, Filter } from "lucide-react";
import { ChatSession } from "../../types";
import { AIChatService } from "../../services/AIChatService";

const ChatHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, today, week, month
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatService = AIChatService.getInstance();

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 사용자 ID는 인증 시스템에서 가져와야 함
      const userId = "user1"; // 임시 사용자 ID
      
      const result = await chatService.getChatSessions({
        userId,
        limit: 20,
      });
      
      setChatSessions(result.data);
    } catch (err) {
      console.error('채팅 세션 로드 오류:', err);
      setError('채팅 세션을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadChatSessions();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userId = "user1";
      const result = await chatService.getChatSessions({
        userId,
        search: searchTerm,
        limit: 20,
      });
      
      setChatSessions(result.data);
    } catch (err) {
      console.error('채팅 세션 검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = (sessions: ChatSession[]) => {
    let filtered = sessions;

    // 날짜 필터링
    const now = new Date();
    switch (selectedFilter) {
      case "today":
        filtered = filtered.filter((session) => {
          const sessionDate = new Date(session.timestamp);
          return sessionDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((session) => session.timestamp >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((session) => session.timestamp >= monthAgo);
        break;
      default:
        break;
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  };

  const handleSessionClick = (sessionId: string) => {
    // 해당 세션으로 이동
    console.log("Navigate to session:", sessionId);
    // 실제로는 라우터를 사용하여 채팅 페이지로 이동해야 함
    // router.push(`/chat/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('정말로 이 채팅 세션을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await chatService.deleteChatSession(sessionId);
      // 삭제 후 목록 새로고침
      await loadChatSessions();
    } catch (err) {
      console.error('세션 삭제 오류:', err);
      alert('세션 삭제에 실패했습니다.');
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 30) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "in_progress":
        return "진행 중";
      case "pending":
        return "대기 중";
      case "cancelled":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  const filteredSessions = filterSessions(chatSessions);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg p-3 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadChatSessions}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="상담 내역 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            검색
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>
      </div>

      {/* 채팅 세션 목록 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSessionClick(session.id)}
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {session.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{session.expert?.name || "AI 상담사"}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{session.duration}분</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      session.status,
                    )}`}
                  >
                    {getStatusText(session.status)}
                  </span>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {session.lastMessage || "메시지가 없습니다"}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span>{getRelativeTime(session.timestamp)}</span>
                  <span>{session.messageCount}개 메시지</span>
                </div>
                <span className="font-medium">
                  {session.creditsUsed} 크레딧
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Search className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">
              {searchTerm ? "검색 결과가 없습니다" : "상담 내역이 없습니다"}
            </p>
          </div>
        )}
      </div>

      {/* 전체 보기 버튼 */}
      {filteredSessions.length > 0 && (
        <div className="pt-2 border-t">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2">
            전체 상담 내역 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
