import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/**
 * Form field primitives.
 *
 * Labels are always visible and always wired to the control via
 * `useId`-style ids supplied by the caller, so error text announced with
 * `aria-describedby` is genuinely associated with the input.
 */

const CONTROL =
  "w-full rounded-[10px] border bg-paper px-3.5 text-sm text-ink " +
  "transition-colors duration-200 outline-none " +
  "placeholder:text-mist disabled:opacity-60 " +
  "focus:border-ink/45";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-medium tracking-wide text-graphite">{label}</span>
        {optional ? (
          <span className="text-[0.75rem] text-mist">Optional</span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[0.8125rem] text-clay">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[0.8125rem] text-mist">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  optional,
  className,
  ...props
}: Omit<ComponentProps<"input">, "className"> & {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
}) {
  const id = props.id ?? props.name ?? "";
  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      optional={optional}
      className={className}
    >
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, "h-12", error ? "border-clay" : "border-line")}
      />
    </Field>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-[0.8125rem] text-graphite", className)}>
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line-strong accent-[var(--wn-ink)]"
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-[10px] border border-clay/30 bg-clay-soft px-4 py-3 text-[0.8125rem] text-clay"
    >
      {children}
    </p>
  );
}
