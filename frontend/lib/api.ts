import type { FullSnapshot } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSnapshot(): Promise<FullSnapshot> {
  const res = await fetch(`${API_BASE}/api/snapshot`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchMoodHistory() {
  const res = await fetch(`${API_BASE}/api/mood/history`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchInsights() {
  const res = await fetch(`${API_BASE}/api/insights`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
