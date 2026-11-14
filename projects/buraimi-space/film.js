// تقنيات الفضاء في دقيقة — محافظة البريمي
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
  { id: 'sat', start: 300, end: 900, n: 1, title: 'الأقمار الصناعية', def: ['أجهزة تدور حول الأرض', 'وتخدمنا من الفضاء.'],
    steps: [['الصاروخ يحمل القمر الصناعي', 120], ['يضعه في مداره', 262], ['فيدور حول الأرض', 340]], result: ['يخدمنا ليلًا ونهارًا', 470] },
  { id: 'comms', start: 900, end: 1500, n: 2, title: 'الاتصالات', def: ['القمر الصناعي ينقل الإشارة', 'بين مكانين بعيدين.'],
    steps: [['إشارة من الأرض إلى القمر', 124], ['القمر يعيد إرسالها', 250], ['فتصل أبعد القرى', 345]], result: ['إنترنت وبث في كل مكان', 470] },
  { id: 'gps', start: 1500, end: 2100, n: 3, title: 'تحديد المواقع', def: ['أقمار ترشد هاتفك', 'إلى مكانك على الخريطة.'],
    steps: [['هاتفك يستقبل عدة أقمار', 120], ['يحسب بُعده عن كل قمر', 330], ['فيعرف موقعك بدقة', 450]], result: ['الخرائط والملاحة', 510] },
  { id: 'obs', start: 2100, end: 2700, n: 4, title: 'رصد الأرض', def: ['صور من الفضاء', 'تساعدنا على اتخاذ القرار.'],
    steps: [['متابعة الطقس والأعاصير', 130], ['مراقبة الزراعة والمياه', 330], ['دعم فرق الطوارئ', 450]], result: ['قرارات أدق وأسرع', 500] },
  { id: 'explore', start: 2700, end: 3240, n: 5, title: 'الاستكشاف والفرص', def: ['علم يفتح أبوابًا جديدة.'],
    steps: [['استكشاف القمر والمريخ', 100], ['أقمار صغيرة يبنيها الطلبة', 215], ['وظائف في الهندسة والبيانات', 320]], result: ['الفضاء يبدأ بالتعلّم', 440] },
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
  sat: c => rect(-13, -16, 26, 32, 6, 'none', stroke(c, 7)) + rect(-46, -10, 24, 20, 3, 'none', stroke(c, 6)) + rect(22, -10, 24, 20, 3, 'none', stroke(c, 6)) + `<path d="M0 16 V32 M-12 36 Q0 24 12 36" fill="none" ${stroke(c, 6)}/>`,
  comm: c => circ(0, 14, 9, c) + `<path d="M-20 -4 a28 28 0 0 1 40 0 M-34 -18 a48 48 0 0 1 68 0 M0 14 V40" fill="none" ${stroke(c, 7)}/>`,
  pin: c => `<path d="M0 42 C-40 -4 -32 -42 0 -42 C32 -42 40 -4 0 42 Z" fill="none" ${stroke(c, 7)}/>` + circ(0, -12, 11, c),
  globe: c => circ(0, 0, 40, 'none', stroke(c, 7)) + `<ellipse cx="0" cy="0" rx="17" ry="40" fill="none" ${stroke(c, 6)}/><path d="M-40 0 H40" fill="none" ${stroke(c, 6)}/>`,
  rocket: c => `<path d="M0 -44 Q20 -20 20 10 V26 H-20 V10 Q-20 -20 0 -44 Z M-20 12 L-36 36 L-20 30 M20 12 L36 36 L20 30 M-8 34 L0 46 L8 34" fill="none" ${stroke(c, 7)}/>` + circ(0, -6, 7, c),
};
const ICON_OF = ['sat', 'comm', 'pin', 'globe', 'rocket'], ICON_COL = [C.indigo, C.teal, C.magenta, C.green, C.indigo];

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
const GY = 860, SKY = '#1B2450';
// the night sky: a dark disc with twinkling stars, drawn over the tinted backdrop
function sky(f) {
  let s = circ(540, 520, 430, SKY), seed = 99;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 70; i++) { const a = rnd() * 2 * PI, r = 410 * Math.sqrt(rnd()), tw2 = .35 + .65 * (.5 + .5 * sin(f / 22 + i * 1.7)); s += circ(540 + r * cos(a), 520 + r * sin(a), 1.6 + 2.2 * rnd(), '#fff', `opacity="${n2(tw2 * .9)}"`); }
  return s;
}
function earth(x, y, R, f, id = 'e') {
  const d = (f / 6) % (4 * R), blob = (cx, cy, rx, ry) => `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${rx}" ry="${ry}" fill="#4FB58A"/>`; let land = '';
  for (const o of [-4 * R, 0, 4 * R]) { const X = x + o + d - 2 * R; land += blob(X - R * .9, y - R * .35, R * .5, R * .34) + blob(X - R * .5, y + R * .3, R * .3, R * .42) + blob(X + R * .6, y - R * .1, R * .42, R * .5) + blob(X + R * 1.2, y + R * .45, R * .34, R * .22) + blob(X + R * 1.7, y - R * .4, R * .3, R * .26); }
  return circ(x, y, R + 14, C.cyan, 'opacity=".22"') + `<clipPath id="${id}"><circle cx="${x}" cy="${y}" r="${R}"/></clipPath><g clip-path="url(#${id})">${circ(x, y, R, '#2F8FC4')}${land}${circ(x - R * .35, y - R * .4, R * .9, '#fff', 'opacity=".10"')}${circ(x + R * .5, y + R * .5, R * 1.1, '#0B1C4A', 'opacity=".18"')}</g>`;
}
// satellite centred at (0,0); the dish points down (+y)
const satG = () => [-1, 1].map(k => rect(k > 0 ? 24 : -74, -17, 50, 34, 5, C.indigo, stroke('#9FB0DA', 3)) + path(`M${k > 0 ? 41 : -57} -17 v34 M${k > 0 ? 57 : -41} -17 v34`, 'none', stroke('#9FB0DA', 2))).join('') + rect(-24, -26, 48, 52, 11, '#EEF2F9', stroke('#9FB0DA', 4)) + circ(0, -4, 9, C.gold) + path('M-15 26 Q0 46 15 26 Z', '#C9D4E6', stroke('#9FB0DA', 3)) + path('M0 36 V48', 'none', stroke('#C9D4E6', 4));
const sat = (x, y, s = 1, rot = 0) => at(x, y, s, satG(), 1, rot);
// rocket pointing up, centred near its middle; fl: flame length 0..1
const rocketG = fl => (fl > 0 ? path(`M-17 44 Q0 ${n2(44 + 90 * fl)} 17 44 Z`, C.gold) + path(`M-9 44 Q0 ${n2(44 + 50 * fl)} 9 44 Z`, '#fff') : '') + path('M-26 16 L-50 52 L-26 42 Z M26 16 L50 52 L26 42 Z', C.indigo) +
  path('M0 -78 Q27 -44 27 6 V44 H-27 V6 Q-27 -44 0 -78 Z', '#FFFFFF', stroke('#CBD3E1', 3)) + path('M0 -78 Q16 -58 21 -36 H-21 Q-16 -58 0 -78 Z', C.magenta) + circ(0, -8, 12, C.cyan, stroke(C.navy, 4)) + rect(-27, 30, 54, 14, 3, '#C9D4E6');
