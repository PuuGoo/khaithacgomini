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

  g.userData = { sawBlade, visualBufferGroup, visualOutputGroup, palletSlots, plankSlots };
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

  g.userData = { ship, trolley, hoistedCrate };
  return g;
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
