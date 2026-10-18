import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام إدارة المصروفات الذكي — Smart Expense Manager",
  description: "تطبيق ذكي لإدارة ومتابعة المصروفات باللغة العربية مع دعم الإدخال الصوتي، الذكاء الاصطناعي، والعمل بدون إنترنت.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/app-logo.png",
  },
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#090d16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-['Tajawal',sans-serif] selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
