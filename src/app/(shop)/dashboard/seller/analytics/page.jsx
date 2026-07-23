"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

function useLeafletIcon() {
  const [icon, setIcon] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setIcon(new L.Icon.Default());
    });
  }, []);
  return icon;
}

function ViewerMap({ locations }) {
  const icon = useLeafletIcon();

  const validLocations = useMemo(
    () => locations.filter((l) => l.lat && l.lon),
    [locations]
  );

  if (validLocations.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-500 text-sm">
        No hay ubicaciones con coordenadas disponibles
      </div>
    );
  }

  const center = validLocations.length === 1
    ? [validLocations[0].lat, validLocations[0].lon]
    : validLocations.reduce(
        (acc, l) => [acc[0] + l.lat / validLocations.length, acc[1] + l.lon / validLocations.length],
        [0, 0]
      );

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 400 }}>
      <MapContainer center={center} zoom={validLocations.length === 1 ? 12 : 5} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {validLocations.map((loc, i) => (
          <Marker key={i} position={[loc.lat, loc.lon]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{loc.city || "Ciudad desconocida"}</p>
                <p className="text-gray-600">{loc.region}, {loc.country}</p>
                <p className="text-green-700 font-semibold mt-1">{loc.count} vista{loc.count !== 1 ? "s" : ""}</p>
                {loc.products?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Productos: {loc.products.slice(0, 3).join(", ")}{loc.products.length > 3 ? "..." : ""}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function SellerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seller/product-viewers?days=${days}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mis Visitantes</h1>
          <p className="text-sm text-gray-500">De dónde vienen los interesados en tus productos</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-green-600 hover:underline">← Dashboard</Link>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5">
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-gray-100 animate-pulse rounded-lg h-12 w-48" />
          <div className="bg-gray-100 animate-pulse rounded-lg h-96" />
        </div>
      ) : !data ? (
        <p className="text-gray-500">Error al cargar datos.</p>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-500 font-medium">Vistas reales</p>
              <p className="text-2xl font-bold text-blue-700">{data.total}</p>
              {data.emailProxyFiltered > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">-{data.emailProxyFiltered} de emails proxy</p>
              )}
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs text-green-500 font-medium">Zonas</p>
              <p className="text-2xl font-bold text-green-700">{data.locations?.length || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-500 font-medium">Productos vistos</p>
              <p className="text-2xl font-bold text-purple-700">{data.productViews?.length || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-xs text-orange-500 font-medium">Promedio/día</p>
              <p className="text-2xl font-bold text-orange-700">
                {data.daily?.length > 0 ? Math.round(data.total / data.daily.length) : 0}
              </p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
              <p className="text-xs text-pink-500 font-medium">Contactos</p>
              <p className="text-2xl font-bold text-pink-700">{data.contactCount || 0}</p>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href={`/api/seller/product-viewers?days=${days}&export=csv`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar contactos (CSV)
            </a>
            <a
              href={`/api/seller/product-viewers?days=${days}&export=csv`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
            >
              📱 Enviar por WhatsApp
            </a>
          </div>

          {/* Map */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Mapa de visitantes</h2>
            <ViewerMap locations={data.locations || []} />
          </div>

          {/* Location table */}
          {data.locations?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Zonas por visitas</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-600">Ubicación</th>
                      <th className="px-4 py-2 font-medium text-gray-600 text-right">Vistas</th>
                      <th className="px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">Productos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.locations.map((loc, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-900">{loc.city || "—"}</p>
                          <p className="text-xs text-gray-500">{[loc.region, loc.country].filter(Boolean).join(", ")}</p>
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-700">{loc.count}</td>
                        <td className="px-4 py-2 text-xs text-gray-500 hidden sm:table-cell">{loc.products?.slice(0, 2).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Product views */}
          {data.productViews?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Productos más vistos</h2>
              <div className="space-y-2">
                {data.productViews.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    </div>
                    <span className="text-sm font-bold text-green-700">{p.count} vistas</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts table */}
          {data.contacts?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Contactos capturados ({data.contacts.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-600">Email</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Telefono</th>
                        <th className="px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">Ciudad</th>
                        <th className="px-4 py-2 font-medium text-gray-600 text-right">Visitas</th>
                        <th className="px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">Ultima visita</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.contacts.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {c.email ? (
                              <a href={"mailto:" + c.email + "?subject=Mira estas ofertas en Mi Tienda"} className="text-blue-600 hover:underline">{c.email}</a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {c.phone ? (
                              <a
                                href={"https://wa.me/" + c.phone.replace(/[^0-9]/g, "") + "?text=Hola! Te visitaste nuestra tienda y tenemos ofertas especiales para ti"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline"
                              >
                                {c.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">{c.city || "—"}</td>
                          <td className="px-4 py-2 text-right font-bold text-green-700">{c.viewCount}</td>
                          <td className="px-4 py-2 text-xs text-gray-500 hidden sm:table-cell">
                            {new Date(c.lastVisit).toLocaleDateString("es-PE")}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              {c.email && (
                                <a
                                  href={"mailto:" + c.email + "?subject=Ofertas especiales para ti en Mi Tienda"}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                                >
                                  Email
                                </a>
                              )}
                              {c.phone && (
                                <a
                                  href={"https://wa.me/" + c.phone.replace(/[^0-9]/g, "") + "?text=Hola! Visitaste nuestra tienda y tenemos ofertas especiales para ti"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!data.contacts?.length && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Sin contactos capturados aun.</strong> Los emails y telefonos se capturan automaticamente cuando visitantes logueados exploran tus productos. Para comenzar a capturar contactos, asegurate de que los usuarios se registren e inicien sesion antes de navegar.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
