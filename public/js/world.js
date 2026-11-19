/**
 * TimberPort 3D — Stylized Low-Poly PBR Peninsula Biome & World Systems
 * Zero-leak Object Pools (Particles, Flying Arcs), In-Place CanvasTexture Arcade Pads,
 * Adaptive Instanced Perimeter for <8GB RAM & Integrated GPUs
 */

import * as THREE from 'three';
import {
  getGrassTexture,
  getAsphaltTexture,
  getTravertineTexture,
  getGraniteCobbleTexture,
  getBoardwalkPlankTexture,
  getForestFloorTexture,
  getWaterfallTexture,
  getIlluminatedSignTexture,
  getClockFaceTexture,
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
  createCargoFreighterModel,
  createVipYachtModel,
  createGantryCraneModel,
  createAirportRunwayModel,
  createIslandOutpostModel,
  createSeaTreasureModel,
  createCorporateHqModel,
  createCloudsAndStormGroup,
  createStormBeaconModel,
  createFurnitureFactoryModel,
  createLighthouseModel,
  createDeepContainerPortModel,
  createRailwayAndTrainModel,
  createHelipadModel,
  syncBuildingEvolution,
  disposeObject3D
} from './models.js';
import { gameState, fleetMissionState, stormState, getUpgradeCost, UPGRADE_CATALOG } from './state.js';

export const WORLD_BOUNDS = { minX: -42, maxX: 42, minZ: -38, maxZ: 34 };
export const SEA_BOUNDS = { minX: -115, maxX: 115, minZ: 27.5, maxZ: 145 };
export const AIR_BOUNDS = { minX: -135, maxX: 135, minZ: -65, maxZ: 155, minY: 0.25, maxY: 34 };

