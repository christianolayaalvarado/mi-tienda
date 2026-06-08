import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext"; // (lo mantengo por si lo usas después)
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

// 🔥 TOAST
import { Toaster } from "react-hot-toast";

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Providers>
          <CartProvider>
            <Navbar />

            {children}

            {/* 🔥 TOAST GLOBAL */}
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
        </Providers>
      </body>
    </html>
  );
}
