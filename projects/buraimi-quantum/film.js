// الحوسبة الكمية في دقيقة — محافظة البريمي
// A deterministic film: frame number in, SVG markup out. No wall-clock time, no dependencies.
// 1920x1080, 60 fps, 3600 frames. The same function drives the local renderer, the preview page and Remotion.
export const W = 1920, H = 1080, FPS = 60, FRAMES = 3600;

/* ---------- palette (Tahawul + Al Buraimi identity) ---------- */
const C = {
  bg: '#F3F6FB', ink: '#1F2A5C', body: '#3A4568', mute: '#7C88A6', line: '#D5DEEC', card: '#FFFFFF', soft: '#EEF3FA',
  indigo: '#526AB2', teal: '#139ABC', cyan: '#42B1C7', magenta: '#A85299', green: '#3FB487', gold: '#E9B44C', goldD: '#C98F2B',
  skin: '#C98F63', skinD: '#B37A50', skinW: '#D6A27C', hair: '#2A2320', navy: '#1F2A5C',
};
const TINT = ['#DDE6F6', '#D6EEF5', '#E7E1F4', '#DDE6F6', '#DCF2E8', '#F5E1EF', '#E4ECF8'];

/* ---------- timing ---------- */
export const SCENES = [
  { id: 'intro', start: 0, end: 300 },
  { id: 'qubit', start: 300, end: 900, n: 1, title: 'الكيوبت', def: ['وحدة المعلومات', 'في الحاسوب الكمي.'],
    steps: [['البت العادي: 0 أو 1', 120], ['الكيوبت: 0 و 1 معًا', 330], ['عند القياس يصير 0 أو 1', 496]], result: ['هذا هو التراكب', 540] },
  { id: 'ent', start: 900, end: 1500, n: 2, title: 'التشابك', def: ['ارتباط خاص بين كيوبتين،', 'مهما ابتعدا.'],
    steps: [['نربط كيوبتين معًا', 124], ['نقيس الأول', 336], ['فنعرف حالة الثاني فورًا', 420]], result: ['هذا هو التشابك', 480] },
  { id: 'calc', start: 1500, end: 2100, n: 3, title: 'كيف يحسب', def: ['يتعامل مع احتمالات كثيرة', 'في الوقت نفسه.'],
    steps: [['العادي يجرّب طريقًا بعد طريق', 126], ['الكمي يأخذ كل الطرق معًا', 330], ['ثم يقوّي الجواب الصحيح', 450]], result: ['أسرع في مسائل معيّنة', 520] },
  { id: 'uses', start: 2100, end: 2700, n: 4, title: 'أين ينفع', def: ['في المسائل المعقدة جدًا.'],
    steps: [['اكتشاف الأدوية والمواد', 120], ['تنظيم الطرق والشحن', 330], ['حماية البيانات', 450]], result: ['حلول لمسائل معقدة', 500] },
  { id: 'status', start: 2700, end: 3240, n: 5, title: 'أين وصلنا', def: ['تقنية ما زالت في بدايتها.'],
    steps: [['تعمل في برودة شديدة', 96], ['ما زالت في المختبرات', 215], ['تكمّل حاسوبك ولا تستبدله', 320]], result: ['علم اليوم، تقنية الغد', 440] },
  { id: 'outro', start: 3240, end: 3600 },
];

/* ---------- math ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const tw = (f, a, b) => clamp((f - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = t => { const c = 1.70158; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const n2 = x => Math.round(x * 100) / 100;
const sin = Math.sin, cos = Math.cos, PI = Math.PI, rad = d => d * PI / 180;
const blink = f => { const p = (f + 30) % 190; return p < 8 ? 1 - .9 * sin(PI * p / 8) : 1; };
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };

/* ---------- drawing primitives ---------- */
let OPT = { shape: null, faux: false };
const rect = (x, y, w, h, r, fill, x2 = '') => `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${r}" fill="${fill}" ${x2}/>`;
const circ = (x, y, r, fill, x2 = '') => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${fill}" ${x2}/>`;
const path = (d, fill, x2 = '') => `<path d="${d}" fill="${fill}" ${x2}/>`;
const stroke = (c, w) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const g = (inner, tr = '', op = 1) => op <= 0.001 ? '' : `<g${tr ? ` transform="${tr}"` : ''}${op < 1 ? ` opacity="${n2(op)}"` : ''}>${inner}</g>`;
const at = (x, y, s, inner, op = 1, rot = 0) => g(inner, `translate(${n2(x)} ${n2(y)})${rot ? ` rotate(${n2(rot)})` : ''}${s !== 1 ? ` scale(${n2(s)})` : ''}`, op);
// Arabic text: whole lines only, right-to-left. anchor: 'r' right edge at x, 'm' centred, 'l' left edge at x.
function tx(str, x, y, size, o = {}) {
  const s = OPT.shape ? OPT.shape(str) : str, fill = o.fill || C.ink, bold = !!o.bold;
  const anchor = o.anchor === 'm' ? 'middle' : o.anchor === 'l' ? 'end' : 'start';
  const weight = bold ? (OPT.faux ? `font-weight="400" stroke="${fill}" stroke-width="${n2(size * .028)}" stroke-linejoin="round"` : 'font-weight="700"') : 'font-weight="400"';
  return `<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" direction="rtl" ${weight}>${s}</text>`;
}
// Latin / digits, left-to-right
const num = (str, x, y, size, o = {}) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" fill="${o.fill || C.ink}" text-anchor="${o.anchor === 'm' ? 'middle' : o.anchor === 'r' ? 'end' : 'start'}" font-weight="${o.bold ? 700 : 400}" font-family="Lat, Tajawal, sans-serif" direction="ltr">${str}</text>`;
const check = (x, y, s, color, p = 1, w = 9) => `<path d="M${n2(x - 16 * s)} ${n2(y)} L${n2(x - 4 * s)} ${n2(y + 12 * s)} L${n2(x + 18 * s)} ${n2(y - 13 * s)}" fill="none" ${stroke(color, w)} pathLength="1" stroke-dasharray="1" stroke-dashoffset="${n2(1 - p)}"/>`;
const cross = (x, y, s, color, w = 9) => `<path d="M${x - 14 * s} ${y - 14 * s}L${x + 14 * s} ${y + 14 * s}M${x + 14 * s} ${y - 14 * s}L${x - 14 * s} ${y + 14 * s}" fill="none" ${stroke(color, w)}/>`;
const ripple = (x, y, p, color = C.teal, R = 60) => p <= 0 || p >= 1 ? '' : circ(x, y, 8 + R * eo(p), 'none', `${stroke(color, 6 * (1 - p) + 1)} opacity="${n2(1 - p)}"`);
function waves(x, y, dirDeg, f, f0, color = C.teal) {           // three contactless arcs, each living 36 frames
  let s = '';
  for (let k = 0; k < 3; k++) { const p = tw(f, f0 + k * 14, f0 + k * 14 + 36); if (p <= 0 || p >= 1) continue;
    const r = 26 + 70 * eo(p), a0 = rad(dirDeg - 38), a1 = rad(dirDeg + 38);
    s += `<path d="M${n2(x + r * cos(a0))} ${n2(y + r * sin(a0))} A${n2(r)} ${n2(r)} 0 0 1 ${n2(x + r * cos(a1))} ${n2(y + r * sin(a1))}" fill="none" ${stroke(color, 8)} opacity="${n2(1 - p)}"/>`; }
  return s;
}
const coin = (x, y, r = 26) => circ(x, y + 3, r, C.goldD) + circ(x, y, r, C.gold) + circ(x, y, r * .68, 'none', stroke('#F6D58A', 3)) + num('﷼'.length ? 'R' : '', x, y + r * .3, r * .9, { anchor: 'm', bold: 1, fill: C.goldD });
function pill(x, y, label, p, o = {}) {                            // success / info toast, pops about its centre
  if (p <= 0) return ''; const w = o.w || 300, h = o.h || 72, col = o.color || C.green;
  const inner = rect(-w / 2, -h / 2, w, h, h / 2, col) + (o.icon === 'x' ? cross(w / 2 - 44, 0, .7, '#fff', 7) : o.icon === 'none' ? '' : check(w / 2 - 44, 0, .8, '#fff', 1, 7)) +
    (o.num ? num(o.num, -w / 2 + 34, 12, 34, { fill: '#fff', bold: 1 }) : '') + tx(label, w / 2 - (o.icon === 'none' ? 34 : 78), 13, o.size || 36, { fill: '#fff', bold: 1 });
  return at(x, y, .6 + .4 * back(p), inner, clamp(p * 3));
}
const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n2(rx * .13)}" fill="#1F2A5C" opacity=".10"/>`;

