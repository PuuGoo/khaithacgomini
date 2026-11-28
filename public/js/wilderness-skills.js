/**
 * TimberPort 3D — 3-Branch Character Skill Tree System (Wilderness Mode)
 * Branches:
 *  - Lâm Hành (Exploration & Movement)
 *  - Thợ Rừng (Passive Forestry Mastery — preserves existing 1-handed chopping mechanics)
 *  - Chủ Trại (Camp Economy, Workers & Sawmill)
 */

export const SKILL_MAX_RANK = 3;

export const SKILL_TREE_BRANCHES = [
  {
    id: 'ranger',
    name: 'Lâm Hành',
    subtitle: 'Di chuyển, gánh gỗ & băng suối',
    accent: '#10b981',
    icon: '🥾',
    nodes: [
      {
        id: 'stride_swift',
        tier: 1,
        requires: null,
        name: 'Bước Chân Rừng',
        icon: '🏃',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng tốc độ đi bộ và chạy trong rừng.',
        rankLabels: ['+8% tốc độ', '+16% tốc độ', '+24% tốc độ']
      },
      {
        id: 'iron_shoulders',
        tier: 2,
        requires: 'stride_swift',
        name: 'Vai Thép Gánh Gỗ',
        icon: '🪵',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng sức chứa khúc gỗ trên vai và giảm độ chậm khi vác nặng.',
        rankLabels: ['+2 sức chứa · -20% nặng', '+4 sức chứa · -40% nặng', '+6 sức chứa · -60% nặng']
      },
      {
        id: 'forest_agility',
        tier: 3,
        requires: 'iron_shoulders',
        name: 'Vượt Suối Nhanh Nhẹn',
        icon: '🌊',
        maxRank: SKILL_MAX_RANK,
        desc: 'Giảm lực cản khi lội sông rừng và mở rộng tầm nhặt khúc gỗ.',
        rankLabels: ['Lội nước 80% · +25% tầm nhặt', 'Lội nước 90% · +50% tầm nhặt', 'Lội nước 98% · +75% tầm nhặt']
      }
    ]
  },
  {
    id: 'woodsman',
    name: 'Thợ Rừng',
    subtitle: 'Sức mạnh rìu & khai thác thụ động',
    accent: '#f59e0b',
    icon: '🪓',
    nodes: [
      {
        id: 'sharp_edge',
        tier: 1,
        requires: null,
        name: 'Lưỡi Rìu Sắc Bén',
        icon: '⚔️',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng sát thương chặt cây và rút ngắn nhịp vung rìu.',
        rankLabels: ['+18% lực chặt · -8% hồi', '+36% lực chặt · -15% hồi', '+55% lực chặt · -22% hồi']
      },
      {
        id: 'clean_fell',
        tier: 2,
        requires: 'sharp_edge',
        name: 'Kỹ Thuật Hạ Cây Chuẩn',
        icon: '⚡',
        maxRank: SKILL_MAX_RANK,
        desc: 'Mở rộng vùng vàng Chí Mạng và tăng cơ hội rơi thêm khúc gỗ.',
        rankLabels: ['+12% gỗ thưởng · +3% vùng vàng', '+24% gỗ thưởng · +6% vùng vàng', '+36% gỗ thưởng · +9% vùng vàng']
      },
      {
        id: 'ancient_master',
        tier: 3,
        requires: 'clean_fell',
        name: 'Bậc Thầy Cổ Thụ',
        icon: '🌲',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng XP, uy tín và thưởng tiền khi đốn hạ Cổ Thụ quý hiếm.',
        rankLabels: ['+20% thưởng Cổ Thụ', '+40% thưởng Cổ Thụ', '+60% thưởng Cổ Thụ']
      }
    ]
  },
  {
    id: 'steward',
    name: 'Chủ Trại',
    subtitle: 'Nhân công AI, xưởng cưa & giao thương',
    accent: '#38bdf8',
    icon: '🏕️',
    nodes: [
      {
        id: 'foreman_pace',
        tier: 1,
        requires: null,
        name: 'Đốc Công Lành Nghề',
        icon: '👷',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng tốc độ di chuyển và làm việc của công nhân AI trong trại.',
        rankLabels: ['+15% tốc độ công nhân', '+30% tốc độ công nhân', '+45% tốc độ công nhân']
      },
      {
        id: 'kiln_speed',
        tier: 2,
        requires: 'foreman_pace',
        name: 'Guồng Cưa Cải Tiến',
        icon: '⚙️',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng năng suất xẻ ván của Xưởng Cưa Guồng Nước.',
        rankLabels: ['+20% tốc độ xẻ ván', '+40% tốc độ xẻ ván', '+60% tốc độ xẻ ván']
      },
      {
        id: 'river_barter',
        tier: 3,
        requires: 'kiln_speed',
        name: 'Thương Lái Đường Sông',
        icon: '⛵',
        maxRank: SKILL_MAX_RANK,
        desc: 'Tăng giá bán bè gỗ, đơn Thương Lái và thưởng tiền Hợp đồng.',
        rankLabels: ['+15% giá bán & hợp đồng', '+30% giá bán & hợp đồng', '+45% giá bán & hợp đồng']
      }
    ]
  }
];

export const SKILL_NODE_MAP = new Map();
for (const branch of SKILL_TREE_BRANCHES) {
  for (const node of branch.nodes) {
    SKILL_NODE_MAP.set(node.id, { ...node, branchId: branch.id, branchName: branch.name, accent: branch.accent });
  }
}

export function createInitialSkillLevels() {
  const out = {};
  for (const id of SKILL_NODE_MAP.keys()) {
    out[id] = 0;
  }
  return out;
}

