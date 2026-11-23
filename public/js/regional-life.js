import * as THREE from 'three';
import { CONNECTOR_ROADS, DISTRICTS, districtIndex, districtRoads, LAND_EDGE_Z, nearbyDistricts, WORLD_BOUNDS } from './regions.js';

const MAX_VISIBLE = 64;
const RENDER_RADIUS = 3;
const MAX_TOWNS = (2 * RENDER_RADIUS + 1) ** 2;
const STATION_COLORS = { land: 0xfbbf24, heli: 0x8df1a2, plane: 0xc4b5fd, yacht: 0x67e8f9 };
const WALKERS_PER_DISTRICT = 144;
const VIEW_RADIUS = 58;
const COLORS = [0x4c8dd4, 0xc6745c, 0x67a46c, 0xd6ac60, 0x876daf];

export class RegionalLife {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.transform = new THREE.Object3D();
    this.tint = new THREE.Color();
    this.nearby = [];
    this.walkerPool = [];
    this.people = [];
    this.buildSettlements();
  }

  place(batch, index, x, y, z, sx = 1, sy = 1, sz = 1, yaw = 0) {
    const object = this.transform;
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    object.rotation.y = yaw;
    object.updateMatrix();
    batch.setMatrixAt(index, object.matrix);
  }

  buildSettlements() {
    const makeBatch = (geometry, material, capacity) => {
      const batch = new THREE.InstancedMesh(geometry, material, capacity);
      batch.count = 0;
      batch.frustumCulled = false;
      batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(batch);
      return batch;
    };
    this.roads = makeBatch(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#93877a', roughness: 1 }), MAX_TOWNS * 2 + CONNECTOR_ROADS.length);
    this.walls = makeBatch(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xb97a45, roughness: 0.88 }), MAX_TOWNS * 4);
    this.roofs = makeBatch(new THREE.ConeGeometry(0.8, 1, 4).rotateY(Math.PI / 4),
      new THREE.MeshStandardMaterial({ color: '#5c3317', roughness: 0.88 }), MAX_TOWNS * 4);
    this.checkpoints = makeBatch(new THREE.CylinderGeometry(0.6, 0.85, 2.4, 6),
      new THREE.MeshBasicMaterial({ color: '#54e1b8' }), MAX_TOWNS);
    this.stations = makeBatch(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(), MAX_TOWNS * 3);
    this.parked = makeBatch(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }), MAX_TOWNS * 3);
    this.detail = makeBatch(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#455c72', roughness: 0.65 }), MAX_TOWNS * 3);
    this.wallBase = new THREE.Color(0xc68b53);
  }

  updateSettlements(row, column, activeHome) {
    if (this.settlementRow === row && this.settlementColumn === column && this.activeHome === activeHome) return;
    this.activeHome = activeHome;
    this.settlementRow = row;
    this.settlementColumn = column;
    const villages = nearbyDistricts(row, column, RENDER_RADIUS).filter(district => district.developed);
    const roads = [...districtRoads(villages), ...CONNECTOR_ROADS];
    this.roads.count = roads.length;
    for (const [i, [[x1, z1], [x2, z2]]] of roads.entries()) {
      this.place(this.roads, i, (x1 + x2) / 2, 0.04 + (i % 2) * 0.003, (z1 + z2) / 2,
        Math.abs(x2 - x1) + 4, 1, Math.abs(z2 - z1) + 4);
    }

    this.walls.count = this.roofs.count = villages.length * 4;
    this.checkpoints.count = villages.length;
    let stationIndex = 0;
    for (const [i, town] of villages.entries()) {
      const seed = town.row * DISTRICTS[0].length + town.column;
      this.place(this.checkpoints, i, town.x, 1.2, town.z);
      for (const station of town.stations) {
        this.place(this.stations, stationIndex, station.x, 0.06, station.z,
          station.mode === 'plane' ? 8 : 3.5, 0.12, station.mode === 'plane' ? 22 : 3.5);
        this.stations.setColorAt(stationIndex, this.tint.setHex(STATION_COLORS[station.mode]));
        this.parked.setColorAt(stationIndex, this.tint);
        const { x, z, mode } = station;
        if (mode === 'yacht') {
          this.place(this.parked, stationIndex, x, 0.15, station.parkZ, 2.2, 0.75, 5);
          this.place(this.detail, stationIndex, x, 0.8, station.parkZ, 1.45, 0.7, 1.8);
        } else if (mode === 'plane' || mode === 'heli') {
          this.place(this.parked, stationIndex, x, 0.62, z, 1.25, 0.85, 3.8);
          this.place(this.detail, stationIndex, x, mode === 'heli' ? 1.45 : 0.75, z, 4.8, 0.11, 0.68);
        } else {
          this.place(this.parked, stationIndex, x, 0.38, z, 1.5, 0.65, 2.7);
          this.place(this.detail, stationIndex, x, 0.86, z - 0.12, 1.25, 0.54, 1.25);
        }
        if (activeHome?.name && station.x === activeHome.x && station.z === activeHome.z) {
          this.place(this.parked, stationIndex, x, -6, z, 0, 0, 0);
          this.place(this.detail, stationIndex, x, -6, z, 0, 0, 0);
        }
        stationIndex++;

      }
      for (let house = 0; house < 4; house++) {
        const index = i * 4 + house;
        const x = town.x + (house % 2 === 0 ? -1 : 1) * (12 + house * 3);
        const z = town.z + (house < 2 ? -16 : 16);
        const height = 4 + (seed + house) % 3;
        this.place(this.walls, index, x, height / 2, z, 7, height, 6);
        this.place(this.roofs, index, x, height + 0.75, z, 7, 2, 6);
        this.walls.setColorAt(index, this.tint.setHex(COLORS[(seed + house) % COLORS.length]).lerp(this.wallBase, 0.7));
      }
    }
    this.stations.count = this.parked.count = this.detail.count = stationIndex;
    for (const batch of [this.roads, this.walls, this.roofs, this.checkpoints, this.stations, this.parked, this.detail]) {
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
  }

  update(player, elapsed, lowSpec, activeHome = null) {
    const { row, column } = districtIndex(player.x, player.z);
    this.updateSettlements(row, column, activeHome);
    this.people.length = 0;
  }

  dispose() {
    this.group.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
    });
  }
}
