/**
 * TimberPort 3D — 360° Pristine Woodland Map Data Structure & Organic Cluster Generator
 * Structured geographic regions (Đất Đồi, Bãi Trống, Suối Nhỏ) and ecological primal forest clusters
 * integrated with 3D GLB pine & oak assets for natural multi-layered woodland density.
 */

import * as THREE from 'three';
import { FOREST_ASSETS } from './models.js';

export const STREAM_WATER_Y = -0.22;
export const WILDERNESS_RADIUS = 116;

// ---------------------------------------------------------------------------
// 1. Wide Winding Forest River Parametric Geometry
// ---------------------------------------------------------------------------
export function getStreamCenterX(z) {
  return 16.8 + Math.sin(z * 0.032) * 8.2 + Math.cos(z * 0.017 + 0.5) * 3.4;
}

export function getStreamHalfWidth(z) {
  return 6.5 + Math.sin(z * 0.038 + 0.8) * 1.15;
}

export function getStreamTangentAngle(z) {
  const dxDz = Math.cos(z * 0.032) * 8.2 * 0.032 - Math.sin(z * 0.017 + 0.5) * 3.4 * 0.017;
  return Math.atan2(dxDz, 1);
}

export function getStreamInfo(x, z) {
  const cx = getStreamCenterX(z);
  const halfWidth = getStreamHalfWidth(z);
  const dist = Math.abs(x - cx);
  const inStream = dist < halfWidth * 0.96;
  const depth = inStream ? Math.max(0, (1 - (dist / halfWidth) * (dist / halfWidth)) * 0.92) : 0;
  return { cx, halfWidth, dist, inStream, depth };
}

