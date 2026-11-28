/**
 * TimberPort 3D — Stylized Low-Poly PBR Composite Model Builders
 * Shared GPU Geometries & Materials, Object-Pooled Backpacks, and Explicit Disposal
 * Zero per-frame geometry/material/texture allocations for <8GB RAM & Intel HD GPUs
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getBarkTexture, getTimberTexture, getTravertineTexture } from './textures.js';
import {
  IDLE_REST_PHASE,
  createBlendTreeState,
  computeBlendTreeTargets,
  updateLocomotionBlendTree,
  sampleBlendTreeLeg,
  getBlendedHalfStride,
  computeBlendTreeHipOffset,
  didCrossHeelStrike,
  createFootIKState,
  applyTwoBoneFootIK,
  createShoulderConstraints,
  applyShoulderRotationConstraints
} from './locomotion-ik.js';

export const FOREST_ASSETS = {
  lumberjackPlayer: '/models/forest/lumberjack_player.glb',
  forestryWorker: '/models/forest/forestry_worker.glb',
  pineTree1: '/models/forest/pine_github.glb',
  pineTree2: '/models/forest/pine_github.glb',
  pineTreeHero: '/models/forest/pine_github.glb',
  pineTreeSilhouette: '/models/forest/pine_github.glb',
  oakTree1: '/models/forest/oak_github.glb',
  oakTree2: '/models/forest/oak_github.glb',
  pineGithub: '/models/forest/pine_github.glb',
  oakGithub: '/models/forest/oak_github.glb',
  riverBoulder: '/models/forest/river_boulder.glb',
  riverBouldersGithub: '/models/forest/river_boulders_github.glb',
  logBridge: '/models/forest/log_bridge_github.glb',
  logBridgeGithub: '/models/forest/log_bridge_github.glb',
  workerBunkhouse: '/models/forest/worker_bunkhouse.glb',
  waterwheelSawmill: '/models/forest/sawmill_github.glb',
  sawmillGithub: '/models/forest/sawmill_github.glb',
  tradingPost: '/models/forest/trading_post.glb',
  forestLogTruck: '/models/forest/forest_log_truck.glb',
  logHandcart: '/models/forest/log_handcart_github.glb',
  logHandcartGithub: '/models/forest/log_handcart_github.glb',
  timberLogSingle: '/models/forest/timber_log_single.glb',
  lumberShedStack: '/models/forest/lumber_shed_stack.glb',
  stoneChimneyHearth: '/models/forest/stone_chimney_hearth.glb',
  plankBundle: '/models/forest/plank_bundle.glb',
  woodLanternPost: '/models/forest/lantern_github.glb',
  lanternGithub: '/models/forest/lantern_github.glb',
  logPile: '/models/forest/log_pile.glb',
  campfire1: '/models/forest/campfire_github.glb',
  campfire2: '/models/forest/campfire_github.glb',
  campfireGithub: '/models/forest/campfire_github.glb',
  fellingAxe: '/models/forest/felling_axe.glb',
  // New Earthmoving Machinery, Industrial Sawmills & Articulated Workers (pulled & optimized from GitHub)
  excavatorHero: '/models/forest/excavator_hero_github.glb',
  wheelLoader: '/models/forest/wheel_loader_github.glb',
  bulldozerGrader: '/models/forest/bulldozer_grader_github.glb',
  crawlerCrane: '/models/forest/crawler_crane_github.glb',
  autoSawmill: '/models/forest/auto_sawmill_github.glb',
  tableSaw: '/models/forest/table_saw_github.glb',
  workerOperator: '/models/forest/worker_operator_github.glb',
  workerBuilderA: '/models/forest/worker_builder_a_github.glb',
  workerBuilderB: '/models/forest/worker_builder_b_github.glb',
  workerChainsaw: '/models/forest/worker_chainsaw_github.glb',
  workerSawyer: '/models/forest/worker_sawyer_github.glb',
  workerSawmillOp: '/models/forest/worker_sawmill_op_github.glb',
  // Tiered Residential Infrastructure Progression (Nhà cấp 4 -> Nhà sàn -> Nhà gỗ vùng cao -> Biệt thự)
  houseTier1: '/models/nhacap4_opt.glb',
  houseTier2: '/models/nhasan_opt.glb',
  houseTier3: '/models/nhatuyet_opt.glb',
  houseTier4: '/models/bietthu_opt.glb'
};

function markShared(resource) {
  if (!resource) return resource;
  resource.userData = resource.userData || {};
  resource.userData.shared = true;
  return resource;
}

/**
 * Recursively disposes non-shared GPU geometries, materials, and textures under root.
 */
export function disposeObject3D(root) {
  if (!root) return;
  const texKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'alphaMap'];
  root.traverse((obj) => {
    if (obj.geometry && !obj.geometry.userData?.shared) {
      obj.geometry.dispose();
    }
    const mat = obj.material;
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (!m || m.userData?.shared) continue;
        for (const k of texKeys) {
          if (m[k] && !m[k].userData?.shared) m[k].dispose();
        }
        m.dispose();
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Shared Singleton Geometries & Materials (Zero Repeat Allocation)
// ---------------------------------------------------------------------------
const contactGeo = markShared(new THREE.CircleGeometry(0.85, 18));
contactGeo.rotateX(-Math.PI / 2);

const contactMatCache = new Map();
function makeContactShadow(scale = 1.0, opacity = 0.34) {
  const key = opacity.toFixed(2);
  let mat = contactMatCache.get(key);
  if (!mat) {
    mat = markShared(new THREE.MeshBasicMaterial({
      color: 0x090d16,
      transparent: true,
      opacity,
      depthWrite: false
    }));
    contactMatCache.set(key, mat);
  }
  const m = new THREE.Mesh(contactGeo, mat);
  m.scale.setScalar(scale);
  m.position.y = 0.025;
  return m;
}

// Shared Log assets
let sharedLogGeo = null;
let sharedLogMatsNormal = null;
let sharedLogMatsRedwood = null;

function getLogAssets(isRedwood) {
  if (!sharedLogGeo) {
    sharedLogGeo = markShared(new THREE.CylinderGeometry(0.16, 0.17, 1.05, 8));
    sharedLogMatsNormal = [
      markShared(new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.88, metalness: 0.04, flatShading: true })),
      markShared(new THREE.MeshStandardMaterial({ color: 0xe9c496, roughness: 0.72, metalness: 0.02 })),
      null
    ];
    sharedLogMatsNormal[2] = sharedLogMatsNormal[1];

    sharedLogMatsRedwood = [
      markShared(new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.88, metalness: 0.04, flatShading: true })),
      markShared(new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.72, metalness: 0.02 })),
      null
    ];
    sharedLogMatsRedwood[2] = sharedLogMatsRedwood[1];
  }
  return {
    geo: sharedLogGeo,
    mats: isRedwood ? sharedLogMatsRedwood : sharedLogMatsNormal
  };
}

export function createLogMesh(isRedwood = false) {
  const { geo, mats } = getLogAssets(isRedwood);
  const group = new THREE.Group();
  const cyl = new THREE.Mesh(geo, mats);
  cyl.rotation.z = Math.PI / 2;
  cyl.castShadow = true;
  group.add(cyl);
  return group;
}

// Shared Plank assets
let sharedPlankGeo = null;
let sharedPlankMat = null;

export function createPlankMesh() {
  if (!sharedPlankGeo) {
    sharedPlankGeo = markShared(new THREE.BoxGeometry(0.95, 0.11, 0.28));
    sharedPlankMat = markShared(new THREE.MeshStandardMaterial({
      map: markShared(getTimberTexture('#e2a862', '#bd7c36')),
      roughness: 0.65,
      metalness: 0.05
    }));
  }
  const mesh = new THREE.Mesh(sharedPlankGeo, sharedPlankMat);
  mesh.castShadow = true;
  return mesh;
}

// Shared Pallet assets
let sharedPalletAssets = null;
export function createPalletCrate() {
  if (!sharedPalletAssets) {
    sharedPalletAssets = {
      woodMat: markShared(new THREE.MeshStandardMaterial({
        map: markShared(getTimberTexture('#d99b52', '#a8692c')),
        roughness: 0.7,
        metalness: 0.05
      })),
      strapMat: markShared(new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.3,
        metalness: 0.65
      })),
      baseGeo: markShared(new THREE.BoxGeometry(1.1, 0.14, 1.0)),
      stackGeo: markShared(new THREE.BoxGeometry(0.96, 0.56, 0.86)),
      strapGeo: markShared(new THREE.BoxGeometry(0.08, 0.6, 0.9))
    };
  }
  const { woodMat, strapMat, baseGeo, stackGeo, strapGeo } = sharedPalletAssets;
  const g = new THREE.Group();
  const base = new THREE.Mesh(baseGeo, woodMat);
  base.position.y = 0.07;
  base.castShadow = true;
  g.add(base);

  const stack = new THREE.Mesh(stackGeo, woodMat);
  stack.position.y = 0.42;
  stack.castShadow = true;
  g.add(stack);

  [-0.28, 0.28].forEach((x) => {
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(x, 0.42, 0);
    g.add(strap);
  });
  return g;
}

// Shared Humanoid Geometries
let playerGeos = null;
function getPlayerGeos() {
  if (playerGeos) return playerGeos;
  playerGeos = {
    thigh: markShared(new THREE.BoxGeometry(0.24, 0.56, 0.26)),
    boot: markShared(new THREE.BoxGeometry(0.26, 0.2, 0.34)),
    chest: markShared(new THREE.BoxGeometry(0.74, 0.78, 0.42)),
    vest: markShared(new THREE.BoxGeometry(0.78, 0.24, 0.45)),
    belt: markShared(new THREE.BoxGeometry(0.76, 0.1, 0.44)),
    skull: markShared(new THREE.BoxGeometry(0.46, 0.46, 0.46)),
    eye: markShared(new THREE.BoxGeometry(0.07, 0.08, 0.04)),
    helmet: markShared(new THREE.CylinderGeometry(0.26, 0.29, 0.18, 8)),
    brim: markShared(new THREE.BoxGeometry(0.52, 0.05, 0.36)),
    crown: markShared(new THREE.ConeGeometry(0.16, 0.2, 6)),
    arm: markShared(new THREE.BoxGeometry(0.2, 0.62, 0.22)),
    axeHandle: markShared(new THREE.CylinderGeometry(0.035, 0.04, 0.82, 6)),
    axeBlade: markShared(new THREE.BoxGeometry(0.06, 0.28, 0.26)),
    packFrame: markShared(new THREE.BoxGeometry(0.62, 0.68, 0.14)),
    eyeMat: markShared(new THREE.MeshBasicMaterial({ color: 0x0f172a }))
  };
  return playerGeos;
}

export function createPlayerModel(skinData, vipLevel = 0) {
  const geos = getPlayerGeos();
  const root = new THREE.Group();
  root.add(makeContactShadow(0.95, 0.38));

  const proceduralBody = new THREE.Group();
  root.add(proceduralBody);

  const mats = {
    skin: new THREE.MeshStandardMaterial({ color: 0xf4c7a1, roughness: 0.65 }),
    shirt: new THREE.MeshStandardMaterial({ color: skinData.shirt, roughness: 0.72 }),
    pants: new THREE.MeshStandardMaterial({ color: skinData.pants, roughness: 0.82 }),
    accent: new THREE.MeshStandardMaterial({ color: skinData.accent, roughness: 0.35, metalness: 0.5 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.88 }),
    hat: new THREE.MeshStandardMaterial({ color: skinData.hat, roughness: 0.32, metalness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.85 })
  };

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.72, 0);
  const lThigh = new THREE.Mesh(geos.thigh, mats.pants);
  lThigh.position.y = -0.28;
  lThigh.castShadow = true;
  const lBoot = new THREE.Mesh(geos.boot, mats.boot);
  lBoot.position.set(0, -0.62, 0.04);
  lBoot.castShadow = true;
  leftLeg.add(lThigh, lBoot);
  proceduralBody.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.72, 0);
  const rThigh = new THREE.Mesh(geos.thigh, mats.pants);
  rThigh.position.y = -0.28;
  rThigh.castShadow = true;
  const rBoot = new THREE.Mesh(geos.boot, mats.boot);
  rBoot.position.set(0, -0.62, 0.04);
  rBoot.castShadow = true;
  rightLeg.add(rThigh, rBoot);
  proceduralBody.add(rightLeg);

  const torso = new THREE.Group();
  torso.position.set(0, 0.76, 0);
  proceduralBody.add(torso);

  const chest = new THREE.Mesh(geos.chest, mats.shirt);
  chest.position.y = 0.39;
  chest.castShadow = true;
  torso.add(chest);

  const vest = new THREE.Mesh(geos.vest, mats.accent);
  vest.position.y = 0.46;
  torso.add(vest);

  const belt = new THREE.Mesh(geos.belt, mats.boot);
  belt.position.y = 0.06;
  torso.add(belt);

  const head = new THREE.Group();
  head.position.set(0, 0.98, 0);
  torso.add(head);

  const skull = new THREE.Mesh(geos.skull, mats.skin);
  skull.castShadow = true;
  head.add(skull);

  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(geos.eye, geos.eyeMat);
    eye.position.set(ex, 0.03, 0.23);
    head.add(eye);
  });

  const helmet = new THREE.Mesh(geos.helmet, mats.hat);
  helmet.position.y = 0.26;
  helmet.castShadow = true;
  head.add(helmet);

  const brim = new THREE.Mesh(geos.brim, mats.hat);
  brim.position.set(0, 0.19, 0.12);
  head.add(brim);

  const vipCrown = new THREE.Mesh(
    geos.crown,
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.15, emissive: 0x713f12, emissiveIntensity: 0.4 })
  );
  vipCrown.position.y = 0.44;
  vipCrown.visible = vipLevel >= 3;
  head.add(vipCrown);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 0.68, 0);
  const lArmMesh = new THREE.Mesh(geos.arm, mats.shirt);
  lArmMesh.position.y = -0.26;
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 0.68, 0);
  const rArmMesh = new THREE.Mesh(geos.arm, mats.shirt);
  rArmMesh.position.y = -0.26;
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);

  const axeGroup = new THREE.Group();
  axeGroup.position.set(0, -0.52, 0.15);
  const handle = new THREE.Mesh(geos.axeHandle, mats.boot);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 0.28;
  const blade = new THREE.Mesh(geos.axeBlade, mats.steel);
  blade.position.set(0, 0.08, 0.62);
  axeGroup.add(handle, blade);
  rightArm.add(axeGroup);
  torso.add(rightArm);

  const packFrame = new THREE.Mesh(geos.packFrame, mats.boot);
  packFrame.position.set(0, 0.42, -0.28);
  torso.add(packFrame);

  // Pre-pooled 16 backpack log slots (Zero GC / GPU allocation on chop or unload!)
  const logStackGroup = new THREE.Group();
  logStackGroup.position.set(0, 0.18, -0.44);
  logStackGroup.visible = false;
  for (let i = 0; i < 16; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const log = createLogMesh(false);
    log.scale.set(0.45, 0.55, 0.55);
    log.position.set(col === 0 ? -0.14 : 0.14, row * 0.16, 0);
    log.visible = false;
    logStackGroup.add(log);
  }
  torso.add(logStackGroup);

  // Dedicated GLB Character Container (hidden until lumberjack.glb finishes loading)
  const glbPivot = new THREE.Group();
  glbPivot.visible = false;
  const glbAnimGroup = new THREE.Group();
  const glbModelWrap = new THREE.Group();
  const glbLogAnchor = new THREE.Group();
  glbLogAnchor.position.set(0, 0.88, -0.46);
  const glbCrownAnchor = new THREE.Group();
  glbCrownAnchor.position.set(0, 2.08, 0);
  glbAnimGroup.add(glbModelWrap, glbLogAnchor, glbCrownAnchor);
  glbPivot.add(glbAnimGroup);
  root.add(glbPivot);

  root.userData = {
    proceduralBody,
    leftLeg, rightLeg, leftArm, rightArm, torso, head,
    vipCrown, axeBlade: blade, mats, logStackGroup,
    glbPivot, glbAnimGroup, glbModelWrap, glbLogAnchor, glbCrownAnchor,
    glbLoaded: false,
    glbActive: false,
    glbMixer: null,
    glbActions: {},
    glbActiveClipKey: null,
    glbClipNames: [],
    glbMeshCount: 0,
    glbYawOffset: 0,
    glbRig: null
  };

  return root;
}

export function updatePlayerModelSkin(playerModel, skinData, vipLevel) {
  const { mats, vipCrown } = playerModel.userData;
  mats.shirt.color.setHex(skinData.shirt);
  mats.pants.color.setHex(skinData.pants);
  mats.hat.color.setHex(skinData.hat);
  mats.accent.color.setHex(skinData.accent);
  if (vipCrown) vipCrown.visible = vipLevel >= 3;
}

export function syncPlayerBackLogs(playerModel, count) {
  const ud = playerModel?.userData;
  if (!ud) return;
  const carryCount = Math.max(0, Math.floor(count || 0));
  ud.carryCount = carryCount;

  // On the 17-bone GLB lumberjack rig: carry logs realistically on the shoulder (up to 3 visible)
  // and holster the felling axe neatly at the hip belt while hands hold the timber
  const rig = ud.glbRig;
  if (rig && Array.isArray(rig.shoulderLogSlots)) {
    const shown = Math.min(carryCount, rig.shoulderLogSlots.length);
    for (let i = 0; i < rig.shoulderLogSlots.length; i++) {
      rig.shoulderLogSlots[i].visible = i < shown;
    }
    if (rig.shoulderLogAnchor) rig.shoulderLogAnchor.visible = shown > 0;
    if (ud.logStackGroup) ud.logStackGroup.visible = false;
    return;
  }

  // Fallback for procedural body before GLB finishes streaming
  const group = ud.logStackGroup;
  if (!group) return;
  group.visible = carryCount > 0;
  const shown = Math.min(carryCount, group.children.length);
  for (let i = 0; i < group.children.length; i++) {
    group.children[i].visible = i < shown;
  }
}

export function syncPlayerAxeTier(playerModel, tier = 1) {
  const ud = playerModel?.userData;
  if (!ud) return;
  const lv = Math.max(1, Math.min(3, Math.floor(Number(tier) || 1)));
  ud.axeUpgradeTier = lv;

  const palette = {
    1: { tint: 0xffffff, emissive: 0x000000, emissiveIntensity: 0.0, metalness: 0.72, roughness: 0.36, scale: 1.0 },
    2: { tint: 0xdbeafe, emissive: 0x1d4ed8, emissiveIntensity: 0.14, metalness: 0.9, roughness: 0.22, scale: 1.06 },
    3: { tint: 0xfde68a, emissive: 0xd97706, emissiveIntensity: 0.32, metalness: 0.95, roughness: 0.18, scale: 1.13 }
  }[lv];

  const applyToAxe = (axeGroup) => {
    if (!axeGroup) return;
    if (!axeGroup.userData._baseScale) {
      axeGroup.userData._baseScale = axeGroup.scale.x || 1;
    }
    axeGroup.scale.setScalar(axeGroup.userData._baseScale * palette.scale);
    axeGroup.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (!m || !m.color) continue;
        if (m.metalness >= 0.45 || /blade|head|metal|iron|steel|axe/i.test(child.name || m.name || '')) {
          if (!m.userData._clonedForTier) {
            // Avoid mutating shared materials across unrelated props
            m.userData._clonedForTier = true;
          }
          m.color.setHex(palette.tint);
          if (m.emissive) {
            m.emissive.setHex(palette.emissive);
            m.emissiveIntensity = palette.emissiveIntensity;
          }
          if (typeof m.metalness === 'number') m.metalness = palette.metalness;
          if (typeof m.roughness === 'number') m.roughness = palette.roughness;
          m.needsUpdate = true;
        }
      }
    });
  };

  if (ud.glbRig?.axeMesh) applyToAxe(ud.glbRig.axeMesh);
  if (ud.glbRig?.beltAxeMesh) applyToAxe(ud.glbRig.beltAxeMesh);
  if (ud.axeBlade?.material) {
    ud.axeBlade.material.color.setHex(lv === 3 ? 0xfbbf24 : lv === 2 ? 0xbfdbfe : 0xdbe4ee);
    ud.axeBlade.material.needsUpdate = true;
  }
}

// Shared GLTFLoader & reusable math helpers (Zero GC)
let sharedGltfLoader = null;
const _glbBox = new THREE.Box3();
const _glbBodyBox = new THREE.Box3();
const _glbSize = new THREE.Vector3();
const _glbCenter = new THREE.Vector3();

function getGltfLoader() {
  if (!sharedGltfLoader) {
    sharedGltfLoader = new GLTFLoader();
    if (MeshoptDecoder) {
      sharedGltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
  }
  return sharedGltfLoader;
}

// Cached normalized GLB loader for residential, logging, infrastructure & boat assets
const _normalizedGlbCache = new Map();

function loadNormalizedGlbScene(url) {
  if (_normalizedGlbCache.has(url)) return _normalizedGlbCache.get(url);
  const promise = new Promise((resolve) => {
    const loader = getGltfLoader();
    loader.load(
      url,
      (gltf) => {
        const root = gltf?.scene || gltf?.scenes?.[0];
        if (!root) {
          resolve(null);
          return;
        }
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxHoriz = Math.max(size.x, size.z, 0.001);
        const height = Math.max(size.y, 0.001);

        const wrapper = new THREE.Group();
        root.position.set(-center.x, -box.min.y, -center.z);
        root.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            obj.frustumCulled = true;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (!m) continue;
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
              if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              if (typeof m.envMapIntensity === 'number') {
                m.envMapIntensity = 1.08;
              }
              if (typeof m.metalness === 'number' && m.metalness > 0 && m.metalness < 0.45) {
                m.metalness *= 0.3;
              }
              if (typeof m.roughness === 'number' && m.roughness > 0.88) {
                m.roughness = 0.86;
              }
              m.needsUpdate = true;
            }
          }
        });
        wrapper.add(root);
        resolve({ template: wrapper, size, maxHoriz, height });
      },
      undefined,
      () => resolve(null)
    );
  });
  _normalizedGlbCache.set(url, promise);
  return promise;
}

/**
 * Asynchronously mounts a cached, bottom-centered GLB model into targetGroup.
 * Fits either targetFootprint (max X/Z width) or targetHeight cleanly to ground y=0.
 */
export function mountNormalizedGlb(targetGroup, url, options = {}) {
  if (!targetGroup || !url) return Promise.resolve(false);
  const {
    targetFootprint = null,
    targetHeight = null,
    yaw = 0,
    yOffset = 0,
    placeholder = null,
    onLoad = null
  } = options;

  return loadNormalizedGlbScene(url).then((entry) => {
    if (!entry?.template || !targetGroup) return false;
    const clone = entry.template.clone(true);
    let scale = 1;
    if (targetHeight && entry.height > 0.001) {
      scale = targetHeight / entry.height;
    } else if (targetFootprint && entry.maxHoriz > 0.001) {
      scale = targetFootprint / entry.maxHoriz;
    }
    clone.scale.setScalar(scale);
    clone.rotation.y = yaw;
    clone.position.y = yOffset;
    if (placeholder) placeholder.visible = false;
    targetGroup.add(clone);
    if (typeof onLoad === 'function') {
      try {
        onLoad(clone);
      } catch (err) {
        console.warn('[TimberPort] mountNormalizedGlb onLoad error:', err);
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Cached Skinned/Static GLB Worker Character Loader (with Mixamo AnimationMixer)
// ---------------------------------------------------------------------------
const _workerGlbCache = new Map();

function loadWorkerGlbTemplate(url) {
  if (_workerGlbCache.has(url)) return _workerGlbCache.get(url);
  const promise = new Promise((resolve) => {
    const loader = getGltfLoader();
    loader.load(
      url,
      (gltf) => {
        const root = gltf?.scene;
        if (!root) {
          resolve(null);
          return;
        }
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        let isSkinned = false;
        root.traverse((obj) => {
          if (obj.isSkinnedMesh) isSkinned = true;
          if (obj.isMesh) {
            if (obj.geometry) markShared(obj.geometry);
            obj.castShadow = true;
            obj.receiveShadow = true;
            obj.frustumCulled = false;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (!m) continue;
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
              if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              if (typeof m.envMapIntensity === 'number') {
                m.envMapIntensity = 1.08;
              }
              if (typeof m.metalness === 'number' && m.metalness > 0 && m.metalness < 0.45) {
                m.metalness *= 0.3;
              }
              if (typeof m.roughness === 'number' && m.roughness > 0.88) {
                m.roughness = 0.86;
              }
              m.needsUpdate = true;
            }
          }
        });

        resolve({
          scene: root,
          animations: Array.isArray(gltf.animations) ? gltf.animations : [],
          height: Math.max(size.y, 0.001),
          centerX: center.x,
          centerZ: center.z,
          minY: box.min.y,
          isSkinned
        });
      },
      undefined,
      () => resolve(null)
    );
  });
  _workerGlbCache.set(url, promise);
  return promise;
}

export function mountGlbWorker(targetGroup, url, options = {}) {
  if (!targetGroup || !url) return Promise.resolve(false);
  const { targetHeight = 1.95, yaw = 0, placeholder = null, autoRigStatic = true } = options;

  return loadWorkerGlbTemplate(url).then((entry) => {
    if (!entry?.scene || !targetGroup) return false;
    const cloned = entry.isSkinned ? SkeletonUtils.clone(entry.scene) : entry.scene.clone(true);
    const scale = targetHeight / entry.height;

    const holder = new THREE.Group();
    cloned.position.set(-entry.centerX, -entry.minY, -entry.centerZ);
    holder.add(cloned);
    holder.scale.setScalar(scale);

    // Auto-rig static upright Meshy humanoid GLBs (e.g. forestry_worker.glb) with 13 articulated bones
    if (!entry.isSkinned && autoRigStatic) {
      holder.updateMatrixWorld(true);
      const rig = buildAutoHumanoidRig(holder, targetHeight, true);
      if (rig && rig.meshCount > 0) {
        if (rig.axeMesh) rig.axeMesh.visible = false;
        if (rig.beltAxeMesh) rig.beltAxeMesh.visible = false;
        if (rig.shoulderLogAnchor) rig.shoulderLogAnchor.visible = false;
        const rigHolder = new THREE.Group();
        rigHolder.rotation.y = yaw;
        rigHolder.add(rig.rigRoot);
        targetGroup.add(rigHolder);
        targetGroup.userData.glbHolder = rigHolder;
        targetGroup.userData.autoRig = rig;
        targetGroup.userData.glbLoaded = true;
        if (placeholder) placeholder.visible = false;
        return true;
      }
    }

    holder.rotation.y = yaw;
    targetGroup.add(holder);
    targetGroup.userData.glbHolder = holder;
    targetGroup.userData.glbLoaded = true;

    if (placeholder) placeholder.visible = false;

    if (entry.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(cloned);
      const walkClip =
        entry.animations.find((c) => /walk/i.test(c.name)) ||
        entry.animations.find((c) => /run/i.test(c.name)) ||
        entry.animations[0];
      const runClip = entry.animations.find((c) => /run/i.test(c.name)) || walkClip;
      const walkAction = mixer.clipAction(walkClip);
      walkAction.play();
      targetGroup.userData.glbMixer = mixer;
      targetGroup.userData.walkAction = walkAction;
      targetGroup.userData.runAction = runClip !== walkClip ? mixer.clipAction(runClip) : walkAction;
    }

    // Bind named skeleton bones for additive carrying, bending, heaving & brow-wipe gestures
    const bones = {};
    cloned.traverse((obj) => {
      if (!obj.name) return;
      const n = obj.name.toLowerCase();
      if (n === 'spine' || n === 'mixamorigspine') bones.spine = obj;
      else if (n === 'spine01' || n === 'mixamorigspine1') bones.spine1 = obj;
      else if (n === 'spine02' || n === 'mixamorigspine2') bones.spine2 = obj;
      else if (n === 'head' || n === 'mixamorighead') bones.head = obj;
      else if (n === 'leftarm' || n === 'mixamorigleftarm') bones.leftArm = obj;
      else if (n === 'leftforearm' || n === 'mixamorigleftforearm') bones.leftForeArm = obj;
      else if (n === 'rightarm' || n === 'mixamorigrightarm') bones.rightArm = obj;
      else if (n === 'rightforearm' || n === 'mixamorigrightforearm') bones.rightForeArm = obj;
      else if (n === 'leftupleg' || n === 'mixamorigleftupleg') bones.leftUpLeg = obj;
      else if (n === 'rightupleg' || n === 'mixamorigrightupleg') bones.rightUpLeg = obj;
    });
    targetGroup.userData.bones = Object.keys(bones).length > 0 ? bones : null;
    return true;
  });
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function createHeroLumberjackAxe(scale = 1, lowSpec = false) {
  const axe = new THREE.Group();
  axe.name = 'HeroLumberjackAxe';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a26,
    roughness: 0.76,
    metalness: 0.04
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.88,
    metalness: 0.02
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x525c68,
    roughness: 0.42,
    metalness: 0.78
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xdbe4ee,
    roughness: 0.22,
    metalness: 0.92
  });

  // Handle aligned along +Z (grip at z=0, head at z=+0.56, pommel at z=-0.18)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.027, 0.78, 8), woodMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0, 0.2);
  shaft.castShadow = !lowSpec;
  axe.add(shaft);

  // Leather grip wrap near hand
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.029, 0.2, 8), wrapMat);
  grip.rotation.x = Math.PI / 2;
  grip.position.set(0, 0, -0.02);
  axe.add(grip);

  // Pommel cap
  const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.05, 8), woodMat);
  pommel.rotation.x = Math.PI / 2;
  pommel.position.set(0, 0, -0.18);
  axe.add(pommel);

  // Forged steel socket collar
  const socket = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.085, 0.13), ironMat);
  socket.position.set(0, 0, 0.54);
  socket.castShadow = !lowSpec;
  axe.add(socket);

  // Tapered main blade pointing downward (-Y in axe local space)
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.19, 0.16), ironMat);
  blade.position.set(0, -0.11, 0.56);
  blade.rotation.x = 0.08;
  blade.castShadow = !lowSpec;
  axe.add(blade);

  // Honed bright cutting edge bevel
  const bevel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.055, 0.175), edgeMat);
  bevel.position.set(0, -0.215, 0.57);
  bevel.rotation.x = 0.08;
  axe.add(bevel);

  // Rear hammer poll
  const poll = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.065, 0.085), ironMat);
  poll.position.set(0, 0.055, 0.53);
  axe.add(poll);

  // Wrap procedural fallback so the real Meshy Pro felling_axe.glb replaces it seamlessly
  const fallback = new THREE.Group();
  for (const child of [...axe.children]) fallback.add(child);
  axe.add(fallback);

  const glbWrap = new THREE.Group();
  // Exact canonical orthonormal alignment solved from felling_axe.glb vertices:
  // places leather grip at (0,0,0), pommel at z=-0.22, head at z=+0.70, blade edge pointing cleanly -Y
  glbWrap.position.set(0.2406, -0.2115, -0.0543);
  glbWrap.quaternion.set(-0.5814, 0.6270, 0.2330, -0.4631);
  axe.add(glbWrap);
  mountNormalizedGlb(glbWrap, FOREST_ASSETS.fellingAxe, {
    targetHeight: 0.84,
    yaw: 0,
    placeholder: fallback
  });

  // Explicit weapon sockets: lower handle grip for Left-Hand 2-Bone IK + blade segment for Slash Trail VFX
  const secondaryGripAnchor = new THREE.Object3D();
  secondaryGripAnchor.name = 'AxeSecondaryGripAnchor';
  secondaryGripAnchor.position.set(0, 0, -0.155);
  axe.add(secondaryGripAnchor);

  const bladeBaseAnchor = new THREE.Object3D();
  bladeBaseAnchor.name = 'AxeBladeBaseAnchor';
  bladeBaseAnchor.position.set(0, -0.04, 0.56);
  axe.add(bladeBaseAnchor);

  const bladeTipAnchor = new THREE.Object3D();
  bladeTipAnchor.name = 'AxeBladeTipAnchor';
  bladeTipAnchor.position.set(0, -0.24, 0.60);
  axe.add(bladeTipAnchor);

  axe.userData.secondaryGripAnchor = secondaryGripAnchor;
  axe.userData.bladeBaseAnchor = bladeBaseAnchor;
  axe.userData.bladeTipAnchor = bladeTipAnchor;

  axe.scale.setScalar(scale);
  return axe;
}

function createShoulderTimberLog(scale = 1, lowSpec = false) {
  const holder = new THREE.Group();
  holder.name = 'ShoulderTimberLog';

  // Procedural fallback aligned front-to-back (+Z) matching timber_log_single.glb
  const fallback = new THREE.Group();
  const barkMat = markShared(new THREE.MeshStandardMaterial({ color: 0x674224, roughness: 0.9, metalness: 0.02 }));
  const endMat = markShared(new THREE.MeshStandardMaterial({ color: 0xe2bc88, roughness: 0.78, metalness: 0.02 }));
  const cyl = new THREE.Mesh(
    markShared(new THREE.CylinderGeometry(0.145, 0.16, 1.82, 10)),
    [barkMat, endMat, endMat]
  );
  cyl.rotation.x = Math.PI / 2;
  cyl.position.y = 0.15;
  cyl.castShadow = !lowSpec;
  fallback.add(cyl);
  holder.add(fallback);

  const glbWrap = new THREE.Group();
  holder.add(glbWrap);
  mountNormalizedGlb(glbWrap, FOREST_ASSETS.timberLogSingle, {
    targetFootprint: 1.85,
    yaw: 0,
    placeholder: fallback
  });

  holder.scale.setScalar(scale);
  return holder;
}

