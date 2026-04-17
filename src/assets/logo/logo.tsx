import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type LogoProps = HTMLAttributes<HTMLDivElement>;

const Logo = ({ className, ...props }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="grid size-8 place-items-center rounded-lg bg-emerald-500 text-foreground">
        <span className="text-sm font-bold tracking-tight">SK</span>
      </div>
      <div className="leading-none">
        <p className="text-sm font-semibold uppercase tracking-[0.22em]">Skrap</p>
        <p className="text-[10px] text-muted-foreground tracking-[0.16em] uppercase">
          Scraper Console
        </p>
      </div>
    </div>
  );
};

export default Logo;
