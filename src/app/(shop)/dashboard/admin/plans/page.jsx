"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPlansPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/upgrade-requests", { credentials: "include" });
      const data = await res.json();
      if (data.ok) setRequests(data.requests || []);
    } catch {}
    setLoading(false);
  };

  const handleApprove = async (userId) => {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/upgrade-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action: "approve" }),
      });
      const data = await res.json();
      if (data.ok) {
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
      }
    } catch {}
    setProcessing(null);
  };

  const handleReject = async (userId) => {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/upgrade-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action: "reject" }),
      });
      const data = await res.json();
      if (data.ok) {
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
      }
    } catch {}
    setProcessing(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Upgrade</h1>
          <p className="text-sm text-gray-500 mt-1">Usuarios que solicitaron plan Full</p>
        </div>
        <Link href="/dashboard/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            let info = {};
            try {
              info = JSON.parse(req.description);
            } catch {
              info = { phone: "N/A", transactionId: "N/A", amount: "N/A" };
            }

            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        PENDIENTE
                      </span>
                      <span className="text-sm font-medium text-gray-900">{info.name || req.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>{" "}
                        <span className="text-gray-800">{req.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Telefono Yape:</span>{" "}
                        <span className="text-gray-800">{info.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Monto:</span>{" "}
                        <span className="text-gray-800 font-bold">S/ {info.amount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID Transaccion:</span>{" "}
                        <span className="text-gray-800">{info.transactionId}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Solicito: {new Date(info.requestedAt).toLocaleString("es-PE")}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req.userId)}
                      disabled={processing === req.userId}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {processing === req.userId ? "..." : "Aprobar"}
                    </button>
                    <button
                      onClick={() => handleReject(req.userId)}
                      disabled={processing === req.userId}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
