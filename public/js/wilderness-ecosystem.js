/**
 * Wilderness 360° Living Ecosystem:
 * - River Fish School (InstancedMesh swimming along the winding Forest River)
 * - Articulated Woodland Deer Herd (composite multi-part 3D groups that graze, drink & flee)
 * - Nighttime Riverbank Fireflies (InstancedMesh glowing softly at dusk/night)
 * - Dynamic Rain Streaks & Dawn River Mist (InstancedMesh; rain boosts waterwheel speed)
 * - Shallow Ford Water Splashes when wading through the river
 * - Interactive Reforestation Saplings (grow over 90s into full harvestable trees)
 * - Rare Ancient Highland Trees marked on outer ridges with golden-amber rings & bonus yield
 */

import * as THREE from 'three';
import {
  STREAM_WATER_Y,
  WILDERNESS_RADIUS,
  getStreamCenterX,
  getStreamHalfWidth,
  getStreamTangentAngle,
  getStreamInfo,
  groundHeightAt
} from './wilderness-map.js';
import { createTreeModel, FOREST_ASSETS, disposeObject3D } from './models.js';

const _dummy = new THREE.Object3D();
const _colorTmp = new THREE.Color();
const _vA = new THREE.Vector3();

const SAPLING_GROW_SECONDS = 90;

export class WildernessEcosystem {
  constructor(world, options = {}) {
    this.world = world;
    this.scene = world.scene;
    this.lowSpec = Boolean(options.lowSpec);
    this.root = new THREE.Group();
    this.root.name = 'WildernessEcosystemRoot';
    this.root.userData.wildernessKeep = true;
    this.scene.add(this.root);

    this.fishInst = null;
    this.fishData = [];
    this.deerList = [];
    this.fireflyInst = null;
    this.fireflyMat = null;
    this.fireflyData = [];

    this.rainInst = null;
    this.rainMat = null;
    this.rainData = [];
    this.mistPlanes = [];

    this.splashPool = [];
    this.activeSplashes = [];
    this.splashStepAccum = 0;

    this.saplings = [];
    this._saplingSeq = 1;

    this.buildFishSchool();
    this.buildDeerHerd();
    this.buildFireflies();
    this.buildRainAndMist();
    this.initSplashPool();
    this.markAncientHighlandTrees();
  }

