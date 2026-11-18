/**
 * TimberPort 3D — Stylized Low-Poly PBR Peninsula Biome & World Systems
 * Zero-leak Object Pools (Particles, Flying Arcs), In-Place CanvasTexture Arcade Pads,
 * Adaptive Instanced Perimeter for <8GB RAM & Integrated GPUs
 */

import * as THREE from 'three';
import {
  getGrassTexture,
  getAsphaltTexture,
  getWaterTexture,
  drawRadialProgressToCanvas,
  drawWorldBadgeToCanvas,
  makeWorldBadgeSprite
} from './textures.js';
import {
  createTreeModel,
  createSawmillModel,
  createHarborStructure,
  createLogMesh,
  createPlankMesh,
  disposeObject3D
} from './models.js';
import { gameState, getUpgradeCost, UPGRADE_CATALOG } from './state.js';

export const WORLD_BOUNDS = { minX: -42, maxX: 42, minZ: -38, maxZ: 34 };

export const ZONES = {
  hopper: new THREE.Vector3(-4, 0, -14),
  sawOutput: new THREE.Vector3(8, 0, -14),
  vehicleSpawn: new THREE.Vector3(-10, 0, 4),
  harborExport: new THREE.Vector3(8.5, 0.5, 31),
  canneryDock: new THREE.Vector3(-6.5, 0.5, 29)
};