/* ---------- people (flat, articulated: shoulders, elbows, blink) ---------- */
const L1 = 118, L2 = 104, SH = { x: 76, y: 172 };
function armSVG(a, b, sleeve, sleeveLine, skin, held = '') {
  return `<g transform="rotate(${n2(a)})">${rect(-25, -20, 50, L1 + 26, 25, sleeve, stroke(sleeveLine, 3))}<g transform="translate(0 ${L1}) rotate(${n2(b)})">${rect(-22, -16, 44, L2 + 6, 22, sleeve, stroke(sleeveLine, 3))}${circ(0, L2 + 4, 22, skin)}${held}</g></g>`;
}
const heldPhone = (rot = 0, screen = C.cyan) => `<g transform="translate(0 ${L2 + 2}) rotate(${rot})">${rect(-34, -104, 68, 120, 13, C.navy)}${rect(-28, -96, 56, 100, 8, screen)}${circ(-24, 2, 11, C.skin)}</g>`;
// world position of a hand (or a point `ext` further along the forearm)
function hand(p, side, ext = 0) {
  const sgn = side === 'R' ? 1 : -1, a = rad(p[side][0]), b = rad(p[side][0] + p[side][1]);
  const lx = sgn * SH.x - L1 * sin(a) - (L2 + 4 + ext) * sin(b), ly = SH.y + L1 * cos(a) + (L2 + 4 + ext) * cos(b);
  return [p.x + p.s * lx, p.y + p.s * (ly - 520)];
}
// p: {x, y (feet), s, R:[shoulder°, elbow°], L:[..], f, kind:'man'|'woman', k1,k2 (kumma colours), heldR, heldL, bob}
function person(p) {
  const f = p.f || 0, bl = blink(f + (p.seed || 0)), woman = p.kind === 'woman', skin = woman ? C.skinW : C.skin;
  const sleeve = woman ? '#2B3358' : '#FFFFFF', sLine = woman ? '#1F2748' : '#CBD3E1';
  const armR = g(armSVG(p.R[0], p.R[1], sleeve, sLine, skin, p.heldR || ''), `translate(${SH.x} ${SH.y})`);
  const armL = g(armSVG(p.L[0], p.L[1], sleeve, sLine, skin, p.heldL || ''), `translate(${-SH.x} ${SH.y})`);
  const eyes = `<ellipse cx="-20" cy="76" rx="5.5" ry="${n2(6.5 * bl)}" fill="#1E2233"/><ellipse cx="20" cy="76" rx="5.5" ry="${n2(6.5 * bl)}" fill="#1E2233"/>`;
  let body, head;
  if (!woman) {
    body = rect(-74, 500, 60, 22, 11, '#6B4A35') + rect(14, 500, 60, 22, 11, '#6B4A35') +
      path('M-70 152 Q0 134 70 152 Q92 162 96 202 L118 506 Q0 520 -118 506 L-96 202 Q-92 162 -70 152Z', '#FFFFFF', stroke('#CBD3E1', 3)) +
      path('M0 150 L0 312', 'none', stroke('#DCE2EC', 3)) + path('M8 154 Q20 180 18 214', 'none', stroke('#BAC3D6', 3)) + path('M18 212 q-7 12 0 22 q7 -10 0 -22Z', '#BAC3D6');
    head = rect(-20, 118, 40, 44, 10, C.skinD) + circ(-55, 84, 10, C.skin) + circ(55, 84, 10, C.skin) + `<ellipse cx="0" cy="80" rx="54" ry="60" fill="${C.skin}"/>` +
      path('M-53 82 Q-52 142 0 146 Q52 142 53 82 Q40 108 0 110 Q-40 108 -53 82Z', C.hair) + path('M-22 104 Q0 96 22 104 Q0 116 -22 104Z', C.hair) + path('M-11 118 Q0 124 11 118', 'none', stroke('#F3E3D0', 3)) +
      eyes + path('M-29 62 Q-20 57 -11 62 M11 62 Q20 57 29 62', 'none', stroke(C.hair, 3.5)) +
      path('M-57 54 L-57 22 Q-57 -4 0 -6 Q57 -4 57 22 L57 54 Q0 64 -57 54Z', '#F6F1E7', stroke('#CFC5AE', 3)) +
      path('M-55 16 Q0 6 55 16 M-56 48 Q0 58 56 48', 'none', stroke(p.k1 || C.indigo, 3.5)) +
      [-42, -28, -14, 0, 14, 28, 42].map((x, i) => path(`M${x} 23 l7 9 l-7 9 l-7 -9Z`, i % 2 ? (p.k2 || C.magenta) : (p.k1 || C.indigo))).join('');
  } else {
    body = rect(-62, 504, 50, 18, 9, '#1A2040') + rect(12, 504, 50, 18, 9, '#1A2040') +
      path('M-66 152 Q0 132 66 152 Q96 166 102 216 L132 508 Q0 524 -132 508 L-102 216 Q-96 166 -66 152Z', '#2B3358') +
      path('M-26 150 L-44 510 L44 510 L26 150Z', '#343E6B') + path('M-112 470 Q0 486 112 470', 'none', stroke(p.k1 || C.magenta, 4));
    head = path('M-62 82 Q-64 6 0 4 Q64 6 62 82 Q66 132 86 170 Q0 192 -86 170 Q-66 132 -62 82Z', '#1F2748') + `<ellipse cx="0" cy="84" rx="41" ry="47" fill="${skin}"/>` +
      path('M-41 70 Q-30 34 0 36 Q30 34 41 70 Q20 48 0 50 Q-20 48 -41 70Z', '#2B3358') + eyes + path('M-28 64 Q-20 60 -12 64 M12 64 Q20 60 28 64', 'none', stroke('#3A2A26', 3)) + path('M-12 104 Q0 113 12 104', 'none', stroke('#9A4F49', 3.5));
  }
  const bob = (p.bob ?? 1) * 2.2 * sin(f / 38 + (p.seed || 0)), tilt = p.tilt || 0;
  return shadow(p.x, p.y + 6, 120 * p.s) + g(armL + body + g(head, `rotate(${n2(tilt)} 0 130)`) + armR, `translate(${n2(p.x)} ${n2(p.y + bob)}) scale(${p.s}) translate(0 -520)`);
}
const arm2 = (f, keys) => {                                         // keyframed [frame, shoulder°, elbow°], eased
  let i = 0; while (i < keys.length - 2 && f >= keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], u = eio(tw(f, a[0], b[0]));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
};

