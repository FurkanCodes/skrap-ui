import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type DealvinciLogoVariant = "monogram" | "tag" | "shield" | "square";

type LogoProps = HTMLAttributes<HTMLDivElement> & {
  variant?: DealvinciLogoVariant;
  iconOnly?: boolean;
};

const Logo = ({ className, variant = "tag", iconOnly = false, style, ...props }: LogoProps) => {
  const tagIcon = (
    <svg
      viewBox="14 14 70 70"
      className="h-7 w-7 shrink-0 block"
      role="img"
      aria-label="Dealvinci icon"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 42 42 14h34a8 8 0 0 1 8 8v34L56 84a8 8 0 0 1-11.3 0L14 53.3a8 8 0 0 1 0-11.3z"
        fill="var(--brand-logo-accent)"
      />
      <circle cx="62" cy="24" r="6.3" fill="var(--brand-logo-cutout)" />
      <path d="M36 50.5h10.8L52 56.8l5.2-6.3H68L52 67z" fill="var(--brand-logo-cutout)" />
    </svg>
  );

  if (variant === "tag") {
    return (
      <div
        className={cn("flex items-center gap-2 leading-none text-foreground", className)}
        style={{ color: "var(--brand-logo-wordmark)", ...style }}
        {...props}
      >
        {tagIcon}
        {!iconOnly ? (
          <span className="inline-flex h-7 items-center text-[1.5rem] font-semibold tracking-[-0.03em] leading-none">
            dealvinci
          </span>
        ) : null}
      </div>
    );
  }

  const renderVariant = () => {
    switch (variant) {
      case "shield":
        return (
          <>
            <g transform="translate(8, 8)">
              <path
                d="M24 1.5l16 6v12.5c0 11-7.2 18.5-16 22.5C15.2 38.5 8 31 8 20V7.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M18 12.5h7.5c4.8 0 8 3 8 7.7 0 4.8-3.3 7.8-8 7.8H18z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 16.5h13l-5.8 5.8h4.3l-6.8 6.8"
                fill="none"
                stroke="var(--brand-logo-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <text
              x="72"
              y="39"
              fill="currentColor"
              fontSize="30"
              fontFamily='ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
              fontWeight="620"
              letterSpacing="-0.3"
            >
              Dealvinci
            </text>
          </>
        );
      case "square":
        return (
          <>
            <g transform="translate(8, 8)">
              <rect
                x="0"
                y="0"
                width="44"
                height="44"
                rx="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <path
                d="M12 9h10c8 0 13 5.2 13 13s-5 13-13 13H12z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M25.5 17v8.2h5.2l-8.2 8.2-8.2-8.2h5.2V17z"
                fill="var(--brand-logo-accent)"
              />
            </g>
            <text
              x="72"
              y="39"
              fill="currentColor"
              fontSize="25"
              fontFamily='ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
              fontWeight="600"
              letterSpacing="2.2"
            >
              DEALVINCI
            </text>
          </>
        );
      case "monogram":
      default:
        return (
          <>
            <g transform="translate(8, 8)">
              <rect
                x="0"
                y="0"
                width="44"
                height="44"
                rx="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <path
                d="M12 9h12.5c6.8 0 11.8 5.2 11.8 13s-5 13-11.8 13H12z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M20 15l6.3 13.3L33 15"
                fill="none"
                stroke="var(--brand-logo-accent)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28 28.3l5.2-5.1"
                fill="none"
                stroke="var(--brand-logo-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
            <text
              x="72"
              y="39"
              fill="currentColor"
              fontSize="30"
              fontFamily='ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
              fontWeight="700"
              letterSpacing="-0.4"
            >
              Dealvinci
            </text>
          </>
        );
    }
  };

  const viewBox = "0 0 290 60";
  const svgHeightClass = "h-9";

  return (
    <div
      className={cn("flex items-center leading-none text-foreground", className)}
      style={{ color: "var(--brand-logo-wordmark)", ...style }}
      {...props}
    >
      <svg
        viewBox={viewBox}
        className={cn(svgHeightClass, "w-auto block")}
        role="img"
        aria-label="Dealvinci logo"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderVariant()}
      </svg>
    </div>
  );
};

export default Logo;
