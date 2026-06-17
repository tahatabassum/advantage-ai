import os
import sys
import json
import base64
import hashlib
import requests
from dotenv import load_dotenv

load_dotenv()

# Fix Windows console encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass


# =========================
# Exceptions
# =========================
class UnauthenticatedError(Exception):
    pass

class QuotaExceededError(Exception):
    pass


# =========================
# CONFIG
# =========================
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

if not OPENROUTER_API_KEY:
    print("WARNING: OPENROUTER_API_KEY is missing. AI will fail.")

# IMPORTANT: Use SPECIFIC models, NOT openrouter/auto.
# openrouter/auto randomly picks different models = different scores each time.
# These are cheap, reliable, vision-capable models that produce consistent JSON.
FALLBACK_MODELS = [
    "google/gemini-2.0-flash-001",
    "google/gemini-2.5-flash-preview-05-20",
    "openai/gpt-4o-mini",
    "openrouter/auto",
]

SYSTEM_PROMPT = """You are AdVantage AI, an elite advertising performance analyst used by Fortune 500 media agencies.
You analyze ad creatives with the precision and consistency of a professional SaaS audit tool.
Your scoring MUST be deterministic — the same creative must ALWAYS receive the EXACT same score.
You must follow the scoring rubric EXACTLY. Do not guess or estimate — apply the rubric criteria methodically.
Return ONLY valid JSON. No markdown, no explanation, no text outside the JSON object."""


# =========================
# RESULT CACHE (same input = same output, always)
# =========================
_analysis_cache = {}

def _get_cache_key(image_bytes: bytes, caption: str, platform: str, objective: str) -> str:
    """SHA256 hash of inputs. Same image+caption+platform = same cache key."""
    h = hashlib.sha256()
    if image_bytes:
        h.update(image_bytes)
    h.update(caption.encode('utf-8'))
    h.update(platform.encode('utf-8'))
    h.update(objective.encode('utf-8'))
    return h.hexdigest()


# =========================
# SCORING RUBRIC (included in every prompt)
# =========================
SCORING_RUBRIC = """
=== MANDATORY SCORING RUBRIC — FOLLOW EXACTLY ===

For EACH score, evaluate against these SPECIFIC criteria and assign the score from the matching tier.
Do NOT deviate from these tiers. Apply them mechanically.

**visual_quality_score** (0-100):
- 90-100: Professional studio/agency quality. Perfect composition, lighting, color grading. High production value. Brand-consistent design system.
- 75-89: Good quality. Clear, well-lit visuals. Decent composition. Minor improvements possible (e.g., slightly better framing).
- 60-74: Average/acceptable. Stock-photo level or basic design. Some composition issues. Not terrible but not impressive.
- 40-59: Below average. Poor lighting, cluttered layout, unclear product presentation, amateur design.
- 20-39: Poor quality. Blurry, badly cropped, unprofessional look.
- 0-19: Unusable. No meaningful visual content or completely broken.

**copy_strength_score** (0-100):
- 90-100: Compelling headline + strong CTA + 3+ power words + emotional hooks + perfect length for platform. Award-winning copy.
- 75-89: Good copy with clear CTA and some emotional resonance. Appropriate length. Professional writing.
- 60-74: Adequate copy. Has a CTA but weak hook. May be too long/short. Gets the message across but doesn't excite.
- 40-59: Weak copy. Missing CTA OR unclear messaging OR no emotional triggers. Generic wording.
- 20-39: Very weak. No clear message, no CTA, confusing or irrelevant text.
- 0-19: No meaningful copy present, or completely irrelevant text.

**platform_fit_score** (0-100):
- 90-100: Perfectly optimized for the specified platform (correct aspect ratio, text ratio under 20%, right format and tone, follows all platform best practices).
- 75-89: Well-suited with only minor platform-specific improvements needed.
- 60-74: Acceptable but misses some platform best practices (e.g., wrong aspect ratio OR too much text OR wrong tone).
- 40-59: Significant platform mismatches. Multiple best practices violated.
- 20-39: Poor platform fit. Wrong format entirely.
- 0-19: Completely wrong for the platform.

**psychology_score** (0-100):
- 90-100: 5+ psychology triggers active and well-integrated. Masterful persuasion architecture.
- 75-89: 3-4 triggers clearly present. Good persuasive structure with clear intent.
- 60-74: 2-3 triggers present. Basic persuasion exists but could be stronger.
- 40-59: 1-2 weak triggers. Mostly informational, misses key persuasion opportunities.
- 20-39: No meaningful psychological triggers. Purely informational or confusing.
- 0-19: Counter-productive messaging that may actively harm conversion.

**platform_fit_scores** (per-platform, 0-100 each):
Score each platform INDEPENDENTLY based on how well this SPECIFIC creative would perform there:
- meta_feed: 1:1 or 4:5 ratio, text under 20%, thumb-stopping visual, clear CTA
- meta_stories: 9:16 vertical, motion-friendly, first-frame hook, swipe-up CTA
- meta_reels: 9:16, authentic/trending feel, strong opening hook, fast-paced
- tiktok_feed: Authentic UGC feel, trend-aware, native look, engaging first 1 second
- google_display: Clean layout, clear CTA button, brand visible, readable at small sizes
- google_search: Text-focused, keyword relevance, clean and informative
- youtube_preroll: Hook in first 5 seconds, skip-proof opening, clear value proposition
"""


