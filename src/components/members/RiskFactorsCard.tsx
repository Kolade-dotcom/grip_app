import { Card } from "@/components/ui/Card";
import type { RiskFactor } from "@/types/risk";
import type { RiskLevel } from "@/types/risk";

interface RiskFactorsCardProps {
  factors: RiskFactor[];
  riskLevel: RiskLevel | null;
}

const severityColor: Record<string, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

export function RiskFactorsCard({ factors, riskLevel }: RiskFactorsCardProps) {
  const borderClass =
    riskLevel === "critical" ? "border-risk-critical-border" : "";

  return (
    <Card className={`p-[18px_20px] ${borderClass}`}>
      <div className="text-label font-bold mb-3.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-risk-critical">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Risk Factors
      </div>

      {factors.length > 0 ? (
        factors.map((f, i) => (
          <div
            key={i}
            className="flex gap-2 py-1.5 text-xs text-text-secondary leading-relaxed"
          >
            <span
              className={`mt-[5px] flex-shrink-0 w-1.5 h-1.5 rounded-full ${severityColor[f.severity] ?? "bg-risk-medium"}`}
            />
            <span>{f.description}</span>
          </div>
        ))
      ) : (
        <div className="text-xs text-success flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          No risk factors — healthy member
        </div>
      )}
    </Card>
  );
}
