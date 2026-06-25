"use client";

import Link from "next/link";
import { Banknote, ReceiptText, Users } from "lucide-react";
import { PageHeader, Section, StatCard, TableShell } from "@/components/ui";
import {
  currentPeriod,
  formatDate,
  formatMoney,
  memberName,
  memberTotals,
  periodLabel,
  recentTransactions,
} from "@/lib/finance";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const { state, summary, currentUser } = useStore();
  const period = currentPeriod();

  const membersWithDues = state.members
    .filter((m) => m.status === "active")
    .map((m) => {
      const totals = memberTotals(state.contributions, state.transactions, m.id);
      return { ...m, due: totals.due };
    })
    .filter((m) => m.due > 0)
    .sort((a, b) => b.due - a.due);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${periodLabel(period.year, period.month)} collection and fund position.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total fund balance"
          value={formatMoney(summary.totalFundBalance)}
          icon={Banknote}
          tone="emerald"
        />
        <StatCard
          label="Members"
          value={summary.totalMembers.toString()}
          icon={Users}
        />
        <StatCard
          label="Projects"
          value={`${summary.runningProjects} running / ${summary.closedProjects} closed`}
          icon={ReceiptText}
          tone="sky"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col gap-4">
          <Section title="Monthly Status">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Paid</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-900">
                  {summary.thisMonthPaidMembers}
                </p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Partial</p>
                <p className="mt-2 text-3xl font-semibold text-amber-900">
                  {summary.thisMonthPartialMembers}
                </p>
              </div>
              <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Unpaid</p>
                <p className="mt-2 text-3xl font-semibold text-rose-900">
                  {summary.thisMonthUnpaidMembers}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Outstanding Dues">
            {membersWithDues.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">No members have outstanding dues.</p>
            ) : (
              <div className="flex max-h-[400px] flex-col gap-1 overflow-y-auto pr-2">
                {membersWithDues.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center gap-3">
                      {member.profileImageUrl ? (
                        <img
                          src={member.profileImageUrl}
                          alt={member.name}
                          className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400">
                          <Users className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.phone}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-rose-600">
                      {formatMoney(member.due)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <Section
          title="Recent Transactions"
          action={
            currentUser?.role === "admin" ? (
              <Link
                href="/transactions"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View all
              </Link>
            ) : null
          }
        >
          <div className="grid gap-3 sm:hidden">
            {recentTransactions(state.transactions, 10).map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">
                      {transaction.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {memberName(state.members, transaction.memberId)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-950">
                    {formatMoney(transaction.amount)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(transaction.date)}
                </p>
              </article>
            ))}
          </div>

          <TableShell className="hidden sm:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Date</th>
                  <th className="py-3 pr-3 font-medium">Type</th>
                  <th className="py-3 pr-3 font-medium">Member</th>
                  <th className="py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions(state.transactions, 10).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="py-3 pr-3 text-slate-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="py-3 pr-3 font-medium text-slate-900">
                      {transaction.type}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {memberName(state.members, transaction.memberId)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-950">
                      {formatMoney(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Section>
      </div>
    </>
  );
}
