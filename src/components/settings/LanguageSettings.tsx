"use client";

import { useState } from "react";
import { Globe, Check, Download, Save } from "lucide-react";

interface LanguageSettings {
  primaryLanguage: string;
  secondaryLanguage: string;
  autoTranslate: boolean;
  translateConsultations: boolean;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  timezone: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  coverage: number;
}

interface DateFormat {
  value: string;
  label: string;
  description: string;
}

interface TimeFormat {
  value: string;
  label: string;
  description: string;
}

interface Currency {
  value: string;
  label: string;
  country: string;
}

interface Timezone {
  value: string;
  label: string;
  country: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const LanguageSettings = () => {
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    primaryLanguage: "ko",
    secondaryLanguage: "en",
    autoTranslate: true,
    translateConsultations: true,
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    currency: "KRW",
    timezone: "Asia/Seoul",
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const languages: Language[] = [
    {
      code: "ko",
      name: "한국어",
      nativeName: "한국어",
      flag: "🇰🇷",
      coverage: 100,
    },
    {
      code: "en",
      name: "영어",
      nativeName: "English",
      flag: "🇺🇸",
      coverage: 100,
    },
    {
      code: "ja",
      name: "일본어",
      nativeName: "日本語",
      flag: "🇯🇵",
      coverage: 95,
    },
    {
      code: "zh",
      name: "중국어",
      nativeName: "中文",
      flag: "🇨🇳",
      coverage: 90,
    },
    {
      code: "es",
      name: "스페인어",
      nativeName: "Español",
      flag: "🇪🇸",
      coverage: 85,
    },
    {
      code: "fr",
      name: "프랑스어",
      nativeName: "Français",
      flag: "🇫🇷",
      coverage: 80,
    },
    {
      code: "de",
      name: "독일어",
      nativeName: "Deutsch",
      flag: "🇩🇪",
      coverage: 75,
    },
    {
      code: "ru",
      name: "러시아어",
      nativeName: "Русский",
      flag: "🇷🇺",
      coverage: 70,
    },
  ];

  const dateFormats: DateFormat[] = [
    {
      value: "YYYY-MM-DD",
      label: "2024-01-15",
      description: "ISO 8601 (국제 표준)",
    },
    { value: "MM/DD/YYYY", label: "01/15/2024", description: "미국 형식" },
    { value: "DD/MM/YYYY", label: "15/01/2024", description: "유럽 형식" },
    {
      value: "YYYY년 MM월 DD일",
      label: "2024년 01월 15일",
      description: "한국 형식",
    },
  ];

  const timeFormats: TimeFormat[] = [
    { value: "24h", label: "14:30", description: "24시간 형식" },
    { value: "12h", label: "2:30 PM", description: "12시간 형식 (AM/PM)" },
  ];

  const currencies: Currency[] = [
    { value: "KRW", label: "원 (₩)", country: "대한민국" },
    { value: "USD", label: "달러 ($)", country: "미국" },
    { value: "EUR", label: "유로 (€)", country: "유럽연합" },
    { value: "JPY", label: "엔 (¥)", country: "일본" },
    { value: "CNY", label: "위안 (¥)", country: "중국" },
  ];

  const timezones: Timezone[] = [
    { value: "Asia/Seoul", label: "서울 (GMT+9)", country: "대한민국" },
    { value: "Asia/Tokyo", label: "도쿄 (GMT+9)", country: "일본" },
    { value: "Asia/Shanghai", label: "상하이 (GMT+8)", country: "중국" },
    { value: "America/New_York", label: "뉴욕 (GMT-5)", country: "미국" },
    { value: "Europe/London", label: "런던 (GMT+0)", country: "영국" },
    { value: "Europe/Paris", label: "파리 (GMT+1)", country: "프랑스" },
  ];

  const handleSettingChange = (key: keyof LanguageSettings, value: any) => {
    setLanguageSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus("saving");

    try {
      // 언어 설정 저장 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

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

  const handleDownloadLanguagePack = async (languageCode: string) => {
    try {
      // 언어팩 다운로드 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(
        `${languages.find((lang) => lang.code === languageCode)?.name} 언어팩이 다운로드되었습니다.`,
      );
    } catch (error) {
      alert("언어팩 다운로드에 실패했습니다.");
    }
  };

  const getLanguageByCode = (code: string) => {
    return languages.find((lang) => lang.code === code);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-blue-600" />
          언어 및 지역 설정
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          언어, 날짜 형식, 통화 등을 설정하세요.
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-8">
          {/* 주요 언어 설정 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h4 className="text-md font-medium text-gray-900">언어 설정</h4>
            </div>

        <div className="space-y-6">
          {/* 주요 언어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              주요 언어
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {languages.map((language) => {
                const isActive =
                  languageSettings.primaryLanguage === language.code;

                return (
                  <button
                    key={language.code}
                    onClick={() =>
                      handleSettingChange("primaryLanguage", language.code)
                    }
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{language.flag}</span>
                      <div className="flex-1">
                        <div
                          className={`font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}
                        >
                          {language.name}
                        </div>
                        <div
                          className={`text-sm ${isActive ? "text-blue-700" : "text-gray-600"}`}
                        >
                          {language.nativeName}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${language.coverage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {language.coverage}%
                          </span>
                        </div>
                      </div>
                      {isActive && <Check className="h-5 w-5 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 보조 언어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              보조 언어
            </label>
            <select
              value={languageSettings.secondaryLanguage}
              onChange={(e) =>
                handleSettingChange("secondaryLanguage", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.name} ({language.nativeName})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              보조 언어는 번역이 필요할 때 사용됩니다.
            </p>
          </div>

          {/* 자동 번역 설정 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">자동 번역</div>
                <div className="text-sm text-gray-600">
                  인터페이스를 자동으로 번역합니다
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={languageSettings.autoTranslate}
                  onChange={(e) =>
                    handleSettingChange("autoTranslate", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">상담 내용 번역</div>
                <div className="text-sm text-gray-600">
                  상담 기록을 자동으로 번역합니다
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={languageSettings.translateConsultations}
                  onChange={(e) =>
                    handleSettingChange(
                      "translateConsultations",
                      e.target.checked,
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 지역 설정 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">지역 설정</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 날짜 형식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              날짜 형식
            </label>
            <div className="space-y-2">
              {dateFormats.map((format) => {
                const isActive = languageSettings.dateFormat === format.value;

                return (
                  <button
                    key={format.value}
                    onClick={() =>
                      handleSettingChange("dateFormat", format.value)
                    }
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}
                    >
                      {format.label}
                    </div>
                    <div
                      className={`text-sm ${isActive ? "text-blue-700" : "text-gray-600"}`}
                    >
                      {format.description}
                    </div>
                    {isActive && (
                      <div className="mt-2 flex justify-end">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시간 형식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              시간 형식
            </label>
            <div className="space-y-2">
              {timeFormats.map((format) => {
                const isActive = languageSettings.timeFormat === format.value;

                return (
                  <button
                    key={format.value}
                    onClick={() =>
                      handleSettingChange("timeFormat", format.value)
                    }
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}
                    >
                      {format.label}
                    </div>
                    <div
                      className={`text-sm ${isActive ? "text-blue-700" : "text-gray-600"}`}
                    >
                      {format.description}
                    </div>
                    {isActive && (
                      <div className="mt-2 flex justify-end">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 통화 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              통화
            </label>
            <select
              value={languageSettings.currency}
              onChange={(e) => handleSettingChange("currency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label} - {currency.country}
                </option>
              ))}
            </select>
          </div>

          {/* 시간대 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              시간대
            </label>
            <select
              value={languageSettings.timezone}
              onChange={(e) => handleSettingChange("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timezones.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label} - {timezone.country}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 언어팩 다운로드 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          언어팩 다운로드
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          오프라인에서도 사용할 수 있도록 언어팩을 다운로드하세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {languages.map((language) => (
            <div
              key={language.code}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {language.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {language.nativeName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDownloadLanguagePack(language.code)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title={`${language.name} 언어팩 다운로드`}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
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
              <span>언어 설정 저장</span>
            </>
          )}
        </button>
      </div>

      {/* 상태 메시지 */}
      {saveStatus === "saved" && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="h-5 w-5" />
            <span>언어 설정이 성공적으로 저장되었습니다.</span>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span>언어 설정 저장에 실패했습니다. 다시 시도해주세요.</span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
