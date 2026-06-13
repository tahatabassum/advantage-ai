# AdVantage AI

AdVantage AI is a premium, AI-powered digital marketing analyzer and creative director designed for auditing ad creatives across **Meta**, **TikTok**, and **Google Ads**. It leverages advanced computer vision and language reasoning models to analyze visual elements, copywriting hooks, and video flow, providing comprehensive optimization recommendations and alternative ad variants.

---

## 🚀 Key Features

- **Multi-Channel Ad Auditing**: Upload and audit image and video ad creatives tailored to Meta, TikTok, and Google Ads guidelines.
- **AI-Powered Analysis & Fallback**: Automatically falls back across a range of free vision-capable and reasoning models on OpenRouter (including Google Gemma 3, Llama 4, Qwen VL, DeepSeek R1) for maximum reliability.
- **Video Creative Analyzer**:
  - Automatically extracts keyframes from video files using OpenCV.
  - Transcribes audio speech using Google Speech Recognition.
  - Analyzes overall flow, hook rate, pacing, and visual engagement.
- **Copywriting Rewriter & A/B Variants**:
  - Automatically rewrite existing copy for different tones (e.g., direct response, hook-first, educational, curiosity-driven).
  - Generate A/B variant copy recommendations based on high-performing templates.
- **Brand Profile Customization**: Define brand voice, target audience, and primary competitors to tailor AI feedback to specific brands.
- **PDF Report Export**: Generate professional, publication-quality PDF audit reports (single reports or side-by-side comparison audits) using ReportLab.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (v19), TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Animation**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.x), Uvicorn
- **ORM / Database**: SQLAlchemy, SQLite
- **Security & Auth**: JWT (PyJWT / Passlib / bcrypt)
- **PDF Generation**: ReportLab
- **Video & Audio Processing**: OpenCV (headless), MoviePy, SpeechRecognition
- **Billing**: Stripe API

---

## 📂 Repository Structure

```text
advantage-ai/
├── backend/                   # FastAPI backend source code
│   ├── analyzer.py            # Main LLM/OpenRouter analysis pipeline
│   ├── video_analyzer.py      # Video frame extraction and audio transcription
│   ├── stripe_service.py      # Stripe pricing and webhook handlers
│   ├── pdf_generator.py       # ReportLab PDF design and export utilities
│   ├── database.py            # SQLite session and engine config
│   ├── models.py              # SQLAlchemy database models (User, BrandProfile, etc.)
│   ├── schemas.py             # Pydantic schemas for request/response validation
│   ├── main.py                # FastAPI app definitions, routing, and endpoints
│   └── requirements.txt       # Backend Python dependencies
├── frontend/                  # React + Vite frontend source code
│   ├── src/
│   │   ├── components/        # Reusable UI components (Upload, BrandCenter, Auth, etc.)
│   │   ├── services/          # API services wrapper (Axios configurations)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx            # Main application layout and routing
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Frontend package dependencies and build scripts
│   └── vite.config.ts         # Vite configuration (proxies /api to the backend)
├── package.json               # Root monorepo orchestration package (runs concurrently)
├── tsconfig.json              # TypeScript compilation config
├── tailwind.config.js         # Tailwind styling utility rules
├── requirements.txt           # Copy of python requirements (root level)
└── .gitignore                 # Safe git configuration ignoring databases, venvs, and logs
```

---

## ⚙️ Installation & Setup

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.10+ recommended)

### 1. Initialize Local Repository
```bash
git init
git add .
git commit -m "initial commit"
```

### 2. Environment Variables Configuration
Duplicate the `.env.example` templates and rename them to `.env`:
- **Root Level**: Copy `.env.example` to `.env`
- **Backend Level**: Copy `backend/.env.example` to `backend/.env`

Fill in the required environment variables:
- `OPENROUTER_API_KEY`: Your OpenRouter API key for LLM analysis.
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Your Stripe integration credentials.
- SMTP Settings: Configure your email sender credentials for user account verification.

### 3. Install Backend Dependencies
We recommend setting up a virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
Run the install command at the root of the project:
```bash
npm install
```

---

## 🏃 Running the Project Locally

The project uses a monorepo setup. Running `npm run dev` at the root will concurrently spin up the Python FastAPI backend and the Vite React frontend.

```bash
npm run dev
```

- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API Docs**: Interactive Swagger UI is available at `http://localhost:8000/docs`

---

## 📦 Building for Production

To build the static frontend assets and verify typing, run:

```bash
npm run build
```

This will bundle the frontend and save it in the `dist/` directory at the root level, ready to be served or deployed.
