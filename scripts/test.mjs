import test from 'node:test';import assert from 'node:assert/strict';import {sceneSVG,FRAMES,FPS} from '../src/scene.mjs';
test('frame count and scene boundaries',()=>{assert.equal(FRAMES/FPS,15);for(const [f,s] of [[0,'أمانك الرقمي'],[150,'لا تشارك'],[300,'تحقّق']])assert.ok(sceneSVG(f).includes(s))});
test('deterministic, valid numeric frame output',()=>{for(let f=0;f<FRAMES;f++){const svg=sceneSVG(f);assert.equal(svg,sceneSVG(f));assert.ok(svg.startsWith('<svg'));assert.ok(svg.endsWith('</svg>'));assert.ok(!svg.includes('NaN'))}});
