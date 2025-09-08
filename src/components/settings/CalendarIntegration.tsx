"use client";

import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";

interface ConnectedCalendar {
  id: string;
  name: string;
  email: string;
  status: "connected" | "error" | "disconnected";
  syncEnabled: boolean;
  color: string;
}

interface AvailableCalendar {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const CalendarIntegration = () => {
  const [connectedCalendars, setConnectedCalendars] = useState<
    ConnectedCalendar[]
  >([
    {
      id: "google",
      name: "Google Calendar",
      email: "user@gmail.com",
      status: "connected",
      syncEnabled: true,
      color: "#4285f4",
    },
  ]);

  const [availableCalendars] = useState<AvailableCalendar[]>([
    {
      id: "outlook",
      name: "Outlook Calendar",
      icon: "📅",
      description: "Microsoft Outlook 일정과 동기화",
    },
    {
      id: "apple",
      name: "Apple Calendar",
      icon: "🍎",
      description: "Apple 기본 캘린더와 동기화",
    },
    {
      id: "naver",
      name: "Naver Calendar",
      icon: "🟢",
      description: "네이버 캘린더와 동기화",
    },
  ]);

  const handleConnect = async (calendarId: string) => {
    try {
      // 캘린더 연결 API 호출
      console.log(`Connecting to ${calendarId}`);

      // 연결 성공 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newCalendar: ConnectedCalendar = {
        id: calendarId,
        name:
          availableCalendars.find((cal) => cal.id === calendarId)?.name || "",
        email: "user@example.com",
        status: "connected",
        syncEnabled: true,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      };

      setConnectedCalendars([...connectedCalendars, newCalendar]);
    } catch (error) {
      console.error("Calendar connection failed:", error);
      alert("캘린더 연결에 실패했습니다.");
    }
  };

  const handleDisconnect = (calendarId: string) => {
    if (confirm("정말로 캘린더 연결을 해제하시겠습니까?")) {
      setConnectedCalendars(
        connectedCalendars.filter((cal) => cal.id !== calendarId),
      );
    }
  };

  const handleToggleSync = (calendarId: string) => {
    setConnectedCalendars(
      connectedCalendars.map((cal) =>
        cal.id === calendarId ? { ...cal, syncEnabled: !cal.syncEnabled } : cal,
      ),
    );
  };

  const getStatusIcon = (status: ConnectedCalendar["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ConnectedCalendar["status"]) => {
    switch (status) {
      case "connected":
        return "연결됨";
      case "error":
        return "연결 오류";
      case "disconnected":
        return "연결 해제됨";
      default:
        return "알 수 없음";
    }
  };

  const getStatusColor = (status: ConnectedCalendar["status"]) => {
    switch (status) {
      case "connected":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "disconnected":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          캘린더 연동
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          외부 캘린더와 연동하여 일정을 동기화하세요.
        </p>
      </div>

      <div className="p-6">
        {/* 연결된 캘린더 목록 */}
        {connectedCalendars.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              연결된 캘린더
            </h4>

            <div className="space-y-3">
              {connectedCalendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: calendar.color }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {calendar.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {calendar.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(calendar.status)}
                      <span
                        className={`text-sm font-medium ${getStatusColor(calendar.status)}`}
                      >
                        {getStatusText(calendar.status)}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calendar.syncEnabled}
                        onChange={() => handleToggleSync(calendar.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    <button
                      onClick={() => handleDisconnect(calendar.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="연결 해제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용 가능한 캘린더 */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            사용 가능한 캘린더
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCalendars.map((calendar) => {
              const isConnected = connectedCalendars.some(
                (cal) => cal.id === calendar.id,
              );

              return (
                <div
                  key={calendar.id}
                  className="p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{calendar.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {calendar.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {calendar.description}
                      </div>
                    </div>
                  </div>

                  {isConnected ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">연결됨</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(calendar.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>연결하기</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 동기화 설정 */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">동기화 설정</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">자동 동기화</div>
                <div className="text-sm text-gray-600">
                  상담 일정이 변경될 때 자동으로 캘린더에 반영됩니다
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">양방향 동기화</div>
                <div className="text-sm text-gray-600">
                  외부 캘린더의 일정도 상담 앱에 가져옵니다
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">알림 동기화</div>
                <div className="text-sm text-gray-600">
                  상담 전 알림을 캘린더 알림과 함께 받습니다
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                캘린더 연동 도움말
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• 연결된 캘린더의 일정이 상담 앱과 실시간으로 동기화됩니다</p>
                <p>• 상담 일정이 변경되면 자동으로 캘린더에 반영됩니다</p>
                <p>• 외부 캘린더의 일정도 상담 앱에서 확인할 수 있습니다</p>
                <p>• 개인정보 보호를 위해 필요한 정보만 동기화됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegration;
