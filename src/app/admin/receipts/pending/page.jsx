"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import "./page.css";
import Pagination from "@/components/ui/Pagination";
import { pendingReceipts, verifyReceipt, rejectReceipt } from "@/api/auth";

const BASE_URL    = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE   = 15;

//  Mock 
const DEV_MODE = false;
const MOCK_RECEIPTS = Array.from({ length: 20 }, (_, i) => ({
  receipt_id:            i + 1,
  student: {
    id:             i + 1,
    matric_number:  `22/0${330 + i}`,
    full_name:      ["John Doe","Jane Smith","Mark Lee","Ada Obi","Chidi Nwankwo","Bola Ahmed","Ngozi Eze","Emeka Ibe","Tunde Sola","Kemi Ade"][i % 10],
    email:          `student${i + 1}@uni.edu.ng`,
    level:          ["100","200","300","400"][i % 4],
    department:     ["Software Engineering","Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering"][i % 5],
  },
  file_name:             `receipt_${10000 + i}.pdf`,
  amount:                50000,
  payment_reference:     `PAY-2026-${String(i + 1).padStart(3, "0")}`,
  uploaded_at:           new Date(Date.now() - i * 3600000).toISOString(),
  academic_session:      "2025/2026",
  preferred_block:       ["Block A","Block B","Block C"][i % 3],
  preferred_room_number: String(101 + i),
}));

//  Helpers 
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(amount);
}

