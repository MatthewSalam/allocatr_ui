"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./page.css";
import { systemStatus, runAllocation } from "@/api/auth";
import Spinner from "@/components/ui/Spinner";

const DEV_MODE = false;

const MOCK_STATUS = {
  students: { ready_for_allocation: 100, with_verified_receipts: 100 },
  rooms:    { available: 10, available_spaces: 20 },
  allocation_ready: true,
};

const MOCK_RESULT = {
  total_students: 100,
  allocated: 90,
  failed: 10,
  details: [
    ...Array.from({ length: 90 }, (_, i) => ({
      student: `Student ${i + 1} (22/0${300 + i})`,
      room: `Block ${["A","B","C"][i % 3]} - ${101 + i}`,
      status: "success",
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      student: `Student ${91 + i} (22/0${390 + i})`,
      room: null,
      status: "failed",
      reason: "No available rooms for Female students",
    })),
  ],
};

//  Helpers ─
function downloadCSV(result) {
  const rows = [
    ["Student", "Room", "Status", "Reason"],
    ...result.details.map((d) => [d.student, d.room ?? "—", d.status, d.reason ?? ""]),
  ];
  const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `allocation-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

//  Result screen ─
function ResultScreen({ result, onReset, router }) {
  const [showAll, setShowAll] = useState(false);

  const successful = result.details.filter((d) => d.status === "success");
  const failed     = result.details.filter((d) => d.status === "failed");
  const mismatched = successful.filter((d) => d.preferred_room && d.room_matched === false);
  const successPct = result.total_students > 0
    ? Math.round((result.allocated / result.total_students) * 100)
    : 0;

  const visibleSuccess = showAll ? successful : successful.slice(0, 10);

  return (
    <div className="al-fadein max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-extrabold text-gray-900">Allocation Complete!</h1>
        <p className="text-sm text-gray-400 mt-1">FCFS algorithm ran successfully</p>
      </div>

      {/* Summary cards — now 4 if there are mismatches */}
      <div className={`grid gap-3 mb-5 ${mismatched.length > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
        <div className="bg-white border border-[#e8e5df] rounded-xl p-4 text-center"
          style={{ borderTop: "3px solid #185FA5" }}>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Total</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{result.total_students}</p>
          <p className="text-xs text-gray-400 mt-0.5">students</p>
        </div>
        <div className="bg-white border border-[#e8e5df] rounded-xl p-4 text-center"
          style={{ borderTop: "3px solid #2D6A4F" }}>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Allocated</p>
          <p className="text-3xl font-extrabold text-green-700 mt-1">{result.allocated}</p>
          <p className="text-xs text-gray-400 mt-0.5">{successPct}% success</p>
        </div>
        <div className="bg-white border border-[#e8e5df] rounded-xl p-4 text-center"
          style={{ borderTop: `3px solid ${result.failed > 0 ? "#dc2626" : "#2D6A4F"}` }}>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Failed</p>
          <p className={`text-3xl font-extrabold mt-1 ${result.failed > 0 ? "text-red-600" : "text-green-700"}`}>
            {result.failed}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">unallocated</p>
        </div>
        {mismatched.length > 0 && (
          <div className="bg-white border border-[#e8e5df] rounded-xl p-4 text-center"
            style={{ borderTop: "3px solid #d97706" }}>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Rerouted</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{mismatched.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">pref. changed</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-4 mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Allocation rate</span>
          <span className="font-bold">{successPct}%</span>
        </div>
        <div className="h-3 bg-[#f0ede8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${successPct}%`,
              background: successPct === 100 ? "#16a34a" : "#2D6A4F",
            }}
          />
        </div>
      </div>

      {/* Successful list */}
      {successful.length > 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-2xl overflow-hidden mb-4"
          style={{ borderTop: "4px solid #2D6A4F" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ede8]">
            <span className="text-sm font-bold text-gray-900">
              ✅ Successful ({successful.length})
            </span>
            {mismatched.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                ⚠ {mismatched.length} rerouted
              </span>
            )}
          </div>

          <div className="divide-y divide-[#f0ede8]">
            {visibleSuccess.map((d, i) => {
              const hasMismatch = d.preferred_room && d.room_matched === false;
              return (
                <div key={i} className={`px-5 py-3 text-sm ${hasMismatch ? "bg-amber-50/40" : ""}`}>
                  {/* Main row */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-700 font-medium">{d.student}</span>
                    <span className="text-[#2D6A4F] font-semibold text-xs shrink-0">
                      → {d.room}
                    </span>
                  </div>

                  {/* Mismatch detail */}
                  {hasMismatch && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex flex-col gap-0.5">
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-amber-800">
                        <span>
                          <span className="font-semibold">Preferred:</span>{" "}
                          <span className="line-through text-amber-500">{d.preferred_room}</span>
                        </span>
                        <span className="text-amber-300">→</span>
                        <span>
                          <span className="font-semibold">Given:</span> {d.room}
                        </span>
                      </div>
                      {d.reason && (
                        <p className="text-[11px] text-amber-600 mt-0.5">{d.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {successful.length > 10 && (
            <button
              className="w-full py-2.5 text-xs font-semibold text-[#6B4EFF] hover:bg-[#f5f3ff] transition-colors font-sans border-t border-[#f0ede8]"
              onClick={() => setShowAll((p) => !p)}
            >
              {showAll ? "Show less ▴" : `Show all ${successful.length} ▾`}
            </button>
          )}
        </div>
      )}

      {/* Failed list */}
      {failed.length > 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-2xl overflow-hidden mb-5"
          style={{ borderTop: "4px solid #dc2626" }}>
          <div className="px-5 py-3.5 border-b border-[#f0ede8]">
            <span className="text-sm font-bold text-gray-900">❌ Failed ({failed.length})</span>
          </div>
          <div className="divide-y divide-[#f0ede8]">
            {failed.map((d, i) => (
              <div key={i} className="flex items-start justify-between px-5 py-2.5 gap-4">
                <span className="text-sm text-gray-700">{d.student}</span>
                <span className="text-xs text-red-500 text-right shrink-0">{d.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors font-sans"
          onClick={() => router.push("/admin/allocations")}
        >
          🗂️ View All Allocations
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f0ede8] text-gray-700 text-sm font-bold hover:bg-[#e8e5df] transition-colors font-sans border border-[#e0ddd7]"
          onClick={() => downloadCSV(result)}
        >
          ⬇ Download CSV Report
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent text-[#6B4EFF] text-sm font-semibold hover:bg-[#f5f3ff] transition-colors font-sans border border-[#c4b5fd]"
          onClick={onReset}
        >
          ↩ Run Again
        </button>
      </div>
    </div>
  );
}


//  Page 
export default function AllocatePage() {
  const router = useRouter();

  const [status,  setStatus]  = useState(DEV_MODE ? MOCK_STATUS : null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(DEV_MODE ? MOCK_RESULT : null);

  const [session, setSession] = useState("2025/2026");
  const [gender,  setGender]  = useState("all");

  const fetchStatus = useCallback(() => {
    if (DEV_MODE) return;
    setLoading(true);
    systemStatus()
      .then((res) => setStatus(res.data.data))
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
        } else {
          toast.error("Failed to load system status.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleRun = async () => {
    if (DEV_MODE) return;
    setRunning(true);
    const payload = {
      academic_session: session,
      gender: gender === "all" ? null : gender,
    };
    try {
      const res = await toast.promise(
        runAllocation(payload),
        {
          loading: "Running FCFS allocation…",
          success: "Allocation completed!",
          error:   (err) => err?.response?.data?.message ?? "Allocation failed.",
        }
      );
      setResult(res.data.data);
    } catch (err) {
      // toast.promise already shows the error toast — nothing extra needed here
    } finally {
      setRunning(false);
    }
  };

  if (result) return (
    <ResultScreen result={result} onReset={() => { setResult(null); fetchStatus(); }} router={router} />
  );

  const ready    = status?.allocation_ready ?? false;
  const spaces   = status?.rooms?.available_spaces ?? 0;
  const students = status?.students?.ready_for_allocation ?? 0;

  return (
    <div className="max-w-xl mx-auto">

      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">🎯 Run Room Allocation</h1>
        <p className="text-sm text-gray-400 mt-1">FCFS — First-Come, First-Served</p>
      </div>

      {/* Warning banner */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Before you proceed</p>
          <p className="text-amber-700 leading-relaxed">
            This will allocate rooms to all students with verified receipts using the FCFS algorithm,
            ordered by receipt upload time. Previously allocated students will be skipped.
          </p>
        </div>
      </div>

      {/* Pre-allocation summary */}
      <div className="bg-white border border-[#e8e5df] rounded-2xl p-5 mb-5" style={{ borderTop: "4px solid #185FA5" }}>
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
          Pre-Allocation Summary
        </p>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400">
             <Spinner message="Loading allocation status…" />;
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <SummaryRow icon="🎓" label="Students ready for allocation" value={students} valueColor="text-gray-900" />
            <SummaryRow icon="🏠" label="Available rooms"              value={status?.rooms?.available ?? 0} valueColor="text-green-700" />
            <SummaryRow
              icon="🛏️"
              label="Available spaces"
              value={spaces}
              valueColor={spaces < students ? "text-amber-600" : "text-green-700"}
            />
            {spaces < students && (
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1 text-xs text-amber-700">
                <span>⚠️</span>
                <span>Available spaces ({spaces}) are fewer than ready students ({students}). {students - spaces} student(s) may not receive a room.</span>
              </div>
            )}
            {!ready && (
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1 text-xs text-red-700">
                <span>❌</span>
                <span>Allocation prerequisites not met. Ensure receipts are verified and rooms are available.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white border border-[#e8e5df] rounded-2xl p-5 mb-5 flex flex-col gap-5">

        {/* Session */}
        <div>
          <label className="al-label">Academic Session</label>
          <select
            className="al-input"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            disabled={running}
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
            <option value="2023/2024">2023/2024</option>
          </select>
        </div>

        {/* Gender filter */}
        <div>
          <label className="al-label">
            Gender Filter <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex flex-col gap-2.5 mt-1">
            {[
              { value: "all",    label: "All Students",  sub: "Allocate male and female students together" },
              { value: "Male",   label: "Male Only",     sub: "Only allocate male students this run" },
              { value: "Female", label: "Female Only",   sub: "Only allocate female students this run" },
            ].map(({ value, label, sub }) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                  ${gender === value
                    ? "border-[#6B4EFF] bg-[#f5f3ff]"
                    : "border-[#e8e5df] bg-[#fafaf9] hover:bg-[#f5f3ef]"
                  }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  className="mt-0.5 accent-[#6B4EFF]"
                  disabled={running}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Algorithm note */}
        <div className="flex gap-3 bg-[#f0fdf4] border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <span className="shrink-0">✅</span>
          <div>
            <p className="font-semibold">Algorithm: First-Come, First-Served</p>
            <p className="text-xs text-green-600 mt-0.5">
              Students are ordered by receipt upload time. Preference for block and room number is considered where possible.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
          onClick={() => router.back()}
          disabled={running}
        >
          Cancel
        </button>
        <button
          className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all font-sans
            ${ready && !running
              ? "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-[#f0ede8] text-gray-400 cursor-not-allowed"
            }`}
          onClick={handleRun}
          disabled={!ready || running || loading}
        >
          {running
            ? <><div className="al-spinner-sm" /> Running FCFS…</>
            : "Run Allocation →"
          }
        </button>
      </div>

      {!ready && !loading && (
        <p className="text-xs text-center text-gray-400 mt-3">
          Allocation is disabled until prerequisites are met.
        </p>
      )}
    </div>
  );
}

//  Tiny helper 
function SummaryRow({ icon, label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-gray-500">
        <span>{icon}</span>{label}
      </span>
      <span className={`font-bold text-base ${valueColor}`}>{value}</span>
    </div>
  );
}