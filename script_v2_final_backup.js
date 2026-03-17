'use strict';

// CUSTOM CURSOR
const curDot  = document.getElementById('cursorDot');
const curRing = document.getElementById('cursorRing');
let mx = -200, my = -200, rx = -200, ry = -200;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
(function cursorLoop() {
  curDot.style.left  = mx + 'px';
  curDot.style.top   = my + 'px';
  rx += (mx - rx) * 0.13;
  ry += (my - ry) * 0.13;
  curRing.style.left = rx + 'px';
  curRing.style.top  = ry + 'px';
  requestAnimationFrame(cursorLoop);
})();

// MAGNETIC BUTTONS
document.querySelectorAll('[data-magnetic]').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    el.style.transform = `translate(${x * 0.3}px,${y * 0.3}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1)';
    el.style.transform  = '';
    setTimeout(() => { el.style.transition = ''; }, 550);
  });
});

// HEADER SCROLL + PROGRESS BAR + BACK TO TOP
const header    = document.getElementById('header');
const progress  = document.getElementById('scrollProgress');
const backTop   = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progress.style.width = Math.min(pct, 100) + '%';
  backTop.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// MOBILE NAV
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('navMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('open');
});
navMenu.querySelectorAll('.nav-item').forEach(l => {
  l.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

// CANVAS CONSTELLATION BACKGROUND
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');
let cW, cH, stars = [];

function resizeCanvas() {
  cW = canvas.width  = canvas.offsetWidth;
  cH = canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); initStars(); }, { passive: true });
resizeCanvas();

let mouseCX = 9999, mouseCY = 9999;
document.addEventListener('mousemove', e => { mouseCX = e.clientX; mouseCY = e.clientY; }, { passive: true });

class Star {
  constructor() { this.reset(); }
  reset() {
    this.ox = this.x = Math.random() * cW;
    this.oy = this.y = Math.random() * cH;
    this.vx = (Math.random() - 0.5) * 0.18;
    this.vy = (Math.random() - 0.5) * 0.18;
    this.r  = Math.random() * 1.1 + 0.2;
    this.a  = Math.random() * 0.45 + 0.1;
    this.color = Math.random() > 0.7 ? '#38bdf8' : Math.random() > 0.5 ? '#818cf8' : '#ffffff';
  }
  update() {
    const dx = mouseCX - this.x, dy = mouseCY - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < 100) {
      const f = (100 - d) / 100;
      this.x -= (dx / d) * f * 1.8;
      this.y -= (dy / d) * f * 1.8;
    } else {
      this.x += (this.ox - this.x) * 0.02;
      this.y += (this.oy - this.y) * 0.02;
    }
    this.ox += this.vx; this.oy += this.vy;
    if (this.ox < 0 || this.ox > cW) this.vx *= -1;
    if (this.oy < 0 || this.oy > cH) this.vy *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.a;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
function initStars() {
  const n = Math.min(Math.floor(cW * cH / 10000), 100);
  stars = Array.from({ length: n }, () => new Star());
}
function drawLines() {
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(56,189,248,${(1 - d / 100) * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(stars[i].x, stars[i].y);
        ctx.lineTo(stars[j].x, stars[j].y);
        ctx.stroke();
      }
    }
  }
}
(function canvasLoop() {
  ctx.clearRect(0, 0, cW, cH);
  stars.forEach(s => { s.update(); s.draw(); });
  drawLines();
  requestAnimationFrame(canvasLoop);
})();
initStars();

// HERO ROLE TYPING
const roles  = ['Cybersecurity Enthusiast', 'Ethical Hacker in Training', 'AI Security Researcher', 'Embedded Systems Builder', 'ICT Engineering Student'];
const roleEl = document.getElementById('heroRole');
let ri = 0, ci = 0, del = false, tPaused = false;
function typeRole() {
  if (tPaused || !roleEl) return;
  const cur = roles[ri];
  if (!del) {
    roleEl.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { tPaused = true; setTimeout(() => { del = true; tPaused = false; typeRole(); }, 2500); return; }
    setTimeout(typeRole, 52);
  } else {
    roleEl.textContent = cur.slice(0, --ci);
    if (ci === 0) { del = false; ri = (ri + 1) % roles.length; }
    setTimeout(typeRole, 28);
  }
}
setTimeout(typeRole, 900);

// TEXT SCRAMBLE
const SC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
class Scrambler {
  constructor(el) { this.el = el; this.target = el.dataset.text; this.done = false; }
  run() {
    if (this.done) return; this.done = true;
    let iter = 0;
    const iv = setInterval(() => {
      this.el.textContent = this.target.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        return i < Math.floor(iter) ? this.target[i] : SC[Math.floor(Math.random() * SC.length)];
      }).join('');
      if (iter >= this.target.length) clearInterval(iv);
      iter += 0.45;
    }, 38);
  }
}
const scramblers = [...document.querySelectorAll('.scramble-text')].map(el => new Scrambler(el));

// COUNT-UP
function countUp(el, n, dur = 1300) {
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(e * n);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = n + '+';
  })(start);
}

// INTERSECTION OBSERVER — reveal, scramble, count-up, skill bars
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    setTimeout(() => {
      el.classList.add('visible');
      scramblers.forEach(s => { if (el.contains(s.el)) s.run(); });
      el.querySelectorAll('[data-count]').forEach(n => countUp(n, +n.dataset.count));
      el.querySelectorAll('.si-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
    }, i * 75);
    io.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal-up, .reveal-line').forEach(el => io.observe(el));

// Skill fills observer
const sfObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.si-fill').forEach(b => setTimeout(() => { b.style.width = b.dataset.w + '%'; }, 400));
    sfObs.unobserve(e.target);
  });
}, { threshold: 0.2 });
document.querySelectorAll('.skill-col').forEach(c => sfObs.observe(c));

// ACTIVE NAV
const navItems  = document.querySelectorAll('.nav-item');
const secEls    = document.querySelectorAll('section[id]');
const navObs    = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navItems.forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-item[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { threshold: 0.4 });
secEls.forEach(s => navObs.observe(s));

// TERMINAL ANIMATION
const termCmd = document.getElementById('termCmd');
const termOut = document.getElementById('termOutput');
const termSeqs = [
  { cmd: 'nmap -sV --script vuln 10.0.0.1', delay: 600, lines: [
    { t: 'Starting Nmap 7.94...', c: '' },
    { t: 'PORT  22/tcp open  SSH', c: 't-ok' },
    { t: 'PORT  80/tcp open  HTTP', c: 't-ok' },
    { t: '! CVE-2023-44487 possible', c: 't-warn' },
  ]},
  { cmd: 'python3 malware_detect.py', delay: 600, lines: [
    { t: 'Loading model [████] 100%', c: '' },
    { t: '[ ✓ ] Model ready — 94.2% acc', c: 't-ok' },
    { t: '[ ⚠ ] Anomaly PID:1337 ~89%', c: 't-warn' },
  ]},
  { cmd: 'git push origin main', delay: 500, lines: [
    { t: 'Counting objects: 14', c: '' },
    { t: '→ github.com/Ahmedd-Ben-Salah', c: '' },
    { t: '✓  main → main', c: 't-ok' },
  ]},
];
let seqIdx = 0;
function runTerm() {
  if (!termCmd || !termOut) return;
  const seq = termSeqs[seqIdx % termSeqs.length];
  termCmd.textContent = '';
  termOut.innerHTML = '';
  let ci2 = 0;
  const iv = setInterval(() => {
    termCmd.textContent = seq.cmd.slice(0, ++ci2);
    if (ci2 >= seq.cmd.length) {
      clearInterval(iv);
      seq.lines.forEach((line, li) => {
        setTimeout(() => {
          const s = document.createElement('span');
          s.textContent = line.t;
          if (line.c) s.className = line.c;
          termOut.appendChild(s);
        }, seq.delay + li * 300);
      });
      setTimeout(() => { seqIdx++; runTerm(); }, seq.delay + seq.lines.length * 300 + 2800);
    }
  }, 52);
}
setTimeout(runTerm, 1600);

// LIVE ROBOT DATA
const speedVal = document.getElementById('speedVal');
const steerVal = document.getElementById('steerVal');
if (speedVal && steerVal) {
  setInterval(() => {
    speedVal.textContent = (84 + Math.floor(Math.random() * 8)) + ' kph';
    steerVal.textContent = (Math.random() > 0.5 ? '+' : '-') + Math.floor(Math.random() * 9) + '°';
  }, 900);
}

// CONTACT FORM
const form    = document.getElementById('contactForm');
const subBtn  = document.getElementById('submitBtn');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('fname').value.trim();
    const email = document.getElementById('femail').value.trim();
    const subj  = document.getElementById('fsubject').value.trim() || 'Portfolio Contact';
    const msg   = document.getElementById('fmsg').value.trim();
    const body  = `Hello Ahmed,\n\nName: ${name}\nEmail: ${email}\n\n${msg}`;
    subBtn.querySelector('.submit-text').textContent = 'Opening mail client...';
    setTimeout(() => {
      window.location.href = `mailto:ahmed.bensalah@insat.ucar.tn?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      subBtn.querySelector('.submit-text').textContent = '✓ Sent!';
      setTimeout(() => { subBtn.querySelector('.submit-text').textContent = 'Send Message'; form.reset(); }, 3000);
    }, 700);
  });
}

