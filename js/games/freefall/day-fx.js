// FREEFALL — THE DAY LOOK's SHADER PIECES (F3 — docs/freefall.md "THE DAY LOOK"; night.js builds the ONE scene both looks share, night-fx.js (→ §1, docs/freefall.md MODULE NOTES)

/** THE CAUSTICS (the shader's own — ff-caustics.png is not used): the bright net where ripples of light cross, moving */
export const CAUST = /* glsl */`
float caust1(vec2 p, float t) {
  vec2 q = p + 0.35 * vec2(sin(p.y * 1.7 + t * 0.9), cos(p.x * 1.9 - t * 0.8));
  float a = sin(q.x * 3.1 + t) + sin(q.y * 2.7 - t * 1.2) + sin((q.x + q.y) * 2.2 + t * 0.7) + sin((q.x - q.y) * 2.9 - t * 0.5);
  return pow(clamp(1.0 - abs(a) * 0.5, 0.0, 1.0), 5.0);
}
float caust(vec2 p, float t) { return caust1(p, t) + 0.6 * caust1(p * 1.73 + 3.1, t * 1.31 + 2.0); }`;

/** soft noise for the clouds, the storm, the sun rays (needs the wall shader's own `hash`) */
export const NOISE = /* glsl */`
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { return vnoise(p) * 0.55 + vnoise(p * 2.1 + 7.3) * 0.3 + vnoise(p * 4.3 + 1.7) * 0.15; }`;

/** (THE ROOFTOP BY DAY is the panorama layer's — night-fx.js SKY_F.) An area's DAY WALL:
 *  its painting, tinted — THE DEEP adds a sunken wreck's warm lamps (a few warm lights on the wall, breathing). */
export const DAY_WALLS = /* glsl */`
vec3 skyDay(vec3 d) { return vec3(0.62, 0.84, 0.98); }   // (the rooftop's day sky is the full-resolution panorama layer's — night-fx.js SKY_F; this is only the ground under it)
vec3 wallDay(sampler2D t, float have, float flip, vec3 tint, vec2 uv, float area) {
  vec3 w = pow(texture2D(t, vec2(uv.x, mix(uv.y, 1.0 - uv.y, flip))).rgb, vec3(2.2));
  vec3 c = mix(tint * 0.3, w * tint, have);
  if (area > 3.5) {
    // (F5B — the fresh-eyes review's "tan slab with a hard slanted edge" top-right at the finish: a lamp sits up to 0.25 from its cell's
    //  edge, and its glow was drawn in ITS cell only — sliced flat at the border. Now the 4 nearest cells each add their lamp: the same
    //  lamps, never cut; a lamp two cells away is under 1e-5)
    vec2 g = uv * 3.0, base = floor(g - 0.5);
    for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
      vec2 cell = base + vec2(float(i), float(j)), f = g - cell - 0.5;
      float h = hash(cell + 11.0);
      vec2 o = (vec2(hash(cell + 3.7), hash(cell + 9.1)) - 0.5) * 0.5;
      c += vec3(1.0, 0.5, 0.14) * step(0.7, h) * exp(-dot(f - o, f - o) * 24.0) * (0.75 + 0.25 * sin(uTime * (0.7 + h) + h * 40.0)) * 1.5;
    }
  }
  return c;
}`;

