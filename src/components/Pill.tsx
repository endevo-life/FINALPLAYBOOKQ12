import type { ReactNode } from "react";
import "./Pill.css";

interface PillProps {
  variant?: "stat" | "domain" | "band";
  color?: string;
  children: ReactNode;
}

export function Pill({ variant = "stat", color, children }: PillProps) {
  const style =
    variant === "band" && color
      ? { background: color, color: "#fff" }
      : undefined;
  return (
    <span className={`pill pill--${variant}`} style={style}>
      {children}
    </span>
  );
}
