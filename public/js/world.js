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
  createCivicPromenadeModel,
  syncBuildingEvolution,
  createFisheryIslandModel,
  createOcean3DModel,
  updateOcean3D,
  updateVesselBuoyancy,
  createVehicleModel,
  updateVehicleKinematics,
  createInstancedGlbGroup,
  disposeObject3D
} from './models.js';
import { gameState, fleetMissionState, stormState, getUpgradeCost, UPGRADE_CATALOG } from './state.js';

import { FISHERY_LOCATION } from './island-route.js';

import { LAND_EDGE_Z, WORLD_BOUNDS } from './regions.js';
import { RegionalLife } from './regional-life.js';

export { LAND_EDGE_Z, WORLD_BOUNDS };

export const HIGHLAND_TRAILS = [
  [[-25, -4], [-66, -4]],
  [[-66, -4], [-66, -76]],
  [[-66, -76], [145, -76]],
  [[46, -76], [46, -148]],
  [[145, -76], [145, 21]],
  [[145, 21], [25, 21]]
];
export const HIGHLAND_LANDMARKS = [
  { x: -66, z: -47, name: 'Rừng Tây', color: '#a7f3d0' },
  { x: 46, z: -76, name: 'Đồi Bắc', color: '#fde68a' },
  { x: 46, z: -148, name: 'Cao Nguyên', color: '#fcdca0' },
  { x: 145, z: 21, name: 'Bãi Đông', color: '#a5f3fc' }
];
export const SEA_BOUNDS = { minX: WORLD_BOUNDS.minX - 15, maxX: WORLD_BOUNDS.maxX + 15, minZ: 27.5, maxZ: 145 };
export const AIR_BOUNDS = { minX: SEA_BOUNDS.minX - 20, maxX: SEA_BOUNDS.maxX + 20, minZ: WORLD_BOUNDS.minZ - 18, maxZ: 155, minY: 0.25, maxY: 34 };

