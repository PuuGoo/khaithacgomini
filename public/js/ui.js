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
  YACHT_TIERS,
  AIRPORT_TIERS,
  ISLAND_STATION_TIERS,
  PLANES,
  LOGISTICS_TIERS,
  BADGE_CODEX,
  MILESTONE_QUESTS,
  activeEventState,
  marketState,
  comboState,
  auctionState,
  fleetMissionState,
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
  getLogisticsNextTier,
  getYachtNextTier,
  getAirportNextTier,
  getIslandNextTier,
  getSeaFleetCost,
  getAirFleetCost,
  getPlaneData,
  getBadgeRevenueBonus,
  evaluateBadgeUnlocks,
  getActiveMilestone,
  claimActiveMilestone,
  claimYachtYield,
  getCurrentLimitedCombo,
  purchaseLimitedCombo,
  settleAuctionLot,
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
    this.zenHud = false;
    this.lbFilter = 'global';
    this.wheelSpinning = false;
    this.wheelAngle = 0;
    this.prestigeConfirmOpen = false;
    this.celebrationTimer = null;
    this.currentControlMode = 'foot';

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
      fleetQuickStrip: document.getElementById('fleet-quick-strip'),
      btnQuickYacht: document.getElementById('btn-quick-yacht'),
      btnQuickPlane: document.getElementById('btn-quick-plane'),
      vehicleHud: document.getElementById('vehicle-hud'),
      vhudTitle: document.getElementById('vhud-title'),
      vhudSpeed: document.getElementById('vhud-speed'),
      vhudAlt: document.getElementById('vhud-alt'),
      vhudMission: document.getElementById('vhud-mission'),
      btnPlaneUp: document.getElementById('btn-plane-up'),
      btnPlaneDown: document.getElementById('btn-plane-down'),
      btnVehicleExit: document.getElementById('btn-vehicle-exit'),
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
    document.getElementById('btn-zen-hud')?.addEventListener('click', () => this.toggleZenHud());

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

    this.els.btnQuickYacht?.addEventListener('click', () => {
      if (this.cb.onBoardYacht) this.cb.onBoardYacht();
    });
    this.els.btnQuickPlane?.addEventListener('click', () => {
      if (this.cb.onBoardPlane) this.cb.onBoardPlane();
    });
    this.els.btnVehicleExit?.addEventListener('click', () => {
      if (this.cb.onDisembark) this.cb.onDisembark();
    });

    const bindHoldBtn = (el, handler) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handler(true);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => {
        el.addEventListener(ev, () => handler(false));
      });
    };
    bindHoldBtn(this.els.btnPlaneUp, (active) => this.cb.onPlaneClimb?.(active));
    bindHoldBtn(this.els.btnPlaneDown, (active) => this.cb.onPlaneDescend?.(active));

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

  toggleZenHud() {
    this.zenHud = !this.zenHud;
    document.body.classList.toggle('zen-hud', this.zenHud);
    const btn = document.getElementById('btn-zen-hud');
    if (btn) {
      btn.classList.toggle('is-zen-active', this.zenHud);
      btn.innerHTML = this.zenHud
        ? '<span>👁️</span><span>Mở HUD</span>'
        : '<span>👁️</span><span class="hide-sm">Gọn</span>';
    }
    this.toast(this.zenHud ? '👁️ Chế độ HUD siêu gọn (Nhấn Z để mở lại)' : 'Đã khôi phục đầy đủ HUD điều hành');
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

  renderMinimap(playerPos, playerYaw, trees, questTarget, extras = {}) {
    const ctx = this.els.minimapCtx;
    if (!ctx || this.minimapCollapsed || this.dockCollapsed) return;

    const w = 148;
    const h = 148;
    // Expanded Radar coordinates covering Forest, Airport East Peninsula, Bay & Offshore Island
    const minX = -54;
    const spanX = 140; // -54 .. +86
    const minZ = -44;
    const spanZ = 160; // -44 .. +116
    const toMapX = (wx) => ((wx - minX) / spanX) * w;
    const toMapY = (wz) => ((wz - minZ) / spanZ) * h;

    // Terrain & Ocean
    ctx.fillStyle = '#183624';
    ctx.fillRect(0, 0, w, h);

    const beachY = toMapY(22);
    ctx.fillStyle = '#a38954';
    ctx.fillRect(0, beachY, w, toMapY(26.5) - beachY);

    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, toMapY(26.5), w, h - toMapY(26.5));

    // Offshore Outpost Island (52, 92)
    const islX = toMapX(52);
    const islY = toMapY(92);
    ctx.fillStyle = (gameState.islandStationTier || 0) > 0 ? '#4d7c3f' : '#2f6845';
    ctx.strokeStyle = '#d9b978';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(islX, islY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sea & Air tactical dashed lanes
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.beginPath();
    ctx.moveTo(toMapX(14.5), toMapY(29));
    ctx.lineTo(toMapX(41), toMapY(86));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.beginPath();
    ctx.moveTo(toMapX(30), toMapY(-2));
    ctx.lineTo(islX, islY);
    ctx.lineTo(toMapX(2), toMapY(32));
    ctx.stroke();
    ctx.restore();

    // Asphalt roads
    ctx.fillStyle = '#334155';
    ctx.fillRect(toMapX(-25), toMapY(-6.5), toMapX(21) - toMapX(-25), 5);
    ctx.fillRect(toMapX(-1), toMapY(-6), 5, toMapY(26) - toMapY(-6));

    // Airport Runway (30, -2)
    const rwX = toMapX(25.4);
    const rwY = toMapY(-21);
    const rwW = Math.max(6, toMapX(34.6) - rwX);
    const rwH = Math.max(18, toMapY(17) - rwY);
    ctx.fillStyle = (gameState.airportTier || 0) > 0 ? '#1e293b' : 'rgba(30, 41, 59, 0.45)';
    ctx.fillRect(rwX, rwY, rwW, rwH);
    if ((gameState.airportTier || 0) > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rwX + rwW / 2, rwY + 2);
      ctx.lineTo(rwX + rwW / 2, rwY + rwH - 2);
      ctx.stroke();
    }

    // Sawmill building & Harbor Pier
    ctx.fillStyle = '#d97706';
    ctx.fillRect(toMapX(-6), toMapY(-19), 15, 11);
    ctx.fillStyle = '#92623a';
    ctx.fillRect(toMapX(-11), toMapY(24.5), 25, 13);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(toMapX(2), toMapY(29), 10, 6);

    // Harvestable alive trees
    if (trees && trees.length) {
      ctx.fillStyle = '#4ade80';
      for (const t of trees) {
        if (!t.alive) continue;
        ctx.fillRect(toMapX(t.pos.x) - 1.2, toMapY(t.pos.z) - 1.2, 2.4, 2.4);
      }
    }

    // Floating Sea Treasures (gold dots)
    if (extras.treasures && extras.treasures.length) {
      ctx.fillStyle = '#facc15';
      for (const tr of extras.treasures) {
        if (!tr.active) continue;
        ctx.beginPath();
        ctx.arc(toMapX(tr.pos.x), toMapY(tr.pos.z), 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fleet Mission Target Rings (Sea cyan / Air amber)
    const fms = extras.fleetMissionState || fleetMissionState;
    if (fms?.sea) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toMapX(fms.sea.targetX), toMapY(fms.sea.targetZ), 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (fms?.air) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toMapX(fms.air.targetX), toMapY(fms.air.targetZ), 6.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Active quest target beacon ring
    if (questTarget) {
      const qx = toMapX(questTarget.x);
      const qy = toMapY(questTarget.z);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(qx, qy, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Player / Yacht / Airplane directional cursor
    if (playerPos) {
      const px = toMapX(playerPos.x);
      const py = toMapY(playerPos.z);
      const mode = extras.controlMode || 'foot';
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-playerYaw + Math.PI);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;

      if (mode === 'plane') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -6.5);
        ctx.lineTo(1.8, -1.5);
        ctx.lineTo(6.5, 1.5);
        ctx.lineTo(1.6, 2.2);
        ctx.lineTo(1.2, 5.5);
        ctx.lineTo(-1.2, 5.5);
        ctx.lineTo(-1.6, 2.2);
        ctx.lineTo(-6.5, 1.5);
        ctx.lineTo(-1.8, -1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (mode === 'yacht') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(3.4, 1);
        ctx.lineTo(2.4, 5.5);
        ctx.lineTo(-2.4, 5.5);
        ctx.lineTo(-3.4, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -5.2);
        ctx.lineTo(4, 4.5);
        ctx.lineTo(-4, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
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

  updateVehicleHud(telemetry) {
    const mode = telemetry?.mode || 'foot';
    this.currentControlMode = mode;
    const isPilot = mode === 'yacht' || mode === 'plane';

    if (this.els.fleetQuickStrip) {
      this.els.fleetQuickStrip.hidden = isPilot;
    }
    if (!this.els.vehicleHud) return;

    if (!isPilot) {
      this.els.vehicleHud.hidden = true;
      return;
    }

    this.els.vehicleHud.hidden = false;
    this.els.vehicleHud.classList.toggle('is-air', mode === 'plane');
    if (this.els.vhudTitle) this.els.vhudTitle.textContent = telemetry.title || '';
    if (this.els.vhudSpeed) this.els.vhudSpeed.textContent = telemetry.speedDisplay || '0';
    if (this.els.vhudAlt) this.els.vhudAlt.textContent = telemetry.altDisplay || '0.0 m';
    if (this.els.vhudMission) this.els.vhudMission.textContent = telemetry.missionText || 'Tự do khám phá';
    if (this.els.btnPlaneUp) this.els.btnPlaneUp.hidden = mode !== 'plane';
    if (this.els.btnPlaneDown) this.els.btnPlaneDown.hidden = mode !== 'plane';
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
      const ms = getActiveMilestone();
      const msReady = ms && (gameState[ms.statKey] || 0) >= ms.target ? 1 : 0;
      const readyAch = getReadyAchievementCount() + msReady;
      this.els.badgeAch.textContent = readyAch;
      this.els.badgeAch.hidden = readyAch === 0;
    }

    // Quick-Board Fleet Strip lock visual cue
    const hasYacht = (gameState.yachtTier || 0) >= 1;
    const hasPlane = (gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    this.els.btnQuickYacht?.classList.toggle('is-locked', !hasYacht);
    this.els.btnQuickPlane?.classList.toggle('is-locked', !hasPlane);

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
      const aucSpan = this.els.hubBody?.querySelector('[data-live-countdown="auction"]');
      if (aucSpan) {
        aucSpan.textContent = auctionState.current
          ? `Còn ${Math.max(0, Math.ceil(auctionState.timeLeft))}s`
          : `Phiên mới sau ${Math.max(0, Math.ceil(auctionState.cooldown))}s`;
      }
      const comboSpan = this.els.hubBody?.querySelector('[data-live-countdown="combo"]');
      if (comboSpan) {
        const sec = Math.max(0, Math.ceil(comboState.timeLeft));
        const mm = String(Math.floor(sec / 60)).padStart(2, '0');
        const ss = String(sec % 60).padStart(2, '0');
        comboSpan.textContent = `${mm}:${ss}`;
      }
      const yachtYieldEl = this.els.hubBody?.querySelector('[data-live-yacht="yield"]');
      if (yachtYieldEl) {
        yachtYieldEl.textContent = `+$${Math.floor(gameState.yachtAccumCash || 0).toLocaleString()} · +${Math.floor(gameState.yachtAccumGems || 0)} 💎`;
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
    // 0. 3-Stage Supply-Chain Flow Visualizer (Rừng -> Xưởng -> Cảng)
    const bagCap = getBackpackCapacity();
    const forestBottleneck = gameState.logs >= bagCap;
    const sawBottleneck = gameState.sawmillBuffer <= 0 && (gameState.planks || 0) <= 0;
    const harborReady = (gameState.planks || 0) >= 4 || (gameState.pallets || 0) >= 1;
    const logsPerMin = Math.round(((gameState.lumberjacks || 0) * 14 + (gameState.logisticsTier || 0) * 12) * 1);
    const planksPerMin = Math.round((gameState.sawSpeedTier || 1) * 28);
    const yachtDef = YACHT_TIERS.find((y) => y.tier === (gameState.yachtTier || 0));

    const flowSec = document.createElement('section');
    flowSec.innerHTML = `
      <div class="section-heading">
        <h3>Sơ Đồ Luồng Chuỗi Cung Ứng</h3>
        <span>Theo dõi tồn kho, tốc độ luân chuyển và điểm nghẽn thực tế</span>
      </div>
      <div class="flow-visualizer">
        <div class="flow-node ${forestBottleneck ? 'is-bottleneck' : ''}">
          <div class="flow-node-head">
            <span class="flow-node-title">🌲 Lâm Trường</span>
            <span class="flow-node-rate tabular-nums">~${logsPerMin} gỗ/p</span>
          </div>
          <div class="flow-node-stat tabular-nums">Balo: ${gameState.logs}/${bagCap} · ${gameState.lumberjacks || 0} Thợ rừng</div>
          <div class="card-meta">${forestBottleneck ? 'Balo đầy — về Phễu Xưởng hoặc nâng Drone Logistics' : 'Hoạt động ổn định'}</div>
        </div>
        <div class="flow-connector" aria-hidden="true">→</div>
        <div class="flow-node ${sawBottleneck ? 'is-bottleneck' : ''}">
          <div class="flow-node-head">
            <span class="flow-node-title">⚙️ Xưởng Cưa &amp; Pallet</span>
            <span class="flow-node-rate tabular-nums">~${planksPerMin} ván/p</span>
          </div>
          <div class="flow-node-stat tabular-nums">Phễu: ${gameState.sawmillBuffer} gỗ · Kho: ${gameState.planks} ván · ${gameState.pallets} pallet</div>
          <button type="button" id="btn-flow-sell" class="btn-secondary" ${(gameState.planks + gameState.pallets) <= 0 ? 'disabled' : ''}>
            Bán nhanh tại Xưởng
          </button>
        </div>
        <div class="flow-connector" aria-hidden="true">→</div>
        <div class="flow-node">
          <div class="flow-node-head">
            <span class="flow-node-title">🚢 Cảng &amp; Du Thuyền</span>
            <span class="flow-node-rate tabular-nums">${gameState.autoForklifts || 0} Xe · ${Math.max(1, gameState.fishingBoats || 0)} Tàu</span>
          </div>
          <div class="flow-node-stat tabular-nums">Cá hộp: ${gameState.cannedFish} · Du thuyền: Cấp ${gameState.yachtTier || 0}/3</div>
          <button type="button" id="btn-flow-export" class="btn-primary" ${!harborReady ? 'disabled' : ''}>
            Xuất Hợp đồng ngay
          </button>
        </div>
      </div>
    `;
    flowSec.querySelector('#btn-flow-sell')?.addEventListener('click', () => {
      if (this.cb.onQuickSellSawmill) {
        this.cb.onQuickSellSawmill();
        this.renderHub();
      }
    });
    flowSec.querySelector('#btn-flow-export')?.addEventListener('click', () => {
      if (this.cb.onDeliverContract && this.cb.onDeliverContract(true)) {
        this.renderHub();
      }
    });
    root.appendChild(flowSec);

    // 1. Mạng Lưới Logistics & Tự Động Hóa Toàn Chuỗi + Bến Du Thuyền VIP
    const nextLogi = getLogisticsNextTier();
    const curLogiLv = gameState.logisticsTier || 0;
    const logiSec = document.createElement('section');
    logiSec.innerHTML = `
      <div class="section-heading">
        <h3>Mạng Lưới Logistics Toàn Chuỗi</h3>
        <span>Tự động gom phôi gỗ về Xưởng &amp; điều phối xuất Hợp đồng Cảng</span>
      </div>
      <div class="logistics-banner">
        <div style="flex:1; min-width:230px;">
          <div class="card-title">🤖 Logistics Cấp ${curLogiLv}/5 ${curLogiLv > 0 ? `· ${LOGISTICS_TIERS[curLogiLv - 1].name}` : '· Chưa kích hoạt'}</div>
          <div class="card-desc" style="margin-top:4px;">
            ${nextLogi ? `Cấp kế (${nextLogi.tier}): ${nextLogi.desc}` : 'Mạng lưới Logistics toàn chuỗi đã đạt công suất tối đa 100%.'}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; min-width:240px;">
          ${curLogiLv > 0 ? `
            <button type="button" id="btn-toggle-logi" class="btn-secondary" style="width:auto;">
              ${gameState.autoLogisticsEnabled ? 'Tự động: Đang BẬT' : 'Tự động: Đang TẮT'}
            </button>
          ` : ''}
          <button type="button" id="btn-up-logi" class="btn-primary tabular-nums" style="flex:1;" ${!nextLogi || gameState.cash < nextLogi.costCash ? 'disabled' : ''}>
            ${nextLogi ? `Nâng Cấp ${nextLogi.tier} · $${nextLogi.costCash.toLocaleString()}` : 'Đã Tối Đa (5/5)'}
          </button>
        </div>
      </div>
    `;
    logiSec.querySelector('#btn-toggle-logi')?.addEventListener('click', () => {
      gameState.autoLogisticsEnabled = !gameState.autoLogisticsEnabled;
      saveGameServer();
      this.toast(gameState.autoLogisticsEnabled ? '🤖 Đã bật Tự động hóa Logistics toàn chuỗi' : '⏸️ Đã tạm dừng Tự động hóa Logistics');
      this.renderHub();
    });
    logiSec.querySelector('#btn-up-logi')?.addEventListener('click', () => {
      if (!nextLogi || gameState.cash < nextLogi.costCash) return;
      gameState.cash -= nextLogi.costCash;
      gameState.logisticsTier = nextLogi.tier;
      addVipXp(35);
      sound.playUpgrade();
      evaluateBadgeUnlocks();
      this.toast(`🤖 Nâng cấp ${nextLogi.name} (Cấp ${nextLogi.tier})!`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(logiSec);

    // VIP Yacht Berth Card
    const nextYacht = getYachtNextTier();
    const curYachtLv = gameState.yachtTier || 0;
    const yCash = Math.floor(gameState.yachtAccumCash || 0);
    const yGems = Math.floor(gameState.yachtAccumGems || 0);
    const yachtSec = document.createElement('section');
    yachtSec.innerHTML = `
      <div class="section-heading">
        <h3>Bến Du Thuyền VIP Cảng Đông</h3>
        <span>Xuất hiện trực tiếp trên vịnh 3D &amp; sinh lợi nhuận du lịch thụ động</span>
      </div>
      <div class="yacht-berth-card">
        <div style="flex:1; min-width:230px;">
          <div class="card-title">🛥️ ${yachtDef ? `${yachtDef.name} (Cấp ${curYachtLv}/3)` : 'Chưa mở khóa Bến Du Thuyền'}</div>
          <div class="card-desc" style="margin-top:4px;">${nextYacht ? nextYacht.desc : 'Siêu du thuyền thượng lưu đang vận hành ở công suất cao nhất.'}</div>
          <div class="card-meta tabular-nums" style="margin-top:6px; color:#7dd3fc;">
            Quỹ tích lũy: <span data-live-yacht="yield">+$${yCash.toLocaleString()} · +${yGems} 💎</span>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; min-width:240px;">
          ${curYachtLv > 0 ? `
            <button type="button" id="btn-claim-yacht" class="btn-gem" style="width:auto;" ${yCash <= 0 && yGems <= 0 ? 'disabled' : ''}>
              Thu Hoạch Quỹ
            </button>
          ` : ''}
          <button type="button" id="btn-up-yacht" class="btn-primary tabular-nums" style="flex:1;" ${!nextYacht || gameState.cash < nextYacht.costCash ? 'disabled' : ''}>
            ${nextYacht ? `Mở Cấp ${nextYacht.tier} · $${nextYacht.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3'}
          </button>
        </div>
      </div>
    `;
    yachtSec.querySelector('#btn-claim-yacht')?.addEventListener('click', () => {
      const gained = claimYachtYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Hoạch Bến Du Thuyền!', `+$${gained.cash.toLocaleString()}${gained.gems > 0 ? ` · +${gained.gems} 💎` : ''}`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    yachtSec.querySelector('#btn-up-yacht')?.addEventListener('click', () => {
      if (!nextYacht || gameState.cash < nextYacht.costCash) return;
      gameState.cash -= nextYacht.costCash;
      gameState.yachtTier = nextYacht.tier;
      addVipXp(55);
      sound.playShipHorn();
      evaluateBadgeUnlocks();
      if (this.cb.onYachtChange) this.cb.onYachtChange();
      this.triggerCelebration(`Cập Bến ${nextYacht.name}!`, `Sinh +$${nextYacht.cashPer10s}/10s & cơ hội 💎`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(yachtSec);

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

    // Cargo Freight Auction House
    const auc = auctionState.current;
    const aucSec = document.createElement('section');
    aucSec.innerHTML = `<div class="section-heading"><h3>Sàn Đấu Giá Lô Hàng Cảng Biển</h3><span>Bán lô hàng giá cao hơn thị trường hoặc đấu giá kiện Đá quý</span></div>`;
    if (auc) {
      const isSell = auc.kind === 'sell';
      const stock = isSell ? Math.floor(gameState[auc.itemKey] || 0) : Math.floor(gameState.cash || 0);
      const canSettle = isSell ? stock >= auc.qty : stock >= auc.currentBid;
      const aucCard = document.createElement('div');
      aucCard.className = 'hub-card is-value-highlight';
      aucCard.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">🔨 ${auc.title}</div>
            <div class="card-meta tabular-nums">
              ${isSell
                ? `Giao lô: ${auc.qty} ${auc.itemLabel} (Trong kho: ${stock}) · ${auctionState.rivalBids} lượt trả giá cạnh tranh`
                : `Đặt cọc: $${auc.currentBid.toLocaleString()} Cash (Hiện có: $${stock.toLocaleString()})`}
            </div>
            <div class="card-meta tabular-nums" style="color:#7dd3fc; margin-top:4px;" data-live-countdown="auction">
              Còn ${Math.max(0, Math.ceil(auctionState.timeLeft))}s
            </div>
          </div>
          <div class="tabular-nums" style="text-align:right; font-weight:700; color:#34d399;">
            ${isSell ? `+$${auc.currentBid.toLocaleString()}` : `-$${auc.currentBid.toLocaleString()}`}<br>
            <span style="color:#38bdf8;">+${auc.rewardGems} 💎 · +${auc.rewardVipXp} VIP</span>
          </div>
        </div>
        <button type="button" class="btn-primary" ${!canSettle ? 'disabled' : ''}>
          ${canSettle ? (isSell ? 'Chốt Giá Bán Lô Hàng Ngay' : 'Đấu Giá Thắng Kiện Quý Ngay') : (isSell ? 'Kho chưa đủ số lượng lô' : 'Chưa đủ tiền mặt đấu giá')}
        </button>
      `;
      aucCard.querySelector('button').addEventListener('click', () => {
        const res = settleAuctionLot();
        if (!res.ok) {
          this.toast(res.reason);
          return;
        }
        sound.playShipHorn();
        const detail = res.kind === 'sell'
          ? `+$${res.cash.toLocaleString()} · +${res.gems} 💎`
          : `Nhận +${res.gems} 💎 (Chi $${res.spent.toLocaleString()})`;
        this.triggerCelebration(`Thắng Đấu Giá: ${res.title}`, detail);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      aucSec.appendChild(aucCard);
    } else {
      const waitAuc = document.createElement('div');
      waitAuc.className = 'hub-card';
      waitAuc.innerHTML = `<div class="card-meta tabular-nums" data-live-countdown="auction">Phiên đấu giá tiếp theo sẽ mở sau ${Math.max(1, Math.ceil(auctionState.cooldown))}s.</div>`;
      aucSec.appendChild(waitAuc);
    }
    root.appendChild(aucSec);

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
    const yachtLv = gameState.yachtTier || 0;
    const airportLv = gameState.airportTier || 0;
    const islandLv = gameState.islandStationTier || 0;
    const hasPlane = airportLv >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    const activePlane = getPlaneData();
    const activeYacht = YACHT_TIERS.find((y) => y.tier === yachtLv) || null;

    // 1. Flagship Fleet Showroom Hero Banner + SVG Technical Preview
    const heroSec = document.createElement('section');
    heroSec.innerHTML = `
      <div class="showroom-hero">
        <div class="showroom-hero-copy">
          <div class="store-hero-kicker">SHOWROOM HẠM ĐỘI THƯƠNG MẠI · BIỂN &amp; HÀNG KHÔNG</div>
          <div class="store-hero-title">Tổ Hợp Du Thuyền &amp; Cảng Hàng Không Đế Chế</div>
          <div class="card-meta tabular-nums">
            Du thuyền Cấp ${yachtLv}/3 · Sân bay Cấp ${airportLv}/3 · Đảo Tiền Đồn Cấp ${islandLv}/3
          </div>
          <div class="card-meta tabular-nums" style="color:#6ee7b7;">
            Kho báu biển: ${gameState.treasuresCollected || 0} · Đơn Biển: ${gameState.seaDeliveries || 0} · Đơn Không: ${gameState.airDeliveries || 0}
          </div>
          <div class="showroom-cta-row">
            <button type="button" id="btn-showroom-launch-yacht" class="${yachtLv > 0 ? 'btn-primary' : 'btn-secondary'}">
              ${yachtLv > 0 ? '🚤 Ra Khơi Lái Du Thuyền' : '🔒 Mở Bến Du Thuyền trước'}
            </button>
            <button type="button" id="btn-showroom-launch-plane" class="${hasPlane ? 'btn-gem' : 'btn-secondary'}">
              ${hasPlane ? `✈️ Cất Cánh (${activePlane.name})` : '🔒 Cần Đường Băng &amp; Máy Bay'}
            </button>
          </div>
        </div>
        <div class="showroom-svg-stage">
          <svg viewBox="0 0 260 96" aria-hidden="true">
            <path d="M8 74 Q 65 68 130 74 T 252 74" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-opacity="0.55"/>
            <!-- Yacht Silhouette -->
            <path d="M22 66 L108 66 L124 54 L32 54 Z" fill="#f8fafc"/>
            <path d="M40 54 L88 54 L78 44 L44 44 Z" fill="#38bdf8"/>
            <rect x="26" y="57" width="84" height="3" fill="#f59e0b"/>
            <!-- Cargo Jet Silhouette -->
            <path d="M138 30 L214 26 L236 32 L212 36 L142 36 Z" fill="#f59e0b"/>
            <path d="M168 30 L152 14 L172 14 L188 30 Z" fill="#fbbf24"/>
            <path d="M142 30 L132 18 L146 18 L152 30 Z" fill="#dc2626"/>
            <path d="M126 33 L86 33" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
          </svg>
          <div class="fleet-spec-line tabular-nums">
            ${activeYacht ? `🚤 ${activeYacht.name} (${activeYacht.speed} kts)` : '🚤 Chưa sở hữu Du thuyền'} · ${hasPlane ? `✈️ ${activePlane.speed} m/s` : '✈️ Chưa có Máy bay'}
          </div>
        </div>
      </div>
    `;
    heroSec.querySelector('#btn-showroom-launch-yacht')?.addEventListener('click', () => {
      if (yachtLv <= 0) {
        this.toast('Hãy nâng cấp Bến Du Thuyền VIP Cấp 1 ngay bên dưới!');
        return;
      }
      this.els.hubModal.hidden = true;
      this.cb.onBoardYacht?.();
    });
    heroSec.querySelector('#btn-showroom-launch-plane')?.addEventListener('click', () => {
      if (!hasPlane) {
        this.toast('Cần xây Đường Băng Cấp 1 và mua ít nhất 1 Máy Bay!');
        return;
      }
      this.els.hubModal.hidden = true;
      this.cb.onBoardPlane?.();
    });
    root.appendChild(heroSec);

    // 2. Infrastructure: Yacht Berth, Airport Runway & Offshore Island Outpost
    const infraSec = document.createElement('section');
    infraSec.innerHTML = `<div class="section-heading"><h3>Hạ Tầng Hàng Không, Hải Đảo &amp; Bến Du Thuyền</h3><span>Xây dựng công trình thực tế trên bản đồ 3D để mở tuyến giao thương mới</span></div>`;
    const infraGrid = document.createElement('div');
    infraGrid.className = 'card-grid';

    const nextYacht = getYachtNextTier();
    const nextAirport = getAirportNextTier();
    const nextIsland = getIslandNextTier();

    const infraCards = [
      {
        title: `🛥️ Bến Du Thuyền VIP (Cấp ${yachtLv}/3)`,
        meta: activeYacht ? `${activeYacht.name} · +$${activeYacht.cashPer10s}/10s` : 'Chưa mở khóa — mở để tự lái ra khơi săn kho báu',
        desc: nextYacht ? nextYacht.desc : 'Đã đạt siêu du thuyền cấp tối đa.',
        next: nextYacht,
        onUpgrade: () => {
          if (!nextYacht || gameState.cash < nextYacht.costCash) return;
          gameState.cash -= nextYacht.costCash;
          gameState.yachtTier = nextYacht.tier;
          addVipXp(55);
          sound.playShipHorn();
          evaluateBadgeUnlocks();
          this.cb.onYachtChange?.();
          this.triggerCelebration(`Mở ${nextYacht.name}!`, 'Nhấn nút 🚤 Du thuyền để tự lái ra khơi!');
        }
      },
      {
        title: `🛫 Đường Băng & Sân Bay (Cấp ${airportLv}/3)`,
        meta: airportLv > 0 ? `${AIRPORT_TIERS[airportLv - 1].name} · x${AIRPORT_TIERS[airportLv - 1].airMult.toFixed(2)} Thưởng` : 'Chưa xây Đường Băng Phía Đông',
        desc: nextAirport ? nextAirport.desc : 'Cảng hàng không Đế chế đã đạt quy mô tối đa.',
        next: nextAirport,
        onUpgrade: () => {
          if (!nextAirport || gameState.cash < nextAirport.costCash) return;
          gameState.cash -= nextAirport.costCash;
          gameState.airportTier = nextAirport.tier;
          addVipXp(60);
          sound.playTakeoff();
          this.cb.onAirportChange?.();
          this.triggerCelebration(`Hoàn Thành ${nextAirport.name}!`, 'Đường băng đã sẵn sàng cho máy bay cất cánh!');
        }
      },
      {
        title: `🏝️ Đảo Tiền Đồn Ngoài Khơi (Cấp ${islandLv}/3)`,
        meta: islandLv > 0 ? `${ISLAND_STATION_TIERS[islandLv - 1].name} · x${ISLAND_STATION_TIERS[islandLv - 1].tradeMult.toFixed(2)} Giao thương` : 'Xây cầu tàu & trạm tiếp liệu trên đảo xa',
        desc: nextIsland ? nextIsland.desc : 'Đặc khu giao thương Hải Đảo đã đạt cấp 3/3.',
        next: nextIsland,
        onUpgrade: () => {
          if (!nextIsland || gameState.cash < nextIsland.costCash) return;
          gameState.cash -= nextIsland.costCash;
          gameState.islandStationTier = nextIsland.tier;
          addVipXp(50);
          sound.playUpgrade();
          this.cb.onIslandChange?.();
          this.triggerCelebration(`Nâng Cấp ${nextIsland.name}!`, 'Mở tuyến giao hàng Biển & Không ra đảo thưởng lớn!');
        }
      }
    ];

    for (const ic of infraCards) {
      const card = document.createElement('div');
      card.className = `hub-card ${ic.next === null ? 'is-equipped' : 'is-value-highlight'}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${ic.title}</div>
          <div class="card-meta tabular-nums">${ic.meta}</div>
          <p class="card-desc" style="margin-top:6px;">${ic.desc}</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${!ic.next || gameState.cash < ic.next.costCash ? 'disabled' : ''}>
          ${ic.next ? `Xây Cấp ${ic.next.tier} · $${ic.next.costCash.toLocaleString()}` : 'Đã Đạt Tối Đa ✓'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        ic.onUpgrade();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      infraGrid.appendChild(card);
    }
    infraSec.appendChild(infraGrid);
    root.appendChild(infraSec);

    // 3. Automated Air & Sea Passive Fleet
    const autoSec = document.createElement('section');
    autoSec.innerHTML = `<div class="section-heading"><h3>Đội Bay &amp; Du Thuyền Tự Động</h3><span>Chạy tuần tra tự động 3D quanh vịnh &amp; tạo thu nhập thụ động mỗi phút</span></div>`;
    const autoGrid = document.createElement('div');
    autoGrid.className = 'card-grid';

    const seaCost = getSeaFleetCost();
    const airCost = getAirFleetCost();
    const autoCards = [
      {
        title: `🚤 Đội Du Thuyền Tự Lái (${gameState.autoSeaFleet || 0}/3)`,
        meta: `Thu nhập thụ động: +$${((gameState.autoSeaFleet || 0) * 320 * getRevenueMultiplier()).toLocaleString()}/phút`,
        desc: 'Thuê thuyền trưởng tự động chở khách du lịch vịnh & tuần tra giao thương biển.',
        cost: seaCost,
        lockedReason: yachtLv <= 0 ? 'Cần Bến Du Thuyền Cấp 1' : null,
        onHire: () => {
          if (seaCost === null || yachtLv <= 0 || gameState.cash < seaCost) return;
          gameState.cash -= seaCost;
          gameState.autoSeaFleet = (gameState.autoSeaFleet || 0) + 1;
          addVipXp(45);
          sound.playShipHorn();
          this.cb.onAutoFleetChange?.();
          this.toast(`🚤 Đã biên chế Du thuyền tự động #${gameState.autoSeaFleet}!`);
        }
      },
      {
        title: `✈️ Đội Bay Vận Tải Tự Động (${gameState.autoAirFleet || 0}/3)`,
        meta: `Thu nhập thụ động: +$${((gameState.autoAirFleet || 0) * 480 * getRevenueMultiplier()).toLocaleString()}/phút`,
        desc: 'Phi đội bay vận tải đường dài tự động cất cánh từ Đường Băng giao hàng đảo.',
        cost: airCost,
        lockedReason: airportLv <= 0 ? 'Cần Đường Băng Cấp 1' : null,
        onHire: () => {
          if (airCost === null || airportLv <= 0 || gameState.cash < airCost) return;
          gameState.cash -= airCost;
          gameState.autoAirFleet = (gameState.autoAirFleet || 0) + 1;
          addVipXp(55);
          sound.playTakeoff();
          this.cb.onAutoFleetChange?.();
          this.toast(`✈️ Đã biên chế Máy bay tự động #${gameState.autoAirFleet}!`);
        }
      }
    ];
    for (const ac of autoCards) {
      const card = document.createElement('div');
      card.className = 'hub-card';
      const disabled = Boolean(ac.lockedReason) || ac.cost === null || gameState.cash < ac.cost;
      card.innerHTML = `
        <div>
          <div class="card-title">${ac.title}</div>
          <div class="card-meta tabular-nums" style="color:#34d399;">${ac.meta}</div>
          <p class="card-desc" style="margin-top:6px;">${ac.desc}</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${disabled ? 'disabled' : ''}>
          ${ac.lockedReason ? ac.lockedReason : ac.cost === null ? 'Đủ Đội Hình 3/3 ✓' : `Thuê Thêm · $${ac.cost.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        ac.onHire();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      autoGrid.appendChild(card);
    }
    autoSec.appendChild(autoGrid);
    root.appendChild(autoSec);

    // 4. Airplane Showroom Catalog
    const planeSec = document.createElement('section');
    planeSec.innerHTML = `<div class="section-heading"><h3>Showroom Máy Bay Vận Tải VIP</h3><span>${airportLv === 0 ? 'Lưu ý: Hãy xây Đường Băng Cấp 1 ở trên để cất cánh!' : 'Chọn mẫu phi cơ 3D để trang bị & bay thả hàng siêu tốc'}</span></div>`;
    const planeGrid = document.createElement('div');
    planeGrid.className = 'card-grid';

    for (const p of PLANES) {
      const unlocked = (gameState.unlockedPlanes || []).includes(p.id);
      const equipped = unlocked && gameState.equippedPlane === p.id;
      const canAfford = p.costType === 'cash' ? gameState.cash >= p.cost : gameState.gems >= p.cost;
      const priceLabel = p.costType === 'cash' ? `$${p.cost.toLocaleString()}` : `${p.cost} 💎`;

      const card = document.createElement('div');
      card.className = `hub-card ${equipped ? 'is-equipped' : p.id === 'imperial_jet' ? 'is-value-highlight' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">✈️ ${p.name}</div>
          <div class="card-meta tabular-nums">Tốc độ ${p.speed} m/s · Leo cao ${p.climbRate} m/s · Thưởng x${p.cargoBonus.toFixed(2)}</div>
          <p class="card-desc" style="margin-top:6px;">${p.desc}</p>
        </div>
        <button type="button" class="${equipped ? 'btn-secondary' : unlocked ? 'btn-gem' : 'btn-primary'}" ${equipped || (!unlocked && !canAfford) ? 'disabled' : ''}>
          ${equipped ? 'Đang trong Hangar ✓' : unlocked ? 'Chọn phi cơ này' : `Mua Phi Cơ · ${priceLabel}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (equipped) return;
        if (!unlocked) {
          if (!canAfford) return;
          if (p.costType === 'cash') gameState.cash -= p.cost;
          else gameState.gems -= p.cost;
          if (!Array.isArray(gameState.unlockedPlanes)) gameState.unlockedPlanes = [];
          gameState.unlockedPlanes.push(p.id);
          addVipXp(p.costType === 'gems' ? p.cost * 2 : 55);
          sound.playTakeoff();
          this.triggerCelebration(`Sở Hữu ${p.name}!`, airportLv > 0 ? 'Đã sẵn sàng trên Đường Băng!' : 'Xây Đường Băng Cấp 1 để bay!');
        }
        gameState.equippedPlane = p.id;
        this.cb.onPlaneChange?.(p.id);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      planeGrid.appendChild(card);
    }
    planeSec.appendChild(planeGrid);
    root.appendChild(planeSec);

    // 5. Skins, Pets & Land Vehicles
    this.renderCosmeticSection(root, 'Trang phục Nhân vật (Skins)', SKINS, 'unlockedSkins', 'equippedSkin', (item) => {
      if (this.cb.onSkinChange) this.cb.onSkinChange(item);
    });
    this.renderCosmeticSection(root, 'Thú cưng Đồng hành 3D', PETS, 'unlockedPets', 'equippedPet', (item) => {
      if (this.cb.onPetChange) this.cb.onPetChange(item.id);
    });
    this.renderCosmeticSection(root, 'Siêu xe & Phương tiện Đường Bộ', VEHICLES, 'unlockedVehicles', 'equippedVehicle', (item) => {
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

    // 3. Tiered Milestone Quest Spotlight
    const ms = getActiveMilestone();
    const msSec = document.createElement('section');
    msSec.innerHTML = `<div class="section-heading"><h3>Nhiệm Vụ Cột Mốc Đế Chế</h3><span>Hoàn thành chuỗi cột mốc lớn để nhận VIP XP &amp; Đá quý vượt bậc</span></div>`;
    if (ms) {
      const curMsVal = Math.floor(gameState[ms.statKey] || 0);
      const msPct = Math.min(100, Math.round((curMsVal / ms.target) * 100));
      const msReady = curMsVal >= ms.target;
      const msCard = document.createElement('div');
      msCard.className = 'hub-card is-value-highlight';
      msCard.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">🚩 ${ms.title}</div>
            <div class="card-meta">${ms.desc}</div>
            <div class="card-meta tabular-nums" style="margin-top:4px;">Tiến độ: ${Math.min(curMsVal, ms.target).toLocaleString()}/${ms.target.toLocaleString()}</div>
          </div>
          <div class="tabular-nums" style="text-align:right; color:#34d399; font-weight:700;">
            +$${ms.rewardCash.toLocaleString()}<br>
            <span style="color:#38bdf8;">+${ms.rewardGems} 💎 · +${ms.rewardVipXp} VIP</span>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${msPct}%"></div></div>
        <button type="button" class="btn-primary" ${!msReady ? 'disabled' : ''}>
          ${msReady ? 'Nhận Thưởng Cột Mốc' : `Còn ${(ms.target - curMsVal).toLocaleString()} để hoàn thành`}
        </button>
      `;
      msCard.querySelector('button').addEventListener('click', () => {
        const claimed = claimActiveMilestone();
        if (!claimed) return;
        sound.playUpgrade();
        this.triggerCelebration(`Đạt ${claimed.title}!`, `+$${claimed.rewardCash.toLocaleString()} · +${claimed.rewardGems} 💎`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      msSec.appendChild(msCard);
    } else {
      const doneMs = document.createElement('div');
      doneMs.className = 'hub-card is-equipped';
      doneMs.innerHTML = `<div class="card-title">🎖️ Đã hoàn tất toàn bộ ${MILESTONE_QUESTS.length} Cột Mốc Đế Chế!</div>`;
      msSec.appendChild(doneMs);
    }
    root.appendChild(msSec);

    // 4. Collectible Badge Codex (Permanent Revenue Multiplier)
    evaluateBadgeUnlocks();
    const unlockedIds = gameState.unlockedBadges || [];
    const totalBonusPct = Math.round(getBadgeRevenueBonus() * 100);
    const codexSec = document.createElement('section');
    codexSec.innerHTML = `
      <div class="section-heading">
        <h3>Sổ Sưu Tập Huy Hiệu (${unlockedIds.length}/${BADGE_CODEX.length})</h3>
        <span>Tổng cộng dồn doanh thu vĩnh viễn: +${totalBonusPct}%</span>
      </div>
    `;
    const codexGrid = document.createElement('div');
    codexGrid.className = 'codex-grid';
    for (const b of BADGE_CODEX) {
      const isUnlocked = unlockedIds.includes(b.id);
      const tile = document.createElement('div');
      tile.className = `badge-tile ${isUnlocked ? 'is-unlocked' : ''}`;
      tile.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <span class="card-title">${b.icon} ${b.name}</span>
          <span class="badge-bonus-val tabular-nums">+${b.bonusPct}%</span>
        </div>
        <div class="card-desc">${b.conditionText}</div>
        <div class="card-meta" style="color:${isUnlocked ? '#34d399' : '#94a3b8'};">
          ${isUnlocked ? 'Đã sưu tập ✓' : 'Chưa mở khóa'}
        </div>
      `;
      codexGrid.appendChild(tile);
    }
    codexSec.appendChild(codexGrid);
    root.appendChild(codexSec);
  }

  renderVipTab(root) {
    // 0. Flagship Commercial Storefront Hero Banner (Hourly Limited Combo)
    const combo = getCurrentLimitedCombo();
    const isPurchased = comboState.purchasedId === combo.id;
    const secLeft = Math.max(0, Math.ceil(comboState.timeLeft));
    const mm = String(Math.floor(secLeft / 60)).padStart(2, '0');
    const ss = String(secLeft % 60).padStart(2, '0');
    const canBuyCombo = !isPurchased && (combo.costType === 'gems' ? gameState.gems >= combo.cost : gameState.cash >= combo.cost);

    const heroSec = document.createElement('section');
    heroSec.innerHTML = `
      <div class="store-hero-banner">
        <div class="store-hero-copy">
          <div class="store-hero-kicker">CỬA HÀNG ĐỘC QUYỀN · ${combo.subtitle.toUpperCase()}</div>
          <div class="store-hero-title">${combo.title}</div>
          <p class="card-desc">${combo.desc}</p>
          <div class="card-meta tabular-nums">
            Hạng mục: ${combo.badge} · Làm mới sau <span data-live-countdown="combo" style="color:#fbbf24; font-weight:700;">${mm}:${ss}</span>
          </div>
        </div>
        <div class="store-hero-cta">
          <button type="button" id="btn-buy-combo" class="btn-primary tabular-nums" ${!canBuyCombo ? 'disabled' : ''}>
            ${isPurchased ? 'Đã sở hữu trong phiên này ✓' : combo.costType === 'gems' ? `Mua Combo · ${combo.cost} 💎` : `Mua Combo · $${combo.cost.toLocaleString()}`}
          </button>
        </div>
      </div>
    `;
    heroSec.querySelector('#btn-buy-combo')?.addEventListener('click', () => {
      const res = purchaseLimitedCombo();
      if (!res.ok) {
        this.toast(res.reason);
        return;
      }
      sound.playUpgrade();
      this.triggerCelebration(`Sở Hữu ${res.combo.title}!`, `+${res.combo.rewardGems} 💎 · +${res.combo.rewardVipXp} VIP XP`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(heroSec);

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
    const netWorth = Math.round(
      (gameState.cash || 0)
      + (gameState.gems || 0) * 120
      + (gameState.yachtTier || 0) * 6500
      + (gameState.airportTier || 0) * 5500
      + (gameState.islandStationTier || 0) * 4800
      + (gameState.unlockedPlanes?.length || 0) * 4200
      + (gameState.logisticsTier || 0) * 3200
      + ((gameState.unlockedBranches?.length || 1) - 1) * 12000
    );
    const badgeCount = (gameState.unlockedBadges || []).length;

    const gfxCardHtml = gfx ? `
      <div class="hub-card">
        <div class="card-title">🛡️ Tối Ưu GPU &amp; Chống Tràn RAM (&lt;8GB RAM)</div>
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
      <div class="exec-profile-banner">
        <div>
          <div class="card-title">👔 Hồ Sơ Chủ Tịch: ${gameState.username || 'Chủ tịch'}</div>
          <div class="card-meta">${gameState.empireName || 'TimberPort Empire'} · ${getActiveBranch().name}</div>
        </div>
        <div class="exec-stat-grid tabular-nums">
          <div class="kpi-cell">
            <span class="kpi-label">Định giá Đế chế</span>
            <span class="kpi-val is-green">$${netWorth.toLocaleString()}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">VIP / Chuyển sinh</span>
            <span class="kpi-val is-amber">VIP ${gameState.vipLevel || 0} · P${gameState.prestigeLevel || 0}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Sổ Huy Hiệu</span>
            <span class="kpi-val is-sky">${badgeCount}/${BADGE_CODEX.length} (+${Math.round(getBadgeRevenueBonus() * 100)}%)</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Du thuyền / Đấu giá</span>
            <span class="kpi-val">Cấp ${gameState.yachtTier || 0} · ${gameState.totalAuctionsWon || 0} lô</span>
          </div>
        </div>
      </div>

      <div class="hub-card">
        <div class="card-title">Quản Lý Tên Đế Chế &amp; Lưu Đám Mây</div>
        <div class="form-stack" style="margin-top:8px;">
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
        if (!Array.isArray(gameState.unlockedBadges)) {
          gameState.unlockedBadges = [];
        }
        if (!Array.isArray(gameState.unlockedPlanes)) {
          gameState.unlockedPlanes = [];
        }
        if (this.cb.onUpgrade) this.cb.onUpgrade('lumberjacks');
        if (this.cb.onSkinChange) this.cb.onSkinChange();
        if (this.cb.onPetChange) this.cb.onPetChange();
        if (this.cb.onVehicleChange) this.cb.onVehicleChange();
        if (this.cb.onYachtChange) this.cb.onYachtChange();
        if (this.cb.onAirportChange) this.cb.onAirportChange();
        if (this.cb.onIslandChange) this.cb.onIslandChange();
        if (this.cb.onPlaneChange) this.cb.onPlaneChange();
        if (this.cb.onAutoFleetChange) this.cb.onAutoFleetChange();
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
    const onlinePlayers = this.cb.getOnlinePlayers ? this.cb.getOnlinePlayers() : [];
    const onlineCount = this.cb.getOnlineCount ? this.cb.getOnlineCount() : Math.max(1, onlinePlayers.length);
    this.els.lbSummary.textContent = `Đang có ${onlineCount} thương gia trực tuyến trong thế giới 3D`;
    this.els.lbBody.innerHTML = `<div class="card-meta">Đang tải dữ liệu bảng xếp hạng...</div>`;

    const globalList = await fetchLeaderboard();
    const renderRows = () => {
      this.els.lbBody.innerHTML = `
        <div class="lb-tabs">
          <button type="button" class="lb-tab-btn ${this.lbFilter === 'global' ? 'active' : ''}" data-lb-tab="global">Bảng Vàng Toàn Cầu (${globalList.length})</button>
          <button type="button" class="lb-tab-btn ${this.lbFilter === 'online' ? 'active' : ''}" data-lb-tab="online">Đang Trực Tuyến (${onlineCount})</button>
        </div>
      `;
      this.els.lbBody.querySelectorAll('[data-lb-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.lbFilter = btn.dataset.lbTab;
          renderRows();
        });
      });

      const source = this.lbFilter === 'online' ? onlinePlayers : globalList;
      if (!source.length) {
        const empty = document.createElement('div');
        empty.className = 'hub-card';
        empty.innerHTML = `
          <div class="card-title">Chưa có thương gia nào lưu bảng vàng</div>
          <p class="card-desc">Hãy mở Tài khoản và lưu tiến trình của bạn để trở thành người dẫn đầu đầu tiên!</p>
        `;
        this.els.lbBody.appendChild(empty);
        return;
      }

      const meName = (gameState.username || '').toLowerCase();
      source.forEach((entry, idx) => {
        const isMe = (entry.username || '').toLowerCase() === meName;
        const topClass = idx === 0 ? 'is-top-1' : idx === 1 ? 'is-top-2' : idx === 2 ? 'is-top-3' : '';
        const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const row = document.createElement('div');
        row.className = `lb-row ${topClass} ${isMe ? 'is-me' : ''}`;
        row.innerHTML = `
          <div>
            <div style="font-weight:700;">${rankIcon} · ${entry.empireName} ${isMe ? '(Bạn)' : ''}</div>
            <div class="card-meta tabular-nums">
              Chủ tịch: ${entry.username} · Cấp ${entry.level} · VIP ${entry.vipLevel || 0} · Chuyển sinh ${entry.prestigeLevel || 0} · Du thuyền ${entry.yachtTier || 0}
            </div>
          </div>
          <div class="tabular-nums" style="font-weight:700; color:#34d399;">$${Number(entry.money || 0).toLocaleString()}</div>
        `;
        this.els.lbBody.appendChild(row);
      });
    };

    renderRows();
  }
}
