"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {studentRegister, adminRegister, officerRegister} from "@/api/auth";
import {
  AuthLogo,
  RoleTabs,
  InputField,
  SelectField,
  PasswordField,
  SubmitButton,
  authStyles,
} from "@/components/auth/AuthFields";

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

const DEPARTMENTS = [
  "Computer Science", "Software Engineering", "Information Technology", "Nursing", "Medical Lab Sciences", "Theatre Arts", "Literacy Studies",
  "Electrical Engineering", "Mass Communication", "Business Administration", "Accounting", "Law", "Pharmacy"
];

const LEVELS = ["100", "200", "300", "400", "500"];

const CLEARANCE_DEPARTMENTS = [
  "Bursary", "Faculty", "Chapel", "Cafeteria",
  "Internal Audit", "Hall of Residence", "Admissions",
];

//  Validation 
const phoneRegex = /^0[7-9][0-1]\d{8}$/;

const baseSchema = {
  full_name: Yup.string().trim().min(2, "Too short").required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(phoneRegex, "Enter a valid Nigerian number e.g. 08012345678")
    .required("Phone is required"),
  password: Yup.string()
    .min(8, "At least 8 characters")
    .matches(/[A-Z]/, "Must include an uppercase letter")
    .matches(/[0-9]/, "Must include a number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords do not match")
    .required("Please confirm your password"),
};

const schemaMap = {
  student: Yup.object({
    ...baseSchema,
    matric_number: Yup.string()
      .matches(/^\d{2}\/\d{4}$/, "Format: YY/NNNN e.g. 22/0336")
      .required("Matriculation number is required"),
    department: Yup.string().required("Select a department"),
    level: Yup.string().required("Select your level"),
    gender: Yup.string().required("Select your gender"),
  }),
  admin: Yup.object({ ...baseSchema }),
  officer: Yup.object({
    ...baseSchema,
    department: Yup.string().required("Select your assigned department"),
    adminToken: Yup.string().required("Admin JWT token is required"),
  }),
};

const baseValues = { full_name: "", email: "", phone: "", password: "", confirmPassword: "" };

const initValMap = {
  student: { ...baseValues, matric_number: "", department: "", level: "", gender: "" },
  admin:   { ...baseValues },
  officer: { ...baseValues, department: "", adminToken: "" },
};


const apiFnMap = { 
  student: (values) => studentRegister(values).then((r) => r.data),
  admin:   (values) => adminRegister(values).then((r) => r.data),
  officer: (values) => {officerRegister(values, values.adminToken).then((r) => r.data)}};

//  Role-specific extra fields ──
function StudentFields({ formik }) {
  return (
    <>
      <InputField label="Matriculation number" id="matric_number" formik={formik} placeholder="e.g. 22/0336" />
      <div style={authStyles.row}>
        <SelectField label="Department" id="department" formik={formik} options={DEPARTMENTS} placeholder="Select department" />
        <SelectField label="Level" id="level" formik={formik} options={LEVELS} placeholder="Select level" />
      </div>
      <SelectField label="Gender" id="gender" formik={formik} options={["Male", "Female"]} placeholder="Select gender" />
    </>
  );
}

function OfficerFields({ formik }) {
  return (
    <>
      <SelectField label="Assigned department" id="department" formik={formik} options={CLEARANCE_DEPARTMENTS} placeholder="Select department" />
      <PasswordField label="Admin JWT token" id="adminToken" formik={formik} placeholder="Paste the admin authorization token" />
      <div style={authStyles.infoBox}>
        ℹ️ Officer accounts require an active admin to authorize creation. Paste the admin Bearer token above.
      </div>
    </>
  );
}

const ExtraFieldsMap = {
  student: StudentFields,
  admin: () => <div style={authStyles.infoBox}>🛡️ Admin accounts only require your name, email, phone, and password.</div>,
  officer: OfficerFields,
};

//  Page 
export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");

  const formik = useFormik({
    initialValues: initValMap[role],
    validationSchema: schemaMap[role],
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const data = await apiFnMap[role](values);
        toast.success(data.message ?? "Account created successfully!");
        resetForm();
        router.push(REDIRECT_MAP[role]);
      } catch (err) {
        toast.error(
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          "Registration failed. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const ExtraFields = ExtraFieldsMap[role];
  const handleRoleSwitch = (newRole) => { formik.resetForm(); setRole(newRole); };

  return (
    <main style={authStyles.page}>
      <div style={authStyles.card}>

        <AuthLogo />

        <h1 style={authStyles.heading}>Create an account</h1>
        <p style={authStyles.subheading}>
          Registering as{" "}
          <span style={{ ...authStyles.roleBadge, ...ROLE_BADGE_STYLE[role] }}>
            {ROLES.find((r) => r.id === role)?.icon} {role}
          </span>
        </p>

        <RoleTabs roles={ROLES} activeRole={role} onSwitch={handleRoleSwitch} />

        <form onSubmit={formik.handleSubmit} noValidate style={authStyles.form}>

          {/* Base fields — all roles */}
          <InputField label="Full name" id="full_name" formik={formik} placeholder="Salam Oluwatunmise Jomiloju" />
          <InputField label="Email address" id="email" formik={formik} type="email" placeholder="you@adeleke.edu.ng" />
          <InputField label="Phone number" id="phone" formik={formik} type="tel" placeholder="08012345678" />

          {/* Role-specific fields */}
          <ExtraFields formik={formik} />

          {/* Password */}
          <PasswordField label="Password" id="password" formik={formik} placeholder="Create a strong password" />
          <PasswordField label="Confirm password" id="confirmPassword" formik={formik} placeholder="Repeat your password" />

          <SubmitButton isSubmitting={formik.isSubmitting} label="Create account →" loadingLabel="Creating account…" />
        </form>

        <p style={authStyles.footerText}>
          Already have an account?{" "}
          <a href="/login" style={authStyles.footerLink}>Sign in</a>
        </p>
      </div>
    </main>
  );
}