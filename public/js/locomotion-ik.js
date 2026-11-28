/**
 * TimberPort 3D — Human Locomotion Blend Tree (Idle + Walk / Jog / Run / Sprint),
 * Relaxed Straight-Line Human Gait & World-Space Quaternion 2-Bone Foot-Locking IK (Zero-GC)
 */
import * as THREE from 'three';

function smoothstep(edge0, edge1, x) {
  const span = edge1 - edge0;
  if (Math.abs(span) < 1e-6) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / span));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// 1. 4-Pace Biomechanical Human Gait Keyframe Curves (Walk, Jog, Run, Sprint)
//    Normalized cycle u in [0, 1):
//      0.00 = Heel strike (leading leg extends cleanly forward ~+0.29m, gentle contact)
//      0.10 = Loading response (subtle 7° knee cushion, smooth weight acceptance)
//      0.24 = Mid-stance (body glides upright over planted leg)
//      0.40 = Terminal stance (natural trailing leg extension behind hip)
//      0.54 = Pre-swing / Toe-off (heel rises softly, toe pushes off)
//      0.66 = Initial swing (relaxed low-arc knee bend to clear ground by ~5-7cm)
//      0.78 = Mid-swing (smooth pendulum pass-through, NO high-knee marching!)
//      0.90 = Terminal swing (shin extends forward smoothly preparing soft heel contact)
// ---------------------------------------------------------------------------
const GAIT_T = [0.00, 0.10, 0.24, 0.40, 0.54, 0.66, 0.78, 0.90, 1.00];

// Pace 1 — WALK (0.2..2.8 m/s, centered at ~2.2 m/s):
// Effortless, fluid human stride with relaxed low-arc knee pass-through (zero stomping/marching)
const WALK_HIP   = [-0.33, -0.22, -0.04,  0.14,  0.26,  0.10, -0.15, -0.29, -0.33];
const WALK_KNEE  = [ 0.04,  0.09,  0.06,  0.04,  0.14,  0.34,  0.39,  0.15,  0.04];
const WALK_ANKLE = [-0.08,  0.03, -0.02, -0.06,  0.08,  0.13,  0.01, -0.06, -0.08];

// Neutral mid-stance passing phase (u ≈ 0.24) used as Idle <-> Walk rest phase so characters
// never start or stop at extreme heel-strike / toe-off scissor angles
export const IDLE_REST_PHASE = Math.PI * 0.48;

// Pace 2 — JOG (2.8..4.6 m/s, centered at ~3.8 m/s): steady rhythmic trail jog, 46% stance
const JOG_HIP    = [-0.41, -0.27, -0.05,  0.18,  0.34,  0.16, -0.21, -0.42, -0.41];
const JOG_KNEE   = [ 0.09,  0.22,  0.14,  0.09,  0.25,  0.56,  0.76,  0.24,  0.09];
const JOG_ANKLE  = [-0.09,  0.04, -0.04, -0.08,  0.15,  0.22,  0.00, -0.07, -0.09];

// Pace 3 — RUN (4.6..6.6 m/s, centered at ~5.8 m/s): athletic forward-driving run, 38% stance
const RUN_HIP    = [-0.51, -0.34, -0.07,  0.23,  0.41,  0.18, -0.31, -0.55, -0.51];
const RUN_KNEE   = [ 0.12,  0.31,  0.20,  0.13,  0.36,  0.76,  0.98,  0.32,  0.12];
const RUN_ANKLE  = [-0.10,  0.05, -0.06, -0.10,  0.21,  0.29, -0.01, -0.08, -0.10];

// Pace 4 — SPRINT (6.6..9+ m/s, centered at ~7.8 m/s): full-stride sprint, 32% stance
const SPRINT_HIP   = [-0.60, -0.40, -0.08,  0.28,  0.48,  0.21, -0.41, -0.68, -0.60];
const SPRINT_KNEE  = [ 0.15,  0.39,  0.25,  0.17,  0.48,  0.94,  1.18,  0.40,  0.15];
const SPRINT_ANKLE = [-0.11,  0.06, -0.07, -0.12,  0.27,  0.34, -0.02, -0.09, -0.11];

// Per-tier biomechanical constants calibrated 1:1 to leg length so planted foot travels
// symmetrically from +halfReach -> -halfReach without over-stretching or stomping
export const GAIT_SPECS = {
  walk:   { halfStride: 0.56, stanceEnd: 0.54, torsoPitch: 0.022, armAmp: 0.30, elbowBase: 0.14, flightLift: 0.000, vaultAmp: 0.009 },
  jog:    { halfStride: 0.78, stanceEnd: 0.46, torsoPitch: 0.064, armAmp: 0.44, elbowBase: 0.64, flightLift: 0.014, vaultAmp: 0.005 },
  run:    { halfStride: 1.00, stanceEnd: 0.38, torsoPitch: 0.108, armAmp: 0.56, elbowBase: 0.82, flightLift: 0.026, vaultAmp: 0.000 },
  sprint: { halfStride: 1.20, stanceEnd: 0.32, torsoPitch: 0.152, armAmp: 0.68, elbowBase: 0.94, flightLift: 0.036, vaultAmp: 0.000 }
};

function evalPeriodicKeyframes(u, vals) {
  for (let i = 0; i < GAIT_T.length - 1; i++) {
    const t0 = GAIT_T[i];
    const t1 = GAIT_T[i + 1];
    if (u <= t1 || i === GAIT_T.length - 2) {
      const f = Math.max(0, Math.min(1, (u - t0) / Math.max(0.0001, t1 - t0)));
      const s = f * f * (3 - 2 * f);
      return vals[i] + (vals[i + 1] - vals[i]) * s;
    }
  }
  return vals[0];
}

export function didCrossHeelStrike(prevU, currU) {
  if (!Number.isFinite(prevU)) return false;
  const strike = 0.03;
  if (currU >= prevU) {
    return prevU < strike && currU >= strike;
  }
  return prevU < strike + 1.0 && currU + 1.0 >= strike + 1.0;
}

// ---------------------------------------------------------------------------
// 2. Smooth 5-State Locomotion Blend Tree (Idle + Walk / Jog / Run / Sprint)
//    Recalibrated for natural ~2.2 m/s human walk & Shift-activated Run/Sprint
// ---------------------------------------------------------------------------
const _targetW = { idle: 1, walk: 0, jog: 0, run: 0, sprint: 0 };

export function createBlendTreeState() {
  return {
    wIdle: 1,
    wWalk: 0,
    wJog: 0,
    wRun: 0,
    wSprint: 0,
    walkAmp: 0,
    dominant: 'idle',
    turnBank: 0,
    turnLead: 0,
    accelLean: 0,
    outerSpread: 0
  };
}

/**
 * Evaluates raw target weights across [idle, walk, jog, run, sprint] from horizontal speed (m/s).
 * Human-calibrated speed landmarks:
 *   0.00 -> Idle
 *   2.20 -> Walk peak (default WASD natural human walking pace)
 *   3.85 -> Jog peak (Shift ramp-up / brisk AI worker jog)
 *   5.85 -> Run peak (Shift running)
 *   7.85+ -> Sprint peak (sustained Shift sprint)
 */
