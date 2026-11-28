/**
 * Wilderness Heavy Machinery, Real-Time Terrain Grading (Manual & AI Excavator)
 * and Level + Cash Tiered Infrastructure & Housing Progression
 *
 * Progression:
 *  Lv 2 ($180)   -> Máy Xúc San Lấp (excavatorHero: articulated tracks/turret/boom; drivable + AI dispatch)
 *  Lv 3 ($320)   -> Nhà Cấp 4 (houseTier1, requires flat/graded pad, passive rent + worker cap)
 *  Lv 4 ($520)   -> Máy Cưa Gỗ Tự Động (autoSawmill + animated GLB operator, fast auto log->plank)
 *  Lv 5 ($780)   -> Nhà Sàn Gỗ (houseTier2, passive rent + merchant bonus + worker cap)
 *  Lv 6 ($1150)  -> Trạm Xe Cẩu & Nhà Gỗ Vùng Cao (houseTier3 + crawlerCrane + wheelLoader, AI grade +60%)
 *  Lv 8 ($1950)  -> Biệt Thự Rừng Cao Cấp (houseTier4 + bulldozerGrader, wide flat pad, high passive rent)
 */

import * as THREE from 'three';
import {
  FOREST_ASSETS,
  mountNormalizedGlb,
  disposeObject3D,
  createArticulatedGlbWorker,
  updateArticulatedGlbWorker
} from './models.js';
import { drawWorldBadgeToCanvas, makeWorldBadgeSprite } from './textures.js';
import {
  WILDERNESS_RADIUS,
  getStreamInfo,
  groundHeightAt,
  groundSlopeAt,
  rawProceduralGroundHeightAt,
  setGradedPads,
  getGradedPads,
  upsertGradedPad,
  measureTerrainRoughness
} from './wilderness-map.js';
import { gameState } from './state.js';

export function getWildernessXpForLevel(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  return Math.round(60 + (lv - 1) * 75 + (lv - 1) * (lv - 1) * 18);
}

export function addWildernessXp(campState, amount) {
  if (!campState || amount <= 0) return { leveledUp: false, level: campState?.level || 1, xp: campState?.xp || 0 };
  campState.level = Math.max(1, Math.floor(Number(campState.level) || 1));
  campState.xp = Math.max(0, Math.floor(Number(campState.xp) || 0)) + Math.round(amount);

  let leveledUp = false;
  let need = getWildernessXpForLevel(campState.level);
  while (campState.xp >= need && campState.level < 30) {
    campState.xp -= need;
    campState.level += 1;
    leveledUp = true;
    need = getWildernessXpForLevel(campState.level);
  }
  return {
    leveledUp,
    level: campState.level,
    xp: campState.xp,
    nextXp: need
  };
}

export const EXCAVATOR_UNLOCK = {
  id: 'excavator',
  name: 'Máy Xúc San Lấp Thủy Lực',
  minLevel: 2,
  cost: 180,
  xpReward: 75,
  desc: 'Tự lái (F) hoặc gọi AI san phẳng đồi gồ ghề để lấy mặt bằng xây nhà và xưởng tự động.'
};

export const INFRA_CATALOG = [
  {
    id: 'house_cap4',
    order: 1,
    name: 'Nhà Cấp 4 Bìa Rừng',
    shortName: 'Nhà Cấp 4',
    minLevel: 3,
    cost: 320,
    radius: 5.6,
    footprint: 7.4,
    requiresFlat: true,
    passiveCash: 18,
    workerCapBonus: 1,
    merchantBonus: 0,
    gradeSpeedBonus: 0,
    xpReward: 120,
    assetKey: 'houseTier1',
    benefit: '+$18 / 15 giây thu nhập thụ động · +1 giới hạn mỗi loại công nhân.'
  },
  {
    id: 'auto_sawmill',
    order: 2,
    name: 'Máy Cưa Gỗ Tự Động',
    shortName: 'Máy Cưa Auto',
    minLevel: 4,
    cost: 520,
    radius: 5.2,
    footprint: 6.4,
    requiresFlat: true,
    passiveCash: 10,
    workerCapBonus: 0,
    merchantBonus: 0,
    gradeSpeedBonus: 0,
    xpReward: 165,
    assetKey: 'autoSawmill',
    benefit: 'Tự động lấy gỗ từ Bãi Gỗ xẻ ra 2 Ván mỗi 1.5 giây kèm thợ vận hành AI.'
  },
  {
    id: 'house_san',
    order: 3,
    name: 'Nhà Sàn Gỗ Ven Đồi',
    shortName: 'Nhà Sàn Gỗ',
    minLevel: 5,
    cost: 780,
    radius: 6.2,
    footprint: 8.6,
    requiresFlat: true,
    passiveCash: 36,
    workerCapBonus: 1,
    merchantBonus: 0.15,
    gradeSpeedBonus: 0,
    xpReward: 210,
    assetKey: 'houseTier2',
    benefit: '+$36 / 15 giây · +15% giá bán Thuyền Thương Lái · +1 giới hạn công nhân.'
  },
  {
    id: 'crane_estate',
    order: 4,
    name: 'Trạm Xe Cẩu & Nhà Gỗ Vùng Cao',
    shortName: 'Nhà Gỗ & Xe Cẩu',
    minLevel: 6,
    cost: 1150,
    radius: 6.8,
    footprint: 9.2,
    requiresFlat: true,
    passiveCash: 64,
    workerCapBonus: 0,
    merchantBonus: 0.10,
    gradeSpeedBonus: 0.6,
    xpReward: 280,
    assetKey: 'houseTier3',
    benefit: '+$64 / 15 giây · Triển khai Xe Cẩu & Xe Xúc Lật tăng +60% tốc độ máy xúc AI.'
  },
  {
    id: 'house_bietthu',
    order: 5,
    name: 'Biệt Thự Rừng Cao Cấp',
    shortName: 'Biệt Thự Rừng',
    minLevel: 8,
    cost: 1950,
    radius: 8.0,
    footprint: 11.4,
    requiresFlat: true,
    passiveCash: 130,
    workerCapBonus: 1,
    merchantBonus: 0.20,
    gradeSpeedBonus: 0.35,
    xpReward: 460,
    assetKey: 'houseTier4',
    benefit: '+$130 / 15 giây · Cần bãi đồi san phẳng rộng · +1 giới hạn công nhân & +20% giao thương.'
  }
];

const _tmpVec = new THREE.Vector3();

