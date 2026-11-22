// Velvet Rook — game state and rules.
// One file, one job: the loop that ties movement, guards, cameras, loot,
// tools and the alarm meter into one playable heist. Nothing here draws;
// render.js owns every pixel.
import { LEVELS, TUNING } from './config.js';
import { createCamera, updateCamera } from './cameras.js';
import { createGuard, distractGuards, guardCaughtPlayer, reinforceAlert, updateGuard } from './guards.js';
import { circleHitsWall, moveCircle, rectsOverlap } from './level.js';

export function createGame() {
  return {
    phase: 'title', // title | play | leveldone | caught | win
    levelIndex: 0,
    levelCount: LEVELS.length,
    level: LEVELS[0],
    player: null,
    guards: [],
    cameras: [],
    gems: [],
    smokes: [],
    coinsInFlight: [],
    coinsLanded: [],
    coins: TUNING.coinCount,
    smokesLeft: TUNING.smokeCount,
    loot: 0,
    levelLoot: 0,
    stealthBonus: 0,
    diamondTaken: false,
    channelProgress: 0,
    alarm: 0,
    time: 0,
    levelTime: 0,
    timeText: '0:00',
    objective: 'Steal the Aurora Diamond',
    hint: 'WASD move · Shift sneak · Click coin · F smoke',
    caughtReason: null,
    caughtBy: null,
    alarmWasHot: false,
    maxAlarm: 0,
  };
}

export function loadLevel(g, index) {
  const level = LEVELS[index];
  g.levelIndex = index;
  g.level = level;
  g.player = {
    x: level.playerStart.x,
    y: level.playerStart.y,
    facing: -Math.PI / 2,
    sneaking: false,
    hiddenBySmoke(smokes) {
      for (const s of smokes) {
        if (Math.hypot(this.x - s.x, this.y - s.y) < TUNING.smokeRadius) return true;
      }
      return false;
    },
  };
  g.guards = level.guards.map(createGuard);
  g.cameras = level.cameras.map(createCamera);
  g.gems = level.gems.map((gem) => ({ ...gem, taken: false }));
  g.smokes = [];
  g.coinsInFlight = [];
  g.coinsLanded = [];
  g.coins = TUNING.coinCount;
  g.smokesLeft = TUNING.smokeCount;
  g.diamondTaken = false;
  g.channelProgress = 0;
  g.alarm = 0;
  g.levelTime = 0;
  g.levelLoot = 0;
  g.objective = 'Steal the Aurora Diamond';
  g.hint = 'WASD move · Shift sneak · Click coin · F smoke';
  g.caughtReason = null;
  g.caughtBy = null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function startGame(g, sounds) {
  loadLevel(g, 0);
  g.phase = 'play';
  g.time = 0;
  g.loot = 0;
  g.stealthBonus = 0;
  g.maxAlarm = 0;
  sounds.unlock();
  sounds.click();
}

export function updateGame(g, input, dt, sounds) {
  if (g.phase !== 'play') return;
  g.time += dt;
  g.levelTime += dt;
  g.timeText = formatTime(g.time);

  updatePlayer(g, input, dt, sounds);
  updateCoins(g, dt, sounds);
  updateSmokes(g, dt);
  for (const guard of g.guards) updateGuard(guard, dt, g.player, g.level.walls, g.smokes);
  reinforceAlert(g.guards);
  let cameraSees = false;
  for (const cam of g.cameras) {
    if (updateCamera(cam, dt, g.time, g.player, g.level.walls, g.smokes)) cameraSees = true;
  }
  updateAlarm(g, dt, cameraSees, sounds);
  updateLoot(g, input, dt, sounds);
  checkCaught(g, sounds);
  checkExit(g, sounds);
}

function updatePlayer(g, input, dt, sounds) {
  const p = g.player;
  p.sneaking = input.sneak;
  const speed = p.sneaking ? TUNING.sneakSpeed : TUNING.walkSpeed;
  if (input.moveX !== 0 || input.moveY !== 0) {
    p.facing = Math.atan2(input.moveY, input.moveX);
    // Lifting the diamond needs still hands: moving breaks the channel.
    if (g.channelProgress > 0) g.channelProgress = 0;
    moveCircle(g.level.walls, p, TUNING.playerRadius, input.moveX * speed * dt, input.moveY * speed * dt);
  }
  if (input.smokePressed) {
    input.smokePressed = false;
    if (g.smokesLeft > 0 && g.smokes.length < 3) {
      g.smokes.push({ x: p.x, y: p.y, left: TUNING.smokeSeconds });
      g.smokesLeft -= 1;
      sounds.smoke();
    }
  }
  if (input.click) {
    const target = { x: input.click.x, y: input.click.y - 80 };
    input.click = null;
    if (g.coins > 0 && target.y > 0 && target.y < 720) {
      throwCoin(g, target, sounds);
    }
  }
}

function throwCoin(g, target, sounds) {
  const p = g.player;
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, TUNING.coinRange);
  const landing = { x: p.x + (dx / dist) * range, y: p.y + (dy / dist) * range };
  g.coins -= 1;
  g.coinsInFlight.push({ x: p.x, y: p.y, tx: landing.x, ty: landing.y, t: 0, dur: 0.35 });
  g.pendingCoin = landing;
  sounds.coin();
}

