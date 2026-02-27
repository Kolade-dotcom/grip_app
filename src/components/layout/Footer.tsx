import { GripLogo } from "@/components/GripLogo";

interface FooterProps {
  planLabel?: string;
}

export function Footer({ planLabel = "Free" }: FooterProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-5 border-t border-border">
      <GripLogo size={16} />
      <span className="text-[10px] text-text-muted">
        Grip Retention Engine — {planLabel} Plan — Powered by AI
      </span>
    </div>
  );
}