let _sharedInfra = null;
function getSharedInfraAssets() {
  if (_sharedInfra) return _sharedInfra;
  const mark = (r) => {
    r.userData = r.userData || {};
    r.userData.shared = true;
    return r;
  };
  const ringGeo = mark(new THREE.RingGeometry(0.88, 1.0, 40));
  ringGeo.rotateX(-Math.PI / 2);
  const discGeo = mark(new THREE.CircleGeometry(0.92, 40));
  discGeo.rotateX(-Math.PI / 2);
  const stakeGeo = mark(new THREE.CylinderGeometry(0.07, 0.085, 1.05, 6));
  const shadowGeo = mark(new THREE.CircleGeometry(1.0, 20));
  shadowGeo.rotateX(-Math.PI / 2);

  _sharedInfra = {
    ringGeo,
    discGeo,
    stakeGeo,
    shadowGeo,
    stakeMat: mark(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.72 })),
    shadowMat: mark(new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.34, depthWrite: false })),
    ghostOkLine: mark(new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false })),
    ghostOkFill: mark(new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })),
    ghostWarnLine: mark(new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false })),
    ghostWarnFill: mark(new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })),
    ghostBadLine: mark(new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false })),
    ghostBadFill: mark(new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false })),
    padBorderMat: mark(new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }))
  };
  return _sharedInfra;
}

export class WildernessInfrastructureSystem {
  constructor(camp) {
    this.camp = camp;
    this.world = camp.world;
    this.root = new THREE.Group();
    this.root.name = 'WildernessInfrastructureRoot';
    this.camp.root.add(this.root);

    this.excavator = null;
    this.drivingExcavator = false;
    this.aiJob = null; // { padId, x, z, radius, targetY, progress, phase, group, ring, badge }
    this.activeJobVisuals = new Map();
    this.builtObjects = new Map(); // buildingKey -> { def, data, group, operator, sawDisc, badge }
    this.passiveTimer = 0;
    this.autoSawTimer = 0;
    this._manualGradeCooldown = 0;
    this._manualTerrainSyncTimer = 0;
    this._manualDustTimer = 0;
    this._manualSfxTimer = 0;
    this._manualGradeCount = 0;
    this._aiTerrainSyncTimer = 0;
    this._aiDustTimer = 0;
    this._aiSfxTimer = 0;

    // Interactive Placement State (mode: 'grade' | 'infra')
    this.placement = {
      active: false,
      mode: null,
      infraId: null,
      def: null,
      x: 0,
      z: 0,
      y: 0,
      yaw: 0,
      userYawOffset: 0,
      radius: 6.4,
      valid: false,
      needsGrading: false,
      flatnessPct: 100,
      reason: ''
    };
    this.ghostGroup = null;
    this.ghostRing = null;
    this.ghostDisc = null;
    this.ghostStakes = [];
    this.ghostBadge = null;
    this._lastGhostBadgeKey = '';

    this.initPlacementGhost();
    this.restoreFromState();
  }

  initPlacementGhost() {
    const a = getSharedInfraAssets();
    const g = new THREE.Group();
    g.name = 'InfraPlacementGhost';
    g.visible = false;
    g.renderOrder = 11;

    const disc = new THREE.Mesh(a.discGeo, a.ghostOkFill);
    disc.position.y = 0.14;
    g.add(disc);

    const ring = new THREE.Mesh(a.ringGeo, a.ghostOkLine);
    ring.position.y = 0.18;
    g.add(ring);

    const stakes = [];
    for (let i = 0; i < 6; i++) {
      const st = new THREE.Mesh(a.stakeGeo, a.stakeMat);
      st.position.y = 0.52;
      g.add(st);
      stakes.push(st);
    }

    const badge = makeWorldBadgeSprite('Chọn mặt bằng', 'Click / E xác nhận', '#4ade80');
    badge.position.set(0, 3.1, 0);
    badge.scale.set(4.5, 1.22, 1);
    g.add(badge);

    this.root.add(g);
    this.ghostGroup = g;
    this.ghostRing = ring;
    this.ghostDisc = disc;
    this.ghostStakes = stakes;
    this.ghostBadge = badge;
  }

