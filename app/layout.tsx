import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent0 — Build AI Agents from Prompts",
  description:
    "Agent0 is a v0-style AI agent builder that turns natural language into production-ready, deterministic AI agents.",
  keywords: [
    "AI agents",
    "agent builder",
    "LLM agents",
    "automation",
    "developer tools",
    "AI infrastructure"
  ],
  openGraph: {
    title: "Agent0 — The v0 for AI Agents",
    description:
      "Design, generate, and run production-ready AI agents from natural language.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent0 — The v0 for AI Agents",
    description:
      "Generate deterministic, production-ready AI agents from prompts."
  }
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
