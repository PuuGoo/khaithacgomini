/**
 * TimberPort 3D — Lightweight Cross-Platform HUD & Unified Commercial Empire Hub
 * 3-Zone Top Bar, Collapsible Bottom Dock, Virtual Joystick & 5-Tab Hub Modal
 */

import {
  gameState,
  BRANCHES,
  SKINS,
  PETS,
  VEHICLES,
  UPGRADE_CATALOG,
  VIP_TIERS,
  GEM_PACKS,
  SEASON_PASS_TIERS,
  getBackpackCapacity,
  getActiveBranch,
  getRevenueMultiplier,
  getUpgradeCost,
  addVipXp,
  addSeasonXp,
  generateNextContract,
  saveGameServer,
  authRequest,
  fetchLeaderboard
} from './state.js';
import { sound } from './audio.js';

export class UIManager {
  constructor(callbacks) {
    this.cb = callbacks || {};
    this.activeTab = 'upgrades';
    this.dockCollapsed = false;

    this.els = {
      hudBranch: document.getElementById('hud-branch'),
      hudLevel: document.getElementById('hud-level'),
      hudUsername: document.getElementById('hud-username'),
      valCash: document.getElementById('val-cash'),
      valLogs: document.getElementById('val-logs'),
      valPlanks: document.getElementById('val-planks'),
      valPallets: document.getElementById('val-pallets'),
      valCanned: document.getElementById('val-canned'),
      valGems: document.getElementById('val-gems'),
      questTitle: document.getElementById('quest-strip-title'),
      questDesc: document.getElementById('quest-strip-desc'),
      questProg: document.getElementById('quest-strip-progress'),
      statusStrip: document.getElementById('status-strip'),
      statusVip: document.getElementById('status-vip-text'),
      statusBoost: document.getElementById('status-boost-text'),
      actionPrompt: document.getElementById('action-prompt'),
      actionPromptKey: document.getElementById('action-prompt-key'),
      actionPromptLabel: document.getElementById('action-prompt-label'),
      dockWrap: document.getElementById('bottom-dock-wrap'),
      dockToggle: document.getElementById('btn-toggle-dock'),
      btnBoost: document.getElementById('btn-boost'),
      btnBoostLabel: document.getElementById('btn-boost-label'),
      badgeSeason: document.getElementById('badge-season'),
      hubModal: document.getElementById('hub-modal'),
      hubBody: document.getElementById('hub-body'),
      accountModal: document.getElementById('account-modal'),
      accountBody: document.getElementById('account-body'),
      lbModal: document.getElementById('leaderboard-modal'),
      lbBody: document.getElementById('leaderboard-body'),
      lbSummary: document.getElementById('lb-online-summary'),
      toastContainer: document.getElementById('toast-container'),
      floatingContainer: document.getElementById('floating-container')
    };

    this.bindEvents();
    this.refreshHUD();
  }

