# AI Health Guardian

## Inspiration
Millions of people delay medical care because clinics are far away, appointments are expensive, or they simply do not know whether symptoms are urgent. Early risk detection can save lives — especially when warning signs are subtle and easy to dismiss. We built AI Health Guardian to democratize access to first-pass health insights with AI, so anyone with a phone — including users across India and other developing regions — can get a clear risk signal and actionable next steps in seconds.

## What it does
Users open a dark, premium web experience and enter symptoms plus vitals like heart rate, temperature, SpO2, blood pressure, and age. The FastAPI backend sends that data to Groq’s LLaMA models, which return a structured risk level, diagnosis summary, and five recommendations. Results are visualized with an animated health score ring, emergency alerts for Critical/High risk, and a trend chart across past analyses. An AI Health Assistant chat lets users ask follow-up questions while every assessment is stored securely in Supabase for history.

## How we built it
We designed a full-stack architecture optimized for speed and clarity under hackathon constraints. The frontend is Next.js 14 + TypeScript + Tailwind CSS with a consistent `#0a0f1e` health-tech dark theme, animated SVG score rings, Recharts trend visualization, and a conversational chat UI. The backend is Python FastAPI with Pydantic validation, in-memory rate limiting, CORS from environment config, and Groq chat completions for both structured risk analysis and free-form medical Q&A. Persistence uses Supabase (PostgreSQL) with a dedicated `analyses` table indexed by `user_id` and `created_at`. Secrets never ship in source — only `.env.example` templates — so the repo stays safe for a public GitHub push.

## Challenges we ran into
**Groq model deprecation:** Our original model ID (`llama3-70b-8192`) became unavailable / deprecated during development, which broke analysis mid-demo prep. We solved it by migrating to a currently supported Groq model (`compound-beta`), keeping the same JSON contract and validation layer so the UI did not need a redesign.

**Supabase RLS permissions:** Inserts and history fetches failed when Row Level Security blocked the anon key from writing/reading `analyses`. We resolved it by aligning table policies with our demo auth model (service-safe anon access for the hackathon table) and verifying inserts via the backend before reconnecting the frontend history chart.

## Accomplishments that we're proud of
- A judge-ready results experience: animated 0–100 health score ring, count-up animation, and Critical emergency UX with `tel:112` + Web Audio alert.
- Real health trend visualization over the last 10 analyses with gradient-filled Recharts and risk-colored scoring.
- A responsible AI chat assistant with conversation context, rate limiting, and strong medical disclaimers — not just a single-shot form.

## What we learned
- Structured LLM outputs need defensive parsing and schema validation — models sometimes wrap JSON in markdown even when told not to.
- Product polish (motion, empty states, emergency UX) matters as much as the model call for hackathon judging.
- Separating secrets into environment variables from day one makes public GitHub demos safer and faster to set up on new machines.

## What's next for AI Health Guardian
- A native mobile app with push notifications for worsening trends.
- Wearable integration (smartwatch heart rate / SpO2 streams) for continuous monitoring.
- One-tap doctor consultation booking with location-aware clinic recommendations.

## Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, Uvicorn, Pydantic, python-dotenv
- **AI:** Groq API (LLaMA / compound models)
- **Database:** Supabase (PostgreSQL)
- **Tooling:** Git, npm, REST JSON APIs
