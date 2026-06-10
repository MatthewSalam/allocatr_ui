"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studentQR, studentQRDownload } from "@/api/auth";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

//  DEV_MODE: flip to false when backend is ready ─
const DEV_MODE = false;

const MOCK_DATA = {
  qr_code:      "data:image/png;base64,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",
  qr_data:      "eyJzdHVkZW50X2lkIjoxfQ==|hmac-signature-here",
  generated_at: "2026-04-23T12:05:00Z",
  allocation:   { room: "Block A - 101", academic_session: "2025/2026" },
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QRCodePage() {
  const router = useRouter();
  const [data,    setData]    = useState(DEV_MODE ? MOCK_DATA : null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [errorState, setErrorState]= useState(null); // 'no_allocation' | 'error'
  const [dlState, setDlState] = useState(null);

  useEffect(() => {
    if (DEV_MODE) return;
 
    studentQR()
      .then((res) => setData(res.data.data))
      .catch((err) => {
        const status = err?.response?.status;
 
        if (status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
        } else if (status === 404) {
          setErrorState("no_allocation");
        } else {
          setErrorState("error");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDownload = (format) => {
    setDlState(format);
    studentQRDownload(format)
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        const a   = document.createElement("a");
        a.href     = url;
        a.download = `clearance-qr.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error(`Failed to download ${format.toUpperCase()}. Please try again.`))
      .finally(() => setDlState(null));
  };

  const handleEmail = () => {
    if (!data) return;
    const subject = encodeURIComponent("My Hostel Clearance QR Code");
    const body    = encodeURIComponent(
      `Hello,\n\nRoom: ${data.allocation?.room}\nSession: ${data.allocation?.academic_session}\n\nThank you.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) return <Spinner message="Loading your QR code…" />;

  if (errorState === "no_allocation") return (
    <div className="max-w-md mx-auto mt-12 flex flex-col items-center gap-5 text-center">
      <span className="text-5xl">🏠</span>
      <h2 className="text-xl font-extrabold text-gray-900">No Room Allocated Yet</h2>
      <p className="text-sm text-gray-500 leading-relaxed">
        Your QR code will be generated automatically once an administrator
        verifies your receipt and allocates a room to you.
      </p>
      <div className="w-full bg-white border border-[#e8e5df] rounded-xl p-4 flex flex-col gap-3 text-left">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-base">📄</span>
          <span className="text-gray-600">Upload your payment receipt if you haven&apos;t already</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-base">⏳</span>
          <span className="text-gray-600">Wait for admin to verify your receipt and run allocation</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-base">📱</span>
          <span className="text-gray-600">Your QR code will appear here once you&apos;re allocated</span>
        </div>
      </div>
      <div className="flex gap-3">
        <a
          href="/student/receipt"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl no-underline hover:bg-gray-800 transition-colors"
        >
          Go to Receipt →
        </a>
        <button
          className="px-5 py-2.5 bg-[#f0ede8] text-gray-700 text-sm font-semibold rounded-xl hover:bg-[#e8e5df] transition-colors font-sans"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
 
  if (errorState === "error") return (
    <div className="max-w-md mx-auto mt-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h2 className="text-xl font-extrabold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500">Failed to load your QR code. Please try again.</p>
      <button
        className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors font-sans"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  if (!data)   return null;

  const { qr_code, qr_data, generated_at, allocation } = data;

  return (
    <>
      {/* Session badge */}
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-4">
        <span>📅</span>
        <span>Academic Session: {allocation?.academic_session}</span>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-normal text-gray-900 mb-1">Your Clearance QR Code 📱</h1>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5 items-start">

        {/* LEFT — QR display card */}
        <div className="bg-white border border-gray-200 border-t-4 border-t-[#6B4EFF] rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm opacity-75">📱</span>
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase flex-1">QR CODE</span>
            <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">✓ Generated</span>
          </div>

          <div className="p-3.5 bg-white border-2 border-gray-200 rounded-xl shadow-md">
            <img
              src={qr_code}
              alt="Clearance QR Code"
              className="w-52 h-52 block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="text-center w-full">
            <p className="text-sm text-gray-600 mb-1">🏠 Room: <strong>{allocation?.room ?? "—"}</strong></p>
            <p className="text-sm text-gray-600 mb-1">📅 Session: <strong>{allocation?.academic_session ?? "—"}</strong></p>
            <p className="text-xs text-gray-400 mt-2">Generated {timeAgo(generated_at)}</p>
          </div>
        </div>

        {/* RIGHT — actions + instructions */}
        <div className="flex flex-col gap-4">

          {/* Download card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">📥 Download Options</div>
            <div className="flex gap-2.5 mb-2.5">
              <button
                onClick={() => handleDownload("png")}
                disabled={!!dlState}
                className="flex-1 bg-[#6B4EFF] text-white text-sm font-semibold py-2.5 px-4 rounded-lg disabled:opacity-55 hover:brightness-90 transition-all"
              >
                {dlState === "png" ? "Downloading…" : "⬇ Download PNG"}
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                disabled={!!dlState}
                className="flex-1 bg-gray-900 text-white text-sm font-semibold py-2.5 px-4 rounded-lg disabled:opacity-55 hover:brightness-90 transition-all"
              >
                {dlState === "pdf" ? "Downloading…" : "⬇ Download PDF"}
              </button>
            </div>
            <button
              onClick={handleEmail}
              disabled={!!dlState}
              className="w-full bg-transparent border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 px-4 rounded-lg disabled:opacity-55 hover:bg-gray-50 transition-all"
            >
              ✉ Share via Email
            </button>
          </div>

          {/* Instructions card */}
          <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-xl p-5">
            <div className="text-sm font-bold text-amber-800 mb-3">⚠️ Important Instructions</div>
            <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
              {[
                "Show this QR code to department officers during clearance",
                "Visit all 7 departments to complete your clearance",
                "Do not share your QR code with other students",
                "Keep it accessible on your phone at all times",
                "Each scan is logged — tampering is detected automatically",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-amber-900 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Signature */}
          {qr_data && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">🔐 QR Signature</div>
              <code className="block text-xs font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-gray-600 break-all">
                {qr_data.length > 52 ? qr_data.slice(0, 52) + "…" : qr_data}
              </code>
            </div>
          )}

        </div>
      </div>
    </>
  );
}