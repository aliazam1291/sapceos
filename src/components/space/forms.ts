import * as THREE from "three";

/**
 * Procedural form library.
 *
 * Every page gets its own object. One shape repeated site-wide reads as a motif
 * for about two screens and as a stock asset after that — the fix is different
 * geometry, not more shading on the same geometry.
 *
 * All forms are built from primitives and maths: no glTF, no textures, so the
 * whole library costs zero network bytes and adds nothing to the asset budget.
 *
 * Each builder returns the three buffers the surface treatment needs:
 *   hull   — an optional solid, drawn in the page colour to occlude far edges
 *   edges  — the wireframe, which is what actually reads
 *   nodes  — vertex positions, lit as points
 */

export type FormName = "planet" | "station" | "truss" | "satellite" | "probe" | "crystal";

export type Form = {
  hull: THREE.BufferGeometry | null;
  edges: THREE.BufferGeometry;
  nodes: Float32Array;
  /** Rough radius, so the camera can frame any form without per-page tuning. */
  extent: number;
};

/** mulberry32 — small, fast, deterministic. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Unique vertex positions of a geometry, for the node cloud. */
function uniqueVertices(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute("position");
  const seen = new Set<string>();
  const out: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos as THREE.BufferAttribute, i);
    const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v.x, v.y, v.z);
  }
  return new Float32Array(out);
}

/** Line segments from an explicit list of point pairs. */
function segments(pairs: THREE.Vector3[]) {
  return new THREE.BufferGeometry().setFromPoints(pairs);
}

/* ── planet ─────────────────────────────────────────────────────────────────
 * The anchor form: a faceted body. Used where the object should read as a
 * world rather than a machine.
 */
function planet(detail = 2): Form {
  const hull = new THREE.IcosahedronGeometry(1, detail);
  return {
    hull,
    edges: new THREE.EdgesGeometry(hull, 1),
    nodes: uniqueVertices(hull),
    extent: 1,
  };
}

/* ── station ────────────────────────────────────────────────────────────────
 * A habitation ring: outer torus, inner hub, spokes between them. Reads as
 * built rather than found — the right register for pages about systems.
 */
function station(spokes = 8): Form {
  const R = 1.05;
  const r = 0.24;
  const pairs: THREE.Vector3[] = [];

  // Outer ring and inner ring, as polygons so the edges stay crisp lines.
  const ringSegs = 48;
  for (let ring = 0; ring < 2; ring++) {
    const rad = ring === 0 ? R : r * 1.6;
    for (let i = 0; i < ringSegs; i++) {
      const a0 = (i / ringSegs) * Math.PI * 2;
      const a1 = ((i + 1) / ringSegs) * Math.PI * 2;
      pairs.push(
        new THREE.Vector3(Math.cos(a0) * rad, 0, Math.sin(a0) * rad),
        new THREE.Vector3(Math.cos(a1) * rad, 0, Math.sin(a1) * rad),
      );
    }
  }

  // Spokes, plus a short vertical strut at each outer anchor so the ring has
  // visible thickness when the camera is near its plane.
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const outer = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
    const inner = new THREE.Vector3(Math.cos(a) * r * 1.6, 0, Math.sin(a) * r * 1.6);
    pairs.push(outer.clone(), inner.clone());
    pairs.push(
      outer.clone().setY(-0.07),
      outer.clone().setY(0.07),
    );
  }

  const hub = new THREE.OctahedronGeometry(r, 0);
  const hubEdges = new THREE.EdgesGeometry(hub, 1);
  const hubPos = hubEdges.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < hubPos.count; i++) {
    pairs.push(new THREE.Vector3().fromBufferAttribute(hubPos, i));
  }

  const edges = segments(pairs);
  hub.dispose();
  hubEdges.dispose();

  return { hull: null, edges, nodes: uniqueVertices(edges), extent: R };
}

/* ── truss ──────────────────────────────────────────────────────────────────
 * An octahedral lattice beam. Repetition with a clear rhythm — the form for
 * pages about building and iterating.
 */
function truss(cells = 4): Form {
  const pairs: THREE.Vector3[] = [];
  const w = 0.26;
  const step = 0.42;
  const y0 = -((cells * step) / 2);

  const square = (y: number) => [
    new THREE.Vector3(-w, y, -w),
    new THREE.Vector3(w, y, -w),
    new THREE.Vector3(w, y, w),
    new THREE.Vector3(-w, y, w),
  ];

  for (let c = 0; c <= cells; c++) {
    const y = y0 + c * step;
    const ring = square(y);

    // Bay square.
    for (let i = 0; i < 4; i++) pairs.push(ring[i], ring[(i + 1) % 4]);

    if (c === cells) break;
    const next = square(y + step);

    // Longerons and alternating diagonals — the alternation is what stops a
    // lattice from reading as a plain extruded box.
    for (let i = 0; i < 4; i++) {
      pairs.push(ring[i], next[i]);
      const d = (c + i) % 2 === 0 ? (i + 1) % 4 : (i + 3) % 4;
      pairs.push(ring[i], next[d]);
    }
  }

  const edges = segments(pairs);
  return { hull: null, edges, nodes: uniqueVertices(edges), extent: (cells * step) / 2 };
}