// De-interleaves and de-quantizes meshopt/KHR_mesh_quantization Int16/Int8 normalized attributes
// into clean Float32BufferAttributes BEFORE applyMatrix4 so coordinates > 1.0 are never clamped.
function prepareGeometryForSkinning(srcGeometry, matrixWorld) {
  const geo = new THREE.BufferGeometry();
  if (srcGeometry.index) {
    geo.setIndex(srcGeometry.index.clone());
  }

  for (const [attrName, attr] of Object.entries(srcGeometry.attributes)) {
    if (!attr) continue;
    const needsFloatUnpack =
      attr.isInterleavedBufferAttribute ||
      attr.normalized ||
      ((attrName === 'position' || attrName === 'normal' || attrName === 'uv' || attrName === 'uv1' || attrName === 'tangent') &&
        !(attr.array instanceof Float32Array));

    if (needsFloatUnpack) {
      const count = attr.count;
      const itemSize = attr.itemSize;
      const arr = new Float32Array(count * itemSize);
      for (let i = 0; i < count; i++) {
        const base = i * itemSize;
        arr[base] = attr.getX(i);
        if (itemSize > 1) arr[base + 1] = attr.getY(i);
        if (itemSize > 2) arr[base + 2] = attr.getZ(i);
        if (itemSize > 3) arr[base + 3] = attr.getW(i);
      }
      geo.setAttribute(attrName, new THREE.Float32BufferAttribute(arr, itemSize));
    } else {
      geo.setAttribute(attrName, attr.clone());
    }
  }

  if (Array.isArray(srcGeometry.groups) && srcGeometry.groups.length > 0) {
    for (const grp of srcGeometry.groups) {
      geo.addGroup(grp.start, grp.count, grp.materialIndex);
    }
  }

  geo.applyMatrix4(matrixWorld);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

// Builds a 17-bone anatomical humanoid skeleton & smooth-weighted SkinnedMeshes for static humanoid GLB models
function buildAutoHumanoidRig(model, normH, lowSpec = false) {
  const s = normH / 2.1;

  // Collect & bake source meshes into clean Float32 world-space geometries first
  // so we can measure whether this character has relaxed straight-down arms vs a wide 45-degree A-pose
  model.updateMatrixWorld(true);
  const sourceMeshes = [];
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      sourceMeshes.push(child);
    }
  });

  const preparedMeshes = [];
  let armSpanX = 0;
  for (const src of sourceMeshes) {
    const geo = prepareGeometryForSkinning(src.geometry, src.matrixWorld);
    const pos = geo.attributes.position;
    if (!pos) {
      geo.dispose();
      continue;
    }
    preparedMeshes.push({ src, geo, pos });

    const name = (src.name || '').toLowerCase();
    if (!/basket|buches|backpack/.test(name)) {
      const vCount = pos.count;
      for (let i = 0; i < vCount; i++) {
        const ny = pos.getY(i) / s;
        if (ny >= 0.84 && ny <= 1.44) {
          const ax = Math.abs(pos.getX(i) / s);
          if (ax > armSpanX) armSpanX = ax;
        }
      }
    }
  }

  // Relaxed-arm models (e.g. plaid-shirt lumberjack_player.glb) have hands near |x| ~ 0.41..0.52
  // Wide 45-degree A-pose models reach |x| ~ 0.68..0.80
  const isRelaxedArms = armSpanX > 0.25 && armSpanX < 0.62;
  const armDropZ = isRelaxedArms ? 0.085 : 0.62;

  // Auto-measure exact 3D left/right elbow & fist centroids directly from the GLB vertices
  // so handR/handL sit dead-center inside the actual closed fists (fixes the 18cm offset bug!)
  let shLX = isRelaxedArms ? 0.265 : 0.22;
  let shLY = isRelaxedArms ? 1.56 : 1.65;
  let shLZ = isRelaxedArms ? -0.04 : -0.05;
  let elLX = isRelaxedArms ? 0.39 : 0.44;
  let elLY = isRelaxedArms ? 1.22 : 1.44;
  let elLZ = isRelaxedArms ? -0.06 : -0.07;
  let fiLX = isRelaxedArms ? 0.365 : 0.62;
  let fiLY = isRelaxedArms ? 0.875 : 1.26;
  let fiLZ = isRelaxedArms ? 0.06 : -0.04;

  let shRX = -shLX;
  let shRY = shLY;
  let shRZ = shLZ;
  let elRX = -elLX;
  let elRY = elLY;
  let elRZ = elLZ;
  let fiRX = isRelaxedArms ? -0.376 : -0.62;
  let fiRY = isRelaxedArms ? 0.871 : 1.26;
  let fiRZ = isRelaxedArms ? -0.095 : -0.04;

  // Topological Arm-vs-Torso/Pants Separation for relaxed-arm GLBs:
  // Slices below the armpit crease via welded-vertex graph BFS so the entire torso, belt,
  // hip holster, and pants component is 100% topologically decoupled from the hanging arms.
  // Eliminates any rubber-band stretching when raising arms (wave, cheer, stretch, chop).
  const topoArmData = new Map();
  if (isRelaxedArms) {
    const cutCandidates = [1.42, 1.39, 1.36, 1.34, 1.31, 1.28, 1.24];
    for (const pm of preparedMeshes) {
      const mName = (pm.src.name || '').toLowerCase();
      if (/eye|yeux|basket|buches|backpack|cheveux|hair|beard|body1_kiltchaussures|boot|shoe|kilt|skirt|tunic/.test(mName)) {
        continue;
      }
      const pos = pm.pos;
      const vCount = pos.count;
      const idxAttr = pm.geo.index;
      const triCount = idxAttr ? (idxAttr.count / 3) : Math.floor(vCount / 3);
      if (vCount < 30 || triCount < 10) continue;

      // 1. Weld spatially coincident vertices (so UV seams don't split a limb)
      const posMap = new Map();
      const canon = new Int32Array(vCount);
      const cX = [];
      const cY = [];
      const cZ = [];
      for (let i = 0; i < vCount; i++) {
        const nx = pos.getX(i) / s;
        const ny = pos.getY(i) / s;
        const nz = pos.getZ(i) / s;
        const key = `${Math.round(nx * 1500)},${Math.round(ny * 1500)},${Math.round(nz * 1500)}`;
        let cid = posMap.get(key);
        if (cid === undefined) {
          cid = cX.length;
          posMap.set(key, cid);
          cX.push(nx);
          cY.push(ny);
          cZ.push(nz);
        }
        canon[i] = cid;
      }
      const cCount = cX.length;

      // 2. Build full welded adjacency graph once (deduped via small neighbor lists)
      const adj = Array.from({ length: cCount }, () => []);
      const addEdge = (a, b) => {
        if (a === b) return;
        if (!adj[a].includes(b)) adj[a].push(b);
        if (!adj[b].includes(a)) adj[b].push(a);
      };
      for (let t = 0; t < triCount; t++) {
        const i0 = idxAttr ? idxAttr.getX(t * 3) : t * 3;
        const i1 = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
        const a = canon[i0];
        const b = canon[i1];
        const c = canon[i2];
        addEdge(a, b);
        addEdge(b, c);
        addEdge(c, a);
      }

      // 3. Sweep armpit Y_CUT downward to find highest clean topological separation per arm
      let leftArmMask = null;
      let rightArmMask = null;
      let cutYL = 1.34;
      let cutYR = 1.34;
      const visited = new Int32Array(cCount);
      const queue = new Int32Array(cCount);
      let visitStamp = 0;

      for (let ci = 0; ci < cutCandidates.length; ci++) {
        if (leftArmMask && rightArmMask) break;
        const yCut = cutCandidates[ci];
        visitStamp++;
        let bestLeftComp = null;
        let bestRightComp = null;
        for (let i = 0; i < cCount; i++) {
          if (cY[i] >= yCut || visited[i] === visitStamp) continue;
          let qHead = 0;
          let qTail = 0;
          queue[qTail++] = i;
          visited[i] = visitStamp;
          let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, sumX = 0;
          while (qHead < qTail) {
            const u = queue[qHead++];
            const ux = cX[u];
            const uy = cY[u];
            sumX += ux;
            if (ux < minX) minX = ux;
            if (ux > maxX) maxX = ux;
            if (uy < minY) minY = uy;
            if (uy > maxY) maxY = uy;
            const nbs = adj[u];
            for (let k = 0; k < nbs.length; k++) {
              const nb = nbs[k];
              if (cY[nb] < yCut && visited[nb] !== visitStamp) {
                visited[nb] = visitStamp;
                queue[qTail++] = nb;
              }
            }
          }
          // Skip main torso/pants/legs component (touches lower legs), tiny dust, and detached props not reaching armpit cut
          if (qTail < 25 || minY < 0.48 || maxY < yCut - 0.04 || (maxY - minY) < 0.07) continue;
          const cx = sumX / qTail;
          if (!leftArmMask && cx > 0.15 && maxX > 0.34) {
            if (!bestLeftComp || qTail > bestLeftComp.length) {
              bestLeftComp = queue.slice(0, qTail);
            }
          } else if (!rightArmMask && cx < -0.15 && minX < -0.34) {
            if (!bestRightComp || qTail > bestRightComp.length) {
              bestRightComp = queue.slice(0, qTail);
            }
          }
        }
        if (bestLeftComp) {
          leftArmMask = new Uint8Array(cCount);
          for (let k = 0; k < bestLeftComp.length; k++) leftArmMask[bestLeftComp[k]] = 1;
          cutYL = yCut;
        }
        if (bestRightComp) {
          rightArmMask = new Uint8Array(cCount);
          for (let k = 0; k < bestRightComp.length; k++) rightArmMask[bestRightComp[k]] = 1;
          cutYR = yCut;
        }
      }

      if (leftArmMask || rightArmMask) {
        // 4. Build per-welded-vertex armFactor with hard zero lock on entire body/pants below armpit
        //    and 3-pass Laplacian smoothing strictly across the deltoid/armpit crease
        const armW = new Float32Array(cCount);
        const armWNext = new Float32Array(cCount);
        const pinned = new Uint8Array(cCount);

        for (let u = 0; u < cCount; u++) {
          const nx = cX[u];
          const ny = cY[u];
          const absX = Math.abs(nx);
          const isLeft = nx >= 0;
          const hasSideTopo = isLeft ? Boolean(leftArmMask) : Boolean(rightArmMask);
          const yCut = isLeft ? cutYL : cutYR;

          if (leftArmMask && leftArmMask[u]) {
            armW[u] = 1.0;
            if (ny < cutYL - 0.035) pinned[u] = 1;
          } else if (rightArmMask && rightArmMask[u]) {
            armW[u] = 1.0;
            if (ny < cutYR - 0.035) pinned[u] = 1;
          } else if (hasSideTopo && ny < yCut) {
            // Guaranteed body/belt/pants/leg vertex below armpit -> HARD-LOCKED to 0!
            armW[u] = 0.0;
            pinned[u] = 1;
          } else if (ny >= yCut && ny <= 1.74 && absX > 0.16) {
            armW[u] = smoothstep(0.22, 0.30, absX) * smoothstep(1.74, 1.62, ny);
          } else {
            armW[u] = 0.0;
            pinned[u] = 1;
          }
        }

        // Smooth shoulder crease so deltoid raises cleanly without hard steps
        for (let pass = 0; pass < 3; pass++) {
          for (let u = 0; u < cCount; u++) {
            if (pinned[u]) {
              armWNext[u] = armW[u];
              continue;
            }
            const nbs = adj[u];
            if (nbs.length === 0) {
              armWNext[u] = armW[u];
              continue;
            }
            let sum = armW[u] * 2.0;
            let weightSum = 2.0;
            for (let k = 0; k < nbs.length; k++) {
              sum += armW[nbs[k]];
              weightSum += 1.0;
            }
            armWNext[u] = sum / weightSum;
          }
          armW.set(armWNext);
        }

        topoArmData.set(pm.geo, {
          canon,
          armW,
          hasLeft: Boolean(leftArmMask),
          hasRight: Boolean(rightArmMask),
          leftArmMask,
          rightArmMask,
          cX,
          cY,
          cZ
        });
      }
    }

    // Pass 1: find lowest Y of outer arm vertices on each side to isolate the true fist/palm region
    // Prefer topologically isolated arm vertices when available so hip/pants never contaminate centroids
    let minArmYL = 1.12;
    let minArmYR = 1.12;
    for (const pm of preparedMeshes) {
      if (/basket|buches|backpack/.test((pm.src.name || '').toLowerCase())) continue;
      const topo = topoArmData.get(pm.geo);
      if (topo && (topo.hasLeft || topo.hasRight)) {
        for (let u = 0; u < topo.cY.length; u++) {
          const uy = topo.cY[u];
          if (topo.leftArmMask && topo.leftArmMask[u] && uy < minArmYL) minArmYL = uy;
          if (topo.rightArmMask && topo.rightArmMask[u] && uy < minArmYR) minArmYR = uy;
        }
        continue;
      }
      const pos = pm.pos;
      for (let i = 0; i < pos.count; i++) {
        const nx = pos.getX(i) / s;
        const ny = pos.getY(i) / s;
        if (ny < 0.72 || ny > 1.12) continue;
        if (nx > 0.295 && ny < minArmYL) minArmYL = ny;
        if (nx < -0.295 && ny < minArmYR) minArmYR = ny;
      }
    }

    // Pass 2: compute weighted centroids of actual left/right fists & elbows
    let fLSumX = 0, fLSumY = 0, fLSumZ = 0, fLCnt = 0;
    let fRSumX = 0, fRSumY = 0, fRSumZ = 0, fRCnt = 0;
    let eLSumX = 0, eLSumY = 0, eLSumZ = 0, eLCnt = 0;
    let eRSumX = 0, eRSumY = 0, eRSumZ = 0, eRCnt = 0;

    for (const pm of preparedMeshes) {
      if (/basket|buches|backpack/.test((pm.src.name || '').toLowerCase())) continue;
      const topo = topoArmData.get(pm.geo);
      if (topo && (topo.hasLeft || topo.hasRight)) {
        for (let u = 0; u < topo.cY.length; u++) {
          const nx = topo.cX[u];
          const ny = topo.cY[u];
          const nz = topo.cZ[u];
          if (topo.leftArmMask && topo.leftArmMask[u]) {
            if (ny >= minArmYL && ny <= minArmYL + 0.145) {
              fLSumX += nx; fLSumY += ny; fLSumZ += nz; fLCnt++;
            }
            if (ny >= 1.14 && ny <= 1.32) {
              eLSumX += nx; eLSumY += ny; eLSumZ += nz; eLCnt++;
            }
          } else if (topo.rightArmMask && topo.rightArmMask[u]) {
            if (ny >= minArmYR && ny <= minArmYR + 0.145) {
              fRSumX += nx; fRSumY += ny; fRSumZ += nz; fRCnt++;
            }
            if (ny >= 1.14 && ny <= 1.32) {
              eRSumX += nx; eRSumY += ny; eRSumZ += nz; eRCnt++;
            }
          }
        }
        continue;
      }
      const pos = pm.pos;
      for (let i = 0; i < pos.count; i++) {
        const nx = pos.getX(i) / s;
        const ny = pos.getY(i) / s;
        const nz = pos.getZ(i) / s;
        if (nx > 0.295 && ny >= minArmYL && ny <= minArmYL + 0.145) {
          fLSumX += nx; fLSumY += ny; fLSumZ += nz; fLCnt++;
        } else if (nx < -0.295 && ny >= minArmYR && ny <= minArmYR + 0.145) {
          fRSumX += nx; fRSumY += ny; fRSumZ += nz; fRCnt++;
        }
        if (ny >= 1.14 && ny <= 1.32) {
          if (nx > 0.295) { eLSumX += nx; eLSumY += ny; eLSumZ += nz; eLCnt++; }
          else if (nx < -0.295) { eRSumX += nx; eRSumY += ny; eRSumZ += nz; eRCnt++; }
        }
      }
    }

    if (fLCnt >= 6) {
      fiLX = Math.max(0.30, Math.min(0.56, fLSumX / fLCnt));
      fiLY = Math.max(0.76, Math.min(1.00, fLSumY / fLCnt));
      fiLZ = Math.max(-0.22, Math.min(0.24, fLSumZ / fLCnt));
    }
    if (fRCnt >= 6) {
      fiRX = Math.min(-0.30, Math.max(-0.56, fRSumX / fRCnt));
      fiRY = Math.max(0.76, Math.min(1.00, fRSumY / fRCnt));
      fiRZ = Math.max(-0.22, Math.min(0.24, fRSumZ / fRCnt));
    }
    if (eLCnt >= 6) {
      elLX = Math.max(0.30, Math.min(0.54, eLSumX / eLCnt));
      elLY = Math.max(1.14, Math.min(1.32, eLSumY / eLCnt));
      elLZ = Math.max(-0.20, Math.min(0.14, eLSumZ / eLCnt));
    }
    if (eRCnt >= 6) {
      elRX = Math.min(-0.30, Math.max(-0.54, eRSumX / eRCnt));
      elRY = Math.max(1.14, Math.min(1.32, eRSumY / eRCnt));
      elRZ = Math.max(-0.20, Math.min(0.14, eRSumZ / eRCnt));
    }
  }

  // 17-bone indices:
  // 0:hips, 1:spine, 2:chest, 3:neck, 4:head,
  // 5:upperArmL, 6:foreArmL, 7:handL,
  // 8:upperArmR, 9:foreArmR, 10:handR,
  // 11:thighL, 12:shinL, 13:footL,
  // 14:thighR, 15:shinR, 16:footR
  const hips = new THREE.Bone();
  hips.name = 'hips';
  hips.position.set(0, 1.02 * s, 0);

  const spine = new THREE.Bone();
  spine.name = 'spine';
  spine.position.set(0, 0.20 * s, 0);
  hips.add(spine);

  const chest = new THREE.Bone();
  chest.name = 'chest';
  chest.position.set(0, 0.31 * s, -0.01 * s);
  spine.add(chest);
  // Cumulative chest world rest position: (0, 1.53, -0.01) * s
  const chestWX = 0;
  const chestWY = 1.53;
  const chestWZ = -0.01;

  // Measure actual lateral hip/waist/belt half-width from non-arm torso/pants vertices
  // so Shoulder Rotation Constraints maintain exact physical clearance for every body build
  let hipHalfWidthL = isRelaxedArms ? 0.30 : 0.25;
  let hipHalfWidthR = isRelaxedArms ? 0.30 : 0.25;
  {
    let maxHipL = 0;
    let maxHipR = 0;
    for (const pm of preparedMeshes) {
      if (/basket|buches|backpack/.test((pm.src.name || '').toLowerCase())) continue;
      const topo = topoArmData.get(pm.geo);
      if (topo && (topo.hasLeft || topo.hasRight)) {
        for (let u = 0; u < topo.cY.length; u++) {
          if ((topo.leftArmMask && topo.leftArmMask[u]) || (topo.rightArmMask && topo.rightArmMask[u])) continue;
          const uy = topo.cY[u];
          const uz = topo.cZ[u];
          if (uy < 0.70 || uy > 1.28 || Math.abs(uz) > 0.22) continue;
          const ux = topo.cX[u];
          if (ux > maxHipL && ux < 0.36) maxHipL = ux;
          if (-ux > maxHipR && -ux < 0.36) maxHipR = -ux;
        }
      } else {
        const pos = pm.pos;
        for (let i = 0; i < pos.count; i++) {
          const ny = pos.getY(i) / s;
          const nz = pos.getZ(i) / s;
          if (ny < 0.70 || ny > 1.28 || Math.abs(nz) > 0.20) continue;
          const nx = pos.getX(i) / s;
          if (nx > maxHipL && nx < 0.28) maxHipL = nx;
          if (-nx > maxHipR && -nx < 0.28) maxHipR = -nx;
        }
      }
    }
    if (maxHipL >= 0.16) hipHalfWidthL = Math.max(0.22, Math.min(0.33, maxHipL));
    if (maxHipR >= 0.16) hipHalfWidthR = Math.max(0.22, Math.min(0.33, maxHipR));
  }
  const shoulderConstraints = createShoulderConstraints({
    isRelaxedArms,
    armDropZ,
    hipHalfWidthL,
    hipHalfWidthR,
    chestWX,
    chestWY,
    chestWZ
  });

  const neck = new THREE.Bone();
  neck.name = 'neck';
  neck.position.set(0, (isRelaxedArms ? 0.22 : 0.24) * s, 0);
  chest.add(neck);

  const head = new THREE.Bone();
  head.name = 'head';
  head.position.set(0, 0.12 * s, 0.02 * s);
  neck.add(head);

  // Left arm chain: exact local subtraction from measured world joint coordinates
  const upperArmL = new THREE.Bone();
  upperArmL.name = 'upperArmL';
  upperArmL.position.set((shLX - chestWX) * s, (shLY - chestWY) * s, (shLZ - chestWZ) * s);
  chest.add(upperArmL);

  const foreArmL = new THREE.Bone();
  foreArmL.name = 'foreArmL';
  foreArmL.position.set((elLX - shLX) * s, (elLY - shLY) * s, (elLZ - shLZ) * s);
  upperArmL.add(foreArmL);

  const handL = new THREE.Bone();
  handL.name = 'handL';
  handL.position.set((fiLX - elLX) * s, (fiLY - elLY) * s, (fiLZ - elLZ) * s);
  foreArmL.add(handL);

  // Right arm chain: exact local subtraction so handR sits dead-center inside the closed right fist
  const upperArmR = new THREE.Bone();
  upperArmR.name = 'upperArmR';
  upperArmR.position.set((shRX - chestWX) * s, (shRY - chestWY) * s, (shRZ - chestWZ) * s);
  chest.add(upperArmR);

  const foreArmR = new THREE.Bone();
  foreArmR.name = 'foreArmR';
  foreArmR.position.set((elRX - shRX) * s, (elRY - shRY) * s, (elRZ - shRZ) * s);
  upperArmR.add(foreArmR);

  const handR = new THREE.Bone();
  handR.name = 'handR';
  handR.position.set((fiRX - elRX) * s, (fiRY - elRY) * s, (fiRZ - elRZ) * s);
  foreArmR.add(handR);

  // Auto-measure anatomical leg columns (hip -> knee -> ankle) so bones align cleanly with the mesh
  // without artificial outward splay, and compute subtle inward adduction if the GLB rest pose is wide.
  let legHipLX = 0.105, legHipRX = -0.105;
  let legKneeLX = 0.105, legKneeRX = -0.105;
  let legAnkleLX = 0.105, legAnkleRX = -0.105;
  {
    let hLS = 0, hLC = 0, hRS = 0, hRC = 0;
    let kLS = 0, kLC = 0, kRS = 0, kRC = 0;
    let aLS = 0, aLC = 0, aRS = 0, aRC = 0;
    for (const pm of preparedMeshes) {
      const pos = pm.geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const nx = pos.getX(i) / s;
        const ny = pos.getY(i) / s;
        const absX = Math.abs(nx);
        if (absX < 0.025 || absX > 0.245) continue;
        if (ny >= 0.78 && ny <= 0.96) {
          if (nx > 0) { hLS += nx; hLC++; } else { hRS += nx; hRC++; }
        } else if (ny >= 0.45 && ny <= 0.62) {
          if (nx > 0) { kLS += nx; kLC++; } else { kRS += nx; kRC++; }
        } else if (ny >= 0.06 && ny <= 0.24) {
          if (nx > 0) { aLS += nx; aLC++; } else { aRS += nx; aRC++; }
        }
      }
    }
    if (hLC >= 6) legHipLX = Math.max(0.082, Math.min(0.135, hLS / hLC));
    if (hRC >= 6) legHipRX = Math.min(-0.082, Math.max(-0.135, hRS / hRC));
    if (kLC >= 6) legKneeLX = Math.max(0.080, Math.min(0.155, kLS / kLC));
    if (kRC >= 6) legKneeRX = Math.min(-0.080, Math.max(-0.155, kRS / kRC));
    if (aLC >= 6) legAnkleLX = Math.max(0.078, Math.min(0.175, aLS / aLC));
    if (aRC >= 6) legAnkleRX = Math.min(-0.078, Math.max(-0.175, aRS / aRC));
  }
  // Subtle inward adduction angle if the source GLB mesh was sculpted in a wide A-pose stance
  const legAdductL = legAnkleLX > 0.104 ? -Math.min(0.11, Math.atan2(legAnkleLX - 0.098, 0.86)) : 0;
  const legAdductR = legAnkleRX < -0.104 ? Math.min(0.11, Math.atan2(-legAnkleRX - 0.098, 0.86)) : 0;

  const thighL = new THREE.Bone();
  thighL.name = 'thighL';
  thighL.position.set(legHipLX * s, -0.02 * s, 0);
  hips.add(thighL);

  const shinL = new THREE.Bone();
  shinL.name = 'shinL';
  shinL.position.set((legKneeLX - legHipLX) * s, -0.43 * s, -0.008 * s);
  thighL.add(shinL);

  const footL = new THREE.Bone();
  footL.name = 'footL';
  footL.position.set((legAnkleLX - legKneeLX) * s, -0.44 * s, 0.016 * s);
  shinL.add(footL);

  const thighR = new THREE.Bone();
  thighR.name = 'thighR';
  thighR.position.set(legHipRX * s, -0.02 * s, 0);
  hips.add(thighR);

  const shinR = new THREE.Bone();
  shinR.name = 'shinR';
  shinR.position.set((legKneeRX - legHipRX) * s, -0.43 * s, -0.008 * s);
  thighR.add(shinR);

  const footR = new THREE.Bone();
  footR.name = 'footR';
  footR.position.set((legAnkleRX - legKneeRX) * s, -0.44 * s, 0.016 * s);
  shinR.add(footR);

  // Hand anchor seated directly inside the auto-measured right palm center
  const handRAnchor = new THREE.Group();
  handRAnchor.name = 'handRAnchor';
  if (isRelaxedArms) {
    handRAnchor.position.set(0.0 * s, -0.012 * s, 0.015 * s);
    handRAnchor.rotation.set(-0.06, 0.02, 0.03);
  } else {
    handRAnchor.position.set(-0.01 * s, -0.02 * s, 0.065 * s);
    handRAnchor.rotation.set(0.12, -0.06, -0.54);
  }
  handR.add(handRAnchor);

  const axeMesh = createHeroLumberjackAxe(s * 1.04, lowSpec);
  handRAnchor.add(axeMesh);

  // Hip belt holster anchor on left waist (visible while carrying heavy timber or pulling handcart)
  const beltAxeAnchor = new THREE.Group();
  beltAxeAnchor.name = 'beltAxeAnchor';
  beltAxeAnchor.position.set(0.255 * s, -0.035 * s, 0.02 * s);
  beltAxeAnchor.rotation.set(Math.PI * 0.44, 0.18, 0.16);
  hips.add(beltAxeAnchor);

  const beltAxeMesh = createHeroLumberjackAxe(s * 0.90, lowSpec);
  beltAxeMesh.visible = false;
  beltAxeAnchor.add(beltAxeMesh);

  // Right-shoulder timber carry mount attached to chest (hidden until player actually carries chopped logs)
  const shoulderLogAnchor = new THREE.Group();
  shoulderLogAnchor.name = 'shoulderLogAnchor';
  shoulderLogAnchor.position.set(-0.23 * s, 0.19 * s, 0.05 * s);
  shoulderLogAnchor.rotation.set(-0.14, 0.06, 0.08);
  shoulderLogAnchor.visible = false;
  chest.add(shoulderLogAnchor);

  const shoulderLogSlots = [];
  const logSlotOffsets = [
    { x: 0.0, y: 0.0, z: 0.0, rz: 0.0 },
    { x: -0.16 * s, y: 0.07 * s, z: -0.04 * s, rz: -0.06 },
    { x: -0.06 * s, y: 0.22 * s, z: -0.02 * s, rz: 0.05 }
  ];
  for (let i = 0; i < logSlotOffsets.length; i++) {
    const off = logSlotOffsets[i];
    const logSlot = createShoulderTimberLog(s * 0.96, lowSpec);
    logSlot.position.set(off.x, off.y, off.z);
    logSlot.rotation.z = off.rz;
    logSlot.visible = false;
    shoulderLogAnchor.add(logSlot);
    shoulderLogSlots.push(logSlot);
  }

  const boneList = [
    hips, spine, chest, neck, head,
    upperArmL, foreArmL, handL,
    upperArmR, foreArmR, handR,
    thighL, shinL, footL,
    thighR, shinR, footR
  ];

  const rigRoot = new THREE.Group();
  rigRoot.name = 'AutoHumanoidRig';
  rigRoot.add(hips);
  rigRoot.updateMatrixWorld(true);

  const skeleton = new THREE.Skeleton(boneList);

  // Reusable per-vertex accumulator for top-4 bone weights across 17 bones
  const BONE_COUNT = 17;
  const wBuf = new Float32Array(BONE_COUNT);
  const idx4 = [0, 0, 0, 0];
  const val4 = [0, 0, 0, 0];

  const writeTop4 = (skinIndices, skinWeights, vIdx) => {
    idx4[0] = idx4[1] = idx4[2] = idx4[3] = 0;
    val4[0] = val4[1] = val4[2] = val4[3] = 0;
    for (let b = 0; b < BONE_COUNT; b++) {
      const w = wBuf[b];
      if (w <= 0.0001) continue;
      if (w > val4[0]) {
        val4[3] = val4[2]; idx4[3] = idx4[2];
        val4[2] = val4[1]; idx4[2] = idx4[1];
        val4[1] = val4[0]; idx4[1] = idx4[0];
        val4[0] = w; idx4[0] = b;
      } else if (w > val4[1]) {
        val4[3] = val4[2]; idx4[3] = idx4[2];
        val4[2] = val4[1]; idx4[2] = idx4[1];
        val4[1] = w; idx4[1] = b;
      } else if (w > val4[2]) {
        val4[3] = val4[2]; idx4[3] = idx4[2];
        val4[2] = w; idx4[2] = b;
      } else if (w > val4[3]) {
        val4[3] = w; idx4[3] = b;
      }
    }
    const sum = val4[0] + val4[1] + val4[2] + val4[3];
    const base = vIdx * 4;
    if (sum > 0.0001) {
      const inv = 1 / sum;
      skinIndices[base] = idx4[0];
      skinIndices[base + 1] = idx4[1];
      skinIndices[base + 2] = idx4[2];
      skinIndices[base + 3] = idx4[3];
      skinWeights[base] = val4[0] * inv;
      skinWeights[base + 1] = val4[1] * inv;
      skinWeights[base + 2] = val4[2] * inv;
      skinWeights[base + 3] = val4[3] * inv;
    } else {
      skinIndices[base] = 0;
      skinWeights[base] = 1;
    }
  };

  let meshCount = 0;
  for (const { src, geo, pos } of preparedMeshes) {
    const vCount = pos.count;
    const skinIndices = new Uint16Array(vCount * 4);
    const skinWeights = new Float32Array(vCount * 4);
    const name = (src.name || '').toLowerCase();

    const isEye = /eye|yeux/.test(name);
    const isBasket = /basket|buches|backpack/.test(name);
    const isHair = /cheveux|hair|beard/.test(name);
    const isBootsMesh = /body1_kiltchaussures|boot|shoe/.test(name);
    const isKiltMesh = !isBootsMesh && /kilt|skirt|tunic/.test(name);

    for (let i = 0; i < vCount; i++) {
      wBuf.fill(0);
      const nx = pos.getX(i) / s;
      const ny = pos.getY(i) / s;
      const absX = Math.abs(nx);

      if (isEye) {
        wBuf[4] = 1;
      } else if (isBasket) {
        wBuf[2] = 1;
      } else if (isHair) {
        const wHead = smoothstep(1.56, 1.78, ny);
        wBuf[4] = wHead;
        wBuf[2] = 1 - wHead;
      } else if (isBootsMesh) {
        const ankleBlend = smoothstep(0.22, 0.11, ny);
        const shinIdx = nx >= 0 ? 12 : 15;
        const footIdx = nx >= 0 ? 13 : 16;
        wBuf[shinIdx] = 1 - ankleBlend;
        wBuf[footIdx] = ankleBlend;
      } else if (isKiltMesh) {
        if (ny >= 1.02) {
          const tSpine = smoothstep(1.02, 1.22, ny);
          const tChest = smoothstep(1.24, 1.48, ny);
          wBuf[0] = 1 - tSpine;
          wBuf[1] = tSpine * (1 - tChest);
          wBuf[2] = tSpine * tChest;
        } else {
          const tSkirt = smoothstep(1.04, 0.58, ny);
          const sideL = smoothstep(-0.11, 0.11, nx);
          const legShare = 0.52 * tSkirt;
          wBuf[0] = 1 - legShare;
          wBuf[11] = legShare * sideL;
          wBuf[14] = legShare * (1 - sideL);
        }
      } else if (isRelaxedArms) {
        // 3D Bone-Capsule Separation for relaxed-arm anatomy:
        // Strictly separates arms/forearms/fists from hips/pockets/thighs below the armpit crease
        // so swinging arms NEVER pull or stretch the pants mesh (fixes "vừa đi vừa kéo quần").
        const nz = pos.getZ(i) / s;
        const isLeft = nx >= 0;
        const shX = isLeft ? shLX : shRX;
        const shY = isLeft ? shLY : shRY;
        const shZ = isLeft ? shLZ : shRZ;
        const elX = isLeft ? elLX : elRX;
        const elY = isLeft ? elLY : elRY;
        const elZ = isLeft ? elLZ : elRZ;
        const fiX = isLeft ? fiLX : fiRX;
        const fiY = isLeft ? fiLY : fiRY;
        const fiZ = isLeft ? fiLZ : fiRZ;

        // Squared 3D distance to a bone capsule segment A->B
        const distSegSq = (px, py, pz, ax, ay, az, bx, by, bz) => {
          const abx = bx - ax, aby = by - ay, abz = bz - az;
          const abLenSq = abx * abx + aby * aby + abz * abz;
          let tSeg = 0;
          if (abLenSq > 1e-6) {
            tSeg = ((px - ax) * abx + (py - ay) * aby + (pz - az) * abz) / abLenSq;
            if (tSeg < 0) tSeg = 0;
            else if (tSeg > 1) tSeg = 1;
          }
          const cx = ax + abx * tSeg - px;
          const cy = ay + aby * tSeg - py;
          const cz = az + abz * tSeg - pz;
          return cx * cx + cy * cy + cz * cz;
        };

        const topo = topoArmData.get(geo);
        const hasSideTopo = topo && (isLeft ? topo.hasLeft : topo.hasRight);

        let armFactor = 0;
        if (hasSideTopo) {
          armFactor = topo.armW[topo.canon[i]];
        } else if (ny >= 0.78 && ny <= 1.74 && absX > 0.21) {
          if (ny >= 1.38) {
            // Smooth deltoid/shoulder blend strictly above the armpit crease
            armFactor = smoothstep(0.22, 0.30, absX) * smoothstep(1.74, 1.62, ny);
          } else {
            // Fallback capsule separation when topological split is unavailable
            const dUpperSq = distSegSq(nx, ny, nz, shX, shY, shZ, elX, elY, elZ);
            const dForeSq = distSegSq(nx, ny, nz, elX, elY, elZ, fiX, fiY, fiZ);
            const dArm = Math.sqrt(Math.min(dUpperSq, dForeSq));

            const sideSign = isLeft ? 1 : -1;
            const dTrunkSq = distSegSq(nx, ny, nz, 0, 1.00, 0, 0, 1.53, -0.01);
            const dHipSideSq = distSegSq(nx, ny, nz, sideSign * 0.145, 1.00, 0, sideSign * 0.16, 0.56, -0.01);
            const dBody = Math.sqrt(Math.min(dTrunkSq, dHipSideSq));

            if (absX > 0.295 && dArm < dBody * 0.82) {
              armFactor = 1.0;
            } else {
              armFactor = 0.0;
            }
          }
        }

        if (armFactor > 0.001) {
          // Project along the actual measured 3D shoulder -> elbow -> fist chain
          const dUpperSq = distSegSq(nx, ny, nz, shX, shY, shZ, elX, elY, elZ);
          const dForeSq = distSegSq(nx, ny, nz, elX, elY, elZ, fiX, fiY, fiZ);
          const upperT = (() => {
            const dx = elX - shX, dy = elY - shY, dz = elZ - shZ;
            const lenSq = Math.max(1e-5, dx * dx + dy * dy + dz * dz);
            return Math.max(0, Math.min(1, ((nx - shX) * dx + (ny - shY) * dy + (nz - shZ) * dz) / lenSq));
          })();
          const foreT = (() => {
            const dx = fiX - elX, dy = fiY - elY, dz = fiZ - elZ;
            const lenSq = Math.max(1e-5, dx * dx + dy * dy + dz * dz);
            return Math.max(0, Math.min(1.15, ((nx - elX) * dx + (ny - elY) * dy + (nz - elZ) * dz) / lenSq));
          })();
          const u = dForeSq < dUpperSq ? (1.0 + foreT) : upperT;
          const foreBlend = smoothstep(0.82, 1.16, u);
          const handBlend = smoothstep(1.76, 2.02, u);
          const upperIdx = isLeft ? 5 : 8;
          const foreIdx = isLeft ? 6 : 9;
          const handIdx = isLeft ? 7 : 10;
          wBuf[upperIdx] += armFactor * (1 - foreBlend);
          wBuf[foreIdx] += armFactor * foreBlend * (1 - handBlend);
          wBuf[handIdx] += armFactor * foreBlend * handBlend;
        }

        const bodyRem = 1 - armFactor;
        if (bodyRem > 0.001) {
          if (ny < 1.04) {
            const tLeg = smoothstep(1.05, 0.90, ny);
            const sideL = smoothstep(-0.04, 0.04, nx);
            const tKnee = smoothstep(0.66, 0.50, ny);
            const tAnkle = smoothstep(0.20, 0.09, ny);
            wBuf[0] += bodyRem * (1 - tLeg);
            const wThigh = bodyRem * tLeg * (1 - tKnee);
            const wLower = bodyRem * tLeg * tKnee;
            const wShin = wLower * (1 - tAnkle);
            const wFoot = wLower * tAnkle;
            wBuf[11] += wThigh * sideL;
            wBuf[12] += wShin * sideL;
            wBuf[13] += wFoot * sideL;
            wBuf[14] += wThigh * (1 - sideL);
            wBuf[15] += wShin * (1 - sideL);
            wBuf[16] += wFoot * (1 - sideL);
          } else if (ny < 1.20) {
            const t = smoothstep(1.04, 1.20, ny);
            wBuf[0] += bodyRem * (1 - t);
            wBuf[1] += bodyRem * t;
          } else if (ny < 1.48) {
            const t = smoothstep(1.20, 1.48, ny);
            wBuf[1] += bodyRem * (1 - t);
            wBuf[2] += bodyRem * t;
          } else if (ny < 1.70) {
            const tNeck = smoothstep(1.64, 1.75, ny);
            wBuf[2] += bodyRem * (1 - tNeck);
            wBuf[3] += bodyRem * tNeck;
          } else if (ny < 1.84) {
            const tHead = smoothstep(1.72, 1.84, ny);
            wBuf[3] += bodyRem * (1 - tHead);
            wBuf[4] += bodyRem * tHead;
          } else {
            wBuf[4] += bodyRem;
          }
        }
      } else if (ny < 1.04) {
        // Lower body (pelvis -> thighs -> shins -> feet/boots) for wide A-pose models
        const tLeg = smoothstep(1.05, 0.90, ny);
        const sideL = smoothstep(-0.04, 0.04, nx);
        const tKnee = smoothstep(0.66, 0.50, ny);
        const tAnkle = smoothstep(0.20, 0.09, ny);
        wBuf[0] = 1 - tLeg;
        const wThigh = tLeg * (1 - tKnee);
        const wLower = tLeg * tKnee;
        const wShin = wLower * (1 - tAnkle);
        const wFoot = wLower * tAnkle;
        wBuf[11] = wThigh * sideL;
        wBuf[12] = wShin * sideL;
        wBuf[13] = wFoot * sideL;
        wBuf[14] = wThigh * (1 - sideL);
        wBuf[15] = wShin * (1 - sideL);
        wBuf[16] = wFoot * (1 - sideL);
      } else {
        // Upper body + wide 45-deg A-pose arms (upper -> forearm -> hand) + neck + head
        const armFactor =
          smoothstep(0.175, 0.275, absX) *
          smoothstep(1.82, 1.70, ny) *
          smoothstep(1.00, 1.10, ny);

        if (armFactor > 0.001) {
          // Projection along shoulder -> elbow -> wrist axis (0=shoulder, 1=elbow, ~1.82=wrist)
          const u = ((absX - 0.22) * 0.22 + (1.65 - ny) * 0.21) / (0.22 * 0.22 + 0.21 * 0.21);
          const foreBlend = smoothstep(0.80, 1.18, u);
          const handBlend = smoothstep(1.58, 1.88, u);
          const upperIdx = nx >= 0 ? 5 : 8;
          const foreIdx = nx >= 0 ? 6 : 9;
          const handIdx = nx >= 0 ? 7 : 10;
          wBuf[upperIdx] += armFactor * (1 - foreBlend);
          wBuf[foreIdx] += armFactor * foreBlend * (1 - handBlend);
          wBuf[handIdx] += armFactor * foreBlend * handBlend;
        }

        const torsoRem = 1 - armFactor;
        if (torsoRem > 0.001) {
          if (ny < 1.20) {
            const t = smoothstep(1.04, 1.20, ny);
            wBuf[0] += torsoRem * (1 - t);
            wBuf[1] += torsoRem * t;
          } else if (ny < 1.48) {
            const t = smoothstep(1.20, 1.48, ny);
            wBuf[1] += torsoRem * (1 - t);
            wBuf[2] += torsoRem * t;
          } else if (ny < 1.72) {
            const tNeck = smoothstep(1.66, 1.78, ny);
            wBuf[2] += torsoRem * (1 - tNeck);
            wBuf[3] += torsoRem * tNeck;
          } else if (ny < 1.86) {
            const tHead = smoothstep(1.74, 1.86, ny);
            wBuf[3] += torsoRem * (1 - tHead);
            wBuf[4] += torsoRem * tHead;
          } else {
            wBuf[4] += torsoRem;
          }
        }
      }

      writeTop4(skinIndices, skinWeights, i);
    }

    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const skinned = new THREE.SkinnedMesh(geo, src.material);
    skinned.name = src.name;
    skinned.castShadow = false;
    skinned.receiveShadow = !lowSpec;
    skinned.frustumCulled = false;
    skinned.bind(skeleton);
    rigRoot.add(skinned);
    meshCount++;
  }

  for (const src of sourceMeshes) {
    if (src.geometry && !src.geometry.userData?.shared) {
      src.geometry.dispose();
    }
  }

  const getAxeBladeWorldSegment = (outBase, outTip) => {
    if (!axeMesh || !axeMesh.visible || !axeMesh.userData?.bladeBaseAnchor || !axeMesh.userData?.bladeTipAnchor) {
      return false;
    }
    axeMesh.updateWorldMatrix(true, true);
    axeMesh.userData.bladeBaseAnchor.getWorldPosition(outBase);
    axeMesh.userData.bladeTipAnchor.getWorldPosition(outTip);
    return Number.isFinite(outBase.x) && Number.isFinite(outTip.x);
  };

  const getAxeSecondaryGripWorld = (outPos) => {
    if (!axeMesh || !axeMesh.visible || !axeMesh.userData?.secondaryGripAnchor) {
      return false;
    }
    axeMesh.updateWorldMatrix(true, true);
    axeMesh.userData.secondaryGripAnchor.getWorldPosition(outPos);
    return Number.isFinite(outPos.x);
  };

  return {
    rigRoot,
    skeleton,
    meshCount,
    scale: s,
    hipsRestY: 1.02 * s,
    soleHeight: 0.13 * s,
    legAdductL,
    legAdductR,
    isRelaxedArms,
    armDropZ,
    shoulderConstraints,
    handRAnchor,
    axeMesh,
    getAxeBladeWorldSegment,
    getAxeSecondaryGripWorld,
    beltAxeAnchor,
    beltAxeMesh,
    shoulderLogAnchor,
    shoulderLogSlots,
    bones: {
      hips, spine, chest, neck, head,
      upperArmL, foreArmL, handL,
      upperArmR, foreArmR, handR,
      thighL, shinL, footL,
      thighR, shinR, footR
    },
    state: {
      moveBlend: 0,
      runBlend: 0,
      chopBlend: 0,
      carryBlend: 0,
      pullBlend: 0,
      phase: IDLE_REST_PHASE,
      breathPhase: 0,
      idleLookPhase: 0,
      speedSmooth: 0,
      prevUL: NaN,
      prevUR: NaN,
      blendTree: createBlendTreeState(),
      ikState: createFootIKState()
    }
  };
}

