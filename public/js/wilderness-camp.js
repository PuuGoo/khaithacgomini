/**
 * Wilderness Camp Builder, Interactive 3D Free Placement, Realistic Tree Bucking,
 * Loose Ground Logs & Pullable Handcart.
 * Self-contained 3D gameplay module for building a primal logging camp anywhere on the map (0 -> Camp).
 * Uses shared geometries/materials, zero per-frame allocations, and explicit GPU disposal.
 */

import * as THREE from 'three';
import {
  FOREST_ASSETS,
  mountNormalizedGlb,
  disposeObject3D,
  createLogMesh
} from './models.js';
import { drawWorldBadgeToCanvas, makeWorldBadgeSprite } from './textures.js';
import {
  STREAM_WATER_Y,
  WILDERNESS_RADIUS,
  getStreamCenterX,
  getStreamHalfWidth,
  getStreamTangentAngle,
  getStreamInfo,
  groundHeightAt,
  groundSlopeAt
} from './wilderness-map.js';
import { gameState } from './state.js';
import {
  WILDERNESS_UPGRADES,
  WILDERNESS_WORKER_DEFS,
  RAFT_UNIT_PRICES,
  generateMerchantOrders,
  buildRiverDockModel,
  buildCraftCabinModel,
  WildernessRiverTraffic,
  WildernessWorkerSystem
} from './wilderness-economy.js';
import {
  EXCAVATOR_UNLOCK,
  INFRA_CATALOG,
  getWildernessXpForLevel,
  addWildernessXp,
  WildernessInfrastructureSystem
} from './wilderness-infrastructure.js';
import {
  createInitialProgressionState,
  normalizeProgressionState,
  advanceForestryContracts,
  claimForestryContract
} from './wilderness-progression.js';
import {
  createInitialSkillLevels,
  getSkillPointSummary,
  upgradeSkillLevel,
  resetAllSkills,
  computeSkillBonuses
} from './wilderness-skills.js';

export {
  WILDERNESS_UPGRADES,
  WILDERNESS_WORKER_DEFS,
  RAFT_UNIT_PRICES,
  EXCAVATOR_UNLOCK,
  INFRA_CATALOG,
  getWildernessXpForLevel,
  addWildernessXp
};

const DEFAULT_BRIDGE_Z = 4.0;
const DEFAULT_BRIDGE_X = getStreamCenterX(DEFAULT_BRIDGE_Z);
const BRIDGE_HALF_W = 2.45;
const BRIDGE_DECK_Y = STREAM_WATER_Y + 0.88;

const DEFAULT_SAWMILL_Z = 14.0;
const DEFAULT_SAWMILL_X = getStreamCenterX(DEFAULT_SAWMILL_Z) - getStreamHalfWidth(DEFAULT_SAWMILL_Z) - 2.4;

const DEFAULT_DOCK_Z = -8.0;
const DEFAULT_DOCK_X = getStreamCenterX(DEFAULT_DOCK_Z) - getStreamHalfWidth(DEFAULT_DOCK_Z) - 2.1;

export const CAMP_BLUEPRINTS = [
  {
    id: 'campfire',
    order: 1,
    name: 'Lửa Trại Trung Tâm',
    shortName: 'Lửa trại',
    category: 'Trại cơ bản',
    placementRule: 'land',
    costLogs: 4,
    x: 3.6,
    z: -2.4,
    yaw: 0.4,
    radius: 3.1,
    benefit: 'Thắp sáng căn cứ rừng với ánh lửa ấm áp và cột khói định vị từ xa.'
  },
  {
    id: 'log_yard',
    order: 2,
    name: 'Bãi Tập Kết & Mái Che Gỗ',
    shortName: 'Bãi gỗ',
    category: 'Lưu trữ',
    placementRule: 'land',
    costLogs: 6,
    x: -7.2,
    z: -3.2,
    yaw: 0.55,
    radius: 4.0,
    benefit: 'Lưu trữ gỗ tròn an toàn tại trại và cho phép nạp nhanh vào các công trình khác.'
  },
  {
    id: 'lanterns',
    order: 3,
    name: 'Hệ Thống Trụ Đèn Gỗ',
    shortName: 'Đèn gỗ',
    category: 'Chiếu sáng',
    placementRule: 'land',
    costLogs: 6,
    x: 7.4,
    z: 3.2,
    yaw: 0.15,
    radius: 3.4,
    benefit: 'Dựng cụm 5 trụ đèn gỗ quanh khu vực bạn chọn, tự động thắp sáng vào ban đêm.'
  },
  {
    id: 'handcart',
    order: 4,
    name: 'Xe Kéo Gỗ Tay',
    shortName: 'Xe kéo',
    category: 'Vận chuyển',
    placementRule: 'land',
    costLogs: 8,
    x: -3.6,
    z: 5.4,
    yaw: 0.35,
    radius: 3.3,
    benefit: 'Đóng xe kéo tay chở tối đa 10 khúc gỗ cùng lúc, kéo vượt đồi và cầu gỗ.'
  },
  {
    id: 'log_bridge',
    order: 5,
    name: 'Cầu Gỗ Bắc Qua Sông',
    shortName: 'Cầu sông',
    category: 'Hạ tầng sông',
    placementRule: 'river_bridge',
    costLogs: 12,
    x: DEFAULT_BRIDGE_X,
    z: DEFAULT_BRIDGE_Z,
    yaw: Math.PI / 2,
    radius: 6.2,
    benefit: 'Bắc cầu gỗ vững chắc qua bất kỳ khúc nào trên Sông Rừng — đi bộ và kéo xe không bị nước cản.'
  },
  {
    id: 'waterwheel_sawmill',
    order: 6,
    name: 'Xưởng Cưa Guồng Nước',
    shortName: 'Xưởng cưa',
    category: 'Chế biến',
    placementRule: 'river_bank',
    costLogs: 16,
    x: DEFAULT_SAWMILL_X,
    z: DEFAULT_SAWMILL_Z,
    yaw: 0,
    radius: 4.8,
    benefit: 'Đặt ven bờ Sông Rừng để dòng nước quay guồng, tự động cưa 1 khúc gỗ thành 2 thanh ván xẻ.'
  },
  {
    id: 'river_dock',
    order: 7,
    name: 'Bến Thả Bè & Cầu Tàu Thương Lái',
    shortName: 'Bến bè sông',
    category: 'Kinh tế sông',
    placementRule: 'river_bank',
    costLogs: 14,
    x: DEFAULT_DOCK_X,
    z: DEFAULT_DOCK_Z,
    yaw: 0,
    radius: 4.6,
    benefit: 'Thả bè gỗ/ván/đồ gỗ trôi xuôi dòng sông bán lấy tiền, đồng thời đón Thuyền Thương Lái cập bến nhận đơn thưởng cao.'
  },
  {
    id: 'craft_cabin',
    order: 8,
    name: 'Nhà Gỗ Tiều Phu & Xưởng Mộc',
    shortName: 'Nhà gỗ mộc',
    category: 'Chế tác & Nghỉ',
    placementRule: 'land',
    costLogs: 18,
    x: -10.5,
    z: 6.5,
    yaw: 0.45,
    radius: 4.9,
    benefit: 'Chế tác 2 Ván xẻ thành 1 Đồ Gỗ Thủ Công giá trị cao ($56+), đồng thời có thể nghỉ qua đêm đón bình minh.'
  }
];

const LANTERN_LOCAL_OFFSETS = [
  { x: 0.0, z: 0.0, yaw: 0.2 },
  { x: 5.4, z: 1.6, yaw: -0.3 },
  { x: -5.2, z: 2.0, yaw: 0.8 },
  { x: 3.8, z: -4.8, yaw: -1.1 },
  { x: -4.0, z: -4.5, yaw: 1.4 }
];

const MAX_GROUND_LOGS = 48;
const BASE_HANDCART_CAPACITY = 10;
const SAWMILL_SECONDS_PER_LOG = 3.5;
const CABIN_SECONDS_PER_CRAFT = 4.2;

const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();

