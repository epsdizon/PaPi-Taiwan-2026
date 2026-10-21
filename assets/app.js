/* PaPi Taiwan 2026 — app logic. All trip content lives in data.js. */
(() => {
  'use strict';

  const T = window.TRIP;
  const P = T.places;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Saved on this phone ----------
  const NS = 'papi:v' + T.version + ':';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(NS + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(NS + k); } catch (e) { /* storage unavailable */ } },
  };

  // ---------- Money ----------
  const fPHP = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
  const fTWD = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
  const php = (n) => fPHP.format(Math.round(n || 0));
  const twd = (n) => fTWD.format(Math.round(n || 0));

  // ---------- Time in Taipei (add ?today=2026-12-06&time=10:15 to preview a trip day) ----------
  const qs = new URLSearchParams(location.search);
  const validDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const today = validDay(qs.get('today')) ? qs.get('today')
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const nowMinutes = () => {
    const forced = /^\d{1,2}:\d{2}$/.test(qs.get('time') || '') ? qs.get('time') : null;
    const s = forced || new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const toMin = (t) => {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t || '');
    if (!m) return null;
    let h = Number(m[1]) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + Number(m[2]);
  };
  const daysBetween = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5);
  const dfmt = (iso, opts) => new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: 'UTC' }, opts)).format(new Date(iso + 'T00:00:00Z'));
  const tripIdx = T.dates.indexOf(today);

  // ---------- State ----------
  const savedPlan = store.get('plan', 'slow');
  const state = {
    plan: T.plans[savedPlan] ? savedPlan : 'slow',
    tab: 'days',
    day: tripIdx >= 0 ? tripIdx : 0,
    settings: Object.assign({}, T.settings, store.get('settings', {})),
    rate: null,
    ownRate: store.get('ownRate', null),
    photos: {},
    filter: 'all',
  };
  const plan = () => T.plans[state.plan];
  const line = (d) => T.lines[d] || T.lines[0];
  const colorVars = (d) => `--c:${line(d).color};--ci:${line(d).ink}`;

  // ---------- Icons ----------
  const svg = (paths) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICON = {
    pin: svg('<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    driver: svg('<path d="M5 17h14M6.5 17l1.2-5.2A2 2 0 0 1 9.6 10h4.8a2 2 0 0 1 1.9 1.8L17.5 17"/><path d="M4 17v2.5M20 17v2.5"/><path d="M9.5 10V8h5v2"/>'),
    van: svg('<path d="M2.5 16.5V8a2 2 0 0 1 2-2h10.5l4.5 4.5v6h-2"/><path d="M15 6v4.5h4.5"/><path d="M6 10.5h5"/><circle cx="7" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M9 17h5"/>'),
    walk: svg('<circle cx="13" cy="4" r="1.8"/><path d="M10.5 21l2-6-3-2.5 1-5 3 2 3 1M9.5 7.5L6 9.5l-1 4M12.5 15l2.5 2.5V21"/>'),
    train: svg('<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13.5" r=".8"/><circle cx="15" cy="13.5" r=".8"/><path d="M8 21l2-4M16 21l-2-4"/>'),
    gondola: svg('<path d="M2 4l20 3"/><path d="M12 5.5V9"/><rect x="6" y="9" width="12" height="11" rx="2.5"/><path d="M6 13.5h12"/>'),
    camera: svg('<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
    bowl: svg('<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 21h8"/><path d="M13 9l7-6M10 9l6-7"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    bag: svg('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  };
  const moveIcon = (t) => (/gondola|cable car|ropeway/i.test(t) ? ICON.gondola : /mrt/i.test(t) ? ICON.train : /^walk/i.test(t) ? ICON.walk : ICON.van);

  // ---------- Trip data helpers ----------
  const stopsOf = (d) => plan().stops.filter((s) => s[0] === d + 1)
    .map((s) => ({ time: s[1], title: s[2], place: s[3], move: s[4], tip: s[5], must: s[6] === 'must' }));
  const foodEdits = () => store.get('food:' + state.plan, {});
  const priceEdits = () => store.get('prices:' + state.plan, {});
  // Sharing orders (e.g. Din Tai Fung) scale with how many people are eating
  const eaters = () => state.settings.adults + state.settings.kids * state.settings.kidFood;
  function shareOrder(key) {
    const sh = (T.shares || {})[key];
    if (!sh) return null;
    const e = Math.max(1, eaters());
    const lines = sh.items.map((it) => {
      const qty = Math.max(1, Math.ceil(e / it.per - 1e-9));
      return Object.assign({}, it, { qty, total: qty * it.price });
    });
    const sub = lines.reduce((a, l) => a + l.total, 0);
    const service = sub * (sh.service || 0);
    return { sh, lines, sub, service, total: sub + service, per: (sub + service) / e };
  }
  const foods = () => {
    const ed = foodEdits();
    return plan().food.map((f, i) => {
      const e = ed[i] || {};
      const so = f[9] ? shareOrder(f[9]) : null;
      const base = so ? Math.round(so.per / 10) * 10 : f[5];
      const price = Number.isFinite(e.p) ? e.p : base;
      const hotel = !!state.settings.hotelBreakfast && f[1] === 'breakfast';
      return {
        i, day: f[0], place: f[1], name: f[2], type: f[3], order: f[4], base, price,
        on: hotel ? false : typeof e.on === 'boolean' ? e.on : f[6],
        hotel, share: f[9] || null, tip: f[7] || '', must: !!f[8], edited: price !== base,
      };
    });
  };
  const items = () => {
    const ed = priceEdits();
    return plan().budget.map((b, i) => {
      const numeric = typeof b[4] === 'number';
      const unit = numeric && Number.isFinite(ed[i]) ? ed[i] : b[4];
      return { i, day: b[0], item: b[1], cat: b[2], basis: b[3], base: b[4], unit, numeric, note: b[5] || '', check: b[6] || '', edited: numeric && unit !== b[4] };
    });
  };
  const mapUrl = (key) => {
    const p = P[key];
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.map || p.en + ', Taiwan');
  };
  const zhShort = (key) => ((P[key] && P[key].zh) || '').split(/[\s/]/)[0].slice(0, 2);

  // ---------- Budget math ----------
  const rateNow = () => (state.ownRate > 0 ? state.ownRate : state.rate ? state.rate.v : T.rate.value);
  function compute() {
    const s = state.settings;
    const pax = s.adults + s.kids;
    const vans = pax > 0 ? Math.ceil(Math.max(pax / Math.max(1, s.vanPax), s.kids / Math.max(1, s.seatsPerVan)) - 1e-9) : 0;
    const q = {
      van: vans,
      adult: s.adults,
      child: s.kids,
      eater: s.adults + s.kids * s.kidFood,
      lantern: Math.ceil(pax / Math.max(1, s.lanternShare) - 1e-9),
      group: 1,
    };
    const fl = foods();
    const foodDay = (d) => fl.reduce((a, f) => a + (f.on && f.day === d ? Number(f.price) || 0 : 0), 0);
    const rows = items().map((b) => {
      let unit = b.unit;
      if (unit === 'FOOD') unit = foodDay(b.day);
      else if (unit === 'SHOP') unit = s.shopPerAdult;
      else if (unit === 'HOTEL') unit = s.hotelTotal;
      unit = Number(unit) || 0;
      const qty = q[b.basis] ?? 0;
      return Object.assign(b, { unitVal: unit, qty, total: unit * qty });
    });
    const byDay = T.dates.map((_, d) => rows.reduce((a, r) => a + (r.day === d + 1 ? r.total : 0), 0));
    const cats = {};
    rows.forEach((r) => { cats[r.cat] = (cats[r.cat] || 0) + r.total; });
    const sub = byDay.reduce((a, b) => a + b, 0);
    const grand = sub * (1 + s.buffer);
    return { rows, byDay, cats, sub, grand, perAdult: grand / Math.max(1, s.adults), vans, pax };
  }

  // ---------- Network ----------
  const fetchT = (url, ms, opts = {}) => {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), ms);
    return fetch(url, Object.assign({ signal: c.signal }, opts)).finally(() => clearTimeout(timer));
  };

  // ---------- Live exchange rate ----------
  const shortDate = (s) => {
    if (!s) return '';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00Z') : new Date(s);
    return isNaN(d) ? '' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
  };
  async function loadRate(force) {
    const cached = store.get('rate', null);
    if (!force && cached && Date.now() - cached.t < 6 * 3600e3) { state.rate = cached; return; }
    const fawaz = (j) => [j.twd && j.twd.php, j.date];
    const sources = [
      { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/twd.min.json', pick: fawaz, src: 'fawaz' },
      { url: 'https://latest.currency-api.pages.dev/v1/currencies/twd.min.json', pick: fawaz, src: 'fawaz' },
      { url: 'https://open.er-api.com/v6/latest/TWD', pick: (j) => [j.rates && j.rates.PHP, j.time_last_update_utc], src: 'erapi' },
    ];
    for (const s of sources) {
      try {
        const res = await fetchT(s.url, 8000, { cache: 'no-store' });
        if (!res.ok) continue;
        const [v, date] = s.pick(await res.json());
        if (v > 0.5 && v < 10) {
          state.rate = { v, date: shortDate(date), src: s.src, t: Date.now() };
          store.set('rate', state.rate);
          return;
        }
      } catch (e) { /* try the next source */ }
    }
    state.rate = cached ? Object.assign({}, cached, { stale: true }) : null;
  }

  // ---------- Photos (Wikipedia + Wikimedia Commons, loaded in the browser) ----------
  const BAD_FILE = /(\.svg$|\.gif$|map|logo|locator|location|flag|icon|seal|emblem|diagram|chart|wordmark|signature|coat.of.arms)/i;
  const okFile = (n) => !!n && !BAD_FILE.test(n);
  const okSrc = (s) => typeof s === 'string' && /^https:\/\//.test(s);
  const sized = (src, w) => src.replace(/\/(\d+)px-([^/]+)$/, (m, n, f) => (Number(n) > w ? `/${w}px-${f}` : m));
  const fileKey = (f) => String(f || '').replace(/^File:/, '').replace(/_/g, ' ').toLowerCase();

  function setImg(img, src, w) {
    const small = w ? sized(src, w) : src;
    const tries = [[small, true]];
    if (small !== src) tries.push([src, true]);
    tries.push([src, false]);
    let n = 0;
    const go = () => {
      const [u, cors] = tries[n];
      if (cors) img.crossOrigin = 'anonymous'; else img.removeAttribute('crossorigin');
      img.src = u;
    };
    img.onload = () => img.classList.add('ok');
    img.onerror = () => { n += 1; if (n < tries.length) { img.removeAttribute('src'); go(); } };
    go();
  }

  async function pageImages(lang, titles) {
    const out = {};
    for (let i = 0; i < titles.length; i += 40) {
      const batch = titles.slice(i, i + 40);
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=960&redirects=1&titles=${encodeURIComponent(batch.join('|'))}`;
      try {
        const res = await fetchT(url, 10000);
        const q = (await res.json()).query || {};
        const norm = {};
        (q.normalized || []).forEach((x) => { norm[x.from] = x.to; });
        const red = {};
        (q.redirects || []).forEach((x) => { red[x.from] = x.to; });
        const pages = {};
        (q.pages || []).forEach((p) => { pages[p.title] = p; });
        batch.forEach((t) => {
          let k = norm[t] || t;
          k = red[k] || k;
          const pg = pages[k];
          if (pg && pg.thumbnail && okSrc(pg.thumbnail.source) && okFile(pg.pageimage)) {
            out[t] = { src: pg.thumbnail.source, file: pg.pageimage, page: `https://${lang}.wikipedia.org/wiki/File:${encodeURIComponent(pg.pageimage)}` };
          }
        });
      } catch (e) { /* offline or blocked: placeholders stay */ }
    }
    return out;
  }

  async function loadPhotos() {
    const overrides = {};
    Object.keys(P).forEach((k) => { if (P[k].photo) overrides[k] = { src: P[k].photo }; });
    const cache = store.get('photos', null);
    if (cache && Date.now() - cache.t < 5 * 864e5 && cache.n === Object.keys(P).length) {
      state.photos = Object.assign({}, cache.map, overrides);
      applyPhotos();
      return;
    }
    const keys = Object.keys(P).filter((k) => !P[k].photoless);
    const en = new Set();
    const zh = new Set();
    keys.forEach((k) => { (P[k].wiki || []).forEach((t) => en.add(t)); (P[k].wikiZh || []).forEach((t) => zh.add(t)); });
    const [E, Z] = await Promise.all([pageImages('en', [...en]), zh.size ? pageImages('zh', [...zh]) : {}]);
    const map = {};
    keys.forEach((k) => {
      const hit = (P[k].wiki || []).map((t) => E[t]).find(Boolean) || (P[k].wikiZh || []).map((t) => Z[t]).find(Boolean);
      if (hit) map[k] = hit;
    });
    if (Object.keys(map).length) store.set('photos', { t: Date.now(), n: Object.keys(P).length, map });
    state.photos = Object.assign(map, overrides);
    applyPhotos();
  }

  function applyPhotos(root = document) {
    $$('img[data-photo]', root).forEach((img) => {
      if (img.dataset.done) return;
      const ph = state.photos[img.dataset.photo];
      if (!ph) return;
      img.dataset.done = '1';
      img.alt = img.dataset.alt || '';
      setImg(img, ph.src, Number(img.dataset.w) || 0);
    });
    fillBanner();
  }

  const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  async function gallery(key) {
    const p = P[key];
    if (!p || !p.commons) return [];
    const ck = 'gal:' + key;
    const c = store.get(ck, null);
    if (c && Date.now() - c.t < 7 * 864e5) return c.items;
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*'
      + '&generator=search&gsrnamespace=6&gsrlimit=18&gsrsearch=' + encodeURIComponent(p.commons + ' filetype:bitmap')
      + '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize&iiurlwidth=1280&iiextmetadatafilter=Artist%7CLicenseShortName';
    const res = await fetchT(url, 12000);
    const pages = ((await res.json()).query || {}).pages || [];
    const list = pages.sort((a, b) => (a.index || 0) - (b.index || 0)).map((pg) => {
      const ii = pg.imageinfo && pg.imageinfo[0];
      if (!ii) return null;
      const md = ii.extmetadata || {};
      return {
        src: ii.thumburl || ii.url,
        file: pg.title,
        page: ii.descriptionurl,
        artist: strip(md.Artist && md.Artist.value).slice(0, 90),
        license: strip(md.LicenseShortName && md.LicenseShortName.value),
        mime: ii.mime,
        w: ii.width,
        h: ii.height,
      };
    }).filter((x) => x && okSrc(x.src) && /jpe?g|png|webp/i.test(x.mime) && okFile(x.file) && x.w >= 900 && x.w / x.h < 2.6 && x.h / x.w < 1.8).slice(0, 10);
    store.set(ck, { t: Date.now(), items: list });
    return list;
  }

  const photo = (key, cls, w, label) => {
    const p = P[key];
    const name = label || p.en;
    return `<button type="button" class="${cls} ph" data-act="gallery" data-place="${esc(key)}" aria-label="Photos of ${esc(name)}">`
      + `<span class="ph-zh" aria-hidden="true" lang="zh-Hant">${esc(zhShort(key))}</span>`
      + `<img data-photo="${esc(key)}" data-w="${w}" data-alt="${esc(name)}" alt="" loading="lazy" decoding="async"></button>`;
  };

  // ---------- Cover ----------
  function renderHero() {
    $$('.toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.plan === state.plan)));
    $('#plan-blurb').textContent = plan().blurb;
    renderCountdown();
  }

  // ---------- Countdown to landing (ticks every second) ----------
  const CD = T.countdown || { to: T.start + 'T12:00:00+08:00', label: 'Until we land in Taipei', note: '' };
  const landing = Date.parse(CD.to);
  const previewTime = /^\d{1,2}:\d{2}$/.test(qs.get('time') || '') ? qs.get('time').padStart(5, '0') : '09:00';
  const clockOffset = validDay(qs.get('today')) ? Date.parse(`${today}T${previewTime}:00+08:00`) - Date.now() : 0;
  const nowTs = () => Date.now() + clockOffset;
  const taipeiDate = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
  const pad2 = (n) => String(n).padStart(2, '0');
  let cdTimer = 0;
  function setDigit(unit, v) {
    const el = $(`.cd-num[data-u="${unit}"]`);
    if (!el || el.textContent === v) return;
    el.textContent = v;
    if (motionOK()) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  }
  function renderCountdown() {
    const box = $('#countdown');
    const left = landing - nowTs();
    if (left > 0 && box.dataset.mode !== 'msg') {
      $('#cd-label-txt').textContent = CD.label;
      $('#cd-note').textContent = CD.note || '';
      const secs = Math.floor(left / 1000);
      setDigit('d', String(Math.floor(secs / 86400)));
      setDigit('h', pad2(Math.floor((secs % 86400) / 3600)));
      setDigit('m', pad2(Math.floor((secs % 3600) / 60)));
      setDigit('s', pad2(secs % 60));
      if (!cdTimer) cdTimer = setInterval(renderCountdown, 1000);
      return;
    }
    clearInterval(cdTimer);
    cdTimer = 0;
    const idx = T.dates.indexOf(taipeiDate(nowTs()));
    const txt = idx >= 0 ? `Day ${idx + 1} of ${T.dates.length}. Enjoy today!`
      : daysBetween(taipeiDate(nowTs()), T.dates[T.dates.length - 1]) > 0 ? 'Trip done. Salamat, Taiwan!' : 'Almost there!';
    box.dataset.mode = 'msg';
    box.innerHTML = `<p class="cd-msg">${esc(txt)}</p>`;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cdTimer) renderCountdown(); });
  function buildRoute() {
    $('#route').innerHTML = T.dates.map((iso, i) => `<li style="--i:${i};${colorVars(i)}"${i === tripIdx ? ' class="today"' : ''}>`
      + `<button type="button" data-act="goday" data-day="${i}" aria-current="false" aria-label="Day ${i + 1}, ${esc(dfmt(iso, { weekday: 'long', month: 'long', day: 'numeric' }))}">`
      + `<span class="dot"></span><span class="lbl">${esc(dfmt(iso, { weekday: 'short' }))}<small>Dec ${Number(iso.slice(8))}</small></span></button></li>`).join('');
  }
  function updateRoute() {
    $$('#route button').forEach((b) => b.setAttribute('aria-current', String(state.tab === 'days' && Number(b.dataset.day) === state.day)));
  }

  // ---------- Days ----------
  let slideTimer = 0;
  function fillBanner() {
    const wrap = $('#banner .slides');
    if (!wrap) return;
    const keys = (wrap.dataset.keys || '').split(',').filter(Boolean);
    const list = keys.filter((k) => state.photos[k]).slice(0, 4);
    if (!list.length || wrap.dataset.n === String(list.length)) return;
    wrap.dataset.n = String(list.length);
    wrap.textContent = '';
    clearInterval(slideTimer);
    list.forEach((k, i) => {
      const img = document.createElement('img');
      img.alt = i === 0 ? P[k].en : '';
      img.decoding = 'async';
      if (i === 0) img.addEventListener('load', () => img.classList.add('on'), { once: true });
      setImg(img, state.photos[k].src, 960);
      wrap.append(img);
    });
    if (list.length > 1 && motionOK()) {
      let at = 0;
      slideTimer = setInterval(() => {
        if (document.hidden || !wrap.isConnected) return;
        const imgs = $$('img', wrap);
        const nxt = (at + 1) % imgs.length;
        if (!imgs[nxt] || !imgs[nxt].naturalWidth) return;
        const old = imgs[at];
        old.classList.add('prev');
        old.classList.remove('on');
        imgs[nxt].classList.add('on');
        setTimeout(() => old.classList.remove('prev'), 1500);
        at = nxt;
      }, 5200);
    }
  }

  function daySummary(c) {
    const d = state.day;
    const el = $('#daysum');
    if (!el) return;
    const n = stopsOf(d).length;
    const perAdult = (c.byDay[d] / Math.max(1, state.settings.adults)) * rateNow();
    el.innerHTML = `${n} stops. About <strong>${php(perAdult)}</strong> per adult for the day (${twd(perAdult / rateNow())}).`;
  }

  function renderDays(animate) {
    const d = state.day;
    const L = line(d);
    const meta = plan().days[d];
    const stops = stopsOf(d);
    const view = $('#days');
    view.style.setProperty('--c', L.color);
    view.style.setProperty('--ci', L.ink);

    $('#daybar').innerHTML = T.dates.map((iso, i) => `<button type="button" class="chip${i === tripIdx ? ' is-today' : ''}" style="${colorVars(i)}" data-act="day" data-day="${i}" aria-pressed="${i === d}">`
      + `<span class="code">${line(i).code}</span>${esc(dfmt(iso, { weekday: 'short' }))} ${Number(iso.slice(8))}</button>`).join('');
    const chip = $('#daybar [aria-pressed="true"]');
    if (chip) { const bar = $('#daybar'); bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'auto' }); }

    const keys = (meta.banner || []).filter((k) => P[k]);
    $('#banner').innerHTML = `<div class="slides" data-keys="${esc(keys.join(','))}"></div>`
      + `<span class="ph-zh" aria-hidden="true" lang="zh-Hant">${esc(keys.length ? zhShort(keys[0]) : '')}</span>`
      + `<div class="banner-text"><p class="dayno"><span class="code">${L.code}</span>Day ${d + 1}</p><h2>${esc(meta.title)}</h2>`
      + `<p class="date">${esc(dfmt(T.dates[d], { weekday: 'long', month: 'long', day: 'numeric' }))}</p></div>`
      + (keys.length ? `<button type="button" class="photos-btn" data-act="gallery" data-place="${esc(keys[0])}">${ICON.camera}More photos</button>` : '');

    daySummary(compute());

    const isToday = d === tripIdx;
    const now = nowMinutes();
    let next = -1;
    if (isToday) next = stops.findIndex((s) => { const m = toMin(s.time); return m === null || m + 30 >= now; });
    let html = '';
    stops.forEach((s, i) => {
      const hotelBreakfast = s.place === 'breakfast' && state.settings.hotelBreakfast && (toMin(s.time) ?? 0) >= 7 * 60;
      if (hotelBreakfast) {
        s = Object.assign({}, s, { title: 'Free breakfast at the hotel', tip: 'Or try a Taiwanese breakfast shop nearby: dan bing and soy milk, about NT$100.', place: '' });
      }
      const p = s.place ? P[s.place] : null;
      const st = isToday ? (next === -1 || i < next ? 'done' : i === next ? 'next' : '') : '';
      if (s.move) html += `<li class="move" style="--i:${i}"><span>${moveIcon(s.move)}${esc(s.move)}</span></li>`;
      const acts = p && !p.generic
        ? `<div class="acts"><a class="act" href="${mapUrl(s.place)}" target="_blank" rel="noopener">${ICON.pin}Map</a>`
          + `<button type="button" class="act" data-act="driver" data-place="${esc(s.place)}">${ICON.driver}Show driver</button></div>`
        : '';
      html += `<li class="stop${s.must ? ' must' : ''}${st ? ' ' + st : ''}" style="--i:${i}">`
        + '<span class="node" aria-hidden="true"></span><div class="stop-body">'
        + `<p class="stop-meta"><span class="time">${esc(s.time)}</span><span class="scode">${L.code}${String(i + 1).padStart(2, '0')}</span>`
        + (s.must ? '<span class="tag must">Must-eat</span>' : '')
        + (st === 'next' ? '<span class="tag next">Up next</span>' : '') + '</p>'
        + `<h3>${esc(s.title)}</h3>`
        + (p && !p.generic ? `<p class="zh" lang="zh-Hant">${esc(p.zh)}</p>` : '')
        + (s.tip ? `<p class="tip">${esc(s.tip)}</p>` : '')
        + acts + '</div>'
        + (p && !p.photoless ? photo(s.place, 'thumb', 330, p.en) : '')
        + '</li>';
    });
    html += `<li class="van" aria-hidden="true">${ICON.van}</li>`;
    const ol = $('#line');
    ol.classList.toggle('still', !animate || !motionOK());
    ol.innerHTML = html;
    if (animate && motionOK()) { ol.classList.remove('go'); void ol.offsetWidth; ol.classList.add('go'); }
    applyPhotos($('#days'));
    requestAnimationFrame(() => placeVan(animate));
  }

  let vanBusyUntil = 0;
  // Re-park the van after layout shifts (fonts, photos), once its ride has finished
  function placeVanSoon() {
    const wait = vanBusyUntil - Date.now();
    if (wait > 0) setTimeout(() => placeVan(false), wait + 60);
    else placeVan(false);
  }
  function placeVan(animate) {
    const ol = $('#line');
    const van = ol && $('.van', ol);
    if (!van || $('#days').hidden) return;
    const stops = $$('.stop', ol);
    if (!stops.length) return;
    let target = stops.findIndex((s) => s.classList.contains('next'));
    if (target < 0) target = stops.length - 1;
    const top0 = ol.getBoundingClientRect().top;
    const y = (el) => { const r = $('.node', el).getBoundingClientRect(); return r.top - top0 + r.height / 2 - 15; };
    if (animate && motionOK()) {
      van.style.transition = 'none';
      van.style.top = y(stops[0]) + 'px';
      void van.offsetWidth;
      const dur = Math.min(2.8, 0.7 + target * 0.24);
      van.style.transition = `top ${dur.toFixed(2)}s cubic-bezier(.45,.05,.2,1) .35s`;
      van.style.top = y(stops[target]) + 'px';
      vanBusyUntil = Date.now() + (dur + 0.4) * 1000;
    } else if (Date.now() > vanBusyUntil) {
      van.style.transition = 'none';
      van.style.top = y(stops[target]) + 'px';
    }
  }

  // ---------- Food ----------
  const GROUPS = [
    ['all', 'All', null],
    ['street', 'Street food', (t) => /street|snack/i.test(t)],
    ['meal', 'Restaurants', (t) => /restaurant|casual/i.test(t)],
    ['sweet', 'Milk tea and sweets', (t) => /milk tea|dessert|teahouse/i.test(t)],
    ['morning', 'Breakfast', (t) => /breakfast/i.test(t)],
  ];
  function renderFood() {
    const r = rateNow();
    const list = foods();
    $('#musts').innerHTML = list.filter((f) => f.must && P[f.place]).map((f) => {
      const d = f.day - 1;
      const p = P[f.place];
      return `<article class="must-card" style="${colorVars(d)}">${photo(f.place, 'photo', 960, p.en)}<div class="body">`
        + `<p class="meta"><span class="code">${line(d).code}</span>Day ${f.day}, ${esc(dfmt(T.dates[d], { weekday: 'long' }))}</p>`
        + `<h3>${esc(p.en.replace(/, .*$/, ''))}</h3><p class="zh" lang="zh-Hant">${esc(p.zh)}</p>`
        + `<p class="order">${esc(f.order)}</p><p class="price">${php(f.price * r)} <small>${twd(f.price)} per person</small></p></div></article>`;
    }).join('');

    const so = shareOrder('dtf');
    const s = state.settings;
    $('#share-box').innerHTML = so && list.some((f) => f.share === 'dtf' && f.on)
      ? `<h3 class="mini-h">${esc(so.sh.title)}</h3><p class="sec-sub">For ${s.adults} adults and ${s.kids} kids, ordered for the table.</p><ul class="receipt">`
        + so.lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)} <span class="zh" lang="zh-Hant">${esc(l.zh)}</span></span><span>${twd(l.total)}</span></li>`).join('')
        + `<li class="svc"><span>${Math.round((so.sh.service || 0) * 100)}% service charge</span><span>${twd(so.service)}</span></li>`
        + `<li class="sum"><span>For the table</span><span>${php(so.total * r)}<small>${twd(so.total)}</small></span></li></ul>`
        + `<p class="ftip">About ${twd(Math.round(so.per / 10) * 10)} per person. ${esc(so.sh.note)}</p>`
      : '';

    $('#filters').innerHTML = GROUPS.map(([k, label]) => `<button type="button" class="fchip" data-act="filter" data-f="${k}" aria-pressed="${state.filter === k}">${label}</button>`).join('');
    const test = (GROUPS.find((g) => g[0] === state.filter) || [])[2];
    let html = '';
    T.dates.forEach((iso, d) => {
      const rows = list.filter((f) => f.day === d + 1 && (!test || test(f.type)));
      if (!rows.length) return;
      html += `<section class="fday" style="${colorVars(d)}"><h3><span class="code">${line(d).code}</span>Day ${d + 1} <small>${esc(dfmt(iso, { weekday: 'long', month: 'short', day: 'numeric' }))}</small></h3>`;
      rows.forEach((f) => {
        const p = f.place ? P[f.place] : null;
        if (f.hotel) {
          html += `<div class="fitem" data-food="${f.i}"><span class="thumb ph blank" aria-hidden="true">${ICON.bowl}</span><div>`
            + `<h4>Breakfast <span class="tag free">Free at the hotel</span></h4>`
            + `<p class="ftip">Or a breakfast shop instead: ${esc(f.order || 'dan bing and soy milk')}. To count it, turn off "Free hotel breakfast" on the Budget tab.</p></div></div>`;
          return;
        }
        html += `<div class="fitem${f.on ? '' : ' off'}" data-food="${f.i}">`
          + (p ? photo(f.place, 'thumb', 330, f.name) : `<span class="thumb ph blank" aria-hidden="true">${ICON.bowl}</span>`)
          + `<div><h4>${esc(f.name)}${f.must ? ' <span class="tag must">Must-eat</span>' : ''}</h4>`
          + (p && !p.generic ? `<p class="zh" lang="zh-Hant">${esc(p.zh)}</p>` : '')
          + (f.order ? `<p class="order">${esc(f.order)}</p>` : '')
          + (f.tip ? `<p class="ftip">${esc(f.tip)}</p>` : '')
          + (f.share ? '<p class="ftip">The price follows the sharing order above, so it changes with the group size.</p>' : '')
          + '<div class="row">'
          + `<label class="money"><span>NT$</span><input type="number" inputmode="numeric" min="0" step="5" value="${f.price}" data-act="food-price" data-i="${f.i}" aria-label="Price per person in NT dollars for ${esc(f.name)}"></label>`
          + `<span class="peso" data-peso="${f.i}">${php(f.price * r)} each</span>`
          + `<label class="switch"><input type="checkbox" data-act="food-on" data-i="${f.i}"${f.on ? ' checked' : ''}><span>Count it</span></label>`
          + `<button type="button" class="linkbtn" data-act="food-undo" data-i="${f.i}"${f.edited ? '' : ' hidden'}>Undo price change</button>`
          + '</div></div></div>';
      });
      html += '</section>';
    });
    $('#foodlist').innerHTML = html || '<p class="daysum">Nothing of this type in this plan.</p>';
    applyPhotos($('#food'));
  }

  // ---------- Budget ----------
  const FIELDS = [
    { k: 'adults', label: 'Adults', type: 'step', min: 1, max: 30 },
    { k: 'kids', label: 'Kids under 4', type: 'step', min: 0, max: 12, hint: 'Each one needs a car seat.' },
    { k: 'seatsPerVan', label: 'Car seats per van', type: 'step', min: 1, max: 6, hint: 'Ask the operator. If 4 fit, you may need just 1 van.' },
    { k: 'kidFood', label: 'How much the kids eat', type: 'range', min: 0, max: 1, step: 0.1, fmt: (v) => `${Math.round(v * 100)}% of an adult meal` },
    { k: 'buffer', label: 'Safety buffer', type: 'range', min: 0, max: 0.3, step: 0.05, fmt: (v) => `${Math.round(v * 100)}% on top of everything` },
    { k: 'shopPerAdult', label: 'Shopping per adult', type: 'money' },
    { k: 'hotelBreakfast', label: 'Free hotel breakfast', type: 'toggle', hint: "When on, breakfast-shop meals aren't counted." },
    { k: 'hotelTotal', label: 'Hotel, if not paid yet', type: 'money', hint: 'Total for all rooms and nights. Leave 0 if paid.' },
  ];
  const CATS = { Van: 'Van and car seats', Food: 'Food', Entrance: 'Tickets and rides', Kids: 'Kid supplies', Shopping: 'Shopping', Other: 'SIM and EasyCard', Transport: 'Taxis and MRT', Hotel: 'Hotel' };

  function buildSetup() {
    $('#setup').innerHTML = FIELDS.map((f) => {
      const v = state.settings[f.k];
      if (f.type === 'step') {
        return `<div class="field"><span id="lbl-${f.k}">${f.label}</span><div class="stepper">`
          + `<button type="button" data-act="step" data-k="${f.k}" data-d="-1" aria-label="Fewer: ${f.label}">−</button>`
          + `<output id="out-${f.k}" aria-labelledby="lbl-${f.k}" aria-live="polite">${v}</output>`
          + `<button type="button" data-act="step" data-k="${f.k}" data-d="1" aria-label="More: ${f.label}">+</button></div>`
          + (f.hint ? `<small>${f.hint}</small>` : '') + '</div>';
      }
      if (f.type === 'range') {
        return `<div class="field"><label for="in-${f.k}">${f.label}</label>`
          + `<input id="in-${f.k}" type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}" data-act="set" data-k="${f.k}">`
          + `<small id="out-${f.k}">${f.fmt(v)}</small></div>`;
      }
      if (f.type === 'toggle') {
        return `<div class="field"><label class="switch"><input type="checkbox" id="in-${f.k}" data-act="set-bool" data-k="${f.k}"${v ? ' checked' : ''}><span>${f.label}</span></label>`
          + (f.hint ? `<small>${f.hint}</small>` : '') + '</div>';
      }
      return `<div class="field"><label for="in-${f.k}">${f.label}</label>`
        + `<span class="money"><span>NT$</span><input id="in-${f.k}" type="number" inputmode="numeric" min="0" step="100" value="${v}" data-act="set" data-k="${f.k}"></span>`
        + (f.hint ? `<small>${f.hint}</small>` : '') + '</div>';
    }).join('');
  }

  const basisText = (x) => {
    const n = x.qty;
    const s = (w) => (n === 1 ? w : w + 's');
    switch (x.basis) {
      case 'van': return `× ${n} ${s('van')}`;
      case 'adult': return `× ${n} ${s('adult')}`;
      case 'child': return `× ${n} ${s('kid')}`;
      case 'eater': return `× ${Number(n.toFixed(1))} eaters (kids count as ${Math.round(state.settings.kidFood * 100)}%)`;
      case 'lantern': return `× ${n} ${s('lantern')}`;
      default: return 'for the group';
    }
  };
  const calcText = (x) => {
    if (x.unit === 'FOOD') return `${twd(x.unitVal)} of food per person ${basisText(x)}`;
    if (x.unit === 'SHOP') return `${twd(x.unitVal)} per adult ${basisText(x)}`;
    if (x.unit === 'HOTEL') return `${twd(x.unitVal)} total`;
    return `${twd(x.unitVal)} ${basisText(x)}`;
  };
  function itemRow(x, r) {
    let controls;
    if (x.numeric) {
      controls = `<label class="money"><span>NT$</span><input type="number" inputmode="numeric" min="0" step="50" value="${x.unitVal}" data-act="price" data-i="${x.i}" aria-label="NT dollar price for ${esc(x.item)}"></label>`
        + (x.check ? `<a class="act" href="https://www.google.com/search?q=${encodeURIComponent(x.check)}" target="_blank" rel="noopener">${ICON.search}Check price</a>` : '')
        + `<span class="edited"${x.edited ? '' : ' hidden'}>Changed</span>`
        + `<button type="button" class="linkbtn" data-act="price-undo" data-i="${x.i}"${x.edited ? '' : ' hidden'}>Undo</button>`;
    } else if (x.unit === 'FOOD') {
      controls = '<button type="button" class="linkbtn" data-act="tofood">Change food prices</button>';
    } else {
      controls = '<button type="button" class="linkbtn" data-act="tosetup">Change it above</button>';
    }
    return `<li class="item" data-item="${x.i}"><div><p class="nm">${esc(x.item)}</p><p class="calc" data-calc="${x.i}">${esc(calcText(x))}</p>`
      + (x.note ? `<p class="note">${esc(x.note)}</p>` : '') + '</div>'
      + `<p class="tot" data-tot="${x.i}">${php(x.total * r)}<small>${twd(x.total)}</small></p><div class="row">${controls}</div></li>`;
  }

  function renderRate() {
    const r = rateNow();
    $('#rate-v').textContent = '₱' + (state.ownRate > 0 ? r.toFixed(2) : r.toFixed(3));
    const src = $('#rate-src');
    if (state.ownRate > 0) src.innerHTML = '<span class="live off"></span>Your money changer\'s rate';
    else if (state.rate && !state.rate.stale) src.innerHTML = `<span class="live"></span>Live rate${state.rate.date ? ' from ' + esc(state.rate.date) : ''}`;
    else if (state.rate) src.innerHTML = `<span class="live off"></span>Last saved rate${state.rate.date ? ' from ' + esc(state.rate.date) : ''}. The live rate didn't load.`;
    else src.innerHTML = `<span class="live off"></span>Saved rate from ${esc(T.rate.asOf)}. The live rate didn't load.`;
    $('#rate-credit').innerHTML = state.rate && state.rate.src === 'erapi'
      ? 'Live exchange rate: <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a>.'
      : 'Live exchange rate from the free Currency API by Fawaz Ahmed.';
    const own = $('#own-rate');
    if (document.activeElement !== own) own.value = state.ownRate > 0 ? state.ownRate : '';
  }

  let shownPerAdult = null;
  function tween(el, from, to, fmt) {
    cancelAnimationFrame(el._raf);
    if (from === null || !motionOK() || Math.abs(to - from) < 1) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 500);
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  function renderBudget() {
    const c = compute();
    const r = rateNow();
    $('#bars-day').innerHTML = c.byDay.map((v, d) => `<li class="bar" style="${colorVars(d)};--w:0%"><span class="code">${line(d).code}</span>`
      + `<span class="bl">Day ${d + 1}: ${esc(plan().days[d].title)}</span><span class="amt"></span><span class="track"><span class="fill"></span></span></li>`).join('');
    const open = new Set($$('#items details[open]').map((x) => x.dataset.day));
    $('#items').innerHTML = T.dates.map((iso, d) => `<details class="iday" data-day="${d}" style="${colorVars(d)}"${open.has(String(d)) ? ' open' : ''}>`
      + `<summary><span class="code">${line(d).code}</span>Day ${d + 1}, ${esc(dfmt(iso, { weekday: 'short', month: 'short', day: 'numeric' }))}<span class="amt"></span></summary>`
      + `<ul class="items">${c.rows.filter((x) => x.day === d + 1).map((x) => itemRow(x, r)).join('')}</ul></details>`).join('');
    renderRate();
    requestAnimationFrame(() => updateNumbers(c));
  }

  function updateNumbers(c) {
    const r = rateNow();
    const s = state.settings;
    const pa = c.perAdult * r;
    tween($('#per-adult'), shownPerAdult, pa, php);
    shownPerAdult = pa;
    $('#per-adult-twd').textContent = `${twd(c.perAdult)} each, with a ${Math.round(s.buffer * 100)}% safety buffer`;
    $('#group-total').textContent = `Whole group: ${php(c.grand * r)} (${twd(c.grand)}) for ${s.adults} adults and ${s.kids} kids, with ${c.vans} ${c.vans === 1 ? 'van' : 'vans'}.`;

    const maxDay = Math.max(1, ...c.byDay);
    $$('#bars-day .bar').forEach((li, d) => {
      li.style.setProperty('--w', ((c.byDay[d] / maxDay) * 100).toFixed(1) + '%');
      $('.amt', li).innerHTML = `${php(c.byDay[d] * r)}<small>${twd(c.byDay[d])}</small>`;
    });

    const cats = Object.keys(CATS).filter((k) => c.cats[k] > 0);
    const maxCat = Math.max(1, ...cats.map((k) => c.cats[k]));
    const sum = Math.max(1, c.sub);
    const catBox = $('#bars-cat');
    if (catBox.dataset.keys !== cats.join(',')) {
      catBox.dataset.keys = cats.join(',');
      catBox.innerHTML = cats.map((k) => `<li class="bar cat" data-cat="${k}" style="--w:0%"><span class="pct"></span><span class="bl">${CATS[k]}</span><span class="amt"></span><span class="track"><span class="fill"></span></span></li>`).join('');
      void catBox.offsetWidth;
    }
    cats.forEach((k) => {
      const li = $(`[data-cat="${k}"]`, catBox);
      li.style.setProperty('--w', ((c.cats[k] / maxCat) * 100).toFixed(1) + '%');
      const pct = (c.cats[k] / sum) * 100;
      $('.pct', li).textContent = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
      $('.amt', li).innerHTML = `${php(c.cats[k] * r)}<small>${twd(c.cats[k])}</small>`;
    });

    c.rows.forEach((x) => {
      const tot = $(`[data-tot="${x.i}"]`);
      if (tot) tot.innerHTML = `${php(x.total * r)}<small>${twd(x.total)}</small>`;
      const calc = $(`[data-calc="${x.i}"]`);
      if (calc) calc.textContent = calcText(x);
    });
    $$('#items .iday').forEach((det, d) => { $('summary .amt', det).textContent = php(c.byDay[d] * r); });
  }

  function liveTotals() {
    const c = compute();
    if (!$('#budget').hidden) updateNumbers(c);
    daySummary(c);
  }

  function saveSettings() { store.set('settings', state.settings); }

  // ---------- Packing ----------
  function renderPack() {
    const checks = store.get('checks', {});
    const list = (id, arr, pre) => {
      $(id).innerHTML = arr.map((t, i) => `<li><label><input type="checkbox" data-act="check" data-k="${pre}${i}"${checks[pre + i] ? ' checked' : ''}><span>${esc(t)}</span></label></li>`).join('');
    };
    list('#confirm', T.confirm, 'c');
    list('#packlist', T.pack, 'p');
    $('#tips').innerHTML = T.tips.map(([h, b]) => `<div><dt>${esc(h)}</dt><dd>${esc(b)}</dd></div>`).join('');
  }

  // ---------- Explore: things to do, MRT guide, must buys, shops ----------
  const EX = () => Object.assign({ todo: [], mrt: { stations: [], basics: [] }, buys: [], rules: [], shops: [] }, T.explore || {});
  const LINES = {
    R: ['Red line', '#E3002C', '#FFFFFF'], BR: ['Brown line', '#C48C31', '#1A1306'], G: ['Green line', '#008659', '#FFFFFF'],
    O: ['Orange line', '#F8B61C', '#1F1500'], BL: ['Blue line', '#0070BD', '#FFFFFF'], Y: ['Yellow line', '#FFDB00', '#1F1A00'],
    A: ['Airport MRT', '#8246AF', '#FFFFFF'], V: ['Danhai light rail', '#5BB75B', '#0F2400'],
  };
  const lineOf = (code) => LINES[(/^[A-Z]+/.exec(code || '') || [''])[0]] || ['MRT', '#56607B', '#FFFFFF'];
  const mrtBadge = (code) => { const [name, c, ink] = lineOf(code); return `<span class="mrt" style="--lc:${c};--li:${ink}" title="${esc(name)}">${esc(code)}</span>`; };
  const mrtFor = (key) => (EX().mrt.stations || []).find((s) => (s.for || []).includes(key));
  const fareTxt = (s) => (s && Number.isFinite(s.fare) ? twd(s.fare) : 'fare varies');
  const dayInPlan = (key) => { const s = plan().stops.find((x) => x[3] === key); return s ? s[0] : 0; };

  function renderExplore() {
    const r = rateNow();
    const x = EX();
    const done = store.get('todo', {});
    $('#todo').innerHTML = x.todo.map((t, i) => {
      const day = t.place ? dayInPlan(t.place) : 0;
      const st = t.place ? mrtFor(t.place) : null;
      let where;
      if (day) where = `<span class="code" style="${colorVars(day - 1)}">${line(day - 1).code}</span>Day ${day} in your plan`;
      else if (st) where = `If there's time: ${mrtBadge(st.code)} ${esc(st.station)}, ${fareTxt(st)}`;
      else where = esc(t.where || 'Anytime');
      const p = t.place ? P[t.place] : null;
      return `<li class="${done[i] ? 'done' : ''}"><input type="checkbox" id="todo-${i}" data-act="todo" data-i="${i}"${done[i] ? ' checked' : ''}>`
        + `<div><label class="tt" for="todo-${i}">${esc(t.title)}</label><p class="dd">${esc(t.detail)}</p><p class="where">${where}</p></div>`
        + (p && !p.photoless ? photo(t.place, 'thumb', 330, p.en) : '') + '</li>';
    }).join('');

    const air = x.mrt.airport;
    $('#mrt-air').innerHTML = air
      ? `${mrtBadge('A1')}<div><p class="nm">Airport MRT express</p><p class="note">${esc(air.text)}</p></div><p class="fare">${twd(air.fare)}<small>${php(air.fare * r)}</small></p>`
      : '';
    $('#mrt-basics').innerHTML = (x.mrt.basics || []).map((b) => `<li>${esc(b)}</li>`).join('');
    const groups = [['On your plan', (s) => s.group === 'plan'], ['Shops and extras', (s) => s.group !== 'plan']];
    $('#mrt-list').innerHTML = groups.map(([h, keep]) => {
      const rows = (x.mrt.stations || []).filter(keep);
      if (!rows.length) return '';
      return `<h4 class="mini-h">${h}</h4><ul class="mrt-list">` + rows.map((s) => `<li>${mrtBadge(s.code)}<div>`
        + `<p class="nm">${esc(s.dest)}</p><p class="st">${esc(s.station)} station <span class="zh" lang="zh-Hant">${esc(s.zh)}</span></p>`
        + (s.note ? `<p class="note">${esc(s.note)}</p>` : '') + '</div>'
        + (Number.isFinite(s.fare) ? `<p class="fare">${twd(s.fare)}<small>${php(s.fare * r)}</small></p>` : '<p class="fare"><small>Check fare</small></p>')
        + '</li>').join('') + '</ul>';
    }).join('');

    const qty = store.get('buys', {});
    $('#buys').innerHTML = x.buys.map((b, i) => {
      const q = qty[i] || 0;
      return `<div class="buy">${b.photo && P[b.photo] ? photo(b.photo, 'thumb', 330, b.name) : `<span class="thumb ph blank" aria-hidden="true">${ICON.bag}</span>`}<div>`
        + `<h4>${esc(b.name)}</h4><p class="zh" lang="zh-Hant">${esc(b.zh)}</p><p class="order">${esc(b.what)}</p>`
        + `<p class="ftip"><strong>Where:</strong> ${esc(b.where)}</p>` + (b.tip ? `<p class="ftip">${esc(b.tip)}</p>` : '')
        + `<div class="row"><p class="price-tag">${twd(b.low)}${b.high > b.low ? ' to ' + twd(b.high) : ''}<small>${esc(b.unit)}, about ${php(((b.low + b.high) / 2) * r)}</small></p>`
        + `<span class="qty${q ? ' has' : ''}"><button type="button" data-act="qty" data-i="${i}" data-d="-1" aria-label="One fewer: ${esc(b.name)}">−</button>`
        + `<output data-q="${i}" aria-live="polite">${q}</output>`
        + `<button type="button" data-act="qty" data-i="${i}" data-d="1" aria-label="One more: ${esc(b.name)}">+</button></span></div></div></div>`;
    }).join('');
    $('#rules').innerHTML = x.rules.map(([h, t]) => `<div><dt>${esc(h)}</dt><dd>${esc(t)}</dd></div>`).join('');
    updateBuyTotal();

    $('#shops').innerHTML = x.shops.map((s) => {
      const p = P[s.key] || {};
      const st = mrtFor(s.key);
      return `<article class="shop-card">${P[s.key] && !p.photoless ? photo(s.key, 'photo', 960, s.name) : ''}<div class="body">`
        + `<p class="meta">${esc(s.area)}</p><h3>${esc(s.name)}</h3><p class="zh" lang="zh-Hant">${esc(p.zh || '')}</p>`
        + `<p class="order">${esc(s.buy)}</p>` + (s.kids ? `<p class="ftip">${esc(s.kids)}</p>` : '')
        + '<dl class="facts">' + `<div><dt>Open</dt><dd>${esc(s.hours)}</dd></div>`
        + (st ? `<div><dt>MRT</dt><dd>${mrtBadge(st.code)} ${esc(st.station)}, ${fareTxt(st)} from Taipei Main</dd></div>` : '') + '</dl>'
        + (P[s.key] ? `<div class="acts"><a class="act" href="${mapUrl(s.key)}" target="_blank" rel="noopener">${ICON.pin}Map</a><button type="button" class="act" data-act="driver" data-place="${esc(s.key)}">${ICON.driver}Show driver</button></div>` : '')
        + '</div></article>';
    }).join('');
    // Hide any part that has no content yet
    $('#ex-mrt').hidden = !(x.mrt.stations || []).length && !x.mrt.airport;
    $('#ex-buys').hidden = !x.buys.length;
    $('#ex-shops').hidden = !x.shops.length;
    $$('.subnav [data-act="jump"]').forEach((b) => { const sec = $('#' + b.dataset.to); b.hidden = !!(sec && sec.hidden); });
    applyPhotos($('#explore'));
  }

  function updateBuyTotal() {
    const x = EX();
    const qty = store.get('buys', {});
    const r = rateNow();
    let low = 0;
    let high = 0;
    let n = 0;
    x.buys.forEach((b, i) => { const q = qty[i] || 0; low += q * b.low; high += q * b.high; n += q; });
    const allow = state.settings.shopPerAdult * state.settings.adults;
    const box = $('#buy-total');
    if (!n) {
      box.innerHTML = '<p class="lbl">Your pasalubong list</p><p class="sub">Tap + on anything you plan to buy. The total shows up here and is saved on this phone.</p>';
      return;
    }
    const mid = (low + high) / 2;
    const over = mid > allow;
    box.innerHTML = `<p class="lbl">Your pasalubong list, ${n} ${n === 1 ? 'item' : 'items'}</p><p class="big">${php(mid * r)}</p>`
      + `<p class="twd">${twd(low)}${high > low ? ' to ' + twd(high) : ''}</p>`
      + `<p class="sub">Shopping money in the budget is ${php(allow * r)} (${twd(allow)}) for ${state.settings.adults} adults.${over ? ' Your list is over it.' : ' Your list fits.'}</p>`
      + (over ? '<button type="button" class="act" data-act="use-list">Make the budget fit my list</button>' : '');
  }

  // ---------- Driver card and photo viewer ----------
  let lastFocus = null;
  function openDriver(key) {
    const p = P[key];
    if (!p) return;
    lastFocus = document.activeElement;
    $('#drv-zh').textContent = p.zh;
    $('#drv-addr').textContent = p.addr || '';
    $('#drv-addr').hidden = !p.addr;
    $('#drv-en').textContent = p.en;
    $('#drv-note').textContent = p.note || '';
    $('#drv-note').hidden = !p.note;
    $('#drv-map').href = mapUrl(key);
    $('#driver').classList.add('open');
    document.body.classList.add('locked');
    $('#drv-close').focus();
  }
  function closeDriver() {
    $('#driver').classList.remove('open');
    document.body.classList.remove('locked');
    if (lastFocus) lastFocus.focus();
  }

  let lbToken = 0;
  function lbCount() {
    const tr = $('#lb-track');
    const n = tr.children.length;
    const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)) + 1;
    $('#lb-count').textContent = n > 1 ? `${Math.min(i, n)} of ${n}` : '';
  }
  function lbGo(dir) {
    const tr = $('#lb-track');
    tr.scrollBy({ left: dir * tr.clientWidth, behavior: motionOK() ? 'smooth' : 'auto' });
  }
  async function openGallery(key) {
    const p = P[key];
    if (!p) return;
    const token = ++lbToken;
    lastFocus = document.activeElement;
    const track = $('#lb-track');
    $('#lb-title').textContent = p.en;
    track.textContent = '';
    track.scrollLeft = 0;
    $('#lb-count').textContent = '';
    $('#lightbox').classList.add('open');
    document.body.classList.add('locked');
    $('#lb-close').focus();
    const seen = new Set();
    const add = (it) => {
      if (token !== lbToken || !it || !okSrc(it.src)) return;
      const id = fileKey(it.file) || it.src;
      if (seen.has(id)) return;
      seen.add(id);
      const fig = document.createElement('figure');
      fig.className = 'lb-slide';
      const img = document.createElement('img');
      img.alt = p.en;
      img.decoding = 'async';
      setImg(img, it.src, 1280);
      const cap = document.createElement('figcaption');
      cap.className = 'lb-cap';
      const a = document.createElement('a');
      a.target = '_blank';
      a.rel = 'noopener';
      a.href = okSrc(it.page) ? it.page : 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(it.file || '');
      a.textContent = it.artist
        ? `Photo: ${it.artist}${it.license ? ', ' + it.license : ''}. Tap for details.`
        : 'Photo from Wikipedia. Tap to see who took it and its license.';
      cap.append(a);
      fig.append(img, cap);
      track.append(fig);
      lbCount();
    };
    const lead = state.photos[key];
    if (lead) add(lead);
    const status = $('#lb-status');
    status.textContent = 'Finding more photos…';
    try {
      (await gallery(key)).forEach(add);
      if (token === lbToken) status.textContent = track.children.length ? '' : 'No photos for this stop yet.';
    } catch (e) {
      if (token === lbToken) status.textContent = track.children.length ? 'More photos need an internet connection.' : 'Photos need an internet connection.';
    }
  }
  function closeGallery() {
    lbToken += 1;
    $('#lightbox').classList.remove('open');
    document.body.classList.remove('locked');
    $('#lb-track').textContent = '';
    if (lastFocus) lastFocus.focus();
  }

  // ---------- Tabs ----------
  const TABS = ['days', 'food', 'explore', 'budget', 'pack'];
  const navOffset = () => (window.matchMedia('(min-width: 760px)').matches ? 58 : 0);
  const scrollToMain = () => {
    const top = $('#main').getBoundingClientRect().top + window.scrollY - navOffset();
    window.scrollTo({ top, behavior: motionOK() ? 'smooth' : 'auto' });
  };
  function showTab(tab, opts = {}) {
    if (!TABS.includes(tab)) tab = 'days';
    const changed = tab !== state.tab;
    state.tab = tab;
    TABS.forEach((t) => { $('#' + t).hidden = t !== tab; });
    $$('.nav a').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
    const v = $('#' + tab);
    if (changed && motionOK()) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
    if (tab === 'food') renderFood();
    if (tab === 'explore') renderExplore();
    if (tab === 'budget') renderBudget();
    if (tab === 'days') { if (opts.render) renderDays(true); else requestAnimationFrame(() => placeVan(false)); }
    updateRoute();
    const hash = tab === 'days' ? `#day-${state.day + 1}` : '#' + tab;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    if (opts.scroll) scrollToMain();
  }
  function fromHash() {
    const h = location.hash.slice(1);
    const m = /^day-(\d)$/.exec(h);
    if (m) {
      const d = Number(m[1]) - 1;
      if (d >= 0 && d < T.dates.length) state.day = d;
      return 'days';
    }
    return TABS.includes(h) ? h : null;
  }

  // ---------- Events ----------
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav a');
    if (nav) { e.preventDefault(); showTab(nav.dataset.tab, { scroll: true }); return; }
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'plan') {
      if (t.dataset.plan === state.plan) return;
      state.plan = t.dataset.plan;
      store.set('plan', state.plan);
      renderHero();
      renderDays(true);
      if (state.tab === 'food') renderFood();
      if (state.tab === 'budget') renderBudget();
    } else if (act === 'goday') {
      state.day = Number(t.dataset.day);
      showTab('days', { scroll: true, render: true });
    } else if (act === 'day') {
      state.day = Number(t.dataset.day);
      renderDays(true);
      updateRoute();
      history.replaceState(null, '', `#day-${state.day + 1}`);
      const top = $('#days').getBoundingClientRect().top + window.scrollY - navOffset();
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'auto' });
    } else if (act === 'driver') {
      openDriver(t.dataset.place);
    } else if (act === 'close-driver') {
      closeDriver();
    } else if (act === 'gallery') {
      openGallery(t.dataset.place);
    } else if (act === 'close-lb') {
      closeGallery();
    } else if (act === 'lb-prev' || act === 'lb-next') {
      lbGo(act === 'lb-next' ? 1 : -1);
    } else if (act === 'filter') {
      state.filter = t.dataset.f;
      renderFood();
    } else if (act === 'food-undo') {
      const ed = foodEdits();
      if (ed[t.dataset.i]) delete ed[t.dataset.i].p;
      store.set('food:' + state.plan, ed);
      renderFood();
      liveTotals();
    } else if (act === 'price-undo') {
      const ed = priceEdits();
      delete ed[t.dataset.i];
      store.set('prices:' + state.plan, ed);
      renderBudget();
      daySummary(compute());
    } else if (act === 'reset-prices') {
      if (!window.confirm('Undo all your price changes in this plan, including food?')) return;
      store.del('prices:' + state.plan);
      store.del('food:' + state.plan);
      renderBudget();
      daySummary(compute());
    } else if (act === 'rate-refresh') {
      t.disabled = true;
      t.textContent = 'Checking…';
      loadRate(true).then(() => { t.disabled = false; t.textContent = 'Refresh rate'; renderRate(); liveTotals(); });
    } else if (act === 'own-clear') {
      state.ownRate = null;
      store.del('ownRate');
      $('#own').open = false;
      renderRate();
      liveTotals();
    } else if (act === 'step') {
      const f = FIELDS.find((x) => x.k === t.dataset.k);
      const v = Math.min(f.max, Math.max(f.min, state.settings[f.k] + Number(t.dataset.d)));
      state.settings[f.k] = v;
      saveSettings();
      $('#out-' + f.k).textContent = v;
      liveTotals();
    } else if (act === 'tofood') {
      showTab('food', { scroll: true });
    } else if (act === 'tosetup') {
      $('#setup').scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'center' });
    } else if (act === 'reset-checks') {
      store.del('checks');
      renderPack();
    } else if (act === 'jump') {
      const sec = $('#' + t.dataset.to);
      if (sec) sec.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
    } else if (act === 'qty') {
      const qty = store.get('buys', {});
      const v = Math.max(0, Math.min(99, (qty[t.dataset.i] || 0) + Number(t.dataset.d)));
      qty[t.dataset.i] = v;
      store.set('buys', qty);
      const out = $(`[data-q="${t.dataset.i}"]`);
      if (out) { out.textContent = v; out.parentElement.classList.toggle('has', v > 0); }
      updateBuyTotal();
    } else if (act === 'use-list') {
      const qty = store.get('buys', {});
      const mid = EX().buys.reduce((a, b, i) => a + (qty[i] || 0) * ((b.low + b.high) / 2), 0);
      state.settings.shopPerAdult = Math.ceil(mid / Math.max(1, state.settings.adults) / 100) * 100;
      saveSettings();
      const inp = $('#in-shopPerAdult');
      if (inp) inp.value = state.settings.shopPerAdult;
      liveTotals();
      updateBuyTotal();
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    const act = t.dataset && t.dataset.act;
    if (act === 'food-price') {
      const v = Math.max(0, Number(t.value) || 0);
      const ed = foodEdits();
      const base = foods()[t.dataset.i].base;
      ed[t.dataset.i] = Object.assign({}, ed[t.dataset.i], { p: v });
      if (v === base) delete ed[t.dataset.i].p;
      store.set('food:' + state.plan, ed);
      const peso = $(`[data-peso="${t.dataset.i}"]`);
      if (peso) peso.textContent = `${php(v * rateNow())} each`;
      const undo = $(`[data-act="food-undo"][data-i="${t.dataset.i}"]`);
      if (undo) undo.hidden = v === base;
      liveTotals();
    } else if (act === 'price') {
      const v = Math.max(0, Number(t.value) || 0);
      const ed = priceEdits();
      ed[t.dataset.i] = v;
      store.set('prices:' + state.plan, ed);
      const row = t.closest('.item');
      const changed = v !== plan().budget[t.dataset.i][4];
      $('.edited', row).hidden = !changed;
      $('[data-act="price-undo"]', row).hidden = !changed;
      liveTotals();
    } else if (act === 'set') {
      const v = Number(t.value);
      if (!Number.isFinite(v) || v < 0) return;
      state.settings[t.dataset.k] = v;
      saveSettings();
      const f = FIELDS.find((x) => x.k === t.dataset.k);
      if (f && f.fmt) $('#out-' + f.k).textContent = f.fmt(v);
      liveTotals();
    } else if (t.id === 'own-rate') {
      const v = Number(t.value);
      state.ownRate = v > 0.5 && v < 10 ? v : null;
      if (state.ownRate) store.set('ownRate', v); else store.del('ownRate');
      renderRate();
      liveTotals();
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    const act = t.dataset && t.dataset.act;
    if (act === 'food-on') {
      const ed = foodEdits();
      ed[t.dataset.i] = Object.assign({}, ed[t.dataset.i], { on: t.checked });
      store.set('food:' + state.plan, ed);
      const row = t.closest('.fitem');
      if (row) row.classList.toggle('off', !t.checked);
      liveTotals();
    } else if (act === 'check') {
      const c = store.get('checks', {});
      c[t.dataset.k] = t.checked;
      store.set('checks', c);
    } else if (act === 'set-bool') {
      state.settings[t.dataset.k] = t.checked;
      saveSettings();
      liveTotals();
      renderDays(false);
    } else if (act === 'todo') {
      const d = store.get('todo', {});
      d[t.dataset.i] = t.checked;
      store.set('todo', d);
      t.closest('li').classList.toggle('done', t.checked);
    }
  });

  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').classList.contains('open')) {
      if (e.key === 'Escape') closeGallery();
      else if (e.key === 'ArrowRight') lbGo(1);
      else if (e.key === 'ArrowLeft') lbGo(-1);
    } else if ($('#driver').classList.contains('open') && e.key === 'Escape') {
      closeDriver();
    }
  });
  $('#lb-track').addEventListener('scroll', () => requestAnimationFrame(lbCount), { passive: true });

  // ---------- Start ----------
  function init() {
    buildRoute();
    renderHero();
    buildSetup();
    renderPack();
    const fromLink = fromHash();
    renderDays(true);
    showTab(fromLink || 'days');
    if (fromLink) setTimeout(scrollToMain, 60);

    loadPhotos();
    loadRate(false).then(() => {
      renderRate();
      liveTotals();
      if (state.tab === 'food') renderFood();
      if (state.tab === 'explore') renderExplore();
    });

    // During the trip, keep "Up next" current
    if (tripIdx >= 0) {
      setInterval(() => {
        if (state.tab === 'days' && state.day === tripIdx && !document.hidden) renderDays(false);
      }, 5 * 60e3);
    }

    window.addEventListener('resize', debounce(() => placeVan(false), 150));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeVanSoon);
    if ('ResizeObserver' in window) new ResizeObserver(debounce(placeVanSoon, 120)).observe($('#line'));

    // Pause the lanterns when the cover is off screen
    const sky = $('.sky');
    if ('IntersectionObserver' in window && sky) {
      new IntersectionObserver(([en]) => sky.classList.toggle('paused', !en.isIntersecting)).observe($('.hero'));
    }

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode unavailable */ });
    }
  }

  init();
})();
