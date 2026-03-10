"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark") ?? "system"}
      toastOptions={{
        style: { fontFamily: "var(--font-sans)", fontSize: "14px" },
      }}
    />
  );
}
