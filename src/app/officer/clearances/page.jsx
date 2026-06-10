"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import { departmentClearances } from "@/api/auth";
import Spinner from "@/components/ui/Spinner";
import StudentClearanceItem from "@/components/StudentClearanceItem";


const PAGE_SIZE = 20;

//  DEV_MODE: flip to false when backend is ready ─
const DEV_MODE = false;

const MOCK_DATA = {
  department:       "Bursary",
  total_clearances: 120,
  clearances: Array.from({ length: 120 }, (_, i) => ({
    clearance_id:     i + 1,
    student: {
      id:             i + 1,
      matric_number:  `22/0${300 + i}`,
      full_name:      ["John Doe","Jane Smith","Mark Lee","Ada Obi","Chidi Nwankwo","Bola Ahmed","Ngozi Eze","Emeka Ibe","Tunde Sola","Kemi Ade"][i % 10],
      level:          ["100","200","300","400"][i % 4],
      department:     ["Software Engineering","Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering"][i % 5],
    },
    cleared_by:       "bursary@university.edu.ng",
    cleared_at:       new Date(Date.now() - i * 900000).toISOString(),
    notes:            i % 3 === 0 ? "All fees paid in full" : i % 3 === 1 ? "Payment confirmed" : "",
    academic_session: "2025/2026",
  })),
  pagination: { limit: 20, offset: 0, total: 120 },
};

//  Helpers 
function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateOnly(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function isSameDay(isoA, isoB) {
  const a = new Date(isoA), b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}


//  Page 
export default function ClearancesPage() {
  const router = useRouter();

  const [allClearances, setAllClearances] = useState(DEV_MODE ? MOCK_DATA.clearances : []);
  const [department,    setDepartment]    = useState(DEV_MODE ? MOCK_DATA.department : "");
  const [total,         setTotal]         = useState(DEV_MODE ? MOCK_DATA.total_clearances : 0);
  const [loading,       setLoading]       = useState(!DEV_MODE);
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState("");
  const [dateFilter,    setDateFilter]    = useState("all"); // 'all' | 'today' | 'week' | 'custom'
  const [customDate,    setCustomDate]    = useState("");    // YYYY-MM-DD

  const fetchClearances = useCallback(() => {
    if (DEV_MODE) return;
    setLoading(true);
    departmentClearances({ limit: 999, offset: 0 })
      .then((res) => {
        const d = res.data.data;
        setAllClearances(d.clearances);
        setDepartment(d.department);
        setTotal(d.total_clearances);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("officer_token");
          router.replace("/login");
        } else {
          toast.error("Failed to load clearances. Please refresh.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);

  const filtered = useMemo(() => {
    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    return allClearances.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.student.full_name.toLowerCase().includes(q) ||
        c.student.matric_number.toLowerCase().includes(q) ||
        c.student.department.toLowerCase().includes(q);

      const clearedDate = new Date(c.cleared_at);
      const matchDate =
        dateFilter === "all"    ? true :
        dateFilter === "today"  ? isSameDay(c.cleared_at, now.toISOString()) :
        dateFilter === "week"   ? clearedDate >= weekAgo :
        dateFilter === "custom" && customDate
          ? isSameDay(c.cleared_at, new Date(customDate).toISOString())
          : true;

      return matchSearch && matchDate;
    });
  }, [allClearances, search, dateFilter, customDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, dateFilter, customDate]);

// ✅ Own fresh Date() — no dependency on the removed component-level now
  const todayCount = allClearances.filter((c) =>
    isSameDay(c.cleared_at, new Date().toISOString())
  ).length;

  return (
    <>
      {/* ── Heading ── */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            📋 My Clearances
            {department && <span className="text-gray-400"> — {department} Department</span>}
          </h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <p className="text-sm text-gray-400">
              Total cleared: <strong className="text-gray-700">{total} students</strong>
            </p>
            <p className="text-sm text-gray-400">
              Today: <strong className="text-[#2D6A4F]">{todayCount}</strong>
            </p>
          </div>
        </div>
        <a
          href="/officer/scan"
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl no-underline hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
        >
          📷 Scan QR
        </a>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2.5 mb-5">

        {/* Search */}
        <input
          type="text"
          placeholder="Search name, matric, department…"
          className="flex-1 min-w-[200px] border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:border-[#6B4EFF] transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Date filter */}
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setCustomDate(""); }}
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="custom">Pick a Date…</option>
        </select>

        {/* Custom date picker */}
        {dateFilter === "custom" && (
          <input
            type="date"
            className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        )}

        {/* Clear filters */}
        {(search || dateFilter !== "all") && (
          <button
            className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 bg-[#f0ede8] hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={() => { setSearch(""); setDateFilter("all"); setCustomDate(""); }}
          >
            Clear ×
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto self-center text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </span>
      </div>

      {/* ── Content ── */}
      {loading ? (
          <Spinner message="Loading clearances…" />
        ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-gray-400">
          <span className="text-4xl">📋</span>
          <p className="text-sm font-medium">
            {filtered.length === 0 && allClearances.length > 0
              ? "No clearances match your filters."
              : "No clearances recorded yet."}
          </p>
          {allClearances.length === 0 && (
            <a href="/officer/scan" className="text-sm font-semibold text-[#6B4EFF] hover:underline no-underline">
              Start scanning →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map((item, i) => (
            <StudentClearanceItem key={item.clearance_id} item={item} index={i} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}