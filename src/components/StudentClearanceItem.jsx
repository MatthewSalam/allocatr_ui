function getInitials(fullName) {
  return fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// variant="card"    → used in officer/clearances (full detail, chip, academic session)
// variant="row"     → used in officer/dashboard (compact, time-ago, no chip)
export default function StudentClearanceItem({ item, index = 0, variant = "card" }) {
  const { student, cleared_at, notes, academic_session } = item;
  const initials = getInitials(student.full_name);

  if (variant === "row") {
    return (
      <div
        className="od-fadein flex items-start gap-3 px-2.5 py-3 rounded-xl hover:bg-[#fafaf9] transition-colors"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="w-9 h-9 rounded-full bg-[#f0ede8] border border-[#e8e5df] flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
          {initials}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-bold text-gray-900">{student.full_name}</span>
          <span className="text-xs font-semibold text-[#6B4EFF]">{student.matric_number}</span>
          <span className="text-xs text-gray-400">{student.department} · {student.level}L</span>
          {notes && <span className="text-xs text-[#2D6A4F] italic mt-0.5">&ldquo;{notes}&rdquo;</span>}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-xs font-semibold text-gray-500">{timeAgo(cleared_at)}</span>
          <span className="text-xs text-gray-300">{formatTime(cleared_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-[#e8e5df] border-l-4 border-l-[#2D6A4F] rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="w-10 h-10 rounded-full bg-[#f0ede8] border border-[#e8e5df] flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
        {initials}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{student.full_name}</span>
          <span className="text-xs font-semibold text-[#6B4EFF]">({student.matric_number})</span>
        </div>
        <span className="text-xs text-gray-400">{student.department} · {student.level}L</span>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
          <span>📅 Cleared: {formatDateTime(cleared_at)}</span>
          {academic_session && <span>📚 {academic_session}</span>}
        </div>
        {notes && (
          <div className="mt-1.5 text-xs text-[#2D6A4F] italic bg-green-50 px-2.5 py-1 rounded-md self-start">
            &ldquo;{notes}&rdquo;
          </div>
        )}
      </div>
      <div className="shrink-0">
        <span className="text-[11px] font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
          ✅ Cleared
        </span>
      </div>
    </div>
  );
}