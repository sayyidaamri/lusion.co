/* Procedural astronaut (own model built from primitives) — shared by the home tunnel and the end section. */
(function () {
  const NV = window.NV; if (!window.THREE) return;
  const T = THREE;
  NV.makeEnv = function (renderer) {
    const env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x15161c, side: T.BackSide })));
    const strip = (w, h, x, y, z, ry, rx, c) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m); };
    strip(16, 3, 0, 10, 2, 0, Math.PI / 2, 0xffffff); strip(3, 16, -12, 0, 3, Math.PI / 2, 0, 0xdfe6ff); strip(3, 12, 12, 1, -3, -Math.PI / 2, 0, 0x8fa0ff); strip(8, 8, 0, 2, 14, Math.PI, 0, 0xffffff); strip(12, 2, 0, -9, 4, 0, -Math.PI / 2, 0x3a4060);
    const p = new T.PMREMGenerator(renderer); const tex = p.fromScene(env, 0.02).texture; p.dispose(); return tex;
  };
  NV.makeAstronaut = function () {
    const suit = new T.MeshPhysicalMaterial({ color: 0xe9ebf2, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 });
    const seam = new T.MeshStandardMaterial({ color: 0xb9bcc8, roughness: 0.7 });
    const dark = new T.MeshPhysicalMaterial({ color: 0x050507, roughness: 0.05, metalness: 0.2, clearcoat: 1 });
    const visor = new T.MeshPhysicalMaterial({ color: 0x07080c, roughness: 0.02, metalness: 0.6, clearcoat: 1, envMapIntensity: 2 });
    const g = new T.Group(); const parts = {};
    const cap = (r, l, m, s = 20) => new T.Mesh(new T.CapsuleGeometry(r, l, 8, s), m);
    // torso (puffy rings)
    const torso = cap(0.62, 0.7, suit); torso.scale.set(1, 1, 0.78); torso.position.y = 0.25; g.add(torso);
    for (let i = 0; i < 4; i++) { const ring = new T.Mesh(new T.TorusGeometry(0.6, 0.045, 8, 40), seam); ring.rotation.x = Math.PI / 2; ring.scale.set(1, 0.78, 1); ring.position.y = -0.1 + i * 0.26; g.add(ring); }
    const chest = new T.Mesh(new T.BoxGeometry(0.5, 0.32, 0.14), suit); chest.position.set(0, 0.45, 0.48); g.add(chest);
    for (const [x, y] of [[-0.3, -0.05], [0.32, 0.1], [0.12, -0.35]]) { const d = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), dark); d.position.set(x, y, 0.5); d.scale.z = 0.4; g.add(d); }
    const pack = new T.Mesh(new T.BoxGeometry(1.0, 1.15, 0.45), suit); pack.position.set(0, 0.35, -0.55); g.add(pack);
    // helmet
    const head = new T.Group(); head.position.y = 1.32; g.add(head);
    head.add(new T.Mesh(new T.SphereGeometry(0.52, 32, 24), suit));
    const v = new T.Mesh(new T.SphereGeometry(0.46, 32, 24, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.26, Math.PI * 0.42), visor); v.rotation.y = 0; v.position.z = 0.14; v.scale.set(1, 1, 1.05); head.add(v);
    const collar = new T.Mesh(new T.TorusGeometry(0.42, 0.11, 10, 30), seam); collar.rotation.x = Math.PI / 2; collar.position.y = -0.42; head.add(collar);
    parts.head = head;
    // limbs
    const limb = (side, isArm) => {
      const root = new T.Group(); const upper = cap(isArm ? 0.19 : 0.24, isArm ? 0.5 : 0.55, suit); const lower = cap(isArm ? 0.17 : 0.22, isArm ? 0.45 : 0.55, suit);
      upper.position.y = isArm ? -0.38 : -0.42; root.add(upper);
      const joint = new T.Group(); joint.position.y = isArm ? -0.72 : -0.82; root.add(joint);
      lower.position.y = isArm ? -0.33 : -0.4; joint.add(lower);
      const end = isArm ? new T.Mesh(new T.SphereGeometry(0.17, 14, 12), suit) : new T.Mesh(new T.BoxGeometry(0.34, 0.24, 0.5), suit);
      end.position.set(0, isArm ? -0.7 : -0.8, isArm ? 0 : 0.08); joint.add(end);
      const cuff = new T.Mesh(new T.TorusGeometry(isArm ? 0.17 : 0.22, 0.04, 8, 24), seam); cuff.rotation.x = Math.PI / 2; cuff.position.y = isArm ? -0.55 : -0.65; joint.add(cuff);
      root.position.set(side * (isArm ? 0.74 : 0.3), isArm ? 0.75 : -0.35, 0); g.add(root);
      return { root, joint };
    };
    parts.la = limb(-1, true); parts.ra = limb(1, true); parts.ll = limb(-1, false); parts.rl = limb(1, false);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
    // floating pose, `t` seconds, `spread` 0..1 (arms out)
    g.userData.pose = (t, spread = 1) => {
      const s = Math.sin(t * 0.9), c = Math.cos(t * 0.7);
      parts.la.root.rotation.z = -0.25 - spread * 1.05 + s * 0.12; parts.ra.root.rotation.z = 0.25 + spread * 1.05 - s * 0.12;
      parts.la.joint.rotation.z = -0.35 * spread + c * 0.1; parts.ra.joint.rotation.z = 0.35 * spread - c * 0.1;
      parts.la.root.rotation.x = 0.2 + c * 0.1; parts.ra.root.rotation.x = 0.2 - c * 0.1;
      parts.ll.root.rotation.x = -0.25 + s * 0.15; parts.rl.root.rotation.x = 0.15 - s * 0.15; parts.ll.root.rotation.z = -0.1; parts.rl.root.rotation.z = 0.12;
      parts.ll.joint.rotation.x = 0.45 + c * 0.1; parts.rl.joint.rotation.x = 0.25 - c * 0.1;
      head.rotation.y = Math.sin(t * 0.4) * 0.25; head.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.06;
    };
    g.userData.pose(0);
    return g;
  };
  NV.studioLights = function (scene, color = 0xffffff) {
    const k = new T.DirectionalLight(color, 2.2); k.position.set(-3, 5, 6); scene.add(k);
    const r = new T.DirectionalLight(0x9fb0ff, 1.2); r.position.set(4, 2, -4); scene.add(r);
    scene.add(new T.AmbientLight(0x8088a0, 0.5)); return { key: k, rim: r };
  };
})();
