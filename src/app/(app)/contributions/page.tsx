"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import {
  Badge,
  IconButton,
  PageHeader,
  Section,
  SelectInput,
  TableShell,
  TextInput,
} from "@/components/ui";
import {
  currentPeriod,
  formatMoney,
  groupContributionsByPeriod,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

export default function ContributionsPage() {
  const { state, currentUser, isAdmin, allocatePayment } = useStore();

  // State for Record Payment
  const [paymentMemberId, setPaymentMemberId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(state.settings.monthlyContribution);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  const visibleContributions = useMemo(() => {
    if (currentUser?.role === "member" && currentUser.memberId) {
      return state.contributions.filter(
        (record) => record.memberId === currentUser.memberId,
      );
    }
    return state.contributions;
  }, [currentUser, state.contributions]);

  const periods = groupContributionsByPeriod(visibleContributions);

  function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMemberId) return;
    allocatePayment(paymentMemberId, paymentAmount, paymentDate, paymentMethod as PaymentMethod, paymentNote);
    
    // Reset amount
    setPaymentAmount(state.settings.monthlyContribution);
    setPaymentNote("");
  }

  return (
    <>
      <PageHeader
        title="Monthly Contributions"
        description="Create monthly collection records and track paid, partial, unpaid, and due amounts."
      />

      {isAdmin ? (
        <Section title="Record Payment">
          <form className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6" onSubmit={submitPayment}>
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
              <SelectInput
                label="Member"
                required
                value={paymentMemberId}
                onChange={(value) => setPaymentMemberId(value)}
              >
                <option value="">Select member...</option>
                {state.members
                  .filter((m) => m.status === "active")
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </SelectInput>
            </div>
            <TextInput
              label="Date"
              type="date"
              required
              value={paymentDate}
              onChange={(value) => setPaymentDate(value)}
            />
            <TextInput
              label="Total Amount"
              type="number"
              min="0"
              required
              value={paymentAmount}
              onChange={(value) => setPaymentAmount(Number(value))}
            />
            <SelectInput
              label="Method"
              required
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Mobile Banking">Mobile Banking</option>
            </SelectInput>
            <div className="flex items-end">
              <IconButton icon={Plus} label="Auto Allocate" type="submit" />
            </div>
          </form>
        </Section>
      ) : null}

      <Section title="Contribution Periods">
        <TableShell>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-3 font-medium">Month</th>
                <th className="py-3 pr-3 text-right font-medium">Expected</th>
                <th className="py-3 pr-3 text-right font-medium">Collected</th>
                <th className="py-3 pr-3 font-medium">Paid</th>
                <th className="py-3 pr-3 font-medium">Partial</th>
                <th className="py-3 pr-3 font-medium">Unpaid</th>
                <th className="py-3 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((item) => (
                <tr key={item.key}>
                  <td className="py-3 pr-3 font-semibold text-slate-950">
                    {item.label}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(item.expected)}
                  </td>
                  <td className="py-3 pr-3 text-right font-medium">
                    {formatMoney(item.collected)}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone="emerald">{item.paid}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone="amber">{item.partial}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={item.unpaid > 0 ? "rose" : "slate"}>
                      {item.unpaid}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/contributions/${item.key}`}
                      className="inline-grid h-10 w-10 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                      title="Open"
                      aria-label="Open"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Section>
    </>
  );
}
