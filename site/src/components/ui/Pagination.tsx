import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  path,
}: {
  page: number;
  totalPages: number;
  path: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-[var(--bare-rule)] pt-5">
      {page > 1 ? (
        <Link href={`${path}?page=${page - 1}`} className="nav-link">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-smoke">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${path}?page=${page + 1}`} className="nav-link">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
