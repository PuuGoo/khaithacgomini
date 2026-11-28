import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  });

const TMP = '.tmp_github_models';
const OUT_MODELS = 'public/models/forest';
const OUT_ASSETS = 'public/assets';
const OUT_PREVIEWS = '.tmp_github_models/extracted_previews';
fs.mkdirSync(OUT_MODELS, { recursive: true });
fs.mkdirSync(OUT_ASSETS, { recursive: true });
fs.mkdirSync(OUT_PREVIEWS, { recursive: true });

// Helper: extract a filtered subset of triangles from a raw Z-up (up = -Z) GLB,
// convert to Three.js Y-up right-handed: (x, y, z) -> (x, -z, y),
// normalize pivot to bottom-center (y = 0) and scale to targetHeight (or keep raw aspect),
// simplify to targetTris, compress texture to WebP 1024px, and apply Meshopt compression.
async function extractSubMesh(srcDoc, {
  name,
  outFile,
  filterTri, // (ax,ay,az, bx,by,bz, cx,cy,cz) => boolean (in raw GLB space)
  targetTris = 8000,
  texSize = 1024,
  extraYawRad = 0, // optional Y-axis rotation after converting to Y-up
  roughnessFloor = 0.65,
  metalnessCap = 0.08,
}) {
  const srcPrim = srcDoc.getRoot().listMeshes()[0].listPrimitives()[0];
  const srcPos = srcPrim.getAttribute('POSITION').getArray();
  const srcNorm = srcPrim.getAttribute('NORMAL')?.getArray() || null;
  const srcUv = srcPrim.getAttribute('TEXCOORD_0')?.getArray() || null;
  const srcIdx = srcPrim.getIndices().getArray();
  const srcMat = srcPrim.getMaterial();

  // Collect matching triangles and remap vertices
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

  if (newIndices.length < 30) {
    throw new Error(`extractSubMesh(${name}): too few triangles (${newIndices.length / 3})`);
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
    // Right-handed Z-up (up = -Z) -> Y-up: (x, -z, y)
    let x = rx;
    let y = -rz;
    let z = ry;
    if (extraYawRad !== 0) {
      const tx = x * cosY + z * sinY;
      const tz = -x * sinY + z * cosY;
      x = tx;
      z = tz;
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
      normOut[i * 3] = nx;
      normOut[i * 3 + 1] = ny;
      normOut[i * 3 + 2] = nz;
    }
    if (uvOut) {
      uvOut[i * 2] = srcUv[iv * 2];
      uvOut[i * 2 + 1] = srcUv[iv * 2 + 1];
    }
  }

  // Re-center pivot to bottom-center (cx, minY, cz)
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  for (let i = 0; i < vCount; i++) {
    posOut[i * 3] -= cx;
    posOut[i * 3 + 1] -= minY;
    posOut[i * 3 + 2] -= cz;
  }

  const doc = new Document();
  const buf = doc.createBuffer();
  const posAcc = doc.createAccessor().setType('VEC3').setArray(posOut).setBuffer(buf);
  const idxArr = vCount > 65535 ? new Uint32Array(newIndices) : new Uint16Array(newIndices);
  const idxAcc = doc.createAccessor().setType('SCALAR').setArray(idxArr).setBuffer(buf);

  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setIndices(idxAcc);

  if (normOut) {
    prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normOut).setBuffer(buf));
  }
  if (uvOut) {
    prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uvOut).setBuffer(buf));
  }

  // Copy PBR material & resize textures with sharp (WebP for crisp 60 FPS)
  const mat = doc.createMaterial(name + '_mat')
    .setBaseColorFactor([1, 1, 1, 1])
    .setRoughnessFactor(Math.max(roughnessFloor, srcMat?.getRoughnessFactor() ?? 0.8))
    .setMetallicFactor(Math.min(metalnessCap, srcMat?.getMetallicFactor() ?? 0.04));

  const srcBaseTex = srcMat?.getBaseColorTexture();
  if (srcBaseTex) {
    const webp = await sharp(Buffer.from(srcBaseTex.getImage()))
      .resize(texSize, texSize, { fit: 'fill' })
      .webp({ quality: 84 })
      .toBuffer();
    const tex = doc.createTexture(name + '_base').setImage(webp).setMimeType('image/webp');
    mat.setBaseColorTexture(tex);
  }
  const srcNormTex = srcMat?.getNormalTexture();
  if (srcNormTex) {
    const webp = await sharp(Buffer.from(srcNormTex.getImage()))
      .resize(Math.min(512, texSize), Math.min(512, texSize), { fit: 'fill' })
      .webp({ quality: 82 })
      .toBuffer();
    const tex = doc.createTexture(name + '_normal').setImage(webp).setMimeType('image/webp');
    mat.setNormalTexture(tex);
    mat.setNormalScale(0.75);
  }

  prim.setMaterial(mat);
  const mesh = doc.createMesh(name).addPrimitive(prim);
  const node = doc.createNode(name).setMesh(mesh);
  doc.createScene('Scene').addChild(node);

  const rawTris = newIndices.length / 3;
  const ratio = Math.min(1, targetTris / rawTris);

  await doc.transform(
    weld({ tolerance: 0.0005 }),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.015 }),
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' })
  );

  await io.write(outFile, doc);
  const sizeKB = Math.round(fs.statSync(outFile).size / 1024);
  const finalTris = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount() / 3;
  const dims = [+(maxX - minX).toFixed(3), +(maxY - minY).toFixed(3), +(maxZ - minZ).toFixed(3)];
  console.log(`  [OK] ${outFile} | ${Math.round(rawTris)} -> ${Math.round(finalTris)} tris | ${sizeKB} KB | dims=${JSON.stringify(dims)}`);

  // Render quick 2-panel preview (Front + Top) so we visually verify every extracted asset!
  await renderPreviewFromArrays(posOut, uvOut, srcBaseTex ? Buffer.from(srcBaseTex.getImage()) : null, `${OUT_PREVIEWS}/${name}.png`);
  return { dims, finalTris, sizeKB };
}

