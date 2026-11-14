"""Synthesize the timed narration track (48 kHz mono WAV, exactly 60 s) from cues.json.

Needs network access and `pip install edge-tts`; ffmpeg/ffprobe on PATH.
The voice is synthetic (ar-OM-AbdullahNeural). Have an Omani speaker review it before publishing.
"""
import array, asyncio, json, subprocess, sys, wave
from pathlib import Path
import edge_tts

HERE = Path(__file__).parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "out"
OUT.mkdir(parents=True, exist_ok=True)
CUES = json.loads((HERE / "cues.json").read_text(encoding="utf-8"))
VOICE, RATE, PITCH, SR, MAX_SPEED = "ar-OM-AbdullahNeural", "+5%", "+7Hz", 48000, 1.35

async def make(i, cue):
    await edge_tts.Communicate(cue["say"], voice=VOICE, rate=RATE, pitch=PITCH).save(str(OUT / f"{i}.mp3"))

async def main():
    for s in range(0, len(CUES), 4):
        await asyncio.gather(*(make(i, CUES[i]) for i in range(s, min(s + 4, len(CUES)))))

asyncio.run(main())
track = array.array("h", [0]) * (60 * SR)
report, failed = [], False
for i, cue in enumerate(CUES):
    raw = OUT / f"{i}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / f"{i}.mp3"), "-af",
                    "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-45dB:stop_periods=-1:stop_duration=0.24:stop_threshold=-45dB",
                    "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(raw)], check=True)
    with wave.open(str(raw), "rb") as w:
        duration = w.getnframes() / SR
    window = cue["end"] - cue["start"] - 0.05
    speed = max(1.0, duration / window)
    if speed > MAX_SPEED:
        failed = True
    elif speed > 1:
        fit = OUT / f"{i}-fit.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"atempo={speed:.6f}", "-ar", str(SR), "-ac", "1", str(fit)], check=True)
        raw = fit
    with wave.open(str(raw), "rb") as w:
        data = array.array("h"); data.frombytes(w.readframes(w.getnframes()))
    k, n = round(cue["start"] * SR), min(len(data), round(window * SR))
    track[k:k + n] = data[:n]
    report.append({"cue": i + 1, "start": cue["start"], "end": cue["end"], "spoken_seconds": round(duration, 3),
                   "speed": round(speed, 3), "fits": speed <= MAX_SPEED, "say": cue["say"]})
with wave.open(str(OUT / "voice.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(track.tobytes())
(OUT / "timing.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=1))
if failed:
    sys.exit("At least one cue is too long for its window: shorten the text in cues.json.")
