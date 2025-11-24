/**
 * Mod-related TypeScript types
 * Matches mod-ledger backend API responses
 */

export interface ModStat {
  stat_id: string;
  name: string;
  value: number;
  display_value: string;
  rolls?: number;
  bounds_min?: number;
  bounds_max?: number;
  efficiency?: number;
}

export interface ParsedMod {
  mod_id: string;
  set: {
    id: number;
    name: string;
  };
  slot: {
    id: number;
    name: string;
    shape: string;
  };
  tier: number;
  level: number;
  primary_stat: ModStat;
  secondary_stats: ModStat[];
  character_id?: string;
  reroll_count?: number;
}

export interface ModListResponse {
  ally_code: string;
  mods: ParsedMod[];
  count: number;
  cached: boolean;
  cached_at?: string;
}

export interface EvaluationScores {
  synergy: number;
  quality: number;
  versatility: number;
  speed_bonus: number;
  upgrade_potential?: number;
  slice_value?: number;
  overall: number;
}

export interface ModEvaluation {
  mod_id: string;
  scores: EvaluationScores;
  recommendation: 'SELL' | 'KEEP' | 'UPGRADE' | 'SLICE' | 'SLICE-PRIORITY';
  reasoning: string;
}

export interface EvaluationRequest {
  profile_name?: string;
}

export interface EvaluationResponse {
  ally_code: string;
  profile_name: string;
  evaluations: Record<string, ModEvaluation>;
  cached: boolean;
  cached_at?: string;
}
