"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { STUDENT_ROUTES } from "@/app/(student)/_constants/StudentNav";
import "./page.css";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

//Mock data
const MOCK_ALLOCATED = {
  allocation: {
    id: 1,
    allocated_at: "2026-04-23T12:00:00Z",
    allocation_method: "FCFS",
    academic_session: "2025/2026",
    status: "active",
  },
  room: {
    block: "Block A",
    room_number: "101",
    full_name: "Block A - 101",
    capacity: 6,
    current_occupants: 2,
    gender: "Male",
  },
  qr_code_generated: true,
};

//  Helpers 
function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

//  Allocated view ──
function AllocatedView({ data, onGoToQR }) {
  const { allocation, room, qr_code_generated } = data;

  return (
    <div className="room-layout">

      <div className="room-hero">
        <div>
          <div className="room-hero-label">Your Room</div>
          <div className="room-hero-name">{room.full_name}</div>
        </div>

        <div className="room-hero-divider" />

        <div className="room-hero-stats">
          <div className="room-hero-stat">
            <span className="room-hero-stat-icon">👤</span>
            Occupants: <span className="room-hero-stat-value">{room.current_occupants}/{room.capacity}</span>
          </div>
          <div className="room-hero-stat">
            <span className="room-hero-stat-icon">📅</span>
            Session: <span className="room-hero-stat-value">{allocation.academic_session}</span>
          </div>
          <div className="room-hero-stat">
            <span className="room-hero-stat-icon">⏰</span>
            Allocated: <span className="room-hero-stat-value">{formatDate(allocation.allocated_at)}</span>
          </div>
          <div className="room-hero-stat">
            <span className="room-hero-stat-icon">🎯</span>
            Method: <span className="room-hero-stat-value">{allocation.allocation_method}</span>
          </div>
        </div>

        <div className="room-hero-badge">✅ {allocation.status}</div>
      </div>

      <div className="room-card">
        <div>
          <div className="room-card-section-title">📋 Room Details</div>
          <div className="room-details-list">
            {[
              ["Gender",      room.gender],
              ["Capacity",    `${room.capacity} students`],
              ["Block",       room.block],
              ["Room Number", room.room_number],
            ].map(([key, val]) => (
              <div key={key} className="room-details-row">
                <span className="room-details-key">{key}</span>
                <span className="room-details-value">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="room-card-section-title">✅ Next Steps</div>
          <div className="room-next-steps">
            {["Download your QR code", "Visit all 7 departments for clearance", "Get fully cleared to move in"].map((step, i) => (
              <div key={i} className="room-step">
                <div className="room-step-num">{i + 1}</div>
                {step}
              </div>
            ))}
          </div>
        </div>

        <button className="room-qr-btn" onClick={onGoToQR}>
          {qr_code_generated ? "Download QR Code →" : "Generate QR Code →"}
        </button>
      </div>

    </div>
  );
}

//  Not allocated view ─
function NotAllocatedView() {
  return (
    <div className="room-pending-wrap">
      <div className="room-pending-card">
        <div className="room-pending-header">
          <span className="room-pending-icon">⏳</span>
          <div>
            <p className="room-pending-title">Waiting for Allocation…</p>
            <p className="room-pending-desc">Your receipt has been verified. Admin will run allocation soon.</p>
          </div>
        </div>
        <div className="room-pending-divider" />
        <div className="room-status-list">
          <div className="room-status-row">✅ Receipt Verified</div>
          <div className="room-status-row">⏳ Allocation Pending</div>
          <div className="room-status-row">❌ QR Code Not Available</div>
        </div>
        <div className="room-pending-footer">
          🔔 You will be notified once a room has been allocated to you.
        </div>
      </div>
    </div>
  );
}

//  Page 
export default function RoomPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // axios
    //   .get(`${BASE_URL}/api/student/my-allocation`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   })
    //   .then((res) => setData(res.data.data))
    //   .catch((err) => {
    //     if (err?.response?.status !== 404)
    //       toast.error("Could not load allocation. Please refresh.");
    //   })
    //   .finally(() => setLoading(false));

    // ── DEV mock ──
    setData(MOCK_ALLOCATED);
    setLoading(false);
  }, []);

  if (loading) return <div className="room-loading">Loading your room…</div>;

  return (
    <>
      <h1 className="room-page-title">
        {data ? "🏠 Your Room Allocation" : "🏠 Room Allocation Status"}
      </h1>
      <p className="room-page-sub">
        {data ? `${data.room.full_name} · ${data.allocation.academic_session}` : "No room allocated yet."}
      </p>

      {data
        ? <AllocatedView data={data} onGoToQR={() => router.push(STUDENT_ROUTES.qrcode)} />
        : <NotAllocatedView />
      }
    </>
  );
}