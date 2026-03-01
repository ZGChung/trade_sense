import { StockCategory, getAllCategories } from "../models/types";
import type { StockCategory as StockCategoryType } from "../models/types";

interface StockFilterProps {
  selectedCategory: StockCategoryType | "全部";
  onCategoryChange: (category: StockCategoryType | "全部") => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const categoryEmoji: Record<string, string> = {
  "全部": "🎯",
  "科技": "💻",
  "金融": "🏦",
  "消费": "🛒",
  "能源": "⚡",
  "医疗": "🏥",
  "其他": "📊",
};

export function StockFilter({ selectedCategory, onCategoryChange, searchQuery = "", onSearchChange }: StockFilterProps) {
  const categories: (StockCategory | "全部")[] = ["全部", ...getAllCategories()];

  return (
    <div className="space-y-3">
      {/* 搜索框 */}
      {onSearchChange && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索股票代码或名称..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}
      
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {categoryEmoji[category]} {category}
          </button>
        ))}
      </div>
    </div>
  );
}
