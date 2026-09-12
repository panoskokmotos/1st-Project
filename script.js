// ── Respect OS-level "reduce motion" preference ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Page Loader ──
(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('loader-done');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  // Hide as soon as everything is loaded, with a tiny delay so the animation plays
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 350);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 300));
  }
  // Hard fallback: never block the user longer than 2.5 s
  setTimeout(hideLoader, 2500);
})();

// ── Navbar: transparent → solid on scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mobile menu ──
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
const navMobileClose = document.getElementById('navMobileClose');
let menuScrollY = 0;

function closeMenu() {
  navMobile.classList.remove('open');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Menu');
  document.body.classList.remove('nav-open');
  document.body.style.top = '';
  window.scrollTo(0, menuScrollY);
}

hamburger.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open');
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Menu');
  if (isOpen) {
    menuScrollY = window.scrollY;
    document.body.style.top = `-${menuScrollY}px`;
    document.body.classList.add('nav-open');
  } else {
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, menuScrollY);
  }
});
if (navMobileClose) {
  navMobileClose.addEventListener('click', closeMenu);
}
// Close when clicking outside
document.addEventListener('click', (e) => {
  if (navMobile.classList.contains('open') &&
      !navMobile.contains(e.target) &&
      !hamburger.contains(e.target)) {
    closeMenu();
  }
});
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

// ── Scroll-triggered fade-in ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-animate], .timeline-item, .edu-card, .award-card, .project-card, .book-card, .milestone, .press-card').forEach(el => observer.observe(el));

// ── Animated counters ──
function animateCounter(el) {
  const target = +el.dataset.target;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  const step = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(eased * target);
    const formatted = value >= 1000 ? Math.floor(value / 1000) + 'K' : value;
    el.textContent = prefix + formatted + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.impact-num').forEach(el => counterObserver.observe(el));

// ── Active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + e.target.id) a.style.color = '#fff';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

// ── Theme: dark mode locked ──
document.documentElement.setAttribute('data-theme', 'dark');

// ── Logo strip drag-to-scroll ──
document.querySelectorAll('.logos-strip-wrap').forEach(wrap => {
  let isDown = false, startX = 0, scrollLeft = 0;
  const track = wrap.querySelector('.logos-track');

  function dragStart(x) {
    isDown = true;
    startX = x - wrap.getBoundingClientRect().left;
    scrollLeft = wrap.scrollLeft;
    wrap.classList.add('dragging');
    if (track) track.style.animationPlayState = 'paused';
  }
  function dragEnd() {
    if (!isDown) return;
    isDown = false;
    wrap.classList.remove('dragging');
    if (track) track.style.animationPlayState = '';
  }
  function dragMove(x) {
    if (!isDown) return;
    const walk = (x - wrap.getBoundingClientRect().left - startX) * 1.5;
    wrap.scrollLeft = scrollLeft - walk;
  }

  wrap.addEventListener('mousedown', e => { dragStart(e.clientX); e.preventDefault(); });
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('mousemove', e => { if (isDown) dragMove(e.clientX); });

  wrap.addEventListener('touchstart', e => { dragStart(e.touches[0].clientX); }, { passive: true });
  wrap.addEventListener('touchend', dragEnd);
  wrap.addEventListener('touchmove', e => { if (isDown) dragMove(e.touches[0].clientX); }, { passive: true });
});

// ── Scroll progress bar ──
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

// ── Confetti on first visit (session-gated) ──
(function () {
  if (prefersReducedMotion) return;
  if (sessionStorage.getItem('confetti_done')) return;
  sessionStorage.setItem('confetti_done', '1');

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#3b6ef8', '#d4af37', '#10b981', '#f43f5e', '#8b5cf6', '#f97316'];
  const pieces = Array.from({ length: 65 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 3,
    d: Math.random() * 80 + 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: Math.random() * 0.1 + 0.05,
  }));

  let frame = 0;
  let anim;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += (Math.cos(frame / 10 + p.d) + 2.5);
      p.x += Math.sin(frame / 10) * 0.8;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });
    frame++;
    if (frame < 140) {
      anim = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(anim);
      canvas.remove();
    }
  }
  draw();
})();

