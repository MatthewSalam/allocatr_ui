"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./page.css";
import { systemStatus, runAllocation } from "@/api/auth";

const POLL_INTERVAL_MS = 60_000;

//  Mock 
const DEV_MODE = false;

const MOCK_DATA = {
  students: {
    total: 150,
    with_receipts: 120,
    with_verified_receipts: 100,
    ready_for_allocation: 100,
  },
  receipts: {
    total: 120,
    pending: 20,
    verified: 100,
    rejected: 0,
  },
  rooms: {
    total: 50,
    available: 10,
    total_capacity: 100,
    occupied: 90,
    available_spaces: 10,
  },
  allocations: { total: 90 },
  allocation_ready: true,
};

//  Helpers 
function occupancyPct(rooms) {
  if (!rooms?.total_capacity) return 0;
  return Math.round((rooms.occupied / rooms.total_capacity) * 100);
}

function clearancePct(allocations, students) {
  if (!students?.total) return 0;
  return Math.round((allocations.total / students.total) * 100);
}

//  Sub-components 
function StatCard({ icon, title, value, sub, accent, onClick }) {
  return (
    <div
      className="bg-white border border-[#e8e5df] rounded-xl p-5 flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow"
      style={{ borderTop: `4px solid ${accent}` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{title}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-[2.4rem] font-extrabold leading-none text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function AlertItem({ icon, text, level = "warning" }) {
  const colors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger:  "bg-red-50 border-red-200 text-red-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm ${colors[level]}`}>
      <span className="shrink-0 mt-px">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ActivityItem({ icon, text, time, index }) {
  return (
    <div
      className="ad-fadein flex items-start gap-3 py-2.5 border-b border-[#f0ede8] last:border-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="text-base shrink-0 mt-px">{icon}</span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm text-gray-700">{text}</span>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
}

//  Page 
export default function AdminDashboard() {
  const router = useRouter();
  const [data,          setData]          = useState(DEV_MODE ? MOCK_DATA : null);
  const [loading,       setLoading]       = useState(!DEV_MODE);
  const [lastRefreshed, setLastRefreshed] = useState(DEV_MODE ? new Date() : null);
  const [allocating,    setAllocating]    = useState(false);

  const fetchData = useCallback((silent = false) => {
    if (DEV_MODE) return;
      systemStatus()
        .then((res) => {
          setData(res.data.data);
          setLastRefreshed(new Date());
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            localStorage.removeItem("admin_token");
            router.replace("/admin/login");
          } else if (!silent) {
            toast.error("Failed to load system status. Please refresh.");
          }
        })
        .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleRunAllocation = async () => {
      if (!data?.allocation_ready) {
        toast.error("Not enough verified receipts to run allocation.");
        return;
      }
      setAllocating(true);
      try {
        await runAllocation({});
        toast.success("Allocation completed successfully!");
        fetchData(false);
      } catch (err) {
        toast.error(err?.response?.data?.message ?? "Allocation failed. Please try again.");
      } finally {
        setAllocating(false);
      }
    };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-sm text-gray-400">
      <div className="ad-spinner" />
      <span>Loading system status…</span>
    </div>
  );

  if (!data) return null;

  const { students, receipts, rooms, allocations, allocation_ready } = data;
  const occupancy   = occupancyPct(rooms);
  const clearance   = clearancePct(allocations, students);

  // Build alerts dynamically from data
  const alerts = [
    receipts.pending > 0 && {
      icon: "📄", level: "warning",
      text: `${receipts.pending} receipt${receipts.pending > 1 ? "s" : ""} awaiting verification`,
    },
    occupancy >= 90 && {
      icon: "🏠", level: "danger",
      text: `Room capacity at ${occupancy}% — only ${rooms.available_spaces} spaces remaining`,
    },
    occupancy >= 75 && occupancy < 90 && {
      icon: "🏠", level: "warning",
      text: `Room capacity at ${occupancy}% — consider adding more rooms`,
    },
    receipts.rejected > 0 && {
      icon: "❌", level: "danger",
      text: `${receipts.rejected} receipt${receipts.rejected > 1 ? "s" : ""} were rejected and may need follow-up`,
    },
    allocation_ready && allocations.total < students.with_verified_receipts && {
      icon: "🗂️", level: "info",
      text: `${students.with_verified_receipts - allocations.total} verified student${(students.with_verified_receipts - allocations.total) > 1 ? "s" : ""} not yet allocated`,
    },
  ].filter(Boolean);

  // Static recent activity — replace with a real API endpoint if available
  const activity = [
    { icon: "✅", text: "5 receipts verified",                    time: "10 min ago" },
    { icon: "🏠", text: "Room A-203 created",                     time: "1 hour ago" },
    { icon: "🗂️", text: `Allocation completed: ${allocations.total} students`, time: "2 hours ago" },
  ];

  return (
    <>
      {/* ── Heading ── */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">📊 System Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Academic Session: 2025/2026</p>
        </div>
        {lastRefreshed && (
          <span className="text-xs text-gray-300 self-end">
            🔄 {lastRefreshed.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-3.5 mb-5">
        <StatCard
          icon="🎓" title="Students" accent="#185FA5"
          value={students.total}
          sub={`${students.with_verified_receipts} verified · ${students.ready_for_allocation} ready`}
          onClick={() => router.push("/admin/stats")}
        />
        <StatCard
          icon="📄" title="Receipts Pending" accent="#f59e0b"
          value={receipts.pending}
          sub={`${receipts.verified} verified · ${receipts.rejected} rejected`}
          onClick={() => router.push("/admin/receipts")}
        />
        <StatCard
          icon="🏠" title="Rooms Available" accent="#2D6A4F"
          value={rooms.available_spaces}
          sub={`${rooms.occupied}/${rooms.total_capacity} occupied · ${occupancy}% full`}
          onClick={() => router.push("/admin/rooms")}
        />
        <StatCard
          icon="✅" title="Clearance Rate" accent="#6B4EFF"
          value={`${clearance}%`}
          sub={`${allocations.total} of ${students.total} students allocated`}
          onClick={() => router.push("/admin/allocations")}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="ad-main-grid grid gap-5 items-start">

        {/* LEFT: Quick actions + Alerts */}
        <div className="flex flex-col gap-5">

          {/* Quick actions */}
          <div className="bg-white border border-[#e8e5df] rounded-2xl p-5"
               style={{ borderTop: "4px solid #111" }}>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
              🔔 Quick Actions
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href="/admin/receipts"
                className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-800 no-underline hover:bg-amber-100 transition-colors"
              >
                <span>📄 Verify Receipts</span>
                {receipts.pending > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {receipts.pending}
                  </span>
                )}
              </a>

              <button
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all font-sans
                  ${allocation_ready && !allocating
                    ? "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    : "bg-[#f0ede8] text-gray-400 cursor-not-allowed"
                  }`}
                onClick={handleRunAllocation}
                disabled={!allocation_ready || allocating}
              >
                {allocating
                  ? <><div className="ad-spinner-sm" /> Running…</>
                  : "🗂️ Run Allocation"
                }
              </button>

              <a
                href="/admin/stats"
                className="flex items-center justify-center px-4 py-3 bg-[#f0ede8] border border-[#e8e5df] rounded-xl text-sm font-semibold text-gray-600 no-underline hover:bg-[#e8e5df] transition-colors"
              >
                📈 View Stats
              </a>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white border border-[#e8e5df] rounded-2xl p-5"
                 style={{ borderTop: "4px solid #f59e0b" }}>
              <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
                ⚠️ Alerts
              </div>
              <div className="flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <AlertItem key={i} icon={a.icon} text={a.text} level={a.level} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Recent activity + Room/Receipt breakdown */}
        <div className="flex flex-col gap-5">

          {/* Recent activity */}
          <div className="bg-white border border-[#e8e5df] rounded-2xl p-5"
               style={{ borderTop: "4px solid #2D6A4F" }}>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
              📈 Recent Activity
            </div>
            <div className="flex flex-col">
              {activity.map((item, i) => (
                <ActivityItem key={i} index={i} icon={item.icon} text={item.text} time={item.time} />
              ))}
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-3.5">

            {/* Receipt breakdown */}
            <div className="bg-white border border-[#e8e5df] rounded-xl p-4"
                 style={{ borderTop: "3px solid #f59e0b" }}>
              <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Receipts</div>
              <div className="flex flex-col gap-1.5">
                <BreakdownRow label="Total"    value={receipts.total}    color="text-gray-900" />
                <BreakdownRow label="Verified" value={receipts.verified}  color="text-green-700" />
                <BreakdownRow label="Pending"  value={receipts.pending}   color="text-amber-600" />
                <BreakdownRow label="Rejected" value={receipts.rejected}  color="text-red-600"   />
              </div>
            </div>

            {/* Room breakdown */}
            <div className="bg-white border border-[#e8e5df] rounded-xl p-4"
                 style={{ borderTop: "3px solid #2D6A4F" }}>
              <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Rooms</div>
              <div className="flex flex-col gap-1.5">
                <BreakdownRow label="Total"     value={rooms.total}           color="text-gray-900" />
                <BreakdownRow label="Capacity"  value={rooms.total_capacity}  color="text-gray-600" />
                <BreakdownRow label="Occupied"  value={rooms.occupied}        color="text-amber-600" />
                <BreakdownRow label="Available" value={rooms.available_spaces} color="text-green-700" />
              </div>
              {/* Occupancy bar */}
              <div className="mt-3 h-1.5 bg-[#f0ede8] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${occupancy}%`, background: occupancy >= 90 ? "#dc2626" : "#2D6A4F" }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{occupancy}% occupied</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function BreakdownRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}