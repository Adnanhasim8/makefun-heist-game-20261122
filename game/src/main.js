// Velvet Rook — boot and frame loop.
// One file, one job: wire the canvas, input, sound and game together and
// run the requestAnimationFrame loop. Title, level-clear, caught and win
// screens advance on Enter / click / R; a ?shot= name freezes the game
// into a staged frame for screenshots.
import { HUD_H, WORLD_H, WORLD_W } from './config.js';
import { createSoundBank } from './audio.js';
import { advanceLevel, createGame, loadLevel, restartGame, startGame, updateGame } from './game.js';
import { createInput } from './input.js';
import { drawGame } from './render.js';
import { SHOT_NAMES, applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = WORLD_W;
canvas.height = HUD_H + WORLD_H;
const ctx = canvas.getContext('2d');

const sounds = createSoundBank();
const input = createInput(canvas);
const game = createGame();
loadLevel(game, 0);

// Debug handle for headless play-testing: window.__heist exposes the live
// state and lets a test drive keys without touching the page.
window.__heist = { game, input, sounds };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot && SHOT_NAMES.includes(shot)) {
  applyShot(game, shot);
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (game.frozen) {
    // Staged screenshot: let sparkles shimmer, never move the pieces.
    game.time += dt * 0.25;
  } else if (game.phase === 'play') {
    updateGame(game, input, dt, sounds);
  } else if (game.phase === 'title') {
    if (input.confirmPressed || input.click) {
      input.confirmPressed = false;
      input.click = null;
      startGame(game, sounds);
    }
  } else if (game.phase === 'leveldone') {
    if (input.confirmPressed) {
      input.confirmPressed = false;
      advanceLevel(game, sounds);
    }
  } else if (game.phase === 'caught' || game.phase === 'win') {
    if (input.restartPressed) {
      input.restartPressed = false;
      restartGame(game, sounds);
    }
  }
  input.confirmPressed = false;
  input.restartPressed = false;
  if (game.phase !== 'play') input.smokePressed = false;

  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
