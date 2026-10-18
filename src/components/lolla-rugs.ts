import * as THREE from "three";

// The source GLB merges rugs and seating into FURNITURE_ANIMATED.
// Bounds measured from its six circular rug surfaces (model units).
const RUGS = [
  { x: -3.4499, z: -6.5785, radius: 1.22, bottom: 1.3742, top: 1.3882 },
  { x: 3.5814, z: -6.5785, radius: 1.22, bottom: 1.3742, top: 1.3882 },
  { x: -8.1385, z: 3.6731, radius: 1.22, bottom: 0.7107, top: 0.7246 },
  { x: 2.1201, z: 4.4449, radius: 1.22, bottom: 0.7107, top: 0.7246 },
  { x: -1.6682, z: 3.5996, radius: 1.525, bottom: 0.7157, top: 0.7335 },
  { x: 7.9022, z: 3.7472, radius: 1.525, bottom: 0.7157, top: 0.7335 },
];

/** Assign rug triangles a separate material without altering the source asset. */
export function assignLollaRugs(geometry: THREE.BufferGeometry): boolean {
  const index = geometry.index;
  const position = geometry.getAttribute("position");
  if (!index || !position) return false;
  const furniture: number[] = [];
  const rugs: number[] = [];
  const tolerance = 0.0005;
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    const isRug = RUGS.some((rug) => {
      let onTop = true, onBottom = true, onRim = true;
      for (const vertex of [a, b, c]) {
        const y = position.getY(vertex);
        if (y < rug.bottom - tolerance || y > rug.top + tolerance) return false;
        const dx = position.getX(vertex) - rug.x;
        const dz = position.getZ(vertex) - rug.z;
        const radiusSquared = dx * dx + dz * dz;
        if (radiusSquared > (rug.radius + tolerance) ** 2) return false;
        onTop &&= Math.abs(y - rug.top) <= tolerance;
        onBottom &&= Math.abs(y - rug.bottom) <= tolerance;
        onRim &&= radiusSquared >= (rug.radius - 0.003) ** 2;
      }
      // Include the thin rim while excluding furniture feet inside the rug.
      return onTop || onBottom || onRim;
    });
    (isRug ? rugs : furniture).push(a, b, c);
  }
  if (!rugs.length) return false;
  geometry.setIndex(furniture.concat(rugs));
  geometry.clearGroups();
  geometry.addGroup(0, furniture.length, 0);
  geometry.addGroup(furniture.length, rugs.length, 1);
  return true;
}
