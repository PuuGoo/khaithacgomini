/**
 * TimberPort 3D — Living Forest & Character-Nature Coupling System
 *
 * Delivers high-craft Nordic woodland atmosphere & physical actor-nature interaction at 60 FPS:
 *  1. Unified Forest Wind Field (synchronized gusts across grass, ferns, tree crowns, leaves & mist)
 *  2. GPU Interactive Meadow Grass & Ferns (onBeforeCompile PBR vertex shader with 6-actor parting)
 *  3. Pooled Expanding River Water Ripples (zero-GC radial wave rings on foot-strike / wading)
 *  4. Pooled Canopy Leaf-Fall Shake (wind-blown foliage bursts on tree chop or sprint brush)
 *  5. View-Angle Faded Volumetric Sunbeams / God Rays aligned to live sun & time-of-day
 *  6. Fluttering Woodland Butterflies (daytime figure-8 meadow gliders reacting to player proximity)
 *  7. Dual-Mode Sunlit Pollen (Day) -> Warm Glowing Fireflies (Dusk/Night)
 *  8. Low-Lying Drifting Valley Mist along the Forest River corridor
 *  9. Adaptive 60 FPS Quality Budget scaling (grass count, wildlife & volumetric intensity)
 */

import * as THREE from 'three';
import {
  WILDERNESS_RADIUS,
  STREAM_WATER_Y,
  getStreamInfo,
  getStreamCenterX,
  groundHeightAt,
  getGradedFactorAt
} from './wilderness-map.js';

const MAX_INTERACTIVE_ACTORS = 6;