// ── Book cover placeholder detection (Open Library returns 1px gif for missing covers) ──
document.querySelectorAll('.book-cover-img').forEach(img => {
  const checkSize = () => {
    if (img.naturalWidth < 10 || img.naturalHeight < 10) {
      const abbr = img.alt.replace(' cover', '').split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
      img.parentElement.innerHTML = `<div class="book-cover-fb">${abbr}</div>`;
    }
  };
  if (img.complete) checkSize();
  else img.addEventListener('load', checkSize);
});

// ── Hero parallax orbs ──
const heroOrbs = document.querySelectorAll('.hero-orb');
if (heroOrbs.length && !prefersReducedMotion) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroOrbs[0] && (heroOrbs[0].style.transform = `translateY(${y * 0.25}px)`);
    heroOrbs[1] && (heroOrbs[1].style.transform = `translateY(${-y * 0.18}px)`);
    heroOrbs[2] && (heroOrbs[2].style.transform = `translate(-50%, calc(-50% + ${y * 0.1}px))`);
  }, { passive: true });
}

// ── Video autoplay on hover (featured iframe only — grid uses façades) ──
document.querySelectorAll('.watch-featured .watch-embed-wrap').forEach(wrap => {
  const iframe = wrap.querySelector('iframe');
  if (!iframe || iframe.closest('.yt-facade')) return;
  const baseSrc = iframe.src.split('?')[0];
  iframe.setAttribute('src', baseSrc);
  let hoverTimer;
  wrap.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      iframe.setAttribute('src', baseSrc + '?autoplay=1&mute=1&rel=0');
    }, 300);
  });
  wrap.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    iframe.setAttribute('src', baseSrc);
  });
});

// ── Journey Gamification (bidirectional — follows scroll up & down) ──
(function() {
  const track     = document.getElementById('milestonesTrack');
  const walker    = document.getElementById('journeyWalker');
  const xpFill    = document.getElementById('journeyXpFill');
  const xpPts     = document.getElementById('journeyXpPts');
  const lvlBadge  = document.getElementById('journeyLevelBadge');
  const toastWrap = document.getElementById('achievementToasts');
  if (!track) return;

  const LEVELS = [
    [0,   '📖 A curious kid from Patras'],
    [100, '🌱 First steps & small wins'],
    [200, '🎓 Learning, failing, growing'],
    [300, '✨ Finding my purpose'],
    [400, '🚀 Building something real'],
    [500, '🏆 Recognition & momentum'],
    [600, '🌍 Taking it global'],
    [700, '🙏 Grateful & still learning'],
    [800, '⭐ The journey continues…'],
  ];
  const MAX_XP = 800;

  const milestones = Array.from(track.querySelectorAll('.milestone[data-achievement]'));
  const toastShown = new Set(); // only toast each achievement once (first unlock going down)
  let lastActiveIdx = -1;
  let currentXp = 0;

  function getLevelLabel(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i][0]) return LEVELS[i][1];
    }
    return LEVELS[0][1];
  }

  function showToast(text) {
    if (!toastWrap || toastShown.has(text)) return;
    toastShown.add(text);
    const t = document.createElement('div');
    t.className = 'achievement-toast';
    t.innerHTML = `<span class="toast-icon">🔓</span><span>${text}</span><span class="toast-xp">+100 XP</span>`;
    toastWrap.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function setXp(newXp) {
    const prevLabel = getLevelLabel(currentXp);
    currentXp = Math.max(0, Math.min(newXp, MAX_XP));
    const pct = (currentXp / MAX_XP) * 100;
    if (xpFill) xpFill.style.width = pct + '%';
    if (xpPts)  xpPts.textContent  = currentXp;
    const newLabel = getLevelLabel(currentXp);
    if (lvlBadge && newLabel !== prevLabel) {
      lvlBadge.textContent = newLabel;
      lvlBadge.classList.remove('level-up');
      void lvlBadge.offsetWidth;
      lvlBadge.classList.add('level-up');
    }
  }

  function moveWalkerTo(milestoneEl) {
    if (!walker || !milestoneEl) return;
    const dotEl = milestoneEl.querySelector('.ms-dot');
    if (!dotEl) return;
    walker.style.top = (milestoneEl.offsetTop + dotEl.offsetTop + 4) + 'px';
  }

  // Determine which milestone is currently "active" based on scroll position.
  // A milestone is active when its top edge has crossed 65% down the viewport.
  function getActiveIdx() {
    const threshold = window.scrollY + window.innerHeight * 0.65;
    let active = -1;
    for (let i = 0; i < milestones.length; i++) {
      const absTop = milestones[i].getBoundingClientRect().top + window.scrollY;
      if (absTop <= threshold) active = i;
      else break;
    }
    return active;
  }

  function update() {
    const idx = getActiveIdx();
    if (idx === lastActiveIdx) return;

    // Fire toasts only on first downward unlock
    if (idx > lastActiveIdx) {
      for (let i = lastActiveIdx + 1; i <= idx; i++) {
        const ach = milestones[i].dataset.achievement;
        if (ach) showToast(ach);
      }
    }

    lastActiveIdx = idx;

    if (idx >= 0) {
      moveWalkerTo(milestones[idx]);
      setXp((idx + 1) * 100);
    } else {
      // Above all milestones: reset to start
      moveWalkerTo(milestones[0]);
      setXp(0);
    }
  }

  // Scroll drives everything — bidirectional
  window.addEventListener('scroll', update, { passive: true });

  // Initial state
  setXp(0);
  if (lvlBadge)      lvlBadge.textContent = getLevelLabel(0);
  if (milestones[0]) moveWalkerTo(milestones[0]);
  update(); // handle page-load mid-scroll
})();

