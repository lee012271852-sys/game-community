"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// 👇 여기를 'next-themes'로만 수정하거나 아래처럼 바꿔주세요.
import { type ThemeProviderProps } from "next-themes"; 

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}