// ---------------------------------------------------------------------------
// 2. Canonical 360° Wilderness Map Data Structure
//    Zones: Bãi Trống (clearings), Suối Nhỏ (stream), Đất Đồi (hills),
//    Đường Mòn (trails), và Cụm Cây Rừng Nguyên Sơ (clusters)
// ---------------------------------------------------------------------------
export const WILDERNESS_MAP_360 = {
  meta: {
    id: 'primal_forest_360',
    name: 'Rừng Nguyên Sơ 360°',
    playableRadius: WILDERNESS_RADIUS,
    terrainSize: 420,
    waterLevel: STREAM_WATER_Y,
    spawnPoint: { x: 0, z: 0 }
  },

  zones: {
    // Bãi trống (Open Sunlit Clearings & Forest Glades)
    clearings: [
      {
        id: 'central_clearing',
        name: 'Bãi Trống Trung Tâm',
        zoneType: 'clearing',
        center: { x: 0, z: 0 },
        radius: 13.5,
        blendRadius: 24.0,
        targetElevation: 0.0,
        soilType: 'sunlit_meadow',
        isSpawn: true
      },
      {
        id: 'streamside_glade',
        name: 'Bãi Cỏ Ven Sông',
        zoneType: 'clearing',
        center: { x: 6, z: 16 },
        radius: 7.5,
        blendRadius: 13.5,
        targetElevation: 0.14,
        soilType: 'meadow_loam',
        isSpawn: false
      },
      {
        id: 'west_meadow',
        name: 'Bãi Đất Trống Tây',
        zoneType: 'clearing',
        center: { x: -34, z: 16 },
        radius: 9.5,
        blendRadius: 17.5,
        targetElevation: 0.85,
        soilType: 'mossy_meadow',
        isSpawn: false
      },
      {
        id: 'north_hollow',
        name: 'Trảng Cỏ Bắc',
        zoneType: 'clearing',
        center: { x: -12, z: -38 },
        radius: 8.5,
        blendRadius: 16.0,
        targetElevation: 1.4,
        soilType: 'pine_meadow',
        isSpawn: false
      }
    ],

    // Sông rừng (Wide Winding Forest River & Shallow Pebble Fords)
    stream: {
      id: 'woodland_stream',
      name: 'Sông Rừng Trong',
      zoneType: 'stream',
      waterY: STREAM_WATER_Y,
      lengthZ: 340,
      baseX: 16.8,
      bankBuffer: 2.5,
      fords: [
        { id: 'central_ford', name: 'Bến Lội Sông Giữa', z: 4, width: 8.0 },
        { id: 'north_ford', name: 'Ghềnh Đá Bắc', z: -42, width: 7.0 },
        { id: 'south_ford', name: 'Vũng Cạn Nam', z: 48, width: 7.5 }
      ]
    },

    // Đất đồi 360° (8 Named Rolling Hills & Timber Ridges Encircling the Valley)
    hills: [
      {
        id: 'north_pine_ridge',
        name: 'Đồi Thông Bắc',
        zoneType: 'hill',
        center: { x: 2, z: -60 },
        radius: 34,
        elevation: 5.4,
        dominantSpecies: 'pine'
      },
      {
        id: 'northeast_ancient_hill',
        name: 'Đồi Cổ Thụ Đông Bắc',
        zoneType: 'hill',
        center: { x: 60, z: -48 },
        radius: 36,
        elevation: 7.1,
        dominantSpecies: 'redwood'
      },
      {
        id: 'east_highland_crest',
        name: 'Đồi Cao Nguyên Đông',
        zoneType: 'hill',
        center: { x: 74, z: 6 },
        radius: 38,
        elevation: 8.2,
        dominantSpecies: 'pine'
      },
      {
        id: 'southeast_stream_bluff',
        name: 'Đồi Dốc Ven Sông Đông Nam',
        zoneType: 'hill',
        center: { x: 56, z: 58 },
        radius: 34,
        elevation: 6.3,
        dominantSpecies: 'oak'
      },
      {
        id: 'south_cedar_rise',
        name: 'Đồi Tuyết Tùng Nam',
        zoneType: 'hill',
        center: { x: -4, z: 64 },
        radius: 35,
        elevation: 6.0,
        dominantSpecies: 'pine'
      },
      {
        id: 'southwest_moss_hill',
        name: 'Đồi Rêu Phong Tây Nam',
        zoneType: 'hill',
        center: { x: -58, z: 50 },
        radius: 36,
        elevation: 7.4,
        dominantSpecies: 'oak'
      },
      {
        id: 'west_oak_knoll',
        name: 'Đồi Sồi Rừng Tây',
        zoneType: 'hill',
        center: { x: -66, z: -6 },
        radius: 36,
        elevation: 6.8,
        dominantSpecies: 'oak'
      },
      {
        id: 'northwest_timber_slope',
        name: 'Sườn Đồi Rừng Già Tây Bắc',
        zoneType: 'hill',
        center: { x: -50, z: -54 },
        radius: 36,
        elevation: 7.3,
        dominantSpecies: 'redwood'
      }
    ]
  },

  // Subtle dirt footpaths meandering from central clearing to stream ford & pocket meadows
  trails: [
    {
      id: 'clearing_to_ford',
      width: 2.6,
      points: [
        { x: -3, z: 0 },
        { x: 5, z: 1.2 },
        { x: 11.5, z: 2.8 },
        { x: 19.5, z: 4.0 }
      ]
    },
    {
      id: 'clearing_to_west_meadow',
      width: 2.2,
      points: [
        { x: -6, z: 2 },
        { x: -16, z: 8 },
        { x: -26, z: 13 },
        { x: -34, z: 16 }
      ]
    },
    {
      id: 'clearing_to_north_hollow',
      width: 2.1,
      points: [
        { x: -2, z: -6 },
        { x: -6, z: -18 },
        { x: -10, z: -30 },
        { x: -12, z: -38 }
      ]
    }
  ],

  // 20 Organic Primal Forest Clusters wrapping 360° around clearings, hill slopes & stream banks
  clusters: [
    // --- Ring 1: Immediate Clearing-Edge Groves (close to spawn for instant lumberjack immersion) ---
    {
      id: 'cluster_north_edge',
      name: 'Cụm Thông Cửa Rừng Bắc',
      biome: 'clearing_edge',
      center: { x: 4, z: -20 },
      radius: 10.5,
      density: 'dense',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.72, oak: 0.16, redwood: 0.12 },
      undergrowthCount: 18,
      boulderCount: 1,
      fallenLogCount: 1
    },
    {
      id: 'cluster_nw_edge',
      name: 'Cụm Rừng Già Tây Bắc',
      biome: 'clearing_edge',
      center: { x: -18, z: -14 },
      radius: 11.0,
      density: 'dense',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.55, oak: 0.30, redwood: 0.15 },
      undergrowthCount: 20,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_west_edge',
      name: 'Cụm Sồi Bìa Bãi Tây',
      biome: 'clearing_edge',
      center: { x: -22, z: 4 },
      radius: 9.5,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.35, oak: 0.55, redwood: 0.10 },
      undergrowthCount: 16,
      boulderCount: 1,
      fallenLogCount: 1
    },
    {
      id: 'cluster_sw_edge',
      name: 'Cụm Thông Bìa Nam Tây',
      biome: 'clearing_edge',
      center: { x: -13, z: 22 },
      radius: 10.0,
      density: 'dense',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.65, oak: 0.25, redwood: 0.10 },
      undergrowthCount: 18,
      boulderCount: 1,
      fallenLogCount: 1
    },
    {
      id: 'cluster_south_edge',
      name: 'Cụm Cây Bìa Nam',
      biome: 'clearing_edge',
      center: { x: 3, z: 26 },
      radius: 9.5,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.60, oak: 0.32, redwood: 0.08 },
      undergrowthCount: 15,
      boulderCount: 1,
      fallenLogCount: 0
    },
    {
      id: 'cluster_ne_stream_west',
      name: 'Cụm Ven Sông Tây Bắc',
      biome: 'streamside_grove',
      center: { x: 2, z: -29 },
      radius: 8.8,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.50, oak: 0.42, redwood: 0.08 },
      undergrowthCount: 18,
      boulderCount: 2,
      fallenLogCount: 1
    },

    // --- Ring 2: Streamside Groves (East Bank & Valley Slopes) ---
    {
      id: 'cluster_east_bank_mid',
      name: 'Cụm Rừng Bờ Đông Suối',
      biome: 'streamside_grove',
      center: { x: 42, z: -4 },
      radius: 13.0,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.62, oak: 0.23, redwood: 0.15 },
      undergrowthCount: 22,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_east_bank_south',
      name: 'Cụm Sồi Bờ Suối Đông Nam',
      biome: 'streamside_grove',
      center: { x: 44, z: 26 },
      radius: 12.5,
      density: 'dense',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.38, oak: 0.50, redwood: 0.12 },
      undergrowthCount: 20,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_east_bank_north',
      name: 'Cụm Thông Ghềnh Đá Đông Bắc',
      biome: 'streamside_grove',
      center: { x: 40, z: -34 },
      radius: 12.0,
      density: 'dense',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.68, oak: 0.18, redwood: 0.14 },
      undergrowthCount: 18,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_stream_south_west',
      name: 'Cụm Bờ Suối Hạ Lưu Tây',
      biome: 'streamside_grove',
      center: { x: 16, z: 44 },
      radius: 11.5,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.52, oak: 0.38, redwood: 0.10 },
      undergrowthCount: 16,
      boulderCount: 2,
      fallenLogCount: 0
    },

    // --- Ring 3: Rolling Hill & Old-Growth Groves (360° Slopes) ---
    {
      id: 'cluster_north_ridge',
      name: 'Rừng Thông Đồi Bắc',
      biome: 'hill_grove',
      center: { x: 4, z: -56 },
      radius: 15.0,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.76, oak: 0.10, redwood: 0.14 },
      undergrowthCount: 22,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_ne_old_growth',
      name: 'Cụm Cổ Thụ Đồi Đông Bắc',
      biome: 'old_growth',
      center: { x: 60, z: -48 },
      radius: 15.5,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.56, oak: 0.14, redwood: 0.30 },
      undergrowthCount: 22,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_east_highland',
      name: 'Rừng Cao Nguyên Đông',
      biome: 'hill_grove',
      center: { x: 70, z: 8 },
      radius: 16.0,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.70, oak: 0.15, redwood: 0.15 },
      undergrowthCount: 20,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_se_bluff',
      name: 'Cụm Đồi Dốc Đông Nam',
      biome: 'hill_grove',
      center: { x: 58, z: 54 },
      radius: 15.0,
      density: 'medium',
      treeCount: 6,
      heroCount: 1,
      speciesWeights: { pine: 0.42, oak: 0.46, redwood: 0.12 },
      undergrowthCount: 18,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_south_cedar',
      name: 'Rừng Tuyết Tùng Đồi Nam',
      biome: 'hill_grove',
      center: { x: -6, z: 58 },
      radius: 15.5,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.72, oak: 0.16, redwood: 0.12 },
      undergrowthCount: 20,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_sw_moss',
      name: 'Cụm Rêu Phong Đồi Tây Nam',
      biome: 'old_growth',
      center: { x: -52, z: 44 },
      radius: 15.5,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.36, oak: 0.48, redwood: 0.16 },
      undergrowthCount: 22,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_west_oak_hill',
      name: 'Rừng Sồi Đồi Tây',
      biome: 'hill_grove',
      center: { x: -60, z: -4 },
      radius: 16.0,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.32, oak: 0.56, redwood: 0.12 },
      undergrowthCount: 20,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_nw_old_growth',
      name: 'Rừng Nguyên Sinh Tây Bắc',
      biome: 'old_growth',
      center: { x: -46, z: -48 },
      radius: 16.0,
      density: 'dense',
      treeCount: 7,
      heroCount: 2,
      speciesWeights: { pine: 0.54, oak: 0.18, redwood: 0.28 },
      undergrowthCount: 24,
      boulderCount: 2,
      fallenLogCount: 1
    },
    {
      id: 'cluster_mid_west_grove',
      name: 'Cụm Rừng Chuyển Tiếp Tây',
      biome: 'hill_grove',
      center: { x: -38, z: -24 },
      radius: 12.0,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.58, oak: 0.30, redwood: 0.12 },
      undergrowthCount: 16,
      boulderCount: 1,
      fallenLogCount: 0
    },
    {
      id: 'cluster_mid_sw_grove',
      name: 'Cụm Rừng Chuyển Tiếp Tây Nam',
      biome: 'hill_grove',
      center: { x: -30, z: 42 },
      radius: 12.0,
      density: 'medium',
      treeCount: 5,
      heroCount: 1,
      speciesWeights: { pine: 0.52, oak: 0.36, redwood: 0.12 },
      undergrowthCount: 16,
      boulderCount: 1,
      fallenLogCount: 0
    }
  ]
};

