/* Home: reel (cloth-warped duotone thumbnail → full reel), snake lines, goal tablet → 3D astronaut journey. */
(function () {
  const NV = window.NV, { $, $$, clamp, lerp, range } = NV;
  const E = NV.ease;
  const px = () => (NV.mobile ? 16 : Math.max(innerWidth * 0.05, 40));
  const docTop = (el) => el.getBoundingClientRect().top + scrollY;

  /* ======================= SNAKE LINES ======================= */
  // A tube of constant length that slides along a path as you scroll (head leads, tail follows).
  function snake(svg, buildPath, from, to, segFrac) {
    const paths = $$("path", svg); let L = 0;
    const rebuild = () => { const d = buildPath(); paths.forEach((p) => p.setAttribute("d", d)); L = paths[0].getTotalLength(); };
    rebuild(); addEventListener("resize", rebuild); addEventListener("load", rebuild); NV.on("settled", rebuild);
    NV.onTick(() => {
      const r = svg.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const p = range(innerHeight - r.top, from(r), to(r));
      const S = L * segFrac, head = p * (L + S);
      paths.forEach((pa) => { pa.style.strokeDasharray = `${S} ${L + S}`; pa.style.strokeDashoffset = S - head; });
    });
    return rebuild;
  }
  const reel = $("#reel"), slot = $("#reel-thumb-slot");
  const reelSvg = $("#reel-line");
  if (reelSvg && reel) {
    snake(reelSvg, () => {
      const W = reel.clientWidth, H = reel.clientHeight; reelSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const s = slot.getBoundingClientRect(), r0 = reel.getBoundingClientRect();
      const sx = s.left - r0.left, sy = s.top - r0.top, sw = s.width, sh = s.height;
      const k = W / 1440;
      // starts just under the hero at the left edge, sweeps in, drops down and coils around the thumbnail
      return `M ${-60} ${40 * k} C ${220 * k} ${40 * k}, ${330 * k} ${sy * 0.25}, ${300 * k} ${sy * 0.6} S ${120 * k} ${sy - 140 * k}, ${sx + sw * 0.25} ${sy - 30 * k}`
        + ` S ${sx + sw + 60 * k} ${sy + sh * 0.1}, ${sx + sw * 0.9} ${sy + sh * 0.75}`
        + ` S ${sx - 40 * k} ${sy + sh + 40 * k}, ${sx - 20 * k} ${sy + sh * 0.4}`
        + ` S ${sx + sw * 0.6} ${sy - 140 * k}, ${W * 0.62} ${sy - 40 * k}`
        + ` S ${W * 0.8} ${sy + sh * 0.6}, ${W * 0.9} ${sy + sh * 0.3}`
        + ` S ${W + 30 * k} ${sy + 20 * k}, ${W * 0.97} ${sy + sh * 1.2}`
        + ` S ${W * 0.85} ${sy + sh * 2.4}, ${W + 120 * k} ${sy + sh * 3}`;
    }, () => innerHeight * 0.1, (r) => r.height * 0.95 + innerHeight, 0.5);
  }
  const goal = $("#goal"), goalSvg = $("#goal-line"), gtitle = $("#goal-title");
  if (goalSvg && goal) {
    snake(goalSvg, () => {
      const box = $("#goal-intro"); const W = box.clientWidth + 2 * px(), H = box.clientHeight; goalSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const t = gtitle.getBoundingClientRect(), b0 = box.getBoundingClientRect(); const k = W / 1440;
      const ty = t.top - b0.top, th = t.height, tw = t.width;
      return `M ${W + 40} ${ty - 260 * k} C ${W * 0.7} ${ty - 300 * k}, ${W * 0.55} ${ty - 120 * k}, ${W * 0.42} ${ty - 160 * k}`
        + ` S ${W * 0.2} ${ty - 300 * k}, ${tw * 0.58} ${ty + th * 0.45}`
        + ` S ${tw * 0.78} ${ty + th * 1.05}, ${tw * 0.92} ${ty + th * 0.55}`
        + ` S ${tw * 0.95} ${ty - 80 * k}, ${W * 0.78} ${ty + th * 0.35}`
        + ` S ${W * 0.62} ${ty + th * 1.6}, ${W * 0.88} ${ty + th * 2.1}`
        + ` S ${W + 60} ${ty + th * 2.6}, ${W * 0.7} ${H + 80}`;
    }, () => innerHeight * 0.1, (r) => r.height * 0.75, 0.5);
  }

  /* ======================= REEL ======================= */
  const frame = $("#reel-frame"), stage = $("#reel-stage"), rc = $("#reel-canvas"), rplay = $("#reel-play"), rbtn = $("#reel-btn"), title1 = $(".reel-l1 > span");
  const video = $("#reel-src");
  const rcontent = $("#reel-content");
  const g = rc && rc.getContext("2d");
  let dpr = Math.min(devicePixelRatio, 1.5), RW = 0, RH = 0;
  const rsz = () => { if (!rc) return; RW = innerWidth; RH = innerHeight; rc.width = RW * dpr; rc.height = RH * dpr; };
  rsz(); addEventListener("resize", rsz);
  if (frame) {
    frame.addEventListener("click", () => NV.openVideo && NV.openVideo());
    frame.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); NV.openVideo(); } });
    new IntersectionObserver(([e]) => { if (e.isIntersecting) video.play().catch(() => {}); else video.pause(); }, { rootMargin: "300px" }).observe(stage);
  }
  const P = (x, y) => ({ x, y }), LP = (a, b, t) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  function drawReel(c, curveTop, curveBot, duo, alpha) {
    const N = NV.mobile ? 28 : 56;
    const edge = (u, top) => { const a = top ? LP(c.tl, c.tr, u) : LP(c.bl, c.br, u); const k = Math.sin(Math.PI * u); a.y += (top ? curveTop : curveBot) * k; return a; };
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, RW, RH);
    g.globalAlpha = alpha;
    // clip path with rounded-ish corners
    g.beginPath(); const R = 15;
    for (let i = 0; i <= N; i++) { const p = edge(i / N, true); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y + R); if (!i) g.quadraticCurveTo(p.x, p.y, p.x + R, p.y); }
    for (let i = N; i >= 0; i--) { const p = edge(i / N, false); g.lineTo(p.x, p.y); }
    g.closePath(); g.clip();
    const ready = video && video.readyState >= 2 && video.videoWidth;
    if (ready) {
      const vw = video.videoWidth, vh = video.videoHeight, aspect = (c.final.w / c.final.h);
      let cw = vw, ch = vw / aspect; if (ch > vh) { ch = vh; cw = vh * aspect; }
      const cx = (vw - cw) / 2, cy = (vh - ch) / 2, sw = cw / N;
      for (let i = 0; i < N; i++) {
        const t0 = edge(i / N, true), t1 = edge((i + 1) / N, true), b0 = edge(i / N, false);
        g.setTransform(dpr * (t1.x - t0.x) / sw, dpr * (t1.y - t0.y) / sw, dpr * (b0.x - t0.x) / ch, dpr * (b0.y - t0.y) / ch, dpr * t0.x, dpr * t0.y);
        g.drawImage(video, cx + i * sw, cy, sw * 1.04, ch, 0, 0, sw * 1.04, ch);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else { g.fillStyle = "#3a4bff"; g.fillRect(0, 0, RW, RH); }
    if (duo > 0.002) {
      g.globalCompositeOperation = "color"; g.globalAlpha = alpha * duo; g.fillStyle = "#2f43ff"; g.fillRect(0, 0, RW, RH);
      g.globalCompositeOperation = "screen"; g.globalAlpha = alpha * duo * 0.85; g.fillStyle = "#5a6aff"; g.fillRect(0, 0, RW, RH);
      g.globalCompositeOperation = "source-over";
    }
    g.restore();
  }
  NV.onTick(() => {
    if (!reel || !rc) return;
    const vw = innerWidth, vh = innerHeight, s = slot.getBoundingClientRect(), st = stage.getBoundingClientRect();
    if (st.bottom < -50 && s.bottom < -50) return;
    // line 1 "Bold Ideas," glides into its indent as the section scrolls in
    if (title1 && !NV.mobile) { const tr = reel.getBoundingClientRect(); title1.parentElement.style.setProperty("--ind", E.out(range(vh - tr.top, vh * 0.05, vh * 0.85))); }
    const fw = vw - 2 * px(), fh = NV.mobile ? Math.min(fw * 1.25, vh * 0.62) : fw * 0.5;
    const F = { l: px(), t: (vh - fh) / 2, w: fw, h: fh };

    // 1) the thumbnail scrolls in, then sticks (vertically centred) while the text on the right scrolls up past it
    // 2) once the text has passed above the thumbnail, the thumbnail starts to grow from its sticky spot
    // 3) PLAY / REEL appear only after the frame is fully expanded
    const cr = rcontent.getBoundingClientRect();
    const Ts = (vh - s.height) / 2;
    const slotDoc = s.top + scrollY;
    const stickAt = NV.mobile ? Infinity : slotDoc - Ts;
    const releaseAt = NV.mobile ? slotDoc - vh * 0.12 : Math.max(stickAt, cr.bottom + scrollY - Ts + 20);
    const thumbTop = scrollY >= stickAt ? Ts : s.top;
    const expandEnd = releaseAt + vh * 1.0, playEnd = expandEnd + vh * 0.45;
    // make sure the pinned stage lasts long enough: grow the section's bottom padding if needed
    const reelDoc = reel.getBoundingClientRect().top + scrollY;
    const need = playEnd + vh * 0.6 + vh - reelDoc;
    const pad = parseFloat(reel.style.paddingBottom) || parseFloat(getComputedStyle(reel).paddingBottom);
    const delta = need - reel.offsetHeight;
    if (Math.abs(delta) > 4) { reel.style.paddingBottom = Math.max(0, pad + delta) + "px"; NV.measure && NV.measure(); }
    const raw = range(scrollY, releaseAt, expandEnd);
    const S = { l: s.left, t: thumbTop - st.top, w: s.width, h: s.height };
    const playP = range(scrollY, expandEnd, playEnd);
    const cp = (lead, delay) => E.io(clamp((raw - delay) * lead));
    const pTR = cp(1.55, 0), pBR = cp(1.35, 0.06), pTL = cp(1.2, 0.12), pBL = cp(1.12, 0.16);
    const corner = (sx, sy, fx, fy, p) => P(lerp(sx, fx, p), lerp(sy, fy, p));
    const c = {
      tl: corner(S.l, S.t, F.l, F.t, pTL), tr: corner(S.l + S.w, S.t, F.l + F.w, F.t, pTR),
      bl: corner(S.l, S.t + S.h, F.l, F.t + F.h, pBL), br: corner(S.l + S.w, S.t + S.h, F.l + F.w, F.t + F.h, pBR), final: F,
    };
    const bend = Math.sin(Math.PI * clamp(raw * 1.05)) * (NV.mobile ? 0.5 : 1);
    const all = Math.min(pTL, pBL, pTR, pBR);
    drawReel(c, bend * fh * 0.12, -bend * fh * 0.05 + bend * fh * 0.08, 1 - range(raw, 0.45, 0.85), 1);
    // hit area = current bounding box
    const minx = Math.min(c.tl.x, c.bl.x), maxx = Math.max(c.tr.x, c.br.x), miny = Math.min(c.tl.y, c.tr.y), maxy = Math.max(c.bl.y, c.br.y);
    const fs = frame.style; fs.left = minx + "px"; fs.top = miny + "px"; fs.width = maxx - minx + "px"; fs.height = maxy - miny + "px";
    fs.setProperty("--deco", NV.mobile ? 1 : range(all, 0.85, 1));
    // PLAY / REEL rise into the centre only after the frame is fully expanded, then the button pops in
    const cy = F.t + F.h / 2 + (1 - E.out(range(playP, 0, 0.7))) * F.h * 0.35;
    rplay.style.transform = `translate(-50%, -50%) translate(${vw / 2}px, ${cy}px)`;
    rplay.style.opacity = range(playP, 0, 0.35);
    rplay.style.setProperty("--gap", lerp(1, 0, E.io(range(playP, 0.25, 0.85))));
    rbtn.style.transform = `scale(${E.out(range(playP, 0.55, 1))})`;
    rplay.classList.toggle("is-hover", frame.matches(":hover"));
  });

  /* ======================= GOAL → TUNNEL ======================= */
  const tslot = $("#goal-tablet-slot"), tablet = $("#tunnel-tablet"), tstage = $("#tunnel-stage"), canvas = $("#tunnel-canvas");
  const title = $("#tunnel-title"), flash = $("#tunnel-flash"), monitor = $("#tunnel-monitor");
  if (!goal || !window.THREE) return;
  const T = THREE;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, NV.mobile ? 1 : 1.25));
  renderer.autoClear = false; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
  const bgScene = new T.Scene(), ortho = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const U = { uTime: { value: 0 }, uProg: { value: 0 }, uRes: { value: new T.Vector2(1, 1) }, uMouse: { value: new T.Vector2() }, uPre: { value: 0 } };
  const bgMat = new T.ShaderMaterial({
    uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }",
    fragmentShader: `
precision highp float;
uniform float uTime, uProg, uPre; uniform vec2 uRes, uMouse; varying vec2 vUv;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n=h21(p); return vec2(n, h21(p+n)); }
float band(float t,float a,float b,float s){ return smoothstep(a-s,a,t)*(1.-smoothstep(b,b+s,t)); }
vec3 rainbow(float x){ return .5+.5*cos(6.2831*(x+vec3(0.,.33,.67))); }
float vedge(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y); vec2 o=h22(i+g); o=.5+.42*sin(uTime*.5+6.2831*o); float d=length(g+o-f); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
  return d2-d1; }
vec3 box(vec2 uv, float s){ float ax=abs(uv.x)*.8, ay=abs(uv.y); float rb=max(ax,ay); float z=s/max(rb,.003);
  float side=ax>ay?(uv.x>0.?0.:2.):(uv.y>0.?1.:3.); float along=ax>ay? uv.y/max(ax,1e-3) : uv.x*.8/max(ay,1e-3); return vec3(along,z,side); }
float lattice(vec2 uv, float scale, float travel, float w, out vec2 cellOut){
  vec3 b=box(uv,scale); vec2 tc=vec2(b.x*2.+b.z*11., b.y+travel); cellOut=floor(tc);
  vec2 f=fract(tc); float e=min(min(f.x,1.-f.x),min(f.y,1.-f.y)); float l=smoothstep(w,0.,e)*exp(-b.y*.08);
  float diag=smoothstep(w*.8,0.,abs(f.x-f.y))*step(.6,h21(cellOut))*exp(-b.y*.08);
  return l+diag*.6; }
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y; uv+=uMouse*.02;
  float t=uProg, r=length(uv), a=atan(uv.y,uv.x), travel=uTime*.2+t*30.;
  vec3 col=vec3(0.);
  // ---- space + earth horizon (seen in the tablet, then left behind)
  float space=1.-smoothstep(.12,.2,t);
  vec2 sg=floor(uv*240.); col+=space*step(.996,h21(sg))*(.35+.65*sin(uTime*2.+h21(sg+3.)*30.));
  float er=1.35, drop=smoothstep(0.,.1,t)*1.2;
  vec2 ec=vec2(-.35,-1.62-drop); float ed=length(uv-ec)-er;
  float earth=smoothstep(.003,-.003,ed);
  vec3 ecol=mix(vec3(.01,.03,.09),vec3(.05,.15,.38),smoothstep(-.25,0.,ed))+smoothstep(-.05,0.,ed)*vec3(.2,.45,1.)*.6;
  col=mix(col,ecol,earth*space); col+=space*exp(-max(ed,0.)*28.)*vec3(.25,.5,1.)*.9*(1.-earth);
  // ---- rainbow lens ring
  float ringOn=smoothstep(.06,.14,t)*(1.-smoothstep(.62,.66,t));
  float ring=exp(-pow((r-.46)*9.,2.))*.55+exp(-pow((r-.46)*22.,2.))*.4;
  col+=ringOn*ring*rainbow(a/6.2831+r*2.+uTime*.02)*.32;
  // ---- scaffold tunnel (two lattice layers)
  float tun=smoothstep(.17,.23,t)*(1.-smoothstep(.5,.54,t));
  vec2 c1,c2; float l1=lattice(uv,.32,travel,.035,c1), l2=lattice(uv*1.0,.18,travel*1.3+3.,.05,c2);
  vec3 tint=vec3(.85,.9,1.);
  tint=mix(tint,mix(vec3(1.,.2,.3),vec3(.2,1.,.9),step(.5,h21(c1+7.))),smoothstep(.28,.32,t));
  tint=mix(tint,mix(vec3(.3,1.,.4),vec3(1.,.9,.2),step(.5,h21(c1+2.))),smoothstep(.38,.42,t));
  vec3 bb=box(uv,.32); vec2 gf=fract(vec2(bb.x*2.+bb.z*11., bb.y+travel)*vec2(6.,8.)); float glint=step(.93,h21(c1+floor(uTime*3.)))*step(.97,h21(floor(vec2(bb.x*2.+bb.z*11., bb.y+travel)*vec2(6.,8.))+floor(uTime*6.)))*exp(-bb.y*.05);
  float glint2=step(.9,h21(c2+floor(uTime*4.+.5)))*.25;
  vec3 tcol=(l1*.9+l2*.35)*mix(vec3(.75,.8,.9),tint,.6)+glint*tint*2.4+glint2*tint*.7*exp(-box(uv,.18).y*.05);
  tcol+=tint*.25*exp(-r*3.);
  col=mix(col,tcol,tun);
  // ---- crystal web (pink/cyan)
  float cry=band(t,.53,.62,.03);
  float rr=.22/max(r,.003); vec2 pc=vec2(a/6.2831*7., rr+travel*.45);
  float e=vedge(pc*vec2(1.,.6)); float web=smoothstep(.1,0.,e), web2=smoothstep(.025,0.,e);
  vec3 ccol=mix(vec3(.12,.02,.06),vec3(.45,.05,.2),exp(-rr*.07));
  ccol+=web*mix(vec3(1.,.3,.6),vec3(.4,.9,1.),step(.5,h21(floor(pc*vec2(1.,.6)))))*exp(-rr*.05)*1.3+web2*exp(-rr*.05);
  ccol+=exp(-r*4.)*vec3(1.,.55,.85);
  col=mix(col,ccol,cry);
  // ---- blue room with arches + round cut-outs
  float blue=smoothstep(.66,.7,t);
  vec3 b=box(uv,.34); vec2 bt=vec2(b.x*1.6+b.z*5., b.y*.5+travel*.22);
  vec2 bf=fract(bt)-.5, bid=floor(bt);
  float rad=.16+.16*h21(bid); float hole=smoothstep(rad+.015,rad,length(bf+(h22(bid)-.5)*.3));
  float arch=step(.55,h21(bid+5.))*smoothstep(.02,0.,abs(length(vec2(bf.x,max(bf.y,0.)))-.32)-.06);
  float bfog=exp(-b.y*.05);
  vec3 bcol=vec3(.06,.13,1.)*(.5+.5*bfog);
  bcol=mix(bcol,vec3(.88,.9,1.)*bfog+vec3(.08,.12,.6)*(1.-bfog),max(hole,arch));
  bcol+=vec3(.65,.75,1.)*smoothstep(.45,0.,r)*.35;
  col=mix(col,bcol,blue);
  col*=1.-smoothstep(.925,.96,t);            // monitor shattered -> black void
  col*=1.-.5*smoothstep(.45,1.15,r);           // vignette
  col+=(h21(gl_FragCoord.xy+uTime)-.5)*.03;    // grain
  gl_FragColor=vec4(col,1.);
}`,
  });
  bgScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), bgMat));

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(35, 1, 0.1, 200); cam.position.set(0, 0, 9);
  scene.environment = NV.makeEnv(renderer);
  const lights = NV.studioLights(scene);
  const astro = NV.makeAstronaut(); scene.add(astro);
  // glass shards for the monitor break
  const shards = []; const shardGroup = new T.Group(); scene.add(shardGroup);
  const shardMats = [0x6f8bff, 0x45e0ff, 0x9a6bff, 0xc9d4ff].map((c) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6, side: T.DoubleSide, clearcoat: 1, envMapIntensity: 2.5 }));
  for (let i = 0; i < (NV.mobile ? 50 : 110); i++) {
    const s = 0.15 + Math.random() * 0.55; const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute([0, 0, 0, s * (0.6 + Math.random()), s * (Math.random() - 0.5), 0, s * (Math.random() - 0.3), s * (0.6 + Math.random()), 0], 3)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, shardMats[i % 4]);
    const start = new T.Vector3((Math.random() - 0.5) * 7.2, (Math.random() - 0.5) * 4.2, -1.5);
    const vel = new T.Vector3(start.x * 0.9 + (Math.random() - 0.5) * 3, start.y * 0.9 + (Math.random() - 0.5) * 3, 6 + Math.random() * 9);
    shards.push({ m, start, vel, rot: new T.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), spin: new T.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8) });
    m.visible = false; shardGroup.add(m);
  }
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); U.uRes.value.set(canvas.width, canvas.height); cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 1 ? 55 : 35; cam.updateProjectionMatrix(); };
  resize(); addEventListener("resize", resize);
  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = 0.5 - e.clientY / innerHeight; });

  let lastT = 0, played = {};
  const words = $$(".tw", title);
  NV.onTick((dt, now) => {
    const vw = innerWidth, vh = innerHeight, gr = goal.getBoundingClientRect();
    if (gr.bottom < 0 || gr.top > vh * 1.2) { NV.forceDark = false; return; }
    const s = tslot.getBoundingClientRect(), st = tstage.getBoundingClientRect();
    const pA = E.io(range(vh * 0.55 - s.top, 0, vh * 1.15));
    const ov = 0.06, full = { l: -vw * ov, t: -vh * ov, w: vw * (1 + 2 * ov), h: vh * (1 + 2 * ov) };
    const L = lerp(s.left, full.l, pA), Tt = lerp(s.top - st.top, full.t, pA), W = lerp(s.width, full.w, pA), H = lerp(s.height, full.h, pA);
    tablet.style.left = L + "px"; tablet.style.top = Tt + "px"; tablet.style.width = W + "px"; tablet.style.height = H + "px";
    // canvas shows through the tablet screen only, until the tablet has swallowed the viewport
    const bez = Math.min(W, H) * 0.035, rad = Math.min(W, H) * 0.045;
    tablet.style.borderWidth = bez + "px"; tablet.style.borderRadius = rad + bez + "px";
    const cl = { t: Tt + bez, l: L + bez, r: vw - (L + W - bez), b: vh - (Tt + H - bez) };
    canvas.style.clipPath = pA >= 1 ? "none" : `inset(${cl.t}px ${cl.r}px ${cl.b}px ${cl.l}px round ${rad}px)`;
    const startDoc = docTop(tslot) - vh * 0.55 + vh * 1.15, endDoc = gr.bottom + scrollY - vh;
    const t = range(scrollY, startDoc, endDoc);
    tablet.style.opacity = 1 - range(t, 0, 0.02);
    NV.forceDark = pA > 0.85 && t < 1;
    // words: appear, then spread apart and grow past the camera
    const tin = range(t, 0.03, 0.07), tout = range(t, 0.09, 0.2);
    title.style.opacity = tin * (1 - range(t, 0.18, 0.22));
    title.style.setProperty("--spread", (Math.pow(tout, 1.5) * 3.4).toFixed(3));
    title.style.transform = `translateY(-50%) scale(${1 + Math.pow(tout, 2.2) * 4})`;
    words.forEach((w, i) => { w.style.opacity = (1 - range(tout, 0.35 + (i % 4) * 0.1, 0.85)) * (i === 6 ? 1 : 1); w.style.transform = `translateY(${(1 - E.out(range(tin, (i % 5) * 0.08, 0.6 + (i % 5) * 0.08))) * 60}px)`; });
    flash.style.opacity = Math.max(range(t, 0.6, 0.655) * (1 - range(t, 0.67, 0.72)), 0);
    const mz = range(t, 0.84, 0.9);
    monitor.style.opacity = range(t, 0.835, 0.85) * (1 - range(t, 0.915, 0.94));
    monitor.style.setProperty("--ms", lerp(3.4, 1, E.io(mz)));
    monitor.style.setProperty("--mr", (1 - E.io(mz)) * -6 + "deg");
    // ---- astronaut choreography
    const tt = now;
    let z, y = -0.35, sc = 1, spread = 0.9, rotY = Math.sin(tt * 0.3) * 0.3, rotX = 0;
    if (t < 0.02) { z = 0; y = -0.55; }
    else if (t < 0.22) { const k = E.inOutSine(range(t, 0.02, 0.22)); z = lerp(0, -60, k); y = lerp(-0.55, 0, k); }
    else if (t < 0.66) { z = -60; y = Math.sin(tt * 0.8) * 0.4; rotX = 0.5; }
    else if (t < 0.84) { const k = E.io(range(t, 0.66, 0.84)); z = lerp(-60, -6, k); y = lerp(0, -0.2, k); rotX = lerp(0.5, 0.15, k); }
    else if (t < 0.94) { const k = E.inOutSine(range(t, 0.84, 0.94)); z = lerp(-6, 3.2, k); y = lerp(-0.2, -1.4, k); spread = 1; rotY *= 0.3; }
    else { const k = E.out(range(t, 0.94, 1)); z = lerp(3.2, -1, k); y = lerp(-1.4, -1.1, k); spread = lerp(1, 0.2, k); }
    astro.position.set(Math.sin(tt * 0.5) * 0.15, y, z); astro.rotation.set(rotX + Math.sin(tt * 0.6) * 0.06, rotY, Math.sin(tt * 0.45) * 0.08);
    astro.userData.pose(tt, spread);
    // lighting follows the phases
    const blueOn = range(t, 0.66, 0.72);
    lights.key.color.setRGB(lerp(1, 0.75, blueOn), lerp(1, 0.8, blueOn), 1); lights.rim.intensity = lerp(1.2, 2.4, blueOn);
    // shards
    const sp = range(t, 0.9, 1);
    shards.forEach((sh) => { sh.m.visible = sp > 0 && sp < 1; if (!sh.m.visible) return; const k = sp * 1.1; sh.m.position.copy(sh.start).addScaledVector(sh.vel, k); sh.m.rotation.set(sh.rot.x + sh.spin.x * k, sh.rot.y + sh.spin.y * k, sh.rot.z + sh.spin.z * k); });
    // sounds
    const cross = (v, key, name) => { if (t > v && lastT <= v && !played[key]) { NV.sound.play(name); played[key] = 1; } if (t < v - 0.04) played[key] = 0; };
    cross(0.09, "tun", "tunnel"); cross(0.53, "gl", "slide"); cross(0.905, "br", "glass");
    lastT = t;
    cam.position.x = lerp(cam.position.x, mouse.x * 0.6, 0.05); cam.position.y = lerp(cam.position.y, mouse.y * 0.4, 0.05); cam.lookAt(0, 0, -4);
    U.uMouse.value.set(mouse.x, mouse.y); U.uTime.value = now; U.uProg.value = t;
    renderer.clear(); renderer.render(bgScene, ortho); renderer.clearDepth(); renderer.render(scene, cam);
  });
})();