/* ---------- devices and props ---------- */
function phone(x, y, s, inner, rot = 0) {                           // 300 x 600 body, screen origin at (12,12), 276 x 576
  return at(x, y, s, `<rect x="6" y="14" width="300" height="600" rx="48" fill="#1F2A5C" opacity=".12"/>` + rect(0, 0, 300, 600, 48, C.navy) + rect(12, 12, 276, 576, 37, '#F7FAFE') + rect(108, 24, 84, 14, 7, C.navy) + g(inner, 'translate(12 12)'), 1, rot);
}
const pos = (x, y, s, state, amt) => at(x, y, s,                    // card terminal, base centred at (0,0)
  rect(-58, -168, 116, 168, 18, '#2A335A') + rect(-46, -154, 92, 62, 9, state === 'ok' ? C.green : state === 'wait' ? '#E8F5FA' : '#E4EAF4') +
  (state === 'ok' ? check(0, -123, 1.1, '#fff', 1, 9) : num(amt, 0, -112, 30, { anchor: 'm', bold: 1, fill: state === 'wait' ? C.teal : C.body })) +
  [0, 1, 2].map(r => [0, 1, 2].map(c => circ(-28 + c * 28, -70 + r * 22, 7, '#59648E')).join('')).join(''));
function cup(x, y, f) {                                             // karak cup with steam
  const st = k => `<path d="M${-14 + k * 14} ${-104 - 6 * sin(f / 16 + k)} q10 -14 0 -28 q-10 -14 0 -28" fill="none" ${stroke('#B9C6DC', 5)} opacity="${n2(.45 + .3 * sin(f / 20 + k * 2))}"/>`;
  return at(x, y, 1, st(0) + st(1) + st(2) + path('M-34 -92 L34 -92 L26 0 L-26 0Z', '#FFFFFF', stroke('#CBD3E1', 3)) + path('M-32 -70 L32 -70 L29 -40 L-29 -40Z', C.magenta) + rect(-38, -100, 76, 14, 7, '#E7ECF5'));
}
function qr(x, y, size) {                                           // deterministic QR-like pattern (decorative, not a real code)
  const n = 11, c = size / n; let s = rect(x - 10, y - 10, size + 20, size + 20, 12, '#fff', stroke(C.line, 3)), seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const finder = (i, j) => (i < 3 && j < 3) || (i >= n - 3 && j < 3) || (i < 3 && j >= n - 3);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const on = finder(i, j) ? !((i % (n - 3) === 1) && (j % (n - 3) === 1)) || true : rnd() > .52;
    if (finder(i, j)) { const li = i >= n - 3 ? i - (n - 3) : i, lj = j >= n - 3 ? j - (n - 3) : j; if (li === 1 && lj === 1 ? true : (li === 0 || li === 2 || lj === 0 || lj === 2)) s += rect(x + i * c, y + j * c, c + .5, c + .5, 0, C.navy); }
    else if (on) s += rect(x + i * c, y + j * c, c + .5, c + .5, 0, C.navy); }
  return s;
}
/* small pictograms in a 100 box, centred */
const ICON = {
  qb: c => circ(0, 0, 38, 'none', stroke(c, 7)) + `<ellipse cx="0" cy="0" rx="38" ry="13" fill="none" ${stroke(c, 5)}/><path d="M0 0 L20 -26 M20 -26 h-13 M20 -26 v13" fill="none" ${stroke(c, 7)}/>`,
  ent: c => circ(-30, 0, 15, 'none', stroke(c, 7)) + circ(30, 0, 15, 'none', stroke(c, 7)) + `<path d="M-15 0 q7.5 -16 15 0 t15 0" fill="none" ${stroke(c, 6)}/>`,
  calc: c => `<path d="M38 0 H8 M8 0 L-14 -26 H-38 M8 0 L-14 26 H-38 M8 0 H-38" fill="none" ${stroke(c, 7)}/>` + circ(38, 0, 8, c),
  app: c => [[-34, -34], [6, -34], [-34, 6], [6, 6]].map(([x, y]) => rect(x, y, 28, 28, 8, 'none', stroke(c, 7))).join(''),
  fut: c => `<path d="M-40 34 L-12 4 L8 20 L40 -30 M40 -30 H16 M40 -30 V-6" fill="none" ${stroke(c, 8)}/>`,
};
const ICON_OF = ['qb', 'ent', 'calc', 'app', 'fut'], ICON_COL = [C.teal, C.magenta, C.indigo, C.green, C.indigo];