# =========================
# EXPECTED JSON SCHEMA (included in every prompt)
# =========================
EXPECTED_JSON_SCHEMA = """{
  "visual_analysis": {
    "objects_detected": ["product", "person", "text overlay"],
    "dominant_colors": ["#FF5733", "#1E90FF"],
    "has_human_face": true,
    "face_emotion": "Happy",
    "text_in_image": "Buy Now - 50% Off",
    "text_ratio_percent": 25,
    "brightness_score": 72,
    "contrast_score": 68,
    "aspect_ratio": "1:1",
    "layout_description": "Product centered with CTA button at bottom",
    "visual_hierarchy_score": 75
  },
  "copy_analysis": {
    "sentiment": "Positive",
    "sentiment_score": 80,
    "emotional_tone": "Exciting",
    "has_cta": true,
    "cta_text": "Shop Now",
    "cta_strength": "Strong",
    "readability_score": 85,
    "power_words_found": ["free", "limited", "exclusive"],
    "caption_length": 120,
    "caption_length_verdict": "Optimal"
  },
  "hook_analysis": {
    "hook_text": "Don't miss this limited-time offer!",
    "hook_score": 78,
    "hook_type": "Urgency",
    "hook_weakness": "Could be more specific about the benefit",
    "hook_rewrites": ["Transform your routine in 7 days", "The secret top performers use daily"]
  },
  "psychology_triggers": {
    "fomo": true, "social_proof": false, "authority": true, "scarcity": true,
    "reciprocity": false, "aspirational": true, "pain_amplification": false, "curiosity_gap": true,
    "missing_triggers_suggestions": {"social_proof": "Add customer testimonial", "reciprocity": "Offer a free sample"}
  },
  "platform_rules": {
    "platform": "Meta",
    "violations": ["Text ratio exceeds 20% recommended limit"],
    "passed_checks": ["Image resolution OK", "No prohibited content"],
    "compliance_score": 75
  },
  "audience": {
    "inferred_age_range": "25-34", "gender_skew": "Female",
    "likely_interests": ["fitness", "wellness", "nutrition"],
    "income_bracket": "Upper-Middle",
    "mismatch_warnings": ["Visual style may not resonate with target demo"]
  },
  "platform_fit_scores": {
    "meta_feed": 82, "meta_stories": 68, "meta_reels": 55, "tiktok_feed": 45,
    "google_display": 78, "google_search": 30, "youtube_preroll": 60
  },
  "copy_variants": {
    "direct_response": "Get 50% off today only. Free shipping on all orders.",
    "storytelling": "Sarah struggled with her routine until she discovered this...",
    "social_proof": "Join 50,000+ happy customers who transformed their routine.",
    "headline_variants": ["Transform Your Day", "The #1 Choice", "Why Thousands Are Switching"],
    "cta_variants": ["Shop Now", "Claim Your Discount", "Start Today"],
    "hashtags": ["#gamechanging", "#limitedoffer", "#wellness"]
  },
  "ab_variants": {
    "variant_a": {"angle": "FOMO", "headline": "Last Chance: 50% Off Ends Tonight", "body": "Over 10,000 units sold this week.", "cta": "Grab Yours Now", "explanation": "Leverages urgency and social proof"},
    "variant_b": {"angle": "Benefit", "headline": "Wake Up Energized Every Morning", "body": "Clinically-proven formula for all-day focus.", "cta": "Try It Risk-Free", "explanation": "Core benefit focus with risk reduction"},
    "variant_c": {"angle": "Social Proof", "headline": "Rated #1 by 50,000+ Customers", "body": "See why professionals trust us.", "cta": "See Reviews", "explanation": "Authority and social validation"}
  },
  "scoring": {
    "visual_quality_score": 74, "copy_strength_score": 68,
    "platform_fit_score": 72, "psychology_score": 65,
    "overall_score": 70, "grade": "B",
    "verdict": "Strong visual with good CTA. Copy needs more emotional triggers. Test headline variants."
  },
  "feedback_checklist": {
    "high_priority": ["Reduce text overlay to under 20%", "Add social proof element"],
    "medium_priority": ["Test vertical format for Stories/Reels", "Strengthen the opening hook"],
    "low_priority": ["Add brand watermark", "Test darker background for contrast"]
  }
}"""


