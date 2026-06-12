"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "bare-compounds-age-verified";

export default function AgeGate() {
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    setVerified(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function confirmAge() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVerified(true);
  }

  if (verified) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 px-5 backdrop-blur-md"
    >
      <div className="w-full max-w-xl border border-[var(--bare-rule-strong)] bg-cream p-8 shadow-2xl md:p-10">
        <p className="eyebrow">Age verification</p>
        <h2
          id="age-gate-title"
          className="mt-6 font-serif text-[clamp(2.25rem,5vw,4rem)] font-[320] leading-none tracking-[-0.035em]"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          18+ research access only.
        </h2>
        <p className="lede mt-6">
          Bare Compounds products are intended for qualified research use only.
          Please confirm that you are at least 18 years old before entering.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ink" onClick={confirmAge}>
            I am 18 or older
          </Button>
          <Button href="https://www.google.com" external variant="ghost">
            Leave website
          </Button>
        </div>
        <p className="caption mt-6">
          Not for human consumption. No instructions or usage guidance are
          provided.
        </p>
      </div>
    </div>
  );
}
