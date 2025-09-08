"use client";

import { useState } from "react";
import { Palette, Sun, Moon, Monitor, Check, Save } from "lucide-react";

interface ThemeSettings {
  mode: "light" | "dark" | "system";
  colorScheme: "blue" | "green" | "purple" | "orange";
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface ThemeOption {
  value: "light" | "dark" | "system";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: string;
}

interface ColorScheme {
  value: "blue" | "green" | "purple" | "orange";
  label: string;
  primary: string;
  secondary: string;
  colors: string[];
}

interface FontSize {
  value: "small" | "medium" | "large";
  label: string;
  description: string;
  preview: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const ThemeSettings = () => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: "light",
    colorScheme: "blue",
    fontSize: "medium",
    compactMode: false,
    highContrast: false,
    reducedMotion: false,
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const themeOptions: ThemeOption[] = [
    {
      value: "light",
      label: "라이트 모드",
      description: "밝은 배경의 기본 테마",
      icon: Sun,
      preview: "bg-white border-gray-200",
    },
    {
      value: "dark",
      label: "다크 모드",
      description: "어둡고 편안한 테마",
      icon: Moon,
      preview: "bg-gray-900 border-gray-700",
    },
    {
      value: "system",
      label: "시스템 설정",
      description: "운영체제 설정에 맞춤",
      icon: Monitor,
      preview: "bg-gradient-to-r from-white to-gray-900 border-gray-400",
    },
  ];

  const colorSchemes: ColorScheme[] = [
    {
      value: "blue",
      label: "블루",
      primary: "bg-blue-600",
      secondary: "bg-blue-100",
      colors: ["bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300"],
    },
    {
      value: "green",
      label: "그린",
      primary: "bg-green-600",
      secondary: "bg-green-100",
      colors: ["bg-green-600", "bg-green-500", "bg-green-400", "bg-green-300"],
    },
    {
      value: "purple",
      label: "퍼플",
      primary: "bg-purple-600",
      secondary: "bg-purple-100",
      colors: [
        "bg-purple-600",
        "bg-purple-500",
        "bg-purple-400",
        "bg-purple-300",
      ],
    },
    {
      value: "orange",
      label: "오렌지",
      primary: "bg-orange-600",
      secondary: "bg-orange-100",
      colors: [
        "bg-orange-600",
        "bg-orange-500",
        "bg-orange-400",
        "bg-orange-300",
      ],
    },
  ];

  const fontSizes: FontSize[] = [
    { value: "small", label: "작게", description: "14px", preview: "text-sm" },
    {
      value: "medium",
      label: "보통",
      description: "16px",
      preview: "text-base",
    },
    { value: "large", label: "크게", description: "18px", preview: "text-lg" },
  ];

  const handleThemeChange = (key: keyof ThemeSettings, value: any) => {
    setThemeSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus("saving");

    try {
      // 테마 설정 저장 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 실제로는 여기서 CSS 변수나 Tailwind 클래스를 업데이트
      document.documentElement.setAttribute("data-theme", themeSettings.mode);
      document.documentElement.setAttribute(
        "data-color-scheme",
        themeSettings.colorScheme,
      );

      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Palette className="h-5 w-5 mr-2 text-blue-600" />
          테마 설정
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          앱의 외관과 사용성을 개인화하세요.
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-8">
          {/* 테마 모드 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="h-5 w-5 text-blue-600" />
              <h4 className="text-md font-medium text-gray-900">테마 모드</h4>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = themeSettings.mode === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange("mode", option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <IconComponent
                    className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-600"}`}
                  />
                  <span
                    className={`font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}
                  >
                    {option.label}
                  </span>
                </div>
                <p
                  className={`text-sm text-left ${isActive ? "text-blue-700" : "text-gray-600"}`}
                >
                  {option.description}
                </p>
                <div
                  className={`mt-3 w-full h-16 rounded border ${option.preview}`}
                ></div>
                {isActive && (
                  <div className="mt-2 flex justify-center">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 컬러 스킴 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">컬러 스킴</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorSchemes.map((scheme) => {
            const isActive = themeSettings.colorScheme === scheme.value;

            return (
              <button
                key={scheme.value}
                onClick={() => handleThemeChange("colorScheme", scheme.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-full h-8 rounded mb-2 ${scheme.primary}`}
                  ></div>
                  <div className="flex space-x-1 mb-2">
                    {scheme.colors.map((color, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded ${color}`}
                      ></div>
                    ))}
                  </div>
                  <span
                    className={`text-sm font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}
                  >
                    {scheme.label}
                  </span>
                  {isActive && (
                    <div className="mt-2 flex justify-center">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 폰트 크기 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">폰트 크기</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fontSizes.map((size) => {
            const isActive = themeSettings.fontSize === size.value;

            return (
              <button
                key={size.value}
                onClick={() => handleThemeChange("fontSize", size.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`${size.preview} font-medium mb-2 ${isActive ? "text-blue-900" : "text-gray-900"}`}
                  >
                    {size.label}
                  </div>
                  <div
                    className={`text-sm ${isActive ? "text-blue-700" : "text-gray-600"}`}
                  >
                    {size.description}
                  </div>
                  {isActive && (
                    <div className="mt-2 flex justify-center">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 추가 옵션 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">추가 옵션</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">컴팩트 모드</div>
              <div className="text-sm text-gray-600">
                요소 간 간격을 줄여 더 많은 내용을 표시
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={themeSettings.compactMode}
                onChange={(e) =>
                  handleThemeChange("compactMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">고대비 모드</div>
              <div className="text-sm text-gray-600">
                텍스트와 배경의 대비를 높여 가독성 향상
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={themeSettings.highContrast}
                onChange={(e) =>
                  handleThemeChange("highContrast", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">모션 감소</div>
              <div className="text-sm text-gray-600">
                애니메이션과 전환 효과를 줄여 접근성 향상
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={themeSettings.reducedMotion}
                onChange={(e) =>
                  handleThemeChange("reducedMotion", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saveStatus === "saving"}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saveStatus === "saving" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>테마 설정 저장</span>
            </>
          )}
        </button>
      </div>

      {/* 상태 메시지 */}
      {saveStatus === "saved" && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="h-5 w-5" />
            <span>테마 설정이 성공적으로 저장되었습니다.</span>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span>테마 설정 저장에 실패했습니다. 다시 시도해주세요.</span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