export function setPlayerGlbYawOffset(playerModel, yawRad = 0) {
  const ud = playerModel?.userData;
  if (!ud?.glbModelWrap) return;
  const normalized = Number.isFinite(yawRad) ? yawRad : 0;
  ud.glbYawOffset = normalized;
  ud.glbModelWrap.rotation.y = normalized;
}

export function setPlayerGlbShadows(playerModel, enableShadows = true) {
  const ud = playerModel?.userData;
  if (!ud?.glbModelWrap) return;
  ud.glbModelWrap.traverse((child) => {
    if (child.isMesh) {
      // Keep dense skinned GLB out of shadow-map pass; ground contact shadow handles grounding cheaply
      child.castShadow = enableShadows && !child.isSkinnedMesh;
      child.receiveShadow = enableShadows;
    }
  });
}

export function setPlayerGlbActive(playerModel, active) {
  const ud = playerModel?.userData;
  if (!ud) return false;
  const shouldEnable = Boolean(active && ud.glbLoaded);
  ud.glbActive = shouldEnable;
  if (ud.glbPivot) ud.glbPivot.visible = shouldEnable;
  if (ud.proceduralBody) ud.proceduralBody.visible = !shouldEnable;

  // Re-parent backpack log stack & VIP crown seamlessly between GLB and procedural body
  if (ud.logStackGroup) {
    if (shouldEnable && ud.glbLogAnchor) {
      ud.glbLogAnchor.add(ud.logStackGroup);
      ud.logStackGroup.position.set(0, 0, 0);
    } else if (ud.torso) {
      ud.torso.add(ud.logStackGroup);
      ud.logStackGroup.position.set(0, 0.18, -0.44);
    }
  }
  if (ud.vipCrown) {
    if (shouldEnable && ud.glbCrownAnchor) {
      ud.glbCrownAnchor.add(ud.vipCrown);
      ud.vipCrown.position.set(0, 0, 0);
    } else if (ud.head) {
      ud.head.add(ud.vipCrown);
      ud.vipCrown.position.set(0, 0.44, 0);
    }
  }
  return shouldEnable;
}

export function attachGlbToPlayerModel(playerModel, url, options = {}) {
  const ud = playerModel?.userData;
  if (!ud?.glbModelWrap) {
    return Promise.resolve({ ok: false, error: 'Player model chưa được khởi tạo.' });
  }

  const targetHeight = options.targetHeight || 2.1;
  const lowSpec = Boolean(options.lowSpec);
  const useGlb = options.useGlb !== false;
  const yawOffset = Number.isFinite(options.yawOffset) ? options.yawOffset : (ud.glbYawOffset || 0);
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : undefined;

  return new Promise((resolve) => {
    const loader = getGltfLoader();
    loader.load(
      url,
      (gltf) => {
        try {
          const model = gltf.scene || gltf.scenes?.[0];
          if (!model) {
            resolve({ ok: false, error: 'File GLB không chứa scene 3D hợp lệ.' });
            return;
          }

          // Rescue shared log/crown anchors before disposing previous GLB subtree
          if (ud.glbLogAnchor && ud.glbAnimGroup) {
            ud.glbAnimGroup.add(ud.glbLogAnchor);
          }
          if (ud.glbCrownAnchor && ud.glbAnimGroup) {
            ud.glbAnimGroup.add(ud.glbCrownAnchor);
          }

          // Dispose previous GLB instance cleanly to avoid GPU/VRAM leaks
          if (ud.glbMixer) {
            ud.glbMixer.stopAllAction();
            ud.glbMixer.uncacheRoot(ud.glbModelWrap);
            ud.glbMixer = null;
          }
          ud.glbActions = {};
          ud.glbActiveClipKey = null;
          ud.glbRig = null;
          while (ud.glbModelWrap.children.length > 0) {
            const oldChild = ud.glbModelWrap.children[0];
            ud.glbModelWrap.remove(oldChild);
            disposeObject3D(oldChild);
          }

          // Normalize scale & ground bottom-center accurately at y = 0
          model.updateMatrixWorld(true);
          _glbBox.setFromObject(model);
          _glbBox.getSize(_glbSize);
          const rawHeight = _glbSize.y > 0.0001 ? _glbSize.y : Math.max(_glbSize.x, _glbSize.z, 1);
          const scaleFactor = targetHeight / rawHeight;
          model.scale.multiplyScalar(scaleFactor);
          model.updateMatrixWorld(true);

          _glbBox.setFromObject(model);
          _glbBox.getCenter(_glbCenter);
          _glbBox.getSize(_glbSize);

          // Center X/Z around body meshes so back props (e.g., log basket) don't offset the spine
          _glbBodyBox.makeEmpty();
          let hasExistingSkinned = false;
          model.traverse((child) => {
            if (child.isSkinnedMesh) hasExistingSkinned = true;
            if (child.isMesh && /body|peau|kilt|leg|boot|torso|head|eye/i.test(child.name || '')) {
              _glbBodyBox.expandByObject(child);
            }
          });
          if (!_glbBodyBox.isEmpty()) {
            _glbBodyBox.getCenter(_glbCenter);
          }

          model.position.x -= _glbCenter.x;
          model.position.z -= _glbCenter.z;
          model.position.y -= _glbBox.min.y;
          model.updateMatrixWorld(true);

          // Configure shadows & PBR materials for TimberPort outdoor studio lighting
          let meshCount = 0;
          model.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              child.castShadow = !lowSpec;
              child.receiveShadow = !lowSpec;
              child.frustumCulled = false;
              const matsList = Array.isArray(child.material) ? child.material : [child.material];
              for (const m of matsList) {
                if (!m) continue;
                if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                if (typeof m.envMapIntensity === 'number') {
                  m.envMapIntensity = 1.12;
                }
                if (typeof m.metalness === 'number' && m.metalness > 0 && m.metalness < 0.45) {
                  m.metalness *= 0.25;
                }
                if (typeof m.roughness === 'number' && m.roughness > 0.86) {
                  m.roughness = 0.82;
                }
                m.needsUpdate = true;
              }
            }
          });

          const normH = Math.max(1.4, _glbSize.y);
          const normDepth = Math.min(1.1, Math.max(0.55, Math.min(_glbSize.x, _glbSize.z)));
          const clips = Array.isArray(gltf.animations) ? gltf.animations : [];
          ud.glbClipNames = clips.map((c) => c.name || 'Unnamed');

          if (clips.length > 0 || hasExistingSkinned) {
            // Preserve native skeletal rig & embedded AnimationClips
            ud.glbModelWrap.add(model);
            ud.glbMeshCount = meshCount;
            ud.glbLogAnchor.position.set(0, normH * 0.52, -(normDepth * 0.44 + 0.12));
            ud.glbCrownAnchor.position.set(0, normH + 0.14, 0);

            if (clips.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              const findClip = (regex) => clips.find((c) => regex.test(c.name || ''));
              const idleClip = findClip(/idle|stand|breath|wait|rest/i) || clips[0];
              const walkClip = findClip(/walk|run|move|jog|sprint|stride|locomot/i) || (clips.length > 1 ? clips[1] : clips[0]);
              const chopClip = findClip(/chop|axe|swing|attack|slash|hit|cut|mine|work|action/i) || null;

              const actions = {};
              if (idleClip) actions.idle = mixer.clipAction(idleClip);
              if (walkClip) actions.walk = mixer.clipAction(walkClip);
              if (chopClip) actions.chop = mixer.clipAction(chopClip);

              ud.glbMixer = mixer;
              ud.glbActions = actions;
              if (actions.idle) {
                actions.idle.reset().play();
                ud.glbActiveClipKey = 'idle';
              }
            }
          } else {
            // Static A-pose humanoid GLB -> convert to full 13-bone articulated human skeleton
            const rig = buildAutoHumanoidRig(model, normH, lowSpec);
            ud.glbRig = rig;
            ud.glbMeshCount = rig.meshCount;
            ud.glbModelWrap.add(rig.rigRoot);

            // Attach backpack log stack (hidden when shoulder-carry is active) & VIP crown to skeleton
            rig.bones.chest.add(ud.glbLogAnchor);
            ud.glbLogAnchor.position.set(0, 0.04 * rig.scale, -0.44 * rig.scale);
            rig.bones.head.add(ud.glbCrownAnchor);
            ud.glbCrownAnchor.position.set(0, 0.30 * rig.scale, 0.02 * rig.scale);
          }

          setPlayerGlbYawOffset(playerModel, yawOffset);

          ud.glbLoaded = true;
          setPlayerGlbActive(playerModel, useGlb);
          syncPlayerBackLogs(playerModel, ud.carryCount || 0);

          resolve({
            ok: true,
            meshCount: ud.glbMeshCount,
            clipNames: ud.glbClipNames,
            hasAnimations: clips.length > 0,
            autoRigged: Boolean(ud.glbRig)
          });
        } catch (err) {
          resolve({ ok: false, error: err?.message || 'Lỗi xử lý mô hình GLB.' });
        }
      },
      onProgress,
      (err) => {
        resolve({ ok: false, error: err?.message || 'Không thể tải file lumberjack.glb.' });
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Locomotion Blend Tree & 2-Bone Foot-Locking IK Integration (Zero-GC)
//   • 5-State Blend Tree: Idle -> Walk -> Jog -> Run -> Sprint
//   • Direction-change centripetal turn banking & look-ahead lead
//   • World-space Foot-Plant Locking with Closed-Form 2-Bone Leg IK
// ---------------------------------------------------------------------------
const _gaitLegL = { thighRx: 0, shinRx: 0, footRx: 0 };
const _gaitLegR = { thighRx: 0, shinRx: 0, footRx: 0 };
const _compatBt = createBlendTreeState();
const _ikParams = {
  uL: 0,
  uR: 0.5,
  btState: null,
  jumpY: 0,
  inWater: false,
  getGroundHeight: null,
  rootYaw: 0
};
const _armIkTarget = new THREE.Vector3();
const _armIkPole = new THREE.Vector3();

export function computeGaitWeights4Tier(speed, loadWeight, out) {
  return computeBlendTreeTargets(speed, loadWeight, out);
}

export function sampleHumanLegGait4Tier(u, wWalk, wJog, wSprint, strideScale, loadWeight, wadeLift, slopePitch, out) {
  _compatBt.wWalk = wWalk;
  _compatBt.wJog = wJog;
  _compatBt.wRun = wSprint * 0.4;
  _compatBt.wSprint = wSprint * 0.6;
  return sampleBlendTreeLeg(u, _compatBt, strideScale, loadWeight, wadeLift, slopePitch, out);
}

export function sampleHumanLegGait(u, runBlend, strideScale, loadWeight, wadeLift, out) {
  _compatBt.wWalk = Math.max(0, 1 - runBlend);
  _compatBt.wJog = runBlend > 0.01 && runBlend < 0.8 ? Math.sin(runBlend * Math.PI) * 0.7 : 0;
  _compatBt.wRun = Math.max(0, (runBlend - 0.25) / 0.75) * 0.6;
  _compatBt.wSprint = Math.max(0, (runBlend - 0.55) / 0.45);
  return sampleBlendTreeLeg(u, _compatBt, strideScale, loadWeight, wadeLift, 0, out);
}

/**
 * Creates a real GLB camp worker with full 17-bone SkinnedMesh skeleton (hip/knee/ankle/spine/shoulder/elbow)
 * so all workers walk, jog, run, haul logs, and saw trees with Blend Tree + 2-Bone Foot IK.
 */
export function createArticulatedGlbWorker(url, options = {}) {
  const root = new THREE.Group();
  const targetHeight = options.targetHeight || 1.92;
  const lowSpec = Boolean(options.lowSpec);
  const yawOffset = Number.isFinite(options.yawOffset) ? options.yawOffset : 0;
  const hasBuiltInTool = Boolean(options.hasBuiltInTool);

  root.add(makeContactShadow(0.74, 0.34));

  const modelWrap = new THREE.Group();
  modelWrap.rotation.y = yawOffset;
  root.add(modelWrap);

  const carriedLog = createLogMesh(false);
  carriedLog.rotation.x = Math.PI / 2;
  carriedLog.scale.set(0.52, 1.05, 0.52);
  carriedLog.position.set(0.24, 1.48, 0.04);
  carriedLog.visible = false;
  root.add(carriedLog);

  root.userData = {
    glbLoaded: false,
    glbRig: null,
    modelWrap,
    carriedLog,
    hasBuiltInTool,
    role: options.role || 'porter',
    animState: {
      moveBlend: 0,
      workBlend: 0,
      carryBlend: 0,
      speedSmooth: 0,
      phase: IDLE_REST_PHASE + (Math.random() < 0.5 ? 0 : Math.PI),
      breathPhase: Math.random() * Math.PI * 2,
      prevUL: NaN,
      prevUR: NaN,
      blendTree: createBlendTreeState(),
      ikState: createFootIKState()
    }
  };

  const loader = getGltfLoader();
  loader.load(
    url,
    (gltf) => {
      try {
        const srcModel = gltf.scene || gltf.scenes?.[0];
        if (!srcModel) return;
        const model = SkeletonUtils.clone(srcModel);

        model.updateMatrixWorld(true);
        _glbBox.setFromObject(model);
        _glbBox.getSize(_glbSize);
        const rawH = _glbSize.y > 0.0001 ? _glbSize.y : 1;
        model.scale.multiplyScalar(targetHeight / rawH);
        model.updateMatrixWorld(true);

        _glbBox.setFromObject(model);
        _glbBox.getCenter(_glbCenter);
        _glbBox.getSize(_glbSize);
        model.position.x -= _glbCenter.x;
        model.position.z -= _glbCenter.z;
        model.position.y -= _glbBox.min.y;
        model.updateMatrixWorld(true);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = !lowSpec;
            child.receiveShadow = !lowSpec;
            child.frustumCulled = false;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const m of mats) {
              if (!m) continue;
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
              if (typeof m.envMapIntensity === 'number') m.envMapIntensity = 1.08;
              m.needsUpdate = true;
            }
          }
        });

        const rig = buildAutoHumanoidRig(model, Math.max(1.3, _glbSize.y), lowSpec);
        if (rig.axeMesh) rig.axeMesh.visible = false;
        if (rig.beltAxeMesh) rig.beltAxeMesh.visible = false;
        if (rig.shoulderLogAnchor) rig.shoulderLogAnchor.visible = false;

        modelWrap.add(rig.rigRoot);
        if (rig.bones?.chest) {
          rig.bones.chest.add(carriedLog);
          carriedLog.position.set(0.22 * rig.scale, 0.22 * rig.scale, 0.04 * rig.scale);
        }
        root.userData.glbRig = rig;
        root.userData.glbLoaded = true;
      } catch (err) {
        console.warn('[WorkerGLB] Auto-rig error:', err?.message || err);
      }
    },
    undefined,
    (err) => {
      console.warn('[WorkerGLB] Failed to load:', url, err?.message || err);
    }
  );

  return root;
}

/**
 * Drives a 17-bone articulated GLB camp worker with the 5-State Locomotion Blend Tree
 * (Idle -> Walk -> Jog -> Run -> Sprint), turn banking, and 2-Bone Foot-Locking IK.
 */
export function updateArticulatedGlbWorker(workerRoot, dt, opts = {}) {
  const ud = workerRoot?.userData;
  if (!ud || !ud.glbRig) return;

  const rig = ud.glbRig;
  const b = rig.bones;
  const st = ud.animState;
  if (!st.blendTree) st.blendTree = createBlendTreeState();
  if (!st.ikState) st.ikState = createFootIKState();

  const clampedDt = Math.min(dt, 0.05);
  const moving = Boolean(opts.moving);
  const working = Boolean(opts.working);
  const carrying = Boolean(opts.carrying);
  const inWater = Boolean(opts.inWater);
  const distMoved = Number.isFinite(opts.distMoved) ? opts.distMoved : (moving ? 3.5 * clampedDt : 0);
  const rawSpeed = Number.isFinite(opts.speed) ? opts.speed : (clampedDt > 0.0001 ? distMoved / clampedDt : 0);
  const yawRate = Number.isFinite(opts.yawRate) ? opts.yawRate : 0;
  const slopePitch = Number.isFinite(opts.slopePitch) ? opts.slopePitch : 0;
  const workStyle = opts.workStyle || 'chainsaw';
  const elapsed = opts.elapsed || 0;

  if (ud.carriedLog) ud.carriedLog.visible = carrying;

  const dampMove = 1 - Math.exp(-(moving ? 10.5 : 8.5) * clampedDt);
  st.speedSmooth += (rawSpeed - st.speedSmooth) * (1 - Math.exp(-9.0 * clampedDt));
  st.moveBlend += ((moving ? 1 : 0) - st.moveBlend) * dampMove;
  st.workBlend += ((working ? 1 : 0) - st.workBlend) * (1 - Math.exp(-10 * clampedDt));
  st.carryBlend += ((carrying ? 1 : 0) - st.carryBlend) * (1 - Math.exp(-9 * clampedDt));

  const loadW = carrying ? 0.55 : 0;
  const bt = updateLocomotionBlendTree(st.blendTree, clampedDt, st.speedSmooth, loadW, yawRate, 0, 0);
  const m = Math.max(0, Math.min(1, 1 - bt.wIdle));
  const idle = Math.max(0, 1 - m);
  const fastRatio = Math.min(1, bt.wJog * 0.45 + bt.wRun * 0.78 + bt.wSprint);

  if (distMoved > 0.0005) {
    const halfStride = getBlendedHalfStride(bt, loadW);
    st.phase += (distMoved / Math.max(0.38, halfStride)) * Math.PI;
  } else if (m > 0.005 || Math.abs(((st.phase - IDLE_REST_PHASE) % Math.PI + Math.PI) % Math.PI) > 0.02) {
    const nearestRest = Math.round((st.phase - IDLE_REST_PHASE) / Math.PI) * Math.PI + IDLE_REST_PHASE;
    st.phase += (nearestRest - st.phase) * (1 - Math.exp(-6.5 * clampedDt));
  }
  st.breathPhase += clampedDt * (1.85 + m * (1.2 + fastRatio * 1.6) + st.workBlend * 1.6);

  const wk = st.workBlend;
  const cy = st.carryBlend;
  const p = st.phase;
  const s = rig.scale;
  const breath = Math.sin(st.breathPhase);
  const uL = (((p / (Math.PI * 2)) % 1) + 1) % 1;
  const uR = (uL + 0.5) % 1;

  if (typeof opts.onFootstep === 'function' && m > 0.28 && distMoved > 0.002) {
    const stepInt = 0.45 + fastRatio * 0.42 + loadW * 0.2;
    if (didCrossHeelStrike(st.prevUL, uL)) opts.onFootstep('left', stepInt);
    if (didCrossHeelStrike(st.prevUR, uR)) opts.onFootstep('right', stepInt);
  }
  st.prevUL = uL;
  st.prevUR = uR;

  const walkRamp = 0.58 + 0.42 * (bt.walkAmp ?? 1);
  const strideScale = (carrying ? 0.84 : 0.96) * walkRamp * (1 + bt.wJog * 0.10 + bt.wRun * 0.22 + bt.wSprint * 0.32);
  const legL = sampleBlendTreeLeg(uL, bt, strideScale, loadW, inWater ? 0.24 : 0, slopePitch, _gaitLegL);
  const legR = sampleBlendTreeLeg(uR, bt, strideScale, loadW, inWater ? 0.24 : 0, slopePitch, _gaitLegR);

  const hipDyn = computeBlendTreeHipOffset(legL, legR, p, bt, loadW) * m;
  const workCrouch = wk * (workStyle === 'chainsaw' ? -0.055 : -0.032);
  b.hips.position.set(
    Math.sin(p - 0.30) * (0.020 * (1 - fastRatio * 0.35)) * m * s,
    rig.hipsRestY + (hipDyn + breath * 0.006 * idle + workCrouch - cy * 0.024) * s,
    ((0.010 + fastRatio * 0.028) * m + wk * 0.03) * s
  );
  b.hips.rotation.set(
    (0.020 + bt.wJog * 0.042 + bt.wRun * 0.080 + bt.wSprint * 0.115 + slopePitch * 0.15) * m + wk * 0.09,
    Math.cos(p - 0.18) * (0.064 + fastRatio * 0.062) * m,
    -Math.sin(p - 0.12) * 0.030 * m + bt.turnBank * 0.62
  );

  const sawVib = wk > 0.05 && workStyle === 'chainsaw' ? Math.sin(elapsed * 42) * 0.024 * wk : 0;
  const sawStroke = wk > 0.05 && workStyle === 'handsaw' ? Math.sin(elapsed * 7.8) * 0.16 * wk : 0;

  b.spine.rotation.set(
    (0.024 + bt.wJog * 0.064 + bt.wRun * 0.120 + bt.wSprint * 0.175 + slopePitch * 0.20) * m + breath * 0.014 * idle + cy * 0.08 + wk * (workStyle === 'chainsaw' ? 0.16 : 0.12) + sawVib,
    -Math.cos(p - 0.24) * (0.062 + fastRatio * 0.058) * m + bt.turnLead * 0.35 + sawStroke * 0.55,
    Math.sin(p - 0.14) * 0.022 * m + cy * 0.05 + bt.turnBank * 0.45
  );
  b.chest.rotation.set(
    (0.018 + fastRatio * 0.082) * m + breath * 0.022 * idle + cy * 0.05 + wk * 0.08 + sawVib,
    -Math.cos(p - 0.30) * (0.084 + fastRatio * 0.075) * m + bt.turnLead * 0.45 + sawStroke * 0.75,
    Math.sin(p - 0.18) * 0.018 * m + cy * 0.04 + bt.turnBank * 0.25
  );
  b.neck.rotation.set(-(0.02 + fastRatio * 0.07) * m - wk * 0.04, Math.cos(p - 0.28) * 0.045 * m + bt.turnLead * 0.35, -bt.turnBank * 0.22);
  b.head.rotation.set(
    -(0.03 + fastRatio * 0.11) * m + wk * 0.14 + Math.sin(st.breathPhase * 0.45) * 0.03 * idle,
    Math.cos(p - 0.32) * 0.055 * m + bt.turnLead * 0.55 + Math.sin(st.breathPhase * 0.33) * 0.12 * idle,
    -Math.sin(p - 0.18) * 0.015 * m - bt.turnBank * 0.28
  );

  // Legs: straight-line human gait FK (zero duck-foot turnout, zero outward splay; refined by World-Space 2-Bone Foot IK)
  const adductL = rig.legAdductL || 0;
  const adductR = rig.legAdductR || 0;
  b.thighL.rotation.set(legL.thighRx * m - wk * 0.14, 0, adductL + wk * 0.022);
  b.shinL.rotation.set(0.04 * idle + legL.shinRx * m + wk * 0.22, 0, 0);
  b.footL.rotation.set(legL.footRx * m - wk * 0.08, 0, 0);

  b.thighR.rotation.set(legR.thighRx * m + wk * 0.12, 0, adductR - wk * 0.022);
  b.shinR.rotation.set(0.04 * idle + legR.shinRx * m + wk * 0.18, 0, 0);
  b.footR.rotation.set(legR.footRx * m - wk * 0.06, 0, 0);

  // Arms: natural hip-to-chest Walk -> Jog -> Run -> Sprint pendulum (damped for built-in chainsaw/handsaw props)
  const wRelaxed = Boolean(rig.isRelaxedArms);
  const armAmp = ud.hasBuiltInTool ? (0.14 + fastRatio * 0.08) : (0.34 + bt.wJog * 0.10 + bt.wRun * 0.22 + bt.wSprint * 0.34);
  const armRearBias = ud.hasBuiltInTool ? 0.0 : (0.02 + bt.wJog * 0.04 + bt.wRun * 0.06 + bt.wSprint * 0.07);
  const elbowBase = ud.hasBuiltInTool
    ? 0.14
    : (wRelaxed ? (0.14 + bt.wJog * 0.46 + bt.wRun * 0.64 + bt.wSprint * 0.76) : (0.20 + bt.wJog * 0.54 + bt.wRun * 0.72 + bt.wSprint * 0.86));
  const elbowAmp = ud.hasBuiltInTool ? 0.10 : (0.22 + fastRatio * 0.04);
  const sideClear = ud.hasBuiltInTool ? 0.04 : (wRelaxed ? (0.03 + fastRatio * 0.04) : -(rig.armDropZ ?? 0.52) + 0.06 + fastRatio * 0.04);
  const armWaveL = Math.cos(p - 0.16);
  const armLagL = Math.cos(p - 0.48);
  const fwdL = smoothstep(-0.15, 0.95, -armWaveL);
  const fwdR = smoothstep(-0.15, 0.95, armWaveL);

  const lArmX = (armWaveL * armAmp + armRearBias) * m * (1 - cy * 0.65) - cy * 0.52 + wk * (workStyle === 'chainsaw' ? -0.18 + sawVib * 1.4 : sawStroke * 0.5);
  const rArmX = (-armWaveL * armAmp + armRearBias) * m * (1 - cy * 0.85) - cy * 1.15 + wk * (workStyle === 'chainsaw' ? -0.14 + sawVib * 1.6 : -0.20 + sawStroke * 1.35);

  b.upperArmL.rotation.set(lArmX, -(0.02 + fwdL * (0.04 + fastRatio * 0.09)) * m, sideClear);
  b.foreArmL.rotation.set(-(elbowBase + smoothstep(-0.5, 0.9, -armLagL) * elbowAmp * m + cy * 0.65), 0, 0);
  b.handL.rotation.set(-0.04, 0, 0);

  b.upperArmR.rotation.set(rArmX, (0.02 + fwdR * (0.04 + fastRatio * 0.09)) * m, -sideClear);
  b.foreArmR.rotation.set(-(elbowBase + smoothstep(-0.5, 0.9, armLagL) * elbowAmp * m + cy * 0.95 + Math.abs(sawStroke) * 0.5), 0, 0);
  b.handR.rotation.set(-0.04 + sawVib * 2.0, 0, 0);

  // Enforce anatomical shoulder rotation limits & 3D hip-clearance guard
  applyShoulderRotationConstraints(rig);

  // Analytical 2-Bone Foot-Locking IK (locks stance boots to live terrain height & slope)
  _ikParams.uL = uL;
  _ikParams.uR = uR;
  _ikParams.btState = bt;
  _ikParams.jumpY = 0;
  _ikParams.inWater = inWater;
  _ikParams.getGroundHeight = opts.getGroundHeight || null;
  _ikParams.rootYaw = Number.isFinite(opts.rootYaw) ? opts.rootYaw : workerRoot.rotation.y;
  applyTwoBoneFootIK(rig, st.ikState, clampedDt, _ikParams);
}

