/**
 * TimberPort 3D — Commercial Game State, Market Economy, Retention & Persistence
 * Zero external dependencies, unified supply chain + 7-day streak + offline income + market + achievements
 */

export const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:3000' : '';

export const BRANCHES = [
  {
    id: 'pine_bay',
    name: 'Vịnh Thông Xanh',
    region: 'Khởi nghiệp ven biển',
    multiplier: 1.0,
    unlockCost: 0,
    reqContracts: 0,
    skyColor: '#8ecae6',
    fogColor: '#bfe3f2',
    groundTint: '#4d7c3f',
    waterColor: '#0ea5e9',
    desc: 'Vịnh rừng thông nguyên sinh với xưởng cưa đầu tiên và cầu tàu gỗ.'
  },
  {
    id: 'nordic_fjord',
    name: 'Cảng Bắc Âu',
    region: 'Vùng Fjord nước sâu',
    multiplier: 2.5,
    unlockCost: 8500,
    reqContracts: 2,
    skyColor: '#7eb8da',
    fogColor: '#b7d7e8',
    groundTint: '#3f6a4f',
    waterColor: '#0284c7',
    desc: 'Tuyến hàng hải nước sâu tăng x2.5 giá trị gỗ xẻ và cá hồi đóng hộp.'
  },
  {
    id: 'jade_archipelago',
    name: 'Quần Đảo Ngọc',
    region: 'Đặc khu thương mại Á-Âu',
    multiplier: 6.0,
    unlockCost: 35000,
    reqContracts: 5,
    skyColor: '#67c3e8',
    fogColor: '#b9ebfa',
    groundTint: '#4f8a42',
    waterColor: '#06b6d4',
    desc: 'Cảng trung chuyển quốc tế, tăng x6.0 lợi nhuận toàn chuỗi cung ứng.'
  },
  {
    id: 'royal_harbor',
    name: 'Thương Cảng Hoàng Gia',
    region: 'Trung tâm xuất khẩu toàn cầu',
    multiplier: 15.0,
    unlockCost: 140000,
    reqContracts: 10,
    skyColor: '#93c5fd',
    fogColor: '#dbeafe',
    groundTint: '#3d7448',
    waterColor: '#2563eb',
    desc: 'Đế chế hàng hải tối thượng với giá xuất khẩu x15.0 và đội tàu siêu tải.'
  }
];

export const SKINS = [
  { id: 'classic', name: 'Thợ Rừng Cổ Điển', desc: 'Áo caro đỏ & mũ bảo hộ vàng chuẩn công trường.', costType: 'free', cost: 0, speedBonus: 0, shirt: 0xc2410c, pants: 0x1e3a8a, hat: 0xfacc15, accent: 0xf97316 },
  { id: 'titan', name: 'Kỹ Sư Titan', desc: 'Giáp kỹ thuật công nghiệp, tăng +10% tốc độ chạy.', costType: 'cash', cost: 2400, speedBonus: 0.10, shirt: 0x0284c7, pants: 0x0f172a, hat: 0x38bdf8, accent: 0xe2e8f0 },
  { id: 'captain', name: 'Thuyền Trưởng Cảng', desc: 'Đồng phục hải quân thương cảng, tăng +15% giá bán.', costType: 'gems', cost: 45, speedBonus: 0.08, shirt: 0x1e293b, pants: 0xf8fafc, hat: 0xffffff, accent: 0xf59e0b },
  { id: 'gold_tycoon', name: 'Tỷ Phú Hoàng Kim', desc: 'Bộ vest ánh vàng hoàng gia, tăng +25% thu nhập.', costType: 'gems', cost: 120, speedBonus: 0.18, shirt: 0xf59e0b, pants: 0x1e1b4b, hat: 0xfde047, accent: 0xfbbf24 }
];

export const PETS = [
  { id: 'none', name: 'Không mang thú cưng', desc: 'Di chuyển một mình trên công trường.', costType: 'free', cost: 0, bonusText: 'Mặc định' },
  { id: 'shiba', name: 'Chó Shiba Hút Gỗ', desc: 'Chạy theo chủ nhân, tăng +45% tầm hút gỗ & +12% tốc độ.', costType: 'cash', cost: 1800, bonusText: '+45% Tầm hút · +12% Tốc độ' },
  { id: 'cyber_cat', name: 'Mèo Máy Cyber', desc: 'Quét laser tăng +30% cơ hội rơi Gỗ Đỏ quý & Đá quý.', costType: 'gems', cost: 55, bonusText: '+30% Gỗ Đỏ & Gems' },
  { id: 'harbor_hawk', name: 'Chim Ưng Hải Cảng', desc: 'Bay lượn hỗ trợ tàu cảng, tăng +25% tốc độ bốc dỡ cảng.', costType: 'gems', cost: 95, bonusText: '+25% Tốc độ Cảng' }
];

export const VEHICLES = [
  { id: 'forklift', name: 'Xe Nâng Công Nghiệp', desc: 'Bốc xếp pallet và di chuyển linh hoạt quanh xưởng.', costType: 'free', cost: 0, speed: 12.5, capacity: 14, color: 0xf59e0b },
  { id: 'pickup', name: 'Bán Tải Vận Chuyển V8', desc: 'Chở tối đa 28 gỗ/ván từ rừng ra cảng với tốc độ cao.', costType: 'cash', cost: 4500, speed: 16.5, capacity: 28, color: 0x0ea5e9 },
  { id: 'supercar', name: 'Siêu Xe Địa Hình 4x4', desc: 'Siêu xe thương mại cao cấp, tốc độ vượt trội + tự hút gỗ.', costType: 'gems', cost: 110, speed: 22.0, capacity: 40, color: 0xef4444 }
];

export const UPGRADE_CATALOG = [
  { id: 'axeTier', category: 'player', name: 'Rìu Khai Thác', icon: '🪓', max: 5, baseCost: 120, scale: 1.85, desc: (lv) => `Giảm số nhát chặt còn ${Math.max(1, 5 - lv)} nhát/cây.` },
  { id: 'backpackTier', category: 'player', name: 'Balo Chở Gỗ', icon: '🎒', max: 8, baseCost: 140, scale: 1.75, desc: (lv) => `Sức chứa ${6 + (lv - 1) * 4} khúc gỗ.` },
  { id: 'bootsTier', category: 'player', name: 'Giày Tăng Tốc', icon: '🥾', max: 5, baseCost: 160, scale: 1.8, desc: (lv) => `Tốc độ chạy +${(lv - 1) * 18}%.` },

  { id: 'sawSpeedTier', category: 'sawmill', name: 'Tốc Độ Máy Cưa', icon: '⚙️', max: 6, baseCost: 220, scale: 1.85, desc: (lv) => `Xẻ ${lv} ván mỗi nhịp, nhanh x${(1 + (lv - 1) * 0.35).toFixed(2)}.` },
  { id: 'conveyorTier', category: 'sawmill', name: 'Băng Chuyền Tự Động', icon: '⏩', max: 5, baseCost: 280, scale: 1.9, desc: (lv) => lv === 0 ? 'Mở khóa đóng đai Pallet tự động.' : `Đóng Pallet & đẩy hàng cấp ${lv}.` },
  { id: 'plankValueTier', category: 'sawmill', name: 'Chất Lượng Gỗ Sấy', icon: '✨', max: 6, baseCost: 250, scale: 1.9, desc: (lv) => `Giá trị bán hàng hóa +${(lv - 1) * 35}%.` },

  { id: 'lumberjacks', category: 'workforce', name: 'Thợ Rừng Tự Động', icon: '👷', max: 6, baseCost: 260, scale: 1.7, desc: (lv) => `${lv} thợ tự đốn cây & nạp gỗ về xưởng.` },
  { id: 'autoForklifts', category: 'workforce', name: 'Đội Xe Nâng AI', icon: '🚜', max: 4, baseCost: 520, scale: 1.9, desc: (lv) => `${lv} xe nâng tự chuyển hàng ra cầu cảng.` },
  { id: 'fishingBoats', category: 'workforce', name: 'Đội Tàu Đánh Cá', icon: '⛵', max: 4, baseCost: 480, scale: 1.85, desc: (lv) => `${lv} tàu đánh bắt cá & đóng hộp xuất khẩu.` }
];

export const VIP_TIERS = [
  { level: 1, name: 'VIP Đồng', xpReq: 100, bonusMult: 1.25, perk: '+25% Doanh thu & +20% Tầm hút' },
  { level: 2, name: 'VIP Bạc', xpReq: 300, bonusMult: 1.50, perk: '+50% Doanh thu & +15% Tốc độ' },
  { level: 3, name: 'VIP Vàng', xpReq: 700, bonusMult: 1.85, perk: '+85% Doanh thu & Tăng ca giảm hồi' },
  { level: 4, name: 'VIP Bạch Kim', xpReq: 1500, bonusMult: 2.30, perk: '+130% Doanh thu & Miễn phí 20% nâng cấp' },
  { level: 5, name: 'VIP Kim Cương', xpReq: 3000, bonusMult: 3.00, perk: 'x3.00 Toàn Đế Chế & Vương Miện 3D' }
];

export const GEM_PACKS = [
  { id: 'pack_starter', name: 'Gói Khởi Nghiệp', gems: 60, vipXp: 120, bonus: '+60 💎 · +120 VIP XP', badge: 'Phổ biến', priceLabel: '$0 (Dùng thử TM)' },
  { id: 'pack_merchant', name: 'Gói Thương Gia Cảng', gems: 180, vipXp: 380, bonus: '+180 💎 · +380 VIP XP', badge: 'Tiết kiệm', priceLabel: 'Đổi $15,000 Cash' },
  { id: 'pack_tycoon', name: 'Gói Tài Phiệt Toàn Cầu', gems: 450, vipXp: 900, bonus: '+450 💎 · +900 VIP XP', badge: 'Giá trị nhất', priceLabel: 'Đổi $45,000 Cash' }
];

export const SEASON_PASS_TIERS = Array.from({ length: 12 }, (_, idx) => {
  const tier = idx + 1;
  return {
    tier,
    xpReq: tier * 80,
    freeReward: tier % 3 === 0
      ? { type: 'gems', amount: 15 + tier * 2, label: `+${15 + tier * 2} 💎` }
      : { type: 'cash', amount: 450 * tier, label: `+$${(450 * tier).toLocaleString()}` },
    premiumReward: tier % 2 === 0
      ? { type: 'gems', amount: 30 + tier * 5, label: `+${30 + tier * 5} 💎` }
      : { type: 'cash', amount: 1400 * tier, label: `+$${(1400 * tier).toLocaleString()}` }
  };
});

export const DAILY_REWARDS = [
  { day: 1, title: 'Ngày 1', type: 'cash', amount: 500, label: '+$500 Cash', icon: '💵' },
  { day: 2, title: 'Ngày 2', type: 'gems', amount: 15, label: '+15 💎', icon: '💎' },
  { day: 3, title: 'Ngày 3', type: 'cash', amount: 1400, label: '+$1,400 Cash', icon: '💵' },
  { day: 4, title: 'Ngày 4', type: 'gems', amount: 25, label: '+25 💎', icon: '💎' },
  { day: 5, title: 'Ngày 5', type: 'cash', amount: 3200, label: '+$3,200 Cash', icon: '💰' },
  { day: 6, title: 'Ngày 6', type: 'gems', amount: 40, label: '+40 💎', icon: '💎' },
  { day: 7, title: 'Ngày 7', type: 'gems', amount: 85, label: '+85 💎 · +120 VIP', icon: '👑' }
];

export const ACHIEVEMENTS = [
  { id: 'ach_logs_50', title: 'Tiều Phu Chăm Chỉ', desc: 'Đốn tổng cộng 50 khúc gỗ tại rừng.', statKey: 'totalLogsCut', target: 50, rewardCash: 600, rewardGems: 12 },
  { id: 'ach_logs_300', title: 'Vua Rừng Nguyên Sinh', desc: 'Đốn tổng cộng 300 khúc gỗ.', statKey: 'totalLogsCut', target: 300, rewardCash: 3500, rewardGems: 35 },
  { id: 'ach_saw_120', title: 'Chủ Xưởng Công Nghiệp', desc: 'Xẻ thành công 120 thanh ván gỗ.', statKey: 'totalPlanksSawn', target: 120, rewardCash: 1800, rewardGems: 20 },
  { id: 'ach_contract_1', title: 'Chuyến Tàu Vượt Biển', desc: 'Hoàn thành 1 hợp đồng xuất khẩu cảng.', statKey: 'contractsCompleted', target: 1, rewardCash: 1200, rewardGems: 18 },
  { id: 'ach_contract_5', title: 'Đế Chế Hàng Hải', desc: 'Hoàn thành 5 hợp đồng xuất khẩu.', statKey: 'contractsCompleted', target: 5, rewardCash: 9000, rewardGems: 65 },
  { id: 'ach_cash_15k', title: 'Triệu Phú Thương Cảng', desc: 'Tích lũy $15,000 tiền mặt trong két.', statKey: 'cash', target: 15000, rewardCash: 2500, rewardGems: 40 }
];

export const MARKET_COMMODITIES = [
  { key: 'planks', name: 'Ván Gỗ Xẻ', unit: 'thanh', basePrice: 24, color: '#f59e0b' },
  { key: 'pallets', name: 'Kiện Pallet Đai Thép', unit: 'kiện', basePrice: 115, color: '#10b981' },
  { key: 'cannedFish', name: 'Cá Hộp Xuất Khẩu', unit: 'hộp', basePrice: 75, color: '#38bdf8' },
  { key: 'furniture', name: 'Nội Thất Xuất Khẩu', unit: 'bộ', basePrice: 280, color: '#f43f5e' }
];

export const marketState = {
  lastUpdateMs: Date.now(),
  items: {
    planks: { mult: 1.05, history: [0.96, 1.0, 1.02, 0.99, 1.04, 1.08, 1.03, 1.05] },
    pallets: { mult: 1.12, history: [1.0, 0.98, 1.05, 1.09, 1.14, 1.1, 1.08, 1.12] },
    cannedFish: { mult: 0.98, history: [1.04, 1.01, 0.97, 0.95, 0.99, 1.02, 1.0, 0.98] },
    furniture: { mult: 1.15, history: [1.02, 1.06, 1.04, 1.1, 1.12, 1.09, 1.14, 1.15] }
  }
};

export function updateMarketPrices() {
  const surged = [];
  for (const c of MARKET_COMMODITIES) {
    if (!marketState.items[c.key]) {
      marketState.items[c.key] = { mult: 1.05, history: [1.0, 1.02, 1.05] };
    }
    const entry = marketState.items[c.key];
    // Mean-reverting stochastic step within [0.82, 1.48]
    const pull = (1.08 - entry.mult) * 0.25;
    const shock = (Math.random() - 0.48) * 0.22;
    const next = Math.max(0.82, Math.min(1.48, Number((entry.mult + pull + shock).toFixed(2))));
    entry.mult = next;
    entry.history.push(next);
    if (entry.history.length > 12) entry.history.shift();
    if (next >= 1.25) surged.push(`${c.name} (+${Math.round((next - 1) * 100)}%)`);
  }
  marketState.lastUpdateMs = Date.now();
  return surged;
}

export const MANAGER_CATALOG = [
  { id: 'mgr_forest', name: 'Giám Đốc Lâm Trường', role: 'Khai thác Rừng', icon: '🌲', statKey: 'forestSpeed', baseCost: 900, scale: 2.1, maxStar: 5, bonusPerStar: 0.16, desc: (lv) => `+${lv * 16}% tốc độ đốn cây & sản lượng thợ rừng.` },
  { id: 'mgr_sawmill', name: 'Kỹ Sư Trưởng Xưởng', role: 'Dây chuyền Cưa', icon: '⚙️', statKey: 'sawValue', baseCost: 1400, scale: 2.2, maxStar: 5, bonusPerStar: 0.15, desc: (lv) => `+${lv * 15}% giá trị ván gỗ & tốc độ băng chuyền.` },
  { id: 'mgr_harbor', name: 'Trưởng Cảng Thương Mại', role: 'Xuất khẩu Cảng', icon: '⚓', statKey: 'contractBonus', baseCost: 2200, scale: 2.3, maxStar: 5, bonusPerStar: 0.18, desc: (lv) => `+${lv * 18}% tiền thưởng hợp đồng & tốc độ xe nâng AI.` },
  { id: 'mgr_coldchain', name: 'Điều Phối Chuỗi Lạnh', role: 'Thủy sản & Ngoại tuyến', icon: '❄️', statKey: 'offlineBonus', baseCost: 1800, scale: 2.15, maxStar: 5, bonusPerStar: 0.20, desc: (lv) => `+${lv * 20}% giá trị cá hộp & thu nhập ngoại tuyến.` }
];

export const WHEEL_SEGMENTS = [
  { id: 'w_cash_sm', label: '+$850', type: 'cash', amount: 850, color: '#1e293b', text: '#34d399' },
  { id: 'w_gems_15', label: '+15 💎', type: 'gems', amount: 15, color: '#0c4a6e', text: '#7dd3fc' },
  { id: 'w_cash_md', label: '+$2,600', type: 'cash', amount: 2600, color: '#1e293b', text: '#34d399' },
  { id: 'w_vip_120', label: '+120 VIP', type: 'vip', amount: 120, color: '#3b2607', text: '#fde68a' },
  { id: 'w_gems_40', label: '+40 💎', type: 'gems', amount: 40, color: '#0c4a6e', text: '#7dd3fc' },
  { id: 'w_boost', label: '⚡ x2 40s', type: 'boost', amount: 40, color: '#14532d', text: '#86efac' },
  { id: 'w_cash_lg', label: '+$6,000', type: 'cash', amount: 6000, color: '#1e293b', text: '#fbbf24' },
  { id: 'w_gems_85', label: '+85 💎', type: 'gems', amount: 85, color: '#312e81', text: '#c4b5fd' }
];

export const TIMED_EVENTS = [
  { id: 'ev_timber_boom', name: 'Hội Chợ Gỗ Bắc Âu', desc: 'Tăng +45% doanh thu toàn bộ Ván & Pallet', multTarget: 'sawmill', multBonus: 0.45, duration: 120, color: '#f59e0b' },
  { id: 'ev_export_surge', name: 'Giờ Vàng Xuất Cảng', desc: 'Tăng +55% thưởng Hợp đồng Cảng biển', multTarget: 'contracts', multBonus: 0.55, duration: 110, color: '#10b981' },
  { id: 'ev_ocean_harvest', name: 'Mùa Thu Hoạch Biển', desc: 'Tăng +65% giá trị Cá Hộp xuất khẩu', multTarget: 'fishery', multBonus: 0.65, duration: 110, color: '#0ea5e9' }
];

export const activeEventState = {
  current: TIMED_EVENTS[0],
  timeLeft: 120,
  cooldown: 0,
  index: 0
};

export const YACHT_TIERS = [
  { tier: 1, name: 'Du Thuyền Mũi Nhọn 38ft', costCash: 4500, cashPer10s: 120, gemChance: 0.25, speed: 18, desc: 'Cập bến du thuyền tự lái ra khơi, thu phí du lịch vịnh & săn kho báu biển.' },
  { tier: 2, name: 'Du Thuyền Đô Đốc Hoàng Gia', costCash: 16000, cashPer10s: 340, gemChance: 0.45, speed: 24, desc: 'Mở rộng boong tiệc VIP, tăng tốc độ rẽ sóng & thưởng giao hàng hải +35%.' },
  { tier: 3, name: 'Siêu Du Thuyền Đế Chế', costCash: 52000, cashPer10s: 920, gemChance: 0.75, speed: 31, desc: 'Du thuyền hạng siêu sang tối thượng, tốc độ vượt trội & cơ hội rơi 💎 liên tục.' }
];

export const AIRPORT_TIERS = [
  { tier: 1, name: 'Đường Băng Duyên Hải', costCash: 2800, airMult: 1.0, maxSpeedBonus: 0, desc: 'Xây đường băng phía Đông & mở khóa quyền cất cánh Máy bay vận tải.' },
  { tier: 2, name: 'Sân Bay Đèn Dẫn & Không Lưu', costCash: 11000, airMult: 1.35, maxSpeedBonus: 0.2, desc: 'Nâng cấp tháp không lưu & hangar, +35% thưởng bay & +20% tốc độ bay.' },
  { tier: 3, name: 'Trung Tâm Hàng Không Đế Chế', costCash: 38000, airMult: 1.85, maxSpeedBonus: 0.35, desc: 'Cảng hàng không quốc tế hoàn chỉnh, +85% thưởng giao hàng trên không.' }
];

export const ISLAND_STATION_TIERS = [
  { tier: 1, name: 'Trạm Tiếp Liệu Đảo Tiền Đồn', costCash: 2400, tradeMult: 1.0, desc: 'Xây cầu tàu & kho tiếp liệu trên Đảo Ngoài Khơi để giao đơn Biển & Không.' },
  { tier: 2, name: 'Kho Ngoại Quan Hải Đảo', costCash: 9500, tradeMult: 1.45, desc: 'Mở rộng bồn nhiên liệu & nhà kho đảo, +45% thưởng tuyến Đảo Tiền Đồn.' },
  { tier: 3, name: 'Đặc Khu Giao Thương Ngoài Khơi', costCash: 32000, tradeMult: 2.0, desc: 'Đặc khu thương mại biển đảo cấp tối đa, x2.0 toàn bộ đơn giao ra đảo.' }
];

export const PLANES = [
  { id: 'bush_plane', name: 'Thủy Phi Cơ Khai Phá', costType: 'cash', cost: 3200, speed: 26, climbRate: 11, cargoBonus: 1.2, desc: 'Máy bay cánh quạt linh hoạt, dễ cất cánh từ đường băng ngắn.' },
  { id: 'cargo_twin', name: 'Vận Tải Cánh Quạt Đôi', costType: 'cash', cost: 12500, speed: 35, climbRate: 14, cargoBonus: 1.55, desc: 'Thân rộng 2 động cơ cánh quạt, chuyên chở đơn hàng không tải trọng lớn.' },
  { id: 'imperial_jet', name: 'Chuyên Cơ Phản Lực Hoàng Kim', costType: 'gems', cost: 125, speed: 48, climbRate: 19, cargoBonus: 2.15, desc: 'Chuyên cơ phản lực thương mại cao cấp, tốc độ siêu thanh & +115% thưởng.' }
];

