// src/app/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";


const DEPARTMENTS = ["Bursary", "Faculty", "Library", "Sports", "Hostel", "ICT", "Student Affairs"];

const STEPS = [
  {
    title: "Upload your receipt",
    body: "Submit your hostel fee receipt and your preferred block and room. An admin verifies it, or tells you exactly what to fix.",
    color: "#D4A017",
  },
  {
    title: "Get your room",
    body: "Rooms are given out first-come, first-served, in the order receipts were uploaded.",
    color: "#185FA5",
  },
  {
    title: "Download your QR code",
    body: "Your signed QR code is tied to you and your room. Save it as a PNG or PDF and keep it on your phone.",
    color: "#6B4EFF",
  },
  {
    title: "Clear every department",
    body: "Show the QR code at each of the 7 departments. Officers scan it and your progress updates on your dashboard.",
    color: "#2D6A4F",
  },
];

const ROLES = [
  {
    title: "Students",
    body: "Upload your receipt, see your allocated room, download your QR code and track your clearance as departments sign off.",
  },
  {
    title: "Department officers",
    body: "Scan a student's QR code with your phone camera, or paste the code. Add a note and the clearance is recorded instantly.",
  },
  {
    title: "Administrators",
    body: "Verify receipts, manage rooms, run the allocation and export the full allocation list as CSV or PDF.",
  },
];

const GUARANTEES = [
  { title: "First-come, first-served", body: "Allocation follows receipt upload time. Nobody jumps the queue." },
  { title: "Signed QR codes", body: "Every code carries a signature, so a tampered code is detected when it is scanned." },
  { title: "Every scan is logged", body: "Each clearance records which officer cleared the student, and when." },
];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B4EFF]";

// ─── Decorative QR ────────────────────────────────────────────────────────────

const QR_SIZE = 11;

function qrFilled(r, c) {
  const corner = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
  if (corner) return true;
  return (r * 5 + c * 7 + r * c) % 3 !== 0;
}

function QrMark() {
  const cells = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      cells.push(
        <span
          key={`${r}-${c}`}
          className={qrFilled(r, c) ? "bg-gray-900 dark:bg-gray-100" : "bg-transparent"}
        />
      );
    }
  }
  return (
    <div
      aria-hidden="true"
      className="grid h-24 w-24 shrink-0 gap-px rounded-md border border-[#e8e5df] bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)` }}
    >
      {cells}
    </div>
  );
}

// ─── Hero: interactive clearance slip ─────────────────────────────────────────

function ClearanceSlip() {
  const [cleared, setCleared] = useState(() => new Set(["Bursary", "Faculty", "Library"]));

  const toggle = (dept) =>
    setCleared((prev) => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });

  const count = cleared.size;
  const total = DEPARTMENTS.length;
  const pct   = Math.round((count / total) * 100);
  const done  = count === total;

  return (
    <div
      className="w-full max-w-md rounded-2xl border border-[#e8e5df] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      style={{ borderTop: "4px solid #6B4EFF" }}
    >
      {/* Student + QR */}
      <div className="flex items-center gap-4">
        <QrMark />
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">John Doe</p>
          <p className="text-sm font-semibold text-[#6B4EFF]">22/0336</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Room: Block A - 101</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {count} of {total} departments cleared
          </span>
          <span className="text-gray-500 dark:text-gray-400">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f0ede8] dark:bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: done ? "#16a34a" : "#2D6A4F" }}
          />
        </div>
      </div>

      {/* Departments */}
      <ul className="mt-4 flex flex-col gap-0.5">
        {DEPARTMENTS.map((dept) => {
          const isDone = cleared.has(dept);
          return (
            <li key={dept}>
              <button
                type="button"
                aria-pressed={isDone}
                onClick={() => toggle(dept)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-[#f5f3ef] dark:hover:bg-gray-800 ${FOCUS}`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      isDone
                        ? "bg-[#2D6A4F] text-white"
                        : "border border-gray-300 text-transparent dark:border-gray-600"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={isDone ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>
                    {dept}
                  </span>
                </span>
                <span className={`text-xs ${isDone ? "text-[#2D6A4F] dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {isDone ? "Cleared" : "Pending"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Tap a department to see how clearance looks on your dashboard.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f0ede8] font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">

      {/* ── Nav ── */}
      <header className="border-b border-[#e8e5df] dark:border-gray-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className={`flex items-center gap-2.5 no-underline ${FOCUS} rounded-md`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-sm font-extrabold text-white dark:bg-white dark:text-gray-900">
              A
            </span>
            <span className="text-sm font-extrabold tracking-[0.08em] text-gray-900 dark:text-gray-100">ALLOCATR</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#how"
              className={`hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline hover:bg-[#e8e5df] sm:block dark:text-gray-300 dark:hover:bg-gray-800 ${FOCUS}`}
            >
              How it works
            </a>
            <a
              href="#roles"
              className={`hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline hover:bg-[#e8e5df] sm:block dark:text-gray-300 dark:hover:bg-gray-800 ${FOCUS}`}
            >
              Who it's for
            </a>
            <ThemeToggle />
            <Link
              href="/login"
              className={`rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 ${FOCUS}`}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <h1 className="font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Get your hostel room and clear every department with one QR code.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Upload your payment receipt, get a room allocated first-come, first-served, then walk through
              all 7 departments with a single code on your phone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className={`rounded-xl bg-[#6B4EFF] px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-[#5a3fe6] ${FOCUS}`}
              >
                Sign in to your account
              </Link>
              <a
                href="#how"
                className={`rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-[#e8e5df] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 ${FOCUS}`}
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ClearanceSlip />
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16">
          <h2 className="max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
            Four steps from payment to move-in
          </h2>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="pt-4" style={{ borderTop: `4px solid ${step.color}` }}>
                <span className="text-sm font-bold" style={{ color: step.color }}>
                  Step {i + 1}
                </span>
                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Roles ── */}
        <section id="roles" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16">
          <h2 className="max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
            One system, three roles
          </h2>

          <div className="mt-10 grid divide-y divide-[#e8e5df] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {ROLES.map((role) => (
              <div key={role.title} className="p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{role.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{role.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Guarantees ── */}
        <section className="bg-gray-900 text-white dark:bg-black">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
              Built so nobody skips the queue or the process
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {GUARANTEES.map((g) => (
                <div key={g.title}>
                  <h3 className="text-base font-bold">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{g.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="mx-auto max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
            Your receipt is the first step. Start there.
          </h2>
          <Link
            href="/login"
            className={`mt-8 inline-block rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold text-white no-underline transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 ${FOCUS}`}
          >
            Sign in
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e8e5df] dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-extrabold tracking-[0.08em] text-gray-900 dark:text-gray-100">ALLOCATR</span>
          <span>Hostel allocation and QR-based clearance. &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}