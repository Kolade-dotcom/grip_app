import { cn } from "@/lib/utils";
import { type ReactNode, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  borderColor?: string;
}

export function Card({ children, hover, className, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-base overflow-hidden shadow-[var(--shadow)] transition-all duration-200",
        hover && "card-hover cursor-pointer",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
