"use client";


interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout = ({ children }: ChatLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 영역 - 사이드바 없음 */}
      <main className="pt-16 bg-gray-50">{children}</main>
    </div>
  );
};

export default ChatLayout;
