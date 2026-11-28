/**
 * Wilderness Camp Economy, River Rafts, Merchant Riverboat, AI Workers & Composite Structures
 * Powers:
 *  - Structure #7: River Raft Dock & Merchant Pier (buildRiverDockModel)
 *  - Structure #8: Lumberjack Cabin & Woodworking Bench (buildCraftCabinModel)
 *  - Floating Bound Timber Rafts drifting downstream along getStreamCenterX(z)
 *  - Scheduled Merchant Riverboat docking right at the player's chosen river_dock
 *  - AI Camp Workers: Porters (collect loose logs -> Sawmill / Log Yard) & Choppers (fell nearby trees)
 *  - 3-Tier Upgrades: Axe (1-3), Handcart Capacity & Speed (1-3), Waterwheel Sawmill (1-3)
 */

import * as THREE from 'three';
import {
  STREAM_WATER_Y,
  getStreamCenterX,
  getStreamHalfWidth,
  getStreamTangentAngle,
  getStreamInfo,
  groundHeightAt,
  groundSlopeAt
} from './wilderness-map.js';
import {
  disposeObject3D,
  createLogMesh,
  FOREST_ASSETS,
  createArticulatedGlbWorker,
  updateArticulatedGlbWorker
} from './models.js';
import { makeWorldBadgeSprite, drawWorldBadgeToCanvas } from './textures.js';

export const WILDERNESS_UPGRADES = {
  axe: [
    { level: 1, name: 'Rìu Sắt Rừng', cost: 0, dmg: 1, cooldown: 0.58, desc: 'Rìu tiều phu cơ bản (1 sát thương/nhát).' },
    { level: 2, name: 'Rìu Thép Rèn', cost: 160, dmg: 2, cooldown: 0.48, desc: 'Lưỡi thép sắc bén: 2 sát thương/nhát, vung nhanh hơn 18%.' },
    { level: 3, name: 'Rìu Thần Mộc Ánh Kim', cost: 420, dmg: 3, cooldown: 0.40, desc: 'Lưỡi ánh kim: 3 sát thương/nhát, đốn cây cổ thụ cực nhanh.' }
  ],
  cart: [
    { level: 1, name: 'Xe Kéo Gỗ Tiêu Chuẩn', cost: 0, capacity: 10, speedMult: 1.0, desc: 'Chở tối đa 10 khúc gỗ tròn.' },
    { level: 2, name: 'Xe Kéo Gia Cố Trục Thép', cost: 200, capacity: 16, speedMult: 1.12, desc: 'Chở tối đa 16 khúc gỗ, kéo leo đồi nhanh +12%.' },
    { level: 3, name: 'Xe Kéo Đại Lâm 3 Tầng', cost: 480, capacity: 24, speedMult: 1.24, desc: 'Chở tối đa 24 khúc gỗ, kéo băng rừng nhanh +24%.' }
  ],
  sawmill: [
    { level: 1, name: 'Guồng Nước Gỗ Sồi', cost: 0, speedMult: 1.0, desc: 'Xẻ 1 khúc gỗ → 2 thanh ván trong 3.5 giây.' },
    { level: 2, name: 'Guồng Đôi Tăng Áp', cost: 240, speedMult: 1.4, desc: 'Tốc độ cưa nhanh +40% (tự động nhận thêm +40% khi trời mưa).' },
    { level: 3, name: 'Xưởng Cưa Trục Thép', cost: 560, speedMult: 1.85, desc: 'Tốc độ cưa cực đại +85%, sản xuất ván liên tục.' }
  ],
  forge: [
    { level: 1, name: 'Đá Mài Tay Cơ Bản', cost: 0, critMult: 2.0, sweetBonus: 0.0, desc: 'Chí mạng chuẩn x2.0 sát thương khi chặt trúng vùng vàng.' },
    { level: 2, name: 'Lò Rèn Đe Thép Trại', cost: 210, critMult: 2.5, sweetBonus: 0.06, desc: 'Dựng Lò Rèn 3D tại trại: Chí mạng x2.5 & mở rộng vùng vàng +6%.' },
    { level: 3, name: 'Lò Rèn Bậc Thầy Ánh Kim', cost: 520, critMult: 3.0, sweetBonus: 0.12, desc: 'Nâng mái Lò Rèn & đá mài quay: Chí mạng x3.0 & mở rộng vùng vàng +12%.' }
  ],
  quarters: [
    { level: 1, name: 'Lều Bạt Công Nhân', cost: 0, speedMult: 1.0, workerCapBonus: 0, desc: 'Tốc độ di chuyển & chặt gỗ cơ bản cho công nhân AI.' },
    { level: 2, name: 'Cổng Đèn & Trại Nghỉ Gỗ', cost: 260, speedMult: 1.24, workerCapBonus: 1, desc: 'Dựng cổng đèn trại 3D: Công nhân nhanh +24% & thêm +1 suất thuê mỗi loại.' },
    { level: 3, name: 'Doanh Trại Lâm Nghiệp Cấp Cao', cost: 620, speedMult: 1.50, workerCapBonus: 2, desc: 'Cờ hiệu & đèn lồng toàn trại: Công nhân nhanh +50% & thêm +2 suất thuê.' }
  ]
};