# =========================
# UTIL
# =========================
def normalize_score(score) -> int:
    try:
        score = float(score)
        if score <= 1:
            score *= 100
        elif score <= 10:
            score *= 10
        return max(0, min(100, int(round(score))))
    except:
        return 50  # Default to 50 instead of 0 for unknown


def safe(val, default):
    return val if val is not None else default


# =========================
# LLM CALL — Deterministic
# =========================
def _call_llm(prompt: str, image_bytes = None) -> str:
    if not OPENROUTER_API_KEY:
        raise UnauthenticatedError("Missing API key")

    last_error = None

    for model in FALLBACK_MODELS:
        try:
            messages = [{"role": "user", "content": []}]

            if image_bytes:
                if isinstance(image_bytes, list):
                    for img in image_bytes:
                        if img:
                            b64 = base64.b64encode(img).decode()
                            messages[0]["content"].append({
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                            })
                else:
                    b64 = base64.b64encode(image_bytes).decode()
                    messages[0]["content"].append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                    })
                messages[0]["content"].append({"type": "text", "text": prompt})
            else:
                messages[0]["content"] = prompt

            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *messages
                ],
                "temperature": 0,       # ZERO temperature = fully deterministic
                "top_p": 1,
                "seed": 42,             # Fixed seed for reproducibility
                "response_format": {"type": "json_object"},
            }

            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            }

            response = requests.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=120
            )

            if response.status_code == 401:
                raise UnauthenticatedError("Invalid API key")
            if response.status_code in (402, 429):
                print(f"[LLM] Model {model} rate limited ({response.status_code}), trying next...")
                continue
            if response.status_code != 200:
                print(f"[LLM] Model {model} returned {response.status_code}, trying next...")
                continue

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            used_model = data.get("model", model)

            if not content:
                print(f"[LLM] Model {model} returned empty content")
                continue

            print(f"[LLM] Success with model: {used_model} (len={len(content)})")
            return content

        except (UnauthenticatedError, QuotaExceededError):
            raise
        except Exception as e:
            last_error = str(e)
            print(f"[LLM] Model {model} failed: {last_error}")
            continue

    raise QuotaExceededError(f"All models failed: {last_error}")


