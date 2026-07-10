"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
};

export default function CartAuthModal({ open, onAuthenticated, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-auth-title"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/65 px-5 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl border border-[var(--bare-rule-strong)] bg-cream p-8 shadow-2xl md:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Researcher account required</p>
            <h2 id="cart-auth-title" className="display-s mt-6">
              Sign in before adding products.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--bare-rule)] px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-5">
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
            <button
              type="button"
              onClick={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setMessage("");
              }}
              className="nav-link text-ink"
            >
              {mode === "sign-in" ? "Create account" : "Sign in instead"}
            </button>
          </div>
        </form>

        {message ? <p className="caption mt-6 text-ink">{message}</p> : null}
      </div>
    </div>
  );
}
