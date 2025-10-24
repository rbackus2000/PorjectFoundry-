import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "BuildBridge",
  description: "Transform ideas into production-ready prompts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-bg text-text antialiased font-sans">
        <ThemeProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            <div className="min-h-dvh flex flex-col">
              <Header />
              <main id="main-content" className="flex-1 overflow-hidden" tabIndex={-1}>
                {children}
              </main>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