// ---------------------------------------------------------------------------
// 3. Terrain Elevation, Clearings, Trails & Zone Classification Queries
// ---------------------------------------------------------------------------
function distToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 0.0001 ? Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq)) : 0;
  const cx = ax + vx * t;
  const cz = az + vz * t;
  return Math.hypot(px - cx, pz - cz);
}

export function getClearingFactorAt(x, z) {
  let maxBlend = 0;
  let nearestClearing = null;
  for (let i = 0; i < WILDERNESS_MAP_360.zones.clearings.length; i++) {
    const cl = WILDERNESS_MAP_360.zones.clearings[i];
    const d = Math.hypot(x - cl.center.x, z - cl.center.z);
    if (d < cl.blendRadius) {
      const b = 1 - THREE.MathUtils.smoothstep(d, cl.radius * 0.72, cl.blendRadius);
      if (b > maxBlend) {
        maxBlend = b;
        nearestClearing = cl;
      }
    }
  }
  return { factor: maxBlend, clearing: nearestClearing };
}

export function getTrailFactorAt(x, z) {
  let best = 0;
  for (let i = 0; i < WILDERNESS_MAP_360.trails.length; i++) {
    const trail = WILDERNESS_MAP_360.trails[i];
    const pts = trail.points;
    for (let j = 0; j < pts.length - 1; j++) {
      const d = distToSegment(x, z, pts[j].x, pts[j].z, pts[j + 1].x, pts[j + 1].z);
      if (d < trail.width) {
        const f = 1 - THREE.MathUtils.smoothstep(d, trail.width * 0.28, trail.width);
        if (f > best) best = f;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// 3B. Dynamic Excavator Terrain Grading & Flattened Construction Pads
// ---------------------------------------------------------------------------
const _gradedPads = [];

export function setGradedPads(pads) {
  _gradedPads.length = 0;
  if (!Array.isArray(pads)) return;
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) continue;
    _gradedPads.push({
      id: p.id || `pad_${i + 1}`,
      x: Number(p.x),
      z: Number(p.z),
      radius: Math.max(2.6, Number(p.radius) || 6.2),
      targetY: Number.isFinite(Number(p.targetY)) ? Number(p.targetY) : 0.4,
      progress: THREE.MathUtils.clamp(Number(p.progress) || 0, 0, 1),
      blendWidth: Math.max(2.5, Number(p.blendWidth) || 4.8)
    });
  }
}

export function getGradedPads() {
  return _gradedPads;
}

export function upsertGradedPad(pad) {
  if (!pad || !Number.isFinite(pad.x) || !Number.isFinite(pad.z)) return null;
  let existing = pad.id ? _gradedPads.find((p) => p.id === pad.id) : null;
  if (!existing) {
    // Merge into a nearby manual stamp if very close so manual excavator tracks stay fast & compact
    existing = _gradedPads.find((p) =>
      p.id?.startsWith('manual_') &&
      pad.id?.startsWith('manual_') &&
      Math.hypot(p.x - pad.x, p.z - pad.z) < 2.2
    );
  }
  if (existing) {
    existing.x = pad.x;
    existing.z = pad.z;
    existing.radius = Math.max(existing.radius, Number(pad.radius) || existing.radius);
    if (Number.isFinite(pad.targetY)) {
      existing.targetY = THREE.MathUtils.lerp(existing.targetY, pad.targetY, 0.35);
    }
    existing.progress = THREE.MathUtils.clamp(
      Math.max(existing.progress, Number(pad.progress) || 0),
      0,
      1
    );
    if (Number.isFinite(pad.blendWidth)) existing.blendWidth = Math.max(2.5, pad.blendWidth);
    return existing;
  }
  const created = {
    id: pad.id || `pad_${Date.now()}_${_gradedPads.length + 1}`,
    x: Number(pad.x),
    z: Number(pad.z),
    radius: Math.max(2.6, Number(pad.radius) || 6.2),
    targetY: Number.isFinite(Number(pad.targetY)) ? Number(pad.targetY) : rawProceduralGroundHeightAt(pad.x, pad.z),
    progress: THREE.MathUtils.clamp(Number(pad.progress) || 0, 0, 1),
    blendWidth: Math.max(2.5, Number(pad.blendWidth) || 4.8)
  };
  _gradedPads.push(created);
  return created;
}

export function getGradedFactorAt(x, z) {
  if (_gradedPads.length === 0) return 0;
  let best = 0;
  for (let i = 0; i < _gradedPads.length; i++) {
    const pad = _gradedPads[i];
    if (pad.progress <= 0.01) continue;
    const maxR = pad.radius + pad.blendWidth;
    const dx = x - pad.x;
    const dz = z - pad.z;
    if (Math.abs(dx) > maxR || Math.abs(dz) > maxR) continue;
    const d = Math.hypot(dx, dz);
    if (d < maxR) {
      const w = (1 - THREE.MathUtils.smoothstep(d, pad.radius * 0.85, maxR)) * pad.progress;
      if (w > best) best = w;
    }
  }
  return best;
}

export function rawProceduralGroundHeightAt(x, z) {
  const r = Math.hypot(x, z);

  // Base organic woodland undulations
  const clearT = THREE.MathUtils.smoothstep(r, 13, 38);
  const wave1 = Math.sin(x * 0.025 + 0.5) * Math.cos(z * 0.023 - 0.3) * 2.2;
  const wave2 = Math.sin(x * 0.052 - z * 0.044 + 1.1) * 0.95;
  const wave3 = Math.cos(x * 0.015 + z * 0.017) * 1.35;

  // Named 360° rolling hills (smooth Gaussian hill domes)
  let hillSum = 0;
  const hills = WILDERNESS_MAP_360.zones.hills;
  for (let i = 0; i < hills.length; i++) {
    const hDef = hills[i];
    const dx = x - hDef.center.x;
    const dz = z - hDef.center.z;
    const dSq = dx * dx + dz * dz;
    const sigmaSq = hDef.radius * hDef.radius * 0.44;
    if (dSq < hDef.radius * hDef.radius * 2.6) {
      hillSum += hDef.elevation * Math.exp(-dSq / sigmaSq);
    }
  }

  // Outer 360° amphitheater forest ridges so no open ocean/horizon void is ever exposed
  const rimRise = THREE.MathUtils.smoothstep(r, 74, 182) * 19.5;
  let h = (wave1 + wave2 + wave3 + 0.85) * clearT + hillSum * THREE.MathUtils.smoothstep(r, 12, 26) + rimRise;

  // Flatten open clearings smoothly into walkable meadows
  const { factor: clearFactor, clearing } = getClearingFactorAt(x, z);
  if (clearFactor > 0 && clearing) {
    h = THREE.MathUtils.lerp(h, clearing.targetElevation, clearFactor * 0.88);
  }

  // Carve wide winding forest river channel with gentle sandy banks & clear deep riverbed
  const { dist, halfWidth } = getStreamInfo(x, z);
  const bankBlend = 1 - THREE.MathUtils.smoothstep(dist, halfWidth * 0.90, halfWidth * 2.55);
  const bedBlend = 1 - THREE.MathUtils.smoothstep(dist, halfWidth * 0.14, halfWidth * 1.06);

  let fordLift = 0;
  const fords = WILDERNESS_MAP_360.zones.stream.fords;
  for (let i = 0; i < fords.length; i++) {
    const dz = Math.abs(z - fords[i].z);
    if (dz < fords[i].width) {
      fordLift = Math.max(fordLift, (1 - dz / fords[i].width) * 0.24);
    }
  }

  h = h * (1 - bankBlend) + 0.16 * bankBlend - bedBlend * (1.56 - fordLift);
  return h;
}

export function groundHeightAt(x, z) {
  let h = rawProceduralGroundHeightAt(x, z);

  // Apply excavator-graded flattened pads smoothly (preserving river channel)
  if (_gradedPads.length > 0) {
    const { dist, halfWidth } = getStreamInfo(x, z);
    const riverGuard = THREE.MathUtils.smoothstep(dist, halfWidth * 1.15, halfWidth * 1.95);
    if (riverGuard > 0.001) {
      let weightSum = 0;
      let targetSum = 0;
      let maxWeight = 0;
      for (let i = 0; i < _gradedPads.length; i++) {
        const pad = _gradedPads[i];
        if (pad.progress <= 0.005) continue;
        const maxR = pad.radius + pad.blendWidth;
        const dx = x - pad.x;
        const dz = z - pad.z;
        if (Math.abs(dx) > maxR || Math.abs(dz) > maxR) continue;
        const d = Math.hypot(dx, dz);
        if (d < maxR) {
          const w = (1 - THREE.MathUtils.smoothstep(d, pad.radius * 0.92, maxR)) * pad.progress;
          if (w > 0.001) {
            weightSum += w;
            targetSum += pad.targetY * w;
            if (w > maxWeight) maxWeight = w;
          }
        }
      }
      if (weightSum > 0.001) {
        const blendedTarget = targetSum / weightSum;
        const influence = Math.min(1, maxWeight) * riverGuard;
        h = THREE.MathUtils.lerp(h, blendedTarget, influence);
      }
    }
  }
  return h;
}

export function groundSlopeAt(x, z, dirX, dirZ) {
  const step = 0.75;
  const h0 = groundHeightAt(x, z);
  const h1 = groundHeightAt(x + dirX * step, z + dirZ * step);
  return THREE.MathUtils.clamp((h1 - h0) / step, -0.55, 0.55);
}

/**
 * Evaluates whether a circular footprint (radius) at (x, z) is flat enough for housing/infrastructure.
 * Hills & rough terrain return isFlat=false until leveled by an excavator (manual or AI).
 */
export function measureTerrainRoughness(x, z, radius = 5.6) {
  const hCenter = groundHeightAt(x, z);
  let minH = hCenter;
  let maxH = hCenter;
  let sumH = hCenter;
  let count = 1;
  const rings = [radius * 0.48, radius * 0.86];
  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    const rr = rings[rIdx];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const h = groundHeightAt(x + Math.cos(a) * rr, z + Math.sin(a) * rr);
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
      sumH += h;
      count++;
    }
  }
  const span = maxH - minH;
  const avgH = sumH / count;
  const gradedFactor = getGradedFactorAt(x, z);
  // Flat if elevation spread across building pad is <= 0.62m OR covered by >= 82% completed graded pad
  const isFlat = span <= 0.62 || (gradedFactor >= 0.82 && span <= 0.92);
  const flatnessPct = Math.round(
    THREE.MathUtils.clamp(1 - Math.max(0, span - 0.35) / 2.2, 0, 1) * 100
  );
  return {
    centerH: hCenter,
    avgH,
    minH,
    maxH,
    span,
    gradedFactor,
    isFlat,
    flatnessPct: isFlat ? Math.max(flatnessPct, 96) : flatnessPct
  };
}

