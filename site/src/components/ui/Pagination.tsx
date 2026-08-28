import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  path,
  query = {},
}: {
  page: number;
  totalPages: number;
  path: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(nextPage));
    return `${path}?${params.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-[var(--bare-rule)] pt-5">
      {page > 1 ? (
        <Link href={href(page - 1)} className="nav-link">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-smoke">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="nav-link">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
