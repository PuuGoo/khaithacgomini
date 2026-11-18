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
  marketState,
  updateMarketPrices,
  calculateOfflineEarnings,
  getBackpackCapacity,
  getActiveBranch,
  getSkinData,
  getRevenueMultiplier,
  getContractMultiplier,
  getManagerBonus,
  getPrestigeMultiplier,
  getActiveEvent,
  getUpgradeCost,
  getSawmillVisualTier,
  getHarborVisualTier,
  evaluateBadgeUnlocks,
  recordRevenue,
  addVipXp,
  addSeasonXp,
  advanceDailyQuest,
  generateNextContract,
  tickTimedEvents,
  tickVipRushOrder,
  tickComboTimer,
  tickAuctionTimer,
  saveGameLocal,
  saveGameServer,
  loadGameLocal
} from './state.js';
import { sound } from './audio.js';
import { setTextureAnisotropy, makeWorldBadgeSprite, disposeAllCachedTextures } from './textures.js';
import {
  createPlayerModel,
  updatePlayerModelSkin,
  syncPlayerBackLogs,
  createPetModel,
  createVehicleModel,
  createFishingBoatModel,
  createWorkerModel,
  disposeObject3D
} from './models.js';
import { WorldManager, WORLD_BOUNDS, ZONES } from './world.js';
import { UIManager } from './ui.js';

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

    this.initThree();

    this.world = new WorldManager(this.scene, { lowSpec: this.activeProfile === 'low' });
    this.applyBranchAtmosphere(getActiveBranch());
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());

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

    // Player & simulation state
    this.playerPos = new THREE.Vector3(0, 0, 2);
    this.playerYaw = 0;
    this.inVehicle = false;
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

    // Camera Orbit state
    this.camYaw = 0.42;
    this.camPitch = 0.62;
    this.camDist = 17.5;

    // Spawn Player, Pet, Parked Vehicle, AI Fleet
    this.playerModel = createPlayerModel(getSkinData(), gameState.vipLevel);
    this.playerModel.position.copy(this.playerPos);
    this.scene.add(this.playerModel);
    syncPlayerBackLogs(this.playerModel, gameState.logs);

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
      onQuickSellSawmill: () => this.sellAllAtSawmill(),
      onYachtChange: () => this.world?.syncYachtTier(gameState.yachtTier || 0),
      onSellCommodity: (key) => this.sellCommodityAtMarket(key),
      onBranchChange: (br) => {
        this.applyBranchAtmosphere(br);
        this.rebuildWorkforce();
        this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
      },
      onSkinChange: () => {
        updatePlayerModelSkin(this.playerModel, getSkinData(), gameState.vipLevel);
      },
      onPetChange: () => this.rebuildPet(),
      onVehicleChange: () => this.rebuildVehicle(),
      getOnlineCount: () => 1 + this.remotePlayers.size,
      getOnlinePlayers: () => this.getOnlinePlayersList(),
      getGraphicsInfo: () => this.getGraphicsInfo(),
      onGraphicsChange: (mode) => this.setGraphicsQuality(mode),
      onFlushGpu: () => this.flushGpuCaches()
    });

    this.bindInputs();
    this.bindLifecycle();
    this.connectMultiplayer();
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

    if (this.activeProfile === 'low' && gameState.graphicsQuality === 'auto') {
      this.ui.toast(`🛡️ Đã bật chế độ Tiết kiệm RAM/GPU (${this.hw.reason})`);
    }

    this.scheduleNextTick();
  }

  resolveProfile(mode) {
    if (mode === 'low' || mode === 'balanced' || mode === 'high') return mode;
    return this.hw.autoTier;
  }

  getGraphicsInfo() {
    const labels = { low: 'Tiết kiệm (<8GB RAM)', balanced: 'Cân bằng', high: 'Cao (GPU rời)' };
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
      240
    );

    const low = this.activeProfile === 'low';
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !low,
      powerPreference: low ? 'default' : 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.type = low ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
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
      this.scene.environmentIntensity = 0.72;
      roomEnv.dispose();
      pmrem.dispose();
    } else {
      this.scene.environment = null;
    }

    // 3-Point Outdoor Lighting Rig (Warm Sun + Cool Sky Fill + Sea Rim)
    const hemiIntensity = low ? 1.05 : 0.78;
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x455a3b, hemiIntensity);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e4, low ? 2.0 : 2.25);
    this.sunLight.position.set(28, 42, 18);
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 130;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.55);
    rimLight.position.set(-26, 18, -24);
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
      this.hemiLight.intensity = 1.05;
      this.sunLight.intensity = 2.0;
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.minFrameMs = 33.3; // Cap at ~30 FPS to prevent CPU/GPU thermal throttling & shared-RAM saturation
      setTextureAnisotropy(1);
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
      if (p === 'balanced') {
        this.renderer.setPixelRatio(Math.min(dpr, 1.25));
        const enableShadow = !this.isSoftwareGl;
        this.renderer.shadowMap.enabled = enableShadow;
        this.sunLight.castShadow = enableShadow;
        if (enableShadow && this.sunLight.shadow.mapSize.x !== 1024) {
          this.sunLight.shadow.map?.dispose();
          this.sunLight.shadow.map = null;
          this.sunLight.shadow.mapSize.set(1024, 1024);
        }
        this.minFrameMs = 22.0; // ~45 FPS
        setTextureAnisotropy(2);
      } else {
        this.renderer.setPixelRatio(Math.min(dpr, 2));
        const enableShadow = !this.isSoftwareGl;
        this.renderer.shadowMap.enabled = enableShadow;
        this.sunLight.castShadow = enableShadow;
        if (enableShadow && this.sunLight.shadow.mapSize.x !== 2048) {
          this.sunLight.shadow.map?.dispose();
          this.sunLight.shadow.map = null;
          this.sunLight.shadow.mapSize.set(2048, 2048);
        }
        this.minFrameMs = 0; // Uncapped VSync
        setTextureAnisotropy(Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));
      }
    }

    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setGraphicsQuality(mode) {
    gameState.graphicsQuality = mode;
    this.activeProfile = this.resolveProfile(mode);
    this.applyGraphicsSettings();
    this.world?.setLowSpec(this.activeProfile === 'low');
    this.rebuildVehicle();
    saveGameServer();
    this.ui.toast(`⚙️ Đã chuyển đồ họa: ${this.getGraphicsInfo().profileLabel}`);
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

    if (this.world) this.world.dispose();
    disposeObject3D(this.playerModel);
    disposeObject3D(this.petModel);
    disposeObject3D(this.parkedVehicle);
    this.aiWorkers.forEach((w) => disposeObject3D(w.mesh));
    this.aiForklifts.forEach((f) => disposeObject3D(f.mesh));
    this.fishingBoats.forEach((b) => disposeObject3D(b.mesh));
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
    this.scene.fog = new THREE.FogExp2(branch.fogColor, 0.0072);
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
      const startPos = new THREE.Vector3(-18 - idx * 2.5, 0, -14 + idx * 2);
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
      const startPos = new THREE.Vector3(6 + idx * 2.4, 0, -6 + idx * 3);
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
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      const code = e.code;
      this.keys.add(code);

      if (code === 'Escape') {
        document.getElementById('hub-modal').hidden = true;
        document.getElementById('account-modal').hidden = true;
        document.getElementById('leaderboard-modal').hidden = true;
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
      if (code === 'KeyR') {
        this.ui.activateBoost();
        return;
      }
      if (code === 'KeyE' || code === 'Space') {
        if (!this.ui.isAnyModalOpen()) {
          e.preventDefault();
          this.handleContextAction(code === 'Space');
        }
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
  // 4. Contextual Interactions (Vehicles, Quick-Sell, Harbor Export)
  // -------------------------------------------------------------------------
  getContextPromptState() {
    const distToHarbor = this.playerPos.distanceTo(ZONES.harborExport);
    const distToSawOut = this.playerPos.distanceTo(ZONES.sawOutput);
    const distToVeh = this.playerPos.distanceTo(this.vehiclePos);

    if (distToHarbor < 4.5 && (gameState.planks > 0 || gameState.pallets > 0 || gameState.cannedFish > 0)) {
      return { action: 'export', key: 'SPACE', label: 'Xuất khẩu Hợp đồng Cảng' };
    }
    if (distToSawOut < 4.2 && (gameState.planks > 0 || gameState.pallets > 0)) {
      return { action: 'sell_saw', key: 'SPACE', label: 'Bán nhanh Ván & Pallet' };
    }
    if (this.inVehicle) {
      return { action: 'vehicle', key: 'E', label: 'Xuống xe' };
    }
    if (distToVeh < 4.2) {
      const veh = VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
      return { action: 'vehicle', key: 'E', label: `Lái ${veh.name}` };
    }
    return null;
  }

  handleContextAction(preferSpace = false) {
    const prompt = this.getContextPromptState();
    if (!prompt) {
      if (this.inVehicle && !preferSpace) this.toggleVehicle();
      return;
    }
    if (prompt.action === 'vehicle') this.toggleVehicle();
    else if (prompt.action === 'export') this.handleDeliverContract(true);
    else if (prompt.action === 'sell_saw') this.sellAllAtSawmill();
  }

  toggleVehicle() {
    if (this.inVehicle) {
      this.inVehicle = false;
      this.vehiclePos.copy(this.playerPos);
      this.vehicleYaw = this.playerYaw;
      this.parkedVehicle.position.copy(this.vehiclePos);
      this.parkedVehicle.rotation.y = this.vehicleYaw;
      this.parkedVehicle.visible = true;
      this.playerModel.visible = true;
      this.playerPos.x += 1.6;
      sound.playChop(1.2);
      this.ui.toast('Đã xuống xe');
    } else {
      this.inVehicle = true;
      this.playerPos.copy(this.vehiclePos);
      this.playerYaw = this.vehicleYaw;
      this.playerModel.visible = false;
      this.parkedVehicle.visible = true;
      sound.playUpgrade();
      const veh = VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
      this.ui.toast(`🚘 Đang lái ${veh.name}`);
    }
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

  sellCommodityAtMarket(key) {
    const def = MARKET_COMMODITIES.find((c) => c.key === key);
    const entry = marketState.items[key];
    const qty = Math.floor(gameState[key] || 0);
    if (!def || !entry || qty <= 0) return false;

    const unitPrice = Math.round(def.basePrice * entry.mult * getRevenueMultiplier());
    const earned = qty * unitPrice;
    gameState[key] = 0;
    gameState.cash += earned;
    recordRevenue('market', earned);
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
      gameState.gems += ct.rewardGems;
      gameState.contractsCompleted += 1;
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
    this.playerPos.set(0, 0, 2);
    this.playerYaw = 0;
    this.inVehicle = false;
    this.playerModel.visible = true;
    syncPlayerBackLogs(this.playerModel, 0);
    this.applyBranchAtmosphere(getActiveBranch());
    this.rebuildWorkforce();
    this.world.syncEvolution(getSawmillVisualTier(), getHarborVisualTier());
    this.world.syncYachtTier(gameState.yachtTier || 0);
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

    this.fpsSamples++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.8) {
      this.currentFps = this.fpsSamples / this.fpsAccum;
      this.fpsSamples = 0;
      this.fpsAccum = 0;
    }

    this.updateTimers(dt);
    this.updatePlayerMovement(dt);
    this.updateChoppingAndHopper(dt);
    this.updateSawmillAndCannery(dt);
    this.updateArcadePads(dt);
    this.updateWorkforceAI(dt);
    this.updatePet(dt);
    this.updateRemotePlayers(dt);
    this.updateCamera(dt);

    this.world.update(dt, this.elapsed, gameState.sawmillBuffer > 0);

    // Subtle Golden-Hour Daylight Cycle (hardware-gated OFF on <8GB RAM low-spec laptops)
    if (this.activeProfile !== 'low' && this.scene.background instanceof THREE.Color && this.scene.fog) {
      const goldenBlend = (0.5 - 0.5 * Math.cos(this.elapsed * 0.045)) * 0.45;
      this.scene.background.lerpColors(this._daySkyBase, this._skyGoldenColor, goldenBlend);
      this.scene.fog.color.lerpColors(this._dayFogBase, this._fogGoldenColor, goldenBlend);
      this.sunLight.intensity = 2.25 - goldenBlend * 0.25;
    }

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.14) {
      this.hudSyncAccum = 0;
      const prompt = this.getContextPromptState();
      if (prompt) this.ui.setPrompt(true, prompt.key, prompt.label);
      else this.ui.setPrompt(false);
      this.ui.refreshHUD();
    }

    this.minimapAccum += dt;
    if (this.minimapAccum >= 0.16) {
      this.minimapAccum = 0;
      this.ui.renderMinimap(this.playerPos, this.playerYaw, this.world.trees, this.world.currentQuestTarget);
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
  }

  updatePlayerMovement(dt) {
    if (this.ui.isAnyModalOpen()) return;

    let ix = this.joyVec.x;
    let iy = this.joyVec.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;

    const len = Math.hypot(ix, iy);
    const moving = len > 0.08;

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

      if (this.inVehicle) {
        const veh = VEHICLES.find((v) => v.id === (gameState.equippedVehicle || 'forklift')) || VEHICLES[0];
        speed = veh.speed * (gameState.boostTimer > 0 ? 1.25 : 1.0);
      }

      this.playerPos.addScaledVector(this._moveDir, speed * dt);
      this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
      this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

      const onPier = this.playerPos.z > 24.5 && Math.abs(this.playerPos.x - 2) < 13.5;
      if (!onPier && this.playerPos.z > 25) {
        this.playerPos.z = 25;
      }
      this.playerPos.y = onPier ? 0.72 : 0;

      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (this.inVehicle ? 6 : 12);
    } else {
      this.walkPhase = 0;
    }

    if (this.inVehicle && this.parkedVehicle) {
      this.vehiclePos.copy(this.playerPos);
      this.vehicleYaw = this.playerYaw;
      this.parkedVehicle.position.copy(this.vehiclePos);
      this.parkedVehicle.rotation.y = this.vehicleYaw;
    } else {
      this.playerModel.position.copy(this.playerPos);
      this.playerModel.rotation.y = this.playerYaw;
      const { leftLeg, rightLeg, leftArm, rightArm } = this.playerModel.userData;
      const swing = moving ? Math.sin(this.walkPhase) * 0.65 : 0;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.7;
      if (this.chopSwing > 0) {
        this.chopSwing = Math.max(0, this.chopSwing - dt * 6);
        rightArm.rotation.x = -Math.sin(this.chopSwing * Math.PI) * 1.45;
      } else {
        rightArm.rotation.x = swing * 0.7;
      }
    }

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
        isChopping: this.chopSwing > 0,
        vehicle: this.inVehicle ? gameState.equippedVehicle : null
      }));
    }
  }

  updateChoppingAndHopper(dt) {
    this.chopCooldown = Math.max(0, this.chopCooldown - dt);
    this.unloadTimer = Math.max(0, this.unloadTimer - dt);

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

            const gained = Math.min(cap - gameState.logs, nearest.logYield);
            gameState.logs += gained;
            gameState.totalLogsCut += gained;
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
      gameState.freshFish += 1;
      if (gameState.freshFish >= 2) {
        gameState.freshFish -= 2;
        gameState.cannedFish += 1;
      }
    }

    if (this.playerPos.distanceTo(ZONES.sawOutput) < 3.4) {
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

    if (this.playerPos.distanceTo(ZONES.harborExport) < 4.0) {
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

    if (this.playerPos.distanceTo(ZONES.canneryDock) < 3.4 && gameState.cannedFish > 0) {
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

  updateWorkforceAI(dt) {
    const forestSpeedMult = 1 + getManagerBonus('forestSpeed');
    const workerYield = forestSpeedMult >= 1.48 ? 3 : 2;
    for (const w of this.aiWorkers) {
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
          } else {
            w.state = 'chopping';
            w.timer = 1.4 / forestSpeedMult;
          }
        }
      } else if (w.state === 'chopping') {
        w.timer -= dt;
        w.mesh.userData.rightArm.rotation.x = Math.sin(this.elapsed * 12) * 1.1;
        if (w.timer <= 0) {
          w.state = 'to_hopper';
          w.carrying = true;
          syncPlayerBackLogs(w.mesh, workerYield);
        }
      } else if (w.state === 'to_hopper') {
        const dist = w.pos.distanceTo(ZONES.hopper);
        if (dist > 1.8) {
          this._tmpVec.subVectors(ZONES.hopper, w.pos).normalize();
          w.pos.addScaledVector(this._tmpVec, 4.2 * forestSpeedMult * dt);
          w.mesh.rotation.y = Math.atan2(this._tmpVec.x, this._tmpVec.z);
        } else {
          gameState.sawmillBuffer += workerYield;
          gameState.totalLogsCut += workerYield;
          advanceDailyQuest('logsCut', workerYield);
          syncPlayerBackLogs(w.mesh, 0);
          w.carrying = false;
          w.state = 'to_tree';
          w.targetTree = null;
          this.syncSawmillVisuals();
        }
      }
      w.mesh.position.copy(w.pos);
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
  }

  updatePet(dt) {
    if (!this.petModel) return;
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

  updateCamera(dt) {
    const camHeight = Math.sin(this.camPitch) * this.camDist;
    const camHoriz = Math.cos(this.camPitch) * this.camDist;

    this._camDesired.set(
      this.playerPos.x + Math.sin(this.camYaw) * camHoriz,
      this.playerPos.y + camHeight + 1.4,
      this.playerPos.z + Math.cos(this.camYaw) * camHoriz
    );

    const alpha = 1 - Math.exp(-8.5 * dt);
    this.camera.position.lerp(this._camDesired, alpha);
    this._camLook.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
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
          }
        } catch (e) {}
      });
    } catch (e) {}
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
