"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./page.css";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { allAllocations, exportAllocationPDF } from "@/api/auth";

const PAGE_SIZE = 15;
const SESSIONS  = ["2025/2026", "2024/2025", "2023/2024"];

const DEV_MODE = false;

const MOCK_DATA = {
  total: 90,
  allocations: Array.from({ length: 90 }, (_, i) => ({
    allocation_id:     i + 1,
    student: {
      matric_number: `22/0${300 + i}`,
      full_name:     ["John Doe","Jane Smith","Mark Lee","Ada Obi","Chidi Nwankwo","Bola Ahmed","Ngozi Eze","Emeka Ibe","Tunde Sola","Kemi Ade"][i % 10],
      gender:        i % 2 === 0 ? "Male" : "Female",
      level:         ["100","200","300","400"][i % 4],
      department:    ["Software Engineering","Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering"][i % 5],
    },
    room: {
      block:       ["Block A","Block B","Block C"][i % 3],
      room_number: String(101 + (i % 20)),
      full_name:   `Block ${["A","B","C"][i % 3]} - ${101 + (i % 20)}`,
    },
    allocated_at:      new Date(Date.now() - i * 600000).toISOString(),
    allocation_method: "FCFS",
    academic_session:  "2025/2026",
    status:            i % 15 === 0 ? "cancelled" : "active",
  })),
};

//  Helpers 
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function exportCSV(allocations, session) {
  const rows = [
    ["Matric No","Full Name","Gender","Level","Department","Block","Room","Allocated At","Method","Status"],
    ...allocations.map((a) => [
      a.student.matric_number, a.student.full_name, a.student.gender,
      a.student.level, a.student.department,
      a.room.block, a.room.room_number,
      formatDate(a.allocated_at), a.allocation_method, a.status,
    ]),
  ];
  const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `allocations-${session.replace("/", "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

//  Allocation card 
function AllocationCard({ item, index }) {
  const { student, room, allocated_at, allocation_method, status,
          preferred_room, room_matched, reason } = item;
  const isActive     = status === "active";
  const hasMismatch  = preferred_room && room_matched === false;

  return (
    <div
      className="al2-fadein bg-white border border-[#e8e5df] rounded-2xl px-5 py-4 flex items-start justify-between gap-4 flex-wrap hover:shadow-sm transition-shadow"
      style={{
        borderLeft: `4px solid ${hasMismatch ? "#d97706" : isActive ? "#2D6A4F" : "#d1d5db"}`,
        animationDelay: `${index * 35}ms`,
      }}
    >
      {/* Left column */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {/* Name row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{student.full_name}</span>
          <span className="text-xs font-semibold text-[#6B4EFF]">({student.matric_number})</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
            ${student.gender === "Male"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-pink-50 text-pink-700 border-pink-200"}`}>
            {student.gender}
          </span>
        </div>

        {/* Dept / level */}
        <p className="text-xs text-gray-400">{student.department} · {student.level}L</p>

        {/* Room / date / method */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">🏠 {room.full_name}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">📅 {formatDate(allocated_at)}</span>
          <span className="text-gray-300">·</span>
          <span className="text-[11px] font-bold text-gray-400 bg-[#f0ede8] px-1.5 py-0.5 rounded">
            {allocation_method}
          </span>
        </div>

        {/* ── Mismatch banner ── */}
        {hasMismatch && (
          <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
              ⚠ Room preference not fully met
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-amber-800">
              <span>
                <span className="font-semibold">Preferred:</span>{" "}
                <span className="line-through text-amber-500">{preferred_room}</span>
              </span>
              <span>
                <span className="font-semibold">Given:</span> {room.full_name}
              </span>
            </div>
            {reason && (
              <p className="text-[11px] text-amber-600 leading-relaxed">{reason}</p>
            )}
          </div>
        )}
      </div>

      {/* Right — status badge */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
          ${isActive
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-100 text-gray-500 border-gray-200"}`}>
          {isActive ? "✅ Active" : "⛔ Cancelled"}
        </span>
        {hasMismatch && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            ⚠ Preference changed
          </span>
        )}
      </div>
    </div>
  );
}


