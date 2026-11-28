import fs from 'fs';
import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder
  });

const TMP = '.tmp_github_new';
const OUT_MODELS = 'public/models/forest';
const OUT_PREV = '.tmp_github_new/extracted_previews';
fs.mkdirSync(OUT_MODELS, { recursive: true });
fs.mkdirSync(OUT_PREV, { recursive: true });

async function renderPreview(posOut, uvOut, baseImgBuf, outPng) {
  const count = posOut.length / 3;
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < count; i++) {
    const x = posOut[i * 3], y = posOut[i * 3 + 1], z = posOut[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) * 1.15;
  const texBuf = baseImgBuf
    ? await sharp(baseImgBuf).resize(512, 512).removeAlpha().raw().toBuffer()
    : null;
  const W = 200, H = 200;
  const out = Buffer.alloc(W * 3 * H * 3, 240);
  const zbuf = [
    new Float32Array(W * H).fill(-1e9),
    new Float32Array(W * H).fill(-1e9),
    new Float32Array(W * H).fill(-1e9)
  ];
  const step = Math.max(1, Math.floor(count / 120000));
  for (let i = 0; i < count; i += step) {
    const x = posOut[i * 3] - cx, y = posOut[i * 3 + 1] - cy, z = posOut[i * 3 + 2] - cz;
    let r = 130, g = 130, b = 135;
    if (texBuf && uvOut) {
      let u = uvOut[i * 2] % 1; if (u < 0) u += 1;
      let v = uvOut[i * 2 + 1] % 1; if (v < 0) v += 1;
      const ti = (Math.min(511, Math.floor(v * 512)) * 512 + Math.min(511, Math.floor(u * 512))) * 3;
      r = texBuf[ti]; g = texBuf[ti + 1]; b = texBuf[ti + 2];
    }
    const views = [
      [0, Math.floor(((x / span) + 0.5) * W), Math.floor((0.5 - (y / span)) * H), z],   // +Z Front
      [1, Math.floor(((z / span) + 0.5) * W), Math.floor((0.5 - (y / span)) * H), x],   // +X Side
      [2, Math.floor(((x / span) + 0.5) * W), Math.floor((0.5 - (z / span)) * H), y]    // +Y Top
    ];
    for (const [vi, px, py, d] of views) {
      if (px >= 0 && px < W && py >= 0 && py < H && d > zbuf[vi][py * W + px]) {
        zbuf[vi][py * W + px] = d;
        const oi = (py * W * 3 + (vi * W + px)) * 3;
        out[oi] = r; out[oi + 1] = g; out[oi + 2] = b;
      }
    }
  }
  await sharp(out, { raw: { width: W * 3, height: H, channels: 3 } }).png().toFile(outPng);
}

function buildFilteredArrays(srcPrim, filterTri, extraYawRad = 0) {
  const srcPos = srcPrim.getAttribute('POSITION').getArray();
  const srcNorm = srcPrim.getAttribute('NORMAL')?.getArray() || null;
  const srcUv = srcPrim.getAttribute('TEXCOORD_0')?.getArray() || null;
  const srcIdx = srcPrim.getIndices().getArray();

  const remap = new Int32Array(srcPos.length / 3).fill(-1);
  const newIndices = [];
  const keptVerts = [];

  for (let i = 0; i < srcIdx.length; i += 3) {
    const ia = srcIdx[i], ib = srcIdx[i + 1], ic = srcIdx[i + 2];
    const ax = srcPos[ia * 3], ay = srcPos[ia * 3 + 1], az = srcPos[ia * 3 + 2];
    const bx = srcPos[ib * 3], by = srcPos[ib * 3 + 1], bz = srcPos[ib * 3 + 2];
    const cx = srcPos[ic * 3], cy = srcPos[ic * 3 + 1], cz = srcPos[ic * 3 + 2];
    if (!filterTri(ax, ay, az, bx, by, bz, cx, cy, cz)) continue;
    for (const iv of [ia, ib, ic]) {
      let ni = remap[iv];
      if (ni === -1) {
        ni = keptVerts.length;
        remap[iv] = ni;
        keptVerts.push(iv);
      }
      newIndices.push(ni);
    }
  }

  const vCount = keptVerts.length;
  const posOut = new Float32Array(vCount * 3);
  const normOut = srcNorm ? new Float32Array(vCount * 3) : null;
  const uvOut = srcUv ? new Float32Array(vCount * 2) : null;
  const cosY = Math.cos(extraYawRad);
  const sinY = Math.sin(extraYawRad);

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < vCount; i++) {
    const iv = keptVerts[i];
    const rx = srcPos[iv * 3], ry = srcPos[iv * 3 + 1], rz = srcPos[iv * 3 + 2];
    // Z-up (-Z is up) -> Three.js Y-up: (x, -z, y)
    let x = rx, y = -rz, z = ry;
    if (extraYawRad !== 0) {
      const tx = x * cosY + z * sinY;
      const tz = -x * sinY + z * cosY;
      x = tx; z = tz;
    }
    posOut[i * 3] = x;
    posOut[i * 3 + 1] = y;
    posOut[i * 3 + 2] = z;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    if (normOut) {
      let nx = srcNorm[iv * 3], ny = -srcNorm[iv * 3 + 2], nz = srcNorm[iv * 3 + 1];
      if (extraYawRad !== 0) {
        const tnx = nx * cosY + nz * sinY;
        const tnz = -nx * sinY + nz * cosY;
        nx = tnx; nz = tnz;
      }
      normOut[i * 3] = nx; normOut[i * 3 + 1] = ny; normOut[i * 3 + 2] = nz;
    }
    if (uvOut) {
      uvOut[i * 2] = srcUv[iv * 2];
      uvOut[i * 2 + 1] = srcUv[iv * 2 + 1];
    }
  }
  return { posOut, normOut, uvOut, newIndices, vCount, bounds: { minX, maxX, minY, maxY, minZ, maxZ } };
}

