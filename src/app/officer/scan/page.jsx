"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { officerMe, scanQR } from "@/api/auth";
import "./page.css";

// DEV_MODE: flip to false when backend is ready
const DEV_MODE = false;

const DEV_OFFICER = {
  full_name:  "Mrs. Adekiigbe",
  department: "Bursary",
  email:      "bursary@university.edu.ng",
};

const MOCK_SCAN_SUCCESS = {
  student: {
    full_name:     "John Doe",
    matric_number: "22/0336",
    level:         "400",
    department:    "Software Engineering",
  },
  clearance: {
    department: "Bursary",
    cleared_at: new Date().toISOString(),
    cleared_by: "bursary@university.edu.ng",
    notes:      "All fees paid in full",
  },
  progress: {
    cleared_departments: 4,
    total_departments:   7,
    percentage:          57,
    complete:            false,
  },
};

//  Helpers ─
function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

//  Shared sub-components ─
function Row({ label, value, accent, small }) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-sm">
      <span className="text-gray-400 font-medium shrink-0">{label}</span>
      <span className={`font-semibold text-right ${accent ? "text-[#6B4EFF]" : "text-gray-900"} ${small ? "text-xs font-normal text-gray-500" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ResultCard({ children, accentColor }) {
  return (
    <div className="w-full bg-white border border-[#e8e5df] rounded-xl p-4" style={{ borderTop: `3px solid ${accentColor}` }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">{children}</div>;
}

function ProgressBar({ percentage, complete }) {
  return (
    <div className="h-2 bg-[#f0ede8] rounded-full overflow-hidden mt-1">
      <div className="scan-bar-fill h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: complete ? "#16a34a" : "#2D6A4F" }} />
    </div>
  );
}

//  Result screens 
function SuccessScreen({ data, onReset }) {
  const { student, clearance, progress } = data;
  return (
    <div className="scan-fadein max-w-lg mx-auto flex flex-col items-center gap-4">
      <div className="text-5xl mt-2">✅</div>
      <h2 className="text-xl font-extrabold text-gray-900">Clearance Successful!</h2>
      <ResultCard accentColor="#2D6A4F">
        <SectionLabel>Student Details</SectionLabel>
        <div className="flex flex-col gap-2">
          <Row label="Name"       value={student.full_name} />
          <Row label="Matric"     value={student.matric_number} accent />
          <Row label="Level"      value={`${student.level} Level`} />
          <Row label="Department" value={student.department} />
        </div>
      </ResultCard>
      <ResultCard accentColor="#2D6A4F">
        <SectionLabel>Clearance Info</SectionLabel>
        <div className="flex flex-col gap-2">
          <Row label="Department" value={clearance.department} />
          <Row label="Cleared at" value={formatDateTime(clearance.cleared_at)} />
          <Row label="Cleared by" value={clearance.cleared_by} small />
          {clearance.notes && <Row label="Notes" value={clearance.notes} />}
        </div>
      </ResultCard>
      <ResultCard accentColor="#2D6A4F">
        <SectionLabel>Overall Progress — {progress.cleared_departments}/{progress.total_departments} ({progress.percentage}%)</SectionLabel>
        <ProgressBar percentage={progress.percentage} complete={progress.complete} />
        {progress.complete && <p className="mt-2.5 text-sm font-semibold text-green-700 text-center">🎉 Student is fully cleared!</p>}
      </ResultCard>
      <button className="bg-gray-900 text-white text-sm font-bold px-8 py-3 rounded-xl mt-1 hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 transition-all" onClick={onReset}>
        📷 Scan Another QR
      </button>
    </div>
  );
}

function ErrorScreen({ error, onReset }) {
  const alreadyCleared = error?.response?.status === 409;
  const errData        = error?.response?.data;
  const accentColor    = alreadyCleared ? "#f59e0b" : "#dc2626";
  return (
    <div className="scan-fadein max-w-lg mx-auto flex flex-col items-center gap-4">
      <div className="text-5xl mt-2">{alreadyCleared ? "⚠️" : "❌"}</div>
      <h2 className="text-xl font-extrabold text-gray-900">{alreadyCleared ? "Already Cleared" : "Scan Failed"}</h2>
      {alreadyCleared && errData?.data ? (
        <>
          <p className="text-sm text-gray-500 text-center leading-relaxed max-w-sm">
            This student has already been cleared for <strong className="text-gray-800">{errData.data.clearance?.department}</strong> department.
          </p>
          <ResultCard accentColor={accentColor}>
            <div className="flex flex-col gap-2">
              <Row label="Student"            value={`${errData.data.student?.full_name} (${errData.data.student?.matric_number})`} />
              <Row label="Previously cleared" value={formatDateTime(errData.data.clearance?.cleared_at)} />
              <Row label="By"                 value={errData.data.clearance?.cleared_by} small />
            </div>
          </ResultCard>
        </>
      ) : (
        <p className="text-sm text-gray-500 text-center leading-relaxed max-w-sm">
          {errData?.message ?? error?.message ?? "An unexpected error occurred. Please try again."}
        </p>
      )}
      <button className="bg-gray-900 text-white text-sm font-bold px-8 py-3 rounded-xl mt-1 hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 transition-all" onClick={onReset}>
        📷 Scan Another QR
      </button>
    </div>
  );
}

//  Camera scanner 
function CameraScanner({ onDetected, active }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const [camError, setCamError] = useState(null);
  const [camReady, setCamReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => setCamReady(true));
        }
      })
      .catch(() => setCamError("Camera access denied or unavailable."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
      setCamReady(false);
    };
  }, [active]);

  useEffect(() => {
    if (!camReady || !active || !("BarcodeDetector" in window)) return;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const tick = async () => {
      if (videoRef.current?.readyState === 4) {
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d");
        canvas.width  = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        try {
          const [code] = await detector.detect(canvas);
          if (code?.rawValue) { onDetected(code.rawValue); return; }
        } catch { /* no code in frame */ }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camReady, active, onDetected]);

  return (
    <div className="scan-cam-wrap">
      {camError ? (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500 text-sm p-8 text-center">
          <span className="text-4xl">📷</span>
          <p>{camError}</p>
          <p className="text-xs text-gray-400">Use the manual paste field below instead.</p>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="scan-cam-video" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          {!camReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] text-gray-500 text-sm">
              <div className="scan-spinner" />
              <span>Starting camera…</span>
            </div>
          )}
          <div className="scan-cam-frame">
            <span className="scan-corner tl" /><span className="scan-corner tr" />
            <span className="scan-corner bl" /><span className="scan-corner br" />
          </div>
          {camReady && !("BarcodeDetector" in window) && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
              Auto-detect unavailable — use manual paste below
            </div>
          )}
        </>
      )}
    </div>
  );
}

//  Page 
export default function ScanPage() {
  const router = useRouter();
  const [screen,    setScreen]    = useState("scan");
  const [manualQR,  setManualQR]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [scanning,  setScanning]  = useState(false);
  const [result,    setResult]    = useState(null);
  const [scanError, setScanError] = useState(null);
  const [officer,   setOfficer]   = useState(DEV_MODE ? DEV_OFFICER : null);

  // ✅ officerMe replaces raw axios.get("/api/officer/me")
  useEffect(() => {
    if (DEV_MODE) return;
    officerMe()
      .then((res) => setOfficer(res.data.data))
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("officer_token");
          router.replace("/officer/login");
        }
      });
  }, [router]);

  // ✅ scanQR replaces raw axios.post("/api/clearance/scan", ...)
  const submitScan = useCallback(async (qrData) => {
    const trimmed = qrData?.trim();
    if (!trimmed) { toast.error("QR data is empty."); return; }
    if (scanning)  return;

    setScanning(true);

    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      setResult(MOCK_SCAN_SUCCESS);
      setScreen("success");
      setScanning(false);
      return;
    }

    try {
      const res = await scanQR({
        qr_data:    trimmed,
        department: officer?.department ?? "",
        notes:      notes.trim(),
      });
      setResult(res.data.data);
      setScreen("success");
    } catch (err) {
      setScanError(err);
      setScreen("error");
    } finally {
      setScanning(false);
    }
  }, [scanning, officer, notes]);

  const handleReset = () => {
    setScreen("scan"); setManualQR(""); setNotes(""); setResult(null); setScanError(null);
  };

  if (screen === "success") return <SuccessScreen data={result}     onReset={handleReset} />;
  if (screen === "error")   return <ErrorScreen   error={scanError} onReset={handleReset} />;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">📷 Scan Student QR Code</h1>
        {officer?.department && (
          <span className="text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-full tracking-wide">{officer.department}</span>
        )}
      </div>

      <div className="scan-page-grid grid gap-5 items-start">

        {/* Camera card */}
        <div className="bg-white border border-[#e8e5df] rounded-2xl p-5" style={{ borderTop: "4px solid #111" }}>
          <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Camera</div>
          <CameraScanner active={screen === "scan"} onDetected={submitScan} />
          <p className="text-xs text-gray-400 text-center mt-3">Position the student&apos;s QR code within the frame</p>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-3.5">

          <div className="bg-white border border-[#e8e5df] rounded-xl p-4">
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Or — Paste QR Data Manually</div>
            <textarea
              className="w-full border border-[#e0ddd7] rounded-lg px-3 py-2.5 text-sm font-mono text-gray-900 bg-[#fafaf9] resize-none outline-none focus:border-[#6B4EFF] focus:bg-white transition-colors disabled:opacity-50"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              placeholder="eyJzdHVkZW50X2lkIjoxfQ==|hmac-signature"
              rows={3}
              disabled={scanning}
            />
          </div>

          <div className="bg-white border border-[#e8e5df] rounded-xl p-4">
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Notes (Optional)</div>
            <textarea
              className="w-full border border-[#e0ddd7] rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-[#fafaf9] resize-none outline-none focus:border-[#6B4EFF] focus:bg-white transition-colors disabled:opacity-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. All fees paid in full"
              rows={2}
              disabled={scanning}
            />
          </div>

          {DEV_MODE && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
              <span>⚡</span>
              <span>DEV MODE — Submit any text to simulate a successful scan.</span>
            </div>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
            onClick={() => submitScan(manualQR)}
            disabled={scanning || !manualQR.trim()}
          >
            {scanning ? <><div className="scan-spinner" /> Scanning…</> : "▶ Submit QR"}
          </button>

          {officer?.department && (
            <p className="text-xs text-gray-400 text-center">
              Department auto-filled: <strong className="text-gray-600">{officer.department}</strong>
            </p>
          )}
        </div>

      </div>
    </>
  );
}