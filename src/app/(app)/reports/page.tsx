"use client";

import {
  BarChart3,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  PageHeader,
  Section,
  StatCard,
  TableShell,
} from "@/components/ui";
import {
  formatMoney,
  groupContributionsByPeriod,
  memberTotals,
  sum,
} from "@/lib/finance";
import { useStore } from "@/lib/store";

export default function ReportsPage() {
  const { state, summary, currentUser, isAdmin } = useStore();
  const periodReports = groupContributionsByPeriod(state.contributions);
  const memberRows = state.members.map((member) => ({
    member,
    totals: memberTotals(state.contributions, state.transactions, member.id),
  }));
  const ownRows =
    currentUser?.memberId
      ? memberRows.filter((row) => row.member.id === currentUser.memberId)
      : [];
  const yearly = Object.values(
    state.contributions.reduce<
      Record<string, { year: number; expected: number; collected: number }>
    >((acc, contribution) => {
      const key = String(contribution.year);
      acc[key] ??= { year: contribution.year, expected: 0, collected: 0 };
      acc[key].expected += contribution.amount;
      acc[key].collected += contribution.paidAmount;
      return acc;
    }, {}),
  ).sort((a, b) => b.year - a.year);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Collection, due, project profit/loss, total fund, and yearly report views."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Fund balance"
          value={formatMoney(summary.totalFundBalance)}
          icon={Banknote}
          tone="emerald"
        />
        <StatCard
          label="Total profit"
          value={formatMoney(summary.totalProfit)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Total loss"
          value={formatMoney(summary.totalLoss)}
          icon={TrendingDown}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Monthly Collection Report">
          <TableShell>
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Month</th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Expected
                  </th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Collected
                  </th>
                  <th className="py-3 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodReports.map((period) => (
                  <tr key={period.key}>
                    <td className="py-3 pr-3 font-medium">
                      {period.label}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {formatMoney(period.expected)}
                    </td>
                    <td className="py-3 pr-3 text-right font-medium">
                      {formatMoney(period.collected)}
                    </td>
                    <td className="py-3 text-right text-rose-700">
                      {formatMoney(period.expected - period.collected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Section>

        <Section title={isAdmin ? "Member-wise Payment Report" : "My Payment Report"}>
          <TableShell>
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Member</th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Expected
                  </th>
                  <th className="py-3 pr-3 text-right font-medium">Paid</th>
                  <th className="py-3 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(isAdmin ? memberRows : ownRows).map((row) => (
                  <tr key={row.member.id}>
                    <td className="py-3 pr-3 font-medium">
                      {row.member.name}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {formatMoney(row.totals.expected)}
                    </td>
                    <td className="py-3 pr-3 text-right font-medium">
                      {formatMoney(row.totals.paid)}
                    </td>
                    <td className="py-3 text-right text-rose-700">
                      {formatMoney(row.totals.due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Section>
      </div>

      {isAdmin ? (
        <Section title="Due Report">
          <TableShell>
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Member</th>
                  <th className="py-3 pr-3 font-medium">Phone</th>
                  <th className="py-3 pr-3 text-right font-medium">Due</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberRows
                  .filter((row) => row.totals.due > 0)
                  .map((row) => (
                    <tr key={row.member.id}>
                      <td className="py-3 pr-3 font-medium">
                        {row.member.name}
                      </td>
                      <td className="py-3 pr-3 text-slate-600">
                        {row.member.phone}
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold text-rose-700">
                        {formatMoney(row.totals.due)}
                      </td>
                      <td className="py-3">
                        <Badge tone="rose">Due</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </TableShell>
        </Section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Project-wise Profit/Loss Report">
          {state.projects.length === 0 ? (
            <EmptyState title="No projects found." />
          ) : (
            <TableShell>
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-3 font-medium">Project</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 text-right font-medium">
                      Investment
                    </th>
                    <th className="py-3 pr-3 text-right font-medium">
                      Return
                    </th>
                    <th className="py-3 pr-3 text-right font-medium">Profit</th>
                    <th className="py-3 text-right font-medium">Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.projects.map((project) => (
                    <tr key={project.id}>
                      <td className="py-3 pr-3 font-medium">
                        {project.name}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          tone={project.status === "running" ? "sky" : "slate"}
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {formatMoney(project.investmentAmount)}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {formatMoney(project.actualReturn)}
                      </td>
                      <td className="py-3 pr-3 text-right text-emerald-700">
                        {formatMoney(project.profit)}
                      </td>
                      <td className="py-3 text-right text-rose-700">
                        {formatMoney(project.loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Section>

        <Section title="Yearly Report">
          <TableShell>
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Year</th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Expected
                  </th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Collected
                  </th>
                  <th className="py-3 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearly.map((row) => (
                  <tr key={row.year}>
                    <td className="py-3 pr-3 font-medium">{row.year}</td>
                    <td className="py-3 pr-3 text-right">
                      {formatMoney(row.expected)}
                    </td>
                    <td className="py-3 pr-3 text-right font-medium">
                      {formatMoney(row.collected)}
                    </td>
                    <td className="py-3 text-right text-rose-700">
                      {formatMoney(row.expected - row.collected)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 font-semibold">
                <tr>
                  <td className="py-3 pr-3">Total</td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(sum(yearly.map((row) => row.expected)))}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(sum(yearly.map((row) => row.collected)))}
                  </td>
                  <td className="py-3 text-right text-rose-700">
                    {formatMoney(
                      sum(yearly.map((row) => row.expected - row.collected)),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </TableShell>
        </Section>
      </div>

    </>
  );
}
