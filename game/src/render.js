// Velvet Rook — canvas rendering.
// One file, one job: everything the player and the judge see. Safe cover,
// danger and loot are colour-coded at a glance: teal is the thief, amber
// cones are guard sight, red cones are cameras, gold is loot, and the
// alarm meter runs green to red across the top bar.
import { HUD_H, TUNING, WORLD_H, WORLD_W } from './config.js';

const FLOOR_A = '#20293d';
const FLOOR_B = '#1c2436';
const GOLD = '#f2c14e';
const TEAL = '#2dd4bf';
const DANGER = '#f87171';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawDiamondShape(ctx, x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.8, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.8, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff7d6';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.8, y);
  ctx.lineTo(x + size * 0.8, y);
  ctx.stroke();
}

export function drawGame(ctx, g) {
  ctx.clearRect(0, 0, WORLD_W, HUD_H + WORLD_H);
  drawHud(ctx, g);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, g);
  // Cones first, walls over them: a cone that a wall covers is a cone
  // that cannot see through that wall, so the player reads cover truly.
  drawCameraCones(ctx, g);
  drawGuardCones(ctx, g);
  drawWalls(ctx, g);
  drawExit(ctx, g);
  drawLoot(ctx, g);
  drawSmoke(ctx, g);
  drawCoins(ctx, g);
  drawCameraBodies(ctx, g);
  drawGuardBodies(ctx, g);
  drawPlayer(ctx, g);
  drawChannelRing(ctx, g);
  ctx.restore();
  if (g.alarm >= 65 && g.phase === 'play') drawAlarmVignette(ctx, g);
  if (g.phase === 'title') drawTitle(ctx, g);
  if (g.phase === 'leveldone') drawLevelDone(ctx, g);
  if (g.phase === 'caught') drawCaught(ctx, g);
  if (g.phase === 'win') drawWin(ctx, g);
}

