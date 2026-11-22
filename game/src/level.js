// Velvet Rook — room geometry: collision, line of sight, cover checks.
// One file, one job: pure functions over a level's walls, no game state.
export function pointInWall(walls, x, y) {
  for (const w of walls) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}

// True when the straight segment between two points crosses no wall.
// Sampled every 4 px, which is finer than any wall in the levels.
export function hasLineOfSight(walls, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInWall(walls, ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}

// Move a circle (the thief or a guard) one axis at a time so it slides
// along walls instead of sticking in corners.
export function moveCircle(walls, pos, radius, dx, dy) {
  const nx = pos.x + dx;
  if (!circleHitsWall(walls, nx, pos.y, radius)) pos.x = nx;
  const ny = pos.y + dy;
  if (!circleHitsWall(walls, pos.x, ny, radius)) pos.y = ny;
}

export function circleHitsWall(walls, x, y, radius) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const ddx = x - cx;
    const ddy = y - cy;
    if (ddx * ddx + ddy * ddy < radius * radius) return true;
  }
  return false;
}

// Angle from a watcher to a target, folded to (-PI, PI].
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the target inside a watcher's cone (range + half-angle + line of sight)?
export function insideCone(walls, watcher, target, range, halfAngle) {
  const dist = Math.hypot(target.x - watcher.x, target.y - watcher.y);
  if (dist > range) return false;
  const diff = Math.abs(angleDifference(angleTo(watcher.x, watcher.y, target.x, target.y), watcher.facing));
  if (diff > halfAngle) return false;
  return hasLineOfSight(walls, watcher.x, watcher.y, target.x, target.y);
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
