import type { ReactNode } from "react";
import "./ScreenNav.css";

interface ScreenNavProps {
  variant?: "landing" | "compact";
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function ScreenNav({ variant = "landing", leading, trailing }: ScreenNavProps) {
  const logoSize = variant === "landing" ? "screen-nav-logo--lg" : "screen-nav-logo--sm";

  return (
    <nav className={`screen-nav screen-nav--${variant}`}>
      <img
        src="/logo_v2_with_white_text.png"
        alt="ENDevo"
        className={`screen-nav-logo ${logoSize}`}
      />
      {leading && <div className="screen-nav__slot screen-nav__slot--leading">{leading}</div>}
      {trailing && <div className="screen-nav__slot screen-nav__slot--trailing">{trailing}</div>}
    </nav>
  );
}