async function createCompressedMat(doc, srcMat, name, { texSize = 768, roughnessFloor = 0.62, metalnessCap = 0.18 } = {}) {
  const mat = doc.createMaterial(name + '_mat')
    .setBaseColorFactor([1, 1, 1, 1])
    .setRoughnessFactor(Math.max(roughnessFloor, srcMat?.getRoughnessFactor() ?? 0.72))
    .setMetallicFactor(Math.min(metalnessCap, srcMat?.getMetallicFactor() ?? 0.08));

  const srcBaseTex = srcMat?.getBaseColorTexture();
  if (srcBaseTex) {
    const webp = await sharp(Buffer.from(srcBaseTex.getImage()))
      .resize(texSize, texSize, { fit: 'fill' })
      .webp({ quality: 82 })
      .toBuffer();
    mat.setBaseColorTexture(doc.createTexture(name + '_base').setImage(webp).setMimeType('image/webp'));
  }
  return { mat, srcBaseImg: srcBaseTex ? Buffer.from(srcBaseTex.getImage()) : null };
}

async function extractSingle(srcDoc, {
  name,
  outFile,
  filterTri,
  targetTris = 7000,
  texSize = 768,
  extraYawRad = 0,
  roughnessFloor = 0.62,
  metalnessCap = 0.15
}) {
  const srcPrim = srcDoc.getRoot().listMeshes()[0].listPrimitives()[0];
  const srcMat = srcPrim.getMaterial();
  const data = buildFilteredArrays(srcPrim, filterTri, extraYawRad);
  if (data.newIndices.length < 30) throw new Error(`${name}: too few tris (${data.newIndices.length / 3})`);

  const { minX, maxX, minY, maxY, minZ, maxZ } = data.bounds;
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  for (let i = 0; i < data.vCount; i++) {
    data.posOut[i * 3] -= cx;
    data.posOut[i * 3 + 1] -= minY;
    data.posOut[i * 3 + 2] -= cz;
  }

  const doc = new Document();
  const buf = doc.createBuffer();
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(data.posOut).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(data.vCount > 65535 ? new Uint32Array(data.newIndices) : new Uint16Array(data.newIndices)).setBuffer(buf));
  if (data.normOut) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(data.normOut).setBuffer(buf));
  if (data.uvOut) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(data.uvOut).setBuffer(buf));

  const { mat, srcBaseImg } = await createCompressedMat(doc, srcMat, name, { texSize, roughnessFloor, metalnessCap });
  prim.setMaterial(mat);
  const mesh = doc.createMesh(name).addPrimitive(prim);
  doc.createScene('Scene').addChild(doc.createNode(name).setMesh(mesh));

  const rawTris = data.newIndices.length / 3;
  const ratio = Math.min(1, targetTris / rawTris);
  await doc.transform(
    weld({ tolerance: 0.0005 }),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.016 }),
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' })
  );

  await io.write(outFile, doc);
  const sizeKB = Math.round(fs.statSync(outFile).size / 1024);
  const finalTris = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount() / 3;
  const dims = [+(maxX - minX).toFixed(3), +(maxY - minY).toFixed(3), +(maxZ - minZ).toFixed(3)];
  console.log(`  [OK] ${outFile} | ${Math.round(rawTris)} -> ${Math.round(finalTris)} tris | ${sizeKB} KB | dims=${JSON.stringify(dims)}`);
  await renderPreview(data.posOut, data.uvOut, srcBaseImg, `${OUT_PREV}/${name}.png`);
}