// ── Contact form async submit ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const success = document.getElementById('formSuccess');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = '<span class="btn-spinner"></span>Sending…';
    // Capture form data before reset
    const formData = new FormData(contactForm);
    const notifData = {
      name: formData.get('name') || '—',
      email: formData.get('email') || '—',
      subject: formData.get('subject') || '—',
      page: location.href,
      time: new Date().toISOString(),
    };
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        contactForm.reset();
        btn.innerHTML = '✓ Sent!';
        btn.classList.remove('btn-loading');
        success.classList.add('visible');
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Fire-and-forget: notify Panos via worker
        sendSiteNotification('Contact Form Submission', notifData);
      } else {
        btn.disabled = false;
        btn.classList.remove('btn-loading');
        btn.innerHTML = originalHTML;
        alert('Something went wrong. Please try again.');
      }
    } catch {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = originalHTML;
      alert('Network error. Please email panagiotis.kokmotoss@gmail.com directly.');
    }
  });
}

// ── Sticky mobile CTA (shows after 30% scroll, hides at contact) ──
(function() {
  const cta = document.getElementById('stickyCta');
  if (!cta) return;
  const contact = document.getElementById('contact');
  function updateCta() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
    const pastContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.8;
    if (pct >= 0.3 && !pastContact) {
      cta.classList.add('visible');
    } else {
      cta.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', updateCta, { passive: true });
  cta.setAttribute('aria-hidden', 'false');
})();

// ── "Now" section — auto date ──
(function() {
  const el = document.getElementById('nowDate');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
})();

// ── Book cover skeleton — mark loaded images ──
document.querySelectorAll('.skeleton-wrap img.book-cover-img').forEach(img => {
  const done = () => img.classList.add('img-loaded');
  if (img.complete && img.naturalWidth > 0) done();
  else img.addEventListener('load', done);
});

// ── Back to top ──
(function() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ── AI Chat: proactive trigger (once per session, after 15s idle — desktop only) ──
(function() {
  if (sessionStorage.getItem('chat_proactive_done')) return;
  // Never auto-open on mobile/touch — intrusive on small screens
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) return;
  const widget = document.getElementById('chatWidget');
  const toggle = document.getElementById('chatToggle');
  if (!widget || !toggle) return;
  // Only fire if chat hasn't been manually opened yet
  const timer = setTimeout(() => {
    if (widget.classList.contains('open')) return; // user already opened it
    sessionStorage.setItem('chat_proactive_done', '1');
    toggle.click(); // open chat
    // Show a proactive intro message (injected as a "bot thinking then reveal" effect)
    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      const existing = msgs.querySelectorAll('.chat-msg.bot');
      if (existing.length === 1) {
        // Replace the generic welcome with a more personal nudge
        existing[0].querySelector('p').textContent =
          '👋 Hey! Quick one — curious about Givelink, or want to know what Panos is focused on right now?';
      }
    }
  }, 15000);
  // Cancel if user interacts with the chat themselves
  toggle.addEventListener('click', () => clearTimeout(timer), { once: true });
})();

