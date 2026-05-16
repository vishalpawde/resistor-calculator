/* =============================================
   RESISTOR COLOUR CODE CALCULATOR — JAVASCRIPT
   =============================================
   Features:
   - 4-Band, 5-Band, 6-Band support
   - Real-time band colour updates
   - Instant resistance calculation
   - Smart value formatting (Ω / KΩ / MΩ)
   - Animated number transitions
   - Canvas particle background
   ============================================= */

/* --- Colour Maps --- */
const COLOR_HEX = {
  black:  '#1a1a1a',
  brown:  '#8B4513',
  red:    '#ff2020',
  orange: '#ff8800',
  yellow: '#FFD700',
  green:  '#00aa44',
  blue:   '#1a6aff',
  violet: '#8B00FF',
  grey:   '#888888',
  white:  '#eeeeee',
  gold:   '#CFB53B',
  silver: '#C0C0C0',
};

const COLOR_GLOW = {
  black:  'rgba(100,100,100,0.3)',
  brown:  'rgba(139,69,19,0.6)',
  red:    'rgba(255,32,32,0.8)',
  orange: 'rgba(255,136,0,0.8)',
  yellow: 'rgba(255,215,0,0.8)',
  green:  'rgba(0,170,68,0.8)',
  blue:   'rgba(26,106,255,0.8)',
  violet: 'rgba(139,0,255,0.8)',
  grey:   'rgba(136,136,136,0.6)',
  white:  'rgba(220,220,220,0.5)',
  gold:   'rgba(207,181,59,0.8)',
  silver: 'rgba(192,192,192,0.6)',
};

const COLOR_NAME = {
  black: 'Black', brown: 'Brown', red: 'Red', orange: 'Orange',
  yellow: 'Yellow', green: 'Green', blue: 'Blue', violet: 'Violet',
  grey: 'Grey', white: 'White', gold: 'Gold', silver: 'Silver',
};

/* =============================================
   MODE INFO TEXT
   ============================================= */
const MODE_INFO = {
  4: '<strong>4-Band Resistor:</strong> Two significant digits + multiplier + tolerance. Formula: (D1 × 10 + D2) × Multiplier. Most common type for general-purpose use.',
  5: '<strong>5-Band Resistor:</strong> Three significant digits + multiplier + tolerance. Formula: (D1 × 100 + D2 × 10 + D3) × Multiplier. Used in precision resistors (1% tolerance or better).',
  6: '<strong>6-Band Resistor:</strong> Three significant digits + multiplier + tolerance + temperature coefficient. The 6th band indicates how resistance changes with temperature (ppm/K).',
};

/* =============================================
   STATE
   ============================================= */
let mode = 4; // current band mode: 4, 5, or 6

// Default state per mode
const defaultState = {
  4: { d1: 4, d2: 7, d3: null, mult: 100, tol: 5,  tempco: null, colors: ['yellow','violet','red','gold',null,null] },
  5: { d1: 4, d2: 7, d3: 2,   mult: 100, tol: 1,   tempco: null, colors: ['yellow','violet','red','brown','gold',null] },
  6: { d1: 4, d2: 7, d3: 2,   mult: 100, tol: 1,   tempco: 100,  colors: ['yellow','violet','red','brown','gold','brown'] },
};

let state = JSON.parse(JSON.stringify(defaultState[4]));

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  setMode(4);
  initParticles();
  initScrollReveal();
});

/* =============================================
   SET MODE — switches between 4 / 5 / 6 band
   ============================================= */