//  Verify modal ─
function VerifyModal({ receipt, onClose, onConfirm, loading }) {
  const [amount, setAmount]   = useState(String(receipt.amount));
  const [ref,    setRef]      = useState(receipt.payment_reference);

  return (
    <div className="rp-modal-backdrop" onClick={onClose}>
      <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">✅ Verify Receipt #{receipt.receipt_id}</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <div className="bg-[#f0fdf4] border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-800">
          <p className="font-semibold">{receipt.student.full_name} ({receipt.student.matric_number})</p>
          <p className="text-xs text-green-600 mt-0.5">{receipt.student.department} · {receipt.student.level}L</p>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Confirm Amount (₦)
            </label>
            <input
              type="number"
              className="w-full border border-[#e0ddd7] rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-[#fafaf9] outline-none focus:border-green-500 focus:bg-white transition-colors"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Payment Reference
            </label>
            <input
              type="text"
              className="w-full border border-[#e0ddd7] rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-[#fafaf9] outline-none focus:border-green-500 focus:bg-white transition-colors"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50 font-sans flex items-center justify-center gap-2"
            onClick={() => onConfirm({ amount: Number(amount), payment_reference: ref })}
            disabled={loading || !amount || !ref}
          >
            {loading ? <><div className="rp-spinner-sm" /> Verifying…</> : "✅ Confirm Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Reject modal ─
function RejectModal({ receipt, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");

  return (
    <div className="rp-modal-backdrop" onClick={onClose}>
      <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">❌ Reject Receipt #{receipt.receipt_id}</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-800">
          <p className="font-semibold">{receipt.student.full_name} ({receipt.student.matric_number})</p>
          <p className="text-xs text-red-500 mt-0.5">{receipt.student.department} · {receipt.student.level}L</p>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-[#e0ddd7] rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-[#fafaf9] outline-none focus:border-red-400 focus:bg-white transition-colors resize-none font-sans"
            rows={4}
            placeholder="e.g. Receipt image is not clear. Please upload a clearer version."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">This message will be shown to the student.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-sans flex items-center justify-center gap-2"
            onClick={() => onConfirm({ rejection_reason: reason })}
            disabled={loading || !reason.trim()}
          >
            {loading ? <><div className="rp-spinner-sm" /> Rejecting…</> : "❌ Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ receipt, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const isPdf = receipt.file_name?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    axios
      .get(`${BASE_URL}/api/admin/receipts/${receipt.receipt_id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      .then((res) => {
        const mimeType = isPdf
          ? "application/pdf"
          : res.data.type || "image/jpeg";
        const blob = new Blob([res.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch(() => setLoadError(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [receipt.receipt_id]);

  const handleOpenNewTab = () => {
    if (objectUrl) window.open(objectUrl, "_blank");
  };

  return (
    <div className="rp-modal-backdrop" onClick={onClose}>
      <div className="rp-modal rp-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            📎 {receipt.file_name}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="rp-preview-frame">
          {loadError ? (
            <p className="text-center text-gray-500 text-sm py-10">
              Failed to load file.
            </p>
          ) : !objectUrl ? (
            <p className="text-center text-gray-500 text-sm py-10">
              Loading preview…
            </p>
          ) : isPdf ? (
            <iframe
              src={`${objectUrl}#toolbar=0`}
              className="w-full h-full border-0 rounded-lg"
              title="Receipt preview"
            />
          ) : (
            <img
              src={objectUrl}
              alt="Receipt"
              className="max-w-full max-h-full object-contain rounded-lg mx-auto"
            />
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleOpenNewTab}
            disabled={!objectUrl}
            className="text-sm font-semibold text-[#6B4EFF] hover:underline disabled:opacity-40"
          >
            Open in new tab ↗
          </button>
        </div>
      </div>
    </div>
  );
}

//  Receipt card ─
function ReceiptCard({ receipt, index, onVerify, onReject, onPreview }) {
  return (
    <div
      className="rp-fadein bg-white border border-[#e8e5df] rounded-2xl p-5 flex flex-col gap-4"
      style={{ borderTop: "3px solid #e8e5df", animationDelay: `${index * 40}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Receipt #{receipt.receipt_id}
            </span>
            <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              ⏳ Pending
            </span>
          </div>
          <p className="text-base font-bold text-gray-900 mt-1">
            {receipt.student.full_name}{" "}
            <span className="text-[#6B4EFF] font-semibold">({receipt.student.matric_number})</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {receipt.student.department} · {receipt.student.level}L
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-gray-900">{formatNaira(receipt.amount)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Ref: {receipt.payment_reference}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 border-t border-[#f0ede8] pt-3">
        <span>📅 Uploaded: {formatDate(receipt.uploaded_at)}</span>
        <span>🏠 Preferred: {receipt.preferred_block} — Room {receipt.preferred_room_number}</span>
        <span>📚 Session: {receipt.academic_session}</span>
        <span>✉️ {receipt.student.email}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 flex-wrap pt-1">
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
          onClick={() => onPreview(receipt)}
        >
          👁 View Receipt
        </button>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-green-700 text-white hover:bg-green-800 transition-colors font-sans"
          onClick={() => onVerify(receipt)}
        >
          ✅ Verify
        </button>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors font-sans"
          onClick={() => onReject(receipt)}
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}

//  Page 
export default function PendingReceiptsPage() {
  const router = useRouter();

  const [receipts,     setReceipts]     = useState(DEV_MODE ? MOCK_RECEIPTS : []);  
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(!DEV_MODE);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [levelFilter,  setLevelFilter]  = useState("");
  const [deptFilter,   setDeptFilter]   = useState("");

  const [verifyTarget,  setVerifyTarget]  = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReceipts = useCallback(() => {
    if (DEV_MODE) return;
    setLoading(true);
    pendingReceipts()
      .then((res) => {
        setReceipts(res.data.data.receipts);
        setTotal(res.data.data.total);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("admin_token");
          router.replace("/login");
        } else {
          toast.error("Failed to load receipts.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  // ── Client-side filter + paginate ──
  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.student.full_name.toLowerCase().includes(q) ||
        r.student.matric_number.toLowerCase().includes(q) ||
        r.payment_reference.toLowerCase().includes(q);
      const matchLevel = !levelFilter || r.student.level === levelFilter;
      const matchDept  = !deptFilter  || r.student.department === deptFilter;
      return matchSearch && matchLevel && matchDept;
    });
  }, [receipts, search, levelFilter, deptFilter]);

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const departments  = [...new Set(receipts.map((r) => r.student.department))].sort();

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, levelFilter, deptFilter]);

  const handleVerify = async (body) => {
    setActionLoading(true);
    try {
      await verifyReceipt(verifyTarget.receipt_id, body);
      toast.success(`Receipt #${verifyTarget.receipt_id} verified!`);
      setReceipts((prev) => prev.filter((r) => r.receipt_id !== verifyTarget.receipt_id));
      setTotal((t) => t - 1);
      setVerifyTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Verification failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (body) => {
    setActionLoading(true);
    try {
      await rejectReceipt(rejectTarget.receipt_id, body);
      toast.success(`Receipt #${rejectTarget.receipt_id} rejected.`);
      setReceipts((prev) => prev.filter((r) => r.receipt_id !== rejectTarget.receipt_id));
      setTotal((t) => t - 1);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* ── Heading ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            📋 Pending Receipts
            <span className="ml-2 text-lg font-bold text-amber-600">({total})</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Review and verify student payment receipts</p>
        </div>
        <a
          href="/admin/receipts"
          className="text-xs font-semibold text-[#6B4EFF] hover:underline no-underline"
        >
          ← All Receipts
        </a>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <input
          type="text"
          placeholder="Search name, matric, reference…"
          className="flex-1 min-w-[200px] border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:border-[#6B4EFF] transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">All Levels</option>
          {["100","200","300","400"].map((l) => (
            <option key={l} value={l}>{l}L</option>
          ))}
        </select>
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {(search || levelFilter || deptFilter) && (
          <button
            className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 bg-[#f0ede8] hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={() => { setSearch(""); setLevelFilter(""); setDeptFilter(""); }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* ── Results summary ── */}
      {!loading && (search || levelFilter || deptFilter) && (
        <p className="text-xs text-gray-400 mb-4">
          Showing {filtered.length} of {total} receipts
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </p>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 text-sm text-gray-400">
          <div className="rp-spinner" />
          <span>Loading receipts…</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-gray-400">
          <span className="text-4xl">🎉</span>
          <p className="text-sm font-medium">
            {filtered.length === 0 && receipts.length > 0
              ? "No receipts match your filters."
              : "No pending receipts — all caught up!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {paginated.map((receipt, i) => (
            <ReceiptCard
              key={receipt.receipt_id}
              receipt={receipt}
              index={i}
              onVerify={setVerifyTarget}
              onReject={setRejectTarget}
              onPreview={setPreviewTarget}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {/* ── Modals ── */}
      {verifyTarget  && (
        <VerifyModal
          receipt={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onConfirm={handleVerify}
          loading={actionLoading}
        />
      )}
      {rejectTarget  && (
        <RejectModal
          receipt={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}
      {previewTarget && (
        <PreviewModal
          receipt={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </>
  );
}