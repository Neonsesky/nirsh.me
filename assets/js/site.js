/* Nirshath Madhusanka: site interactions (vanilla, no dependencies) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const EMAIL = 'neonsesky@gmail.com';

  /* ---------- Nav: hide on scroll down, theme by section ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  const darkSecs = () => $$('.dark');
  function navState() {
    const y = scrollY;
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 30);
    nav.classList.toggle('is-hidden', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
    // on-dark when the nav overlaps a dark section
    const probe = 38;
    let onDark = false;
    for (const s of darkSecs()) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) { onDark = true; break; }
    }
    nav.classList.toggle('on-dark', onDark);
    nav.classList.toggle('is-light', !onDark);
    const mbar = $('.mbar');
    if (mbar) mbar.classList.toggle('show', y > innerHeight * 0.8);
  }
  addEventListener('scroll', navState, { passive: true });
  navState();

  /* ---------- Mobile menu ---------- */
  const burger = $('.nav__burger'), menu = $('.menu');
  if (burger && menu) burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  $$('.rv, .split, .burst, .tl, [data-count]').forEach(el => io.observe(el));
  // hero items fire immediately
  requestAnimationFrame(() => $$('.hero .split, .hero .rv, .phead .split, .phead .rv, .cs-hero .split, .cs-hero .rv').forEach(el => el.classList.add('in')));

  /* ---------- Counters ---------- */
  const fmt = n => n.toLocaleString('en-US');
  const countIO = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      if (reduce) { el.textContent = dec ? to.toFixed(dec) : fmt(to); return; }
      const t0 = performance.now(), dur = +el.dataset.dur || 1600;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 4));
        el.textContent = dec ? v.toFixed(dec) : fmt(Math.round(v));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Videos: autoplay in view, hover-play ---------- */
  const vIO = new IntersectionObserver((es) => {
    es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        if (!reduce && (v.hasAttribute('data-autoplay') || touch)) v.play().catch(() => {});
      } else v.pause();
    });
  }, { rootMargin: '200px' });
  $$('video[data-src]').forEach(v => { v.muted = true; v.playsInline = true; v.loop = true; vIO.observe(v); });
  if (!touch) $$('[data-hover]').forEach(card => {
    const vids = $$('video', card);
    card.addEventListener('mouseenter', () => vids.forEach(v => { if (v.dataset.src && !v.src) v.src = v.dataset.src; v.play().catch(() => {}); }));
    card.addEventListener('mouseleave', () => vids.forEach(v => { if (!v.hasAttribute('data-autoplay')) v.pause(); }));
  });

  /* ---------- Cursor follower ---------- */
  if (!touch && !reduce) {
    const c = document.createElement('div');
    c.className = 'cursor'; c.innerHTML = '<div class="cursor__in"><span>View</span></div>';
    document.body.appendChild(c);
    const label = $('span', c);
    let x = -200, y = -200, tx = x, ty = y;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { x += (tx - x) * 0.2; y += (ty - y) * 0.2; c.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; c.classList.add('on'); } else c.classList.remove('on');
    });
  }

  /* ---------- Copy email ---------- */
  const toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast);
  const say = (m) => { toast.textContent = m; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 2200); };
  $$('[data-copy]').forEach(b => b.addEventListener('click', async (e) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(EMAIL); say('Email copied: ' + EMAIL); b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 2400); }
    catch { location.href = 'mailto:' + EMAIL; }
  }));

  /* ---------- Horizontal pinned process ---------- */
  $$('.hscroll').forEach(sec => {
    const track = $('.hscroll__track', sec), bar = $('.hscroll__bar i', sec);
    const mq = matchMedia('(max-width: 860px)');
    function size() {
      if (mq.matches || reduce) { sec.style.height = ''; track.style.transform = ''; return; }
      const dist = track.scrollWidth - innerWidth;
      sec.style.height = (innerHeight + dist) + 'px';
      sec.dataset.dist = dist;
    }
    function onScroll() {
      if (mq.matches || reduce) return;
      const r = sec.getBoundingClientRect(), dist = +sec.dataset.dist || 0;
      const p = Math.min(1, Math.max(0, -r.top / (sec.offsetHeight - innerHeight)));
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      if (bar) bar.style.width = (p * 100) + '%';
    }
    size(); onScroll();
    addEventListener('resize', () => { size(); onScroll(); });
    addEventListener('load', () => { size(); onScroll(); });
    addEventListener('scroll', onScroll, { passive: true });
  });

  /* ---------- Lightbox (galleries + archive) ---------- */
  let lb, lbItems = [], lbI = 0;
  function buildLB() {
    lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<div class="lb__media"></div><div class="lb__cap"></div><button class="x" aria-label="Close">✕</button><button class="prev" aria-label="Previous">←</button><button class="next" aria-label="Next">→</button>';
    document.body.appendChild(lb);
    $('.x', lb).onclick = closeLB; $('.prev', lb).onclick = () => showLB(lbI - 1); $('.next', lb).onclick = () => showLB(lbI + 1);
    lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') showLB(lbI + 1); if (e.key === 'ArrowLeft') showLB(lbI - 1); });
  }
  function showLB(i) {
    lbI = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbI], m = $('.lb__media', lb);
    const vid = it.dataset.video;
    m.innerHTML = vid ? `<video src="${vid}" autoplay muted loop playsinline controls></video>` : `<img src="${it.dataset.full || $('img', it).src}" alt="">`;
    $('.lb__cap', lb).textContent = (it.dataset.cap || '') + `  ·  ${lbI + 1} / ${lbItems.length}`;
  }
  function closeLB() { lb.classList.remove('open'); $('.lb__media', lb).innerHTML = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-lb]');
    if (!f) return;
    e.preventDefault();
    if (!lb) buildLB();
    const group = f.closest('[data-lb-group]') || document;
    lbItems = $$('[data-lb]', group).filter(x => !x.classList.contains('hide'));
    lb.classList.add('open'); document.body.style.overflow = 'hidden';
    showLB(lbItems.indexOf(f));
  });

  /* ---------- Archive filters ---------- */
  const filters = $('.filters');
  if (filters) {
    const tiles = $$('.tile');
    const btns = $$('button', filters);
    btns.forEach(b => {
      const f = b.dataset.f;
      const n = f === 'all' ? tiles.length : tiles.filter(t => t.dataset.tags.includes(f)).length;
      b.insertAdjacentHTML('beforeend', `<sup>${n}</sup>`);
      b.addEventListener('click', () => {
        btns.forEach(x => x.setAttribute('aria-pressed', x === b));
        tiles.forEach(t => t.classList.toggle('hide', !(f === 'all' || t.dataset.tags.includes(f))));
        history.replaceState(null, '', f === 'all' ? location.pathname : '?f=' + f);
      });
    });
    const q = new URLSearchParams(location.search).get('f');
    if (q) { const b = btns.find(x => x.dataset.f === q); if (b) b.click(); }
  }

  /* ---------- Story mode ---------- */
  const STORIES = window.STORIES || {};
  let st, stList = [], stI = 0, stTimer, stStart, stDur;
  function buildStory() {
    st = document.createElement('div'); st.className = 'story'; st.setAttribute('role', 'dialog');
    st.innerHTML = '<div class="story__frame"><div class="story__bars"></div><div class="story__head"></div><div class="story__media"></div><div class="story__cap"></div><div class="story__tap l"></div><div class="story__tap r"></div></div><button class="x" aria-label="Close">✕</button>';
    document.body.appendChild(st);
    $('.x', st).onclick = closeStory;
    $('.story__tap.l', st).onclick = () => goStory(stI - 1);
    $('.story__tap.r', st).onclick = () => goStory(stI + 1);
    addEventListener('keydown', e => { if (!st.classList.contains('open')) return; if (e.key === 'Escape') closeStory(); if (e.key === 'ArrowRight') goStory(stI + 1); if (e.key === 'ArrowLeft') goStory(stI - 1); });
  }
  function goStory(i) {
    cancelAnimationFrame(stTimer);
    if (i >= stList.items.length) return closeStory();
    stI = Math.max(0, i);
    const it = stList.items[stI];
    const media = $('.story__media', st);
    media.innerHTML = it.v ? `<video src="${it.v}" autoplay muted playsinline></video>` : `<img src="${it.i}" alt="">`;
    $('.story__cap', st).innerHTML = it.c || '';
    $$('.story__bars b', st).forEach((b, j) => b.style.width = j < stI ? '100%' : '0');
    stDur = it.v ? 6500 : 4200; stStart = performance.now();
    const bar = $$('.story__bars b', st)[stI];
    const tick = t => { const p = Math.min(1, (t - stStart) / stDur); bar.style.width = (p * 100) + '%'; if (p < 1) stTimer = requestAnimationFrame(tick); else goStory(stI + 1); };
    stTimer = requestAnimationFrame(tick);
  }
  function openStory(key) {
    if (!STORIES[key]) return;
    if (!st) buildStory();
    stList = STORIES[key];
    $('.story__bars', st).innerHTML = stList.items.map(() => '<i><b></b></i>').join('');
    $('.story__head', st).innerHTML = `<span>${stList.title}</span><small>${stList.sub || ''}</small>`;
    st.classList.add('open'); document.body.style.overflow = 'hidden';
    goStory(0);
  }
  function closeStory() { cancelAnimationFrame(stTimer); st.classList.remove('open'); $('.story__media', st).innerHTML = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', e => { const s = e.target.closest('[data-story]'); if (s) { e.preventDefault(); openStory(s.dataset.story); } });

  /* ---------- Phone feed gentle autoscroll (pauses on interaction) ---------- */
  $$('.ig-feed').forEach(feed => {
    if (reduce) return;
    let paused = false, inView = false, pos = 0;
    const stop = () => { paused = true; clearTimeout(feed._t); feed._t = setTimeout(() => { paused = false; pos = feed.scrollTop; }, 4000); };
    ['wheel', 'touchstart', 'pointerdown', 'mouseenter'].forEach(ev => feed.addEventListener(ev, stop, { passive: true }));
    feed.addEventListener('mouseleave', () => { clearTimeout(feed._t); paused = false; pos = feed.scrollTop; });
    new IntersectionObserver(es => inView = es[0].isIntersecting).observe(feed);
    (function loop() {
      if (inView && !paused) {
        pos += 0.55;
        if (pos + feed.clientHeight >= feed.scrollHeight - 2) pos = 0;
        feed.scrollTop = pos;
      }
      requestAnimationFrame(loop);
    })();
  });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
