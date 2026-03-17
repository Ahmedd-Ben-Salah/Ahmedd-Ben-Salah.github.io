'use strict';

// CUSTOM CURSOR & SURROUNDING LOGIC
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

// AUDIO SFX
const sfxHover = document.getElementById('sfx-hover');
const sfxClick = document.getElementById('sfx-click');
const sfxType  = document.getElementById('sfx-type');
if(sfxHover) sfxHover.volume = 0.15;
if(sfxClick) sfxClick.volume = 0.2;
if(sfxType) sfxType.volume = 0.1;

let usrAudio = false;
document.body.addEventListener('click', () => { usrAudio = true; }, { once: true });

function playSfx(type) {
  if(!usrAudio) return;
  if(type === 'hover' && sfxHover) { sfxHover.currentTime = 0; sfxHover.play().catch(()=>{}); }
  if(type === 'click' && sfxClick) { sfxClick.currentTime = 0; sfxClick.play().catch(()=>{}); }
}

// MAGNETIC BUTTONS
// MAGNETIC BUTTONS + AUDIO
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
document.querySelectorAll('a, button, .magnetic, .cert-card, .fact-card').forEach(el => {
  el.addEventListener('mouseenter', () => playSfx('hover'));
  el.addEventListener('click', () => playSfx('click'));
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

// PAGE TRANSITIONS + MOBILE NAV
const hamburger    = document.getElementById('hamburger');
const navMenu      = document.getElementById('navMenu');
const transitionEl = document.getElementById('pageTransition');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('open');
});

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
    
    const targetId = link.getAttribute('href');
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;
    
    if (transitionEl) {
      transitionEl.classList.add('active');
      setTimeout(() => {
        window.scrollTo({ top: targetEl.offsetTop, behavior: 'instant' });
        setTimeout(() => { transitionEl.classList.remove('active'); }, 150);
      }, 600);
    } else {
      window.scrollTo({ top: targetEl.offsetTop, behavior: 'smooth' });
    }
  });
});

// WEBGL PARTICLE BACKGROUND (THREE.JS)
const webglContainer = document.getElementById('webgl-container');
if (webglContainer && typeof THREE !== 'undefined') {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  webglContainer.appendChild(renderer.domElement);

  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 800;
  const posArray = new Float32Array(particlesCount * 3);
  const colorsArray = new Float32Array(particlesCount * 3);
  
  const color1 = new THREE.Color('#38bdf8'); // cyan
  const color2 = new THREE.Color('#818cf8'); // violet
  const color3 = new THREE.Color('#34d399'); // green
  
  for(let i = 0; i < particlesCount * 3; i+=3) {
    posArray[i]   = (Math.random() - 0.5) * 10;
    posArray[i+1] = (Math.random() - 0.5) * 10;
    posArray[i+2] = (Math.random() - 0.5) * 10;
    
    let mixColor = color1;
    const r = Math.random();
    if(r > 0.6) mixColor = color2;
    else if(r > 0.9) mixColor = color3;
    
    colorsArray[i]   = mixColor.r;
    colorsArray[i+1] = mixColor.g;
    colorsArray[i+2] = mixColor.b;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.025,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const particlesMesh = new THREE.Points(particlesGeometry, material);
  scene.add(particlesMesh);
  camera.position.z = 3;

  let mouseX3D = 0; let mouseY3D = 0;
  document.addEventListener('mousemove', e => {
    mouseX3D = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY3D = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animateWebGL() {
    requestAnimationFrame(animateWebGL);
    const elapsedTime = clock.getElapsedTime();
    
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;
    
    if (mouseX3D > 0 || mouseY3D > 0) {
      particlesMesh.rotation.x += mouseY3D * 0.05;
      particlesMesh.rotation.y += mouseX3D * 0.05;
    }
    
    renderer.render(scene, camera);
  }
  animateWebGL();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

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

// LIVE TERMINAL PLAYGROUND
const termInput = document.getElementById('termInput');
const termOut = document.getElementById('termOutput');
const fileSystem = ['projects', 'skills', 'about', 'contact', 'cv.pdf', 'secret.txt'];
const termCommands = {
  'help': 'Available commands: whoami, ls, cat [file], clear, theme [light/dark/hack], sudo',
  'whoami': 'guest_user (Type "sudo" for root access)',
  'ls': fileSystem.join('  '),
  'ls -l': fileSystem.map(f => `-rw-r--r-- 1 abs devs 4096 ${f}`).join('<br>'),
  'clear': '',
  'sudo': 'Access denied. This incident will be reported.',
  'sudo su': 'Nice try.',
  'cat secret.txt': 'You found the easter egg! Hack mode unlocked. Type "theme hack"',
  'theme light': 'Switching to light mode...',
  'theme dark': 'Switching to dark mode...',
  'theme hack': 'INITIATING HACK SEQUENCE...'
};

if (termInput && termOut) {
  termInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = termInput.value.trim().toLowerCase();
      termInput.value = '';
      if (!val) return;
      
      const cmdSpan = document.createElement('span');
      cmdSpan.innerHTML = `<span class="t-prompt">ABS@kali:~$</span> <span class="t-cmd">${val}</span>`;
      termOut.appendChild(cmdSpan);

      if (val === 'clear') { termOut.innerHTML = ''; return; }
      
      const replySpan = document.createElement('span');
      let replyTxt = '';

      if (termCommands[val]) {
        replyTxt = termCommands[val];
        replySpan.className = 't-ok';
      } else if (val.startsWith('cat ')) {
        const file = val.split(' ')[1];
        if (fileSystem.includes(file)) replyTxt = `Opening ${file}... (Scroll down page to view)`;
        else { replyTxt = `cat: ${file}: No such file or directory`; replySpan.className = 't-err'; }
      } else {
        replyTxt = `bash: ${val}: command not found<br>ERR: INVALID_SYS_STATE`;
        replySpan.className = 'term-glitch';
        setTimeout(() => replySpan.classList.remove('term-glitch'), 1500);
      }
      
      replySpan.innerHTML = replyTxt;
      termOut.appendChild(replySpan);
      termOut.scrollTop = termOut.scrollHeight;

      // Handle special actions
      if (val === 'theme light') document.getElementById('modeBtn')?.click();
      if (val === 'theme dark') document.getElementById('modeBtn')?.click();
      if (val === 'theme hack') document.getElementById('hackBtn')?.click();
      
      if(sfxType) { sfxType.currentTime=0; sfxType.play().catch(()=>{}); setTimeout(()=>sfxType.pause(), 150); }
    }
  });
  // Keep focus on clicks
  document.querySelector('.terminal-card')?.addEventListener('click', () => {
    termInput.focus();
  });
}

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

// THEMES (LIGHT / DARK / HACKER)
const modeBtn = document.getElementById('modeBtn');
const hackBtn = document.getElementById('hackBtn');

if (modeBtn) {
  modeBtn.addEventListener('click', () => {
    document.body.classList.remove('hack');
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}
if (hackBtn) {
  hackBtn.addEventListener('click', () => {
    document.body.classList.remove('light');
    document.body.classList.toggle('hack');
    localStorage.setItem('theme', document.body.classList.contains('hack') ? 'hack' : 'dark');
    if (document.body.classList.contains('hack') && sfxType) {
      sfxType.currentTime = 0; sfxType.play().catch(()=>{});
      setTimeout(()=>sfxType.pause(), 1000);
    }
  });
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') document.body.classList.add('light');
else if (savedTheme === 'hack') document.body.classList.add('hack');

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
