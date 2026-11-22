/**
 * TimberPort 3D — Stylized Low-Poly PBR Composite Model Builders
 * Shared GPU Geometries & Materials, Object-Pooled Backpacks, and Explicit Disposal
 * Zero per-frame geometry/material/texture allocations for <8GB RAM & Intel HD GPUs
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getBarkTexture, getTimberTexture, getTravertineTexture } from './textures.js';

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
  const group = playerModel?.userData?.logStackGroup;
  if (!group) return;
  const shown = Math.min(count, group.children.length);
  for (let i = 0; i < group.children.length; i++) {
    group.children[i].visible = i < shown;
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
            obj.castShadow = false;
            obj.receiveShadow = true;
            obj.frustumCulled = true;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (!m) continue;
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
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
    placeholder = null
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

  axe.scale.setScalar(scale);
  return axe;
}

// Builds a 13-bone humanoid skeleton & smooth-weighted SkinnedMeshes for static A-pose GLB models
function buildAutoHumanoidRig(model, normH, lowSpec = false) {
  const s = normH / 2.1;

  // Bone indices:
  // 0:hips, 1:spine, 2:chest, 3:neck, 4:head,
  // 5:upperArmL, 6:foreArmL, 7:upperArmR, 8:foreArmR,
  // 9:thighL, 10:shinL, 11:thighR, 12:shinR
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

  const neck = new THREE.Bone();
  neck.name = 'neck';
  neck.position.set(0, 0.24 * s, 0);
  chest.add(neck);

  const head = new THREE.Bone();
  head.name = 'head';
  head.position.set(0, 0.12 * s, 0.02 * s);
  neck.add(head);

  const upperArmL = new THREE.Bone();
  upperArmL.name = 'upperArmL';
  upperArmL.position.set(0.22 * s, 0.12 * s, -0.05 * s);
  chest.add(upperArmL);

  const foreArmL = new THREE.Bone();
  foreArmL.name = 'foreArmL';
  foreArmL.position.set(0.22 * s, -0.21 * s, -0.02 * s);
  upperArmL.add(foreArmL);

  const upperArmR = new THREE.Bone();
  upperArmR.name = 'upperArmR';
  upperArmR.position.set(-0.22 * s, 0.12 * s, -0.05 * s);
  chest.add(upperArmR);

  const foreArmR = new THREE.Bone();
  foreArmR.name = 'foreArmR';
  foreArmR.position.set(-0.22 * s, -0.21 * s, -0.02 * s);
  upperArmR.add(foreArmR);

  const thighL = new THREE.Bone();
  thighL.name = 'thighL';
  thighL.position.set(0.15 * s, -0.02 * s, 0);
  hips.add(thighL);

  const shinL = new THREE.Bone();
  shinL.name = 'shinL';
  shinL.position.set(0.02 * s, -0.42 * s, -0.01 * s);
  thighL.add(shinL);

  const thighR = new THREE.Bone();
  thighR.name = 'thighR';
  thighR.position.set(-0.15 * s, -0.02 * s, 0);
  hips.add(thighR);

  const shinR = new THREE.Bone();
  shinR.name = 'shinR';
  shinR.position.set(-0.02 * s, -0.42 * s, -0.01 * s);
  thighR.add(shinR);

  // Hand anchor on right forearm for the PBR lumberjack axe
  const handRAnchor = new THREE.Group();
  handRAnchor.name = 'handRAnchor';
  handRAnchor.position.set(-0.20 * s, -0.20 * s, 0.10 * s);
  handRAnchor.rotation.set(0.22, -0.10, -0.58);
  foreArmR.add(handRAnchor);

  const axeMesh = createHeroLumberjackAxe(s * 1.04, lowSpec);
  handRAnchor.add(axeMesh);

  const boneList = [
    hips, spine, chest, neck, head,
    upperArmL, foreArmL, upperArmR, foreArmR,
    thighL, shinL, thighR, shinR
  ];

  const rigRoot = new THREE.Group();
  rigRoot.name = 'AutoHumanoidRig';
  rigRoot.add(hips);
  rigRoot.updateMatrixWorld(true);

  const skeleton = new THREE.Skeleton(boneList);

  // Collect source meshes from normalized static model
  model.updateMatrixWorld(true);
  const sourceMeshes = [];
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      sourceMeshes.push(child);
    }
  });

  // Reusable per-vertex accumulator for top-4 bone weights
  const wBuf = new Float32Array(13);
  const idx4 = [0, 0, 0, 0];
  const val4 = [0, 0, 0, 0];

  const writeTop4 = (skinIndices, skinWeights, vIdx) => {
    idx4[0] = idx4[1] = idx4[2] = idx4[3] = 0;
    val4[0] = val4[1] = val4[2] = val4[3] = 0;
    for (let b = 0; b < 13; b++) {
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
  for (const src of sourceMeshes) {
    const geo = src.geometry.clone();
    geo.applyMatrix4(src.matrixWorld);
    const pos = geo.attributes.position;
    if (!pos) {
      geo.dispose();
      continue;
    }

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

      if (isEye) {
        wBuf[4] = 1;
      } else if (isBasket) {
        wBuf[2] = 1;
      } else if (isHair) {
        const wHead = smoothstep(1.56, 1.78, ny);
        wBuf[4] = wHead;
        wBuf[2] = 1 - wHead;
      } else if (isBootsMesh) {
        wBuf[nx >= 0 ? 10 : 12] = 1;
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
          wBuf[9] = legShare * sideL;
          wBuf[11] = legShare * (1 - sideL);
        }
      } else if (ny < 1.04) {
        // Lower body (pelvis -> thighs -> shins)
        const tLeg = smoothstep(1.05, 0.90, ny);
        const sideL = smoothstep(-0.04, 0.04, nx);
        const tKnee = smoothstep(0.65, 0.51, ny);
        wBuf[0] = 1 - tLeg;
        const wThigh = tLeg * (1 - tKnee);
        const wShin = tLeg * tKnee;
        wBuf[9] = wThigh * sideL;
        wBuf[10] = wShin * sideL;
        wBuf[11] = wThigh * (1 - sideL);
        wBuf[12] = wShin * (1 - sideL);
      } else {
        // Upper body + A-pose arms + neck + head
        const absX = Math.abs(nx);
        const armFactor =
          smoothstep(0.175, 0.275, absX) *
          smoothstep(1.82, 1.70, ny) *
          smoothstep(1.02, 1.12, ny);

        if (armFactor > 0.001) {
          // Projection along shoulder -> elbow axis (0 at shoulder, 1 at elbow, 2 at hand)
          const u = ((absX - 0.22) * 0.22 + (1.65 - ny) * 0.21) / (0.22 * 0.22 + 0.21 * 0.21);
          const foreBlend = smoothstep(0.82, 1.18, u);
          const upperIdx = nx >= 0 ? 5 : 7;
          const foreIdx = nx >= 0 ? 6 : 8;
          wBuf[upperIdx] += armFactor * (1 - foreBlend);
          wBuf[foreIdx] += armFactor * foreBlend;
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
    // Skip shadow-map pass on 83k-vert skinned GLB (contact shadow disc grounds the player cleanly at 0 GPU cost)
    skinned.castShadow = false;
    skinned.receiveShadow = !lowSpec;
    skinned.frustumCulled = false;
    skinned.bind(skeleton);
    rigRoot.add(skinned);
    meshCount++;
  }

  // Dispose replaced static geometries (keep materials which are now shared with SkinnedMeshes)
  for (const src of sourceMeshes) {
    if (src.geometry && !src.geometry.userData?.shared) {
      src.geometry.dispose();
    }
  }

  return {
    rigRoot,
    skeleton,
    meshCount,
    scale: s,
    hipsRestY: 1.02 * s,
    handRAnchor,
    axeMesh,
    bones: {
      hips, spine, chest, neck, head,
      upperArmL, foreArmL, upperArmR, foreArmR,
      thighL, shinL, thighR, shinR
    },
    state: {
      moveBlend: 0,
      chopBlend: 0,
      phase: 0,
      breathPhase: 0,
      idleLookPhase: 0
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
              child.castShadow = false;
              child.receiveShadow = !lowSpec;
              child.frustumCulled = false;
              const matsList = Array.isArray(child.material) ? child.material : [child.material];
              for (const m of matsList) {
                if (!m) continue;
                if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                if (typeof m.envMapIntensity === 'number') {
                  m.envMapIntensity = 0.88;
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

            // Attach backpack log stack to chest bone & VIP crown to head bone
            rig.bones.chest.add(ud.glbLogAnchor);
            ud.glbLogAnchor.position.set(0, 0.04 * rig.scale, -0.44 * rig.scale);
            rig.bones.head.add(ud.glbCrownAnchor);
            ud.glbCrownAnchor.position.set(0, 0.30 * rig.scale, 0.02 * rig.scale);
          }

          setPlayerGlbYawOffset(playerModel, yawOffset);

          ud.glbLoaded = true;
          setPlayerGlbActive(playerModel, useGlb);

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
      // Articulated 13-bone human biomechanical animation (zero GC)
      const rig = ud.glbRig;
      const b = rig.bones;
      const st = rig.state;
      const clampedDt = Math.min(dt, 0.05);
      const carryRatio = options ? (options.carryRatio || 0) : 0;
      const speedMult = options ? (options.speedMult || 1) : 1;

      // Reset outer wrapper transforms cleanly
      anim.position.set(0, 0, 0);
      anim.rotation.set(0, 0, 0);
      anim.scale.set(1, 1, 1);

      // Smooth locomotive & chop blend states
      const targetMove = moving ? 1 : 0;
      const moveRate = moving ? 11 : 8.5;
      st.moveBlend += (targetMove - st.moveBlend) * (1 - Math.exp(-moveRate * clampedDt));
      if (st.moveBlend < 0.001 && !moving) st.moveBlend = 0;

      const targetChop = chopSwing > 0 ? smoothstep(0.0, 0.18, chopSwing) : 0;
      const chopRate = chopSwing > 0 ? 28 : 11;
      st.chopBlend += (targetChop - st.chopBlend) * (1 - Math.exp(-chopRate * clampedDt));
      if (st.chopBlend < 0.001 && chopSwing <= 0) st.chopBlend = 0;

      // Advance gait cycle smoothly while moving; settle feet cleanly when stopping
      if (moving) {
        st.phase += clampedDt * (9.2 * Math.max(0.75, Math.min(1.55, speedMult)));
      } else if (st.moveBlend > 0.005) {
        const nearestRest = Math.round(st.phase / Math.PI) * Math.PI;
        st.phase += (nearestRest - st.phase) * (1 - Math.exp(-10 * clampedDt));
      }

      st.breathPhase += clampedDt * (2.15 + st.moveBlend * 1.45);
      st.idleLookPhase += clampedDt * 0.68;

      const m = st.moveBlend;
      const idle = 1 - m;
      const ch = st.chopBlend;
      const p = st.phase;
      const sp = Math.sin(p);
      const cp = Math.cos(p);
      const breath = Math.sin(st.breathPhase);
      const shift = Math.sin(elapsed * 0.85);
      const s = rig.scale;

      // --- 1. Pelvis / Hips ---
      const idleHipY = rig.hipsRestY + breath * 0.007 * s;
      const walkHipY = rig.hipsRestY + (Math.abs(sp) * 0.056 - 0.026) * s;
      let hipY = idleHipY * idle + walkHipY * m;
      let hipX = (shift * 0.015 * idle - cp * 0.025 * m) * s;
      let hipZ = 0;
      let hipRx = 0.015 * idle + 0.05 * m;
      let hipRy = sp * 0.115 * m;
      let hipRz = shift * 0.022 * idle - sp * 0.048 * m;

      // --- 2. Spine & Chest (counter-rotation + carry lean + breathing) ---
      let spineRx = (0.025 + carryRatio * 0.075 + breath * 0.016) * idle + (0.095 + carryRatio * 0.095 + Math.abs(cp) * 0.028) * m;
      let spineRy = -sp * 0.09 * m;
      let spineRz = -shift * 0.014 * idle + sp * 0.026 * m;

      let chestRx = (-0.015 + breath * 0.028) * idle + (0.055 + carryRatio * 0.045 + breath * 0.014) * m;
      let chestRy = Math.sin(elapsed * 0.58) * 0.042 * idle - sp * 0.135 * m;
      let chestRz = -shift * 0.012 * idle + sp * 0.022 * m;

      // --- 3. Neck & Head (natural scanning on idle, gaze stabilization while walking) ---
      const lookYaw = (Math.sin(st.idleLookPhase) * 0.17 + Math.sin(st.idleLookPhase * 0.43) * 0.08) * idle;
      const lookPitch = Math.sin(st.idleLookPhase * 0.71) * 0.042 * idle;
      const lookTilt = Math.sin(st.idleLookPhase * 0.54) * 0.036 * idle;

      let neckRx = -0.02 * m;
      let neckRy = lookYaw * 0.35 + sp * 0.075 * m;
      let neckRz = lookTilt * 0.35;

      let headRx = lookPitch - (0.095 + carryRatio * 0.05) * m;
      let headRy = lookYaw * 0.65 + sp * 0.09 * m;
      let headRz = lookTilt * 0.65 - sp * 0.02 * m;

      // --- 4. Legs (relaxed athletic stance <-> alternating human stride with realistic knee flexion) ---
      const kneeLiftL = Math.max(0.05, Math.sin(p - 0.85) * 0.50 + 0.42);
      const kneeLiftR = Math.max(0.05, Math.sin(p + Math.PI - 0.85) * 0.50 + 0.42);

      let thighLRx = -0.04 * idle + (-sp * 0.62) * m;
      let thighLRy = 0.05 * idle;
      let thighLRz = 0.03 * idle + 0.02 * m;
      let shinLRx = 0.08 * idle + kneeLiftL * m;

      let thighRRx = 0.045 * idle + (sp * 0.62) * m;
      let thighRRy = -0.05 * idle;
      let thighRRz = -0.03 * idle - 0.02 * m;
      let shinRRx = 0.04 * idle + kneeLiftR * m;

      // --- 5. Arms (relaxed out of A-pose <-> opposite-phase swing + dynamic elbow bend) ---
      // Default A-pose arms are lowered with upperArmL.rz ~ -0.64 and upperArmR.rz ~ +0.58
      let uArmLRx = (0.05 + breath * 0.025) * idle + (sp * 0.58 + 0.05) * m;
      let uArmLRy = 0.08 * idle + 0.04 * m;
      let uArmLRz = -0.64 - breath * 0.025 * idle - 0.04 * m;

      const elbowFlexL = 0.22 * idle + (0.28 + Math.max(0, -sp) * 0.42) * m;
      let fArmLRx = -elbowFlexL * 0.65;
      let fArmLRy = -elbowFlexL * 0.65;
      let fArmLRz = -0.04;

      // Right arm holds the PBR lumberjack axe naturally at the ready
      let uArmRRx = (-0.16 + breath * 0.022) * idle + (-sp * 0.44 - 0.12) * m;
      let uArmRRy = -0.08 * idle - 0.04 * m;
      let uArmRRz = 0.58 + breath * 0.022 * idle + 0.03 * m;

      const elbowFlexR = 0.38 * idle + (0.36 + Math.max(0, sp) * 0.34) * m;
      let fArmRRx = -elbowFlexR * 0.65;
      let fArmRRy = elbowFlexR * 0.65;
      let fArmRRz = 0.05;

      // --- 6. Full-Body Athletic Lumberjack Axe Chop Overlay ---
      if (ch > 0.001) {
        const t = 1 - Math.max(0, Math.min(1, chopSwing));
        // Phase A: explosive overhead wind-up (t: 0 -> 0.34)
        const windUp = smoothstep(0.0, 0.26, t) * (1 - smoothstep(0.28, 0.46, t));
        // Phase B: powerful diagonal downswing & impact strike (t: 0.28 -> 0.88)
        const strike = smoothstep(0.26, 0.54, t) * (1 - smoothstep(0.68, 1.0, t));

        // Grounded athletic stance & knee drive on strike
        hipY += (windUp * 0.022 - strike * 0.068) * s * ch;
        hipZ += (strike * 0.04 - windUp * 0.02) * s * ch;
        hipRy += (-windUp * 0.18 + strike * 0.16) * ch;

        // Torso coil right on wind-up -> whip forward & left into tree trunk on strike
        spineRx += (-windUp * 0.14 + strike * 0.30) * ch;
        spineRy += (-windUp * 0.30 + strike * 0.28) * ch;
        chestRx += (-windUp * 0.16 + strike * 0.24) * ch;
        chestRy += (-windUp * 0.38 + strike * 0.34) * ch;
        chestRz += (windUp * 0.08 - strike * 0.12) * ch;

        // Keep head locked forward on the target trunk
        headRy += (windUp * 0.46 - strike * 0.42) * ch;
        headRx += (windUp * 0.12 - strike * 0.18) * ch;

        // Braced leg drive during impact
        thighLRx += (-strike * 0.16) * ch;
        shinLRx += (strike * 0.24) * ch;
        thighRRx += (strike * 0.14) * ch;
        shinRRx += (strike * 0.18) * ch;

        // Right arm: high overhead axe raise -> explosive diagonal slash down
        const chopUArmRRx = -windUp * 2.05 + strike * 0.56 - 0.35;
        const chopUArmRRy = -windUp * 0.28 + strike * 0.42;
        const chopUArmRRz = 0.56 - windUp * 0.32 - strike * 0.16;
        const chopElbowR = 0.88 * windUp + 0.18 * strike + 0.14;

        uArmRRx = uArmRRx * (1 - ch) + chopUArmRRx * ch;
        uArmRRy = uArmRRy * (1 - ch) + chopUArmRRy * ch;
        uArmRRz = uArmRRz * (1 - ch) + chopUArmRRz * ch;
        fArmRRx = fArmRRx * (1 - ch) + (-chopElbowR * 0.65) * ch;
        fArmRRy = fArmRRy * (1 - ch) + (chopElbowR * 0.65) * ch;

        // Left arm: counterbalance sweep
        const chopUArmLRx = -windUp * 0.72 + strike * 0.48;
        const chopUArmLRz = -0.64 + windUp * 0.26 - strike * 0.14;
        const chopElbowL = 0.62 * windUp + 0.30 * strike + 0.22;

        uArmLRx = uArmLRx * (1 - ch) + chopUArmLRx * ch;
        uArmLRz = uArmLRz * (1 - ch) + chopUArmLRz * ch;
        fArmLRx = fArmLRx * (1 - ch) + (-chopElbowL * 0.65) * ch;
        fArmLRy = fArmLRy * (1 - ch) + (-chopElbowL * 0.65) * ch;
      }

      // Apply pose to 13-bone skeleton
      b.hips.position.set(hipX, hipY, hipZ);
      b.hips.rotation.set(hipRx, hipRy, hipRz);

      b.spine.rotation.set(spineRx, spineRy, spineRz);
      b.chest.rotation.set(chestRx, chestRy, chestRz);
      b.neck.rotation.set(neckRx, neckRy, neckRz);
      b.head.rotation.set(headRx, headRy, headRz);

      b.thighL.rotation.set(thighLRx, thighLRy, thighLRz);
      b.shinL.rotation.set(shinLRx, 0, 0);
      b.thighR.rotation.set(thighRRx, thighRRy, thighRRz);
      b.shinR.rotation.set(shinRRx, 0, 0);

      b.upperArmL.rotation.set(uArmLRx, uArmLRy, uArmLRz);
      b.foreArmL.rotation.set(fArmLRx, fArmLRy, fArmLRz);
      b.upperArmR.rotation.set(uArmRRx, uArmRRy, uArmRRz);
      b.foreArmR.rotation.set(fArmRRx, fArmRRy, fArmRRz);
      return;
    }

    // Fallback for pre-skinned GLB without embedded AnimationClips
    const damp = 1 - Math.exp(-14 * dt);
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
    }

    anim.position.y += (targetY - anim.position.y) * damp;
    anim.rotation.x += (targetRotX - anim.rotation.x) * damp;
    anim.rotation.y += (targetRotY - anim.rotation.y) * damp;
    anim.rotation.z += (targetRotZ - anim.rotation.z) * damp;
    anim.scale.y += (targetScaleY - anim.scale.y) * damp;
    return;
  }

  // Fallback / Classic procedural humanoid limb animation
  const { leftLeg, rightLeg, leftArm, rightArm } = ud;
  if (!leftLeg || !rightLeg || !leftArm || !rightArm) return;
  const swing = moving ? Math.sin(walkPhase) * 0.65 : 0;
  leftLeg.rotation.x = swing;
  rightLeg.rotation.x = -swing;
  leftArm.rotation.x = -swing * 0.7;
  if (chopSwing > 0) {
    rightArm.rotation.x = -Math.sin(chopSwing * Math.PI) * 1.45;
  } else {
    rightArm.rotation.x = swing * 0.7;
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

export function createTreeModel(kind = 'pine') {
  const assets = getTreeAssets(kind);
  const g = new THREE.Group();

  const rootFlare = new THREE.Mesh(assets.rootGeo, assets.barkMat);
  rootFlare.position.y = 0.22;
  g.add(rootFlare);

  const trunk = new THREE.Mesh(assets.trunkGeo, assets.barkMat);
  trunk.position.y = assets.trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  const canopy = new THREE.Group();
  for (const def of assets.canopyDefs) {
    const part = new THREE.Mesh(def.geo, def.mat);
    part.position.set(def.pos[0], def.pos[1], def.pos[2]);
    part.rotation.y = def.ry;
    part.castShadow = true;
    canopy.add(part);
  }
  g.add(canopy);
  g.userData = { canopy, trunk };
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

export function createWorkerModel(role = 'lumberjack') {
  const palette = role === 'lumberjack'
    ? { shirt: 0x16a34a, pants: 0x1e3a8a, hat: 0xf59e0b, accent: 0x84cc16 }
    : { shirt: 0x0284c7, pants: 0x0f172a, hat: 0xffffff, accent: 0x38bdf8 };
  const m = createPlayerModel(palette, 0);
  m.scale.setScalar(0.86);
  return m;
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
  cargoVisual.position.set(0, 1.08, -1.02);
  const logGeo = new THREE.CylinderGeometry(0.24, 0.25, 3.45, 8);
  logGeo.rotateX(Math.PI / 2);
  const logOffsets = [
    [-0.64, 0.24], [0, 0.24], [0.64, 0.24],
    [-0.32, 0.68], [0.32, 0.68],
    [0, 1.1]
  ];
  for (const [lx, ly] of logOffsets) {
    const log = new THREE.Mesh(logGeo, [logMat, logEndMat, logEndMat]);
    log.position.set(lx, ly, 0);
    log.castShadow = !lowSpec;
    cargoVisual.add(log);
  }
  g.add(cargoVisual);

  // Hired AI Driver Indicator (hard-hat worker visible inside/above cab when hired)
  const driverVisual = new THREE.Group();
  driverVisual.position.set(-0.42, 2.08, 1.88);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.7 }));
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }));
  hat.position.y = 0.16;
  const aiOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.8 })
  );
  aiOrb.position.set(0.42, 1.25, 0);
  driverVisual.add(head, hat, aiOrb);
  driverVisual.visible = false;
  g.add(driverVisual);

  g.add(chassis, cabLower, cabUpper, windshield, bumper, grille, beacon, bed);
  g.userData = { wheels, cargoVisual, driverVisual, beacon };
  return g;
}



