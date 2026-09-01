"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Dialog } from "@/components/ui/Dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
};

function ModalModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-full border border-[var(--bare-rule)] bg-paper p-1">
      {[
        ["sign-in", "Sign in"],
        ["sign-up", "Create account"],
      ].map(([value, label]) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value as Mode)}
            aria-pressed={active}
            className={`nav-link rounded-full px-4 py-3 transition-all duration-300 ${
              active
                ? "bg-ink text-cream shadow-[0_8px_20px_rgba(10,10,10,0.14)]"
                : "text-smoke hover:bg-cream hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function CartAuthModal({ open, onAuthenticated, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Supabase auth is not configured yet.");
      return;
    }

    setPending(true);
    setMessage("");

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setPending(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data.user) {
      onAuthenticated(result.data.user);
      onClose();
      return;
    }

    setMessage("Check your email to confirm the account, then sign in.");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "sign-in" ? "Sign in before adding products." : "Create an account to continue."}
      description="A researcher account is required to add products to the cart."
      className="max-h-[90vh] overflow-y-auto"
    >
      <div>
        <div>
          <ModalModeToggle
            mode={mode}
            setMode={(nextMode) => {
              setMode(nextMode);
              setMessage("");
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="border border-[var(--bare-rule)] bg-paper px-4 py-3"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="border border-[var(--bare-rule)] bg-paper px-4 py-3"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="nav-link rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
            >
              {pending
                ? "Working..."
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </button>
            <span className="caption">
              {mode === "sign-in"
                ? "Use your researcher account to shop."
                : "Already have an account? Switch to sign in above."}
            </span>
          </div>
        </form>

        {message ? <p role="status" aria-live="polite" className="caption mt-6 text-ink">{message}</p> : null}
      </div>
    </Dialog>
  );
}