function setMode(newMode) {
  mode = newMode;
  state = JSON.parse(JSON.stringify(defaultState[newMode]));

  // Update mode buttons
  [4, 5, 6].forEach(m => {
    document.getElementById(`mode-${m}`).classList.toggle('active', m === newMode);
  });

  // Update hero badge highlight
  [4, 5, 6].forEach(m => {
    const badge = document.getElementById(`badge-${m}`);
    if (badge) badge.style.opacity = m === newMode ? '1' : '0.4';
  });

  // Update mode info text
  document.getElementById('mode-info-text').innerHTML = MODE_INFO[newMode];

  // Show/hide controls
  const grid = document.getElementById('controls-grid');
  grid.className = 'controls-grid';

  if (newMode === 4) {
    // Show 4 controls
    grid.classList.add('cols-4');
    showCtrl([1,2,3,4]);
    hideCtrl([5,6]);
    // Band 3 = Multiplier, Band 4 = Tolerance
    showSelect('band3-select');
    hideSelect('band3-digit-select');
    showSelect('band4-select');
    hideSelect('band4-mult-select');
    setCtrlLabel(3, 'Multiplier');
    setCtrlLabel(4, 'Tolerance');

  } else if (newMode === 5) {
    // Show 5 controls
    grid.classList.add('cols-5');
    showCtrl([1,2,3,4,5]);
    hideCtrl([6]);
    // Band 3 = Third Digit, Band 4 = Multiplier, Band 5 = Tolerance
    showSelect('band3-digit-select');
    hideSelect('band3-select');
    showSelect('band4-mult-select');
    hideSelect('band4-select');
    setCtrlLabel(3, 'Third Digit');
    setCtrlLabel(4, 'Multiplier');
    setCtrlLabel(5, 'Tolerance');

  } else if (newMode === 6) {
    // Show 6 controls
    grid.classList.add('cols-6');
    showCtrl([1,2,3,4,5,6]);
    // Band 3 = Third Digit, Band 4 = Multiplier, Band 5 = Tolerance, Band 6 = Temp Coeff
    showSelect('band3-digit-select');
    hideSelect('band3-select');
    showSelect('band4-mult-select');
    hideSelect('band4-select');
    setCtrlLabel(3, 'Third Digit');
    setCtrlLabel(4, 'Multiplier');
    setCtrlLabel(5, 'Tolerance');
    setCtrlLabel(6, 'Temp. Coeff.');
  }

  // Restore selects to default for this mode
  applyDefaultSelects(newMode);

  // Update resistor visual bands
  updateResistorVisual();
  // Update band labels
  updateBandLabels();
  // Update formula display
  updateFormulaCard();
  // Sync previews
  syncAllBands();
  // Calculate
  calculate();

  // Show/hide temp coeff in result
  const tempcoEl = document.getElementById('result-tempco');
  if (tempcoEl) tempcoEl.style.display = newMode === 6 ? 'block' : 'none';
}

/* --- Control helpers --- */
function showCtrl(nums) { nums.forEach(n => { const el = document.getElementById(`ctrl-${n}`); if(el) el.style.display = 'flex'; }); }
function hideCtrl(nums) { nums.forEach(n => { const el = document.getElementById(`ctrl-${n}`); if(el) el.style.display = 'none'; }); }
function showSelect(id) { const el = document.getElementById(id); if(el) el.style.display = ''; }
function hideSelect(id) { const el = document.getElementById(id); if(el) el.style.display = 'none'; }
function setCtrlLabel(n, text) { const el = document.getElementById(`ctrl-label-${n}`); if(el) el.textContent = text; }

/* =============================================
   APPLY DEFAULT SELECTS
   ============================================= */
function applyDefaultSelects(m) {
  const def = defaultState[m];
  const colors = def.colors;

  setSelectByValue('band1-select', colors[0]);
  setSelectByValue('band2-select', colors[1]);

  if (m === 4) {
    // band3 = multiplier
    setSelectByColorValue('band3-select', def.mult);
    // band4 = tolerance
    setSelectByTolValue('band4-select', def.tol);
  } else {
    // band3 = digit
    setSelectByValue('band3-digit-select', colors[2]);
    // band4 = multiplier
    setSelectByColorValue('band4-mult-select', def.mult);
    // band5 = tolerance
    setSelectByTolValue('band5-select', def.tol);
    if (m === 6) {
      setSelectByValue('band6-select', colors[5]);
    }
  }
}

function setSelectByColorValue(id, val) {
  const sel = document.getElementById(id);
  if (!sel) return;
  for (let i = 0; i < sel.options.length; i++) {
    if (parseFloat(sel.options[i].getAttribute('data-val')) === val) { sel.selectedIndex = i; break; }
  }
}
function setSelectByTolValue(id, val) { setSelectByColorValue(id, val); }

/* =============================================
   UPDATE RESISTOR VISUAL (bands shown/hidden)
   ============================================= */
