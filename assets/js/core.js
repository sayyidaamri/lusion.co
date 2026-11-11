/* NOVARA core: smooth scroll, sound, header/menu, preloader, transitions, overlays. (c) NOVARA demo build */
(function () {
  "use strict";
  const NV = (window.NV = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const script = document.currentScript || $('script[src*="core.js"]');
  const BASE = script.src.replace(/assets\/js\/core\.js.*$/, "");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches || "ontouchstart" in window;
  const mq = matchMedia("(max-width: 767px)");
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const session = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  if (reduced) html.classList.add("reduced");

  Object.assign(NV, {
    $, $$, BASE, reduced, touch,
    get mobile() { return mq.matches; },
    clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    range: (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a))),
    ease: { io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), out: (t) => 1 - Math.pow(1 - t, 3), inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2 },
    vw: innerWidth, vh: innerHeight,
  });
  addEventListener("resize", () => { NV.vw = innerWidth; NV.vh = innerHeight; });

  /* ---------- RAF loop ---------- */
  const tickers = [];
  NV.onTick = (fn) => tickers.push(fn);
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const fn of tickers) fn(dt, now / 1000);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- SOUND (HTMLAudio so it works from file://) ---------- */
  const Sound = (NV.sound = {
    on: store.get("nv-sound") !== "off", unlocked: false, level: 0,
    files: { hover: 0.18, click: 0.35, menu: 0.4, focus: 0.3, page: 0.45, tunnel: 0.55, glass: 0.45, chime: 0.4, slide: 0.3 },
    pool: {}, music: null, musicVol: 0, musicTarget: 0, duck: 1,
    load() {
      for (const k in this.files) { const a = new Audio(BASE + "assets/audio/" + k + ".mp3"); a.preload = "auto"; this.pool[k] = a; }
      this.music = new Audio(BASE + "assets/audio/music.mp3"); this.music.loop = true; this.music.volume = 0; this.music.preload = "auto";
    },
    play(name, vol) {
      if (!this.on || !this.unlocked || !this.pool[name]) return;
      const a = this.pool[name].cloneNode(); a.volume = NV.clamp((vol ?? this.files[name]) * 1); a.play().catch(() => {});
    },
    unlock() {
      if (this.unlocked) return; this.unlocked = true;
      if (this.on) this.startMusic();
    },
    startMusic() { this.musicTarget = 0.32; this.music.play().catch(() => {}); },
    toggle() {
      this.on = !this.on; store.set("nv-sound", this.on ? "on" : "off");
      if (this.on) { this.unlocked = true; this.startMusic(); this.play("click"); } else { this.musicTarget = 0; }
      html.classList.toggle("sound-off", !this.on);
    },
  });
  Sound.load();
  html.classList.toggle("sound-off", !Sound.on);
  ["pointerdown", "keydown", "touchstart"].forEach((e) => addEventListener(e, () => Sound.unlock(), { once: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.music.pause(); else if (Sound.on && Sound.unlocked) Sound.music.play().catch(() => {}); });
  NV.onTick((dt) => {
    Sound.level = NV.lerp(Sound.level, Sound.on && Sound.unlocked ? 1 : 0, 1 - Math.pow(0.02, dt));
    const target = Sound.musicTarget * Sound.duck;
    Sound.musicVol = NV.lerp(Sound.musicVol, target, 1 - Math.pow(0.1, dt));
    if (Sound.music) { Sound.music.volume = NV.clamp(Sound.musicVol); if (Sound.musicVol < 0.003 && target === 0 && !Sound.music.paused) Sound.music.pause(); }
  });
  // hover / click / focus sounds by delegation
  let lastHover = null;
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const t = e.target.closest("[data-sfx]"); if (!t || t === lastHover) return;
    if (e.relatedTarget && t.contains(e.relatedTarget)) return;
    lastHover = t; Sound.play("hover");
  });
  document.addEventListener("pointerout", (e) => { const t = e.target.closest("[data-sfx]"); if (t && !t.contains(e.relatedTarget)) lastHover = null; });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-sfx]"); if (t && t.id !== "sound-btn" && t.id !== "menu-btn") Sound.play("click"); });
  document.addEventListener("focusin", (e) => { if (e.target.matches("[data-focus-sfx]")) Sound.play("focus"); });

  // sound button icon (animated wave)
  const sb = $("#sound-btn");
  if (sb) {
    const c = sb.querySelector("canvas"), g = c.getContext("2d");
    sb.addEventListener("click", () => Sound.toggle());
    NV.onTick((dt, t) => {
      const w = c.width, h = c.height, col = getComputedStyle(sb).color;
      g.clearRect(0, 0, w, h); g.lineWidth = 4; g.lineCap = "round"; g.strokeStyle = col; g.beginPath();
      const amp = 10 * Sound.level;
      for (let i = 0; i <= 30; i++) { const x = 26 + (i / 30) * 38; const k = Math.sin((i / 30) * Math.PI); const y = h / 2 + Math.sin(i * 0.55 - t * 7) * amp * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
  }

  /* ---------- SMOOTH SCROLL ---------- */
  const Scroll = (NV.scroll = { y: scrollY, target: scrollY, locked: false, velocity: 0, smooth: !touch && !reduced, max: 0,
    to(y, immediate) { this.target = NV.clamp(y, 0, this.max); if (immediate || !this.smooth) { this.y = this.target; scrollTo(0, this.y); } },
  });
  const measure = () => { Scroll.max = Math.max(0, document.documentElement.scrollHeight - innerHeight); };
  measure(); addEventListener("resize", measure); addEventListener("load", measure);
  NV.measure = measure;
  let scrollTimer = 0;
  const markScrolling = () => { html.classList.add("is-scrolling"); clearTimeout(scrollTimer); scrollTimer = setTimeout(() => html.classList.remove("is-scrolling"), 900); };
  if (Scroll.smooth) {
    addEventListener("wheel", (e) => {
      if (e.ctrlKey) return;
      if (Scroll.locked) { e.preventDefault(); return; }
      if (e.target.closest && e.target.closest("[data-native-scroll]")) return;
      e.preventDefault();
      let d = e.deltaY; if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= innerHeight;
      Scroll.target = NV.clamp(Scroll.target + d, 0, Scroll.max);
      NV.emit("wheel", d);
      markScrolling();
    }, { passive: false });
  }
  let selfScroll = false;
  addEventListener("scroll", () => {
    if (!selfScroll && Math.abs(scrollY - Scroll.y) > 2) { Scroll.y = Scroll.target = scrollY; }
    selfScroll = false; markScrolling();
  }, { passive: true });
  NV.onTick((dt) => {
    measure();
    const prev = Scroll.y;
    if (Scroll.smooth) {
      Scroll.y = NV.lerp(Scroll.y, Scroll.target, 1 - Math.pow(0.0009, dt));
      if (Math.abs(Scroll.y - Scroll.target) < 0.3) Scroll.y = Scroll.target;
      if (Math.abs(scrollY - Scroll.y) > 0.25) { selfScroll = true; scrollTo(0, Scroll.y); }
    } else { Scroll.y = Scroll.target = scrollY; }
    Scroll.velocity = (Scroll.y - prev) / Math.max(dt, 0.001);
    const ind = $("#scroll-indicator i"); if (ind && Scroll.max) ind.style.transform = `translateY(${(Scroll.y / Scroll.max) * 144}px)`;
  });
  addEventListener("keydown", (e) => {
    if (!Scroll.smooth || e.target.matches("input, textarea")) return;
    const map = { ArrowDown: 120, ArrowUp: -120, PageDown: innerHeight * 0.9, PageUp: -innerHeight * 0.9, " ": innerHeight * 0.9, End: 1e9, Home: -1e9 };
    if (e.key in map && !Scroll.locked) { e.preventDefault(); Scroll.target = NV.clamp(Scroll.target + (e.shiftKey && e.key === " " ? -map[e.key] : map[e.key]), 0, Scroll.max); NV.emit("wheel", map[e.key]); markScrolling(); }
  });

  /* tiny event bus */
  const bus = {};
  NV.on = (n, f) => (bus[n] = bus[n] || []).push(f);
  NV.emit = (n, ...a) => (bus[n] || []).forEach((f) => f(...a));

  /* ---------- header colouring over dark sections ---------- */
  const darkSel = ["#end", "#scroll-nav", "#who", "#team", "#brands", "#awards", "#expertise"];
  NV.forceDark = false;
  NV.onTick(() => {
    const y = 60; let dark = NV.forceDark;
    if (!dark) for (const s of darkSel) { const el = $(s); if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) { dark = true; break; } }
    if (document.body.classList.contains("theme-project")) dark = !(($("#footer") || {}).getBoundingClientRect?.().top < y);
    html.classList.toggle("on-dark", dark);
  });

  /* ---------- MENU ---------- */
  const menuBtn = $("#menu-btn");
  const setMenu = (open) => {
    html.classList.toggle("menu-open", open);
    menuBtn && menuBtn.setAttribute("aria-expanded", open);
    $("#menu") && $("#menu").setAttribute("aria-hidden", !open);
    Sound.play("menu");
  };
  NV.menuOpen = () => html.classList.contains("menu-open");
  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!NV.menuOpen()));
  $("#menu-shade") && $("#menu-shade").addEventListener("click", () => setMenu(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && NV.menuOpen()) setMenu(false); });
  $$("#menu a").forEach((a) => a.addEventListener("click", () => NV.menuOpen() && html.classList.remove("menu-open")));

  /* ---------- NEWSLETTER (demo — never sends data) ---------- */
  $$(".news-form").forEach((f) => {
    const input = f.querySelector("input"), msg = f.querySelector(".news-msg");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      msg.className = "news-msg";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.textContent = v ? "Please enter a valid email address." : "Please enter your email."; msg.classList.add("is-error"); input.focus(); Sound.play("focus"); return; }
      msg.textContent = "Thanks! You're on the list (demo — nothing was sent)."; msg.classList.add("is-ok"); input.value = ""; Sound.play("chime");
    });
    input.addEventListener("input", () => { msg.textContent = ""; msg.className = "news-msg"; });
  });

  /* ---------- REVEALS ---------- */
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { threshold: 0.15 });
  NV.observeReveals = () => $$(".reveal, .reveal-words, .footer-middle, .end-sub").forEach((el) => io.observe(el));

  /* ---------- project item parallax ---------- */
  $$(".project-item").forEach((it) => {
    const m = it.querySelector(".pi-media");
    it.addEventListener("pointermove", (e) => { it.classList.add("is-moving"); clearTimeout(it._mt); it._mt = setTimeout(() => it.classList.remove("is-moving"), 120); const r = m.getBoundingClientRect(); it.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5) * -3 + "%"); it.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5) * -3 + "%"); });
    it.addEventListener("pointerleave", () => { it.style.setProperty("--mx", "0%"); it.style.setProperty("--my", "0%"); });
  });

  /* ---------- project cards: scroll-linked entrance (image first, then text) ---------- */
  const cards = $$(".project-item");
  if (cards.length) NV.onTick(() => {
    const vh = innerHeight;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (r.top > vh * 1.3 || r.bottom < -vh * 0.3) continue;
      const p = NV.ease.out(NV.range(vh - r.top, 0, vh * 0.55));
      c.style.setProperty("--ap", p.toFixed(3));
      if (p > 0.82 && !c.classList.contains("is-shown")) c.classList.add("is-shown");
    }
  });

  /* ---------- grid cards flutter: only the bottom lifts toward the viewer, like paper blown from behind ---------- */
  if (cards.length && !reduced) {
    const st = cards.map((c, i) => ({ m: c.querySelector(".pi-media"), b: 0, v: 0, ph: Math.random() * 6, side: i % 2 ? -1 : 1 }));
    NV.onTick((dt, now) => {
      if (NV.mobile) return;
      const target = Math.min(1, Math.abs(NV.scroll.velocity) / 4200);
      const vh = innerHeight;
      st.forEach((o) => {
        o.v += (target - o.b) * 110 * dt; o.v *= Math.exp(-4.5 * dt); o.b += o.v * dt;
        const r = o.m.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        const a = Math.max(0, o.b), fl = a > 0.002 ? a : 0;
        const gust = Math.sin(now * 8 + o.ph) * 0.18 * fl;
        o.m.style.setProperty("--flap", ((fl + gust) * 6).toFixed(2) + "deg");
        o.m.style.setProperty("--curl", (o.side * (fl * 1.5 + gust * 2)).toFixed(2) + "deg");
      });
    });
  }

  /* ---------- PAGE TRANSITIONS ---------- */
  /* pixel LOADING text (own 5x5 glyphs) */
  const PX = { L: "1000010000100001000011111", O: "0111010001100011000101110", A: "0111010001111111000110001", D: "1111010001100011000111110", I: "1111100100001000010011111", N: "1000111001101011001110001", G: "0111110000100111000101111", X: "1100011000110001100011111" };
  const pxl = (ch, big) => `<span class="pxl${big ? " big" : ""}">${[...PX[ch]].map((b) => `<i class="${b === "1" ? "on" : ""}"></i>`).join("")}</span>`;
  const loadBox = $("#transition .tr-load");
  let loadTimer = 0;
  function playLoading() {
    if (!loadBox) return; clearInterval(loadTimer);
    loadBox.innerHTML = pxl("L", true); let step = 0; const word = "LOADING";
    loadTimer = setInterval(() => {
      step++;
      if (step === 3) loadBox.innerHTML = "";
      if (step >= 3 && step < 3 + word.length) loadBox.insertAdjacentHTML("beforeend", pxl(word[step - 3]));
      if (step > 3 + word.length + 4) { const kids = loadBox.children; if (kids.length > 1) kids[0].remove(); else { loadBox.innerHTML = pxl("L", true); clearInterval(loadTimer); } }
    }, 70);
  }
  function go(href, color) {
    if (html.classList.contains("t-out")) return;
    html.style.setProperty("--tc", color || "#0b0c10");
    html.classList.remove("t-in", "t-reveal"); void html.offsetWidth;
    html.classList.add("t-out"); Sound.play("page"); setTimeout(playLoading, 420);
    Sound.duck = 0.4;
    setTimeout(() => { location.href = href; }, reduced ? 0 : 1250);
  }
  NV.go = go;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http") || a.target === "_blank") return;
    e.preventDefault();
    const pc = a.closest(".project-item") ? "#0b0c10" : a.id === "pd-next" ? getComputedStyle(document.body).getPropertyValue("--pbg") : "#0b0c10";
    go(a.href, pc);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) { html.classList.remove("t-out"); Sound.duck = 1; } });

  /* ---------- OVERSCROLL NAVIGATION (scroll-nav / next project) ---------- */
  const os = $("[data-overscroll]");
  if (os) {
    let p = 0, fired = false, touchY = null;
    const cssVar = os.dataset.var || "--snp";
    const atEnd = () => Scroll.max - Scroll.y < 4 && Scroll.max - Scroll.target < 4;
    const fire = () => { if (p >= 1 && !fired) { fired = true; Sound.play("chime"); go(os.dataset.href, os.id === "pd-next" ? getComputedStyle(document.body).getPropertyValue("--pbg") : "#121416"); } };
    NV.on("wheel", (d) => { if (atEnd() && d > 0) { p = NV.clamp(p + d / 1400); fire(); } });
    addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    addEventListener("touchmove", (e) => { if (touchY == null) return; const d = touchY - e.touches[0].clientY; touchY = e.touches[0].clientY; if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4 && d > 0) { p = NV.clamp(p + d / 500); fire(); } }, { passive: true });
    NV.onTick((dt) => {
      if (!atEnd()) p = Math.max(0, p - dt * 1.5); else p = Math.max(0, p - dt * 0.12);
      os.style.setProperty(cssVar, p.toFixed(4)); document.documentElement.style.setProperty(cssVar, p.toFixed(4));
    });
  }

  /* ---------- footer up ---------- */
  $("#up-btn") && $("#up-btn").addEventListener("click", () => { Scroll.to(0); if (!Scroll.smooth) scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- VIDEO OVERLAY ---------- */
  const vo = $("#video-overlay");
  if (vo) {
    const v = vo.querySelector("video"), cur = $("#vo-cursor"), bar = $("#vo-progress i"), play = $("#vo-play"), mute = $("#vo-mute");
    NV.openVideo = () => {
      vo.classList.add("is-open"); vo.setAttribute("aria-hidden", "false"); Scroll.locked = true; html.style.overflow = "hidden";
      v.currentTime = 0; v.muted = !Sound.on; mute.textContent = v.muted ? "Unmute" : "Mute"; v.play().catch(() => {}); play.textContent = "Pause";
      Sound.duck = 0; Sound.play("click");
    };
    const close = () => { vo.classList.remove("is-open"); vo.setAttribute("aria-hidden", "true"); v.pause(); Scroll.locked = false; html.style.overflow = ""; Sound.duck = 1; Sound.play("menu"); };
    NV.closeVideo = close;
    vo.addEventListener("click", (e) => { if (!e.target.closest("#vo-controls")) close(); });
    $("#vo-close").addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && vo.classList.contains("is-open")) close(); if (e.key === " " && vo.classList.contains("is-open")) { e.preventDefault(); play.click(); } });
    play.addEventListener("click", () => { if (v.paused) { v.play(); play.textContent = "Pause"; } else { v.pause(); play.textContent = "Play"; } });
    mute.addEventListener("click", () => { v.muted = !v.muted; mute.textContent = v.muted ? "Unmute" : "Mute"; });
    $("#vo-progress").addEventListener("click", (e) => { const r = e.currentTarget.getBoundingClientRect(); if (v.duration) v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; });
    v.addEventListener("timeupdate", () => { if (v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + "%"; });
    v.addEventListener("ended", close);
    vo.addEventListener("pointermove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; vo.classList.toggle("on-controls", !!e.target.closest("#vo-controls")); });
    if (touch) $("#vo-close").style.display = "grid";
  }

  /* ---------- PRELOADER / page reveal ---------- */
  function ready() {
    // arriving through a page transition: whatever is already on screen appears in its final state,
    // so there is only ONE entrance (the page itself) and no second wave of reveals afterwards
    const viaT = html.classList.contains("t-in"); NV.viaTransition = viaT;
    if (viaT) {
      html.classList.add("instant");
      const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 1.05 && r.bottom > 0; };
      $$("#hero-title, #who-big, .reveal, .reveal-words, .footer-middle, .end-sub").forEach((el) => { if (inView(el)) el.classList.add("is-in"); });
      $$(".project-item").forEach((el) => { if (inView(el)) el.classList.add("is-shown"); });
      requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("instant")));
    }
    html.classList.remove("is-loading"); html.classList.add("is-ready");
    const ht = $("#hero-title"); if (ht) setTimeout(() => ht.classList.add("is-in"), 150);
    $$("#hero-scroll").forEach((l) => l.classList.add("is-in"));
    NV.observeReveals();
    NV.isReady = true; NV.emit("ready");
  }
  const pre = $("#preloader");
  if (!html.classList.contains("no-preload") && pre && !reduced) {
    session.set("nv-visited", "1");
    const digits = $$(".pl-d", pre), bar = $(".pl-bar", pre);
    let shown = 0, loaded = 0;
    const imgs = $$("img").slice(0, 12); const total = imgs.length + 1;
    const bump = () => loaded++;
    imgs.forEach((im) => (im.complete ? bump() : (im.addEventListener("load", bump), im.addEventListener("error", bump))));
    addEventListener("load", bump);
    const t0 = performance.now();
    const step = () => {
      const time = (performance.now() - t0) / 1000;
      const real = loaded / total;
      const target = Math.min(1, Math.min(real, time / 1.6) * 0.85 + NV.clamp((time - 0.6) / 2.6) * 0.15 + (time > 4 ? 1 : 0));
      shown = Math.min(1, Math.max(shown + 0.004, NV.lerp(shown, target, 0.08)));
      const n = Math.round(shown * 100);
      const s = String(n).padStart(3, "0");
      digits.forEach((d, i) => d.style.setProperty("--d", s[i] === "0" && n === 100 && i > 0 ? 10 : +s[i]));
      if (n === 100) digits[0].style.setProperty("--d", 1);
      bar.style.setProperty("--p", shown);
      if (shown < 1) requestAnimationFrame(step);
      else {
        html.classList.add("pl-done"); Sound.play("chime", 0.25);
        setTimeout(() => { html.classList.add("pl-out"); ready(); }, 1000);
        setTimeout(() => pre.remove(), 1800);
      }
    };
    requestAnimationFrame(step);
  } else {
    session.set("nv-visited", "1");
    pre && pre.remove();
    html.classList.add("t-in"); html.style.setProperty("--tc", getComputedStyle(document.body).getPropertyValue("--pbg") || "#0b0c10");
    if (loadBox) { loadBox.innerHTML = [..."LOADING"].map((c) => pxl(c)).join(""); }
    const enter = () => { html.classList.add("t-reveal", "t-enter"); ready(); setTimeout(() => { html.classList.remove("t-in", "t-reveal", "t-enter"); NV.emit("settled"); }, 1250); };
    let shrink = 0; const sh = setInterval(() => { const k = loadBox && loadBox.children; if (k && k.length > 1) k[k.length - 1].remove(); else { clearInterval(sh); if (loadBox) loadBox.innerHTML = pxl("L", true); } }, 55);
    setTimeout(enter, reduced ? 0 : 700);
  }
  // always start at the top on load (virtual scroll sites do)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0); Scroll.y = Scroll.target = 0;
})();