// ── AI Chat: keyboard shortcut (/ or ?) to toggle ──
(function() {
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement || {}).tagName || '';
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return; // don't intercept form typing
    if (e.key === '/' || e.key === '?') {
      const toggle = document.getElementById('chatToggle');
      if (toggle) { e.preventDefault(); toggle.click(); }
    }
  });
})();

// (hamburger ↔ X handled by closeMenu / main toggle above)

// ── 3D card tilt on project cards ──
(function() {
  if (window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion) return; // skip on touch / reduced motion
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s var(--ease, ease)';
      setTimeout(() => card.style.transition = '', 400);
    });
  });
})();

// ── Typewriter effect on hero tagline ──
(function() {
  const el = document.getElementById('heroTagline');
  if (!el) return;
  const words = ['Advocate.', 'Changemaker.', 'Builder.'];
  if (prefersReducedMotion) { el.textContent = words.join(' '); return; }
  const cursor = document.createElement('span');
  cursor.className = 'hero-tagline-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  let charIdx = 0;
  let wordIdx = 0;
  let typing = true;
  let fullText = words.join(' ');

  // Build full string char by char
  const chars = fullText.split('');
  let displayed = '';

  function tick() {
    if (charIdx < chars.length) {
      displayed += chars[charIdx++];
      el.textContent = displayed;
      el.appendChild(cursor);
      setTimeout(tick, charIdx === chars.length ? 400 : 55);
    } else {
      // Done typing — keep cursor blinking
      el.appendChild(cursor);
    }
  }
  // Small delay before starting
  setTimeout(tick, 600);
})();

// ── YouTube façade: click to load iframe ──
(function() {
  document.querySelectorAll('.yt-facade').forEach(facade => {
    const activate = () => {
      if (facade.classList.contains('yt-active')) return;
      const iframe = facade.querySelector('iframe');
      if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
        facade.classList.add('yt-active');
      }
    };
    facade.addEventListener('click', activate);
    facade.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });
})();

// ── Language progress bars (animate on intersection) ──
(function() {
  const bars = document.querySelectorAll('.lang-bar-fill');
  if (!bars.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.pct + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => obs.observe(b));
})();

// ── Random insight generator (Books section) ──
(function() {
  const btn = document.getElementById('insightBtn');
  const display = document.getElementById('insightDisplay');
  const textEl = document.getElementById('insightText');
  const sourceEl = document.getElementById('insightSource');
  if (!btn) return;

  const insights = [
    { text: '"Play long-term games with long-term people."', source: '— Naval Ravikant · The Almanack of Naval Ravikant' },
    { text: '"Read what you love until you love to read."', source: '— Naval Ravikant · The Almanack of Naval Ravikant' },
    { text: '"You have power over your mind — not outside events. Realise this, and you will find strength."', source: '— Marcus Aurelius · Meditations' },
    { text: '"The obstacle is the way."', source: '— Marcus Aurelius · Meditations' },
    { text: '"Nature does not hurry, yet everything is accomplished."', source: '— Lao Tzu · Tao Te Ching' },
    { text: '"Knowing others is intelligence; knowing yourself is true wisdom."', source: '— Lao Tzu · Tao Te Ching' },
    { text: '"It\'s not what happens to you, but how you react to it that matters."', source: '— Epictetus · Discourses' },
    { text: '"Wealth consists not in having great possessions, but in having few wants."', source: '— Epictetus · Discourses' },
    { text: '"Build unique value instead of competing in crowded markets."', source: '— Peter Thiel · Zero to One' },
    { text: '"Progress is open-ended when societies protect reason and freedom."', source: '— David Deutsch · The Beginning of Infinity' },
    { text: '"Good explanations are hard to vary — that\'s what makes them powerful."', source: '— David Deutsch · The Fabric of Reality' },
    { text: '"AI outcomes depend on proactive design, not passive optimism."', source: '— Max Tegmark · Life 3.0' },
    { text: '"Test assumptions fast before over-investing in execution."', source: '— Eric Ries · The Lean Startup' },
    { text: '"World-class performance is built from repeatable daily systems."', source: '— Tim Ferriss · Tools of Titans' },
    { text: '"Mission-aligned teams can outperform when resources are tight."', source: '— Phil Knight · Shoe Dog' },
  ];

  let lastIdx = -1;
  btn.addEventListener('click', () => {
    let idx;
    do { idx = Math.floor(Math.random() * insights.length); } while (idx === lastIdx);
    lastIdx = idx;
    const { text, source } = insights[idx];
    display.classList.remove('visible');
    // Force reflow for re-animation
    void display.offsetWidth;
    textEl.textContent = text;
    sourceEl.textContent = source;
    display.classList.add('visible');
  });
})();


