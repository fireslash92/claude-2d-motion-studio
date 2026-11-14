// أشباه الموصلات في دقيقة — محافظة البريمي
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
  { id: 'what', start: 300, end: 900, n: 1, title: 'شبه الموصل', def: ['مادة توصل الكهرباء عند الطلب،', 'مثل السيليكون.'],
    steps: [['الموصل يمرّر الكهرباء دائمًا', 140], ['العازل يمنعها دائمًا', 230], ['شبه الموصل: نتحكم فيه', 350]], result: ['نتحكم في الكهرباء', 500] },
  { id: 'sw', start: 900, end: 1500, n: 2, title: 'الترانزستور', def: ['مفتاح صغير جدًا', 'يفتح الكهرباء ويغلقها.'],
    steps: [['يفتح الكهرباء ويغلقها', 130], ['مغلق = 0 ، مفتوح = 1', 336], ['لغة تفهمها كل الأجهزة', 500]], result: ['لغة الحاسوب: 0 و 1', 540] },
  { id: 'chip', start: 1500, end: 2100, n: 3, title: 'الشريحة', def: ['مليارات المفاتيح', 'على قطعة صغيرة.'],
    steps: [['السيليكون من الرمل', 100], ['نصنع منه قرصًا رقيقًا', 210], ['ننقش عليه مليارات المفاتيح', 320]], result: ['شريحة بحجم الظفر', 462] },
  { id: 'where', start: 2100, end: 2700, n: 4, title: 'أين نجدها', def: ['في كل جهاز ذكي من حولنا.'],
    steps: [['هاتفك النقال والحاسوب', 130], ['السيارة والأجهزة الطبية', 250], ['الألواح الشمسية', 440]], result: ['في كل جهاز حولك', 492] },
  { id: 'why', start: 2700, end: 3240, n: 5, title: 'لماذا تهمّنا', def: ['هي أساس التقنيات الحديثة.'],
    steps: [['أساس الذكاء الاصطناعي', 100], ['تبني الاقتصاد الرقمي', 215], ['فرص للشباب في الهندسة', 320]], result: ['تعلّم اليوم لتصنع الغد', 440] },
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
  mat: c => circ(0, 0, 9, c) + `<ellipse cx="0" cy="0" rx="42" ry="16" fill="none" ${stroke(c, 6)}/><ellipse cx="0" cy="0" rx="42" ry="16" fill="none" ${stroke(c, 6)} transform="rotate(60)"/><ellipse cx="0" cy="0" rx="42" ry="16" fill="none" ${stroke(c, 6)} transform="rotate(-60)"/>`,
  sw: c => rect(-44, -22, 88, 44, 22, 'none', stroke(c, 7)) + circ(20, 0, 13, c),
  chip: c => rect(-26, -26, 52, 52, 9, 'none', stroke(c, 7)) + `<path d="M-12 -26 V-42 M12 -26 V-42 M-12 26 V42 M12 26 V42 M-26 -12 H-42 M-26 12 H-42 M26 -12 H42 M26 12 H42" fill="none" ${stroke(c, 7)}/>`,
  dev: c => rect(-40, -34, 80, 52, 8, 'none', stroke(c, 7)) + `<path d="M-54 32 H54" fill="none" ${stroke(c, 8)}/>`,
  fut: c => `<path d="M-40 34 L-12 4 L8 20 L40 -30 M40 -30 H16 M40 -30 V-6" fill="none" ${stroke(c, 8)}/>`,
};
const ICON_OF = ['mat', 'sw', 'chip', 'dev', 'fut'], ICON_COL = [C.teal, C.indigo, C.magenta, C.green, C.indigo];

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
const electron = (x, y, r = 9) => circ(x, y, r, C.cyan) + circ(x - r * .3, y - r * .3, r * .32, '#fff', 'opacity=".8"');
const bulb = (x, y, on) => (on > 0 ? circ(x, y - 8, 62, C.gold, `opacity="${n2(.28 * on)}"`) : '') + rect(x - 16, y + 26, 32, 26, 6, '#8C96B4') + circ(x, y - 8, 38, mixHex('#E4EAF4', '#F7CF6B', on), stroke(mixHex('#C3CEE0', C.goldD, on), 4)) + path(`M${x - 12} ${y + 6} q12 -26 24 0`, 'none', stroke(mixHex('#AEBBD2', '#B37A14', on), 4));
const battery = (x, y) => rect(x - 34, y - 46, 68, 92, 14, C.navy) + rect(x - 14, y - 58, 28, 16, 5, C.navy) + rect(x - 22, y - 30, 44, 26, 6, C.green) + path(`M${x - 9} ${y + 22} h18 M${x} ${y + 13} v18`, 'none', stroke('#fff', 5));

