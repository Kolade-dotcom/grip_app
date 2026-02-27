import { StatBlock } from "@/components/ui/StatBlock";

interface StatsRowProps {
  revenueAtRisk: string;
  criticalCount: number;
  highCount: number;
  inPlaybooks: number;
  playbooksRunning: number;
  isMobile: boolean;
}

export function StatsRow({
  revenueAtRisk,
  criticalCount,
  highCount,
  inPlaybooks,
  playbooksRunning,
  isMobile,
}: StatsRowProps) {
  return (
    <div
      className="grid gap-2.5 mb-5"
      style={{
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      }}
    >
      <StatBlock
        label="Revenue at Risk"
        value={revenueAtRisk}
        sub={`${criticalCount + highCount} critical + high risk`}
        accentColor="#ff4757"
      />
      <StatBlock
        label="Critical"
        value={criticalCount}
        sub="Act now"
        accentColor="#ff4757"
      />
      <StatBlock
        label="High Risk"
        value={highCount}
        sub="Recommend intervention"
        accentColor="#ffa502"
      />
      <StatBlock
        label="In Playbooks"
        value={inPlaybooks}
        sub={`${playbooksRunning} playbooks running`}
        accentColor="#6e56ff"
      />
    </div>
  );
}
