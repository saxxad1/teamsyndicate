import type {
  AppState,
  Contribution,
  Member,
  Project,
  Summary,
  Transaction,
} from "./types";

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))} BDT`;
}

export function formatDate(date?: string) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function periodKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function periodLabel(year: number, month: number) {
  return `${monthNames[month - 1]} ${year}`;
}

export function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function sum(numbers: number[]) {
  return numbers.reduce((total, value) => total + (Number(value) || 0), 0);
}

export function projectFinancials(input: {
  investmentAmount: number;
  actualReturn: number;
  expense: number;
  status: Project["status"];
}) {
  const net =
    Number(input.actualReturn || 0) -
    Number(input.investmentAmount || 0) -
    Number(input.expense || 0);

  if (input.status === "running" && Number(input.actualReturn || 0) === 0) {
    return { profit: 0, loss: 0 };
  }

  return {
    profit: Math.max(net, 0),
    loss: Math.max(-net, 0),
  };
}

export function memberContributions(
  contributions: Contribution[],
  memberId: string,
) {
  const existing = contributions
    .filter((contribution) => contribution.memberId === memberId);

  const current = currentPeriod();
  const virtual: Contribution[] = [];
  
  let m = 5;
  let y = 2026;

  while (y < current.year || (y === current.year && m <= current.month)) {
    const exists = existing.some(c => c.month === m && c.year === y);
    if (!exists) {
      virtual.push({
        id: `virtual-${y}-${m}`,
        memberId,
        month: m,
        year: y,
        amount: (m === 5 && y === 2026) ? 5000 : 2000,
        paidAmount: 0,
        status: "unpaid",
        createdAt: new Date().toISOString(),
        createdBy: "system"
      });
    }
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return [...existing, ...virtual].sort((a, b) =>
    periodKey(b.year, b.month).localeCompare(periodKey(a.year, a.month)),
  );
}

export function memberPaidUpto(contributions: Contribution[], memberId: string) {
  const records = memberContributions(contributions, memberId);
  const paidRecords = records.filter(r => r.status === "paid");
  
  if (paidRecords.length === 0) return "None";
  
  const mostRecentPaid = paidRecords[0];
  return periodLabel(mostRecentPaid.year, mostRecentPaid.month);
}

export function memberTotals(
  contributions: Contribution[],
  transactions: Transaction[],
  memberId: string
) {
  const records = memberContributions(contributions, memberId);
  const expected = sum(records.map((record) => record.amount));
  
  const memberTxs = transactions.filter(tx => tx.memberId === memberId && tx.type === "Member Contribution");
  const paid = sum(memberTxs.map((tx) => tx.amount));

  return {
    expected,
    paid,
    due: Math.max(expected - paid, 0),
  };
}

export function groupContributionsByPeriod(contributions: Contribution[]) {
  const groups = new Map<string, Contribution[]>();

  for (const contribution of contributions) {
    const key = periodKey(contribution.year, contribution.month);
    groups.set(key, [...(groups.get(key) ?? []), contribution]);
  }

  const current = currentPeriod();
  const currentKey = periodKey(current.year, current.month);

  return [...groups.entries()]
    .filter(([key]) => key <= currentKey)
    .map(([key, records]) => {
      const { year, month } = parsePeriodKey(key);

      return {
        key,
        year,
        month,
        label: periodLabel(year, month),
        records,
        expected: sum(records.map((record) => record.amount)),
        collected: sum(records.map((record) => record.paidAmount)),
        paid: records.filter((record) => record.status === "paid").length,
        partial: records.filter((record) => record.status === "partial").length,
        unpaid: records.filter((record) => record.status === "unpaid").length,
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function manualTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.source === "manual");
}

export function calculateSummary(state: AppState): Summary {
  const { month, year } = currentPeriod();
  const monthRecords = state.contributions.filter(
    (record) => record.month === month && record.year === year,
  );
  const manual = manualTransactions(state.transactions);
  const totalCollected = sum(
    state.contributions.map((contribution) => contribution.paidAmount),
  );
  const totalInvestment = sum(
    state.projects.map((project) => project.investmentAmount),
  ) + sum(manual.filter((tx) => tx.type === "Investment").map((tx) => tx.amount));
  const totalProjectReturns = sum(
    state.projects.map((project) => project.actualReturn),
  ) + sum(manual.filter((tx) => tx.type === "Project Return").map((tx) => tx.amount));
  const totalProjectExpense = sum(
    state.projects.map((project) => project.expense),
  ) + sum(manual.filter((tx) => tx.type === "Project Expense").map((tx) => tx.amount));
  const totalProfit =
    sum(state.projects.map((project) => project.profit)) +
    sum(manual.filter((tx) => tx.type === "Profit").map((tx) => tx.amount));
  const totalLoss =
    sum(state.projects.map((project) => project.loss)) +
    sum(manual.filter((tx) => tx.type === "Loss").map((tx) => tx.amount));
  const otherIncome = sum(
    manual.filter((tx) => tx.type === "Other Income").map((tx) => tx.amount),
  );
  const otherExpense = sum(
    manual.filter((tx) => tx.type === "Other Expense").map((tx) => tx.amount),
  );

  return {
    totalMembers: state.members.length,
    activeMembers: state.members.filter((member) => member.status === "active")
      .length,
    totalFundBalance:
      totalCollected +
      totalProjectReturns +
      otherIncome -
      totalInvestment -
      totalProjectExpense -
      totalLoss -
      otherExpense,
    totalCollected,
    totalInvestment,
    totalProjectReturns,
    totalProjectExpense,
    totalProfit,
    totalLoss,
    otherIncome,
    otherExpense,
    thisMonthTotalCollection: sum(
      monthRecords.map((record) => record.paidAmount),
    ),
    thisMonthPaidMembers: monthRecords.filter(
      (record) => record.status === "paid",
    ).length,
    thisMonthPartialMembers: monthRecords.filter(
      (record) => record.status === "partial",
    ).length,
    thisMonthUnpaidMembers: monthRecords.filter(
      (record) => record.status === "unpaid",
    ).length,
    runningProjects: state.projects.filter(
      (project) => project.status === "running",
    ).length,
    closedProjects: state.projects.filter(
      (project) => project.status === "closed",
    ).length,
  };
}

export function recentTransactions(transactions: Transaction[], limit = 8) {
  return [...transactions]
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      return byDate === 0 ? b.createdAt.localeCompare(a.createdAt) : byDate;
    })
    .slice(0, limit);
}

export function memberName(members: Member[], memberId?: string) {
  if (!memberId) return "-";
  return members.find((member) => member.id === memberId)?.name ?? "-";
}

export function projectName(projects: Project[], projectId?: string) {
  if (!projectId) return "-";
  return projects.find((project) => project.id === projectId)?.name ?? "-";
}