function updateResistorVisual() {
  // All 6 bands + gap
  const bandEls = [1,2,3,4,5,6].map(n => document.getElementById(`band${n}`));
  const gapEl   = document.getElementById('band-gap');

  if (mode === 4) {
    // Show bands 1-3, gap, 4; hide 5,6
    [0,1,2,3].forEach(i => { bandEls[i].style.flex = '0 0 9%'; bandEls[i].style.opacity = '1'; });
    gapEl.style.flex = '0 0 7%';
    [4,5].forEach(i => { bandEls[i].style.flex = '0 0 0%'; bandEls[i].style.opacity = '0'; });

  } else if (mode === 5) {
    // Show bands 1-4, gap, 5; hide 6
    [0,1,2,3,4].forEach(i => { bandEls[i].style.flex = '0 0 8%'; bandEls[i].style.opacity = '1'; });
    gapEl.style.flex = '0 0 6%';
    bandEls[5].style.flex = '0 0 0%'; bandEls[5].style.opacity = '0';

  } else if (mode === 6) {
    // Show all 6 bands
    [0,1,2,3,4,5].forEach(i => { bandEls[i].style.flex = '0 0 7%'; bandEls[i].style.opacity = '1'; });
    gapEl.style.flex = '0 0 5%';
  }
}

/* =============================================
   UPDATE BAND LABELS
   ============================================= */
function updateBandLabels() {
  const labelsEl = document.getElementById('band-labels');
  let html = '';
  if (mode === 4) {
    html = `<span class="blabel">D1</span><span class="blabel">D2</span><span class="blabel">×</span><span class="blabel">TOL</span>`;
  } else if (mode === 5) {
    html = `<span class="blabel">D1</span><span class="blabel">D2</span><span class="blabel">D3</span><span class="blabel">×</span><span class="blabel">TOL</span>`;
  } else {
    html = `<span class="blabel">D1</span><span class="blabel">D2</span><span class="blabel">D3</span><span class="blabel">×</span><span class="blabel">TOL</span><span class="blabel">TC</span>`;
  }
  labelsEl.innerHTML = html;
}

/* =============================================
   UPDATE FORMULA CARD
   ============================================= */
function updateFormulaCard() {
  const display = document.getElementById('formula-display');
  const sub     = document.getElementById('formula-sub');
  if (mode === 4) {
    display.textContent = 'R = ( D1 × 10 + D2 ) × Multiplier';
    sub.textContent     = 'Where D1 = First digit, D2 = Second digit';
  } else {
    display.textContent = 'R = ( D1 × 100 + D2 × 10 + D3 ) × Multiplier';
    sub.textContent     = 'Where D1, D2, D3 = First, Second, Third digits';
  }
}

/* =============================================
   BAND UPDATE — called by onchange on selects
   ============================================= */
function updateBand(bandNum) {
  let sel, colorName, colorHex, value;

  if (mode === 4) {
    // band3 uses band3-select (multiplier), band4 = tolerance
    if (bandNum === 3) sel = document.getElementById('band3-select');
    else if (bandNum === 4) sel = document.getElementById('band4-select');
    else sel = document.getElementById(`band${bandNum}-select`);
  } else {
    // 5/6 band: band3 uses band3-digit-select, band4 uses band4-mult-select
    if (bandNum === 3) sel = document.getElementById('band3-digit-select');
    else if (bandNum === 4) sel = document.getElementById('band4-mult-select');
    else sel = document.getElementById(`band${bandNum}-select`);
  }

  if (!sel) return;

  const option = sel.options[sel.selectedIndex];
  colorName = sel.value;
  colorHex  = option.getAttribute('data-color');
  value     = parseFloat(option.getAttribute('data-val'));

  // Update visual band
  const bandEl = document.getElementById(`band${bandNum}`);
  if (bandEl) {
    bandEl.style.backgroundColor = colorHex;
    bandEl.style.boxShadow = `0 0 12px ${COLOR_GLOW[colorName]}, 0 0 3px rgba(255,255,255,0.3)`;
    bandEl.classList.remove('band-pop');
    void bandEl.offsetWidth;
    bandEl.classList.add('band-pop');
  }

  // Update preview circle
  const preview = document.getElementById(`preview${bandNum}`);
  if (preview) {
    preview.style.backgroundColor = colorHex;
    preview.style.boxShadow = `0 0 10px ${COLOR_GLOW[colorName]}`;
  }

  // Update state
  if (mode === 4) {
    if (bandNum === 1) { state.d1 = value; state.colors[0] = colorName; }
    if (bandNum === 2) { state.d2 = value; state.colors[1] = colorName; }
    if (bandNum === 3) { state.mult = value; state.colors[2] = colorName; }
    if (bandNum === 4) { state.tol = value; state.colors[3] = colorName; }
  } else {
    if (bandNum === 1) { state.d1 = value; state.colors[0] = colorName; }
    if (bandNum === 2) { state.d2 = value; state.colors[1] = colorName; }
    if (bandNum === 3) { state.d3 = value; state.colors[2] = colorName; }
    if (bandNum === 4) { state.mult = value; state.colors[3] = colorName; }
    if (bandNum === 5) { state.tol = value; state.colors[4] = colorName; }
    if (bandNum === 6) { state.tempco = value; state.colors[5] = colorName; }
  }

  updateDigitDisplays();
  calculate();
}

