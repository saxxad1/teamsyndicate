"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import { formatDate, formatMoney } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { Project, ProjectStatus, Transaction } from "@/lib/types";

type ProjectForm = {
  name: string;
  description: string;
  investmentAmount: number;
  expectedReturn: number;
  actualReturn: number;
  expense: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  note: string;
};

function projectToForm(project: Project): ProjectForm {
  return {
    name: project.name,
    description: project.description,
    investmentAmount: project.investmentAmount,
    expectedReturn: project.expectedReturn,
    actualReturn: project.actualReturn,
    expense: project.expense,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate ?? "",
    note: project.note ?? "",
  };
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const { state } = useStore();
  const project = state.projects.find((item) => item.id === params.id);
  const transactions = useMemo(
    () =>
      state.transactions
        .filter((transaction) => transaction.projectId === params.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [params.id, state.transactions],
  );

  if (!project) return null;

  return (
    <ProjectDetailsContent
      key={project.id}
      project={project}
      transactions={transactions}
    />
  );
}

function ProjectDetailsContent({
  project,
  transactions,
}: {
  project: Project;
  transactions: Transaction[];
}) {
  const router = useRouter();
  const { isAdmin, updateProject, deleteProject } = useStore();
  const [form, setForm] = useState<ProjectForm>(() => projectToForm(project));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProject(project.id, {
      ...form,
      endDate: form.endDate || undefined,
    });
  }

  function removeProject() {
    deleteProject(project.id);
    router.replace("/projects");
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description || "Project details"}
        action={
          <Link
            href="/projects"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Projects
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Investment"
          value={formatMoney(project.investmentAmount)}
          icon={Banknote}
          tone="sky"
        />
        <StatCard
          label="Actual return"
          value={formatMoney(project.actualReturn)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Profit"
          value={formatMoney(project.profit)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Loss"
          value={formatMoney(project.loss)}
          icon={TrendingDown}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Section title={isAdmin ? "Update Project" : "Project Summary"}>
          {isAdmin ? (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
              <TextInput
                label="Project name"
                value={form.name}
                onChange={(value) =>
                  setForm((item) => ({ ...item, name: value }))
                }
              />
              <SelectInput
                label="Status"
                value={form.status}
                onChange={(value) =>
                  setForm((item) => ({
                    ...item,
                    status: value as ProjectStatus,
                  }))
                }
              >
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </SelectInput>
              <TextInput
                label="Investment"
                type="number"
                value={form.investmentAmount}
                onChange={(value) =>
                  setForm((item) => ({
                    ...item,
                    investmentAmount: Number(value),
                  }))
                }
              />

              <TextInput
                label="Actual return"
                type="number"
                value={form.actualReturn}
                onChange={(value) =>
                  setForm((item) => ({
                    ...item,
                    actualReturn: Number(value),
                  }))
                }
              />
              <TextInput
                label="Expense"
                type="number"
                value={form.expense}
                onChange={(value) =>
                  setForm((item) => ({ ...item, expense: Number(value) }))
                }
              />
              <TextInput
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(value) =>
                  setForm((item) => ({ ...item, startDate: value }))
                }
              />
              <TextInput
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(value) =>
                  setForm((item) => ({ ...item, endDate: value }))
                }
              />
              <div className="sm:col-span-2">
                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, description: value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  label="Notes"
                  value={form.note}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, note: value }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2 [&>button]:w-full sm:[&>button]:w-auto">
                <IconButton icon={Save} label="Save" type="submit" />
                <IconButton
                  icon={Trash2}
                  label="Delete"
                  variant="danger"
                  onClick={removeProject}
                />
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <Badge tone={project.status === "running" ? "sky" : "slate"}>
                    {project.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Start date</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(project.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">End date</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(project.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Expense</dt>
                <dd className="mt-1 font-medium">
                  {formatMoney(project.expense)}
                </dd>
              </div>
            </dl>
          )}
        </Section>

        <Section title="Project Timeline">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-950">Started</p>
                <p className="text-slate-500">{formatDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-950">Closed</p>
                <p className="text-slate-500">{formatDate(project.endDate)}</p>
              </div>
            </div>
            {project.note ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-600">
                {project.note}
              </p>
            ) : null}
          </div>
        </Section>
      </div>

      <Section title="Related Transactions">
        {transactions.length === 0 ? (
          <EmptyState title="No project transactions found." />
        ) : (
          <>
            <div className="grid gap-3 sm:hidden">
              {transactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-slate-950">
                        {transaction.type}
                      </h3>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {transaction.source}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">
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
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-3 font-medium">Date</th>
                    <th className="py-3 pr-3 font-medium">Type</th>
                    <th className="py-3 pr-3 font-medium">Source</th>
                    <th className="py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3 pr-3">{formatDate(transaction.date)}</td>
                      <td className="py-3 pr-3 font-medium">
                        {transaction.type}
                      </td>
                      <td className="py-3 pr-3 capitalize text-slate-500">
                        {transaction.source}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatMoney(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </>
        )}
      </Section>
    </>
  );
}
