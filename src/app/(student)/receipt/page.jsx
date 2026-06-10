"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import "./page.css";
import { myReceipts, uploadReceipt } from "@/api/auth";


const BLOCKS = ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block I"];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;


const s = {
  pageTitle:      { fontFamily: "'Georgia', serif", fontSize: "22px", fontWeight: 400, color: "#1a1a1a", margin: "0 0 4px" },
  pageSub:        { fontSize: "14px", color: "#9E9B96", margin: "0 0 2rem" },
  cardTitle:      { fontSize: "14px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "8px" },
  label:          { fontSize: "13px", fontWeight: 500, color: "#6B6963" },
  errorMsg:       { fontSize: "12px", color: "#E24B4A" },
  sectionLabel:   { fontSize: "12px", fontWeight: 600, color: "#9E9B96", textTransform: "uppercase", letterSpacing: "0.05em", margin: "6px 0 2px" },
  optionalTag:    { fontSize: "11px", fontWeight: 400, color: "#C4C1BB", marginLeft: "6px", textTransform: "none", letterSpacing: 0 },
  listFilename:   { fontSize: "13px", fontWeight: 600, color: "#1a1a1a" },
  listMeta:       { fontSize: "12px", color: "#9E9B96" },
  listReason:     { fontSize: "12px", color: "#B91C1C", marginTop: "2px" },
  stateText:      { fontSize: "13px", textAlign: "center", padding: "2rem 0" },
};

//  Helpers 
function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(amount);
}

//  Validation 
const schema = Yup.object({
  amount:               Yup.number().typeError("Enter a valid amount").positive("Amount must be positive").required("Amount is required"),
  payment_reference:    Yup.string().trim().required("Payment reference is required"),
  academic_session:     Yup.string().matches(/^\d{4}\/\d{4}$/, "Format: YYYY/YYYY e.g. 2025/2026").required("Academic session is required"),
  preferred_block:      Yup.string(),
  preferred_room_number: Yup.string(),
});

