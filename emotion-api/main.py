import json
import math
import os
import re
import struct
import subprocess
import tempfile
import threading
import wave

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="SOS Emotion Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Multi-key Gemini pool ─────────────────────────────────────────────────────
# Set GEMINI_API_KEY for a single key, or GEMINI_API_KEYS (comma-separated) for
# multiple keys.  On quota exhaustion the pool automatically rotates to the next
# key so the service keeps running.

class GeminiKeyPool:
    """Round-robin pool of Gemini clients with per-key quota tracking."""

    def __init__(self, keys: list[str]):
        from google import genai
        self._clients = [genai.Client(api_key=k) for k in keys]
        self._exhausted = [False] * len(self._clients)
        self._index = 0
        self._lock = threading.Lock()
        print(f"✅ Gemini key pool ready ({len(self._clients)} key(s))", flush=True)

    def _next(self) -> tuple[int, any]:
        """Return (index, client) for the next non-exhausted key, cycling round-robin."""
        with self._lock:
            for _ in range(len(self._clients)):
                i = self._index % len(self._clients)
                self._index += 1
                if not self._exhausted[i]:
                    return i, self._clients[i]
        return -1, None  # all exhausted

    def mark_exhausted(self, index: int):
        with self._lock:
            self._exhausted[index] = True
            print(f"⚠️  Key #{index} marked quota-exhausted", flush=True)

    def reset_all(self):
        """Call this at daily quota reset if you want auto-recovery."""
        with self._lock:
            self._exhausted = [False] * len(self._clients)
        print("🔄 All keys reset (quota refresh)", flush=True)

    @property
    def any_available(self) -> bool:
        return any(not e for e in self._exhausted)

    @property
    def key_count(self) -> int:
        return len(self._clients)


_pool: GeminiKeyPool | None = None

def _get_pool() -> GeminiKeyPool:
    return _pool  # type: ignore


GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
]

# ── local emotion2vec (fallback when no Gemini key) ──────────────────────────
local_model = None

def load_local_model():
    global local_model
    try:
        from modelscope.pipelines import pipeline
        print("Loading emotion2vec model...", flush=True)
        local_model = pipeline(
            task="emotion-recognition",
            model="iic/emotion2vec_base_finetuned",
            model_revision="v2.0.4",
        )
        print("✅ Local model loaded.", flush=True)
    except Exception as e:
        print(f"⚠️  Local model load failed: {e}", flush=True)

@app.on_event("startup")
async def startup_event():
    global _pool
    # Support both GEMINI_API_KEYS (comma-separated) and GEMINI_API_KEY (single)
    raw = os.environ.get("GEMINI_API_KEYS") or os.environ.get("GEMINI_API_KEY") or ""
    keys = [k.strip() for k in raw.split(",") if k.strip()]

    if keys:
        _pool = GeminiKeyPool(keys)
    else:
        load_local_model()

@app.get("/health")
async def health():
    pool = _get_pool()
    return {
        "status": "ok",
        "backend": "gemini" if pool else "local",
        "keys": pool.key_count if pool else 0,
        "keys_available": sum(not e for e in pool._exhausted) if pool else 0,
        "model_loaded": bool(pool) or local_model is not None,
    }

# ── helpers ───────────────────────────────────────────────────────────────────

def convert_to_wav(src: str, dst: str):
    subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-ar", "16000", "-ac", "1", "-f", "wav", dst],
        check=True, capture_output=True,
    )

