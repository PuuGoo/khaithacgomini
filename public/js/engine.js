import { DISTRICTS, findCheckpoint, findRegionalStation } from './regions.js';
import { parkingStatus } from './vehicle-parking.js';
/**
 * TimberPort 3D — Core Three.js PBR Engine, GPU Memory Manager & Simulation Loop
 * Zero-Leak Render Loop, Hardware Auto-Profiler (<8GB RAM & Intel HD Protection),
 * Visibility Pause, Explicit Resource Disposal & Cross-Platform Controls
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  gameState,
  VEHICLES,
  UPGRADE_CATALOG,
  MARKET_COMMODITIES,
  YACHT_TIERS,
  AIRPORT_TIERS,
  HQ_TIERS,
  ISLAND_RESORT_TIERS,
  FURNITURE_MILL_TIERS,
  DEEP_PORT_TIERS,
  GREEN_ENERGY_TIERS,
  INSURANCE_TIERS,
  RAILWAY_TIERS,
  HELI_TIERS,
  WEATHER_PRESETS,
  CIVIC_AMENITY_TIERS,
  CITIZEN_ARCHETYPES,
  getIslandPopulation,
  getCitizenHappiness,
  getCivicTaxPer10s,
  getActiveCitizenCount,
  fleetMissionState,
  marketState,
  stormState,
  shiftSession,
  metropolisState,
  updateMarketPrices,
  updateStockPrices,
  updateCarbonMarket,
  sampleRevenueHistory,
  calculateOfflineEarnings,
  getBackpackCapacity,
  getActiveBranch,
  getSkinData,
  getLiveryData,
  getEngineSpeedMult,
  getEngineYieldMult,
  getRevenueMultiplier,
  getContractMultiplier,
  getManagerBonus,
  getPrestigeMultiplier,
  hasPatent,
  getActiveEvent,
  getUpgradeCost,
  getSawmillVisualTier,
  getHarborVisualTier,
  getPlaneData,
  getHeliData,
  getFranchiseRoyaltyPer10s,
  getRealEstateIncomePer10s,
  craftFurnitureBatch,
  quickBatchSawAndPallet,
  quickBatchFurniture,
  triggerTrainExpressBoost,
  autoTryDispatchContainerVoyage,
  fetchMetropolisState,
  syncMetropolisFromServer,
  tickTradeExpo,
  tickContainerVoyage,
  tickFuturesContracts,
  recordExportItem,
  recordPnlExpense,
  logTransaction,
  evaluateBadgeUnlocks,
  recordRevenue,
  addVipXp,
  addSeasonXp,
  advanceDailyQuest,
  generateNextContract,
  spawnFleetMission,
  tickFleetMissions,
  completeFleetMission,
  tickStormChallenge,
  completeStormRescue,
  tickTimedEvents,
  tickVipRushOrder,
  tickComboTimer,
  tickAuctionTimer,
  saveGameLocal,
  saveGameServer,
  loadGameLocal
} from './state.js';
import { sound } from './audio.js';
import { Archipelago } from './archipelago.js';
import {
  setTextureAnisotropy,
  makeWorldBadgeSprite,
  makeCitizenBubbleSprite,
  updateCitizenBubbleSprite,
  disposeAllCachedTextures
} from './textures.js';
import {
  createPlayerModel,
  updatePlayerModelSkin,
  syncPlayerBackLogs,
  attachGlbToPlayerModel,
  setPlayerGlbActive,
  setPlayerGlbYawOffset,
  setPlayerGlbShadows,
  updatePlayerModelAnimation,
  createPetModel,
  createVehicleModel,
  createFishingBoatModel,
  createWorkerModel,
  createCitizenModel,
  createDrivableYachtModel,
  attachGlbToPersonalBoat,
  setPersonalBoatGlbShadows,
  createAirplaneModel,
  createHelicopterModel,
  applyLiveryToModel,
  disposeObject3D
} from './models.js';
import { WorldManager, WORLD_BOUNDS, LAND_EDGE_Z, SEA_BOUNDS, AIR_BOUNDS, ZONES, MAP_ZONES, DELIVERY_DROPOFFS, FISHING_PIER_DOCKS } from './world.js';
import { UIManager } from './ui.js';

// ---------------------------------------------------------------------------
// 0. Island Pedestrian Waypoint Graph, Building POIs & Obstacle Colliders
// ---------------------------------------------------------------------------
const ISLAND_WAYPOINTS = {
  plaza_center: {
    id: 'plaza_center', x: 5.0, z: -46.0, isShelter: false,
    buildingId: 'plaza', buildingLabel: 'Công Viên Trung Tâm Khu Dân Cư',
    interactAction: '🏛️ Dạo chơi Công Viên Trung Tâm', pose: 'photo',
    lookAt: { x: 5.0, z: -54.0 },
    neighbors: ['sawmill_walk', 'east_avenue', 'boardwalk_center', 'furniture_walk']
  },
  sawmill_walk: {
    id: 'sawmill_walk', x: -58.0, z: -42.0, isShelter: true,
    buildingId: 'sawmill', buildingLabel: 'Khu Công Nghiệp Gỗ & Xưởng Cưa',
    interactAction: '🪵 Kiểm định dây chuyền Xưởng Cưa', pose: 'inspect',
    lookAt: { x: -76.0, z: -42.0 },
    neighbors: ['furniture_walk', 'boardwalk_west']
  },
  hq_plaza: {
    id: 'hq_plaza', x: 68.0, z: -46.0, isShelter: true,
    buildingId: 'hq', buildingLabel: 'Khu Hạ Tầng & Trụ Sở Tập Đoàn',
    interactAction: '📊 Xem bảng điều phối Khu Hạ Tầng', pose: 'point_up',
    lookAt: { x: 76.0, z: -46.0 },
    neighbors: ['east_avenue', 'rail_station', 'helipad_plaza']
  },
  east_avenue: {
    id: 'east_avenue', x: 45.0, z: -46.0, isShelter: false,
    buildingId: 'avenue', buildingLabel: 'Đại Lộ Phân Khu Đông',
    interactAction: '🌳 Dạo mát Đại lộ Đông', pose: 'sip_coffee',
    lookAt: { x: 74.0, z: -46.0 },
    neighbors: ['plaza_center', 'hq_plaza', 'boardwalk_east']
  },
  furniture_walk: {
    id: 'furniture_walk', x: -34.0, z: -22.0, isShelter: true,
    buildingId: 'furniture', buildingLabel: 'Đại Lộ Phân Khu Tây & Xưởng Nội Thất',
    interactAction: '🛋️ Xem Xưởng Nội thất xuất khẩu', pose: 'inspect',
    lookAt: { x: -60.0, z: -18.0 },
    neighbors: ['plaza_center', 'sawmill_walk', 'boardwalk_west', 'boardwalk_center']
  },
  rail_station: {
    id: 'rail_station', x: 96.0, z: -42.0, isShelter: true,
    buildingId: 'railway', buildingLabel: 'Ga Tàu Hỏa Logistics Đông',
    interactAction: '🚂 Kiểm tra toa hàng Ga Đường Sắt', pose: 'wave_ship',
    lookAt: { x: 106.0, z: -42.0 },
    neighbors: ['hq_plaza', 'helipad_plaza', 'airport_terminal']
  },
  boardwalk_west: {
    id: 'boardwalk_west', x: -58.0, z: 21.0, isShelter: true,
    buildingId: 'deep_port', buildingLabel: 'Bờ Kè & Cầu Tàu Cá Tây',
    interactAction: '🎣 Ngắm tàu cá neo đậu bến Tây', pose: 'photo',
    lookAt: { x: -58.0, z: 32.0 },
    neighbors: ['sawmill_walk', 'furniture_walk', 'boardwalk_center']
  },
  boardwalk_center: {
    id: 'boardwalk_center', x: 5.0, z: 20.5, isShelter: true,
    buildingId: 'promenade', buildingLabel: 'Bờ Kè & Đường Đi Bộ Ven Biển',
    interactAction: '☕ Thưởng thức Cà phê Ven Biển', pose: 'sip_coffee',
    lookAt: { x: 5.0, z: 32.0 },
    neighbors: ['plaza_center', 'furniture_walk', 'boardwalk_west', 'harbor_pier', 'boardwalk_east']
  },
  harbor_pier: {
    id: 'harbor_pier', x: 5.0, z: 29.0, isShelter: false,
    buildingId: 'harbor', buildingLabel: 'Cầu Gỗ Neo Đậu Tàu Cá Trung Tâm',
    interactAction: '⛵ Vẫy chào tàu cá cập bến', pose: 'wave_ship',
    lookAt: { x: 5.0, z: 38.0 },
    neighbors: ['boardwalk_center']
  },
  boardwalk_east: {
    id: 'boardwalk_east', x: 52.0, z: 21.0, isShelter: true,
    buildingId: 'yacht', buildingLabel: 'Bến Neo Đậu Tàu Cá & Du Thuyền Đông',
    interactAction: '📸 Chụp ảnh Bến Tàu Đông', pose: 'photo',
    lookAt: { x: 52.0, z: 32.0 },
    neighbors: ['boardwalk_center', 'east_avenue', 'helipad_plaza']
  },
  helipad_plaza: {
    id: 'helipad_plaza', x: 66.0, z: -12.0, isShelter: false,
    buildingId: 'helipad', buildingLabel: 'Sân Đáp Trực Thăng VIP (H)',
    interactAction: '🚁 Chiêm ngưỡng Trực thăng Chuyên cơ', pose: 'photo',
    lookAt: { x: 74.0, z: -12.0 },
    neighbors: ['hq_plaza', 'rail_station', 'boardwalk_east', 'airport_terminal']
  },
  airport_terminal: {
    id: 'airport_terminal', x: 122.0, z: 4.0, isShelter: true,
    buildingId: 'airport', buildingLabel: 'Nhà Ga Đường Băng Đông',
    interactAction: '✈️ Xem lịch bay tại Nhà ga Hàng không', pose: 'inspect',
    lookAt: { x: 132.0, z: 4.0 },
    neighbors: ['rail_station', 'helipad_plaza']
  },
  // Offshore Luxury Resort Island Loop
  resort_west: {
    id: 'resort_west', x: 47.5, z: 48.5, isShelter: false,
    buildingId: 'resort_bridge', buildingLabel: 'Bến Đảo Nghỉ Dưỡng',
    interactAction: '🌊 Ngắm vịnh biển từ Đảo Resort', pose: 'photo',
    lookAt: { x: 35.0, z: 42.0 },
    neighbors: ['resort_plaza', 'resort_lighthouse']
  },
  resort_plaza: {
    id: 'resort_plaza', x: 52.0, z: 52.0, isShelter: true,
    buildingId: 'resort', buildingLabel: 'Biệt Thự Nghỉ Dưỡng 5 Sao',
    interactAction: '🌴 Thư giãn tại Biệt thự Đảo VIP', pose: 'sip_coffee',
    lookAt: { x: 54.0, z: 50.0 },
    neighbors: ['resort_west', 'resort_lighthouse']
  },
  resort_lighthouse: {
    id: 'resort_lighthouse', x: 56.5, z: 55.5, isShelter: true,
    buildingId: 'lighthouse', buildingLabel: 'Hải Đăng Đảo Ngoài Khơi',
    interactAction: '🚨 Check-in dưới chân Hải Đăng Đảo', pose: 'point_up',
    lookAt: { x: 58.0, z: 58.0 },
    neighbors: ['resort_plaza', 'resort_west']
  }
};
const MAINLAND_WP_KEYS = [
  'plaza_center', 'sawmill_walk', 'hq_plaza', 'east_avenue',
  'furniture_walk', 'rail_station', 'boardwalk_west', 'boardwalk_center',
  'harbor_pier', 'boardwalk_east', 'helipad_plaza', 'airport_terminal'
];
const RESORT_WP_KEYS = ['resort_west', 'resort_plaza', 'resort_lighthouse'];

// Soft circular building obstacle colliders so pedestrians never clip into structures while steering
const BUILDING_COLLIDERS = [
  { x: -76.0, z: -42.0, radius: 6.5 },   // Main Sawmill complex (Logging Zone)
  { x: -60.0, z: -18.0, radius: 3.8 },   // Furniture Mill (Logging Zone)
  { x: 5.0, z: -52.0, radius: 3.4 },     // Central Park Fountain (Residential Zone)
  { x: 76.0, z: -46.0, radius: 4.2 },    // Corporate HQ Tower (Infrastructure Zone)
  { x: 101.6, z: -42.0, radius: 3.2 },   // East Railway Station (Infrastructure Zone)
  { x: -92.0, z: 23.0, radius: 2.6 }     // Coastal Lighthouse (West Waterfront)
];

// ---------------------------------------------------------------------------
// 1. Hardware & WebGL Capability Profiler (<8GB RAM / Intel HD Guard)
// ---------------------------------------------------------------------------
function probeHardware() {
  let supported = false;
  let isSoftwareGl = false;
  let rendererStr = 'Unknown';

  try {
    const cv = document.createElement('canvas');
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    if (gl) {
      supported = true;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      rendererStr = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch (e) {
    supported = false;
  }

  const memGb = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const isWeakIgpu = /Intel.*HD Graphics (2000|2500|3000|4000|4200|4400|4600|5000|5300|5500)|Intel\(R\) HD Graphics|Intel.*GMA|Mali-4|Adreno \(TM\) 3|PowerVR/i.test(rendererStr);
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  let autoTier = 'high';
  let reason = 'GPU rời / Phần cứng cao';

  if (isSoftwareGl) {
    autoTier = 'low';
    reason = 'Software WebGL';
  } else if (isWeakIgpu) {
    autoTier = 'low';
    reason = `GPU tích hợp đời thấp (${rendererStr.slice(0, 32)})`;
  } else if (memGb !== null && memGb <= 4) {
    autoTier = 'low';
    reason = `RAM <= 4GB (${memGb}GB)`;
  } else if ((memGb !== null && memGb <= 8 && cores <= 4) || isMobile) {
    autoTier = 'low';
    reason = isMobile ? 'Thiết bị Di động' : `RAM ${memGb}GB · ${cores} luồng CPU`;
  } else if (memGb !== null && memGb <= 8) {
    autoTier = 'balanced';
    reason = `RAM <= 8GB (${memGb}GB)`;
  }

  return { supported, isSoftwareGl, isWeakIgpu, memGb, cores, rendererStr, autoTier, reason };
}

function createAfterDrawScheduler(renderer) {
  const gl = renderer.getContext();
  const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  return function afterDraw(fn) {
    if (!isGL2 || typeof gl.fenceSync !== 'function') {
      return setTimeout(() => requestAnimationFrame(fn), 80);
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const status = gl.clientWaitSync(sync, 0, 0);
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
        gl.deleteSync(sync);
        setTimeout(() => requestAnimationFrame(fn), 80);
      } else {
        setTimeout(poll, 4);
      }
    };
    return setTimeout(poll, 4);
  };
}

// ---------------------------------------------------------------------------
// 2. Main Game Engine Boot
// ---------------------------------------------------------------------------
class TimberPortEngine {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.fallbackEl = document.getElementById('webgl-fallback');
    document.getElementById('btn-retry-webgl')?.addEventListener('click', () => window.location.reload());

    this.hw = probeHardware();
    if (!this.hw.supported) {
      if (this.fallbackEl) this.fallbackEl.hidden = false;
      return;
    }
    this.isSoftwareGl = this.hw.isSoftwareGl;

    const prevUpdatedAt = loadGameLocal();
    const offlineData = calculateOfflineEarnings(prevUpdatedAt);
    this.activeProfile = this.resolveProfile(gameState.graphicsQuality || 'auto');

    this.rafId = 0;
    this.disposed = false;
    this.paused = false;
    this.fpsSamples = 0;
    this.fpsAccum = 0;
    this.currentFps = 60;

    // Pre-allocated daylight & atmosphere colors (Zero GC inside render loop)
    this._daySkyBase = new THREE.Color('#8ecae6');
    this._dayFogBase = new THREE.Color('#bfe3f2');
    this._warmSunTint = new THREE.Color('#f59e0b');
    this._skyGoldenColor = new THREE.Color();
    this._fogGoldenColor = new THREE.Color();
    this._stormSkyColor = new THREE.Color('#334155');
    this._stormFogColor = new THREE.Color('#475569');
    this._nightSkyColor = new THREE.Color('#070d19');
    this._nightFogColor = new THREE.Color('#0b1528');
    this._sunsetSkyColor = new THREE.Color('#d97706');
    this._sunsetFogColor = new THREE.Color('#9a3412');
    this._dawnSkyColor = new THREE.Color('#38bdf8');
    this._dawnFogColor = new THREE.Color('#7dd3fc');

    this.initThree();

    this.world = new WorldManager(this.scene, { lowSpec: this.activeProfile !== 'high' });
    this.applyBranchAtmosphere(getActiveBranch());
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    this.world.syncRailwayTier(gameState.railwayTier || 0);
    this.world.syncHeliTier(gameState.heliTier || 0);
    this.world.syncCivicTier(gameState.civicTier || 0);

    // Pre-allocated math vectors (Zero GC inside render loop)
    this._vecForward = new THREE.Vector3();
    this._vecRight = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();
    this._camDesired = new THREE.Vector3();
    this._camLook = new THREE.Vector3();
    this._projVec = new THREE.Vector3();
    this._tmpVec = new THREE.Vector3();
    this._arcStart = new THREE.Vector3();
    this._arcEnd = new THREE.Vector3();

    // Player & simulation state (spawn on South Avenue facing Residential Park, with Logging West & Infrastructure East)
    this.playerPos = new THREE.Vector3(5, 0, 10);
    const checkpoint = gameState.checkpoint;
    if (checkpoint) {
      const { x, z } = DISTRICTS[checkpoint.row][checkpoint.column];
      this.playerPos.set(x, 0, z);
    }
    this.vehicleHome = null;
    this.activeYardVehicle = null;
    this.activeBoardedBoat = null;
    this.playerYaw = 0;
    this.inVehicle = false;
    this.controlMode = 'foot'; // 'foot' | 'land' | 'yard_vehicle' | 'yacht' | 'plane' | 'heli'
    this.syncYardVehicleDrivers();
    this.vehicleSpeed = 0;
    this.planePitch = 0;
    this.planeBank = 0;
    this.heliPitch = 0;
    this.heliBank = 0;
    this.btnClimbUp = false;
    this.btnClimbDown = false;
    this.wakeTimer = 0;
    this.autoFleetIncomeTimer = 0;
    this.hqDivTimer = 0;
    this.resortTickTimer = 0;
    this.furnitureCraftTimer = 0;
    this.empirePhase6Timer = 0;
    this.phase7TickTimer = 0;
    this.phase8TickTimer = 0;
    this.civicTickTimer = 0;
    this.revSampleTimer = 0;
    this.stockAccum = 0;
    this.chopCooldown = 0;
    this.chopSwing = 0;
    this.unloadTimer = 0;
    this.sawTimer = 0;
    this.palletTimer = 0;
    this.fishTimer = 0;
    this.sellTimer = 0;
    this.deliverTimer = 0;
    this.fullBagToastTimer = 0;
    this.logisticsLogTimer = 0;
    this.logisticsExportTimer = 0;
    this.yachtTickTimer = 0;
    this.badgeCheckTimer = 0;
    this.lastVisualBuffer = -1;
    this.lastVisualPlanks = -1;
    this.lastVisualPallets = -1;
    this.walkPhase = 0;
    this.playerMoving = false;
    this.chopTargetYaw = null;
    this.playerAction = null;
    this.playerActionTimer = 0;
    this.playerActionDuration = 0;
    this.playerGestureIdx = 0;
    this.playerJumpVel = 0;
    this.playerJumpY = 0;
    this.workerRallyTimer = 0;
    this._playerAnimOpts = { carryRatio: 0, speedMult: 1, action: null, actionT: 0, jumpY: 0 };

    // Camera Orbit & Choreography state
    this.camYaw = 0.42;
    this.camPitch = 0.62;
    this.camDist = 17.5;
    this.cameraMode = 'follow'; // 'follow' | 'tactical' | 'orbit' | 'train'
    this.orbitAngle = 0;
    this.screenShake = 0;
    this.lastAppliedNightFactor = -1;

    // Spawn Player, Pet, Parked Vehicle, AI Fleet, Drivable Yacht & Plane
    this.playerModel = createPlayerModel(getSkinData(), gameState.vipLevel);
    this.playerModel.position.copy(this.playerPos);
    this.scene.add(this.playerModel);
    syncPlayerBackLogs(this.playerModel, gameState.logs);
    this.playerGlbStatus = {
      exists: false,
      loaded: false,
      loading: false,
      sizeBytes: 0,
      meshCount: 0,
      clipNames: [],
      error: null
    };

    this.petModel = null;
    this.petPos = new THREE.Vector3(-1.4, 0, 2.8);
    this.rebuildPet();

    this.parkedVehicle = null;
    this.vehiclePos = ZONES.vehicleSpawn.clone();
    this.vehicleYaw = Math.PI * 0.25;
    this.rebuildVehicle();

    this.aiWorkers = [];
    this.aiForklifts = [];
    this.fishingBoats = [];
    this.rebuildWorkforce();

    this.aiCitizens = [];
    this.rebuildCitizens();

    this.drivableYacht = null;
    this.drivablePlane = null;
    this.drivableHeli = null;
    this.aiSeaYachts = [];
    this.aiAirPlanes = [];
    this.rebuildAirSeaFleet();
    this.ensureDockedPersonalBoatGlb();

    // Input State
    this.keys = new Set();
    this.joyVec = { x: 0, y: 0 };
    this.joyActiveId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.orbitActiveId = null;
    this.orbitLast = { x: 0, y: 0 };

    // Multiplayer
    this.ws = null;
    this.myNetId = null;
    this.remotePlayers = new Map();
    this.netSendTimer = 0;

    // UI Manager
    this.ui = new UIManager({
      onContextAction: () => this.handleContextAction(),
      onUpgrade: (id) => this.handleUpgradeEffect(id),
      onDeliverContract: (instant) => this.handleDeliverContract(instant),
      onDeliverVipRush: () => this.handleDeliverVipRush(),
      onPrestige: () => this.handlePrestigeReset(),
      canResetPrestige: () => {
        if (this.controlMode === 'foot') return true;
        this.ui.toast(this.getParkingStatus().label);
        return false;
      },
      onQuickSellSawmill: () => this.sellAllAtSawmill(),
      onYachtChange: () => {
        this.world?.syncYachtTier(gameState.yachtTier || 0);
        this.rebuildAirSeaFleet();
        this.rebuildCitizens();
      },
      onAirportChange: () => {
        this.world?.syncAirportTier(gameState.airportTier || 0);
        this.rebuildAirSeaFleet();
        this.rebuildCitizens();
      },
      onIslandChange: () => {
        this.world?.syncIslandTier(gameState.islandStationTier || 0);
        this.rebuildCitizens();
      },
      onHqChange: () => {
        this.world?.syncHqTier(gameState.hqTier || 0);
        this.rebuildCitizens();
      },
      onResortChange: () => {
        this.world?.syncResortTier(gameState.islandResortTier || 0);
        this.rebuildCitizens();
      },
      onFurnitureMillChange: () => {
        this.world?.syncFurnitureMillTier(gameState.furnitureMillTier || 0);
      },
      onLighthouseChange: () => {
        this.world?.syncLighthouseTier(gameState.lighthouseTier || 0);
      },
      onDeepPortChange: () => {
        this.world?.syncDeepPortTier(gameState.deepPortTier || 0, gameState.greenEnergyTier || 0);
        this.rebuildCitizens();
      },
      onGreenEnergyChange: () => {
        this.world?.syncDeepPortTier(gameState.deepPortTier || 0, gameState.greenEnergyTier || 0);
      },
      onRailwayChange: () => {
        this.world?.syncRailwayTier(gameState.railwayTier || 0);
        this.rebuildCitizens();
      },
      onHeliChange: () => {
        this.world?.syncHeliTier(gameState.heliTier || 0);
        this.rebuildAirSeaFleet();
        this.rebuildCitizens();
      },
      onCivicChange: () => {
        this.world?.syncCivicTier(gameState.civicTier || 0);
        this.rebuildCitizens();
      },
      onGreetCitizen: () => this.cyclePlayerGesture(),
      onTrainExpress: () => this.triggerTrainBoost(),
      onCycleWeather: () => this.cycleWeatherPreset(),
      onCycleCamera: () => this.cycleCameraMode(),
      getCameraMode: () => this.cameraMode,
      onContributeLandmark: (wood, cash) => this.contributeLandmark(wood, cash),
      onListMarketItem: (resource, amount, price) => this.listMarketItem(resource, amount, price),
      onBuyMarketItem: (listingId) => this.buyMarketItem(listingId),
      onQuickSawPallet: () => {
        const res = quickBatchSawAndPallet();
        if (!res.ok) {
          this.ui.toast(res.reason);
          return false;
        }
        sound.playUpgrade();
        this.world.spawnParticles(ZONES.sawOutput, 0x38bdf8, 5);
        this.syncSawmillVisuals();
        saveGameServer();
        this.ui.refreshHUD();
        this.ui.toast(`⚙️ Đã xẻ ${res.sawnPlanks} ván & đóng ${res.packedPallets} Pallet!`);
        return true;
      },
      onQuickCraftFurniture: () => {
        const res = quickBatchFurniture();
        if (!res.ok) {
          this.ui.toast(res.reason);
          return false;
        }
        sound.playUpgrade();
        this.world.spawnParticles(ZONES.furnitureMill, 0xfb7185, 5);
        this.syncSawmillVisuals();
        saveGameServer();
        this.ui.refreshHUD();
        this.ui.toast(`🛋️ Chế tác nhanh +${res.produced} Bộ Nội thất!`);
        return true;
      },
      onLiveryChange: () => this.applyFleetLiveries(),
      onPlaneChange: () => this.rebuildAirSeaFleet(),
      onAutoFleetChange: () => this.rebuildAirSeaFleet(),
      onQuickYardTruck: () => this.quickBoardYardTruck(),
      onHireOrToggleDriver: () => this.hireOrToggleYardDriver(),
      onBoardYacht: () => this.boardYacht(null, true),
      onBoardPlane: () => this.boardPlane(),
      onBoardHeli: () => this.boardHeli(),
      onBoardStormVehicle: () => {
        if (stormState.kind === 'air') {
          if ((gameState.heliTier || 0) >= 1) this.boardHeli();
          else this.boardPlane();
        } else {
          this.boardYacht(null, true);
        }
      },
      onDisembark: () => this.disembarkFleet(),
      onPlaneClimb: (active) => { this.btnClimbUp = Boolean(active); },
      onPlaneDescend: (active) => { this.btnClimbDown = Boolean(active); },
      onSellCommodity: (key) => this.sellCommodityAtMarket(key),
      onBranchChange: (br) => {
        this.applyBranchAtmosphere(br);
        this.rebuildWorkforce();
        this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
      },
      onSkinChange: () => {
        updatePlayerModelSkin(this.playerModel, getSkinData(), gameState.vipLevel);
      },
      getPlayerGlbInfo: () => ({
        ...this.playerGlbStatus,
        useGlbPlayer: gameState.useGlbPlayer !== false,
        glbActive: Boolean(this.playerModel?.userData?.glbActive),
        yawOffset: Number(gameState.glbPlayerYawOffset || 0)
      }),
      onUploadPlayerGlb: (file) => this.uploadPlayerGlb(file),
      onTogglePlayerGlb: (enabled) => this.togglePlayerGlb(enabled),
      onRotatePlayerGlb: () => this.rotatePlayerGlb(),
      onPetChange: () => this.rebuildPet(),
      onVehicleChange: () => this.rebuildVehicle(),
      getOnlineCount: () => 1 + this.remotePlayers.size,
      getOnlinePlayers: () => this.getOnlinePlayersList(),
      getGraphicsInfo: () => this.getGraphicsInfo(),
      onGraphicsChange: (mode) => this.setGraphicsQuality(mode),
      onFlushGpu: () => this.flushGpuCaches()
    });

    this.initPlayerGlbModel();

    this.archipelago = new Archipelago(this);
    if (gameState.islandRoute.arrivalAt || (!gameState.checkpoint && gameState.islandRoute.fish)) {
      this.playerPos.copy(ZONES.ferryPier);
      this.playerModel.position.copy(this.playerPos);
    }
    this.bindInputs();
    this.bindLifecycle();
    this.connectMultiplayer();
    fetchMetropolisState();
    this.syncSawmillVisuals();
    this.ui.refreshHUD();
    this.ui.showWelcomeOverlay(offlineData, this.getGraphicsInfo(), (data) => this.applyOfflineEarnings(data));

    this.autoSaveAccum = 0;
    this.hudSyncAccum = 0;
    this.marketAccum = 0;
    this.minimapAccum = 0;
    this.lastTime = performance.now();
    this.lastRenderTime = this.lastTime;
    this.elapsed = 0;

    this.scheduleNextTick();
  }

  resolveProfile(mode) {
    if (mode === 'low' || mode === 'balanced' || mode === 'high') return mode;
    // Default to Max-FPS performance profile (shadows & PointLights OFF, uncapped 60 FPS)
    return 'low';
  }

  getGraphicsInfo() {
    const labels = {
      low: 'Tối đa FPS (Mặc định)',
      balanced: 'Cân bằng (60 FPS)',
      high: 'Đồ họa Cao (Bóng đổ 1024px)'
    };
    return {
      mode: gameState.graphicsQuality || 'auto',
      activeProfile: this.activeProfile,
      profileLabel: labels[this.activeProfile],
      reason: this.hw.reason,
      fps: Math.round(this.currentFps),
      geometries: this.renderer?.info?.memory?.geometries || 0,
      textures: this.renderer?.info?.memory?.textures || 0,
      calls: this.renderer?.info?.render?.calls || 0
    };
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.5,
      760
    );

    const high = this.activeProfile === 'high';
    const low = this.activeProfile === 'low';
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && high,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.type = high ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.paused = true;
      cancelAnimationFrame(this.rafId);
      if (this.fallbackEl) this.fallbackEl.hidden = false;
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      if (this.fallbackEl) this.fallbackEl.hidden = true;
      this.paused = false;
      this.lastTime = performance.now();
      this.scheduleNextTick();
    });

    // Studio IBL environment baked once (skip heavy PMREM cubemap on software/low GPU, keep 3-point lighting crisp)
    this.envRT = null;
    if (!low) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const roomEnv = new RoomEnvironment();
      this.envRT = pmrem.fromScene(roomEnv, 0.04);
      this.scene.environment = this.envRT.texture;
      this.scene.environmentIntensity = 0.78;
      roomEnv.dispose();
      pmrem.dispose();
    } else {
      this.scene.environment = null;
    }

    // Photorealistic 3-Point Sunlit Coastal Lighting Rig (Warm Sun + Crisp Sky Fill + Turquoise Sea Bounce)
    const hemiIntensity = low ? 1.08 : 0.84;
    this.hemiLight = new THREE.HemisphereLight(0xcbe9ff, 0x4b5e3d, hemiIntensity);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, low ? 2.1 : 2.38);
    this.sunLight.position.set(34, 44, 24);
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 135;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.62);
    rimLight.position.set(-28, 18, 26);
    this.scene.add(rimLight);

    this.applyGraphicsSettings();

    if (this.isSoftwareGl) {
      this.afterDraw = createAfterDrawScheduler(this.renderer);
    }

    this._onResize = () => {
      if (this.disposed) return;
      this.camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._onResize);
  }

  applyGraphicsSettings() {
    const p = this.activeProfile;
    const dpr = window.devicePixelRatio || 1;

    if (p === 'low') {
      if (this.envRT) {
        this.envRT.dispose();
        this.envRT = null;
      }
      this.scene.environment = null;
      this.hemiLight.intensity = 1.12;
      this.sunLight.intensity = 2.08;
      this.renderer.setPixelRatio(Math.min(dpr, 1.2));
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.minFrameMs = 0; // Uncapped 60 FPS VSync for smooth Max-FPS performance
      setTextureAnisotropy(1);
    } else if (p === 'balanced') {
      if (!this.envRT) {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const roomEnv = new RoomEnvironment();
        this.envRT = pmrem.fromScene(roomEnv, 0.04);
        this.scene.environment = this.envRT.texture;
        this.scene.environmentIntensity = 0.7;
        roomEnv.dispose();
        pmrem.dispose();
      }
      this.hemiLight.intensity = 0.92;
      this.sunLight.intensity = 2.18;
      this.renderer.setPixelRatio(Math.min(dpr, 1.25));
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.minFrameMs = 0;
      setTextureAnisotropy(2);
    } else {
      if (!this.envRT) {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const roomEnv = new RoomEnvironment();
        this.envRT = pmrem.fromScene(roomEnv, 0.04);
        this.scene.environment = this.envRT.texture;
        this.scene.environmentIntensity = 0.72;
        roomEnv.dispose();
        pmrem.dispose();
      }
      this.hemiLight.intensity = 0.78;
      this.sunLight.intensity = 2.25;
      this.renderer.setPixelRatio(Math.min(dpr, 1.5));
      const enableShadow = !this.isSoftwareGl;
      this.renderer.shadowMap.enabled = enableShadow;
      this.sunLight.castShadow = enableShadow;
      if (enableShadow && this.sunLight.shadow.mapSize.x !== 1024) {
        this.sunLight.shadow.map?.dispose();
        this.sunLight.shadow.map = null;
        this.sunLight.shadow.mapSize.set(1024, 1024);
      }
      this.minFrameMs = 0;
      setTextureAnisotropy(Math.min(4, this.renderer.capabilities.getMaxAnisotropy()));
    }

    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setGraphicsQuality(mode) {
    gameState.graphicsQuality = mode;
    this.activeProfile = this.resolveProfile(mode);
    this.applyGraphicsSettings();
    this.world?.setLowSpec(this.activeProfile !== 'high');
    setPlayerGlbShadows(this.playerModel, this.activeProfile === 'high');
    setPersonalBoatGlbShadows(this.world?.vipYacht, false);
    this.rebuildVehicle();
    this.rebuildAirSeaFleet();
    this.rebuildCitizens();
    saveGameServer();
    this.ui.toast(`⚡ Đã chuyển đồ họa: ${this.getGraphicsInfo().profileLabel}`);
  }

  ensureDockedPersonalBoatGlb() {
    if ((gameState.yachtTier || 0) < 1) return;
    if (!this.world?.vipYacht || this.world.vipYacht.userData?.glbBoatLoaded) return;
    attachGlbToPersonalBoat(this.world.vipYacht, {
      yawOffset: Math.PI / 2,
      scaleMult: 1.0
    });
  }

  async initPlayerGlbModel() {
    this.playerGlbStatus.loading = true;
    this.playerGlbStatus.error = null;
    try {
      const res = await fetch('/api/models/lumberjack/status', { cache: 'no-store' });
      const info = await res.json();
      if (!info?.exists) {
        this.playerGlbStatus.exists = false;
        this.playerGlbStatus.loaded = false;
        this.playerGlbStatus.loading = false;
        this.playerGlbStatus.sizeBytes = 0;
        return;
      }
      this.playerGlbStatus.exists = true;
      this.playerGlbStatus.sizeBytes = info.sizeBytes || 0;
      await this.loadPlayerGlbFromUrl(info.url || '/models/lumberjack.glb', false);
    } catch (err) {
      this.playerGlbStatus.loading = false;
      this.playerGlbStatus.error = err?.message || 'Không thể kiểm tra lumberjack.glb.';
    }
  }

  async loadPlayerGlbFromUrl(url, showToast = false) {
    this.playerGlbStatus.loading = true;
    this.playerGlbStatus.progress = 0;
    this.playerGlbStatus.error = null;
    const result = await attachGlbToPlayerModel(this.playerModel, url, {
      lowSpec: this.activeProfile === 'low',
      useGlb: gameState.useGlbPlayer !== false,
      yawOffset: Number(gameState.glbPlayerYawOffset || 0),
      onProgress: (ev) => {
        const total = ev?.total || this.playerGlbStatus.sizeBytes || 0;
        if (total > 0 && ev?.loaded) {
          this.playerGlbStatus.progress = Math.min(99, Math.round((ev.loaded / total) * 100));
        }
      }
    });
    this.playerGlbStatus.loading = false;
    this.playerGlbStatus.progress = result.ok ? 100 : 0;
    if (result.ok) {
      this.playerGlbStatus.exists = true;
      this.playerGlbStatus.loaded = true;
      this.playerGlbStatus.meshCount = result.meshCount || 0;
      this.playerGlbStatus.clipNames = result.clipNames || [];
      this.playerGlbStatus.autoRigged = Boolean(result.autoRigged);
      this.playerGlbStatus.error = null;
      if (showToast) {
        const animNote = result.hasAnimations
          ? `${result.clipNames.length} clip animation`
          : result.autoRigged
            ? 'khung xương 13 khớp tự động'
            : 'chuyển động mô phỏng tự động';
        this.ui.toast(`🪵 Đã áp dụng lumberjack.glb (${result.meshCount} meshes · ${animNote})!`);
      }
    } else {
      this.playerGlbStatus.loaded = false;
      this.playerGlbStatus.error = result.error || 'Lỗi nạp lumberjack.glb.';
      if (showToast) {
        this.ui.toast(`⚠️ ${this.playerGlbStatus.error}`);
      }
    }
    if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
      this.ui.renderHub();
    }
    return result;
  }

  async uploadPlayerGlb(file) {
    if (!file) return { ok: false };
    const nameLower = String(file.name || '').toLowerCase();
    if (!nameLower.endsWith('.glb')) {
      this.ui.toast('⚠️ Vui lòng chọn file định dạng .glb (ví dụ: lumberjack.glb).');
      return { ok: false };
    }
    if (file.size > 80 * 1024 * 1024) {
      this.ui.toast('⚠️ File quá lớn (giới hạn tối đa 80 MB).');
      return { ok: false };
    }

    this.playerGlbStatus.loading = true;
    this.playerGlbStatus.error = null;
    if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
      this.ui.renderHub();
    }

    try {
      const buffer = await file.arrayBuffer();
      const resp = await fetch('/api/models/lumberjack', {
        method: 'POST',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: buffer
      });
      const data = await resp.json();
      if (!resp.ok || data.status !== 'success') {
        const msg = data?.message || 'Tải lên file lumberjack.glb thất bại.';
        this.playerGlbStatus.loading = false;
        this.playerGlbStatus.error = msg;
        this.ui.toast(`❌ ${msg}`);
        if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
          this.ui.renderHub();
        }
        return { ok: false, error: msg };
      }

      this.playerGlbStatus.exists = true;
      this.playerGlbStatus.sizeBytes = data.sizeBytes || file.size;
      gameState.useGlbPlayer = true;
      const loadRes = await this.loadPlayerGlbFromUrl(data.url || `/models/lumberjack.glb?v=${Date.now()}`, true);
      if (loadRes.ok) {
        sound.playUpgrade();
        saveGameServer();
      }
      return loadRes;
    } catch (err) {
      this.playerGlbStatus.loading = false;
      this.playerGlbStatus.error = err?.message || 'Lỗi kết nối khi tải lên file.';
      this.ui.toast(`❌ ${this.playerGlbStatus.error}`);
      if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
        this.ui.renderHub();
      }
      return { ok: false, error: this.playerGlbStatus.error };
    }
  }

  togglePlayerGlb(enabled) {
    gameState.useGlbPlayer = Boolean(enabled);
    const active = setPlayerGlbActive(this.playerModel, gameState.useGlbPlayer);
    saveGameServer();
    this.ui.toast(active ? '🪵 Đang hiển thị mô hình 3D lumberjack.glb' : '👷 Đã chuyển về mô hình nhân vật mặc định');
    if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
      this.ui.renderHub();
    }
  }

  rotatePlayerGlb() {
    const next = (Number(gameState.glbPlayerYawOffset || 0) + Math.PI / 2) % (Math.PI * 2);
    gameState.glbPlayerYawOffset = next;
    setPlayerGlbYawOffset(this.playerModel, next);
    saveGameServer();
    const deg = Math.round((next * 180) / Math.PI) % 360;
    this.ui.toast(`🧭 Đã xoay hướng mặt lumberjack.glb sang ${deg}°`);
    if (this.ui && !document.getElementById('hub-modal')?.hidden && this.ui.activeTab === 'cosmetics') {
      this.ui.renderHub();
    }
  }

  flushGpuCaches() {
    this.renderer?.renderLists?.dispose();
    this.ui.toast(`🧹 Đã dọn cache render list GPU (Geometries: ${this.renderer.info.memory.geometries})`);
  }

  bindLifecycle() {
    this._onVisibility = () => {
      if (document.hidden) {
        this.paused = true;
        cancelAnimationFrame(this.rafId);
        clearTimeout(this.rafId);
        this.keys.clear();
        this.resetJoystick();
      } else {
        this.paused = false;
        this.lastTime = performance.now();
        this.lastRenderTime = this.lastTime;
        this.scheduleNextTick();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility);

    this._onUnload = () => this.dispose();
    window.addEventListener('pagehide', this._onUnload);
    window.addEventListener('beforeunload', this._onUnload);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.paused = true;
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.rafId);

    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pagehide', this._onUnload);
    window.removeEventListener('beforeunload', this._onUnload);

    try { this.ws?.close(); } catch (e) {}

    this.archipelago?.dispose();
    if (this.world) this.world.dispose();
    if (this.playerModel?.userData?.glbMixer) {
      this.playerModel.userData.glbMixer.stopAllAction();
    }
    disposeObject3D(this.playerModel);
    disposeObject3D(this.petModel);
    disposeObject3D(this.parkedVehicle);
    disposeObject3D(this.drivableYacht);
    disposeObject3D(this.drivablePlane);
    disposeObject3D(this.drivableHeli);
    this.aiWorkers.forEach((w) => disposeObject3D(w.mesh));
    this.aiForklifts.forEach((f) => disposeObject3D(f.mesh));
    this.fishingBoats.forEach((b) => disposeObject3D(b.mesh));
    this.aiCitizens.forEach((c) => disposeObject3D(c.mesh));
    this.aiSeaYachts.forEach((y) => disposeObject3D(y.mesh));
    this.aiAirPlanes.forEach((p) => disposeObject3D(p.mesh));
    this.remotePlayers.forEach((rp) => disposeObject3D(rp.mesh));

    if (this.envRT) {
      this.envRT.dispose();
      this.envRT = null;
    }
    this.sunLight?.shadow?.map?.dispose();
    disposeAllCachedTextures();
    this.renderer?.renderLists?.dispose();
    this.renderer?.dispose();
  }

  applyBranchAtmosphere(branch) {
    this._daySkyBase.set(branch.skyColor);
    this._dayFogBase.set(branch.fogColor);
    this._skyGoldenColor.copy(this._daySkyBase).lerp(this._warmSunTint, 0.25);
    this._fogGoldenColor.copy(this._dayFogBase).lerp(this._warmSunTint, 0.22);
    if (!this.scene.background || !(this.scene.background instanceof THREE.Color)) {
      this.scene.background = new THREE.Color(branch.skyColor);
    } else {
      this.scene.background.copy(this._daySkyBase);
    }
    this.scene.fog = new THREE.FogExp2(branch.fogColor, 0.0044);
    this.world?.applyBranchTheme(branch);
  }

  rebuildPet() {
    if (this.petModel) {
      this.scene.remove(this.petModel);
      disposeObject3D(this.petModel);
      this.petModel = null;
    }
    if (gameState.equippedPet && gameState.equippedPet !== 'none') {
      this.petModel = createPetModel(gameState.equippedPet);
      this.petPos.copy(this.playerPos).add(new THREE.Vector3(-1.3, 0, 1.1));
      this.petModel.position.copy(this.petPos);
      this.scene.add(this.petModel);
    }
  }

  rebuildVehicle() {
    if (this.parkedVehicle) {
      this.scene.remove(this.parkedVehicle);
      disposeObject3D(this.parkedVehicle);
      this.parkedVehicle = null;
    }
    const type = gameState.equippedVehicle || 'forklift';
    this.parkedVehicle = createVehicleModel(type, this.activeProfile === 'low');
    this.parkedVehicle.position.copy(this.vehiclePos);
    this.parkedVehicle.rotation.y = this.vehicleYaw;
    this.scene.add(this.parkedVehicle);
  }

  rebuildWorkforce() {
    const low = this.activeProfile === 'low';
    while (this.aiWorkers.length < (gameState.lumberjacks || 0)) {
      const idx = this.aiWorkers.length;
      const mesh = createWorkerModel('lumberjack');
      const startPos = new THREE.Vector3(-82 - idx * 2.5, 0, -68 + idx * 2);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.aiWorkers.push({
        mesh,
        pos: startPos,
        state: 'to_tree',
        targetTree: null,
        timer: 0,
        carrying: false
      });
    }
    while (this.aiWorkers.length > (gameState.lumberjacks || 0)) {
      const w = this.aiWorkers.pop();
      this.scene.remove(w.mesh);
      disposeObject3D(w.mesh);
    }

    while (this.aiForklifts.length < (gameState.autoForklifts || 0)) {
      const idx = this.aiForklifts.length;
      const mesh = createVehicleModel('forklift', low);
      mesh.scale.setScalar(0.84);
      const startPos = new THREE.Vector3(-66 + idx * 2.4, 0, -34 + idx * 2.5);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.aiForklifts.push({
        mesh,
        pos: startPos,
        phase: idx * 1.5,
        toHarbor: true,
        carrying: false
      });
    }
    while (this.aiForklifts.length > (gameState.autoForklifts || 0)) {
      const f = this.aiForklifts.pop();
      this.scene.remove(f.mesh);
      disposeObject3D(f.mesh);
    }

    const targetBoats = Math.max(1, gameState.fishingBoats || 0);
    while (this.fishingBoats.length < targetBoats) {
      const idx = this.fishingBoats.length;
      const mesh = createFishingBoatModel(idx);
      this.scene.add(mesh);
      this.fishingBoats.push({
        mesh,
        angle: idx * 1.7,
        radiusX: 16 + idx * 5,
        radiusZ: 9 + idx * 3.5,
        centerX: -14,
        centerZ: 46 + idx * 3
      });
    }
    while (this.fishingBoats.length > targetBoats) {
      const b = this.fishingBoats.pop();
      this.scene.remove(b.mesh);
      disposeObject3D(b.mesh);
    }
  }

  rebuildAirSeaFleet() {
    const low = this.activeProfile === 'low';

    // Drivable Boat / Yacht (always available from coastal fishing piers even at Tier 0)
    if (this.drivableYacht) {
      this.scene.remove(this.drivableYacht);
      disposeObject3D(this.drivableYacht);
      this.drivableYacht = null;
    }
    {
      const yTier = Math.max(1, gameState.yachtTier || 0);
      this.drivableYacht = createDrivableYachtModel(yTier, low);
      this.drivableYacht.visible = this.controlMode === 'yacht';
      if (this.controlMode === 'yacht') {
        this.drivableYacht.position.copy(this.playerPos);
        this.drivableYacht.rotation.y = this.playerYaw;
      }
      this.scene.add(this.drivableYacht);
      attachGlbToPersonalBoat(this.drivableYacht, {
        yawOffset: 0,
        scaleMult: (gameState.yachtTier || 0) >= 1 ? (0.92 + yTier * 0.08) : 0.92
      });
      if ((gameState.yachtTier || 0) >= 1) {
        this.ensureDockedPersonalBoatGlb();
      }
    }

    // Drivable Airplane parked on Runway (or active in flight)
    if (this.drivablePlane) {
      this.scene.remove(this.drivablePlane);
      disposeObject3D(this.drivablePlane);
      this.drivablePlane = null;
    }
    const hasPlane = (gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    if (hasPlane) {
      this.drivablePlane = createAirplaneModel(gameState.equippedPlane || 'bush_plane', low);
      if (this.controlMode === 'plane') {
        this.drivablePlane.position.copy(this.playerPos);
        this.drivablePlane.rotation.y = this.playerYaw;
      } else {
        this.drivablePlane.position.copy(ZONES.runwayStart);
        this.drivablePlane.rotation.set(0, Math.PI, 0);
      }
      this.scene.add(this.drivablePlane);
    }

    // Drivable VIP Executive Helicopter parked on Helipad (or active in flight)
    if (this.drivableHeli) {
      this.scene.remove(this.drivableHeli);
      disposeObject3D(this.drivableHeli);
      this.drivableHeli = null;
    }
    if ((gameState.heliTier || 0) >= 1) {
      const hLiv = getLiveryData(gameState.heliLivery || 'carbon_gold');
      this.drivableHeli = createHelicopterModel(gameState.heliTier || 1, low, hLiv);
      if (this.controlMode === 'heli') {
        this.drivableHeli.position.copy(this.playerPos);
        this.drivableHeli.rotation.y = this.playerYaw;
      } else {
        this.drivableHeli.position.set(ZONES.helipad.x, 0.25, ZONES.helipad.z);
        this.drivableHeli.rotation.set(0, -Math.PI * 0.25, 0);
      }
      this.scene.add(this.drivableHeli);
    }

    // Automated Passive Sea Fleet (0-3 yachts patrolling bay)
    const targetSeaAi = Math.min(3, gameState.autoSeaFleet || 0);
    while (this.aiSeaYachts.length < targetSeaAi) {
      const idx = this.aiSeaYachts.length;
      const mesh = createDrivableYachtModel(2, true);
      mesh.scale.setScalar(0.76);
      if (mesh.userData?.deckLight) mesh.userData.deckLight.visible = false;
      this.scene.add(mesh);
      this.aiSeaYachts.push({
        mesh,
        angle: idx * 2.1,
        centerX: 12,
        centerZ: 68,
        radiusX: 34 + idx * 9,
        radiusZ: 18 + idx * 6
      });
    }
    while (this.aiSeaYachts.length > targetSeaAi) {
      const y = this.aiSeaYachts.pop();
      this.scene.remove(y.mesh);
      disposeObject3D(y.mesh);
    }

    // Automated Passive Air Fleet (0-3 cargo planes circling East bay & island)
    const targetAirAi = Math.min(3, gameState.autoAirFleet || 0);
    while (this.aiAirPlanes.length < targetAirAi) {
      const idx = this.aiAirPlanes.length;
      const mesh = createAirplaneModel(idx % 2 === 0 ? 'cargo_twin' : 'bush_plane', true);
      mesh.scale.setScalar(0.8);
      this.scene.add(mesh);
      this.aiAirPlanes.push({
        mesh,
        angle: idx * 2.05,
        altitude: 18 + idx * 4.2,
        centerX: 28,
        centerZ: 45,
        radiusX: 40 + idx * 8,
        radiusZ: 50 + idx * 8
      });
    }
    while (this.aiAirPlanes.length > targetAirAi) {
      const p = this.aiAirPlanes.pop();
      this.scene.remove(p.mesh);
      disposeObject3D(p.mesh);
    }

    this.applyFleetLiveries();
  }

  applyFleetLiveries() {
    const yLiv = getLiveryData(gameState.yachtLivery || 'pearl_sky');
    const pLiv = getLiveryData(gameState.planeLivery || 'pearl_sky');
    const hLiv = getLiveryData(gameState.heliLivery || 'carbon_gold');
    if (this.drivableYacht) applyLiveryToModel(this.drivableYacht, yLiv, false);
    if (this.world?.vipYacht) applyLiveryToModel(this.world.vipYacht, yLiv, false);
    for (const y of this.aiSeaYachts) applyLiveryToModel(y.mesh, yLiv, false);

    if (this.drivablePlane) applyLiveryToModel(this.drivablePlane, pLiv, true);
    for (const p of this.aiAirPlanes) applyLiveryToModel(p.mesh, pLiv, true);
    if (this.drivableHeli) applyLiveryToModel(this.drivableHeli, hLiv, true);
  }

  handleUpgradeEffect(id) {
    if (id === 'lumberjacks' || id === 'autoForklifts' || id === 'fishingBoats') {
      this.rebuildWorkforce();
    }
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    for (const pad of this.world.arcadePads) {
      this.world.refreshArcadePad(pad, true);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Cross-Platform Inputs (Keyboard, Mouse Orbit, Touch Virtual Joystick)
  // -------------------------------------------------------------------------
  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.archipelago.dialog.open) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      const code = e.code;
      this.keys.add(code);

      if (code === 'Escape') {
        document.getElementById('hub-modal').hidden = true;
        document.getElementById('account-modal').hidden = true;
        document.getElementById('leaderboard-modal').hidden = true;
        const shiftEl = document.getElementById('shift-modal');
        if (shiftEl) shiftEl.hidden = true;
        const notifEl = document.getElementById('notif-drawer');
        if (notifEl) notifEl.hidden = true;
        return;
      }
      if (code === 'KeyH') {
        this.ui.toggleDock();
        return;
      }
      if (code === 'KeyZ') {
        this.ui.toggleZenHud();
        return;
      }
      if (code === 'KeyB') {
        const hub = document.getElementById('hub-modal');
        if (hub.hidden) this.ui.openHub('upgrades');
        else hub.hidden = true;
        return;
      }
      if (code === 'KeyF') {
        const hub = document.getElementById('hub-modal');
        if (hub.hidden || this.ui.activeTab !== 'finance') this.ui.openHub('finance');
        else hub.hidden = true;
        return;
      }
      if (code === 'KeyR') {
        this.ui.activateBoost();
        return;
      }
      if (code === 'KeyV') {
        this.cycleCameraMode();
        return;
      }
      if (code === 'KeyT') {
        this.triggerTrainBoost();
        return;
      }
      if (code === 'KeyG') {
        if (!this.ui.isAnyModalOpen()) this.cyclePlayerGesture();
        return;
      }
      if (code === 'Digit1' && !this.ui.isAnyModalOpen()) {
        this.triggerPlayerAction('wave');
        return;
      }
      if (code === 'Digit2' && !this.ui.isAnyModalOpen()) {
        this.triggerPlayerAction('stretch');
        return;
      }
      if (code === 'Digit3' && !this.ui.isAnyModalOpen()) {
        this.triggerPlayerAction('cheer');
        return;
      }
      if (code === 'Digit4' && !this.ui.isAnyModalOpen()) {
        this.triggerPlayerAction('command');
        return;
      }
      if (code === 'KeyF') {
        if (!this.ui.isAnyModalOpen()) {
          this.hireOrToggleYardDriver();
        }
        return;
      }
      const isAircraft = this.controlMode === 'plane' || this.controlMode === 'heli';
      if (code === 'KeyE' || (code === 'Space' && !isAircraft)) {
        if (!this.ui.isAnyModalOpen()) {
          e.preventDefault();
          if (code === 'Space' && this.controlMode === 'foot') {
            const prompt = this.getContextPromptState();
            if (prompt && prompt.key === 'SPACE') {
              this.handleContextAction(true);
            } else {
              this.triggerPlayerJump();
            }
          } else {
            this.handleContextAction(code === 'Space');
          }
        }
      } else if (code === 'Space' && isAircraft && !this.ui.isAnyModalOpen()) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.resetJoystick();
      this.orbitActiveId = null;
    });

    const canvas = this.renderer.domElement;
    const joyBase = document.getElementById('virtual-joystick-base');
    const joyStick = document.getElementById('virtual-joystick-stick');

    canvas.addEventListener('pointerdown', (e) => {
      if (this.ui.isAnyModalOpen()) return;
      const isOrbit = e.button === 2
        || (e.button === 0 && e.clientX > window.innerWidth * 0.45 && e.pointerType !== 'mouse')
        || (e.button === 0 && e.pointerType === 'mouse' && e.shiftKey)
        || (e.button === 0 && e.pointerType === 'mouse' && e.clientX > window.innerWidth * 0.42);

      if (isOrbit) {
        this.orbitActiveId = e.pointerId;
        this.orbitLast.x = e.clientX;
        this.orbitLast.y = e.clientY;
      } else if (e.button === 0 && this.joyActiveId === null) {
        this.joyActiveId = e.pointerId;
        this.joyOrigin.x = e.clientX;
        this.joyOrigin.y = e.clientY;
        if (joyBase) {
          joyBase.style.display = 'block';
          joyBase.style.left = `${e.clientX}px`;
          joyBase.style.top = `${e.clientY}px`;
        }
        if (joyStick) {
          joyStick.style.transform = 'translate(-50%, -50%)';
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.orbitActiveId) {
        const dx = e.clientX - this.orbitLast.x;
        const dy = e.clientY - this.orbitLast.y;
        this.orbitLast.x = e.clientX;
        this.orbitLast.y = e.clientY;
        this.camYaw -= dx * 0.0065;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.0055, 0.25, 1.18);
      } else if (e.pointerId === this.joyActiveId) {
        const dx = e.clientX - this.joyOrigin.x;
        const dy = e.clientY - this.joyOrigin.y;
        const maxR = 44;
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, maxR);
        const angle = Math.atan2(dy, dx);
        const nx = dist > 4 ? (Math.cos(angle) * clamped) / maxR : 0;
        const ny = dist > 4 ? (Math.sin(angle) * clamped) / maxR : 0;
        this.joyVec.x = nx;
        this.joyVec.y = ny;
        if (joyStick) {
          joyStick.style.transform = `translate(calc(-50% + ${nx * maxR}px), calc(-50% + ${ny * maxR}px))`;
        }
      }
    });

    const endPointer = (e) => {
      if (e.pointerId === this.orbitActiveId) this.orbitActiveId = null;
      if (e.pointerId === this.joyActiveId) this.resetJoystick();
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (e) => {
      this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.015, 9, 32);
    }, { passive: true });
  }

  resetJoystick() {
    this.joyActiveId = null;
    this.joyVec.x = 0;
    this.joyVec.y = 0;
    const joyBase = document.getElementById('virtual-joystick-base');
    if (joyBase) joyBase.style.display = 'none';
  }

  // -------------------------------------------------------------------------
  // 4. Contextual Interactions (Land Vehicles, Yachts, Airplanes, Helicopter, Train, Harbor)
  // -------------------------------------------------------------------------
  findNearestYardVehicle(maxDist = 7.2) {
    const list = this.world?.yardVehicles || [];
    let best = null;
    let bestD = maxDist;
    for (const v of list) {
      const d = Math.hypot(this.playerPos.x - v.pos.x, this.playerPos.z - v.pos.z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  findNearestBoatDock(maxDist = 11.0) {
    let bestDock = null;
    let bestD = maxDist;
    for (const dock of FISHING_PIER_DOCKS) {
      const d = Math.hypot(this.playerPos.x - dock.pierX, this.playerPos.z - dock.pierZ);
      if (d < bestD) {
        bestD = d;
        bestDock = dock;
      }
    }
    let bestMoored = null;
    let bestMooredD = maxDist + 2.5;
    for (const b of this.world?.mooredFishingBoats || []) {
      if (!b.group.visible) continue;
      const d = Math.hypot(this.playerPos.x - b.x, this.playerPos.z - b.z);
      if (d < bestMooredD) {
        bestMooredD = d;
        bestMoored = b;
      }
    }
    if (!bestDock && bestMoored) {
      bestDock = FISHING_PIER_DOCKS.find((d) => d.id === bestMoored.pierId) || FISHING_PIER_DOCKS[1];
    }
    if (!bestDock) return null;
    if (!bestMoored) {
      bestMoored = (this.world?.mooredFishingBoats || []).find((b) => b.pierId === bestDock.id && b.group.visible) || null;
    }
    return { dock: bestDock, mooredBoat: bestMoored };
  }

  syncYardVehicleDrivers() {
    const saved = gameState.yardDrivers || {};
    for (const v of this.world?.yardVehicles || []) {
      const hired = Boolean(saved[v.id]);
      v.driverHired = hired;
      if (v.driverVisual) v.driverVisual.visible = hired;
      if (v.cargoVisual) v.cargoVisual.visible = v.cargoWood > 0;
      if (hired && v.state === 'parked') {
        if (v.cargoWood <= 0) v.cargoWood = Math.max(4, Math.floor(v.cargoCapacity * 0.7));
        if (v.cargoVisual) v.cargoVisual.visible = true;
        v.state = 'delivering';
        v.wpIdx = 0;
      }
    }
  }

  quickBoardYardTruck() {
    if (this.controlMode === 'yard_vehicle') {
      this.exitYardVehicle();
      return;
    }
    if (this.controlMode !== 'foot') {
      this.ui.toast('Hãy rời phương tiện hiện tại (Phím E) trước khi lên xe gỗ.');
      return;
    }
    const list = this.world?.yardVehicles || [];
    if (!list.length) return;
    // Prefer nearest vehicle, or first timber truck in Logging Zone
    let chosen = this.findNearestYardVehicle(12);
    if (!chosen) {
      chosen = list.find((v) => v.kind === 'truck' && !v.driverHired) || list.find((v) => v.kind === 'truck') || list[0];
    }
    this.boardYardVehicle(chosen);
  }

  boardYardVehicle(v) {
    if (!v) return;
    if (this.controlMode !== 'foot') {
      this.ui.toast('Hãy xuống phương tiện hiện tại trước (Phím E).');
      return;
    }
    this.activeYardVehicle = v;
    v.state = 'player';
    this.controlMode = 'yard_vehicle';
    this.vehicleSpeed = 0;
    this.playerPos.set(v.pos.x, 0, v.pos.z);
    this.playerYaw = v.yaw;
    this.playerModel.visible = false;
    if (this.petModel) this.petModel.visible = false;
    if (v.groundRing) v.groundRing.visible = false;

    // Auto-load timber if parked inside Logging Zone
    if (
      v.cargoWood < v.cargoCapacity &&
      v.pos.x >= MAP_ZONES.logging.minX && v.pos.x <= MAP_ZONES.logging.maxX &&
      v.pos.z >= MAP_ZONES.logging.minZ && v.pos.z <= MAP_ZONES.logging.maxZ
    ) {
      this.loadWoodIntoYardVehicle(v, false);
    }

    sound.playUpgrade();
    this.ui.toast(`🚛 Đang lái ${v.name}! Chở gỗ sang Khu Dân Cư, Khu Hạ Tầng hoặc Bến Tàu Cá · Phím F thuê tài xế AI!`);
  }

  exitYardVehicle() {
    const v = this.activeYardVehicle;
    if (!v) {
      this.controlMode = 'foot';
      return;
    }
    // Place player safely beside vehicle on land
    const sideX = Math.cos(v.yaw) * 2.9;
    const sideZ = -Math.sin(v.yaw) * 2.9;
    this.playerPos.set(
      THREE.MathUtils.clamp(v.pos.x + sideX, WORLD_BOUNDS.minX + 2, WORLD_BOUNDS.maxX - 2),
      0,
      THREE.MathUtils.clamp(v.pos.z + sideZ, WORLD_BOUNDS.minZ + 2, LAND_EDGE_Z - 1.5)
    );
    if (v.groundRing) v.groundRing.visible = true;
    this.activeYardVehicle = null;
    this.controlMode = 'foot';
    this.vehicleSpeed = 0;
    this.playerModel.position.copy(this.playerPos);
    this.playerModel.visible = true;
    if (this.petModel) this.petModel.visible = true;

    if (v.driverHired) {
      v.state = v.cargoWood > 0 ? 'delivering' : 'returning';
      v.wpIdx = 0;
      this.ui.toast(`🤖 Tài xế AI đã tiếp quản ${v.name} để tiếp tục giao gỗ!`);
    } else {
      v.state = 'parked';
      this.ui.toast(`Đã xuống ${v.name}. Nhấn E để lái lại hoặc F để thuê tài xế AI.`);
    }
    this.ui.updateVehicleHud({ mode: 'foot' });
  }

  hireOrToggleYardDriver(explicitVehicle = null) {
    const v = explicitVehicle || this.activeYardVehicle || this.findNearestYardVehicle(10.5);
    if (!v) {
      this.ui.toast('Hãy đứng gần xe tải/xe nâng trong Xưởng Gỗ (hoặc đang lái xe) rồi nhấn F để thuê tài xế!');
      return;
    }
    if (!v.driverHired) {
      if (gameState.cash < v.driverCost) {
        this.ui.toast(`Cần $${v.driverCost.toLocaleString()} để thuê tài xế AI lái ${v.name}!`);
        return;
      }
      gameState.cash -= v.driverCost;
      v.driverHired = true;
      if (!gameState.yardDrivers) gameState.yardDrivers = {};
      gameState.yardDrivers[v.id] = true;
      if (v.driverVisual) v.driverVisual.visible = true;
      if (v.cargoWood <= 0) this.loadWoodIntoYardVehicle(v, true);
      sound.playUpgrade();
      this.world.spawnParticles(v.pos, 0x38bdf8, 8);
      saveGameServer();

      if (this.activeYardVehicle === v) {
        this.exitYardVehicle();
      } else {
        v.state = 'delivering';
        v.wpIdx = 0;
      }
      const drop = DELIVERY_DROPOFFS[v.targetIdx % DELIVERY_DROPOFFS.length];
      this.ui.toast(`👷 Đã thuê tài xế lái ${v.name}! Xe đang tự chạy giao gỗ tới ${drop.name}!`);
      this.ui.refreshHUD();
      return;
    }

    // Driver already hired
    if (this.activeYardVehicle === v) {
      this.exitYardVehicle();
      return;
    }
    v.targetIdx = (v.targetIdx + 1) % DELIVERY_DROPOFFS.length;
    v.state = v.cargoWood > 0 ? 'delivering' : 'returning';
    v.wpIdx = 0;
    const nextDrop = DELIVERY_DROPOFFS[v.targetIdx];
    this.ui.toast(`🚛 Đã đổi tuyến ${v.name} sang giao gỗ tại ${nextDrop.name}!`);
  }

  loadWoodIntoYardVehicle(v, isAi = false) {
    const space = v.cargoCapacity - v.cargoWood;
    if (space <= 0) return;
    let loaded = 0;
    // Use processed planks first for premium payout, then logs, then yard timber stock so trucks never sit idle
    if (gameState.planks > 0) {
      const take = Math.min(space, gameState.planks);
      gameState.planks -= take;
      loaded += take;
    }
    if (loaded < space && gameState.logs > 0 && !isAi) {
      const take = Math.min(space - loaded, gameState.logs);
      gameState.logs -= take;
      loaded += take;
    }
    // Top up remaining truck capacity from Logging Yard timber stacks
    const fromYard = space - loaded;
    v.cargoWood = v.cargoCapacity;
    v.premiumLoad = loaded > 0;
    if (v.cargoVisual) v.cargoVisual.visible = true;
    if (!isAi) {
      this.spawnWorldText(v.pos, `🪵 Đã chất ${v.cargoWood} gỗ lên ${v.name}!`, 'gem');
      this.world.spawnParticles(v.pos, 0xf59e0b, 5);
    }
    if (fromYard > 0 && loaded > 0) {
      this.syncSawmillVisuals();
    }
  }

  completeYardWoodDelivery(v, dropoff, isAi = false) {
    if (!v || v.cargoWood <= 0) return;
    const basePerUnit = v.premiumLoad ? 42 : 28;
    const earn = Math.round(v.cargoWood * basePerUnit * dropoff.mult * getRevenueMultiplier());
    gameState.cash += earn;
    gameState.yardDeliveriesCompleted = (gameState.yardDeliveriesCompleted || 0) + 1;
    recordRevenue('sawmill', earn);
    addVipXp(isAi ? 6 : 14);
    addSeasonXp(isAi ? 5 : 12);
    v.cargoWood = 0;
    v.premiumLoad = false;
    if (v.cargoVisual) v.cargoVisual.visible = false;

    this.world.spawnParticles(new THREE.Vector3(dropoff.x, 1.2, dropoff.z), dropoff.color, isAi ? 4 : 8);
    this.spawnWorldText(
      new THREE.Vector3(dropoff.x, 2.2, dropoff.z),
      `${isAi ? '🤖' : '🚛'} +$${earn.toLocaleString()} (${dropoff.shortName})`,
      'cash'
    );
    if (!isAi) {
      sound.playCash();
      this.ui.toast(`✅ Đã giao gỗ tại ${dropoff.name}! Thu về +$${earn.toLocaleString()} — Quay về Xưởng Gỗ để chất thêm!`);
      saveGameServer();
    }
  }

  getContextPromptState() {
    if (this.controlMode === 'yard_vehicle' && this.activeYardVehicle) {
      const v = this.activeYardVehicle;
      const driverHint = v.driverHired ? 'F: Giao tài xế AI' : `F: Thuê tài xế ($${v.driverCost})`;
      return { action: 'exit_yard_vehicle', key: 'E', label: `Xuống ${v.name} · ${driverHint}` };
    }
    if (this.vehicleHome) {
      if (this.controlMode === 'yacht') {
        const nearPier = FISHING_PIER_DOCKS.find(
          (d) => Math.hypot(this.playerPos.x - d.pierX, this.playerPos.z - d.seaZ) < 18
        );
        if (nearPier) {
          return { action: 'disembark', key: 'E', label: `Cập bến & Lên ${nearPier.name}` };
        }
      }
      return { action: 'disembark', key: 'E', label: this.getParkingStatus().label };
    }

    const station = findRegionalStation(this.playerPos);
    if (station) {
      const labels = { land: 'xe', yacht: 'du thuyền', plane: 'máy bay', heli: 'trực thăng' };
      return { action: 'regional_vehicle', key: 'E', label: 'Nhận ' + labels[station.mode] + ' tại ' + station.name, station };
    }

    // Check interactive Logging Yard Trucks & Forklifts first
    const nearYardVeh = this.findNearestYardVehicle(7.2);
    if (nearYardVeh) {
      const driverTag = nearYardVeh.driverHired
        ? ' · F: Đổi tuyến AI'
        : ` · F: Thuê tài xế ($${nearYardVeh.driverCost})`;
      return {
        action: 'board_yard_vehicle',
        key: 'E',
        label: `Lái ${nearYardVeh.name}${driverTag}`,
        yardVehicle: nearYardVeh
      };
    }

    // Check all 3 Coastal Fishing Boat Piers & moored boats (always drivable!)
    const nearBoat = this.findNearestBoatDock(10.5);
    if (nearBoat) {
      const boatName = (gameState.yachtTier || 0) >= 1 ? 'Du thuyền' : 'Tàu cá';
      return {
        action: 'board_yacht',
        key: 'E',
        label: `Lái ${boatName} tại ${nearBoat.dock.name}`,
        boatDock: nearBoat.dock,
        mooredBoat: nearBoat.mooredBoat
      };
    }

    const distToHarbor = this.playerPos.distanceTo(ZONES.harborExport);
    const distToSawOut = this.playerPos.distanceTo(ZONES.sawOutput);
    const distToFurniture = this.playerPos.distanceTo(ZONES.furnitureMill);
    const distToVeh = this.playerPos.distanceTo(this.vehiclePos);
    const distToRunway = this.playerPos.distanceTo(ZONES.runwayStart);
    const distToHelipad = ZONES.helipad ? this.playerPos.distanceTo(ZONES.helipad) : 999;
    const distToRailDepot = ZONES.railDepot ? this.playerPos.distanceTo(ZONES.railDepot) : 999;

    if (distToHarbor < 4.5 && (gameState.planks > 0 || gameState.pallets > 0 || gameState.cannedFish > 0)) {
      return { action: 'export', key: 'SPACE', label: 'Xuất khẩu Hợp đồng Cảng' };
    }
    if (distToFurniture < 4.2 && (gameState.furniture || 0) > 0) {
      return { action: 'sell_furniture', key: 'SPACE', label: 'Bán nhanh Nội thất Xuất khẩu' };
    }
    if (distToSawOut < 4.2 && (gameState.planks > 0 || gameState.pallets > 0)) {
      return { action: 'sell_saw', key: 'SPACE', label: 'Bán nhanh Ván & Pallet' };
    }
    if (distToRailDepot < 4.2 && (gameState.railwayTier || 0) >= 1) {
      return { action: 'train_express', key: 'SPACE', label: 'Kéo Còi & Tăng Tốc Tàu Hỏa' };
    }
    if (this.inVehicle) {
      return { action: 'vehicle', key: 'E', label: 'Xuống xe' };
    }
    if (distToHelipad < 4.8 && (gameState.heliTier || 0) >= 1) {
      return { action: 'board_heli', key: 'E', label: 'Lên Lái Trực Thăng VIP' };
    }
    if (distToRunway < 4.8 && (gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0) {
      return { action: 'board_plane', key: 'E', label: 'Lên Máy bay cất cánh' };
    }
    if (distToVeh < 4.5) {
      const veh = VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
      return { action: 'vehicle', key: 'E', label: `Lái ${veh.name}` };
    }
    const nearHouse = this.findNearestWoodenHouse(5.8);
    if (nearHouse) {
      let houseLabel = '';
      if (!nearHouse.ready) {
        houseLabel = `${nearHouse.icon} ${nearHouse.name}: Đang ${nearHouse.role.toLowerCase()} (còn ${Math.ceil(nearHouse.timer)}s)`;
      } else if (nearHouse.taskType === 'deliver_wood') {
        const gemTag = nearHouse.rewardGems ? ` +${nearHouse.rewardGems}💎` : '';
        houseLabel = `${nearHouse.icon} ${nearHouse.name}: Giao ${nearHouse.reqPlanks} ván/gỗ → +$${nearHouse.rewardCash}${gemTag}`;
      } else if (nearHouse.taskType === 'buff_work') {
        houseLabel = `${nearHouse.icon} ${nearHouse.name}: ${nearHouse.role} (+$${nearHouse.rewardCash} & Tăng tốc ${nearHouse.boostSec}s)`;
      } else {
        const bonusParts = [];
        if (nearHouse.rewardGems) bonusParts.push(`+${nearHouse.rewardGems}💎`);
        if (nearHouse.bonusLogs) bonusParts.push(`+${nearHouse.bonusLogs}🪵`);
        if (nearHouse.bonusPlanks) bonusParts.push(`+${nearHouse.bonusPlanks}📦`);
        if (nearHouse.bonusCanned) bonusParts.push(`+${nearHouse.bonusCanned}🥫`);
        const extraTag = bonusParts.length ? ` ${bonusParts.join(' ')}` : '';
        houseLabel = `${nearHouse.icon} ${nearHouse.name}: ${nearHouse.role} (+$${nearHouse.rewardCash}${extraTag})`;
      }
      return { action: 'wooden_house', key: 'E', label: houseLabel, house: nearHouse };
    }
    const nearCitizen = this.findNearestCitizen(3.6);
    if (nearCitizen) {
      const tipTag = nearCitizen.hasTip ? ' · Nhận Tip 💰' : '';
      return { action: 'greet_citizen', key: 'G', label: `Chào ${nearCitizen.arch.name}${tipTag}` };
    }
    return null;
  }

  findNearestWoodenHouse(maxDist = 5.8) {
    const houses = this.world?.woodenHouses || [];
    let best = null;
    let bestDist = maxDist;
    for (const h of houses) {
      const dPorch = Math.hypot(this.playerPos.x - h.porchPos.x, this.playerPos.z - h.porchPos.z);
      const dCenter = Math.hypot(this.playerPos.x - h.x, this.playerPos.z - h.z) - 2.2;
      const d = Math.min(dPorch, Math.max(0, dCenter));
      if (d < bestDist) {
        bestDist = d;
        best = h;
      }
    }
    return best;
  }

  interactWoodenHouse(h) {
    if (!h) return;
    if (!h.ready) {
      this.ui.toast(`${h.icon} ${h.name} đang ${h.role.toLowerCase()} — sẵn sàng sau ${Math.ceil(h.timer)} giây!`);
      return;
    }

    if (h.taskType === 'deliver_wood') {
      const req = h.reqPlanks || 2;
      if ((gameState.planks || 0) >= req) {
        gameState.planks -= req;
        this.syncSawmillVisuals();
      } else if ((gameState.logs || 0) >= req) {
        gameState.logs -= req;
        syncPlayerBackLogs(this.playerModel, gameState.logs);
      } else {
        this.ui.toast(`${h.icon} ${h.name} cần ${req} ván xẻ (hoặc ${req} khúc gỗ) để ${h.role.toLowerCase()}!`);
        return;
      }
    }

    const cashGain = Math.round((h.rewardCash || 180) * getRevenueMultiplier());
    gameState.cash += cashGain;
    recordRevenue('sawmill', cashGain);

    const extraParts = [];
    if (h.rewardGems) {
      gameState.gems += h.rewardGems;
      extraParts.push(`+${h.rewardGems} 💎`);
    }
    if (h.bonusLogs) {
      const cap = getBackpackCapacity();
      gameState.logs = Math.min(cap, (gameState.logs || 0) + h.bonusLogs);
      syncPlayerBackLogs(this.playerModel, gameState.logs);
      extraParts.push(`+${h.bonusLogs} 🪵`);
    }
    if (h.bonusPlanks) {
      gameState.planks = (gameState.planks || 0) + h.bonusPlanks;
      this.syncSawmillVisuals();
      extraParts.push(`+${h.bonusPlanks} 📦`);
    }
    if (h.bonusCanned) {
      gameState.cannedFish = (gameState.cannedFish || 0) + h.bonusCanned;
      extraParts.push(`+${h.bonusCanned} 🥫`);
    }
    if (h.boostSec) {
      gameState.boostTimer = Math.max(gameState.boostTimer || 0, h.boostSec);
      extraParts.push(`⚡ Tăng tốc ${h.boostSec}s`);
    }

    addVipXp(12);
    addSeasonXp(10);
    gameState.xp += 18;
    if (gameState.xp >= gameState.level * 120) gameState.level++;

    h.ready = false;
    h.timer = h.cooldown || 22;

    const fxColor = h.taskType === 'deliver_wood' ? 0xf59e0b : h.taskType === 'buff_work' ? 0x38bdf8 : 0x22c55e;
    this.world.spawnParticles(h.porchPos, fxColor, 7);
    this.spawnWorldText(
      h.porchPos,
      `${h.icon} +$${cashGain.toLocaleString()}${extraParts.length ? ' ' + extraParts[0] : ''}`,
      'cash'
    );
    sound.playCash();
    this.triggerPlayerAction('cheer', true);
    this.ui.toast(
      `${h.icon} Hoàn thành nhiệm vụ ${h.name} (${h.role}): +$${cashGain.toLocaleString()}${extraParts.length ? ' · ' + extraParts.join(' · ') : ''}!`
    );
    saveGameServer();
    this.ui.refreshHUD();
  }

  cyclePlayerGesture() {
    const order = ['wave', 'stretch', 'cheer', 'command'];
    const name = order[this.playerGestureIdx % order.length];
    this.playerGestureIdx = (this.playerGestureIdx + 1) % order.length;
    this.triggerPlayerAction(name);
  }

  triggerPlayerJump() {
    if (this.controlMode !== 'foot' || this.inVehicle) return;
    if (this.playerJumpY > 0.05) return;
    this.playerJumpVel = 7.0;
    this.world.spawnParticles(this.playerPos, 0xd6c7a9, 4);
  }

  triggerPlayerAction(actionName, silent = false) {
    if (this.controlMode !== 'foot' || this.inVehicle) return;
    const durations = { wave: 1.75, stretch: 2.05, cheer: 1.85, command: 1.65 };
    const dur = durations[actionName] || 1.7;
    this.playerAction = actionName;
    this.playerActionDuration = dur;
    this.playerActionTimer = dur;

    if (actionName === 'cheer') {
      this.world.spawnParticles(this.playerPos, 0xfbbf24, 6);
      if (!silent) {
        this.spawnWorldText(this.playerPos, '🎉 Tuyệt vời!', 'cash');
        this.ui.toast('🎉 Ăn mừng! (Phím 1: Vẫy tay · 2: Vươn vai · 3: Ăn mừng · 4: Điều phối · Space: Nhảy)');
      }
    } else if (actionName === 'wave') {
      if (!silent) {
        this.spawnWorldText(this.playerPos, '👋 Xin chào!', 'gem');
        this.ui.toast('👋 Vẫy tay chào! (Phím 1-4 để đổi cử chỉ · Space để nhảy)');
      }
    } else if (actionName === 'stretch') {
      this.world.spawnParticles(this.playerPos, 0x38bdf8, 4);
      if (!silent) {
        this.spawnWorldText(this.playerPos, '💪 Khởi động!', 'gem');
        this.ui.toast('💪 Vươn vai khởi động!');
      }
    } else if (actionName === 'command') {
      this.workerRallyTimer = 10.0;
      this.world.spawnParticles(this.playerPos, 0xf59e0b, 6);
      if (!silent) {
        this.spawnWorldText(this.playerPos, '👉 Tăng tốc công nhân!', 'cash');
        this.ui.toast('👉 Ra hiệu chỉ đạo! Công nhân bốc vác tăng tốc độ khiêng gỗ trong 10 giây!');
      }
      for (const p of this.world?.yardPorters || []) {
        if (p.state === 'rest') {
          p.state = 'to_pile';
          p.timer = 0;
        }
        this.world.spawnParticles(p.pos, 0xfbbf24, 3);
      }
    }
  }

  handleContextAction(preferSpace = false) {
    const prompt = this.getContextPromptState();
    if (!prompt) {
      if (this.controlMode === 'yard_vehicle' && !preferSpace) this.exitYardVehicle();
      else if (this.inVehicle && !preferSpace) this.toggleVehicle();
      return;
    }
    if (prompt.action === 'exit_yard_vehicle') {
      if (!preferSpace) this.exitYardVehicle();
    } else if (prompt.action === 'board_yard_vehicle') {
      if (!preferSpace) this.boardYardVehicle(prompt.yardVehicle);
    } else if (prompt.action === 'disembark') {
      if (!preferSpace) this.disembarkFleet();
    } else if (prompt.action === 'regional_vehicle') {
      if (preferSpace) return;
      const station = prompt.station;
      if (station.mode === 'land') this.toggleVehicle(station);
      else if (station.mode === 'yacht') this.boardYacht(station);
      else if (station.mode === 'plane') this.boardPlane(station);
      else this.boardHeli(station);
    }
    else if (prompt.action === 'board_yacht') this.boardYacht(null, false, prompt.boatDock, prompt.mooredBoat);
    else if (prompt.action === 'board_plane') this.boardPlane();
    else if (prompt.action === 'board_heli') this.boardHeli();
    else if (prompt.action === 'train_express') this.triggerTrainBoost();
    else if (prompt.action === 'wooden_house') this.interactWoodenHouse(prompt.house);
    else if (prompt.action === 'greet_citizen') this.greetNearbyCitizen(true);
    else if (prompt.action === 'vehicle') this.toggleVehicle();
    else if (prompt.action === 'export') this.handleDeliverContract(true);
    else if (prompt.action === 'sell_saw') this.sellAllAtSawmill();
    else if (prompt.action === 'sell_furniture') this.sellAllFurniture();
  }

  getParkingStatus() {
    if (this.controlMode === 'yard_vehicle') {
      return { ready: true, label: 'Rời xe tại vị trí hiện tại' };
    }
    return parkingStatus(this.vehicleHome, this.playerPos, this.vehicleSpeed);
  }

  selectVehicleHome(mode, station, defaultStation) {
    if (this.controlMode !== 'foot') {
      this.ui.toast(this.getParkingStatus().label);
      return null;
    }
    const home = station || findRegionalStation(this.playerPos, mode) || defaultStation;
    if (Math.hypot(this.playerPos.x - home.x, this.playerPos.z - home.z) > 4.5) {
      this.ui.toast('Hãy đến điểm nhận phương tiện để lên lái.');
      return null;
    }
    return home;
  }

  updateCheckpoint() {
    if (this.controlMode !== 'foot' || this.archipelago.dialog.open) return;
    const district = findCheckpoint(this.playerPos);
    if (!district) return;
    const current = gameState.checkpoint;
    if (current?.row === district.row && current.column === district.column) return;
    gameState.checkpoint = { row: district.row, column: district.column };
    saveGameServer();
    this.ui.toast('Đã lưu vị trí tại ' + district.name);
  }

  boardYacht(station = null, fromQuickBtn = false, boatDock = null, mooredBoat = null) {
    if (this.controlMode !== 'foot') {
      this.ui.toast('Hãy rời phương tiện hiện tại (Phím E) trước khi lái tàu.');
      return;
    }
    if (!this.drivableYacht) {
      this.rebuildAirSeaFleet();
    }

    let home;
    if (station) {
      home = this.selectVehicleHome('yacht', station, station);
      if (!home) return;
    } else {
      let dock = boatDock;
      if (!dock) {
        dock = FISHING_PIER_DOCKS.reduce((best, d) => {
          const dist = Math.hypot(this.playerPos.x - d.pierX, this.playerPos.z - d.pierZ);
          return !best || dist < best.dist ? { dock: d, dist } : best;
        }, null).dock;
      }
      const distToDock = Math.hypot(this.playerPos.x - dock.pierX, this.playerPos.z - dock.pierZ);
      if (!fromQuickBtn && distToDock > 16) {
        this.ui.toast('⛵ Hãy đi ra một trong 3 cầu gỗ ven biển để lên tàu cá (hoặc bấm nút Tàu cá)!');
        return;
      }
      home = {
        mode: 'yacht',
        x: dock.pierX,
        z: dock.pierZ,
        y: 0.05,
        parkZ: dock.seaZ,
        name: dock.name
      };
      if (!mooredBoat) {
        mooredBoat = (this.world?.mooredFishingBoats || []).find((b) => b.pierId === dock.id && b.group.visible) || null;
      }
    }

    if (mooredBoat && mooredBoat.group) {
      mooredBoat.group.visible = false;
      this.activeBoardedBoat = mooredBoat;
    } else {
      this.activeBoardedBoat = null;
    }

    this.vehicleHome = home;
    this.controlMode = 'yacht';
    this.vehicleSpeed = 0;
    this.playerPos.set(home.x, home.y, home.parkZ);
    this.playerYaw = 0;
    this.playerModel.visible = false;
    if (this.petModel) this.petModel.visible = false;
    if (this.world.vipYacht) this.world.vipYacht.visible = false;
    if (this.drivableYacht) {
      this.drivableYacht.visible = true;
      this.drivableYacht.position.copy(this.playerPos);
      this.drivableYacht.rotation.set(0, this.playerYaw, 0);
    }
    if (!fleetMissionState.sea) spawnFleetMission('sea');
    sound.playSplash();
    const label = (gameState.yachtTier || 0) >= 1 ? 'Du thuyền' : 'Tàu cá';
    this.ui.toast(`🚤 Đã rời ${home.name || 'bến'} trên ${label}! Dùng WASD/Joystick để lái · Cập cầu gỗ nhấn E để lên bờ!`);
  }

  boardPlane(station) {
    const hasPlane = (gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    if (!hasPlane) {
      this.ui.openHub('locker');
      this.ui.toast('✈️ Cần xây Đường Băng Cấp 1 & mua 1 Máy Bay trong Showroom!');
      return;
    }
    const home = this.selectVehicleHome('plane', station, { mode: 'plane', x: ZONES.runwayStart.x, z: ZONES.runwayStart.z, y: 0.25 });
    if (!home) return;
    this.vehicleHome = home;
    this.controlMode = 'plane';
    this.vehicleSpeed = 0;
    this.planePitch = 0;
    this.planeBank = 0;
    this.playerPos.set(home.x, home.y, home.z);
    this.playerYaw = Math.PI;
    this.camYaw = 0;
    this.playerModel.visible = false;
    if (this.petModel) this.petModel.visible = false;
    if (this.drivablePlane) {
      this.drivablePlane.visible = true;
      this.drivablePlane.position.copy(this.playerPos);
      this.drivablePlane.rotation.set(0, this.playerYaw, 0);
    }
    if (!fleetMissionState.air) spawnFleetMission('air');
    sound.playTakeoff();
    this.ui.toast('✈️ Đã lên buồng lái! W/Joystick tăng ga · Space / ▲ Lên để bay!');
  }

  boardHeli(station) {
    if ((gameState.heliTier || 0) <= 0) {
      this.ui.openHub('locker');
      this.ui.toast('🚁 Hãy mở khóa Bãi Đáp & Trực Thăng VIP Cấp 1 trong Showroom Hạm đội!');
      return;
    }
    const home = this.selectVehicleHome('heli', station, { mode: 'heli', x: ZONES.helipad.x, z: ZONES.helipad.z, y: 0.35 });
    if (!home) return;
    this.vehicleHome = home;
    this.controlMode = 'heli';
    this.cameraMode = 'follow';
    this.vehicleSpeed = 0;
    this.heliPitch = 0;
    this.heliBank = 0;
    this.playerPos.set(home.x, home.y, home.z);
    this.playerYaw = -Math.PI * 0.25;
    this.playerModel.visible = false;
    if (this.petModel) this.petModel.visible = false;
    if (this.drivableHeli) {
      this.drivableHeli.visible = true;
      this.drivableHeli.position.copy(this.playerPos);
      this.drivableHeli.rotation.set(0, this.playerYaw, 0);
    }
    if (!fleetMissionState.air) spawnFleetMission('air');
    sound.playHeliRotor();
    this.triggerScreenShake(0.18);
    this.ui.toast('🚁 Cất cánh Trực Thăng VIP! Space/▲ bay cao · WASD/Joystick bay lượn 360°!');
  }

  triggerTrainBoost() {
    if ((gameState.railwayTier || 0) <= 0) {
      this.ui.openHub('upgrades');
      this.ui.toast('🚂 Hãy xây dựng Tuyến Đường Sắt Công Nghiệp Cấp 1 trong mục Công trình!');
      return false;
    }
    const res = triggerTrainExpressBoost();
    if (!res.ok) {
      this.ui.toast(res.reason);
      return false;
    }
    sound.playTrainHorn();
    sound.playTrainChug();
    this.triggerScreenShake(0.22);
    if (ZONES.railDepot) {
      this.world.spawnParticles(ZONES.railDepot, 0xf59e0b, 6);
      this.spawnWorldText(ZONES.railDepot, `🚂 +$${res.instantCash.toLocaleString()} Tốc Hành!`, 'cash');
    }
    saveGameServer();
    this.ui.refreshHUD();
    this.ui.toast(`🚂 Tàu Hỏa Tốc Hành! Nhận ngay +$${res.instantCash.toLocaleString()} & Tăng tốc 25s!`);
    return true;
  }

  cycleWeatherPreset() {
    const order = ['auto', 'dawn', 'sunny', 'sunset', 'night', 'storm'];
    const cur = gameState.weatherMode || 'auto';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    gameState.weatherMode = next;
    const preset = WEATHER_PRESETS[next] || WEATHER_PRESETS.auto;
    if (typeof preset.hour === 'number') {
      gameState.worldClockHours = preset.hour;
    }
    sound.playCameraShutter();
    saveGameLocal();
    this.ui.refreshHUD();
    this.ui.toast(`${preset.icon} Chế độ Thời tiết & Ánh sáng: ${preset.label}`);
  }

  cycleCameraMode() {
    const modes = ['follow', 'tactical', 'orbit', 'train'];
    const labels = {
      follow: '🎥 Góc máy: Theo chân Chủ tịch',
      tactical: '🦅 Góc máy: Toàn cảnh Chiến thuật (RTS)',
      orbit: '🎬 Góc máy: Điện ảnh Quay chậm 360°',
      train: '🚂 Góc máy: Hành trình Tàu Hỏa Cảng Biển'
    };
    let nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    if (modes[nextIdx] === 'train' && (gameState.railwayTier || 0) <= 0) {
      nextIdx = (nextIdx + 1) % modes.length;
    }
    this.cameraMode = modes[nextIdx];
    sound.playCameraShutter();
    this.ui.refreshHUD();
    this.ui.toast(labels[this.cameraMode]);
  }

  triggerScreenShake(intensity = 0.2) {
    if (this.activeProfile === 'low') return;
    this.screenShake = Math.min(0.45, Math.max(this.screenShake, intensity));
  }

  disembarkFleet() {
    if (this.controlMode === 'yard_vehicle') {
      this.exitYardVehicle();
      return;
    }
    const home = this.vehicleHome;
    if (!home) return;

    if (home.mode === 'yacht') {
      // Allow smooth docking at ANY of the 3 coastal wooden fishing piers or original berth
      let dockTarget = null;
      for (const d of FISHING_PIER_DOCKS) {
        if (Math.hypot(this.playerPos.x - d.pierX, this.playerPos.z - d.seaZ) < 18) {
          dockTarget = { x: d.pierX, y: 0.62, z: d.pierZ, name: d.name };
          break;
        }
      }
      if (!dockTarget && Math.hypot(this.playerPos.x - home.x, this.playerPos.z - (home.parkZ ?? home.z)) < 16) {
        dockTarget = { x: home.x, y: home.z > LAND_EDGE_Z ? 0.62 : 0, z: home.z, name: home.name || 'Cầu Tàu Cá' };
      }
      if (!dockTarget) {
        const nearest = FISHING_PIER_DOCKS.reduce((best, d) => {
          const dist = Math.hypot(this.playerPos.x - d.pierX, this.playerPos.z - d.seaZ);
          return !best || dist < best.dist ? { d, dist } : best;
        }, null);
        this.ui.toast(`⛵ Hãy lái tàu lại gần ${nearest.d.name} (còn ${Math.ceil(nearest.dist)}m) để cập bến lên bờ!`);
        return;
      }
      if (this.drivableYacht) this.drivableYacht.visible = false;
      if (this.activeBoardedBoat?.group) {
        this.activeBoardedBoat.group.visible = true;
        this.activeBoardedBoat = null;
      }
      this.world.syncYachtTier(gameState.yachtTier || 0);
      this.playerPos.set(dockTarget.x, dockTarget.y, dockTarget.z);
      sound.playSplash();
      this.controlMode = 'foot';
      this.vehicleHome = null;
      this.vehicleSpeed = 0;
      this.playerModel.position.copy(this.playerPos);
      this.playerModel.visible = true;
      if (this.petModel) this.petModel.visible = true;
      this.ui.toast(`⚓ Đã neo đậu tàu và bước lên ${dockTarget.name}!`);
      this.ui.updateVehicleHud({ mode: 'foot' });
      return;
    }

    const parking = this.getParkingStatus();
    if (!parking.ready) {
      this.ui.toast(parking.label);
      return;
    }

    if (home.mode === 'land') {
      this.vehiclePos.set(home.name ? ZONES.vehicleSpawn.x : home.x, 0, home.name ? ZONES.vehicleSpawn.z : home.z);
      this.vehicleYaw = this.playerYaw;
      this.parkedVehicle.position.copy(this.vehiclePos);
      this.parkedVehicle.rotation.y = this.vehicleYaw;
      this.inVehicle = false;
    } else {
      const aircraft = home.mode === 'heli' ? this.drivableHeli : this.drivablePlane;
      if (aircraft) {
        if (home.name) {
          const hangar = home.mode === 'heli' ? ZONES.helipad : ZONES.runwayStart;
          aircraft.position.copy(hangar);
        }
        aircraft.rotation.set(0, this.playerYaw, 0);
      }
    }
    this.playerPos.y = 0;
    this.controlMode = 'foot';
    this.vehicleHome = null;
    this.vehicleSpeed = 0;
    this.playerModel.position.copy(this.playerPos);
    this.playerModel.visible = true;
    if (this.petModel) this.petModel.visible = true;
    this.ui.toast('Đã đỗ và rời phương tiện');
    this.ui.updateVehicleHud({ mode: 'foot' });
  }

  toggleVehicle(station) {
    if (this.inVehicle) {
      this.disembarkFleet();
      return;
    }
    const home = this.selectVehicleHome('land', station, { mode: 'land', x: this.vehiclePos.x, z: this.vehiclePos.z, y: 0 });
    if (!home) return;
    this.vehicleHome = home;
    this.inVehicle = true;
    this.controlMode = 'land';
    this.playerPos.set(home.x, 0, home.z);
    this.playerYaw = this.vehicleYaw;
    this.playerModel.visible = false;
    this.parkedVehicle.position.copy(this.playerPos);
    this.parkedVehicle.visible = true;
    sound.playUpgrade();
    const veh = VEHICLES.find(v => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
    this.ui.toast('Đang lái ' + veh.name);
  }

  sellAllAtSawmill() {
    const mult = getRevenueMultiplier();
    let earned = 0;
    let units = 0;
    if (gameState.planks > 0) {
      earned += gameState.planks * 24 * mult;
      units += gameState.planks;
      gameState.planks = 0;
    }
    if (gameState.pallets > 0) {
      earned += gameState.pallets * 115 * mult;
      units += gameState.pallets;
      gameState.pallets = 0;
    }
    if (earned <= 0) return;

    earned = Math.round(earned);
    gameState.cash += earned;
    recordRevenue('sawmill', earned);
    gameState.xp += Math.min(80, units * 2);
    if (gameState.xp >= gameState.level * 120) gameState.level++;
    addSeasonXp(Math.min(25, Math.ceil(units / 2)));
    sound.playCash();
    this.spawnWorldText(ZONES.sawOutput, `+$${earned.toLocaleString()}`, 'cash');
    this.world.spawnParticles(ZONES.sawOutput, 0x34d399, 6);
    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
  }

  applyOfflineEarnings(data) {
    if (!data || data.cash <= 0) return;
    gameState.cash += data.cash;
    if (data.planks > 0) gameState.planks += data.planks;
    recordRevenue('offline', data.cash);
    sound.playCash();
    this.syncSawmillVisuals();
    this.ui.refreshHUD();
    this.ui.toast(`💼 Nhận +$${data.cash.toLocaleString()} thu nhập ngoại tuyến!`);
    saveGameServer();
  }

  sellAllFurniture() {
    const qty = Math.floor(gameState.furniture || 0);
    if (qty <= 0) return false;
    const mult = getRevenueMultiplier();
    const earned = Math.round(qty * 320 * mult);
    gameState.furniture = 0;
    gameState.cash += earned;
    gameState.totalExported += qty;
    recordRevenue('furniture', earned);
    recordExportItem('furniture', qty, earned);
    logTransaction('export', `Xuất xưởng ${qty} Bộ Nội thất`, earned, 0);
    addSeasonXp(Math.min(35, qty * 6));
    sound.playCash();
    this.spawnWorldText(ZONES.furnitureMill, `+$${earned.toLocaleString()} 🛋️`, 'cash');
    this.world.spawnParticles(ZONES.furnitureMill, 0xfbbf24, 6);
    saveGameServer();
    this.ui.refreshHUD();
    return true;
  }

  sellCommodityAtMarket(key) {
    const def = MARKET_COMMODITIES.find((c) => c.key === key);
    const entry = marketState.items[key];
    const qty = Math.floor(gameState[key] || 0);
    if (!def || !entry || qty <= 0) return false;

    const unitPrice = Math.round(def.basePrice * entry.mult * getRevenueMultiplier());
    const earned = qty * unitPrice;
    gameState[key] = 0;
    gameState.cash += earned;
    gameState.totalExported += qty;
    recordRevenue(key === 'furniture' ? 'furniture' : 'market', earned);
    recordExportItem(key, qty, earned);
    logTransaction('export', `Bán Sàn ${qty} ${def.unit} ${def.name}`, earned, 0);
    gameState.xp += Math.min(90, qty * 2);
    if (gameState.xp >= gameState.level * 120) gameState.level++;
    addSeasonXp(Math.min(35, Math.max(5, Math.ceil(qty / 2))));
    sound.playCash();
    this.spawnWorldText(ZONES.harborExport, `+$${earned.toLocaleString()}`, 'cash');
    this.ui.toast(`📊 Đã bán ${qty} ${def.unit} ${def.name} thu về +$${earned.toLocaleString()}!`);
    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    return true;
  }

  handleDeliverContract(instant = false) {
    const ct = gameState.activeContract;
    if (!ct) return false;

    const needP = Math.max(0, ct.reqPlanks - ct.deliveredPlanks);
    const needPal = Math.max(0, ct.reqPallets - ct.deliveredPallets);
    const needCan = Math.max(0, ct.reqCanned - ct.deliveredCanned);

    if (instant) {
      const addP = Math.min(needP, gameState.planks);
      const addPal = Math.min(needPal, gameState.pallets);
      const addCan = Math.min(needCan, gameState.cannedFish);
      const totalAdd = addP + addPal + addCan;
      if (totalAdd <= 0) {
        this.ui.toast('Kho chưa có hàng phù hợp hợp đồng!');
        return false;
      }
      gameState.planks -= addP;
      gameState.pallets -= addPal;
      gameState.cannedFish -= addCan;
      ct.deliveredPlanks += addP;
      ct.deliveredPallets += addPal;
      ct.deliveredCanned += addCan;
      gameState.totalExported += totalAdd;
      advanceDailyQuest('goodsExported', totalAdd);
      this._arcStart.copy(this.playerPos).setY(this.playerPos.y + 1);
      this._arcEnd.copy(ZONES.harborExport).setY(ZONES.harborExport.y + 2);
      this.world.spawnFlyingArc(this._arcStart, this._arcEnd, 'plank');
      sound.playCash();
    }

    if (
      ct.deliveredPlanks >= ct.reqPlanks &&
      ct.deliveredPallets >= ct.reqPallets &&
      ct.deliveredCanned >= ct.reqCanned
    ) {
      const cashGain = Math.round(ct.rewardCash * getContractMultiplier());
      gameState.cash += cashGain;
      recordRevenue('contracts', cashGain);
      recordExportItem('planks', ct.reqPlanks, Math.round(cashGain * 0.45));
      recordExportItem('pallets', ct.reqPallets, Math.round(cashGain * 0.3));
      recordExportItem('cannedFish', ct.reqCanned, Math.round(cashGain * 0.25));
      logTransaction('export', `Hoàn thành ${ct.title}`, cashGain, ct.rewardGems);
      gameState.gems += ct.rewardGems;
      gameState.contractsCompleted += 1;
      shiftSession.contractsDone += 1;
      gameState.xp += 80;
      if (gameState.xp >= gameState.level * 120) gameState.level++;
      addSeasonXp(ct.rewardSeasonXp);
      addVipXp(45);
      sound.playShipHorn();
      this.spawnWorldText(ZONES.harborExport, `+$${cashGain.toLocaleString()} · +${ct.rewardGems}💎`, 'cash');
      this.ui.toast(`🚢 Hoàn thành ${ct.title}! Nhận +$${cashGain.toLocaleString()} & +${ct.rewardGems} 💎`);
      generateNextContract();
      this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    }

    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    return true;
  }

  handleDeliverVipRush() {
    const rush = gameState.vipRushOrder;
    if (!rush) return false;
    if (
      gameState.planks < rush.reqPlanks ||
      gameState.pallets < rush.reqPallets ||
      gameState.cannedFish < rush.reqCanned
    ) {
      this.ui.toast('Kho chưa đủ hàng cho Đơn VIP Khẩn Cấp!');
      return false;
    }

    gameState.planks -= rush.reqPlanks;
    gameState.pallets -= rush.reqPallets;
    gameState.cannedFish -= rush.reqCanned;
    const totalAdd = rush.reqPlanks + rush.reqPallets + rush.reqCanned;
    gameState.totalExported += totalAdd;
    advanceDailyQuest('goodsExported', totalAdd);

    const cashGain = Math.round(rush.rewardCash * getContractMultiplier());
    gameState.cash += cashGain;
    recordRevenue('contracts', cashGain);
    gameState.gems += rush.rewardGems;
    gameState.contractsCompleted += 1;
    shiftSession.contractsDone += 1;
    gameState.xp += 95;
    if (gameState.xp >= gameState.level * 120) gameState.level++;
    addVipXp(60);
    addSeasonXp(45);

    gameState.vipRushOrder = null;
    gameState.vipRushCooldown = 50;

    sound.playShipHorn();
    this.world.spawnParticles(ZONES.harborExport, 0xfbbf24, 6);
    this.spawnWorldText(ZONES.harborExport, `⚡ +$${cashGain.toLocaleString()} · +${rush.rewardGems}💎`, 'cash');
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    return true;
  }

  handlePrestigeReset() {
    this.disembarkFleet();
    this.playerPos.set(0, 0, 2);
    this.playerYaw = 0;
    this.inVehicle = false;
    this.controlMode = 'foot';
    this.playerModel.visible = true;
    if (this.petModel) this.petModel.visible = true;
    syncPlayerBackLogs(this.playerModel, 0);
    this.applyBranchAtmosphere(getActiveBranch());
    this.rebuildWorkforce();
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    this.world.syncYachtTier(gameState.yachtTier || 0);
    this.world.syncAirportTier(gameState.airportTier || 0);
    this.world.syncIslandTier(gameState.islandStationTier || 0);
    this.world.syncHqTier(gameState.hqTier || 0);
    this.world.syncResortTier(gameState.islandResortTier || 0);
    this.world.syncFurnitureMillTier(gameState.furnitureMillTier || 0);
    this.world.syncLighthouseTier(gameState.lighthouseTier || 0);
    this.world.syncDeepPortTier(gameState.deepPortTier || 0, gameState.greenEnergyTier || 0);
    this.world.syncRailwayTier(gameState.railwayTier || 0);
    this.world.syncHeliTier(gameState.heliTier || 0);
    this.world.syncCivicTier(gameState.civicTier || 0);
    this.rebuildAirSeaFleet();
    this.rebuildCitizens();
    this.lastVisualBuffer = -1;
    this.lastVisualPlanks = -1;
    this.lastVisualPallets = -1;
    this.syncSawmillVisuals();
    for (const pad of this.world.arcadePads) {
      this.world.refreshArcadePad(pad, true);
    }
    this.world.spawnParticles(this.playerPos, 0xfacc15, 6);
  }

  // -------------------------------------------------------------------------
  // 5. Paced Zero-Leak Render & Simulation Loop
  // -------------------------------------------------------------------------
  scheduleNextTick() {
    if (this.disposed || this.paused) return;
    if (this.isSoftwareGl) {
      this.rafId = this.afterDraw(() => this.tick());
    } else {
      this.rafId = requestAnimationFrame(() => this.tick());
    }
  }

  tick() {
    if (this.disposed || this.paused) return;

    const now = performance.now();
    // Frame rate pacing for Low/Balanced profiles to keep CPU/GPU cool under 8GB RAM laptops
    if (!this.isSoftwareGl && this.minFrameMs > 0 && now - this.lastRenderTime < this.minFrameMs) {
      this.scheduleNextTick();
      return;
    }

    const dt = Math.min(0.06, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.lastRenderTime = now;
    this.elapsed += dt;

    if (this.archipelago.required || gameState.islandRoute.arrivalAt) {
      this.archipelago.open();
      this.archipelago.update(now);
      if (this.archipelago.required) {
        this.archipelago.render(this.elapsed);
        this.scheduleNextTick();
        return;
      }
    } else if (this.archipelago.dialog.open) {
      this.archipelago.update(now);
    }

    this.fpsSamples++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.8) {
      this.currentFps = this.fpsSamples / this.fpsAccum;
      this.fpsSamples = 0;
      this.fpsAccum = 0;
    }

    this.updateTimers(dt);
    this.updatePlayerMovement(dt);
    this.updateCheckpoint();
    this.updateChoppingAndHopper(dt);
    this.updateSawmillAndCannery(dt);
    this.updateArcadePads(dt);
    this.updateWorkforceAI(dt);
    this.updateYardVehiclesAI(dt);
    this.updateYardPorters(dt);
    this.updateWoodenHouses(dt);
    this.updateCitizensAI(dt);
    this.world.regionalLife.update(this.playerPos, this.elapsed, this.activeProfile === 'low', this.vehicleHome);
    this.updatePet(dt);
    this.updateRemotePlayers(dt);
    this.updateCamera(dt);

    this.world.update(dt, this.elapsed, gameState.sawmillBuffer > 0);
    this.updateDayNightAndWeather(dt);

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.14) {
      this.hudSyncAccum = 0;
      const prompt = this.getContextPromptState();
      if (prompt) this.ui.setPrompt(true, prompt.key, prompt.label);
      else this.ui.setPrompt(false);
      this.ui.updateVehicleHud(this.buildVehicleTelemetry());
      this.ui.refreshHUD();
    }

    this.minimapAccum += dt;
    if (this.minimapAccum >= 0.16) {
      this.minimapAccum = 0;
      this.ui.renderMinimap(
        this.playerPos,
        this.playerYaw,
        this.world.trees,
        this.world.currentQuestTarget,
        {
          treasures: this.world.seaTreasures,
          controlMode: this.controlMode,
          fleetMissionState,
          citizens: this.aiCitizens,
          regionalCitizens: this.world.regionalLife.people,
          vehicleHome: this.vehicleHome,
          yardVehicles: this.world.yardVehicles
        }
      );
    }

    this.marketAccum += dt;
    if (this.marketAccum >= 18) {
      this.marketAccum = 0;
      const surged = updateMarketPrices();
      if (surged.length) {
        this.ui.toast(`📈 Sàn gỗ tăng mạnh: ${surged.join(', ')}`);
      }
      if (!this.ui.els.hubModal.hidden && this.ui.activeTab === 'contracts') {
        this.ui.renderHub();
      }
    }

    this.stockAccum += dt;
    if (this.stockAccum >= 20) {
      this.stockAccum = 0;
      const movers = updateStockPrices();
      updateCarbonMarket();
      if (movers.length) {
        this.ui.toast(`📊 Cổ phiếu biến động: ${movers[0]}`);
      }
      if (!this.ui.els.hubModal.hidden && this.ui.activeTab === 'finance') {
        this.ui.renderHub();
      }
    }

    this.autoSaveAccum += dt;
    if (this.autoSaveAccum >= 8) {
      this.autoSaveAccum = 0;
      saveGameLocal();
    }

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  }

  updateTimers(dt) {
    if (gameState.boostTimer > 0) gameState.boostTimer = Math.max(0, gameState.boostTimer - dt);
    if (gameState.boostCooldown > 0) gameState.boostCooldown = Math.max(0, gameState.boostCooldown - dt);
    if (this.fullBagToastTimer > 0) this.fullBagToastTimer = Math.max(0, this.fullBagToastTimer - dt);

    const newEv = tickTimedEvents(dt);
    if (newEv) {
      this.ui.toast(`🌟 Sự kiện mới: ${newEv.name} (${newEv.desc})`);
    }
    const rushEv = tickVipRushOrder(dt);
    if (rushEv === 'spawned') {
      this.ui.toast('⚡ Có Đơn Hàng VIP Khẩn Cấp mới tại Cảng!');
    }

    const rotatedCombo = tickComboTimer(dt);
    if (rotatedCombo) {
      this.ui.toast(`🎁 Cửa hàng VIP có Combo mới: ${rotatedCombo.title}`);
    }
    const newAuc = tickAuctionTimer(dt);
    if (newAuc) {
      this.ui.toast(`🔨 Phiên Đấu Giá mới mở: ${newAuc.title}`);
    }

    // VIP Yacht Passive Accumulation
    if ((gameState.yachtTier || 0) > 0) {
      this.yachtTickTimer += dt;
      if (this.yachtTickTimer >= 5.0) {
        this.yachtTickTimer = 0;
        const yDef = YACHT_TIERS.find((y) => y.tier === gameState.yachtTier);
        if (yDef) {
          const gainCash = Math.round((yDef.cashPer10s / 2) * getPrestigeMultiplier());
          gameState.yachtAccumCash = (gameState.yachtAccumCash || 0) + gainCash;
          if (Math.random() < yDef.gemChance * 0.5) {
            gameState.yachtAccumGems = (gameState.yachtAccumGems || 0) + 1;
          }
        }
      }
    }

    // Whole-Chain Logistics Network Automation
    const logiLv = gameState.logisticsTier || 0;
    if (logiLv > 0 && gameState.autoLogisticsEnabled) {
      this.logisticsLogTimer += dt;
      const logInterval = Math.max(1.0, 5.2 - logiLv * 0.82);
      if (this.logisticsLogTimer >= logInterval) {
        this.logisticsLogTimer = 0;
        const batchLogs = logiLv >= 4 ? 2 : 1;
        gameState.sawmillBuffer += batchLogs;
        gameState.totalLogsCut += batchLogs;
        advanceDailyQuest('logsCut', batchLogs);
        this.syncSawmillVisuals();
      }

      if (logiLv >= 3) {
        this.logisticsExportTimer += dt;
        const exportInterval = logiLv >= 5 ? 1.8 : 2.8;
        if (this.logisticsExportTimer >= exportInterval) {
          this.logisticsExportTimer = 0;
          const ct = gameState.activeContract;
          let autoMoved = false;
          if (ct) {
            if (ct.deliveredPlanks < ct.reqPlanks && gameState.planks > 0) {
              const amt = Math.min(2, ct.reqPlanks - ct.deliveredPlanks, gameState.planks);
              gameState.planks -= amt;
              ct.deliveredPlanks += amt;
              gameState.totalExported += amt;
              advanceDailyQuest('goodsExported', amt);
              autoMoved = true;
            } else if (ct.deliveredPallets < ct.reqPallets && gameState.pallets > 0) {
              gameState.pallets -= 1;
              ct.deliveredPallets += 1;
              gameState.totalExported += 1;
              advanceDailyQuest('goodsExported', 1);
              autoMoved = true;
            } else if (ct.deliveredCanned < ct.reqCanned && gameState.cannedFish > 0) {
              gameState.cannedFish -= 1;
              ct.deliveredCanned += 1;
              gameState.totalExported += 1;
              advanceDailyQuest('goodsExported', 1);
              autoMoved = true;
            }
          }
          if (autoMoved) {
            this.handleDeliverContract(false);
          } else if (logiLv >= 4 && gameState.planks >= 6) {
            // Sell surplus planks automatically when contract doesn't need them
            gameState.planks -= 2;
            const earn = Math.round(48 * getRevenueMultiplier());
            gameState.cash += earn;
            recordRevenue('sawmill', earn);
            this.syncSawmillVisuals();
          }
        }
      }
    }

    this.badgeCheckTimer += dt;
    if (this.badgeCheckTimer >= 3.0) {
      this.badgeCheckTimer = 0;
      const newBadges = evaluateBadgeUnlocks();
      if (newBadges.length) {
        for (const b of newBadges) {
          this.ui.triggerCelebration(`Mở Khóa Huy Hiệu: ${b.name}!`, `Thưởng vĩnh viễn +${b.bonusPct}% Doanh thu`);
        }
        saveGameServer();
      }
    }

    const spawnedMission = tickFleetMissions(dt);
    if (spawnedMission === 'sea' && this.controlMode === 'yacht') {
      this.ui.toast('🧭 Radar có Đơn Hàng Hải mới!');
    } else if (spawnedMission === 'air' && this.controlMode === 'plane') {
      this.ui.toast('📡 Có Đơn Giao Hàng Không mới trên bầu trời!');
    }

    // Passive Automated Sea & Air Fleet income (matches getCashPerMinute rates)
    if ((gameState.autoSeaFleet || 0) > 0 || (gameState.autoAirFleet || 0) > 0) {
      this.autoFleetIncomeTimer += dt;
      if (this.autoFleetIncomeTimer >= 5.0) {
        this.autoFleetIncomeTimer = 0;
        const mult = getRevenueMultiplier();
        const seaEarn = ((gameState.autoSeaFleet || 0) * 320 / 12) * mult;
        const airEarn = ((gameState.autoAirFleet || 0) * 480 / 12) * mult;
        const total = Math.round(seaEarn + airEarn);
        if (total > 0) {
          gameState.cash += total;
          recordRevenue('contracts', total);
        }
      }
    }

    // Corporate HQ Periodic Dividends
    if ((gameState.hqTier || 0) > 0) {
      this.hqDivTimer += dt;
      if (this.hqDivTimer >= 15.0) {
        this.hqDivTimer = 0;
        const hqDef = HQ_TIERS.find((h) => h.tier === gameState.hqTier);
        if (hqDef) {
          const divAdd = Math.round((hqDef.dividend45s / 3) * getPrestigeMultiplier());
          gameState.pendingDividendCash = (gameState.pendingDividendCash || 0) + divAdd;
        }
      }
    }

    // Offshore Island VIP Yacht Resort Passive Accumulation
    if ((gameState.islandResortTier || 0) > 0) {
      this.resortTickTimer += dt;
      if (this.resortTickTimer >= 5.0) {
        this.resortTickTimer = 0;
        const rDef = ISLAND_RESORT_TIERS.find((r) => r.tier === gameState.islandResortTier);
        if (rDef) {
          const rCash = Math.round((rDef.cashPer10s / 2) * getPrestigeMultiplier());
          gameState.resortAccumCash = (gameState.resortAccumCash || 0) + rCash;
          if (Math.random() < rDef.gemChance * 0.5) {
            gameState.resortAccumGems = (gameState.resortAccumGems || 0) + 1;
          }
        }
      }
    }

    // Luxury Furniture Mill Auto-Crafting Loop
    const millLv = gameState.furnitureMillTier || 0;
    if (millLv > 0) {
      const millDef = FURNITURE_MILL_TIERS.find((t) => t.tier === millLv) || FURNITURE_MILL_TIERS[0];
      this.furnitureCraftTimer += dt;
      if (this.furnitureCraftTimer >= (millDef.cycleSec || 6.5)) {
        this.furnitureCraftTimer = 0;
        const crafted = craftFurnitureBatch(false);
        if (crafted.ok) {
          this.syncSawmillVisuals();
        }
      }
    }

    // Global Franchise & Harbor Real Estate 5s Passive Yields
    this.empirePhase6Timer += dt;
    if (this.empirePhase6Timer >= 5.0) {
      this.empirePhase6Timer = 0;
      const fRate = getFranchiseRoyaltyPer10s();
      if (fRate > 0) {
        gameState.franchiseAccumCash = (gameState.franchiseAccumCash || 0) + Math.round(fRate / 2);
      }
      const reRate = getRealEstateIncomePer10s();
      if (reRate > 0) {
        gameState.realEstateAccumCash = (gameState.realEstateAccumCash || 0) + Math.round(reRate / 2);
      }
    }

    // Phase 7: Deep Container Port & Green Carbon Passive Accumulation + Voyage & Futures Ticks
    this.phase7TickTimer += dt;
    if (this.phase7TickTimer >= 5.0) {
      this.phase7TickTimer = 0;
      const dpLv = gameState.deepPortTier || 0;
      if (dpLv > 0) {
        const dpDef = DEEP_PORT_TIERS.find((d) => d.tier === dpLv);
        if (dpDef) {
          const cAdd = Math.round((dpDef.royalty10s / 2) * getPrestigeMultiplier());
          gameState.containerAccumCash = (gameState.containerAccumCash || 0) + cAdd;
        }
      }
      const geLv = gameState.greenEnergyTier || 0;
      if (geLv > 0) {
        const geDef = GREEN_ENERGY_TIERS.find((g) => g.tier === geLv);
        if (geDef) {
          const patBonus = hasPatent('pat_green_grid') ? 1.35 : 1.0;
          const crAdd = (geDef.creditsPer10s / 2) * patBonus;
          gameState.carbonCredits = Number(((gameState.carbonCredits || 0) + crAdd).toFixed(2));
        }
      }
    }

    // Phase 8: Industrial Railway & VIP Helicopter 5s Passive Yields + Train Boost & Auto-Container Dispatch
    if ((gameState.trainBoostTimer || 0) > 0) {
      gameState.trainBoostTimer = Math.max(0, gameState.trainBoostTimer - dt);
    }
    this.phase8TickTimer += dt;
    if (this.phase8TickTimer >= 5.0) {
      this.phase8TickTimer = 0;
      const rwLv = gameState.railwayTier || 0;
      if (rwLv > 0) {
        const rwDef = RAILWAY_TIERS.find((r) => r.tier === rwLv);
        if (rwDef) {
          const boostMult = (gameState.trainBoostTimer || 0) > 0 ? 1.5 : 1.0;
          const rwCash = Math.round((rwDef.cashPer10s / 2) * getPrestigeMultiplier() * boostMult);
          gameState.railwayAccumCash = (gameState.railwayAccumCash || 0) + rwCash;
        }
      }
      const hLv = gameState.heliTier || 0;
      if (hLv > 0) {
        const hDef = HELI_TIERS.find((h) => h.tier === hLv);
        if (hDef) {
          const hEngMult = getEngineYieldMult(gameState.heliEngineTier || 1);
          const hCash = Math.round((hDef.cashPer10s / 2) * getPrestigeMultiplier() * hEngMult);
          gameState.heliAccumCash = (gameState.heliAccumCash || 0) + hCash;
          if (Math.random() < hDef.gemChance * 0.5) {
            gameState.heliAccumGems = (gameState.heliAccumGems || 0) + 1;
          }
        }
      }

      // Automated Deep-Water Container Port Dispatch
      const autoVoyage = autoTryDispatchContainerVoyage();
      if (autoVoyage && autoVoyage.ok && autoVoyage.route) {
        this.ui.toast(`🚢 Cảng Tự Động đã xuất bến tàu: ${autoVoyage.route.name}!`);
      }
    }

    // Phase 9: Living Island AI Civilians & Tourism Tax 5s Passive Accumulation
    this.civicTickTimer += dt;
    if (this.civicTickTimer >= 5.0) {
      this.civicTickTimer = 0;
      const tax10s = getCivicTaxPer10s();
      if (tax10s > 0) {
        gameState.civicAccumCash = (gameState.civicAccumCash || 0) + Math.round(tax10s / 2);
      }
      const cTier = gameState.civicTier || 0;
      if (cTier > 0) {
        const cDef = CIVIC_AMENITY_TIERS.find((t) => t.tier === cTier);
        if (cDef && Math.random() < (cDef.gemChance || 0) * 0.5) {
          gameState.civicAccumGems = (gameState.civicAccumGems || 0) + 1;
        }
      }
    }

    const doneVoyage = tickContainerVoyage(dt);
    if (doneVoyage) {
      sound.playShipHorn();
      this.ui.triggerCelebration(
        `Tàu Container Cập Cảng: ${doneVoyage.name}!`,
        `+$${doneVoyage.rewardCash.toLocaleString()} · +${doneVoyage.rewardGems} 💎`,
        true
      );
      saveGameServer();
    }

    const futEvents = tickFuturesContracts(dt);
    for (const fe of futEvents) {
      if (fe.ok) {
        sound.playCash();
        this.ui.toast(`📜 Tất toán HĐ Tương lai ${fe.name}: +$${fe.cash.toLocaleString()} · +${fe.gems}💎`);
      } else if (fe.expiredInsured) {
        sound.playCash();
        this.ui.toast(`🛡️ Bảo hiểm hoàn trả +$${fe.rebate.toLocaleString()} cho HĐ ${fe.name}!`);
      } else if (fe.expired) {
        this.ui.toast(`⏳ HĐ Tương lai ${fe.name} đã đáo hạn (thiếu hàng).`);
      }
    }

    // Trade Expo Rotation
    const newExpo = tickTradeExpo(dt);
    if (newExpo) {
      this.ui.toast(`🎪 Hội Chợ ${newExpo.name}: ${newExpo.desc}!`);
    }

    // Sea Storm & Aerial Relief Challenge Timer
    const stormEv = tickStormChallenge(dt);
    if (stormEv === 'spawned') {
      sound.playThunder();
      this.ui.toast(`⛈️ Cảnh báo Bão! ${stormState.targetLabel} cần ${stormState.kind === 'air' ? 'Máy bay' : 'Du thuyền'} cứu trợ!`);
    } else if (stormEv === 'expired') {
      const insDef = INSURANCE_TIERS.find((i) => i.tier === (gameState.insuranceTier || 0));
      if (insDef) {
        const rebate = Math.round(stormState.rewardCash * (insDef.protectionPct / 100) * 0.35);
        if (rebate > 0) {
          gameState.cash += rebate;
          gameState.insuranceSavedCash = (gameState.insuranceSavedCash || 0) + rebate;
          recordPnlExpense('insuranceSaved', rebate);
          logTransaction('bank', 'Bảo hiểm Hàng hải bồi thường Bão biển', rebate, 0);
          sound.playCash();
          this.ui.toast(`🛡️ Bảo hiểm Hàng hải bồi thường +$${rebate.toLocaleString()} sau cơn bão!`);
        } else {
          this.ui.toast('🌦️ Cơn bão ngoài khơi đã tan.');
        }
      } else {
        this.ui.toast('🌦️ Cơn bão ngoài khơi đã tan.');
      }
    }

    // Real-time Revenue History Sampling (5s intervals -> 2-minute chart window)
    this.revSampleTimer += dt;
    if (this.revSampleTimer >= 5.0) {
      this.revSampleTimer = 0;
      const cpm = sampleRevenueHistory();
      if (cpm > (shiftSession.peakCpm || 0)) shiftSession.peakCpm = cpm;
      if (gameState.personalBests && cpm > (gameState.personalBests.bestCpm || 0)) {
        gameState.personalBests.bestCpm = cpm;
      }
    }
  }

  buildVehicleTelemetry() {
    if (this.controlMode === 'yard_vehicle' && this.activeYardVehicle) {
      const v = this.activeYardVehicle;
      const nearestDrop = DELIVERY_DROPOFFS.reduce((best, d) => {
        const dist = Math.hypot(d.x - this.playerPos.x, d.z - this.playerPos.z);
        return !best || dist < best.dist ? { d, dist } : best;
      }, null);
      const missionText = v.cargoWood > 0
        ? `Giao gỗ → ${nearestDrop.d.shortName} (${Math.round(nearestDrop.dist)}m)`
        : 'Quay về Khu Xưởng Gỗ để chất gỗ lên xe';
      return {
        mode: 'yard_vehicle',
        title: `${v.kind === 'truck' ? '🚛' : '🚜'} ${v.name}`,
        speedDisplay: `${Math.round(this.vehicleSpeed * 3.6)} km/h`,
        altDisplay: `🪵 ${v.cargoWood}/${v.cargoCapacity} gỗ`,
        missionText,
        parkingLabel: 'Nhấn E để xuống xe',
        driverBtnLabel: v.driverHired ? '🤖 Giao tài xế AI (F)' : `👷 Thuê tài xế $${v.driverCost} (F)`
      };
    }
    if (this.controlMode === 'yacht') {
      const isStarterBoat = (gameState.yachtTier || 0) <= 0;
      const yDef = YACHT_TIERS.find((y) => y.tier === (gameState.yachtTier || 1)) || YACHT_TIERS[0];
      const sm = fleetMissionState.sea;
      const dist = sm ? Math.round(Math.hypot(sm.targetX - this.playerPos.x, sm.targetZ - this.playerPos.z)) : 0;
      return {
        parkingLabel: 'Cập gần một trong 3 cầu tàu gỗ rồi nhấn E để lên bờ',
        mode: 'yacht',
        title: isStarterBoat ? '⛵ Tàu Cá Ven Biển' : `🚤 ${yDef.name}`,
        speedDisplay: `${Math.round(this.vehicleSpeed * 1.94)} kts`,
        altDisplay: 'Mặt biển',
        missionText: sm ? `${sm.targetLabel} (${dist}m)` : 'Tự do lái tàu · Cập cầu gỗ nhấn E lên bờ'
      };
    }
    if (this.controlMode === 'plane') {
      const pDef = getPlaneData();
      const am = fleetMissionState.air;
      const dist = am
        ? Math.round(Math.hypot(am.targetX - this.playerPos.x, am.targetY - this.playerPos.y, am.targetZ - this.playerPos.z))
        : 0;
      return {
        parkingLabel: this.getParkingStatus().label,
        mode: 'plane',
        title: `✈️ ${pDef.name}`,
        speedDisplay: `${Math.round(this.vehicleSpeed * 12)} km/h`,
        altDisplay: `${Math.max(0, this.playerPos.y - 0.25).toFixed(1)} m`,
        missionText: am ? `${am.targetLabel} (${dist}m)` : 'Bay tự do toàn cảnh 3D'
      };
    }
    if (this.controlMode === 'heli') {
      const hDef = getHeliData();
      const am = fleetMissionState.air;
      const dist = am
        ? Math.round(Math.hypot(am.targetX - this.playerPos.x, am.targetY - this.playerPos.y, am.targetZ - this.playerPos.z))
        : 0;
      return {
        parkingLabel: this.getParkingStatus().label,
        mode: 'heli',
        title: `🚁 ${hDef.name}`,
        speedDisplay: `${Math.round(this.vehicleSpeed * 11)} km/h`,
        altDisplay: `${Math.max(0, this.playerPos.y - 0.25).toFixed(1)} m`,
        missionText: am ? `${am.targetLabel} (${dist}m)` : 'Tuần tra & Chuyên cơ VIP 360°'
      };
    }
    return { mode: this.controlMode };
  }

  updatePlayerMovement(dt) {
    if (this.ui.isAnyModalOpen() || this.archipelago.dialog.open) return;

    let ix = this.joyVec.x;
    let iy = this.joyVec.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;

    if (this.walkToFerry) {
      if (this.controlMode !== 'foot' || Math.hypot(ix, iy) > 0.08) {
        this.walkToFerry = false;
      } else if (this.archipelago.atPier) {
        this.walkToFerry = false;
        this.archipelago.open();
        return;
      } else {
        this._tmpVec.subVectors(ZONES.ferryPier, this.playerPos).setY(0).normalize();
        ix = this._tmpVec.x * Math.cos(this.camYaw) - this._tmpVec.z * Math.sin(this.camYaw);
        iy = this._tmpVec.x * Math.sin(this.camYaw) + this._tmpVec.z * Math.cos(this.camYaw);
      }
    }

    if (this.controlMode === 'yard_vehicle') {
      this.updateYardVehicleDriving(dt, ix, iy);
      this.sendNetPose(dt, this.vehicleSpeed > 0.5, false);
      return;
    }
    if (this.controlMode === 'yacht') {
      this.updateYachtControl(dt, ix, iy);
      this.sendNetPose(dt, true, false);
      return;
    }
    if (this.controlMode === 'plane') {
      this.updatePlaneFlight(dt, ix, iy);
      this.sendNetPose(dt, true, false);
      return;
    }
    if (this.controlMode === 'heli') {
      this.updateHeliFlight(dt, ix, iy);
      this.sendNetPose(dt, true, false);
      return;
    }

    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;
    this.playerMoving = moving;
    let speedMult = 1;

    if (moving) {
      ix /= Math.max(1, len);
      iy /= Math.max(1, len);

      this._vecForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._vecRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir.set(0, 0, 0)
        .addScaledVector(this._vecForward, -iy)
        .addScaledVector(this._vecRight, ix)
        .normalize();

      const skin = getSkinData();
      let speed = 8.4 * (1 + ((gameState.bootsTier || 1) - 1) * 0.18 + (skin.speedBonus || 0));
      if (gameState.equippedPet === 'shiba') speed *= 1.12;
      if (gameState.vipLevel >= 2) speed *= 1.15;
      if (gameState.boostTimer > 0) speed *= 1.35;
      speedMult = speed / 8.4;

      if (this.inVehicle) {
        const veh = VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
        speed = veh.speed * (gameState.boostTimer > 0 ? 1.25 : 1.0);
      }

      this.playerPos.addScaledVector(this._moveDir, speed * dt);
      this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
      this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

      // Walkable across all 3 coastal wooden fishing piers (West -58, Center 5, East 52)
      const onWestPier = this.playerPos.z > 23.5 && this.playerPos.z <= 36.2 && Math.abs(this.playerPos.x + 58) < 4.0;
      const onCenterPier = this.playerPos.z > 23.5 && this.playerPos.z <= 36.2 && Math.abs(this.playerPos.x - 5) < 5.6;
      const onEastPier = this.playerPos.z > 23.5 && this.playerPos.z <= 36.2 && Math.abs(this.playerPos.x - 52) < 4.0;
      const onPier = onWestPier || onCenterPier || onEastPier;
      if (!onPier && this.playerPos.z > LAND_EDGE_Z) {
        this.playerPos.z = LAND_EDGE_Z;
      }
      this.playerPos.y = onPier ? 0.62 : 0;

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (this.inVehicle ? 6 : 11 * Math.max(0.85, Math.min(1.45, speedMult)));
    } else if (!this.inVehicle && this.chopSwing > 0 && this.chopTargetYaw !== null) {
      let diff = this.chopTargetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 14);
    }

    if (this.inVehicle && this.parkedVehicle) {
      this.vehiclePos.copy(this.playerPos);
      this.vehicleYaw = this.playerYaw;
      this.parkedVehicle.position.copy(this.vehiclePos);
      this.parkedVehicle.rotation.y = this.vehicleYaw;
    } else {
      if (this.playerJumpY > 0 || this.playerJumpVel > 0) {
        this.playerJumpY += this.playerJumpVel * dt;
        this.playerJumpVel -= 19.5 * dt;
        if (this.playerJumpY <= 0) {
          this.playerJumpY = 0;
          this.playerJumpVel = 0;
          this.world.spawnParticles(this.playerPos, 0xd6c7a9, 3);
        }
      }
      if (this.playerActionTimer > 0) {
        this.playerActionTimer = Math.max(0, this.playerActionTimer - dt);
        if (this.playerActionTimer <= 0) this.playerAction = null;
      }

      this.playerModel.position.set(this.playerPos.x, this.playerPos.y + this.playerJumpY, this.playerPos.z);
      this.playerModel.rotation.y = this.playerYaw;
      if (this.chopSwing > 0) {
        const chopDecay = gameState.boostTimer > 0 ? 4.4 : 3.0;
        this.chopSwing = Math.max(0, this.chopSwing - dt * chopDecay);
        if (this.chopSwing <= 0) this.chopTargetYaw = null;
      }
      const cap = Math.max(1, getBackpackCapacity());
      this._playerAnimOpts.carryRatio = Math.min(1, (gameState.logs || 0) / cap);
      this._playerAnimOpts.speedMult = speedMult;
      this._playerAnimOpts.action = this.playerAction;
      this._playerAnimOpts.actionT = this.playerAction && this.playerActionDuration > 0
        ? 1 - (this.playerActionTimer / this.playerActionDuration)
        : 0;
      this._playerAnimOpts.jumpY = this.playerJumpY;
      updatePlayerModelAnimation(
        this.playerModel,
        dt,
        moving,
        this.walkPhase,
        this.chopSwing,
        this.elapsed,
        this._playerAnimOpts
      );
    }

    this.sendNetPose(dt, moving, this.chopSwing > 0);
  }

  sendNetPose(dt, moving, isChopping) {
    this.netSendTimer += dt;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.netSendTimer >= 0.09) {
      this.netSendTimer = 0;
      this.ws.send(JSON.stringify({
        type: 'move',
        x: Number(this.playerPos.x.toFixed(2)),
        y: Number(this.playerPos.y.toFixed(2)),
        z: Number(this.playerPos.z.toFixed(2)),
        rotY: Number(this.playerYaw.toFixed(2)),
        isMoving: moving,
        isChopping,
        vehicle: this.controlMode !== 'foot' ? this.controlMode : null
      }));
    }
  }

  updateYachtControl(dt, ix, iy) {
    const low = this.activeProfile === 'low';
    const yDef = YACHT_TIERS.find((y) => y.tier === (gameState.yachtTier || 1)) || YACHT_TIERS[0];
    const yEng = gameState.yachtEngineTier || 1;
    const maxSpeed = yDef.speed * getEngineSpeedMult(yEng) * (gameState.boostTimer > 0 ? 1.25 : 1.0);
    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;

    let turnDiff = 0;
    if (moving) {
      const nx = ix / Math.max(1, len);
      const ny = iy / Math.max(1, len);
      this._vecForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._vecRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir.set(0, 0, 0)
        .addScaledVector(this._vecForward, -ny)
        .addScaledVector(this._vecRight, nx)
        .normalize();

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      turnDiff = targetYaw - this.playerYaw;
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
      this.playerYaw += turnDiff * Math.min(1, dt * 4.5);
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, maxSpeed, Math.min(1, dt * 3.5));
    } else {
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, 0, Math.min(1, dt * 2.2));
    }

    this._vecForward.set(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    this.playerPos.addScaledVector(this._vecForward, this.vehicleSpeed * dt);
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, SEA_BOUNDS.minX, SEA_BOUNDS.maxX);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, SEA_BOUNDS.minZ, SEA_BOUNDS.maxZ);

    // Keep clear of the 3 coastal wooden fishing piers (West -58, Center 5, East 52)
    if (this.playerPos.z < 36.5 && (Math.abs(this.playerPos.x - 5) < 6.5 || Math.abs(this.playerPos.x + 58) < 6.5 || Math.abs(this.playerPos.x - 52) < 6.5)) {
      this.playerPos.z = 36.5;
    }
    const waveAmp = stormState.active ? 0.24 : 0.1;
    const waveFreq = stormState.active ? 4.4 : 2.2;
    this.playerPos.y = 0.05 + Math.sin(this.elapsed * waveFreq) * waveAmp;

    if (this.drivableYacht) {
      this.drivableYacht.position.copy(this.playerPos);
      this.drivableYacht.rotation.y = this.playerYaw;
      this.drivableYacht.rotation.z = THREE.MathUtils.clamp(-turnDiff * 0.25, -0.22, 0.22);
      this.drivableYacht.rotation.x = -Math.min(0.08, (this.vehicleSpeed / maxSpeed) * 0.06);
    }

    // Wake foam trail (throttled & scaled down on <8GB RAM)
    if (this.vehicleSpeed > 3.5) {
      this.wakeTimer += dt;
      const wakeInterval = low ? 0.24 : 0.1;
      if (this.wakeTimer >= wakeInterval) {
        this.wakeTimer = 0;
        this._tmpVec.copy(this.playerPos).addScaledVector(this._vecForward, -4.2);
        this.world.spawnParticles(this._tmpVec, 0xe0f2fe, low ? 1 : 2);
      }
    }

    // Collect floating Sea Treasures
    for (const tr of this.world.seaTreasures) {
      if (!tr.active) continue;
      if (Math.hypot(this.playerPos.x - tr.pos.x, this.playerPos.z - tr.pos.z) < 5.2) {
        tr.active = false;
        tr.mesh.visible = false;
        tr.respawnTimer = 10;
        const cashGain = Math.round((420 + (gameState.yachtTier || 1) * 260) * getRevenueMultiplier() * getEngineYieldMult(yEng));
        const gemGain = 6 + (gameState.yachtTier || 1) * 2;
        gameState.cash += cashGain;
        gameState.gems += gemGain;
        gameState.treasuresCollected = (gameState.treasuresCollected || 0) + 1;
        recordRevenue('fishery', cashGain);
        addVipXp(25);
        addSeasonXp(20);
        sound.playTreasure();
        this.world.spawnParticles(tr.pos, 0xfacc15, 6);
        this.spawnWorldText(tr.pos, `+$${cashGain.toLocaleString()} · +${gemGain}💎`, 'cash');
        this.ui.toast(`💎 Vớt Kho Báu Biển! +$${cashGain.toLocaleString()} & +${gemGain} 💎`);
      }
    }

    // Complete Sea Delivery Mission
    const sm = fleetMissionState.sea;
    if (sm && Math.hypot(this.playerPos.x - sm.targetX, this.playerPos.z - sm.targetZ) < 6.8) {
      const bonusCash = Math.round(sm.rewardCash * (getEngineYieldMult(yEng) - 1));
      const done = completeFleetMission('sea');
      if (done) {
        if (bonusCash > 0) {
          gameState.cash += bonusCash;
          recordRevenue('contracts', bonusCash);
        }
        sound.playShipHorn();
        this.world.spawnParticles(this.playerPos, 0x22d3ee, 6);
        this.ui.triggerCelebration('Giao Đơn Hàng Hải Thành Công!', `+$${(done.rewardCash + bonusCash).toLocaleString()} · +${done.rewardGems} 💎`);
        saveGameServer();
      }
    }

    // Complete Sea Storm Rescue Beacon
    if (stormState.active && stormState.kind === 'sea') {
      if (Math.hypot(this.playerPos.x - stormState.targetX, this.playerPos.z - stormState.targetZ) < 8.5) {
        const res = completeStormRescue();
        if (res) {
          sound.playTreasure();
          this.world.spawnParticles(this.playerPos, 0xf43f5e, 6);
          this.ui.triggerCelebration('Cứu Hộ Bão Biển Thành Công!', `+$${res.rewardCash.toLocaleString()} · +${res.rewardGems} 💎`);
          saveGameServer();
        }
      }
    }
  }

  updateYardVehicleDriving(dt, ix, iy) {
    const v = this.activeYardVehicle;
    if (!v) {
      this.controlMode = 'foot';
      return;
    }
    const maxSpeed = v.speed * (gameState.boostTimer > 0 ? 1.25 : 1.0);
    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;

    if (moving) {
      const nx = ix / Math.max(1, len);
      const ny = iy / Math.max(1, len);
      this._vecForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._vecRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir.set(0, 0, 0)
        .addScaledVector(this._vecForward, -ny)
        .addScaledVector(this._vecRight, nx)
        .normalize();

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 6.5);
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, maxSpeed, Math.min(1, dt * 5.0));
    } else {
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, 0, Math.min(1, dt * 6.0));
    }

    this._vecForward.set(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    this.playerPos.addScaledVector(this._vecForward, this.vehicleSpeed * dt);
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, WORLD_BOUNDS.minX + 2, WORLD_BOUNDS.maxX - 2);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, WORLD_BOUNDS.minZ + 2, LAND_EDGE_Z - 2.0);
    this.playerPos.y = 0;

    v.pos.set(this.playerPos.x, 0.06, this.playerPos.z);
    v.yaw = this.playerYaw;
    v.mesh.position.copy(v.pos);
    v.mesh.rotation.y = v.yaw;
    for (const w of v.wheels || []) {
      w.rotation.x += this.vehicleSpeed * dt * 1.9;
    }

    // Auto-reload wood when driving back inside Logging Industry Zone
    if (
      v.cargoWood < v.cargoCapacity &&
      v.pos.x >= MAP_ZONES.logging.minX && v.pos.x <= MAP_ZONES.logging.maxX &&
      v.pos.z >= MAP_ZONES.logging.minZ && v.pos.z <= MAP_ZONES.logging.maxZ
    ) {
      this.loadWoodIntoYardVehicle(v, false);
    }

    // Auto-deliver wood when driving into any Zone Drop-off Ring
    if (v.cargoWood > 0) {
      for (const drop of DELIVERY_DROPOFFS) {
        if (Math.hypot(v.pos.x - drop.x, v.pos.z - drop.z) < 7.8) {
          this.completeYardWoodDelivery(v, drop, false);
          break;
        }
      }
    }
  }

  updateYardVehiclesAI(dt) {
    const list = this.world?.yardVehicles || [];
    if (!list.length) return;
    const speedBonus = 1 + getManagerBonus('contractBonus') * 0.5;

    for (const v of list) {
      if (!v.driverHired || v.state === 'player') continue;

      if (v.driverVisual) {
        v.driverVisual.visible = true;
        v.driverVisual.rotation.y += dt * 2.2;
      }

      if (v.waitTimer > 0) {
        v.waitTimer -= dt;
        continue;
      }

      const drop = DELIVERY_DROPOFFS[v.targetIdx % DELIVERY_DROPOFFS.length];
      if (v.state === 'parked') {
        v.state = v.cargoWood > 0 ? 'delivering' : 'returning';
        v.wpIdx = 0;
      }

      const route = v.state === 'delivering' ? drop.routeFromYard : drop.routeToYard;
      const wp = route[Math.min(v.wpIdx, route.length - 1)];
      const dx = wp[0] - v.pos.x;
      const dz = wp[1] - v.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1.8) {
        const moveSpeed = v.speed * 0.72 * speedBonus;
        const step = Math.min(dist, moveSpeed * dt);
        v.pos.x += (dx / dist) * step;
        v.pos.z += (dz / dist) * step;
        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - v.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.yaw += diff * Math.min(1, dt * 6.5);
        v.mesh.position.copy(v.pos);
        v.mesh.rotation.y = v.yaw;
        for (const w of v.wheels || []) {
          w.rotation.x += moveSpeed * dt * 1.8;
        }
      } else {
        v.wpIdx += 1;
        if (v.wpIdx >= route.length) {
          v.wpIdx = 0;
          if (v.state === 'delivering') {
            this.completeYardWoodDelivery(v, drop, true);
            v.waitTimer = 1.4;
            v.state = 'returning';
          } else {
            this.loadWoodIntoYardVehicle(v, true);
            v.waitTimer = 1.2;
            v.targetIdx = (v.targetIdx + 1) % DELIVERY_DROPOFFS.length;
            v.state = 'delivering';
          }
        }
      }
    }
  }

  updatePlaneFlight(dt, ix, iy) {
    const low = this.activeProfile === 'low';
    const plane = getPlaneData();
    const pEng = gameState.planeEngineTier || 1;
    const airDef = AIRPORT_TIERS.find((a) => a.tier === (gameState.airportTier || 1));
    const airBonus = airDef ? airDef.maxSpeedBonus : 0;
    const maxSpeed = plane.speed * (1 + airBonus) * getEngineSpeedMult(pEng) * (gameState.boostTimer > 0 ? 1.22 : 1.0);

    const climbInput = (this.keys.has('Space') || this.btnClimbUp ? 1 : 0)
      - (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.btnClimbDown ? 1 : 0);

    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;
    const airborne = this.playerPos.y > 0.8;

    let turnDiff = 0;
    if (moving) {
      const nx = ix / Math.max(1, len);
      const ny = iy / Math.max(1, len);
      this._vecForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._vecRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir.set(0, 0, 0)
        .addScaledVector(this._vecForward, -ny)
        .addScaledVector(this._vecRight, nx)
        .normalize();

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      turnDiff = targetYaw - this.playerYaw;
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
      this.playerYaw += turnDiff * Math.min(1, dt * 3.4);
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, maxSpeed, Math.min(1, dt * 3.0));
    } else if (airborne || climbInput > 0) {
      // Maintain smooth forward cruise speed while airborne so plane never stalls dead in sky
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, maxSpeed * 0.48, Math.min(1, dt * 1.8));
    } else {
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, 0, Math.min(1, dt * 2.5));
    }

    this._vecForward.set(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    this.playerPos.addScaledVector(this._vecForward, this.vehicleSpeed * dt);
    this.playerPos.y = THREE.MathUtils.clamp(
      this.playerPos.y + climbInput * plane.climbRate * getEngineSpeedMult(pEng) * dt,
      AIR_BOUNDS.minY,
      AIR_BOUNDS.maxY
    );
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, AIR_BOUNDS.minX, AIR_BOUNDS.maxX);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, AIR_BOUNDS.minZ, AIR_BOUNDS.maxZ);

    const speedRatio = this.vehicleSpeed / Math.max(1, maxSpeed);
    const targetBank = THREE.MathUtils.clamp(-turnDiff * 0.9 * speedRatio, -0.58, 0.58);
    const targetPitch = -climbInput * 0.28;
    this.planeBank = THREE.MathUtils.lerp(this.planeBank, targetBank, Math.min(1, dt * 7));
    this.planePitch = THREE.MathUtils.lerp(this.planePitch, targetPitch, Math.min(1, dt * 7));

    if (this.drivablePlane) {
      this.drivablePlane.position.copy(this.playerPos);
      this.drivablePlane.rotation.set(this.planePitch, this.playerYaw, this.planeBank, 'YXZ');
      const props = this.drivablePlane.userData?.propellers || [];
      const propSpin = dt * (8 + this.vehicleSpeed * 1.5);
      for (let i = 0; i < props.length; i++) {
        props[i].rotation.z += propSpin;
      }
    }

    // Subtle exhaust contrail particles (gated OFF on <8GB RAM low-spec)
    if (!low && this.vehicleSpeed > 14 && this.playerPos.y > 1.5) {
      this.wakeTimer += dt;
      if (this.wakeTimer >= 0.11) {
        this.wakeTimer = 0;
        this._tmpVec.copy(this.playerPos).addScaledVector(this._vecForward, -3.2);
        this._tmpVec.y += 0.7;
        this.world.spawnParticles(this._tmpVec, 0xf1f5f9, 1);
      }
    }

    // Complete 3D Sky Air Delivery Ring
    const am = fleetMissionState.air;
    if (am) {
      const dist3d = Math.hypot(
        this.playerPos.x - am.targetX,
        this.playerPos.y - am.targetY,
        this.playerPos.z - am.targetZ
      );
      if (dist3d < 9.0) {
        const bonusCash = Math.round(am.rewardCash * (getEngineYieldMult(pEng) - 1));
        const done = completeFleetMission('air');
        if (done) {
          if (bonusCash > 0) {
            gameState.cash += bonusCash;
            recordRevenue('contracts', bonusCash);
          }
          sound.playTakeoff();
          this.world.spawnParticles(this.playerPos, 0xfbbf24, 6);
          this.ui.triggerCelebration('Thả Hàng Không Thành Công!', `+$${(done.rewardCash + bonusCash).toLocaleString()} · +${done.rewardGems} 💎`);
          saveGameServer();
        }
      }
    }

    // Complete Aerial Storm Rescue Beacon
    if (stormState.active && stormState.kind === 'air') {
      const stormDist = Math.hypot(
        this.playerPos.x - stormState.targetX,
        this.playerPos.y - stormState.targetY,
        this.playerPos.z - stormState.targetZ
      );
      if (stormDist < 10.5) {
        const res = completeStormRescue();
        if (res) {
          sound.playTakeoff();
          this.world.spawnParticles(this.playerPos, 0xf43f5e, 6);
          this.ui.triggerCelebration('Chuyến Bay Cứu Trợ Thành Công!', `+$${res.rewardCash.toLocaleString()} · +${res.rewardGems} 💎`);
          saveGameServer();
        }
      }
    }
  }

  updateHeliFlight(dt, ix, iy) {
    const heli = getHeliData();
    const hEng = gameState.heliEngineTier || 1;
    const maxSpeed = heli.speed * getEngineSpeedMult(hEng) * (gameState.boostTimer > 0 ? 1.25 : 1.0);

    const climbInput = (this.keys.has('Space') || this.btnClimbUp ? 1 : 0)
      - (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.btnClimbDown ? 1 : 0);

    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;
    let turnDiff = 0;

    if (moving) {
      const nx = ix / Math.max(1, len);
      const ny = iy / Math.max(1, len);
      this._vecForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._vecRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir.set(0, 0, 0)
        .addScaledVector(this._vecForward, -ny)
        .addScaledVector(this._vecRight, nx)
        .normalize();

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      turnDiff = targetYaw - this.playerYaw;
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
      this.playerYaw += turnDiff * Math.min(1, dt * 5.2);
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, maxSpeed, Math.min(1, dt * 4.2));
    } else {
      // Helicopter can hover stationary in place
      this.vehicleSpeed = THREE.MathUtils.lerp(this.vehicleSpeed, 0, Math.min(1, dt * 3.8));
    }

    this._vecForward.set(Math.sin(this.playerYaw), 0, Math.cos(this.playerYaw));
    this.playerPos.addScaledVector(this._vecForward, this.vehicleSpeed * dt);
    this.playerPos.y = THREE.MathUtils.clamp(
      this.playerPos.y + climbInput * 11.5 * getEngineSpeedMult(hEng) * dt,
      0.35,
      AIR_BOUNDS.maxY
    );
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, AIR_BOUNDS.minX, AIR_BOUNDS.maxX);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, AIR_BOUNDS.minZ, AIR_BOUNDS.maxZ);

    const speedRatio = this.vehicleSpeed / Math.max(1, maxSpeed);
    const targetPitch = moving ? 0.22 * speedRatio : 0;
    const targetBank = THREE.MathUtils.clamp(-turnDiff * 0.65 * speedRatio, -0.42, 0.42);
    this.heliPitch = THREE.MathUtils.lerp(this.heliPitch, targetPitch, Math.min(1, dt * 7));
    this.heliBank = THREE.MathUtils.lerp(this.heliBank, targetBank, Math.min(1, dt * 7));

    if (this.drivableHeli) {
      const hoverBob = Math.sin(this.elapsed * 4.5) * 0.08;
      this.drivableHeli.position.set(this.playerPos.x, this.playerPos.y + hoverBob, this.playerPos.z);
      this.drivableHeli.rotation.set(this.heliPitch, this.playerYaw, this.heliBank, 'YXZ');
      if (this.drivableHeli.userData?.mainRotor) {
        this.drivableHeli.userData.mainRotor.rotation.y += dt * 32;
      }
      if (this.drivableHeli.userData?.tailRotor) {
        this.drivableHeli.userData.tailRotor.rotation.x += dt * 38;
      }
    }

    // Complete 3D Sky Air Delivery Ring with VIP Helicopter
    const am = fleetMissionState.air;
    if (am) {
      const dist3d = Math.hypot(
        this.playerPos.x - am.targetX,
        this.playerPos.y - am.targetY,
        this.playerPos.z - am.targetZ
      );
      if (dist3d < 9.2) {
        const bonusCash = Math.round(am.rewardCash * (getEngineYieldMult(hEng) - 1 + 0.15));
        const done = completeFleetMission('air');
        if (done) {
          if (bonusCash > 0) {
            gameState.cash += bonusCash;
            recordRevenue('contracts', bonusCash);
          }
          sound.playHeliRotor();
          this.world.spawnParticles(this.playerPos, 0xfacc15, 6);
          this.ui.triggerCelebration('Trực Thăng VIP Giao Hàng Thành Công!', `+$${(done.rewardCash + bonusCash).toLocaleString()} · +${done.rewardGems} 💎`);
          saveGameServer();
        }
      }
    }

    // Complete Aerial Storm Rescue Beacon with VIP Helicopter
    if (stormState.active && stormState.kind === 'air') {
      const stormDist = Math.hypot(
        this.playerPos.x - stormState.targetX,
        this.playerPos.y - stormState.targetY,
        this.playerPos.z - stormState.targetZ
      );
      if (stormDist < 10.5) {
        const res = completeStormRescue();
        if (res) {
          sound.playHeliRotor();
          this.world.spawnParticles(this.playerPos, 0xf43f5e, 6);
          this.ui.triggerCelebration('Trực Thăng Cứu Trợ Bão Thành Công!', `+$${res.rewardCash.toLocaleString()} · +${res.rewardGems} 💎`);
          saveGameServer();
        }
      }
    }
  }

  updateChoppingAndHopper(dt) {
    this.chopCooldown = Math.max(0, this.chopCooldown - dt);
    this.unloadTimer = Math.max(0, this.unloadTimer - dt);
    if (this.controlMode === 'yacht' || this.controlMode === 'plane' || this.controlMode === 'heli') return;

    const cap = this.inVehicle
      ? (VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift'))?.capacity || 14)
      : getBackpackCapacity();

    let chopRadius = 2.95;
    if (gameState.equippedPet === 'shiba') chopRadius *= 1.45;
    if (gameState.vipLevel >= 1) chopRadius *= 1.2;
    if (this.inVehicle && gameState.equippedVehicle === 'supercar') chopRadius = 4.6;

    if (this.chopCooldown <= 0) {
      let nearest = null;
      let bestDist = chopRadius;
      for (const tree of this.world.trees) {
        if (!tree.alive) continue;
        const d = this.playerPos.distanceTo(tree.pos);
        if (d < bestDist) {
          bestDist = d;
          nearest = tree;
        }
      }

      if (nearest) {
        if (gameState.logs >= cap) {
          if (this.fullBagToastTimer <= 0) {
            this.fullBagToastTimer = 3.0;
            this.spawnWorldText(this.playerPos, 'Đầy Balo! Về Phễu Xưởng', 'log');
          }
        } else {
          const forestMgr = 1 + getManagerBonus('forestSpeed');
          this.chopCooldown = (gameState.boostTimer > 0 ? 0.2 : 0.38) / forestMgr;
          this.chopSwing = 1.0;
          this.chopTargetYaw = Math.atan2(nearest.pos.x - this.playerPos.x, nearest.pos.z - this.playerPos.z);

          const dmg = gameState.boostTimer > 0 ? 2 : Math.max(1, Math.ceil((gameState.axeTier || 1) * 0.75));
          nearest.hp -= dmg;
          nearest.wobble = 1.0;
          this.world.spawnParticles(nearest.pos, 0xd97706, 4);
          sound.playChop(0.95 + Math.random() * 0.15);

          if (nearest.hp <= 0) {
            nearest.alive = false;
            nearest.regrowTimer = 7.5;
            nearest.mesh.scale.setScalar(0.08);
            sound.playTreeFall();
            this.triggerScreenShake(0.14);

            const gained = Math.min(cap - gameState.logs, nearest.logYield);
            gameState.logs += gained;
            gameState.totalLogsCut += gained;
            shiftSession.logsCut += gained;
            advanceDailyQuest('logsCut', gained);
            gameState.xp += gained * 4;
            if (gameState.xp >= gameState.level * 120) gameState.level++;
            syncPlayerBackLogs(this.playerModel, gameState.logs);

            this._arcStart.copy(nearest.pos).setY(1.4);
            this._arcEnd.copy(this.playerPos).setY(this.playerPos.y + 1.2);
            this.world.spawnFlyingArc(this._arcStart, this._arcEnd, nearest.kind);
            this.spawnWorldText(nearest.pos, `+${gained} 🪵`, 'log');

            const gemChance = gameState.equippedPet === 'cyber_cat' ? 0.42 : 0.14;
            if (Math.random() < gemChance) {
              const gAmt = nearest.kind === 'redwood' ? 2 : 1;
              gameState.gems += gAmt;
              this._tmpVec.copy(nearest.pos).setY(0.8);
              this.spawnWorldText(this._tmpVec, `+${gAmt} 💎`, 'gem');
            }
          }
        }
      }
    }

    if (gameState.logs > 0 && this.unloadTimer <= 0 && this.playerPos.distanceTo(ZONES.hopper) < 3.8) {
      this.unloadTimer = 0.12;
      gameState.logs -= 1;
      gameState.sawmillBuffer += 1;
      syncPlayerBackLogs(this.playerModel, gameState.logs);
      this._arcStart.copy(this.playerPos).setY(this.playerPos.y + 1.1);
      this._arcEnd.copy(ZONES.hopper).setY(1.8);
      this.world.spawnFlyingArc(this._arcStart, this._arcEnd, 'log', () => this.syncSawmillVisuals());
      sound.playChop(1.25);
    }
  }

  updateSawmillAndCannery(dt) {
    if (gameState.sawmillBuffer > 0) {
      this.sawTimer += dt;
      const sawInterval = Math.max(0.28, 1.25 / (1 + ((gameState.sawSpeedTier || 1) - 1) * 0.35));
      if (this.sawTimer >= sawInterval) {
        this.sawTimer = 0;
        gameState.sawmillBuffer -= 1;
        const produced = Math.max(1, gameState.sawSpeedTier || 1);
        gameState.planks += produced;
        gameState.totalPlanksSawn += produced;
        advanceDailyQuest('planksSawn', produced);
        addSeasonXp(2);
        sound.playSaw();
        this.syncSawmillVisuals();
      }
    }

    if ((gameState.conveyorTier || 0) > 0 && gameState.planks >= 4) {
      this.palletTimer += dt;
      const sawMgr = 1 + getManagerBonus('sawValue');
      const convInterval = Math.max(0.35, (2.0 - gameState.conveyorTier * 0.28) / sawMgr);
      if (this.palletTimer >= convInterval) {
        this.palletTimer = 0;
        gameState.planks -= 4;
        gameState.pallets += 1;
        this.syncSawmillVisuals();
      }
    }

    const boatCount = Math.max(1, gameState.fishingBoats || 0);
    const hawkMult = gameState.equippedPet === 'harbor_hawk' ? 1.25 : 1.0;
    this.fishTimer += dt * hawkMult;
    const fishInterval = Math.max(1.2, 4.2 / boatCount);
    if (this.fishTimer >= fishInterval) {
      this.fishTimer = 0;
      if (gameState.freshFish < 2) gameState.freshFish += 1;
      if (gameState.freshFish >= 2) {
        gameState.freshFish -= 2;
        gameState.cannedFish += 1;
      }
    }

    const onLand = this.controlMode !== 'yacht' && this.controlMode !== 'plane' && this.controlMode !== 'heli';

    if (onLand && this.playerPos.distanceTo(ZONES.sawOutput) < 3.4) {
      this.sellTimer += dt;
      if (this.sellTimer >= 0.32) {
        this.sellTimer = 0;
        const ct = gameState.activeContract;
        const reservePlanks = ct ? Math.max(0, ct.reqPlanks - ct.deliveredPlanks) : 0;
        const reservePallets = ct ? Math.max(0, ct.reqPallets - ct.deliveredPallets) : 0;
        const mult = getRevenueMultiplier();

        if (gameState.pallets > reservePallets) {
          gameState.pallets -= 1;
          const earn = Math.round(115 * mult);
          gameState.cash += earn;
          recordRevenue('sawmill', earn);
          sound.playCash();
          this.spawnWorldText(ZONES.sawOutput, `+$${earn}`, 'cash');
          this.syncSawmillVisuals();
        } else if (gameState.planks > reservePlanks) {
          const batch = Math.min(2, gameState.planks - reservePlanks);
          gameState.planks -= batch;
          const earn = Math.round(24 * batch * mult);
          gameState.cash += earn;
          recordRevenue('sawmill', earn);
          sound.playCash();
          this.spawnWorldText(ZONES.sawOutput, `+$${earn}`, 'cash');
          this.syncSawmillVisuals();
        }
      }
    }

    if (onLand && this.playerPos.distanceTo(ZONES.harborExport) < 4.0) {
      this.deliverTimer += dt;
      if (this.deliverTimer >= 0.35) {
        this.deliverTimer = 0;
        const ct = gameState.activeContract;
        if (ct) {
          let delivered = false;
          if (ct.deliveredPlanks < ct.reqPlanks && gameState.planks > 0) {
            const amt = Math.min(2, ct.reqPlanks - ct.deliveredPlanks, gameState.planks);
            gameState.planks -= amt;
            ct.deliveredPlanks += amt;
            gameState.totalExported += amt;
            advanceDailyQuest('goodsExported', amt);
            delivered = true;
          } else if (ct.deliveredPallets < ct.reqPallets && gameState.pallets > 0) {
            gameState.pallets -= 1;
            ct.deliveredPallets += 1;
            gameState.totalExported += 1;
            advanceDailyQuest('goodsExported', 1);
            delivered = true;
          } else if (ct.deliveredCanned < ct.reqCanned && gameState.cannedFish > 0) {
            gameState.cannedFish -= 1;
            ct.deliveredCanned += 1;
            gameState.totalExported += 1;
            advanceDailyQuest('goodsExported', 1);
            delivered = true;
          }
          if (delivered) {
            sound.playCash();
            this.spawnWorldText(ZONES.harborExport, 'Đã xếp tàu 🚢', 'gem');
            this.handleDeliverContract(false);
          }
        }
      }
    }

    if (onLand && this.playerPos.distanceTo(ZONES.canneryDock) < 3.4 && gameState.cannedFish > 0) {
      this.sellTimer += dt;
      if (this.sellTimer >= 0.45 && (!gameState.activeContract || gameState.activeContract.deliveredCanned >= gameState.activeContract.reqCanned)) {
        this.sellTimer = 0;
        gameState.cannedFish -= 1;
        const ev = getActiveEvent();
        const fishEvMult = ev && ev.multTarget === 'fishery' ? 1 + ev.multBonus : 1.0;
        const coldMgrMult = 1 + getManagerBonus('offlineBonus');
        const earn = Math.round(75 * getRevenueMultiplier() * coldMgrMult * fishEvMult);
        gameState.cash += earn;
        recordRevenue('fishery', earn);
        sound.playCash();
        this.spawnWorldText(ZONES.canneryDock, `+$${earn} 🥫`, 'cash');
      }
    }
  }

  updateArcadePads(dt) {
    if (this.controlMode === 'yacht' || this.controlMode === 'plane' || this.controlMode === 'heli') return;
    for (const pad of this.world.arcadePads) {
      if (this.playerPos.distanceTo(pad.pos) > 1.85) continue;
      const item = UPGRADE_CATALOG.find((u) => u.id === pad.id);
      if (!item) continue;
      const cost = getUpgradeCost(item);
      if (cost === null || gameState.cash <= 0) continue;

      const invested = gameState.padProgress[pad.id] || 0;
      const remaining = Math.max(0, cost - invested);
      const spend = Math.min(gameState.cash, remaining, Math.max(15, cost * 0.7) * dt);
      if (spend <= 0.1) continue;

      gameState.cash -= spend;
      gameState.padProgress[pad.id] = invested + spend;

      if (gameState.padProgress[pad.id] >= cost - 0.5) {
        gameState.padProgress[pad.id] = 0;
        gameState[item.id] = (gameState[item.id] || 0) + 1;
        recordPnlExpense('upgradeSpend', cost);
        gameState.xp += 25;
        if (gameState.xp >= gameState.level * 120) gameState.level++;
        addSeasonXp(20);
        sound.playUpgrade();
        this.world.spawnParticles(pad.pos, 0x10b981, 6);
        this.ui.toast(`✨ Đã nâng cấp ${item.name} lên cấp ${gameState[item.id]}`);
        this.handleUpgradeEffect(item.id);
        saveGameServer();
      } else {
        this.world.refreshArcadePad(pad, false);
      }
    }
  }

  updateYardPorters(dt) {
    const piles = this.world?.yardLogPiles || [];
    const porters = this.world?.yardPorters || [];
    if (!piles.length || !porters.length) return;

    if (this.workerRallyTimer > 0) {
      this.workerRallyTimer = Math.max(0, this.workerRallyTimer - dt);
    }
    const rallyMult = this.workerRallyTimer > 0 ? 1.45 : 1.0;

    // Gradually restock stacked yard timber piles so workers stay busy non-stop
    for (const pile of piles) {
      if (pile.count < pile.maxCount) {
        pile.restockTimer += dt;
        if (pile.restockTimer >= 6.8) {
          pile.restockTimer = 0;
          pile.restockOne();
        }
      }
    }

    const pickUnclaimedPile = (porter) => {
      const candidates = [];
      for (let idx = 0; idx < piles.length; idx++) {
        if (piles[idx].count <= 0) continue;
        const taken = porters.some(
          (other) => other !== porter && (other.state === 'to_pile' || other.state === 'pickup') && other.pileIdx === idx
        );
        if (!taken) candidates.push(idx);
      }
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      const anyAvail = piles.findIndex((pl) => pl.count > 0);
      return anyAvail >= 0 ? anyAvail : (porter.pileIdx + 2) % piles.length;
    };

    const pickSpreadDrop = (porter) => {
      const targets = porter.dropTargets;
      const candidates = [];
      for (const t of targets) {
        const busy = porters.some((other) => other !== porter && other.state === 'to_drop' && other.dropTarget === t);
        if (!busy) candidates.push(t);
      }
      const chosen = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : targets[Math.floor(Math.random() * targets.length)];
      porter.dropOffset.set((Math.random() - 0.5) * 4.2, 0, (Math.random() - 0.5) * 3.8);
      porter.curveSign = Math.random() < 0.5 ? -1 : 1;
      porter.curveMag = 2.0 + Math.random() * 2.4;
      return chosen;
    };

    for (let i = 0; i < porters.length; i++) {
      const p = porters[i];
      let isMoving = false;
      let goalX = p.pos.x;
      let goalZ = p.pos.z;
      let wantMove = false;
      let moveSpeed = p.speed * rallyMult;

      if (p.state === 'to_pile') {
        let pile = piles[p.pileIdx % piles.length];
        if (pile.count <= 0) {
          p.pileIdx = pickUnclaimedPile(p);
          pile = piles[p.pileIdx];
        }
        goalX = pile.pickupPos.x;
        goalZ = pile.pickupPos.z;
        const dist = Math.hypot(goalX - p.pos.x, goalZ - p.pos.z);
        if (dist > 0.85) {
          wantMove = true;
        } else {
          p.state = 'pickup';
          p.stateDuration = 0.82;
          p.timer = p.stateDuration;
          p.carrying = true;
          p.mesh.userData?.setCarrying?.(true);
          pile.takeLog();
          this.world.spawnParticles(pile.pickupPos, 0xa16207, 4);
        }
      } else if (p.state === 'pickup') {
        p.timer -= dt;
        if (p.timer <= 0) {
          p.dropTarget = pickSpreadDrop(p);
          p.state = 'to_drop';
        }
      } else if (p.state === 'to_drop') {
        goalX = p.dropTarget.pos.x + (p.dropOffset?.x || 0);
        goalZ = p.dropTarget.pos.z + (p.dropOffset?.z || 0);
        const dist = Math.hypot(goalX - p.pos.x, goalZ - p.pos.z);
        moveSpeed *= 0.88;
        if (dist > 1.2) {
          wantMove = true;
        } else {
          p.state = 'drop';
          p.stateDuration = 0.65;
          p.timer = p.stateDuration;
        }
      } else if (p.state === 'drop') {
        p.timer -= dt;
        if (p.timer <= 0) {
          p.carrying = false;
          p.mesh.userData?.setCarrying?.(false);
          this.world.spawnParticles(p.pos, 0xd97706, 5);
          if (p.dropTarget.feedsSawmill && (gameState.sawmillBuffer || 0) < 14) {
            gameState.sawmillBuffer = (gameState.sawmillBuffer || 0) + 1;
            this.syncSawmillVisuals();
          }
          p.deliveriesSinceRest = (p.deliveriesSinceRest || 0) + 1;
          if (p.deliveriesSinceRest >= 2 && this.workerRallyTimer <= 0) {
            p.deliveriesSinceRest = 0;
            p.state = 'rest';
            p.stateDuration = 1.9 + Math.random() * 1.1;
            p.timer = p.stateDuration;
          } else {
            p.pileIdx = pickUnclaimedPile(p);
            p.state = 'to_pile';
          }
        }
      } else if (p.state === 'rest') {
        p.timer -= dt;
        if (p.timer <= 0) {
          p.pileIdx = pickUnclaimedPile(p);
          p.state = 'to_pile';
        }
      }

      if (wantMove) {
        const dx = goalX - p.pos.x;
        const dz = goalZ - p.pos.z;
        const dist = Math.hypot(dx, dz) || 0.001;
        let dirX = dx / dist;
        let dirZ = dz / dist;

        // Curved detour arc while far from goal so workers fan out naturally across the yard
        const arcWeight = Math.min(1, Math.max(0, (dist - 2.5) / 10.0)) * 0.28 * (p.curveSign || 1);
        dirX += -dirZ * arcWeight;
        dirZ += dirX * arcWeight;

        // Pairwise personal-space separation steering (ZERO lining up / crowding!)
        let sepX = 0;
        let sepZ = 0;
        const minSep = 3.8;
        for (let j = 0; j < porters.length; j++) {
          if (i === j) continue;
          const o = porters[j];
          const sx = p.pos.x - o.pos.x;
          const sz = p.pos.z - o.pos.z;
          const sDist = Math.hypot(sx, sz);
          if (sDist > 0.01 && sDist < minSep) {
            const push = ((minSep - sDist) / minSep) * 1.85;
            sepX += (sx / sDist) * push;
            sepZ += (sz / sDist) * push;
          }
        }
        dirX += sepX;
        dirZ += sepZ;

        const dLen = Math.hypot(dirX, dirZ) || 1;
        dirX /= dLen;
        dirZ /= dLen;

        const step = Math.min(dist, moveSpeed * dt);
        p.pos.x = THREE.MathUtils.clamp(p.pos.x + dirX * step, -110, -49);
        p.pos.z = THREE.MathUtils.clamp(p.pos.z + dirZ * step, -94, -6);
        p.yaw = Math.atan2(dirX, dirZ);
        isMoving = true;

        // Subtle dirt footstep dust puffs behind moving workers
        p.dustTimer = (p.dustTimer || 0) - dt;
        if (p.dustTimer <= 0) {
          p.dustTimer = this.workerRallyTimer > 0 ? 0.24 : 0.44;
          if (!this.world.lowSpec) {
            this.world.spawnParticles(p.pos, 0xcab89d, 1);
          }
        }
      }

      p.mesh.position.copy(p.pos);
      let diff = p.yaw - p.mesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.mesh.rotation.y += diff * Math.min(1, dt * 9);

      const stateProgress = p.stateDuration > 0
        ? Math.min(1, Math.max(0, 1 - (p.timer / p.stateDuration)))
        : 0;
      p.mesh.userData?.updateAnim?.(
        dt,
        isMoving,
        (p.carrying ? 0.92 : 1.05) * rallyMult,
        p.state,
        stateProgress
      );
    }
  }

  updateWoodenHouses(dt) {
    const houses = this.world?.woodenHouses || [];
    if (!houses.length) return;

    for (const h of houses) {
      if (!h.ready) {
        h.timer = Math.max(0, h.timer - dt);
        if (h.timer <= 0) h.ready = true;
      }

      if (h.readyRing) {
        if (h.ready) {
          const pulse = 1 + Math.sin(this.elapsed * 3.6 + h.x) * 0.08;
          h.readyRing.scale.setScalar(pulse);
          h.readyRing.material.opacity = 0.62 + Math.sin(this.elapsed * 3.6 + h.z) * 0.24;
        } else {
          h.readyRing.scale.setScalar(0.86);
          h.readyRing.material.opacity = 0.16;
        }
      }

      if (h.lantern) {
        const flicker = 0.94 + Math.sin(this.elapsed * 4.5 + h.x * 0.7) * 0.08;
        h.lantern.scale.setScalar(flicker);
      }

      if (h.artisan) {
        const a = h.artisan;
        let isMoving = false;
        if (a.waitTimer > 0) {
          a.waitTimer -= dt;
        } else {
          const goal = a.toB ? a.pointB : a.pointA;
          const dx = goal.x - a.pos.x;
          const dz = goal.z - a.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.35) {
            const step = Math.min(dist, a.speed * dt);
            a.pos.x += (dx / dist) * step;
            a.pos.z += (dz / dist) * step;
            const targetYaw = Math.atan2(dx, dz);
            let diff = targetYaw - a.mesh.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            a.mesh.rotation.y += diff * Math.min(1, dt * 8);
            isMoving = true;
          } else {
            a.toB = !a.toB;
            a.waitTimer = 1.6 + (Math.abs(h.x) % 2) * 0.5;
            if (a.carriesWood) {
              a.mesh.userData?.setCarrying?.(a.toB);
            }
          }
        }
        a.mesh.position.copy(a.pos);
        a.mesh.userData?.updateAnim?.(dt, isMoving, 0.85);
      }
    }
  }

  updateWorkforceAI(dt) {
    const forestSpeedMult = 1 + getManagerBonus('forestSpeed');
    const workerYield = forestSpeedMult >= 1.48 ? 3 : 2;
    for (const w of this.aiWorkers) {
      let isMoving = false;
      if (w.state === 'to_tree') {
        if (!w.targetTree || !w.targetTree.alive) {
          w.targetTree = this.world.trees.find((t) => t.alive) || null;
        }
        if (w.targetTree) {
          const dist = w.pos.distanceTo(w.targetTree.pos);
          if (dist > 1.6) {
            this._tmpVec.subVectors(w.targetTree.pos, w.pos).normalize();
            w.pos.addScaledVector(this._tmpVec, 4.4 * forestSpeedMult * dt);
            w.mesh.rotation.y = Math.atan2(this._tmpVec.x, this._tmpVec.z);
            isMoving = true;
          } else {
            w.state = 'chopping';
            w.timer = 1.4 / forestSpeedMult;
          }
        }
      } else if (w.state === 'chopping') {
        w.timer -= dt;
        if (w.mesh.userData?.rightArm) {
          w.mesh.userData.rightArm.rotation.x = Math.sin(this.elapsed * 12) * 1.1;
        }
        if (w.timer <= 0) {
          w.state = 'to_hopper';
          w.carrying = true;
          syncPlayerBackLogs(w.mesh, workerYield);
          w.mesh.userData?.setCarrying?.(true);
        }
      } else if (w.state === 'to_hopper') {
        const dist = w.pos.distanceTo(ZONES.hopper);
        if (dist > 1.8) {
          this._tmpVec.subVectors(ZONES.hopper, w.pos).normalize();
          w.pos.addScaledVector(this._tmpVec, 4.2 * forestSpeedMult * dt);
          w.mesh.rotation.y = Math.atan2(this._tmpVec.x, this._tmpVec.z);
          isMoving = true;
        } else {
          gameState.sawmillBuffer += workerYield;
          gameState.totalLogsCut += workerYield;
          advanceDailyQuest('logsCut', workerYield);
          syncPlayerBackLogs(w.mesh, 0);
          w.carrying = false;
          w.mesh.userData?.setCarrying?.(false);
          w.state = 'to_tree';
          w.targetTree = null;
          this.syncSawmillVisuals();
        }
      }
      w.mesh.position.copy(w.pos);
      w.mesh.userData?.updateAnim?.(dt, isMoving, forestSpeedMult);
    }

    const harborSpeedMult = 1 + getManagerBonus('contractBonus');
    for (const f of this.aiForklifts) {
      const target = f.toHarbor ? ZONES.harborExport : ZONES.sawOutput;
      const dist = f.pos.distanceTo(target);
      if (dist > 1.6) {
        this._tmpVec.subVectors(target, f.pos).normalize();
        f.pos.addScaledVector(this._tmpVec, 6.2 * harborSpeedMult * dt);
        f.mesh.rotation.y = Math.atan2(this._tmpVec.x, this._tmpVec.z);
        f.pos.y = f.pos.z > 24.5 ? 0.65 : 0;
      } else {
        if (f.toHarbor && f.carrying) {
          const earn = Math.round(68 * getRevenueMultiplier() * harborSpeedMult);
          gameState.cash += earn;
          recordRevenue('sawmill', earn);
          f.carrying = false;
        } else if (!f.toHarbor && gameState.planks > 0) {
          gameState.planks -= 1;
          f.carrying = true;
          this.syncSawmillVisuals();
        }
        f.toHarbor = !f.toHarbor;
      }
      f.mesh.position.copy(f.pos);
    }

    for (const b of this.fishingBoats) {
      b.angle += dt * 0.28;
      const nx = b.centerX + Math.cos(b.angle) * b.radiusX;
      const nz = b.centerZ + Math.sin(b.angle) * b.radiusZ;
      const dx = nx - b.mesh.position.x;
      const dz = nz - b.mesh.position.z;
      b.mesh.position.set(nx, -0.2 + Math.sin(this.elapsed * 2 + b.angle) * 0.08, nz);
      if (dx * dx + dz * dz > 0.0001) {
        b.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }

    for (const y of this.aiSeaYachts) {
      y.angle += dt * 0.22;
      const nx = y.centerX + Math.cos(y.angle) * y.radiusX;
      const nz = y.centerZ + Math.sin(y.angle) * y.radiusZ;
      const dx = nx - y.mesh.position.x;
      const dz = nz - y.mesh.position.z;
      y.mesh.position.set(nx, 0.05 + Math.sin(this.elapsed * 2 + y.angle) * 0.1, nz);
      if (dx * dx + dz * dz > 0.0001) {
        y.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }

    for (const p of this.aiAirPlanes) {
      p.angle += dt * 0.34;
      const nx = p.centerX + Math.cos(p.angle) * p.radiusX;
      const nz = p.centerZ + Math.sin(p.angle) * p.radiusZ;
      const dx = nx - p.mesh.position.x;
      const dz = nz - p.mesh.position.z;
      p.mesh.position.set(nx, p.altitude + Math.sin(this.elapsed * 1.4 + p.angle) * 0.9, nz);
      if (dx * dx + dz * dz > 0.0001) {
        p.mesh.rotation.y = Math.atan2(dx, dz);
        p.mesh.rotation.z = -0.22;
      }
      const props = p.mesh.userData?.propellers || [];
      for (let i = 0; i < props.length; i++) {
        props[i].rotation.z += dt * 26;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5B. Phase 9: Living Island AI Civilians (Stroll, Building Interaction & Collision Avoidance)
  // -------------------------------------------------------------------------
  rebuildCitizens() {
    while (this.aiCitizens.length > 0) {
      const removed = this.aiCitizens.pop();
      this.scene.remove(removed.mesh);
      if (removed.bubble?.material?.map) removed.bubble.material.map.dispose();
      if (removed.bubble?.material) removed.bubble.material.dispose();
      disposeObject3D(removed.mesh);
    }
  }

  findNearestCitizen(maxRadius = 4.0) {
    if (this.controlMode !== 'foot' && this.controlMode !== 'land') return null;
    let best = null;
    let bestDist = maxRadius;
    for (const c of this.aiCitizens) {
      const d = this.playerPos.distanceTo(c.pos);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }

  collectCitizenTip(c) {
    if (!c) return false;
    c.hasTip = false;
    c.tipCooldown = 22 + Math.random() * 14;
    c.state = 'greet_ceo';
    c.stateTimer = 2.4;
    c.greetCooldown = 8.0;

    const happyMult = Math.max(0.8, getCitizenHappiness() / 72);
    const baseTip = Math.round((85 + (gameState.level || 1) * 30) * (c.arch.tipMult || 1.0) * happyMult * getRevenueMultiplier());
    const gemRoll = c.arch.id === 'wall_street' || c.arch.id === 'vip_tourist' ? 0.55 : 0.3;
    const bonusGems = Math.random() < gemRoll ? (c.arch.tipMult >= 1.5 ? 2 : 1) : 0;

    gameState.cash += baseTip;
    if (bonusGems > 0) gameState.gems += bonusGems;
    gameState.civicTipsCollected = (gameState.civicTipsCollected || 0) + 1;
    gameState.xp += 18;
    if (gameState.xp >= gameState.level * 120) gameState.level++;
    recordRevenue('contracts', baseTip);
    addVipXp(10);
    addSeasonXp(10);

    sound.playCitizenGreet();
    this.world.spawnParticles(c.pos, 0xfacc15, 5);
    const floatLabel = bonusGems > 0
      ? `+$${baseTip.toLocaleString()} · +${bonusGems}💎`
      : `+$${baseTip.toLocaleString()} 💰`;
    this.spawnWorldText(c.pos, floatLabel, 'cash');

    const quotes = c.arch.quotes || ['Chúc Đế Chế TimberPort thịnh vượng!'];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    if (c.bubble) updateCitizenBubbleSprite(c.bubble, `👋 +$${baseTip.toLocaleString()}`, '#facc15', true);
    this.ui.toast(`🗣️ ${c.arch.name}: "${quote}" (+$${baseTip.toLocaleString()}${bonusGems > 0 ? ` & +${bonusGems} 💎` : ''})`);
    saveGameLocal();
    this.ui.refreshHUD();
    return true;
  }

  greetNearbyCitizen(allowFallbackAny = false) {
    let target = this.findNearestCitizen(4.5);
    if (!target && allowFallbackAny && this.aiCitizens.length > 0) {
      target = this.aiCitizens.find((c) => c.hasTip) || this.aiCitizens[0];
    }
    if (!target) {
      this.ui.toast('👥 Hãy lại gần Phố Đi Bộ hoặc Bến Cảng để trò chuyện với Dân cư!');
      return false;
    }

    if (target.hasTip) {
      return this.collectCitizenTip(target);
    }

    target.state = 'greet_ceo';
    target.stateTimer = 2.2;
    target.greetCooldown = 6.0;
    sound.playCitizenGreet();
    const quotes = target.arch.quotes || ['Chào Chủ tịch!'];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    if (target.bubble) updateCitizenBubbleSprite(target.bubble, `👋 Chào Chủ tịch!`, '#38bdf8', false);
    this.spawnWorldText(target.pos, `👋 ${target.arch.name}`, 'gem');
    this.ui.toast(`🗣️ ${target.arch.name}: "${quote}"`);
    return true;
  }

  /**
   * Computes real-time collision avoidance steering vector for citizen `c`:
   * 1. Avoids Player / CEO & active land vehicle (radial repulsion + tangential sidestep + yield slowdown)
   * 2. Avoids other AI Citizens, AI Lumberjacks, AI Forklifts & Remote Players (separation + right-hand passing rule)
   * 3. Avoids static 3D Building Colliders so avoidance never pushes a citizen into a wall
   */
  computeCitizenAvoidance(c, desiredNx, desiredNz, playerOnLand) {
    const out = this._avoidVec;
    out.steerX = 0;
    out.steerZ = 0;
    out.speedFactor = 1.0;
    out.evadingPlayer = false;

    const cx = c.pos.x;
    const cz = c.pos.z;

    // 1. Avoid Player / CEO (on foot or driving land vehicle)
    if (playerOnLand) {
      const avoidRad = this.inVehicle ? 3.5 : 2.35;
      const dxP = cx - this.playerPos.x;
      const dzP = cz - this.playerPos.z;
      const distSqP = dxP * dxP + dzP * dzP;
      if (distSqP < avoidRad * avoidRad && distSqP > 0.0001) {
        const distP = Math.sqrt(distSqP);
        const strength = ((avoidRad - distP) / avoidRad) * (this.inVehicle ? 2.4 : 1.75);
        const rx = dxP / distP;
        const rz = dzP / distP;
        // Tangential sidestep (choose left or right of player relative to citizen's heading)
        const cross = desiredNx * rz - desiredNz * rx;
        const sideSign = cross >= 0 ? 1 : -1;
        const tx = -rz * sideSign;
        const tz = rx * sideSign;

        out.steerX += rx * strength * 1.15 + tx * strength * 0.95;
        out.steerZ += rz * strength * 1.15 + tz * strength * 0.95;

        if (distP < (this.inVehicle ? 2.4 : 1.65)) {
          out.evadingPlayer = true;
          out.speedFactor = this.inVehicle ? 1.25 : 0.72; // step aside quickly for vehicle, yield politely on foot
        }
      }
    }

    // Also avoid parked vehicle when player is on foot
    if (!this.inVehicle && this.parkedVehicle) {
      const dxV = cx - this.vehiclePos.x;
      const dzV = cz - this.vehiclePos.z;
      const distSqV = dxV * dxV + dzV * dzV;
      if (distSqV < 4.84 && distSqV > 0.0001) { // 2.2m radius
        const distV = Math.sqrt(distSqV);
        const str = ((2.2 - distV) / 2.2) * 1.5;
        out.steerX += (dxV / distV) * str;
        out.steerZ += (dzV / distV) * str;
      }
    }

    // 2A. Separation & Right-Hand Passing against other AI Citizens
    const minCitDist = 1.25;
    for (let j = 0; j < this.aiCitizens.length; j++) {
      const other = this.aiCitizens[j];
      if (other === c) continue;
      const dx = cx - other.pos.x;
      const dz = cz - other.pos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minCitDist * minCitDist && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        const push = ((minCitDist - d) / minCitDist) * 1.35;
        const rx = dx / d;
        const rz = dz / d;
        // Right-hand passing tangent (-rz, rx)
        out.steerX += rx * push + (-rz) * push * 0.55;
        out.steerZ += rz * push + rx * push * 0.55;
      }
    }

    // 2B. Avoid AI Lumberjack Workers & Harbor Forklifts
    for (let j = 0; j < this.aiWorkers.length; j++) {
      const w = this.aiWorkers[j];
      const dx = cx - w.pos.x;
      const dz = cz - w.pos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < 1.96 && dSq > 0.0001) { // 1.4m
        const d = Math.sqrt(dSq);
        const push = ((1.4 - d) / 1.4) * 1.4;
        out.steerX += (dx / d) * push;
        out.steerZ += (dz / d) * push;
      }
    }

    for (let j = 0; j < this.aiForklifts.length; j++) {
      const f = this.aiForklifts[j];
      const dx = cx - f.pos.x;
      const dz = cz - f.pos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < 6.76 && dSq > 0.0001) { // 2.6m safety radius around moving forklifts
        const d = Math.sqrt(dSq);
        const push = ((2.6 - d) / 2.6) * 2.1;
        const rx = dx / d;
        const rz = dz / d;
        out.steerX += rx * push + (-rz) * push * 0.7;
        out.steerZ += rz * push + rx * push * 0.7;
      }
    }

    // 2C. Avoid Remote Multiplayer Characters
    if (this.remotePlayers && this.remotePlayers.size > 0) {
      for (const rp of this.remotePlayers.values()) {
        const rPos = rp.mesh.position;
        const dx = cx - rPos.x;
        const dz = cz - rPos.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < 4.0 && dSq > 0.0001) {
          const d = Math.sqrt(dSq);
          const push = ((2.0 - d) / 2.0) * 1.5;
          out.steerX += (dx / d) * push;
          out.steerZ += (dz / d) * push;
        }
      }
    }

    // 3. Soft Repulsion from Static 3D Building Colliders
    if (!c.useResortLoop) {
      for (let k = 0; k < BUILDING_COLLIDERS.length; k++) {
        const b = BUILDING_COLLIDERS[k];
        const dx = cx - b.x;
        const dz = cz - b.z;
        const dSq = dx * dx + dz * dz;
        const safeR = b.radius + 0.85;
        if (dSq < safeR * safeR && dSq > 0.0001) {
          const d = Math.sqrt(dSq);
          const push = ((safeR - d) / 0.85) * 2.2;
          out.steerX += (dx / d) * push;
          out.steerZ += (dz / d) * push;
        }
      }
    }

    return out;
  }

  pickNextCitizenWaypoint(c) {
    const curWp = ISLAND_WAYPOINTS[c.currentWpKey] || ISLAND_WAYPOINTS.plaza_center;
    const neighbors = curWp.neighbors || ['plaza_center'];
    // Filter out previous waypoint to prevent immediate ping-pong backtracking
    let candidates = neighbors;
    if (neighbors.length > 1 && c.prevWpKey) {
      const filtered = neighbors.filter((k) => k !== c.prevWpKey);
      if (filtered.length > 0) candidates = filtered;
    }
    const nextKey = candidates[(c.idx + Math.floor(this.elapsed * 1.3)) % candidates.length];
    const nextWp = ISLAND_WAYPOINTS[nextKey] || ISLAND_WAYPOINTS.plaza_center;

    c.prevWpKey = c.currentWpKey;
    c.targetWpKey = nextWp.id;

    // Compute right-hand sidewalk lane offset perpendicular to path segment
    const segDx = nextWp.x - curWp.x;
    const segDz = nextWp.z - curWp.z;
    const segLen = Math.max(0.01, Math.hypot(segDx, segDz));
    const rightX = -segDz / segLen;
    const rightZ = segDx / segLen;
    const lane = c.laneOffset || 0;

    c.targetPos.set(
      nextWp.x + rightX * lane,
      0,
      nextWp.z + rightZ * lane
    );
    c.state = 'stroll';
  }

  updateCitizensAI(dt) {
    if (!this.aiCitizens || this.aiCitizens.length === 0) return;

    const isStorm = Boolean(stormState.active || gameState.weatherMode === 'storm');
    const isNight = this.lastAppliedNightFactor > 0.45;
    const playerOnLand = this.controlMode === 'foot' || this.controlMode === 'land';

    for (let i = 0; i < this.aiCitizens.length; i++) {
      const c = this.aiCitizens[i];
      const ud = c.mesh.userData;

      // Toggle nighttime security flashlight cone
      if (ud.flashlightBeam) {
        ud.flashlightBeam.visible = isNight;
      }

      if (c.greetCooldown > 0) c.greetCooldown = Math.max(0, c.greetCooldown - dt);

      // Tip readiness timer
      if (!c.hasTip) {
        c.tipCooldown -= dt;
        if (c.tipCooldown <= 0) {
          c.hasTip = true;
        }
      }

      // Check proximity to CEO for automatic tip collection or wave greeting
      if (playerOnLand) {
        const distToCeo = c.pos.distanceTo(this.playerPos);
        if (c.hasTip && distToCeo < 2.95) {
          this.collectCitizenTip(c);
        } else if (distToCeo < 2.15 && c.state !== 'greet_ceo' && c.greetCooldown <= 0) {
          c.state = 'greet_ceo';
          c.stateTimer = 1.9;
          c.greetCooldown = 11.0;
        }
      }

      // Overhead citizen text bubbles intentionally disabled for visual clarity & FPS

      // ---------------------------------------------------------------------
      // STATE 1: Greet CEO
      // ---------------------------------------------------------------------
      if (c.state === 'greet_ceo') {
        c.stateTimer -= dt;
        const dx = this.playerPos.x - c.pos.x;
        const dz = this.playerPos.z - c.pos.z;
        if (dx * dx + dz * dz > 0.001) {
          c.mesh.rotation.y = Math.atan2(dx, dz);
        }
        ud.leftLeg.rotation.x = 0;
        ud.rightLeg.rotation.x = 0;
        ud.leftArm.rotation.x = 0;
        ud.leftArm.rotation.z = 0;
        if (ud.torso) ud.torso.rotation.x = 0;
        ud.rightArm.rotation.x = -2.35 + Math.sin(this.elapsed * 14) * 0.35;
        ud.rightArm.rotation.z = 0.22 + Math.cos(this.elapsed * 14) * 0.18;
        if (c.stateTimer <= 0) {
          c.state = 'stroll';
          ud.rightArm.rotation.x = 0;
          ud.rightArm.rotation.z = 0;
        }
        continue;
      }

      // Storm override: redirect toward nearest shelter building if not already heading to one
      if (isStorm) {
        const curTargetWp = ISLAND_WAYPOINTS[c.targetWpKey];
        if (!curTargetWp || !curTargetWp.isShelter) {
          const pool = c.useResortLoop ? RESORT_WP_KEYS : MAINLAND_WP_KEYS;
          let bestShelterKey = pool[0];
          let bestDist = 9999;
          for (let k = 0; k < pool.length; k++) {
            const wp = ISLAND_WAYPOINTS[pool[k]];
            if (wp && wp.isShelter) {
              const d = Math.hypot(wp.x - c.pos.x, wp.z - c.pos.z);
              if (d < bestDist) {
                bestDist = d;
                bestShelterKey = wp.id;
              }
            }
          }
          const sWp = ISLAND_WAYPOINTS[bestShelterKey];
          if (sWp) {
            c.targetWpKey = sWp.id;
            c.targetPos.set(sWp.x, 0, sWp.z);
            c.state = 'stroll';
          }
        }
      } else if (c.state === 'shelter') {
        c.state = 'stroll';
      }

      // ---------------------------------------------------------------------
      // STATE 2: Strolling Along Island Waypoints with Collision Avoidance
      // ---------------------------------------------------------------------
      if (c.state === 'stroll' || c.state === 'walk') {
        const dx = c.targetPos.x - c.pos.x;
        const dz = c.targetPos.z - c.pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.42) {
          const inv = 1 / Math.max(0.0001, dist);
          const desiredNx = dx * inv;
          const desiredNz = dz * inv;

          // Compute real-time collision avoidance against Player, Vehicles, NPCs & Buildings
          const avoid = this.computeCitizenAvoidance(c, desiredNx, desiredNz, playerOnLand);
          c.evadingPlayer = avoid.evadingPlayer;

          let moveX = desiredNx + avoid.steerX;
          let moveZ = desiredNz + avoid.steerZ;
          const moveLen = Math.hypot(moveX, moveZ);
          if (moveLen > 0.0001) {
            moveX /= moveLen;
            moveZ /= moveLen;
          } else {
            moveX = desiredNx;
            moveZ = desiredNz;
          }

          const weatherMult = isStorm ? 1.65 : (isNight && c.arch.group !== 'security' ? 0.86 : 1.0);
          // Smooth deceleration when approaching building POI
          const arrivalSlowdown = dist < 1.5 ? THREE.MathUtils.clamp(dist / 1.5, 0.55, 1.0) : 1.0;
          const targetSpeed = (c.arch.speed || 2.4) * weatherMult * avoid.speedFactor * arrivalSlowdown;
          c.currentSpeed = THREE.MathUtils.lerp(c.currentSpeed || targetSpeed, targetSpeed, Math.min(1, dt * 8));

          c.pos.x += moveX * c.currentSpeed * dt;
          c.pos.z += moveZ * c.currentSpeed * dt;
          c.pos.y = c.pos.z > 24.5 && !c.useResortLoop ? 0.72 : 0;
          c.mesh.position.copy(c.pos);

          const targetYaw = Math.atan2(moveX, moveZ);
          let diff = targetYaw - c.mesh.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          c.mesh.rotation.y += diff * Math.min(1, dt * 10);

          // Articulated walking limb kinematics
          c.walkPhase += dt * c.currentSpeed * 3.6;
          const swing = Math.sin(c.walkPhase) * (isStorm ? 0.72 : 0.52);
          ud.leftLeg.rotation.x = swing;
          ud.rightLeg.rotation.x = -swing;
          ud.leftArm.rotation.x = -swing * 0.65;
          ud.leftArm.rotation.z = 0;
          ud.rightArm.rotation.x = swing * 0.65;
          ud.rightArm.rotation.z = 0;
          if (ud.torso) ud.torso.rotation.x = THREE.MathUtils.lerp(ud.torso.rotation.x, isStorm ? 0.14 : 0, Math.min(1, dt * 6));
          if (ud.head) {
            if (c.evadingPlayer) {
              // Glance politely toward the player while sidestepping
              const pYaw = Math.atan2(this.playerPos.x - c.pos.x, this.playerPos.z - c.pos.z) - c.mesh.rotation.y;
              ud.head.rotation.y = THREE.MathUtils.clamp(pYaw, -0.55, 0.55);
            } else {
              ud.head.rotation.y = Math.sin(c.walkPhase * 0.5) * 0.1;
            }
            ud.head.rotation.x = 0;
          }
        } else {
          // Reached Building POI Waypoint -> Transition to Building Interaction or Storm Shelter
          c.evadingPlayer = false;
          c.currentWpKey = c.targetWpKey;
          const reachedWp = ISLAND_WAYPOINTS[c.currentWpKey] || ISLAND_WAYPOINTS.plaza_center;
          c.interactLabel = reachedWp.interactAction || `${c.arch.bubbles[0]} ${reachedWp.buildingLabel || ''}`;
          c.interactPose = reachedWp.pose || 'inspect';
          c.photoFlashed = false;
          c.chatPartnerIdx = -1;

          // Check if another citizen is already interacting at this building to form a social conversation pair
          for (let j = 0; j < this.aiCitizens.length; j++) {
            const other = this.aiCitizens[j];
            if (other !== c && other.state === 'interact_building' && other.currentWpKey === c.currentWpKey) {
              if (c.pos.distanceTo(other.pos) < 2.6) {
                c.chatPartnerIdx = j;
                break;
              }
            }
          }

          if (isStorm && reachedWp.isShelter) {
            c.state = 'shelter';
            c.interactLabel = reachedWp.buildingLabel || 'Mái hiên';
            c.stateTimer = 3.0;
          } else {
            c.state = 'interact_building';
            c.stateTimer = 2.6 + (c.idx % 4) * 0.95;
          }
        }
      }
      // ---------------------------------------------------------------------
      // STATE 3: Stopping & Interacting with 3D Buildings (or Storm Shelter)
      // ---------------------------------------------------------------------
      else if (c.state === 'interact_building' || c.state === 'admire' || c.state === 'shelter') {
        c.stateTimer -= dt;
        c.evadingPlayer = false;

        // Even while stopped at a building, gently step aside if player or another NPC walks too close
        const avoid = this.computeCitizenAvoidance(c, 0, 0, playerOnLand);
        if (Math.abs(avoid.steerX) > 0.05 || Math.abs(avoid.steerZ) > 0.05) {
          c.pos.x += avoid.steerX * dt * 1.35;
          c.pos.z += avoid.steerZ * dt * 1.35;
          c.mesh.position.copy(c.pos);
        }

        // Smoothly orient toward either a social chat partner or the building's 3D focal point (`lookAt`)
        const curWp = ISLAND_WAYPOINTS[c.currentWpKey] || ISLAND_WAYPOINTS.plaza_center;
        let lookTargetX = curWp.lookAt ? curWp.lookAt.x : c.pos.x;
        let lookTargetZ = curWp.lookAt ? curWp.lookAt.z : c.pos.z + 4;
        if (c.chatPartnerIdx >= 0 && this.aiCitizens[c.chatPartnerIdx]) {
          const partner = this.aiCitizens[c.chatPartnerIdx];
          lookTargetX = partner.pos.x;
          lookTargetZ = partner.pos.z;
        }
        const ldx = lookTargetX - c.pos.x;
        const ldz = lookTargetZ - c.pos.z;
        if (ldx * ldx + ldz * ldz > 0.01) {
          const desiredYaw = Math.atan2(ldx, ldz);
          let yDiff = desiredYaw - c.mesh.rotation.y;
          while (yDiff > Math.PI) yDiff -= Math.PI * 2;
          while (yDiff < -Math.PI) yDiff += Math.PI * 2;
          c.mesh.rotation.y += yDiff * Math.min(1, dt * 7);
        }

        // Return legs to standing rest
        ud.leftLeg.rotation.x = THREE.MathUtils.lerp(ud.leftLeg.rotation.x, 0, Math.min(1, dt * 8));
        ud.rightLeg.rotation.x = THREE.MathUtils.lerp(ud.rightLeg.rotation.x, 0, Math.min(1, dt * 8));

        // Multi-Joint 3D Building Interaction Kinematics
        const t = this.elapsed * 3.2 + c.idx;
        if (c.chatPartnerIdx >= 0) {
          // Animated peer conversation gestures
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, -0.55 + Math.sin(t * 1.5) * 0.22, Math.min(1, dt * 6));
          ud.rightArm.rotation.x = THREE.MathUtils.lerp(ud.rightArm.rotation.x, -0.65 + Math.cos(t * 1.7) * 0.28, Math.min(1, dt * 6));
          if (ud.head) {
            ud.head.rotation.x = Math.sin(t * 2.2) * 0.1;
            ud.head.rotation.y = Math.cos(t * 1.1) * 0.15;
          }
        } else if (c.interactPose === 'photo' || c.arch.prop === 'camera') {
          // Raise both hands to frame a photo of the landmark + trigger camera shutter flash particle once
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, -1.18, Math.min(1, dt * 7));
          ud.leftArm.rotation.z = THREE.MathUtils.lerp(ud.leftArm.rotation.z, -0.22, Math.min(1, dt * 7));
          ud.rightArm.rotation.x = THREE.MathUtils.lerp(ud.rightArm.rotation.x, -1.22, Math.min(1, dt * 7));
          ud.rightArm.rotation.z = THREE.MathUtils.lerp(ud.rightArm.rotation.z, 0.22, Math.min(1, dt * 7));
          if (ud.head) ud.head.rotation.x = -0.08;
          if (!c.photoFlashed && c.stateTimer < 1.4 && this.activeProfile !== 'low') {
            c.photoFlashed = true;
            this._tmpVec.set(c.pos.x + Math.sin(c.mesh.rotation.y) * 0.45, c.pos.y + 1.55, c.pos.z + Math.cos(c.mesh.rotation.y) * 0.45);
            this.world.spawnParticles(this._tmpVec, 0xfef08a, 2);
          }
        } else if (c.interactPose === 'point_up') {
          // Gaze up at Corporate HQ tower / Lighthouse and point upward
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, -0.35, Math.min(1, dt * 6));
          ud.rightArm.rotation.x = THREE.MathUtils.lerp(ud.rightArm.rotation.x, -1.75 + Math.sin(t) * 0.15, Math.min(1, dt * 6));
          if (ud.head) {
            ud.head.rotation.x = THREE.MathUtils.lerp(ud.head.rotation.x, -0.26, Math.min(1, dt * 6));
            ud.head.rotation.y = Math.sin(t * 0.7) * 0.18;
          }
        } else if (c.interactPose === 'sip_coffee' || c.arch.prop === 'coffee') {
          // Relax at Harbor Boardwalk Café / Resort and sip coffee
          const sipWave = Math.sin(t * 0.85) > 0.2 ? -1.1 : -0.55;
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, sipWave, Math.min(1, dt * 5));
          ud.rightArm.rotation.x = THREE.MathUtils.lerp(ud.rightArm.rotation.x, -0.2, Math.min(1, dt * 5));
          if (ud.head) ud.head.rotation.y = Math.sin(t * 0.6) * 0.28;
        } else if (c.interactPose === 'wave_ship') {
          // Wave at Cargo Ships / Freight Train at the Pier & Station
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, 0, Math.min(1, dt * 6));
          ud.rightArm.rotation.x = -2.15 + Math.sin(this.elapsed * 11 + c.idx) * 0.32;
          ud.rightArm.rotation.z = 0.2 + Math.cos(this.elapsed * 11 + c.idx) * 0.16;
        } else {
          // Default 'inspect' pose: lean slightly forward examining Sawmill / Furniture / Airport blueprints
          if (ud.torso) ud.torso.rotation.x = THREE.MathUtils.lerp(ud.torso.rotation.x, 0.11, Math.min(1, dt * 6));
          ud.leftArm.rotation.x = THREE.MathUtils.lerp(ud.leftArm.rotation.x, -0.82, Math.min(1, dt * 6));
          ud.rightArm.rotation.x = THREE.MathUtils.lerp(ud.rightArm.rotation.x, -0.68 + Math.sin(t * 1.4) * 0.22, Math.min(1, dt * 6));
          if (ud.head) ud.head.rotation.y = Math.sin(t * 0.8) * 0.22;
        }

        // Finish building interaction & pick next connected waypoint
        if (c.stateTimer <= 0 && !(isStorm && c.state === 'shelter')) {
          ud.leftArm.rotation.z = 0;
          ud.rightArm.rotation.z = 0;
          if (ud.torso) ud.torso.rotation.x = 0;
          if (ud.head) ud.head.rotation.x = 0;
          this.pickNextCitizenWaypoint(c);
        }
      }
    }
  }

  updatePet(dt) {
    if (!this.petModel || !this.petModel.visible) return;
    const offsetX = -Math.cos(this.playerYaw) * 1.45;
    const offsetZ = Math.sin(this.playerYaw) * 1.45;
    this._tmpVec.set(this.playerPos.x + offsetX, this.playerPos.y, this.playerPos.z + offsetZ);
    this.petPos.lerp(this._tmpVec, Math.min(1, dt * 6));
    this.petModel.position.copy(this.petPos);
    this.petModel.rotation.y = this.playerYaw;

    if (this.petModel.userData.isFlyer) {
      const flap = Math.sin(this.elapsed * 12) * 0.35;
      this.petModel.userData.wingL.rotation.z = flap;
      this.petModel.userData.wingR.rotation.z = -flap;
      this.petModel.position.y += Math.sin(this.elapsed * 3) * 0.16;
    }
  }

  updateDayNightAndWeather(dt) {
    const mode = gameState.weatherMode || 'auto';
    if (mode === 'auto') {
      // Full 24h cycle every 6 minutes (360 seconds => 24/360 = 0.06667 hr/s)
      gameState.worldClockHours = ((gameState.worldClockHours || 10.5) + dt * 0.06667) % 24;
    } else {
      const preset = WEATHER_PRESETS[mode];
      if (preset && typeof preset.hour === 'number') {
        gameState.worldClockHours = preset.hour;
      }
    }

    const hr = gameState.worldClockHours || 10.5;
    const isStorm = stormState.active || mode === 'storm';

    // Compute smooth nightFactor (0 = midday, 1 = deep night 21:00..04:30)
    let nightFactor = 0;
    if (hr >= 20.5 || hr < 4.8) {
      nightFactor = 1.0;
    } else if (hr >= 17.5 && hr < 20.5) {
      nightFactor = (hr - 17.5) / 3.0;
    } else if (hr >= 4.8 && hr < 7.2) {
      nightFactor = 1.0 - (hr - 4.8) / 2.4;
    }
    if (isStorm) nightFactor = Math.max(nightFactor, 0.55);

    if (Math.abs(nightFactor - this.lastAppliedNightFactor) > 0.04) {
      this.lastAppliedNightFactor = nightFactor;
      this.world.applyNightMode(nightFactor);
    }

    // Keep spinning helipad beacon & docked helicopter rotor idle spin
    if (this.world.helipad?.userData?.beacon) {
      this.world.helipad.userData.beacon.rotation.y += dt * 4.5;
    }
    if (this.controlMode !== 'heli' && this.drivableHeli?.userData?.mainRotor) {
      this.drivableHeli.userData.mainRotor.rotation.y += dt * 1.4;
    }

    if (!(this.scene.background instanceof THREE.Color) || !this.scene.fog) return;

    // Sun & Moon orbital trajectory across the sky
    const sunAngle = ((hr - 6.0) / 24.0) * Math.PI * 2;
    const sunElev = Math.sin(sunAngle);
    this.sunLight.position.set(
      Math.cos(sunAngle) * 38,
      Math.max(10, Math.abs(sunElev) * 44 + 8),
      18 + Math.sin(sunAngle * 0.5) * 12
    );

    if (isStorm) {
      this.scene.background.lerpColors(this._daySkyBase, this._stormSkyColor, 0.78);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._stormFogColor, 0.8);
      this.sunLight.intensity = 1.3;
      this.hemiLight.intensity = 0.65;
    } else if (hr >= 5.0 && hr < 7.8) {
      // Dawn / Binh Minh
      const t = 1 - Math.abs(hr - 6.4) / 1.4;
      this.scene.background.lerpColors(this._daySkyBase, this._dawnSkyColor, THREE.MathUtils.clamp(t, 0, 1) * 0.7);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._dawnFogColor, THREE.MathUtils.clamp(t, 0, 1) * 0.65);
      this.sunLight.intensity = 1.6 + (1 - nightFactor) * 0.55;
      this.hemiLight.intensity = 0.75;
    } else if (hr >= 16.5 && hr < 19.8) {
      // Sunset / Hoang Hon
      const t = 1 - Math.abs(hr - 18.15) / 1.65;
      this.scene.background.lerpColors(this._daySkyBase, this._sunsetSkyColor, THREE.MathUtils.clamp(t, 0, 1) * 0.78);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._sunsetFogColor, THREE.MathUtils.clamp(t, 0, 1) * 0.72);
      this.sunLight.intensity = 1.35 + (1 - nightFactor) * 0.7;
      this.hemiLight.intensity = 0.7;
    } else if (nightFactor > 0.15) {
      // Starry Night / Dem Sao (keep crisp readability when PointLights are off in Max-FPS mode)
      this.scene.background.lerpColors(this._daySkyBase, this._nightSkyColor, nightFactor * 0.92);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._nightFogColor, nightFactor * 0.9);
      this.sunLight.intensity = THREE.MathUtils.lerp(2.1, 0.74, nightFactor);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.95, 0.58, nightFactor);
    } else {
      // Bright Sunlit Coastal Day
      const goldenBlend = this.activeProfile === 'high'
        ? (0.5 - 0.5 * Math.cos(this.elapsed * 0.045)) * 0.25
        : 0;
      this.scene.background.lerpColors(this._daySkyBase, this._skyGoldenColor, goldenBlend);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._fogGoldenColor, goldenBlend);
      this.sunLight.intensity = this.activeProfile === 'low' ? 2.1 : 2.38 - goldenBlend * 0.2;
      this.hemiLight.intensity = this.activeProfile === 'low' ? 1.08 : this.activeProfile === 'balanced' ? 0.94 : 0.84;
    }

    // Sync photorealistic ocean shader & atmospheric sky dome with live sun & weather
    this.world?.updateOceanLighting(
      this.sunLight.position,
      this.sunLight.color,
      this.scene.background,
      this.scene.fog.color,
      this.scene.fog.density || 0.0044,
      nightFactor
    );
  }

  updateCamera(dt) {
    const isAir = this.controlMode === 'plane' || this.controlMode === 'heli';
    const activeDist = isAir
      ? Math.max(this.camDist, 23.5)
      : this.controlMode === 'yacht'
        ? Math.max(this.camDist, 21.5)
        : this.controlMode === 'yard_vehicle'
          ? Math.max(this.camDist, 19.5)
          : this.camDist;

    const targetFov = isAir
      ? 48 + Math.min(8, (this.vehicleSpeed / 46) * 8)
      : this.controlMode === 'yacht'
        ? 51
        : this.cameraMode === 'tactical'
          ? 44
          : 48;

    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 5));
      this.camera.updateProjectionMatrix();
    }

    if (this.cameraMode === 'tactical' && this.controlMode === 'foot') {
      // High-altitude RTS overview of Sawmill, Railway, Helipad & Harbor
      this._camDesired.set(this.playerPos.x + 17, 50, this.playerPos.z + 31);
      this._camLook.set(this.playerPos.x, 0.8, this.playerPos.z + 2);
    } else if (this.cameraMode === 'orbit' && this.controlMode === 'foot') {
      // Smooth 360-degree cinematic showcase around the 3-zone city center
      this.orbitAngle += dt * 0.24;
      const rad = 52;
      this._camDesired.set(
        5 + Math.sin(this.orbitAngle) * rad,
        24.5,
        -38 + Math.cos(this.orbitAngle) * rad
      );
      this._camLook.set(5, 2.2, -38);
    } else if (this.cameraMode === 'train' && (gameState.railwayTier || 0) >= 1 && this.world.railwaySystem?.userData?.trainGroup) {
      // Follow the animated 3D Industrial Freight Train along the East Infrastructure Railway Line
      const tz = this.world.railwaySystem.userData.trainGroup.position.z;
      this._camDesired.set(93.5, 10.5, tz + 12.5);
      this._camLook.set(106.0, 2.2, tz);
    } else {
      // Standard smooth follow camera
      const camHeight = Math.sin(this.camPitch) * activeDist;
      const camHoriz = Math.cos(this.camPitch) * activeDist;
      this._camDesired.set(
        this.playerPos.x + Math.sin(this.camYaw) * camHoriz,
        this.playerPos.y + camHeight + 1.4,
        this.playerPos.z + Math.cos(this.camYaw) * camHoriz
      );
      this._camLook.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
    }

    if (this.screenShake > 0.001) {
      const s = this.screenShake;
      this._camDesired.x += Math.sin(this.elapsed * 58) * s;
      this._camDesired.y += Math.cos(this.elapsed * 64) * s * 0.8;
      this.screenShake = Math.max(0, this.screenShake - dt * 1.4);
    }

    const alpha = 1 - Math.exp(-8.5 * dt);
    this.camera.position.lerp(this._camDesired, alpha);
    if (this.world?.skyDome) {
      this.world.skyDome.position.copy(this.camera.position);
    }
    this.camera.lookAt(this._camLook);
  }

  // Zero-allocation visibility toggle on pre-pooled Sawmill slots
  syncSawmillVisuals() {
    if (!this.world?.sawmill) return;
    const { visualBufferGroup, palletSlots, plankSlots } = this.world.sawmill.userData;

    if (this.lastVisualBuffer !== gameState.sawmillBuffer && visualBufferGroup) {
      this.lastVisualBuffer = gameState.sawmillBuffer;
      const shown = Math.min(visualBufferGroup.children.length, gameState.sawmillBuffer);
      for (let i = 0; i < visualBufferGroup.children.length; i++) {
        visualBufferGroup.children[i].visible = i < shown;
      }
    }

    if (this.lastVisualPallets !== gameState.pallets && palletSlots) {
      this.lastVisualPallets = gameState.pallets;
      const pShown = Math.min(palletSlots.length, gameState.pallets);
      for (let i = 0; i < palletSlots.length; i++) {
        palletSlots[i].visible = i < pShown;
      }
    }

    if (this.lastVisualPlanks !== gameState.planks && plankSlots) {
      this.lastVisualPlanks = gameState.planks;
      const plShown = Math.min(plankSlots.length, gameState.planks);
      for (let i = 0; i < plankSlots.length; i++) {
        plankSlots[i].visible = i < plShown;
      }
    }
  }

  spawnWorldText(worldPos, text, kind = 'log') {
    if (this.paused) return;
    this._projVec.copy(worldPos);
    this._projVec.y += 2.2;
    this._projVec.project(this.camera);
    if (this._projVec.z > 1) return;
    const sx = (this._projVec.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-this._projVec.y * 0.5 + 0.5) * window.innerHeight;
    this.ui.spawnWorldFloat(sx, sy, text, kind);
  }

  // -------------------------------------------------------------------------
  // 6. Real-Time WebSocket Multiplayer
  // -------------------------------------------------------------------------
  connectMultiplayer() {
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}`;
      this.ws = new WebSocket(url);

      this.ws.addEventListener('open', () => {
        this.ws.send(JSON.stringify({
          type: 'join',
          nickname: gameState.username || 'Chủ tịch',
          empireName: gameState.empireName || 'TimberPort Empire',
          skin: gameState.equippedSkin,
          level: gameState.level,
          x: this.playerPos.x,
          z: this.playerPos.z
        }));
      });

      this.ws.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'init') {
            this.myNetId = msg.yourId;
            for (const p of msg.players || []) {
              if (p.id !== this.myNetId) this.upsertRemotePlayer(p);
            }
          } else if (msg.type === 'player_join' && msg.player) {
            if (msg.player.id !== this.myNetId) this.upsertRemotePlayer(msg.player);
          } else if (msg.type === 'player_move' && msg.id !== this.myNetId) {
            const rp = this.remotePlayers.get(msg.id);
            if (rp) {
              rp.targetPos.set(msg.x || 0, msg.y || 0, msg.z || 0);
              rp.targetYaw = msg.rotY || 0;
            }
            } else if (msg.type === 'player_leave') {
              const rp = this.remotePlayers.get(msg.id);
              if (rp) {
                this.scene.remove(rp.mesh);
                disposeObject3D(rp.mesh);
                this.remotePlayers.delete(msg.id);
              }
            } else if (msg.type === 'city_state_sync' && (msg.cityState || msg.city)) {
              syncMetropolisFromServer(msg.cityState || msg.city);
              if (!this.ui.els.hubModal.hidden && this.ui.activeTab === 'boardroom') {
                this.ui.renderHub();
              }
            } else if (msg.type === 'city_announcement' && (msg.announcement || msg.message)) {
              if (msg.cityState || msg.city) syncMetropolisFromServer(msg.cityState || msg.city);
              this.ui.toast(`🏙️ ${msg.announcement || msg.message}`);
              if (!this.ui.els.hubModal.hidden && this.ui.activeTab === 'boardroom') {
                this.ui.renderHub();
              }
            } else if (msg.type === 'market_update') {
              if (Array.isArray(msg.listings)) {
                syncMetropolisFromServer({ marketListings: msg.listings });
              }
              if (msg.announcement) this.ui.toast(msg.announcement);
              if (!this.ui.els.hubModal.hidden && this.ui.activeTab === 'boardroom') {
                this.ui.renderHub();
              }
            } else if (msg.type === 'market_item_bought') {
              const l = msg.listing || msg;
              const sellerName = l.seller || l.sellerName;
              const buyerName = l.buyer || msg.buyerName || 'Thương gia';
              const gain = Number(l.price ?? msg.totalPrice ?? 0);
              if (sellerName === (gameState.username || 'Chủ tịch') && gain > 0) {
                gameState.cash += gain;
                recordRevenue('market', gain);
                sound.playCash();
                this.ui.toast(`🤝 ${buyerName} đã mua lô hàng của bạn trên Chợ Liên Server (+$${gain.toLocaleString()})!`);
                saveGameServer();
                this.ui.refreshHUD();
              }
            }
          } catch (e) {}
        });
      } catch (e) {}
    }

  contributeLandmark(woodAmount = 50, moneyAmount = 5000) {
    const w = Math.max(0, Math.floor(woodAmount));
    const m = Math.max(0, Math.floor(moneyAmount));
    if (gameState.planks < w || gameState.cash < m) {
      this.ui.toast(`⚠️ Cần tối thiểu ${w} Ván xẻ & $${m.toLocaleString()} để đóng góp Kỳ Quan Server!`);
      return false;
    }
    gameState.planks -= w;
    gameState.cash -= m;
    recordPnlExpense('upgradeSpend', m);
    logTransaction('landmark', `Đóng góp Kỳ Quan Đô Thị (${w} Ván + $${m.toLocaleString()})`, -m, 3);
    gameState.gems += 3;
    addVipXp(30);
    addSeasonXp(25);
    sound.playUpgrade();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'city_contribute',
        planks: w,
        money: m
      }));
    } else {
      metropolisState.totalWoodContributed = (metropolisState.totalWoodContributed || 0) + w;
      metropolisState.totalMoneyContributed = (metropolisState.totalMoneyContributed || 0) + m;
    }

    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    this.ui.renderHub();
    this.ui.toast(`🏙️ Đã đóng góp ${w} Ván & $${m.toLocaleString()} xây Kỳ Quan (+3 💎)!`);
    return true;
  }

  listMarketItem(resource = 'planks', amount = 25, price = 1500) {
    const qty = Math.max(1, Math.floor(Number(amount) || 10));
    const ask = Math.max(100, Math.floor(Number(price) || 1000));
    const stock = Math.floor(gameState[resource] || 0);
    if (stock < qty) {
      this.ui.toast('⚠️ Kho không đủ số lượng hàng để treo bán Liên Server!');
      return false;
    }
    gameState[resource] -= qty;
    sound.playCash();
    const priceEach = Math.max(1, Math.round(ask / qty));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'market_list_item',
        item: resource,
        quantity: qty,
        priceEach
      }));
    } else {
      metropolisState.marketListings = [
        {
          id: 'item_' + Date.now(),
          seller: gameState.username || 'Chủ tịch',
          empireName: gameState.empireName || 'TimberPort Empire',
          resource,
          amount: qty,
          price: ask,
          createdAt: Date.now()
        },
        ...(metropolisState.marketListings || [])
      ].slice(0, 20);
    }
    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    this.ui.renderHub();
    this.ui.toast(`📦 Đã niêm yết lô hàng lên Sàn Giao Dịch Liên Server!`);
    return true;
  }

  buyMarketItem(listingId) {
    const item = (metropolisState.marketListings || []).find((x) => x.id === listingId);
    if (!item) {
      this.ui.toast('⚠️ Lô hàng này đã được mua hoặc hết hạn!');
      return false;
    }
    if (gameState.cash < item.price) {
      this.ui.toast('⚠️ Không đủ tiền mặt để mua lô hàng này!');
      return false;
    }
    gameState.cash -= item.price;
    const key = item.resource in gameState ? item.resource : 'planks';
    gameState[key] = (gameState[key] || 0) + (Number(item.amount) || 0);
    recordPnlExpense('upgradeSpend', item.price);
    logTransaction('market', `Thu mua ${item.amount} ${item.resource} từ ${item.seller}`, -item.price, 0);
    sound.playCash();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'market_buy_item',
        listingId
      }));
    } else {
      metropolisState.marketListings = (metropolisState.marketListings || []).filter((x) => x.id !== listingId);
    }
    this.syncSawmillVisuals();
    saveGameServer();
    this.ui.refreshHUD();
    this.ui.renderHub();
    this.ui.toast(`🤝 Đã mua +${item.amount} ${item.resource} từ ${item.seller}!`);
    return true;
  }

  upsertRemotePlayer(p) {
    if (this.remotePlayers.has(p.id)) return;
    const mesh = createPlayerModel(getSkinData(p.skin || 'classic'), 0);
    mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
    const badge = makeWorldBadgeSprite(p.nickname || 'Thương gia', p.empireName || 'TimberPort', '#38bdf8');
    badge.position.set(0, 2.75, 0);
    mesh.add(badge);
    this.scene.add(mesh);
    this.remotePlayers.set(p.id, {
      mesh,
      username: p.nickname || 'Thương gia',
      empireName: p.empireName || 'TimberPort',
      level: p.level || 1,
      targetPos: new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0),
      targetYaw: p.rotY || 0
    });
  }

  getOnlinePlayersList() {
    const list = [{
      username: gameState.username || 'Chủ tịch',
      empireName: gameState.empireName || 'TimberPort Empire',
      level: gameState.level || 1,
      vipLevel: gameState.vipLevel || 0,
      prestigeLevel: gameState.prestigeLevel || 0,
      yachtTier: gameState.yachtTier || 0,
      money: Math.floor(gameState.cash || 0)
    }];
    for (const rp of this.remotePlayers.values()) {
      list.push({
        username: rp.username,
        empireName: rp.empireName,
        level: rp.level,
        vipLevel: 0,
        prestigeLevel: 0,
        yachtTier: 0,
        money: 0
      });
    }
    return list;
  }

  updateRemotePlayers(dt) {
    const a = Math.min(1, dt * 10);
    for (const rp of this.remotePlayers.values()) {
      rp.mesh.position.lerp(rp.targetPos, a);
      rp.mesh.rotation.y += (rp.targetYaw - rp.mesh.rotation.y) * a;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TimberPortEngine();
});
