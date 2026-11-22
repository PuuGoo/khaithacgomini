/**
 * TimberPort 3D — Zoned 3D World Layout (Logging Industry | Residential & Park | Infrastructure & Rail | Fishing Waterfront)
 * Built with Real GLB Assets, Instanced Perimeter Fences per Zone, Wide Separation Avenues,
 * Clean Fishing-Boat Coastal Piers, Zero-leak Object Pools & Adaptive Performance
 */

import * as THREE from 'three';
import {
  getGrassTexture,
  getAsphaltTexture,
  getTravertineTexture,
  getGraniteCobbleTexture,
  getBoardwalkPlankTexture,
  getForestFloorTexture,
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
  createLoggingTruckModel,
  mountNormalizedGlb,
  disposeObject3D
} from './models.js';
import { gameState, fleetMissionState, stormState, getUpgradeCost, UPGRADE_CATALOG } from './state.js';
import { FISHERY_LOCATION } from './island-route.js';
import { LAND_EDGE_Z, WORLD_BOUNDS } from './regions.js';
import { RegionalLife } from './regional-life.js';

export { LAND_EDGE_Z, WORLD_BOUNDS };

// Master Zoned City Blueprint — spacious, separated bands with perimeter fences
export const MAP_ZONES = {
  logging: { minX: -114, maxX: -46, minZ: -102, maxZ: -2, label: 'Khu Công Nghiệp Gỗ', color: '#d97706' },
  forest: { minX: -114, maxX: -46, minZ: -140, maxZ: -110, label: 'Khu Rừng Khai Thác', color: '#16a34a' },
  residential: { minX: -22, maxX: 32, minZ: -102, maxZ: -2, label: 'Khu Dân Cư & Công Viên', color: '#38bdf8' },
  infrastructure: { minX: 58, maxX: 116, minZ: -102, maxZ: -2, label: 'Khu Hạ Tầng & Đường Sắt', color: '#a855f7' }
};

// Wood Delivery Drop-Off Zones in Other Districts (for self-driven & AI-driven Logging Yard Vehicles)
export const DELIVERY_DROPOFFS = [
  {
    id: 'residential',
    name: 'Kho Gỗ Khu Dân Cư',
    shortName: 'Khu Dân Cư',
    x: 5,
    z: -8,
    mult: 1.25,
    color: 0x38bdf8,
    routeFromYard: [[-52, -42], [-34, -42], [-34, 10], [5, 10], [5, -8]],
    routeToYard: [[5, 10], [-34, 10], [-34, -42], [-58, -42]]
  },
  {
    id: 'infrastructure',
    name: 'Ga Logistics Khu Hạ Tầng',
    shortName: 'Khu Hạ Tầng',
    x: 64,
    z: -42,
    mult: 1.5,
    color: 0xa855f7,
    routeFromYard: [[-52, -42], [-34, -42], [-34, 10], [45, 10], [45, -42], [64, -42]],
    routeToYard: [[45, -42], [45, 10], [-34, 10], [-34, -42], [-58, -42]]
  },
  {
    id: 'waterfront',
    name: 'Bến Đóng Tàu Cá Ven Biển',
    shortName: 'Bến Tàu Cá',
    x: 5,
    z: 17.5,
    mult: 1.35,
    color: 0x10b981,
    routeFromYard: [[-52, -42], [-34, -42], [-34, 10], [5, 10], [5, 17.5]],
    routeToYard: [[5, 10], [-34, 10], [-34, -42], [-58, -42]]
  }
];

// Coastal Wooden Fishing-Boat Pier Boarding & Docking Spots
export const FISHING_PIER_DOCKS = [
  { id: 'west', name: 'Cầu Tàu Cá Tây', pierX: -58, pierZ: 30, seaX: -58, seaZ: 39.5 },
  { id: 'center', name: 'Cầu Tàu Cá Trung Tâm', pierX: 5, pierZ: 30, seaX: 5, seaZ: 39.5 },
  { id: 'east', name: 'Cầu Tàu Cá Đông', pierX: 52, pierZ: 30, seaX: 52, seaZ: 39.5 }
];

export const HIGHLAND_TRAILS = [
  [[-114, 10], [-148, 10]],
  [[-148, 10], [-148, -125]],
  [[-148, -125], [5, -125]],
  [[5, -106], [5, -160]],
  [[116, 10], [154, 10]],
  [[154, 10], [154, -106]]
];

export const HIGHLAND_LANDMARKS = [
  { x: -80, z: -125, name: 'Rừng Khai Thác', color: '#a7f3d0' },
  { x: 5, z: -52, name: 'Khu Dân Cư', color: '#7dd3fc' },
  { x: 84, z: -52, name: 'Khu Hạ Tầng', color: '#d8b4fe' },
  { x: -80, z: -52, name: 'Khu Xưởng Gỗ', color: '#fcd34d' }
];

export const SEA_BOUNDS = { minX: WORLD_BOUNDS.minX - 15, maxX: WORLD_BOUNDS.maxX + 15, minZ: 27.5, maxZ: 145 };
export const AIR_BOUNDS = { minX: SEA_BOUNDS.minX - 20, maxX: SEA_BOUNDS.maxX + 20, minZ: WORLD_BOUNDS.minZ - 18, maxZ: 155, minY: 0.25, maxY: 34 };

