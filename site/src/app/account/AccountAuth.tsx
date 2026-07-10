"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export default function AccountAuth() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable auth.");
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

    setMessage(
      mode === "sign-up"
        ? "Account created. Check email confirmation settings in Supabase if login is pending."
        : "Signed in."
    );
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setMessage("Signed out.");
  }

  if (user) {
    return (
      <div className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10">
        <p className="eyebrow">Signed in</p>
        <h2 className="display-s mt-8">{user.email}</h2>
        <p className="lede mt-6">
          Researcher profile, saved addresses, order history, and quick reorder
          will attach to this Supabase user account.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="nav-link mt-8 rounded-full border border-[var(--bare-rule-strong)] px-6 py-3"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="border border-[var(--bare-rule)] bg-paper p-8 md:col-span-7 md:p-10"
      >
        <p className="eyebrow">{mode === "sign-in" ? "Sign in" : "Create account"}</p>
        <div className="mt-8 grid grid-cols-1 gap-5">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
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
              className="border border-[var(--bare-rule)] bg-cream px-4 py-3"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="nav-link mt-8 rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
        >
          {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
        {message ? <p className="caption mt-6 text-ink">{message}</p> : null}
      </form>

      <aside className="md:col-span-5">
        <div className="border border-[var(--bare-rule)] bg-cream p-8 md:p-10">
          <p className="eyebrow">Researcher access</p>
          <p className="lede mt-6">
            Use Supabase Auth for login now. Profile details, addresses, and
            order history are ready for the next account dashboard pass.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setMessage("");
            }}
            className="nav-link mt-8 text-ink"
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </aside>
    </div>
  );
}
