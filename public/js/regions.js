export const WORLD_BOUNDS = { minX: -500, maxX: 580, minZ: -1000, maxZ: 34 };
export const LAND_EDGE_Z = 25;
export const MINIMAP_BOUNDS = {
  minX: WORLD_BOUNDS.minX - 8, maxX: WORLD_BOUNDS.maxX + 8,
  minZ: WORLD_BOUNDS.minZ - 8, maxZ: 154
};

const COLUMNS = 12;
const ROWS = 10;
const CELL_WIDTH = (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / COLUMNS;
const CELL_DEPTH = (LAND_EDGE_Z - WORLD_BOUNDS.minZ) / ROWS;

export const DISTRICTS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLUMNS }, (_, column) => {
    const x = WORLD_BOUNDS.minX + (column + 0.5) * CELL_WIDTH;
    const z = WORLD_BOUNDS.minZ + (row + 0.5) * CELL_DEPTH;
    const developed = z < -215 || x < -125 || x > 205;
    return { row, column, x, z, developed };
  })
);

export const REGIONAL_ROADS = [
  [[46, -148], [46, -231.25]],
  [[46, -231.25], [85, -231.25]],
  [[145, 21], [265, 21]],
  [[265, 21], [265, -26.25]],
  [[-66, -4], [-185, -4]],
  [[-185, -4], [-185, -26.25]]
];

for (const row of DISTRICTS) {
  for (const district of row) {
    if (!district.developed) continue;
    const east = row[district.column + 1];
    const south = DISTRICTS[district.row + 1]?.[district.column];
    for (const neighbor of [east, south]) {
      if (neighbor?.developed) REGIONAL_ROADS.push([[district.x, district.z], [neighbor.x, neighbor.z]]);
    }
  }
}

export function districtIndex(x, z) {
  return {
    column: Math.max(0, Math.min(COLUMNS - 1, Math.floor((x - WORLD_BOUNDS.minX) / CELL_WIDTH))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor((z - WORLD_BOUNDS.minZ) / CELL_DEPTH)))
  };
}
