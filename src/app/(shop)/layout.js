// src/app/(shop)/layout.js

export default function ShopLayout({ children }) {
  return (
    <>
      <main className="h-full overflow-auto bg-gray-50">{children}</main>
    </>
  );
}