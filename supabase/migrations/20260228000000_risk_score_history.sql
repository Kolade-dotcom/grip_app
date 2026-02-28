CREATE TABLE risk_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  critical_count INT DEFAULT 0,
  high_count INT DEFAULT 0,
  medium_count INT DEFAULT 0,
  low_count INT DEFAULT 0,
  total_members INT DEFAULT 0,
  retention_rate NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, snapshot_date)
);
