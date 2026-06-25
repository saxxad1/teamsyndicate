"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  IdCard,
  Save,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Section,
  SelectInput,
  StatCard,
  TableShell,
  TextArea,
  TextInput,
} from "@/components/ui";
import {
  formatDate,
  formatMoney,
  memberContributions,
  memberPaidUpto,
  memberTotals,
  periodLabel,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { Member } from "@/lib/types";

export default function MemberDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    state,
    currentUser,
    summary,
    isAdmin,
    uploadMemberImage,
    updateMember,
    deleteMember,
  } = useStore();
  const member = state.members.find((item) => item.id === params.id);
  const canView = Boolean(currentUser);
  const canEditProfile = isAdmin || currentUser?.memberId === params.id;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({});

  const records = useMemo(
    () => memberContributions(state.contributions, params.id),
    [params.id, state.contributions],
  );
  const totals = memberTotals(state.contributions, state.transactions, params.id);
  const paidUpto = memberPaidUpto(state.contributions, params.id);
  const activeMembers = Math.max(summary.activeMembers, 1);
  const profitShare = summary.totalProfit / activeMembers;

  if (!member || !canView) {
    return null;
  }

  function startEdit() {
    if (!member) return;

    setForm({
      memberCode: member.memberCode ?? "",
      name: member.name,
      designation: member.designation ?? "",
      phone: member.phone,
      email: member.email,
      nid: member.nid ?? "",
      bloodGroup: member.bloodGroup ?? "",
      address: member.address ?? "",
      emergencyContactPhone: member.emergencyContactPhone ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      openingBalance: member.openingBalance ?? 0,
      profileImageUrl: member.profileImageUrl ?? "",
      joinDate: member.joinDate,
      status: member.status,
    });
    setIsEditing(true);
  }

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return;

    updateMember(member.id, form);
    setIsEditing(false);
  }

  return (
    <>
      <PageHeader
        title={member.name}
        description={`${member.memberCode ?? "No ID"} | ${member.email} | ${member.phone}`}
        action={
          <div className="flex gap-2">
            {canEditProfile && !isEditing ? (
              <IconButton
                icon={Edit3}
                label={isAdmin ? "Edit Profile" : "Edit My Info"}
                onClick={startEdit}
              />
            ) : null}
            {isAdmin && !isEditing ? (
              <button
                type="button"
                onClick={() => {
                  deleteMember(member.id);
                  router.replace("/members");
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100"
                title="Delete Member"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            ) : null}
            <Link href="/members">
              <IconButton icon={ArrowLeft} label="Members" variant="secondary" />
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profile balance"
          value={formatMoney(member.openingBalance ?? 0)}
          icon={IdCard}
          tone="sky"
        />
        <StatCard
          label="Total paid"
          value={formatMoney(totals.paid)}
          icon={CircleDollarSign}
          tone="emerald"
        />
        <StatCard
          label="Total due"
          value={formatMoney(totals.due)}
          icon={Banknote}
          tone={totals.due > 0 ? "rose" : "slate"}
        />
        <StatCard label="Paid up to" value={paidUpto} icon={CalendarClock} />
        <StatCard
          label="Profit share"
          value={formatMoney(profitShare)}
          icon={UserRound}
        />
        <StatCard
          label="Join date"
          value={formatDate(member.joinDate)}
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Section title="Profile">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {member.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.profileImageUrl}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10 text-slate-400" />
              )}
            </div>
            {isAdmin ? (
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadMemberImage(member.id, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>

          {isEditing ? (
            <form className="grid gap-4 text-sm sm:grid-cols-2" onSubmit={submitEdit}>
              {isAdmin ? (
                <TextInput
                  label="Member ID"
                  required
                  value={form.memberCode ?? ""}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, memberCode: value }))
                  }
                />
              ) : null}
              <TextInput
                label="Member name"
                required
                value={form.name ?? ""}
                onChange={(value) => setForm((item) => ({ ...item, name: value }))}
              />
              {isAdmin ? (
                <TextInput
                  label="Designation"
                  value={form.designation ?? ""}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, designation: value }))
                  }
                />
              ) : null}
              <TextInput
                label="Phone"
                required
                value={form.phone ?? ""}
                onChange={(value) => setForm((item) => ({ ...item, phone: value }))}
              />
              <TextInput
                label="Email"
                type="email"
                required={isAdmin}
                disabled={!isAdmin}
                value={isAdmin ? (form.email ?? "") : member.email}
                onChange={(value) => setForm((item) => ({ ...item, email: value }))}
              />
              {isAdmin ? (
                <TextInput
                  label="Balance"
                  type="number"
                  value={form.openingBalance ?? 0}
                  onChange={(value) =>
                    setForm((item) => ({
                      ...item,
                      openingBalance: Number(value),
                    }))
                  }
                />
              ) : null}
              <TextInput
                label="NID"
                value={form.nid ?? ""}
                onChange={(value) => setForm((item) => ({ ...item, nid: value }))}
              />
              <TextInput
                label="Blood group"
                value={form.bloodGroup ?? ""}
                onChange={(value) =>
                  setForm((item) => ({ ...item, bloodGroup: value }))
                }
              />
              <TextInput
                label="Emergency phone"
                value={form.emergencyContactPhone ?? ""}
                onChange={(value) =>
                  setForm((item) => ({ ...item, emergencyContactPhone: value }))
                }
              />
              <TextInput
                label="Emergency name"
                value={form.emergencyContactName ?? ""}
                onChange={(value) =>
                  setForm((item) => ({ ...item, emergencyContactName: value }))
                }
              />
              {isAdmin ? (
                <>
                  <TextInput
                    label="Join date"
                    type="date"
                    required
                    value={form.joinDate ?? ""}
                    onChange={(value) =>
                      setForm((item) => ({ ...item, joinDate: value }))
                    }
                  />
                  <SelectInput
                    label="Status"
                    value={form.status ?? "active"}
                    onChange={(value) =>
                      setForm((item) => ({
                        ...item,
                        status: value as Member["status"],
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectInput>
                </>
              ) : null}
              <div className="sm:col-span-2">
                <TextArea
                  label="Address"
                  value={form.address ?? ""}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, address: value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                <IconButton icon={Save} label="Save Changes" type="submit" />
                <IconButton
                  icon={X}
                  label="Cancel"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                />
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Member ID</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.memberCode ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="mt-1 font-medium text-slate-950">{member.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Designation</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.designation ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <Badge tone={member.status === "active" ? "emerald" : "rose"}>
                    {member.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="mt-1 font-medium text-slate-950">{member.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 font-medium text-slate-950">{member.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">NID</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.nid ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Blood group</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.bloodGroup ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Emergency contact</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.emergencyContactPhone ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Emergency name</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.emergencyContactName ?? "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {member.address || "-"}
                </dd>
              </div>
            </dl>
          )}
        </Section>

        <Section title="Payment History">
          {records.length === 0 ? (
            <EmptyState title="No contribution records found." />
          ) : (
            <TableShell>
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-3 font-medium">Month</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 text-right font-medium">
                      Expected
                    </th>
                    <th className="py-3 pr-3 text-right font-medium">Paid</th>
                    <th className="py-3 pr-3 text-right font-medium">Due</th>
                    <th className="py-3 font-medium">Paid date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3 pr-3 font-medium text-slate-950">
                        {periodLabel(record.year, record.month)}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          tone={
                            record.status === "paid"
                              ? "emerald"
                              : record.status === "partial"
                                ? "amber"
                                : "rose"
                          }
                        >
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {formatMoney(record.amount)}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium">
                        {formatMoney(record.paidAmount)}
                      </td>
                      <td className="py-3 pr-3 text-right text-rose-700">
                        {formatMoney(
                          Math.max(record.amount - record.paidAmount, 0),
                        )}
                      </td>
                      <td className="py-3">{formatDate(record.paidDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Section>
      </div>
    </>
  );
}
