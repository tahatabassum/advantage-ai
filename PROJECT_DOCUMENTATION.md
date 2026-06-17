# AdVantage AI — Complete Project Documentation

## 1. PROJECT OVERVIEW
**AdVantage AI** is a professional-grade Digital Marketing Analytics SaaS platform designed for media agencies, brand owners, and performance marketers. 

*   **What it is**: An AI-powered auditing engine that evaluates advertising creatives (images and videos) with the precision of a senior marketing director.
*   **Problem solved**: Eliminates guesswork in creative testing. Instead of spending thousands of dollars on A/B testing "gut feelings," users get a deterministic, data-backed audit of their ads before they go live.
*   **Target User**: Fortune 500 media agencies, E-commerce brand owners, and Growth Marketers looking for a competitive edge.
*   **Current Status**: 
    *   **Fully Functional**: Image analysis, Video analysis (frame-by-frame), Meta Ads Library URL scraping (bypassing bot detection), Brand Profile management, Analysis History, PDF Export, and Multi-tier subscription logic.
    *   **In Progress**: Advanced bulk analysis (batch processing up to 20 images for Agency tier) and Stripe payment webhook integration for automated tier upgrades.

---

## 2. COMPLETE TECH STACK

| Name | Version | Specifically Used For | File(s) |
| :--- | :--- | :--- | :--- |
| **FastAPI** | 0.111.0 | Core backend framework for API endpoints. | `backend/main.py` |
| **Uvicorn** | 0.29.0 | ASGI server implementation. | `backend/main.py`, `package.json` |
| **React** | 19.0.0 | Frontend UI library. | `frontend/src/` |
| **TypeScript** | ~5.8.2 | Type safety for frontend development. | `frontend/src/` |
| **TailwindCSS** | 3.4.19 | Modern utility-first CSS styling. | `tailwind.config.js`, `frontend/src/index.css` |
| **Vite** | 5.4.10 / 6.2.0 | Frontend build tool and dev server. | `vite.config.ts`, `frontend/vite.config.ts` |
| **SQLAlchemy** | 2.0.36 | Object-Relational Mapper (ORM) for SQLite. | `backend/database.py`, `backend/models.py` |
| **OpenRouter** | N/A | Unified API for LLM calls (Gemini, GPT-4). | `backend/analyzer.py` |
| **Gemini 2.0 Flash** | N/A | Primary AI model for Vision and Copy analysis. | `backend/analyzer.py` |
| **Undetected Chromedriver** | N/A | Selenium-based scraper to bypass Meta's bot detection. | `backend/url_analyzer.py` |
| **OpenCV** | 4.9.0 | Video frame extraction and image processing. | `backend/video_analyzer.py` |
| **MoviePy** | 1.0.3 | Audio extraction from video files. | `backend/video_analyzer.py` |
| **SpeechRecognition** | 3.10.4 | Transcribing ad audio into text for LLM context. | `backend/video_analyzer.py` |
| **ReportLab** | 4.1.0 | Generating high-quality PDF audit reports. | `backend/pdf_generator.py` |
| **SlowAPI** | 0.1.9 | Rate limiting for API protection. | `backend/main.py` |
| **Stripe** | N/A | Payment processing for Pro/Agency tiers. | `backend/stripe_service.py` |

---

## 3. PROJECT STRUCTURE

```text
AdVantage AI
├── backend/
│   ├── main.py              # API Entry point & Route Definitions
│   ├── analyzer.py          # Core AI Logic & Scoring Rubric
│   ├── url_analyzer.py      # Meta Ads & Web Scraping Engine
│   ├── video_analyzer.py    # Video Processing & Frame Extraction
│   ├── models.py            # Database Schema (User, History, Brand)
│   ├── schemas.py           # Pydantic Types for API Validation
│   ├── database.py          # SQLAlchemy Engine & Session Config
│   ├── pdf_generator.py     # PDF Export Logic
│   ├── stripe_service.py    # Payment & Webhook Integration
│   └── auth_utils.py        # JWT & Password Hashing
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI Elements (Upload, Score, etc.)
│   │   ├── services/        # API Client (Axios)
│   │   ├── types/           # TypeScript Interfaces
│   │   ├── App.tsx          # Main View Controller & Global State
│   │   └── VideoAnalyzePage.tsx # Specialized Video Audit UI
│   └── index.html           # SPA Entry Point
├── package.json             # Root Build Scripts & Dev Config
└── requirements.txt         # Backend Python Dependencies
```

