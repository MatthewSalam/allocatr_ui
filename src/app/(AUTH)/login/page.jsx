"use client";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthLogo, RoleTabs, InputField, PasswordField, SubmitButton, authStyles,} from "@/components/auth/AuthFields";
import { studentLogin, adminLogin } from "@/api/auth";

//  Constants 
const ROLES = [
  { id: "student", label: "Student", icon: "🎓" },
  { id: "admin",   label: "Admin",   icon: "🛡️" },
  { id: "officer", label: "Officer", icon: "🪪" },
];

const ROLE_BADGE_STYLE = {
  student: { background: "#EAF3DE", color: "#3B6D11" },
  admin:   { background: "#FAEEDA", color: "#854F0B" },
  officer: { background: "#E6F1FB", color: "#185FA5" },
};

const REDIRECT_MAP = {
  student: "/dashboard",
  admin:   "/admin/dashboard",
  officer: "/officer/dashboard",
};

const staffSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const schemaMap  = { student: staffSchema, admin: staffSchema, officer: staffSchema };
const initValMap = {
  student: { email: "", password: "" },
  admin:   { email: "", password: "" },
  officer: { email: "", password: "" },
};

const apiFnMap = {
  student: (values) => studentLogin(values).then((r) => r.data),
  admin:   (values) => adminLogin(values).then((r) => r.data),
  officer: (values) => adminLogin(values).then((r) => r.data),
};

//  Page 
export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");

  const formik = useFormik({
    initialValues: initValMap[role],
    validationSchema: schemaMap[role],
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const data = await apiFnMap[role](values);
        // console.log("login response:", data); 
        if (data?.data?.access_token) {
          const tokenKey = {
            student: "token",
            admin:   "admin_token",
            officer: "officer_token",
          }[role];
          localStorage.setItem(tokenKey, data.data.access_token);
        }

        if (data?.data?.user) localStorage.setItem("user", JSON.stringify(data.data.user));

        toast.success(data.message ?? "Logged in successfully!");
        router.push(REDIRECT_MAP[role]);
      } catch (err) {
        toast.error(
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          "Login failed. Please check your credentials."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleRoleSwitch = (newRole) => { formik.resetForm(); setRole(newRole); };

  return (
    <main style={authStyles.page}>
      <div style={authStyles.card}>

        <AuthLogo />

        <h1 style={authStyles.heading}>Welcome back</h1>
        <p style={authStyles.subheading}>
          Signing in as{" "}
          <span style={{ ...authStyles.roleBadge, ...ROLE_BADGE_STYLE[role] }}>
            {ROLES.find((r) => r.id === role)?.icon} {role}
          </span>
        </p>

        <RoleTabs roles={ROLES} activeRole={role} onSwitch={handleRoleSwitch} />

        <form onSubmit={formik.handleSubmit} noValidate style={authStyles.form}>
          {role === "student" ? (
            <InputField label="Email address" id="email" formik={formik} type="email" placeholder="student@adeleke.edu.ng" />
          ) : (
            <InputField label="Email address" id="email" formik={formik} type="email" placeholder="you@adeleke.edu.ng" />
          )}

          <PasswordField label="Password" id="password" formik={formik} placeholder="Enter your password" />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <a href="/forgot-password" style={authStyles.footerLink}>Forgot password?</a>
          </div>

          <SubmitButton isSubmitting={formik.isSubmitting} label="Sign in →" loadingLabel="Signing in…" />
        </form>

        <p style={authStyles.footerText}>
          Don&apos;t have an account?{" "}
          <a href="/register" style={authStyles.footerLink}>Create one</a>
        </p>
      </div>
    </main>
  );
}