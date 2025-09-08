"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";

export default function AccountDeletion() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmationText !== "회원탈퇴") {
      alert("정확한 텍스트를 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    
    try {
      // 실제 API 호출로 대체 필요
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          // 로그아웃 처리 및 홈페이지로 리다이렉트
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      alert('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            계정 삭제 완료
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            계정이 성공적으로 삭제되었습니다.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-3 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <h4 className="text-md font-semibold">계정이 성공적으로 삭제되었습니다</h4>
          </div>
          <p className="text-gray-600 mt-2">
            잠시 후 홈페이지로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Trash2 className="h-5 w-5 mr-2 text-red-600" />
          계정 삭제
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          계정을 삭제하면 모든 데이터가 영구적으로 제거되며 복구할 수 없습니다.
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-md font-medium text-gray-900">계정 삭제</h4>
            <p className="text-sm text-gray-600 mt-1">
              계정을 삭제하면 모든 데이터가 영구적으로 제거되며 복구할 수 없습니다.
            </p>
          
            {!isOpen ? (
              <button
                onClick={() => setIsOpen(true)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                계정 삭제하기
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">주의사항</h5>
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        <li>• 모든 상담 기록과 채팅 내역이 삭제됩니다</li>
                        <li>• 크레딧 잔액과 결제 내역이 소멸됩니다</li>
                        <li>• 전문가 프로필 정보가 완전히 제거됩니다</li>
                        <li>• 이 작업은 되돌릴 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    확인을 위해 "회원탈퇴"를 입력하세요
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="회원탈퇴"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmationText !== "회원탈퇴" || isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? "삭제 중..." : "계정 영구 삭제"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
