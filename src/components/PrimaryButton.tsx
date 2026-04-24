import type { ButtonHTMLAttributes, ReactNode } from "react";

declare module "./PrimaryButton.css";

import "./PrimaryButton.css";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "regular" | "block";
  trailingIcon?: ReactNode;
  children: ReactNode;
}

const ArrowIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4 10h12M10 4l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function PrimaryButton({
  size = "regular",
  trailingIcon = ArrowIcon,
  children,
  className = "",
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={`primary-btn primary-btn--${size} ${className}`.trim()}
    >
      <span className="primary-btn__label">{children}</span>
      {trailingIcon && <span className="primary-btn__icon">{trailingIcon}</span>}
    </button>
  );
}
