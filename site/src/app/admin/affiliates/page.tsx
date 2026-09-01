import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { EmptyState, InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  AffiliateProfileForm,
  InquiryReviewForm,
  PromoCodeForm,
  ReferralPayoutForm,
} from "@/components/admin/AffiliateForms";

export const metadata = { title: "Affiliates | Admin" };

export default async function AdminAffiliatesPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <InlineAlert tone="critical" title="Affiliates unavailable">Supabase is not configured.</InlineAlert>;
  const [{ data: role }, inquiriesResult, profilesResult, promosResult, referralsResult] = await Promise.all([
    supabase.rpc("current_app_role"),
    supabase.from("affiliate_inquiries").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("affiliate_profiles").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("affiliate_referrals").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  const canManage = role === "admin" || role === "owner";
  const canRead = canManage;
  const profiles = profilesResult.data ?? [];
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.name]));

  if (!canRead) {
    return (
      <>
        <PageHeader eyebrow="Owner operations" title="Affiliates" description="Affiliate operations are limited to business managers." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Affiliates" }]} />
        <div className="p-5 md:p-8"><InlineAlert title="Affiliate access denied">Your role does not include affiliate records.</InlineAlert></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Growth operations"
        title="Affiliates"
        description="Review applicants, manage partner status and commission rates, issue promo codes, and reconcile referral payouts."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Affiliates" }]}
      />
      <div className="space-y-10 p-5 md:p-8">
        <section>
          <p className="eyebrow">Applications</p><h2 className="display-s mt-3">Affiliate inquiries</h2>
          <div className="mt-6">
            {(inquiriesResult.data ?? []).length ? (
              <DataTable caption="Affiliate inquiries">
                <TableHead><TableHeader>Applicant</TableHeader><TableHeader>Audience</TableHeader><TableHeader>Message</TableHeader><TableHeader>Status</TableHeader><TableHeader>Review</TableHeader></TableHead>
                <tbody>
                  {(inquiriesResult.data ?? []).map((inquiry) => (
                    <tr key={inquiry.id}>
                      <TableCell><p>{inquiry.name}</p><p className="caption mt-1">{inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ""}</p></TableCell>
                      <TableCell>{inquiry.audience ?? "—"}</TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap">{inquiry.message ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={inquiry.status} /></TableCell>
                      <TableCell>{canManage ? <InquiryReviewForm inquiryId={inquiry.id} status={inquiry.status} /> : "Read only"}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : <EmptyState title="No affiliate inquiries" description="New applications will appear here." />}
          </div>
        </section>

        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Partners</p><h2 className="display-s mt-3">Affiliate profiles</h2>
          {canManage ? <div className="mt-6"><AffiliateProfileForm /></div> : null}
          <div className="mt-6 space-y-3">
            {profiles.map((profile) => (
              <details key={profile.id} className="border-t border-[var(--bare-rule)] pt-3">
                <summary className="cursor-pointer"><span className="font-medium">{profile.name}</span> · {profile.email} · {profile.status} · {profile.commission_rate}%</summary>
                {canManage ? <div className="mt-4"><AffiliateProfileForm affiliate={profile} /></div> : null}
              </details>
            ))}
          </div>
        </section>

        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Attribution</p><h2 className="display-s mt-3">Promo codes</h2>
          {canManage ? <div className="mt-6"><PromoCodeForm affiliates={profiles} /></div> : null}
          <div className="mt-6 space-y-3">
            {(promosResult.data ?? []).map((promo) => (
              <details key={promo.id} className="border-t border-[var(--bare-rule)] pt-3">
                <summary className="cursor-pointer font-mono">{promo.code} · {promo.is_active ? "Active" : "Inactive"} · {profileNames.get(promo.affiliate_profile_id ?? "") ?? "No affiliate"}</summary>
                {canManage ? <div className="mt-4"><PromoCodeForm affiliates={profiles} promo={promo} /></div> : null}
              </details>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow">Commissions</p><h2 className="display-s mt-3">Referral payouts</h2>
          <div className="mt-6">
            {(referralsResult.data ?? []).length ? (
              <DataTable caption="Affiliate referral payouts">
                <TableHead><TableHeader>Affiliate</TableHeader><TableHeader>Sale</TableHeader><TableHeader>Commission</TableHeader><TableHeader>Status</TableHeader><TableHeader>Manage</TableHeader></TableHead>
                <tbody>
                  {(referralsResult.data ?? []).map((referral) => (
                    <tr key={referral.id}>
                      <TableCell>{profileNames.get(referral.affiliate_profile_id) ?? referral.affiliate_profile_id}</TableCell>
                      <TableCell>${(referral.sale_cents / 100).toFixed(2)}</TableCell>
                      <TableCell>${(referral.commission_cents / 100).toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={referral.payout_status} /></TableCell>
                      <TableCell>{role === "owner" ? <ReferralPayoutForm referralId={referral.id} status={referral.payout_status} /> : "Owner approval required"}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : <EmptyState title="No affiliate referrals" description="Attributed orders will generate referral records here once promo application is connected to checkout." />}
          </div>
        </section>
      </div>
    </>
  );
}