export const fleetMissionState = {
  sea: null,
  air: null,
  seaCooldown: 2,
  airCooldown: 2
};

// Phase 5: Corporate HQ, Island Resort, Paint Liveries, Engine Tiers, Stock Exchange & Storm Challenge
export const HQ_TIERS = [
  { tier: 1, name: 'Tòa Nhà Điều Hành Tập Đoàn', costCash: 5500, revBonus: 0.18, dividend45s: 180, desc: 'Trụ sở trung tâm tại Quảng trường Đông, +18% doanh thu & chia cổ tức định kỳ.' },
  { tier: 2, name: 'Tháp Tài Chính TimberPort', costCash: 19500, revBonus: 0.38, dividend45s: 520, desc: 'Tháp kính tài chính mở rộng, +38% toàn bộ doanh thu & tăng cổ tức sàn cổ phiếu.' },
  { tier: 3, name: 'Trung Tâm Chỉ Huy Đế Chế', costCash: 64000, revBonus: 0.68, dividend45s: 1450, desc: 'Tổng hành dinh tối thượng với bãi đáp trực thăng, +68% doanh thu toàn đế chế.' }
];

export const ISLAND_RESORT_TIERS = [
  { tier: 1, name: 'Biệt Thự Biển Du Thuyền', costCash: 6200, cashPer10s: 165, gemChance: 0.25, desc: 'Phát triển khu villa bãi cát trên Đảo Tiền Đồn, sinh tiền thụ động & hút khách du thuyền.' },
  { tier: 2, name: 'Khu Nghỉ Dưỡng Hồ Bơi Vô Cực', costCash: 21000, cashPer10s: 450, gemChance: 0.45, desc: 'Hồ bơi vô cực hướng biển & nhà hàng hải sản, x2.7 lợi tức nghỉ dưỡng.' },
  { tier: 3, name: 'Quần Thể Resort Hoàng Gia VIP', costCash: 58000, cashPer10s: 1180, gemChance: 0.72, desc: 'Khu nghỉ dưỡng 5 sao tối thượng trên đảo riêng, sinh Cash & Đá quý liên tục.' }
];

export const FLEET_LIVERIES = [
  { id: 'pearl_sky', name: 'Trắng Ngọc Trai', tierLabel: 'Tiêu chuẩn', costType: 'free', cost: 0, hull: 0xf8fafc, trim: 0x0ea5e9, cabin: 0xf8fafc, desc: 'Sơn trắng hải quân nguyên bản kết hợp đường viền xanh dương.' },
  { id: 'sapphire_ocean', name: 'Xanh Hải Vương', tierLabel: 'Tiêu chuẩn', costType: 'cash', cost: 3400, hull: 0x0369a1, trim: 0x38bdf8, cabin: 0xe0f2fe, desc: 'Lớp sơn xanh biển sâu bóng bẩy chống muối biển.' },
  { id: 'emerald_jade', name: 'Lục Bảo Đảo Ngọc', tierLabel: 'Điều hành', costType: 'cash', cost: 8800, hull: 0x047857, trim: 0x34d399, cabin: 0xecfdf5, desc: 'Phiên bản thương gia ngọc lục bảo đặc trưng Quần Đảo Ngọc.' },
  { id: 'crimson_viper', name: 'Đỏ Đô Đốc Thể Thao', tierLabel: 'Điều hành', costType: 'gems', cost: 55, hull: 0xb91c1c, trim: 0xfef08a, cabin: 0xf8fafc, desc: 'Sơn đỏ rực thể thao nổi bật cả trên vịnh và bầu trời.' },
  { id: 'obsidian_gold', name: 'Hắc Kim Đế Chế', tierLabel: 'Hoàng gia', costType: 'gems', cost: 115, hull: 0x0f172a, trim: 0xf59e0b, cabin: 0x1e293b, desc: 'Đen nhám Obsidian viền vàng 24K dành riêng cho Chủ tịch Tập đoàn.' }
];

export const ENGINE_MAX_TIER = 5;

// Phase 6: Luxury Furniture Mill, Coastal Lighthouse, Global Franchises, Bank, Real Estate, Trade Expo & Alliance
export const FURNITURE_MILL_TIERS = [
  { tier: 1, name: 'Xưởng Mộc Mỹ Nghệ', costCash: 3600, cycleSec: 6.5, reqPlanks: 4, reqPallets: 0, output: 1, desc: 'Chế biến 4 Ván gỗ thành 1 Bộ Nội thất Xuất khẩu biên lợi nhuận cao.' },
  { tier: 2, name: 'Nhà Máy Nội Thất Cao Cấp', costCash: 12800, cycleSec: 4.5, reqPlanks: 6, reqPallets: 1, output: 2, desc: 'Dây chuyền CNC tinh chế Ván & Pallet thành 2 Bộ Nội thất mỗi chu kỳ.' },
  { tier: 3, name: 'Tổ Hợp Xuất Khẩu Hoàng Gia', costCash: 42000, cycleSec: 3.2, reqPlanks: 8, reqPallets: 1, output: 3, desc: 'Nhà máy nội thất tự động tối thượng, sản xuất 3 Bộ Nội thất cao cấp mỗi nhịp.' }
];

export const LIGHTHOUSE_TIERS = [
  { tier: 1, name: 'Hải Đăng Mũi Tây', costCash: 2900, contractBonus: 0.14, desc: 'Định hướng tàu hàng vào vịnh an toàn, tăng +14% thưởng Hợp đồng & Xuất khẩu.' },
  { tier: 2, name: 'Tháp Đèn Xoay Hàng Hải', costCash: 10500, contractBonus: 0.28, desc: 'Nâng tầm chiếu sáng toàn vùng biển, tăng +28% thưởng Hợp đồng & Xuất khẩu.' },
  { tier: 3, name: 'Hải Đăng Hoàng Gia Đế Chế', costCash: 34000, contractBonus: 0.48, desc: 'Ngọn hải đăng tối thượng tăng +48% toàn bộ giá trị Hợp đồng & Đấu giá.' }
];

export const GLOBAL_FRANCHISES = [
  { id: 'tokyo', city: 'Tokyo', region: 'Đông Á', mapX: 0.84, mapY: 0.40, costCash: 4200, reqContracts: 1, royaltyPer10s: 135, exportBonusPct: 8, desc: 'Đại lý phân phối gỗ xẻ & nội thất cao cấp khu vực Vịnh Tokyo.' },
  { id: 'singapore', city: 'Singapore', region: 'Đông Nam Á', mapX: 0.74, mapY: 0.62, costCash: 9600, reqContracts: 2, royaltyPer10s: 260, exportBonusPct: 12, desc: 'Trung tâm trung chuyển hàng hải kết nối tuyến Pallet & Cá hộp.' },
  { id: 'dubai', city: 'Dubai', region: 'Trung Đông', mapX: 0.60, mapY: 0.48, costCash: 19500, reqContracts: 4, royaltyPer10s: 480, exportBonusPct: 16, desc: 'Showroom nội thất siêu sang phục vụ các tổ hợp khách sạn Vịnh Ả Rập.' },
  { id: 'rotterdam', city: 'Rotterdam', region: 'Châu Âu', mapX: 0.46, mapY: 0.28, costCash: 36000, reqContracts: 6, royaltyPer10s: 840, exportBonusPct: 22, desc: 'Cảng nhập khẩu gỗ công nghiệp lớn nhất Bắc Âu với hợp đồng dài hạn.' },
  { id: 'vancouver', city: 'Vancouver', region: 'Bắc Mỹ', mapX: 0.17, mapY: 0.30, costCash: 68000, reqContracts: 9, royaltyPer10s: 1550, exportBonusPct: 30, desc: 'Tổng đại lý Thái Bình Dương hoàn thiện mạng lưới nhượng quyền 5 châu.' }
];

export const BANK_LOAN_PACKAGES = [
  { id: 'loan_sme', name: 'Gói Tín Dụng Mở Rộng', principal: 4500, interestPct: 12, minNetWorth: 0, autoDeductRate: 0.15, desc: 'Giải ngân nhanh $4,500 mở xưởng & tàu; tự trích 15% doanh thu trả dần.' },
  { id: 'loan_corp', name: 'Vốn Lưu Động Tập Đoàn', principal: 18000, interestPct: 15, minNetWorth: 12000, autoDeductRate: 0.15, desc: 'Hạn mức $18,000 xây Nhà máy Nội thất & Trụ sở; trả góp an toàn 15%.' },
  { id: 'loan_global', name: 'Trái Phiếu Thương Mại Toàn Cầu', principal: 60000, interestPct: 18, minNetWorth: 45000, autoDeductRate: 0.15, desc: 'Nguồn vốn $60,000 thâu tóm Nhượng quyền Quốc tế & Bất động sản Cảng.' }
];

export const REAL_ESTATE_CATALOG = [
  { id: 're_coldstorage', name: 'Kho Lạnh Cảng Biển', icon: '❄️', baseCost: 3400, scale: 1.95, cashPer10s: 110, netValue: 5200, desc: 'Cho thuê kho bảo quản thủy sản xuất khẩu tại bến cảng.' },
  { id: 're_office', name: 'Tháp Văn Phòng Thương Mại', icon: '🏙️', baseCost: 9200, scale: 2.0, cashPer10s: 285, netValue: 13500, desc: 'Cho các hãng logistics quốc tế thuê trụ sở điều hành.' },
  { id: 're_auction_hall', name: 'Sàn Đấu Giá Hàng Hải', icon: '🏛️', baseCost: 22000, scale: 2.1, cashPer10s: 660, netValue: 32000, desc: 'Thu phí giao dịch & hoa hồng mỗi phiên đấu giá container.' },
  { id: 're_bay_complex', name: 'Tổ Hợp Thương Mại Vịnh', icon: '🌆', baseCost: 54000, scale: 2.2, cashPer10s: 1520, netValue: 78000, desc: 'Trung tâm hội nghị, khách sạn & bến du thuyền quốc tế.' }
];

export const TRADE_EXPOS = [
  { id: 'expo_furniture', name: 'Triển Lãm Nội Thất Milan', target: 'furniture', bonusPct: 55, duration: 95, desc: 'Tăng +55% giá trị Nội Thất Xuất Khẩu trên sàn & hợp đồng.' },
  { id: 'expo_maritime', name: 'Hội Chợ Hàng Hải Singapore', target: 'contracts', bonusPct: 45, duration: 95, desc: 'Tăng +45% thưởng Hợp đồng Cảng & Hợp đồng Liên minh.' },
  { id: 'expo_timber', name: 'Triển Lãm Gỗ Xanh Bắc Âu', target: 'sawmill', bonusPct: 40, duration: 95, desc: 'Tăng +40% doanh thu Ván Gỗ Xẻ & Kiện Pallet.' }
];

export const expoState = {
  current: TRADE_EXPOS[0],
  timeLeft: 95,
  cooldown: 0,
  index: 0
};

export const STOCK_TICKERS = [
  { symbol: 'TMBR', name: 'Tập Đoàn Gỗ Timber', sector: 'Lâm nghiệp & Xưởng', basePrice: 85, color: '#f59e0b' },
  { symbol: 'PORT', name: 'Thương Cảng Xuất Khẩu', sector: 'Logistics & Cảng', basePrice: 140, color: '#10b981' },
  { symbol: 'AERO', name: 'Hàng Không & Du Thuyền', sector: 'Hạm đội Biển - Không', basePrice: 210, color: '#38bdf8' },
  { symbol: 'RESO', name: 'Nghỉ Dưỡng Hải Đảo', sector: 'Du lịch Resort VIP', basePrice: 175, color: '#a855f7' }
];

export const stockMarketState = {
  lastUpdateMs: Date.now(),
  items: {
    TMBR: { price: 88, prevPrice: 85, history: [80, 82, 84, 83, 86, 85, 87, 86, 85, 88] },
    PORT: { price: 146, prevPrice: 141, history: [134, 136, 138, 137, 140, 142, 139, 143, 141, 146] },
    AERO: { price: 214, prevPrice: 210, history: [198, 202, 205, 201, 208, 212, 209, 211, 210, 214] },
    RESO: { price: 178, prevPrice: 175, history: [168, 170, 172, 169, 174, 176, 173, 175, 175, 178] }
  }
};

export const stormState = {
  active: false,
  kind: 'sea', // 'sea' | 'air'
  timeLeft: 0,
  cooldown: 26,
  targetX: -28,
  targetY: 0.4,
  targetZ: 74,
  targetLabel: 'Vùng Bão Vịnh Tây',
  rewardCash: 0,
  rewardGems: 0
};

export const revenueHistory = [];

export const shiftSession = {
  startedAt: Date.now(),
  cashEarned: 0,
  logsCut: 0,
  contractsDone: 0,
  stormRescues: 0,
  peakCpm: 0
};

export const LOGISTICS_TIERS = [
  { tier: 1, name: 'Drone Gom Phôi Gỗ', costCash: 1600, desc: 'Tự động thu 1 khúc gỗ trực tiếp vào Phễu Xưởng mỗi 4.5 giây.' },
  { tier: 2, name: 'Băng Tải Thông Minh', costCash: 4800, desc: 'Tăng tốc gom gỗ mỗi 3.0s & tự động đóng đai Pallet khi đủ phôi.' },
  { tier: 3, name: 'Điều Phối Xuất Cảng Tự Động', costCash: 13500, desc: 'Tự động giao hàng tồn vào Hợp đồng Cảng đang mở mà không cần chạy tay.' },
  { tier: 4, name: 'Mạng Lưới Hậu Cần Toàn Chuỗi', costCash: 34000, desc: 'Gom gỗ nhanh gấp đôi & tự động bán hàng dư vượt hợp đồng tại Cảng.' },
  { tier: 5, name: 'Trung Tâm Logistics Siêu Tự Động', costCash: 85000, desc: 'Chuỗi cung ứng khép kín 100% với tốc độ tối đa cả Rừng - Xưởng - Cảng.' }
];

export const LIMITED_COMBOS = [
  {
    id: 'combo_sawmill_pro',
    title: 'Combo Tăng Tốc Xưởng Gỗ',
    subtitle: 'Ưu đãi giờ vàng · Tiết kiệm 35%',
    badge: 'Ưu đãi 35%',
    costType: 'gems',
    cost: 45,
    rewardCash: 3800,
    rewardGems: 20,
    rewardVipXp: 150,
    boostSec: 60,
    desc: 'Nhận ngay +$3,800 Cash, +20 💎, +150 VIP XP & 60s Rìu Vàng x2.'
  },
  {
    id: 'combo_harbor_admiral',
    title: 'Gói Đô Đốc Thương Cảng',
    subtitle: 'Phiên giới hạn · Giá trị cao',
    badge: 'Bán chạy',
    costType: 'cash',
    cost: 6500,
    rewardCash: 0,
    rewardGems: 95,
    rewardVipXp: 240,
    boostSec: 90,
    desc: 'Quy đổi $6,500 Cash lấy +95 💎, +240 VIP XP & 90s Tăng Tốc.'
  },
  {
    id: 'combo_imperial_vault',
    title: 'Rương Tài Phiệt Hoàng Kim',
    subtitle: 'Siêu gói thương mại giới hạn',
    badge: 'Tiết kiệm 45%',
    costType: 'gems',
    cost: 85,
    rewardCash: 14500,
    rewardGems: 40,
    rewardVipXp: 420,
    boostSec: 120,
    desc: 'Cộng thẳng +$14,500 Cash, +40 💎, +420 VIP XP & 120s Rìu Vàng x2.'
  }
];

export const comboState = {
  index: 0,
  timeLeft: 1800,
  purchasedId: null
};

export const AUCTION_TEMPLATES = [
  { id: 'auc_planks', kind: 'sell', title: 'Đấu Giá Lô Ván Sấy Bắc Âu', itemKey: 'planks', itemLabel: 'Ván gỗ', qty: 14, baseMult: 1.55, rewardGems: 12, rewardVipXp: 40 },
  { id: 'auc_pallets', kind: 'sell', title: 'Phiên Đấu Giá Kiện Pallet Xuất Cảng', itemKey: 'pallets', itemLabel: 'Pallet', qty: 4, baseMult: 1.75, rewardGems: 18, rewardVipXp: 55 },
  { id: 'auc_canned', kind: 'sell', title: 'Đấu Giá Lô Cá Hộp Thượng Hạng', itemKey: 'cannedFish', itemLabel: 'Cá hộp', qty: 5, baseMult: 1.85, rewardGems: 22, rewardVipXp: 65 },
  { id: 'auc_crate', kind: 'buy_gems', title: 'Kiện Đá Quý & VIP Vô Chủ Tại Cảng', bidCost: 2200, rewardGems: 42, rewardVipXp: 110 }
];

export const auctionState = {
  current: null,
  index: 0,
  timeLeft: 75,
  cooldown: 0,
  rivalBids: 0
};

export const BADGE_CODEX = [
  { id: 'bdg_first_branch', name: 'Nhà Khai Phá Vịnh', icon: '🗺️', bonusPct: 4, conditionText: 'Mở từ 2 Chi nhánh cảng trở lên', check: () => (gameState.unlockedBranches?.length || 1) >= 2 },
  { id: 'bdg_yacht_owner', name: 'Chủ Bến Du Thuyền', icon: '🛥️', bonusPct: 5, conditionText: 'Mở khóa Bến Du Thuyền VIP', check: () => (gameState.yachtTier || 0) >= 1 },
  { id: 'bdg_logistics_pro', name: 'Kiến Trúc Sư Logistics', icon: '🤖', bonusPct: 6, conditionText: 'Đạt Mạng lưới Logistics cấp 3', check: () => (gameState.logisticsTier || 0) >= 3 },
  { id: 'bdg_auction_shark', name: 'Bậc Thầy Đấu Giá', icon: '🔨', bonusPct: 5, conditionText: 'Thắng 2 phiên Đấu giá Lô hàng', check: () => (gameState.totalAuctionsWon || 0) >= 2 },
  { id: 'bdg_vip_gold', name: 'Quý Tộc Thương Cảng', icon: '👑', bonusPct: 8, conditionText: 'Đạt cấp VIP 3 trở lên', check: () => (gameState.vipLevel || 0) >= 3 },
  { id: 'bdg_prestige_star', name: 'Huyền Thoại Chuyển Sinh', icon: '🏅', bonusPct: 10, conditionText: 'Thực hiện Chuyển Sinh ít nhất 1 lần', check: () => (gameState.prestigeLevel || 0) >= 1 }
];

export const MILESTONE_QUESTS = [
  { id: 'ms_1', title: 'Cột Mốc I: Xưởng Gỗ Khởi Sắc', desc: 'Xẻ tổng cộng 40 thanh ván gỗ', statKey: 'totalPlanksSawn', target: 40, rewardCash: 1200, rewardGems: 20, rewardVipXp: 50 },
  { id: 'ms_2', title: 'Cột Mốc II: Đóng Tàu Vươn Khơi', desc: 'Hoàn thành 2 Hợp đồng Xuất khẩu', statKey: 'contractsCompleted', target: 2, rewardCash: 3200, rewardGems: 35, rewardVipXp: 80 },
  { id: 'ms_3', title: 'Cột Mốc III: Bến Cảng Tấp Nập', desc: 'Xuất khẩu tổng cộng 65 đơn vị hàng', statKey: 'totalExported', target: 65, rewardCash: 6800, rewardGems: 55, rewardVipXp: 120 },
  { id: 'ms_4', title: 'Cột Mốc IV: Đế Chế Triệu Đô', desc: 'Đốn tổng cộng 220 khúc gỗ toàn hệ thống', statKey: 'totalLogsCut', target: 220, rewardCash: 15000, rewardGems: 90, rewardVipXp: 200 },
  { id: 'ms_5', title: 'Cột Mốc V: Bá Chủ Hải Cảng', desc: 'Hoàn thành 8 Hợp đồng Xuất khẩu', statKey: 'contractsCompleted', target: 8, rewardCash: 38000, rewardGems: 160, rewardVipXp: 350 }
];

// Phase 7: Deep-Water Container Port, Commodity Futures, Maritime Insurance, Green Energy & R&D Patents
export const DEEP_PORT_TIERS = [
  { tier: 1, name: 'Bến Container Nước Sâu', costCash: 8200, royalty10s: 210, voyageMult: 1.0, desc: 'Mở cầu cảng nước sâu & Cần cẩu Gantry hạng nặng đón tàu container siêu trọng.' },
  { tier: 2, name: 'Siêu Cảng Cẩu Gantry Kép', costCash: 26500, royalty10s: 560, voyageMult: 1.45, desc: 'Nâng cấp cẩu giàn đôi & bãi container 2 tầng, +45% thưởng chuyến tàu đại dương.' },
  { tier: 3, name: 'Trung Tâm Trung Chuyển Toàn Cầu', costCash: 74000, royalty10s: 1420, voyageMult: 2.05, desc: 'Siêu cảng trung chuyển container tối thượng, x2.05 lợi nhuận tuyến viễn dương.' }
];

export const CONTAINER_ROUTES = [
  { id: 'rt_east_asia', name: 'Tuyến Đông Á Express', reqPlanks: 16, reqPallets: 2, reqCanned: 2, reqFurniture: 0, durationSec: 32, rewardCash: 2600, rewardGems: 18, rewardVipXp: 45, desc: 'Chuyến tàu nhanh giao gỗ sấy, pallet & cá hộp tới Thượng Hải – Busan.' },
  { id: 'rt_eu_rotterdam', name: 'Siêu Tuyến Bắc Âu Rotterdam', reqPlanks: 24, reqPallets: 4, reqCanned: 4, reqFurniture: 1, durationSec: 48, rewardCash: 5800, rewardGems: 34, rewardVipXp: 85, desc: 'Vận tải container hỗn hợp gồm Nội thất cao cấp qua Kênh Suez.' },
  { id: 'rt_trans_pacific', name: 'Tuyến Xuyên Thái Bình Dương', reqPlanks: 32, reqPallets: 6, reqCanned: 6, reqFurniture: 3, durationSec: 65, rewardCash: 12400, rewardGems: 62, rewardVipXp: 140, desc: 'Siêu chuyến hàng đại dương tải trọng cực đại tới Bờ Tây Bắc Mỹ.' }
];

