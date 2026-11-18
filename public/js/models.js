/**
 * TimberPort 3D — Stylized Low-Poly PBR Composite Model Builders
 * Shared GPU Geometries & Materials, Object-Pooled Backpacks, and Explicit Disposal
 * Zero per-frame geometry/material/texture allocations for <8GB RAM & Intel HD GPUs
 */

import * as THREE from 'three';
import { getBarkTexture, getTimberTexture } from './textures.js';

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
  root.traverse((obj) => {
    if (obj.geometry && !obj.geometry.userData?.shared) {
      obj.geometry.dispose();
    }
    const mat = obj.material;
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (!m || m.userData?.shared) continue;
        if (m.map && !m.map.userData?.shared) m.map.dispose();
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
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.72, 0);
  const rThigh = new THREE.Mesh(geos.thigh, mats.pants);
  rThigh.position.y = -0.28;
  rThigh.castShadow = true;
  const rBoot = new THREE.Mesh(geos.boot, mats.boot);
  rBoot.position.set(0, -0.62, 0.04);
  rBoot.castShadow = true;
  rightLeg.add(rThigh, rBoot);
  root.add(rightLeg);

  const torso = new THREE.Group();
  torso.position.set(0, 0.76, 0);
  root.add(torso);

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

  root.userData = {
    leftLeg, rightLeg, leftArm, rightArm, torso, head,
    vipCrown, axeBlade: blade, mats, logStackGroup
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
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, metalness: 0.05 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.72 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.25, flatShading: true });
  const timberMat = new THREE.MeshStandardMaterial({ map: markShared(getTimberTexture()), roughness: 0.68 });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.36, 11), concreteMat);
  slab.position.y = 0.18;
  slab.receiveShadow = true;
  g.add(slab);

  const colGeo = new THREE.BoxGeometry(0.45, 5.2, 0.45);
  [[-7.2, -4.6], [7.2, -4.6], [-7.2, 4.6], [7.2, 4.6]].forEach(([px, pz]) => {
    const col = new THREE.Mesh(colGeo, steelMat);
    col.position.set(px, 2.75, pz);
    col.castShadow = true;
    g.add(col);
  });

  const roofGeo = new THREE.BoxGeometry(16.8, 0.28, 6.4);
  const roofL = new THREE.Mesh(roofGeo, roofMat);
  roofL.position.set(0, 5.85, -2.6);
  roofL.rotation.x = -0.22;
  roofL.castShadow = true;
  const roofR = new THREE.Mesh(roofGeo, roofMat);
  roofR.position.set(0, 5.85, 2.6);
  roofR.rotation.x = 0.22;
  roofR.castShadow = true;
  g.add(roofL, roofR);

  const hopper = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.35, 1.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4, metalness: 0.5 })
  );
  hopper.position.set(-6.0, 1.12, 0);
  hopper.castShadow = true;
  g.add(hopper);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.55, 2.1), steelMat);
  belt.position.set(0, 0.9, 0);
  belt.castShadow = true;
  g.add(belt);

  const sawHousing = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 2.8, 2.9),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.42, metalness: 0.35 })
  );
  sawHousing.position.set(-0.5, 2.2, 0);
  sawHousing.castShadow = true;
  g.add(sawHousing);

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.92 })
  );
  sawBlade.rotation.x = Math.PI / 2;
  sawBlade.position.set(-0.5, 1.55, 1.15);
  g.add(sawBlade);

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

  // Pre-built Tier 2 & Tier 3 architectural upgrades (Zero runtime allocation)
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.72 });
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 5.4, 8), siloMat);
  silo.position.set(-4.5, 4.4, -3.5);
  silo.castShadow = true;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.6, 6), siloMat);
  pipe.rotation.z = Math.PI / 3;
  pipe.position.set(-2.5, 4.5, -1.8);
  const floodBar = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.28, 0.35), steelMat);
  floodBar.position.set(0, 6.45, 4.4);
  tier2Group.add(silo, pipe, floodBar);
  g.add(tier2Group);

  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.85 });
  const solarL = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.14, 3.8), solarMat);
  solarL.position.set(0, 6.2, -2.5);
  solarL.rotation.x = -0.22;
  const solarR = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.14, 3.8), solarMat);
  solarR.position.set(0, 6.2, 2.5);
  solarR.rotation.x = 0.22;
  const trimGold = new THREE.Mesh(
    new THREE.BoxGeometry(16.2, 0.24, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.75 })
  );
  trimGold.position.set(0, 5.55, 5.3);
  tier3Group.add(solarL, solarR, trimGold);
  g.add(tier3Group);

  g.userData = { sawBlade, visualBufferGroup, visualOutputGroup, palletSlots, plankSlots, tier2Group, tier3Group };
  return g;
}

