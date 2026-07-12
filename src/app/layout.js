// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import ThemeInitializer from "@/components/ThemeInitializer";
import { Toaster } from "react-hot-toast";

// Nuevo: AuthProvider y RootLayoutClientInit
import { AuthProvider } from "@/context/AuthProvider";
import MascotProvider from "@/context/MascotProvider";
import RootLayoutClientInit from "@/components/RootLayoutClientInit";
import ScrollWrapper from "@/components/ScrollWrapper";
import { ThemeProvider } from "@/context/ThemeContext";
import PriceDropNotification from "@/components/PriceDropNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mi tienda",
  description: "Catálogo de productos",
  openGraph: {
    type: "website",
    title: "Mi Tienda — Productos",
    description: "Encuentra los mejores productos en Mi Tienda",
    url: "https://mi-tienda-app-theta.vercel.app/?page=1",
    images: [
      {
        url: "https://mi-tienda-app-theta.vercel.app/images/og/mi-og.jpg?v=1",
        width: 800,
        height: 630,
        alt: "Venta de productos en Mi Tienda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mi Tienda — Productos",
    description: "Encuentra los mejores productos en Mi Tienda",
    images: ["https://mi-tienda-app-theta.vercel.app/images/og/mi-og.jpg?v=1"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-theme-primary flex flex-col h-screen overflow-hidden`}
      >
        <Providers>
          {/* AuthProvider envuelve la app para exponer user/refresh/logout */}
          <AuthProvider>
            <ThemeProvider>
            <MascotProvider>
              <CartProvider>
              {/* Inicializador cliente que intenta refresh controlado */}
              <RootLayoutClientInit />

              <Navbar />
              <ThemeInitializer />
              <PriceDropNotification />

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
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