  bindEvents() {
    document.getElementById('btn-audio')?.addEventListener('click', () => {
      const muted = sound.toggleMute();
      document.getElementById('btn-audio').textContent = muted ? '🔇' : '🔊';
      this.toast(muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh');
    });

    this.els.dockToggle?.addEventListener('click', () => this.toggleDock());

    document.querySelectorAll('[data-hub-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.openHub(btn.dataset.hubTab));
    });

    document.querySelectorAll('.hub-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        this.renderHub();
      });
    });

    document.getElementById('btn-close-hub')?.addEventListener('click', () => {
      this.els.hubModal.hidden = true;
    });

    document.getElementById('quest-strip')?.addEventListener('click', () => {
      this.openHub('contracts');
    });

    this.els.btnBoost?.addEventListener('click', () => {
      this.activateBoost();
    });

    document.getElementById('btn-account')?.addEventListener('click', () => this.openAccountModal());
    document.getElementById('btn-close-account')?.addEventListener('click', () => {
      this.els.accountModal.hidden = true;
    });

    document.getElementById('btn-leaderboard')?.addEventListener('click', () => this.openLeaderboardModal());
    document.getElementById('btn-close-lb')?.addEventListener('click', () => {
      this.els.lbModal.hidden = true;
    });

    this.els.actionPrompt?.addEventListener('click', () => {
      if (this.cb.onContextAction) this.cb.onContextAction();
    });

    // Close modals on backdrop click
    [this.els.hubModal, this.els.accountModal, this.els.lbModal].forEach((modal) => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    });
  }

  toggleDock() {
    this.dockCollapsed = !this.dockCollapsed;
    this.els.dockWrap.classList.toggle('is-collapsed', this.dockCollapsed);
    this.els.dockToggle.textContent = this.dockCollapsed ? '▴ Hiện bảng' : '▾ Ẩn bảng';
  }

  isAnyModalOpen() {
    return !this.els.hubModal.hidden || !this.els.accountModal.hidden || !this.els.lbModal.hidden;
  }

  openHub(tab = 'upgrades') {
    this.activeTab = tab;
    this.els.hubModal.hidden = false;
    this.renderHub();
  }

  activateBoost() {
    if (gameState.boostTimer > 0) {
      this.toast('Rìu Vàng đang kích hoạt!');
      return;
    }
    if (gameState.boostCooldown > 0) {
      this.toast(`Vui lòng chờ ${Math.ceil(gameState.boostCooldown)}s để hồi chiêu`);
      return;
    }
    gameState.boostTimer = 25;
    gameState.boostCooldown = gameState.vipLevel >= 3 ? 35 : 55;
    sound.playUpgrade();
    this.toast('⚡ Kích hoạt Tăng Tốc & Rìu Vàng x2 trong 25 giây!');
    this.refreshHUD();
  }

  toast(msg) {
    while (this.els.toastContainer.children.length >= 3) {
      this.els.toastContainer.firstElementChild.remove();
    }
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = msg;
    this.els.toastContainer.appendChild(item);
    setTimeout(() => item.remove(), 2600);
  }

  spawnWorldFloat(screenX, screenY, text, kind = 'log') {
    while (this.els.floatingContainer.children.length >= 12) {
      this.els.floatingContainer.firstElementChild.remove();
    }
    const el = document.createElement('div');
    el.className = `world-float-num ${kind === 'cash' ? 'is-cash' : kind === 'gem' ? 'is-gem' : ''}`;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.textContent = text;
    this.els.floatingContainer.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  setPrompt(visible, keyLabel = 'E', text = '') {
    if (!visible) {
      this.els.actionPrompt.hidden = true;
      return;
    }
    this.els.actionPromptKey.textContent = keyLabel;
    this.els.actionPromptLabel.textContent = text;
    this.els.actionPrompt.hidden = false;
  }

  refreshHUD() {
    const branch = getActiveBranch();
    this.els.hudBranch.textContent = branch.name;
    this.els.hudLevel.textContent = `Cấp ${gameState.level}`;
    this.els.hudUsername.textContent = gameState.username || 'Chủ tịch';

    this.els.valCash.textContent = `$${Math.floor(gameState.cash).toLocaleString()}`;
    this.els.valLogs.textContent = `${gameState.logs}/${getBackpackCapacity()}`;
    this.els.valPlanks.textContent = gameState.planks.toLocaleString();
    this.els.valPallets.textContent = gameState.pallets.toLocaleString();
    this.els.valCanned.textContent = gameState.cannedFish.toLocaleString();
    this.els.valGems.textContent = gameState.gems.toLocaleString();

    const ct = gameState.activeContract;
    if (ct) {
      const done = ct.deliveredPlanks + ct.deliveredPallets + ct.deliveredCanned;
      const req = ct.reqPlanks + ct.reqPallets + ct.reqCanned;
      this.els.questTitle.textContent = 'Hợp đồng';
      this.els.questDesc.textContent = ct.title;
      this.els.questProg.textContent = `${done}/${req}`;
    }

    // Status strip for VIP / Boost
    if (gameState.vipLevel > 0 || gameState.boostTimer > 0) {
      this.els.statusStrip.hidden = false;
      this.els.statusVip.textContent = gameState.vipLevel > 0 ? `VIP ${gameState.vipLevel}` : 'Thương gia';
      this.els.statusBoost.textContent = gameState.boostTimer > 0 ? `⚡ x2 (${Math.ceil(gameState.boostTimer)}s)` : `x${getRevenueMultiplier().toFixed(1)}`;
    } else {
      this.els.statusStrip.hidden = true;
    }

    // Boost button label
    if (gameState.boostTimer > 0) {
      this.els.btnBoost.classList.add('is-active');
      this.els.btnBoostLabel.textContent = `${Math.ceil(gameState.boostTimer)}s`;
    } else if (gameState.boostCooldown > 0) {
      this.els.btnBoost.classList.remove('is-active');
      this.els.btnBoostLabel.textContent = `${Math.ceil(gameState.boostCooldown)}s`;
    } else {
      this.els.btnBoost.classList.remove('is-active');
      this.els.btnBoostLabel.textContent = 'Tăng tốc';
    }

    // Claimable Daily Quests / Season Pass badge count
    let claimable = gameState.dailyQuests.filter((q) => !q.claimed && q.progress >= q.target).length;
    for (const tier of SEASON_PASS_TIERS) {
      if (gameState.seasonXp >= tier.xpReq) {
        if (!gameState.claimedFreeTiers.includes(tier.tier)) claimable++;
        if (gameState.seasonPremium && !gameState.claimedPremiumTiers.includes(tier.tier)) claimable++;
      }
    }
    this.els.badgeSeason.textContent = claimable;
    this.els.badgeSeason.hidden = claimable === 0;
  }

  renderHub() {
    document.querySelectorAll('.hub-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === this.activeTab);
    });

    const body = this.els.hubBody;
    body.innerHTML = '';

    if (this.activeTab === 'upgrades') this.renderUpgradesTab(body);
    else if (this.activeTab === 'contracts') this.renderContractsTab(body);
    else if (this.activeTab === 'season') this.renderSeasonTab(body);
    else if (this.activeTab === 'locker') this.renderLockerTab(body);
    else if (this.activeTab === 'vip') this.renderVipTab(body);
  }

  renderUpgradesTab(root) {
    const groups = [
      { key: 'player', title: 'Trang bị Cá nhân', sub: 'Khai thác nhanh hơn & mang nhiều gỗ hơn' },
      { key: 'sawmill', title: 'Dây chuyền Xưởng Cưa', sub: 'Tăng sản lượng & giá trị ván gỗ' },
      { key: 'workforce', title: 'Tự động hóa Nhân sự & Cảng', sub: 'Vận hành không ngừng nghỉ' }
    ];

    for (const grp of groups) {
      const sec = document.createElement('section');
      sec.innerHTML = `<div class="section-heading"><h3>${grp.title}</h3><span>${grp.sub}</span></div>`;
      const grid = document.createElement('div');
      grid.className = 'card-grid';

      for (const item of UPGRADE_CATALOG.filter((u) => u.category === grp.key)) {
        const cur = gameState[item.id] || 0;
        const cost = getUpgradeCost(item);
        const card = document.createElement('div');
        card.className = 'hub-card';
        card.innerHTML = `
          <div>
            <div class="card-top">
              <div class="card-title-row">
                <span class="card-icon">${item.icon}</span>
                <div>
                  <div class="card-title">${item.name}</div>
                  <div class="card-meta tabular-nums">Cấp ${cur} / ${item.max}</div>
                </div>
              </div>
            </div>
            <p class="card-desc" style="margin-top:8px;">${item.desc(cur)}</p>
          </div>
          <button type="button" class="btn-primary tabular-nums" ${cost === null || gameState.cash < cost ? 'disabled' : ''}>
            ${cost === null ? 'Đạt cấp tối đa' : `Nâng cấp · $${cost.toLocaleString()}`}
          </button>
        `;
        card.querySelector('button').addEventListener('click', () => {
          if (cost === null || gameState.cash < cost) return;
          gameState.cash -= cost;
          gameState[item.id] = cur + 1;
          gameState.xp += 25;
          if (gameState.xp >= gameState.level * 120) gameState.level++;
          addSeasonXp(20);
          sound.playUpgrade();
          this.toast(`Đã nâng cấp ${item.name} lên cấp ${cur + 1}`);
          if (this.cb.onUpgrade) this.cb.onUpgrade(item.id);
          saveGameServer();
          this.refreshHUD();
          this.renderHub();
        });
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      root.appendChild(sec);
    }
  }

  renderContractsTab(root) {
    const ct = gameState.activeContract;
    const ctSection = document.createElement('section');
    ctSection.innerHTML = `<div class="section-heading"><h3>Hợp đồng Xuất khẩu Hiện tại</h3><span>Hoàn thành tại Cẩu Xuất Cảng (Cầu tàu)</span></div>`;

    if (ct) {
      const done = ct.deliveredPlanks + ct.deliveredPallets + ct.deliveredCanned;
      const req = ct.reqPlanks + ct.reqPallets + ct.reqCanned;
      const pct = Math.min(100, Math.round((done / Math.max(1, req)) * 100));
      const canInstantDeliver = gameState.planks >= (ct.reqPlanks - ct.deliveredPlanks)
        && gameState.pallets >= (ct.reqPallets - ct.deliveredPallets)
        && gameState.cannedFish >= (ct.reqCanned - ct.deliveredCanned);

      const card = document.createElement('div');
      card.className = 'hub-card is-active-branch';
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">🚢 ${ct.title}</div>
            <div class="card-meta tabular-nums">
              Ván: ${ct.deliveredPlanks}/${ct.reqPlanks} · Pallet: ${ct.deliveredPallets}/${ct.reqPallets} · Cá hộp: ${ct.deliveredCanned}/${ct.reqCanned}
            </div>
          </div>
          <div class="tabular-nums" style="text-align:right; color:#34d399; font-weight:700;">
            +$${ct.rewardCash.toLocaleString()}<br><span style="color:#38bdf8;">+${ct.rewardGems} 💎</span>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <button type="button" class="btn-primary" ${!canInstantDeliver ? 'disabled' : ''}>
          ${canInstantDeliver ? 'Xuất hàng & Nhận thưởng ngay' : 'Chưa đủ hàng trong kho — Tiếp tục sản xuất'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (this.cb.onDeliverContract && this.cb.onDeliverContract(true)) {
          this.renderHub();
        }
      });
      ctSection.appendChild(card);
    }
    root.appendChild(ctSection);

    // Branches Expansion
    const brSec = document.createElement('section');
    brSec.innerHTML = `<div class="section-heading"><h3>Mở rộng Chi nhánh Cảng Quốc tế</h3><span>Hợp đồng đã hoàn thành: ${gameState.contractsCompleted}</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid';

    for (const br of BRANCHES) {
      const unlocked = gameState.unlockedBranches.includes(br.id);
      const isActive = gameState.activeBranchId === br.id;
      const canUnlock = gameState.cash >= br.unlockCost && gameState.contractsCompleted >= br.reqContracts;

      const card = document.createElement('div');
      card.className = `hub-card ${isActive ? 'is-active-branch' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${br.name}</div>
          <div class="card-meta">${br.region} · Hệ số x${br.multiplier.toFixed(1)}</div>
          <p class="card-desc" style="margin-top:8px;">${br.desc}</p>
        </div>
        <button type="button" class="${isActive ? 'btn-secondary' : unlocked ? 'btn-gem' : 'btn-primary'}" ${(!unlocked && !canUnlock) || isActive ? 'disabled' : ''}>
          ${isActive ? 'Đang vận hành' : unlocked ? 'Chuyển sang chi nhánh này' : `Mở chi nhánh · $${br.unlockCost.toLocaleString()} (${br.reqContracts} HĐ)`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (isActive) return;
        if (!unlocked) {
          if (!canUnlock) return;
          gameState.cash -= br.unlockCost;
          gameState.unlockedBranches.push(br.id);
          addVipXp(120);
          sound.playShipHorn();
          this.toast(`🎉 Khai trương chi nhánh ${br.name}!`);
        }
        gameState.activeBranchId = br.id;
        generateNextContract();
        if (this.cb.onBranchChange) this.cb.onBranchChange(br);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      grid.appendChild(card);
    }
    brSec.appendChild(grid);
    root.appendChild(brSec);
  }

  renderSeasonTab(root) {
    // Daily Quests
    const dqSec = document.createElement('section');
    dqSec.innerHTML = `<div class="section-heading"><h3>Nhiệm vụ Ngày</h3><span>Hoàn thành để nhận Cash, Đá quý & XP Vé Mùa</span></div>`;
    const dqGrid = document.createElement('div');
    dqGrid.className = 'card-grid';

    for (const q of gameState.dailyQuests) {
      const ready = !q.claimed && q.progress >= q.target;
      const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
      const card = document.createElement('div');
      card.className = `hub-card ${q.claimed ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${q.title}</div>
          <div class="card-meta tabular-nums">Tiến độ: ${q.progress}/${q.target} · +$${q.rewardCash} · +${q.rewardGems}💎 · +${q.rewardXp} XP</div>
          <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <button type="button" class="${ready ? 'btn-primary' : 'btn-secondary'}" ${!ready ? 'disabled' : ''}>
          ${q.claimed ? 'Đã nhận thưởng' : ready ? 'Nhận thưởng ngay' : 'Đang thực hiện'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (!ready) return;
        q.claimed = true;
        gameState.cash += q.rewardCash;
        gameState.gems += q.rewardGems;
        addSeasonXp(q.rewardXp);
        sound.playCash();
        this.toast(`🎁 Nhận +$${q.rewardCash} & +${q.rewardGems} 💎`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      dqGrid.appendChild(card);
    }
    dqSec.appendChild(dqGrid);
    root.appendChild(dqSec);

    // Season Pass
    const spSec = document.createElement('section');
    const banner = document.createElement('div');
    banner.className = 'season-banner';
    banner.innerHTML = `
      <div>
        <div class="card-title">🎫 Vé Mùa Thương Cảng — Mùa 1</div>
        <div class="card-meta tabular-nums">Điểm Mùa hiện tại: ${gameState.seasonXp} XP · Trạng thái: ${gameState.seasonPremium ? 'Đã mở Premium' : 'Nhánh Miễn Phí'}</div>
      </div>
      <div style="min-width:210px;">
        <button type="button" id="btn-buy-season-pass" class="btn-gem" ${gameState.seasonPremium || gameState.gems < 90 ? 'disabled' : ''}>
          ${gameState.seasonPremium ? 'Đã kích hoạt Vé Premium' : 'Mở khóa Vé Premium · 90 💎'}
        </button>
      </div>
    `;
    banner.querySelector('#btn-buy-season-pass').addEventListener('click', () => {
      if (gameState.seasonPremium || gameState.gems < 90) return;
      gameState.gems -= 90;
      gameState.seasonPremium = true;
      addVipXp(180);
      sound.playUpgrade();
      this.toast('🎫 Đã mở khóa nhánh Premium Vé Mùa 1!');
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    spSec.appendChild(banner);

    const rows = document.createElement('div');
    rows.className = 'season-tiers';
    rows.style.marginTop = '12px';

    for (const t of SEASON_PASS_TIERS) {
      const unlocked = gameState.seasonXp >= t.xpReq;
      const freeClaimed = gameState.claimedFreeTiers.includes(t.tier);
      const premClaimed = gameState.claimedPremiumTiers.includes(t.tier);

      const row = document.createElement('div');
      row.className = `season-row ${unlocked ? 'is-unlocked' : ''}`;
      row.innerHTML = `
        <div class="tabular-nums" style="font-weight:700;">Cấp ${t.tier}<br><span style="font-size:11px; color:#94a3b8;">${t.xpReq} XP</span></div>
        <button type="button" class="btn-secondary btn-claim-free" ${!unlocked || freeClaimed ? 'disabled' : ''}>
          Miễn phí: ${t.freeReward.label} ${freeClaimed ? '✓' : ''}
        </button>
        <button type="button" class="btn-primary btn-claim-prem" ${!unlocked || !gameState.seasonPremium || premClaimed ? 'disabled' : ''}>
          Premium: ${t.premiumReward.label} ${premClaimed ? '✓' : ''}
        </button>
      `;

      row.querySelector('.btn-claim-free').addEventListener('click', () => {
        if (!unlocked || freeClaimed) return;
        gameState.claimedFreeTiers.push(t.tier);
        if (t.freeReward.type === 'gems') gameState.gems += t.freeReward.amount;
        else gameState.cash += t.freeReward.amount;
        sound.playCash();
        this.toast(`Nhận thưởng Vé Mùa cấp ${t.tier}: ${t.freeReward.label}`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });

      row.querySelector('.btn-claim-prem').addEventListener('click', () => {
        if (!unlocked || !gameState.seasonPremium || premClaimed) return;
        gameState.claimedPremiumTiers.push(t.tier);
        if (t.premiumReward.type === 'gems') gameState.gems += t.premiumReward.amount;
        else gameState.cash += t.premiumReward.amount;
        sound.playCash();
        this.toast(`Nhận thưởng Premium cấp ${t.tier}: ${t.premiumReward.label}`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });

      rows.appendChild(row);
    }

    spSec.appendChild(rows);
    root.appendChild(spSec);
  }

  renderLockerTab(root) {
    // Skins
    this.renderCosmeticSection(root, 'Trang phục Nhân vật (Skins)', SKINS, 'unlockedSkins', 'equippedSkin', (item) => {
      if (this.cb.onSkinChange) this.cb.onSkinChange(item);
    });
    // Pets
    this.renderCosmeticSection(root, 'Thú cưng Đồng hành 3D', PETS, 'unlockedPets', 'equippedPet', (item) => {
      if (this.cb.onPetChange) this.cb.onPetChange(item.id);
    });
    // Supercars / Vehicles
    this.renderCosmeticSection(root, 'Siêu xe & Phương tiện Vận tải', VEHICLES, 'unlockedVehicles', 'equippedVehicle', (item) => {
      if (this.cb.onVehicleChange) this.cb.onVehicleChange(item.id);
    });
  }

  renderCosmeticSection(root, title, catalog, unlockedKey, equippedKey, onEquip) {
    const sec = document.createElement('section');
    sec.innerHTML = `<div class="section-heading"><h3>${title}</h3><span>Cập nhật trực tiếp trên mô hình 3D</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid';

    for (const item of catalog) {
      const unlocked = gameState[unlockedKey].includes(item.id);
      const equipped = gameState[equippedKey] === item.id;
      const canAfford = item.costType === 'free'
        || (item.costType === 'cash' && gameState.cash >= item.cost)
        || (item.costType === 'gems' && gameState.gems >= item.cost);

      const priceText = item.costType === 'free' ? 'Miễn phí'
        : item.costType === 'cash' ? `$${item.cost.toLocaleString()}`
        : `${item.cost} 💎`;

      const card = document.createElement('div');
      card.className = `hub-card ${equipped ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${item.name}</div>
          <div class="card-meta">${item.bonusText || (item.capacity ? `Tốc độ ${item.speed} · Sức chứa ${item.capacity}` : 'Trang bị thương mại')}</div>
          <p class="card-desc" style="margin-top:6px;">${item.desc}</p>
        </div>
        <button type="button" class="${equipped ? 'btn-secondary' : unlocked ? 'btn-gem' : 'btn-primary'}" ${equipped || (!unlocked && !canAfford) ? 'disabled' : ''}>
          ${equipped ? 'Đang trang bị' : unlocked ? 'Trang bị ngay' : `Mở khóa · ${priceText}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (equipped) return;
        if (!unlocked) {
          if (!canAfford) return;
          if (item.costType === 'cash') gameState.cash -= item.cost;
          if (item.costType === 'gems') gameState.gems -= item.cost;
          gameState[unlockedKey].push(item.id);
          addVipXp(item.costType === 'gems' ? item.cost * 2 : 40);
          sound.playUpgrade();
          this.toast(`✨ Đã sở hữu ${item.name}!`);
        }
        gameState[equippedKey] = item.id;
        onEquip(item);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    root.appendChild(sec);
  }

  renderVipTab(root) {
    const curVip = gameState.vipLevel || 0;
    const nextVip = VIP_TIERS.find((v) => v.level === curVip + 1);
    const pct = nextVip ? Math.min(100, Math.round((gameState.vipXp / nextVip.xpReq) * 100)) : 100;

    const vipSec = document.createElement('section');
    vipSec.innerHTML = `
      <div class="section-heading"><h3>Đặc quyền Thành viên VIP</h3><span>Cấp hiện tại: VIP ${curVip}</span></div>
      <div class="season-banner">
        <div style="flex:1; min-width:220px;">
          <div class="card-title">👑 ${curVip > 0 ? VIP_TIERS[curVip - 1].name : 'Thành viên Tiêu chuẩn'}</div>
          <div class="card-meta tabular-nums">Điểm VIP: ${gameState.vipXp} ${nextVip ? `/ ${nextVip.xpReq} để lên ${nextVip.name}` : '(Đạt cấp tối đa)'}</div>
          <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%; background:#f59e0b;"></div></div>
        </div>
        <div class="tabular-nums" style="font-weight:700; color:#fde68a;">
          Hệ số VIP: x${(curVip > 0 ? VIP_TIERS[curVip - 1].bonusMult : 1).toFixed(2)}
        </div>
      </div>
    `;
    const vipGrid = document.createElement('div');
    vipGrid.className = 'card-grid';
    vipGrid.style.marginTop = '12px';
    for (const v of VIP_TIERS) {
      const reached = curVip >= v.level;
      const card = document.createElement('div');
      card.className = `hub-card ${reached ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">VIP ${v.level} · ${v.name}</div>
          <div class="card-meta tabular-nums">Mốc ${v.xpReq} VIP XP · ${reached ? 'Đã kích hoạt' : 'Chưa đạt'}</div>
          <p class="card-desc" style="margin-top:6px;">${v.perk}</p>
        </div>
      `;
      vipGrid.appendChild(card);
    }
    vipSec.appendChild(vipGrid);
    root.appendChild(vipSec);

    // Gem Packs
    const gemSec = document.createElement('section');
    gemSec.innerHTML = `<div class="section-heading"><h3>Kho Đá Quý & Gói Thương Mại</h3><span>Dùng Đá quý để mở Vé Mùa, Skin & Siêu xe</span></div>`;
    const gemGrid = document.createElement('div');
    gemGrid.className = 'card-grid';

    for (const pack of GEM_PACKS) {
      const isStarter = pack.id === 'pack_starter';
      const cashCost = pack.id === 'pack_merchant' ? 15000 : pack.id === 'pack_tycoon' ? 45000 : 0;
      const disabled = (isStarter && gameState.starterPackClaimed) || (!isStarter && gameState.cash < cashCost);

      const card = document.createElement('div');
      card.className = 'hub-card';
      card.innerHTML = `
        <div>
          <div class="card-title">💎 ${pack.name}</div>
          <div class="card-meta">${pack.badge}</div>
          <p class="card-desc" style="margin-top:6px;">${pack.bonus}</p>
        </div>
        <button type="button" class="btn-gem" ${disabled ? 'disabled' : ''}>
          ${isStarter && gameState.starterPackClaimed ? 'Đã nhận gói khởi nghiệp' : pack.priceLabel}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (disabled) return;
        if (isStarter) gameState.starterPackClaimed = true;
        else gameState.cash -= cashCost;
        gameState.gems += pack.gems;
        const lvUp = addVipXp(pack.vipXp);
        sound.playUpgrade();
        this.toast(`💎 Nhận +${pack.gems} Đá quý & +${pack.vipXp} VIP XP!${lvUp ? ` Thăng hạng VIP ${lvUp}!` : ''}`);
        if (lvUp && this.cb.onSkinChange) this.cb.onSkinChange();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      gemGrid.appendChild(card);
    }
    gemSec.appendChild(gemGrid);
    root.appendChild(gemSec);
  }

  openAccountModal() {
    this.els.accountModal.hidden = false;
    const body = this.els.accountBody;
    const gfx = this.cb.getGraphicsInfo ? this.cb.getGraphicsInfo() : null;
    const gfxCardHtml = gfx ? `
      <div class="hub-card">
        <div class="card-title">🛡️ Tối Ưu GPU & Chống Tràn RAM (&lt;8GB RAM)</div>
        <div class="card-meta tabular-nums">
          Đang chạy: <b>${gfx.profileLabel}</b> (${gfx.reason}) · ${gfx.fps} FPS · Geo: ${gfx.geometries} · Tex: ${gfx.textures} · Draw: ${gfx.calls}
        </div>
        <div class="form-stack" style="margin-top:10px;">
          <select id="sel-graphics-mode" class="text-input">
            <option value="auto" ${gfx.mode === 'auto' ? 'selected' : ''}>Tự động bảo vệ máy yếu (Khuyên dùng)</option>
            <option value="low" ${gfx.mode === 'low' ? 'selected' : ''}>Tiết kiệm RAM/GPU (30 FPS, tắt ShadowMap)</option>
            <option value="balanced" ${gfx.mode === 'balanced' ? 'selected' : ''}>Cân bằng (45 FPS, bóng đổ 1024px)</option>
            <option value="high" ${gfx.mode === 'high' ? 'selected' : ''}>Đồ họa Cao (60+ FPS, bóng mềm 2048px)</option>
          </select>
          <button type="button" id="btn-flush-gpu" class="btn-secondary">🧹 Dọn cache bộ nhớ GPU ngay</button>
        </div>
      </div>
    ` : '';

    body.innerHTML = `
      <div class="hub-card">
        <div class="card-title">Hồ sơ Đế Chế Hiện Tại</div>
        <div class="card-meta tabular-nums">Chủ tịch: ${gameState.username} · Đế chế: ${gameState.empireName} · Tiền mặt: $${Math.floor(gameState.cash).toLocaleString()}</div>
        <div class="form-stack" style="margin-top:10px;">
          <input id="inp-empire-name" class="text-input" type="text" maxlength="32" value="${gameState.empireName}" placeholder="Tên Đế Chế mới">
          <div style="display:flex; gap:8px;">
            <button type="button" id="btn-rename-empire" class="btn-secondary">Đổi tên Đế Chế</button>
            <button type="button" id="btn-manual-save" class="btn-primary">Lưu tiến trình ngay</button>
          </div>
        </div>
      </div>

      ${gfxCardHtml}

      <div class="hub-card">
        <div class="card-title">Đăng nhập hoặc Tạo tài khoản mới</div>
        <div class="card-meta">Lưu trữ tài sản và leo Bảng xếp hạng Thương Gia</div>
        <div class="form-stack" style="margin-top:10px;">
          <input id="inp-auth-user" class="text-input" type="text" placeholder="Tên đăng nhập (tối thiểu 3 ký tự)">
          <input id="inp-auth-pass" class="text-input" type="password" placeholder="Mật khẩu">
          <div style="display:flex; gap:8px;">
            <button type="button" id="btn-do-login" class="btn-secondary">Đăng nhập</button>
            <button type="button" id="btn-do-register" class="btn-primary">Đăng ký mới</button>
          </div>
        </div>
      </div>
    `;

    body.querySelector('#sel-graphics-mode')?.addEventListener('change', (e) => {
      if (this.cb.onGraphicsChange) {
        this.cb.onGraphicsChange(e.target.value);
        this.openAccountModal();
      }
    });

    body.querySelector('#btn-flush-gpu')?.addEventListener('click', () => {
      if (this.cb.onFlushGpu) {
        this.cb.onFlushGpu();
        this.openAccountModal();
      }
    });

    body.querySelector('#btn-rename-empire').addEventListener('click', async () => {
      const nextName = body.querySelector('#inp-empire-name').value.trim();
      if (!nextName) return;
      gameState.empireName = nextName;
      await saveGameServer(true);
      this.toast(`Đã đổi tên thành "${nextName}"`);
      this.refreshHUD();
    });

    body.querySelector('#btn-manual-save').addEventListener('click', async () => {
      await saveGameServer(true);
      sound.playCash();
      this.toast('💾 Đã lưu tiến trình thành công!');
    });

    const handleAuth = async (mode) => {
      const username = body.querySelector('#inp-auth-user').value.trim();
      const password = body.querySelector('#inp-auth-pass').value;
      if (username.length < 3 || password.length < 3) {
        this.toast('Tên đăng nhập và mật khẩu tối thiểu 3 ký tự');
        return;
      }
      const res = await authRequest(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        username,
        password,
        empireName: gameState.empireName
      });
      if (res.status !== 'success') {
        this.toast(res.message || 'Thao tác thất bại');
        return;
      }
      gameState.username = res.user.username;
      gameState.empireName = res.user.empireName;
      gameState.playerId = res.user.username;
      if (res.empireData && res.empireData.timberportState) {
        Object.assign(gameState, res.empireData.timberportState);
      }
      await saveGameServer(true);
      sound.playUpgrade();
      this.toast(res.message);
      this.refreshHUD();
      this.els.accountModal.hidden = true;
    };

    body.querySelector('#btn-do-login').addEventListener('click', () => handleAuth('login'));
    body.querySelector('#btn-do-register').addEventListener('click', () => handleAuth('register'));
  }

  async openLeaderboardModal() {
    this.els.lbModal.hidden = false;
    const onlineCount = this.cb.getOnlineCount ? this.cb.getOnlineCount() : 1;
    this.els.lbSummary.textContent = `Đang có ${onlineCount} thương gia trực tuyến trong thế giới 3D`;
    this.els.lbBody.innerHTML = `<div class="card-meta">Đang tải dữ liệu bảng xếp hạng...</div>`;

    const list = await fetchLeaderboard();
    if (!list.length) {
      this.els.lbBody.innerHTML = `
        <div class="hub-card">
          <div class="card-title">Chưa có thương gia nào lưu bảng vàng</div>
          <p class="card-desc">Hãy mở Tài khoản và lưu tiến trình của bạn để trở thành người dẫn đầu đầu tiên!</p>
        </div>
      `;
      return;
    }

    this.els.lbBody.innerHTML = '';
    list.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'lb-row';
      row.innerHTML = `
        <div>
          <div style="font-weight:700;">#${idx + 1} · ${entry.empireName}</div>
          <div class="card-meta">Chủ tịch: ${entry.username} · Cấp ${entry.level}</div>
        </div>
        <div class="tabular-nums" style="font-weight:700; color:#34d399;">$${Number(entry.money || 0).toLocaleString()}</div>
      `;
      this.els.lbBody.appendChild(row);
    });
  }
}
