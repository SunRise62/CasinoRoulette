// ── Data ──
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const SLICE = (2 * Math.PI) / 37;

function color(n) { return n === 0 ? 'green' : RED.has(n) ? 'red' : 'black'; }

// ── Canvas ──
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const W = 320, R = 152, CX = 160, CY = 160;

function drawWheel(a) {
  ctx.clearRect(0, 0, W, W);

  ctx.beginPath();
  ctx.arc(CX, CY, R + 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#0a0a0f';
  ctx.fill();

  SEQ.forEach((num, i) => {
    const s = a + i * SLICE - Math.PI / 2;
    const e = s + SLICE;
    const c = color(num);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, s, e);
    ctx.closePath();

    const mx = CX + (R * 0.65) * Math.cos(s + SLICE / 2);
    const my = CY + (R * 0.65) * Math.sin(s + SLICE / 2);
    const grad = ctx.createRadialGradient(mx, my, 0, CX, CY, R);
    if (c === 'red') {
      grad.addColorStop(0, '#3d1010');
      grad.addColorStop(1, '#1a0505');
    } else if (c === 'green') {
      grad.addColorStop(0, '#0d3018');
      grad.addColorStop(1, '#041208');
    } else {
      grad.addColorStop(0, '#18181f');
      grad.addColorStop(1, '#0a0a0f');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(s + SLICE / 2);
    ctx.textAlign = 'right';
    ctx.font = `500 9.5px 'DM Sans', sans-serif`;
    ctx.fillStyle = c === 'green' ? '#4ade80' : c === 'red' ? '#fca5a5' : 'rgba(255,255,255,0.7)';
    ctx.fillText(num, R - 7, 3.5);
    ctx.restore();
  });

  [
    { r: R,     w: 1,   col: 'rgba(255,255,255,0.08)' },
    { r: R - 20, w: 12, col: 'rgba(255,255,255,0.02)' },
    { r: R - 20, w: 1,  col: 'rgba(255,255,255,0.06)' },
    { r: R - 28, w: 1,  col: 'rgba(255,255,255,0.04)' },
  ].forEach(({ r, w, col }) => {
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, 2 * Math.PI);
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
  });

  const tickR = R - 14;
  SEQ.forEach((_, i) => {
    const ang = a + i * SLICE - Math.PI / 2 + SLICE / 2;
    ctx.beginPath();
    ctx.moveTo(CX + (tickR - 4) * Math.cos(ang), CY + (tickR - 4) * Math.sin(ang));
    ctx.lineTo(CX + (tickR + 4) * Math.cos(ang), CY + (tickR + 4) * Math.sin(ang));
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const cg = ctx.createRadialGradient(CX - 6, CY - 6, 0, CX, CY, 26);
  cg.addColorStop(0, '#2a2a3a');
  cg.addColorStop(1, '#111118');
  ctx.beginPath();
  ctx.arc(CX, CY, 26, 0, 2 * Math.PI);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
}

drawWheel(0);

// ── Spin ──
let angle = 0;
let spinning = false;
let hist = [];

function spin() {
  if (spinning) return;
  spinning = true;
  document.getElementById('spin-btn').disabled = true;

  const chip = document.getElementById('res-chip');
  chip.className = 'result-chip';
  chip.textContent = '—';
  document.getElementById('res-main').textContent = '…';
  document.getElementById('res-sub').textContent = '\u00a0';
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('lit'));
  ['color','parity','range','dozen','col','num'].forEach(k => {
    document.getElementById('cv-' + k).textContent = '—';
  });
  document.getElementById('wheel-container').style.setProperty('--wheel-glow', 'rgba(124,111,255,0.1)');

  const result = Math.floor(Math.random() * 37);
  const idx = SEQ.indexOf(result);
  const target = -(idx * SLICE);
  const extra = (7 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
  const from = angle;
  const to = target - extra;
  const duration = 5000;
  const t0 = performance.now();

  function frame(now) {
    const t = Math.min((now - t0) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    drawWheel(from + (to - from) * ease);
    if (t < 1) { requestAnimationFrame(frame); return; }
    angle = to % (2 * Math.PI);
    drawWheel(angle);
    spinning = false;
    document.getElementById('spin-btn').disabled = false;
    showResult(result);
  }
  requestAnimationFrame(frame);
}

function showResult(n) {
  const c = color(n);

  const glow = c === 'red' ? 'rgba(229,69,58,0.12)' : c === 'green' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)';
  document.getElementById('wheel-container').style.setProperty('--wheel-glow', glow);

  setTimeout(() => {
    const chip = document.getElementById('res-chip');
    chip.textContent = n;
    chip.className = 'result-chip ' + c;

    const colorLabel = c === 'red' ? 'Rouge' : c === 'black' ? 'Noir' : 'Vert (zéro)';
    document.getElementById('res-main').textContent = n === 0 ? 'Zéro — Vert' : `${n} — ${colorLabel}`;
    document.getElementById('res-sub').textContent = n === 0
      ? 'Les mises simples ne gagnent pas (sauf variante en prison)'
      : (n % 2 === 0 ? 'Pair' : 'Impair') + ' · ' + (n <= 18 ? 'Manque (1–18)' : 'Passe (19–36)');

    if (n === 0) {
      setTimeout(() => light('cat-num', 'cv-num', '0'), 60);
    } else {
      const colorVal  = c === 'red' ? 'Rouge' : 'Noir';
      const parityVal = n % 2 === 0 ? 'Pair' : 'Impair';
      const rangeVal  = n <= 18 ? 'Manque (1–18)' : 'Passe (19–36)';
      const dozVal    = n <= 12 ? '1re douzaine' : n <= 24 ? '2e douzaine' : '3e douzaine';
      const colVal    = n % 3 === 1 ? '1re colonne' : n % 3 === 2 ? '2e colonne' : '3e colonne';

      setTimeout(() => light('cat-color',  'cv-color',  colorVal),  60);
      setTimeout(() => light('cat-parity', 'cv-parity', parityVal), 180);
      setTimeout(() => light('cat-range',  'cv-range',  rangeVal),  300);
      setTimeout(() => light('cat-dozen',  'cv-dozen',  dozVal),    420);
      setTimeout(() => light('cat-col',    'cv-col',    colVal),    540);
      setTimeout(() => light('cat-num',    'cv-num',    `${n}`),    660);
    }
  }, 250);

  hist.unshift(n);
  if (hist.length > 20) hist.pop();
  renderHist();
}

function light(cardId, valId, val) {
  document.getElementById(cardId).classList.add('lit');
  document.getElementById(valId).textContent = val;
}

function renderHist() {
  const el = document.getElementById('history');
  el.innerHTML = '';
  hist.forEach((n, i) => {
    const d = document.createElement('div');
    d.className = 'h-dot ' + color(n);
    d.textContent = n;
    d.style.opacity = Math.max(0.2, 1 - i * 0.04);
    el.appendChild(d);
  });
}
