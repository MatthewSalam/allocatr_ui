"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import "./page.css";
import Pagination from "@/components/ui/Pagination";
import { allRooms, createRoom, updateRoom, deleteRoom } from "@/api/auth";

const BASE_URL  = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 15;

//  Mock 
const DEV_MODE = false;

const MOCK_DATA = {
  total_rooms: 50, total_capacity: 100,
  total_occupied: 90, available_spaces: 10, occupancy_percentage: 90,
  rooms: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    block: ["Block A","Block B","Block C"][i % 3],
    room_number: String(101 + i),
    capacity: 2,
    current_occupants: i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2,
    available_space: i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0,
    gender: i % 2 === 0 ? "Male" : "Female",
    status: i % 3 === 0 ? "available" : i % 3 === 1 ? "partially_occupied" : "occupied",
    occupancy_rate: i % 3 === 0 ? 0 : i % 3 === 1 ? 50 : 100,
  })),
};

//  Helpers 
const STATUS_META = {
  occupied:            { label: "Occupied",   bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200"   },
  partially_occupied:  { label: "Partial",    bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  available:           { label: "Available",  bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  maintenance:         { label: "Maintenance",bg: "bg-gray-100",  text: "text-gray-600",  border: "border-gray-200"  },
};

const GENDER_META = {
  Male:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
  Female: { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200"   },
};

function Chip({ label, bg, text, border }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
}

//  Create / Edit modal 
const EMPTY_FORM = { block: "", room_number: "", capacity: 2, gender: "Male", status: "available" };

function RoomModal({ initial, onClose, onSave, loading }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    block: initial.block, room_number: initial.room_number,
    capacity: initial.capacity, gender: initial.gender, status: initial.status,
  } : EMPTY_FORM);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.block.trim() && form.room_number.trim() && form.capacity > 0;

  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? "✏️ Edit Room" : "➕ Create New Room"}
          </h3>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rm-label">Block</label>
              <input
                className="rm-input"
                placeholder="e.g. Block A"
                value={form.block}
                onChange={(e) => set("block", e.target.value)}
              />
            </div>
            <div>
              <label className="rm-label">Room Number</label>
              <input
                className="rm-input"
                placeholder="e.g. 101"
                value={form.room_number}
                onChange={(e) => set("room_number", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rm-label">Capacity</label>
              <input
                type="number" min={1} max={10}
                className="rm-input"
                value={form.capacity}
                onChange={(e) => set("capacity", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="rm-label">Gender</label>
              <select className="rm-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="rm-label">Status</label>
            <select className="rm-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="partially_occupied">Partially Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2.5 mt-6">
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={onClose} disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 font-sans flex items-center justify-center gap-2"
            onClick={() => onSave(form)} disabled={loading || !valid}
          >
            {loading ? <><div className="rm-spinner-sm" />{isEdit ? "Saving…" : "Creating…"}</> : isEdit ? "💾 Save Changes" : "➕ Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Delete confirm modal 
function DeleteModal({ room, onClose, onConfirm, loading }) {
  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">🗑 Delete Room</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>×</button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
          <p className="font-bold text-red-800">{room.block} — Room {room.room_number}</p>
          <p className="text-red-600 mt-0.5 text-xs">
            {room.current_occupants > 0
              ? `⚠️ This room has ${room.current_occupants} occupant(s). Deleting it will remove their allocation.`
              : "This room is currently unoccupied."}
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={onClose} disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-sans flex items-center justify-center gap-2"
            onClick={onConfirm} disabled={loading}
          >
            {loading ? <><div className="rm-spinner-sm" /> Deleting…</> : "🗑 Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Room card 
function RoomCard({ room, index, onEdit, onDelete }) {
  const statusMeta = STATUS_META[room.status] ?? STATUS_META.available;
  const genderMeta = GENDER_META[room.gender] ?? {};
  const barColor   = room.occupancy_rate >= 100 ? "#dc2626" : room.occupancy_rate >= 50 ? "#f59e0b" : "#2D6A4F";

  return (
    <div
      className="rm-fadein bg-white border border-[#e8e5df] rounded-2xl p-5 flex flex-col gap-3.5"
      style={{ borderLeft: `4px solid ${barColor}`, animationDelay: `${index * 35}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-base font-bold text-gray-900">
            {room.block} — Room {room.room_number}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">ID #{room.id}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip label={room.gender} {...genderMeta} />
          <Chip label={statusMeta.label} bg={statusMeta.bg} text={statusMeta.text} border={statusMeta.border} />
        </div>
      </div>

      {/* Capacity bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Capacity: {room.current_occupants}/{room.capacity}</span>
          <span className="font-semibold">{room.occupancy_rate}%</span>
        </div>
        <div className="h-2 bg-[#f0ede8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${room.occupancy_rate}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Status note */}
      <p className="text-xs text-gray-400">
        {room.available_space > 0
          ? `✅ ${room.available_space} space${room.available_space > 1 ? "s" : ""} available for allocation`
          : "🔒 No spaces available"}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0ede8] flex-wrap">
        <a
          href={`/admin/rooms/${room.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f0ede8] text-gray-600 hover:bg-[#e8e5df] transition-colors no-underline"
        >
          👁 View Details
        </a>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef2ff] text-[#6B4EFF] hover:bg-[#e0e7ff] transition-colors font-sans border border-[#c7d2fe]"
          onClick={() => onEdit(room)}
        >
          ✏️ Edit
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-sans border border-red-200"
          onClick={() => onDelete(room)}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

//  Page 
export default function RoomsPage() {
  const router = useRouter();
  const [summary,       setSummary]       = useState(DEV_MODE ? MOCK_DATA : null);
  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [blockFilter,   setBlockFilter]   = useState("");
  const [genderFilter,  setGenderFilter]  = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRooms = useCallback(() => {
    if (DEV_MODE) return;
    setLoading(true);
    allRooms()
      .then((res) => {
        const d = res.data.data;
        setSummary({ total_rooms: d.total_rooms, total_capacity: d.total_capacity, total_occupied: d.total_occupied, available_spaces: d.available_spaces, occupancy_percentage: d.occupancy_percentage });
        setRooms(d.rooms);
      })
      .catch((err) => {
        if (err?.response?.status === 401) { localStorage.removeItem("admin_token"); router.replace("/admin/login"); }
        else toast.error("Failed to load rooms.");
      })
      .finally(() => setLoading(false));

  }, [router]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Filter + paginate ──
  const blocks = [...new Set(rooms.map((r) => r.block))].sort();

  const filtered = useMemo(() => rooms.filter((r) => {
    const mBlock  = !blockFilter  || r.block    === blockFilter;
    const mGender = !genderFilter || r.gender   === genderFilter;
    const mStatus = !statusFilter || r.status   === statusFilter;
    return mBlock && mGender && mStatus;
  }), [rooms, blockFilter, genderFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [blockFilter, genderFilter, statusFilter]);

  // ── Create ──
  const handleCreate = async (form) => {
    setActionLoading(true);
    try {
      await createRoom(form);
      toast.success("Room created successfully!");
      setCreateOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to create room.");
    } finally {
      setActionLoading(false);
    }
  };

  //  Edit 
  const handleEdit = async (form) => {
      setActionLoading(true);
      try {
        await updateRoom(editTarget.id, form);
        toast.success("Room updated successfully!");
        setEditTarget(null);
        fetchRooms();
      } catch (err) {
        toast.error(err?.response?.data?.message ?? "Failed to update room.");
      } finally {
        setActionLoading(false);
      }
    };

  //  Delete 
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteRoom(deleteTarget.id);
      toast.success("Room deleted.");
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to delete room.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/*  Heading  */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">🏠 Room Management</h1>
          {summary && (
            <p className="text-sm text-gray-400 mt-1">
              {summary.total_rooms} rooms · Capacity {summary.total_capacity} ·{" "}
              Occupied {summary.total_occupied} ({summary.occupancy_percentage}%) ·{" "}
              <span className="text-green-700 font-semibold">{summary.available_spaces} available</span>
            </p>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 transition-all font-sans"
          onClick={() => setCreateOpen(true)}
        >
          ➕ Create New Room
        </button>
      </div>

      {/*  Summary bar  */}
      {summary && (
        <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-3 mb-5">
          {[
            { label: "Total Rooms",   value: summary.total_rooms,         accent: "#185FA5" },
            { label: "Total Capacity",value: summary.total_capacity,      accent: "#6B4EFF" },
            { label: "Occupied",      value: summary.total_occupied,      accent: summary.occupancy_percentage >= 90 ? "#dc2626" : "#f59e0b" },
            { label: "Available",     value: summary.available_spaces,    accent: "#2D6A4F" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-white border border-[#e8e5df] rounded-xl px-4 py-3" style={{ borderTop: `3px solid ${accent}` }}>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{label}</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: accent }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/*  Filters  */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}
        >
          <option value="">All Blocks</option>
          {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select
          className="border border-[#e0ddd7] rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:border-[#6B4EFF] transition-colors cursor-pointer"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="partially_occupied">Partially Occupied</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
        {(blockFilter || genderFilter || statusFilter) && (
          <button
            className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 bg-[#f0ede8] hover:bg-[#e8e5df] transition-colors font-sans"
            onClick={() => { setBlockFilter(""); setGenderFilter(""); setStatusFilter(""); }}
          >
            Clear ×
          </button>
        )}
        <span className="ml-auto self-center text-xs text-gray-400">
          {filtered.length} room{filtered.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </span>
      </div>

      {/*  Content  */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 text-sm text-gray-400">
          <div className="rm-spinner" />
          <span>Loading rooms…</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-gray-400">
          <span className="text-4xl">🏠</span>
          <p className="text-sm font-medium">
            {filtered.length === 0 && rooms.length > 0 ? "No rooms match your filters." : "No rooms yet — create one to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {paginated.map((room, i) => (
            <RoomCard key={room.id} room={room} index={i} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/*  Modals  */}
      {createOpen   && <RoomModal initial={null}       onClose={() => setCreateOpen(false)} onSave={handleCreate} loading={actionLoading} />}
      {editTarget   && <RoomModal initial={editTarget}  onClose={() => setEditTarget(null)}  onSave={handleEdit}   loading={actionLoading} />}
      {deleteTarget && <DeleteModal room={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={actionLoading} />}
    </>
  );
}