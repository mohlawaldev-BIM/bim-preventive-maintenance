export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = page - delta;
    const right = page + delta;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (i === left - 1 || i === right + 1) {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}–{end}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span> assets
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrev}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Previous
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-xs">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-xs rounded-lg cursor-pointer border transition-colors
                ${page === p
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNext}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}