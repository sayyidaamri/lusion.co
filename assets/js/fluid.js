/* Page-wide cursor fluid: a milky, iridescent smear that lives BEHIND every section (on the light page background).
   Small stable-fluids style sim (velocity + dye advection) on half-float targets, rendered to a fixed canvas. */
(function () {
  const NV = window.NV; if (!window.THREE || NV.touch || NV.reduced) return;
  const b = document.body;
  if (b.classList.contains("theme-project")) return;
  const DARK = b.classList.contains("theme-dark");
  const T = THREE;
  const canvas = document.createElement("canvas"); canvas.id = "bg-fluid"; canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas); if (DARK) canvas.classList.add("is-dark");
  let renderer; try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: false }); } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = T.LinearSRGBColorSpace;
  const SC = 0.5; // sim resolution
  const mk = () => new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
  let vel = [mk(), mk()], dye = [mk(), mk()];
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2)); const qs = new T.Scene(); qs.add(quad); const qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const VS = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }";
  const splatU = { uSrc: { value: null }, uVel: { value: null }, uP: { value: new T.Vector2(-9, -9) }, uF: { value: new T.Vector3() }, uAsp: { value: 1 }, uDt: { value: 0.016 }, uR: { value: 0.002 }, uDiss: { value: 1 }, uScroll: { value: 0 }, uTexel: { value: new T.Vector2() } };
  const advect = new T.ShaderMaterial({ vertexShader: VS, uniforms: splatU, fragmentShader: `
    precision highp float; varying vec2 vUv; uniform sampler2D uSrc, uVel; uniform vec2 uP, uTexel; uniform vec3 uF; uniform float uAsp, uDt, uR, uDiss, uScroll;
    void main(){
      vec2 uv=vUv+vec2(0.,uScroll);                     // content scrolls -> smear scrolls with the page
      vec2 v=texture2D(uVel,uv).xy;
      // a little curl so the trail breaks into wisps
      float l=texture2D(uVel,uv-vec2(uTexel.x,0.)).y, r=texture2D(uVel,uv+vec2(uTexel.x,0.)).y, d=texture2D(uVel,uv-vec2(0.,uTexel.y)).x, u=texture2D(uVel,uv+vec2(0.,uTexel.y)).x;
      float curl=(r-l)-(u-d);
      vec2 back=uv-v*uDt; float inb=step(0.,back.y)*step(back.y,1.)*step(0.,back.x)*step(back.x,1.); vec4 c=texture2D(uSrc,back)*uDiss*inb;
      vec2 dd=vUv-uP; dd.x*=uAsp; float g=exp(-dot(dd,dd)/uR);
      c.xyz+=uF*g;
      c.xy+=vec2(-curl, curl)*.0;  // (velocity pass gets curl added below via uF.z sign trick)
      gl_FragColor=c;
    }` });
  const vort = new T.ShaderMaterial({ vertexShader: VS, uniforms: { uVel: { value: null }, uTexel: splatU.uTexel, uDt: splatU.uDt }, fragmentShader: `
    precision highp float; varying vec2 vUv; uniform sampler2D uVel; uniform vec2 uTexel; uniform float uDt;
    float C(vec2 p){ return texture2D(uVel,p+vec2(uTexel.x,0.)).y-texture2D(uVel,p-vec2(uTexel.x,0.)).y-texture2D(uVel,p+vec2(0.,uTexel.y)).x+texture2D(uVel,p-vec2(0.,uTexel.y)).x; }
    void main(){ vec2 v=texture2D(uVel,vUv).xy; float c=C(vUv);
      vec2 n=vec2(abs(C(vUv+vec2(0.,uTexel.y)))-abs(C(vUv-vec2(0.,uTexel.y))), abs(C(vUv+vec2(uTexel.x,0.)))-abs(C(vUv-vec2(uTexel.x,0.))));
      n/=length(n)+1e-4; v+=vec2(n.y,-n.x)*c*18.*uDt; gl_FragColor=vec4(v,0.,1.); }` });
  const out = new T.ShaderMaterial({ vertexShader: VS, blending: T.NoBlending, depthTest: false, uniforms: { uDye: { value: null }, uVel: { value: null }, uTexel: splatU.uTexel, uTime: { value: 0 }, uDark: { value: DARK ? 1 : 0 } }, fragmentShader: `
    precision highp float; varying vec2 vUv; uniform sampler2D uDye, uVel; uniform vec2 uTexel; uniform float uTime, uDark;
    vec3 film(float x){ return .5+.5*cos(6.2831*(x+vec3(0.,.33,.67))); }
    float D(vec2 o){ return texture2D(uDye,vUv+o*uTexel).x; }
    void main(){
      float d=(D(vec2(0.))*4.+D(vec2(2.,0.))+D(vec2(-2.,0.))+D(vec2(0.,2.))+D(vec2(0.,-2.)))/8.;
      float dx=(D(vec2(6.,0.))-D(vec2(-6.,0.))), dy=(D(vec2(0.,6.))-D(vec2(0.,-6.)));
      float edge=smoothstep(.04,.5,length(vec2(dx,dy)));
      float body=smoothstep(.03,.7,d);
      vec3 ir=.78+.22*cos(6.2831*(d*1.3+atan(dy,dx)*.16+uTime*.03+vec3(0.,.33,.67)));
      vec3 col=mix(vec3(1.), ir, edge*.9);
      float a=clamp(body*.5+edge*.35,0.,.8);
      if(uDark>.5){
        // glossy liquid on black: soft grey body + bright specular rims lit from the top-left, faint thin-film colour
        vec3 n=normalize(vec3(-dx*6.,-dy*6.,1.)); float spec=pow(max(dot(n,normalize(vec3(-.5,.6,.65))),0.),18.);
        vec3 lc=vec3(.16)*body + vec3(1.)*spec*smoothstep(.02,.3,d)*1.2 + (ir-.78)*edge*.55 + vec3(.5)*edge*.4;
        gl_FragColor=vec4(lc,1.); return;
      }
      gl_FragColor=vec4(col*a,a);
    }` });
  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight; renderer.setSize(W, H, false);
    const w = Math.ceil(W * SC), h = Math.ceil(H * SC); [vel[0], vel[1], dye[0], dye[1]].forEach((t) => t.setSize(w, h));
    splatU.uAsp.value = W / H; splatU.uTexel.value.set(1 / w, 1 / h);
  }
  resize(); addEventListener("resize", resize);
  const ptr = { x: -1, y: -1, px: -1, py: -1, on: false };
  addEventListener("pointermove", (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; }, { passive: true });
  document.addEventListener("pointerleave", () => (ptr.on = false));
  let lastScroll = scrollY, idle = 0;
  const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(qs, qc); };
  NV.onTick((dt, now) => {
    const sdy = scrollY - lastScroll; lastScroll = scrollY;
    let fx = 0, fy = 0, speed = 0;
    if (ptr.on && ptr.px >= 0) { fx = (ptr.x - ptr.px) / W; fy = -(ptr.y - ptr.py) / H; speed = Math.hypot(fx, fy); }
    ptr.px = ptr.on ? ptr.x : -1; ptr.py = ptr.y;
    idle = speed > 0.0005 || Math.abs(sdy) > 0.5 ? 0 : idle + dt;
    if (idle > 6) return; // fully faded, skip work
    splatU.uDt.value = Math.min(dt, 0.033);
    splatU.uScroll.value = -sdy / H;  // shift fields with page scroll (uv y is up)
    splatU.uP.value.set(ptr.x / W, 1 - ptr.y / H);
    // velocity
    splatU.uSrc.value = vel[0].texture; splatU.uVel.value = vel[0].texture; splatU.uDiss.value = Math.exp(-dt * 0.9);
    splatU.uR.value = 0.0025; splatU.uF.value.set(fx / Math.max(dt, 0.008) * 0.9, fy / Math.max(dt, 0.008) * 0.9, 0);
    pass(advect, vel[1]); vel.reverse();
    vort.uniforms.uVel.value = vel[0].texture; pass(vort, vel[1]); vel.reverse();
    // dye
    splatU.uSrc.value = dye[0].texture; splatU.uVel.value = vel[0].texture; splatU.uDiss.value = Math.exp(-dt * 0.3);
    splatU.uR.value = 0.0018; const amt = Math.min(speed * 45, 0.9); splatU.uF.value.set(amt, 0, 0);
    pass(advect, dye[1]); dye.reverse();
    out.uniforms.uDye.value = dye[0].texture; out.uniforms.uVel.value = vel[0].texture; out.uniforms.uTime.value = now;
    renderer.setRenderTarget(null); renderer.clear(); quad.material = out; renderer.render(qs, qc);
  });
})();
