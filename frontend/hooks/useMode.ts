"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useMode() {
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/mode`)
      .then((r) => r.json())
      .then((d) => setIsDemo(d.demo))
      .catch(() => {});
  }, []);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: !isDemo }),
      });
      const data = await res.json();
      setIsDemo(data.demo);
    } catch {
      // backend unreachable — stay in current mode
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  return { isDemo, toggle, loading };
}
