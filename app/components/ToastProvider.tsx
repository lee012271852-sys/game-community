"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface ToastContextType {
  triggerToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  // ⭐ 타이머 ID를 기억할 useRef 추가
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = useCallback((msg: string) => {
    // 1. 만약 기존에 돌고 있던 타이머가 있다면 끈다!
    if (timerRef.current) clearTimeout(timerRef.current);

    setToastMsg(msg);
    setShowToast(true);

    // 2. 새 타이머를 시작하고, 그 ID를 ref에 저장한다.
    timerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}

      <div 
        className={`fixed bottom-12 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none transition-all duration-500 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="bg-slate-800/95 backdrop-blur-sm text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border border-white/10 w-full max-w-[340px] sm:max-w-max">
          <span className="shrink-0 text-indigo-400 text-lg leading-none">●</span>
          <span className="flex-1 whitespace-normal break-keep leading-relaxed text-left">
            {toastMsg}
          </span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};