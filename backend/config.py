"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

REQUIRED_VARS = [
    "GROQ_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "ALLOWED_ORIGINS",
]


def _get_required(name: str) -> str:
    value = os.getenv(name)
    if not value or not value.strip():
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value.strip()


GROQ_API_KEY = _get_required("GROQ_API_KEY")
SUPABASE_URL = _get_required("SUPABASE_URL")
SUPABASE_KEY = _get_required("SUPABASE_KEY")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _get_required("ALLOWED_ORIGINS").split(",")
    if origin.strip()
]

if not ALLOWED_ORIGINS:
    raise RuntimeError("Missing required environment variable: ALLOWED_ORIGINS")