### Key File Connections:
*   `main.py` connects to all backend services (`analyzer`, `url_analyzer`, `models`, `database`).
*   `analyzer.py` is the "Brain," called by `url_analyzer` and `video_analyzer` for final scoring.
*   `frontend/src/App.tsx` communicates with `backend/main.py` via `frontend/src/services/api.ts`.
*   `models.py` uses `database.py` for the SQLAlchemy base.

---

## 4. BACKEND DEEP DIVE

### analyzer.py
*   **Function: `analyze_ad`**
    *   **Description**: Takes image bytes and meta-data, calls LLM for a deterministic audit.
    *   **Params**: `image_bytes` (bytes), `caption` (str), `platform` (str), `objective` (str), `brand_profile` (dict).
    *   **Returns**: `FullAnalysisResponse` JSON object.
    *   **External Calls**: OpenRouter API.
*   **Function: `_call_llm`**
    *   **Description**: Manages retry logic and model fallbacks for LLM calls.
    *   **Returns**: Raw JSON string from AI.

### url_analyzer.py
*   **Function: `analyze_url_ad`**
    *   **Description**: Orchestrates URL scraping -> Screenshot -> AI Audit.
    *   **Params**: `url`, `analysis_type`, `platform`, `objective`, `brand_data`.
    *   **External Calls**: Undetected Chromedriver (Selenium), BeautifulSoup.
*   **Function: `fix_meta_url`**
    *   **Description**: Appends `country=ALL` to Meta Ads links to bypass region-based ad blocking.

### video_analyzer.py
*   **Function: `analyze_video_ad`**
    *   **Description**: Processes video files by extracting 6 key frames and transcribing audio.
    *   **External Calls**: OpenCV (cv2), MoviePy, Google Speech Recognition.

---

## 5. FRONTEND DEEP DIVE

### App.tsx
*   **Renders**: Main layout, navigation, Hero section, and conditional views (Home, Dashboard, Brand, Pricing).
*   **State Managed**: `isAuthenticated`, `user`, `view`, `analysis`, `comparisonAds`, `loading`.
*   **Endpoints Called**: `/auth/me`, `/analyze`, `/analyze-bulk`, `/analyze-url`, `/health`.

### UploadPanel.tsx
*   **Renders**: Drag-and-drop zone for images, platform/objective selectors.
*   **Props Received**: `onAnalyze`, `onAnalyzeByUrl`, `isLoading`.
*   **Logic**: Handles multi-file uploads (max 5) and toggles between "Upload" and "Paste URL" modes.

### ScoreDashboard.tsx
*   **Renders**: High-impact visual scores (Overall, Visual, Copy, Psychology) using progress bars and animations.
*   **State Managed**: Local display of numerical data parsed from AI response.

---

## 6. API ENDPOINTS

