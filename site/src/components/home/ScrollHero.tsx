import Image from "next/image";
import Link from "next/link";

const TRUST_POINTS = [
  {
    label: ">=99%",
    detail: "Purity Guaranteed",
    icon: (
      <path d="M7 1.5 12 3.7v3.9c0 3.1-2.1 5.1-5 5.9-2.9-.8-5-2.8-5-5.9V3.7L7 1.5Z" />
    ),
  },
  {
    label: "60+",
    detail: "Research Compounds",
    icon: (
      <>
        <path d="M5.25 1.5h3.5M6.1 1.5v3.2l-3 5.5a2 2 0 0 0 1.75 2.95h4.3a2 2 0 0 0 1.75-2.95l-3-5.5V1.5" />
        <path d="M4.65 9.7h4.7" />
      </>
    ),
  },
  {
    label: "5-Star",
    detail: "Reviews",
    icon: (
      <path d="m7 1.6 1.62 3.28 3.63.53-2.63 2.56.62 3.61L7 9.88l-3.24 1.7.62-3.61-2.63-2.56 3.63-.53L7 1.6Z" />
    ),
  },
  {
    label: "COA",
    detail: "On Every Batch",
    icon: (
      <>
        <path d="M3 1.75h5.2L11 4.55v7.7H3V1.75Z" />
        <path d="M8.2 1.75v2.8H11M5 7.25h4M5 9.5h4" />
      </>
    ),
  },
] as const;

export default function ScrollHero() {
  return (
    <section
      aria-label="Introduction"
      className="relative isolate overflow-hidden bg-[#eee9e3]"
    >
      <Image
        src="/brand/hero-lab-vials.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[78%_center]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,246,242,0.96)_0%,rgba(248,246,242,0.88)_32%,rgba(248,246,242,0.34)_56%,rgba(248,246,242,0.04)_100%)]"
      />

      <div className="container-bare flex min-h-[500px] items-center py-12 md:min-h-[540px] md:py-14">
        <div className="relative z-10 flex max-w-[620px] flex-col items-start">
          <span className="mb-5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#7a6d60]">
            Pure. Tested. Reliable.
          </span>

          <h1 className="font-serif text-[clamp(2.9rem,5vw,4.9rem)] font-[330] leading-[0.94] tracking-[-0.055em] text-ink">
            Backed by Science.
            <br />
            <span
              className="font-[260] text-[#6b625a]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70' }}
            >
              Delivered with Integrity.
            </span>
          </h1>

          <p className="mt-6 max-w-[40ch] text-[clamp(1rem,1.4vw,1.18rem)] leading-7 text-ink">
            Each peptide is rigorously tested, COA verified, and manufactured to
            the highest standards for research you can trust.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-cream shadow-[0_10px_24px_rgba(10,10,10,0.16)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Browse Products
            </Link>
            <Link
              href="/coa"
              className="rounded-md border border-[var(--bare-rule)] bg-white/55 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-white"
            >
              View COAs
            </Link>
            <Link
              href="/research"
              className="rounded-md border border-[var(--bare-rule)] bg-white/55 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-white"
            >
              Research
            </Link>
            <Link
              href="/help-support"
              className="rounded-md border border-[var(--bare-rule)] bg-white/55 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-white"
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-9 grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {TRUST_POINTS.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-7 w-7 shrink-0 text-ink"
                >
                  {item.icon}
                </svg>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-ink">{item.label}</div>
                  <div className="mt-0.5 text-[0.62rem] font-medium text-smoke">
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-cream" />
    </section>
  );
}
