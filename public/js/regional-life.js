import * as THREE from 'three';
import { DISTRICTS, districtIndex, LAND_EDGE_Z, REGIONAL_ROADS, WORLD_BOUNDS } from './regions.js';

const MAX_VISIBLE = 64;
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

    const createBatch = (geometry, color) => {
      const batch = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }), MAX_VISIBLE);
      batch.count = 0;
      batch.frustumCulled = false;
      batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(batch);
      return batch;
    };
    this.body = createBatch(new THREE.BoxGeometry(0.57, 0.76, 0.34), 0xffffff);
    this.head = createBatch(new THREE.BoxGeometry(0.38, 0.4, 0.36), 0xe0b486);
    this.legs = createBatch(new THREE.BoxGeometry(0.48, 0.56, 0.29), 0x303b4b);
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
    const villages = DISTRICTS.flat().filter(district => district.developed);
    const makeBatch = (geometry, material, count) => {
      const batch = new THREE.InstancedMesh(geometry, material, count);
      this.group.add(batch);
      return batch;
    };
    const roads = makeBatch(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#93877a', roughness: 1 }), REGIONAL_ROADS.length);
    for (const [i, [[x1, z1], [x2, z2]]] of REGIONAL_ROADS.entries()) {
      this.place(roads, i, (x1 + x2) / 2, 0.04 + (i % 2) * 0.003, (z1 + z2) / 2,
        Math.abs(x2 - x1) + 4, 1, Math.abs(z2 - z1) + 4);
    }

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#77534e', roughness: 0.9 });
    const wallBase = new THREE.Color(0xffebcd);
    const roofGeometry = new THREE.ConeGeometry(0.8, 1, 4).rotateY(Math.PI / 4);
    const walls = makeBatch(new THREE.BoxGeometry(1, 1, 1), wallMaterial, villages.length * 4);
    const roofs = makeBatch(roofGeometry, roofMaterial, villages.length * 4);
    for (const [i, town] of villages.entries()) {
      for (let house = 0; house < 4; house++) {
        const index = i * 4 + house;
        const x = town.x + (house % 2 === 0 ? -1 : 1) * (12 + house * 3);
        const z = town.z + (house < 2 ? -16 : 16);
        const height = 4 + (i + house) % 3;
        this.place(walls, index, x, height / 2, z, 7, height, 6);
        this.place(roofs, index, x, height + 0.75, z, 7, 2, 6);
        walls.setColorAt(index, this.tint.setHex(COLORS[(i + house) % COLORS.length]).lerp(wallBase, 0.7));
      }
    }
  }

  update(player, elapsed, lowSpec) {
    const { row, column } = districtIndex(player.x, player.z);
    const nearby = this.nearby;
    nearby.length = 0;
    if (player.z <= LAND_EDGE_Z + 20) {
      for (const line of DISTRICTS.slice(Math.max(0, row - 1), row + 2)) {
        for (const district of line.slice(Math.max(0, column - 1), column + 2)) {
          this.collectWalkers(district, player, elapsed);
        }
      }
    }

    nearby.sort((a, b) => a.distance - b.distance);
    const count = Math.min(nearby.length, lowSpec ? 28 : MAX_VISIBLE);
    this.people.length = count;
    this.body.count = this.head.count = this.legs.count = count;
    for (let i = 0; i < count; i++) {
      const walker = nearby[i];
      const { x, z, yaw, stride, color } = walker;
      this.place(this.body, i, x, 0.96 + stride * 0.055, z, 1, 1, 1, yaw);
      this.place(this.head, i, x, 1.56 + stride * 0.055, z, 1, 1, 1, yaw);
      this.place(this.legs, i, x, 0.29, z, 1, 1, 1 + stride * 0.75, yaw);
      this.body.setColorAt(i, this.tint.setHex(color));
      this.people[i] = walker;
    }
    for (const batch of [this.body, this.head, this.legs]) batch.instanceMatrix.needsUpdate = true;
    if (this.body.instanceColor) this.body.instanceColor.needsUpdate = true;
  }

  collectWalkers(district, player, elapsed) {
    const { row, column, x: centerX, z: centerZ } = district;
    for (let i = 0; i < WALKERS_PER_DISTRICT; i++) {
      const seed = (row * DISTRICTS[0].length + column) * WALKERS_PER_DISTRICT + i;
      const axisX = i % 2 === 0;
      const phase = elapsed * (0.034 + (seed % 5) * 0.003) + seed * 0.618;
      const cycle = phase % 1;
      const outbound = cycle < 0.5;
      const along = (outbound ? cycle * 4 - 1 : 3 - cycle * 4) * (axisX ? 43 : 49);
      let lane = ((i * 7) % 29 - 14) * (axisX ? 3.4 : 3);
      if (district.developed && Math.abs(lane) >= 9 && Math.abs(lane) <= 26) {
        lane = Math.sign(lane) * (Math.abs(lane) < 18 ? 8 : 27);
      }
      const x = centerX + (axisX ? along : lane);
      const z = centerZ + (axisX ? lane : along);
      const distance = (player.x - x) ** 2 + (player.z - z) ** 2;
      if (z > LAND_EDGE_Z || x < WORLD_BOUNDS.minX || x > WORLD_BOUNDS.maxX || distance > VIEW_RADIUS ** 2) continue;
      const index = this.nearby.length;
      const walker = this.walkerPool[index] ??= {};
      walker.x = x;
      walker.z = z;
      walker.yaw = axisX ? (outbound ? Math.PI / 2 : -Math.PI / 2) : (outbound ? 0 : Math.PI);
      walker.distance = distance;
      walker.stride = Math.abs(Math.sin(elapsed * 6 + seed));
      walker.color = COLORS[seed % COLORS.length];
      this.nearby.push(walker);
    }
  }

  dispose() {
    this.group.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
    });
  }
}
