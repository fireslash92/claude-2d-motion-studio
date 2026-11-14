"""Original music bed and sound effects for the film (stereo 48 kHz WAV, exactly 60 s). Needs numpy only.

Everything is synthesized here, so there is nothing to license. Effect times follow the scene timings in film.js (space technologies film).
    python sound.py [out.wav]
"""
import sys, wave
from pathlib import Path
import numpy as np

SR, DUR = 48000, 60
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "assets" / "bed.wav"
L = np.zeros(SR * DUR); R = np.zeros(SR * DUR)
rng = np.random.default_rng(510)

def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= len(L) or i < 0: return
    sig = sig[: len(L) - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(.5 * (1 - pan)); R[i:i + len(sig)] += sig * np.sqrt(.5 * (1 + pan))

def tone(f, dur, attack=.005, decay=None, shape="sine", f1=None):
    t = np.arange(int(dur * SR)) / SR
    freq = f if f1 is None else f * (f1 / f) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(np.full_like(t, 1.0) * freq) / SR
    s = np.sin(ph) if shape == "sine" else (2 / np.pi) * np.arcsin(np.sin(ph)) if shape == "tri" else np.sin(ph) + .33 * np.sin(2 * ph) + .2 * np.sin(3 * ph) + .1 * np.sin(4 * ph)
    env = np.minimum(1, t / attack) * np.exp(-t * (decay if decay else 4 / dur))
    return s * env * np.minimum(1, (dur - t) / .01)

def noise(dur, lo, hi, attack=.01):
    n = int(dur * SR); spec = np.fft.rfft(rng.standard_normal(n)); fr = np.fft.rfftfreq(n, 1 / SR)
    sweep = np.linspace(lo, hi, n); spec[(fr < min(lo, hi) * .5) | (fr > max(lo, hi) * 2)] = 0
    s = np.fft.irfft(spec, n); t = np.arange(n) / SR
    return s / (np.abs(s).max() + 1e-9) * np.minimum(1, t / attack) * np.sin(np.pi * t / dur) ** 1.5

# ---------- music: 96 bpm, 24 bars of 2.5 s; i-VI-III-VII in D minor ----------
BEAT, BAR = .625, 2.5
CH = {"Dm": [146.83, 174.61, 220.00], "Bb": [116.54, 146.83, 174.61], "F": [174.61, 220.00, 261.63], "C": [130.81, 164.81, 196.00]}
BARS = ["Dm", "Dm"] + ["Dm", "Bb", "F", "C"] * 5 + ["Bb", "C"]
for bi, name in enumerate(BARS):
    t0, tones, body = bi * BAR, CH[name], 2 <= bi < 22
    for f in tones:                                            # warm pad
        for det, pan in ((-.004, -.5), (.004, .5)):
            add(tone(f * (1 + det), BAR + .6, attack=.6, decay=.55, shape="soft"), t0, pan, .020)
    add(tone(tones[0] / 2, BAR, attack=.03, decay=1.1), t0, 0, .10)          # bass
    if bi >= 1:
        for k, ix in enumerate([0, 1, 2, 1, 0, 2, 1, 2]):                     # plucked arpeggio in eighths
            add(tone(tones[ix] * 4, .3, attack=.004, decay=11, shape="tri"), t0 + k * BEAT / 2, .4 if k % 2 else -.4, .030 if body else .018)
    if body:
        for b in (0, 2):                                                      # soft kick on 1 and 3
            add(tone(105, .25, attack=.003, decay=16, f1=45), t0 + b * BEAT, 0, .16)
        for k in range(4):                                                    # off-beat shaker
            add(noise(.06, 7000, 9000, .002), t0 + BEAT / 2 + k * BEAT, .2, .010)
fade = np.minimum(1, np.minimum(np.arange(len(L)) / (1.2 * SR), (len(L) - np.arange(len(L))) / (2.2 * SR)))
L *= fade; R *= fade

# ---------- sound effects (seconds) ----------
def whoosh(t): add(noise(.5, 500, 3200), t - .2, 0, .09)
def pop(t, pan=.5): add(tone(880, .09, decay=40, f1=1320), t, pan, .06)
def tap(t): add(tone(520, .06, decay=60), t, 0, .10); add(noise(.03, 2500, 4000, .001), t, 0, .04)
def ding(t): add(tone(1046.5, .7, decay=6), t, 0, .10); add(tone(1568, .9, decay=5), t + .09, 0, .08)
def beep(t): add(tone(1318.5, .09, decay=20), t, 0, .07); add(tone(1760, .12, decay=18), t + .08, 0, .06)
def coin(t): add(tone(2093, .3, decay=12), t, .3, .05); add(tone(2637, .35, decay=11), t + .05, .3, .04)
def buzz(t): add(tone(150, .28, decay=6, shape="soft"), t, 0, .12); add(tone(70, .3, decay=9, f1=45), t, 0, .22)

for t in (5, 15, 25, 35, 45, 54): whoosh(t)
STEPS = {300: [120, 262, 340, 470], 900: [124, 250, 345, 470], 1500: [120, 330, 450, 510], 2100: [130, 330, 450, 500], 2700: [100, 215, 320, 440]}
for start, offs in STEPS.items():
    for k, o in enumerate(offs):
        (ding if k == 3 else pop)((start + o) / 60)
for t in (196, 226, 256): pop(t / 60, 0)                       # intro: connect, observe, explore
add(noise(2.6, 180, 1400, .4), (300 + 100) / 60, 0, .11); add(tone(60, 2.4, attack=.3, decay=.9, f1=110), (300 + 110) / 60, 0, .12)   # lift-off
beep((300 + 264) / 60)                                                                       # satellite released
add(tone(880, .8, attack=.05, decay=3, f1=1760), (900 + 124) / 60, .5, .04); add(tone(1760, .8, attack=.05, decay=3, f1=880), (900 + 250) / 60, -.5, .04)   # uplink, downlink
coin((900 + 334) / 60)
for k in range(3): beep((1500 + 112 + k * 40) / 60)                                          # three satellites heard
for k in range(3): add(tone(440 * (1.25 ** k), .5, attack=.05, decay=5), (1500 + 330 + k * 30) / 60, (-.5, 0, .5)[k], .05)
coin((1500 + 474) / 60)                                                                      # the pin drops
add(noise(1.4, 400, 1600, .3), (2100 + 110) / 60, .3, .05)                                   # the cyclone
add(noise(2.2, 200, 1500, .3), (2700 + 130) / 60, .3, .07)                                   # a rocket to the Moon
for i in range(5): pop((3240 + 20 + i * 20) / 60, .6 - i * .3)
for i in range(3): pop((3240 + 96 + i * 12) / 60, 0)
for k, f in enumerate((293.66, 440.0, 587.33, 880.0)):         # closing swell under the logos
    add(tone(f, 2.6, attack=.25, decay=1.3, shape="soft"), (3240 + 150) / 60 + k * .06, (-.4, .4, -.2, .2)[k], .05)

mix = np.stack([L, R], axis=1); mix = np.tanh(mix * 1.6) / 1.6
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print("wrote", OUT, "peak", round(float(np.abs(mix).max()), 3))