/* ---------- right-hand explanation panel ---------- */
const PX = 1110, PW = 750, PR = PX + PW - 56;                       // text right edge
function panel(f, sc) {
  const lf = f - sc.start, out = 1 - tw(f, sc.end - 22, sc.end - 4);
  const inn = (d, len = 24) => eo(tw(lf, d, d + len));
  const row = (inner, p, y) => g(inner, `translate(${n2((1 - p) * 60)} ${y})`, p * out);
  let s = '';
  // chip: scene number + pictogram
  s += row(rect(PR - 150, -34, 150, 68, 34, ICON_COL[sc.n - 1]) + num(`${sc.n} / 5`, PR - 100, 13, 34, { anchor: 'm', bold: 1, fill: '#fff' }) + at(PR - 34, 0, .42, ICON[ICON_OF[sc.n - 1]]('#fff')), inn(4), 232);
  s += row(tx(sc.title, PR, 0, sc.title.length > 14 ? 80 : 92, { bold: 1 }), inn(10), 362);
  sc.def.forEach((l, i) => { s += row(tx(l, PR, 0, 44, { fill: C.body }), inn(22 + i * 8), 438 + i * 58); });
  const y0 = sc.def.length > 1 ? 580 : 540;
  sc.steps.forEach(([label, a], i) => {
    const p = eo(tw(lf, a, a + 22)); if (p <= 0) return;
    const nextAt = i + 1 < sc.steps.length ? sc.steps[i + 1][1] : Infinity, doneAt = Math.min(nextAt, 1e9);
    const done = tw(lf, doneAt, doneAt + 14), active = 1 - done;
    const bgc = mixHex('#F1F5FA', '#DFF3F8', active), ring = mixHex('#F1F5FA', C.teal, active);
    s += row(rect(PX + 50, -40, PW - 100, 80, 22, bgc, stroke(ring, 3)) + circ(PR - 34, 0, 26, mixHex(C.indigo, C.green, done)) +
      (done > .5 ? check(PR - 34, 0, .62, '#fff', tw(done, .5, 1), 6) : num(String(i + 1), PR - 34, 12, 32, { anchor: 'm', bold: 1, fill: '#fff' })) +
      tx(label, PR - 78, 14, 42, { fill: C.ink, bold: active > .5 }), p, y0 + i * 96);
  });
  const rp = tw(lf, sc.result[1], sc.result[1] + 22);
  if (rp > 0) s += g(at(PX + PW / 2, y0 + 3 * 96 + 8, .7 + .3 * back(rp), rect(-PW / 2 + 50, -44, PW - 100, 88, 44, C.green) + check(PW / 2 - 96, 0, .85, '#fff', tw(rp, .3, 1), 8) + tx(sc.result[0], PW / 2 - 134, 15, 44, { fill: '#fff', bold: 1 })), '', clamp(rp * 3) * out);
  return s;
}

