// Remotion entry for the same film: every frame comes from renderFrame() in film.js.
// Not yet rendered through Remotion; the delivered MP4 was produced with render.mjs (see README).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Img, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {renderFrame, W, H, FPS, FRAMES} from './film.js';
const Film = () => {
  const {svg, logos} = renderFrame(useCurrentFrame());
  return (
    <AbsoluteFill style={{background: '#F3F6FB'}}>
      <div dangerouslySetInnerHTML={{__html: svg}} />
      <div style={{position: 'absolute', left: 44, top: 30, height: 132, padding: '0 30px', borderRadius: 34, background: '#fff', boxShadow: '0 10px 28px rgba(31,42,92,.14)', display: 'flex', alignItems: 'center', gap: 26, opacity: logos.lockup, transform: `translateY(${(1 - logos.lockup) * -30}px)`}}>
        <Img src={staticFile('logo-buraimi.png')} style={{height: 108}} />
        <i style={{width: 2, height: 76, background: '#D5DEEC'}} />
        <Img src={staticFile('logo-tahawul.png')} style={{height: 64}} />
      </div>
      <div style={{position: 'absolute', left: 260, top: 220, width: 1400, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row-reverse', opacity: logos.end, transform: `scale(${logos.endScale})`}}>
        <Img src={staticFile('logo-buraimi.png')} style={{height: 236}} />
        <Img src={staticFile('logo-tahawul.png')} style={{height: 190}} />
      </div>
      <Audio src={staticFile('soundtrack.m4a')} />
    </AbsoluteFill>
  );
};
registerRoot(() => <Composition id="BuraimiFinTech" component={Film} width={W} height={H} fps={FPS} durationInFrames={FRAMES} />);
