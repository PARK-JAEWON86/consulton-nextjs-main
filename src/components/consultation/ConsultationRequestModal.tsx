"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  MessageCircle, 
  Video, 
  Phone, 
  Calendar, 
  Clock,
  User,
  Mail,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { ConsultationType } from "@/types";

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  expertName: string;
  expertSpecialty: string;
  expertConsultationTypes: ConsultationType[];
  onSubmit: (data: ConsultationRequestData) => Promise<void>;
}

export interface ConsultationRequestData {
  consultationType: ConsultationType;
  preferredDate?: string;
  preferredTime?: string;
  message: string;
  clientName: string;
  clientEmail: string;
  urgency: 'low' | 'medium' | 'high';
}

export default function ConsultationRequestModal({
  isOpen,
  onClose,
  expertName,
  expertSpecialty,
  expertConsultationTypes,
  onSubmit
}: ConsultationRequestModalProps) {
  const [formData, setFormData] = useState<ConsultationRequestData>({
    consultationType: expertConsultationTypes[0] || 'video',
    preferredDate: '',
    preferredTime: '',
    message: '',
    clientName: '',
    clientEmail: '',
    urgency: 'medium'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ConsultationRequestData>>({});
  const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsLoadingUserInfo(true);
        
        // 먼저 로컬 스토리지에서 확인
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          try {
            const user = JSON.parse(storedUser);
            const isAuth = JSON.parse(storedAuth);
            
            if (isAuth && user) {
              setUserInfo({
                name: user.name || user.nickname || '',
                email: user.email || ''
              });
              
              // 폼 데이터에 사용자 정보 설정
              setFormData(prev => ({
                ...prev,
                clientName: user.name || user.nickname || '',
                clientEmail: user.email || ''
              }));
              
              setIsLoadingUserInfo(false);
              return;
            }
          } catch (error) {
            console.error('로컬 스토리지 파싱 오류:', error);
          }
        }
        
        // API에서 사용자 정보 로드
        const response = await fetch('/api/app-state');
        const result = await response.json();
        
        if (result.success && result.data.isAuthenticated && result.data.user) {
          const user = result.data.user;
          setUserInfo({
            name: user.name || user.nickname || '',
            email: user.email || ''
          });
          
          // 폼 데이터에 사용자 정보 설정
          setFormData(prev => ({
            ...prev,
            clientName: user.name || user.nickname || '',
            clientEmail: user.email || ''
          }));
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setIsLoadingUserInfo(false);
      }
    };

    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  // 폼 데이터 업데이트
  const updateFormData = (field: keyof ConsultationRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Partial<ConsultationRequestData> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = '이름을 입력해주세요.';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.message.trim()) {
      newErrors.message = '상담 내용을 입력해주세요.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = '상담 내용을 10자 이상 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // 성공 시 폼 초기화
      setFormData({
        consultationType: 'video',
        preferredDate: '',
        preferredTime: '',
        message: '',
        clientName: '',
        clientEmail: '',
        urgency: 'medium'
      });
      onClose();
    } catch (error) {
      console.error('상담 신청 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상담 방식 옵션 (전문가가 설정한 방식만)
  const consultationTypeOptions = [
    { value: 'video', label: '화상 상담', icon: Video, description: '화면 공유와 실시간 소통' },
    { value: 'chat', label: '채팅 상담', icon: MessageCircle, description: '텍스트 기반 상담' },
    { value: 'voice', label: '음성 상담', icon: Phone, description: '음성 통화 상담' }
  ].filter(option => expertConsultationTypes.includes(option.value as ConsultationType));

  // 긴급도 옵션
  const urgencyOptions = [
    { value: 'low', label: '보통', color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'medium', label: '중요', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'high', label: '긴급', color: 'text-red-600', bgColor: 'bg-red-50' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">상담 신청</h2>
            <p className="text-sm text-gray-600 mt-1">
              {expertName} 전문가님께 {expertSpecialty} 상담을 신청합니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              기본 정보
            </h3>
            
            {isLoadingUserInfo ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">사용자 정보를 불러오는 중...</span>
              </div>
            ) : userInfo ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">로그인된 사용자 정보</p>
                    <p className="text-sm text-green-700">
                      {userInfo.name} ({userInfo.email})
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">로그인이 필요합니다</p>
                    <p className="text-sm text-yellow-700">
                      상담 신청을 위해 먼저 로그인해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  disabled={!!userInfo}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.clientName ? 'border-red-300' : 'border-gray-300'
                  } ${userInfo ? 'bg-gray-50 text-gray-500' : ''}`}
                  placeholder="홍길동"
                />
                {errors.clientName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.clientName}
                  </p>
                )}
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData('clientEmail', e.target.value)}
                  disabled={!!userInfo}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.clientEmail ? 'border-red-300' : 'border-gray-300'
                  } ${userInfo ? 'bg-gray-50 text-gray-500' : ''}`}
                  placeholder="example@email.com"
                />
                {errors.clientEmail && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.clientEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 상담 방식 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              상담 방식
            </h3>
            
            {consultationTypeOptions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">상담 방식이 설정되지 않았습니다</p>
                    <p className="text-sm text-yellow-700">
                      {expertName} 전문가님께서 아직 상담 방식을 설정하지 않으셨습니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>{expertName}</strong> 전문가님이 제공하는 상담 방식입니다.
                  </p>
                </div>
                
                <div className={`grid gap-3 ${
                  consultationTypeOptions.length === 1 ? 'grid-cols-1' :
                  consultationTypeOptions.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-3'
                }`}>
                  {consultationTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData('consultationType', option.value)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.consultationType === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 ${
                            formData.consultationType === option.value ? 'text-blue-600' : 'text-gray-500'
                          }`} />
                          <div>
                            <div className={`font-medium ${
                              formData.consultationType === option.value ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {option.label}
                            </div>
                            <div className={`text-xs ${
                              formData.consultationType === option.value ? 'text-blue-700' : 'text-gray-500'
                            }`}>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 희망 일정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              희망 일정 (선택사항)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 희망 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 날짜
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateFormData('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 희망 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 시간
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => updateFormData('preferredTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">시간 선택</option>
                  <option value="09:00">오전 9시</option>
                  <option value="10:00">오전 10시</option>
                  <option value="11:00">오전 11시</option>
                  <option value="14:00">오후 2시</option>
                  <option value="15:00">오후 3시</option>
                  <option value="16:00">오후 4시</option>
                  <option value="17:00">오후 5시</option>
                  <option value="18:00">오후 6시</option>
                </select>
              </div>
            </div>
          </div>

          {/* 긴급도 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              상담 긴급도
            </h3>
            
            <div className="flex space-x-3">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateFormData('urgency', option.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.urgency === option.value
                      ? `${option.bgColor} ${option.color} border-current`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 내용 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              상담 내용 *
            </h3>
            
            <div>
              <textarea
                value={formData.message}
                onChange={(e) => updateFormData('message', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.message ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="상담하고 싶은 내용을 자세히 작성해주세요. 예: 현재 직장에서 스트레스를 받고 있어서 전문가님의 조언을 구하고 싶습니다..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.message ? (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.message}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs">
                    최소 10자 이상 입력해주세요
                  </p>
                )}
                <p className="text-gray-400 text-xs">
                  {formData.message.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">상담 신청 안내</p>
                <ul className="space-y-1 text-xs">
                  <li>• 상담 신청 후 24시간 내에 전문가가 검토하여 연락드립니다.</li>
                  <li>• 상담 시간과 방식은 전문가와 조율하여 결정됩니다.</li>
                  <li>• 긴급한 상담이 필요한 경우 별도로 연락해주세요.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !userInfo || consultationTypeOptions.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  신청 중...
                </>
              ) : !userInfo ? (
                '로그인 필요'
              ) : consultationTypeOptions.length === 0 ? (
                '상담 방식 없음'
              ) : (
                '상담 신청하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
