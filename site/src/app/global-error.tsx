"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          style={{
            alignItems: "center",
            background: "#f4efe6",
            color: "#0a0a0a",
            display: "flex",
            minHeight: "100vh",
            padding: "2rem",
          }}
        >
          <section role="alert" style={{ margin: "auto", maxWidth: "42rem" }}>
            <p>System error</p>
            <h1>The application could not load.</h1>
            <p>Please retry. If the problem continues, contact support.</p>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
