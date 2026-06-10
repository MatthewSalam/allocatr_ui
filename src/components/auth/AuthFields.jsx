"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Picture from "@/components/auth/Picture.png";

export const authStyles = {
  page: {
    minHeight: "100vh",
    background: "#F7F6F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
  background: "#FFFFFF",
  borderRadius: "16px",
  borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E5E3DC",
  padding: "2.5rem",
  width: "100%", maxWidth: "520px",
  boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.75rem" },
  logoIcon: {
    width: "36px", height: "36px", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
  },
  logoText: { fontFamily: "'Georgia', serif", fontSize: "17px", color: "#1a1a1a" },
  heading: { fontFamily: "'Georgia', serif", fontSize: "26px", fontWeight: 400, color: "#1a1a1a", margin: "0 0 6px" },
  subheading: { fontSize: "14px", color: "#6B6963", margin: "0 0 1.75rem" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "13px", fontWeight: 500, color: "#6B6963" },
  input: {
      fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
      borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E0DED7",
      background: "#FFFFFF", color: "#1a1a1a",
      borderRadius: "8px", padding: "9px 12px", outline: "none",
      width: "100%", boxSizing: "border-box", transition: "border-color 0.15s",
    },
  inputError: { borderColor: "#E24B4A" },
  select: { appearance: "none", cursor: "pointer" },
  passWrap: { position: "relative", display: "flex", alignItems: "center" },
  eyeBtn: {
    position: "absolute", right: "10px", background: "none", border: "none",
    cursor: "pointer", padding: 0, fontSize: "16px", lineHeight: 1, transition: "color 0.15s",
  },
  errorMsg: { fontSize: "12px", color: "#E24B4A", marginTop: "2px" },
  infoBox: {
    fontSize: "13px", color: "#6B6963", background: "#F7F6F2",
    borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E0DED7",
    borderRadius: "8px", padding: "10px 14px", lineHeight: 1.6,
  },
  submitBtn: {
    width: "100%", padding: "11px", background: "#1a1a1a", color: "#FFFFFF",
    border: "none", borderRadius: "8px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", fontWeight: 500, cursor: "pointer", marginTop: "4px",
    transition: "opacity 0.15s", letterSpacing: "0.01em",
  },
  footerText: { textAlign: "center", fontSize: "13px", color: "#6B6963", marginTop: "1.25rem" },
  footerLink: { color: "#1a1a1a", fontWeight: 500, textDecoration: "none" },
  roleBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px",
    fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px",
  },
  roleTabs: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "1.75rem" },
  roleTab: {
      borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E0DED7",
      background: "transparent", borderRadius: "10px",
      padding: "10px 8px", cursor: "pointer", display: "flex", flexDirection: "column",
      alignItems: "center", gap: "5px", transition: "all 0.15s ease",
    },
    roleTabActive: {
      borderWidth: "1.5px", borderStyle: "solid", borderColor: "#1a1a1a",
      background: "#F7F6F2",
    },
  roleTabIcon: { fontSize: "20px" },
  roleTabLabel: { fontSize: "12px", color: "#4A4845", fontWeight: 500 },
};

// ─── AuthLogo ─────────────────────────────────────────────────────────────────
export function AuthLogo() {
  return (
    <div style={authStyles.logo}>
      <div style={authStyles.logoIcon}>
        <Image
            src={Picture}
            alt="Logo"
            width={120}
            height={120}
            /></div>
      <span style={authStyles.logoText}>Adeleke <em>University</em></span>
    </div>
  );
}

// ─── RoleTabs ─────────────────────────────────────────────────────────────────
export function RoleTabs({ roles, activeRole, onSwitch }) {
  return (
    <div style={authStyles.roleTabs} role="tablist">
      {roles.map(({ id, label, icon }) => (
        <button
          key={id} type="button" role="tab" aria-selected={activeRole === id}
          onClick={() => onSwitch(id)}
          style={{ ...authStyles.roleTab, ...(activeRole === id ? authStyles.roleTabActive : {}) }}
        >
          <span style={authStyles.roleTabIcon}>{icon}</span>
          <span style={authStyles.roleTabLabel}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── InputField ───────────────────────────────────────────────────────────────
export function InputField({ label, id, formik, type = "text", placeholder }) {
  const hasError = formik.touched[id] && formik.errors[id];
  return (
    <div style={authStyles.field}>
      <label htmlFor={id} style={authStyles.label}>{label}</label>
      <input
        id={id} name={id} type={type} placeholder={placeholder}
        value={formik.values[id]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        style={{ ...authStyles.input, ...(hasError ? authStyles.inputError : {}) }}
      />
      {hasError && <span style={authStyles.errorMsg}>{formik.errors[id]}</span>}
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────

export function SelectField({ label, id, formik, options, placeholder }) {
  const hasError = formik.touched[id] && formik.errors[id];
  return (
    <div style={authStyles.field}>
      <label htmlFor={id} style={authStyles.label}>{label}</label>
      <select
        id={id} name={id}
        value={formik.values[id]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        style={{ ...authStyles.input, ...authStyles.select, ...(hasError ? authStyles.inputError : {}) }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {hasError && <span style={authStyles.errorMsg}>{formik.errors[id]}</span>}
    </div>
  );
}

// ─── PasswordField ────────────────────────────────────────────────────────────
// Reveals password for 2 seconds then auto-hides. Click again to hide early.

export function PasswordField({ label, id, formik, placeholder }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const hasError = formik.touched[id] && formik.errors[id];

  const handleToggle = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!visible) {
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 2000);
    } else {
      setVisible(false);
    }
  };

  return (
    <div style={authStyles.field}>
      <label htmlFor={id} style={authStyles.label}>{label}</label>
      <div style={authStyles.passWrap}>
        <input
          id={id} name={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={formik.values[id]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          style={{ ...authStyles.input, paddingRight: "42px", ...(hasError ? authStyles.inputError : {}) }}
        />
        <button
          type="button" onClick={handleToggle}
          style={{ ...authStyles.eyeBtn, color: visible ? "#1a1a1a" : "#9E9B96" }}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Click to hide" : "Reveals for 2 seconds"}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
      {hasError && <span style={authStyles.errorMsg}>{formik.errors[id]}</span>}
    </div>
  );
}

// ─── SubmitButton ─────────────────────────────────────────────────────────────

export function SubmitButton({ isSubmitting, label, loadingLabel }) {
  return (
    <button
      type="submit" disabled={isSubmitting}
      style={{ ...authStyles.submitBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}