/** the wall shader's DAY half (inside its main: `d` the ray, `on` it met the wall, `hit` where, `uv` the wall's own coordinates, `k` 0 = wall A … 1 = wall B below the seam) */
export const DAY_MAIN = /* glsl */`
    vec3 fogC = mix(uFogA, uFogB, k);
    if (on) {
      vec3 A = uSkyA > 0.5 ? skyDay(d) : wallDay(tA, uHaveA, uFlipA, uTintA, uv * uTileA, uAreaA);
      vec3 B = uSkyB > 0.5 ? skyDay(d) : wallDay(tB, uHaveB, uFlipB, uTintB, uv * uTileB, uAreaB);
      col = mix(A, B, k);
      float wall = mix(1.0 - uSkyA, 1.0 - uSkyB, k);
      col *= mix(1.0, mix(1.0, 0.62, smoothstep(0.35, 1.0, abs(hit.x) / uRW)), wall);   // (a round room: its wall darker towards its edges — never the open sky)
      // UNDER THE HARBOR (the owner's ff-day.png): the water's own gradient down the screen — #7fe3ea · #2bb5c9 · #0b6b8f · #063a5c
      float wet = mix(uWetA, uWetB, k);
      if (wet > 0.01) {
        float sy = vS.y * 0.5 + 0.5;
        vec3 g = mix(vec3(0.0018, 0.042, 0.107), vec3(0.0033, 0.147, 0.275), smoothstep(0.0, 0.34, sy));
        g = mix(g, vec3(0.0242, 0.462, 0.584), smoothstep(0.3, 0.68, sy));
        g = mix(g, vec3(0.212, 0.768, 0.823), smoothstep(0.64, 1.0, sy));
        vec3 wcol = mix(g, col, 0.4);
        // THE SUN RAYS from the surface: shafts of light slanting down the water — they stand in the WORLD (the ball falls past them) and drift
        float shallow = exp(-max(0.0, uSurfY - hit.y) / 30.0);
        float ru = atan(hit.x, -hit.z) * 3.2 + hit.y * 0.16;
        float rays = pow(vnoise(vec2(ru * 2.2 + uTime * 0.07, 1.3)) * 0.6 + vnoise(vec2(ru * 5.1 - uTime * 0.11, 7.7)) * 0.4, 2.2);
        wcol += vec3(0.75, 1.0, 0.95) * rays * (0.25 + 0.75 * sy) * 0.55 * shallow * uShafts;   // (F3B: the shafts fade in after the plunge)
        // … and THE CAUSTICS on the wall
        wcol += vec3(0.7, 1.0, 0.95) * caust(uv * 20.0, uTime) * 0.2 * shallow;
        col = mix(col, wcol, wet);
      }
    } else {
      col = uSkyA > 0.5 ? skyDay(d) : fogC;
    }
    // the haze the tower fades into below (the area's own: pale air · dusty amber · deep water)
    col = mix(col, fogC, smoothstep(5.0, 16.0, uBallY - hitY) * 0.8);
    // THE DARKNESS BY DAY — the same line, the same timing, another look: THE STORM CLOUD (the rooftop) · the lights out (indoors) ·
    // THE MURK (under the water). It rolls; the wall only — never the ball or its floor.
    float lit = smoothstep(uDarkY + 0.9, uDarkY - 0.25, hitY);
    vec3 dk = mix(uDarkA, uDarkB, k);
    float roll = fbm(vec2(atan(hit.x, -hit.z) * 3.0 + uTime * 0.05, hitY * 0.6 - uTime * 0.03));
    col = mix(dk * (0.65 + 0.7 * roll), col, lit);
    col = mix(col, dk * 0.5, exp(-pow((hitY - uDarkY - 0.3) / 0.24, 2.0)) * 0.55);`;

/** a slice's DAY half (inside the slice shader's main): FROSTED GLASS in its area's own PASTEL colour (vC = the palette's `day`; vR its
 *  `dayRim`), cyan-white seams, a rim in a brighter version of the colour; RED = the same red, the same chevrons + pulse; under the ball the tower fades into the
 *  area's haze and thins; UNDER THE HARBOR the caustics run over it */
