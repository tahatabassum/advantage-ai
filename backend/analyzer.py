import os
import json
import base64
import requests
from dotenv import load_dotenv

load_dotenv()


class UnauthenticatedError(Exception):
    pass


class QuotaExceededError(Exception):
    pass


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

if not OPENROUTER_API_KEY:
    print("WARNING: OPENROUTER_API_KEY is missing. AI features will fail.")

# Free models in priority order — if one fails, next is tried automatically
FALLBACK_MODELS = [
    "openrouter/auto",                                  # Auto picks best available
    "google/gemma-3-27b-it:free",                      # Google Gemma 3 - vision capable
    "meta-llama/llama-4-maverick:free",                 # Llama 4 - vision capable
    "meta-llama/llama-4-scout:free",                    # Llama 4 Scout - fast + vision
    "qwen/qwen2.5-vl-72b-instruct:free",               # Qwen Vision - JSON reliable
    "qwen/qwen3-235b-a22b:free",                        # Qwen3 - strongest free reasoning
    "mistralai/mistral-small-3.1-24b-instruct:free",   # Mistral - reliable
    "microsoft/mai-ds-r1:free",                         # Microsoft MAI - strong reasoning
    "tngtech/deepseek-r1t-chimera:free",               # DeepSeek Chimera variant
    "deepseek/deepseek-r1:free",                        # DeepSeek R1
    "meta-llama/llama-3.3-70b-instruct:free",          # Llama 3.3 fallback
]

SYSTEM_PROMPT = """You are AdVantage AI — an expert digital marketing strategist
and creative director with 15 years of experience running paid
ads on Meta, TikTok, and Google. You analyze ad creatives like
a top agency professional.
Always respond in valid JSON only. No markdown. No explanation outside JSON."""


def normalize_score(score) -> int:
    """
    Normalize LLM score output to 0-100 integer scale.
    Handles 0-1, 0-10, and 0-100 scales automatically.
    """
    try:
        score = float(score)
        if score <= 1.0:        # 0-1 scale (e.g. 0.78) → multiply by 100
            score = score * 100
        elif score <= 10.0:     # 0-10 scale (e.g. 7.8) → multiply by 10
            score = score * 10
        # 0-100 scale → keep as is
        return min(100, max(0, int(round(score))))
    except:
        return 0


def _call_llm(prompt: str, image_bytes: bytes = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise UnauthenticatedError("No OPENROUTER_API_KEY found. Please set it in your .env file.")

    last_error = None

    for model in FALLBACK_MODELS:
        try:
            messages = [{"role": "user", "content": []}]

            # Add image if provided
            if image_bytes:
                b64_image = base64.b64encode(image_bytes).decode("utf-8")
                messages[0]["content"].append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{b64_image}"
                    }
                })

            # Add text prompt
            messages[0]["content"].append({
                "type": "text",
                "text": prompt
            })

            # If no image, simplify content to string
            if not image_bytes:
                messages[0]["content"] = prompt

            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *messages
                ],
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
            }

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://advantage-ai.app",
                "X-Title": "AdVantage AI",
            }

            response = requests.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=60
            )

            # Handle auth error — no point retrying other models
            if response.status_code == 401:
                raise UnauthenticatedError("OpenRouter authentication failed. Check your API key.")

            # Rate limit or quota — try next model
            if response.status_code in (429, 402):
                print(f"[Fallback] Model {model} quota exceeded, trying next...")
                last_error = f"Model {model} quota exceeded"
                continue

            if response.status_code != 200:
                print(f"[Fallback] Model {model} returned {response.status_code}, trying next...")
                last_error = f"Model {model} error {response.status_code}"
                continue

            data = response.json()

            # Check if model returned empty response
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content:
                print(f"[Fallback] Model {model} returned empty content, trying next...")
                last_error = f"Model {model} returned empty content"
                continue

            print(f"[Success] Used model: {model}")
            return content

        except (UnauthenticatedError, QuotaExceededError):
            raise
        except requests.exceptions.Timeout:
            print(f"[Fallback] Model {model} timed out, trying next...")
            last_error = f"Model {model} timed out"
            continue
        except Exception as e:
            print(f"[Fallback] Model {model} failed: {str(e)}, trying next...")
            last_error = str(e)
            continue

    # All models failed
    raise QuotaExceededError(
        f"All available models are currently unavailable. Last error: {last_error}. "
        "Please try again in a few minutes."
    )


def rewrite_ad_text(original_text: str, feedback: list, brand_profile: dict = None) -> dict:
    brand_context = ""
    if brand_profile:
        brand_context = f"""
BRAND CONTEXT:
- Brand Name: {brand_profile.get('brand_name')}
- Industry: {brand_profile.get('industry')}
- Target Audience: {brand_profile.get('target_audience')}
- Brand Voice: {brand_profile.get('brand_voice', 'Professional')}
"""

    feedback_str = "\n".join([f"- {f}" for f in feedback])

    prompt = f"""As a conversion-focused copywriter, rewrite the following ad text to address the feedback provided.
{brand_context}
ORIGINAL TEXT:
"{original_text}"

FEEDBACK TO ADDRESS:
{feedback_str}

Return a JSON object with this exact structure:
{{
  "rewritten_text": "the new copy",
  "explanation": "briefly explain what changes were made and why based on the feedback"
}}"""

    try:
        content = _call_llm(prompt)
        return json.loads(content)
    except (UnauthenticatedError, QuotaExceededError):
        raise
    except Exception as e:
        raise ValueError(f"Rewrite failed: {str(e)}")


