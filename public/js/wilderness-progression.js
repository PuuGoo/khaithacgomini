/**
 * TimberPort 3D — Wilderness Timber Combo, Forestry Contracts & Reputation Progression
 * Connects tactical chopping rhythm (Combo) -> mid-term Forestry Contracts -> Camp Visual Upgrades.
 */
import { createInitialSkillLevels, normalizeSkillLevels } from './wilderness-skills.js';

const CONTRACT_TEMPLATES = [
  {
    type: 'fell_trees',
    title: 'Khai Thác Rừng Thông',
    desc: (t) => `Đốn hạ ${t} cây đứng trong rừng nguyên sơ.`,
    baseTarget: 4,
    stepTarget: 2,
    baseCash: 110,
    baseRep: 20
  },
  {
    type: 'buck_logs',
    title: 'Xẻ Khúc Gỗ Tươi',
    desc: (t) => `Chặt thân cây đổ thành ${t} khúc gỗ rời.`,
    baseTarget: 6,
    stepTarget: 3,
    baseCash: 125,
    baseRep: 22
  },
  {
    type: 'crit_chops',
    title: 'Nhát Rìu Chuẩn Xác',
    desc: (t) => `Tung ${t} nhát chặt Chí Mạng trúng vùng vàng (Space).`,
    baseTarget: 3,
    stepTarget: 2,
    baseCash: 150,
    baseRep: 28
  },
  {
    type: 'combo_peak',
    title: 'Nhịp Điệu Lâm Trường',
    desc: (t) => `Đạt chuỗi Combo chặt gỗ x${t} liên tiếp.`,
    baseTarget: 4,
    stepTarget: 1,
    baseCash: 140,
    baseRep: 26
  },
  {
    type: 'saw_planks',
    title: 'Xẻ Ván Đóng Mộc',
    desc: (t) => `Sản xuất ${t} thanh ván gỗ từ Xưởng Cưa.`,
    baseTarget: 6,
    stepTarget: 4,
    baseCash: 165,
    baseRep: 30
  },
  {
    type: 'sell_raft',
    title: 'Xuất Bè Đường Sông',
    desc: (t) => `Giao ${t} chuyến bè hoặc đơn Thương Lái trên sông.`,
    baseTarget: 2,
    stepTarget: 1,
    baseCash: 190,
    baseRep: 35
  }
];

let _contractSeq = 1;

export function createInitialProgressionState() {
  return {
    reputation: 0,
    contractsCompleted: 0,
    bestCombo: 0,
    skills: createInitialSkillLevels(),
    contracts: [
      makeContractFromTemplate(CONTRACT_TEMPLATES[0], 0),
      makeContractFromTemplate(CONTRACT_TEMPLATES[2], 0),
      makeContractFromTemplate(CONTRACT_TEMPLATES[1], 0)
    ]
  };
}

export function normalizeProgressionState(raw) {
  const def = createInitialProgressionState();
  if (!raw || typeof raw !== 'object') return def;
  const rep = Math.max(0, Math.floor(Number(raw.reputation) || 0));
  const done = Math.max(0, Math.floor(Number(raw.contractsCompleted) || 0));
  const bestCombo = Math.max(0, Math.floor(Number(raw.bestCombo) || 0));
  const list = Array.isArray(raw.contracts) && raw.contracts.length > 0
    ? raw.contracts.slice(0, 3).map((c) => ({
        id: String(c.id || `fc_${Date.now()}_${_contractSeq++}`),
        type: String(c.type || 'fell_trees'),
        title: String(c.title || 'Hợp đồng khai thác'),
        desc: String(c.desc || 'Hoàn thành mục tiêu lâm trường.'),
        target: Math.max(1, Math.floor(Number(c.target) || 4)),
        progress: Math.max(0, Math.floor(Number(c.progress) || 0)),
        rewardCash: Math.max(50, Math.floor(Number(c.rewardCash) || 120)),
        rewardRep: Math.max(10, Math.floor(Number(c.rewardRep) || 20)),
        tier: Math.max(1, Math.floor(Number(c.tier) || 1)),
        claimed: Boolean(c.claimed)
      }))
    : def.contracts;

  while (list.length < 3) {
    const usedTypes = new Set(list.map((x) => x.type));
    const pool = CONTRACT_TEMPLATES.filter((t) => !usedTypes.has(t.type));
    const tpl = pool[list.length % Math.max(1, pool.length)] || CONTRACT_TEMPLATES[0];
    list.push(makeContractFromTemplate(tpl, done));
  }

  return {
    reputation: rep,
    contractsCompleted: done,
    bestCombo,
    skills: normalizeSkillLevels(raw.skills),
    contracts: list
  };
}