// LOGO SCRAMBLE
const logoLink = document.getElementById('logoLink');
if (logoLink) {
  const logoName = logoLink.querySelector('.logo-name');
  logoLink.addEventListener('click', () => {
    const orig = 'Ahmed.';
    let iter = 0;
    const iv = setInterval(() => {
      logoName.textContent = orig.split('').map((ch, i) => {
        if (ch === '.') return '.';
        return i < Math.floor(iter) ? orig[i] : SC[Math.floor(Math.random() * SC.length)];
      }).join('');
      if (iter >= orig.length) clearInterval(iv);
      iter += 0.45;
    }, 40);
  });
}

// THEME TOGGLE
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
}

// PROFILE PHOTO 3D TILT
const pfWrap = document.querySelector('.profile-photo-frame');
if (pfWrap) {
  pfWrap.addEventListener('mousemove', e => {
    const r = pfWrap.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    pfWrap.style.transform = `perspective(800px) rotateY(${x * 0.15}deg) rotateX(${-y * 0.15}deg) scale3d(1.05, 1.05, 1.05)`;
  });
  pfWrap.addEventListener('mouseleave', () => {
    pfWrap.style.transform = '';
  });
}

// FACT CARD 3D TILT
document.querySelectorAll('.fact-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const rx = (y / r.height - 0.5) * -15;
    const ry = (x / r.width  - 0.5) *  15;
    card.style.transform = `translateY(-4px) perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.borderColor = 'rgba(56,189,248,0.4)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.borderColor = '';
    card.style.transition = 'all 0.4s ease';
    setTimeout(() => card.style.transition = '', 400);
  });
});
