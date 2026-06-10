/**
 * Shared pagination component used across admin and officer pages.
 *
 * Props:
 *  - page:        current page (1-based)
 *  - totalPages:  total number of pages
 *  - onChange:    (newPage: number) => void
 *
 * For small page counts (≤ 7) it shows every page button.
 * For larger counts it uses ellipsis to keep the row compact.
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const range = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)
      return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3)
      return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  const btnBase   = "text-sm font-semibold bg-white border border-[#e8e5df] text-gray-600 hover:bg-[#f0ede8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans";
  const pageBase  = "w-8 h-8 rounded-lg text-sm font-bold transition-colors font-sans";

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <button
        className={`px-4 py-2 rounded-lg ${btnBase}`}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ← Previous
      </button>

      {range().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="text-gray-400 text-sm px-1">…</span>
        ) : (
          <button
            key={p}
            className={`${pageBase} ${p === page ? "bg-gray-900 text-white" : "bg-white border border-[#e8e5df] text-gray-500 hover:bg-[#f0ede8]"}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className={`px-4 py-2 rounded-lg ${btnBase}`}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Next →
      </button>
    </div>
  );
}