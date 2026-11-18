/**
 * TimberPort 3D — Stylized Low-Poly PBR Procedural Canvas Textures
 * SRGBColorSpace color maps + maxAnisotropy sharpness, 0 external assets
 */

import * as THREE from 'three';

const cache = new Map();
let maxAnisotropy = 4;

export function setTextureAnisotropy(val) {
  maxAnisotropy = Math.max(1, val || 4);
}

function finalizeTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function getGrassTexture(tintHex = '#4d7c3f') {
  const key = 'grass_' + tintHex;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle stylized low-poly turf patches
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const s = 6 + Math.random() * 14;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, s, s * 0.7);
  }

  const tex = finalizeTexture(cv, 10, 10);
  cache.set(key, tex);
  return tex;
}

export function getTimberTexture(baseHex = '#d99b52', grainHex = '#b57432') {
  const key = `timber_${baseHex}_${grainHex}`;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = grainHex;
  ctx.lineWidth = 3;
  for (let y = 8; y < 256; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  // Plank seam lines
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const tex = finalizeTexture(cv, 1, 1);
  cache.set(key, tex);
  return tex;
}

export function getBarkTexture(tint = '#5c3d28') {
  const key = 'bark_' + tint;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 128, 256);

  for (let x = 0; x < 128; x += 12) {
    ctx.fillStyle = x % 24 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, 0, 6, 256);
  }

  const tex = finalizeTexture(cv, 1, 1);
  cache.set(key, tex);
  return tex;
}

export function getAsphaltTexture() {
  if (cache.has('asphalt')) return cache.get('asphalt');

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#263140';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle mineral aggregate grain
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  // Crisp ivory outer lane shoulder lines
  ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.fillRect(14, 0, 5, 256);
  ctx.fillRect(237, 0, 5, 256);

  // Warm amber double dashed center line
  ctx.fillStyle = '#f59e0b';
  for (let y = 12; y < 256; y += 48) {
    ctx.fillRect(120, y, 5, 26);
    ctx.fillRect(131, y, 5, 26);
  }

  const tex = finalizeTexture(cv, 1, 4);
  cache.set('asphalt', tex);
  return tex;
}

export function getTravertineTexture(repeatX = 6, repeatY = 6) {
  const key = `travertine_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#ddd2be';
  ctx.fillRect(0, 0, 256, 256);

  const cols = 4;
  const rows = 4;
  const w = 256 / cols;
  const h = 256 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (w * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = ((r * 3 + c * 5) % 5 - 2) * 5;
      const baseR = 224 + shade;
      const baseG = 212 + shade;
      const baseB = 191 + shade;
      ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
      ctx.fillRect(c * w + offset + 2, r * h + 2, w - 4, h - 4);

      // Subtle warm highlight on top-left stone bevel
      ctx.fillStyle = 'rgba(255, 250, 240, 0.25)';
      ctx.fillRect(c * w + offset + 2, r * h + 2, w - 4, 3);
    }
  }

  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(120,100,80,0.06)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
  }

  const tex = finalizeTexture(cv, repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getGraniteCobbleTexture(repeatX = 5, repeatY = 5) {
  const key = `cobble_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 256, 256);

  const step = 32;
  for (let y = 0; y < 256; y += step) {
    const rowShift = ((y / step) % 2) * 16;
    for (let x = -step; x < 256; x += step) {
      const isBorder = (y === 0 || y === 224 || ((x + 256) % 256) === 0);
      const tone = isBorder ? '#d6c3a5' : ((x + y) % 64 === 0 ? '#94a3b8' : '#7b8798');
      ctx.fillStyle = tone;
      ctx.fillRect(x + rowShift + 2, y + 2, step - 4, step - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(x + rowShift + 2, y + 2, step - 4, 2);
    }
  }

  const tex = finalizeTexture(cv, repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getBoardwalkPlankTexture(repeatX = 12, repeatY = 1) {
  const key = `boardwalk_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#7c4a26';
  ctx.fillRect(0, 0, 256, 256);

  const planks = 8;
  const pw = 256 / planks;
  for (let i = 0; i < planks; i++) {
    const tones = ['#b57b45', '#a96e3b', '#be834d', '#9e6535'];
    ctx.fillStyle = tones[i % tones.length];
    ctx.fillRect(i * pw + 1.5, 0, pw - 3, 256);

    // Wood grain & nail accents
    ctx.fillStyle = 'rgba(60, 30, 10, 0.18)';
    ctx.fillRect(i * pw + 6, 0, 2, 256);
    ctx.fillRect(i * pw + 18, 0, 1.5, 256);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    for (let ny = 24; ny < 256; ny += 64) {
      ctx.fillRect(i * pw + 5, ny, 3, 3);
      ctx.fillRect(i * pw + pw - 8, ny, 3, 3);
    }
  }

  const tex = finalizeTexture(cv, repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getWaterTexture(colorHex = '#0ea5e9') {
  const key = 'water_' + colorHex;
  if (cache.has(key)) return cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  // Stylized wave crests
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  for (let y = 16; y < 256; y += 32) {
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 32) {
      const wy = y + Math.sin((x / 256) * Math.PI * 4) * 5;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  const tex = finalizeTexture(cv, 14, 14);
  cache.set(key, tex);
  return tex;
}

export function drawRadialProgressToCanvas(ctx, progress, color = '#f59e0b') {
  ctx.clearRect(0, 0, 128, 128);

  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 8;
  ctx.stroke();

  if (progress > 0.01) {
    ctx.beginPath();
    ctx.arc(64, 64, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function makeRadialProgressTexture(progress, color = '#f59e0b') {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d');
  drawRadialProgressToCanvas(ctx, progress, color);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function drawWorldBadgeToCanvas(ctx, title, subtitle, accentColor = '#f59e0b') {
  ctx.clearRect(0, 0, 320, 76);

  // Sleek dark obsidian-slate architectural plaque with hairline gold/accent border
  ctx.fillStyle = 'rgba(11, 17, 30, 0.86)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(10, 6, 300, 64, 12);
  else ctx.rect(10, 6, 300, 64);
  ctx.fill();

  ctx.strokeStyle = 'rgba(245, 196, 81, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Slim left indicator bar
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(16, 15, 5, 46, 3);
  else ctx.rect(16, 15, 5, 46);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 20px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 165, 33);

  ctx.fillStyle = accentColor;
  ctx.font = '600 17px JetBrains Mono, monospace';
  ctx.fillText(subtitle, 165, 57);
}

export function makeWorldBadgeSprite(title, subtitle, accentColor = '#f59e0b') {
  const cv = document.createElement('canvas');
  cv.width = 320;
  cv.height = 76;
  const ctx = cv.getContext('2d');
  drawWorldBadgeToCanvas(ctx, title, subtitle, accentColor);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.scale.set(3.2, 0.76, 1);
  sprite.userData._canvasCtx = ctx;
  sprite.userData._canvasTex = tex;
  return sprite;
}

export function disposeAllCachedTextures() {
  for (const tex of cache.values()) {
    tex.dispose();
  }
  cache.clear();
}


