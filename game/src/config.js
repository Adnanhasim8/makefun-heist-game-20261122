// Velvet Rook — level data and tuning.
// One file, one job: every number that shapes a room lives here, so the
// other modules only read it. All names, rooms and characters are original.
export const WORLD_W = 1280;
export const WORLD_H = 720;
export const HUD_H = 80;

export const TUNING = {
  playerRadius: 13,
  walkSpeed: 185,
  sneakSpeed: 95,
  guardPatrolSpeed: 78,
  guardChaseSpeed: 168,
  guardFov: 1.22, // radians, about 70 degrees
  guardRange: 215,
  cameraFov: 0.7, // about 40 degrees
  cameraRange: 250,
  suspicionGain: 95, // per second while fully seen, scaled by distance
  suspicionDecay: 26,
  alarmDecay: 2.2,
  alarmGuardAlert: 7,
  alarmCamera: 13,
  alarmSuspicion: 1.6,
  diamondChannelSeconds: 1.2,
  coinRange: 280,
  coinCount: 3,
  smokeCount: 2,
  smokeRadius: 78,
  smokeSeconds: 4,
  gemValue: 150,
  diamondValue: 2000,
};

function borderWalls() {
  const t = 16;
  return [
    { x: 0, y: 0, w: WORLD_W, h: t, kind: 'wall' },
    { x: 0, y: WORLD_H - t, w: WORLD_W, h: t, kind: 'wall' },
    { x: 0, y: 0, w: t, h: WORLD_H, kind: 'wall' },
    { x: WORLD_W - t, y: 0, w: t, h: WORLD_H, kind: 'wall' },
  ];
}

// Three rooms of one night: the gallery, the vault hall, the inner sanctum.
// Each room is crossed bottom-left to top-right: the thief starts at the
// service door, the Aurora Diamond waits in the vault, and the exit is the
// same door once the diamond is taken. Three routes run through every room:
// the left gallery, the guarded central hall, and the right service lane.
export const LEVELS = [
  {
    name: 'Room 1 — The Marble Gallery',
    parSeconds: 75,
    playerStart: { x: 96, y: 640 },
    exit: { x: 30, y: 628, w: 150, h: 56 },
    diamond: { x: 1168, y: 96 },
    gems: [
      { x: 300, y: 600 },
      { x: 990, y: 580 },
      { x: 150, y: 300 },
    ],
    walls: [
      ...borderWalls(),
      { x: 560, y: 300, w: 160, h: 96, kind: 'pillar' },
      { x: 200, y: 180, w: 190, h: 42, kind: 'desk' },
      { x: 900, y: 180, w: 210, h: 42, kind: 'case' },
      { x: 340, y: 470, w: 170, h: 42, kind: 'desk' },
      { x: 830, y: 470, w: 170, h: 42, kind: 'case' },
    ],
    guards: [
      {
        name: 'Warden Bram',
        waypoints: [
          { x: 640, y: 170 },
          { x: 640, y: 540 },
          { x: 400, y: 540 },
          { x: 400, y: 170 },
        ],
      },
    ],
    cameras: [{ x: 1010, y: 16, base: 1.9, sweep: 0.85, speed: 0.55 }],
  },
  {
    name: 'Room 2 — The Vault Hall',
    parSeconds: 95,
    playerStart: { x: 96, y: 640 },
    exit: { x: 30, y: 628, w: 150, h: 56 },
    diamond: { x: 1168, y: 96 },
    gems: [
      { x: 260, y: 620 },
      { x: 640, y: 620 },
      { x: 1010, y: 600 },
      { x: 150, y: 260 },
    ],
    walls: [
      ...borderWalls(),
      { x: 300, y: 260, w: 150, h: 90, kind: 'pillar' },
      { x: 830, y: 260, w: 150, h: 90, kind: 'pillar' },
      { x: 565, y: 430, w: 150, h: 90, kind: 'pillar' },
      { x: 180, y: 130, w: 170, h: 40, kind: 'desk' },
      { x: 930, y: 130, w: 170, h: 40, kind: 'case' },
    ],
    guards: [
      {
        name: 'Warden Bram',
        waypoints: [
          { x: 420, y: 160 },
          { x: 420, y: 560 },
          { x: 640, y: 560 },
          { x: 640, y: 160 },
        ],
      },
      {
        name: 'Warden Sable',
        waypoints: [
          { x: 980, y: 560 },
          { x: 980, y: 180 },
          { x: 760, y: 180 },
          { x: 760, y: 560 },
        ],
      },
    ],
    cameras: [
      { x: 640, y: 16, base: 1.57, sweep: 1.0, speed: 0.5 },
      { x: 1264, y: 330, base: 3.14, sweep: 0.8, speed: 0.65 },
    ],
  },
  {
    name: 'Room 3 — The Inner Sanctum',
    parSeconds: 110,
    playerStart: { x: 96, y: 640 },
    exit: { x: 30, y: 628, w: 150, h: 56 },
    diamond: { x: 1168, y: 96 },
    gems: [
      { x: 240, y: 620 },
      { x: 520, y: 620 },
      { x: 820, y: 620 },
      { x: 1080, y: 580 },
      { x: 150, y: 220 },
    ],
    walls: [
      ...borderWalls(),
      { x: 260, y: 200, w: 130, h: 80, kind: 'pillar' },
      { x: 890, y: 200, w: 130, h: 80, kind: 'pillar' },
      { x: 460, y: 400, w: 130, h: 80, kind: 'pillar' },
      { x: 690, y: 400, w: 130, h: 80, kind: 'pillar' },
      { x: 575, y: 120, w: 130, h: 44, kind: 'case' },
      { x: 180, y: 470, w: 150, h: 40, kind: 'desk' },
      { x: 950, y: 470, w: 150, h: 40, kind: 'desk' },
    ],
    guards: [
      {
        name: 'Warden Bram',
        waypoints: [
          { x: 360, y: 140 },
          { x: 360, y: 560 },
          { x: 560, y: 560 },
          { x: 560, y: 140 },
        ],
      },
      {
        name: 'Warden Sable',
        waypoints: [
          { x: 920, y: 560 },
          { x: 920, y: 140 },
          { x: 720, y: 140 },
          { x: 720, y: 560 },
        ],
      },
      {
        name: 'Warden Onyx',
        waypoints: [
          { x: 640, y: 300 },
          { x: 880, y: 300 },
          { x: 880, y: 520 },
          { x: 400, y: 520 },
          { x: 400, y: 300 },
        ],
      },
    ],
    cameras: [
      { x: 320, y: 16, base: 1.57, sweep: 0.9, speed: 0.6 },
      { x: 960, y: 16, base: 1.57, sweep: 0.9, speed: 0.55 },
      { x: 1264, y: 360, base: 3.14, sweep: 0.9, speed: 0.7 },
    ],
  },
];
