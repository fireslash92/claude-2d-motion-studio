# التقنية المالية في دقيقة | Buraimi FinTech

A 60-second Arabic explainer for Al Buraimi Governorate: 1920x1080, 60 fps, 3600 frames, narrated, with a subtitle track.
It replaces the slide-style `oman-fintech` film with one where each example is acted out on screen.

## What is explained
Intro, five everyday examples, closing card with the two logos. Each example shows the action, three numbered steps that light up as they happen, and one result line.

| Time | Example | What happens on screen |
| --- | --- | --- |
| 0–5 s | التقنية المالية | Title, "أسرع · أسهل · آمن" |
| 5–15 s | الدفع اللاتلامسي | Phone moves to the terminal, signal, payment accepted for a cup of karak |
| 15–25 s | التحويل الفوري | Pick recipient, enter amount, send; the money travels from Al Buraimi to Salalah |
| 25–35 s | البنك في جوالك | Balance, electricity bill paid from home, no branch visit |
| 35–45 s | للمشاريع الصغيرة | Customer scans the stall's payment code, the owner receives the money, sales grow |
| 45–54 s | الأمان أولًا | A message asks for the verification code and is refused; check the app and the link |
| 54–60 s | Closing | Recap of the five, then the logos |

## Files
- `film.js` — the whole film as one deterministic function: frame number in, SVG out. Timings and wording live in `SCENES` at the top.
- `preview.html` — plays the film in a browser (needs `assets/fonts/Tajawal-Regular.ttf` and `Tajawal-Bold.ttf`, OFL, not bundled).
- `render.mjs` — headless-Chrome frame renderer. `index.jsx` — Remotion entry using the same `film.js`.
- `cues.json` + `voice.py` — narration text, timing windows and synthesis. `.github/workflows/buraimi-fintech-voice.yml` runs it and commits `assets/voice.mp3`.
- `sound.py` — original music bed and sound effects (numpy, nothing licensed).
- `Buraimi-FinTech.mp4`, `Buraimi-FinTech.srt` — the delivery.

## Rebuild
```sh
python projects/buraimi-fintech/sound.py bed.wav
node projects/buraimi-fintech/render.mjs 0 3600 1 frames
ffmpeg -i bed.wav -i projects/buraimi-fintech/assets/voice.mp3 -filter_complex "[1:a]aresample=48000,loudnorm=I=-16:TP=-1.5,pan=stereo|c0=c0|c1=c0,asplit=2[v1][v2];[0:a]volume=1.9[m];[m][v1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[d];[d][v2]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.93,volume=-3.2dB[a]" -map "[a]" -t 60 mix.wav
ffmpeg -framerate 60 -i frames/f%04d.jpg -i mix.wav -i projects/buraimi-fintech/Buraimi-FinTech.srt -map 0:v -map 1:a -map 2:0 -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -c:s mov_text -t 60 -movflags +faststart Buraimi-FinTech.mp4
```

## What was checked, and what was not
- Checked: the MP4 is 60.000 s, 3600 frames, H.264 1920x1080 at 60 fps, AAC audio at about -16 LUFS, one Arabic subtitle track. Sampled frames from every scene were inspected for overlaps and Arabic shaping.
- The delivered MP4 was rendered with `render.mjs`, not Remotion. `index.jsx` has not been run.
- The delivered render used a Tajawal subset without OpenType shaping, so text was pre-shaped and a few words were chosen to stay inside that subset ("القيمة" for "المبلغ", "الماء" for "المياه"). With the full Tajawal files these can be changed back in `film.js`.
- The narration is a synthetic voice (ar-OM-AbdullahNeural). Nobody has listened to this mix; pronunciation, dialect and the timing of words against the animation need a review by an Omani speaker before publishing.
- The QR pattern is decorative and does not scan. Amounts, names and the bank screen are illustrative.
- Logo usage should be confirmed against each owner's brand guidelines.