export const ZONES = {
  // Logging Industry Zone (West Band)
  hopper: new THREE.Vector3(-82, 0, -42),
  sawOutput: new THREE.Vector3(-70, 0, -42),
  furnitureMill: new THREE.Vector3(-60, 0, -18),
  vehicleSpawn: new THREE.Vector3(-49, 0, -34),

  // Fishing Boat Waterfront (South Coastline — simple piers, full port deferred)
  ferryPier: new THREE.Vector3(5, 0, 23),
  harborExport: new THREE.Vector3(5, 0.4, 30),
  canneryDock: new THREE.Vector3(-58, 0.4, 29),
  yachtBerth: new THREE.Vector3(52, 0.4, 29),
  deepPort: new THREE.Vector3(-24, 0.4, 29),
  lighthouse: new THREE.Vector3(-92, 0, 23),

  // Infrastructure & Railway Zone (East Band)
  hqPlaza: new THREE.Vector3(76, 0, -46),
  railDepot: new THREE.Vector3(98, 0, -42),
  helipad: new THREE.Vector3(74, 0, -12),
  runwayStart: new THREE.Vector3(132, 0.14, 4),

  // Offshore Islands
  islandDock: new THREE.Vector3(41, 0.5, 86),
  islandAirDrop: new THREE.Vector3(52, 12, 92),
  harborAirDrop: new THREE.Vector3(5, 12, 32)
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
    this.civicPromenade = null;
    this.trainSmokeTimer = 0;
    this.weatherGroup = null;
    this.stormBeacon = null;
    this.seaTreasures = [];
    this.seaBeaconRing = null;
    this.airBeaconRing = null;
    this.harborBeaconLight = null;
    this.questRing = null;
    this.currentQuestTarget = ZONES.hopper.clone();
    this._weatherDummy = new THREE.Object3D();

    // Living world & animated props
    this.landDetailGroup = new THREE.Group();
    this.fountainJetsGroup = new THREE.Group();
    this.ambientLifeGroup = new THREE.Group();
    this.waterfallFoamGroup = new THREE.Group();
    this.landPointLights = [];
    this.streetLampMat = null;
    this.waterfallTex = null;
    this.fountainJets = [];
    this.fountainRipple = null;
    this.waterfallFoamPuffs = [];
    this.seagulls = [];
    this.flags = [];
    this.smokePuffs = null;
    this.smokeData = [];
    this.forestLeaves = null;
    this.leafData = [];
    this.waterwheel = null;
    this.mooredFishingBoats = [];
    this.yardVehicles = [];
    this.deliveryRings = [];
    this._lifeDummy = new THREE.Object3D();
    this.nightFactor = 0;

    this.initParticlePool();
    this.initFlyingPool();

    this.buildTerrainAndOcean();
    this.buildHighlandTrails();
    this.regionalLife = new RegionalLife(this.worldGroup);
    this.buildZoneAvenuesAndSignage();
    this.buildAllZoneFences();
    this.buildLoggingIndustryZone();
    this.buildResidentialZone();
    this.buildInfrastructureZone();
    this.buildFishingWaterfront();
    this.buildLivingWorldEffects();
    this.buildPerimeterNature();
    this.buildSawmillAndHarbor();
    this.buildHarvestableForest();
    this.buildArcadePads();
    this.buildQuestIndicator();
    this.setLowSpec(this.lowSpec);
  }

  // ---------------------------------------------------------------------------
  // 1. Terrain, Wide 2-Lane Avenues Separating Zones & Calm Bay Ocean
  // ---------------------------------------------------------------------------
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
    const land = new THREE.Mesh(new THREE.BoxGeometry(width, 2, LAND_EDGE_Z - northEdge), this.groundMat);
    land.position.set(centerX, -1, (LAND_EDGE_Z + northEdge) / 2);
    land.receiveShadow = !this.lowSpec;
    this.worldGroup.add(land);

    // Subtle sandy shoreline belt behind the stone fishing embankment
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe6cb94, roughness: 0.92, metalness: 0.0 });
    const beach = new THREE.Mesh(new THREE.BoxGeometry(width, 0.36, 5.5), sandMat);
    beach.position.set(centerX, -0.2, 24.4);
    beach.receiveShadow = !this.lowSpec;
    this.worldGroup.add(beach);

    // Wide 2-lane straight asphalt avenues cleanly dividing the 3 Zones
    const roadMat = new THREE.MeshStandardMaterial({
      map: getAsphaltTexture(),
      roughness: 0.82,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const roadSpecs = [
      // West Main Avenue (between Logging Zone maxX=-46 and Residential Zone minX=-22)
      { x: -34, z: -48, w: 7.4, d: 122, axis: 'z' },
      // East Main Avenue (between Residential Zone maxX=32 and Infrastructure Zone minX=58)
      { x: 45, z: -48, w: 7.4, d: 122, axis: 'z' },
      // South Waterfront Boulevard (connecting all 3 zones along z = +10)
      { x: 4, z: 10, w: 238, d: 7.4, axis: 'x' },
      // North Ring Avenue (separating main zones z=-102 from Forest z=-110)
      { x: 4, z: -106, w: 238, d: 6.4, axis: 'x' },
      // Connector spurs into each zone gate & fishing piers
      { x: -42, z: -42, w: 12, d: 6.2, axis: 'x' },   // Logging East Gate spur
      { x: -25, z: -52, w: 14, d: 5.8, axis: 'x' },   // Residential West Gate spur
      { x: 38, z: -52, w: 16, d: 5.8, axis: 'x' },    // Residential East Gate spur
      { x: 52, z: -46, w: 16, d: 6.0, axis: 'x' },    // Infrastructure West Gate spur
      { x: 5, z: 16, w: 6.4, d: 16, axis: 'z' },      // Center Pier road
      { x: -58, z: 16, w: 5.8, d: 15, axis: 'z' },    // West Fishing Pier road
      { x: 52, z: 16, w: 5.8, d: 15, axis: 'z' },     // East Fishing Pier road
      { x: 5, z: 3.5, w: 6.4, d: 14, axis: 'z' },     // Residential South Gate road
      { x: 74, z: 3.5, w: 6.0, d: 14, axis: 'z' },    // Infrastructure South Gate road
      { x: -72, z: 3.5, w: 6.0, d: 14, axis: 'z' }    // Logging South Gate road
    ];

    const dashCoords = [];
    for (const r of roadSpecs) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(r.x, 0.025, r.z);
      m.receiveShadow = !this.lowSpec;
      this.worldGroup.add(m);

      // Dashed white centerlines on major avenues
      if (r.d >= 100) {
        for (let zz = r.z - r.d * 0.46; zz <= r.z + r.d * 0.46; zz += 4.6) {
          dashCoords.push({ x: r.x, z: zz, ry: 0 });
        }
      } else if (r.w >= 100) {
        for (let xx = r.x - r.w * 0.46; xx <= r.x + r.w * 0.46; xx += 4.6) {
          dashCoords.push({ x: xx, z: r.z, ry: Math.PI / 2 });
        }
      }
    }

    if (dashCoords.length > 0) {
      const dashGeo = new THREE.PlaneGeometry(0.26, 2.2);
      dashGeo.rotateX(-Math.PI / 2);
      const dashInst = new THREE.InstancedMesh(dashGeo, dashMat, dashCoords.length);
      const dObj = new THREE.Object3D();
      dashCoords.forEach((p, idx) => {
        dObj.position.set(p.x, 0.036, p.z);
        dObj.rotation.set(0, p.ry, 0);
        dObj.scale.set(1, 1, 1);
        dObj.updateMatrix();
        dashInst.setMatrixAt(idx, dObj.matrix);
      });
      dashInst.instanceMatrix.needsUpdate = true;
      this.worldGroup.add(dashInst);
    }

    // Calm turquoise bay ocean
    this.waterTex = getWaterTexture('#0ea5e9');
    this.waterMat = new THREE.MeshStandardMaterial({
      map: this.waterTex,
      roughness: 0.22,
      metalness: 0.18
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(width + 140, 220), this.waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(centerX, -0.45, 130);
    ocean.receiveShadow = false;
    this.worldGroup.add(ocean);

    this.fisheryIsland = createFisheryIslandModel();
    this.fisheryIsland.rotation.y = Math.PI;
    this.fisheryIsland.position.set(FISHERY_LOCATION.x, 0, FISHERY_LOCATION.z);
    this.fisheryIsland.userData.pier.visible = gameState.islandRoute.pierBuilt;
    this.worldGroup.add(this.fisheryIsland);

    this.worldGroup.add(this.landDetailGroup);

    // Interactive World Floor Markers at exact new zone locations
    this.addFloorMarker(ZONES.hopper, 2.4, '#0ea5e9', 'NẠP GỖ VÀO MÁY', '🪵 Tự động hút');
    this.addFloorMarker(ZONES.sawOutput, 2.4, '#10b981', 'KHO VÁN & BÁN', '📦 Nhận hàng');
    this.addFloorMarker(ZONES.vehicleSpawn, 2.6, '#f59e0b', 'BÃI XE KHU GỖ', '🚘 Nhấn [E]');
    this.addFloorMarker(ZONES.furnitureMill, 2.4, '#fb7185', 'NHÀ MÁY NỘI THẤT', '🛋️ Chế biến & Bán');
    this.addFloorMarker(ZONES.ferryPier, 2.1, '#38bdf8', 'BẾN LIÊN ĐẢO', 'Mở Quần đảo');
    this.addFloorMarker(ZONES.harborExport, 2.5, '#10b981', 'CẦU TÀU GIAO HÀNG', '⛵ Giao hợp đồng');
    this.addFloorMarker(ZONES.canneryDock, 2.3, '#38bdf8', 'BẾN TÀU CÁ TÂY', '🐟 Neo đậu & Thu cá');
    this.addFloorMarker(ZONES.yachtBerth, 2.4, '#06b6d4', 'BẾN TÀU CÁ & DU THUYỀN', '🚤 Lái ra khơi [E]');
    this.addFloorMarker(ZONES.hqPlaza, 2.4, '#a855f7', 'TRỤ SỞ HẠ TẦNG', '🏢 Cổ phiếu & Tài chính');
    this.addFloorMarker(ZONES.railDepot, 2.3, '#f59e0b', 'GA ĐƯỜNG SẮT ĐÔNG', '🚂 Tàu Hỏa Logistics');
    this.addFloorMarker(ZONES.helipad, 2.5, '#38bdf8', 'BÃI TRỰC THĂNG VIP', '🚁 Cất cánh [E]');
    this.addFloorMarker(ZONES.runwayStart, 2.6, '#f59e0b', 'ĐƯỜNG BĂNG ĐÔNG', '✈️ Cất cánh [E]');
  }

  buildHighlandTrails() {
    const pathMaterial = new THREE.MeshStandardMaterial({ color: '#a48b63', roughness: 1 });
    let pathHeight = 0.022;
    for (const [[startX, startZ], [endX, endZ]] of HIGHLAND_TRAILS) {
      const width = Math.abs(endX - startX) + 3;
      const depth = Math.abs(endZ - startZ) + 3;
      const path = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), pathMaterial);
      path.rotation.x = -Math.PI / 2;
      path.position.set((startX + endX) / 2, pathHeight, (startZ + endZ) / 2);
      pathHeight += 0.0015;
      path.receiveShadow = !this.lowSpec;
      this.worldGroup.add(path);
    }
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

  // ---------------------------------------------------------------------------
  // 2. Avenue Streetlamps, Utility Poles & Zone Gateway Arch Signs
  // ---------------------------------------------------------------------------
  buildZoneAvenuesAndSignage() {
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(4, 1), roughness: 0.76 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.82 });
    const warmGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.15,
      roughness: 0.2
    });
    this.streetLampMat = warmGlassMat;

    // Streetlamps lining West Avenue (-34), East Avenue (+45), and Waterfront Blvd (z=10)
    const lampSpots = [];
    for (let z = -96; z <= 4; z += 16) {
      lampSpots.push([-38.5, z], [-29.5, z], [40.5, z], [49.5, z]);
    }
    for (let x = -100; x <= 104; x += 20) {
      lampSpots.push([x, 14.5], [x, 5.5]);
    }
    // Central Park lamps
    lampSpots.push([-5, -52], [15, -52], [-5, -36], [15, -36]);

    const lBaseGeo = new THREE.CylinderGeometry(0.12, 0.2, 3.4, 7);
    lBaseGeo.translate(0, 1.7, 0);
    const lHeadGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.44, 6);
    lHeadGeo.translate(0, 3.55, 0);
    const lGlowGeo = new THREE.SphereGeometry(0.22, 8, 8);
    lGlowGeo.translate(0, 3.3, 0);

    const lampPosts = new THREE.InstancedMesh(lBaseGeo, ironMat, lampSpots.length);
    const lampCaps = new THREE.InstancedMesh(lHeadGeo, ironMat, lampSpots.length);
    const lampBulbs = new THREE.InstancedMesh(lGlowGeo, warmGlassMat, lampSpots.length);
    const dummy = new THREE.Object3D();

    lampSpots.forEach(([lx, lz], i) => {
      dummy.position.set(lx, 0.04, lz);
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

    // Zone Entrance Arch Signboards for each separated district
    const buildGateSign = (x, z, ry, title, sub, accentHex) => {
      const arch = new THREE.Group();
      arch.position.set(x, 0, z);
      arch.rotation.y = ry;
      for (const px of [-3.9, 3.9]) {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.95), travMat);
        base.position.set(px, 0.325, 0);
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.62, 4.3, 0.62), ironMat);
        col.position.set(px, 2.45, 0);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 0.84), brassMat);
        cap.position.set(px, 4.65, 0);
        arch.add(base, col, cap);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.95, 0.72), ironMat);
      beam.position.set(0, 4.9, 0);
      const tex = getIlluminatedSignTexture(title, sub);
      const sMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.65,
        roughness: 0.35
      });
      const front = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.86), sMat);
      front.position.set(0, 4.9, 0.38);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.86), sMat);
      back.position.set(0, 4.9, -0.38);
      back.rotation.y = Math.PI;
      arch.add(beam, front, back);

      const badge = makeWorldBadgeSprite(title, sub, accentHex);
      badge.position.set(0, 6.6, 0);
      arch.add(badge);
      this.worldGroup.add(arch);
    };

    buildGateSign(-46, -42, Math.PI / 2, 'LOGGING INDUSTRY ZONE', 'KHU CÔNG NGHIỆP KHAI THÁC & XẺ GỖ', '#f59e0b');
    buildGateSign(5, -2, 0, 'KHU DÂN CƯ & CÔNG VIÊN', 'NHÀ Ở GLB · CÔNG VIÊN TRUNG TÂM', '#38bdf8');
    buildGateSign(58, -46, Math.PI / 2, 'INFRASTRUCTURE ZONE', 'HẠ TẦNG KỸ THUẬT · NHÀ GA ĐƯỜNG SẮT', '#a855f7');
    buildGateSign(5, 21.2, 0, 'BỜ KÈ & BẾN TÀU CÁ', 'KHU NEO ĐẬU TÀU CÁ VEN BIỂN', '#06b6d4');

    // 3 Warm Boulevard PointLights (gated off on lowSpec)
    for (const [wx, wy, wz] of [[5, 4.6, -45], [-74, 4.6, -42], [80, 4.6, -46]]) {
      const pl = new THREE.PointLight(0xfde68a, 1.75, 28, 1.6);
      pl.position.set(wx, wy, wz);
      pl.visible = !this.lowSpec;
      this.worldGroup.add(pl);
      this.landPointLights.push(pl);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Instanced Perimeter Fences Around Every Zone (with Open Entrance Gates)
  // ---------------------------------------------------------------------------
  buildAllZoneFences() {
    // Helper collects fence post & rail transforms across all fenced zones -> ultra-low draw calls!
    const buildFencedRect = (bounds, gates, style) => {
      const { minX, maxX, minZ, maxZ } = bounds;
      const step = style.step || 2.8;
      const postHeight = style.height || 1.65;
      const postMat = new THREE.MeshStandardMaterial({ color: style.postColor, roughness: style.roughness ?? 0.72, metalness: style.metalness ?? 0.15 });
      const railMat = new THREE.MeshStandardMaterial({ color: style.railColor, roughness: style.roughness ?? 0.78, metalness: style.metalness ?? 0.12 });

      const inGate = (side, coord) => {
        for (const g of gates) {
          if (g.side === side && Math.abs(coord - g.center) <= g.halfWidth) return true;
        }
        return false;
      };

      const posts = [];
      const rails = [];
      const addEdge = (side, fixedCoord, from, to, isXEdge) => {
        const count = Math.max(2, Math.round((to - from) / step));
        const dx = (to - from) / count;
        for (let i = 0; i <= count; i++) {
          const c = from + i * dx;
          if (!inGate(side, c)) {
            posts.push(isXEdge ? [c, fixedCoord] : [fixedCoord, c]);
          }
          if (i < count) {
            const cNext = from + (i + 1) * dx;
            const mid = (c + cNext) * 0.5;
            if (!inGate(side, c) && !inGate(side, cNext) && !inGate(side, mid)) {
              rails.push({
                x: isXEdge ? mid : fixedCoord,
                z: isXEdge ? fixedCoord : mid,
                len: dx,
                ry: isXEdge ? 0 : Math.PI / 2
              });
            }
          }
        }
      };

      addEdge('north', minZ, minX, maxX, true);
      addEdge('south', maxZ, minX, maxX, true);
      addEdge('west', minX, minZ, maxZ, false);
      addEdge('east', maxX, minZ, maxZ, false);

      const dummy = new THREE.Object3D();
      const postGeo = new THREE.BoxGeometry(0.22, postHeight, 0.22);
      postGeo.translate(0, postHeight * 0.5, 0);
      const postInst = new THREE.InstancedMesh(postGeo, postMat, posts.length);
      posts.forEach(([px, pz], idx) => {
        dummy.position.set(px, 0, pz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postInst.setMatrixAt(idx, dummy.matrix);
      });
      postInst.instanceMatrix.needsUpdate = true;
      postInst.computeBoundingSphere();
      this.worldGroup.add(postInst);

      const railGeo = new THREE.BoxGeometry(1, style.railThickness || 0.14, 0.09);
      const railHeights = style.railHeights || [postHeight * 0.38, postHeight * 0.78];
      const railInst = new THREE.InstancedMesh(railGeo, railMat, rails.length * railHeights.length);
      let rIdx = 0;
      for (const r of rails) {
        for (const rh of railHeights) {
          dummy.position.set(r.x, rh, r.z);
          dummy.rotation.set(0, r.ry, 0);
          dummy.scale.set(r.len, 1, 1);
          dummy.updateMatrix();
          railInst.setMatrixAt(rIdx++, dummy.matrix);
        }
      }
      railInst.instanceMatrix.needsUpdate = true;
      railInst.computeBoundingSphere();
      this.worldGroup.add(railInst);
    };

    // 1. Logging Industry Zone Fence (tall sturdy industrial wood/iron fence)
    buildFencedRect(
      MAP_ZONES.logging,
      [
        { side: 'east', center: -42, halfWidth: 5.5 },
        { side: 'south', center: -72, halfWidth: 5.5 },
        { side: 'north', center: -80, halfWidth: 5.5 }
      ],
      { postColor: 0x5c3a21, railColor: 0x7c4d2b, height: 1.95, railHeights: [0.55, 1.15, 1.72], railThickness: 0.16, step: 2.8 }
    );

    // 2. Harvestable Pine Forest Zone Fence (rustic timber ranch fence)
    buildFencedRect(
      MAP_ZONES.forest,
      [
        { side: 'south', center: -80, halfWidth: 6.5 }
      ],
      { postColor: 0x6b4423, railColor: 0x9a6b3e, height: 1.45, railHeights: [0.5, 1.12], step: 3.2 }
    );

    // 3. Residential & Central Park Zone Perimeter Fence (neat warm timber-and-stone fence)
    buildFencedRect(
      MAP_ZONES.residential,
      [
        { side: 'south', center: 5, halfWidth: 5.5 },
        { side: 'west', center: -52, halfWidth: 5.0 },
        { side: 'east', center: -52, halfWidth: 5.0 },
        { side: 'north', center: 5, halfWidth: 5.0 }
      ],
      { postColor: 0x854d27, railColor: 0xc2935b, height: 1.35, railHeights: [0.42, 0.96], railThickness: 0.14, step: 2.6 }
    );

    // 4. Infrastructure & Railway Zone Perimeter Fence (steel industrial security fence)
    buildFencedRect(
      MAP_ZONES.infrastructure,
      [
        { side: 'west', center: -46, halfWidth: 5.5 },
        { side: 'south', center: 74, halfWidth: 5.5 },
        { side: 'east', center: -12, halfWidth: 5.0 }
      ],
      { postColor: 0x334155, railColor: 0x64748b, height: 2.05, railHeights: [0.55, 1.2, 1.85], metalness: 0.55, roughness: 0.42, step: 2.8 }
    );

    // 5. Internal low yard fences around Residential sub-blocks (matching reference image blocks)
    const subBlocks = [
      { minX: -19, maxX: -2, minZ: -98, maxZ: -68 },
      { minX: 12, maxX: 29, minZ: -98, maxZ: -68 },
      { minX: -19, maxX: -2, minZ: -30, maxZ: -6 },
      { minX: 12, maxX: 29, minZ: -30, maxZ: -6 }
    ];
    for (const blk of subBlocks) {
      buildFencedRect(
        blk,
        [
          { side: 'south', center: (blk.minX + blk.maxX) * 0.5, halfWidth: 3.2 },
          { side: 'north', center: (blk.minX + blk.maxX) * 0.5, halfWidth: 3.2 }
        ],
        { postColor: 0x9a6b3e, railColor: 0xd6b07a, height: 0.85, railHeights: [0.35, 0.68], railThickness: 0.09, step: 2.8 }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Logging Industry Zone (West Band) — GLB Sawmills, Log Yards, Forklifts, Trucks & Waterwheel Canal
  // ---------------------------------------------------------------------------
  buildLoggingIndustryZone() {
    const yardMat = new THREE.MeshStandardMaterial({ color: 0xb99a74, roughness: 0.94 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.55 });
    const logMat = new THREE.MeshStandardMaterial({ color: 0xb96832, roughness: 0.82 });
    const barkEndMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.8 });

    // Sandy gravel industrial floor inside Logging Industry Zone
    const yard = new THREE.Mesh(new THREE.BoxGeometry(66, 0.06, 98), yardMat);
    yard.position.set(-80, 0.03, -52);
    yard.receiveShadow = !this.lowSpec;
    this.worldGroup.add(yard);

    // Concrete loading apron near Sawmill & Furniture Factory
    const apron = new THREE.Mesh(new THREE.BoxGeometry(28, 0.08, 42), concreteMat);
    apron.position.set(-68, 0.045, -36);
    apron.receiveShadow = !this.lowSpec;
    this.worldGroup.add(apron);

    // Two GLB Sawmill Warehouses (/models/sawmill.glb) matching upper & lower warehouses in reference image
    for (const [sx, sz, syaw] of [[-98, -82, 0], [-64, -84, Math.PI / 2]]) {
      const slot = new THREE.Group();
      slot.position.set(sx, 0.06, sz);
      this.worldGroup.add(slot);
      mountNormalizedGlb(slot, '/models/sawmill.glb', { targetFootprint: 15.5, yaw: syaw });
    }

    // Interactive Drivable & AI-Assignable Logging Yard Fleet (2 Timber Trucks + 3 GLB Forklifts)
    const truckSpecs = [
      { id: 'yard_truck_1', name: 'Xe Tải Gỗ #1', x: -54, z: -66, yaw: Math.PI * 0.5, color: 0xea580c, targetIdx: 1, driverCost: 450 },
      { id: 'yard_truck_2', name: 'Xe Tải Gỗ #2', x: -54, z: -24, yaw: Math.PI * 0.5, color: 0xd97706, targetIdx: 0, driverCost: 450 }
    ];
    for (const spec of truckSpecs) {
      const truckMesh = createLoggingTruckModel(spec.color, this.lowSpec);
      truckMesh.position.set(spec.x, 0.06, spec.z);
      truckMesh.rotation.y = spec.yaw;
      this.worldGroup.add(truckMesh);

      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const groundRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.05, 24), ringMat);
      groundRing.rotation.x = -Math.PI / 2;
      groundRing.position.y = 0.05;
      truckMesh.add(groundRing);

      this.yardVehicles.push({
        id: spec.id,
        kind: 'truck',
        name: spec.name,
        mesh: truckMesh,
        wheels: truckMesh.userData.wheels || [],
        cargoVisual: truckMesh.userData.cargoVisual,
        driverVisual: truckMesh.userData.driverVisual,
        groundRing,
        pos: new THREE.Vector3(spec.x, 0.06, spec.z),
        homePos: new THREE.Vector3(spec.x, 0.06, spec.z),
        yaw: spec.yaw,
        homeYaw: spec.yaw,
        speed: 17.5,
        cargoCapacity: 12,
        cargoWood: 6,
        driverHired: false,
        driverCost: spec.driverCost,
        state: 'parked',
        targetIdx: spec.targetIdx,
        wpIdx: 0,
        waitTimer: 0
      });
    }

    const forkliftSpecs = [
      { id: 'yard_forklift_1', name: 'Xe Nâng Gỗ #1', x: -60, z: -42, yaw: Math.PI * 0.5, targetIdx: 2, driverCost: 250 },
      { id: 'yard_forklift_2', name: 'Xe Nâng Gỗ #2', x: -76, z: -58, yaw: 0.4, targetIdx: 0, driverCost: 250 },
      { id: 'yard_forklift_3', name: 'Xe Nâng Gỗ #3', x: -86, z: -28, yaw: 0.0, targetIdx: 2, driverCost: 250 }
    ];
    for (const spec of forkliftSpecs) {
      const fk = new THREE.Group();
      fk.position.set(spec.x, 0.06, spec.z);
      fk.rotation.y = spec.yaw;
      this.worldGroup.add(fk);
      mountNormalizedGlb(fk, '/models/forklift_truck.glb', { targetHeight: 2.35, yaw: 0 });

      // Front pallet wood load visual on forks
      const cargoVisual = new THREE.Group();
      cargoVisual.position.set(0, 0.58, 1.45);
      const crateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.65, 0.95),
        new THREE.MeshStandardMaterial({ color: 0xc28546, roughness: 0.78 })
      );
      cargoVisual.add(crateMesh);
      fk.add(cargoVisual);

      // AI Driver indicator floating badge above forklift roof
      const driverVisual = new THREE.Group();
      driverVisual.position.set(0, 2.75, 0);
      const aiOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.85 })
      );
      driverVisual.add(aiOrb);
      driverVisual.visible = false;
      fk.add(driverVisual);

      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
      const groundRing = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.05, 20), ringMat);
      groundRing.rotation.x = -Math.PI / 2;
      groundRing.position.y = 0.05;
      fk.add(groundRing);

      this.yardVehicles.push({
        id: spec.id,
        kind: 'forklift',
        name: spec.name,
        mesh: fk,
        wheels: [],
        cargoVisual,
        driverVisual,
        groundRing,
        pos: new THREE.Vector3(spec.x, 0.06, spec.z),
        homePos: new THREE.Vector3(spec.x, 0.06, spec.z),
        yaw: spec.yaw,
        homeYaw: spec.yaw,
        speed: 13.5,
        cargoCapacity: 6,
        cargoWood: 4,
        driverHired: false,
        driverCost: spec.driverCost,
        state: 'parked',
        targetIdx: spec.targetIdx,
        wpIdx: 0,
        waitTimer: 0
      });
    }

    // Build 3 Wood Delivery Drop-off Zones in Residential, Infrastructure & Waterfront Districts
    for (const drop of DELIVERY_DROPOFFS) {
      const dropGroup = new THREE.Group();
      dropGroup.position.set(drop.x, 0.08, drop.z);

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.4, 0.12, 24),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
      );
      pad.position.y = 0.04;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 4.05, 28),
        new THREE.MeshBasicMaterial({ color: drop.color, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;

      const badge = makeWorldBadgeSprite(drop.name, `Giao gỗ x${drop.mult.toFixed(2)}`, '#0f172a', '#fde68a');
      badge.position.set(0, 4.2, 0);
      badge.scale.set(7.4, 2.1, 1);

      dropGroup.add(pad, ring, badge);
      this.worldGroup.add(dropGroup);
      this.deliveryRings.push(ring);
    }

    // Organized Stacked Timber Log Yards (InstancedMesh matching left side of reference image)
    const logPiles = [
      [-104, -64], [-104, -52], [-104, -40],
      [-92, -68], [-92, -56], [-80, -72], [-80, -60],
      [-74, -22], [-86, -12]
    ];
    const logGeo = new THREE.CylinderGeometry(0.32, 0.34, 4.4, 8);
    logGeo.rotateZ(Math.PI / 2);
    const logsPerPile = 9; // 4 bottom, 3 middle, 2 top
    const logInst = new THREE.InstancedMesh(logGeo, logMat, logPiles.length * logsPerPile);
    const dummy = new THREE.Object3D();
    let lIdx = 0;
    const offsets = [
      [-0.96, 0.35], [-0.32, 0.35], [0.32, 0.35], [0.96, 0.35],
      [-0.64, 0.9], [0, 0.9], [0.64, 0.9],
      [-0.32, 1.45], [0.32, 1.45]
    ];
    for (const [px, pz] of logPiles) {
      for (const [oz, oy] of offsets) {
        dummy.position.set(px, oy, pz + oz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        logInst.setMatrixAt(lIdx++, dummy.matrix);
      }
    }
    logInst.instanceMatrix.needsUpdate = true;
    logInst.computeBoundingSphere();
    this.worldGroup.add(logInst);

    // 2 Drying Kiln / Boiler Sheds with Chimneys (matching reference image's industrial kilns)
    for (const [kx, kz] of [[-98, -46], [-62, -64]]) {
      const kiln = new THREE.Group();
      kiln.position.set(kx, 0.06, kz);
      const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 5.4), concreteMat);
      body.position.y = 1.8;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.4, 5.8), steelMat);
      roof.position.y = 3.75;
      const furnace = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), brickMat);
      furnace.position.set(-2.2, 1.1, 2.6);
      for (const cx of [-1.4, 0.6, 2.4]) {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.2, 8), steelMat);
        stack.position.set(cx, 5.4, -1.2);
        kiln.add(stack);
      }
      kiln.add(body, roof, furnace);
      this.worldGroup.add(kiln);
    }

    // Mill Canal & Rotating Wooden Waterwheel along South Edge of Logging Zone (bottom-left of reference image)
    const canalWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.22,
      roughness: 0.14,
      metalness: 0.25
    });
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.88 });
    const canal = new THREE.Mesh(new THREE.BoxGeometry(58, 0.14, 4.8), canalWaterMat);
    canal.position.set(-86, 0.03, 3.2);
    const bankN = new THREE.Mesh(new THREE.BoxGeometry(58, 0.32, 0.6), bankMat);
    bankN.position.set(-86, 0.16, 0.65);
    const bankS = new THREE.Mesh(new THREE.BoxGeometry(58, 0.32, 0.6), bankMat);
    bankS.position.set(-86, 0.16, 5.75);
    this.worldGroup.add(canal, bankN, bankS);

    // Rotating Timber Waterwheel next to Canal
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-86, 1.6, 1.2);
    const wheelWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.82 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.16, 8, 18), wheelWoodMat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 8), steelMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(rim, hub);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.5, 0.14), wheelWoodMat);
      spoke.rotation.z = ang;
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.9), barkEndMat);
      paddle.position.set(Math.cos(ang) * 1.78, Math.sin(ang) * 1.78, 0);
      paddle.rotation.z = ang;
      wheelGroup.add(spoke, paddle);
    }
    this.waterwheel = wheelGroup;
    this.worldGroup.add(wheelGroup);
  }

  // ---------------------------------------------------------------------------
  // 5. Residential & Central Park Zone (Center Band) — Real GLB Houses + Fenced Sub-blocks + Park Fountain
  // ---------------------------------------------------------------------------
  buildResidentialZone() {
    const cobbleMat = new THREE.MeshStandardMaterial({ map: getGraniteCobbleTexture(8, 8), roughness: 0.78, metalness: 0.05 });
    const travMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(6, 6), roughness: 0.74 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.08 });
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.25
    });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.85 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.84, flatShading: true });

    // Paved internal neighborhood grid streets (North-South spine x=5 & cross lanes z=-64, z=-34)
    const walkPaths = [
      { x: 5, z: -52, w: 6.4, d: 96 },      // Central North-South pedestrian boulevard
      { x: 5, z: -64, w: 50, d: 5.2 },      // North cross street
      { x: 5, z: -34, w: 50, d: 5.2 },      // South cross street
      { x: 5, z: -49, w: 22, d: 24 }        // Central Park Plaza courtyard
    ];
    for (const p of walkPaths) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.08, p.d), cobbleMat);
      m.position.set(p.x, 0.04, p.z);
      m.receiveShadow = !this.lowSpec;
      this.worldGroup.add(m);
    }

    // Central Park Fountain at (5, 0.08, -49)
    const fountain = new THREE.Group();
    fountain.position.set(5, 0.08, -49);
    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.48, 8), travMat);
    outerBasin.position.y = 0.24;
    const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.16, 16), poolWaterMat);
    waterPool.position.y = 0.38;
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.45, 8), marbleMat);
    pedestal.position.y = 0.85;
    const midBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.42, 0.34, 12), marbleMat);
    midBowl.position.y = 1.38;
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), brassMat);
    finial.position.y = 2.05;
    fountain.add(outerBasin, waterPool, pedestal, midBowl, finial);

    const jetMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.72 });
    const jetGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.75, 6);
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const jet = new THREE.Mesh(jetGeo, jetMat);
      jet.position.set(Math.cos(ang) * 0.68, 1.05, Math.sin(ang) * 0.68);
      jet.rotation.z = Math.cos(ang) * 0.26;
      jet.rotation.x = -Math.sin(ang) * 0.26;
      this.fountainJetsGroup.add(jet);
      this.fountainJets.push(jet);
    }
    this.fountainRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.15, 20),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    this.fountainRipple.rotation.x = -Math.PI / 2;
    this.fountainRipple.position.y = 0.48;
    this.fountainJetsGroup.add(this.fountainRipple);
    fountain.add(this.fountainJetsGroup);
    this.worldGroup.add(fountain);

    // Park Benches & Ornamental Clock Tower around Central Park Square
    for (const [bx, bz, ry] of [[5, -43.5, Math.PI], [5, -54.5, 0], [-0.5, -49, Math.PI / 2], [10.5, -49, -Math.PI / 2]]) {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, 0.08, bz);
      bGroup.rotation.y = ry;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.62), timberMat);
      seat.position.y = 0.42;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.09), timberMat);
      back.position.set(0, 0.68, -0.25);
      for (const lx of [-0.82, 0.82]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.5), ironMat);
        leg.position.set(lx, 0.21, 0);
        bGroup.add(leg);
      }
      bGroup.add(seat, back);
      this.worldGroup.add(bGroup);
    }

    // Neighborhood Clock Tower at South Park Corner
    const clockTower = new THREE.Group();
    clockTower.position.set(13.2, 0.08, -38.5);
    const cBase = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 1.75), travMat);
    cBase.position.y = 0.575;
    const cShaft = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.1, 1.3), travMat);
    cShaft.position.y = 3.2;
    const cHead = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.48, 1.48), ironMat);
    cHead.position.y = 6.15;
    const clockTex = getClockFaceTexture();
    const clockFaceMat = new THREE.MeshStandardMaterial({
      map: clockTex,
      emissiveMap: clockTex,
      emissive: new THREE.Color(0xfffbeb),
      emissiveIntensity: 0.55,
      roughness: 0.35
    });
    const dialGeo = new THREE.PlaneGeometry(1.18, 1.18);
    [[0, 6.15, 0.76, 0], [0, 6.15, -0.76, Math.PI], [-0.76, 6.15, 0, -Math.PI / 2], [0.76, 6.15, 0, Math.PI / 2]].forEach(([dx, dy, dz, ry]) => {
      const dial = new THREE.Mesh(dialGeo, clockFaceMat);
      dial.position.set(dx, dy, dz);
      dial.rotation.y = ry;
      clockTower.add(dial);
    });
    const cRoof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.65, 4), brassMat);
    cRoof.rotation.y = Math.PI / 4;
    cRoof.position.y = 7.72;
    clockTower.add(cBase, cShaft, cHead, cRoof);
    this.worldGroup.add(clockTower);

    // Park decorative trees & hedges
    const hedgeSpots = [[-4.5, -59], [14.5, -59], [-4.5, -39], [14.5, -39]];
    for (const [hx, hz] of hedgeSpots) {
      const border = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.32, 0.9), travMat);
      border.position.set(hx, 0.2, hz);
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.52, 0.65), hedgeMat);
      hedge.position.set(hx, 0.55, hz);
      this.worldGroup.add(border, hedge);
    }

    // 18 Real Optimized GLB Houses across the 6 Residential Blocks (matching reference image density & variety)
    const lotPadMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 });
    const houseLots = [
      // North-West Residential Block
      { x: -14.5, z: -90, yaw: 0, url: '/models/bietthu_opt.glb', size: 8.6 },
      { x: -6.0, z: -90, yaw: 0, url: '/models/alpine_serenity_opt.glb', size: 7.4 },
      { x: -14.5, z: -76, yaw: Math.PI, url: '/models/nhatuyet_opt.glb', size: 7.6 },
      { x: -6.0, z: -76, yaw: Math.PI, url: '/models/nhacap4_opt.glb', size: 7.2 },

      // North-East Residential Block
      { x: 16.5, z: -90, yaw: 0, url: '/models/alpine_serenity_opt.glb', size: 7.6 },
      { x: 24.8, z: -90, yaw: 0, url: '/models/bietthu_opt.glb', size: 8.6 },
      { x: 16.5, z: -76, yaw: Math.PI, url: '/models/nhasan_opt.glb', size: 7.4 },
      { x: 24.8, z: -76, yaw: Math.PI, url: '/models/nhacap4_opt.glb', size: 7.2 },

      // Mid-West & Mid-East Flanking Central Park
      { x: -14.5, z: -55, yaw: Math.PI / 2, url: '/models/nhacap4_opt.glb', size: 7.2 },
      { x: -14.5, z: -43, yaw: Math.PI / 2, url: '/models/nhasan_opt.glb', size: 7.5 },
      { x: 24.5, z: -55, yaw: -Math.PI / 2, url: '/models/nhatuyet_opt.glb', size: 7.6 },
      { x: 24.5, z: -43, yaw: -Math.PI / 2, url: '/models/alpine_serenity_opt.glb', size: 7.5 },

      // South-West Residential Block (immediately visible on spawn!)
      { x: -14.5, z: -24, yaw: 0, url: '/models/nhacap4_opt.glb', size: 7.4 },
      { x: -6.0, z: -24, yaw: 0, url: '/models/nhasan_opt.glb', size: 7.4 },
      { x: -14.5, z: -12, yaw: Math.PI, url: '/models/bietthu_opt.glb', size: 8.4 },
      { x: -6.0, z: -12, yaw: Math.PI, url: '/models/alpine_serenity_opt.glb', size: 7.4 },

      // South-East Residential Block (2-story villas facing Waterfront Blvd!)
      { x: 16.5, z: -24, yaw: 0, url: '/models/bietthu_opt.glb', size: 8.6 },
      { x: 24.8, z: -24, yaw: 0, url: '/models/nhatuyet_opt.glb', size: 7.8 },
      { x: 16.5, z: -12, yaw: Math.PI, url: '/models/nhacap4_opt.glb', size: 7.2 },
      { x: 24.8, z: -12, yaw: Math.PI, url: '/models/bietthu_opt.glb', size: 8.6 }
    ];

    const lotGeo = new THREE.BoxGeometry(7.2, 0.06, 7.2);
    for (const lot of houseLots) {
      const group = new THREE.Group();
      group.position.set(lot.x, 0, lot.z);
      const pad = new THREE.Mesh(lotGeo, lotPadMat);
      pad.position.y = 0.03;
      pad.receiveShadow = !this.lowSpec;
      group.add(pad);
      this.worldGroup.add(group);
      mountNormalizedGlb(group, lot.url, { targetFootprint: lot.size, yaw: lot.yaw, yOffset: 0.05 });
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Infrastructure & Railway Zone (East Band) — Power Substation, Water Treatment, Silos & Rail Station
  // ---------------------------------------------------------------------------
  buildInfrastructureZone() {
    const padMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.84 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.62 });
    const tankWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.36, metalness: 0.35 });
    const waterBasinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.32,
      roughness: 0.14,
      metalness: 0.25
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.45 });

    // 1. North Sub-Compound: Power Substation & Transformer Yard (x=76, z=-84)
    const subPad = new THREE.Mesh(new THREE.BoxGeometry(28, 0.08, 22), padMat);
    subPad.position.set(76, 0.04, -84);
    subPad.receiveShadow = !this.lowSpec;
    this.worldGroup.add(subPad);

    const subGroup = new THREE.Group();
    subGroup.position.set(76, 0.08, -84);
    // Control building
    const ctrlBldg = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 5.4), concreteMat);
    ctrlBldg.position.set(-7.5, 1.8, -5.5);
    const ctrlRoof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.3, 5.8), steelMat);
    ctrlRoof.position.set(-7.5, 3.7, -5.5);
    subGroup.add(ctrlBldg, ctrlRoof);
    // 3 High-voltage Transformers + Steel Gantry Pylons
    for (const [tx, tz] of [[1.5, -5], [8.0, -5], [4.5, 4.2]]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 2.4), steelMat);
      box.position.set(tx, 1.25, tz);
      const busbar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 0.2), accentMat);
      busbar.position.set(tx, 3.5, tz);
      for (const ix of [-0.9, 0, 0.9]) {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.1, 6), tankWhiteMat);
        ins.position.set(tx + ix, 2.95, tz);
        subGroup.add(ins);
      }
      subGroup.add(box, busbar);
    }
    // High-voltage transmission tower frame
    for (const px of [-9, -3, 3, 9]) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 6.2, 6), steelMat);
      pylon.position.set(px, 3.1, 6.8);
      subGroup.add(pylon);
    }
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(20, 0.24, 0.32), steelMat);
    crossArm.position.set(0, 5.6, 6.8);
    subGroup.add(crossArm);
    this.worldGroup.add(subGroup);

    // 2. Middle Sub-Compound: Water Treatment Basins & Pump House (x=76, z=-58)
    const wtPad = new THREE.Mesh(new THREE.BoxGeometry(28, 0.08, 22), padMat);
    wtPad.position.set(76, 0.04, -56);
    wtPad.receiveShadow = !this.lowSpec;
    this.worldGroup.add(wtPad);

    const wtGroup = new THREE.Group();
    wtGroup.position.set(76, 0.08, -60);
    for (const bx of [-6.5, 1.5]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.1, 8.6), concreteMat);
      wall.position.set(bx, 0.55, 0);
      const water = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.16, 7.8), waterBasinMat);
      water.position.set(bx, 1.05, 0);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.18, 0.85), steelMat);
      bridge.position.set(bx, 1.25, 0);
      wtGroup.add(wall, water, bridge);
    }
    const pumpHouse = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 6.4), tankWhiteMat);
    pumpHouse.position.set(9.2, 1.6, 0);
    const pumpRoof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.35, 6.8), steelMat);
    pumpRoof.position.set(9.2, 3.35, 0);
    wtGroup.add(pumpHouse, pumpRoof);
    this.worldGroup.add(wtGroup);

    // 3. South Sub-Compound: Storage Silos, Circular Clarifier Tank & Helipad Apron (x=78, z=-18)
    const siloPad = new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 26), padMat);
    siloPad.position.set(78, 0.04, -18);
    siloPad.receiveShadow = !this.lowSpec;
    this.worldGroup.add(siloPad);

    // 4 Cylindrical Industrial Silos + 1 Large Circular Blue Water Clarifier Tank (bottom-right of Infrastructure Zone)
    for (const [sx, sz] of [[84, -24], [88.5, -24], [84, -19.5], [88.5, -19.5]]) {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 6.4, 12), tankWhiteMat);
      silo.position.set(sx, 3.28, sz);
      const dome = new THREE.Mesh(new THREE.ConeGeometry(1.72, 1.1, 12), steelMat);
      dome.position.set(sx, 7.0, sz);
      this.worldGroup.add(silo, dome);
    }
    const clarifierRim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 1.1, 18), concreteMat);
    clarifierRim.position.set(86, 0.62, -10.5);
    const clarifierWater = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.16, 18), waterBasinMat);
    clarifierWater.position.set(86, 1.12, -10.5);
    this.worldGroup.add(clarifierRim, clarifierWater);
  }

  // ---------------------------------------------------------------------------
  // 7. Clean Fishing Boat Waterfront ("Chỉ làm cái bờ đi tàu cá neo đậu thôi")
  // ---------------------------------------------------------------------------
  buildFishingWaterfront() {
    const stoneWallMat = new THREE.MeshStandardMaterial({ map: getTravertineTexture(18, 1), roughness: 0.8 });
    const boardwalkMat = new THREE.MeshStandardMaterial({ map: getBoardwalkPlankTexture(22, 1), roughness: 0.76 });
    const deckMat = new THREE.MeshStandardMaterial({ map: getBoardwalkPlankTexture(4, 3), roughness: 0.8 });
    const postWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.86 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd6b37c, roughness: 0.88 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xc28546, roughness: 0.74 });
    const iceBoxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42 });

    // Clean Stone Seawall Embankment & Wooden Promenade along the South Coastline
    const seawall = new THREE.Mesh(new THREE.BoxGeometry(236, 0.48, 1.1), stoneWallMat);
    seawall.position.set(4, 0.16, 20.6);
    seawall.receiveShadow = !this.lowSpec;
    const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(236, 0.16, 3.0), boardwalkMat);
    boardwalk.position.set(4, 0.08, 22.4);
    boardwalk.receiveShadow = !this.lowSpec;
    this.worldGroup.add(seawall, boardwalk);

    // Timber posts & rope safety railing along coastline (leaving gaps at the 3 fishing piers)
    const pierXs = [-58, 5, 52];
    const fencePostsX = [];
    for (let x = -110; x <= 116; x += 3.2) {
      if (pierXs.some((px) => Math.abs(x - px) < 5.8)) continue;
      fencePostsX.push(x);
    }
    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.92, 6);
    postGeo.translate(0, 0.46, 0);
    const postsInst = new THREE.InstancedMesh(postGeo, postWoodMat, fencePostsX.length);
    const dummy = new THREE.Object3D();
    fencePostsX.forEach((fx, i) => {
      dummy.position.set(fx, 0.08, 23.75);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postsInst.setMatrixAt(i, dummy.matrix);
    });
    postsInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(postsInst);

    const railSegments = [];
    for (let i = 0; i < fencePostsX.length - 1; i++) {
      if (fencePostsX[i + 1] - fencePostsX[i] < 3.6) {
        railSegments.push((fencePostsX[i] + fencePostsX[i + 1]) * 0.5);
      }
    }
    const ropeGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.2, 5);
    ropeGeo.rotateZ(Math.PI / 2);
    const ropesInst = new THREE.InstancedMesh(ropeGeo, ropeMat, railSegments.length);
    railSegments.forEach((rx, i) => {
      dummy.position.set(rx, 0.74, 23.75);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ropesInst.setMatrixAt(i, dummy.matrix);
    });
    ropesInst.instanceMatrix.needsUpdate = true;
    this.worldGroup.add(ropesInst);

    // West & East Wooden Fishing Boat Piers (Center pier is built by createHarborStructure)
    const pileGeo = new THREE.CylinderGeometry(0.22, 0.25, 3.2, 7);
    for (const px of [-58, 52]) {
      const pierGroup = new THREE.Group();
      pierGroup.position.set(px, 0, 24);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.42, 12.2), deckMat);
      deck.position.set(0, 0.36, 6.0);
      deck.receiveShadow = !this.lowSpec;
      pierGroup.add(deck);
      for (const ox of [-3.1, 3.1]) {
        for (const oz of [1.2, 6.0, 10.8]) {
          const pile = new THREE.Mesh(pileGeo, postWoodMat);
          pile.position.set(ox, -1.0, oz);
          pierGroup.add(pile);
        }
      }
      // Small wooden fish crates & blue ice boxes on pier edge
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.85), crateMat);
      crate.position.set(-2.3, 0.92, 2.5);
      const ice = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.58, 0.65), iceBoxMat);
      ice.position.set(-2.2, 0.85, 3.8);
      pierGroup.add(crate, ice);
      this.worldGroup.add(pierGroup);
    }

    // Moored GLB Fishing Boats gently bobbing alongside the 3 wooden fishing piers
    const mooredSpecs = [
      { id: 'boat_west_1', pierId: 'west', x: -64.5, z: 31.5, yaw: Math.PI * 0.08, url: '/models/boat.glb', footprint: 7.4, phase: 0.4 },
      { id: 'boat_west_2', pierId: 'west', x: -51.5, z: 32.5, yaw: -Math.PI * 0.1, url: '/models/azure_sailor_tug_hq.glb', footprint: 8.6, phase: 1.8 },
      { id: 'boat_center_1', pierId: 'center', x: -3.2, z: 32.5, yaw: Math.PI * 0.05, url: '/models/boat.glb', footprint: 7.2, phase: 3.1 },
      { id: 'boat_center_2', pierId: 'center', x: 13.8, z: 32.2, yaw: -Math.PI * 0.08, url: '/models/boat.glb', footprint: 7.4, phase: 4.5 },
      { id: 'boat_east_1', pierId: 'east', x: 45.2, z: 32.0, yaw: Math.PI * 0.1, url: '/models/azure_sailor_tug_hq.glb', footprint: 8.4, phase: 5.4 }
    ];

    for (const b of mooredSpecs) {
      const boatGroup = new THREE.Group();
      boatGroup.position.set(b.x, 0.05, b.z);
      boatGroup.rotation.y = b.yaw;
      this.worldGroup.add(boatGroup);
      mountNormalizedGlb(boatGroup, b.url, { targetFootprint: b.footprint, yOffset: -0.22 });
      this.mooredFishingBoats.push({
        id: b.id,
        pierId: b.pierId,
        x: b.x,
        z: b.z,
        url: b.url,
        group: boatGroup,
        phase: b.phase
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Living World Effects (Seagulls, Flags, Kiln Smoke, Drifting Forest Leaves)
  // ---------------------------------------------------------------------------
  buildLivingWorldEffects() {
    this.worldGroup.add(this.ambientLifeGroup);

    // 1. Coastal Soaring Seagulls
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
        cx: -35 + (i % 3) * 40,
        cz: 32 + (i % 2) * 10,
        rx: 26 + (i % 4) * 6,
        rz: 10 + (i % 3) * 3,
        alt: 10.0 + (i % 4) * 1.5,
        speed: 0.22 + (i % 3) * 0.05,
        phase: i * 0.95
      });
    }

    // 2. Waving Flags at Central Park & Fishing Pier
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.28 });
    const flagColors = [0xf59e0b, 0x0ea5e9, 0x10b981];
    const flagCoords = [
      [11.5, 0.08, -42, 4.4],
      [-0.5, 0.08, 21.8, 3.8],
      [10.5, 0.08, 21.8, 3.8]
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

    // 3. Logging Zone Kiln Chimney Smoke Puffs
    const smokeGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.42 });
    const smokeCount = 14;
    this.smokePuffs = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeCount);
    for (let i = 0; i < smokeCount; i++) {
      const atKiln2 = i >= 7;
      this.smokeData.push({
        baseX: atKiln2 ? -61.4 : -97.4,
        baseY: 7.4,
        baseZ: atKiln2 ? -65.2 : -47.2,
        phase: (i % 7) / 7,
        speed: 0.22 + (i % 3) * 0.03
      });
    }
    this.ambientLifeGroup.add(this.smokePuffs);

    // 4. Drifting Forest Leaves over Timber Forest
    const leafGeo = new THREE.BoxGeometry(0.24, 0.04, 0.16);
    const leafMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const leafCount = 24;
    this.forestLeaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const leafColor = new THREE.Color();
    for (let i = 0; i < leafCount; i++) {
      this.leafData.push({
        x: -108 + (i % 6) * 10 + Math.random() * 2,
        z: -136 + Math.floor(i / 6) * 6 + Math.random() * 2,
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

  // ---------------------------------------------------------------------------
  // 9. Perimeter Nature Outside the 3-Zone City Envelope (Zero Overlap!)
  // ---------------------------------------------------------------------------
  buildPerimeterNature() {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // Scenic GLB Pine Groves framing the South-West canal bank & green buffer belts
    const glbPineSpots = [
      [-104, 15, 11], [-88, 15.5, 10], [-72, 16, 9],
      [-126, -24, 12], [-126, -68, 13], [126, -68, 12], [126, -30, 11]
    ];
    for (const [px, pz, size] of glbPineSpots) {
      const slot = new THREE.Group();
      slot.position.set(px, 0, pz);
      this.worldGroup.add(slot);
      mountNormalizedGlb(slot, '/models/pine_grove_opt.glb', { targetFootprint: size, yaw: (px * 0.13) % (Math.PI * 2) });
    }

    // Instanced outer perimeter pines strictly outside [-122..136, -146..20]
    const count = this.lowSpec ? 40 : 84;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.35, 2.2, 6);
    trunkGeo.translate(0, 1.1, 0);
    const crownGeo = new THREE.ConeGeometry(1.55, 3.6, 6);
    crownGeo.translate(0, 3.4, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9, flatShading: true });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.82, flatShading: true });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);

    const northCount = Math.floor(count * 0.5);
    const westCount = Math.floor((count - northCount) / 2);

    for (let i = 0; i < count; i++) {
      let tx = 0;
      let tz = 0;
      if (i < northCount) {
        tx = -135 + (i / northCount) * 280 + (Math.random() - 0.5) * 4;
        tz = -148 - Math.random() * 14;
      } else if (i < northCount + westCount) {
        tx = -124 - Math.random() * 18;
        tz = -138 + ((i - northCount) / westCount) * 150;
      } else {
        tx = 142 + Math.random() * 16;
        tz = -138 + ((i - northCount - westCount) / Math.max(1, count - northCount - westCount)) * 150;
      }
      const scale = 0.88 + Math.random() * 0.34;
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

    // Distant scenic bay islands
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x2f6845, roughness: 0.86, flatShading: true });
    [[-95, 105, 16], [108, 115, 18]].forEach(([ix, iz, r]) => {
      const island = new THREE.Mesh(new THREE.ConeGeometry(r, 7, 7), islandMat);
      island.position.set(ix, 2.2, iz);
      this.worldGroup.add(island);
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Core Interactive Structures Mounted Into Their Respective Zones
  // ---------------------------------------------------------------------------
  buildSawmillAndHarbor() {
    // Interactive Main Sawmill & Conveyor Press inside Logging Industry Zone
    this.sawmill = createSawmillModel();
    this.sawmill.position.set(-76, 0.06, -42);
    this.worldGroup.add(this.sawmill);

    // Clean Wooden Fishing Boat Center Pier (full commercial port deferred!)
    this.harbor = createHarborStructure();
    this.harbor.position.set(5, 0, 24);
    this.worldGroup.add(this.harbor);

    // Defer heavy cargo freighter & gantry crane (kept hidden cleanly until port is built later)
    this.cargoFreighter = createCargoFreighterModel(this.lowSpec);
    this.cargoFreighter.position.set(-40, 0.05, 68);
    this.cargoFreighter.visible = false;
    this.worldGroup.add(this.cargoFreighter);

    this.gantryCrane = createGantryCraneModel(this.lowSpec);
    this.gantryCrane.position.set(5, 0.72, 29.5);
    this.gantryCrane.visible = false;
    this.worldGroup.add(this.gantryCrane);

    this.harborBeaconLight = new THREE.PointLight(0xfef08a, 1.4, 24, 1.6);
    this.harborBeaconLight.position.set(5, 5.2, 32);
    this.harborBeaconLight.visible = !this.lowSpec;
    this.worldGroup.add(this.harborBeaconLight);

    // VIP Personal Boat / Yacht docked at East Fishing Pier Berth
    this.vipYacht = createVipYachtModel(this.lowSpec);
    this.vipYacht.position.set(58.5, 0.05, 32.0);
    this.vipYacht.rotation.y = Math.PI * 0.08;
    this.worldGroup.add(this.vipYacht);
    this.syncYachtTier(gameState.yachtTier || 0);

    // Airport Runway east of the Infrastructure Railway (clear of all fenced zones)
    this.airport = createAirportRunwayModel(this.lowSpec);
    this.airport.position.set(132, 0, -10);
    this.worldGroup.add(this.airport);
    this.syncAirportTier(gameState.airportTier || 0);

    // Offshore Island Outpost & Resort
    this.islandOutpost = createIslandOutpostModel(this.lowSpec);
    this.islandOutpost.position.set(52, -0.35, 92);
    this.worldGroup.add(this.islandOutpost);
    this.syncIslandTier(gameState.islandStationTier || 0);
    this.syncResortTier(gameState.islandResortTier || 0);

    // Corporate HQ inside Infrastructure Zone
    this.corporateHq = createCorporateHqModel(this.lowSpec);
    this.corporateHq.position.copy(ZONES.hqPlaza);
    this.corporateHq.rotation.y = -Math.PI * 0.5;
    this.worldGroup.add(this.corporateHq);
    this.syncHqTier(gameState.hqTier || 0);

    // Luxury Furniture Factory inside Logging Industry Zone
    this.furnitureFactory = createFurnitureFactoryModel(this.lowSpec);
    this.furnitureFactory.position.copy(ZONES.furnitureMill);
    this.worldGroup.add(this.furnitureFactory);
    this.syncFurnitureMillTier(gameState.furnitureMillTier || 0);

    // Coastal Lighthouse at Far West Coast Point
    this.lighthouse = createLighthouseModel(this.lowSpec);
    this.lighthouse.position.copy(ZONES.lighthouse);
    this.worldGroup.add(this.lighthouse);
    this.syncLighthouseTier(gameState.lighthouseTier || 0);

    // Deep Container Port deferred (kept hidden until commercial port phase)
    this.deepContainerPort = createDeepContainerPortModel(this.lowSpec);
    this.deepContainerPort.position.set(-24, 0, 31);
    this.deepContainerPort.visible = false;
    this.worldGroup.add(this.deepContainerPort);

    // Railway Line & Train Station along East Edge of Infrastructure Zone (x = 106)
    this.railwaySystem = createRailwayAndTrainModel(this.lowSpec);
    this.worldGroup.add(this.railwaySystem);
    this.syncRailwayTier(gameState.railwayTier || 0);

    // Illuminated Helipad inside Infrastructure Zone South Compound (74, 0, -12)
    this.helipad = createHelipadModel(this.lowSpec);
    this.helipad.position.copy(ZONES.helipad);
    this.worldGroup.add(this.helipad);
    this.syncHeliTier(gameState.heliTier || 0);

    // Civic Promenade positioned around Residential Zone Southern Entry
    this.civicPromenade = createCivicPromenadeModel(this.lowSpec);
    this.civicPromenade.position.set(3, 0, -10);
    this.worldGroup.add(this.civicPromenade);
    this.syncCivicTier(gameState.civicTier || 0);

    // Clouds & Storm Effects
    this.weatherGroup = createCloudsAndStormGroup(this.lowSpec);
    this.worldGroup.add(this.weatherGroup);

    this.stormBeacon = createStormBeaconModel();
    this.worldGroup.add(this.stormBeacon);

    // Floating Sea Treasures
    const treasureSpots = [[-46, 56], [14, 72], [68, 60], [-62, 92]];
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

  syncDeepPortTier() {
    // Commercial deep-water container port is deferred (fishing boat piers only for now)
    if (this.deepContainerPort) this.deepContainerPort.visible = false;
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
    if (u?.ringMat) u.ringMat.emissiveIntensity = tier > 0 ? 0.9 + tier * 0.25 : 0.35;
    if (u?.hMarkMat) u.hMarkMat.emissiveIntensity = tier > 0 ? 0.75 + tier * 0.2 : 0.25;
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
    if (this.streetLampMat) this.streetLampMat.emissiveIntensity = 0.55 + nightFactor * 1.95;
    if (this.civicPromenade?.userData?.lampGlowMat) {
      this.civicPromenade.userData.lampGlowMat.emissiveIntensity = 0.65 + nightFactor * 2.1;
    }
    if (this.harborBeaconLight && !this.lowSpec) this.harborBeaconLight.intensity = 1.2 + nightFactor * 2.0;
    for (const pl of this.landPointLights) {
      if (!this.lowSpec) pl.intensity = 0.75 + nightFactor * 1.85;
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
    for (const pl of this.landPointLights) pl.visible = !this.lowSpec;
    if (this.landDetailGroup) this.landDetailGroup.visible = !this.lowSpec;
    if (this.fountainJetsGroup) this.fountainJetsGroup.visible = !this.lowSpec;
    if (this.ambientLifeGroup) this.ambientLifeGroup.visible = !this.lowSpec;
    if (this.waterfallFoamGroup) this.waterfallFoamGroup.visible = !this.lowSpec;
    if (this.vipYacht?.userData?.deckLight) this.vipYacht.userData.deckLight.visible = !this.lowSpec;
    if (this.corporateHq?.userData?.facadeLight) {
      this.corporateHq.userData.facadeLight.visible = !this.lowSpec && (gameState.hqTier || 0) >= 1;
    }
    if (this.furnitureFactory?.userData?.accentLight) {
      this.furnitureFactory.userData.accentLight.visible = !this.lowSpec && (gameState.furnitureMillTier || 0) >= 2;
    }
    if (this.lighthouse?.userData?.beamLight) {
      this.lighthouse.userData.beamLight.visible = !this.lowSpec && (gameState.lighthouseTier || 0) >= 1;
    }
    if (this.weatherGroup?.userData?.clouds) this.weatherGroup.userData.clouds.visible = !this.lowSpec;
    if (this.weatherGroup?.userData?.rain) {
      this.weatherGroup.userData.rain.visible = !this.lowSpec && stormState.active;
    }
  }

  syncEvolution(sawTier, harborTier) {
    syncBuildingEvolution(this.sawmill, this.harbor, sawTier, harborTier);
  }

  // ---------------------------------------------------------------------------
  // 11. Harvestable Pine Forest inside Fenced Forest Zone + Starter Grove
  // ---------------------------------------------------------------------------
  buildHarvestableForest() {
    const forestPadMat = new THREE.MeshStandardMaterial({
      map: getForestFloorTexture(5, 4),
      roughness: 0.94,
      metalness: 0.0
    });
    const forestPad = new THREE.Mesh(new THREE.BoxGeometry(64, 0.05, 26), forestPadMat);
    forestPad.position.set(-80, 0.025, -125);
    forestPad.receiveShadow = !this.lowSpec;
    this.worldGroup.add(forestPad);

    const spots = [];
    // Main Fenced Timber Forest North of Logging Zone (-110..-50, -136..-114)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 10; col++) {
        spots.push({
          x: -108 + col * 6.0 + (Math.random() - 0.5) * 1.4,
          z: -135 + row * 6.2 + (Math.random() - 0.5) * 1.2
        });
      }
    }

    // Starter Grove on West Buffer Belt right outside Logging Gate (quick chopping near sawmill!)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        spots.push({
          x: -108 + col * 5.2 + (Math.random() - 0.5) * 0.8,
          z: -28 + row * 5.5 + (Math.random() - 0.5) * 0.8
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
      { id: 'axeTier', pos: new THREE.Vector3(-88, 0.06, -34), color: '#f59e0b', label: 'Nâng cấp Rìu' },
      { id: 'sawSpeedTier', pos: new THREE.Vector3(-76, 0.06, -52), color: '#ef4444', label: 'Tốc độ Máy Cưa' },
      { id: 'lumberjacks', pos: new THREE.Vector3(-80, 0.06, -104), color: '#10b981', label: 'Thuê Thợ Rừng' },
      { id: 'fishingBoats', pos: new THREE.Vector3(-58, 0.4, 24.5), color: '#0ea5e9', label: 'Mua Tàu Đánh Cá' }
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
    this.questRing.position.set(-82, 0.08, -42);
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
    const mesh = pool.pop();
    if (!mesh) {
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

    // Rotate Logging Zone Canal Waterwheel
    if (this.waterwheel) {
      this.waterwheel.rotation.z -= dt * 0.85;
    }

    // Gently bob moored fishing boats along the coastal wooden piers
    for (let i = 0; i < this.mooredFishingBoats.length; i++) {
      const b = this.mooredFishingBoats[i];
      b.group.position.y = 0.04 + Math.sin(elapsed * 1.4 + b.phase) * 0.09;
      b.group.rotation.z = Math.sin(elapsed * 1.1 + b.phase) * 0.025;
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

      if (su.conveyorSlats) {
        const slats = su.conveyorSlats;
        const count = slats.length;
        for (let i = 0; i < count; i++) {
          const t = (su.conveyorPhase + i / count) % 1;
          const sx = -4.6 + t * 9.2;
          const slat = slats[i];
          slat.position.set(sx, beltY + 0.02, beltZ);
          slat.visible = !su.glbSawLoaded || sx < -2.15 || sx > -0.25;
        }
      }

      if (su.conveyorItems) {
        const items = su.conveyorItems;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const t = (su.conveyorPhase + item.offset) % 1;
          const x = -4.75 + t * 9.5;
          const isPlank = x > pressX;

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

          if (!isPlank) {
            item.logMesh.rotation.x = Math.sin(elapsed * 5 + i) * 0.08;
          }
        }
      }

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

    if (this.vipYacht && this.vipYacht.visible) {
      this.vipYacht.position.y = 0.05 + Math.sin(elapsed * 1.55) * 0.11;
      this.vipYacht.rotation.z = Math.sin(elapsed * 1.1) * 0.025;
    }

    if (this.airport?.visible && this.airport.userData?.radar?.visible !== false) {
      this.airport.userData.radar.rotation.y += dt * 1.4;
    }

    if (!this.lowSpec) {
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
          j.position.y = 1.05 + (pulse - 0.85) * 0.35;
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
    }

    // Animated Freight Train running along East Infrastructure Railway (x = 106, z = -90..+2)
    if (this.railwaySystem?.userData?.trainGroup?.visible) {
      const ru = this.railwaySystem.userData;
      const boostMult = (gameState.trainBoostTimer || 0) > 0 ? 1.85 : 1.0;
      const tierSpeed = 1 + ((gameState.railwayTier || 1) - 1) * 0.25;
      const phase = elapsed * 0.16 * tierSpeed * boostMult;
      const rawSin = Math.sin(phase);
      const rawCos = Math.cos(phase);
      const centerZ = ru.trackCenterZ ?? -46.0;
      const span = ru.trackHalfSpan ?? 44.0;
      const trackX = ru.trackX ?? 106.0;
      const trainZ = centerZ + rawSin * span;
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
            { x: trackX, y: 2.2, z: trainZ + 1.2 },
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

    if (this.weatherGroup) {
      const { clouds, rain, cloudBases, rainOffsets, cloudMat } = this.weatherGroup.userData;
      if (!this.lowSpec) {
        if (clouds) {
          clouds.visible = true;
          const speedBoost = stormState.active ? 2.4 : 1.0;
          if (cloudMat) cloudMat.color.setHex(stormState.active ? 0x64748b : 0xf8fafc);
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
      this.questRing.position.set(target.x, 0.08, target.z);
      const pulseScale = 1 + Math.sin(elapsed * 4) * 0.1;
      this.questRing.scale.setScalar(pulseScale);
    }

    if (this.deliveryRings && this.deliveryRings.length) {
      const ringPulse = 1 + Math.sin(elapsed * 3.2) * 0.05;
      for (const ring of this.deliveryRings) {
        ring.scale.setScalar(ringPulse);
      }
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
