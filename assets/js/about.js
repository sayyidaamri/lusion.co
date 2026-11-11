/* About page: who sequence, pinned team viewer, brand marquees, awards, expertise card deck. */
(function () {
  const NV = window.NV, { $, $$, clamp, lerp, range } = NV;
  const prog = (el) => { const r = el.getBoundingClientRect(); return range(-r.top, 0, r.height - innerHeight); };

  /* ---------- WHO ---------- */
  const who = $("#who"), big = $("#who-big"), left = $("#who-left"), right = $("#who-right"), bg = $("#who-bg"), top = $("#who-top"), bottom = $("#who-bottom");
  const cv = $("#who-canvas"), g = cv.getContext("2d");
  let W, H; const dpr = Math.min(devicePixelRatio, 1.5);
  const rs = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }; rs(); addEventListener("resize", rs);
  const P = Array.from({ length: NV.mobile ? 900 : 2200 }, () => { const a = Math.random() * 6.283, r = Math.pow(Math.random(), 0.75); return { a, r, y: (Math.random() - 0.5) * 2, s: Math.random() < 0.85 ? 1 + Math.random() * 2.5 : 3 + Math.random() * 6, sp: 0.2 + Math.random() * 0.8, ph: Math.random() * 6, arm: Math.floor(Math.random() * 3) }; });
  const bigTxt = $("#who-big"); const reveal = () => bigTxt.classList.add("is-in"); NV.isReady ? reveal() : NV.on("ready", reveal);
  const topWords = $$(".w", top), botWords = $$(".w", bottom);
  const bigLetters = $$("#who-big > span b"); const E2 = (t) => t * t * (3 - 2 * t);
  const lineSpans = (el) => Array.from(el.children);
  NV.onTick((dt, now) => {
    const r = who.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = prog(who);
    const a = NV.ease.io(range(p, 0.04, 0.16));
    // letters warp and fly off one after another (left first), like being swept away
    const outP = range(p, 0.035, 0.14);
    big.classList.toggle("is-out", outP > 0);
    bigLetters.forEach((l, i) => {
      if (outP <= 0) { l.style.transform = ""; l.style.opacity = ""; l.style.filter = ""; return; }
      const k = E2(range(outP, i * 0.08, 0.45 + i * 0.08));
      l.style.transform = `translate(${-k * (40 + i * 6)}vw, ${-k * (18 - i * 2)}vh) rotate(${-k * (35 - i * 4)}deg) skewX(${-k * 40}deg) scale(${1 - k * 0.5}, ${1 - k * 0.85})`;
      l.style.opacity = 1 - range(k, 0.55, 1); l.style.filter = `blur(${k * 6}px)`;
    });
    big.querySelector("p").style.opacity = 1 - range(p, 0.03, 0.07);
    bg.style.opacity = range(p, 0.06, 0.2) * (1 - range(p, 0.62, 0.9) * 0.75);
    bg.style.setProperty("--bs", lerp(1.3, 1.02, NV.ease.out(range(p, 0.06, 0.55))));
    const lin = range(p, 0.11, 0.2), lout = NV.ease.io(range(p, 0.42, 0.56));
    left.style.opacity = right.style.opacity = lin * (1 - range(p, 0.5, 0.56));
    lineSpans(left).forEach((s, i) => (s.style.transform = `translateX(${-lout * (30 + i * 6)}vw) translateY(${(1 - NV.ease.out(range(lin, i * 0.12, 0.6 + i * 0.12))) * 30}px)`));
    lineSpans(right).forEach((s, i) => (s.style.transform = `translateX(${lout * (30 + i * 6)}vw) translateY(${(1 - NV.ease.out(range(lin, 0.2 + i * 0.12, 0.8 + i * 0.12))) * 30}px)`));
    // details text: words light up with progress
    const tp = range(p, 0.56, 0.74), bp = range(p, 0.68, 0.86);
    top.style.opacity = range(p, 0.55, 0.6) * (1 - range(p, 0.93, 1)); bottom.style.opacity = range(p, 0.66, 0.7) * (1 - range(p, 0.93, 1));
    top.style.transform = `translateX(${-range(p, 0.9, 1) * 30}vw)`; bottom.style.transform = `translateX(${range(p, 0.9, 1) * 20}vw)`;
    topWords.forEach((w, i) => w.classList.toggle("on", i / topWords.length < tp));
    botWords.forEach((w, i) => w.classList.toggle("on", i / botWords.length < bp));
    // particles: swirling cloud that condenses into a beam
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cond = NV.ease.io(range(p, 0.1, 0.5)), fade = 1 - range(p, 0.7, 0.95);
    const cx = W / 2, cy = H * lerp(0.32, 0.28, cond);
    g.fillStyle = "#fff";
    for (const q of P) {
      const ang = q.a + now * 0.12 * q.sp + q.r * 2.4 * (1 - cond); // spiral arms
      const rad = q.r * Math.min(W, H) * lerp(0.52, 0.09, cond);
      const x = cx + Math.cos(ang) * rad * (1 + 0.25 * Math.sin(now * 0.5 + q.ph)) * 1.25;
      const y = cy + Math.sin(ang) * rad * 0.62 + q.y * lerp(40, H * 0.35, cond) + Math.sin(now + q.ph) * 5;
      g.globalAlpha = (0.18 + 0.82 * Math.pow(1 - q.r, 1.5)) * fade * (0.55 + 0.45 * Math.sin(now * 2 + q.ph));
      const ss = q.s * lerp(1, 0.6, cond); g.beginPath(); g.arc(x, y, ss, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
    const gl = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * lerp(0.4, 0.15, cond)); gl.addColorStop(0, `rgba(255,255,255,${0.22 * fade})`); gl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  });

  /* ---------- TEAM ---------- */
  const team = $("#team"), data = JSON.parse($("#team-data").textContent), n = data.length;
  team.style.setProperty("--n", n);
  const faces = $$(".face", team), letters = $$(".tl-wrap", team), nameEl = $("#team-name"), jobEl = $("#team-job"), numEl = $("#team-num"), progEl = $("#team-progress i");
  letters.forEach((l) => $$(".px i", l).forEach((c) => c.style.setProperty("--d", Math.floor(Math.random() * 400))));
  const scramble = (el, text) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+-/<>";
    let f = 0; const total = 14; clearInterval(el._t);
    el._t = setInterval(() => { f++; el.textContent = text.split("").map((c, i) => (c === " " ? " " : i < (f / total) * text.length ? c : chars[(Math.random() * chars.length) | 0])).join(""); if (f >= total) { clearInterval(el._t); el.textContent = text; } }, 30);
  };
  let cur = 0;
  const show = (i) => {
    if (i === cur) return; cur = i; const m = data[i];
    faces.forEach((f, k) => { f.classList.toggle("is-active", k === i); });
    faces[i].classList.add("is-glitch"); setTimeout(() => faces[i].classList.remove("is-glitch"), 350);
    letters.forEach((l, k) => l.classList.toggle("is-active", k === i));
    scramble(nameEl, m.name); jobEl.innerHTML = m.job.join("<br>"); numEl.textContent = String(i + 1).padStart(3, "0");
    NV.sound.play("slide");
  };
  const segStart = () => team.getBoundingClientRect().top + scrollY;
  const seg = () => (team.offsetHeight - innerHeight) / n;
  const goNext = () => { const i = (cur + 1) % n; const y = segStart() + seg() * (i + 0.15); NV.scroll.to(y); if (!NV.scroll.smooth) scrollTo({ top: y, behavior: "smooth" }); };
  // the blue button is the cursor inside the team stage: it follows the pointer, a click anywhere goes next
  const tStage = $("#team-stage"), tBtn = $("#team-next");
  const cpos = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, s: 1, ts: 1 };
  tStage.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; cpos.tx = e.clientX; cpos.ty = e.clientY; });
  tStage.addEventListener("pointerleave", () => { cpos.tx = innerWidth / 2; cpos.ty = innerHeight / 2; });
  tStage.addEventListener("pointerdown", () => (cpos.ts = 0.85));
  addEventListener("pointerup", () => (cpos.ts = 1));
  tStage.addEventListener("click", (e) => { if (e.target.closest("a")) return; tBtn.classList.add("is-click"); setTimeout(() => tBtn.classList.remove("is-click"), 300); NV.sound.play("click"); goNext(); });
  NV.onTick((dt) => {
    const k = 1 - Math.pow(0.0005, dt);
    cpos.x = lerp(cpos.x, cpos.tx, k); cpos.y = lerp(cpos.y, cpos.ty, k); cpos.s = lerp(cpos.s, cpos.ts, k);
    tBtn.style.setProperty("--cx", cpos.x + "px"); tBtn.style.setProperty("--cy", cpos.y + "px"); tBtn.style.setProperty("--cs", cpos.s);
  });
  let tx0 = null;
  team.addEventListener("touchstart", (e) => (tx0 = e.touches[0].clientX), { passive: true });
  team.addEventListener("touchend", (e) => { if (tx0 == null) return; const d = e.changedTouches[0].clientX - tx0; tx0 = null; if (Math.abs(d) > 50) { const i = clamp(cur + (d < 0 ? 1 : -1), 0, n - 1); scrollTo({ top: segStart() + seg() * (i + 0.15), behavior: "smooth" }); } });
  NV.onTick(() => {
    const p = prog(team), f = p * n, i = clamp(Math.floor(f), 0, n - 1);
    show(i); progEl.style.width = clamp(f - i) * 100 + "%";
    $("#team-faces").style.transform = `translate(${NV.mobile ? -50 : -60}%, -50%) scale(${1 + clamp(f - i) * 0.04})`;
  });

  /* ---------- BRANDS marquee ---------- */
  const rows = $$(".brand-row").map((r) => ({ el: r.firstElementChild, dir: +r.dataset.dir, x: Math.random() * -300 }));
  NV.onTick((dt) => {
    const v = 40 + Math.abs(NV.scroll.velocity) * 0.25;
    for (const r of rows) { const w = r.el.scrollWidth / 3; r.x -= r.dir * v * dt; if (r.x < -w) r.x += w; if (r.x > 0) r.x -= w; r.el.style.transform = `translateX(${r.x}px)`; }
  });

  /* ---------- AWARDS outline text ---------- */
  const aw = $("#awards"), abg = $$(".awards-bg span");
  NV.onTick(() => { const r = aw.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = range(innerHeight - r.top, 0, r.height + innerHeight); abg.forEach((s, i) => s.style.setProperty("--ax", (i % 2 ? -1 : 1) * (p * 30 - 15) - 10 + "vw")); });

  /* ---------- EXPERTISE deck ---------- */
  const exp = $("#expertise"), cards = $$(".card", exp), studio = $("#exp-studio"), title = $("#exp-title"), sub = $("#exp-sub"), line = $("#exp-line path");
  let dealt = false;
  NV.onTick((dt, now) => {
    const r = exp.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = prog(exp), mob = NV.mobile, vw = innerWidth / 100;
    studio.style.setProperty("--sy", -range(p, 0.0, 0.3) * 70 + "vh");
    const ty = -NV.ease.io(range(p, 0.12, 0.3)) * 100 + "vh"; title.style.setProperty("--ty", ty); sub.style.setProperty("--ty", ty);
    const fan = NV.ease.out(range(p, 0.08, 0.3)), deal = NV.ease.io(range(p, 0.36, 0.62));
    line.style.setProperty("--dash", 3000 * (1 - range(p, 0.4, 0.75)));
    if (deal > 0.5 && !dealt) { dealt = true; NV.sound.play("slide"); } if (deal < 0.2) dealt = false;
    cards.forEach((c, i) => {
      const fx = (i - 1.5) * 3 * vw, fr = (i - 1.5) * 9, fy = Math.abs(i - 1.5) * 1.2 * vw;
      let gx, gy; if (mob) { gx = (i % 2 ? 1 : -1) * 22.5 * vw; gy = (i < 2 ? -1 : 1) * 31 * vw; } else { gx = (i - 1.5) * 18.4 * vw; gy = 2 * vw; }
      const x = lerp(fx, gx, deal), y = lerp(lerp(40 * vh(), fy, fan), gy, deal), rot = lerp(fr, 0, deal) + Math.sin(now + i) * (1 - deal) * 1.5;
      const sc = lerp(lerp(0.6, 0.86, fan), 1, deal);
      const flip = lerp(180, 0, NV.ease.io(range(deal, 0.35 + i * 0.12, 0.75 + i * 0.08)));
      const tl = c._tilt || { x: 0, y: 0 }; c.classList.toggle("is-live", deal > 0.98);
      c.style.transform = `translate(${x}px, ${y - (c._hov || 0) * 14}px) rotate(${rot}deg) scale(${sc}) rotateX(${tl.y * -10}deg) rotateY(${tl.x * 12}deg)`;
      c.style.zIndex = 10 - Math.abs(Math.round((i - 1.5) * 2));
      c.firstElementChild.style.setProperty("--flip", flip + "deg");
      c.style.opacity = range(p, 0.04, 0.12);
    });
  });
  function vh() { return innerHeight / 100; }
  cards.forEach((c) => {
    c._tilt = { x: 0, y: 0 }; let tgt = { x: 0, y: 0 }, hov = 0;
    c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); tgt = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }; hov = 1; });
    c.addEventListener("pointerenter", () => NV.sound.play("hover"));
    c.addEventListener("pointerleave", () => { tgt = { x: 0, y: 0 }; hov = 0; });
    NV.onTick(() => { c._tilt.x = lerp(c._tilt.x, tgt.x, 0.12); c._tilt.y = lerp(c._tilt.y, tgt.y, 0.12); c._hov = lerp(c._hov || 0, hov, 0.12); });
  });
})();