const beam = (a, b, col, f, p, w = 8) => p <= 0 ? '' : `<path d="M${n2(a[0])} ${n2(a[1])} L${n2(lerp(a[0], b[0], p))} ${n2(lerp(a[1], b[1], p))}" fill="none" ${stroke(col, w)} stroke-dasharray="4 22" stroke-dashoffset="${n2(-f * 2.4)}" opacity=".95"/>`;
const tag = (x, y, t, p, col = '#fff', fill = C.ink, w = 240) => p <= 0 ? '' : at(x, y, .7 + .3 * back(p), rect(-w / 2, -32, w, 64, 32, col, col === '#fff' ? stroke(C.line, 3) : '') + tx(t, 0, 13, 34, { anchor: 'm', bold: 1, fill }), clamp(p * 3));

function scIntro(f, lf) {
  const wave = arm2(lf, [[0, -8, -6], [40, -150, -30], [280, -150, -30], [300, -40, -20]]); wave[1] += lf > 40 && lf < 280 ? 22 * sin((lf - 40) / 9) : 0;
  const man = { x: 430, y: GY, s: 1.22, f, R: wave, L: [8, 6] };
  const tiles = [['sat', 150, 300, 70], ['comm', 760, 250, 95], ['pin', 820, 520, 120], ['globe', 120, 560, 145], ['rocket', 640, 720, 170]];
  let s = sky(f);
  tiles.forEach(([k, x, y, a], i) => { const p = tw(lf, a, a + 24); if (p <= 0) return;
    s += at(x, y + 8 * sin(f / 40 + i), .5 + .5 * back(p), rect(-62, -62, 124, 124, 30, '#fff', `filter="url(#sh)"`) + at(0, 0, .78, ICON[k](ICON_COL[ICON_OF.indexOf(k)])), clamp(p * 3)); });
  return s + person(man);
}

