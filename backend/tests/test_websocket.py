"""
Tests for the real-time WebSocket pipeline's concurrency contract.

These exercise `ConnectionManager` directly with a fake socket so we don't
need a live DB, LLM, or GPU. The properties under test are the ones that
make barge-in actually work:

  * `handle_text_input` dispatches without blocking (returns before the
    turn finishes) — otherwise the WS receive loop can never observe an
    interrupt.
  * A second input cancels the first in-flight turn.
  * An explicit interrupt cancels the turn and notifies the client.
  * Input validation rejects empty / oversized messages up front.
"""

import asyncio
import base64
from pathlib import Path
from types import SimpleNamespace

import pytest
import app.websocket as websocket_module

from app.websocket import (
    _CLAUSE_RE,
    _MAX_CHUNK_CHARS,
    _MIN_FIRST_CHUNK_LEN,
    _MIN_SENTENCE_LEN,
    _SENTENCE_RE,
    MAX_TEXT_INPUT_LEN,
    ConnectionManager,
    _drain_chunks,
)

# ── chunker (first-frame latency) ───────────────────────────────────────────


def test_drain_chunks_does_not_emit_a_greeting_as_the_whole_reply():
    """Short openers merge into a complete useful phrase before TTS starts."""
    buf = "Hi there! As Dr. Smit, I can help explain the options. What would you like to know?"
    chunks, rest = _drain_chunks(buf, _CLAUSE_RE, _MIN_FIRST_CHUNK_LEN, _MAX_CHUNK_CHARS)
    assert chunks
    assert chunks[0] != "Hi there!"
    assert chunks[0].startswith("Hi there!")
    assert len(chunks[0]) >= _MIN_FIRST_CHUNK_LEN


def test_drain_chunks_never_drops_text():
    """Short leading fragments merge forward rather than being discarded."""
    buf = "Hi, the answer is 42 and that is final."
    chunks, rest = _drain_chunks(buf, _CLAUSE_RE, _MIN_FIRST_CHUNK_LEN, _MAX_CHUNK_CHARS)
    reassembled = " ".join(chunks)
    if rest.strip():
        reassembled = (reassembled + " " + rest).strip()
    for word in ["Hi,", "answer", "42", "final."]:
        assert word in reassembled


def test_drain_chunks_force_flush_runon():
    """A long run-on with no punctuation is cut at a space, not held forever."""
    buf = "word " * 60  # 300 chars, no sentence punctuation
    chunks, rest = _drain_chunks(buf, _SENTENCE_RE, _MIN_SENTENCE_LEN, _MAX_CHUNK_CHARS)
    assert chunks  # something was force-flushed
    assert all(len(c) <= _MAX_CHUNK_CHARS for c in chunks)


def test_drain_chunks_holds_incomplete_buffer():
    """With no boundary and under the cap, nothing is emitted yet."""
    chunks, rest = _drain_chunks(
        "partial thought with no end", _SENTENCE_RE, _MIN_SENTENCE_LEN, _MAX_CHUNK_CHARS
    )
    assert chunks == []
    assert rest == "partial thought with no end"


class FakeWebSocket:
    """Minimal stand-in that records everything sent to the client."""

    def __init__(self):
        self.sent: list[dict] = []
        self.accepted = False

    async def accept(self):
        self.accepted = True

    async def send_json(self, message):
        self.sent.append(message)


def _wire_session(manager: ConnectionManager, session_id: str = "s1", user_id: str = "u1"):
    """Attach a fake connected session without going through the DB-backed connect()."""
    ws = FakeWebSocket()
    manager.active_connections[session_id] = ws
    manager._send_locks[session_id] = asyncio.Lock()
    manager.session_data[session_id] = {
        "messages": [],
        "user_id": user_id,
        "language": "en",
        "system_prompt": None,
        "voice_wav": None,
        "avatar_image_local": None,
    }
    return ws


@pytest.mark.asyncio
async def test_handle_text_input_is_non_blocking():
    """Dispatch must return immediately, before the turn completes."""
    m = ConnectionManager()
    _wire_session(m)

    started = asyncio.Event()

    async def slow_turn(session_id, text):
        started.set()
        await asyncio.sleep(5)  # simulate a long LLM+TTS+animation turn

    m._handle_text_input_inner = slow_turn  # type: ignore[assignment]

    # If dispatch blocked on the turn, this would take ~5s and time out.
    await asyncio.wait_for(m.handle_text_input("s1", "hello there"), timeout=0.5)

    assert "s1" in m._active_turns
    await asyncio.wait_for(started.wait(), timeout=1)  # the turn really started

    # cleanup
    await m.interrupt_active_turn("s1")


