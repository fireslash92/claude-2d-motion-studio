// التقنية المالية في دقيقة — محافظة البريمي
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
  { id: 'pay', start: 300, end: 900, n: 1, title: 'الدفع اللاتلامسي', def: ['تدفع بتقريب الجوال أو البطاقة،', 'بدون نقد.'],
    steps: [['قرّب جوالك من جهاز الدفع', 150], ['انتظر إشارة القبول', 268], ['تم الدفع في ثانية', 338]], result: ['كوب الكرك بلمسة واحدة', 440] },
  { id: 'send', start: 900, end: 1500, n: 2, title: 'التحويل الفوري', def: ['ترسل المال لأي شخص،', 'ويصله في ثوانٍ.'],
    steps: [['اختر المستلم', 96], ['اكتب القيمة', 168], ['اضغط إرسال', 232]], result: ['20 ريالًا من البريمي إلى صلالة', 410] },
  { id: 'bank', start: 1500, end: 2100, n: 3, title: 'البنك في جوالك', def: ['كل خدمات البنك في تطبيق واحد،', 'في أي وقت.'],
    steps: [['تابع رصيدك', 126], ['ادفع فواتيرك', 215], ['بدون زيارة الفرع', 480]], result: ['فاتورة الكهرباء من البيت', 524] },
  { id: 'shop', start: 2100, end: 2700, n: 4, title: 'للمشاريع الصغيرة', def: ['استقبل المدفوعات الرقمية', 'بدون جهاز دفع.'],
    steps: [['الزبون يمسح رمز الدفع', 130], ['يدفع من جواله', 250], ['المال يصل فورًا', 350]], result: ['زبائن أكثر ومبيعات أعلى', 470] },
  { id: 'safe', start: 2700, end: 3240, n: 5, title: 'الأمان أولًا', def: ['احمِ حسابك بعادات بسيطة.'],
    steps: [['لا تشارك رمز التحقق', 100], ['البنك لا يطلب الرمز أبدًا', 215], ['تأكد من التطبيق والرابط', 320]], result: ['حسابك بأمان', 440] },
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
  pay: c => rect(-22, -40, 44, 80, 9, 'none', stroke(c, 7)) + `<path d="M34 -22 a30 30 0 0 1 0 44 M46 -34 a46 46 0 0 1 0 68" fill="none" ${stroke(c, 7)}/>`,
  send: c => `<path d="M-40 -16 H30 M12 -34 L32 -16 L12 2 M40 18 H-30 M-12 0 L-32 18 L-12 36" fill="none" ${stroke(c, 8)}/>`,
  bank: c => `<path d="M-42 -14 L0 -40 L42 -14 Z M-34 -6 V28 M-12 -6 V28 M12 -6 V28 M34 -6 V28 M-44 36 H44" fill="none" ${stroke(c, 7)}/>`,
  shop: c => `<path d="M-40 -8 L-32 -36 H32 L40 -8 Z M-34 -6 V38 H34 V-6 M-8 38 V14 H12 V38" fill="none" ${stroke(c, 7)}/>`,
  safe: c => `<path d="M0 -42 L36 -28 V4 Q32 30 0 44 Q-32 30 -36 4 V-28 Z M-14 2 L-3 13 L17 -11" fill="none" ${stroke(c, 7)}/>`,
};
const ICON_OF = ['pay', 'send', 'bank', 'shop', 'safe'], ICON_COL = [C.teal, C.indigo, C.indigo, C.green, C.magenta];

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
function scIntro(f, lf) {
  const wave = arm2(lf, [[0, -8, -6], [40, -150, -30], [280, -150, -30], [300, -40, -20]]); wave[1] += lf > 40 && lf < 280 ? 22 * sin((lf - 40) / 9) : 0;
  const man = { x: 430, y: GY, s: 1.22, f, R: wave, L: [18, -118], heldL: heldPhone(8) };
  const tiles = [['pay', 150, 300, 70], ['send', 760, 250, 95], ['bank', 820, 520, 120], ['shop', 120, 560, 145], ['safe', 640, 720, 170]];
  let s = '';
  tiles.forEach(([k, x, y, a], i) => { const p = tw(lf, a, a + 24); if (p <= 0) return;
    s += at(x, y + 8 * sin(f / 40 + i), .5 + .5 * back(p), rect(-62, -62, 124, 124, 30, '#fff', `filter="url(#sh)"`) + at(0, 0, .78, ICON[k](ICON_COL[ICON_OF.indexOf(k)])), clamp(p * 3)); });
  return s + person(man);
}
function scPay(f, lf) {
  const R = arm2(lf, [[0, -8, -8], [150, -8, -8], [215, -58, -34], [400, -58, -34], [450, -18, -60], [600, -18, -60]]);
  const man = { x: 300, y: GY, s: 1.08, f, R, L: [8, 6], heldR: heldPhone(-6, lf > 338 ? '#BFEBD8' : C.cyan), tilt: lf > 150 && lf < 420 ? 3 : 0 };
  const hp = hand(man, 'R', -60), ok = lf >= 338, state = ok ? 'ok' : lf > 240 ? 'wait' : 'idle';
  const hop = lf > 440 && lf < 480 ? -26 * sin(PI * (lf - 440) / 40) : 0;
  let s = '';
  s += rect(560, 250, 480, 22, 11, C.indigo) + [0, 1, 2, 3, 4, 5].map(i => path(`M${568 + i * 78} 272 h78 v52 q-39 26 -78 0Z`, i % 2 ? '#fff' : C.teal, stroke('#CFE3EC', 2))).join('');   // awning
  s += rect(836, 372, 190, 96, 18, '#fff', `filter="url(#sh)"`) + tx('كرك', 1006, 414, 36, { bold: 1 }) + num('0.200', 856, 448, 34, { bold: 1, fill: C.teal }) + tx('ر.ع', 1006, 450, 26, { fill: C.mute });      // menu board
  s += rect(560, 650, 480, 210, 16, C.indigo) + rect(548, 630, 504, 34, 12, '#3D4F99') + [0, 1, 2, 3].map(i => rect(600 + i * 110, 700, 70, 130, 12, '#5F76BD')).join('');                              // counter
  s += pos(680, 632, 1.15, state, '0.200') + cup(910, 630 + hop, f);
  s += person(man);
  s += waves(hp[0] + 26, hp[1] - 6, -8, lf, 232) + waves(hp[0] + 26, hp[1] - 6, -8, lf, 284);
  if (ok) s += ripple(680, 490, tw(lf, 338, 374), C.green, 110);
  s += pill(640, 392, 'تم الدفع', tw(lf, 346, 368), { w: 340, num: '0.200' });
  if (lf > 440) [0, 1, 2].forEach(k => { const p = tw(lf, 440 + k * 6, 480 + k * 6); if (p > 0 && p < 1) s += at(910 + [-56, 0, 58][k], 500 - 50 * eo(p) - [0, 30, 6][k], 1 - p * .3, path('M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4Z', C.gold), 1 - p); });
  return s;
}
function scSend(f, lf) {
  const happy = lf > 400 && lf < 520 ? 1 : 0;
  const A = { x: 190, y: GY, s: .98, f, R: arm2(lf, [[0, -14, -96], [232, -14, -96], [246, -22, -100], [262, -14, -96], [600, -14, -96]]), L: [8, 6], heldR: heldPhone(-4) };
  const B = { x: 890, y: GY, s: .98, f, seed: 60, k1: C.green, k2: C.teal, L: [14, 98], R: happy ? [-150 + 14 * sin(lf / 7), -24] : [-8, -6], heldL: heldPhone(4, lf > 396 ? '#BFEBD8' : C.cyan) };
  const pa = hand(A, 'R', -50), pb = hand(B, 'L', -50);
  let s = '';
  // route under the card: dotted arc with a travelling coin
  const cx = (pa[0] + pb[0]) / 2, cy = 740, d = `M${n2(pa[0])} ${n2(pa[1])} Q${cx} ${cy} ${n2(pb[0])} ${n2(pb[1])}`;
  const rp = tw(lf, 250, 300);
  if (rp > 0) s += `<path d="${d}" fill="none" ${stroke('#93A6D0', 7)} stroke-dasharray="0.1 3.4" pathLength="100" opacity="${n2(rp)}"/>`;
  // transfer form
  const up = eo(tw(lf, 30, 62)), sent = lf >= 262;
  let ui = rect(0, 0, 320, 396, 30, '#fff', `filter="url(#sh)"`) + rect(0, 0, 320, 70, 30, C.indigo) + rect(0, 40, 320, 30, 0, C.indigo) + tx('تحويل', 160, 47, 34, { anchor: 'm', fill: '#fff', bold: 1 });
  const r1 = eo(tw(lf, 96, 118)); ui += g(rect(20, 90, 280, 78, 18, lf >= 96 && lf < 168 ? '#DFF3F8' : C.soft) + circ(262, 129, 26, C.green) + path('M250 140 q12 -16 24 0', 'none', stroke('#fff', 4)) + circ(262, 122, 7, '#fff') + tx('أخوي سالم', 222, 142, 34, { bold: 1 }), `translate(${n2((1 - r1) * 30)} 0)`, r1);
  const amt = 20 * eo(tw(lf, 168, 214)); if (lf >= 160) ui += g(rect(20, 186, 280, 96, 18, lf >= 168 && lf < 232 ? '#DFF3F8' : C.soft) + num(amt.toFixed(3), 40, 252, 56, { bold: 1 }) + tx('ر.ع', 284, 250, 30, { fill: C.mute }), '', tw(lf, 160, 172));
  const press = lf >= 232 && lf < 262 ? .94 : 1;
  ui += at(160, 336, press, rect(-140, -36, 280, 72, 36, sent ? C.green : C.teal) + (sent ? check(-92, 0, .8, '#fff', tw(lf, 262, 280), 7) + tx('تم الإرسال', 112, 13, 34, { fill: '#fff', bold: 1 }) : tx('إرسال', 0, 13, 36, { anchor: 'm', fill: '#fff', bold: 1 })));
  s += g(ui, `translate(380 ${n2(170 + (1 - up) * 50)})`, up) + ripple(540, 506, tw(lf, 232, 262), C.teal, 70);
  s += person(A) + person(B);
  const cp = tw(lf, 300, 390);
  if (cp > 0 && cp < 1) { const u = eio(cp), x = (1 - u) * (1 - u) * pa[0] + 2 * (1 - u) * u * cx + u * u * pb[0], y = (1 - u) * (1 - u) * pa[1] + 2 * (1 - u) * u * cy + u * u * pb[1]; s += coin(x, y, 30); }
  s += ripple(pb[0], pb[1], tw(lf, 390, 430), C.green, 90) + pill(878, 286, 'وصلت', tw(lf, 396, 418), { w: 364, num: '+20.000', size: 34 });
  const lab = (x, t, p) => at(x, 956, .7 + .3 * back(p), rect(-110, -30, 220, 60, 30, '#fff', stroke(C.line, 3)) + path('M78 -14 a12 12 0 1 1 0.1 0 M78 14 l-9 -14 h18Z', C.magenta) + tx(t, 52, 12, 32, { bold: 1 }), clamp(p * 3));
  s += lab(A.x, 'البريمي', tw(lf, 60, 84)) + lab(B.x, 'صلالة', tw(lf, 80, 104));
  return s;
}
function scBank(f, lf) {
  const man = { x: 250, y: GY, s: 1.06, f, R: arm2(lf, [[0, -16, -100], [330, -16, -100], [344, -24, -104], [360, -16, -100], [600, -16, -100]]), L: [8, 6], heldR: heldPhone(-4), tilt: 4 };
  let s = '';
  // home: window, clock, plant
  s += rect(70, 190, 210, 230, 22, '#fff', stroke(C.line, 5)) + rect(84, 204, 182, 202, 12, '#CFE4F6') + circ(210, 262, 30, '#FBE3A6') + path('M175 204 V406 M84 305 H266', 'none', stroke('#fff', 6));
  const hh = lf / 600 * 2 * PI;
  s += circ(430, 250, 54, '#fff', stroke(C.indigo, 6)) + path(`M430 250 L${n2(430 + 34 * sin(hh * 6))} ${n2(250 - 34 * cos(hh * 6))} M430 250 L${n2(430 + 22 * sin(hh))} ${n2(250 - 22 * cos(hh))}`, 'none', stroke(C.ink, 6));
  s += rect(48, 790, 70, 70, 14, C.magenta) + path(`M83 790 q-50 -70 -18 -150 q20 70 18 150 M83 790 q52 -60 30 -140 q-28 60 -30 140 M83 790 q-4 -90 6 -190 q14 100 -6 190`, C.green);
  // banking app
  const paid = lf >= 360, bal = paid ? lerp(245.5, 233, eo(tw(lf, 360, 410))) : 245.5 * eo(tw(lf, 80, 130)) / 1 || 0;
  const balShown = lf < 80 ? 0 : lf < 130 ? 245.5 * eo(tw(lf, 80, 130)) : bal;
  let ui = tx('حسابي', 252, 78, 30, { bold: 1 }) + circ(34, 66, 16, C.soft);
  ui += rect(16, 100, 244, 150, 24, C.indigo) + circ(226, 126, 60, '#6079C2', 'opacity=".5"') + tx('الرصيد المتاح', 240, 142, 24, { fill: '#DCE4F7' }) + num(balShown.toFixed(3), 32, 214, 44, { bold: 1, fill: '#fff' }) + tx('ر.ع', 244, 212, 24, { fill: '#DCE4F7' });
  ui += tx('الفواتير', 252, 300, 28, { bold: 1 });
  const b1 = eo(tw(lf, 215, 237)), b2 = eo(tw(lf, 229, 251)), press = lf >= 330 && lf < 360 ? .92 : 1;
  ui += g(rect(16, 320, 244, 104, 20, paid ? '#E2F5EC' : lf >= 215 ? '#DFF3F8' : C.soft) + circ(222, 372, 26, C.gold) + path('M226 354 l-14 22 h10 l-4 16 l14 -22 h-10Z', '#fff') + tx('الكهرباء', 186, 366, 26, { bold: 1 }) + num('12.500', 186, 402, 24, { fill: C.body, anchor: 'r' }) +
    at(60, 372, press, rect(-38, -26, 76, 52, 26, paid ? C.green : C.teal) + (paid ? check(0, 0, .6, '#fff', tw(lf, 360, 378), 6) : tx('ادفع', 0, 10, 24, { anchor: 'm', fill: '#fff', bold: 1 }))), `translate(${n2((1 - b1) * 30)} 0)`, b1);
  ui += g(rect(16, 438, 244, 104, 20, C.soft) + circ(222, 490, 26, C.cyan) + path('M222 472 q-16 22 0 34 q16 -12 0 -34Z', '#fff') + tx('الماء', 186, 484, 26, { bold: 1 }) + num('4.200', 186, 520, 24, { fill: C.body, anchor: 'r' }) + rect(22, 464, 76, 52, 26, 'none', stroke(C.teal, 3)) + tx('ادفع', 60, 500, 24, { anchor: 'm', fill: C.teal, bold: 1 }), `translate(${n2((1 - b2) * 30)} 0)`, b2);
  const up = eo(tw(lf, 20, 54));
  s += g(phone(560, 150, 1.14, ui), `translate(0 ${n2((1 - up) * 60)})`, up) + ripple(560 + 1.14 * 72, 150 + 1.14 * 384, tw(lf, 330, 364), C.teal, 70);
  s += person(man);
  const p24 = tw(lf, 268, 292); s += at(978, 250, .5 + .5 * back(p24), circ(0, 0, 66, C.teal) + num('24/7', 0, 14, 40, { anchor: 'm', bold: 1, fill: '#fff' }), clamp(p24 * 3));
  s += pill(732, 916, 'تم دفع الفاتورة', tw(lf, 366, 388), { w: 380, size: 34 });
  const nb = tw(lf, 480, 504); s += at(980, 620, .5 + .5 * back(nb), rect(-72, -72, 144, 144, 34, '#fff', `filter="url(#sh)"`) + at(0, 0, 1, ICON.bank(C.mute)) + path('M-52 52 L52 -52', 'none', stroke(C.magenta, 10)), clamp(nb * 3));
  return s;
}
function scShop(f, lf) {
  const cust = { x: 190, y: GY, s: .96, f, R: arm2(lf, [[0, -10, -40], [100, -10, -40], [150, -50, -40], [290, -50, -40], [340, -16, -96], [600, -16, -96]]), L: [8, 6], heldR: heldPhone(-8, lf >= 262 ? '#BFEBD8' : C.cyan) };
  const happy = lf > 360 && lf < 470;
  const owner = { x: 800, y: GY, s: 1.0, f, kind: 'woman', seed: 90, R: happy ? [-150 + 12 * sin(lf / 7), -24] : [-10, -8], L: [16, 100], heldL: heldPhone(4, lf >= 356 ? '#BFEBD8' : C.cyan) };
  const hp = hand(cust, 'R', -60), po = hand(owner, 'L', -50);
  let s = '';
  s += rect(430, 220, 620, 24, 12, C.green) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => path(`M${438 + i * 76} 244 h76 v54 q-38 26 -76 0Z`, i % 2 ? '#fff' : C.green, stroke('#CDEBDD', 2))).join('') + rect(446, 244, 14, 420, 7, '#C9D5E6') + rect(1020, 244, 14, 420, 7, '#C9D5E6');
  s += person(owner);
  s += rect(430, 660, 620, 200, 16, '#3D4F99') + rect(418, 640, 644, 34, 12, C.indigo) + [0, 1, 2, 3, 4].map(i => rect(470 + i * 112, 706, 76, 124, 12, '#5F76BD')).join('');
  s += [[930, C.magenta], [990, C.gold]].map(([x, c]) => rect(x - 26, 584, 52, 56, 10, c) + rect(x - 30, 576, 60, 14, 7, '#fff', stroke(C.line, 2))).join('') + rect(900, 560, 70, 26, 8, C.teal);
  // QR stand
  s += path('M500 640 L522 470 H640 L662 640Z', '#fff', stroke(C.line, 3)) + qr(528, 490, 106) + tx('امسح وادفع', 581, 632, 20, { anchor: 'm', bold: 1, fill: C.indigo });
  const sp = tw(lf, 150, 262); if (sp > 0 && sp < 1) { const yy = 490 + 106 * (.5 - .5 * cos(sp * PI * 3)); s += rect(520, yy - 3, 122, 6, 3, C.magenta) + rect(520, yy - 16, 122, 30, 0, C.magenta, 'opacity=".18"'); }
  s += person(cust);
  s += ripple(581, 543, tw(lf, 262, 300), C.green, 100);
  const cp = tw(lf, 280, 352); if (cp > 0 && cp < 1) { const u = eio(cp), mx = (hp[0] + po[0]) / 2, my = 300; s += coin((1 - u) * (1 - u) * hp[0] + 2 * (1 - u) * u * mx + u * u * po[0], (1 - u) * (1 - u) * hp[1] + 2 * (1 - u) * u * my + u * u * po[1], 28); }
  s += ripple(po[0], po[1], tw(lf, 352, 392), C.green, 90) + pill(760, 372, 'تم الاستلام', tw(lf, 358, 380), { w: 380, num: '+3.500', size: 34 });
  const ch = tw(lf, 430, 452); if (ch > 0) { let bars = ''; [.3, .42, .38, .6, .95].forEach((h, i) => { const p = eo(tw(lf, 446 + i * 12, 486 + i * 12)); bars += rect(214 - i * 46, 150 - 110 * h * p, 32, 110 * h * p, 8, i === 4 ? C.green : '#B9C6E6'); });
    s += at(190, 262, .85 * (.7 + .3 * back(ch)), g(rect(0, 0, 280, 190, 26, '#fff', `filter="url(#sh)"`) + tx('مبيعات اليوم', 256, 40, 26, { bold: 1 }) + g(bars, 'translate(10 20)'), 'translate(-140 -95)'), clamp(ch * 3)); }
  return s;
}
function scSafe(f, lf) {
  const man = { x: 220, y: GY, s: 1.06, f, R: arm2(lf, [[0, -8, -6], [150, -8, -6], [190, -78, -98], [470, -78, -98], [520, -8, -6]]), L: [8, 6], tilt: lf > 150 && lf < 470 ? -3 : 0 };
  let s = '', ui = '';
  const blocked = tw(lf, 236, 256), b = back(tw(lf, 60, 84));
  ui += tx('الرسائل', 252, 78, 30, { bold: 1 });
  ui += at(138, 190, .6 + .4 * b, rect(-122, -84, 244, 168, 26, mixHex('#FBE9F4', '#EEF1F6', blocked), stroke(mixHex(C.magenta, '#C9D2E0', blocked), 3)) + tx('رقم غير معروف', 104, -44, 22, { fill: mixHex(C.magenta, C.mute, blocked), bold: 1 }) +
    tx('أنا موظف البنك،', 104, 4, 28, { fill: mixHex(C.ink, C.mute, blocked) }) + tx('أرسل رمز التحقق', 104, 46, 28, { fill: mixHex(C.ink, C.mute, blocked), bold: 1 }), clamp(tw(lf, 60, 70)));
  if (blocked > 0) ui += at(60, 290, .6 + .4 * back(blocked), rect(-46, -22, 92, 44, 22, C.mute) + tx('محظور', 0, 9, 22, { anchor: 'm', fill: '#fff', bold: 1 }), blocked);
  const o = eo(tw(lf, 96, 120));
  ui += g(rect(16, 330, 244, 190, 24, '#fff', stroke(C.line, 3)) + tx('رمز التحقق', 138, 372, 26, { anchor: 'm', bold: 1, fill: C.body }) + ['4', '8', '2', '9'].map((d, i) => rect(30 + i * 56, 396, 48, 64, 12, C.soft) + num(d, 54 + i * 56, 442, 40, { anchor: 'm', bold: 1 })).join('') + tx('سري، لك وحدك', 138, 500, 22, { anchor: 'm', fill: C.mute }), `translate(0 ${n2((1 - o) * 30)})`, o);
  const up = eo(tw(lf, 20, 54)), shake = lf > 196 && lf < 226 ? 9 * sin((lf - 196) * 1.3) * (1 - (lf - 196) / 30) : 0;
  s += g(phone(440, 150, 1.14, ui), `translate(${n2(shake)} ${n2((1 - up) * 60)})`, up);
  const st = tw(lf, 190, 206); if (st > 0) s += at(440 + 1.14 * 150, 150 + 1.14 * 438, lerp(1.9, 1, eo(st)), circ(0, 0, 92, 'none', stroke(C.magenta, 14)) + cross(0, 0, 3, C.magenta, 16), clamp(st * 2), -12);
  s += person(man);
  const sh = tw(lf, 290, 316); s += at(930, 300, .4 + .6 * back(sh), path('M0 -118 L100 -80 V10 Q90 86 0 124 Q-90 86 -100 10 V-80 Z', C.teal) + path('M0 -118 L100 -80 V10 Q90 86 0 124 Z', '#0F87A6') + rect(-34, -18, 68, 58, 12, '#fff') + path('M-20 -18 V-36 a20 20 0 0 1 40 0 V-18', 'none', stroke('#fff', 10)) + circ(0, 10, 9, C.teal), clamp(sh * 3));
  s += pill(928, 520, 'رابط مجهول', tw(lf, 330, 352), { w: 276, color: C.magenta, icon: 'x', size: 28, h: 64 });
  s += pill(928, 602, 'التطبيق الرسمي', tw(lf, 372, 394), { w: 276, size: 26, h: 64 });
  return s;
}
function scOutro(f, lf) {
  const labels = ['الدفع', 'التحويل', 'البنك', 'المشاريع', 'الأمان'], gone = tw(lf, 138, 162);
  let s = '';
  const head = eo(tw(lf, 4, 30));
  s += g(tx('التقنية المالية', W / 2, 250, 110, { anchor: 'm', bold: 1 }), `translate(0 ${n2((1 - head) * 30)})`, head * (1 - gone));
  labels.forEach((l, i) => { const p = tw(lf, 20 + i * 20, 44 + i * 20); if (p <= 0) return; const x = W / 2 + (2 - i) * 250;
    s += at(x, 500 - gone * 40, (.5 + .5 * back(p)), rect(-96, -96, 192, 192, 44, '#fff', `filter="url(#sh)"`) + at(0, -4, 1.1, ICON[ICON_OF[i]](ICON_COL[i])) + tx(l, 0, 160, 44, { anchor: 'm', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  ['أسهل', 'أسرع', 'آمن'].forEach((t, i) => { const p = tw(lf, 96 + i * 12, 118 + i * 12); if (p > 0) s += at(W / 2 + (1 - i) * 260, 800, .6 + .4 * back(p), rect(-110, -46, 220, 92, 46, [C.teal, C.indigo, C.green][i]) + tx(t, 0, 17, 50, { anchor: 'm', fill: '#fff', bold: 1 }), clamp(p * 3) * (1 - gone)); });
  const card = tw(lf, 150, 180);
  if (card > 0) s += at(W / 2, 470, .8 + .2 * back(card), rect(-700, -250, 1400, 500, 60, '#fff', `filter="url(#sh)"`) + rect(-1, -150, 2, 300, 1, C.line), clamp(card * 2.5));
  const tg = eo(tw(lf, 196, 226));
  s += g(tx('محافظة البريمي', W / 2, 850, 64, { anchor: 'm', bold: 1 }) + tx('نحو مجتمع رقمي', W / 2, 930, 50, { anchor: 'm', fill: C.teal, bold: 1 }), `translate(0 ${n2((1 - tg) * 24)})`, tg);
  return s;
}
const DRAW = { intro: scIntro, pay: scPay, send: scSend, bank: scBank, shop: scShop, safe: scSafe, outro: scOutro };

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
      s += row(tx('التقنية المالية', PR, 0, 112, { bold: 1 }), inn(26), 470);
      s += row(tx('خدماتك المالية من جوالك', PR, 0, 50, { fill: C.body }), inn(40), 560);
      ['أسرع', 'أسهل', 'آمن'].forEach((t, k) => { const p = tw(lf, 196 + k * 30, 218 + k * 30); if (p > 0) s += g(at(PR - 100 - k * 216, 720, .6 + .4 * back(p), rect(-100, -44, 200, 88, 44, [C.teal, C.indigo, C.green][k]) + tx(t, 0, 16, 48, { anchor: 'm', fill: '#fff', bold: 1 })), '', clamp(p * 3) * out); });
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