// 1. a rocket carries the satellite up and leaves it in orbit
function scSat(f, lf) {
  const cx = 540, cy = 570, RE = 160, RO = 300;
  let s = sky(f) + earth(cx, cy, RE, f);
  const op = tw(lf, 236, 270); if (op > 0) s += circ(cx, cy, RO, 'none', `${stroke('#8FA3D8', 4)} stroke-dasharray="6 14" opacity="${n2(op * .8)}"`);
  const pos = u => { const th = rad(lerp(-90, 14, eio(u))), r = lerp(RE + 40, RO, eo(u)); return [cx + r * cos(th), cy + r * sin(th)]; };
  const u = tw(lf, 124, 262);
  if (lf < 124) s += at(cx, cy - RE - 44, .62, rocketG(lf > 96 ? .4 + .3 * sin(lf) : 0));
  else if (u < 1) { const a = pos(u), b = pos(Math.min(1, u + .01)), hd = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / PI + 90;
    for (let k = 1; k <= 9; k++) { const q = pos(Math.max(0, u - k * .022)); s += circ(q[0], q[1], 16 - k * 1.2, '#fff', `opacity="${n2(.5 - k * .05)}"`); }
    s += at(a[0], a[1], .62, rocketG(.7 + .3 * sin(lf * 1.3)), 1, hd); }
  if (lf >= 262) { const th = rad(14 + (lf - 262) * .42), x = cx + RO * cos(th), y = cy + RO * sin(th), sp = tw(lf, 262, 284);
    s += ripple(pos(1)[0], pos(1)[1], tw(lf, 262, 300), C.cyan, 90) + at(x, y, .5 + .5 * back(sp), satG(), 1, th * 180 / PI - 90); }
  s += tag(cx, 250, 'المدار', tw(lf, 262, 284), C.indigo, '#fff', 180);
  return s;
}

