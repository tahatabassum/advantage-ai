import os
import re
import sys
import asyncio
import base64
import aiohttp
import traceback
import time

# Fix Windows console encoding issues
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

# Selenium + undetected-chromedriver (replaces Playwright which is blocked in Pakistan)
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
import requests
from bs4 import BeautifulSoup

# screenshot to show

def crop_modal_from_screenshot(screenshot_bytes: bytes) -> bytes:
    """
    Crops the Meta Ad modal popup from the full page screenshot.
    ALWAYS returns bytes - never returns None.
    """
    if not screenshot_bytes:
        return screenshot_bytes
    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(screenshot_bytes))
        width, height = img.size
        print(f"[URLAnalyzer] Screenshot dimensions: {width}x{height}")

        # Modal is centered - crop to middle portion
        left = int(width * 0.30)
        top = int(height * 0.12)
        right = int(width * 0.75)
        bottom = int(height * 0.90)

        cropped = img.crop((left, top, right, bottom))
        output = io.BytesIO()
        cropped.save(output, format='PNG')
        result = output.getvalue()

        if not result:
            print("[URLAnalyzer] Crop produced empty bytes, returning original")
            return screenshot_bytes

        print(f"[URLAnalyzer] Cropped screenshot: {len(result)} bytes")
        return result

    except Exception as e:
        print(f"[URLAnalyzer] Crop failed: {e}, returning original screenshot")
        return screenshot_bytes  # ALWAYS return something


# ---------------- PLATFORM DETECTION ----------------
def detect_platform(url: str) -> str:
    url = url.lower()
    if 'facebook.com' in url or 'fb.com' in url:
        return 'Meta'
    if 'instagram.com' in url:
        return 'Instagram'
    if 'tiktok.com' in url:
        return 'TikTok'
    if 'youtube.com' in url or 'youtu.be' in url:
        return 'Google'
    if 'linkedin.com' in url:
        return 'LinkedIn'
    return 'Web'


# ---------------- META ADS DETECTION ----------------
def is_meta_ads_library(url: str) -> bool:
    url = url.lower()
    return "facebook.com/ads/library" in url or "fb.com/ads/library" in url


# ---------------- FIX META URL ----------------
def fix_meta_url(url: str) -> str:
    """
    Adds &country=ALL to Meta Ads Library URLs to bypass
    the Pakistan country filter that hides ads.
    Also ensures the URL format is correct.
    """
    if not is_meta_ads_library(url):
        return url

    # If country param already exists, replace it with ALL
    if 'country=' in url.lower():
        url = re.sub(r'country=[^&]*', 'country=ALL', url, flags=re.IGNORECASE)
    else:
        # Add country=ALL
        if '?' in url:
            url = url + '&country=ALL'
        else:
            url = url + '?country=ALL'

    return url


# ---------------- SELENIUM DRIVER ----------------
def get_chrome_major_version():
    """Detect the installed Chrome major version on Windows."""
    try:
        import winreg
        # Try both HKCU and HKLM
        keys = [
            (winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Google\Update\Clients\{8A69D345-D564-463c-AFF1-A69D9E530F96}"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Google\Update\Clients\{8A69D345-D564-463c-AFF1-A69D9E530F96}")
        ]
        for hkey, path in keys:
            try:
                key = winreg.OpenKey(hkey, path)
                version, _ = winreg.QueryValueEx(key, "version")
                return int(version.split(".")[0])
            except:
                continue
        return None # Default fallback
    except:
        return None

def get_selenium_driver():
    # Clean up stale chromedriver lock file that causes WinError 183
    import shutil
    uc_dir = os.path.join(os.path.expanduser("~"), "appdata", "roaming", 
                          "undetected_chromedriver", "undetected")
    stale = os.path.join(uc_dir, "undetected_chromedriver.exe")
    if os.path.exists(stale):
        try:
            os.remove(stale)
            print("[URLAnalyzer] Removed stale chromedriver lock file")
        except Exception as e:
            print(f"[URLAnalyzer] Could not remove stale file: {e}")

    options = uc.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    major_version = get_chrome_major_version()
    print(f"[URLAnalyzer] Detected Chrome major version: {major_version}")

    try:
        if major_version:
            driver = uc.Chrome(options=options, version_main=major_version, headless=True)
        else:
            driver = uc.Chrome(options=options, headless=True)
    except Exception as e:
        print(f"[URLAnalyzer] Failed to start uc.Chrome: {e}")
        try:
            driver = uc.Chrome(options=options, headless=True)
        except Exception as e2:
            print(f"[URLAnalyzer] Failed fallback 1: {e2}")
            driver = uc.Chrome(options=options)

    driver.set_page_load_timeout(60)
    return driver