// Multi-part articulated GLB builder (shares 1 compressed WebP texture & puts each part at its true hinge pivot!)
async function extractArticulated(srcDoc, {
  name,
  outFile,
  parts, // [{ nodeName, filterTri, pivotOffset?: [px,py,pz] in Y-up centered coords, parent?: nodeName, targetTris }]
  extraYawRad = 0,
  texSize = 768,
  roughnessFloor = 0.56,
  metalnessCap = 0.24
}) {
  const srcPrim = srcDoc.getRoot().listMeshes()[0].listPrimitives()[0];
  const srcMat = srcPrim.getMaterial();
  const extracted = parts.map((p) => ({
    ...p,
    data: buildFilteredArrays(srcPrim, p.filterTri, extraYawRad)
  }));

  // Global bounding box across all parts so they share 1 unified bottom-center origin
  let gMinX = 1e9, gMaxX = -1e9, gMinY = 1e9, gMaxY = -1e9, gMinZ = 1e9, gMaxZ = -1e9;
  for (const e of extracted) {
    const b = e.data.bounds;
    if (b.minX < gMinX) gMinX = b.minX; if (b.maxX > gMaxX) gMaxX = b.maxX;
    if (b.minY < gMinY) gMinY = b.minY; if (b.maxY > gMaxY) gMaxY = b.maxY;
    if (b.minZ < gMinZ) gMinZ = b.minZ; if (b.maxZ > gMaxZ) gMaxZ = b.maxZ;
  }
  const gCx = (gMinX + gMaxX) * 0.5;
  const gCz = (gMinZ + gMaxZ) * 0.5;
  const gH = Math.max(0.001, gMaxY - gMinY);

  // Merge all preview verts for verification PNG
  let totalVerts = 0;
  for (const e of extracted) totalVerts += e.data.vCount;
  const prevPos = new Float32Array(totalVerts * 3);
  const prevUv = new Float32Array(totalVerts * 2);
  let pOff = 0;

  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene('Scene');
  const { mat, srcBaseImg } = await createCompressedMat(doc, srcMat, name, { texSize, roughnessFloor, metalnessCap });

  const nodeMap = new Map();
  const worldPivotMap = new Map();

  for (const e of extracted) {
    const d = e.data;
    if (d.newIndices.length < 30) {
      console.warn(`  [WARN] ${name}.${e.nodeName} has only ${d.newIndices.length / 3} tris, skipping`);
      continue;
    }
    // Pivot in centered Y-up coordinates (0,0,0 = bottom-center of whole vehicle)
    let px = 0, py = 0, pz = 0;
    if (typeof e.computePivot === 'function') {
      const pv = e.computePivot(d.bounds, { gCx, gMinY, gCz, gH });
      px = pv[0]; py = pv[1]; pz = pv[2];
    }
    worldPivotMap.set(e.nodeName, [px, py, pz]);

    // Shift vertices relative to this node's pivot
    for (let i = 0; i < d.vCount; i++) {
      const wx = d.posOut[i * 3] - gCx;
      const wy = d.posOut[i * 3 + 1] - gMinY;
      const wz = d.posOut[i * 3 + 2] - gCz;
      prevPos[(pOff + i) * 3] = wx;
      prevPos[(pOff + i) * 3 + 1] = wy;
      prevPos[(pOff + i) * 3 + 2] = wz;
      if (d.uvOut) {
        prevUv[(pOff + i) * 2] = d.uvOut[i * 2];
        prevUv[(pOff + i) * 2 + 1] = d.uvOut[i * 2 + 1];
      }
      d.posOut[i * 3] = wx - px;
      d.posOut[i * 3 + 1] = wy - py;
      d.posOut[i * 3 + 2] = wz - pz;
    }
    pOff += d.vCount;

    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(d.posOut).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(d.vCount > 65535 ? new Uint32Array(d.newIndices) : new Uint16Array(d.newIndices)).setBuffer(buf))
      .setMaterial(mat);
    if (d.normOut) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(d.normOut).setBuffer(buf));
    if (d.uvOut) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(d.uvOut).setBuffer(buf));

    const mesh = doc.createMesh(e.nodeName).addPrimitive(prim);
    const node = doc.createNode(e.nodeName).setMesh(mesh);
    if (e.parent && nodeMap.has(e.parent)) {
      const parentPivot = worldPivotMap.get(e.parent) || [0, 0, 0];
      node.setTranslation([px - parentPivot[0], py - parentPivot[1], pz - parentPivot[2]]);
      nodeMap.get(e.parent).addChild(node);
    } else {
      node.setTranslation([px, py, pz]);
      scene.addChild(node);
    }
    nodeMap.set(e.nodeName, node);
  }

  const totalRawTris = extracted.reduce((s, e) => s + e.data.newIndices.length / 3, 0);
  const totalTarget = extracted.reduce((s, e) => s + (e.targetTris || 4000), 0);
  const ratio = Math.min(1, totalTarget / Math.max(1, totalRawTris));

  await doc.transform(
    weld({ tolerance: 0.0005 }),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.016 }),
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' })
  );

  await io.write(outFile, doc);
  const sizeKB = Math.round(fs.statSync(outFile).size / 1024);
  const finalTris = doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives()[0].getIndices().getCount() / 3, 0);
  console.log(`  [OK-ARTICULATED] ${outFile} | ${Math.round(totalRawTris)} -> ${Math.round(finalTris)} tris | ${sizeKB} KB | nodes=[${[...nodeMap.keys()].join(', ')}]`);
  await renderPreview(prevPos, prevUv, srcBaseImg, `${OUT_PREV}/${name}.png`);
}

