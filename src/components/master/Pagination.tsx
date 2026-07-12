interface PaginationProps {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const pages: number[] = [];
  const maxButtons = 5;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  return (
    <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-bold text-emerald-300">{showingFrom}</span> to{" "}
        <span className="font-bold text-emerald-300">{showingTo}</span> of{" "}
        <span className="font-bold text-emerald-300">{totalItems}</span> records
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
              page === currentPage
                ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "border border-emerald-400/20 bg-black/30 text-emerald-100 hover:bg-emerald-400/10"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}