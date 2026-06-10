"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./DashboardShell.css";


export default function DashboardShell({ navItems, activeNav, onNavChange, user, dropdownLinks = [], children }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully.");
    router.replace("/login");
  };

  return (
    <div className="dash-root">
      <header className="dash-header">
        <div className="dash-header-inner">

          <div className="dash-brand">
            <div className="dash-brand-mark">A</div>
            <span className="dash-brand-name">ALLOCATR</span>
          </div>

          <nav className="dash-nav">
            {navItems.map(({ id, label, icon }) => (
              <button
                key={id}
                className={`dash-nav-btn${activeNav === id ? " active" : ""}`}
                onClick={() => onNavChange(id)}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="dash-header-right">
            <div className="dash-profile-wrap">
              <button className="dash-profile-btn" onClick={() => setProfileOpen((o) => !o)}>
                <div className="dash-avatar">{user?.full_name?.[0] ?? "?"}</div>
                <div className="dash-profile-info">
                  <span className="dash-profile-name">{user?.full_name}</span>
                  <span className="dash-profile-sub">{user?.sub_label}</span>
                </div>
                <span className="dash-chevron">{profileOpen ? "▲" : "▼"}</span>
              </button>

              {profileOpen && (
                <div className="dash-dropdown">
                  <div className="dash-drop-header">
                    <div className="dash-drop-name">{user?.full_name}</div>
                    {user?.meta_lines?.map((line, i) => (
                      <div key={i} className="dash-drop-meta">{line}</div>
                    ))}
                  </div>
                  {dropdownLinks.length > 0 && (
                    <>
                      <div className="dash-drop-divider" />
                      {dropdownLinks.map(({ label, icon, onClick }, i) => (
                        <button key={i} className="dash-drop-item" onClick={() => { onClick(); setProfileOpen(false); }}>
                          {icon} {label}
                        </button>
                      ))}
                    </>
                  )}
                  <div className="dash-drop-divider" />
                  <button className="dash-drop-item danger" onClick={handleLogout}>↩ Logout</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      <main className="dash-main">{children}</main>
    </div>
  );
}

// ─── DashboardLoader ──────────────────────────────────────────────────────────
// Full-page loading state. Import and use in any dashboard page.

export function DashboardLoader({ text = "Loading…" }) {
  return (
    <div className="dash-load-wrap">
      <div className="dash-spinner" />
      <p className="dash-load-text">{text}</p>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Generic metric card. Pass accent color for the top border.
//
// Props:
//   title:   string
//   icon:    emoji string
//   accent:  CSS color string
//   onClick: optional

export function StatCard({ title, icon, accent, onClick, children }) {
  return (
    <div
      className={`stat-card${onClick ? " clickable" : ""}`}
      style={{ borderTop: `3px solid ${accent}` }}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
// Props:
//   percentage: number (0–100)
//   color:      CSS color string

export function ProgressBar({ percentage, color = "#2D6A4F" }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${percentage}%`, background: color }} />
    </div>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
// Reusable panel for both activity and notifications.
//
// Props:
//   title:      string
//   headerIcon: emoji string
//   items:      [{ icon, label, time? }]
//   emptyText:  string

export function ActivityFeed({ title, headerIcon, items = [], emptyText = "Nothing here yet." }) {
  return (
    <div className="feed-panel">
      <div className="feed-header">
        <span className="feed-header-icon">{headerIcon}</span>
        <span className="feed-header-title">{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="feed-empty">{emptyText}</p>
      ) : (
        <ul className="feed-list">
          {items.map((item, i) => (
            <li key={i} className="feed-item">
              <span className="feed-item-icon">{item.icon}</span>
              <div className="feed-item-body">
                <span className="feed-item-label">{item.label}</span>
                {item.time && <span className="feed-item-time">{item.time}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}