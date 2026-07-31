"""
AI-powered insight generation via the HuggingFace Inference Providers router
(OpenAI-compatible chat completions API).
Falls back to template rotation when HF_TOKEN is not set.

Get a free token at https://huggingface.co/settings/tokens
Set it as HF_TOKEN in your environment or .env file.
"""

import os
import random
import logging
import httpx

logger = logging.getLogger(__name__)

HF_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
HF_URL = "https://router.huggingface.co/v1/chat/completions"

# Fallback templates used when HF_TOKEN is absent or the API call fails
_FALLBACK_TEMPLATES = [
    ("Gaming communities show elevated excitement — a major release appears imminent.", "pattern", "info"),
    ("Internet anxiety spiked 34% following recent global news coverage.", "spike", "moderate"),
    ("Nostalgia content is surging across all platforms — expect emotional retrospectives.", "pattern", "info"),
    ("FinTwit sentiment reversed sharply in the last 15 minutes. Watch for cascade.", "shift", "high"),
    ("r/aww is singlehandedly keeping the global mood index positive right now.", "pattern", "info"),
    ("Sentiment divergence between political and gaming spaces is at a 6-hour high.", "shift", "moderate"),
    ("Viral velocity is accelerating beyond normal parameters.", "spike", "high"),
    ("Emotional propagation from worldnews → politics → fintwit detected. Cascading.", "warning", "high"),
    ("Three distinct mood clusters forming: joyful niches, anxious news consumers, volatile traders.", "pattern", "moderate"),
    ("Cultural saturation approaching on current meme cycle — expect irony inversion soon.", "pattern", "info"),
    ("Internet energy index crossed 80 — unusually high posting intensity for this hour.", "spike", "moderate"),
    ("Community fragmentation increasing. The internet is not feeling one thing right now.", "shift", "moderate"),
    ("Positive sentiment wave originated in r/aww and has now reached mainstream feeds.", "shift", "info"),
    ("Breaking news cycle detected. Expect volatility for the next 2-3 hours.", "warning", "high"),
    ("Music Twitter driving overall mood uplift — currently the most positive active community.", "pattern", "info"),
]

def _build_prompt(global_score: float, top_community: str, top_trend: str, emotion: str) -> str:
    mood_label = "positive" if global_score > 0.1 else "negative" if global_score < -0.1 else "mixed"
    return (
        f"You are an AI analyst monitoring real-time internet sentiment. "
        f"Current data: global mood is {mood_label} ({global_score:+.2f}), "
        f"emotion: {emotion}, most active community: {top_community}, "
        f"top trend: {top_trend}. "
        f"Write ONE short (max 20 words) sharp analytical insight about what's happening "
        f"on the internet right now. Be specific and punchy. No hashtags."
    )


def _classify(text: str) -> tuple[str, str]:
    text_lower = text.lower()
    if any(w in text_lower for w in ["warn", "alert", "danger", "crisis", "crash"]):
        return "warning", "high"
    if any(w in text_lower for w in ["spike", "surge", "explod", "soar", "viral"]):
        return "spike", "high"
    if any(w in text_lower for w in ["shift", "reverse", "diverg", "fractur", "split"]):
        return "shift", "moderate"
    return "pattern", "info"


async def generate_insight(
    global_score: float,
    top_community: str,
    top_trend: str,
    emotion: str,
) -> tuple[str, str, str]:
    """Return (text, category, severity). Never raises."""
    hf_token = os.getenv("HF_TOKEN", "")
    if not hf_token:
        tmpl, cat, sev = random.choice(_FALLBACK_TEMPLATES)
        return tmpl, cat, sev

    prompt = _build_prompt(global_score, top_community, top_trend, emotion)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                HF_URL,
                headers={"Authorization": f"Bearer {hf_token}"},
                json={
                    "model": HF_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 60,
                    "temperature": 0.75,
                },
            )
            if resp.status_code != 200:
                # Rate limit, missing credits, model unavailable — fall back silently
                logger.debug("HuggingFace router returned %d, using fallback", resp.status_code)
                tmpl, cat, sev = random.choice(_FALLBACK_TEMPLATES)
                return tmpl, cat, sev

            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            if len(text) > 15:
                cat, sev = _classify(text)
                return text[:200], cat, sev
    except Exception as exc:
        logger.debug("HuggingFace insight failed (%s), using fallback", exc)

    tmpl, cat, sev = random.choice(_FALLBACK_TEMPLATES)
    return tmpl, cat, sev