export const WILDERNESS_WORKER_DEFS = {
  porter: {
    id: 'porter',
    name: 'Công Nhân Vận Chuyển',
    max: 2,
    costs: [180, 340, 520, 740],
    roleText: 'Công nhân bảo hộ tự nhặt khúc gỗ rời quanh trại, ưu tiên nạp vào Xưởng Cưa hoặc Bãi Gỗ.'
  },
  chopper: {
    id: 'chopper',
    name: 'Thợ Cưa Rừng',
    max: 2,
    costs: [250, 480, 720, 980],
    roleText: 'Thợ cưa máy & cưa tay tự tìm cây trưởng thành quanh căn cứ và đốn thành khúc gỗ rời.'
  }
};

export const RAFT_UNIT_PRICES = {
  log: 12,
  plank: 22,
  craft: 56
};

export function generateMerchantOrders(completedCount = 0) {
  const tierScale = 1 + Math.min(1.2, completedCount * 0.12);
  const templates = [
    {
      id: `ord_log_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      resource: 'log',
      resourceLabel: 'Khúc gỗ tròn',
      qty: Math.round((6 + Math.floor(Math.random() * 5)) * Math.min(1.5, tierScale)),
      reward: 0,
      buyer: 'Thương Hội Hạ Lưu'
    },
    {
      id: `ord_plank_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      resource: 'plank',
      resourceLabel: 'Ván gỗ xẻ',
      qty: Math.round((6 + Math.floor(Math.random() * 6)) * Math.min(1.5, tierScale)),
      reward: 0,
      buyer: 'Xưởng Đóng Thuyền Sông'
    },
    {
      id: `ord_craft_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      resource: 'craft',
      resourceLabel: 'Đồ gỗ thủ công',
      qty: Math.max(2, Math.round((2 + Math.floor(Math.random() * 3)) * Math.min(1.5, tierScale))),
      reward: 0,
      buyer: 'Hội Quán Thủ Công'
    }
  ];
  for (const o of templates) {
    const base = RAFT_UNIT_PRICES[o.resource] || 14;
    // Merchant orders pay +38% bonus over quick raft selling!
    o.reward = Math.round(o.qty * base * 1.38);
    o.completed = false;
  }
  return templates;
}

// ---------------------------------------------------------------------------
// Composite 3D Builders for New Camp Structures (#7 River Dock, #8 Craft Cabin)
// ---------------------------------------------------------------------------
export function buildRiverDockModel(lowSpec = false) {
  const root = new THREE.Group();
  root.name = 'RiverRaftDockModel';

  const timberMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.86, metalness: 0.03 });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0xb07d4b, roughness: 0.82, metalness: 0.02 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9, metalness: 0.02 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd9c298, roughness: 0.92, metalness: 0.0 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3f6b4e, roughness: 0.78, metalness: 0.04 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffefc1,
    emissive: 0xffb347,
    emissiveIntensity: 1.4,
    roughness: 0.35
  });

  // 1. Timber deck extending along +X out over the flowing river surface
  const deckLen = 5.8;
  const deckW = 3.4;
  const deckY = 0.72;
  const plankGeo = new THREE.BoxGeometry(0.46, 0.12, deckW);
  for (let i = 0; i < 11; i++) {
    const p = new THREE.Mesh(plankGeo, i % 2 === 0 ? plankMat : timberMat);
    p.position.set(-1.2 + i * 0.52, deckY, 0);
    p.castShadow = !lowSpec;
    p.receiveShadow = true;
    root.add(p);
  }

  // Side stringer beams
  const beamGeo = new THREE.BoxGeometry(deckLen, 0.22, 0.22);
  for (const sz of [-1.42, 1.42]) {
    const b = new THREE.Mesh(beamGeo, darkWoodMat);
    b.position.set(1.4, deckY - 0.14, sz);
    root.add(b);
  }

  // Deep timber support pilings driven into the bank & riverbed
  const pileGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.6, 7);
  for (const px of [-0.9, 1.2, 3.3, 4.15]) {
    for (const pz of [-1.45, 1.45]) {
      const pile = new THREE.Mesh(pileGeo, darkWoodMat);
      pile.position.set(px, deckY - 0.55, pz);
      pile.castShadow = !lowSpec;
      root.add(pile);
    }
  }

  // 2. Small Riverside Trading Shed / Shelter Canopy on the bank side (-X)
  const postGeo = new THREE.CylinderGeometry(0.09, 0.1, 2.2, 6);
  for (const [px, pz] of [[-1.1, -1.35], [-1.1, 1.35], [0.9, -1.35], [0.9, 1.35]]) {
    const post = new THREE.Mesh(postGeo, darkWoodMat);
    post.position.set(px, deckY + 1.1, pz);
    root.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 3.25), roofMat);
  roof.position.set(-0.1, deckY + 2.28, 0);
  roof.rotation.z = -0.14;
  roof.castShadow = !lowSpec;
  root.add(roof);

  // Wooden crates & rope coil on the jetty
  const crateGeo = new THREE.BoxGeometry(0.68, 0.62, 0.68);
  const c1 = new THREE.Mesh(crateGeo, plankMat);
  c1.position.set(-0.55, deckY + 0.36, -0.82);
  const c2 = new THREE.Mesh(crateGeo, timberMat);
  c2.position.set(0.12, deckY + 0.36, -0.95);
  c2.rotation.y = 0.25;
  root.add(c1, c2);

  // Mooring post + warm pier lantern on outer river corner
  const lPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.8, 6), darkWoodMat);
  lPost.position.set(4.15, deckY + 0.9, 1.45);
  const lGlow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), lanternMat);
  lGlow.position.set(4.15, deckY + 1.88, 1.45);
  root.add(lPost, lGlow);

  // Decorative coil of mooring rope
  const ropeCoil = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.065, 6, 12), ropeMat);
  ropeCoil.rotation.x = Math.PI / 2;
  ropeCoil.position.set(3.45, deckY + 0.1, -1.05);
  root.add(ropeCoil);

  return root;
}

export function buildCraftCabinModel(lowSpec = false) {
  const root = new THREE.Group();
  root.name = 'LumberjackCraftCabinModel';

  const logWallMat = new THREE.MeshStandardMaterial({ color: 0x8d5b32, roughness: 0.88, metalness: 0.02 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9, metalness: 0.02 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a3e36, roughness: 0.82, metalness: 0.04 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7b8085, roughness: 0.92, metalness: 0.03 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffefc2,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.15,
    roughness: 0.25
  });
  const benchMat = new THREE.MeshStandardMaterial({ color: 0xc28d56, roughness: 0.76, metalness: 0.04 });

  // Stone foundation plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.45, 4.6), stoneMat);
  base.position.set(0, 0.22, 0);
  base.receiveShadow = true;
  root.add(base);

  // Stacked cabin walls
  const cabinBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.55, 3.8), logWallMat);
  cabinBody.position.set(-0.2, 1.72, -0.1);
  cabinBody.castShadow = !lowSpec;
  cabinBody.receiveShadow = true;
  root.add(cabinBody);

  // Horizontal log corner notches for authentic log-cabin silhouette
  const cornerLogGeo = new THREE.CylinderGeometry(0.14, 0.14, 4.95, 6);
  cornerLogGeo.rotateZ(Math.PI / 2);
  for (let row = 0; row < 5; row++) {
    for (const cz of [-2.0, 1.8]) {
      const cl = new THREE.Mesh(cornerLogGeo, row % 2 === 0 ? logWallMat : trimMat);
      cl.position.set(-0.2, 0.72 + row * 0.48, cz);
      root.add(cl);
    }
  }

  // Pitched A-frame timber roof (2 angled slabs + ridge beam)
  const roofSlabGeo = new THREE.BoxGeometry(5.55, 0.18, 2.85);
  const roofL = new THREE.Mesh(roofSlabGeo, roofMat);
  roofL.position.set(-0.15, 3.68, -1.02);
  roofL.rotation.x = -0.58;
  roofL.castShadow = !lowSpec;
  const roofR = new THREE.Mesh(roofSlabGeo, roofMat);
  roofR.position.set(-0.15, 3.68, 0.82);
  roofR.rotation.x = 0.58;
  roofR.castShadow = !lowSpec;
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5.65, 6), trimMat);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(-0.15, 4.46, -0.1);
  root.add(roofL, roofR, ridge);

  // Stone chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.75), stoneMat);
  chimney.position.set(-1.6, 3.95, -1.1);
  chimney.castShadow = !lowSpec;
  root.add(chimney);

  // Warm cabin door & sunlit glowing windows
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.12), trimMat);
  door.position.set(-0.9, 1.38, 1.82);
  root.add(door);

  const winGeo = new THREE.BoxGeometry(0.85, 0.78, 0.1);
  const wFront = new THREE.Mesh(winGeo, windowMat);
  wFront.position.set(0.85, 1.88, 1.82);
  const wSide = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.78, 0.9), windowMat);
  wSide.position.set(2.12, 1.88, -0.1);
  root.add(wFront, wSide);

  // Outdoor Woodworking Bench + Crafted Furniture Display on +X Porch
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.82), benchMat);
  benchTop.position.set(2.95, 0.95, 0.6);
  benchTop.castShadow = !lowSpec;
  root.add(benchTop);
  const legGeo = new THREE.BoxGeometry(0.1, 0.92, 0.1);
  for (const [lx, lz] of [[2.28, 0.28], [3.62, 0.28], [2.28, 0.92], [3.62, 0.92]]) {
    const leg = new THREE.Mesh(legGeo, trimMat);
    leg.position.set(lx, 0.48, lz);
    root.add(leg);
  }

  // Crafted wooden barrel/chair prop beside bench
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.72, 8), benchMat);
  barrel.position.set(2.95, 0.36, -0.85);
  root.add(barrel);

  return root;
}

// ---------------------------------------------------------------------------
// Floating Log Rafts & Scheduled Merchant Riverboat Controller
// ---------------------------------------------------------------------------
export class WildernessRiverTraffic {
  constructor(camp) {
    this.camp = camp;
    this.root = new THREE.Group();
    this.root.name = 'WildernessRiverTraffic';
    this.camp.root.add(this.root);

    this.rafts = [];
    this.merchantBoat = null;
    this.merchantBadge = null;
    this.buildMerchantBoat();
  }

  buildMerchantBoat() {
    const g = new THREE.Group();
    g.name = 'MerchantRiverboat';

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x6f4425, roughness: 0.82, metalness: 0.05 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xb68652, roughness: 0.84, metalness: 0.02 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.78, metalness: 0.02 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8, metalness: 0.0 });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfff7cc,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.8,
      roughness: 0.25
    });

    // Tapered river barge hull aligned along +Z (bow at +Z)
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.78, 5.2), hullMat);
    hull.position.set(0, 0.22, 0);
    hull.castShadow = !this.camp.lowSpec;
    g.add(hull);

    const bow = new THREE.Mesh(new THREE.ConeGeometry(1.28, 1.55, 4), hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.z = Math.PI / 4;
    bow.scale.set(1.0, 1.0, 0.55);
    bow.position.set(0, 0.25, 3.22);
    g.add(bow);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 4.75), deckMat);
    deck.position.set(0, 0.62, 0);
    g.add(deck);

    // Trading canopy with gold/cream stripes
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.65, 5);
    for (const [px, pz] of [[-0.85, -1.55], [0.85, -1.55], [-0.85, 0.85], [0.85, 0.85]]) {
      const p = new THREE.Mesh(postGeo, hullMat);
      p.position.set(px, 1.45, pz);
      g.add(p);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 2.75), canopyMat);
    roof.position.set(0, 2.3, -0.35);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 2.76), stripeMat);
    stripe.position.set(0, 2.31, -0.35);
    g.add(roof, stripe);

    // Cargo crates & bow lantern
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.62, 0.75), deckMat);
    crate.position.set(-0.35, 0.98, 1.48);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lanternMat);
    lantern.position.set(0, 1.28, 2.55);
    g.add(crate, lantern);

    const badge = makeWorldBadgeSprite('Thuyền Thương Lái', 'Đang cập bến · 3 đơn', '#fbbf24');
    badge.position.set(0, 3.45, 0);
    badge.scale.set(3.6, 1.05, 1);
    g.add(badge);

    g.visible = false;
    this.root.add(g);
    this.merchantBoat = g;
    this.merchantBadge = badge;
  }

  spawnFloatingRaft(startZ, resource = 'log', qty = 4) {
    const g = new THREE.Group();
    const raftLogs = 5;
    for (let i = 0; i < raftLogs; i++) {
      const lg = createLogMesh(false);
      lg.rotation.x = Math.PI / 2;
      lg.scale.set(0.55, 1.9, 0.55);
      lg.position.set((i - 2) * 0.32, 0.08, 0);
      g.add(lg);
    }

    // Visual cargo bundle matching what the player shipped
    const cargoColor = resource === 'craft' ? 0xeab308 : resource === 'plank' ? 0xd99b52 : 0x8b5a2b;
    const bundle = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.42 + Math.min(0.45, qty * 0.04), 1.45),
      new THREE.MeshStandardMaterial({ color: cargoColor, roughness: 0.8 })
    );
    bundle.position.set(0, 0.42, 0);
    g.add(bundle);

    const cx = getStreamCenterX(startZ);
    g.position.set(cx, STREAM_WATER_Y + 0.04, startZ);
    g.rotation.y = getStreamTangentAngle(startZ);
    this.root.add(g);

    this.rafts.push({
      group: g,
      z: startZ,
      age: 0,
      maxAge: 26,
      speed: 2.35,
      phase: Math.random() * Math.PI * 2
    });
  }

  update(dt, elapsed, { onMerchantArrived = null } = {}) {
    // 1. Animate floating rafts drifting downstream
    for (let i = this.rafts.length - 1; i >= 0; i--) {
      const r = this.rafts[i];
      r.age += dt;
      r.z += r.speed * dt;
      const cx = getStreamCenterX(r.z);
      const tang = getStreamTangentAngle(r.z);
      r.group.position.set(
        cx + Math.sin(elapsed * 1.4 + r.phase) * 0.35,
        STREAM_WATER_Y + 0.05 + Math.sin(elapsed * 2.2 + r.phase) * 0.05,
        r.z
      );
      r.group.rotation.y = tang + Math.sin(elapsed * 1.1 + r.phase) * 0.06;
      r.group.rotation.z = Math.sin(elapsed * 1.8 + r.phase) * 0.04;
      if (r.age >= r.maxAge || r.z > 125) {
        this.root.remove(r.group);
        disposeObject3D(r.group);
        this.rafts.splice(i, 1);
      }
    }

    // 2. Scheduled Merchant Riverboat visiting the player's placed river_dock
    if (!this.merchantBoat) return;
    if (!this.camp.isBuilt('river_dock')) {
      this.merchantBoat.visible = false;
      return;
    }

    const m = this.camp.state.merchant;
    const dockTf = this.camp.getSiteTransform('river_dock');
    const dockZ = dockTf ? dockTf.z : -6;
    const dockSide = dockTf && dockTf.x >= getStreamCenterX(dockZ) ? 1 : -1;
    const targetBoatX = getStreamCenterX(dockZ) + dockSide * Math.max(1.2, getStreamHalfWidth(dockZ) * 0.42);

    if (m.status === 'away') {
      m.timer -= dt;
      this.merchantBoat.visible = false;
      if (m.timer <= 0) {
        m.status = 'arriving';
        m.boatZ = dockZ - 48;
        m.orders = generateMerchantOrders(m.ordersCompleted || 0);
        this.merchantBoat.visible = true;
      }
    } else if (m.status === 'arriving') {
      this.merchantBoat.visible = true;
      m.boatZ += dt * 7.2;
      if (m.boatZ >= dockZ) {
        m.boatZ = dockZ;
        m.status = 'docked';
        m.timer = 90;
        if (typeof onMerchantArrived === 'function') onMerchantArrived();
      }
      const bx = THREE.MathUtils.lerp(getStreamCenterX(m.boatZ), targetBoatX, THREE.MathUtils.smoothstep(m.boatZ, dockZ - 16, dockZ));
      this.merchantBoat.position.set(bx, STREAM_WATER_Y + 0.04 + Math.sin(elapsed * 2.1) * 0.05, m.boatZ);
      this.merchantBoat.rotation.y = getStreamTangentAngle(m.boatZ);
    } else if (m.status === 'docked') {
      this.merchantBoat.visible = true;
      m.timer -= dt;
      this.merchantBoat.position.set(
        targetBoatX,
        STREAM_WATER_Y + 0.04 + Math.sin(elapsed * 1.9) * 0.045,
        dockZ
      );
      this.merchantBoat.rotation.y = getStreamTangentAngle(dockZ);
      this.merchantBoat.rotation.z = Math.sin(elapsed * 1.5) * 0.025;
      if (this.merchantBadge?.userData?._canvasCtx && Math.floor(elapsed * 2) !== this._lastBadgeTick) {
        this._lastBadgeTick = Math.floor(elapsed * 2);
        const rem = (m.orders || []).filter((o) => !o.completed).length;
        drawWorldBadgeToCanvas(
          this.merchantBadge.userData._canvasCtx,
          'Thuyền Thương Lái',
          `${rem} đơn · Rời sau ${Math.max(0, Math.ceil(m.timer))}s`,
          '#fbbf24'
        );
        if (this.merchantBadge.userData._canvasTex) this.merchantBadge.userData._canvasTex.needsUpdate = true;
      }
      if (m.timer <= 0) {
        m.status = 'departing';
        m.boatZ = dockZ;
      }
    } else if (m.status === 'departing') {
      this.merchantBoat.visible = true;
      m.boatZ += dt * 6.8;
      const bx = THREE.MathUtils.lerp(targetBoatX, getStreamCenterX(m.boatZ), THREE.MathUtils.smoothstep(m.boatZ, dockZ, dockZ + 14));
      this.merchantBoat.position.set(bx, STREAM_WATER_Y + 0.04 + Math.sin(elapsed * 2.0) * 0.05, m.boatZ);
      this.merchantBoat.rotation.y = getStreamTangentAngle(m.boatZ);
      if (m.boatZ >= dockZ + 48) {
        m.status = 'away';
        m.timer = 32;
        this.merchantBoat.visible = false;
      }
    }
  }

  getMerchantWorldPos() {
    if (!this.merchantBoat || !this.merchantBoat.visible) return null;
    return this.merchantBoat.position;
  }

  getMerchantBoatPosition() {
    return this.getMerchantWorldPos();
  }

  dispose() {
    if (this.root.parent) this.root.parent.remove(this.root);
    disposeObject3D(this.root);
    this.rafts = [];
  }
}

// ---------------------------------------------------------------------------
// AI Camp Workers (Porters & Assistant Choppers)
// ---------------------------------------------------------------------------
export class WildernessWorkerSystem {
  constructor(camp) {
    this.camp = camp;
    this.root = new THREE.Group();
    this.root.name = 'WildernessAIWorkers';
    this.camp.root.add(this.root);
    this.workers = [];
    this.syncWithState();
  }

  createWorkerMesh(role, index = 0) {
    const isChopper = role === 'chopper';
    let url = FOREST_ASSETS.workerOperator;
    let yawOffset = 0;
    let hasBuiltInTool = false;
    let workStyle = 'operate';

    if (isChopper) {
      hasBuiltInTool = true;
      if (index % 2 === 0) {
        url = FOREST_ASSETS.workerChainsaw;
        workStyle = 'chainsaw';
      } else {
        url = FOREST_ASSETS.workerSawyer;
        workStyle = 'handsaw';
      }
    } else {
      const porterModels = [
        { url: FOREST_ASSETS.workerOperator, yaw: 0 },
        { url: FOREST_ASSETS.workerBuilderA, yaw: Math.PI },
        { url: FOREST_ASSETS.workerBuilderB, yaw: 0 }
      ];
      const pick = porterModels[index % porterModels.length];
      url = pick.url;
      yawOffset = pick.yaw;
    }

    const group = createArticulatedGlbWorker(url, {
      targetHeight: isChopper ? 1.94 : 1.90,
      lowSpec: this.camp.lowSpec,
      yawOffset,
      hasBuiltInTool,
      role
    });
    return {
      group,
      workStyle
    };
  }

  syncWithState() {
    const desiredPorters = this.camp.state.workers?.porters || 0;
    const desiredChoppers = this.camp.state.workers?.choppers || 0;

    const curPorters = this.workers.filter((w) => w.role === 'porter').length;
    const curChoppers = this.workers.filter((w) => w.role === 'chopper').length;

    if (curPorters === desiredPorters && curChoppers === desiredChoppers) return;

    // Rebuild cleanly whenever headcount changes
    while (this.root.children.length > 0) {
      const c = this.root.children[0];
      this.root.remove(c);
      disposeObject3D(c);
    }
    this.workers = [];

    const spawnAnchor = this.camp.isBuilt('log_yard')
      ? this.camp.getSiteTransform('log_yard')
      : { x: 0, z: 0 };

    const addRole = (role, count) => {
      for (let i = 0; i < count; i++) {
        const parts = this.createWorkerMesh(role, i);
        const ang = (i + (role === 'chopper' ? 2.1 : 0.4)) * 1.4;
        const sx = spawnAnchor.x + Math.cos(ang) * 2.8;
        const sz = spawnAnchor.z + Math.sin(ang) * 2.8;
        const sy = this.camp.getWalkableHeightAt(sx, sz);
        parts.group.position.set(sx, sy, sz);
        this.root.add(parts.group);
        this.workers.push({
          id: `${role}_${i + 1}`,
          role,
          group: parts.group,
          workStyle: parts.workStyle,
          x: sx,
          z: sz,
          yaw: 0,
          speed: 0,
          yawRate: 0,
          state: 'idle',
          stateLabel: 'Chờ việc',
          targetLog: null,
          targetTree: null,
          carrying: false,
          timer: 0.4 + i * 0.5,
          elapsed: i * 1.7
        });
      }
    };

    addRole('porter', desiredPorters);
    addRole('chopper', desiredChoppers);
  }

  getCampCenter() {
    if (this.camp.isBuilt('log_yard')) {
      const tf = this.camp.getSiteTransform('log_yard');
      return { x: tf.x, z: tf.z };
    }
    if (this.camp.isBuilt('campfire')) {
      const tf = this.camp.getSiteTransform('campfire');
      return { x: tf.x, z: tf.z };
    }
    return { x: 0, z: 0 };
  }

  moveTowards(w, tx, tz, baseSpeed, dt, allowJog = false) {
    const dx = tx - w.x;
    const dz = tz - w.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.15) {
      w.speed *= Math.max(0, 1 - dt * 10);
      w.yawRate *= Math.max(0, 1 - dt * 10);
      return { arrived: true, distMoved: 0 };
    }
    // Unburdened workers break into a natural light Jog over longer stretches, then decelerate smoothly on approach
    const speedBoost = typeof this.camp?.getWorkerSpeedMult === 'function' ? this.camp.getWorkerSpeedMult() : 1.0;
    let desiredSpd = baseSpeed * speedBoost;
    if (allowJog && dist > 7.2) {
      desiredSpd = baseSpeed * speedBoost * 1.38;
    } else if (dist < 2.6) {
      desiredSpd = baseSpeed * speedBoost * Math.max(0.45, dist / 2.6);
    }
    w.speed = (w.speed || 0) + (desiredSpd - (w.speed || 0)) * (1 - Math.exp(-7.5 * dt));

    const step = Math.min(dist, w.speed * dt);
    w.x += (dx / dist) * step;
    w.z += (dz / dist) * step;

    const desiredYaw = Math.atan2(dx, dz);
    let diff = desiredYaw - w.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const yawStep = diff * Math.min(1, dt * 8.5);
    w.yaw += yawStep;
    w.yawRate = dt > 0.0001 ? yawStep / dt : 0;
    return { arrived: dist <= 1.25, distMoved: step };
  }

  update(dt, { onWorkerDeposit = null, onWorkerFellTree = null } = {}) {
    if (this.workers.length === 0) return;
    const center = this.getCampCenter();

    for (const w of this.workers) {
      w.elapsed = (w.elapsed || 0) + dt;
      let isMoving = false;
      let isWorking = false;
      let distMoved = 0;

      if (w.role === 'porter') {
        if (!w.carrying) {
          if (!w.targetLog || !this.camp.groundLogs.includes(w.targetLog)) {
            w.targetLog = null;
            let best = null;
            let bestDist = 48;
            for (const lg of this.camp.groundLogs) {
              const claimed = this.workers.some((o) => o !== w && o.targetLog === lg);
              if (claimed) continue;
              const d = Math.hypot(lg.pos.x - center.x, lg.pos.z - center.z);
              if (d < bestDist) {
                bestDist = d;
                best = lg;
              }
            }
            w.targetLog = best;
          }

          if (w.targetLog) {
            w.stateLabel = 'Đi nhặt khúc gỗ';
            const mv = this.moveTowards(w, w.targetLog.pos.x, w.targetLog.pos.z, 2.20, dt, true);
            isMoving = mv.distMoved > 0.002;
            distMoved = mv.distMoved;
            if (mv.arrived) {
              if (this.camp.removeGroundLog(w.targetLog)) {
                w.carrying = true;
                w.targetLog = null;
              } else {
                w.targetLog = null;
              }
            }
          } else {
            w.stateLabel = 'Trực tại Bãi gỗ';
            w.speed *= Math.max(0, 1 - dt * 10);
            w.yawRate *= Math.max(0, 1 - dt * 10);
          }
        } else {
          const useSawmill = this.camp.isBuilt('waterwheel_sawmill') && (this.camp.state.sawmillQueue || 0) < 12;
          const destId = useSawmill ? 'waterwheel_sawmill' : this.camp.isBuilt('log_yard') ? 'log_yard' : null;
          const dest = destId ? this.camp.getSiteTransform(destId) : center;
          w.stateLabel = useSawmill ? 'Nạp gỗ Xưởng Cưa' : 'Cất gỗ về Bãi Gỗ';
          const mv = this.moveTowards(w, dest.x, dest.z, 1.88, dt, false);
          isMoving = mv.distMoved > 0.002;
          distMoved = mv.distMoved;
          if (mv.arrived) {
            w.carrying = false;
            if (useSawmill) {
              this.camp.depositToSawmill(1);
            } else {
              this.camp.depositToLogYard(1);
            }
            if (typeof onWorkerDeposit === 'function') {
              onWorkerDeposit(useSawmill ? 'sawmill' : 'yard', dest.x, dest.z);
            }
          }
        }
      } else if (w.role === 'chopper') {
        if (this.camp.groundLogs.length >= 20) {
          w.stateLabel = 'Chờ khuân bớt gỗ';
          w.targetTree = null;
          w.speed *= Math.max(0, 1 - dt * 10);
          w.yawRate *= Math.max(0, 1 - dt * 10);
        } else {
          if (!w.targetTree || !w.targetTree.alive || w.targetTree.state !== 'standing') {
            w.targetTree = null;
            let best = null;
            let bestDist = 44;
            for (const t of this.camp.world.trees) {
              if (!t.alive || t.state !== 'standing' || t.isAncient) continue;
              const claimed = this.workers.some((o) => o !== w && o.targetTree === t);
              if (claimed) continue;
              const d = Math.hypot(t.pos.x - center.x, t.pos.z - center.z);
              if (d < bestDist) {
                bestDist = d;
                best = t;
              }
            }
            w.targetTree = best;
          }

          if (w.targetTree) {
            const dist = Math.hypot(w.targetTree.pos.x - w.x, w.targetTree.pos.z - w.z);
            if (dist > 2.3) {
              w.stateLabel = 'Tìm cây gần trại';
              const mv = this.moveTowards(w, w.targetTree.pos.x, w.targetTree.pos.z, 2.15, dt, true);
              isMoving = mv.distMoved > 0.002;
              distMoved = mv.distMoved;
            } else {
              w.stateLabel = w.workStyle === 'chainsaw' ? 'Đang cưa máy' : 'Đang cưa gỗ';
              isWorking = true;
              w.speed *= Math.max(0, 1 - dt * 12);
              const desiredYaw = Math.atan2(w.targetTree.pos.x - w.x, w.targetTree.pos.z - w.z);
              let diff = desiredYaw - w.yaw;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              const yawStep = diff * Math.min(1, dt * 10);
              w.yaw += yawStep;
              w.yawRate = dt > 0.0001 ? yawStep / dt : 0;
              w.timer -= dt;
              if (w.timer <= 0) {
                w.timer = w.workStyle === 'chainsaw' ? 0.92 : 1.08;
                w.targetTree.hp -= 1;
                w.targetTree.wobble = 0.8;
                this.camp.world.spawnParticles(w.targetTree.pos, 0xd97706, 3);
                this.camp.world.spawnCanopyLeafBurst?.(w.targetTree.pos.x, w.targetTree.pos.y + 4.8, w.targetTree.pos.z, 4);
                if (w.targetTree.hp <= 0) {
                  const felled = w.targetTree;
                  felled.alive = false;
                  felled.state = 'falling';
                  felled.fallYaw = Math.atan2(felled.pos.x - w.x, felled.pos.z - w.z);
                  felled.fallAngle = 0;
                  felled.fallVel = 0.36;
                  felled.landed = false;
                  felled.fallenHoldTimer = 0.38;
                  w.targetTree = null;
                  if (typeof onWorkerFellTree === 'function') onWorkerFellTree(felled);
                }
              }
            }
          } else {
            w.stateLabel = 'Tuần tra rừng';
            w.speed *= Math.max(0, 1 - dt * 10);
            w.yawRate *= Math.max(0, 1 - dt * 10);
          }
        }
      }

      if (!this._getGroundHeight) {
        this._getGroundHeight = (gx, gz) => this.camp.getWalkableHeightAt(gx, gz);
      }
      const wy = this.camp.getWalkableHeightAt(w.x, w.z);
      const slopePitch = isMoving ? groundSlopeAt(w.x, w.z, Math.sin(w.yaw), Math.cos(w.yaw)) : 0;
      const inStream = !this.camp.isOnBuiltBridge(w.x, w.z) && getStreamInfo(w.x, w.z).inStream;
      w.group.position.set(w.x, wy, w.z);
      w.group.rotation.y = w.yaw;
      updateArticulatedGlbWorker(w.group, dt, {
        moving: isMoving,
        working: isWorking,
        carrying: w.carrying,
        inWater: inStream,
        distMoved,
        speed: w.speed || 0,
        yawRate: w.yawRate || 0,
        slopePitch,
        workStyle: w.workStyle,
        elapsed: w.elapsed,
        rootYaw: w.yaw,
        getGroundHeight: this._getGroundHeight,
        onFootstep: inStream
          ? () => this.camp.world.spawnWaterRipple?.(w.x, w.z, 0.72)
          : null
      });
    }
  }

  getSummary() {
    return this.workers.map((w) => ({
      id: w.id,
      role: w.role,
      x: w.x,
      z: w.z,
      stateLabel: w.stateLabel
    }));
  }

  dispose() {
    if (this.root.parent) this.root.parent.remove(this.root);
    disposeObject3D(this.root);
    this.workers = [];
  }
}
