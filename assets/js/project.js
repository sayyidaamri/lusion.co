/* Project detail: vertical scroll drives a horizontal media rail ending in a "Next project" panel. */
(function () {
  const NV = window.NV, { $, $$, clamp, lerp, range } = NV;
  const pin = $("#pd-pin"), track = $("#pd-track"), meta = $("#pd-meta"), hint = $("#pd-hint"), stage = $("#pd-stage");
  const items = $$(".pd-item", track), vids = $$("video", track);
  let maxShift = 0;
  function layout() {
    if (NV.mobile) { pin.style.height = ""; maxShift = 0; return; }
    const startLeft = track.offsetLeft;
    maxShift = Math.max(0, startLeft + track.scrollWidth - innerWidth);
    pin.style.height = innerHeight + maxShift * 1.0 + "px";
    NV.measure && NV.measure();
  }
  layout(); addEventListener("resize", layout); addEventListener("load", layout);
  $$("img", track).forEach((im) => im.addEventListener("load", layout));
  vids.forEach((v) => v.addEventListener("loadedmetadata", layout));
  const io = new IntersectionObserver((ents) => ents.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.1 });
  vids.forEach((v) => io.observe(v));
  // drag the rail with the mouse (maps horizontal drag to page scroll)
  let drag = null;
  track.addEventListener("pointerdown", (e) => { if (NV.mobile || e.pointerType === "touch" || e.button !== 0 || e.target.closest("a")) return; drag = { x: e.clientX, y0: NV.scroll.target, moved: 0 }; track.classList.add("is-drag"); e.preventDefault(); });
  addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx)); NV.scroll.to(drag.y0 - dx * 1.4); });
  addEventListener("pointerup", () => { if (drag) { track.classList.remove("is-drag"); drag = null; } });
  track.addEventListener("dragstart", (e) => e.preventDefault());
  let lastIdx = -1;
  NV.onTick(() => {
    if (NV.mobile) return;
    const r = pin.getBoundingClientRect();
    const p = range(-r.top, 0, Math.max(1, r.height - innerHeight));
    const tx = -p * maxShift;
    track.style.setProperty("--tx", tx + "px");
    meta.style.setProperty("--mx", tx * 0.35 + "px");
    const mo = 1 - range(-tx, innerWidth * 0.12, innerWidth * 0.42);
    meta.style.setProperty("--mo", mo); hint.style.setProperty("--mo", 1 - range(p, 0.02, 0.1));
    let idx = 0;
    items.forEach((it, i) => {
      const b = it.getBoundingClientRect(); const c = (b.left + b.width / 2) / innerWidth - 0.5;
      it.firstElementChild.style.setProperty("--par", (-c * 6).toFixed(2) + "%");
      if (b.left < innerWidth * 0.5) idx = i;
    });
    if (idx !== lastIdx) { if (lastIdx !== -1) NV.sound.play("slide", 0.15); lastIdx = idx; }
  });
})();
