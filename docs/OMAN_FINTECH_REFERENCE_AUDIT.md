# Oman FinTech — catalog inspection

The Motion Art Director workflow was read before production. Reference content was inspected using GitHub's repository APIs because the local container could not clone GitHub repositories or install npm packages. Full library checkout was not performed; the cloud render installed the studio's actual Remotion/React dependencies.

| Catalog reference | Actual inspected material | Production decision |
| --- | --- | --- |
| Remotion | [fade.tsx](https://github.com/remotion-dev/remotion/blob/main/packages/transitions/src/presentations/fade.tsx): incoming opacity and exit behavior | Frame-deterministic 18-frame overlapping dissolves; original scene composition |
| Remotion skills | [README](https://github.com/remotion-dev/skills) | Follow frame-based rendering and Arabic text guidance in the existing studio |
| Motion Canvas | [Rect.ts](https://github.com/motion-canvas/motion-canvas/blob/main/packages/2d/src/lib/components/Rect.ts): rounded rectangles and corner smoothing | Original SVG illustrations; alternative engine not necessary |
| Remotion Scenes | [TransitionLiquidMorph](https://github.com/lifeprompt-team/remotion-scenes/blob/main/src/scenes/TransitionAnimations/TransitionLiquidMorph.tsx) and [EffectFilmGrain](https://github.com/lifeprompt-team/remotion-scenes/blob/main/src/scenes/EffectAnimations/EffectFilmGrain.tsx), MIT license | Studied time-varying wave paths and seeded grain; no code or artwork copied into this edition |
| Lottie | [Adrock animation JSON](https://github.com/airbnb/lottie-web/blob/master/demo/adrock/data.json): 690x913, 30fps, frames 0–392, independent arm/leg layers, opacity/rotation/position/anchor/scale | Useful reference for articulated movement; unrelated artwork excluded |
| Lucide | [shield-check.svg](https://github.com/lucide-icons/lucide/blob/main/icons/shield-check.svg) | Original illustrated shield used, no imported icon |
| Anime.js | [seamless timeline example](https://github.com/juliangarnier/anime/blob/master/examples/timeline-seamless-loop/index.js): periodic stagger, position and scale | Original continuous sine-based parallax |
| GSAP | [repository README](https://github.com/greensock/GSAP) | Alternative SVG timelines; not needed in the Remotion composition |

All shipped illustrations are original vector drawings, not third-party stock. No source or animation assets from the reference repositories are redistributed. Full catalog imports require a connected development environment and license review. The current edition uses simple layered character movement and dissolves rather than fully articulated character rigs and advanced liquid morphs.
