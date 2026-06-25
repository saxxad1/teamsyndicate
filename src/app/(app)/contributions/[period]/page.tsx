"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import {
  Badge,
  EmptyState,
  PageHeader,
  Section,
  TableShell,
} from "@/components/ui";
import {
  formatMoney,
  memberName,
  parsePeriodKey,
  periodLabel,
  sum,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import {
  paymentMethods,
  type Contribution,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/types";

export default function ContributionDetailsPage() {
  const params = useParams<{ period: string }>();
  const { state, currentUser, isAdmin, updateContribution } = useStore();
  const { year, month } = parsePeriodKey(params.period);

  const records = useMemo(() => {
    const all = state.contributions.filter(
      (record) => record.year === year && record.month === month,
    );

    if (currentUser?.role === "member" && currentUser.memberId) {
      return all.filter((record) => record.memberId === currentUser.memberId);
    }

    return all;
  }, [currentUser, month, state.contributions, year]);

  const expected = sum(records.map((record) => record.amount));
  const collected = sum(records.map((record) => record.paidAmount));
  const due = Math.max(expected - collected, 0);

  function patch(id: string, updates: Partial<Contribution>) {
    updateContribution(id, updates);
  }

  return (
    <>
      <PageHeader
        title={periodLabel(year, month)}
        description="Contribution details by member."
        action={
          <Link
            href="/contributions"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Expected</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(expected)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Collected</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {formatMoney(collected)}
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">Due</p>
          <p className="mt-2 text-2xl font-semibold text-rose-950">
            {formatMoney(due)}
          </p>
        </div>
      </div>

      <Section title="Members">
        {records.length === 0 ? (
          <EmptyState title="No records for this period." />
        ) : (
          <>
            <div className="grid gap-3 sm:hidden">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">
                        {memberName(state.members, record.memberId)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Expected {formatMoney(record.amount)}
                      </p>
                    </div>
                    {isAdmin ? (
                      <select
                        defaultValue={record.status}
                        onChange={(event) =>
                          patch(record.id, {
                            status: event.target.value as PaymentStatus,
                          })
                        }
                        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base"
                      >
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    ) : (
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
                    )}
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Paid amount
                      </span>
                      {isAdmin ? (
                        <input
                          type="number"
                          defaultValue={record.paidAmount}
                          min={0}
                          max={record.amount}
                          onBlur={(event) =>
                            patch(record.id, {
                              paidAmount: Number(event.target.value),
                              status:
                                Number(event.target.value) >= record.amount
                                  ? "paid"
                                  : Number(event.target.value) > 0
                                    ? "partial"
                                    : "unpaid",
                            })
                          }
                          className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base"
                        />
                      ) : (
                        <span className="mt-1 block font-medium">
                          {formatMoney(record.paidAmount)}
                        </span>
                      )}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Paid date
                      </span>
                      {isAdmin ? (
                        <input
                          type="date"
                          defaultValue={record.paidDate}
                          onBlur={(event) =>
                            patch(record.id, { paidDate: event.target.value })
                          }
                          className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base"
                        />
                      ) : (
                        <span className="mt-1 block">
                          {record.paidDate || "-"}
                        </span>
                      )}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Method
                      </span>
                      {isAdmin ? (
                        <select
                          defaultValue={record.paymentMethod ?? "Cash"}
                          onChange={(event) =>
                            patch(record.id, {
                              paymentMethod: event.target.value as PaymentMethod,
                            })
                          }
                          className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                        >
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="mt-1 block">
                          {record.paymentMethod ?? "-"}
                        </span>
                      )}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Note
                      </span>
                      {isAdmin ? (
                        <input
                          defaultValue={record.note}
                          onBlur={(event) =>
                            patch(record.id, { note: event.target.value })
                          }
                          className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base"
                        />
                      ) : (
                        <span className="mt-1 block">{record.note ?? "-"}</span>
                      )}
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <TableShell className="hidden sm:block">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3 font-medium">Member</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-3 text-right font-medium">
                    Expected
                  </th>
                  <th className="py-3 pr-3 text-right font-medium">Paid</th>
                  <th className="py-3 pr-3 font-medium">Paid date</th>
                  <th className="py-3 pr-3 font-medium">Method</th>
                  <th className="py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 pr-3 font-semibold text-slate-950">
                      {memberName(state.members, record.memberId)}
                    </td>
                    <td className="py-3 pr-3">
                      {isAdmin ? (
                        <select
                          defaultValue={record.status}
                          onChange={(event) =>
                            patch(record.id, {
                              status: event.target.value as PaymentStatus,
                            })
                          }
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                        >
                          <option value="paid">Paid</option>
                          <option value="partial">Partial</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      ) : (
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
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {formatMoney(record.amount)}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {isAdmin ? (
                        <input
                          type="number"
                          defaultValue={record.paidAmount}
                          min={0}
                          max={record.amount}
                          onBlur={(event) =>
                            patch(record.id, {
                              paidAmount: Number(event.target.value),
                              status:
                                Number(event.target.value) >= record.amount
                                  ? "paid"
                                  : Number(event.target.value) > 0
                                    ? "partial"
                                    : "unpaid",
                            })
                          }
                          className="h-10 w-28 rounded-md border border-slate-300 px-3 text-right text-sm"
                        />
                      ) : (
                        <span className="font-medium">
                          {formatMoney(record.paidAmount)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isAdmin ? (
                        <input
                          type="date"
                          defaultValue={record.paidDate}
                          onBlur={(event) =>
                            patch(record.id, { paidDate: event.target.value })
                          }
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                        />
                      ) : (
                        record.paidDate || "-"
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isAdmin ? (
                        <select
                          defaultValue={record.paymentMethod ?? "Cash"}
                          onChange={(event) =>
                            patch(record.id, {
                              paymentMethod: event.target.value as PaymentMethod,
                            })
                          }
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                        >
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      ) : (
                        record.paymentMethod ?? "-"
                      )}
                    </td>
                    <td className="py-3">
                      {isAdmin ? (
                        <input
                          defaultValue={record.note}
                          onBlur={(event) =>
                            patch(record.id, { note: event.target.value })
                          }
                          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                        />
                      ) : (
                        record.note ?? "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </TableShell>
          </>
        )}
      </Section>

      {isAdmin ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="inline-flex items-center gap-2 font-medium text-slate-950">
            <Save className="h-4 w-4" aria-hidden="true" />
            Changes are saved locally.
          </span>{" "}
          Payment transactions update automatically when paid amount changes.
        </div>
      ) : null}
    </>
  );
}
