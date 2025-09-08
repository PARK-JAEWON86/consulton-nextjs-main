"use client";

import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  Building,
  Shield,
  Clock,
  Star,
  User,
  CheckCircle,
} from "lucide-react";

interface Expert {
  id: string;
  name: string;
  title: string;
  creditsPerMinute: number;
  rating: number;
  reviewCount: number;
  avatar?: string;
}

interface PaymentModalProps {
  expert: Expert;
  onClose: () => void;
}

const PaymentModal = ({ expert, onClose }: PaymentModalProps) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [consultationType, setConsultationType] = useState("chat"); // 'chat', 'video', 'call'
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: 상담 선택, 2: 결제 정보, 3: 확인
  const [savedCards, setSavedCards] = useState<any[]>([]);

  // 저장된 카드 정보 로드
  useEffect(() => {
    const loadSavedCards = async () => {
      try {
        const response = await fetch('/api/app-state');
        const result = await response.json();
        if (result.success && result.data.user?.paymentMethods?.cards) {
          setSavedCards(result.data.user.paymentMethods.cards);
          // 기본 카드가 있으면 선택
          const defaultCard = result.data.user.paymentMethods.cards.find((card: any) => card.isDefault);
          if (defaultCard) {
            setSelectedCardId(defaultCard.id);
          }
        }
      } catch (error) {
        console.error('저장된 카드 정보 로드 실패:', error);
      }
    };

    loadSavedCards();
  }, []);

  const consultationTypes = [
    {
      id: "chat",
      name: "텍스트 상담",
      icon: "💬",
      description: "실시간 채팅으로 진행",
      creditRate: 1.0,
      features: ["실시간 채팅", "파일 공유", "상담 요약 제공"],
    },
    {
      id: "video",
      name: "화상 상담",
      icon: "📹",
      description: "1:1 화상 통화로 진행",
      creditRate: 1.5,
      features: ["HD 화상 통화", "화면 공유", "녹화 서비스", "상담 요약 제공"],
    },
    {
      id: "call",
      name: "음성 상담",
      icon: "📞",
      description: "음성 통화로 진행",
      creditRate: 1.2,
      features: ["고품질 음성 통화", "녹음 서비스", "상담 요약 제공"],
    },
  ];

  const paymentMethods = [
    {
      id: "card",
      name: "신용/체크카드",
      icon: <CreditCard className="h-5 w-5" />,
      description: "토스페이먼츠를 통한 안전한 카드 결제",
    },
  ];

  const selectedType = consultationTypes.find(
    (type) => type.id === consultationType
  );
  const baseCredits = expert.creditsPerMinute * estimatedDuration;
  const finalCredits = Math.round(baseCredits * selectedType!.creditRate);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // 결제 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Payment processed:", {
        expert: expert.id,
        consultationType,
        duration: estimatedDuration,
        paymentMethod: selectedPaymentMethod,
        credits: finalCredits,
      });

      // 상담 예약 자동 등록
      console.log("상담 예약 등록:", {
        customer: "고객",
        topic: `${expert.name} - ${selectedType?.name}`,
        amount: finalCredits,
        method: consultationType,
        duration: estimatedDuration,
      });

      // 크레딧 사용 완료 시 상담 페이지로 이동
      alert("크레딧 사용이 완료되었습니다! 상담을 시작합니다.");
      onClose();
    } catch (error) {
      console.error("Credit usage failed:", error);
      alert("크레딧 사용에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handlePayment();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentStep === 1
                ? "상담 방법 선택"
                : currentStep === 2
                ? "결제 정보"
                : "크레딧 사용 확인"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {expert.name} 전문가와의 상담
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 진행 상태 */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: 상담 방법 선택 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* 전문가 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    {expert.avatar ? (
                      <img
                        src={expert.avatar}
                        alt={expert.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {expert.name}
                    </h3>
                    <p className="text-sm text-gray-600">{expert.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {expert.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({expert.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상담 방법 선택 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  상담 방법을 선택하세요
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {consultationTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setConsultationType(type.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        consultationType === type.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <h5 className="font-medium text-gray-900 mb-1">
                          {type.name}
                        </h5>
                        <p className="text-sm text-gray-600 mb-3">
                          {type.description}
                        </p>
                        <div className="space-y-1">
                          {type.features.map((feature, index) => (
                            <div
                              key={index}
                              className="text-xs text-gray-500 flex items-center"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 예상 시간 선택 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  예상 상담 시간
                </h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={estimatedDuration}
                    onChange={(e) =>
                      setEstimatedDuration(parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {estimatedDuration}분
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>15분</span>
                  <span>2시간</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 결제 방법 선택 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  결제 방법을 선택하세요
                </h4>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPaymentMethod === method.id
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {method.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 저장된 카드 선택 */}
              {selectedPaymentMethod === "card" && savedCards.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    저장된 카드 선택
                  </h5>
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          selectedCardId === card.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {card.cardBrand} •••• {card.cardNumber.slice(-4)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {card.cardholderName} • {card.expiryMonth}/{card.expiryYear}
                              </div>
                            </div>
                          </div>
                          {card.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              기본
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">안전한 결제</p>
                    <p className="text-yellow-700">
                      모든 결제는 SSL로 암호화되어 안전하게 처리됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 결제 확인 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">전문가</span>
                  <span className="font-medium">{expert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상담 방법</span>
                  <span className="font-medium">{selectedType!.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 시간</span>
                  <span className="font-medium">{estimatedDuration}분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">기본 크레딧</span>
                  <span className="font-medium">{baseCredits} 크레딧</span>
                </div>
                {selectedType!.creditRate !== 1.0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {selectedType!.name} 추가 요금
                    </span>
                    <span className="font-medium">
                      x{selectedType!.creditRate}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">
                    총 사용 크레딧
                  </span>
                  <span className="font-bold text-lg text-blue-600">
                    {finalCredits} 크레딧
                  </span>
                </div>
              </div>

              {/* 선택된 결제 수단 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-gray-900">결제 수단</h5>
                {selectedPaymentMethod === "card" && selectedCardId && (
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      {(() => {
                        const selectedCard = savedCards.find(card => card.id === selectedCardId);
                        if (selectedCard) {
                          return (
                            <>
                              <div className="font-medium text-gray-900">
                                {selectedCard.cardBrand} •••• {selectedCard.cardNumber.slice(-4)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedCard.cardholderName} • {selectedCard.expiryMonth}/{selectedCard.expiryYear}
                              </div>
                            </>
                          );
                        }
                        return <span className="text-gray-600">카드를 선택해주세요</span>;
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  • 실제 상담 시간에 따라 최종 크레딧 사용량이 조정될 수
                  있습니다.
                </p>
                <p>
                  • 상담 중 언제든지 종료할 수 있으며, 사용한 시간만큼만
                  크레딧이 차감됩니다.
                </p>
                <p>• 상담 완료 후 요약본과 녹음/녹화 파일을 제공합니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-right">
            <div className="text-sm text-gray-600">예상 사용 크레딧</div>
            <div className="text-lg font-bold text-blue-600">
              {finalCredits} 크레딧
            </div>
          </div>

          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={currentStep < 3 ? handleNext : handlePayment}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isProcessing
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </div>
              ) : currentStep < 3 ? (
                "다음"
              ) : (
                "크레딧 사용하고 상담 시작"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
