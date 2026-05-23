"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import IridescentStrip from "@/components/ui/IridescentStrip";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-pinned hero. The vial stays fixed, drifts horizontally + rotates subtly,
 * while three text panels cross-fade in sequence. Under reduced-motion, everything
 * flattens to a single static layout.
 */
export default function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const vialRef = useRef<HTMLDivElement>(null);
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);
  const panelCRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const panels = [panelARef.current, panelBRef.current, panelCRef.current];
      gsap.set(panels, { autoAlpha: 0, y: 24 });
      gsap.set(panelARef.current, { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=260%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      /* Vial drift across the three scenes */
      tl.to(
        vialRef.current,
        {
          xPercent: -18,
          yPercent: -6,
          rotate: -4,
          scale: 1.04,
          duration: 1,
          ease: "none",
        },
        0
      )
        .to(
          vialRef.current,
          {
            xPercent: 14,
            yPercent: 2,
            rotate: 3,
            scale: 1.08,
            duration: 1,
            ease: "none",
          },
          1
        )
        .to(
          vialRef.current,
          {
            xPercent: 0,
            yPercent: -2,
            rotate: 0,
            scale: 1.0,
            duration: 1,
            ease: "none",
          },
          2
        );

      /* Panel A → B */
      tl.to(
        panelARef.current,
        { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.inOut" },
        0.55
      ).fromTo(
        panelBRef.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
        0.85
      );

      /* Panel B → C */
      tl.to(
        panelBRef.current,
        { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.inOut" },
        1.7
      ).fromTo(
        panelCRef.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
        2.0
      );

      /* Progress indicator */
      if (progressRef.current && progressLabelRef.current) {
        const labelEl = progressLabelRef.current;
        tl.to(
          progressRef.current,
          { scaleX: 1, duration: 3, ease: "none" },
          0
        );
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "+=260%",
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            const scene = p < 0.33 ? "01" : p < 0.66 ? "02" : "03";
            labelEl.textContent = `${scene} / 03`;
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className="relative bg-cream overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      <div className="relative h-screen w-full">
        {/* Layered scene */}
        <div className="container-bare relative h-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-10">
          {/* Vial — left column, parallax layer */}
          <div className="absolute inset-0 md:static md:col-span-6 flex items-center justify-center md:justify-end pointer-events-none">
            <div
              ref={vialRef}
              className="relative aspect-[3/4] w-[82vw] md:w-[44vw] max-w-[620px] will-change-transform"
            >
              <Image
                src="/brand/StickerV1.png"
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 44vw, 82vw"
                className="object-contain select-none [filter:drop-shadow(0_60px_80px_rgba(10,10,10,0.18))]"
              />
            </div>
          </div>

          {/* Text — right column, crossfading panels */}
          <div className="relative z-10 md:col-span-6 md:col-start-7 flex flex-col justify-center h-full pt-28 md:pt-0 pb-20 md:pb-0">
            <div className="relative min-h-[380px] md:min-h-[420px]">
              <div
                ref={panelARef}
                className="absolute inset-0 flex flex-col gap-6 md:gap-8"
              >
                <span className="eyebrow flex items-center gap-3">
                  <span className="font-mono text-taupe">01</span>
                  Research, honestly stated
                </span>
                <h1 className="display-xl">
                  Bare
                  <br />
                  <span
                    className="italic font-[280]"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
                  >
                    essentials.
                  </span>
                </h1>
                <p className="lede">
                  Research-grade peptides, stripped of noise. Documented batch
                  by batch. Dispatched in apothecary-grade glass.
                </p>
              </div>

              <div
                ref={panelBRef}
                className="absolute inset-0 flex flex-col gap-8"
              >
                <span className="eyebrow flex items-center gap-3">
                  <span className="font-mono text-taupe">02</span>
                  Standards, not promises
                </span>
                <h2 className="display-l">
                  99% purity.
                  <br />
                  Third-party
                  <br />
                  verified.
                </h2>
                <div className="grid grid-cols-3 gap-6 max-w-md pt-4 border-t border-[var(--bare-rule)]">
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-3xl md:text-4xl font-[340]">
                      99
                      <span className="text-taupe">%</span>
                    </span>
                    <span className="caption">HPLC purity</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-3xl md:text-4xl font-[340]">
                      03
                    </span>
                    <span className="caption">Independent labs</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-3xl md:text-4xl font-[340]">
                      100<span className="text-taupe">%</span>
                    </span>
                    <span className="caption">COA transparency</span>
                  </div>
                </div>
              </div>

              <div
                ref={panelCRef}
                className="absolute inset-0 flex flex-col gap-8 justify-center"
              >
                <span className="eyebrow flex items-center gap-3">
                  <span className="font-mono text-taupe">03</span>
                  Philosophy
                </span>
                <p
                  className="font-serif font-[300] text-[clamp(2rem,4.5vw,4rem)] leading-[1.05] tracking-[-0.025em]"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  &ldquo;A study in{" "}
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
                  >
                    restraint
                  </span>
                  .&rdquo;
                </p>
                <p className="caption max-w-[36ch]">
                  — the Bare Compounds working method
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--bare-rule)]">
          <div className="container-bare py-4 md:py-5 flex items-center gap-6">
            <span className="eyebrow hidden md:inline">Scroll</span>
            <div className="relative flex-1 h-px bg-[var(--bare-rule)] overflow-hidden">
              <div
                ref={progressRef}
                className="absolute inset-0 bg-ink origin-left"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            <span
              ref={progressLabelRef}
              className="caption font-mono tabular-nums min-w-[60px] text-right"
            >
              01 / 03
            </span>
          </div>
        </div>
      </div>

      {/* Reduced-motion and mobile-tablet pre-pin guidance */}
      <noscript>
        <IridescentStrip height="1px" soft />
      </noscript>
    </section>
  );
}
