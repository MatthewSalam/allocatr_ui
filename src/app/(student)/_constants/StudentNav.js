export const STUDENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "receipt",   label: "Receipt",   icon: "📄" },
  // { id: "room",      label: "Room",      icon: "🏠" },
  { id: "qrcode",    label: "QR Code",   icon: "📱" },
  { id: "clearance", label: "Clearance", icon: "✅" },
];

// Maps nav id → actual Next.js route
export const STUDENT_ROUTES = {
  dashboard: "/dashboard",
  receipt:   "/receipt",
  // room:      "/room",
  qrcode:    "/qr-code",
  clearance: "/clearance",
};