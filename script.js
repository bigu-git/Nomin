/* ═══════════ HERO WORD-REVEAL SPLIT ═══════════ */
(function () {
  function wrapWords(node) {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(chunk => {
          if (chunk.trim() === '') {
            frag.appendChild(document.createTextNode(chunk));
          } else {
            const outer = document.createElement('span');
            outer.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = chunk;
            outer.appendChild(inner);
            frag.appendChild(outer);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR' && child.tagName !== 'EM') {
        wrapWords(child);
      }
    });
  }

  const title = document.querySelector('.hero-title');
  if (title) {
    wrapWords(title);
    let i = 0;
    title.querySelectorAll('.word-inner').forEach(w => {
      w.style.setProperty('--i', i++);
    });
  }
})();

/* ═══════════ POINTER PARALLAX (hero glow + candle) ═══════════ */
(function () {
  const root = document.documentElement;
  let ticking = false;
  const MAX = 14;

  function apply(nx, ny) {
    root.style.setProperty('--px', (nx * MAX).toFixed(2) + 'px');
    root.style.setProperty('--py', (ny * MAX).toFixed(2) + 'px');
  }

  window.addEventListener('mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      apply(nx, ny);
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('mouseleave', () => apply(0, 0));
})();

/* ═══════════ CURSOR SPARKLE TRAIL (desktop pointer only) ═══════════ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let lastSpawn = 0;
  window.addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - lastSpawn < 90) return;
    if (Math.random() > 0.55) return;
    lastSpawn = now;

    const s = document.createElement('div');
    s.className = 'cursor-spark';
    const size = 4 + Math.random() * 5;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = (e.clientX - size / 2) + 'px';
    s.style.top = (e.clientY - size / 2) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }, { passive: true });
})();

/* ═══════════ FLOATING PETALS CANVAS ═══════════ */
(function () {
  const canvas = document.getElementById('petals-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; /* graceful no-op on the rare browser without 2D canvas support */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dpr;

  const SYMS   = ['✿', '✧', '♡', '·', '✦', '❀', '✽'];
  const TWINKLE_SYMS = new Set(['·', '✦']);
  const COLORS = [
    'rgba(252,200,215,0.7)',
    'rgba(234,216,200,0.65)',
    'rgba(255,255,255,0.8)',
    'rgba(217,131,158,0.35)',
    'rgba(232,200,136,0.5)',
    'rgba(244,194,208,0.6)',
  ];

  let pointerX = -9999, pointerY = -9999;
  const hasFinePointer = !window.matchMedia('(pointer: coarse)').matches;
  if (hasFinePointer && !reduceMotion) {
    window.addEventListener('mousemove', e => { pointerX = e.clientX; pointerY = e.clientY; }, { passive: true });
    window.addEventListener('mouseleave', () => { pointerX = -9999; pointerY = -9999; });
  }

  function resize() {
    /* Cap the device pixel ratio: on 3x/4x phones an uncapped dpr allocates
       a canvas buffer many times larger than what's visually perceptible,
       which is pure wasted fill-rate on every frame. 2x already looks crisp. */
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* keep ambient petal density consistent with viewport width (grow AND shrink to avoid unbounded growth) */
    const targetN = Math.min(38, Math.floor(window.innerWidth / 11));
    let ambientCount = 0;
    for (let i = ps.length - 1; i >= 0; i--) {
      if (ps[i].burst) continue;
      ambientCount++;
      if (ambientCount > targetN) ps.splice(i, 1);
    }
    for (let i = ambientCount; i < targetN; i++) {
      const p = new Petal(null);
      p.y = Math.random() * window.innerHeight;
      ps.push(p);
    }
  }

  class Petal {
    constructor(burst) { this.reset(burst); }
    reset(burst) {
      const vw = window.innerWidth, vh = window.innerHeight;
      this.x      = burst ? burst.x : Math.random() * vw;
      this.y      = burst ? burst.y : -20 - Math.random() * 60;
      this.sym    = SYMS[Math.floor(Math.random() * SYMS.length)];
      this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.size   = burst ? 11 + Math.random() * 15 : 8 + Math.random() * 11;
      this.vy     = burst ? -(1.2 + Math.random() * 2.2) : 0.28 + Math.random() * 0.55;
      this.vx     = (Math.random() - 0.5) * (burst ? 2.8 : 0.5);
      this.op     = burst ? 0.95 : 0.35 + Math.random() * 0.45;
      this.baseOp = this.op;
      this.fade   = burst ? 0.014 + Math.random() * 0.009 : 0.0004;
      this.rot    = Math.random() * Math.PI * 2;
      this.rotV   = (Math.random() - 0.5) * 0.028;
      this.drift  = Math.random() * 100;
      this.twinklePhase = Math.random() * Math.PI * 2;
      this.burst  = !!burst;
      this.vw = vw; this.vh = vh;
    }
    step(t, windX) {
      this.y   += this.vy;
      this.x   += this.vx + windX + Math.sin((this.y + this.drift) * 0.012) * 0.35;
      this.rot += this.rotV;

      /* gentle cursor repulsion for ambient petals */
      if (!this.burst) {
        const dx = this.x - pointerX, dy = this.y - pointerY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 6400) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (80 - dist) / 80;
          this.x += (dx / dist) * force * 2.2;
          this.y += (dy / dist) * force * 2.2;
        }
      }

      if (this.burst) {
        this.op -= this.fade;
      } else {
        if (TWINKLE_SYMS.has(this.sym)) {
          this.op = this.baseOp * (0.55 + 0.45 * Math.sin(t * 0.0022 + this.twinklePhase));
        }
        if (this.y > window.innerHeight + 30) this.reset(null);
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = Math.max(0, this.op);
      ctx.font = `${this.size}px serif`;
      ctx.fillStyle = this.color;
      /* Soft glow is reserved for the fewer, short-lived celebratory burst
         petals — shadowBlur is comparatively costly per-draw, and with up
         to ~38 ambient petals redrawn every frame it's not worth paying for
         a glow that's barely visible at their smaller size anyway. */
      if (this.burst) {
        ctx.shadowColor = 'rgba(255,255,255,0.6)';
        ctx.shadowBlur  = 3;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.sym, 0, 0);
      ctx.restore();
    }
    dead() { return this.burst && this.op <= 0; }
  }

  const ps = [];

  /* Debounced Canvas Resize Listener */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(reduceMotion ? renderStatic : resize, 150);
  });
  resize(); /* seeds ambient petals, sets dpr, and avoids a NaN clearRect on first frame */

  function renderStatic() {
    resize();
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ps.forEach(p => p.draw());
  }

  let rafId = null;
  function loop(t) {
    const windX = Math.sin(t * 0.00035) * 0.4;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (let i = ps.length - 1; i >= 0; i--) {
      ps[i].step(t, windX);
      ps[i].draw();
      if (ps[i].dead()) ps.splice(i, 1);
    }
    rafId = requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    /* Honor the OS-level motion preference: show the petals as a gently
       scattered, static decoration instead of a continuously drifting
       animation loop. */
    renderStatic();
  } else {
    rafId = requestAnimationFrame(loop);

    /* Pause the render loop while the tab is hidden — an invisible canvas
       has no reason to keep spending CPU/battery every frame. */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      } else if (rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    });
  }

  /* Touch / click burst */
  function burst(x, y) {
    if (!reduceMotion) {
      const n = 7 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) ps.push(new Petal({ x, y }));
    }
    /* White ripple — always shown as tap feedback; its own animation is
       already collapsed to near-zero duration under reduced motion via CSS. */
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.cssText = `width:90px;height:90px;left:${x-45}px;top:${y-45}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 900);
  }

  let isTouch = false;
  let touchStartX = 0, touchStartY = 0, touchStartT = 0;

  document.addEventListener('touchstart', e => {
    if (e.target.closest('#music-btn')) return;
    isTouch = true;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartT = performance.now();
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!isTouch) return;
    if (e.target.closest('#music-btn')) return;
    const t = e.changedTouches[0];
    const moved = Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY) > 12;
    const heldTooLong = performance.now() - touchStartT > 500;
    /* Only burst on an actual tap, not a scroll drag or long-press */
    if (!moved && !heldTooLong) burst(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('click', e => {
    if (e.target.closest('#music-btn')) return;
    /* Prevent double execution on mobile devices */
    if (isTouch) {
      isTouch = false;
      return;
    }
    burst(e.clientX, e.clientY);
  });
})();

/* ═══════════ SCROLL REVEAL ═══════════ */
(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ═══════════ MUSIC — PLAYBACK + LIVE AUDIO-REACTIVE EQUALIZER ═══════════ */
(function () {
  const btn = document.getElementById('music-btn');
  const note = btn.querySelector('.note');
  const audio = document.getElementById('bg-music');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tiny equalizer visualizer: animates via a canned CSS loop by default,
     and switches to real per-frame amplitude data once the analyser is up. */
  const eq = document.createElement('span');
  eq.className = 'eq-bars';
  eq.innerHTML = '<span></span><span></span><span></span>';
  btn.appendChild(eq);
  const eqBars = eq.querySelectorAll('span');

  let playing = false;
  let audioFailed = false;
  let actx = null;
  let analyser = null;
  let freqData = null;
  let eqRafId = null;

  /* If the audio file itself fails to load (missing file, decode error),
     disable the control instead of leaving a button that silently does nothing. */
  audio.addEventListener('error', () => {
    audioFailed = true;
    btn.setAttribute('aria-label', 'Music unavailable');
    btn.setAttribute('disabled', '');
    btn.style.opacity = '0.45';
    btn.style.cursor = 'default';
  });

  function average(arr, start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) sum += arr[i];
    return sum / (end - start);
  }

  function tickEqualizer() {
    if (!playing || !analyser) return;
    analyser.getByteFrequencyData(freqData);
    const bands = [
      average(freqData, 0, 3),
      average(freqData, 3, 8),
      average(freqData, 8, freqData.length),
    ];
    bands.forEach((v, i) => {
      eqBars[i].style.height = (3 + (v / 255) * 8).toFixed(1) + 'px'; /* 3px–11px, matching the original CSS range */
    });
    eqRafId = requestAnimationFrame(tickEqualizer);
  }

  function startEqualizer() {
    if (reduceMotion || !analyser) return; /* keep the gentle static CSS fallback under reduced motion */
    eq.classList.add('js-driven');
    if (eqRafId === null) eqRafId = requestAnimationFrame(tickEqualizer);
  }
  function stopEqualizer() {
    if (eqRafId !== null) { cancelAnimationFrame(eqRafId); eqRafId = null; }
  }

  function syncUI() {
    btn.classList.toggle('playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    note.textContent = playing ? '♫' : '♪';
    btn.classList.remove('note-punch');
    void btn.offsetWidth; /* restart animation */
    btn.classList.add('note-punch');
  }

  btn.addEventListener('click', () => {
    if (audioFailed) return;

    /* Initialize AudioContext + analyser purely on user interaction. The
       analyser drives the real equalizer bars; if Web Audio isn't available
       or throws for any reason, we fall back to plain <audio> playback and
       the original CSS eq animation — the toggle itself never breaks. */
    if (!actx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        actx = new AudioContext();
        const sourceNode = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 32;
        analyser.smoothingTimeConstant = 0.8;
        freqData = new Uint8Array(analyser.frequencyBinCount);
        sourceNode.connect(analyser);
        analyser.connect(actx.destination);
      } catch (err) {
        console.warn('Web Audio unavailable, falling back to basic playback:', err);
        actx = null;
        analyser = null;
      }
    }

    const wantsToPlay = !playing;

    if (wantsToPlay) {
      /* resume context first so audio is audible as soon as playback starts */
      const resumeIfNeeded = actx && actx.state === 'suspended' ? actx.resume() : Promise.resolve();
      resumeIfNeeded
        .then(() => audio.play())
        .then(() => { playing = true; syncUI(); startEqualizer(); })
        .catch(err => {
          console.error('Audio playback failed:', err);
          playing = false;
          syncUI();
        });
    } else {
      audio.pause();
      /* explicitly suspend context for performance cleanup */
      if (actx && actx.state === 'running') actx.suspend();
      playing = false;
      stopEqualizer();
      syncUI();
    }
  });
})();

/* ═══════════ AESTHETIC COLLAGE — polaroid tilt jitter ═══════════ */
/* Nudges each frame's printed --tilt by a small random amount so the
   stack reads like a hand-arranged pile rather than a fixed pattern. */
(function () {
  document.querySelectorAll('.aesthetic-frame').forEach(frame => {
    const base = parseFloat(frame.style.getPropertyValue('--tilt')) || 0;
    const jitter = (Math.random() - 0.5) * 3; /* ± 1.5deg */
    frame.style.setProperty('--tilt', `${(base + jitter).toFixed(2)}deg`);
  });
})();

/* ═══════════ AESTHETIC COLLAGE — decorative player card toggle ═══════════ */
/* Purely visual (play/pause icon swap on the collage player card); it is
   not wired to real playback — the floating #music-btn above handles that. */
(function () {
  const toggle = document.querySelector('.player-card .player-toggle');
  if (!toggle) return;
  const iconPlay = toggle.querySelector('.icon-play');
  const iconPause = toggle.querySelector('.icon-pause');
  let paused = false;

  toggle.addEventListener('click', () => {
    paused = !paused;
    iconPlay.hidden = !paused;
    iconPause.hidden = paused;
    toggle.setAttribute('aria-pressed', String(!paused));
    toggle.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  });
})();
