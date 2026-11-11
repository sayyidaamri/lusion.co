/* Home hero — procedural glossy "jacks" (three hollow tubes) that drift, collide softly and dodge the cursor. */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;
  const T = THREE, NV = window.NV;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(); scene.background = new T.Color(0x111318); scene.fog = new T.Fog(0x111318, 20, 40);
  const camera = new T.PerspectiveCamera(30, 2, 0.1, 100); camera.position.set(0, 0, 24);

  // procedural studio environment (no textures → works from file://)
  const env = new T.Scene();
  const room = new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x0c0d12, side: T.BackSide })); env.add(room);
  const strip = (w, h, x, y, z, ry, rx, c = 0xffffff) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m); };
  strip(14, 2.2, 0, 9, 4, 0, Math.PI / 2, 0xffffff); strip(2.5, 18, -12, 0, 2, Math.PI / 2, 0, 0xdfe4ff); strip(2, 14, 12, 2, -4, -Math.PI / 2, 0, 0x9aa8ff); strip(10, 1.5, 0, -8, 6, 0, -Math.PI / 2, 0x444a66); strip(6, 6, 4, 4, 14, Math.PI, 0, 0xffffff);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.03).texture;
  const key = new T.DirectionalLight(0xffffff, 1.4); key.position.set(-6, 9, 10); scene.add(key);
  scene.add(new T.AmbientLight(0x8890b0, 0.25));

  // hollow tube profile → lathe
  const S = 2.05, ro = 0.62 * S, ri = 0.24 * S, hl = 1.5 * S, bv = 0.14 * S;
  const prof = [];
  const arc = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * (i / 6); prof.push(new T.Vector2(cx + Math.cos(a) * bv, cy + Math.sin(a) * bv)); } };
  prof.push(new T.Vector2(ri, -hl)); arc(ro - bv, -hl + bv, -Math.PI / 2, 0); arc(ro - bv, hl - bv, 0, Math.PI / 2); prof.push(new T.Vector2(ri + 0.02, hl)); prof.push(new T.Vector2(ri, hl - 0.05)); prof.push(new T.Vector2(ri, -hl + 0.05)); prof.push(new T.Vector2(ri, -hl));
  const tube = new T.LatheGeometry(prof, 48);
  tube.computeVertexNormals();
  const mats = [
    new T.MeshPhysicalMaterial({ color: 0xdcdde3, roughness: 0.38, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25, side: T.DoubleSide }),
    new T.MeshPhysicalMaterial({ color: 0x1428ff, roughness: 0.32, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2, side: T.DoubleSide }),
    new T.MeshPhysicalMaterial({ color: 0x040405, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: T.DoubleSide }),
  ];
  const vAsp0 = canvas.clientWidth / Math.max(1, canvas.clientHeight);
  const N = NV.mobile ? 18 : Math.round(34 * Math.max(1, vAsp0 / 1.99));
  const counts = [0, 0, 0];
  const bodies = [];
  for (let i = 0; i < N; i++) {
    const c = i % 5 === 0 ? 2 : i % 2 ? 1 : 0;
    const b = {
      c, idx: counts[c]++,
      p: new T.Vector3((Math.random() - 0.5) * 11 * Math.max(2, vAsp0), (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6 - 2),
      v: new T.Vector3(), q: new T.Quaternion().setFromEuler(new T.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6)),
      w: new T.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4), s: 0, delay: Math.random() * 0.8,
    };
    bodies.push(b);
  }
  const axes = [new T.Quaternion(), new T.Quaternion().setFromEuler(new T.Euler(0, 0, Math.PI / 2)), new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0))];
  const inst = [];
  for (let c = 0; c < 3; c++) { inst[c] = []; for (let a = 0; a < 3; a++) { const m = new T.InstancedMesh(tube, mats[c], counts[c]); m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); inst[c][a] = m; } }

  const mouse = new T.Vector2(9, 9), mWorld = new T.Vector3(99, 99, 0), mPrev = new T.Vector3(99, 99, 0);
  const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
  const hero = document.getElementById("hero"), vis = document.getElementById("hero-visual");
  const ptr = { x: -1, y: -1, px: -1, py: -1, in: false };
  hero.addEventListener("pointermove", (e) => {
    const c = canvas.getBoundingClientRect(); ptr.x = e.clientX - c.left; ptr.y = e.clientY - c.top; ptr.in = true;
    const r = vis.getBoundingClientRect(); const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) mouse.set(9, 9); else mouse.set(u * 2 - 1, -(v * 2 - 1));
  });
  hero.addEventListener("pointerleave", () => { mouse.set(9, 9); dragging = false; ptr.in = false; });
  // gestures: press = radial burst, drag = stronger stir that also spins pieces
  let dragging = false, burst = 0;
  hero.addEventListener("pointerdown", (e) => { if (e.target.closest("a,button")) return; dragging = true; burst = 1; NV.sound.play("click", 0.2); });
  addEventListener("pointerup", () => (dragging = false));

  let visible = true, started = false, t0 = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  addEventListener("load", () => resize());
  const start = () => { started = true; t0 = performance.now() / 1000 - (NV.viaTransition ? 10 : 0); };
  if (NV.isReady) start(); else NV.on("ready", start);

  /* ---- post: scene → render target, cursor fluid (velocity field) drags the image ---- */
  const dprR = renderer.getPixelRatio();
  const sceneRT = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4 });
  const mkF = () => new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
  let fA = mkF(), fB = mkF();
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2)); const qScene = new T.Scene(); qScene.add(quad); const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const VS = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }";
  const fluidMat = new T.ShaderMaterial({ vertexShader: VS, uniforms: { uPrev: { value: null }, uP: { value: new T.Vector2(-9, -9) }, uF: { value: new T.Vector2() }, uAsp: { value: 1 }, uDt: { value: 0.016 }, uR: { value: 0.004 } },
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uPrev; uniform vec2 uP, uF; uniform float uAsp, uDt, uR;
    void main(){ vec2 v0=texture2D(uPrev,vUv).xy; vec2 back=vUv-v0*uDt*.9; vec2 v=texture2D(uPrev,back).xy*exp(-uDt*1.6);
      vec2 d=vUv-uP; d.x*=uAsp; float g=exp(-dot(d,d)/uR); v+=uF*g*1.4; gl_FragColor=vec4(clamp(v,-4.,4.),0.,1.); }` });
  const compMat = new T.ShaderMaterial({ vertexShader: VS, uniforms: { uScene: { value: sceneRT.texture }, uFluid: { value: null }, uRes: { value: new T.Vector2() }, uRect: { value: new T.Vector4() }, uRad: { value: 20 }, uBg: { value: new T.Vector3(240 / 255, 241 / 255, 250 / 255) }, uTime: { value: 0 } },
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uScene, uFluid; uniform vec2 uRes; uniform vec4 uRect; uniform float uRad, uTime; uniform vec3 uBg;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
    float sdRR(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
    vec3 rainbow(float x){ return .5+.5*cos(6.2831*(x+vec3(0.,.33,.67))); }
    void main(){
      vec2 px=vec2(vUv.x, 1.-vUv.y)*uRes;              // css px, top-left origin
      vec2 v=texture2D(uFluid,vUv).xy; v.y=-v.y;        // fluid stored in uv space (y up)
      vec2 off=v*vec2(uRes.x,uRes.y)*.07;               // displacement in px
      vec2 sp=px-off;
      vec2 c=uRect.xy+uRect.zw*.5; float d=sdRR(sp-c, uRect.zw*.5, uRad);
      float inside=smoothstep(1.,-1.,d);
      vec2 suv=(sp-uRect.xy)/uRect.zw; suv.y=1.-suv.y;
      float spd=length(v);
      vec3 s=vec3(texture2D(uScene, suv+vec2(.004,0.)*spd).r, texture2D(uScene, suv).g, texture2D(uScene, suv-vec2(.004,0.)*spd).b);
      vec3 sc=toSRGB(aces(s*1.05));
      sc=mix(sc, sc*.6+vec3(.75)*.4, clamp(spd*.35,0.,.6)*0.6);   // milky smear
      vec3 bg=uBg; float ir=clamp(spd*.6-.05,0.,1.);
      
      gl_FragColor=vec4(mix(bg, sc, inside),1.);
    }` });
  let vRect = { x: 0, y: 0, w: 1, h: 1 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    vRect = { x: 0, y: 0, w: w, h: h }; // layout size: unaffected by the page-transition transform
    sceneRT.setSize(Math.round(vRect.w * dprR), Math.round(vRect.h * dprR));
    fA.setSize(Math.ceil(w / 6), Math.ceil(h / 6)); fB.setSize(Math.ceil(w / 6), Math.ceil(h / 6));
    compMat.uniforms.uRes.value.set(w, h); compMat.uniforms.uRect.value.set(vRect.x, vRect.y, vRect.w, vRect.h);
    compMat.uniforms.uRad.value = 0.5;
    fluidMat.uniforms.uAsp.value = w / h;
    camera.aspect = vRect.w / vRect.h; camera.fov = camera.aspect < 1 ? 50 : 32; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize); if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(canvas);

  const m4 = new T.Matrix4(), qa = new T.Quaternion(), sc = new T.Vector3(), tmp = new T.Vector3(), dq = new T.Quaternion();
  NV.onTick((dt, now) => {
    if (!visible) return;
    const aspect = camera.aspect, bx = aspect < 1 ? 4 : 5.2 * aspect, by = aspect < 1 ? 8 : 5.2;
    if (mouse.x < 5) { ray.setFromCamera(mouse, camera); ray.ray.intersectPlane(plane, mWorld); } else mWorld.set(99, 99, 0);
    const mVel = tmp.copy(mWorld).sub(mPrev); mPrev.copy(mWorld);
    const life = started ? now - t0 : -1;
    for (const b of bodies) {
      // gentle attraction to a central cluster, bounded
      b.v.x += (-b.p.x * 0.3 * 2 / Math.max(1, aspect)) * dt; b.v.y += (-b.p.y * 0.6) * dt; b.v.z += (-(b.p.z + 2) * 0.8) * dt;
      if (Math.abs(b.p.x) > bx) b.v.x -= Math.sign(b.p.x) * 2 * dt; if (Math.abs(b.p.y) > by) b.v.y -= Math.sign(b.p.y) * 2 * dt;
      // cursor push
      const dx = b.p.x - mWorld.x, dy = b.p.y - mWorld.y, d2 = dx * dx + dy * dy;
      if (burst > 0 && d2 < 64) { const l = Math.sqrt(d2) || 1, f = (1 - l / 8) * 28 * burst; b.v.x += (dx / l) * f; b.v.y += (dy / l) * f; b.v.z += f * 0.4; b.w.x += (Math.random() - 0.5) * 6 * burst; b.w.y += (Math.random() - 0.5) * 6 * burst; }
      if (d2 < (dragging ? 30 : 16)) { const f = (1 - Math.sqrt(d2) / (dragging ? 5.5 : 4)) * (dragging ? 30 : 18) * dt; const l = Math.sqrt(d2) || 1; b.v.x += (dx / l) * f + mVel.x * 0.4; b.v.y += (dy / l) * f + mVel.y * 0.4; b.v.z += f * 0.3; b.w.x += mVel.y * 0.25; b.w.y -= mVel.x * 0.25; }
    }
    burst = 0;
    // keep the cluster centred in the frame (no drift to one side)
    let cx = 0, cy = 0; for (const b of bodies) { cx += b.p.x; cy += b.p.y; } cx /= bodies.length; cy /= bodies.length;
    for (const b of bodies) { b.p.x -= cx * Math.min(1, dt * 2.5); b.p.y -= cy * Math.min(1, dt * 2.5); }
    // soft collisions
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j]; const dx = b.p.x - a.p.x, dy = b.p.y - a.p.y, dz = b.p.z - a.p.z; const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < 20 && d2 > 1e-4) { const d = Math.sqrt(d2), f = (4.5 - d) * 9 * dt; const nx = dx / d, ny = dy / d, nz = dz / d; a.v.x -= nx * f; a.v.y -= ny * f; a.v.z -= nz * f; b.v.x += nx * f; b.v.y += ny * f; b.v.z += nz * f; }
    }
    for (const b of bodies) {
      b.v.multiplyScalar(Math.pow(0.35, dt)); b.w.multiplyScalar(Math.pow(0.7, dt));
      b.w.x += (Math.random() - 0.5) * 0.02; b.w.y += (Math.random() - 0.5) * 0.02;
      b.p.addScaledVector(b.v, dt);
      const ang = b.w.length() * dt + 0.05 * dt; if (ang > 0) { dq.setFromAxisAngle(tmp.copy(b.w).add(new T.Vector3(0.3, 0.2, 0.1)).normalize(), ang); b.q.premultiply(dq); }
      const target = life < 0 ? 0 : NV.ease.out(NV.clamp((life - b.delay) / 1.2));
      b.s = target;
      for (let a = 0; a < 3; a++) { qa.copy(b.q).multiply(axes[a]); sc.setScalar(b.s); m4.compose(b.p, qa, sc); inst[b.c][a].setMatrixAt(b.idx, m4); }
    }
    for (const row of inst) for (const m of row) m.instanceMatrix.needsUpdate = true;
    camera.position.x = NV.lerp(camera.position.x, (mouse.x < 5 ? mouse.x : 0) * 0.6, 0.04);
    camera.position.y = NV.lerp(camera.position.y, (mouse.x < 5 ? mouse.y : 0) * 0.4, 0.04);
    camera.lookAt(0, 0, 0);
    renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
    // fluid step
    const W = compMat.uniforms.uRes.value.x, H = compMat.uniforms.uRes.value.y;
    const fu = fluidMat.uniforms; fu.uPrev.value = fA.texture; fu.uDt.value = dt;
    if (ptr.in && ptr.px >= 0) { const dx = (ptr.x - ptr.px) / W, dy = -(ptr.y - ptr.py) / H; fu.uP.value.set(ptr.x / W, 1 - ptr.y / H); fu.uF.value.set(dx * (dragging ? 9 : 5) / Math.max(dt, 0.008) * 0.12, dy * (dragging ? 9 : 5) / Math.max(dt, 0.008) * 0.12); }
    else fu.uF.value.set(0, 0);
    fu.uR.value = dragging ? 0.006 : 0.0035;
    ptr.px = ptr.in ? ptr.x : -1; ptr.py = ptr.y;
    quad.material = fluidMat; renderer.setRenderTarget(fB); renderer.render(qScene, qCam); [fA, fB] = [fB, fA];
    quad.material = compMat; compMat.uniforms.uFluid.value = fA.texture; compMat.uniforms.uTime.value = now;
    renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  });
})();
