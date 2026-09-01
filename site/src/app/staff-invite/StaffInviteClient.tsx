"use client";

import { useEffect, useState } from "react";
import AccountAuth from "@/app/account/AccountAuth";

export default function StaffInviteClient() {
  const [token, setToken] = useState<string | null>();

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
    setToken(value);
  }, []);

  if (token === undefined) {
    return <p className="lede">Validating staff invitation…</p>;
  }

  if (token === null) {
    return (
      <div className="border border-[var(--bare-rule)] bg-paper p-8">
        <p className="eyebrow">Invitation required</p>
        <p className="lede mt-4">This staff invitation link is invalid or incomplete.</p>
      </div>
    );
  }

  return <AccountAuth inviteToken={token} redirectTo="/admin" />;
}
