from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

EMOTION_THRESHOLDS = [
    (0.75,  1.0,  "EUPHORIC"),
    (0.40,  0.75, "EXCITED"),
    (0.10,  0.40, "HOPEFUL"),
    (-0.10, 0.10, "NEUTRAL"),
    (-0.30, -0.10, "MELANCHOLIC"),
    (-0.60, -0.30, "ANXIOUS"),
    (-0.85, -0.60, "ANGRY"),
    (-1.0,  -0.85, "DEPRESSED"),
]


def analyze(text: str) -> dict:
    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]
    return {
        "score": compound,
        "positive": scores["pos"],
        "negative": scores["neg"],
        "neutral": scores["neu"],
        "label": _label(compound),
    }


def score_to_emotion(score: float, volatility: float = 0.0) -> str:
    if volatility > 0.82:
        return "CHAOTIC"
    if score < -0.85 and volatility > 0.5:
        return "NOSTALGIC"
    for low, high, emotion in EMOTION_THRESHOLDS:
        if low <= score <= high:
            return emotion
    return "NEUTRAL"


def _label(score: float) -> str:
    if score >= 0.05:
        return "positive"
    if score <= -0.05:
        return "negative"
    return "neutral"