/**
 * Queries which 360° wilderness region (Bãi Trống, Suối Nhỏ, Đất Đồi, or Rừng Nguyên Sơ)
 * contains world coordinates (x, z).
 */
export function getWildernessZoneAt(x, z) {
  const elevation = groundHeightAt(x, z);
  const stream = getStreamInfo(x, z);

  // Check nearest forest cluster
  let cluster = null;
  let bestClusterDist = Infinity;
  for (let i = 0; i < WILDERNESS_MAP_360.clusters.length; i++) {
    const c = WILDERNESS_MAP_360.clusters[i];
    const d = Math.hypot(x - c.center.x, z - c.center.z);
    if (d <= c.radius && d < bestClusterDist) {
      bestClusterDist = d;
      cluster = c;
    }
  }

  if (stream.dist < stream.halfWidth * 1.55) {
    return {
      type: 'stream',
      id: WILDERNESS_MAP_360.zones.stream.id,
      name: WILDERNESS_MAP_360.zones.stream.name,
      elevation,
      inWater: stream.inStream,
      waterDepth: stream.depth,
      clusterId: cluster?.id || null
    };
  }

  for (let i = 0; i < WILDERNESS_MAP_360.zones.clearings.length; i++) {
    const cl = WILDERNESS_MAP_360.zones.clearings[i];
    if (Math.hypot(x - cl.center.x, z - cl.center.z) <= cl.radius * 1.05) {
      return {
        type: 'clearing',
        id: cl.id,
        name: cl.name,
        elevation,
        inWater: false,
        waterDepth: 0,
        clusterId: null
      };
    }
  }

  let bestHill = null;
  let bestHillScore = 0;
  for (let i = 0; i < WILDERNESS_MAP_360.zones.hills.length; i++) {
    const hill = WILDERNESS_MAP_360.zones.hills[i];
    const d = Math.hypot(x - hill.center.x, z - hill.center.z);
    if (d < hill.radius * 1.15) {
      const score = 1 - d / (hill.radius * 1.15);
      if (score > bestHillScore) {
        bestHillScore = score;
        bestHill = hill;
      }
    }
  }

  if (bestHill && elevation > 2.2) {
    return {
      type: 'hill',
      id: bestHill.id,
      name: bestHill.name,
      elevation,
      inWater: false,
      waterDepth: 0,
      clusterId: cluster?.id || null
    };
  }

  return {
    type: 'woodland',
    id: cluster?.id || 'primal_woodland',
    name: cluster?.name || 'Rừng Nguyên Sơ',
    elevation,
    inWater: false,
    waterDepth: 0,
    clusterId: cluster?.id || null
  };
}