export function updatePlayerModelAnimation(playerModel, dt, moving, walkPhase, chopSwing, elapsed = 0, options = null) {
  const ud = playerModel?.userData;
  if (!ud) return;

  if (ud.glbActive && ud.glbAnimGroup) {
    const anim = ud.glbAnimGroup;
    const hasMixer = Boolean(ud.glbMixer);
    if (hasMixer) {
      ud.glbMixer.update(dt);
      let desiredKey = 'idle';
      if (chopSwing > 0 && ud.glbActions.chop) desiredKey = 'chop';
      else if (moving && ud.glbActions.walk) desiredKey = 'walk';
      else if (ud.glbActions.idle) desiredKey = 'idle';

      if (desiredKey !== ud.glbActiveClipKey && ud.glbActions[desiredKey]) {
        const prevAction = ud.glbActiveClipKey ? ud.glbActions[ud.glbActiveClipKey] : null;
        const nextAction = ud.glbActions[desiredKey];
        if (nextAction !== prevAction) {
          nextAction.reset();
          if (desiredKey === 'chop') nextAction.timeScale = 1.35;
          else if (desiredKey === 'walk') nextAction.timeScale = 1.15;
          else nextAction.timeScale = 1.0;
          nextAction.play();
          if (prevAction) prevAction.crossFadeTo(nextAction, 0.16, false);
        }
        ud.glbActiveClipKey = desiredKey;
      }

      if (chopSwing > 0 && !ud.glbActions.chop) {
        const p = Math.sin(chopSwing * Math.PI);
        anim.rotation.x = p * 0.24;
        anim.rotation.y = -p * 0.32;
        anim.position.y = p * 0.05;
      } else {
        const damp = 1 - Math.exp(-14 * dt);
        anim.rotation.x += (0 - anim.rotation.x) * damp;
        anim.rotation.y += (0 - anim.rotation.y) * damp;
        anim.rotation.z += (0 - anim.rotation.z) * damp;
        anim.position.y += (0 - anim.position.y) * damp;
        anim.scale.set(1, 1, 1);
      }
      return;
    }

    if (ud.glbRig) {
      // Full 5-State Locomotion Blend Tree (Idle -> Walk -> Jog -> Run -> Sprint),
      // Direction-Change Turn Banking, Start/Brake Momentum & 2-Bone Foot-Locking IK (Zero GC)
      const rig = ud.glbRig;
      const b = rig.bones;
      const st = rig.state;
      if (!st.blendTree) st.blendTree = createBlendTreeState();
      if (!st.ikState) st.ikState = createFootIKState();

      const clampedDt = Math.min(dt, 0.05);
      const carryCount = options ? (options.carryCount ?? ud.carryCount ?? 0) : (ud.carryCount || 0);
      const carryRatio = options ? (options.carryRatio || 0) : 0;
      const loadWeight = options ? (options.loadWeight ?? carryRatio) : carryRatio;
      const speedMult = options ? (options.speedMult || 1) : 1;
      const targetRun = options ? Math.max(0, Math.min(1, options.runBlend || 0)) : 0;
      const slopePitch = options ? (options.slopePitch || 0) : 0;
      const inWater = Boolean(options && options.inWater);
      const chopHitStop = options ? (options.chopHitStop || 0) : 0;
      const isBucking = Boolean(options && options.isBucking);
      const pullingCart = Boolean(options && options.pullingCart);
      const distMoved = options && Number.isFinite(options.distMoved) ? options.distMoved : null;
      const rawSpeed = options && Number.isFinite(options.speed)
        ? options.speed
        : (distMoved !== null && clampedDt > 0.0001 ? distMoved / clampedDt : (moving ? (4.0 + targetRun * 4.8) : 0));
      const yawRate = options && Number.isFinite(options.yawRate) ? options.yawRate : 0;
      const accelForward = options && Number.isFinite(options.accelForward) ? options.accelForward : 0;
      const braking = options && Number.isFinite(options.braking) ? options.braking : 0;

      anim.position.set(0, 0, 0);
      anim.rotation.set(0, 0, 0);
      anim.scale.set(1, 1, 1);

      // Smoothly filtered speed & 5-state Blend Tree weights (Idle / Walk / Jog / Run / Sprint)
      st.speedSmooth = (st.speedSmooth || 0) + (rawSpeed - (st.speedSmooth || 0)) * (1 - Math.exp(-10.0 * clampedDt));
      const activelyMoving = moving || st.speedSmooth > 0.20;
      const moveRate = activelyMoving ? 10.5 : 8.5;
      st.moveBlend += ((activelyMoving ? 1 : 0) - st.moveBlend) * (1 - Math.exp(-moveRate * clampedDt));
      if (st.moveBlend < 0.001 && !activelyMoving) st.moveBlend = 0;

      const runGoal = activelyMoving ? targetRun : 0;
      st.runBlend = (st.runBlend || 0) + (runGoal - (st.runBlend || 0)) * (1 - Math.exp(-7.5 * clampedDt));
      if (st.runBlend < 0.001 && runGoal <= 0) st.runBlend = 0;

      const bt = updateLocomotionBlendTree(st.blendTree, clampedDt, st.speedSmooth, loadWeight, yawRate, accelForward, braking);
      const wWalk = bt.wWalk;
      const wJog = bt.wJog;
      const wRun = bt.wRun;
      const wSprint = bt.wSprint;
      const rb = Math.min(1, wJog * 0.38 + wRun * 0.72 + wSprint);

      const targetChop = chopSwing > 0 ? smoothstep(0.0, 0.14, chopSwing) : 0;
      const chopRate = chopSwing > 0 ? 26 : 10;
      st.chopBlend += (targetChop - st.chopBlend) * (1 - Math.exp(-chopRate * clampedDt));
      if (st.chopBlend < 0.001 && chopSwing <= 0) st.chopBlend = 0;

      const wantsShoulderCarry = carryCount > 0 && st.chopBlend < 0.25 && !pullingCart;
      const targetCarry = wantsShoulderCarry ? 1 : 0;
      st.carryBlend = (st.carryBlend || 0) + (targetCarry - (st.carryBlend || 0)) * (1 - Math.exp(-9.5 * clampedDt));
      if (st.carryBlend < 0.001 && !wantsShoulderCarry) st.carryBlend = 0;

      const targetPull = pullingCart && st.chopBlend < 0.2 ? 1 : 0;
      st.pullBlend = (st.pullBlend || 0) + (targetPull - (st.pullBlend || 0)) * (1 - Math.exp(-10.0 * clampedDt));
      if (st.pullBlend < 0.001 && !pullingCart) st.pullBlend = 0;

      // Holster axe while carrying timber or pulling handcart
      const holsterAxe = (st.carryBlend > 0.35 || st.pullBlend > 0.35) && st.chopBlend < 0.2;
      if (rig.axeMesh) rig.axeMesh.visible = !holsterAxe;
      if (rig.beltAxeMesh) rig.beltAxeMesh.visible = holsterAxe;
      if (rig.shoulderLogAnchor) rig.shoulderLogAnchor.visible = carryCount > 0;

      // Distance-locked stride cadence with neutral passing-stance rest phase (eliminates Idle <-> Walk stomping)
      if (activelyMoving) {
        const heavyCadence = 1 - loadWeight * 0.24;
        const wadeCadence = inWater ? 0.80 : 1.0;
        if (distMoved !== null && distMoved > 0.0002) {
          const halfStrideLen = getBlendedHalfStride(bt, loadWeight);
          st.phase += (distMoved / Math.max(0.38, halfStrideLen)) * Math.PI;
        } else if (moving) {
          const baseFreq = 5.4 + wJog * 2.4 + wRun * 4.2 + wSprint * 6.0;
          st.phase += clampedDt * (baseFreq * heavyCadence * wadeCadence * Math.max(0.72, Math.min(1.38, speedMult)));
        }
      } else if (st.moveBlend > 0.005 || (1 - bt.wIdle) > 0.005) {
        // Settle gently onto the nearest neutral mid-stance passing phase (u ≈ 0.24 / 0.74) instead of scissor heel-strike
        const nearestRest = Math.round((st.phase - IDLE_REST_PHASE) / Math.PI) * Math.PI + IDLE_REST_PHASE;
        st.phase += (nearestRest - st.phase) * (1 - Math.exp(-6.5 * clampedDt));
      }

      st.breathPhase += clampedDt * (1.85 + st.moveBlend * (1.1 + wJog * 0.9 + wRun * 1.6 + wSprint * 2.4) + loadWeight * 0.65);
      st.idleLookPhase += clampedDt * 0.56;

      // Pure Blend Tree Idle <-> Walk weight (no artificial instant leg kick while velocity is near 0)
      const m = Math.max(0, Math.min(1, 1 - bt.wIdle));
      const idle = Math.max(0, 1 - m);
      const ch = st.chopBlend;
      const cy = st.carryBlend;
      const p = st.phase;
      const sp = Math.sin(p);
      const cp = Math.cos(p);
      const breath = Math.sin(st.breathPhase);
      const shift = Math.sin(elapsed * 0.70);
      const s = rig.scale;

      const TWO_PI = Math.PI * 2;
      const uL = (((p / TWO_PI) % 1) + 1) % 1;
      const uR = (uL + 0.5) % 1;

      // Emit exact heel-strike footstep callbacks (zero timer drift!)
      if (options && typeof options.onFootstep === 'function' && m > 0.26 && (distMoved === null || distMoved > 0.002)) {
        const stepInt = 0.44 * wWalk + 0.70 * wJog + 0.94 * wRun + 1.18 * wSprint + loadWeight * 0.24 + braking * 0.22;
        if (didCrossHeelStrike(st.prevUL, uL)) options.onFootstep('left', Math.max(0.32, stepInt));
        if (didCrossHeelStrike(st.prevUR, uR)) options.onFootstep('right', Math.max(0.32, stepInt));
      }
      st.prevUL = uL;
      st.prevUR = uR;

      const walkRamp = 0.56 + 0.44 * (bt.walkAmp ?? 1);
      const strideScale = walkRamp * (1 - loadWeight * 0.24) * (1 + wJog * 0.12 + wRun * 0.24 + wSprint * 0.36) * (1 - braking * 0.24);
      const wadeLift = inWater ? 0.30 : 0.0;

      // --- 4-Pace Blend Tree Leg FK (refined by 2-Bone Foot-Locking IK at end of pose) ---
      const legL = sampleBlendTreeLeg(uL, bt, strideScale, loadWeight, wadeLift, slopePitch, _gaitLegL);
      const legR = sampleBlendTreeLeg(uR, bt, strideScale, loadWeight, wadeLift, slopePitch, _gaitLegR);

      // --- 1. Pelvis / Hips (Blend Tree Vault/Flight + Turn Banking + Braking Drop) ---
      const idleHipY = rig.hipsRestY + breath * 0.008 * s;
      const analyticalHipOff = computeBlendTreeHipOffset(legL, legR, p, bt, loadWeight);
      const brakeCrouch = braking * -0.038;
      const locoHipY = rig.hipsRestY + (analyticalHipOff + brakeCrouch) * s;
      let hipY = (idleHipY * idle + locoHipY * m) - cy * loadWeight * 0.026 * s;
      let hipX = (shift * 0.014 * idle + Math.sin(p - 0.30) * (0.021 * (1 - rb * 0.38) + loadWeight * 0.010) * m) * s;
      let hipZ = ((0.010 + wJog * 0.014 + wRun * 0.022 + wSprint * 0.030 + bt.accelLean * 0.09) * m) * s;
      let hipRx = 0.010 * idle + (0.016 + wJog * 0.030 + wRun * 0.052 + wSprint * 0.072 + slopePitch * 0.14 + bt.accelLean * 0.34) * m;
      let hipRy = Math.cos(p - 0.16) * (0.056 + wJog * 0.022 + wRun * 0.040 + wSprint * 0.056) * (1 - loadWeight * 0.24) * m;
      let hipRz = shift * 0.016 * idle - Math.sin(p - 0.12) * (0.026 + rb * 0.014 + loadWeight * 0.014) * m + bt.turnBank * 0.56;

      // --- 2. Spine & Chest (Composed Athletic Lean + Crisp Counter-Rotation) ---
      let spineRx =
        (0.015 + breath * 0.014) * idle +
        (0.020 + wJog * 0.045 + wRun * 0.078 + wSprint * 0.110 + Math.cos(p * 2) * (0.008 + rb * 0.014) + slopePitch * 0.20 + bt.accelLean * 0.52) * m +
        cy * (0.058 + loadWeight * 0.095);
      let spineRy = -Math.cos(p - 0.20) * (0.052 + wJog * 0.020 + wRun * 0.036 + wSprint * 0.052) * (1 - loadWeight * 0.24) * m + bt.turnLead * 0.32;
      let spineRz = -shift * 0.014 * idle + Math.sin(p - 0.14) * (0.018 + rb * 0.012) * m + cy * (0.054 + loadWeight * 0.068) + bt.turnBank * 0.44;

      let chestRx =
        (-0.008 + breath * 0.024) * idle +
        (0.012 + wJog * 0.028 + wRun * 0.046 + wSprint * 0.064 + breath * 0.012 + slopePitch * 0.10 + bt.accelLean * 0.26) * m +
        cy * (0.035 + loadWeight * 0.048);
      let chestRy = Math.sin(elapsed * 0.48) * 0.040 * idle - Math.cos(p - 0.24) * (0.068 + wJog * 0.026 + wRun * 0.048 + wSprint * 0.068) * (1 - loadWeight * 0.24) * m + bt.turnLead * 0.42 - cy * 0.07;
      let chestRz = -shift * 0.010 * idle + Math.sin(p - 0.18) * (0.014 + rb * 0.012) * m + cy * (0.048 + loadWeight * 0.058) + bt.turnBank * 0.24;

      // --- 3. Neck & Head (Look-Ahead Turn Lead + Horizon Stabilization) ---
      const lookYaw = (Math.sin(st.idleLookPhase) * 0.17 + Math.sin(st.idleLookPhase * 0.41) * 0.08) * idle;
      const lookPitch = Math.sin(st.idleLookPhase * 0.68) * 0.038 * idle;
      const lookTilt = Math.sin(st.idleLookPhase * 0.52) * 0.032 * idle;

      let neckRx = -(0.012 + wJog * 0.028 + wRun * 0.046 + wSprint * 0.066 + bt.accelLean * 0.20) * m - cy * 0.04;
      let neckRy = lookYaw * 0.35 + Math.cos(p - 0.24) * (0.038 + rb * 0.032) * m + bt.turnLead * 0.38 + cy * 0.05;
      let neckRz = lookTilt * 0.35 - Math.sin(p - 0.16) * 0.012 * m - bt.turnBank * 0.20 - cy * (0.046 + loadWeight * 0.038);

      let headRx = lookPitch - (0.022 + wJog * 0.048 + wRun * 0.078 + wSprint * 0.108 + loadWeight * 0.044 + bt.accelLean * 0.26) * m - cy * 0.03;
      let headRy = lookYaw * 0.65 + Math.cos(p - 0.28) * (0.050 + rb * 0.042) * m + bt.turnLead * 0.58 + cy * 0.06;
      let headRz = lookTilt * 0.65 - Math.sin(p - 0.18) * 0.015 * m - bt.turnBank * 0.28 - cy * (0.052 + loadWeight * 0.048);

      // --- 4. Leg Joints (Straight-Line Human Posture — ZERO Duck-Splay / ZERO Toe-Out) ---
      const brakeKnee = braking * 0.22;
      const adductL = rig.legAdductL || 0;
      const adductR = rig.legAdductR || 0;
      let thighLRx = (-0.020 - cy * loadWeight * 0.06 + shift * 0.018) * idle + (legL.thighRx - cy * loadWeight * 0.05 - braking * 0.08) * m;
      let thighLRy = 0;
      let thighLRz = adductL + cy * 0.008 * m;
      let shinLRx = (0.042 + cy * loadWeight * 0.10 + Math.max(0, -shift) * 0.028) * idle + (legL.shinRx + brakeKnee) * m;
      let footLRx = (-0.018 - cy * loadWeight * 0.035) * idle + legL.footRx * m;

      let thighRRx = (0.024 - cy * loadWeight * 0.06 - shift * 0.018) * idle + (legR.thighRx - cy * loadWeight * 0.05 + braking * 0.06) * m;
      let thighRRy = 0;
      let thighRRz = adductR - cy * 0.008 * m;
      let shinRRx = (0.036 + cy * loadWeight * 0.10 + Math.max(0, shift) * 0.028) * idle + (legR.shinRx + brakeKnee * 0.85) * m;
      let footRRx = (-0.016 - cy * loadWeight * 0.035) * idle + legR.footRx * m;

      // --- 5. Natural Human "Hip-to-Chest" 4-Pace Running Arm Pendulum & Woodsman Axe Carry ---
      // Anatomically verified:
      //   • Rear-biased shoulder swing drives elbow cleanly behind ribs and brings hand smoothly to lower chest (never face!)
      //   • Left ry < 0 & Right ry > 0 create subtle athletic inward convergence on upswing (zero outward chicken-wing flare!)
      //   • Natural ~72°-86° elbow bend during Jog/Run/Sprint accounting for relaxed GLB rest flexion
      const relaxed = Boolean(rig.isRelaxedArms);
      const armDrop = rig.armDropZ ?? 0.62;
      const armWaveL = Math.cos(p - 0.16);
      const armLagL = Math.cos(p - 0.48);
      const denomGait = Math.max(0.001, wWalk + wJog + wRun + wSprint);
      const bw = wWalk / denomGait;
      const bj = wJog / denomGait;
      const br = wRun / denomGait;
      const bs = wSprint / denomGait;

      const fwdSwingL = smoothstep(-0.15, 0.95, -armWaveL);
      const walkArmLRx = armWaveL * 0.34 + 0.02;
      const jogArmLRx = armWaveL * 0.44 + 0.06;
      const runArmLRx = armWaveL * 0.56 + 0.08;
      const sprintArmLRx = armWaveL * 0.68 + 0.09;
      let uArmLRx = (0.020 + breath * 0.016) * idle + (walkArmLRx * bw + jogArmLRx * bj + runArmLRx * br + sprintArmLRx * bs) * m;
      // Subtle inward convergence ONLY on forward upswing (negative ry for Left arm)
      let uArmLRy = -(0.02 * idle + (0.02 + fwdSwingL * (0.04 * bw + 0.09 * bj + 0.13 * br + 0.16 * bs)) * m);
      const baseClearL = relaxed ? (0.030 + rb * 0.048) : (-armDrop + 0.06 + rb * 0.048);
      let uArmLRz = (relaxed ? 0.028 : -armDrop + 0.04) * idle + (baseClearL + Math.max(0, armWaveL) * 0.028 * rb) * m - breath * 0.012 * idle;

      const walkElbowL = (relaxed ? 0.14 : 0.20) + smoothstep(-0.5, 0.9, -armLagL) * 0.24;
      const jogElbowL = (relaxed ? 0.62 : 0.76) + smoothstep(-0.5, 0.9, -armLagL) * 0.20;
      const runElbowL = (relaxed ? 0.78 : 0.94) + smoothstep(-0.5, 0.9, -armLagL) * 0.22;
      const sprintElbowL = (relaxed ? 0.90 : 1.08) + smoothstep(-0.4, 0.9, -armLagL) * 0.24;
      const elbowFlexL = (relaxed ? 0.14 : 0.20) * idle + (walkElbowL * bw + jogElbowL * bj + runElbowL * br + sprintElbowL * bs) * m;
      let fArmLRx = -elbowFlexL * (relaxed ? 0.96 : 0.74);
      let fArmLRy = relaxed ? (-fwdSwingL * (0.04 * bj + 0.06 * br + 0.08 * bs) * m) : (-elbowFlexL * 0.45);
      let fArmLRz = 0;
      let handLRx = -0.04 * idle + (-0.04 - Math.sin(p - 0.65) * (0.08 * bw + 0.06 * bj + 0.05 * br + 0.04 * bs)) * m;
      let handLRy = 0;
      let handLRz = 0;

      // Right arm: balanced athletic opposition while steadying the 1-handed woodsman axe cleanly beside the right ribs
      const armWaveR = -armWaveL;
      const armLagR = -armLagL;
      const fwdSwingR = smoothstep(-0.15, 0.95, -armWaveR);
      const walkArmRRx = armWaveR * 0.25 - 0.04;
      const jogArmRRx = armWaveR * 0.34 + 0.01;
      const runArmRRx = armWaveR * 0.44 + 0.03;
      const sprintArmRRx = armWaveR * 0.54 + 0.04;
      let uArmRRx = ((relaxed ? -0.06 : -0.10) + breath * 0.014) * idle + (walkArmRRx * bw + jogArmRRx * bj + runArmRRx * br + sprintArmRRx * bs) * m;
      // Subtle inward convergence ONLY on forward upswing (positive ry for Right arm, milder so axe clears chest)
      let uArmRRy = (0.02 * idle + (0.01 + fwdSwingR * (0.03 * bw + 0.06 * bj + 0.09 * br + 0.11 * bs)) * m);
      const baseClearR = relaxed ? -(0.038 + rb * 0.052) : (armDrop - 0.06 - rb * 0.052);
      let uArmRRz = (relaxed ? -0.032 : armDrop - 0.04) * idle + (baseClearR - Math.max(0, armWaveR) * 0.028 * rb) * m + breath * 0.012 * idle;

      const walkElbowR = (relaxed ? 0.24 : 0.30) + smoothstep(-0.5, 0.9, -armLagR) * 0.18;
      const jogElbowR = (relaxed ? 0.56 : 0.70) + smoothstep(-0.5, 0.9, -armLagR) * 0.16;
      const runElbowR = (relaxed ? 0.70 : 0.86) + smoothstep(-0.5, 0.9, -armLagR) * 0.18;
      const sprintElbowR = (relaxed ? 0.80 : 0.98) + smoothstep(-0.4, 0.9, -armLagR) * 0.20;
      const elbowFlexR = (relaxed ? 0.24 : 0.30) * idle + (walkElbowR * bw + jogElbowR * bj + runElbowR * br + sprintElbowR * bs) * m;
      let fArmRRx = -elbowFlexR * (relaxed ? 0.96 : 0.74);
      let fArmRRy = relaxed ? (fwdSwingR * (0.03 * bj + 0.05 * br + 0.06 * bs) * m) : (elbowFlexR * 0.45);
      let fArmRRz = 0;
      // Steady axe wrist so blade tracks smoothly forward-downward outside right thigh without wobbling
      let handRRx = (-0.04 + breath * 0.016) * idle + ((-0.03 + Math.sin(p - 0.65) * 0.06) * bw + (-0.10 - cp * 0.03) * bj + (-0.16 - cp * 0.04) * br + (-0.22 - cp * 0.05) * bs) * m;
      let handRRy = (0.01) * idle + (-0.03 * bj - 0.05 * br - 0.07 * bs) * m;
      let handRRz = (-0.01) * idle + (-0.02 * bj - 0.04 * br - 0.06 * bs) * m;

      // --- 5B. Shoulder Timber Carry Overlay (heaving & steadying logs cleanly on right shoulder) ---
      if (cy > 0.001) {
        const carrySway = Math.sin(p) * 0.045 * m + breath * 0.025 * idle;

        const cUArmRRx = -1.24 + carrySway;
        const cUArmRRy = relaxed ? 0.06 : 0.22;
        const cUArmRRz = relaxed ? -0.14 : 0.12;
        const cFArmRRx = relaxed ? -1.42 : -1.18;
        const cFArmRRy = relaxed ? 0.12 : 0.52;
        const cFArmRRz = relaxed ? -0.06 : 0.18;
        const cHandRRx = -0.26;
        const cHandRRz = -0.16;

        const cUArmLRx = (relaxed ? -0.52 : -1.14) - carrySway * 0.55;
        const cUArmLRy = relaxed ? -0.28 : -0.68;
        const cUArmLRz = relaxed ? 0.14 : -0.34;
        const cFArmLRx = relaxed ? -0.92 : -1.04;
        const cFArmLRy = relaxed ? -0.36 : -0.82;
        const cFArmLRz = relaxed ? 0.04 : -0.14;
        const cHandLRx = -0.18;
        const cHandLRz = 0.12;

        uArmRRx = uArmRRx * (1 - cy) + cUArmRRx * cy;
        uArmRRy = uArmRRy * (1 - cy) + cUArmRRy * cy;
        uArmRRz = uArmRRz * (1 - cy) + cUArmRRz * cy;
        fArmRRx = fArmRRx * (1 - cy) + cFArmRRx * cy;
        fArmRRy = fArmRRy * (1 - cy) + cFArmRRy * cy;
        fArmRRz = fArmRRz * (1 - cy) + cFArmRRz * cy;
        handRRx = handRRx * (1 - cy) + cHandRRx * cy;
        handRRz = handRRz * (1 - cy) + cHandRRz * cy;

        uArmLRx = uArmLRx * (1 - cy) + cUArmLRx * cy;
        uArmLRy = uArmLRy * (1 - cy) + cUArmLRy * cy;
        uArmLRz = uArmLRz * (1 - cy) + cUArmLRz * cy;
        fArmLRx = fArmLRx * (1 - cy) + cFArmLRx * cy;
        fArmLRy = fArmLRy * (1 - cy) + cFArmLRy * cy;
        fArmLRz = fArmLRz * (1 - cy) + cFArmLRz * cy;
        handLRx = handLRx * (1 - cy) + cHandLRx * cy;
        handLRz = handLRz * (1 - cy) + cHandLRz * cy;

        if (rig.shoulderLogAnchor) {
          rig.shoulderLogAnchor.position.y = (0.19 - Math.abs(sp) * 0.018 * m + breath * 0.008) * s;
          rig.shoulderLogAnchor.rotation.set(
            -0.14 + Math.cos(p * 2) * 0.025 * m,
            0.06 + sp * 0.03 * m,
            0.08 - sp * 0.035 * m
          );
        }
      }

      // --- 5C. Handcart Pulling Pose Overlay (axe holstered on left hip; both hands reach cleanly down-and-back gripping the cart T-bar handle) ---
      const pl = st.pullBlend || 0;
      if (pl > 0.001) {
        const pullLean = (0.20 + loadWeight * 0.18) * m + 0.09 * idle;
        hipY -= (0.038 + loadWeight * 0.026) * s * pl;
        spineRx += pullLean * pl;
        chestRx += (0.10 + loadWeight * 0.08) * pl;
        // Counter-pitch neck & head so lumberjack watches the trail ahead while leaning into the cart load
        neckRx -= (0.08 + loadWeight * 0.05) * pl;
        headRx -= (0.16 + loadWeight * 0.09) * pl;

        // Grounded driving knee bend & firm stance
        shinLRx += (0.12 + loadWeight * 0.06) * pl;
        shinRRx += (0.12 + loadWeight * 0.06) * pl;

        // Bilateral rear-down reach: both arms extend straight back & slightly inward so both fists lock onto the horizontal T-handle at z=-0.38m, y=0.80m
        const pullSway = Math.sin(p) * 0.028 * m;
        const pArmX = 0.44 + pullSway + loadWeight * 0.05;
        const pForeX = -0.14;
        const pHandX = 0.24;

        uArmLRx = uArmLRx * (1 - pl) + pArmX * pl;
        uArmLRy = uArmLRy * (1 - pl) + (-0.12) * pl;
        uArmLRz = uArmLRz * (1 - pl) + (relaxed ? -0.16 : -0.68) * pl;
        fArmLRx = fArmLRx * (1 - pl) + pForeX * pl;
        fArmLRy = fArmLRy * (1 - pl) + (-0.06) * pl;
        fArmLRz = fArmLRz * (1 - pl) + (-0.06) * pl;
        handLRx = handLRx * (1 - pl) + pHandX * pl;

        uArmRRx = uArmRRx * (1 - pl) + pArmX * pl;
        uArmRRy = uArmRRy * (1 - pl) + (0.12) * pl;
        uArmRRz = uArmRRz * (1 - pl) + (relaxed ? 0.16 : 0.68) * pl;
        fArmRRx = fArmRRx * (1 - pl) + pForeX * pl;
        fArmRRy = fArmRRy * (1 - pl) + (0.06) * pl;
        fArmRRz = fArmRRz * (1 - pl) + (0.06) * pl;
        handRRx = handRRx * (1 - pl) + pHandX * pl;
      }

      // --- 6. Crisp One-Handed Right-Arm Axe Chop (Standing Tree Felling & Ground-Trunk Bucking) ---
      if (ch > 0.001) {
        const t = 1 - Math.max(0, Math.min(1, chopSwing));
        // Coiled right-shoulder windup -> snappy 1-handed whip-down strike -> brief hit-stop tremor -> smooth follow-through
        const windUp = smoothstep(0.0, 0.30, t) * (1 - smoothstep(0.32, 0.48, t));
        const strike = smoothstep(0.30, 0.52, t) * (1 - smoothstep(0.66, 1.0, t));
        const impactTremor = chopHitStop > 0 ? Math.sin(elapsed * 96) * 0.065 : 0;

        if (isBucking) {
          // One-handed overhead vertical log-bucking chop down into felled trunk; left arm counterbalances freely
          hipY += (windUp * 0.032 - strike * 0.11) * s * ch;
          hipZ += (strike * 0.05 - windUp * 0.025) * s * ch;
          spineRx += (-windUp * 0.18 + strike * 0.48) * ch;
          chestRx += (-windUp * 0.18 + strike * 0.32) * ch;
          spineRy += (-windUp * 0.18 + strike * 0.16) * ch;
          chestRy += (-windUp * 0.22 + strike * 0.20) * ch;
          headRx += (windUp * 0.14 + strike * 0.20) * ch;

          thighLRx += (-0.12 - strike * 0.22) * ch;
          shinLRx += (0.14 + strike * 0.34) * ch;
          thighRRx += (0.12 - strike * 0.14) * ch;
          shinRRx += (0.14 + strike * 0.28) * ch;

          // Right arm drives the axe overhead & straight down
          const bArmR = -windUp * 2.38 + strike * 0.76 - 0.30;
          const bElbowR = 0.82 * windUp + 0.14 * strike + 0.16;

          uArmRRx = uArmRRx * (1 - ch) + bArmR * ch;
          uArmRRy = uArmRRy * (1 - ch) + (-0.16 * windUp + 0.20 * strike) * ch;
          uArmRRz = uArmRRz * (1 - ch) + ((relaxed ? 0.14 : 0.46) + windUp * 0.12 - strike * 0.12) * ch;
          fArmRRx = fArmRRx * (1 - ch) + (-bElbowR * (relaxed ? 0.94 : 0.66)) * ch;
          fArmRRy = fArmRRy * (1 - ch) + (relaxed ? 0.10 : bElbowR * 0.56) * ch;
          handRRx = handRRx * (1 - ch) + (-0.34 * windUp + 0.56 * strike + impactTremor) * ch;

          // Left arm stays relaxed at left side as natural balance brace (never grips axe)
          const bArmL = 0.14 + windUp * 0.18 + strike * 0.26;
          const bElbowL = 0.34 + strike * 0.18;
          uArmLRx = uArmLRx * (1 - ch) + bArmL * ch;
          uArmLRy = uArmLRy * (1 - ch) + (0.06 - strike * 0.10) * ch;
          uArmLRz = uArmLRz * (1 - ch) + (-armDrop - 0.14 - strike * 0.14) * ch;
          fArmLRx = fArmLRx * (1 - ch) + (-bElbowL * (relaxed ? 0.92 : 0.66)) * ch;
          fArmLRy = fArmLRy * (1 - ch) + (relaxed ? -0.06 : -bElbowL * 0.45) * ch;
          handLRx = handLRx * (1 - ch) + (-0.06) * ch;
        } else {
          // One-handed diagonal standing tree felling chop (right hand swings axe, left arm counterbalances freely)
          hipY += (windUp * 0.026 - strike * 0.078) * s * ch;
          hipZ += (strike * 0.05 - windUp * 0.03) * s * ch;
          hipRy += (-windUp * 0.24 + strike * 0.24) * ch;

          spineRx += (-windUp * 0.14 + strike * 0.28) * ch;
          spineRy += (-windUp * 0.38 + strike * 0.36) * ch;
          chestRx += (-windUp * 0.14 + strike * 0.22) * ch;
          chestRy += (-windUp * 0.46 + strike * 0.44) * ch;
          chestRz += (windUp * 0.10 - strike * 0.14) * ch;

          headRy += (windUp * 0.52 - strike * 0.48) * ch;
          headRx += (windUp * 0.12 - strike * 0.14) * ch;

          thighLRx += (-0.10 - strike * 0.18) * ch;
          thighLRz += 0.018 * ch;
          shinLRx += (0.14 + strike * 0.24) * ch;
          footLRx += (-0.05 - strike * 0.08) * ch;
          thighRRx += (0.12 + strike * 0.16) * ch;
          thighRRz += -0.018 * ch;
          shinRRx += (0.10 + strike * 0.20) * ch;
          footRRx += (-0.06 - strike * 0.06) * ch;

          // Right arm: athletic 1-handed diagonal slash from right-high to center-low
          const chopUArmRRx = -windUp * 2.02 + strike * 0.68 - 0.36;
          const chopUArmRRy = -windUp * 0.34 + strike * 0.46;
          const chopUArmRRz = (relaxed ? 0.22 : 0.56) + windUp * (relaxed ? 0.26 : 0.16) - strike * (relaxed ? 0.20 : 0.24);
          const chopElbowR = 0.86 * windUp + 0.14 * strike + 0.18;

          uArmRRx = uArmRRx * (1 - ch) + chopUArmRRx * ch;
          uArmRRy = uArmRRy * (1 - ch) + chopUArmRRy * ch;
          uArmRRz = uArmRRz * (1 - ch) + chopUArmRRz * ch;
          fArmRRx = fArmRRx * (1 - ch) + (-chopElbowR * (relaxed ? 0.95 : 0.66)) * ch;
          fArmRRy = fArmRRy * (1 - ch) + (relaxed ? 0.14 : chopElbowR * 0.62) * ch;
          handRRx = handRRx * (1 - ch) + (-0.34 * windUp + 0.54 * strike + impactTremor) * ch;
          handRRz = handRRz * (1 - ch) + (-0.16 * windUp + 0.14 * strike) * ch;

          // Left arm: stays freely at left side for natural athletic counterbalance (zero cross-chest grip)
          const chopUArmLRx = 0.10 + windUp * 0.14 + strike * 0.34;
          const chopUArmLRy = 0.06 - strike * 0.14;
          const chopUArmLRz = -armDrop - 0.12 - windUp * 0.06 - strike * 0.18;
          const chopElbowL = 0.30 + windUp * 0.10 + strike * 0.20;

          uArmLRx = uArmLRx * (1 - ch) + chopUArmLRx * ch;
          uArmLRy = uArmLRy * (1 - ch) + chopUArmLRy * ch;
          uArmLRz = uArmLRz * (1 - ch) + chopUArmLRz * ch;
          fArmLRx = fArmLRx * (1 - ch) + (-chopElbowL * (relaxed ? 0.92 : 0.66)) * ch;
          fArmLRy = fArmLRy * (1 - ch) + (relaxed ? -0.06 : -chopElbowL * 0.42) * ch;
          handLRx = handLRx * (1 - ch) + (-0.06) * ch;
        }
      }

      // --- 7. Expressive Human Gestures (Phím 1-4), Jump & Subtle Idle Micro-Gestures ---
      const action = options ? options.action : null;
      const actionT = options ? (options.actionT || 0) : 0;
      const jumpY = options ? (options.jumpY || 0) : 0;
      const actionEnv = action ? (smoothstep(0.0, 0.16, actionT) * (1 - smoothstep(0.80, 1.0, actionT))) : 0;

      // Subtle natural idle micro-behaviors (wipe brow / inspect axe edge) when standing still
      if (!action && ch < 0.05 && cy < 0.05 && idle > 0.78) {
        const cycle = elapsed % 11.0;
        if (cycle > 4.6 && cycle < 6.8) {
          const wt = (cycle - 4.6) / 2.2;
          const wEnv = smoothstep(0.0, 0.25, wt) * (1 - smoothstep(0.75, 1.0, wt)) * idle;
          const swipe = Math.sin(wt * Math.PI * 2.5) * 0.18;
          uArmLRx += (-1.18 + swipe * 0.2) * wEnv;
          uArmLRz += ((relaxed ? 0.22 : 0.46) + swipe * 0.22) * wEnv;
          fArmLRx += -(relaxed ? 1.12 : 0.85) * wEnv;
          fArmLRy += -(relaxed ? 0.28 : 0.72) * wEnv;
          headRx += -0.06 * wEnv;
          headRy += swipe * 0.30 * wEnv;
        } else if (cycle > 8.2 && cycle < 10.2) {
          // Glances down at the steel axe blade and shifts grip slightly
          const at = (cycle - 8.2) / 2.0;
          const aEnv = smoothstep(0.0, 0.25, at) * (1 - smoothstep(0.75, 1.0, at)) * idle;
          uArmRRx += -0.36 * aEnv;
          fArmRRx += -0.44 * aEnv;
          handRRy += Math.sin(at * Math.PI * 2) * 0.22 * aEnv;
          headRx += 0.16 * aEnv;
          headRy += -0.22 * aEnv;
        }
      }

      // Interactive manual human gesture overlays (1: Vẫy tay, 2: Vươn vai, 3: Ăn mừng, 4: Chỉ hướng)
      if (action === 'wave' && actionEnv > 0.001) {
        const waveOsc = Math.sin(actionT * Math.PI * 6.0);
        hipX += 0.032 * s * actionEnv;
        hipRz += 0.04 * actionEnv;
        chestRz += -0.09 * actionEnv;
        chestRy += 0.12 * actionEnv;
        headRz += 0.13 * actionEnv;
        headRy += (0.14 + waveOsc * 0.07) * actionEnv;
        headRx += -0.06 * actionEnv;
        uArmLRx = uArmLRx * (1 - actionEnv) + (-0.42) * actionEnv;
        uArmLRz = uArmLRz * (1 - actionEnv) + ((relaxed ? 1.82 : 1.24) + waveOsc * 0.26) * actionEnv;
        fArmLRx = fArmLRx * (1 - actionEnv) + (-0.36) * actionEnv;
        fArmLRy = fArmLRy * (1 - actionEnv) + ((relaxed ? -0.16 : -0.35) + waveOsc * 0.52) * actionEnv;
        handLRz = handLRz * (1 - actionEnv) + (waveOsc * 0.28) * actionEnv;
        // Keep axe safely relaxed at right side
        uArmRRx = uArmRRx * (1 - actionEnv) + (-0.08) * actionEnv;
        fArmRRx = fArmRRx * (1 - actionEnv) + (-0.22) * actionEnv;
      } else if (action === 'stretch' && actionEnv > 0.001) {
        const stretchPeak = Math.sin(actionT * Math.PI);
        spineRx += -0.18 * stretchPeak * actionEnv;
        chestRx += -0.24 * stretchPeak * actionEnv;
        headRx += -0.22 * stretchPeak * actionEnv;
        hipY += 0.036 * stretchPeak * s * actionEnv;
        uArmLRx = uArmLRx * (1 - actionEnv) + (-2.28) * actionEnv;
        uArmLRz = uArmLRz * (1 - actionEnv) + ((relaxed ? 0.30 : 0.48) + stretchPeak * 0.26) * actionEnv;
        fArmLRx = fArmLRx * (1 - actionEnv) + (-0.34) * actionEnv;
        uArmRRx = uArmRRx * (1 - actionEnv) + (-2.12) * actionEnv;
        uArmRRz = uArmRRz * (1 - actionEnv) + ((relaxed ? -0.30 : -0.48) - stretchPeak * 0.26) * actionEnv;
        fArmRRx = fArmRRx * (1 - actionEnv) + (-0.36) * actionEnv;
      } else if (action === 'cheer' && actionEnv > 0.001) {
        const pump = Math.abs(Math.sin(actionT * Math.PI * 3.0));
        hipY += (pump * 0.095 - 0.02) * s * actionEnv;
        chestRx += -0.16 * pump * actionEnv;
        headRx += -0.18 * pump * actionEnv;
        shinLRx += (1 - pump) * 0.14 * actionEnv;
        shinRRx += (1 - pump) * 0.14 * actionEnv;
        uArmLRx = uArmLRx * (1 - actionEnv) + (-1.98 - pump * 0.54) * actionEnv;
        uArmLRz = uArmLRz * (1 - actionEnv) + ((relaxed ? 0.36 : 0.65) + pump * 0.22) * actionEnv;
        fArmLRx = fArmLRx * (1 - actionEnv) + (-0.42 + pump * 0.26) * actionEnv;
        uArmRRx = uArmRRx * (1 - actionEnv) + (-1.92 - pump * 0.48) * actionEnv;
        uArmRRz = uArmRRz * (1 - actionEnv) + ((relaxed ? -0.36 : -0.65) - pump * 0.22) * actionEnv;
        fArmRRx = fArmRRx * (1 - actionEnv) + (-0.42 + pump * 0.24) * actionEnv;
      } else if (action === 'command' && actionEnv > 0.001) {
        // Confident woodsman pointing / directing gesture forward
        const pulse = Math.sin(actionT * Math.PI * 3.0) * 0.08;
        hipRy += -0.16 * actionEnv;
        spineRx += 0.08 * actionEnv;
        chestRy += 0.24 * actionEnv;
        headRy += -0.06 * actionEnv;
        headRx += -0.05 * actionEnv;
        // Left arm extends cleanly forward pointing toward horizon
        uArmLRx = uArmLRx * (1 - actionEnv) + (-1.48 + pulse) * actionEnv;
        uArmLRy = uArmLRy * (1 - actionEnv) + (relaxed ? 0.12 : 0.08) * actionEnv;
        uArmLRz = uArmLRz * (1 - actionEnv) + (relaxed ? 0.16 : -0.08) * actionEnv;
        fArmLRx = fArmLRx * (1 - actionEnv) + (-0.12 + pulse * 0.5) * actionEnv;
        fArmLRy = fArmLRy * (1 - actionEnv) + 0 * actionEnv;
        handLRx = handLRx * (1 - actionEnv) + (-0.06) * actionEnv;
        // Right hand braces axe comfortably downward
        uArmRRx = uArmRRx * (1 - actionEnv) + (0.10) * actionEnv;
        fArmRRx = fArmRRx * (1 - actionEnv) + (-0.28) * actionEnv;
      } else if (action === 'unload' && actionEnv > 0.001) {
        const dip = Math.sin(actionT * Math.PI);
        hipY -= dip * 0.24 * s * actionEnv;
        spineRx += dip * 0.44 * actionEnv;
        chestRx += dip * 0.18 * actionEnv;
        thighLRx -= dip * 0.36 * actionEnv;
        shinLRx += dip * 0.58 * actionEnv;
        thighRRx -= dip * 0.36 * actionEnv;
        shinRRx += dip * 0.58 * actionEnv;
      }

      // Midair Jump Pose (athletic knee tuck & arm balance)
      if (jumpY > 0.02) {
        const air = Math.min(1, jumpY / 0.85);
        thighLRx = thighLRx * (1 - air) + (-0.72) * air;
        shinLRx = shinLRx * (1 - air) + (0.98) * air;
        footLRx = footLRx * (1 - air) + 0.24 * air;
        thighRRx = thighRRx * (1 - air) + (-0.42) * air;
        shinRRx = shinRRx * (1 - air) + (0.74) * air;
        footRRx = footRRx * (1 - air) + 0.24 * air;
        uArmLRz += (relaxed ? 0.42 : 0.52) * air;
        uArmRRz -= (relaxed ? 0.38 : 0.48) * air;
        spineRx += 0.14 * air;
      }

      // Apply full biomechanical pose to 17-bone skeleton
      b.hips.position.set(hipX, hipY, hipZ);
      b.hips.rotation.set(hipRx, hipRy, hipRz);

      b.spine.rotation.set(spineRx, spineRy, spineRz);
      b.chest.rotation.set(chestRx, chestRy, chestRz);
      b.neck.rotation.set(neckRx, neckRy, neckRz);
      b.head.rotation.set(headRx, headRy, headRz);

      b.thighL.rotation.set(thighLRx, thighLRy, thighLRz);
      b.shinL.rotation.set(shinLRx, 0, 0);
      if (b.footL) b.footL.rotation.set(footLRx, 0, 0);

      b.thighR.rotation.set(thighRRx, thighRRy, thighRRz);
      b.shinR.rotation.set(shinRRx, 0, 0);
      if (b.footR) b.footR.rotation.set(footRRx, 0, 0);

      b.upperArmL.rotation.set(uArmLRx, uArmLRy, uArmLRz);
      b.foreArmL.rotation.set(fArmLRx, fArmLRy, fArmLRz);
      if (b.handL) b.handL.rotation.set(handLRx, handLRy, handLRz);

      b.upperArmR.rotation.set(uArmRRx, uArmRRy, uArmRRz);
      b.foreArmR.rotation.set(fArmRRx, fArmRRy, fArmRRz);
      if (b.handR) b.handR.rotation.set(handRRx, handRRy, handRRz);

      // Enforce anatomical shoulder rotation limits & 3D hip-clearance guard (prevents arm-to-hip clipping & mesh distortion)
      applyShoulderRotationConstraints(rig);

      // Apply Analytical 2-Bone Foot-Locking IK onto stance feet (locks boots to world terrain with zero foot sliding)
      const activeRootYaw = (options && Number.isFinite(options.rootYaw)) ? options.rootYaw : playerModel.rotation.y;
      _ikParams.uL = uL;
      _ikParams.uR = uR;
      _ikParams.btState = bt;
      _ikParams.jumpY = jumpY;
      _ikParams.inWater = inWater;
      _ikParams.getGroundHeight = options ? options.getGroundHeight : null;
      _ikParams.rootYaw = activeRootYaw;
      applyTwoBoneFootIK(rig, st.ikState, clampedDt, _ikParams);
      return;
    }

    // Fallback for pre-skinned GLB without embedded AnimationClips
    const damp = 1 - Math.exp(-14 * dt);
    const action = options ? options.action : null;
    const actionT = options ? (options.actionT || 0) : 0;
    let targetY = Math.sin(elapsed * 2.4) * 0.018;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetScaleY = 1 + Math.sin(elapsed * 2.4) * 0.012;

    if (moving) {
      targetY = Math.abs(Math.sin(walkPhase)) * 0.12;
      targetRotX = 0.085;
      targetRotZ = Math.sin(walkPhase) * 0.075;
      targetScaleY = 1 - Math.abs(Math.sin(walkPhase)) * 0.025;
    }
    if (chopSwing > 0) {
      const p = Math.sin(chopSwing * Math.PI);
      targetRotX += p * 0.28;
      targetRotY = -p * 0.42;
      targetRotZ += p * 0.14;
      targetY += p * 0.06;
    } else if (action) {
      const env = Math.sin(actionT * Math.PI);
      if (action === 'cheer') {
        targetY += Math.abs(Math.sin(actionT * Math.PI * 3)) * 0.24;
        targetScaleY = 1 + env * 0.07;
      } else if (action === 'wave') {
        targetRotZ += Math.sin(actionT * Math.PI * 6) * 0.14 * env;
      } else if (action === 'stretch') {
        targetRotX -= env * 0.16;
        targetScaleY = 1 + env * 0.08;
      } else if (action === 'command') {
        targetRotX += env * 0.18;
      }
    }

    anim.position.y += (targetY - anim.position.y) * damp;
    anim.rotation.x += (targetRotX - anim.rotation.x) * damp;
    anim.rotation.y += (targetRotY - anim.rotation.y) * damp;
    anim.rotation.z += (targetRotZ - anim.rotation.z) * damp;
    anim.scale.y += (targetScaleY - anim.scale.y) * damp;
    return;
  }

  // Fallback / Classic procedural humanoid limb animation (with full gestures & jump)
  const { leftLeg, rightLeg, leftArm, rightArm } = ud;
  if (!leftLeg || !rightLeg || !leftArm || !rightArm) return;
  const action = options ? options.action : null;
  const actionT = options ? (options.actionT || 0) : 0;
  const jumpY = options ? (options.jumpY || 0) : 0;

  const swing = moving ? Math.sin(walkPhase) * 0.65 : 0;
  leftLeg.rotation.x = jumpY > 0.04 ? -0.55 : swing;
  rightLeg.rotation.x = jumpY > 0.04 ? 0.35 : -swing;
  leftArm.rotation.z = 0;
  rightArm.rotation.z = 0;

  if (chopSwing > 0) {
    leftArm.rotation.x = -swing * 0.5;
    rightArm.rotation.x = -Math.sin(chopSwing * Math.PI) * 1.45;
  } else if (action === 'wave') {
    const env = Math.sin(actionT * Math.PI);
    leftArm.rotation.x = -2.5 * env;
    leftArm.rotation.z = (0.35 + Math.sin(actionT * Math.PI * 6) * 0.35) * env;
    rightArm.rotation.x = swing * 0.4;
  } else if (action === 'stretch') {
    const env = Math.sin(actionT * Math.PI);
    leftArm.rotation.x = -2.65 * env;
    rightArm.rotation.x = -2.65 * env;
    leftArm.rotation.z = 0.4 * env;
    rightArm.rotation.z = -0.4 * env;
  } else if (action === 'cheer') {
    const pump = Math.abs(Math.sin(actionT * Math.PI * 3));
    leftArm.rotation.x = -2.1 - pump * 0.65;
    rightArm.rotation.x = -2.1 - pump * 0.65;
    leftArm.rotation.z = 0.3;
    rightArm.rotation.z = -0.3;
  } else if (action === 'command') {
    const env = Math.sin(actionT * Math.PI);
    leftArm.rotation.x = -1.55 * env;
    rightArm.rotation.x = 0.25 * env;
  } else {
    leftArm.rotation.x = -swing * 0.7 + (moving ? 0 : Math.sin(elapsed * 2.2) * 0.06);
    rightArm.rotation.x = swing * 0.7 - (moving ? 0 : Math.sin(elapsed * 2.2) * 0.06);
  }
}

