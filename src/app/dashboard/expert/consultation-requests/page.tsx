"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ConsultationRequest } from "@/types";
import { 
  MessageCircle, 
  Video, 
  Phone, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar,
  Mail,
  AlertCircle
} from "lucide-react";

export default function ConsultationRequestsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [expertMessage, setExpertMessage] = useState('');

  // 상담 신청 목록 로드
  const loadRequests = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/expert/consultations');
      const result = await response.json();

      if (result.success) {
        // API 응답을 ConsultationRequest 형태로 변환
        const consultationRequests = result.data.consultations.map((consultation: any) => ({
          id: consultation.id,
          clientName: consultation.user?.name || '이름 없음',
          clientEmail: consultation.user?.email || '',
          consultationType: consultation.consultationType,
          message: consultation.description,
          preferredDate: consultation.scheduledTime || null,
          status: consultation.status,
          createdAt: consultation.createdAt,
          updatedAt: consultation.updatedAt,
          expiresAt: null, // 필요시 계산
          budget: consultation.price || 0
        }));
        setRequests(consultationRequests);
      } else {
        console.error('상담 신청 목록 로드 실패:', result.message);
        setRequests([]);
      }
    } catch (error) {
      console.error('상담 신청 목록 로드 오류:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 상담 신청 처리 (수락/거절)
  const handleRequestAction = async () => {
    if (!selectedRequest) return;

    try {
      const newStatus = actionType === 'accept' ? 'scheduled' : 'cancelled';

      const response = await fetch('/api/expert/consultations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: selectedRequest.id,
          status: newStatus,
          notes: expertMessage.trim() || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        // 로컬 상태 업데이트
        setRequests(prev =>
          prev.map(request =>
            request.id === selectedRequest.id
              ? { ...request, status: newStatus, updatedAt: new Date() }
              : request
          )
        );

        setShowActionModal(false);
        setSelectedRequest(null);
        setExpertMessage('');

        alert(`상담 신청이 ${actionType === 'accept' ? '수락' : '거절'}되었습니다.`);

        // 목록 새로고침
        loadRequests();
      } else {
        alert(`상담 신청 처리에 실패했습니다: ${result.message}`);
      }
    } catch (error) {
      console.error('상담 신청 처리 오류:', error);
      alert('상담 신청 처리 중 오류가 발생했습니다.');
    }
  };

  // 상담 방식 아이콘
  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'chat':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'voice':
        return <Phone className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // 상담 방식 텍스트
  const getConsultationTypeText = (type: string) => {
    switch (type) {
      case 'video':
        return '화상 상담';
      case 'chat':
        return '채팅 상담';
      case 'voice':
        return '음성 상담';
      default:
        return '상담';
    }
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
      case 'scheduled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'accepted':
      case 'scheduled':
        return '수락됨';
      case 'rejected':
      case 'cancelled':
        return '거절됨';
      case 'expired':
        return '만료됨';
      default:
        return status;
    }
  };

  // 필터링된 신청 목록
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'accepted') return request.status === 'scheduled' || request.status === 'accepted';
    if (filter === 'rejected') return request.status === 'cancelled' || request.status === 'rejected';
    return request.status === filter;
  });

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">상담 신청 관리</h1>
            <p className="text-gray-600 mt-1">
              고객들의 상담 신청을 확인하고 수락 또는 거절할 수 있습니다.
            </p>
          </div>

          {/* KPI 카드 섹션 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 전체 요청 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-600 mb-2">전체 요청</div>
              <div className="text-2xl font-bold text-gray-900">
                {requests.length} 건
              </div>
              <div className="mt-2 text-xs text-gray-500">
                총 예산: {requests.reduce((sum, req) => sum + (req.budget || 0), 0).toLocaleString()} 크레딧
              </div>
            </div>

            {/* 신규 요청 (대기 중) */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-600 mb-2">신규 요청</div>
              <div className="text-2xl font-bold text-orange-600">
                {requests.filter(r => r.status === 'pending').length} 건
              </div>
              <div className="mt-2 text-xs inline-flex items-center px-3 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 whitespace-nowrap">
                {(() => {
                  const urgentCount = requests.filter(r => {
                    try {
                      const notes = JSON.parse(r.notes || '{}');
                      return r.status === 'pending' && notes.urgency === 'high';
                    } catch {
                      return false;
                    }
                  }).length;
                  return urgentCount;
                })()}건 긴급
              </div>
            </div>

            {/* 요청 수락 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-600 mb-2">요청 수락</div>
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'scheduled' || r.status === 'accepted').length} 건
              </div>
              <div className="mt-2 text-xs inline-flex items-center px-3 py-0.5 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap">
                수락률 {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'scheduled' || r.status === 'accepted').length / requests.length) * 100) : 0}%
              </div>
            </div>

            {/* 완료된 상담 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-600 mb-2">완료된 상담</div>
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'completed').length} 건
              </div>
              <div className="mt-2 text-xs text-gray-500">
                평균 {(() => {
                  const completedRequests = requests.filter(r => r.status === 'completed');
                  return completedRequests.length > 0
                    ? Math.round(completedRequests.reduce((sum, req) => sum + (req.budget || 0), 0) / completedRequests.length)
                    : 0;
                })().toLocaleString()} 크레딧
              </div>
            </div>
          </div>

          {/* 필터 */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { key: 'pending', label: '대기 중', count: requests.filter(r => r.status === 'pending').length },
                { key: 'accepted', label: '수락됨', count: requests.filter(r => r.status === 'scheduled' || r.status === 'accepted').length },
                { key: 'rejected', label: '거절됨', count: requests.filter(r => r.status === 'cancelled' || r.status === 'rejected').length },
                { key: 'all', label: '전체', count: requests.length }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filterOption.label}
                  {filterOption.count > 0 && (
                    <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {filterOption.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 신청 목록 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">상담 신청을 불러오는 중...</p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {filter === 'pending' ? '대기 중인 상담 신청이 없습니다' : 
                     filter === 'accepted' ? '수락된 상담 신청이 없습니다' :
                     filter === 'rejected' ? '거절된 상담 신청이 없습니다' :
                     '상담 신청이 없습니다'}
                  </p>
                  <p className="text-sm">
                    {filter === 'pending' ? '새로운 상담 신청이 오면 여기에 표시됩니다.' : '다른 필터를 확인해보세요.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 헤더 */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {getConsultationTypeIcon(request.consultationType)}
                          <span className="text-sm font-medium text-gray-700">
                            {getConsultationTypeText(request.consultationType)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>

                      {/* 클라이언트 정보 */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{request.clientName}</span>
                        </div>
                        {request.clientEmail && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{request.clientEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* 메시지 */}
                      {request.message && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {request.message}
                          </p>
                        </div>
                      )}

                      {/* 시간 정보 */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>신청: {new Date(request.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        {request.preferredDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>희망일: {new Date(request.preferredDate).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )}
                        {request.expiresAt && request.status === 'pending' && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>만료: {new Date(request.expiresAt).toLocaleString('ko-KR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('accept');
                            setShowActionModal(true);
                          }}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          수락
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                            setShowActionModal(true);
                          }}
                          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 액션 모달 */}
        {showActionModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                상담 신청 {actionType === 'accept' ? '수락' : '거절'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedRequest.clientName}</strong>님의 {getConsultationTypeText(selectedRequest.consultationType)} 신청을 
                  {actionType === 'accept' ? '수락' : '거절'}하시겠습니까?
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'accept' ? '수락' : '거절'} 메시지 (선택사항)
                </label>
                <textarea
                  value={expertMessage}
                  onChange={(e) => setExpertMessage(e.target.value)}
                  placeholder={actionType === 'accept' 
                    ? '수락 메시지를 입력하세요 (예: 상담 시간 조율을 위해 연락드리겠습니다)'
                    : '거절 사유를 입력하세요 (예: 현재 상담 일정이 가득 찬 상태입니다)'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setExpertMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRequestAction}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    actionType === 'accept' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'accept' ? '수락' : '거절'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
