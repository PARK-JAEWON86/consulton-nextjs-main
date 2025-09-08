"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from "lucide-react";

interface ExpertProfile {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string;
  specialty: string;
  experienceYears: number;
  bio: string;
  keywords: string[];
  consultationTypes: string[];
  availability: Record<string, { available: boolean; hours: string }>;
  certifications: Array<{ name: string; issuer: string }>;
  profileImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminExpertProfilesPage() {
  const [profiles, setProfiles] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ExpertProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 전문가 프로필 목록 로드
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expert-profiles');
      const result = await response.json();
      
      if (result.success) {
        setProfiles(result.data);
      } else {
        console.error('전문가 프로필 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('전문가 프로필 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 프로필 승인
  const approveProfile = async (id: string) => {
    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      });

      const result = await response.json();
      if (result.success) {
        await loadProfiles();
        alert('전문가 프로필이 승인되었습니다.');
      } else {
        alert('승인 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('승인 처리 실패:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  // 프로필 거절
  const rejectProfile = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/expert-profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadProfiles();
        setShowModal(false);
        setRejectionReason("");
        alert('전문가 프로필이 거절되었습니다.');
      } else {
        alert('거절 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('거절 처리 실패:', error);
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  // 상태별 필터링
  const filteredProfiles = profiles.filter(profile => {
    if (filter === 'all') return true;
    return profile.status === filter;
  });

  // 상태별 색상 및 아이콘
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock, label: '승인 대기' };
      case 'approved':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle, label: '승인됨' };
      case 'rejected':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle, label: '거절됨' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: AlertCircle, label: '알 수 없음' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">전문가 프로필을 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전문가 프로필 관리</h1>
          <p className="text-gray-600 mt-2">전문가 지원 신청을 검토하고 승인/거절할 수 있습니다.</p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => {
              const count = profiles.filter(p => status === 'all' || p.status === status).length;
              const isActive = filter === status;
              
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {status === 'all' ? '전체' : 
                   status === 'pending' ? '승인 대기' :
                   status === 'approved' ? '승인됨' : '거절됨'}
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 프로필 목록 */}
        <div className="bg-white rounded-lg shadow">
          {filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'all' ? '등록된 전문가 프로필이 없습니다.' :
               filter === 'pending' ? '승인 대기 중인 프로필이 없습니다.' :
               filter === 'approved' ? '승인된 프로필이 없습니다.' : '거절된 프로필이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지원자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전문분야
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경력
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지원일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProfiles.map((profile) => {
                    const statusInfo = getStatusInfo(profile.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={profile.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {profile.profileImage ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={profile.profileImage}
                                  alt={profile.fullName}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    {profile.fullName.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {profile.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {profile.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{profile.specialty}</div>
                          <div className="text-sm text-gray-500">{profile.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {profile.experienceYears}년
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedProfile(profile)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {profile.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => approveProfile(profile.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setShowModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 프로필 상세 모달 */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProfile.fullName}의 전문가 프로필
                </h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">기본 정보</h3>
                  <div className="mt-1 text-sm text-gray-900">
                    <p><strong>이름:</strong> {selectedProfile.fullName}</p>
                    <p><strong>이메일:</strong> {selectedProfile.email}</p>
                    <p><strong>직함:</strong> {selectedProfile.jobTitle}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">전문 정보</h3>
                  <div className="mt-1 text-sm text-gray-900">
                    <p><strong>전문분야:</strong> {selectedProfile.specialty}</p>
                    <p><strong>경력:</strong> {selectedProfile.experienceYears}년</p>
                    <p><strong>자기소개:</strong> {selectedProfile.bio}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">키워드</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedProfile.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">상담 유형</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedProfile.consultationTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedProfile.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">자격증</h3>
                    <div className="mt-1 space-y-1">
                      {selectedProfile.certifications.map((cert, index) => (
                        <div key={index} className="text-sm text-gray-900">
                          <strong>{cert.name}</strong> - {cert.issuer}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProfile.status === 'rejected' && selectedProfile.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">거절 사유</h3>
                    <div className="mt-1 text-sm text-gray-900 bg-red-50 p-3 rounded">
                      {selectedProfile.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 입력 모달 */}
      {showModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                거절 사유 입력
              </h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => rejectProfile(selectedProfile.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  거절
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
