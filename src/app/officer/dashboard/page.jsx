"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./page.css";
import { departmentClearances } from "@/api/auth";
import Spinner from "@/components/ui/Spinner";
import StudentClearanceItem from "@/components/StudentClearanceItem";

const POLL_INTERVAL_MS = 30_000;

//  DEV_MODE: flip to false when backend is ready ─
const DEV_MODE = false;

const MOCK_DATA = {
  department:       "Bursary",
  total_clearances: 45,
  clearances: [
    { clearance_id: 1, student: { matric_number: "22/0336", full_name: "John Doe",   level: "400", department: "Software Engineering"   }, cleared_by: "bursary@university.edu.ng", cleared_at: "2026-05-09T10:55:00Z", notes: "All fees paid in full",     academic_session: "2025/2026" },
    { clearance_id: 2, student: { matric_number: "22/0337", full_name: "Jane Smith", level: "300", department: "Computer Science"         }, cleared_by: "bursary@university.edu.ng", cleared_at: "2026-05-09T10:45:00Z", notes: "",                          academic_session: "2025/2026" },
    { clearance_id: 3, student: { matric_number: "22/0338", full_name: "Mark Lee",   level: "400", department: "Electrical Engineering"   }, cleared_by: "bursary@university.edu.ng", cleared_at: "2026-05-09T10:30:00Z", notes: "Partial fee — approved by HOD", academic_session: "2025/2026" },
  ],
};

//  Helpers 
function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

//  Sub-components 
function StatCard({ value, label, accent = "#111", icon }) {
  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-5 flex flex-col gap-1" style={{ borderTop: `4px solid ${accent}` }}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-[2.2rem] font-extrabold leading-none" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-gray-400 font-medium mt-1">{label}</div>
    </div>
  );
}


//  Page 
export default function OfficerDashboard() {
  const router = useRouter();
  const [data,          setData]          = useState(DEV_MODE ? MOCK_DATA : null);
  const [loading,       setLoading]       = useState(!DEV_MODE);
  const [lastRefreshed, setLastRefreshed] = useState(DEV_MODE ? new Date() : null);

  const fetchData = useCallback((silent = false) => {
    if (DEV_MODE) return;
    departmentClearances()
      .then((res) => { setData(res.data.data); setLastRefreshed(new Date()); })
      .catch((err) => {
        if (err?.response?.status === 401) { localStorage.removeItem("officer_token"); router.replace("/login"); }
        else if (!silent) toast.error("Failed to load dashboard. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  useEffect(() => {
    if (DEV_MODE) return;
    const id = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return <Spinner message="Loading your dashboard…" />;

  const { department, total_clearances, clearances } = data;
  const today = new Date();
  const todayCount = clearances.filter((c) => {
    const d = new Date(c.cleared_at);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }).length;

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">📊 {department} Department</h1>
          <p className="text-sm text-gray-400 mt-1">Academic Session: 2025/2026</p>
        </div>
        {lastRefreshed && (
          <span className="text-xs text-gray-300 self-end">
            🔄 {lastRefreshed.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-3.5 mb-5">
        <StatCard icon="✅" value={total_clearances}  label="Total Clearances" accent="#2D6A4F" />
        <StatCard icon="📅" value={todayCount}        label="Cleared Today"    accent="#185FA5" />
        <StatCard icon="📋" value={clearances.length} label="Recent Records"   accent="#6B4EFF" />
      </div>

      <div className="od-main-grid grid gap-5 items-start">

        <div className="bg-white border border-[#e8e5df] rounded-2xl p-5 flex flex-col gap-4" style={{ borderTop: "4px solid #6B4EFF" }}>
          <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">🎯 Quick Action</div>
          <a href="/officer/scan" className="flex flex-col items-center justify-center gap-1.5 bg-gray-900 text-white rounded-xl py-7 no-underline transition-all hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0">
            <span className="text-4xl">📷</span>
            <span className="text-base font-bold tracking-wide">Scan QR Code</span>
            <span className="text-xs text-gray-400">Tap to scan a student&apos;s QR</span>
          </a>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Point the camera at a student&apos;s clearance QR code to record their {department} clearance instantly.
          </p>
        </div>

        <div className="bg-white border border-[#e8e5df] rounded-2xl p-5" style={{ borderTop: "4px solid #2D6A4F" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-900">📋 Recent Clearances</span>
            <a href="/officer/clearances" className="text-xs font-semibold text-[#6B4EFF] hover:underline">View all →</a>
          </div>
          {clearances.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-7">No clearances recorded yet today.</p>
          ) : (
            <div className="flex flex-col gap-px">
              {clearances.slice(0, 8).map((item, i) => (
                <StudentClearanceItem key={item.clearance_id} item={item} index={i} variant="row" />
              ))}           
               </div>
          )}
        </div>

      </div>
    </>
  );
}