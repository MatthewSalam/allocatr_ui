import api from "./axiosInstance";

//  Auth 
// Student
export const studentRegister    = (payload)           => api.post("/api/auth/register", payload);
export const studentLogin        = (payload)           => api.post("/api/auth/login", payload);

// Admin (first admin - no auth required)
export const adminRegister       = (payload)           => api.post("/api/auth/register-staff", payload);
export const adminLogin          = (payload)           => api.post("/api/auth/login", payload);

// Officer (requires admin JWT  passed explicitly)
export const officerRegister     = (payload, adminToken) =>
  api.post("/api/auth/register-staff-authenticated", { ...payload, role: "officer" }, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

//  Student 
export const studentDashboard    = ()                  => api.get("/api/student/dashboard");
export const studentAllocation   = ()                  => api.get("/api/student/my-allocation");
export const studentQR           = ()                  => api.get("/api/student/my-qr");
export const studentQRDownload   = (format)            => api.get(`/api/student/my-qr/download?format=${format}`, { responseType: "blob" });
export const studentClearance    = ()                  => api.get("/api/student/my-clearance");
export const myClearanceStatus    = ()                 => api.get("/api/clearance/my-status");


//  Receipts (student) 
export const myReceipts          = ()                  => api.get("/receipts/my-receipts");
export const uploadReceipt       = (formData)          => api.post("/receipts/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});

//  Admin  system 
export const adminMe             = ()                  => api.get("/api/admin/me");
export const systemStatus        = ()                  => api.get("/api/admin/system-status");

//  Admin  allocation ─
export const runAllocation       = (payload)           => api.post("/api/admin/allocate", payload);
export const allAllocations      = (session)           => api.get("/api/admin/allocations", { params: { academic_session: session } });
export const exportAllocationPDF = (session)           => `/api/admin/allocations/export/pdf?academic_session=${session}`; // direct URL for <a href>

//  Admin  receipts 
export const pendingReceipts     = ()                  => api.get("/api/admin/receipts/pending");
export const verifyReceipt       = (id, payload)       => api.put(`/api/admin/receipts/${id}/verify`, payload);
export const rejectReceipt       = (id, payload)       => api.put(`/api/admin/receipts/${id}/reject`, payload);
export const receiptFile         = (id)                => `${process.env.NEXT_PUBLIC_API_URL}/api/admin/receipts/${id}/file`; // direct URL for <img> / <iframe>

//  Admin  rooms 
export const allRooms            = ()                  => api.get("/api/admin/rooms");
export const createRoom          = (payload)           => api.post("/api/admin/rooms", payload);
export const updateRoom          = (id, payload)       => api.put(`/api/admin/rooms/${id}`, payload);
export const deleteRoom          = (id)                => api.delete(`/api/admin/rooms/${id}`);

//  Officer 

export const officerMe           = ()                  => api.get("/api/officer/me");
export const departmentClearances = (params)           => api.get("/api/clearance/my-department", { params });
export const scanQR              = (payload)           => api.post("/api/clearance/scan", payload);
export const studentClearanceById = (studentId)        => api.get(`/api/clearance/student/${studentId}`);
export const clearanceStats       = ()                 => api.get("/api/clearance/stats");