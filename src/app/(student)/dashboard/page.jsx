"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatCard, ProgressBar, ActivityFeed } from "@/components/dashboard/DashboardShell";
import { STUDENT_ROUTES } from "@/app/(student)/_constants/StudentNav";
import "./page.css";
import { studentDashboard } from "@/api/auth";
// import Spinner from "@/components/ui/Spinner";

//  DEV_MODE: flip to false when backend is ready ─
const DEV_MODE = false;

const MOCK_DATA = {
  student: {
    matric_number: "22/0336",
    full_name: "Salam Oluwatunmise",
    email: "salam@university.edu.ng",
    level: "400",
    department: "Software Engineering",
    gender: "Male",
  },
  receipt:    { status: "verified", uploaded_at: "2026-04-23T10:00:00Z", amount: 50000 },
  allocation: { room: "Block A - 101", allocated_at: "2026-04-23T12:00:00Z", academic_session: "2025/2026" },
  qr_code:    { generated: true, generated_at: "2026-04-23T12:05:00Z" },
  clearance:  { cleared: 3, total: 7, percentage: 42, complete: false },
  academic_session: "2025/2026",
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

function buildActivity({ receipt, allocation, qr_code }) {
  const items = [];
  if (receipt?.uploaded_at)
    items.push({ icon: "📄", label: `Receipt ${receipt.status}`, time: timeAgo(receipt.uploaded_at) });
  if (allocation?.allocated_at)
    items.push({ icon: "🏠", label: `Room allocated — ${allocation.room}`, time: timeAgo(allocation.allocated_at) });
  if (qr_code?.generated_at)
    items.push({ icon: "📱", label: "QR code generated", time: timeAgo(qr_code.generated_at) });
  return items;
}

function buildNotifications({ receipt, allocation, qr_code, clearance }) {
  const notes = [];
  if (qr_code?.generated && !clearance?.complete)
    notes.push({ icon: "📱", label: "Your QR code is ready. Download it to proceed with clearance." });
  if (clearance && !clearance.complete)
    notes.push({ icon: "🔔", label: `${clearance.total - clearance.cleared} departments remaining for clearance.` });
  if (receipt?.status === "verified" && !allocation?.room)
    notes.push({ icon: "⏳", label: "Room allocation is in progress. Check back soon." });
  if (clearance?.complete)
    notes.push({ icon: "✅", label: "Clearance complete! You may now move into your room." });
  return notes;
}

//  StatusBanner ─
// Variant colours live in page.css (.status-banner.warning/danger/etc.)
// Only the "Complete" badge needs a one-off inline override.
function StatusBanner({ data }) {
  const router = useRouter();
  const { receipt, allocation, qr_code, clearance } = data;
  const go = (id) => router.push(STUDENT_ROUTES[id]);

  // Shared left section — avoids repeating the same markup 6 times
  const Left = ({ icon, title, desc }) => (
    <div className="status-banner-left">
      <span className="status-banner-icon">{icon}</span>
      <div>
        <div className="status-banner-title">{title}</div>
        <div className="status-banner-desc">{desc}</div>
      </div>
    </div>
  );

  if (!receipt || receipt.status === "pending") return (
    <div className="status-banner warning">
      <Left icon="📄" title="Receipt Required" desc="Upload your hostel fee payment receipt to begin the allocation process." />
      <button className="status-action-btn dark" onClick={() => go("receipt")}>Upload Receipt →</button>
    </div>
  );

  if (receipt.status === "rejected") return (
    <div className="status-banner danger">
      <Left icon="❌" title="Receipt Rejected" desc="Your receipt was rejected. Please upload a valid payment receipt to continue." />
      <button className="status-action-btn danger" onClick={() => go("receipt")}>Upload New Receipt →</button>
    </div>
  );

  if (receipt.status === "verified" && !allocation?.room) return (
    <div className="status-banner info">
      <Left icon="⏳" title="Receipt Verified — Awaiting Allocation" desc="Your receipt has been verified. Room allocation is processed on a first-come, first-served basis." />
      <div className="status-banner-badge">Pending</div>
    </div>
  );

  if (allocation?.room && !qr_code?.generated) return (
    <div className="status-banner success">
      <Left icon="🏠" title={`Room Allocated — ${allocation.room}`} desc="Generate your QR code to begin the departmental clearance process." />
      <button className="status-action-btn green" onClick={() => go("qrcode")}>Generate QR Code →</button>
    </div>
  );

  if (qr_code?.generated && !clearance?.complete) return (
    <div className="status-banner purple">
      <Left icon="📱" title={`QR Code Ready — ${clearance?.total - clearance?.cleared} departments remaining`} desc="Download your QR code and visit each department to complete clearance." />
      <button className="status-action-btn purple" onClick={() => go("qrcode")}>Download QR Code →</button>
    </div>
  );

  if (clearance?.complete) return (
    <div className="status-banner complete">
      <Left icon="🎉" title="All Clear — You're ready to move in!" desc={`All ${clearance.total} departments have cleared you. Welcome to ${allocation?.room}.`} />
      {/* inline override only for the green complete badge — not worth a new CSS class */}
      <div className="status-banner-badge" style={{ background: "#2D6A4F", color: "#fff" }}>Complete</div>
    </div>
  );

  return null;
}

//  Page 
export default function StudentDashboard() {
  const router = useRouter();
  const [dashData, setDashData] = useState(DEV_MODE ? MOCK_DATA : null);
  const [loading, setLoading]   = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) return;

   studentDashboard()
  .then((res) => setDashData(res.data.data))
  .catch((err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      router.replace("/login");
    } else {
      toast.error("Failed to load dashboard. Please refresh.");
    }
  })
  .finally(() => setLoading(false));
  }, [router]);

  if (loading || !dashData) return null;

  const { student, receipt, allocation, qr_code, clearance, academic_session } = dashData;

  return (
    <>
      <div className="student-session-badge">
        <span>📅</span>
        <span>Academic Session: {academic_session}</span>
      </div>

      <div className="student-greeting">
        <h1>Good day, {student.full_name.split(" ")[0]} 👋</h1>
        <p>{student.department} · {student.level} Level · {student.gender}</p>
      </div>

      <StatusBanner data={dashData} />

      <div className="student-card-grid">

        <StatCard title="Receipt" icon="📄" accent="#D4A017" onClick={() => router.push(STUDENT_ROUTES.receipt)}>
          {!receipt ? (
            <span className="stat-card-empty">No receipt uploaded</span>
          ) : (
            <>
              <span className={`stat-card-chip ${receipt.status}`}>
                {{ verified: "✅", pending: "⏳", rejected: "❌" }[receipt.status]} {receipt.status}
              </span>
              {receipt.amount && <div className="stat-card-amount">{formatCurrency(receipt.amount)}</div>}
              {receipt.uploaded_at && <div className="stat-card-meta">Uploaded {timeAgo(receipt.uploaded_at)}</div>}
            </>
          )}
        </StatCard>

        <StatCard title="Allocation" icon="🏠" accent="#185FA5" onClick={() => router.push(STUDENT_ROUTES.room)}>
          {!allocation?.room ? (
            <span className="stat-card-empty">Not yet allocated</span>
          ) : (
            <>
              <div className="stat-card-big-value">{allocation.room}</div>
              <div className="stat-card-meta">Session: {allocation.academic_session}</div>
              {allocation.allocated_at && <div className="stat-card-meta">Allocated {timeAgo(allocation.allocated_at)}</div>}
            </>
          )}
        </StatCard>

        <StatCard title="Clearance" icon="✅" accent="#2D6A4F" onClick={() => router.push(STUDENT_ROUTES.clearance)}>
          {!clearance ? (
            <span className="stat-card-empty">No clearance data</span>
          ) : (
            <>
              <div className="stat-card-big-value">
                {clearance.cleared}<span className="stat-card-big-value-sub">/{clearance.total}</span>
              </div>
              <ProgressBar percentage={clearance.percentage} color="#2D6A4F" />
              <div className="stat-card-meta">
                {clearance.percentage}% · {clearance.complete ? "✅ All cleared" : `${clearance.total - clearance.cleared} remaining`}
              </div>
            </>
          )}
        </StatCard>

        <StatCard title="QR Code" icon="📱" accent="#6B4EFF" onClick={() => router.push(STUDENT_ROUTES.qrcode)}>
          {!qr_code?.generated ? (
            <span className="stat-card-empty">Not yet generated</span>
          ) : (
            <>
              <span className="stat-card-chip generated">✓ Generated</span>
              {qr_code.generated_at && <div className="stat-card-meta">Generated {timeAgo(qr_code.generated_at)}</div>}
            </>
          )}
        </StatCard>

      </div>

      <div className="student-bottom-grid">
        <ActivityFeed title="Recent Activity" headerIcon="📝" items={buildActivity(dashData)}      emptyText="No activity yet." />
        <ActivityFeed title="Notifications"   headerIcon="🔔" items={buildNotifications(dashData)} emptyText="No new notifications." />
      </div>
    </>
  );
}