export function createHarborStructure() {
  const g = new THREE.Group();
  const deckMat = new THREE.MeshStandardMaterial({ map: markShared(getTimberTexture('#b87c44', '#855223')), roughness: 0.78 });
  const pilingMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.38, metalness: 0.55 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });

  const pier = new THREE.Mesh(new THREE.BoxGeometry(26, 0.55, 14), deckMat);
  pier.position.set(0, 0.45, 7);
  pier.receiveShadow = true;
  pier.castShadow = true;
  g.add(pier);

  const pileGeo = new THREE.CylinderGeometry(0.32, 0.35, 3.4, 7);
  for (let px = -11; px <= 11; px += 5.5) {
    for (let pz = 1; pz <= 13; pz += 6) {
      const pile = new THREE.Mesh(pileGeo, pilingMat);
      pile.position.set(px, -1.1, pz);
      g.add(pile);
    }
  }

  const canneryBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 5.0), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.48 }));
  canneryBody.position.set(-8.5, 2.3, 5.2);
  canneryBody.castShadow = true;
  const canneryRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, flatShading: true }));
  canneryRoof.rotation.y = Math.PI / 4;
  canneryRoof.position.set(-8.5, 4.75, 5.2);
  g.add(canneryBody, canneryRoof);

  const craneGroup = new THREE.Group();
  craneGroup.position.set(6.5, 0.7, 9.5);
  const legGeo = new THREE.BoxGeometry(0.45, 7.6, 0.45);
  [[-2.5, -2.0], [2.5, -2.0], [-2.5, 2.0], [2.5, 2.0]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, craneMat);
    leg.position.set(lx, 3.8, lz);
    leg.castShadow = true;
    craneGroup.add(leg);
  });
  const boom = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.65, 12.5), craneMat);
  boom.position.set(0, 7.8, 2.2);
  boom.castShadow = true;
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.8), steelMat);
  trolley.position.set(0, 7.3, 4.5);
  const hoistedCrate = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.4, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45 })
  );
  hoistedCrate.position.set(0, 4.2, 4.5);
  craneGroup.add(boom, trolley, hoistedCrate);
  g.add(craneGroup);

  const ship = new THREE.Group();
  ship.position.set(6.5, 0.1, 20.5);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(17, 2.6, 5.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.35 }));
  hull.position.y = 0.8;
  hull.castShadow = true;
  const redKeel = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.8, 5.1), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }));
  redKeel.position.y = -0.3;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 4.4), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42 }));
  bridge.position.set(-5.8, 3.9, 0);
  bridge.castShadow = true;
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.9, 8), craneMat);
  funnel.position.set(-6.2, 6.6, 0);
  ship.add(hull, redKeel, bridge, funnel);

  const cColors = [0x0ea5e9, 0xf59e0b, 0x10b981, 0xef4444];
  const contGeo = new THREE.BoxGeometry(3.1, 1.5, 2.0);
  for (let i = 0; i < 4; i++) {
    const cont = new THREE.Mesh(
      contGeo,
      new THREE.MeshStandardMaterial({ color: cColors[i], roughness: 0.5 })
    );
    cont.position.set(-1.5 + (i % 2) * 3.5, 2.75, i < 2 ? -1.1 : 1.1);
    cont.castShadow = true;
    ship.add(cont);
  }
  g.add(ship);

  // Pre-built Tier 2 & Tier 3 Harbor Extensions (Lighthouse + Pier Containers + Control Tower)
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const lhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.35, 7.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 })
  );
  lhTower.position.set(-11.5, 4.2, 11.5);
  lhTower.castShadow = true;
  const lhBand = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.15, 2.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  lhBand.position.set(-11.5, 4.5, 11.5);
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.1, roughness: 0.2 });
  const lhBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.1, 8), beaconMat);
  lhBeacon.position.set(-11.5, 8.3, 11.5);
  const lhCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.0, 8), steelMat);
  lhCap.position.set(-11.5, 9.3, 11.5);
  const stackA = new THREE.Mesh(contGeo, new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.5 }));
  stackA.position.set(-1.5, 1.45, 10.5);
  const stackB = new THREE.Mesh(contGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }));
  stackB.position.set(-1.5, 2.95, 10.5);
  tier2Group.add(lhTower, lhBand, lhBeacon, lhCap, stackA, stackB);
  g.add(tier2Group);

  const tier3Group = new THREE.Group();
  tier3Group.visible = false;
  const ctrlTower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.4, 3.6), steelMat);
  ctrlTower.position.set(0.2, 3.4, 4.6);
  ctrlTower.castShadow = true;
  const ctrlCab = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.6, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3 })
  );
  ctrlCab.position.set(0.2, 6.8, 4.6);
  const ctrlRoof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.3, 4.6), craneMat);
  ctrlRoof.position.set(0.2, 7.75, 4.6);
  tier3Group.add(ctrlTower, ctrlCab, ctrlRoof);
  g.add(tier3Group);

  g.userData = { ship, trolley, hoistedCrate, lhBeacon, tier2Group, tier3Group };
  return g;
}