function drawHud(ctx, g) {
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, WORLD_W, HUD_H);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(0, HUD_H - 3, WORLD_W, 3);

  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET ROOK', 20, 26);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(g.level.name, 20, 56);

  // Objective and hint live in a centre column (x 300–820) so they can
  // never collide with the loot tally and the alarm meter on the right.
  // The column is centred at 480, not the page middle, because the right
  // block (loot + tools + alarm) is wider than the title block on the left.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(g.objective, 480, 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(g.hint, 480, 52);

  // Loot tally, left of the alarm meter.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(`LOOT $${g.loot.toLocaleString('en-US')}`, 830, 26);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Coins ${g.coins}   Smoke ${g.smokesLeft}   ${g.timeText}`, 830, 56);

  // Alarm meter, top right: labelled, numbered, green to red.
  const ax = 860;
  const ay = 16;
  const aw = 380;
  const ah = 22;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('ALARM', ax, ay - 2);
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, ax, ay + 8, aw, ah, 6);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, g.alarm / 100));
  const col = g.alarm < 35 ? '#22c55e' : g.alarm < 65 ? '#f59e0b' : '#ef4444';
  ctx.fillStyle = col;
  if (frac > 0) {
    roundRect(ctx, ax, ay + 8, Math.max(8, aw * frac), ah, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax, ay + 8, aw, ah, 6);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(g.alarm)}%`, ax + aw, ay + ah + 16);
  ctx.textAlign = 'left';
  ctx.fillStyle = g.alarm >= 65 ? '#f87171' : '#94a3b8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(g.alarm >= 65 ? 'LOCKDOWN IMMINENT' : 'stay out of sight', ax, ay + ah + 16);
}

function drawFloor(ctx, g) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = FLOOR_B;
  const tile = 80;
  for (let y = 0; y < WORLD_H / tile; y++) {
    for (let x = 0; x < WORLD_W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // Warm light pools under the ceiling lamps, kept faint so they never
  // read as fog over the room.
  ctx.fillStyle = 'rgba(242, 193, 78, 0.028)';
  for (const lx of [240, 640, 1040]) {
    ctx.beginPath();
    ctx.arc(lx, 300, 150, 0, Math.PI * 2);
    ctx.fill();
  }
  // Gold trim inside the outer wall.
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, WORLD_W - 40, WORLD_H - 40);
}

// Walls and cover, drawn after the vision cones so a cone never shows
// through solid cover: what the cone paints over is what it can see.
function drawWalls(ctx, g) {
  for (const w of g.level.walls) {
    if (w.kind === 'wall') {
      ctx.fillStyle = '#3b4a63';
    } else if (w.kind === 'pillar') {
      ctx.fillStyle = '#5b6b8c';
    } else if (w.kind === 'desk') {
      ctx.fillStyle = '#6b4a2f';
    } else {
      ctx.fillStyle = '#274b5f';
    }
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    if (w.kind === 'case') {
      ctx.fillStyle = 'rgba(242, 193, 78, 0.35)';
      ctx.fillRect(w.x + 8, w.y + 8, w.w - 16, w.h - 16);
    }
    if (w.kind === 'pillar') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, 8);
    }
  }
}

function drawExit(ctx, g) {
  const e = g.level.exit;
  const open = g.diamondTaken;
  ctx.fillStyle = open ? '#14532d' : '#3f1d1d';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#4ade80' : '#f87171';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
  ctx.fillStyle = open ? '#bbf7d0' : '#fecaca';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'GETAWAY ✓' : 'EXIT — LOCKED', e.x + e.w / 2, e.y + e.h / 2);
  if (open && Math.sin(g.time * 6) > 0) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  }
}

function drawLoot(ctx, g) {
  for (const gem of g.gems) {
    if (gem.taken) continue;
    const tw = 0.7 + 0.3 * Math.sin(g.time * 3 + gem.x);
    drawDiamondShape(ctx, gem.x, gem.y, 11 * tw + 4, '#67e8f9');
    ctx.fillStyle = '#a5f3fc';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('$150', gem.x, gem.y + 26);
  }
  if (!g.diamondTaken) {
    const d = g.level.diamond;
    // Pedestal.
    ctx.fillStyle = '#475569';
    ctx.fillRect(d.x - 26, d.y - 6, 52, 44);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(d.x - 32, d.y + 38, 64, 8);
    const pulse = 1 + 0.12 * Math.sin(g.time * 4);
    drawDiamondShape(ctx, d.x, d.y - 22, 20 * pulse, GOLD);
    ctx.fillStyle = '#fff7d6';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA DIAMOND', d.x, d.y + 66);
    ctx.fillStyle = '#fde68a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('hold E to lift it', d.x, d.y + 84);
    // Sparkles.
    ctx.fillStyle = '#fff7d6';
    for (let i = 0; i < 4; i++) {
      const a = g.time * 2 + (i * Math.PI) / 2;
      ctx.fillRect(d.x + Math.cos(a) * 34 - 1.5, d.y - 22 + Math.sin(a) * 26 - 1.5, 3, 3);
    }
  }
}

function drawSmoke(ctx, g) {
  for (const s of g.smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, TUNING.smokeRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawCoins(ctx, g) {
  for (const c of g.coinsInFlight) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.strokeStyle = '#fff7d6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const c of g.coinsLanded) {
    const frac = 1 - c.left / 1.2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8 + frac * 46, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(242, 193, 78, ${1 - frac})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }
}

function drawCameraCones(ctx, g) {
  for (const cam of g.cameras) {
    drawCone(
      ctx,
      cam.x,
      cam.y,
      cam.facing,
      TUNING.cameraFov / 2,
      TUNING.cameraRange,
      cam.spotted ? 'rgba(239, 68, 68, 0.30)' : 'rgba(239, 68, 68, 0.14)',
      cam.spotted ? '#ef4444' : 'rgba(239, 68, 68, 0.5)',
    );
  }
}

function drawCameraBodies(ctx, g) {
  for (const cam of g.cameras) {
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = cam.spotted ? '#ef4444' : '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = cam.spotted && Math.sin(g.time * 14) > 0 ? '#ffffff' : '#ef4444';
    ctx.fill();
    if (cam.spotted) {
      // A camera on the right wall labels to its left, never off-canvas.
      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 13px Georgia, serif';
      if (cam.x > WORLD_W - 120) {
        ctx.textAlign = 'right';
        ctx.fillText('SPOTTED', cam.x - 18, cam.y + 5);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText('SPOTTED', cam.x, cam.y + 28);
      }
    }
  }
}

function drawGuardCones(ctx, g) {
  for (const guard of g.guards) {
    drawCone(
      ctx,
      guard.x,
      guard.y,
      guard.facing,
      TUNING.guardFov / 2,
      TUNING.guardRange,
      guard.state === 'alert'
        ? 'rgba(249, 115, 22, 0.34)'
        : guard.state === 'suspicious'
          ? 'rgba(245, 158, 11, 0.28)'
          : 'rgba(245, 158, 11, 0.18)',
      guard.state === 'alert' ? '#f97316' : 'rgba(245, 158, 11, 0.55)',
    );
  }
}

function drawGuardBodies(ctx, g) {
  for (const guard of g.guards) {
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a5f';
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Cap.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 4, 6, Math.PI, 0);
    ctx.fillStyle = '#0f2440';
    ctx.fill();
    // Suspicion arc above the head.
    if (guard.suspicion > 4) {
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 20, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
      ctx.strokeStyle = guard.suspicion >= 100 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    if (guard.state === 'alert') {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('!', guard.x, guard.y - 26);
    } else if (guard.state === 'suspicious' || guard.state === 'investigate') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('?', guard.x, guard.y - 26);
    }
    ctx.fillStyle = '#dbeafe';
    ctx.font = '11px Georgia, serif';
    ctx.fillText(guard.name, guard.x, guard.y + 30);
  }
}

function drawPlayer(ctx, g) {
  const p = g.player;
  // Soft shadow.
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  const r = p.sneaking ? 11 : 13;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0f766e';
  ctx.fill();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point toward facing.
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.facing) * (r + 7), p.y + Math.sin(p.facing) * (r + 7));
  ctx.lineTo(p.x + Math.cos(p.facing + 2.5) * r * 0.6, p.y + Math.sin(p.facing + 2.5) * r * 0.6);
  ctx.lineTo(p.x + Math.cos(p.facing - 2.5) * r * 0.6, p.y + Math.sin(p.facing - 2.5) * r * 0.6);
  ctx.closePath();
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.fillStyle = '#ccfbf1';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROOK', p.x, p.y - 22);
  if (p.sneaking) {
    ctx.fillStyle = '#5eead4';
    ctx.font = '11px Georgia, serif';
    ctx.fillText('sneaking', p.x, p.y + 28);
  }
}

function drawChannelRing(ctx, g) {
  if (g.channelProgress <= 0 || g.diamondTaken) return;
  const d = g.level.diamond;
  ctx.beginPath();
  ctx.arc(d.x, d.y - 22, 34, -Math.PI / 2, -Math.PI / 2 + g.channelProgress * Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#fff7d6';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('lifting the diamond…', d.x, d.y - 62);
}

function drawAlarmVignette(ctx, g) {
  const pulse = 0.25 + 0.2 * Math.sin(g.time * 6);
  ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, HUD_H + 7, WORLD_W - 14, WORLD_H - 14);
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
  ctx.fillRect(0, 0, WORLD_W, HUD_H + WORLD_H);
  ctx.fillStyle = '#0d1220';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, WORLD_W / 2 - 360, 150, 720, 440, 14);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(title, WORLD_W / 2, 215);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '17px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, WORLD_W / 2, 270 + i * 32);
  });
}

function drawTitle(ctx, g) {
  overlayPanel(
    ctx,
    'VELVET ROOK',
    [
      'One night. One vault. The Aurora Diamond.',
      '',
      'WASD / arrows — move      Shift — sneak      E — lift the diamond (hold)',
      'Click — throw a coin to distract      F / right-click — smoke pellet',
      'Cross the room, lift the diamond, reach the GETAWAY door.',
      'Guards watch amber cones. Cameras watch red cones. The alarm fills fast.',
      '',
      'Press Enter or click to begin the heist',
    ],
    GOLD,
  );
}

function drawLevelDone(ctx, g) {
  overlayPanel(
    ctx,
    'CLEAN GETAWAY',
    [
      `${g.level.name} — cleared`,
      `Loot this room: $${g.levelLoot.toLocaleString('en-US')}      Alarm at exit: ${Math.round(g.alarm)}%`,
      `Total loot: $${g.loot.toLocaleString('en-US')}`,
      '',
      g.levelIndex + 1 < g.levelCount ? 'Press Enter for the next room' : 'Press Enter for the final getaway',
    ],
    '#4ade80',
  );
}

function drawCaught(ctx, g) {
  overlayPanel(
    ctx,
    g.caughtReason === 'lockdown' ? 'LOCKDOWN' : 'CAUGHT',
    [
      g.caughtReason === 'lockdown'
        ? 'The alarm hit 100% — the vault sealed itself with you inside.'
        : `${g.caughtBy} grabbed Rook in the open. A fair catch: the cone was on you.`,
      '',
      `Loot kept: $${g.loot.toLocaleString('en-US')}      Best room: ${g.level.name}`,
      '',
      'Press R to plan the heist again',
    ],
    DANGER,
  );
}

function drawWin(ctx, g) {
  overlayPanel(
    ctx,
    'THE GETAWAY',
    [
      'Rook slips into the night with the Aurora Diamond.',
      `Final loot: $${g.loot.toLocaleString('en-US')}      Time: ${g.timeText}`,
      `Stealth bonus: $${g.stealthBonus.toLocaleString('en-US')}      Rooms cleared: ${g.levelCount}`,
      '',
      'Three rooms, three wardens, one diamond — and nobody saw a thing.',
      'Press R to run it again',
    ],
    GOLD,
  );
}

export { DANGER, GOLD, TEAL };
