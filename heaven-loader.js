// HEAVEN — Premium Golden Portal Loader
(function () {
  const loader = document.getElementById('heaven-loader');
  const canvas = document.getElementById('heaven-fluid');
  if (!loader || !canvas) return;

  document.body.classList.add('heaven-loading');

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.min(60, Math.floor((w * h) / 16000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.9 + 0.5,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -Math.random() * 0.45 - 0.12,
        alpha: Math.random() * 0.55 + 0.25,
        life: Math.random()
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life += 0.0038;

      if (p.y < -12 || p.life > 1) {
        p.x = Math.random() * w;
        p.y = h + 12;
        p.life = 0;
      }

      const a = p.alpha * (1 - Math.abs(p.life - 0.5) * 1.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 200, ${Math.max(0, a)})`;
      ctx.fill();
    });
    animId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  // Duration of the full opening (in ms)
  const DURATION = 4600;

  setTimeout(() => {
    loader.classList.add('heaven-loader-exit');
    document.body.classList.remove('heaven-loading');

    setTimeout(() => {
      cancelAnimationFrame(animId);
      if (canvas.parentNode) canvas.remove();
    }, 1200);
  }, DURATION);
})();