/* =============================================
   SYNC ALL BANDS — apply initial colours
   ============================================= */
function syncAllBands() {
  const activeBands = mode === 4 ? [1,2,3,4] : mode === 5 ? [1,2,3,4,5] : [1,2,3,4,5,6];

  activeBands.forEach(n => {
    let sel;
    if (mode === 4) {
      if (n === 3) sel = document.getElementById('band3-select');
      else if (n === 4) sel = document.getElementById('band4-select');
      else sel = document.getElementById(`band${n}-select`);
    } else {
      if (n === 3) sel = document.getElementById('band3-digit-select');
      else if (n === 4) sel = document.getElementById('band4-mult-select');
      else sel = document.getElementById(`band${n}-select`);
    }
    if (!sel) return;

    const option   = sel.options[sel.selectedIndex];
    const colorHex  = option.getAttribute('data-color');
    const colorName = sel.value;

    const bandEl = document.getElementById(`band${n}`);
    if (bandEl) {
      bandEl.style.backgroundColor = colorHex;
      bandEl.style.boxShadow = `0 0 12px ${COLOR_GLOW[colorName]}, 0 0 3px rgba(255,255,255,0.3)`;
    }
    const preview = document.getElementById(`preview${n}`);
    if (preview) {
      preview.style.backgroundColor = colorHex;
      preview.style.boxShadow = `0 0 10px ${COLOR_GLOW[colorName]}`;
    }
  });
  updateDigitDisplays();
}

/* =============================================
   DIGIT DISPLAY LABELS
   ============================================= */
function updateDigitDisplays() {
  const { d1, d2, d3, mult, tol, tempco } = state;

  document.getElementById('digit1').textContent = d1;
  document.getElementById('digit2').textContent = d2;

  if (mode === 4) {
    document.getElementById('digit3').textContent = formatMultLabel(mult);
    document.getElementById('digit4').textContent = `±${tol}%`;
  } else {
    document.getElementById('digit3').textContent = d3 !== null ? d3 : '—';
    document.getElementById('digit4').textContent = formatMultLabel(mult);
    document.getElementById('digit5').textContent = `±${tol}%`;
    if (mode === 6) {
      document.getElementById('digit6').textContent = tempco !== null ? `${tempco} ppm/K` : '—';
    }
  }
}

function formatMultLabel(mult) {
  if (mult >= 1000000) return `×${mult/1000000}M`;
  if (mult >= 1000)    return `×${mult/1000}K`;
  return `×${mult}`;
}

/* =============================================
   CALCULATION ENGINE
   ============================================= */
function calculate() {
  const { d1, d2, d3, mult, tol, tempco, colors } = state;

  let base, ohms;
  if (mode === 4) {
    base = d1 * 10 + d2;
    ohms = base * mult;
  } else {
    base = d1 * 100 + d2 * 10 + (d3 || 0);
    ohms = base * mult;
  }

  const rawFormatted = formatOhms(ohms);
  const engFormatted = formatEngineering(ohms);
  const minVal = ohms * (1 - tol / 100);
  const maxVal = ohms * (1 + tol / 100);

  animateValue('result-value', rawFormatted);
  document.getElementById('result-formatted').textContent  = engFormatted;
  document.getElementById('result-tolerance').textContent  = `Tolerance: ±${tol}%`;

  // Temp coefficient line (6-band only)
  const tempcoEl = document.getElementById('result-tempco');
  if (tempcoEl && mode === 6 && tempco !== null) {
    tempcoEl.textContent = `Temp. Coefficient: ${tempco} ppm/K`;
  }

  // Formula breakdown
  updateFormulaResult(d1, d2, d3, mult, ohms);

  // Range string
  document.getElementById('result-range').textContent =
    `Range: ${formatOhmsShort(minVal)} Ω → ${formatOhmsShort(maxVal)} Ω`;

  // Result band dots
  updateResultBandDots();
}

/* =============================================
   FORMULA RESULT LINE
   ============================================= */
