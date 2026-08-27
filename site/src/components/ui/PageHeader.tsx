import Link from "next/link";

type Breadcrumb = { label: string; href?: string };

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[var(--bare-rule)] bg-paper px-5 py-8 md:px-8 md:py-10">
      {breadcrumbs.length ? (
        <nav aria-label="Breadcrumb" className="mb-7">
          <ol className="flex flex-wrap items-center gap-2 caption">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index ? <span aria-hidden="true">/</span> : null}
                {item.href ? (
                  <Link href={item.href} className="hover:text-ink">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="display-m mt-3">{title}</h1>
          {description ? <p className="lede mt-4">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
