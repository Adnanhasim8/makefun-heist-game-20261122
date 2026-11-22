// Velvet Rook — hand-in program (Node 22, standard library only).
// Copies this repository's game/ and screenshots/ into the output
// directory and writes dossier.json with the kit's vendored library, so
// the sealed gate can check the game and the judge can read its outline.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('Velvet Rook: game/index.html is missing, nothing to hand in.');
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((n) => !n.startsWith('.')).length < 3) {
  throw new Error('Velvet Rook: screenshots/ needs at least 3 screenshots.');
}
// Refuse an oversize screenshot here, with a readable error, instead of
// handing the gate a dossier it would refuse (screenshots cap 256 KiB).
for (const name of readdirSync(shotsDir).filter((n) => !n.startsWith('.'))) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 262144) {
    throw new Error(`Velvet Rook: screenshots/${name} is ${size} bytes, over the 256 KiB cap.`);
  }
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const shotNames = readdirSync(join(outDir, 'screenshots'))
  .filter((n) => !n.startsWith('.'))
  .sort();
const gameBytes = statSync(join(outDir, 'game', 'index.html')).size;
console.log(`Velvet Rook handed in: ${shotNames.length} screenshots (${shotNames.join(', ')}), dossier ${dossier.length} bytes, index.html ${gameBytes} bytes.`);
