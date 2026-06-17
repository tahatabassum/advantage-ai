from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any

import datetime

class AdvantageAIAnalysis(BaseModel):
    product: str = "AdVantage AI"
    analysis_version: str = "1.0"
    type: Optional[str] = None  # "video" for video analyses

class VisualAnalysis(BaseModel):
    objects_detected: List[str] = []
    dominant_colors: List[str] = []
    has_human_face: bool = False
    face_emotion: Optional[str] = "Neutral"
    text_in_image: str = ""
    text_ratio_percent: float = 0
    brightness_score: float = 50
    contrast_score: float = 50
    aspect_ratio: str = "Unknown"
    layout_description: str = ""
    visual_hierarchy_score: float = 50

class CopyAnalysis(BaseModel):
    sentiment: str = "Neutral"
    sentiment_score: float = 50
    emotional_tone: str = "Neutral"
    has_cta: bool = False
    cta_text: Optional[str] = ""
    cta_strength: str = "Medium"
    readability_score: float = 50
    power_words_found: List[str] = []
    caption_length: int = 0
    caption_length_verdict: str = "Medium"

class HookAnalysis(BaseModel):
    hook_text: str = ""
    hook_score: float = 0
    hook_type: str = "Unknown"
    hook_weakness: str = "None"
    hook_rewrites: List[str] = []

class PsychologyTriggers(BaseModel):
    fomo: bool = False
    social_proof: bool = False
    authority: bool = False
    scarcity: bool = False
    reciprocity: bool = False
    aspirational: bool = False
    pain_amplification: bool = False
    curiosity_gap: bool = False
    missing_triggers_suggestions: Dict[str, str] = {}

class PlatformRules(BaseModel):
    platform: str = "Unknown"
    violations: List[str] = []
    passed_checks: List[str] = []
    compliance_score: float = 100

class Audience(BaseModel):
    inferred_age_range: str = "18-65"
    gender_skew: str = "Neutral"
    likely_interests: List[str] = []
    income_bracket: str = "Middle"
    mismatch_warnings: List[str] = []

class PlatformFitScores(BaseModel):
    meta_feed: float = 50
    meta_stories: float = 50
    meta_reels: float = 50
    tiktok_feed: float = 50
    google_display: float = 50
    google_search: float = 50
    youtube_preroll: float = 50

class CopyVariants(BaseModel):
    direct_response: str = ""
    storytelling: str = ""
    social_proof: str = ""
    headline_variants: List[str] = []
    cta_variants: List[str] = []
    hashtags: List[str] = []

class ABVariantDetail(BaseModel):
    angle: str = ""
    headline: str = ""
    body: str = ""
    cta: str = ""
    explanation: str = ""

class ABVariants(BaseModel):
    variant_a: ABVariantDetail = ABVariantDetail()
    variant_b: ABVariantDetail = ABVariantDetail()
    variant_c: ABVariantDetail = ABVariantDetail()

class Scoring(BaseModel):
    visual_quality_score: float = 0
    copy_strength_score: float = 0
    platform_fit_score: float = 0
    psychology_score: float = 0
    overall_score: float = 0
    grade: str = "F"
    verdict: str = "Awaiting analysis."

class FeedbackChecklist(BaseModel):
    high_priority: List[str] = []
    medium_priority: List[str] = []
    low_priority: List[str] = []

class VideoAnalysisSchema(BaseModel):
    duration_seconds: float = 0
    total_frames_analyzed: int = 0
    has_audio: bool = False
    audio_transcript: str = ""
    scene_count: int = 0
    pacing: str = "Normal"
    hook_strength: str = "Medium"
    first_3_seconds_verdict: str = "Informative"
    visual_storytelling_score: float = 50
    audio_visual_alignment: str = "Good"

class FullAnalysisResponse(BaseModel):
    advantage_ai_analysis: AdvantageAIAnalysis = AdvantageAIAnalysis()
    visual_analysis: VisualAnalysis = VisualAnalysis()
    video_analysis: Optional[VideoAnalysisSchema] = None
    copy_analysis: CopyAnalysis = CopyAnalysis()
    hook_analysis: HookAnalysis = HookAnalysis()
    psychology_triggers: PsychologyTriggers = PsychologyTriggers()
    platform_rules: PlatformRules = PlatformRules()
    audience: Audience = Audience()
    platform_fit_scores: PlatformFitScores = PlatformFitScores()
    copy_variants: CopyVariants = CopyVariants()
    ab_variants: ABVariants = ABVariants()
    scoring: Scoring = Scoring()
    feedback_checklist: FeedbackChecklist = FeedbackChecklist()
    # Extra fields that url_analyzer / video_analyzer may add
    source_url: Optional[str] = None
    warning: Optional[str] = None
    success: Optional[bool] = None

    class Config:
        # Allow extra fields to pass through without error
        extra = "allow"

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
    variations: Optional[List[str]] = []

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

class UrlAnalysisRequest(BaseModel):
    url: str
    analysis_type: str = "generic"
    platform: str = "Meta"
    objective: str = "Conversion"
