import Navbar from "@/components/Navbar";

export default function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}