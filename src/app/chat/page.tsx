"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Plus, Mic, Bot, User, X, Image, File } from "lucide-react";
import ServiceLayout from "@/components/layout/ServiceLayout";
import { eventBus, CREDIT_EVENTS, CHAT_EVENTS } from "@/utils/eventBus";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    id: string;
    name: string;
    type: 'image' | 'file';
    url: string;
    size?: number;
  }>;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  // const [isLoading, setIsLoading] = useState(false); // 로딩 상태 제거
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // 인증 상태 확인 완료 여부
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [aiUsageData, setAiUsageData] = useState<any>(null);
  const [isLoadingAIUsage, setIsLoadingAIUsage] = useState(true);
  
  // 이벤트 기반 새로고침 함수 (훅 대신 직접 구현)
  const registerRefreshFunction = useCallback((refreshFn: () => void) => {
    // 이벤트 리스너 등록
    const handleEvent = () => refreshFn();
    const unsubscribe = eventBus.subscribe(CREDIT_EVENTS.AI_USAGE_UPDATED, handleEvent);
    
    // 클린업 함수 반환
    return unsubscribe;
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 먼저 로컬 스토리지에서 확인
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          try {
            const user = JSON.parse(storedUser);
            const isAuth = JSON.parse(storedAuth);
            
            if (isAuth) {
              setIsAuthenticated(true);
              setIsAuthChecked(true);
              return;
            }
          } catch (error) {
            console.error('로컬 스토리지 파싱 오류:', error);
          }
        }
        
        // API에서 앱 상태 로드
        const response = await fetch('/api/app-state');
        const result = await response.json();
        if (result.success) {
          setIsAuthenticated(result.data.isAuthenticated);
        }
        
        // 인증 상태 확인 완료
        setIsAuthChecked(true);
      } catch (error) {
        console.error('인증 상태 확인 실패:', error);
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // localStorage 변경 감지하여 인증 상태 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          const user = JSON.parse(storedUser);
          const isAuth = JSON.parse(storedAuth);
          
          setIsAuthenticated(isAuth);
        } else {
          setIsAuthenticated(false);
        }
        // 인증 상태 확인 완료
        setIsAuthChecked(true);
      } catch (error) {
        console.error('localStorage 변경 감지 시 파싱 오류:', error);
        setIsAuthenticated(false);
        setIsAuthChecked(true);
      }
    };

    // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // 커스텀 이벤트 리스너 (같은 탭에서의 변경 감지)
      window.addEventListener('authStateChanged', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('authStateChanged', handleStorageChange);
      };
    }
  }, []);

  // 스크롤 방지 효과
  useEffect(() => {
    if (!hasStartedChat) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.height = '';
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
  }, [hasStartedChat]);

  // 새채팅 시작 시 스크롤 위치 초기화
  useEffect(() => {
    if (!hasStartedChat) {
      // 새채팅 시작 시 페이지 최상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasStartedChat]);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);





  // 텍스트 영역 높이 자동 조정
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + "px";
    }
  }, []);

  // AI 사용량 데이터 가져오기
  const fetchAIUsage = useCallback(async () => {
    try {
      setIsLoadingAIUsage(true);
      const response = await fetch('/api/ai-usage');
      const result = await response.json();
      
      if (result.success) {
        setAiUsageData(result.data);
      }
    } catch (error) {
      console.error('AI 사용량 조회 실패:', error);
    } finally {
      setIsLoadingAIUsage(false);
    }
  }, []);

  // AI 사용량 초기 로드 (한 번만)
  useEffect(() => {
    fetchAIUsage();
  }, []); // 의존성 배열을 비워서 마운트 시 한 번만 실행

  // 이벤트 기반 새로고침 등록
  useEffect(() => {
    registerRefreshFunction(fetchAIUsage);
  }, [registerRefreshFunction]);

  // 초기 입력 필드 높이 자동 조정
  const adjustInitialTextareaHeight = useCallback(() => {
    const textarea = document.querySelector('textarea:not([ref])') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, []);

  // 메시지 전송 - 일반 함수로 변경하여 재생성 문제 해결
  const handleSendMessage = async () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) return;
    
    // 토큰 한도 체크
    if (aiUsageData && aiUsageData.remainingPercent <= 0) {
      alert('토큰 한도에 도달했습니다. 새채팅을 시작해주세요.');
      return;
    }

    // 즉시 입력 필드 초기화
    setInputValue("");
    
    // 텍스트 영역 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // AI 사용량 API를 통해 토큰 사용량 업데이트
    try {
      await fetch('/api/ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addTurnUsage',
          data: { totalTokens: 900 } // 평균 토큰 사용량
        })
      });
      
      // 이벤트 발행으로 다른 컴포넌트들에게 알림
      eventBus.publish(CREDIT_EVENTS.AI_USAGE_UPDATED, {
        tokensUsed: 900,
        action: 'userMessage'
      });
    } catch (error) {
      console.error('토큰 사용량 업데이트 실패:', error);
    }

    // 새로운 채팅 시작 시 aichat-sessions API에 저장
    if (messages.length === 0) {
      try {
        const chatTitle = trimmedValue.length > 30 
          ? trimmedValue.substring(0, 30) + "..." 
          : trimmedValue;
        
        // 카테고리 자동 분류 (간단한 키워드 기반)
        let category = "일반";
        const lowerContent = trimmedValue.toLowerCase();
        if (lowerContent.includes("이직") || lowerContent.includes("면접") || lowerContent.includes("커리어")) {
          category = "커리어";
        } else if (lowerContent.includes("프로젝트") || lowerContent.includes("업무") || lowerContent.includes("팀")) {
          category = "업무";
        } else if (lowerContent.includes("코딩") || lowerContent.includes("프로그래밍") || lowerContent.includes("개발")) {
          category = "개발";
        } else if (lowerContent.includes("스트레스") || lowerContent.includes("스트레스") || lowerContent.includes("균형")) {
          category = "웰빙";
        }

        // 현재 로그인된 사용자 ID 가져오기
        const storedUser = localStorage.getItem('consulton-user');
        const userId = storedUser ? JSON.parse(storedUser).id : 'anonymous';

        // aichat-sessions API를 통해 새로운 채팅 세션 생성
        const sessionResponse = await fetch('/api/aichat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: chatTitle,
            userId: userId,
            category: category
          })
        });

        if (sessionResponse.ok) {
          const sessionResult = await sessionResponse.json();
          if (sessionResult.success) {
            // 세션 ID를 로컬 스토리지에 저장하여 현재 채팅 세션 추적
            localStorage.setItem('current-chat-session', sessionResult.data.id);
            localStorage.setItem('chat-start-time', new Date().toISOString());
            
            // 첫 번째 사용자 메시지를 aichat-sessions API에 저장
            await fetch(`/api/aichat-sessions/${sessionResult.data.id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: trimmedValue,
                type: "user",
                senderId: userId,
                senderName: storedUser ? JSON.parse(storedUser).name : "사용자"
              })
            });

            // 채팅 히스토리 업데이트 이벤트 발행
            eventBus.publish(CHAT_EVENTS.CHAT_HISTORY_UPDATED, {
              action: 'newSession',
              sessionId: sessionResult.data.id
            });

            // 사이드바 채팅 기록 업데이트를 위한 이벤트 발행
            console.log('사이드바 업데이트 이벤트 발행 시작:', sessionResult.data);
            
            // CustomEvent를 사용하여 사이드바에 알림
            const chatHistoryEvent = new CustomEvent('chatHistoryUpdated', {
              detail: {
                action: 'newSession',
                session: sessionResult.data
              }
            });
            
            // 이벤트 발행 전에 약간의 지연을 두어 API 응답이 완전히 처리되도록 함
            setTimeout(() => {
              window.dispatchEvent(chatHistoryEvent);
              console.log('사이드바 업데이트 이벤트 발행 완료');
            }, 100);
          }
        }
      } catch (error) {
        console.error('AI 채팅 세션 생성 실패:', error);
      }
    }

    // AI 응답 즉시 생성
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `안녕하세요! "${trimmedValue}"에 대해 말씀해 주셨군요. 더 구체적으로 설명해 주시면 더 정확한 도움을 드릴 수 있습니다. 어떤 부분이 가장 궁금하신가요?`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, aiMessage]);

    // AI 응답 메시지를 aichat-sessions API에 저장
    try {
      const currentSessionId = localStorage.getItem('current-chat-session');
      if (currentSessionId) {
        const storedUser = localStorage.getItem('consulton-user');
        const userId = storedUser ? JSON.parse(storedUser).id : 'anonymous';
        
        await fetch(`/api/aichat-sessions/${currentSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: aiMessage.content,
            type: "ai",
            senderId: "ai",
            senderName: "AI 상담사"
          })
        });

        // 세션의 마지막 메시지와 메시지 수 업데이트
        await fetch(`/api/aichat-sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastMessage: aiMessage.content,
            messageCount: messages.length + 2 // 사용자 메시지 + AI 응답
          })
        });
      }
    } catch (error) {
      console.error('AI 응답 메시지 저장 실패:', error);
    }
    
    // AI 응답에 대한 토큰 사용량도 업데이트
    try {
      await fetch('/api/ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addTurnUsage',
          data: { totalTokens: 900 } // AI 응답 평균 토큰 사용량
        })
      });
      
      // 이벤트 발행으로 다른 컴포넌트들에게 알림
      eventBus.publish(CREDIT_EVENTS.AI_USAGE_UPDATED, {
        tokensUsed: 900,
        action: 'aiResponse'
      });
    } catch (error) {
      console.error('AI 응답 토큰 사용량 업데이트 실패:', error);
    }
    
    // setIsLoading(false); // 로딩 상태 제거
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!isComposing) {
        handleSendMessage();
      }
    }
  };

  // 초기 입력 필드 키보드 이벤트 핸들러
  const handleInitialKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (inputValue.trim() && !isComposing) {
        handleSendMessage();
        setHasStartedChat(true);
      }
    }
  };

  // 파일 선택 처리
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setShowFileUpload(false);
  }, []);

  // 파일 제거
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 파일 업로드 토글
  const toggleFileUpload = useCallback(() => {
    setShowFileUpload(!showFileUpload);
  }, [showFileUpload]);



  // 인증되지 않은 사용자는 인증 상태 확인 완료 후 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthChecked && !isAuthenticated) {
      router.push('/auth/login?redirect=/chat');
    }
  }, [isAuthChecked, isAuthenticated, router]);

  // 인증 상태 확인 중이거나 인증되지 않은 사용자는 로딩 화면 표시
  if (!isAuthChecked || !isAuthenticated) {
    return (
      <ServiceLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!isAuthChecked ? "인증 상태 확인 중..." : "로그인 페이지로 이동 중..."}
            </p>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout>
            {/* 채팅 헤더 - 항상 표시 (고정 높이) */}
      <div className="w-full h-16 bg-gray-50/95 backdrop-blur-sm sticky top-16 z-50">
        <div className="max-w-4xl mx-auto px-4 py-2 h-full">
          {hasStartedChat ? (
            // 채팅 진행 중: 새채팅 버튼 + 토큰 사용량
            <div className="flex items-center justify-between h-full">
              {/* 새채팅 버튼 */}
              <button 
                onClick={async () => {
                  // 현재 채팅 세션을 완료 상태로 변경
                  try {
                    const currentSessionId = localStorage.getItem('current-chat-session');
                    if (currentSessionId) {
                      await fetch(`/api/aichat-sessions/${currentSessionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: "completed",
                          duration: Math.floor((Date.now() - new Date(localStorage.getItem('chat-start-time') || Date.now()).getTime()) / 60000) // 분 단위
                        })
                      });
                      
                      // 로컬 스토리지에서 현재 세션 정보 제거
                      localStorage.removeItem('current-chat-session');
                      localStorage.removeItem('chat-start-time');
                    }
                  } catch (error) {
                    console.error('채팅 세션 완료 처리 실패:', error);
                  }

                  // 모든 상태 초기화
                  setMessages([]);
                  setInputValue("");
                  setHasStartedChat(false);
                  setSelectedFiles([]);
                  
                  // 페이지 최상단으로 스크롤
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  
                  // 새채팅 시작 시 이벤트 발행
                  eventBus.publish(CHAT_EVENTS.CHAT_STARTED, {
                    timestamp: new Date().toISOString()
                  });
                }}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  aiUsageData && aiUsageData.remainingPercent <= 20
                    ? 'text-red-700 hover:text-red-800 hover:bg-red-100 bg-red-50'
                    : aiUsageData && aiUsageData.remainingPercent <= 40
                      ? 'text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 bg-yellow-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>새채팅</span>
              </button>
              
              {/* 토큰 사용량 표시 */}
              <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
                {isLoadingAIUsage ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>로딩 중...</span>
                  </div>
                ) : aiUsageData ? (
                  <>
                    <div className={`w-2 h-2 rounded-full ${
                      aiUsageData.remainingPercent <= 20 ? 'bg-red-500' : 
                      aiUsageData.remainingPercent <= 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span>남은 토큰: {aiUsageData.remainingPercent}%</span>
                  </>
                ) : (
                  <span>토큰 정보 없음</span>
                )}
              </div>
            </div>
          ) : (
            // 채팅 시작 전: 빈 공간
            <div className="h-full"></div>
          )}
        </div>
      </div>
      
      <div className={`min-h-screen bg-gray-50 flex flex-col ${
        !hasStartedChat ? 'overflow-hidden' : ''
      }`} style={!hasStartedChat ? { minHeight: '100vh' } : {}}>
        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative">
          {/* 메시지 목록 - 스크롤 가능한 영역 */}
          <div className={`flex-1 px-4 py-2 space-y-6 ${
            hasStartedChat 
              ? 'overflow-y-auto pb-32' 
              : 'overflow-hidden pb-4'
          }`}>
            {messages.length === 0 && !hasStartedChat ? (
              // 초기 화면 (ChatGPT 스타일) - 스크롤 방지
              <div className="flex flex-col items-center justify-center py-12 text-center mt-8" style={{ overflow: 'hidden' }}>
                <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                  어떤 상담을 받아야 할지 모르시나요?
                </h1>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl">
                  AI 채팅 상담을 통해 먼저 문제를 정리해보세요. 전문가 매칭 전에 AI가 도움을 드릴게요
                </p>
                
                {/* AI 채팅 입력 필드 */}
                <div className="max-w-4xl w-full">
                  <div className="flex items-center space-x-3 bg-white border border-gray-300 rounded-2xl p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:shadow-lg transition-all duration-200 hover:border-gray-400">
                    {/* 첨부 파일 버튼 */}
                    <button 
                      onClick={toggleFileUpload}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 relative"
                    >
                      <Plus className="w-5 h-5" />
                      
                      {/* 파일 업로드 드롭다운 */}
                      {showFileUpload && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-10">
                          <div className="space-y-2">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <Image className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">사진 업로드</span>
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <File className="w-4 h-4 text-green-500" />
                              <span className="text-sm">파일 업로드</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </button>
                    
                    {/* 숨겨진 파일 입력 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* 텍스트 입력 영역 */}
                    <div className="flex-1 relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          adjustInitialTextareaHeight();
                        }}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false);
                          setInputValue((e.target as HTMLTextAreaElement).value);
                          adjustInitialTextareaHeight();
                        }}
                        onKeyDown={handleInitialKeyDown}
                        placeholder="상담하고 싶은 고민이나 궁금한 점을 자세히 적어주세요..."
                        className="w-full resize-none border-0 outline-none focus:ring-0 text-base placeholder-gray-500 bg-transparent min-h-[24px] max-h-[200px]"
                        rows={1}
                        style={{ minHeight: "24px" }}
                      />
                    </div>
                    
                    {/* 음성 입력 버튼 */}
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                      <Mic className="w-5 h-5" />
                    </button>
                    
                    {/* 전송 버튼 */}
                    <button 
                                                                    onClick={() => {
                        if (inputValue.trim() && !isComposing) {
                          handleSendMessage();
                          setHasStartedChat(true);
                        }
                      }}
                      disabled={!inputValue.trim()}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        inputValue.trim()
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* 선택된 파일 표시 */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2">
                          <div className="flex items-center space-x-2 flex-1">
                            {file.type.startsWith('image/') ? (
                              <Image className="w-4 h-4 text-blue-500" />
                            ) : (
                              <File className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 입력 예시 카드들 */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">💡 질문예시</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          "법무사와 상담하고 싶은데 어떤 서비스를 받을 수 있나요?"
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          "부동산 계약 관련해서 도움이 필요해요. 어디서부터 시작해야 할까요?"
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          "사업자 등록과 세무 관련해서 궁금한 점이 있어요"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI 상담 어시스턴트 경고문 */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      AI 상담 어시스턴트는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 메시지들 표시 - 첫 질문 후에도 중앙 정렬 유지
              <div className="flex flex-col items-center justify-center min-h-[40vh] pt-12">
                <div className="w-full max-w-4xl space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'user' ? (
                        // 사용자 메시지 - 말풍선 스타일
                        <div className="flex items-start space-x-3 max-w-[80%] flex-row-reverse space-x-reverse">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-blue-500 text-white rounded-2xl px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // AI 응답 - 일반 텍스트 스타일 (GPT와 동일)
                        <div className="w-full max-w-4xl">
                          <div className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 로딩 인디케이터 제거 */}

            <div ref={messagesEndRef} />
          </div>

          {/* 하단 입력 필드 - 고정 위치 */}
          <div className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50 py-4 transition-all duration-300 ease-in-out z-20 ${
            hasStartedChat 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-full pointer-events-none'
          } lg:left-64`}>
            <div className="max-w-4xl mx-auto w-full px-4">
              <div className="flex items-end space-x-3 bg-gray-50 border border-gray-300 rounded-2xl p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:shadow-lg transition-all duration-200 hover:border-gray-400 w-full shadow-lg">
                {/* 첨부 파일 버튼 */}
                <button 
                  onClick={toggleFileUpload}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 relative"
                >
                  <Plus className="w-5 h-5" />
                  
                  {/* 파일 업로드 드롭다운 */}
                  {showFileUpload && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-10">
                      <div className="space-y-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <Image className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">사진 업로드</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <File className="w-4 h-4 text-green-500" />
                          <span className="text-sm">파일 업로드</span>
                        </button>
                      </div>
                    </div>
                  )}
                </button>

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* 텍스트 입력 영역 */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      adjustTextareaHeight();
                    }}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      setInputValue((e.target as HTMLTextAreaElement).value);
                      adjustTextareaHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="무엇이든 물어보세요..."
                    className="w-full resize-none border-0 outline-none focus:ring-0 text-base placeholder-gray-500 bg-transparent min-h-[24px] max-h-[300px]"
                    rows={1}
                    style={{ minHeight: "24px" }}
                  />
                </div>

                {/* 음성 입력 버튼 */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </button>

                {/* 전송 버튼 */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inputValue.trim() && !isComposing) {
                      handleSendMessage();
                    }
                  }}
                  disabled={!inputValue.trim()}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    inputValue.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* 선택된 파일 표시 */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2 flex-1">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-500" />
                        ) : (
                          <File className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* AI 상담 어시스턴트 경고문 */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  AI 상담 어시스턴트는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ServiceLayout>
  );
}