export function computeBlendTreeTargets(speed, loadWeight, out = _targetW) {
  const spd = Math.max(0, speed);
  const maxTierSpd = 8.4 * (1 - loadWeight * 0.48);
  const effSpd = Math.min(spd, maxTierSpd);

  const moveW = smoothstep(0.06, 1.50, effSpd);
  const tWalkToJog = smoothstep(2.55, 3.65, effSpd);
  const tJogToRun = smoothstep(4.25, 5.55, effSpd);
  const tRunToSprint = smoothstep(6.20, 7.55, effSpd);

  const wSprint = moveW * tRunToSprint;
  const wRun = moveW * tJogToRun * (1 - tRunToSprint);
  const wJog = moveW * tWalkToJog * (1 - tJogToRun);
  const wWalk = moveW * (1 - tWalkToJog);
  const wIdle = Math.max(0, 1 - moveW);

  out.idle = wIdle;
  out.walk = wWalk;
  out.jog = wJog;
  out.run = wRun;
  out.sprint = wSprint;
  return out;
}

/**
 * Advances blend tree weights with smooth exponential crossfade damping and
 * updates turn-banking + start/brake lean channels (Zero-GC).
 */
export function updateLocomotionBlendTree(btState, dt, speed, loadWeight, yawRate, accelForward, braking) {
  const targets = computeBlendTreeTargets(speed, loadWeight, _targetW);
  const blendRate = speed < 1.65 ? 7.6 : 9.4;
  const damp = 1 - Math.exp(-blendRate * dt);

  btState.wIdle += (targets.idle - btState.wIdle) * damp;
  btState.wWalk += (targets.walk - btState.wWalk) * damp;
  btState.wJog += (targets.jog - btState.wJog) * damp;
  btState.wRun += (targets.run - btState.wRun) * damp;
  btState.wSprint += (targets.sprint - btState.wSprint) * damp;

  const targetWalkAmp = smoothstep(0.05, 1.85, Math.max(0, speed));
  btState.walkAmp = (btState.walkAmp || 0) + (targetWalkAmp - (btState.walkAmp || 0)) * (1 - Math.exp(-8.2 * dt));

  const sum = btState.wIdle + btState.wWalk + btState.wJog + btState.wRun + btState.wSprint;
  if (sum > 0.0001) {
    const inv = 1 / sum;
    btState.wIdle *= inv;
    btState.wWalk *= inv;
    btState.wJog *= inv;
    btState.wRun *= inv;
    btState.wSprint *= inv;
  } else {
    btState.wIdle = 1;
    btState.wWalk = btState.wJog = btState.wRun = btState.wSprint = 0;
  }

  let dom = 'idle';
  let maxW = btState.wIdle;
  if (btState.wWalk > maxW) { maxW = btState.wWalk; dom = 'walk'; }
  if (btState.wJog > maxW) { maxW = btState.wJog; dom = 'jog'; }
  if (btState.wRun > maxW) { maxW = btState.wRun; dom = 'run'; }
  if (btState.wSprint > maxW) { dom = 'sprint'; }
  btState.dominant = dom;

  const moveFactor = Math.max(0, 1 - btState.wIdle);
  const paceAgility = 0.32 * btState.wWalk + 0.78 * btState.wJog + 1.15 * btState.wRun + 1.48 * btState.wSprint;
  const centripetal = -yawRate * Math.min(8.5, speed) * (0.011 + paceAgility * 0.006);
  const targetBank = Math.max(-0.22, Math.min(0.22, centripetal)) * moveFactor;
  btState.turnBank += (targetBank - btState.turnBank) * (1 - Math.exp(-10.5 * dt));

  const targetLead = Math.max(-0.30, Math.min(0.30, yawRate * (0.10 + paceAgility * 0.04))) * moveFactor;
  btState.turnLead += (targetLead - btState.turnLead) * (1 - Math.exp(-11.5 * dt));

  const targetAccel = Math.max(-0.12, Math.min(0.15, accelForward * 0.015 - braking * 0.11));
  btState.accelLean += (targetAccel - btState.accelLean) * (1 - Math.exp(-9.5 * dt));

  // Strictly zero outward leg splay
  btState.outerSpread = 0;

  return btState;
}

/**
 * Samples blended leg FK joint angles from the 4 locomotion nodes (Walk / Jog / Run / Sprint).
 */
export function sampleBlendTreeLeg(u, btState, strideScale, loadWeight, wadeLift, slopePitch, out) {
  const rawSum = btState.wWalk + btState.wJog + btState.wRun + btState.wSprint;
  const useWalkDefault = rawSum < 0.0005;
  const bw = useWalkDefault ? 1 : btState.wWalk / rawSum;
  const bj = useWalkDefault ? 0 : btState.wJog / rawSum;
  const br = useWalkDefault ? 0 : btState.wRun / rawSum;
  const bs = useWalkDefault ? 0 : btState.wSprint / rawSum;

  const wHip = evalPeriodicKeyframes(u, WALK_HIP) * strideScale;
  const jHip = evalPeriodicKeyframes(u, JOG_HIP) * (0.94 + strideScale * 0.07);
  const rHip = evalPeriodicKeyframes(u, RUN_HIP) * (0.92 + strideScale * 0.09);
  const sHip = evalPeriodicKeyframes(u, SPRINT_HIP) * (0.90 + strideScale * 0.12);

  const wadeSwing = wadeLift * (u > 0.54 ? 0.42 : 0.05);
  const wKnee = evalPeriodicKeyframes(u, WALK_KNEE) + loadWeight * 0.08 + wadeSwing;
  const jKnee = evalPeriodicKeyframes(u, JOG_KNEE) + loadWeight * 0.08 + wadeSwing * 0.85;
  const rKnee = evalPeriodicKeyframes(u, RUN_KNEE) + loadWeight * 0.05;
  const sKnee = evalPeriodicKeyframes(u, SPRINT_KNEE);

  const wAnkle = evalPeriodicKeyframes(u, WALK_ANKLE);
  const jAnkle = evalPeriodicKeyframes(u, JOG_ANKLE);
  const rAnkle = evalPeriodicKeyframes(u, RUN_ANKLE);
  const sAnkle = evalPeriodicKeyframes(u, SPRINT_ANKLE);

  const stanceEnd = getBlendedStanceEnd(btState);
  const stanceWeight = u < stanceEnd ? (1 - smoothstep(stanceEnd * 0.80, stanceEnd, u)) : 0;
  const slopeAnkle = Math.max(-0.24, Math.min(0.24, slopePitch * 0.48)) * stanceWeight;

  out.thighRx = wHip * bw + jHip * bj + rHip * br + sHip * bs;
  out.shinRx = Math.max(0.03, wKnee * bw + jKnee * bj + rKnee * br + sKnee * bs);
  out.footRx = wAnkle * bw + jAnkle * bj + rAnkle * br + sAnkle * bs - slopeAnkle;
  return out;
}

export function getBlendedHalfStride(btState, loadWeight) {
  const rawSum = btState.wWalk + btState.wJog + btState.wRun + btState.wSprint;
  const walkRamp = 0.74 + 0.26 * (btState?.walkAmp ?? 1);
  const effWalkHalf = GAIT_SPECS.walk.halfStride * walkRamp;
  if (rawSum < 0.0005) return effWalkHalf * (1 - loadWeight * 0.16);
  const raw =
    (effWalkHalf * btState.wWalk +
      GAIT_SPECS.jog.halfStride * btState.wJog +
      GAIT_SPECS.run.halfStride * btState.wRun +
      GAIT_SPECS.sprint.halfStride * btState.wSprint) /
    rawSum;
  return raw * (1 - loadWeight * 0.16);
}

