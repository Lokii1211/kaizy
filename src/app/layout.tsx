import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import MobileNav from "@/components/MobileNav";
import I18nProvider from "@/components/I18nProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NetworkStatus from "@/components/NetworkStatus";
import { ThemeProvider } from "@/stores/ThemeStore";
import { BookingProvider } from "@/stores/BookingStore";
import { ToastProvider } from "@/components/ToastNotification";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Kaizy — India's Workforce OS",
  description: "Find verified electricians, plumbers, mechanics & more in minutes. Same-day UPI payments. Built for 55 crore skilled workers in India.",
  keywords: ["Kaizy","workforce","skilled workers","India","electrician","plumber","KaizyScore","KaizyPass","KaizySOS","UPI"],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kaizy" },
  formatDetection: { telephone: true },
  openGraph: { title: "Kaizy — India's Workforce OS", description: "Find verified skilled workers. Same-day UPI.", type: "website", locale: "en_IN", siteName: "Kaizy" },
  twitter: { card: "summary_large_image", title: "Kaizy — India's Workforce OS", description: "55 crore skilled workers deserve a digital identity." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" type="image/png" href="/kaizy-logo.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider>
          <BookingProvider>
            <ToastProvider>
              <I18nProvider>
                <main style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
                  {children}
                </main>
                <MobileNav />

                <PWAInstallPrompt />
                <NetworkStatus />
                <ServiceWorkerRegistration />
              </I18nProvider>
            </ToastProvider>
          </BookingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
