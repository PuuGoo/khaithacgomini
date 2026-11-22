import * as THREE from 'three';
import { createFishingBoatModel, createFisheryIslandModel, disposeObject3D } from './models.js';
import { sound } from './audio.js';
import { gameState, logTransaction, recordRevenue, saveGameServer } from './state.js';
import { getFishStock, getPlankMarket, HOLD_CAPACITY, performIslandAction, PIER_COST, SAIL_MS } from './island-route.js';
import { getRegattaStatus } from './island-regatta.js';
import { ZONES } from './world.js';

export class Archipelago {
  constructor(engine) {
    this.engine = engine;
    this.dialog = document.getElementById('island-dialog');
    this.status = document.getElementById('island-status');
    this.title = document.getElementById('island-title');
    this.stops = Array.from(this.dialog.querySelectorAll('[data-route-stop]'));
    this.cargo = document.getElementById('island-cargo');
    this.market = document.getElementById('island-market');
    this.receipt = document.getElementById('island-receipt');
    this.crossing = document.getElementById('island-crossing');
    this.regatta = document.getElementById('island-regatta');
    this.regattaRules = document.getElementById('island-regatta-rules');
    this.regattaScore = document.getElementById('island-regatta-score');
    this.regattaProgress = document.getElementById('island-regatta-progress');
    this.regattaRival = document.getElementById('island-regatta-rival');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.buttons = new Map(
      Array.from(this.dialog.querySelectorAll('[data-island-action]'), button => [
        button.dataset.islandAction, button
      ])
    );

    document.getElementById('btn-archipelago').addEventListener('click', () => this.open());
    document.getElementById('btn-archipelago-minimap').addEventListener('click', () => this.open());
    document.getElementById('btn-guide-ferry').addEventListener('click', () => {
      if (engine.controlMode !== 'foot' || this.required) return;
      engine.walkToFerry = true;
      this.dialog.close();
    });
    this.dialog.addEventListener('cancel', event => {
      if (this.required) event.preventDefault();
    });
    this.dialog.addEventListener('click', event => {
      const action = event.target.closest('[data-island-action]')?.dataset.islandAction;
      if (action === 'close') {
        if (!this.required) this.dialog.close();
        return;
      }
      const button = this.buttons.get(action);
      if (!button || button.hidden || button.disabled || (!this.required && !this.atPier)) return;
      const { plankOrder: order, fish } = gameState.islandRoute;
      if (!performIslandAction(gameState, action)) {
        this.refresh();
        return;
      }
      this.receipt.textContent = '';
      if (action === 'sail') {
        sound.playShipHorn();
        engine.playerPos.copy(ZONES.ferryPier);
        engine.playerModel.position.copy(engine.playerPos);
      } else if (action === 'deliver-planks') {
        const payout = order.quantity * order.unitPrice;
        recordRevenue('contracts', payout);
        logTransaction('income', 'Giao ván tại Đảo Ngư Trường', payout);
        sound.playCash();
        this.receipt.textContent = 'Đã giao ' + order.quantity + ' ván · +$' + payout;
      } else if (action === 'unload-fish') {
        sound.playSplash();
        this.receipt.textContent = 'Đã chuyển ' + fish + ' cá vào nhà máy';
      } else if (action === 'build-pier') {
        sound.playUpgrade();
        this.receipt.textContent = 'Cầu cảng đã mở · Có thể xếp cá và nhận đơn giao ván';
      }
      saveGameServer();
      engine.syncSawmillVisuals();
      engine.ui.refreshHUD();
      this.refresh();
      if (button.hidden || button.disabled) this.title.focus();
    });
  }

  get required() {
    const route = gameState.islandRoute;
    return route.island === 'fishery' || route.arrivalAt > Date.now();
  }

  get atPier() {
    return this.engine.controlMode === 'foot' && this.engine.playerPos.distanceTo(ZONES.ferryPier) < 5;
  }

  open() {
    if (this.dialog.open) return;
    this.engine.keys.clear();
    this.engine.resetJoystick();
    this.refresh();
    this.dialog.showModal();
  }