// ── Hero particle canvas ──
(function() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = window.innerWidth < 600 ? 40 : 80;

  function resize() {
    const hero = canvas.closest('#hero') || canvas.parentElement;
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, mkParticle);
  }

  let rafId = null;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,168,255,${p.alpha})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  }

  // Pause the animation loop when the tab isn't visible (saves battery/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      draw();
    }
  });

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ── Copy email button ──
document.querySelectorAll('.copy-email-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    if (!text) return;
    const applyFeedback = () => {
      btn.classList.add('copied');
      const copyIcon  = btn.querySelector('.copy-icon');
      const checkIcon = btn.querySelector('.check-icon');
      if (copyIcon)  copyIcon.style.display  = 'none';
      if (checkIcon) checkIcon.style.display = '';
      setTimeout(() => {
        btn.classList.remove('copied');
        if (copyIcon)  copyIcon.style.display  = '';
        if (checkIcon) checkIcon.style.display = 'none';
      }, 1500);
    };
    navigator.clipboard.writeText(text).then(applyFeedback).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      applyFeedback();
    });
  });
});

// ── Spotify lazy facade ──
const spotifyFacade = document.getElementById('spotifyFacade');
if (spotifyFacade) {
  const activate = () => {
    const iframe = spotifyFacade.querySelector('iframe');
    if (!iframe) return;
    iframe.src = iframe.dataset.src;
    spotifyFacade.classList.add('loaded');
  };
  spotifyFacade.addEventListener('click', activate);
  spotifyFacade.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
}

// ── Award flip — touch support (tap to flip on mobile) ──
document.querySelectorAll('.award-flip').forEach(card => {
  card.addEventListener('click', e => {
    // Only toggle on touch devices; desktop uses CSS hover
    if (window.matchMedia('(hover: none)').matches) {
      card.classList.toggle('flipped');
      // If flipped and has link, allow click-through after 300ms
    }
  });
});

// ── Cursor spotlight (desktop only) ──
(function() {
  if (window.matchMedia('(hover: none)').matches || prefersReducedMotion) return;
  const el = document.createElement('div');
  el.className = 'cursor-spotlight';
  document.body.appendChild(el);
  document.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px';
    el.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => el.style.opacity = '0');
  document.addEventListener('mouseenter', () => el.style.opacity = '1');
})();

// ── Back-to-top progress ring ──
(function() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  // Inject ring SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('progress-ring');
  svg.setAttribute('viewBox','0 0 40 40');
  svg.innerHTML = '<circle class="ring-track" cx="20" cy="20" r="18"/><circle class="ring-fill" cx="20" cy="20" r="18"/>';
  btn.appendChild(svg);
  const fill = svg.querySelector('.ring-fill');
  const circumference = 2 * Math.PI * 18; // ~113
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = circumference;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? scrollTop / docHeight : 0;
    fill.style.strokeDashoffset = circumference * (1 - pct);
  }, { passive: true });
})();

// ── Active nav link indicator ──
(function() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => observer.observe(s));
})();

