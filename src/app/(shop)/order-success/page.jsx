// src/app/(shop)/order-success/page.jsx
import React from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export const metadata = {
  title: "Pedido confirmado",
};

export default function OrderSuccessPage({ searchParams }) {
  const orderId = searchParams?.orderId ?? "";

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="sr-only">Order success</h1>
      <OrderSuccessClient orderId={orderId} />
    </main>
  );
}
