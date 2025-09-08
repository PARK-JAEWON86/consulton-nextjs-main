export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Consult On</h3>
            <p className="text-gray-400 text-sm">
              전문가와 함께 성장하는 상담 플랫폼
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/how-it-works" className="hover:text-white">
                  서비스 소개
                </a>
              </li>
              <li>
                <a href="/experts" className="hover:text-white">
                  상담 찾기
                </a>
              </li>
              <li>
                <a href="/experts/become" className="hover:text-white">
                  전문가 등록
                </a>
              </li>
              <li>
                <a href="/community" className="hover:text-white">
                  커뮤니티
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">지원</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  고객센터
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">연결</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  파트너십
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  채용
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Consult On. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