// =========================================================================
// 1. EXCAVATOR HERO (from xecau.glb) — Articulated Tracks + Turret + Boom!
//    Strip soil pedestal (h < 0.116) AND brown dirt mound under bucket!
//    Note: In raw space, boom extends toward -X; rotate +PI/2 around Y so boom faces +Z (forward)!
// =========================================================================
console.log('\n=== 1. Processing Articulated Hero Excavator (xecau.glb) ===');
{
  const doc = await io.read(`${TMP}/xecau.glb`);
  // Dirt mound under bucket sits in X in [-0.24, 0.05], H in [0.0, 0.245], Y in [-0.14, 0.14]
  // Tracks sit at X > 0.01, H in [0.118, 0.242]
  // Yellow cab/turret sits at X > -0.025, H >= 0.242
  // Boom + hydraulic stick + bucket sits at X <= -0.025 and ABOVE the dirt mound!
  const isAboveGroundAndNotMound = (mx, my, mh) => {
    if (mh < 0.118) return false;
    // Strip the rounded dirt pile sitting beneath the bucket (center approx x=-0.105, y=0, radius 0.115, top h~0.248)
    const dm = Math.hypot((mx + 0.105) / 0.125, my / 0.125);
    if (dm < 1.0 && mh < 0.242 - dm * 0.065 && mx > -0.22 && mx < 0.025) return false;
    // Also strip stray dirt rim edge around the square base
    if (mh < 0.142 && (mx < 0.01 || Math.abs(my) > 0.165 || mx > 0.295)) return false;
    return true;
  };

  await extractArticulated(doc, {
    name: 'excavator_hero_github',
    outFile: `${OUT_MODELS}/excavator_hero_github.glb`,
    extraYawRad: Math.PI / 2, // raw -X (boom) maps to +Z (forward)!
    texSize: 768,
    roughnessFloor: 0.48,
    metalnessCap: 0.28,
    parts: [
      {
        nodeName: 'tracks',
        targetTris: 3600,
        filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
          const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
          return isAboveGroundAndNotMound(mx, my, mh) && mx >= 0.005 && mh < 0.236;
        },
        computePivot: () => [0, 0, 0]
      },
      {
        nodeName: 'turret',
        targetTris: 4400,
        filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
          const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
          return isAboveGroundAndNotMound(mx, my, mh) && mx >= -0.018 && mh >= 0.236;
        },
        computePivot: (b, { gCx, gMinY, gCz }) => [
          ((b.minX + b.maxX) * 0.5) - gCx,
          b.minY - gMinY,
          ((b.minZ + b.maxZ) * 0.5) - gCz
        ]
      },
      {
        nodeName: 'boom',
        parent: 'turret',
        targetTris: 4200,
        filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
          const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
          return isAboveGroundAndNotMound(mx, my, mh) && mx < -0.018;
        },
        computePivot: (b, { gCx, gMinY, gCz }) => [
          ((b.minX + b.maxX) * 0.5) - gCx,
          (b.minY + (b.maxY - b.minY) * 0.32) - gMinY,
          b.minZ - gCz // hinge where boom joins front of turret!
        ]
      }
    ]
  });
}

