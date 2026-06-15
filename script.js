'use strict';

/* ===================================================================
   Ahmed Ben Salah — Portfolio v3
   GSAP + ScrollTrigger + Lenis + canvas particle field
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(max-width: 900px)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ============ NEURAL SIGNAL NETWORK (canvas) ============
     Nodes (neurons / hosts) linked by proximity, with glowing pulses
     that fire and travel along the links — like signals propagating
     through a neural net / packets across a network. Reacts to cursor. */
  (function neuralNet() {
    const canvas = document.getElementById('field');
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [], signals = [], raf, t = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let LINK = 150;

    const rand = (a, b) => a + Math.random() * (b - a);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      LINK = (innerWidth < 600 ? 120 : 165) * dpr;
      const count = Math.min(Math.floor((innerWidth * innerHeight) / 18000), isTouch ? 34 : 80);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: rand(-0.18, 0.18) * dpr, vy: rand(-0.18, 0.18) * dpr,
        r: rand(0.8, 2.0) * dpr,
        glow: Math.random(),                 // idle pulsing phase
        excite: 0                            // 0..1 lit when a signal passes / near cursor
      }));
      signals = [];
    };

    const neighbors = (i) => {
      const a = nodes[i], out = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const dx = a.x - nodes[j].x, dy = a.y - nodes[j].y;
        if (dx * dx + dy * dy < LINK * LINK) out.push(j);
      }
      return out;
    };

    // fire a signal from node i toward a neighbor (cascades on arrival)
    const fire = (i, depth) => {
      if (signals.length > (isTouch ? 14 : 30)) return;
      const ns = neighbors(i);
      if (!ns.length) return;
      const to = ns[(Math.random() * ns.length) | 0];
      nodes[i].excite = 1;
      signals.push({ from: i, to, t: 0, speed: rand(0.012, 0.022), depth });
    };

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, w, h);

      // --- links ---
      ctx.lineWidth = dpr * 0.7;
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        if (p.excite > 0) p.excite -= 0.02;

        // cursor excites + gently attracts nearby nodes
        const mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        const md = Math.hypot(mdx, mdy);
        if (mouse.active && md < 180 * dpr) {
          p.excite = Math.max(p.excite, 1 - md / (180 * dpr));
          p.x += (mdx / md) * 0.4; p.y += (mdy / md) * 0.4;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const base = 0.16 * (1 - d / LINK);
            const lit = Math.max(p.excite, q.excite) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(170,210,90,${base + lit})`;
            ctx.stroke();
          }
        }
      }

      // --- nodes ---
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.03 + p.glow * 6.28);
        const r = p.r * (1 + p.excite * 1.8);
        const a = 0.35 + 0.4 * pulse + p.excite * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 6.2832);
        ctx.fillStyle = `rgba(200,255,54,${Math.min(a, 1)})`;
        ctx.shadowColor = 'rgba(200,255,54,0.9)';
        ctx.shadowBlur = (4 + p.excite * 14) * dpr;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // --- traveling signals ---
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        const a = nodes[sig.from], b = nodes[sig.to];
        if (!a || !b) { signals.splice(s, 1); continue; }
        sig.t += sig.speed;
        const x = a.x + (b.x - a.x) * sig.t;
        const y = a.y + (b.y - a.y) * sig.t;

        // trail
        const tx = a.x + (b.x - a.x) * Math.max(0, sig.t - 0.12);
        const ty = a.y + (b.y - a.y) * Math.max(0, sig.t - 0.12);
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, 'rgba(79,214,255,0)');
        grad.addColorStop(1, 'rgba(120,235,255,0.9)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = dpr * 2;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();

        // head
        ctx.beginPath();
        ctx.arc(x, y, dpr * 2.4, 0, 6.2832);
        ctx.fillStyle = 'rgba(190,245,255,0.95)';
        ctx.shadowColor = 'rgba(79,214,255,0.95)';
        ctx.shadowBlur = 12 * dpr;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (sig.t >= 1) {
          nodes[sig.to].excite = 1;
          if (sig.depth < 3 && Math.random() < 0.72) fire(sig.to, sig.depth + 1); // cascade
          signals.splice(s, 1);
        }
      }

      // spontaneous firing
      if (t % 26 === 0 && nodes.length) fire((Math.random() * nodes.length) | 0, 0);
      // fire from node nearest the cursor occasionally
      if (mouse.active && t % 16 === 0 && nodes.length) {
        let best = -1, bd = Infinity;
        for (let i = 0; i < nodes.length; i++) {
          const dx = nodes[i].x - mouse.x, dy = nodes[i].y - mouse.y, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0 && bd < (220 * dpr) ** 2) fire(best, 0);
      }

      raf = requestAnimationFrame(draw);
    };

    addEventListener('mousemove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; mouse.active = true; });
    addEventListener('mouseout', () => mouse.active = false);
    addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); draw(); });
    resize(); draw();
  })();

  /* ============ CURSOR + SPOTLIGHT ============ */
  const dot = document.getElementById('curDot');
  const ring = document.getElementById('curRing');
  const curTxt = document.getElementById('curTxt');
  const spot = document.getElementById('spotlight');

  if (!isTouch) {
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
      if (spot) { spot.style.setProperty('--mx', mx + 'px'); spot.style.setProperty('--my', my + 'px'); }
    });
    (function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('[data-cursor], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring && ring.classList.add('hov'));
      el.addEventListener('mouseleave', () => ring && ring.classList.remove('hov'));
    });
    document.querySelectorAll('.panel').forEach(el => {
      el.addEventListener('mouseenter', () => { ring.classList.add('lbl'); curTxt.textContent = 'OPEN'; });
      el.addEventListener('mouseleave', () => { ring.classList.remove('lbl'); curTxt.textContent = ''; });
    });
  }

  /* ============ MAGNETIC BUTTONS ============ */
  if (!isTouch && hasGSAP) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: x * 0.35, y: y * 0.45, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ============ HEADER + SCROLL BAR ============ */
  const header = document.getElementById('header');
  const sbar = document.getElementById('sbar');
  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    header && header.classList.toggle('scrolled', y > 30);
    if (sbar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      sbar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  };

  /* ============ MOBILE NAV ============ */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  navToggle?.addEventListener('click', () => { navToggle.classList.toggle('open'); navMenu.classList.toggle('open'); });
  navMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { navToggle.classList.remove('open'); navMenu.classList.remove('open'); }));

  /* ============ LENIS SMOOTH SCROLL ============ */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', () => { onScroll(); if (hasGSAP && ScrollTrigger) ScrollTrigger.update(); });
    if (hasGSAP) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  } else {
    addEventListener('scroll', onScroll, { passive: true });
  }
  onScroll();

  // anchor links via Lenis (offset for fixed header)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70 });
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    });
  });

  /* ============ PRELOADER ============ */
  const pl = document.getElementById('preloader');
  const plName = document.getElementById('plName');
  const plCount = document.getElementById('plCount');
  const curtain = document.getElementById('curtain');
  lenis?.stop();

  const startSite = () => {
    lenis?.start();
    initReveals();
    heroIntro();
  };

  if (plName) plName.innerHTML = '<span>Ahmed Ben Salah</span>';

  if (reduce || !hasGSAP) {
    // ---- Static, fully-accessible fallback ----
    if (pl) pl.style.display = 'none';
    if (curtain) curtain.style.display = 'none';
    document.querySelectorAll('[data-anim]').forEach(el => el.style.opacity = 1);
    document.querySelectorAll('.bar-fill').forEach(b => b.style.width = (b.dataset.w || 0) + '%');
    document.querySelectorAll('[data-count]').forEach(el => el.textContent = el.dataset.count + (el.dataset.suffix || ''));
    const tl = document.querySelector('#tlLine span'); if (tl) tl.style.height = '100%';
    const vp = document.querySelector('.gallery-viewport'); if (vp) vp.style.overflowX = 'auto'; // manual scroll instead of pin
    lenis?.start();
  } else {
    const obj = { v: 0 };
    const tl = gsap.timeline();
    tl.from('#plName span', { yPercent: 110, duration: 0.9, ease: 'power4.out' })
      .to(obj, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { if (plCount) plCount.textContent = Math.round(obj.v); } }, 0.1)
      .to('.pl-inner', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
      .set(pl, { display: 'none' })
      .fromTo(curtain, { scaleY: 1, transformOrigin: 'top' }, { scaleY: 0, duration: 0.8, ease: 'power4.inOut' }, '<')
      .add(startSite, '-=0.4');
  }

  /* ============ HERO INTRO ============ */
  function heroIntro() {
    gsap.set('.hero [data-anim]', { opacity: 1 });
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero h1 .ln > span', { yPercent: 115, duration: 1, stagger: 0.12 })
      .from('.status', { y: 20, opacity: 0, duration: 0.6 }, '-=0.7')
      .from('.hero-role', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.hero-tagline', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-socials', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.portrait', { y: 40, opacity: 0, scale: 0.96, duration: 1 }, '-=1');
  }

  /* ============ SCROLL REVEALS ============ */
  function initReveals() {
    if (!hasGSAP) return;

    // generic fade-up
    gsap.utils.toArray('[data-anim]').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.fromTo(el,
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // split headline lines
    gsap.utils.toArray('[data-split]').forEach(h => {
      if (h.closest('.hero')) return;
      gsap.from(h.querySelectorAll('.ln > span'), {
        yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.1,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });

    // decrypt mono labels on enter
    gsap.utils.toArray('.eyebrow, .panel-kicker').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => decryptText(el) });
    });

    // about lead — word by word
    const lead = document.querySelector('[data-split-words]');
    if (lead) {
      const words = lead.textContent.trim().split(/\s+/);
      lead.innerHTML = words.map(w => {
        // keep the italic emphasis on "think"
        const clean = w.replace(/[.,]/g, '');
        const tag = (clean === 'think') ? `<i>${w}</i>` : w;
        return `<span class="w">${tag}</span>`;
      }).join(' ');
      gsap.from(lead.querySelectorAll('.w'), {
        opacity: 0.12, duration: 0.6, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: lead, start: 'top 80%', end: 'bottom 60%', scrub: 0.6 }
      });
    }

    // stat counters
    gsap.utils.toArray('[data-count]').forEach(el => {
      const target = +el.dataset.count, suffix = el.dataset.suffix || '';
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => el.textContent = Math.round(o.v) + suffix
      });
    });

    // skill bars
    gsap.utils.toArray('.bar-fill').forEach(bar => {
      gsap.to(bar, { width: (bar.dataset.w || 0) + '%', duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 92%' } });
    });

    // timeline progress line
    const line = document.querySelector('#tlLine span');
    if (line) {
      gsap.to(line, { height: '100%', ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 80%', scrub: 0.8 } });
    }

    // parallax portrait
    document.querySelectorAll('[data-parallax]').forEach(el => {
      gsap.to(el, { yPercent: +el.dataset.parallax / 10, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // marquee loop
    const mq = document.getElementById('marquee');
    if (mq) {
      mq.innerHTML += mq.innerHTML; // duplicate for seamless loop
      gsap.to(mq, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
    }

    // active nav spy
    gsap.utils.toArray('section[id]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: self => { if (self.isActive) setActive(sec.id); }
      });
    });

    buildGallery();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function setActive(id) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.getAttribute('href') === '#' + id));
  }

  /* ============ HORIZONTAL PINNED GALLERY ============ */
  function buildGallery() {
    const track = document.getElementById('galleryTrack');
    const gallery = document.getElementById('gallery');
    if (!track || !gallery) return;

    // panel cursor glow
    if (!isTouch) {
      track.querySelectorAll('.panel').forEach(p => {
        p.addEventListener('mousemove', e => {
          const r = p.getBoundingClientRect();
          p.style.setProperty('--cx', (e.clientX - r.left) + 'px');
          p.style.setProperty('--cy', (e.clientY - r.top) + 'px');
        });
      });
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - innerWidth + 60),
        ease: 'none',
        scrollTrigger: {
          trigger: gallery,
          start: 'top top',
          end: () => '+=' + (track.scrollWidth - innerWidth + 60),
          pin: true, scrub: 1, invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });
      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    });
  }

  /* ============ DECRYPT TEXT ============ */
  function decryptText(el) {
    if (reduce || el.dataset.decoding) return;
    const final = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', final);
    el.dataset.decoding = '1';
    el.classList.add('decoding');
    const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*<>/\\=+░▒▓';
    const arr = Array.from(final);
    const settle = arr.map((c, i) => c === ' ' ? 0 : 6 + Math.floor(i * 1.25) + ((Math.random() * 6) | 0));
    let frame = 0;
    const id = setInterval(() => {
      let out = '', done = true;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === ' ') { out += ' '; continue; }
        if (frame >= settle[i]) out += arr[i];
        else { out += glyphs[(Math.random() * glyphs.length) | 0]; done = false; }
      }
      el.textContent = out;
      frame++;
      if (done) { clearInterval(id); el.textContent = final; el.classList.remove('decoding'); delete el.dataset.decoding; }
    }, 33);
  }

  /* ============ INLINE INTERACTIVE TERMINAL ============ */
  (function terminal() {
    const live = document.getElementById('termLive');
    const input = document.getElementById('termInput');
    const out = document.getElementById('termOut');
    const navBtn = document.getElementById('cmdkBtn');
    if (!live || !input || !out) return;

    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const print = (html, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; };
    const history = []; let hi = -1;

    const sections = { about: '#about', skills: '#skills', experience: '#experience', work: '#work', projects: '#work', certs: '#certs', certifications: '#certs', contact: '#contact', console: '#console', home: '#top', top: '#top' };
    const GHB = 'https://github.com/Ahmedd-Ben-Salah';
    const projects = {
      ciscolabai: GHB + '/CiscoLabAI',
      dalanda: GHB + '/dalanda',
      nxp: GHB + '/Nxp-Cup-2026',
      extensions: GHB + '/Extensions-Page',
      medicare: GHB + '/MediCare-Pharmacy',
      linefollower: GHB + '/Line-Follower-Robot',
      'smart-hospital': GHB + '/Smart-Hospital-TN',
      linkedin: GHB + '/linkedin-scraping-extension'
    };
    const go = sel => { const el = document.querySelector(sel); if (el) { if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: 'smooth' }); } };

    const run = raw => {
      const cmd = raw.trim(); if (!cmd) return;
      history.push(cmd); hi = history.length;
      print('<span class="cin"><b>❯</b> ' + esc(cmd) + '</span>');
      const parts = cmd.toLowerCase().split(/\s+/);
      const c = parts[0], arg = parts.slice(1).join('');
      switch (c) {
        case 'help':
          print('<span class="ok">navigate</span> &nbsp;about · skills · experience · projects · certs · contact');
          print('<span class="ok">actions&nbsp;&nbsp;</span> open &lt;project&gt; · cv · github · linkedin · email · clear');
          print('<span class="dim">projects: ciscolabai · dalanda · nxp · extensions · medicare · linefollower · smart-hospital · linkedin</span>');
          break;
        case 'whoami':
          print('Ahmed Ben Salah — ICT Engineering student @ INSAT (’24–’29).');
          print('<span class="dim">AI · Automation · Security · Tunis, Tunisia</span>'); break;
        case 'ls': print('<span class="ok">about  skills  experience  projects  certs  contact  cv</span>'); break;
        case 'about': case 'skills': case 'experience': case 'certs': case 'certifications':
        case 'contact': case 'home': case 'top': go(sections[c]); print('<span class="ok">→ ' + c + '</span>'); break;
        case 'projects': case 'work': go('#work'); print('<span class="ok">→ projects</span>'); break;
        case 'goto': case 'cd': sections[arg] ? (go(sections[arg]), print('<span class="ok">→ ' + esc(arg) + '</span>')) : print('<span class="err">no section: ' + esc(arg) + '</span>'); break;
        case 'open': case 'cat':
          projects[arg] ? (print('<span class="ok">opening ' + esc(arg) + '…</span>'), window.open(projects[arg], '_blank'))
                        : print('<span class="err">no project "' + esc(arg) + '". try: ' + Object.keys(projects).join(', ') + '</span>'); break;
        case 'cv': case 'resume': print('<span class="ok">downloading résumé…</span>'); { const a = document.createElement('a'); a.href = 'Cv.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); } break;
        case 'github': print('<span class="ok">opening GitHub…</span>'); window.open('https://github.com/Ahmedd-Ben-Salah', '_blank'); break;
        case 'linkedin': print('<span class="ok">opening LinkedIn…</span>'); window.open('https://www.linkedin.com/in/ahmedbensalahh', '_blank'); break;
        case 'email': print('<span class="accent">ahmedbensalah.professional@gmail.com</span>'); break;
        case 'clear': out.innerHTML = ''; break;
        case 'sudo': print('<span class="err">nice try — permission denied.</span>'); break;
        case 'hello': case 'hi': print('<span class="ok">hey 👋 type <b>contact</b> to reach me.</span>'); break;
        case 'date': print('<span class="dim">' + new Date().toString() + '</span>'); break;
        default: print('<span class="err">command not found: ' + esc(c) + '</span> — type <b>help</b>');
      }
    };

    // auto welcome (typed)
    const welcome = () => {
      print('<span class="accent">ahmed@portfolio</span>:~$ <span class="dim">interactive shell v1.0</span>');
      const line = document.createElement('div');
      out.appendChild(line);
      const msg = "type 'help' to list commands — or just click one below ↓";
      let i = 0;
      const tick = () => {
        line.innerHTML = esc(msg.slice(0, i)) + '<span style="color:var(--accent)">▋</span>';
        i++;
        if (i <= msg.length) setTimeout(tick, 26);
        else line.innerHTML = esc(msg);
      };
      if (reduce) line.textContent = msg; else tick();
    };
    welcome();

    // input handling + history
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = history[hi] || ''; e.preventDefault(); } }
      else if (e.key === 'ArrowDown') { if (hi < history.length - 1) { hi++; input.value = history[hi] || ''; } else { hi = history.length; input.value = ''; } }
    });
    // clicking anywhere in the terminal focuses the input
    live.addEventListener('click', e => { if (e.target.tagName !== 'A') input.focus(); });
    input.addEventListener('focus', () => live.classList.add('focus'));
    input.addEventListener('blur', () => live.classList.remove('focus'));

    // example chips
    document.querySelectorAll('.cmd-ex').forEach(b => b.addEventListener('click', () => {
      run(b.dataset.cmd); input.focus();
    }));

    // jump to terminal: nav chip, ⌘K, "/"
    const jump = () => {
      go('#console');
      live.classList.remove('flash'); void live.offsetWidth; live.classList.add('flash');
      setTimeout(() => input.focus({ preventScroll: true }), 650);
    };
    navBtn && navBtn.addEventListener('click', jump);
    addEventListener('keydown', e => {
      const typing = /INPUT|TEXTAREA/.test(e.target.tagName || '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); jump(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); jump(); }
    });
  })();

  /* ============ PROJECTS GALLERY (curated charts + live GitHub repos) ============
     The whole gallery is data-driven and ordered NEWEST-FIRST by each repo's
     GitHub "last updated" date. Curated projects below render as full
     case-study cards (click → modal chart). Any other public repo renders as a
     redirect card (click → GitHub) until you promote it.

     ── TO PROMOTE A REPO TO A FULL CASE STUDY (chart) ──
     Add one entry to the PROJECTS array below with the repo's exact name in
     `repo`, plus kicker/title/desc/cardTags and the case study
     (meta/metrics/problem/approach/impact/tags/links). It then renders as a
     chart card and slots into the newest-first order automatically.          */
  (function projectsGallery() {
    const track = document.getElementById('galleryTrack');
    const modal = document.getElementById('projModal');
    if (!track || !modal) return;

    const GH = 'https://github.com/Ahmedd-Ben-Salah';
    const GH_USER = 'Ahmedd-Ben-Salah';
    const IGNORE = new Set(['ahmedd-ben-salah.github.io', 'ahmedd-ben-salah']);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7V16"/></svg>';

    const PROJECTS = [
      {
        id: 'ciscolabai', repo: 'CiscoLabAI', kicker: 'NetDevOps · LLM Automation', title: 'CiscoLabAI',
        desc: 'An AI-powered NetDevOps workflow that cut Cisco Packet Tracer lab configuration from 70 minutes of manual CLI work to under 3 — a 95% reduction. Automates full dual-stack (IPv4 + IPv6) addressing, device hardening, and routing via LLM-driven intent parsing.',
        cardTags: ['Python', 'LLM Integration', 'Packet Tracer'],
        meta: 'Builder · Network automation',
        metrics: [{ v: '70m → 3m', k: 'Lab config time' }, { v: '95%', k: 'Manual effort cut' }, { v: 'IPv4+IPv6', k: 'Dual-stack' }],
        problem: 'Configuring Cisco Packet Tracer labs is slow, repetitive CLI work — roughly 70 minutes per lab — and easy to get wrong.',
        approach: [
          'Built an <b>LLM-driven intent-parsing</b> pipeline that turns architecture-level goals into correct configuration sequences.',
          'Automated full <b>dual-stack (IPv4 + IPv6)</b> addressing, device hardening, and advanced routing logic.',
          'Applied <b>intent-based automation</b>: the tool interprets what you want and autonomously generates and deploys the config.',
          'Iterating toward state-aware protocol automation (STP, Inter-VLAN routing, EtherChannel) — a full NetDevOps platform.'
        ],
        impact: ['Cut lab configuration from <b>70 minutes to under 3</b> — a 95% reduction in manual effort.', 'Consistent, error-free dual-stack deployments at a fraction of the time.'],
        tags: ['Python', 'LLM Integration', 'Prompt Engineering', 'Packet Tracer', 'NetDevOps'],
        links: [{ label: 'View on GitHub', href: GH + '/CiscoLabAI', primary: true }]
      },
      {
        id: 'dalanda', repo: 'dalanda', kicker: 'Multi-Agent AI · RAG', title: 'Dalanda',
        desc: 'A multi-modal, multi-agent RAG system that ingests images, audio, and documents, with an autonomous verification pipeline that cross-checks AI output against source data — eliminating hallucinations without human review. Ships with a voice-driven React interface.',
        cardTags: ['Python', 'LangChain', 'FAISS', 'React'],
        meta: 'Architect & Full-Stack Engineer · Personal project',
        metrics: [{ v: '3', k: 'Modalities ingested' }, { v: '0', k: 'Human review needed' }, { v: 'Voice', k: 'First UX' }],
        problem: 'Personal knowledge is scattered across images, audio, and documents — and off-the-shelf LLMs hallucinate, so their answers can’t be trusted on private or critical data.',
        approach: [
          'Architected a <b>multi-modal, multi-agent RAG</b> pipeline where specialized agents extract and structure data per modality (vision, audio, text).',
          'Designed an <b>autonomous verification agent</b> that cross-checks every generated answer against the source data — removing hallucinations with no human in the loop.',
          'Built semantic <b>FAISS</b> vector search with intelligent filters so all output is grounded in verified personal data.',
          'Shipped a production <b>React</b> interface with voice input, letting non-technical users drive complex AI pipelines in natural language.'
        ],
        impact: ['Zero-hallucination answers through automated source cross-checking.', 'Natural-language and voice access to an otherwise complex multi-agent system.'],
        tags: ['Python', 'LangChain', 'FAISS', 'React', 'Multi-Agent', 'RAG', 'Prompt Engineering'],
        links: [{ label: 'View on GitHub', href: GH + '/dalanda', primary: true }]
      },
      {
        id: 'linkedin', repo: 'linkedin-scraping-extension', kicker: 'AI Automation · Chrome Extension', title: 'LinkedIn Outreach Engine',
        desc: 'A Chrome side-panel extension for personalized LinkedIn outreach: define an ideal customer profile, discover prospects via SerpApi or LinkedIn search, scrape public profiles, and auto-generate tailored DMs with Gemini or Groq. Built during my internship at Welyne / ai-commandos.',
        cardTags: ['JavaScript', 'LLM', 'Manifest V3'],
        meta: 'AI & Automation Intern · Welyne · ai-commandos.com',
        metrics: [{ v: 'Manifest V3', k: 'Chrome extension' }, { v: 'Gemini · Groq', k: 'LLM generation' }, { v: 'Hours → mins', k: 'Outreach time' }],
        problem: 'Manual LinkedIn prospecting and outreach is hours of repetitive work — finding the right people, reading each profile, and hand-writing a personalized message for every one.',
        approach: [
          'Built a <b>Manifest V3 Chrome side-panel extension</b> in vanilla JS where you define your <b>ideal customer profile</b> (CEOs, C-suite executives…).',
          'Discovers prospects via <b>SerpApi</b> or LinkedIn search and <b>scrapes public profile data</b> for context.',
          'Generates <b>tailored DMs with Gemini or Groq</b>, adapting the messaging strategy to each profile through prompt engineering.',
          'Wired the full pipeline — discovery → scraping → LLM personalization → outreach — into one workflow, shipped on the <b>ai-commandos.com</b> platform.'
        ],
        impact: ['Turned hours of manual prospecting and message-writing into a near-instant automated workflow.', 'Higher relevance and engagement by adapting every message to the target’s profile data.'],
        tags: ['JavaScript', 'Manifest V3', 'SerpApi', 'Gemini', 'Groq', 'Web Scraping', 'Prompt Engineering'],
        links: [{ label: 'View on GitHub', href: GH + '/linkedin-scraping-extension', primary: true }]
      },
      {
        id: 'smart-hospital', repo: 'Smart-Hospital-TN', kicker: 'Java · OOP · Simulation', title: 'Hospital Robot Fleet Manager',
        desc: 'A complete object-oriented Java application with a Swing GUI that simulates controlling a fleet of specialized robots across a Tunisian university hospital — delivery, sample transport, UV disinfection, and patient assistance — from a central control station.',
        cardTags: ['Java', 'OOP', 'Swing'],
        meta: 'Object-Oriented Programming · INSAT',
        metrics: [{ v: '12 rooms', k: 'Live hospital map' }, { v: '4 task types', k: 'Polymorphic robots' }, { v: 'Swing GUI', k: 'Real-time sim' }],
        problem: 'Tunisian hospitals — ER, operating blocks, and separate pharmacy pavilions — need automation to relieve staff and optimize transport, assistance, and disinfection, modelled here as a central “Medical Control Station”.',
        approach: [
          'Designed a <b>dynamic hospital map</b> of 12 rooms with smooth Graphics2D animation of robots moving to their destinations.',
          'Modelled a fleet of <b>polymorphic robot tasks</b>: medicine delivery, temperature-controlled biological sample transport, intelligent UV disinfection, and patient assistance.',
          'Built a crash-resistant system with a custom <b>exception hierarchy</b> (BatterieCritiqueException, AuthentificationException, CheminBloqueException…) and authenticated operator control.',
          'Explored core OOP — encapsulation, inheritance &amp; interfaces (Connectable), polymorphism — behind a premium Swing light-theme UI.'
        ],
        impact: ['A robust, fully-simulated medical control station demonstrating production-grade OOP design.', 'An interruptive alert system with authenticated operator control over the entire robot network.'],
        tags: ['Java', 'OOP', 'Swing/AWT', 'Graphics2D', 'Polymorphism', 'Exceptions'],
        links: [{ label: 'View on GitHub', href: GH + '/Smart-Hospital-TN', primary: true }]
      },
      {
        id: 'nxp', repo: 'Nxp-Cup-2026', kicker: 'Robotics · Embedded', title: 'NXP Cup Racing Robot',
        desc: 'Autonomous racing robot that took 3rd place nationally. Real-time PID steering on a Teensy microcontroller with Pixy2 vision for track detection, and a SolidWorks-engineered chassis — recovered from a board failure 60 minutes before race day.',
        cardTags: ['C++', 'Teensy', 'PID Control'],
        meta: 'Software & Hardware Lead · IEEE INSAT RAS · 3rd / 16 teams',
        metrics: [{ v: '3rd / 16', k: 'National ranking' }, { v: 'Youngest', k: 'Team in the field' }, { v: '5 cm', k: 'Stop precision' }],
        problem: 'Design and race an autonomous car that tracks a line at high speed — and stays reliable under brutal competition pressure.',
        approach: [
          'Owned <b>real-time PID steering</b> software on a Teensy microcontroller, with a <b>Pixy2</b> vision camera for track detection.',
          'Designed and refined the <b>chassis in SolidWorks</b> for structural precision.',
          'When the main board <b>short-circuited 60 minutes before the race</b>, flashed firmware onto borrowed hardware with zero calibration time.'
        ],
        impact: ['<b>3rd place out of 16 teams</b> nationally — as the youngest team in the field.', 'The robot navigated the full track and stopped <b>exactly 5 cm</b> from the target cube on the second lap.'],
        tags: ['C++', 'Teensy', 'PID Control', 'SolidWorks', 'Pixy2', 'Embedded'],
        links: [{ label: 'View on GitHub', href: GH + '/Nxp-Cup-2026', primary: true }]
      },
      {
        id: 'extensions', repo: 'Extensions-Page', kicker: 'Frontend · UI', title: 'Extensions Manager UI',
        desc: 'A clean, modern browser-extension management panel replicating real browser UX, with light/dark theming and intuitive toggle controls.',
        cardTags: ['HTML', 'CSS', 'JavaScript'],
        meta: 'Frontend · UI engineering',
        metrics: [{ v: 'Light/Dark', k: 'Theming' }, { v: 'Pixel-clean', k: 'Browser UX' }, { v: 'Vanilla', k: 'No framework' }],
        problem: 'Faithfully recreate a modern browser-extension management panel as a clean, accessible UI component.',
        approach: [
          'Rebuilt the real browser panel UX with semantic <b>HTML/CSS</b> and vanilla <b>JavaScript</b>.',
          'Implemented <b>light/dark theming</b> and intuitive toggle controls.',
          'Focused on spacing, states, and accessibility for a production-quality feel.'
        ],
        impact: ['A polished, framework-free UI component that mirrors real browser interactions.'],
        tags: ['HTML', 'CSS', 'JavaScript'],
        links: [{ label: 'View on GitHub', href: GH + '/Extensions-Page', primary: true }]
      },
      {
        id: 'medicare', repo: 'MediCare-Pharmacy', kicker: 'Full-Stack · CS50', title: 'MediCare Pharmacy',
        desc: 'Full-stack online pharmacy built as a CS50 final project. Users browse medicines, manage a cart, and complete orders, while admins control inventory through a dedicated dashboard.',
        cardTags: ['Flask', 'Python', 'SQL'],
        meta: 'Full-Stack Developer · CS50 final project',
        metrics: [{ v: 'Full-stack', k: 'Architecture' }, { v: 'Cart → checkout', k: 'User flow' }, { v: 'Admin', k: 'Inventory panel' }],
        problem: 'Build a complete, functioning online pharmacy as the CS50 capstone — storefront, cart, orders, and administration.',
        approach: [
          'Built a <b>Flask</b> backend with a <b>SQL</b> database modelling medicines, users, carts, and orders.',
          'Implemented the full shopping flow: browse → cart → checkout.',
          'Added an <b>admin dashboard</b> for inventory and order management.'
        ],
        impact: ['A complete end-to-end e-commerce experience delivered as the CS50 final project.'],
        tags: ['Flask', 'Python', 'SQL', 'HTML/CSS'],
        links: [{ label: 'View on GitHub', href: GH + '/MediCare-Pharmacy', primary: true }]
      },
      {
        id: 'linefollower', repo: 'Line-Follower-Robot', kicker: 'Robotics · PID', title: 'Line Follower Robot',
        desc: 'Award-competing autonomous robot for the Robots League at ESSTH. IR sensor calibration, PID motor control, and full autonomous track navigation from the ground up.',
        cardTags: ['C++', 'Arduino', 'IR Sensors'],
        meta: 'Robotics · Robots League @ ESSTH',
        metrics: [{ v: 'Autonomous', k: 'Navigation' }, { v: 'PID', k: 'Motor control' }, { v: 'Award', k: 'Competing entry' }],
        problem: 'Build an autonomous line-following robot from scratch for the Robots League competition at ESSTH.',
        approach: [
          'Calibrated an <b>IR sensor array</b> for robust line detection across lighting conditions.',
          'Implemented <b>PID motor control</b> for smooth, stable tracking.',
          'Achieved full autonomous track navigation end to end.'
        ],
        impact: ['An award-competing autonomous robot, built and tuned from the ground up.'],
        tags: ['C++', 'Arduino', 'IR Sensors', 'Robotics'],
        links: [{ label: 'View on GitHub', href: GH + '/Line-Follower-Robot', primary: true }]
      }
    ];
    const byId = Object.fromEntries(PROJECTS.map(p => [p.id, p]));
    const curatedRepos = new Set(PROJECTS.map(p => p.repo.toLowerCase()));

    /* ---- modal ---- */
    const elKicker = document.getElementById('modalKicker'), elTitle = document.getElementById('modalTitle'),
      elMeta = document.getElementById('modalMeta'), elMetrics = document.getElementById('modalMetrics'),
      elBody = document.getElementById('modalBody'), elTags = document.getElementById('modalTags'),
      elLinks = document.getElementById('modalLinks'), closeBtn = document.getElementById('modalClose');
    let lastFocus = null;

    const fill = p => {
      elKicker.textContent = p.kicker;
      elTitle.textContent = p.title;
      elMeta.innerHTML = p.meta.replace(/(\d+(?:st|nd|rd|th)?\s*\/\s*\d+)/, '<b>$1</b>');
      elMetrics.innerHTML = p.metrics.map(m => `<div class="modal-metric"><div class="v">${m.v}</div><div class="k">${m.k}</div></div>`).join('');
      elBody.innerHTML =
        `<div class="modal-block"><h4>The Problem</h4><p>${p.problem}</p></div>` +
        `<div class="modal-block"><h4>The Approach</h4><ul>${p.approach.map(a => `<li>${a}</li>`).join('')}</ul></div>` +
        `<div class="modal-block"><h4>The Impact</h4><ul>${p.impact.map(a => `<li>${a}</li>`).join('')}</ul></div>`;
      elTags.innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');
      elLinks.innerHTML = p.links.map(l =>
        `<a href="${l.href}" target="_blank" rel="noopener" class="btn ${l.primary ? 'btn-primary' : 'btn-ghost'}" data-cursor>${l.label} ${arrow}</a>`).join('');
    };
    const openModal = id => {
      const p = byId[id]; if (!p) return;
      lastFocus = document.activeElement;
      fill(p);
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
      modal.querySelector('.modal-scroll').scrollTop = 0;
      lenis && lenis.stop();
      setTimeout(() => closeBtn.focus(), 60);
    };
    const closeModal = () => {
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
      lenis && lenis.start();
      lastFocus && lastFocus.focus && lastFocus.focus();
    };
    closeBtn.addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

    /* ---- cards ---- */
    const bindGlow = (node, label) => {
      if (isTouch || !ring) return;
      node.addEventListener('mouseenter', () => { ring.classList.add('lbl'); curTxt.textContent = label; });
      node.addEventListener('mouseleave', () => { ring.classList.remove('lbl'); curTxt.textContent = ''; });
      node.addEventListener('mousemove', e => { const r = node.getBoundingClientRect(); node.style.setProperty('--cx', (e.clientX - r.left) + 'px'); node.style.setProperty('--cy', (e.clientY - r.top) + 'px'); });
    };
    const chartCard = p => {
      const a = document.createElement('article');
      a.className = 'panel'; a.dataset.project = p.id; a.tabIndex = 0;
      a.setAttribute('role', 'button'); a.setAttribute('aria-label', 'Open ' + p.title + ' case study'); a.setAttribute('data-cursor', '');
      a.innerHTML =
        `<div class="panel-top"><span class="panel-idx"></span><span class="panel-arrow">${arrow}</span></div>
         <div class="panel-kicker">${esc(p.kicker)}</div>
         <h3 class="panel-title">${esc(p.title)}</h3>
         <p class="panel-desc">${esc(p.desc)}</p>
         <div class="panel-tags">${p.cardTags.map(t => `<span class="panel-tag">${esc(t)}</span>`).join('')}</div>`;
      a.addEventListener('click', () => openModal(p.id));
      a.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(p.id); } });
      bindGlow(a, 'OPEN');
      return a;
    };
    const repoCard = repo => {
      const a = document.createElement('a');
      a.className = 'panel panel-gh'; a.href = repo.html_url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('data-cursor', '');
      const lang = repo.language || 'Code';
      const stars = repo.stargazers_count ? ` · ★ ${repo.stargazers_count}` : '';
      const desc = repo.description || 'A recent project — click to open the repository on GitHub.';
      const topics = (repo.topics || []).slice(0, 3).map(t => `<span class="panel-tag">${esc(t)}</span>`).join('');
      a.innerHTML =
        `<div class="panel-top"><span class="panel-idx"></span><span class="panel-arrow">${arrow}</span></div>
         <span class="panel-live">LIVE · GITHUB</span>
         <div class="panel-kicker">${esc(lang)}${stars}</div>
         <h3 class="panel-title">${esc(repo.name)}</h3>
         <p class="panel-desc">${esc(desc)}</p>
         <div class="panel-tags"><span class="panel-tag">${esc(lang)}</span>${topics}<span class="panel-tag gh-new">↗ repo</span></div>`;
      bindGlow(a, 'GITHUB');
      return a;
    };
    const renumber = () => track.querySelectorAll('.panel .panel-idx').forEach((el, i) => el.textContent = '/ ' + String(i + 1).padStart(2, '0'));
    const render = nodes => { track.innerHTML = ''; nodes.forEach(n => track.appendChild(n)); renumber(); };

    // initial paint — curated in fallback order (works offline / file://)
    render(PROJECTS.map(chartCard));

    // enhance with live GitHub data: sort everything newest-first by updated date
    (async () => {
      let repos;
      try {
        const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`, { headers: { Accept: 'application/vnd.github+json' } });
        if (!res.ok) return;
        repos = await res.json();
      } catch (e) { return; }
      if (!Array.isArray(repos)) return;

      const dateOf = {};
      repos.forEach(r => { dateOf[r.name.toLowerCase()] = Date.parse(r.updated_at) || 0; });

      const items = PROJECTS.map(p => ({ kind: 'chart', p, date: dateOf[p.repo.toLowerCase()] || 0 }));
      repos.filter(r => !r.fork && !r.archived && !curatedRepos.has(r.name.toLowerCase()) && !IGNORE.has(r.name.toLowerCase()))
        .forEach(r => items.push({ kind: 'repo', repo: r, date: Date.parse(r.updated_at) || 0 }));

      items.sort((a, b) => b.date - a.date);   // newest first
      render(items.map(it => it.kind === 'chart' ? chartCard(it.p) : repoCard(it.repo)));
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    })();
  })();
});