/* ---------- scenes: the illustration on the left (x 40..1060, ground y 860) ---------- */
const GY = 860;
// a microchip, centred at (0,0); `size` is the body edge
function chipG(size, o = {}) {
  const h = size / 2, n = o.pins || 5, pl = size * .13, pw = size * .07; let pins = '';
  for (let i = 0; i < n; i++) { const p = -h + size * (i + .5) / n - pw / 2;
    pins += rect(p, -h - pl, pw, pl + 4, pw / 3, '#9FB0DA') + rect(p, h - 4, pw, pl + 4, pw / 3, '#9FB0DA') + rect(-h - pl, p, pl + 4, pw, pw / 3, '#9FB0DA') + rect(h - 4, p, pl + 4, pw, pw / 3, '#9FB0DA'); }
  return pins + rect(-h, -h, size, size, size * .14, C.navy) + rect(-h * .62, -h * .62, size * .62, size * .62, size * .08, o.core || C.indigo) + circ(-h * .74, -h * .74, size * .035, '#9FB0DA') + (o.inner || '');
}
const DEV = {
  phone: c => rect(-26, -46, 52, 92, 12, 'none', stroke(c, 7)) + path('M-8 32 h16', 'none', stroke(c, 6)),
  laptop: c => rect(-40, -34, 80, 52, 8, 'none', stroke(c, 7)) + path('M-54 32 H54', 'none', stroke(c, 8)),
  car: c => path('M-50 14 V-4 Q-48 -10 -40 -12 L-28 -34 H22 L40 -12 Q50 -10 50 0 V14 Z', 'none', stroke(c, 7)) + circ(-28, 18, 11, '#fff', stroke(c, 7)) + circ(28, 18, 11, '#fff', stroke(c, 7)),
  med: c => rect(-46, -36, 92, 64, 10, 'none', stroke(c, 7)) + path('M-34 -4 h16 l8 -18 l12 36 l8 -18 h18 M-20 42 H20', 'none', stroke(c, 6)),
  solar: c => path('M-44 26 L-28 -22 H28 L44 26 Z M-36 2 H36 M-10 -22 L-14 26 M10 -22 L14 26', 'none', stroke(c, 6)) + circ(40, -40, 9, c),
};
const ATOM = (c, w = 6) => circ(0, 0, 9, c) + [0, 60, -60].map(a => `<ellipse cx="0" cy="0" rx="42" ry="16" fill="none" ${stroke(c, w)} transform="rotate(${a})"/>`).join('');
// a coin that carries one bit. sx: horizontal squash (1 flat-on, 0 edge-on); d: digit on the visible face
function coinBit(x, y, R, d, sx = 1, glow = 0) {
  const col = d === '1' ? C.green : C.indigo, k = Math.max(.07, Math.abs(sx));
  return (glow > 0 ? circ(x, y, R * 1.35, C.cyan, `opacity="${n2(.22 * glow)}"`) : '') + `<ellipse cx="${x}" cy="${n2(y + R + 22)}" rx="${n2(R * .8 * (.5 + .5 * k))}" ry="12" fill="#1F2A5C" opacity=".10"/>` +
    g(circ(0, 6, R, mixHex(col, '#000000', .25)) + circ(0, 0, R, col) + circ(0, 0, R * .8, 'none', stroke('#ffffff', 4) + ' opacity=".45"') + (k > .35 ? num(d, 0, R * .38, R * 1.1, { anchor: 'm', bold: 1, fill: '#fff' }) : ''), `translate(${x} ${y}) scale(${n2(k)} 1)`);
}
// a spinning qubit: both faces at once, with 0 and 1 orbiting it
function coinSpin(x, y, R, t, phase = 0) {
  const a = t / 8 + phase, sx = cos(a), d = sx >= 0 ? '0' : '1';
  let s = coinBit(x, y, R, d, sx, .6 + .4 * sin(t / 11));
  [['0', 0], ['1', PI]].forEach(([dg, off]) => { const o = t / 26 + off + phase; s += at(x + (R + 54) * cos(o), y + (R * .5) * sin(o) - 4, .8 + .2 * sin(o), circ(0, 0, 24, dg === '1' ? C.green : C.indigo, 'opacity=".9"') + num(dg, 0, 11, 30, { anchor: 'm', bold: 1, fill: '#fff' }), .55 + .45 * (.5 + .5 * sin(o))); });
  return s;
}
const tag = (x, y, t, p, col = '#fff', fill = C.ink) => p <= 0 ? '' : at(x, y, .7 + .3 * back(p), rect(-120, -32, 240, 64, 32, col, col === '#fff' ? stroke(C.line, 3) : '') + tx(t, 0, 13, 34, { anchor: 'm', bold: 1, fill }), clamp(p * 3));
const measureBtn = (x, y, p, pressed) => p <= 0 ? '' : at(x, y, (.7 + .3 * back(p)) * (pressed ? .92 : 1), rect(-92, -36, 184, 72, 36, pressed ? C.magenta : '#fff', pressed ? '' : stroke(C.magenta, 4)) + circ(52, -3, 15, 'none', stroke(pressed ? '#fff' : C.magenta, 6)) + path('M62 8 L74 20', 'none', stroke(pressed ? '#fff' : C.magenta, 7)) + tx('قياس', 24, 13, 34, { bold: 1, fill: pressed ? '#fff' : C.magenta }), clamp(p * 3));

function scIntro(f, lf) {
  const wave = arm2(lf, [[0, -8, -6], [40, -150, -30], [280, -150, -30], [300, -40, -20]]); wave[1] += lf > 40 && lf < 280 ? 22 * sin((lf - 40) / 9) : 0;
  const man = { x: 430, y: GY, s: 1.22, f, R: wave, L: [18, -118], heldL: `<g transform="translate(0 ${L2 - 30})">${circ(0, 0, 40, '#fff')}${g(ATOM(C.magenta, 5), 'scale(.78)')}</g>` };
  const tiles = [['qb', 150, 300, 70], ['ent', 760, 250, 95], ['calc', 820, 520, 120], ['app', 120, 560, 145], ['fut', 640, 720, 170]];
  let s = '';
  tiles.forEach(([k, x, y, a], i) => { const p = tw(lf, a, a + 24); if (p <= 0) return;
    s += at(x, y + 8 * sin(f / 40 + i), .5 + .5 * back(p), rect(-62, -62, 124, 124, 30, '#fff', `filter="url(#sh)"`) + at(0, 0, .78, ICON[k](ICON_COL[ICON_OF.indexOf(k)])), clamp(p * 3)); });
  return s + person(man);
}

// 1. bit versus qubit: a coin lying flat, and a coin that spins until we look
function scQubit(f, lf) {
  const man = { x: 150, y: GY, s: .82, f, R: arm2(lf, [[0, -8, -6], [100, -8, -6], [130, -70, -20], [300, -70, -20], [330, -96, -8], [600, -96, -8]]), L: [8, 6] };
  let s = '';
  const bp = eo(tw(lf, 120, 146));
  if (bp > 0) { const flips = [196, 250, 300].filter(t => lf >= t), e = flips.length ? flips[flips.length - 1] : -99, val = flips.length % 2, fl = tw(lf, e, e + 16);
    const d = String(fl < .5 ? 1 - val : val), sx = flips.length ? Math.abs(cos(PI * fl)) : 1;
    s += g(coinBit(860, 480, 104, flips.length ? d : '0', sx) + tag(860, 690, 'بت عادي', 1), `translate(0 ${n2((1 - bp) * 50)})`, bp); }
  const qp = eo(tw(lf, 320, 346)), measured = lf >= 500;
  if (qp > 0) s += g((measured ? coinBit(520, 480, 104, '1', eo(tw(lf, 500, 514)), 1 - tw(lf, 500, 560)) : coinSpin(520, 480, 104, lf)) + tag(520, 690, 'كيوبت', 1, C.teal, '#fff'), `translate(0 ${n2((1 - qp) * 50)})`, qp);
  s += measureBtn(520, 262, tw(lf, 470, 492), lf >= 496) + ripple(520, 480, tw(lf, 500, 540), C.magenta, 150);
  return s + person(man);
}