// ── Timeline connector draw on scroll ──
(function() {
  const timeline = document.querySelector('#experience .timeline');
  if (!timeline) return;
  function update() {
    const rect = timeline.getBoundingClientRect();
    const visible = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / rect.height));
    timeline.style.setProperty('--draw-pct', Math.round(visible * 100) + '%');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ── Timeline active item highlight ──
(function initTimelineActiveHighlight() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;

  function updateActiveItem() {
    let closestItem = null;
    let closestDist = Infinity;
    const mid = window.innerHeight / 2;
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemMid = rect.top + rect.height / 2;
      const dist = Math.abs(itemMid - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closestItem = item;
      }
    });
    items.forEach(item => item.classList.remove('tl-active'));
    if (closestItem) closestItem.classList.add('tl-active');
  }

  // Only activate when experience section is in view
  const section = document.getElementById('experience');
  if (!section) return;

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', updateActiveItem, { passive: true });
        updateActiveItem();
      } else {
        window.removeEventListener('scroll', updateActiveItem);
        items.forEach(item => item.classList.remove('tl-active'));
      }
    });
  }, { threshold: 0.1 });

  sectionObserver.observe(section);
})();

// ── Awards show more toggle ──
function toggleAwards(btn) {
  const extra = document.getElementById('awardsExtra');
  if (!extra) return;
  extra.classList.toggle('open');
  btn.classList.toggle('open');
  const isOpen = extra.classList.contains('open');
  const textNode = [...btn.childNodes].find(n => n.nodeType === 3);
  if (textNode) textNode.textContent = isOpen ? 'Show less ' : 'Show all 19 awards ';
  if (isOpen) {
    extra.querySelectorAll('[data-animate]').forEach(el => {
      setTimeout(() => el.classList.add('visible'), 50);
    });
  }
}

// ── Draggable logo marquee ──
(function () {
  const wrap = document.querySelector('.logos-strip-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.logos-track');
  if (!track) return;

  let dragging = false;
  let startX = 0;
  let frozenX = 0;

  function getTranslateX(el) {
    const t = window.getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix.*\((.+)\)/);
    return m ? parseFloat(m[1].split(',')[4]) : 0;
  }

  function startDrag(x) {
    dragging = true;
    frozenX = getTranslateX(track);
    track.style.animationPlayState = 'paused';
    track.style.transform = `translateX(${frozenX}px)`;
    startX = x;
    wrap.classList.add('dragging');
  }

  function moveDrag(x) {
    if (!dragging) return;
    const dx = x - startX;
    track.style.transform = `translateX(${frozenX + dx}px)`;
  }

  function endDrag(x) {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('dragging');
    const dx = x - startX;
    const endX = frozenX + dx;
    const halfWidth = track.scrollWidth / 2;
    // Map endX back into animation range [0, -halfWidth] for seamless resume
    const pct = Math.max(0, Math.min(1, Math.abs(endX % halfWidth) / halfWidth));
    const delay = -(pct * 32);
    track.style.transform = '';
    track.style.animation = 'none';
    void track.offsetWidth; // force reflow
    track.style.animation = `logoMarquee 32s linear infinite`;
    track.style.animationDelay = `${delay}s`;
    track.style.animationPlayState = 'running';
  }

  // Mouse
  wrap.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX); });
  document.addEventListener('mousemove', e => moveDrag(e.clientX));
  document.addEventListener('mouseup', e => endDrag(e.clientX));

  // Touch
  wrap.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchmove', e => { if (dragging) moveDrag(e.touches[0].clientX); }, { passive: true });
  wrap.addEventListener('touchend', e => endDrag(e.changedTouches[0].clientX));
})();


// ── Personal notifications ──
// Sends a notification to Panos via the Cloudflare Worker /notify endpoint.
// Set NOTIFY_SECRET env var in the worker and update the secret below.
// The secret is intentionally visible here — it only protects against random noise,
// not determined attackers. The worker rate-limits requests.
const NOTIFY_WORKER = "https://ask-panos.panagiotis-kokmotoss.workers.dev/notify";
const NOTIFY_SECRET = "panos-notify-2026-xyz"; // must match NOTIFY_SECRET in Cloudflare Worker env var

function sendSiteNotification(event, data) {
  if (!NOTIFY_SECRET) return; // disabled until secret is configured
  fetch(NOTIFY_WORKER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: NOTIFY_SECRET, event, data }),
  }).catch(() => {}); // silent fail — never block the UI
}