function scIntro(f, lf) {
  const wave = arm2(lf, [[0, -8, -6], [40, -150, -30], [280, -150, -30], [300, -40, -20]]); wave[1] += lf > 40 && lf < 280 ? 22 * sin((lf - 40) / 9) : 0;
  const man = { x: 430, y: GY, s: 1.22, f, R: wave, L: [18, -118], heldL: `<g transform="translate(0 ${L2 - 34})">${chipG(74)}</g>` };
  const tiles = [['mat', 150, 300, 70], ['sw', 760, 250, 95], ['chip', 820, 520, 120], ['dev', 120, 560, 145], ['fut', 640, 720, 170]];
  let s = '';
  tiles.forEach(([k, x, y, a], i) => { const p = tw(lf, a, a + 24); if (p <= 0) return;
    s += at(x, y + 8 * sin(f / 40 + i), .5 + .5 * back(p), rect(-62, -62, 124, 124, 30, '#fff', `filter="url(#sh)"`) + at(0, 0, .78, ICON[k](ICON_COL[ICON_OF.indexOf(k)])), clamp(p * 3)); });
  return s + person(man);
}

// 1. conductor, insulator, semiconductor: three circuits side by side
function scWhat(f, lf) {
  const man = { x: 150, y: GY, s: .86, f, R: arm2(lf, [[0, -8, -6], [120, -8, -6], [160, -72, -18], [330, -72, -18], [360, -96, -10], [600, -96, -10]]), L: [8, 6] };
  const rows = [['نحاس', '#D98C4A', 140, 300], ['مطاط', '#3A3F55', 230, 500], ['سيليكون', '#7F95C4', 350, 700]];
  const siOn = lf >= 380 && (lf < 440 || lf >= 500) ? 1 : 0;
  let s = '';
  rows.forEach(([label, col, a, y], i) => {
    const p = eo(tw(lf, a, a + 26)); if (p <= 0) return;
    const on = i === 0 ? tw(lf, a + 24, a + 40) : i === 1 ? 0 : siOn;
    let r = path(`M420 ${y} H990`, 'none', stroke('#B9C6DC', 10)) + battery(990, y) + rect(560, y - 44, 300, 88, 26, col) + tx(label, 710, y + 14, 40, { anchor: 'm', fill: '#fff', bold: 1 });
    for (let k = 0; k < 7; k++) {                                   // electrons travel right to left; an insulator leaves them queued
      const u = ((lf / 46 + k / 7) % 1);
      if (i === 1 || (i === 2 && !on)) { if (k < 3) r += electron(884 + k * 26 + 2 * sin(lf / 5 + k), y - 0); }
      else if (on > 0) { const x = lerp(950, 440, u); if (x > 866 || x < 552) r += electron(x, y); }
    }
    r += bulb(400, y, i === 2 ? on : on);
    if (i === 2) { const e = Math.max(0, ...[380, 440, 500].filter(t => t <= lf)), k = e === 0 ? 0 : siOn ? eo(tw(lf, e, e + 12)) : 1 - eo(tw(lf, e, e + 12));
      r += rect(662, y - 108, 96, 46, 23, mixHex('#C3CEE0', C.green, clamp(k))) + circ(685 + 50 * clamp(k), y - 85, 18, '#fff'); }
    if (i === 1) r += at(710, y - 78, 1, cross(0, 0, 1.1, C.magenta, 9), tw(lf, a + 30, a + 44));
    if (i === 0) r += at(710, y - 78, 1, check(0, 0, 1.2, C.green, tw(lf, a + 30, a + 48), 9));
    s += g(r, `translate(${n2((1 - p) * 60)} 0)`, p);
  });
  return s + person(man);
}

