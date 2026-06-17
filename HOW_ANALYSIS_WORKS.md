# AdVantage AI — How Ad Analysis Works

## Complete Technical Documentation

This document explains exactly how AdVantage AI analyzes ads from URLs (Meta Ads Library links), uploaded images, and uploaded videos — including the full pipeline, scoring methodology, and calculation basis.

---

## Table of Contents

1. [Analysis Pipeline Overview](#1-analysis-pipeline-overview)
2. [URL / Link Analysis Pipeline (Step-by-Step)](#2-url--link-analysis-pipeline)
3. [Image Analysis Pipeline](#3-image-analysis-pipeline)
4. [Video Analysis Pipeline](#4-video-analysis-pipeline)
5. [AI Model & Configuration](#5-ai-model--configuration)
6. [Scoring Methodology](#6-scoring-methodology)
7. [Score Calculation Formula](#7-score-calculation-formula)
8. [Grading System](#8-grading-system)
9. [Full Analysis Schema](#9-full-analysis-schema)
10. [Caching & Consistency](#10-caching--consistency)

---

## 1. Analysis Pipeline Overview

```
┌─────────────────────────────────────────────────────┐
│                   USER INPUT                         │
│  (Meta Ads URL / Image Upload / Video Upload)        │
└────────────┬────────────────────────────┬────────────┘
             │                            │
    ┌────────▼────────┐          ┌────────▼────────┐
    │  URL Pipeline   │          │ Upload Pipeline  │
    │  (url_analyzer) │          │ (analyzer /      │
    │                 │          │  video_analyzer)  │
    └────────┬────────┘          └────────┬────────┘
             │                            │
    ┌────────▼─────────────────────────────▼────────┐
    │              CACHE CHECK                      │
    │  SHA256(image + caption + platform + obj)     │
    │  HIT? → Return cached result instantly        │
    └────────────────────┬─────────────────────────┘
                         │ MISS
    ┌────────────────────▼─────────────────────────┐
    │           AI MODEL (LLM)                      │
    │  Model: google/gemini-2.0-flash-001           │
    │  Temperature: 0 (fully deterministic)         │
    │  Seed: 42 (reproducible)                      │
    │  Input: Image + Extracted Text + Rubric       │
    └────────────────────┬─────────────────────────┘
                         │
    ┌────────────────────▼─────────────────────────┐
    │          SANITIZE & NORMALIZE                 │
    │  Enforce types, clamp 0-100, calculate        │
    │  overall score, assign grade                  │
    └────────────────────┬─────────────────────────┘
                         │
    ┌────────────────────▼─────────────────────────┐
    │           RETURN TO FRONTEND                  │
    │  JSON with scores, feedback, suggestions      │
    └──────────────────────────────────────────────┘
```

---

## 2. URL / Link Analysis Pipeline

When a user pastes a Meta Ads Library link (e.g., `https://www.facebook.com/ads/library/?id=XXXXX`), here's exactly what happens:

### Step 1: Platform Detection
```
File: backend/url_analyzer.py → detect_platform()

Input:  "https://www.facebook.com/ads/library/?id=1321554409342651"
Output: "Meta" (detected from URL pattern)

Also detects: TikTok, Google, YouTube, Instagram, Twitter/X, LinkedIn, Pinterest
```

### Step 2: Meta Ads Library Detection
```
File: backend/url_analyzer.py → is_meta_ads_library()

Checks if URL contains "facebook.com/ads/library" or "fb.com/ads/library"
Result: true → triggers special Meta handling
```

### Step 3: Screenshot + Text Extraction (Playwright)
```
File: backend/url_analyzer.py → screenshot_and_extract()

Tool:      Playwright (headless Chromium browser)
Viewport:  1280 × 900 pixels
UserAgent: Chrome 120 (realistic browser fingerprint)
Wait:      10 seconds for Meta (JS rendering), 4 seconds for other URLs
Timeout:   60 seconds for page load, 15 seconds for screenshot

What it does:
1. Opens headless Chrome browser
2. Navigates to the URL
3. Waits 10 seconds for Meta's JavaScript to render the ad
4. Dismisses cookie consent banners (if any)
5. Extracts ALL visible text using document.body.innerText
6. Takes a full viewport screenshot (1280×900)
7. Returns: { screenshot_b64, extracted_text }

Example extracted text (from the debug test):
────────────────────────────────────────
"techcrazeyt
Zero Lifestyle کے ساتھ techcrazeyt
سپانسرڈ
Best Seller restocked Crown Smartwatch - 𝐈𝐧𝐝𝐮𝐬𝐭𝐫𝐲'𝐬 𝐅𝐢𝐫𝐬𝐭 𝐕𝐞𝐠𝐚𝐧-𝐆𝐫𝐚𝐝𝐞 𝐋𝐞𝐚𝐭𝐡𝐞𝐫 𝐒𝐭𝐫𝐚𝐩
ZEROLIFESTYLE.CO
Leather Strap that doesn't wrinkle
True Always On | Ultra AMOLED Display
ابھی خریدیں (Shop Now)"
────────────────────────────────────────
```

### Step 4: Build Caption Context
```
The extracted text is wrapped with instructions for the AI:

"This ad was found on Meta Ads Library.
Below is the text content extracted from the ad listing:

[extracted text here]

IMPORTANT: Analyze the ACTUAL AD CONTENT shown above — the headlines, CTA,
body text, and visual creative. Provide specific feedback about THIS ad,
not generic advice. Reference the actual text/CTA in your analysis."
```

### Step 5: Send to AI for Analysis
```
The screenshot (as image bytes) + caption context are sent to:
  analyzer.analyze_ad(image_bytes, caption_context, platform, objective)

This is the SAME analysis function used for uploaded images.
```

### Step 6: Return Result
```
The analysis result includes:
- screenshot_b64 (for frontend preview)
- source_url (the original URL)
- All scoring, feedback, and suggestions
- warning: "Meta Ads Library detected..."
```

---

## 3. Image Analysis Pipeline

When a user uploads an image:

```
File: backend/analyzer.py → analyze_ad()

1. Image bytes received from upload
2. Cache check (SHA256 hash of image + caption + platform + objective)
3. If cache HIT → return cached result (instant, identical)
4. If cache MISS → build prompt with:
   - Image (base64 encoded)
   - Caption text (user-provided)
   - Platform (Meta, TikTok, Google, etc.)
   - Campaign objective (awareness, conversion, etc.)
   - Brand profile (if set)
   - Full JSON schema template
   - Professional scoring rubric
5. Send to LLM (google/gemini-2.0-flash-001, temp=0, seed=42)
6. Parse JSON response
7. Sanitize all values (enforce types, handle missing fields)
8. Normalize scores (0-100 range)
9. Calculate overall score and grade
10. Cache the result
11. Return to frontend
```

---

## 4. Video Analysis Pipeline

When a user uploads a video:

```
File: backend/video_analyzer.py → analyze_video_ad()

1. Save video to temp file
2. Extract 6 evenly-spaced frames using OpenCV
3. Extract audio using MoviePy → transcribe with SpeechRecognition
4. Cache check (SHA256 of first frame + caption + platform)
5. Build prompt including:
   - First frame (as image)
   - Audio transcript
   - Number of frames analyzed
   - Video-specific evaluation criteria
   - Same scoring rubric as image analysis
6. Send to LLM
7. Parse, sanitize, normalize (same as image)
8. Add video metadata (duration, frame count, audio presence)
9. Cache and return
```

---

## 5. AI Model & Configuration

```
Primary Model:   google/gemini-2.0-flash-001
Fallback 1:      google/gemini-2.5-flash-preview-05-20
Fallback 2:      openai/gpt-4o-mini
Last Resort:     openrouter/auto

Temperature:     0       (fully deterministic — no randomness)
Top-P:           1       (no nucleus sampling)
Seed:            42      (fixed seed for reproducibility)
Response Format: JSON    (structured output mode)
Timeout:         120s    (per LLM call)

WHY these settings?
- Temperature 0 + seed 42 = same input ALWAYS produces same output
- Specific model (not "auto") = consistent scoring across runs
- google/gemini-2.0-flash-001 is fast, cheap, supports vision, reliable JSON
```

---

## 6. Scoring Methodology

The AI evaluates the ad creative across **4 dimensions**, each scored 0-100 using a mandatory rubric:

### 6.1 Visual Quality Score (0-100)

| Score Range | Criteria |
|-------------|----------|
| **90-100** | Professional studio/agency quality. Perfect composition, lighting, color grading. High production value. Brand-consistent design system. |
| **75-89** | Good quality. Clear, well-lit visuals. Decent composition. Minor improvements possible. |
| **60-74** | Average/acceptable. Stock-photo level or basic design. Some composition issues. |
| **40-59** | Below average. Poor lighting, cluttered layout, unclear product, amateur design. |
| **20-39** | Poor quality. Blurry, badly cropped, unprofessional. |
| **0-19** | Unusable. No meaningful visual content. |

**What it evaluates:**
- Image resolution and clarity
- Color composition and harmony
- Visual hierarchy (what draws the eye first)
- Product presentation
- Text overlay readability
- Brand consistency
- Professional vs amateur feel

### 6.2 Copy Strength Score (0-100)

| Score Range | Criteria |
|-------------|----------|
| **90-100** | Compelling headline + strong CTA + 3+ power words + emotional hooks + perfect length. |
| **75-89** | Good copy with clear CTA and emotional resonance. Professional writing. |
| **60-74** | Adequate copy. Has CTA but weak hook. May be too long/short. |
| **40-59** | Weak copy. Missing CTA OR unclear messaging OR no emotional triggers. |
| **20-39** | Very weak. No clear message, no CTA, confusing text. |
| **0-19** | No meaningful copy present. |

**What it evaluates:**
- Headline effectiveness
- Call-to-Action (CTA) presence and strength
- Power words (free, limited, exclusive, etc.)
- Emotional tone and resonance
- Caption length appropriateness for platform
- Readability and clarity
- Sentiment analysis

### 6.3 Platform Fit Score (0-100)

| Score Range | Criteria |
|-------------|----------|
| **90-100** | Perfectly optimized (correct aspect ratio, text <20%, right format/tone). |
| **75-89** | Well-suited with minor improvements needed. |
| **60-74** | Acceptable but misses some platform best practices. |
| **40-59** | Significant platform mismatches. Multiple violations. |
| **20-39** | Poor platform fit. Wrong format entirely. |
| **0-19** | Completely wrong for the platform. |

**Platform-specific criteria evaluated:**
- **Meta Feed**: 1:1 or 4:5 ratio, text under 20%, thumb-stopping visual
- **Meta Stories/Reels**: 9:16 vertical, motion-friendly, first-frame hook
- **TikTok Feed**: Authentic UGC feel, trend-aware, native look
- **Google Display**: Clean layout, clear CTA button, brand visible
- **Google Search**: Text-focused, keyword relevance
- **YouTube Pre-roll**: Hook in first 5 seconds, skip-proof opening

### 6.4 Psychology Score (0-100)

| Score Range | Criteria |
|-------------|----------|
| **90-100** | 5+ psychology triggers active, masterful persuasion architecture. |
| **75-89** | 3-4 triggers clearly present, good persuasive structure. |
| **60-74** | 2-3 triggers present, basic persuasion. |
| **40-59** | 1-2 weak triggers, mostly informational. |
| **20-39** | No meaningful triggers, purely informational. |
| **0-19** | Counter-productive messaging. |

**Psychology triggers detected:**
| Trigger | Description |
|---------|-------------|
| **FOMO** | Fear of Missing Out — urgency, limited time |
| **Social Proof** | Customer reviews, "50,000+ users", testimonials |
| **Authority** | Expert endorsement, "Award-winning", certifications |
| **Scarcity** | Limited stock, exclusive access |
| **Reciprocity** | Free trial, free sample, bonus gift |
| **Aspirational** | "Be the best version of yourself" |
| **Pain Amplification** | Highlighting the problem the product solves |
| **Curiosity Gap** | "The secret that top performers use..." |

---

## 7. Score Calculation Formula

### Overall Score
```
overall_score = (visual_quality + copy_strength + platform_fit + psychology) / 4
```

This is a simple average of the 4 dimension scores. Each dimension carries **equal weight** (25%).

### Per-Platform Fit Scores
In addition to the main platform_fit_score, each ad gets scored for **7 specific platforms**:

```
meta_feed:       0-100  (how well it fits Facebook/Instagram feed)
meta_stories:    0-100  (how well it fits Stories format)
meta_reels:      0-100  (how well it fits Reels format)
tiktok_feed:     0-100  (how well it fits TikTok)
google_display:  0-100  (how well it fits Google Display Network)
google_search:   0-100  (how well it fits Google Search ads)
youtube_preroll: 0-100  (how well it fits YouTube pre-roll)
```

### Score Normalization
All scores go through normalization to handle edge cases:
```python
def normalize_score(score):
    if score <= 1:     # LLM returned 0.0-1.0 scale
        score *= 100
    elif score <= 10:  # LLM returned 0-10 scale
        score *= 10
    return clamp(score, 0, 100)  # Ensure 0-100 range
```

---

## 8. Grading System

| Overall Score | Grade | Label |
|--------------|-------|-------|
| **90-100** | **A** | Excellent — Ready to scale |
| **75-89** | **B** | Good — Minor optimizations needed |
| **60-74** | **C** | Average — Needs improvement |
| **45-59** | **D** | Below Average — Significant issues |
| **0-44** | **F** | Poor — Complete overhaul needed |

---

## 9. Full Analysis Schema

Every analysis returns this complete JSON structure:

```
{
  "visual_analysis": {
    "objects_detected":        ["product", "person", "text overlay"],
    "dominant_colors":         ["#FF5733", "#1E90FF"],
    "has_human_face":          true/false,
    "face_emotion":            "Happy/Neutral/Excited/...",
    "text_in_image":           "Detected text from the ad",
    "text_ratio_percent":      25,
    "brightness_score":        0-100,
    "contrast_score":          0-100,
    "aspect_ratio":            "1:1 / 4:5 / 9:16 / 16:9",
    "layout_description":      "Product centered with CTA at bottom",
    "visual_hierarchy_score":  0-100
  },

  "copy_analysis": {
    "sentiment":              "Positive/Negative/Neutral",
    "sentiment_score":        0-100,
    "emotional_tone":         "Exciting/Informative/Urgent/...",
    "has_cta":                true/false,
    "cta_text":               "Shop Now",
    "cta_strength":           "Strong/Medium/Weak",
    "readability_score":      0-100,
    "power_words_found":      ["free", "limited", "exclusive"],
    "caption_length":         120 (characters),
    "caption_length_verdict": "Optimal/Too Short/Too Long"
  },

  "hook_analysis": {
    "hook_text":     "Don't miss this limited-time offer!",
    "hook_score":    0-100,
    "hook_type":     "Urgency/Question/Statistic/Story/...",
    "hook_weakness": "Could be more specific about the benefit",
    "hook_rewrites": ["Better hook version 1", "Better hook version 2"]
  },

  "psychology_triggers": {
    "fomo": true/false,
    "social_proof": true/false,
    "authority": true/false,
    "scarcity": true/false,
    "reciprocity": true/false,
    "aspirational": true/false,
    "pain_amplification": true/false,
    "curiosity_gap": true/false,
    "missing_triggers_suggestions": {
      "social_proof": "Add customer testimonial",
      "reciprocity": "Offer a free sample"
    }
  },

  "platform_rules": {
    "platform":         "Meta",
    "violations":       ["Text ratio exceeds 20%"],
    "passed_checks":    ["Image resolution OK"],
    "compliance_score": 0-100
  },

  "audience": {
    "inferred_age_range":  "25-34",
    "gender_skew":         "Female/Male/Neutral",
    "likely_interests":    ["fitness", "wellness"],
    "income_bracket":      "Upper-Middle",
    "mismatch_warnings":   ["Visual style may not resonate with target demo"]
  },

  "platform_fit_scores": {
    "meta_feed": 82, "meta_stories": 68, "meta_reels": 55,
    "tiktok_feed": 45, "google_display": 78,
    "google_search": 30, "youtube_preroll": 60
  },

  "copy_variants": {
    "direct_response": "Get 50% off today only.",
    "storytelling":    "Sarah struggled until she discovered...",
    "social_proof":    "Join 50,000+ happy customers.",
    "headline_variants": ["Transform Your Day", "The #1 Choice"],
    "cta_variants":      ["Shop Now", "Claim Your Discount"],
    "hashtags":          ["#gamechanging", "#limitedoffer"]
  },

  "ab_variants": {
    "variant_a": { "angle": "FOMO",         "headline": "...", "body": "...", "cta": "..." },
    "variant_b": { "angle": "Benefit",      "headline": "...", "body": "...", "cta": "..." },
    "variant_c": { "angle": "Social Proof", "headline": "...", "body": "...", "cta": "..." }
  },

  "scoring": {
    "visual_quality_score": 74,
    "copy_strength_score":  68,
    "platform_fit_score":   72,
    "psychology_score":     65,
    "overall_score":        70,
    "grade":                "B",
    "verdict":              "Strong visual with good CTA. Copy needs more triggers."
  },

  "feedback_checklist": {
    "high_priority":   ["Reduce text overlay to under 20%"],
    "medium_priority": ["Test vertical format for Stories"],
    "low_priority":    ["Add brand watermark"]
  }
}
```

---

## 10. Caching & Consistency

### How Caching Works
```
Cache Key = SHA256(image_bytes + caption + platform + objective)

Same image + same settings = ALWAYS returns the EXACT same result
(no API call needed — instant response from memory)
```

### Why Scores Are Consistent
| Setting | Value | Effect |
|---------|-------|--------|
| **Model** | `google/gemini-2.0-flash-001` | Same model every time (not random) |
| **Temperature** | `0` | Zero randomness in output |
| **Seed** | `42` | Fixed random seed |
| **Cache** | SHA256 hash | Same input = cached result |
| **Rubric** | Mandatory scoring tiers | Model follows specific criteria |

### Verified Result
Running the same analysis 3 times produced:
```
Run 1: overall=66, visual=75, copy=65, platform=75, psych=50
Run 2: overall=66, visual=75, copy=65, platform=75, psych=50
Run 3: overall=66, visual=75, copy=65, platform=75, psych=50
→ PERFECT CONSISTENCY ✓
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `backend/analyzer.py` | Core image analysis, LLM call, caching, scoring rubric |
| `backend/video_analyzer.py` | Video frame extraction, audio transcription, video analysis |
| `backend/url_analyzer.py` | URL screenshot, text extraction, Meta Ads Library handling |
| `backend/main.py` | FastAPI endpoints, request routing |
| `frontend/src/App.tsx` | Image/URL analysis UI (ANALYZE tab) |
| `frontend/src/VideoAnalyzePage.tsx` | Video/URL analysis UI (VIDEO tab) |

---

*Document version: 2.0 — Last updated: May 6, 2026*
*AdVantage AI — Professional Advertising Analysis Platform*