# ---------------- SCREENSHOT + TEXT EXTRACTION (Selenium) ----------------
def screenshot_and_extract(url: str) -> dict:
    """
    Takes a screenshot AND extracts text content using Selenium + undetected-chromedriver.
    For Meta Ads Library: fixes URL with country=ALL, closes popup, captures ad content.
    """
    result = {"screenshot_b64": None, "extracted_text": "", "ad_data": {}}
    driver = None

    try:
        # Fix Meta URL to bypass country filter
        fixed_url = fix_meta_url(url)
        if fixed_url != url:
            print(f"[URLAnalyzer] Fixed Meta URL: {fixed_url}")

        driver = get_selenium_driver()
        driver.get(fixed_url)

        is_meta = is_meta_ads_library(url)
        wait_time = 20 if is_meta else 5
        print(f"[URLAnalyzer] Waiting {wait_time}s for page render...")
        time.sleep(wait_time)

        # --- DISMISS MODALS & SCROLL ---
        is_video_ad = False
        try:
            if is_meta:
                driver.execute_script("""
                    // DO NOT close the modal — it contains the actual ad
                    // Instead, find the modal and scroll it into center view
                    var modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
                    if (modal) {
                        modal.scrollIntoView({behavior: "smooth", block: "center"});
                    } else {
                        // fallback: find Library ID container and scroll to it
                        var all = document.querySelectorAll('div, span, p');
                        for (var el of all) {
                            if (el.innerText && el.innerText.includes('Library ID:')) {
                                el.scrollIntoView({behavior: "smooth", block: "center"});
                                break;
                            }
                        }
                    }

                    // Remove background overlays that dim the modal
                    document.querySelectorAll('[data-pagelet], [role="banner"]').forEach(function(el) {
                        el.style.filter = 'none';
                        el.style.opacity = '1';
                    });
                """)
                time.sleep(3)

                # Detect if video exists inside the modal and extract its source URL
                video_url = driver.execute_script("""
                    var modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
                    var video = modal ? modal.querySelector('video') : document.querySelector('video');
                    if (video) {
                        return video.src || (video.querySelector('source') ? video.querySelector('source').src : '');
                    }
                    return '';
                """)
                is_video_ad = bool(video_url)
                result["ad_data"]["is_video"] = is_video_ad
                result["ad_data"]["video_url"] = video_url
                print(f"[URLAnalyzer] Video ad detected: {is_video_ad}, video URL: {video_url}")

                # If a video URL was found, try to fetch the video data inside the browser context
                video_bytes_b64 = None
                if video_url:
                    try:
                        print(f"[URLAnalyzer] Attempting browser-side download of video blob/CDN url...")
                        driver.set_script_timeout(30)
                        video_bytes_b64 = driver.execute_async_script("""
                            var callback = arguments[arguments.length - 1];
                            var url = arguments[0];
                            fetch(url)
                                .then(response => response.blob())
                                .then(blob => {
                                    var reader = new FileReader();
                                    reader.onloadend = function() {
                                        callback(reader.result.split(',')[1]); // Base64 portion
                                    };
                                    reader.onerror = function() {
                                        callback(null);
                                    };
                                    reader.readAsDataURL(blob);
                                })
                                .catch(err => {
                                    console.error("Fetch failed in browser:", err);
                                    callback(null);
                                });
                        """, video_url)
                        if video_bytes_b64:
                            print(f"[URLAnalyzer] Browser-side video download successful: {len(video_bytes_b64)} b64 chars")
                        else:
                            print(f"[URLAnalyzer] Browser-side video download returned empty data")
                    except Exception as download_err:
                        print(f"[URLAnalyzer] Browser-side download failed: {download_err}")
                
                result["ad_data"]["video_bytes_b64"] = video_bytes_b64
        except Exception as e:
            print(f"[URLAnalyzer] Modal/scroll handling failed: {e}")

        # --- EXTRACT TEXT ---
        try:
            # For Meta, use a robust string-based search for the ad content
            if is_meta:
                extracted_text = driver.execute_script("""
                    function getAdText() {
                        // PRIORITY 1: Get text from the modal popup (contains the actual ad)
                        var modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
                        if (modal && modal.innerText && modal.innerText.includes('Library ID')) {
                            return modal.innerText;
                        }

                        // PRIORITY 2: Find the deepest element containing Library ID
                        var best = null;
                        var bestLen = 0;
                        var all = document.querySelectorAll('div');
                        for (var el of all) {
                            try {
                                if (el.innerText && 
                                    el.innerText.includes('Library ID') && 
                                    el.innerText.length > bestLen &&
                                    el.innerText.length < 5000) {
                                    best = el;
                                    bestLen = el.innerText.length;
                                }
                            } catch(e) {}
                        }
                        if (best) return best.innerText;

                        // PRIORITY 3: Full body fallback
                        return document.body.innerText;
                    }
                    return getAdText();
                """)
            else:
                # For other sites, just get body text
                extracted_text = driver.execute_script("return document.body ? document.body.innerText : '';")

            if extracted_text and len(extracted_text.strip()) > 10:
                result["extracted_text"] = extracted_text.strip()[:3000]
                print(f"[URLAnalyzer] Extracted {len(extracted_text)} chars")
                preview_text = extracted_text[:300].replace('\n', ' ')
                print(f"[URLAnalyzer] Text preview: {preview_text}")
            else:
                print("[URLAnalyzer] Page has minimal text content")
        except Exception as e:
            print(f"[URLAnalyzer] Text extraction failed (non-fatal): {e}")

        # Scroll slightly to ensure lazy content is triggered if not Meta
        if not is_meta:
            try:
                driver.execute_script("window.scrollBy(0, 300);")
                time.sleep(1)
            except:
                pass


        # Check for bot detection
        page_title = driver.title.lower()
        if any(x in page_title for x in ["just a moment", "access denied", "captcha", "verify"]):
            print(f"[URLAnalyzer] WARNING: Bot detection page detected: {driver.title}")

        # Take screenshot
        img = driver.get_screenshot_as_png()
        print(f"[URLAnalyzer] Screenshot captured ({len(img)} bytes)")

        if len(img) < 50000:
            print("[URLAnalyzer] WARNING: Screenshot suspiciously small — likely blank or bot-detection page")

        # For Meta ads, crop to just the modal area for cleaner preview
        if is_meta:
            cropped = crop_modal_from_screenshot(img)
            img = cropped if cropped else img
        result["screenshot_b64"] = base64.b64encode(img).decode("utf-8")
        return result

    except Exception as e:
        print(f"[URLAnalyzer] screenshot_and_extract error: {e}")
        traceback.print_exc()
        raise Exception(f"Screenshot failed: {str(e)}")
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass


# ---------------- VIDEO DOWNLOAD ----------------
async def download_video(url: str) -> bytes:
    """
    Works ONLY for direct video URLs.
    Meta/Instagram blob videos will NOT work reliably.
    """
    if not url.startswith("http"):
        return None

    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    content_type = resp.headers.get("Content-Type", "")
                    if "video" in content_type or url.lower().endswith(('.mp4', '.mov', '.webm', '.avi')):
                        return await resp.read()
    except Exception as e:
        print(f"Video download failed: {e}")
        return None

    return None


def _get_safe_url_error(message: str, url: str = "") -> dict:
    """
    Return a FULL analysis template with safe defaults + error info.
    This ensures callers can always access result['scoring'] etc.
    """
    from analyzer import get_safe_analysis_template
    result = get_safe_analysis_template()
    result["scoring"]["verdict"] = message
    result["source_url"] = url
    result["success"] = False
    result["warning"] = message
    return result


# ---------------- MAIN PIPELINE ----------------
async def analyze_url_ad(url, analysis_type, platform, objective, brand_data=None):
    """
    Main URL analysis pipeline.
    Uses Selenium + undetected-chromedriver.
    Fixes Meta URLs with country=ALL to bypass Pakistan filter.
    Extracts text from Meta popup modal for rich LLM context.
    """

    from analyzer import analyze_ad
    from video_analyzer import analyze_video_ad

    is_video = analysis_type == "video_url"
    platform_detected = detect_platform(url)
    is_meta = is_meta_ads_library(url)

    try:
        # 1. SCREENSHOT + TEXT EXTRACTION (Selenium, run in thread)
        screenshot_b64 = None
        image_bytes = None
        extracted_text = ""
        is_page_video = False
        video_url = ""
        video_bytes_b64 = None

        try:
            extract_result = await asyncio.to_thread(screenshot_and_extract, url)
            if extract_result is None:
                extract_result = {}
            screenshot_b64 = extract_result.get("screenshot_b64")
            extracted_text = extract_result.get("extracted_text", "")
            is_page_video = extract_result.get("ad_data", {}).get("is_video", False)
            video_url = extract_result.get("ad_data", {}).get("video_url", "")
            video_bytes_b64 = extract_result.get("ad_data", {}).get("video_bytes_b64")
            if screenshot_b64:
                image_bytes = base64.b64decode(screenshot_b64)
            if extracted_text:
                print(f"[URLAnalyzer] Final extracted text preview: {extracted_text[:200]}...")
            else:
                print(f"[URLAnalyzer] No text extracted from page")
        except Exception as e:
            print(f"[URLAnalyzer] Screenshot failed for {url}: {e}")

        # og:image fallback if screenshot failed completely
        if not image_bytes:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}
                resp = requests.get(url, headers=headers, timeout=10)
                soup = BeautifulSoup(resp.text, "html.parser")
                og_image_tag = soup.find("meta", property="og:image")
                og_title_tag = soup.find("meta", property="og:title")
                og_desc_tag = soup.find("meta", property="og:description")
                if og_image_tag and og_image_tag.get("content"):
                    img_url = og_image_tag["content"]
                    img_resp = requests.get(img_url, headers=headers, timeout=10)
                    image_bytes = img_resp.content
                    og_title = og_title_tag["content"] if og_title_tag else ""
                    og_desc = og_desc_tag["content"] if og_desc_tag else ""
                    extracted_text = f"{og_title} {og_desc}".strip() or extracted_text
                    print(f"[URLAnalyzer] og:image fallback worked: {img_url}")
            except Exception as og_err:
                print(f"[URLAnalyzer] og:image fallback also failed: {og_err}")

            if not image_bytes and not is_video:
                return _get_safe_url_error(
                    "Could not capture screenshot. URL may be blocked or inaccessible. "
                    "Please upload the ad image directly.", url
                )

        # Build rich caption from extracted text for the LLM
        caption_context = ""
        if is_meta and extracted_text:
            caption_context = (
                f"This ad was found on Meta Ads Library.\n"
                f"Below is the text content extracted from the ad:\n\n"
                f"{extracted_text}\n\n"
                f"IMPORTANT: Analyze the ACTUAL AD CONTENT shown above — the headlines, CTA, "
                f"body text, and visual creative. Provide specific feedback about THIS ad. "
                f"Reference the actual product name, CTA text, and copy in your analysis. "
                f"Do NOT give low scores just because this is a screenshot of a webpage."
            )
        elif extracted_text:
            caption_context = f"Page content extracted from URL:\n{extracted_text}"

        # Combine explicit video intent with page detection
        is_actually_video = is_video or is_page_video

        # 2. META ADS LIBRARY
        if is_meta:
            if is_actually_video:
                # Prioritize browser-downloaded video data
                video_bytes = None
                if video_bytes_b64:
                    try:
                        video_bytes = base64.b64decode(video_bytes_b64)
                        print(f"[URLAnalyzer] Decoded browser-side video ({len(video_bytes)} bytes) for Meta")
                    except Exception as b64_err:
                        print(f"[URLAnalyzer] Failed to decode browser-side video: {b64_err}")
                
                # Fallback to python download
                if not video_bytes:
                    target_video_url = video_url if video_url else url
                    video_bytes = await download_video(target_video_url)

                if video_bytes and len(video_bytes) > 100:
                    try:
                        analysis = await asyncio.to_thread(
                            analyze_video_ad, video_bytes, caption_context,
                            platform_detected, objective, brand_data
                        )
                        analysis["source_url"] = url
                        analysis["success"] = True
                        analysis["ad_media_type"] = "video"
                        if screenshot_b64:
                            analysis["screenshot_b64"] = screenshot_b64
                        return analysis
                    except Exception as e:
                        print(f"Meta video analysis failed, falling back to screenshot: {e}")

                # If download failed or it's a Meta video ad, use image analysis on screenshot
                if image_bytes:
                    analysis = analyze_ad(
                        image_bytes,
                        caption_context or "Meta Ads Library video ad",
                        platform_detected, objective, brand_data
                    )
                    analysis["warning"] = (
                        "Meta Ads Library video detected. Video download blocked. "
                        "Analysis performed using screenshot + extracted ad text."
                    )
                    analysis["source_url"] = url
                    analysis["success"] = True
                    analysis["ad_media_type"] = "video" # Still mark as video so frontend knows
                    if screenshot_b64:
                        analysis["screenshot_b64"] = screenshot_b64
                    return analysis

            # If not a video ad
            if image_bytes:
                analysis = analyze_ad(
                    image_bytes,
                    caption_context or "Meta Ads Library creative",
                    platform_detected, objective, brand_data
                )
                analysis["warning"] = (
                    "Meta Ads Library detected. Analysis performed using screenshot + extracted ad text."
                )
                analysis["source_url"] = url
                analysis["success"] = True
                analysis["ad_media_type"] = "image"
                if screenshot_b64:
                    analysis["screenshot_b64"] = screenshot_b64
                return analysis
            else:
                return _get_safe_url_error("Meta Ads Library page could not be captured.", url)

        # 3. VIDEO MODE (non-Meta)
        if is_actually_video:
            # Prioritize browser-downloaded video data
            video_bytes = None
            if video_bytes_b64:
                try:
                    video_bytes = base64.b64decode(video_bytes_b64)
                    print(f"[URLAnalyzer] Decoded browser-side video ({len(video_bytes)} bytes) for Non-Meta")
                except Exception as b64_err:
                    print(f"[URLAnalyzer] Failed to decode browser-side video: {b64_err}")

            # Fallback to python download
            if not video_bytes:
                target_video_url = video_url if video_url else url
                video_bytes = await download_video(target_video_url)

            if video_bytes and len(video_bytes) > 100:
                try:
                    analysis = await asyncio.to_thread(
                        analyze_video_ad, video_bytes, caption_context,
                        platform_detected, objective, brand_data
                    )
                    analysis["source_url"] = url
                    analysis["success"] = True
                    analysis["ad_media_type"] = "video"
                    if screenshot_b64:
                        analysis["screenshot_b64"] = screenshot_b64
                    return analysis
                except Exception as e:
                    print(f"Video analysis failed, falling back to screenshot: {e}")

            if image_bytes:
                analysis = analyze_ad(
                    image_bytes, caption_context or "Video URL — screenshot fallback",
                    platform_detected, objective, brand_data
                )
                analysis["warning"] = "Video could not be downloaded. Used screenshot fallback."
                analysis["source_url"] = url
                analysis["success"] = True
                analysis["ad_media_type"] = "video"
                if screenshot_b64:
                    analysis["screenshot_b64"] = screenshot_b64
                return analysis
            else:
                return _get_safe_url_error(
                    "Video could not be downloaded and screenshot also failed.", url
                )

        # 4. IMAGE / NORMAL URL ANALYSIS
        if image_bytes:
            analysis = analyze_ad(
                image_bytes, caption_context,
                platform_detected, objective, brand_data
            )
            analysis["source_url"] = url
            analysis["success"] = True
            analysis["ad_media_type"] = "image"
            if screenshot_b64:
                analysis["screenshot_b64"] = screenshot_b64
            return analysis
        else:
            return _get_safe_url_error(
                "Could not capture the page. Please verify the URL.", url
            )

    except Exception as e:
        print(f"URL analysis pipeline error: {e}")
        print(traceback.format_exc())
        return _get_safe_url_error(f"URL analysis failed: {str(e)}", url)