export function normalizeSkillLevels(raw) {
  const out = createInitialSkillLevels();
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, node] of SKILL_NODE_MAP.entries()) {
    const val = Math.floor(Number(raw[id]) || 0);
    out[id] = Math.max(0, Math.min(node.maxRank || SKILL_MAX_RANK, val));
  }
  return out;
}

export function getSkillPointSummary(level = 1, contractsCompleted = 0, skillLevels = {}) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const safeContracts = Math.max(0, Math.floor(Number(contractsCompleted) || 0));
  // 2 starter skill points + 1 per wilderness level gained + 1 per every 2 forestry contracts completed
  const totalEarned = 2 + Math.max(0, safeLevel - 1) + Math.floor(safeContracts / 2);
  const normalized = normalizeSkillLevels(skillLevels);
  let spent = 0;
  for (const rank of Object.values(normalized)) {
    spent += rank;
  }
  const available = Math.max(0, totalEarned - spent);
  const maxPossible = SKILL_NODE_MAP.size * SKILL_MAX_RANK;
  return {
    level: safeLevel,
    contractsCompleted: safeContracts,
    totalEarned,
    spent,
    available,
    maxPossible,
    levels: normalized
  };
}

export function canUpgradeSkill(skillId, level = 1, contractsCompleted = 0, skillLevels = {}) {
  const node = SKILL_NODE_MAP.get(skillId);
  if (!node) return { ok: false, status: 'missing', reason: 'Kỹ năng không tồn tại.' };
  const summary = getSkillPointSummary(level, contractsCompleted, skillLevels);
  const currentRank = summary.levels[skillId] || 0;
  if (currentRank >= node.maxRank) {
    return { ok: false, status: 'maxed', reason: 'Đã tối đa', currentRank, maxRank: node.maxRank };
  }
  if (node.requires) {
    const reqRank = summary.levels[node.requires] || 0;
    if (reqRank < 1) {
      const reqNode = SKILL_NODE_MAP.get(node.requires);
      return {
        ok: false,
        status: 'locked',
        reason: `Cần mở ${reqNode ? reqNode.name : 'bậc trước'} trước`,
        currentRank,
        maxRank: node.maxRank
      };
    }
  }
  if (summary.available <= 0) {
    return {
      ok: false,
      status: 'no_points',
      reason: 'Chưa đủ điểm kỹ năng',
      currentRank,
      maxRank: node.maxRank
    };
  }
  return {
    ok: true,
    status: 'available',
    reason: 'Có thể nâng',
    currentRank,
    maxRank: node.maxRank,
    nextRank: currentRank + 1
  };
}

export function upgradeSkillLevel(skillLevels, skillId, level = 1, contractsCompleted = 0) {
  const check = canUpgradeSkill(skillId, level, contractsCompleted, skillLevels);
  if (!check.ok) {
    return { ok: false, reason: check.reason, status: check.status };
  }
  const nextLevels = normalizeSkillLevels(skillLevels);
  nextLevels[skillId] = (nextLevels[skillId] || 0) + 1;
  const node = SKILL_NODE_MAP.get(skillId);
  return {
    ok: true,
    node,
    newRank: nextLevels[skillId],
    levels: nextLevels,
    summary: getSkillPointSummary(level, contractsCompleted, nextLevels),
    bonuses: computeSkillBonuses(nextLevels)
  };
}

export function resetAllSkills(level = 1, contractsCompleted = 0) {
  const empty = createInitialSkillLevels();
  return {
    ok: true,
    levels: empty,
    summary: getSkillPointSummary(level, contractsCompleted, empty),
    bonuses: computeSkillBonuses(empty)
  };
}

export function computeSkillBonuses(skillLevels = {}) {
  const s = normalizeSkillLevels(skillLevels);
  const strideRank = s.stride_swift || 0;
  const shoulderRank = s.iron_shoulders || 0;
  const agilityRank = s.forest_agility || 0;

  const sharpRank = s.sharp_edge || 0;
  const fellRank = s.clean_fell || 0;
  const ancientRank = s.ancient_master || 0;

  const foremanRank = s.foreman_pace || 0;
  const kilnRank = s.kiln_speed || 0;
  const barterRank = s.river_barter || 0;

  // Lookup tables keep exact displayed values synchronized with gameplay math
  const chopDmgTable = [1.0, 1.18, 1.36, 1.55];
  const chopCooldownTable = [1.0, 0.92, 0.85, 0.78];
  const waterSpeedTable = [0.68, 0.80, 0.90, 0.98];

  return {
    // Lâm Hành
    moveSpeedMult: 1 + strideRank * 0.08,
    shoulderCapBonus: shoulderRank * 2,
    carrySlowdownRelief: shoulderRank * 0.20, // reduces weight slowdown penalty by 20/40/60%
    waterSpeedMult: waterSpeedTable[agilityRank] || 0.68,
    pickupRadiusMult: 1 + agilityRank * 0.25,

    // Thợ Rừng (strictly passive multipliers — keeps 1-handed chopping intact)
    chopDamageMult: chopDmgTable[sharpRank] || 1.0,
    chopCooldownMult: chopCooldownTable[sharpRank] || 1.0,
    extraLogChanceBonus: fellRank * 0.12,
    critSweetBonus: fellRank * 0.03,
    ancientRewardMult: 1 + ancientRank * 0.20,

    // Chủ Trại
    workerSpeedMult: 1 + foremanRank * 0.15,
    sawmillSpeedMult: 1 + kilnRank * 0.20,
    tradePriceMult: 1 + barterRank * 0.15
  };
}
