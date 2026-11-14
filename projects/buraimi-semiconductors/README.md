# أشباه الموصلات في دقيقة | Buraimi Semiconductors

A 60-second Arabic explainer for Al Buraimi Governorate: 1920x1080, 60 fps, 3600 frames, narrated, with a subtitle track.
Same engine and identity as `buraimi-fintech`; only the scenes, wording, narration and sound cues differ.

| Time | Idea | What happens on screen |
| --- | --- | --- |
| 0–5 s | أشباه الموصلات | Title, "أصغر · أسرع · أذكى" |
| 5–15 s | شبه الموصل | Three circuits: copper always conducts, rubber never does, silicon is switched on and off |
| 15–25 s | الترانزستور | A switch on a silicon channel; closed shows 0, open shows 1, then a row of bits |
| 25–35 s | الشريحة | Sand, then a silicon wafer etched with a counter rising to billions, then a chip beside a fingertip |
| 35–45 s | أين نجدها | One chip feeding the phone, computer, car, medical devices and solar panels |
| 45–54 s | لماذا تهمّنا | AI, the digital economy, opportunities for young people |
| 54–60 s | Closing | Recap of the five, then the logos |

## Files
`film.js` (the film: frame in, SVG out; wording and timings in `SCENES`), `preview.html`, `render.mjs`, `index.jsx` (Remotion entry, not yet run),
`cues.json` + `voice.py` (narration; `.github/workflows/buraimi-semiconductors-voice.yml` commits `assets/voice.mp3`), `sound.py` (original music and effects),
`assets/fonts` (Tajawal Regular and Bold, SIL Open Font License, see `OFL.txt`), `Buraimi-Semiconductors.mp4`, `Buraimi-Semiconductors.srt`.

Rebuild as described in `../buraimi-fintech/README.md`, with this folder's paths.

## What was checked, and what was not
- Checked: the MP4 is 60.000 s, 3600 frames, H.264 1920x1080 at 60 fps, AAC audio at about -16 LUFS, one Arabic subtitle track. Sampled frames from every scene were inspected.
- Rendered with `render.mjs` and the bundled Tajawal fonts, not Remotion.
- The narration is a synthetic voice (ar-OM-AbdullahNeural). Nobody has listened to this mix; pronunciation, dialect and timing need a review by an Omani speaker.
- The science is simplified for a general audience: a transistor is shown as a plain on/off switch, the "5,000,000,000" counter stands for "billions" and is not a figure for a specific chip, and the wafer-to-chip steps skip purification, lithography detail and packaging. Have a subject specialist read the wording before official use.
- Logo usage should be confirmed against each owner's brand guidelines.
