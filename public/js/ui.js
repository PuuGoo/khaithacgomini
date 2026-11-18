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
  DAILY_REWARDS,
  ACHIEVEMENTS,
  MARKET_COMMODITIES,
  MANAGER_CATALOG,
  WHEEL_SEGMENTS,
  activeEventState,
  marketState,
  getBackpackCapacity,
  getActiveBranch,
  getRevenueMultiplier,
  getContractMultiplier,
  getUpgradeCost,
  getSawmillVisualTier,
  getHarborVisualTier,
  getCashPerMinute,
  getManagerLevel,
  getManagerCost,
  getPrestigeMultiplier,
  canClaimDailyCheckIn,
  claimDailyCheckIn,
  isAchievementReady,
  getReadyAchievementCount,
  canFreeSpin,
  canPrestige,
  getPrestigeRewardMedals,
  performPrestige,
  recordRevenue,
  todayIsoDate,
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
    this.wheelSpinning = false;
    this.wheelAngle = 0;
    this.prestigeConfirmOpen = false;
    this.celebrationTimer = null;

    this.els = {
      hudBranch: document.getElementById('hud-branch'),
      hudLevel: document.getElementById('hud-level'),
      hudUsername: document.getElementById('hud-username'),
      valCash: document.getElementById('val-cash'),
      valCpm: document.getElementById('val-cpm'),
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
      vipRushStrip: document.getElementById('vip-rush-strip'),
      vipRushTimer: document.getElementById('vip-rush-timer'),
      vipRushReward: document.getElementById('vip-rush-reward'),
      actionPrompt: document.getElementById('action-prompt'),
      actionPromptKey: document.getElementById('action-prompt-key'),
      actionPromptLabel: document.getElementById('action-prompt-label'),
      dockWrap: document.getElementById('bottom-dock-wrap'),
      dockToggle: document.getElementById('btn-toggle-dock'),
      btnBoost: document.getElementById('btn-boost'),
      btnBoostLabel: document.getElementById('btn-boost-label'),
      badgeSeason: document.getElementById('badge-season'),
      badgeAch: document.getElementById('badge-ach'),
      minimapWrap: document.getElementById('minimap-wrap'),
      minimapToggle: document.getElementById('btn-toggle-minimap'),
      minimapCanvas: document.getElementById('minimap-canvas'),
      minimapCtx: document.getElementById('minimap-canvas')?.getContext('2d') || null,
      welcomeOverlay: document.getElementById('welcome-overlay'),
      welcomeEmpire: document.getElementById('welcome-empire'),
      welcomeStats: document.getElementById('welcome-stats'),
      welcomeOfflineBox: document.getElementById('welcome-offline-box'),
      welcomeOfflineDesc: document.getElementById('welcome-offline-desc'),
      welcomeHwNote: document.getElementById('welcome-hw-note'),
      hubModal: document.getElementById('hub-modal'),
      hubKpiStrip: document.getElementById('hub-kpi-strip'),
      hubBody: document.getElementById('hub-body'),
      celebrationBanner: document.getElementById('celebration-banner'),
      celebrationTitle: document.getElementById('celebration-title'),
      celebrationDetail: document.getElementById('celebration-detail'),
      accountModal: document.getElementById('account-modal'),
      accountBody: document.getElementById('account-body'),
      lbModal: document.getElementById('leaderboard-modal'),
      lbBody: document.getElementById('leaderboard-body'),
      lbSummary: document.getElementById('lb-online-summary'),
      toastContainer: document.getElementById('toast-container'),
      floatingContainer: document.getElementById('floating-container')
    };

    this.minimapCollapsed = window.innerWidth <= 960;
    if (this.minimapCollapsed && this.els.minimapWrap) {
      this.els.minimapWrap.classList.add('is-collapsed');
      if (this.els.minimapToggle) this.els.minimapToggle.textContent = '▴';
    }

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
    this.els.minimapToggle?.addEventListener('click', () => this.toggleMinimap());

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

    this.els.vipRushStrip?.addEventListener('click', () => {
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
    this.els.minimapWrap?.classList.toggle('is-hidden-hud', this.dockCollapsed);
  }

  toggleMinimap() {
    this.minimapCollapsed = !this.minimapCollapsed;
    this.els.minimapWrap?.classList.toggle('is-collapsed', this.minimapCollapsed);
    if (this.els.minimapToggle) {
      this.els.minimapToggle.textContent = this.minimapCollapsed ? '▴' : '▾';
    }
  }

  showWelcomeOverlay(offlineData, gfxInfo, onClaimOffline) {
    if (!this.els.welcomeOverlay) return;
    const branch = getActiveBranch();
    this.els.welcomeEmpire.textContent = gameState.empireName || 'TimberPort Empire';
    this.els.welcomeStats.textContent = `Cấp ${gameState.level} · ${branch.name} · $${Math.floor(gameState.cash).toLocaleString()} · ${gameState.gems} 💎`;

    if (offlineData && offlineData.cash > 0) {
      const mins = Math.max(1, Math.round(offlineData.seconds / 60));
      const timeText = mins >= 60 ? `${Math.floor(mins / 60)}g ${mins % 60}p` : `${mins} phút`;
      this.els.welcomeOfflineBox.hidden = false;
      this.els.welcomeOfflineDesc.textContent = `+$${offlineData.cash.toLocaleString()} Cash${offlineData.planks > 0 ? ` · +${offlineData.planks} Ván gỗ` : ''} (${timeText} ngoại tuyến)`;
    } else {
      this.els.welcomeOfflineBox.hidden = true;
    }

    if (gfxInfo && this.els.welcomeHwNote) {
      this.els.welcomeHwNote.textContent = `🛡️ Đồ họa: ${gfxInfo.profileLabel} (${gfxInfo.reason})`;
    }

    let claimed = false;
    const finishWelcome = (openHubTab = null) => {
      this.els.welcomeOverlay.hidden = true;
      if (!claimed && offlineData && offlineData.cash > 0 && onClaimOffline) {
        claimed = true;
        onClaimOffline(offlineData);
      }
      if (openHubTab) {
        this.openHub(openHubTab);
      }
    };

    const btnPlay = document.getElementById('btn-welcome-play');
    const btnHub = document.getElementById('btn-welcome-hub');
    if (btnPlay) btnPlay.onclick = () => finishWelcome(null);
    if (btnHub) btnHub.onclick = () => finishWelcome(canClaimDailyCheckIn() ? 'season' : 'contracts');
    this.els.welcomeOverlay.hidden = false;
  }

  renderMinimap(playerPos, playerYaw, trees, questTarget) {
    const ctx = this.els.minimapCtx;
    if (!ctx || this.minimapCollapsed || this.dockCollapsed) return;

    const w = 148;
    const h = 148;
    const toMapX = (wx) => ((wx + 46) / 92) * w;
    const toMapY = (wz) => ((wz + 42) / 84) * h;

    // Terrain & Ocean
    ctx.fillStyle = '#183624';
    ctx.fillRect(0, 0, w, h);

    const beachY = toMapY(22);
    ctx.fillStyle = '#a38954';
    ctx.fillRect(0, beachY, w, toMapY(26) - beachY);

    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, toMapY(26), w, h - toMapY(26));

    // Asphalt roads
    ctx.fillStyle = '#334155';
    ctx.fillRect(toMapX(-25), toMapY(-6.5), toMapX(21) - toMapX(-25), 9);
    ctx.fillRect(toMapX(-1), toMapY(-6), 10, toMapY(26) - toMapY(-6));

    // Sawmill building & Harbor Pier
    ctx.fillStyle = '#d97706';
    ctx.fillRect(toMapX(-6), toMapY(-19), 26, 18);
    ctx.fillStyle = '#92623a';
    ctx.fillRect(toMapX(-11), toMapY(24.5), 42, 22);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(toMapX(2), toMapY(29), 18, 9);

    // Harvestable alive trees
    if (trees && trees.length) {
      ctx.fillStyle = '#4ade80';
      for (const t of trees) {
        if (!t.alive) continue;
        ctx.fillRect(toMapX(t.pos.x) - 1.5, toMapY(t.pos.z) - 1.5, 3, 3);
      }
    }

    // Active quest target beacon ring
    if (questTarget) {
      const qx = toMapX(questTarget.x);
      const qy = toMapY(questTarget.z);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(qx, qy, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Player directional triangle
    if (playerPos) {
      const px = toMapX(playerPos.x);
      const py = toMapY(playerPos.z);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-playerYaw + Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 5);
      ctx.lineTo(-4.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  isAnyModalOpen() {
    return !this.els.hubModal.hidden
      || !this.els.accountModal.hidden
      || !this.els.lbModal.hidden
      || (this.els.welcomeOverlay && !this.els.welcomeOverlay.hidden);
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

  triggerCelebration(title, detail) {
    const el = this.els.celebrationBanner;
    if (!el) return;
    this.els.celebrationTitle.textContent = title;
    this.els.celebrationDetail.textContent = detail;
    el.hidden = true;
    void el.offsetWidth;
    el.hidden = false;
    clearTimeout(this.celebrationTimer);
    this.celebrationTimer = setTimeout(() => {
      el.hidden = true;
    }, 2600);
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
    if (this.els.valCpm) {
      this.els.valCpm.textContent = `+$${getCashPerMinute().toLocaleString()}/p`;
    }
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

    // VIP Rush Order Countdown Strip
    const rush = gameState.vipRushOrder;
    if (this.els.vipRushStrip) {
      if (rush) {
        const sec = Math.max(0, Math.ceil(rush.timeLeft));
        const mm = String(Math.floor(sec / 60)).padStart(2, '0');
        const ss = String(sec % 60).padStart(2, '0');
        this.els.vipRushTimer.textContent = `${mm}:${ss}`;
        this.els.vipRushReward.textContent = `+$${Math.round(rush.rewardCash * getContractMultiplier()).toLocaleString()}`;
        this.els.vipRushStrip.hidden = false;
      } else {
        this.els.vipRushStrip.hidden = true;
      }
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

    // Claimable Daily Check-In + Free Wheel Spin + Quests + Season Pass badge count
    let claimable = (canClaimDailyCheckIn() ? 1 : 0) + (canFreeSpin() ? 1 : 0);
    claimable += gameState.dailyQuests.filter((q) => !q.claimed && q.progress >= q.target).length;
    for (const tier of SEASON_PASS_TIERS) {
      if (gameState.seasonXp >= tier.xpReq) {
        if (!gameState.claimedFreeTiers.includes(tier.tier)) claimable++;
        if (gameState.seasonPremium && !gameState.claimedPremiumTiers.includes(tier.tier)) claimable++;
      }
    }
    this.els.badgeSeason.textContent = claimable;
    this.els.badgeSeason.hidden = claimable === 0;

    if (this.els.badgeAch) {
      const readyAch = getReadyAchievementCount();
      this.els.badgeAch.textContent = readyAch;
      this.els.badgeAch.hidden = readyAch === 0;
    }

    // Live-update Hub KPI strip & active timers cleanly without rebuilding DOM mid-click
    if (this.els.hubModal && !this.els.hubModal.hidden) {
      this.renderHubKpiStrip();
      const evSpan = this.els.hubBody?.querySelector('[data-live-countdown="event"]');
      if (evSpan) {
        evSpan.textContent = activeEventState.current
          ? `Còn ${Math.max(0, Math.ceil(activeEventState.timeLeft))}s`
          : `Mở lại sau ${Math.max(0, Math.ceil(activeEventState.cooldown))}s`;
      }
      const rushSpan = this.els.hubBody?.querySelector('[data-live-countdown="rush"]');
      if (rushSpan && rush) {
        rushSpan.textContent = `Còn ${Math.max(0, Math.ceil(rush.timeLeft))}s`;
      }
    }
  }

  renderHubKpiStrip() {
    if (!this.els.hubKpiStrip) return;
    const ev = activeEventState.current;
    const evText = ev ? `${ev.name} (${Math.max(0, Math.ceil(activeEventState.timeLeft))}s)` : `Chờ (${Math.max(0, Math.ceil(activeEventState.cooldown))}s)`;
    this.els.hubKpiStrip.innerHTML = `
      <div class="kpi-cell">
        <span class="kpi-label">Thu nhập / phút</span>
        <span class="kpi-val is-green">+$${getCashPerMinute().toLocaleString()}/p</span>
      </div>
      <div class="kpi-cell">
        <span class="kpi-label">Tổng hệ số Đế chế</span>
        <span class="kpi-val is-amber">x${getRevenueMultiplier().toFixed(2)}</span>
      </div>
      <div class="kpi-cell">
        <span class="kpi-label">Chuyển sinh</span>
        <span class="kpi-val is-sky">Cấp ${gameState.prestigeLevel || 0} · ${gameState.prestigeMedals || 0} 🏅</span>
      </div>
      <div class="kpi-cell">
        <span class="kpi-label">Sự kiện giờ vàng</span>
        <span class="kpi-val">${evText}</span>
      </div>
    `;
  }

  renderHub() {
    document.querySelectorAll('.hub-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === this.activeTab);
    });
    this.renderHubKpiStrip();

    const body = this.els.hubBody;
    body.innerHTML = '';

    if (this.activeTab === 'upgrades') this.renderUpgradesTab(body);
    else if (this.activeTab === 'contracts') this.renderContractsTab(body);
    else if (this.activeTab === 'season') this.renderSeasonTab(body);
    else if (this.activeTab === 'locker') this.renderLockerTab(body);
    else if (this.activeTab === 'achievements') this.renderAchievementsTab(body);
    else if (this.activeTab === 'vip') this.renderVipTab(body);
  }

  renderUpgradesTab(root) {
    const sawTier = getSawmillVisualTier();
    const harborTier = getHarborVisualTier();
    const evoSec = document.createElement('section');
    evoSec.innerHTML = `
      <div class="section-heading">
        <h3>Kiến Trúc 3D Theo Cấp Độ</h3>
        <span>Tự động mở rộng silo, đèn pha &amp; hải đăng trên bản đồ 3D</span>
      </div>
      <div class="evo-summary-strip">
        <div class="evo-card">
          <div>
            <div class="card-title">🏭 Xưởng Cưa Công Nghiệp</div>
            <div class="card-meta">${sawTier === 1 ? 'Nâng Máy cưa cấp 3 hoặc Băng chuyền để lên Cấp 2' : sawTier === 2 ? 'Nâng Máy cưa cấp 5 hoặc Gỗ sấy cấp 4 để lên Cấp 3' : 'Đã lắp đặt Silo Hút Mùn &amp; Mái Năng Lượng Mặt Trời'}</div>
          </div>
          <div class="evo-tier-val tabular-nums">Cấp ${sawTier}/3</div>
        </div>
        <div class="evo-card">
          <div>
            <div class="card-title">🚢 Cảng Biển Thương Mại</div>
            <div class="card-meta">${harborTier === 1 ? 'Hoàn thành 2 Hợp đồng hoặc mua 2 Tàu để lên Cấp 2' : harborTier === 2 ? 'Hoàn thành 5 Hợp đồng hoặc mở Chi nhánh mới để lên Cấp 3' : 'Đã hoàn thiện Hải Đăng Xoay &amp; Tháp Điều Khiển'}</div>
          </div>
          <div class="evo-tier-val tabular-nums">Cấp ${harborTier}/3</div>
        </div>
      </div>
    `;
    root.appendChild(evoSec);

    // Star-Ranked Factory & Port Managers (1★-5★)
    const mgrSec = document.createElement('section');
    mgrSec.innerHTML = `<div class="section-heading"><h3>Quản Lý Xưởng &amp; Cảng Cấp Sao (1★–5★)</h3><span>Tăng tốc tự động hóa, sản lượng và giới hạn ngoại tuyến</span></div>`;
    const mgrGrid = document.createElement('div');
    mgrGrid.className = 'card-grid';

    for (const mgr of MANAGER_CATALOG) {
      const lv = getManagerLevel(mgr.id);
      const cost = getManagerCost(mgr);
      const stars = '★'.repeat(lv) + '☆'.repeat(mgr.maxStar - lv);
      const card = document.createElement('div');
      card.className = `hub-card ${lv > 0 ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-top">
            <div class="card-title-row">
              <span class="card-icon">${mgr.icon}</span>
              <div>
                <div class="card-title">${mgr.name}</div>
                <div class="card-meta">${mgr.role}</div>
              </div>
            </div>
            <div class="star-row" title="Cấp sao hiện tại">${stars}</div>
          </div>
          <p class="card-desc" style="margin-top:8px;">${lv === 0 ? `Chưa thuê · Nâng tối đa +${mgr.maxStar * Math.round(mgr.bonusPerStar * 100)}% hiệu suất.` : mgr.desc(lv)}</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${cost === null || gameState.cash < cost ? 'disabled' : ''}>
          ${cost === null ? 'Đạt 5★ Tối Đa' : lv === 0 ? `Thuê Quản lý · $${cost.toLocaleString()}` : `Nâng ${lv + 1}★ · $${cost.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (cost === null || gameState.cash < cost) return;
        gameState.cash -= cost;
        if (!gameState.managers) gameState.managers = {};
        gameState.managers[mgr.id] = lv + 1;
        addVipXp(30);
        sound.playUpgrade();
        this.toast(`⭐ Đã nâng ${mgr.name} lên ${lv + 1}★!`);
        if (this.cb.onUpgrade) this.cb.onUpgrade(mgr.id);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      mgrGrid.appendChild(card);
    }
    mgrSec.appendChild(mgrGrid);
    root.appendChild(mgrSec);
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
    // Timed VIP Rush Order Card
    const rush = gameState.vipRushOrder;
    const rushSec = document.createElement('section');
    rushSec.innerHTML = `<div class="section-heading"><h3>Đơn Hàng VIP Khẩn Cấp</h3><span>Giao trước khi hết giờ để nhận thưởng lớn + Đá quý</span></div>`;
    if (rush) {
      const canRush = gameState.planks >= rush.reqPlanks
        && gameState.pallets >= rush.reqPallets
        && gameState.cannedFish >= rush.reqCanned;
      const rushCash = Math.round(rush.rewardCash * getContractMultiplier());
      const rushCard = document.createElement('div');
      rushCard.className = 'hub-card is-value-highlight';
      rushCard.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">⚡ ${rush.title}</div>
            <div class="card-meta tabular-nums">
              Yêu cầu: ${rush.reqPlanks} Ván (${gameState.planks}) · ${rush.reqPallets} Pallet (${gameState.pallets}) · ${rush.reqCanned} Cá hộp (${gameState.cannedFish})
            </div>
            <div class="card-meta tabular-nums" style="color:#fda4af; margin-top:4px;" data-live-countdown="rush">
              Còn ${Math.max(0, Math.ceil(rush.timeLeft))}s
            </div>
          </div>
          <div class="tabular-nums" style="text-align:right; color:#34d399; font-weight:700;">
            +$${rushCash.toLocaleString()}<br><span style="color:#38bdf8;">+${rush.rewardGems} 💎</span>
          </div>
        </div>
        <button type="button" class="btn-primary" ${!canRush ? 'disabled' : ''}>
          ${canRush ? 'Giao Đơn VIP Khẩn Ngay' : 'Chưa đủ hàng trong kho — Tiếp tục sản xuất'}
        </button>
      `;
      rushCard.querySelector('button').addEventListener('click', () => {
        if (this.cb.onDeliverVipRush && this.cb.onDeliverVipRush()) {
          this.triggerCelebration('Hoàn thành Đơn VIP Khẩn Cấp!', `+$${rushCash.toLocaleString()} · +${rush.rewardGems} 💎`);
          this.renderHub();
        }
      });
      rushSec.appendChild(rushCard);
    } else {
      const waitCard = document.createElement('div');
      waitCard.className = 'hub-card';
      waitCard.innerHTML = `<div class="card-meta tabular-nums">Đơn VIP Khẩn Cấp tiếp theo sẽ cập cảng sau ${Math.max(1, Math.ceil(gameState.vipRushCooldown || 15))}s.</div>`;
      rushSec.appendChild(waitCard);
    }
    root.appendChild(rushSec);

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
            +$${Math.round(ct.rewardCash * getContractMultiplier()).toLocaleString()}<br><span style="color:#38bdf8;">+${ct.rewardGems} 💎</span>
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

    // Real-Time Commodity Market with SVG Sparkline Charts
    const mkSec = document.createElement('section');
    mkSec.innerHTML = `<div class="section-heading"><h3>Sàn Giao Dịch Hàng Hóa Trực Tiếp</h3><span>Giá thị trường biến động mỗi 18 giây · Canh đỉnh giá để bán</span></div>`;
    const mkGrid = document.createElement('div');
    mkGrid.className = 'market-grid';
    const mult = getRevenueMultiplier();

    for (const c of MARKET_COMMODITIES) {
      const entry = marketState.items[c.key];
      const stock = Math.floor(gameState[c.key] || 0);
      const unitPrice = Math.round(c.basePrice * entry.mult * mult);
      const pctDelta = Math.round((entry.mult - 1) * 100);
      const deltaClass = pctDelta >= 2 ? 'is-up' : pctDelta <= -2 ? 'is-down' : 'is-flat';
      const deltaLabel = pctDelta >= 0 ? `+${pctDelta}%` : `${pctDelta}%`;
      const totalValue = stock * unitPrice;

      // Build inline SVG sparkline points cleanly
      const hist = entry.history;
      const minV = 0.78;
      const maxV = 1.52;
      const points = hist.map((val, idx) => {
        const x = ((idx / Math.max(1, hist.length - 1)) * 200).toFixed(1);
        const y = (36 - ((val - minV) / (maxV - minV)) * 32).toFixed(1);
        return `${x},${y}`;
      }).join(' ');

      const card = document.createElement('div');
      card.className = 'market-card';
      card.innerHTML = `
        <div>
          <div class="card-title">${c.name}</div>
          <div class="card-meta tabular-nums">Trong kho: ${stock.toLocaleString()} ${c.unit}</div>
        </div>
        <div class="market-price-row">
          <span class="market-price tabular-nums">$${unitPrice.toLocaleString()} / ${c.unit}</span>
          <span class="market-delta ${deltaClass} tabular-nums">${deltaLabel}</span>
        </div>
        <div class="market-sparkline" aria-hidden="true">
          <svg viewBox="0 0 200 38" preserveAspectRatio="none">
            <polyline fill="none" stroke="${c.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
          </svg>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${stock <= 0 ? 'disabled' : ''}>
          ${stock > 0 ? `Bán hết (${stock}) · +$${totalValue.toLocaleString()}` : 'Kho đang trống'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (stock <= 0) return;
        if (this.cb.onSellCommodity && this.cb.onSellCommodity(c.key)) {
          this.renderHub();
        }
      });
      mkGrid.appendChild(card);
    }
    mkSec.appendChild(mkGrid);
    root.appendChild(mkSec);
  }

  drawLuckyWheelCanvas(canvas, rotAngle) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 6;
    const n = WHEEL_SEGMENTS.length;
    const arc = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotAngle);

    for (let i = 0; i < n; i++) {
      const seg = WHEEL_SEGMENTS[i];
      const start = i * arc;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.text;
      ctx.font = 'bold 11.5px "JetBrains Mono", monospace';
      ctx.fillText(seg.label, r - 12, 4);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  renderSeasonTab(root) {
    // 1. Limited-Time Golden Event Banner
    const ev = activeEventState.current;
    const evSec = document.createElement('section');
    evSec.innerHTML = `
      <div class="event-banner">
        <div>
          <div class="card-title">${ev ? `🌟 Sự Kiện: ${ev.name}` : '⏳ Chuẩn bị Sự Kiện Giờ Vàng tiếp theo'}</div>
          <div class="card-desc">${ev ? ev.desc : 'Đợi phiên thương mại mới kích hoạt trong giây lát.'}</div>
        </div>
        <div class="tabular-nums" style="font-weight:700; color:#38bdf8;" data-live-countdown="event">
          ${ev ? `Còn ${Math.max(0, Math.ceil(activeEventState.timeLeft))}s` : `Mở lại sau ${Math.max(0, Math.ceil(activeEventState.cooldown))}s`}
        </div>
      </div>
    `;
    root.appendChild(evSec);

    // 2. Lucky Wheel Stage
    const wheelSec = document.createElement('section');
    const freeReady = canFreeSpin();
    wheelSec.innerHTML = `
      <div class="section-heading"><h3>Vòng Quay May Mắn Thương Gia</h3><span>1 lượt miễn phí mỗi ngày hoặc quay thêm bằng Đá quý</span></div>
      <div class="wheel-stage">
        <div class="wheel-canvas-wrap">
          <canvas id="wheel-canvas" width="220" height="220"></canvas>
          <div class="wheel-pointer" aria-hidden="true"></div>
        </div>
        <div class="wheel-controls">
          <div class="card-title">Thử vận may nhận Quà Thương Mại</div>
          <p class="card-desc">Trúng trực tiếp Tiền mặt lớn, Đá quý, Điểm VIP hoặc Rìu Vàng x2 (40 giây).</p>
          <div id="wheel-result-text" class="card-meta tabular-nums">Nhấn quay để nhận thưởng ngẫu nhiên</div>
          <div class="wheel-btn-row">
            <button type="button" id="btn-spin-free" class="btn-primary" ${!freeReady || this.wheelSpinning ? 'disabled' : ''}>
              ${freeReady ? 'Quay Miễn Phí' : 'Đã quay hôm nay'}
            </button>
            <button type="button" id="btn-spin-gem" class="btn-gem" ${gameState.gems < 20 || this.wheelSpinning ? 'disabled' : ''}>
              Quay Nhanh · 20 💎
            </button>
          </div>
        </div>
      </div>
    `;
    root.appendChild(wheelSec);

    const wheelCanvas = wheelSec.querySelector('#wheel-canvas');
    this.drawLuckyWheelCanvas(wheelCanvas, this.wheelAngle);

    const startSpin = (useGems) => {
      if (this.wheelSpinning) return;
      if (useGems) {
        if (gameState.gems < 20) return;
        gameState.gems -= 20;
      } else {
        if (!canFreeSpin()) return;
        gameState.lastFreeSpinDate = todayIsoDate();
      }
      this.wheelSpinning = true;
      const btnFree = wheelSec.querySelector('#btn-spin-free');
      const btnGem = wheelSec.querySelector('#btn-spin-gem');
      if (btnFree) btnFree.disabled = true;
      if (btnGem) btnGem.disabled = true;

      const idx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      const n = WHEEL_SEGMENTS.length;
      const arc = (Math.PI * 2) / n;
      // Top pointer sits at -PI/2; align center of slice idx with -PI/2
      const targetMod = (-Math.PI / 2 - (idx + 0.5) * arc);
      const startAngle = this.wheelAngle;
      const extraSpins = Math.PI * 2 * 5;
      const endAngle = startAngle + extraSpins + (((targetMod - startAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
      const t0 = performance.now();
      const dur = 2400;

      const animateSpin = (now) => {
        const u = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - u, 3);
        this.wheelAngle = startAngle + (endAngle - startAngle) * eased;
        this.drawLuckyWheelCanvas(wheelCanvas, this.wheelAngle);
        if (u < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          this.wheelSpinning = false;
          const seg = WHEEL_SEGMENTS[idx];
          let detail = seg.label;
          if (seg.type === 'cash') {
            const cashWin = Math.round(seg.amount * Math.max(1, getRevenueMultiplier() * 0.45));
            gameState.cash += cashWin;
            recordRevenue('offline', cashWin);
            detail = `+$${cashWin.toLocaleString()} Cash`;
          } else if (seg.type === 'gems') {
            gameState.gems += seg.amount;
          } else if (seg.type === 'vip') {
            addVipXp(seg.amount);
          } else if (seg.type === 'boost') {
            gameState.boostTimer = Math.max(gameState.boostTimer || 0, seg.amount);
          }
          sound.playUpgrade();
          this.triggerCelebration('Vòng Quay May Mắn!', detail);
          saveGameServer();
          this.refreshHUD();
          if (this.activeTab === 'season' && !this.els.hubModal.hidden) {
            this.renderHub();
          }
        }
      };
      requestAnimationFrame(animateSpin);
    };

    wheelSec.querySelector('#btn-spin-free')?.addEventListener('click', () => startSpin(false));
    wheelSec.querySelector('#btn-spin-gem')?.addEventListener('click', () => startSpin(true));

    // 3. 7-Day Login Streak Check-In Grid
    const streakSec = document.createElement('section');
    const canCheckIn = canClaimDailyCheckIn();
    const claimedCount = gameState.loginStreakDay || 0;
    const nextDay = (claimedCount % 7) + 1;
    streakSec.innerHTML = `<div class="section-heading"><h3>Điểm Danh Thương Gia 7 Ngày</h3><span>Chuỗi hiện tại: ${claimedCount}/7 ngày</span></div>`;
    const streakGrid = document.createElement('div');
    streakGrid.className = 'checkin-grid';

    for (const d of DAILY_REWARDS) {
      const isClaimed = !canCheckIn ? d.day <= claimedCount : d.day <= (claimedCount === 7 ? 0 : claimedCount);
      const isToday = canCheckIn && d.day === nextDay;

      const box = document.createElement('div');
      box.className = `checkin-day ${isToday ? 'is-today' : isClaimed ? 'is-claimed' : ''}`;
      box.innerHTML = `
        <div class="checkin-day-title">${d.title}</div>
        <div class="checkin-day-icon">${d.icon}</div>
        <div class="checkin-day-reward tabular-nums">${d.label}</div>
        <button type="button" class="${isToday ? 'btn-primary' : 'btn-secondary'}" ${!isToday ? 'disabled' : ''}>
          ${isClaimed ? 'Đã nhận ✓' : isToday ? 'Nhận ngay' : 'Sắp tới'}
        </button>
      `;
      box.querySelector('button').addEventListener('click', () => {
        if (!isToday) return;
        const reward = claimDailyCheckIn();
        if (!reward) return;
        sound.playUpgrade();
        this.toast(`🎁 Điểm danh ${reward.title}: ${reward.label}`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      streakGrid.appendChild(box);
    }
    streakSec.appendChild(streakGrid);
    root.appendChild(streakSec);

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

  renderAchievementsTab(root) {
    // 1. Revenue Analytics Breakdown
    const stats = gameState.revenueStats || { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0 };
    const sources = [
      { key: 'sawmill', label: 'Xưởng Cưa & Pallet', color: '#f59e0b' },
      { key: 'contracts', label: 'Hợp Đồng Cảng Biển', color: '#10b981' },
      { key: 'market', label: 'Sàn Giao Dịch Gỗ', color: '#a855f7' },
      { key: 'fishery', label: 'Thủy Sản Cá Hộp', color: '#38bdf8' },
      { key: 'offline', label: 'Ngoại Tuyến & Thưởng', color: '#ec4899' }
    ];
    const totalRev = sources.reduce((sum, s) => sum + (stats[s.key] || 0), 0);
    const maxSource = Math.max(1, ...sources.map((s) => stats[s.key] || 0));

    const revSec = document.createElement('section');
    revSec.innerHTML = `
      <div class="section-heading"><h3>Thống Kê Doanh Thu Đế Chế</h3><span>Phân tích tỷ trọng nguồn thu thực tế</span></div>
      <div class="rev-analytics">
        <div class="rev-header">
          <span class="card-meta">Tổng doanh thu tích lũy</span>
          <span class="rev-total tabular-nums">$${totalRev.toLocaleString()}</span>
        </div>
        <div class="rev-bars">
          ${sources.map((s) => {
            const val = stats[s.key] || 0;
            const barPct = Math.round((val / maxSource) * 100);
            const sharePct = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
            return `
              <div class="rev-bar-row">
                <span class="rev-bar-label">${s.label}</span>
                <div class="rev-bar-track"><div class="rev-bar-fill" style="width:${barPct}%; background:${s.color};"></div></div>
                <span class="rev-bar-val tabular-nums">$${val.toLocaleString()} (${sharePct}%)</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    root.appendChild(revSec);

    // 2. Empire Achievements
    const achSec = document.createElement('section');
    const claimedList = gameState.claimedAchievements || [];
    achSec.innerHTML = `<div class="section-heading"><h3>Thành Tựu Đế Chế</h3><span>Đã hoàn thành ${claimedList.length}/${ACHIEVEMENTS.length} cột mốc</span></div>`;
    const achGrid = document.createElement('div');
    achGrid.className = 'card-grid';

    for (const ach of ACHIEVEMENTS) {
      const claimed = claimedList.includes(ach.id);
      const curVal = Math.floor(gameState[ach.statKey] || 0);
      const ready = isAchievementReady(ach);
      const pct = Math.min(100, Math.round((curVal / ach.target) * 100));

      const card = document.createElement('div');
      card.className = `hub-card ${claimed ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${ach.title}</div>
          <p class="card-desc" style="margin-top:4px;">${ach.desc}</p>
          <div class="card-meta tabular-nums" style="margin-top:6px;">
            Tiến độ: ${Math.min(curVal, ach.target).toLocaleString()}/${ach.target.toLocaleString()} · +$${ach.rewardCash.toLocaleString()} · +${ach.rewardGems}💎
          </div>
          <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <button type="button" class="${ready ? 'btn-primary' : 'btn-secondary'}" ${!ready ? 'disabled' : ''}>
          ${claimed ? 'Đã nhận thưởng ✓' : ready ? 'Nhận thưởng ngay' : 'Chưa đạt mốc'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (!ready) return;
        if (!Array.isArray(gameState.claimedAchievements)) gameState.claimedAchievements = [];
        gameState.claimedAchievements.push(ach.id);
        gameState.cash += ach.rewardCash;
        gameState.gems += ach.rewardGems;
        addVipXp(35);
        sound.playUpgrade();
        this.toast(`🏆 Mở khóa thành tựu "${ach.title}": +$${ach.rewardCash.toLocaleString()} & +${ach.rewardGems} 💎`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      achGrid.appendChild(card);
    }
    achSec.appendChild(achGrid);
    root.appendChild(achSec);
  }

  renderVipTab(root) {
    // 1. Empire Prestige / Rebirth Panel
    const prestigeReady = canPrestige();
    const rewardMedals = getPrestigeRewardMedals();
    const curMult = getPrestigeMultiplier();
    const nextMult = 1 + ((gameState.prestigeLevel || 0) + 1) * 0.35 + ((gameState.prestigeMedals || 0) + rewardMedals) * 0.04;

    const presSec = document.createElement('section');
    presSec.innerHTML = `
      <div class="section-heading"><h3>Chuyển Sinh Đế Chế (Prestige)</h3><span>Nhận Huy Hiệu Hoàng Kim &amp; hệ số thu nhập vĩnh viễn</span></div>
      <div class="prestige-panel">
        <div class="card-title">🏅 Cấp Chuyển Sinh ${gameState.prestigeLevel || 0} · ${gameState.prestigeMedals || 0} Huy Hiệu</div>
        <div class="prestige-stats-row tabular-nums">
          <span>Hệ số hiện tại: <b style="color:#fde68a;">x${curMult.toFixed(2)}</b></span>
          <span class="meta-sep" aria-hidden="true">·</span>
          <span>Sau chuyển sinh: <b style="color:#34d399;">x${nextMult.toFixed(2)} (+${rewardMedals} 🏅)</b></span>
        </div>
        <p class="card-desc">Điều kiện: Đạt Cấp 5, hoàn thành 3 Hợp đồng hoặc sở hữu $18,000. Khi Chuyển sinh, bạn giữ lại toàn bộ Đá quý, VIP, Skins, Thú cưng, Siêu xe và Thành tựu.</p>
        ${!this.prestigeConfirmOpen ? `
          <button type="button" id="btn-prestige-open" class="btn-primary" ${!prestigeReady ? 'disabled' : ''}>
            ${prestigeReady ? `Chuyển Sinh Ngay · Nhận +${rewardMedals} 🏅` : 'Chưa đủ điều kiện Chuyển sinh'}
          </button>
        ` : `
          <div class="prestige-confirm-box">
            <div class="card-desc" style="color:#fda4af;">Xác nhận Chuyển sinh? Tiền mặt, nâng cấp Xưởng và Quản lý sẽ làm mới để bắt đầu đế chế mạnh hơn.</div>
            <div style="display:flex; gap:8px;">
              <button type="button" id="btn-prestige-cancel" class="btn-secondary">Hủy bỏ</button>
              <button type="button" id="btn-prestige-confirm" class="btn-primary">Xác nhận Chuyển sinh</button>
            </div>
          </div>
        `}
      </div>
    `;
    presSec.querySelector('#btn-prestige-open')?.addEventListener('click', () => {
      if (!prestigeReady) return;
      this.prestigeConfirmOpen = true;
      this.renderHub();
    });
    presSec.querySelector('#btn-prestige-cancel')?.addEventListener('click', () => {
      this.prestigeConfirmOpen = false;
      this.renderHub();
    });
    presSec.querySelector('#btn-prestige-confirm')?.addEventListener('click', () => {
      const gained = performPrestige();
      if (!gained) return;
      this.prestigeConfirmOpen = false;
      sound.playShipHorn();
      this.triggerCelebration(`Chuyển Sinh Thành Công Cấp ${gameState.prestigeLevel}!`, `+${gained} Huy Hiệu Hoàng Kim · Hệ số x${getPrestigeMultiplier().toFixed(2)}`);
      if (this.cb.onPrestige) this.cb.onPrestige();
      saveGameServer(true);
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(presSec);

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
    gemSec.innerHTML = `<div class="section-heading"><h3>Kho Đá Quý &amp; Gói Thương Mại</h3><span>Dùng Đá quý để mở Vé Mùa, Skin &amp; Siêu xe</span></div>`;
    const gemGrid = document.createElement('div');
    gemGrid.className = 'card-grid';

    for (const pack of GEM_PACKS) {
      const isStarter = pack.id === 'pack_starter';
      const cashCost = pack.id === 'pack_merchant' ? 15000 : pack.id === 'pack_tycoon' ? 45000 : 0;
      const disabled = (isStarter && gameState.starterPackClaimed) || (!isStarter && gameState.cash < cashCost);

      const card = document.createElement('div');
      card.className = `hub-card ${pack.id === 'pack_tycoon' || isStarter ? 'is-value-highlight' : ''}`;
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
        this.triggerCelebration(`Nhận ${pack.name}!`, `+${pack.gems} 💎 · +${pack.vipXp} VIP XP`);
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
        if (!gameState.revenueStats) {
          gameState.revenueStats = { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0 };
        }
        if (!Array.isArray(gameState.claimedAchievements)) {
          gameState.claimedAchievements = [];
        }
        if (this.cb.onUpgrade) this.cb.onUpgrade('lumberjacks');
        if (this.cb.onSkinChange) this.cb.onSkinChange();
        if (this.cb.onPetChange) this.cb.onPetChange();
        if (this.cb.onVehicleChange) this.cb.onVehicleChange();
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
