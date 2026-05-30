import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Recoverly — Recover Failed Payments",
  description:
    "Track Stripe payment failures, notify your team, and recover lost revenue automatically.",
  keywords: ["payment recovery", "stripe", "failed payments", "SaaS", "revenue recovery"],
  openGraph: {
    title: "Recoverly",
    description: "Stop losing money to failed payments",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
