"use client";

import Link from "next/link";
import Image from "next/image"; // ⭐ Next.js Image 불러오기
import { GameMecaListItem } from "@/lib/gamemeca";

type Props = {
  item: GameMecaListItem;
};

export default function NewsListItem({ item }: Props) {
  if (!item) return null;

  const detailUrl = `/news/detail?url=${encodeURIComponent(item.articleUrl)}`;

  return (
    <Link href={detailUrl} className="block group">
      {/* ⭐ 호버 디자인 살짝 수정: 전체 카드가 깔끔하게 반응하도록 변경 */}
      <article className="flex items-start gap-5 py-6 px-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl border-b border-slate-100 dark:border-slate-800 group-last:border-none">
        
        {/* 텍스트 컨텐츠 영역 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            {item.category && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {item.category}
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-400">
              {item.createdAt || "최근 소식"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-snug text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
            {item.title}
          </h2>

          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
            {item.summary || "본문 내용을 확인하려면 클릭하세요."}
          </p>
        </div>

        {/* ⭐ 썸네일 이미지 영역 (Next.js Image 적용) */}
        <div className="relative h-[80px] w-[120px] sm:h-[100px] sm:w-[150px] flex-shrink-0 overflow-hidden rounded-[1rem] bg-slate-100 dark:bg-slate-800 shadow-sm transition-transform duration-500 group-hover:shadow-md">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill // 부모 div(relative)를 꽉 채웁니다
              sizes="(max-width: 640px) 120px, 150px" // 반응형 이미지 최적화 힌트
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}