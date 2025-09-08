"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Phone,
  Video,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone as PhoneIcon,
  PhoneOff,
  Send,
  Paperclip,
  Download,
  Share2,
  X,
  Clock,
  User,
  AlertCircle,
  Square,
  ArrowLeft,
} from "lucide-react";
import ConsultationSummary from "./ConsultationSummary";

interface ConsultationSessionProps {
  consultation: {
    id: string;
    expertId?: string;
    expertName: string;
    expertAvatar: string;
    expertSpecialty: string;
    clientId?: string;
    clientName?: string;
    clientAvatar?: string;
    topic: string;
    duration: number;
    consultationType: "chat" | "voice" | "video";
    price: number;
  };
  onEndSession: () => void;
  isExpertView?: boolean; // 전문가 뷰 모드 여부
}

export default function ConsultationSession({
  consultation,
  onEndSession,
  isExpertView = false,
}: ConsultationSessionProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: "user" | "expert";
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [showSummary, setShowSummary] = useState(false);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 상담 시작
  const handleStartSession = () => {
    try {
      setIsSessionActive(true);
      setConnectionStatus("connecting");
      
      // 상담 세션 시작 시 브라우저 히스토리에 추가
      const sessionUrl = `/expert-consultation/session/${consultation.id}`;
      window.history.pushState(
        { 
          consultationId: consultation.id, 
          consultationName: consultation.expertName,
          fromPage: '/expert-consultation'
        }, 
        '', 
        sessionUrl
      );
    } catch (error) {
      console.error('상담 시작 중 오류 발생:', error);
      // 오류 발생 시 상태 복원
      setIsSessionActive(false);
      setConnectionStatus("disconnected");
      return;
    }
    
    // 연결 시뮬레이션
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus("connected");
      
      // 입장 메시지 (전문가 뷰 모드에 따라 다르게 표시)
      const entryMessage = isExpertView 
        ? `${consultation.clientName || '클라이언트'}님이 입장했습니다. ${consultation.consultationType === "chat" ? "채팅" : consultation.consultationType === "voice" ? "음성" : "화상"} 상담을 시작하겠습니다.`
        : `${consultation.expertName} 전문가가 입장했습니다. ${consultation.consultationType === "chat" ? "채팅" : consultation.consultationType === "voice" ? "음성" : "화상"} 상담을 시작하겠습니다. 채팅 기능도 함께 사용할 수 있습니다.`;
      
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: isExpertView ? "expert" : "expert",
        message: entryMessage,
        timestamp: new Date(),
      }]);
    }, 2000);

    // 타이머 시작
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
  };

  // 상담 종료
  const handleEndSession = useCallback(() => {
    try {
      if (confirm("상담을 종료하시겠습니까?")) {
        // 상태 정리
        setIsSessionActive(false);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        setIsRecording(false);
        
        // 타이머 정리
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
        
        // 상담 완료 시 전문가 데이터 업데이트 이벤트 발생
        try {
          window.dispatchEvent(new CustomEvent('expertDataUpdated', {
            detail: { 
              expertId: consultation.id, // id를 expertId로 사용
              action: 'sessionCompleted',
              duration: sessionTime,
              sessionType: consultation.consultationType
            }
          }));
        } catch (error) {
          console.error('이벤트 발생 실패:', error);
        }
        
        // 상담 요약 표시
        setShowSummary(true);
      }
    } catch (error) {
      console.error('상담 종료 중 오류 발생:', error);
      // 오류 발생 시에도 상태 정리
      setIsSessionActive(false);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setIsRecording(false);
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      
      // 상담 요약 표시
      setShowSummary(true);
    }
  }, [consultation.id, consultation.consultationType, sessionTime]);

  // 상담 요약 닫기
  const handleCloseSummary = () => {
    setShowSummary(false);
    // 상담 세션 종료 시 원래 페이지로 돌아가기
    try {
      window.history.back();
    } catch (error) {
      console.log('히스토리 이동 실패, 직접 이동합니다.');
      // 히스토리 이동 실패 시 직접 이동
      window.location.href = '/expert-consultation';
    }
    // 부모 컴포넌트에 상담 종료 알림
    onEndSession();
  };

  // 메시지 전송
  const handleSendMessage = () => {
    try {
      if (!newMessage.trim() || !isConnected) return;

      const userMessage = {
        id: Date.now().toString(),
        sender: isExpertView ? "expert" as const : "user" as const,
        message: newMessage,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, userMessage]);
      const currentMessage = newMessage; // 메시지 내용 저장
      setNewMessage("");

      // 응답 시뮬레이션 (전문가 뷰 모드에 따라 다르게)
      setTimeout(() => {
        const responseMessage = isExpertView 
          ? `네, 말씀해주신 내용에 대해 자세히 설명드리겠습니다. ${currentMessage}에 관련하여...`
          : `네, 말씀해주신 내용에 대해 자세히 설명드리겠습니다. ${currentMessage}에 관련하여...`;
        
        const response = {
          id: (Date.now() + 1).toString(),
          sender: isExpertView ? "user" as const : "expert" as const,
          message: responseMessage,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, response]);
      }, 1000 + Math.random() * 2000);
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
    }
  };

  // 녹화 시작/중지
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // 음소거 토글
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 비디오 토글
  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 채팅 스크롤을 맨 아래로
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, []);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 상담 세션 중에 뒤로가기를 누른 경우
      if (isSessionActive) {
        if (confirm("진행 중인 상담이 있습니다. 정말 나가시겠습니까?")) {
          handleEndSession();
        } else {
          // 취소한 경우 현재 세션 상태 유지
          try {
            const sessionUrl = `/expert-consultation/session/${consultation.id}`;
            window.history.pushState(
              { 
                consultationId: consultation.id, 
                consultationName: consultation.expertName,
                fromPage: '/expert-consultation'
              }, 
              '', 
              sessionUrl
            );
          } catch (error) {
            console.log('히스토리 상태 복원 실패');
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSessionActive, consultation.id, consultation.expertName, handleEndSession]);

  // 상담 요약이 표시되는 경우
  if (showSummary) {
    return (
      <ConsultationSummary
        consultation={consultation}
        sessionData={{
          duration: sessionTime,
          isRecorded: isRecording,
          chatMessageCount: consultation.consultationType === "chat" ? chatMessages.length : undefined,
        }}
        onClose={handleCloseSummary}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* 상담 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                try {
                  if (confirm("진행 중인 상담이 있습니다. 정말 나가시겠습니까?")) {
                    handleEndSession();
                  }
                } catch (error) {
                  console.error('상담 종료 처리 중 오류 발생:', error);
                  // 오류 발생 시 강제로 상담 종료
                  handleEndSession();
                }
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="상담 종료"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {isExpertView ? (consultation.clientAvatar || '클') : consultation.expertAvatar}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isExpertView ? `${consultation.clientName || '클라이언트'}님` : `${consultation.expertName} 전문가`}
              </h3>
              <p className="text-sm text-gray-600">
                {isExpertView ? `${consultation.duration}분 상담` : `${consultation.expertSpecialty} • ${consultation.duration}분`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 연결 상태 */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" :
                connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === "connected" ? "연결됨" :
                 connectionStatus === "connecting" ? "연결 중..." : "연결 끊김"}
              </span>
            </div>
            
            {/* 세션 타이머 */}
            {isSessionActive && (
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-mono text-gray-900">
                  {formatTime(sessionTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상담 콘텐츠 영역 */}
      <div className="flex-1 flex">
        {/* 메인 상담 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 상담 방식별 메인 영역 */}
          <div className="h-80 bg-gray-900 flex items-center justify-center relative">
            {!isSessionActive ? (
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-lg font-medium">상담을 시작하려면 시작 버튼을 클릭하세요</p>
              </div>
            ) : !isConnected ? (
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">전문가와 연결 중...</p>
              </div>
            ) : (
              <>
                {/* 화상 상담 시에만 사용자 비디오 표시 */}
                {consultation.consultationType === "video" && (
                  <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                    {isVideoOn ? (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* 전문가 비디오/음성 영역 */}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-96 h-72 bg-gray-800 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {/* 상담 방식 표시 */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {consultation.consultationType === "chat" && "채팅 상담"}
                  {consultation.consultationType === "voice" && "음성 상담"}
                  {consultation.consultationType === "video" && "화상 상담"}
                </div>
              </>
            )}
          </div>

          {/* 채팅 영역 - 모든 상담 방식에 기본 포함 */}
          <div className="h-64 bg-white flex flex-col border-t border-gray-200">
            {/* 채팅 메시지 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">상담을 시작하면 메시지를 주고받을 수 있습니다</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      (isExpertView && message.sender === "expert") || (!isExpertView && message.sender === "user") 
                        ? "justify-end" 
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        (isExpertView && message.sender === "expert") || (!isExpertView && message.sender === "user")
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        (isExpertView && message.sender === "expert") || (!isExpertView && message.sender === "user")
                          ? "text-blue-200" 
                          : "text-gray-500"
                      }`}>
                        {message.timestamp.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 메시지 입력 */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isExpertView ? "클라이언트에게 메시지를 보내세요..." : "메시지를 입력하세요..."}
                  disabled={!isConnected}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바: 상담 정보 및 컨트롤 */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
          {/* 상담 정보 */}
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">상담 정보</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">주제:</span> {consultation.topic}</p>
              <p><span className="font-medium">상담료:</span> {consultation.price} 크레딧</p>
              <p><span className="font-medium">상담 방식:</span> {
                consultation.consultationType === "chat" ? "채팅" :
                consultation.consultationType === "voice" ? "음성" : "화상"
              }</p>
              <p><span className="font-medium">채팅:</span> <span className="text-green-600">활성화</span></p>
              {isExpertView && consultation.clientName && (
                <p><span className="font-medium">클라이언트:</span> {consultation.clientName}</p>
              )}
            </div>
          </div>

          {/* 상담 컨트롤 */}
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">상담 컨트롤</h4>
            
            {!isSessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                상담 시작
              </button>
            ) : (
              <div className="space-y-3">
                {/* 음소거 컨트롤 (음성/화상 상담 시) */}
                {(consultation.consultationType === "voice" || consultation.consultationType === "video") && (
                  <button
                    onClick={toggleMute}
                    className={`w-full py-2 px-3 rounded-lg border ${
                      isMuted
                        ? "bg-red-100 border-red-300 text-red-700"
                        : "bg-gray-100 border-gray-300 text-gray-700"
                    } hover:bg-opacity-80`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 mr-2 inline" /> : <Mic className="w-4 h-4 mr-2 inline" />}
                    {isMuted ? "음소거 해제" : "음소거"}
                  </button>
                )}
                
                {/* 비디오 컨트롤 (화상 상담 시에만) */}
                {consultation.consultationType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-full py-2 px-3 rounded-lg border ${
                      !isVideoOn
                        ? "bg-red-100 border-red-300 text-red-700"
                        : "bg-gray-100 border-gray-300 text-gray-700"
                    } hover:bg-opacity-80`}
                  >
                    {!isVideoOn ? <VideoOff className="w-4 h-4 mr-2 inline" /> : <VideoIcon className="w-4 h-4 mr-2 inline" />}
                    {!isVideoOn ? "카메라 켜기" : "카메라 끄기"}
                  </button>
                )}

                {/* 녹화 컨트롤 */}
                <button
                  onClick={toggleRecording}
                  className={`w-full py-2 px-4 rounded-lg border ${
                    isRecording
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "bg-gray-100 border-gray-300 text-gray-700"
                  } hover:bg-opacity-80`}
                >
                  {isRecording ? "녹화 중지" : "녹화 시작"}
                </button>

                {/* 상담 종료 */}
                <button
                  onClick={handleEndSession}
                  className="w-full bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <Square className="w-4 h-4 mr-2 inline" />
                  상담 종료
                </button>
              </div>
            )}
          </div>

          {/* 빠른 도구 */}
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">도구</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <Paperclip className="w-4 h-4" />
                <span>파일 첨부</span>
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>상담 기록 다운로드</span>
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>화면 공유</span>
              </button>
            </div>
          </div>

          {/* 상담 도움말 */}
          <div className="p-3">
            <h4 className="font-medium text-gray-900 mb-3">도움말</h4>
            <div className="text-xs text-gray-600 space-y-2">
              <p>• 상담 중 문제가 발생하면 새로고침하세요</p>
              <p>• 음성/화상 상담 시 마이크와 카메라 권한을 확인하세요</p>
              <p>• 상담 내용은 자동으로 저장됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