  restoreFromState() {
    const st = this.camp.state;
    // 1. Restore saved graded terrain pads and rebuild terrain mesh heights/colors
    if (Array.isArray(st.gradedPads) && st.gradedPads.length > 0) {
      setGradedPads(st.gradedPads);
      this.world?.rebuildAllGradedTerrain?.();
    } else {
      setGradedPads([]);
    }

    // 2. Restore Excavator if owned
    if (st.excavator?.owned) {
      this.spawnExcavatorMesh();
    }

    // 3. Restore all built infrastructure & houses
    if (Array.isArray(st.infraBuildings)) {
      for (const b of st.infraBuildings) {
        const def = INFRA_CATALOG.find((c) => c.id === b.id);
        if (def) {
          this.spawnInfraBuildingMesh(def, b);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Progression Bonuses Query
  // ---------------------------------------------------------------------------
  getBuiltInfraList() {
    return Array.isArray(this.camp.state.infraBuildings) ? this.camp.state.infraBuildings : [];
  }

  hasBuiltInfra(infraId) {
    return this.getBuiltInfraList().some((b) => b.id === infraId);
  }

  getBuiltCountOf(infraId) {
    return this.getBuiltInfraList().filter((b) => b.id === infraId).length;
  }

  getPassiveCashPerCycle() {
    let sum = 0;
    for (const b of this.getBuiltInfraList()) {
      const def = INFRA_CATALOG.find((c) => c.id === b.id);
      if (def) sum += def.passiveCash || 0;
    }
    return sum;
  }

  getWorkerCapBonus() {
    let bonus = 0;
    for (const b of this.getBuiltInfraList()) {
      const def = INFRA_CATALOG.find((c) => c.id === b.id);
      if (def) bonus += def.workerCapBonus || 0;
    }
    return Math.min(3, bonus);
  }

  getMerchantBonusMult() {
    let bonus = 0;
    for (const b of this.getBuiltInfraList()) {
      const def = INFRA_CATALOG.find((c) => c.id === b.id);
      if (def) bonus += def.merchantBonus || 0;
    }
    return 1 + Math.min(0.65, bonus);
  }

  getAiGradeSpeedMult() {
    let bonus = 0;
    for (const b of this.getBuiltInfraList()) {
      const def = INFRA_CATALOG.find((c) => c.id === b.id);
      if (def) bonus += def.gradeSpeedBonus || 0;
    }
    return 1 + bonus;
  }

  getCompletedPadCount() {
    return getGradedPads().filter((p) => (p.progress ?? 1) >= 0.92).length;
  }

  // ---------------------------------------------------------------------------
  // Articulated Hero Excavator (Tracks + 360° Turret + Hydraulic Digging Boom)
  // ---------------------------------------------------------------------------
  buyExcavator(playerPos) {
    const st = this.camp.state;
    if (st.excavator?.owned) {
      return { ok: false, reason: 'Bạn đã sở hữu Máy Xúc San Lấp rồi!' };
    }
    if ((st.level || 1) < EXCAVATOR_UNLOCK.minLevel) {
      return { ok: false, reason: `Cần đạt Cấp ${EXCAVATOR_UNLOCK.minLevel} để mở khóa Máy Xúc (hiện tại Cấp ${st.level || 1}).` };
    }
    if ((gameState.cash || 0) < EXCAVATOR_UNLOCK.cost) {
      return { ok: false, reason: `Cần $${EXCAVATOR_UNLOCK.cost.toLocaleString()} để mua Máy Xúc.` };
    }
    gameState.cash = Math.max(0, (gameState.cash || 0) - EXCAVATOR_UNLOCK.cost);
    const sx = playerPos ? playerPos.x + 4.4 : 6.0;
    const sz = playerPos ? playerPos.z + 2.2 : 4.0;
    st.excavator = {
      owned: true,
      x: Number(sx.toFixed(2)),
      z: Number(sz.toFixed(2)),
      yaw: 0.4
    };
    this.spawnExcavatorMesh();
    const xpRes = addWildernessXp(st, EXCAVATOR_UNLOCK.xpReward);
    return { ok: true, xpRes };
  }

  spawnExcavatorMesh() {
    if (this.excavator) return this.excavator;
    const st = this.camp.state;
    const ex = st.excavator || { owned: true, x: 6.0, z: 4.0, yaw: 0.4 };
    const a = getSharedInfraAssets();

    const root = new THREE.Group();
    root.name = 'WildernessHeroExcavator';
    const y = this.camp.getWalkableHeightAt(ex.x, ex.z);
    root.position.set(ex.x, y, ex.z);
    root.rotation.order = 'YXZ';
    root.rotation.y = ex.yaw || 0;

    const shadow = new THREE.Mesh(a.shadowGeo, a.shadowMat);
    shadow.scale.set(2.35, 1, 2.85);
    shadow.position.y = 0.04;
    root.add(shadow);

    const bodyTilt = new THREE.Group();
    root.add(bodyTilt);

    const badge = makeWorldBadgeSprite('Máy Xúc San Lấp', 'Nhấn F để lái · Hoặc gọi AI', '#f59e0b');
    badge.position.set(0, 3.65, 0);
    badge.scale.set(3.8, 1.02, 1);
    root.add(badge);

    const ent = {
      group: root,
      bodyTilt,
      badge,
      x: ex.x,
      z: ex.z,
      y,
      yaw: ex.yaw || 0,
      speed: 0,
      tracksNode: null,
      turretNode: null,
      boomNode: null,
      turretBaseY: 0,
      boomBaseX: 0,
      turretAngle: 0,
      boomPitch: 0,
      digPhase: 0,
      _lastBadgeState: ''
    };

    mountNormalizedGlb(bodyTilt, FOREST_ASSETS.excavatorHero, {
      targetFootprint: 4.9,
      yaw: 0,
      lowSpec: this.camp.lowSpec,
      onLoad: (loadedModel) => {
        loadedModel.traverse((child) => {
          const n = (child.name || '').toLowerCase();
          if (n === 'tracks') ent.tracksNode = child;
          else if (n === 'turret') {
            ent.turretNode = child;
            ent.turretBaseY = child.rotation.y;
          } else if (n === 'boom') {
            ent.boomNode = child;
            ent.boomBaseX = child.rotation.x;
          }
        });
      }
    });

    this.root.add(root);
    this.excavator = ent;
    return ent;
  }

  canEnterExcavator(playerPos) {
    if (!this.excavator || !this.camp.state.excavator?.owned) return false;
    if (!playerPos) return true;
    return Math.hypot(playerPos.x - this.excavator.x, playerPos.z - this.excavator.z) <= 7.5;
  }

  enterExcavator(allowTeleport = false, playerPos = null) {
    if (!this.camp.state.excavator?.owned) {
      return { ok: false, reason: 'Hãy mở khóa & mua Máy Xúc San Lấp (Cấp 2 · $180) trong mục Hạ tầng.' };
    }
    if (!this.excavator) this.spawnExcavatorMesh();
    if (!allowTeleport && playerPos && !this.canEnterExcavator(playerPos)) {
      return { ok: false, reason: 'Hãy đi lại gần Máy Xúc (hoặc bấm Lái máy xúc trong bảng Hạ tầng).' };
    }
    // Pause active AI dispatch when player takes manual control
    this.drivingExcavator = true;
    this.refreshExcavatorBadge('Đang tự lái', 'WASD lái · Giữ Space san đất');
    return { ok: true, x: this.excavator.x, y: this.excavator.y, z: this.excavator.z, yaw: this.excavator.yaw };
  }

  exitExcavator() {
    if (!this.drivingExcavator || !this.excavator) return null;
    this.drivingExcavator = false;
    this.excavator.speed = 0;
    this.syncExcavatorState();
    this.refreshExcavatorBadge('Máy Xúc San Lấp', this.aiJob ? 'AI đang san đồi...' : 'Nhấn F để lái · Hoặc gọi AI');
    const exitX = this.excavator.x + Math.cos(this.excavator.yaw) * 2.8;
    const exitZ = this.excavator.z - Math.sin(this.excavator.yaw) * 2.8;
    return {
      x: exitX,
      y: this.camp.getWalkableHeightAt(exitX, exitZ),
      z: exitZ
    };
  }

  syncExcavatorState() {
    if (!this.excavator || !this.camp.state.excavator) return;
    this.camp.state.excavator.x = Number(this.excavator.x.toFixed(2));
    this.camp.state.excavator.z = Number(this.excavator.z.toFixed(2));
    this.camp.state.excavator.yaw = Number(this.excavator.yaw.toFixed(3));
  }

  refreshExcavatorBadge(title, sub) {
    if (!this.excavator?.badge?.userData?._canvasCtx) return;
    const key = `${title}|${sub}`;
    if (this.excavator._lastBadgeState === key) return;
    this.excavator._lastBadgeState = key;
    drawWorldBadgeToCanvas(this.excavator.badge.userData._canvasCtx, title, sub, '#fbbf24');
    if (this.excavator.badge.userData._canvasTex) this.excavator.badge.userData._canvasTex.needsUpdate = true;
  }

  /**
   * Drives the Hero Excavator manually with WASD/joystick + Space/Click real-time terrain grading.
   */
  updateManualDrive(dt, ix, iy, camYaw, gradingHeld, callbacks = {}) {
    if (!this.drivingExcavator || !this.excavator) return null;
    const ex = this.excavator;
    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;

    if (moving) {
      const nx = ix / Math.max(1, len);
      const ny = iy / Math.max(1, len);
      const fwdX = -Math.sin(camYaw);
      const fwdZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);
      const moveX = fwdX * -ny + rightX * nx;
      const moveZ = fwdZ * -ny + rightZ * nx;
      const mag = Math.hypot(moveX, moveZ) || 1;
      const dirX = moveX / mag;
      const dirZ = moveZ / mag;

      const targetYaw = Math.atan2(dirX, dirZ);
      let diff = targetYaw - ex.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ex.yaw += diff * Math.min(1, dt * 4.8);

      const maxSpeed = gradingHeld ? 4.4 : 6.8;
      ex.speed += (maxSpeed - ex.speed) * Math.min(1, dt * 6.0);

      let nextX = ex.x + Math.sin(ex.yaw) * ex.speed * dt;
      let nextZ = ex.z + Math.cos(ex.yaw) * ex.speed * dt;

      // Clamp to valley & avoid driving deep into the middle of the river
      const rad = Math.hypot(nextX, nextZ);
      if (rad > WILDERNESS_RADIUS - 3.5) {
        const sc = (WILDERNESS_RADIUS - 3.5) / rad;
        nextX *= sc;
        nextZ *= sc;
      }
      const stream = getStreamInfo(nextX, nextZ);
      const onBridge = this.camp.isOnBuiltBridge(nextX, nextZ);
      if (!onBridge && stream.dist < stream.halfWidth + 1.2) {
        // Slide gently along riverbank instead of sinking into river
        const pushSign = nextX >= stream.centerX ? 1 : -1;
        nextX = stream.centerX + pushSign * (stream.halfWidth + 1.35);
      }

      ex.x = nextX;
      ex.z = nextZ;
    } else {
      ex.speed *= Math.max(0, 1 - dt * 8);
    }

    // Terrain-hugging elevation & realistic crawler pitch/roll
    ex.y = this.camp.getWalkableHeightAt(ex.x, ex.z);
    const fwdSlope = groundSlopeAt(ex.x, ex.z, Math.sin(ex.yaw), Math.cos(ex.yaw));
    const sideSlope = groundSlopeAt(ex.x, ex.z, Math.cos(ex.yaw), -Math.sin(ex.yaw));
    ex.group.position.set(ex.x, ex.y, ex.z);
    ex.group.rotation.y = ex.yaw;
    ex.bodyTilt.rotation.x += (-fwdSlope * 0.45 - ex.bodyTilt.rotation.x) * Math.min(1, dt * 7);
    ex.bodyTilt.rotation.z += (sideSlope * 0.35 - ex.bodyTilt.rotation.z) * Math.min(1, dt * 7);

    // Real-time bucket/blade grading when holding Space or Left Mouse
    let gradedNow = false;
    if (gradingHeld) {
      ex.digPhase += dt * 4.4;
      const targetTurret = Math.sin(ex.digPhase * 0.65) * 0.36;
      const targetBoom = 0.24 + Math.sin(ex.digPhase * 1.3) * 0.20;
      ex.turretAngle += (targetTurret - ex.turretAngle) * Math.min(1, dt * 7);
      ex.boomPitch += (targetBoom - ex.boomPitch) * Math.min(1, dt * 8);

      // Compute bucket contact point ~3.2m in front of the excavator
      const bx = ex.x + Math.sin(ex.yaw + ex.turretAngle * 0.5) * 3.1;
      const bz = ex.z + Math.cos(ex.yaw + ex.turretAngle * 0.5) * 3.1;
      const streamAtBlade = getStreamInfo(bx, bz);
      if (streamAtBlade.dist > streamAtBlade.halfWidth + 3.4) {
        this._manualTerrainSyncTimer += dt;
        this._manualDustTimer += dt;
        this._manualSfxTimer += dt;

        if (this._manualTerrainSyncTimer >= 0.12) {
          this._manualTerrainSyncTimer = 0;
          // Reuse nearest manual pad if within 3.2m so driving slowly polishes a clean contiguous plateau
          const pads = getGradedPads();
          let existing = null;
          for (const p of pads) {
            if (Math.hypot(p.x - bx, p.z - bz) < 3.4) {
              existing = p;
              break;
            }
          }
          const rough = measureTerrainRoughness(bx, bz, 5.4);
          const padId = existing ? existing.id : `pad_m_${Math.round(bx / 3)}_${Math.round(bz / 3)}`;
          const nextProg = Math.min(1, (existing?.progress || 0.25) + 0.24);
          const targetY = existing
            ? existing.targetY
            : Number((rawProceduralGroundHeightAt(bx, bz) * 0.65 + rough.avgH * 0.35).toFixed(2));
          const updated = upsertGradedPad({
            id: padId,
            x: existing ? existing.x : Number(bx.toFixed(2)),
            z: existing ? existing.z : Number(bz.toFixed(2)),
            radius: Math.max(existing?.radius || 6.4, 6.4),
            targetY,
            progress: nextProg
          });
          this.persistPads();
          this.world?.updateWildernessTerrainRegion?.(updated.x, updated.z, updated.radius + 1.8);
          gradedNow = true;

          if (nextProg >= 0.96 && (!existing || (existing.progress || 0) < 0.96)) {
            this._manualGradeCount += 1;
            const xpRes = addWildernessXp(this.camp.state, 32);
            callbacks.onPadFlattened?.(updated, xpRes, false);
          }
        }

        if (this._manualDustTimer >= 0.14) {
          this._manualDustTimer = 0;
          _tmpVec.set(bx, groundHeightAt(bx, bz) + 0.3, bz);
          this.world?.spawnParticles?.(_tmpVec, 0xb48a5a, 4);
        }
        if (this._manualSfxTimer >= 0.24) {
          this._manualSfxTimer = 0;
          callbacks.onGradeSfx?.();
        }
      }
    } else {
      ex.turretAngle += (0 - ex.turretAngle) * Math.min(1, dt * 5);
      ex.boomPitch += (0 - ex.boomPitch) * Math.min(1, dt * 5);
    }

    if (ex.turretNode) ex.turretNode.rotation.y = ex.turretBaseY + ex.turretAngle;
    if (ex.boomNode) ex.boomNode.rotation.x = ex.boomBaseX + ex.boomPitch;

    this.syncExcavatorState();
    return { x: ex.x, y: ex.y, z: ex.z, yaw: ex.yaw, gradedNow };
  }

  // ---------------------------------------------------------------------------
  // AI Excavator Autonomous Grading Dispatch
  // ---------------------------------------------------------------------------
  dispatchAiGrading(rawX, rawZ, radius = 7.4) {
    if (!this.camp.state.excavator?.owned) {
      return { ok: false, reason: 'Cần mua Máy Xúc San Lấp (Cấp 2 · $180) trước khi gọi AI san đồi.' };
    }
    if (!this.excavator) this.spawnExcavatorMesh();

    const stream = getStreamInfo(rawX, rawZ);
    if (stream.dist < stream.halfWidth + radius * 0.55 + 1.8) {
      return { ok: false, reason: 'Vị trí này quá sát Sông Rừng — hãy chọn khu đất đồi xa bờ sông hơn.' };
    }

    // Cancel any old unfinished AI job visual
    this.clearAiJobVisual();

    const rough = measureTerrainRoughness(rawX, rawZ, radius);
    const padId = `pad_ai_${Date.now()}_${Math.floor(Math.random() * 999)}`;
    const targetY = Number(rough.avgH.toFixed(2));
    upsertGradedPad({
      id: padId,
      x: Number(rawX.toFixed(2)),
      z: Number(rawZ.toFixed(2)),
      radius,
      targetY,
      progress: 0.04
    });
    this.persistPads();

    // Build orange construction zone markers + live progress badge
    const a = getSharedInfraAssets();
    const g = new THREE.Group();
    const cy = groundHeightAt(rawX, rawZ);
    g.position.set(rawX, cy, rawZ);

    const ring = new THREE.Mesh(a.ringGeo, a.ghostWarnLine);
    ring.scale.setScalar(radius);
    ring.position.y = 0.16;
    g.add(ring);

    const disc = new THREE.Mesh(a.discGeo, a.ghostWarnFill);
    disc.scale.setScalar(radius);
    disc.position.y = 0.12;
    g.add(disc);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const st = new THREE.Mesh(a.stakeGeo, a.stakeMat);
      st.position.set(Math.cos(ang) * radius, 0.52, Math.sin(ang) * radius);
      g.add(st);
    }

    const badge = makeWorldBadgeSprite('Máy Xúc AI San Nền', 'Đang di chuyển tới đồi...', '#f59e0b');
    badge.position.set(0, 3.2, 0);
    badge.scale.set(4.2, 1.12, 1);
    g.add(badge);
    this.root.add(g);

    this.aiJob = {
      padId,
      x: rawX,
      z: rawZ,
      radius,
      targetY,
      progress: 0.04,
      phase: 'travel',
      group: g,
      ring,
      badge,
      _lastPct: -1
    };

    if (this.drivingExcavator) {
      this.drivingExcavator = false;
    }
    this.refreshExcavatorBadge('Máy Xúc AI', 'Đang tiến tới bãi san lấp');
    return { ok: true, job: this.aiJob };
  }

  clearAiJobVisual() {
    if (this.aiJob?.group) {
      this.root.remove(this.aiJob.group);
      disposeObject3D(this.aiJob.group);
    }
    this.aiJob = null;
  }

  persistPads() {
    this.camp.state.gradedPads = getGradedPads().map((p) => ({
      id: p.id,
      x: Number(p.x.toFixed(2)),
      z: Number(p.z.toFixed(2)),
      radius: Number(p.radius.toFixed(2)),
      targetY: Number(p.targetY.toFixed(2)),
      progress: Number((p.progress ?? 1).toFixed(3))
    }));
  }

  // ---------------------------------------------------------------------------
  // Interactive Placement Mode (AI Grading Zone OR Tiered Infrastructure/House)
  // ---------------------------------------------------------------------------
  isPlacing() {
    return Boolean(this.placement.active);
  }

  getPlacementInfo() {
    if (!this.placement.active) return null;
    return {
      mode: this.placement.mode,
      infraId: this.placement.infraId,
      name: this.placement.mode === 'grade' ? 'Vùng San Phẳng Đồi (Máy Xúc AI)' : (this.placement.def?.name || 'Hạ tầng'),
      shortName: this.placement.mode === 'grade' ? 'San phẳng đồi' : (this.placement.def?.shortName || 'Hạ tầng'),
      x: this.placement.x,
      z: this.placement.z,
      yaw: this.placement.yaw,
      valid: this.placement.valid,
      needsGrading: this.placement.needsGrading,
      flatnessPct: this.placement.flatnessPct,
      reason: this.placement.reason
    };
  }

  startGradingPlacement(initX = 0, initZ = 0) {
    if (!this.camp.state.excavator?.owned) {
      return { ok: false, reason: 'Cần mua Máy Xúc San Lấp (Cấp 2 · $180) trước.' };
    }
    this.camp.cancelPlacement();
    this.placement.active = true;
    this.placement.mode = 'grade';
    this.placement.infraId = null;
    this.placement.def = null;
    this.placement.radius = 7.6;
    this.placement.userYawOffset = 0;
    this._setupGhostRadius(7.6);
    this._lastGhostBadgeKey = '';
    this.updatePlacementPreview(initX, initZ);
    return { ok: true, info: this.getPlacementInfo() };
  }

  startInfraPlacement(infraId, initX = 0, initZ = 0) {
    const def = INFRA_CATALOG.find((c) => c.id === infraId);
    if (!def) return { ok: false, reason: 'Công trình hạ tầng không hợp lệ.' };
    const lv = this.camp.state.level || 1;
    if (lv < def.minLevel) {
      return { ok: false, reason: `Cần đạt Cấp ${def.minLevel} để mở khóa ${def.name} (hiện Cấp ${lv}).` };
    }
    if ((gameState.cash || 0) < def.cost) {
      return { ok: false, reason: `Cần $${def.cost.toLocaleString()} để xây ${def.name}.` };
    }
    this.camp.cancelPlacement();
    this.placement.active = true;
    this.placement.mode = 'infra';
    this.placement.infraId = def.id;
    this.placement.def = def;
    this.placement.radius = def.radius;
    this.placement.userYawOffset = 0;
    this._setupGhostRadius(def.radius);
    this._lastGhostBadgeKey = '';
    this.updatePlacementPreview(initX, initZ);
    return { ok: true, info: this.getPlacementInfo() };
  }

  _setupGhostRadius(radius) {
    if (!this.ghostGroup) return;
    this.ghostGroup.visible = true;
    if (this.ghostRing) this.ghostRing.scale.setScalar(radius);
    if (this.ghostDisc) this.ghostDisc.scale.setScalar(radius);
    for (let i = 0; i < this.ghostStakes.length; i++) {
      const ang = (i / this.ghostStakes.length) * Math.PI * 2;
      this.ghostStakes[i].position.set(Math.cos(ang) * radius, 0.52, Math.sin(ang) * radius);
    }
  }

  rotatePlacement(deltaRad = Math.PI / 6) {
    if (!this.placement.active) return;
    this.placement.userYawOffset = (this.placement.userYawOffset + deltaRad) % (Math.PI * 2);
    this.updatePlacementPreview(this.placement.x, this.placement.z);
  }

  cancelPlacement() {
    this.placement.active = false;
    this.placement.mode = null;
    this.placement.infraId = null;
    this.placement.def = null;
    if (this.ghostGroup) this.ghostGroup.visible = false;
  }

  checkInfraOverlap(x, z, radius) {
    for (const b of this.getBuiltInfraList()) {
      const otherDef = INFRA_CATALOG.find((c) => c.id === b.id);
      const minGap = (radius + (otherDef?.radius || 5.6)) * 0.85;
      if (Math.hypot(x - b.x, z - b.z) < minGap) {
        return otherDef?.shortName || 'Công trình khác';
      }
    }
    // Check overlap with built camp sites
    for (const site of this.camp.sites.values()) {
      if (!site.group.visible) continue;
      const minGap = (radius + (site.bp?.radius || 3.5)) * 0.72;
      if (Math.hypot(x - site.x, z - site.z) < minGap) {
        return site.bp?.shortName || 'Công trình trại';
      }
    }
    return null;
  }

  updatePlacementPreview(rawX, rawZ) {
    if (!this.placement.active) return;
    let tx = rawX;
    let tz = rawZ;
    const maxR = WILDERNESS_RADIUS - 10;
    const distCenter = Math.hypot(tx, tz);
    if (distCenter > maxR) {
      const sc = maxR / distCenter;
      tx *= sc;
      tz *= sc;
    }

    const r = this.placement.radius;
    const py = groundHeightAt(tx, tz);
    const stream = getStreamInfo(tx, tz);
    const rough = measureTerrainRoughness(tx, tz, r * 0.92);
    const overlap = this.placement.mode === 'infra' ? this.checkInfraOverlap(tx, tz, r) : null;

    let valid = true;
    let needsGrading = false;
    let reason = '';
    let colorMode = 'ok'; // 'ok' | 'warn' | 'bad'

    if (this.placement.mode === 'grade') {
      if (stream.dist < stream.halfWidth + r * 0.55 + 1.8) {
        valid = false;
        colorMode = 'bad';
        reason = 'Quá sát Sông Rừng — hãy chọn khu đất đồi cao hơn';
      } else if (rough.gradedFactor > 0.94 && rough.span < 0.25) {
        valid = true;
        colorMode = 'ok';
        reason = `Mặt đất đã khá phẳng (${rough.flatnessPct}%) — Click/E để san rộng thêm`;
      } else {
        valid = true;
        colorMode = 'warn';
        reason = `Đồi gồ ghề (${rough.flatnessPct}% phẳng · chênh ${rough.span.toFixed(1)}m) — Click/E gọi Máy Xúc AI san phẳng`;
      }
    } else {
      const def = this.placement.def;
      if (stream.dist < stream.halfWidth + r * 0.58 + 1.6) {
        valid = false;
        colorMode = 'bad';
        reason = 'Không thể xây nhà hoặc xưởng trên Sông Rừng';
      } else if (overlap) {
        valid = false;
        colorMode = 'bad';
        reason = `Trùng vị trí với ${overlap}`;
      } else if (def?.requiresFlat && !rough.isFlat) {
        valid = false;
        needsGrading = true;
        colorMode = 'warn';
        reason = this.camp.state.excavator?.owned
          ? `Đất gồ ghề (${rough.flatnessPct}% phẳng) — Nhấn G hoặc bấm nút gọi Máy Xúc AI san phẳng ngay đây!`
          : `Đất gồ ghề (${rough.flatnessPct}% phẳng) — Cần Máy Xúc san phẳng hoặc chọn bãi phẳng hơn!`;
      } else {
        valid = true;
        colorMode = 'ok';
        reason = `Mặt bằng phẳng đẹp (${rough.flatnessPct}%) — Click hoặc E để xây ${def?.shortName} ($${def?.cost?.toLocaleString()})`;
      }
    }

    this.placement.x = tx;
    this.placement.z = tz;
    this.placement.y = py;
    this.placement.yaw = this.placement.userYawOffset;
    this.placement.valid = valid;
    this.placement.needsGrading = needsGrading;
    this.placement.flatnessPct = rough.flatnessPct;
    this.placement.reason = reason;

    if (this.ghostGroup) {
      const a = getSharedInfraAssets();
      this.ghostGroup.position.set(tx, py, tz);
      this.ghostGroup.rotation.y = this.placement.yaw;

      const lineMat = colorMode === 'ok' ? a.ghostOkLine : colorMode === 'warn' ? a.ghostWarnLine : a.ghostBadLine;
      const fillMat = colorMode === 'ok' ? a.ghostOkFill : colorMode === 'warn' ? a.ghostWarnFill : a.ghostBadFill;
      if (this.ghostRing) this.ghostRing.material = lineMat;
      if (this.ghostDisc) this.ghostDisc.material = fillMat;

      const title = this.placement.mode === 'grade' ? 'San Phẳng Đồi (AI)' : (this.placement.def?.shortName || 'Hạ tầng');
      const sub = this.placement.mode === 'grade'
        ? (valid ? `Độ phẳng ${rough.flatnessPct}% · Click/E gọi AI` : '✕ Quá sát sông')
        : valid
          ? `✓ Phẳng ${rough.flatnessPct}% · Click/E xây`
          : needsGrading
            ? `⚠ Gồ ghề ${rough.flatnessPct}% · Nhấn G san đất`
            : '✕ Đổi vị trí';
      const hex = colorMode === 'ok' ? '#4ade80' : colorMode === 'warn' ? '#fbbf24' : '#f87171';
      const key = `${title}|${sub}|${hex}`;
      if (key !== this._lastGhostBadgeKey && this.ghostBadge?.userData?._canvasCtx) {
        this._lastGhostBadgeKey = key;
        drawWorldBadgeToCanvas(this.ghostBadge.userData._canvasCtx, title, sub, hex);
        if (this.ghostBadge.userData._canvasTex) this.ghostBadge.userData._canvasTex.needsUpdate = true;
      }
    }
  }

  /**
   * Convenience: while trying to place a house on rough ground, player can press G to immediately dispatch AI excavator there!
   */
  dispatchAiGradingAtGhost() {
    if (!this.placement.active) return { ok: false, reason: 'Chưa chọn vị trí.' };
    const r = Math.max(7.2, (this.placement.radius || 6.2) + 1.4);
    const tx = this.placement.x;
    const tz = this.placement.z;
    const res = this.dispatchAiGrading(tx, tz, r);
    if (res.ok) {
      this.cancelPlacement();
    }
    return res;
  }

  confirmPlacement() {
    if (!this.placement.active) return { ok: false, reason: 'Chưa chọn vị trí.' };

    if (this.placement.mode === 'grade') {
      if (!this.placement.valid) return { ok: false, reason: this.placement.reason };
      const res = this.dispatchAiGrading(this.placement.x, this.placement.z, this.placement.radius);
      if (res.ok) this.cancelPlacement();
      return { ...res, mode: 'grade' };
    }

    const def = this.placement.def;
    if (!this.placement.valid) {
      return {
        ok: false,
        reason: this.placement.reason,
        needsGrading: this.placement.needsGrading
      };
    }
    if ((gameState.cash || 0) < def.cost) {
      return { ok: false, reason: `Không đủ tiền — cần $${def.cost.toLocaleString()}.` };
    }

    gameState.cash = Math.max(0, (gameState.cash || 0) - def.cost);

    // Ensure foundation is crisply leveled right underneath the newly built house
    const tx = Number(this.placement.x.toFixed(2));
    const tz = Number(this.placement.z.toFixed(2));
    const yaw = Number(this.placement.yaw.toFixed(3));
    const rough = measureTerrainRoughness(tx, tz, def.radius * 0.9);
    upsertGradedPad({
      id: `pad_bld_${def.id}_${Date.now()}`,
      x: tx,
      z: tz,
      radius: def.radius + 1.2,
      targetY: Number(rough.avgH.toFixed(2)),
      progress: 1.0
    });
    this.persistPads();
    this.world?.updateWildernessTerrainRegion?.(tx, tz, def.radius + 2.6);

    const record = {
      uid: `${def.id}_${Date.now()}`,
      id: def.id,
      x: tx,
      z: tz,
      yaw
    };
    if (!Array.isArray(this.camp.state.infraBuildings)) this.camp.state.infraBuildings = [];
    this.camp.state.infraBuildings.push(record);

    this.spawnInfraBuildingMesh(def, record);
    const xpRes = addWildernessXp(this.camp.state, def.xpReward || 120);
    this.cancelPlacement();

    _tmpVec.set(tx, groundHeightAt(tx, tz) + 1.2, tz);
    this.world?.spawnParticles?.(_tmpVec, 0xfbbf24, 14);

    return { ok: true, mode: 'infra', def, record, xpRes };
  }

  // ---------------------------------------------------------------------------
  // 3D Spawners for Tiered Houses, Auto-Sawmill + Operator & Support Machinery
  // ---------------------------------------------------------------------------
  spawnInfraBuildingMesh(def, record) {
    if (this.builtObjects.has(record.uid)) return;
    const g = new THREE.Group();
    const y = groundHeightAt(record.x, record.z);
    g.position.set(record.x, y, record.z);
    g.rotation.y = record.yaw || 0;

    // Subtle stone/gravel foundation apron ring
    const a = getSharedInfraAssets();
    const apron = new THREE.Mesh(a.shadowGeo, a.shadowMat);
    apron.scale.setScalar(def.radius * 0.92);
    apron.position.y = 0.03;
    g.add(apron);

    const mainSlot = new THREE.Group();
    g.add(mainSlot);
    const assetUrl = FOREST_ASSETS[def.assetKey];
    if (assetUrl) {
      mountNormalizedGlb(mainSlot, assetUrl, {
        targetFootprint: def.footprint || 7.5,
        yaw: 0,
        lowSpec: this.camp.lowSpec
      });
    }

    let operator = null;
    let sawDisc = null;

    if (def.id === 'auto_sawmill') {
      // Mount companion circular table saw & articulated sawmill operator right beside the auto-sawmill!
      const tableSlot = new THREE.Group();
      tableSlot.position.set(3.1, 0, 1.4);
      g.add(tableSlot);
      mountNormalizedGlb(tableSlot, FOREST_ASSETS.tableSaw, {
        targetFootprint: 2.3,
        yaw: -0.5,
        lowSpec: this.camp.lowSpec
      });

      operator = createArticulatedGlbWorker(FOREST_ASSETS.workerSawmillOp, {
        targetHeight: 1.9,
        lowSpec: this.camp.lowSpec,
        yawOffset: 0,
        role: 'operator'
      });
      operator.position.set(2.3, 0, 2.3);
      operator.rotation.y = -2.2;
      g.add(operator);

      // Visible spinning steel circular saw blade indicator
      const discGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.04, 14);
      discGeo.rotateZ(Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
      sawDisc = new THREE.Mesh(discGeo, discMat);
      sawDisc.position.set(0.2, 1.28, 0.05);
      g.add(sawDisc);
    } else if (def.id === 'crane_estate') {
      // Deploy crawler crane & wheel loader beside the Highland Timber Estate!
      const craneSlot = new THREE.Group();
      craneSlot.position.set(4.5, 0, 2.4);
      g.add(craneSlot);
      mountNormalizedGlb(craneSlot, FOREST_ASSETS.crawlerCrane, {
        targetFootprint: 3.8,
        yaw: -0.7,
        lowSpec: this.camp.lowSpec
      });

      const loaderSlot = new THREE.Group();
      loaderSlot.position.set(-4.6, 0, 2.8);
      g.add(loaderSlot);
      mountNormalizedGlb(loaderSlot, FOREST_ASSETS.wheelLoader, {
        targetFootprint: 3.9,
        yaw: 0.55,
        lowSpec: this.camp.lowSpec
      });
    } else if (def.id === 'house_bietthu') {
      // Park a sleek bulldozer grader in the luxury forest villa driveway
      const dozerSlot = new THREE.Group();
      dozerSlot.position.set(5.4, 0, 3.2);
      g.add(dozerSlot);
      mountNormalizedGlb(dozerSlot, FOREST_ASSETS.bulldozerGrader, {
        targetFootprint: 3.8,
        yaw: -0.85,
        lowSpec: this.camp.lowSpec
      });
    }

    const badgeSub = def.id === 'auto_sawmill'
      ? 'Tự động xẻ gỗ → Ván'
      : `+$${def.passiveCash}/15s`;
    const badge = makeWorldBadgeSprite(def.shortName, badgeSub, '#4ade80');
    badge.position.set(0, def.id === 'house_bietthu' ? 6.2 : 4.8, 0);
    badge.scale.set(3.8, 1.05, 1);
    g.add(badge);

    this.root.add(g);
    this.builtObjects.set(record.uid, {
      def,
      record,
      group: g,
      operator,
      sawDisc,
      badge
    });
  }

  // ---------------------------------------------------------------------------
  // Per-Frame Simulation: AI Excavator, Auto-Sawmill, Passive Income, Ghost Pulse
  // ---------------------------------------------------------------------------
  update(dt, elapsed, callbacks = {}) {
    // 1. Placement ghost subtle pulse
    if (this.placement.active && this.ghostGroup?.visible && this.ghostRing) {
      const pulse = 1 + Math.sin(elapsed * 5.0) * 0.03;
      this.ghostRing.scale.setScalar(this.placement.radius * pulse);
    }

    // 2. Autonomous AI Excavator Grading Job
    if (this.aiJob && this.excavator && !this.drivingExcavator) {
      const ex = this.excavator;
      const job = this.aiJob;
      const dx = job.x - ex.x;
      const dz = job.z - ex.z;
      const dist = Math.hypot(dx, dz);
      const workStopDist = Math.max(2.6, job.radius * 0.45);

      if (job.phase === 'travel') {
        if (dist > workStopDist) {
          const desiredYaw = Math.atan2(dx, dz);
          let diff = desiredYaw - ex.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ex.yaw += diff * Math.min(1, dt * 4.5);

          const speed = 5.4 * this.getAiGradeSpeedMult();
          const step = Math.min(dist - workStopDist + 0.1, speed * dt);
          ex.x += (dx / dist) * step;
          ex.z += (dz / dist) * step;
          ex.y = this.camp.getWalkableHeightAt(ex.x, ex.z);

          const fwdSlope = groundSlopeAt(ex.x, ex.z, Math.sin(ex.yaw), Math.cos(ex.yaw));
          ex.group.position.set(ex.x, ex.y, ex.z);
          ex.group.rotation.y = ex.yaw;
          ex.bodyTilt.rotation.x += (-fwdSlope * 0.45 - ex.bodyTilt.rotation.x) * Math.min(1, dt * 6);
          if (ex.turretNode) ex.turretNode.rotation.y = ex.turretBaseY;
          if (ex.boomNode) ex.boomNode.rotation.x = ex.boomBaseX;
          this.syncExcavatorState();
        } else {
          job.phase = 'grading';
          this.refreshExcavatorBadge('Máy Xúc AI', 'Đang san phẳng đồi...');
        }
      } else if (job.phase === 'grading') {
        // Face center of pad and animate articulated 360° turret sweep + hydraulic boom dig cycle
        const desiredYaw = Math.atan2(dx, dz);
        let diff = desiredYaw - ex.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ex.yaw += diff * Math.min(1, dt * 4.0);

        ex.digPhase += dt * 3.8 * this.getAiGradeSpeedMult();
        ex.turretAngle = Math.sin(ex.digPhase * 0.72) * 0.58;
        ex.boomPitch = 0.22 + Math.sin(ex.digPhase * 1.45) * 0.24;
        if (ex.turretNode) ex.turretNode.rotation.y = ex.turretBaseY + ex.turretAngle;
        if (ex.boomNode) ex.boomNode.rotation.x = ex.boomBaseX + ex.boomPitch;

        ex.y = this.camp.getWalkableHeightAt(ex.x, ex.z);
        ex.group.position.set(ex.x, ex.y, ex.z);
        ex.group.rotation.y = ex.yaw;

        // Smoothly flatten terrain from 0 -> 1 over ~6.5 seconds (faster with Crane Estate!)
        job.progress = Math.min(1, job.progress + dt * 0.16 * this.getAiGradeSpeedMult());
        this._aiTerrainSyncTimer += dt;
        this._aiDustTimer += dt;
        this._aiSfxTimer += dt;

        if (this._aiTerrainSyncTimer >= 0.14 || job.progress >= 1) {
          this._aiTerrainSyncTimer = 0;
          upsertGradedPad({
            id: job.padId,
            x: job.x,
            z: job.z,
            radius: job.radius,
            targetY: job.targetY,
            progress: job.progress
          });
          this.world?.updateWildernessTerrainRegion?.(job.x, job.z, job.radius + 2.0);
          job.group.position.y = groundHeightAt(job.x, job.z);
        }

        if (this._aiDustTimer >= 0.22) {
          this._aiDustTimer = 0;
          const bx = ex.x + Math.sin(ex.yaw + ex.turretAngle) * 2.8;
          const bz = ex.z + Math.cos(ex.yaw + ex.turretAngle) * 2.8;
          _tmpVec.set(bx, groundHeightAt(bx, bz) + 0.3, bz);
          this.world?.spawnParticles?.(_tmpVec, 0xb48a5a, 4);
        }
        if (this._aiSfxTimer >= 0.42) {
          this._aiSfxTimer = 0;
          callbacks.onGradeSfx?.();
        }

        const pct = Math.min(100, Math.round(job.progress * 100));
        if (pct !== job._lastPct && job.badge?.userData?._canvasCtx) {
          job._lastPct = pct;
          drawWorldBadgeToCanvas(job.badge.userData._canvasCtx, 'Máy Xúc AI San Nền', `Tiến độ ${pct}%`, '#fbbf24');
          if (job.badge.userData._canvasTex) job.badge.userData._canvasTex.needsUpdate = true;
        }

        if (job.progress >= 1) {
          const donePad = { id: job.padId, x: job.x, z: job.z, radius: job.radius, targetY: job.targetY, progress: 1 };
          this.persistPads();
          this.clearAiJobVisual();
          if (ex.turretNode) ex.turretNode.rotation.y = ex.turretBaseY;
          if (ex.boomNode) ex.boomNode.rotation.x = ex.boomBaseX;
          this.refreshExcavatorBadge('Máy Xúc San Lấp', 'San nền xong! Nhấn F để lái');
          const xpRes = addWildernessXp(this.camp.state, 48);
          callbacks.onPadFlattened?.(donePad, xpRes, true);
        }
      }
    }

    // 3. Animate Auto-Sawmills + Articulated Operators
    let hasAutoSawmill = false;
    let firstAutoMillObj = null;
    for (const obj of this.builtObjects.values()) {
      if (obj.def.id === 'auto_sawmill') {
        hasAutoSawmill = true;
        if (!firstAutoMillObj) firstAutoMillObj = obj;
        const activeLogs = (this.camp.state.campLogStock || 0) > 0;
        if (obj.sawDisc) {
          obj.sawDisc.rotation.x += dt * (activeLogs ? 16.0 : 3.2);
        }
        if (obj.operator) {
          updateArticulatedGlbWorker(obj.operator, dt, {
            moving: false,
            working: activeLogs,
            carrying: false,
            distMoved: 0,
            workStyle: 'operate',
            elapsed
          });
        }
      }
    }

    if (hasAutoSawmill && (this.camp.state.campLogStock || 0) > 0) {
      this.autoSawTimer += dt;
      if (this.autoSawTimer >= 1.5) {
        this.autoSawTimer -= 1.5;
        this.camp.state.campLogStock -= 1;
        this.camp.state.campPlankStock = (this.camp.state.campPlankStock || 0) + 2;
        gameState.planks = (gameState.planks || 0) + 2;
        gameState.totalPlanksSawn = (gameState.totalPlanksSawn || 0) + 2;
        this.camp.syncLogYardVisuals?.();
        this.camp.syncSawmillVisuals?.();
        if (firstAutoMillObj) {
          _tmpVec.set(firstAutoMillObj.record.x, groundHeightAt(firstAutoMillObj.record.x, firstAutoMillObj.record.z) + 1.8, firstAutoMillObj.record.z);
          this.world?.spawnParticles?.(_tmpVec, 0xf59e0b, 3);
          callbacks.onAutoSawPlank?.(2, _tmpVec);
        }
      }
    }

    // 4. Passive Cash Income from Tiered Houses (every 15 seconds)
    const passivePerCycle = this.getPassiveCashPerCycle();
    if (passivePerCycle > 0) {
      this.passiveTimer += dt;
      if (this.passiveTimer >= 15.0) {
        this.passiveTimer -= 15.0;
        gameState.cash = (gameState.cash || 0) + passivePerCycle;
        const firstHouse = this.getBuiltInfraList()[0];
        if (firstHouse) {
          _tmpVec.set(firstHouse.x, groundHeightAt(firstHouse.x, firstHouse.z) + 3.2, firstHouse.z);
        } else {
          _tmpVec.set(0, 2.5, 0);
        }
        callbacks.onPassiveIncome?.(passivePerCycle, _tmpVec);
      }
    }
  }

  getMinimapEntities() {
    return {
      excavator: this.excavator ? { x: this.excavator.x, z: this.excavator.z, driving: this.drivingExcavator } : null,
      pads: getGradedPads().map((p) => ({ x: p.x, z: p.z, r: p.radius, done: (p.progress ?? 1) >= 0.92 })),
      infra: this.getBuiltInfraList().map((b) => ({ id: b.id, x: b.x, z: b.z }))
    };
  }

  reset() {
    this.cancelPlacement();
    this.clearAiJobVisual();
    this.drivingExcavator = false;
    if (this.excavator) {
      this.root.remove(this.excavator.group);
      disposeObject3D(this.excavator.group);
      this.excavator = null;
    }
    for (const obj of this.builtObjects.values()) {
      this.root.remove(obj.group);
      disposeObject3D(obj.group);
    }
    this.builtObjects.clear();
    setGradedPads([]);
    this.world?.rebuildAllGradedTerrain?.();
    this.passiveTimer = 0;
    this.autoSawTimer = 0;
  }

  dispose() {
    this.reset();
    if (this.root.parent) this.root.parent.remove(this.root);
    disposeObject3D(this.root);
  }
}
