// Flight decisions only. The game keeps ownership of collision and gravity.
// Reset npcFlightPhase/npcFlightTimer to undefined when an actor respawns.
export function updateNPCFlight(a, dt, {
  canFly = false,
  enabled = false,
  distance = Infinity,
  targetY = 0,
  maxAltitude = 32,
  floorY = 0,
} = {}) {
  if (!a) return;
  const step = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const floor = Number.isFinite(floorY) ? floorY : 0;
  const ceiling = Number.isFinite(maxAltitude) ? Math.max(floor, maxAltitude) : 32;
  const y = Number.isFinite(a.group?.position?.y) ? a.group.position.y : floor;
  const index = Number.isFinite(a.index) ? Math.abs(Math.trunc(a.index)) : 0;
  const groundDuration = 4 + (index * 7 % 13) / 4; // 4–7 seconds, staggered.
  const airDuration = 6 + (index * 11 % 17) / 4; // 6–10 seconds.
  const grounded = y <= floor + .12;
  const roomToFly = ceiling - floor >= 1.3;
  if (!['ground', 'air', 'landing'].includes(a.npcFlightPhase)) {
    a.npcFlightPhase = a.flying ? 'air' : 'ground';
    a.npcFlightTimer = a.flying ? airDuration : groundDuration;
  }
  if (!Number.isFinite(a.npcFlightTimer)) a.npcFlightTimer = groundDuration;
  if (!Number.isFinite(a.vy)) a.vy = 0;

  const land = () => {
    if (a.flying) a.vy = Math.min(a.vy, -.4);
    a.flying = false;
    a.flightAxis = 0;
    a.flyPulse = 0;
    a.npcFlightPhase = grounded ? 'ground' : 'landing';
    a.npcFlightTimer = groundDuration;
  };

  // Never grant flight to a grounded character. Revoking flight leaves descent
  // to verticalMotion, so roofs and the ground still stop the character.
  if (!canFly || !enabled || !roomToFly || a.dead || a.active === false) {
    land();
    return;
  }
  if (a.npcFlightPhase === 'landing') {
    a.flying = false;
    a.flightAxis = 0;
    a.flyPulse = 0;
    if (grounded) {
      a.npcFlightPhase = 'ground';
      a.npcFlightTimer = groundDuration;
    }
    return;
  }
  if (a.npcFlightPhase === 'ground') {
    a.flying = false;
    a.flightAxis = 0;
    a.flyPulse = 0;
    if (!grounded) return;
    a.npcFlightTimer -= step;
    if (a.npcFlightTimer > 0) return;
    a.npcFlightPhase = 'air';
    a.npcFlightTimer = airDuration;
    a.flying = true;
    a.vy = Math.max(a.vy, 1.8);
  } else {
    a.npcFlightTimer -= step;
    if (a.npcFlightTimer <= 0) {
      land();
      return;
    }
  }

  // Cruise at varied heights; move nearer an opponent's feet at close range
  // so flying melee characters can still connect with grounded opponents.
  const foeY = Number.isFinite(targetY) ? Math.max(floor, targetY) : floor;
  const close = Number.isFinite(distance) && distance < 7;
  const cruiseY = floor + 3.2 + (index % 5) * .8;
  // Match airborne targets instead of adding an offset to their height: two
  // NPC fliers must not endlessly raise each other's requested altitude.
  const desiredY = close ? Math.max(floor + 1.15 + (index % 3) * .2, foeY) : Math.max(cruiseY, foeY);
  const target = Math.max(floor + .7, Math.min(ceiling - .22, desiredY));
  const error = target - y;
  a.flying = true;
  a.flyPulse = 0;
  a.flightAxis = Math.abs(error) <= .16 ? 0 : Math.max(-1, Math.min(1, error * 1.1));

  // The game's vertical controller approaches axis * 6. Limit both its input
  // and existing upward velocity, even when a lower ceiling appears overhead.
  const safeRise = step > 0 ? Math.max(0, ceiling - y) / step : 0;
  a.vy = Math.min(a.vy, safeRise);
  a.flightAxis = Math.min(a.flightAxis, safeRise / 6);
  if (y >= ceiling) {
    a.flightAxis = -1;
    a.vy = Math.min(a.vy, 0);
  }
}