async function renderPreviewFromArrays(posOut, uvOut, baseImgBuf, outPng) {
  const count = posOut.length / 3;
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,minZ=1e9,maxZ=-1e9;
  for (let i=0;i<count;i++) {
    const x=posOut[i*3], y=posOut[i*3+1], z=posOut[i*3+2];
    if(x<minX)minX=x;if(x>maxX)maxX=x;
    if(y<minY)minY=y;if(y>maxY)maxY=y;
    if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;
  }
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;
  const span = Math.max(maxX-minX, maxY-minY, maxZ-minZ) * 1.12;
  let texBuf = null;
  if (baseImgBuf) {
    texBuf = (await sharp(baseImgBuf).resize(512,512).removeAlpha().raw().toBuffer());
  }
  const W=200, H=200;
  const out = Buffer.alloc(W*2*H*3, 240);
  const zbuf = [new Float32Array(W*H).fill(-1e9), new Float32Array(W*H).fill(-1e9)];
  const step = Math.max(1, Math.floor(count / 120000));
  for (let i=0;i<count;i+=step) {
    const x=posOut[i*3]-cx, y=posOut[i*3+1]-cy, z=posOut[i*3+2]-cz;
    let r=120,g=120,b=120;
    if (texBuf && uvOut) {
      let u=uvOut[i*2]%1; if(u<0)u+=1;
      let v=uvOut[i*2+1]%1; if(v<0)v+=1;
      const ti=(Math.min(511,Math.floor(v*512))*512+Math.min(511,Math.floor(u*512)))*3;
      r=texBuf[ti]; g=texBuf[ti+1]; b=texBuf[ti+2];
    }
    const views = [
      [0, Math.floor(((x/span)+0.5)*W), Math.floor((0.5-(y/span))*H), z], // Front (+Z)
      [1, Math.floor(((z/span)+0.5)*W), Math.floor((0.5-(y/span))*H), x], // Side (+X)
    ];
    for (const [vi,px,py,d] of views) {
      if (px>=0&&px<W&&py>=0&&py<H && d>zbuf[vi][py*W+px]) {
        zbuf[vi][py*W+px]=d;
        const oi=(py*W*2+(vi*W+px))*3;
        out[oi]=r; out[oi+1]=g; out[oi+2]=b;
      }
    }
  }
  await sharp(out, { raw: { width: W*2, height: H, channels: 3 } }).png().toFile(outPng);
}