// 2. the transistor is a switch: closed = 0, open = 1
function scSwitch(f, lf) {
  const spans = [[130, 190], [250, 310], [410, 500], [520, 540], [560, 580]];
  const on = spans.some(([a, b]) => lf >= a && lf < b), edge = Math.max(...spans.flat().filter(t => t <= lf), 0), k = on ? eo(tw(lf, edge, edge + 10)) : 1 - eo(tw(lf, edge, edge + 10));
  const man = { x: 140, y: GY, s: .8, f, R: arm2(lf, [[0, -8, -6], [100, -8, -6], [130, -60, -40], [600, -60, -40]]), L: [8, 6] };
  const cx = 680, cy = 600;
  let s = '';
  s += path(`M330 ${cy} H1030`, 'none', stroke('#B9C6DC', 26)) + path(`M330 ${cy} H1030`, 'none', stroke('#E9EEF7', 14));
  s += rect(cx - 170, cy - 70, 340, 140, 30, mixHex('#7F95C4', C.teal, k)) + tx('سيليكون', cx, cy + 14, 38, { anchor: 'm', fill: '#fff', bold: 1 });
  s += rect(cx - 110, cy - 104, 220, 34, 12, mixHex(C.indigo, C.green, k)) + path(`M${cx} ${cy - 104} V${cy - 190}`, 'none', stroke(mixHex(C.indigo, C.green, k), 12));
  s += at(cx, cy - 250, 1 - .06 * k, circ(0, 0, 62, '#fff', `filter="url(#sh)"`) + circ(0, 0, 46, mixHex('#D9E3EE', C.green, k)) + path('M0 -22 V2 M-18 -12 a24 24 0 1 0 36 0', 'none', stroke('#fff', 7)));
  if (on) s += ripple(cx, cy - 250, tw(lf, edge, edge + 30), C.green, 70);
  for (let i = 0; i < 9; i++) { const u = ((lf / 50 + i / 9) % 1), x = lerp(1010, 350, u);
    if (k > .5) { if (x > cx + 180 || x < cx - 180) s += electron(x, cy, 10); }
    else if (i < 4) s += electron(cx + 196 + i * 30 + 2 * sin(lf / 5 + i), cy, 10); }
  s += tx('تحكم', cx - 130, cy - 240, 32, { fill: C.mute, bold: 1, anchor: 'm' });
  // the big digit: what the switch means
  const dp = tw(lf, 336, 360);
  if (dp > 0) s += at(940, 330, .6 + .4 * back(dp), rect(-90, -110, 180, 220, 36, '#fff', `filter="url(#sh)"`) + num(on ? '1' : '0', 0, 52, 150, { anchor: 'm', bold: 1, fill: on ? C.green : C.mute }), clamp(dp * 3));
  // bits written as the switch flips
  const shown = [[336, '0'], [410, '1'], [500, '0'], [520, '1'], [540, '0'], [560, '1'], [580, '0']].filter(b => lf >= b[0]);
  shown.forEach(([a, d], i) => { const p = tw(lf, a, a + 14); s += at(960 - i * 86, 760, .5 + .5 * back(p), rect(-36, -44, 72, 88, 18, d === '1' ? C.green : '#C3CEE0') + num(d, 0, 20, 56, { anchor: 'm', bold: 1, fill: '#fff' }), clamp(p * 3)); });
  return s + person(man);
}

