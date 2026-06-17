import cv2
import os
import json
import base64
import tempfile
import asyncio
from moviepy.editor import VideoFileClip
import speech_recognition as sr
import hashlib
from analyzer import (_call_llm, normalize_score, UnauthenticatedError, QuotaExceededError,
                       EXPECTED_JSON_SCHEMA, SCORING_RUBRIC, _sanitize, _parse_llm_response, _analysis_cache, _get_cache_key)

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
    Extracts audio from video and transcribes it to text using chunk-based processing.
    """
    temp_audio_path = None
    try:
        # Create a temp file for audio
        fd, temp_audio_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

        # Extract audio using moviepy with specific parameters for SpeechRecognition
        video = VideoFileClip(video_path)
        if video.audio is None:
            return ""
        
        # 16000 Hz, 1 channel (mono), 16-bit PCM
        video.audio.write_audiofile(temp_audio_path, fps=16000, nbytes=2, codec='pcm_s16le', ffmpeg_params=["-ac", "1"], verbose=False, logger=None)
        video.close()

        # Transcribe using SpeechRecognition in chunks
        recognizer = sr.Recognizer()
        full_transcript = []
        
        with sr.AudioFile(temp_audio_path) as source:
            # Adjust for ambient noise once at the start of the file
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            chunk_duration = 30 # 30 seconds chunks
            while True:
                try:
                    audio_chunk = recognizer.record(source, duration=chunk_duration)
                    # If the chunk is essentially empty (reached end of file), break
                    if not audio_chunk.get_raw_data():
                        break
                    
                    text = recognizer.recognize_google(audio_chunk)
                    if text:
                        full_transcript.append(text)
                except sr.UnknownValueError:
                    # No speech detected in this chunk, continue to next
                    continue
                except sr.RequestError as e:
                    print(f"SpeechRecognition API error: {e}")
                    # Return whatever we've transcribed so far + graceful fallback message
                    if not full_transcript:
                        return "Speech recognition service unavailable."
                    break
                except EOFError:
                    break
                    
        result = " ".join(full_transcript).strip()
        return result if result else "No high-confidence speech detected."
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return "Transcription failed due to an error."
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass

def get_safe_video_analysis_template():
    return {
        "advantage_ai_analysis": {
            "product": "AdVantage AI",
            "analysis_version": "2.0",
            "type": "video"
        },
        "ai_detection": {
            "is_ai_generated": False,
            "confidence": 0,
            "indicators": [],
            "verdict": "Not analyzed",
            "recommendation": "None"
        },
        "video_analysis": {
            "duration_seconds": 0,
            "total_frames_analyzed": 0,
            "has_audio": False,
            "audio_transcript": "",
            "scene_count": 0,
            "pacing": "Normal",
            "hook_strength": "Medium",
            "first_3_seconds_verdict": "Informative",
            "visual_storytelling_score": 50,
            "audio_visual_alignment": "Good"
        },
        "visual_analysis": {
            "dominant_colors": [],
            "has_human_face": False,
            "face_emotion": "Neutral",
            "text_in_video": "",
            "brightness_score": 50,
            "contrast_score": 50,
            "layout_description": "",
            "visual_hierarchy_score": 50
        },
        "copy_analysis": {
            "sentiment": "Neutral",
            "sentiment_score": 50,
            "emotional_tone": "Neutral",
            "has_cta": False,
            "cta_text": "",
            "cta_strength": "Medium",
            "readability_score": 50,
            "power_words_found": [],
            "caption_length": 0,
            "caption_length_verdict": "Medium"
        },
        "hook_analysis": {
            "hook_text": "",
            "hook_score": 0,
            "hook_type": "Unknown",
            "hook_weakness": "None",
            "hook_rewrites": []
        },
        "psychology_triggers": {
            "fomo": False,
            "social_proof": False,
            "authority": False,
            "scarcity": False,
            "reciprocity": False,
            "aspirational": False,
            "pain_amplification": False,
            "curiosity_gap": False,
            "missing_triggers_suggestions": {}
        },
        "platform_rules": {
            "platform": "",
            "violations": [],
            "passed_checks": [],
            "compliance_score": 100
        },
        "audience": {
            "inferred_age_range": "18-65",
            "gender_skew": "Neutral",
            "likely_interests": [],
            "income_bracket": "Middle",
            "mismatch_warnings": []
        },
        "copy_variants": {
            "direct_response": "",
            "storytelling": "",
            "social_proof": "",
            "headline_variants": [],
            "cta_variants": [],
            "hashtags": []
        },
        "ab_variants": {
            "variant_a": {"angle": "FOMO", "headline": "", "body": "", "cta": "", "explanation": ""},
            "variant_b": {"angle": "Benefit", "headline": "", "body": "", "cta": "", "explanation": ""},
            "variant_c": {"angle": "Social Proof", "headline": "", "body": "", "cta": "", "explanation": ""}
        },
        "scoring": {
            "visual_quality_score": 0,
            "copy_strength_score": 0,
            "platform_fit_score": 0,
            "psychology_score": 0,
            "overall_score": 0,
            "grade": "F",
            "verdict": "Awaiting analysis."
        },
        "feedback_checklist": {
            "high_priority": [],
            "medium_priority": [],
            "low_priority": []
        }
    }

def analyze_video_ad(
    video_bytes: bytes,
    caption: str,
    platform: str,
    objective: str,
    brand_profile: dict = None
) -> dict:
    """
    Full pipeline for analyzing a video ad.
    RULES:
    - NEVER return a bare dict without 'scoring' key
    - Always return the full template structure
    - Set success=False and a message on errors
    """
    
    # 0. Safety Check — return FULL template with error info
    if not video_bytes or len(video_bytes) < 100:
        error_result = get_safe_video_analysis_template()
        error_result["success"] = False
        error_result["scoring"]["verdict"] = "Invalid video data received. File may be corrupt or empty."
        return error_result

    temp_video_path = None
    result = get_safe_video_analysis_template()
    
    try:
        # 1. Save video_bytes to a temp file
        fd, temp_video_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        with open(temp_video_path, 'wb') as f:
            f.write(video_bytes)

        # 2. Extract frames
        frames = extract_frames(temp_video_path, 6)
        
        # 3. Extract audio transcript
        transcript = ""
        try:
            transcript = extract_audio_transcript(temp_video_path)
        except Exception as e:
            print(f"Skipping transcript due to error: {e}")

        # 4. Build brand_context
        brand_context = ""
        if brand_profile:
            brand_context = f"""
