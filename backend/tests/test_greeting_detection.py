"""A pure greeting must not trigger medical retrieval, in any supported language.

Regression: "ಹಾಯ್ ಹಲೋ" / "hello hello hello" were not recognised (only exact one-phrase greetings
were), so they went to PubMed and came back with unrelated papers that derailed the reply.
"""
import pytest

from app.websocket import _is_social_greeting


@pytest.mark.parametrize(
    "text",
    [
        "hello", "hello hello hello", "Hi there!", "good morning doctor",
        "ಹಾಯ್ ಹಲೋ", "ಹಾಯ್ ಹಾಯ್", "ನಮಸ್ಕಾರ ಡಾಕ್ಟರ್", "ನಮಸ್ತೆ, ನಮಸ್ತೆ",
        "हाय हेलो", "नमस्ते डॉक्टर", "हैलो",
    ],
)
def test_greetings_are_detected(text):
    assert _is_social_greeting(text)


@pytest.mark.parametrize(
    "text",
    [
        "hello I have a headache", "hey doctor my chest hurts since morning",
        "ಹಲೋ ನನಗೆ ತಲೆನೋವು", "ನನಗೆ ಜ್ವರ ಇದೆ",
        "नमस्ते मुझे बुखार है", "मुझे सर दर्द है", "good", "doctor", "",
    ],
)
def test_health_messages_are_not_greetings(text):
    assert not _is_social_greeting(text)
