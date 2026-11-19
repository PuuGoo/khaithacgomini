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
  ISLAND_RESORT_TIERS,
  HQ_TIERS,
  FURNITURE_MILL_TIERS,
  LIGHTHOUSE_TIERS,
  DEEP_PORT_TIERS,
  CONTAINER_ROUTES,
  INSURANCE_TIERS,
  FUTURES_TEMPLATES,
  GREEN_ENERGY_TIERS,
  RD_TECH_CATALOG,
  GLOBAL_FRANCHISES,
  BANK_LOAN_PACKAGES,
  REAL_ESTATE_CATALOG,
  FLEET_LIVERIES,
  ENGINE_MAX_TIER,
  STOCK_TICKERS,
  PLANES,
  LOGISTICS_TIERS,
  RAILWAY_TIERS,
  HELI_TIERS,
  WEATHER_PRESETS,
  BADGE_CODEX,
  MILESTONE_QUESTS,
  activeEventState,
  expoState,
  marketState,
  stockMarketState,
  carbonMarketState,
  stormState,
  revenueHistory,
  shiftSession,
  comboState,
  auctionState,
  fleetMissionState,
  metropolisState,
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
  hasPatent,
  getGreenCostReductionPct,
  getLogisticsNextTier,
  getRailwayNextTier,
  upgradeRailway,
  claimRailwayYield,
  triggerTrainExpressBoost,
  getHeliNextTier,
  getHeliData,
  getHeliEngineCost,
  upgradeHeli,
  claimHeliYield,
  getYachtNextTier,
  getAirportNextTier,
  getIslandNextTier,
  getHqNextTier,
  getHqMultiplierBonus,
  getResortNextTier,
  getFurnitureMillNextTier,
  getLighthouseNextTier,
  getLighthouseContractBonus,
  getDeepPortNextTier,
  upgradeDeepPort,
  dispatchContainerVoyage,
  claimContainerYield,
  getInsuranceNextTier,
  upgradeInsurance,
  signFuturesContract,
  settleFuturesContract,
  getGreenEnergyNextTier,
  upgradeGreenEnergy,
  sellCarbonCredits,
  unlockPatent,
  getCorporateCreditRating,
  getPnlStatement,
  getRoiRecommendations,
  recordPnlExpense,
  getFranchiseBonusPct,
  getFranchiseRoyaltyPer10s,
  getRealEstateIncomePer10s,
  craftFurnitureBatch,
  getEmpireNetWorth,
  getBankCreditLimit,
  takeBankLoan,
  repayBankLoan,
  getRealEstateCost,
  buyOrUpgradeRealEstate,
  claimFranchiseYield,
  claimRealEstateYield,
  unlockGlobalFranchise,
  deliverAllianceContract,
  getLiveryData,
  getYachtEngineCost,
  getPlaneEngineCost,
  getEngineSpeedMult,
  getEngineYieldMult,
  getSeaFleetCost,
  getAirFleetCost,
  getPlaneData,
  getBadgeRevenueBonus,
  evaluateBadgeUnlocks,
  getActiveMilestone,
  claimActiveMilestone,
  claimYachtYield,
  claimResortYield,
  claimDividendYield,
  getTotalPendingYields,
  collectAllEmpireYields,
  buyStock,
  sellStock,
  resetShiftSession,
  markNotificationsRead,
  logTransaction,
  hydrateLoadedState,
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
    this.subTabs = { upgrades: 'ops', contracts: 'orders', finance: 'markets', boardroom: 'global' };
    this.roiSortBy = 'payback';
    this.dockCollapsed = false;
    this.zenHud = false;
    this.lbFilter = 'global';
    this.notifFilter = 'all';
    this.liveryTarget = 'yacht';
    this.wheelSpinning = false;
    this.wheelAngle = 0;
    this.prestigeConfirmOpen = false;
    this.celebrationTimer = null;
    this.currentControlMode = 'foot';
    this.hubSearchQuery = '';

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
      valFurniture: document.getElementById('val-furniture'),
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
      stormAlertStrip: document.getElementById('storm-alert-strip'),
      stormAlertLabel: document.getElementById('storm-alert-label'),
      stormAlertTimer: document.getElementById('storm-alert-timer'),
      stormAlertReward: document.getElementById('storm-alert-reward'),
      actionPrompt: document.getElementById('action-prompt'),
      actionPromptKey: document.getElementById('action-prompt-key'),
      actionPromptLabel: document.getElementById('action-prompt-label'),
      fleetQuickStrip: document.getElementById('fleet-quick-strip'),
      btnCollectAll: document.getElementById('btn-collect-all'),
      btnCollectAllLabel: document.getElementById('btn-collect-all-label'),
      btnQuickSaw: document.getElementById('btn-quick-saw'),
      btnQuickFurn: document.getElementById('btn-quick-furn'),
      btnQuickExport: document.getElementById('btn-quick-export'),
      btnQuickTrain: document.getElementById('btn-quick-train'),
      btnQuickYacht: document.getElementById('btn-quick-yacht'),
      btnQuickHeli: document.getElementById('btn-quick-heli'),
      btnQuickPlane: document.getElementById('btn-quick-plane'),
      btnWeatherCycle: document.getElementById('btn-weather-cycle'),
      hudWeatherIcon: document.getElementById('hud-weather-icon'),
      hudClockTime: document.getElementById('hud-clock-time'),
      btnCameraMode: document.getElementById('btn-camera-mode'),
      hudCameraLabel: document.getElementById('hud-camera-label'),
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
      badgeNotif: document.getElementById('badge-notif'),
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
      hubTickerStrip: document.getElementById('hub-ticker-strip'),
      hubSearchInput: document.getElementById('hub-search-input'),
      btnHubSearchClear: document.getElementById('btn-hub-search-clear'),
      hubKpiStrip: document.getElementById('hub-kpi-strip'),
      hubBody: document.getElementById('hub-body'),
      notifDrawer: document.getElementById('notif-drawer'),
      notifList: document.getElementById('notif-list'),
      shiftModal: document.getElementById('shift-modal'),
      shiftBody: document.getElementById('shift-body'),
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

    this.els.hubSearchInput?.addEventListener('input', (e) => {
      this.hubSearchQuery = e.target.value || '';
      if (this.els.btnHubSearchClear) {
        this.els.btnHubSearchClear.hidden = !this.hubSearchQuery.trim();
      }
      this.applyHubSearchFilter();
    });

    this.els.btnHubSearchClear?.addEventListener('click', () => {
      this.hubSearchQuery = '';
      if (this.els.hubSearchInput) {
        this.els.hubSearchInput.value = '';
        this.els.hubSearchInput.focus();
      }
      if (this.els.btnHubSearchClear) this.els.btnHubSearchClear.hidden = true;
      this.applyHubSearchFilter();
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

    document.getElementById('btn-notifications')?.addEventListener('click', () => this.openNotifDrawer());
    document.getElementById('btn-close-notif')?.addEventListener('click', () => {
      if (this.els.notifDrawer) this.els.notifDrawer.hidden = true;
    });
    document.getElementById('btn-notif-read')?.addEventListener('click', () => {
      markNotificationsRead();
      this.refreshHUD();
      this.renderNotifList();
      this.toast('Đã đánh dấu toàn bộ thông báo là đã đọc');
    });
    document.querySelectorAll('.notif-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.notifFilter = btn.dataset.notifFilter || 'all';
        document.querySelectorAll('.notif-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
        this.renderNotifList();
      });
    });

    document.getElementById('btn-shift')?.addEventListener('click', () => this.openShiftModal());
    document.getElementById('btn-close-shift')?.addEventListener('click', () => {
      if (this.els.shiftModal) this.els.shiftModal.hidden = true;
    });

    this.els.stormAlertStrip?.addEventListener('click', () => {
      this.cb.onBoardStormVehicle?.();
    });

    this.els.btnCollectAll?.addEventListener('click', () => {
      const gained = collectAllEmpireYields();
      if (!gained) {
        this.toast('Chưa có quỹ lợi nhuận tích lũy để thu hoạch.');
        return;
      }
      sound.playCash();
      this.triggerCelebration('Thu Hoạch 1 Chạm Toàn Đế Chế!', `+$${gained.cash.toLocaleString()}${gained.gems > 0 ? ` · +${gained.gems} 💎` : ''}`);
      saveGameServer();
      this.refreshHUD();
      if (!this.els.hubModal.hidden) this.renderHub();
    });

    this.els.actionPrompt?.addEventListener('click', () => {
      if (this.cb.onContextAction) this.cb.onContextAction();
    });

    this.els.btnWeatherCycle?.addEventListener('click', () => {
      this.cb.onCycleWeather?.();
    });
    this.els.btnCameraMode?.addEventListener('click', () => {
      this.cb.onCycleCamera?.();
    });
    this.els.btnQuickSaw?.addEventListener('click', () => {
      this.cb.onQuickSawPallet?.();
    });
    this.els.btnQuickFurn?.addEventListener('click', () => {
      this.cb.onQuickCraftFurniture?.();
    });
    this.els.btnQuickExport?.addEventListener('click', () => {
      this.cb.onDeliverContract?.(true);
    });
    this.els.btnQuickTrain?.addEventListener('click', () => {
      this.cb.onTrainExpress?.();
    });
    this.els.btnQuickYacht?.addEventListener('click', () => {
      if (this.cb.onBoardYacht) this.cb.onBoardYacht();
    });
    this.els.btnQuickHeli?.addEventListener('click', () => {
      if (this.cb.onBoardHeli) this.cb.onBoardHeli();
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
    [this.els.hubModal, this.els.accountModal, this.els.lbModal, this.els.shiftModal, this.els.notifDrawer].forEach((modal) => {
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

    // Corporate HQ Plaza Building (15, 7)
    if ((gameState.hqTier || 0) > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(toMapX(12.5), toMapY(4.5), 6, 6);
    }

    // Luxury Furniture Factory (16, -24) & Coastal Lighthouse (-30, 26)
    if ((gameState.furnitureMillTier || 0) > 0) {
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(toMapX(13.5), toMapY(-26.5), 7, 5);
    }
    if ((gameState.lighthouseTier || 0) > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(toMapX(-30), toMapY(26), 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if ((gameState.deepPortTier || 0) > 0 || (gameState.greenEnergyTier || 0) > 0) {
      ctx.fillStyle = (gameState.greenEnergyTier || 0) > 0 ? '#34d399' : '#38bdf8';
      ctx.fillRect(toMapX(-25), toMapY(26.5), 11, 7);
    }

    // Industrial Coastal Railway Line (x = -19.5, z = -13..25.5)
    if ((gameState.railwayTier || 0) > 0) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toMapX(-19.5), toMapY(-13));
      ctx.lineTo(toMapX(-19.5), toMapY(25.5));
      ctx.stroke();
    }

    // VIP Helipad H (19.5, 15.5)
    if ((gameState.heliTier || 0) > 0) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(toMapX(19.5), toMapY(15.5), 3.6, 0, Math.PI * 2);
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

    // Storm Rescue Challenge Beacon Ring
    if (stormState.active) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(toMapX(stormState.targetX), toMapY(stormState.targetZ), 7.5, 0, Math.PI * 2);
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
      } else if (mode === 'heli') {
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
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
      || (this.els.shiftModal && !this.els.shiftModal.hidden)
      || (this.els.notifDrawer && !this.els.notifDrawer.hidden)
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

  triggerCelebration(title, detail, luxury = false) {
    const el = this.els.celebrationBanner;
    if (!el) return;
    el.classList.toggle('is-luxury', Boolean(luxury));
    this.els.celebrationTitle.textContent = title;
    this.els.celebrationDetail.textContent = detail;
    el.hidden = true;
    void el.offsetWidth;
    el.hidden = false;
    clearTimeout(this.celebrationTimer);
    this.celebrationTimer = setTimeout(() => {
      el.hidden = true;
    }, 2800);
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
    const isPilot = mode === 'yacht' || mode === 'plane' || mode === 'heli';
    const isAir = mode === 'plane' || mode === 'heli';

    if (this.els.fleetQuickStrip) {
      this.els.fleetQuickStrip.hidden = isPilot;
    }
    if (!this.els.vehicleHud) return;

    if (!isPilot) {
      this.els.vehicleHud.hidden = true;
      return;
    }

    this.els.vehicleHud.hidden = false;
    this.els.vehicleHud.classList.toggle('is-air', isAir);
    if (this.els.vhudTitle) this.els.vhudTitle.textContent = telemetry.title || '';
    if (this.els.vhudSpeed) this.els.vhudSpeed.textContent = telemetry.speedDisplay || '0';
    if (this.els.vhudAlt) this.els.vhudAlt.textContent = telemetry.altDisplay || '0.0 m';
    if (this.els.vhudMission) this.els.vhudMission.textContent = telemetry.missionText || 'Tự do khám phá';
    if (this.els.btnPlaneUp) this.els.btnPlaneUp.hidden = !isAir;
    if (this.els.btnPlaneDown) this.els.btnPlaneDown.hidden = !isAir;
  }

  refreshHUD() {
    const branch = getActiveBranch();
    this.els.hudBranch.textContent = branch.name;
    this.els.hudLevel.textContent = `Cấp ${gameState.level}`;
    this.els.hudUsername.textContent = gameState.username || 'Chủ tịch';

    // 24h Clock & Weather Top Bar Indicator
    if (this.els.hudClockTime || this.els.hudWeatherIcon) {
      const hr = gameState.worldClockHours ?? 10.5;
      const hh = String(Math.floor(hr) % 24).padStart(2, '0');
      const mm = String(Math.floor((hr % 1) * 60)).padStart(2, '0');
      const wMode = gameState.weatherMode || 'auto';
      const preset = WEATHER_PRESETS[wMode] || WEATHER_PRESETS.auto;
      let icon = preset.icon;
      if (wMode === 'auto') {
        if (stormState.active) icon = '⛈️';
        else if (hr >= 19.5 || hr < 5.0) icon = '🌙';
        else if (hr >= 16.5 && hr < 19.5) icon = '🌇';
        else if (hr >= 5.0 && hr < 7.5) icon = '🌅';
        else icon = '☀️';
      }
      if (this.els.hudWeatherIcon) this.els.hudWeatherIcon.textContent = icon;
      if (this.els.hudClockTime) this.els.hudClockTime.textContent = `${hh}:${mm}`;
    }

    if (this.els.hudCameraLabel && this.cb.getCameraMode) {
      const cm = this.cb.getCameraMode();
      const camNames = { follow: 'Theo chân', tactical: 'Chiến thuật', orbit: 'Điện ảnh', train: 'Tàu hỏa' };
      this.els.hudCameraLabel.textContent = camNames[cm] || 'Theo chân';
    }

    this.els.valCash.textContent = `$${Math.floor(gameState.cash).toLocaleString()}`;
    if (this.els.valCpm) {
      this.els.valCpm.textContent = `+$${getCashPerMinute().toLocaleString()}/p`;
    }
    this.els.valLogs.textContent = `${gameState.logs}/${getBackpackCapacity()}`;
    this.els.valPlanks.textContent = gameState.planks.toLocaleString();
    this.els.valPallets.textContent = gameState.pallets.toLocaleString();
    this.els.valCanned.textContent = gameState.cannedFish.toLocaleString();
    if (this.els.valFurniture) {
      this.els.valFurniture.textContent = (gameState.furniture || 0).toLocaleString();
    }
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

    // Quick-Board Fleet Strip lock visual cue & 1-Tap Collect All button
    const hasTrain = (gameState.railwayTier || 0) >= 1;
    const hasYacht = (gameState.yachtTier || 0) >= 1;
    const hasHeli = (gameState.heliTier || 0) >= 1;
    const hasPlane = (gameState.airportTier || 0) >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    this.els.btnQuickTrain?.classList.toggle('is-locked', !hasTrain);
    this.els.btnQuickYacht?.classList.toggle('is-locked', !hasYacht);
    this.els.btnQuickHeli?.classList.toggle('is-locked', !hasHeli);
    this.els.btnQuickPlane?.classList.toggle('is-locked', !hasPlane);

    const pendingCash = getTotalPendingYields();
    if (this.els.btnCollectAll) {
      this.els.btnCollectAll.hidden = pendingCash <= 0;
      if (this.els.btnCollectAllLabel && pendingCash > 0) {
        this.els.btnCollectAllLabel.textContent = `Thu Quỹ ($${pendingCash.toLocaleString()})`;
      }
    }

    // Notification badge
    if (this.els.badgeNotif) {
      const unread = gameState.unreadNotifications || 0;
      this.els.badgeNotif.textContent = unread > 9 ? '9+' : String(unread);
      this.els.badgeNotif.hidden = unread <= 0;
    }

    // Storm Rescue Challenge Strip
    if (this.els.stormAlertStrip) {
      if (stormState.active) {
        const sec = Math.max(0, Math.ceil(stormState.timeLeft));
        const mm = String(Math.floor(sec / 60)).padStart(2, '0');
        const ss = String(sec % 60).padStart(2, '0');
        this.els.stormAlertLabel.textContent = stormState.kind === 'air' ? '⛈️ Cứu trợ Bay' : '🌊 Cứu hộ Bão';
        this.els.stormAlertTimer.textContent = `${mm}:${ss}`;
        this.els.stormAlertReward.textContent = `+$${stormState.rewardCash.toLocaleString()} · +${stormState.rewardGems}💎`;
        this.els.stormAlertStrip.hidden = false;
      } else {
        this.els.stormAlertStrip.hidden = true;
      }
    }

    // Live-update Hub KPI strip, Electronic Ticker & active timers cleanly without rebuilding DOM mid-click
    if (this.els.hubModal && !this.els.hubModal.hidden) {
      this.renderHubKpiStrip();
      this.renderHubTicker();
      const evSpan = this.els.hubBody?.querySelector('[data-live-countdown="event"]');
      if (evSpan) {
        evSpan.textContent = activeEventState.current
          ? `Còn ${Math.max(0, Math.ceil(activeEventState.timeLeft))}s`
          : `Mở lại sau ${Math.max(0, Math.ceil(activeEventState.cooldown))}s`;
      }
      const expoSpan = this.els.hubBody?.querySelector('[data-live-countdown="expo"]');
      if (expoSpan) {
        expoSpan.textContent = expoState.current
          ? `Còn ${Math.max(0, Math.ceil(expoState.timeLeft))}s`
          : `Mở lại sau ${Math.max(0, Math.ceil(expoState.cooldown))}s`;
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
      const resortYieldEl = this.els.hubBody?.querySelector('[data-live-resort="yield"]');
      if (resortYieldEl) {
        resortYieldEl.textContent = `+$${Math.floor(gameState.resortAccumCash || 0).toLocaleString()} · +${Math.floor(gameState.resortAccumGems || 0)} 💎`;
      }
      const hqDivEl = this.els.hubBody?.querySelector('[data-live-hq="dividend"]');
      if (hqDivEl) {
        hqDivEl.textContent = `+$${Math.floor(gameState.pendingDividendCash || 0).toLocaleString()}`;
      }
      const franYieldEl = this.els.hubBody?.querySelector('[data-live-franchise="yield"]');
      if (franYieldEl) {
        franYieldEl.textContent = `+$${Math.floor(gameState.franchiseAccumCash || 0).toLocaleString()}`;
      }
      const reYieldEl = this.els.hubBody?.querySelector('[data-live-realestate="yield"]');
      if (reYieldEl) {
        reYieldEl.textContent = `+$${Math.floor(gameState.realEstateAccumCash || 0).toLocaleString()}`;
      }
      const contYieldEl = this.els.hubBody?.querySelector('[data-live-container="yield"]');
      if (contYieldEl) {
        contYieldEl.textContent = `+$${Math.floor(gameState.containerAccumCash || 0).toLocaleString()}`;
      }
      const railYieldEl = this.els.hubBody?.querySelector('[data-live-railway="yield"]');
      if (railYieldEl) {
        railYieldEl.textContent = `+$${Math.floor(gameState.railwayAccumCash || 0).toLocaleString()}`;
      }
      const trainBoostEl = this.els.hubBody?.querySelector('[data-live-countdown="train-boost"]');
      if (trainBoostEl) {
        trainBoostEl.textContent = (gameState.trainBoostTimer || 0) > 0
          ? `⚡ Đang tăng tốc (${Math.ceil(gameState.trainBoostTimer)}s)`
          : 'Sẵn sàng Kéo Còi Tăng Tốc';
      }
      const heliYieldEl = this.els.hubBody?.querySelector('[data-live-heli="yield"]');
      if (heliYieldEl) {
        heliYieldEl.textContent = `+$${Math.floor(gameState.heliAccumCash || 0).toLocaleString()} · +${Math.floor(gameState.heliAccumGems || 0)} 💎`;
      }
      const contCdEl = this.els.hubBody?.querySelector('[data-live-countdown="container"]');
      if (contCdEl && gameState.activeContainerVoyage) {
        const s = Math.max(0, Math.ceil(gameState.activeContainerVoyage.timeLeft));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        contCdEl.textContent = `Đang hải trình · ${mm}:${ss}`;
      }
      const carbonEl = this.els.hubBody?.querySelector('[data-live-carbon="credits"]');
      if (carbonEl) {
        carbonEl.textContent = `${(gameState.carbonCredits || 0).toFixed(1)} tín chỉ`;
      }
      if (Array.isArray(gameState.activeFutures)) {
        for (const fut of gameState.activeFutures) {
          const futEl = this.els.hubBody?.querySelector(`[data-live-futures="${fut.uid}"]`);
          if (futEl) {
            futEl.textContent = `Đáo hạn sau ${Math.max(0, Math.ceil(fut.timeLeft))}s`;
          }
        }
      }
      const chartCanvas = this.els.hubBody?.querySelector('#revenue-chart-canvas');
      if (chartCanvas && this.activeTab === 'finance') {
        this.drawRevenueChart(chartCanvas);
      }
    }
  }

  renderHubTicker() {
    const el = this.els.hubTickerStrip;
    if (!el) return;
    const parts = [];
    for (const c of MARKET_COMMODITIES) {
      const m = marketState.items[c.key];
      if (!m) continue;
      const pct = Math.round((m.mult - 1) * 100);
      const cls = pct >= 2 ? 'is-up' : pct <= -2 ? 'is-down' : 'is-flat';
      const shortName = c.key === 'planks' ? 'VÁN' : c.key === 'pallets' ? 'PALLET' : c.key === 'cannedFish' ? 'CÁ' : 'NỘI THẤT';
      parts.push(`<span class="ticker-item"><span class="ticker-sym">${shortName}</span> <span class="ticker-delta ${cls}">${pct >= 0 ? '+' : ''}${pct}%</span></span>`);
    }
    for (const s of STOCK_TICKERS) {
      const entry = stockMarketState.items[s.symbol];
      if (!entry) continue;
      const pct = entry.prevPrice > 0 ? ((entry.price - entry.prevPrice) / entry.prevPrice) * 100 : 0;
      const cls = pct >= 0.4 ? 'is-up' : pct <= -0.4 ? 'is-down' : 'is-flat';
      parts.push(`<span class="ticker-item"><span class="ticker-sym">${s.symbol}</span> $${entry.price.toLocaleString()} <span class="ticker-delta ${cls}">${pct >= 0 ? '▲' : '▼'}${Math.abs(pct).toFixed(1)}%</span></span>`);
    }
    const cPrev = carbonMarketState.prevPrice || carbonMarketState.price;
    const cPct = cPrev > 0 ? ((carbonMarketState.price - cPrev) / cPrev) * 100 : 0;
    const cCls = cPct >= 0.5 ? 'is-up' : cPct <= -0.5 ? 'is-down' : 'is-flat';
    parts.push(`<span class="ticker-item"><span class="ticker-sym">CRBN</span> $${carbonMarketState.price} <span class="ticker-delta ${cCls}">${cPct >= 0 ? '▲' : '▼'}${Math.abs(cPct).toFixed(1)}%</span></span>`);
    el.innerHTML = parts.join('');
  }

  applyHubSearchFilter() {
    const body = this.els.hubBody;
    if (!body) return;
    body.querySelector('.hub-empty-search')?.remove();

    const q = this.hubSearchQuery.trim().toLowerCase();
    const sections = Array.from(body.children);

    if (!q) {
      for (const sec of sections) {
        sec.hidden = false;
        sec.querySelectorAll('.hub-card, .market-card, .stock-card, .futures-card, .patent-card, .badge-tile, .season-row, .exec-table tbody tr').forEach((c) => {
          c.hidden = false;
        });
      }
      return;
    }

    let visibleCount = 0;
    for (const sec of sections) {
      if (sec.classList.contains('subtab-bar')) {
        sec.hidden = false;
        continue;
      }
      const cards = sec.querySelectorAll('.hub-card, .market-card, .stock-card, .futures-card, .patent-card, .badge-tile, .season-row, .exec-table tbody tr');
      if (cards.length > 0) {
        let secMatches = 0;
        cards.forEach((c) => {
          const match = (c.textContent || '').toLowerCase().includes(q);
          c.hidden = !match;
          if (match) {
            secMatches++;
            visibleCount++;
          }
        });
        sec.hidden = secMatches === 0;
      } else {
        const match = (sec.textContent || '').toLowerCase().includes(q);
        sec.hidden = !match;
        if (match) visibleCount++;
      }
    }

    if (visibleCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'hub-empty-search';
      empty.innerHTML = `
        <div class="card-title">Không tìm thấy hạng mục khớp "${this.hubSearchQuery.trim()}"</div>
        <div class="card-meta">Thử từ khóa khác hoặc chuyển sang tab khác để tìm kiếm.</div>
        <button type="button" id="btn-empty-clear-search" class="btn-secondary" style="width:auto;">Xóa bộ lọc tìm kiếm</button>
      `;
      empty.querySelector('#btn-empty-clear-search').addEventListener('click', () => {
        this.hubSearchQuery = '';
        if (this.els.hubSearchInput) this.els.hubSearchInput.value = '';
        if (this.els.btnHubSearchClear) this.els.btnHubSearchClear.hidden = true;
        this.applyHubSearchFilter();
      });
      body.appendChild(empty);
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
    this.renderHubTicker();

    const body = this.els.hubBody;
    body.innerHTML = '';

    if (this.activeTab === 'upgrades') this.renderUpgradesTab(body);
    else if (this.activeTab === 'contracts') this.renderContractsTab(body);
    else if (this.activeTab === 'finance') this.renderFinanceTab(body);
    else if (this.activeTab === 'boardroom') this.renderBoardroomTab(body);
    else if (this.activeTab === 'season') this.renderSeasonTab(body);
    else if (this.activeTab === 'locker') this.renderLockerTab(body);
    else if (this.activeTab === 'achievements') this.renderAchievementsTab(body);
    else if (this.activeTab === 'vip') this.renderVipTab(body);

    this.applyHubSearchFilter();
  }

  makeSubtabBar(tabKey, items) {
    const bar = document.createElement('div');
    bar.className = 'subtab-bar';
    const cur = this.subTabs[tabKey] || items[0].id;
    bar.innerHTML = items.map((it) => `
      <button type="button" class="subtab-btn ${cur === it.id ? 'active' : ''}" data-subtab="${it.id}">${it.label}</button>
    `).join('');
    bar.querySelectorAll('[data-subtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.subTabs[tabKey] = btn.dataset.subtab;
        this.renderHub();
      });
    });
    return bar;
  }

  renderUpgradesTab(root) {
    root.appendChild(this.makeSubtabBar('upgrades', [
      { id: 'ops', label: '⚙️ Chuỗi Xưởng & Cảng Nước Sâu' },
      { id: 'rd', label: '🔬 Trung Tâm R&D & Bằng Sáng Chế' }
    ]));

    if (this.subTabs.upgrades === 'rd') {
      const unlocked = Array.isArray(gameState.unlockedPatents) ? gameState.unlockedPatents : [];
      const rdSec = document.createElement('section');
      rdSec.innerHTML = `
        <div class="section-heading">
          <h3>Trung Tâm Nghiên Cứu R&amp;D &amp; Bằng Sáng Chế Độc Quyền</h3>
          <span class="tabular-nums">Đã sở hữu: ${unlocked.length}/${RD_TECH_CATALOG.length} Bằng sáng chế · Giữ vĩnh viễn sau Chuyển sinh</span>
        </div>
      `;
      const rdGrid = document.createElement('div');
      rdGrid.className = 'card-grid';

      for (const pat of RD_TECH_CATALOG) {
        const owned = unlocked.includes(pat.id);
        const canAfford = pat.costType === 'cash' ? gameState.cash >= pat.cost : gameState.gems >= pat.cost;
        const priceLabel = pat.costType === 'cash' ? `$${pat.cost.toLocaleString()}` : `${pat.cost} 💎`;
        const card = document.createElement('div');
        card.className = `patent-card ${owned ? 'is-owned' : ''}`;
        card.innerHTML = `
          <div>
            <div class="card-top">
              <div class="card-title-row">
                <span class="card-icon">${pat.icon}</span>
                <div>
                  <div class="card-title">${pat.name}</div>
                  <div class="card-meta">${pat.category} · <span style="color:#34d399;">${pat.bonusText}</span></div>
                </div>
              </div>
            </div>
            <p class="card-desc" style="margin-top:8px;">${pat.desc}</p>
          </div>
          <button type="button" class="${owned ? 'btn-secondary' : pat.costType === 'gems' ? 'btn-gem' : 'btn-primary'} tabular-nums" ${owned || !canAfford ? 'disabled' : ''}>
            ${owned ? 'Đã Cấp Bằng Sáng Chế ✓' : `Nghiên Cứu · ${priceLabel}`}
          </button>
        `;
        card.querySelector('button').addEventListener('click', () => {
          const res = unlockPatent(pat.id);
          if (!res.ok) return this.toast(res.reason);
          sound.playUpgrade();
          this.triggerCelebration(`Cấp Bằng Sáng Chế!`, `${pat.name} (${pat.bonusText})`, true);
          saveGameServer();
          this.refreshHUD();
          this.renderHub();
        });
        rdGrid.appendChild(card);
      }
      rdSec.appendChild(rdGrid);
      root.appendChild(rdSec);
      return;
    }

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
          <div class="flow-node-stat tabular-nums">Cá hộp: ${gameState.cannedFish} · Nội thất: ${gameState.furniture || 0} · Cảng sâu: Cấp ${gameState.deepPortTier || 0}/3</div>
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

    // 1. Mạng Lưới Logistics & Tự Động Hóa Toàn Chuỗi
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
      recordPnlExpense('upgradeSpend', nextLogi.costCash);
      addVipXp(35);
      sound.playUpgrade();
      evaluateBadgeUnlocks();
      this.toast(`🤖 Nâng cấp ${nextLogi.name} (Cấp ${nextLogi.tier})!`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(logiSec);

    // 1A-Rail. Industrial Railway & Freight Train Logistics (Phase 8 AAA)
    const railLv = gameState.railwayTier || 0;
    const railDef = RAILWAY_TIERS.find((r) => r.tier === railLv) || null;
    const nextRail = getRailwayNextTier();
    const railCash = Math.floor(gameState.railwayAccumCash || 0);
    const railSec = document.createElement('section');
    railSec.innerHTML = `
      <div class="section-heading">
        <h3>Tuyến Đường Sắt Công Nghiệp &amp; Tàu Hỏa Logistics 3D</h3>
        <span class="tabular-nums">Chạy dọc hành lang Tây kết nối Xưởng Cưa → Cảng Nước Sâu · <span data-live-countdown="train-boost">${(gameState.trainBoostTimer || 0) > 0 ? `⚡ Đang tăng tốc (${Math.ceil(gameState.trainBoostTimer)}s)` : 'Sẵn sàng Kéo Còi Tăng Tốc'}</span></span>
      </div>
      <div class="railway-banner">
        <div style="flex:1.2; min-width:240px;">
          <div class="card-title">🚂 ${railDef ? `${railDef.name} (Cấp ${railLv}/3)` : 'Chưa xây Tuyến Đường Sắt Công Nghiệp'}</div>
          <div class="card-desc" style="margin-top:4px;">${nextRail ? nextRail.desc : 'Tàu Hỏa Siêu Tốc Đế Chế đang vận chuyển Gỗ & Container liên tục ở công suất tối đa (+25% Hợp đồng Cảng).'}</div>
          <div class="card-meta tabular-nums" style="margin-top:6px; color:#fdba74;">
            Cước vận tải tích lũy: <span data-live-railway="yield">+$${railCash.toLocaleString()}</span>
            ${railDef ? ` · Cộng hưởng Hợp đồng Cảng: +${Math.round(railDef.contractBonus * 100)}%` : ''}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; min-width:260px;">
          ${railLv > 0 ? `
            <button type="button" id="btn-train-express" class="btn-secondary" style="width:auto;" ${(gameState.trainBoostTimer || 0) > 0 ? 'disabled' : ''}>
              🚂 Kéo Còi Tốc Hành
            </button>
            <button type="button" id="btn-claim-rail" class="btn-gem" style="width:auto;" ${railCash <= 0 ? 'disabled' : ''}>
              Thu Cước Tàu
            </button>
          ` : ''}
          <button type="button" id="btn-up-rail" class="btn-primary tabular-nums" style="flex:1;" ${!nextRail || gameState.cash < nextRail.costCash ? 'disabled' : ''}>
            ${nextRail ? `Xây Cấp ${nextRail.tier} · $${nextRail.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>
      </div>
    `;
    railSec.querySelector('#btn-train-express')?.addEventListener('click', () => {
      if (this.cb.onTrainExpress && this.cb.onTrainExpress()) {
        this.renderHub();
      }
    });
    railSec.querySelector('#btn-claim-rail')?.addEventListener('click', () => {
      const gained = claimRailwayYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Cước Đường Sắt Công Nghiệp!', `+$${gained.cash.toLocaleString()}`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    railSec.querySelector('#btn-up-rail')?.addEventListener('click', () => {
      const res = upgradeRailway();
      if (!res.ok) return this.toast(res.reason);
      sound.playTrainHorn();
      this.cb.onRailwayChange?.();
      this.triggerCelebration(`Khánh Thành ${res.tierDef.name}!`, `Sinh +$${res.tierDef.cashPer10s}/10s & +${Math.round(res.tierDef.contractBonus * 100)}% Hợp đồng Cảng`, true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(railSec);

    // 1B. Deep-Water Container Port & Mega Container Voyages
    const deepLv = gameState.deepPortTier || 0;
    const deepDef = DEEP_PORT_TIERS.find((d) => d.tier === deepLv) || null;
    const nextDeep = getDeepPortNextTier();
    const deepCash = Math.floor(gameState.containerAccumCash || 0);
    const activeVoyage = gameState.activeContainerVoyage;

    const deepSec = document.createElement('section');
    deepSec.innerHTML = `
      <div class="section-heading">
        <h3>Tàu Container Siêu Trọng &amp; Cảng Nước Sâu 3D</h3>
        <span class="tabular-nums">Hoàn tất: ${gameState.containerVoyagesCompleted || 0} chuyến · Cần cẩu Gantry tại Bến Tây</span>
      </div>
      <div class="deep-port-banner">
        <div style="flex:1.2; min-width:240px;">
          <div class="card-title">🏗️ ${deepDef ? `${deepDef.name} (Cấp ${deepLv}/3)` : 'Chưa xây Cảng Container Nước Sâu'}</div>
          <div class="card-desc" style="margin-top:4px;">${nextDeep ? nextDeep.desc : 'Siêu Cảng Container đang vận hành ở công suất cao nhất (x2.05 tuyến viễn dương).'}</div>
          <div class="card-meta tabular-nums" style="margin-top:6px; color:#7dd3fc;">
            Phí bốc dỡ tích lũy: <span data-live-container="yield">+$${deepCash.toLocaleString()}</span>
            ${activeVoyage ? ` · Đang chạy: <b>${activeVoyage.name}</b> (<span data-live-countdown="container">Còn ${Math.max(0, Math.ceil(activeVoyage.timeLeft))}s</span>)` : ''}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; min-width:260px;">
          ${deepLv > 0 ? `
            <button type="button" id="btn-toggle-auto-container" class="btn-secondary" style="width:auto;">
              ${gameState.autoDispatchContainer ? '🚢 Tự xuất bến: BẬT' : '🚢 Tự xuất bến: TẮT'}
            </button>
            <button type="button" id="btn-claim-deep" class="btn-gem" style="width:auto;" ${deepCash <= 0 ? 'disabled' : ''}>Thu Phí Bốc Dỡ</button>
          ` : ''}
          <button type="button" id="btn-up-deep" class="btn-primary tabular-nums" style="flex:1;" ${!nextDeep || gameState.cash < nextDeep.costCash ? 'disabled' : ''}>
            ${nextDeep ? `Xây Cấp ${nextDeep.tier} · $${nextDeep.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>
      </div>
    `;
    deepSec.querySelector('#btn-toggle-auto-container')?.addEventListener('click', () => {
      gameState.autoDispatchContainer = !gameState.autoDispatchContainer;
      saveGameServer();
      this.toast(gameState.autoDispatchContainer ? '🚢 Đã BẬT Tự động xuất bến Tàu Container khi đủ hàng!' : '⏸️ Đã TẮT Tự động xuất bến Tàu Container');
      this.renderHub();
    });
    deepSec.querySelector('#btn-claim-deep')?.addEventListener('click', () => {
      const gained = claimContainerYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Phí Bốc Dỡ Container!', `+$${gained.cash.toLocaleString()}`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    deepSec.querySelector('#btn-up-deep')?.addEventListener('click', () => {
      const res = upgradeDeepPort();
      if (!res.ok) return this.toast(res.reason);
      sound.playShipHorn();
      this.cb.onDeepPortChange?.();
      this.triggerCelebration(`Khánh Thành ${res.tierDef.name}!`, `Sinh +$${res.tierDef.royalty10s}/10s & mở chuyến Tàu Container siêu trọng`, true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });

    const routeGrid = document.createElement('div');
    routeGrid.className = 'card-grid';
    routeGrid.style.marginTop = '10px';
    const patContainer = hasPatent('pat_container') ? 1.3 : 1.0;
    for (const rt of CONTAINER_ROUTES) {
      const hasStock = gameState.planks >= rt.reqPlanks
        && gameState.pallets >= rt.reqPallets
        && gameState.cannedFish >= rt.reqCanned
        && (gameState.furniture || 0) >= rt.reqFurniture;
      const estCash = Math.round(rt.rewardCash * (deepDef ? deepDef.voyageMult : 1) * patContainer * getContractMultiplier());
      const canDispatch = deepLv > 0 && !activeVoyage && hasStock;
      const card = document.createElement('div');
      card.className = 'hub-card';
      card.innerHTML = `
        <div>
          <div class="card-title">🚢 ${rt.name}</div>
          <div class="card-meta tabular-nums" style="color:#34d399;">+$${estCash.toLocaleString()} · +${rt.rewardGems} 💎 · ${rt.durationSec}s hải trình</div>
          <div class="card-meta tabular-nums" style="margin-top:4px;">
            Ván: ${gameState.planks}/${rt.reqPlanks} · Pallet: ${gameState.pallets}/${rt.reqPallets} · Cá: ${gameState.cannedFish}/${rt.reqCanned}${rt.reqFurniture > 0 ? ` · Nội thất: ${gameState.furniture || 0}/${rt.reqFurniture}` : ''}
          </div>
          <p class="card-desc" style="margin-top:6px;">${rt.desc}</p>
        </div>
        <button type="button" class="btn-primary" ${!canDispatch ? 'disabled' : ''}>
          ${deepLv <= 0 ? 'Cần Cảng Nước Sâu Cấp 1' : activeVoyage ? 'Tàu Container đang chạy tuyến' : hasStock ? 'Xuất Bến Tàu Container' : 'Chưa đủ hàng đóng Container'}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        const res = dispatchContainerVoyage(rt.id);
        if (!res.ok) return this.toast(res.reason);
        sound.playShipHorn();
        this.toast(`🚢 Tàu Container đã xuất bến ${rt.name} (${rt.durationSec}s)!`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      routeGrid.appendChild(card);
    }
    deepSec.appendChild(routeGrid);
    root.appendChild(deepSec);

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
      recordPnlExpense('upgradeSpend', nextYacht.costCash);
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
    const millLv = gameState.furnitureMillTier || 0;
    const millDef = FURNITURE_MILL_TIERS.find((t) => t.tier === millLv) || null;
    const nextMill = getFurnitureMillNextTier();
    const lhLv = gameState.lighthouseTier || 0;
    const lhDef = LIGHTHOUSE_TIERS.find((l) => l.tier === lhLv) || null;
    const nextLh = getLighthouseNextTier();

    const p6Sec = document.createElement('section');
    p6Sec.innerHTML = `
      <div class="section-heading">
        <h3>Nhà Máy Chế Biến Nội Thất &amp; Hải Đăng Dẫn Đường 3D</h3>
        <span>Gia tăng giá trị gỗ x3–x4 và khuếch đại thưởng Hợp đồng Cảng &amp; Liên minh</span>
      </div>
      <div class="card-grid">
        <div class="hub-card ${millLv > 0 ? 'is-equipped' : 'is-value-highlight'}">
          <div>
            <div class="card-title">🛋️ ${millDef ? `${millDef.name} (Cấp ${millLv}/3)` : 'Nhà Máy Gỗ Cao Cấp & Nội Thất (Chưa xây)'}</div>
            <div class="card-meta tabular-nums" style="color:#fda4af;">
              Tồn kho: ${gameState.furniture || 0} Bộ (${gameState.totalFurnitureCrafted || 0} đã chế tác)
            </div>
            <p class="card-desc" style="margin-top:6px;">
              ${nextMill ? `Cấp kế (${nextMill.tier}): ${nextMill.desc}` : 'Nhà máy Nội thất Hoàng gia đang tự động chế tác ở công suất cao nhất.'}
            </p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${millLv > 0 ? `<button type="button" id="btn-craft-furniture" class="btn-secondary" style="width:auto;">🔨 Chế Tác Tay</button>` : ''}
            <button type="button" id="btn-up-mill" class="btn-primary tabular-nums" style="flex:1;" ${!nextMill || gameState.cash < nextMill.costCash ? 'disabled' : ''}>
              ${nextMill ? `Xây Cấp ${nextMill.tier} · $${nextMill.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
            </button>
          </div>
        </div>

        <div class="hub-card ${lhLv > 0 ? 'is-equipped' : 'is-value-highlight'}">
          <div>
            <div class="card-title">🚨 ${lhDef ? `${lhDef.name} (Cấp ${lhLv}/3)` : 'Hải Đăng Vùng Biển Cảng Tây (Chưa xây)'}</div>
            <div class="card-meta tabular-nums" style="color:#fde68a;">
              Hỗ trợ Hợp đồng &amp; Liên minh: +${Math.round(getLighthouseContractBonus() * 100)}% thưởng
            </div>
            <p class="card-desc" style="margin-top:6px;">
              ${nextLh ? `Cấp kế (${nextLh.tier}): ${nextLh.desc}` : 'Hải đăng Đế chế chiếu sáng toàn vịnh, tối ưu 100% đường biển.'}
            </p>
          </div>
          <button type="button" id="btn-up-lighthouse" class="btn-primary tabular-nums" ${!nextLh || gameState.cash < nextLh.costCash ? 'disabled' : ''}>
            ${nextLh ? `Xây Cấp ${nextLh.tier} · $${nextLh.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>
      </div>
    `;
    p6Sec.querySelector('#btn-craft-furniture')?.addEventListener('click', () => {
      const res = craftFurnitureBatch(true);
      if (!res.ok) return this.toast(res.reason);
      sound.playUpgrade();
      this.toast(`🛋️ Đã chế tác thủ công +${res.produced} Bộ Nội thất Xuất khẩu!`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    p6Sec.querySelector('#btn-up-mill')?.addEventListener('click', () => {
      if (!nextMill || gameState.cash < nextMill.costCash) return;
      gameState.cash -= nextMill.costCash;
      gameState.furnitureMillTier = nextMill.tier;
      recordPnlExpense('upgradeSpend', nextMill.costCash);
      addVipXp(55);
      sound.playUpgrade();
      logTransaction('fleet', `Khánh thành ${nextMill.name} (Cấp ${nextMill.tier})`, -nextMill.costCash, 0);
      this.cb.onFurnitureMillChange?.();
      this.triggerCelebration(`Xây Dựng ${nextMill.name}!`, 'Tự động chế biến Ván & Pallet thành Nội thất giá cao', true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    p6Sec.querySelector('#btn-up-lighthouse')?.addEventListener('click', () => {
      if (!nextLh || gameState.cash < nextLh.costCash) return;
      gameState.cash -= nextLh.costCash;
      gameState.lighthouseTier = nextLh.tier;
      recordPnlExpense('upgradeSpend', nextLh.costCash);
      addVipXp(50);
      sound.playShipHorn();
      logTransaction('fleet', `Dựng ${nextLh.name} (Cấp ${nextLh.tier})`, -nextLh.costCash, 0);
      this.cb.onLighthouseChange?.();
      this.triggerCelebration(`Thắp Sáng ${nextLh.name}!`, `Tăng +${Math.round(nextLh.contractBonus * 100)}% thưởng Hợp đồng Cảng`, true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(p6Sec);

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
        recordPnlExpense('upgradeSpend', cost);
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
          recordPnlExpense('upgradeSpend', cost);
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
    root.appendChild(this.makeSubtabBar('contracts', [
      { id: 'orders', label: '🚢 Đơn Hàng & Liên Minh' },
      { id: 'futures', label: '📜 Phái Sinh & Bảo Hiểm' },
      { id: 'market', label: '📊 Sàn Hàng Hóa & Chi Nhánh' }
    ]));

    if (this.subTabs.contracts === 'futures') {
      const insLv = gameState.insuranceTier || 0;
      const insDef = INSURANCE_TIERS.find((i) => i.tier === insLv) || null;
      const nextIns = getInsuranceNextTier();
      const insSec = document.createElement('section');
      insSec.innerHTML = `
        <div class="section-heading">
          <h3>Bảo Hiểm Hàng Hải &amp; Phòng Hộ Rủi Ro</h3>
          <span class="tabular-nums">Đã bồi hoàn tổng: +$${Math.round(gameState.insuranceSavedCash || 0).toLocaleString()}</span>
        </div>
        <div class="deep-port-banner">
          <div style="flex:1.2; min-width:240px;">
            <div class="card-title">🛡️ ${insDef ? `${insDef.name} (Cấp ${insLv}/3)` : 'Chưa kích hoạt Bảo Hiểm Hàng Hải'}</div>
            <div class="card-desc" style="margin-top:4px;">${nextIns ? nextIns.desc : 'Quỹ Bảo Chứng Rủi Ro Đế Chế đang bảo vệ tối đa 90% mọi chuyến hàng & bão biển.'}</div>
            <div class="card-meta tabular-nums" style="margin-top:6px; color:#34d399;">
              ${insDef ? `Bảo vệ: ${insDef.protectionPct}% giá trị · Giảm phí đòn bẩy: ${insDef.discountFeePct}%` : 'Mở khóa để tự động bồi hoàn khi bão biển hoặc hợp đồng tương lai quá hạn.'}
            </div>
          </div>
          <button type="button" id="btn-up-insurance" class="btn-primary tabular-nums" style="width:auto;" ${!nextIns || gameState.cash < nextIns.costCash ? 'disabled' : ''}>
            ${nextIns ? `Nâng Cấp ${nextIns.tier} · $${nextIns.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>
      `;
      insSec.querySelector('#btn-up-insurance')?.addEventListener('click', () => {
        const res = upgradeInsurance();
        if (!res.ok) return this.toast(res.reason);
        sound.playUpgrade();
        this.triggerCelebration(`Kích Hoạt ${res.tierDef.name}!`, `Bảo vệ ${res.tierDef.protectionPct}% rủi ro hàng hải`, true);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      root.appendChild(insSec);

      const activeFut = Array.isArray(gameState.activeFutures) ? gameState.activeFutures : [];
      const futActiveSec = document.createElement('section');
      futActiveSec.innerHTML = `
        <div class="section-heading">
          <h3>Hợp Đồng Tương Lai Đang Chạy (${activeFut.length}/2)</h3>
          <span class="tabular-nums">Đã tất toán thành công: ${gameState.futuresCompleted || 0} hợp đồng</span>
        </div>
      `;
      if (activeFut.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'hub-card';
        emptyCard.innerHTML = `<div class="card-meta">Chưa có Hợp đồng Tương lai đang mở. Chọn một kỳ hạn bên dưới để khóa giá bán cao hơn thị trường +48% đến +85%.</div>`;
        futActiveSec.appendChild(emptyCard);
      } else {
        const aGrid = document.createElement('div');
        aGrid.className = 'card-grid';
        for (const fut of activeFut) {
          const stock = Math.floor(gameState[fut.itemKey] || 0);
          const ready = stock >= fut.qty;
          const card = document.createElement('div');
          card.className = 'futures-card is-value-highlight';
          card.innerHTML = `
            <div class="card-top">
              <div>
                <div class="card-title">📜 ${fut.name}</div>
                <div class="card-meta tabular-nums">Trong kho: ${stock}/${fut.qty} ${fut.itemLabel}</div>
                <div class="card-meta tabular-nums" style="color:#fde68a; margin-top:4px;" data-live-futures="${fut.uid}">
                  Còn ${Math.max(0, Math.ceil(fut.timeLeft))}s · Giao ${fut.qty} ${fut.itemLabel}
                </div>
              </div>
              <div class="tabular-nums" style="text-align:right; font-weight:700; color:#34d399;">
                +$${fut.lockedCash.toLocaleString()}<br><span style="color:#38bdf8;">+${fut.rewardGems} 💎</span>
              </div>
            </div>
            <button type="button" class="btn-primary" ${!ready ? 'disabled' : ''}>
              ${ready ? 'Tất Toán Sớm & Nhận Tiền Ngay' : `Cần thêm ${Math.max(0, fut.qty - stock)} ${fut.itemLabel}`}
            </button>
          `;
          card.querySelector('button').addEventListener('click', () => {
            const res = settleFuturesContract(fut.uid, false);
            if (!res.ok) return this.toast(res.reason);
            sound.playCash();
            this.triggerCelebration(`Tất Toán ${res.name}!`, `+$${res.cash.toLocaleString()} · +${res.gems} 💎`, true);
            saveGameServer();
            this.refreshHUD();
            this.renderHub();
          });
          aGrid.appendChild(card);
        }
        futActiveSec.appendChild(aGrid);
      }
      root.appendChild(futActiveSec);

      const tplSec = document.createElement('section');
      tplSec.innerHTML = `<div class="section-heading"><h3>Sàn Ký Kết Hợp Đồng Tương Lai</h3><span>Khóa trước giá xuất khẩu cao · Tự tất toán khi đáo hạn nếu đủ hàng</span></div>`;
      const tplGrid = document.createElement('div');
      tplGrid.className = 'card-grid';
      const patHedge = hasPatent('pat_fin_hedge') ? 1.18 : 1.0;
      const revMult = getRevenueMultiplier();
      for (const tpl of FUTURES_TEMPLATES) {
        const estCash = Math.round(tpl.qty * tpl.basePrice * tpl.lockedMult * patHedge * revMult);
        const card = document.createElement('div');
        card.className = 'futures-card';
        card.innerHTML = `
          <div>
            <div class="card-title">📈 ${tpl.name}</div>
            <div class="card-meta tabular-nums" style="color:#34d399;">
              Chốt giá: +$${estCash.toLocaleString()} (+${Math.round((tpl.lockedMult - 1) * 100)}%) · +${tpl.rewardGems} 💎
            </div>
            <p class="card-desc" style="margin-top:6px;">Cam kết giao ${tpl.qty} ${tpl.itemLabel} trong ${tpl.durationSec} giây (Hiện có: ${Math.floor(gameState[tpl.itemKey] || 0)}).</p>
          </div>
          <button type="button" class="btn-primary tabular-nums" ${activeFut.length >= 2 ? 'disabled' : ''}>
            ${activeFut.length >= 2 ? 'Đang đầy 2/2 Hợp đồng' : `Ký Hợp Đồng · ${tpl.durationSec}s`}
          </button>
        `;
        card.querySelector('button').addEventListener('click', () => {
          const res = signFuturesContract(tpl.id);
          if (!res.ok) return this.toast(res.reason);
          sound.playUpgrade();
          this.toast(`📜 Đã ký ${tpl.name} (Giá khóa $${res.contract.lockedCash.toLocaleString()})!`);
          saveGameServer();
          this.refreshHUD();
          this.renderHub();
        });
        tplGrid.appendChild(card);
      }
      tplSec.appendChild(tplGrid);
      root.appendChild(tplSec);
      return;
    }

    if (this.subTabs.contracts === 'market') {
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
            recordPnlExpense('upgradeSpend', br.unlockCost);
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
      return;
    }

    // Default 'orders' subtab: Expo + Multinational Alliance + VIP Rush + Current Export Contract
    const expo = expoState.current;
    const expoSec = document.createElement('section');
    expoSec.innerHTML = `
      <div class="expo-banner">
        <div>
          <div class="card-title">${expo ? `🎪 Hội Chợ Triển Lãm: ${expo.name}` : '🎪 Đang chuẩn bị Hội Chợ Triển Lãm Quốc Tế'}</div>
          <div class="card-desc">${expo ? expo.desc : 'Hội chợ thương mại xoay vòng giúp tăng mạnh giá trị Hợp đồng & Nội thất xuất khẩu.'}</div>
        </div>
        <div class="tabular-nums" style="font-weight:700; color:#fde68a;" data-live-countdown="expo">
          ${expo ? `Còn ${Math.max(0, Math.ceil(expoState.timeLeft))}s` : `Mở lại sau ${Math.max(0, Math.ceil(expoState.cooldown))}s`}
        </div>
      </div>
    `;
    root.appendChild(expoSec);

    const ac = gameState.allianceContract;
    if (ac) {
      const canAlliance = gameState.planks >= ac.reqPlanks
        && gameState.pallets >= ac.reqPallets
        && gameState.cannedFish >= ac.reqCanned
        && (gameState.furniture || 0) >= ac.reqFurniture;
      const acCash = Math.round(ac.rewardCash * getContractMultiplier());
      const acSec = document.createElement('section');
      acSec.innerHTML = `
        <div class="section-heading">
          <h3>Hợp Đồng Liên Minh Đa Quốc Gia</h3>
          <span class="tabular-nums">Uy tín Liên minh: ${gameState.allianceReputation || 0} · Đã hoàn tất: ${gameState.allianceCompleted || 0}</span>
        </div>
        <div class="hub-card is-value-highlight">
          <div class="card-top">
            <div>
              <div class="card-title">🤝 ${ac.title}</div>
              <div class="card-meta">Đối tác: ${ac.partner}</div>
              <div class="card-meta tabular-nums" style="margin-top:4px;">
                Ván: ${gameState.planks}/${ac.reqPlanks} · Pallet: ${gameState.pallets}/${ac.reqPallets} · Cá: ${gameState.cannedFish}/${ac.reqCanned} · Nội thất: ${gameState.furniture || 0}/${ac.reqFurniture}
              </div>
            </div>
            <div class="tabular-nums" style="text-align:right; color:#34d399; font-weight:700;">
              +$${acCash.toLocaleString()}<br>
              <span style="color:#38bdf8;">+${ac.rewardGems} 💎 · +${ac.rewardRep} Uy tín</span>
            </div>
          </div>
          <button type="button" id="btn-deliver-alliance" class="btn-primary" ${!canAlliance ? 'disabled' : ''}>
            ${canAlliance ? 'Ký & Giao Lô Liên Minh Ngay' : 'Chưa đủ 4 nhóm hàng (cần thêm Nội thất / Gỗ)'}
          </button>
        </div>
      `;
      acSec.querySelector('#btn-deliver-alliance').addEventListener('click', () => {
        const res = deliverAllianceContract();
        if (!res.ok) return this.toast(res.reason);
        sound.playShipHorn();
        this.triggerCelebration(`Hoàn Tất ${res.title}!`, `+$${res.cash.toLocaleString()} · +${res.gems} 💎 · +${res.rep} Uy tín`, true);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      root.appendChild(acSec);
    }

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
  }

  drawRevenueChart(canvas) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(260, Math.floor(rect.width || 560));
    const cssH = 150;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pts = revenueHistory.length ? revenueHistory.map((p) => p.cpm) : [getCashPerMinute()];
    const maxVal = Math.max(200, ...pts) * 1.15;
    const padL = 48;
    const padR = 14;
    const padT = 14;
    const padB = 22;
    const plotW = Math.max(40, cssW - padL - padR);
    const plotH = cssH - padT - padB;

    // Horizontal grid lines & labels
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (plotH * i) / 3;
      const val = Math.round(maxVal * (1 - i / 3));
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(cssW - padR, y);
      ctx.stroke();
      ctx.fillText(`$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`, padL - 6, y + 3);
    }

    if (pts.length === 1) {
      const y = padT + plotH - (pts[0] / maxVal) * plotH;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(cssW - padR, y);
      ctx.stroke();
      return;
    }

    // Area gradient + crisp line
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    ctx.beginPath();
    pts.forEach((v, idx) => {
      const x = padL + (idx / Math.max(1, pts.length - 1)) * plotW;
      const y = padT + plotH - (v / maxVal) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((v, idx) => {
      const x = padL + (idx / Math.max(1, pts.length - 1)) * plotW;
      const y = padT + plotH - (v / maxVal) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Latest point marker
    const lastX = padL + plotW;
    const lastY = padT + plotH - (pts[pts.length - 1] / maxVal) * plotH;
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderFinanceTab(root) {
    root.appendChild(this.makeSubtabBar('finance', [
      { id: 'markets', label: '📈 Cổ Phiếu & Ngân Hàng' },
      { id: 'pnl', label: '📑 Báo Cáo P&L & ROI' },
      { id: 'green', label: '🌿 Năng Lượng Xanh & Carbon' }
    ]));

    const hqLv = gameState.hqTier || 0;
    const hqDef = HQ_TIERS.find((h) => h.tier === hqLv) || null;
    const nextHq = getHqNextTier();
    const pendingTotal = getTotalPendingYields();
    const divCash = Math.floor(gameState.pendingDividendCash || 0);
    const yCash = Math.floor(gameState.yachtAccumCash || 0);
    const rCash = Math.floor(gameState.resortAccumCash || 0);
    const fCash = Math.floor(gameState.franchiseAccumCash || 0);
    const reCash = Math.floor(gameState.realEstateAccumCash || 0);
    const dcCash = Math.floor(gameState.containerAccumCash || 0);
    const rwCash = Math.floor(gameState.railwayAccumCash || 0);
    const hlCash = Math.floor(gameState.heliAccumCash || 0);

    // 1. 1-Tap Collect All Empire Yields Bar (always accessible at top of Finance)
    const collectSec = document.createElement('section');
    collectSec.innerHTML = `
      <div class="finance-collect-bar">
        <div style="flex:1; min-width:220px;">
          <div class="card-title">💰 Quỹ Lợi Nhuận Chờ Thu Hoạch</div>
          <div class="card-meta tabular-nums">
            Tàu hỏa: <span data-live-railway="yield">+$${rwCash.toLocaleString()}</span> · Trực thăng: <span data-live-heli="yield">+$${hlCash.toLocaleString()}</span> · Du thuyền: $${yCash.toLocaleString()} · Resort: $${rCash.toLocaleString()} · Cổ tức: <span data-live-hq="dividend">+$${divCash.toLocaleString()}</span> · Đại lý: <span data-live-franchise="yield">+$${fCash.toLocaleString()}</span> · BĐS: <span data-live-realestate="yield">+$${reCash.toLocaleString()}</span> · Cảng Sâu: <span data-live-container="yield">+$${dcCash.toLocaleString()}</span>
          </div>
        </div>
        <button type="button" id="btn-finance-collect-all" class="btn-primary tabular-nums" style="width:auto;" ${pendingTotal <= 0 ? 'disabled' : ''}>
          ${pendingTotal > 0 ? `Thu 1 Chạm · +$${pendingTotal.toLocaleString()}` : 'Chưa có quỹ chờ'}
        </button>
      </div>
    `;
    collectSec.querySelector('#btn-finance-collect-all')?.addEventListener('click', () => {
      const gained = collectAllEmpireYields();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Hoạch Toàn Quỹ Đế Chế!', `+$${gained.cash.toLocaleString()}${gained.gems > 0 ? ` · +${gained.gems} 💎` : ''}`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(collectSec);

    if (this.subTabs.finance === 'pnl') {
      const pnl = getPnlStatement();
      const pnlSec = document.createElement('section');
      pnlSec.innerHTML = `
        <div class="section-heading">
          <h3>Báo Cáo Lợi Nhuận Ròng (P&amp;L Statement)</h3>
          <span class="tabular-nums">Biên lợi nhuận ròng: <b style="color:#34d399;">${pnl.marginPct}%</b></span>
        </div>
        <div class="pnl-summary-grid tabular-nums">
          <div class="kpi-cell">
            <span class="kpi-label">Tổng Doanh Thu Gộp</span>
            <span class="kpi-val is-green">$${pnl.gross.toLocaleString()}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Chi Trả Nợ Vay</span>
            <span class="kpi-val" style="color:#fda4af;">-$${pnl.loanCost.toLocaleString()}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Tiết Kiệm ESG &amp; BH</span>
            <span class="kpi-val is-sky">+$${pnl.savings.toLocaleString()}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Lợi Nhuận Ròng</span>
            <span class="kpi-val is-amber">$${pnl.netOperatingProfit.toLocaleString()}</span>
          </div>
        </div>
        <div class="pnl-ledger-box tabular-nums" style="margin-top:10px;">
          <div class="pnl-row"><span>Doanh thu Vận hành (Xưởng, Nội thất, Hợp đồng, Tàu Container, Cá)</span><b style="color:#f8fafc;">$${pnl.opRevenue.toLocaleString()}</b></div>
          <div class="pnl-row"><span>Thị trường &amp; Phái sinh (Sàn hàng hóa, Tương lai, Tín chỉ Carbon)</span><b style="color:#f8fafc;">$${pnl.marketRevenue.toLocaleString()}</b></div>
          <div class="pnl-row"><span>Tài sản &amp; Cổ tức (Cổ phiếu, Đại lý toàn cầu, BĐS, Du thuyền/Resort)</span><b style="color:#f8fafc;">$${pnl.assetRevenue.toLocaleString()}</b></div>
          <div class="pnl-row"><span>Chi phí Thanh toán Tín dụng Ngân hàng</span><b style="color:#fb7185;">-$${pnl.loanCost.toLocaleString()}</b></div>
          <div class="pnl-row"><span>Tổng vốn Tái đầu tư Tài sản (CAPEX Xây dựng &amp; Nâng cấp)</span><b style="color:#94a3b8;">$${pnl.capex.toLocaleString()}</b></div>
          <div class="pnl-row"><span>Tiết kiệm từ Bảo hiểm Hàng hải &amp; Tín dụng Xanh</span><b style="color:#38bdf8;">+$${pnl.savings.toLocaleString()}</b></div>
          <div class="pnl-row is-total"><span>LỢI NHUẬN RÒNG TÍCH LŨY (NET OPERATING PROFIT)</span><b style="color:#34d399;">$${pnl.netOperatingProfit.toLocaleString()} (${pnl.marginPct}%)</b></div>
        </div>
      `;
      root.appendChild(pnlSec);

      const roiList = getRoiRecommendations().slice();
      if (this.roiSortBy === 'cost') roiList.sort((a, b) => a.cost - b.cost);
      else if (this.roiSortBy === 'cpm') roiList.sort((a, b) => b.addedCpm - a.addedCpm);
      else roiList.sort((a, b) => a.paybackMin - b.paybackMin);

      const roiSec = document.createElement('section');
      roiSec.innerHTML = `
        <div class="section-heading">
          <h3>Phân Tích Hoàn Vốn Đầu Tư (ROI Payback Ranking)</h3>
          <div class="roi-sort-bar">
            <button type="button" class="roi-sort-btn ${this.roiSortBy === 'payback' ? 'active' : ''}" data-roi-sort="payback">Nhanh hoàn vốn nhất</button>
            <button type="button" class="roi-sort-btn ${this.roiSortBy === 'cpm' ? 'active' : ''}" data-roi-sort="cpm">Tăng $/phút cao nhất</button>
            <button type="button" class="roi-sort-btn ${this.roiSortBy === 'cost' ? 'active' : ''}" data-roi-sort="cost">Chi phí thấp nhất</button>
          </div>
        </div>
        <div class="exec-table-wrap">
          <table class="exec-table">
            <thead>
              <tr>
                <th>Hạng Mục Đầu Tư</th>
                <th>Phân Hệ</th>
                <th>Chi Phí</th>
                <th>+$/Phút</th>
                <th>Hoàn Vốn</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody class="tabular-nums">
              ${roiList.map((r) => `
                <tr>
                  <td style="font-weight:700;">${r.name}</td>
                  <td style="color:#94a3b8;">${r.category}</td>
                  <td>$${r.cost.toLocaleString()}</td>
                  <td style="color:#34d399;">+$${r.addedCpm.toLocaleString()}/p</td>
                  <td><span class="roi-badge">${r.paybackMin} phút</span></td>
                  <td>
                    <button type="button" class="btn-primary" style="min-height:28px; padding:0 10px; width:auto; font-size:11.5px;" data-roi-act="${r.id}" ${gameState.cash < r.cost ? 'disabled' : ''}>
                      Đầu tư
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      roiSec.querySelectorAll('[data-roi-sort]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.roiSortBy = btn.dataset.roiSort;
          this.renderHub();
        });
      });
      roiSec.querySelectorAll('[data-roi-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const actId = btn.dataset.roiAct;
          if (actId === 'deep_port') {
            const res = upgradeDeepPort();
            if (!res.ok) return this.toast(res.reason);
            sound.playShipHorn();
            this.cb.onDeepPortChange?.();
            this.toast(`🏗️ Đã nâng ${res.tierDef.name}!`);
          } else if (actId === 'hq') {
            if (!nextHq || gameState.cash < nextHq.costCash) return;
            gameState.cash -= nextHq.costCash;
            gameState.hqTier = nextHq.tier;
            recordPnlExpense('upgradeSpend', nextHq.costCash);
            addVipXp(70);
            sound.playUpgrade();
            this.cb.onHqChange?.();
            this.toast(`🏢 Đã nâng ${nextHq.name}!`);
          } else if (actId === 'green') {
            const res = upgradeGreenEnergy();
            if (!res.ok) return this.toast(res.reason);
            sound.playUpgrade();
            this.cb.onGreenEnergyChange?.();
            this.toast(`🌿 Đã triển khai ${res.tierDef.name}!`);
          } else if (actId === 'railway') {
            const res = upgradeRailway();
            if (!res.ok) return this.toast(res.reason);
            sound.playTrainHorn();
            this.cb.onRailwayChange?.();
            this.toast(`🚂 Đã nâng ${res.tierDef.name}!`);
          } else if (actId === 'heli') {
            const res = upgradeHeli();
            if (!res.ok) return this.toast(res.reason);
            sound.playHeliRotor();
            this.cb.onHeliChange?.();
            this.toast(`🚁 Đã nâng ${res.tierDef.name}!`);
          } else if (actId === 'yacht') {
            const ny = getYachtNextTier();
            if (!ny || gameState.cash < ny.costCash) return;
            gameState.cash -= ny.costCash;
            gameState.yachtTier = ny.tier;
            recordPnlExpense('upgradeSpend', ny.costCash);
            addVipXp(55);
            sound.playShipHorn();
            this.cb.onYachtChange?.();
            this.toast(`🛥️ Đã mở ${ny.name}!`);
          } else if (actId.startsWith('up_')) {
            const itemId = actId.slice(3);
            const item = UPGRADE_CATALOG.find((u) => u.id === itemId);
            const cost = item ? getUpgradeCost(item) : null;
            if (!item || cost === null || gameState.cash < cost) return;
            gameState.cash -= cost;
            gameState[item.id] = (gameState[item.id] || 0) + 1;
            recordPnlExpense('upgradeSpend', cost);
            sound.playUpgrade();
            this.cb.onUpgrade?.(item.id);
            this.toast(`⚙️ Đã nâng ${item.name} lên Cấp ${gameState[item.id]}!`);
          } else if (actId.startsWith('re_')) {
            const propId = actId.slice(3);
            const res = buyOrUpgradeRealEstate(propId);
            if (!res.ok) return this.toast(res.reason);
            recordPnlExpense('upgradeSpend', res.cost);
            sound.playUpgrade();
            this.toast(`🏙️ Đã nâng ${res.prop.name} lên Cấp ${res.level}!`);
          }
          saveGameServer();
          this.refreshHUD();
          this.renderHub();
        });
      });
      root.appendChild(roiSec);
      return;
    }

    if (this.subTabs.finance === 'green') {
      const greenLv = gameState.greenEnergyTier || 0;
      const greenDef = GREEN_ENERGY_TIERS.find((g) => g.tier === greenLv) || null;
      const nextGreen = getGreenEnergyNextTier();
      const credits = Math.floor(gameState.carbonCredits || 0);
      const cPrice = carbonMarketState.price || 44;
      const cPrev = carbonMarketState.prevPrice || cPrice;
      const cPct = cPrev > 0 ? ((cPrice - cPrev) / cPrev) * 100 : 0;
      const cDeltaCls = cPct >= 0.5 ? 'is-up' : cPct <= -0.5 ? 'is-down' : 'is-flat';
      const patGrid = hasPatent('pat_green_grid') ? 1.35 : 1.0;

      const hist = carbonMarketState.history || [44];
      const minC = Math.max(15, Math.min(...hist) * 0.9);
      const maxC = Math.max(minC + 10, Math.max(...hist) * 1.08);
      const pts = hist.map((val, idx) => {
        const x = ((idx / Math.max(1, hist.length - 1)) * 200).toFixed(1);
        const y = (36 - ((val - minC) / (maxC - minC)) * 32).toFixed(1);
        return `${x},${y}`;
      }).join(' ');

      const greenSec = document.createElement('section');
      greenSec.innerHTML = `
        <div class="section-heading">
          <h3>Lưới Năng Lượng Xanh &amp; Sàn Tín Chỉ Carbon</h3>
          <span class="tabular-nums">Đã thu từ Carbon: +$${Math.round(gameState.carbonSoldCash || 0).toLocaleString()}</span>
        </div>
        <div class="carbon-banner">
          <div style="flex:1.2; min-width:240px;">
            <div class="card-title">🌿 ${greenDef ? `${greenDef.name} (Cấp ${greenLv}/3)` : 'Chưa lắp đặt Năng Lượng Xanh'}</div>
            <div class="card-desc" style="margin-top:4px;">${nextGreen ? nextGreen.desc : 'Lưới Điện Xanh Tuần Hoàn đã tối ưu 100% chi phí & đạt chuẩn ESG hạng A+.'}</div>
            <div class="card-meta tabular-nums" style="margin-top:6px; color:#6ee7b7;">
              ${greenDef
                ? `Sinh +${(greenDef.creditsPer10s * patGrid).toFixed(1)} Tín chỉ/10s · Giảm ${greenDef.costReductionPct}% chi phí xưởng · Giảm ${greenDef.loanDiscountPct}% lãi vay`
                : 'Lắp đặt Pin Mặt Trời để bắt đầu sinh Tín chỉ Carbon bán trên sàn giao dịch.'}
            </div>
          </div>
          <button type="button" id="btn-up-green" class="btn-primary tabular-nums" style="width:auto;" ${!nextGreen || gameState.cash < nextGreen.costCash ? 'disabled' : ''}>
            ${nextGreen ? `Triển Khai Cấp ${nextGreen.tier} · $${nextGreen.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>

        <div class="stock-card" style="margin-top:12px;">
          <div class="stock-head">
            <div>
              <div class="stock-ticker">CRBN · Tín Chỉ Carbon Toàn Cầu</div>
              <div class="card-meta tabular-nums">Khả dụng: <b style="color:#34d399;" data-live-carbon="credits">${credits.toLocaleString()}</b> tín chỉ</div>
            </div>
            <div style="text-align:right;">
              <div class="market-price tabular-nums">$${cPrice.toLocaleString()} / tín chỉ</div>
              <div class="market-delta ${cDeltaCls} tabular-nums">${cPct >= 0 ? '+' : ''}${cPct.toFixed(1)}%</div>
            </div>
          </div>
          <div class="market-sparkline" aria-hidden="true">
            <svg viewBox="0 0 200 38" preserveAspectRatio="none">
              <polyline fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${pts}" />
            </svg>
          </div>
          <div class="stock-btn-row">
            <button type="button" id="btn-sell-carbon-half" class="btn-secondary tabular-nums" ${credits <= 0 ? 'disabled' : ''}>
              Bán 50% (${Math.max(1, Math.floor(credits * 0.5))})
            </button>
            <button type="button" id="btn-sell-carbon-all" class="btn-gem tabular-nums" ${credits <= 0 ? 'disabled' : ''}>
              Bán Toàn Bộ · +$${Math.round(credits * cPrice * getPrestigeMultiplier()).toLocaleString()}
            </button>
          </div>
        </div>
      `;
      greenSec.querySelector('#btn-up-green')?.addEventListener('click', () => {
        const res = upgradeGreenEnergy();
        if (!res.ok) return this.toast(res.reason);
        sound.playUpgrade();
        this.cb.onGreenEnergyChange?.();
        this.triggerCelebration(`Triển Khai ${res.tierDef.name}!`, `Sinh Tín chỉ Carbon & giảm ${res.tierDef.costReductionPct}% chi phí nâng cấp`, true);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      greenSec.querySelector('#btn-sell-carbon-half')?.addEventListener('click', () => {
        const res = sellCarbonCredits(0.5);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.toast(`🌿 Đã bán ${res.qty} Tín chỉ Carbon (+$${res.cash.toLocaleString()})!`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      greenSec.querySelector('#btn-sell-carbon-all')?.addEventListener('click', () => {
        const res = sellCarbonCredits(1);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.triggerCelebration(`Giao Dịch ${res.qty} Tín Chỉ Carbon!`, `+$${res.cash.toLocaleString()} (@ $${res.unitPrice})`, true);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      root.appendChild(greenSec);
      return;
    }

    // Default 'markets' subtab: HQ, Revenue Chart, Stock Exchange, Empire Bank, Real Estate
    const hqSec = document.createElement('section');
    hqSec.innerHTML = `
      <div class="section-heading">
        <h3>Trụ Sở Tập Đoàn TimberPort</h3>
        <span>Tháp điều hành 3D tại Quảng trường · Tăng toàn bộ doanh thu &amp; phát cổ tức định kỳ</span>
      </div>
      <div class="hq-banner-card">
        <div style="flex:1.4; min-width:240px;">
          <div class="card-title">🏢 ${hqDef ? `${hqDef.name} (Cấp ${hqLv}/3)` : 'Chưa xây Trụ Sở Tập Đoàn'}</div>
          <div class="card-meta tabular-nums" style="color:#c4b5fd; margin-top:4px;">
            Hệ số Tập đoàn: +${Math.round(getHqMultiplierBonus() * 100)}% doanh thu · Cổ tức chờ: <span data-live-hq="dividend">+$${divCash.toLocaleString()}</span>
          </div>
          <p class="card-desc" style="margin-top:6px;">
            ${nextHq ? `Nâng Cấp ${nextHq.tier}: ${nextHq.desc}` : 'Tòa Tháp Tập Đoàn Kim Cương đã hoàn thiện tối đa.'}
          </p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; min-width:240px;">
          ${hqLv > 0 ? `
            <button type="button" id="btn-claim-dividend" class="btn-gem" style="width:auto;" ${divCash <= 0 ? 'disabled' : ''}>
              Nhận Cổ Tức
            </button>
          ` : ''}
          <button type="button" id="btn-up-hq" class="btn-primary tabular-nums" style="flex:1;" ${!nextHq || gameState.cash < nextHq.costCash ? 'disabled' : ''}>
            ${nextHq ? `Xây Cấp ${nextHq.tier} · $${nextHq.costCash.toLocaleString()}` : 'Đã Đạt Cấp 3/3 ✓'}
          </button>
        </div>
      </div>
    `;
    hqSec.querySelector('#btn-claim-dividend')?.addEventListener('click', () => {
      const gained = claimDividendYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Nhận Cổ Tức Tập Đoàn!', `+$${gained.cash.toLocaleString()}`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    hqSec.querySelector('#btn-up-hq')?.addEventListener('click', () => {
      if (!nextHq || gameState.cash < nextHq.costCash) return;
      gameState.cash -= nextHq.costCash;
      gameState.hqTier = nextHq.tier;
      recordPnlExpense('upgradeSpend', nextHq.costCash);
      addVipXp(70);
      sound.playUpgrade();
      logTransaction('fleet', `Khánh thành ${nextHq.name} (Cấp ${nextHq.tier})`, -nextHq.costCash, 0);
      this.cb.onHqChange?.();
      this.triggerCelebration(`Khánh Thành ${nextHq.name}!`, `Tăng +${Math.round(nextHq.revBonus * 100)}% Doanh thu & Cổ tức định kỳ`);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(hqSec);

    const cpm = getCashPerMinute();
    const peakCpm = Math.max(cpm, ...revenueHistory.map((p) => p.cpm));
    const avgCpm = revenueHistory.length
      ? Math.round(revenueHistory.reduce((s, p) => s + p.cpm, 0) / revenueHistory.length)
      : cpm;
    const chartSec = document.createElement('section');
    chartSec.innerHTML = `
      <div class="section-heading">
        <h3>Biểu Đồ Doanh Thu Thời Gian Thực</h3>
        <span>Theo dõi tốc độ dòng tiền ($/phút) qua 24 chu kỳ gần nhất</span>
      </div>
      <div class="chart-stage">
        <div class="chart-metrics-row tabular-nums">
          <span>Hiện tại: <b style="color:#34d399;">+$${cpm.toLocaleString()}/p</b></span>
          <span>Trung bình: <b style="color:#38bdf8;">+$${avgCpm.toLocaleString()}/p</b></span>
          <span>Đỉnh ca: <b style="color:#fbbf24;">+$${peakCpm.toLocaleString()}/p</b></span>
        </div>
        <canvas id="revenue-chart-canvas" height="150"></canvas>
      </div>
    `;
    root.appendChild(chartSec);
    requestAnimationFrame(() => {
      this.drawRevenueChart(chartSec.querySelector('#revenue-chart-canvas'));
    });

    let portfolioVal = 0;
    for (const t of STOCK_TICKERS) {
      const hold = gameState.stockPortfolio?.[t.symbol];
      const entry = stockMarketState.items[t.symbol];
      if (hold && entry) portfolioVal += hold.shares * entry.price;
    }

    const stockSec = document.createElement('section');
    stockSec.innerHTML = `
      <div class="section-heading">
        <h3>Sàn Cổ Phiếu Đế Chế TimberPort</h3>
        <span class="tabular-nums">Giá trị danh mục đang nắm giữ: <b style="color:#fde68a;">$${Math.round(portfolioVal).toLocaleString()}</b></span>
      </div>
    `;
    const stockGrid = document.createElement('div');
    stockGrid.className = 'stock-grid';

    for (const t of STOCK_TICKERS) {
      const entry = stockMarketState.items[t.symbol];
      const hold = gameState.stockPortfolio?.[t.symbol] || { shares: 0, avgPrice: 0 };
      const pct = entry.prevPrice > 0 ? ((entry.price - entry.prevPrice) / entry.prevPrice) * 100 : 0;
      const deltaClass = pct >= 0.5 ? 'is-up' : pct <= -0.5 ? 'is-down' : 'is-flat';
      const deltaText = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      const unrealPnl = hold.shares > 0 ? Math.round((entry.price - hold.avgPrice) * hold.shares) : 0;

      const hist = entry.history;
      const minP = Math.min(...hist) * 0.92;
      const maxP = Math.max(minP + 10, Math.max(...hist) * 1.06);
      const points = hist.map((val, idx) => {
        const x = ((idx / Math.max(1, hist.length - 1)) * 200).toFixed(1);
        const y = (36 - ((val - minP) / (maxP - minP)) * 32).toFixed(1);
        return `${x},${y}`;
      }).join(' ');

      const card = document.createElement('div');
      card.className = 'stock-card';
      card.innerHTML = `
        <div class="stock-head">
          <div>
            <div class="stock-ticker">${t.symbol} · ${t.name}</div>
            <div class="card-meta">${t.sector}</div>
          </div>
          <div style="text-align:right;">
            <div class="market-price tabular-nums">$${entry.price.toLocaleString()}</div>
            <div class="market-delta ${deltaClass} tabular-nums">${deltaText}</div>
          </div>
        </div>
        <div class="market-sparkline" aria-hidden="true">
          <svg viewBox="0 0 200 38" preserveAspectRatio="none">
            <polyline fill="none" stroke="${t.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
          </svg>
        </div>
        <div class="card-meta tabular-nums">
          Sở hữu: <b>${hold.shares} CP</b> ${hold.shares > 0 ? `· TB $${Math.round(hold.avgPrice)} · <span style="color:${unrealPnl >= 0 ? '#34d399' : '#fb7185'};">${unrealPnl >= 0 ? '+' : ''}$${unrealPnl.toLocaleString()}</span>` : ''}
        </div>
        <div class="stock-btn-row">
          <button type="button" class="btn-secondary tabular-nums" data-buy="10" ${gameState.cash < entry.price * 10 ? 'disabled' : ''}>Mua 10</button>
          <button type="button" class="btn-primary tabular-nums" data-buy="50" ${gameState.cash < entry.price * 50 ? 'disabled' : ''}>Mua 50</button>
          <button type="button" class="btn-gem tabular-nums" data-sell="all" ${hold.shares <= 0 ? 'disabled' : ''}>Chốt Hết</button>
        </div>
      `;
      card.querySelector('[data-buy="10"]').addEventListener('click', () => {
        const res = buyStock(t.symbol, 10);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.toast(`📈 Đã mua 10 CP ${t.symbol} ($${res.cost.toLocaleString()})`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      card.querySelector('[data-buy="50"]').addEventListener('click', () => {
        const res = buyStock(t.symbol, 50);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.toast(`📈 Đã mua 50 CP ${t.symbol} ($${res.cost.toLocaleString()})`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      card.querySelector('[data-sell="all"]').addEventListener('click', () => {
        const res = sellStock(t.symbol);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.triggerCelebration(`Chốt Lời ${res.symbol}!`, `Thu +$${res.gross.toLocaleString()} (${res.profit >= 0 ? `Lãi +$${res.profit.toLocaleString()}` : `Lỗ -$${Math.abs(res.profit).toLocaleString()}`})`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      stockGrid.appendChild(card);
    }
    stockSec.appendChild(stockGrid);
    root.appendChild(stockSec);

    const netWorth = getEmpireNetWorth();
    const creditLimit = getBankCreditLimit();
    const activeLoan = gameState.activeLoan && gameState.activeLoan.remaining > 0 ? gameState.activeLoan : null;
    const bankSec = document.createElement('section');
    bankSec.innerHTML = `
      <div class="section-heading">
        <h3>Ngân Hàng Đế Chế &amp; Tín Dụng Vay Vốn</h3>
        <span class="tabular-nums">Định giá: $${netWorth.toLocaleString()} · Hạn mức: $${creditLimit.toLocaleString()} · Đã tất toán: ${gameState.loansRepaidCount || 0} kỳ</span>
      </div>
      <div class="bank-loan-banner ${activeLoan ? 'has-debt' : ''}">
        <div style="flex:1; min-width:230px;">
          <div class="card-title">🏦 ${activeLoan ? `Đang vay: ${activeLoan.name} (Lãi ${activeLoan.ratePct}%)` : 'Trạng thái Tín dụng Sạch (0% Nợ)'}</div>
          <div class="card-meta tabular-nums" style="margin-top:4px;">
            ${activeLoan
              ? `Dư nợ còn lại: <b style="color:#fda4af;">$${Math.ceil(activeLoan.remaining).toLocaleString()}</b> / $${activeLoan.totalDue.toLocaleString()} · Tự động khấu trừ 15% từ nguồn thu mới`
              : 'Vay vốn tức thì để xây Nhà máy, mở Đại lý hoặc gom Cổ phiếu giá đáy.'}
          </div>
        </div>
        ${activeLoan ? `
          <button type="button" id="btn-repay-loan" class="btn-primary tabular-nums" style="width:auto;" ${gameState.cash < Math.ceil(activeLoan.remaining) ? 'disabled' : ''}>
            Tất Toán Ngay · $${Math.ceil(activeLoan.remaining).toLocaleString()}
          </button>
        ` : ''}
      </div>
    `;
    bankSec.querySelector('#btn-repay-loan')?.addEventListener('click', () => {
      const res = repayBankLoan();
      if (!res.ok) return this.toast(res.reason);
      sound.playCash();
      this.triggerCelebration(`Tất Toán ${res.name}!`, 'Tín dụng Đế chế đạt trạng thái Tối ưu · +45 VIP XP', true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });

    const loanGrid = document.createElement('div');
    loanGrid.className = 'card-grid';
    loanGrid.style.marginTop = '10px';
    for (const pkg of BANK_LOAN_PACKAGES) {
      const eligible = netWorth >= pkg.minNetWorth;
      const totalRepay = Math.round(pkg.principal * (1 + pkg.interestPct / 100));
      const card = document.createElement('div');
      card.className = 'hub-card';
      card.innerHTML = `
        <div>
          <div class="card-title">💳 ${pkg.name}</div>
          <div class="card-meta tabular-nums" style="color:#38bdf8;">Giải ngân: +$${pkg.principal.toLocaleString()} · Lãi ${pkg.interestPct}% (Tổng trả $${totalRepay.toLocaleString()})</div>
          <p class="card-desc" style="margin-top:6px;">${pkg.desc} (Yêu cầu định giá tối thiểu $${pkg.minNetWorth.toLocaleString()})</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${Boolean(activeLoan) || !eligible ? 'disabled' : ''}>
          ${activeLoan ? 'Cần trả xong khoản cũ' : !eligible ? `Cần định giá $${pkg.minNetWorth.toLocaleString()}` : `Vay Ngay · +$${pkg.principal.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        const res = takeBankLoan(pkg.id);
        if (!res.ok) return this.toast(res.reason);
        sound.playCash();
        this.toast(`🏦 Đã giải ngân +$${res.pkg.principal.toLocaleString()} (Lãi thực tế ${res.effRate}%)!`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      loanGrid.appendChild(card);
    }
    bankSec.appendChild(loanGrid);
    root.appendChild(bankSec);

    const reSec = document.createElement('section');
    reSec.innerHTML = `
      <div class="section-heading">
        <h3>Đầu Tư Bất Động Sản Thương Mại Cảng</h3>
        <span class="tabular-nums">Thu nhập thụ động: +$${getRealEstateIncomePer10s().toLocaleString()}/10s · Chờ thu: <span data-live-realestate="yield">+$${reCash.toLocaleString()}</span></span>
      </div>
      <div style="margin-bottom:10px;">
        <button type="button" id="btn-claim-re-yield" class="btn-gem tabular-nums" style="width:auto;" ${reCash <= 0 ? 'disabled' : ''}>
          Thu Lợi Tức Bất Động Sản · +$${reCash.toLocaleString()}
        </button>
      </div>
    `;
    reSec.querySelector('#btn-claim-re-yield').addEventListener('click', () => {
      const gained = claimRealEstateYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Lợi Tức Bất Động Sản!', `+$${gained.cash.toLocaleString()}`, true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });

    const reGrid = document.createElement('div');
    reGrid.className = 'card-grid';
    for (const prop of REAL_ESTATE_CATALOG) {
      const lv = gameState.realEstate?.[prop.id] || 0;
      const cost = getRealEstateCost(prop);
      const card = document.createElement('div');
      card.className = `hub-card ${lv > 0 ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="card-title">🏙️ ${prop.name} (Cấp ${lv}/3)</div>
          <div class="card-meta tabular-nums" style="color:#34d399;">
            Thu nhập: +$${Math.round(prop.cashPer10s * Math.max(1, lv) * getPrestigeMultiplier()).toLocaleString()}/10s · Tài sản +$${(prop.netValue * lv).toLocaleString()}
          </div>
          <p class="card-desc" style="margin-top:6px;">${prop.desc}</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${cost === null || gameState.cash < cost ? 'disabled' : ''}>
          ${cost === null ? 'Đã Đạt Cấp 3/3 ✓' : lv === 0 ? `Mua Dự Án · $${cost.toLocaleString()}` : `Nâng Cấp ${lv + 1} · $${cost.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        const res = buyOrUpgradeRealEstate(prop.id);
        if (!res.ok) return this.toast(res.reason);
        recordPnlExpense('upgradeSpend', res.cost);
        sound.playUpgrade();
        this.toast(`🏙️ Đã nâng ${res.prop.name} lên Cấp ${res.level}!`);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      reGrid.appendChild(card);
    }
    reSec.appendChild(reGrid);
    root.appendChild(reSec);
  }

  drawGlobalTradeMap(canvas) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(280, Math.floor(rect.width || 620));
    const cssH = 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 40; x < cssW; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }
    for (let y = 36; y < cssH; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#15253f';
    const blobs = [
      [cssW * 0.14, cssH * 0.36, 56, 36],
      [cssW * 0.48, cssH * 0.28, 66, 26],
      [cssW * 0.63, cssH * 0.56, 48, 28],
      [cssW * 0.80, cssH * 0.44, 58, 34]
    ];
    for (const [bx, by, rx, ry] of blobs) {
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const hqX = cssW * 0.72;
    const hqY = cssH * 0.58;
    const unlocked = gameState.unlockedFranchises || [];

    for (const f of GLOBAL_FRANCHISES) {
      const fx = (f.mapX ?? 0.5) * cssW;
      const fy = (f.mapY ?? 0.5) * cssH;
      const isOpen = unlocked.includes(f.id);
      ctx.save();
      ctx.beginPath();
      if (!isOpen) ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isOpen ? '#fbbf24' : 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = isOpen ? 2.2 : 1.2;
      const cpX = (hqX + fx) * 0.5;
      const cpY = Math.min(hqY, fy) - 24;
      ctx.moveTo(hqX, hqY);
      ctx.quadraticCurveTo(cpX, cpY, fx, fy);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(fx, fy, isOpen ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isOpen ? '#34d399' : '#475569';
      ctx.fill();
      ctx.strokeStyle = isOpen ? '#fef08a' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isOpen ? '#f8fafc' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(f.city, fx, fy - 11);
    }

    ctx.beginPath();
    ctx.arc(hqX, hqY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('TimberPort HQ', hqX, hqY + 19);
  }

  drawBrandCertificateCanvas(canvas, ratingInfo) {
    if (!canvas) return;
    const w = 680;
    const h = 340;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090f1d');
    bgGrad.addColorStop(0.55, '#111a2e');
    bgGrad.addColorStop(1, '#1a1610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Double gold certificate frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TIMBERPORT INTERNATIONAL MARITIME REGISTRY · OFFICIAL CHARTER', w / 2, 54);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 28px "Space Grotesk", sans-serif';
    ctx.fillText((gameState.empireName || 'TIMBERPORT EMPIRE').toUpperCase(), w / 2, 98);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Chủ tịch Điều hành: ${gameState.username || 'Chủ tịch'} · Trụ sở Cấp ${gameState.hqTier || 0} · VIP ${gameState.vipLevel || 0} · Prestige P${gameState.prestigeLevel || 0}`, w / 2, 128);

    // Divider
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.beginPath();
    ctx.moveTo(90, 148);
    ctx.lineTo(w - 90, 148);
    ctx.stroke();

    // 4 Executive Metrics Columns
    const cols = [
      { label: 'XẾP HẠNG TÍN DỤNG', val: ratingInfo.rating, color: '#fde68a' },
      { label: 'CHỨNG NHẬN ESG', val: ratingInfo.esgGrade, color: '#34d399' },
      { label: 'ĐỊNH GIÁ ĐẾ CHẾ', val: `$${ratingInfo.netWorth.toLocaleString()}`, color: '#38bdf8' },
      { label: 'BẰNG SÁNG CHẾ', val: `${ratingInfo.patentsCount}/${RD_TECH_CATALOG.length}`, color: '#f472b6' }
    ];
    cols.forEach((c, idx) => {
      const cx = 110 + idx * 153;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(c.label, cx, 184);
      ctx.fillStyle = c.color;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText(c.val, cx, 214);
    });

    // Gold Seal Badge bottom right
    ctx.beginPath();
    ctx.arc(w - 92, h - 66, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#92400e';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 13px "Space Grotesk", sans-serif';
    ctx.fillText(ratingInfo.rating, w - 92, h - 68);
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIED', w - 92, h - 54);

    // Charter signature bottom left
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`CERT NO: TP-${String(gameState.prestigeLevel || 0).padStart(2, '0')}-${ratingInfo.score} · ${new Date().toISOString().slice(0, 10)}`, 42, h - 52);
  }

  renderBoardroomTab(root) {
    root.appendChild(this.makeSubtabBar('boardroom', [
      { id: 'global', label: '🌐 Mạng Lưới Toàn Cầu' },
      { id: 'metropolis', label: '🏙️ Đô Thị Chung & Chợ Liên Server' },
      { id: 'dossier', label: '🏅 Hồ Sơ Đế Chế & Chứng Nhận' }
    ]));

    if (this.subTabs.boardroom === 'metropolis') {
      const m = metropolisState;
      const woodPct = Math.min(100, Math.round(((m.totalWoodContributed || 0) / Math.max(1, m.goalWood || 5000)) * 100));
      const cashPct = Math.min(100, Math.round(((m.totalMoneyContributed || 0) / Math.max(1, m.goalMoney || 1000000)) * 100));
      const totalPct = Math.round((woodPct + cashPct) * 0.5);
      const listings = Array.isArray(m.marketListings) ? m.marketListings : [];
      const topList = Array.isArray(m.topContributors) ? m.topContributors : [];

      const metroSec = document.createElement('section');
      metroSec.innerHTML = `
        <div class="section-heading">
          <h3>Siêu Đô Thị Chung Liên Server (Co-op Server Landmark)</h3>
          <span class="tabular-nums">Cấp Kỳ Quan Server: Lv.${m.landmarkLevel || 1} · Tiến độ tổng: ${totalPct}%</span>
        </div>
        <div class="metropolis-hero-card">
          <div class="card-top">
            <div>
              <div class="card-title">🏛️ ${m.landmarkName || 'Tháp Thương Mại Thế Giới'} (Cấp ${m.landmarkLevel || 1})</div>
              <div class="card-meta tabular-nums" style="margin-top:4px; color:#7dd3fc;">
                Gỗ đóng góp: ${(m.totalWoodContributed || 0).toLocaleString()} / ${(m.goalWood || 5000).toLocaleString()} Ván (${woodPct}%) · Quỹ đóng góp: $${(m.totalMoneyContributed || 0).toLocaleString()} / $${(m.goalMoney || 1000000).toLocaleString()} (${cashPct}%)
              </div>
              <p class="card-desc" style="margin-top:6px;">
                Toàn bộ người chơi trên Server cùng góp Ván xẻ và Tiền mặt để nâng cấp Kỳ Quan Đô Thị. Mỗi lần góp nhận ngay <b>+3 💎 &amp; +30 VIP XP</b>!
              </p>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${totalPct}%"></div></div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
            <div class="card-meta tabular-nums">
              ${topList.length > 0 ? `🏆 Top Cống Hiến: ${topList.slice(0, 3).map((c, idx) => `#${idx + 1} ${c.name} ($${(c.score || 0).toLocaleString()})`).join(' · ')}` : 'Hãy là Chủ tịch đầu tiên khắc tên lên Kỳ Quan Server!'}
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" id="btn-coop-small" class="btn-secondary tabular-nums" style="width:auto;" ${gameState.planks < 50 || gameState.cash < 5000 ? 'disabled' : ''}>
                Góp 50 Ván + $5,000 (+3 💎)
              </button>
              <button type="button" id="btn-coop-large" class="btn-primary tabular-nums" style="width:auto;" ${gameState.planks < 200 || gameState.cash < 25000 ? 'disabled' : ''}>
                Góp 200 Ván + $25,000 (+3 💎)
              </button>
            </div>
          </div>
        </div>
      `;
      metroSec.querySelector('#btn-coop-small')?.addEventListener('click', () => {
        this.cb.onContributeLandmark?.(50, 5000);
      });
      metroSec.querySelector('#btn-coop-large')?.addEventListener('click', () => {
        this.cb.onContributeLandmark?.(200, 25000);
      });
      root.appendChild(metroSec);

      // Cross-Server P2P Commodity Exchange
      const p2pSec = document.createElement('section');
      const resNames = {
        planks: '📦 Ván gỗ xẻ',
        pallets: '🏗️ Kiện Pallet',
        cannedFish: '🥫 Cá hộp xuất khẩu',
        furniture: '🛋️ Nội thất cao cấp'
      };
      p2pSec.innerHTML = `
        <div class="section-heading">
          <h3>Sàn Giao Dịch Hàng Hóa P2P Liên Server</h3>
          <span class="tabular-nums">Đang niêm yết: ${listings.length} lô hàng trực tuyến</span>
        </div>
        <div class="p2p-market-form">
          <div class="p2p-field">
            <label for="p2p-res-select">Mặt hàng niêm yết</label>
            <select id="p2p-res-select" class="p2p-select">
              <option value="planks">📦 Ván gỗ xẻ (Kho: ${gameState.planks})</option>
              <option value="pallets">🏗️ Kiện Pallet (Kho: ${gameState.pallets})</option>
              <option value="cannedFish">🥫 Cá hộp (Kho: ${gameState.cannedFish})</option>
              <option value="furniture">🛋️ Nội thất (Kho: ${gameState.furniture || 0})</option>
            </select>
          </div>
          <div class="p2p-field">
            <label for="p2p-qty-input">Số lượng lô</label>
            <input type="number" id="p2p-qty-input" class="p2p-input tabular-nums" min="1" max="500" value="20">
          </div>
          <div class="p2p-field">
            <label for="p2p-price-input">Giá chào bán ($)</label>
            <input type="number" id="p2p-price-input" class="p2p-input tabular-nums" min="100" max="500000" step="100" value="1800">
          </div>
          <button type="button" id="btn-p2p-list" class="btn-primary" style="width:auto; min-height:36px;">
            📦 Đăng Bán Lô Hàng
          </button>
        </div>
      `;
      p2pSec.querySelector('#btn-p2p-list')?.addEventListener('click', () => {
        const res = p2pSec.querySelector('#p2p-res-select')?.value || 'planks';
        const qty = Number(p2pSec.querySelector('#p2p-qty-input')?.value || 20);
        const price = Number(p2pSec.querySelector('#p2p-price-input')?.value || 1800);
        this.cb.onListMarketItem?.(res, qty, price);
      });

      const listGrid = document.createElement('div');
      listGrid.className = 'card-grid';
      listGrid.style.marginTop = '12px';

      if (listings.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'hub-card';
        empty.innerHTML = `<div class="card-meta">Chưa có lô hàng nào đang treo trên Sàn P2P Liên Server. Hãy đăng bán lô hàng đầu tiên của bạn ở khung trên!</div>`;
        listGrid.appendChild(empty);
      } else {
        for (const item of listings) {
          const isMine = item.seller === (gameState.username || 'Chủ tịch');
          const label = resNames[item.resource] || item.resource;
          const unitPrice = Math.round((Number(item.price) || 0) / Math.max(1, Number(item.amount) || 1));
          const card = document.createElement('div');
          card.className = `hub-card ${isMine ? 'is-equipped' : 'is-value-highlight'}`;
          card.innerHTML = `
            <div>
              <div class="card-title">${label} · x${Number(item.amount).toLocaleString()}</div>
              <div class="card-meta tabular-nums" style="color:#34d399;">
                Giá trọn lô: $${Number(item.price).toLocaleString()} (~$${unitPrice.toLocaleString()}/đv)
              </div>
              <div class="card-meta" style="margin-top:4px;">
                Người bán: <b>${item.seller}</b> · ${item.empireName || 'TimberPort'}
              </div>
            </div>
            <button type="button" class="${isMine ? 'btn-secondary' : 'btn-primary'} tabular-nums" ${isMine || gameState.cash < item.price ? 'disabled' : ''}>
              ${isMine ? 'Lô hàng của bạn' : `Thu Mua Ngay · $${Number(item.price).toLocaleString()}`}
            </button>
          `;
          if (!isMine) {
            card.querySelector('button').addEventListener('click', () => {
              this.cb.onBuyMarketItem?.(item.id);
            });
          }
          listGrid.appendChild(card);
        }
      }
      p2pSec.appendChild(listGrid);
      root.appendChild(p2pSec);
      return;
    }

    if (this.subTabs.boardroom === 'dossier') {
      const rating = getCorporateCreditRating();
      const pb = gameState.personalBests || {};
      const unlockedPatents = Array.isArray(gameState.unlockedPatents) ? gameState.unlockedPatents : [];
      const dossierSec = document.createElement('section');
      dossierSec.innerHTML = `
        <div class="section-heading">
          <h3>Hồ Sơ Đế Chế &amp; Chứng Nhận Thương Hiệu Cao Cấp</h3>
          <span class="tabular-nums">Điểm tín nhiệm tổng hợp: ${rating.score}/100</span>
        </div>
        <div class="brand-cert-card">
          <div class="cert-header-grid">
            <div>
              <div class="card-title">🏛️ ${gameState.empireName || 'TimberPort Empire'} · Chủ tịch ${gameState.username || 'Chủ tịch'}</div>
              <div class="card-meta tabular-nums" style="margin-top:4px;">
                ${(gameState.unlockedFranchises || []).length}/${GLOBAL_FRANCHISES.length} Đại lý · ${gameState.containerVoyagesCompleted || 0} Chuyến Container · ${gameState.allianceCompleted || 0} HĐ Liên minh
              </div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <div class="credit-grade-box">
                <span class="credit-grade-letter">${rating.rating}</span>
                <div>
                  <div style="font-size:11px; color:#94a3b8; font-weight:700;">TÍN DỤNG ĐẾ CHẾ</div>
                  <div class="card-meta tabular-nums">ESG Hạng ${rating.esgGrade} (${rating.esgScore}/100)</div>
                </div>
              </div>
            </div>
          </div>

          <div class="cert-canvas-wrap">
            <canvas id="brand-certificate-canvas" width="680" height="340"></canvas>
          </div>

          <div class="pnl-summary-grid tabular-nums">
            <div class="kpi-cell">
              <span class="kpi-label">Định Giá Tài Sản</span>
              <span class="kpi-val is-green">$${rating.netWorth.toLocaleString()}</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-label">Đỉnh Thu Nhập / Phút</span>
              <span class="kpi-val is-amber">$${Math.round(Math.max(pb.bestCpm || 0, getCashPerMinute())).toLocaleString()}/p</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-label">Bằng Sáng Chế R&amp;D</span>
              <span class="kpi-val is-sky">${unlockedPatents.length}/${RD_TECH_CATALOG.length}</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-label">Nợ Ngân Hàng Đã Trả</span>
              <span class="kpi-val">${gameState.loansRepaidCount || 0} kỳ</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <span class="card-meta">Chứng thư tự động cập nhật theo hạng Tín dụng (${rating.rating}), Chuẩn ESG (${rating.esgGrade}) &amp; Bằng sáng chế.</span>
            <button type="button" id="btn-download-cert" class="btn-primary" style="width:auto;">
              ⬇️ Tải Chứng Nhận Thương Hiệu (PNG)
            </button>
          </div>
        </div>
      `;
      root.appendChild(dossierSec);
      const certCanvas = dossierSec.querySelector('#brand-certificate-canvas');
      requestAnimationFrame(() => {
        this.drawBrandCertificateCanvas(certCanvas, rating);
      });
      dossierSec.querySelector('#btn-download-cert')?.addEventListener('click', () => {
        if (!certCanvas) return;
        this.drawBrandCertificateCanvas(certCanvas, rating);
        const link = document.createElement('a');
        const safeSlug = (gameState.empireName || 'timberport').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        link.download = `${safeSlug}-charter-${rating.rating}.png`;
        link.href = certCanvas.toDataURL('image/png');
        link.click();
        sound.playCash();
        this.toast('🏅 Đã xuất Chứng nhận Thương hiệu Đế chế (.PNG)!');
      });
      return;
    }

    const unlocked = gameState.unlockedFranchises || [];
    const fCash = Math.floor(gameState.franchiseAccumCash || 0);
    const fBonus = getFranchiseBonusPct();
    const fRate = getFranchiseRoyaltyPer10s();
    const eb = gameState.exportBreakdown || { planks: 0, pallets: 0, cannedFish: 0, furniture: 0, revPlanks: 0, revPallets: 0, revCanned: 0, revFurniture: 0 };
    const cityFlags = { tokyo: '🇯🇵', singapore: '🇸🇬', dubai: '🇦🇪', rotterdam: '🇳🇱', vancouver: '🇨🇦' };

    const mapSec = document.createElement('section');
    mapSec.innerHTML = `
      <div class="section-heading">
        <h3>Phòng Họp Điều Hành &amp; Bản Đồ Thương Mại Toàn Cầu</h3>
        <span class="tabular-nums">${unlocked.length}/${GLOBAL_FRANCHISES.length} Đại lý đang hoạt động · Tổng cộng dồn +${fBonus}% Xuất khẩu</span>
      </div>
      <div class="global-map-stage">
        <div class="chart-metrics-row tabular-nums">
          <span>Bản quyền Đại lý: <b style="color:#34d399;">+$${fRate.toLocaleString()}/10s</b></span>
          <span>Uy tín Liên minh: <b style="color:#38bdf8;">${gameState.allianceReputation || 0} điểm</b></span>
          <span>Quỹ Đại lý chờ thu: <b style="color:#fde68a;" data-live-franchise="yield">+$${fCash.toLocaleString()}</b></span>
        </div>
        <canvas id="global-trade-map" height="220"></canvas>
        <div style="display:flex; justify-content:flex-end;">
          <button type="button" id="btn-claim-franchise" class="btn-gem tabular-nums" style="width:auto;" ${fCash <= 0 ? 'disabled' : ''}>
            Thu Bản Quyền Nhượng Quyền · +$${fCash.toLocaleString()}
          </button>
        </div>
      </div>
    `;
    mapSec.querySelector('#btn-claim-franchise').addEventListener('click', () => {
      const gained = claimFranchiseYield();
      if (!gained) return;
      sound.playCash();
      this.triggerCelebration('Thu Bản Quyền Nhượng Quyền!', `+$${gained.cash.toLocaleString()}`, true);
      saveGameServer();
      this.refreshHUD();
      this.renderHub();
    });
    root.appendChild(mapSec);
    requestAnimationFrame(() => {
      this.drawGlobalTradeMap(mapSec.querySelector('#global-trade-map'));
    });

    const frSec = document.createElement('section');
    frSec.innerHTML = `<div class="section-heading"><h3>Mạng Lưới Đại Lý Nhượng Quyền Toàn Cầu</h3><span>Mỗi đại lý mang về bản quyền định kỳ và cộng dồn vĩnh viễn doanh thu xuất khẩu</span></div>`;
    const frGrid = document.createElement('div');
    frGrid.className = 'card-grid';
    for (const f of GLOBAL_FRANCHISES) {
      const isOpen = unlocked.includes(f.id);
      const reqOk = (gameState.contractsCompleted || 0) >= f.reqContracts;
      const canBuy = !isOpen && reqOk && gameState.cash >= f.costCash;
      const flag = cityFlags[f.id] || '🌐';
      const card = document.createElement('div');
      card.className = `hub-card ${isOpen ? 'is-equipped' : 'is-value-highlight'}`;
      card.innerHTML = `
        <div>
          <div class="card-title">${flag} ${f.city} · ${f.region}</div>
          <div class="card-meta tabular-nums" style="color:#34d399;">
            +${f.exportBonusPct}% Doanh thu · +$${f.royaltyPer10s}/10s bản quyền
          </div>
          <p class="card-desc" style="margin-top:6px;">${f.desc}</p>
        </div>
        <button type="button" class="${isOpen ? 'btn-secondary' : 'btn-primary'} tabular-nums" ${isOpen || !canBuy ? 'disabled' : ''}>
          ${isOpen ? 'Đang vận hành toàn cầu ✓' : !reqOk ? `Cần ${f.reqContracts} Hợp đồng cảng` : `Mở Đại Lý · $${f.costCash.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        const res = unlockGlobalFranchise(f.id);
        if (!res.ok) return this.toast(res.reason);
        recordPnlExpense('upgradeSpend', f.costCash);
        sound.playShipHorn();
        this.triggerCelebration(`Khai Trương Đại Lý ${f.city}!`, `+${f.exportBonusPct}% Xuất khẩu · +$${f.royaltyPer10s}/10s`, true);
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      frGrid.appendChild(card);
    }
    frSec.appendChild(frGrid);
    root.appendChild(frSec);

    const exportItems = [
      { label: '📦 Ván gỗ xẻ', qty: eb.planks || 0, rev: eb.revPlanks || 0, color: '#f59e0b', unitBase: 24 },
      { label: '🏗️ Kiện Pallet', qty: eb.pallets || 0, rev: eb.revPallets || 0, color: '#10b981', unitBase: 115 },
      { label: '🥫 Cá hộp Cảng', qty: eb.cannedFish || 0, rev: eb.revCanned || 0, color: '#38bdf8', unitBase: 75 },
      { label: '🛋️ Nội thất Cao cấp', qty: eb.furniture || 0, rev: eb.revFurniture || 0, color: '#fb7185', unitBase: 320 }
    ];
    const maxExpRev = Math.max(1, ...exportItems.map((e) => e.rev));
    const totalExpRev = exportItems.reduce((s, e) => s + e.rev, 0);

    const expSec = document.createElement('section');
    expSec.innerHTML = `
      <div class="section-heading">
        <h3>Báo Cáo Xuất Khẩu &amp; Cơ Cấu Mặt Hàng</h3>
        <span class="tabular-nums">Tổng giá trị xuất khẩu ghi nhận: $${totalExpRev.toLocaleString()}</span>
      </div>
      <div class="export-report-card">
        <div class="export-metric-grid tabular-nums">
          ${exportItems.map((e) => `
            <div class="kpi-cell">
              <span class="kpi-label">${e.label}</span>
              <span class="kpi-val" style="color:${e.color};">${e.qty.toLocaleString()} lô</span>
              <span class="card-meta">$${e.rev.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
        <div class="rev-bars">
          ${exportItems.map((e) => {
            const pct = Math.round((e.rev / maxExpRev) * 100);
            const share = totalExpRev > 0 ? Math.round((e.rev / totalExpRev) * 100) : 0;
            return `
              <div class="rev-bar-row">
                <span class="rev-bar-label">${e.label}</span>
                <div class="rev-bar-track"><div class="rev-bar-fill" style="width:${pct}%; background:${e.color};"></div></div>
                <span class="rev-bar-val tabular-nums">${share}% · $${e.unitBase}/đv</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    root.appendChild(expSec);
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
    const heliLv = gameState.heliTier || 0;
    const islandLv = gameState.islandStationTier || 0;
    const resortLv = gameState.islandResortTier || 0;
    const hasPlane = airportLv >= 1 && (gameState.unlockedPlanes?.length || 0) > 0;
    const activePlane = getPlaneData();
    const activeHeli = getHeliData();
    const activeYacht = YACHT_TIERS.find((y) => y.tier === yachtLv) || null;
    const yLivery = getLiveryData(gameState.yachtLivery || 'pearl_sky');
    const pLivery = getLiveryData(gameState.planeLivery || 'pearl_sky');
    const toHex = (n) => '#' + Number(n || 0).toString(16).padStart(6, '0');

    // 1. Flagship Fleet Showroom Hero Banner + SVG Technical Preview
    const heroSec = document.createElement('section');
    heroSec.innerHTML = `
      <div class="showroom-hero">
        <div class="showroom-hero-copy">
          <div class="store-hero-kicker">SHOWROOM HẠM ĐỘI THƯƠNG MẠI · BIỂN &amp; HÀNG KHÔNG</div>
          <div class="store-hero-title">Tổ Hợp Du Thuyền, Trực Thăng VIP &amp; Sân Bay</div>
          <div class="card-meta tabular-nums">
            Du thuyền Cấp ${yachtLv}/3 · Trực thăng Cấp ${heliLv}/3 · Sân bay Cấp ${airportLv}/3 · Resort Cấp ${resortLv}/3
          </div>
          <div class="card-meta tabular-nums" style="color:#6ee7b7;">
            Kho báu: ${gameState.treasuresCollected || 0} · Đơn Biển: ${gameState.seaDeliveries || 0} · Đơn Không: ${gameState.airDeliveries || 0} · Cứu bão: ${gameState.personalBests?.totalStormRescues || 0}
          </div>
          <div class="showroom-cta-row">
            <button type="button" id="btn-showroom-launch-yacht" class="${yachtLv > 0 ? 'btn-primary' : 'btn-secondary'}">
              ${yachtLv > 0 ? '🚤 Lái Du Thuyền' : '🔒 Mở Bến Du Thuyền'}
            </button>
            <button type="button" id="btn-showroom-launch-heli" class="${heliLv > 0 ? 'btn-primary' : 'btn-secondary'}">
              ${heliLv > 0 ? `🚁 Bay ${activeHeli.name}` : '🔒 Mở Sân Trực Thăng'}
            </button>
            <button type="button" id="btn-showroom-launch-plane" class="${hasPlane ? 'btn-gem' : 'btn-secondary'}">
              ${hasPlane ? `✈️ Cất Cánh (${activePlane.name})` : '🔒 Cần Đường Băng'}
            </button>
          </div>
        </div>
        <div class="showroom-svg-stage">
          <svg viewBox="0 0 260 96" aria-hidden="true">
            <path d="M8 74 Q 65 68 130 74 T 252 74" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-opacity="0.55"/>
            <!-- Yacht Silhouette with dynamic livery -->
            <path d="M22 66 L108 66 L124 54 L32 54 Z" fill="${toHex(yLivery.hull)}"/>
            <path d="M40 54 L88 54 L78 44 L44 44 Z" fill="${toHex(yLivery.cabin)}"/>
            <rect x="26" y="57" width="84" height="3" fill="${toHex(yLivery.trim)}"/>
            <!-- Cargo Jet Silhouette with dynamic livery -->
            <path d="M138 30 L214 26 L236 32 L212 36 L142 36 Z" fill="${toHex(pLivery.hull)}"/>
            <path d="M168 30 L152 14 L172 14 L188 30 Z" fill="${toHex(pLivery.trim)}"/>
            <path d="M142 30 L132 18 L146 18 L152 30 Z" fill="${toHex(pLivery.cabin)}"/>
            <path d="M126 33 L86 33" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
          </svg>
          <div class="fleet-spec-line tabular-nums">
            ${activeYacht ? `🚤 ${activeYacht.name}` : '🚤 Chưa có Du thuyền'} · ${heliLv > 0 ? `🚁 ${activeHeli.name}` : '🚁 Chưa có Trực thăng'} · ${hasPlane ? `✈️ ${activePlane.name}` : '✈️ Chưa có Máy bay'}
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
    heroSec.querySelector('#btn-showroom-launch-heli')?.addEventListener('click', () => {
      if (heliLv <= 0) {
        this.toast('Hãy mở khóa Bãi Đáp & Trực Thăng VIP Cấp 1 ngay bên dưới!');
        return;
      }
      this.els.hubModal.hidden = true;
      this.cb.onBoardHeli?.();
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

    // 2. Infrastructure: Yacht Berth, Airport Runway, Offshore Island Outpost & VIP Island Resort
    const infraSec = document.createElement('section');
    infraSec.innerHTML = `<div class="section-heading"><h3>Hạ Tầng Hàng Không, Hải Đảo &amp; Khu Nghỉ Dưỡng VIP</h3><span>Xây dựng công trình thực tế trên bản đồ 3D để mở tuyến giao thương &amp; du lịch</span></div>`;
    const infraGrid = document.createElement('div');
    infraGrid.className = 'card-grid';

    const nextYacht = getYachtNextTier();
    const nextAirport = getAirportNextTier();
    const nextHeli = getHeliNextTier();
    const nextIsland = getIslandNextTier();
    const nextResort = getResortNextTier();
    const rCash = Math.floor(gameState.resortAccumCash || 0);
    const rGems = Math.floor(gameState.resortAccumGems || 0);
    const hCash = Math.floor(gameState.heliAccumCash || 0);
    const hGems = Math.floor(gameState.heliAccumGems || 0);

    const infraCards = [
      {
        title: `🚁 Bãi Đáp & Chuyên Cơ Trực Thăng VIP (Cấp ${heliLv}/3)`,
        meta: heliLv > 0
          ? `${activeHeli.name} · Quỹ: <span data-live-heli="yield">+$${hCash.toLocaleString()} · +${hGems} 💎</span>`
          : 'Mở Sân đáp H cạnh Trụ sở để tự lái Trực thăng 360° & chuyên chở VIP',
        desc: nextHeli ? nextHeli.desc : 'Siêu Trực Thăng Hoàng Gia đang vận hành ở công suất cao nhất.',
        next: nextHeli,
        disabledReason: null,
        hasClaim: heliLv > 0 && (hCash > 0 || hGems > 0),
        onClaim: () => {
          const gained = claimHeliYield();
          if (!gained) return;
          sound.playCash();
          this.triggerCelebration('Thu Quỹ Chuyên Cơ Trực Thăng!', `+$${gained.cash.toLocaleString()}${gained.gems > 0 ? ` · +${gained.gems} 💎` : ''}`);
        },
        onUpgrade: () => {
          const res = upgradeHeli();
          if (!res.ok) return this.toast(res.reason);
          sound.playHeliRotor();
          this.cb.onHeliChange?.();
          this.triggerCelebration(`Khánh Thành ${res.tierDef.name}!`, 'Nhấn nút 🚁 Trực thăng để bay tuần tra 360°!', true);
        }
      },
      {
        title: `🛥️ Bến Du Thuyền VIP (Cấp ${yachtLv}/3)`,
        meta: activeYacht ? `${activeYacht.name} · +$${activeYacht.cashPer10s}/10s` : 'Chưa mở khóa — mở để tự lái ra khơi săn kho báu',
        desc: nextYacht ? nextYacht.desc : 'Đã đạt siêu du thuyền cấp tối đa.',
        next: nextYacht,
        disabledReason: null,
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
        disabledReason: null,
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
        disabledReason: null,
        onUpgrade: () => {
          if (!nextIsland || gameState.cash < nextIsland.costCash) return;
          gameState.cash -= nextIsland.costCash;
          gameState.islandStationTier = nextIsland.tier;
          addVipXp(50);
          sound.playUpgrade();
          this.cb.onIslandChange?.();
          this.triggerCelebration(`Nâng Cấp ${nextIsland.name}!`, 'Mở tuyến giao hàng Biển & Không ra đảo thưởng lớn!');
        }
      },
      {
        title: `🏖️ Khu Nghỉ Dưỡng Du Thuyền VIP (Cấp ${resortLv}/3)`,
        meta: resortLv > 0
          ? `Quỹ Resort: <span data-live-resort="yield">+$${rCash.toLocaleString()} · +${rGems} 💎</span>`
          : 'Cần Đảo Tiền Đồn Cấp 1 để xây Resort 5★ trên đảo',
        desc: nextResort ? nextResort.desc : 'Quần thể Beach Club, Thủy cung & Villa VIP hoạt động hết công suất.',
        next: nextResort,
        disabledReason: islandLv <= 0 ? 'Cần Đảo Tiền Đồn Cấp 1' : null,
        hasClaim: resortLv > 0 && (rCash > 0 || rGems > 0),
        onClaim: () => {
          const gained = claimResortYield();
          if (!gained) return;
          sound.playCash();
          this.triggerCelebration('Thu Hoạch Khu Nghỉ Dưỡng VIP!', `+$${gained.cash.toLocaleString()}${gained.gems > 0 ? ` · +${gained.gems} 💎` : ''}`);
        },
        onUpgrade: () => {
          if (islandLv <= 0 || !nextResort || gameState.cash < nextResort.costCash) return;
          gameState.cash -= nextResort.costCash;
          gameState.islandResortTier = nextResort.tier;
          addVipXp(65);
          sound.playUpgrade();
          logTransaction('fleet', `Mở rộng ${nextResort.name} (Cấp ${nextResort.tier})`, -nextResort.costCash, 0);
          this.cb.onResortChange?.();
          this.triggerCelebration(`Khai Trương ${nextResort.name}!`, `Thu nhập du lịch +$${nextResort.cashPer10s}/10s & 💎`);
        }
      }
    ];

    for (const ic of infraCards) {
      const card = document.createElement('div');
      card.className = `hub-card ${ic.next === null ? 'is-equipped' : 'is-value-highlight'}`;
      const upDisabled = Boolean(ic.disabledReason) || !ic.next || gameState.cash < ic.next.costCash;
      card.innerHTML = `
        <div>
          <div class="card-title">${ic.title}</div>
          <div class="card-meta tabular-nums">${ic.meta}</div>
          <p class="card-desc" style="margin-top:6px;">${ic.desc}</p>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${ic.hasClaim ? `<button type="button" data-claim-resort="1" class="btn-gem" style="width:auto;">Thu Quỹ</button>` : ''}
          <button type="button" data-upgrade-infra="1" class="btn-primary tabular-nums" style="flex:1;" ${upDisabled ? 'disabled' : ''}>
            ${ic.disabledReason ? ic.disabledReason : ic.next ? `Xây Cấp ${ic.next.tier} · $${ic.next.costCash.toLocaleString()}` : 'Đã Đạt Tối Đa ✓'}
          </button>
        </div>
      `;
      card.querySelector('[data-claim-resort]')?.addEventListener('click', () => {
        ic.onClaim?.();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      card.querySelector('[data-upgrade-infra]').addEventListener('click', () => {
        ic.onUpgrade();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      infraGrid.appendChild(card);
    }
    infraSec.appendChild(infraGrid);
    root.appendChild(infraSec);

    // 2B. Engine Upgrades for Yacht, Helicopter & Airplane (Tier 1-5)
    const engSec = document.createElement('section');
    engSec.innerHTML = `<div class="section-heading"><h3>Nâng Cấp Động Cơ Du Thuyền, Trực Thăng &amp; Máy Bay</h3><span>Tăng tốc độ tối đa (+14%/cấp) và thưởng đơn hàng Biển/Không (+16%/cấp)</span></div>`;
    const engGrid = document.createElement('div');
    engGrid.className = 'card-grid';

    const yEng = gameState.yachtEngineTier || 1;
    const hEng = gameState.heliEngineTier || 1;
    const pEng = gameState.planeEngineTier || 1;
    const yEngCost = getYachtEngineCost(yEng);
    const hEngCost = getHeliEngineCost(hEng);
    const pEngCost = getPlaneEngineCost(pEng);
    const engCards = [
      {
        title: `⚙️ Động Cơ Thủy Lực Du Thuyền (Cấp ${yEng}/${ENGINE_MAX_TIER})`,
        meta: `Tốc độ x${getEngineSpeedMult(yEng).toFixed(2)} · Thưởng hàng hải x${getEngineYieldMult(yEng).toFixed(2)}`,
        desc: 'Tăng lực đẩy chân vịt giúp Du thuyền lướt sóng nhanh hơn và chở hàng nặng.',
        cost: yEngCost,
        onUp: () => {
          if (yEngCost === null || gameState.cash < yEngCost) return;
          gameState.cash -= yEngCost;
          gameState.yachtEngineTier = yEng + 1;
          addVipXp(35);
          sound.playUpgrade();
          this.toast(`⚙️ Động cơ Du thuyền lên Cấp ${gameState.yachtEngineTier}!`);
        }
      },
      {
        title: `🚁 Động Cơ Tuabin Kép Trực Thăng (Cấp ${hEng}/${ENGINE_MAX_TIER})`,
        meta: `Tốc độ & Bốc cao x${getEngineSpeedMult(hEng).toFixed(2)} · Quỹ & Thưởng bay x${getEngineYieldMult(hEng).toFixed(2)}`,
        desc: 'Tăng lực nâng cánh quạt chính giúp Trực thăng VIP bay vọt nhanh và tăng quỹ chuyên cơ.',
        cost: hEngCost,
        onUp: () => {
          if (hEngCost === null || gameState.cash < hEngCost) return;
          gameState.cash -= hEngCost;
          gameState.heliEngineTier = hEng + 1;
          addVipXp(40);
          sound.playHeliRotor();
          this.toast(`🚁 Động cơ Trực thăng VIP lên Cấp ${gameState.heliEngineTier}!`);
        }
      },
      {
        title: `🔥 Động Cơ Tuabin Phản Lực Máy Bay (Cấp ${pEng}/${ENGINE_MAX_TIER})`,
        meta: `Tốc độ & Leo cao x${getEngineSpeedMult(pEng).toFixed(2)} · Thưởng hàng không x${getEngineYieldMult(pEng).toFixed(2)}`,
        desc: 'Động cơ phản lực giúp cất cánh tức thì, vượt bão biển và tăng thưởng thả hàng.',
        cost: pEngCost,
        onUp: () => {
          if (pEngCost === null || gameState.cash < pEngCost) return;
          gameState.cash -= pEngCost;
          gameState.planeEngineTier = pEng + 1;
          addVipXp(40);
          sound.playTakeoff();
          this.toast(`🔥 Động cơ Máy bay lên Cấp ${gameState.planeEngineTier}!`);
        }
      }
    ];
    for (const ec of engCards) {
      const card = document.createElement('div');
      card.className = 'hub-card';
      card.innerHTML = `
        <div>
          <div class="card-title">${ec.title}</div>
          <div class="card-meta tabular-nums" style="color:#7dd3fc;">${ec.meta}</div>
          <p class="card-desc" style="margin-top:6px;">${ec.desc}</p>
        </div>
        <button type="button" class="btn-primary tabular-nums" ${ec.cost === null || gameState.cash < ec.cost ? 'disabled' : ''}>
          ${ec.cost === null ? `Đạt Cấp ${ENGINE_MAX_TIER}/${ENGINE_MAX_TIER} ✓` : `Nâng Động Cơ · $${ec.cost.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        ec.onUp();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      engGrid.appendChild(card);
    }
    engSec.appendChild(engGrid);
    root.appendChild(engSec);

    // 2C. Paint Liveries for Yachts, Helicopters & Airplanes
    const livSec = document.createElement('section');
    const targetKey = this.liveryTarget === 'plane' ? 'planeLivery' : this.liveryTarget === 'heli' ? 'heliLivery' : 'yachtLivery';
    const equippedLivery = gameState[targetKey] || 'pearl_sky';
    livSec.innerHTML = `
      <div class="section-heading">
        <h3>Xưởng Sơn Phủ Hạm Đội (Paint Liveries)</h3>
        <span>Mở khóa một lần — áp dụng màu sơn trực tiếp lên mô hình 3D</span>
      </div>
      <div class="livery-target-bar">
        <button type="button" class="livery-target-btn ${this.liveryTarget === 'yacht' ? 'active' : ''}" data-liv-target="yacht">🚤 Sơn Du Thuyền</button>
        <button type="button" class="livery-target-btn ${this.liveryTarget === 'heli' ? 'active' : ''}" data-liv-target="heli">🚁 Sơn Trực Thăng</button>
        <button type="button" class="livery-target-btn ${this.liveryTarget === 'plane' ? 'active' : ''}" data-liv-target="plane">✈️ Sơn Máy Bay</button>
      </div>
    `;
    livSec.querySelectorAll('[data-liv-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.liveryTarget = btn.dataset.livTarget;
        this.renderHub();
      });
    });

    const livGrid = document.createElement('div');
    livGrid.className = 'card-grid';
    const unlockedLiveries = Array.isArray(gameState.unlockedLiveries) ? gameState.unlockedLiveries : ['pearl_sky'];

    for (const liv of FLEET_LIVERIES) {
      const unlocked = unlockedLiveries.includes(liv.id);
      const equipped = equippedLivery === liv.id;
      const hullHex = toHex(liv.hull);
      const trimHex = toHex(liv.trim);
      const canAfford = liv.costType === 'free'
        || (liv.costType === 'cash' && gameState.cash >= liv.cost)
        || (liv.costType === 'gems' && gameState.gems >= liv.cost);
      const priceText = liv.costType === 'free' ? 'Miễn phí'
        : liv.costType === 'cash' ? `$${liv.cost.toLocaleString()}`
        : `${liv.cost} 💎`;

      const card = document.createElement('div');
      card.className = `hub-card ${equipped ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="livery-swatch-row">
            <span class="livery-dot" style="background:${hullHex}; border-color:${trimHex};"></span>
            <div class="card-title">${liv.name}</div>
          </div>
          <div class="card-meta" style="margin-top:4px;">${liv.tierLabel || 'Tiêu chuẩn'} · Chủ đạo ${hullHex} · Viền ${trimHex}</div>
        </div>
        <button type="button" class="${equipped ? 'btn-secondary' : unlocked ? 'btn-gem' : 'btn-primary'} tabular-nums" ${equipped || (!unlocked && !canAfford) ? 'disabled' : ''}>
          ${equipped ? 'Đang phủ sơn ✓' : unlocked ? 'Áp dụng sơn này' : `Mở Sơn · ${priceText}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (equipped) return;
        if (!unlocked) {
          if (!canAfford) return;
          if (liv.costType === 'cash') gameState.cash -= liv.cost;
          if (liv.costType === 'gems') gameState.gems -= liv.cost;
          if (!Array.isArray(gameState.unlockedLiveries)) gameState.unlockedLiveries = ['pearl_sky'];
          gameState.unlockedLiveries.push(liv.id);
          addVipXp(30);
          sound.playUpgrade();
          this.toast(`🎨 Đã mở khóa bộ sơn ${liv.name}!`);
        }
        gameState[targetKey] = liv.id;
        this.cb.onLiveryChange?.();
        saveGameServer();
        this.refreshHUD();
        this.renderHub();
      });
      livGrid.appendChild(card);
    }
    livSec.appendChild(livGrid);
    root.appendChild(livSec);

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
    const stats = gameState.revenueStats || { sawmill: 0, contracts: 0, fishery: 0, market: 0, offline: 0, stocks: 0, resort: 0, furniture: 0, franchise: 0, realestate: 0 };
    const sources = [
      { key: 'sawmill', label: 'Xưởng Cưa & Pallet', color: '#f59e0b' },
      { key: 'furniture', label: 'Nội Thất Cao Cấp', color: '#fb7185' },
      { key: 'contracts', label: 'Hợp Đồng & Liên Minh', color: '#10b981' },
      { key: 'market', label: 'Sàn Giao Dịch Gỗ', color: '#a855f7' },
      { key: 'franchise', label: 'Nhượng Quyền Toàn Cầu', color: '#f97316' },
      { key: 'realestate', label: 'Bất Động Sản Cảng', color: '#6366f1' },
      { key: 'fishery', label: 'Thủy Sản & Du Thuyền', color: '#38bdf8' },
      { key: 'resort', label: 'Resort Đảo VIP', color: '#22d3ee' },
      { key: 'stocks', label: 'Cổ Phiếu & Cổ Tức', color: '#eab308' },
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
        <p class="card-desc">Điều kiện: Đạt Cấp 5, hoàn thành 3 Hợp đồng hoặc sở hữu $18,000. Khi Chuyển sinh, bạn giữ lại toàn bộ Đá quý, VIP, Bằng sáng chế R&amp;D, Skins, Thú cưng, Siêu xe và Thành tựu.</p>
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
    const metalClass = curVip >= 5 ? 'is-diamond' : curVip === 4 ? 'is-platinum' : curVip === 3 ? 'is-gold' : curVip === 2 ? 'is-silver' : 'is-bronze';
    const vipMult = curVip > 0 ? VIP_TIERS[curVip - 1].bonusMult : 1;

    const vipSec = document.createElement('section');
    vipSec.innerHTML = `
      <div class="section-heading"><h3>Thẻ Thành Viên VIP Ánh Kim &amp; Đặc Quyền</h3><span>Cấp hiện tại: VIP ${curVip}</span></div>
      <div class="vip-metal-card ${metalClass}">
        <div class="vip-card-top">
          <div>
            <div class="tier-label-line" style="color:#fde68a;">TIMBERPORT EXECUTIVE PRIVILEGE CARD</div>
            <div class="card-title" style="font-size:18px;">👑 ${curVip > 0 ? VIP_TIERS[curVip - 1].name : 'Thành viên Tiêu chuẩn'}</div>
          </div>
          <div class="vip-card-chip" aria-hidden="true"></div>
        </div>
        <div class="vip-card-number tabular-nums">TP-${String(gameState.prestigeLevel || 0).padStart(2, '0')} · ${(gameState.empireName || 'TIMBERPORT').toUpperCase().slice(0, 14)} · VIP-${curVip}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:#fbbf24;"></div></div>
        <div class="vip-card-foot tabular-nums">
          <span>Điểm VIP: <b>${gameState.vipXp}</b> ${nextVip ? `/ ${nextVip.xpReq} (${nextVip.name})` : '(Cấp Tối Đa)'}</span>
          <span>Hệ số VIP: <b style="color:#fde68a;">x${vipMult.toFixed(2)}</b> · Uy tín: <b>${gameState.allianceReputation || 0}</b></span>
        </div>
      </div>
    `;
    const vipGrid = document.createElement('div');
    vipGrid.className = 'card-grid';
    vipGrid.style.marginTop = '12px';
    for (const v of VIP_TIERS) {
      const reached = curVip >= v.level;
      const tierCls = v.level >= 4 ? 'tier-card--imperial' : v.level >= 2 ? 'tier-card--executive' : 'tier-card--standard';
      const tierRank = v.level >= 4 ? 'HẠNG HOÀNG GIA' : v.level >= 2 ? 'HẠNG ĐIỀU HÀNH' : 'HẠNG TIÊU CHUẨN';
      const card = document.createElement('div');
      card.className = `hub-card ${tierCls} ${reached ? 'is-equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="tier-label-line">${tierRank}</div>
          <div class="card-title">VIP ${v.level} · ${v.name}</div>
          <div class="card-meta tabular-nums">Mốc ${v.xpReq} VIP XP · ${reached ? 'Đã kích hoạt ✓' : 'Chưa đạt'}</div>
          <p class="card-desc" style="margin-top:6px;">${v.perk}</p>
        </div>
      `;
      vipGrid.appendChild(card);
    }
    vipSec.appendChild(vipGrid);
    root.appendChild(vipSec);

    // Gem Packs with Commercial Tier Framing (Standard / Executive / Imperial)
    const gemSec = document.createElement('section');
    gemSec.innerHTML = `<div class="section-heading"><h3>Kho Đá Quý &amp; Gói Thương Mại Phân Hạng</h3><span>Chọn hạng mức đầu tư để mở khóa đặc quyền VIP, Sơn tàu &amp; Phi cơ</span></div>`;
    const gemGrid = document.createElement('div');
    gemGrid.className = 'card-grid';

    for (const pack of GEM_PACKS) {
      const isStarter = pack.id === 'pack_starter';
      const cashCost = pack.id === 'pack_merchant' ? 15000 : pack.id === 'pack_tycoon' ? 45000 : 0;
      const disabled = (isStarter && gameState.starterPackClaimed) || (!isStarter && gameState.cash < cashCost);
      const tierCls = pack.id === 'pack_tycoon' ? 'tier-card--imperial' : pack.id === 'pack_merchant' ? 'tier-card--executive' : 'tier-card--standard';
      const tierRank = pack.id === 'pack_tycoon' ? 'HOÀNG GIA · GIÁ TRỊ CAO NHẤT' : pack.id === 'pack_merchant' ? 'ĐIỀU HÀNH · KHUYÊN DÙNG' : 'TIÊU CHUẨN · KHỞI NGHIỆP';

      const card = document.createElement('div');
      card.className = `hub-card ${tierCls}`;
      card.innerHTML = `
        <div>
          <div class="tier-label-line">${tierRank}</div>
          <div class="card-title">💎 ${pack.name}</div>
          <div class="card-meta">${pack.badge}</div>
          <p class="card-desc" style="margin-top:6px;">${pack.bonus}</p>
        </div>
        <button type="button" class="btn-gem" ${disabled ? 'disabled' : ''}>
          ${isStarter && gameState.starterPackClaimed ? 'Đã nhận gói khởi nghiệp ✓' : pack.priceLabel}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (disabled) return;
        if (isStarter) gameState.starterPackClaimed = true;
        else gameState.cash -= cashCost;
        gameState.gems += pack.gems;
        const lvUp = addVipXp(pack.vipXp);
        sound.playUpgrade();
        logTransaction('fleet', `Nhận ${pack.name}`, 0, pack.gems);
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

  openNotifDrawer() {
    if (!this.els.notifDrawer) return;
    this.els.notifDrawer.hidden = false;
    markNotificationsRead();
    this.refreshHUD();
    this.renderNotifList();
  }

  renderNotifList() {
    const listEl = this.els.notifList;
    if (!listEl) return;
    const allLogs = Array.isArray(gameState.transactionLog) ? gameState.transactionLog : [];
    const filtered = this.notifFilter === 'all'
      ? allLogs
      : allLogs.filter((tx) => tx.kind === this.notifFilter);

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="hub-card">
          <div class="card-title">Chưa có giao dịch trong mục này</div>
          <p class="card-desc">Mua bán cổ phiếu, thu hoạch quỹ Du thuyền/Resort, hoặc giải cứu bão biển để ghi nhận nhật ký thương mại.</p>
        </div>
      `;
      return;
    }

    const kindLabels = {
      export: 'Xuất khẩu & Liên minh',
      bank: 'Ngân hàng & Bất động sản',
      stocks: 'Cổ phiếu',
      fleet: 'Hạm đội & Công trình',
      income: 'Doanh thu'
    };

    listEl.innerHTML = filtered.map((tx) => {
      const hasCash = tx.cashDelta !== 0;
      const hasGems = tx.gemDelta !== 0;
      const cashStr = hasCash ? `${tx.cashDelta > 0 ? '+' : '-'}$${Math.abs(tx.cashDelta).toLocaleString()}` : '';
      const gemStr = hasGems ? `${tx.gemDelta > 0 ? '+' : '-'}${Math.abs(tx.gemDelta)} 💎` : '';
      const deltaClass = (tx.cashDelta > 0 || tx.gemDelta > 0) ? 'is-pos' : tx.cashDelta < 0 ? 'is-neg' : '';
      return `
        <div class="notif-row">
          <div>
            <div class="notif-row-title">${tx.title}</div>
            <div class="notif-row-time">${tx.time} · ${kindLabels[tx.kind] || 'Thương mại'}</div>
          </div>
          <div class="notif-row-delta ${deltaClass} tabular-nums">
            ${cashStr}${hasCash && hasGems ? '<br>' : ''}${gemStr}
          </div>
        </div>
      `;
    }).join('');
  }

  openShiftModal() {
    if (!this.els.shiftModal || !this.els.shiftBody) return;
    this.els.shiftModal.hidden = false;
    const body = this.els.shiftBody;
    const pb = gameState.personalBests || { bestShiftCash: 0, bestCpm: 0, bestSingleDeal: 0, totalStormRescues: 0, completedShifts: 0 };
    const elapsedMin = Math.max(1, Math.round((Date.now() - shiftSession.startedAt) / 60000));
    const curCpm = getCashPerMinute();
    if (curCpm > (shiftSession.peakCpm || 0)) shiftSession.peakCpm = curCpm;
    if (curCpm > (pb.bestCpm || 0)) pb.bestCpm = curCpm;

    body.innerHTML = `
      <div class="exec-profile-banner">
        <div>
          <div class="card-title">📋 Tổng Kết Ca Kinh Doanh Hiện Tại (${elapsedMin} phút)</div>
          <div class="card-meta">Đế chế ${gameState.empireName} · Đã hoàn tất ${pb.completedShifts || 0} ca trước đó</div>
        </div>
        <div class="exec-stat-grid tabular-nums">
          <div class="kpi-cell">
            <span class="kpi-label">Doanh thu Ca</span>
            <span class="kpi-val is-green">+$${Math.round(shiftSession.cashEarned).toLocaleString()}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Gỗ khai thác</span>
            <span class="kpi-val is-amber">${shiftSession.logsCut.toLocaleString()} 🪵</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Hợp đồng &amp; Bão</span>
            <span class="kpi-val is-sky">${shiftSession.contractsDone} HĐ · ${shiftSession.stormRescues} Bão</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Đỉnh $/phút Ca</span>
            <span class="kpi-val is-green">+$${Math.round(shiftSession.peakCpm || curCpm).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <section>
        <div class="section-heading">
          <h3>So Sánh Kỷ Lục Cá Nhân (Personal Bests)</h3>
          <span>Lưu vĩnh viễn theo hồ sơ Chủ tịch</span>
        </div>
        <div class="shift-compare-grid tabular-nums">
          <div class="shift-record-row">
            <span class="card-meta">Kỷ lục Doanh thu 1 Ca</span>
            <b style="color:#34d399;">$${Math.round(Math.max(pb.bestShiftCash || 0, shiftSession.cashEarned)).toLocaleString()}</b>
          </div>
          <div class="shift-record-row">
            <span class="card-meta">Đỉnh Thu Nhập / Phút</span>
            <b style="color:#fbbf24;">+$${Math.round(Math.max(pb.bestCpm || 0, curCpm)).toLocaleString()}/p</b>
          </div>
          <div class="shift-record-row">
            <span class="card-meta">Thương Vụ Đơn Lẻ Lớn Nhất</span>
            <b style="color:#38bdf8;">$${Math.round(pb.bestSingleDeal || 0).toLocaleString()}</b>
          </div>
          <div class="shift-record-row">
            <span class="card-meta">Tổng Chuyến Cứu Trợ Bão</span>
            <b style="color:#fda4af;">${pb.totalStormRescues || 0} chuyến</b>
          </div>
        </div>
      </section>

      <button type="button" id="btn-reset-shift" class="btn-primary">
        ✅ Chốt Ca Hiện Tại &amp; Bắt Đầu Ca Mới
      </button>
    `;

    body.querySelector('#btn-reset-shift')?.addEventListener('click', () => {
      const closedCash = resetShiftSession(true);
      logTransaction('income', `Chốt Ca Kinh Doanh (+$${closedCash.toLocaleString()})`, 0, 0);
      sound.playUpgrade();
      saveGameServer(true);
      this.toast(`📋 Đã lưu kỷ lục Ca (+$${closedCash.toLocaleString()}) và mở Ca kinh doanh mới!`);
      this.openShiftModal();
    });
  }

  openAccountModal() {
    this.els.accountModal.hidden = false;
    const body = this.els.accountBody;
    const gfx = this.cb.getGraphicsInfo ? this.cb.getGraphicsInfo() : null;
    const netWorth = getEmpireNetWorth();
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
        hydrateLoadedState();
        if (this.cb.onUpgrade) this.cb.onUpgrade('lumberjacks');
        if (this.cb.onSkinChange) this.cb.onSkinChange();
        if (this.cb.onPetChange) this.cb.onPetChange();
        if (this.cb.onVehicleChange) this.cb.onVehicleChange();
        if (this.cb.onYachtChange) this.cb.onYachtChange();
        if (this.cb.onAirportChange) this.cb.onAirportChange();
        if (this.cb.onIslandChange) this.cb.onIslandChange();
        if (this.cb.onHqChange) this.cb.onHqChange();
        if (this.cb.onResortChange) this.cb.onResortChange();
        if (this.cb.onFurnitureMillChange) this.cb.onFurnitureMillChange();
        if (this.cb.onLighthouseChange) this.cb.onLighthouseChange();
        if (this.cb.onDeepPortChange) this.cb.onDeepPortChange();
        if (this.cb.onGreenEnergyChange) this.cb.onGreenEnergyChange();
        if (this.cb.onLiveryChange) this.cb.onLiveryChange();
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