/* ── satellite ──────────────────────────────────────────────────────────────
 * Bus, two panel wings, a dish and an antenna mast. The most literal form in
 * the set; used where the page is about something shipped and operating.
 */
function satellite(): Form {
  const pairs: THREE.Vector3[] = [];

  const box = new THREE.BoxGeometry(0.42, 0.5, 0.42);
  const boxEdges = new THREE.EdgesGeometry(box, 1);
  const bp = boxEdges.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < bp.count; i++) {
    pairs.push(new THREE.Vector3().fromBufferAttribute(bp, i));
  }

  // Panel wings: a frame plus internal cell divisions, mirrored either side.
  for (const dir of [-1, 1]) {
    const x0 = dir * 0.24;
    const x1 = dir * 1.15;
    const yT = 0.22;
    const yB = -0.22;

    pairs.push(new THREE.Vector3(x0, yT, 0), new THREE.Vector3(x1, yT, 0));
    pairs.push(new THREE.Vector3(x0, yB, 0), new THREE.Vector3(x1, yB, 0));
    pairs.push(new THREE.Vector3(x1, yT, 0), new THREE.Vector3(x1, yB, 0));
    pairs.push(new THREE.Vector3(x0, yT, 0), new THREE.Vector3(x0, yB, 0));

    for (let i = 1; i < 5; i++) {
      const x = x0 + (x1 - x0) * (i / 5);
      pairs.push(new THREE.Vector3(x, yT, 0), new THREE.Vector3(x, yB, 0));
    }
  }

  // Dish: a ring plus a feed strut, tilted off the bus.
  const dishR = 0.2;
  const dishY = 0.38;
  const segs = 20;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    pairs.push(
      new THREE.Vector3(Math.cos(a0) * dishR, dishY, Math.sin(a0) * dishR * 0.55),
      new THREE.Vector3(Math.cos(a1) * dishR, dishY, Math.sin(a1) * dishR * 0.55),
    );
  }
  pairs.push(new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, dishY, 0));
  pairs.push(new THREE.Vector3(0, dishY, 0), new THREE.Vector3(0, dishY + 0.18, 0));

  const edges = segments(pairs);
  box.dispose();
  boxEdges.dispose();

  return { hull: null, edges, nodes: uniqueVertices(edges), extent: 1.15 };
}

/* ── probe ──────────────────────────────────────────────────────────────────
 * An octahedral core on four struts with instrument tips. Small, sparse,
 * asymmetric — the form for exploratory pages.
 */
function probe(): Form {
  const pairs: THREE.Vector3[] = [];

  const core = new THREE.OctahedronGeometry(0.3, 0);
  const coreEdges = new THREE.EdgesGeometry(core, 1);
  const cp = coreEdges.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) {
    pairs.push(new THREE.Vector3().fromBufferAttribute(cp, i));
  }

  const arms: [number, number, number][] = [
    [1, 0.35, 0.2],
    [-0.85, 0.15, 0.6],
    [0.25, -0.9, -0.5],
    [-0.4, 0.7, -0.85],
  ];

  for (const [x, y, z] of arms) {
    const tip = new THREE.Vector3(x, y, z);
    const base = tip.clone().normalize().multiplyScalar(0.3);
    pairs.push(base, tip.clone());

    // A small cross at each tip so the arm terminates in an instrument
    // rather than just stopping.
    const t = 0.07;
    pairs.push(tip.clone().add(new THREE.Vector3(-t, 0, 0)), tip.clone().add(new THREE.Vector3(t, 0, 0)));
    pairs.push(tip.clone().add(new THREE.Vector3(0, -t, 0)), tip.clone().add(new THREE.Vector3(0, t, 0)));
  }

  const edges = segments(pairs);
  core.dispose();
  coreEdges.dispose();

  return { hull: null, edges, nodes: uniqueVertices(edges), extent: 1.1 };
}

/* ── crystal ────────────────────────────────────────────────────────────────
 * A seeded icosahedron with each vertex displaced along its own radius. Same
 * seed always yields the same solid, so it works as a per-item identity.
 */
function crystal(seed: string): Form {
  const rand = rng(hash(seed));
  const geo = new THREE.IcosahedronGeometry(0.85, 1);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;

  // Keyed by rounded coordinate so shared vertices move together — displacing
  // raw indices tears the faces apart.
  const moved = new Map<string, number>();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
    let k = moved.get(key);
    if (k === undefined) {
      k = 0.85 + (rand() - 0.5) * 0.5;
      moved.set(key, k);
    }
    v.setLength(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  return {
    hull: geo,
    edges: new THREE.EdgesGeometry(geo, 1),
    nodes: uniqueVertices(geo),
    extent: 1.1,
  };
}

/** Builds a form by name. Callers should memoise and dispose. */
export function buildForm(name: FormName, seed = "space-os"): Form {
  switch (name) {
    case "station":
      return station();
    case "truss":
      return truss();
    case "satellite":
      return satellite();
    case "probe":
      return probe();
    case "crystal":
      return crystal(seed);
    case "planet":
    default:
      return planet();
  }
}

/** Releases every buffer a form owns. */
export function disposeForm(form: Form) {
  form.hull?.dispose();
  form.edges.dispose();
}
