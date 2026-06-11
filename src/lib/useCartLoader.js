// lib/useCartLoader.js
import { useEffect, useState, useRef } from "react";
import { fetchSession } from "@/lib/useSessionCheck";

export function useCartLoader() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const triedOnceRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setStatus(null);

      const user = await fetchSession();
      if (!mounted) return;
      if (!user) {
        setCart(null);
        setLoading(false);
        setStatus(401);
        return;
      }

      if (triedOnceRef.current) {
        setLoading(false);
        setStatus(429);
        return;
      }

      try {
        const res = await fetch("/api/cart", { credentials: "include", headers: { Accept: "application/json" } });
        if (!mounted) return;
        if (!res.ok) {
          if (res.status === 401) {
            triedOnceRef.current = true;
            setCart(null);
            setStatus(401);
            setLoading(false);
            return;
          }
          setCart(null);
          setStatus(res.status);
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => null);
        setCart(data?.cart ?? null);
        setStatus(200);
      } catch (err) {
        setCart(null);
        setStatus(500);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { cart, loading, status };
}