  update(frameTime) {
    if (!this.required && gameState.islandRoute.arrivalAt) {
      this.engine.playerPos.copy(ZONES.ferryPier);
      this.engine.playerModel.position.copy(ZONES.ferryPier);
      gameState.islandRoute.arrivalAt = 0;
      saveGameServer();
      this.refresh();
    }
    if (frameTime < (this.nextRefresh || 0)) return;
    this.nextRefresh = frameTime + 250;
    this.refresh();
  }

  refresh() {
    const route = gameState.islandRoute;
    const now = Date.now();
    const seconds = Math.max(0, Math.ceil((route.arrivalAt - now) / 1000));
    const atHome = route.island === 'timberport';
    const stock = getFishStock(route, now);
    const market = getPlankMarket(route, now);
    const order = route.plankOrder;
    const destination = atHome ? 'TimberPort' : 'Đảo Ngư Trường';

    let status;
    if (seconds) {
      status = 'Đang đến ' + destination + ' · ' + seconds + ' giây';
    } else if (!atHome) {
      status = route.pierBuilt
        ? 'Kho Ngư Trường còn ' + stock + ' cá tươi. Kho bổ sung 1 cá mỗi 5 giây.'
        : 'Dùng ' + PIER_COST + ' ván trên tàu để xây cầu cảng.';
    } else if (!this.atPier) {
      status = this.engine.controlMode === 'foot'
        ? 'Bến Liên Đảo cách ' + Math.ceil(this.engine.playerPos.distanceTo(ZONES.ferryPier)) + ' m.'
        : 'Rời phương tiện trước khi đi đến Bến Liên Đảo.';
    } else {
      status = route.pierBuilt
        ? 'Tuyến Ngư Trường đang hoạt động. Dỡ cá để chuyển vào nhà máy đóng hộp.'
        : 'Cần ' + PIER_COST + ' ván để mở tuyến · Kho TimberPort có ' + gameState.planks + ' ván.';
    }

    this.title.textContent = seconds ? 'Trên biển' : destination;
    this.crossing.hidden = seconds === 0;
    this.crossing.value = Math.max(0, 100 * (1 - (route.arrivalAt - now) / SAIL_MS));
    document.getElementById('fishery-access').textContent = route.pierBuilt
      ? 'Cầu cảng đã mở' : 'Cần 6 ván để xây cầu cảng';
    for (const stop of this.stops) {
      stop.setAttribute('aria-current', !seconds && stop.dataset.routeStop === route.island ? 'location' : 'false');
    }
    if (this.status.textContent !== status) this.status.textContent = status;
    this.cargo.textContent = 'Khoang tàu ' + (route.planks + route.fish) + '/' + HOLD_CAPACITY
      + ' · ' + route.planks + ' ván · ' + route.fish + ' cá tươi';
    const show = (action, visible, enabled = true) => {
      const button = this.buttons.get(action);
      button.hidden = !visible;
      button.disabled = !enabled;
    };
    const guide = document.getElementById('btn-guide-ferry');
    guide.hidden = !atHome || seconds > 0 || this.atPier;
    guide.disabled = this.engine.controlMode !== 'foot';
    show('close', atHome && !seconds);
    show('load-planks', atHome && !seconds && !route.pierBuilt && !route.planks,
      this.atPier && gameState.planks >= PIER_COST);
    this.market.hidden = !route.pierBuilt || seconds > 0;
    if (!this.market.hidden) {
      const supply = 'Kho ván Ngư Trường ' + market.stock + '/' + market.capacity;
      this.market.textContent = order
        ? supply + ' · Đơn đang chở ' + order.quantity + ' ván · $' + order.unitPrice + '/ván'
        : supply + ' · Giá mua $' + market.unitPrice + '/ván';
    }
    const loadable = Math.max(0, Math.min(market.quantity, Math.floor(gameState.planks)));
    const canLoadOrder = atHome && !seconds && route.pierBuilt && !order && !route.planks;
    show('accept-plank-order', canLoadOrder,
      this.atPier && loadable > 0);
    this.buttons.get('accept-plank-order').textContent = loadable
      ? 'Xếp ' + loadable + ' ván · $' + loadable * market.unitPrice
      : market.quantity ? 'Cần ván trong kho' : 'Chưa có chỗ nhận ván';
    show('return-planks', atHome && !seconds && route.pierBuilt && route.planks > 0, this.atPier);
    show('deliver-planks', !atHome && !seconds && Boolean(order));
    show('sail', !seconds, !atHome || this.atPier && (route.pierBuilt || route.planks >= PIER_COST));
    this.buttons.get('sail').textContent = atHome ? 'Đi Ngư Trường' : 'Về TimberPort';
    show('build-pier', !atHome && !seconds && !route.pierBuilt, route.planks >= PIER_COST);
    show('load-fish', !atHome && !seconds && route.pierBuilt, stock > 0 && route.fish + route.planks < HOLD_CAPACITY);
    show('unload-fish', atHome && !seconds && route.fish > 0, this.atPier);

    this.regatta.hidden = !route.pierBuilt;
    if (!this.regatta.hidden) {
      const event = getRegattaStatus(route.regatta, now);
      const days = Math.ceil((event.endsAt - now) / 86400000);
      this.regattaRules.textContent = 'Giao 1 ván hoặc dỡ 1 cá được 1 điểm. Đặt lại thứ Hai 00:00 (giờ Việt Nam) · Còn ' + days + ' ngày.';
      this.regattaScore.textContent = 'Bạn ' + event.score + ' điểm · Hải Âu (AI) ' + event.rivalScore + ' điểm';
      this.regattaProgress.max = event.target;
      this.regattaProgress.value = event.score;
      this.regattaRival.textContent = 'Hải Âu (AI) · ' + event.activity
        + (event.score >= event.target ? ' · Bạn đã vượt mốc tuần' : ' · Mốc tuần ' + event.target + ' điểm');
    }
  }

