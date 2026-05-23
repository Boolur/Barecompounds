"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HairlineRule from "@/components/ui/HairlineRule";

gsap.registerPlugin(ScrollTrigger);

export default function BrandStatement() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || !ref.current) return;

    const ctx = gsap.context(() => {
      const words = ref.current!.querySelectorAll("[data-word]");
      gsap.set(words, { opacity: 0.12 });
      gsap.to(words, {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          end: "bottom 55%",
          scrub: 0.6,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  const statement =
    "We build compounds without theater. No neon, no shortcuts, no over-wrought molecular graphics. Just apothecary-grade materials, honest documentation, and the kind of typography that respects your time.";

  return (
    <section className="bg-cream">
      <div className="container-bare py-24 md:py-40">
        <HairlineRule index="§ 01" label="Manifesto" />

        <div
          ref={ref}
          className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10"
        >
          <p
            className="md:col-span-10 md:col-start-2 font-serif font-[310] text-[clamp(1.75rem,3.6vw,3.5rem)] leading-[1.15] tracking-[-0.02em] text-ink"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {statement.split(" ").map((word, i) => (
              <span key={i} data-word className="inline-block">
                {word}
                {i < statement.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </p>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 border-t border-[var(--bare-rule)] pt-12">
          {[
            { k: "Est.", v: "2025" },
            { k: "Purity", v: "99%" },
            { k: "Labs", v: "03" },
            { k: "Batches", v: "every 21d" },
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
