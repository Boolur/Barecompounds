import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, TableCell, TableHead, TableHeader } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  RevokeInvitationForm,
  StaffInvitationForm,
  StaffRoleForm,
} from "@/components/admin/StaffManagementForms";

export const metadata = { title: "Staff | Admin" };

export default async function AdminStaffPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <InlineAlert tone="critical" title="Staff unavailable">Supabase is not configured.</InlineAlert>;
  const { data: role } = await supabase.rpc("current_app_role");

  if (role !== "owner") {
    return (
      <>
        <PageHeader
          eyebrow="Owner operations"
          title="Staff"
          description="Staff invitations and role changes are restricted to owners."
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Staff" }]}
        />
        <div className="p-5 md:p-8">
          <InlineAlert title="Owner permission required">Only owners can view staff membership, create invitations, or change access levels.</InlineAlert>
        </div>
      </>
    );
  }

  const [profilesResult, invitationsResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role,account_status,created_at").neq("role", "customer").order("created_at"),
    supabase.from("staff_invitations").select("id,email,invited_role,status,expires_at,created_at").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Owner operations"
        title="Staff"
        description="Invite operators, assign least-privilege access, and retain at least one owner at all times."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Staff" }]}
      />
      <div className="space-y-8 p-5 md:p-8">
        <section className="border border-[var(--bare-rule)] bg-paper p-6">
          <p className="eyebrow">Invite staff</p>
          <h2 className="display-s mt-3">Create a secure invitation</h2>
          <p className="lede mt-4">Send the generated private link to the exact email address entered below. The recipient must sign in with that address.</p>
          <div className="mt-6"><StaffInvitationForm /></div>
        </section>

        <section>
          <p className="eyebrow">Current access</p>
          <h2 className="display-s mt-3">Staff accounts</h2>
          <div className="mt-6">
            <DataTable caption="Staff accounts">
              <TableHead>
                <TableHeader>Staff member</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Account</TableHeader>
                <TableHeader>Manage</TableHeader>
              </TableHead>
              <tbody>
                {(profilesResult.data ?? []).map((profile) => (
                  <tr key={profile.id}>
                    <TableCell>{profile.full_name ?? "Name not provided"}</TableCell>
                    <TableCell>{profile.email ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={profile.role} /></TableCell>
                    <TableCell><StatusBadge status={profile.account_status} /></TableCell>
                    <TableCell>
                      <details>
                        <summary className="nav-link cursor-pointer">Change role</summary>
                        <div className="mt-4 min-w-72"><StaffRoleForm profileId={profile.id} currentRole={profile.role} /></div>
                      </details>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </section>

        <section>
          <p className="eyebrow">Invitation history</p>
          <h2 className="display-s mt-3">Pending and completed invitations</h2>
          <div className="mt-6">
            <DataTable caption="Staff invitations">
              <TableHead>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Expires</TableHeader>
                <TableHeader><span className="sr-only">Actions</span></TableHeader>
              </TableHead>
              <tbody>
                {(invitationsResult.data ?? []).map((invitation) => (
                  <tr key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell><StatusBadge status={invitation.invited_role} /></TableCell>
                    <TableCell><StatusBadge status={invitation.status} /></TableCell>
                    <TableCell>{new Date(invitation.expires_at).toLocaleString()}</TableCell>
                    <TableCell>{invitation.status === "pending" ? <RevokeInvitationForm invitationId={invitation.id} /> : "—"}</TableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </section>
      </div>
    </>
  );
}
