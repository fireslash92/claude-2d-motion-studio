import React from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame} from 'remotion';
import {sceneSVG,FPS,WIDTH,HEIGHT,FRAMES} from './scene.mjs';
function OmanExplainer(){const frame=useCurrentFrame();return <AbsoluteFill style={{background:'#102b35'}}><div style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:sceneSVG(frame)}}/></AbsoluteFill>}
function Root(){return <Composition id="OmanExplainer" component={OmanExplainer} durationInFrames={FRAMES} fps={FPS} width={WIDTH} height={HEIGHT}/>}
registerRoot(Root);
