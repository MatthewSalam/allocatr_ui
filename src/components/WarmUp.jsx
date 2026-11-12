"use client";
import { useEffect } from "react";

export default function WarmUp() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL; // use whatever name your code reads
    if (!base) return;

    // don't ping more than once per 10 minutes per tab
    const last = Number(sessionStorage.getItem("api-warmed") || 0);
    if (Date.now() - last < 10 * 60 * 1000) return;
    sessionStorage.setItem("api-warmed", String(Date.now()));

    fetch(`${base.replace(/\/$/, "")}/health`, {
      mode: "no-cors",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null;
}