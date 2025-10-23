import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Project Foundry",
  description: "Transform ideas into production-ready prompts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-bg text-text antialiased font-sans">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div className="min-h-dvh flex flex-col">
          <Header />
          <main id="main-content" className="flex-1 overflow-hidden" tabIndex={-1}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