export const DAY_SLICE = /* glsl */`
    // CLEARLY COLOURED (the owner, Nov 26 — never near-white ice everywhere): the face IS the area's pastel (vC), white only in the frost
    // (a milky bloom toward the rim), the highlights + the seams; the rim = a brighter version of the area's colour (vR)
    vec3 tint = vC.rgb, ice = tint, rimC = vR;
    float zb = 1.0 - smoothstep(-0.3, 0.3, vW.y - uFogSeam);   // (F4A — this slice lies under the border in sight: its own area's haze + caustics)
    if (face < 0.5) {
      float rim = 1.0 - smoothstep(0.022 - aa, 0.022 + aa, dOut), cut = 1.0 - smoothstep(0.0, 0.014 + aas, dSide);
      col = tint * (0.9 + 0.1 * rad);
      col = mix(col, vec3(1.0), exp(-dOut / 0.07) * 0.26);                      // the frost toward the rim
      // the seams: cyan-white on a coloured face — on PEARL (F3B: UNDER THE HARBOR's near-white glass) the rim's own bright cyan, so they read
      float pale = smoothstep(0.5, 0.62, min(tint.r, min(tint.g, tint.b)));
      col = mix(col, mix(vec3(0.9, 0.98, 1.0), rimC * 0.92, pale), cut * 0.8);
      col = mix(col, rimC, rim);                                                 // the rim: the area's colour, brighter
      col = mix(col, vec3(1.0), (1.0 - smoothstep(0.0, 0.006 + aa, abs(dOut - 0.03))) * 0.55);   // … a white highlight along its inside
      col *= 0.92 + 0.08 * smoothstep(0.0, 0.16, rad);
      if (red > 0.5) {
        float pulse = 0.9 + 0.1 * sin(uTime * 3.1 + vW.y * 2.0);
        float cx = rad * 2.6 - abs(ang) * 0.9 + 0.15, cw = fwidth(cx) * 1.2 + 1e-4, cf = abs(fract(cx) - 0.75) - 0.24;
        float chev = 1.0 - smoothstep(-cw, cw, cf);
        col = mix(RED * 0.92, RED_DARK * 1.3, chev * 0.84) * (0.86 + 0.2 * rad) * pulse;
        col *= 1.0 - 0.4 * cut;
        float edge = 1.0 - smoothstep(0.022 - aas, 0.022 + aas, min(dSide, min(dOut, rad * uRing)));
        col = mix(col, vec3(1.0, 0.72, 0.72), edge * step(1.5, vKind) * 0.9);
        col = mix(col, vec3(1.0, 0.3, 0.34), rim);
      }
      float warn = vF.y * (0.55 + 0.45 * sin(uTime * 12.0));
      float hx = rad * 2.6 - abs(ang) * 0.9 + 0.15, hatch = 1.0 - smoothstep(-fwidth(hx) * 1.2 - 1e-4, fwidth(hx) * 1.2 + 1e-4, abs(fract(hx) - 0.81) - 0.19);
      col = mix(col, RED, warn * (0.3 + 0.6 * hatch));
      if (vF.z > 0.5) {
        vec2 q = vec2(ang, rad * 2.0 - 1.0);
        float c1 = abs(q.y - 0.55 * q.x - 0.1 * sin(q.x * 9.0)), c2 = abs(q.y + 0.8 * q.x + 0.12 * sin(q.x * 7.0 + 1.0)), c3 = abs(q.x - 0.15 * sin(q.y * 8.0) + 0.1);
        col = mix(col, vec3(0.16, 0.0, 0.02), (1.0 - smoothstep(0.0, 0.07, min(c1, min(c2, c3)))) * 0.9);
      }
      // the ball's soft shadow on its own floor (by day the ball gives no pool of light)
      vec2 bd = vW.xz - vec2(0.0, 0.66);
      col *= 1.0 - 0.24 * exp(-dot(bd, bd) / 0.045) * smoothstep(1.2, 0.0, depth) * (1.0 - red);
      float caK = mix(uCaust, uCaustB, zb);
      if (caK > 0.001) col += vec3(0.75, 1.0, 0.95) * caust(vW.xz * 3.2 + vW.y, uTime) * 0.12 * caK * (1.0 - red * 0.6);   // (F3B — the owner: the ripples stay ON THE WATER; the slices keep only a faint shimmer — it was 0.5)
    } else if (face < 1.5) {
      float topEdge = 1.0 - smoothstep(0.012, 0.03, vE.w * 0.2);
      col = tint * mix(0.78, 0.5, vE.w);   // (its wall: the same colour, in shade)
      if (red > 0.5) { float sx = ang * 1.5 + vE.w * 0.5, sw = fwidth(sx) * 1.2 + 1e-4, chev = 1.0 - smoothstep(-sw, sw, abs(fract(sx) - 0.75) - 0.25); col = mix(RED * 0.7, RED_DARK * 1.3, chev * 0.6); }
      col = mix(col, red > 0.5 ? vec3(1.0, 0.3, 0.34) : mix(rimC, vec3(1.0), 0.3), topEdge * 0.9);
    } else {
      col = tint * 0.52;
      if (red > 0.5) col = RED * 0.45;
    }
    // (uFogK — F3B: the haze's strength by area; THE ROOFTOP has almost none — NO fog wash over the roof below)
    // (F4A — THE HAZE FOLLOWS THE FLOOR: zb = this slice lies under the border in sight — its own area's haze, never the one above's eased over a second)
    // (F5A's add-on — THE DAY OFFICES FOG: the area's haze STARTS fs of the way down — night.js#FOG_START; 0 everywhere but THE OFFICES)
    float fogK = mix(uFogK, uFogKB, zb), fs = mix(uFogS, uFogSB, zb), hz = clamp((far - fs) / (1.0 - fs), 0.0, 1.0);
    col = mix(col, mix(uFog, uFogB, zb), hz * 0.62 * fogK);
    alpha *= mix(1.0, mix(1.0, 0.62, smoothstep(0.35, 1.0, hz)), fogK);
    col = mix(col, vec3(1.0, 0.36, 0.7), clamp(vF.x, 0.0, 1.0) * (face < 0.5 ? 0.5 : 0.2));   // (a landing's flash: the ball's own pink on the ice)
    if (uBloom > 0.5) col = vec3(0.0);`;

