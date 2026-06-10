"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { studentClearance, myClearanceStatus } from "@/api/auth";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

const POLL_INTERVAL_MS = 30_000;
const DEV_MODE = false;

const MOCK_DATA = {
  student: {
    matric_number: "22/0336",
    full_name: "John Doe",
    email: "john@university.edu.ng",
    level: "400",
    department: "Software Engineering",
    gender: "Male",
  },
  progress: {
    total_departments:   7,
    cleared_departments: 3,
    pending_departments: 4,
    progress_percentage: 42,
    is_complete:         false,
  },
  clearances: [
    { id: 1, department: "Bursary", cleared_by: "bursary@university.edu.ng", cleared_at: "2026-04-23T14:00:00Z", notes: "All fees paid in full" },
    { id: 2, department: "Faculty", cleared_by: "faculty@university.edu.ng", cleared_at: "2026-04-23T15:00:00Z", notes: "Academic requirements met" },
    { id: 3, department: "Library", cleared_by: "library@university.edu.ng", cleared_at: "2026-04-23T16:00:00Z", notes: "No outstanding books" },
  ],
  pending: ["Sports", "Hostel", "ICT", "Student Affairs"],
  academic_session: "2025/2026",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-NG", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ProgressHeader({ progress }) {
  const { total_departments, cleared_departments, progress_percentage, is_complete } = progress;
  return (
    <div className={`rounded-xl border p-6 mb-5 ${is_complete ? "bg-green-50 border-green-200 border-t-4 border-t-green-500" : "bg-white border-gray-200 border-t-4 border-t-[#2D6A4F]"}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Overall Progress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900 leading-none">{cleared_departments}</span>
            <span className="text-base text-gray-500 font-medium">/ {total_departments} Departments</span>
          </div>
        </div>
        <div className={`text-sm font-bold px-4 py-1.5 rounded-full border ${is_complete ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {is_complete ? "✅ All Clear" : `${progress_percentage}%`}
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${is_complete ? "bg-green-500" : "bg-[#2D6A4F]"}`}
          style={{ width: `${progress_percentage}%` }}
        />
      </div>
      {is_complete && (
        <p className="mt-3 text-sm text-green-700 font-medium">
          🎉 You have been cleared by all departments. You may now proceed to move in.
        </p>
      )}
    </div>
  );
}

function ClearedCard({ item }) {
  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-[#2D6A4F] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-base leading-none flex-shrink-0">✅</span>
        <span className="text-sm font-bold text-gray-900 flex-1">{item.department}</span>
      </div>
      <div className="flex gap-4 flex-wrap text-xs text-gray-500">
        <span>👤 {item.cleared_by}</span>
        <span>🕐 {formatDate(item.cleared_at)}</span>
      </div>
      {item.notes && (
        <div className="mt-2 text-xs text-[#2D6A4F] italic bg-green-50 px-3 py-1.5 rounded-md">
          "{item.notes}"
        </div>
      )}
    </div>
  );
}

function PendingItem({ name }) {
  return (
    <div className="bg-gray-50 border border-gray-200 border-l-4 border-l-gray-300 rounded-xl p-4">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-base leading-none flex-shrink-0">⏳</span>
        <span className="text-sm font-semibold text-gray-400 flex-1">{name}</span>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pending</span>
      </div>
      <div className="text-xs text-gray-300">Awaiting QR code scan at this department</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClearancePage() {
  const router = useRouter();
  const [data,          setData]          = useState(DEV_MODE ? MOCK_DATA : null);
  const [loading,       setLoading]       = useState(!DEV_MODE);
  const [lastRefreshed, setLastRefreshed] = useState(DEV_MODE ? new Date() : null);

  // ✅ Ref always holds latest percentage — no stale closure in pollStatus
  const progressPctRef = useRef(null);

  // Full fetch — used on mount and when poll detects a change
  const fetchData = useCallback((silent = false) => {
    if (DEV_MODE) return;
    studentClearance()
      .then((res) => {
        const incoming = res.data.data;
        setData(incoming);
        setLastRefreshed(new Date());
        // Keep ref in sync whenever full data lands
        progressPctRef.current = incoming?.progress?.progress_percentage ?? null;
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
        } else if (silent) {
          toast.error("Could not refresh clearance data.");
        } else {
          toast.error("Failed to load clearance data. Please refresh.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Lightweight poll — only triggers full re-fetch when progress actually changed
  const pollStatus = useCallback(() => {
    if (DEV_MODE) return;
    myClearanceStatus()
      .then((res) => {
        const newPct = res.data.data?.progress_percentage ?? null;
        if (newPct !== progressPctRef.current) {
          fetchData(true);
        }
      })
      .catch(() => {
        // silent — poll failures don't warrant a toast
      });
  }, [fetchData]);

  // Initial load
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Smart poll every 30s
  useEffect(() => {
    if (DEV_MODE) return;
    const id = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollStatus]);

  if (loading) return <Spinner message="Loading your clearance status…" />;
  if (!data)   return null;

  const { student, progress, clearances, pending, academic_session } = data;

  return (
    <>
      {/* Session badge */}
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-4">
        <span>📅</span>
        <span>Academic Session: {academic_session}</span>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-normal text-gray-900 mb-1">Clearance Progress ✅</h1>
        <p className="text-sm text-gray-400">{student.department} · {student.level} Level · {student.gender}</p>
      </div>

      {/* Progress card */}
      <ProgressHeader progress={progress} />

      {/* Two-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

        {/* LEFT — cleared */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
            <span>✅</span>
            Cleared Departments
            <span className="ml-auto text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">{clearances.length}</span>
          </div>
          {clearances.length === 0 ? (
            <div className="text-sm text-gray-400 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center leading-relaxed">
              No departments cleared yet. Visit a department with your QR code to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {clearances.map((item) => <ClearedCard key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* RIGHT — pending */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
            <span>⏳</span>
            Pending Departments
            <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              All departments cleared! 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pending.map((name) => <PendingItem key={name} name={name} />)}
            </div>
          )}

          {/* QR reminder */}
          <div className="mt-5 bg-violet-50 border border-violet-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0">📱</span>
              <div>
                <strong className="block text-sm font-bold text-violet-900 mb-0.5">Remember to show your QR code!</strong>
                <p className="text-xs text-violet-700 m-0 leading-relaxed">Officers scan your QR at each department to record clearance.</p>
              </div>
            </div>
            <a href="/student/qrcode" className="self-start bg-[#6B4EFF] text-white text-sm font-semibold px-4 py-2 rounded-lg no-underline hover:brightness-90 transition-all">
              View QR Code →
            </a>
          </div>

          {/* Last refreshed */}
          {lastRefreshed && (
            <p className="mt-3 text-xs text-gray-300 text-right">
              🔄 Auto-refreshes every 30s · Last updated:{" "}
              {lastRefreshed.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>

      </div>
    </>
  );
}