export function createPetModel(petId) {
  const g = new THREE.Group();
  if (petId === 'none') return g;
  g.add(makeContactShadow(0.55, 0.3));

  if (petId === 'shiba') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0xea8c38, roughness: 0.78 });
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.68), furMat);
    body.position.y = 0.38;
    body.castShadow = true;
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.56), creamMat);
    belly.position.y = 0.25;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.36), furMat);
    head.position.set(0, 0.58, 0.38);
    head.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.16), creamMat);
    snout.position.set(0, 0.52, 0.6);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.14), furMat);
    tail.position.set(0, 0.56, -0.34);
    tail.rotation.x = 0.45;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.12), collarMat);
    collar.position.set(0, 0.46, 0.26);

    const legGeo = markShared(new THREE.BoxGeometry(0.12, 0.26, 0.12));
    const earGeo = markShared(new THREE.ConeGeometry(0.08, 0.16, 4));
    [-0.14, 0.14].forEach((lx) => {
      [-0.22, 0.22].forEach((lz) => {
        const leg = new THREE.Mesh(legGeo, creamMat);
        leg.position.set(lx, 0.13, lz);
        g.add(leg);
      });
      const ear = new THREE.Mesh(earGeo, furMat);
      ear.position.set(lx, 0.8, 0.36);
      g.add(ear);
    });
    g.add(body, belly, head, snout, tail, collar);
  } else if (petId === 'cyber_cat') {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.82 });
    const neonMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.62), metalMat);
    body.position.y = 0.4;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.34), metalMat);
    head.position.set(0, 0.6, 0.34);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.08), neonMat);
    visor.position.set(0, 0.62, 0.5);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), neonMat);
    core.position.set(0, 0.42, 0);
    const earGeo = markShared(new THREE.ConeGeometry(0.07, 0.18, 4));
    [-0.12, 0.12].forEach((x) => {
      const ear = new THREE.Mesh(earGeo, neonMat);
      ear.position.set(x, 0.82, 0.34);
      g.add(ear);
    });
    g.add(body, head, visor, core);
  } else if (petId === 'harbor_hawk') {
    const featherMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65, flatShading: true });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 6), featherMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.65;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), whiteMat);
    head.position.set(0, 1.72, 0.3);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.7, 0.45);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.28), featherMat);
    wingL.position.set(-0.42, 1.68, 0);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.28), featherMat);
    wingR.position.set(0.42, 1.68, 0);
    g.userData = { wingL, wingR, isFlyer: true };
    g.add(body, head, beak, wingL, wingR);
  }

  return g;
}

// Shared Tree Assets by kind (24 harvestable trees share just 3 geometry/material sets!)
const sharedTreeAssets = {};
function getTreeAssets(kind) {
  if (sharedTreeAssets[kind]) return sharedTreeAssets[kind];
  const isRedwood = kind === 'redwood';
  const trunkH = isRedwood ? 3.4 : kind === 'oak' ? 2.2 : 2.1;
  const trunkR = isRedwood ? 0.48 : 0.28;

  const barkMat = markShared(new THREE.MeshStandardMaterial({
    map: markShared(getBarkTexture(isRedwood ? '#7c2d12' : '#5c3d28')),
    roughness: 0.9,
    metalness: 0.02,
    flatShading: true
  }));

  const rootGeo = markShared(new THREE.CylinderGeometry(trunkR, trunkR * 1.45, 0.45, 7));
  const trunkGeo = markShared(new THREE.CylinderGeometry(trunkR * 0.72, trunkR, trunkH, 7));

  let canopyDefs = [];
  if (kind === 'oak') {
    const leafMat = markShared(new THREE.MeshStandardMaterial({ color: 0x3f8f3b, roughness: 0.82, flatShading: true }));
    canopyDefs = [
      { geo: markShared(new THREE.DodecahedronGeometry(1.35, 0)), mat: leafMat, pos: [0, 3.0, 0], ry: 0 },
      { geo: markShared(new THREE.DodecahedronGeometry(0.95, 0)), mat: leafMat, pos: [-0.75, 2.5, 0.45], ry: 0 },
      { geo: markShared(new THREE.DodecahedronGeometry(0.95, 0)), mat: leafMat, pos: [0.75, 2.6, -0.4], ry: 0 }
    ];
  } else {
    const m1 = markShared(new THREE.MeshStandardMaterial({ color: isRedwood ? 0x166534 : 0x15803d, roughness: 0.84, flatShading: true }));
    const m2 = markShared(new THREE.MeshStandardMaterial({ color: isRedwood ? 0x15803d : 0x22c55e, roughness: 0.84, flatShading: true }));
    const tiers = isRedwood ? 4 : 3;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const radius = (isRedwood ? 2.0 : 1.45) * (1 - t * 0.52);
      const height = isRedwood ? 2.2 : 1.75;
      canopyDefs.push({
        geo: markShared(new THREE.ConeGeometry(radius, height, 7)),
        mat: i % 2 === 0 ? m1 : m2,
        pos: [0, (isRedwood ? 2.8 : 1.9) + i * (isRedwood ? 1.25 : 1.0), 0],
        ry: i * 0.6
      });
    }
  }

  sharedTreeAssets[kind] = { barkMat, rootGeo, trunkGeo, trunkH, canopyDefs };
  return sharedTreeAssets[kind];
}

export function createTreeModel(kind = 'pine', variant = 0, options = {}) {
  const assets = getTreeAssets(kind);
  const g = new THREE.Group();

  // Persistent natural cut stump revealed whenever the tree is felled
  const stump = new THREE.Group();
  const stumpBase = new THREE.Mesh(assets.rootGeo, assets.barkMat);
  stumpBase.position.y = 0.2;
  const stumpTop = new THREE.Mesh(
    markShared(new THREE.CylinderGeometry(0.32, 0.36, 0.45, 8)),
    [assets.barkMat, markShared(new THREE.MeshStandardMaterial({ color: 0xe6c396, roughness: 0.78 })), assets.barkMat]
  );
  stumpTop.position.y = 0.32;
  stump.add(stumpBase, stumpTop);
  stump.visible = false;
  g.add(stump);

  // Felling pivot anchored near stump base so trees tip over realistically when chopped down
  const fallPivot = new THREE.Group();
  fallPivot.position.y = 0.22;
  const canopy = new THREE.Group();
  canopy.position.y = -0.22;
  fallPivot.add(canopy);

  const fallback = new THREE.Group();

  const rootFlare = new THREE.Mesh(assets.rootGeo, assets.barkMat);
  rootFlare.position.y = 0.22;
  fallback.add(rootFlare);

  const trunk = new THREE.Mesh(assets.trunkGeo, assets.barkMat);
  trunk.position.y = assets.trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  fallback.add(trunk);

  for (const def of assets.canopyDefs) {
    const part = new THREE.Mesh(def.geo, def.mat);
    part.position.set(def.pos[0], def.pos[1], def.pos[2]);
    part.rotation.y = def.ry;
    part.castShadow = true;
    fallback.add(part);
  }
  canopy.add(fallback);

  const glbHolder = new THREE.Group();
  canopy.add(glbHolder);
  const url = options.modelUrl || (kind === 'oak'
    ? FOREST_ASSETS.oakGithub
    : FOREST_ASSETS.pineGithub);
  const targetHeight = options.targetHeight || (kind === 'redwood' ? 11.4 : kind === 'oak' ? 8.4 : 9.2);
  mountNormalizedGlb(glbHolder, url, { targetHeight, yaw: 0, placeholder: fallback });

  g.add(fallPivot);
  g.userData = { fallPivot, canopy, trunk, stump, glbHolder };
  return g;
}

export function createVehicleModel(type = 'forklift', lowSpec = false) {
  const g = new THREE.Group();
  g.add(makeContactShadow(2.2, 0.4));

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92, metalness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.85 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.7 });
  const glassMat = lowSpec
    ? new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.58 })
    : new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55 });

  function addWheel(x, y, z, r = 0.42, w = 0.28) {
    const wg = new THREE.Group();
    wg.position.set(x, y, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 10), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, w + 0.02, 8), rimMat);
    rim.rotation.z = Math.PI / 2;
    wg.add(tire, rim);
    g.add(wg);
    return wg;
  }

  if (type === 'forklift') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42, metalness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.72, 2.3), bodyMat);
    body.position.set(0, 0.68, -0.1);
    body.castShadow = true;
    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.62, 0.65), steelMat);
    counterweight.position.set(0, 0.74, -1.05);
    const cabinFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.15, 1.2), steelMat);
    cabinFrame.position.set(0, 1.55, -0.2);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 1.3), bodyMat);
    roof.position.set(0, 2.18, -0.2);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.18), steelMat);
    mast.position.set(0, 1.35, 1.15);
    const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.1), rimMat);
    forkL.position.set(-0.32, 0.28, 1.65);
    const forkR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.1), rimMat);
    forkR.position.set(0.32, 0.28, 1.65);
    g.add(body, counterweight, cabinFrame, roof, mast, forkL, forkR);
    addWheel(-0.82, 0.42, 0.72, 0.42);
    addWheel(0.82, 0.42, 0.72, 0.42);
    addWheel(-0.82, 0.36, -0.82, 0.36);
    addWheel(0.82, 0.36, -0.82, 0.36);
  } else if (type === 'pickup') {
    const paint = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.28, metalness: 0.55 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.68, 4.1), paint);
    chassis.position.set(0, 0.72, 0);
    chassis.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.85, 1.65), paint);
    cabin.position.set(0, 1.45, 0.35);
    cabin.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.62, 1.52), glassMat);
    windshield.position.set(0, 1.48, 0.42);
    const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.14, 1.6), steelMat);
    bedFloor.position.set(0, 1.05, -1.15);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.8 });
    [-0.65, 0.65].forEach((hx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), lightMat);
      hl.position.set(hx, 0.76, 2.06);
      g.add(hl);
    });
    g.add(chassis, cabin, windshield, bedFloor);
    addWheel(-0.96, 0.46, 1.25, 0.46, 0.3);
    addWheel(0.96, 0.46, 1.25, 0.46, 0.3);
    addWheel(-0.96, 0.46, -1.25, 0.46, 0.3);
    addWheel(0.96, 0.46, -1.25, 0.46, 0.3);
  } else {
    const paint = lowSpec
      ? new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.22, metalness: 0.65 })
      : new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.18, metalness: 0.68, clearcoat: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.62, 4.35), paint);
    body.position.set(0, 0.68, 0);
    body.castShadow = true;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.25, 1.45), paint);
    hood.position.set(0, 0.96, 1.2);
    hood.rotation.x = 0.09;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.62, 1.95), glassMat);
    canopy.position.set(0, 1.24, -0.05);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 0.34), steelMat);
    spoiler.position.set(0, 1.32, -1.96);
    const ledBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.09, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.0 })
    );
    ledBar.position.set(0, 0.72, 2.18);
    g.add(body, hood, canopy, spoiler, ledBar);
    addWheel(-1.0, 0.46, 1.35, 0.46, 0.32);
    addWheel(1.0, 0.46, 1.35, 0.46, 0.32);
    addWheel(-1.0, 0.46, -1.35, 0.46, 0.32);
    addWheel(1.0, 0.46, -1.35, 0.46, 0.32);
  }

  return g;
}

