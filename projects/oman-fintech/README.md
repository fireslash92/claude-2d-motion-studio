# Oman FinTech | التقنية المالية في عُمان

A 60-second original vector motion film in six scenes, 1920x1080 at 30fps. Native artwork, Arabic Noto typography, independent character/device parallax, original instrumental sound design. Original studio starter remains unchanged.

## Build and render
From the repository root:
```sh
npm install
python -m pip install pillow numpy cairosvg
python projects/oman-fintech/build.py
npx remotion render projects/oman-fintech/index.jsx OmanFinTech out/oman-fintech.mp4 --public-dir=projects/oman-fintech/assets
```
Install Noto Sans Arabic fonts at the paths in build.py and Cairo system dependencies first. The generator is ordinary editable Python. It produces original layered SVG and native-size PNG artwork, shaped Arabic text and a WAV sound bed. No external artwork is redistributed.

## Narration (optional online production step)
```sh
python -m pip install edge-tts
python projects/oman-fintech/voiceover.py
cp projects/oman-fintech/assets/narrated.wav projects/oman-fintech/assets/sound.wav
```
Use the above before Remotion render. The voice is a synthetic ar-OM-AbdullahNeural voice, not a verified human narrator. Review the pronunciation and timing with an Omani speaker; record a human voice if preferred. The script rejects oversized cues rather than allowing them to collide.

## QA / limitations
The delivered offline visual MP4 was actually rendered with FFmpeg using the same layer timing and checked: 60.000 seconds, 1920x1080 H.264, 30 fps, 1800 frames, AAC 48 kHz. Corrected a missing ellipsis glyph and separated device animation. Actual Omani narration, advanced articulated character animation/morphing, external catalog imports, Remotion cloud rendering and iPhone hardware playback have not been verified. Remotion composition is provided as the primary online pipeline. Check license terms before organizational deployment.
