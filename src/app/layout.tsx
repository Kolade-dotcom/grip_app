import type { Metadata } from "next";
import localFont from "next/font/local";
import { WhopApp } from "@whop/react/components";
import "./globals.css";

const outfit = localFont({
  src: [
    { path: "./fonts/Outfit-Variable.woff2", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jakarta = localFont({
  src: [
    { path: "./fonts/PlusJakartaSans-Variable.woff2", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Grip — Retention Engine",
  description: "Automated retention playbooks for Whop communities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jakarta.variable} font-body antialiased`}
      >
        <WhopApp>
          {children}
        </WhopApp>
      </body>
    </html>
  );
}