/** THE MOTES (a FIXED pool of small quads — the tiers trim how many are drawn, never the pool): UNDER THE HARBOR's rising BUBBLES ·
 *  THE DEEP's drifting particles · the dust in a sunlit room. A mote = (its angle round the shaft, its height's phase, how far out, a
 *  seed): its place is a pure function of the time — it stands in the WORLD (wrapped into a window round the camera), never on the
 *  screen; none in the sector in front of the ball. uKind: 1 a bubble (a bright ring, a highlight) · 2 a soft dot. */
export const MOTE_V = /* glsl */`
attribute vec4 aS;
uniform float uTime, uBaseY, uSpan, uSpeed, uSize;
varying vec2 vQ; varying float vSeed;
void main() {
  float seed = aS.w, a = (0.17 + aS.x * 0.66) * 6.2832 + sin(uTime * 0.21 + seed * 30.0) * 0.1;
  float r = mix(1.14, 2.45, aS.z);
  float y = uBaseY + mod(aS.y * uSpan + uSpeed * (0.6 + 0.8 * seed) * uTime - uBaseY, uSpan);
  vec3 p = vec3(sin(a) * r + sin(uTime * 1.1 + seed * 50.0) * 0.05, y, cos(a) * r);
  vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.0);
  c.xy += position.xy * 2.0 * uSize * (0.5 + fract(seed * 7.13)) * vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
  gl_Position = c; vQ = position.xy * 2.0; vSeed = seed;
}`;
export const MOTE_F = /* glsl */`
uniform float uKind, uAlpha, uBloom;
uniform vec3 uCol;
varying vec2 vQ; varying float vSeed;
void main() {
  float r = length(vQ), a;
  if (uKind < 1.5) {
    vec2 hl = vQ - vec2(-0.34, 0.36);
    a = smoothstep(1.0, 0.88, r) * (0.14 + 0.86 * smoothstep(0.6, 0.86, r)) + exp(-dot(hl, hl) * 30.0) * 0.9;
  } else a = exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r));
  a = min(1.0, a) * uAlpha * (0.55 + 0.45 * fract(vSeed * 3.7)) * (1.0 - uBloom);
  gl_FragColor = vec4(uCol * a, a * 0.85);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