// Shared low-poly reusable assets (Zero GPU leaks)
let _sharedAssets = null;
function getSharedCampAssets() {
  if (_sharedAssets) return _sharedAssets;
  const markShared = (res) => {
    res.userData = res.userData || {};
    res.userData.shared = true;
    return res;
  };
  _sharedAssets = {
    stakeGeo: markShared(new THREE.CylinderGeometry(0.065, 0.08, 0.95, 6)),
    stakeMat: markShared(new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.88, metalness: 0.02 })),
    ropeMat: markShared(new THREE.MeshStandardMaterial({ color: 0xd6b98c, roughness: 0.9, metalness: 0.0 })),
    ringGeo: markShared(new THREE.RingGeometry(0.88, 1.0, 36)),
    discGeo: markShared(new THREE.CircleGeometry(0.92, 36)),
    arrowGeo: markShared(new THREE.ConeGeometry(0.42, 1.05, 4)),
    boxFrameGeo: markShared(new THREE.BoxGeometry(1, 0.24, 1)),
    ringIdleMat: markShared(new THREE.MeshBasicMaterial({
      color: 0xd98a2b,
      transparent: true,
      opacity: 0.44,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    ringTrackedMat: markShared(new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    ghostValidMat: markShared(new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    ghostValidFillMat: markShared(new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    ghostInvalidMat: markShared(new THREE.MeshBasicMaterial({
      color: 0xf87171,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    ghostInvalidFillMat: markShared(new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false
    })),
    barkMatPine: markShared(new THREE.MeshStandardMaterial({ color: 0x624026, roughness: 0.92, metalness: 0.02, flatShading: true })),
    barkMatOak: markShared(new THREE.MeshStandardMaterial({ color: 0x523925, roughness: 0.92, metalness: 0.02, flatShading: true })),
    barkMatRedwood: markShared(new THREE.MeshStandardMaterial({ color: 0x7a321a, roughness: 0.9, metalness: 0.02, flatShading: true })),
    cutEndMat: markShared(new THREE.MeshStandardMaterial({ color: 0xe6c18f, roughness: 0.76, metalness: 0.02 })),
    notchMat: markShared(new THREE.MeshStandardMaterial({ color: 0xdfb174, roughness: 0.72, metalness: 0.02 })),
    trunkSegGeo: markShared(new THREE.CylinderGeometry(0.24, 0.27, 1.08, 8)),
    notchRingGeo: markShared(new THREE.CylinderGeometry(0.265, 0.265, 0.06, 8)),
    flameGeo: markShared(new THREE.ConeGeometry(0.32, 0.82, 7)),
    flameMat: markShared(new THREE.MeshBasicMaterial({ color: 0xff8a1e })),
    flameInnerMat: markShared(new THREE.MeshBasicMaterial({ color: 0xfef08a })),
    lanternBulbGeo: markShared(new THREE.SphereGeometry(0.14, 8, 8)),
    lanternBulbMat: markShared(new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xff9f2e,
      emissiveIntensity: 0.4,
      roughness: 0.35
    })),
    smokeGeo: markShared(new THREE.DodecahedronGeometry(0.26, 0)),
    smokeMat: markShared(new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.34,
      roughness: 1.0,
      depthWrite: false
    }))
  };
  _sharedAssets.ringGeo.rotateX(-Math.PI / 2);
  _sharedAssets.discGeo.rotateX(-Math.PI / 2);
  _sharedAssets.arrowGeo.rotateX(Math.PI / 2);
  _sharedAssets.trunkSegGeo.rotateX(Math.PI / 2);
  _sharedAssets.notchRingGeo.rotateX(Math.PI / 2);
  return _sharedAssets;
}

export function createDefaultWildernessCampState() {
  const structures = {};
  for (const bp of CAMP_BLUEPRINTS) {
    structures[bp.id] = {
      deliveredLogs: 0,
      built: false,
      placed: false,
      x: bp.x,
      z: bp.z,
      yaw: bp.yaw
    };
  }
  return {
    structures,
    campLogStock: 0,
    campPlankStock: 0,
    campCraftStock: 0,
    sawmillQueue: 0,
    sawmillProgress: 0,
    craftQueue: 0,
    craftProgress: 0,
    trackedSiteId: null,
    upgrades: {
      axe: 1,
      cart: 1,
      sawmill: 1,
      forge: 1,
      quarters: 1
    },
    progression: createInitialProgressionState(),
    workers: {
      porters: 0,
      choppers: 0
    },
    merchant: {
      status: 'docked',
      timer: 85,
      boatZ: DEFAULT_DOCK_Z,
      orders: generateMerchantOrders(0),
      ordersCompleted: 0
    },
    saplings: [],
    level: 1,
    xp: 0,
    gradedPads: [],
    excavator: {
      owned: false,
      x: 6.0,
      z: 4.0,
      yaw: 0.4
    },
    infraBuildings: [],
    handcart: {
      x: -3.6,
      z: 5.4,
      yaw: 0.35,
      logs: 0
    }
  };
}

export function ensureWildernessCampState() {
  const def = createDefaultWildernessCampState();
  if (!gameState.wildernessCamp || typeof gameState.wildernessCamp !== 'object') {
    gameState.wildernessCamp = def;
    return gameState.wildernessCamp;
  }
  const wc = gameState.wildernessCamp;
  if (!wc.structures || typeof wc.structures !== 'object') wc.structures = {};
  for (const bp of CAMP_BLUEPRINTS) {
    const cur = wc.structures[bp.id];
    if (!cur || typeof cur !== 'object') {
      wc.structures[bp.id] = {
        deliveredLogs: 0,
        built: false,
        placed: false,
        x: bp.x,
        z: bp.z,
        yaw: bp.yaw
      };
    } else {
      cur.deliveredLogs = Math.max(0, Math.min(bp.costLogs, Math.floor(Number(cur.deliveredLogs) || 0)));
      cur.built = Boolean(cur.built || cur.deliveredLogs >= bp.costLogs);
      if (cur.built) cur.deliveredLogs = bp.costLogs;
      // Preserve custom placed flag; auto-mark placed if logs already delivered or built
      cur.placed = Boolean(cur.placed || cur.built || cur.deliveredLogs > 0);
      cur.x = Number.isFinite(Number(cur.x)) ? Number(cur.x) : bp.x;
      cur.z = Number.isFinite(Number(cur.z)) ? Number(cur.z) : bp.z;
      cur.yaw = Number.isFinite(Number(cur.yaw)) ? Number(cur.yaw) : bp.yaw;
    }
  }
  wc.campLogStock = Math.max(0, Math.floor(Number(wc.campLogStock) || 0));
  wc.campPlankStock = Math.max(0, Math.floor(Number(wc.campPlankStock) || 0));
  wc.campCraftStock = Math.max(0, Math.floor(Number(wc.campCraftStock) || 0));
  wc.sawmillQueue = Math.max(0, Math.floor(Number(wc.sawmillQueue) || 0));
  wc.sawmillProgress = Math.max(0, Number(wc.sawmillProgress) || 0);
  wc.craftQueue = Math.max(0, Math.floor(Number(wc.craftQueue) || 0));
  wc.craftProgress = Math.max(0, Number(wc.craftProgress) || 0);

  if (!wc.upgrades || typeof wc.upgrades !== 'object') {
    wc.upgrades = { ...def.upgrades };
  } else {
    wc.upgrades.axe = Math.max(1, Math.min(3, Math.floor(Number(wc.upgrades.axe) || 1)));
    wc.upgrades.cart = Math.max(1, Math.min(3, Math.floor(Number(wc.upgrades.cart) || 1)));
    wc.upgrades.sawmill = Math.max(1, Math.min(3, Math.floor(Number(wc.upgrades.sawmill) || 1)));
    wc.upgrades.forge = Math.max(1, Math.min(3, Math.floor(Number(wc.upgrades.forge) || 1)));
    wc.upgrades.quarters = Math.max(1, Math.min(3, Math.floor(Number(wc.upgrades.quarters) || 1)));
  }
  wc.progression = normalizeProgressionState(wc.progression);

  if (!wc.workers || typeof wc.workers !== 'object') {
    wc.workers = { ...def.workers };
  } else {
    wc.workers.porters = Math.max(0, Math.min(5, Math.floor(Number(wc.workers.porters) || 0)));
    wc.workers.choppers = Math.max(0, Math.min(5, Math.floor(Number(wc.workers.choppers) || 0)));
  }

  if (!wc.merchant || typeof wc.merchant !== 'object') {
    wc.merchant = { ...def.merchant, orders: generateMerchantOrders(0) };
  } else {
    if (!['away', 'arriving', 'docked', 'departing'].includes(wc.merchant.status)) {
      wc.merchant.status = 'docked';
    }
    wc.merchant.timer = Number.isFinite(Number(wc.merchant.timer)) ? Number(wc.merchant.timer) : 65;
    wc.merchant.boatZ = Number.isFinite(Number(wc.merchant.boatZ)) ? Number(wc.merchant.boatZ) : DEFAULT_DOCK_Z;
    wc.merchant.ordersCompleted = Math.max(0, Math.floor(Number(wc.merchant.ordersCompleted) || 0));
    if (!Array.isArray(wc.merchant.orders) || wc.merchant.orders.length === 0) {
      wc.merchant.orders = generateMerchantOrders(wc.merchant.ordersCompleted);
    }
  }

  if (!Array.isArray(wc.saplings)) wc.saplings = [];
  wc.level = Math.max(1, Math.min(30, Math.floor(Number(wc.level) || 1)));
  wc.xp = Math.max(0, Math.floor(Number(wc.xp) || 0));
  if (!Array.isArray(wc.gradedPads)) wc.gradedPads = [];
  if (!wc.excavator || typeof wc.excavator !== 'object') {
    wc.excavator = { ...def.excavator };
  } else {
    wc.excavator.owned = Boolean(wc.excavator.owned);
    wc.excavator.x = Number.isFinite(Number(wc.excavator.x)) ? Number(wc.excavator.x) : 6.0;
    wc.excavator.z = Number.isFinite(Number(wc.excavator.z)) ? Number(wc.excavator.z) : 4.0;
    wc.excavator.yaw = Number.isFinite(Number(wc.excavator.yaw)) ? Number(wc.excavator.yaw) : 0.4;
  }
  if (!Array.isArray(wc.infraBuildings)) wc.infraBuildings = [];

  const cartCap = (WILDERNESS_UPGRADES.cart[(wc.upgrades.cart || 1) - 1] || WILDERNESS_UPGRADES.cart[0]).capacity;
  if (!wc.handcart || typeof wc.handcart !== 'object') {
    wc.handcart = { ...def.handcart };
  } else {
    wc.handcart.x = Number.isFinite(wc.handcart.x) ? wc.handcart.x : def.handcart.x;
    wc.handcart.z = Number.isFinite(wc.handcart.z) ? wc.handcart.z : def.handcart.z;
    wc.handcart.yaw = Number.isFinite(wc.handcart.yaw) ? wc.handcart.yaw : def.handcart.yaw;
    wc.handcart.logs = Math.max(0, Math.min(cartCap, Math.floor(Number(wc.handcart.logs) || 0)));
  }
  if (
    wc.trackedSiteId
    && (!wc.structures[wc.trackedSiteId] || wc.structures[wc.trackedSiteId].built || !wc.structures[wc.trackedSiteId].placed)
  ) {
    const nextPlacedUnbuilt = CAMP_BLUEPRINTS.find(
      (b) => wc.structures[b.id]?.placed && !wc.structures[b.id]?.built
    );
    wc.trackedSiteId = nextPlacedUnbuilt ? nextPlacedUnbuilt.id : null;
  }
  return wc;
}

export class WildernessCampSystem {
  constructor(world, options = {}) {
    this.world = world;
    this.scene = world.scene;
    this.lowSpec = Boolean(options.lowSpec);
    this.root = new THREE.Group();
    this.root.name = 'WildernessCampRoot';
    this.root.userData.wildernessKeep = true;
    this.scene.add(this.root);

    this.state = ensureWildernessCampState();
    this.sites = new Map();
    this.felledTrunks = [];
    this.groundLogs = [];
    this.handcart = null;
    this.cartAttached = false;

    this.campfireLight = null;
    this.campfireFlames = [];
    this.campfireSmokes = [];
    this.lanternBulbs = [];
    this.lanternGlowLight = null;
    this.logYardVisuals = [];
    this.sawmillWheel = null;
    this.sawmillPlankVisuals = [];
    this.sawmillBadge = null;
    this.logYardBadge = null;
    this.dockBadge = null;
    this.cabinBadge = null;

    // Interactive 3D Free Placement Preview State
    this.placement = {
      active: false,
      siteId: null,
      bp: null,
      x: 0,
      z: 0,
      y: 0,
      yaw: 0,
      userYawOffset: 0,
      valid: false,
      reason: ''
    };
    this.ghostGroup = null;
    this.ghostRing = null;
    this.ghostDisc = null;
    this.ghostArrow = null;
    this.ghostBox = null;
    this.ghostWheelMarker = null;
    this.ghostStakes = [];
    this.ghostBadge = null;
    this._lastGhostBadgeText = '';

    this._idSeq = 1;
    this.initPlacementGhost();
    this.initAllSites();
    if (this.isBuilt('handcart')) {
      this.spawnHandcartEntity();
    }
    this.riverTraffic = new WildernessRiverTraffic(this);
    this.workerSystem = new WildernessWorkerSystem(this);
    this.infra = new WildernessInfrastructureSystem(this);
    this.upgradeVisualGroup = new THREE.Group();
    this.upgradeVisualGroup.name = 'WildernessCampUpgradeVisuals';
    this.root.add(this.upgradeVisualGroup);
    this.forgeGrindWheel = null;
    this.syncCampUpgradeVisuals();
  }

  getMaxWorkersForRole(role) {
    const def = WILDERNESS_WORKER_DEFS[role];
    if (!def) return 2;
    const infraBonus = this.infra ? this.infra.getWorkerCapBonus() : 0;
    const quartersBonus = this.getQuartersStats()?.workerCapBonus || 0;
    return Math.min(def.costs.length, (def.max || 2) + infraBonus + quartersBonus);
  }

  awardXp(amount) {
    return addWildernessXp(this.state, amount);
  }

  getSkillLevels() {
    if (!this.state.progression) {
      this.state.progression = createInitialProgressionState();
    }
    if (!this.state.progression.skills) {
      this.state.progression.skills = createInitialSkillLevels();
    }
    return this.state.progression.skills;
  }

  getSkillBonuses() {
    return computeSkillBonuses(this.getSkillLevels());
  }

  getSkillSummary() {
    const level = this.state.level || 1;
    const contractsDone = this.state.progression?.contractsCompleted || 0;
    return getSkillPointSummary(level, contractsDone, this.getSkillLevels());
  }

  getShoulderLogCap() {
    const bonuses = this.getSkillBonuses();
    return 3 + (bonuses.shoulderCapBonus || 0);
  }

  upgradeSkill(skillId) {
    const level = this.state.level || 1;
    const contractsDone = this.state.progression?.contractsCompleted || 0;
    const res = upgradeSkillLevel(this.getSkillLevels(), skillId, level, contractsDone);
    if (!res.ok) return res;
    this.state.progression.skills = res.levels;
    return res;
  }

  resetSkills() {
    const level = this.state.level || 1;
    const contractsDone = this.state.progression?.contractsCompleted || 0;
    const res = resetAllSkills(level, contractsDone);
    if (!this.state.progression) {
      this.state.progression = createInitialProgressionState();
    }
    this.state.progression.skills = res.levels;
    return res;
  }

  getAxeStats() {
    const lv = this.state.upgrades?.axe || 1;
    const base = WILDERNESS_UPGRADES.axe[Math.max(0, Math.min(2, lv - 1))];
    const sb = this.getSkillBonuses();
    return {
      ...base,
      dmg: Math.max(1, Math.round(base.dmg * sb.chopDamageMult * 10) / 10),
      cooldown: Math.max(0.28, Math.round(base.cooldown * sb.chopCooldownMult * 100) / 100)
    };
  }

  getCartStats() {
    const lv = this.state.upgrades?.cart || 1;
    return WILDERNESS_UPGRADES.cart[Math.max(0, Math.min(2, lv - 1))];
  }

  getForgeStats() {
    const lv = this.state.upgrades?.forge || 1;
    return WILDERNESS_UPGRADES.forge[Math.max(0, Math.min(2, lv - 1))];
  }

  getQuartersStats() {
    const lv = this.state.upgrades?.quarters || 1;
    return WILDERNESS_UPGRADES.quarters[Math.max(0, Math.min(2, lv - 1))];
  }

  getWorkerSpeedMult() {
    const base = this.getQuartersStats()?.speedMult || 1.0;
    return base * (this.getSkillBonuses().workerSpeedMult || 1.0);
  }

  getHandcartCapacity() {
    return this.getCartStats()?.capacity || BASE_HANDCART_CAPACITY;
  }

  getHandcartSpeedMult() {
    return this.getCartStats()?.speedMult || 1.0;
  }

  getSawmillSpeedMult(isRain = false) {
    const lv = this.state.upgrades?.sawmill || 1;
    const base = WILDERNESS_UPGRADES.sawmill[Math.max(0, Math.min(2, lv - 1))]?.speedMult || 1.0;
    return base * (isRain ? 1.4 : 1.0) * (this.getSkillBonuses().sawmillSpeedMult || 1.0);
  }

  recordProgressionEvent(eventType, amount = 1) {
    if (!this.state.progression) {
      this.state.progression = createInitialProgressionState();
    }
    return advanceForestryContracts(this.state.progression, eventType, amount);
  }

  claimContract(contractId) {
    if (!this.state.progression) {
      this.state.progression = createInitialProgressionState();
    }
    const res = claimForestryContract(this.state.progression, contractId);
    if (!res.ok) return res;
    const tradeMult = this.getSkillBonuses().tradePriceMult || 1.0;
    const finalCash = Math.round(res.claimed.rewardCash * tradeMult);
    res.claimed = { ...res.claimed, rewardCash: finalCash };
    gameState.cash = (gameState.cash || 0) + finalCash;
    const xpRes = this.awardXp(Math.round(res.claimed.rewardRep * 0.8));
    return { ...res, xpRes };
  }

  syncCampUpgradeVisuals() {
    if (!this.upgradeVisualGroup) return;
    while (this.upgradeVisualGroup.children.length > 0) {
      const c = this.upgradeVisualGroup.children[0];
      this.upgradeVisualGroup.remove(c);
      disposeObject3D(c);
    }
    this.forgeGrindWheel = null;

    const forgeLv = this.state.upgrades?.forge || 1;
    const quartersLv = this.state.upgrades?.quarters || 1;

    // Anchor upgrades around central clearing / campfire / log yard
    const anchorSite = this.isBuilt('campfire')
      ? this.getSiteTransform('campfire')
      : this.isBuilt('log_yard')
        ? this.getSiteTransform('log_yard')
        : { x: 0, z: 0 };

    const timberMat = new THREE.MeshStandardMaterial({ color: 0x6f4627, roughness: 0.86, metalness: 0.04 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x646b72, roughness: 0.92, metalness: 0.06 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3f4650, roughness: 0.36, metalness: 0.84 });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xf97316,
      emissiveIntensity: 1.65,
      roughness: 0.4
    });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.25
    });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.78, metalness: 0.02 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.32, metalness: 0.78 });

    // 1. Camp Forge Anvil & Grindstone Canopy (Forge Tier 2 & 3)
    if (forgeLv >= 2) {
      const fx = anchorSite.x + 3.4;
      const fz = anchorSite.z - 2.6;
      const fy = groundHeightAt(fx, fz);
      const forgeGrp = new THREE.Group();
      forgeGrp.position.set(fx, fy, fz);

      // Stone hearth plinth & glowing coal bed
      const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.78, 1.15), stoneMat);
      hearth.position.set(0, 0.39, 0);
      hearth.castShadow = !this.lowSpec;
      hearth.receiveShadow = true;
      const embers = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.72), emberMat);
      embers.position.set(0, 0.80, 0);
      forgeGrp.add(hearth, embers);

      // Forged iron anvil on timber stump
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.56, 8), timberMat);
      stump.position.set(1.15, 0.28, 0.22);
      const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.26), ironMat);
      anvilBase.position.set(1.15, 0.67, 0.22);
      const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 6), ironMat);
      anvilHorn.rotation.z = -Math.PI / 2;
      anvilHorn.position.set(1.48, 0.72, 0.22);
      forgeGrp.add(stump, anvilBase, anvilHorn);

      // Tier 3 adds pitched timber canopy + spinning whetstone grind wheel
      if (forgeLv >= 3) {
        const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.25, 6);
        for (const [px, pz] of [[-0.85, -0.75], [1.75, -0.75], [-0.85, 0.85], [1.75, 0.85]]) {
          const post = new THREE.Mesh(postGeo, timberMat);
          post.position.set(px, 1.12, pz);
          forgeGrp.add(post);
        }
        const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 2.15), timberMat);
        roof.position.set(0.45, 2.32, 0.05);
        roof.rotation.x = 0.14;
        roof.castShadow = !this.lowSpec;
        forgeGrp.add(roof);

        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.58, 0.34), timberMat);
        stand.position.set(-1.12, 0.29, 0.28);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 14), stoneMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(-1.12, 0.72, 0.28);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), goldTrimMat);
        hub.rotation.x = Math.PI / 2;
        wheel.add(hub);
        forgeGrp.add(stand, wheel);
        this.forgeGrindWheel = wheel;
      }

      this.upgradeVisualGroup.add(forgeGrp);
    }

    // 2. Camp Timber Lantern Arch & Banners (Worker Quarters Tier 2 & 3)
    if (quartersLv >= 2) {
      const gx = anchorSite.x - 3.6;
      const gz = anchorSite.z + 3.2;
      const gy = groundHeightAt(gx, gz);
      const gateGrp = new THREE.Group();
      gateGrp.position.set(gx, gy, gz);

      const pillarGeo = new THREE.CylinderGeometry(0.14, 0.17, 3.2, 8);
      const pL = new THREE.Mesh(pillarGeo, timberMat);
      pL.position.set(-1.55, 1.6, 0);
      const pR = new THREE.Mesh(pillarGeo, timberMat);
      pR.position.set(1.55, 1.6, 0);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.26, 0.28), timberMat);
      beam.position.set(0, 3.15, 0);
      gateGrp.add(pL, pR, beam);

      for (const lx of [-1.2, 1.2]) {
        const lan = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), lanternMat);
        lan.position.set(lx, 2.75, 0.18);
        gateGrp.add(lan);
      }

      if (quartersLv >= 3) {
        // Forestry Guild emerald & gold banner crest hanging from the gate arch
        const banner = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.96, 0.06), bannerMat);
        banner.position.set(0, 2.52, 0.08);
        const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), goldTrimMat);
        crest.position.set(0, 2.62, 0.14);
        gateGrp.add(banner, crest);
      }

      this.upgradeVisualGroup.add(gateGrp);
    }
  }

  isBuilt(id) {
    return Boolean(this.state.structures[id]?.built);
  }

  isPlaced(id) {
    const st = this.state.structures[id];
    return Boolean(st && (st.placed || st.built));
  }

  getSiteTransform(id) {
    const bp = CAMP_BLUEPRINTS.find((b) => b.id === id);
    const st = this.state.structures[id];
    if (!bp) return null;
    return {
      bp,
      id: bp.id,
      x: Number.isFinite(st?.x) ? st.x : bp.x,
      z: Number.isFinite(st?.z) ? st.z : bp.z,
      yaw: Number.isFinite(st?.yaw) ? st.yaw : bp.yaw,
      placed: Boolean(st?.placed || st?.built),
      built: Boolean(st?.built),
      deliveredLogs: st?.deliveredLogs || 0
    };
  }

  getBuiltCount() {
    let count = 0;
    for (const bp of CAMP_BLUEPRINTS) {
      if (this.isBuilt(bp.id)) count++;
    }
    return count;
  }

  getTrackedBlueprint() {
    const id = this.state.trackedSiteId;
    if (id && this.isPlaced(id) && !this.isBuilt(id)) {
      return this.getSiteTransform(id);
    }
    const next = CAMP_BLUEPRINTS.find((b) => this.isPlaced(b.id) && !this.isBuilt(b.id)) || null;
    this.state.trackedSiteId = next ? next.id : null;
    return next ? this.getSiteTransform(next.id) : null;
  }

  setTrackedSite(id) {
    const tf = this.getSiteTransform(id);
    if (!tf || !tf.placed) return null;
    this.state.trackedSiteId = id;
    this.syncTrackedRings();
    return tf.bp;
  }

  // ---------------------------------------------------------------------------
  // Dynamic Bridge Metrics & Walkability (works anywhere along the winding river)
  // ---------------------------------------------------------------------------
  getBridgeMetrics() {
    const tf = this.getSiteTransform('log_bridge');
    const bx = tf ? tf.x : DEFAULT_BRIDGE_X;
    const bz = tf ? tf.z : DEFAULT_BRIDGE_Z;
    const yaw = tf ? tf.yaw : Math.PI / 2;
    const halfLen = Math.max(8.0, getStreamHalfWidth(bz) + 2.5);
    return { x: bx, z: bz, yaw, halfLen, halfW: BRIDGE_HALF_W, deckY: BRIDGE_DECK_Y };
  }

  isOnBuiltBridge(x, z) {
    if (!this.isBuilt('log_bridge')) return false;
    const b = this.getBridgeMetrics();
    const dx = x - b.x;
    const dz = z - b.z;
    const alongX = Math.sin(b.yaw);
    const alongZ = Math.cos(b.yaw);
    const sideX = Math.cos(b.yaw);
    const sideZ = -Math.sin(b.yaw);
    const localAlong = Math.abs(dx * alongX + dz * alongZ);
    const localAcross = Math.abs(dx * sideX + dz * sideZ);
    return localAcross <= b.halfW && localAlong <= b.halfLen + 1.2;
  }

  getWalkableHeightAt(x, z) {
    const baseY = groundHeightAt(x, z);
    if (!this.isBuilt('log_bridge')) return baseY;
    const b = this.getBridgeMetrics();
    const dx = x - b.x;
    const dz = z - b.z;
    const alongX = Math.sin(b.yaw);
    const alongZ = Math.cos(b.yaw);
    const sideX = Math.cos(b.yaw);
    const sideZ = -Math.sin(b.yaw);
    const localAlong = Math.abs(dx * alongX + dz * alongZ);
    const localAcross = Math.abs(dx * sideX + dz * sideZ);
    if (localAcross <= b.halfW && localAlong <= b.halfLen + 1.35) {
      const rampT = localAlong <= b.halfLen - 1.5
        ? 1
        : Math.max(0, 1 - (localAlong - (b.halfLen - 1.5)) / 2.85);
      const arch = Math.cos(Math.min(1, localAlong / b.halfLen) * Math.PI * 0.5) * 0.26;
      const bridgeY = b.deckY + arch;
      return Math.max(baseY, baseY * (1 - rampT) + bridgeY * rampT);
    }
    return baseY;
  }

  // ---------------------------------------------------------------------------
  // Interactive 3D Structure Placement Mode (Free Choose & Relocate)
  // ---------------------------------------------------------------------------
  initPlacementGhost() {
    const assets = getSharedCampAssets();
    const g = new THREE.Group();
    g.name = 'CampPlacementGhost';
    g.visible = false;
    g.renderOrder = 10;

    const disc = new THREE.Mesh(assets.discGeo, assets.ghostValidFillMat);
    disc.position.y = 0.12;
    g.add(disc);

    const ring = new THREE.Mesh(assets.ringGeo, assets.ghostValidMat);
    ring.position.y = 0.16;
    g.add(ring);

    const arrow = new THREE.Mesh(assets.arrowGeo, assets.ghostValidMat);
    arrow.position.set(0, 0.32, 3.2);
    g.add(arrow);

    // Rectangular deck outline for bridges & river sawmills
    const box = new THREE.Mesh(assets.boxFrameGeo, assets.ghostValidFillMat);
    box.position.y = 0.28;
    box.visible = false;
    g.add(box);

    // Waterwheel indicator cylinder on river-facing side for sawmill placement
    const wheelGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.55, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMarker = new THREE.Mesh(wheelGeo, assets.ghostValidMat);
    wheelMarker.position.set(2.85, 0.95, 0);
    wheelMarker.visible = false;
    g.add(wheelMarker);

    const stakes = [];
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(assets.stakeGeo, assets.ghostValidMat);
      st.position.y = 0.48;
      g.add(st);
      stakes.push(st);
    }

    const badge = makeWorldBadgeSprite('Chọn vị trí', 'Click hoặc E để đặt', '#4ade80');
    badge.position.set(0, 2.7, 0);
    badge.scale.set(4.1, 1.15, 1);
    g.add(badge);

    this.root.add(g);
    this.ghostGroup = g;
    this.ghostRing = ring;
    this.ghostDisc = disc;
    this.ghostArrow = arrow;
    this.ghostBox = box;
    this.ghostWheelMarker = wheelMarker;
    this.ghostStakes = stakes;
    this.ghostBadge = badge;
  }

  isPlacing() {
    return Boolean(this.placement.active);
  }

  getPlacementInfo() {
    if (!this.placement.active || !this.placement.bp) return null;
    return {
      siteId: this.placement.siteId,
      name: this.placement.bp.name,
      shortName: this.placement.bp.shortName,
      placementRule: this.placement.bp.placementRule,
      x: this.placement.x,
      z: this.placement.z,
      yaw: this.placement.yaw,
      valid: this.placement.valid,
      reason: this.placement.reason
    };
  }

  startPlacement(siteId, initialX = 0, initialZ = 0) {
    const bp = CAMP_BLUEPRINTS.find((b) => b.id === siteId);
    if (!bp || this.isBuilt(siteId)) return null;

    this.placement.active = true;
    this.placement.siteId = bp.id;
    this.placement.bp = bp;
    this.placement.userYawOffset = 0;

    if (this.ghostGroup) {
      this.ghostGroup.visible = true;
      const isBridge = bp.placementRule === 'river_bridge';
      const isSawmill = bp.placementRule === 'river_bank';
      const ringR = Math.min(4.2, bp.radius * 0.86);

      this.ghostRing.visible = !isBridge;
      this.ghostDisc.visible = !isBridge;
      this.ghostRing.scale.setScalar(ringR);
      this.ghostDisc.scale.setScalar(ringR);

      this.ghostBox.visible = isBridge || isSawmill;
      if (isSawmill) {
        this.ghostBox.scale.set(5.4, 1.0, 5.2);
        this.ghostBox.position.set(0, 0.45, 0);
      }
      this.ghostWheelMarker.visible = isSawmill;
      this.ghostArrow.position.set(0, 0.38, isBridge ? 3.2 : ringR + 0.9);

      for (let i = 0; i < this.ghostStakes.length; i++) {
        this.ghostStakes[i].visible = !isBridge;
        const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
        this.ghostStakes[i].position.set(Math.cos(a) * ringR, 0.52, Math.sin(a) * ringR);
      }
    }

    this._lastGhostBadgeText = '';
    this.updatePlacementPreview(initialX, initialZ);
    return this.getPlacementInfo();
  }

  rotatePlacement(deltaRad = Math.PI / 6) {
    if (!this.placement.active) return;
    this.placement.userYawOffset = (this.placement.userYawOffset + deltaRad) % (Math.PI * 2);
    this.updatePlacementPreview(this.placement.x, this.placement.z);
  }

  cancelPlacement() {
    this.placement.active = false;
    this.placement.siteId = null;
    this.placement.bp = null;
    if (this.ghostGroup) this.ghostGroup.visible = false;
  }

  checkSiteOverlap(siteId, x, z, radius) {
    for (const bp of CAMP_BLUEPRINTS) {
      if (bp.id === siteId) continue;
      if (!this.isPlaced(bp.id)) continue;
      const other = this.getSiteTransform(bp.id);
      if (!other) continue;
      const minGap = Math.max(3.6, (radius + bp.radius) * 0.78);
      if (Math.hypot(x - other.x, z - other.z) < minGap) {
        return bp.shortName;
      }
    }
    return null;
  }

  updatePlacementPreview(rawX, rawZ) {
    if (!this.placement.active || !this.placement.bp) return;
    const bp = this.placement.bp;

    // Keep inside playable 360° valley
    let tx = rawX;
    let tz = rawZ;
    const maxR = WILDERNESS_RADIUS - 8;
    const distCenter = Math.hypot(tx, tz);
    if (distCenter > maxR) {
      const sc = maxR / distCenter;
      tx *= sc;
      tz *= sc;
    }

    let valid = true;
    let reason = 'Vị trí hợp lệ — Click hoặc nhấn E để đặt';
    let yaw = bp.yaw + this.placement.userYawOffset;
    let py = groundHeightAt(tx, tz);

    const cx = getStreamCenterX(tz);
    const hw = getStreamHalfWidth(tz);
    const tang = getStreamTangentAngle(tz);

    if (bp.placementRule === 'river_bridge') {
      // Snap cleanly across the winding river at cursor Z
      const distToRiver = Math.abs(tx - cx);
      if (distToRiver <= hw + 22) {
        tx = cx;
        yaw = Math.PI / 2 + tang + (Math.round(this.placement.userYawOffset / Math.PI) * Math.PI);
        py = BRIDGE_DECK_Y - 0.14;
        const spanLen = Math.max(8.0, hw + 2.5) * 2.05;
        if (this.ghostBox) {
          this.ghostBox.scale.set(BRIDGE_HALF_W * 2.0, 1.0, spanLen);
          this.ghostBox.position.set(0, 0.22, 0);
        }
        const overlap = this.checkSiteOverlap(bp.id, tx, tz, bp.radius);
        if (overlap) {
          valid = false;
          reason = `Trùng khu vực với ${overlap}`;
        } else {
          valid = true;
          reason = 'Khớp 2 bờ Sông Rừng — Click hoặc E để đặt cầu';
        }
      } else {
        valid = false;
        py = groundHeightAt(tx, tz);
        if (this.ghostBox) {
          this.ghostBox.scale.set(BRIDGE_HALF_W * 2.0, 1.0, 16.0);
        }
        reason = 'Di chuyển lại gần Sông Rừng để bắc cầu qua sông';
      }
    } else if (bp.placementRule === 'river_bank') {
      const distToRiver = Math.abs(tx - cx);
      if (distToRiver <= hw + 18) {
        const side = tx >= cx ? 1 : -1;
        tx = cx + side * (hw + 2.35);
        // Wheel sits on local +X; point local +X toward river center
        yaw = side < 0 ? tang : tang + Math.PI;
        py = groundHeightAt(tx, tz);
        const overlap = this.checkSiteOverlap(bp.id, tx, tz, bp.radius);
        if (overlap) {
          valid = false;
          reason = `Trùng vị trí với ${overlap}`;
        } else {
          valid = true;
          reason = 'Khớp bờ sông — guồng nước chạm dòng chảy';
        }
      } else {
        valid = false;
        py = groundHeightAt(tx, tz);
        reason = 'Hãy đưa vị trí lại gần bờ Sông Rừng';
      }
    } else {
      // Standard land placement anywhere on hills, clearings, or forest floor
      const stream = getStreamInfo(tx, tz);
      const slopeX = Math.abs(groundSlopeAt(tx, tz, 1, 0));
      const slopeZ = Math.abs(groundSlopeAt(tx, tz, 0, 1));
      const maxSlope = Math.max(slopeX, slopeZ);
      const overlap = this.checkSiteOverlap(bp.id, tx, tz, bp.radius);

      if (stream.dist < stream.halfWidth + Math.max(1.5, bp.radius * 0.42)) {
        valid = false;
        reason = 'Không thể đặt công trình này dưới lòng sông';
      } else if (maxSlope > 0.46) {
        valid = false;
        reason = 'Sườn đồi quá dốc — hãy chọn bãi phẳng hơn';
      } else if (overlap) {
        valid = false;
        reason = `Trùng vị trí với ${overlap}`;
      } else {
        valid = true;
        reason = 'Vị trí hợp lệ — Click hoặc E để đặt cọc';
      }
    }

    this.placement.x = tx;
    this.placement.z = tz;
    this.placement.y = py;
    this.placement.yaw = yaw;
    this.placement.valid = valid;
    this.placement.reason = reason;

    if (this.ghostGroup) {
      const assets = getSharedCampAssets();
      this.ghostGroup.position.set(tx, py, tz);
      this.ghostGroup.rotation.y = yaw;
      const lineMat = valid ? assets.ghostValidMat : assets.ghostInvalidMat;
      const fillMat = valid ? assets.ghostValidFillMat : assets.ghostInvalidFillMat;
      if (this.ghostRing) this.ghostRing.material = lineMat;
      if (this.ghostDisc) this.ghostDisc.material = fillMat;
      if (this.ghostArrow) this.ghostArrow.material = lineMat;
      if (this.ghostBox) this.ghostBox.material = fillMat;
      if (this.ghostWheelMarker) this.ghostWheelMarker.material = lineMat;
      for (const st of this.ghostStakes) st.material = lineMat;

      const badgeText = `${bp.shortName}|${valid ? 'ok' : 'no'}|${reason}`;
      if (badgeText !== this._lastGhostBadgeText && this.ghostBadge?.userData?._canvasCtx) {
        this._lastGhostBadgeText = badgeText;
        drawWorldBadgeToCanvas(
          this.ghostBadge.userData._canvasCtx,
          bp.shortName,
          valid ? '✓ Click / E để đặt' : '✕ Đổi vị trí',
          valid ? '#4ade80' : '#f87171'
        );
        if (this.ghostBadge.userData._canvasTex) {
          this.ghostBadge.userData._canvasTex.needsUpdate = true;
        }
      }
    }
  }

  confirmPlacement() {
    if (!this.placement.active || !this.placement.bp) {
      return { ok: false, reason: 'Chưa chọn công trình để đặt.' };
    }
    if (!this.placement.valid) {
      return { ok: false, reason: this.placement.reason || 'Vị trí không hợp lệ.' };
    }

    const bp = this.placement.bp;
    const st = this.state.structures[bp.id];
    const wasPlaced = Boolean(st.placed);
    st.placed = true;
    st.x = Number(this.placement.x.toFixed(2));
    st.z = Number(this.placement.z.toFixed(2));
    st.yaw = Number(this.placement.yaw.toFixed(3));

    if (bp.id === 'handcart' && !st.built) {
      this.state.handcart.x = st.x;
      this.state.handcart.z = st.z;
      this.state.handcart.yaw = st.yaw;
    }

    const site = this.sites.get(bp.id);
    if (site) {
      this.applySiteTransformToMesh(site);
      site.group.visible = true;
      site.stakeGroup.visible = !st.built;
      this.refreshSiteBadge(site);
    }

    this.state.trackedSiteId = bp.id;
    this.syncTrackedRings();

    const placedX = st.x;
    const placedY = this.placement.y;
    const placedZ = st.z;
    this.cancelPlacement();

    this.world.spawnParticles(new THREE.Vector3(placedX, placedY + 0.6, placedZ), 0x4ade80, 9);
    return { ok: true, bp, x: placedX, z: placedZ, relocated: wasPlaced };
  }

  // ---------------------------------------------------------------------------
  // Site Creation & Activation
  // ---------------------------------------------------------------------------
  initAllSites() {
    for (const bp of CAMP_BLUEPRINTS) {
      const site = this.createSiteObject(bp);
      this.sites.set(bp.id, site);
      if (this.isBuilt(bp.id)) {
        this.activateBuiltStructure(bp, site, true);
      }
    }
    this.syncTrackedRings();
  }

  applySiteTransformToMesh(site) {
    const tf = this.getSiteTransform(site.bp.id);
    if (!tf) return;
    const y = site.bp.id === 'log_bridge' ? BRIDGE_DECK_Y - 0.15 : groundHeightAt(tf.x, tf.z);
    site.x = tf.x;
    site.z = tf.z;
    site.yaw = tf.yaw;
    site.y = y;
    site.group.position.set(tf.x, y, tf.z);
    site.group.rotation.y = tf.yaw;
    site.group.visible = Boolean(tf.placed || tf.built);
  }

  createSiteObject(bp) {
    const assets = getSharedCampAssets();
    const tf = this.getSiteTransform(bp.id);
    const y = bp.id === 'log_bridge' ? BRIDGE_DECK_Y - 0.15 : groundHeightAt(tf.x, tf.z);

    const group = new THREE.Group();
    group.position.set(tf.x, y, tf.z);
    group.rotation.y = tf.yaw;
    group.visible = Boolean(tf.placed || tf.built);
    this.root.add(group);

    // Diegetic stake ring (visible only while placed & unbuilt)
    const stakeGroup = new THREE.Group();
    const ringR = Math.min(3.4, bp.radius * 0.72);
    const ring = new THREE.Mesh(assets.ringGeo, assets.ringIdleMat);
    ring.scale.setScalar(ringR);
    ring.position.y = 0.08;
    stakeGroup.add(ring);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const stake = new THREE.Mesh(assets.stakeGeo, assets.stakeMat);
      stake.position.set(Math.cos(a) * ringR, 0.42, Math.sin(a) * ringR);
      stakeGroup.add(stake);
    }

    const badge = makeWorldBadgeSprite(bp.shortName, `0/${bp.costLogs} gỗ`, '#f59e0b');
    badge.position.set(0, 2.35, 0);
    badge.scale.set(3.4, 1.05, 1);
    stakeGroup.add(badge);
    group.add(stakeGroup);

    const builtGroup = new THREE.Group();
    builtGroup.visible = false;
    group.add(builtGroup);

    const site = {
      bp,
      group,
      stakeGroup,
      ring,
      badge,
      builtGroup,
      x: tf.x,
      z: tf.z,
      yaw: tf.yaw,
      y
    };
    this.refreshSiteBadge(site);
    return site;
  }

  refreshSiteBadge(site) {
    const st = this.state.structures[site.bp.id];
    if (!st || st.built || !site.badge?.userData?._canvasCtx) return;
    const isTracked = this.state.trackedSiteId === site.bp.id;
    drawWorldBadgeToCanvas(
      site.badge.userData._canvasCtx,
      site.bp.shortName,
      `${st.deliveredLogs}/${site.bp.costLogs} gỗ`,
      isTracked ? '#fbbf24' : '#d98a2b'
    );
    if (site.badge.userData._canvasTex) site.badge.userData._canvasTex.needsUpdate = true;
  }

  syncTrackedRings() {
    const assets = getSharedCampAssets();
    for (const [id, site] of this.sites.entries()) {
      const isTracked = this.state.trackedSiteId === id && this.isPlaced(id) && !this.isBuilt(id);
      if (site.ring) {
        site.ring.material = isTracked ? assets.ringTrackedMat : assets.ringIdleMat;
      }
      this.refreshSiteBadge(site);
    }
  }

  activateBuiltStructure(bp, site, silent = false) {
    const assets = getSharedCampAssets();
    this.applySiteTransformToMesh(site);
    site.group.visible = true;
    site.stakeGroup.visible = false;
    site.builtGroup.visible = true;

    const sx = site.x;
    const sz = site.z;
    const syaw = site.yaw;
    const cosY = Math.cos(syaw);
    const sinY = Math.sin(syaw);
    const localToWorld = (lx, lz) => ({
      wx: sx + lx * cosY + lz * sinY,
      wz: sz - lx * sinY + lz * cosY
    });

    // Clear previous built children if rebuilding
    while (site.builtGroup.children.length > 0) {
      const c = site.builtGroup.children[0];
      site.builtGroup.remove(c);
      disposeObject3D(c);
    }

    if (bp.id === 'campfire') {
      const holder = new THREE.Group();
      site.builtGroup.add(holder);
      mountNormalizedGlb(holder, FOREST_ASSETS.campfireGithub, {
        targetFootprint: 2.85,
        yaw: 0
      });

      // Subtle animated inner ember pulse layered cleanly inside the GLB campfire flames
      const flameOuter = new THREE.Mesh(assets.flameGeo, assets.flameMat);
      flameOuter.scale.set(0.62, 0.58, 0.62);
      flameOuter.position.set(0, 0.55, 0);
      const flameInner = new THREE.Mesh(assets.flameGeo, assets.flameInnerMat);
      flameInner.scale.set(0.38, 0.45, 0.38);
      flameInner.position.set(0, 0.48, 0);
      site.builtGroup.add(flameOuter, flameInner);
      this.campfireFlames = [flameOuter, flameInner];

      if (this.campfireLight?.parent) this.campfireLight.parent.remove(this.campfireLight);
      this.campfireLight = new THREE.PointLight(0xff9c3b, 1.8, 18, 1.6);
      this.campfireLight.position.set(0, 1.15, 0);
      site.builtGroup.add(this.campfireLight);

      this.campfireSmokes = [];
      for (let i = 0; i < 6; i++) {
        const puff = new THREE.Mesh(assets.smokeGeo, assets.smokeMat);
        puff.position.set(0, 1.0 + i * 0.65, 0);
        site.builtGroup.add(puff);
        this.campfireSmokes.push({
          mesh: puff,
          phase: i / 6,
          driftX: (Math.random() - 0.5) * 0.45,
          driftZ: (Math.random() - 0.5) * 0.45
        });
      }
    } else if (bp.id === 'log_yard') {
      const shedHolder = new THREE.Group();
      site.builtGroup.add(shedHolder);
      mountNormalizedGlb(shedHolder, FOREST_ASSETS.lumberShedStack, {
        targetFootprint: 5.4,
        yaw: 0
      });

      this.logYardVisuals = [];
      const pileOffsets = [
        { x: 2.8, z: 0.6, yaw: 0.4 },
        { x: 2.5, z: -1.4, yaw: 0.7 },
        { x: -2.8, z: 1.2, yaw: -0.3 }
      ];
      for (const off of pileOffsets) {
        const pWrap = new THREE.Group();
        const { wx, wz } = localToWorld(off.x, off.z);
        pWrap.position.set(off.x, groundHeightAt(wx, wz) - site.y, off.z);
        pWrap.visible = false;
        mountNormalizedGlb(pWrap, FOREST_ASSETS.logPile, {
          targetFootprint: 2.2,
          yaw: off.yaw
        });
        site.builtGroup.add(pWrap);
        this.logYardVisuals.push(pWrap);
      }

      this.logYardBadge = makeWorldBadgeSprite('Bãi Gỗ', `${this.state.campLogStock} khúc`, '#4f8f5b');
      this.logYardBadge.position.set(0, 3.35, 0);
      this.logYardBadge.scale.set(3.2, 1.0, 1);
      site.builtGroup.add(this.logYardBadge);
      this.syncLogYardVisuals();
    } else if (bp.id === 'lanterns') {
      this.lanternBulbs = [];
      for (const off of LANTERN_LOCAL_OFFSETS) {
        const { wx, wz } = localToWorld(off.x, off.z);
        // Keep lantern posts out of river center
        const sInfo = getStreamInfo(wx, wz);
        let lx = off.x;
        let lz = off.z;
        let finalWx = wx;
        let finalWz = wz;
        if (sInfo.inStream) {
          lx *= 0.45;
          lz *= 0.45;
          const adj = localToWorld(lx, lz);
          finalWx = adj.wx;
          finalWz = adj.wz;
        }
        const postGroup = new THREE.Group();
        const ly = groundHeightAt(finalWx, finalWz);
        postGroup.position.set(lx, ly - site.y, lz);
        mountNormalizedGlb(postGroup, FOREST_ASSETS.lanternGithub, {
          targetHeight: 2.85,
          yaw: off.yaw
        });
        // Subtle warm glow nestled inside the hanging lantern glass (no floating white sphere!)
        const bulb = new THREE.Mesh(assets.lanternBulbGeo, assets.lanternBulbMat);
        bulb.scale.setScalar(0.45);
        bulb.position.set(0, 1.98, 0.36);
        bulb.visible = false;
        postGroup.add(bulb);
        this.lanternBulbs.push(bulb);
        site.builtGroup.add(postGroup);
      }
      if (this.lanternGlowLight?.parent) this.lanternGlowLight.parent.remove(this.lanternGlowLight);
      this.lanternGlowLight = new THREE.PointLight(0xffb84d, 0.8, 22, 1.5);
      this.lanternGlowLight.position.set(0, 2.8, 0);
      site.builtGroup.add(this.lanternGlowLight);
    } else if (bp.id === 'handcart') {
      const marker = makeWorldBadgeSprite('Xưởng Xe Kéo', 'Đã hoàn thành', '#4f8f5b');
      marker.position.set(0, 2.0, 0);
      marker.scale.set(2.8, 0.88, 1);
      marker.visible = false;
      site.builtGroup.add(marker);
      if (!this.handcart) {
        this.state.handcart.x = sx;
        this.state.handcart.z = sz;
        this.state.handcart.yaw = syaw;
      }
      this.spawnHandcartEntity();
    } else if (bp.id === 'log_bridge') {
      const b = this.getBridgeMetrics();
      const totalSpan = b.halfLen * 2.16;
      const bays = 3;
      const bayLen = totalSpan / bays;
      // Assemble 3 clean modular bays of log_bridge_github.glb end-to-end along local Z so railings stay waist-high
      for (let i = 0; i < bays; i++) {
        const bayWrap = new THREE.Group();
        bayWrap.position.set(0, -0.32, (i - (bays - 1) * 0.5) * (bayLen * 0.94));
        bayWrap.scale.set(0.78, 0.52, 1.06);
        site.builtGroup.add(bayWrap);
        mountNormalizedGlb(bayWrap, FOREST_ASSETS.logBridgeGithub, {
          targetFootprint: bayLen,
          yaw: 0
        });
      }
    } else if (bp.id === 'waterwheel_sawmill') {
      const millHolder = new THREE.Group();
      site.builtGroup.add(millHolder);
      // sawmill_github.glb has its waterwheel on local -X; yaw = Math.PI aims its waterwheel straight onto +X toward the flowing river!
      mountNormalizedGlb(millHolder, FOREST_ASSETS.sawmillGithub, {
        targetFootprint: 8.6,
        yaw: Math.PI
      });

      // Gently spinning wooden waterwheel paddles synced with the river current on +X
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(3.15, 0.95, 0.05);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 8), assets.stakeMat);
      hub.rotation.z = Math.PI / 2;
      wheelPivot.add(hub);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.075, 6, 14), assets.stakeMat);
      rim.rotation.y = Math.PI / 2;
      wheelPivot.add(rim);
      const paddleGeo = new THREE.BoxGeometry(0.36, 0.07, 0.38);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const pad = new THREE.Mesh(paddleGeo, assets.barkMatPine);
        pad.position.set(0, Math.sin(a) * 1.12, Math.cos(a) * 1.12);
        pad.rotation.x = -a;
        wheelPivot.add(pad);
      }
      site.builtGroup.add(wheelPivot);
      this.sawmillWheel = wheelPivot;

      this.sawmillPlankVisuals = [];
      for (let i = 0; i < 4; i++) {
        const bWrap = new THREE.Group();
        const ox = -3.4 - (i % 2) * 1.45;
        const oz = -0.8 + Math.floor(i / 2) * 1.55;
        const { wx, wz } = localToWorld(ox, oz);
        bWrap.position.set(ox, groundHeightAt(wx, wz) - site.y, oz);
        bWrap.visible = false;
        mountNormalizedGlb(bWrap, FOREST_ASSETS.plankBundle, {
          targetFootprint: 1.55,
          yaw: 0.25 + i * 0.2
        });
        site.builtGroup.add(bWrap);
        this.sawmillPlankVisuals.push(bWrap);
      }

      this.sawmillBadge = makeWorldBadgeSprite('Xưởng Cưa', `Ván: ${this.state.campPlankStock}`, '#4f8f5b');
      this.sawmillBadge.position.set(0, 4.35, 0);
      this.sawmillBadge.scale.set(3.5, 1.05, 1);
      site.builtGroup.add(this.sawmillBadge);
      this.syncSawmillVisuals();
    } else if (bp.id === 'river_dock') {
      const dockModel = buildRiverDockModel(this.lowSpec);
      site.builtGroup.add(dockModel);
      this.dockBadge = makeWorldBadgeSprite('Bến Thả Bè', 'Thả bè & Đón thương lái', '#38bdf8');
      this.dockBadge.position.set(0.8, 3.65, 0);
      this.dockBadge.scale.set(3.6, 1.05, 1);
      site.builtGroup.add(this.dockBadge);
    } else if (bp.id === 'craft_cabin') {
      const cabinModel = buildCraftCabinModel(this.lowSpec);
      site.builtGroup.add(cabinModel);
      this.cabinBadge = makeWorldBadgeSprite('Nhà Gỗ & Xưởng Mộc', `Đồ gỗ: ${this.state.campCraftStock}`, '#f59e0b');
      this.cabinBadge.position.set(0, 5.1, 0);
      this.cabinBadge.scale.set(3.6, 1.05, 1);
      site.builtGroup.add(this.cabinBadge);
      this.syncCabinVisuals();
    }

    if (!silent) {
      this.world.spawnParticles(new THREE.Vector3(sx, site.y + 1.0, sz), 0xfbbf24, 12);
      this.world.spawnParticles(new THREE.Vector3(sx, site.y + 0.6, sz), 0x8b5a2b, 8);
    }
  }

  syncCabinVisuals() {
    if (!this.cabinBadge?.userData?._canvasCtx) return;
    const stock = this.state.campCraftStock || 0;
    const queue = this.state.craftQueue || 0;
    const sub = queue > 0 ? `Đang đóng ${queue} · Kho: ${stock}` : `Đồ gỗ thủ công: ${stock}`;
    drawWorldBadgeToCanvas(
      this.cabinBadge.userData._canvasCtx,
      'Nhà Gỗ & Xưởng Mộc',
      sub,
      queue > 0 ? '#fbbf24' : '#4f8f5b'
    );
    if (this.cabinBadge.userData._canvasTex) this.cabinBadge.userData._canvasTex.needsUpdate = true;
  }

  syncLogYardVisuals() {
    const stock = this.state.campLogStock || 0;
    for (let i = 0; i < this.logYardVisuals.length; i++) {
      this.logYardVisuals[i].visible = stock >= (i + 1) * 3;
    }
    if (this.logYardBadge?.userData?._canvasCtx) {
      drawWorldBadgeToCanvas(
        this.logYardBadge.userData._canvasCtx,
        'Bãi Gỗ Trại',
        `${stock} khúc trữ sẵn`,
        '#4f8f5b'
      );
      if (this.logYardBadge.userData._canvasTex) this.logYardBadge.userData._canvasTex.needsUpdate = true;
    }
  }

  syncSawmillVisuals() {
    const planks = this.state.campPlankStock || 0;
    const queue = this.state.sawmillQueue || 0;
    for (let i = 0; i < this.sawmillPlankVisuals.length; i++) {
      this.sawmillPlankVisuals[i].visible = planks >= (i + 1) * 2;
    }
    if (this.sawmillBadge?.userData?._canvasCtx) {
      const sub = queue > 0 ? `Đang cưa ${queue} gỗ · ${planks} ván` : `Ván xẻ: ${planks}`;
      drawWorldBadgeToCanvas(
        this.sawmillBadge.userData._canvasCtx,
        'Xưởng Cưa Guồng Nước',
        sub,
        queue > 0 ? '#fbbf24' : '#4f8f5b'
      );
      if (this.sawmillBadge.userData._canvasTex) this.sawmillBadge.userData._canvasTex.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Pullable Forest Handcart (log_handcart.glb + 10 visible stacked timber slots)
  // ---------------------------------------------------------------------------
  spawnHandcartEntity() {
    if (this.handcart) return this.handcart;
    const hc = this.state.handcart;
    const assets = getSharedCampAssets();
    const group = new THREE.Group();
    group.name = 'WildernessLogHandcart';
    const y = this.getWalkableHeightAt(hc.x, hc.z);
    group.position.set(hc.x, y, hc.z);
    group.rotation.y = hc.yaw || 0;
    this.root.add(group);

    // Mount clean two-wheel GitHub logging handcart (log_handcart_github.glb)
    // Native orientation already has wheels grounded at y=0 and pull drawbar extending straight along +Z!
    const modelWrap = new THREE.Group();
    modelWrap.position.set(0, 0, 0.16);
    group.add(modelWrap);
    mountNormalizedGlb(modelWrap, FOREST_ASSETS.logHandcartGithub, {
      targetHeight: 1.02,
      yaw: 0
    });

    // Horizontal T-bar wooden grip mounted cleanly onto the tip of the GLB drawbar (z=+1.64, y=0.40 -> lifts to y=0.80 when pulled!)
    const shaftGroup = new THREE.Group();
    shaftGroup.name = 'HandcartPullHandle';
    const tBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.68, 10), assets.woodMat);
    tBar.rotation.z = Math.PI / 2;
    tBar.position.set(0, 0.40, 1.66);
    tBar.castShadow = !this.lowSpec;
    shaftGroup.add(tBar);

    const gripGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.18, 8);
    for (const side of [-1, 1]) {
      const wrap = new THREE.Mesh(gripGeo, assets.ropeMat);
      wrap.rotation.z = Math.PI / 2;
      wrap.position.set(side * 0.24, 0.40, 1.66);
      shaftGroup.add(wrap);
    }
    group.add(shaftGroup);

    const cargoSlots = [];
    const slotCoords = [
      [-0.22, 0.68, -0.58], [0.0, 0.68, -0.58], [0.22, 0.68, -0.58],
      [-0.22, 0.86, -0.58], [0.0, 0.86, -0.58], [0.22, 0.86, -0.58],
      [-0.14, 1.04, -0.58], [0.14, 1.04, -0.58],
      [-0.08, 1.20, -0.58], [0.10, 1.20, -0.58]
    ];
    for (let i = 0; i < slotCoords.length; i++) {
      const [sx, sy, sz] = slotCoords[i];
      const logMesh = createLogMesh(false);
      logMesh.rotation.x = Math.PI / 2;
      logMesh.scale.set(0.58, 1.18, 0.58);
      logMesh.position.set(sx, sy, sz);
      logMesh.visible = false;
      group.add(logMesh);
      cargoSlots.push(logMesh);
    }

    const cap = this.getHandcartCapacity();
    const badge = makeWorldBadgeSprite('Xe Kéo Gỗ', `${hc.logs}/${cap} khúc`, '#d98a2b');
    badge.position.set(0, 2.05, -0.15);
    badge.scale.set(2.5, 0.78, 1);
    group.add(badge);

    this.handcart = {
      group,
      shaftGroup,
      cargoSlots,
      badge,
      pos: new THREE.Vector3(hc.x, y, hc.z),
      yaw: hc.yaw || 0,
      logs: hc.logs || 0,
      capacity: cap
    };
    this.syncHandcartVisuals();
    return this.handcart;
  }

  syncHandcartVisuals() {
    if (!this.handcart) return;
    const cap = this.getHandcartCapacity();
    this.handcart.capacity = cap;
    const count = Math.max(0, Math.min(cap, this.handcart.logs));
    this.handcart.logs = count;
    this.state.handcart.logs = count;
    const slotsTotal = this.handcart.cargoSlots.length;
    const visibleSlots = count === 0 ? 0 : Math.min(slotsTotal, Math.ceil((count / cap) * slotsTotal));
    for (let i = 0; i < slotsTotal; i++) {
      this.handcart.cargoSlots[i].visible = i < visibleSlots;
    }
    if (this.handcart.badge?.userData?._canvasCtx) {
      this.handcart.badge.visible = !this.cartAttached;
      drawWorldBadgeToCanvas(
        this.handcart.badge.userData._canvasCtx,
        'Xe Kéo Gỗ',
        `${count}/${cap} khúc`,
        count >= cap ? '#4f8f5b' : '#d98a2b'
      );
      if (this.handcart.badge.userData._canvasTex) this.handcart.badge.userData._canvasTex.needsUpdate = true;
    }
  }

  toggleHandcartAttach(playerPos, playerYaw, allowSummon = false) {
    if (!this.isBuilt('handcart') || !this.handcart) {
      return { ok: false, reason: 'Chưa đóng Xe Kéo Gỗ Tay! Mở Xây trại (B) chọn vị trí đặt rồi nạp 8 khúc gỗ.' };
    }
    if (this.cartAttached) {
      this.cartAttached = false;
      this.syncHandcartVisuals();
      return { ok: true, attached: false, message: 'Đã dừng và dựng chân chống Xe Kéo Gỗ.' };
    }
    const dist = Math.hypot(playerPos.x - this.handcart.pos.x, playerPos.z - this.handcart.pos.z);
    if (dist > 5.0) {
      if (!allowSummon) {
        return { ok: false, reason: 'Hãy lại gần Xe Kéo Gỗ (hoặc bấm nút Xe kéo trên thanh điều khiển).' };
      }
      const tx = playerPos.x - Math.sin(playerYaw) * 1.9;
      const tz = playerPos.z - Math.cos(playerYaw) * 1.9;
      const ty = this.getWalkableHeightAt(tx, tz);
      this.handcart.pos.set(tx, ty, tz);
      this.handcart.yaw = playerYaw;
      this.handcart.group.position.copy(this.handcart.pos);
      this.handcart.group.rotation.y = playerYaw;
      this.state.handcart.x = tx;
      this.state.handcart.z = tz;
      this.state.handcart.yaw = playerYaw;
    }
    this.cartAttached = true;
    this.syncHandcartVisuals();
    return { ok: true, attached: true, message: 'Đã nắm càng Xe Kéo Gỗ! Đi gần khúc gỗ rời để xếp lên xe.' };
  }

  // ---------------------------------------------------------------------------
  // Realistic Felled Trunks (Lying on terrain -> Buck into loose GroundLogs!)
  // ---------------------------------------------------------------------------
  spawnFelledTrunk(tree) {
    const assets = getSharedCampAssets();
    const fallYaw = tree.fallYaw || 0;
    const dirX = Math.sin(fallYaw);
    const dirZ = Math.cos(fallYaw);
    const segCount = tree.kind === 'redwood' ? 5 : tree.kind === 'oak' ? 4 : 3;
    const segLen = 1.18;

    const startX = tree.pos.x + dirX * 1.25;
    const startZ = tree.pos.z + dirZ * 1.25;
    const endX = startX + dirX * (segCount * segLen);
    const endZ = startZ + dirZ * (segCount * segLen);
    const startY = groundHeightAt(startX, startZ);
    const endY = groundHeightAt(endX, endZ);

    const group = new THREE.Group();
    group.position.set(startX, startY + 0.25, startZ);
    const slopeAngle = Math.atan2(endY - startY, segCount * segLen);
    group.rotation.order = 'YXZ';
    group.rotation.set(-slopeAngle, fallYaw, 0);

    const barkMat = tree.kind === 'redwood'
      ? assets.barkMatRedwood
      : tree.kind === 'oak'
        ? assets.barkMatOak
        : assets.barkMatPine;

    const segMeshes = [];
    for (let i = 0; i < segCount; i++) {
      const segWrap = new THREE.Group();
      const taper = 1 - i * 0.085;
      const body = new THREE.Mesh(assets.trunkSegGeo, [barkMat, assets.cutEndMat, assets.cutEndMat]);
      body.scale.set(taper, taper, 1.06);
      segWrap.add(body);

      if (i > 0) {
        const notch = new THREE.Mesh(assets.notchRingGeo, assets.notchMat);
        notch.position.z = -segLen * 0.48;
        notch.scale.set(taper * 0.96, taper * 0.96, 1);
        segWrap.add(notch);
      }

      segWrap.position.z = i * segLen + segLen * 0.5;
      group.add(segWrap);
      segMeshes.push(segWrap);
    }

    this.root.add(group);

    while (this.felledTrunks.length >= 16) {
      const oldest = this.felledTrunks.shift();
      this.root.remove(oldest.group);
      disposeObject3D(oldest.group);
    }

    const trunk = {
      id: this._idSeq++,
      kind: tree.kind || 'pine',
      group,
      segMeshes,
      startX,
      startZ,
      dirX,
      dirZ,
      fallYaw,
      segLen,
      totalSegments: segCount,
      segmentsRemaining: segCount,
      segHp: 2,
      wobble: 0
    };
    this.felledTrunks.push(trunk);
    return trunk;
  }

  getTrunkActiveCutPos(trunk, outVec = _tmpVecA) {
    const idx = Math.max(0, trunk.segmentsRemaining - 1);
    const dist = (idx + 0.5) * trunk.segLen;
    const wx = trunk.startX + trunk.dirX * dist;
    const wz = trunk.startZ + trunk.dirZ * dist;
    outVec.set(wx, groundHeightAt(wx, wz) + 0.25, wz);
    return outVec;
  }

  findNearestFelledTrunk(playerPos, maxDist = 3.2) {
    let best = null;
    let bestDist = maxDist;
    for (const trunk of this.felledTrunks) {
      if (trunk.segmentsRemaining <= 0) continue;
      for (let i = 0; i < trunk.segmentsRemaining; i++) {
        const distAlong = (i + 0.5) * trunk.segLen;
        const sx = trunk.startX + trunk.dirX * distAlong;
        const sz = trunk.startZ + trunk.dirZ * distAlong;
        const d = Math.hypot(playerPos.x - sx, playerPos.z - sz);
        if (d < bestDist) {
          bestDist = d;
          best = trunk;
        }
      }
    }
    return best;
  }

  buckTrunkHit(trunk, dmg = 1) {
    if (!trunk || trunk.segmentsRemaining <= 0) return null;
    trunk.segHp -= dmg;
    trunk.wobble = 1.0;
    const cutPos = this.getTrunkActiveCutPos(trunk, _tmpVecA).clone();
    this.world.spawnParticles(cutPos, 0xd97706, 6);

    if (trunk.segHp <= 0) {
      const segIdx = trunk.segmentsRemaining - 1;
      if (trunk.segMeshes[segIdx]) {
        trunk.segMeshes[segIdx].visible = false;
      }
      trunk.segmentsRemaining -= 1;
      trunk.segHp = 2;

      const sideSign = segIdx % 2 === 0 ? 1 : -1;
      const sideX = -trunk.dirZ * sideSign * 0.65;
      const sideZ = trunk.dirX * sideSign * 0.65;
      const logObj = this.spawnGroundLog(
        cutPos.x + sideX,
        cutPos.z + sideZ,
        trunk.fallYaw + (Math.random() - 0.5) * 0.35,
        trunk.kind
      );

      if (trunk.segmentsRemaining <= 0) {
        const idx = this.felledTrunks.indexOf(trunk);
        if (idx >= 0) this.felledTrunks.splice(idx, 1);
        this.root.remove(trunk.group);
        disposeObject3D(trunk.group);
      }

      return { cutCompleted: true, cutPos, logObj, remaining: trunk.segmentsRemaining };
    }
    return { cutCompleted: false, cutPos, remaining: trunk.segmentsRemaining };
  }

  // ---------------------------------------------------------------------------
  // Physical Loose Ground Logs (Pick up onto shoulder OR load onto Handcart)
  // ---------------------------------------------------------------------------
  spawnGroundLog(x, z, yaw = 0, kind = 'pine') {
    while (this.groundLogs.length >= MAX_GROUND_LOGS) {
      const oldest = this.groundLogs.shift();
      this.root.remove(oldest.mesh);
      disposeObject3D(oldest.mesh);
    }

    const holder = new THREE.Group();
    const y = this.getWalkableHeightAt(x, z);
    holder.position.set(x, y + 0.14, z);
    holder.rotation.y = yaw;

    const fallback = createLogMesh(kind === 'redwood');
    fallback.rotation.x = Math.PI / 2;
    fallback.scale.set(0.85, 1.45, 0.85);
    holder.add(fallback);

    const glbWrap = new THREE.Group();
    glbWrap.position.y = -0.12;
    holder.add(glbWrap);
    mountNormalizedGlb(glbWrap, FOREST_ASSETS.timberLogSingle, {
      targetFootprint: 1.52,
      yaw: 0,
      placeholder: fallback
    });

    this.root.add(holder);
    const entry = {
      id: this._idSeq++,
      mesh: holder,
      pos: new THREE.Vector3(x, y, z),
      yaw,
      kind,
      popTime: 0.28
    };
    this.groundLogs.push(entry);
    return entry;
  }

  findNearestGroundLog(pos, maxDist = 3.2) {
    let best = null;
    let bestDist = maxDist;
    for (const log of this.groundLogs) {
      const d = Math.hypot(pos.x - log.pos.x, pos.z - log.pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = log;
      }
    }
    return best;
  }

  removeGroundLog(logEntry) {
    const idx = this.groundLogs.indexOf(logEntry);
    if (idx < 0) return false;
    this.groundLogs.splice(idx, 1);
    this.root.remove(logEntry.mesh);
    disposeObject3D(logEntry.mesh);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Site Proximity & Direct Diegetic Material Delivery (Using Custom Coordinates)
  // ---------------------------------------------------------------------------
  findNearestBuildSite(playerPos) {
    let best = null;
    let bestDist = Infinity;
    for (const bp of CAMP_BLUEPRINTS) {
      if (!this.isPlaced(bp.id) || this.isBuilt(bp.id)) continue;
      const tf = this.getSiteTransform(bp.id);
      if (!tf) continue;
      const d = Math.hypot(playerPos.x - tf.x, playerPos.z - tf.z);
      if (d <= bp.radius + 1.25 && d < bestDist) {
        bestDist = d;
        best = bp;
      }
    }
    return best;
  }

  isNearBuiltSite(playerPos, id, extraRadius = 1.1) {
    if (!this.isBuilt(id)) return false;
    const tf = this.getSiteTransform(id);
    if (!tf) return false;
    return Math.hypot(playerPos.x - tf.x, playerPos.z - tf.z) <= tf.bp.radius + extraRadius;
  }

  deliverLogsToSite(siteId, availableLogs) {
    const bp = CAMP_BLUEPRINTS.find((b) => b.id === siteId);
    const st = this.state.structures[siteId];
    if (!bp || !st || !st.placed || st.built || availableLogs <= 0) {
      return { delivered: 0, completed: false, bp };
    }
    const needed = bp.costLogs - st.deliveredLogs;
    const used = Math.min(needed, availableLogs);
    st.deliveredLogs += used;
    let completed = false;
    if (st.deliveredLogs >= bp.costLogs) {
      st.deliveredLogs = bp.costLogs;
      st.built = true;
      completed = true;
      const site = this.sites.get(bp.id);
      if (site) this.activateBuiltStructure(bp, site, false);
      const nextPlacedUnbuilt = CAMP_BLUEPRINTS.find((b) => this.isPlaced(b.id) && !this.isBuilt(b.id));
      this.state.trackedSiteId = nextPlacedUnbuilt ? nextPlacedUnbuilt.id : null;
    }
    this.syncTrackedRings();
    return { delivered: used, completed, bp, deliveredLogs: st.deliveredLogs, costLogs: bp.costLogs };
  }

  quickFeedFromLogYard(siteId) {
    if (!this.isBuilt('log_yard')) {
      return { ok: false, reason: 'Hãy xây Bãi Tập Kết Gỗ trước để trữ gỗ!' };
    }
    if (!this.isPlaced(siteId)) {
      return { ok: false, reason: 'Hãy chọn vị trí đặt công trình này trên bản đồ trước!' };
    }
    if ((this.state.campLogStock || 0) <= 0) {
      return { ok: false, reason: 'Bãi Tập Kết hiện chưa có gỗ trữ sẵn.' };
    }
    const res = this.deliverLogsToSite(siteId, this.state.campLogStock);
    if (res.delivered <= 0) {
      return { ok: false, reason: 'Công trình này đã hoàn thành.' };
    }
    this.state.campLogStock -= res.delivered;
    this.syncLogYardVisuals();
    return { ok: true, ...res };
  }

  depositToLogYard(amount) {
    if (!this.isBuilt('log_yard') || amount <= 0) return 0;
    this.state.campLogStock += amount;
    this.syncLogYardVisuals();
    return amount;
  }

  depositToSawmill(amount) {
    if (!this.isBuilt('waterwheel_sawmill') || amount <= 0) return 0;
    this.state.sawmillQueue += amount;
    this.syncSawmillVisuals();
    return amount;
  }

  depositPlanksToCabin(maxCrafts = 4) {
    if (!this.isBuilt('craft_cabin')) {
      return { ok: false, reason: 'Hãy xây Nhà Gỗ Tiều Phu & Xưởng Mộc trước.' };
    }
    const availPlanks = this.state.campPlankStock || 0;
    const craftsPossible = Math.min(maxCrafts, Math.floor(availPlanks / 2));
    if (craftsPossible <= 0) {
      return { ok: false, reason: 'Cần ít nhất 2 Ván xẻ để đóng 1 Đồ Gỗ Thủ Công.' };
    }
    const usedPlanks = craftsPossible * 2;
    this.state.campPlankStock -= usedPlanks;
    this.state.craftQueue = (this.state.craftQueue || 0) + craftsPossible;
    this.syncSawmillVisuals();
    this.syncCabinVisuals();
    return { ok: true, usedPlanks, queued: craftsPossible };
  }

  buyUpgrade(kind) {
    const list = WILDERNESS_UPGRADES[kind];
    if (!list) return { ok: false, reason: 'Hạng mục không hợp lệ.' };
    const curLv = this.state.upgrades[kind] || 1;
    if (curLv >= list.length) {
      return { ok: false, reason: 'Đã đạt cấp tối đa!' };
    }
    const next = list[curLv];
    if ((gameState.cash || 0) < next.cost) {
      return { ok: false, reason: `Cần $${next.cost.toLocaleString()} (hiện có $${Math.floor(gameState.cash || 0).toLocaleString()}).` };
    }
    gameState.cash = Math.max(0, (gameState.cash || 0) - next.cost);
    this.state.upgrades[kind] = next.level;
    if (kind === 'cart') {
      this.syncHandcartVisuals();
    } else if (kind === 'forge' || kind === 'quarters') {
      this.syncCampUpgradeVisuals();
    }
    return { ok: true, kind, tier: next };
  }

  hireWorker(role) {
    const def = WILDERNESS_WORKER_DEFS[role];
    if (!def) return { ok: false, reason: 'Nhân công không hợp lệ.' };
    const key = role === 'porter' ? 'porters' : 'choppers';
    const cur = this.state.workers[key] || 0;
    const maxCap = this.getMaxWorkersForRole(role);
    if (cur >= maxCap) {
      const hint = maxCap < def.costs.length ? ' (Xây thêm nhà ở mục Hạ tầng để mở rộng giới hạn!)' : '';
      return { ok: false, reason: `Đã thuê tối đa ${maxCap} ${def.name}.${hint}` };
    }
    const cost = def.costs[cur] || 250;
    if ((gameState.cash || 0) < cost) {
      return { ok: false, reason: `Cần $${cost.toLocaleString()} để thuê ${def.name}.` };
    }
    gameState.cash = Math.max(0, (gameState.cash || 0) - cost);
    this.state.workers[key] = cur + 1;
    this.workerSystem?.syncWithState();
    return { ok: true, role, count: cur + 1, name: def.name, cost };
  }

  getAvailableResourceCount(resource) {
    if (resource === 'log') {
      const shoulder = Math.max(0, Math.floor(gameState.logs || 0));
      const cart = this.handcart ? this.handcart.logs : 0;
      return (this.state.campLogStock || 0) + shoulder + cart;
    }
    if (resource === 'plank') return this.state.campPlankStock || 0;
    if (resource === 'craft') return this.state.campCraftStock || 0;
    return 0;
  }

  consumeCampResource(resource, qty) {
    let rem = Math.max(0, Math.floor(qty || 0));
    if (resource === 'plank') {
      const take = Math.min(this.state.campPlankStock || 0, rem);
      this.state.campPlankStock -= take;
      this.syncSawmillVisuals();
      return take;
    }
    if (resource === 'craft') {
      const take = Math.min(this.state.campCraftStock || 0, rem);
      this.state.campCraftStock -= take;
      this.syncCabinVisuals();
      return take;
    }
    if (resource === 'log') {
      let taken = 0;
      const fromYard = Math.min(this.state.campLogStock || 0, rem);
      this.state.campLogStock -= fromYard;
      rem -= fromYard;
      taken += fromYard;
      if (rem > 0 && this.handcart && this.handcart.logs > 0) {
        const fromCart = Math.min(this.handcart.logs, rem);
        this.handcart.logs -= fromCart;
        this.syncHandcartVisuals();
        rem -= fromCart;
        taken += fromCart;
      }
      if (rem > 0 && (gameState.logs || 0) > 0) {
        const fromShoulder = Math.min(Math.floor(gameState.logs || 0), rem);
        gameState.logs -= fromShoulder;
        rem -= fromShoulder;
        taken += fromShoulder;
      }
      this.syncLogYardVisuals();
      return taken;
    }
    return 0;
  }

  launchQuickRaft(resource = 'log') {
    if (!this.isBuilt('river_dock')) {
      return { ok: false, reason: 'Hãy xây Bến Thả Bè & Cầu Tàu Thương Lái ven sông trước.' };
    }
    const avail = this.getAvailableResourceCount(resource);
    if (avail <= 0) {
      const labels = { log: 'khúc gỗ tròn', plank: 'ván xẻ', craft: 'đồ gỗ thủ công' };
      return { ok: false, reason: `Không có ${labels[resource] || 'hàng'} để thả bè.` };
    }
    const batch = Math.min(avail, resource === 'craft' ? 4 : 8);
    const shipped = this.consumeCampResource(resource, batch);
    const tradeMult = this.getSkillBonuses().tradePriceMult || 1.0;
    const earned = Math.round(shipped * (RAFT_UNIT_PRICES[resource] || 12) * tradeMult);
    gameState.cash = (gameState.cash || 0) + earned;
    const dockTf = this.getSiteTransform('river_dock');
    const startZ = dockTf ? dockTf.z : DEFAULT_DOCK_Z;
    this.riverTraffic?.spawnFloatingRaft(startZ, resource, shipped);
    return { ok: true, resource, shipped, earned, dockPos: dockTf };
  }

  deliverMerchantOrder(orderId) {
    if (!this.isBuilt('river_dock')) {
      return { ok: false, reason: 'Hãy xây Bến Thả Bè & Cầu Tàu Thương Lái trước.' };
    }
    const m = this.state.merchant;
    if (m.status !== 'docked') {
      return { ok: false, reason: 'Thuyền Thương Lái chưa cập bến — hãy chờ thuyền tới.' };
    }
    const ord = (m.orders || []).find((o) => o.id === orderId);
    if (!ord || ord.completed) {
      return { ok: false, reason: 'Đơn hàng đã hoàn thành hoặc không tồn tại.' };
    }
    const avail = this.getAvailableResourceCount(ord.resource);
    if (avail < ord.qty) {
      return { ok: false, reason: `Cần ${ord.qty} ${ord.resourceLabel} (hiện có ${avail}).` };
    }
    this.consumeCampResource(ord.resource, ord.qty);
    ord.completed = true;
    m.ordersCompleted = (m.ordersCompleted || 0) + 1;
    const merchMult = (this.infra ? this.infra.getMerchantBonusMult() : 1) * (this.getSkillBonuses().tradePriceMult || 1.0);
    const finalReward = Math.round(ord.reward * merchMult);
    gameState.cash = (gameState.cash || 0) + finalReward;
    const dockTf = this.getSiteTransform('river_dock');
    this.riverTraffic?.spawnFloatingRaft(dockTf ? dockTf.z : DEFAULT_DOCK_Z, ord.resource, ord.qty);

    // If all 3 orders completed, give a bonus and schedule next fresh boat shortly
    const allDone = m.orders.every((o) => o.completed);
    let bonus = 0;
    if (allDone) {
      bonus = Math.round(95 * (this.getSkillBonuses().tradePriceMult || 1.0));
      gameState.cash += bonus;
      m.timer = Math.min(m.timer, 5);
    }
    return { ok: true, order: ord, earned: finalReward + bonus, allDone, bonus };
  }

  summonMerchantBoat() {
    if (!this.isBuilt('river_dock')) {
      return { ok: false, reason: 'Cần xây Bến Thả Bè ven sông trước.' };
    }
    const m = this.state.merchant;
    if (m.status === 'docked' || m.status === 'arriving') {
      return { ok: false, reason: 'Thuyền Thương Lái đang tới hoặc đã cập bến.' };
    }
    const dockTf = this.getSiteTransform('river_dock');
    m.status = 'arriving';
    m.boatZ = (dockTf ? dockTf.z : DEFAULT_DOCK_Z) - 42;
    m.orders = generateMerchantOrders(m.ordersCompleted || 0);
    return { ok: true };
  }

  resetCampFromZero() {
    this.cancelPlacement();
    this.cartAttached = false;
    if (this.handcart) {
      this.root.remove(this.handcart.group);
      disposeObject3D(this.handcart.group);
      this.handcart = null;
    }
    for (const trunk of this.felledTrunks) {
      this.root.remove(trunk.group);
      disposeObject3D(trunk.group);
    }
    this.felledTrunks = [];
    for (const log of this.groundLogs) {
      this.root.remove(log.mesh);
      disposeObject3D(log.mesh);
    }
    this.groundLogs = [];

    this.campfireLight = null;
    this.campfireFlames = [];
    this.campfireSmokes = [];
    this.lanternBulbs = [];
    this.lanternGlowLight = null;
    this.logYardVisuals = [];
    this.sawmillWheel = null;
    this.sawmillPlankVisuals = [];
    this.sawmillBadge = null;
    this.logYardBadge = null;
    this.dockBadge = null;
    this.cabinBadge = null;

    for (const site of this.sites.values()) {
      this.root.remove(site.group);
      disposeObject3D(site.group);
    }
    this.sites.clear();

    gameState.wildernessCamp = createDefaultWildernessCampState();
    this.state = gameState.wildernessCamp;
    this.infra?.reset();
    this.initAllSites();
    this.workerSystem?.syncWithState();
  }

  // ---------------------------------------------------------------------------
  // Per-frame Simulation (Zero GC): Handcart Follow, Campfire, Lanterns, Sawmill, River Traffic, Workers
  // ---------------------------------------------------------------------------
  update(dt, elapsed, playerPos, playerYaw, nightFactor = 0, onPlankProduced = null, options = {}) {
    const isRain = Boolean(options.isRain);
    // 0. Subtle breathing pulse on active placement ghost
    if (this.placement.active && this.ghostGroup && this.ghostGroup.visible) {
      const pulse = 1 + Math.sin(elapsed * 5.2) * 0.035;
      if (this.ghostRing?.visible) {
        const ringR = Math.min(4.2, (this.placement.bp?.radius || 3.2) * 0.86);
        this.ghostRing.scale.setScalar(ringR * pulse);
      }
      if (this.ghostWheelMarker?.visible) {
        this.ghostWheelMarker.rotation.x += dt * 1.8;
      }
    }

    // 1. Pullable Handcart kinematic follow along 360° hills & dynamic bridge
    if (this.handcart && this.cartAttached && playerPos) {
      // Exact trailing distance (2.06m) so T-bar drawbar tip (z=+1.66m) locks cleanly into lumberjack's two rear-reaching hands (0.40m behind spine)
      const targetDist = 2.06;
      const dx = this.handcart.pos.x - playerPos.x;
      const dz = this.handcart.pos.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.05) {
        const nx = dx / dist;
        const nz = dz / dist;
        const clampedX = playerPos.x + nx * targetDist;
        const clampedZ = playerPos.z + nz * targetDist;
        const pullLerp = 1 - Math.exp(-15 * dt);
        this.handcart.pos.x += (clampedX - this.handcart.pos.x) * pullLerp;
        this.handcart.pos.z += (clampedZ - this.handcart.pos.z) * pullLerp;

        const rad = Math.hypot(this.handcart.pos.x, this.handcart.pos.z);
        if (rad > WILDERNESS_RADIUS - 1.2) {
          const sc = (WILDERNESS_RADIUS - 1.2) / rad;
          this.handcart.pos.x *= sc;
          this.handcart.pos.z *= sc;
        }
        this.handcart.pos.y = this.getWalkableHeightAt(this.handcart.pos.x, this.handcart.pos.z);

        const desiredYaw = Math.atan2(playerPos.x - this.handcart.pos.x, playerPos.z - this.handcart.pos.z);
        let diff = desiredYaw - this.handcart.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.handcart.yaw += diff * Math.min(1, dt * 14);
      }

      const slope = groundSlopeAt(
        this.handcart.pos.x,
        this.handcart.pos.z,
        Math.sin(this.handcart.yaw),
        Math.cos(this.handcart.yaw)
      );
      // Pitch cart back slightly (-0.23 rad) while pulling to lift the front T-handle straight to waist/hand height (~0.80m)
      this.handcart.group.position.set(this.handcart.pos.x, this.handcart.pos.y + 0.04, this.handcart.pos.z);
      this.handcart.group.rotation.order = 'YXZ';
      const targetPitch = -0.23 - slope * 0.42;
      this.handcart.group.rotation.x += (targetPitch - this.handcart.group.rotation.x) * Math.min(1, dt * 10);
      this.handcart.group.rotation.y = this.handcart.yaw;
      this.handcart.group.rotation.z = 0;

      this.state.handcart.x = this.handcart.pos.x;
      this.state.handcart.z = this.handcart.pos.z;
      this.state.handcart.yaw = this.handcart.yaw;
    } else if (this.handcart && !this.cartAttached) {
      // Gently lower drawbar onto the ground when parked
      this.handcart.group.position.copy(this.handcart.pos);
      this.handcart.group.rotation.order = 'YXZ';
      this.handcart.group.rotation.x += (0.06 - this.handcart.group.rotation.x) * Math.min(1, dt * 6);
    }

    // 2. Felled trunk subtle vibration on axe bucking hit
    for (const trunk of this.felledTrunks) {
      if (trunk.wobble > 0) {
        trunk.wobble = Math.max(0, trunk.wobble - dt * 5.5);
        trunk.group.rotation.z = Math.sin(trunk.wobble * Math.PI * 3) * 0.08 * trunk.wobble;
      } else {
        trunk.group.rotation.z = 0;
      }
    }

    // 3. Loose ground log settle hop animation
    for (const log of this.groundLogs) {
      if (log.popTime > 0) {
        log.popTime = Math.max(0, log.popTime - dt);
        const p = Math.sin((log.popTime / 0.28) * Math.PI);
        log.mesh.position.y = log.pos.y + 0.14 + p * 0.42;
      }
    }

    // 4. Subtle pulse on tracked build site ring
    const tracked = this.getTrackedBlueprint();
    if (tracked) {
      const site = this.sites.get(tracked.id);
      if (site?.ring && site.group.visible && site.stakeGroup.visible) {
        const ringR = Math.min(3.4, tracked.bp.radius * 0.72);
        site.ring.scale.setScalar(ringR * (1 + Math.sin(elapsed * 3.4) * 0.04));
      }
    }

    // 5. Campfire flickering flames, warm light & gentle woodsmoke
    if (this.campfireFlames.length > 0) {
      const f0 = this.campfireFlames[0];
      const f1 = this.campfireFlames[1];
      const flicker = 0.88 + Math.sin(elapsed * 13.5) * 0.1 + Math.cos(elapsed * 19.2) * 0.06;
      f0.scale.set(0.56 + Math.sin(elapsed * 9) * 0.05, 0.54 * flicker, 0.56 + Math.cos(elapsed * 8) * 0.05);
      if (f1) f1.scale.set(0.36, 0.44 * flicker, 0.36);
      if (this.campfireLight) {
        this.campfireLight.intensity = (1.35 + nightFactor * 2.2) * flicker;
      }
      for (const sm of this.campfireSmokes) {
        sm.phase = (sm.phase + dt * 0.22) % 1;
        const p = sm.phase;
        sm.mesh.position.set(
          sm.driftX * p * 1.4 + Math.sin(elapsed * 1.3 + p * 5) * 0.14,
          0.95 + p * 3.6,
          sm.driftZ * p * 1.4
        );
        sm.mesh.scale.setScalar(0.55 + p * 1.35);
      }
    }

    // 6. Woodland Lantern Posts automatic dusk/night illumination
    if (this.lanternBulbs.length > 0) {
      const assets = getSharedCampAssets();
      assets.lanternBulbMat.emissiveIntensity = 0.35 + nightFactor * 2.4;
      if (this.lanternGlowLight) {
        this.lanternGlowLight.intensity = 0.3 + nightFactor * 2.4;
      }
    }

    // 7. Waterwheel Sawmill rotation & real-time log -> plank production (boosted +40% during rain!)
    if (this.isBuilt('waterwheel_sawmill')) {
      const speedMult = this.getSawmillSpeedMult(isRain);
      const activeSawing = (this.state.sawmillQueue || 0) > 0;
      if (this.sawmillWheel) {
        this.sawmillWheel.rotation.x += dt * (activeSawing ? 2.6 : 1.05) * speedMult;
      }
      if (activeSawing) {
        this.state.sawmillProgress += dt * speedMult;
        if (this.state.sawmillProgress >= SAWMILL_SECONDS_PER_LOG) {
          this.state.sawmillProgress -= SAWMILL_SECONDS_PER_LOG;
          this.state.sawmillQueue = Math.max(0, this.state.sawmillQueue - 1);
          this.state.campPlankStock += 2;
          gameState.planks = (gameState.planks || 0) + 2;
          gameState.totalPlanksSawn = (gameState.totalPlanksSawn || 0) + 2;
          this.recordProgressionEvent('saw_planks', 2);
          this.syncSawmillVisuals();
          if (typeof onPlankProduced === 'function') {
            const tf = this.getSiteTransform('waterwheel_sawmill');
            const outX = tf.x - Math.cos(tf.yaw) * 2.6;
            const outZ = tf.z + Math.sin(tf.yaw) * 2.6;
            _tmpVecB.set(outX, groundHeightAt(outX, outZ) + 1.4, outZ);
            onPlankProduced(2, _tmpVecB);
          }
        }
      }
    }

    if (this.forgeGrindWheel) {
      this.forgeGrindWheel.rotation.z += dt * 1.9;
    }

    // 8. Craft Cabin Woodworking (2 Planks -> 1 Crafted Woodwork)
    if (this.isBuilt('craft_cabin') && (this.state.craftQueue || 0) > 0) {
      this.state.craftProgress = (this.state.craftProgress || 0) + dt;
      if (this.state.craftProgress >= CABIN_SECONDS_PER_CRAFT) {
        this.state.craftProgress -= CABIN_SECONDS_PER_CRAFT;
        this.state.craftQueue = Math.max(0, this.state.craftQueue - 1);
        this.state.campCraftStock = (this.state.campCraftStock || 0) + 1;
        this.syncCabinVisuals();
        if (typeof options.onCraftProduced === 'function') {
          const tf = this.getSiteTransform('craft_cabin');
          _tmpVecB.set(tf.x, groundHeightAt(tf.x, tf.z) + 2.0, tf.z);
          options.onCraftProduced(1, _tmpVecB);
        }
      }
    }

    // 9. Floating River Rafts & Scheduled Merchant Riverboat
    this.riverTraffic?.update(dt, elapsed, {
      onMerchantArrived: options.onMerchantArrived
    });

    // 10. AI Camp Workers (Porters & Assistant Choppers)
    this.workerSystem?.update(dt, {
      onWorkerDeposit: options.onWorkerDeposit,
      onWorkerFellTree: options.onWorkerFellTree
    });

    // 11. Heavy Machinery (AI Excavator Grading), Auto-Sawmill & Tiered Housing Passive Income
    this.infra?.update(dt, elapsed, {
      onPadFlattened: options.onPadFlattened,
      onGradeSfx: options.onGradeSfx,
      onAutoSawPlank: options.onAutoSawPlank,
      onPassiveIncome: options.onPassiveIncome
    });
  }

  dispose() {
    this.riverTraffic?.dispose();
    this.workerSystem?.dispose();
    this.infra?.dispose();
    if (this.root.parent) this.root.parent.remove(this.root);
    disposeObject3D(this.root);
    this.sites.clear();
    this.felledTrunks = [];
    this.groundLogs = [];
    this.handcart = null;
    this.ghostGroup = null;
  }
}
