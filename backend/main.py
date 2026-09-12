"""AI Health Guardian — FastAPI backend."""

from __future__ import annotations

import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import Groq
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

from config import ALLOWED_ORIGINS, GROQ_API_KEY, SUPABASE_KEY, SUPABASE_URL

app = FastAPI(title="AI Health Guardian", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Simple in-memory rate limiter: max 10 requests per minute per user_id
RATE_LIMIT = 10
RATE_WINDOW_SECONDS = 60
_rate_limit_store: dict[str, list[float]] = defaultdict(list)

SYSTEM_PROMPT = (
    "You are a medical AI assistant. Analyze the patient health data carefully. "
    "Return ONLY a valid JSON object with these exact keys: "
    "risk_level (must be one of: Low, Medium, High, Critical), "
    "diagnosis (string, 2-3 sentences), "
    "recommendations (list of exactly 5 actionable strings), "
    "disclaimer (string). "
    "No extra text, no markdown, only raw JSON."
)

VALID_RISK_LEVELS = {"Low", "Medium", "High", "Critical"}


class HealthInput(BaseModel):
    symptoms: list[str] = Field(..., min_length=0)
    heart_rate: int
    temperature: float
    spo2: int
    blood_pressure: str
    age: int
    user_id: str = Field(..., min_length=1)

    @field_validator("heart_rate")
    @classmethod
    def validate_heart_rate(cls, value: int) -> int:
        if value < 20 or value > 300:
            raise ValueError("heart_rate must be between 20 and 300")
        return value

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, value: float) -> float:
        if value < 30 or value > 45:
            raise ValueError("temperature must be between 30 and 45")
        return value

    @field_validator("spo2")
    @classmethod
    def validate_spo2(cls, value: int) -> int:
        if value < 50 or value > 100:
            raise ValueError("spo2 must be between 50 and 100")
        return value

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: int) -> int:
        if value < 1 or value > 120:
            raise ValueError("age must be between 1 and 120")
        return value

    @field_validator("blood_pressure")
    @classmethod
    def validate_blood_pressure(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("blood_pressure must not be empty")
        return cleaned

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, value: list[str]) -> list[str]:
        return [s.strip() for s in value if isinstance(s, str) and s.strip()]


def check_rate_limit(user_id: str) -> None:
    now = time.time()
    window_start = now - RATE_WINDOW_SECONDS
    timestamps = [t for t in _rate_limit_store[user_id] if t > window_start]
    _rate_limit_store[user_id] = timestamps

    if len(timestamps) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 10 requests per minute. Please try again shortly.",
        )

    _rate_limit_store[user_id].append(now)


def build_medical_prompt(data: HealthInput) -> str:
    symptoms_text = ", ".join(data.symptoms) if data.symptoms else "None reported"
    return (
        "Analyze the following patient health data and return the required JSON only.\n\n"
        f"Age: {data.age}\n"
        f"Symptoms: {symptoms_text}\n"
        f"Heart Rate: {data.heart_rate} bpm\n"
        f"Body Temperature: {data.temperature} °C\n"
        f"SpO2 (Oxygen Saturation): {data.spo2}%\n"
        f"Blood Pressure: {data.blood_pressure}\n\n"
        "Assess overall risk carefully based on vitals and symptoms. "
        "Provide a concise diagnosis and exactly 5 actionable recommendations. "
        "Include a clear medical disclaimer that this is not a substitute for professional medical advice."
    )


def extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        # Drop opening fence and optional language tag, and closing fence
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model response")

    return json.loads(cleaned[start : end + 1])


