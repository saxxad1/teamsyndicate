"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import {
  Badge,
  IconButton,
  PageHeader,
  Section,
  SelectInput,
  TableShell,
  TextArea,
  TextInput,
} from "@/components/ui";
import {
  formatDate,
  formatMoney,
  memberName,
  projectName,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import {
  paymentMethods,
  transactionTypes,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from "@/lib/types";
import { today } from "@/lib/utils";

type TransactionForm = {
  type: TransactionType;
  amount: number | "";
  date: string;
  memberId: string;
  projectId: string;
  paymentMethod: PaymentMethod;
  note: string;
};

const blankTransaction: TransactionForm = {
  type: "Other Income",
  amount: "",
  date: today(),
  memberId: "",
  projectId: "",
  paymentMethod: "Bank",
  note: "",
};

export default function TransactionsPage() {
  const {
    state,
    currentUser,
    isAdmin,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStore();
  const [form, setForm] = useState<TransactionForm>(blankTransaction);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: "",
    month: "",
    memberId: "",
    projectId: "",
    type: "",
  });

  const transactions = useMemo(() => {
    return [...state.transactions]
      .filter((transaction) => {
        if (filters.date && transaction.date !== filters.date) return false;
        if (filters.month && !transaction.date.startsWith(filters.month)) {
          return false;
        }
        if (filters.memberId && transaction.memberId !== filters.memberId) {
          return false;
        }
        if (filters.projectId && transaction.projectId !== filters.projectId) {
          return false;
        }
        if (filters.type && transaction.type !== filters.type) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filters, state.transactions]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;

    const payload = {
      ...form,
      amount: Number(form.amount),
      memberId: form.memberId || undefined,
      projectId: form.projectId || undefined,
      createdBy: currentUser.id,
    };

    if (editingId) {
      updateTransaction(editingId, payload);
    } else {
      addTransaction(payload);
    }

    setEditingId(undefined);
    setIsModalOpen(false);
    setForm(blankTransaction);
  }

  function startEdit(transaction: Transaction) {
    if (transaction.source !== "manual") return;
    setEditingId(transaction.id);
    setForm({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      memberId: transaction.memberId ?? "",
      projectId: transaction.projectId ?? "",
      paymentMethod: transaction.paymentMethod ?? "Bank",
      note: transaction.note ?? "",
    });
    setIsModalOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="All incoming and outgoing fund records with member, project, type, and date filters."
        action={
          isAdmin ? (
            <IconButton
              icon={Plus}
              label="Add Transaction"
              onClick={() => {
                setEditingId(undefined);
                setForm(blankTransaction);
                setIsModalOpen(true);
              }}
            />
          ) : undefined
        }
      />

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(undefined);
                  setForm(blankTransaction);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="grid gap-4 p-6 lg:grid-cols-6" onSubmit={submit}>
            <div className="lg:col-span-2">
              <SelectInput
                label="Type"
                value={form.type}
                onChange={(value) =>
                  setForm((item) => ({ ...item, type: value as TransactionType }))
                }
              >
                {transactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="lg:col-span-2">
              <TextInput
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(value) =>
                  setForm((item) => ({ ...item, amount: value === "" ? "" : Number(value) }))
                }
              />
            </div>
            <div className="lg:col-span-2">
              <TextInput
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) => setForm((item) => ({ ...item, date: value }))}
              />
            </div>
            <div className="lg:col-span-2">
              <SelectInput
                label="Related member"
                value={form.memberId}
                onChange={(value) =>
                  setForm((item) => ({ ...item, memberId: value }))
                }
              >
                <option value="">None</option>
                {state.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="lg:col-span-2">
              <SelectInput
                label="Related project"
                value={form.projectId}
                onChange={(value) =>
                  setForm((item) => ({ ...item, projectId: value }))
                }
              >
                <option value="">None</option>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="lg:col-span-2">
              <SelectInput
                label="Method"
                value={form.paymentMethod}
                onChange={(value) =>
                  setForm((item) => ({
                    ...item,
                    paymentMethod: value as PaymentMethod,
                  }))
                }
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="lg:col-span-6">
              <TextArea
                label="Note"
                value={form.note}
                onChange={(value) =>
                  setForm((item) => ({ ...item, note: value }))
                }
              />
            </div>
                <div className="flex items-end justify-end gap-2 lg:col-span-6 mt-4 border-t border-slate-100 pt-6">
                  <IconButton
                    icon={X}
                    label="Cancel"
                    variant="ghost"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(undefined);
                      setForm({...blankTransaction, paymentMethod: "Bank"});
                    }}
                  />
                  <IconButton
                    icon={editingId ? Edit3 : Plus}
                    label={editingId ? "Save Changes" : "Add Transaction"}
                    type="submit"
                  />
                </div>
              </form>
            </div>
          </div>
        )}

      <Section title="Filters">
        <div className="grid gap-4 md:grid-cols-5">
          <TextInput
            label="Date"
            type="date"
            value={filters.date}
            onChange={(value) =>
              setFilters((item) => ({ ...item, date: value }))
            }
          />
          <TextInput
            label="Month"
            type="month"
            value={filters.month}
            onChange={(value) =>
              setFilters((item) => ({ ...item, month: value }))
            }
          />
          <SelectInput
            label="Member"
            value={filters.memberId}
            onChange={(value) =>
              setFilters((item) => ({ ...item, memberId: value }))
            }
          >
            <option value="">All</option>
            {state.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Project"
            value={filters.projectId}
            onChange={(value) =>
              setFilters((item) => ({ ...item, projectId: value }))
            }
          >
            <option value="">All</option>
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Type"
            value={filters.type}
            onChange={(value) =>
              setFilters((item) => ({ ...item, type: value }))
            }
          >
            <option value="">All</option>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectInput>
        </div>
      </Section>

      <Section title="Transaction History">
        <TableShell>
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-3 font-medium">Date</th>
                <th className="py-3 pr-3 font-medium">Type</th>
                <th className="py-3 pr-3 font-medium">Member</th>
                <th className="py-3 pr-3 font-medium">Project</th>
                <th className="py-3 pr-3 font-medium">Method</th>
                <th className="py-3 pr-3 font-medium">Source</th>
                <th className="py-3 pr-3 text-right font-medium">Amount</th>
                {isAdmin ? <th className="py-3 text-right font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="py-3 pr-3 text-slate-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    {transaction.type}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {memberName(state.members, transaction.memberId)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {projectName(state.projects, transaction.projectId)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {transaction.paymentMethod ?? "-"}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={transaction.source === "auto" ? "sky" : "slate"}>
                      {transaction.source}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold">
                    {formatMoney(transaction.amount)}
                  </td>
                  {isAdmin ? (
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon={Edit3}
                          label="Edit"
                          variant="secondary"
                          onClick={() => startEdit(transaction)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete"
                          variant="danger"
                          onClick={() => setDeleteModalId(transaction.id)}
                        />
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Section>
      {deleteModalId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Delete Transaction</h3>
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setDeleteModalId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition"
                onClick={() => {
                  deleteTransaction(deleteModalId);
                  setDeleteModalId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