@pytest.mark.asyncio
async def test_all_audio_chunks_stream_while_lipsync_is_still_rendering(monkeypatch):
    """A slow avatar must not hold back later speech chunks."""
    manager = ConnectionManager()
    ws = _wire_session(manager)
    manager.session_data["s1"]["doctor_id"] = "dr_arjun"
    manager.session_data["s1"]["avatar_image_local"] = "/unused/reference.jpg"

    render_started = asyncio.Event()
    allow_render_to_finish = asyncio.Event()
    synthesized = []

    async def fake_synthesize(*, text, output_path, **kwargs):
        Path(output_path).write_bytes(f"wav:{text}".encode())
        synthesized.append(text)
        return SimpleNamespace(fallback=False, engine="test", voice_cloned=False)

    async def fake_animate(*, output_path, **kwargs):
        render_started.set()
        await allow_render_to_finish.wait()
        Path(output_path).write_bytes(b"fake-video")

    async def fake_upload(*args, **kwargs):
        return None

    async def fake_serving_url(key):
        return f"https://local.test/{key}"

    monkeypatch.setattr(websocket_module.tts_service, "synthesize", fake_synthesize)
    monkeypatch.setattr(websocket_module.avatar_animator, "animate", fake_animate)
    monkeypatch.setattr(websocket_module.storage_service, "upload_file", fake_upload)
    monkeypatch.setattr(websocket_module.storage_service, "serving_url", fake_serving_url)

    queue = asyncio.Queue()
    await queue.put("First complete sentence.")
    await queue.put("Second complete sentence.")
    await queue.put(None)
    task = asyncio.create_task(manager._animate_from_queue("s1", queue))

    await asyncio.wait_for(render_started.wait(), timeout=1)
    for _ in range(100):
        audio_events = [item for item in ws.sent if item["type"] == "audio_chunk"]
        if len(audio_events) == 2:
            break
        await asyncio.sleep(0.01)

    assert synthesized == ["First complete sentence.", "Second complete sentence."]
    assert [base64.b64decode(item["audio_data"]) for item in audio_events] == [
        b"wav:First complete sentence.",
        b"wav:Second complete sentence.",
    ]
    assert not any(item["type"] == "video_chunk" for item in ws.sent)
    assert any(item["type"] == "audio_stream_end" for item in ws.sent)

    allow_render_to_finish.set()
    await asyncio.wait_for(task, timeout=1)
    assert len([item for item in ws.sent if item["type"] == "video_chunk"]) == 2


@pytest.mark.asyncio
async def test_second_input_interrupts_first():
    """A new turn cancels the previous in-flight turn (barge-in)."""
    m = ConnectionManager()
    _wire_session(m)

    async def slow_turn(session_id, text):
        await asyncio.sleep(5)

    m._handle_text_input_inner = slow_turn  # type: ignore[assignment]

    await m.handle_text_input("s1", "first message")
    first_task = m._active_turns["s1"]

    await m.handle_text_input("s1", "second message")
    await asyncio.sleep(0.05)  # let the cancellation settle

    assert first_task.cancelled() or first_task.done()
    # The new turn is now the active one.
    assert m._active_turns["s1"] is not first_task

    await m.interrupt_active_turn("s1")


@pytest.mark.asyncio
async def test_explicit_interrupt_notifies_client():
    """interrupt_active_turn cancels and emits an `interrupted` event."""
    m = ConnectionManager()
    ws = _wire_session(m)

    async def slow_turn(session_id, text):
        await asyncio.sleep(5)

    m._handle_text_input_inner = slow_turn  # type: ignore[assignment]
    await m.handle_text_input("s1", "talk to me")

    interrupted = await m.interrupt_active_turn("s1")
    assert interrupted is True
    assert "s1" not in m._active_turns
    assert any(msg["type"] == "interrupted" for msg in ws.sent)


@pytest.mark.asyncio
async def test_interrupt_with_no_active_turn_is_noop():
    m = ConnectionManager()
    _wire_session(m)
    assert await m.interrupt_active_turn("s1") is False


@pytest.mark.asyncio
async def test_empty_text_rejected():
    m = ConnectionManager()
    ws = _wire_session(m)
    await m.handle_text_input("s1", "   ")
    assert any(msg["type"] == "error" for msg in ws.sent)
    assert "s1" not in m._active_turns  # no turn spawned


@pytest.mark.asyncio
async def test_oversized_text_rejected():
    m = ConnectionManager()
    ws = _wire_session(m)
    await m.handle_text_input("s1", "x" * (MAX_TEXT_INPUT_LEN + 1))
    assert any(
        "too long" in msg.get("message", "").lower() for msg in ws.sent if msg["type"] == "error"
    )
    assert "s1" not in m._active_turns


@pytest.mark.asyncio
async def test_set_language_coerces_unknown():
    m = ConnectionManager()
    _wire_session(m)
    await m.set_language("s1", "klingon")
    assert m.session_data["s1"]["language"] == "en"
    await m.set_language("s1", "fr")
    assert m.session_data["s1"]["language"] == "fr"


@pytest.mark.asyncio
async def test_set_voice_rejects_cross_tenant(monkeypatch):
    """A voice owned by another user must not attach to this session."""
    m = ConnectionManager()
    _wire_session(m, user_id="owner-A")

    async def fake_entry(voice_id):
        return {"id": voice_id, "user_id": "owner-B", "wav_path": "/tmp/x.wav"}

    monkeypatch.setattr(m, "_get_voice_entry", fake_entry)
    ok = await m.set_voice_by_id("s1", "some-voice")
    assert ok is False
    assert m.session_data["s1"]["voice_wav"] is None


@pytest.mark.asyncio
async def test_audio_transcribed_in_session_language(monkeypatch):
    """STT must use the session's selected language, not always English."""
    import base64

    from app.services import stt as stt_module

    m = ConnectionManager()
    _wire_session(m)
    m.session_data["s1"]["language"] = "fr"

    captured = {}

    async def fake_transcribe(audio, language="en"):
        captured["language"] = language
        return ""  # empty → handler returns before spawning a turn

    monkeypatch.setattr(stt_module.stt_service, "transcribe", fake_transcribe)
    # _handle_audio_inner reads the module-level stt_service via the ws module
    from app import websocket as wsmod

    monkeypatch.setattr(wsmod.stt_service, "transcribe", fake_transcribe)

    await m._handle_audio_inner("s1", base64.b64encode(b"x" * 2000).decode())
    assert captured.get("language") == "fr"
