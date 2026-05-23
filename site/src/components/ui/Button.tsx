"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

type CommonProps = {
  children: React.ReactNode;
  variant?: "ghost" | "ink" | "link";
  size?: "sm" | "md";
  className?: string;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
};

type Props = ButtonProps | LinkProps;

function baseClasses(variant: CommonProps["variant"], size: CommonProps["size"]) {
  const sizing =
    size === "sm"
      ? "h-9 px-4 text-[0.75rem]"
      : "h-11 px-6 text-[0.8125rem]";

  const core =
    "relative inline-flex items-center justify-center gap-2 rounded-full nav-link transition-[background,color,border-color] duration-500 ease-[var(--ease-editorial)]";

  switch (variant) {
    case "ink":
      return cn(
        core,
        sizing,
        "bg-ink text-cream border border-ink hover:bg-cream hover:text-ink"
      );
    case "link":
      return cn(
        "nav-link inline-flex items-baseline gap-2 text-ink",
        "after:content-[''] after:block after:h-px after:w-0 after:bg-ink after:transition-[width] after:duration-500 after:ease-[var(--ease-editorial)] hover:after:w-full"
      );
    case "ghost":
    default:
      return cn(
        core,
        sizing,
        "bg-transparent text-ink border border-[var(--bare-rule-strong)] hover:bg-ink hover:text-cream hover:border-ink"
      );
  }
}

export default function Button(props: Props) {
  const { children, variant = "ghost", size = "md", className } = props;
  const classes = cn(baseClasses(variant, size), className);

  if ("href" in props && props.href) {
    if (props.external) {
      return (
        <a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, ...buttonProps } =
    props as ButtonProps;
  void _v;
  void _s;
  void _c;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