def analyze_ad(image_bytes: bytes, caption: str, platform: str, objective: str, brand_profile: dict = None) -> dict:
    brand_context = ""
    if brand_profile:
        brand_context = f"""
BRAND CONTEXT:
- Brand Name: {brand_profile.get('brand_name')}
- Industry: {brand_profile.get('industry')}
- Target Audience: {brand_profile.get('target_audience')}
- Brand Voice: {brand_profile.get('brand_voice', 'Professional')}
- Competitors: {brand_profile.get('main_competitors')}
Use this context to grade the ad's 'Platform Fit' and 'Psychology Triggers' accurately.
"""

    prompt = f"""Analyze this ad creative for AdVantage AI.
{brand_context}
Caption: {caption}
Platform: {platform}
Objective: {objective}

SCORING RULES — FOLLOW STRICTLY:
- All scores must be integers between 0 and 100
- Do NOT use decimals (not 7.5, not 0.75 — use 75)
- Do NOT score out of 10 — always out of 100
- overall_score is the average of the 4 sub-scores
- grade: A (90+), B (75-89), C (60-74), D (45-59), F (below 45)

Return a JSON object with this exact structure (fill all fields with real analysis):
{{
  "advantage_ai_analysis": {{"product": "AdVantage AI", "analysis_version": "1.0"}},
  "visual_analysis": {{
    "objects_detected": [],
    "dominant_colors": [],
    "has_human_face": false,
    "face_emotion": "",
    "text_in_image": "",
    "text_ratio_percent": 0,
    "brightness_score": 0,
    "contrast_score": 0,
    "aspect_ratio": "",
    "layout_description": "",
    "visual_hierarchy_score": 0
  }},
  "copy_analysis": {{
    "sentiment": "",
    "sentiment_score": 0,
    "emotional_tone": "",
    "has_cta": false,
    "cta_text": "",
    "cta_strength": "",
    "readability_score": 0,
    "power_words_found": [],
    "caption_length": 0,
    "caption_length_verdict": ""
  }},
  "hook_analysis": {{
    "hook_text": "",
    "hook_score": 0,
    "hook_type": "",
    "hook_weakness": "",
    "hook_rewrites": []
  }},
  "psychology_triggers": {{
    "fomo": false,
    "social_proof": false,
    "authority": false,
    "scarcity": false,
    "reciprocity": false,
    "aspirational": false,
    "pain_amplification": false,
    "curiosity_gap": false,
    "missing_triggers_suggestions": {{}}
  }},
  "platform_rules": {{
    "platform": "{platform}",
    "violations": [],
    "passed_checks": [],
    "compliance_score": 0
  }},
  "audience": {{
    "inferred_age_range": "",
    "gender_skew": "",
    "likely_interests": [],
    "income_bracket": "",
    "mismatch_warnings": []
  }},
  "platform_fit_scores": {{
    "meta_feed": 0,
    "meta_stories": 0,
    "meta_reels": 0,
    "tiktok_feed": 0,
    "google_display": 0,
    "google_search": 0,
    "youtube_preroll": 0
  }},
  "copy_variants": {{
    "direct_response": "",
    "storytelling": "",
    "social_proof": "",
    "headline_variants": [],
    "cta_variants": [],
    "hashtags": []
  }},
  "ab_variants": {{
    "variant_a": {{"angle": "FOMO", "headline": "", "body": "", "cta": "", "explanation": ""}},
    "variant_b": {{"angle": "Benefit", "headline": "", "body": "", "cta": "", "explanation": ""}},
    "variant_c": {{"angle": "Social Proof", "headline": "", "body": "", "cta": "", "explanation": ""}}
  }},
  "scoring": {{
    "visual_quality_score": 0,
    "copy_strength_score": 0,
    "platform_fit_score": 0,
    "psychology_score": 0,
    "overall_score": 0,
    "grade": "",
    "verdict": ""
  }},
  "feedback_checklist": {{
    "high_priority": [],
    "medium_priority": [],
    "low_priority": []
  }}
}}"""

    try:
        content = _call_llm(prompt, image_bytes)
        result = json.loads(content)

        # Normalize all scores regardless of what scale LLM used
        scoring = result.get("scoring", {})
        scoring["visual_quality_score"] = normalize_score(scoring.get("visual_quality_score", 0))
        scoring["copy_strength_score"] = normalize_score(scoring.get("copy_strength_score", 0))
        scoring["platform_fit_score"] = normalize_score(scoring.get("platform_fit_score", 0))
        scoring["psychology_score"] = normalize_score(scoring.get("psychology_score", 0))
        scoring["overall_score"] = normalize_score(scoring.get("overall_score", 0))

        # Recalculate overall_score as average of 4 sub-scores for consistency
        sub_scores = [
            scoring["visual_quality_score"],
            scoring["copy_strength_score"],
            scoring["platform_fit_score"],
            scoring["psychology_score"],
        ]
        scoring["overall_score"] = int(round(sum(sub_scores) / len(sub_scores)))

        # Recalculate grade based on normalized overall_score
        overall = scoring["overall_score"]
        if overall >= 90:
            scoring["grade"] = "A"
        elif overall >= 75:
            scoring["grade"] = "B"
        elif overall >= 60:
            scoring["grade"] = "C"
        elif overall >= 45:
            scoring["grade"] = "D"
        else:
            scoring["grade"] = "F"

        result["scoring"] = scoring
        return result

    except (UnauthenticatedError, QuotaExceededError):
        raise
    except Exception as e:
        raise ValueError(f"Analysis failed: {str(e)}")