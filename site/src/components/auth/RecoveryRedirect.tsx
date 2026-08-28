"use client";

import { useEffect } from "react";

export function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));

    if (params.get("access_token") && params.get("refresh_token")) {
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return null;
}
