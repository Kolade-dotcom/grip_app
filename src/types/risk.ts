export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DataConfidence = "low" | "medium" | "high";

export interface RiskFactor {
  factor: string;
  severity: RiskLevel;
  points: number;
  description: string;
}

export interface RiskResult {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  confidence: DataConfidence;
}

export interface RiskScore {
  id: string;
  member_id: string;
  score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactor[];
  data_confidence: DataConfidence;
  calculated_at: string;
}
