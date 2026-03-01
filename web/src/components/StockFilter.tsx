import { StockCategory, getAllCategories } from "../models/types";
import type { StockCategory as StockCategoryType } from "../models/types";

interface StockFilterProps {
  selectedCategory: StockCategoryType | "全部";
  onCategoryChange: (category: StockCategoryType | "全部") => void;
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

export function StockFilter({ selectedCategory, onCategoryChange }: StockFilterProps) {
  const categories: (StockCategory | "全部")[] = ["全部", ...getAllCategories()];

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
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
  );
}