// Re-check extraYawRad sign: with extraYawRad = +Math.PI/2, tx = z, tz = -x -> raw -X (boom) maps to +Z (forward)!
// Let's fix extraYawRad right below for xecau before running? Wait — we'll set +Math.PI/2 directly!

// =========================================================================
// 2. EARTHMOVING FLEET (from cacloaimayxuc.glb) — 4 Separate Yellow Machines!
// =========================================================================
console.log('\n=== 2. Splitting Earthmoving Fleet (cacloaimayxuc.glb) ===');
{
  const doc = await io.read(`${TMP}/cacloaimayxuc.glb`);
  // Machine 1 (far left): Wheel Loader with toothed front bucket (X in [-0.50, -0.26])
  await extractSingle(doc, {
    name: 'wheel_loader_github',
    outFile: `${OUT_MODELS}/wheel_loader_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 < -0.26,
    targetTris: 7500,
    texSize: 768,
    extraYawRad: 0, // bucket faces +Y in raw -> +Z in Y-up!
    roughnessFloor: 0.48,
    metalnessCap: 0.25
  });

  // Machine 2 (center-left): Bulldozer Grader Scoop (X in [-0.26, -0.01])
  await extractSingle(doc, {
    name: 'bulldozer_grader_github',
    outFile: `${OUT_MODELS}/bulldozer_grader_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3;
      return mx >= -0.26 && mx < -0.01;
    },
    targetTris: 7000,
    texSize: 768,
    extraYawRad: 0,
    roughnessFloor: 0.48,
    metalnessCap: 0.25
  });

  // Machine 4 (far right): Compact Tracked Excavator / Crane Support (X >= 0.21)
  await extractSingle(doc, {
    name: 'crawler_crane_github',
    outFile: `${OUT_MODELS}/crawler_crane_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 >= 0.21,
    targetTris: 7500,
    texSize: 768,
    extraYawRad: 0,
    roughnessFloor: 0.48,
    metalnessCap: 0.25
  });
}

// =========================================================================
// 3. AUTOMATED INDUSTRIAL SAWMILL & OPERATOR (from cuagoauto.glb)
// =========================================================================
console.log('\n=== 3. Processing Automated Sawmill & Standalone Operator (cuagoauto.glb) ===');
{
  const doc = await io.read(`${TMP}/cuagoauto.glb`);
  // Complete blue/yellow industrial automated circular sawmill + console (excluding standalone worker on left)
  await extractSingle(doc, {
    name: 'auto_sawmill_github',
    outFile: `${OUT_MODELS}/auto_sawmill_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3;
      // Exclude the standalone worker comp[1] at X < -0.22, Y > -0.15
      if (mx < -0.215 && my > -0.16) return false;
      return true;
    },
    targetTris: 10500,
    texSize: 1024,
    extraYawRad: 0,
    roughnessFloor: 0.46,
    metalnessCap: 0.34
  });

  // Clean standalone upright blue-coveralls worker with yellow hardhat (comp[1])!
  await extractSingle(doc, {
    name: 'worker_operator_github',
    outFile: `${OUT_MODELS}/worker_operator_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
      return mx < -0.225 && my > -0.14 && my < 0.14 && mh > 0.008;
    },
    targetTris: 6200,
    texSize: 768,
    extraYawRad: Math.PI / 2, // faces +X in raw -> rotate to face +Z
    roughnessFloor: 0.68,
    metalnessCap: 0.08
  });
}

// =========================================================================
// 4. CONSTRUCTION BUILDER / PORTER WORKERS (from congnhan.glb)
//    Strip thick grass diorama pedestal (h < 0.146), extract clean upright workers!
// =========================================================================
console.log('\n=== 4. Processing Construction Workers (congnhan.glb) ===');
{
  const doc = await io.read(`${TMP}/congnhan.glb`);
  // comp[3]: clean isolated standing worker in orange safety vest + yellow hardhat + blue jeans
  await extractSingle(doc, {
    name: 'worker_builder_a_github',
    outFile: `${OUT_MODELS}/worker_builder_a_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
      return mh >= 0.146 && mx >= 0.195 && mx <= 0.34 && my >= 0.165 && my <= 0.40;
    },
    targetTris: 6000,
    texSize: 768,
    extraYawRad: Math.PI, // orient face forward (+Z)
    roughnessFloor: 0.70,
    metalnessCap: 0.06
  });

  // comp[4]: second isolated standing construction worker
  await extractSingle(doc, {
    name: 'worker_builder_b_github',
    outFile: `${OUT_MODELS}/worker_builder_b_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
      return mh >= 0.146 && mx >= -0.41 && mx <= -0.25 && my >= -0.33 && my <= -0.10;
    },
    targetTris: 6000,
    texSize: 768,
    extraYawRad: 0,
    roughnessFloor: 0.70,
    metalnessCap: 0.06
  });
}

// =========================================================================
// 5. CHAINSAW LUMBERJACK WORKER (from congnhancuamay.glb)
//    Strip the 2 orange fuel cans (Y > 0.175) & bottom log on the floor!
// =========================================================================
console.log('\n=== 5. Processing Chainsaw Lumberjack (congnhancuamay.glb) ===');
{
  const doc = await io.read(`${TMP}/congnhancuamay.glb`);
  await extractSingle(doc, {
    name: 'worker_chainsaw_github',
    outFile: `${OUT_MODELS}/worker_chainsaw_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
      if (my > 0.172) return false; // strip 2 orange fuel canisters
      // Strip the big horizontal log lying on the ground in front of his feet (X < 0.025, H < 0.215)
      if (mx < 0.025 && mh < 0.215) return false;
      return true;
    },
    targetTris: 6800,
    texSize: 768,
    extraYawRad: Math.PI / 2, // chainsaw reaches toward -X -> +Z forward
    roughnessFloor: 0.66,
    metalnessCap: 0.12
  });
}

