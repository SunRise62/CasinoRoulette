// ── Constants ──
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const TAU        = 2 * Math.PI;
const SLICE      = TAU / 37;
const RESULT_DELAY = 300;
const LIGHT_STEP   = 120;

function color(n) { return n === 0 ? 'green' : RED.has(n) ? 'red' : 'black'; }

// ── Canvas ──
const canvas = document.getElementById('wheel');
const ctx    = canvas.getContext('2d');
const W = 320, CX = 160, CY = 160;
const R_OUTER = 152;
const R_TRACK = 133;   // anneau de la bille
const R_LAND  = 112;   // où la bille atterrit (dans les cases)
const BALL_R  = 5;

// ── State ──
let wheelAngle = 0;
let ballAngle  = -Math.PI / 2; // commence au sommet
let spinning   = false;
let hist       = [];

// ── Dessin de la roue ──
function drawWheel(wa, ba, ballR) {
  ctx.clearRect(0, 0, W, W);

  // fond
  ctx.beginPath();
  ctx.arc(CX, CY, R_OUTER + 4, 0, TAU);
  ctx.fillStyle = '#080810';
  ctx.fill();

  // rebord doré
  const rimG = ctx.createLinearGradient(CX - R_OUTER, CY - R_OUTER, CX + R_OUTER, CY + R_OUTER);
  rimG.addColorStop(0,   'rgba(200,170,80,0.7)');
  rimG.addColorStop(0.4, 'rgba(240,210,120,0.9)');
  rimG.addColorStop(0.6, 'rgba(200,160,60,0.6)');
  rimG.addColorStop(1,   'rgba(180,140,50,0.7)');
  ctx.beginPath();
  ctx.arc(CX, CY, R_OUTER + 1, 0, TAU);
  ctx.strokeStyle = rimG;
  ctx.lineWidth = 5;
  ctx.stroke();

  // cases
  SEQ.forEach((num, i) => {
    const s = wa + i * SLICE - Math.PI / 2;
    const e = s + SLICE;
    const c = color(num);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R_OUTER - 3, s, e);
    ctx.closePath();

    const mx = CX + (R_OUTER * 0.65) * Math.cos(s + SLICE / 2);
    const my = CY + (R_OUTER * 0.65) * Math.sin(s + SLICE / 2);
    const gr = ctx.createRadialGradient(mx, my, 0, CX, CY, R_OUTER);
    if (c === 'red') {
      gr.addColorStop(0, '#6b1414');
      gr.addColorStop(1, '#2a0606');
    } else if (c === 'green') {
      gr.addColorStop(0, '#0f4a20');
      gr.addColorStop(1, '#041508');
    } else {
      gr.addColorStop(0, '#1c1c28');
      gr.addColorStop(1, '#0c0c14');
    }
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(s + SLICE / 2);
    ctx.textAlign = 'right';
    ctx.font = `700 9px 'DM Sans', sans-serif`;
    ctx.fillStyle = c === 'green' ? '#5ef090' : c === 'red' ? '#ffb0b0' : 'rgba(255,255,255,0.8)';
    ctx.fillText(num, R_OUTER - 8, 3.5);
    ctx.restore();
  });

  // anneaux internes
  [
    { r: R_OUTER - 3,  w: 1,   col: 'rgba(200,170,80,0.2)' },
    { r: R_OUTER - 16, w: 10,  col: 'rgba(0,0,0,0.55)' },
    { r: R_OUTER - 16, w: 1,   col: 'rgba(200,170,80,0.15)' },
    { r: R_OUTER - 28, w: 1,   col: 'rgba(255,255,255,0.06)' },
  ].forEach(({ r, w, col }) => {
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, TAU);
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
  });

  // ticks séparateurs
  const tickR = R_OUTER - 19;
  SEQ.forEach((_, i) => {
    const ang = wa + i * SLICE - Math.PI / 2 + SLICE / 2;
    ctx.beginPath();
    ctx.moveTo(CX + (tickR - 3) * Math.cos(ang), CY + (tickR - 3) * Math.sin(ang));
    ctx.lineTo(CX + (tickR + 3) * Math.cos(ang), CY + (tickR + 3) * Math.sin(ang));
    ctx.strokeStyle = 'rgba(200,170,80,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // centre
  const cg = ctx.createRadialGradient(CX - 8, CY - 8, 0, CX, CY, 32);
  cg.addColorStop(0, '#3a3050');
  cg.addColorStop(1, '#10101a');
  ctx.beginPath();
  ctx.arc(CX, CY, 32, 0, TAU);
  ctx.fillStyle = cg;
  ctx.fill();

  const rimC = ctx.createLinearGradient(CX - 32, CY - 32, CX + 32, CY + 32);
  rimC.addColorStop(0,   'rgba(200,170,80,0.6)');
  rimC.addColorStop(0.5, 'rgba(240,210,120,0.8)');
  rimC.addColorStop(1,   'rgba(180,140,50,0.5)');
  ctx.strokeStyle = rimC;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, 7, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  // ── bille ──
  if (ba !== null) {
    const bx = CX + ballR * Math.cos(ba);
    const by = CY + ballR * Math.sin(ba);

    // ombre
    const sh = ctx.createRadialGradient(bx + 2, by + 2.5, 0, bx + 2, by + 2.5, BALL_R + 2);
    sh.addColorStop(0, 'rgba(0,0,0,0.6)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(bx + 2, by + 2.5, BALL_R + 2, 0, TAU);
    ctx.fillStyle = sh;
    ctx.fill();

    // sphère ivoire
    const bg = ctx.createRadialGradient(bx - 1.8, by - 2, 0.5, bx, by, BALL_R);
    bg.addColorStop(0,   '#fffff5');
    bg.addColorStop(0.35,'#e8e4cc');
    bg.addColorStop(1,   '#a09070');
    ctx.beginPath();
    ctx.arc(bx, by, BALL_R, 0, TAU);
    ctx.fillStyle = bg;
    ctx.fill();

    // reflet
    ctx.beginPath();
    ctx.arc(bx - 1.4, by - 1.8, 1.6, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
  }
}

drawWheel(0, ballAngle, R_TRACK);

// ── DOM refs ──
const spinBtn       = document.getElementById('spin-btn');
const resChip       = document.getElementById('res-chip');
const resMain       = document.getElementById('res-main');
const resSub        = document.getElementById('res-sub');
const wheelCont     = document.getElementById('wheel-container');
const histEl        = document.getElementById('history');
const accordionBtn  = document.getElementById('accordion-btn');
const accordionBody = document.getElementById('accordion-body');
const accordionIcon = document.getElementById('accordion-icon');

// ── Accordion ──
accordionBtn.addEventListener('click', () => {
  const open = accordionBody.classList.toggle('open');
  accordionIcon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  accordionBtn.setAttribute('aria-expanded', String(open));
});

// ── Spin ──
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;

  resChip.className = 'result-chip';
  resChip.textContent = '—';
  resMain.textContent = '…';
  resSub.textContent = '\u00a0';
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('lit'));
  ['color','parity','range','dozen','col','num'].forEach(k => {
    const el = document.getElementById('cv-' + k);
    if (el) el.textContent = '—';
  });
  wheelCont.style.setProperty('--wheel-glow', 'rgba(124,111,255,0.1)');

  const result = Math.floor(Math.random() * 37);
  const idx    = SEQ.indexOf(result);

  // Angle cible de la roue :
  // Le milieu de la case idx doit pointer vers le sommet (−π/2).
  // Quand wheelAngle = wa, la case i est centrée à angle (wa + i*SLICE − π/2 + SLICE/2).
  // On veut : wa + idx*SLICE − π/2 + SLICE/2 = −π/2  →  wa = −idx*SLICE − SLICE/2
  const targetWheelAngle = -idx * SLICE - SLICE / 2;
  const wheelFrom  = wheelAngle;
  // Tours supplémentaires dans le sens négatif (sens horaire)
  const wheelExtra = -(7 + Math.floor(Math.random() * 4)) * TAU;
  const wheelTo    = targetWheelAngle + wheelExtra;

  // Bille : tourne en sens positif (anti-horaire), atterrit au sommet (−π/2)
  const ballFrom  = ballAngle;
  const ballExtra = (9 + Math.floor(Math.random() * 5)) * TAU;
  // Position finale : sommet = −π/2 (sous le pointeur)
  const ballTo    = -Math.PI / 2 + ballExtra;

  const duration = 6200;
  const t0 = performance.now();

  function easeW(t) { return 1 - Math.pow(1 - t, 4); }
  function easeB(t) { return 1 - Math.pow(1 - t, 3.2); }

  function frame(now) {
    const t  = Math.min((now - t0) / duration, 1);
    const wa = wheelFrom + (wheelTo - wheelFrom) * easeW(t);
    const ba = ballFrom  + (ballTo  - ballFrom)  * easeB(t);

    // glissement vers l'intérieur dans les 25% finaux
    const land = Math.max(0, (t - 0.75) / 0.25);
    const curR = R_TRACK - (R_TRACK - R_LAND) * (land * land);

    drawWheel(wa, ba, curR);

    if (t < 1) { requestAnimationFrame(frame); return; }

    wheelAngle = ((wheelTo % TAU) + TAU) % TAU;
    ballAngle  = ((ballTo  % TAU) + TAU) % TAU;
    drawWheel(wheelAngle, ballAngle, R_LAND);

    spinning = false;
    spinBtn.disabled = false;
    showResult(result);
  }

  requestAnimationFrame(frame);
}

function getCategories(n) {
  return {
    color:  color(n) === 'red' ? 'Rouge' : 'Noir',
    parity: n % 2 === 0 ? 'Pair' : 'Impair',
    range:  n <= 18 ? 'Manque (1–18)' : 'Passe (19–36)',
    dozen:  n <= 12 ? '1re douzaine' : n <= 24 ? '2e douzaine' : '3e douzaine',
    col:    n % 3 === 1 ? '1re colonne' : n % 3 === 2 ? '2e colonne' : '3e colonne',
  };
}

function showResult(n) {
  const c = color(n);
  const glow = c === 'red'
    ? 'rgba(229,69,58,0.15)'
    : c === 'green'
      ? 'rgba(34,197,94,0.12)'
      : 'rgba(255,255,255,0.04)';
  wheelCont.style.setProperty('--wheel-glow', glow);

  setTimeout(() => {
    resChip.textContent = n;
    resChip.className = 'result-chip ' + c;

    const colorLabel = c === 'red' ? 'Rouge' : c === 'black' ? 'Noir' : 'Vert (zéro)';
    resMain.textContent = n === 0 ? 'Zéro — Vert' : `${n} — ${colorLabel}`;
    resSub.textContent  = n === 0
      ? 'Les mises simples ne gagnent pas (sauf variante en prison)'
      : (n % 2 === 0 ? 'Pair' : 'Impair') + ' · ' + (n <= 18 ? 'Manque (1–18)' : 'Passe (19–36)');

    if (n === 0) {
      setTimeout(() => light('cat-num', 'cv-num', '0'), LIGHT_STEP);
    } else {
      const cats = getCategories(n);
      [
        ['cat-color',  'cv-color',  cats.color],
        ['cat-parity', 'cv-parity', cats.parity],
        ['cat-range',  'cv-range',  cats.range],
        ['cat-dozen',  'cv-dozen',  cats.dozen],
        ['cat-col',    'cv-col',    cats.col],
        ['cat-num',    'cv-num',    `${n}`],
      ].forEach(([cardId, valId, val], i) => {
        setTimeout(() => light(cardId, valId, val), LIGHT_STEP * (i + 1));
      });
    }

    hist.unshift(n);
    if (hist.length > 20) hist.pop();
    renderHist();
  }, RESULT_DELAY);
}

function light(cardId, valId, val) {
  const card = document.getElementById(cardId);
  const el   = document.getElementById(valId);
  if (card) card.classList.add('lit');
  if (el)   el.textContent = val;
}

function renderHist() {
  histEl.replaceChildren(
    ...hist.map((n, i) => {
      const d = document.createElement('div');
      d.className = 'h-dot ' + color(n);
      d.textContent = n;
      d.style.opacity = String(Math.max(0.2, 1 - i * 0.04));
      return d;
    })
  );
}

spinBtn.addEventListener('click', spin);

document.addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter') && !spinning) {
    e.preventDefault();
    spin();
  }
});
