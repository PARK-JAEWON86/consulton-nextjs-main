"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Star,
  Target,
  TrendingUp,
  MessageCircle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  expertLevel: string;
  role?: 'expert' | 'client' | 'admin';
  // 프로필 관련 추가 필드들
  phone?: string;
  location?: string;
  birthDate?: string;
  interests?: string[];
  bio?: string;
  profileImage?: string | null;
  totalConsultations?: number;
  favoriteExperts?: number;
  joinDate?: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
}

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  birthDate?: string;
  interests?: string[];
  bio?: string;
  profileImage?: string | null;
  totalConsultations?: number;
  favoriteExperts?: number;
  joinDate?: string;
}

interface UserProfileProps {
  userData?: UserData;
  onSave?: (data: UserData) => void;
}

const UserProfile = ({ userData, onSave }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null
  });
  const [profileData, setProfileData] = useState<UserData>({});
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 앱 상태 로드
  useEffect(() => {
    const loadAppState = async () => {
      try {
        const response = await fetch('/api/app-state');
        const result = await response.json();
        if (result.success) {
          setAppState({
            isAuthenticated: result.data.isAuthenticated,
            user: result.data.user
          });
        }
      } catch (error) {
        console.error('앱 상태 로드 실패:', error);
      }
    };

    loadAppState();
  }, []);

  // 사용자 프로필 데이터 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (appState.isAuthenticated && appState.user) {
        try {
          setIsLoadingProfile(true);
          
          // 더미데이터에서 김철수의 프로필 정보 가져오기
          if (appState.user.name === "김철수") {
            const dummyProfileData = {
              name: "김철수",
              email: "kimcheolsu@example.com",
              phone: "010-1234-5678",
              location: "서울특별시 강남구",
              birthDate: "1990-05-15",
              interests: ["진로상담", "심리상담", "재무상담"],
              bio: "다양한 분야의 전문가들과 상담을 통해 성장하고 있습니다. 특히 진로와 심리 분야에 관심이 많습니다.",
              profileImage: null,
              totalConsultations: 12,
              favoriteExperts: 5,
              joinDate: "2024-01-15"
            };
            
            setProfileData(dummyProfileData);
          } else {
            // 기본 사용자 정보만 설정
            setProfileData({
              name: appState.user.name,
              email: appState.user.email,
              phone: "",
              location: "",
              birthDate: "",
              interests: [],
              bio: "",
              profileImage: null,
              totalConsultations: 0,
              favoriteExperts: 0,
              joinDate: new Date().toISOString().split('T')[0],
            });
          }
        } catch (error) {
          console.error('사용자 프로필 로드 실패:', error);
          // 에러 시 기본 사용자 정보만 설정
          setProfileData({
            name: appState.user.name,
            email: appState.user.email,
            phone: "",
            location: "",
            birthDate: "",
            interests: [],
            bio: "",
            profileImage: null,
            totalConsultations: 0,
            favoriteExperts: 0,
            joinDate: new Date().toISOString().split('T')[0],
          });
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    loadUserProfile();
  }, [appState.isAuthenticated, appState.user]);

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingInterests(true);
        const response = await fetch('/api/categories?activeOnly=true');
        const result = await response.json();
        
        if (result.success) {
          const categoryNames = result.data.map((cat: any) => cat.name);
          setAvailableInterests(categoryNames);
        } else {
          console.error('카테고리 로드 실패:', result.message);
          setAvailableInterests([]);
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
        setAvailableInterests([]);
      } finally {
        setIsLoadingInterests(false);
      }
    };

    loadCategories();
  }, []);

  const handleInputChange = (field: keyof UserData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfileData((prev) => {
      const currentInterests = prev.interests || [];
      
      if (currentInterests.includes(interest)) {
        // 이미 선택된 분야라면 제거
        return {
          ...prev,
          interests: currentInterests.filter((i: string) => i !== interest),
        };
      } else {
        // 새로운 분야를 선택하려는 경우, 최대 10개까지만 허용
        if (currentInterests.length >= 10) {
          alert('관심분야는 최대 10개까지만 선택할 수 있습니다.');
          return prev;
        }
        return {
          ...prev,
          interests: [...currentInterests, interest],
        };
      }
    });
  };

  const handleSaveProfile = async () => {
    setSaveStatus("saving");
    try {
      // 실제 API 호출
      if (appState.user) {
        const response = await fetch(`/api/users/${appState.user.id}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
          throw new Error('프로필 저장 실패');
        }
        
        const result = await response.json();
        if (result.success) {
          onSave?.(profileData);
          setSaveStatus("success");
          setIsEditing(false);
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          throw new Error(result.message || '프로필 저장 실패');
        }
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveStatus("idle");
    // 원래 데이터로 복원 - 더미데이터 사용
    if (appState.user && appState.user.name === "김철수") {
      const dummyProfileData = {
        name: "김철수",
        email: "kimcheolsu@example.com",
        phone: "010-1234-5678",
        location: "서울특별시 강남구",
        birthDate: "1990-05-15",
        interests: ["진로상담", "심리상담", "재무상담"],
        bio: "다양한 분야의 전문가들과 상담을 통해 개인적 성장을 추구합니다.",
        profileImage: null,
        totalConsultations: 12,
        favoriteExperts: 5,
        joinDate: "2024-01-15"
      };
      setProfileData(dummyProfileData);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  const calculateMembershipDuration = () => {
    if (!profileData.joinDate) return "-";
    const joinDate = new Date(profileData.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays}일`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}개월`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 ? `${years}년 ${months}개월` : `${years}년`;
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoadingProfile) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">프로필을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!appState.isAuthenticated || !appState.user) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            사용자 프로필
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>편집</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>취소</span>
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saveStatus === "saving"}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saveStatus === "saving" ? "저장 중..." : "저장"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* 상태 메시지 */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">
                프로필이 성공적으로 저장되었습니다!
              </span>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">
                저장 중 오류가 발생했습니다. 다시 시도해주세요.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-2">
            {/* 프로필 사진 및 기본 정보 */}
            <div className="flex items-start space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="프로필"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        value={profileData.name || ""}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        자기소개
                      </label>
                      <textarea
                        value={profileData.bio || ""}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {profileData.name || "이름 없음"}
                    </h2>
                    <p className="text-gray-600 mb-4">{profileData.bio || "자기소개가 없습니다."}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        가입일: {formatDate(profileData.joinDate || "")} (
                        {calculateMembershipDuration()} 활동)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  이메일
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.email || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  전화번호
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.phone || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  지역
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location || ""}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.location || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  생년월일
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={profileData.birthDate || ""}
                    onChange={(e) =>
                      handleInputChange("birthDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {formatDate(profileData.birthDate || "")}
                  </p>
                )}
              </div>
            </div>

            {/* 관심 분야 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Target className="h-4 w-4 inline mr-1" />
                  관심 분야
                </label>
                {isEditing && (
                  <span className="text-sm text-gray-500">
                    {profileData.interests?.length || 0}/10 선택됨
                  </span>
                )}
              </div>
              {isEditing && (
                <p className="text-xs text-gray-500 mb-3">
                  관심있는 상담 분야를 선택하면 맞춤형 전문가 추천을 받을 수 있습니다. (최대 10개)
                </p>
              )}
              {isLoadingInterests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">분야 목록을 불러오는 중...</span>
                </div>
              ) : (
                isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableInterests.map((interest) => {
                      const isSelected = profileData.interests?.includes(interest);
                      const isDisabled = !isSelected && (profileData.interests?.length || 0) >= 10;
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          disabled={isDisabled}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 cursor-pointer'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                          }`}
                          title={isDisabled ? '관심분야는 최대 10개까지만 선택할 수 있습니다' : ''}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests && profileData.interests.length > 0 ? (
                      profileData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">관심 분야가 설정되지 않았습니다.</span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* 오른쪽: 통계 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                활동 통계
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      총 상담 수
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {profileData.totalConsultations || 0}회
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">
                      즐겨찾는 전문가
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {profileData.favoriteExperts || 0}명
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      활동 기간
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {calculateMembershipDuration()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
