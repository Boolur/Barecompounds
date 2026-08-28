"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("Validating your recovery link…");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Password recovery is not configured.");
      return;
    }

    const client = supabase;
    let active = true;

    async function initializeRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const result =
        accessToken && refreshToken
          ? await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          : await client.auth.getSession();

      if (!active) return;

      setReady(Boolean(result.data.session));
      setMessage(
        result.error
          ? result.error.message
          : result.data.session
            ? ""
            : "This recovery link is invalid or has expired. Request a new link and try again.",
      );

      if (result.data.session && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    void initializeRecoverySession();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || password !== confirmation) {
      setMessage("Passwords must match.");
      return;
    }

    setPending(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setComplete(true);
    setMessage("Your password has been updated. You can now sign in.");
    await supabase.auth.signOut();
  }

  if (complete) {
    return (
      <div className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10">
        <p className="eyebrow">Password updated</p>
        <p className="lede mt-6">{message}</p>
        <Link
          href="/account?next=/admin"
          className="nav-link mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-cream"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--bare-rule)] bg-paper p-8 md:p-10"
    >
      <p className="eyebrow">Choose a new password</p>
      <div className="mt-8 grid gap-5">
        <label className="flex flex-col gap-2">
          <span className="eyebrow">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!ready || pending}
            className="border border-[var(--bare-rule)] bg-cream px-4 py-3 disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="eyebrow">Confirm new password</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!ready || pending}
            className="border border-[var(--bare-rule)] bg-cream px-4 py-3 disabled:opacity-50"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={!ready || pending}
        className="nav-link mt-8 rounded-full bg-ink px-6 py-3 text-cream disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
      {message ? <p className="caption mt-6 text-ink">{message}</p> : null}
    </form>
  );
}
