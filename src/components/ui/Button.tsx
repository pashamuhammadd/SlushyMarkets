import Link from "next/link";
import type { Route } from "next";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "btn-sheen bg-linear-to-r from-cyan to-icy text-navy-950 shadow-glow-cyan hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "btn-spin border border-cyan/40 bg-navy-800/60 text-ink hover:border-cyan hover:bg-navy-700/80 hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = {
  href: Route;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ href, variant, size, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
