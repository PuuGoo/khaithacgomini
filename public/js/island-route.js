import { readRegatta, scoreRegatta } from './island-regatta.js';

export const PIER_COST = 6;
export const HOLD_CAPACITY = 12;
export const SAIL_MS = 3500;
const FISH_INTERVAL_MS = 5000;
const PLANK_STOCK_CAPACITY = 12;
const PLANK_USE_INTERVAL_MS = 15000;
const MAX_ORDER_SIZE = 6;
const BASE_PLANK_PRICE = 24;
const MAX_PLANK_PRICE = 42;

export function createIslandRoute() {
  return {
    island: 'timberport',
    arrivalAt: 0,
    pierBuilt: false,
    planks: 0,
    fish: 0,
    fishStock: 0,
    stockedAt: 0,
    plankStock: 0,
    plankStockedAt: 0,
    plankOrder: null,
    regatta: null
  };
}

export function restoreIslandRoute(saved) {
  const route = createIslandRoute();
  if (!saved || typeof saved !== 'object') return route;
  const count = (value, max) => Number.isSafeInteger(value) ? Math.min(max, Math.max(0, value)) : 0;
  route.island = saved.island === 'fishery' ? 'fishery' : 'timberport';
  route.arrivalAt = count(saved.arrivalAt, Date.now() + SAIL_MS);
  route.pierBuilt = saved.pierBuilt === true;
  route.planks = count(saved.planks, HOLD_CAPACITY);
  route.fish = count(saved.fish, HOLD_CAPACITY - route.planks);
  route.fishStock = count(saved.fishStock, HOLD_CAPACITY);
  route.stockedAt = count(saved.stockedAt, Date.now());
  route.plankStock = count(saved.plankStock, PLANK_STOCK_CAPACITY);
  route.plankStockedAt = count(saved.plankStockedAt, Date.now());

  const order = saved.plankOrder;
  if (route.pierBuilt && order && order.quantity > 0 && order.quantity <= MAX_ORDER_SIZE
      && order.quantity === route.planks && Number.isInteger(order.unitPrice)
      && order.unitPrice >= BASE_PLANK_PRICE && order.unitPrice <= MAX_PLANK_PRICE) {
    route.plankOrder = { quantity: order.quantity, unitPrice: order.unitPrice };
  }
  route.regatta = readRegatta(saved.regatta);
  return route;
}

export function getFishStock(route, now) {
  if (!route.pierBuilt) return 0;
  const elapsed = Math.max(0, now - route.stockedAt);
  return Math.min(HOLD_CAPACITY, route.fishStock + Math.floor(elapsed / FISH_INTERVAL_MS));
}

export function getPlankMarket(route, now) {
  const elapsed = Math.max(0, now - route.plankStockedAt);
  const stock = Math.max(0, route.plankStock - Math.floor(elapsed / PLANK_USE_INTERVAL_MS));
  const demand = PLANK_STOCK_CAPACITY - stock;
  return {
    stock,
    capacity: PLANK_STOCK_CAPACITY,
    quantity: Math.min(demand, MAX_ORDER_SIZE, HOLD_CAPACITY - route.fish - route.planks),
    unitPrice: BASE_PLANK_PRICE + Math.round((MAX_PLANK_PRICE - BASE_PLANK_PRICE) * demand / PLANK_STOCK_CAPACITY)
  };
}

// Each transaction updates both sides of a transfer before the game state is saved.
export function performIslandAction(state, action, now = Date.now()) {
  const route = state.islandRoute;
  if (route.arrivalAt > now) return false;
  const atHome = route.island === 'timberport';
  switch (action) {
    case 'load-planks': {
      if (!atHome || route.pierBuilt || route.planks > 0 || state.planks < PIER_COST) return false;
      state.planks -= PIER_COST;
      route.planks = PIER_COST;
      break;
    }
    case 'accept-plank-order': {
      if (!atHome || !route.pierBuilt || route.plankOrder || route.planks > 0) return false;
      const market = getPlankMarket(route, now);
      const quantity = Math.min(market.quantity, Math.floor(state.planks));
      if (!Number.isFinite(quantity) || quantity <= 0) return false;
      const { unitPrice } = market;
      state.planks -= quantity;
      route.planks = quantity;
      route.plankOrder = { quantity, unitPrice };
      break;
    }
    case 'return-planks':
      if (!atHome || !route.pierBuilt || route.planks <= 0) return false;
      state.planks += route.planks;
      route.planks = 0;
      route.plankOrder = null;
      break;
    case 'deliver-planks': {
      if (atHome || !route.pierBuilt || !route.plankOrder) return false;
      const { quantity, unitPrice } = route.plankOrder;
      const { stock, capacity } = getPlankMarket(route, now);
      if (route.planks !== quantity || stock + quantity > capacity) return false;
      state.cash += quantity * unitPrice;
      route.plankStock = stock + quantity;
      route.plankStockedAt = now;
      scoreRegatta(route, quantity, now);
      route.planks = 0;
      route.plankOrder = null;
      break;
    }
    case 'sail':
      if (atHome && !route.pierBuilt && route.planks < PIER_COST) return false;
      route.island = atHome ? 'fishery' : 'timberport';
      route.arrivalAt = now + SAIL_MS;
      break;
    case 'build-pier':
      if (atHome || route.pierBuilt || route.planks < PIER_COST) return false;
      route.planks -= PIER_COST;
      route.pierBuilt = true;
      route.fishStock = 8;
      route.stockedAt = now;
      break;
    case 'load-fish': {
      if (atHome) return false;
      const stock = getFishStock(route, now);
      const amount = Math.min(stock, HOLD_CAPACITY - route.planks - route.fish);
      if (amount <= 0) return false;
      route.fish += amount;
      route.fishStock = stock - amount;
      route.stockedAt = now;
      break;
    }
    case 'unload-fish':
      if (!atHome || route.fish <= 0) return false;
      state.freshFish += route.fish;
      scoreRegatta(route, route.fish, now);
      route.fish = 0;
      break;
    default:
      return false;
  }
  return true;
}
