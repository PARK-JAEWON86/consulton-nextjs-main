"use client";

import { useState, useEffect } from "react";
import { User, Camera, Save, AlertCircle, Check, Plus, X, Target, Brain, DollarSign, Scale, BookOpen, Heart, Users, Briefcase, Code, Palette, Languages, Music, Trophy, Plane, ChefHat, Scissors, PawPrint, Sprout, TrendingUp, Receipt, Building2, Baby, School, UserCheck, Phone, Clock, Shield } from "lucide-react";
// import { getExtendedCategories } from "@/data/dummy/categories"; // 더미 데이터 제거

interface Profile {
  firstName: string; // 전체 이름 (성+이름)
  lastName: string; // 더 이상 사용하지 않음 (하위 호환성을 위해 유지)
  displayName: string; // 닉네임
  email: string;
  phone: string;
  profileImage: File | null;
  interestedCategories: string[];
  profileVisibility: "public" | "experts" | "private";
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const ProfileSettings = () => {
  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    profileImage: null,
    interestedCategories: [],
    profileVisibility: "experts",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // 전화번호 인증 관련 상태
  const [phoneVerification, setPhoneVerification] = useState({
    isVerified: false,
    isSending: false,
    isVerifying: false,
    verificationCode: "",
    countdown: 0,
    errorMessage: "",
    originalPhone: "" // 원본 전화번호 저장
  });

  // 카테고리 목록 상태
  const [categories, setCategories] = useState<any[]>([]);
  
  // 아이콘 매핑
  const iconMap: { [key: string]: any } = {
    Target, Brain, DollarSign, Scale, BookOpen, Heart, Users, Briefcase, 
    Code, Palette, Languages, Music, Trophy, Plane, ChefHat, Scissors, 
    PawPrint, Sprout, TrendingUp, Receipt, Building2, Baby, School, UserCheck
  };

  // 사용자 프로필 정보 및 카테고리 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 카테고리 정보 로드
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData.success) {
            setCategories(categoriesData.data || []);
          }
        }
        
        // 새로운 프로필 API에서 정보 가져오기
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('프로필 정보를 가져올 수 없습니다.');
        }
        
        const result = await response.json();
        if (result.success && result.data) {
          const profileData = result.data;
          
          setProfile({
            firstName: profileData.firstName || '',
            lastName: '', // 더 이상 사용하지 않음
            displayName: profileData.displayName || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            profileImage: null,
            interestedCategories: profileData.interestedCategories || [],
            profileVisibility: profileData.profileVisibility || 'experts',
          });
          
          // 전화번호 인증 상태 설정 (기존 전화번호가 있으면 인증 완료로 간주)
          setPhoneVerification(prev => ({
            ...prev,
            isVerified: !!profileData.phone,
            originalPhone: profileData.phone || ""
          }));
          
          // 디버깅용 로그
          console.log('프로필 로드 성공:', profileData);
        } else {
          throw new Error('프로필 정보가 없습니다.');
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        // 에러가 발생해도 기본값으로 설정하여 알러트 방지
        setProfile({
          firstName: "김철수",
          lastName: "",
          displayName: "철수킹",
          email: "kimcheolsu@example.com",
          phone: "010-1234-5678",
          profileImage: null,
          interestedCategories: ["career", "psychology", "finance"],
          profileVisibility: "experts",
        });
        setPhoneVerification(prev => ({
          ...prev,
          isVerified: true,
          originalPhone: "010-1234-5678"
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // 전화번호가 변경된 경우 인증 상태 초기화
    if (field === "phone" && value !== phoneVerification.originalPhone) {
      console.log('전화번호 변경 감지:', {
        newPhone: value,
        originalPhone: phoneVerification.originalPhone,
        isVerified: phoneVerification.isVerified
      });
      setPhoneVerification(prev => ({
        ...prev,
        isVerified: false,
        verificationCode: "",
        countdown: 0,
        errorMessage: ""
      }));
    }
  };

  const handleVisibilityChange = (visibility: "public" | "experts" | "private") => {
    setProfile((prev) => ({
      ...prev,
      profileVisibility: visibility,
    }));
  };

  // 관심 카테고리 추가
  const handleAddCategory = (categoryId: string) => {
    if (!profile.interestedCategories.includes(categoryId)) {
      setProfile((prev) => ({
        ...prev,
        interestedCategories: [...prev.interestedCategories, categoryId],
      }));
    }
  };

  // 관심 카테고리 제거
  const handleRemoveCategory = (categoryId: string) => {
    setProfile((prev) => ({
      ...prev,
      interestedCategories: prev.interestedCategories.filter((id) => id !== categoryId),
    }));
  };

  // 커스텀 카테고리 추가
  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !profile.interestedCategories.includes(customCategory.trim())) {
      setProfile((prev) => ({
        ...prev,
        interestedCategories: [...prev.interestedCategories, customCategory.trim()],
      }));
      setCustomCategory("");
      setShowCustomInput(false);
    }
  };

  // 카테고리 이름 가져오기 (카테고리에서 찾거나 그대로 반환)
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // 전화번호 인증번호 발송
  const handleSendVerificationCode = async () => {
    if (!profile.phone || profile.phone.length < 10) {
      setPhoneVerification(prev => ({
        ...prev,
        errorMessage: "올바른 전화번호를 입력해주세요."
      }));
      return;
    }

    setPhoneVerification(prev => ({
      ...prev,
      isSending: true,
      errorMessage: ""
    }));

    try {
      // 인증번호 발송 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 카운트다운 시작 (3분)
      setPhoneVerification(prev => ({
        ...prev,
        isSending: false,
        countdown: 180
      }));

      // 카운트다운 타이머
      const timer = setInterval(() => {
        setPhoneVerification(prev => {
          if (prev.countdown <= 1) {
            clearInterval(timer);
            return { ...prev, countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isSending: false,
        errorMessage: "인증번호 발송에 실패했습니다. 다시 시도해주세요."
      }));
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!phoneVerification.verificationCode || phoneVerification.verificationCode.length !== 6) {
      setPhoneVerification(prev => ({
        ...prev,
        errorMessage: "6자리 인증번호를 입력해주세요."
      }));
      return;
    }

    setPhoneVerification(prev => ({
      ...prev,
      isVerifying: true,
      errorMessage: ""
    }));

    try {
      // 인증번호 확인 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 인증 성공 (더미 데이터에서는 "123456"이 정답)
      if (phoneVerification.verificationCode === "123456") {
        console.log('인증 성공:', {
          phone: profile.phone,
          verificationCode: phoneVerification.verificationCode
        });
        setPhoneVerification(prev => ({
          ...prev,
          isVerified: true,
          isVerifying: false,
          countdown: 0,
          errorMessage: "",
          originalPhone: profile.phone // 인증 완료된 전화번호를 원본으로 저장
        }));
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          isVerifying: false,
          errorMessage: "인증번호가 일치하지 않습니다."
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isVerifying: false,
        errorMessage: "인증에 실패했습니다. 다시 시도해주세요."
      }));
    }
  };

  // 인증번호 재발송
  const handleResendCode = () => {
    setPhoneVerification(prev => ({
      ...prev,
      verificationCode: "",
      countdown: 0,
      errorMessage: ""
    }));
    handleSendVerificationCode();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB 제한
        alert("이미지 크기는 2MB 이하여야 합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setProfile((prev) => ({
          ...prev,
          profileImage: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");

    try {
      // 새로운 프로필 API로 데이터 저장
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          displayName: profile.displayName,
          email: profile.email,
          phone: profile.phone,
          profileImage: profile.profileImage,
          interestedCategories: profile.interestedCategories,
          profileVisibility: profile.profileVisibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '프로필 저장에 실패했습니다.');
      }

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus("saved");
        console.log('프로필 저장 성공:', result.data);
        
        // 전화번호 인증 상태 업데이트
        if (profile.phone) {
          setPhoneVerification(prev => ({
            ...prev,
            originalPhone: profile.phone
          }));
        }
      } else {
        throw new Error(result.message || '프로필 저장에 실패했습니다.');
      }

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };



  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            프로필 설정
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            프로필 정보와 관심 카테고리를 관리하세요.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">프로필 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            프로필 설정
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            프로필 정보와 관심 카테고리를 관리하세요.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">프로필 로드 실패</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          프로필 설정
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          프로필 정보와 관심 카테고리를 관리하세요.
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* 프로필 이미지 */}
          <div>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-medium">
                      {profile.firstName.charAt(0)}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  프로필 사진
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  JPG, PNG 파일만 업로드 가능합니다. (최대 2MB)
                </p>
                <button
                  onClick={() =>
                    (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  사진 변경
                </button>
              </div>
            </div>
          </div>

          {/* 기본 정보 및 연락처 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 기본 정보 */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">기본 정보</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">인증된 회원의 이름은 변경할 수 없습니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                    placeholder="사용할 닉네임을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">다른 사용자에게 표시될 닉네임입니다.</p>
                </div>


              </div>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">연락처 정보</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <div className="space-y-3">
                    {/* 전화번호 입력 및 인증 상태 */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="010-1234-5678"
                        disabled={phoneVerification.isVerified && profile.phone === phoneVerification.originalPhone}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          phoneVerification.isVerified && profile.phone === phoneVerification.originalPhone
                            ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {phoneVerification.isVerified ? (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-md h-10 min-w-32">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">인증완료</span>
                          </div>
                          {/* 재인증 버튼 - 테스트용으로 항상 표시 */}
                          <button
                            onClick={() => {
                              console.log('재인증 버튼 클릭:', {
                                currentPhone: profile.phone,
                                originalPhone: phoneVerification.originalPhone
                              });
                              setPhoneVerification(prev => ({
                                ...prev,
                                isVerified: false,
                                verificationCode: "",
                                countdown: 0,
                                errorMessage: ""
                              }));
                            }}
                            className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors h-10 text-sm min-w-24"
                          >
                            재인증
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSendVerificationCode}
                          disabled={phoneVerification.isSending || phoneVerification.countdown > 0}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-10 min-w-32 flex-shrink-0"
                        >
                          {phoneVerification.isSending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>발송중...</span>
                            </>
                          ) : phoneVerification.countdown > 0 ? (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>{Math.floor(phoneVerification.countdown / 60)}:{(phoneVerification.countdown % 60).toString().padStart(2, '0')}</span>
                            </>
                          ) : (
                            <span>인증번호 발송</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* 인증번호 입력 (인증되지 않은 경우에만 표시) */}
                    {!phoneVerification.isVerified && phoneVerification.countdown > 0 && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={phoneVerification.verificationCode}
                          onChange={(e) => setPhoneVerification(prev => ({
                            ...prev,
                            verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                          }))}
                          placeholder="6자리 인증번호"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleVerifyCode}
                          disabled={phoneVerification.isVerifying || phoneVerification.verificationCode.length !== 6}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 min-w-32 flex-shrink-0"
                        >
                          {phoneVerification.isVerifying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>확인중...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              <span>확인</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* 인증번호 재발송 (시간 만료 시) */}
                    {!phoneVerification.isVerified && phoneVerification.countdown === 0 && profile.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">인증번호가 만료되었습니다.</span>
                        <button
                          onClick={handleResendCode}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          인증번호 재발송
                        </button>
                      </div>
                    )}

                    {/* 에러 메시지 */}
                    {phoneVerification.errorMessage && (
                      <div className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{phoneVerification.errorMessage}</span>
                      </div>
                    )}

                    {/* 인증 완료 메시지 */}
                    {phoneVerification.isVerified && (
                      <div className="text-sm text-green-600 flex items-center space-x-1">
                        <Check className="h-4 w-4" />
                        <span>전화번호가 성공적으로 인증되었습니다.</span>
                      </div>
                    )}

                    {/* 안내 메시지 */}
                    <p className="text-xs text-gray-500">
                      {phoneVerification.isVerified 
                        ? "전화번호가 인증되었습니다. 변경 시 재인증이 필요합니다."
                        : "본인 명의의 휴대폰 번호를 입력하고 인증을 완료해주세요."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 프로필 공개설정 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">프로필 공개설정</h4>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                프로필 정보가 다른 사용자에게 어떻게 보이는지 설정하세요.
              </p>
              <p className="text-xs text-orange-600 mb-3 bg-orange-50 p-2 rounded-md border border-orange-200">
                ⚠️ 비공개 선택 시 커뮤니티 활동과 전문가 상담 매칭에 제약이 있을 수 있습니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    value: "public",
                    label: "전체 공개",
                    description: "모든 사용자가 볼 수 있음",
                  },
                  {
                    value: "experts",
                    label: "전문가만",
                    description: "매칭 시에만 공개",
                  },
                  {
                    value: "private",
                    label: "비공개",
                    description: "프로필 비공개",
                  },
                ].map((option) => {
                  const isActive = profile.profileVisibility === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleVisibilityChange(option.value as "public" | "experts" | "private")}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`font-medium text-sm ${isActive ? "text-blue-900" : "text-gray-900"}`}
                      >
                        {option.label}
                      </div>
                      <div
                        className={`text-xs ${isActive ? "text-blue-700" : "text-gray-600"}`}
                      >
                        {option.description}
                      </div>
                      {isActive && (
                        <div className="mt-1 flex justify-end">
                          <Check className="h-3 w-3 text-blue-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 관심 상담분야 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">관심 상담분야</h4>
            <div className="space-y-4">
              {/* 선택된 카테고리 배지 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.interestedCategories.map((categoryId) => {
                  return (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {getCategoryName(categoryId)}
                      <button
                        onClick={() => handleRemoveCategory(categoryId)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {profile.interestedCategories.length === 0 && (
                  <span className="text-sm text-gray-500">선택된 관심분야가 없습니다</span>
                )}
              </div>

              {/* 카테고리 추가 드롭다운 */}
              <div className="space-y-3">
                <select
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setShowCustomInput(true);
                    } else if (e.target.value) {
                      handleAddCategory(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    관심분야 추가하기
                  </option>
                  {categories
                    .filter((category) => !profile.interestedCategories.includes(category.id))
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {category.description}
                      </option>
                    ))}
                  <option value="custom">직접 입력하기</option>
                </select>

                {/* 직접 입력 필드 */}
                {showCustomInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="관심분야를 직접 입력하세요"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddCustomCategory();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddCustomCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomCategory("");
                      }}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                관심 있는 상담분야를 선택하면 관련 전문가를 더 쉽게 찾을 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
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
                <span>저장</span>
              </>
            )}
          </button>
        </div>

        {/* 상태 메시지 */}
        {saveStatus === "saved" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <Check className="h-5 w-5" />
              <span>프로필이 성공적으로 저장되었습니다.</span>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>저장에 실패했습니다. 다시 시도해주세요.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
