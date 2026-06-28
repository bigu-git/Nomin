/* ═══════════ FLOATING PETALS CANVAS ═══════════ */
(function () {
  const canvas = document.getElementById('petals-canvas');
  const ctx    = canvas.getContext('2d');
  let dpr;

  const SYMS   = ['✿', '✧', '♡', '·', '✦', '❀', '✽'];
  const COLORS = [
    'rgba(252,200,215,0.7)',
    'rgba(234,216,200,0.65)',
    'rgba(255,255,255,0.8)',
    'rgba(217,131,158,0.35)',
    'rgba(232,200,136,0.5)',
    'rgba(244,194,208,0.6)',
  ];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      this.fade   = burst ? 0.014 + Math.random() * 0.009 : 0.0004;
      this.rot    = Math.random() * Math.PI * 2;
      this.rotV   = (Math.random() - 0.5) * 0.028;
      this.drift  = Math.random() * 100;
      this.burst  = !!burst;
      this.vw = vw; this.vh = vh;
    }
    step() {
      this.y   += this.vy;
      this.x   += this.vx + Math.sin((this.y + this.drift) * 0.012) * 0.35;
      this.rot += this.rotV;
      if (this.burst) this.op -= this.fade;
      else if (this.y > this.vh + 30) this.reset(null);
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = Math.max(0, this.op);
      ctx.font = `${this.size}px serif`;
      ctx.fillStyle = this.color;
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.shadowBlur  = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.sym, 0, 0);
      ctx.restore();
    }
    dead() { return this.burst && this.op <= 0; }
  }

  const ps = [];
  const N  = Math.min(38, Math.floor(window.innerWidth / 11));
  for (let i = 0; i < N; i++) {
    const p = new Petal(null);
    p.y = Math.random() * window.innerHeight;
    ps.push(p);
  }

  (function loop() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (let i = ps.length - 1; i >= 0; i--) {
      ps[i].step();
      ps[i].draw();
      if (ps[i].dead()) ps.splice(i, 1);
    }
    requestAnimationFrame(loop);
  })();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  resize();

  function burst(x, y) {
    const n = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) ps.push(new Petal({ x, y }));
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.cssText = `width:90px;height:90px;left:${x-45}px;top:${y-45}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 900);
  }

  let isTouch = false;
  
  document.addEventListener('touchstart', e => {
    isTouch = true;
    burst(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('click', e => {
    if (e.target.closest('#music-btn')) return;
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
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ═══════════ MUSIC — WEB AUDIO API WRAPPER ═══════════ */
(function () {
  const btn  = document.getElementById('music-btn');
  const note = btn.querySelector('.note');
  const audio = document.getElementById('bg-music');
  
  let playing = false;
  let actx = null;
  let sourceNode = null;

  btn.addEventListener('click', () => {
    if (!actx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      actx = new AudioContext();
      sourceNode = actx.createMediaElementSource(audio);
      sourceNode.connect(actx.destination);
    }
    
    playing = !playing;
    
    if (playing) {
      audio.play()
        .then(() => {
          if (actx.state === 'suspended') {
            actx.resume();
          }
        })
        .catch(err => console.error("Audio playback failed:", err));
    } else {
      audio.pause();
      if (actx.state === 'running') {
        actx.suspend();
      }
    }
    
    btn.classList.toggle('playing', playing);
    note.textContent = playing ? '♫' : '♪';
  });
})();
