import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          <p className="text-gray-600 mt-2">최종 업데이트: 2024년 1월 1일</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                이 약관은 Consult On(이하 "회사")이 제공하는 온라인 상담 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-2">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>"서비스"</strong>: 회사가 제공하는 온라인 상담 플랫폼 및 관련 서비스</li>
                  <li><strong>"이용자"</strong>: 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원</li>
                  <li><strong>"회원"</strong>: 서비스에 개인정보를 제공하여 회원등록을 한 자</li>
                  <li><strong>"전문가"</strong>: 상담 서비스를 제공하는 전문 상담사</li>
                  <li><strong>"상담자"</strong>: 상담 서비스를 이용하는 회원</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
                </p>
                <p>
                  2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써 효력을 발생합니다.
                </p>
                <p>
                  3. 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원탈퇴를 할 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제4조 (서비스의 제공)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>회사가 제공하는 서비스는 다음과 같습니다:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>온라인 상담 매칭 서비스</li>
                  <li>화상 상담 서비스</li>
                  <li>AI 채팅 상담 서비스</li>
                  <li>커뮤니티 서비스</li>
                  <li>상담 기록 및 요약 서비스</li>
                  <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 이용자에게 제공하는 일체의 서비스</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제5조 (회원가입)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
                </p>
                <p>
                  2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제6조 (개인정보 보호)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 이를 준수합니다.
                </p>
                <p>
                  2. 회사의 개인정보처리방침은 관련 법령의 변경이나 회사의 내부 정책 변경 등으로 인하여 변경될 수 있으며, 변경 시에는 지체없이 공지합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제7조 (이용자의 의무)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>다른 이용자의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제8조 (서비스 이용료 및 결제)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 회사의 서비스는 기본적으로 무료이나, 유료 서비스의 경우 해당 서비스의 이용료를 지불해야 합니다.
                </p>
                <p>
                  2. 유료 서비스의 이용료 및 결제방법은 서비스 화면에 표시된 바에 따릅니다.
                </p>
                <p>
                  3. 이용료는 신용카드, 계좌이체 등 회사가 제공하는 결제수단을 통해 결제할 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제9조 (환불)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 상담 서비스 이용 전 취소 시 전액 환불이 가능합니다.
                </p>
                <p>
                  2. 상담 진행 중 기술적 문제로 인한 중단 시, 이용하지 못한 시간에 대해 환불 또는 재상담을 제공합니다.
                </p>
                <p>
                  3. 환불은 결제한 방법과 동일한 방법으로 처리되며, 영업일 기준 3-5일이 소요될 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제10조 (서비스 이용 제한)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  회사는 이용자가 다음 각 호에 해당하는 경우 사전 통지 없이 서비스 이용을 제한하거나 회원자격을 정지 또는 상실시킬 수 있습니다:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>이 약관을 위반한 경우</li>
                  <li>다른 이용자의 서비스 이용을 방해하거나 서비스의 안정적 운영을 방해한 경우</li>
                  <li>서비스를 이용하여 법령이나 공서양속에 위반되는 행위를 한 경우</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제11조 (면책조항)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                </p>
                <p>
                  2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
                </p>
                <p>
                  3. 회사는 이용자가 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">제12조 (분쟁해결)</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  1. 서비스 이용과 관련하여 회사와 이용자 사이에 분쟁이 발생한 경우, 회사와 이용자는 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.
                </p>
                <p>
                  2. 제1항의 노력에도 불구하고 분쟁이 해결되지 않을 경우에는 민사소송법상의 관할법원에 소를 제기할 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">부칙</h2>
              <div className="text-gray-700 leading-relaxed">
                <p>이 약관은 2024년 1월 1일부터 시행됩니다.</p>
              </div>
            </section>

          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">문의사항</h3>
          <p className="text-gray-700 mb-2">
            이용약관에 대한 문의사항이 있으시면 언제든 연락해 주세요.
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>이메일: legal@consulton.co.kr</p>
            <p>전화: 1588-0000</p>
            <p>운영시간: 평일 09:00 - 18:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
