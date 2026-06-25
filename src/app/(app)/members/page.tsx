"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit3, Eye, Plus, Trash2, UserRound, X } from "lucide-react";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Section,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui";
import { formatMoney, memberTotals } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { Member } from "@/lib/types";
import { today } from "@/lib/utils";

type MemberForm = Omit<Member, "id" | "createdAt">;

const blankForm: MemberForm = {
  memberCode: "",
  name: "",
  designation: "",
  phone: "",
  email: "",
  nid: "",
  bloodGroup: "",
  address: "",
  emergencyContactPhone: "",
  emergencyContactName: "",
  openingBalance: 0,
  profileImageUrl: "",
  joinDate: today(),
  status: "active",
};

export default function MembersPage() {
  const { state, isAdmin, addMember, deleteMember } = useStore();
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(blankForm);

  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? state.members.filter((member) =>
          [
            member.memberCode,
            member.name,
            member.designation,
            member.phone,
            member.email,
            member.nid,
          ].some((value) => (value ?? "").toLowerCase().includes(q)),
        )
      : state.members;

    return [...rows].sort(
      (a, b) => Number(a.memberCode ?? 0) - Number(b.memberCode ?? 0),
    );
  }, [query, state.members]);

  function cancelForm() {
    setIsAdding(false);
    setForm(blankForm);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addMember(form);
    cancelForm();
  }

  return (
    <>
      <PageHeader
        title="Members"
        description="Member profile, status, paid amount, due amount, and payment history."
        action={
          isAdmin && !isAdding ? (
            <IconButton
              icon={Plus}
              label="Add Member"
              onClick={() => setIsAdding(true)}
            />
          ) : null
        }
      />

      {isAdmin && isAdding ? (
        <Section title="Add Member">
          <form className="grid gap-4 lg:grid-cols-6" onSubmit={submit}>
          <TextInput
            label="Member ID"
            required
            value={form.memberCode ?? ""}
            onChange={(value) =>
              setForm((item) => ({ ...item, memberCode: value }))
            }
          />
          <div className="lg:col-span-2">
            <TextInput
              label="Member name"
              required
              value={form.name}
              onChange={(value) => setForm((item) => ({ ...item, name: value }))}
            />
          </div>
          <TextInput
            label="Designation"
            value={form.designation ?? ""}
            onChange={(value) =>
              setForm((item) => ({ ...item, designation: value }))
            }
          />
          <TextInput
            label="Phone"
            required
            value={form.phone}
            onChange={(value) => setForm((item) => ({ ...item, phone: value }))}
          />
          <TextInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(value) => setForm((item) => ({ ...item, email: value }))}
          />
          <TextInput
            label="Balance"
            type="number"
            value={form.openingBalance ?? 0}
            onChange={(value) =>
              setForm((item) => ({ ...item, openingBalance: Number(value) }))
            }
          />
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
          <TextInput
            label="Join date"
            type="date"
            required
            value={form.joinDate}
            onChange={(value) =>
              setForm((item) => ({ ...item, joinDate: value }))
            }
          />
          <SelectInput
            label="Status"
            value={form.status}
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
          <div className="lg:col-span-3">
            <TextInput
              label="Profile image URL"
              value={form.profileImageUrl ?? ""}
              onChange={(value) =>
                setForm((item) => ({ ...item, profileImageUrl: value }))
              }
            />
          </div>
          <div className="lg:col-span-3">
            <TextArea
              label="Address"
              value={form.address ?? ""}
              onChange={(value) =>
                setForm((item) => ({ ...item, address: value }))
              }
            />
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-6 [&>button]:w-full sm:[&>button]:w-auto">
            <IconButton icon={Plus} label="Add" type="submit" />
            <IconButton
              icon={X}
              label="Cancel"
              variant="secondary"
              onClick={cancelForm}
            />
          </div>
        </form>
      </Section>
      ) : null}

      <Section
        title="Member List"
        action={
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 sm:w-64"
          />
        }
      >
        {members.length === 0 ? (
          <EmptyState title="No members found." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const totals = memberTotals(state.contributions, state.transactions, member.id);

              return (
                <article
                  key={member.id}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          {member.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.profileImageUrl}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h2 className="font-semibold text-slate-950">
                            {member.name}
                          </h2>
                          <p className="mt-0.5 break-all text-sm text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Badge tone={member.status === "active" ? "emerald" : "rose"}>
                        {member.status}
                      </Badge>
                    </div>
                    
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-slate-500">Designation</dt>
                        <dd className="mt-1 font-medium text-slate-900">{member.designation || "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="mt-1 font-medium text-slate-900">{member.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Balance</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {formatMoney(member.openingBalance ?? 0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Paid</dt>
                        <dd className="mt-1 font-medium text-emerald-700">
                          {formatMoney(totals.paid)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Due</dt>
                        <dd className="mt-1 font-medium text-rose-700">
                          {formatMoney(totals.due)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 [&>a]:flex-1 [&>button]:flex-1 sm:[&>a]:flex-none sm:[&>button]:flex-none">
                    <Link
                      href={`/members/${member.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {isAdmin ? (
                      <>
                        <Link
                          href={`/members/${member.id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 font-medium text-rose-700 hover:bg-rose-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
