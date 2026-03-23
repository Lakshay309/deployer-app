// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Use ComponentProps to extract the types directly from the component
import { type ComponentProps } from "react"

export function ThemeProvider({ 
  children, 
  ...props 
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}