// =========================================================================
// 6. CARPENTER HAND-SAW WORKER (from congnhancuago.glb)
//    Strip tree stump (Y > 0.12) & wooden sawhorse (X < -0.06, H < 0.44)!
// =========================================================================
console.log('\n=== 6. Processing Carpenter Sawyer Worker (congnhancuago.glb) ===');
{
  const doc = await io.read(`${TMP}/congnhancuago.glb`);
  await extractSingle(doc, {
    name: 'worker_sawyer_github',
    outFile: `${OUT_MODELS}/worker_sawyer_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mh = -(az + bz + cz) / 3;
      if (my > 0.125) return false; // strip background stump & log
      // Strip wooden sawhorse legs & resting log below the saw blade (X < -0.055, H < 0.445)
      if (mx < -0.055 && mh < 0.445) return false;
      return true;
    },
    targetTris: 6600,
    texSize: 768,
    extraYawRad: Math.PI / 2, // saw reaches toward -X -> +Z forward
    roughnessFloor: 0.68,
    metalnessCap: 0.10
  });
}

// =========================================================================
// 7. TABLE SAW STATION + ORANGE WORKER (from congnhancuamay_1.glb)
// =========================================================================
console.log('\n=== 7. Processing Table Saw Station & Worker (congnhancuamay_1.glb) ===');
{
  const doc = await io.read(`${TMP}/congnhancuamay_1.glb`);
  // Clean green circular saw table + wood stack (no worker, for craft bench / upgrade visual)
  await extractSingle(doc, {
    name: 'table_saw_github',
    outFile: `${OUT_MODELS}/table_saw_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 < 0.085,
    targetTris: 7800,
    texSize: 768,
    extraYawRad: 0,
    roughnessFloor: 0.54,
    metalnessCap: 0.25
  });

  // Orange-shirt yellow-hardhat standing worker on the right side (X >= 0.085)
  await extractSingle(doc, {
    name: 'worker_sawmill_op_github',
    outFile: `${OUT_MODELS}/worker_sawmill_op_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 >= 0.085,
    targetTris: 6000,
    texSize: 768,
    extraYawRad: Math.PI / 2, // faces -X -> +Z forward
    roughnessFloor: 0.68,
    metalnessCap: 0.06
  });
}

console.log('\nALL 7 NEW GITHUB GLBS EXTRACTED, ARTICULATED & COMPRESSED SUCCESSFULLY!');
