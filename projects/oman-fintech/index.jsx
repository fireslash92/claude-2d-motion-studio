import React from 'react';
import {AbsoluteFill, Audio, Composition, Img, Sequence, registerRoot, staticFile, useCurrentFrame} from 'remotion';
const W=1920,H=1080,STEP=297,LENGTH=315;
const Layer=({name,style={}})=><Img src={staticFile(name+'.png')} style={{position:'absolute',width:W,height:H,left:0,top:0,...style}}/>;
const Scene=({i})=>{const f=useCurrentFrame(),t=f/30;const alpha=i===0?1:Math.min(1,f/18);return <AbsoluteFill style={{opacity:alpha,overflow:'hidden'}}><Layer name={'bg'+i} style={{width:1960,height:1102,left:-(20+18*Math.sin(t*.5)),top:-11}}/><Layer name={'fg'+i} style={{transform:'translate('+15*Math.sin(t*.7)+'px,'+(-8*Math.sin(t*1.4))+'px)'}}/><Layer name={'device'+i} style={{transform:'translate('+12*Math.sin(t*1.1)+'px,'+(-24*Math.sin(t*1.6))+'px)'}}/><Layer name={'text'+i}/></AbsoluteFill>};
export const Film=()=> <AbsoluteFill style={{background:'#122C40'}}>{Array.from({length:6},(_,i)=><Sequence key={i} from={i*STEP} durationInFrames={LENGTH}><Scene i={i}/></Sequence>)}<Audio src={staticFile('sound.wav')}/></AbsoluteFill>;
registerRoot(()=> <Composition id="OmanFinTech" component={Film} width={W} height={H} fps={30} durationInFrames={1800}/>);
