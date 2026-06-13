export interface AdvantageAIAnalysis {
  product: string;
  analysis_version: string;
}

export interface VisualAnalysis {
  objects_detected: string[];
  dominant_colors: string[];
  has_human_face: boolean;
  face_emotion: string;
  text_in_image: string;
  text_ratio_percent: number;
  brightness_score: number;
  contrast_score: number;
  aspect_ratio: string;
  layout_description: string;
  visual_hierarchy_score: number;
}

export interface CopyAnalysis {
  sentiment: string;
  sentiment_score: number;
  emotional_tone: string;
  has_cta: boolean;
  cta_text: string;
  cta_strength: string;
  readability_score: number;
  power_words_found: string[];
  caption_length: number;
  caption_length_verdict: string;
}

export interface HookAnalysis {
  hook_text: string;
  hook_score: number;
  hook_type: string;
  hook_weakness: string;
  hook_rewrites: string[];
}

export interface PsychologyTriggers {
  fomo: boolean;
  social_proof: boolean;
  authority: boolean;
  scarcity: boolean;
  reciprocity: boolean;
  aspirational: boolean;
  pain_amplification: boolean;
  curiosity_gap: boolean;
  missing_triggers_suggestions: { [key: string]: string };
}

export interface PlatformRules {
  platform: string;
  violations: string[];
  passed_checks: string[];
  compliance_score: number;
}

export interface Audience {
  inferred_age_range: string;
  gender_skew: string;
  likely_interests: string[];
  income_bracket: string;
  mismatch_warnings: string[];
}

export interface PlatformFitScores {
  meta_feed: number;
  meta_stories: number;
  meta_reels: number;
  tiktok_feed: number;
  google_display: number;
  google_search: number;
  youtube_preroll: number;
}

export interface CopyVariants {
  direct_response: string;
  storytelling: string;
  social_proof: string;
  headline_variants: string[];
  cta_variants: string[];
  hashtags: string[];
}

export interface ABVariantDetail {
  angle: string;
  headline: string;
  body: string;
  cta: string;
  explanation: string;
}

export interface ABVariants {
  variant_a: ABVariantDetail;
  variant_b: ABVariantDetail;
  variant_c: ABVariantDetail;
}

export interface Scoring {
  visual_quality_score: number;
  copy_strength_score: number;
  platform_fit_score: number;
  psychology_score: number;
  overall_score: number;
  grade: string;
  verdict: string;
}

export interface FeedbackChecklist {
  high_priority: string[];
  medium_priority: string[];
  low_priority: string[];
}

export interface FullAnalysisResponse {
  advantage_ai_analysis: AdvantageAIAnalysis;
  visual_analysis: VisualAnalysis;
  copy_analysis: CopyAnalysis;
  hook_analysis: HookAnalysis;
  psychology_triggers: PsychologyTriggers;
  platform_rules: PlatformRules;
  audience: Audience;
  platform_fit_scores: PlatformFitScores;
  copy_variants: CopyVariants;
  ab_variants: ABVariants;
  scoring: Scoring;
  feedback_checklist: FeedbackChecklist;
}
