/*
 * Search the helix parameters for a composition that provably fits.
 *
 * spiralfit.mjs showed the first-guess constants clip at every aspect ratio and
 * place cards closer together than their own diagonal. Hand-tuning four coupled
 * parameters by rebuilding and squinting is exactly the loop this repo keeps
 * paying for, so this sweeps them and reports the cheapest set that satisfies
 * both constraints at once.
 *
 * Constraints:
 *   separation >= card diagonal * 1.12   (cards cannot intersect, with margin)
 *   worst |ndc| <= 0.86                  (>=14% framing headroom, all aspects)
 */
import * as THREE from 'three';

const CARD_W = 1.0, CARD_H = 1.4, FOV = 42, STOPS = 10;
const DIAG = Math.hypot(CARD_W, CARD_H);
const DTHETA = 0.62, YAMP = 0.34, Y_LIFT = 0.22;

const ASPECTS = [21 / 9, 16 / 9, 1, 4 / 5];
const arrive = (t) => { const k = Math.min(t / 0.6, 1); return 1 - Math.pow(1 - k, 3); };

function evaluate({ r, dz, camR, camZ, look }) {
  const cardPos = (i, o = new THREE.Vector3()) => {
    const th = i * DTHETA;
    return o.set(r * Math.cos(th), YAMP * Math.sin(th * 0.5) + Y_LIFT, -i * dz);
  };
  // separation
  let sep = Infinity;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < STOPS; i++)
    for (let j = i + 1; j < STOPS; j++)
      sep = Math.min(sep, cardPos(i, a).distanceTo(cardPos(j, b)));
  if (sep < DIAG * 1.12) return null;

  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.05, 90);
  const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3();
  let worst = 0;
  for (const aspect of ASPECTS) {
    for (let i = 0; i < STOPS; i++) {
      for (let f = 0; f <= 10; f++) {
        const s = i - 1 + arrive(f / 10);
        const th = s * DTHETA;
        cam.aspect = aspect;
        cam.position.set(camR * r * Math.cos(th), 0.30 + 0.5 * YAMP * Math.sin(th * 0.5), camZ - s * dz);
        cardPos(s, _t);
        _t.lerp(new THREE.Vector3(0, Y_LIFT, -(s + 1.15) * dz), look);
        cam.lookAt(_t);
        cam.updateMatrixWorld(true);
        cam.updateProjectionMatrix();
        cardPos(i, _c);
        for (const dx of [-CARD_W / 2, CARD_W / 2])
          for (const dy of [-CARD_H / 2, CARD_H / 2]) {
            const v = new THREE.Vector3(_c.x + dx, _c.y + dy, _c.z).project(cam);
            if (v.z > 1) continue;
            worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y));
          }
      }
    }
  }
  return worst <= 0.86 ? { sep, worst } : null;
}

const found = [];
for (const r of [1.6, 1.9, 2.2, 2.55])
  for (const dz of [1.9, 2.1, 2.4, 2.7])
    for (const camR of [0.0, 0.15, 0.3, 0.42])
      for (const camZ of [2.4, 2.9, 3.4, 3.9])
        for (const look of [0.0, 0.2, 0.35]) {
          const res = evaluate({ r, dz, camR, camZ, look });
          if (res) found.push({ r, dz, camR, camZ, look, ...res });
        }

// Prefer the tightest framing that still fits (largest worst under the cap),
// because a card that fills more of the frame reads as the subject.
found.sort((a, b) => b.worst - a.worst);
console.log(`${found.length} viable parameter sets. Best framing:`);
for (const f of found.slice(0, 8))
  console.log(`   r=${f.r} dz=${f.dz} camR=${f.camR} camZ=${f.camZ} look=${f.look}  -> sep ${f.sep.toFixed(2)}  worst|ndc| ${f.worst.toFixed(2)}`);