// ---------------------------------------------------------------------------
// 4. Deterministic Organic Primal Forest Cluster Layout Generator
//    Produces natural layered tree clusters (Hero Mother Trees -> Mid-Canopy -> Edge Saplings),
//    clustered undergrowth ferns, mossy boulders, fallen logs & 360° ridge groves.
// ---------------------------------------------------------------------------
function pickWeightedSpecies(weights, r) {
  const wPine = weights?.pine ?? 0.6;
  const wOak = weights?.oak ?? 0.28;
  if (r < wPine) return 'pine';
  if (r < wPine + wOak) return 'oak';
  return 'redwood';
}

function selectGlbModelForTree(kind, role, variant) {
  if (kind === 'oak') {
    return FOREST_ASSETS.oakGithub;
  }
  return FOREST_ASSETS.pineGithub;
}

export function generateClusteredForestLayout(lowSpec = false) {
  let seed = 20260360;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const placedTrees = [];
  const clustersOut = [];
  const boulders = [];
  const ferns = [];
  const fallenLogs = [];
  const ridgeHeroTrees = [];
  const bgCanopy = [];

  const isInsideAnyClearing = (tx, tz, padding = 0) => {
    const clearings = WILDERNESS_MAP_360.zones.clearings;
    for (let i = 0; i < clearings.length; i++) {
      const cl = clearings[i];
      const keepClear = cl.isSpawn ? cl.radius * 0.78 : cl.radius * 0.82;
      if (Math.hypot(tx - cl.center.x, tz - cl.center.z) < keepClear + padding) {
        return true;
      }
    }
    return false;
  };

  const canPlaceTree = (tx, tz, minSpacing) => {
    const r = Math.hypot(tx, tz);
    if (r > WILDERNESS_RADIUS - 6) return false;
    if (isInsideAnyClearing(tx, tz, 0.5)) return false;
    const st = getStreamInfo(tx, tz);
    if (st.dist < st.halfWidth + WILDERNESS_MAP_360.zones.stream.bankBuffer) return false;
    if (getTrailFactorAt(tx, tz) > 0.45) return false;

    for (let i = 0; i < placedTrees.length; i++) {
      const dx = placedTrees[i].x - tx;
      const dz = placedTrees[i].z - tz;
      const req = Math.max(minSpacing, (placedTrees[i].minSep || minSpacing) * 0.85);
      if (dx * dx + dz * dz < req * req) return false;
    }
    return true;
  };

  const densityScale = lowSpec ? 0.72 : 1.0;
  let globalTreeIdx = 0;

  // A. Populate each of the 20 curated primal forest clusters with ecological height layering
  for (let cIdx = 0; cIdx < WILDERNESS_MAP_360.clusters.length; cIdx++) {
    const cDef = WILDERNESS_MAP_360.clusters[cIdx];
    const targetCount = Math.max(3, Math.round(cDef.treeCount * densityScale));
    const heroTarget = Math.min(cDef.heroCount || 1, Math.max(1, targetCount - 2));
    const clusterTrees = [];

    for (let t = 0; t < targetCount; t++) {
      const role = t < heroTarget
        ? 'hero'
        : t < Math.ceil(targetCount * 0.72)
          ? 'mid'
          : 'sapling';

      let placed = null;
      for (let attempt = 0; attempt < 42; attempt++) {
        const ang = rand() * Math.PI * 2;
        // Hero trees cluster near the core; mid trees form middle ring; saplings soften the perimeter
        let normR;
        if (role === 'hero') {
          normR = Math.sqrt(rand()) * 0.36;
        } else if (role === 'mid') {
          normR = 0.28 + Math.sqrt(rand()) * 0.48;
        } else {
          normR = 0.62 + rand() * 0.42;
        }
        // Slight organic elliptical distortion per cluster so clusters never look like geometric circles
        const aspectX = 0.88 + ((cIdx * 37) % 10) * 0.03;
        const aspectZ = 1.12 - ((cIdx * 23) % 10) * 0.025;
        const tx = cDef.center.x + Math.cos(ang) * cDef.radius * normR * aspectX;
        const tz = cDef.center.z + Math.sin(ang) * cDef.radius * normR * aspectZ;
        const minSep = role === 'hero' ? 4.4 : role === 'mid' ? 3.9 : 3.2;

        if (!canPlaceTree(tx, tz, minSep)) continue;

        const kind = role === 'hero' && (cDef.speciesWeights?.redwood || 0) >= 0.24
          ? 'redwood'
          : pickWeightedSpecies(cDef.speciesWeights, rand());
        const variant = globalTreeIdx;
        const modelUrl = selectGlbModelForTree(kind, role, variant);

        const baseTargetHeight = kind === 'redwood' ? 11.2 : kind === 'oak' ? 8.3 : 9.1;
        const roleScale = role === 'hero'
          ? (1.08 + rand() * 0.22)
          : role === 'mid'
            ? (0.86 + rand() * 0.20)
            : (0.64 + rand() * 0.18);

        const y = groundHeightAt(tx, tz);
        placed = {
          id: globalTreeIdx,
          clusterId: cDef.id,
          clusterName: cDef.name,
          biome: cDef.biome,
          role,
          kind,
          variant,
          modelUrl,
          targetHeight: baseTargetHeight,
          x: tx,
          y,
          z: tz,
          rotY: rand() * Math.PI * 2,
          scale: roleScale,
          minSep,
          maxHp: kind === 'redwood' ? 5 : role === 'hero' ? 4 : kind === 'oak' ? 4 : 3,
          logYield: (kind === 'redwood' || role === 'hero') ? 2 : 1
        };
        globalTreeIdx++;
        placedTrees.push(placed);
        clusterTrees.push(placed);
        break;
      }
    }

    // Clustered undergrowth ferns concentrated around tree roots inside each grove
    const fernTarget = Math.max(4, Math.round((cDef.undergrowthCount || 14) * densityScale));
    for (let f = 0; f < fernTarget; f++) {
      const anchor = clusterTrees.length > 0 && rand() < 0.72
        ? clusterTrees[Math.floor(rand() * clusterTrees.length)]
        : { x: cDef.center.x, z: cDef.center.z };
      const ang = rand() * Math.PI * 2;
      const dist = anchor === cDef.center ? rand() * cDef.radius : (0.9 + rand() * 3.8);
      const fx = anchor.x + Math.cos(ang) * dist;
      const fz = anchor.z + Math.sin(ang) * dist;
      if (getStreamInfo(fx, fz).inStream) continue;
      ferns.push({
        x: fx,
        y: groundHeightAt(fx, fz) - 0.04,
        z: fz,
        scale: 0.68 + rand() * 1.08,
        scaleY: 0.78 + rand() * 0.55,
        rotX: (rand() - 0.5) * 0.22,
        rotY: rand() * Math.PI * 2,
        rotZ: (rand() - 0.5) * 0.22,
        tint: rand(),
        clusterId: cDef.id
      });
    }

    // Mossy forest boulders tucked into cluster bases
    const clusterBoulderCount = lowSpec ? Math.min(1, cDef.boulderCount || 0) : (cDef.boulderCount || 0);
    for (let b = 0; b < clusterBoulderCount; b++) {
      const ang = rand() * Math.PI * 2;
      const dist = 1.6 + rand() * (cDef.radius * 0.72);
      const bx = cDef.center.x + Math.cos(ang) * dist;
      const bz = cDef.center.z + Math.sin(ang) * dist;
      if (isInsideAnyClearing(bx, bz, -1.0)) continue;
      boulders.push({
        x: bx,
        y: groundHeightAt(bx, bz) - 0.14,
        z: bz,
        footprint: 1.45 + rand() * 1.95,
        yaw: rand() * Math.PI * 2,
        clusterId: cDef.id
      });
    }

    // Fallen mossy timber logs along cluster perimeters
    const fallenTarget = lowSpec && cIdx % 2 === 1 ? 0 : (cDef.fallenLogCount || 0);
    for (let l = 0; l < fallenTarget; l++) {
      const ang = rand() * Math.PI * 2;
      const dist = cDef.radius * (0.55 + rand() * 0.42);
      const lx = cDef.center.x + Math.cos(ang) * dist;
      const lz = cDef.center.z + Math.sin(ang) * dist;
      if (getStreamInfo(lx, lz).dist < 7.2 || isInsideAnyClearing(lx, lz, -1.5)) continue;
      fallenLogs.push({
        x: lx,
        y: groundHeightAt(lx, lz) - 0.05,
        z: lz,
        footprint: 2.55 + rand() * 0.95,
        yaw: rand() * Math.PI * 2,
        clusterId: cDef.id
      });
    }

    clustersOut.push({
      ...cDef,
      trees: clusterTrees
    });
  }

  // B. Natural Riverbank Boulders & Wet Cobblestone Outcrops lining both banks & shallow fords
  const streamBoulderCount = lowSpec ? 26 : 48;
  for (let i = 0; i < streamBoulderCount; i++) {
    const rz = -104 + (i / streamBoulderCount) * 208 + (rand() - 0.5) * 5.2;
    const side = i % 2 === 0 ? -1 : 1;
    const hw = getStreamHalfWidth(rz);
    const rx = getStreamCenterX(rz) + side * (hw * (0.78 + rand() * 0.56));
    boulders.push({
      x: rx,
      y: groundHeightAt(rx, rz) - 0.16,
      z: rz,
      footprint: 1.35 + rand() * 2.15,
      yaw: rand() * Math.PI * 2,
      clusterId: 'woodland_stream',
      isRiverbank: true,
      variant: i
    });
  }

  // C. Prominent 3D GLB Pine & Oak Trees on outer hill crests (100% consistent new GitHub tree art)
  const ridgeHeroCount = lowSpec ? 14 : 24;
  for (let i = 0; i < ridgeHeroCount; i++) {
    const ang = (i / ridgeHeroCount) * Math.PI * 2 + (rand() - 0.5) * 0.18;
    const rad = 84 + rand() * 34;
    const rx = Math.cos(ang) * rad;
    const rz = Math.sin(ang) * rad;
    const st = getStreamInfo(rx, rz);
    if (st.dist < st.halfWidth + 4.0) continue;
    ridgeHeroTrees.push({
      x: rx,
      y: groundHeightAt(rx, rz) - 0.16,
      z: rz,
      modelUrl: i % 3 === 0 ? FOREST_ASSETS.oakGithub : FOREST_ASSETS.pineGithub,
      targetHeight: 11.2 + rand() * 4.2,
      yaw: rand() * Math.PI * 2
    });
  }

  // D. Dense 360° Background Woodland Canopy arranged in organic outer hill groves
  const bgGroveCenters = [];
  const groveRingCount = 16;
  for (let g = 0; g < groveRingCount; g++) {
    const ang = (g / groveRingCount) * Math.PI * 2 + (rand() - 0.5) * 0.22;
    const rad = 96 + rand() * 68;
    bgGroveCenters.push({
      x: Math.cos(ang) * rad,
      z: Math.sin(ang) * rad,
      spread: 18 + rand() * 18
    });
  }

  const bgCount = lowSpec ? 260 : 420;
  for (let i = 0; i < bgCount * 3 && bgCanopy.length < bgCount; i++) {
    let bx, bz;
    if (rand() < 0.65) {
      const g = bgGroveCenters[Math.floor(rand() * bgGroveCenters.length)];
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * g.spread;
      bx = g.x + Math.cos(a) * d;
      bz = g.z + Math.sin(a) * d;
    } else {
      const ang = rand() * Math.PI * 2;
      const rad = 74 + Math.pow(rand(), 0.74) * 116;
      bx = Math.cos(ang) * rad;
      bz = Math.sin(ang) * rad;
    }
    if (Math.hypot(bx, bz) < 68) continue;
    const st = getStreamInfo(bx, bz);
    if (st.dist < st.halfWidth + 3.0) continue;
    bgCanopy.push({
      x: bx,
      y: groundHeightAt(bx, bz) - 0.16,
      z: bz,
      s: 0.88 + rand() * 0.85,
      ry: rand() * Math.PI * 2,
      tint: rand()
    });
  }

  return {
    map: WILDERNESS_MAP_360,
    clusters: clustersOut,
    trees: placedTrees,
    boulders,
    ferns,
    fallenLogs,
    ridgeHeroTrees,
    bgCanopy
  };
}
