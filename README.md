<div align="center">
  <h1>🎯 AdVantage AI</h1>
  <p><strong>Next-Gen Digital Marketing Creative Auditor & Neural Copywriter</strong></p>
  <p><i>Auditing visual creatives and copywriting with the analytical depth of an elite media director.</i></p>
</div>

---

## 🚀 Overview

**AdVantage AI** is a professional-grade SaaS tool built for performance marketers and growth agencies. It replaces arbitrary A/B testing with a deterministic, neural evaluation engine that audits ad creatives (images and videos) and provides real-time scoring, compliance checks, and copywriting variants.

### 🌟 Key Engineering Highlights (Great for Resume)
* **High-Fidelity Multi-Frame Video Analysis**: Instead of analyzing only a single frame, the pipeline extracts chronologically ordered frame checkpoints ($0\% \rightarrow 100\%$ duration) and feeds them sequentially to the Vision LLM in a single request to evaluate pacing, visual transitions, hook strength, and CTA placement.
* **In-Browser Video Scraper Engine**: Solved the "blob URL download block" in Facebook & Meta Ads Library by executing an asynchronous, browser-side fetch script inside Selenium (`undetected-chromedriver`), converting protected blobs to Base64 binaries directly within the active session.
* **Deterministic Persistence & Caching**: Employs a low-latency cache layer mapping SHA256 hashes of inputs (images/captions/campaign targets) with strict zero-temperature Vision models to ensure identical creatives return identical scores every time.

---

## 🛠️ Complete Tech Stack

* **Backend API**: FastAPI, Uvicorn, Python 3.10
* **Database & ORM**: SQLite, SQLAlchemy
* **Computer Vision & Processing**: OpenCV, MoviePy (WAV PCM extraction)
* **Speech Recognition**: Google Web Speech API (transcribes video audio in 30-second chunks)
* **Automated Scraper**: Selenium + `undetected-chromedriver`
* **Large Language Models**: GPT-4o-mini & Gemini via OpenRouter API
* **Frontend UI**: React 19, TypeScript, Vite, Tailwind CSS, Motion (Framer Motion), Axios

---

## ⚙️ Project Structure

```text
├── backend/
│   ├── main.py             # FastAPI App, routing, and exception handlers
│   ├── analyzer.py         # Multi-model LLM gateway, scoring rubric & prompt templates
│   ├── video_analyzer.py   # Video frame splitter, WAV extractor, and LLM prompt compiler
│   ├── url_analyzer.py     # Selenium browser controller and async blob download pipeline
│   ├── models.py           # SQLAlchemy database models
│   ├── database.py         # DB session engine
│   └── schemas.py          # Pydantic request/response schemas
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Core layout and state container
│   │   ├── components/     # UI panels (Upload, Dashboard, Brand center, etc.)
│   │   └── services/       # Axios API client
│   └── package.json
└── package.json            # Root dev script workspace config
```

---

## 💻 Local Quick Start

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **Python** (3.10+) installed.

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# OpenRouter API Key
OPENROUTER_API_KEY=your-api-key-here

# Database URL (Defaults to SQLite)
DATABASE_URL=sqlite:///./advantage_ai.db
```

### 3. Install Dependencies
Run from the root directory:
```bash
# Install Node devDependencies & packages
npm install

# Install Python requirements globally
python -m pip install -r requirements.txt
```

### 4. Start Development Servers
Run the concurrent script:
```bash
npm run dev
```
* **Frontend URL**: `http://localhost:3001` (Vite)
* **Backend API**: `http://localhost:8000` (FastAPI)
