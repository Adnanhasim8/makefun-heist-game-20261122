// Velvet Rook — wall security cameras.
// One file, one job: a camera sweeps its arc on a fixed pivot and raises
// the alarm fast when the thief crosses its red cone with a clear sightline.
import { TUNING } from './config.js';
import { insideCone } from './level.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    facing: def.base,
    phase: Math.random() * Math.PI * 2,
    spotted: false,
    spotFlash: 0,
  };
}

export function updateCamera(camera, dt, time, player, walls, smokes) {
  // Smooth ping-pong sweep: sin() so the cone slows at each end of its arc,
  // which is what makes the timing readable before you move.
  camera.facing = camera.base + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
  const sees = cameraSeesPlayer(camera, player, walls, smokes);
  camera.spotted = sees;
  if (sees) camera.spotFlash = 0.5;
  else camera.spotFlash = Math.max(0, camera.spotFlash - dt);
  return sees;
}

export function cameraSeesPlayer(camera, player, walls, smokes) {
  if (player.hiddenBySmoke(smokes)) return false;
  return insideCone(walls, camera, player, TUNING.cameraRange, TUNING.cameraFov / 2);
}
