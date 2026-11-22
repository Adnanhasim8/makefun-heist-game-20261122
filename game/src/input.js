// Velvet Rook — keyboard and mouse input.
// One file, one job: turn key presses and clicks into one clean state the
// game loop reads each frame. WASD or arrows move, Shift sneaks, E picks
// the lock, F throws smoke, click throws a coin, Enter starts.
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0,
    moveY: 0,
    sneak: false,
    channelHeld: false,
    smokePressed: false,
    confirmPressed: false,
    restartPressed: false,
    click: null, // {x, y} in canvas pixels, consumed by the game loop
    mouse: { x: 0, y: 0 },
  };

  function readMove() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    state.moveX = x;
    state.moveY = y;
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    state.channelHeld = keys.has('KeyE');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyF') state.smokePressed = true;
    if (e.code === 'Enter' || e.code === 'Space') state.confirmPressed = true;
    if (e.code === 'KeyR') state.restartPressed = true;
    readMove();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    readMove();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    readMove();
  });

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    state.mouse = canvasPoint(e);
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = canvasPoint(e);
    state.mouse = p;
    if (e.button === 0) state.click = p;
    if (e.button === 2) state.smokePressed = true;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return state;
}
