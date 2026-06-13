from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union

import datetime

class AdvantageAIAnalysis(BaseModel):
    product: str = "AdVantage AI"
    analysis_version: str = "1.0"

class VisualAnalysis(BaseModel):
    objects_detected: List[str]
    dominant_colors: List[str]
    has_human_face: bool
    face_emotion: Optional[str]
    text_in_image: str
    text_ratio_percent: float
    brightness_score: float
    contrast_score: float
    aspect_ratio: str
    layout_description: str
    visual_hierarchy_score: float

class CopyAnalysis(BaseModel):
    sentiment: str
    sentiment_score: float
    emotional_tone: str
    has_cta: bool
    cta_text: Optional[str]
    cta_strength: str
    readability_score: float
    power_words_found: List[str]
    caption_length: int
    caption_length_verdict: str

class HookAnalysis(BaseModel):
    hook_text: str
    hook_score: float
    hook_type: str
    hook_weakness: str
    hook_rewrites: List[str]

class PsychologyTriggers(BaseModel):
    fomo: bool
    social_proof: bool
    authority: bool
    scarcity: bool
    reciprocity: bool
    aspirational: bool
    pain_amplification: bool
    curiosity_gap: bool
    missing_triggers_suggestions: Dict[str, str]

class PlatformRules(BaseModel):
    platform: str
    violations: List[str]
    passed_checks: List[str]
    compliance_score: float

class Audience(BaseModel):
    inferred_age_range: str
    gender_skew: str
    likely_interests: List[str]
    income_bracket: str
    mismatch_warnings: List[str]

class PlatformFitScores(BaseModel):
    meta_feed: float
    meta_stories: float
    meta_reels: float
    tiktok_feed: float
    google_display: float
    google_search: float
    youtube_preroll: float

class CopyVariants(BaseModel):
    direct_response: str
    storytelling: str
    social_proof: str
    headline_variants: List[str]
    cta_variants: List[str]
    hashtags: List[str]

class ABVariantDetail(BaseModel):
    angle: str
    headline: str
    body: str
    cta: str
    explanation: str

class ABVariants(BaseModel):
    variant_a: ABVariantDetail
    variant_b: ABVariantDetail
    variant_c: ABVariantDetail

class Scoring(BaseModel):
    visual_quality_score: float
    copy_strength_score: float
    platform_fit_score: float
    psychology_score: float
    overall_score: float
    grade: str
    verdict: str

class FeedbackChecklist(BaseModel):
    high_priority: List[str]
    medium_priority: List[str]
    low_priority: List[str]

class FullAnalysisResponse(BaseModel):
    advantage_ai_analysis: AdvantageAIAnalysis
    visual_analysis: VisualAnalysis
    copy_analysis: CopyAnalysis
    hook_analysis: HookAnalysis
    psychology_triggers: PsychologyTriggers
    platform_rules: PlatformRules
    audience: Audience
    platform_fit_scores: PlatformFitScores
    copy_variants: CopyVariants
    ab_variants: ABVariants
    scoring: Scoring
    feedback_checklist: FeedbackChecklist

class BrandProfileSchema(BaseModel):
    brand_name: str
    industry: str
    target_audience: str
    brand_voice: str
    main_competitors: Optional[str] = ""

class BrandProfileResponse(BrandProfileSchema):
    id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class RewriteRequest(BaseModel):
    original_text: str
    feedback: List[str]

class RewriteResponse(BaseModel):
    rewritten_text: str
    explanation: str

# Authentication Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    subscription_tier: str
    is_verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class SubscriptionStatus(BaseModel):
    current_tier: str
    analyses_used: int
    analyses_remaining: int
    reset_date: Optional[datetime.datetime]

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str

class EmailVerification(BaseModel):
    token: str