  render(elapsed) {
    if (!this.scene) this.createScene();
    const route = gameState.islandRoute;
    const now = Date.now();
    const sailing = route.arrivalAt > now;
    const motion = !this.reducedMotion.matches;
    const progress = THREE.MathUtils.clamp(1 - (route.arrivalAt - now) / SAIL_MS, 0, 1);
    const crossingX = motion ? THREE.MathUtils.lerp(-6, 6, progress) : 0;
    this.land.visible = !sailing;
    this.pier.visible = route.pierBuilt;
    this.boat.position.set(sailing ? crossingX : 5, motion ? Math.sin(elapsed * 2) * 0.11 : 0, sailing ? 0 : 4);
    this.boat.rotation.y = sailing ? Math.PI / 2 : 0;
    this.boat.rotation.z = motion ? Math.sin(elapsed * 1.6) * 0.05 : 0;

    const rival = getRegattaStatus(route.regatta, now);
    this.rivalBoat.visible = route.pierBuilt && !sailing && (motion ? rival.distance < 1 : rival.distance === 0);
    this.rivalBoat.position.set(-4 - rival.distance * 10, 0, 6 + rival.distance * 3);
    this.rivalBoat.rotation.y = rival.activity === 'Đang về TimberPort' ? -Math.PI / 2 : Math.PI / 2;
    const camera = this.camera;
    camera.aspect = this.engine.camera.aspect;
    camera.updateProjectionMatrix();
    this.engine.renderer.render(this.scene, camera);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#9bd7ea');
    this.scene.fog = new THREE.Fog('#9bd7ea', 34, 82);
    this.scene.add(new THREE.HemisphereLight('#e0f2fe', '#524739', 2.1));
    const sun = new THREE.DirectionalLight('#ffedd5', 2);
    sun.position.set(-6, 12, 4);
    this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 150);
    this.camera.position.set(15, 16, 25);
    this.camera.lookAt(0, 0, 1);

    const sea = new THREE.Mesh(
      new THREE.BoxGeometry(200, 0.3, 200),
      new THREE.MeshStandardMaterial({ color: '#187f9f' })
    );
    sea.position.y = -0.55;
    this.scene.add(sea);
    this.land = createFisheryIslandModel();
    this.pier = this.land.userData.pier;
    this.scene.add(this.land);
    this.boat = createFishingBoatModel();
    this.scene.add(this.boat);
    this.rivalBoat = createFishingBoatModel(1);
    this.scene.add(this.rivalBoat);
  }

  dispose() {
    if (this.scene) disposeObject3D(this.scene);
  }
}
