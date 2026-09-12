# AI Health Guardian 🫀

> AI-powered instant health risk detection — VoltHacks 2026

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![VoltHacks 2026](https://img.shields.io/badge/VoltHacks-2026-orange.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-blue.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)]()

## 🎯 What It Does

AI Health Guardian lets users enter their symptoms and vitals and receive an instant AI-powered health risk assessment in under 3 seconds. The app detects risk levels (Low, Medium, High, Critical), provides an animated health score, gives 5 actionable recommendations, shows a health trend chart over time, triggers emergency alerts for critical cases, and includes an AI health chat assistant.

## ✨ Features

- 🔴 **Instant Risk Detection** — Low / Medium / High / Critical classification
- 📊 **Animated Health Score Ring** — Visual score from 0-100 with smooth animation
- 🚨 **Emergency Alert System** — Critical risk triggers pulsing alert with Call 112 button
- 📈 **Health Trend Chart** — Track your health score over time with recharts
- 🤖 **AI Health Chat** — Ask any health question to the AI assistant
- 🗄️ **History Tracking** — All analyses saved to Supabase database
- 🔒 **Secure** — All secrets in environment variables, never hardcoded

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI |
| AI Model | Groq API (compound-beta) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend), Render (backend) |

## 🏗️ Project Structure

```
ai-health-guardian/
├── backend/          → FastAPI Python backend
│   ├── main.py       → API endpoints
│   ├── config.py     → Environment config
│   └── requirements.txt
└── frontend/         → Next.js frontend
    └── src/
        ├── app/
        │   ├── page.tsx        → Landing page
        │   ├── analyze/        → Health input form
        │   ├── result/         → Risk dashboard
        │   ├── history/        → Trend chart
        │   └── chat/           → AI chat
        └── lib/
            └── config.ts       → API config
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in your keys in .env
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your API URL
npm run dev
```

## 🔑 Environment Variables

### Backend (`.env`)

```
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero page with stats |
| Analyze | `/analyze` | Health data input form |
| Result | `/result` | Risk score + AI diagnosis |
| History | `/history` | Health trend chart |
| Chat | `/chat` | AI health assistant |

## 🏆 Built For

**VoltHacks 2026** — Theme: AI-powered tools + Smart Health Technology

Built by **Shikhon Rahaman** — B.Tech CSE (AI/ML), Narula Institute of Technology

## ⚠️ Disclaimer

This app is not a substitute for professional medical advice. Always consult a qualified healthcare provider for medical decisions.