//  Dropzone 
function Dropzone({ file, onFile, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((incoming) => {
    if (!incoming) return;
    if (!ACCEPTED_TYPES.includes(incoming.type)) { toast.error("Only JPG, PNG, or PDF files are accepted."); return; }
    if (incoming.size > MAX_SIZE_BYTES) { toast.error("File must be under 5MB."); return; }
    onFile(incoming);
  }, [onFile]);

  return (
    <div
      className={`dropzone${dragging ? " active" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      <div className="dropzone-icon">{file ? "📎" : "☁️"}</div>
      <div className="dropzone-label">{file ? "File selected" : "Drag & drop or click to browse"}</div>
      <div className="dropzone-hint">Supported: JPG, PNG, PDF · Max size: 5MB</div>
      {file  && <div className="dropzone-file-selected">✓ {file.name}</div>}
      {error && <div style={s.errorMsg}>{error}</div>}
    </div>
  );
}

//  Receipt list item ──
// Status chip colours stay in CSS (.receipt-status-chip.verified/pending/rejected).

function ReceiptListItem({ receipt }) {
  const statusIcon = { verified: "✅", pending: "⏳", rejected: "❌" }[receipt.verification_status] ?? "—";
  return (
    <div className="receipt-list-item">
      <div className="receipt-list-left">
        <div style={s.listFilename}>📄 {receipt.file_name}</div>
        <div style={s.listMeta}>{formatCurrency(receipt.amount)} · Ref: {receipt.payment_reference}</div>
        <div style={s.listMeta}>
          Uploaded {timeAgo(receipt.uploaded_at)}
          {receipt.verified_at && ` · Verified ${timeAgo(receipt.verified_at)}`}
        </div>
        {receipt.rejection_reason && <div style={s.listReason}>Reason: {receipt.rejection_reason}</div>}
      </div>
      <div className={`receipt-status-chip ${receipt.verification_status}`}>
        {statusIcon} {receipt.verification_status}
      </div>
    </div>
  );
}

//  Page 
export default function ReceiptPage() {
  const [receipts,        setReceipts]        = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [file,            setFile]            = useState(null);
  const [fileError,       setFileError]       = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchReceipts = () => {
    setReceiptsLoading(true);
    myReceipts()
      .then((res) => {
        console.log("receipts response:", res.data);
        setReceipts(res.data ?? []);
      })
      .catch((err) => {
          console.error("fetchReceipts error:", err?.response?.status, err?.response?.data);
          toast.error("Could not load receipts.");
        })
      .finally(() => setReceiptsLoading(false));
  };

  useEffect(() => { fetchReceipts(); }, []);

  const formik = useFormik({
    initialValues: {
      amount: "", payment_reference: "", academic_session: "2025/2026",
      preferred_block: "", preferred_room_number: "",
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!file) { setFileError("Please select a receipt file."); setSubmitting(false); return; }
      setFileError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("amount", values.amount);
      formData.append("payment_reference", values.payment_reference);
      formData.append("academic_session", values.academic_session);
      if (values.preferred_block)       formData.append("preferred_block", values.preferred_block);
      if (values.preferred_room_number) formData.append("preferred_room_number", values.preferred_room_number);

      uploadReceipt(formData)
        .then(() => {
          toast.success("Receipt uploaded! Awaiting verification.");
          resetForm();
          setFile(null);
          fetchReceipts();
        })
        .catch((err) =>
          toast.error(err?.response?.data?.detail ?? err?.response?.data?.message ?? "Upload failed.")
        )
        .finally(() => setSubmitting(false));
    },
  });

  // Reusable field error helper
  const fieldError = (name) =>
    formik.touched[name] && formik.errors[name]
      ? <span style={s.errorMsg}>{formik.errors[name]}</span>
      : null;

  return (
    <>
      <h1 style={s.pageTitle}>Payment Receipt</h1>
      <p style={s.pageSub}>Upload your hostel fee receipt to begin the allocation process.</p>

      <div className="receipt-layout">

        {/* ── Upload form ── */}
        <div className="receipt-card">
          <div style={s.cardTitle}>📎 Upload Receipt</div>

          <form onSubmit={formik.handleSubmit} noValidate className="receipt-form">

            <Dropzone file={file} onFile={setFile} error={fileError} />

            {/* Amount */}
            <div className="receipt-field">
              <label style={s.label}>Amount Paid</label>
              <div className="receipt-input-prefix">
                <span>₦</span>
                <input
                  className={`receipt-input${formik.touched.amount && formik.errors.amount ? " error" : ""}`}
                  name="amount" type="number" placeholder="50000"
                  value={formik.values.amount} onChange={formik.handleChange} onBlur={formik.handleBlur}
                />
              </div>
              {fieldError("amount")}
            </div>

            {/* Reference + Session */}
            <div className="receipt-row">
              <div className="receipt-field">
                <label style={s.label}>Payment Reference</label>
                <input
                  className={`receipt-input${formik.touched.payment_reference && formik.errors.payment_reference ? " error" : ""}`}
                  name="payment_reference" type="text" placeholder="PAY-2026-001"
                  value={formik.values.payment_reference} onChange={formik.handleChange} onBlur={formik.handleBlur}
                />
                {fieldError("payment_reference")}
              </div>
              <div className="receipt-field">
                <label style={s.label}>Academic Session</label>
                <input
                  className={`receipt-input${formik.touched.academic_session && formik.errors.academic_session ? " error" : ""}`}
                  name="academic_session" type="text" placeholder="2025/2026"
                  value={formik.values.academic_session} onChange={formik.handleChange} onBlur={formik.handleBlur}
                />
                {fieldError("academic_session")}
              </div>
            </div>

            {/* Room preferences */}
            <div style={s.sectionLabel}>
              Room Preferences <span style={s.optionalTag}>Optional</span>
            </div>

            <div className="receipt-row">
              <div className="receipt-field">
                <label style={s.label}>Preferred Block</label>
                <select className="receipt-select" name="preferred_block" value={formik.values.preferred_block} onChange={formik.handleChange}>
                  <option value="">No preference</option>
                  {BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="receipt-field">
                <label style={s.label}>Preferred Room No.</label>
                <input className="receipt-input" name="preferred_room_number" type="text" placeholder="e.g. 101"
                  value={formik.values.preferred_room_number} onChange={formik.handleChange} />
              </div>
            </div>

            <button type="submit" className="receipt-submit-btn" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Uploading…" : "Upload Receipt →"}
            </button>
          </form>
        </div>

        {/* ── Receipts list ── */}
        <div className="receipt-card">
          <div style={s.cardTitle}>📋 My Receipts</div>

          {receiptsLoading ? (
            <div style={{ ...s.stateText, color: "#9E9B96" }}>Loading receipts…</div>
          ) : receipts.length === 0 ? (
            <div style={{ ...s.stateText, color: "#C4C1BB", fontStyle: "italic" }}>No receipts uploaded yet.</div>
          ) : (
            <div className="receipts-list">
              {receipts.map((r) => <ReceiptListItem key={r.id} receipt={r} />)}
            </div>
          )}
        </div>

      </div>
    </>
  );
}