export class WorldManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lowSpec = Boolean(options.lowSpec);
    this.trees = [];
    this.flyingItems = [];
    this.flyingPools = { log: [], redwood: [], plank: [] };
    this.particles = [];
    this.particlePool = [];
    this.particleMats = new Map();
    this.arcadePads = [];
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.waterTex = null;
    this.groundMat = null;
    this.waterMat = null;
    this.sawmill = null;
    this.harbor = null;
    this.questRing = null;

    this.buildTerrainAndOcean();
    this.buildPerimeterNature();
    this.buildSawmillAndHarbor();
    this.buildHarvestableForest();
    this.buildArcadePads();
    this.initParticlePool();
    this.initFlyingPool();
    this.buildQuestIndicator();
  }

  buildTerrainAndOcean() {
    this.groundMat = new THREE.MeshStandardMaterial({
      map: getGrassTexture('#4d7c3f'),
      roughness: 0.9,
      metalness: 0.02
    });
    const land = new THREE.Mesh(new THREE.BoxGeometry(240, 2, 110), this.groundMat);
    land.position.set(0, -1.0, -31);
    land.receiveShadow = !this.lowSpec;
    this.worldGroup.add(land);

    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe6c88a, roughness: 0.92, metalness: 0.0 });
    const beach = new THREE.Mesh(new THREE.BoxGeometry(240, 0.4, 7), sandMat);
    beach.position.set(0, -0.18, 24.5);
    beach.receiveShadow = !this.lowSpec;
    this.worldGroup.add(beach);

    const roadMat = new THREE.MeshStandardMaterial({
      map: getAsphaltTexture(),
      roughness: 0.82,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(46, 5.2), roadMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.position.set(-2, 0.02, -4);
    roadEW.receiveShadow = !this.lowSpec;

    const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 30), roadMat);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.set(2, 0.025, 10);
    roadNS.receiveShadow = !this.lowSpec;
    this.worldGroup.add(roadEW, roadNS);

    this.waterTex = getWaterTexture('#0ea5e9');
    this.waterMat = new THREE.MeshStandardMaterial({
      map: this.waterTex,
      roughness: 0.22,
      metalness: 0.18
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(340, 220), this.waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.45, 130);
    ocean.receiveShadow = false;
    this.worldGroup.add(ocean);

    this.addFloorMarker(ZONES.hopper, 2.6, '#0ea5e9', 'NẠP GỖ VÀO MÁY', '🪵 Tự động hút');
    this.addFloorMarker(ZONES.sawOutput, 2.6, '#10b981', 'KHO VÁN & BÁN', '📦 Nhận hàng');
    this.addFloorMarker(ZONES.vehicleSpawn, 2.8, '#f59e0b', 'BÃI XE THƯƠNG MẠI', '🚘 Nhấn [E]');
    this.addFloorMarker(ZONES.harborExport, 2.8, '#10b981', 'CẨU XUẤT CẢNG', '🚢 Giao hợp đồng');
    this.addFloorMarker(ZONES.canneryDock, 2.5, '#38bdf8', 'CẢNG CÁ HỘP', '🐟 Thu hoạch cá');
  }

  addFloorMarker(pos, radius, colorHex, title, sub) {
    const ringGeo = new THREE.RingGeometry(radius * 0.78, radius, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    ring.position.set(pos.x, pos.y + 0.04, pos.z);
    this.worldGroup.add(ring);

    const badge = makeWorldBadgeSprite(title, sub, colorHex);
    badge.position.set(pos.x, pos.y + 2.4, pos.z);
    this.worldGroup.add(badge);
  }

  buildPerimeterNature() {
    const rockGeo = new THREE.DodecahedronGeometry(3.5, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, flatShading: true });
    const rockCount = this.lowSpec ? 18 : 34;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < rockCount; i++) {
      const side = i % 3;
      let rx = 0, rz = 0;
      if (side === 0) { rx = -46 + (i / rockCount) * 92; rz = -46 - Math.random() * 14; }
      else if (side === 1) { rx = -48 - Math.random() * 14; rz = -42 + Math.random() * 60; }
      else { rx = 48 + Math.random() * 14; rz = -42 + Math.random() * 60; }

      dummy.position.set(rx, 0.8 + Math.random() * 1.4, rz);
      dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      const s = 0.8 + Math.random() * 1.5;
      dummy.scale.set(s * 1.3, s * 0.9, s);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.6, 0.1, 0.38 + Math.random() * 0.14);
      rocks.setColorAt(i, color);
    }
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    rocks.computeBoundingSphere();
    this.worldGroup.add(rocks);

    // InstancedMesh perimeter pines (scaled cleanly for <8GB RAM laptops)
    const count = this.lowSpec ? 44 : 96;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.35, 2.2, 6);
    trunkGeo.translate(0, 1.1, 0);
    const crownGeo = new THREE.ConeGeometry(1.55, 3.6, 6);
    crownGeo.translate(0, 3.4, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9, flatShading: true });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.82, flatShading: true });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
    trunks.castShadow = !this.lowSpec;
    crowns.castShadow = !this.lowSpec;

    const northCount = Math.floor(count * 0.44);
    const westCount = Math.floor((count - northCount) / 2);

    for (let i = 0; i < count; i++) {
      let tx = 0, tz = 0;
      if (i < northCount) {
        tx = -58 + (i / northCount) * 116 + (Math.random() - 0.5) * 3;
        tz = -44 - Math.random() * 18;
      } else if (i < northCount + westCount) {
        tx = -46 - Math.random() * 18;
        tz = -40 + ((i - northCount) / westCount) * 58;
      } else {
        tx = 46 + Math.random() * 18;
        tz = -40 + ((i - northCount - westCount) / Math.max(1, count - northCount - westCount)) * 58;
      }
      const scale = 0.85 + Math.random() * 0.32;
      dummy.position.set(tx, 0, tz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      crowns.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.36 + (Math.random() - 0.5) * 0.04, 0.52, 0.25 + Math.random() * 0.12);
      crowns.setColorAt(i, color);
    }
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();
    this.worldGroup.add(trunks, crowns);

    const islandMat = new THREE.MeshStandardMaterial({ color: 0x2f6845, roughness: 0.86, flatShading: true });
    [[-65, 95, 14], [78, 110, 18]].forEach(([ix, iz, r]) => {
      const island = new THREE.Mesh(new THREE.ConeGeometry(r, 7, 7), islandMat);
      island.position.set(ix, 2.2, iz);
      this.worldGroup.add(island);
    });
  }

  buildSawmillAndHarbor() {
    this.sawmill = createSawmillModel();
    this.sawmill.position.set(2, 0, -14);
    this.worldGroup.add(this.sawmill);

    this.harbor = createHarborStructure();
    this.harbor.position.set(2, 0, 24);
    this.worldGroup.add(this.harbor);
  }

  buildHarvestableForest() {
    const spots = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        spots.push({
          x: -37 + col * 4.4 + (Math.random() - 0.5) * 1.1,
          z: -33 + row * 5.2 + (Math.random() - 0.5) * 1.1
        });
      }
    }

    spots.forEach((spot, i) => {
      const kind = i % 7 === 0 ? 'redwood' : i % 3 === 0 ? 'oak' : 'pine';
      const mesh = createTreeModel(kind);
      mesh.position.set(spot.x, 0, spot.z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      this.worldGroup.add(mesh);

      const maxHp = kind === 'redwood' ? 6 : kind === 'oak' ? 4 : 3;
      this.trees.push({
        id: i,
        kind,
        mesh,
        pos: new THREE.Vector3(spot.x, 0, spot.z),
        hp: maxHp,
        maxHp,
        alive: true,
        regrowTimer: 0,
        wobble: 0,
        logYield: kind === 'redwood' ? 4 : kind === 'oak' ? 2 : 2
      });
    });
  }

  buildArcadePads() {
    const padDefs = [
      { id: 'axeTier', pos: new THREE.Vector3(-16, 0, -24), color: '#f59e0b', label: 'Nâng cấp Rìu' },
      { id: 'sawSpeedTier', pos: new THREE.Vector3(2, 0, -24), color: '#ef4444', label: 'Tốc độ Máy Cưa' },
      { id: 'lumberjacks', pos: new THREE.Vector3(-16, 0, -6), color: '#10b981', label: 'Thuê Thợ Rừng' },
      { id: 'fishingBoats', pos: new THREE.Vector3(-12, 0.5, 29), color: '#0ea5e9', label: 'Mua Tàu Đánh Cá' }
    ];

    const ringGeo = new THREE.RingGeometry(1.4, 1.8, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const discGeo = new THREE.CircleGeometry(1.35, 24);
    discGeo.rotateX(-Math.PI / 2);

    for (const def of padDefs) {
      const group = new THREE.Group();
      group.position.copy(def.pos);
      this.worldGroup.add(group);

      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      ring.position.y = 0.04;

      // Persistent offscreen canvas + CanvasTexture per pad (zero allocation on refresh!)
      const radialCanvas = document.createElement('canvas');
      radialCanvas.width = 128;
      radialCanvas.height = 128;
      const radialCtx = radialCanvas.getContext('2d');
      drawRadialProgressToCanvas(radialCtx, 0, def.color);
      const radialTex = new THREE.CanvasTexture(radialCanvas);
      radialTex.colorSpace = THREE.SRGBColorSpace;
      radialTex.needsUpdate = true;

      const radialMat = new THREE.MeshBasicMaterial({
        map: radialTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const disc = new THREE.Mesh(discGeo, radialMat);
      disc.position.y = 0.05;

      const sprite = makeWorldBadgeSprite(def.label, '$0', def.color);
      sprite.position.set(0, 2.2, 0);

      group.add(ring, disc, sprite);
      const pad = {
        ...def,
        group,
        disc,
        radialMat,
        radialCtx,
        radialTex,
        sprite,
        badgeCtx: sprite.userData._canvasCtx,
        badgeTex: sprite.userData._canvasTex,
        lastSub: '',
        lastPctStep: -1,
        lastDrawMs: 0
      };
      this.refreshArcadePad(pad, true);
      this.arcadePads.push(pad);
    }
  }

  refreshArcadePad(pad, force = false) {
    const now = performance.now();
    if (!force && now - pad.lastDrawMs < 180) return;

    const catalogItem = UPGRADE_CATALOG.find((u) => u.id === pad.id);
    if (!catalogItem) return;
    const cost = getUpgradeCost(catalogItem);
    const invested = gameState.padProgress[pad.id] || 0;
    const pct = cost ? Math.min(1, invested / cost) : 1;
    const pctStep = Math.round(pct * 48);
    const sub = cost === null ? 'ĐÃ TỐI ĐA' : `$${Math.max(0, Math.ceil(cost - invested)).toLocaleString()}`;

    if (!force && pctStep === pad.lastPctStep && sub === pad.lastSub) return;

    pad.lastDrawMs = now;
    if (pctStep !== pad.lastPctStep) {
      pad.lastPctStep = pctStep;
      drawRadialProgressToCanvas(pad.radialCtx, pct, pad.color);
      pad.radialTex.needsUpdate = true;
    }
    if (sub !== pad.lastSub) {
      pad.lastSub = sub;
      drawWorldBadgeToCanvas(pad.badgeCtx, pad.label, sub, pad.color);
      pad.badgeTex.needsUpdate = true;
    }
  }

  buildQuestIndicator() {
    const geo = new THREE.RingGeometry(0.95, 1.2, 24);
    geo.rotateX(-Math.PI / 2);
    this.questRing = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    this.questRing.position.set(-20, 0.06, -20);
    this.worldGroup.add(this.questRing);
  }

  applyBranchTheme(branch) {
    if (this.groundMat) {
      this.groundMat.map = getGrassTexture(branch.groundTint);
      this.groundMat.needsUpdate = true;
    }
    if (this.waterMat) {
      this.waterTex = getWaterTexture(branch.waterColor);
      this.waterMat.map = this.waterTex;
      this.waterMat.needsUpdate = true;
    }
  }

  initParticlePool() {
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const poolSize = this.lowSpec ? 32 : 72;
    for (let i = 0; i < poolSize; i++) {
      const m = new THREE.Mesh(geo, this.getParticleMat(0xf59e0b));
      m.visible = false;
      this.worldGroup.add(m);
      this.particlePool.push(m);
    }
  }

  getParticleMat(colorHex) {
    let mat = this.particleMats.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color: colorHex });
      this.particleMats.set(colorHex, mat);
    }
    return mat;
  }

  initFlyingPool() {
    const countPerKind = this.lowSpec ? 6 : 12;
    for (let i = 0; i < countPerKind; i++) {
      const logMesh = createLogMesh(false);
      logMesh.scale.setScalar(0.75);
      logMesh.visible = false;
      this.worldGroup.add(logMesh);
      this.flyingPools.log.push(logMesh);

      const redMesh = createLogMesh(true);
      redMesh.scale.setScalar(0.75);
      redMesh.visible = false;
      this.worldGroup.add(redMesh);
      this.flyingPools.redwood.push(redMesh);

      const plankMesh = createPlankMesh();
      plankMesh.scale.setScalar(0.75);
      plankMesh.visible = false;
      this.worldGroup.add(plankMesh);
      this.flyingPools.plank.push(plankMesh);
    }
  }

  spawnParticles(pos, colorHex = 0xf59e0b, count = 6) {
    const actualCount = this.lowSpec ? Math.min(3, count) : count;
    const mat = this.getParticleMat(colorHex);
    for (let i = 0; i < actualCount; i++) {
      if (this.particlePool.length === 0) break;
      const p = this.particlePool.pop();
      p.material = mat;
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + 0.6 + Math.random() * 0.5,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      p.scale.setScalar(1);
      p.visible = true;
      if (!p.userData.vel) p.userData.vel = new THREE.Vector3();
      p.userData.vel.set((Math.random() - 0.5) * 3.5, 2.5 + Math.random() * 3.2, (Math.random() - 0.5) * 3.5);
      p.userData.life = 0.55;
      this.particles.push(p);
    }
  }

  spawnFlyingArc(from, to, kind = 'log', onArrive = null) {
    const poolKey = kind === 'plank' ? 'plank' : kind === 'redwood' ? 'redwood' : 'log';
    const pool = this.flyingPools[poolKey];
    let mesh = pool.pop();
    if (!mesh) {
      // Pool exhausted under burst — immediately fire callback without leaking GPU mesh
      if (onArrive) onArrive();
      return;
    }
    mesh.position.copy(from);
    mesh.rotation.set(0, 0, 0);
    mesh.visible = true;
    this.flyingItems.push({
      mesh,
      poolKey,
      p0: from.clone(),
      p1: to.clone(),
      t: 0,
      speed: 2.6,
      onArrive
    });
  }

  update(dt, elapsed, sawmillWorking) {
    if (this.waterTex) {
      this.waterTex.offset.x = (elapsed * 0.025) % 1;
      this.waterTex.offset.y = (elapsed * 0.018) % 1;
    }

    if (this.sawmill && this.sawmill.userData.sawBlade) {
      const speed = sawmillWorking ? 14 : 2.5;
      this.sawmill.userData.sawBlade.rotation.z -= dt * speed;
    }
    if (this.harbor && this.harbor.userData.ship) {
      this.harbor.userData.ship.position.y = 0.08 + Math.sin(elapsed * 1.4) * 0.14;
      this.harbor.userData.hoistedCrate.position.y = 4.0 + Math.sin(elapsed * 1.1) * 0.6;
    }

    for (const tree of this.trees) {
      if (tree.wobble > 0) {
        tree.wobble = Math.max(0, tree.wobble - dt * 4);
        tree.mesh.rotation.z = Math.sin(tree.wobble * 18) * 0.12 * tree.wobble;
      }
      if (!tree.alive) {
        tree.regrowTimer -= dt;
        const pct = Math.max(0.08, 1 - tree.regrowTimer / 7.5);
        tree.mesh.scale.setScalar(pct);
        if (tree.regrowTimer <= 0) {
          tree.alive = true;
          tree.hp = tree.maxHp;
          tree.mesh.scale.setScalar(1);
          tree.mesh.visible = true;
        }
      }
    }

    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const item = this.flyingItems[i];
      item.t += dt * item.speed;
      if (item.t >= 1) {
        item.mesh.visible = false;
        this.flyingPools[item.poolKey].push(item.mesh);
        if (item.onArrive) item.onArrive();
        this.flyingItems.splice(i, 1);
      } else {
        const u = item.t;
        item.mesh.position.lerpVectors(item.p0, item.p1, u);
        item.mesh.position.y += Math.sin(u * Math.PI) * 2.4;
        item.mesh.rotation.y += dt * 6;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= dt;
      p.userData.vel.y -= 11 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.scale.multiplyScalar(0.94);
      if (p.userData.life <= 0) {
        p.visible = false;
        this.particles.splice(i, 1);
        this.particlePool.push(p);
      }
    }

    if (this.questRing) {
      let target = ZONES.hopper;
      if (gameState.logs >= 4 || (gameState.logs > 0 && !this.trees.some((t) => t.alive))) {
        target = ZONES.hopper;
      } else if (gameState.planks >= 6 || gameState.pallets >= 1) {
        target = ZONES.harborExport;
      } else {
        const nearTree = this.trees.find((t) => t.alive);
        if (nearTree) target = nearTree.pos;
      }
      this.questRing.position.set(target.x, 0.06, target.z);
      const pulseScale = 1 + Math.sin(elapsed * 4) * 0.1;
      this.questRing.scale.setScalar(pulseScale);
    }
  }

  dispose() {
    for (const pad of this.arcadePads) {
      pad.radialTex?.dispose();
      pad.badgeTex?.dispose();
    }
    disposeObject3D(this.worldGroup);
    this.scene.remove(this.worldGroup);
  }
}