// Helper: bake a seamless tileable square texture from the top face of a GLB block
async function bakeSeamlessSurfaceTexture(glbPath, {
  outDiffuse,
  outNormal = null,
  cropBox, // { minX, maxX, minY, maxY, minH } in raw Z-up (up = -Z) space
  size = 512,
  mirrorSeamless = true,
}) {
  const doc = await io.read(glbPath);
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const pos = prim.getAttribute('POSITION').getArray();
  const uv = prim.getAttribute('TEXCOORD_0').getArray();
  const baseTex = prim.getMaterial().getBaseColorTexture();
  const texW = 1024, texH = 1024;
  const texBuf = await sharp(Buffer.from(baseTex.getImage())).resize(texW, texH).removeAlpha().raw().toBuffer();

  const S = mirrorSeamless ? size / 2 : size;
  const raw = Buffer.alloc(S * S * 3, 0);
  const zbuf = new Float32Array(S * S).fill(-1e9);
  const filled = new Uint8Array(S * S);

  const count = pos.length / 3;
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], h = -pos[i * 3 + 2];
    if (x < cropBox.minX || x > cropBox.maxX || y < cropBox.minY || y > cropBox.maxY || h < cropBox.minH) continue;
    const px = Math.min(S - 1, Math.max(0, Math.floor((x - cropBox.minX) / (cropBox.maxX - cropBox.minX) * S)));
    const py = Math.min(S - 1, Math.max(0, Math.floor((y - cropBox.minY) / (cropBox.maxY - cropBox.minY) * S)));
    const idx = py * S + px;
    if (h > zbuf[idx]) {
      zbuf[idx] = h;
      filled[idx] = 1;
      let u = uv[i * 2] % 1; if (u < 0) u += 1;
      let v = uv[i * 2 + 1] % 1; if (v < 0) v += 1;
      const ti = (Math.min(texH - 1, Math.floor(v * texH)) * texW + Math.min(texW - 1, Math.floor(u * texW))) * 3;
      raw[idx * 3] = texBuf[ti];
      raw[idx * 3 + 1] = texBuf[ti + 1];
      raw[idx * 3 + 2] = texBuf[ti + 2];
    }
  }

  // Dilate-fill any sparse pixel holes from point sampling
  for (let pass = 0; pass < 4; pass++) {
    const nextRaw = Buffer.from(raw);
    const nextFilled = Uint8Array.from(filled);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const idx = y * S + x;
        if (filled[idx]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < S && ny >= 0 && ny < S && filled[ny * S + nx]) {
              const ni = (ny * S + nx) * 3;
              r += raw[ni]; g += raw[ni + 1]; b += raw[ni + 2]; n++;
            }
          }
        }
        if (n > 0) {
          nextRaw[idx * 3] = Math.round(r / n);
          nextRaw[idx * 3 + 1] = Math.round(g / n);
          nextRaw[idx * 3 + 2] = Math.round(b / n);
          nextFilled[idx] = 1;
        }
      }
    }
    nextRaw.copy(raw);
    filled.set(nextFilled);
  }

  // Mirror-tile 2x2 so all 4 edges wrap 100% seamlessly with zero visible seams!
  let finalBuf = raw;
  if (mirrorSeamless) {
    finalBuf = Buffer.alloc(size * size * 3);
    for (let y = 0; y < size; y++) {
      const sy = y < S ? y : (size - 1 - y);
      for (let x = 0; x < size; x++) {
        const sx = x < S ? x : (size - 1 - x);
        const si = (sy * S + sx) * 3;
        const di = (y * size + x) * 3;
        finalBuf[di] = raw[si];
        finalBuf[di + 1] = raw[si + 1];
        finalBuf[di + 2] = raw[si + 2];
      }
    }
  }

  await sharp(finalBuf, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outDiffuse);
  console.log(`  [OK] Baked seamless texture ${outDiffuse} (${Math.round(fs.statSync(outDiffuse).size / 1024)} KB)`);

  if (outNormal) {
    // Compute Sobel tangent-space normal map from luminance ripples
    const lum = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
      lum[i] = (finalBuf[i * 3] * 0.299 + finalBuf[i * 3 + 1] * 0.587 + finalBuf[i * 3 + 2] * 0.114) / 255;
    }
    const normBuf = Buffer.alloc(size * size * 3);
    const strength = 2.6;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1 + size) % size;
        const xp = (x + 1) % size;
        const dx = (lum[y * size + xp] - lum[y * size + xm]) * strength;
        const dy = (lum[yp * size + x] - lum[ym * size + x]) * strength;
        const dz = 1.0;
        const inv = 1 / Math.hypot(dx, dy, dz);
        const oi = (y * size + x) * 3;
        normBuf[oi] = Math.max(0, Math.min(255, Math.round((-dx * inv * 0.5 + 0.5) * 255)));
        normBuf[oi + 1] = Math.max(0, Math.min(255, Math.round((-dy * inv * 0.5 + 0.5) * 255)));
        normBuf[oi + 2] = Math.max(0, Math.min(255, Math.round((dz * inv * 0.5 + 0.5) * 255)));
      }
    }
    await sharp(normBuf, { raw: { width: size, height: size, channels: 3 } })
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(outNormal);
    console.log(`  [OK] Baked seamless normal map ${outNormal} (${Math.round(fs.statSync(outNormal).size / 1024)} KB)`);
  }
}