BRAND CONTEXT:
- Brand Name: {brand_profile.get('brand_name')}
- Industry: {brand_profile.get('industry')}
- Target Audience: {brand_profile.get('target_audience')}
"""

        # 5. Cache check — same first frame = same result
        cache_key = _get_cache_key(frames[0] if frames else b"", caption, platform, objective)
        if cache_key in _analysis_cache:
            print(f"[VideoAnalyzer] Cache HIT — returning cached result")
            cached = _analysis_cache[cache_key].copy()
            # Still add real video metadata even from cache
            video_info = cached.get("video_analysis", result.get("video_analysis", {}))
            video_info["total_frames_analyzed"] = len(frames)
            video_info["audio_transcript"] = transcript
            video_info["has_audio"] = len(transcript) > 0
            cached["video_analysis"] = video_info
            return cached

        # 6. Build prompt with FULL schema + rubric
        prompt = f"""You are AdVantage AI. Analyze this video ad creative with professional precision.

{brand_context}
Caption: {caption}
Platform: {platform}
Campaign Objective: {objective}
Audio Transcript: {transcript if transcript else "No speech detected in video."}
Number of frames analyzed: {len(frames)}

VISUAL CONTEXT:
The images sent to you are {len(frames)} sequential frames extracted at equal intervals from start to finish of the video.
- Frame 1 represents the start (0% mark) - crucial for evaluating the first 3-second hook.
- Frames 2-5 represent the middle progression (20%, 40%, 60%, 80% marks) - crucial for story arc, pacing, and visual changes.
- Frame 6 represents the end (100% mark) - crucial for call-to-action (CTA) visibility and landing.

Return a JSON object with EXACTLY this structure (replace example values with YOUR analysis):

{EXPECTED_JSON_SCHEMA}

{SCORING_RUBRIC}

VIDEO-SPECIFIC EVALUATION CRITERIA:
- Hook in first 3 seconds: Does it grab attention immediately? (Look at Frame 1 specifically).
- Pacing & Scene Changes: Inspect all sequential frames to evaluate if there is visual variety, dynamic transitions, or if it is too static/slow.
- Audio-Visual sync: Do audio transcript elements align with what is shown in the corresponding frames?
- Story arc: Does the video build a clear beginning, middle, and end visually?
- CTA timing: Is the call-to-action placed and visible at the end (Frame 6)?

CRITICAL INSTRUCTIONS:
1. Return ONLY the JSON. No markdown, no explanation.
2. Apply the scoring rubric EXACTLY.
3. Set platform_rules.platform to "{platform}".
4. Every text field must have real content.
5. Every array must have at least 2 items.
"""
        
        # Call LLM with the sequential frames as visual reference
        image_to_send = frames if frames else None
        
        try:
            content = _call_llm(prompt, image_to_send)
            llm_data = _parse_llm_response(content)
            print(f"[VideoAnalyzer] LLM returned {len(llm_data)} keys: {list(llm_data.keys())}")
            result = _sanitize(result, llm_data)
        except (UnauthenticatedError, QuotaExceededError):
            raise
        except Exception as e:
            print(f"[VideoAnalyzer] LLM failed: {e}")
            result["scoring"]["verdict"] = f"AI analysis failed: {str(e)}. Using safe defaults."

        # 7. Normalize all scores + grade
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
        print(f"[VideoAnalyzer] Final score: {scoring['overall_score']}% ({scoring['grade']})")

        # 8. Add video technical metadata
        video_info = result.get("video_analysis", {})
        video_info["total_frames_analyzed"] = len(frames)
        video_info["audio_transcript"] = transcript
        video_info["has_audio"] = len(transcript) > 0
        
        try:
            cap = cv2.VideoCapture(temp_video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if fps > 0:
                video_info["duration_seconds"] = round(frame_count / fps, 2)
            cap.release()
        except:
            pass

        result["video_analysis"] = video_info

        # Cache the result
        _analysis_cache[cache_key] = result.copy()
        return result

    except (UnauthenticatedError, QuotaExceededError):
        raise
    except Exception as e:
        print(f"Video analysis execution error: {str(e)}")
        # Return something to avoid 500
        result["scoring"]["verdict"] = f"Video pipeline error: {str(e)}"
        return result
    finally:
        # 11. Clean up temp file
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except:
                pass