// 2. communications: a signal goes up from the city and comes down in a remote village
function scComms(f, lf) {
  const S = [540, 290], A = [850, 660], B = [230, 690];
  let s = sky(f);
  s += `<clipPath id="gr"><circle cx="540" cy="520" r="430"/></clipPath><g clip-path="url(#gr)">` + path('M110 950 V760 Q260 700 400 780 L520 520 L640 790 Q800 700 970 760 V950 Z', '#24406B') + path('M110 950 V800 Q300 730 520 810 Q760 730 970 800 V950 Z', '#2F5C73') + path('M486 590 L520 520 L556 596 Q520 574 486 590 Z', '#fff', 'opacity=".85"') + '</g>';
  // city with a ground station
  s += rect(880, 610, 44, 130, 6, '#5F76BD') + rect(932, 650, 38, 90, 6, '#7F95C4') + [0, 1, 2, 3].map(i => rect(889, 622 + i * 28, 10, 12, 2, '#FBE3A6') + rect(905, 622 + i * 28, 10, 12, 2, '#FBE3A6')).join('') +
    at(A[0], A[1] + 40, 1, path('M-34 -34 Q-6 -6 34 -34 Q8 16 -34 -34 Z', '#EEF2F9', stroke('#9FB0DA', 4)) + path('M0 -18 L0 44 M-22 44 H22', 'none', stroke('#C9D4E6', 8)) + circ(4, -34, 6, C.magenta));
  // remote village
  const lit = tw(lf, 334, 356);
  s += at(B[0], B[1] + 60, 1, rect(-56, -44, 112, 78, 8, '#F2E3CC') + path('M-66 -44 H66 L52 -62 H-52 Z', '#B78C61') + rect(-12, -14, 24, 48, 4, '#8A6B4A') + rect(-44, -26, 22, 22, 4, mixHex('#5A6B8C', '#FBE3A6', lit)) + rect(22, -26, 22, 22, 4, mixHex('#5A6B8C', '#FBE3A6', lit)) +
    path('M50 -62 V-96', 'none', stroke('#C9D4E6', 6)) + path('M34 -104 Q50 -88 66 -104', 'none', stroke('#C9D4E6', 6)));
  s += beam(A, S, C.cyan, lf, tw(lf, 124, 200)) + beam(S, [B[0] + 50, B[1] - 40], C.gold, lf, tw(lf, 250, 330));
  s += sat(S[0], S[1], 1.05 * (.6 + .4 * back(tw(lf, 60, 86))), 0) + ripple(S[0], S[1], tw(lf, 200, 240), C.cyan, 90) + ripple(B[0] + 50, B[1] - 40, tw(lf, 330, 370), C.gold, 90);
  s += tag(A[0] + 30, 840, 'المدينة', tw(lf, 100, 124), '#fff', C.ink, 190) + tag(B[0], 840, 'قرية بعيدة', tw(lf, 250, 274), '#fff', C.ink, 220);
  [['إنترنت', 0, C.teal], ['بث', 1, C.magenta]].forEach(([t, k, col]) => { s += tag(B[0] - 40 + k * 170, 560 - k * 10, t, tw(lf, 350 + k * 26, 372 + k * 26), col, '#fff', k ? 120 : 170); });
  return s;
}

// 3. positioning: the phone hears several satellites and works out where it is
function scGPS(f, lf) {
  const sats = [[230, 300], [540, 240], [850, 300]], P = [540, 640], cols = [C.cyan, C.gold, '#F08BD5'];
  let s = sky(f), ui = rect(0, 0, 276, 576, 37, '#E8F1F8') + path('M-10 150 H300 M-10 330 H300 M90 -10 V600 M200 -10 V600', 'none', stroke('#fff', 26)) + path('M0 480 L276 240', 'none', stroke('#fff', 26)) + rect(20, 190, 50, 110, 8, '#CFE4D6') + rect(220, 360, 44, 90, 8, '#CFE4D6');
  const pinP = tw(lf, 450, 474);
  if (pinP > 0) ui += at(145, 262 - (1 - eo(pinP)) * 120, 1.5, path('M0 0 C-30 -34 -24 -62 0 -62 C24 -62 30 -34 0 0 Z', C.magenta) + circ(0, -40, 10, '#fff'), clamp(pinP * 3));
  sats.forEach((p, i) => { const a = tw(lf, 110 + i * 40, 150 + i * 40); s += beam(p, P, cols[i], lf, a, 7);
    const rp = eo(tw(lf, 330 + i * 30, 400 + i * 30)), R = Math.hypot(p[0] - P[0], p[1] - P[1]); if (rp > 0) s += `<clipPath id="gp${i}"><circle cx="540" cy="520" r="428"/></clipPath><g clip-path="url(#gp${i})">` + circ(p[0], p[1], R * rp, 'none', `${stroke(cols[i], 5)} opacity="${n2(.75 - .25 * tw(lf, 470, 520))}"`) + '</g>'; });
  const up = eo(tw(lf, 40, 70));
  s += g(phone(447, 478, .62, `<clipPath id="ph"><rect x="0" y="0" width="276" height="576" rx="37"/></clipPath><g clip-path="url(#ph)">${ui}</g>`), `translate(0 ${n2((1 - up) * 60)})`, up);
  sats.forEach((p, i) => { s += sat(p[0], p[1], .78 * (.6 + .4 * back(tw(lf, 60 + i * 14, 86 + i * 14))), [20, 0, -20][i]); });
  s += ripple(P[0], P[1], tw(lf, 474, 520), C.magenta, 120) + tag(540, 420, 'أنت هنا', tw(lf, 480, 502), C.magenta, '#fff', 200);
  return s;
}

