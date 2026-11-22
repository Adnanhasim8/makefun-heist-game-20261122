// Velvet Rook — guard patrol AI.
// One file, one job: how a warden walks, watches, suspects, chases and
// investigates. A guard never teleports and never sees through walls:
// suspicion only grows while the thief is inside the vision cone with a
// clear line of sight, and a chase only starts at full suspicion.
import { TUNING } from './config.js';
import { angleDifference, angleTo, hasLineOfSight, insideCone, moveCircle } from './level.js';

export function createGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    x: start.x,
    y: start.y,
    facing: Math.PI / 2,
    waypoints: def.waypoints,
    waypointIndex: 1,
    pauseLeft: 0,
    state: 'patrol', // patrol | suspicious | alert | investigate
    suspicion: 0,
    lastSeen: null,
    investigateTarget: null,
    lookAroundLeft: 0,
    scanDir: 1,
  };
}

function guardSeesPlayer(guard, player, walls, smokes) {
  if (player.hiddenBySmoke(smokes)) return false;
  return insideCone(walls, guard, player, TUNING.guardRange, TUNING.guardFov / 2);
}

// How fast suspicion climbs: closer is scarier, sneaking is safer,
// standing still in the open at close range is the worst of all.
function suspicionRate(guard, player) {
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
  const closeness = 1 - dist / TUNING.guardRange;
  let rate = TUNING.suspicionGain * (0.45 + 0.85 * closeness);
  if (player.sneaking) rate *= 0.45;
  return rate;
}

export function updateGuard(guard, dt, player, walls, smokes) {
  const sees = guardSeesPlayer(guard, player, walls, smokes);
  if (sees) {
    guard.suspicion = Math.min(100, guard.suspicion + suspicionRate(guard, player) * dt);
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - TUNING.suspicionDecay * dt);
  }

  if (guard.state === 'patrol') {
    if (guard.suspicion >= 100) {
      guard.state = 'alert';
    } else if (guard.suspicion >= 55) {
      guard.state = 'suspicious';
    } else {
      patrolStep(guard, dt, walls);
    }
  }

  if (guard.state === 'suspicious') {
    // Stop, stare at the last glimpse, then decide. A thief who breaks
    // line of sight is only a rumour; one who stays seen becomes a chase.
    if (guard.lastSeen) guard.facing = angleTo(guard.x, guard.y, guard.lastSeen.x, guard.lastSeen.y);
    if (guard.suspicion >= 100) {
      guard.state = 'alert';
    } else if (guard.suspicion <= 8) {
      guard.state = 'patrol';
    }
  }

  if (guard.state === 'alert') {
    // Chase the last seen spot; keep chasing while the thief stays seen.
    const target = sees ? player : guard.lastSeen;
    if (target) {
      const ang = angleTo(guard.x, guard.y, target.x, target.y);
      guard.facing = ang;
      moveCircle(
        walls,
        guard,
        12,
        Math.cos(ang) * TUNING.guardChaseSpeed * dt,
        Math.sin(ang) * TUNING.guardChaseSpeed * dt,
      );
    }
    // Lost the thief entirely: give up after suspicion drains, then
    // search the last seen spot before returning to patrol.
    if (!sees && guard.suspicion <= 0) {
      guard.state = 'investigate';
      guard.investigateTarget = guard.lastSeen ? { ...guard.lastSeen } : { x: guard.x, y: guard.y };
      guard.lookAroundLeft = 2.2;
    }
  }

  if (guard.state === 'investigate') {
    const t = guard.investigateTarget;
    if (t) {
      const dist = Math.hypot(t.x - guard.x, t.y - guard.y);
      if (dist > 14) {
        const ang = angleTo(guard.x, guard.y, t.x, t.y);
        guard.facing = ang;
        moveCircle(walls, guard, 12, Math.cos(ang) * TUNING.guardPatrolSpeed * 1.25 * dt, Math.sin(ang) * TUNING.guardPatrolSpeed * 1.25 * dt);
      } else {
        // Arrived: scan the room, then walk back to the patrol route.
        guard.lookAroundLeft -= dt;
        guard.facing += guard.scanDir * 1.6 * dt;
        if (guard.lookAroundLeft <= 0) {
          guard.state = 'patrol';
          guard.investigateTarget = null;
          guard.waypointIndex = nearestWaypoint(guard);
        }
      }
    }
    if (guard.suspicion >= 100) guard.state = 'alert';
  }
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.waypoints.forEach((w, i) => {
    const d = Math.hypot(w.x - guard.x, w.y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function patrolStep(guard, dt, walls) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const dist = Math.hypot(target.x - guard.x, target.y - guard.y);
  if (dist < 10) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = 0.8;
    return;
  }
  const ang = angleTo(guard.x, guard.y, target.x, target.y);
  guard.facing = ang;
  moveCircle(
    walls,
    guard,
    12,
    Math.cos(ang) * TUNING.guardPatrolSpeed * dt,
    Math.sin(ang) * TUNING.guardPatrolSpeed * dt,
  );
}

// A thrown coin pulls every guard in earshot to the ping.
export function distractGuards(guards, coin) {
  for (const guard of guards) {
    const dist = Math.hypot(coin.x - guard.x, coin.y - guard.y);
    if (dist < 300 && guard.state !== 'alert') {
      guard.state = 'investigate';
      guard.investigateTarget = { x: coin.x, y: coin.y };
      guard.lookAroundLeft = 1.6;
      guard.suspicion = Math.max(guard.suspicion, 30);
    }
  }
}

// A guard who goes alert shouts: wardens near the chase join it, turning
// one spotted guard into a converging search instead of a solo chase.
export function reinforceAlert(guards) {
  const alarmed = guards.filter((guard) => guard.state === 'alert' && guard.lastSeen);
  if (alarmed.length === 0) return;
  for (const guard of guards) {
    if (guard.state === 'alert') continue;
    for (const lead of alarmed) {
      const dist = Math.hypot(lead.x - guard.x, lead.y - guard.y);
      if (dist < 420) {
        guard.suspicion = Math.max(guard.suspicion, 45);
        if (guard.state === 'patrol' || guard.state === 'suspicious') {
          guard.state = 'investigate';
          guard.investigateTarget = { ...lead.lastSeen };
          guard.lookAroundLeft = 2.5;
        }
        break;
      }
    }
  }
}

export function guardCaughtPlayer(guard, player) {
  return Math.hypot(player.x - guard.x, player.y - guard.y) < 24;
}

export function guardCanSee(guard, player, walls, smokes) {
  return guardSeesPlayer(guard, player, walls, smokes);
}

export { hasLineOfSight };
