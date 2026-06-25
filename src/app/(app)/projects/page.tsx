"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Section,
  TextArea,
  TextInput,
} from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/finance";
import { useStore } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";
import { today } from "@/lib/utils";

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

const blankProject: ProjectForm = {
  name: "",
  description: "",
  investmentAmount: 0,
  expectedReturn: 0,
  actualReturn: 0,
  expense: 0,
  status: "running",
  startDate: today(),
  endDate: "",
  note: "",
};

export default function ProjectsPage() {
  const { state, isAdmin, addProject } = useStore();
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [form, setForm] = useState<ProjectForm>(blankProject);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projects = useMemo(() => {
    if (status === "all") return state.projects;
    return state.projects.filter((project) => project.status === status);
  }, [state.projects, status]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addProject({
      ...form,
      endDate: form.endDate || undefined,
    });
    setForm(blankProject);
    setIsModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Investment projects, expected return, actual return, expense, profit, and loss."
        action={
          isAdmin ? (
            <IconButton
              icon={Plus}
              label="Create Project"
              onClick={() => setIsModalOpen(true)}
            />
          ) : undefined
        }
      />

      {isAdmin && isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Project
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="grid gap-4 p-4 sm:p-6 lg:grid-cols-6" onSubmit={submit}>
              <div className="lg:col-span-2">
                <TextInput
                  label="Project name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, name: value }))
                  }
                />
              </div>
              <div className="lg:col-span-2">
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
              </div>
              <div className="lg:col-span-2">
                <TextInput
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, startDate: value }))
                  }
                />
              </div>
              <div className="lg:col-span-6">
                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={(value) =>
                    setForm((item) => ({ ...item, description: value }))
                  }
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3 lg:col-span-6 [&>button]:w-full sm:[&>button]:w-auto">
                <IconButton
                  icon={Plus}
                  label="Cancel"
                  variant="ghost"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                />
                <IconButton icon={Plus} label="Add Project" type="submit" />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Section
        title="Project List"
        action={
          <div className="grid w-full grid-cols-3 rounded-md border border-slate-300 bg-white p-1 sm:inline-flex sm:w-auto">
            {(["all", "running", "closed"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`h-8 rounded px-3 text-sm font-medium capitalize ${
                  status === item
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      >
        {projects.length === 0 ? (
          <EmptyState title="No projects found." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      {project.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-slate-500">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <Badge tone={project.status === "running" ? "sky" : "slate"}>
                    {project.status}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Investment</dt>
                    <dd className="mt-1 font-medium">
                      {formatMoney(project.investmentAmount)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Profit</dt>
                    <dd className="mt-1 font-medium text-emerald-700">
                      {formatMoney(project.profit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Loss</dt>
                    <dd className="mt-1 font-medium text-rose-700">
                      {formatMoney(project.loss)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span>{formatDate(project.startDate)}</span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