//  Page 
export default function AllocationsPage() {
  const router = useRouter();

  const [allocations,  setAllocations]  = useState(DEV_MODE ? MOCK_DATA.allocations : []);
  const [total,        setTotal]        = useState(DEV_MODE ? MOCK_DATA.total : 0);
  const [loading,      setLoading]      = useState(!DEV_MODE);
  const [page,         setPage]         = useState(1);
  const [session,      setSession]      = useState("2025/2026");
  const [search,       setSearch]       = useState("");
  const [blockFilter,  setBlockFilter]  = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAllocations = useCallback(() => {
    if (DEV_MODE) return;
    setLoading(true);
    allAllocations(session)
      .then((res) => {
        setAllocations(res.data.data.allocations);
        setTotal(res.data.data.total);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
        } else {
          toast.error("Failed to load allocations.");
        }
      })
      .finally(() => setLoading(false));
  }, [session, router]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const blocks = [...new Set(allocations.map((a) => a.room.block))].sort();

  const filtered = useMemo(() => allocations.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q || a.student.full_name.toLowerCase().includes(q) || a.student.matric_number.toLowerCase().includes(q) || a.room.full_name.toLowerCase().includes(q) || a.student.department.toLowerCase().includes(q)) &&
      (!blockFilter  || a.room.block     === blockFilter)  &&
      (!genderFilter || a.student.gender === genderFilter) &&
      (!statusFilter || a.status         === statusFilter)
    );
  }), [allocations, search, blockFilter, genderFilter, statusFilter]);

  const totalPages     = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount    = filtered.filter((a) => a.status === "active").length;
  const cancelledCount = filtered.filter((a) => a.status === "cancelled").length;

  useEffect(() => { setPage(1); }, [search, blockFilter, genderFilter, statusFilter, session]);

  if (loading && allocations.length === 0) return <Spinner message="Loading allocations…" />;

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            🗂️ All Allocations
            <span className="ml-2 text-lg font-bold text-gray-400">({total})</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">{activeCount} active · {cancelledCount} cancelled</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-green-700 text-white hover:bg-green-800 transition-colors font-sans disabled:opacity-40"
            onClick={() => exportCSV(filtered, session)}
            disabled={filtered.length === 0}
          >
            ⬇ Export CSV
          </button>
          <a
            href={exportAllocationPDF(session)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors no-underline"
          >
            ⬇ Export PDF
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <select className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer" value={session} onChange={(e) => setSession(e.target.value)}>
          {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="text" placeholder="Search name, matric, room, dept…" className="flex-1 min-w-[200px] border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:border-[#6B4EFF] transition-colors" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer" value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
          <option value="">All Blocks</option>
          {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(search || blockFilter || genderFilter || statusFilter) && (
          <button className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 bg-[#f0ede8] hover:bg-[#e8e5df] transition-colors font-sans" onClick={() => { setSearch(""); setBlockFilter(""); setGenderFilter(""); setStatusFilter(""); }}>
            Clear ×
          </button>
        )}
        <span className="ml-auto self-center text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </span>
      </div>

      {/* ✅ loading with existing data = subtle inline indicator, not full spinner */}
      {loading && allocations.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <div className="al2-spinner" /> Refreshing…
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-gray-400">
          <span className="text-4xl">🗂️</span>
          <p className="text-sm font-medium">
            {filtered.length === 0 && allocations.length > 0
              ? "No allocations match your filters."
              : "No allocations found for this session."}
          </p>
          {allocations.length === 0 && (
            <a href="/admin/allocate" className="text-sm font-semibold text-[#6B4EFF] hover:underline no-underline">
              Run allocation →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map((item, i) => (
            <AllocationCard key={item.allocation_id} item={item} index={i} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}