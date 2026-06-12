import Image from "next/image";
import Link from "next/link";
import IridescentStrip from "@/components/ui/IridescentStrip";

/**
 * Static hero requested in the owner revisions. Product imagery stays prominent
 * without pinning, scrubbing, or auto-scroll behavior.
 */
export default function ScrollHero() {
  return (
    <section aria-label="Introduction" className="relative overflow-hidden bg-cream">
      <div className="container-bare grid min-h-[calc(100svh-7rem)] grid-cols-1 items-center gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="relative z-10 flex flex-col gap-8 md:col-span-6">
          <span className="eyebrow flex items-center gap-3">
            <span className="font-mono text-taupe">01</span>
            Premium research peptides
          </span>

          <h1 className="display-xl">
            Research grade.
            <br />
            <span
              className="italic font-[280]"
              style={{ fontVariationSettings: '\"opsz\" 144, \"SOFT\" 80' }}
            >
              Easy to shop.
            </span>
          </h1>

          <p className="lede max-w-[42ch]">
            Bare Compounds pairs third-party verified peptides with a clean
            research-first shopping experience, local pickup, and transparent
            batch documentation.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/shop" className="nav-link rounded-full bg-ink px-6 py-3 text-cream">
              Shop products
            </Link>
            <Link
              href="/research"
              className="nav-link rounded-full border border-[var(--bare-rule-strong)] px-6 py-3 text-ink"
            >
              Research library
            </Link>
          </div>
        </div>

        <div className="md:col-span-6">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[640px]">
            <div className="absolute inset-6 rounded-full bg-paper blur-3xl" />
            <div className="absolute inset-0 border border-[var(--bare-rule)] bg-paper/70" />
            <div className="relative h-full p-6 md:p-10">
              <Image
                src="/brand/StickerV1.png"
                alt="Bare Compounds vial and sticker packaging"
                fill
                priority
                sizes="(min-width: 768px) 48vw, 90vw"
                className="object-contain p-6 [filter:drop-shadow(0_50px_70px_rgba(10,10,10,0.16))]"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <IridescentStrip height="1px" />
        <div className="container-bare flex items-center justify-between py-4 font-mono caption tabular-nums">
          <span>LOCAL PICKUP AVAILABLE</span>
          <span className="hidden md:inline">THIRD-PARTY VERIFIED</span>
          <span>FOR RESEARCH USE ONLY</span>
        </div>
      </div>
    </section>
  );
}