function makeContractFromTemplate(tpl, completedCount = 0) {
  const tier = 1 + Math.floor(completedCount / 3);
  const scaleIdx = Math.min(5, tier - 1);
  let target = tpl.baseTarget + scaleIdx * tpl.stepTarget;
  if (tpl.type === 'combo_peak') {
    target = Math.min(8, tpl.baseTarget + Math.floor(scaleIdx * 0.7));
  }
  const rewardCash = Math.round(tpl.baseCash * (1 + scaleIdx * 0.34));
  const rewardRep = Math.round(tpl.baseRep * (1 + scaleIdx * 0.28));
  return {
    id: `fc_${Date.now()}_${_contractSeq++}`,
    type: tpl.type,
    title: tpl.title,
    desc: tpl.desc(target),
    target,
    progress: 0,
    rewardCash,
    rewardRep,
    tier,
    claimed: false
  };
}

export class TimberComboTracker {
  constructor() {
    this.count = 0;
    this.timer = 0;
    this.maxWindow = 4.6;
    this.bestThisSession = 0;
  }

  reset() {
    this.count = 0;
    this.timer = 0;
  }

  registerHit(isCrit = false) {
    this.count = Math.min(12, this.count + (isCrit ? 2 : 1));
    this.timer = this.maxWindow;
    if (this.count > this.bestThisSession) {
      this.bestThisSession = this.count;
    }
    return this.getBonuses();
  }

  update(dt) {
    if (this.count <= 0) return false;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.count = 0;
      this.timer = 0;
      return true;
    }
    return false;
  }

  getBonuses() {
    const c = this.count;
    // Scales smoothly from Combo x2..x6+
    const tier = Math.max(0, Math.min(5, c - 1));
    return {
      count: c,
      timer: this.timer,
      ratio: this.maxWindow > 0 ? Math.max(0, Math.min(1, this.timer / this.maxWindow)) : 0,
      cooldownMult: Math.max(0.76, 1 - tier * 0.048),      // Up to -24% swing cooldown
      critWindowBonus: Math.min(0.14, tier * 0.028),        // Widens crit zone
      extraLogChance: Math.min(0.38, tier * 0.075),         // Up to +38% bonus felled log
      label: c >= 6 ? 'Bậc Thầy Rừng' : c >= 4 ? 'Hỏa Lực Rìu' : c >= 2 ? 'Đang Vào Nhịp' : ''
    };
  }
}

export function advanceForestryContracts(progState, eventType, amount = 1) {
  if (!progState || !Array.isArray(progState.contracts)) return [];
  const newlyCompleted = [];
  for (const c of progState.contracts) {
    if (c.claimed || c.type !== eventType) continue;
    const prevDone = c.progress >= c.target;
    if (eventType === 'combo_peak') {
      c.progress = Math.min(c.target, Math.max(c.progress, amount));
    } else {
      c.progress = Math.min(c.target, c.progress + amount);
    }
    if (!prevDone && c.progress >= c.target) {
      newlyCompleted.push(c);
    }
  }
  return newlyCompleted;
}

export function claimForestryContract(progState, contractId) {
  if (!progState || !Array.isArray(progState.contracts)) {
    return { ok: false, reason: 'Không tìm thấy danh sách hợp đồng.' };
  }
  const idx = progState.contracts.findIndex((c) => c.id === contractId);
  if (idx === -1) return { ok: false, reason: 'Hợp đồng không tồn tại.' };
  const c = progState.contracts[idx];
  if (c.progress < c.target) {
    return { ok: false, reason: `Cần thêm ${c.target - c.progress} tiến độ để nhận thưởng.` };
  }

  progState.reputation = (progState.reputation || 0) + c.rewardRep;
  progState.contractsCompleted = (progState.contractsCompleted || 0) + 1;

  // Replace claimed contract with a fresh distinct contract at the new tier
  const otherTypes = new Set(progState.contracts.filter((_, i) => i !== idx).map((x) => x.type));
  const candidates = CONTRACT_TEMPLATES.filter((t) => !otherTypes.has(t.type) && t.type !== c.type);
  const nextTpl = candidates[Math.floor(Math.random() * candidates.length)] || CONTRACT_TEMPLATES[progState.contractsCompleted % CONTRACT_TEMPLATES.length];
  const nextContract = makeContractFromTemplate(nextTpl, progState.contractsCompleted);
  progState.contracts[idx] = nextContract;

  return {
    ok: true,
    claimed: c,
    nextContract,
    reputation: progState.reputation,
    contractsCompleted: progState.contractsCompleted
  };
}