console.log('=== STEP 1: Splitting Pine & Ancient Oak from 110aff...glb ===');
{
  const doc = await io.read(`${TMP}/110affcaa49116e8918c00ceedcff42f.glb`);
  // Pine is on the left (X < -0.058), Oak is on the right (X >= -0.058)
  await extractSubMesh(doc, {
    name: 'pine_github',
    outFile: `${OUT_MODELS}/pine_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 < -0.058,
    targetTris: 7500,
    texSize: 1024,
    roughnessFloor: 0.78,
    metalnessCap: 0.03,
  });
  await extractSubMesh(doc, {
    name: 'oak_github',
    outFile: `${OUT_MODELS}/oak_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 >= -0.058,
    targetTris: 8500,
    texSize: 1024,
    roughnessFloor: 0.78,
    metalnessCap: 0.03,
  });
}

console.log('=== STEP 2: Splitting Log Bridge & Handcart from bien.glb ===');
{
  const doc = await io.read(`${TMP}/bien.glb`);
  // Bridge is X < 0 (zero vertices between -0.02 and +0.03!)
  await extractSubMesh(doc, {
    name: 'log_bridge_github',
    outFile: `${OUT_MODELS}/log_bridge_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 < 0.0,
    targetTris: 9000,
    texSize: 1024,
    roughnessFloor: 0.74,
    metalnessCap: 0.06,
  });
  // Two-wheel logging handcart is X > 0; after (x,-z,y), pull handle extends straight along +Z!
  await extractSubMesh(doc, {
    name: 'log_handcart_github',
    outFile: `${OUT_MODELS}/log_handcart_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => (ax + bx + cx) / 3 > 0.0,
    targetTris: 8500,
    texSize: 1024,
    roughnessFloor: 0.72,
    metalnessCap: 0.14,
  });
}

