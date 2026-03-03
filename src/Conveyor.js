// conveyor.js  –  drop into any Kaplay project
// Usage:
//   import { conveyor } from "./conveyor.js";
//
//   add([
//     pos(100, 200),           // left roller centre, via Kaplay pos()
//     conveyor({
//       diameter:   60,
//       length:     400,
//       thickness:  10,
//       dashLength: 20,
//       gapLength:  20,
//       speed:      80,        // px per second, negative = leftward
//       beltColor:  rgb(200, 168, 75),
//       rollerColor: rgb(120, 120, 154),
//     }),
//   ]);

export function conveyor({
  diameter    = 60,
  length      = 400,
  thickness   = 10,
  dashLength  = 20,
  gapLength   = 20,
  speed       = 80,          // px/sec — positive: rightward, negative: leftward
  beltColor   = rgb(200, 168, 75),
  rollerColor = rgb(120, 120, 154),
  rollerCallback = null
} = {}) {

  // Internal state
  let offset = 0;

  // ── Geometry helpers ────────────────────────────────────────────────────────

  const totalLength = () => 2 * length + Math.PI * diameter;
  const radius      = () => diameter / 2;

  /**
   * Map a scalar distance `s` around the belt loop to a vec2 point.
   * Origin is the left roller centre (supplied by the pos() component).
   * Path: top-straight → right-semicircle → bottom-straight → left-semicircle
   */
  function posAt(s) {
    const r        = radius();
    const halfCirc = Math.PI * r;
    const total    = totalLength();

    s = ((s % total) + total) % total;

    if (s <= length) {
      return vec2(s, -r);
    }
    s -= length;

    if (s <= halfCirc) {
      const a = -Math.PI / 2 + s / r;
      return vec2(length + r * Math.cos(a), r * Math.sin(a));
    }
    s -= halfCirc;

    if (s <= length) {
      return vec2(length - s, r);
    }
    s -= length;

    const a = Math.PI / 2 + s / r;
    return vec2(r * Math.cos(a), r * Math.sin(a));
  }

  // ── Component definition ────────────────────────────────────────────────────

  return {
    id: "conveyor",

    // Expose properties so the game can tweak them at runtime:
    //   beltObj.speed      = -120;   // reverse
    //   beltObj.dashLength = 40;
    get speed()      { return speed; },
    set speed(v)     { speed = v; },
    get dashLength() { return dashLength; },
    set dashLength(v){ dashLength = v; },
    get gapLength()  { return gapLength; },
    set gapLength(v) { gapLength = v; },
    get thickness()  { return thickness; },
    set thickness(v) { thickness = v; },
    get diameter()   { return diameter; },
    get length()     { return length; },

    // Called every frame — advance the belt offset
    update() {
      const total = totalLength();
      offset = (((offset + speed * dt()) % total) + total) % total;
    },

    // Called every frame after update — draw everything using Kaplay's API
    draw() {
      const r      = radius();
      const total  = totalLength();
      const patLen = dashLength + gapLength;
      const STEP   = 1.5;

      if(rollerCallback == null)
      {
        // ── Rollers ─────────────────────────────────────────────────────────────
        // Left roller
        drawCircle({
          pos:     vec2(0, 0),
          radius:  r,
          color:   rollerColor,
          outline: { color: rgb(170, 170, 170), width: 3 },
        });
        // Left axle dot
        drawCircle({
          pos:    vec2(0, 0),
          radius: r * 0.13,
          color:  rgb(30, 30, 30),
        });

        // Right roller
        drawCircle({
          pos:     vec2(length, 0),
          radius:  r,
          color:   rollerColor,
          outline: { color: rgb(170, 170, 170), width: 3 },
        });
        // Right axle dot
        drawCircle({
          pos:    vec2(length, 0),
          radius: r * 0.13,
          color:  rgb(30, 30, 30),
        });
      }
      else
      {
        rollerCallback()
      }   

      // ── Belt dashes — one drawLines() call per dash ──────────────────────────
      // Kaplay doesn't support a single multi-subpath call like canvas 2D does,
      // so we call drawLines() once per dash. The number of dashes is small
      // (typically 6–12) so this is fine.
      let phase = offset % patLen;
      let s     = 0;

      while (s < total) {
        if (phase < dashLength) {
          const canDraw = Math.min(dashLength - phase, total - s);

          if (canDraw > 0.5) {
            // Build the point array for this dash
            const pts = [];
            for (let t = s; t < s + canDraw; t += STEP) {
              pts.push(posAt(t));
            }
            pts.push(posAt(s + canDraw));

            drawLines({
              pts,
              width: thickness,
              color: beltColor,
            });
          }

          s     += canDraw;
          phase += canDraw;
        } else {
          const canSkip = Math.min(patLen - phase, total - s);
          s     += canSkip;
          phase += canSkip;
        }

        if (phase >= patLen) phase -= patLen;
      }
    },

    // Optional: expose a bounding box so area() / collision can work with it
    inspect() {
      return `conveyor(${length}×${diameter})`;
    },
  };
}