export function getBlendedStanceEnd(btState) {
  const rawSum = btState.wWalk + btState.wJog + btState.wRun + btState.wSprint;
  if (rawSum < 0.0005) return GAIT_SPECS.walk.stanceEnd;
  return (
    (GAIT_SPECS.walk.stanceEnd * btState.wWalk +
      GAIT_SPECS.jog.stanceEnd * btState.wJog +
      GAIT_SPECS.run.stanceEnd * btState.wRun +
      GAIT_SPECS.sprint.stanceEnd * btState.wSprint) /
    rawSum
  );
}

/**
 * Computes natural, gentle human vertical pelvis trajectory (~2.5-3.5 cm peak-to-peak during walk).
 * Avoids excessive squatting/bobbing that causes stomping knees.
 */
export function computeBlendTreeHipOffset(legL, legR, phase, btState, loadWeight) {
  const reachL = 0.50 * Math.cos(legL.thighRx) + 0.50 * Math.cos(legL.thighRx + legL.shinRx);
  const reachR = 0.50 * Math.cos(legR.thighRx) + 0.50 * Math.cos(legR.thighRx + legR.shinRx);
  const supportReach = Math.max(reachL, reachR);
  // Gentle geometric dip during double-support (clamped tightly so pelvis never squats heavily)
  const contactDrop = -Math.min(0.026, (1 - Math.min(1.0, supportReach)) * 0.30);

  // Subtle inverted-pendulum vault over mid-stance during walk (~0.9cm smooth rise)
  const walkVault = (-Math.cos(phase * 2 - 0.30) * GAIT_SPECS.walk.vaultAmp) * btState.wWalk * (1 - loadWeight * 0.18);
  const jogFlight = (Math.sin(phase * 2 - 0.46) * GAIT_SPECS.jog.flightLift + 0.004) * btState.wJog;
  const runFlight = (Math.sin(phase * 2 - 0.50) * GAIT_SPECS.run.flightLift + 0.008) * btState.wRun;
  const sprintFlight = (Math.sin(phase * 2 - 0.54) * GAIT_SPECS.sprint.flightLift + 0.014) * btState.wSprint;

  return contactDrop + walkVault + jogFlight + runFlight + sprintFlight - loadWeight * 0.022;
}

// ---------------------------------------------------------------------------
// 3. World-Space Quaternion 2-Bone Foot-Locking IK Solver (Zero-GC, Zero-Slide)
//    • Silky heel-strike entry & toe-off release (zero snap-slam or stomping!)
//    • Locks planted stance feet to world coordinates on a straight human track
//    • Swing-foot ground-clearance guard prevents boots from ever clipping below ground
//    • Slope-only pelvis drop prevents flat-ground squatting/buckling knees
//    • Forward Knee Pole keeps both knees straight forward (ZERO duck-splay)
//    • Exact 3D Law-of-Cosines Quaternion alignment + terrain-conforming sole
// ---------------------------------------------------------------------------
const _worldUp = new THREE.Vector3(0, 1, 0);
const _charForward = new THREE.Vector3();
const _charLeft = new THREE.Vector3();
const _charMidHip = new THREE.Vector3();
const _worldHipL = new THREE.Vector3();
const _worldHipR = new THREE.Vector3();
const _worldFootL = new THREE.Vector3();
const _worldFootR = new THREE.Vector3();
const _targetWorld = new THREE.Vector3();

// Zero-GC scratch objects for 3D Quaternion 2-Bone Leg IK
const _legH = new THREE.Vector3();
const _legK = new THREE.Vector3();
const _legA = new THREE.Vector3();
const _legHT = new THREE.Vector3();
const _legDir = new THREE.Vector3();
const _legPole = new THREE.Vector3();
const _legBend = new THREE.Vector3();
const _legTargetK = new THREE.Vector3();
const _legCurVec = new THREE.Vector3();
const _legDesVec = new THREE.Vector3();
const _legDeltaQ = new THREE.Quaternion();
const _legWorldQ = new THREE.Quaternion();
const _legParentWorldQ = new THREE.Quaternion();
const _legGoalLocalQ = new THREE.Quaternion();

// Zero-GC scratch objects for ground-conforming parallel foot orientation
const _footTFwd = new THREE.Vector3();
const _footTLeft = new THREE.Vector3();
const _footNormal = new THREE.Vector3();
const _footZ = new THREE.Vector3();
const _footX = new THREE.Vector3();
const _footBasisMat = new THREE.Matrix4();
const _footWorldGoalQ = new THREE.Quaternion();
const _footToePitchQ = new THREE.Quaternion();
const _footShinWorldQ = new THREE.Quaternion();
const _footLocalGoalQ = new THREE.Quaternion();

export function createFootIKState() {
  return {
    pelvisOffset: 0,
    left: {
      locked: false,
      lockWeight: 0,
      pinX: 0,
      pinY: 0,
      pinZ: 0,
      dhFwd: 0,
      dhLeft: 0,
      prevU: NaN
    },
    right: {
      locked: false,
      lockWeight: 0,
      pinX: 0,
      pinY: 0,
      pinZ: 0,
      dhFwd: 0,
      dhLeft: 0,
      prevU: NaN
    }
  };
}

/**
 * Computes smooth foot-ground contact weight in [0, 1] with a cushioned touchdown frame-offset:
 * - Keeps swing leg 100% free during Idle <-> Walk Blend Space transitions (never drags the
 *   swinging boot down to the floor while accelerating or slowing down!).
 * - Applies a subtle +2-frame touchdown cushion (u = 0.98 -> 0.075) so heel contact rolls softly
 *   onto the ground without slapping or stomping.
 * - Holds solid 1.0 lock through weight-bearing stance [0.075 .. stanceEnd * 0.78] (zero foot slide),
 *   then peels off cleanly through toe-off.
 */
function computeFootLockTarget(u, stanceEnd, idleWeight, jumpY, inWater) {
  if (jumpY > 0.035) return 0;
  const waterScale = inWater ? 0.65 : 1.0;

  let cycleLock = 0;
  const holdStart = 0.075;
  const holdEnd = stanceEnd * 0.78;
  const releaseEnd = Math.min(0.74, stanceEnd + 0.04);

  if (u >= holdStart && u <= holdEnd) {
    cycleLock = 1.0;
  } else if (u < holdStart) {
    // Cushioned frame-offset heel-to-flat touchdown blend (0.18 -> 1.0 across u = 0.00..0.075)
    cycleLock = 0.18 + 0.82 * smoothstep(0.0, holdStart, u);
  } else if (u > holdEnd && u < releaseEnd) {
    // Smooth heel-rise & toe-off peel
    cycleLock = 1 - smoothstep(holdEnd, releaseEnd, u);
  } else if (u >= 0.97) {
    // Gentle 1-2 frame pre-contact preparation right before heel kisses ground
    cycleLock = smoothstep(0.97, 1.0, u) * 0.18;
  }

  // Only engage bilateral double-foot Idle lock once genuinely settling into Idle (>0.66),
  // leaving the swinging foot completely unobstructed across the Idle <-> Walk Blend Space!
  const idleDoubleLock = smoothstep(0.66, 0.96, idleWeight);
  const walkContactW = cycleLock * (1 - idleDoubleLock);
  return Math.min(1, (idleDoubleLock * 0.98 + walkContactW) * waterScale);
}