export function syncBuildingEvolution(sawmill, harbor, sawTier, harborTier) {
  if (sawmill?.userData?.tier2Group) sawmill.userData.tier2Group.visible = sawTier >= 2;
  if (sawmill?.userData?.tier3Group) sawmill.userData.tier3Group.visible = sawTier >= 3;
  if (harbor?.userData?.tier2Group) harbor.userData.tier2Group.visible = harborTier >= 2;
  if (harbor?.userData?.tier3Group) harbor.userData.tier3Group.visible = harborTier >= 3;
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
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const amberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.45 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.35 });

  // Runway slab (9 x 38 along Z)
  const runway = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.12, 38), tarmacMat);
  runway.position.set(0, 0.06, 0);
  runway.receiveShadow = !lowSpec;
  g.add(runway);

  // Centerline dashed markings
  const dashGeo = markShared(new THREE.PlaneGeometry(0.45, 2.2));
  dashGeo.rotateX(-Math.PI / 2);
  for (let z = -15; z <= 15; z += 4.2) {
    const dash = new THREE.Mesh(dashGeo, stripeMat);
    dash.position.set(0, 0.13, z);
    g.add(dash);
  }

  // Runway threshold bars & edge lights
  [-17.2, 17.2].forEach((tz) => {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.7), amberMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(0, 0.135, tz);
    g.add(bar);
  });

  const edgeGeo = markShared(new THREE.BoxGeometry(0.24, 0.22, 0.24));
  for (let z = -16; z <= 16; z += 6.4) {
    [-4.3, 4.3].forEach((ex) => {
      const marker = new THREE.Mesh(edgeGeo, amberMat);
      marker.position.set(ex, 0.18, z);
      g.add(marker);
    });
  }

  // Tier 2: Hangar & Air Traffic Control Tower
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const hangar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.6, 8.2), hangarMat);
  hangar.position.set(8.6, 1.8, -8);
  hangar.castShadow = !lowSpec;
  const hangarRoof = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 8.3, 8, 1, false, 0, Math.PI), roofMat);
  hangarRoof.rotation.z = Math.PI / 2;
  hangarRoof.rotation.y = Math.PI / 2;
  hangarRoof.position.set(8.6, 3.6, -8);
  const atcShaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.2, 2.2), hangarMat);
  atcShaft.position.set(8.4, 3.6, 4.5);
  atcShaft.castShadow = !lowSpec;
  const atcCab = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 1.5, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.45 })
  );
  atcCab.position.set(8.4, 7.9, 4.5);
  tier2Group.add(hangar, hangarRoof, atcShaft, atcCab);
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
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.15 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.68 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32, metalness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.24, metalness: 0.85, emissive: 0x78350f, emissiveIntensity: 0.25 });

  // Tier 1: Granite Plaza + 2-Story TimberPort Lobby
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 8.8), graniteMat);
  plaza.position.y = 0.2;
  plaza.receiveShadow = !lowSpec;
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.2, 6.2), steelMat);
  lobby.position.y = 2.4;
  lobby.castShadow = !lowSpec;
  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.5, 5.4), glassMat);
  lobbyGlass.position.y = 2.5;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.2), goldMat);
  canopy.position.set(0, 2.8, 3.6);
  tier1Group.add(plaza, lobby, lobbyGlass, canopy);
  g.add(tier1Group);

  // Tier 2: Corporate Financial Tower + Golden Crown Band
  const tier2Group = new THREE.Group();
  tier2Group.visible = false;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 6.5, 5.0), glassMat);
  tower.position.y = 7.7;
  tower.castShadow = !lowSpec;
  const ribs = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.4, 3.4), steelMat);
  ribs.position.y = 7.7;
  const crownBand = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.55, 5.4), goldMat);
  crownBand.position.y = 11.1;
  tier2Group.add(tower, ribs, crownBand);
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

  const facadeLight = new THREE.PointLight(0xfde68a, 1.8, 22, 1.6);
  facadeLight.position.set(0, 5.5, 4.8);
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
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.52 });
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.62 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.14, metalness: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.55 });

  // Tier 1: Main Craft Workshop Hall
  const tier1Group = new THREE.Group();
  tier1Group.visible = false;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.35, 7.6), darkMat);
  plinth.position.y = 0.175;
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
  tier1Group.add(plinth, hall, roof, trim);
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





