"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface GridItem {
  title: string;
  description: string;
  priority?: "high" | "medium" | "low";
}

interface SummaryCardProps {
  title: string;
  icon?: LucideIcon;
  items: string[] | GridItem[];
  type?: "list" | "grid" | "text";
}

const SummaryCard = ({
  title,
  icon: Icon,
  items,
  type = "list",
}: SummaryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        className="flex items-center justify-between p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <button className="p-1 hover:bg-gray-100 rounded">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6">
          {type === "list" ? (
            <ul className="space-y-3">
              {(items as string[]).map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : type === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(items as GridItem[]).map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {item.priority && (
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        item.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : item.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.priority === "high"
                        ? "높음"
                        : item.priority === "medium"
                          ? "보통"
                          : "낮음"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="prose max-w-none">
              {(items as string[]).map((item, index) => (
                <p key={index} className="text-gray-700 mb-3 leading-relaxed">
                  {item}
                </p>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-gray-500 text-center py-8">내용이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
