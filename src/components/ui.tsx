import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-wrap text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full flex-wrap gap-2 md:w-auto md:shrink-0 md:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {title || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          {title ? (
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          ) : null}
          {action ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-semibold text-slate-950">
            {value}
          </p>
        </div>
        <span className={cn("rounded-md p-2", tones[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium capitalize",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function IconButton({
  icon: Icon,
  label,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variants = {
    primary: "border-slate-950 bg-slate-950 text-white hover:bg-slate-800",
    secondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
    ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 min-w-10 max-w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled,
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        type={type}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:text-sm"
      />
    </label>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  children,
  disabled,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:text-sm"
      >
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm"
      />
    </label>
  );
}

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {title}
    </div>
  );
}

export function TableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-full overflow-x-auto rounded-md pb-2 [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {children}
    </div>
  );
}