# =========================
# SAFE TEMPLATE
# =========================
def get_safe_analysis_template():
    return {
        "advantage_ai_analysis": {"product": "AdVantage AI", "analysis_version": "2.0"},
        "visual_analysis": {
            "objects_detected": [], "dominant_colors": [], "has_human_face": False,
            "face_emotion": "Neutral", "text_in_image": "", "text_ratio_percent": 0,
            "brightness_score": 50, "contrast_score": 50, "aspect_ratio": "Unknown",
            "layout_description": "", "visual_hierarchy_score": 50
        },
        "copy_analysis": {
            "sentiment": "Neutral", "sentiment_score": 50, "emotional_tone": "Informative",
            "has_cta": False, "cta_text": "", "cta_strength": "Medium",
            "readability_score": 50, "power_words_found": [], "caption_length": 0,
            "caption_length_verdict": "Medium"
        },
        "hook_analysis": {
            "hook_text": "No hook detected.", "hook_score": 0, "hook_type": "Unknown",
            "hook_weakness": "None specified", "hook_rewrites": []
        },
        "psychology_triggers": {
            "fomo": False, "social_proof": False, "authority": False, "scarcity": False,
            "reciprocity": False, "aspirational": False, "pain_amplification": False,
            "curiosity_gap": False, "missing_triggers_suggestions": {}
        },
        "platform_rules": {
            "platform": "Unknown", "violations": [], "passed_checks": [], "compliance_score": 100
        },
        "audience": {
            "inferred_age_range": "18-65", "gender_skew": "Neutral", "likely_interests": [],
            "income_bracket": "Middle", "mismatch_warnings": []
        },
        "platform_fit_scores": {
            "meta_feed": 50, "meta_stories": 50, "meta_reels": 50, "tiktok_feed": 50,
            "google_display": 50, "google_search": 50, "youtube_preroll": 50
        },
        "copy_variants": {
            "direct_response": "", "storytelling": "", "social_proof": "",
            "headline_variants": [], "cta_variants": [], "hashtags": []
        },
        "ab_variants": {
            "variant_a": {"angle": "FOMO", "headline": "", "body": "", "cta": "", "explanation": ""},
            "variant_b": {"angle": "Benefit", "headline": "", "body": "", "cta": "", "explanation": ""},
            "variant_c": {"angle": "Social Proof", "headline": "", "body": "", "cta": "", "explanation": ""}
        },
        "scoring": {
            "visual_quality_score": 0, "copy_strength_score": 0,
            "platform_fit_score": 0, "psychology_score": 0,
            "overall_score": 0, "grade": "F", "verdict": "Awaiting analysis."
        },
        "feedback_checklist": {"high_priority": [], "medium_priority": [], "low_priority": []}
    }


# =========================
# SANITIZE LLM RESPONSE
# =========================
def _sanitize(base, incoming):
    """Recursively merge incoming LLM data into the base template, enforcing types."""
    for key, default_val in base.items():
        if key not in incoming:
            continue
        new_val = incoming[key]
        if isinstance(default_val, bool):
            base[key] = bool(new_val)
        elif isinstance(default_val, int):
            try:
                base[key] = int(float(new_val))
            except:
                pass
        elif isinstance(default_val, float):
            try:
                base[key] = float(new_val)
            except:
                pass
        elif isinstance(default_val, str):
            base[key] = str(new_val) if new_val is not None else ""
        elif isinstance(default_val, list):
            base[key] = new_val if isinstance(new_val, list) else ([new_val] if new_val else [])
        elif isinstance(default_val, dict):
            if isinstance(new_val, dict):
                _sanitize(base[key], new_val)
    return base


def _parse_llm_response(content: str) -> dict:
    """Parse LLM response, handling markdown wrapping, think tags, etc."""
    import re
    # Strip DeepSeek think tags
    if "<think>" in content:
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
    
    content = content.strip()
    
    # Strip markdown
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
        
    content = content.strip()

    try:
        data = json.loads(content)
        if isinstance(data, list):
            data = data[0] if data else {}
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        # Fallback: Regex extraction for the outermost JSON object
        print("[Analyzer] JSON decode failed, attempting regex extraction...")
        # This matches the first { and the last } in the string
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            extracted_json = match.group(0)
            try:
                data = json.loads(extracted_json)
                if isinstance(data, list):
                    data = data[0] if data else {}
                return data if isinstance(data, dict) else {}
            except json.JSONDecodeError as e:
                print(f"[Analyzer] Regex fallback JSON decode failed: {e}")
                return {}
        else:
            print("[Analyzer] No JSON object found via regex.")
            return {}


