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
  Play,
  Pause,
  CheckCircle,
  Calendar,
  FileText,
  Headphones,
} from "lucide-react";
import { ConsultationWithSessions, ConsultationSession } from "@/types";

interface MultiSessionConsultationProps {
  consultation: ConsultationWithSessions;
  onEndSession: () => void;
  isExpertView?: boolean; // 전문가 뷰 모드 여부
}

export default function MultiSessionConsultation({
  consultation,
  onEndSession,
  isExpertView = false,
}: MultiSessionConsultationProps) {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'expert' | 'client';
    message: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file';
  }>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionTranscript, setSessionTranscript] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 세션 설정 (첫 번째 예정된 세션 또는 진행 중인 세션)
  useEffect(() => {
    const scheduledSession = consultation.sessions.find(s => s.status === 'scheduled');
    const inProgressSession = consultation.sessions.find(s => s.status === 'in_progress');
    
    if (inProgressSession) {
      setCurrentSession(inProgressSession);
      setIsSessionActive(true);
    } else if (scheduledSession) {
      setCurrentSession(scheduledSession);
    }
  }, [consultation.sessions]);

  // 세션 타이머
  useEffect(() => {
    if (isSessionActive && currentSession) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isSessionActive, currentSession]);

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 세션 시작
  const startSession = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/consultation-sessions/${currentSession.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsSessionActive(true);
        setSessionTime(0);
        // 세션 정보 새로고침
        const updatedSession = await fetch(`/api/consultation-sessions/${currentSession.id}`);
        const sessionData = await updatedSession.json();
        if (sessionData.success) {
          setCurrentSession(sessionData.data.session);
        }
      }
    } catch (error) {
      console.error('세션 시작 중 오류:', error);
    }
  };

  // 세션 종료
  const endSession = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/consultation-sessions/${currentSession.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: sessionNotes,
          transcript: sessionTranscript,
          recordingUrl: isRecording ? `recording_${currentSession.id}_${Date.now()}.mp4` : undefined,
          attachments: JSON.stringify(attachments)
        }),
      });

      if (response.ok) {
        setIsSessionActive(false);
        setShowSummary(true);
        // 세션 정보 새로고침
        const updatedSession = await fetch(`/api/consultation-sessions/${currentSession.id}`);
        const sessionData = await updatedSession.json();
        if (sessionData.success) {
          setCurrentSession(sessionData.data.session);
        }
      }
    } catch (error) {
      console.error('세션 종료 중 오류:', error);
    }
  };

  // 메시지 전송
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: isExpertView ? 'expert' : 'client',
      message: newMessage,
      timestamp: new Date(),
      type: 'text' as const,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 세션 상태에 따른 버튼 렌더링
  const renderSessionControls = () => {
    if (!currentSession) return null;

    switch (currentSession.status) {
      case 'scheduled':
        return (
          <button
            onClick={startSession}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            세션 시작
          </button>
        );
      
      case 'in_progress':
        return (
          <div className="flex gap-3">
            <button
              onClick={endSession}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Square className="w-5 h-5" />
              세션 종료
            </button>
            <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg">
              <Clock className="w-5 h-5" />
              {formatTime(sessionTime)}
            </div>
          </div>
        );
      
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">세션 완료</span>
            <span className="text-sm text-gray-500">
              ({currentSession.duration}분)
            </span>
          </div>
        );
      
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <X className="w-5 h-5" />
            <span className="font-medium">세션 취소됨</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (showSummary) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">상담 요약</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* 세션 정보 */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">세션 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">세션 번호</label>
                <p className="font-medium">{currentSession?.sessionNumber}회차</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">진행 시간</label>
                <p className="font-medium">{currentSession?.duration}분</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">시작 시간</label>
                <p className="font-medium">
                  {currentSession?.startTime ? new Date(currentSession.startTime).toLocaleString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">종료 시간</label>
                <p className="font-medium">
                  {currentSession?.endTime ? new Date(currentSession.endTime).toLocaleString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 세션 노트 */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">세션 노트</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentSession?.notes || '세션 노트가 없습니다.'}
            </p>
          </div>

          {/* 대화 기록 */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">대화 기록</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentSession?.transcript || '대화 기록이 없습니다.'}
            </p>
          </div>

          {/* 첨부 파일 */}
          {currentSession?.attachments && currentSession.attachments !== '[]' && (
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">첨부 파일</h3>
              <div className="space-y-2">
                {JSON.parse(currentSession.attachments).map((file: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{file}</span>
                    <button className="ml-auto text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-6">
          <button
            onClick={onEndSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            상담 종료
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onEndSession}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {consultation.consultationType === 'video' ? (
                  <Video className="w-5 h-5 text-blue-600" />
                ) : consultation.consultationType === 'voice' ? (
                  <Phone className="w-5 h-5 text-blue-600" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {consultation.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {isExpertView ? consultation.client?.name : consultation.expert?.name}
                </p>
              </div>
            </div>
          </div>
          {renderSessionControls()}
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {consultation.sessions.map((session, index) => (
            <button
              key={session.id}
              onClick={() => setCurrentSession(session)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                currentSession?.id === session.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {session.sessionNumber}회차
              {session.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {session.status === 'in_progress' && <Play className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex">
        {/* 채팅/통화 영역 */}
        <div className="flex-1 flex flex-col">
          {consultation.consultationType === 'chat' ? (
            // 채팅 인터페이스
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === (isExpertView ? 'expert' : 'client') ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === (isExpertView ? 'expert' : 'client')
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {isSessionActive && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 비디오/음성 통화 인터페이스
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-white">
              <div className="text-center mb-8">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {consultation.consultationType === 'video' ? (
                    <Video className="w-16 h-16" />
                  ) : (
                    <Headphones className="w-16 h-16" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isExpertView ? consultation.client?.name : consultation.expert?.name}
                </h3>
                <p className="text-gray-400">
                  {consultation.consultationType === 'video' ? '비디오 통화' : '음성 통화'}
                </p>
              </div>

              {isSessionActive && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-colors ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  
                  {consultation.consultationType === 'video' && (
                    <button
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={`p-4 rounded-full transition-colors ${
                        isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 세션 노트 영역 */}
        {isSessionActive && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-4">세션 노트</h3>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="세션 노트를 작성하세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            
            <h4 className="text-md font-medium mb-2 mt-4">대화 기록</h4>
            <textarea
              value={sessionTranscript}
              onChange={(e) => setSessionTranscript(e.target.value)}
              placeholder="대화 내용을 기록하세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
