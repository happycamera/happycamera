import {
  resolveCropRect,
  scaleToMax,
  isHeicLike,
  CROP_ASPECT,
} from "../components/ui/cropMath";
import type { Rect } from "../components/ui/cropMath";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ok - ${msg}`);
}

function expectRect(rect: Rect, expected: { x?: number; y?: number; width?: number; height?: number }, label: string) {
  for (const key of ["x", "y", "width", "height"] as const) {
    if (expected[key] !== undefined) {
      assert(
        Math.abs(rect[key] - expected[key]!) <= 1,
        `${label}: ${key} = ${rect[key]}, expected ~${expected[key]}`
      );
    }
  }
}

function expectClean4to3(rect: Rect, imageW: number, imageH: number, label: string) {
  const aspect = rect.width / rect.height;
  assert(
    Math.abs(aspect - CROP_ASPECT) <= 0.005,
    `${label}: aspect ${aspect.toFixed(4)} ~ 4/3`
  );
  assert(rect.x >= 0 && rect.y >= 0, `${label}: origin non-negative`);
  assert(
    rect.x + rect.width <= imageW + 1 &&
      rect.y + rect.height <= imageH + 1,
    `${label}: rect inside image bounds`
  );
  assert(rect.width <= imageW && rect.height <= imageH, `${label}: rect fits image`);
}

console.log("resolveCropRect — long-axis trimmed, always clean 4:3, never white-bars/no-stretch regions");

console.log("PORTRAIT 600x1200 (the bug case) — default top-start clamp crop {0,0,600,450}:");
expectClean4to3(resolveCropRect({ x: 0, y: 0, width: 600, height: 450 }, 600, 1200), 600, 1200, "portrait");
const p = resolveCropRect({ x: 0, y: 0, width: 600, height: 450 }, 600, 1200);
expectRect(p, { x: 0, y: 375, width: 600, height: 450 }, "portrait");
assert(Math.abs(p.x - 0) <= 1 && Math.abs(p.width - 600) <= 1, "portrait uses full width");

console.log("LANDSCAPE 1600x1000 — zoom-1 crop overflows vertically {240,0,1440,1080}:");
const l = resolveCropRect({ x: 240, y: 0, width: 1440, height: 1080 }, 1600, 1000);
expectClean4to3(l, 1600, 1000, "landscape");
expectRect(l, { x: 133, y: 0, width: 1333, height: 1000 }, "landscape");

console.log("LANDSCAPE 1600x1000 — user-zoomed crop strictly inside {200,120,1064,798} is preserved:");
const l2 = resolveCropRect({ x: 200, y: 120, width: 1064, height: 798 }, 1600, 1000);
expectRect(l2, { x: 200, y: 120, width: 1064, height: 798 }, "landscape-zoom");

console.log("SQUARE 1200x1200 — full-width clamp {0,0,1200,900}:");
const s = resolveCropRect({ x: 0, y: 0, width: 1200, height: 900 }, 1200, 1200);
expectClean4to3(s, 1200, 1200, "square");
expectRect(s, { x: 0, y: 150, width: 1200, height: 900 }, "square");

console.log("EXACT 4:3 1200x900 full image {0,0,1200,900}:");
const e = resolveCropRect({ x: 0, y: 0, width: 1200, height: 900 }, 1200, 900);
expectClean4to3(e, 1200, 900, "exact");
expectRect(e, { x: 0, y: 0, width: 1200, height: 900 }, "exact");

console.log("EXTREME WIDE 2000x200 (panorama):");
const w = resolveCropRect({ x: 0, y: 0, width: 2000, height: 200 }, 2000, 200);
expectClean4to3(w, 2000, 200, "panorama");

console.log("scaleToMax:");
const sc1 = scaleToMax(6000, 4000, 2400);
assert(sc1.width === 2400 && sc1.height === 1600, `6000x4000 -> ${sc1.width}x${sc1.height}`);
const sc2 = scaleToMax(1200, 900, 2400);
assert(sc2.width === 1200 && sc2.height === 900, "1200x900 unchanged under 2400");

console.log("isHeicLike:");
assert(isHeicLike({ type: "image/heic", name: "a.heic" }), "type image/heic");
assert(isHeicLike({ type: "image/heif", name: "a.heif" }), "type image/heif");
assert(isHeicLike({ type: "", name: "photo.HEIC" }), ".HEIC extension uppercase");
assert(!isHeicLike({ type: "image/jpeg", name: "a.jpg" }), "jpeg not heic");

console.log("\nALL CROP MATH TESTS PASSED");