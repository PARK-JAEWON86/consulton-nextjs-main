"use client";

import { useState } from "react";

interface SocialLoginButtonsProps {
  mode?: "login" | "register";
}

const SocialLoginButtons = ({ mode = "login" }: SocialLoginButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const actionText = mode === "register" ? "회원가입" : "로그인";

  const socialProviders = [
    {
      id: "google",
      name: "Google",
      bgColor: "bg-white hover:bg-gray-50",
      textColor: "text-gray-900",
      borderColor: "border-gray-300",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    {
      id: "kakao",
      name: "KakaoTalk",
      bgColor: "bg-yellow-400 hover:bg-yellow-500",
      textColor: "text-gray-900",
      borderColor: "border-yellow-400",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.2 4.52 6.66l-.93 3.44c-.05.18.15.32.29.21l4.05-2.68c.69.09 1.4.13 2.07.13 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z" />
        </svg>
      ),
    },
    {
      id: "naver",
      name: "Naver",
      bgColor: "bg-green-500 hover:bg-green-600",
      textColor: "text-white",
      borderColor: "border-green-500",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
        </svg>
      ),
    },
  ];

  const handleSocialLogin = async (providerId: string) => {
    setLoadingProvider(providerId);

    try {
      // 소셜 로그인 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log(`${providerId} login initiated`);

      // 실제로는 각 소셜 로그인 SDK를 사용하여 로그인 처리
      // 예: window.location.href = `/auth/${providerId}`;
    } catch (error) {
      console.error(`${providerId} login failed:`, error);
      alert(`${providerId} 로그인에 실패했습니다. 다시 시도해주세요.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {socialProviders.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleSocialLogin(provider.id)}
          disabled={loadingProvider !== null}
          className={`w-full flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
            provider.bgColor
          } ${provider.textColor} ${provider.borderColor} ${
            loadingProvider !== null ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loadingProvider === provider.id ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              {actionText} 중...
            </div>
          ) : (
            <div className="flex items-center">
              {provider.icon}
              <span className="ml-2">{provider.name}로 {actionText}</span>
            </div>
          )}
        </button>
      ))}

      <div className="mt-4 text-xs text-gray-500 text-center">
        소셜 {actionText}을 통해 계속하시면{" "}
        <a href="#" className="text-blue-600 hover:text-blue-500">
          이용약관
        </a>{" "}
        및{" "}
        <a href="#" className="text-blue-600 hover:text-blue-500">
          개인정보처리방침
        </a>
        에 동의하는 것으로 간주됩니다.
      </div>
    </div>
  );
};

export default SocialLoginButtons;
