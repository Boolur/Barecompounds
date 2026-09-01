import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BATCH_SIZE = 1000;
const MAXIMUM_ROWS = 10000;

function csvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const text = /^[\s\u0000-\u001f\u007f]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

async function collectPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
) {
  const rows: T[] = [];
  for (let from = 0; from < MAXIMUM_ROWS; from += BATCH_SIZE) {
    const { data, error } = await fetchPage(from, from + BATCH_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < BATCH_SIZE) return rows;
  }
  throw new Error("This export exceeds 10,000 rows. Narrow the reporting period.");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const { report } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Reports unavailable." }, { status: 503 });
  const { data: role } = await supabase.rpc("current_app_role");
  if (!role || !["owner", "admin"].includes(role)) {
    return NextResponse.json({ error: "Business manager access required." }, { status: 403 });
  }

  const snapshot = new Date().toISOString();
  let headers: string[];
  let rows: unknown[][];

  try {
    if (report === "payments") {
      const data = await collectPages((from, to) =>
        supabase
          .from("payments")
          .select("id,order_id,method,status,amount_cents,received_amount_cents,transaction_reference,verified_by,verified_at,created_at")
          .lte("created_at", snapshot)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      );
      headers = ["id", "order_id", "method", "status", "amount", "received_amount", "transaction_reference", "verified_by", "verified_at", "created_at"];
      rows = data.map((item) => [
        item.id, item.order_id, item.method, item.status,
        (item.amount_cents / 100).toFixed(2),
        item.received_amount_cents == null ? "" : (item.received_amount_cents / 100).toFixed(2),
        item.transaction_reference, item.verified_by, item.verified_at, item.created_at,
      ]);
    } else if (report === "inventory") {
      const data = await collectPages((from, to) =>
        supabase
          .from("inventory_batches")
          .select("id,product_variant_id,location_id,batch_number,quantity_on_hand,quantity_reserved,low_stock_threshold,expires_at,coa_url,created_at")
          .lte("created_at", snapshot)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      );
      headers = ["id", "variant_id", "location_id", "batch_number", "on_hand", "reserved", "available", "low_stock_threshold", "expires_at", "coa_url", "created_at"];
      rows = data.map((item) => [
        item.id, item.product_variant_id, item.location_id, item.batch_number,
        item.quantity_on_hand, item.quantity_reserved,
        item.quantity_on_hand - item.quantity_reserved,
        item.low_stock_threshold, item.expires_at, item.coa_url, item.created_at,
      ]);
    } else if (report === "customers") {
      const data = await collectPages((from, to) =>
        supabase
          .from("profiles")
          .select("id,full_name,email,contact_email,phone,account_status,created_at")
          .eq("role", "customer")
          .lte("created_at", snapshot)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      );
      headers = ["id", "full_name", "login_email", "contact_email", "phone", "account_status", "created_at"];
      rows = data.map((item) => [item.id, item.full_name, item.email, item.contact_email, item.phone, item.account_status, item.created_at]);
    } else if (report === "affiliates") {
      const data = await collectPages((from, to) =>
        supabase
          .from("affiliate_profiles")
          .select("id,profile_id,name,email,phone,status,commission_rate,created_at")
          .lte("created_at", snapshot)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      );
      headers = ["id", "profile_id", "name", "email", "phone", "status", "commission_rate", "created_at"];
      rows = data.map((item) => [item.id, item.profile_id, item.name, item.email, item.phone, item.status, item.commission_rate, item.created_at]);
    } else {
      return NextResponse.json({ error: "Unknown report." }, { status: 404 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed.";
    return NextResponse.json({ error: message }, { status: message.includes("10,000") ? 413 : 500 });
  }

  const { error: auditError } = await supabase.rpc("admin_record_export", {
    p_report: report,
    p_row_count: rows.length,
    p_snapshot: snapshot,
  });
  if (auditError) {
    return NextResponse.json({ error: "The export could not be audited." }, { status: 500 });
  }

  return new NextResponse(csv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}-${snapshot.slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