export const ZONES = {
  hopper: new THREE.Vector3(-4, 0, -14),
  sawOutput: new THREE.Vector3(8, 0, -14),
  vehicleSpawn: new THREE.Vector3(-10, 0, 4),
  harborExport: new THREE.Vector3(8.5, 0.5, 31),
  canneryDock: new THREE.Vector3(-6.5, 0.5, 29),
  yachtBerth: new THREE.Vector3(14.5, 0.5, 29),
  deepPort: new THREE.Vector3(-20, 0.5, 29),
  railDepot: new THREE.Vector3(-17.2, 0, -10.5),
  helipad: new THREE.Vector3(19.5, 0, 15.5),
  runwayStart: new THREE.Vector3(30, 0.14, 13),
  hqPlaza: new THREE.Vector3(15, 0, 7),
  furnitureMill: new THREE.Vector3(16, 0, -24),
  lighthouse: new THREE.Vector3(-30, 0, 26),
  islandDock: new THREE.Vector3(41, 0.5, 86),
  islandAirDrop: new THREE.Vector3(52, 12, 92),
  harborAirDrop: new THREE.Vector3(2, 12, 32)
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
    this.cargoFreighter = null;
    this.vipYacht = null;
    this.gantryCrane = null;
    this.airport = null;
    this.islandOutpost = null;
    this.corporateHq = null;
    this.furnitureFactory = null;
    this.lighthouse = null;
    this.deepContainerPort = null;
    this.railwaySystem = null;
    this.helipad = null;
    this.streetLampMat = null;
    this.nightFactor = 0;
    this.trainSmokeTimer = 0;
    this.weatherGroup = null;
    this.stormBeacon = null;
    this._weatherDummy = new THREE.Object3D();
    this.seaTreasures = [];
    this.seaBeaconRing = null;
    this.airBeaconRing = null;
    this.harborBeaconLight = null;
    this.landPointLights = [];
    this.landDetailGroup = new THREE.Group();
    this.fountainJetsGroup = new THREE.Group();
    this.fountainJets = [];
    this.fountainRipple = null;
    this.ambientLifeGroup = new THREE.Group();
    this.waterfallFoamGroup = new THREE.Group();
    this.waterfallTex = null;
    this.waterfallFoamPuffs = [];
    this.seagulls = [];
    this.flags = [];
    this.smokePuffs = null;
    this.smokeData = [];
    this.forestLeaves = null;
    this.leafData = [];
    this._lifeDummy = new THREE.Object3D();
    this.questRing = null;
    this.currentQuestTarget = ZONES.hopper;

    this.buildTerrainAndOcean();
    this.buildLuxuryBoulevardsAndParking();
    this.buildExecutivePlazaAndFountain();
    this.buildCoastalPromenadeAndFishery();
    this.buildForestEcology();
    this.buildMountainWaterfallPond();
    this.buildLandmarksAndSignage();
    this.buildLivingWorldEffects();
    this.buildPerimeterNature();
    this.buildSawmillAndHarbor();
    this.buildHarvestableForest();
    this.buildArcadePads();
    this.initParticlePool();
    this.initFlyingPool();
    this.buildQuestIndicator();
    this.setLowSpec(this.lowSpec);
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

    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe9cc90, roughness: 0.92, metalness: 0.0 });
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
    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(51, 5.2), roadMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.position.set(0.5, 0.02, -4);
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

    this.worldGroup.add(this.landDetailGroup);

    this.addFloorMarker(ZONES.hopper, 2.4, '#0ea5e9', 'NẠP GỖ VÀO MÁY', '🪵 Tự động hút');
    this.addFloorMarker(ZONES.sawOutput, 2.4, '#10b981', 'KHO VÁN & BÁN', '📦 Nhận hàng');
    this.addFloorMarker(ZONES.vehicleSpawn, 2.6, '#f59e0b', 'BÃI XE THƯƠNG MẠI', '🚘 Nhấn [E]');
    this.addFloorMarker(ZONES.harborExport, 2.6, '#10b981', 'CẨU XUẤT CẢNG', '🚢 Giao hợp đồng');
    this.addFloorMarker(ZONES.canneryDock, 2.3, '#38bdf8', 'CẢNG CÁ HỘP', '🐟 Thu hoạch cá');
    this.addFloorMarker(ZONES.yachtBerth, 2.4, '#06b6d4', 'BẾN DU THUYỀN VIP', '🚤 Lái ra khơi [E]');
    this.addFloorMarker(ZONES.runwayStart, 2.6, '#f59e0b', 'ĐƯỜNG BĂNG SÂN BAY', '✈️ Cất cánh [E]');
    this.addFloorMarker(ZONES.hqPlaza, 2.4, '#a855f7', 'TRỤ SỞ TẬP ĐOÀN', '🏢 Cổ phiếu & Tài chính');
    this.addFloorMarker(ZONES.furnitureMill, 2.4, '#fb7185', 'NHÀ MÁY NỘI THẤT', '🛋️ Chế biến & Bán');
    this.addFloorMarker(ZONES.deepPort, 2.5, '#0ea5e9', 'CẢNG CONTAINER', '🚢 Siêu cảng Nước Sâu');
    this.addFloorMarker(ZONES.railDepot, 2.3, '#f59e0b', 'GA ĐƯỜNG SẮT', '🚂 Tàu Hỏa Logistics');
    this.addFloorMarker(ZONES.helipad, 2.5, '#38bdf8', 'BÃI TRỰC THĂNG VIP', '🚁 Cất cánh [E]');
  }

  addFloorMarker(pos, radius, colorHex, title, sub) {
    const outerGeo = new THREE.RingGeometry(radius * 0.9, radius, 28);
    outerGeo.rotateX(-Math.PI / 2);
    const outerRing = new THREE.Mesh(
      outerGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    outerRing.position.set(pos.x, pos.y + 0.045, pos.z);

    const innerGeo = new THREE.RingGeometry(radius * 0.7, radius * 0.74, 28);
    innerGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(
      innerGeo,
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    );
    innerRing.position.set(pos.x, pos.y + 0.045, pos.z);

    const discGeo = new THREE.CircleGeometry(radius * 0.7, 24);
    discGeo.rotateX(-Math.PI / 2);
    const disc = new THREE.Mesh(
      discGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.09, side: THREE.DoubleSide })
    );
    disc.position.set(pos.x, pos.y + 0.042, pos.z);

    const badge = makeWorldBadgeSprite(title, sub, colorHex);
    badge.position.set(pos.x, pos.y + 1.85, pos.z);
    this.worldGroup.add(outerRing, innerRing, disc, badge);
  }

  buildLuxuryBoulevardsAndParking() {
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(8, 1), roughness: 0.78, metalness: 0.04 });
    const cobbleMat = new THREE.MeshStandardMaterial({ map: getGraniteCobbleTexture(4, 3), roughness: 0.76, metalness: 0.06 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.1 });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const stallMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.7 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const warmGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.15,
      roughness: 0.2
    });
    this.streetLampMat = warmGlassMat;
    const planterStoneMat = new THREE.MeshStandardMaterial({ color: 0xe2d6c3, roughness: 0.75 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.84, flatShading: true });

    // Raised Travertine Sidewalks flanking EW & NS boulevards
    const walkDefs = [
      { x: -13.0, z: -7.45, w: 24.2, d: 1.7 }, // EW North-West
      { x: 15.2, z: -7.45, w: 20.6, d: 1.7 },  // EW North-East
      { x: -13.0, z: -0.55, w: 24.2, d: 1.7 }, // EW South-West
      { x: 15.2, z: -0.55, w: 20.6, d: 1.7 },  // EW South-East
      { x: -1.75, z: 10.45, w: 1.7, d: 20.3 }, // NS West
      { x: 5.75, z: 10.45, w: 1.7, d: 20.3 },  // NS East
      { x: 2.0, z: -8.1, w: 14.0, d: 1.4 },    // Sawmill Front Apron Connector
      { x: 16.0, z: -13.8, w: 3.4, d: 11.4 }   // Furniture Factory Boulevard Path
    ];
    for (const s of walkDefs) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.1, s.d), travMat);
      m.position.set(s.x, 0.05, s.z);
      m.receiveShadow = !this.lowSpec;
      this.worldGroup.add(m);
    }

    // Crosswalk stripes (InstancedMesh) at intersection & plaza crossings
    const cwGeo = new THREE.BoxGeometry(0.45, 0.02, 1.35);
    const cwSpots = [];
    for (let dx = -1.6; dx <= 1.6; dx += 0.8) {
      cwSpots.push({ x: 2 + dx, z: -7.1, ry: 0 });
      cwSpots.push({ x: 2 + dx, z: -0.9, ry: 0 });
      cwSpots.push({ x: 2 + dx, z: 7.0, ry: 0 });
      cwSpots.push({ x: 2 + dx, z: 19.6, ry: 0 });
    }
    for (let dz = -1.6; dz <= 1.6; dz += 0.8) {
      cwSpots.push({ x: -1.3, z: -4 + dz, ry: Math.PI / 2 });
      cwSpots.push({ x: 5.3, z: -4 + dz, ry: Math.PI / 2 });
    }
    const cwInst = new THREE.InstancedMesh(cwGeo, stripeMat, cwSpots.length);
    const dummy = new THREE.Object3D();
    cwSpots.forEach((p, idx) => {
      dummy.position.set(p.x, 0.035, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      cwInst.setMatrixAt(idx, dummy.matrix);
    });
    cwInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(cwInst);

    // Commercial Parking Hub around ZONES.vehicleSpawn (-10, 0, 4)
    const parkingCourt = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.09, 8.6), cobbleMat);
    parkingCourt.position.set(-10, 0.045, 4.4);
    parkingCourt.receiveShadow = !this.lowSpec;
    this.worldGroup.add(parkingCourt);

    const bayLineGeo = new THREE.BoxGeometry(0.14, 0.02, 4.4);
    [-14.6, -11.6, -8.4, -5.4].forEach((bx) => {
      const line = new THREE.Mesh(bayLineGeo, stallMat);
      line.position.set(bx, 0.095, 4.3);
      this.worldGroup.add(line);
    });
    const stopGeo = new THREE.BoxGeometry(1.9, 0.16, 0.24);
    [-13.1, -10.0, -6.9].forEach((bx) => {
      const stop = new THREE.Mesh(stopGeo, curbMat);
      stop.position.set(bx, 0.16, 6.2);
      this.worldGroup.add(stop);
    });

    // Sleek Parking Pergola Canopy along south edge of parking bays
    const postGeo = new THREE.BoxGeometry(0.2, 2.7, 0.2);
    [-14.4, -10.0, -5.6].forEach((px) => {
      const post = new THREE.Mesh(postGeo, ironMat);
      post.position.set(px, 1.4, 7.6);
      post.castShadow = !this.lowSpec;
      this.worldGroup.add(post);
    });
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.16, 2.4), timberMat);
    canopyRoof.position.set(-10.0, 2.78, 7.2);
    canopyRoof.rotation.x = -0.1;
    canopyRoof.castShadow = !this.lowSpec;
    const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(9.9, 0.12, 0.18), warmGlassMat);
    canopyTrim.position.set(-10.0, 2.66, 6.08);
    this.worldGroup.add(canopyRoof, canopyTrim);

    // Classic Cast-Iron Warm Golden Streetlamps (InstancedMesh: 3 draw calls total!)
    const lampSpots = [
      [-21, -7.45], [-12, -7.45], [-3, -7.45], [7, -7.45], [16, -7.45], [24, -7.45],
      [-21, -0.55], [-12, -0.55], [-3, -0.55], [7, -0.55], [16, -0.55],
      [-1.75, 4.5], [-1.75, 11.5], [-1.75, 18.5],
      [5.75, 4.5], [5.75, 11.5], [5.75, 18.5],
      [-15.2, 1.2], [-4.8, 1.2],
      [-28, 21.8], [-15, 21.8], [10, 21.8], [21, 21.8]
    ];
    const lBaseGeo = new THREE.CylinderGeometry(0.14, 0.22, 3.3, 7);
    lBaseGeo.translate(0, 1.65, 0);
    const lHeadGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.48, 6);
    lHeadGeo.translate(0, 3.45, 0);
    const lGlowGeo = new THREE.SphereGeometry(0.24, 8, 8);
    lGlowGeo.translate(0, 3.22, 0);

    const lampPosts = new THREE.InstancedMesh(lBaseGeo, ironMat, lampSpots.length);
    const lampCaps = new THREE.InstancedMesh(lHeadGeo, ironMat, lampSpots.length);
    const lampBulbs = new THREE.InstancedMesh(lGlowGeo, warmGlassMat, lampSpots.length);
    lampPosts.castShadow = !this.lowSpec;

    lampSpots.forEach(([lx, lz], i) => {
      dummy.position.set(lx, 0.08, lz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampPosts.setMatrixAt(i, dummy.matrix);
      lampCaps.setMatrixAt(i, dummy.matrix);
      lampBulbs.setMatrixAt(i, dummy.matrix);
    });
    lampPosts.instanceMatrix.needsUpdate = true;
    lampCaps.instanceMatrix.needsUpdate = true;
    lampBulbs.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(lampPosts, lampCaps, lampBulbs);

    // Boulevard Ornamental Cypress Planters (InstancedMesh)
    const cypressSpots = [
      [-18, -7.8], [-9, -7.8], [11.5, -7.8], [21, -7.8],
      [-18, -0.2], [-3.2, 2.0], [-3.2, 8.0], [-3.2, 14.5],
      [13.5, 0.2], [19.5, 0.2]
    ];
    const pPotGeo = new THREE.BoxGeometry(0.95, 0.42, 0.95);
    pPotGeo.translate(0, 0.21, 0);
    const pTreeGeo = new THREE.ConeGeometry(0.48, 2.2, 7);
    pTreeGeo.translate(0, 1.45, 0);
    const pots = new THREE.InstancedMesh(pPotGeo, planterStoneMat, cypressSpots.length);
    const trees = new THREE.InstancedMesh(pTreeGeo, hedgeMat, cypressSpots.length);
    trees.castShadow = !this.lowSpec;

    cypressSpots.forEach(([cx, cz], i) => {
      dummy.position.set(cx, 0.06, cz);
      dummy.rotation.set(0, i * 0.4, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pots.setMatrixAt(i, dummy.matrix);
      trees.setMatrixAt(i, dummy.matrix);
    });
    pots.instanceMatrix.needsUpdate = true;
    trees.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(pots, trees);

    // 3 Strategic Warm Boulevard PointLights (strictly gated OFF on <8GB RAM lowSpec)
    const warmLightPositions = [
      [2, 4.4, -4],
      [8.5, 4.4, 7],
      [2, 4.2, 20.5]
    ];
    for (const [wx, wy, wz] of warmLightPositions) {
      const pl = new THREE.PointLight(0xfde68a, 1.75, 22, 1.65);
      pl.position.set(wx, wy, wz);
      pl.visible = !this.lowSpec;
      this.worldGroup.add(pl);
      this.landPointLights.push(pl);
    }
  }

  buildExecutivePlazaAndFountain() {
    const plazaMat = new THREE.MeshStandardMaterial({ map: getGraniteCobbleTexture(6, 5), roughness: 0.74, metalness: 0.06 });
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(4, 4), roughness: 0.72 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.08 });
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.25
    });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.85 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.84, flatShading: true });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });

    // Paved Executive Courtyard connecting Road NS (x=5.0) to HQ Tower (x=15, z=7)
    const courtyard = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.09, 12.4), plazaMat);
    courtyard.position.set(12.8, 0.045, 7.0);
    courtyard.receiveShadow = !this.lowSpec;
    this.worldGroup.add(courtyard);

    // Tiered Marble Fountain centered at (7.7, 0.09, 7.0) — clear of Road NS and HQ stairs
    const fountain = new THREE.Group();
    fountain.position.set(7.7, 0.09, 7.0);

    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.78, 0.44, 8), travMat);
    outerBasin.position.y = 0.22;
    outerBasin.castShadow = !this.lowSpec;
    outerBasin.receiveShadow = !this.lowSpec;

    const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.14, 16), poolWaterMat);
    waterPool.position.y = 0.36;

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.25, 8), marbleMat);
    pedestal.position.y = 0.74;
    const midBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.36, 0.3, 12), marbleMat);
    midBowl.position.y = 1.2;
    const topSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.6, 8), brassMat);
    topSpire.position.y = 1.58;
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), brassMat);
    finial.position.y = 1.98;

    fountain.add(outerBasin, waterPool, pedestal, midBowl, topSpire, finial);

    // Animated water jets & ripple ring (gated OFF on <8GB RAM lowSpec)
    const jetMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.72 });
    const jetGeo = new THREE.CylinderGeometry(0.045, 0.075, 0.7, 6);
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const jet = new THREE.Mesh(jetGeo, jetMat);
      jet.position.set(Math.cos(ang) * 0.56, 1.0, Math.sin(ang) * 0.56);
      jet.rotation.z = Math.cos(ang) * 0.26;
      jet.rotation.x = -Math.sin(ang) * 0.26;
      this.fountainJetsGroup.add(jet);
      this.fountainJets.push(jet);
    }
    this.fountainRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 0.98, 20),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    this.fountainRipple.rotation.x = -Math.PI / 2;
    this.fountainRipple.position.y = 0.44;
    this.fountainJetsGroup.add(this.fountainRipple);
    fountain.add(this.fountainJetsGroup);
    this.worldGroup.add(fountain);

    // 3D Maritime Compass Monument Sign at Plaza NW Corner with Glowing Plaque
    const monument = new THREE.Group();
    monument.position.set(7.2, 0.09, 1.95);
    monument.rotation.y = -0.32;
    const monPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 0.85), travMat);
    monPlinth.position.y = 0.325;
    monPlinth.castShadow = !this.lowSpec;
    const monSlab = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.05, 0.24), ironMat);
    monSlab.position.y = 1.15;
    const monSignTex = getIlluminatedSignTexture('TIMBERPORT PLAZA', 'TÀI CHÍNH · THƯƠNG MẠI');
    const monSignMat = new THREE.MeshStandardMaterial({
      map: monSignTex,
      emissiveMap: monSignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.68,
      roughness: 0.35
    });
    const monFace = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 0.88), monSignMat);
    monFace.position.set(0, 1.15, 0.13);
    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.14, 0.3), brassMat);
    monFrame.position.y = 1.7;
    const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), brassMat);
    emblem.position.set(0, 1.96, 0);
    monument.add(monPlinth, monSlab, monFace, monFrame, emblem);
    this.worldGroup.add(monument);

    // Park Benches flanking Fountain Courtyard (preserving clear central walkway)
    const benchPositions = [
      [7.7, 3.8, 0],
      [7.7, 10.2, Math.PI]
    ];
    for (const [bx, bz, ry] of benchPositions) {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, 0.09, bz);
      bGroup.rotation.y = ry;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.58), timberMat);
      seat.position.y = 0.42;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.4, 0.09), timberMat);
      back.position.set(0, 0.68, -0.24);
      const legGeo = new THREE.BoxGeometry(0.12, 0.42, 0.5);
      [-0.74, 0.74].forEach((lx) => {
        const leg = new THREE.Mesh(legGeo, ironMat);
        leg.position.set(lx, 0.21, 0);
        bGroup.add(leg);
      });
      bGroup.add(seat, back);
      this.worldGroup.add(bGroup);
    }

    // Manicured Hedges & Ornamental Flowers around Courtyard (Flowers gated in landDetailGroup)
    [[11.0, 1.5], [16.5, 1.5], [11.0, 12.5], [16.5, 12.5]].forEach(([hx, hz]) => {
      const boxBorder = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.32, 0.9), travMat);
      boxBorder.position.set(hx, 0.24, hz);
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.48, 0.62), hedgeMat);
      hedge.position.set(hx, 0.56, hz);
      this.worldGroup.add(boxBorder, hedge);
    });

    // High-spec decorative golden/coral flower clusters inside planters
    const flowerGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.7, flatShading: true });
    const flowerCoords = [];
    [[11.0, 1.5], [16.5, 1.5], [11.0, 12.5], [16.5, 12.5]].forEach(([hx, hz]) => {
      for (let ox = -1.2; ox <= 1.2; ox += 0.8) flowerCoords.push([hx + ox, 0.84, hz]);
    });
    const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCoords.length);
    const dummy = new THREE.Object3D();
    flowerCoords.forEach(([fx, fy, fz], idx) => {
      dummy.position.set(fx, fy, fz);
      dummy.rotation.set(0, idx * 0.7, 0);
      dummy.scale.set(1, 0.8, 1);
      dummy.updateMatrix();
      flowers.setMatrixAt(idx, dummy.matrix);
    });
    flowers.instanceMatrix.needsUpdate = true;
    this.landDetailGroup.add(flowers);
  }

  buildCoastalPromenadeAndFishery() {
    const stoneWallMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(10, 1), roughness: 0.8 });
    const boardwalkMat = new THREE.MeshStandardMaterial({ map: getBoardwalkPlankTexture(14, 1), roughness: 0.76 });
    const postWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.86 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd6b37c, roughness: 0.88 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xc28546, roughness: 0.74 });
    const iceBoxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.68 });
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.78, flatShading: true });

    // Stone Seawall Edge separating grass from beach (West & East wings around central Harbor Road)
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(41, 0.42, 0.85), stoneWallMat);
    wallW.position.set(-21.5, 0.14, 20.6);
    wallW.receiveShadow = !this.lowSpec;
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(37, 0.42, 0.85), stoneWallMat);
    wallE.position.set(23.5, 0.14, 20.6);
    wallE.receiveShadow = !this.lowSpec;
    this.worldGroup.add(wallW, wallE);

    // Teak Timber Boardwalk Promenade along coastline
    const bwWest = new THREE.Mesh(new THREE.BoxGeometry(36, 0.16, 2.3), boardwalkMat);
    bwWest.position.set(-19.0, 0.08, 22.0);
    bwWest.receiveShadow = !this.lowSpec;
    const bwEast = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.16, 2.3), boardwalkMat);
    bwEast.position.set(14.8, 0.08, 22.0);
    bwEast.receiveShadow = !this.lowSpec;
    this.worldGroup.add(bwWest, bwEast);

    // Wooden Post & Nautical Rope Fencing along boardwalk outer edge (InstancedMesh)
    const fencePostsX = [];
    for (let x = -35; x <= -10; x += 2.5) fencePostsX.push(x);
    for (let x = 6.5; x <= 23.5; x += 2.5) fencePostsX.push(x);

    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.92, 6);
    postGeo.translate(0, 0.46, 0);
    const postsInst = new THREE.InstancedMesh(postGeo, postWoodMat, fencePostsX.length);
    postsInst.castShadow = !this.lowSpec;

    const railSegments = [];
    for (let i = 0; i < fencePostsX.length - 1; i++) {
      const x1 = fencePostsX[i];
      const x2 = fencePostsX[i + 1];
      if (Math.abs(x2 - x1) < 3.0) railSegments.push((x1 + x2) * 0.5);
    }
    const ropeGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.5, 5);
    ropeGeo.rotateZ(Math.PI / 2);
    const ropesInst = new THREE.InstancedMesh(ropeGeo, ropeMat, railSegments.length);

    const dummy = new THREE.Object3D();
    fencePostsX.forEach((fx, i) => {
      dummy.position.set(fx, 0.08, 23.05);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postsInst.setMatrixAt(i, dummy.matrix);
    });
    postsInst.instanceMatrix.needsUpdate = true;

    railSegments.forEach((rx, i) => {
      dummy.position.set(rx, 0.72, 23.05);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ropesInst.setMatrixAt(i, dummy.matrix);
    });
    ropesInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(postsInst, ropesInst);

    // Coastal Cargo Crates, Fish Ice Boxes & Oak Barrels near Cannery & West Beach (clear of pads)
    const crateCoords = [
      [-12.5, 0.35, 24.4], [-13.4, 0.35, 24.4], [-12.95, 1.0, 24.4],
      [-23.5, 0.35, 24.5], [-24.4, 0.35, 24.8], [10.8, 0.35, 24.4]
    ];
    const crateGeo = new THREE.BoxGeometry(0.82, 0.72, 0.82);
    const cratesInst = new THREE.InstancedMesh(crateGeo, crateMat, crateCoords.length);
    cratesInst.castShadow = !this.lowSpec;
    crateCoords.forEach(([cx, cy, cz], i) => {
      dummy.position.set(cx, cy, cz);
      dummy.rotation.set(0, (i % 3) * 0.25, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      cratesInst.setMatrixAt(i, dummy.matrix);
    });
    cratesInst.instanceMatrix.needsUpdate = true;

    const iceCoords = [
      [-9.2, 0.32, 24.3], [-10.3, 0.32, 24.6], [-8.4, 0.32, 24.9]
    ];
    const iceGeo = new THREE.BoxGeometry(0.95, 0.56, 0.62);
    const iceInst = new THREE.InstancedMesh(iceGeo, iceBoxMat, iceCoords.length);
    iceCoords.forEach(([ix, iy, iz], i) => {
      dummy.position.set(ix, iy, iz);
      dummy.rotation.set(0, i * 0.3, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      iceInst.setMatrixAt(i, dummy.matrix);
    });
    iceInst.instanceMatrix.needsUpdate = true;

    const barrelCoords = [
      [-14.3, 0.42, 24.7], [-14.9, 0.42, 24.2], [11.7, 0.42, 24.6], [-22.6, 0.42, 24.3]
    ];
    const barrelGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.82, 8);
    const barrelsInst = new THREE.InstancedMesh(barrelGeo, barrelMat, barrelCoords.length);
    barrelCoords.forEach(([bx, by, bz], i) => {
      dummy.position.set(bx, by, bz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      barrelsInst.setMatrixAt(i, dummy.matrix);
    });
    barrelsInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(cratesInst, iceInst, barrelsInst);

    // Coastal Beach Palms (InstancedMesh)
    const palmSpots = [
      [-26.5, 22.8], [-17.5, 23.6], [19.5, 23.6], [23.2, 22.6], [-35.5, 23.2]
    ];
    const pTrunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 3.8, 6);
    pTrunkGeo.translate(0, 1.9, 0);
    const pCrownGeo = new THREE.DodecahedronGeometry(1.35, 0);
    pCrownGeo.scale(1.25, 0.6, 1.25);
    pCrownGeo.translate(0, 3.9, 0);
    const pTrunks = new THREE.InstancedMesh(pTrunkGeo, palmTrunkMat, palmSpots.length);
    const pCrowns = new THREE.InstancedMesh(pCrownGeo, palmLeafMat, palmSpots.length);
    pTrunks.castShadow = !this.lowSpec;
    pCrowns.castShadow = !this.lowSpec;
    palmSpots.forEach(([px, pz], i) => {
      dummy.position.set(px, 0, pz);
      dummy.rotation.set(0.06, i * 1.1, (i % 2 === 0 ? 1 : -1) * 0.08);
      dummy.scale.set(1, 0.9 + (i % 3) * 0.12, 1);
      dummy.updateMatrix();
      pTrunks.setMatrixAt(i, dummy.matrix);
      pCrowns.setMatrixAt(i, dummy.matrix);
    });
    pTrunks.instanceMatrix.needsUpdate = true;
    pCrowns.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(pTrunks, pCrowns);
  }

  buildForestEcology() {
    const forestPadMat = new THREE.MeshStandardMaterial({
      map: getForestFloorTexture(4, 4),
      roughness: 0.94,
      metalness: 0.0
    });
    const forestPad = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 15.2, 0.04, 14), forestPadMat);
    forestPad.scale.set(1.06, 1, 0.86);
    forestPad.position.set(-26, 0.012, -25);
    forestPad.receiveShadow = !this.lowSpec;
    this.worldGroup.add(forestPad);

    const dummy = new THREE.Object3D();
    // Mossy forest boulders along edge & clearings
    const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const rockSpots = [
      [-40.2, -35.0, 1.1], [-36.5, -36.5, 0.9], [-28.0, -36.8, 1.2], [-19.5, -36.2, 0.85],
      [-40.5, -26.0, 1.25], [-40.0, -18.0, 0.95], [-34.0, -13.2, 0.8], [-22.5, -13.5, 0.9],
      [-31.5, -28.0, 0.55], [-24.5, -21.5, 0.52], [-14.2, -32.0, 0.72]
    ];
    const forestRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockSpots.length);
    rockSpots.forEach(([rx, rz, sc], i) => {
      dummy.position.set(rx, sc * 0.32, rz);
      dummy.rotation.set(i * 0.4, i * 1.1, 0);
      dummy.scale.set(sc * 1.25, sc * 0.75, sc);
      dummy.updateMatrix();
      forestRocks.setMatrixAt(i, dummy.matrix);
    });
    forestRocks.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(forestRocks);

    // Forest ferns & low shrubs (InstancedMesh)
    const fernGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const fernMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.86, flatShading: true });
    const fernSpots = [
      [-39.2, -33.2], [-34.5, -35.8], [-25.0, -36.0], [-16.5, -35.2],
      [-39.6, -23.0], [-39.0, -15.5], [-29.0, -13.0], [-19.0, -13.2],
      [-35.0, -25.5], [-26.5, -31.0], [-21.0, -19.5], [-13.8, -28.5],
      [-14.5, -40.5], [-8.0, -40.0], [-16.5, -43.5], [-6.5, -44.2]
    ];
    const ferns = new THREE.InstancedMesh(fernGeo, fernMat, fernSpots.length);
    fernSpots.forEach(([fx, fz], i) => {
      dummy.position.set(fx, 0.24, fz);
      dummy.rotation.set(0, i * 0.85, 0);
      const s = 0.8 + (i % 3) * 0.22;
      dummy.scale.set(s * 1.25, s * 0.65, s * 1.15);
      dummy.updateMatrix();
      ferns.setMatrixAt(i, dummy.matrix);
    });
    ferns.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(ferns);

    // Wildflower blossoms in forest & lakeside (gated in landDetailGroup for <8GB RAM)
    const wildGeo = new THREE.DodecahedronGeometry(0.16, 0);
    const wildMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7, flatShading: true });
    const wildSpots = [];
    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2;
      const rx = -26 + Math.cos(ang) * (11.5 + (i % 3) * 1.4);
      const rz = -25 + Math.sin(ang) * (9.5 + (i % 2) * 1.3);
      wildSpots.push([rx, 0.16, rz]);
    }
    for (let i = 0; i < 10; i++) {
      wildSpots.push([-16.5 + i * 1.15, 0.16, -38.8 - (i % 2) * 0.9]);
    }
    const wildflowers = new THREE.InstancedMesh(wildGeo, wildMat, wildSpots.length);
    const flowerColor = new THREE.Color();
    wildSpots.forEach(([wx, wy, wz], i) => {
      dummy.position.set(wx, wy, wz);
      dummy.rotation.set(0, i * 0.6, 0);
      dummy.scale.set(1, 0.75, 1);
      dummy.updateMatrix();
      wildflowers.setMatrixAt(i, dummy.matrix);
      flowerColor.setHex(i % 3 === 0 ? 0xfbbf24 : i % 3 === 1 ? 0xf8fafc : 0xfb7185);
      wildflowers.setColorAt(i, flowerColor);
    });
    wildflowers.instanceMatrix.needsUpdate = true;
    if (wildflowers.instanceColor) wildflowers.instanceColor.needsUpdate = true;
    this.landDetailGroup.add(wildflowers);
  }

  buildMountainWaterfallPond() {
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.12,
      metalness: 0.22
    });
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
    const shoreMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88, flatShading: true });

    // Emerald Pond nestled in northern valley (-11.5, -41.8)
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.0, 0.12, 18), lakeMat);
    pond.scale.set(1.35, 1, 0.82);
    pond.position.set(-11.5, 0.04, -41.8);
    this.worldGroup.add(pond);

    // Shoreline river stones bordering the pond
    const pebbleGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const pebbleInst = new THREE.InstancedMesh(pebbleGeo, shoreMat, 20);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const px = -11.5 + Math.cos(a) * 7.4;
      const pz = -41.8 + Math.sin(a) * 4.7;
      dummy.position.set(px, 0.18, pz);
      dummy.rotation.set(i * 0.3, a, 0);
      const s = 0.75 + (i % 3) * 0.28;
      dummy.scale.set(s * 1.2, s * 0.65, s);
      dummy.updateMatrix();
      pebbleInst.setMatrixAt(i, dummy.matrix);
    }
    pebbleInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(pebbleInst);

    // Basalt Cliff Wall behind pond with Waterfall Cascade
    const cliffCenter = new THREE.Mesh(new THREE.BoxGeometry(7.2, 11.2, 4.4), cliffMat);
    cliffCenter.position.set(-11.5, 5.2, -47.4);
    cliffCenter.castShadow = !this.lowSpec;
    const cliffL = new THREE.Mesh(new THREE.ConeGeometry(4.6, 13.5, 6), cliffMat);
    cliffL.position.set(-15.5, 6.4, -46.8);
    const cliffR = new THREE.Mesh(new THREE.ConeGeometry(4.4, 12.8, 6), cliffMat);
    cliffR.position.set(-7.5, 6.1, -46.8);
    this.worldGroup.add(cliffCenter, cliffL, cliffR);

    this.waterfallTex = getWaterfallTexture();
    const fallMat = new THREE.MeshBasicMaterial({
      map: this.waterfallTex,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });
    const cascade = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 10.6), fallMat);
    cascade.position.set(-11.5, 5.1, -44.4);
    cascade.rotation.x = 0.16;
    this.worldGroup.add(cascade);

    // Animated Splash Foam Puffs at Waterfall Base (gated OFF on <8GB RAM)
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.78 });
    const foamGeo = new THREE.DodecahedronGeometry(0.48, 0);
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(foamGeo, foamMat);
      puff.position.set(-12.6 + i * 0.45, 0.35, -43.5 + (i % 2) * 0.4);
      this.waterfallFoamGroup.add(puff);
      this.waterfallFoamPuffs.push(puff);
    }
    this.worldGroup.add(this.waterfallFoamGroup);
  }

  buildLandmarksAndSignage() {
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(2, 4), roughness: 0.75 });
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.48, metalness: 0.55 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.85 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const warmLightMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.05,
      roughness: 0.25
    });

    // 1. Harbor Gateway Archway at (2.0, 0, 19.8) spanning Road NS cleanly
    const archGroup = new THREE.Group();
    archGroup.position.set(2.0, 0, 19.8);

    [-3.75, 3.75].forEach((px) => {
      const pierBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 1.3), travMat);
      pierBase.position.set(px, 0.35, 0);
      const pierCol = new THREE.Mesh(new THREE.BoxGeometry(0.96, 5.0, 0.96), travMat);
      pierCol.position.set(px, 2.8, 0);
      pierCol.castShadow = !this.lowSpec;
      const collar = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 1.12), brassMat);
      collar.position.set(px, 5.2, 0);
      const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.22), warmLightMat);
      sconce.position.set(px, 3.2, -0.56);
      archGroup.add(pierBase, pierCol, collar, sconce);
    });

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.72, 1.15), slateMat);
    archBeam.position.set(0, 5.58, 0);
    archBeam.castShadow = !this.lowSpec;
    const archRoof = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.28, 1.45), timberMat);
    archRoof.position.set(0, 6.08, 0);
    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(9.28, 0.12, 1.52), brassMat);
    archTrim.position.set(0, 5.22, 0);
    archGroup.add(archBeam, archRoof, archTrim);

    const harborSignTex = getIlluminatedSignTexture('TIMBERPORT HARBOR', 'CẢNG THƯƠNG MẠI QUỐC TẾ');
    const harborSignMat = new THREE.MeshStandardMaterial({
      map: harborSignTex,
      emissiveMap: harborSignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.75,
      roughness: 0.32
    });
    const signNorth = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.05), harborSignMat);
    signNorth.position.set(0, 5.62, -0.6);
    signNorth.rotation.y = Math.PI;
    const signSouth = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.05), harborSignMat);
    signSouth.position.set(0, 5.62, 0.6);
    archGroup.add(signNorth, signSouth);
    this.worldGroup.add(archGroup);

    // 2. Plaza Clock Tower at SW Executive Plaza (7.5, 0.09, 12.1)
    const clockTower = new THREE.Group();
    clockTower.position.set(7.5, 0.09, 12.1);

    const cBase = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 1.75), travMat);
    cBase.position.y = 0.575;
    cBase.castShadow = !this.lowSpec;
    const cShaft = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.1, 1.3), travMat);
    cShaft.position.y = 3.2;
    cShaft.castShadow = !this.lowSpec;
    const cCornice = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.22, 1.68), brassMat);
    cCornice.position.y = 5.32;
    const cHead = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.48, 1.48), slateMat);
    cHead.position.y = 6.15;
    cHead.castShadow = !this.lowSpec;

    const clockTex = getClockFaceTexture();
    const clockFaceMat = new THREE.MeshStandardMaterial({
      map: clockTex,
      emissiveMap: clockTex,
      emissive: new THREE.Color(0xfffbeb),
      emissiveIntensity: 0.55,
      roughness: 0.35
    });
    const dialGeo = new THREE.PlaneGeometry(1.18, 1.18);
    [
      [0, 6.15, 0.76, 0],
      [0, 6.15, -0.76, Math.PI],
      [-0.76, 6.15, 0, -Math.PI / 2],
      [0.76, 6.15, 0, Math.PI / 2]
    ].forEach(([dx, dy, dz, ry]) => {
      const dial = new THREE.Mesh(dialGeo, clockFaceMat);
      dial.position.set(dx, dy, dz);
      dial.rotation.y = ry;
      clockTower.add(dial);
    });

    const cRoof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.65, 4), brassMat);
    cRoof.rotation.y = Math.PI / 4;
    cRoof.position.y = 7.72;
    const cSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.9, 6), brassMat);
    cSpire.position.y = 8.85;
    clockTower.add(cBase, cShaft, cCornice, cHead, cRoof, cSpire);
    this.worldGroup.add(clockTower);
  }

  buildLivingWorldEffects() {
    this.worldGroup.add(this.ambientLifeGroup);

    // 1. Coastal Soaring Seagulls (7 lightweight composite birds)
    const birdBodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
    const birdWingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const bodyGeo = new THREE.BoxGeometry(0.24, 0.16, 0.62);
    const wingGeo = new THREE.BoxGeometry(0.58, 0.04, 0.22);

    for (let i = 0; i < 7; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, birdBodyMat);
      const wingL = new THREE.Mesh(wingGeo, birdWingMat);
      wingL.position.set(-0.32, 0.04, 0);
      const wingR = new THREE.Mesh(wingGeo, birdWingMat);
      wingR.position.set(0.32, 0.04, 0);
      bird.add(body, wingL, wingR);
      this.ambientLifeGroup.add(bird);
      this.seagulls.push({
        group: bird,
        wingL,
        wingR,
        cx: -6 + (i % 3) * 10,
        cz: 28 + (i % 2) * 8,
        rx: 22 + (i % 4) * 5,
        rz: 9 + (i % 3) * 3,
        alt: 9.5 + (i % 4) * 1.4,
        speed: 0.24 + (i % 3) * 0.06,
        phase: i * 0.95
      });
    }

    // 2. Waving Maritime Flags at Plaza & Harbor Arch Piers
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.28 });
    const flagColors = [0xf59e0b, 0x0ea5e9, 0x10b981];
    const flagCoords = [
      [9.4, 0.09, 1.8, 4.4],
      [-1.75, 5.4, 19.8, 2.8],
      [5.75, 5.4, 19.8, 2.8]
    ];
    flagCoords.forEach(([fx, fy, fz, h], idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, h, 6), poleMat);
      pole.position.set(fx, fy + h * 0.5, fz);
      const flagGroup = new THREE.Group();
      flagGroup.position.set(fx, fy + h - 0.35, fz);
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.56, 0.04),
        new THREE.MeshStandardMaterial({ color: flagColors[idx % flagColors.length], roughness: 0.6 })
      );
      cloth.position.x = 0.58;
      flagGroup.add(cloth);
      this.ambientLifeGroup.add(pole, flagGroup);
      this.flags.push({ group: flagGroup, phase: idx * 1.3 });
    });

    // 3. Industrial Chimney Smoke Puffs (InstancedMesh, Zero-GC)
    const smokeGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.42 });
    const smokeCount = 14;
    this.smokePuffs = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeCount);
    for (let i = 0; i < smokeCount; i++) {
      const atMill = i >= 7;
      this.smokeData.push({
        baseX: atMill ? 17.8 : 1.5,
        baseY: atMill ? 4.8 : 6.1,
        baseZ: atMill ? -27.5 : -14.2,
        phase: (i % 7) / 7,
        speed: 0.22 + (i % 3) * 0.03
      });
    }
    this.ambientLifeGroup.add(this.smokePuffs);

    // 4. Drifting Forest Leaves (InstancedMesh, Zero-GC)
    const leafGeo = new THREE.BoxGeometry(0.24, 0.04, 0.16);
    const leafMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const leafCount = 26;
    this.forestLeaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const leafColor = new THREE.Color();
    for (let i = 0; i < leafCount; i++) {
      this.leafData.push({
        x: -37 + (i % 6) * 4.3 + Math.random() * 1.5,
        z: -34 + Math.floor(i / 6) * 4.5 + Math.random() * 1.5,
        y: 0.6 + Math.random() * 5.2,
        fallSpeed: 0.55 + (i % 4) * 0.14,
        phase: i * 0.7
      });
      leafColor.setHex(i % 3 === 0 ? 0xf59e0b : i % 3 === 1 ? 0x84cc16 : 0xfde047);
      this.forestLeaves.setColorAt(i, leafColor);
    }
    if (this.forestLeaves.instanceColor) this.forestLeaves.instanceColor.needsUpdate = true;
    this.ambientLifeGroup.add(this.forestLeaves);
  }

  buildPerimeterNature() {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // 3-Tier Layered Low-Poly Mountain Ranges framing North, West & East Horizon
    const mtnGeo = new THREE.ConeGeometry(11.5, 18.0, 7);
    mtnGeo.translate(0, 9.0, 0);
    const mtnMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });

    const mtnSpots = [
      // Far North Grand Ridge (leaving central waterfall canyon open around x=-16..-6)
      [-82, -62, 1.45, 1.35], [-64, -60, 1.35, 1.25], [-46, -61, 1.5, 1.4], [-30, -58, 1.25, 1.15],
      [6, -59, 1.35, 1.25], [24, -61, 1.5, 1.4], [44, -60, 1.35, 1.25], [64, -62, 1.45, 1.35], [82, -60, 1.3, 1.2],
      // Mid North Foothills
      [-55, -50, 0.95, 0.85], [-38, -49, 0.9, 0.8], [-22, -49, 0.85, 0.75],
      [0, -49, 0.9, 0.8], [16, -50, 0.95, 0.85], [34, -49, 0.9, 0.82], [52, -50, 1.0, 0.88],
      // Flanking West & East Coastal Cliffs
      [-62, -32, 1.15, 0.95], [-60, -10, 1.05, 0.85], [-64, 10, 0.95, 0.75],
      [62, -32, 1.15, 0.95], [60, -10, 1.05, 0.85], [64, 10, 0.95, 0.75]
    ];
    const mountains = new THREE.InstancedMesh(mtnGeo, mtnMat, mtnSpots.length);
    mtnSpots.forEach(([mx, mz, sx, sy], i) => {
      dummy.position.set(mx, -0.4, mz);
      dummy.rotation.set(0, i * 0.8, 0);
      dummy.scale.set(sx, sy, sx * 0.9);
      dummy.updateMatrix();
      mountains.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.58, 0.14, 0.28 + (i % 4) * 0.045);
      mountains.setColorAt(i, color);
    });
    mountains.instanceMatrix.needsUpdate = true;
    if (mountains.instanceColor) mountains.instanceColor.needsUpdate = true;
    mountains.computeBoundingSphere();
    this.worldGroup.add(mountains);

    // Granite perimeter rocks
    const rockGeo = new THREE.DodecahedronGeometry(3.2, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, flatShading: true });
    const rockCount = this.lowSpec ? 16 : 30;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    for (let i = 0; i < rockCount; i++) {
      const side = i % 3;
      let rx = 0, rz = 0;
      if (side === 0) {
        rx = -46 + (i / rockCount) * 92;
        if (rx > -18 && rx < -5) rx -= 14; // keep waterfall lake vista clear
        rz = -47 - Math.random() * 10;
      } else if (side === 1) {
        rx = -48 - Math.random() * 12;
        rz = -42 + Math.random() * 58;
      } else {
        rx = 48 + Math.random() * 12;
        rz = -42 + Math.random() * 58;
      }

      dummy.position.set(rx, 0.7 + Math.random() * 1.2, rz);
      dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      const s = 0.75 + Math.random() * 1.3;
      dummy.scale.set(s * 1.3, s * 0.9, s);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.6, 0.1, 0.36 + Math.random() * 0.14);
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
        if (tx > -19 && tx < -4) tx += 17; // avoid spawning pines inside pond/waterfall
        tz = -45 - Math.random() * 14;
      } else if (i < northCount + westCount) {
        tx = -46 - Math.random() * 16;
        tz = -40 + ((i - northCount) / westCount) * 58;
      } else {
        tx = 46 + Math.random() * 16;
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

    // Pre-built animated Cargo Freighter cruising the outer bay lane
    this.cargoFreighter = createCargoFreighterModel(this.lowSpec);
    this.cargoFreighter.position.set(-40, 0.05, 62);
    this.worldGroup.add(this.cargoFreighter);

    // Subtle pier point light gated OFF on <8GB RAM low-spec laptops
    this.harborBeaconLight = new THREE.PointLight(0xfef08a, 1.8, 26, 1.6);
    this.harborBeaconLight.position.set(8.5, 6.2, 34);
    this.harborBeaconLight.visible = !this.lowSpec;
    this.worldGroup.add(this.harborBeaconLight);

    // Pre-built VIP Yacht docked at East Bay Berth (zero runtime allocation)
    this.vipYacht = createVipYachtModel(this.lowSpec);
    this.vipYacht.position.set(22, 0.05, 31.5);
    this.vipYacht.rotation.y = Math.PI * 0.14;
    this.worldGroup.add(this.vipYacht);
    this.syncYachtTier(gameState.yachtTier || 0);

    // Pre-built Harbor Gantry Container Crane
    this.gantryCrane = createGantryCraneModel(this.lowSpec);
    this.gantryCrane.position.set(-1.5, 0.72, 29.5);
    this.worldGroup.add(this.gantryCrane);

    // Pre-built Airport Runway & Hangar (East Peninsula x=30, z=-2)
    this.airport = createAirportRunwayModel(this.lowSpec);
    this.airport.position.set(30, 0, -2);
    this.worldGroup.add(this.airport);
    this.syncAirportTier(gameState.airportTier || 0);

    // Pre-built Offshore Island Outpost & Supply Station (x=52, z=92)
    this.islandOutpost = createIslandOutpostModel(this.lowSpec);
    this.islandOutpost.position.set(52, -0.35, 92);
    this.worldGroup.add(this.islandOutpost);
    this.syncIslandTier(gameState.islandStationTier || 0);
    this.syncResortTier(gameState.islandResortTier || 0);

    // Pre-built Corporate HQ Tower at East Plaza (15, 0, 7)
    this.corporateHq = createCorporateHqModel(this.lowSpec);
    this.corporateHq.position.copy(ZONES.hqPlaza);
    this.corporateHq.rotation.y = -Math.PI * 0.5;
    this.worldGroup.add(this.corporateHq);
    this.syncHqTier(gameState.hqTier || 0);

    // Pre-built Luxury Furniture Factory (16, 0, -24)
    this.furnitureFactory = createFurnitureFactoryModel(this.lowSpec);
    this.furnitureFactory.position.copy(ZONES.furnitureMill);
    this.worldGroup.add(this.furnitureFactory);
    this.syncFurnitureMillTier(gameState.furnitureMillTier || 0);

    // Pre-built Coastal Maritime Lighthouse (-30, 0, 26)
    this.lighthouse = createLighthouseModel(this.lowSpec);
    this.lighthouse.position.copy(ZONES.lighthouse);
    this.worldGroup.add(this.lighthouse);
    this.syncLighthouseTier(gameState.lighthouseTier || 0);

    // Pre-built Deep-Water Container Pier, Mega Ship, Gantry Crane & Green Solar Microgrid (-20, 0, 31)
    this.deepContainerPort = createDeepContainerPortModel(this.lowSpec);
    this.deepContainerPort.position.set(-20, 0, 31);
    this.worldGroup.add(this.deepContainerPort);
    this.syncDeepPortTier(gameState.deepPortTier || 0, gameState.greenEnergyTier || 0);

    // Phase 8: Pre-built Industrial Railway Track, Depot & Diesel-Electric Freight Train
    this.railwaySystem = createRailwayAndTrainModel(this.lowSpec);
    this.worldGroup.add(this.railwaySystem);
    this.syncRailwayTier(gameState.railwayTier || 0);

    // Phase 8: Pre-built Illuminated Helipad at East Corporate Plaza (19.5, 0, 15.5)
    this.helipad = createHelipadModel(this.lowSpec);
    this.helipad.position.copy(ZONES.helipad);
    this.worldGroup.add(this.helipad);
    this.syncHeliTier(gameState.heliTier || 0);

    // Pre-built Instanced Clouds & Storm Rain (auto-gated OFF on <8GB RAM)
    this.weatherGroup = createCloudsAndStormGroup(this.lowSpec);
    this.worldGroup.add(this.weatherGroup);

    // Pre-built Storm Relief Challenge Beacon (visible on all hardware when stormState.active)
    this.stormBeacon = createStormBeaconModel();
    this.worldGroup.add(this.stormBeacon);

    // Pre-built Sea Treasure Pool (4 floating crates across the bay)
    const treasureSpots = [
      [-26, 56],
      [14, 72],
      [68, 60],
      [-42, 92]
    ];
    for (const [tx, tz] of treasureSpots) {
      const mesh = createSeaTreasureModel();
      mesh.position.set(tx, 0.05, tz);
      this.worldGroup.add(mesh);
      this.seaTreasures.push({
        mesh,
        pos: new THREE.Vector3(tx, 0.05, tz),
        active: true,
        respawnTimer: 0
      });
    }

    // Sea & Air Delivery Target Beacons (Zero allocation visibility toggle)
    this.seaBeaconRing = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 4.2, 28),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    this.seaBeaconRing.rotation.x = -Math.PI / 2;
    this.seaBeaconRing.visible = false;
    this.worldGroup.add(this.seaBeaconRing);

    this.airBeaconRing = new THREE.Mesh(
      new THREE.TorusGeometry(4.4, 0.35, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
    );
    this.airBeaconRing.visible = false;
    this.worldGroup.add(this.airBeaconRing);
  }

  syncYachtTier(tier = 0) {
    if (!this.vipYacht) return;
    this.vipYacht.visible = tier > 0;
    if (tier > 0) {
      this.vipYacht.scale.setScalar(0.86 + tier * 0.11);
    }
  }

  syncAirportTier(tier = 0) {
    if (!this.airport) return;
    this.airport.visible = tier > 0;
    if (this.airport.userData?.tier2Group) this.airport.userData.tier2Group.visible = tier >= 2;
    if (this.airport.userData?.tier3Group) this.airport.userData.tier3Group.visible = tier >= 3;
  }

  syncIslandTier(tier = 0) {
    if (!this.islandOutpost) return;
    this.islandOutpost.visible = tier > 0;
    if (this.islandOutpost.userData?.tier2Group) this.islandOutpost.userData.tier2Group.visible = tier >= 2;
    if (this.islandOutpost.userData?.tier3Group) this.islandOutpost.userData.tier3Group.visible = tier >= 3;
  }

  syncResortTier(tier = 0) {
    const u = this.islandOutpost?.userData;
    if (!u) return;
    if (u.resortTier1) u.resortTier1.visible = tier >= 1;
    if (u.resortTier2) u.resortTier2.visible = tier >= 2;
    if (u.resortTier3) u.resortTier3.visible = tier >= 3;
  }

  syncHqTier(tier = 0) {
    if (!this.corporateHq) return;
    const u = this.corporateHq.userData;
    this.corporateHq.visible = tier > 0;
    if (u?.tier1Group) u.tier1Group.visible = tier >= 1;
    if (u?.tier2Group) u.tier2Group.visible = tier >= 2;
    if (u?.tier3Group) u.tier3Group.visible = tier >= 3;
    if (u?.facadeLight) u.facadeLight.visible = !this.lowSpec && tier >= 1;
  }

  syncFurnitureMillTier(tier = 0) {
    if (!this.furnitureFactory) return;
    const u = this.furnitureFactory.userData;
    this.furnitureFactory.visible = tier > 0;
    if (u?.tier1Group) u.tier1Group.visible = tier >= 1;
    if (u?.tier2Group) u.tier2Group.visible = tier >= 2;
    if (u?.tier3Group) u.tier3Group.visible = tier >= 3;
    if (u?.accentLight) u.accentLight.visible = !this.lowSpec && tier >= 2;
  }

  syncLighthouseTier(tier = 0) {
    if (!this.lighthouse) return;
    const u = this.lighthouse.userData;
    this.lighthouse.visible = tier > 0;
    if (u?.tier1Group) u.tier1Group.visible = tier >= 1;
    if (u?.tier2Group) u.tier2Group.visible = tier >= 2;
    if (u?.tier3Group) u.tier3Group.visible = tier >= 3;
    if (u?.beamLight) u.beamLight.visible = !this.lowSpec && tier >= 1;
  }

  syncDeepPortTier(tier = 0, greenTier = 0) {
    if (!this.deepContainerPort) return;
    const u = this.deepContainerPort.userData;
    this.deepContainerPort.visible = tier > 0 || greenTier > 0;
    if (u?.tier1Group) u.tier1Group.visible = tier >= 1;
    if (u?.tier2Group) u.tier2Group.visible = tier >= 2;
    if (u?.tier3Group) u.tier3Group.visible = tier >= 3;
    if (u?.greenSolarArray) u.greenSolarArray.visible = greenTier >= 1;
    if (u?.beaconLight) u.beaconLight.visible = !this.lowSpec && tier >= 1;
  }

  syncRailwayTier(tier = 0) {
    if (!this.railwaySystem) return;
    const u = this.railwaySystem.userData;
    if (u?.trainGroup) u.trainGroup.visible = tier >= 1;
    if (u?.wagon2) u.wagon2.visible = tier >= 2;
    if (u?.contBox2) u.contBox2.visible = tier >= 3;
  }

  syncHeliTier(tier = 0) {
    if (!this.helipad) return;
    this.helipad.visible = true;
    const u = this.helipad.userData;
    if (u?.ringMat) {
      u.ringMat.emissiveIntensity = tier > 0 ? 0.9 + tier * 0.25 : 0.35;
    }
    if (u?.hMarkMat) {
      u.hMarkMat.emissiveIntensity = tier > 0 ? 0.75 + tier * 0.2 : 0.25;
    }
  }

  applyNightMode(nightFactor = 0) {
    this.nightFactor = nightFactor;
    if (this.streetLampMat) {
      this.streetLampMat.emissiveIntensity = 0.55 + nightFactor * 1.95;
    }
    if (this.harborBeaconLight && !this.lowSpec) {
      this.harborBeaconLight.intensity = 1.2 + nightFactor * 2.1;
    }
    for (const pl of this.landPointLights) {
      if (!this.lowSpec) {
        pl.intensity = 0.75 + nightFactor * 1.85;
      }
    }
    if (this.lighthouse?.userData?.beamLight && !this.lowSpec) {
      this.lighthouse.userData.beamLight.intensity = 1.4 + nightFactor * 2.4;
    }
    if (this.corporateHq?.userData?.facadeLight && !this.lowSpec) {
      this.corporateHq.userData.facadeLight.intensity = 1.1 + nightFactor * 1.8;
    }
    if (this.railwaySystem?.userData?.headlightMat) {
      this.railwaySystem.userData.headlightMat.emissiveIntensity = 0.85 + nightFactor * 1.65;
    }
    if (this.helipad?.userData?.beaconMat) {
      this.helipad.userData.beaconMat.emissiveIntensity = 0.9 + nightFactor * 1.6;
    }
  }

  setLowSpec(isLow) {
    this.lowSpec = Boolean(isLow);
    if (this.harborBeaconLight) this.harborBeaconLight.visible = !this.lowSpec;
    for (const pl of this.landPointLights) {
      pl.visible = !this.lowSpec;
    }
    if (this.landDetailGroup) this.landDetailGroup.visible = !this.lowSpec;
    if (this.fountainJetsGroup) this.fountainJetsGroup.visible = !this.lowSpec;
    if (this.ambientLifeGroup) this.ambientLifeGroup.visible = !this.lowSpec;
    if (this.waterfallFoamGroup) this.waterfallFoamGroup.visible = !this.lowSpec;
    if (this.cargoFreighter?.userData?.mastBeacon) {
      this.cargoFreighter.userData.mastBeacon.visible = !this.lowSpec;
    }
    if (this.vipYacht?.userData?.deckLight) {
      this.vipYacht.userData.deckLight.visible = !this.lowSpec;
    }
    if (this.gantryCrane?.userData?.beacon) {
      this.gantryCrane.userData.beacon.visible = !this.lowSpec;
    }
    if (this.corporateHq?.userData?.facadeLight) {
      this.corporateHq.userData.facadeLight.visible = !this.lowSpec && (gameState.hqTier || 0) >= 1;
    }
    if (this.furnitureFactory?.userData?.accentLight) {
      this.furnitureFactory.userData.accentLight.visible = !this.lowSpec && (gameState.furnitureMillTier || 0) >= 2;
    }
    if (this.lighthouse?.userData?.beamLight) {
      this.lighthouse.userData.beamLight.visible = !this.lowSpec && (gameState.lighthouseTier || 0) >= 1;
    }
    if (this.deepContainerPort?.userData?.beaconLight) {
      this.deepContainerPort.userData.beaconLight.visible = !this.lowSpec && (gameState.deepPortTier || 0) >= 1;
    }
    if (this.weatherGroup?.userData?.clouds) {
      this.weatherGroup.userData.clouds.visible = !this.lowSpec;
    }
    if (this.weatherGroup?.userData?.rain) {
      this.weatherGroup.userData.rain.visible = !this.lowSpec && stormState.active;
    }
  }

  syncEvolution(sawTier, harborTier) {
    syncBuildingEvolution(this.sawmill, this.harbor, sawTier, harborTier);
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

    const ringGeo = new THREE.RingGeometry(1.52, 1.72, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const discGeo = new THREE.CircleGeometry(1.32, 24);
    discGeo.rotateX(-Math.PI / 2);

    for (const def of padDefs) {
      const group = new THREE.Group();
      group.position.copy(def.pos);
      this.worldGroup.add(group);

      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.68, side: THREE.DoubleSide })
      );
      ring.position.y = 0.045;

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
      sprite.position.set(0, 1.85, 0);

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
      if (this.harbor.userData.tier2Group?.visible && this.harbor.userData.lhBeacon) {
        this.harbor.userData.lhBeacon.rotation.y += dt * 1.6;
      }
    }

    if (this.cargoFreighter) {
      const phase = elapsed * 0.11;
      const fx = Math.sin(phase) * 58;
      const fz = 60 + Math.cos(phase * 0.5) * 8;
      const dx = Math.cos(phase) * 58 * 0.11;
      this.cargoFreighter.position.set(fx, 0.05 + Math.sin(elapsed * 1.2) * 0.12, fz);
      this.cargoFreighter.rotation.y = dx >= 0 ? 0 : Math.PI;
    }

    if (this.vipYacht && this.vipYacht.visible) {
      this.vipYacht.position.y = 0.05 + Math.sin(elapsed * 1.55) * 0.11;
      this.vipYacht.rotation.z = Math.sin(elapsed * 1.1) * 0.025;
    }

    if (this.gantryCrane && !this.lowSpec && this.gantryCrane.userData.trolley) {
      this.gantryCrane.userData.trolley.position.z = 3.5 + Math.sin(elapsed * 0.65) * 3.8;
    }

    if (this.airport?.visible && this.airport.userData?.radar?.visible !== false) {
      this.airport.userData.radar.rotation.y += dt * 1.4;
    }

    // Fountain jets, Waterfall scroll, Seagulls, Flags, Chimney Smoke & Falling Leaves (gated OFF on <8GB RAM lowSpec)
    if (!this.lowSpec) {
      if (this.waterfallTex) {
        this.waterfallTex.offset.y = (elapsed * 0.85) % 1;
      }
      if (this.waterfallFoamGroup?.visible) {
        for (let i = 0; i < this.waterfallFoamPuffs.length; i++) {
          const p = this.waterfallFoamPuffs[i];
          const s = 0.72 + Math.sin(elapsed * 5.0 + i * 1.1) * 0.26;
          p.scale.setScalar(s);
          p.position.y = 0.25 + Math.abs(Math.sin(elapsed * 3.8 + i)) * 0.28;
        }
      }
      if (this.ambientLifeGroup?.visible) {
        for (let i = 0; i < this.seagulls.length; i++) {
          const b = this.seagulls[i];
          const ang = elapsed * b.speed + b.phase;
          const bx = b.cx + Math.cos(ang) * b.rx;
          const bz = b.cz + Math.sin(ang) * b.rz;
          const nx = b.cx + Math.cos(ang + 0.05) * b.rx;
          const nz = b.cz + Math.sin(ang + 0.05) * b.rz;
          b.group.position.set(bx, b.alt + Math.sin(elapsed * 1.8 + b.phase) * 0.7, bz);
          b.group.rotation.y = Math.atan2(nx - bx, nz - bz);
          const flap = Math.sin(elapsed * 7.5 + b.phase) * 0.45;
          b.wingL.rotation.z = flap;
          b.wingR.rotation.z = -flap;
        }
        for (let i = 0; i < this.flags.length; i++) {
          const fl = this.flags[i];
          fl.group.rotation.y = Math.sin(elapsed * 3.4 + fl.phase) * 0.28;
          fl.group.rotation.z = Math.sin(elapsed * 5.2 + fl.phase) * 0.06;
        }
        if (this.smokePuffs) {
          for (let i = 0; i < this.smokeData.length; i++) {
            const sd = this.smokeData[i];
            const cycle = (elapsed * sd.speed + sd.phase) % 1;
            this._lifeDummy.position.set(
              sd.baseX + Math.sin(elapsed * 1.4 + i) * 0.45 + cycle * 0.6,
              sd.baseY + cycle * 4.8,
              sd.baseZ + Math.cos(elapsed * 1.1 + i) * 0.35
            );
            const s = (0.45 + cycle * 1.15) * (1 - cycle * 0.55);
            this._lifeDummy.rotation.set(cycle * 2, i, 0);
            this._lifeDummy.scale.setScalar(Math.max(0.05, s));
            this._lifeDummy.updateMatrix();
            this.smokePuffs.setMatrixAt(i, this._lifeDummy.matrix);
          }
          this.smokePuffs.instanceMatrix.needsUpdate = true;
        }
        if (this.forestLeaves) {
          for (let i = 0; i < this.leafData.length; i++) {
            const ld = this.leafData[i];
            ld.y -= ld.fallSpeed * dt;
            if (ld.y < 0.2) ld.y = 5.8;
            this._lifeDummy.position.set(
              ld.x + Math.sin(elapsed * 1.6 + ld.phase) * 0.55,
              ld.y,
              ld.z + Math.cos(elapsed * 1.3 + ld.phase) * 0.55
            );
            this._lifeDummy.rotation.set(elapsed * 1.8 + ld.phase, elapsed * 2.2, Math.sin(elapsed + ld.phase) * 0.6);
            this._lifeDummy.scale.setScalar(1);
            this._lifeDummy.updateMatrix();
            this.forestLeaves.setMatrixAt(i, this._lifeDummy.matrix);
          }
          this.forestLeaves.instanceMatrix.needsUpdate = true;
        }
      }
      if (this.fountainJetsGroup?.visible) {
        for (let i = 0; i < this.fountainJets.length; i++) {
          const j = this.fountainJets[i];
          const pulse = 0.85 + Math.sin(elapsed * 5.2 + i * 1.4) * 0.22;
          j.scale.set(1, pulse, 1);
          j.position.y = 1.0 + (pulse - 0.85) * 0.35;
        }
        if (this.fountainRipple) {
          const rScale = 0.85 + ((elapsed * 0.75) % 1) * 0.55;
          this.fountainRipple.scale.setScalar(rScale);
          this.fountainRipple.material.opacity = Math.max(0.08, 0.58 * (1 - ((elapsed * 0.75) % 1)));
        }
      }
      if (this.furnitureFactory?.visible && this.furnitureFactory.userData?.tier3Group?.visible && this.furnitureFactory.userData.cncSpinner) {
        this.furnitureFactory.userData.cncSpinner.rotation.y += dt * 0.9;
      }
      if (this.lighthouse?.visible && this.lighthouse.userData?.beaconHead) {
        this.lighthouse.userData.beaconHead.rotation.y += dt * 1.65;
        if (this.lighthouse.userData.beamLight) {
          const ang = this.lighthouse.userData.beaconHead.rotation.y;
          this.lighthouse.userData.beamLight.position.set(Math.sin(ang) * 2.4, 12.6, Math.cos(ang) * 2.4);
        }
      }
      if (this.deepContainerPort?.visible && this.deepContainerPort.userData?.tier1Group?.visible) {
        const dp = this.deepContainerPort.userData;
        if (dp.containerShip) {
          dp.containerShip.position.y = 0.1 + Math.sin(elapsed * 1.15) * 0.11;
        }
        if (dp.trolley) {
          dp.trolley.position.z = 3.2 + Math.sin(elapsed * 0.72) * 3.1;
        }
      }
    }

    // Phase 8: Animated Diesel-Electric Freight Train running between Sawmill Depot (z=-9.5) and Deep Port (z=22.5)
    if (this.railwaySystem?.userData?.trainGroup?.visible) {
      const ru = this.railwaySystem.userData;
      const boostMult = (gameState.trainBoostTimer || 0) > 0 ? 1.85 : 1.0;
      const tierSpeed = 1 + ((gameState.railwayTier || 1) - 1) * 0.25;
      const phase = elapsed * 0.22 * tierSpeed * boostMult;
      const rawSin = Math.sin(phase);
      const rawCos = Math.cos(phase);
      const trainZ = 6.5 + rawSin * 15.2;
      ru.trainGroup.position.z = trainZ;
      if (ru.wheels) {
        const wheelSpin = dt * 6.5 * tierSpeed * boostMult * (rawCos >= 0 ? 1 : -1);
        for (let i = 0; i < ru.wheels.length; i++) {
          ru.wheels[i].rotation.x += wheelSpin;
        }
      }
      if (!this.lowSpec) {
        this.trainSmokeTimer -= dt;
        if (this.trainSmokeTimer <= 0) {
          this.trainSmokeTimer = (gameState.trainBoostTimer || 0) > 0 ? 0.25 : 0.48;
          this.spawnParticles(
            { x: -19.5, y: 2.2, z: trainZ + 1.2 },
            (gameState.trainBoostTimer || 0) > 0 ? 0xfacc15 : 0x94a3b8,
            1
          );
        }
      }
    }

    for (let i = 0; i < this.seaTreasures.length; i++) {
      const tr = this.seaTreasures[i];
      if (tr.active) {
        tr.mesh.position.y = 0.05 + Math.sin(elapsed * 2.1 + i) * 0.14;
        tr.mesh.rotation.y += dt * 0.9;
      } else {
        tr.respawnTimer -= dt;
        if (tr.respawnTimer <= 0) {
          tr.active = true;
          tr.mesh.visible = true;
        }
      }
    }

    if (this.seaBeaconRing) {
      const sm = fleetMissionState.sea;
      this.seaBeaconRing.visible = Boolean(sm);
      if (sm) {
        this.seaBeaconRing.position.set(sm.targetX, 0.16, sm.targetZ);
        this.seaBeaconRing.scale.setScalar(1 + Math.sin(elapsed * 4.5) * 0.12);
      }
    }
    if (this.airBeaconRing) {
      const am = fleetMissionState.air;
      this.airBeaconRing.visible = Boolean(am);
      if (am) {
        this.airBeaconRing.position.set(am.targetX, am.targetY, am.targetZ);
        this.airBeaconRing.rotation.y += dt * 1.4;
      }
    }

    // Storm Relief Challenge Beacon (visible on all hardware profiles)
    if (this.stormBeacon) {
      this.stormBeacon.visible = stormState.active;
      if (stormState.active) {
        this.stormBeacon.position.set(stormState.targetX, stormState.targetY, stormState.targetZ);
        const torus = this.stormBeacon.userData?.torus;
        if (torus) {
          torus.rotation.y += dt * 2.4;
          torus.rotation.x = stormState.kind === 'sea' ? Math.PI / 2 : 0;
        }
        const pulse = 1 + Math.sin(elapsed * 5.2) * 0.12;
        this.stormBeacon.scale.set(pulse, 1, pulse);
      }
    }

    // Instanced Sky Clouds & Storm Rain (hardware-gated OFF on <8GB RAM lowSpec)
    if (this.weatherGroup) {
      const { clouds, rain, cloudBases, rainOffsets, cloudMat } = this.weatherGroup.userData;
      if (!this.lowSpec) {
        if (clouds) {
          clouds.visible = true;
          const speedBoost = stormState.active ? 2.4 : 1.0;
          if (cloudMat) {
            cloudMat.color.setHex(stormState.active ? 0x64748b : 0xf8fafc);
          }
          for (let i = 0; i < cloudBases.length; i++) {
            const cb = cloudBases[i];
            let cx = cb.x + elapsed * cb.speed * speedBoost;
            cx = ((cx + 120) % 240) - 120;
            this._weatherDummy.position.set(cx, cb.y, cb.z);
            this._weatherDummy.rotation.set(0, i * 0.6, 0);
            this._weatherDummy.scale.set(cb.sx, cb.sy, cb.sz);
            this._weatherDummy.updateMatrix();
            clouds.setMatrixAt(i, this._weatherDummy.matrix);
          }
          clouds.instanceMatrix.needsUpdate = true;
        }
        if (rain) {
          rain.visible = stormState.active;
          if (stormState.active) {
            for (let i = 0; i < rainOffsets.length; i++) {
              const ro = rainOffsets[i];
              ro.y -= ro.speed * dt;
              if (ro.y < 0.5) ro.y = 28;
              this._weatherDummy.position.set(ro.x, ro.y, ro.z);
              this._weatherDummy.rotation.set(0, 0, 0.14);
              this._weatherDummy.scale.set(1, 1, 1);
              this._weatherDummy.updateMatrix();
              rain.setMatrixAt(i, this._weatherDummy.matrix);
            }
            rain.instanceMatrix.needsUpdate = true;
          }
        }
      } else {
        if (clouds) clouds.visible = false;
        if (rain) rain.visible = false;
      }
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
      this.currentQuestTarget = target;
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