// 2. entanglement: two linked qubits; look at one and you know the other
function scEntangle(f, lf) {
  const sep = eio(tw(lf, 220, 300)), xa = lerp(640, 870, sep), xb = lerp(440, 210, sep), y = 480, R = 92, measured = lf >= 350;
  const p = eo(tw(lf, 96, 122)); if (p <= 0) return '';
  let s = '', link = '';
  const lp = tw(lf, 124, 170);
  if (lp > 0) { const x0 = xb + R, x1 = xa - R, n = 60, len = (x1 - x0) * lp; let d = '';
    for (let i = 0; i <= n; i++) { const u = i / n, x = x1 - len * u, amp = 16 * sin(PI * u * (x1 - x0) / (x1 - x0)) + 0; d += `${i ? 'L' : 'M'}${n2(x)} ${n2(y + 18 * sin(u * (x1 - x0) / 26 - lf / 7) * Math.min(1, 6 * u, 6 * (1 - u) + .001))}`; }
    link = `<path d="${d}" fill="none" ${stroke(measured ? C.green : C.magenta, 8)} opacity="${measured ? .9 : n2(.6 + .3 * sin(lf / 9))}"/>`; }
  const settle = eo(tw(lf, 350, 364)), gl = 1 - tw(lf, 350, 420);
  s += link + (measured ? coinBit(xa, y, R, '1', settle, gl) + coinBit(xb, y, R, '0', settle, gl) : coinSpin(xa, y, R, lf) + coinSpin(xb, y, R, lf, PI));
  s += measureBtn(xa, 268, tw(lf, 316, 338), lf >= 346) + ripple(xa, y, tw(lf, 350, 390), C.magenta, 140) + ripple(xb, y, tw(lf, 350, 390), C.magenta, 140);
  s += tag(xa, 680, 'البريمي', tw(lf, 290, 314)) + tag(xb, 680, 'مسقط', tw(lf, 300, 324));
  s += tag(xb, 268, 'عرفنا: 0', tw(lf, 420, 444), C.green, '#fff');
  return g(s, `translate(0 ${n2((1 - p) * 40)})`, p);
}

// 3. how it computes: one path at a time versus many possibilities at once, then the right answer is reinforced
function scCompute(f, lf) {
  const root = [940, 520], l1 = [340, 700].map(y => [720, y]), l2 = [250, 430, 610, 790].map(y => [500, y]), leaf = Array.from({ length: 8 }, (_, i) => [280, 226 + i * 84]), GOAL = 5;
  const pathTo = i => [root, l1[i >> 2], l2[i >> 1], leaf[i]];
  const edges = []; for (let i = 0; i < 8; i++) { const p = pathTo(i); for (let k = 0; k < 3; k++) edges.push([p[k], p[k + 1], i, k]); }
  const seg = (a, b, col, w, op = 1, len = 1) => `<path d="M${a[0]} ${a[1]} L${n2(lerp(a[0], b[0], len))} ${n2(lerp(a[1], b[1], len))}" fill="none" ${stroke(col, w)} opacity="${n2(op)}"/>`;
  const p = eo(tw(lf, 90, 120)); if (p <= 0) return '';
  let s = '';
  const seen = new Set(); edges.forEach(([a, b]) => { const key = a + '|' + b; if (seen.has(key)) return; seen.add(key); s += seg(a, b, '#C9D4E6', 12); });
  // classical: three attempts, one after another
  const tries = [0, 2, 7], T0 = 126, TL = 66, quantum = lf >= 330;
  tries.forEach((li, k) => { const a = T0 + k * TL, u = tw(lf, a, a + TL - 14); if (u <= 0) return; const pts = pathTo(li), fade = quantum ? 1 - tw(lf, 330, 360) : 1;
    for (let j = 0; j < 3; j++) { const q = clamp(u * 3 - j); if (q > 0) s += seg(pts[j], pts[j + 1], '#8794B4', 12, fade, q); }
    if (u < 1) { const j = Math.min(2, Math.floor(u * 3)), q = u * 3 - j; s += circ(lerp(pts[j][0], pts[j + 1][0], q), lerp(pts[j][1], pts[j + 1][1], q), 16, C.indigo); }
    else s += at(leaf[li][0] - 52, leaf[li][1], 1, cross(0, 0, .9, C.magenta, 8), fade); });
  // quantum: every branch at once, then interference keeps only the right one
  if (quantum) { const q = tw(lf, 330, 420), keep = tw(lf, 450, 500);
    edges.forEach(([a, b, li, k]) => { const len = clamp(q * 3 - k), good = li === GOAL; if (len <= 0) return;
      s += seg(a, b, good ? mixHex(C.cyan, C.green, keep) : C.cyan, good ? 12 + 6 * keep : 12, good ? 1 : 1 - .9 * keep, len); });
    if (q > .9) leaf.forEach((pt, i) => { s += circ(pt[0], pt[1], 20 + 4 * sin(lf / 6 + i), i === GOAL ? mixHex(C.cyan, C.green, keep) : C.cyan, `opacity="${n2(i === GOAL ? 1 : 1 - .9 * keep)}"`); }); }
  [root, ...l1, ...l2].forEach(pt => { s += circ(pt[0], pt[1], 17, '#fff', stroke('#9FB0DA', 6)); });
  leaf.forEach((pt, i) => { s += circ(pt[0], pt[1], 15, '#fff', stroke('#9FB0DA', 6)); });
  s += circ(root[0], root[1], 26, C.indigo) + tx('البداية', root[0], root[1] + 78, 30, { anchor: 'm', bold: 1 });
  const win = tw(lf, 470, 494); if (win > 0) s += at(leaf[GOAL][0] - 76, leaf[GOAL][1], .5 + .5 * back(win), circ(0, 0, 40, C.green) + check(0, 0, 1, '#fff', tw(win, .3, 1), 9), clamp(win * 3));
  s += tag(860, 250, 'عادي', tw(lf, 110, 132) * (1 - tw(lf, 318, 330)), '#8794B4', '#fff') + tag(860, 250, 'كمي', tw(lf, 330, 352), C.teal, '#fff');
  return g(s, '', p);
}

