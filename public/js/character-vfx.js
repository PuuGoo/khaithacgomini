/**
 * TimberPort 3D — Character Visual Effects Suite (Zero-GC Pooled & Instanced)
 *  1. Dynamic Axe Slash Ribbon Trail (evolves by Axe Tier & Combo/Crit)
 *  2. Directional Wood Chips, Bark Splinters, Crit Sparks & Shockwave Ring
 *  3. Sprint Wind Streaks (speed-driven air lines at shoulders/hips)
 *  4. Terrain-Conforming Boot Footprints (synced with Foot-Locking IK)
 */
import * as THREE from 'three';

const _v0 = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _quat = new THREE.Quaternion();

function createBootPrintTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, 64, 128);

  // Forefoot sole
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.ellipse(32, 38, 18, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boot heel
  ctx.beginPath();
  ctx.ellipse(32, 98, 15, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle tread grooves for realistic boot impression
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  for (let y = 20; y <= 54; y += 9) {
    ctx.fillRect(14, y, 36, 3);
  }
  ctx.fillRect(16, 92, 32, 3);
  ctx.fillRect(16, 102, 32, 3);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class CharacterVfxSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lowSpec = Boolean(options.lowSpec);
    this.qualityScale = 1.0;

    this.root = new THREE.Group();
    this.root.name = 'CharacterVfxSystem';
    this.scene.add(this.root);

    this._initSlashTrail();
    this._initWoodChips();
    this._initCritSparksAndWave();
    this._initSprintWind();
    this._initFootprints();
  }

  // -------------------------------------------------------------------------
  // 1. Dynamic Axe Slash Ribbon Trail (Zero-GC Ring Buffer)
  // -------------------------------------------------------------------------
  _initSlashTrail() {
    this._trailMaxPts = 14;
    this._trailPtsBase = Array.from({ length: this._trailMaxPts }, () => new THREE.Vector3());
    this._trailPtsTip = Array.from({ length: this._trailMaxPts }, () => new THREE.Vector3());
    this._trailAges = new Float32Array(this._trailMaxPts);
    this._trailCount = 0;
    this._trailSampleTimer = 0;

    const vertCount = this._trailMaxPts * 2;
    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);
    const indices = [];
    for (let i = 0; i < this._trailMaxPts - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    this._trailGeo = new THREE.BufferGeometry();
    this._trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._trailGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this._trailGeo.setIndex(indices);

    this._trailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this._trailMesh = new THREE.Mesh(this._trailGeo, this._trailMat);
    this._trailMesh.frustumCulled = false;
    this._trailMesh.renderOrder = 6;
    this._trailMesh.visible = false;
    this.root.add(this._trailMesh);

    this._trailColorCore = new THREE.Color(0xe2e8f0);
    this._trailColorEdge = new THREE.Color(0x94a3b8);
  }

  _selectTrailPalette(axeTier = 1, combo = 0, isCrit = false) {
    if (isCrit || combo >= 4) {
      this._trailColorCore.setHex(0xfffbeb);
      this._trailColorEdge.setHex(0xf59e0b);
    } else if (axeTier >= 3) {
      this._trailColorCore.setHex(0xfef08a);
      this._trailColorEdge.setHex(0xd97706);
    } else if (axeTier === 2) {
      this._trailColorCore.setHex(0xe0f2fe);
      this._trailColorEdge.setHex(0x38bdf8);
    } else {
      this._trailColorCore.setHex(0xf1f5f9);
      this._trailColorEdge.setHex(0x94a3b8);
    }
  }

  updateSlashTrail(dt, active, baseWorld, tipWorld, axeTier = 1, combo = 0, isCrit = false) {
    const maxLife = 0.19;
    // Age existing samples
    for (let i = 0; i < this._trailCount; i++) {
      this._trailAges[i] += dt;
    }
    // Prune expired tail points
    while (this._trailCount > 0 && this._trailAges[this._trailCount - 1] >= maxLife) {
      this._trailCount--;
    }

    if (active && baseWorld && tipWorld) {
      this._trailSampleTimer += dt;
      if (this._trailCount === 0 || this._trailSampleTimer >= 0.012) {
        this._trailSampleTimer = 0;
        const cap = this._trailMaxPts;
        const shiftEnd = Math.min(this._trailCount, cap - 1);
        for (let i = shiftEnd; i > 0; i--) {
          this._trailPtsBase[i].copy(this._trailPtsBase[i - 1]);
          this._trailPtsTip[i].copy(this._trailPtsTip[i - 1]);
          this._trailAges[i] = this._trailAges[i - 1];
        }
        this._trailPtsBase[0].copy(baseWorld);
        this._trailPtsTip[0].copy(tipWorld);
        this._trailAges[0] = 0;
        if (this._trailCount < cap) this._trailCount++;
      } else if (this._trailCount > 0) {
        this._trailPtsBase[0].copy(baseWorld);
        this._trailPtsTip[0].copy(tipWorld);
      }
    }

    if (this._trailCount < 2) {
      this._trailMesh.visible = false;
      return;
    }

    this._selectTrailPalette(axeTier, combo, isCrit);
    const posAttr = this._trailGeo.attributes.position;
    const colAttr = this._trailGeo.attributes.color;
    const posArr = posAttr.array;
    const colArr = colAttr.array;

    for (let i = 0; i < this._trailMaxPts; i++) {
      const idx = Math.min(i, this._trailCount - 1);
      const life = Math.max(0, 1 - this._trailAges[idx] / maxLife);
      const fade = i < this._trailCount ? life * life : 0;

      const b = this._trailPtsBase[idx];
      const t = this._trailPtsTip[idx];
      const vBase = i * 6;
      posArr[vBase] = b.x;
      posArr[vBase + 1] = b.y;
      posArr[vBase + 2] = b.z;
      posArr[vBase + 3] = t.x;
      posArr[vBase + 4] = t.y;
      posArr[vBase + 5] = t.z;

      // Base edge softer, outer cutting tip brighter
      const fBase = fade * 0.32;
      const fTip = fade * 1.0;
      colArr[vBase] = this._trailColorEdge.r * fBase;
      colArr[vBase + 1] = this._trailColorEdge.g * fBase;
      colArr[vBase + 2] = this._trailColorEdge.b * fBase;
      colArr[vBase + 3] = this._trailColorCore.r * fTip;
      colArr[vBase + 4] = this._trailColorCore.g * fTip;
      colArr[vBase + 5] = this._trailColorCore.b * fTip;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this._trailMesh.visible = true;
  }

  // -------------------------------------------------------------------------
  // 2. Instanced Directional Wood Chips & Bark Splinters
  // -------------------------------------------------------------------------
  _initWoodChips() {
    this._chipCap = this.lowSpec ? 48 : 96;
    const geo = new THREE.BoxGeometry(0.11, 0.032, 0.055);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0.04
    });
    this._chipMesh = new THREE.InstancedMesh(geo, mat, this._chipCap);
    this._chipMesh.frustumCulled = false;
    this._chipMesh.castShadow = false;
    this._chipMesh.receiveShadow = false;
    this._chipMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this._chips = Array.from({ length: this._chipCap }, () => ({
      active: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0,
      vrx: 0, vry: 0, vrz: 0,
      scale: 1,
      age: 0,
      life: 0.8,
      bounced: false
    }));
    this._chipCursor = 0;

    _dummy.position.set(0, -999, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    for (let i = 0; i < this._chipCap; i++) {
      this._chipMesh.setMatrixAt(i, _dummy.matrix);
      this._chipMesh.setColorAt(i, _color.setHex(0xd4a373));
    }
    this._chipMesh.instanceMatrix.needsUpdate = true;
    if (this._chipMesh.instanceColor) this._chipMesh.instanceColor.needsUpdate = true;
    this.root.add(this._chipMesh);
  }

  spawnChopImpact(impactPos, swingDirX = 0, swingDirZ = 1, isCrit = false, isAncient = false) {
    const q = Math.max(0.45, this.qualityScale);
    const count = Math.max(4, Math.round((isCrit ? 18 : 10) * q));

    // Tangential spray perpendicular & outward from blade cut
    const len = Math.hypot(swingDirX, swingDirZ) || 1;
    const dx = swingDirX / len;
    const dz = swingDirZ / len;
    const tx = -dz;
    const tz = dx;

    for (let i = 0; i < count; i++) {
      const idx = this._chipCursor;
      this._chipCursor = (this._chipCursor + 1) % this._chipCap;
      const p = this._chips[idx];
      p.active = true;
      p.x = impactPos.x + (Math.random() - 0.5) * 0.28;
      p.y = impactPos.y + (Math.random() - 0.5) * 0.24;
      p.z = impactPos.z + (Math.random() - 0.5) * 0.28;

      const side = (Math.random() - 0.5) * 2.0;
      const speed = (isCrit ? 4.4 : 2.9) + Math.random() * 2.4;
      p.vx = (-dx * 0.65 + tx * side * 0.95) * speed + (Math.random() - 0.5) * 1.1;
      p.vy = (isCrit ? 3.2 : 2.1) + Math.random() * 2.4;
      p.vz = (-dz * 0.65 + tz * side * 0.95) * speed + (Math.random() - 0.5) * 1.1;

      p.rx = Math.random() * Math.PI * 2;
      p.ry = Math.random() * Math.PI * 2;
      p.rz = Math.random() * Math.PI * 2;
      p.vrx = (Math.random() - 0.5) * 16;
      p.vry = (Math.random() - 0.5) * 16;
      p.vrz = (Math.random() - 0.5) * 14;
      p.scale = (isCrit ? 1.15 : 0.85) * (0.65 + Math.random() * 0.75);
      p.age = 0;
      p.life = 0.65 + Math.random() * 0.45;
      p.bounced = false;

      // Alternate bark brown & fresh bright sapwood gold
      const isBark = i % 3 === 0;
      if (isAncient && !isBark) _color.setHex(0xfde68a);
      else _color.setHex(isBark ? 0x6b4226 : (i % 2 === 0 ? 0xe6be8a : 0xd4a373));
      this._chipMesh.setColorAt(idx, _color);
    }
    if (this._chipMesh.instanceColor) this._chipMesh.instanceColor.needsUpdate = true;

    if (isCrit) {
      this._spawnCritSparksAndWave(impactPos, dx, dz);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Crit Sparks & Shockwave Ring
  // -------------------------------------------------------------------------
  _initCritSparksAndWave() {
    this._sparkCap = this.lowSpec ? 24 : 48;
    const sparkGeo = new THREE.BoxGeometry(0.028, 0.028, 0.22);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, this._sparkCap);
    this._sparkMesh.frustumCulled = false;
    this._sparkMesh.renderOrder = 7;
    this._sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this._sparks = Array.from({ length: this._sparkCap }, () => ({
      active: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      age: 0,
      life: 0.35
    }));
    this._sparkCursor = 0;

    _dummy.position.set(0, -999, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    for (let i = 0; i < this._sparkCap; i++) {
      this._sparkMesh.setMatrixAt(i, _dummy.matrix);
      this._sparkMesh.setColorAt(i, _color.setHex(0xfbbf24));
    }
    this._sparkMesh.instanceMatrix.needsUpdate = true;
    if (this._sparkMesh.instanceColor) this._sparkMesh.instanceColor.needsUpdate = true;
    this.root.add(this._sparkMesh);

    // Expanding horizontal amber shockwave ring on Crit impact
    const waveGeo = new THREE.RingGeometry(0.42, 0.62, 24);
    waveGeo.rotateX(-Math.PI / 2);
    this._waveMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this._waveMesh = new THREE.Mesh(waveGeo, this._waveMat);
    this._waveMesh.visible = false;
    this._waveMesh.renderOrder = 7;
    this._waveAge = 1;
    this._waveLife = 0.34;
    this.root.add(this._waveMesh);
  }

  _spawnCritSparksAndWave(pos, dx, dz) {
    const count = Math.max(8, Math.round(18 * Math.max(0.5, this.qualityScale)));
    for (let i = 0; i < count; i++) {
      const idx = this._sparkCursor;
      this._sparkCursor = (this._sparkCursor + 1) % this._sparkCap;
      const s = this._sparks[idx];
      s.active = true;
      s.x = pos.x;
      s.y = pos.y;
      s.z = pos.z;
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 4.6 + Math.random() * 4.5;
      s.vx = Math.cos(a) * spd - dx * 1.4;
      s.vy = 1.6 + Math.random() * 3.8;
      s.vz = Math.sin(a) * spd - dz * 1.4;
      s.age = 0;
      s.life = 0.24 + Math.random() * 0.20;
      _color.setHex(i % 2 === 0 ? 0xfffbeb : 0xf59e0b);
      this._sparkMesh.setColorAt(idx, _color);
    }
    if (this._sparkMesh.instanceColor) this._sparkMesh.instanceColor.needsUpdate = true;

    this._waveMesh.position.set(pos.x, pos.y - 0.15, pos.z);
    this._waveMesh.scale.setScalar(0.35);
    this._waveMesh.visible = true;
    this._waveAge = 0;
  }

  // -------------------------------------------------------------------------
  // 4. Sprint Wind Streaks (Pooled 12 thin air ribbons)
  // -------------------------------------------------------------------------
  _initSprintWind() {
    this._windCap = this.lowSpec ? 6 : 12;
    const geo = new THREE.PlaneGeometry(0.045, 0.92);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this._windMesh = new THREE.InstancedMesh(geo, mat, this._windCap);
    this._windMesh.frustumCulled = false;
    this._windMesh.renderOrder = 5;
    this._windMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this._winds = Array.from({ length: this._windCap }, () => ({
      active: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      yaw: 0,
      age: 0,
      life: 0.28
    }));
    this._windCursor = 0;
    this._windSpawnTimer = 0;

    _dummy.position.set(0, -999, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    for (let i = 0; i < this._windCap; i++) {
      this._windMesh.setMatrixAt(i, _dummy.matrix);
    }
    this._windMesh.instanceMatrix.needsUpdate = true;
    this.root.add(this._windMesh);
  }

  _updateSprintWind(dt, playerPos, playerYaw, speed, combo = 0) {
    const activeSprint = speed > 5.85 || (speed > 4.35 && combo >= 3);
    if (activeSprint) {
      this._windSpawnTimer -= dt;
      if (this._windSpawnTimer <= 0) {
        this._windSpawnTimer = speed > 7.0 ? 0.038 : 0.064;
        const idx = this._windCursor;
        this._windCursor = (this._windCursor + 1) % this._windCap;
        const w = this._winds[idx];
        const fx = Math.sin(playerYaw);
        const fz = Math.cos(playerYaw);
        const rx = Math.cos(playerYaw);
        const rz = -Math.sin(playerYaw);
        const side = (Math.random() < 0.5 ? -1 : 1) * (0.38 + Math.random() * 0.34);

        w.active = true;
        w.x = playerPos.x + rx * side + fx * 0.25;
        w.y = playerPos.y + 0.72 + Math.random() * 0.92;
        w.z = playerPos.z + rz * side + fz * 0.25;
        w.vx = -fx * (speed * 0.65 + 2.8);
        w.vy = (Math.random() - 0.5) * 0.25;
        w.vz = -fz * (speed * 0.65 + 2.8);
        w.yaw = playerYaw;
        w.age = 0;
        w.life = 0.22 + Math.random() * 0.10;
      }
    }

    let dirty = false;
    for (let i = 0; i < this._windCap; i++) {
      const w = this._winds[i];
      if (!w.active) continue;
      dirty = true;
      w.age += dt;
      if (w.age >= w.life) {
        w.active = false;
        _dummy.position.set(0, -999, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this._windMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.z += w.vz * dt;
      const t = w.age / w.life;
      const env = Math.sin(t * Math.PI);
      _dummy.position.set(w.x, w.y, w.z);
      _dummy.rotation.set(0, w.yaw, 0);
      _dummy.scale.set(0.6 + env * 0.65, 1, 0.5 + env * 1.15);
      _dummy.updateMatrix();
      this._windMesh.setMatrixAt(i, _dummy.matrix);
    }
    if (dirty) this._windMesh.instanceMatrix.needsUpdate = true;
  }

  // -------------------------------------------------------------------------
  // 5. Terrain-Conforming Boot Footprints (Synced with Foot-Locking IK)
  // -------------------------------------------------------------------------
  _initFootprints() {
    this._fpCap = this.lowSpec ? 22 : 44;
    const tex = createBootPrintTexture();
    const geo = new THREE.PlaneGeometry(0.18, 0.34);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this._fpMesh = new THREE.InstancedMesh(geo, mat, this._fpCap);
    this._fpMesh.frustumCulled = false;
    this._fpMesh.renderOrder = 2;
    this._fpMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this._fps = Array.from({ length: this._fpCap }, () => ({
      active: false,
      x: 0, y: 0, z: 0,
      yaw: 0,
      side: 1,
      age: 0,
      life: 6.2
    }));
    this._fpCursor = 0;

    _dummy.position.set(0, -999, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    for (let i = 0; i < this._fpCap; i++) {
      this._fpMesh.setMatrixAt(i, _dummy.matrix);
      this._fpMesh.setColorAt(i, _color.setHex(0x3a2a1d));
    }
    this._fpMesh.instanceMatrix.needsUpdate = true;
    if (this._fpMesh.instanceColor) this._fpMesh.instanceColor.needsUpdate = true;
    this.root.add(this._fpMesh);
  }

  spawnFootprint(worldX, worldY, worldZ, yaw, side = 'left', surface = 'grass') {
    if (surface === 'water' || surface === 'wood') return;
    const idx = this._fpCursor;
    this._fpCursor = (this._fpCursor + 1) % this._fpCap;
    const fp = this._fps[idx];
    fp.active = true;
    fp.x = worldX;
    fp.y = worldY + 0.025;
    fp.z = worldZ;
    fp.yaw = yaw;
    fp.side = side === 'left' ? 1 : -1;
    fp.age = 0;
    fp.life = surface === 'earth' ? 7.2 : 5.2;

    if (surface === 'earth') _color.setHex(0x2b1d12);
    else _color.setHex(0x2f3e24);
    this._fpMesh.setColorAt(idx, _color);
    if (this._fpMesh.instanceColor) this._fpMesh.instanceColor.needsUpdate = true;

    _dummy.position.set(fp.x, fp.y, fp.z);
    _dummy.rotation.set(0, fp.yaw, 0);
    _dummy.scale.set(fp.side, 1, 1);
    _dummy.updateMatrix();
    this._fpMesh.setMatrixAt(idx, _dummy.matrix);
    this._fpMesh.instanceMatrix.needsUpdate = true;
  }

  // -------------------------------------------------------------------------
  // Main Per-Frame Update (Zero-GC)
  // -------------------------------------------------------------------------
  update(dt, ctx = null) {
    const safeDt = Math.min(0.05, Math.max(0.001, dt));
    const getGroundHeight = ctx?.getGroundHeight || null;

    // 1. Update Wood Chips
    let chipsDirty = false;
    for (let i = 0; i < this._chipCap; i++) {
      const p = this._chips[i];
      if (!p.active) continue;
      chipsDirty = true;
      p.age += safeDt;
      if (p.age >= p.life) {
        p.active = false;
        _dummy.position.set(0, -999, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this._chipMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      p.vy -= 14.5 * safeDt;
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      p.z += p.vz * safeDt;
      p.rx += p.vrx * safeDt;
      p.ry += p.vry * safeDt;
      p.rz += p.vrz * safeDt;

      const gy = getGroundHeight ? getGroundHeight(p.x, p.z) + 0.03 : 0.03;
      if (p.y < gy) {
        p.y = gy;
        if (!p.bounced) {
          p.bounced = true;
          p.vy = Math.abs(p.vy) * 0.28;
          p.vx *= 0.45;
          p.vz *= 0.45;
          p.vrx *= 0.35;
          p.vry *= 0.35;
          p.vrz *= 0.35;
        } else {
          p.vy = 0;
          p.vx *= 0.8;
          p.vz *= 0.8;
        }
      }

      const fade = 1 - Math.max(0, (p.age - p.life * 0.65) / (p.life * 0.35));
      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.rx, p.ry, p.rz);
      _dummy.scale.setScalar(Math.max(0.001, p.scale * fade));
      _dummy.updateMatrix();
      this._chipMesh.setMatrixAt(i, _dummy.matrix);
    }
    if (chipsDirty) this._chipMesh.instanceMatrix.needsUpdate = true;

    // 2. Update Crit Sparks & Shockwave Ring
    let sparksDirty = false;
    for (let i = 0; i < this._sparkCap; i++) {
      const s = this._sparks[i];
      if (!s.active) continue;
      sparksDirty = true;
      s.age += safeDt;
      if (s.age >= s.life) {
        s.active = false;
        _dummy.position.set(0, -999, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this._sparkMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      s.vy -= 11.5 * safeDt;
      s.x += s.vx * safeDt;
      s.y += s.vy * safeDt;
      s.z += s.vz * safeDt;

      const fade = 1 - s.age / s.life;
      _v0.set(s.vx, s.vy, s.vz);
      if (_v0.lengthSq() > 0.001) {
        _v0.normalize();
        _quat.setFromUnitVectors(_v1.set(0, 0, 1), _v0);
      } else {
        _quat.identity();
      }
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.quaternion.copy(_quat);
      _dummy.scale.set(fade, fade, 0.5 + fade * 1.15);
      _dummy.updateMatrix();
      this._sparkMesh.setMatrixAt(i, _dummy.matrix);
    }
    if (sparksDirty) this._sparkMesh.instanceMatrix.needsUpdate = true;

    if (this._waveMesh.visible) {
      this._waveAge += safeDt;
      if (this._waveAge >= this._waveLife) {
        this._waveMesh.visible = false;
      } else {
        const t = this._waveAge / this._waveLife;
        const ease = 1 - (1 - t) * (1 - t);
        this._waveMesh.scale.setScalar(0.35 + ease * 2.8);
        this._waveMat.opacity = (1 - t) * 0.72;
      }
    }

    // 3. Update Sprint Wind Streaks
    if (ctx?.playerPos && !ctx.inVehicle) {
      this._updateSprintWind(safeDt, ctx.playerPos, ctx.playerYaw || 0, ctx.speed || 0, ctx.combo || 0);
    }

    // 4. Update Boot Footprints (gentle shrink-fade near end of life)
    let fpDirty = false;
    for (let i = 0; i < this._fpCap; i++) {
      const fp = this._fps[i];
      if (!fp.active) continue;
      fp.age += safeDt;
      if (fp.age >= fp.life) {
        fp.active = false;
        fpDirty = true;
        _dummy.position.set(0, -999, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this._fpMesh.setMatrixAt(i, _dummy.matrix);
      } else if (fp.age > fp.life * 0.7) {
        fpDirty = true;
        const fade = Math.max(0.01, 1 - (fp.age - fp.life * 0.7) / (fp.life * 0.3));
        _dummy.position.set(fp.x, fp.y, fp.z);
        _dummy.rotation.set(0, fp.yaw, 0);
        _dummy.scale.set(fp.side * fade, 1, fade);
        _dummy.updateMatrix();
        this._fpMesh.setMatrixAt(i, _dummy.matrix);
      }
    }
    if (fpDirty) this._fpMesh.instanceMatrix.needsUpdate = true;

    // 5. Update Axe Slash Trail from live blade world segment
    if (ctx?.getBladeSegment) {
      const active = Boolean(ctx.slashActive);
      let hasSeg = false;
      if (active) {
        hasSeg = Boolean(ctx.getBladeSegment(_v2, _v3));
      }
      this.updateSlashTrail(
        safeDt,
        active && hasSeg,
        hasSeg ? _v2 : null,
        hasSeg ? _v3 : null,
        ctx.axeTier || 1,
        ctx.combo || 0,
        Boolean(ctx.isCritSwing)
      );
    }
  }
}
