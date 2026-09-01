"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "bare-compounds-age-verified";

export default function AgeGate() {
  const [verified, setVerified] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setVerified(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!verified && dialog && !dialog.open) dialog.showModal();
  }, [verified]);

  function confirmAge() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVerified(true);
  }

  if (verified) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => event.preventDefault()}
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-description"
      aria-modal="true"
      className="m-auto w-[min(92vw,640px)] border border-[var(--bare-rule-strong)] bg-cream p-0 text-ink shadow-2xl backdrop:bg-ink/70 backdrop:backdrop-blur-md"
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
        <p id="age-gate-description" className="lede mt-6">
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
    </dialog>
  );
}