export const INSURANCE_TIERS = [
  { tier: 1, name: 'Bảo Hiểm Hàng Hải Cơ Bản', costCash: 3800, protectionPct: 35, discountFeePct: 12, desc: 'Bồi hoàn 35% giá trị khi hết giờ bão/rủi ro & giảm 12% chi phí nâng cấp cảng.' },
  { tier: 2, name: 'Bảo Hiểm Đội Tàu Toàn Diện', costCash: 14500, protectionPct: 65, discountFeePct: 24, desc: 'Bồi hoàn 65% tổn thất thời tiết biển & tăng biên an toàn hợp đồng tương lai.' },
  { tier: 3, name: 'Quỹ Bảo Chứng Rủi Ro Đế Chế', costCash: 42000, protectionPct: 90, discountFeePct: 40, desc: 'Bảo chứng tối đa 90% trước bão biển & giảm mạnh phí duy trì đòn bẩy ngân hàng.' }
];

export const FUTURES_TEMPLATES = [
  { id: 'fut_planks', name: 'HĐ Tương Lai Ván Sấy 30s', itemKey: 'planks', itemLabel: 'Ván gỗ', qty: 18, durationSec: 30, lockedMult: 1.48, basePrice: 24, rewardGems: 12 },
  { id: 'fut_pallets', name: 'HĐ Tương Lai Kiện Pallet 42s', itemKey: 'pallets', itemLabel: 'Pallet', qty: 6, durationSec: 42, lockedMult: 1.62, basePrice: 115, rewardGems: 18 },
  { id: 'fut_fish', name: 'HĐ Tương Lai Thủy Sản 45s', itemKey: 'cannedFish', itemLabel: 'Cá hộp', qty: 8, durationSec: 45, lockedMult: 1.68, basePrice: 75, rewardGems: 22 },
  { id: 'fut_furn', name: 'HĐ Tương Lai Nội Thất 55s', itemKey: 'furniture', itemLabel: 'Nội thất', qty: 4, durationSec: 55, lockedMult: 1.85, basePrice: 320, rewardGems: 35 }
];

export const GREEN_ENERGY_TIERS = [
  { tier: 1, name: 'Pin Mặt Trời Mái Cảng', costCash: 4800, creditsPer10s: 2.2, loanDiscountPct: 10, costReductionPct: 5, desc: 'Lắp pin năng lượng mặt trời sản sinh Tín chỉ Carbon & giảm 10% lãi vay ngân hàng.' },
  { tier: 2, name: 'Trang Trại Tuabin Gió Biển', costCash: 17500, creditsPer10s: 5.4, loanDiscountPct: 20, costReductionPct: 10, desc: 'Cung cấp điện sạch cho Cảng Nước Sâu, sinh +5.4 Tín chỉ/10s & giảm 10% chi phí nâng cấp.' },
  { tier: 3, name: 'Lưới Điện Xanh Tuần Hoàn', costCash: 52000, creditsPer10s: 12.5, loanDiscountPct: 35, costReductionPct: 16, desc: 'Đạt chuẩn ESG hạng A+, giảm 35% lãi suất vay & giảm 16% chi phí nâng cấp dây chuyền.' }
];

export const carbonMarketState = {
  price: 44,
  prevPrice: 42,
  lastUpdateMs: Date.now(),
  history: [36, 38, 37, 40, 41, 39, 43, 42, 44]
};

export const RD_TECH_CATALOG = [
  { id: 'pat_kiln', name: 'Bằng Sáng Chế Lò Sấy Siêu Tốc', category: 'Sản xuất', icon: '🔥', costType: 'cash', cost: 4200, bonusText: '+22% giá trị Gỗ & Nội thất', desc: 'Tối ưu độ ẩm gỗ sấy công nghiệp, tăng vĩnh viễn +22% doanh thu xưởng & nội thất.' },
  { id: 'pat_container', name: 'Công Nghệ Xếp Dỡ Container AI', category: 'Hàng hải', icon: '🚢', costType: 'cash', cost: 9800, bonusText: '+30% thưởng Tàu Container', desc: 'Thuật toán cân bằng trọng tải cẩu Gantry tăng +30% doanh thu tuyến container.' },
  { id: 'pat_eco_resin', name: 'Keo Sinh Học Tiết Kiệm Vật Liệu', category: 'Tài chính', icon: '🧪', costType: 'cash', cost: 14500, bonusText: '-15% chi phí nâng cấp xưởng', desc: 'Giảm 15% chi phí nâng cấp toàn bộ Trang bị, Máy cưa & Nhân sự tự động.' },
  { id: 'pat_cold_cryo', name: 'Chuỗi Lạnh Cryo Xuất Khẩu', category: 'Thủy sản', icon: '❄️', costType: 'gems', cost: 55, bonusText: '+25% giá trị Thủy sản & Ngoại tuyến', desc: 'Bảo quản cá hồi chuẩn xuất khẩu Bắc Âu và tăng thu nhập ngoại tuyến +25%.' },
  { id: 'pat_fin_hedge', name: 'Thuật Toán Phòng Hộ Phái Sinh', category: 'Thị trường', icon: '📈', costType: 'gems', cost: 75, bonusText: '+18% giá chốt Hợp đồng & Tương lai', desc: 'Khuếch đại vĩnh viễn +18% giá trị Hợp đồng cảng, Liên minh và Hợp đồng tương lai.' },
  { id: 'pat_green_grid', name: 'Bằng Sáng Chế Điện Xanh ESG', category: 'Năng lượng', icon: '🌿', costType: 'gems', cost: 95, bonusText: '+35% Tín chỉ Carbon & +12% Danh tiếng', desc: 'Tăng +35% tốc độ sinh Tín chỉ Carbon và nâng điểm tín nhiệm thương hiệu Đế chế.' }
];

// ---------------------------------------------------------------------------
// Phase 8: Industrial Railway, VIP Executive Helicopter, 24h Weather & Metropolis
// ---------------------------------------------------------------------------
export const RAILWAY_TIERS = [
  {
    tier: 1,
    name: 'Tuyến Đường Sắt Nội Khu',
    costCash: 6800,
    cashPer10s: 360,
    synergyBonus: 0.10,
    speedMult: 1.0,
    desc: 'Lắp đặt đường ray thép & Đầu máy Diesel kéo toa gỗ tự động giữa Xưởng Cưa và Cảng Biển (+10% thưởng xuất cảng).'
  },
  {
    tier: 2,
    name: 'Đoàn Tàu Logistics Liên Hợp',
    costCash: 22500,
    cashPer10s: 920,
    synergyBonus: 0.18,
    speedMult: 1.32,
    desc: 'Nối thêm toa phẳng chở Kiện Pallet & Nội thất, tăng tốc độ vận hành +32% và cộng +18% thưởng xuất cảng.'
  },
  {
    tier: 3,
    name: 'Siêu Tuyến Đường Sắt Cảng Nước Sâu',
    costCash: 64000,
    cashPer10s: 2350,
    synergyBonus: 0.25,
    speedMult: 1.65,
    desc: 'Kết nối trực tiếp Cần cẩu Gantry Cảng Nước Sâu (+25% thưởng Tàu Container & Hợp đồng cảng).'
  }
];

export const HELI_TIERS = [
  {
    tier: 1,
    name: 'Trực Thăng Tuabin Hạng Nhẹ',
    costCash: 7900,
    cashPer10s: 340,
    gemChance: 0.24,
    speed: 25,
    climbRate: 13,
    cargoBonus: 1.25,
    desc: 'Xây Bãi Đáp Trực Thăng VIP (Chữ H phát sáng) cạnh Quảng trường Trụ sở. Cho phép tự lái cất cánh thẳng đứng!'
  },
  {
    tier: 2,
    name: 'Chuyên Cơ Trực Thăng Điều Hành',
    costCash: 25000,
    cashPer10s: 860,
    gemChance: 0.36,
    speed: 31,
    climbRate: 16,
    cargoBonus: 1.5,
    desc: 'Động cơ Twin-Turbine siêu tốc bay tuần tra Trụ sở – Resort Đảo, sinh +$860/10s & cơ hội nhận Đá quý VIP.'
  },
  {
    tier: 3,
    name: 'Siêu Trực Thăng Hoàng Gia Twin-Rotor',
    costCash: 68000,
    cashPer10s: 2150,
    gemChance: 0.52,
    speed: 37,
    climbRate: 20,
    cargoBonus: 1.85,
    desc: 'Đỉnh cao hàng không VIP mạ vàng: cất cánh mọi thời tiết bão biển, thưởng x1.85 đơn hàng không & cứu hộ.'
  }
];

export const CIVIC_AMENITY_TIERS = [
  {
    tier: 1,
    name: 'Đại Lộ Đèn Vàng & Phố Đi Bộ Bến Cảng',
    costCash: 12000,
    taxPer10s: 360,
    gemChance: 0.22,
    extraCitizens: 6,
    happinessBonus: 8,
    revBonus: 0.03,
    desc: 'Lát vỉa hè ghế gỗ, cột đèn vàng và bồn cây cảnh: thu hút Thương gia, Thủy thủ & Kỹ sư cảng đi dạo, mở thu Thuế Du Lịch Đảo.'
  },
  {
    tier: 2,
    name: 'Quảng Trường Cà Phê Cảng & Trung Tâm Du Lịch VIP',
    costCash: 34000,
    taxPer10s: 920,
    gemChance: 0.36,
    extraCitizens: 10,
    happinessBonus: 16,
    revBonus: 0.06,
    desc: 'Khai trương Quầy Cà Phê Bến Cảng, dù che nắng & Kiosk Đón Khách: thu hút Đoàn khách tham quan & Du khách Resort hào phóng Tip lớn.'
  },
  {
    tier: 3,
    name: 'Đại Lộ Tài Chính Phố Wall & Cổng Chào Hoàng Gia',
    costCash: 78000,
    taxPer10s: 2150,
    gemChance: 0.52,
    extraCitizens: 15,
    happinessBonus: 25,
    revBonus: 0.1,
    desc: 'Dựng Cổng Chào Vàng & Tượng Đài Thương Cảng: đón Phái đoàn Nhà Đầu Tư Phố Wall, thưởng +10% Doanh thu toàn Đế Chế & Tip Kim Cương.'
  }
];

export const CITIZEN_ARCHETYPES = [
  {
    id: 'merchant',
    group: 'commerce',
    label: 'Thương gia Cảng biển',
    icon: '💼',
    suitColor: 0x1e3a8a,
    pantsColor: 0x0f172a,
    accentColor: 0xf59e0b,
    hatColor: 0x1e293b,
    hatStyle: 'fedora',
    prop: 'briefcase',
    speed: 2.35,
    tipMult: 1.35,
    quotes: [
      'Gỗ xẻ của Chủ tịch chất lượng số 1 vùng vịnh!',
      'Hợp đồng xuất khẩu hôm nay sinh lời vượt kỳ vọng!',
      'Tôi vừa chốt thêm 2 lô Pallet trên sàn cảng!'
    ]
  },
  {
    id: 'vip_tourist',
    group: 'commerce',
    label: 'Du khách VIP Quốc tế',
    icon: '📸',
    suitColor: 0xf43f5e,
    pantsColor: 0xf8fafc,
    accentColor: 0xfbbf24,
    hatColor: 0xfef08a,
    hatStyle: 'sunhat',
    prop: 'camera',
    speed: 2.15,
    tipMult: 1.45,
    quotes: [
      'Cảnh bến du thuyền và đảo hải đăng đẹp tuyệt vời!',
      'Cho tôi chụp một kiểu ảnh kỷ niệm với Chủ tịch nhé!',
      'Kỳ nghỉ 5 sao đáng nhớ nhất năm của gia đình tôi!'
    ]
  },
  {
    id: 'engineer',
    group: 'commerce',
    label: 'Kỹ sư Trưởng Cảng biển',
    icon: '📐',
    suitColor: 0x0284c7,
    pantsColor: 0x1e293b,
    accentColor: 0xf97316,
    hatColor: 0xfacc15,
    hatStyle: 'hardhat',
    prop: 'blueprint',
    speed: 2.55,
    tipMult: 1.2,
    quotes: [
      'Dây chuyền cưa và đường sắt vận hành đạt hiệu suất 100%!',
      'Bản vẽ mở rộng cầu cảng nước sâu đã sẵn sàng thưa Chủ tịch!',
      'Hệ thống cẩu STS và điện gió hoạt động cực kỳ êm ái!'
    ]
  },
  {
    id: 'sailor',
    group: 'maritime',
    label: 'Thủy thủ Viễn dương',
    icon: '⚓',
    suitColor: 0xf8fafc,
    pantsColor: 0x1e3a8a,
    accentColor: 0x0ea5e9,
    hatColor: 0xffffff,
    hatStyle: 'sailor',
    prop: 'none',
    speed: 2.45,
    tipMult: 1.15,
    quotes: [
      'Biển hôm nay êm sóng, tàu hàng cập cảng đúng giờ!',
      'Không cảng nào bốc dỡ nhanh như TimberPort của Chủ tịch!',
      'Anh em thủy thủ rất thích khu phố đi bộ bến cảng mới!'
    ]
  },
  {
    id: 'offduty_worker',
    group: 'maritime',
    label: 'Công nhân Nghỉ ca',
    icon: '☕',
    suitColor: 0xd97706,
    pantsColor: 0x1e293b,
    accentColor: 0x84cc16,
    hatColor: 0xf59e0b,
    hatStyle: 'cap',
    prop: 'coffee',
    speed: 2.3,
    tipMult: 1.1,
    quotes: [
      'Làm việc ở đế chế của Chủ tịch lương thưởng hậu hĩnh thật!',
      'Ly cà phê bến cảng sau ca xẻ gỗ làm tỉnh cả người!',
      'Chào Chủ tịch! Ca chiều nay anh em sẽ vượt chỉ tiêu!'
    ]
  },
  {
    id: 'resort_resident',
    group: 'maritime',
    label: 'Cư dân Đảo Resort',
    icon: '🌴',
    suitColor: 0x06b6d4,
    pantsColor: 0xfef3c7,
    accentColor: 0xf472b6,
    hatColor: 0xfde68a,
    hatStyle: 'sunhat',
    prop: 'camera',
    speed: 2.05,
    tipMult: 1.4,
    quotes: [
      'Sống trên đảo TimberPort không khí trong lành chuẩn ESG!',
      'Cầu vượt biển nối sang khu biệt thự đảo tiện lợi quá!',
      'Gửi Chủ tịch phí dịch vụ nghỉ dưỡng tháng này nhé!'
    ]
  },
  {
    id: 'wall_street',
    group: 'investors',
    label: 'Nhà Đầu Tư Phố Wall',
    icon: '📈',
    suitColor: 0x0f172a,
    pantsColor: 0x1e293b,
    accentColor: 0xfacc15,
    hatColor: 0xf59e0b,
    hatStyle: 'fedora',
    prop: 'briefcase',
    speed: 2.4,
    tipMult: 2.1,
    quotes: [
      'Cổ phiếu TMBR & PORT đang dẫn đầu bảng tăng trưởng Phố Wall!',
      'Quỹ đầu tư chúng tôi quyết định rót thêm vốn thưởng cho Chủ tịch!',
      'Hạng tín nhiệm AAA của TimberPort làm giới tài chính kinh ngạc!'
    ]
  },
  {
    id: 'tour_group',
    group: 'investors',
    label: 'Đoàn Khách Tham Quan Đế Chế',
    icon: '🔭',
    suitColor: 0x8b5cf6,
    pantsColor: 0x1e293b,
    accentColor: 0x38bdf8,
    hatColor: 0x38bdf8,
    hatStyle: 'cap',
    prop: 'camera',
    speed: 2.2,
    tipMult: 1.55,
    quotes: [
      'Đoàn tham quan rất ngưỡng mộ quy mô Xưởng Nội Thất & Sân Bay!',
      'Tàu hỏa chở gỗ chạy dọc bờ biển nhìn hoành tráng như phim!',
      'Cảm ơn Chủ tịch đã mở cửa đón đoàn khách thương mại quốc tế!'
    ]
  },
  {
    id: 'harbor_security',
    group: 'security',
    label: 'Đội Tuần Tra An Ninh Cảng',
    icon: '🛡️',
    suitColor: 0x0f172a,
    pantsColor: 0x090d16,
    accentColor: 0xeab308,
    hatColor: 0x1e293b,
    hatStyle: 'cap',
    prop: 'flashlight',
    speed: 2.65,
    tipMult: 1.25,
    quotes: [
      'Báo cáo Chủ tịch: Toàn bộ kho cảng và bến tàu an toàn tuyệt đối!',
      'Đội tuần tra đêm đã kiểm tra hệ thống đèn pha và hàng rào cảng!',
      'An ninh trật tự trên đảo đạt 100%, du khách hoàn toàn yên tâm!'
    ]
  },
  {
    id: 'airport_crew',
    group: 'security',
    label: 'Điều Phối Viên Sân Bay & Helipad',
    icon: '🎧',
    suitColor: 0x1e293b,
    pantsColor: 0x0f172a,
    accentColor: 0xa855f7,
    hatColor: 0xf97316,
    hatStyle: 'hardhat',
    prop: 'flashlight',
    speed: 2.6,
    tipMult: 1.3,
    quotes: [
      'Đường băng và Sân đáp Trực thăng H thông thoáng sẵn sàng cất cánh!',
      'Tín hiệu đèn dẫn đường hàng không đêm hoạt động hoàn hảo!',
      'Chuyên cơ VIP và đội bay vận tải đã nạp đầy nhiên liệu thưa Chủ tịch!'
    ]
  }
].map((a) => ({
  ...a,
  name: a.name || a.label,
  badgeHex: '#' + Number(a.accentColor || 0x38bdf8).toString(16).padStart(6, '0'),
  bubbles: a.bubbles || [a.icon, '✨', '👍']
}));

export const WEATHER_PRESETS = {
  auto: { id: 'auto', label: 'Tự động 24h', icon: '🕒', hour: null, fixedHour: null },
  dawn: { id: 'dawn', label: 'Bình Minh', icon: '🌅', hour: 6.25, fixedHour: 6.25 },
  sunny: { id: 'sunny', label: 'Nắng Vàng', icon: '☀️', hour: 11.5, fixedHour: 11.5 },
  sunset: { id: 'sunset', label: 'Hoàng Hôn', icon: '🌇', hour: 17.85, fixedHour: 17.85 },
  night: { id: 'night', label: 'Đêm Sao', icon: '🌙', hour: 22.5, fixedHour: 22.5 },
  storm: { id: 'storm', label: 'Mưa Bão', icon: '⛈️', hour: 15.2, fixedHour: 15.2 }
};

export const metropolisState = {
  landmarkLevel: 1,
  landmarkStage: 1,
  landmarkName: 'Tháp Hải Đăng Pha Lê Toàn Cầu',
  totalWoodContributed: 0,
  goalWood: 5000,
  totalMoneyContributed: 0,
  goalMoney: 1000000,
  topContributors: [],
  marketListings: [],
  lastAnnouncement: ''
};

export function syncMetropolisFromServer(raw) {
  if (!raw || typeof raw !== 'object') return metropolisState;
  if (raw.landmarkProject) {
    const lp = raw.landmarkProject;
    metropolisState.landmarkLevel = lp.stage || raw.cityLevel || 1;
    metropolisState.landmarkStage = lp.stage || 1;
    metropolisState.landmarkName = lp.title || metropolisState.landmarkName;
    metropolisState.totalWoodContributed = lp.currentPlanks ?? metropolisState.totalWoodContributed;
    metropolisState.goalWood = lp.neededPlanks || 5000;
    metropolisState.totalMoneyContributed = lp.currentMoney ?? metropolisState.totalMoneyContributed;
    metropolisState.goalMoney = lp.neededMoney || 1000000;
    if (lp.topContributors && typeof lp.topContributors === 'object' && !Array.isArray(lp.topContributors)) {
      metropolisState.topContributors = Object.entries(lp.topContributors)
        .map(([name, score]) => ({ name, score: Number(score) || 0 }))
        .sort((a, b) => b.score - a.score);
    }
  } else {
    if (raw.landmarkLevel !== undefined) metropolisState.landmarkLevel = raw.landmarkLevel;
    if (raw.landmarkName) metropolisState.landmarkName = raw.landmarkName;
    if (raw.totalWoodContributed !== undefined) metropolisState.totalWoodContributed = raw.totalWoodContributed;
    if (raw.goalWood !== undefined) metropolisState.goalWood = raw.goalWood;
    if (raw.totalMoneyContributed !== undefined) metropolisState.totalMoneyContributed = raw.totalMoneyContributed;
    if (raw.goalMoney !== undefined) metropolisState.goalMoney = raw.goalMoney;
    if (Array.isArray(raw.topContributors)) metropolisState.topContributors = raw.topContributors;
  }
  if (Array.isArray(raw.marketListings)) {
    const validRes = new Set(['planks', 'pallets', 'cannedFish', 'furniture']);
    metropolisState.marketListings = raw.marketListings
      .map((item) => {
        const resource = validRes.has(item.resource) ? item.resource : (validRes.has(item.item) ? item.item : 'planks');
        const amount = Math.max(1, Number(item.amount ?? item.quantity ?? 10));
        const price = Math.max(10, Number(item.price ?? ((item.priceEach || 25) * amount)));
        return {
          id: item.id || ('mkt_' + Math.random().toString(36).slice(2, 8)),
          seller: item.seller || item.sellerName || 'Thương gia Cảng',
          empireName: item.empireName || 'Liên Minh Cảng Biển',
          resource,
          amount,
          price,
          createdAt: item.createdAt || Date.now()
        };
      });
  }
  return metropolisState;
}

// Rolling 60s Cash Telemetry (Zero GC ring of timestamped entries)
const cashFlowSamples = [];

