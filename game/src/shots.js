// Velvet Rook — staged screenshot states.
// One file, one job: put the game into a chosen, readable moment for a
// screenshot (?shot=cover|stealth|alarm|win). The staged frame is built
// only from the game's own state — same rooms, same guards, same cones —
// and the loop freezes gameplay while staged so the capture is stable.
import { loadLevel } from './game.js';

export const SHOT_NAMES = ['cover', 'stealth', 'alarm', 'win'];

export function applyShot(g, name) {
  g.frozen = true;
  if (name === 'cover') {
    loadLevel(g, 0);
    g.phase = 'play';
    g.time = 42;
    g.levelTime = 42;
    g.timeText = '0:42';
    g.player.x = 620;
    g.player.y = 430;
    g.player.facing = -Math.PI / 2;
    g.player.sneaking = true;
    g.gems[0].taken = true;
    g.loot = 150;
    g.levelLoot = 150;
    g.alarm = 35;
    g.maxAlarm = 35;
    const guard = g.guards[0];
    guard.x = 640;
    guard.y = 250;
    guard.facing = Math.PI / 2;
    guard.state = 'suspicious';
    guard.suspicion = 62;
    guard.lastSeen = { x: 620, y: 430 };
    const cam = g.cameras[0];
    cam.facing = 2.2;
    cam.phase = 0;
  } else if (name === 'stealth') {
    loadLevel(g, 1);
    g.phase = 'play';
    g.time = 68;
    g.levelTime = 68;
    g.timeText = '1:08';
    g.player.x = 250;
    g.player.y = 520;
    g.player.facing = Math.PI / 4;
    g.player.sneaking = true;
    g.gems[0].taken = true;
    g.gems[1].taken = true;
    g.loot = 300;
    g.levelLoot = 300;
    g.alarm = 12;
    g.maxAlarm = 12;
    g.smokes.push({ x: 250, y: 520, left: 3.2 });
    const g0 = g.guards[0];
    g0.x = 420;
    g0.y = 380;
    g0.facing = Math.PI / 2;
    g0.state = 'patrol';
    g0.suspicion = 18;
    const g1 = g.guards[1];
    g1.x = 980;
    g1.y = 300;
    g1.facing = -Math.PI / 2;
    g1.state = 'patrol';
    g1.suspicion = 0;
    g.cameras[0].facing = 1.2;
    g.cameras[1].facing = 2.6;
  } else if (name === 'alarm') {
    loadLevel(g, 1);
    g.phase = 'play';
    g.time = 96;
    g.levelTime = 96;
    g.timeText = '1:36';
    g.player.x = 300;
    g.player.y = 620;
    g.player.facing = Math.PI;
    g.player.sneaking = false;
    g.diamondTaken = true;
    g.loot = 2450;
    g.levelLoot = 2450;
    g.gems.forEach((gem) => {
      gem.taken = true;
    });
    g.alarm = 82;
    g.maxAlarm = 82;
    g.objective = 'Diamond taken — reach the GETAWAY door';
    g.hint = 'The exit is open. Do not get caught now.';
    const g0 = g.guards[0];
    g0.x = 470;
    g0.y = 560;
    g0.facing = Math.PI;
    g0.state = 'alert';
    g0.suspicion = 100;
    g0.lastSeen = { x: 300, y: 620 };
    const g1 = g.guards[1];
    g1.x = 760;
    g1.y = 420;
    g1.facing = Math.PI * 0.75;
    g1.state = 'suspicious';
    g1.suspicion = 71;
    g1.lastSeen = { x: 300, y: 620 };
    g.cameras[0].facing = 2.4;
    g.cameras[0].spotted = true;
    g.cameras[1].facing = 3.4;
    g.cameras[1].spotted = true;
  } else if (name === 'win') {
    loadLevel(g, 2);
    g.phase = 'win';
    g.time = 284;
    g.timeText = '4:44';
    g.loot = 7450;
    g.stealthBonus = 900;
    g.alarm = 18;
    g.maxAlarm = 54;
    g.diamondTaken = true;
    g.gems.forEach((gem) => {
      gem.taken = true;
    });
  }
  return g;
}
