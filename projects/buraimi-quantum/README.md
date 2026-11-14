# الحوسبة الكمية في دقيقة | Buraimi Quantum Computing

A 60-second Arabic explainer for Al Buraimi Governorate: 1920x1080, 60 fps, 3600 frames, narrated, with a subtitle track.
Same engine and identity as `buraimi-fintech` and `buraimi-semiconductors`; only the scenes, wording, narration and sound cues differ.

| Time | Idea | What happens on screen |
| --- | --- | --- |
| 0–5 s | الحوسبة الكمية | Title, "جديدة · مختلفة · واعدة" |
| 5–15 s | الكيوبت | An ordinary bit is a coin lying flat (0 or 1); a qubit is a spinning coin (both) until it is measured |
| 15–25 s | التشابك | Two linked qubits move apart; measuring one settles both |
| 25–35 s | كيف يحسب | A branching tree: the ordinary computer tries one path at a time, the quantum one lights every path and then keeps the right one |
| 35–45 s | أين ينفع | Medicines, new materials, routes and shipping, data protection |
| 45–54 s | أين وصلنا | A cryostat cooling towards -273 °C, still in laboratories, working alongside ordinary computers |
| 54–60 s | Closing | Recap of the five, then the logos |

## Files
`film.js` (the film: frame in, SVG out; wording and timings in `SCENES`), `preview.html`, `render.mjs`, `index.jsx` (Remotion entry, not yet run),
`cues.json` + `voice.py` (narration; `.github/workflows/buraimi-quantum-voice.yml` commits `assets/voice.mp3`), `sound.py` (original music and effects),
`assets/fonts` (Tajawal, SIL Open Font License), `Buraimi-Quantum.mp4`, `Buraimi-Quantum.srt`.

Rebuild as described in `../buraimi-fintech/README.md`, with this folder's paths.

## What was checked, and what was not
- Checked: the MP4 is 60.000 s, 3600 frames, H.264 1920x1080 at 60 fps, AAC audio at about -16 LUFS, one Arabic subtitle track. Sampled frames from every scene were inspected.
- Rendered with `render.mjs`, not Remotion.
- The narration is a synthetic voice (ar-OM-AbdullahNeural). Nobody has listened to this mix; pronunciation, dialect and timing need a review by an Omani speaker.
- The physics is simplified with analogies. The spinning coin stands for superposition and is not what a qubit is. "Takes every path at once, then strengthens the right answer" is a loose picture of interference; quantum computers are faster only for certain problems, which the film says. Entanglement is shown as knowing the second result on measuring the first; it does not send information. Have a subject specialist read the wording before official use.
- Logo usage should be confirmed against each owner's brand guidelines.