export const ZONES = {
  hopper: new THREE.Vector3(-35, 0, -10.5),
  sawOutput: new THREE.Vector3(-23, 0, -10.5),
  vehicleSpawn: new THREE.Vector3(-27.0, 0, 7.8),
  ferryPier: new THREE.Vector3(2.5, 0, 24.4),
  harborExport: new THREE.Vector3(23.0, 0.5, 31.5),
  canneryDock: new THREE.Vector3(-8.0, 0.5, 29.5),
  yachtBerth: new THREE.Vector3(39.0, 0.5, 29.5),
  deepPort: new THREE.Vector3(-24.0, 0.5, 29.5),
  railDepot: new THREE.Vector3(30.0, 0, -10.5),
  helipad: new THREE.Vector3(24.5, 0, 16.5),
  runwayStart: new THREE.Vector3(43.5, 0.14, 11.5),
  hqPlaza: new THREE.Vector3(24.5, 0, 7.5),
  furnitureMill: new THREE.Vector3(-35.0, 0, 2.5),
  lighthouse: new THREE.Vector3(-44.0, 0, 24.2),
  islandDock: new THREE.Vector3(41, 0.5, 86),
  islandAirDrop: new THREE.Vector3(52, 12, 92),
  harborAirDrop: new THREE.Vector3(23, 12, 32)
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
    this.ocean3D = null;
    this.roadTrucks = [];
    this.cargoFreighterYaw = Math.PI / 2;
    this._tugSmokeVec = new THREE.Vector3();
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
    this.waterwheel = null;
    this.questRing = null;
    this.currentQuestTarget = ZONES.hopper;

    this.buildTerrainAndOcean();
    this.buildHighlandTrails();
    this.regionalLife = new RegionalLife(this.worldGroup);
    this.buildLuxuryBoulevardsAndParking();
    this.buildLoggingIndustryCompound();
    this.buildResidentialTownGrid();
    this.buildInfrastructureZone();
    this.buildCoastalPromenadeAndFishery();
    this.buildForestEcology();
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
    const grass = getGrassTexture('#5f8f45').clone();
    grass.repeat.set(360, 480);
    this.groundMat = new THREE.MeshStandardMaterial({
      map: grass,
      roughness: 0.9,
      metalness: 0.02
    });
    const northEdge = WORLD_BOUNDS.minZ - 16;
    const westEdge = WORLD_BOUNDS.minX - 20;
    const eastEdge = WORLD_BOUNDS.maxX + 20;
    const width = eastEdge - westEdge;
    const centerX = (westEdge + eastEdge) / 2;

    // Split mainland terrain cleanly around the Southwest Recessed Irrigation Canal
    // Canal cut: X = -48.0 .. -14.8, Z = +13.4 .. +17.0 (zero Z-fighting, real carved channel!)
    const canalMinX = -48.0;
    const canalMaxX = -14.8;
    const canalMinZ = 13.4;
    const canalMaxZ = 17.0;

    // 1. Main Northern Mainland (Z = northEdge .. +13.4)
    const landNorth = new THREE.Mesh(new THREE.BoxGeometry(width, 2, canalMinZ - northEdge), this.groundMat);
    landNorth.position.set(centerX, -1, (canalMinZ + northEdge) / 2);
    landNorth.receiveShadow = !this.lowSpec;

    // 2. Far-West Strip beside Canal (X = westEdge .. -48.0, Z = 13.4 .. LAND_EDGE_Z)
    const westW = canalMinX - westEdge;
    const southD = LAND_EDGE_Z - canalMinZ;
    const landWestCanal = new THREE.Mesh(new THREE.BoxGeometry(westW, 2, southD), this.groundMat);
    landWestCanal.position.set((westEdge + canalMinX) / 2, -1, (canalMinZ + LAND_EDGE_Z) / 2);
    landWestCanal.receiveShadow = !this.lowSpec;

    // 3. Center & East Mainland South of Z = 13.4 (X = -14.8 .. eastEdge, Z = 13.4 .. LAND_EDGE_Z)
    const eastW = eastEdge - canalMaxX;
    const landEastCanal = new THREE.Mesh(new THREE.BoxGeometry(eastW, 2, southD), this.groundMat);
    landEastCanal.position.set((canalMaxX + eastEdge) / 2, -1, (canalMinZ + LAND_EDGE_Z) / 2);
    landEastCanal.receiveShadow = !this.lowSpec;

    // 4. Southwest Agriculture-Ready Irrigated Terrace South of Canal (X = -48.0 .. -14.8, Z = 17.0 .. LAND_EDGE_Z)
    const farmW = canalMaxX - canalMinX;
    const farmD = LAND_EDGE_Z - canalMaxZ;
    const landFarmTerrace = new THREE.Mesh(new THREE.BoxGeometry(farmW, 2, farmD), this.groundMat);
    landFarmTerrace.position.set((canalMinX + canalMaxX) / 2, -1, (canalMaxZ + LAND_EDGE_Z) / 2);
    landFarmTerrace.receiveShadow = !this.lowSpec;

    // Crisp earthy-brown shoreline drop-off embankment along Z = LAND_EDGE_Z (no coplanar beach Z-fighting!)
    const earthBankMat = new THREE.MeshStandardMaterial({ color: 0x8d6342, roughness: 0.94, metalness: 0.0 });
    const shoreEmbankment = new THREE.Mesh(new THREE.BoxGeometry(width, 2.1, 0.6), earthBankMat);
    shoreEmbankment.position.set(centerX, -1.04, LAND_EDGE_Z + 0.15);

    this.worldGroup.add(landNorth, landWestCanal, landEastCanal, landFarmTerrace, shoreEmbankment);

    const roadMat = new THREE.MeshStandardMaterial({
      map: getAsphaltTexture(),
      roughness: 0.82,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    // EXACT REFERENCE LAYOUT: 2 Straight Parallel 2-Lane Dark Asphalt Avenues (N–S)
    // West Main Ave (X = -11.5) & East Main Ave (X = +16.5) running cleanly from North (-34) to South Coast (+24.8)
    const westAve = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 59.2), roadMat);
    westAve.rotation.x = -Math.PI / 2;
    westAve.position.set(-11.5, 0.024, -4.6);
    westAve.receiveShadow = !this.lowSpec;

    const eastAve = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 59.2), roadMat);
    eastAve.rotation.x = -Math.PI / 2;
    eastAve.position.set(16.5, 0.024, -4.6);
    eastAve.receiveShadow = !this.lowSpec;

    // North Perimeter Connector Road behind the town (Z = -34.2) for clean truck circulation
    const northAve = new THREE.Mesh(new THREE.PlaneGeometry(80, 4.4), roadMat);
    northAve.rotation.x = -Math.PI / 2;
    northAve.position.set(-4.5, 0.021, -34.2);
    northAve.receiveShadow = !this.lowSpec;

    // South-East Harbor Quay Access Apron linking East Main Ave straight to the Wooden Timber Piers
    const harborApron = new THREE.Mesh(new THREE.PlaneGeometry(18.5, 4.6), roadMat);
    harborApron.rotation.x = -Math.PI / 2;
    harborApron.position.set(23.5, 0.026, 22.8);
    harborApron.receiveShadow = !this.lowSpec;

    this.worldGroup.add(westAve, eastAve, northAve, harborApron);

    this.waterTex = getWaterTexture('#0ea5e9');
    this.waterMat = new THREE.MeshStandardMaterial({
      map: this.waterTex,
      roughness: 0.22,
      metalness: 0.18
    });
    // Ocean starts strictly at Z = 25.0 (centerZ = 135, depth = 220 -> north edge = 25.0), strictly below y = 0!
    this.ocean3D = createOcean3DModel(width + 140, 220, centerX, 135, this.waterMat);
    this.worldGroup.add(this.ocean3D);

    this.fisheryIsland = createFisheryIslandModel();
    this.fisheryIsland.rotation.y = Math.PI;
    this.fisheryIsland.position.set(FISHERY_LOCATION.x, 0, FISHERY_LOCATION.z);
    this.fisheryIsland.userData.pier.visible = gameState.islandRoute.pierBuilt;
    this.worldGroup.add(this.fisheryIsland);

    this.worldGroup.add(this.landDetailGroup);

    this.addFloorMarker(ZONES.hopper, 2.4, '#0ea5e9', 'NẠP GỖ VÀO MÁY', '🪵 Tự động hút');
    this.addFloorMarker(ZONES.sawOutput, 2.4, '#10b981', 'KHO VÁN & BÁN', '📦 Nhận hàng');
    this.addFloorMarker(ZONES.vehicleSpawn, 2.6, '#f59e0b', 'BÃI XE THƯƠNG MẠI', '🚘 Nhấn [E]');
    this.addFloorMarker(ZONES.ferryPier, 2.1, '#38bdf8', 'BẾN LIÊN ĐẢO', 'Mở Quần đảo');
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

  buildHighlandTrails() {
    const pathMaterial = new THREE.MeshStandardMaterial({ color: '#a48b63', roughness: 1 });
    let pathHeight = 0.028;
    for (const [[startX, startZ], [endX, endZ]] of HIGHLAND_TRAILS) {
      const width = Math.abs(endX - startX) + 3;
      const depth = Math.abs(endZ - startZ) + 3;
      const path = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), pathMaterial);
      path.rotation.x = -Math.PI / 2;
      path.position.set((startX + endX) / 2, pathHeight, (startZ + endZ) / 2);
      pathHeight += 0.002;
      path.receiveShadow = !this.lowSpec;
      this.worldGroup.add(path);
    }

    for (const landmark of HIGHLAND_LANDMARKS) {
      const point = new THREE.Vector3(landmark.x, 0, landmark.z);
      this.addFloorMarker(point, 2.7, landmark.color, landmark.name, 'Đường mòn cao nguyên');
    }

    const lookout = HIGHLAND_LANDMARKS[1];
    const stone = new THREE.MeshStandardMaterial({ color: '#77777f', roughness: 0.96 });
    const wood = new THREE.MeshStandardMaterial({ color: '#865836', roughness: 0.84 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(8, 0.44, 5), stone);
    platform.position.set(lookout.x, 0.18, lookout.z - 5);
    const railing = new THREE.Mesh(new THREE.BoxGeometry(8, 0.65, 0.3), wood);
    railing.position.set(lookout.x, 0.7, lookout.z - 7.35);
    this.worldGroup.add(platform, railing);

    const plateau = HIGHLAND_LANDMARKS[2];
    const cairn = new THREE.Group();
    cairn.position.set(plateau.x + 5, 0, plateau.z);
    for (const [level, radius] of [2.3, 1.65, 1.05, 0.55].entries()) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), stone);
      rock.scale.y = 0.45;
      rock.rotation.y = level * 0.7;
      rock.position.y = 0.7 + level * 0.85;
      cairn.add(rock);
    }

    const coast = HIGHLAND_LANDMARKS[3];
    const shelter = new THREE.Group();
    shelter.position.set(coast.x + 7, 0, coast.z - 3);
    const posts = new THREE.BoxGeometry(0.3, 3, 0.3);
    for (const x of [-2.5, 2.5]) {
      for (const z of [-1.7, 1.7]) {
        const post = new THREE.Mesh(posts, wood);
        post.position.set(x, 1.5, z);
        shelter.add(post);
      }
    }
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 4.6, 1.6, 4), wood);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 3.7;
    shelter.add(roof);
    this.worldGroup.add(cairn, shelter);
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

    // Clean Raised Sidewalks flanking the Twin Parallel Main Avenues (X = -11.5 & X = +16.5)
    const walkDefs = [
      { x: -14.3, z: -4.6, w: 0.9, d: 56.0 }, // West Ave west curb
      { x: -8.7, z: -4.6, w: 0.95, d: 56.0 }, // West Ave east curb (Residential West)
      { x: 13.7, z: -4.6, w: 0.95, d: 56.0 }, // East Ave west curb (Residential East)
      { x: 19.3, z: -4.6, w: 0.9, d: 56.0 }   // East Ave east curb (Infrastructure West)
    ];
    for (const s of walkDefs) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.07, s.d), travMat);
      m.position.set(s.x, 0.035, s.z);
      this.worldGroup.add(m);
    }

    // Crisp Dashed White Center Lines + Crosswalks on Twin Main Avenues (1 InstancedMesh draw call!)
    const cwGeo = new THREE.BoxGeometry(0.28, 0.016, 1.55);
    const cwSpots = [];
    for (let z = -31; z <= 23; z += 3.8) {
      cwSpots.push({ x: -11.5, z, ry: 0 });
      cwSpots.push({ x: 16.5, z, ry: 0 });
    }
    for (let x = -42; x <= 32; x += 4.5) {
      cwSpots.push({ x, z: -34.2, ry: Math.PI / 2 });
    }
    // Pedestrian crosswalks matching residential cross-lanes
    for (const crossX of [-11.5, 16.5]) {
      for (const crossZ of [-24.2, -16.8, 3.2, 13.0]) {
        for (let dx = -1.35; dx <= 1.35; dx += 0.68) {
          cwSpots.push({ x: crossX + dx, z: crossZ, ry: 0 });
        }
      }
    }
    const cwInst = new THREE.InstancedMesh(cwGeo, stripeMat, cwSpots.length);
    const dummy = new THREE.Object3D();
    cwSpots.forEach((p, idx) => {
      dummy.position.set(p.x, 0.036, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      cwInst.setMatrixAt(idx, dummy.matrix);
    });
    cwInst.instanceMatrix.needsUpdate = true;
    cwInst.computeBoundingSphere();
    this.worldGroup.add(cwInst);

    // Commercial Vehicle Yard cleanly inside Logging Compound South Apron (-27.0, 0, 7.8)
    const parkingCourt = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 6.2), cobbleMat);
    parkingCourt.position.set(-27.0, 0.04, 7.8);
    this.worldGroup.add(parkingCourt);

    const bayLineGeo = new THREE.BoxGeometry(0.14, 0.02, 3.8);
    [-30.0, -27.8, -25.6, -23.4].forEach((bx) => {
      const line = new THREE.Mesh(bayLineGeo, stallMat);
      line.position.set(bx, 0.09, 7.8);
      this.worldGroup.add(line);
    });
    const stopGeo = new THREE.BoxGeometry(1.6, 0.14, 0.22);
    [-28.9, -26.7, -24.5].forEach((bx) => {
      const stop = new THREE.Mesh(stopGeo, curbMat);
      stop.position.set(bx, 0.14, 9.6);
      this.worldGroup.add(stop);
    });
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.14, 1.8), timberMat);
    canopyRoof.position.set(-27.0, 2.55, 10.3);
    const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.1, 0.14), warmGlassMat);
    canopyTrim.position.set(-27.0, 2.44, 9.45);
    this.worldGroup.add(canopyRoof, canopyTrim);

    // Classic Wooden Utility Poles / Avenue Lamps along West & East Main Avenues (matching reference image!)
    const lampSpots = [
      [-8.7, -28], [-8.7, -17], [-8.7, -5.5], [-8.7, 6.0], [-8.7, 17.5],
      [13.7, -28], [13.7, -17], [13.7, -5.5], [13.7, 6.0], [13.7, 17.5],
      [-14.3, -24], [-14.3, -10.5], [-14.3, 4.0], [-14.3, 19.5],
      [19.3, -24], [19.3, -10.5], [19.3, 4.0], [19.3, 19.5]
    ];
    const lBaseGeo = new THREE.CylinderGeometry(0.1, 0.15, 3.3, 6);
    lBaseGeo.translate(0, 1.65, 0);
    const lHeadGeo = new THREE.BoxGeometry(0.95, 0.12, 0.16);
    lHeadGeo.translate(0, 3.15, 0);
    const lGlowGeo = new THREE.SphereGeometry(0.2, 6, 6);
    lGlowGeo.translate(0, 3.38, 0);

    const lampPosts = new THREE.InstancedMesh(lBaseGeo, timberMat, lampSpots.length);
    const lampCaps = new THREE.InstancedMesh(lHeadGeo, ironMat, lampSpots.length);
    const lampBulbs = new THREE.InstancedMesh(lGlowGeo, warmGlassMat, lampSpots.length);
    lampSpots.forEach(([lx, lz], i) => {
      dummy.position.set(lx, 0.06, lz);
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
    lampPosts.computeBoundingSphere();
    lampCaps.computeBoundingSphere();
    lampBulbs.computeBoundingSphere();
    this.worldGroup.add(lampPosts, lampCaps, lampBulbs);

    // 3 Warm Boulevard PointLights (strictly gated OFF in Max-FPS lowSpec)
    const warmLightPositions = [
      [2.5, 4.4, -5.5],
      [-29.0, 4.6, -10.5],
      [23.0, 4.4, 24.0]
    ];
    for (const [wx, wy, wz] of warmLightPositions) {
      const pl = new THREE.PointLight(0xfde68a, 1.75, 24, 1.65);
      pl.position.set(wx, wy, wz);
      pl.visible = !this.lowSpec;
      this.worldGroup.add(pl);
      this.landPointLights.push(pl);
    }
  }

  /**
   * BAND 1 (WEST): Pure Logging Industry Zone (X = -46..-14.8, Z = -32..+12.2)
   * + SOUTHWEST RECESSED IRRIGATION CANAL, SPINNING WATERWHEEL & AGRICULTURE-READY TERRACE!
   * 100% pure industrial yard inside wooden fence (ZERO houses, ZERO random trees, ZERO square diorama slabs!)
   */
  buildLoggingIndustryCompound() {
    const yardMat = new THREE.MeshStandardMaterial({ color: 0xcab89d, roughness: 0.92, metalness: 0.02 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xbcb6aa, roughness: 0.88 });
    const fenceWoodMat = new THREE.MeshStandardMaterial({ color: 0x7c4d25, roughness: 0.85 });
    const logBarkMat = new THREE.MeshStandardMaterial({ color: 0xa85a28, roughness: 0.8 });
    const wallBeigeMat = new THREE.MeshStandardMaterial({ color: 0xd8cbb8, roughness: 0.82 });
    const roofGrayMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.65, metalness: 0.22 });
    const roofTrimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.4 });
    const doorDarkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.55 });
    const skylightMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.2 });
    const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x7d8895, roughness: 0.85 });
    const canalBedMat = new THREE.MeshStandardMaterial({ color: 0x1e4a63, roughness: 0.92 });
    const canalWaterMat = new THREE.MeshStandardMaterial({
      color: 0x26a6db,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
      roughness: 0.14,
      metalness: 0.16
    });

    // Main Industrial Compound Gravel/Sandstone Yard Slab (X = -46..-14.8, Z = -31.8..+12.0)
    const mainYard = new THREE.Mesh(new THREE.BoxGeometry(31.2, 0.07, 43.8), yardMat);
    mainYard.position.set(-30.4, 0.035, -9.9);
    this.worldGroup.add(mainYard);

    // Concrete Sawmill Press & Warehouse Loading Aprons inside compound
    const sawPad = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.09, 10.2), concreteMat);
    sawPad.position.set(-29.0, 0.045, -10.5);
    const millPad = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.09, 7.6), concreteMat);
    millPad.position.set(-35.0, 0.045, 2.5);
    const eastApron = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.08, 41.5), concreteMat);
    eastApron.position.set(-20.4, 0.042, -9.9);
    this.worldGroup.add(sawPad, millPad, eastApron);

    // Continuous Instanced Wooden Plank Fence enclosing Logging Industry Zone (2 draw calls total!)
    const fenceSegs = [];
    // North fence (Z = -31.8, X = -46..-15)
    for (let x = -45.0; x <= -15.5; x += 2.5) fenceSegs.push({ x, z: -31.8, ry: 0 });
    // South fence right above the Recessed Canal (Z = +12.0, gate at -19.0 leading onto the wooden canal bridge!)
    for (let x = -45.0; x <= -15.5; x += 2.5) {
      if (x > -21.2 && x < -16.8) continue;
      fenceSegs.push({ x, z: 12.0, ry: 0 });
    }
    // West fence facing the Harvestable Forest (X = -46.0, wide forest gate Z = -14.5..-6.5)
    for (let z = -30.5; z <= 10.8; z += 2.5) {
      if (z > -14.8 && z < -6.2) continue;
      fenceSegs.push({ x: -46.0, z, ry: Math.PI / 2 });
    }
    // East fence facing West Main Ave (X = -14.8, wide road gates at Z=-10.5 and Z=7.8)
    for (let z = -30.5; z <= 10.8; z += 2.5) {
      if ((z > -14.0 && z < -7.0) || (z > 4.2 && z < 11.0)) continue;
      fenceSegs.push({ x: -14.8, z, ry: Math.PI / 2 });
    }

    const panelGeo = new THREE.BoxGeometry(2.45, 1.35, 0.16);
    panelGeo.translate(0, 0.68, 0);
    const postGeo = new THREE.BoxGeometry(0.24, 1.55, 0.24);
    postGeo.translate(0, 0.78, 0);
    const panelsInst = new THREE.InstancedMesh(panelGeo, fenceWoodMat, fenceSegs.length);
    const postsInst = new THREE.InstancedMesh(postGeo, fenceWoodMat, fenceSegs.length);
    const dummy = new THREE.Object3D();
    fenceSegs.forEach((f, idx) => {
      dummy.position.set(f.x, 0.04, f.z);
      dummy.rotation.set(0, f.ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      panelsInst.setMatrixAt(idx, dummy.matrix);
      postsInst.setMatrixAt(idx, dummy.matrix);
    });
    panelsInst.instanceMatrix.needsUpdate = true;
    postsInst.instanceMatrix.needsUpdate = true;
    panelsInst.computeBoundingSphere();
    postsInst.computeBoundingSphere();
    this.worldGroup.add(panelsInst, postsInst);

    // 3 Crisp Gabled Gray-Roofed Industrial Timber Warehouses (100% matching the 3 warehouses in reference image!)
    const buildIndustrialWarehouse = (wx, wz, widthX, depthZ, heightY) => {
      const wh = new THREE.Group();
      wh.position.set(wx, 0.08, wz);
      const body = new THREE.Mesh(new THREE.BoxGeometry(widthX, heightY, depthZ), wallBeigeMat);
      body.position.y = heightY * 0.5;
      wh.add(body);

      // Pitched gabled roof (2 sloped roof slabs + ridge cap + skylights)
      const roofSlopeW = widthX * 0.56;
      const slopeAng = 0.36;
      const roofY = heightY + Math.sin(slopeAng) * (roofSlopeW * 0.45);
      const roofL = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeW, 0.18, depthZ + 0.5), roofGrayMat);
      roofL.position.set(-widthX * 0.25, roofY, 0);
      roofL.rotation.z = slopeAng;
      const roofR = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeW, 0.18, depthZ + 0.5), roofGrayMat);
      roofR.position.set(widthX * 0.25, roofY, 0);
      roofR.rotation.z = -slopeAng;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.24, depthZ + 0.56), roofTrimMat);
      ridge.position.y = heightY + Math.sin(slopeAng) * roofSlopeW * 0.9;
      wh.add(roofL, roofR, ridge);

      // Triangular gable fill front & back (3-sided prism via CylinderGeometry)
      const gableH = Math.sin(slopeAng) * roofSlopeW * 0.88;
      const gableGeo = new THREE.ConeGeometry(widthX * 0.52, gableH, 4);
      gableGeo.rotateY(Math.PI / 4);
      const gableFill = new THREE.Mesh(gableGeo, wallBeigeMat);
      gableFill.scale.set(1.0, 1.0, (depthZ - 0.12) / (widthX * 0.72));
      gableFill.position.y = heightY + gableH * 0.42;
      wh.add(gableFill);

      // Industrial skylight panels on roof
      for (const sz of [-depthZ * 0.24, depthZ * 0.24]) {
        const sky = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.4), skylightMat);
        sky.position.set(-widthX * 0.24, roofY + 0.12, sz);
        sky.rotation.z = slopeAng;
        wh.add(sky);
      }
      // Wide steel roll-up loading bay doors facing west into the timber yard
      for (const dz of [-depthZ * 0.24, depthZ * 0.24]) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.14, heightY * 0.68, depthZ * 0.34), doorDarkMat);
        door.position.set(-widthX * 0.5 - 0.03, heightY * 0.34, dz);
        wh.add(door);
      }
      return wh;
    };
    this.worldGroup.add(
      buildIndustrialWarehouse(-20.2, -25.2, 6.8, 9.6, 3.1),
      buildIndustrialWarehouse(-20.2, -0.5, 6.8, 9.2, 3.1),
      buildIndustrialWarehouse(-20.2, 7.8, 6.4, 6.4, 2.7)
    );

    // 2 Compact Industrial Dust-Collector / Boiler Machinery Pods (matching gray pods in reference image!)
    const buildBoilerUnit = (bx, bz) => {
      const pod = new THREE.Group();
      pod.position.set(bx, 0.08, bz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.9, 3.2), roofTrimMat);
      base.position.y = 0.95;
      const hopper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 2.2), wallBeigeMat);
      hopper.position.set(-0.6, 2.4, 0);
      const stack1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 2.6, 8), doorDarkMat);
      stack1.position.set(1.0, 2.8, -0.6);
      const stack2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.1, 8), doorDarkMat);
      stack2.position.set(1.0, 2.55, 0.6);
      pod.add(base, hopper, stack1, stack2);
      return pod;
    };
    this.worldGroup.add(
      buildBoilerUnit(-28.0, -21.5),
      buildBoilerUnit(-41.2, 8.6)
    );

    // Neat Parallel Rows of Stacked Timber Log Yards inside West Half of Logging Compound (1 GPU draw call!)
    const logGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.6, 7);
    logGeo.rotateZ(Math.PI / 2);
    const logPileCenters = [
      // North Timber Bays
      [-40.5, -27.5], [-40.5, -23.5], [-34.5, -27.5], [-34.5, -23.5],
      [-40.5, -18.0], [-34.5, -18.0],
      // South Timber Bays (clean parallel rows with truck lanes between them!)
      [-41.0, -3.5], [-41.0, 0.5], [-41.0, 4.5],
      [-34.5, 8.8]
    ];
    const logMatrices = [];
    for (const [px, pz] of logPileCenters) {
      const offsets = [
        [0, 0.29, -0.56], [0, 0.29, 0], [0, 0.29, 0.56],
        [0, 0.72, -0.28], [0, 0.72, 0.28],
        [0, 1.15, 0]
      ];
      for (const [ox, oy, oz] of offsets) {
        logMatrices.push([px + ox, oy, pz + oz]);
      }
    }
    const logYardInst = new THREE.InstancedMesh(logGeo, logBarkMat, logMatrices.length);
    logMatrices.forEach(([lx, ly, lz], i) => {
      dummy.position.set(lx, ly, lz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      logYardInst.setMatrixAt(i, dummy.matrix);
    });
    logYardInst.instanceMatrix.needsUpdate = true;
    logYardInst.computeBoundingSphere();
    this.worldGroup.add(logYardInst);

    // -----------------------------------------------------------------------
    // SOUTHWEST RECESSED IRRIGATION CANAL, SPINNING WATERWHEEL & FARM TERRACE
    // Sculpted directly into terrain (X = -48.0..-14.8, Z = +13.4..+17.0)
    // ZERO square diorama blocks, ZERO Z-fighting, 100% ready for agriculture!
    // -----------------------------------------------------------------------
    const canalBed = new THREE.Mesh(new THREE.BoxGeometry(33.2, 0.2, 3.6), canalBedMat);
    canalBed.position.set(-31.4, -0.82, 15.2);
    const canalWater = new THREE.Mesh(new THREE.PlaneGeometry(33.0, 3.3), canalWaterMat);
    canalWater.rotation.x = -Math.PI / 2;
    canalWater.position.set(-31.4, -0.18, 15.2);

    // Crisp stone-concrete retaining embankments lining the recessed canal walls
    const canalWallN = new THREE.Mesh(new THREE.BoxGeometry(33.4, 1.08, 0.42), stoneWallMat);
    canalWallN.position.set(-31.4, -0.34, 13.4);
    const canalWallS = new THREE.Mesh(new THREE.BoxGeometry(33.4, 1.08, 0.42), stoneWallMat);
    canalWallS.position.set(-31.4, -0.34, 17.0);
    const canalCapE = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.08, 3.9), stoneWallMat);
    canalCapE.position.set(-14.8, -0.34, 15.2);
    const canalCapW = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.08, 3.9), stoneWallMat);
    canalCapW.position.set(-48.0, -0.34, 15.2);
    this.worldGroup.add(canalBed, canalWater, canalWallN, canalWallS, canalCapE, canalCapW);

    // Sturdy Wooden Irrigation Bridge crossing the Canal at X = -19.0 (connects Yard to Agricultural Terrace!)
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 4.4), fenceWoodMat);
    bridgeDeck.position.set(-19.0, 0.08, 15.2);
    const bridgeRailL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 4.4), fenceWoodMat);
    bridgeRailL.position.set(-20.8, 0.46, 15.2);
    const bridgeRailR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 4.4), fenceWoodMat);
    bridgeRailR.position.set(-17.2, 0.46, 15.2);
    this.worldGroup.add(bridgeDeck, bridgeRailL, bridgeRailR);

    // Spinning Wooden Waterwheel mounted cleanly in the Recessed Canal (-27.5, 0.78, 14.3)
    const wheelHub = new THREE.Group();
    wheelHub.position.set(-27.5, 0.78, 14.3);
    const wheelRingMat = new THREE.MeshStandardMaterial({ color: 0x5c3618, roughness: 0.78 });
    const wheelMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.65 });
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.1, 6, 16), wheelRingMat);
    rim1.position.z = -0.34;
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.1, 6, 16), wheelRingMat);
    rim2.position.z = 0.34;
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.35, 8), wheelMetalMat);
    axle.rotation.x = Math.PI / 2;
    wheelHub.add(rim1, rim2, axle);
    const paddleGeo = new THREE.BoxGeometry(0.12, 0.45, 0.8);
    const spokeGeo = new THREE.BoxGeometry(0.1, 2.7, 0.12);
    for (let s = 0; s < 4; s++) {
      const sp = new THREE.Mesh(spokeGeo, wheelRingMat);
      sp.rotation.z = (s * Math.PI) / 4;
      wheelHub.add(sp);
    }
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * Math.PI * 2;
      const pad = new THREE.Mesh(paddleGeo, fenceWoodMat);
      pad.position.set(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0);
      pad.rotation.z = a;
      wheelHub.add(pad);
    }
    this.waterwheel = wheelHub;
    this.worldGroup.add(wheelHub);

    // Agriculture-Ready Irrigated Farm Plots South of Canal (X = -35.5..-23.5, Z = +18.2..+23.6)
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5e3e24, roughness: 0.96 });
    const furrowMat = new THREE.MeshStandardMaterial({ color: 0x482d18, roughness: 0.98 });
    const irrChannel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 5.8), canalWaterMat);
    irrChannel.position.set(-29.5, 0.01, 20.3);
    const irrRimL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 5.8), stoneWallMat);
    irrRimL.position.set(-29.9, 0.04, 20.3);
    const irrRimR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 5.8), stoneWallMat);
    irrRimR.position.set(-29.1, 0.04, 20.3);
    this.worldGroup.add(irrChannel, irrRimL, irrRimR);

    for (const bedX of [-33.0, -26.0]) {
      const plotBed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 4.8), soilMat);
      plotBed.position.set(bedX, 0.05, 20.9);
      this.worldGroup.add(plotBed);
      for (let fz = -1.6; fz <= 1.6; fz += 0.8) {
        const furrow = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.28), furrowMat);
        furrow.position.set(bedX, 0.11, 20.9 + fz);
        this.worldGroup.add(furrow);
      }
      // Neat wooden plot border frame
      const borderN = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 0.14), fenceWoodMat);
      borderN.position.set(bedX, 0.08, 18.5);
      const borderS = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 0.14), fenceWoodMat);
      borderS.position.set(bedX, 0.08, 23.3);
      this.worldGroup.add(borderN, borderS);
    }

    // Charming Wooden Farm Pavilion / Gazebo right beside the Canal & West Ave (matching reference image!)
    const pavilion = new THREE.Group();
    pavilion.position.set(-18.5, 0.04, 20.0);
    const pavFloor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 3.2), concreteMat);
    pavFloor.position.y = 0.09;
    const pavRoof = new THREE.Mesh(new THREE.ConeGeometry(2.65, 1.05, 4), wallBeigeMat);
    pavRoof.rotation.y = Math.PI / 4;
    pavRoof.position.y = 2.65;
    pavilion.add(pavFloor, pavRoof);
    for (const px of [-1.25, 1.25]) {
      for (const pz of [-1.25, 1.25]) {
        const pPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 0.18), fenceWoodMat);
        pPost.position.set(px, 1.15, pz);
        pavilion.add(pPost);
      }
    }
    this.worldGroup.add(pavilion);

    // Individual Stylized Low-Poly Trees along the Far-Southwest Corner beside Canal (NO square diorama slabs!)
    const swTreeSpots = [
      [-45.8, 19.2, 1.05], [-43.2, 19.0, 0.92], [-40.6, 19.6, 1.0], [-38.0, 18.9, 0.88],
      [-45.0, 21.8, 0.95], [-42.2, 22.4, 1.12], [-39.4, 22.0, 0.96], [-37.2, 23.2, 0.85],
      [-46.2, 23.8, 0.9], [-40.8, 23.9, 1.02]
    ];
    const swTrunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1.35, 6);
    swTrunkGeo.translate(0, 0.68, 0);
    const swCrownGeo = new THREE.ConeGeometry(1.15, 2.9, 6);
    swCrownGeo.translate(0, 2.55, 0);
    const swTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
    const swCrownMat = new THREE.MeshStandardMaterial({ color: 0x4d8b31, roughness: 0.82, flatShading: true });
    const swTrunks = new THREE.InstancedMesh(swTrunkGeo, swTrunkMat, swTreeSpots.length);
    const swCrowns = new THREE.InstancedMesh(swCrownGeo, swCrownMat, swTreeSpots.length);
    const tColor = new THREE.Color();
    swTreeSpots.forEach(([tx, tz, sc], i) => {
      dummy.position.set(tx, 0.0, tz);
      dummy.rotation.set(0, i * 0.8, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      swTrunks.setMatrixAt(i, dummy.matrix);
      swCrowns.setMatrixAt(i, dummy.matrix);
      tColor.setHex(i % 2 === 0 ? 0x5c9c38 : 0x3b7a2c);
      swCrowns.setColorAt(i, tColor);
    });
    swTrunks.instanceMatrix.needsUpdate = true;
    swCrowns.instanceMatrix.needsUpdate = true;
    if (swCrowns.instanceColor) swCrowns.instanceColor.needsUpdate = true;
    swTrunks.computeBoundingSphere();
    swCrowns.computeBoundingSphere();
    this.worldGroup.add(swTrunks, swCrowns);
  }

  /**
   * BAND 2 (CENTER): Symmetrical 5-Row Residential Town Grid & Wide-Open Central Square Park
   * (X = -8.5..+13.5, Z = -32..+23.8) — 100% matching reference image grid!
   * Strictly separated from Logging Industry (West) and Infrastructure (East).
   */
  buildResidentialTownGrid() {
    const cobbleMat = new THREE.MeshStandardMaterial({ map: getGraniteCobbleTexture(6, 5), roughness: 0.78, metalness: 0.04 });
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x6ca84b, roughness: 0.92 });
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(4, 4), roughness: 0.72 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.08 });
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.32,
      roughness: 0.14,
      metalness: 0.22
    });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.85 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x358238, roughness: 0.86, flatShading: true });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });

    // Clean manicured green residential base terrace between Twin Main Avenues
    const townLawn = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.05, 55.6), lawnMat);
    townLawn.position.set(2.5, 0.025, -4.0);
    this.worldGroup.add(townLawn);

    // Symmetrical Cobblestone Pedestrian Grid dividing the 5 Rows & Central Park
    const laneDefs = [
      { x: 2.5, z: -24.2, w: 21.6, d: 2.0 }, // Between Row 1 & Row 2
      { x: 2.5, z: -16.6, w: 21.6, d: 2.0 }, // North Edge of Central Park
      { x: 2.5, z: -5.5, w: 21.6, d: 2.0 },  // Center Park East-West Promenade
      { x: 2.5, z: 3.6, w: 21.6, d: 2.0 },   // South Edge of Central Park
      { x: 2.5, z: 13.0, w: 21.6, d: 2.0 },  // Between Row 4 (Villas) & Row 5 (Harbor Cottages)
      { x: 2.5, z: 22.0, w: 21.6, d: 2.6 },  // South Waterfront Promenade
      { x: 2.5, z: -4.0, w: 2.2, d: 55.2 },  // Central North-South Spine
      { x: -3.2, z: -4.0, w: 1.5, d: 55.2 }, // West Interior Footpath
      { x: 8.2, z: -4.0, w: 1.5, d: 55.2 }   // East Interior Footpath
    ];
    for (const l of laneDefs) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(l.w, 0.07, l.d), cobbleMat);
      m.position.set(l.x, 0.036, l.z);
      this.worldGroup.add(m);
    }

    // Central Square Park Plaza at (2.5, 0, -5.5)
    const parkPlaza = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.085, 9.6), cobbleMat);
    parkPlaza.position.set(2.5, 0.044, -5.5);
    this.worldGroup.add(parkPlaza);

    // Tiered Marble Fountain at the Heart of Central Square Park (2.5, 0.09, -5.5)
    const fountain = new THREE.Group();
    fountain.position.set(2.5, 0.09, -5.5);
    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.44, 8), travMat);
    outerBasin.position.y = 0.22;
    const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 0.14, 14), poolWaterMat);
    waterPool.position.y = 0.36;
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.25, 8), marbleMat);
    pedestal.position.y = 0.74;
    const midBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.36, 0.3, 10), marbleMat);
    midBowl.position.y = 1.2;
    const topSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.6, 8), brassMat);
    topSpire.position.y = 1.58;
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), brassMat);
    finial.position.y = 1.98;
    fountain.add(outerBasin, waterPool, pedestal, midBowl, topSpire, finial);

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
      new THREE.RingGeometry(0.82, 0.98, 18),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    this.fountainRipple.rotation.x = -Math.PI / 2;
    this.fountainRipple.position.y = 0.44;
    this.fountainJetsGroup.add(this.fountainRipple);
    fountain.add(this.fountainJetsGroup);
    this.worldGroup.add(fountain);

    // 4 Park Benches facing Central Square Fountain (2.5, -5.5)
    const benchPositions = [
      [2.5, -8.8, 0],
      [2.5, -2.2, Math.PI],
      [-0.8, -5.5, Math.PI / 2],
      [5.8, -5.5, -Math.PI / 2]
    ];
    for (const [bx, bz, ry] of benchPositions) {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, 0.09, bz);
      bGroup.rotation.y = ry;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.56), timberMat);
      seat.position.y = 0.42;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.38, 0.09), timberMat);
      back.position.set(0, 0.66, -0.23);
      const legGeo = new THREE.BoxGeometry(0.11, 0.42, 0.48);
      [-0.7, 0.7].forEach((lx) => {
        const leg = new THREE.Mesh(legGeo, ironMat);
        leg.position.set(lx, 0.21, 0);
        bGroup.add(leg);
      });
      bGroup.add(seat, back);
      this.worldGroup.add(bGroup);
    }

    // TimberPort Town Square Monument Plaque at Park South-East Corner
    const monument = new THREE.Group();
    monument.position.set(6.4, 0.09, -1.6);
    monument.rotation.y = -0.38;
    const monPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.54, 0.72), travMat);
    monPlinth.position.y = 0.27;
    const monSlab = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.9, 0.2), ironMat);
    monSlab.position.y = 1.0;
    const monSignTex = getIlluminatedSignTexture('TIMBERPORT TOWN', 'QUẢNG TRƯỜNG TRUNG TÂM');
    const monSignMat = new THREE.MeshStandardMaterial({
      map: monSignTex,
      emissiveMap: monSignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.65,
      roughness: 0.35
    });
    const monFace = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.78), monSignMat);
    monFace.position.set(0, 1.0, 0.11);
    monument.add(monPlinth, monSlab, monFace);
    this.worldGroup.add(monument);

    // -----------------------------------------------------------------------
    // 18 Perfectly Grid-Aligned GitHub GLB Houses in 4 GPU Draw Calls Total!
    // Exact 4 Columns: X = -6.0, -0.4, +5.4, +10.8 (each inside its own square lot!)
    // -----------------------------------------------------------------------
    // Row 1 (North Terrace, Z = -28.0): 4 Alpine Timber Houses (nhatuyet_opt.glb)
    const nhatuyetGroup = createInstancedGlbGroup(
      '/models/nhatuyet_opt.glb',
      [
        { x: -6.0, y: 0.05, z: -28.0, ry: 0 },
        { x: -0.4, y: 0.05, z: -28.0, ry: 0 },
        { x: 5.4, y: 0.05, z: -28.0, ry: 0 },
        { x: 10.8, y: 0.05, z: -28.0, ry: 0 }
      ],
      { targetHeight: 3.45, sinkY: 0.04 }
    );
    // Row 2 (Upper Town, Z = -20.4) + 2 Park Corner Cottages: 6 Cozy Wooden Cottages (nhacap4_opt.glb)
    const nhacap4Group = createInstancedGlbGroup(
      '/models/nhacap4_opt.glb',
      [
        { x: -6.0, y: 0.05, z: -20.4, ry: 0 },
        { x: -0.4, y: 0.05, z: -20.4, ry: 0 },
        { x: 5.4, y: 0.05, z: -20.4, ry: 0 },
        { x: 10.8, y: 0.05, z: -20.4, ry: 0 },
        { x: -6.0, y: 0.05, z: -12.6, ry: Math.PI / 2 },
        { x: 10.8, y: 0.05, z: -12.6, ry: -Math.PI / 2 }
      ],
      { targetHeight: 2.85, sinkY: 0.03 }
    );
    // Row 4 (Lower Town Villas, Z = +8.4): 4 Stately 2-Story Gray-Roofed Townhomes (bietthu_opt.glb)
    const bietthuGroup = createInstancedGlbGroup(
      '/models/bietthu_opt.glb',
      [
        { x: -6.0, y: 0.05, z: 8.4, ry: 0 },
        { x: -0.4, y: 0.05, z: 8.4, ry: 0 },
        { x: 5.4, y: 0.05, z: 8.4, ry: 0 },
        { x: 10.8, y: 0.05, z: 8.4, ry: 0 }
      ],
      { targetHeight: 4.15, sinkY: 0.04 }
    );
    // Row 5 (South Harborfront Cottages, Z = +17.5): 4 Cozy Gabled Cottages (nhasan_opt.glb)
    const nhasanGroup = createInstancedGlbGroup(
      '/models/nhasan_opt.glb',
      [
        { x: -6.0, y: 0.05, z: 17.5, ry: 0 },
        { x: -0.4, y: 0.05, z: 17.5, ry: 0 },
        { x: 5.4, y: 0.05, z: 17.5, ry: 0 },
        { x: 10.8, y: 0.05, z: 17.5, ry: 0 }
      ],
      { targetHeight: 3.05, sinkY: 0.03 }
    );
    this.worldGroup.add(nhatuyetGroup, nhacap4Group, bietthuGroup, nhasanGroup);

    // Instanced Neat Green Yard Hedges framing every house row & park lawn cleanly (1 draw call!)
    const hedgeSpots = [];
    for (const hz of [-30.6, -25.4, -22.8, -17.8, 5.4, 11.4, 14.6, 20.2]) {
      for (const hx of [-6.0, -0.4, 5.4, 10.8]) {
        hedgeSpots.push([hx, hz, 3.8, 0.42]);
      }
    }
    // Park lawn perimeter hedges
    hedgeSpots.push(
      [-6.0, -9.2, 3.8, 0.42], [10.8, -9.2, 3.8, 0.42],
      [-6.0, 2.2, 3.8, 0.42], [10.8, 2.2, 3.8, 0.42]
    );
    const hGeo = new THREE.BoxGeometry(1, 0.52, 1);
    hGeo.translate(0, 0.26, 0);
    const hedgesInst = new THREE.InstancedMesh(hGeo, hedgeMat, hedgeSpots.length);
    const dummy = new THREE.Object3D();
    hedgeSpots.forEach(([hx, hz, sx, sz], i) => {
      dummy.position.set(hx, 0.05, hz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(sx, 1, sz);
      dummy.updateMatrix();
      hedgesInst.setMatrixAt(i, dummy.matrix);
    });
    hedgesInst.instanceMatrix.needsUpdate = true;
    hedgesInst.computeBoundingSphere();
    this.worldGroup.add(hedgesInst);

    // Ornamental Low-Poly Park Trees inside Central Square Park Quadrants (2 InstancedMesh draw calls)
    const parkTreeCoords = [
      [-6.4, -7.2], [-6.4, -3.4], [-6.4, 0.4],
      [11.0, -7.2], [11.0, -3.4], [11.0, 0.4],
      [-0.8, -12.6], [5.8, -12.6]
    ];
    const pkTrunkGeo = new THREE.CylinderGeometry(0.11, 0.16, 1.1, 6);
    pkTrunkGeo.translate(0, 0.55, 0);
    const pkCrownGeo = new THREE.DodecahedronGeometry(0.75, 0);
    pkCrownGeo.translate(0, 1.65, 0);
    const pkTrunks = new THREE.InstancedMesh(pkTrunkGeo, timberMat, parkTreeCoords.length);
    const pkCrowns = new THREE.InstancedMesh(pkCrownGeo, hedgeMat, parkTreeCoords.length);
    parkTreeCoords.forEach(([tx, tz], i) => {
      dummy.position.set(tx, 0.05, tz);
      dummy.rotation.set(0, i * 0.9, 0);
      dummy.scale.setScalar(0.92 + (i % 3) * 0.1);
      dummy.updateMatrix();
      pkTrunks.setMatrixAt(i, dummy.matrix);
      pkCrowns.setMatrixAt(i, dummy.matrix);
    });
    pkTrunks.instanceMatrix.needsUpdate = true;
    pkCrowns.instanceMatrix.needsUpdate = true;
    pkTrunks.computeBoundingSphere();
    pkCrowns.computeBoundingSphere();
    this.worldGroup.add(pkTrunks, pkCrowns);
  }

  /**
   * BAND 3 (EAST): Pure Infrastructure Zone (X = +19.5..+31.5, Z = -32..+20)
   * North Utility Station, Power Substation, Twin-Basin Water Treatment Plant,
   * Storage Silos & Circular Blue Tank Yard + Pine Buffer cleanly flanking the East Railway (X = +33.5)!
   */
  buildInfrastructureZone() {
    const padMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.84 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.48, metalness: 0.62 });
    const siloMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.36, metalness: 0.45 });
    const basinWaterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.28,
      roughness: 0.14,
      metalness: 0.2
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    const dummy = new THREE.Object3D();

    // 0. North Utility Control Building at (24.5, 0, -29.0) (matching top-right of reference image!)
    const utilPad = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.09, 5.8), padMat);
    utilPad.position.set(24.5, 0.045, -29.0);
    const utilBldgA = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.9, 3.6), siloMat);
    utilBldgA.position.set(22.4, 1.02, -29.0);
    const utilRoofA = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 3.8), steelMat);
    utilRoofA.position.set(22.4, 2.04, -29.0);
    const utilBldgB = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 3.0), siloMat);
    utilBldgB.position.set(26.6, 0.78, -28.8);
    const utilTank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 10), basinWaterMat);
    utilTank.position.set(26.6, 1.65, -28.8);
    this.worldGroup.add(utilPad, utilBldgA, utilRoofA, utilBldgB, utilTank);

    // 1. Power Substation Compound at (24.5, 0, -21.0)
    const subPad = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.09, 6.8), padMat);
    subPad.position.set(24.5, 0.045, -21.0);
    this.worldGroup.add(subPad);

    const transGeo = new THREE.BoxGeometry(1.5, 1.35, 1.2);
    transGeo.translate(0, 0.68, 0);
    const transInst = new THREE.InstancedMesh(transGeo, steelMat, 3);
    [-2.2, 0, 2.2].forEach((ox, i) => {
      dummy.position.set(24.5 + ox, 0.09, -21.8);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      transInst.setMatrixAt(i, dummy.matrix);
    });
    transInst.instanceMatrix.needsUpdate = true;
    transInst.computeBoundingSphere();

    const pylonGeo = new THREE.CylinderGeometry(0.14, 0.34, 4.4, 4);
    pylonGeo.translate(0, 2.2, 0);
    const pylonInst = new THREE.InstancedMesh(pylonGeo, steelMat, 4);
    [[-2.8, -19.2], [0, -19.2], [2.8, -19.2], [2.8, -22.8]].forEach(([ox, pz], i) => {
      dummy.position.set(24.5 + ox, 0.09, pz);
      dummy.rotation.set(0, Math.PI / 4, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pylonInst.setMatrixAt(i, dummy.matrix);
    });
    pylonInst.instanceMatrix.needsUpdate = true;
    pylonInst.computeBoundingSphere();
    this.worldGroup.add(transInst, pylonInst);

    // 2. Twin-Basin Water Treatment Plant at (24.5, 0, -12.0)
    const wtPad = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.1, 7.2), padMat);
    wtPad.position.set(24.5, 0.05, -12.0);
    const basin1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 4.6), basinWaterMat);
    basin1.position.set(22.5, 0.14, -12.0);
    const basin2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 4.6), basinWaterMat);
    basin2.position.set(26.5, 0.14, -12.0);
    const filterHouse = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 1.5), siloMat);
    filterHouse.position.set(24.5, 0.95, -14.7);
    const filterRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 1.7), steelMat);
    filterRoof.position.set(24.5, 1.92, -14.7);
    this.worldGroup.add(wtPad, basin1, basin2, filterHouse, filterRoof);

    // 3. Storage Silos & Circular Blue Tank Yard at (24.5, 0, -2.5)
    const siloPad = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.09, 7.2), padMat);
    siloPad.position.set(24.5, 0.045, -2.5);
    const roundRim = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 0.72, 14), siloMat);
    roundRim.position.set(22.6, 0.4, -2.5);
    const roundWater = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.14, 14), basinWaterMat);
    roundWater.position.set(22.6, 0.72, -2.5);
    this.worldGroup.add(siloPad, roundRim, roundWater);

    // 3 Tall Metallic Storage Silos (1 InstancedMesh)
    const siloGeo = new THREE.CylinderGeometry(0.85, 0.88, 3.6, 10);
    siloGeo.translate(0, 1.8, 0);
    const silosInst = new THREE.InstancedMesh(siloGeo, siloMat, 3);
    [[26.3, -4.1], [26.3, -2.1], [26.3, -0.1]].forEach(([sx, sz], i) => {
      dummy.position.set(sx, 0.09, sz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, i === 1 ? 1.15 : 0.95, 1);
      dummy.updateMatrix();
      silosInst.setMatrixAt(i, dummy.matrix);
    });
    silosInst.instanceMatrix.needsUpdate = true;
    silosInst.computeBoundingSphere();

    const safetyStripe = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.06, 0.25), accentMat);
    safetyStripe.position.set(24.5, 0.1, 1.0);
    this.worldGroup.add(silosInst, safetyStripe);

    // Neat Green Low-Poly Pine Buffer along East Infrastructure Greenbelt (matching reference image!)
    const infraTrees = [
      [29.5, -2.0], [30.2, 0.5], [29.4, 2.8], [30.5, 5.2], [29.8, 12.2], [30.4, 15.0]
    ];
    const iTrunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6);
    iTrunkGeo.translate(0, 0.55, 0);
    const iCrownGeo = new THREE.ConeGeometry(0.95, 2.5, 6);
    iCrownGeo.translate(0, 2.25, 0);
    const iTrunks = new THREE.InstancedMesh(iTrunkGeo, new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 }), infraTrees.length);
    const iCrowns = new THREE.InstancedMesh(iCrownGeo, new THREE.MeshStandardMaterial({ color: 0x4d8b31, roughness: 0.82, flatShading: true }), infraTrees.length);
    infraTrees.forEach(([tx, tz], i) => {
      dummy.position.set(tx, 0, tz);
      dummy.rotation.set(0, i * 0.7, 0);
      dummy.scale.setScalar(0.9 + (i % 3) * 0.12);
      dummy.updateMatrix();
      iTrunks.setMatrixAt(i, dummy.matrix);
      iCrowns.setMatrixAt(i, dummy.matrix);
    });
    iTrunks.instanceMatrix.needsUpdate = true;
    iCrowns.instanceMatrix.needsUpdate = true;
    iTrunks.computeBoundingSphere();
    iCrowns.computeBoundingSphere();
    this.worldGroup.add(iTrunks, iCrowns);
  }

  buildCoastalPromenadeAndFishery() {
    const stoneWallMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(10, 1), roughness: 0.8 });
    const boardwalkMat = new THREE.MeshStandardMaterial({ map: getBoardwalkPlankTexture(14, 1), roughness: 0.76 });
    const postWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.86 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd6b37c, roughness: 0.88 });

    // Clean Stone Seawall Coping along the Center Residential Waterfront ONLY (zero clutter in farm/canal or harbor!)
    const centerSeawall = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.36, 0.75), stoneWallMat);
    centerSeawall.position.set(2.5, 0.12, 24.5);
    centerSeawall.receiveShadow = !this.lowSpec;

    // Clean Wooden Boardwalk Deck along Center Residential Waterfront
    const centerBoardwalk = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.14, 2.0), boardwalkMat);
    centerBoardwalk.position.set(2.5, 0.07, 23.3);
    centerBoardwalk.receiveShadow = !this.lowSpec;
    this.worldGroup.add(centerSeawall, centerBoardwalk);

    // Neat Wooden Post & Rope Railings along Center Waterfront (open gap at Ferry Pier X = 2.5)
    const fencePostsX = [-7.5, -5.0, -2.5, 0.0, 5.0, 7.5, 10.0, 12.5];
    const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.86, 6);
    postGeo.translate(0, 0.43, 0);
    const postsInst = new THREE.InstancedMesh(postGeo, postWoodMat, fencePostsX.length);
    const railSegments = [-6.25, -3.75, -1.25, 6.25, 8.75, 11.25];
    const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 5);
    ropeGeo.rotateZ(Math.PI / 2);
    const ropesInst = new THREE.InstancedMesh(ropeGeo, ropeMat, railSegments.length);

    const dummy = new THREE.Object3D();
    fencePostsX.forEach((fx, i) => {
      dummy.position.set(fx, 0.08, 24.15);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postsInst.setMatrixAt(i, dummy.matrix);
    });
    postsInst.instanceMatrix.needsUpdate = true;
    postsInst.computeBoundingSphere();

    railSegments.forEach((rx, i) => {
      dummy.position.set(rx, 0.68, 24.15);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ropesInst.setMatrixAt(i, dummy.matrix);
    });
    ropesInst.instanceMatrix.needsUpdate = true;
    ropesInst.computeBoundingSphere();
    this.worldGroup.add(postsInst, ropesInst);
  }

  buildForestEcology() {
    const forestPadMat = new THREE.MeshStandardMaterial({
      map: getForestFloorTexture(4, 4),
      roughness: 0.94,
      metalness: 0.0
    });
    const forestPad = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 13.5, 0.04, 12), forestPadMat);
    forestPad.scale.set(0.85, 1, 1.45);
    forestPad.position.set(-51, 0.012, -8);
    this.worldGroup.add(forestPad);

    const dummy = new THREE.Object3D();
    const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const rockSpots = [
      [-58.0, -24.0, 1.15], [-59.0, -10.0, 1.05], [-58.5, 4.0, 0.95],
      [-48.0, -28.0, 0.9], [-46.0, 14.0, 0.85], [-55.0, -18.0, 0.65]
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
    forestRocks.computeBoundingSphere();
    this.worldGroup.add(forestRocks);
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

    // 1. Harbor Gateway Archway at South-East Harbor Entrance (16.5, 0, 21.8) spanning East Main Ave cleanly
    const archGroup = new THREE.Group();
    archGroup.position.set(16.5, 0, 21.8);

    [-3.4, 3.4].forEach((px) => {
      const pierBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), travMat);
      pierBase.position.set(px, 0.35, 0);
      const pierCol = new THREE.Mesh(new THREE.BoxGeometry(0.92, 5.0, 0.92), travMat);
      pierCol.position.set(px, 2.8, 0);
      pierCol.castShadow = !this.lowSpec;
      const collar = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.24, 1.08), brassMat);
      collar.position.set(px, 5.2, 0);
      const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.22), warmLightMat);
      sconce.position.set(px, 3.2, -0.56);
      archGroup.add(pierBase, pierCol, collar, sconce);
    });

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.72, 1.15), slateMat);
    archBeam.position.set(0, 5.58, 0);
    archBeam.castShadow = !this.lowSpec;
    const archRoof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.28, 1.45), timberMat);
    archRoof.position.set(0, 6.08, 0);
    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(8.48, 0.12, 1.52), brassMat);
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
    const signNorth = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.0), harborSignMat);
    signNorth.position.set(0, 5.62, -0.6);
    signNorth.rotation.y = Math.PI;
    const signSouth = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.0), harborSignMat);
    signSouth.position.set(0, 5.62, 0.6);
    archGroup.add(signNorth, signSouth);
    this.worldGroup.add(archGroup);

    // 2. Plaza Clock Tower cleanly at South-West Corner of Central Square Park (-1.5, 0.09, -1.6)
    const clockTower = new THREE.Group();
    clockTower.position.set(-1.5, 0.09, -1.6);

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
      [6.4, 0.09, -9.2, 4.4],
      [13.1, 5.4, 21.8, 2.8],
      [19.9, 5.4, 21.8, 2.8]
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
        baseX: atMill ? -27.0 : -40.2,
        baseY: atMill ? 4.4 : 4.4,
        baseZ: atMill ? -21.5 : 8.6,
        phase: (i % 7) / 7,
        speed: 0.22 + (i % 3) * 0.03
      });
    }
    this.ambientLifeGroup.add(this.smokePuffs);

    // 4. Drifting Forest Leaves strictly in the West Harvestable Forest (X = -65..-49)
    const leafGeo = new THREE.BoxGeometry(0.24, 0.04, 0.16);
    const leafMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const leafCount = 26;
    this.forestLeaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const leafColor = new THREE.Color();
    for (let i = 0; i < leafCount; i++) {
      this.leafData.push({
        x: -64 + (i % 5) * 3.4 + Math.random() * 1.2,
        z: -26 + Math.floor(i / 5) * 6.2 + Math.random() * 1.2,
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

    // Clean Stylized Distant Northern Horizon Hills (NO square diorama slabs!)
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3b6e42, roughness: 0.9, flatShading: true });
    [[-34, -56, 14, 9], [0, -60, 18, 11], [34, -56, 15, 9.5]].forEach(([hx, hz, hr, hh]) => {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(hr, hh, 7), hillMat);
      hill.position.set(hx, hh * 0.42, hz);
      this.worldGroup.add(hill);
    });

    // Lean Granite Perimeter Rocks (kept cleanly outside the 3-band town & airport)
    const rockGeo = new THREE.DodecahedronGeometry(2.8, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, flatShading: true });
    const rockCount = this.lowSpec ? 10 : 20;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    for (let i = 0; i < rockCount; i++) {
      const side = i % 2;
      const rx = side === 0 ? -62 - Math.random() * 10 : 58 + Math.random() * 10;
      const rz = -42 + (i / rockCount) * 60;
      dummy.position.set(rx, 0.7 + Math.random() * 1.1, rz);
      dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      const s = 0.75 + Math.random() * 1.1;
      dummy.scale.set(s * 1.25, s * 0.85, s);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.6, 0.1, 0.38 + Math.random() * 0.12);
      rocks.setColorAt(i, color);
    }
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    rocks.computeBoundingSphere();
    this.worldGroup.add(rocks);

    // Lean InstancedMesh Perimeter Pines framing the far West & East boundaries (Max-FPS optimized)
    const count = this.lowSpec ? 24 : 56;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.35, 2.2, 6);
    trunkGeo.translate(0, 1.1, 0);
    const crownGeo = new THREE.ConeGeometry(1.55, 3.6, 6);
    crownGeo.translate(0, 3.4, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9, flatShading: true });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.82, flatShading: true });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);

    const half = Math.floor(count / 2);
    for (let i = 0; i < count; i++) {
      const isWest = i < half;
      const t = (i % half) / Math.max(1, half);
      const tx = isWest ? -61 - Math.random() * 12 : 55 + Math.random() * 12;
      const tz = -42 + t * 62;
      const scale = 0.85 + Math.random() * 0.3;
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
    // Open-air Sawmill Conveyor Press strictly inside West Logging Compound
    this.sawmill = createSawmillModel();
    this.sawmill.position.set(-29.0, 0, -10.5);
    this.worldGroup.add(this.sawmill);

    // South-East Wooden Timber Harbor with 4 finger piers & 3 docked timber ships (100% matching reference image!)
    this.harbor = createHarborStructure();
    this.harbor.position.set(23.0, 0, 25.0);
    this.worldGroup.add(this.harbor);

    // Pre-built animated Cargo Tug (Azure Sailor Tug HQ) cruising the outer bay lane
    this.cargoFreighter = createCargoFreighterModel(this.lowSpec);
    this.cargoFreighter.position.set(-40, 0.05, 62);
    this.worldGroup.add(this.cargoFreighter);

    // Live Timber Logistics Trucks (from trucks_collection.glb) looping cleanly along West & East Main Avenues
    const truckRoutes = [
      {
        type: 'flatbed_truck',
        speed: 4.9,
        waypoints: [
          { x: -10.3, z: -33.2 },
          { x: -10.3, z: 22.0 },
          { x: -12.7, z: 22.0 },
          { x: -12.7, z: -33.2 }
        ]
      },
      {
        type: 'timber_truck',
        speed: 4.5,
        waypoints: [
          { x: 15.3, z: -33.2 },
          { x: 15.3, z: 22.4 },
          { x: 17.7, z: 22.4 },
          { x: 17.7, z: -33.2 }
        ]
      }
    ];
    for (let i = 0; i < truckRoutes.length; i++) {
      const cfg = truckRoutes[i];
      const truck = createVehicleModel(cfg.type, this.lowSpec);
      const wp0 = cfg.waypoints[0];
      const wp1 = cfg.waypoints[1];
      const startYaw = Math.atan2(wp1.x - wp0.x, wp1.z - wp0.z);
      truck.position.set(wp0.x, 0.03, wp0.z);
      truck.rotation.y = startYaw;
      this.worldGroup.add(truck);
      this.roadTrucks.push({
        mesh: truck,
        waypoints: cfg.waypoints,
        wpIdx: 1,
        speed: cfg.speed,
        curSpeed: cfg.speed,
        yaw: startYaw,
        pauseTimer: 0,
        carrying: true,
        exhaustTimer: i * 0.45
      });
    }

    // Subtle pier point light gated OFF on <8GB RAM low-spec laptops
    this.harborBeaconLight = new THREE.PointLight(0xfef08a, 1.8, 26, 1.6);
    this.harborBeaconLight.position.set(23.0, 6.2, 34);
    this.harborBeaconLight.visible = !this.lowSpec;
    this.worldGroup.add(this.harborBeaconLight);

    // Pre-built VIP Yacht (boat.glb) docked cleanly at Far-East Yacht Berth (39, 33.5)
    this.vipYacht = createVipYachtModel(this.lowSpec);
    this.vipYacht.position.set(41.5, 0.05, 33.5);
    this.vipYacht.rotation.y = Math.PI * 0.14;
    this.worldGroup.add(this.vipYacht);
    this.syncYachtTier(gameState.yachtTier || 0);

    // Pre-built Harbor Gantry Container Crane beside South-East Harbor Quay
    this.gantryCrane = createGantryCraneModel(this.lowSpec);
    this.gantryCrane.position.set(17.5, 0.62, 28.8);
    this.worldGroup.add(this.gantryCrane);

    // Pre-built Airport Runway & Hangar (Cleanly placed East of the Railway at x=43.5, z=-4)
    this.airport = createAirportRunwayModel(this.lowSpec);
    this.airport.position.set(43.5, 0, -4);
    this.worldGroup.add(this.airport);
    this.syncAirportTier(gameState.airportTier || 0);

    // Pre-built Offshore Island Outpost & Supply Station (x=52, z=92)
    this.islandOutpost = createIslandOutpostModel(this.lowSpec);
    this.islandOutpost.position.set(52, -0.35, 92);
    this.worldGroup.add(this.islandOutpost);
    this.syncIslandTier(gameState.islandStationTier || 0);
    this.syncResortTier(gameState.islandResortTier || 0);

    // Pre-built Corporate HQ Tower at East Infrastructure Plaza (24.5, 0, 7.5)
    this.corporateHq = createCorporateHqModel(this.lowSpec);
    this.corporateHq.position.copy(ZONES.hqPlaza);
    this.corporateHq.rotation.y = -Math.PI * 0.5;
    this.worldGroup.add(this.corporateHq);
    this.syncHqTier(gameState.hqTier || 0);

    // Pre-built Luxury Furniture Factory inside West Logging Zone (-35.0, 0, 2.5)
    this.furnitureFactory = createFurnitureFactoryModel(this.lowSpec);
    this.furnitureFactory.position.copy(ZONES.furnitureMill);
    this.worldGroup.add(this.furnitureFactory);
    this.syncFurnitureMillTier(gameState.furnitureMillTier || 0);

    // Pre-built Coastal Maritime Lighthouse (-44.0, 0, 24.2)
    this.lighthouse = createLighthouseModel(this.lowSpec);
    this.lighthouse.position.copy(ZONES.lighthouse);
    this.worldGroup.add(this.lighthouse);
    this.syncLighthouseTier(gameState.lighthouseTier || 0);

    // Pre-built Deep-Water Container Pier, Mega Ship, Gantry Crane & Green Solar Microgrid (-24.0, 0, 31.5)
    this.deepContainerPort = createDeepContainerPortModel(this.lowSpec);
    this.deepContainerPort.position.set(-24.0, 0, 31.5);
    this.worldGroup.add(this.deepContainerPort);
    this.syncDeepPortTier(gameState.deepPortTier || 0, gameState.greenEnergyTier || 0);

    // Phase 8: Pre-built Industrial Railway Track, Depot & Diesel-Electric Freight Train (East Band X=+33.5)
    this.railwaySystem = createRailwayAndTrainModel(this.lowSpec);
    this.worldGroup.add(this.railwaySystem);
    this.syncRailwayTier(gameState.railwayTier || 0);

    // Phase 8: Pre-built Illuminated Helipad at East Corporate Plaza (24.5, 0, 16.5)
    this.helipad = createHelipadModel(this.lowSpec);
    this.helipad.position.copy(ZONES.helipad);
    this.worldGroup.add(this.helipad);
    this.syncHeliTier(gameState.heliTier || 0);

    // Phase 9: Pre-built Civic Promenade, Park Benches, Harbor Café & Golden Wall Street Arch
    this.civicPromenade = createCivicPromenadeModel(this.lowSpec);
    this.worldGroup.add(this.civicPromenade);
    this.syncCivicTier(gameState.civicTier || 0);

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

  syncCivicTier(tier = 0) {
    if (!this.civicPromenade) return;
    const u = this.civicPromenade.userData;
    if (u?.tier1Group) u.tier1Group.visible = tier >= 1;
    if (u?.tier2Group) u.tier2Group.visible = tier >= 2;
    if (u?.tier3Group) u.tier3Group.visible = tier >= 3;
  }

  applyNightMode(nightFactor = 0) {
    this.nightFactor = nightFactor;
    if (this.streetLampMat) {
      this.streetLampMat.emissiveIntensity = 0.55 + nightFactor * 1.95;
    }
    if (this.civicPromenade?.userData?.lampGlowMat) {
      this.civicPromenade.userData.lampGlowMat.emissiveIntensity = 0.65 + nightFactor * 2.1;
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
    // Harvestable Pine & Oak Forest STRICTLY OUTSIDE the West Logging Compound Fence (X = -65..-49.5, Z = -28..+8)
    // ZERO random trees inside the industrial yard or residential blocks!
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        spots.push({
          x: -64.5 + col * 4.8 + (Math.random() - 0.5) * 0.9,
          z: -26.5 + row * 6.4 + (Math.random() - 0.5) * 0.9
        });
      }
    }

    for (const [originX, originZ] of [[-91, -56], [-59, -65], [16, -91], [24, -139], [55, -157], [120, -45]]) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          spots.push({ x: originX + col * 5, z: originZ + row * 5.5 });
        }
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
      { id: 'axeTier', pos: new THREE.Vector3(-42.5, 0, -10.5), color: '#f59e0b', label: 'Nâng cấp Rìu' },
      { id: 'sawSpeedTier', pos: new THREE.Vector3(-29.0, 0, -16.5), color: '#ef4444', label: 'Tốc độ Máy Cưa' },
      { id: 'lumberjacks', pos: new THREE.Vector3(-37.0, 0, -15.5), color: '#10b981', label: 'Thuê Thợ Rừng' },
      { id: 'fishingBoats', pos: new THREE.Vector3(-12.5, 0.5, 29.5), color: '#0ea5e9', label: 'Mua Tàu Đánh Cá' }
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
    if (this.ocean3D) {
      updateOcean3D(this.ocean3D, 0, stormState.active ? 1 : 0, branch.waterColor);
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
    this.fisheryIsland.userData.pier.visible = gameState.islandRoute.pierBuilt;
    if (this.waterTex) {
      this.waterTex.offset.x = (elapsed * 0.025) % 1;
      this.waterTex.offset.y = (elapsed * 0.018) % 1;
    }

    if (this.sawmill) {
      const su = this.sawmill.userData;
      const damp = 1 - Math.exp(-10 * dt);
      const targetBeltSpeed = sawmillWorking ? 0.44 : 0.16;
      su.conveyorSpeed = (su.conveyorSpeed ?? 0.16) + (targetBeltSpeed - (su.conveyorSpeed ?? 0.16)) * damp;
      su.conveyorPhase = ((su.conveyorPhase || 0) + dt * su.conveyorSpeed) % 1;

      const beltY = su.glbSawLoaded ? 1.68 : 1.18;
      const beltZ = su.glbSawLoaded ? -0.20 : 0.0;
      const pressX = su.glbSawLoaded ? -1.20 : -0.50;

      // Animate moving conveyor belt cleats along X [-4.6 .. +4.6]
      if (su.conveyorSlats) {
        const slats = su.conveyorSlats;
        const count = slats.length;
        for (let i = 0; i < count; i++) {
          const t = (su.conveyorPhase + i / count) % 1;
          const sx = -4.6 + t * 9.2;
          const slat = slats[i];
          slat.position.set(sx, beltY + 0.02, beltZ);
          // Hide cleats cleanly while passing beneath the hydraulic press head
          slat.visible = !su.glbSawLoaded || sx < -2.15 || sx > -0.25;
        }
      }

      // Animate logs riding from hopper -> press arch -> transforming into fresh lumber planks
      if (su.conveyorItems) {
        const items = su.conveyorItems;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const t = (su.conveyorPhase + item.offset) % 1;
          const x = -4.75 + t * 9.5;
          const isPlank = x > pressX;

          // Trigger press compression impulse & wood-chip burst right when a log crosses the press
          if (item.lastX <= pressX && x > pressX) {
            su.pressRecoil = 1.0;
            if (sawmillWorking) {
              this._tmpPressPos = this._tmpPressPos || new THREE.Vector3();
              this._tmpPressPos.set(
                this.sawmill.position.x + pressX + 0.35,
                beltY + 0.35,
                this.sawmill.position.z + beltZ
              );
              this.spawnParticles(this._tmpPressPos, 0xe9c496, this.lowSpec ? 2 : 4);
            }
          }
          item.lastX = x;

          // Smooth drop-in from hopper (t < 0.07) and drop-off onto output table (t > 0.93)
          let yOffset = 0;
          let pitch = 0;
          if (t < 0.07) {
            const u = 1 - t / 0.07;
            yOffset = u * u * 0.48;
            pitch = -u * 0.25;
          } else if (t > 0.93) {
            const u = (t - 0.93) / 0.07;
            yOffset = -u * u * 0.42;
            pitch = -u * 0.32;
          }

          item.logMesh.visible = !isPlank;
          item.plankBundle.visible = isPlank;
          const baseY = isPlank ? beltY + 0.04 : beltY + 0.21;
          item.carrier.position.set(x, baseY + yOffset, beltZ);
          item.carrier.rotation.set(0, 0, pitch);

          // Gentle natural roll on raw logs before entering the press
          if (!isPlank) {
            item.logMesh.rotation.x = Math.sin(elapsed * 5 + i) * 0.08;
          }
        }
      }

      // Synchronized hydraulic press recoil & conveyor vibration on the GLB machine
      if (su.pressRecoil > 0) {
        su.pressRecoil = Math.max(0, su.pressRecoil - dt * 4.5);
      }
      if (su.glbSawLoaded && su.glbSawGroup) {
        const stroke = Math.sin(su.pressRecoil * Math.PI);
        const targetScaleY = 1 - stroke * (sawmillWorking ? 0.048 : 0.025);
        const targetVibX = sawmillWorking ? Math.sin(elapsed * 30) * 0.016 : 0;
        su.glbSawGroup.scale.y += (targetScaleY - su.glbSawGroup.scale.y) * damp;
        su.glbSawGroup.position.x += (targetVibX - su.glbSawGroup.position.x) * damp;
      } else if (su.sawBlade) {
        const speed = sawmillWorking ? 14 : 2.5;
        su.sawBlade.rotation.z -= dt * speed;
      }
    }
    if (this.harbor && this.harbor.userData.ship) {
      this.harbor.userData.ship.position.y = 0.08 + Math.sin(elapsed * 1.4) * 0.14;
      this.harbor.userData.hoistedCrate.position.y = 4.0 + Math.sin(elapsed * 1.1) * 0.6;
      if (this.harbor.userData.tier2Group?.visible && this.harbor.userData.lhBeacon) {
        this.harbor.userData.lhBeacon.rotation.y += dt * 1.6;
      }
    }

    const stormFactor = stormState.active ? 1.0 : 0.0;
    if (this.ocean3D) {
      updateOcean3D(this.ocean3D, elapsed, stormFactor);
    }

    if (this.cargoFreighter) {
      const phase = elapsed * 0.11;
      const fx = Math.sin(phase) * 58;
      const fz = 62 + Math.cos(phase) * 14;
      const vx = Math.cos(phase) * 58 * 0.11;
      const vz = -Math.sin(phase) * 14 * 0.11;
      const speed = Math.hypot(vx, vz);
      const targetYaw = Math.atan2(vx, vz);
      let yawDiff = targetYaw - this.cargoFreighterYaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      this.cargoFreighterYaw += yawDiff * Math.min(1, dt * 3.2);
      updateVesselBuoyancy(
        this.cargoFreighter,
        fx,
        fz,
        this.cargoFreighterYaw,
        speed,
        THREE.MathUtils.clamp(yawDiff * 1.4, -0.6, 0.6),
        elapsed,
        stormFactor,
        dt,
        0.05
      );
      // Gentle diesel funnel exhaust puffs
      const cfUd = this.cargoFreighter.userData;
      if (cfUd && cfUd.funnelAnchor) {
        cfUd.smokeTimer = (cfUd.smokeTimer || 0) + dt;
        if (cfUd.smokeTimer >= (this.lowSpec ? 0.55 : 0.28)) {
          cfUd.smokeTimer = 0;
          cfUd.funnelAnchor.getWorldPosition(this._tugSmokeVec);
          this.spawnParticles(this._tugSmokeVec, 0xe2e8f0, 1);
        }
      }
    }

    if (this.waterwheel) {
      this.waterwheel.rotation.z -= dt * 1.15;
    }

    if (this.vipYacht && this.vipYacht.visible) {
      updateVesselBuoyancy(
        this.vipYacht,
        41.5,
        33.5,
        Math.PI * 0.14,
        0,
        0,
        elapsed,
        stormFactor,
        dt,
        0.04
      );
    }

    // Animated Island Timber Logistics Trucks (real wheel spin, front steering, suspension)
    for (let i = 0; i < this.roadTrucks.length; i++) {
      const tr = this.roadTrucks[i];
      const target = tr.waypoints[tr.wpIdx];
      const dx = target.x - tr.mesh.position.x;
      const dz = target.z - tr.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (tr.pauseTimer > 0) {
        tr.pauseTimer -= dt;
        tr.curSpeed = THREE.MathUtils.lerp(tr.curSpeed, 0, Math.min(1, dt * 6));
        updateVehicleKinematics(tr.mesh, dt, tr.curSpeed, 0, tr.carrying, elapsed, true);
        continue;
      }

      if (dist < 1.35) {
        tr.wpIdx = (tr.wpIdx + 1) % tr.waypoints.length;
        // Brief realistic loading/unloading pause at sawmill/harbor ends
        if (tr.wpIdx === 0 || tr.wpIdx === 2) {
          tr.pauseTimer = 1.6;
          tr.carrying = tr.wpIdx === 0;
        }
        continue;
      }

      const slowNearCorner = dist < 4.5 ? THREE.MathUtils.clamp(dist / 4.5, 0.42, 1.0) : 1.0;
      const desiredSpeed = tr.speed * slowNearCorner;
      tr.curSpeed = THREE.MathUtils.lerp(tr.curSpeed, desiredSpeed, Math.min(1, dt * 4.5));

      const desiredYaw = Math.atan2(dx, dz);
      let yawDiff = desiredYaw - tr.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      const steerInput = THREE.MathUtils.clamp(yawDiff * 1.15, -0.48, 0.48);
      tr.yaw += yawDiff * Math.min(1, dt * 4.2);

      tr.mesh.position.x += Math.sin(tr.yaw) * tr.curSpeed * dt;
      tr.mesh.position.z += Math.cos(tr.yaw) * tr.curSpeed * dt;
      tr.mesh.rotation.y = tr.yaw;

      updateVehicleKinematics(tr.mesh, dt, tr.curSpeed, steerInput, tr.carrying, elapsed, true);
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
            { x: 33.5, y: 2.2, z: trainZ + 1.2 },
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
    this.regionalLife.dispose();
    disposeObject3D(this.worldGroup);
    this.scene.remove(this.worldGroup);
  }
}
