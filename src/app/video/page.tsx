"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Mic,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  Paperclip,
  Users,
  Clock,
  User,
  Send,
} from "lucide-react";
import ServiceLayout from "@/components/layout/ServiceLayout";

export default function VideoPage() {
  // 상담 모드 상태
  const [consultationMode, setConsultationMode] = useState("video"); // "chat", "voice", "video"
  const [showModeSelection, setShowModeSelection] = useState(false);

  // 사용자 개별 컨트롤 상태
  const [userControls, setUserControls] = useState({
    isVideoOn: true,
    isAudioOn: true,
    isScreenSharing: false,
    isRecording: false,
  });

  // 전문가 개별 컨트롤 상태
  const [expertControls] = useState({
    isVideoOn: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    isRecording: false,
  });

  const [sessionTime, setSessionTime] = useState(0);
  const [showVideoGrid, setShowVideoGrid] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  // 채팅 스크롤 참조
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // 상담 시작 관련 상태
  const [expertConfirmed, setExpertConfirmed] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);

  // 상담 시작 관련 상태
  const [isConsultationStarted, setIsConsultationStarted] = useState(false);
  const [expertJoined, setExpertJoined] = useState(false);
  const [userJoined, setUserJoined] = useState(false);

  useEffect(() => {
    // 데모용으로 3초 후 사용자 입장, 1초 후 전문가 입장으로 설정
    setTimeout(() => setUserJoined(true), 1000);
    setTimeout(() => setExpertJoined(true), 3000);
  }, []);

  // 상담이 시작되면 타이머 시작
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConsultationStarted) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConsultationStarted]);

  // 사용자 입장 시 시스템 메시지 추가
  useEffect(() => {
    if (userJoined) {
      const joinMessage = {
        id: Date.now() + Math.random(),
        message: "김철수님이 입장하였습니다.",
        timestamp: new Date(),
        type: "system",
        systemType: "join",
      };
      setChatMessages((prev) => [...prev, joinMessage]);
    }
  }, [userJoined]);

  // 전문가 입장 시 시스템 메시지 추가
  useEffect(() => {
    if (expertJoined) {
      const joinMessage = {
        id: Date.now() + Math.random(),
        message: "이민수 전문가님이 입장하였습니다.",
        timestamp: new Date(),
        type: "system",
        systemType: "join",
      };
      setChatMessages((prev) => [...prev, joinMessage]);
    }
  }, [expertJoined]);

  // 전문가와 사용자 모두 입장 완료시 상담 시작 확인 메시지 추가
  useEffect(() => {
    if (expertJoined && userJoined && !isConsultationStarted) {
      const startConfirmMessage = {
        id: Date.now() + Math.random(),
        message: "상담을 시작하시겠습니까?",
        timestamp: new Date(),
        type: "system",
        systemType: "startConfirm",
      };
      setChatMessages((prev) => [...prev, startConfirmMessage]);
    }
  }, [expertJoined, userJoined, isConsultationStarted]);

  // 전문가와 사용자 모두 확인시 상담 시작
  useEffect(() => {
    if (expertConfirmed && userConfirmed && !isConsultationStarted) {
      setIsConsultationStarted(true);

      // 상담 시작 메시지 추가
      const startMessage = {
        id: Date.now() + Math.random(),
        message: "상담이 시작되었습니다. 시간이 측정됩니다.",
        timestamp: new Date(),
        type: "system",
        systemType: "start",
      };
      setChatMessages((prev) => [...prev, startMessage]);
    }
  }, [expertConfirmed, userConfirmed, isConsultationStarted]);

  // 채팅 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [chatMessages]);

  const handleEndCall = () => {
    if (confirm("상담을 종료하시겠습니까?")) {
      // 상담 종료 시스템 메시지 추가
      const endMessage = {
        id: Date.now() + Math.random(),
        message: "상담이 종료되었습니다.",
        timestamp: new Date(),
        type: "system",
        systemType: "end",
      };
      setChatMessages((prev) => [...prev, endMessage]);

      // 상담 완료 상태로 자동 업데이트
      console.log("상담 완료 처리");

      // 상담 완료 페이지로 이동 (실제 구현 시)
      console.log("상담 종료");
    }
  };

  const handleUserConfirm = () => {
    setUserConfirmed(true);

    // 사용자 확인 메시지 추가
    const userConfirmMessage = {
      id: Date.now() + Math.random(),
      message: "김철수님이 상담 시작을 확인했습니다.",
      timestamp: new Date(),
      type: "system",
      systemType: "confirm",
    };
    setChatMessages((prev) => [...prev, userConfirmMessage]);

    // 데모용으로 사용자가 확인하면 2초 후 전문가도 자동 확인
    setTimeout(() => {
      setExpertConfirmed(true);

      // 전문가 확인 메시지 추가
      const expertConfirmMessage = {
        id: Date.now() + Math.random() + 1,
        message: "이민수 전문가님이 상담 시작을 확인했습니다.",
        timestamp: new Date(),
        type: "system",
        systemType: "confirm",
      };
      setChatMessages((prev) => [...prev, expertConfirmMessage]);
    }, 2000);
  };

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "김철수",
      message: newChatMessage,
      timestamp: new Date(),
      isExpert: false,
      type: "chat",
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setNewChatMessage("");
  };

  const handleToggleVideo = () => {
    setUserControls((prev) => ({ ...prev, isVideoOn: !prev.isVideoOn }));
  };

  const handleToggleAudio = () => {
    setUserControls((prev) => ({ ...prev, isAudioOn: !prev.isAudioOn }));
  };

  const handleToggleScreenShare = () => {
    setUserControls((prev) => ({
      ...prev,
      isScreenSharing: !prev.isScreenSharing,
    }));
  };

  const handleToggleRecording = () => {
    setUserControls((prev) => ({ ...prev, isRecording: !prev.isRecording }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <ServiceLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  전문가 상담
                </h1>
                <p className="text-gray-600 mt-2">
                  전문가와 실시간으로 상담을 진행할 수 있습니다. 화상, 음성,
                  채팅 중 원하는 방식으로 상담을 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 상담 화면 */}
        <div className="min-h-screen bg-gray-900">
          <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-white">
                  {consultationMode === "chat" && "채팅 상담"}
                  {consultationMode === "voice" && "음성 상담"}
                  {consultationMode === "video" && "화상 상담"}
                </h1>
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">연결됨</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {isConsultationStarted
                      ? formatTime(sessionTime)
                      : "준비 중"}
                  </span>
                </div>

                {/* 상담 종료 버튼 */}
                {isConsultationStarted && (
                  <button
                    onClick={handleEndCall}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                    title="상담 종료"
                  >
                    <Phone className="h-4 w-4 transform rotate-[135deg]" />
                    <span>상담 종료</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {(userControls.isRecording || expertControls.isRecording) && (
                  <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {userControls.isRecording && expertControls.isRecording
                        ? "녹화 중 (양쪽)"
                        : userControls.isRecording
                        ? "김철수님 녹화 중"
                        : "이민수 전문가님 녹화 중"}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">2명 참여</span>
                </div>

                {consultationMode === "video" && (
                  <button
                    onClick={() => setShowVideoGrid(!showVideoGrid)}
                    className={`p-2 rounded-lg border transition-colors relative ${
                      showVideoGrid
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                    title="비디오 화면 표시/숨김"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex bg-gray-50 relative min-h-0">
              {/* 메인 채팅 영역 */}
              <div className="flex-1 bg-white flex flex-col min-h-0 shadow-sm border border-gray-200">
                {/* 채팅 메시지 영역 */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 max-h-[calc(100vh-300px)]">
                  {chatMessages.map((message) => (
                    <div key={message.id}>
                      {message.type === "system" ? (
                        <div className="flex justify-center mb-4">
                          <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 max-w-md">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-2">
                                {message.message}
                              </div>

                              {message.systemType === "startConfirm" &&
                                !userConfirmed && (
                                  <button
                                    onClick={handleUserConfirm}
                                    className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                                  >
                                    상담 시작 확인
                                  </button>
                                )}

                              {message.systemType === "startConfirm" &&
                                userConfirmed &&
                                !expertConfirmed && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    전문가 확인 대기 중...
                                  </div>
                                )}

                              <div className="text-xs text-gray-400 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <div
                            className={`max-w-md px-4 py-3 rounded-lg shadow-sm ${
                              message.isExpert
                                ? "bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800 border border-blue-200"
                                : "bg-gradient-to-br from-green-50 to-emerald-100 text-gray-800 border border-green-200"
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1 font-medium text-left">
                              {message.sender}
                            </div>
                            <div className="text-sm leading-relaxed text-left">
                              {message.message}
                            </div>
                            <div className="text-xs opacity-60 mt-2 text-left">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 스크롤 참조점 */}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* 메시지 입력 영역 */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendChatMessage()
                      }
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 우측 상단 비디오 그리드 */}
              {showVideoGrid && consultationMode === "video" && (
                <div className="absolute top-4 right-4 w-80 space-y-3 z-10">
                  {/* 전문가 비디오 */}
                  <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center">
                      {expertControls.isVideoOn ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-gray-900 text-sm font-semibold">
                            이민수 전문가
                          </div>
                          <div className="text-blue-600 text-xs">
                            비디오 활성화
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2 shadow-lg">
                            <User className="w-8 h-8 text-gray-600" />
                          </div>
                          <div className="text-gray-900 text-sm font-semibold">
                            이민수 전문가
                          </div>
                          <div className="text-gray-500 text-xs">
                            비디오 꺼짐
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 전문가 상태 표시 */}
                    <div className="absolute bottom-3 right-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-2 rounded-full shadow-lg ${
                            expertControls.isAudioEnabled
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {expertControls.isAudioEnabled ? (
                            <Mic className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                          )}
                        </div>
                        <div
                          className={`p-2 rounded-full shadow-lg ${
                            expertControls.isVideoOn
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {expertControls.isVideoOn ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <VideoOff className="w-4 h-4" />
                          )}
                        </div>
                        {expertControls.isScreenSharing && (
                          <div className="p-2 rounded-full shadow-lg bg-blue-100 text-blue-600">
                            <Monitor className="w-4 h-4" />
                          </div>
                        )}
                        {expertControls.isRecording && (
                          <div className="p-2 rounded-full shadow-lg bg-red-100 text-red-600">
                            <div className="w-4 h-4 bg-red-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 사용자 비디오 (같은 크기) */}
                  <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <div className="w-full h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center">
                      {userControls.isVideoOn ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-gray-900 text-sm font-semibold">
                            김철수 (나)
                          </div>
                          <div className="text-green-600 text-xs">
                            비디오 활성화
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2 shadow-lg">
                            <User className="w-8 h-8 text-gray-600" />
                          </div>
                          <div className="text-gray-900 text-sm font-semibold">
                            김철수 (나)
                          </div>
                          <div className="text-gray-500 text-xs">
                            비디오 꺼짐
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 사용자 상태 표시 */}
                    <div className="absolute bottom-3 right-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-2 rounded-full shadow-lg ${
                            userControls.isAudioOn
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {userControls.isAudioOn ? (
                            <Mic className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                          )}
                        </div>
                        <div className="p-2 rounded-full shadow-lg bg-green-100 text-green-600">
                          <Video className="w-4 h-4" />
                        </div>
                        {userControls.isScreenSharing && (
                          <div className="p-2 rounded-full shadow-lg bg-blue-100 text-blue-600">
                            <Monitor className="w-4 h-4" />
                          </div>
                        )}
                        {userControls.isRecording && (
                          <div className="p-2 rounded-full shadow-lg bg-red-100 text-red-600">
                            <div className="w-4 h-4 bg-red-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 컨트롤 바 */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-center shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                {/* 채팅 모드일 때는 파일 업로드만 표시 */}
                {consultationMode === "chat" && (
                  <button
                    onClick={() => {
                      /* 파일 업로드 기능 추가 예정 */
                    }}
                    className="p-4 bg-blue-600 text-white border border-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                    title="파일 업로드"
                  >
                    <Paperclip className="h-6 w-6" />
                  </button>
                )}

                {/* 음성/화상 모드일 때는 모든 컨트롤 표시 */}
                {(consultationMode === "voice" ||
                  consultationMode === "video") && (
                  <>
                    {/* 마이크 버튼 */}
                    <button
                      onClick={handleToggleAudio}
                      className={`p-4 rounded-full border transition-colors ${
                        userControls.isAudioOn
                          ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      }`}
                      title={
                        userControls.isAudioOn ? "마이크 끄기" : "마이크 켜기"
                      }
                    >
                      {userControls.isAudioOn ? (
                        <Mic className="h-6 w-6" />
                      ) : (
                        <div className="h-6 w-6 bg-red-600 rounded"></div>
                      )}
                    </button>

                    {/* 화상 모드일 때만 비디오 버튼 표시 */}
                    {consultationMode === "video" && (
                      <button
                        onClick={handleToggleVideo}
                        className={`p-4 rounded-full border transition-colors ${
                          userControls.isVideoOn
                            ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        }`}
                        title={
                          userControls.isVideoOn ? "비디오 끄기" : "비디오 켜기"
                        }
                      >
                        {userControls.isVideoOn ? (
                          <Video className="h-6 w-6" />
                        ) : (
                          <VideoOff className="h-6 w-6" />
                        )}
                      </button>
                    )}

                    {/* 화상 모드일 때만 화면 공유 버튼 표시 */}
                    {consultationMode === "video" && (
                      <button
                        onClick={handleToggleScreenShare}
                        className={`p-4 rounded-full border transition-colors ${
                          userControls.isScreenSharing
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                        title={
                          userControls.isScreenSharing
                            ? "화면 공유 중지"
                            : "화면 공유 시작"
                        }
                      >
                        {userControls.isScreenSharing ? (
                          <MonitorOff className="h-6 w-6" />
                        ) : (
                          <Monitor className="h-6 w-6" />
                        )}
                      </button>
                    )}

                    {/* 녹화 버튼 */}
                    <button
                      onClick={handleToggleRecording}
                      className={`p-4 rounded-full border transition-colors ${
                        userControls.isRecording
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                      title={
                        userControls.isRecording ? "녹화 중지" : "녹화 시작"
                      }
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${
                          userControls.isRecording
                            ? "bg-red-600"
                            : "border-2 border-current"
                        }`}
                      />
                    </button>

                    {/* 미디어 추가 버튼 */}
                    <button
                      onClick={() => {
                        /* 파일 업로드 기능 추가 예정 */
                      }}
                      className="p-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                      title="파일 업로드"
                    >
                      <Paperclip className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ServiceLayout>
  );
}
