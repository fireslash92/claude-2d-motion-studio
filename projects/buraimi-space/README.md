# تقنيات الفضاء في دقيقة | Buraimi Space Technologies

A 60-second Arabic explainer for Al Buraimi Governorate: 1920x1080, 60 fps, 3600 frames, narrated, with a subtitle track.
Same engine and identity as the other `buraimi-*` films; the illustrations sit on a night-sky disc.

| Time | Idea | What happens on screen |
| --- | --- | --- |
| 0–5 s | تقنيات الفضاء | Title, "نتواصل · نرصد · نستكشف" |
| 5–15 s | الأقمار الصناعية | A rocket climbs from Earth, releases a satellite, and the satellite circles in its orbit |
| 15–25 s | الاتصالات | A signal goes from a city up to a satellite and down over a mountain to a remote village |
| 25–35 s | تحديد المواقع | A phone hears three satellites, range circles meet, and a pin drops on the map |
| 35–45 s | رصد الأرض | A satellite scans Earth and a cyclone; weather, farming and water, emergency teams |
| 45–54 s | الاستكشاف | The Moon and Mars, a small student-built satellite, engineering and data jobs |
| 54–60 s | Closing | Recap of the five, then the logos |

## Files
`film.js` (the film: frame in, SVG out; wording and timings in `SCENES`), `preview.html`, `render.mjs`, `index.jsx` (Remotion entry, not yet run),
`cues.json` + `voice.py` (narration; `.github/workflows/buraimi-space-voice.yml` commits `assets/voice.mp3`), `sound.py` (original music and effects),
`assets/fonts` (Tajawal, SIL Open Font License), `Buraimi-Space.mp4`, `Buraimi-Space.srt`.

Rebuild as described in `../buraimi-fintech/README.md`, with this folder's paths.

## What was checked, and what was not
- Checked: the MP4 is 60.000 s, 3600 frames, H.264 1920x1080 at 60 fps, AAC audio at about -16 LUFS, one Arabic subtitle track. Sampled frames from every scene were inspected.
- Rendered with `render.mjs`, not Remotion.
- The narration is a synthetic voice (ar-OM-AbdullahNeural). Nobody has listened to this mix; pronunciation, dialect and timing need a review by an Omani speaker.
- The pictures are schematic, not to scale: orbit height, the size of the satellites and the rocket's path are drawn for clarity. Positioning is shown with three satellites; real receivers use four or more. Have a subject specialist read the wording before official use.
- The film makes no statement about any particular country's space programme.
- Logo usage should be confirmed against each owner's brand guidelines.
