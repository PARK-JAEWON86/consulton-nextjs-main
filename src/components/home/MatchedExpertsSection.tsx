"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpertProfile } from "@/types";
import ExpertCard from "@/components/expert/ExpertCard";

interface MatchedExpertsSectionProps {
  title: string;
  subtitle?: string;
  experts: ExpertProfile[];
  onClickProfile?: (expert: ExpertProfile) => void;
  searchContext?: {
    category?: string;
    ageGroup?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function MatchedExpertsSection({
  title,
  subtitle,
  experts,
  onClickProfile,
  searchContext,
}: MatchedExpertsSectionProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (expertId: number) => {
    setFavorites((prev) =>
      prev.includes(expertId)
        ? prev.filter((id) => id !== expertId)
        : [...prev, expertId]
    );
  };

  const handleProfileView = (expert: any) => {
    if (onClickProfile) {
      onClickProfile(expert);
    }
  };

  return (
    <section className={title ? "py-16 bg-white rounded-2xl border border-gray-200" : "bg-transparent"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              mode="default"
              showFavoriteButton={true}
              isFavorite={favorites.includes(expert.id)}
              onToggleFavorite={toggleFavorite}
              showProfileButton={true}
              onProfileView={handleProfileView}
              searchContext={searchContext}
            />
          ))}
        </div>

        {title && (
          <div className="text-center mt-10">
            <a
              href="/experts"
              className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              더 많은 전문가 찾기
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
