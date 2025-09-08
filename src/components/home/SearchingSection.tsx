import { CategoryOption, AgeGroupOption } from "./HeroSection";

interface SearchingSectionProps {
  searchCategory: string;
  searchAgeGroup: string;
  categories: CategoryOption[];
  ageGroups: AgeGroupOption[];
}

export default function SearchingSection({
  searchCategory,
  searchAgeGroup,
  categories,
  ageGroups,
}: SearchingSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            전문가를 찾고 있습니다...
          </h2>
          <p className="text-gray-600">
            {searchCategory &&
              `"${categories.find((c) => c.id === searchCategory)?.name}"`}{" "}
            분야의
            {searchAgeGroup &&
              ` ${ageGroups.find((a) => a.id === searchAgeGroup)?.name} 대상`}{" "}
            전문가를 검색하고 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