// 4. Earth observation: weather and cyclones, farms and water, emergency teams
const OBS = {
  storm: c => `<path d="M0 0 m-34 0 a34 34 0 0 1 60 -22 M0 0 m34 0 a34 34 0 0 1 -60 22 M0 0 m-16 0 a16 16 0 0 1 32 0 a16 16 0 0 1 -32 0" fill="none" ${stroke(c, 7)}/>`,
  farm: c => `<path d="M0 40 V-6 M0 6 Q-30 4 -32 -24 Q-4 -22 0 6 M0 -6 Q28 -10 30 -38 Q2 -34 0 -6" fill="none" ${stroke(c, 7)}/>` + `<path d="M-40 40 H40" fill="none" ${stroke(c, 7)}/>`,
  help: c => `<path d="M0 -42 L36 -28 V4 Q32 30 0 44 Q-32 30 -36 4 V-28 Z" fill="none" ${stroke(c, 7)}/><path d="M0 -16 V18 M-17 1 H17" fill="none" ${stroke(c, 8)}/>`,
};
function scObserve(f, lf) {
  const cx = 540, cy = 560, R = 210;
  let s = sky(f) + earth(cx, cy, R, f, 'eo');
  // a cyclone turning over the sea
  const cyc = tw(lf, 110, 150); if (cyc > 0) { let sp = ''; for (let k = 0; k < 3; k++) sp += `<path d="M0 0 m-52 0 a52 52 0 0 1 86 -34" fill="none" ${stroke('#fff', 14)} transform="rotate(${n2(k * 120 + lf * 1.6)})" opacity=".9"/>`;
    s += at(cx + 60, cy + 40, .5 + .5 * back(cyc), sp + circ(0, 0, 12, '#2F8FC4'), cyc); }
  const th = rad(-150 + (lf / 600) * 120), sx = cx + 330 * cos(th), sy = cy + 330 * sin(th), aim = [cx + 150 * cos(th), cy + 150 * sin(th)];
  s += path(`M${n2(sx)} ${n2(sy)} L${n2(aim[0] - 70 * sin(th))} ${n2(aim[1] + 70 * cos(th))} L${n2(aim[0] + 70 * sin(th))} ${n2(aim[1] - 70 * cos(th))} Z`, C.cyan, `opacity="${n2(.2 + .12 * sin(lf / 7))}"`) + sat(sx, sy, .8, th * 180 / PI - 90);
  const tile = (k, label, x, y, a, col) => { const p = tw(lf, a, a + 24); return p <= 0 ? '' : at(x, y, .5 + .5 * back(p), rect(-96, -96, 192, 192, 44, '#fff', `filter="url(#sh)"`) + at(0, -14, 1.3, OBS[k](col)) + rect(-116, 80, 232, 56, 28, col) + tx(label, 0, 119, 30, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3)); };
  return s + tile('storm', 'الطقس والأعاصير', 880, 330, 130, C.teal) + tile('farm', 'الزراعة والمياه', 200, 330, 330, C.green) + tile('help', 'فرق الطوارئ', 880, 720, 450, C.magenta);
}

