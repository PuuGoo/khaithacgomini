export const WORLD_BOUNDS = { minX: -5360, maxX: 5440, minZ: -10225, maxZ: 34 };
export const LAND_EDGE_Z = 25;
export const MINIMAP_BOUNDS = {
  minX: WORLD_BOUNDS.minX - 8, maxX: WORLD_BOUNDS.maxX + 8,
  minZ: WORLD_BOUNDS.minZ - 8, maxZ: 154
};

const COLUMNS = 120;
const ROWS = 100;
const CELL_WIDTH = (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / COLUMNS;
const CELL_DEPTH = (LAND_EDGE_Z - WORLD_BOUNDS.minZ) / ROWS;

export const DISTRICTS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLUMNS }, (_, column) => {
    const x = WORLD_BOUNDS.minX + (column + 0.5) * CELL_WIDTH;
    const z = WORLD_BOUNDS.minZ + (row + 0.5) * CELL_DEPTH;
    const developed = z < -165 || x < -155 || x > 165;
    const stations = developed ? [{ mode: 'land', x: x + 7, z, y: 0 }] : [];
    if (developed && column % 5 === 0) stations.push({ mode: 'heli', x: x - 11, z, y: 0.35 });
    if (developed && column % 5 === 2) stations.push({ mode: 'plane', x: x - 12, z: z + 30, y: 0.25 });
    if (developed && row === ROWS - 1 && column % 4 === 0) stations.push({ mode: 'yacht', x, z: 22, y: 0.05, parkZ: 31 });
    return { row, column, x, z, developed, stations, name: 'Trạm ' + (ROWS - row) + '–' + (column + 1) };
  })
);

export const CONNECTOR_ROADS = [
  [[5, -106], [5, -231.25]],
  [[5, -231.25], [85, -231.25]],
  [[116, 10], [265, 10]],
  [[265, 10], [265, -26.25]],
  [[-114, 10], [-185, 10]],
  [[-185, 10], [-185, -26.25]]
];

export function nearbyDistricts(row, column, radius) {
  return DISTRICTS.slice(Math.max(0, row - radius), row + radius + 1)
    .flatMap(line => line.slice(Math.max(0, column - radius), column + radius + 1));
}

export function districtRoads(districts) {
  const roads = [];
  for (const district of districts) {
    if (!district.developed) continue;
    const east = DISTRICTS[district.row][district.column + 1];
    const south = DISTRICTS[district.row + 1]?.[district.column];
    for (const neighbor of [east, south]) {
      if (neighbor?.developed) roads.push([[district.x, district.z], [neighbor.x, neighbor.z]]);
    }
  }
  return roads;
}

export function restoreCheckpoint(saved) {
  const district = DISTRICTS[saved?.row]?.[saved?.column];
  return district?.developed ? { row: district.row, column: district.column } : null;
}

export function findCheckpoint(position) {
  const { row, column } = districtIndex(position.x, position.z);
  const district = DISTRICTS[row][column];
  return district.developed && Math.hypot(district.x - position.x, district.z - position.z) <= 6
    ? district : null;
}

export function findRegionalStation(position, mode) {
  const { row, column } = districtIndex(position.x, position.z);
  const district = DISTRICTS[row][column];
  const station = district.stations.find(item => (!mode || item.mode === mode)
    && Math.hypot(item.x - position.x, item.z - position.z) <= 4.5);
  return station ? { ...station, name: district.name } : null;
}

export function districtIndex(x, z) {
  return {
    column: Math.max(0, Math.min(COLUMNS - 1, Math.floor((x - WORLD_BOUNDS.minX) / CELL_WIDTH))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor((z - WORLD_BOUNDS.minZ) / CELL_DEPTH)))
  };
}
