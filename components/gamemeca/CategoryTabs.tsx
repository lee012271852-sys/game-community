"use client";

import { NewsCategory } from "@/lib/gamemeca";

type Props = {
  activeCategory: NewsCategory;
  onChange: (category: NewsCategory) => void;
};

const categories: { label: string; value: NewsCategory }[] = [
  { label: "메인", value: "main" },
  { label: "산업", value: "industry" },
  { label: "eSports", value: "esports" },
  { label: "PC", value: "pc" },
  { label: "모바일", value: "mobile" },
  { label: "콘솔", value: "console" },
];

export default function CategoryTabs({ activeCategory, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {categories.map((category) => {
        const active = activeCategory === category.value;

        return (
          <button
            key={category.value}
            onClick={() => onChange(category.value)}
            className={`
              rounded-xl px-5 py-2.5 text-sm font-black transition-all duration-200
              ${active 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" 
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }
            `}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}