"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../../components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // 현재 경로에 따라 사이드바 variant 결정
  const sidebarVariant = pathname.startsWith("/dashboard/expert") ? "expert" : "user";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onToggle={handleSidebarToggle}
        variant={sidebarVariant}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 페이지 콘텐츠 */}
        <main className="pt-16 lg:ml-64 flex-1">{children}</main>
      </div>
    </div>
  );
}
