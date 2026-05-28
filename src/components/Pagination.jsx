"use client"

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex gap-2 justify-center mt-4">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        Anterior
      </button>

      <span className="px-2 py-1">{currentPage} / {totalPages}</span>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  )
}