function updateCoins(g, dt, sounds) {
  for (let i = g.coinsInFlight.length - 1; i >= 0; i--) {
    const c = g.coinsInFlight[i];
    c.t += dt;
    const frac = Math.min(1, c.t / c.dur);
    c.x = c.x + (c.tx - c.x) * frac;
    c.y = c.y + (c.ty - c.y) * frac;
    if (frac >= 1) {
      g.coinsInFlight.splice(i, 1);
      g.coinsLanded.push({ x: c.tx, y: c.ty, left: 1.2 });
      distractGuards(g.guards, { x: c.tx, y: c.ty });
      sounds.coinLand();
    }
  }
  for (let i = g.coinsLanded.length - 1; i >= 0; i--) {
    g.coinsLanded[i].left -= dt;
    if (g.coinsLanded[i].left <= 0) g.coinsLanded.splice(i, 1);
  }
}

function updateSmokes(g, dt) {
  for (let i = g.smokes.length - 1; i >= 0; i--) {
    g.smokes[i].left -= dt;
    if (g.smokes[i].left <= 0) g.smokes.splice(i, 1);
  }
}

function updateAlarm(g, dt, cameraSees, sounds) {
  let gain = 0;
  for (const guard of g.guards) {
    if (guard.state === 'alert') gain += TUNING.alarmGuardAlert;
    else if (guard.suspicion >= 55) gain += TUNING.alarmSuspicion;
  }
  if (cameraSees) gain += TUNING.alarmCamera;
  if (gain > 0) g.alarm = Math.min(100, g.alarm + gain * dt);
  else g.alarm = Math.max(0, g.alarm - TUNING.alarmDecay * dt);
  g.maxAlarm = Math.max(g.maxAlarm, g.alarm);
  const hot = g.alarm >= 65;
  if (hot !== g.alarmWasHot) {
    g.alarmWasHot = hot;
    sounds.setAlarmHot(hot);
    if (hot) sounds.spotted();
  }
  if (g.alarm >= 100) {
    g.phase = 'caught';
    g.caughtReason = 'lockdown';
    sounds.setAlarmHot(false);
    sounds.caught();
  }
}

function updateLoot(g, input, dt, sounds) {
  const p = g.player;
  for (const gem of g.gems) {
    if (!gem.taken && Math.hypot(gem.x - p.x, gem.y - p.y) < 26) {
      gem.taken = true;
      g.loot += TUNING.gemValue;
      g.levelLoot += TUNING.gemValue;
      sounds.pickup();
    }
  }
  if (g.diamondTaken) return;
  const d = g.level.diamond;
  const near = Math.hypot(d.x - p.x, d.y - 22 - p.y) < 52;
  if (near && input.channelHeld) {
    g.channelProgress += dt / TUNING.diamondChannelSeconds;
    if (Math.floor(g.channelProgress * 8) !== Math.floor((g.channelProgress - dt / TUNING.diamondChannelSeconds) * 8)) {
      sounds.channelTick();
    }
    if (g.channelProgress >= 1) {
      g.diamondTaken = true;
      g.channelProgress = 0;
      g.loot += TUNING.diamondValue;
      g.levelLoot += TUNING.diamondValue;
      g.objective = 'Diamond taken — reach the GETAWAY door';
      g.hint = 'The exit is open. Do not get caught now.';
      sounds.diamond();
    }
  } else if (g.channelProgress > 0) {
    g.channelProgress = 0;
  }
}

function checkCaught(g, sounds) {
  for (const guard of g.guards) {
    if (guardCaughtPlayer(guard, g.player)) {
      g.phase = 'caught';
      g.caughtReason = 'grabbed';
      g.caughtBy = guard.name;
      sounds.setAlarmHot(false);
      sounds.caught();
      return;
    }
  }
}

function checkExit(g, sounds) {
  if (!g.diamondTaken) return;
  const p = g.player;
  const e = g.level.exit;
  if (rectsOverlap({ x: p.x - 10, y: p.y - 10, w: 20, h: 20 }, e)) {
    // Stealth bonus: leaving with a cool alarm pays for the planning.
    if (g.alarm < 30) g.stealthBonus += 300;
    if (g.levelIndex + 1 < g.levelCount) {
      g.phase = 'leveldone';
      sounds.win();
    } else {
      g.phase = 'win';
      sounds.setAlarmHot(false);
      sounds.win();
    }
  }
}

export function advanceLevel(g, sounds) {
  if (g.phase === 'leveldone') {
    loadLevel(g, g.levelIndex + 1);
    g.phase = 'play';
    sounds.click();
  }
}

export function restartGame(g, sounds) {
  startGame(g, sounds);
}

// Keep a player circle out of walls at spawn and after staging.
export function clampPlayerToRoom(g) {
  const p = g.player;
  if (circleHitsWall(g.level.walls, p.x, p.y, TUNING.playerRadius)) {
    p.x = g.level.playerStart.x;
    p.y = g.level.playerStart.y;
  }
}