function updateFormulaResult(d1, d2, d3, mult, ohms) {
  const formulaEl = document.getElementById('result-formula');
  const multStr   = formatMultiplierDisplay(mult);
  const resultStr = formatOhmsShort(ohms);

  if (mode === 4) {
    formulaEl.innerHTML =
      `( <span>${d1}</span> × 10 + <span>${d2}</span> ) × <span>${multStr}</span> = <span>${resultStr}</span> Ω`;
  } else {
    const d3v = d3 !== null ? d3 : 0;
    formulaEl.innerHTML =
      `( <span>${d1}</span> × 100 + <span>${d2}</span> × 10 + <span>${d3v}</span> ) × <span>${multStr}</span> = <span>${resultStr}</span> Ω`;
  }
}

/* =============================================
   RESULT BAND DOTS
   ============================================= */
function updateResultBandDots() {
  const container = document.getElementById('result-bands');
  const bandCount = mode;
  const labels = mode === 4
    ? ['1st Digit','2nd Digit','Multiplier','Tolerance']
    : mode === 5
      ? ['1st Digit','2nd Digit','3rd Digit','Multiplier','Tolerance']
      : ['1st Digit','2nd Digit','3rd Digit','Multiplier','Tolerance','Temp.Coeff'];

  let html = '';
  for (let i = 0; i < bandCount; i++) {
    const c = state.colors[i];
    if (!c) continue;
    html += `
      <div class="rb-item">
        <span class="rb-dot" style="background:${COLOR_HEX[c]};box-shadow:0 0 8px ${COLOR_GLOW[c]}"></span>
        <span>${COLOR_NAME[c]}<br><small style="opacity:0.55;font-size:0.7rem">${labels[i]}</small></span>
      </div>`;
  }
  container.innerHTML = html;
}

/* --- Formatting Helpers --- */
function formatOhms(val) {
  if (val < 1) return `${val.toFixed(2)} Ω`;
  return `${Number(val.toFixed(2)).toLocaleString()} Ω`;
}
function formatOhmsShort(val) {
  if (val >= 1000000) return `${(val/1000000).toFixed(2)}M`;
  if (val >= 1000)    return `${(val/1000).toFixed(2)}K`;
  return `${parseFloat(val.toFixed(4))}`;
}
function formatEngineering(val) {
  if (val >= 1000000) return `${parseFloat((val/1000000).toFixed(3))} MΩ`;
  if (val >= 1000)    return `${parseFloat((val/1000).toFixed(3))} KΩ`;
  return `${parseFloat(val.toFixed(3))} Ω`;
}
function formatMultiplierDisplay(mult) {
  if (mult >= 1000000) return `${mult/1000000}M`;
  if (mult >= 1000)    return `${mult/1000}K`;
  return `${mult}`;
}

/* =============================================
   ANIMATE VALUE TEXT CHANGE
   ============================================= */
function animateValue(id, newText) {
  const el = document.getElementById(id);
  el.style.transform = 'scale(0.92)';
  el.style.opacity   = '0.5';
  setTimeout(() => {
    el.textContent = newText;
    el.style.transform = 'scale(1)';
    el.style.opacity   = '1';
    el.style.transition = 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }, 120);
  setTimeout(() => { el.style.transition = ''; }, 400);
}

/* =============================================
   LOAD EXAMPLE — Yellow Violet Red Gold
   ============================================= */
function loadExample() {
  setMode(4);
  setSelectByValue('band1-select', 'yellow');
  setSelectByValue('band2-select', 'violet');
  setSelectByValue('band3-select', 'red');
  setSelectByValue('band4-select', 'gold');
  [1, 2, 3, 4].forEach(n => updateBand(n));
  document.querySelector('.resistor-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setSelectByValue(id, value) {
  const sel = document.getElementById(id);
  if (!sel) return;
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === value) { sel.selectedIndex = i; break; }
  }
}

/* =============================================
   SCROLL REVEAL
   ============================================= */
function initScrollReveal() {
  const cards = document.querySelectorAll('.glass-card, .section-title, .section-sub');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeSlideDown 0.6s ease both';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  cards.forEach(c => {
    c.style.opacity = '0';
    obs.observe(c);
  });
}

/* =============================================
   PARTICLE CANVAS BACKGROUND
   ============================================= */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const PCOLS = ['rgba(0,247,255,', 'rgba(176,38,255,', 'rgba(255,46,136,', 'rgba(0,255,153,'];

  function createParticle() {
    const col = PCOLS[Math.floor(Math.random() * PCOLS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      color: col,
    };
  }

  for (let i = 0; i < 120; i++) particles.push(createParticle());

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,247,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLines();
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    });
    requestAnimationFrame(loop);
  }

  loop();
}
