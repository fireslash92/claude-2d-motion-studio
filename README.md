# Claude 2D Motion Studio
A source-first starter for professional 2D motion design, including a 15-second Arabic digital-safety SVG demo, a shared frame-based Remotion renderer and a responsive browser preview. Includes a curated repository catalog, opt-in importer, Claude art-director skill, tests and cloud render workflow. This is a scaffold, not a complete stock-asset bundle or a rendered MP4.

## Start
```bash
npm install
npm test
npm run studio
npm run render
```
Browser preview: `npm run preview`. Build it with `npm run build:preview`; deploy `dist/` to static hosting. For phone-only use, publish this repository then open a GitHub Codespace or run the included GitHub Actions workflow to render and download MP4. See `docs/WORKFLOW.md`.

## Publish to your own GitHub account
In a cloud terminal with GitHub CLI installed and authenticated, from this folder:
```bash
git init -b main
git add .
git commit -m 'Create 2D motion studio'
gh repo create claude-2d-motion-studio --private --source=. --remote=origin --push
```
Use `--public` instead only if you want public source. Review `catalog.json` and all upstream license terms; no external repository files are bundled. Sample has no voiceover and is a starter visual, not a final production.
