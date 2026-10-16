(() => {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = innerWidth < 650 ? 55 : 90;
    particles = Array.from({length:count}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*2.5+0.8,
      v: Math.random()*0.65+0.25,
      drift: (Math.random()-.5)*0.22,
      a: Math.random()*.45+.2
    }));
  }
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of particles){
      p.y += p.v; p.x += p.drift;
      if(p.y > innerHeight+8){p.y=-8;p.x=Math.random()*innerWidth}
      if(p.x < -8)p.x=innerWidth+8;
      if(p.x > innerWidth+8)p.x=-8;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(183,139,37,${p.a})`;
      ctx.shadowBlur=7; ctx.shadowColor='rgba(210,170,55,.55)';
      ctx.fill();
    }
    ctx.shadowBlur=0;
    requestAnimationFrame(draw);
  }
  resize(); addEventListener('resize',resize,{passive:true}); draw();

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
})();

// Category filters
(() => {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    buttons.forEach(b => b.classList.toggle('active', b === btn));
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
      if (show) card.classList.add('reveal');
    });
  }));
})();
// =========================================
// 3D SCROLL TRIGGER + PARALLAX
// =========================================

(function () {
  // 1. 3D Reveal with Intersection Observer
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // 2. Soft 3D Parallax on sky
  const sun     = document.querySelector('.sky .sun');
  const sunRays = document.querySelector('.sky .sun-rays');
  const haloOne = document.querySelector('.sky .halo-one');
  const haloTwo = document.querySelector('.sky .halo-two');
  const clouds  = document.querySelectorAll('.sky .cloud');

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);

    if (sun) {
      sun.style.transform = `translateY(\( {scrollY * 0.22}px) translateZ( \){scrollY * 0.05}px)`;
    }
    if (sunRays) {
      sunRays.style.transform = `translate(-50%, -50%) translateY(\( {scrollY * 0.14}px) rotate( \){progress * 8}deg)`;
    }
    if (haloOne) {
      haloOne.style.transform = `translate(-50%, -50%) translateY(${scrollY * 0.09}px)`;
    }
    if (haloTwo) {
      haloTwo.style.transform = `translate(-50%, -50%) translateY(${scrollY * 0.05}px)`;
    }

    clouds.forEach((cloud, i) => {
      const speed = 0.07 + i * 0.035;
      cloud.style.transform = `translateY(${scrollY * speed}px)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  updateParallax();
})();      
