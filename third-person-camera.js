import * as THREE from './vendor/three.module.js';
import {segmentBox} from './physics.js';

const PADDING = .3;
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const minimumDistance = height => Math.max(3.2, (height || 2.8) * 1.12);
const minimumHorizontal = height => Math.max(2.5, (height || 2.8) * .82);

function cameraBoxes(colliders) {
  // segmentBox already adds .2 above the top; also reserve room underneath
  // upper floors so the camera's near plane cannot poke through a ceiling.
  return colliders.map(b => ({...b, minY: (b.minY ?? 0) - .22, height: (b.height ?? 99) + .02}));
}
function firstHit(look, position, boxes) {
  let fraction = 1;
  for (const box of boxes) {
    const hit = segmentBox(look, position, box, PADDING);
    if (hit !== false) fraction = Math.min(fraction, hit);
  }
  return fraction;
}
function enoughRoom(look, position, height) {
  return position.distanceTo(look) >= minimumDistance(height) - .001 &&
    Math.hypot(position.x-look.x, position.z-look.z) >= minimumHorizontal(height) - .001;
}

// Validate the final interpolated position too: a straight lerp between two
// safe camera angles can otherwise cut across a corner or the character.
export function isThirdPersonCameraSafe(look, position, colliders = [], characterHeight = 2.8) {
  return enoughRoom(look, position, characterHeight) && firstHit(look, position, cameraBoxes(colliders)) >= 1;
}

export function resolveThirdPersonCamera({
  look, desired, yaw = 0, pitch = .38, distance = 10.5,
  characterHeight = 2.8, colliders = [], previous,
}) {
  const boxes = cameraBoxes(colliders);
  const wanted = desired?.clone() || look.clone().add(new THREE.Vector3(
    Math.sin(yaw)*distance, Math.sin(pitch)*distance+1.1, Math.cos(yaw)*distance,
  ));
  if (enoughRoom(look, wanted, characterHeight) && firstHit(look, wanted, boxes) >= 1) return wanted;

  const offset = wanted.clone().sub(look);
  const radius = Math.max(minimumHorizontal(characterHeight), Math.hypot(offset.x, offset.z));
  const azimuth = Math.atan2(offset.x, offset.z);
  const slope = offset.y / Math.max(.1, radius);
  const angles = [0, 15, -15, 30, -30, 55, -55, 80, -80, 110, -110, 145, -145, 180].map(v => v*Math.PI/180);
  const slopes = [...new Set([slope, Math.min(slope,.2), 0, .72])];
  let oldAngle = null;
  if (previous && enoughRoom(look, previous, characterHeight)) {
    oldAngle = wrap(Math.atan2(previous.x-look.x, previous.z-look.z)-azimuth);
    angles.unshift(oldAngle);
  }
  let best = null, bestScore = Infinity, fallback = null, fallbackDistance = -1;
  for (const angle of angles) for (const elevation of slopes) {
    const candidate = look.clone().add(new THREE.Vector3(
      Math.sin(azimuth+angle)*radius, elevation*radius, Math.cos(azimuth+angle)*radius,
    ));
    const length = candidate.distanceTo(look);
    const fraction = firstHit(look, candidate, boxes);
    if (fraction < 1) candidate.copy(look).lerp(candidate, Math.max(0,fraction-.16/length));
    const available = candidate.distanceTo(look);
    if (available > fallbackDistance && firstHit(look,candidate,boxes) >= 1) {
      fallbackDistance = available;
      fallback = candidate;
    }
    if (!enoughRoom(look,candidate,characterHeight)) continue;
    // Prefer the requested rear view. A mild hysteresis term keeps the same
    // shoulder when left and right are equally good across successive frames.
    const continuity = oldAngle === null ? 0 : .8*(1-Math.cos(angle-oldAngle)) +
      (Math.sign(angle)!==Math.sign(oldAngle) && Math.abs(oldAngle)>.15 ? .25 : 0);
    const compression = Math.max(0,1-available/Math.max(.1,wanted.distanceTo(look)));
    const score = Math.abs(angle)*1.4 + compression*3 + Math.abs(elevation-slope)*.8 + continuity;
    if (score < bestScore) { bestScore = score; best = candidate; }
  }
  // Real maps have room for the minimum. If arbitrary future geometry has no
  // such position, retain visibility at the farthest clear point, never cross
  // solid walls just to manufacture the requested camera distance.
  return best || fallback || look.clone();
}