def validate_analysis_result(result: dict[str, Any]) -> dict[str, Any]:
    required_keys = {"risk_level", "diagnosis", "recommendations", "disclaimer"}
    missing = required_keys - set(result.keys())
    if missing:
        raise ValueError(f"Missing keys in AI response: {', '.join(sorted(missing))}")

    risk_level = str(result["risk_level"]).strip()
    if risk_level not in VALID_RISK_LEVELS:
        raise ValueError(
            f"Invalid risk_level '{risk_level}'. Must be one of: Low, Medium, High, Critical"
        )

    diagnosis = str(result["diagnosis"]).strip()
    if not diagnosis:
        raise ValueError("diagnosis must be a non-empty string")

    recommendations = result["recommendations"]
    if not isinstance(recommendations, list) or len(recommendations) != 5:
        raise ValueError("recommendations must be a list of exactly 5 strings")
    recommendations = [str(item).strip() for item in recommendations]
    if any(not item for item in recommendations):
        raise ValueError("recommendations must contain non-empty strings")

    disclaimer = str(result["disclaimer"]).strip()
    if not disclaimer:
        raise ValueError("disclaimer must be a non-empty string")

    return {
        "risk_level": risk_level,
        "diagnosis": diagnosis,
        "recommendations": recommendations,
        "disclaimer": disclaimer,
    }


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(data: HealthInput) -> dict[str, Any]:
    try:
        check_rate_limit(data.user_id)

        user_prompt = build_medical_prompt(data)

        try:
            completion = groq_client.chat.completions.create(
                model="compound-beta",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to get response from Groq API: {str(exc)}",
            ) from exc

        raw_content = completion.choices[0].message.content
        if not raw_content:
            raise HTTPException(status_code=502, detail="Empty response from Groq API")

        try:
            parsed = extract_json(raw_content)
            result = validate_analysis_result(parsed)
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to parse AI response as valid JSON: {str(exc)}",
            ) from exc

        record = {
            "user_id": data.user_id,
            "input_data": data.model_dump(),
            "result": result,
            "risk_level": result["risk_level"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            supabase.table("analyses").insert(record).execute()
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to save analysis to Supabase: {str(exc)}",
            ) from exc

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during analysis: {str(exc)}",
        ) from exc


@app.get("/history/{user_id}")
async def history(user_id: str) -> list[dict[str, Any]]:
    try:
        if not user_id.strip():
            raise HTTPException(status_code=422, detail="user_id must not be empty")

        try:
            response = (
                supabase.table("analyses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch history from Supabase: {str(exc)}",
            ) from exc

        return response.data or []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error fetching history: {str(exc)}",
        ) from exc


CHAT_SYSTEM_PROMPT = (
    "You are a helpful medical AI assistant. Answer health questions clearly and "
    "responsibly. Always recommend consulting a doctor for serious concerns. "
    "Be concise and friendly."
)


class ChatMessage(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned not in {"user", "assistant", "system"}:
            raise ValueError("role must be one of: user, assistant, system")
        return cleaned

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("content must not be empty")
        # Cap each history message to avoid request_too_large
        return cleaned[:500]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    user_id: str = Field(..., min_length=1)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("message must not be empty")
        # Cap current user message to avoid request_too_large
        return cleaned[:500]


@app.post("/chat")
async def chat(payload: ChatRequest) -> dict[str, str]:
    try:
        check_rate_limit(payload.user_id)

        # Keep only the last 3 history messages for context
        recent_history = payload.history[-3:]

        messages: list[dict[str, str]] = [
            {"role": "system", "content": CHAT_SYSTEM_PROMPT}
        ]
        for item in recent_history:
            messages.append({"role": item.role, "content": item.content[:500]})
        messages.append({"role": "user", "content": payload.message[:500]})

        try:
            completion = groq_client.chat.completions.create(
                model="compound-beta",
                messages=messages,
                temperature=0.4,
                max_tokens=500,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to get chat response from Groq API: {str(exc)}",
            ) from exc

        raw_content = completion.choices[0].message.content
        if not raw_content or not str(raw_content).strip():
            raise HTTPException(status_code=502, detail="Empty response from Groq API")

        return {"response": str(raw_content).strip()}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during chat: {str(exc)}",
        ) from exc