export function createSawmillModel() {
  const g = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.06 });
  const apronMat = new THREE.MeshStandardMaterial({ map: markShared(getTravertineTexture(5, 3)), roughness: 0.78 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.72 });
  const timberMat = new THREE.MeshStandardMaterial({ map: markShared(getTimberTexture()), roughness: 0.68 });
  const warmGlowMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.95, roughness: 0.25 });

  const apron = new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.14, 12.4), apronMat);
  apron.position.y = 0.07;
  apron.receiveShadow = true;
  g.add(apron);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.36, 11), concreteMat);
  slab.position.y = 0.18;
  slab.receiveShadow = true;
  g.add(slab);

  // Open-air Sawmill Yard: low industrial safety bollards at the 4 slab corners (no roof obstructing view)
  const bollardGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.85, 8);
  const bollardCapMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42, metalness: 0.3 });
  const bollardCapGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 8);
  [[-7.2, -4.6], [7.2, -4.6], [-7.2, 4.6], [7.2, 4.6]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(bollardGeo, steelMat);
    post.position.set(px, 0.78, pz);
    const cap = new THREE.Mesh(bollardCapGeo, bollardCapMat);
    cap.position.set(px, 1.15, pz);
    g.add(post, cap);
    if (pz > 0) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), warmGlowMat);
      lamp.position.set(px, 1.28, pz);
      g.add(lamp);
    }
  });

  // Decorative seasoned timber rack beside rear corner
  const rackPostGeo = new THREE.BoxGeometry(0.18, 1.4, 0.18);
  [[-6.8, 4.1], [-4.8, 4.1]].forEach(([rx, rz]) => {
    const rp = new THREE.Mesh(rackPostGeo, steelMat);
    rp.position.set(rx, 0.9, rz);
    g.add(rp);
  });
  const rackBeam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.85), timberMat);
  rackBeam.position.set(-5.8, 0.72, 4.1);
  g.add(rackBeam);

  const hopper = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.35, 1.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4, metalness: 0.5 })
  );
  hopper.position.set(-6.0, 1.12, 0);
  hopper.castShadow = true;
  g.add(hopper);

  const proceduralSawGroup = new THREE.Group();
  proceduralSawGroup.name = 'ProceduralSawMachine';

  const belt = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.55, 2.1), steelMat);
  belt.position.set(0, 0.9, 0);
  belt.castShadow = true;
  proceduralSawGroup.add(belt);

  const sawHousing = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 2.8, 2.9),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.42, metalness: 0.35 })
  );
  sawHousing.position.set(-0.5, 2.2, 0);
  sawHousing.castShadow = true;
  proceduralSawGroup.add(sawHousing);

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.92 })
  );
  sawBlade.rotation.x = Math.PI / 2;
  sawBlade.position.set(-0.5, 1.55, 1.15);
  proceduralSawGroup.add(sawBlade);
  g.add(proceduralSawGroup);

  const glbSawGroup = new THREE.Group();
  glbSawGroup.name = 'SawmillConveyorPressGlb';
  glbSawGroup.position.set(0, 0.36, 0);
  glbSawGroup.visible = false;
  g.add(glbSawGroup);

  // Pre-pooled Animated Conveyor Feed: logs ride in from hopper -> pass through press -> emerge as planks
  const conveyorAnimGroup = new THREE.Group();
  conveyorAnimGroup.name = 'SawmillConveyorAnim';
  const conveyorItems = [];
  const ITEM_SLOTS = 6;
  for (let i = 0; i < ITEM_SLOTS; i++) {
    const carrier = new THREE.Group();
    const logMesh = createLogMesh(i % 3 === 0);
    logMesh.scale.setScalar(1.22);
    logMesh.traverse((c) => { if (c.isMesh) c.castShadow = false; });

    const plankBundle = new THREE.Group();
    const p1 = createPlankMesh();
    p1.castShadow = false;
    p1.position.set(0, 0.06, -0.17);
    const p2 = createPlankMesh();
    p2.castShadow = false;
    p2.position.set(0, 0.06, 0.17);
    const p3 = createPlankMesh();
    p3.castShadow = false;
    p3.position.set(0, 0.18, 0);
    plankBundle.add(p1, p2, p3);
    plankBundle.scale.setScalar(1.16);
    plankBundle.visible = false;

    carrier.add(logMesh, plankBundle);
    conveyorAnimGroup.add(carrier);
    conveyorItems.push({
      carrier,
      logMesh,
      plankBundle,
      offset: i / ITEM_SLOTS,
      lastX: -5
    });
  }

  // Moving metallic conveyor belt cleats gliding across the rollers (y = 1.69, z = -0.20)
  const cleatGeo = markShared(new THREE.BoxGeometry(0.11, 0.036, 1.24));
  const cleatMat = markShared(new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.65
  }));
  const conveyorSlats = [];
  const SLAT_COUNT = 14;
  for (let i = 0; i < SLAT_COUNT; i++) {
    const slat = new THREE.Mesh(cleatGeo, cleatMat);
    slat.position.set(-4.6 + (i / SLAT_COUNT) * 9.2, 1.70, -0.20);
    conveyorAnimGroup.add(slat);
    conveyorSlats.push(slat);
  }
  g.add(conveyorAnimGroup);

  const outTable = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 2.6), timberMat);
  outTable.position.set(5.8, 0.72, 0);
  outTable.castShadow = true;
  g.add(outTable);

  // Pre-pooled Sawmill visual buffer (6 logs) & output slots (4 pallets + 8 planks)
  const visualBufferGroup = new THREE.Group();
  visualBufferGroup.position.set(-6.0, 1.95, 0);
  for (let i = 0; i < 6; i++) {
    const log = createLogMesh(false);
    log.scale.setScalar(0.58);
    log.position.set((i % 2 - 0.5) * 0.45, Math.floor(i / 2) * 0.24, 0);
    log.visible = false;
    visualBufferGroup.add(log);
  }
  g.add(visualBufferGroup);

  const visualOutputGroup = new THREE.Group();
  visualOutputGroup.position.set(5.8, 1.2, 0);
  const palletSlots = [];
  for (let i = 0; i < 4; i++) {
    const pal = createPalletCrate();
    pal.scale.setScalar(0.65);
    pal.position.set(-0.6 + (i % 2) * 1.1, Math.floor(i / 2) * 0.55, 0);
    pal.visible = false;
    visualOutputGroup.add(pal);
    palletSlots.push(pal);
  }
  const plankSlots = [];
  for (let i = 0; i < 8; i++) {
    const pl = createPlankMesh();
    pl.position.set((i % 2 - 0.5) * 0.9, 0.08 + Math.floor(i / 2) * 0.14, 0.7);
    pl.visible = false;
    visualOutputGroup.add(pl);
    plankSlots.push(pl);
  }
  g.add(visualOutputGroup);

  // Pre-built Tier 2 & Tier 3 grounded industrial upgrades (Open-air friendly, zero floating roof parts)
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.72 });
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 5.2, 8), siloMat);
  silo.position.set(-4.6, 2.96, -3.5);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.2, 6), siloMat);
  pipe.rotation.z = Math.PI / 3;
  pipe.position.set(-2.7, 3.25, -2.0);
  tier2Group.add(silo, pipe);
  g.add(tier2Group);

  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.85 });
  const trimGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.75 });
  const rearSolar = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 1.8), solarMat);
  rearSolar.position.set(2.2, 1.55, -4.1);
  rearSolar.rotation.x = 0.42;
  const solarLegL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), steelMat);
  solarLegL.position.set(-0.6, 0.96, -4.1);
  const solarLegR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), steelMat);
  solarLegR.position.set(5.0, 0.96, -4.1);
  const slabGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.14, 0.22), trimGoldMat);
  slabGoldTrim.position.set(0, 0.42, 5.45);
  tier3Group.add(rearSolar, solarLegL, solarLegR, slabGoldTrim);
  g.add(tier3Group);

  g.userData = {
    sawBlade,
    proceduralSawGroup,
    glbSawGroup,
    glbSawLoaded: false,
    conveyorItems,
    conveyorSlats,
    conveyorPhase: 0,
    conveyorSpeed: 0.18,
    pressRecoil: 0,
    visualBufferGroup,
    visualOutputGroup,
    palletSlots,
    plankSlots,
    tier2Group,
    tier3Group
  };

  attachGlbToSawmill(g);
  return g;
}

// Cached Sawmill Conveyor Press GLB loader (single draw call, shared GPU buffers)
const SAWMILL_GLB_URL = `/models/${encodeURIComponent('Meshy_AI_Üstünde_press_makinesi_olan_bir_konveyor_20251112_texture.glb')}`;
let sawmillGlbPromise = null;
const _sawBox = new THREE.Box3();
const _sawSize = new THREE.Vector3();
const _sawCenter = new THREE.Vector3();

function loadSawmillGlbTemplate(url = SAWMILL_GLB_URL) {
  if (!sawmillGlbPromise) {
    sawmillGlbPromise = new Promise((resolve, reject) => {
      const loader = getGltfLoader();
      loader.load(
        url,
        (gltf) => {
          try {
            const rawScene = gltf.scene || gltf.scenes?.[0];
            if (!rawScene) {
              reject(new Error('File GLB máy cưa không chứa scene hợp lệ.'));
              return;
            }

            rawScene.updateMatrixWorld(true);
            _sawBox.setFromObject(rawScene);
            _sawBox.getSize(_sawSize);

            // Fit conveyor length along X to ~9.6 units (cleanly spanning between hopper and output table)
            const rawLen = Math.max(_sawSize.x, _sawSize.z, 0.001);
            const targetLen = 9.6;
            const scaleFactor = targetLen / rawLen;
            rawScene.scale.multiplyScalar(scaleFactor);
            rawScene.updateMatrixWorld(true);

            _sawBox.setFromObject(rawScene);
            _sawBox.getCenter(_sawCenter);

            // Ground bottom cleanly at local y = 0 (sits on top of concrete slab at y = 0.36)
            rawScene.position.x -= _sawCenter.x;
            rawScene.position.z -= _sawCenter.z;
            rawScene.position.y -= _sawBox.min.y;
            rawScene.updateMatrixWorld(true);

            rawScene.traverse((child) => {
              if (!child.isMesh) return;
              child.castShadow = false;
              child.receiveShadow = false;
              child.frustumCulled = true;
              if (child.geometry) {
                child.geometry.computeBoundingBox();
                child.geometry.computeBoundingSphere();
                markShared(child.geometry);
              }
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              for (const m of mats) {
                if (!m) continue;
                markShared(m);
                if (m.map) {
                  m.map.colorSpace = THREE.SRGBColorSpace;
                  markShared(m.map);
                }
                if (m.emissiveMap) {
                  m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                  markShared(m.emissiveMap);
                }
                if (typeof m.envMapIntensity === 'number') {
                  m.envMapIntensity = 0.85;
                }
                m.needsUpdate = true;
              }
            });

            const template = new THREE.Group();
            template.name = 'SawmillConveyorPressTemplate';
            template.add(rawScene);
            resolve(template);
          } catch (err) {
            reject(err);
          }
        },
        undefined,
        (err) => reject(err)
      );
    }).catch((err) => {
      sawmillGlbPromise = null;
      throw err;
    });
  }
  return sawmillGlbPromise;
}

export function attachGlbToSawmill(sawmillGroup, url = SAWMILL_GLB_URL) {
  const ud = sawmillGroup?.userData;
  if (!ud?.glbSawGroup) return Promise.resolve({ ok: false });

  return loadSawmillGlbTemplate(url)
    .then((template) => {
      while (ud.glbSawGroup.children.length > 0) {
        ud.glbSawGroup.remove(ud.glbSawGroup.children[0]);
      }
      const instance = template.clone(true);
      ud.glbSawGroup.add(instance);
      ud.glbSawGroup.visible = true;
      if (ud.proceduralSawGroup) {
        ud.proceduralSawGroup.visible = false;
      }
      ud.glbSawLoaded = true;
      return { ok: true };
    })
    .catch((err) => ({ ok: false, error: err?.message || 'Không thể tải mô hình máy cưa GLB.' }));
}

export function createHarborStructure() {
  // Clean Wooden Fishing Boat Mooring Pier ("Bờ đi tàu cá neo đậu") — full port deferred
  const g = new THREE.Group();
  const deckMat = new THREE.MeshStandardMaterial({ map: markShared(getTimberTexture('#b87c44', '#855223')), roughness: 0.78 });
  const pilingMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.55 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd6b37c, roughness: 0.88 });

  // Simple central wooden walkway pier extending from coastal embankment into calm bay
  const pier = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.45, 13.0), deckMat);
  pier.position.set(0, 0.38, 6.2);
  pier.receiveShadow = true;
  g.add(pier);

  const pileGeo = new THREE.CylinderGeometry(0.24, 0.28, 3.2, 7);
  for (const px of [-4.6, 0, 4.6]) {
    for (const pz of [1.0, 6.2, 11.4]) {
      const pile = new THREE.Mesh(pileGeo, pilingMat);
      pile.position.set(px, -1.0, pz);
      g.add(pile);
    }
  }

  // Timber mooring bollards & rope guard along pier edges
  const bollardGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.65, 8);
  for (const px of [-4.7, 4.7]) {
    for (const pz of [2.2, 6.4, 10.6]) {
      const b = new THREE.Mesh(bollardGeo, bollardMat);
      b.position.set(px, 0.85, pz);
      g.add(b);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8.6, 6), ropeMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(px, 0.95, 6.4);
    g.add(rail);
  }

  // Keep empty tier containers for evolution hook compatibility
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  g.add(tier2Group, tier3Group);

  g.userData = { ship: null, trolley: null, hoistedCrate: null, lhBeacon: null, tier2Group, tier3Group };
  return g;
}

export function syncBuildingEvolution(sawmill, harbor, sawTier, harborTier) {
  if (sawmill?.userData?.tier2Group) sawmill.userData.tier2Group.visible = sawTier >= 2;
  if (sawmill?.userData?.tier3Group) sawmill.userData.tier3Group.visible = sawTier >= 3;
  if (harbor?.userData?.tier2Group) harbor.userData.tier2Group.visible = harborTier >= 2;
  if (harbor?.userData?.tier3Group) harbor.userData.tier3Group.visible = harborTier >= 3;
}

export function createFisheryIslandModel() {
  const land = new THREE.Group();
  const mesh = (parent, geometry, color, x, y, z) => {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  mesh(land, new THREE.CylinderGeometry(7.5, 8.5, 1.15, 12), '#e6c785', 0, -0.12, -3);
  mesh(land, new THREE.CylinderGeometry(6, 7, 0.5, 12), '#559578', 0, 0.44, -3);
  mesh(land, new THREE.BoxGeometry(3.8, 2, 2.8), '#f4e4c0', -2, 1.7, -3);
  const roof = mesh(land, new THREE.ConeGeometry(3, 1.3, 4), '#ab4d34', -2, 3.3, -3);
  roof.rotation.y = Math.PI / 4;

  const pier = new THREE.Group();
  land.add(pier);
  land.userData.pier = pier;
  mesh(pier, new THREE.BoxGeometry(3, 0.25, 6), '#97704a', 2, 0.35, 5);
  for (const x of [0.75, 3.25]) {
    for (const z of [3, 5, 7]) {
      mesh(pier, new THREE.CylinderGeometry(0.13, 0.13, 1.4, 8), '#59402b', x, 0.12, z);
    }
  }
  return land;
}

export function createFishingBoatModel(index = 0) {
  const g = new THREE.Group();
  const hullColor = index % 2 === 0 ? 0xf8fafc : 0x0ea5e9;
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.75, 3.6),
    new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.45 })
  );
  hull.position.y = 0.35;
  hull.castShadow = true;
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(1.78, 0.2, 3.68),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
  );
  trim.position.y = 0.65;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.95, 1.25),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
  );
  cabin.position.set(0, 1.15, 0.3);
  cabin.castShadow = true;
  g.add(hull, trim, cabin);
  return g;
}

const WORKER_ROLE_GLB = {
  porter: FOREST_ASSETS.forestryWorker,
  yard: FOREST_ASSETS.forestryWorker,
  lumberjack: FOREST_ASSETS.forestryWorker,
  harvester: FOREST_ASSETS.forestryWorker,
  artisan_woman: FOREST_ASSETS.forestryWorker,
  artisan_trader: FOREST_ASSETS.forestryWorker,
  artisan_dock: FOREST_ASSETS.forestryWorker
};

export function createWorkerModel(role = 'lumberjack') {
  const root = new THREE.Group();
  const palette = role === 'lumberjack' || role === 'harvester'
    ? { shirt: 0x16a34a, pants: 0x1e3a8a, hat: 0xf59e0b, accent: 0x84cc16 }
    : { shirt: 0x0284c7, pants: 0x0f172a, hat: 0xfacc15, accent: 0x38bdf8 };

  // Lightweight fallback body hidden automatically as soon as forestry_worker.glb loads
  const fallback = createPlayerModel(palette, 0);
  fallback.scale.setScalar(0.86);
  root.add(fallback);

  // Visible 3D timber log held in front/shoulder when worker is carrying logs (uses Meshy timber_log_single.glb)
  const carriedLog = new THREE.Group();
  carriedLog.position.set(0, 1.18, 0.36);
  const carriedFallback = new THREE.Group();
  const logMesh = createLogMesh(false);
  logMesh.scale.set(1.32, 1.12, 1.12);
  carriedFallback.add(logMesh);
  carriedLog.add(carriedFallback);
  const carriedGlbWrap = new THREE.Group();
  carriedGlbWrap.rotation.y = Math.PI / 2;
  carriedGlbWrap.position.y = -0.18;
  carriedLog.add(carriedGlbWrap);
  mountNormalizedGlb(carriedGlbWrap, FOREST_ASSETS.timberLogSingle, {
    targetFootprint: 1.45,
    yaw: 0,
    placeholder: carriedFallback
  });
  carriedLog.visible = false;
  root.add(carriedLog);

  const shadow = makeContactShadow(0.75, 0.32);
  root.add(shadow);

  root.userData = {
    rightArm: fallback.userData.rightArm,
    leftArm: fallback.userData.leftArm,
    backLogs: fallback.userData.backLogs,
    carriedLog,
    fallbackBody: fallback,
    glbMixer: null,
    glbHolder: null,
    autoRig: null,
    glbLoaded: false,
    bones: null,
    walkBobPhase: Math.random() * Math.PI * 2,
    carryBlend: 0,
    setCarrying(active) {
      carriedLog.visible = Boolean(active);
    },
    updateAnim(dt, isMoving, speedMult = 1, workerState = 'walk', stateProgress = 0) {
      const damp = 1 - Math.exp(-10 * dt);
      const targetCarry = carriedLog.visible ? 1 : 0;
      this.carryBlend += (targetCarry - this.carryBlend) * damp;

      if (isMoving) {
        this.walkBobPhase += dt * 9.5 * speedMult;
      }

      if (this.glbMixer) {
        this.glbMixer.update(isMoving ? dt * (1.15 * speedMult) : dt * 0.08);
      }

      // Expressive 13-bone animation for auto-rigged forestry_worker.glb
      const rig = this.autoRig;
      if (rig?.bones) {
        const b = rig.bones;
        const p = this.walkBobPhase;
        const c = this.carryBlend;
        const moveAmp = isMoving ? 1 : 0;
        const legSwing = Math.sin(p) * 0.62 * moveAmp;
        const armSwing = Math.sin(p) * 0.48 * moveAmp * (1 - c * 0.85);
        const bob = Math.abs(Math.cos(p)) * 0.065 * moveAmp;

        let spineX = isMoving ? 0.06 - c * 0.1 : 0;
        let chestY = Math.sin(p) * 0.08 * moveAmp;
        let headY = 0;
        let armLX = armSwing;
        let armLZ = 0.08;
        let foreLX = -0.18;
        let armRX = -armSwing;
        let armRZ = -0.08;
        let foreRX = -0.18;
        let hipY = rig.hipsRestY + bob;
        let thighLX = -legSwing;
        let thighRX = legSwing;
        const shinLX = Math.max(0, Math.sin(p + 0.5)) * 0.55 * moveAmp;
        const shinRX = Math.max(0, -Math.sin(p + 0.5)) * 0.55 * moveAmp;

        if (workerState === 'pickup') {
          const bend = Math.sin(Math.min(1, stateProgress) * Math.PI);
          spineX = bend * 0.58;
          hipY = rig.hipsRestY - bend * 0.16;
          armLX = -bend * 0.95;
          armRX = -bend * 0.95;
          foreLX = -bend * 0.35;
          foreRX = -bend * 0.35;
          thighLX = -bend * 0.32;
          thighRX = -bend * 0.32;
        } else if (workerState === 'drop') {
          const heave = Math.sin(Math.min(1, stateProgress) * Math.PI);
          spineX = heave * 0.36;
          armLX = -0.75 - heave * 0.55;
          armRX = -0.75 - heave * 0.55;
        } else if (workerState === 'rest') {
          const env = Math.sin(Math.min(1, stateProgress) * Math.PI);
          const wipe = Math.sin(stateProgress * Math.PI * 2.5);
          headY = Math.sin(stateProgress * Math.PI * 2) * 0.38 * env;
          armRX = -1.25 * env;
          armRZ = (-0.28 + wipe * 0.24) * env;
          foreRX = -1.05 * env;
        } else if (c > 0.02) {
          armLX = THREE.MathUtils.lerp(armLX, -0.82, c);
          armRX = THREE.MathUtils.lerp(armRX, -0.82, c);
          armLZ = THREE.MathUtils.lerp(armLZ, -0.22, c);
          armRZ = THREE.MathUtils.lerp(armRZ, 0.22, c);
          foreLX = THREE.MathUtils.lerp(foreLX, -0.68, c);
          foreRX = THREE.MathUtils.lerp(foreRX, -0.68, c);
        }

        b.hips.position.y += (hipY - b.hips.position.y) * damp;
        b.spine.rotation.x += (spineX - b.spine.rotation.x) * damp;
        b.chest.rotation.y += (chestY - b.chest.rotation.y) * damp;
        b.head.rotation.y += (headY - b.head.rotation.y) * damp;
        b.upperArmL.rotation.x += (armLX - b.upperArmL.rotation.x) * damp;
        b.upperArmL.rotation.z += (armLZ - b.upperArmL.rotation.z) * damp;
        b.foreArmL.rotation.x += (foreLX - b.foreArmL.rotation.x) * damp;
        b.upperArmR.rotation.x += (armRX - b.upperArmR.rotation.x) * damp;
        b.upperArmR.rotation.z += (armRZ - b.upperArmR.rotation.z) * damp;
        b.foreArmR.rotation.x += (foreRX - b.foreArmR.rotation.x) * damp;
        applyShoulderRotationConstraints(rig);
        b.thighL.rotation.x += (thighLX - b.thighL.rotation.x) * damp;
        b.shinL.rotation.x += (shinLX - b.shinL.rotation.x) * damp;
        b.thighR.rotation.x += (thighRX - b.thighR.rotation.x) * damp;
        b.shinR.rotation.x += (shinRX - b.shinR.rotation.x) * damp;
      } else if (this.bones) {
        // Expressive articulated limb & torso gestures for skinned GLB workers
        const bones = this.bones;
        const c = this.carryBlend;
        if (workerState === 'pickup') {
          const bend = Math.sin(Math.min(1, stateProgress) * Math.PI);
          if (bones.spine) bones.spine.rotation.x += bend * 0.42;
          if (bones.spine1) bones.spine1.rotation.x += bend * 0.25;
          if (bones.leftArm) bones.leftArm.rotation.x += bend * 0.72;
          if (bones.rightArm) bones.rightArm.rotation.x += bend * 0.72;
          if (bones.leftForeArm) bones.leftForeArm.rotation.x += -bend * 0.45;
          if (bones.rightForeArm) bones.rightForeArm.rotation.x += -bend * 0.45;
          if (bones.leftUpLeg) bones.leftUpLeg.rotation.x += -bend * 0.28;
          if (bones.rightUpLeg) bones.rightUpLeg.rotation.x += -bend * 0.28;
        } else if (workerState === 'drop') {
          const heave = Math.sin(Math.min(1, stateProgress) * Math.PI);
          if (bones.spine) bones.spine.rotation.x += heave * 0.34;
          if (bones.leftArm) bones.leftArm.rotation.x += -0.65 - heave * 0.55;
          if (bones.rightArm) bones.rightArm.rotation.x += -0.65 - heave * 0.55;
        } else if (workerState === 'rest') {
          const wipe = Math.sin(stateProgress * Math.PI * 2.5);
          const env = Math.sin(Math.min(1, stateProgress) * Math.PI);
          if (bones.head) bones.head.rotation.y += Math.sin(stateProgress * Math.PI * 2) * 0.38 * env;
          if (bones.rightArm) {
            bones.rightArm.rotation.x += -1.15 * env;
            bones.rightArm.rotation.z += (-0.35 + wipe * 0.22) * env;
          }
          if (bones.rightForeArm) bones.rightForeArm.rotation.x += -0.95 * env;
        } else if (c > 0.02) {
          if (bones.spine) bones.spine.rotation.x += -0.09 * c;
          if (bones.leftArm) {
            bones.leftArm.rotation.x += -0.78 * c;
            bones.leftArm.rotation.z += 0.28 * c;
          }
          if (bones.rightArm) {
            bones.rightArm.rotation.x += -0.78 * c;
            bones.rightArm.rotation.z += -0.28 * c;
          }
          if (bones.leftForeArm) bones.leftForeArm.rotation.y += -0.52 * c;
          if (bones.rightForeArm) bones.rightForeArm.rotation.y += 0.52 * c;
        }
      } else if (this.glbHolder) {
        let targetY = 0;
        let targetPitch = 0;
        let targetRoll = 0;
        let targetYaw = 0;
        if (workerState === 'pickup') {
          const bend = Math.sin(Math.min(1, stateProgress) * Math.PI);
          targetPitch = bend * 0.36;
          targetY = -bend * 0.14;
        } else if (workerState === 'drop') {
          const heave = Math.sin(Math.min(1, stateProgress) * Math.PI);
          targetPitch = heave * 0.28;
          targetY = heave * 0.06;
        } else if (workerState === 'rest') {
          targetYaw = Math.sin(stateProgress * Math.PI * 2) * 0.28;
          targetRoll = Math.sin(stateProgress * Math.PI * 3) * 0.05;
        } else if (isMoving) {
          targetY = Math.abs(Math.sin(this.walkBobPhase)) * 0.11;
          targetRoll = Math.sin(this.walkBobPhase) * 0.065;
          targetPitch = this.carryBlend > 0.3 ? -0.05 : 0.07;
        }
        this.glbHolder.position.y += (targetY - this.glbHolder.position.y) * damp;
        this.glbHolder.rotation.x += (targetPitch - this.glbHolder.rotation.x) * damp;
        this.glbHolder.rotation.z += (targetRoll - this.glbHolder.rotation.z) * damp;
        this.glbHolder.rotation.y += (targetYaw - this.glbHolder.rotation.y) * damp;
      }

      if (carriedLog.visible) {
        let logY = 1.16;
        let logZ = 0.42;
        if (workerState === 'pickup') {
          const lift = smoothstep(0.25, 1.0, stateProgress);
          logY = 0.52 + lift * 0.64;
          logZ = 0.52 - lift * 0.1;
        } else if (workerState === 'drop') {
          const toss = smoothstep(0.0, 0.85, stateProgress);
          logY = 1.16 - toss * 0.32;
          logZ = 0.42 + toss * 0.32;
        } else if (isMoving) {
          logY = 1.16 + Math.abs(Math.sin(this.walkBobPhase)) * 0.055;
        }
        carriedLog.position.set(0, logY, logZ);
      }
    }
  };

  const url = WORKER_ROLE_GLB[role] || WORKER_ROLE_GLB.porter;
  const targetHeight = role === 'porter' || role === 'lumberjack' ? 2.02 : 1.92;
  mountGlbWorker(root, url, { targetHeight, yaw: 0, placeholder: fallback, autoRigStatic: true });

  return root;
}

export function createCargoFreighterModel(lowSpec = false) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55, metalness: 0.35 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65, metalness: 0.15 });
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.5 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.8, 3.6), hullMat);
  hull.position.y = 0.7;
  hull.castShadow = !lowSpec;

  const keel = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.65, 3.3), deckMat);
  keel.position.y = -0.2;

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 3.0), bridgeMat);
  bridge.position.set(-3.9, 2.7, 0);
  bridge.castShadow = !lowSpec;

  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 1.3, 8), accentMat);
  funnel.position.set(-4.3, 4.6, 0);

  const mastBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.0 })
  );
  mastBeacon.position.set(5.2, 2.1, 0);
  mastBeacon.visible = !lowSpec;

  const contColors = [0x0ea5e9, 0x10b981, 0xf59e0b, 0xef4444];
  const contGeo = markShared(new THREE.BoxGeometry(2.3, 1.15, 1.35));
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(contGeo, new THREE.MeshStandardMaterial({ color: contColors[i], roughness: 0.5 }));
    c.position.set(-0.8 + (i % 2) * 2.6, 2.1, i < 2 ? -0.78 : 0.78);
    c.castShadow = !lowSpec;
    g.add(c);
  }

  g.add(hull, keel, bridge, funnel, mastBeacon);
  g.userData = { mastBeacon };
  return g;
}

export function createVipYachtModel(lowSpec = false) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.15 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.12, metalness: 0.55 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.8 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.35, 3.1), hullMat);
  hull.position.y = 0.55;
  hull.castShadow = !lowSpec;

  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.55, 3.2, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.scale.set(0.65, 1, 1.15);
  bow.position.set(6.1, 0.6, 0);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.14, 2.7), teakMat);
  deck.position.set(-0.2, 1.26, 0);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.15, 2.2), hullMat);
  cabin.position.set(-0.4, 1.88, 0);
  cabin.castShadow = !lowSpec;

  const visor = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.55, 2.28), glassMat);
  visor.position.set(-0.32, 1.92, 0);

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.72, 1.75), hullMat);
  upperDeck.position.set(-0.7, 2.8, 0);

  const goldStripe = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.14, 3.16), goldMat);
  goldStripe.position.set(0, 0.95, 0);

  const deckLight = new THREE.PointLight(0xfde68a, 1.5, 14, 1.8);
  deckLight.position.set(-0.6, 3.4, 0);
  deckLight.visible = !lowSpec;

  g.add(hull, bow, deck, cabin, visor, upperDeck, goldStripe, deckLight);
  g.userData = {
    deckLight,
    liveryMats: { hullMat, trimMat: goldMat }
  };
  return g;
}

export function createGantryCraneModel(lowSpec = false) {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.42, metalness: 0.52 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });
  const contMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.48 });

  const legGeo = markShared(new THREE.BoxGeometry(0.45, 9.2, 0.45));
  [[-3.2, -2.0], [3.2, -2.0], [-3.2, 2.0], [3.2, 2.0]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, steelMat);
    leg.position.set(lx, 4.6, lz);
    leg.castShadow = !lowSpec;
    g.add(leg);
  });

  const girder = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.75, 15.0), steelMat);
  girder.position.set(0, 9.3, 3.2);
  girder.castShadow = !lowSpec;

  const trolley = new THREE.Group();
  trolley.position.set(0, 8.6, 3.5);
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 2.2), darkMat);
  const cableL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), darkMat);
  cableL.position.set(-0.9, -1.7, 0);
  const cableR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), darkMat);
  cableR.position.set(0.9, -1.7, 0);
  const container = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.35, 1.8), contMat);
  container.position.set(0, -3.6, 0);
  container.castShadow = !lowSpec;
  trolley.add(carriage, cableL, cableR, container);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.0 })
  );
  beacon.position.set(0, 10.0, 9.8);
  beacon.visible = !lowSpec;

  g.add(girder, trolley, beacon);
  g.userData = { trolley, beacon };
  return g;
}

export function createDrivableYachtModel(tier = 1, lowSpec = false) {
  const g = new THREE.Group();
  const hullColor = tier >= 3 ? 0x0f172a : 0xf8fafc;
  const trimColor = tier >= 2 ? 0xf59e0b : 0x0ea5e9;
  const hullMat = new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.24, metalness: 0.2 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.55 });
  const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.28, metalness: 0.78 });

  // Main hull oriented along +Z (bow at +Z)
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.15, 7.6), hullMat);
  hull.position.set(0, 0.48, -0.3);
  hull.castShadow = !lowSpec;

  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.42, 2.8, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.z = Math.PI / 4;
  bow.scale.set(1.0, 1.0, 0.52);
  bow.position.set(0, 0.52, 4.9);

  const teakDeck = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.12, 7.1), teakMat);
  teakDeck.position.set(0, 1.1, -0.2);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.14, 7.65), trimMat);
  stripe.position.set(0, 0.85, -0.3);

  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.95, 3.6), cabinMat);
  cabin.position.set(0, 1.6, -0.5);
  cabin.castShadow = !lowSpec;

  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.45, 3.72), glassMat);
  visor.position.set(0, 1.68, -0.4);

  const flybridge = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 2.1), cabinMat);
  flybridge.position.set(0, 2.35, -0.85);

  const radarArch = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.25), trimMat);
  radarArch.position.set(0, 2.85, -1.35);

  const deckLight = new THREE.PointLight(0xfde68a, 1.35, 14, 1.8);
  deckLight.position.set(0, 2.95, -0.8);
  deckLight.visible = !lowSpec;

  g.add(hull, bow, teakDeck, stripe, cabin, visor, flybridge, radarArch, deckLight);
  g.userData = {
    deckLight,
    liveryMats: { hullMat, trimMat, cabinMat }
  };
  return g;
}

// Cached personal boat GLB loader (single download, shared GPU buffers across docked & drivable personal boat)
let personalBoatGlbPromise = null;
const _boatBox = new THREE.Box3();
const _boatSize = new THREE.Vector3();
const _boatCenter = new THREE.Vector3();
const _waterBox = new THREE.Box3();

