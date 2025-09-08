"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Wallet, History, Plus, Trash2, Edit } from 'lucide-react';
// import { 
//   PaymentMethod, 
//   PaymentHistory, 
//   getUserPaymentMethods, 
//   getUserPaymentHistory,
//   getUserCreditTransactions 
// } from '@/data/dummy/payment'; // 더미 데이터 제거

export default function PaymentSettings() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);

  const [showTopupHistory, setShowTopupHistory] = useState(true);
  const [showUsageHistory, setShowUsageHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // 새로운 카드 추가 폼 상태
  const [newCardForm, setNewCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
    cardBrand: 'VISA'
  });
  
  // 폼 에러 상태
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // 더미 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        // app-state API에서 사용자 정보 가져오기
        const response = await fetch('/api/app-state');
        const result = await response.json();
        
        if (result.success && result.data.user) {
          const user = result.data.user;
          console.log('사용자 정보:', user); // 디버깅용
          // 김철수의 경우 client_1 ID 사용
          const userId = user.name === "김철수" ? 'client_1' : 'user_001';
          console.log('사용할 userId:', userId); // 디버깅용
          
          try {
            setIsLoading(true);
            // 실제 API에서 결제 정보를 가져오기
            const [methodsResponse, historyResponse, transactionsResponse] = await Promise.all([
              fetch('/api/payment-methods'),
              fetch('/api/payment-history'),
              fetch('/api/credit-transactions')
            ]);

            const methods = methodsResponse.ok ? (await methodsResponse.json()).paymentMethods || [] : [];
            const history = historyResponse.ok ? (await historyResponse.json()).payments || [] : [];
            const transactions = transactionsResponse.ok ? (await transactionsResponse.json()).transactions || [] : [];
            
            console.log('로드된 결제 수단:', methods); // 디버깅용
            console.log('로드된 결제 내역:', history); // 디버깅용
            console.log('로드된 크레딧 거래:', transactions); // 디버깅용
            
            setPaymentMethods(methods);
            setPaymentHistory(history);
            setCreditTransactions(transactions);
          } catch (dataError) {
            console.error('더미 데이터 로드 실패:', dataError);
            // 기본 데이터로 폴백
            setPaymentMethods([]);
            setPaymentHistory([]);
            setCreditTransactions([]);
          }
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        // 에러 시 빈 배열로 초기화
        setPaymentMethods([]);
        setPaymentHistory([]);
        setCreditTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);





  const handleDeleteMethod = (id: string) => {
    // confirm 대신 더 사용자 친화적인 확인 방식 사용
    if (window.confirm('정말로 이 카드를 삭제하시겠습니까?\n\n삭제 후에는 새로운 카드를 추가할 수 있습니다.')) {
      setPaymentMethods([]);
      // alert 대신 상태 업데이트로 처리
      console.log('카드가 삭제되었습니다.');
    }
  };



  // 새로운 카드 추가
  const handleAddNewCard = () => {
    if (paymentMethods.length >= 1) {
      // alert 대신 콘솔 로그로 처리
      console.log('카드는 1개만 등록할 수 있습니다.');
      return;
    }
    setShowAddMethod(true);
  };

  // 카드 추가 폼 제출
  const handleSubmitNewCard = () => {
    const { cardNumber, expiryMonth, expiryYear, cardholderName, cardBrand } = newCardForm;
    
    // 에러 초기화
    setFormErrors({});
    
    // 폼 검증
    const errors: {[key: string]: string} = {};
    
    if (!cardNumber) errors.cardNumber = '카드번호를 입력해주세요.';
    else if (cardNumber.length !== 16) errors.cardNumber = '카드번호는 16자리여야 합니다.';
    
    if (!expiryMonth) errors.expiryMonth = '만료 월을 선택해주세요.';
    if (!expiryYear) errors.expiryYear = '만료 년을 선택해주세요.';
    if (!cardholderName) errors.cardholderName = '카드 소유자명을 입력해주세요.';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newCard: any = {
      id: `pm_${Date.now()}`,
      userId: 'client_1',
      type: 'card',
      name: `${cardBrand} 카드`,
      last4: cardNumber.slice(-4),
      isDefault: true,
      expiryDate: `${expiryMonth}/${expiryYear}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPaymentMethods([newCard]);
    setFormErrors({});
    setNewCardForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cardholderName: '',
      cardBrand: 'VISA'
    });
    setShowAddMethod(false);
  };

  // 카드 추가 폼 닫기
  const handleCloseAddForm = () => {
    setShowAddMethod(false);
    setFormErrors({});
    setNewCardForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cardholderName: '',
      cardBrand: 'VISA'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'consultation':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <Wallet className="h-4 w-4 text-orange-600" />;
      case 'withdrawal':
        return <History className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          결제 정보
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          결제 수단과 결제 내역을 관리하세요.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 결제 수단 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">결제 수단</h4>
            {paymentMethods.length === 0 ? (
              <button
                onClick={handleAddNewCard}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                카드 추가
              </button>
            ) : (
              <button
                onClick={() => handleDeleteMethod(paymentMethods[0].id)}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 text-sm leading-4 font-medium rounded-md bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                카드 교체
              </button>
            )}
          </div>

          {/* 카드 추가 폼 */}
          {showAddMethod && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
              <h5 className="text-lg font-medium text-blue-900 mb-4">새로운 카드 추가</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카드 브랜드
                  </label>
                  <select
                    value={newCardForm.cardBrand}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, cardBrand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="AMEX">AMEX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카드번호
                  </label>
                  <input
                    type="text"
                    value={newCardForm.cardNumber}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.cardNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    만료 월
                  </label>
                  <select
                    value={newCardForm.expiryMonth}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.expiryMonth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">월 선택</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  {formErrors.expiryMonth && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.expiryMonth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    만료 년
                  </label>
                  <select
                    value={newCardForm.expiryYear}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.expiryYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">년 선택</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year.toString().slice(-2)}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {formErrors.expiryYear && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.expiryYear}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카드 소유자명
                  </label>
                  <input
                    type="text"
                    value={newCardForm.cardholderName}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                    placeholder="KIM CHEOL SU"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.cardholderName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cardholderName}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseAddForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitNewCard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  카드 추가
                </button>
              </div>
            </div>
          )}

          {/* 디버깅 정보 */}
          {paymentMethods.length === 0 && !showAddMethod && (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>등록된 결제 수단이 없습니다.</p>
              <p className="text-sm">새로운 결제 수단을 추가해보세요.</p>
            </div>
          )}

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {method.type === 'card' ? (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Wallet className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {method.name}
                      {method.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          기본
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.type === 'card' 
                        ? `**** **** **** ${method.last4} • 만료: ${method.expiryDate}`
                        : method.bankName
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="카드 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

                {/* 크레딧 내역 섹션 (좌우 배치) */}
        <div>
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900">크레딧 내역</h4>
            <p className="text-sm text-gray-600">크레딧 충전 및 사용 내역을 확인할 수 있습니다.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 크레딧 충전 내역 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-900 flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  크레딧 충전 내역
                </h5>
              </div>

              <div className="space-y-3">
                {paymentHistory
                  .filter(item => item.type === 'topup')
                  .slice(0, 5)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString('ko-KR')}
                        </div>
                        {item.credits && (
                          <div className="text-xs text-blue-600 font-medium">
                            +{item.credits} 크레딧
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status === 'completed' && '완료'}
                          {item.status === 'pending' && '대기중'}
                          {item.status === 'failed' && '실패'}
                        </span>
                        <span className="font-medium text-green-600 text-sm">
                          +{formatAmount(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                
                {paymentHistory.filter(item => item.type === 'topup').length > 5 && (
                  <div className="text-center py-3">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      더보기
                    </button>
                  </div>
                )}
                
                {paymentHistory.filter(item => item.type === 'topup').length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">아직 크레딧 충전 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 크레딧 사용 내역 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-900 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-red-600" />
                  크레딧 사용 내역
                </h5>
              </div>

              <div className="space-y-3">
                {creditTransactions
                  .filter(transaction => transaction.type === 'spend')
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                        {transaction.consultationId && (
                          <div className="text-xs text-blue-600">
                            상담 ID: {transaction.consultationId}
                          </div>
                        )}
                      </div>

                                              <div className="flex items-center space-x-2 ml-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                            사용
                          </span>
                          <div className="text-right">
                            <div className="font-medium text-red-600 text-sm">
                              -{Math.abs(transaction.amount)} 크레딧
                            </div>
                            <div className="text-xs text-gray-500">
                              잔액: {transaction.balance}
                            </div>
                          </div>
                        </div>
                    </div>
                  ))}
                
                {creditTransactions.filter(transaction => transaction.type === 'spend').length > 5 && (
                  <div className="text-center py-3">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      더보기
                    </button>
                  </div>
                )}
                
                {creditTransactions.filter(transaction => transaction.type === 'spend').length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">아직 크레딧 사용 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 결제 수단 추가/편집 모달 (간단한 형태) */}
        {showAddMethod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                결제 수단 추가
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제 수단 유형
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="card">신용카드</option>
                    <option value="bank">계좌이체</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddMethod(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowAddMethod(false)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
