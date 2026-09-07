/*
 * Does every card actually fit in frame, at every stop, at every aspect ratio?
 *
 * This is the check the previous flying camera never had. MissionFlight's
 * header records that a camera threading fifteen hand-placed bodies clipped at
 * the frame edges, and that several attempts to fix it as a padding problem
 * failed because nothing was overflowing a box — the composition was unstable.
 * The helix is generated, so the same question is answerable as arithmetic,
 * before a scene exists. It caught an 82%-127% overflow in the first draft.
 *
 * Projects each card's four corners with a real THREE camera and reports the
 * worst normalised-device coordinate. |ndc| <= 1 is on screen.
 *
 * Run after changing ANY constant in src/components/space/spiral.ts.
 */
import * as THREE from 'three';
import {
  cardPosition, cameraPosition, cameraTarget, arrive, minCardSeparation,
  CARD_W, CARD_H,
} from '../src/components/space/spiral.ts';

const FOV = 42;
const STOPS = 10;
const DIAG = Math.hypot(CARD_W, CARD_H);

const ASPECTS = [
  ['ultrawide 21:9', 21 / 9],
  ['desktop 16:9', 16 / 9],
  ['stage 1:1', 1],
  ['portrait 4:5', 4 / 5],
];

const cam = new THREE.PerspectiveCamera(FOV, 1, 0.05, 90);
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3();

const sep = minCardSeparation(STOPS);
const sepOk = sep > DIAG;
console.log(`min card separation ${sep.toFixed(2)} vs card diagonal ${DIAG.toFixed(2)} — ${sepOk ? 'clear' : 'CARDS CAN INTERSECT'}\n`);

let fail = !sepOk;
for (const [label, aspect] of ASPECTS) {
  let worst = 0, worstAt = '';
  for (let i = 0; i < STOPS; i++) {
    for (let f = 0; f <= 10; f++) {
      const s = i - 1 + arrive(f / 10);
      cam.aspect = aspect;
      cam.position.copy(cameraPosition(s, _p));
      cam.lookAt(cameraTarget(s, _t));
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();
      cardPosition(i, _c);
      for (const dx of [-CARD_W / 2, CARD_W / 2]) {
        for (const dy of [-CARD_H / 2, CARD_H / 2]) {
          const v = new THREE.Vector3(_c.x + dx, _c.y + dy, _c.z).project(cam);
          if (v.z > 1) continue; // behind the camera, not yet arrived
          const m = Math.max(Math.abs(v.x), Math.abs(v.y));
          if (m > worst) { worst = m; worstAt = `card ${i} @ t=${(f / 10).toFixed(1)}`; }
        }
      }
    }
  }
  if (worst > 1) fail = true;
  const verdict = worst <= 1 ? `fits, ${((1 - worst) * 100).toFixed(0)}% headroom` : `CLIPS by ${((worst - 1) * 100).toFixed(0)}%`;
  console.log(`${label.padEnd(16)} worst |ndc| ${worst.toFixed(2)}  ${verdict.padEnd(24)} ${worstAt}`);
}
process.exit(fail ? 1 : 0);