// 3. from sand to a chip the size of a fingernail (read right to left)
function scChip(f, lf) {
  let s = '';
  const arrow = (x, y, p) => p <= 0 ? '' : g(path(`M${x + 44} ${y} H${x - 30} M${x - 12} ${y - 20} L${x - 34} ${y} L${x - 12} ${y + 20}`, 'none', stroke(C.indigo, 10)), '', p);
  // sand
  const sp = eo(tw(lf, 100, 126));
  if (sp > 0) { let grains = ''; for (let i = 0; i < 26; i++) { const a = i * 2.39996, r = 20 + (i * 37 % 90); grains += circ(900 + r * cos(a) * 1.1, 640 - Math.abs(r * sin(a)) * .5 - 6, 5, i % 3 ? '#E3C27A' : '#F6E1AE'); }
    s += g(path('M770 680 Q900 500 1030 680 Z', '#EBCB85') + path('M770 680 Q900 560 1030 680 Z', '#DDB766') + grains + rect(760, 676, 280, 14, 7, '#C9A04F') + tx('رمل', 900, 760, 44, { anchor: 'm', bold: 1 }), `translate(0 ${n2((1 - sp) * 40)})`, sp); }
  s += arrow(735, 600, tw(lf, 190, 214));
  // wafer: the grid is drawn, then etched by a sweeping beam
  const wp = tw(lf, 210, 240);
  if (wp > 0) { const R = 150, x0 = 540, y0 = 560, gp = tw(lf, 236, 310), ep = tw(lf, 320, 440); let inner = '';
    for (let i = -4; i <= 4; i++) { const c = i * 34, hw = Math.sqrt(Math.max(0, R * R - c * c)) - 6, q = clamp(gp * 9 - (i + 4));
      if (q > 0) inner += path(`M${x0 + c} ${n2(y0 - hw * q)} V${n2(y0 + hw * q)} M${n2(x0 - hw * q)} ${y0 + c} H${n2(x0 + hw * q)}`, 'none', stroke('#fff', 3) + ' opacity=".8"'); }
    if (ep > 0) for (let i = -4; i < 4; i++) for (let j = -4; j < 4; j++) { const cx = x0 + i * 34 + 17, cy = y0 + j * 34 + 17; if (Math.hypot(cx - x0, cy - y0) > R - 22) continue;
      if ((j + 4) / 8 < ep) inner += rect(cx - 11, cy - 11, 22, 22, 4, (i + j) % 2 ? C.teal : C.indigo); }
    if (ep > 0 && ep < 1) inner += rect(x0 - R, y0 - R + 2 * R * ep - 4, 2 * R, 8, 4, C.magenta) + rect(x0 - R, y0 - R + 2 * R * ep - 26, 2 * R, 48, 0, C.magenta, 'opacity=".15"');
    s += at(0, 0, 1, circ(x0, y0 + 10, R, '#1F2A5C', 'opacity=".10"') + circ(x0, y0, R, '#B8C6E2', stroke('#8FA3C8', 5)) + `<clipPath id="wf"><circle cx="${x0}" cy="${y0}" r="${R - 3}"/></clipPath><g clip-path="url(#wf)">${inner}</g>` + tx('قرص السيليكون', x0, 780, 40, { anchor: 'm', bold: 1 }), clamp(wp * 2));
    const cnt = Math.round(5e9 * eo(ep) / 1e8) * 1e8;
    if (ep > 0) s += at(x0, 330, .7 + .3 * back(tw(lf, 320, 342)), rect(-210, -50, 420, 100, 30, '#fff', `filter="url(#sh)"`) + num(cnt.toLocaleString('en-US'), -186, 16, 44, { bold: 1, fill: C.teal }) + tx('مفتاح', 186, 14, 34, { bold: 1 }), clamp(tw(lf, 320, 332) * 2)); }
  s += arrow(345, 600, tw(lf, 436, 460));
  // the finished chip beside a fingertip
  const cp = tw(lf, 450, 476);
  if (cp > 0) s += at(190, 600, .5 + .5 * back(cp), g(rect(-52, -150, 104, 250, 52, C.skin) + rect(-38, -138, 76, 86, 30, '#F1D2BC') + path('M-52 40 h104', 'none', stroke(C.skinD, 4)), 'translate(-64 60) rotate(-8)') + at(70, -30, 1, chipG(86)) + tx('شريحة', 74, 96, 44, { anchor: 'm', bold: 1 }), clamp(cp * 3));
  return s;
}

