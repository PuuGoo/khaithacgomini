const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
// Monday 00:00 in Vietnam.
const FIRST_MONDAY = Date.UTC(1970, 0, 4, 17);
const RIVAL_CYCLE_MS = 30000;
const RIVAL_TRIPS = 5;
const RIVAL_CARGO = 8;

function getWeekStart(now) {
  return FIRST_MONDAY + Math.floor((now - FIRST_MONDAY) / WEEK_MS) * WEEK_MS;
}

export function readRegatta(saved, now = Date.now()) {
  const weekStart = getWeekStart(now);
  if (saved?.weekStart !== weekStart || !Number.isSafeInteger(saved.startedAt)
      || saved.startedAt < weekStart || saved.startedAt > now
      || !Number.isSafeInteger(saved.score) || saved.score < 1) {
    return { weekStart, startedAt: 0, score: 0 };
  }
  return { weekStart, startedAt: saved.startedAt, score: saved.score };
}

export function scoreRegatta(route, cargo, now) {
  const regatta = readRegatta(route.regatta, now);
  if (!regatta.startedAt) regatta.startedAt = now;
  regatta.score += cargo;
  route.regatta = regatta;
}

export function getRegattaStatus(saved, now) {
  const { weekStart, startedAt, score } = readRegatta(saved, now);
  const elapsed = startedAt ? now - startedAt : 0;
  const trips = Math.min(RIVAL_TRIPS, Math.floor(elapsed / RIVAL_CYCLE_MS));
  const phase = elapsed % RIVAL_CYCLE_MS;
  let activity = 'Chờ chuyến đầu của bạn';
  let distance = 1;
  if (trips === RIVAL_TRIPS) {
    activity = 'Đã hoàn thành lượt tuần';
  } else if (startedAt && phase < 10000) {
    activity = 'Đang đi Ngư Trường';
    distance = 1 - phase / 10000;
  } else if (startedAt && phase < 18000) {
    activity = 'Đang xếp hàng tại bến';
    distance = 0;
  } else if (startedAt) {
    activity = 'Đang về TimberPort';
    distance = (phase - 18000) / 12000;
  }
  return {
    score,
    rivalScore: trips * RIVAL_CARGO,
    target: RIVAL_TRIPS * RIVAL_CARGO + 1,
    activity,
    distance,
    endsAt: weekStart + WEEK_MS
  };
}
