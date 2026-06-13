import cv2
import os
import json
import base64
import tempfile
import asyncio
from moviepy.editor import VideoFileClip
import speech_recognition as sr
from analyzer import _call_llm, normalize_score, UnauthenticatedError, QuotaExceededError

def extract_frames(video_path: str, num_frames: int = 6) -> list[bytes]:
    """
    Extracts num_frames evenly spaced frames from a video and returns them as JPEG bytes.
    """
    frames = []
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return frames

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        return frames

    # Calculate intervals
    interval = max(1, total_frames // num_frames)
    
    for i in range(num_frames):
        frame_idx = min(i * interval, total_frames - 1)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break
        
        # Encode as JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        frames.append(buffer.tobytes())

    cap.release()
    return frames

def extract_audio_transcript(video_path: str) -> str:
    """
    Extracts audio from video and transcribes it to text.
    """
    temp_audio_path = None
    try:
        # Create a temp file for audio
        fd, temp_audio_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

        # Extract audio using moviepy
        video = VideoFileClip(video_path)
        if video.audio is None:
            return ""
        
        video.audio.write_audiofile(temp_audio_path, codec='pcm_s16le', verbose=False, logger=None)
        video.close()

        # Transcribe using SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_audio_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
                return text
            except sr.UnknownValueError:
                return ""
            except sr.RequestError:
                return ""
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return ""
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass

def analyze_video_ad(
    video_bytes: bytes,
    caption: str,
    platform: str,
    objective: str,
    brand_profile: dict = None
) -> dict:
    """
    Full pipeline for analyzing a video ad.
    """
    temp_video_path = None
    try:
        # 1. Save video_bytes to a temp file
        fd, temp_video_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        with open(temp_video_path, 'wb') as f:
            f.write(video_bytes)

        # 2. Extract frames
        frames = extract_frames(temp_video_path, 6)
        if not frames:
            raise ValueError("Could not extract frames from video.")

        # 3. Extract audio transcript
        transcript = extract_audio_transcript(temp_video_path)

        # 4. Build brand_context
        brand_context = ""
        if brand_profile:
            brand_context = f"""
BRAND CONTEXT:
- Brand Name: {brand_profile.get('brand_name')}
- Industry: {brand_profile.get('industry')}
- Target Audience: {brand_profile.get('target_audience')}
- Brand Voice: {brand_profile.get('brand_voice', 'Professional')}
- Competitors: {brand_profile.get('main_competitors')}
"""

        # 5. Build prompt and call LLM
        # Using the first frame for visual reference as requested
        prompt = f"""
Analyze this video ad creative for AdVantage AI.
{brand_context}
Caption/Script: {caption}
Platform: {platform}
Objective: {objective}
Audio Transcript: {transcript}
Total Frames Extracted: {len(frames)}

This is a VIDEO ad. Analyze it considering:
- Visual storytelling and scene progression
- Audio-visual alignment
- Pacing and hook strength in first 3 seconds
- Motion and dynamic elements
- Whether the ad appears to be AI-generated or human-made

SCORING RULES — FOLLOW STRICTLY:
- All scores must be integers between 0 and 100
- Do NOT use decimals (not 7.5, not 0.75 — use 75)
- Do NOT score out of 10 — always out of 100
- overall_score is the average of the 4 sub-scores
- grade: A (90+), B (75-89), C (60-74), D (45-59), F (below 45)

AI DETECTION RULES:
- Analyze visual and audio indicators carefully
- Look for: perfect symmetry, unnatural smoothness,
  synthetic voices, AI art styles, deepfake artifacts,
  inconsistent lighting, text rendering errors
- Confidence must be integer 0-100
- Be honest — if unsure, say confidence is low

Return a JSON object with this exact structure:
{{
  "advantage_ai_analysis": {{
    "product": "AdVantage AI",
    "analysis_version": "2.0",
    "type": "video"
  }},
  "ai_detection": {{
    "is_ai_generated": false,
    "confidence": 0,
    "indicators": [],
    "verdict": "",
    "recommendation": ""
  }},
  "video_analysis": {{
    "duration_seconds": 0,
    "total_frames_analyzed": 0,
    "has_audio": false,
    "audio_transcript": "",
    "scene_count": 0,
    "pacing": "",
    "hook_strength": "",
    "first_3_seconds_verdict": "",
    "visual_storytelling_score": 0,
    "audio_visual_alignment": ""
  }},
  "visual_analysis": {{
    "dominant_colors": [],
    "has_human_face": false,
    "face_emotion": "",
    "text_in_video": "",
    "brightness_score": 0,
    "contrast_score": 0,
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
    "platform": "",
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
  "copy_variants": {{
    "direct_response": "",
    "storytelling": "",
    "social_proof": "",
    "headline_variants": [],
    "cta_variants": [],
    "hashtags": []
  }},
  "ab_variants": {{
    "variant_a": {{
      "angle": "FOMO",
      "headline": "",
      "body": "",
      "cta": "",
      "explanation": ""
    }},
    "variant_b": {{
      "angle": "Benefit",
      "headline": "",
      "body": "",
      "cta": "",
      "explanation": ""
    }},
    "variant_c": {{
      "angle": "Social Proof",
      "headline": "",
      "body": "",
      "cta": "",
      "explanation": ""
    }}
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
}}
"""
        content = _call_llm(prompt, frames[0])
        result = json.loads(content)

        # 7. Normalize all scores
        scoring = result.get("scoring", {})
        scoring["visual_quality_score"] = normalize_score(scoring.get("visual_quality_score", 0))
        scoring["copy_strength_score"] = normalize_score(scoring.get("copy_strength_score", 0))
        scoring["platform_fit_score"] = normalize_score(scoring.get("platform_fit_score", 0))
        scoring["psychology_score"] = normalize_score(scoring.get("psychology_score", 0))
        
        # 8. Recalculate overall_score
        sub_scores = [
            scoring["visual_quality_score"],
            scoring["copy_strength_score"],
            scoring["platform_fit_score"],
            scoring["psychology_score"],
        ]
        scoring["overall_score"] = int(round(sum(sub_scores) / len(sub_scores)))

        # 9. Recalculate grade
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

        # 10. Add video metadata
        video_info = result.get("video_analysis", {})
        video_info["total_frames_analyzed"] = len(frames)
        video_info["audio_transcript"] = transcript
        video_info["has_audio"] = len(transcript) > 0
        
        # Get duration
        cap = cv2.VideoCapture(temp_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps > 0:
            video_info["duration_seconds"] = round(frame_count / fps, 2)
        cap.release()

        result["video_analysis"] = video_info

        return result

    except (UnauthenticatedError, QuotaExceededError):
        raise
    except Exception as e:
        print(f"Video analysis execution error: {str(e)}")
        raise e
    finally:
        # 11. Clean up temp file
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except:
                pass
