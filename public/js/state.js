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
  { key: 'cannedFish', name: 'Cá Hộp Xuất Khẩu', unit: 'hộp', basePrice: 75, color: '#38bdf8' }
];

export const marketState = {
  lastUpdateMs: Date.now(),
  items: {
    planks: { mult: 1.05, history: [0.96, 1.0, 1.02, 0.99, 1.04, 1.08, 1.03, 1.05] },
    pallets: { mult: 1.12, history: [1.0, 0.98, 1.05, 1.09, 1.14, 1.1, 1.08, 1.12] },
    cannedFish: { mult: 0.98, history: [1.04, 1.01, 0.97, 0.95, 0.99, 1.02, 1.0, 0.98] }
  }
};

export function updateMarketPrices() {
  const surged = [];
  for (const c of MARKET_COMMODITIES) {
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
      offline: 0
    },

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

export function getRevenueMultiplier() {
  const branchMult = getActiveBranch().multiplier;
  const plankMult = 1 + ((gameState.plankValueTier || 1) - 1) * 0.35;
  const vipMult = getVipMultiplier();
  let skinMult = 1.0;
  if (gameState.equippedSkin === 'captain') skinMult = 1.15;
  if (gameState.equippedSkin === 'gold_tycoon') skinMult = 1.25;
  return branchMult * plankMult * vipMult * skinMult;
}

export function getUpgradeCost(item) {
  const cur = gameState[item.id] || 0;
  if (cur >= item.max) return null;
  const baseLevel = item.id === 'conveyorTier' || item.category === 'workforce' ? cur : Math.max(0, cur - 1);
  let cost = Math.floor(item.baseCost * Math.pow(item.scale, baseLevel));
  if (gameState.vipLevel >= 4) cost = Math.floor(cost * 0.8);
  return cost;
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

export function recordRevenue(source, amount) {
  if (!amount || amount <= 0) return;
  if (!gameState.revenueStats) {
    gameState.revenueStats = { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0 };
  }
  if (source in gameState.revenueStats) {
    gameState.revenueStats[source] += Math.round(amount);
  }
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

  const mult = getRevenueMultiplier();
  const cash = Math.max(25, Math.round((cappedSec / 12) * workforceScore * mult));
  const planks = Math.min(40, Math.floor((cappedSec / 45) * Math.max(1, gameState.lumberjacks || 0)));
  return { seconds: cappedSec, cash, planks };
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
  const mult = getActiveBranch().multiplier;
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
          timberportState: gameState
        })
      });
    } catch (e) {}
  };
  if (immediate) return run();
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(run, 1800);
}

export function loadGameLocal() {
  try {
    const raw = localStorage.getItem('timberport_save_v2');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const prevUpdatedAt = parsed.updatedAt || null;
      Object.assign(gameState, parsed);
      if (!gameState.revenueStats) {
        gameState.revenueStats = { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0 };
      }
      if (!Array.isArray(gameState.claimedAchievements)) {
        gameState.claimedAchievements = [];
      }
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