// 4. what it is good for
const USE = {
  med: c => `<g transform="rotate(-35)">${rect(-44, -20, 88, 40, 20, 'none', stroke(c, 7))}<path d="M0 -20 V20" fill="none" ${stroke(c, 7)}/><path d="M4 -16 H24 a16 16 0 0 1 0 32 H4Z" fill="${c}" opacity=".35"/></g>`,
  mat: c => `<path d="M0 -42 L36 -21 V21 L0 42 L-36 21 V-21 Z M0 -42 V0 M0 0 L36 21 M0 0 L-36 21" fill="none" ${stroke(c, 7)}/>` + circ(0, 0, 8, c),
  route: c => `<path d="M-38 30 C-38 -10 10 26 10 -8 C10 -30 36 -22 38 -34" fill="none" ${stroke(c, 7)} stroke-dasharray="2 14"/>` + circ(-38, 32, 10, c) + circ(38, -36, 10, c),
  lock: c => rect(-32, -8, 64, 52, 12, 'none', stroke(c, 7)) + `<path d="M-18 -8 V-24 a18 18 0 0 1 36 0 V-8" fill="none" ${stroke(c, 7)}/>` + circ(0, 18, 7, c),
};
function scUses(f, lf) {
  const cx = 540, cy = 520, items = [['med', 'الأدوية', 860, 330, 120, C.teal], ['mat', 'المواد الجديدة', 860, 700, 200, C.indigo], ['route', 'الطرق والشحن', 220, 700, 330, C.green], ['lock', 'حماية البيانات', 220, 330, 450, C.magenta]];
  let s = '', top = '';
  items.forEach(([k, label, x, y, a, col]) => { const p = tw(lf, a, a + 24); if (p <= 0) return; const lp = eo(tw(lf, a - 4, a + 30));
    s += path(`M${cx} ${cy} L${n2(lerp(cx, x, lp))} ${n2(lerp(cy, y, lp))}`, 'none', stroke('#B9C6DC', 8));
    for (let d = 0; d < 2; d++) { const u = ((lf - a) / 70 + d / 2) % 1; if (lf > a + 30) s += circ(lerp(cx, x, u), lerp(cy, y, u), 9, col); }
    top += at(x, y, .5 + .5 * back(p), rect(-100, -100, 200, 200, 46, '#fff', `filter="url(#sh)"`) + at(0, -16, 1.4, USE[k](col)) + rect(-122, 84, 244, 58, 29, col) + tx(label, 0, 124, 32, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3)); });
  const cp = back(tw(lf, 40, 70));
  return s + at(cx, cy, cp * (1 + .04 * sin(lf / 9)), circ(0, 0, 130, C.cyan, 'opacity=".18"') + circ(0, 0, 92, '#fff', `filter="url(#sh)"`) + g(ATOM(C.magenta, 6), `scale(1.6) rotate(${n2(lf / 3)})`), clamp(tw(lf, 40, 52))) + top;
}

// 5. where we are: very cold machines, still in laboratories, working alongside ordinary computers
function scStatus(f, lf) {
  const w = { x: 900, y: GY, s: .78, f, kind: 'woman', seed: 90, L: [16, 100], R: [-10, -8], heldL: heldPhone(4) };
  let s = '';
  const p = eo(tw(lf, 40, 70));
  // cryostat with the gold "chandelier" inside
  let ch = rect(-170, -260, 340, 520, 60, '#DCE9F8', stroke('#9FB7DA', 6)) + rect(-150, -240, 300, 480, 46, '#EEF5FD');
  ch += rect(-120, -214, 240, 22, 8, '#8794B4');
  [[220, -150], [180, -60], [140, 24], [100, 100]].forEach(([wd, yy], i) => { ch += path(`M${-wd / 2 + 16} ${yy - 86 + (i ? 0 : 0)} V${yy} M${wd / 2 - 16} ${yy - 86} V${yy} M0 ${yy - 86} V${yy}`, 'none', stroke('#C7A254', 5)) + `<ellipse cx="0" cy="${yy}" rx="${wd / 2}" ry="15" fill="${C.gold}" stroke="${C.goldD}" stroke-width="4"/>`; });
  ch += path('M0 100 V168', 'none', stroke('#C7A254', 5)) + at(0, 186, 1, circ(0, 0, 44, C.cyan, `opacity="${n2(.25 + .2 * sin(lf / 8))}"`) + chipG(44, { pins: 3, core: C.magenta }));
  s += g(at(330, 520, 1, ch), `translate(0 ${n2((1 - p) * 50)})`, p);
  // thermometer falling towards absolute zero
  const tp = tw(lf, 96, 120), cold = eo(tw(lf, 110, 200));
  if (tp > 0) { const lvl = lerp(250, 30, cold), tcol = mixHex(C.magenta, C.teal, cold), val = Math.round(lerp(20, -273, cold));
    s += at(600, 520, .6 + .4 * back(tp), rect(-22, -180, 44, 300, 22, '#fff', stroke('#9FB0DA', 5)) + circ(0, 140, 42, '#fff', stroke('#9FB0DA', 5)) + rect(-10, 120 - lvl, 20, lvl, 10, tcol) + circ(0, 140, 30, tcol) +
      rect(-96, -262, 192, 64, 22, tcol) + num(`${val}°C`, 0, -217, 38, { anchor: 'm', bold: 1, fill: '#fff' }), clamp(tp * 3));
    for (let i = 0; i < 6; i++) { const u = ((lf / 90 + i / 6) % 1), x = 480 + i * 42 + 10 * sin(lf / 20 + i), yy = 260 + 480 * u; if (cold > .3) s += at(x, yy, .6, path('M0 -14 V14 M-12 -7 L12 7 M-12 7 L12 -7', 'none', stroke('#8FC7E4', 5)), (1 - u) * cold); } }
  s += tag(330, 216, 'مختبر', tw(lf, 215, 238), C.indigo, '#fff');
  // alongside the ordinary computer, not instead of it
  const cp = tw(lf, 320, 346);
  if (cp > 0) s += at(800, 300, .6 + .4 * back(cp), rect(-190, -84, 380, 168, 40, '#fff', `filter="url(#sh)"`) + at(108, 0, 1.15, DEV.laptop(C.indigo)) + path('M-16 0 H16 M0 -16 V16', 'none', stroke(C.green, 9)) + at(-108, 0, 1.05, ATOM(C.magenta, 6)), clamp(cp * 3));
  return s + person(w);
}