function loadPersonalBoatGlbTemplate(url = '/models/boat.glb') {
  if (!personalBoatGlbPromise) {
    personalBoatGlbPromise = new Promise((resolve, reject) => {
      const loader = getGltfLoader();
      loader.load(
        url,
        (gltf) => {
          try {
            const rawScene = gltf.scene || gltf.scenes?.[0];
            if (!rawScene) {
              reject(new Error('boat.glb không chứa scene 3D hợp lệ.'));
              return;
            }

            rawScene.updateMatrixWorld(true);
            _waterBox.makeEmpty();
            const waterNodes = [];

            // Strip any embedded diorama water cube (e.g. Cube.016_Material_0) and capture its water surface Y
            rawScene.traverse((child) => {
              if (!child.isMesh) return;
              const name = child.name || '';
              const mat = Array.isArray(child.material) ? child.material[0] : child.material;
              const matName = mat?.name || '';
              if (/^Cube\.016_Material/i.test(name) || (/^Material$/i.test(matName) && mat?.transparent)) {
                _waterBox.expandByObject(child);
                waterNodes.push(child);
              }
            });

            for (const wn of waterNodes) {
              if (wn.parent) wn.parent.remove(wn);
              if (wn.geometry) wn.geometry.dispose();
              const mats = Array.isArray(wn.material) ? wn.material : [wn.material];
              for (const m of mats) if (m) m.dispose();
            }

            rawScene.updateMatrixWorld(true);
            _boatBox.setFromObject(rawScene);
            _boatBox.getSize(_boatSize);
            _boatBox.getCenter(_boatCenter);

            // Normalize length along +Z (bow faces +Z) to match TimberPort personal boat scale (~11.0 units)
            const rawLen = Math.max(_boatSize.z, _boatSize.x, 1);
            const targetLength = 11.0;
            const scaleFactor = targetLength / rawLen;
            rawScene.scale.multiplyScalar(scaleFactor);
            rawScene.updateMatrixWorld(true);

            _boatBox.setFromObject(rawScene);
            _boatBox.getCenter(_boatCenter);
            _boatBox.getSize(_boatSize);

            // Align waterline precisely to local y = 0 so the hull floats naturally on TimberPort's ocean
            const waterlineY = !_waterBox.isEmpty()
              ? (_waterBox.max.y - 0.12) * scaleFactor
              : _boatBox.min.y + _boatSize.y * 0.24;

            rawScene.position.x -= _boatCenter.x;
            rawScene.position.z -= _boatCenter.z;
            rawScene.position.y -= waterlineY;
            rawScene.updateMatrixWorld(true);

            // Runtime Draw-Call Batching: merge static boat sub-meshes by material (~80 -> ~12 draw calls)
            // Keeps boat.glb untouched on disk while cutting CPU/GPU overhead and enabling frustum culling.
            const buckets = new Map();
            const unmergedMeshes = [];
            const originalGeos = [];
            rawScene.traverse((child) => {
              if (!child.isMesh || !child.geometry?.attributes?.position) return;
              originalGeos.push(child.geometry);
              if (Array.isArray(child.material) || !child.material) {
                unmergedMeshes.push(child);
                return;
              }
              let list = buckets.get(child.material);
              if (!list) {
                list = [];
                buckets.set(child.material, list);
              }
              list.push(child);
            });

            const configureMat = (m) => {
              if (!m) return;
              markShared(m);
              if (m.map) {
                m.map.colorSpace = THREE.SRGBColorSpace;
                markShared(m.map);
              }
              if (m.emissiveMap) {
                m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                markShared(m.emissiveMap);
              }
              if (typeof m.envMapIntensity === 'number') {
                m.envMapIntensity = 0.85;
              }
              if (/glass-bullp|bulb|lantern/i.test(m.name || '')) {
                m.emissive = new THREE.Color(0xfbbf24);
                m.emissiveIntensity = 0.75;
              }
              m.needsUpdate = true;
            };

            const template = new THREE.Group();
            template.name = 'PersonalBoatGlbTemplate';

            for (const [mat, list] of buckets.entries()) {
              configureMat(mat);
              const allHaveUv = list.every((m) => Boolean(m.geometry.attributes.uv));
              const prepared = [];
              for (const m of list) {
                const rawGeo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
                rawGeo.applyMatrix4(m.matrixWorld);
                if (!rawGeo.attributes.normal) rawGeo.computeVertexNormals();
                // Harmonize attributes so mergeGeometries always succeeds cleanly
                for (const attrName of Object.keys(rawGeo.attributes)) {
                  if (attrName === 'position' || attrName === 'normal' || (allHaveUv && attrName === 'uv')) {
                    continue;
                  }
                  rawGeo.deleteAttribute(attrName);
                }
                rawGeo.morphAttributes = {};
                prepared.push(rawGeo);
              }

              const merged = prepared.length === 1 ? prepared[0] : mergeGeometries(prepared, false);
              if (merged) {
                merged.computeBoundingBox();
                merged.computeBoundingSphere();
                markShared(merged);
                const batchedMesh = new THREE.Mesh(merged, mat);
                batchedMesh.name = `BoatBatch_${mat.name || 'mat'}`;
                batchedMesh.castShadow = false;
                batchedMesh.receiveShadow = false;
                batchedMesh.frustumCulled = true;
                template.add(batchedMesh);
                if (prepared.length > 1) {
                  for (const g of prepared) g.dispose();
                }
              } else {
                // Safe fallback if any exotic attribute mismatch ever occurred
                for (const g of prepared) {
                  g.computeBoundingBox();
                  g.computeBoundingSphere();
                  markShared(g);
                  const fallbackMesh = new THREE.Mesh(g, mat);
                  fallbackMesh.castShadow = false;
                  fallbackMesh.receiveShadow = false;
                  fallbackMesh.frustumCulled = true;
                  template.add(fallbackMesh);
                }
              }
            }

            // Preserve any multi-material meshes as-is
            for (const m of unmergedMeshes) {
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              mats.forEach(configureMat);
              const g = m.geometry.clone();
              g.applyMatrix4(m.matrixWorld);
              g.computeBoundingBox();
              g.computeBoundingSphere();
              markShared(g);
              const cloneMesh = new THREE.Mesh(g, m.material);
              cloneMesh.castShadow = false;
              cloneMesh.receiveShadow = false;
              cloneMesh.frustumCulled = true;
              template.add(cloneMesh);
            }

            // Free original unbatched geometries immediately
            for (const g of originalGeos) {
              if (g && !g.userData?.shared) g.dispose();
            }

            resolve(template);
          } catch (err) {
            reject(err);
          }
        },
        undefined,
        (err) => reject(err)
      );
    }).catch((err) => {
      personalBoatGlbPromise = null;
      throw err;
    });
  }
  return personalBoatGlbPromise;
}

export function setPersonalBoatGlbShadows(boatGroup, enableShadows = false) {
  const wrap = boatGroup?.userData?.glbBoatWrap;
  if (!wrap) return;
  wrap.traverse((child) => {
    if (child.isMesh) {
      // Never cast shadow maps from high-poly 278k-vert boat GLB
      child.castShadow = false;
      child.receiveShadow = Boolean(enableShadows);
    }
  });
}

export function attachGlbToPersonalBoat(boatGroup, options = {}) {
  if (!boatGroup) return Promise.resolve({ ok: false });
  const yawOffset = Number.isFinite(options.yawOffset) ? options.yawOffset : 0;
  const scaleMult = Number.isFinite(options.scaleMult) ? options.scaleMult : 1.0;
  const url = options.url || '/models/boat.glb';

  // Wrap existing procedural meshes once (preserving deckLight for warm night lighting)
  if (!boatGroup.userData.proceduralBoatWrap) {
    const proceduralWrap = new THREE.Group();
    proceduralWrap.name = 'ProceduralBoatWrap';
    const existing = [...boatGroup.children];
    for (const ch of existing) {
      if (ch === boatGroup.userData.deckLight) continue;
      proceduralWrap.add(ch);
    }
    boatGroup.add(proceduralWrap);
    boatGroup.userData.proceduralBoatWrap = proceduralWrap;
  }

  if (!boatGroup.userData.glbBoatWrap) {
    const glbWrap = new THREE.Group();
    glbWrap.name = 'PersonalBoatGlbWrap';
    glbWrap.visible = false;
    boatGroup.add(glbWrap);
    boatGroup.userData.glbBoatWrap = glbWrap;
  }

  const glbWrap = boatGroup.userData.glbBoatWrap;
  glbWrap.rotation.y = yawOffset;
  glbWrap.scale.setScalar(scaleMult);

  const attachToken = (boatGroup.userData.glbBoatToken || 0) + 1;
  boatGroup.userData.glbBoatToken = attachToken;

  return loadPersonalBoatGlbTemplate(url)
    .then((template) => {
      if (boatGroup.userData.glbBoatToken !== attachToken) {
        return { ok: false, stale: true };
      }
      while (glbWrap.children.length > 0) {
        glbWrap.remove(glbWrap.children[0]);
      }
      const instance = template.clone(true);
      instance.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          child.frustumCulled = true;
        }
      });
      glbWrap.add(instance);
      glbWrap.visible = true;
      if (boatGroup.userData.proceduralBoatWrap) {
        boatGroup.userData.proceduralBoatWrap.visible = false;
      }
      if (boatGroup.userData.deckLight) {
        boatGroup.userData.deckLight.position.set(0, 5.2 * scaleMult, 0);
      }
      boatGroup.userData.glbBoatLoaded = true;
      return { ok: true };
    })
    .catch((err) => ({ ok: false, error: err?.message || 'Không thể tải boat.glb.' }));
}

export function createAirplaneModel(planeId = 'bush_plane', lowSpec = false) {
  const g = new THREE.Group();
  const isJet = planeId === 'imperial_jet';
  const isTwin = planeId === 'cargo_twin';

  const bodyColor = isJet ? 0xf8fafc : isTwin ? 0x0284c7 : 0xf59e0b;
  const accentColor = isJet ? 0xf59e0b : isTwin ? 0xf8fafc : 0xdc2626;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.28, metalness: isJet ? 0.42 : 0.22 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.32, metalness: 0.55 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });

  // Fuselage along +Z (nose at +Z)
  const fuseW = isTwin ? 1.15 : isJet ? 1.05 : 0.92;
  const fuseL = isJet ? 6.4 : isTwin ? 5.8 : 4.8;
  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(fuseW, fuseW * 0.92, fuseL), bodyMat);
  fuselage.position.set(0, 0.85, 0);
  fuselage.castShadow = !lowSpec;

  const nose = new THREE.Mesh(new THREE.ConeGeometry(fuseW * 0.52, 1.5, 8), accentMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.85, fuseL * 0.5 + 0.72);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(fuseW * 0.82, 0.46, 1.45), glassMat);
  canopy.position.set(0, 1.28, fuseL * 0.18);

  const wingSpan = isJet ? 8.6 : isTwin ? 8.2 : 7.0;
  const wingY = isJet ? 0.78 : isTwin ? 1.18 : 1.32;
  if (isJet) {
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(wingSpan * 0.5, 0.12, 1.45), bodyMat);
      wing.position.set(side * (wingSpan * 0.25), wingY, -0.2);
      wing.rotation.y = side * -0.34;
      wing.castShadow = !lowSpec;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.7), accentMat);
      tip.position.set(side * (wingSpan * 0.48), wingY + 0.22, -0.85);
      g.add(wing, tip);
    });
  } else {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.13, 1.35), bodyMat);
    wing.position.set(0, wingY, 0.2);
    wing.castShadow = !lowSpec;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(wingSpan + 0.05, 0.15, 0.24), accentMat);
    stripe.position.set(0, wingY, 0.68);
    g.add(wing, stripe);
  }

  // Tail Fin & Horizontal Stabilizer
  const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 1.05), accentMat);
  vTail.position.set(0, 1.55, -fuseL * 0.44);
  const hTail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.75), bodyMat);
  hTail.position.set(0, isJet || isTwin ? 2.05 : 1.05, -fuseL * 0.45);

  // Landing skids / wheels
  [-0.65, 0.65].forEach((lx) => {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.12), darkMat);
    strut.position.set(lx, 0.35, 0.5);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 8), darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(lx, 0.12, 0.5);
    g.add(strut, wheel);
  });

  const propellers = [];
  if (isJet) {
    [-0.95, 0.95].forEach((ex) => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 1.35, 8), darkMat);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(ex, 1.15, -1.75);
      const glow = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.22, 10),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
      );
      glow.position.set(ex, 1.15, -2.44);
      g.add(pod, glow);
    });
  } else if (isTwin) {
    [-2.0, 2.0].forEach((ex) => {
      const nac = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.05), accentMat);
      nac.position.set(ex, wingY - 0.12, 0.55);
      const prop = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.05), darkMat);
      prop.position.set(ex, wingY - 0.12, 1.12);
      g.add(nac, prop);
      propellers.push(prop);
    });
  } else {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.06), darkMat);
    prop.position.set(0, 0.85, fuseL * 0.5 + 1.48);
    g.add(prop);
    propellers.push(prop);
  }

  g.add(fuselage, nose, canopy, vTail, hTail);
  g.userData = {
    propellers,
    isJet,
    liveryMats: { bodyMat, accentMat }
  };
  return g;
}

export function createAirportRunwayModel(lowSpec = false) {
  const g = new THREE.Group();
  const tarmacMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const curbStoneMat = new THREE.MeshStandardMaterial({ map: markShared(getTravertineTexture(2, 6)), roughness: 0.78 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.95, roughness: 0.3 });
  const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.52, metalness: 0.45 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.35 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });

  // Clean travertine shoulder apron + Runway slab (9.2 x 38 along Z)
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.08, 39.2), curbStoneMat);
  shoulder.position.set(0, 0.04, 0);
  shoulder.receiveShadow = !lowSpec;
  g.add(shoulder);

  const runway = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.12, 38), tarmacMat);
  runway.position.set(0, 0.06, 0);
  runway.receiveShadow = !lowSpec;
  g.add(runway);

  // Connecting taxiway approach apron linking runway to central boulevard (-X)
  const taxiApproach = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 6.2), curbStoneMat);
  taxiApproach.position.set(-6.8, 0.05, -2.0);
  taxiApproach.receiveShadow = !lowSpec;
  g.add(taxiApproach);

  // Centerline dashed markings
  const dashGeo = markShared(new THREE.PlaneGeometry(0.45, 2.2));
  dashGeo.rotateX(-Math.PI / 2);
  for (let z = -15; z <= 15; z += 4.2) {
    const dash = new THREE.Mesh(dashGeo, stripeMat);
    dash.position.set(0, 0.13, z);
    g.add(dash);
  }

  // Runway threshold bars & warm golden edge beacons
  [-17.2, 17.2].forEach((tz) => {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.7), stripeMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(0, 0.135, tz);
    g.add(bar);
  });

  const edgeGeo = markShared(new THREE.BoxGeometry(0.24, 0.24, 0.24));
  for (let z = -16; z <= 16; z += 6.4) {
    [-4.4, 4.4].forEach((ex) => {
      const marker = new THREE.Mesh(edgeGeo, amberMat);
      marker.position.set(ex, 0.19, z);
      g.add(marker);
    });
  }

  // Tier 2: Hangar & Air Traffic Control Tower with landscaped forecourt
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const terminalPad = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.14, 18.0), curbStoneMat);
  terminalPad.position.set(8.5, 0.07, -1.5);
  terminalPad.receiveShadow = !lowSpec;
  const hangar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.6, 8.2), hangarMat);
  hangar.position.set(8.6, 1.85, -8);
  hangar.castShadow = !lowSpec;
  const hangarRoof = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 8.3, 8, 1, false, 0, Math.PI), roofMat);
  hangarRoof.rotation.z = Math.PI / 2;
  hangarRoof.rotation.y = Math.PI / 2;
  hangarRoof.position.set(8.6, 3.65, -8);
  const atcShaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.2, 2.2), hangarMat);
  atcShaft.position.set(8.4, 3.65, 4.5);
  atcShaft.castShadow = !lowSpec;
  const atcCab = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 1.5, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.45 })
  );
  atcCab.position.set(8.4, 7.95, 4.5);
  const planterBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 5.2), curbStoneMat);
  planterBox.position.set(5.4, 0.3, -1.5);
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 4.8), hedgeMat);
  hedge.position.set(5.4, 0.72, -1.5);
  tier2Group.add(terminalPad, hangar, hangarRoof, atcShaft, atcCab, planterBox, hedge);
  g.add(tier2Group);

  // Tier 3: Radar Dish & Extended Jet Apron
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const radar = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.75, roughness: 0.25 }));
  radar.position.set(8.4, 9.5, 4.5);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.1, 14), tarmacMat);
  apron.position.set(7.8, 0.05, 11);
  tier3Group.add(radar, apron);
  g.add(tier3Group);

  g.userData = { tier2Group, tier3Group, radar };
  return g;
}

export function createIslandOutpostModel(lowSpec = false) {
  const g = new THREE.Group();
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xe6c88a, roughness: 0.9 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f8a45, roughness: 0.85, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
  const depotMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.75 });

  // Sand base + grassy mound
  const sandBase = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 16.5, 1.4, 12), sandMat);
  sandBase.position.y = 0.05;
  sandBase.receiveShadow = !lowSpec;
  const grassTop = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 12.6, 1.1, 12), grassMat);
  grassTop.position.y = 0.85;
  grassTop.receiveShadow = !lowSpec;
  g.add(sandBase, grassTop);

  // Wooden Sea Dock extending West-Northwest (-10, 0.4, -6)
  const dock = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.45, 4.2), woodMat);
  dock.position.set(-11.5, 0.35, -6.5);
  dock.rotation.y = 0.45;
  g.add(dock);

  // Supply Warehouse & Helipad/Airdrop Ring
  const warehouse = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.8, 4.4), depotMat);
  warehouse.position.set(2.5, 2.75, -2.5);
  warehouse.castShadow = !lowSpec;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.5, 4), goldMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(2.5, 4.9, -2.5);
  const helipad = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 3.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  helipad.rotation.x = -Math.PI / 2;
  helipad.position.set(-2.5, 1.45, 2.2);
  g.add(warehouse, roof, helipad);

  // Palm accents (2 low-poly island trees)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  [[-4.5, -3.5], [5.8, 3.8]].forEach(([px, pz]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.4, 6), trunkMat);
    t.position.set(px, 2.8, pz);
    const c = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), grassMat);
    c.position.set(px, 4.7, pz);
    g.add(t, c);
  });

  // Tier 2 & 3 Outpost Upgrades
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.6 });
  const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.8, 10), tankMat);
  tank1.position.set(6.2, 2.7, -2.2);
  const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.8, 10), tankMat);
  tank2.position.set(6.2, 2.7, 0.4);
  tier2Group.add(tank1, tank2);
  g.add(tier2Group);

  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 6.2, 8), goldMat);
  spire.position.set(2.5, 7.6, -2.5);
  tier3Group.add(spire);
  g.add(tier3Group);

  // Phase 5: Island VIP Yacht Resort Tiers (1..3)
  const resortWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42 });
  const resortRoofMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.58, flatShading: true });
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.12, metalness: 0.25, emissive: 0x0369a1, emissiveIntensity: 0.25 });

  const resortTier1 = new THREE.Group();
  resortTier1.visible = false;
  [-6.2, -2.2].forEach((vx) => {
    const villa = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.9, 2.6), resortWallMat);
    villa.position.set(vx, 2.2, 5.8);
    villa.castShadow = !lowSpec;
    const vRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), resortRoofMat);
    vRoof.rotation.y = Math.PI / 4;
    vRoof.position.set(vx, 3.75, 5.8);
    resortTier1.add(villa, vRoof);
  });
  g.add(resortTier1);

  const resortTier2 = new THREE.Group();
  resortTier2.visible = false;
  const poolDeck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 4.0), resortWallMat);
  poolDeck.position.set(4.5, 1.5, 5.8);
  const poolWater = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 2.8), poolMat);
  poolWater.position.set(4.5, 1.62, 5.8);
  resortTier2.add(poolDeck, poolWater);
  g.add(resortTier2);

  const resortTier3 = new THREE.Group();
  resortTier3.visible = false;
  const pavilion = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 2.6, 8), resortWallMat);
  pavilion.position.set(-7.5, 2.6, -0.5);
  pavilion.castShadow = !lowSpec;
  const pavCrown = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 8), goldMat);
  pavCrown.position.set(-7.5, 4.7, -0.5);
  const yachtLoungePier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.35, 3.2), woodMat);
  yachtLoungePier.position.set(-12.2, 0.45, 3.2);
  resortTier3.add(pavilion, pavCrown, yachtLoungePier);
  g.add(resortTier3);

  g.userData = { tier2Group, tier3Group, resortTier1, resortTier2, resortTier3 };
  return g;
}

export function createSeaTreasureModel() {
  const g = new THREE.Group();
  const buoyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
  const chestMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85, emissive: 0x713f12, emissiveIntensity: 0.35 });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.22, 8, 16), buoyMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;

  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.9, 0.95), chestMat);
  chest.position.y = 0.45;
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.0), goldMat);
  band.position.y = 0.62;

  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 1.95, 20),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.05;

  g.add(ring, chest, band, beaconRing);
  g.userData = { beaconRing };
  return g;
}

export function applyLiveryToModel(model, livery, isPlane = false) {
  const mats = model?.userData?.liveryMats;
  if (!mats || !livery) return;
  if (isPlane) {
    mats.bodyMat?.color?.setHex(livery.hull);
    mats.accentMat?.color?.setHex(livery.trim);
  } else {
    mats.hullMat?.color?.setHex(livery.hull);
    mats.trimMat?.color?.setHex(livery.trim);
    mats.cabinMat?.color?.setHex(livery.cabin);
  }
}

export function createCorporateHqModel(lowSpec = false) {
  const g = new THREE.Group();
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.15 });
  const travertineMat = new THREE.MeshStandardMaterial({ map: markShared(getTravertineTexture(3, 3)), roughness: 0.74 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.14, metalness: 0.7 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22, metalness: 0.85, emissive: 0x78350f, emissiveIntensity: 0.32 });
  const warmTrimMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfbbf24, emissiveIntensity: 0.9, roughness: 0.2 });

  // Tier 1: Stepped Travertine & Granite Terrace + 2-Story TimberPort Lobby
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const plazaBase = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.22, 9.6), travertineMat);
  plazaBase.position.y = 0.11;
  plazaBase.receiveShadow = !lowSpec;
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 8.8), graniteMat);
  plaza.position.y = 0.22;
  plaza.receiveShadow = !lowSpec;
  const frontStep = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.2), travertineMat);
  frontStep.position.set(0, 0.11, 4.9);
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.2, 6.2), steelMat);
  lobby.position.y = 2.42;
  lobby.castShadow = !lowSpec;
  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.5, 5.4), glassMat);
  lobbyGlass.position.y = 2.52;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 2.2), goldMat);
  canopy.position.set(0, 2.8, 3.6);
  const canopyGlow = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.22), warmTrimMat);
  canopyGlow.position.set(0, 2.66, 4.45);
  [-1.4, 1.4].forEach((bx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.4, 8), goldMat);
    col.position.set(bx, 1.55, 4.2);
    tier1Group.add(col);
  });
  tier1Group.add(plazaBase, plaza, frontStep, lobby, lobbyGlass, canopy, canopyGlow);
  g.add(tier1Group);

  // Tier 2: Corporate Financial Tower + Golden Crown Band + Uplight Ribs
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 6.5, 5.0), glassMat);
  tower.position.y = 7.7;
  tower.castShadow = !lowSpec;
  const ribs = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.4, 3.4), steelMat);
  ribs.position.y = 7.7;
  const crownBand = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.55, 5.4), goldMat);
  crownBand.position.y = 11.1;
  const warmHalo = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 5.5), warmTrimMat);
  warmHalo.position.y = 10.78;
  tier2Group.add(tower, ribs, crownBand, warmHalo);
  g.add(tier2Group);

  // Tier 3: Penthouse Spire + Helipad + Warm Facade PointLight (gated off on <8GB RAM)
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 4.0), glassMat);
  penthouse.position.y = 12.7;
  const helipadDeck = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.25, 16), graniteMat);
  helipadDeck.position.y = 14.25;
  const heliRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.75, 20),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  heliRing.rotation.x = -Math.PI / 2;
  heliRing.position.y = 14.4;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.24, 3.4, 6), goldMat);
  spire.position.set(-1.6, 15.8, -1.4);
  tier3Group.add(penthouse, helipadDeck, heliRing, spire);
  g.add(tier3Group);

  const facadeLight = new THREE.PointLight(0xfde68a, 1.85, 24, 1.6);
  facadeLight.position.set(0, 5.6, 5.0);
  facadeLight.visible = false;
  g.add(facadeLight);

  g.userData = { tier1Group, tier2Group, tier3Group, facadeLight };
  return g;
}

export function createCloudsAndStormGroup(lowSpec = false) {
  const g = new THREE.Group();

  // 14 low-poly drifting cloud puffs in 1 InstancedMesh (Zero GC)
  const cloudCount = 14;
  const cloudGeo = new THREE.DodecahedronGeometry(3.2, 0);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.92,
    flatShading: true,
    transparent: true,
    opacity: 0.88
  });
  const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
  const cloudBases = [];
  for (let i = 0; i < cloudCount; i++) {
    cloudBases.push({
      x: -110 + (i / cloudCount) * 220 + (Math.random() - 0.5) * 18,
      y: 25 + (i % 3) * 4.5,
      z: -38 + (i % 5) * 34,
      sx: 1.4 + (i % 3) * 0.55,
      sy: 0.55 + (i % 2) * 0.18,
      sz: 1.1 + (i % 4) * 0.28,
      speed: 1.4 + (i % 4) * 0.45
    });
  }
  clouds.visible = !lowSpec;
  g.add(clouds);

  // 90 thin storm rain streaks in 1 InstancedMesh (visible only when !lowSpec && stormState.active)
  const rainCount = 90;
  const rainGeo = new THREE.BoxGeometry(0.06, 2.4, 0.06);
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.48
  });
  const rain = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  const rainOffsets = [];
  for (let i = 0; i < rainCount; i++) {
    rainOffsets.push({
      x: (Math.random() - 0.5) * 140,
      y: 2 + Math.random() * 26,
      z: -20 + Math.random() * 140,
      speed: 26 + Math.random() * 12
    });
  }
  rain.visible = false;
  g.add(rain);

  g.userData = { clouds, rain, cloudBases, rainOffsets, cloudMat };
  return g;
}

export function createStormBeaconModel() {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const pillarMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.35 });

  const torus = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.42, 10, 28), ringMat);
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.2, 24), ringMat);
  innerRing.rotation.x = -Math.PI / 2;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.4, 18, 10), pillarMat);
  pillar.position.y = 9;

  g.add(torus, innerRing, pillar);
  g.visible = false;
  g.userData = { torus, pillar };
  return g;
}

export function createFurnitureFactoryModel(lowSpec = false) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
  const travertineMat = new THREE.MeshStandardMaterial({ map: markShared(getTravertineTexture(3, 2)), roughness: 0.78 });
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.62 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.28, metalness: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.14, metalness: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.55 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });
  const warmGlowMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.9, roughness: 0.25 });

  // Tier 1: Main Craft Workshop Hall + Travertine Courtyard Apron & Awning
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 9.0), travertineMat);
  apron.position.y = 0.07;
  apron.receiveShadow = !lowSpec;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.35, 7.6), darkMat);
  plinth.position.y = 0.18;
  plinth.receiveShadow = !lowSpec;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.6, 6.2), wallMat);
  hall.position.y = 2.15;
  hall.castShadow = !lowSpec;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.8, 4), timberMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.25, 1, 0.92);
  roof.position.y = 4.85;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.35, 6.4), copperMat);
  trim.position.y = 3.92;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 1.6), copperMat);
  awning.position.set(0, 2.65, 3.85);
  awning.rotation.x = 0.16;
  const awningGlow = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.18), warmGlowMat);
  awningGlow.position.set(0, 2.5, 4.35);
  [-3.0, 3.0].forEach((px) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.38, 0.9), travertineMat);
    planter.position.set(px, 0.35, 3.7);
    const bush = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.65), hedgeMat);
    bush.position.set(px, 0.7, 3.7);
    tier1Group.add(planter, bush);
  });
  tier1Group.add(apron, plinth, hall, roof, trim, awning, awningGlow);
  g.add(tier1Group);

  // Tier 2: Glass Furniture Showroom Wing & Twin Extractors
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 4.8), glassMat);
  wing.position.set(-5.8, 1.7, 0.4);
  const wingFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 5.0), copperMat);
  wingFrame.position.set(-5.8, 3.2, 0.4);
  [-1.8, 1.8].forEach((sx) => {
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 4.4, 8), darkMat);
    silo.position.set(sx, 2.5, -3.5);
    tier2Group.add(silo);
  });
  tier2Group.add(wing, wingFrame);
  g.add(tier2Group);

  // Tier 3: Royal Export Gallery Sign + Animated Display Pedestal
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.2, 1.2), copperMat);
  crown.position.set(0, 6.0, 0);
  const cncSpinner = new THREE.Group();
  cncSpinner.position.set(-5.8, 0.85, 0.4);
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.22, 10), timberMat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.14), copperMat);
  chairBack.position.set(0, 0.55, -0.35);
  cncSpinner.add(tableTop, chairBack);
  tier3Group.add(crown, cncSpinner);
  g.add(tier3Group);

  // Accent light gated OFF on <8GB RAM low-spec laptops
  const accentLight = new THREE.PointLight(0xfbbf24, 1.65, 18, 1.7);
  accentLight.position.set(-3.2, 3.8, 3.6);
  accentLight.visible = false;
  g.add(accentLight);

  g.userData = { tier1Group, tier2Group, tier3Group, cncSpinner, accentLight };
  return g;
}

export function createLighthouseModel(lowSpec = false) {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.48 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.26, metalness: 0.8 });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // Tier 1: Coastal Rock Base + Tapered Lighthouse Tower + Lantern Room
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const rockBase = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 0), rockMat);
  rockBase.scale.set(1.2, 0.45, 1.1);
  rockBase.position.y = 0.4;
  rockBase.receiveShadow = !lowSpec;

  const lowerBand = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 2.15, 4.2, 10), whiteMat);
  lowerBand.position.y = 2.8;
  lowerBand.castShadow = !lowSpec;
  const midBand = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.65, 3.6, 10), crimsonMat);
  midBand.position.y = 6.7;
  midBand.castShadow = !lowSpec;
  const upperBand = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.32, 2.8, 10), whiteMat);
  upperBand.position.y = 9.9;

  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.45, 0.35, 12), rockMat);
  balcony.position.y = 11.4;
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.96, 1.5, 10), glassMat);
  lantern.position.y = 12.25;
  const dome = new THREE.Mesh(new THREE.ConeGeometry(1.18, 1.35, 10), crimsonMat);
  dome.position.y = 13.6;

  // Rotating Fresnel reflector bar inside/above lantern
  const beaconHead = new THREE.Group();
  beaconHead.position.y = 12.25;
  const lensBar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.55), brassMat);
  beaconHead.add(lensBar);

  tier1Group.add(rockBase, lowerBand, midBand, upperBand, balcony, lantern, dome, beaconHead);
  g.add(tier1Group);

  // Tier 2: Keeper Cottage Annex
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const cottage = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 2.8), whiteMat);
  cottage.position.set(2.9, 1.8, 0.5);
  const cRoof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.3, 4), crimsonMat);
  cRoof.rotation.y = Math.PI / 4;
  cRoof.position.set(2.9, 3.55, 0.5);
  tier2Group.add(cottage, cRoof);
  g.add(tier2Group);

  // Tier 3: Imperial Brass Spire & Signal Array
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 3.2, 6), brassMat);
  spire.position.y = 15.6;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.14, 8, 20), brassMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 11.65;
  tier3Group.add(spire, halo);
  g.add(tier3Group);

  // Rotating Maritime PointLight gated OFF on <8GB RAM low-spec laptops
  const beamLight = new THREE.PointLight(0xfef08a, 2.2, 34, 1.5);
  beamLight.position.set(0, 12.6, 2.2);
  beamLight.visible = false;
  g.add(beamLight);

  g.userData = { tier1Group, tier2Group, tier3Group, beaconHead, beamLight };
  return g;
}

export function createDeepContainerPortModel(lowSpec = false) {
  const g = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, metalness: 0.08 });
  const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.35 });
  const keelRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.48, metalness: 0.15 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const craneYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.38, metalness: 0.28 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.24, metalness: 0.65 });
  const cBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.52 });
  const cTealMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.52 });
  const cAmberMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.52 });

  // Tier 1: Deep-Water Concrete Pier Caisson + Mega Container Ship + Primary Gantry Crane
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;

  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 10), concreteMat);
  pierDeck.position.set(0, 0.3, -1);
  pierDeck.receiveShadow = !lowSpec;
  pierDeck.castShadow = !lowSpec;
  tier1Group.add(pierDeck);

  // Mooring bollards
  for (const bx of [-6.2, -2.0, 2.2, 6.2]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.75, 8), darkSlateMat);
    bollard.position.set(bx, 1.25, 3.4);
    tier1Group.add(bollard);
  }

  // Mega Container Ship moored alongside outer deep-water berth
  const containerShip = new THREE.Group();
  containerShip.position.set(0, 0.1, 7.6);
  const hullUpper = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.65, 4.4), darkSlateMat);
  hullUpper.position.y = 0.85;
  hullUpper.castShadow = !lowSpec;
  const hullKeel = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.75, 4.2), keelRedMat);
  hullKeel.position.y = 0.05;
  const bow = new THREE.Mesh(new THREE.ConeGeometry(2.35, 3.4, 4), darkSlateMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.scale.set(0.65, 1, 1);
  bow.position.set(8.6, 0.85, 0);

  // Aft Bridge Superstructure & Funnel
  const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 3.6), whiteMat);
  bridgeTower.position.set(-5.4, 3.1, 0);
  const bridgeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 3.7), darkSlateMat);
  bridgeVisor.position.set(-4.35, 4.1, 0);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.5, 8), keelRedMat);
  funnel.position.set(-6.2, 5.1, 0);
  containerShip.add(hullUpper, hullKeel, bow, bridgeTower, bridgeVisor, funnel);

  // 2-tier Cargo Container Stacks on Ship Deck
  const shipStacks = [
    [-2.4, 2.15, -0.95, cBlueMat],
    [-2.4, 2.15, 0.95, cAmberMat],
    [-2.4, 3.1, -0.95, cTealMat],
    [0.5, 2.15, -0.95, cAmberMat],
    [0.5, 2.15, 0.95, cBlueMat],
    [0.5, 3.1, 0.95, cTealMat],
    [3.4, 2.15, -0.95, cTealMat],
    [3.4, 2.15, 0.95, cAmberMat]
  ];
  for (const [cx, cy, cz, mat] of shipStacks) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.92, 1.55), mat);
    box.position.set(cx, cy, cz);
    box.castShadow = !lowSpec;
    containerShip.add(box);
  }
  tier1Group.add(containerShip);

  // Heavy Rail-Mounted Gantry Crane
  const craneBase = new THREE.Group();
  craneBase.position.set(-1.5, 1.0, 2.1);
  for (const lx of [-2.4, 2.4]) {
    for (const lz of [-1.2, 1.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.6, 0.45), craneYellowMat);
      leg.position.set(lx, 3.8, lz);
      leg.castShadow = !lowSpec;
      craneBase.add(leg);
    }
  }
  const boomBeam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.72, 11.4), craneYellowMat);
  boomBeam.position.set(0, 7.75, 2.8);
  boomBeam.castShadow = !lowSpec;
  craneBase.add(boomBeam);

  // Animated Crane Trolley + Suspended Container
  const trolley = new THREE.Group();
  trolley.position.set(0, 7.2, 3.2);
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.7), darkSlateMat);
  const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), darkSlateMat);
  cableL.position.set(-0.7, -1.2, 0);
  const cableR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), darkSlateMat);
  cableR.position.set(0.7, -1.2, 0);
  const hoistedBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 1.5), cBlueMat);
  hoistedBox.position.set(0, -2.55, 0);
  trolley.add(carriage, cableL, cableR, hoistedBox);
  craneBase.add(trolley);
  tier1Group.add(craneBase);
  g.add(tier1Group);

  // Tier 2: Twin Outer Gantry Crane & High-Bay Yard Containers
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const crane2 = new THREE.Group();
  crane2.position.set(4.8, 1.0, 2.1);
  for (const lx of [-1.6, 1.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 7.2, 0.38), craneYellowMat);
    leg.position.set(lx, 3.6, 0);
    crane2.add(leg);
  }
  const boom2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 9.6), craneYellowMat);
  boom2.position.set(0, 7.3, 2.4);
  crane2.add(boom2);
  tier2Group.add(crane2);

  const yardBoxes = [
    [-5.2, 1.45, -3.5, cTealMat],
    [-5.2, 2.4, -3.5, cAmberMat],
    [-2.1, 1.45, -3.5, cBlueMat]
  ];
  for (const [yx, yy, yz, mat] of yardBoxes) {
    const yb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.92, 1.55), mat);
    yb.position.set(yx, yy, yz);
    tier2Group.add(yb);
  }
  g.add(tier2Group);

  // Tier 3: Automated Deep-Port Command Arch & Control Bridge
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const ctrlRoom = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.4, 2.8), whiteMat);
  ctrlRoom.position.set(2.2, 2.2, -3.6);
  const ctrlGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 0.2), solarMat);
  ctrlGlass.position.set(2.2, 2.6, -2.15);
  const mastArch = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 0.55), craneYellowMat);
  mastArch.position.set(1.5, 9.2, 2.1);
  tier3Group.add(ctrlRoom, ctrlGlass, mastArch);
  g.add(tier3Group);

  // Green Port Solar Microgrid & Offshore Wind Mast (toggled when greenEnergyTier >= 1)
  const greenSolarArray = new THREE.Group();
  greenSolarArray.visible = false;
  for (let i = 0; i < 3; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 1.4), solarMat);
    panel.position.set(-5.8 + i * 2.5, 1.55, -0.4);
    panel.rotation.x = 0.28;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6), darkSlateMat);
    stand.position.set(-5.8 + i * 2.5, 1.15, -0.4);
    greenSolarArray.add(panel, stand);
  }
  const windMast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 6.2, 8), whiteMat);
  windMast.position.set(-7.1, 3.9, 1.8);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), craneYellowMat);
  hub.position.set(-7.1, 7.0, 1.95);
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, 0.08), whiteMat);
  blade1.position.set(-7.1, 7.0, 2.1);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.08), whiteMat);
  blade2.position.set(-7.1, 7.0, 2.1);
  greenSolarArray.add(windMast, hub, blade1, blade2);
  g.add(greenSolarArray);

  // Port Beacon PointLight (auto-gated OFF on <8GB RAM lowSpec)
  const beaconLight = new THREE.PointLight(0x38bdf8, 1.9, 28, 1.6);
  beaconLight.position.set(0, 8.8, 4.5);
  beaconLight.visible = false;
  g.add(beaconLight);

  g.userData = {
    tier1Group,
    tier2Group,
    tier3Group,
    greenSolarArray,
    containerShip,
    trolley,
    beaconLight
  };
  return g;
}

