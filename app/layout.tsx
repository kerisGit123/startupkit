import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StartupKit - SaaS Starter",
  description: "Multi-tenant SaaS with Convex, Next.js, Clerk, and Stripe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider 
          dynamic
          appearance={{
            theme: dark,
          }}
        >
          <ConvexClientProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#2C2C2C',
                  border: '1px solid #3D3D3D',
                  color: '#FFFFFF',
                  fontSize: '13px',
                },
                classNames: {
                  success: '!border-[#52C41A]/30',
                  error: '!border-[#FF4D4F]/30',
                  warning: '!border-[#FAAD14]/30',
                  info: '!border-[#4A90E2]/30',
                },
              }}
            />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
