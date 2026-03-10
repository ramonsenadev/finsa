import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finsa — Gestao Financeira Familiar",
  description:
    "Categorize e analise seus gastos familiares com import de CSV multi-banco",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: "var(--font-sans)", fontSize: "14px" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