/**
 * Exact 3D World-Space Quaternion 2-Bone Leg IK Solver (Zero-GC & NaN-safe).
 * Guarantees exact ankle placement onto `targetWorldPos` while enforcing a forward-pointing
 * knee pole so legs track straight forward like a real human (zero duck-walk splay).
 */
export function solveTwoBoneLegWorldQuat(
  hipBone,
  shinBone,
  footBone,
  targetWorldPos,
  kneePoleDir,
  blendWeight = 1.0
) {
  if (!hipBone || !shinBone || !footBone || !targetWorldPos) return;
  const w = Math.max(0, Math.min(1, blendWeight));
  if (w <= 0.002) return;

  hipBone.parent?.updateWorldMatrix(true, false);
  hipBone.updateWorldMatrix(false, true);

  hipBone.getWorldPosition(_legH);
  shinBone.getWorldPosition(_legK);
  footBone.getWorldPosition(_legA);

  const L1 = _legH.distanceTo(_legK);
  const L2 = _legK.distanceTo(_legA);
  if (!Number.isFinite(L1) || !Number.isFinite(L2) || L1 < 0.04 || L2 < 0.04) return;

  _legHT.subVectors(targetWorldPos, _legH);
  const rawDist = _legHT.length();
  if (!Number.isFinite(rawDist) || rawDist < 0.001) return;

  const minDist = Math.abs(L1 - L2) + 0.035;
  const maxDist = (L1 + L2) * 0.996;
  const d = Math.max(minDist, Math.min(maxDist, rawDist));
  _legDir.copy(_legHT).multiplyScalar(1 / rawDist);

  // Project forward knee pole orthogonal to hip->ankle ray
  if (kneePoleDir && kneePoleDir.lengthSq() > 1e-6) {
    _legBend.copy(kneePoleDir);
  } else {
    _legBend.set(0, 0, 1);
  }
  const dotPole = _legBend.dot(_legDir);
  _legBend.addScaledVector(_legDir, -dotPole);
  if (_legBend.lengthSq() < 1e-6) {
    _legBend.set(0, 0, 1).addScaledVector(_legDir, -_legDir.z);
    if (_legBend.lengthSq() < 1e-6) _legBend.set(1, 0, 0);
  }
  _legBend.normalize();

  // Exact Law of Cosines for 3D knee world position
  const along = (L1 * L1 + d * d - L2 * L2) / (2 * d);
  const perpSq = Math.max(0, L1 * L1 - along * along);
  const perp = Math.sqrt(perpSq);
  _legTargetK.copy(_legH).addScaledVector(_legDir, along).addScaledVector(_legBend, perp);

  // Step 1: Rotate thigh so (Hip -> Knee) aligns exactly to (Hip -> TargetKnee)
  _legCurVec.subVectors(_legK, _legH);
  _legDesVec.subVectors(_legTargetK, _legH);
  if (_legCurVec.lengthSq() > 1e-6 && _legDesVec.lengthSq() > 1e-6) {
    _legCurVec.normalize();
    _legDesVec.normalize();
    _legDeltaQ.setFromUnitVectors(_legCurVec, _legDesVec);

    hipBone.getWorldQuaternion(_legWorldQ);
    hipBone.parent.getWorldQuaternion(_legParentWorldQ);
    _legWorldQ.premultiply(_legDeltaQ);
    _legGoalLocalQ.copy(_legParentWorldQ).invert().multiply(_legWorldQ);

    if (
      Number.isFinite(_legGoalLocalQ.x) &&
      Number.isFinite(_legGoalLocalQ.y) &&
      Number.isFinite(_legGoalLocalQ.z) &&
      Number.isFinite(_legGoalLocalQ.w)
    ) {
      hipBone.quaternion.slerp(_legGoalLocalQ, w);
      hipBone.updateWorldMatrix(false, true);
    }
  }

  // Step 2: Rotate shin so updated (Knee -> Ankle) aligns exactly to (Knee -> TargetAnkle)
  shinBone.getWorldPosition(_legK);
  footBone.getWorldPosition(_legA);
  _legCurVec.subVectors(_legA, _legK);
  _legDesVec.subVectors(targetWorldPos, _legK);
  if (_legCurVec.lengthSq() > 1e-6 && _legDesVec.lengthSq() > 1e-6) {
    _legCurVec.normalize();
    _legDesVec.normalize();
    _legDeltaQ.setFromUnitVectors(_legCurVec, _legDesVec);

    shinBone.getWorldQuaternion(_legWorldQ);
    hipBone.getWorldQuaternion(_legParentWorldQ);
    _legWorldQ.premultiply(_legDeltaQ);
    _legGoalLocalQ.copy(_legParentWorldQ).invert().multiply(_legWorldQ);

    if (
      Number.isFinite(_legGoalLocalQ.x) &&
      Number.isFinite(_legGoalLocalQ.y) &&
      Number.isFinite(_legGoalLocalQ.z) &&
      Number.isFinite(_legGoalLocalQ.w)
    ) {
      shinBone.quaternion.slerp(_legGoalLocalQ, w);
      shinBone.updateWorldMatrix(false, true);
    }
  }
}

const _ikLegPair = [
  { side: null, sideSign: 1, u: 0, hipBone: null, shinBone: null, footBone: null, worldHip: _worldHipL, worldFoot: _worldFootL },
  { side: null, sideSign: -1, u: 0, hipBone: null, shinBone: null, footBone: null, worldHip: _worldHipR, worldFoot: _worldFootR }
];

/**
 * Applies straight-line terrain-conforming World-Space Quaternion 2-Bone Foot-Locking IK
 * onto a 17-bone AutoHumanoidRig AFTER the Blend Tree FK pose has been written. (100% Zero-GC)
 */
