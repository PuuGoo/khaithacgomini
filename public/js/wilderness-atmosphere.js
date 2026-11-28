import * as THREE from 'three';
import { STREAM_WATER_Y, groundHeightAt, getStreamCenterX, getStreamHalfWidth } from './wilderness-map.js';

/**
 * TimberPort 3D — Dynamic Wilderness Atmosphere System
 * Zero-GC Day-Night Campfire Embers, Auto-Lit Camp Lantern Posts,
 * Soft Player Hip-Lantern at Dusk/Night, Drifting Forest Fireflies,
 * and Gentle Forest Light Rain (non-storm) with stream ripples.
 *
 * Lighting Performance Budget:
 *  - Only 1 extra dynamic PointLight (player hip-lantern, non-shadow, distance 11)
 *    which softly turns on only at dusk/night.
 *  - Camp lantern posts use emissive materials + additive glow halo sprites (0 extra lights).
 */

function createSoftGlowTexture(innerHex = '#fffbeb', midHex = 'rgba(251, 191, 36, 0.55)', outerHex = 'rgba(245, 158, 11, 0)') {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, innerHex);
  grad.addColorStop(0.35, midHex);
  grad.addColorStop(1, outerHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class WildernessAtmosphereSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lowSpec = Boolean(options.lowSpec);
    this.root = new THREE.Group();
    this.root.name = 'WildernessAtmosphereRoot';
    this.root.userData.wildernessKeep = true;
    this.scene.add(this.root);

    // Autonomous forest weather sub-state (only active during weatherMode === 'auto')
    this.autoWeatherState = 'clear'; // 'clear' | 'mist' | 'light_rain'
    this.autoWeatherTimer = 52;
    this.manualLightRain = false;
    this.rainIntensity = 0; // smoothly blended 0..1
    this.mistIntensity = 0; // smoothly blended 0..1

    // Shared procedural glow textures
    this._fireflyTex = createSoftGlowTexture('#fef9c3', 'rgba(190, 242, 100, 0.65)', 'rgba(132, 204, 22, 0)');
    this._emberTex = createSoftGlowTexture('#fff7ed', 'rgba(251, 146, 60, 0.78)', 'rgba(234, 88, 12, 0)');
    this._lanternHaloTex = createSoftGlowTexture('#fef3c7', 'rgba(245, 158, 11, 0.42)', 'rgba(217, 119, 6, 0)');

    // 1. Light Forest Rain (Zero-GC LineSegments centered around player)
    this._rainCount = this.lowSpec ? 140 : 260;
    this._rainBoxHalfX = 14.5;
    this._rainBoxHeight = 16.5;
    this._rainBoxHalfZ = 14.5;
    this._rainData = new Float32Array(this._rainCount * 4); // ox, y, oz, speed
    this._rainPositions = new Float32Array(this._rainCount * 6); // 2 vertices per streak
    this._initRainSystem();

    // 2. Subtle Stream Raindrop Ripples (pooled rings, zero per-frame allocations)
    this._rippleCount = this.lowSpec ? 8 : 14;
    this._ripples = [];
    this._rippleSpawnTimer = 0;
    this._initRainRipples();

    // 3. Campfire Rising Embers (Zero-GC Points above built campfire)
    this._emberCount = this.lowSpec ? 22 : 38;
    this._emberData = new Float32Array(this._emberCount * 5); // lx, y, lz, phase, speed
    this._emberPositions = new Float32Array(this._emberCount * 3);
    this._initCampfireEmbers();

    // 4. Night Forest Fireflies (Zero-GC Points drifting gently around player/forest)
    this._fireflyCount = this.lowSpec ? 26 : 48;
    this._fireflyData = new Float32Array(this._fireflyCount * 5); // ox, baseY, oz, phase, radius
    this._fireflyPositions = new Float32Array(this._fireflyCount * 3);
    this._initFireflies();

    // 5. Auto-Lit Wooden Camp Lantern Posts (emissive glass + halo sprite, zero dynamic light overhead)
    this._lanternPosts = [];
    this._lanternGlassMat = null;
    this._lanternHaloMat = null;
    this._initCampLanternPosts();

    // 6. Soft Player Hip-Lantern PointLight (non-shadow, smoothly activates at dusk/night)
    this.playerLanternLight = new THREE.PointLight(0xffbe6b, 0, 11.5, 1.85);
    this.playerLanternLight.castShadow = false;
    this.playerLanternLight.visible = false;
    this.root.add(this.playerLanternLight);

    // Scratch state (Zero GC)
    this._elapsed = 0;
  }

  _initRainSystem() {
    for (let i = 0; i < this._rainCount; i++) {
      const idx4 = i * 4;
      this._rainData[idx4] = (Math.random() - 0.5) * this._rainBoxHalfX * 2;
      this._rainData[idx4 + 1] = Math.random() * this._rainBoxHeight;
      this._rainData[idx4 + 2] = (Math.random() - 0.5) * this._rainBoxHalfZ * 2;
      this._rainData[idx4 + 3] = 10.5 + Math.random() * 4.5;
    }
    const geo = new THREE.BufferGeometry();
    this._rainPosAttr = new THREE.BufferAttribute(this._rainPositions, 3);
    this._rainPosAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this._rainPosAttr);

    this._rainMat = new THREE.LineBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this._rainLines = new THREE.LineSegments(geo, this._rainMat);
    this._rainLines.frustumCulled = false;
    this._rainLines.visible = false;
    this.root.add(this._rainLines);
  }

  _initRainRipples() {
    this._rippleGeo = new THREE.RingGeometry(0.08, 0.14, 14);
    this._rippleGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < this._rippleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(this._rippleGeo, mat);
      mesh.visible = false;
      this.root.add(mesh);
      this._ripples.push({ mesh, mat, age: 1, life: 0.75 });
    }
  }

  _initCampfireEmbers() {
    for (let i = 0; i < this._emberCount; i++) {
      const idx5 = i * 5;
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.42;
      this._emberData[idx5] = Math.cos(ang) * rad;
      this._emberData[idx5 + 1] = Math.random() * 2.8;
      this._emberData[idx5 + 2] = Math.sin(ang) * rad;
      this._emberData[idx5 + 3] = Math.random() * Math.PI * 2;
      this._emberData[idx5 + 4] = 0.65 + Math.random() * 0.85;
    }
    const geo = new THREE.BufferGeometry();
    this._emberPosAttr = new THREE.BufferAttribute(this._emberPositions, 3);
    this._emberPosAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this._emberPosAttr);

    const emberMatOpts = {
      color: 0xffb347,
      size: 0.24,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    };
    if (this._emberTex) emberMatOpts.map = this._emberTex;
    this._emberMat = new THREE.PointsMaterial(emberMatOpts);
    this._emberPoints = new THREE.Points(geo, this._emberMat);
    this._emberPoints.frustumCulled = false;
    this._emberPoints.visible = false;
    this.root.add(this._emberPoints);
  }

  _initFireflies() {
    for (let i = 0; i < this._fireflyCount; i++) {
      const idx5 = i * 5;
      this._fireflyData[idx5] = (Math.random() - 0.5) * 34;
      this._fireflyData[idx5 + 1] = 0.75 + Math.random() * 2.6;
      this._fireflyData[idx5 + 2] = (Math.random() - 0.5) * 34;
      this._fireflyData[idx5 + 3] = Math.random() * Math.PI * 2;
      this._fireflyData[idx5 + 4] = 0.7 + Math.random() * 1.4;
    }
    const geo = new THREE.BufferGeometry();
    this._fireflyPosAttr = new THREE.BufferAttribute(this._fireflyPositions, 3);
    this._fireflyPosAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this._fireflyPosAttr);

    const fireflyMatOpts = {
      color: 0xd9f99d,
      size: 0.34,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    };
    if (this._fireflyTex) fireflyMatOpts.map = this._fireflyTex;
    this._fireflyMat = new THREE.PointsMaterial(fireflyMatOpts);
    this._fireflyPoints = new THREE.Points(geo, this._fireflyMat);
    this._fireflyPoints.frustumCulled = false;
    this._fireflyPoints.visible = false;
    this.root.add(this._fireflyPoints);
  }

  _initCampLanternPosts() {
    // 4 scenic wooden camp lantern posts around central clearing & river path
    const postCoords = [
      { x: -4.2, z: -3.2 },
      { x: 5.4, z: -2.4 },
      { x: -3.4, z: 5.6 },
      { x: getStreamCenterX(4) - getStreamHalfWidth(4) - 2.6, z: 4.0 }
    ];

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.9, metalness: 0.04 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x2f3740, roughness: 0.45, metalness: 0.78 });
    this._lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.08
    });
    const haloMatOpts = {
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    };
    if (this._lanternHaloTex) haloMatOpts.map = this._lanternHaloTex;
    this._lanternHaloMat = new THREE.SpriteMaterial(haloMatOpts);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.11, 2.35, 7);
    const armGeo = new THREE.BoxGeometry(0.56, 0.08, 0.08);
    const capGeo = new THREE.ConeGeometry(0.18, 0.16, 6);
    const glassGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.24, 6);
    const baseRingGeo = new THREE.CylinderGeometry(0.16, 0.20, 0.16, 7);

    for (let i = 0; i < postCoords.length; i++) {
      const p = postCoords[i];
      const gy = groundHeightAt(p.x, p.z);
      const grp = new THREE.Group();
      grp.position.set(p.x, gy, p.z);
      grp.rotation.y = Math.atan2(-p.x, -p.z);

      const footing = new THREE.Mesh(baseRingGeo, ironMat);
      footing.position.y = 0.08;
      grp.add(footing);

      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.y = 1.18;
      post.castShadow = !this.lowSpec;
      post.receiveShadow = true;
      grp.add(post);

      const arm = new THREE.Mesh(armGeo, woodMat);
      arm.position.set(0.24, 2.24, 0);
      grp.add(arm);

      const cap = new THREE.Mesh(capGeo, ironMat);
      cap.position.set(0.44, 2.15, 0);
      grp.add(cap);

      const glass = new THREE.Mesh(glassGeo, this._lanternGlassMat);
      glass.position.set(0.44, 1.98, 0);
      grp.add(glass);

      const halo = new THREE.Sprite(this._lanternHaloMat);
      halo.position.set(0.44, 1.98, 0);
      halo.scale.set(1.55, 1.55, 1);
      grp.add(halo);

      this.root.add(grp);
      this._lanternPosts.push({ group: grp, halo, phase: i * 1.4 });
    }
  }

  toggleLightRain() {
    this.manualLightRain = !this.manualLightRain;
    if (this.manualLightRain) {
      this.autoWeatherState = 'light_rain';
    } else if (this.autoWeatherState === 'light_rain') {
      this.autoWeatherState = 'clear';
      this.autoWeatherTimer = 55;
    }
    return this.manualLightRain;
  }

  setLightRain(enabled) {
    this.manualLightRain = Boolean(enabled);
    if (this.manualLightRain) {
      this.autoWeatherState = 'light_rain';
    }
  }

  isLightRainActive(weatherMode = 'auto', isStorm = false) {
    if (isStorm) return false;
    if (weatherMode === 'rain') return true;
    if (this.manualLightRain) return true;
    return weatherMode === 'auto' && this.autoWeatherState === 'light_rain';
  }

  getWeatherStatusLabel(weatherMode = 'auto', hour = 10.5, isStorm = false) {
    if (isStorm) return 'Mưa bão';
    if (this.isLightRainActive(weatherMode, isStorm)) return 'Mưa rừng nhẹ';
    if (weatherMode === 'auto' && this.autoWeatherState === 'mist') return 'Sương mỏng';
    if (hour >= 20.0 || hour < 5.0) return 'Đêm quang';
    if (hour >= 17.0 && hour < 20.0) return 'Hoàng hôn';
    if (hour >= 5.0 && hour < 7.5) return 'Bình minh';
    return 'Nắng trong';
  }

  update(dt, ctx = {}) {
    const safeDt = Math.min(0.05, Math.max(0.0001, dt || 0.016));
    this._elapsed += safeDt;

    const weatherMode = ctx.weatherMode || 'auto';
    const isStorm = Boolean(ctx.isStorm);
    const nightFactor = Number.isFinite(ctx.nightFactor) ? ctx.nightFactor : 0;
    const playerPos = ctx.playerPos || { x: 0, y: 0, z: 0 };
    const playerYaw = Number.isFinite(ctx.playerYaw) ? ctx.playerYaw : 0;
    const campfirePos = ctx.campfirePos || null;

    // 1. Autonomous gentle forest weather state machine (only when weatherMode === 'auto' & not overridden)
    if (weatherMode === 'auto' && !isStorm && !this.manualLightRain) {
      this.autoWeatherTimer -= safeDt;
      if (this.autoWeatherTimer <= 0) {
        if (this.autoWeatherState === 'clear') {
          this.autoWeatherState = 'mist';
          this.autoWeatherTimer = 26;
        } else if (this.autoWeatherState === 'mist') {
          this.autoWeatherState = 'light_rain';
          this.autoWeatherTimer = 42;
        } else {
          this.autoWeatherState = 'clear';
          this.autoWeatherTimer = 75;
        }
      }
    }

    const lightRainOn = this.isLightRainActive(weatherMode, isStorm);
    const targetRain = isStorm ? 1.0 : lightRainOn ? 0.62 : 0.0;
    const targetMist = isStorm ? 0.45 : lightRainOn ? 0.32 : (weatherMode === 'auto' && this.autoWeatherState === 'mist' ? 0.24 : 0.0);
    this.rainIntensity += (targetRain - this.rainIntensity) * Math.min(1, safeDt * 1.8);
    this.mistIntensity += (targetMist - this.mistIntensity) * Math.min(1, safeDt * 1.2);

    // 2. Update Rain Streaks (Zero-GC)
    const showRain = this.rainIntensity > 0.02;
    this._rainLines.visible = showRain;
    if (showRain) {
      const windX = isStorm ? 2.4 : 0.85;
      const windZ = isStorm ? 1.2 : 0.35;
      const streakLen = isStorm ? 0.82 : 0.46;
      const fallMult = isStorm ? 1.45 : 0.88;
      const px = playerPos.x;
      const py = playerPos.y;
      const pz = playerPos.z;
      const hx = this._rainBoxHalfX;
      const hz = this._rainBoxHalfZ;
      const hh = this._rainBoxHeight;

      for (let i = 0; i < this._rainCount; i++) {
        const idx4 = i * 4;
        let ox = this._rainData[idx4] + windX * safeDt;
        let ry = this._rainData[idx4 + 1] - this._rainData[idx4 + 3] * fallMult * safeDt;
        let oz = this._rainData[idx4 + 2] + windZ * safeDt;

        if (ry < 0) {
          ry += hh;
          ox = (Math.random() - 0.5) * hx * 2;
          oz = (Math.random() - 0.5) * hz * 2;
        }
        if (ox > hx) ox -= hx * 2;
        else if (ox < -hx) ox += hx * 2;
        if (oz > hz) oz -= hz * 2;
        else if (oz < -hz) oz += hz * 2;

        this._rainData[idx4] = ox;
        this._rainData[idx4 + 1] = ry;
        this._rainData[idx4 + 2] = oz;

        const wx = px + ox;
        const wy = py + ry;
        const wz = pz + oz;

        const idx6 = i * 6;
        this._rainPositions[idx6] = wx;
        this._rainPositions[idx6 + 1] = wy;
        this._rainPositions[idx6 + 2] = wz;
        this._rainPositions[idx6 + 3] = wx - windX * 0.035;
        this._rainPositions[idx6 + 4] = wy + streakLen;
        this._rainPositions[idx6 + 5] = wz - windZ * 0.035;
      }
      this._rainPosAttr.needsUpdate = true;
      this._rainMat.opacity = Math.min(0.55, this.rainIntensity * (isStorm ? 0.52 : 0.38));
    }

    // 3. Update Stream Rain Ripples (Zero-GC ring pool)
    if (showRain) {
      this._rippleSpawnTimer -= safeDt;
      if (this._rippleSpawnTimer <= 0) {
        this._rippleSpawnTimer = isStorm ? 0.06 : 0.11;
        for (let i = 0; i < this._ripples.length; i++) {
          const rp = this._ripples[i];
          if (rp.age >= rp.life) {
            const rz = playerPos.z + (Math.random() - 0.5) * 24;
            const streamCx = getStreamCenterX(rz);
            const hw = Math.max(1.2, getStreamHalfWidth(rz) - 0.5);
            const rx = streamCx + (Math.random() - 0.5) * hw * 1.6;
            const wy = STREAM_WATER_Y + 0.04;
            rp.mesh.position.set(rx, wy, rz);
            rp.mesh.scale.setScalar(0.55);
            rp.mesh.visible = true;
            rp.age = 0;
            rp.life = 0.65 + Math.random() * 0.35;
            break;
          }
        }
      }
    }
    for (let i = 0; i < this._ripples.length; i++) {
      const rp = this._ripples[i];
      if (!rp.mesh.visible) continue;
      rp.age += safeDt;
      if (rp.age >= rp.life) {
        rp.mesh.visible = false;
        rp.mat.opacity = 0;
      } else {
        const t = rp.age / rp.life;
        const sc = 0.55 + t * 2.4;
        rp.mesh.scale.setScalar(sc);
        rp.mat.opacity = (1 - t) * 0.38 * this.rainIntensity;
      }
    }

    // 4. Campfire Rising Embers (when campfire is built)
    if (campfirePos) {
      this._emberPoints.visible = true;
      const cx = campfirePos.x;
      const cy = groundHeightAt(cx, campfirePos.z) + 0.45;
      const cz = campfirePos.z;
      for (let i = 0; i < this._emberCount; i++) {
        const idx5 = i * 5;
        let ey = this._emberData[idx5 + 1] + this._emberData[idx5 + 4] * safeDt;
        if (ey > 3.2) {
          ey = 0.05 + Math.random() * 0.25;
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.random() * 0.38;
          this._emberData[idx5] = Math.cos(ang) * rad;
          this._emberData[idx5 + 2] = Math.sin(ang) * rad;
        }
        this._emberData[idx5 + 1] = ey;
        const ph = this._emberData[idx5 + 3];
        const swirl = 0.14 * (ey * 0.45);
        const idx3 = i * 3;
        this._emberPositions[idx3] = cx + this._emberData[idx5] + Math.sin(this._elapsed * 2.4 + ph) * swirl;
        this._emberPositions[idx3 + 1] = cy + ey;
        this._emberPositions[idx3 + 2] = cz + this._emberData[idx5 + 2] + Math.cos(this._elapsed * 2.1 + ph) * swirl;
      }
      this._emberPosAttr.needsUpdate = true;
      this._emberMat.opacity = 0.55 + nightFactor * 0.40;
    } else {
      this._emberPoints.visible = false;
    }

    // 5. Night Forest Fireflies (active at dusk/night, sheltered during heavy storm)
    const fireflyStrength = isStorm ? 0 : Math.max(0, (nightFactor - 0.18) / 0.82);
    this._fireflyPoints.visible = fireflyStrength > 0.02;
    if (this._fireflyPoints.visible) {
      const px = playerPos.x;
      const pz = playerPos.z;
      for (let i = 0; i < this._fireflyCount; i++) {
        const idx5 = i * 5;
        const ox = this._fireflyData[idx5];
        const baseY = this._fireflyData[idx5 + 1];
        const oz = this._fireflyData[idx5 + 2];
        const ph = this._fireflyData[idx5 + 3];
        const rad = this._fireflyData[idx5 + 4];

        const wx = px + ox + Math.sin(this._elapsed * 0.65 + ph) * rad;
        const wz = pz + oz + Math.cos(this._elapsed * 0.58 + ph * 1.3) * rad;
        const gy = groundHeightAt(wx, wz);
        const wy = gy + baseY + Math.sin(this._elapsed * 1.45 + ph * 2.0) * 0.35;

        const idx3 = i * 3;
        this._fireflyPositions[idx3] = wx;
        this._fireflyPositions[idx3 + 1] = wy;
        this._fireflyPositions[idx3 + 2] = wz;
      }
      this._fireflyPosAttr.needsUpdate = true;
      const twinkle = 0.78 + Math.sin(this._elapsed * 3.1) * 0.22;
      this._fireflyMat.opacity = fireflyStrength * 0.88 * twinkle;
    }

    // 6. Auto-Lit Camp Lantern Posts (emissive + sprite glow, zero extra lights)
    const lanternGlow = Math.max(0, Math.min(1, (nightFactor - 0.12) / 0.72));
    if (this._lanternGlassMat) {
      this._lanternGlassMat.emissiveIntensity = 0.14 + lanternGlow * 2.1;
    }
    if (this._lanternHaloMat) {
      this._lanternHaloMat.opacity = lanternGlow * 0.72;
    }
    for (let i = 0; i < this._lanternPosts.length; i++) {
      const post = this._lanternPosts[i];
      if (post.halo) {
        post.halo.visible = lanternGlow > 0.04;
        if (post.halo.visible) {
          const pulse = 1.45 + Math.sin(this._elapsed * 4.2 + post.phase) * 0.12;
          post.halo.scale.set(pulse, pulse, 1);
        }
      }
    }

    // 7. Soft Player Hip-Lantern PointLight at Dusk / Night
    if (this.playerLanternLight) {
      const hipGlow = Math.max(0, Math.min(1, (nightFactor - 0.22) / 0.68));
      this.playerLanternLight.visible = hipGlow > 0.03;
      if (this.playerLanternLight.visible) {
        const flicker = 0.94 + Math.sin(this._elapsed * 7.5) * 0.06;
        this.playerLanternLight.intensity = hipGlow * 1.45 * flicker;
        // Position slightly beside the player's hip/front so ground & trees ahead are warmly readable
        const fwdX = Math.sin(playerYaw) * 0.45;
        const fwdZ = Math.cos(playerYaw) * 0.45;
        this.playerLanternLight.position.set(
          playerPos.x + fwdX,
          playerPos.y + 1.35,
          playerPos.z + fwdZ
        );
      }
    }
  }

  dispose() {
    if (this.root && this.root.parent) {
      this.root.parent.remove(this.root);
    }
    this._rainLines?.geometry?.dispose();
    this._rainMat?.dispose();
    this._rippleGeo?.dispose();
    for (const rp of this._ripples) rp.mat?.dispose();
    this._emberPoints?.geometry?.dispose();
    this._emberMat?.dispose();
    this._fireflyPoints?.geometry?.dispose();
    this._fireflyMat?.dispose();
    this._lanternGlassMat?.dispose();
    this._lanternHaloMat?.dispose();
    this._fireflyTex?.dispose();
    this._emberTex?.dispose();
    this._lanternHaloTex?.dispose();
  }
}