export function getCashPerMinute() {
  const now = Date.now();
  const cutoff = now - 60000;
  let total = 0;
  let i = 0;
  while (i < cashFlowSamples.length) {
    if (cashFlowSamples[i].t < cutoff) {
      cashFlowSamples.shift();
    } else {
      total += cashFlowSamples[i].amt;
      i++;
    }
  }
  const yachtDef = YACHT_TIERS.find((y) => y.tier === (gameState.yachtTier || 0));
  const yachtPerMin = yachtDef ? yachtDef.cashPer10s * 6 * getPrestigeMultiplier() : 0;
  const resortDef = ISLAND_RESORT_TIERS.find((r) => r.tier === (gameState.islandResortTier || 0));
  const resortPerMin = resortDef ? resortDef.cashPer10s * 6 * getPrestigeMultiplier() : 0;
  const hqDef = HQ_TIERS.find((h) => h.tier === (gameState.hqTier || 0));
  const hqDivPerMin = hqDef ? Math.round((hqDef.dividend45s * (60 / 45)) * getPrestigeMultiplier()) : 0;
  const deepDef = DEEP_PORT_TIERS.find((d) => d.tier === (gameState.deepPortTier || 0));
  const deepPerMin = deepDef ? deepDef.royalty10s * 6 * getPrestigeMultiplier() : 0;
  const railDef = RAILWAY_TIERS.find((r) => r.tier === (gameState.railwayTier || 0));
  const railPerMin = railDef ? railDef.cashPer10s * 6 * getPrestigeMultiplier() : 0;
  const heliDef = HELI_TIERS.find((h) => h.tier === (gameState.heliTier || 0));
  const heliPerMin = heliDef ? heliDef.cashPer10s * 6 * getPrestigeMultiplier() : 0;
  const civicPerMin = getCivicTaxPer10s() * 6;
  const greenDef = GREEN_ENERGY_TIERS.find((g) => g.tier === (gameState.greenEnergyTier || 0));
  const carbonPerMin = greenDef
    ? Math.round(greenDef.creditsPer10s * (hasPatent('pat_green_grid') ? 1.35 : 1) * 6 * (carbonMarketState.price || 44))
    : 0;
  const franchisePerMin = getFranchiseRoyaltyPer10s() * 6;
  const realEstatePerMin = getRealEstateIncomePer10s() * 6;
  const logisticsPerMin = (gameState.logisticsTier || 0) * 140 * getRevenueMultiplier();
  const autoFleetPerMin = ((gameState.autoSeaFleet || 0) * 320 + (gameState.autoAirFleet || 0) * 480) * getRevenueMultiplier();
  const passiveEstimate = Math.round(
    ((gameState.autoForklifts || 0) * 180 + Math.max(0, gameState.fishingBoats || 0) * 95)
    * getRevenueMultiplier()
    * (1 + getManagerBonus('contractBonus'))
    + yachtPerMin
    + resortPerMin
    + hqDivPerMin
    + deepPerMin
    + railPerMin
    + heliPerMin
    + civicPerMin
    + carbonPerMin
    + franchisePerMin
    + realEstatePerMin
    + logisticsPerMin
    + autoFleetPerMin
  );
  const cpm = Math.max(total, passiveEstimate);
  if (cpm > shiftSession.peakCpm) shiftSession.peakCpm = cpm;
  if (gameState.personalBests && cpm > (gameState.personalBests.bestCpm || 0)) {
    gameState.personalBests.bestCpm = cpm;
  }
  return cpm;
}

export function createDefaultState() {
  return {
    playerId: 'player_' + Math.random().toString(36).slice(2, 8),
    username: 'Chủ tịch',
    empireName: 'TimberPort Empire',
    level: 1,
    xp: 0,
    cash: 160,
    gems: 40,
    vipXp: 0,
    vipLevel: 0,

    // Supply chain inventory
    logs: 0,
    sawmillBuffer: 0,
    planks: 0,
    pallets: 0,
    freshFish: 0,
    cannedFish: 0,

    // Upgrades
    axeTier: 1,
    backpackTier: 1,
    bootsTier: 1,
    sawSpeedTier: 1,
    conveyorTier: 0,
    plankValueTier: 1,
    lumberjacks: 0,
    autoForklifts: 0,
    fishingBoats: 0,

    // Branches & Contracts
    activeBranchId: 'pine_bay',
    unlockedBranches: ['pine_bay'],
    contractsCompleted: 0,
    activeContract: {
      id: 'ct_init_1',
      title: 'Chuyến Tàu Gỗ Đầu Tiên',
      reqPallets: 2,
      reqCanned: 0,
      reqPlanks: 8,
      deliveredPallets: 0,
      deliveredCanned: 0,
      deliveredPlanks: 0,
      rewardCash: 1200,
      rewardGems: 20,
      rewardSeasonXp: 90,
      timeLeft: 240
    },

    // Season Pass, Daily Quests & 7-Day Streak
    seasonXp: 0,
    seasonPremium: false,
    claimedFreeTiers: [],
    claimedPremiumTiers: [],
    dailyQuests: [
      { id: 'dq_chop', title: 'Đốn 18 khúc gỗ thông/đỏ', key: 'logsCut', progress: 0, target: 18, rewardCash: 650, rewardGems: 10, rewardXp: 60, claimed: false },
      { id: 'dq_saw', title: 'Xẻ 20 thanh ván tại xưởng', key: 'planksSawn', progress: 0, target: 20, rewardCash: 900, rewardGems: 12, rewardXp: 70, claimed: false },
      { id: 'dq_export', title: 'Xuất khẩu 15 hàng tại cảng', key: 'goodsExported', progress: 0, target: 15, rewardCash: 1600, rewardGems: 18, rewardXp: 100, claimed: false }
    ],
    loginStreakDay: 0,
    lastCheckInDate: '',

    // Achievements & Revenue Analytics
    claimedAchievements: [],
    revenueStats: {
      sawmill: 0,
      contracts: 0,
      fishery: 0,
      market: 0,
      offline: 0,
      stocks: 0,
      resort: 0
    },

    // Managers (1★-5★), Prestige, Lucky Wheel & VIP Rush Order
    managers: {
      mgr_forest: 0,
      mgr_sawmill: 0,
      mgr_harbor: 0,
      mgr_coldchain: 0
    },
    prestigeLevel: 0,
    prestigeMedals: 0,
    lastFreeSpinDate: '',
    vipRushOrder: null,
    vipRushCooldown: 12,

    // Phase 3 & 4: Logistics, Yacht, Airport, Island Outpost & Aviation Fleet
    logisticsTier: 0,
    autoLogisticsEnabled: true,
    yachtTier: 0,
    yachtAccumCash: 0,
    yachtAccumGems: 0,
    airportTier: 0,
    islandStationTier: 0,
    equippedPlane: 'bush_plane',
    unlockedPlanes: [],
    autoSeaFleet: 0,
    autoAirFleet: 0,
    treasuresCollected: 0,
    seaDeliveries: 0,
    airDeliveries: 0,
    unlockedBadges: [],
    milestoneIndex: 0,
    totalAuctionsWon: 0,

    // Phase 5: Corporate HQ, Island Resort, Liveries, Engines, Stock Portfolio, Ledger & Records
    hqTier: 0,
    pendingDividendCash: 0,
    islandResortTier: 0,
    resortAccumCash: 0,
    resortAccumGems: 0,
    yachtLivery: 'pearl_sky',
    planeLivery: 'pearl_sky',
    unlockedLiveries: ['pearl_sky'],
    yachtEngineTier: 1,
    planeEngineTier: 1,
    stockPortfolio: {
      TMBR: { shares: 0, avgPrice: 0 },
      PORT: { shares: 0, avgPrice: 0 },
      AERO: { shares: 0, avgPrice: 0 },
      RESO: { shares: 0, avgPrice: 0 }
    },
    transactionLog: [],
    unreadNotifications: 0,
    personalBests: {
      bestShiftCash: 0,
      bestCpm: 0,
      bestSingleDeal: 0,
      totalStormRescues: 0,
      completedShifts: 0
    },

    // Phase 6: Furniture Mill, Lighthouse, Franchises, Bank Loans, Real Estate & Alliance Exports
    furniture: 0,
    furnitureMillTier: 0,
    lighthouseTier: 0,
    totalFurnitureCrafted: 0,
    unlockedFranchises: [],
    franchiseAccumCash: 0,
    activeLoan: null,
    loansRepaidCount: 0,
    realEstate: {
      re_coldstorage: 0,
      re_office: 0,
      re_auction_hall: 0,
      re_bay_complex: 0
    },
    realEstateAccumCash: 0,
    allianceContract: {
      id: 'al_init_1',
      title: 'Liên Minh Thương Mại Á - Âu',
      partner: 'EuroAsia Timber Guild',
      reqPlanks: 16,
      reqPallets: 3,
      reqCanned: 3,
      reqFurniture: 2,
      rewardCash: 4800,
      rewardGems: 48,
      rewardRep: 120
    },
    allianceCompleted: 0,
    allianceReputation: 0,
    exportBreakdown: {
      planks: 0,
      pallets: 0,
      cannedFish: 0,
      furniture: 0,
      revPlanks: 0,
      revPallets: 0,
      revCanned: 0,
      revFurniture: 0
    },

    // Phase 7: Deep-Water Container Port, Futures, Insurance, Green Carbon, R&D Patents & P&L Ledger
    deepPortTier: 0,
    activeContainerVoyage: null,
    containerAccumCash: 0,
    containerVoyagesCompleted: 0,
    insuranceTier: 0,
    insuranceSavedCash: 0,
    activeFutures: [],
    futuresCompleted: 0,
    greenEnergyTier: 0,
    carbonCredits: 0,
    carbonSoldCash: 0,
    unlockedPatents: [],
    pnlLedger: {
      grossRevenue: 0,
      loanRepaid: 0,
      upgradeSpend: 0,
      insuranceSaved: 0,
      greenSaved: 0
    },

    // Phase 8: Industrial Railway, VIP Helicopter, Automated Container Dispatch & 24h World Clock
    railwayTier: 0,
    railwayAccumCash: 0,
    trainTripsCompleted: 0,
    trainBoostTimer: 0,
    heliTier: 0,
    heliAccumCash: 0,
    heliAccumGems: 0,
    heliDeliveries: 0,
    heliLivery: 'pearl_sky',
    heliEngineTier: 1,
    autoDispatchContainer: true,
    worldTimeHours: 10.5,
    weatherMode: 'auto',

    // Phase 9: Living Island AI Citizens, Civic Promenade Infrastructure, Happiness & Tourism Tax
    civicTier: 0,
    civicAccumCash: 0,
    civicAccumGems: 0,
    civicTipsCollected: 0,
    civicTaxCollected: 0,

    // Cosmetics & Fleet
    equippedSkin: 'classic',
    unlockedSkins: ['classic'],
    equippedPet: 'none',
    unlockedPets: ['none'],
    equippedVehicle: 'forklift',
    unlockedVehicles: ['forklift'],

    // Boost & stats
    boostTimer: 0,
    boostCooldown: 0,
    totalLogsCut: 0,
    totalPlanksSawn: 0,
    totalExported: 0,
    padProgress: {},
    starterPackClaimed: false,
    graphicsQuality: 'auto',
    updatedAt: new Date().toISOString()
  };
}

export const gameState = createDefaultState();

export function getBackpackCapacity() {
  return 6 + ((gameState.backpackTier || 1) - 1) * 4;
}

export function getActiveBranch() {
  return BRANCHES.find((b) => b.id === gameState.activeBranchId) || BRANCHES[0];
}

export function getVipMultiplier() {
  const tier = VIP_TIERS.find((v) => v.level === gameState.vipLevel);
  return tier ? tier.bonusMult : 1.0;
}

export function getSkinData(id = gameState.equippedSkin) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

export function getManagerLevel(id) {
  return (gameState.managers && gameState.managers[id]) || 0;
}

export function getManagerCost(mgr) {
  const lv = getManagerLevel(mgr.id);
  if (lv >= mgr.maxStar) return null;
  return Math.floor(mgr.baseCost * Math.pow(mgr.scale, lv));
}

export function getManagerBonus(statKey) {
  const mgr = MANAGER_CATALOG.find((m) => m.statKey === statKey);
  if (!mgr) return 0;
  return getManagerLevel(mgr.id) * mgr.bonusPerStar;
}

export function getPrestigeMultiplier() {
  return 1 + (gameState.prestigeLevel || 0) * 0.35 + (gameState.prestigeMedals || 0) * 0.04;
}

export function getActiveEvent() {
  return activeEventState.current;
}

export function getBadgeRevenueBonus() {
  const unlocked = gameState.unlockedBadges || [];
  let pct = 0;
  for (const b of BADGE_CODEX) {
    if (unlocked.includes(b.id)) pct += b.bonusPct;
  }
  return pct / 100;
}

export function getHqMultiplierBonus() {
  const hq = HQ_TIERS.find((h) => h.tier === (gameState.hqTier || 0));
  return hq ? hq.revBonus : 0;
}

export function getLighthouseContractBonus() {
  const lh = LIGHTHOUSE_TIERS.find((l) => l.tier === (gameState.lighthouseTier || 0));
  return lh ? lh.contractBonus : 0;
}

export function getFranchiseBonusPct() {
  const list = Array.isArray(gameState.unlockedFranchises) ? gameState.unlockedFranchises : [];
  let pct = 0;
  for (const f of GLOBAL_FRANCHISES) {
    if (list.includes(f.id)) pct += f.exportBonusPct;
  }
  return pct;
}

export function getFranchiseRoyaltyPer10s() {
  const list = Array.isArray(gameState.unlockedFranchises) ? gameState.unlockedFranchises : [];
  let sum = 0;
  for (const f of GLOBAL_FRANCHISES) {
    if (list.includes(f.id)) sum += f.royaltyPer10s;
  }
  return Math.round(sum * getPrestigeMultiplier());
}

export function getRealEstateIncomePer10s() {
  const re = gameState.realEstate || {};
  let sum = 0;
  for (const prop of REAL_ESTATE_CATALOG) {
    const lv = re[prop.id] || 0;
    if (lv > 0) sum += prop.cashPer10s * lv;
  }
  return Math.round(sum * getPrestigeMultiplier());
}

export function hasPatent(id) {
  return Array.isArray(gameState.unlockedPatents) && gameState.unlockedPatents.includes(id);
}

export function getGreenCostReductionPct() {
  const ge = GREEN_ENERGY_TIERS.find((g) => g.tier === (gameState.greenEnergyTier || 0));
  return ge ? ge.costReductionPct : 0;
}

export function getRevenueMultiplier() {
  const branchMult = getActiveBranch().multiplier;
  const plankMult = 1 + ((gameState.plankValueTier || 1) - 1) * 0.35;
  const vipMult = getVipMultiplier();
  const mgrMult = 1 + getManagerBonus('sawValue');
  const prestigeMult = getPrestigeMultiplier();
  const badgeMult = 1 + getBadgeRevenueBonus();
  const hqMult = 1 + getHqMultiplierBonus();
  const civicDef = CIVIC_AMENITY_TIERS.find((c) => c.tier === (gameState.civicTier || 0));
  const civicMult = 1 + (civicDef ? civicDef.revBonus : 0);
  const franchiseMult = 1 + getFranchiseBonusPct() / 100;
  const patentKilnMult = hasPatent('pat_kiln') ? 1.22 : 1.0;
  const ev = activeEventState.current;
  const eventMult = ev && ev.multTarget === 'sawmill' ? 1 + ev.multBonus : 1.0;
  const expo = expoState.current;
  const expoMult = expo && expo.target === 'sawmill' ? 1 + expo.bonusPct / 100 : 1.0;
  let skinMult = 1.0;
  if (gameState.equippedSkin === 'captain') skinMult = 1.15;
  if (gameState.equippedSkin === 'gold_tycoon') skinMult = 1.25;
  return branchMult * plankMult * vipMult * skinMult * mgrMult * prestigeMult * badgeMult * hqMult * civicMult * franchiseMult * patentKilnMult * eventMult * expoMult;
}

export function getContractMultiplier() {
  const ev = activeEventState.current;
  const eventMult = ev && ev.multTarget === 'contracts' ? 1 + ev.multBonus : 1.0;
  const expo = expoState.current;
  const expoMult = expo && expo.target === 'contracts' ? 1 + expo.bonusPct / 100 : 1.0;
  const lhMult = 1 + getLighthouseContractBonus();
  const hedgeMult = hasPatent('pat_fin_hedge') ? 1.18 : 1.0;
  const railDef = RAILWAY_TIERS.find((r) => r.tier === (gameState.railwayTier || 0));
  const railSynergy = 1 + (railDef ? railDef.synergyBonus : 0);
  return getRevenueMultiplier() * (1 + getManagerBonus('contractBonus')) * eventMult * expoMult * lhMult * hedgeMult * railSynergy;
}

export function getUpgradeCost(item) {
  const cur = gameState[item.id] || 0;
  if (cur >= item.max) return null;
  const baseLevel = item.id === 'conveyorTier' || item.category === 'workforce' ? cur : Math.max(0, cur - 1);
  let cost = Math.floor(item.baseCost * Math.pow(item.scale, baseLevel));
  if (gameState.vipLevel >= 4) cost = Math.floor(cost * 0.8);
  if (hasPatent('pat_eco_resin')) cost = Math.floor(cost * 0.85);
  const greenRed = getGreenCostReductionPct();
  if (greenRed > 0) cost = Math.floor(cost * (1 - greenRed / 100));
  return Math.max(10, cost);
}

export function getSawmillVisualTier() {
  if ((gameState.sawSpeedTier || 1) >= 5 || (gameState.plankValueTier || 1) >= 4) return 3;
  if ((gameState.sawSpeedTier || 1) >= 3 || (gameState.conveyorTier || 0) >= 1) return 2;
  return 1;
}

export function getHarborVisualTier() {
  if ((gameState.contractsCompleted || 0) >= 5 || (gameState.unlockedBranches?.length || 1) >= 2) return 3;
  if ((gameState.contractsCompleted || 0) >= 2 || (gameState.fishingBoats || 0) >= 2) return 2;
  return 1;
}

export function logTransaction(kind, title, cashDelta = 0, gemDelta = 0) {
  if (!Array.isArray(gameState.transactionLog)) gameState.transactionLog = [];
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  gameState.transactionLog.unshift({
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 999),
    time: `${hh}:${mm}:${ss}`,
    kind, // 'income' | 'stocks' | 'fleet'
    title,
    cashDelta: Math.round(cashDelta),
    gemDelta: Math.round(gemDelta)
  });
  if (gameState.transactionLog.length > 60) {
    gameState.transactionLog.length = 60;
  }
  gameState.unreadNotifications = Math.min(99, (gameState.unreadNotifications || 0) + 1);
}

export function markNotificationsRead() {
  gameState.unreadNotifications = 0;
}

export function recordRevenue(source, amount) {
  if (!amount || amount <= 0) return;
  const rounded = Math.round(amount);
  if (!gameState.revenueStats) {
    gameState.revenueStats = { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0, stocks: 0, resort: 0, furniture: 0, franchise: 0, realestate: 0, container: 0, carbon: 0, futures: 0 };
  }
  if (!(source in gameState.revenueStats)) {
    gameState.revenueStats[source] = 0;
  }
  gameState.revenueStats[source] += rounded;

  if (!gameState.pnlLedger) {
    gameState.pnlLedger = { grossRevenue: 0, loanRepaid: 0, upgradeSpend: 0, insuranceSaved: 0, greenSaved: 0 };
  }
  gameState.pnlLedger.grossRevenue = (gameState.pnlLedger.grossRevenue || 0) + rounded;

  // Automatic safe loan repayment on positive earnings
  if (gameState.activeLoan && gameState.activeLoan.remaining > 0 && source !== 'offline') {
    processLoanAutoDeduct(rounded);
  }

  shiftSession.cashEarned += rounded;
  if (!gameState.personalBests) {
    gameState.personalBests = { bestShiftCash: 0, bestCpm: 0, bestSingleDeal: 0, totalStormRescues: 0, completedShifts: 0 };
  }
  if (rounded > (gameState.personalBests.bestSingleDeal || 0)) {
    gameState.personalBests.bestSingleDeal = rounded;
  }
  if (shiftSession.cashEarned > (gameState.personalBests.bestShiftCash || 0)) {
    gameState.personalBests.bestShiftCash = shiftSession.cashEarned;
  }

  cashFlowSamples.push({ t: Date.now(), amt: rounded });
  if (cashFlowSamples.length > 240) cashFlowSamples.shift();
}

export function recordPnlExpense(kind, amount) {
  if (!amount || amount <= 0) return;
  if (!gameState.pnlLedger) {
    gameState.pnlLedger = { grossRevenue: 0, loanRepaid: 0, upgradeSpend: 0, insuranceSaved: 0, greenSaved: 0 };
  }
  gameState.pnlLedger[kind] = (gameState.pnlLedger[kind] || 0) + Math.round(amount);
}

export function addVipXp(amount) {
  gameState.vipXp = (gameState.vipXp || 0) + amount;
  let newLv = 0;
  for (const tier of VIP_TIERS) {
    if (gameState.vipXp >= tier.xpReq) newLv = tier.level;
  }
  if (newLv > gameState.vipLevel) {
    gameState.vipLevel = newLv;
    return newLv;
  }
  return 0;
}

export function addSeasonXp(amount) {
  gameState.seasonXp = (gameState.seasonXp || 0) + amount;
}

