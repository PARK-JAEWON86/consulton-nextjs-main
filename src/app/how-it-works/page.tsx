"use client";

import React from "react";
import {
  Phone,
  CheckCircle,
  MessageSquare,
  CreditCard,
  Clock,
  Users,
  Star,
  ArrowRight,
  Video,
  Calendar,
} from "lucide-react";

const HowItWorksPage = () => {
  const guides = [
    {
      id: 1,
      title: "열린 마음으로 소통하기",
      activeTag: "열린 마음으로 소통하기",
      color: "blue",
      content: "상담에서는 열린 마음으로 다양한 관점을 받아들이는 것이 중요합니다. 전문가의 조언에 귀 기울이고, 새로운 아이디어나 다른 의견도 적극적으로 고려해보세요. 때로는 예상과 다른 방향의 답변이 더 큰 도움이 될 수 있습니다."
    },
    {
      id: 2,
      title: "시간 약속 지키기",
      activeTag: "시간 약속 지키기",
      color: "yellow",
      content: "약속된 상담 시간을 지키는 것은 상대방에 대한 기본적인 예의입니다. 부득이한 사정으로 시간을 변경해야 할 경우, 가능한 한 미리 연락하여 일정을 조정해주세요. 서로의 시간을 소중히 여기는 마음이 좋은 상담의 시작입니다."
    },
    {
      id: 3,
      title: "상담 목적",
      activeTag: "상담 목적",
      color: "green",
      content: "상담의 목적은 전문적인 조언을 구하고 제공하는 것입니다. 영업이나 홍보보다는 순수한 지식 공유와 문제 해결에 집중해주세요. 물론 상담 과정에서 자연스럽게 비즈니스 기회가 생긴다면, 그것 또한 좋은 결과라고 할 수 있습니다."
    },
    {
      id: 4,
      title: "사전 준비하기",
      activeTag: "사전 준비하기",
      color: "purple",
      content: "상담 전에 질문하고 싶은 내용을 미리 정리해두시면 더욱 효과적인 상담을 받을 수 있습니다. 구체적인 상황이나 고민을 준비하고, 무료 AI 채팅상담을 통해 상담 주제를 명확히 하는 것도 좋은 방법입니다. 준비된 상담이 더 큰 가치를 만들어냅니다."
    },
    {
      id: 5,
      title: "진정성 있는 소통",
      activeTag: "진정성 있는 소통",
      color: "red",
      content: "Consulton에서는 개인의 진정한 경험과 전문성을 바탕으로 한 상담을 지향합니다. 기업이나 조직의 이름보다는 개인의 실제 경험과 인사이트를 나누는 것이 더 의미 있는 상담을 만듭니다. 진정성 있는 소통이 우리 플랫폼의 핵심 가치입니다."
    },
    {
      id: 6,
      title: "상호 존중과 예의",
      activeTag: "상호 존중과 예의",
      color: "indigo",
      content: "상담 과정에서 서로를 존중하고 예의를 지키는 것이 중요합니다. 다른 의견이나 관점에 대해서도 열린 자세로 경청하고, 비판보다는 건설적인 피드백을 제공해주세요. 상호 존중하는 분위기에서 더 나은 상담 결과를 얻을 수 있습니다."
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600",
      yellow: isActive ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600",
      green: isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600",
      purple: isActive ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600",
      red: isActive ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600",
      indigo: isActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600",
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 섹션 */}
      <div className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              전문가와 함께하는{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                스마트 상담 플랫폼
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              전문가와의 1:1 상담을 통해 비즈니스 문제를 해결하고 새로운 기회를
              발견하세요
            </p>
          </div>
        </div>
      </div>

      {/* 고객-전문가 연결 시각화 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-white border border-gray-200 rounded-xl p-12 relative overflow-hidden">
          {/* 배경 동심원 - 체크 배지 중심으로 정확히 정렬 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{transform: 'translateY(-30px)'}}>
            <div className="relative flex items-center justify-center">
              {/* 체크 배지 위치에 맞춘 동심원들 */}
              <div className="absolute rounded-full border border-gray-200" style={{width: '700px', height: '700px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '680px', height: '680px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '660px', height: '660px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '640px', height: '640px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '620px', height: '620px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '600px', height: '600px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '580px', height: '580px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '560px', height: '560px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '540px', height: '540px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '520px', height: '520px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '500px', height: '500px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '480px', height: '480px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '460px', height: '460px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '440px', height: '440px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '420px', height: '420px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '400px', height: '400px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '380px', height: '380px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '360px', height: '360px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '340px', height: '340px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '320px', height: '320px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '300px', height: '300px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '280px', height: '280px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '260px', height: '260px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '240px', height: '240px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '220px', height: '220px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '200px', height: '200px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '180px', height: '180px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '160px', height: '160px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '140px', height: '140px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '120px', height: '120px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '100px', height: '100px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '80px', height: '80px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '60px', height: '60px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '40px', height: '40px'}}></div>
              <div className="absolute rounded-full border border-gray-200" style={{width: '20px', height: '20px'}}></div>
            </div>
          </div>

                    <div className="relative z-10">
            {/* 프로필과 연결 표시를 한 줄에 정렬 */}
            <div className="flex items-center justify-center mb-6">
              {/* 고객 프로필 */}
              <div className="flex flex-col items-center relative z-30">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face"
                    alt="고객"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-base text-gray-700 font-semibold mt-4">김철수님</p>
                <p className="text-sm text-gray-500">상담 신청자</p>
              </div>

              {/* 연결 표시 - 프로필과 같은 높이 */}
              <div className="flex items-center px-6 relative z-30">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-1 bg-green-400 rounded-full"></div>
                  <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-8 h-1 bg-green-400 rounded-full"></div>
                </div>
              </div>

              {/* 전문가 프로필 */}
              <div className="flex flex-col items-center relative z-30">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b632?w=96&h=96&fit=crop&crop=face"
                    alt="전문가"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-base text-gray-700 font-semibold mt-4">박민정 전문가</p>
                <p className="text-sm text-gray-500">마케팅 컨설턴트</p>
              </div>
            </div>
          </div>

          {/* 상태 배지 */}
          <div className="text-center mb-8 relative z-30">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full text-base font-medium">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              Consult On
            </div>
          </div>

          {/* 서비스 설명 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-gray-600 text-sm font-medium mb-2">성능</h4>
              <h3 className="text-gray-900 text-lg font-semibold mb-3">빠른 전문가 매칭</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI 기반 매칭 시스템으로 고객의 요구사항에 가장 적합한 전문가를 
                신속하게 연결해드립니다. 실시간 상담 품질 보장으로 최상의 
                상담 경험을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3단계 프로세스 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            간단한 3단계로 전문가 상담을 시작하세요
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 1단계: 전문가 선택 & 예약 */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600">1</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                전문가 선택 & 예약
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                전문가 카테고리를 둘러보거나 검색하여 당신에게 맞는 전문가를
                찾아보세요. 어떤 전문가를 선택해야 할지 고민된다면, 먼저 
                <span className="text-purple-600 font-semibold">무료 AI 채팅상담</span>을 
                이용해보세요!
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-600">AI 상담 TIP</span>
                </div>
                <p className="text-sm text-gray-600">
                  AI가 당신의 상황을 분석하여 가장 적합한 전문가 분야를 추천해드립니다!
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>전문가 선택 완료</span>
              </div>
            </div>
          </div>

          {/* 2단계: 상담 일정 확정 */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600">2</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                상담 일정 확정
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                전문가에게 상담 요청을 보내면, 이메일이나 문자 알림을 통해 
                전문가와 상담 일정을 확정하게 됩니다. 일정이 확정되면 상담이 
                진행됩니다.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                상담에서 다룰 질문과 주제를 미리 준비해두세요. 
                <span className="text-purple-600 font-semibold">무료 AI 채팅상담</span>을 
                통해 상담 주제를 결정하고 질문을 미리 정리해보는 것도 추천합니다!
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">상담 일정</span>
                  <span className="text-blue-600 font-semibold">확정됨</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">알림 방법</span>
                  <span className="text-gray-600">이메일 + 문자</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  📅 2024년 1월 15일 오후 3시 ✓
                </div>
              </div>
            </div>
          </div>

          {/* 3단계: 상담 진행 및 결제 */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600">3</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                상담 진행 & 결제
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                음성, 채팅, 화상상담 중 원하는 방식을 선택하여 전문가와 상담을 
                진행하세요. 미리 충전해둔 크레딧으로 자동 결제가 이루어집니다.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Phone className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-blue-600">음성상담</span>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-green-600">채팅상담</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Video className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-purple-600">화상상담</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">결제 방식</span>
                  <div className="flex items-center space-x-1">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 font-semibold">크레딧</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">보유 크레딧</span>
                  <span className="text-green-600 font-semibold">2,500 크레딧</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상담 이용 가이드 섹션 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              상담 이용 가이드
            </h2>
            <p className="text-gray-600 text-lg">
              모든 회원과 전문가가 함께 지켜야 할 상담 이용 가이드입니다.
              서로를 존중하며 양질의 상담 경험을 만들어가요.
            </p>
          </div>

          {/* 가이드 카드들 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {guides.map((guide, index) => (
              <div
                key={guide.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300"
              >
                <div className="p-8">
                  {/* 배지 */}
                  <div className="flex justify-center mb-8">
                    <div
                      className={`px-6 py-3 rounded-full text-sm font-medium ${getColorClasses(guide.color, true)}`}
                    >
                      {guide.activeTag}
                    </div>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="text-center min-h-[140px] flex items-center justify-center">
                    <p className="text-gray-700 text-base leading-relaxed">
                      {guide.content}
                    </p>
                  </div>

                  {/* 카드 번호 */}
                  <div className="flex justify-center mt-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            궁금한 점이 있으신가요?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            도움말 센터를 방문하세요.
          </p>
          <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl">
            도움말 센터 방문하기
            <ArrowRight className="inline-block ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