// 5. exploration, and what it opens up for young people
function scExplore(f, lf) {
  const w = { x: 400, y: GY, s: .74, f, kind: 'woman', seed: 90, L: [16, 100], R: lf > 330 && lf < 500 ? [-118 + 10 * sin(lf / 7), -50] : [-10, -8], heldL: heldPhone(4) };
  const m = { x: 690, y: GY, s: .74, f, seed: 30, k1: C.green, k2: C.teal, R: [-14, -96], L: [8, 6], heldR: `<g transform="translate(0 ${L2 - 34})">${rect(-34, -34, 68, 68, 10, '#EEF2F9', stroke('#9FB0DA', 4))}${rect(-22, -22, 44, 44, 6, C.indigo)}${path('M0 -34 V-58', 'none', stroke('#C9D4E6', 5))}</g>` };
  let s = sky(f);
  const mp = tw(lf, 96, 122), rp = tw(lf, 110, 134);
  s += at(840, 310, .5 + .5 * back(mp), circ(0, 0, 96, '#D9DEE8') + circ(-30, -24, 20, '#BFC7D6') + circ(34, 16, 28, '#BFC7D6') + circ(-18, 44, 13, '#BFC7D6') + circ(38, -44, 11, '#BFC7D6'), clamp(mp * 3)) + tag(840, 440, 'القمر', tw(lf, 110, 132), '#fff', C.ink, 150);
  s += at(250, 330, .5 + .5 * back(rp), circ(0, 0, 70, '#D9704A') + circ(-20, -14, 16, '#C25D3A') + circ(22, 22, 20, '#C25D3A') + path('M-60 -30 Q0 -10 62 -32', 'none', stroke('#E7936E', 6)), clamp(rp * 3)) + tag(250, 436, 'المريخ', tw(lf, 124, 146), '#fff', C.ink, 150);
  const fly = tw(lf, 130, 300); if (fly > 0 && fly < 1) { const u = eio(fly), x = lerp(560, 760, u), y = lerp(700, 360, u) - 60 * sin(PI * u); s += at(x, y, .5, rocketG(.7 + .3 * sin(lf * 1.3)), 1, 32); }
  const cu = tw(lf, 215, 240); s += tag(690, 560, 'قمر صغير', cu, C.teal, '#fff', 200);
  s += tag(545, 250, 'هندسة وبيانات', tw(lf, 330, 354), C.green, '#fff', 290);
  return s + person(w) + person(m);
}

function scOutro(f, lf) {
  const labels = ['الأقمار', 'الاتصالات', 'المواقع', 'الرصد', 'الاستكشاف'], gone = tw(lf, 138, 162);
  let s = '';
  const head = eo(tw(lf, 4, 30));
  s += g(tx('تقنيات الفضاء', W / 2, 250, 110, { anchor: 'm', bold: 1 }), `translate(0 ${n2((1 - head) * 30)})`, head * (1 - gone));
  labels.forEach((l, i) => { const p = tw(lf, 20 + i * 20, 44 + i * 20); if (p <= 0) return; const x = W / 2 + (2 - i) * 250;
    s += at(x, 500 - gone * 40, (.5 + .5 * back(p)), rect(-96, -96, 192, 192, 44, '#fff', `filter="url(#sh)"`) + at(0, -4, 1.1, ICON[ICON_OF[i]](ICON_COL[i])) + tx(l, 0, 160, 44, { anchor: 'm', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  ['نتواصل', 'نرصد', 'نستكشف'].forEach((t, i) => { const p = tw(lf, 96 + i * 12, 118 + i * 12); if (p > 0) s += at(W / 2 + (1 - i) * 260, 800, .6 + .4 * back(p), rect(-110, -46, 220, 92, 46, [C.teal, C.indigo, C.green][i]) + tx(t, 0, 17, 50, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  const card = tw(lf, 150, 180);
  if (card > 0) s += at(W / 2, 470, .8 + .2 * back(card), rect(-700, -250, 1400, 500, 60, '#fff', `filter="url(#sh)"`) + rect(-1, -150, 2, 300, 1, C.line), clamp(card * 2.5));
  const tg = eo(tw(lf, 196, 226));
  s += g(tx('محافظة البريمي', W / 2, 850, 64, { anchor: 'm', bold: 1 }) + tx('نحو مجتمع رقمي', W / 2, 930, 50, { anchor: 'm', fill: C.teal, bold: 1 }), `translate(0 ${n2((1 - tg) * 24)})`, tg);
  return s;
}
const DRAW = { intro: scIntro, sat: scSat, comms: scComms, gps: scGPS, obs: scObserve, explore: scExplore, outro: scOutro };

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
      s += row(tx('تقنيات الفضاء', PR, 0, 112, { bold: 1 }), inn(26), 470);
      s += row(tx('خدمات من السماء لحياتنا اليومية', PR, 0, 48, { fill: C.body }), inn(40), 560);
      ['نتواصل', 'نرصد', 'نستكشف'].forEach((t, k) => { const p = tw(lf, 196 + k * 30, 218 + k * 30); if (p > 0) s += g(at(PR - 100 - k * 216, 720, .6 + .4 * back(p), rect(-100, -44, 200, 88, 44, [C.teal, C.indigo, C.green][k]) + tx(t, 0, 16, 48, { anchor: 'm', fill: '#fff', bold: 1 })), '', clamp(p * 3) * out); });
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