export function advanceDailyQuest(key, delta = 1) {
  for (const q of gameState.dailyQuests) {
    if (q.key === key && !q.claimed) {
      q.progress = Math.min(q.target, q.progress + delta);
    }
  }
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function canClaimDailyCheckIn() {
  return gameState.lastCheckInDate !== todayIsoDate();
}

export function claimDailyCheckIn() {
  if (!canClaimDailyCheckIn()) return null;
  const nextDay = ((gameState.loginStreakDay || 0) % 7) + 1;
  const reward = DAILY_REWARDS[nextDay - 1];
  gameState.loginStreakDay = nextDay;
  gameState.lastCheckInDate = todayIsoDate();
  if (reward.type === 'gems') gameState.gems += reward.amount;
  else {
    gameState.cash += reward.amount;
    recordRevenue('offline', reward.amount);
  }
  if (nextDay === 7) addVipXp(120);
  addSeasonXp(40);
  return reward;
}

export function isAchievementReady(ach) {
  const claimed = gameState.claimedAchievements || [];
  if (claimed.includes(ach.id)) return false;
  return (gameState[ach.statKey] || 0) >= ach.target;
}

export function getReadyAchievementCount() {
  return ACHIEVEMENTS.filter((a) => isAchievementReady(a)).length;
}

export function calculateOfflineEarnings(previousUpdatedAt) {
  if (!previousUpdatedAt) return null;
  const prevMs = Date.parse(previousUpdatedAt);
  if (Number.isNaN(prevMs)) return null;
  const elapsedSec = Math.floor((Date.now() - prevMs) / 1000);
  if (elapsedSec < 20) return null;

  const cappedSec = Math.min(4 * 3600, elapsedSec);
  const workforceScore = (gameState.lumberjacks || 0) * 1.4
    + (gameState.autoForklifts || 0) * 2.5
    + Math.max(1, gameState.fishingBoats || 0) * 1.1;

  const cryoMult = hasPatent('pat_cold_cryo') ? 1.25 : 1.0;
  const mult = getRevenueMultiplier() * (1 + getManagerBonus('offlineBonus')) * cryoMult;
  const cash = Math.max(25, Math.round((cappedSec / 12) * workforceScore * mult));
  const planks = Math.min(40, Math.floor((cappedSec / 45) * Math.max(1, gameState.lumberjacks || 0)));
  return { seconds: cappedSec, cash, planks };
}

export function canFreeSpin() {
  return gameState.lastFreeSpinDate !== todayIsoDate();
}

export function spawnVipRushOrder() {
  const tier = Math.max(1, gameState.contractsCompleted || 1);
  const reqPlanks = 6 + tier * 2;
  const reqPallets = tier >= 2 ? Math.min(5, Math.floor(tier * 0.8)) : 0;
  const reqCanned = tier >= 3 ? Math.min(4, Math.floor(tier * 0.6)) : 0;
  const mult = getActiveBranch().multiplier * getPrestigeMultiplier();
  gameState.vipRushOrder = {
    id: 'rush_' + Date.now(),
    title: reqPallets > 0 ? 'Đơn Hàng VIP Khẩn Cấp Cảng' : 'Lệnh Xuất Gỗ Ván Hỏa Tốc',
    reqPlanks,
    reqPallets,
    reqCanned,
    rewardCash: Math.floor((1800 + tier * 950) * mult),
    rewardGems: 22 + tier * 3,
    timeLeft: 95,
    maxTime: 95
  };
}

export function tickTimedEvents(dt) {
  if (activeEventState.current) {
    activeEventState.timeLeft -= dt;
    if (activeEventState.timeLeft <= 0) {
      activeEventState.current = null;
      activeEventState.cooldown = 30;
    }
  } else {
    activeEventState.cooldown -= dt;
    if (activeEventState.cooldown <= 0) {
      activeEventState.index = (activeEventState.index + 1) % TIMED_EVENTS.length;
      activeEventState.current = TIMED_EVENTS[activeEventState.index];
      activeEventState.timeLeft = activeEventState.current.duration;
      return activeEventState.current;
    }
  }
  return null;
}

export function tickVipRushOrder(dt) {
  if (gameState.vipRushOrder) {
    gameState.vipRushOrder.timeLeft -= dt;
    if (gameState.vipRushOrder.timeLeft <= 0) {
      gameState.vipRushOrder = null;
      gameState.vipRushCooldown = 45;
      return 'expired';
    }
  } else {
    gameState.vipRushCooldown = (gameState.vipRushCooldown ?? 20) - dt;
    if (gameState.vipRushCooldown <= 0) {
      spawnVipRushOrder();
      return 'spawned';
    }
  }
  return null;
}

export function canPrestige() {
  return (gameState.level || 1) >= 5 || (gameState.contractsCompleted || 0) >= 3 || (gameState.cash || 0) >= 18000;
}

export function getPrestigeRewardMedals() {
  const score = Math.floor((gameState.cash || 0) / 8000) + (gameState.contractsCompleted || 0) + Math.floor((gameState.level || 1) / 3);
  return Math.max(2, score);
}

export function performPrestige() {
  if (!canPrestige()) return 0;
  const medals = getPrestigeRewardMedals();
  gameState.prestigeLevel = (gameState.prestigeLevel || 0) + 1;
  gameState.prestigeMedals = (gameState.prestigeMedals || 0) + medals;

  gameState.level = 1;
  gameState.xp = 0;
  gameState.cash = 280 + medals * 60;
  gameState.logs = 0;
  gameState.sawmillBuffer = 0;
  gameState.planks = 0;
  gameState.pallets = 0;
  gameState.freshFish = 0;
  gameState.cannedFish = 0;

  gameState.axeTier = 1;
  gameState.backpackTier = 1;
  gameState.bootsTier = 1;
  gameState.sawSpeedTier = 1;
  gameState.conveyorTier = 0;
  gameState.plankValueTier = 1;
  gameState.lumberjacks = 0;
  gameState.autoForklifts = 0;
  gameState.fishingBoats = 0;

  gameState.managers = { mgr_forest: 0, mgr_sawmill: 0, mgr_harbor: 0, mgr_coldchain: 0 };
  gameState.logisticsTier = 0;
  gameState.yachtTier = 0;
  gameState.yachtAccumCash = 0;
  gameState.yachtAccumGems = 0;
  gameState.airportTier = 0;
  gameState.islandStationTier = 0;
  gameState.autoSeaFleet = 0;
  gameState.autoAirFleet = 0;
  gameState.hqTier = 0;
  gameState.pendingDividendCash = 0;
  gameState.islandResortTier = 0;
  gameState.resortAccumCash = 0;
  gameState.resortAccumGems = 0;
  gameState.yachtEngineTier = 1;
  gameState.planeEngineTier = 1;
  gameState.furniture = 0;
  gameState.furnitureMillTier = 0;
  gameState.lighthouseTier = 0;
  gameState.franchiseAccumCash = 0;
  gameState.activeLoan = null;
  gameState.realEstateAccumCash = 0;
  gameState.deepPortTier = 0;
  gameState.activeContainerVoyage = null;
  gameState.containerAccumCash = 0;
  gameState.insuranceTier = 0;
  gameState.activeFutures = [];
  gameState.greenEnergyTier = 0;
  gameState.carbonCredits = 0;
  gameState.railwayTier = 0;
  gameState.railwayAccumCash = 0;
  gameState.trainBoostTimer = 0;
  gameState.heliTier = 0;
  gameState.heliAccumCash = 0;
  gameState.heliAccumGems = 0;
  gameState.heliEngineTier = 1;
  gameState.stockPortfolio = {
    TMBR: { shares: 0, avgPrice: 0 },
    PORT: { shares: 0, avgPrice: 0 },
    AERO: { shares: 0, avgPrice: 0 },
    RESO: { shares: 0, avgPrice: 0 }
  };
  gameState.activeBranchId = 'pine_bay';
  gameState.unlockedBranches = ['pine_bay'];
  gameState.contractsCompleted = 0;
  gameState.padProgress = {};
  gameState.vipRushOrder = null;
  gameState.vipRushCooldown = 15;
  generateAllianceContract();
  fleetMissionState.sea = null;
  fleetMissionState.air = null;
  stormState.active = false;
  stormState.cooldown = 22;
  resetShiftSession(true);
  logTransaction('fleet', `Chuyển sinh Đế chế Cấp ${gameState.prestigeLevel} (+${medals} 🏅)`, 0, 0);
  evaluateBadgeUnlocks();
  generateNextContract();
  return medals;
}

export function getLogisticsNextTier() {
  const cur = gameState.logisticsTier || 0;
  return LOGISTICS_TIERS.find((t) => t.tier === cur + 1) || null;
}

export function getYachtNextTier() {
  const cur = gameState.yachtTier || 0;
  return YACHT_TIERS.find((y) => y.tier === cur + 1) || null;
}

export function getAirportNextTier() {
  const cur = gameState.airportTier || 0;
  return AIRPORT_TIERS.find((a) => a.tier === cur + 1) || null;
}

export function getIslandNextTier() {
  const cur = gameState.islandStationTier || 0;
  return ISLAND_STATION_TIERS.find((s) => s.tier === cur + 1) || null;
}

export function getSeaFleetCost() {
  const cur = gameState.autoSeaFleet || 0;
  if (cur >= 3) return null;
  return Math.round(5800 * Math.pow(2.2, cur));
}

export function getAirFleetCost() {
  const cur = gameState.autoAirFleet || 0;
  if (cur >= 3) return null;
  return Math.round(7600 * Math.pow(2.25, cur));
}

export function getPlaneData(id = gameState.equippedPlane) {
  return PLANES.find((p) => p.id === id) || PLANES[0];
}

export function spawnFleetMission(kind) {
  const branchMult = getActiveBranch().multiplier * getPrestigeMultiplier();
  const islandDef = ISLAND_STATION_TIERS.find((s) => s.tier === (gameState.islandStationTier || 0));
  const islandMult = islandDef ? islandDef.tradeMult : 1.0;

  if (kind === 'sea') {
    const toIsland = (gameState.islandStationTier || 0) > 0;
    const target = toIsland
      ? { x: 42, z: 86, label: 'Cầu Tàu Đảo Tiền Đồn' }
      : { x: -24, z: 76, label: 'Phao Giao Hàng Vịnh Tây' };
    const yachtLv = Math.max(1, gameState.yachtTier || 1);
    fleetMissionState.sea = {
      id: 'sea_' + Date.now(),
      title: toIsland ? 'Đơn Hàng Hải: Cảng → Đảo Tiền Đồn' : 'Tuần Tra & Giao Hàng Vịnh Tây',
      targetX: target.x,
      targetZ: target.z,
      targetLabel: target.label,
      rewardCash: Math.round((950 + yachtLv * 450) * branchMult * islandMult),
      rewardGems: 10 + yachtLv * 4,
      timeLeft: 90
    };
    return fleetMissionState.sea;
  }

  const airDef = AIRPORT_TIERS.find((a) => a.tier === (gameState.airportTier || 0));
  const airMult = airDef ? airDef.airMult : 1.0;
  const plane = getPlaneData();
  const toIsland = (gameState.islandStationTier || 0) > 0 && Math.random() > 0.35;
  const target = toIsland
    ? { x: 52, y: 12, z: 92, label: 'Không Phận Đảo Tiền Đồn' }
    : { x: 2, y: 12, z: 32, label: 'Tháp Không Lưu Cảng Biển' };

  fleetMissionState.air = {
    id: 'air_' + Date.now(),
    title: toIsland ? 'Thả Hàng Siêu Tốc: Đảo Tiền Đồn' : 'Tiếp Tế Hàng Không: Cảng Biển',
    targetX: target.x,
    targetY: target.y,
    targetZ: target.z,
    targetLabel: target.label,
    rewardCash: Math.round(1450 * branchMult * islandMult * airMult * (plane.cargoBonus || 1)),
    rewardGems: 14 + (gameState.airportTier || 1) * 5,
    timeLeft: 75
  };
  return fleetMissionState.air;
}

export function tickFleetMissions(dt) {
  let spawned = null;
  if ((gameState.yachtTier || 0) > 0) {
    if (fleetMissionState.sea) {
      fleetMissionState.sea.timeLeft -= dt;
      if (fleetMissionState.sea.timeLeft <= 0) {
        fleetMissionState.sea = null;
        fleetMissionState.seaCooldown = 8;
      }
    } else {
      fleetMissionState.seaCooldown -= dt;
      if (fleetMissionState.seaCooldown <= 0) {
        spawnFleetMission('sea');
        spawned = 'sea';
      }
    }
  }
  if ((gameState.airportTier || 0) > 0 && (gameState.unlockedPlanes?.length || 0) > 0) {
    if (fleetMissionState.air) {
      fleetMissionState.air.timeLeft -= dt;
      if (fleetMissionState.air.timeLeft <= 0) {
        fleetMissionState.air = null;
        fleetMissionState.airCooldown = 8;
      }
    } else {
      fleetMissionState.airCooldown -= dt;
      if (fleetMissionState.airCooldown <= 0) {
        spawnFleetMission('air');
        spawned = spawned || 'air';
      }
    }
  }
  return spawned;
}

export function completeFleetMission(kind) {
  const m = fleetMissionState[kind];
  if (!m) return null;
  gameState.cash += m.rewardCash;
  gameState.gems += m.rewardGems;
  recordRevenue('contracts', m.rewardCash);
  addVipXp(38);
  addSeasonXp(30);
  if (kind === 'sea') {
    gameState.seaDeliveries = (gameState.seaDeliveries || 0) + 1;
    fleetMissionState.sea = null;
    fleetMissionState.seaCooldown = 6;
  } else {
    gameState.airDeliveries = (gameState.airDeliveries || 0) + 1;
    fleetMissionState.air = null;
    fleetMissionState.airCooldown = 6;
  }
  return m;
}

export function evaluateBadgeUnlocks() {
  if (!Array.isArray(gameState.unlockedBadges)) gameState.unlockedBadges = [];
  const newlyUnlocked = [];
  for (const b of BADGE_CODEX) {
    if (!gameState.unlockedBadges.includes(b.id) && b.check()) {
      gameState.unlockedBadges.push(b.id);
      newlyUnlocked.push(b);
    }
  }
  return newlyUnlocked;
}

export function getActiveMilestone() {
  const idx = gameState.milestoneIndex || 0;
  return MILESTONE_QUESTS[idx] || null;
}

export function claimActiveMilestone() {
  const ms = getActiveMilestone();
  if (!ms) return null;
  if ((gameState[ms.statKey] || 0) < ms.target) return null;
  gameState.cash += ms.rewardCash;
  gameState.gems += ms.rewardGems;
  recordRevenue('offline', ms.rewardCash);
  addVipXp(ms.rewardVipXp);
  addSeasonXp(50);
  gameState.milestoneIndex = (gameState.milestoneIndex || 0) + 1;
  return ms;
}

export function claimYachtYield() {
  const cash = Math.floor(gameState.yachtAccumCash || 0);
  const gems = Math.floor(gameState.yachtAccumGems || 0);
  if (cash <= 0 && gems <= 0) return null;
  gameState.cash += cash;
  gameState.gems += gems;
  gameState.yachtAccumCash = 0;
  gameState.yachtAccumGems = 0;
  if (cash > 0) recordRevenue('fishery', cash);
  addVipXp(15);
  return { cash, gems };
}

export function getCurrentLimitedCombo() {
  return LIMITED_COMBOS[comboState.index % LIMITED_COMBOS.length];
}

export function tickComboTimer(dt) {
  comboState.timeLeft -= dt;
  if (comboState.timeLeft <= 0) {
    comboState.index = (comboState.index + 1) % LIMITED_COMBOS.length;
    comboState.timeLeft = 1800;
    comboState.purchasedId = null;
    return getCurrentLimitedCombo();
  }
  return null;
}

export function purchaseLimitedCombo() {
  const combo = getCurrentLimitedCombo();
  if (!combo || comboState.purchasedId === combo.id) return { ok: false, reason: 'Gói ưu đãi phiên này đã được mua!' };
  if (combo.costType === 'gems') {
    if (gameState.gems < combo.cost) return { ok: false, reason: 'Chưa đủ Đá quý!' };
    gameState.gems -= combo.cost;
  } else {
    if (gameState.cash < combo.cost) return { ok: false, reason: 'Chưa đủ tiền mặt!' };
    gameState.cash -= combo.cost;
  }
  if (combo.rewardCash > 0) {
    gameState.cash += combo.rewardCash;
    recordRevenue('offline', combo.rewardCash);
  }
  if (combo.rewardGems > 0) gameState.gems += combo.rewardGems;
  if (combo.rewardVipXp > 0) addVipXp(combo.rewardVipXp);
  if (combo.boostSec > 0) gameState.boostTimer = Math.max(gameState.boostTimer || 0, combo.boostSec);
  comboState.purchasedId = combo.id;
  return { ok: true, combo };
}

function buildAuctionInstance(idx) {
  const tpl = AUCTION_TEMPLATES[idx % AUCTION_TEMPLATES.length];
  if (tpl.kind === 'sell') {
    const baseUnit = tpl.itemKey === 'planks' ? 24 : tpl.itemKey === 'pallets' ? 115 : 75;
    const baseOffer = Math.round(tpl.qty * baseUnit * tpl.baseMult * getRevenueMultiplier());
    return {
      ...tpl,
      uid: 'auc_' + Date.now(),
      currentBid: baseOffer,
      stepCash: Math.max(80, Math.round(baseOffer * 0.12))
    };
  }
  const scaledCost = Math.round(tpl.bidCost * Math.max(1, getActiveBranch().multiplier * 0.75));
  return {
    ...tpl,
    uid: 'auc_' + Date.now(),
    currentBid: scaledCost,
    stepCash: Math.max(150, Math.round(scaledCost * 0.15))
  };
}

auctionState.current = buildAuctionInstance(0);

export function tickAuctionTimer(dt) {
  if (auctionState.current) {
    auctionState.timeLeft -= dt;
    if (auctionState.current.kind === 'sell' && auctionState.rivalBids < 3 && auctionState.timeLeft < 55 - auctionState.rivalBids * 16) {
      auctionState.rivalBids += 1;
      auctionState.current.currentBid += auctionState.current.stepCash;
    }
    if (auctionState.timeLeft <= 0) {
      auctionState.current = null;
      auctionState.cooldown = 18;
      auctionState.rivalBids = 0;
    }
  } else {
    auctionState.cooldown -= dt;
    if (auctionState.cooldown <= 0) {
      auctionState.index = (auctionState.index + 1) % AUCTION_TEMPLATES.length;
      auctionState.current = buildAuctionInstance(auctionState.index);
      auctionState.timeLeft = 75;
      auctionState.rivalBids = 0;
      return auctionState.current;
    }
  }
  return null;
}

export function settleAuctionLot() {
  const auc = auctionState.current;
  if (!auc) return { ok: false, reason: 'Chưa có phiên đấu giá mở.' };
  if (auc.kind === 'sell') {
    const stock = Math.floor(gameState[auc.itemKey] || 0);
    if (stock < auc.qty) return { ok: false, reason: `Cần đủ ${auc.qty} ${auc.itemLabel} trong kho.` };
    gameState[auc.itemKey] -= auc.qty;
    gameState.cash += auc.currentBid;
    gameState.gems += auc.rewardGems;
    gameState.totalExported += auc.qty;
    gameState.totalAuctionsWon = (gameState.totalAuctionsWon || 0) + 1;
    recordRevenue('market', auc.currentBid);
    addVipXp(auc.rewardVipXp);
    addSeasonXp(35);
    const out = { ok: true, kind: 'sell', cash: auc.currentBid, gems: auc.rewardGems, title: auc.title };
    auctionState.current = null;
    auctionState.cooldown = 18;
    evaluateBadgeUnlocks();
    return out;
  }
  if (gameState.cash < auc.currentBid) return { ok: false, reason: 'Chưa đủ tiền mặt đặt mua lô hàng.' };
  gameState.cash -= auc.currentBid;
  gameState.gems += auc.rewardGems;
  gameState.totalAuctionsWon = (gameState.totalAuctionsWon || 0) + 1;
  addVipXp(auc.rewardVipXp);
  addSeasonXp(40);
  const out = { ok: true, kind: 'buy_gems', spent: auc.currentBid, gems: auc.rewardGems, title: auc.title };
  auctionState.current = null;
  auctionState.cooldown = 18;
  evaluateBadgeUnlocks();
  return out;
}

export function generateNextContract() {
  const n = (gameState.contractsCompleted || 0) + 1;
  const titles = [
    'Đơn Hàng Container Bắc Âu',
    'Hợp Đồng Gỗ Sấy Singapore',
    'Chuyến Tàu Cá Hộp Tokyo',
    'Đơn Xuất Khẩu Cảng Rotterdam',
    'Lô Pallet Siêu Thị Toàn Cầu'
  ];
  const reqPlanks = 8 + n * 5;
  const reqPallets = 2 + Math.floor(n * 1.2);
  const reqCanned = n >= 2 ? 2 + Math.floor(n * 0.8) : 0;
  const mult = getActiveBranch().multiplier * getPrestigeMultiplier();
  gameState.activeContract = {
    id: 'ct_' + Date.now(),
    title: titles[n % titles.length],
    reqPlanks,
    reqPallets,
    reqCanned,
    deliveredPlanks: 0,
    deliveredPallets: 0,
    deliveredCanned: 0,
    rewardCash: Math.floor((1400 + n * 750) * mult),
    rewardGems: 18 + n * 4,
    rewardSeasonXp: 90 + n * 15,
    timeLeft: 260
  };
}

let saveDebounce = null;

export function saveGameLocal() {
  try {
    gameState.updatedAt = new Date().toISOString();
    localStorage.setItem('timberport_save_v2', JSON.stringify(gameState));
  } catch (e) {}
}

export async function saveGameServer(immediate = false) {
  saveGameLocal();
  const run = async () => {
    try {
      await fetch(`${API_BASE}/api/save-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameState.username ? gameState.username.toLowerCase() : gameState.playerId,
          username: gameState.username,
          empireName: gameState.empireName,
          level: gameState.level,
          money: Math.floor(gameState.cash),
          totalLogsCut: gameState.totalLogsCut,
          vipLevel: gameState.vipLevel || 0,
          prestigeLevel: gameState.prestigeLevel || 0,
          yachtTier: gameState.yachtTier || 0,
          unlockedBadgesCount: (gameState.unlockedBadges || []).length,
          timberportState: gameState
        })
      });
    } catch (e) {}
  };
  if (immediate) return run();
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(run, 1800);
}

// ---------------------------------------------------------------------------
// Phase 5: HQ, Island Resort, Liveries, Engines, Stock Market, Storm & Shift
// ---------------------------------------------------------------------------
export function getHqNextTier() {
  const cur = gameState.hqTier || 0;
  return HQ_TIERS.find((h) => h.tier === cur + 1) || null;
}

export function getResortNextTier() {
  const cur = gameState.islandResortTier || 0;
  return ISLAND_RESORT_TIERS.find((r) => r.tier === cur + 1) || null;
}

export function getLiveryData(id = 'pearl_sky') {
  return FLEET_LIVERIES.find((l) => l.id === id) || FLEET_LIVERIES[0];
}

export function getYachtEngineCost(lv = gameState.yachtEngineTier || 1) {
  if (lv >= ENGINE_MAX_TIER) return null;
  return Math.round(2800 * Math.pow(2.15, Math.max(0, lv - 1)));
}

export function getPlaneEngineCost(lv = gameState.planeEngineTier || 1) {
  if (lv >= ENGINE_MAX_TIER) return null;
  return Math.round(3600 * Math.pow(2.2, Math.max(0, lv - 1)));
}

export function getEngineSpeedMult(lv = 1) {
  return 1 + (Math.max(1, lv) - 1) * 0.14;
}

export function getEngineYieldMult(lv = 1) {
  return 1 + (Math.max(1, lv) - 1) * 0.16;
}

export function sampleRevenueHistory() {
  const cpm = getCashPerMinute();
  revenueHistory.push({ t: Date.now(), cpm });
  if (revenueHistory.length > 24) revenueHistory.shift();
  return cpm;
}

export function updateStockPrices() {
  const movers = [];
  const fundamentalDrivers = {
    TMBR: 1 + ((gameState.sawSpeedTier || 1) - 1) * 0.08 + (gameState.hqTier || 0) * 0.12,
    PORT: 1 + ((gameState.logisticsTier || 0) * 0.1) + Math.min(0.6, (gameState.contractsCompleted || 0) * 0.04),
    AERO: 1 + ((gameState.yachtTier || 0) * 0.12) + ((gameState.airportTier || 0) * 0.12) + ((gameState.autoAirFleet || 0) * 0.08),
    RESO: 1 + ((gameState.islandStationTier || 0) * 0.1) + ((gameState.islandResortTier || 0) * 0.18)
  };
  for (const t of STOCK_TICKERS) {
    const entry = stockMarketState.items[t.symbol];
    const eq = t.basePrice * (fundamentalDrivers[t.symbol] || 1);
    const pull = (eq - entry.price) * 0.14;
    const shock = entry.price * (Math.random() - 0.485) * 0.11;
    const minP = Math.round(t.basePrice * 0.55);
    const maxP = Math.round(eq * 1.65);
    const nextPrice = Math.max(minP, Math.min(maxP, Math.round(entry.price + pull + shock)));
    entry.prevPrice = entry.price;
    entry.price = nextPrice;
    entry.history.push(nextPrice);
    if (entry.history.length > 16) entry.history.shift();
    const pct = ((nextPrice - entry.prevPrice) / Math.max(1, entry.prevPrice)) * 100;
    if (Math.abs(pct) >= 5.5) {
      movers.push(`${t.symbol} ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`);
    }
  }
  stockMarketState.lastUpdateMs = Date.now();
  return movers;
}

export function buyStock(symbol, qty = 10) {
  const entry = stockMarketState.items[symbol];
  if (!entry || qty <= 0) return { ok: false, reason: 'Mã cổ phiếu không hợp lệ.' };
  const cost = entry.price * qty;
  if (gameState.cash < cost) return { ok: false, reason: 'Chưa đủ tiền mặt mua cổ phiếu.' };
  if (!gameState.stockPortfolio) gameState.stockPortfolio = {};
  const hold = gameState.stockPortfolio[symbol] || { shares: 0, avgPrice: 0 };
  const prevVal = hold.shares * hold.avgPrice;
  const nextShares = hold.shares + qty;
  hold.avgPrice = Math.round(((prevVal + cost) / nextShares) * 100) / 100;
  hold.shares = nextShares;
  gameState.stockPortfolio[symbol] = hold;
  gameState.cash -= cost;
  logTransaction('stocks', `Mua ${qty} CP ${symbol} @ $${entry.price}`, -cost, 0);
  return { ok: true, symbol, qty, cost, price: entry.price };
}

export function sellStock(symbol) {
  const entry = stockMarketState.items[symbol];
  const hold = gameState.stockPortfolio?.[symbol];
  if (!entry || !hold || hold.shares <= 0) return { ok: false, reason: 'Bạn chưa nắm giữ cổ phiếu này.' };
  const shares = hold.shares;
  const gross = Math.round(shares * entry.price);
  const basis = Math.round(shares * hold.avgPrice);
  const profit = gross - basis;
  gameState.cash += gross;
  hold.shares = 0;
  hold.avgPrice = 0;
  if (profit > 0) recordRevenue('stocks', profit);
  else recordRevenue('stocks', Math.round(gross * 0.15));
  logTransaction('stocks', `Chốt ${shares} CP ${symbol} (${profit >= 0 ? `Lãi +$${profit.toLocaleString()}` : `Lỗ -$${Math.abs(profit).toLocaleString()}`})`, gross, 0);
  return { ok: true, symbol, shares, gross, profit };
}

export function claimResortYield() {
  const cash = Math.floor(gameState.resortAccumCash || 0);
  const gems = Math.floor(gameState.resortAccumGems || 0);
  if (cash <= 0 && gems <= 0) return null;
  gameState.cash += cash;
  gameState.gems += gems;
  gameState.resortAccumCash = 0;
  gameState.resortAccumGems = 0;
  if (cash > 0) recordRevenue('resort', cash);
  addVipXp(18);
  logTransaction('income', 'Thu hoạch Khu Nghỉ Dưỡng Đảo VIP', cash, gems);
  return { cash, gems };
}

export function claimDividendYield() {
  const cash = Math.floor(gameState.pendingDividendCash || 0);
  if (cash <= 0) return null;
  gameState.cash += cash;
  gameState.pendingDividendCash = 0;
  recordRevenue('stocks', cash);
  addVipXp(14);
  logTransaction('stocks', 'Nhận Cổ Tức Trụ Sở Tập Đoàn', cash, 0);
  return { cash };
}

export function getTotalPendingYields() {
  return Math.floor(gameState.yachtAccumCash || 0)
    + Math.floor(gameState.resortAccumCash || 0)
    + Math.floor(gameState.pendingDividendCash || 0)
    + Math.floor(gameState.franchiseAccumCash || 0)
    + Math.floor(gameState.realEstateAccumCash || 0)
    + Math.floor(gameState.containerAccumCash || 0)
    + Math.floor(gameState.railwayAccumCash || 0)
    + Math.floor(gameState.heliAccumCash || 0)
    + Math.floor(gameState.civicAccumCash || 0);
}

export function collectAllEmpireYields() {
  let cash = 0;
  let gems = 0;
  const y = claimYachtYield();
  if (y) {
    cash += y.cash;
    gems += y.gems;
    logTransaction('income', 'Thu hoạch Quỹ Du Thuyền VIP', y.cash, y.gems);
  }
  const r = claimResortYield();
  if (r) {
    cash += r.cash;
    gems += r.gems;
  }
  const d = claimDividendYield();
  if (d) {
    cash += d.cash;
  }
  const f = claimFranchiseYield();
  if (f) {
    cash += f.cash;
  }
  const re = claimRealEstateYield();
  if (re) {
    cash += re.cash;
  }
  const dc = claimContainerYield();
  if (dc) {
    cash += dc.cash;
  }
  const rl = claimRailwayYield();
  if (rl) {
    cash += rl.cash;
  }
  const hl = claimHeliYield();
  if (hl) {
    cash += hl.cash;
    gems += hl.gems;
  }
  const cv = claimCivicYield();
  if (cv) {
    cash += cv.cash;
    gems += cv.gems;
  }
  if (cash <= 0 && gems <= 0) return null;
  return { cash, gems };
}

export function spawnStormChallenge(forceKind = null) {
  const hasAir = ((gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0) || (gameState.heliTier || 0) >= 1;
  const hasYacht = (gameState.yachtTier || 0) >= 1;
  if (!hasAir && !hasYacht) return null;

  const kind = forceKind || (hasAir && (!hasYacht || Math.random() > 0.48) ? 'air' : 'sea');
  const branchMult = getActiveBranch().multiplier * getPrestigeMultiplier();

  if (kind === 'air') {
    const spots = [
      { x: -18, y: 15, z: 54, label: 'Tâm Bão Vịnh Tây (Không phận)' },
      { x: 46, y: 16, z: 72, label: 'Cứu Trợ Không Phận Hải Đảo' },
      { x: 18, y: 18, z: 92, label: 'Hành Lang Mây Cấp 8' }
    ];
    const s = spots[Math.floor(Math.random() * spots.length)];
    stormState.active = true;
    stormState.kind = 'air';
    stormState.timeLeft = 65;
    stormState.targetX = s.x;
    stormState.targetY = s.y;
    stormState.targetZ = s.z;
    stormState.targetLabel = s.label;
    stormState.rewardCash = Math.round(2800 * branchMult * getEngineYieldMult(gameState.planeEngineTier || 1));
    stormState.rewardGems = 28 + (gameState.airportTier || 1) * 6;
  } else {
    const spots = [
      { x: -32, y: 0.4, z: 68, label: 'Phao Cứu Hộ Bão Biển Tây' },
      { x: 24, y: 0.4, z: 86, label: 'Eo Biển Sóng Lớn Đảo Đông' },
      { x: -6, y: 0.4, z: 102, label: 'Tàu Hàng Gặp Nạn Ngoài Khơi' }
    ];
    const s = spots[Math.floor(Math.random() * spots.length)];
    stormState.active = true;
    stormState.kind = 'sea';
    stormState.timeLeft = 72;
    stormState.targetX = s.x;
    stormState.targetY = s.y;
    stormState.targetZ = s.z;
    stormState.targetLabel = s.label;
    stormState.rewardCash = Math.round(2200 * branchMult * getEngineYieldMult(gameState.yachtEngineTier || 1));
    stormState.rewardGems = 24 + (gameState.yachtTier || 1) * 5;
  }
  return stormState;
}

export function tickStormChallenge(dt) {
  if (stormState.active) {
    stormState.timeLeft -= dt;
    if (stormState.timeLeft <= 0) {
      stormState.active = false;
      stormState.cooldown = 36;
      return 'expired';
    }
    return null;
  }
  stormState.cooldown -= dt;
  if (stormState.cooldown <= 0) {
    const spawned = spawnStormChallenge();
    if (spawned) return 'spawned';
    stormState.cooldown = 20;
  }
  return null;
}

export function completeStormRescue() {
  if (!stormState.active) return null;
  const out = {
    kind: stormState.kind,
    label: stormState.targetLabel,
    rewardCash: stormState.rewardCash,
    rewardGems: stormState.rewardGems
  };
  gameState.cash += out.rewardCash;
  gameState.gems += out.rewardGems;
  recordRevenue('contracts', out.rewardCash);
  addVipXp(75);
  addSeasonXp(55);
  shiftSession.stormRescues += 1;
  if (!gameState.personalBests) {
    gameState.personalBests = { bestShiftCash: 0, bestCpm: 0, bestSingleDeal: 0, totalStormRescues: 0, completedShifts: 0 };
  }
  gameState.personalBests.totalStormRescues = (gameState.personalBests.totalStormRescues || 0) + 1;
  logTransaction('fleet', `Cứu trợ Bão: ${out.label}`, out.rewardCash, out.rewardGems);

  stormState.active = false;
  stormState.cooldown = 42;
  return out;
}

export function resetShiftSession(commitRecords = true) {
  const prevCash = shiftSession.cashEarned;
  if (commitRecords) {
    if (!gameState.personalBests) {
      gameState.personalBests = { bestShiftCash: 0, bestCpm: 0, bestSingleDeal: 0, totalStormRescues: 0, completedShifts: 0 };
    }
    if (prevCash > (gameState.personalBests.bestShiftCash || 0)) {
      gameState.personalBests.bestShiftCash = prevCash;
    }
    if (shiftSession.peakCpm > (gameState.personalBests.bestCpm || 0)) {
      gameState.personalBests.bestCpm = shiftSession.peakCpm;
    }
    if (prevCash > 0) {
      gameState.personalBests.completedShifts = (gameState.personalBests.completedShifts || 0) + 1;
    }
  }
  shiftSession.startedAt = Date.now();
  shiftSession.cashEarned = 0;
  shiftSession.logsCut = 0;
  shiftSession.contractsDone = 0;
  shiftSession.stormRescues = 0;
  shiftSession.peakCpm = 0;
  return prevCash;
}

export function hydrateLoadedState() {
  if (!gameState.revenueStats) {
    gameState.revenueStats = { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0, stocks: 0, resort: 0 };
  }
  if (typeof gameState.revenueStats.stocks !== 'number') gameState.revenueStats.stocks = 0;
  if (typeof gameState.revenueStats.resort !== 'number') gameState.revenueStats.resort = 0;
  if (!Array.isArray(gameState.claimedAchievements)) gameState.claimedAchievements = [];
  if (!gameState.managers) {
    gameState.managers = { mgr_forest: 0, mgr_sawmill: 0, mgr_harbor: 0, mgr_coldchain: 0 };
  }
  if (!Array.isArray(gameState.unlockedBadges)) gameState.unlockedBadges = [];
  if (typeof gameState.logisticsTier !== 'number') gameState.logisticsTier = 0;
  if (typeof gameState.autoLogisticsEnabled !== 'boolean') gameState.autoLogisticsEnabled = true;
  if (typeof gameState.yachtTier !== 'number') gameState.yachtTier = 0;
  if (typeof gameState.yachtAccumCash !== 'number') gameState.yachtAccumCash = 0;
  if (typeof gameState.yachtAccumGems !== 'number') gameState.yachtAccumGems = 0;
  if (typeof gameState.airportTier !== 'number') gameState.airportTier = 0;
  if (typeof gameState.islandStationTier !== 'number') gameState.islandStationTier = 0;
  if (typeof gameState.equippedPlane !== 'string') gameState.equippedPlane = 'bush_plane';
  if (!Array.isArray(gameState.unlockedPlanes)) gameState.unlockedPlanes = [];
  if (typeof gameState.autoSeaFleet !== 'number') gameState.autoSeaFleet = 0;
  if (typeof gameState.autoAirFleet !== 'number') gameState.autoAirFleet = 0;
  if (typeof gameState.treasuresCollected !== 'number') gameState.treasuresCollected = 0;
  if (typeof gameState.seaDeliveries !== 'number') gameState.seaDeliveries = 0;
  if (typeof gameState.airDeliveries !== 'number') gameState.airDeliveries = 0;
  if (typeof gameState.milestoneIndex !== 'number') gameState.milestoneIndex = 0;
  if (typeof gameState.totalAuctionsWon !== 'number') gameState.totalAuctionsWon = 0;

  // Phase 5 safe hydration
  if (typeof gameState.hqTier !== 'number') gameState.hqTier = 0;
  if (typeof gameState.pendingDividendCash !== 'number') gameState.pendingDividendCash = 0;
  if (typeof gameState.islandResortTier !== 'number') gameState.islandResortTier = 0;
  if (typeof gameState.resortAccumCash !== 'number') gameState.resortAccumCash = 0;
  if (typeof gameState.resortAccumGems !== 'number') gameState.resortAccumGems = 0;
  if (typeof gameState.yachtLivery !== 'string') gameState.yachtLivery = 'pearl_sky';
  if (typeof gameState.planeLivery !== 'string') gameState.planeLivery = 'pearl_sky';
  if (!Array.isArray(gameState.unlockedLiveries) || !gameState.unlockedLiveries.length) {
    gameState.unlockedLiveries = ['pearl_sky'];
  }
  if (typeof gameState.yachtEngineTier !== 'number') gameState.yachtEngineTier = 1;
  if (typeof gameState.planeEngineTier !== 'number') gameState.planeEngineTier = 1;
  if (!gameState.stockPortfolio || typeof gameState.stockPortfolio !== 'object') {
    gameState.stockPortfolio = {
      TMBR: { shares: 0, avgPrice: 0 },
      PORT: { shares: 0, avgPrice: 0 },
      AERO: { shares: 0, avgPrice: 0 },
      RESO: { shares: 0, avgPrice: 0 }
    };
  }
  for (const t of STOCK_TICKERS) {
    if (!gameState.stockPortfolio[t.symbol]) {
      gameState.stockPortfolio[t.symbol] = { shares: 0, avgPrice: 0 };
    }
  }
  if (!Array.isArray(gameState.transactionLog)) gameState.transactionLog = [];
  if (typeof gameState.unreadNotifications !== 'number') gameState.unreadNotifications = 0;
  if (!gameState.personalBests || typeof gameState.personalBests !== 'object') {
    gameState.personalBests = { bestShiftCash: 0, bestCpm: 0, bestSingleDeal: 0, totalStormRescues: 0, completedShifts: 0 };
  }

  // Phase 6 safe hydration
  if (typeof gameState.furniture !== 'number') gameState.furniture = 0;
  if (typeof gameState.furnitureMillTier !== 'number') gameState.furnitureMillTier = 0;
  if (typeof gameState.lighthouseTier !== 'number') gameState.lighthouseTier = 0;
  if (typeof gameState.totalFurnitureCrafted !== 'number') gameState.totalFurnitureCrafted = 0;
  if (!Array.isArray(gameState.unlockedFranchises)) gameState.unlockedFranchises = [];
  if (typeof gameState.franchiseAccumCash !== 'number') gameState.franchiseAccumCash = 0;
  if (gameState.activeLoan && typeof gameState.activeLoan.remaining !== 'number') gameState.activeLoan = null;
  if (typeof gameState.loansRepaidCount !== 'number') gameState.loansRepaidCount = 0;
  if (!gameState.realEstate || typeof gameState.realEstate !== 'object') {
    gameState.realEstate = { re_coldstorage: 0, re_office: 0, re_auction_hall: 0, re_bay_complex: 0 };
  }
  for (const prop of REAL_ESTATE_CATALOG) {
    if (typeof gameState.realEstate[prop.id] !== 'number') gameState.realEstate[prop.id] = 0;
  }
  if (typeof gameState.realEstateAccumCash !== 'number') gameState.realEstateAccumCash = 0;
  if (!gameState.allianceContract || typeof gameState.allianceContract !== 'object') {
    generateAllianceContract();
  }
  if (typeof gameState.allianceCompleted !== 'number') gameState.allianceCompleted = 0;
  if (typeof gameState.allianceReputation !== 'number') gameState.allianceReputation = 0;
  if (!gameState.exportBreakdown || typeof gameState.exportBreakdown !== 'object') {
    gameState.exportBreakdown = { planks: 0, pallets: 0, cannedFish: 0, furniture: 0, revPlanks: 0, revPallets: 0, revCanned: 0, revFurniture: 0 };
  }
  ['furniture', 'franchise', 'realestate', 'container', 'carbon', 'futures'].forEach((k) => {
    if (typeof gameState.revenueStats[k] !== 'number') gameState.revenueStats[k] = 0;
  });

  // Phase 7 safe hydration
  if (typeof gameState.deepPortTier !== 'number') gameState.deepPortTier = 0;
  if (gameState.activeContainerVoyage && typeof gameState.activeContainerVoyage.timeLeft !== 'number') {
    gameState.activeContainerVoyage = null;
  }
  if (typeof gameState.containerAccumCash !== 'number') gameState.containerAccumCash = 0;
  if (typeof gameState.containerVoyagesCompleted !== 'number') gameState.containerVoyagesCompleted = 0;
  if (typeof gameState.insuranceTier !== 'number') gameState.insuranceTier = 0;
  if (typeof gameState.insuranceSavedCash !== 'number') gameState.insuranceSavedCash = 0;
  if (!Array.isArray(gameState.activeFutures)) gameState.activeFutures = [];
  if (typeof gameState.futuresCompleted !== 'number') gameState.futuresCompleted = 0;
  if (typeof gameState.greenEnergyTier !== 'number') gameState.greenEnergyTier = 0;
  if (typeof gameState.carbonCredits !== 'number') gameState.carbonCredits = 0;
  if (typeof gameState.carbonSoldCash !== 'number') gameState.carbonSoldCash = 0;
  if (!Array.isArray(gameState.unlockedPatents)) gameState.unlockedPatents = [];
  if (!gameState.pnlLedger || typeof gameState.pnlLedger !== 'object') {
    gameState.pnlLedger = { grossRevenue: 0, loanRepaid: 0, upgradeSpend: 0, insuranceSaved: 0, greenSaved: 0 };
  }

  // Phase 8 safe hydration
  if (typeof gameState.railwayTier !== 'number') gameState.railwayTier = 0;
  if (typeof gameState.railwayAccumCash !== 'number') gameState.railwayAccumCash = 0;
  if (typeof gameState.trainTripsCompleted !== 'number') gameState.trainTripsCompleted = 0;
  if (typeof gameState.trainBoostTimer !== 'number') gameState.trainBoostTimer = 0;
  if (typeof gameState.heliTier !== 'number') gameState.heliTier = 0;
  if (typeof gameState.heliAccumCash !== 'number') gameState.heliAccumCash = 0;
  if (typeof gameState.heliAccumGems !== 'number') gameState.heliAccumGems = 0;
  if (typeof gameState.heliDeliveries !== 'number') gameState.heliDeliveries = 0;
  if (typeof gameState.heliLivery !== 'string') gameState.heliLivery = 'pearl_sky';
  if (typeof gameState.heliEngineTier !== 'number') gameState.heliEngineTier = 1;
  if (typeof gameState.autoDispatchContainer !== 'boolean') gameState.autoDispatchContainer = true;
  if (typeof gameState.worldTimeHours !== 'number' || Number.isNaN(gameState.worldTimeHours)) gameState.worldTimeHours = 10.5;
  if (typeof gameState.weatherMode !== 'string') gameState.weatherMode = 'auto';
  ['railway', 'heli'].forEach((k) => {
    if (typeof gameState.revenueStats[k] !== 'number') gameState.revenueStats[k] = 0;
  });
}

// ---------------------------------------------------------------------------
// Phase 6 Business Helpers: Furniture Mill, Lighthouse, Franchises, Bank, Real Estate, Expo & Alliance
// ---------------------------------------------------------------------------
export function getFurnitureMillNextTier() {
  const cur = gameState.furnitureMillTier || 0;
  return FURNITURE_MILL_TIERS.find((t) => t.tier === cur + 1) || null;
}

export function getLighthouseNextTier() {
  const cur = gameState.lighthouseTier || 0;
  return LIGHTHOUSE_TIERS.find((t) => t.tier === cur + 1) || null;
}

export function craftFurnitureBatch(manual = false) {
  const lv = gameState.furnitureMillTier || 0;
  if (lv <= 0) return { ok: false, reason: 'Hãy xây Nhà Máy Nội Thất Cấp 1 trước!' };
  const def = FURNITURE_MILL_TIERS.find((t) => t.tier === lv) || FURNITURE_MILL_TIERS[0];
  if (gameState.planks < def.reqPlanks || gameState.pallets < def.reqPallets) {
    return {
      ok: false,
      reason: `Cần ${def.reqPlanks} Ván${def.reqPallets > 0 ? ` và ${def.reqPallets} Pallet` : ''} trong kho.`
    };
  }
  gameState.planks -= def.reqPlanks;
  gameState.pallets -= def.reqPallets;
  gameState.furniture = (gameState.furniture || 0) + def.output;
  gameState.totalFurnitureCrafted = (gameState.totalFurnitureCrafted || 0) + def.output;
  addSeasonXp(manual ? 12 : 6);
  return { ok: true, produced: def.output };
}

export function getEmpireNetWorth() {
  let stockVal = 0;
  for (const t of STOCK_TICKERS) {
    const hold = gameState.stockPortfolio?.[t.symbol];
    const entry = stockMarketState.items[t.symbol];
    if (hold && entry) stockVal += hold.shares * entry.price;
  }
  let reVal = 0;
  for (const prop of REAL_ESTATE_CATALOG) {
    reVal += (gameState.realEstate?.[prop.id] || 0) * prop.netValue;
  }
  return Math.round(
    (gameState.cash || 0)
    + (gameState.gems || 0) * 120
    + stockVal
    + reVal
    + (gameState.yachtTier || 0) * 6500
    + (gameState.airportTier || 0) * 5500
    + (gameState.islandStationTier || 0) * 4800
    + (gameState.islandResortTier || 0) * 8200
    + (gameState.hqTier || 0) * 7800
    + (gameState.furnitureMillTier || 0) * 5200
    + (gameState.lighthouseTier || 0) * 4000
    + (gameState.unlockedFranchises?.length || 0) * 8500
    + (gameState.unlockedPlanes?.length || 0) * 4200
    + (gameState.logisticsTier || 0) * 3200
    + ((gameState.unlockedBranches?.length || 1) - 1) * 12000
    + (gameState.deepPortTier || 0) * 10500
    + (gameState.railwayTier || 0) * 9500
    + (gameState.heliTier || 0) * 11000
    + (gameState.greenEnergyTier || 0) * 7200
    + (gameState.insuranceTier || 0) * 5400
    + (gameState.unlockedPatents?.length || 0) * 6500
    + Math.round((gameState.carbonCredits || 0) * (carbonMarketState.price || 44))
  );
}

export function getBankCreditLimit() {
  const nw = getEmpireNetWorth();
  return Math.max(5000, Math.round(nw * 0.85));
}

export function takeBankLoan(packageId) {
  if (gameState.activeLoan && gameState.activeLoan.remaining > 0) {
    return { ok: false, reason: 'Đế chế đang có khoản vay chưa tất toán!' };
  }
  const pkg = BANK_LOAN_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return { ok: false, reason: 'Gói vay không hợp lệ.' };
  const nw = getEmpireNetWorth();
  if (nw < pkg.minNetWorth) {
    return { ok: false, reason: `Cần định giá Đế chế tối thiểu $${pkg.minNetWorth.toLocaleString()} để mở gói này.` };
  }
  const geDef = GREEN_ENERGY_TIERS.find((g) => g.tier === (gameState.greenEnergyTier || 0));
  const insDef = INSURANCE_TIERS.find((i) => i.tier === (gameState.insuranceTier || 0));
  const loanDiscount = (geDef ? geDef.loanDiscountPct : 0) + (insDef ? Math.round(insDef.discountFeePct * 0.35) : 0);
  const effRate = Math.max(3, Number((pkg.interestPct * (1 - Math.min(0.65, loanDiscount / 100))).toFixed(1)));
  const baseDue = Math.round(pkg.principal * (1 + pkg.interestPct / 100));
  const totalDue = Math.round(pkg.principal * (1 + effRate / 100));
  const savedInt = Math.max(0, baseDue - totalDue);
  if (savedInt > 0) {
    recordPnlExpense('greenSaved', savedInt);
  }
  gameState.activeLoan = {
    packageId: pkg.id,
    name: pkg.name,
    principal: pkg.principal,
    totalDue,
    remaining: totalDue,
    ratePct: effRate,
    autoDeductRate: pkg.autoDeductRate
  };
  gameState.cash += pkg.principal;
  logTransaction('bank', `Giải ngân ${pkg.name} (Lãi ${effRate}%)`, pkg.principal, 0);
  return { ok: true, pkg, totalDue, effRate, savedInt };
}

export function processLoanAutoDeduct(earnedCash) {
  const loan = gameState.activeLoan;
  if (!loan || loan.remaining <= 0 || earnedCash <= 0) return 0;
  const deduct = Math.min(loan.remaining, Math.max(1, Math.round(earnedCash * (loan.autoDeductRate || 0.15))), Math.floor(gameState.cash || 0));
  if (deduct <= 0) return 0;
  gameState.cash -= deduct;
  loan.remaining -= deduct;
  recordPnlExpense('loanRepaid', deduct);
  if (loan.remaining <= 0) {
    const paidName = loan.name;
    gameState.activeLoan = null;
    gameState.loansRepaidCount = (gameState.loansRepaidCount || 0) + 1;
    addVipXp(35);
    logTransaction('bank', `Hoàn tất trả góp ${paidName}`, 0, 0);
  }
  return deduct;
}

export function repayBankLoan() {
  const loan = gameState.activeLoan;
  if (!loan || loan.remaining <= 0) return { ok: false, reason: 'Hiện không có khoản vay nào.' };
  const payAmt = Math.ceil(loan.remaining);
  if (gameState.cash < payAmt) {
    return { ok: false, reason: `Cần đủ $${payAmt.toLocaleString()} để tất toán dứt điểm.` };
  }
  gameState.cash -= payAmt;
  recordPnlExpense('loanRepaid', payAmt);
  const paidName = loan.name;
  gameState.activeLoan = null;
  gameState.loansRepaidCount = (gameState.loansRepaidCount || 0) + 1;
  addVipXp(45);
  logTransaction('bank', `Tất toán ${paidName}`, -payAmt, 0);
  return { ok: true, paid: payAmt, name: paidName };
}

export function getRealEstateCost(prop) {
  const lv = gameState.realEstate?.[prop.id] || 0;
  if (lv >= 3) return null;
  return Math.round(prop.baseCost * Math.pow(prop.scale, lv));
}

export function buyOrUpgradeRealEstate(propId) {
  const prop = REAL_ESTATE_CATALOG.find((r) => r.id === propId);
  if (!prop) return { ok: false, reason: 'Dự án không tồn tại.' };
  const curLv = gameState.realEstate?.[propId] || 0;
  if (curLv >= 3) return { ok: false, reason: 'Đã đạt cấp tối đa 3/3.' };
  const cost = getRealEstateCost(prop);
  if (gameState.cash < cost) return { ok: false, reason: 'Chưa đủ tiền mặt đầu tư!' };
  gameState.cash -= cost;
  if (!gameState.realEstate) gameState.realEstate = {};
  gameState.realEstate[propId] = curLv + 1;
  addVipXp(45);
  logTransaction('bank', `Đầu tư ${prop.name} (Cấp ${curLv + 1})`, -cost, 0);
  return { ok: true, prop, level: curLv + 1, cost };
}

export function claimFranchiseYield() {
  const cash = Math.floor(gameState.franchiseAccumCash || 0);
  if (cash <= 0) return null;
  gameState.cash += cash;
  gameState.franchiseAccumCash = 0;
  recordRevenue('franchise', cash);
  addVipXp(16);
  logTransaction('export', 'Thu Bản Quyền Nhượng Quyền Toàn Cầu', cash, 0);
  return { cash };
}

export function claimRealEstateYield() {
  const cash = Math.floor(gameState.realEstateAccumCash || 0);
  if (cash <= 0) return null;
  gameState.cash += cash;
  gameState.realEstateAccumCash = 0;
  recordRevenue('realestate', cash);
  addVipXp(14);
  logTransaction('bank', 'Thu Lợi Tức Bất Động Sản Cảng', cash, 0);
  return { cash };
}

export function unlockGlobalFranchise(id) {
  const fr = GLOBAL_FRANCHISES.find((f) => f.id === id);
  if (!fr) return { ok: false, reason: 'Đại lý không hợp lệ.' };
  if (!Array.isArray(gameState.unlockedFranchises)) gameState.unlockedFranchises = [];
  if (gameState.unlockedFranchises.includes(id)) return { ok: false, reason: 'Đại lý đã hoạt động.' };
  if ((gameState.contractsCompleted || 0) < fr.reqContracts) {
    return { ok: false, reason: `Cần hoàn thành ${fr.reqContracts} Hợp đồng cảng trước.` };
  }
  if (gameState.cash < fr.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt khai trương!' };
  gameState.cash -= fr.costCash;
  gameState.unlockedFranchises.push(id);
  addVipXp(80);
  addSeasonXp(60);
  logTransaction('export', `Mở Đại Lý Nhượng Quyền ${fr.city}`, -fr.costCash, 0);
  return { ok: true, franchise: fr };
}

export function tickTradeExpo(dt) {
  if (expoState.current) {
    expoState.timeLeft -= dt;
    if (expoState.timeLeft <= 0) {
      expoState.current = null;
      expoState.cooldown = 25;
    }
  } else {
    expoState.cooldown -= dt;
    if (expoState.cooldown <= 0) {
      expoState.index = (expoState.index + 1) % TRADE_EXPOS.length;
      expoState.current = TRADE_EXPOS[expoState.index];
      expoState.timeLeft = expoState.current.duration;
      return expoState.current;
    }
  }
  return null;
}

export function generateAllianceContract() {
  const n = (gameState.allianceCompleted || 0) + 1;
  const partners = [
    { partner: 'EuroAsia Timber Guild', title: 'Liên Minh Gỗ & Nội Thất Á - Âu' },
    { partner: 'Nordic Maritime Consortium', title: 'Hợp Đồng Liên Minh Bắc Âu' },
    { partner: 'Pacific Luxury Trade Pact', title: 'Hiệp Định Xuất Khẩu Thái Bình Dương' },
    { partner: 'Emirates Royal Furnishings', title: 'Lô Hàng Nội Thất Hoàng Gia Dubai' }
  ];
  const pick = partners[n % partners.length];
  const mult = getActiveBranch().multiplier * getPrestigeMultiplier();
  gameState.allianceContract = {
    id: 'al_' + Date.now(),
    title: pick.title,
    partner: pick.partner,
    reqPlanks: 12 + n * 6,
    reqPallets: 2 + n,
    reqCanned: 2 + n,
    reqFurniture: 1 + Math.floor(n * 0.9),
    rewardCash: Math.round((4200 + n * 1850) * mult),
    rewardGems: 42 + n * 10,
    rewardRep: 100 + n * 35
  };
}

export function deliverAllianceContract() {
  const ac = gameState.allianceContract;
  if (!ac) return { ok: false, reason: 'Chưa có Hợp đồng Liên minh khả dụng.' };
  if (
    gameState.planks < ac.reqPlanks
    || gameState.pallets < ac.reqPallets
    || gameState.cannedFish < ac.reqCanned
    || (gameState.furniture || 0) < ac.reqFurniture
  ) {
    return { ok: false, reason: 'Kho chưa đủ Ván, Pallet, Cá hộp và Nội thất cho Hợp đồng Liên minh!' };
  }
  gameState.planks -= ac.reqPlanks;
  gameState.pallets -= ac.reqPallets;
  gameState.cannedFish -= ac.reqCanned;
  gameState.furniture -= ac.reqFurniture;

  const cashGain = Math.round(ac.rewardCash * getContractMultiplier());
  gameState.cash += cashGain;
  gameState.gems += ac.rewardGems;
  gameState.allianceCompleted = (gameState.allianceCompleted || 0) + 1;
  gameState.allianceReputation = (gameState.allianceReputation || 0) + ac.rewardRep;
  const totalQty = ac.reqPlanks + ac.reqPallets + ac.reqCanned + ac.reqFurniture;
  gameState.totalExported = (gameState.totalExported || 0) + totalQty;

  recordExportItem('planks', ac.reqPlanks, Math.round(cashGain * 0.25));
  recordExportItem('pallets', ac.reqPallets, Math.round(cashGain * 0.2));
  recordExportItem('cannedFish', ac.reqCanned, Math.round(cashGain * 0.15));
  recordExportItem('furniture', ac.reqFurniture, Math.round(cashGain * 0.4));

  recordRevenue('contracts', cashGain);
  addVipXp(90);
  addSeasonXp(80);
  logTransaction('export', `Hoàn tất ${ac.title}`, cashGain, ac.rewardGems);

  const completedTitle = ac.title;
  const gemsGain = ac.rewardGems;
  const repGain = ac.rewardRep;
  generateAllianceContract();
  return { ok: true, title: completedTitle, cash: cashGain, gems: gemsGain, rep: repGain };
}

export function recordExportItem(itemKey, qty, cashVal = 0) {
  if (!qty || qty <= 0) return;
  if (!gameState.exportBreakdown) {
    gameState.exportBreakdown = { planks: 0, pallets: 0, cannedFish: 0, furniture: 0, revPlanks: 0, revPallets: 0, revCanned: 0, revFurniture: 0 };
  }
  const eb = gameState.exportBreakdown;
  if (itemKey === 'planks') {
    eb.planks = (eb.planks || 0) + qty;
    eb.revPlanks = (eb.revPlanks || 0) + cashVal;
  } else if (itemKey === 'pallets') {
    eb.pallets = (eb.pallets || 0) + qty;
    eb.revPallets = (eb.revPallets || 0) + cashVal;
  } else if (itemKey === 'cannedFish') {
    eb.cannedFish = (eb.cannedFish || 0) + qty;
    eb.revCanned = (eb.revCanned || 0) + cashVal;
  } else if (itemKey === 'furniture') {
    eb.furniture = (eb.furniture || 0) + qty;
    eb.revFurniture = (eb.revFurniture || 0) + cashVal;
  }
}

export function loadGameLocal() {
  try {
    const raw = localStorage.getItem('timberport_save_v2');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const prevUpdatedAt = parsed.updatedAt || null;
      Object.assign(gameState, parsed);
      hydrateLoadedState();
      return prevUpdatedAt;
    }
  } catch (e) {}
  return null;
}

export async function authRequest(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/api/empires/leaderboard`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.empires) ? data.empires : [];
  } catch (e) {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Phase 7: Deep-Water Container Port, Futures, Insurance, Green Carbon, R&D Patents, P&L & ROI
// ---------------------------------------------------------------------------
export function getDeepPortNextTier() {
  const cur = gameState.deepPortTier || 0;
  return DEEP_PORT_TIERS.find((d) => d.tier === cur + 1) || null;
}

export function upgradeDeepPort() {
  const next = getDeepPortNextTier();
  if (!next) return { ok: false, reason: 'Cảng Nước Sâu đã đạt Cấp 3/3 tối đa.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt xây dựng Cảng Nước Sâu!' };
  gameState.cash -= next.costCash;
  gameState.deepPortTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(75);
  addSeasonXp(50);
  logTransaction('fleet', `Khánh thành ${next.name} (Cấp ${next.tier})`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function dispatchContainerVoyage(routeId) {
  const portLv = gameState.deepPortTier || 0;
  if (portLv <= 0) return { ok: false, reason: 'Cần xây Bến Container Nước Sâu Cấp 1 trước!' };
  if (gameState.activeContainerVoyage) return { ok: false, reason: 'Tàu Container đang thực hiện hải trình!' };
  const rt = CONTAINER_ROUTES.find((r) => r.id === routeId);
  if (!rt) return { ok: false, reason: 'Tuyến vận tải không tồn tại.' };
  if (
    gameState.planks < rt.reqPlanks
    || gameState.pallets < rt.reqPallets
    || gameState.cannedFish < rt.reqCanned
    || (gameState.furniture || 0) < rt.reqFurniture
  ) {
    return { ok: false, reason: 'Kho hàng chưa đủ số lượng đóng container cho tuyến này!' };
  }
  gameState.planks -= rt.reqPlanks;
  gameState.pallets -= rt.reqPallets;
  gameState.cannedFish -= rt.reqCanned;
  gameState.furniture = (gameState.furniture || 0) - rt.reqFurniture;

  const portDef = DEEP_PORT_TIERS.find((d) => d.tier === portLv) || DEEP_PORT_TIERS[0];
  const patMult = hasPatent('pat_container') ? 1.3 : 1.0;
  const cashEst = Math.round(rt.rewardCash * portDef.voyageMult * patMult * getContractMultiplier());
  const qty = rt.reqPlanks + rt.reqPallets + rt.reqCanned + rt.reqFurniture;
  gameState.totalExported = (gameState.totalExported || 0) + qty;
  advanceDailyQuest('goodsExported', qty);

  gameState.activeContainerVoyage = {
    routeId: rt.id,
    name: rt.name,
    totalSec: rt.durationSec,
    timeLeft: rt.durationSec,
    rewardCash: cashEst,
    rewardGems: rt.rewardGems,
    rewardVipXp: rt.rewardVipXp
  };
  logTransaction('export', `Xuất bến Tàu Container: ${rt.name}`, 0, 0);
  return { ok: true, voyage: gameState.activeContainerVoyage };
}

export function tickContainerVoyage(dt) {
  const v = gameState.activeContainerVoyage;
  if (!v) return null;
  v.timeLeft -= dt;
  if (v.timeLeft <= 0) {
    gameState.cash += v.rewardCash;
    gameState.gems += v.rewardGems;
    gameState.containerVoyagesCompleted = (gameState.containerVoyagesCompleted || 0) + 1;
    recordRevenue('container', v.rewardCash);
    addVipXp(v.rewardVipXp || 45);
    addSeasonXp(45);
    logTransaction('export', `Tàu Container cập cảng đích: ${v.name}`, v.rewardCash, v.rewardGems);
    const done = { ...v };
    gameState.activeContainerVoyage = null;
    return done;
  }
  return null;
}

export function claimContainerYield() {
  const cash = Math.floor(gameState.containerAccumCash || 0);
  if (cash <= 0) return null;
  gameState.cash += cash;
  gameState.containerAccumCash = 0;
  recordRevenue('container', cash);
  addVipXp(16);
  logTransaction('export', 'Thu Phí Bốc Dỡ Cảng Container', cash, 0);
  return { cash };
}

export function getInsuranceNextTier() {
  const cur = gameState.insuranceTier || 0;
  return INSURANCE_TIERS.find((i) => i.tier === cur + 1) || null;
}

export function upgradeInsurance() {
  const next = getInsuranceNextTier();
  if (!next) return { ok: false, reason: 'Bảo hiểm Hàng hải đã đạt cấp tối đa 3/3.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt mua gói Bảo hiểm!' };
  gameState.cash -= next.costCash;
  gameState.insuranceTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(45);
  logTransaction('bank', `Kích hoạt ${next.name}`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function signFuturesContract(tplId) {
  if (!Array.isArray(gameState.activeFutures)) gameState.activeFutures = [];
  if (gameState.activeFutures.length >= 2) {
    return { ok: false, reason: 'Tối đa 2 Hợp đồng Tương lai chạy song song!' };
  }
  const tpl = FUTURES_TEMPLATES.find((f) => f.id === tplId);
  if (!tpl) return { ok: false, reason: 'Mẫu hợp đồng không hợp lệ.' };
  const patMult = hasPatent('pat_fin_hedge') ? 1.18 : 1.0;
  const lockedCash = Math.round(tpl.qty * tpl.basePrice * tpl.lockedMult * patMult * getRevenueMultiplier());
  const contract = {
    uid: 'fut_' + Date.now() + '_' + Math.floor(Math.random() * 999),
    tplId: tpl.id,
    name: tpl.name,
    itemKey: tpl.itemKey,
    itemLabel: tpl.itemLabel,
    qty: tpl.qty,
    totalSec: tpl.durationSec,
    timeLeft: tpl.durationSec,
    lockedCash,
    rewardGems: tpl.rewardGems
  };
  gameState.activeFutures.push(contract);
  logTransaction('stocks', `Ký ${tpl.name} (Chốt $${lockedCash.toLocaleString()})`, 0, 0);
  return { ok: true, contract };
}

export function settleFuturesContract(uid, autoTrigger = false) {
  if (!Array.isArray(gameState.activeFutures)) gameState.activeFutures = [];
  const idx = gameState.activeFutures.findIndex((f) => f.uid === uid);
  if (idx === -1) return { ok: false, reason: 'Không tìm thấy hợp đồng tương lai.' };
  const fut = gameState.activeFutures[idx];
  const stock = Math.floor(gameState[fut.itemKey] || 0);
  if (stock < fut.qty) {
    if (!autoTrigger) {
      return { ok: false, reason: `Cần đủ ${fut.qty} ${fut.itemLabel} trong kho để giao tất toán.` };
    }
    // At maturity if short on goods, check Maritime Insurance mitigation or partial penalty
    const insDef = INSURANCE_TIERS.find((i) => i.tier === (gameState.insuranceTier || 0));
    if (insDef) {
      const rebate = Math.round(fut.lockedCash * (insDef.protectionPct / 100) * 0.25);
      gameState.cash += rebate;
      gameState.insuranceSavedCash = (gameState.insuranceSavedCash || 0) + rebate;
      recordPnlExpense('insuranceSaved', rebate);
      logTransaction('bank', `Bảo hiểm bồi hoàn ${fut.name}`, rebate, 0);
      gameState.activeFutures.splice(idx, 1);
      return { ok: false, expiredInsured: true, rebate, name: fut.name };
    }
    gameState.activeFutures.splice(idx, 1);
    return { ok: false, expired: true, name: fut.name };
  }

  gameState[fut.itemKey] -= fut.qty;
  gameState.cash += fut.lockedCash;
  gameState.gems += fut.rewardGems;
  gameState.totalExported = (gameState.totalExported || 0) + fut.qty;
  gameState.futuresCompleted = (gameState.futuresCompleted || 0) + 1;
  recordRevenue('futures', fut.lockedCash);
  recordExportItem(fut.itemKey, fut.qty, fut.lockedCash);
  addVipXp(38);
  addSeasonXp(30);
  logTransaction('stocks', `Tất toán ${fut.name}`, fut.lockedCash, fut.rewardGems);
  gameState.activeFutures.splice(idx, 1);
  return { ok: true, cash: fut.lockedCash, gems: fut.rewardGems, name: fut.name };
}

export function tickFuturesContracts(dt) {
  if (!Array.isArray(gameState.activeFutures) || gameState.activeFutures.length === 0) return [];
  const events = [];
  for (let i = gameState.activeFutures.length - 1; i >= 0; i--) {
    const f = gameState.activeFutures[i];
    f.timeLeft -= dt;
    if (f.timeLeft <= 0) {
      const res = settleFuturesContract(f.uid, true);
      events.push(res);
    }
  }
  return events;
}

export function getGreenEnergyNextTier() {
  const cur = gameState.greenEnergyTier || 0;
  return GREEN_ENERGY_TIERS.find((g) => g.tier === cur + 1) || null;
}

export function upgradeGreenEnergy() {
  const next = getGreenEnergyNextTier();
  if (!next) return { ok: false, reason: 'Lưới Năng lượng Xanh đã đạt Cấp 3/3 tối đa.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt đầu tư Năng lượng Xanh!' };
  gameState.cash -= next.costCash;
  gameState.greenEnergyTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(65);
  addSeasonXp(45);
  logTransaction('fleet', `Triển khai ${next.name} (Cấp ${next.tier})`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function updateCarbonMarket() {
  const prev = carbonMarketState.price;
  const pull = (46 - prev) * 0.22;
  const shock = (Math.random() - 0.47) * 8.5;
  const next = Math.max(26, Math.min(78, Math.round(prev + pull + shock)));
  carbonMarketState.prevPrice = prev;
  carbonMarketState.price = next;
  carbonMarketState.history.push(next);
  if (carbonMarketState.history.length > 14) carbonMarketState.history.shift();
  carbonMarketState.lastUpdateMs = Date.now();
  return next;
}

export function sellCarbonCredits(fraction = 1) {
  const total = Math.floor(gameState.carbonCredits || 0);
  if (total <= 0) return { ok: false, reason: 'Chưa có Tín chỉ Carbon khả dụng để giao dịch!' };
  const qty = Math.max(1, Math.floor(total * fraction));
  const unitPrice = Math.round(carbonMarketState.price * getPrestigeMultiplier());
  const cashGain = qty * unitPrice;
  gameState.carbonCredits -= qty;
  gameState.cash += cashGain;
  gameState.carbonSoldCash = (gameState.carbonSoldCash || 0) + cashGain;
  recordRevenue('carbon', cashGain);
  addVipXp(Math.min(45, Math.max(10, Math.floor(qty * 0.8))));
  logTransaction('stocks', `Bán ${qty} Tín chỉ Carbon (@ $${unitPrice})`, cashGain, 0);
  return { ok: true, qty, unitPrice, cash: cashGain };
}

export function unlockPatent(id) {
  const pat = RD_TECH_CATALOG.find((p) => p.id === id);
  if (!pat) return { ok: false, reason: 'Bằng sáng chế không tồn tại.' };
  if (!Array.isArray(gameState.unlockedPatents)) gameState.unlockedPatents = [];
  if (gameState.unlockedPatents.includes(id)) return { ok: false, reason: 'Đã nghiên cứu xong bằng sáng chế này.' };
  if (pat.costType === 'cash') {
    if (gameState.cash < pat.cost) return { ok: false, reason: 'Chưa đủ tiền mặt tài trợ R&D!' };
    gameState.cash -= pat.cost;
    recordPnlExpense('upgradeSpend', pat.cost);
  } else {
    if (gameState.gems < pat.cost) return { ok: false, reason: 'Chưa đủ Đá quý tài trợ R&D!' };
    gameState.gems -= pat.cost;
  }
  gameState.unlockedPatents.push(id);
  addVipXp(55);
  addSeasonXp(40);
  logTransaction('fleet', `Cấp Bằng sáng chế: ${pat.name}`, pat.costType === 'cash' ? -pat.cost : 0, pat.costType === 'gems' ? -pat.cost : 0);
  return { ok: true, patent: pat };
}

export function getCorporateCreditRating() {
  const nw = getEmpireNetWorth();
  const patentsCount = (gameState.unlockedPatents || []).length;
  const greenLv = gameState.greenEnergyTier || 0;
  const insLv = gameState.insuranceTier || 0;
  const loansPaid = gameState.loansRepaidCount || 0;
  const hasDebt = Boolean(gameState.activeLoan && gameState.activeLoan.remaining > 0);
  const rawScore = Math.min(100, Math.round(
    Math.min(35, nw / 4500)
    + patentsCount * 5
    + greenLv * 8
    + insLv * 7
    + Math.min(12, loansPaid * 4)
    + (gameState.deepPortTier || 0) * 5
    - (hasDebt ? 6 : 0)
  ));
  const rating = rawScore >= 85 ? 'AAA' : rawScore >= 68 ? 'AA' : rawScore >= 50 ? 'A' : rawScore >= 32 ? 'BBB' : 'B';
  const esgScore = Math.min(100, greenLv * 24 + (hasPatent('pat_green_grid') ? 16 : 0) + (hasPatent('pat_eco_resin') ? 12 : 0) + insLv * 4);
  const esgGrade = esgScore >= 80 ? 'A+' : esgScore >= 55 ? 'A' : esgScore >= 30 ? 'B' : 'C';
  return { rating, score: rawScore, esgGrade, esgScore, patentsCount, netWorth: nw };
}

export function getPnlStatement() {
  const stats = gameState.revenueStats || {};
  const ledger = gameState.pnlLedger || { grossRevenue: 0, loanRepaid: 0, upgradeSpend: 0, insuranceSaved: 0, greenSaved: 0 };
  const opRevenue = (stats.sawmill || 0) + (stats.furniture || 0) + (stats.contracts || 0) + (stats.container || 0) + (stats.fishery || 0) + (stats.railway || 0);
  const marketRevenue = (stats.market || 0) + (stats.futures || 0) + (stats.carbon || 0);
  const assetRevenue = (stats.franchise || 0) + (stats.realestate || 0) + (stats.resort || 0) + (stats.stocks || 0) + (stats.offline || 0) + (stats.heli || 0) + (stats.tourism || 0);
  const gross = Math.max(opRevenue + marketRevenue + assetRevenue, ledger.grossRevenue || 0);
  const loanCost = ledger.loanRepaid || 0;
  const capex = ledger.upgradeSpend || 0;
  const savings = (ledger.insuranceSaved || 0) + (ledger.greenSaved || 0) + (gameState.insuranceSavedCash || 0);
  const netOperatingProfit = gross - loanCost + savings;
  const marginPct = gross > 0 ? Math.max(0, Math.min(99.9, Number(((netOperatingProfit / gross) * 100).toFixed(1)))) : 0;
  return {
    opRevenue,
    marketRevenue,
    assetRevenue,
    gross,
    loanCost,
    capex,
    savings,
    netOperatingProfit,
    marginPct
  };
}

export function getRoiRecommendations() {
  const mult = getRevenueMultiplier();
  const list = [];

  const nextCivic = getCivicNextTier();
  if (nextCivic) {
    const addedCpm = Math.round(nextCivic.taxPer10s * 6 * getPrestigeMultiplier() + 165 * mult);
    list.push({ id: 'civic', name: nextCivic.name, category: 'Hạ Tầng Dân Cư & Du Lịch', cost: nextCivic.costCash, addedCpm, paybackMin: Number((nextCivic.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextRail = getRailwayNextTier();
  if (nextRail) {
    const addedCpm = Math.round(nextRail.cashPer10s * 6 * getPrestigeMultiplier() + 240 * mult);
    list.push({ id: 'railway', name: nextRail.name, category: 'Đường Sắt Công Nghiệp', cost: nextRail.costCash, addedCpm, paybackMin: Number((nextRail.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextHeli = getHeliNextTier();
  if (nextHeli) {
    const addedCpm = Math.round(nextHeli.cashPer10s * 6 * getPrestigeMultiplier() + 190 * mult);
    list.push({ id: 'heli', name: nextHeli.name, category: 'Trực Thăng VIP', cost: nextHeli.costCash, addedCpm, paybackMin: Number((nextHeli.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextDeep = getDeepPortNextTier();
  if (nextDeep) {
    const addedCpm = Math.round(nextDeep.royalty10s * 6 * getPrestigeMultiplier() + 260 * mult);
    list.push({ id: 'deep_port', name: nextDeep.name, category: 'Cảng Nước Sâu', cost: nextDeep.costCash, addedCpm, paybackMin: Number((nextDeep.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextHq = getHqNextTier();
  if (nextHq) {
    const addedCpm = Math.round((nextHq.dividend45s * (60 / 45)) * getPrestigeMultiplier() + 180 * mult);
    list.push({ id: 'hq', name: nextHq.name, category: 'Trụ sở Tập đoàn', cost: nextHq.costCash, addedCpm, paybackMin: Number((nextHq.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextGreen = getGreenEnergyNextTier();
  if (nextGreen) {
    const addedCpm = Math.round(nextGreen.creditsPer10s * 6 * (carbonMarketState.price || 44));
    list.push({ id: 'green', name: nextGreen.name, category: 'Năng lượng Xanh', cost: nextGreen.costCash, addedCpm, paybackMin: Number((nextGreen.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  const nextYacht = getYachtNextTier();
  if (nextYacht) {
    const addedCpm = Math.round(nextYacht.cashPer10s * 6 * getPrestigeMultiplier());
    list.push({ id: 'yacht', name: nextYacht.name, category: 'Du thuyền VIP', cost: nextYacht.costCash, addedCpm, paybackMin: Number((nextYacht.costCash / Math.max(1, addedCpm)).toFixed(1)) });
  }
  for (const item of UPGRADE_CATALOG.filter((u) => ['sawSpeedTier', 'plankValueTier', 'autoForklifts', 'fishingBoats'].includes(u.id))) {
    const cost = getUpgradeCost(item);
    if (cost !== null) {
      const addedCpm = item.id === 'autoForklifts' ? Math.round(180 * mult) : item.id === 'fishingBoats' ? Math.round(95 * mult) : Math.round(135 * mult);
      list.push({ id: `up_${item.id}`, itemId: item.id, name: `${item.name} (Cấp ${(gameState[item.id] || 0) + 1})`, category: 'Xưởng & Nhân sự', cost, addedCpm, paybackMin: Number((cost / Math.max(1, addedCpm)).toFixed(1)) });
    }
  }
  for (const prop of REAL_ESTATE_CATALOG) {
    const cost = getRealEstateCost(prop);
    if (cost !== null) {
      const addedCpm = Math.round(prop.cashPer10s * 6 * getPrestigeMultiplier());
      list.push({ id: `re_${prop.id}`, propId: prop.id, name: prop.name, category: 'Bất động sản', cost, addedCpm, paybackMin: Number((cost / Math.max(1, addedCpm)).toFixed(1)) });
    }
  }
  return list;
}

export function quickBatchSawAndPallet() {
  let processedLogs = 0;
  let sawnPlanks = 0;
  if (gameState.logs > 0) {
    processedLogs = gameState.logs;
    gameState.sawmillBuffer += processedLogs;
    gameState.logs = 0;
  }
  if (gameState.sawmillBuffer > 0) {
    const logsToSaw = Math.min(gameState.sawmillBuffer, 12);
    const yieldPerLog = Math.max(1, gameState.sawSpeedTier || 1);
    sawnPlanks = logsToSaw * yieldPerLog;
    gameState.sawmillBuffer -= logsToSaw;
    gameState.planks += sawnPlanks;
    gameState.totalPlanksSawn = (gameState.totalPlanksSawn || 0) + sawnPlanks;
    advanceDailyQuest('planksSawn', sawnPlanks);
  }
  let packedPallets = 0;
  while (gameState.planks >= 8 && packedPallets < 3) {
    gameState.planks -= 4;
    gameState.pallets += 1;
    packedPallets += 1;
  }
  if (processedLogs === 0 && sawnPlanks === 0 && packedPallets === 0) {
    return { ok: false, reason: 'Chưa có gỗ trong Balo/Phễu hoặc đủ ván để đóng Pallet!' };
  }
  addSeasonXp(8);
  return { ok: true, processedLogs, sawnPlanks, packedPallets };
}

export function quickBatchFurniture() {
  const res = craftFurnitureBatch(true);
  return res;
}

// ---------------------------------------------------------------------------
// Phase 8 Helpers: Industrial Railway, VIP Helicopter, Auto Container & Metropolis
// ---------------------------------------------------------------------------
export function getRailwayNextTier() {
  const cur = gameState.railwayTier || 0;
  return RAILWAY_TIERS.find((r) => r.tier === cur + 1) || null;
}

export function upgradeRailway() {
  const next = getRailwayNextTier();
  if (!next) return { ok: false, reason: 'Tuyến Đường Sắt Công Nghiệp đã đạt Cấp 3/3 tối đa.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt xây dựng Tuyến Đường Sắt!' };
  gameState.cash -= next.costCash;
  gameState.railwayTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(70);
  addSeasonXp(50);
  logTransaction('fleet', `Khánh thành ${next.name} (Cấp ${next.tier})`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function claimRailwayYield() {
  const cash = Math.floor(gameState.railwayAccumCash || 0);
  if (cash <= 0) return null;
  gameState.cash += cash;
  gameState.railwayAccumCash = 0;
  recordRevenue('railway', cash);
  addVipXp(16);
  logTransaction('export', 'Thu Cước Vận Tải Đường Sắt Công Nghiệp', cash, 0);
  return { cash };
}

export function triggerTrainExpressBoost() {
  if ((gameState.railwayTier || 0) <= 0) {
    return { ok: false, reason: 'Hãy xây Tuyến Đường Sắt Nội Khu Cấp 1 trước!' };
  }
  if ((gameState.trainBoostTimer || 0) > 0) {
    return { ok: false, reason: `Tàu Hỏa đang tăng tốc Express (${Math.ceil(gameState.trainBoostTimer)}s)!` };
  }
  gameState.trainBoostTimer = 25;
  let hauledLogs = 0;
  if (gameState.logs > 0) {
    hauledLogs = gameState.logs;
    gameState.sawmillBuffer += hauledLogs;
    gameState.logs = 0;
  }
  const railDef = RAILWAY_TIERS.find((r) => r.tier === (gameState.railwayTier || 1)) || RAILWAY_TIERS[0];
  const bonusCash = Math.round(railDef.cashPer10s * 1.45 * getPrestigeMultiplier());
  gameState.cash += bonusCash;
  gameState.trainTripsCompleted = (gameState.trainTripsCompleted || 0) + 1;
  recordRevenue('railway', bonusCash);
  addSeasonXp(12);
  return { ok: true, bonusCash, hauledLogs };
}

export function getHeliNextTier() {
  const cur = gameState.heliTier || 0;
  return HELI_TIERS.find((h) => h.tier === cur + 1) || null;
}

export function getHeliData() {
  const lv = Math.max(1, gameState.heliTier || 1);
  return HELI_TIERS.find((h) => h.tier === lv) || HELI_TIERS[0];
}

export function getHeliEngineCost(lv = gameState.heliEngineTier || 1) {
  if (lv >= ENGINE_MAX_TIER) return null;
  return Math.round(3900 * Math.pow(2.2, Math.max(0, lv - 1)));
}

export function upgradeHeli() {
  const next = getHeliNextTier();
  if (!next) return { ok: false, reason: 'Bãi Đáp & Trực Thăng VIP đã đạt Cấp 3/3 tối đa.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt nâng cấp Trực Thăng VIP!' };
  gameState.cash -= next.costCash;
  gameState.heliTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(75);
  addSeasonXp(55);
  logTransaction('fleet', `Biên chế ${next.name} (Cấp ${next.tier})`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function claimHeliYield() {
  const cash = Math.floor(gameState.heliAccumCash || 0);
  const gems = Math.floor(gameState.heliAccumGems || 0);
  if (cash <= 0 && gems <= 0) return null;
  gameState.cash += cash;
  gameState.gems += gems;
  gameState.heliAccumCash = 0;
  gameState.heliAccumGems = 0;
  if (cash > 0) recordRevenue('heli', cash);
  addVipXp(18);
  logTransaction('income', 'Thu Quỹ Chuyên Cơ Trực Thăng VIP', cash, gems);
  return { cash, gems };
}

export function autoTryDispatchContainerVoyage() {
  if (!gameState.autoDispatchContainer) return null;
  if ((gameState.deepPortTier || 0) <= 0 || gameState.activeContainerVoyage) return null;
  // Pick highest reward route that we have enough stock for
  for (let i = CONTAINER_ROUTES.length - 1; i >= 0; i--) {
    const rt = CONTAINER_ROUTES[i];
    if (
      gameState.planks >= rt.reqPlanks
      && gameState.pallets >= rt.reqPallets
      && gameState.cannedFish >= rt.reqCanned
      && (gameState.furniture || 0) >= rt.reqFurniture
    ) {
      const res = dispatchContainerVoyage(rt.id);
      if (res.ok) return res.voyage;
    }
  }
  return null;
}

export async function fetchMetropolisState() {
  try {
    const res = await fetch(`${API_BASE}/api/city-state`);
    if (!res.ok) return metropolisState;
    const data = await res.json();
    if (data && (data.data || data.city)) {
      syncMetropolisFromServer(data.data || data.city);
    }
  } catch (e) {}
  return metropolisState;
}

// ---------------------------------------------------------------------------
// Phase 9: Living Island AI Citizens, Population, Happiness & Tourism Tax
// ---------------------------------------------------------------------------
export function getCivicNextTier() {
  const cur = gameState.civicTier || 0;
  return CIVIC_AMENITY_TIERS.find((c) => c.tier === cur + 1) || null;
}

export function getIslandPopulation() {
  const base = 36;
  const civicBonus = (gameState.civicTier || 0) * 28;
  const hqBonus = (gameState.hqTier || 0) * 18;
  const resortBonus = (gameState.islandResortTier || 0) * 24;
  const railBonus = (gameState.railwayTier || 0) * 15;
  const heliBonus = (gameState.heliTier || 0) * 12;
  const airportBonus = (gameState.airportTier || 0) * 16;
  const deepPortBonus = (gameState.deepPortTier || 0) * 20;
  const millBonus = (gameState.furnitureMillTier || 0) * 12;
  const workforceBonus = ((gameState.lumberjacks || 0) + (gameState.autoForklifts || 0) + (gameState.fishingBoats || 0)) * 4;
  const levelBonus = Math.max(0, (gameState.level || 1) - 1) * 6;
  return base + civicBonus + hqBonus + resortBonus + railBonus + heliBonus + airportBonus + deepPortBonus + millBonus + workforceBonus + levelBonus;
}

export function getCitizenHappiness() {
  let score = 74;
  const civicDef = CIVIC_AMENITY_TIERS.find((c) => c.tier === (gameState.civicTier || 0));
  if (civicDef) score += civicDef.happinessBonus;
  score += (gameState.islandResortTier || 0) * 4;
  score += (gameState.greenEnergyTier || 0) * 4;
  score += (gameState.hqTier || 0) * 3;
  score += (gameState.railwayTier || 0) * 2;
  score += (gameState.lighthouseTier || 0) * 2;
  if (stormState.active || gameState.weatherMode === 'storm') {
    score -= (gameState.insuranceTier || 0) >= 2 ? 3 : 7;
  }
  return Math.max(60, Math.min(100, Math.round(score)));
}

export function getCivicTaxPer10s() {
  const civicDef = CIVIC_AMENITY_TIERS.find((c) => c.tier === (gameState.civicTier || 0));
  const baseTax = civicDef ? civicDef.taxPer10s : 95;
  const popBonus = Math.round(getIslandPopulation() * 2.2);
  const happyMult = getCitizenHappiness() / 85;
  return Math.round((baseTax + popBonus) * happyMult * getPrestigeMultiplier());
}

export function getActiveCitizenCount(profile = 'high') {
  const civicDef = CIVIC_AMENITY_TIERS.find((c) => c.tier === (gameState.civicTier || 0));
  const extra = civicDef ? civicDef.extraCitizens : 0;
  const infraExtra = Math.min(6, (gameState.hqTier || 0) + (gameState.islandResortTier || 0) + (gameState.railwayTier || 0) + (gameState.airportTier || 0));
  const raw = 10 + extra + infraExtra;
  if (profile === 'low') return Math.min(10, raw);
  if (profile === 'balanced') return Math.min(16, raw);
  return Math.min(24, raw);
}

export function upgradeCivicAmenity() {
  const next = getCivicNextTier();
  if (!next) return { ok: false, reason: 'Hạ tầng Phố Đi Bộ & Dân Cư Đảo đã đạt Cấp 3/3 tối đa.' };
  if (gameState.cash < next.costCash) return { ok: false, reason: 'Chưa đủ tiền mặt nâng cấp Hạ tầng Dân cư & Du lịch!' };
  gameState.cash -= next.costCash;
  gameState.civicTier = next.tier;
  recordPnlExpense('upgradeSpend', next.costCash);
  addVipXp(65);
  addSeasonXp(45);
  logTransaction('fleet', `Khánh thành ${next.name} (Cấp ${next.tier})`, -next.costCash, 0);
  return { ok: true, tierDef: next };
}

export function claimCivicYield() {
  const cash = Math.floor(gameState.civicAccumCash || 0);
  const gems = Math.floor(gameState.civicAccumGems || 0);
  if (cash <= 0 && gems <= 0) return null;
  gameState.cash += cash;
  gameState.gems += gems;
  gameState.civicAccumCash = 0;
  gameState.civicAccumGems = 0;
  gameState.civicTaxCollected = (gameState.civicTaxCollected || 0) + cash;
  if (cash > 0) recordRevenue('tourism', cash);
  addVipXp(16);
  logTransaction('income', 'Thu Quỹ Thuế Du Lịch & Dịch Vụ Dân Cư Đảo', cash, gems);
  return { cash, gems };
}