export function applyTwoBoneFootIK(rig, ikState, dt, params) {
  if (!rig || !ikState || !rig.bones) return;
  const b = rig.bones;
  if (!b.hips || !b.thighL || !b.shinL || !b.footL || !b.thighR || !b.shinR || !b.footR) return;

  const s = rig.scale || 1;
  const L1 = Math.hypot(b.shinL.position.x, b.shinL.position.y, b.shinL.position.z) || (0.43 * s);
  const L2 = Math.hypot(b.footL.position.x, b.footL.position.y, b.footL.position.z) || (0.44 * s);
  const maxReach = (L1 + L2) * 0.99;
  const soleHeight = Number.isFinite(rig.soleHeight) ? rig.soleHeight : (0.13 * s);

  const uL = params.uL ?? 0;
  const uR = params.uR ?? 0.5;
  const btState = params.btState;
  const jumpY = params.jumpY || 0;
  const inWater = Boolean(params.inWater);
  const getGroundHeight = typeof params.getGroundHeight === 'function' ? params.getGroundHeight : null;
  const rootYaw = params.rootYaw || 0;

  const clampedDt = Math.min(dt, 0.05);
  const idleW = btState ? btState.wIdle : 1;
  const stanceEnd = btState ? getBlendedStanceEnd(btState) : 0.54;

  // Update world matrices of the FK pose so we know exact FK hip & ankle world positions
  b.hips.parent?.updateWorldMatrix(true, false);
  b.hips.updateWorldMatrix(false, true);

  b.thighL.getWorldPosition(_worldHipL);
  b.thighR.getWorldPosition(_worldHipR);
  b.footL.getWorldPosition(_worldFootL);
  b.footR.getWorldPosition(_worldFootR);
  _charMidHip.addVectors(_worldHipL, _worldHipR).multiplyScalar(0.5);

  const parentMat = b.hips.parent ? b.hips.parent.matrixWorld.elements : null;
  if (parentMat) {
    _charLeft.set(parentMat[0], 0, parentMat[2]);
    _charForward.set(parentMat[8], 0, parentMat[10]);
  } else {
    _charForward.set(Math.sin(rootYaw), 0, Math.cos(rootYaw));
    _charLeft.set(Math.cos(rootYaw), 0, -Math.sin(rootYaw));
  }
  if (_charForward.lengthSq() < 1e-6) {
    _charForward.set(Math.sin(rootYaw), 0, Math.cos(rootYaw));
  } else {
    _charForward.normalize();
  }
  if (_charLeft.lengthSq() < 1e-6) {
    _charLeft.set(Math.cos(rootYaw), 0, -Math.sin(rootYaw));
  } else {
    _charLeft.normalize();
  }

  const centerGroundY = getGroundHeight ? getGroundHeight(_charMidHip.x, _charMidHip.z) : (_charMidHip.y - 1.0 * s);

  _ikLegPair[0].side = ikState.left;
  _ikLegPair[0].u = uL;
  _ikLegPair[0].hipBone = b.thighL;
  _ikLegPair[0].shinBone = b.shinL;
  _ikLegPair[0].footBone = b.footL;

  _ikLegPair[1].side = ikState.right;
  _ikLegPair[1].u = uR;
  _ikLegPair[1].hipBone = b.thighR;
  _ikLegPair[1].shinBone = b.shinR;
  _ikLegPair[1].footBone = b.footR;

  // Narrow, straight human foot track width (~18.4cm walking, ~20.8cm standing)
  const trackHalfWidth = (0.092 + idleW * 0.012) * s;
  let requiredPelvisDrop = 0;

  // Pass 1: Smooth world-space foot pinning on straight human track + terrain slope sampling
  for (let i = 0; i < 2; i++) {
    const leg = _ikLegPair[i];
    const st = leg.side;
    if (!Number.isFinite(st.lockWeight)) st.lockWeight = 0;

    const targetLock = computeFootLockTarget(leg.u, stanceEnd, idleW, jumpY, inWater);
    const safeTargetLock = Number.isFinite(targetLock) ? targetLock : 0;

    // Cushioned lock transition (eliminates downward foot-slap while keeping mid-stance rock-solid)
    const rate = safeTargetLock >= st.lockWeight ? 18.0 : 14.0;
    st.lockWeight += (safeTargetLock - st.lockWeight) * (1 - Math.exp(-rate * clampedDt));
    if (safeTargetLock >= 0.98 && st.lockWeight > 0.95) st.lockWeight = 1.0;
    if (!Number.isFinite(st.lockWeight) || st.lockWeight < 0.004) st.lockWeight = 0;

    // Straight-line human track coordinates aligned to FK forward position
    const relX = leg.worldFoot.x - _charMidHip.x;
    const relZ = leg.worldFoot.z - _charMidHip.z;
    const fwdOff = relX * _charForward.x + relZ * _charForward.z;
    const desiredLat = leg.sideSign * trackHalfWidth;
    const alignedFootX = _charMidHip.x + _charForward.x * fwdOff + _charLeft.x * desiredLat;
    const alignedFootZ = _charMidHip.z + _charForward.z * fwdOff + _charLeft.z * desiredLat;
    const groundAtAligned = getGroundHeight ? getGroundHeight(alignedFootX, alignedFootZ) : centerGroundY;

    const idleSettling = idleW > 0.78;
    const inSolidStance = leg.u <= stanceEnd * 0.84 || idleSettling;
    const justStruck = didCrossHeelStrike(st.prevU, leg.u);
    st.prevU = leg.u;

    if (st.lockWeight > 0.30 && inSolidStance && jumpY <= 0.03) {
      if (!st.locked || (justStruck && idleW < 0.65)) {
        // Plant foot smoothly at exact heel-strike ground contact on the straight human line
        st.pinX = alignedFootX;
        st.pinZ = alignedFootZ;
        st.pinY = groundAtAligned + soleHeight;
        st.locked = true;
      } else {
        // Safety re-pin only on teleport / sharp spin beyond physical reach
        const distToPin = Math.hypot(st.pinX - leg.worldHip.x, st.pinY - leg.worldHip.y, st.pinZ - leg.worldHip.z);
        if (distToPin > maxReach * 1.15) {
          st.pinX = alignedFootX;
          st.pinZ = alignedFootZ;
          st.pinY = groundAtAligned + soleHeight;
        } else {
          // During active walking stance: 100% WORLD-LOCKED X/Z (ZERO SLIDE!)
          // During Idle settling: smoothly align both feet parallel side-by-side
          if (idleSettling) {
            const settleRate = 1 - Math.exp(-4.5 * clampedDt);
            const idleGoalX = _charMidHip.x + _charLeft.x * desiredLat;
            const idleGoalZ = _charMidHip.z + _charLeft.z * desiredLat;
            st.pinX += (idleGoalX - st.pinX) * settleRate;
            st.pinZ += (idleGoalZ - st.pinZ) * settleRate;
          }
          const gY = (getGroundHeight ? getGroundHeight(st.pinX, st.pinZ) : centerGroundY) + soleHeight;
          st.pinY += (gY - st.pinY) * (1 - Math.exp(-24 * clampedDt));
        }
      }

      // Sample local ground slope under planted boot (0.16m sole span)
      if (getGroundHeight) {
        const eps = 0.16;
        const hFwd = getGroundHeight(st.pinX + _charForward.x * eps, st.pinZ + _charForward.z * eps);
        const hBack = getGroundHeight(st.pinX - _charForward.x * eps, st.pinZ - _charForward.z * eps);
        const hLeft = getGroundHeight(st.pinX + _charLeft.x * eps, st.pinZ + _charLeft.z * eps);
        const hRight = getGroundHeight(st.pinX - _charLeft.x * eps, st.pinZ - _charLeft.z * eps);
        const rawDhFwd = Math.max(-0.55, Math.min(0.55, (hFwd - hBack) / (eps * 2)));
        const rawDhLeft = Math.max(-0.38, Math.min(0.38, (hLeft - hRight) / (eps * 2)));
        const slopeDamp = 1 - Math.exp(-16 * clampedDt);
        st.dhFwd += (rawDhFwd - st.dhFwd) * slopeDamp;
        st.dhLeft += (rawDhLeft - st.dhLeft) * slopeDamp;
      }

      // Slope-ONLY pelvis drop: lower hips ONLY when the terrain under this planted foot is genuinely
      // lower than the terrain under the character center (hillside!). On flat ground -> 0 drop (no squat/stomp!).
      const footGroundY = st.pinY - soleHeight;
      const terrainDrop = Math.max(0, centerGroundY - footGroundY - 0.015 * s);
      const weightedDrop = Math.min(0.22 * s, terrainDrop) * st.lockWeight;
      if (weightedDrop > requiredPelvisDrop) requiredPelvisDrop = weightedDrop;
    } else if (st.locked && st.lockWeight > 0.04 && leg.u > stanceEnd * 0.75 && leg.u < stanceEnd + 0.12 && jumpY <= 0.03) {
      // Toe-off peel phase: keep pin anchored while ikW smoothly fades 1 -> 0 into the rising FK swing arc
      st.dhFwd *= Math.exp(-8 * clampedDt);
      st.dhLeft *= Math.exp(-8 * clampedDt);
    } else {
      // Free swing & terminal-swing approach: smoothly track aligned FK arc while never clipping below ground
      st.locked = false;
      st.pinX = alignedFootX;
      st.pinZ = alignedFootZ;
      st.pinY = Math.max(leg.worldFoot.y, groundAtAligned + soleHeight + 0.008 * s);
      st.dhFwd *= Math.exp(-10 * clampedDt);
      st.dhLeft *= Math.exp(-10 * clampedDt);
    }
  }

  // Apply slope-only pelvis adjustment cleanly
  const pelvisTarget = jumpY > 0.03 ? 0 : -requiredPelvisDrop;
  ikState.pelvisOffset += (pelvisTarget - ikState.pelvisOffset) * (1 - Math.exp(-14 * clampedDt));
  if (Math.abs(ikState.pelvisOffset) > 0.0004) {
    b.hips.position.y += ikState.pelvisOffset;
    b.hips.updateWorldMatrix(false, true);
  }

  // Pass 2: Solve exact 3D World-Space Quaternion 2-Bone Leg IK + Ground-Parallel Boot Alignment
  for (let i = 0; i < 2; i++) {
    const leg = _ikLegPair[i];
    const st = leg.side;
    const ikW = smoothstep(0.0, 1.0, st.lockWeight);

    // Even during low-lock swing, ensure the boot never penetrates underground on uneven terrain
    const groundHere = getGroundHeight ? getGroundHeight(leg.worldFoot.x, leg.worldFoot.z) : centerGroundY;
    const minSwingAnkleY = groundHere + soleHeight + 0.006 * s;
    const needsGroundGuard = jumpY <= 0.03 && leg.worldFoot.y < minSwingAnkleY;

    if ((!Number.isFinite(ikW) || ikW <= 0.002) && !needsGroundGuard) continue;

    const effW = needsGroundGuard ? Math.max(ikW, 0.85) : ikW;
    const safeFkY = Math.max(leg.worldFoot.y, minSwingAnkleY);

    _targetWorld.set(
      leg.worldFoot.x + (st.pinX - leg.worldFoot.x) * ikW,
      safeFkY + (st.pinY - safeFkY) * ikW,
      leg.worldFoot.z + (st.pinZ - leg.worldFoot.z) * ikW
    );

    // Strict Forward Knee Pole (tiny 2° lateral clearance prevents knee knock & eliminates duck-splay)
    _legPole.copy(_charForward).addScaledVector(_charLeft, leg.sideSign * 0.035).normalize();

    solveTwoBoneLegWorldQuat(leg.hipBone, leg.shinBone, leg.footBone, _targetWorld, _legPole, effW);

    // Align boot sole flush with terrain slope normal & strictly parallel to character forward direction
    if (ikW > 0.05) {
      _footTFwd.copy(_charForward).addScaledVector(_worldUp, st.dhFwd).normalize();
      _footTLeft.copy(_charLeft).addScaledVector(_worldUp, st.dhLeft).normalize();
      _footNormal.crossVectors(_footTFwd, _footTLeft);
      if (_footNormal.lengthSq() > 1e-6) {
        _footNormal.normalize();
        if (_footNormal.y < 0) _footNormal.negate();
        _footZ.crossVectors(_footTLeft, _footNormal).normalize();
        _footX.crossVectors(_footNormal, _footZ).normalize();

        _footBasisMat.makeBasis(_footX, _footNormal, _footZ);
        _footWorldGoalQ.setFromRotationMatrix(_footBasisMat);

        // Gentle heel-strike dorsiflexion (toes slightly up at u=0.00..0.06) & smooth toe-off heel-lift
        if (idleW < 0.5) {
          let heelToePitch = 0;
          if (leg.u < 0.08) {
            heelToePitch = -0.10 * (1 - smoothstep(0.0, 0.08, leg.u)) * (1 - idleW);
          } else if (leg.u > stanceEnd * 0.70 && leg.u < stanceEnd + 0.06) {
            heelToePitch = smoothstep(stanceEnd * 0.70, stanceEnd, leg.u) * 0.22 * (1 - idleW);
          }
          if (Math.abs(heelToePitch) > 0.002) {
            _footToePitchQ.setFromAxisAngle(_footX, heelToePitch);
            _footWorldGoalQ.premultiply(_footToePitchQ);
          }
        }

        leg.shinBone.getWorldQuaternion(_footShinWorldQ);
        _footLocalGoalQ.copy(_footShinWorldQ).invert().multiply(_footWorldGoalQ);
        if (
          Number.isFinite(_footLocalGoalQ.x) &&
          Number.isFinite(_footLocalGoalQ.y) &&
          Number.isFinite(_footLocalGoalQ.z) &&
          Number.isFinite(_footLocalGoalQ.w)
        ) {
          leg.footBone.quaternion.slerp(_footLocalGoalQ, ikW);
          leg.footBone.updateWorldMatrix(false, true);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Analytical 2-Bone Arm Inverse Kinematics (Zero-GC Quaternion Solver)
//    Locks the left hand cleanly onto the axe handle's secondary lower grip
//    throughout two-handed standing tree felling & ground-trunk bucking.
// ---------------------------------------------------------------------------
const _armS = new THREE.Vector3();
const _armE = new THREE.Vector3();
const _armH = new THREE.Vector3();
const _armST = new THREE.Vector3();
const _armDir = new THREE.Vector3();
const _armBend = new THREE.Vector3();
const _armTargetE = new THREE.Vector3();
const _armCurVec = new THREE.Vector3();
const _armDesVec = new THREE.Vector3();
const _armDeltaQ = new THREE.Quaternion();
const _armWorldQ = new THREE.Quaternion();
const _armParentWorldQ = new THREE.Quaternion();
const _armGoalLocalQ = new THREE.Quaternion();

/**
 * Solves exact 2-bone arm IK in world space using Law of Cosines + quaternion alignment,
 * blending smoothly from the FK pose by `blendWeight` in [0, 1]. (100% Zero-GC & NaN-safe)
 */
export function applyTwoBoneArmIK(upperArmBone, foreArmBone, handBone, targetWorldPos, poleWorldDir, blendWeight = 1.0) {
  if (!upperArmBone || !foreArmBone || !handBone || !targetWorldPos) return;
  const w = Math.max(0, Math.min(1, blendWeight));
  if (w <= 0.002) return;

  upperArmBone.parent?.updateWorldMatrix(true, false);
  upperArmBone.updateWorldMatrix(false, true);

  upperArmBone.getWorldPosition(_armS);
  foreArmBone.getWorldPosition(_armE);
  handBone.getWorldPosition(_armH);

  const L1 = _armS.distanceTo(_armE);
  const L2 = _armE.distanceTo(_armH);
  if (!Number.isFinite(L1) || !Number.isFinite(L2) || L1 < 0.02 || L2 < 0.02) return;

  _armST.subVectors(targetWorldPos, _armS);
  const rawDist = _armST.length();
  if (!Number.isFinite(rawDist) || rawDist < 0.001) return;

  const minDist = Math.abs(L1 - L2) + 0.025;
  const maxDist = (L1 + L2) * 0.992;
  const d = Math.max(minDist, Math.min(maxDist, rawDist));
  _armDir.copy(_armST).multiplyScalar(1 / rawDist);

  if (poleWorldDir) {
    _armBend.copy(poleWorldDir);
  } else {
    _armBend.set(0.6, -0.7, -0.3);
  }
  const dotPole = _armBend.dot(_armDir);
  _armBend.addScaledVector(_armDir, -dotPole);
  if (_armBend.lengthSq() < 1e-6) {
    _armBend.set(0, -1, 0).addScaledVector(_armDir, _armDir.y);
    if (_armBend.lengthSq() < 1e-6) _armBend.set(1, 0, 0);
  }
  _armBend.normalize();

  const along = (L1 * L1 + d * d - L2 * L2) / (2 * d);
  const perpSq = Math.max(0, L1 * L1 - along * along);
  const perp = Math.sqrt(perpSq);
  _armTargetE.copy(_armS).addScaledVector(_armDir, along).addScaledVector(_armBend, perp);

  _armCurVec.subVectors(_armE, _armS);
  _armDesVec.subVectors(_armTargetE, _armS);
  if (_armCurVec.lengthSq() > 1e-6 && _armDesVec.lengthSq() > 1e-6) {
    _armCurVec.normalize();
    _armDesVec.normalize();
    _armDeltaQ.setFromUnitVectors(_armCurVec, _armDesVec);

    upperArmBone.getWorldQuaternion(_armWorldQ);
    upperArmBone.parent.getWorldQuaternion(_armParentWorldQ);
    _armWorldQ.premultiply(_armDeltaQ);
    _armGoalLocalQ.copy(_armParentWorldQ).invert().multiply(_armWorldQ);

    if (
      Number.isFinite(_armGoalLocalQ.x) &&
      Number.isFinite(_armGoalLocalQ.y) &&
      Number.isFinite(_armGoalLocalQ.z) &&
      Number.isFinite(_armGoalLocalQ.w)
    ) {
      upperArmBone.quaternion.slerp(_armGoalLocalQ, w);
      upperArmBone.updateWorldMatrix(false, true);
    }
  }

  foreArmBone.getWorldPosition(_armE);
  handBone.getWorldPosition(_armH);
  _armCurVec.subVectors(_armH, _armE);
  _armDesVec.subVectors(targetWorldPos, _armE);
  if (_armCurVec.lengthSq() > 1e-6 && _armDesVec.lengthSq() > 1e-6) {
    _armCurVec.normalize();
    _armDesVec.normalize();
    _armDeltaQ.setFromUnitVectors(_armCurVec, _armDesVec);

    foreArmBone.getWorldQuaternion(_armWorldQ);
    upperArmBone.getWorldQuaternion(_armParentWorldQ);
    _armWorldQ.premultiply(_armDeltaQ);
    _armGoalLocalQ.copy(_armParentWorldQ).invert().multiply(_armWorldQ);

    if (
      Number.isFinite(_armGoalLocalQ.x) &&
      Number.isFinite(_armGoalLocalQ.y) &&
      Number.isFinite(_armGoalLocalQ.z) &&
      Number.isFinite(_armGoalLocalQ.w)
    ) {
      foreArmBone.quaternion.slerp(_armGoalLocalQ, w);
      foreArmBone.updateWorldMatrix(false, true);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Anatomical Shoulder Rotation Constraints & 3D Hip-Clearance Guard (Zero-GC)
//    • Enforces biomechanical 3-DOF shoulder & elbow rotation limits (rx, ry, rz)
//    • Dynamically computes chest-local 3D elbow & wrist coordinates to guarantee
//      arms never clip or collapse into the hip/belt/pants exclusion zone during
//      idle, walk, run, sprint, chop, cart-pull, carry, or expressive gestures.
// ---------------------------------------------------------------------------
const _shConQ = new THREE.Quaternion();
const _foConQ = new THREE.Quaternion();
const _shElOff = new THREE.Vector3();
const _shElPos = new THREE.Vector3();
const _shHaOff = new THREE.Vector3();
const _shHaPos = new THREE.Vector3();

/**
 * Builds per-rig anatomical shoulder rotation limits & hip-clearance radii
 * calibrated directly from the character's measured torso/hip geometry.
 */
export function createShoulderConstraints(params = null) {
  const isRelaxedArms = params ? Boolean(params.isRelaxedArms) : true;
  const armDropZ = params && Number.isFinite(params.armDropZ) ? params.armDropZ : (isRelaxedArms ? 0.085 : 0.62);
  const hipHalfWidthL = params && Number.isFinite(params.hipHalfWidthL) ? params.hipHalfWidthL : (isRelaxedArms ? 0.30 : 0.25);
  const hipHalfWidthR = params && Number.isFinite(params.hipHalfWidthR) ? params.hipHalfWidthR : (isRelaxedArms ? 0.30 : 0.25);
  const chestWX = params && Number.isFinite(params.chestWX) ? params.chestWX : 0;
  const chestWY = params && Number.isFinite(params.chestWY) ? params.chestWY : 1.53;
  const chestWZ = params && Number.isFinite(params.chestWZ) ? params.chestWZ : -0.01;

  // Left arm: rz > 0 abducts outward (away from hip), rz < 0 adducts inward (toward hip).
  // Right arm: mirrored (rz < 0 abducts outward, rz > 0 adducts inward).
  const hipAdductMinL = isRelaxedArms ? 0.015 : -(Math.max(0.08, armDropZ - 0.07));
  const hipAdductMaxR = -hipAdductMinL;

  // When raised high overhead (above ribcage/hip zone), allow mild inward reach without head/neck clipping
  const overheadAdductMinL = isRelaxedArms ? -0.26 : -0.45;
  const overheadAdductMaxR = -overheadAdductMinL;

  return {
    isRelaxedArms,
    chestWX,
    chestWY,
    chestWZ,
    // Shoulder flexion/extension (X), humeral axial twist (Y), abduction/adduction (Z)
    minRx: -2.42,
    maxRx: 0.88,
    minRy: -0.68,
    maxRy: 0.68,
    maxAbduct: 2.15,
    hipAdductMinL,
    hipAdductMaxR,
    overheadAdductMinL,
    overheadAdductMaxR,
    // 3D normalized (2.1m stature) hip/belt/thigh lateral exclusion capsule radii
    elbowClearanceL: Math.min(0.415, Math.max(0.315, hipHalfWidthL + 0.068)),
    elbowClearanceR: Math.min(0.415, Math.max(0.315, hipHalfWidthR + 0.068)),
    handClearanceL: Math.min(0.395, Math.max(0.295, hipHalfWidthL + 0.056)),
    handClearanceR: Math.min(0.395, Math.max(0.295, hipHalfWidthR + 0.056)),
    hipBandMinY: 0.56,
    hipBandMaxY: 1.32,
    hipZoneHalfZ: 0.235,
    // Forearm/elbow safety bounds (prevents backward hyperextension or bicep folding)
    foreMinRx: -2.35,
    foreMaxRx: 0.08,
    foreMaxAbsRy: 0.92,
    foreMaxAbsRz: 0.45
  };
}

function clampVal(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

/**
 * Constrain a single arm chain (shoulder + elbow) using 3-DOF angular limits
 * plus iterative 3D chest-local hip-clearance projection. (100% Zero-GC)
 */
function constrainArmShoulder(upperArm, foreArm, hand, sideSign, s, cfg) {
  if (!upperArm) return;

  // 1. Clamp shoulder pitch (flexion/extension) and axial humeral twist
  const rx = clampVal(Number.isFinite(upperArm.rotation.x) ? upperArm.rotation.x : 0, cfg.minRx, cfg.maxRx);
  const ry = clampVal(Number.isFinite(upperArm.rotation.y) ? upperArm.rotation.y : 0, cfg.minRy, cfg.maxRy);
  let rz = Number.isFinite(upperArm.rotation.z) ? upperArm.rotation.z : 0;

  // Smoothly blend between strict hip-level adduction limit and overhead reach limit
  const hipZoneW = smoothstep(1.38, 0.58, Math.abs(rx));
  const hipLim = sideSign > 0 ? cfg.hipAdductMinL : cfg.hipAdductMaxR;
  const overLim = sideSign > 0 ? cfg.overheadAdductMinL : cfg.overheadAdductMaxR;
  const activeAdductLim = overLim + (hipLim - overLim) * hipZoneW;

  if (sideSign > 0) {
    rz = clampVal(rz, activeAdductLim, cfg.maxAbduct);
  } else {
    rz = clampVal(rz, -cfg.maxAbduct, activeAdductLim);
  }
  upperArm.rotation.set(rx, ry, rz);

  // 2. Clamp forearm/elbow anatomical bounds
  if (foreArm) {
    const frx = clampVal(Number.isFinite(foreArm.rotation.x) ? foreArm.rotation.x : 0, cfg.foreMinRx, cfg.foreMaxRx);
    const fry = clampVal(Number.isFinite(foreArm.rotation.y) ? foreArm.rotation.y : 0, -cfg.foreMaxAbsRy, cfg.foreMaxAbsRy);
    const frz = clampVal(Number.isFinite(foreArm.rotation.z) ? foreArm.rotation.z : 0, -cfg.foreMaxAbsRz, cfg.foreMaxAbsRz);
    foreArm.rotation.set(frx, fry, frz);
  }

  // 3. Analytical 3D chest-space hip-zone exclusion capsule check (up to 2 passes)
  if (!foreArm || s <= 1e-4) return;
  const invS = 1 / s;
  const elbowClear = sideSign > 0 ? cfg.elbowClearanceL : cfg.elbowClearanceR;
  const handClear = sideSign > 0 ? cfg.handClearanceL : cfg.handClearanceR;
  const shNormX = upperArm.position.x * invS + cfg.chestWX;
  const shNormY = upperArm.position.y * invS + cfg.chestWY;

  for (let iter = 0; iter < 2; iter++) {
    _shConQ.setFromEuler(upperArm.rotation);
    _shElOff.copy(foreArm.position).applyQuaternion(_shConQ);
    _shElPos.copy(upperArm.position).add(_shElOff);

    const elX = _shElPos.x * invS + cfg.chestWX;
    const elY = _shElPos.y * invS + cfg.chestWY;
    const elZ = _shElPos.z * invS + cfg.chestWZ;

    // Evaluate elbow penetration into lateral hip/waist cylinder
    let requiredAbduct = 0;
    const elYMask = smoothstep(cfg.hipBandMinY - 0.08, cfg.hipBandMinY + 0.05, elY) *
      smoothstep(cfg.hipBandMaxY + 0.08, cfg.hipBandMaxY - 0.05, elY);
    const elZMask = smoothstep(cfg.hipZoneHalfZ + 0.09, cfg.hipZoneHalfZ - 0.04, Math.abs(elZ));
    const elPen = (elbowClear - sideSign * elX) * elYMask * elZMask;
    if (elPen > 0.0015) {
      const lever = Math.max(0.20, Math.hypot(elX - shNormX, elY - shNormY));
      const ang = Math.asin(Math.min(0.92, elPen / lever)) * 1.08;
      if (ang > requiredAbduct) requiredAbduct = ang;
    }

    // Evaluate wrist/hand penetration into lateral hip/thigh/belt cylinder
    if (hand) {
      _foConQ.setFromEuler(foreArm.rotation);
      _shHaOff.copy(hand.position).applyQuaternion(_foConQ).applyQuaternion(_shConQ);
      _shHaPos.copy(_shElPos).add(_shHaOff);

      const haX = _shHaPos.x * invS + cfg.chestWX;
      const haY = _shHaPos.y * invS + cfg.chestWY;
      const haZ = _shHaPos.z * invS + cfg.chestWZ;

      const haYMask = smoothstep(cfg.hipBandMinY - 0.08, cfg.hipBandMinY + 0.05, haY) *
        smoothstep(cfg.hipBandMaxY + 0.08, cfg.hipBandMaxY - 0.05, haY);
      const haZMask = smoothstep(cfg.hipZoneHalfZ + 0.08, cfg.hipZoneHalfZ - 0.04, Math.abs(haZ));
      const haPen = (handClear - sideSign * haX) * haYMask * haZMask;
      if (haPen > 0.0015) {
        const lever = Math.max(0.28, Math.hypot(haX - shNormX, haY - shNormY));
        const ang = Math.asin(Math.min(0.92, haPen / lever)) * 1.06;
        if (ang > requiredAbduct) requiredAbduct = ang;
      }
    }

    if (requiredAbduct <= 0.001) break;
    const step = Math.min(0.55, requiredAbduct);
    rz += sideSign * step;
    if (sideSign > 0) {
      rz = clampVal(rz, activeAdductLim, cfg.maxAbduct);
    } else {
      rz = clampVal(rz, -cfg.maxAbduct, activeAdductLim);
    }
    upperArm.rotation.z = rz;
  }
}

/**
 * Applies full bilateral Shoulder Rotation Constraints & 3D Hip-Clearance Guard
 * onto any 17-bone AutoHumanoidRig (player, forestry workers, camp workers).
 * Prevents arms from colliding with hips/pants or distorting clothing/skeleton meshes.
 */
export function applyShoulderRotationConstraints(rig) {
  if (!rig || !rig.bones) return;
  const b = rig.bones;
  const s = rig.scale || 1;
  const cfg = rig.shoulderConstraints || createShoulderConstraints({
    isRelaxedArms: rig.isRelaxedArms,
    armDropZ: rig.armDropZ
  });

  constrainArmShoulder(b.upperArmL, b.foreArmL, b.handL, 1, s, cfg);
  constrainArmShoulder(b.upperArmR, b.foreArmR, b.handR, -1, s, cfg);
}

