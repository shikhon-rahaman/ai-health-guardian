# AI Health Guardian — Backend

## Setup
1. Clone the repo
2. cd backend
3. python -m venv venv
4. source venv/bin/activate (Mac/Linux) or venv\Scripts\activate (Windows)
5. pip install -r requirements.txt
6. cp .env.example .env
7. Fill in your real values in .env
8. uvicorn main:app --reload

## Environment Variables
Copy .env.example to .env and fill in:
- GROQ_API_KEY: Get from console.groq.com
- SUPABASE_URL: Get from your Supabase project settings
- SUPABASE_KEY: Get from your Supabase project API settings
- ALLOWED_ORIGINS: Frontend URL (default: http://localhost:3000)

Never commit your .env file.