function scOutro(f, lf) {
  const labels = ['الكيوبت', 'التشابك', 'الحساب', 'التطبيقات', 'المستقبل'], gone = tw(lf, 138, 162);
  let s = '';
  const head = eo(tw(lf, 4, 30));
  s += g(tx('الحوسبة الكمية', W / 2, 250, 110, { anchor: 'm', bold: 1 }), `translate(0 ${n2((1 - head) * 30)})`, head * (1 - gone));
  labels.forEach((l, i) => { const p = tw(lf, 20 + i * 20, 44 + i * 20); if (p <= 0) return; const x = W / 2 + (2 - i) * 250;
    s += at(x, 500 - gone * 40, (.5 + .5 * back(p)), rect(-96, -96, 192, 192, 44, '#fff', `filter="url(#sh)"`) + at(0, -4, 1.1, ICON[ICON_OF[i]](ICON_COL[i])) + tx(l, 0, 160, 44, { anchor: 'm', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  ['جديدة', 'مختلفة', 'واعدة'].forEach((t, i) => { const p = tw(lf, 96 + i * 12, 118 + i * 12); if (p > 0) s += at(W / 2 + (1 - i) * 260, 800, .6 + .4 * back(p), rect(-110, -46, 220, 92, 46, [C.teal, C.indigo, C.green][i]) + tx(t, 0, 17, 50, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  const card = tw(lf, 150, 180);
  if (card > 0) s += at(W / 2, 470, .8 + .2 * back(card), rect(-700, -250, 1400, 500, 60, '#fff', `filter="url(#sh)"`) + rect(-1, -150, 2, 300, 1, C.line), clamp(card * 2.5));
  const tg = eo(tw(lf, 196, 226));
  s += g(tx('محافظة البريمي', W / 2, 850, 64, { anchor: 'm', bold: 1 }) + tx('نحو مجتمع رقمي', W / 2, 930, 50, { anchor: 'm', fill: C.teal, bold: 1 }), `translate(0 ${n2((1 - tg) * 24)})`, tg);
  return s;
}
const DRAW = { intro: scIntro, qubit: scQubit, ent: scEntangle, calc: scCompute, uses: scUses, status: scStatus, outro: scOutro };

/* ---------- the frame ---------- */
export function sceneAt(f) { return SCENES.find(s => f >= s.start && f < s.end) || SCENES[SCENES.length - 1]; }
export function renderFrame(frame, opt = {}) {
  OPT = { shape: opt.shape || null, faux: !!opt.faux };
  const f = clamp(Math.floor(frame), 0, FRAMES - 1), sc = sceneAt(f), i = SCENES.indexOf(sc), lf = f - sc.start;
  const tin = i === 0 ? 1 : eo(tw(f, sc.start, sc.start + 26)), tout = i === SCENES.length - 1 ? 1 : 1 - eio(tw(f, sc.end - 20, sc.end));
  const prev = SCENES[Math.max(0, i - 1)], tint = mixHex(TINT[Math.max(0, i - 1)], TINT[i], tw(f, sc.start, sc.start + 30));
  const outro = sc.id === 'outro', intro = sc.id === 'intro';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Tajawal, sans-serif">` +
    `<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#1F2A5C" flood-opacity=".14"/></filter></defs>`;
  s += rect(0, 0, W, H, 0, C.bg);
  // backdrop: tinted disc + identity bands in two corners
  const discX = outro ? lerp(540, W / 2, eo(tw(lf, 0, 40))) : 540, discR = outro ? lerp(430, 620, eo(tw(lf, 0, 40))) : 430;
  s += circ(discX, 520, discR, tint) + circ(discX, 520, discR * .78, '#fff', 'opacity=".35"');
  s += path('M0 1080 V930 L150 1080Z', C.indigo) + path('M150 1080 L60 990 L115 990 L205 1080Z', C.teal) + path('M205 1080 L115 990 L150 990 L240 1080Z', C.cyan, 'opacity=".6"') + path('M1920 0 V120 L1800 0Z', C.magenta) + path('M1800 0 L1872 72 L1830 72 L1758 0Z', C.teal);
  if (!outro) s += path(`M70 ${GY + 4} H1040`, 'none', stroke('#C3D0E4', 6));
  // illustration
  const dx = (1 - tin) * 70 - (1 - tout) * 70;
  s += g(DRAW[sc.id](f, lf), `translate(${n2(dx)} 0)`, Math.min(tin, tout));
  // explanation panel (stays put between examples; only its content changes)
  const pShow = intro ? eo(tw(f, 0, 30)) : outro ? 1 - eo(tw(lf, 0, 24)) : 1;
  if (pShow > 0) {
    s += g(rect(PX, 150, PW, 800, 44, '#fff', `filter="url(#sh)"`), `translate(${n2((1 - pShow) * 80)} 0)`, pShow);
    if (intro) {
      const inn = d => eo(tw(lf, d, d + 26)), out = 1 - tw(lf, 278, 296), row = (inner, p, y) => g(inner, `translate(${n2((1 - p) * 60)} ${y})`, p * out);
      s += row(rect(PR - 250, -34, 250, 68, 34, C.magenta) + tx('في دقيقة واحدة', PR - 125, 12, 34, { anchor: 'm', fill: '#fff', bold: 1 }), inn(16), 300);
      s += row(tx('الحوسبة الكمية', PR, 0, 104, { bold: 1 }), inn(26), 470);
      s += row(tx('طريقة جديدة ومختلفة للحساب', PR, 0, 50, { fill: C.body }), inn(40), 560);
      ['جديدة', 'مختلفة', 'واعدة'].forEach((t, k) => { const p = tw(lf, 196 + k * 30, 218 + k * 30); if (p > 0) s += g(at(PR - 100 - k * 216, 720, .6 + .4 * back(p), rect(-100, -44, 200, 88, 44, [C.teal, C.indigo, C.green][k]) + tx(t, 0, 16, 48, { anchor: 'm', fill: '#fff', bold: 1 })), '', clamp(p * 3) * out); });
    } else if (!outro) s += panel(f, sc);
  }
  // chapter progress, right to left
  if (!outro) for (let k = 0; k < 5; k++) { const scn = SCENES[k + 1], p = tw(f, scn.start, scn.end), x = PX + PW - (k + 1) * 150 + 6;
    s += rect(x, 990, 138, 10, 5, '#D9E3EE') + (p > 0 ? rect(x + 138 * (1 - p), 990, 138 * p, 10, 5, ICON_COL[k]) : ''); }
  s += '</svg>';
  // logos live outside the SVG so the bitmaps are decoded once: a small lockup while explaining, a large one to close
  const lockIn = eo(tw(f, 6, 36)), lockOut = outro ? 1 - tw(lf, 120, 150) : 1, end = outro ? tw(lf, 160, 190) : 0;
  return { svg: s, logos: { lockup: n2(lockIn * lockOut), end: n2(clamp(end * 2)), endScale: n2(.85 + .15 * back(end)) } };
}