const _dummy = new THREE.Object3D();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _sunVec = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _tmpQuat = new THREE.Quaternion();

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeRadialSoftTexture(innerRgba, midRgba, outerRgba, size = 128) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, innerRgba);
  g.addColorStop(0.45, midRgba);
  g.addColorStop(1.0, outerRgba);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWaterRippleTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  // Concentric double crisp foam/refraction rings with feathered fade
  const g = ctx.createRadialGradient(cx, cy, size * 0.16, cx, cy, size * 0.49);
  g.addColorStop(0.0, 'rgba(224,247,255,0)');
  g.addColorStop(0.32, 'rgba(224,247,255,0.22)');
  g.addColorStop(0.46, 'rgba(255,255,255,0.0)');
  g.addColorStop(0.72, 'rgba(215,246,255,0.16)');
  g.addColorStop(0.84, 'rgba(255,255,255,0.88)');
  g.addColorStop(0.93, 'rgba(220,248,255,0.34)');
  g.addColorStop(1.0, 'rgba(220,248,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a stylized 3-blade curved meadow grass tuft with root-to-tip vertex colors
 * so a single InstancedMesh renders lush organic grass clusters with zero texture alpha overdraw.
 */
function buildGrassTuftGeometry() {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  const rootCol = new THREE.Color('#2d5d28');
  const midCol = new THREE.Color('#5a9838');
  const tipCol = new THREE.Color('#9cd14f');

  const bladeConfigs = [
    { yaw: 0.0, ox: 0.0, oz: 0.0, h: 0.56, w: 0.10, lean: 0.11 },
    { yaw: 2.15, ox: 0.06, oz: -0.04, h: 0.48, w: 0.095, lean: 0.13 },
    { yaw: 4.25, ox: -0.05, oz: 0.05, h: 0.42, w: 0.09, lean: 0.10 },
    { yaw: 1.05, ox: -0.03, oz: -0.06, h: 0.36, w: 0.085, lean: 0.08 }
  ];

  let vOffset = 0;
  for (const cfg of bladeConfigs) {
    const cy = Math.cos(cfg.yaw);
    const sy = Math.sin(cfg.yaw);
    const nx = -sy;
    const nz = cy;

    const addV = (lx, ly, lz, col) => {
      const wx = cfg.ox + lx * cy + lz * sy;
      const wz = cfg.oz - lx * sy + lz * cy;
      positions.push(wx, ly, wz);
      normals.push(nx * 0.4, 0.91, nz * 0.4);
      colors.push(col.r, col.g, col.b);
    };

    const hw0 = cfg.w * 0.5;
    const hw1 = cfg.w * 0.33;
    // Row 0 (base anchored firmly at y = -0.02)
    addV(-hw0, -0.02, 0, rootCol);
    addV(hw0, -0.02, 0, rootCol);
    // Row 1 (mid curved outward)
    addV(-hw1, cfg.h * 0.52, cfg.lean * 0.38, midCol);
    addV(hw1, cfg.h * 0.52, cfg.lean * 0.38, midCol);
    // Row 2 (tapered sunlit tip)
    addV(0, cfg.h, cfg.lean, tipCol);

    indices.push(
      vOffset + 0, vOffset + 1, vOffset + 3,
      vOffset + 0, vOffset + 3, vOffset + 2,
      vOffset + 2, vOffset + 3, vOffset + 4
    );
    vOffset += 5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

export class WildernessNatureSystem {
  constructor(worldGroup, { lowSpec = false } = {}) {
    this.worldGroup = worldGroup;
    this.lowSpec = Boolean(lowSpec);
    this.root = new THREE.Group();
    this.root.name = 'WildernessLivingNature';
    this.root.userData.wildernessKeep = true;
    this.worldGroup.add(this.root);

    this.qualityScale = this.lowSpec ? 0.62 : 1.0;

    // Shared GPU uniforms for wind & multi-actor grass/fern parting
    const actorSlots = [];
    for (let i = 0; i < MAX_INTERACTIVE_ACTORS; i++) {
      actorSlots.push(new THREE.Vector4(9999, 0, 9999, 0));
    }
    this.foliageUniforms = {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector2(0.84, 0.54) },
      uWindStrength: { value: 0.45 },
      uActors: { value: actorSlots }
    };

    this.windState = {
      dirX: 0.84,
      dirZ: 0.54,
      strength: 0.45,
      targetStrength: 0.45
    };

    // Subsystems
    this.grassInst = null;
    this.grassMeta = [];
    this.maxGrassCount = 0;

    this.ripplePool = [];
    this.rippleCursor = 0;

    this.canopyLeafInst = null;
    this.canopyLeaves = [];
    this.canopyLeafCursor = 0;

    this.sunbeamGroup = null;
    this.sunbeamUniforms = null;
    this.sunbeamBaseTilt = new THREE.Euler();

    this.butterflies = [];
    this.butterflyGroup = null;

    this.moteInst = null;
    this.moteMat = null;
    this.moteData = [];
    this.maxMoteCount = 0;

    this.mistPlanes = [];
    this.mistMat = null;

    this.buildInteractiveMeadowGrass();
    this.buildRiverRipplePool();
    this.buildCanopyLeafPool();
    this.buildVolumetricSunbeams();
    this.buildButterflies();
    this.buildPollenAndFireflies();
    this.buildValleyMist();
  }

  /**
   * Injects synchronized forest wind sway + optional 6-actor proximity parting into any PBR MeshStandardMaterial.
   * Preserves full directional lighting, shadows, environment reflections & horizon fog.
   */
  attachWindToMaterial(material, { swayAmp = 0.14, partAmp = 0.62, heightScale = 0.55, allowParting = true } = {}) {
    if (!material || material.userData?._windPatched) return material;
    material.userData = material.userData || {};
    material.userData._windPatched = true;
    const uniforms = this.foliageUniforms;

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uWindDir = uniforms.uWindDir;
      shader.uniforms.uWindStrength = uniforms.uWindStrength;
      shader.uniforms.uActors = uniforms.uActors;

      const header = `
        uniform float uTime;
        uniform vec2 uWindDir;
        uniform float uWindStrength;
        uniform vec4 uActors[${MAX_INTERACTIVE_ACTORS}];
      `;

      const partingCode = allowParting
        ? `
          for (int i = 0; i < ${MAX_INTERACTIVE_ACTORS}; i++) {
            vec4 act = uActors[i];
            if (act.w > 0.01) {
              vec2 toBlade = wPos.xz - act.xz;
              float dist = length(toBlade);
              if (dist < act.w && dist > 0.001) {
                float push = (1.0 - dist / act.w);
                push = push * push;
                vec2 pushDir = toBlade / dist;
                vec2 localPush = pushDir * (push * ${partAmp.toFixed(3)} * bend);
                // Transform world XZ push cleanly back into local space when instanced
                #ifdef USE_INSTANCING
                  mat2 invRot = mat2(instanceMatrix[0].x, instanceMatrix[0].z, instanceMatrix[2].x, instanceMatrix[2].z);
                  float det = max(0.001, abs(invRot[0][0] * invRot[1][1] - invRot[0][1] * invRot[1][0]));
                  localPush = (transpose(invRot) / sqrt(det)) * localPush;
                #endif
                transformed.xz += localPush;
                transformed.y -= push * 0.16 * bend;
              }
            }
          }
        `
        : '';

      const inject = `
        #include <begin_vertex>
        {
          float hNorm = clamp(position.y / ${heightScale.toFixed(3)}, 0.0, 1.0);
          float bend = hNorm * hNorm;
          vec4 wPos = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wPos = instanceMatrix * wPos;
          #endif
          wPos = modelMatrix * wPos;

          float wavePhase = dot(wPos.xz, uWindDir) * 0.24 - uTime * (1.85 + uWindStrength * 1.45);
          float gust = sin(wavePhase) * 0.65 + sin(wavePhase * 2.13 + wPos.x * 0.19) * 0.35;
          vec2 windOffset = uWindDir * ((0.22 + gust) * uWindStrength * ${swayAmp.toFixed(3)} * bend);
          #ifdef USE_INSTANCING
            mat2 instXZ = mat2(instanceMatrix[0].x, instanceMatrix[0].z, instanceMatrix[2].x, instanceMatrix[2].z);
            float iDet = max(0.001, abs(instXZ[0][0] * instXZ[1][1] - instXZ[0][1] * instXZ[1][0]));
            windOffset = (transpose(instXZ) / sqrt(iDet)) * windOffset;
          #endif
          transformed.xz += windOffset;
          ${partingCode}
        }
      `;

      shader.vertexShader = header + shader.vertexShader.replace('#include <begin_vertex>', inject);
    };
    material.customProgramCacheKey = () => `tp_wind_${swayAmp}_${partAmp}_${heightScale}_${allowParting ? 1 : 0}`;
    return material;
  }

  // ---------------------------------------------------------------------------
  // 1. Lush Interactive Meadow Grass Field (GPU Instanced + Multi-Actor Parting)
  // ---------------------------------------------------------------------------
  buildInteractiveMeadowGrass() {
    const targetCount = this.lowSpec ? 820 : 1950;
    const geo = buildGrassTuftGeometry();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    this.attachWindToMaterial(mat, { swayAmp: 0.18, partAmp: 0.72, heightScale: 0.56, allowParting: true });

    const inst = new THREE.InstancedMesh(geo, mat, targetCount);
    inst.receiveShadow = !this.lowSpec;
    inst.castShadow = false;
    inst.frustumCulled = false;

    const rand = seededRand(20261127);
    const meta = [];
    const tintWarm = new THREE.Color('#c8e878');
    const tintRich = new THREE.Color('#82bf56');
    const tintShade = new THREE.Color('#5a9844');

    let placed = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 5;
    while (placed < targetCount && attempts < maxAttempts) {
      attempts++;
      const r = Math.sqrt(rand()) * (WILDERNESS_RADIUS - 6.5);
      const ang = rand() * Math.PI * 2;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      // Keep immediate campfire hearth clear & skip river channel center
      if (Math.hypot(x, z) < 3.4) continue;
      const stream = getStreamInfo(x, z);
      if (stream.dist < stream.halfWidth + 1.35) continue;

      const y = groundHeightAt(x, z);
      if (y < STREAM_WATER_Y + 0.18 || y > 13.5) continue;

      // Cluster grass organically using gentle trigonometric meadow patches
      const patch = Math.sin(x * 0.14 + 0.5) * Math.cos(z * 0.13 - 0.8);
      if (patch < -0.35 && rand() < 0.72) continue;

      const sc = 0.78 + rand() * 0.68;
      const scY = sc * (0.82 + rand() * 0.52);
      const rotY = rand() * Math.PI * 2;

      _dummy.position.set(x, y - 0.02, z);
      _dummy.rotation.set(0, rotY, 0);
      _dummy.scale.set(sc, scY, sc);
      _dummy.updateMatrix();
      inst.setMatrixAt(placed, _dummy.matrix);

      const t = rand();
      _colorA.copy(t > 0.65 ? tintWarm : t > 0.25 ? tintRich : tintShade);
      inst.setColorAt(placed, _colorA);

      meta.push({ x, z, sc, scY, rotY });
      placed++;
    }

    inst.count = Math.floor(placed * this.qualityScale);
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    this.root.add(inst);
    this.grassInst = inst;
    this.grassMeta = meta;
    this.maxGrassCount = placed;
  }

  /**
   * Re-seats grass tufts & hides tufts inside freshly excavator-flattened compacted earth pads.
   */
  syncGrassWithTerrainRegion(cx, cz, radius) {
    if (!this.grassInst || this.grassMeta.length === 0) return;
    const r2 = (radius + 2.5) * (radius + 2.5);
    let dirty = false;
    for (let i = 0; i < this.grassMeta.length; i++) {
      const m = this.grassMeta[i];
      const dx = m.x - cx;
      const dz = m.z - cz;
      if (dx * dx + dz * dz > r2) continue;
      const graded = getGradedFactorAt(m.x, m.z);
      const y = groundHeightAt(m.x, m.z);
      const scaleFade = Math.max(0, 1 - graded * 1.15);
      _dummy.position.set(m.x, y - 0.02, m.z);
      _dummy.rotation.set(0, m.rotY, 0);
      _dummy.scale.set(m.sc * scaleFade, m.scY * scaleFade, m.sc * scaleFade);
      _dummy.updateMatrix();
      this.grassInst.setMatrixAt(i, _dummy.matrix);
      dirty = true;
    }
    if (dirty) this.grassInst.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------------------
  // 2. Pooled Expanding River Water Ripple Rings (Zero-GC)
  // ---------------------------------------------------------------------------
  buildRiverRipplePool() {
    const tex = makeWaterRippleTexture(128);
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);

    const count = this.lowSpec ? 14 : 24;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.renderOrder = 6;
      this.root.add(mesh);
      this.ripplePool.push({
        mesh,
        mat,
        active: false,
        age: 0,
        maxAge: 0.95,
        maxScale: 2.2
      });
    }
  }

  spawnWaterRipple(x, z, strength = 0.8) {
    if (this.ripplePool.length === 0) return;
    const slot = this.ripplePool[this.rippleCursor % this.ripplePool.length];
    this.rippleCursor++;
    slot.active = true;
    slot.age = 0;
    slot.maxAge = 0.78 + Math.min(0.45, strength * 0.3);
    slot.maxScale = 1.45 + Math.min(1.4, strength * 0.95);
    slot.mesh.position.set(x, STREAM_WATER_Y + 0.05, z);
    slot.mesh.rotation.y = Math.random() * Math.PI * 2;
    slot.mesh.scale.setScalar(0.26);
    slot.mat.opacity = 0.72;
    slot.mesh.visible = true;
  }

  // ---------------------------------------------------------------------------
  // 3. Pooled Canopy Leaf-Fall Shake (Tree Chop & Sprint Brush)
  // ---------------------------------------------------------------------------
  buildCanopyLeafPool() {
    const count = this.lowSpec ? 32 : 64;
    const shape = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 0, -0.14,
      0.09, 0.02, 0,
      0, 0, 0.16,
      -0.09, 0.02, 0
    ]);
    shape.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    shape.setIndex([0, 1, 2, 0, 2, 3]);
    shape.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      side: THREE.DoubleSide
    });
    const inst = new THREE.InstancedMesh(shape, mat, count);
    inst.frustumCulled = false;

    const palette = [
      new THREE.Color('#78bd48'),
      new THREE.Color('#a4d453'),
      new THREE.Color('#e0b34c'),
      new THREE.Color('#5a9f3e')
    ];

    for (let i = 0; i < count; i++) {
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      inst.setMatrixAt(i, _dummy.matrix);
      inst.setColorAt(i, palette[i % palette.length]);
      this.canopyLeaves.push({
        active: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        groundY: 0,
        age: 0,
        maxAge: 3.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    this.root.add(inst);
    this.canopyLeafInst = inst;
  }

  spawnCanopyLeafBurst(x, y, z, count = 6) {
    if (!this.canopyLeafInst || this.canopyLeaves.length === 0) return;
    const n = Math.min(count, this.lowSpec ? 4 : 10);
    for (let i = 0; i < n; i++) {
      const leaf = this.canopyLeaves[this.canopyLeafCursor % this.canopyLeaves.length];
      this.canopyLeafCursor++;
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.4 + Math.random() * 1.9;
      leaf.active = true;
      leaf.x = x + Math.cos(ang) * rad;
      leaf.z = z + Math.sin(ang) * rad;
      leaf.y = y + (Math.random() - 0.35) * 1.8;
      leaf.vx = Math.cos(ang) * (0.4 + Math.random() * 0.7);
      leaf.vy = -(0.55 + Math.random() * 0.65);
      leaf.vz = Math.sin(ang) * (0.4 + Math.random() * 0.7);
      leaf.groundY = groundHeightAt(leaf.x, leaf.z) + 0.05;
      leaf.age = 0;
      leaf.maxAge = 2.8 + Math.random() * 1.8;
      leaf.phase = Math.random() * Math.PI * 2;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. View-Angle Faded Volumetric Canopy Sunbeams (God Rays)
  // ---------------------------------------------------------------------------
  buildVolumetricSunbeams() {
    this.sunbeamGroup = new THREE.Group();
    this.sunbeamGroup.name = 'CanopyGodRays';

    this.sunbeamUniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#fff2c6') },
      uIntensity: { value: this.lowSpec ? 0.14 : 0.22 }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.sunbeamUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vNormalView = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        void main() {
          vec3 vDir = normalize(vViewPos);
          float edge = pow(abs(dot(normalize(vNormalView), vDir)), 1.65);
          float vertical = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.18, vUv.y);
          float dapple = 0.78 + 0.22 * sin(vUv.x * 18.84 + uTime * 0.45) * cos(vUv.y * 6.0 - uTime * 0.3);
          float alpha = edge * vertical * dapple * uIntensity;
          if (alpha < 0.002) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });

    const shaftGeo = new THREE.CylinderGeometry(1.15, 3.85, 22, 12, 1, true);
    shaftGeo.translate(0, 11, 0);

    const spots = [
      { x: -12, z: -10, s: 1.05 },
      { x: 14, z: -14, s: 1.15 },
      { x: -24, z: 12, s: 1.25 },
      { x: 22, z: 16, s: 1.1 },
      { x: -4, z: 24, s: 1.0 },
      { x: 8, z: -28, s: 1.3 },
      { x: -30, z: -22, s: 1.2 },
      { x: 30, z: -4, s: 1.15 }
    ];

    const limit = this.lowSpec ? 4 : spots.length;
    for (let i = 0; i < limit; i++) {
      const sp = spots[i];
      const m = new THREE.Mesh(shaftGeo, mat);
      const gy = groundHeightAt(sp.x, sp.z);
      m.position.set(sp.x, gy - 0.5, sp.z);
      m.scale.set(sp.s, 1.0 + (i % 3) * 0.12, sp.s);
      m.renderOrder = 8;
      this.sunbeamGroup.add(m);
    }

    this.root.add(this.sunbeamGroup);
  }

  // ---------------------------------------------------------------------------
  // 5. Fluttering Woodland Butterflies (Paired 3D Flapping Wings)
  // ---------------------------------------------------------------------------
  buildButterflies() {
    this.butterflyGroup = new THREE.Group();
    const count = this.lowSpec ? 8 : 16;
    const wingGeo = new THREE.PlaneGeometry(0.16, 0.13);
    wingGeo.translate(0.08, 0, 0);
    const wingGeoL = new THREE.PlaneGeometry(0.16, 0.13);
    wingGeoL.translate(-0.08, 0, 0);
    const bodyGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 4);
    bodyGeo.rotateX(Math.PI / 2);

    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const wingColors = [0xf59e0b, 0x38bdf8, 0xfef08a, 0xfb923c];
    const wingMats = wingColors.map((hex) => new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: 0.18,
      roughness: 0.5,
      side: THREE.DoubleSide
    }));

    const rand = seededRand(88421);
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      const wMat = wingMats[i % wingMats.length];
      const wingL = new THREE.Mesh(wingGeoL, wMat);
      const wingR = new THREE.Mesh(wingGeo, wMat);
      g.add(body, wingL, wingR);

      const ang = (i / count) * Math.PI * 2;
      const rad = 7 + rand() * 28;
      const cx = Math.cos(ang) * rad;
      const cz = Math.sin(ang) * rad;
      this.butterflyGroup.add(g);
      this.butterflies.push({
        group: g,
        wingL,
        wingR,
        cx,
        cz,
        rx: 2.2 + rand() * 3.4,
        rz: 2.0 + rand() * 3.0,
        alt: 1.05 + rand() * 1.45,
        speed: 0.55 + rand() * 0.45,
        flapFreq: 13 + rand() * 6,
        phase: rand() * Math.PI * 2,
        scareLift: 0
      });
    }
    this.root.add(this.butterflyGroup);
  }

  // ---------------------------------------------------------------------------
  // 6. Dual-Mode Sunlit Pollen Motes (Day) -> Bioluminescent Fireflies (Night)
  // ---------------------------------------------------------------------------
  buildPollenAndFireflies() {
    const count = this.lowSpec ? 56 : 120;
    const geo = new THREE.OctahedronGeometry(0.055, 0);
    this.moteMat = new THREE.MeshBasicMaterial({
      color: 0xfff7cc,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const inst = new THREE.InstancedMesh(geo, this.moteMat, count);
    inst.frustumCulled = false;

    const rand = seededRand(99234);
    for (let i = 0; i < count; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 3 + Math.sqrt(rand()) * 42;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const baseY = groundHeightAt(x, z);
      this.moteData.push({
        x,
        z,
        baseY,
        hOff: 0.75 + rand() * 3.8,
        speed: 0.45 + rand() * 0.75,
        phase: rand() * Math.PI * 2,
        pulseFreq: 1.8 + rand() * 2.4
      });
    }
    this.maxMoteCount = count;
    inst.count = Math.floor(count * this.qualityScale);
    this.root.add(inst);
    this.moteInst = inst;
  }

  // ---------------------------------------------------------------------------
  // 7. Drifting Low-Lying River Valley Mist
  // ---------------------------------------------------------------------------
  buildValleyMist() {
    const tex = makeRadialSoftTexture(
      'rgba(235, 246, 255, 0.34)',
      'rgba(225, 240, 252, 0.14)',
      'rgba(215, 232, 248, 0.0)',
      128
    );
    this.mistMat = new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xeaf4ff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const geo = new THREE.PlaneGeometry(18, 12);
    geo.rotateX(-Math.PI / 2);

    const count = this.lowSpec ? 5 : 10;
    for (let i = 0; i < count; i++) {
      const z = -46 + (i / Math.max(1, count - 1)) * 92;
      const sx = getStreamCenterX(z) + (i % 2 === 0 ? -5.5 : 5.5);
      const m = new THREE.Mesh(geo, this.mistMat);
      m.position.set(sx, STREAM_WATER_Y + 0.55 + (i % 3) * 0.32, z);
      m.scale.set(1.0 + (i % 3) * 0.3, 1, 1.0 + ((i + 1) % 3) * 0.25);
      m.renderOrder = 5;
      this.root.add(m);
      this.mistPlanes.push({
        mesh: m,
        baseX: sx,
        baseZ: z,
        baseY: m.position.y,
        phase: i * 1.1
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Runtime Couplings: Active Actors -> GPU Parting, Quality Governor, Update
  // ---------------------------------------------------------------------------
  updateInteractiveActors(actors) {
    const slots = this.foliageUniforms.uActors.value;
    const len = Array.isArray(actors) ? Math.min(MAX_INTERACTIVE_ACTORS, actors.length) : 0;
    for (let i = 0; i < len; i++) {
      const a = actors[i];
      slots[i].set(a.x, a.y || 0, a.z, a.radius || 1.35);
    }
    for (let i = len; i < MAX_INTERACTIVE_ACTORS; i++) {
      slots[i].set(9999, 0, 9999, 0);
    }
  }

  setQualityScale(scale) {
    const clamped = Math.max(0.45, Math.min(1.0, Number(scale) || 1.0));
    if (Math.abs(clamped - this.qualityScale) < 0.03) return;
    this.qualityScale = clamped;
    if (this.grassInst) {
      this.grassInst.count = Math.max(180, Math.floor(this.maxGrassCount * clamped));
    }
    if (this.moteInst) {
      this.moteInst.count = Math.max(24, Math.floor(this.maxMoteCount * clamped));
    }
    if (this.butterflyGroup) {
      const maxB = Math.max(4, Math.round(this.butterflies.length * clamped));
      for (let i = 0; i < this.butterflies.length; i++) {
        this.butterflies[i].group.visible = i < maxB;
      }
    }
  }

  update(dt, elapsed, env = {}) {
    const clampedDt = Math.min(dt, 0.05);
    const nightFactor = Number.isFinite(env.nightFactor) ? env.nightFactor : 0;
    const isStorm = Boolean(env.isStorm);
    const hour = Number.isFinite(env.hour) ? env.hour : 10.5;
    const playerPos = env.playerPos || null;

    // 1. Unified Forest Wind Field (stronger gusts during storm, gentle rhythmic breeze in fair weather)
    const targetWind = isStorm ? 1.35 : (0.42 + Math.sin(elapsed * 0.28) * 0.16 + Math.sin(elapsed * 0.71) * 0.08);
    this.windState.strength += (targetWind - this.windState.strength) * (1 - Math.exp(-2.4 * clampedDt));
    const windAng = 0.56 + Math.sin(elapsed * 0.11) * 0.22;
    this.windState.dirX = Math.cos(windAng);
    this.windState.dirZ = Math.sin(windAng);

    this.foliageUniforms.uTime.value = elapsed;
    this.foliageUniforms.uWindDir.value.set(this.windState.dirX, this.windState.dirZ);
    this.foliageUniforms.uWindStrength.value = this.windState.strength;

    // 2. Pooled Expanding Water Ripples
    for (let i = 0; i < this.ripplePool.length; i++) {
      const r = this.ripplePool[i];
      if (!r.active) continue;
      r.age += clampedDt;
      if (r.age >= r.maxAge) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }
      const t = r.age / r.maxAge;
      const easeOut = 1 - (1 - t) * (1 - t);
      r.mesh.scale.setScalar(0.28 + easeOut * r.maxScale);
      r.mat.opacity = 0.72 * (1 - t) * (1 - t);
    }

    // 3. Pooled Canopy Leaf-Fall Shake (wind-coupled flutter)
    if (this.canopyLeafInst) {
      let leafDirty = false;
      for (let i = 0; i < this.canopyLeaves.length; i++) {
        const lf = this.canopyLeaves[i];
        if (!lf.active) continue;
        lf.age += clampedDt;
        if (lf.age >= lf.maxAge) {
          lf.active = false;
          _dummy.position.set(0, -50, 0);
          _dummy.scale.setScalar(0.0001);
          _dummy.updateMatrix();
          this.canopyLeafInst.setMatrixAt(i, _dummy.matrix);
          leafDirty = true;
          continue;
        }
        const flutter = Math.sin(elapsed * 4.5 + lf.phase);
        if (lf.y > lf.groundY) {
          lf.x += (lf.vx + this.windState.dirX * this.windState.strength * 1.45 + flutter * 0.45) * clampedDt;
          lf.z += (lf.vz + this.windState.dirZ * this.windState.strength * 1.45 + Math.cos(elapsed * 3.8 + lf.phase) * 0.4) * clampedDt;
          lf.y = Math.max(lf.groundY, lf.y + lf.vy * clampedDt);
          lf.vx *= Math.max(0, 1 - clampedDt * 1.8);
          lf.vz *= Math.max(0, 1 - clampedDt * 1.8);
        }
        const fade = lf.age > lf.maxAge - 0.6 ? Math.max(0, (lf.maxAge - lf.age) / 0.6) : 1;
        _dummy.position.set(lf.x, lf.y, lf.z);
        _dummy.rotation.set(elapsed * 2.4 + lf.phase, elapsed * 1.9, flutter * 0.85);
        _dummy.scale.setScalar(Math.max(0.001, 1.05 * fade));
        _dummy.updateMatrix();
        this.canopyLeafInst.setMatrixAt(i, _dummy.matrix);
        leafDirty = true;
      }
      if (leafDirty) this.canopyLeafInst.instanceMatrix.needsUpdate = true;
    }

    // 4. Volumetric Canopy Sunbeams (aligned to sun light, warm golden hour glow, hidden at night/storm)
    if (this.sunbeamGroup && this.sunbeamUniforms) {
      const goldenBoost = (hour >= 5.8 && hour <= 9.2) || (hour >= 15.8 && hour <= 18.8) ? 1.38 : 0.92;
      const sunVis = isStorm ? 0 : Math.max(0, 1 - nightFactor * 1.65);
      const targetInt = (this.lowSpec ? 0.12 : 0.20) * goldenBoost * sunVis * this.qualityScale;
      this.sunbeamUniforms.uTime.value = elapsed;
      this.sunbeamUniforms.uIntensity.value += (targetInt - this.sunbeamUniforms.uIntensity.value) * (1 - Math.exp(-3.0 * clampedDt));
      this.sunbeamGroup.visible = this.sunbeamUniforms.uIntensity.value > 0.008;

      if (this.sunbeamGroup.visible) {
        const isGolden = hour < 8.8 || hour > 16.0;
        _colorA.set(isGolden ? '#ffd18b' : '#fff4d2');
        this.sunbeamUniforms.uColor.value.lerp(_colorA, Math.min(1, clampedDt * 2.5));
        if (env.sunPosition) {
          _sunVec.copy(env.sunPosition).normalize();
          if (_sunVec.y > 0.12) {
            _tmpQuat.setFromUnitVectors(_upVec, _sunVec);
            for (let i = 0; i < this.sunbeamGroup.children.length; i++) {
              this.sunbeamGroup.children[i].quaternion.slerp(_tmpQuat, Math.min(1, clampedDt * 2));
            }
          }
        }
      }
    }

    // 5. Fluttering Woodland Butterflies (active in daytime & calm weather, gently flutter higher if player nears)
    if (this.butterflyGroup) {
      const showButterflies = !isStorm && nightFactor < 0.42;
      this.butterflyGroup.visible = showButterflies;
      if (showButterflies) {
        const activeMax = Math.max(4, Math.round(this.butterflies.length * this.qualityScale));
        for (let i = 0; i < activeMax; i++) {
          const bf = this.butterflies[i];
          const t = elapsed * bf.speed + bf.phase;
          const bx = bf.cx + Math.sin(t) * bf.rx + this.windState.dirX * 0.4;
          const bz = bf.cz + Math.sin(t * 2) * 0.5 * bf.rz + this.windState.dirZ * 0.4;
          const nx = bf.cx + Math.sin(t + 0.06) * bf.rx + this.windState.dirX * 0.4;
          const nz = bf.cz + Math.sin((t + 0.06) * 2) * 0.5 * bf.rz + this.windState.dirZ * 0.4;

          if (playerPos) {
            const dp = Math.hypot(bx - playerPos.x, bz - playerPos.z);
            const targetScare = dp < 3.5 ? (1 - dp / 3.5) * 1.45 : 0;
            bf.scareLift += (targetScare - bf.scareLift) * (1 - Math.exp(-5.0 * clampedDt));
          }

          const gy = groundHeightAt(bx, bz);
          const by = gy + bf.alt + Math.sin(t * 2.3) * 0.34 + bf.scareLift;
          bf.group.position.set(bx, by, bz);
          bf.group.rotation.y = Math.atan2(nx - bx, nz - bz);
          const flap = Math.sin(elapsed * bf.flapFreq + bf.phase) * 0.92;
          bf.wingL.rotation.z = flap;
          bf.wingR.rotation.z = -flap;
        }
      }
    }

    // 6. Dual-Mode Pollen Motes (Day) <-> Bioluminescent Fireflies (Dusk/Night)
    if (this.moteInst && this.moteMat) {
      const isNightGlow = nightFactor > 0.25;
      _colorA.set('#fff5cc'); // sunlit pollen
      _colorB.set('#c8ff5a'); // warm woodland firefly glow
      this.moteMat.color.copy(_colorA).lerp(_colorB, Math.min(1, nightFactor * 1.35));
      this.moteMat.opacity = isStorm ? 0.14 : (0.42 + nightFactor * 0.46);

      const n = this.moteInst.count;
      for (let i = 0; i < n; i++) {
        const md = this.moteData[i];
        const t = elapsed * md.speed + md.phase;
        const mx = md.x + Math.sin(t * 0.7) * 1.65 + this.windState.dirX * Math.sin(elapsed * 0.3 + i) * 0.85;
        const mz = md.z + Math.cos(t * 0.62) * 1.65 + this.windState.dirZ * Math.sin(elapsed * 0.3 + i) * 0.85;
        const my = md.baseY + md.hOff + Math.sin(t * 1.15) * 0.55;
        const pulse = isNightGlow
          ? (0.45 + Math.max(0, Math.sin(elapsed * md.pulseFreq + md.phase)) * 1.25)
          : (0.65 + Math.sin(elapsed * 1.5 + md.phase) * 0.25);
        _dummy.position.set(mx, my, mz);
        _dummy.rotation.set(t, t * 0.7, 0);
        _dummy.scale.setScalar(pulse * (isNightGlow ? 1.15 : 0.78));
        _dummy.updateMatrix();
        this.moteInst.setMatrixAt(i, _dummy.matrix);
      }
      this.moteInst.instanceMatrix.needsUpdate = true;
    }

    // 7. Drifting Valley Mist along the River
    if (this.mistMat && this.mistPlanes.length > 0) {
      const dawnBoost = hour >= 5.0 && hour <= 8.8 ? 1.45 : 1.0;
      const targetMistOp = (isStorm ? 0.34 : 0.20) * dawnBoost * (0.75 + nightFactor * 0.35) * this.qualityScale;
      this.mistMat.opacity += (targetMistOp - this.mistMat.opacity) * (1 - Math.exp(-2.0 * clampedDt));
      if (hour > 16.2 && hour < 19.2) {
        _colorA.set('#ffe4be');
      } else if (nightFactor > 0.5) {
        _colorA.set('#b8d0ee');
      } else {
        _colorA.set('#eaf5ff');
      }
      this.mistMat.color.lerp(_colorA, Math.min(1, clampedDt * 2.0));

      for (let i = 0; i < this.mistPlanes.length; i++) {
        const mp = this.mistPlanes[i];
        mp.mesh.position.x = mp.baseX + Math.sin(elapsed * 0.14 + mp.phase) * 3.8 + this.windState.dirX * Math.sin(elapsed * 0.08 + mp.phase) * 2.2;
        mp.mesh.position.z = mp.baseZ + Math.cos(elapsed * 0.12 + mp.phase) * 3.2;
        mp.mesh.position.y = mp.baseY + Math.sin(elapsed * 0.35 + mp.phase) * 0.18;
      }
    }
  }
}
