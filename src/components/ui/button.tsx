import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "inverse" | "sale";
type Size = "sm" | "md" | "lg" | "xl";

const BASE =
  "relative inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-300 " +
  "ease-[cubic-bezier(0.22,0.61,0.36,1)] active:scale-[0.985] " +
  "disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-graphite shadow-[0_1px_0_rgba(255,255,255,0.14)_inset]",
  secondary:
    "bg-sand text-ink hover:bg-linen border border-transparent hover:border-line-strong",
  outline:
    "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-sand",
  inverse:
    "bg-paper text-ink hover:bg-bone border border-paper/40 hover:border-paper",
  sale: "bg-clay text-paper hover:bg-clay/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.9375rem]",
  xl: "h-14 px-10 text-base",
};

const SHAPES = {
  pill: "rounded-full",
  soft: "rounded-[10px]",
  round: "rounded-lg",
} as const;

export function buttonClass({
  variant = "primary",
  size = "md",
  shape = "pill",
  full,
  className,
}: {
  variant?: Variant;
  size?: Size;
  shape?: keyof typeof SHAPES;
  full?: boolean;
  className?: string;
} = {}) {
  return cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    SHAPES[shape],
    full && "w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  shape?: keyof typeof SHAPES;
  loading?: boolean;
  full?: boolean;
};

export function Button({
  variant,
  size,
  shape,
  loading = false,
  disabled,
  full,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, shape, full, className })}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  shape,
  full,
  className,
  children,
  href,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  shape?: keyof typeof SHAPES;
  full?: boolean;
  className?: string;
  children: ReactNode;
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={buttonClass({ variant, size, shape, full, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-4 shrink-0 animate-spin rounded-full border-2 border-current/25 border-t-current",
        className,
      )}
    />
  );
}
