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
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  // Yellow dashed road center line
  ctx.fillStyle = '#f59e0b';
  for (let y = 12; y < 256; y += 48) {
    ctx.fillRect(124, y, 8, 26);
  }

  const tex = finalizeTexture(cv, 1, 4);
  cache.set('asphalt', tex);
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
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 10;
  ctx.stroke();

  if (progress > 0.01) {
    ctx.beginPath();
    ctx.arc(64, 64, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
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
  ctx.clearRect(0, 0, 320, 84);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(4, 4, 312, 76, 14);
  else ctx.rect(4, 4, 312, 76);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 160, 34);

  ctx.fillStyle = accentColor;
  ctx.font = '700 19px JetBrains Mono, monospace';
  ctx.fillText(subtitle, 160, 62);
}

export function makeWorldBadgeSprite(title, subtitle, accentColor = '#f59e0b') {
  const cv = document.createElement('canvas');
  cv.width = 320;
  cv.height = 84;
  const ctx = cv.getContext('2d');
  drawWorldBadgeToCanvas(ctx, title, subtitle, accentColor);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(4.2, 1.1, 1);
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

