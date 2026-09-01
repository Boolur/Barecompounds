"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";
type OrderRow = {
  id: string;
  order_number: string;
  payment_status: string;
  fulfillment_status: string;
};

function AuthModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-full border border-[var(--bare-rule)] bg-cream p-1">
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
                : "text-smoke hover:bg-paper hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function AccountAuth({
  redirectTo,
  inviteToken,
}: {
  redirectTo?: string;
  inviteToken?: string;
}) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const invitationAttempted = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      setOrders([]);
      return;
    }

    supabase
      .from("orders")
      .select("id,order_number,payment_status,fulfillment_status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user || !inviteToken || invitationAttempted.current) return;
    invitationAttempted.current = true;
    setPending(true);
    setMessage("Accepting your staff invitation…");
    supabase.rpc("claim_staff_invitation", { p_token: inviteToken }).then(({ error }) => {
      setPending(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      window.history.replaceState(null, "", "/account");
      window.location.assign("/admin");
    });
  }, [inviteToken, supabase, user]);

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

    if (mode === "sign-in" && result.data.session) {
      if (inviteToken) {
        setUser(result.data.user);
        setMessage("Accepting your staff invitation…");
        return;
      }
      window.location.assign(redirectTo ?? "/account");
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

  async function handlePasswordRecovery() {
    if (!supabase || !email.trim()) {
      setMessage("Enter your account email first.");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    setMessage(
      error
        ? error.message
        : "If the account exists, a password recovery email is on its way.",
    );
  }

  async function handleConfirmationResend() {
    if (!supabase || !email.trim()) {
      setMessage("Enter the signup email first.");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setPending(false);
    setMessage(
      error
        ? error.message
        : "If confirmation is pending, a new verification email is on its way.",
    );
  }

  if (user) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <section className="border border-[var(--bare-rule)] bg-paper p-8 md:col-span-5 md:p-10">
          <p className="eyebrow">Signed in</p>
          <h2 className="display-s mt-8">{user.email}</h2>
          <p className="lede mt-6">
            Researcher profile, saved addresses, order history, and quick
            reorder attach to this Supabase account as the backend matures.
          </p>
          {message ? <p className="caption mt-6 text-ink">{message}</p> : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="nav-link mt-8 rounded-full border border-[var(--bare-rule-strong)] px-6 py-3"
          >
            Sign out
          </button>
        </section>

        <section className="md:col-span-7">
          <div className="grid grid-cols-1 gap-px bg-[var(--bare-rule)] sm:grid-cols-3">
            {[
              ["Profile", user.email ?? "Email pending"],
              ["Addresses", "Billing + shipping next"],
              ["Quick reorder", "Saved orders ready"],
            ].map(([label, value]) => (
              <article key={label} className="bg-paper p-6">
                <p className="eyebrow">{label}</p>
                <p className="mt-6 font-serif text-2xl tracking-[-0.02em]">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 border border-[var(--bare-rule)] bg-cream p-6">
            <p className="eyebrow">Order history</p>
            {orders.length > 0 ? (
              <ul className="mt-6 divide-y divide-[var(--bare-rule)]">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-col gap-2 py-4 md:flex-row md:items-baseline md:justify-between"
                  >
                    <span className="font-mono text-sm">
                      {order.order_number}
                    </span>
                    <span className="caption">
                      {order.payment_status} · {order.fulfillment_status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lede mt-6">
                No account-linked orders yet. Guest checkout orders can be
                attached to accounts in a later admin workflow.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="border border-[var(--bare-rule)] bg-paper p-8 md:col-span-7 md:p-10"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow">
            {mode === "sign-in" ? "Welcome back" : "Researcher access"}
          </p>
          <div className="w-full sm:w-[360px]">
            <AuthModeToggle
              mode={mode}
              setMode={(nextMode) => {
                setMode(nextMode);
                setMessage("");
              }}
            />
          </div>
        </div>
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
        <div className="mt-5 flex flex-wrap gap-5">
          {mode === "sign-in" ? (
            <button
              type="button"
              disabled={pending}
              onClick={handlePasswordRecovery}
              className="nav-link disabled:opacity-50"
            >
              Reset password
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleConfirmationResend}
              className="nav-link disabled:opacity-50"
            >
              Resend confirmation
            </button>
          )}
        </div>
        {message ? <p className="caption mt-6 text-ink">{message}</p> : null}
      </form>

      <aside className="md:col-span-5">
        <div className="border border-[var(--bare-rule)] bg-cream p-8 md:p-10">
          <p className="eyebrow">
            {mode === "sign-in" ? "Need access?" : "Already approved?"}
          </p>
          <p className="lede mt-6">
            {mode === "sign-in"
              ? "Create a researcher account to shop, submit checkout, and build order history."
              : "Return to sign in if you already have a Bare Compounds researcher account."}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setMessage("");
            }}
            className="nav-link mt-8 inline-flex rounded-full border border-[var(--bare-rule-strong)] px-5 py-3 text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            {mode === "sign-in"
              ? "Create account"
              : "Sign in instead"}
          </button>
        </div>
      </aside>
    </div>
  );
}
