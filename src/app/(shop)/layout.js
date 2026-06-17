// src/app/(shop)/layout.js

export default function ShopLayout({ children }) {
  return (
    <>
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  );
}