  // ---------------------------------------------------------------------------
  // 1. River Fish School (InstancedMesh swimming below the translucent water)
  // ---------------------------------------------------------------------------
  buildFishSchool() {
    const count = this.lowSpec ? 14 : 26;
    const fishGeo = new THREE.ConeGeometry(0.11, 0.52, 5);
    fishGeo.scale(0.52, 1.0, 1.0);
    fishGeo.rotateX(Math.PI / 2);

    const fishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.34,
      metalness: 0.25
    });
    this.fishInst = new THREE.InstancedMesh(fishGeo, fishMat, count);
    this.fishInst.frustumCulled = false;
    this.fishInst.renderOrder = 1;
    this.root.add(this.fishInst);

    const palette = [0x94b8c8, 0xe29864, 0x6ea6b5, 0xd4a45c];
    for (let i = 0; i < count; i++) {
      const z = -90 + (i / count) * 180 + (Math.random() - 0.5) * 6;
      const lateral = (Math.random() - 0.5) * 0.65;
      const dir = i % 3 === 0 ? -1 : 1;
      this.fishData.push({
        z,
        lateral,
        dir,
        speed: (1.1 + Math.random() * 1.15) * dir,
        phase: Math.random() * Math.PI * 2,
        scale: 0.78 + Math.random() * 0.52
      });
      _colorTmp.setHex(palette[i % palette.length]);
      this.fishInst.setColorAt(i, _colorTmp);
    }
    if (this.fishInst.instanceColor) this.fishInst.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------------------
  // 2. Articulated Woodland Deer Herd (Multi-Part Composite 3D Models)
  // ---------------------------------------------------------------------------
  buildDeerHerd() {
    const count = this.lowSpec ? 3 : 5;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa66f42, roughness: 0.86, metalness: 0.02 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xe5d3b8, roughness: 0.9, metalness: 0.0 });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.82, metalness: 0.05 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd9c7a8, roughness: 0.72, metalness: 0.04 });

    const bodyGeo = new THREE.CapsuleGeometry(0.28, 0.72, 4, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.16, 0.54, 6);
    const headGeo = new THREE.BoxGeometry(0.22, 0.22, 0.38);
    const earGeo = new THREE.ConeGeometry(0.055, 0.16, 4);
    const legGeo = new THREE.CylinderGeometry(0.045, 0.036, 0.64, 5);
    legGeo.translate(0, -0.32, 0);
    const tailGeo = new THREE.ConeGeometry(0.07, 0.22, 4);
    const antlerGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.34, 4);

    const anchors = [
      { x: -16, z: -18 },
      { x: 6, z: -26 },
      { x: 34, z: 14 },
      { x: -24, z: 22 },
      { x: 32, z: -28 }
    ];

    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 0.84, 0);
      body.castShadow = !this.lowSpec;
      g.add(body);

      const belly = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.64), bellyMat);
      belly.position.set(0, 0.66, 0);
      g.add(belly);

      const neckPivot = new THREE.Group();
      neckPivot.position.set(0, 0.96, 0.38);
      const neck = new THREE.Mesh(neckGeo, bodyMat);
      neck.position.set(0, 0.22, 0.08);
      neck.rotation.x = 0.34;
      neckPivot.add(neck);

      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0, 0.46, 0.22);
      neckPivot.add(head);

      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(earGeo, bellyMat);
        ear.position.set(side * 0.13, 0.58, 0.12);
        ear.rotation.z = -side * 0.48;
        neckPivot.add(ear);

        if (i % 2 === 0) {
          const ant = new THREE.Mesh(antlerGeo, antlerMat);
          ant.position.set(side * 0.1, 0.68, 0.16);
          ant.rotation.z = -side * 0.36;
          ant.rotation.x = -0.18;
          neckPivot.add(ant);
        }
      }
      g.add(neckPivot);

      const tail = new THREE.Mesh(tailGeo, bellyMat);
      tail.position.set(0, 0.92, -0.56);
      tail.rotation.x = -0.5;
      g.add(tail);

      const legs = [];
      const legCoords = [
        [-0.14, 0.64, 0.34],
        [0.14, 0.64, 0.34],
        [-0.14, 0.64, -0.34],
        [0.14, 0.64, -0.34]
      ];
      for (const [lx, ly, lz] of legCoords) {
        const leg = new THREE.Mesh(legGeo, hoofMat);
        leg.position.set(lx, ly, lz);
        g.add(leg);
        legs.push(leg);
      }

      const home = anchors[i % anchors.length];
      const y = groundHeightAt(home.x, home.z);
      g.position.set(home.x, y, home.z);
      this.root.add(g);

      this.deerList.push({
        group: g,
        neckPivot,
        legs,
        homeX: home.x,
        homeZ: home.z,
        x: home.x,
        z: home.z,
        targetX: home.x + 6,
        targetZ: home.z + 4,
        yaw: Math.random() * Math.PI * 2,
        state: 'graze', // 'graze' | 'walk' | 'flee'
        stateTimer: 2 + Math.random() * 5,
        walkPhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Nighttime Riverbank Fireflies (InstancedMesh)
  // ---------------------------------------------------------------------------
  buildFireflies() {
    const count = this.lowSpec ? 22 : 48;
    const geo = new THREE.OctahedronGeometry(0.085, 0);
    this.fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xd9f99d,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.fireflyInst = new THREE.InstancedMesh(geo, this.fireflyMat, count);
    this.fireflyInst.frustumCulled = false;
    this.fireflyInst.visible = false;
    this.root.add(this.fireflyInst);

    for (let i = 0; i < count; i++) {
      const z = -68 + (i / count) * 136 + (Math.random() - 0.5) * 6;
      const side = i % 2 === 0 ? -1 : 1;
      const cx = getStreamCenterX(z);
      const hw = getStreamHalfWidth(z);
      const x = cx + side * (hw + 1.2 + Math.random() * 8.5);
      const baseY = groundHeightAt(x, z);
      this.fireflyData.push({
        x,
        z,
        baseY,
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.9,
        radius: 0.7 + Math.random() * 1.4
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Dynamic Forest Rain & Dawn River Mist
  // ---------------------------------------------------------------------------
  buildRainAndMist() {
    const rainCount = this.lowSpec ? 140 : 280;
    const rainGeo = new THREE.BoxGeometry(0.025, 0.82, 0.025);
    this.rainMat = new THREE.MeshBasicMaterial({
      color: 0xcbe8ff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });
    this.rainInst = new THREE.InstancedMesh(rainGeo, this.rainMat, rainCount);
    this.rainInst.frustumCulled = false;
    this.rainInst.visible = false;
    this.root.add(this.rainInst);

    for (let i = 0; i < rainCount; i++) {
      this.rainData.push({
        ox: (Math.random() - 0.5) * 44,
        oy: Math.random() * 20,
        oz: (Math.random() - 0.5) * 44,
        speed: 17 + Math.random() * 7
      });
    }

    // Soft translucent mist layers hovering low over the river at dawn/rain
    const mistGeo = new THREE.PlaneGeometry(16, 26);
    mistGeo.rotateX(-Math.PI / 2);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xe6f3fa,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.mistMat = mistMat;
    for (let i = 0; i < 6; i++) {
      const mz = -55 + i * 22;
      const mx = getStreamCenterX(mz);
      const m = new THREE.Mesh(mistGeo, mistMat);
      m.position.set(mx, STREAM_WATER_Y + 0.48, mz);
      m.rotation.y = getStreamTangentAngle(mz);
      m.visible = false;
      this.root.add(m);
      this.mistPlanes.push({ mesh: m, baseX: mx, baseZ: mz, phase: i * 1.1 });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Water Wade Splash Ripples Pool
  // ---------------------------------------------------------------------------
  initSplashPool() {
    const ringGeo = new THREE.RingGeometry(0.18, 0.28, 18);
    ringGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe0f7ff,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const m = new THREE.Mesh(ringGeo, mat);
      m.visible = false;
      m.renderOrder = 3;
      this.root.add(m);
      this.splashPool.push(m);
    }
  }

  spawnWaterRipple(x, z) {
    const mesh = this.splashPool.pop();
    if (!mesh) return;
    mesh.position.set(x, STREAM_WATER_Y + 0.05, z);
    mesh.scale.setScalar(0.5);
    mesh.material.opacity = 0.72;
    mesh.visible = true;
    this.activeSplashes.push({ mesh, t: 0, dur: 0.75 });
  }

  // ---------------------------------------------------------------------------
  // 6. Rare Ancient Highland Trees (Outer Ridges — High Value & Golden Aura)
  // ---------------------------------------------------------------------------
  markAncientHighlandTrees() {
    if (!this.world?.trees?.length) return;
    const candidates = this.world.trees
      .filter((t) => t.alive && Math.hypot(t.pos.x, t.pos.z) >= 44 && (t.role === 'hero' || t.kind === 'redwood' || t.kind === 'oak'))
      .sort((a, b) => Math.hypot(b.pos.x, b.pos.z) - Math.hypot(a.pos.x, a.pos.z));

    const picked = [];
    const ringGeo = new THREE.RingGeometry(1.15, 1.48, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    for (const t of candidates) {
      if (picked.length >= 8) break;
      const tooClose = picked.some((p) => Math.hypot(p.pos.x - t.pos.x, p.pos.z - t.pos.z) < 26);
      if (tooClose) continue;
      picked.push(t);
      t.isAncient = true;
      t.kind = 'redwood';
      t.maxHp = 7;
      t.hp = 7;
      t.logYield = 6;
      t.baseScale = Math.max(t.baseScale || 1, 1.18);
      t.mesh.scale.setScalar(t.baseScale);

      const aura = new THREE.Mesh(ringGeo, ringMat);
      aura.position.set(0, 0.16, 0);
      t.mesh.add(aura);
      t.ancientAura = aura;
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Interactive Reforestation Saplings
  // ---------------------------------------------------------------------------
  loadSaplings(savedList = []) {
    for (const s of this.saplings) {
      if (s.group?.parent) s.group.parent.remove(s.group);
      disposeObject3D(s.group);
    }
    this.saplings = [];
    if (!Array.isArray(savedList)) return;
    for (const item of savedList) {
      if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.z)) continue;
      this.spawnSaplingVisual(item.x, item.z, item.kind || 'pine', Number(item.age) || 0);
    }
  }

  serializeSaplings() {
    return this.saplings.map((s) => ({
      x: Number(s.x.toFixed(2)),
      z: Number(s.z.toFixed(2)),
      kind: s.kind,
      age: Number(s.age.toFixed(1))
    }));
  }

  plantSapling(x, z, kind = 'pine') {
    const r = Math.hypot(x, z);
    if (r > WILDERNESS_RADIUS - 6) {
      return { ok: false, reason: 'Vị trí quá sát rìa bản đồ rừng.' };
    }
    const stream = getStreamInfo(x, z);
    if (stream.dist < stream.halfWidth + 2.0) {
      return { ok: false, reason: 'Không thể trồng cây con dưới lòng sông.' };
    }
    if (this.saplings.length >= 24) {
      return { ok: false, reason: 'Đã đạt tối đa 24 cây con đang ươm trong rừng.' };
    }
    for (const s of this.saplings) {
      if (Math.hypot(s.x - x, s.z - z) < 3.2) {
        return { ok: false, reason: 'Hãy cách cây con khác ít nhất 3 mét.' };
      }
    }
    const sap = this.spawnSaplingVisual(x, z, kind, 0);
    return { ok: true, sapling: sap };
  }

  spawnSaplingVisual(x, z, kind = 'pine', age = 0) {
    const y = groundHeightAt(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);

    const mound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.44, 0.14, 7),
      new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 0.94 })
    );
    mound.position.y = 0.05;
    g.add(mound);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.065, 0.85, 5),
      new THREE.MeshStandardMaterial({ color: 0x7c5434, roughness: 0.9 })
    );
    stem.position.y = 0.46;
    g.add(stem);

    const crown = new THREE.Mesh(
      kind === 'oak' ? new THREE.DodecahedronGeometry(0.42, 0) : new THREE.ConeGeometry(0.38, 1.05, 6),
      new THREE.MeshStandardMaterial({ color: kind === 'oak' ? 0x5ea844 : 0x3f8f45, roughness: 0.82, flatShading: true })
    );
    crown.position.y = kind === 'oak' ? 0.96 : 1.05;
    g.add(crown);

    const growth = Math.min(1, age / SAPLING_GROW_SECONDS);
    const sc = 0.55 + growth * 1.45;
    stem.scale.setScalar(sc);
    crown.scale.setScalar(sc);
    this.root.add(g);

    const entry = {
      id: `sap_${this._saplingSeq++}`,
      x,
      z,
      y,
      pos: g.position,
      kind,
      age,
      group: g,
      stem,
      crown
    };
    this.saplings.push(entry);
    return entry;
  }

  promoteSaplingToTree(sap) {
    if (sap.group.parent) sap.group.parent.remove(sap.group);
    disposeObject3D(sap.group);

    const isOak = sap.kind === 'oak';
    const modelUrl = isOak ? FOREST_ASSETS.oakGithub : FOREST_ASSETS.pineGithub;
    const targetHeight = isOak ? 6.4 : 7.6;
    const mesh = createTreeModel(sap.kind, 0, { modelUrl, targetHeight });
    mesh.position.set(sap.x, sap.y - 0.08, sap.z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.setScalar(1.0);
    mesh.userData.wildernessKeep = true;
    this.world.worldGroup.add(mesh);

    this.world.trees.push({
      id: `planted_${sap.id}`,
      clusterId: 'planted',
      clusterName: 'Rừng Tái Sinh',
      role: 'canopy',
      kind: sap.kind,
      mesh,
      pos: new THREE.Vector3(sap.x, sap.y, sap.z),
      baseScale: 1.0,
      hp: isOak ? 4 : 3,
      maxHp: isOak ? 4 : 3,
      alive: true,
      state: 'standing',
      fallAngle: 0,
      fallVel: 0,
      fallYaw: 0,
      fallenHoldTimer: 0,
      landed: false,
      regrowTimer: 0,
      wobble: 0,
      wobbleAxis: 0,
      logYield: isOak ? 4 : 3
    });
    this.world.spawnParticles(_vA.set(sap.x, sap.y + 1.2, sap.z), 0x86efac, 8);
  }

  // ---------------------------------------------------------------------------
  // Master Per-Frame Ecosystem Simulation (Zero Per-Frame Allocations)
  // ---------------------------------------------------------------------------
  update(dt, elapsed, playerPos, { nightFactor = 0, isRain = false, isDawn = false, playerMoving = false, onWaterStep = null, onSaplingMatured = null } = {}) {
    // 1. River Fish swimming downstream/upstream beneath crystal water
    if (this.fishInst) {
      for (let i = 0; i < this.fishData.length; i++) {
        const f = this.fishData[i];
        f.z += f.speed * dt;
        if (f.z > 98) f.z = -98;
        if (f.z < -98) f.z = 98;
        const cx = getStreamCenterX(f.z);
        const hw = getStreamHalfWidth(f.z);
        const fx = cx + f.lateral * hw * 0.72 + Math.sin(elapsed * 2.1 + f.phase) * 0.32;
        const fy = Math.max(groundHeightAt(fx, f.z) + 0.22, STREAM_WATER_Y - 0.34);
        const tang = getStreamTangentAngle(f.z);
        const yaw = (f.dir >= 0 ? tang : tang + Math.PI) + Math.sin(elapsed * 7.5 + f.phase) * 0.14;
        _dummy.position.set(fx, fy, f.z);
        _dummy.rotation.set(0, yaw, 0);
        _dummy.scale.setScalar(f.scale);
        _dummy.updateMatrix();
        this.fishInst.setMatrixAt(i, _dummy.matrix);
      }
      this.fishInst.instanceMatrix.needsUpdate = true;
    }

    // 2. Woodland Deer Herd (graze, wander toward clearings/river, gently flee player)
    for (let i = 0; i < this.deerList.length; i++) {
      const d = this.deerList[i];
      const distPlayer = playerPos ? Math.hypot(d.x - playerPos.x, d.z - playerPos.z) : 99;
      if (distPlayer < 7.2 && d.state !== 'flee') {
        d.state = 'flee';
        const ang = Math.atan2(d.x - playerPos.x, d.z - playerPos.z) + (Math.random() - 0.5) * 0.6;
        d.targetX = THREE.MathUtils.clamp(d.x + Math.sin(ang) * 16, -WILDERNESS_RADIUS + 14, WILDERNESS_RADIUS - 14);
        d.targetZ = THREE.MathUtils.clamp(d.z + Math.cos(ang) * 16, -WILDERNESS_RADIUS + 14, WILDERNESS_RADIUS - 14);
        d.stateTimer = 4.2;
      }

      d.stateTimer -= dt;
      if (d.state === 'graze') {
        d.neckPivot.rotation.x += (0.82 - d.neckPivot.rotation.x) * Math.min(1, dt * 4);
        for (let l = 0; l < 4; l++) d.legs[l].rotation.x *= Math.max(0, 1 - dt * 8);
        if (d.stateTimer <= 0) {
          d.state = 'walk';
          d.stateTimer = 5 + Math.random() * 5;
          const a = Math.random() * Math.PI * 2;
          const rad = 5 + Math.random() * 14;
          let tx = d.homeX + Math.cos(a) * rad;
          let tz = d.homeZ + Math.sin(a) * rad;
          const sInfo = getStreamInfo(tx, tz);
          if (sInfo.inStream) tx = sInfo.cx + (tx >= sInfo.cx ? 1 : -1) * (sInfo.halfWidth + 2.4);
          d.targetX = tx;
          d.targetZ = tz;
        }
      } else {
        const dx = d.targetX - d.x;
        const dz = d.targetZ - d.z;
        const dist = Math.hypot(dx, dz);
        const speed = d.state === 'flee' ? 4.8 : 1.75;
        if (dist < 1.1 || d.stateTimer <= 0) {
          d.state = 'graze';
          d.stateTimer = 3.5 + Math.random() * 4.5;
        } else {
          const desiredYaw = Math.atan2(dx, dz);
          let diff = desiredYaw - d.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          d.yaw += diff * Math.min(1, dt * 6.5);
          d.x += (dx / dist) * speed * dt;
          d.z += (dz / dist) * speed * dt;
          d.walkPhase += dt * (d.state === 'flee' ? 13 : 6.2);
          const sw = Math.sin(d.walkPhase) * (d.state === 'flee' ? 0.55 : 0.3);
          d.legs[0].rotation.x = sw;
          d.legs[1].rotation.x = -sw;
          d.legs[2].rotation.x = -sw;
          d.legs[3].rotation.x = sw;
          d.neckPivot.rotation.x += (0.06 - d.neckPivot.rotation.x) * Math.min(1, dt * 6);
        }
      }

      const gy = groundHeightAt(d.x, d.z);
      d.group.position.set(d.x, gy, d.z);
      d.group.rotation.y = d.yaw;
    }

    // 3. Nighttime Fireflies
    if (this.fireflyInst && this.fireflyMat) {
      const showFireflies = nightFactor > 0.22;
      this.fireflyInst.visible = showFireflies;
      if (showFireflies) {
        this.fireflyMat.opacity = Math.min(0.92, (nightFactor - 0.22) * 1.4);
        for (let i = 0; i < this.fireflyData.length; i++) {
          const ff = this.fireflyData[i];
          const t = elapsed * ff.speed + ff.phase;
          const fx = ff.x + Math.sin(t) * ff.radius;
          const fz = ff.z + Math.cos(t * 0.85) * ff.radius;
          const fy = ff.baseY + 0.9 + Math.sin(t * 1.6) * 0.45;
          const blink = 0.55 + 0.45 * Math.sin(elapsed * 3.8 + ff.phase * 2.1);
          _dummy.position.set(fx, fy, fz);
          _dummy.rotation.set(0, t, 0);
          _dummy.scale.setScalar(blink);
          _dummy.updateMatrix();
          this.fireflyInst.setMatrixAt(i, _dummy.matrix);
        }
        this.fireflyInst.instanceMatrix.needsUpdate = true;
      }
    }

    // 4. Dynamic Forest Rain Streaks
    if (this.rainInst) {
      this.rainInst.visible = isRain;
      if (isRain && playerPos) {
        for (let i = 0; i < this.rainData.length; i++) {
          const rd = this.rainData[i];
          rd.oy -= rd.speed * dt;
          if (rd.oy < -1.5) rd.oy = 18 + Math.random() * 4;
          _dummy.position.set(playerPos.x + rd.ox, playerPos.y + rd.oy, playerPos.z + rd.oz);
          _dummy.rotation.set(0.08, 0, 0.06);
          _dummy.scale.setScalar(1);
          _dummy.updateMatrix();
          this.rainInst.setMatrixAt(i, _dummy.matrix);
        }
        this.rainInst.instanceMatrix.needsUpdate = true;
      }
    }

    // 5. Dawn / Rain River Mist
    if (this.mistMat) {
      const targetMist = isDawn ? 0.24 : isRain ? 0.16 : 0.0;
      const showMist = targetMist > 0.01;
      this.mistMat.opacity += (targetMist - this.mistMat.opacity) * Math.min(1, dt * 1.8);
      for (let i = 0; i < this.mistPlanes.length; i++) {
        const mp = this.mistPlanes[i];
        mp.mesh.visible = this.mistMat.opacity > 0.015;
        if (mp.mesh.visible) {
          mp.mesh.position.z = mp.baseZ + ((elapsed * 0.8 + mp.phase * 4) % 14) - 7;
          mp.mesh.position.x = getStreamCenterX(mp.mesh.position.z) + Math.sin(elapsed * 0.4 + mp.phase) * 0.8;
        }
      }
    }

    // 6. Player Shallow Ford Water Splashes
    if (playerPos) {
      const sInfo = getStreamInfo(playerPos.x, playerPos.z);
      const wading = sInfo.inStream && playerPos.y <= STREAM_WATER_Y + 0.12;
      if (wading && playerMoving) {
        this.splashStepAccum += dt;
        if (this.splashStepAccum >= 0.34) {
          this.splashStepAccum = 0;
          this.spawnWaterRipple(playerPos.x, playerPos.z);
          this.world.spawnParticles(_vA.set(playerPos.x, STREAM_WATER_Y + 0.08, playerPos.z), 0xe0f7ff, 3);
          if (typeof onWaterStep === 'function') onWaterStep();
        }
      }
    }

    for (let i = this.activeSplashes.length - 1; i >= 0; i--) {
      const sp = this.activeSplashes[i];
      sp.t += dt;
      const p = sp.t / sp.dur;
      if (p >= 1) {
        sp.mesh.visible = false;
        this.splashPool.push(sp.mesh);
        this.activeSplashes.splice(i, 1);
      } else {
        sp.mesh.scale.setScalar(0.5 + p * 3.8);
        sp.mesh.material.opacity = (1 - p) * 0.65;
      }
    }

    // 7. Sapling Growth -> Real Harvestable Trees
    for (let i = this.saplings.length - 1; i >= 0; i--) {
      const sap = this.saplings[i];
      sap.age += dt * (isRain ? 1.35 : 1.0);
      const g = Math.min(1, sap.age / SAPLING_GROW_SECONDS);
      const sc = 0.55 + g * 1.45;
      sap.stem.scale.setScalar(sc);
      sap.crown.scale.setScalar(sc);
      if (sap.age >= SAPLING_GROW_SECONDS) {
        this.saplings.splice(i, 1);
        this.promoteSaplingToTree(sap);
        if (typeof onSaplingMatured === 'function') onSaplingMatured(sap);
      }
    }
  }

  dispose() {
    if (this.root.parent) this.root.parent.remove(this.root);
    disposeObject3D(this.root);
    this.fishData = [];
    this.deerList = [];
    this.fireflyData = [];
    this.rainData = [];
    this.mistPlanes = [];
    this.activeSplashes = [];
    this.splashPool = [];
    this.saplings = [];
  }
}