// 4. where they are: one chip feeding the devices around us
const DEV = {
  phone: c => rect(-26, -46, 52, 92, 12, 'none', stroke(c, 7)) + path('M-8 32 h16', 'none', stroke(c, 6)),
  laptop: c => rect(-40, -34, 80, 52, 8, 'none', stroke(c, 7)) + path('M-54 32 H54', 'none', stroke(c, 8)),
  car: c => path('M-50 14 V-4 Q-48 -10 -40 -12 L-28 -34 H22 L40 -12 Q50 -10 50 0 V14 Z', 'none', stroke(c, 7)) + circ(-28, 18, 11, '#fff', stroke(c, 7)) + circ(28, 18, 11, '#fff', stroke(c, 7)),
  med: c => rect(-46, -36, 92, 64, 10, 'none', stroke(c, 7)) + path('M-34 -4 h16 l8 -18 l12 36 l8 -18 h18 M-20 42 H20', 'none', stroke(c, 6)),
  solar: c => path('M-44 26 L-28 -22 H28 L44 26 Z M-36 2 H36 M-10 -22 L-14 26 M10 -22 L14 26', 'none', stroke(c, 6)) + circ(40, -40, 9, c),
};
function scWhere(f, lf) {
  const cx = 540, cy = 540, items = [['phone', 'الهاتف النقال', 860, 320, 130, C.teal], ['laptop', 'الحاسوب', 900, 690, 190, C.indigo], ['car', 'السيارة', 540, 286, 250, C.magenta], ['med', 'الأجهزة الطبية', 180, 690, 330, C.green], ['solar', 'الألواح الشمسية', 200, 320, 440, C.gold]];
  let s = '', top = '';
  items.forEach(([k, label, x, y, a, col], i) => {
    const p = tw(lf, a, a + 24); if (p <= 0) return;
    const lp = eo(tw(lf, a - 4, a + 30)), ex = lerp(cx, x, lp), ey = lerp(cy, y, lp);
    s += path(`M${cx} ${cy} L${n2(ex)} ${n2(ey)}`, 'none', stroke('#B9C6DC', 8));
    for (let d = 0; d < 2; d++) { const u = ((lf - a) / 70 + d / 2) % 1; if (lf > a + 30) s += circ(lerp(cx, x, u), lerp(cy, y, u), 9, col); }
    top += at(x, y, .5 + .5 * back(p), rect(-100, -100, 200, 200, 46, '#fff', `filter="url(#sh)"`) + at(0, -16, 1.4, DEV[k](col === C.gold ? C.goldD : col)) + rect(-122, 84, 244, 58, 29, col === C.gold ? C.goldD : col) + tx(label, 0, 124, 32, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3));
  });
  const cp = back(tw(lf, 40, 70)), pulse = 1 + .04 * sin(lf / 9);
  return s + at(cx, cy, cp * pulse, circ(0, 0, 130, C.cyan, 'opacity=".18"') + chipG(150, { pins: 6 }), clamp(tw(lf, 40, 52))) + top;
}

// 5. why it matters: AI, the digital economy, and jobs for young people
function scWhy(f, lf) {
  const cheer = lf > 330 && lf < 500;
  const w = { x: 360, y: GY, s: .76, f, kind: 'woman', seed: 90, L: [16, 100], R: cheer ? [-118 + 10 * sin(lf / 7), -50] : [-10, -8], heldL: `<g transform="translate(0 ${L2 - 30})">${chipG(70)}</g>` };
  const m = { x: 720, y: GY, s: .76, f, seed: 30, k1: C.green, k2: C.teal, R: [-14, -96], L: [8, 6], heldR: heldPhone(-4) };
  let s = '';
  const card = (x, a, inner, label) => { const p = tw(lf, a, a + 24); return p <= 0 ? '' : at(x, 312 + 6 * sin(f / 40 + x), .5 + .5 * back(p), rect(-134, -112, 268, 224, 36, '#fff', `filter="url(#sh)"`) + g(inner, 'translate(0 -14)') + tx(label, 0, 84, 30, { anchor: 'm', bold: 1 }), clamp(p * 3)); };
  const glow = .5 + .5 * sin(lf / 8);
  s += card(820, 100, circ(0, -22, 62, C.cyan, `opacity="${n2(.15 + .15 * glow)}"`) + at(0, -22, 1, chipG(84, { inner: num('AI', 0, 13, 34, { anchor: 'm', bold: 1, fill: '#fff' }), core: C.magenta })), 'الذكاء الاصطناعي');
  let bars = ''; [.3, .45, .6, .8, 1].forEach((h, i) => { const p = eo(tw(lf, 232 + i * 10, 268 + i * 10)); bars += rect(64 - i * 36, 36 - 96 * h * p, 26, 96 * h * p, 7, i === 4 ? C.green : '#B9C6E6'); });
  s += card(540, 215, g(bars, 'translate(-4 0)'), 'الاقتصاد الرقمي');
  s += card(260, 320, path('M-56 -36 L0 -62 L56 -36 L0 -10 Z', C.indigo) + path('M-34 -22 V8 Q0 30 34 8 V-22', 'none', stroke(C.indigo, 8)) + path('M56 -36 V4', 'none', stroke(C.gold, 6)) + circ(56, 8, 7, C.gold), 'فرص للشباب');
  return s + person(w) + person(m);
}