| Method | Route | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/advantage/auth/signup` | User registration. | `email`, `password` | `access_token`, `user` |
| **POST** | `/api/v1/advantage/auth/login` | User authentication. | `email`, `password` | `access_token`, `user` |
| **POST** | `/api/v1/advantage/analyze` | Image ad audit. | `Multipart/Form-Data` | `FullAnalysisResponse` |
| **POST** | `/api/v1/advantage/analyze-url` | URL-based ad audit. | `url`, `platform`, `objective` | `FullAnalysisResponse` |
| **POST** | `/api/v1/advantage/analyze-video` | Video file audit. | `video` (file), `caption` | `FullAnalysisResponse` |
| **GET** | `/api/v1/advantage/history` | Fetch user audit history. | None | `List[AnalysisHistory]` |
| **POST** | `/api/v1/advantage/brand-profile` | Update brand context. | `brand_name`, `voice`, etc. | `BrandProfile` |

---

## 7. COMPLETE DATA FLOW

### Feature 1: Image Ad Analysis
1.  **User**: Uploads `.png` and selects "Meta" + "Conversion".
2.  **Frontend**: Calls `POST /analyze` with `FormData`.
3.  **Backend**: `main.py` checks usage limits -> `analyzer.py` generates SHA256 cache key.
4.  **AI**: Gemini 2.0 Flash analyzes pixels + text against the scoring rubric.
5.  **Final**: Backend saves results to SQLite; Frontend displays `ScoreDashboard`.

### Feature 2: URL Ad Analysis (Meta Ads Library)
1.  **User**: Pastes Meta Ads Library link.
2.  **Frontend**: Calls `POST /analyze-url`.
3.  **Backend**: `url_analyzer.py` launches Undetected Chromedriver -> Fixes URL with `country=ALL` -> Takes 1280px screenshot -> Extracts ad copy.
4.  **AI**: LLM receives Screenshot + Extracted Copy.
5.  **Final**: Result returned with a preview of the scraped ad.

---

## 8. AI/LLM INTEGRATION

*   **Model**: `google/gemini-2.0-flash-001` (Primary), `openai/gpt-4o-mini` (Fallback).
*   **System Prompt**: "You are AdVantage AI, an elite advertising performance analyst... Your scoring MUST be deterministic... follow the rubric EXACTLY."
*   **JSON Enforcement**: Prompt includes a strict `EXPECTED_JSON_SCHEMA` to ensure the backend can parse scores, psychology triggers, and A/B variants without failure.
*   **Temperature**: **0** (Zero) to ensure identical ads get identical scores.

---

## 9. ANALYSIS SCORING SYSTEM

| Dimension | Range | Criteria Example |
| :--- | :--- | :--- |
| **Visual Quality** | 0-100 | 90+ = Studio quality; <40 = Cluttered/Amateur. |
| **Copy Strength** | 0-100 | Evaluates CTA presence, Power Words, and Hook. |
| **Platform Fit** | 0-100 | Ratio checks (1:1 for Meta, 9:16 for TikTok). |
| **Psychology** | 0-100 | Detects 8 triggers: FOMO, Social Proof, Authority, etc. |

**Grade Calculation**:
*   **A (90+)**: Ready to scale.
*   **B (75-89)**: Minor optimizations needed.
*   **F (<45)**: Complete overhaul required.

---

## 10. KNOWN BUGS AND ISSUES

1.  **Bug: Missing Dependencies**: `undetected-chromedriver` and `selenium` are imported in `url_analyzer.py` but missing from `requirements.txt`.
    *   *Cause*: Incomplete dependency update during Selenium migration.
    *   *Fix*: Add `undetected-chromedriver` and `selenium` to `requirements.txt`.
2.  **Issue: Video Transcription Timeout**: Large videos (>30MB) may cause the `SpeechRecognition` call to hang or timeout.
    *   *Fix*: Implement chunk-based audio processing.
3.  **Security**: `ADMIN_SECRET` is used in a GET query param in some places (debug endpoints).
    *   *Fix*: Move to POST body or Header.

---

## 11. ENVIRONMENT VARIABLES

| Variable Name | Purpose | Required? |
| :--- | :--- | :--- |
| `OPENROUTER_API_KEY` | Access to Gemini/GPT models. | **Yes** |
| `DATABASE_URL` | SQLite path (defaults to local file). | Optional |
| `JWT_SECRET_KEY` | Signing JWT tokens for auth. | **Yes** |
| `SMTP_HOST` / `PORT` | Email verification & Password reset. | Optional |
| `STRIPE_SECRET_KEY` | Subscription payment processing. | Optional |

---

## 12. DEPLOYMENT

### Local Execution
1.  **Install Python Deps**: `pip install -r requirements.txt`
2.  **Install Node Deps**: `npm install`
3.  **Run Development**: `npm run dev` (Runs FastAPI on 8000 and Vite on 5173 concurrently).

### Production (Google Cloud Run / Docker)
*   **Strategy**: Containerize the app using a Python base image.
*   **Build**: `npm run build` transfers frontend assets into `backend/dist`.
*   **Server**: `uvicorn backend.main:app` serves both the API and the static `dist/index.html`.
*   **Note**: Production environment requires `CHROME_PATH` to be set for Selenium scraping.

# AdVantage AI — Complete Project Documentation
*Generated on: 2026-05-06*