def _finalize_scores(result: dict, platform: str) -> dict:
    """Normalize scores, calculate overall, assign grade."""
    scoring = result.get("scoring", {})
    scoring["visual_quality_score"] = normalize_score(scoring.get("visual_quality_score", 0))
    scoring["copy_strength_score"] = normalize_score(scoring.get("copy_strength_score", 0))
    scoring["platform_fit_score"] = normalize_score(scoring.get("platform_fit_score", 0))
    scoring["psychology_score"] = normalize_score(scoring.get("psychology_score", 0))

    subs = [scoring["visual_quality_score"], scoring["copy_strength_score"],
            scoring["platform_fit_score"], scoring["psychology_score"]]
    scoring["overall_score"] = int(round(sum(subs) / 4))

    overall = scoring["overall_score"]
    if overall >= 90: scoring["grade"] = "A"
    elif overall >= 75: scoring["grade"] = "B"
    elif overall >= 60: scoring["grade"] = "C"
    elif overall >= 45: scoring["grade"] = "D"
    else: scoring["grade"] = "F"

    result["scoring"] = scoring
    result["platform_rules"]["platform"] = platform

    # Ensure hook_text is string
    hook = result.get("hook_analysis", {})
    if not isinstance(hook.get("hook_text"), str):
        hook["hook_text"] = str(hook.get("hook_text", ""))
    result["hook_analysis"] = hook

    return result


# =========================
# MAIN ANALYZER (with caching)
# =========================
def analyze_ad(image_bytes: bytes, caption: str, platform: str, objective: str, brand_profile: dict = None):
    # Check cache first — same input = same output
    cache_key = _get_cache_key(image_bytes or b"", caption, platform, objective)
    if cache_key in _analysis_cache:
        print(f"[Analyzer] Cache HIT for {cache_key[:16]}... returning cached result")
        return _analysis_cache[cache_key].copy()

    brand_context = ""
    if brand_profile:
        brand_context = f"\nBrand: {brand_profile.get('brand_name')}\nIndustry: {brand_profile.get('industry')}\nAudience: {brand_profile.get('target_audience')}\n"

    prompt = f"""You are AdVantage AI. Analyze this ad creative with professional precision.

{brand_context}
Caption: {caption}
Platform: {platform}
Campaign Objective: {objective}

Return a JSON object with EXACTLY this structure (replace example values with YOUR analysis):

{EXPECTED_JSON_SCHEMA}

{SCORING_RUBRIC}

CRITICAL INSTRUCTIONS:
1. Return ONLY the JSON. No markdown, no explanation.
2. Apply the scoring rubric EXACTLY — match your scores to the tier descriptions.
3. Set platform_rules.platform to "{platform}".
4. Every text field must have real content, not empty strings.
5. Every array must have at least 2 items.
"""

    result = get_safe_analysis_template()

    try:
        content = _call_llm(prompt, image_bytes)
        llm_data = _parse_llm_response(content)
        print(f"[Analyzer] LLM returned {len(llm_data)} keys: {list(llm_data.keys())}")
        result = _sanitize(result, llm_data)
        result = _finalize_scores(result, platform)
        print(f"[Analyzer] Final score: {result['scoring']['overall_score']}% ({result['scoring']['grade']})")

        # Cache the result
        _analysis_cache[cache_key] = result.copy()
        return result

    except (UnauthenticatedError, QuotaExceededError):
        raise
    except Exception as e:
        print(f"[Analyzer] Error: {e}")
        result["scoring"]["verdict"] = f"Analysis failed: {str(e)}"
        return result


# =========================
# REWRITE
# =========================
def rewrite_ad_text(original_text: str, feedback: str, brand_data: dict = None) -> dict:
    brand_context = f"Brand Context: {json.dumps(brand_data)}\n" if brand_data else ""
    prompt = f"""{brand_context}
Original Ad Copy: {original_text}
Feedback: {feedback}

Rewrite the ad copy to be 10x better. Provide 3 high-converting variations.
Return ONLY valid JSON: {{"rewritten_text": "best version", "variations": ["v1","v2","v3"], "explanation": "why it's better"}}"""

    try:
        content = _call_llm(prompt)
        data = _parse_llm_response(content)
        return {
            "rewritten_text": str(data.get("rewritten_text", original_text)),
            "variations": data.get("variations", [original_text]),
            "explanation": str(data.get("explanation", "Optimized for conversion."))
        }
    except Exception as e:
        print(f"[Analyzer] Rewrite error: {e}")
        return {"rewritten_text": original_text, "variations": [original_text],
                "explanation": f"Optimization failed: {str(e)}"}
