"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// API를 통한 로그인 처리로 변경
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string | null;
  role?: 'expert' | 'client' | 'admin';
  expertProfile?: any;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // API를 통한 앱 상태 업데이트 함수들
  const setAuthenticated = async (isAuth: boolean) => {
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('consulton-auth', JSON.stringify(isAuth));
      
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setAuthenticated', data: { isAuthenticated: isAuth } })
      });
    } catch (error) {
      console.error('인증 상태 업데이트 실패:', error);
    }
  };

  const setUser = async (userData: User) => {
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('consulton-user', JSON.stringify(userData));
      
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setUser', data: { user: userData } })
      });
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error);
    }
  };

  const enterService = async () => {
    try {
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enterService', data: {} })
      });
    } catch (error) {
      console.error('서비스 진입 실패:', error);
    }
  };

  const setViewMode = async (mode: "user" | "expert") => {
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('consulton-viewMode', JSON.stringify(mode));
      
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setViewMode', data: { viewMode: mode } })
      });
    } catch (error) {
      console.error('뷰 모드 설정 실패:', error);
    }
  };

  const loadExpertConsultations = async (expertId: string) => {
    try {
      await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'loadExpertConsultations', data: { expertId } })
      });
    } catch (error) {
      console.error('전문가 상담 내역 로드 실패:', error);
    }
  };

  useEffect(() => {
    // 개발 환경에서 계정 정보는 API를 통해 확인
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 개발 환경: 로그인 API를 통해 계정 정보를 확인하세요');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 입력 시 에러 제거
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // API를 통한 로그인 처리
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 로그인 성공 처리
        const userData = data.user;
        
        // 로그인 성공 처리: 전역 스토어 업데이트 및 리다이렉트
        setAuthenticated(true);
        setUser(userData);
        
        // Navbar 상태 즉시 업데이트
        updateNavbarState(userData);
        
        // 전문가로 로그인하면 viewMode를 expert로 설정
        if (userData.role === 'expert') {
          console.log('전문가 로그인: viewMode를 expert로 설정');
          await setViewMode('expert');
          
          // 전문가 상담 내역 로드
          loadExpertConsultations(userData.id.toString());
          
          // redirect 파라미터가 있으면 해당 URL로, 없으면 전문가 대시보드로 이동
          const redirectUrl = searchParams.get('redirect') || "/dashboard/expert";
          router.push(redirectUrl);
        } else {
          // 일반 사용자 로그인
          await setViewMode('user');
          enterService();
          
          // redirect 파라미터가 있으면 해당 URL로, 없으면 대시보드로 이동
          const redirectUrl = searchParams.get('redirect') || "/dashboard";
          router.push(redirectUrl);
        }
      } else {
        // 로그인 실패
        setErrors({ general: data.error || "로그인에 실패했습니다." });
        return;
      }
    } catch (error) {
      setErrors({
        general: "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 성공 후 Navbar 상태 업데이트를 위한 함수
  const updateNavbarState = (userData: any) => {
    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem('consulton-user', JSON.stringify(userData));
    localStorage.setItem('consulton-auth', 'true');
    
    // 커스텀 이벤트 발생으로 Navbar 상태 업데이트
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { type: 'login', name: 'user', value: userData } 
    }));
    
    // storage 이벤트 발생으로 다른 탭과 동기화
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'consulton-user',
      newValue: JSON.stringify(userData)
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'consulton-auth',
      newValue: 'true'
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{errors.general}</div>
          </div>
        )}

        {/* 이메일 입력 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            이메일 주소
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            비밀번호
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="비밀번호를 입력하세요"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* 로그인 유지 & 비밀번호 찾기 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              로그인 상태 유지
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              "로그인"
            )}
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            아직 계정이 없으신가요?{" "}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입하기
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;