def audio_rms(wav_path: str) -> float:
    try:
        with wave.open(wav_path, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            samples = struct.unpack(f"{len(frames)//2}h", frames)
            return math.sqrt(sum(s * s for s in samples) / len(samples)) if samples else 0
    except Exception:
        return 999  # assume not silent on error

EMOTION_PROMPT = """You are an emotion recognition system. Listen to this audio and classify the speaker's emotion.

Return ONLY valid JSON with exactly this structure (no markdown, no explanation):
{
  "emotion": "<top emotion>",
  "confidence": <0.0-1.0>,
  "all_scores": {
    "angry": <0.0-1.0>,
    "fear": <0.0-1.0>,
    "happy": <0.0-1.0>,
    "neutral": <0.0-1.0>,
    "sad": <0.0-1.0>,
    "surprised": <0.0-1.0>,
    "disgust": <0.0-1.0>
  },
  "reasoning": "<one sentence>"
}

Rules:
- all_scores values must sum to ~1.0
- emotion must be the key with the highest score in all_scores
- If audio is silence or too noisy to classify, return neutral with high confidence"""


def _is_quota_error(err_str: str) -> bool:
    return "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower()


def analyze_with_gemini(audio_bytes: bytes) -> dict:
    from google.genai import types
    pool = _get_pool()

    # Try each available key × each model until one succeeds
    for _ in range(pool.key_count):
        key_idx, client = pool._next()
        if client is None:
            break  # all keys exhausted

        for model in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                        EMOTION_PROMPT,
                    ],
                )
                text = re.sub(r"^```[a-z]*\n?", "", response.text.strip())
                text = re.sub(r"\n?```$", "", text)
                result = json.loads(text)
                result["success"] = True
                result["model"] = model
                result["key_index"] = key_idx
                print(
                    f"🤖 [key#{key_idx}/{model}] {result['emotion']} "
                    f"({result['confidence']*100:.1f}%) — {result.get('reasoning','')}",
                    flush=True,
                )
                return result
            except Exception as e:
                err_str = str(e)
                print(f"⚠️  [key#{key_idx}/{model}] failed: {e}", flush=True)
                if _is_quota_error(err_str):
                    pool.mark_exhausted(key_idx)
                    break  # try next key

    # All keys quota-exhausted — degrade gracefully
    print("⚠️  All Gemini keys quota-exhausted. Returning neutral fallback.", flush=True)
    return {
        "success": True,
        "emotion": "neutral",
        "confidence": 0.0,
        "all_scores": {"neutral": 1.0},
        "model": "fallback",
        "quota_exhausted": True,
    }


def analyze_with_local(wav_path: str) -> dict:
    raw = local_model(wav_path)
    print(f"🧠 Local model result: {raw}", flush=True)

    item = raw[0] if isinstance(raw, list) else raw
    labels = item.get("labels", [])
    scores = item.get("scores", [])

    all_scores: dict = {}
    for label, score in zip(labels, scores):
        english = label.split("/")[-1] if "/" in label else label
        key = english.lower().replace("fearful", "fear").replace("disgusted", "disgust")
        if key not in ("<unk>", "other"):
            all_scores[key] = float(score)

    if not all_scores:
        return {"success": True, "emotion": "neutral", "confidence": 0.0, "all_scores": {}}

    top = max(all_scores, key=lambda k: all_scores[k])
    return {"success": True, "emotion": top, "confidence": all_scores[top], "all_scores": all_scores}


# ── endpoint ──────────────────────────────────────────────────────────────────

@app.post("/emotion_recognition")
async def emotion_recognition(audio: UploadFile = File(...)):
    pool = _get_pool()
    if not pool and local_model is None:
        return JSONResponse(status_code=503, content={"error": "No backend available"})

    audio_bytes = await audio.read()
    if len(audio_bytes) < 512:
        return JSONResponse(status_code=400, content={"error": "Audio too small"})

    ct = (audio.content_type or "audio/webm").lower()
    ext = ".mp4" if "mp4" in ct else ".ogg" if "ogg" in ct else ".wav" if "wav" in ct else ".webm"

    tmp_in = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_in.close()
    tmp_wav.close()

    try:
        with open(tmp_in.name, "wb") as f:
            f.write(audio_bytes)

        convert_to_wav(tmp_in.name, tmp_wav.name)

        rms = audio_rms(tmp_wav.name)
        print(f"🔊 RMS: {rms:.1f}", flush=True)
        if rms < 50:
            return JSONResponse(content={
                "success": True, "emotion": "neutral", "confidence": 0.0,
                "all_scores": {}, "silent": True,
            })

        if pool:
            with open(tmp_wav.name, "rb") as f:
                wav_bytes = f.read()
            result = analyze_with_gemini(wav_bytes)
        else:
            result = analyze_with_local(tmp_wav.name)

        return JSONResponse(content=result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        for p in (tmp_in.name, tmp_wav.name):
            try:
                os.unlink(p)
            except OSError:
                pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
