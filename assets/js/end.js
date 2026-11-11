/* End section ("Let's work together!"): flying stickers + glossy bubbles (dark) or a dot wave (blue). */
(function () {
  const NV = window.NV, { $, clamp, lerp, range } = NV; const E2 = (t) => 1 - Math.pow(1 - t, 4);
  const end = $("#end"); if (!end) return;
  const blue = end.classList.contains("end--blue");
  const canvas = end.querySelector(".end-canvas"), g = canvas.getContext("2d");
  const wrap = end.querySelector(".end-stickers"), content = end.querySelector(".end-content");
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio, 1.5);
  const resize = () => { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; };
  resize(); addEventListener("resize", resize);
  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

  // ---- own sticker set (simple bold shapes with white sticker border) ----
  const S = (inner, vb = "0 0 100 100") => `<svg viewBox="${vb}">${inner}</svg>`;
  const o = 'stroke="#fff" stroke-width="7" stroke-linejoin="round"';
  const k = 'stroke="#111" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"';
  const stickers = [
    S(`<circle cx="50" cy="50" r="40" fill="#b68cff" ${o}/><circle cx="50" cy="50" r="40" fill="none" ${k}/><circle cx="37" cy="42" r="5" fill="#111"/><circle cx="63" cy="42" r="5" fill="#111"/><path d="M33 60q17 16 34 0" fill="none" ${k}/>`),
    S(`<path d="M50 6l11 28 30 2-23 19 8 30-26-17-26 17 8-30L9 36l30-2z" fill="#ffd400" ${o}/><path d="M50 6l11 28 30 2-23 19 8 30-26-17-26 17 8-30L9 36l30-2z" fill="none" ${k}/>`),
    S(`<path d="M58 4 22 56h22l-8 40 40-56H52z" fill="#ffe14a" ${o}/><path d="M58 4 22 56h22l-8 40 40-56H52z" fill="none" ${k}/>`),
    S(`<path d="M50 88S10 62 10 36c0-14 11-24 23-24 8 0 14 4 17 10 3-6 9-10 17-10 12 0 23 10 23 24 0 26-40 52-40 52z" fill="#ff3d6e" ${o}/><path d="M50 88S10 62 10 36c0-14 11-24 23-24 8 0 14 4 17 10 3-6 9-10 17-10 12 0 23 10 23 24 0 26-40 52-40 52z" fill="none" ${k}/><ellipse cx="32" cy="34" rx="7" ry="4" fill="#fff" opacity=".7"/>`),
    S(`<g ${o}>${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="50" cy="26" rx="13" ry="20" fill="#ff8ad8" transform="rotate(${r} 50 50)"/>`).join("")}</g>${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="50" cy="26" rx="13" ry="20" fill="#ff8ad8" ${k} transform="rotate(${r} 50 50)"/>`).join("")}<circle cx="50" cy="50" r="13" fill="#ffd400" ${k}/>`),
    S(`<circle cx="50" cy="50" r="22" fill="#26e0a0" ${o}/><ellipse cx="50" cy="50" rx="44" ry="13" fill="none" stroke="#fff" stroke-width="11" transform="rotate(-18 50 50)"/><ellipse cx="50" cy="50" rx="44" ry="13" fill="none" stroke="#ff5a1f" stroke-width="5" transform="rotate(-18 50 50)"/><circle cx="50" cy="50" r="22" fill="none" ${k}/>`),
    S(`<path d="M8 50Q50 6 92 50Q50 94 8 50z" fill="#fff" ${o}/><path d="M8 50Q50 6 92 50Q50 94 8 50z" fill="#fff" ${k}/><circle cx="50" cy="50" r="17" fill="#1a2ffb" ${k}/><circle cx="50" cy="50" r="7" fill="#111"/><circle cx="56" cy="44" r="4" fill="#fff"/>`),
    S(`<rect x="14" y="14" width="72" height="72" rx="18" fill="#1a2ffb" ${o} transform="rotate(8 50 50)"/><rect x="14" y="14" width="72" height="72" rx="18" fill="none" ${k} transform="rotate(8 50 50)"/><text x="50" y="62" font-family="Inter Tight,Arial" font-weight="600" font-size="34" text-anchor="middle" fill="#fff" transform="rotate(8 50 50)">3D</text>`),
    S(`<path d="M50 8c22 0 34 16 34 34 0 22-20 30-20 46H36c0-16-20-24-20-46C16 24 28 8 50 8z" fill="#c1ff00" ${o}/><path d="M50 8c22 0 34 16 34 34 0 22-20 30-20 46H36c0-16-20-24-20-46C16 24 28 8 50 8z" fill="none" ${k}/><path d="M38 76h24M40 86h20" ${k}/>`),
    S(`<path d="M50 10c14 22 30 34 30 52a30 30 0 0 1-60 0c0-18 16-30 30-52z" fill="#36c8ff" ${o}/><path d="M50 10c14 22 30 34 30 52a30 30 0 0 1-60 0c0-18 16-30 30-52z" fill="none" ${k}/><path d="M36 62a14 14 0 0 0 12 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
    S(`<circle cx="50" cy="50" r="40" fill="#ff5a1f" ${o}/><circle cx="50" cy="50" r="40" fill="none" ${k}/><path d="M28 42l10 8-10 8M50 60h22" fill="none" ${k}/>`),
    S(`<path d="M20 30h60v40H44L28 84V70h-8z" fill="#fff" ${o}/><path d="M20 30h60v40H44L28 84V70h-8z" fill="#fff" ${k}/><circle cx="36" cy="50" r="4" fill="#111"/><circle cx="50" cy="50" r="4" fill="#111"/><circle cx="64" cy="50" r="4" fill="#111"/>`),
  ];
  const items = [];
  if (!blue) {
    const n = NV.mobile ? 14 : 24;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div"); el.className = "sticker";
      el.innerHTML = stickers[i % stickers.length];
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.4, rad = 0.32 + Math.random() * 0.22;
      const it = { el, ang, rad, z: 0.5 + Math.random() * 0.9, rot: (Math.random() - 0.5) * 60, spin: (Math.random() - 0.5) * 30, size: (NV.mobile ? 13 : 6.2) * (0.7 + Math.random() * 0.6), ph: Math.random() * 6 };
      el.style.width = el.style.height = it.size + "vw";
      wrap.appendChild(el); items.push(it);
    }
  }
  const bubbles = Array.from({ length: blue ? 0 : 60 }, () => ({ x: Math.random(), y: Math.random(), r: 4 + Math.random() * 14, z: 0.3 + Math.random(), s: Math.random() * 6 }));
  const dots = [];
  if (blue) { const cols = NV.mobile ? 60 : 140, rows = 26; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) dots.push({ i: i / cols + (j % 2) * (0.5 / cols), j: j / rows }); }

  // astronaut in the middle (dark variant on the home page, where the journey ends)
  let astro = null, aR = null, aS = null, aC = null;
  const ac = end.querySelector(".end-astro");
  if (!blue && ac && window.THREE && NV.makeAstronaut && document.documentElement.dataset.page === "home") {
    const T = THREE;
    try { aR = new T.WebGLRenderer({ canvas: ac, antialias: true, alpha: true }); } catch (e) { aR = null; }
    if (aR) {
      aR.setPixelRatio(Math.min(devicePixelRatio, 1.5)); aR.toneMapping = T.ACESFilmicToneMapping; aR.outputColorSpace = T.SRGBColorSpace; aR.setClearColor(0x000000, 0);
      aS = new T.Scene(); aS.environment = NV.makeEnv(aR); NV.studioLights(aS);
      aC = new T.PerspectiveCamera(32, 1, 0.1, 100); aC.position.set(0, 0, 9);
      astro = NV.makeAstronaut(); aS.add(astro);
      const ars = () => { aR.setSize(ac.clientWidth, ac.clientHeight, false); aC.aspect = ac.clientWidth / ac.clientHeight; aC.fov = aC.aspect < 1 ? 50 : 32; aC.updateProjectionMatrix(); };
      ars(); addEventListener("resize", ars);
    }
  }
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(end);
  NV.onTick((dt, now) => {
    if (!visible) return;
    const r = end.getBoundingClientRect();
    const p = range(-r.top, -innerHeight, r.height - innerHeight); // 0 entering → ~0.5 pinned → 1 leaving
    const pin = range(-r.top, 0, r.height - innerHeight);
    const enter = NV.ease.out(range(p, 0.1, 0.45));
    content.style.transform = `translateY(${(1 - enter) * 12}vh) scale(${lerp(0.92, 1, enter)})`;
    content.style.opacity = enter;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (astro) {
      astro.position.set(mouse.x * 0.4, lerp(-1.3, -0.9, enter) - pin * 2.2, 0);
      astro.rotation.set(0.05 + mouse.y * 0.2, Math.sin(now * 0.4) * 0.35 + mouse.x * 0.6, Math.sin(now * 0.5) * 0.05);
      astro.userData.pose(now, 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(now * 0.8)));
      aR.render(aS, aC);
    }
    if (!blue) {
      for (const it of items) {
        const spread = lerp(0.02, 1, E2(enter)) + pin * 0.5;
        const x = W / 2 + Math.cos(it.ang + now * 0.03 * it.z) * W * it.rad * spread * 1.15 + mouse.x * 60 * it.z;
        const y = H / 2 + Math.sin(it.ang + now * 0.03 * it.z) * H * it.rad * spread * 1.1 + mouse.y * 40 * it.z - pin * H * 0.35 * it.z + Math.sin(now + it.ph) * 8;
        const sc = lerp(0.2, 1, enter) * (0.7 + it.z * 0.4);
        it.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${it.rot + now * it.spin * 0.2}deg) scale(${sc})`;
        it.el.style.zIndex = Math.round(it.z * 10);
      }
      for (const b of bubbles) {
        const x = ((b.x + now * 0.005 * b.z + mouse.x * 0.02 * b.z) % 1) * W, y = ((b.y - now * 0.01 * b.z - pin * 0.3 * b.z) % 1 + 1) % 1 * H;
        const rr = b.r * (0.6 + b.z * 0.6) * enter;
        const gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.35, rr * 0.05, x, y, rr);
        gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.35, "rgba(190,210,255,.25)"); gr.addColorStop(0.85, "rgba(140,150,255,.12)"); gr.addColorStop(1, "rgba(255,255,255,.55)");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
    } else {
      g.fillStyle = "#fff";
      for (const d of dots) {
        const x = d.i * W, base = H * 0.62 + d.j * H * 0.5;
        const wave = Math.sin(d.i * 9 + now * 1.2 + d.j * 3) * 26 + Math.sin(d.i * 23 - now * 0.8) * 10 + mouse.y * 30 * d.j;
        const y = base + wave * (0.4 + d.j) - enter * H * 0.12;
        const rr = (0.8 + d.j * 2.6) * (0.6 + 0.4 * Math.sin(d.i * 40 + now * 2 + d.j * 9));
        if (y < H && rr > 0) { g.globalAlpha = 0.35 + d.j * 0.65; g.beginPath(); g.arc(x, y, Math.max(rr, 0.3), 0, Math.PI * 2); g.fill(); }
      }
      g.globalAlpha = 1;
    }
  });
})();