function scOutro(f, lf) {
  const labels = ['المادة', 'المفتاح', 'الشريحة', 'الأجهزة', 'المستقبل'], gone = tw(lf, 138, 162);
  let s = '';
  const head = eo(tw(lf, 4, 30));
  s += g(tx('أشباه الموصلات', W / 2, 250, 110, { anchor: 'm', bold: 1 }), `translate(0 ${n2((1 - head) * 30)})`, head * (1 - gone));
  labels.forEach((l, i) => { const p = tw(lf, 20 + i * 20, 44 + i * 20); if (p <= 0) return; const x = W / 2 + (2 - i) * 250;
    s += at(x, 500 - gone * 40, (.5 + .5 * back(p)), rect(-96, -96, 192, 192, 44, '#fff', `filter="url(#sh)"`) + at(0, -4, 1.1, ICON[ICON_OF[i]](ICON_COL[i])) + tx(l, 0, 160, 44, { anchor: 'm', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  ['صغيرة', 'سريعة', 'ذكية'].forEach((t, i) => { const p = tw(lf, 96 + i * 12, 118 + i * 12); if (p > 0) s += at(W / 2 + (1 - i) * 260, 800, .6 + .4 * back(p), rect(-110, -46, 220, 92, 46, [C.teal, C.indigo, C.green][i]) + tx(t, 0, 17, 50, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  const card = tw(lf, 150, 180);
  if (card > 0) s += at(W / 2, 470, .8 + .2 * back(card), rect(-700, -250, 1400, 500, 60, '#fff', `filter="url(#sh)"`) + rect(-1, -150, 2, 300, 1, C.line), clamp(card * 2.5));
  const tg = eo(tw(lf, 196, 226));
  s += g(tx('محافظة البريمي', W / 2, 850, 64, { anchor: 'm', bold: 1 }) + tx('نحو مجتمع رقمي', W / 2, 930, 50, { anchor: 'm', fill: C.teal, bold: 1 }), `translate(0 ${n2((1 - tg) * 24)})`, tg);
  return s;
}
const DRAW = { intro: scIntro, what: scWhat, sw: scSwitch, chip: scChip, where: scWhere, why: scWhy, outro: scOutro };

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
      s += row(tx('أشباه الموصلات', PR, 0, 104, { bold: 1 }), inn(26), 470);
      s += row(tx('العقل الصغير داخل كل جهاز', PR, 0, 50, { fill: C.body }), inn(40), 560);
      ['أصغر', 'أسرع', 'أذكى'].forEach((t, k) => { const p = tw(lf, 196 + k * 30, 218 + k * 30); if (p > 0) s += g(at(PR - 100 - k * 216, 720, .6 + .4 * back(p), rect(-100, -44, 200, 88, 44, [C.teal, C.indigo, C.green][k]) + tx(t, 0, 16, 48, { anchor: 'm', fill: '#fff', bold: 1 })), '', clamp(p * 3) * out); });
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
