# 🏠 Allocatr UI

> The frontend for Allocatr : a smart hostel allocation and QR-based clearance system built for Nigerian universities.

Students apply for hostel accommodation, get allocated a room automatically, and clear each department by scanning a QR code. Officers scan QR codes at their department. Admins manage rooms, run allocations, and oversee the entire process — all from a clean, role-based web interfa

 🧩 What It Does

 For Students
- View hostel allocation status and assigned room
- Track clearance progress across all departments (Bursary, Library, ICT, etc.)
- Display a personal HMAC-secured QR code for department officers to scan
- Download or share QR code as PNG/PDF

 For Officers
- Scan student QR codes via camera or manual paste to record clearance
- View all clearances processed by their department
- Filter by date, search by name or matric number

 For Admins
- Manage hostel rooms and availability
- Run the FCFS (First-Come, First-Served) room allocation algorithm
- Review and verify student payment receipts
- View all allocations with export to CSV and PDF
- Register new officers and admins


 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 15 (App Router) | Framework |
| Tailwind CSS | Styling |
| Sonner | Toast notifications |
| Axios | API communication |
| BarcodeDetector API | In-browser QR scanning |

---

## 🗂 Project Structure
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
---

## 🚀 Running Locally

Clone the repo and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The backend API (FastAPI + PostgreSQL) lives in a separate repository: [allocatr_api](https://github.com/MatthewSalam/allocatr_api)

---

## 🔐 Auth & Roles

The app has three completely separate auth flows, each with its own token stored in `localStorage`:

| Role | Token Key | Login Path |
|---|---|---|
| Student | `token` | `/login` |
| Officer | `officer_token` | `/officer/login` |
| Admin | `admin_token` | `/admin/login` |

Each layout validates the token on mount and redirects to login on a 401.

---

## 📸 Key Features Worth Noting

- **Smart polling** — clearance page polls a lightweight status endpoint every 30s and only re-fetches full data when something actually changed, avoiding unnecessary load
- **QR scanning** — uses the native `BarcodeDetector` browser API with a manual paste fallback for unsupported browsers
- **Role-based layouts** — each role has its own persistent layout with navigation, profile dropdown, and logout
- **Client-side filtering & pagination** — allocations and clearance lists are fetched once and filtered/paginated in the browser for snappy UX
- **CSV + PDF export** — admins can export allocation data directly from the UI
