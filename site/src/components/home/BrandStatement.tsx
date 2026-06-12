"use client";

import { useEffect, useRef } from "react";
import HairlineRule from "@/components/ui/HairlineRule";

export default function BrandStatement() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          ref.current?.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const statement =
    "Backed with science, built for researchers. Bare Compounds keeps the experience premium, minimal, and direct: verified batches, clear categories, local pickup, and no usage guidance beyond research-only documentation.";

  return (
    <section className="bg-cream">
      <div className="container-bare py-24 md:py-40">
        <HairlineRule index="§ 01" label="Manifesto" />

        <div
          ref={ref}
          className="scroll-fade mt-16 grid grid-cols-1 gap-10 md:mt-24 md:grid-cols-12"
        >
          <p
            className="md:col-span-10 md:col-start-2 font-serif font-[310] text-[clamp(1.75rem,3.6vw,3.5rem)] leading-[1.15] tracking-[-0.02em] text-ink"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {statement}
          </p>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 border-t border-[var(--bare-rule)] pt-12">
          {[
            { k: "Est.", v: "2025" },
            { k: "Payments", v: "cash · zelle · venmo" },
            { k: "Pickup", v: "appointment" },
            { k: "COAs", v: "batch archived" },
          ].map((m) => (
            <div key={m.k} className="flex flex-col gap-2">
              <span className="caption">{m.k}</span>
              <span
                className="font-serif font-[320] text-[clamp(2rem,3.5vw,3rem)] leading-none tracking-[-0.02em]"
                style={{ fontVariationSettings: '"opsz" 96' }}
              >
                {m.v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
