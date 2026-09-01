type ClaimedNotification = {
  id: string;
  lease_token: string;
  recipient_email: string;
  event_type: string;
  payload: Record<string, unknown>;
};

type DeliveryResult = {
  succeeded: boolean;
  retryable: boolean;
  providerMessageId: string | null;
  errorCode: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function safePayloadValue(
  payload: Record<string, unknown>,
  key: string,
  maximumLength: number,
): string | null {
  const value = payload[key];
  if (typeof value !== "string" || value.length === 0) return null;
  return value.slice(0, maximumLength);
}

function buildMessage(notification: ClaimedNotification): {
  subject: string;
  html: string;
  text: string;
} | null {
  if (notification.event_type !== "order_status_changed") return null;

  const orderNumber = safePayloadValue(
    notification.payload,
    "order_number",
    80,
  );
  const paymentStatus = safePayloadValue(
    notification.payload,
    "payment_status",
    80,
  );
  const fulfillmentStatus = safePayloadValue(
    notification.payload,
    "fulfillment_status",
    80,
  );
  if (!orderNumber || (!paymentStatus && !fulfillmentStatus)) return null;

  const statusLines = [
    paymentStatus ? `Payment: ${paymentStatus.replaceAll("_", " ")}` : null,
    fulfillmentStatus
      ? `Fulfillment: ${fulfillmentStatus.replaceAll("_", " ")}`
      : null,
  ].filter((line): line is string => line !== null);
  const escapedLines = statusLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  return {
    subject: `Order ${orderNumber} status update`,
    text: [`Order ${orderNumber}`, ...statusLines].join("\n"),
    html:
      `<p>There is an update for order <strong>${
        escapeHtml(orderNumber)
      }</strong>.</p>` +
      `<ul>${escapedLines}</ul>`,
  };
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secureEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    sha256(left),
    sha256(right),
  ]);
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }
  return difference === 0;
}

async function callRpc(
  supabaseUrl: string,
  serviceRoleKey: string,
  functionName: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      ...jsonHeaders,
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });
}

async function deliverWithResend(
  notification: ClaimedNotification,
  apiKey: string,
  fromEmail: string,
): Promise<DeliveryResult> {
  const message = buildMessage(notification);
  if (!message) {
    return {
      succeeded: false,
      retryable: false,
      providerMessageId: null,
      errorCode: "unsupported_notification_payload",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": notification.id,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notification.recipient_email],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const retryable = response.status === 408 ||
        response.status === 409 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;
      return {
        succeeded: false,
        retryable,
        providerMessageId: null,
        errorCode: `resend_http_${response.status}`,
      };
    }

    const result = (await response.json()) as { id?: unknown };
    if (typeof result.id !== "string" || result.id.length === 0) {
      return {
        succeeded: false,
        retryable: true,
        providerMessageId: null,
        errorCode: "resend_missing_message_id",
      };
    }
    return {
      succeeded: true,
      retryable: false,
      providerMessageId: result.id.slice(0, 500),
      errorCode: "",
    };
  } catch {
    return {
      succeeded: false,
      retryable: true,
      providerMessageId: null,
      errorCode: "resend_network_error",
    };
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !resendApiKey ||
    !resendFromEmail
  ) {
    return jsonResponse({ error: "worker_not_configured" }, 503);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const expectedAuthorization = `Bearer ${serviceRoleKey}`;
  if (!(await secureEqual(authorization, expectedAuthorization))) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let limit = 25;
  try {
    const body = await request.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "limit" in body &&
      Number.isInteger(body.limit) &&
      body.limit >= 1 &&
      body.limit <= 100
    ) {
      limit = body.limit;
    } else if (
      body !== null &&
      typeof body === "object" &&
      "limit" in body
    ) {
      return jsonResponse({ error: "invalid_limit" }, 400);
    }
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  let claimResponse: Response;
  try {
    claimResponse = await callRpc(
      supabaseUrl,
      serviceRoleKey,
      "claim_notification_outbox",
      { p_limit: limit },
    );
  } catch {
    return jsonResponse({ error: "claim_failed" }, 502);
  }
  if (!claimResponse.ok) {
    return jsonResponse({ error: "claim_failed" }, 502);
  }
  let notifications: ClaimedNotification[];
  try {
    const claimed: unknown = await claimResponse.json();
    if (!Array.isArray(claimed)) throw new Error("invalid claim response");
    notifications = claimed as ClaimedNotification[];
  } catch {
    return jsonResponse({ error: "claim_failed" }, 502);
  }

  let sent = 0;
  let deferred = 0;
  let exhausted = 0;
  let completionFailures = 0;
  for (const notification of notifications) {
    const result = await deliverWithResend(
      notification,
      resendApiKey,
      resendFromEmail,
    );
    let completionResponse: Response | null = null;
    try {
      completionResponse = await callRpc(
        supabaseUrl,
        serviceRoleKey,
        "complete_notification_outbox",
        {
          p_id: notification.id,
          p_lease_token: notification.lease_token,
          p_succeeded: result.succeeded,
          p_retryable: result.retryable,
          p_provider_message_id: result.providerMessageId,
          p_error_code: result.errorCode,
        },
      );
    } catch {
      // The lease expires for retry; migration 014 quarantines unresolved
      // deliveries before the provider idempotency window closes.
    }
    if (!completionResponse?.ok) {
      completionFailures += 1;
    } else if (result.succeeded) {
      sent += 1;
    } else if (result.retryable) {
      deferred += 1;
    } else {
      exhausted += 1;
    }
  }

  return jsonResponse({
    claimed: notifications.length,
    sent,
    deferred,
    exhausted,
    completion_failures: completionFailures,
  }, completionFailures > 0 ? 207 : 200);
});