console.log('=== STEP 3: Stripping base disc & splitting Sawmill, Campfire, Lantern from 7a33cb...glb ===');
{
  const doc = await io.read(`${TMP}/7a33cb590f63c5749495fe9177f1750d.glb`);
  // Remove round grass disc completely (height = -z > 0.030)
  await extractSubMesh(doc, {
    name: 'sawmill_github',
    outFile: `${OUT_MODELS}/sawmill_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const h = -(az + bz + cz) / 3;
      const mx = (ax + bx + cx) / 3;
      const my = (ay + by + cy) / 3;
      return h > 0.030 && mx > -0.47 && mx < 0.39 && my > -0.40 && my < 0.175;
    },
    targetTris: 12000,
    texSize: 1024,
    roughnessFloor: 0.74,
    metalnessCap: 0.08,
  });
  await extractSubMesh(doc, {
    name: 'campfire_github',
    outFile: `${OUT_MODELS}/campfire_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const h = -(az + bz + cz) / 3;
      const mx = (ax + bx + cx) / 3;
      const my = (ay + by + cy) / 3;
      return h > 0.030 && mx > -0.22 && mx < 0.16 && my >= 0.18 && my < 0.49;
    },
    targetTris: 5500,
    texSize: 1024,
    roughnessFloor: 0.78,
    metalnessCap: 0.05,
  });
  await extractSubMesh(doc, {
    name: 'lantern_github',
    outFile: `${OUT_MODELS}/lantern_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const h = -(az + bz + cz) / 3;
      const mx = (ax + bx + cx) / 3;
      const my = (ay + by + cy) / 3;
      return h > 0.030 && mx >= 0.24 && mx < 0.41 && my >= 0.15 && my < 0.40;
    },
    targetTris: 4500,
    texSize: 512,
    roughnessFloor: 0.70,
    metalnessCap: 0.18,
  });
}

console.log('=== STEP 4: Baking Seamless River Water & Normal Map from c298e0...glb ===');
await bakeSeamlessSurfaceTexture(`${TMP}/c298e0baa304719dd507c20ab8ec4003.glb`, {
  outDiffuse: `${OUT_ASSETS}/river_water_glb.jpg`,
  outNormal: `${OUT_ASSETS}/river_water_normal_glb.jpg`,
  cropBox: { minX: -0.31, maxX: 0.31, minY: -0.31, maxY: 0.31, minH: 0.65 },
  size: 512,
  mirrorSeamless: true,
});

console.log('=== STEP 5: Baking Seamless Riverbed Pebbles Texture & 3D Cobble Cluster from e8a18d...glb ===');
{
  // Remember in e8a18d_views.png panel 2/3: the pebbles are on the -Y / -X / top-left corner of the X-Z face!
  // Let's sample the pebble-rich face cleanly on the +Y side or top -Z side (check panel 3: X vs Z shows pebbles at top-left X<0.1, Z<-0.25)
  const doc = await io.read(`${TMP}/e8a18d015b64a3f177976032c5cb61e7.glb`);
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const pos = prim.getAttribute('POSITION').getArray();
  const uv = prim.getAttribute('TEXCOORD_0').getArray();
  const baseTex = prim.getMaterial().getBaseColorTexture();
  const texW = 1024, texH = 1024;
  const texBuf = await sharp(Buffer.from(baseTex.getImage())).resize(texW, texH).removeAlpha().raw().toBuffer();

  // Panel 3 of e8a18d_views.png projected (X, Z) with depth = Y (+Y face)!
  // And the pebbles fill the top-left triangular quadrant: x in [-0.34, +0.08], z in [-0.71, -0.30] (where y > 0.24)
  const S = 256;
  const raw = Buffer.alloc(S * S * 3);
  const ybuf = new Float32Array(S * S).fill(-1e9);
  const filled = new Uint8Array(S * S);
  const minX = -0.33, maxX = 0.04, minZ = -0.71, maxZ = -0.34;
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    if (y < 0.22 || x < minX || x > maxX || z < minZ || z > maxZ) continue;
    const px = Math.min(S - 1, Math.max(0, Math.floor((x - minX) / (maxX - minX) * S)));
    const py = Math.min(S - 1, Math.max(0, Math.floor((z - minZ) / (maxZ - minZ) * S)));
    const idx = py * S + px;
    if (y > ybuf[idx]) {
      ybuf[idx] = y;
      filled[idx] = 1;
      let u = uv[i * 2] % 1; if (u < 0) u += 1;
      let v = uv[i * 2 + 1] % 1; if (v < 0) v += 1;
      const ti = (Math.min(texH - 1, Math.floor(v * texH)) * texW + Math.min(texW - 1, Math.floor(u * texW))) * 3;
      raw[idx * 3] = texBuf[ti];
      raw[idx * 3 + 1] = texBuf[ti + 1];
      raw[idx * 3 + 2] = texBuf[ti + 2];
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    const nr = Buffer.from(raw), nf = Uint8Array.from(filled);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const idx = y * S + x;
      if (filled[idx]) continue;
      let r=0,g=0,b=0,n=0;
      for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
        const nx=x+dx, ny=y+dy;
        if (nx>=0&&nx<S&&ny>=0&&ny<S&&filled[ny*S+nx]) {
          const ni=(ny*S+nx)*3; r+=raw[ni]; g+=raw[ni+1]; b+=raw[ni+2]; n++;
        }
      }
      if (n>0) { nr[idx*3]=Math.round(r/n); nr[idx*3+1]=Math.round(g/n); nr[idx*3+2]=Math.round(b/n); nf[idx]=1; }
    }
    nr.copy(raw); filled.set(nf);
  }
  const size = 512;
  const finalBuf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    const sy = y < S ? y : (size - 1 - y);
    for (let x = 0; x < size; x++) {
      const sx = x < S ? x : (size - 1 - x);
      const si = (sy * S + sx) * 3;
      const di = (y * size + x) * 3;
      finalBuf[di] = raw[si]; finalBuf[di + 1] = raw[si + 1]; finalBuf[di + 2] = raw[si + 2];
    }
  }
  await sharp(finalBuf, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${OUT_ASSETS}/river_pebbles_glb.jpg`);
  console.log(`  [OK] Baked seamless riverbed pebbles texture ${OUT_ASSETS}/river_pebbles_glb.jpg (${Math.round(fs.statSync(`${OUT_ASSETS}/river_pebbles_glb.jpg`).size / 1024)} KB)`);

  // Also extract a clean organic cluster of rounded river boulders from 7a33cb (zero flat cube edges!)
  const campDoc = await io.read(`${TMP}/7a33cb590f63c5749495fe9177f1750d.glb`);
  await extractSubMesh(campDoc, {
    name: 'river_boulders_github',
    outFile: `${OUT_MODELS}/river_boulders_github.glb`,
    filterTri: (ax, ay, az, bx, by, bz, cx, cy, cz) => {
      const h = -(az + bz + cz) / 3;
      const mx = (ax + bx + cx) / 3;
      const my = (ay + by + cy) / 3;
      // The smooth river stone cluster on the left side of the waterwheel & campfire
      return h > 0.030 && mx > -0.49 && mx < -0.34 && my > -0.22 && my < 0.14;
    },
    targetTris: 2800,
    texSize: 512,
    roughnessFloor: 0.72,
    metalnessCap: 0.06,
  });
}

console.log('ALL 5 GITHUB GLB ASSETS PROCESSED SUCCESSFULLY!');
