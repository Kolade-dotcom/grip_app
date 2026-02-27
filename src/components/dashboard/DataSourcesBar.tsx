import { Button } from "@/components/ui/Button";

interface DataSource {
  name: string;
  connected: boolean;
}

interface DataSourcesBarProps {
  sources: DataSource[];
}

export function DataSourcesBar({ sources }: DataSourcesBarProps) {
  const disconnected = sources.filter((s) => !s.connected);

  return (
    <div className="flex items-center flex-wrap gap-2.5 px-3.5 py-2.5 card-base rounded-[10px] mb-[18px] text-xs">
      <span className="text-label">Sources</span>
      {sources.map((s) => (
        <span
          key={s.name}
          className="flex items-center gap-[5px]"
          style={{ color: s.connected ? "#2ed573" : "var(--text-muted)" }}
        >
          <span
            className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: s.connected ? "#2ed573" : "var(--text-muted)" }}
          />
          {s.name}
        </span>
      ))}
      {disconnected.length > 0 && (
        <Button variant="ghost" size="xs" className="ml-auto">
          + Connect {disconnected[0].name}
        </Button>
      )}
    </div>
  );
}
