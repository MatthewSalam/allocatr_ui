"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardShell, { DashboardLoader } from "@/components/dashboard/DashboardShell";
import { STUDENT_NAV_ITEMS, STUDENT_ROUTES } from "./_constants/StudentNav";

const DEV_MODE = false;

const DEV_USER = {
  full_name:      "Salam Oluwatunmise",
  matric_number:  "22/0336",
  email:          "salam@university.edu.ng",
  department:     "Software Engineering",
  level:          "400",
};

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Derive active nav from current URL
  const activeNav = Object.entries(STUDENT_ROUTES).find(
    ([, route]) => pathname.startsWith(route)
  )?.[0] ?? "dashboard";

  useEffect(() => {
    if (DEV_MODE) {
      setUser(DEV_USER);
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setChecking(false);
  }, [router]);

  if (checking) return <DashboardLoader text="Loading…" />;

  return (
    <DashboardShell
      navItems={STUDENT_NAV_ITEMS}
      activeNav={activeNav}
      onNavChange={(id) => router.push(STUDENT_ROUTES[id])}
      user={{
        full_name:  user?.full_name ?? "Student",
        sub_label:  user?.matric_number ?? user?.email ?? "",
        meta_lines: [
          user?.department ? `${user.department} · ${user.level}L` : "",
          user?.email ?? "",
        ],
      }}
      dropdownLinks={[
        { label: "Dashboard", icon: "⊞", onClick: () => router.push(STUDENT_ROUTES.dashboard) },
        { label: "Receipt",   icon: "📄", onClick: () => router.push(STUDENT_ROUTES.receipt) },
        // { label: "My Room",   icon: "🏠", onClick: () => router.push(STUDENT_ROUTES.room) },
        { label: "QR Code",   icon: "📱", onClick: () => router.push(STUDENT_ROUTES.qrcode) },
      ]}
    >
      {children}
    </DashboardShell>
  );
}