// ---------------------------------------------------------------------------
// 20. Phase 8: Industrial Railway Track, Depot & Diesel-Electric Freight Train
// ---------------------------------------------------------------------------
export function createRailwayAndTrainModel(lowSpec = false) {
  const g = new THREE.Group();

  const ballastMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.94 });
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.88 });
  const railSteelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3, metalness: 0.78 });
  const locoRedMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.34, metalness: 0.32 });
  const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.5 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.26, metalness: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.16,
    metalness: 0.35,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 1.4,
    roughness: 0.15
  });
  const logBarkMat = new THREE.MeshStandardMaterial({ color: 0x7c4a27, roughness: 0.85 });
  const contBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.28 });
  const contTealMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.42, metalness: 0.28 });

  // Track Corridor along East Infrastructure Zone edge (x = 106, z = -104 .. +12)
  const trackLen = 116.0;
  const trackCenterZ = -46.0;
  const trackX = 106.0;

  const ballast = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, trackLen + 1.6), ballastMat);
  ballast.position.set(trackX, 0.06, trackCenterZ);
  ballast.receiveShadow = !lowSpec;
  g.add(ballast);

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, trackLen), railSteelMat);
  railL.position.set(trackX - 0.58, 0.17, trackCenterZ);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, trackLen), railSteelMat);
  railR.position.set(trackX + 0.58, 0.17, trackCenterZ);
  g.add(railL, railR);

  // Instanced Wooden Sleepers along East Infrastructure Railway
  const sleeperCount = 110;
  const sleeperGeo = new THREE.BoxGeometry(1.85, 0.09, 0.32);
  const sleeperInst = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < sleeperCount; i++) {
    const sz = -103.5 + (i / (sleeperCount - 1)) * 115.0;
    dummy.position.set(trackX, 0.12, sz);
    dummy.updateMatrix();
    sleeperInst.setMatrixAt(i, dummy.matrix);
  }
  sleeperInst.instanceMatrix.needsUpdate = true;
  g.add(sleeperInst);

  // North & South Heavy Steel Buffer Stops
  for (const bz of [-104.2, 12.2]) {
    const buf = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 0.38), locoRedMat);
    buf.position.set(trackX, 0.38, bz);
    g.add(buf);
  }

  // East Infrastructure Train Station Platform (at x = 101.6, z = -42)
  const depotGroup = new THREE.Group();
  depotGroup.position.set(101.6, 0, -42.0);
  const platform = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 11.0), ballastMat);
  platform.position.y = 0.225;
  platform.receiveShadow = !lowSpec;
  const stationHouse = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.5, 5.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.72 }));
  stationHouse.position.set(-0.7, 1.65, 0);
  const stationRoof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 6.2), darkIronMat);
  stationRoof.position.set(-0.7, 3.05, 0);
  const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 10.6), darkIronMat);
  canopyRoof.position.set(0.8, 2.75, 0);
  const canopyStripe = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.1, 10.66), brassMat);
  canopyStripe.position.set(0.8, 2.66, 0);
  for (const pz of [-4.2, 0, 4.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.4, 6), darkIronMat);
    post.position.set(1.2, 1.45, pz);
    depotGroup.add(post);
  }
  const signalPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 6), darkIronMat);
  signalPost.position.set(1.9, 1.7, 5.8);
  const signalLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), headlightMat);
  signalLamp.position.set(1.9, 3.35, 5.8);
  depotGroup.add(platform, stationHouse, stationRoof, canopyRoof, canopyStripe, signalPost, signalLamp);
  g.add(depotGroup);

  // Animated Diesel-Electric Freight Train Group (runs along East Infrastructure rail x = 106)
  const trainGroup = new THREE.Group();
  trainGroup.position.set(trackX, 0.24, -42.0);
  trainGroup.visible = false;

  // 1. Locomotive Engine Unit
  const loco = new THREE.Group();
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.38, 4.4), darkIronMat);
  chassis.position.y = 0.36;
  const noseBody = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.15, 2.7), locoRedMat);
  noseBody.position.set(0, 1.12, 0.65);
  noseBody.castShadow = !lowSpec;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.18, 2.74), brassMat);
  stripe.position.set(0, 1.0, 0.65);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.55, 1.45), locoRedMat);
  cab.position.set(0, 1.32, -1.25);
  cab.castShadow = !lowSpec;
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.14, 1.6), darkIronMat);
  cabRoof.position.set(0, 2.14, -1.25);
  const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.52, 1.15), glassMat);
  cabGlass.position.set(0, 1.65, -1.25);
  const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 8), darkIronMat);
  smokestack.position.set(0, 1.95, 1.2);
  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 10), headlightMat);
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 1.35, 2.04);
  const rearLight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 10), headlightMat);
  rearLight.rotation.x = Math.PI / 2;
  rearLight.position.set(0, 1.4, -1.98);
  loco.add(chassis, noseBody, stripe, cab, cabRoof, cabGlass, smokestack, headlight, rearLight);

  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10);
  for (const wz of [-1.45, -0.55, 0.75, 1.55]) {
    for (const wx of [-0.62, 0.62]) {
      const w = new THREE.Mesh(wheelGeo, railSteelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.24, wz);
      loco.add(w);
      wheels.push(w);
    }
  }
  trainGroup.add(loco);

  // 2. Tier 1 Timber Log Flatcar Wagon (attached behind Locomotive)
  const wagon1 = new THREE.Group();
  wagon1.position.set(0, 0, -4.6);
  const flatBed1 = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.26, 3.8), darkIronMat);
  flatBed1.position.y = 0.36;
  const coupler1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.85), darkIronMat);
  coupler1.position.set(0, 0.34, 2.2);
  wagon1.add(flatBed1, coupler1);
  // Stacked timber logs on wagon1
  const logGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.3, 8);
  for (const [lx, ly] of [[-0.42, 0.72], [0, 0.72], [0.42, 0.72], [-0.22, 1.1], [0.22, 1.1]]) {
    const lg = new THREE.Mesh(logGeo, logBarkMat);
    lg.rotation.x = Math.PI / 2;
    lg.position.set(lx, ly, 0);
    wagon1.add(lg);
  }
  for (const wz of [-1.2, 1.2]) {
    for (const wx of [-0.62, 0.62]) {
      const w = new THREE.Mesh(wheelGeo, railSteelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.24, wz);
      wagon1.add(w);
      wheels.push(w);
    }
  }
  trainGroup.add(wagon1);

  // 3. Tier 2 & 3 High-Cube Container Freight Wagon
  const wagon2 = new THREE.Group();
  wagon2.position.set(0, 0, -8.9);
  wagon2.visible = false;
  const flatBed2 = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.26, 3.9), darkIronMat);
  flatBed2.position.y = 0.36;
  const coupler2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.85), darkIronMat);
  coupler2.position.set(0, 0.34, 2.25);
  const contBox1 = new THREE.Mesh(new THREE.BoxGeometry(1.44, 1.1, 3.5), contBlueMat);
  contBox1.position.set(0, 1.04, 0);
  contBox1.castShadow = !lowSpec;
  const contBox2 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.95, 3.45), contTealMat);
  contBox2.position.set(0, 2.06, 0);
  contBox2.visible = false; // unlocked at Tier 3 double-stack container train
  wagon2.add(flatBed2, coupler2, contBox1, contBox2);
  for (const wz of [-1.25, 1.25]) {
    for (const wx of [-0.62, 0.62]) {
      const w = new THREE.Mesh(wheelGeo, railSteelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.24, wz);
      wagon2.add(w);
      wheels.push(w);
    }
  }
  trainGroup.add(wagon2);

  g.add(trainGroup);
  g.userData = {
    depotGroup,
    trainGroup,
    wagon2,
    contBox2,
    wheels,
    headlightMat,
    glassMat,
    signalLamp,
    trackX,
    trackCenterZ,
    trackHalfSpan: 44.0
  };
  return g;
}

// ---------------------------------------------------------------------------
// 21. Phase 8: Twin-Turbine VIP Executive Helicopter & Illuminated Helipad
// ---------------------------------------------------------------------------
export function createHelicopterModel(tier = 1, lowSpec = false, livery = null) {
  const g = new THREE.Group();
  const hullColor = livery?.hull ?? (tier >= 3 ? 0x1e1b4b : tier === 2 ? 0x0f172a : 0xf8fafc);
  const trimColor = livery?.trim ?? (tier >= 3 ? 0xfbbf24 : tier === 2 ? 0x38bdf8 : 0x0284c7);
  const cabinColor = livery?.cabin ?? 0x38bdf8;

  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColor,
    roughness: 0.24,
    metalness: tier >= 3 ? 0.55 : 0.28
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.25,
    metalness: 0.68
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: cabinColor,
    roughness: 0.12,
    metalness: 0.45,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35
  });
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.65
  });
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
    roughness: 0.15
  });

  // Airframe rotated 180° around Y so nose faces +Z (matching forward flight vector sin(yaw), cos(yaw))
  const airframe = new THREE.Group();
  airframe.rotation.y = Math.PI;
  g.add(airframe);

  // Landing Skids
  for (const sx of [-0.88, 0.88]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.6, 8), rotorMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, 0.12, 0.1);
    const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.65, 6), rotorMat);
    strutF.position.set(sx * 0.85, 0.4, -0.75);
    strutF.rotation.z = sx > 0 ? 0.35 : -0.35;
    const strutR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.65, 6), rotorMat);
    strutR.position.set(sx * 0.85, 0.4, 0.85);
    strutR.rotation.z = sx > 0 ? 0.35 : -0.35;
    airframe.add(skid, strutF, strutR);
  }

  // Streamlined Fuselage & Nose Canopy (local -Z -> world +Z forward via airframe rotation)
  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.25, 3.2), hullMat);
  fuselage.position.set(0, 1.15, 0.15);
  fuselage.castShadow = !lowSpec;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 10), glassMat);
  nose.scale.set(0.96, 0.72, 1.35);
  nose.position.set(0, 1.12, -1.25);
  const beltStripe = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.18, 3.24), trimMat);
  beltStripe.position.set(0, 1.04, 0.15);
  const turbineHousing = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.48, 1.85), trimMat);
  turbineHousing.position.set(0, 1.94, 0.25);
  airframe.add(fuselage, nose, beltStripe, turbineHousing);

  // Tier 2 & 3 Side Sponsons / Executive Winglets
  if (tier >= 2) {
    const sponson = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.22, 0.85), trimMat);
    sponson.position.set(0, 0.86, 0.35);
    airframe.add(sponson);
  }

  // Tail Boom & Vertical Fin (local +Z -> world -Z aft via airframe rotation)
  const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 3.3, 8), hullMat);
  tailBoom.rotation.x = Math.PI / 2;
  tailBoom.position.set(0, 1.32, 3.1);
  const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.82), trimMat);
  vFin.position.set(0, 1.72, 4.55);
  vFin.rotation.x = -0.22;
  const tailStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), strobeMat);
  tailStrobe.position.set(0, 2.38, 4.65);
  airframe.add(tailBoom, vFin, tailStrobe);

  // Main Rotor Assembly (4 composite blades)
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 2.38, 0.18);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 8), rotorMat);
  mast.position.y = -0.15;
  const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.18, 10), trimMat);
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.05, 0.28), rotorMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 6.8), rotorMat);
  mainRotor.add(mast, hubCap, blade1, blade2);
  airframe.add(mainRotor);

  // Tail Rotor Assembly
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.18, 1.75, 4.6);
  const tBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 0.14), rotorMat);
  const tBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 1.25), rotorMat);
  tailRotor.add(tBlade1, tBlade2);
  airframe.add(tailRotor);

  g.userData = {
    mainRotor,
    tailRotor,
    hullMat,
    trimMat,
    glassMat
  };
  return g;
}

export function createHelipadModel(lowSpec = false) {
  const g = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78, metalness: 0.2 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    roughness: 0.32
  });
  const hMarkMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.55,
    roughness: 0.28
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.4,
    roughness: 0.15
  });

  // Octagonal / Circular Elevated Concrete Helipad Deck
  const baseSlab = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.24, 16), padMat);
  baseSlab.position.y = 0.12;
  baseSlab.receiveShadow = !lowSpec;
  g.add(baseSlab);

  const outerRing = new THREE.Mesh(new THREE.RingGeometry(3.35, 3.65, 24), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.25;
  g.add(outerRing);

  // Illuminated "H" Letter
  const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 2.3), hMarkMat);
  hLeft.position.set(-0.78, 0.25, 0);
  const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 2.3), hMarkMat);
  hRight.position.set(0.78, 0.25, 0);
  const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.04, 0.38), hMarkMat);
  hCross.position.set(0, 0.25, 0);
  g.add(hLeft, hRight, hCross);

  // 8 Perimeter LED Approach Beacons
  const beacons = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), beaconMat);
    b.position.set(Math.cos(a) * 3.95, 0.28, Math.sin(a) * 3.95);
    g.add(b);
    beacons.push(b);
  }

  g.userData = { ringMat, hMarkMat, beaconMat, beacons };
  return g;
}

// ---------------------------------------------------------------------------
// Phase 9: Living Island AI Civilian Pedestrian Models & Civic Promenade
// ---------------------------------------------------------------------------
let citizenGeos = null;
function getCitizenGeos() {
  if (citizenGeos) return citizenGeos;
  citizenGeos = {
    Briefcase: markShared(new THREE.BoxGeometry(0.32, 0.24, 0.1)),
    BriefcaseHandle: markShared(new THREE.BoxGeometry(0.12, 0.05, 0.04)),
    CameraBody: markShared(new THREE.BoxGeometry(0.22, 0.16, 0.14)),
    CameraLens: markShared(new THREE.CylinderGeometry(0.055, 0.055, 0.09, 8)),
    BlueprintTube: markShared(new THREE.CylinderGeometry(0.055, 0.055, 0.44, 8)),
    CoffeeCup: markShared(new THREE.CylinderGeometry(0.06, 0.045, 0.16, 8)),
    FlashlightBody: markShared(new THREE.CylinderGeometry(0.04, 0.045, 0.28, 8)),
    FlashlightBeam: markShared(new THREE.ConeGeometry(0.42, 1.5, 10, 1, true)),
    SunhatBrim: markShared(new THREE.CylinderGeometry(0.42, 0.44, 0.03, 12)),
    SailorCrown: markShared(new THREE.CylinderGeometry(0.27, 0.23, 0.15, 10)),
    Tie: markShared(new THREE.BoxGeometry(0.1, 0.36, 0.04))
  };
  citizenGeos.FlashlightBeam.translate(0, -0.78, 0);
  citizenGeos.FlashlightBeam.rotateX(-Math.PI / 2);
  return citizenGeos;
}

export function createCitizenModel(archDef = {}) {
  const pGeos = getPlayerGeos();
  const cGeos = getCitizenGeos();
  const root = new THREE.Group();
  root.add(makeContactShadow(0.82, 0.32));

  const skinTones = [0xf4c7a1, 0xe8b48b, 0xd69e72, 0xf7d7bc];
  const skinHex = skinTones[Math.abs((archDef.id || 'm').charCodeAt(0)) % skinTones.length];

  const mats = {
    skin: new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.65 }),
    suit: new THREE.MeshStandardMaterial({ color: archDef.suitColor || 0x1e3a8a, roughness: 0.68 }),
    pants: new THREE.MeshStandardMaterial({ color: archDef.pantsColor || 0x0f172a, roughness: 0.8 }),
    accent: new THREE.MeshStandardMaterial({ color: archDef.accentColor || 0xf59e0b, roughness: 0.35, metalness: 0.45 }),
    hat: new THREE.MeshStandardMaterial({ color: archDef.hatColor || 0x1e293b, roughness: 0.42 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.86 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.75 }),
    beam: new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  };

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.17, 0.72, 0);
  const lThigh = new THREE.Mesh(pGeos.thigh, mats.pants);
  lThigh.position.y = -0.28;
  lThigh.castShadow = true;
  const lBoot = new THREE.Mesh(pGeos.boot, mats.boot);
  lBoot.position.set(0, -0.62, 0.04);
  leftLeg.add(lThigh, lBoot);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.17, 0.72, 0);
  const rThigh = new THREE.Mesh(pGeos.thigh, mats.pants);
  rThigh.position.y = -0.28;
  rThigh.castShadow = true;
  const rBoot = new THREE.Mesh(pGeos.boot, mats.boot);
  rBoot.position.set(0, -0.62, 0.04);
  rightLeg.add(rThigh, rBoot);
  root.add(rightLeg);

  const torso = new THREE.Group();
  torso.position.set(0, 0.76, 0);
  root.add(torso);

  const chest = new THREE.Mesh(pGeos.chest, mats.suit);
  chest.position.y = 0.39;
  chest.castShadow = true;
  torso.add(chest);

  const vestOrTrim = new THREE.Mesh(pGeos.vest, mats.accent);
  vestOrTrim.position.y = 0.44;
  torso.add(vestOrTrim);

  if (archDef.group === 'commerce' || archDef.group === 'investors') {
    const tie = new THREE.Mesh(cGeos.Tie, mats.accent);
    tie.position.set(0, 0.44, 0.22);
    torso.add(tie);
  }

  const belt = new THREE.Mesh(pGeos.belt, mats.boot);
  belt.position.y = 0.06;
  torso.add(belt);

  const head = new THREE.Group();
  head.position.set(0, 0.98, 0);
  torso.add(head);

  const skull = new THREE.Mesh(pGeos.skull, mats.skin);
  skull.castShadow = true;
  head.add(skull);

  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(pGeos.eye, pGeos.eyeMat);
    eye.position.set(ex, 0.03, 0.23);
    head.add(eye);
  });

  // Archetype headwear
  const hatCrown = new THREE.Mesh(
    archDef.hatStyle === 'sailor' ? cGeos.SailorCrown : pGeos.helmet,
    mats.hat
  );
  hatCrown.position.y = 0.26;
  head.add(hatCrown);

  if (archDef.hatStyle === 'sunhat' || archDef.hatStyle === 'fedora') {
    const brim = new THREE.Mesh(cGeos.SunhatBrim, mats.hat);
    brim.position.y = 0.2;
    if (archDef.hatStyle === 'fedora') brim.scale.set(0.8, 1, 0.8);
    head.add(brim);
  } else if (archDef.hatStyle === 'cap' || archDef.hatStyle === 'hardhat') {
    const visor = new THREE.Mesh(pGeos.brim, mats.hat);
    visor.position.set(0, 0.19, 0.12);
    head.add(visor);
  }

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.47, 0.68, 0);
  const lArmMesh = new THREE.Mesh(pGeos.arm, mats.suit);
  lArmMesh.position.y = -0.26;
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.47, 0.68, 0);
  const rArmMesh = new THREE.Mesh(pGeos.arm, mats.suit);
  rArmMesh.position.y = -0.26;
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);
  torso.add(rightArm);

  // Archetype 3D Hand / Chest Props
  let flashlightBeam = null;
  if (archDef.prop === 'briefcase') {
    const bc = new THREE.Group();
    bc.position.set(-0.08, -0.58, 0.04);
    const body = new THREE.Mesh(cGeos.Briefcase, mats.accent);
    body.rotation.y = Math.PI / 2;
    const hdl = new THREE.Mesh(cGeos.BriefcaseHandle, mats.boot);
    hdl.rotation.y = Math.PI / 2;
    hdl.position.y = 0.14;
    bc.add(body, hdl);
    leftArm.add(bc);
  } else if (archDef.prop === 'camera') {
    const cam = new THREE.Group();
    cam.position.set(0, 0.42, 0.27);
    const cBody = new THREE.Mesh(cGeos.CameraBody, mats.darkMetal);
    const cLens = new THREE.Mesh(cGeos.CameraLens, mats.accent);
    cLens.rotation.x = Math.PI / 2;
    cLens.position.z = 0.09;
    cam.add(cBody, cLens);
    torso.add(cam);
  } else if (archDef.prop === 'blueprint') {
    const tube = new THREE.Mesh(cGeos.BlueprintTube, mats.hat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(-0.06, -0.54, 0.12);
    leftArm.add(tube);
  } else if (archDef.prop === 'coffee') {
    const cup = new THREE.Mesh(cGeos.CoffeeCup, mats.hat);
    cup.position.set(0, -0.52, 0.16);
    leftArm.add(cup);
  } else if (archDef.prop === 'flashlight') {
    const fl = new THREE.Group();
    fl.position.set(0, -0.52, 0.16);
    const flBody = new THREE.Mesh(cGeos.FlashlightBody, mats.darkMetal);
    flBody.rotation.x = Math.PI / 2;
    flashlightBeam = new THREE.Mesh(cGeos.FlashlightBeam, mats.beam);
    flashlightBeam.position.z = 0.14;
    flashlightBeam.visible = false;
    fl.add(flBody, flashlightBeam);
    rightArm.add(fl);
  }

  root.scale.setScalar(0.84);
  root.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    head,
    flashlightBeam
  };
  return root;
}

export function createCivicPromenadeModel(lowSpec = false) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a5b25, roughness: 0.72 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, flatShading: true });
  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
    roughness: 0.2
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.85
  });
  const parasolRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.6, flatShading: true });
  const parasolCyanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, flatShading: true });

  // Tier 1: Harbor & Central Avenue Park Benches, Planters & Warm Street Bollards
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const benchCoords = [
    [-6.5, 5.5, 0], [6.5, 5.5, 0], [-6.5, 16.5, 0], [6.5, 16.5, 0],
    [-11.5, 22.8, Math.PI], [5.5, 22.8, Math.PI]
  ];
  for (const [bx, bz, rotY] of benchCoords) {
    const bench = new THREE.Group();
    bench.position.set(bx, 0, bz);
    bench.rotation.y = rotY;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.48), woodMat);
    seat.position.y = 0.42;
    seat.castShadow = !lowSpec;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.08), woodMat);
    back.position.set(0, 0.66, -0.2);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.44), ironMat);
    legL.position.set(-0.62, 0.21, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.44), ironMat);
    legR.position.set(0.62, 0.21, 0);
    bench.add(seat, back, legL, legR);
    tier1Group.add(bench);

    // Adjacent planter box + bollard lamp
    const planter = new THREE.Group();
    planter.position.set(bx + (bx < 0 ? -1.35 : 1.35), 0, bz);
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.72), stoneMat);
    pot.position.y = 0.24;
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), foliageMat);
    bush.position.y = 0.68;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), ironMat);
    post.position.set(0, 1.1, 0.55);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), lampGlowMat);
    lantern.position.set(0, 2.25, 0.55);
    planter.add(pot, bush, post, lantern);
    tier1Group.add(planter);
  }
  g.add(tier1Group);

  // Tier 2: Harbor Boardwalk Café Tables, Striped Parasols & Tourist Kiosk
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const cafeSpots = [
    [-14.5, 20.8], [-9.2, 20.8], [7.8, 20.8], [12.4, 20.8]
  ];
  cafeSpots.forEach(([cx, cz], idx) => {
    const cafe = new THREE.Group();
    cafe.position.set(cx, 0, cz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), ironMat);
    pole.position.y = 1.15;
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 10), woodMat);
    table.position.y = 0.74;
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 0.55, 8),
      idx % 2 === 0 ? parasolRedMat : parasolCyanMat
    );
    canopy.position.y = 2.32;
    canopy.castShadow = !lowSpec;
    cafe.add(pole, table, canopy);
    tier2Group.add(cafe);
  });

  // Harbor Tourist Welcome Kiosk near Central Plaza
  const kiosk = new THREE.Group();
  kiosk.position.set(-5.8, 0, 11.2);
  const kBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 1.1, 8), woodMat);
  kBase.position.y = 0.55;
  const kGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 1.1, 8), lampGlowMat);
  kGlass.position.y = 1.45;
  const kRoof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.85, 8), parasolCyanMat);
  kRoof.position.y = 2.35;
  kiosk.add(kBase, kGlass, kRoof);
  tier2Group.add(kiosk);
  g.add(tier2Group);

  // Tier 3: Golden Wall Street Harbor Arch & Royal Maritime Monument
  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const arch = new THREE.Group();
  arch.position.set(0, 0, 21.6);
  const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 4.8, 8), ironMat);
  colL.position.set(-3.4, 2.4, 0);
  const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 4.8, 8), ironMat);
  colR.position.set(3.4, 2.4, 0);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.62, 0.58), goldMat);
  beam.position.set(0, 4.95, 0);
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), goldMat);
  crest.position.set(0, 5.65, 0);
  arch.add(colL, colR, beam, crest);
  tier3Group.add(arch);

  // Golden Bull / Maritime Sphere Monument in Central Plaza
  const monument = new THREE.Group();
  monument.position.set(5.8, 0, 11.2);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.2, 1.1, 8), stoneMat);
  ped.position.y = 0.55;
  const globe = new THREE.Mesh(new THREE.TorusKnotGeometry(0.52, 0.14, 28, 6), goldMat);
  globe.position.y = 1.85;
  monument.add(ped, globe);
  tier3Group.add(monument);
  g.add(tier3Group);

  g.userData = {
    tier1Group,
    tier2Group,
    tier3Group,
    lampGlowMat,
    globe
  };
  return g;
}

export function createLoggingTruckModel(cabColor = 0xea580c, lowSpec = false) {
  const g = new THREE.Group();
  const cabMat = new THREE.MeshStandardMaterial({ color: cabColor, roughness: 0.36, metalness: 0.25 });
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.58, metalness: 0.55 });
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.78 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.14, metalness: 0.45, transparent: true, opacity: 0.8 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35, metalness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.82 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.85 });
  const logMat = new THREE.MeshStandardMaterial({ color: 0xb96832, roughness: 0.82 });
  const logEndMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.76 });

  // Heavy chassis frame along +Z (nose at +Z)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.36, 5.8), chassisMat);
  chassis.position.set(0, 0.62, 0);
  chassis.castShadow = !lowSpec;

  // Front Cab (+Z)
  const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.05, 1.85), cabMat);
  cabLower.position.set(0, 1.32, 1.92);
  cabLower.castShadow = !lowSpec;

  const cabUpper = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.86, 1.5), cabMat);
  cabUpper.position.set(0, 2.22, 1.78);
  cabUpper.castShadow = !lowSpec;

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.66, 0.12), glassMat);
  windshield.position.set(0, 2.24, 2.52);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.32, 0.28), chromeMat);
  bumper.position.set(0, 0.68, 2.96);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.56, 0.1), chassisMat);
  grille.position.set(0, 1.24, 2.86);

  const hlGeo = new THREE.BoxGeometry(0.32, 0.22, 0.1);
  for (const hx of [-0.78, 0.78]) {
    const hl = new THREE.Mesh(hlGeo, lampMat);
    hl.position.set(hx, 1.12, 2.88);
    g.add(hl);
  }

  // Roof amber warning strobe
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 8), lampMat);
  beacon.position.set(0, 2.76, 1.85);

  // Rear Timber Flatbed (-Z)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.22, 3.75), bedMat);
  bed.position.set(0, 0.92, -1.02);
  bed.castShadow = !lowSpec;

  // Steel side log-retaining stakes
  const stakeGeo = new THREE.BoxGeometry(0.1, 1.15, 0.12);
  for (const sx of [-1.08, 1.08]) {
    for (const sz of [-2.55, -1.1, 0.35]) {
      const stake = new THREE.Mesh(stakeGeo, chassisMat);
      stake.position.set(sx, 1.54, sz);
      g.add(stake);
    }
  }

  // 6 Wheels (front axle + dual rear axles)
  const wheels = [];
  const tireGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 12);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8);
  rimGeo.rotateZ(Math.PI / 2);
  for (const wz of [1.95, -0.85, -2.05]) {
    for (const wx of [-1.1, 1.1]) {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, 0.46, wz);
      wGroup.add(new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(rimGeo, rimMat));
      g.add(wGroup);
      wheels.push(wGroup);
    }
  }

  // Stacked Timber Log Cargo Load (toggled visible when truck carries wood)
  const cargoVisual = new THREE.Group();
  cargoVisual.position.set(0, 1.32, -1.05);
  const logCargoFallback = new THREE.Group();
  const logGeo = new THREE.CylinderGeometry(0.24, 0.25, 3.2, 8);
  logGeo.rotateX(Math.PI / 2);
  const logOffsets = [
    [-0.58, 0.22], [0, 0.22], [0.58, 0.22],
    [-0.28, 0.62], [0.28, 0.62]
  ];
  for (const [lx, ly] of logOffsets) {
    const log = new THREE.Mesh(logGeo, [logMat, logEndMat, logEndMat]);
    log.position.set(lx, ly, 0);
    log.castShadow = !lowSpec;
    logCargoFallback.add(log);
  }
  cargoVisual.add(logCargoFallback);
  mountNormalizedGlb(cargoVisual, FOREST_ASSETS.logPile, {
    targetFootprint: 2.35,
    yaw: Math.PI / 2,
    yOffset: -0.08,
    placeholder: logCargoFallback
  });
  g.add(cargoVisual);

  // Hired AI Driver Indicator
  const driverVisual = new THREE.Group();
  driverVisual.position.set(0, 3.05, 1.6);
  const aiOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.85 })
  );
  driverVisual.add(aiOrb);
  driverVisual.visible = false;
  g.add(driverVisual);

  const fallbackBody = new THREE.Group();
  fallbackBody.add(chassis, cabLower, cabUpper, windshield, bumper, grille, beacon, bed);
  for (const w of wheels) fallbackBody.add(w);
  g.add(fallbackBody);

  // Mount real vintage green Meshy Pro Forest Log Truck GLB
  const truckGlbSlot = new THREE.Group();
  g.add(truckGlbSlot);
  mountNormalizedGlb(truckGlbSlot, FOREST_ASSETS.forestLogTruck, {
    targetFootprint: 6.4,
    yaw: 0,
    placeholder: fallbackBody
  });

  g.userData = { wheels, cargoVisual, driverVisual, beacon };
  return g;
}

export function createLogHandcartModel(lowSpec = false) {
  const g = new THREE.Group();
  g.add(makeContactShadow(1.4, 0.35));

  const fallback = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.8, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.86 })
  );
  fallback.position.y = 0.55;
  fallback.castShadow = !lowSpec;
  g.add(fallback);

  const glbSlot = new THREE.Group();
  g.add(glbSlot);
  mountNormalizedGlb(glbSlot, FOREST_ASSETS.logHandcart, {
    targetFootprint: 3.1,
    yaw: Math.PI / 2,
    placeholder: fallback
  });

  const cargoVisual = new THREE.Group();
  cargoVisual.position.set(0, 1.05, -0.15);
  mountNormalizedGlb(cargoVisual, FOREST_ASSETS.plankBundle, { targetFootprint: 1.5, yaw: Math.PI / 2 });
  g.add(cargoVisual);

  const driverVisual = new THREE.Group();
  driverVisual.position.set(0, 2.35, 0);
  const aiOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.85 })
  );
  driverVisual.add(aiOrb);
  driverVisual.visible = false;
  g.add(driverVisual);

  g.userData = { wheels: [], cargoVisual, driverVisual };
  return g;
}



