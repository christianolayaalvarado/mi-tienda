// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import ThemeInitializer from "@/components/ThemeInitializer";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthProvider";
import MascotProvider from "@/context/MascotProvider";
import RootLayoutClientInit from "@/components/RootLayoutClientInit";
import ScrollWrapper from "@/components/ScrollWrapper";
import { ThemeProvider } from "@/context/ThemeContext";
import { HelpCenterProvider } from "@/context/HelpCenterContext";
import { CelebrationsProvider } from "@/context/CelebrationsContext";
import { SiteThemeProvider } from "@/context/SiteThemeContext";
import PriceDropNotification from "@/components/PriceDropNotification";
import RegisterBenefitsModal from "@/components/RegisterBenefitsModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://mi-tienda-app-theta.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mi Tienda — Compra y Venta de Productos en Perú",
    template: "%s | Mi Tienda",
  },
  description:
    "Mi Tienda es tu marketplace favorito en Perú. Compra y vende productos de calidad: electrodomésticos, cocina, muebles, decoración, fitness y más. Ofertas exclusivas y envíos a todo el país.",
  keywords: ["marketplace", "tienda online", "comprar productos", "vender productos", "Perú", "ofertas", "envíos"],
  authors: [{ name: "Mi Tienda" }],
  creator: "Mi Tienda",
  publisher: "Mi Tienda",
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mi Tienda",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: "Mi Tienda",
    title: "Mi Tienda — Compra y Venta de Productos en Perú",
    description:
      "Tu marketplace favorito. Compra y vende productos de calidad con ofertas exclusivas y envíos a todo Perú.",
    images: [
      {
        url: `${SITE_URL}/images/og/mi-og.jpg?v=1`,
        width: 800,
        height: 630,
        alt: "Mi Tienda — Marketplace de productos en Perú",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mi Tienda — Compra y Venta de Productos",
    description:
      "Tu marketplace favorito. Compra y vende productos de calidad con ofertas exclusivas.",
    images: [`${SITE_URL}/images/og/mi-og.jpg?v=1`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mi Tienda",
    url: SITE_URL,
    logo: `${SITE_URL}/images/icon-512.png`,
    description: "Marketplace para compra y venta de productos en Perú",
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressCountry: "PE",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mi Tienda",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mi Tienda" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-theme-primary flex flex-col h-screen overflow-hidden`}
      >
        <Providers>
          <AuthProvider>
            <ThemeProvider>
            <HelpCenterProvider>
            <CelebrationsProvider>
            <SiteThemeProvider>
            <MascotProvider>
              <CartProvider>
              <RootLayoutClientInit />

              <Navbar />
              <ThemeInitializer />
              <PriceDropNotification />
              <RegisterBenefitsModal />

              <div className="flex-1 overflow-auto min-h-0">
                <ScrollWrapper>{children}</ScrollWrapper>
              </div>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: "10px",
                    background: "#333",
                    color: "#fff",
                  },
                }}
              />

            </CartProvider>
            </MascotProvider>
            </SiteThemeProvider>
            </CelebrationsProvider>
            </HelpCenterProvider>
            </ThemeProvider>
            </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
