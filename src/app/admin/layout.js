"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import "./admin-layout.css";
import { adminMe } from "@/api/auth";

const DEV_MODE = false;

const DEV_ADMIN = {
  full_name: "Super Admin",
  email:     "admin@university.edu.ng",
};

const NAV_ITEMS = [
  { href: "/admin/dashboard",       label: "Dashboard",   icon: "⊞"  },
  { href: "/admin/receipts/pending",label: "Receipts",    icon: "📄"  },
  { href: "/admin/rooms",           label: "Rooms",       icon: "🏠"  },
  { href: "/admin/allocate",        label: "Allocate",    icon: "📈"  },
  { href: "/admin/allocations",     label: "Allocations", icon: "🗂️" },
];

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [admin,        setAdmin]        = useState(DEV_MODE ? DEV_ADMIN : null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (DEV_MODE) return;
    adminMe()
      .then((res) => setAdmin(res.data.data))
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("admin_token");
          router.replace("/login");
        }
      });
  }, [router]);


  const handleLogout = (keepToken = false) => {
    if (!DEV_MODE && !keepToken) localStorage.removeItem("admin_token");
    setAdmin(null);
    router.replace("/login");
  };

  const initials = admin?.full_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "—";

  return (
    <div className="min-h-screen bg-[#f0ede8] font-sans">

      {/* ── Top bar ── */}
      <header className="bg-gray-900 sticky top-0 z-[200]">
        <div className="max-w-[1200px] mx-auto px-6 h-[58px] flex items-center justify-between gap-5">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <span className="w-[30px] h-[30px] rounded-md bg-white text-gray-900 flex items-center justify-center font-extrabold text-sm shrink-0">
              A
            </span>
            <span className="font-extrabold text-sm tracking-[0.08em] text-white">ALLOCATR</span>
            <span className="text-[11px] font-semibold bg-red-900 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800 whitespace-nowrap">
              Admin
            </span>
            {DEV_MODE && (
              <span className="text-[10px] font-semibold bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-700 whitespace-nowrap">
                DEV
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 relative">

            {admin?.full_name && (
              <span className="text-[13px] text-[#aaa] hidden sm:block">
                {admin.full_name}
              </span>
            )}

            {/* Profile trigger */}
            <div
              className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-[#222] transition-colors"
              onClick={() => setDropdownOpen((p) => !p)}
            >
              <div className="w-[30px] h-[30px] rounded-full bg-red-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <span className="text-[10px] text-[#888]">{dropdownOpen ? "▴" : "▾"}</span>
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-[198]" onClick={() => setDropdownOpen(false)} />
                <div className="admin-dropdown">
                  <div className="px-4 pt-3.5 pb-2.5">
                    <p className="text-[13px] font-bold text-gray-900 mb-0.5">{admin?.full_name}</p>
                    <p className="text-[11px] text-gray-400">{admin?.email}</p>
                  </div>
                  <div className="h-px bg-[#f0ede8]" />
                  {/* ✅ Full logout from dropdown */}
                  <button
                    className="w-full px-4 py-2.5 text-[13px] font-medium text-red-600 bg-transparent border-none cursor-pointer text-left hover:bg-red-50 transition-colors font-sans"
                    onClick={() => handleLogout(false)}
                  >
                    🚪 Logout
                  </button>
                  {/* ✅ Switch account — keeps token so register-admin page can use it */}
                  <button
                    className="w-full px-4 py-2.5 text-[13px] font-medium text-gray-500 bg-transparent border-none cursor-pointer text-left hover:bg-gray-50 transition-colors font-sans"
                    onClick={() => handleLogout(true)}
                  >
                    🔄 Register another admin
                  </button>
                </div>
              </>
            )}

            <ThemeToggle />
            {/* ✅ Standalone logout button — full logout */}
            <button
              className="text-xs font-semibold text-[#aaa] bg-transparent border border-[#333] rounded-md px-3 py-1.5 cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600 transition-all font-sans"
              onClick={() => handleLogout(false)}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Sub-nav ── */}
      <nav className="bg-white border-b border-[#e8e5df] sticky top-[58px] z-[100]">
        <div className="max-w-[1200px] mx-auto px-6 flex gap-0.5 h-[46px] items-center">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] no-underline transition-all
                  ${active
                    ? "bg-gray-900 text-white font-semibold"
                    : "font-medium text-[#555] hover:bg-[#f5f3ef] hover:text-gray-900"
                  }`}
              >
                <span className="text-[13px] opacity-80">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
        {children}
      </main>
    </div>
  );
}