import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/sidebar";
import { QueryProvider } from "@/components/query-provider";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { TaskProvider } from "@/hooks/use-task-store";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskPlanner - Daily Task Manager",
  description: "A modern, professional daily task planner",
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaskPlanner",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SidebarProvider>
              <TaskProvider>
                <div className="flex h-screen overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,transparent_0%,transparent_calc(100%-200px),hsl(var(--background))_200px)]">
                    <Suspense fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                        </div>
                      </div>
                    }>
                      {children}
                    </Suspense>
                  </main>
                </div>
                <CommandPalette />
                <Toaster position="bottom-right" richColors closeButton />
              </TaskProvider>
            </SidebarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}