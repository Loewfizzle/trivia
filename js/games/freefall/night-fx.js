// FREEFALL — THE SCENE's SHADERS + THE BLOOM (F2: THE NIGHT LOOK · F3: every material reads `uDay` and takes its day half from day-fx.js — (→ §1, docs/freefall.md MODULE NOTES)
import * as THREE from 'three';
import { CAUST, NOISE, DAY_WALLS, DAY_MAIN, DAY_SLICE } from './day-fx.js';

// ---- THE BLAZE = NEON FIRE (the F2 add-on — the owner, Nov 26): a WHITE core → YELLOW → ORANGE → NEON PINK outer flame (synthwave
// fire). ONE ramp for everything that burns (the flame sprites, the ribbon, the ball, the shockwave): `heat` 1 = white-hot … 0 = out.
// The white-yellow heart is the brightest thing on the screen (it reads with the colour removed); pink is only the outer edge.
export const FIRE_RAMP = /* glsl */`
vec3 fire(float h) {
  vec3 c = mix(vec3(1.0, 0.07, 0.6), vec3(1.0, 0.36, 0.04), smoothstep(0.08, 0.26, h));  // neon pink → orange
  c = mix(c, vec3(1.0, 0.84, 0.16), smoothstep(0.42, 0.62, h));                            // → yellow
  return mix(c, vec3(1.0, 1.0, 0.92), smoothstep(0.74, 0.95, h));                           // → white
}`;

// ---- THE SHAFT (the backdrop — drawn into a HALF-RES target, then copied up: a wall is soft by nature). A screen-filling quad: each (→ §2, docs/freefall.md MODULE NOTES)
export const WALL_V = /* glsl */`
varying vec2 vS;
void main() { vS = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
export const WALL_F = /* glsl */`
uniform sampler2D tA, tB;
uniform vec3 uCam, uRight, uUp, uFwd, uTintA, uTintB;
uniform float uTan, uAspect, uHaveA, uHaveB, uFlipA, uFlipB, uSkyA, uSkyB, uSeamY, uBallY, uDarkY, uTime, uRW, uTileA, uTileB, uGlow;
// (F3 — THE DAY LOOK: day-fx.js) the look · each wall's area (tuning.js#AREAS' index) + whether it is under water · the surface's height ·
// the haze below + THE DARKNESS's colour, wall A + wall B
uniform float uDay, uAreaA, uAreaB, uWetA, uWetB, uSurfY;
// (F3B — THE BREAKTHROUGHS) the lights of the room below a broken skylight come on floor by floor from uLitY down, from uLitT on (−1000 = long
// since) · the light shafts under the harbor's surface fade in after the plunge (uShafts 0 … 1)
uniform float uLitT, uLitY, uShafts;
uniform vec3 uFogA, uFogB, uDarkA, uDarkB;
varying vec2 vS;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${NOISE}
${CAUST}
// THE ROOFTOP has no wall: its sky is FREEFALL's own panorama, drawn at FULL resolution by its own layer over this one (SKY_F, below — F3:
// the half-res pass made its windows blocks). Here the rooftop is only the flat ground that layer covers.
vec3 sky(vec3 d) { return vec3(0.012, 0.004, 0.035); }
vec3 wallTex(sampler2D t, float have, float flip, vec3 tint, vec2 uv) {
  vec3 w = texture2D(t, vec2(uv.x, mix(uv.y, 1.0 - uv.y, flip))).rgb;
  w = pow(w, vec3(2.2));
  return mix(vec3(0.012, 0.006, 0.03), w * tint, have);
}
${DAY_WALLS}
void main() {
  vec3 d = normalize(uFwd + uRight * (vS.x * uTan * uAspect) + uUp * (vS.y * uTan));
  // the far face of the wall's cylinder (x² + z² = RW²)
  float a = dot(d.xz, d.xz), b = dot(uCam.xz, d.xz), cc = dot(uCam.xz, uCam.xz) - uRW * uRW, disc = b * b - a * cc;
  bool on = disc > 0.0 && a > 1e-6;
  vec3 col, hit = uCam + d * 40.0;
  vec2 uv = vec2(0.0);
  float k = 0.0;
  if (on) {
    hit = uCam + d * ((-b + sqrt(disc)) / a);
    // (the angle's own seam lies on the NEAR side — never seen through; on the far face it was a 1 px line from the top of the screen to the tower)
    uv = vec2(atan(hit.x, -hit.z) * 0.15915494, hit.y / (6.2831853 * uRW));   // (once round the shaft = 1; a wall repeats uTileA / uTileB times — THE DEEP's night wall fewer: its vents made a lattice)
    // (the seam between two areas lies at a world height: below it the next area's wall — it is seen rising from below)
    k = smoothstep(uSeamY + 1.6, uSeamY - 1.6, hit.y);
  }
  float hitY = hit.y;
  if (uDay > 0.5) {${DAY_MAIN}
  } else {
    if (on) {
      vec3 A = uSkyA > 0.5 ? sky(d) : wallTex(tA, uHaveA, uFlipA, uTintA, uv * uTileA);
      vec3 B = uSkyB > 0.5 ? sky(d) : wallTex(tB, uHaveB, uFlipB, uTintB, uv * uTileB);
      col = mix(A, B, k);
      // the wall curves away to the shaft's sides: darker towards its edges (a round room, not a flat picture)
      float side = abs(hit.x) / uRW;
      col *= mix(1.0, 0.42, smoothstep(0.35, 1.0, side));
      // F5B — THE WATER SWAP (the owner, Nov 27): UNDER THE HARBOR by NIGHT wears the DAY's water in night inks — its gradient down the
      // screen (a dark teal), the caustics' swirling light lines in cyan + violet, faint shafts from the surface (the motes: rising bubbles;
      // the plankton kept). The day's own recipe (day-fx.js DAY_MAIN), recoloured.
      float wetN = mix(uWetA, uWetB, k);
      if (wetN > 0.01) {
        float sy = vS.y * 0.5 + 0.5;
        vec3 g = mix(vec3(0.0008, 0.01, 0.02), vec3(0.002, 0.036, 0.055), smoothstep(0.0, 0.36, sy));   // (F5C: a touch lifted — the lines need a ground to read on)
        g = mix(g, vec3(0.004, 0.075, 0.1), smoothstep(0.32, 0.72, sy));
        g = mix(g, vec3(0.014, 0.15, 0.18), smoothstep(0.68, 1.0, sy));
        vec3 wcol = mix(g, col * vec3(0.5, 0.9, 1.0), 0.18);   // (the painting only a ghost under the night water)
        float shallow = exp(-max(0.0, uSurfY - hit.y) / 30.0);
        float ru = atan(hit.x, -hit.z) * 3.2 + hit.y * 0.16;
        float rays = pow(vnoise(vec2(ru * 2.2 + uTime * 0.07, 1.3)) * 0.6 + vnoise(vec2(ru * 5.1 - uTime * 0.11, 7.7)) * 0.4, 2.2);
        wcol += vec3(0.1, 0.3, 0.55) * rays * (0.25 + 0.75 * sy) * 0.3 * shallow * uShafts;
        // (F5C — the owner: F5B's lines were barely visible; now as clear as DAY UNDER's — the same net, a glow on the dark teal)
        wcol += vec3(0.08, 0.72, 0.92) * caust(uv * 20.0, uTime) * 0.3 * shallow;                        // the swirling light lines: cyan …
        wcol += vec3(0.42, 0.14, 1.0) * caust(uv * 13.0 + 2.3, uTime * 0.8 + 5.0) * 0.1 * shallow;      // … and a slower violet net under them
        col = mix(col, wcol, wetN);
      }
    } else {
      col = uSkyA > 0.5 ? sky(d) : vec3(0.004, 0.002, 0.012);
    }
    // THE GLOW FROM BELOW: pink at the shaft's foot, violet above it — it rises with the depth under the ball. EASED (the owner, Nov 26:
    // it washed every area into the same purple — uGlow 0.4, it was 0.85; it starts deeper): the walls show, each its own place
    float deep = uBallY - hitY;
    float fog = smoothstep(6.5, 17.0, deep);
    vec3 glow = mix(vec3(0.1, 0.02, 0.3), vec3(0.9, 0.1, 0.6), smoothstep(9.0, 19.0, deep));
    col = mix(col, glow, fog * uGlow);
    col += vec3(0.6, 0.05, 0.5) * pow(smoothstep(-0.35, -1.0, vS.y), 2.0) * 0.35 * uGlow;
    // (the top of the screen is the HUD's: the wall steps back behind the big number)
    col *= mix(1.0, 0.5, smoothstep(0.3, 1.0, vS.y));
    // F3B — UNDER THE HARBOR BY NIGHT: the speakeasy's neon falls through the surface — soft shafts of teal + pink light slanting down
    // the water, standing in the WORLD (the ball falls past them); they die with the depth and fade in after the plunge
    float wetN = mix(step(2.5, uAreaA) * step(uAreaA, 3.5), step(2.5, uAreaB) * step(uAreaB, 3.5), k);
    if (wetN > 0.01 && on) {
      float su = atan(hit.x, -hit.z) * 3.2 + hitY * 0.16;
      float sh = pow(vnoise(vec2(su * 2.2 + uTime * 0.06, 1.3)) * 0.6 + vnoise(vec2(su * 5.1 - uTime * 0.09, 7.7)) * 0.4, 2.4);
      col += mix(vec3(0.1, 0.75, 0.8), vec3(0.9, 0.2, 0.7), vnoise(vec2(su * 0.7, 3.0))) * sh * 0.5 * exp(-max(0.0, uSurfY - hitY) / 14.0) * step(hitY, uSurfY) * wetN * uShafts;
    }
    // THE DARKNESS: above its line the lights are out (a thin live edge where it stands) — the wall only; never the ball or its floor
    float lit = smoothstep(uDarkY + 0.9, uDarkY - 0.25, hitY);
    float edge = exp(-pow((hitY - uDarkY - 0.3) / 0.16, 2.0));
    col = col * mix(0.035, 1.0, lit) + vec3(0.55, 0.3, 1.0) * edge * 0.5 * (0.7 + 0.3 * sin(uTime * 9.0 + vS.x * 14.0));
  }
  // F3B — THE LIGHTS COME ON below a broken skylight: floor by floor from the roof down, each with a flicker as it catches
  if (uLitT > -900.0) {
    float below = uLitY - hitY, front = (uTime - uLitT) * 7.0 - below;
    float fl = floor(below), onK = clamp(front, 0.0, 1.0) * (front > 1.6 ? 1.0 : step(0.35, fract(sin(fl * 12.9898 + floor(uTime * 22.0) * 78.233) * 43758.5453)));
    col *= mix(1.0, mix(0.1, 1.0, onK), step(0.0, below));
  }
  // (written DISPLAY-READY into its half-res target — 8 bits of linear light would band in the dark; the copy up is a plain copy)
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(0.4545)), 1.0);
}`;
// ---- THE ROOFTOP's SKY = FREEFALL's OWN PANORAMA, AT FULL RESOLUTION (the add-on, Nov 26 — the owner: JAYWALK's skyline stretched round the (→ §3, docs/freefall.md MODULE NOTES)
export const SKY_V = 'varying vec2 vS; void main() { vS = position.xy; gl_Position = vec4(position.xy, 0.9998, 1.0); }';
export const SKY_F = /* glsl */`
uniform sampler2D tPano, tRoof, tCity, tGrain;
uniform vec3 uCam, uRight, uUp, uFwd, uDarkA;
uniform float uTan, uAspect, uHave, uFlip, uSeamY, uBallY, uDarkY, uTime, uRW, uRise, uShift, uDay, uBloom, uSpanAz, uSpanEl, uTopEl, uGlow;
// THE ROOF BELOW (F3B — the owner: the title screen + the first 40 floors can not be the weak spot): the building's own roof seen from
// high above, the skylight straight under the tower — the painting on a plane that leans toward the viewer (uGN its normal, uGV its
// AWAY axis, uGC its centre from the camera, uGK = uGC · uGN), uGW = painting widths a world unit: it RISES floor by floor (night.js
// scales it), the city round it (the painting's own borders, repeated mirrored) runs on to the horizon where the panorama stands. NO fog
// wash: only a light distance haze far out. uGA = how much of it is there (it goes when the skylight breaks) · uOpen = the skylight is
// open (the room below shows under the seam — until then the roof covers it)
uniform vec3 uGN, uGV, uGC;
uniform vec2 uRoof;
uniform float uGK, uGW, uGA, uGCurl, uOpen, uHaveR, uFlipR, uHaveC, uFlipC, uHaveG, uGrain;
varying vec2 vS;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${NOISE}
void main() {
  vec3 d = normalize(uFwd + uRight * (vS.x * uTan * uAspect) + uUp * (vS.y * uTan));
  float a = dot(d.xz, d.xz), b = dot(uCam.xz, d.xz), cc = dot(uCam.xz, uCam.xz) - uRW * uRW, disc = b * b - a * cc;
  float hitY = uCam.y + d.y * 40.0, k = 0.0;
  if (disc > 0.0 && a > 1e-6) { hitY = uCam.y + d.y * ((-b + sqrt(disc)) / a); k = smoothstep(uSeamY + 1.6, uSeamY - 1.6, hitY); }
  float az = atan(d.x, -d.z), el = asin(clamp(d.y, -1.0, 1.0));
  float v = (uTopEl + uRise - el) / uSpanEl, vc = clamp(v, 0.003, 0.997);
  vec3 p = pow(texture2D(tPano, vec2(az / uSpanAz + 0.5 + uShift, mix(1.0 - vc, vc, uFlip))).rgb, vec3(2.2));
  p.b = mix(p.b, max(p.b, p.r * 0.85), step(p.g, p.r * 0.5));   // (RED IS DANGER ONLY: a red light of the painting reads pink here)
  float lit = smoothstep(uDarkY + 0.9, uDarkY - 0.25, hitY);
  vec3 col;
  if (uDay > 0.5) {
    // (FIX A — THE GREY FLASH: until the painting lands, a soft gradient in its OWN colours — measured: the top · the bright middle · the skyline)
    p = mix(mix(mix(vec3(0.001, 0.179, 0.662), vec3(0.234, 0.666, 0.97), smoothstep(0.0, 0.5, v)), vec3(0.027, 0.081, 0.163), smoothstep(0.55, 0.95, v)), p, uHave);
    // under the painting's foot: the open air the tower stands in — a pale haze, soft clouds drifting through it
    col = mix(p, mix(vec3(0.6, 0.84, 0.98), vec3(0.86, 0.95, 1.0), smoothstep(1.0, 2.8, v)), smoothstep(0.88, 1.02, v));
    float cl = fbm(vec2(az * 1.6 + uTime * 0.012, v * 2.2 - uTime * 0.004));
    col = mix(col, vec3(1.0), smoothstep(0.5, 0.8, cl) * 0.6 * smoothstep(1.02, 1.6, v));
  } else {
    p = mix(mix(mix(vec3(0.0, 0.0, 0.011), vec3(0.008, 0.01, 0.14), smoothstep(0.0, 0.5, v)), vec3(0.013, 0.012, 0.075), smoothstep(0.55, 0.95, v)), p * 1.2, uHave);
    // under its foot: the dark roof; the glow from below (eased with the walls')
    col = mix(p, vec3(0.012, 0.004, 0.035), smoothstep(0.86, 1.02, v));
    float deep = uBallY - hitY;
    col = mix(col, mix(vec3(0.1, 0.02, 0.3), vec3(0.9, 0.1, 0.6), smoothstep(9.0, 19.0, deep)), smoothstep(6.5, 17.0, deep) * uGlow);
    col += vec3(0.6, 0.05, 0.5) * pow(smoothstep(-0.35, -1.0, vS.y), 2.0) * 0.35 * uGlow;
    col *= mix(1.0, 0.62, smoothstep(0.45, 1.0, vS.y));   // (the top of the screen is the HUD's: the sky steps back behind the big number)
  }
  // THE ROOF BELOW: the ray meets the leaning plane; the painting about its skylight, the city's tile beyond it
  float dn = dot(d, uGN);
  if (uGA > 0.001 && dn < -1e-4) {
    vec3 gp = d * (uGK / dn) - uGC;
    vec2 q = vec2(gp.x, dot(gp, uGV)) * uGW;                  // in painting widths: + x right, + y AWAY from the viewer
    float fy = max(0.0, q.y - 0.4);
    q.y += fy * fy * uGCurl;                                  // (past the roof's far edge the city runs off to the horizon faster)
    vec2 ru = vec2(uRoof.x + q.x, uRoof.y - q.y);             // the painting, measured from its top-left (its far side is its top)
    vec2 re = abs(ru - 0.5);
    float outside = smoothstep(0.455, 0.5, max(re.x, re.y));
    vec3 rf = pow(texture2D(tRoof, vec2(ru.x, mix(1.0 - ru.y, ru.y, uFlipR))).rgb, vec3(2.2));
    vec3 ct = pow(texture2D(tCity, vec2(ru.x * 2.0, mix(1.0 - ru.y * 2.0, ru.y * 2.0, uFlipC))).rgb, vec3(2.2));
    // (the tile is repeated MIRRORED: a second reading of it — turned, at another scale — takes over in soft patches, so no block of the
    //  city stands beside its own mirror image)
    vec3 ct2 = pow(texture2D(tCity, vec2(ru.y * 2.34 + 0.37, ru.x * 2.34 + 0.11)).rgb, vec3(2.2));
    ct = mix(ct, ct2, smoothstep(0.44, 0.56, vnoise(ru * 2.7 + 5.0)));
    vec3 flat_ = mix(vec3(0.016, 0.012, 0.04), vec3(0.027, 0.045, 0.075), uDay);   // (FIX A: the city's own mean by day — never a grey slab under the sky)
    // F5A — THE ROOF GRAIN (floors 36 – 39 by day looked soft: the painting was made at 1024 + enlarged): a fine concrete-grain DETAIL
    // tile laid over the roof as it comes close (uGrain) — two readings of it, a fine one + a coarser one turned (no tile shows), as light
    // + shade about the painting's own colour; its mipmaps let it go with distance. The same reading as the deck's (DECK_F): one roof.
    float gr = (texture2D(tGrain, ru * 15.0).r - 0.5) * 0.5 + (texture2D(tGrain, vec2(ru.y, -ru.x) * 5.7 + 0.31).r - 0.5) * 0.5;
    rf *= 1.0 + gr * uGrain * uHaveG * mix(0.55, 1.45, uDay);   // (the review: the coarser reading carries half — the fine one alone did not survive a phone's scale)
    vec3 g = mix(mix(flat_, rf, uHaveR), mix(flat_, ct, uHaveC), outside);
    g *= mix(1.5, 1.0, uDay);                                 // (by night the painting is shown a little over its own light: the neon reads from 40 floors up)
    // only a LIGHT distance haze, far out — where the city meets the panorama
    vec3 hz = mix(vec3(0.02, 0.012, 0.055), vec3(0.56, 0.74, 0.93), uDay);
    g = mix(g, hz, smoothstep(0.7, 2.6, q.y) * mix(0.75, 0.6, uDay));
    col = mix(col, g, smoothstep(0.78, 0.96, v) * uGA);
  }
  // THE DARKNESS above its line: by night the lights are out (a thin live edge where it stands) · by day THE STORM CLOUD — slate, rolling
  if (uDay > 0.5) {
    float roll = fbm(vec2(az * 3.0 + uTime * 0.05, hitY * 0.6 - uTime * 0.03));
    col = mix(uDarkA * (0.65 + 0.7 * roll), col, lit);
    col = mix(col, uDarkA * 0.5, exp(-pow((hitY - uDarkY - 0.3) / 0.24, 2.0)) * 0.55);
  } else {
    float edge = exp(-pow((hitY - uDarkY - 0.3) / 0.16, 2.0));
    col = col * mix(0.035, 1.0, lit) + vec3(0.55, 0.3, 1.0) * edge * 0.5 * (0.7 + 0.3 * sin(uTime * 9.0 + vS.x * 14.0));
  }
  gl_FragColor = vec4(col, (1.0 - k * uOpen) * (1.0 - uBloom));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** the half-res wall, copied to the screen (its target holds display-ready colour: a plain copy) */
export const COPY_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }';
export const COPY_F = 'precision highp float; uniform sampler2D tMap; uniform float uBloom; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tMap, vUv).rgb * (1.0 - uBloom), 1.0); }';

// ---- THE SLICES: ONE instanced mesh for every solid slice in sight. A slice = a wedge of the ring (aE = its own coordinates: across the (→ §4, docs/freefall.md MODULE NOTES)
export const SLICE_V = /* glsl */`
attribute vec4 aE, aI, aC, aF;
attribute vec3 aR;
uniform float uSpin;
varying vec4 vE, vC, vF;
varying vec3 vW, vN, vR;
varying float vKind;
void main() {
  vec3 p = position;
  if (aE.z < 0.5) p.y += aI.z; else if (aE.z < 2.5) p.y += aI.z * (1.0 - aE.w);   // (a red slice stands proud: its top lifted, its walls stretched)
  // a floor just passed lets go: its slices drift out + up as they fade
  float out_ = aF.w;
  p.xz *= 1.0 + out_ * 0.26; p.y += out_ * 0.1;
  float a = aI.x + uSpin, c = cos(a), s = sin(a);
  vec3 w = vec3(p.x * c + p.z * s, p.y + aI.y, -p.x * s + p.z * c);
  vN = vec3(normal.x * c + normal.z * s, normal.y, -normal.x * s + normal.z * c);
  vW = w; vE = aE; vC = aC; vF = aF; vR = aR; vKind = aI.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
export const SLICE_F = /* glsl */`
uniform float uBloom, uTopY, uTime, uRing, uWidth, uGrey, uDay, uCaust, uFogK, uCaustB, uFogKB, uFogSeam, uFogS, uFogSB;
uniform vec3 uFog, uFogB;
varying vec4 vE, vC, vF;
varying vec3 vW, vN, vR;
varying float vKind;
const vec3 RED = vec3(1.0, 0.03, 0.09), RED_DARK = vec3(0.16, 0.0, 0.012);
${CAUST}
void main() {
  float face = vE.z, ang = vE.x, rad = vE.y;
  float red = step(0.5, vKind);
  // how deep under the ball's floor this slice lies (floors): the tower falls away into blue, then into the dark
  float depth = max(0.0, uTopY - vW.y);
  float far = clamp(depth / 7.0, 0.0, 1.0);
  vec3 base = vC.rgb;
  // THE AREA PALETTES ARE DEPTH-RELATIVE (F3 — the owner: replaces F2's gradient on one screen): a slice wears ITS OWN floor's colour
  // (night.js#colourOf — its area's, the last three floors of an area leaning to the next one's) + its area's RIM colour (vR: brass in
  // THE SPEAKEASY, ultraviolet in THE DEEP). Under the ball the tower only DIMS — it keeps its hue.
  vec3 rimHue = vR;
  float dim = mix(1.0, 0.5, far);
  // distances to this face's edges, in world units
  float dOut = (1.0 - rad) * uRing;                      // to the rim
  float dSide = (1.0 - abs(ang)) * uWidth * (0.2 + 0.8 * rad);   // to a cut side (a wedge is narrow at the pillar)
  float aa = fwidth(dOut) * 1.2 + 1e-5, aas = fwidth(dSide) * 1.2 + 1e-5;
  vec3 col; float alpha = vC.a;
  if (uDay > 0.5) {${DAY_SLICE}
  } else {
  float emit = 0.0; vec3 emitC = vec3(0.0);
  if (face < 0.5) {
    // THE TOP: the colour at full strength, brighter out at the rim; a soft pool of light where the ball's glow falls
    float lit = 0.52 + 0.48 * smoothstep(0.0, 1.0, rad);
    col = base * lit;
    // THE NEON RIM: a white-hot line along the outer edge, a halo in the slice's own colour behind it
    float rim = 1.0 - smoothstep(0.016 - aa, 0.016 + aa, dOut), halo = exp(-dOut / 0.06);
    // a thin dark line along each cut (the slices read apart), a darker foot at the pillar
    float cut = 1.0 - smoothstep(0.0, 0.012 + aas, dSide);
    col *= 1.0 - 0.55 * cut;
    col *= 0.72 + 0.28 * smoothstep(0.0, 0.16, rad);
    if (red > 0.5) {
      // RED = DANGER, readable with the colour removed: it stands proud of the floor, dark hazard chevrons run across it, it pulses
      float pulse = 0.86 + 0.14 * sin(uTime * 3.1 + vW.y * 2.0);
      // (the stripes' edges are smoothed by their own width on the screen: never a stair-step)
      float cx = rad * 2.6 - abs(ang) * 0.9 + 0.15, cw = fwidth(cx) * 1.2 + 1e-4, cf = abs(fract(cx) - 0.75) - 0.24;
      float chev = 1.0 - smoothstep(-cw, cw, cf);
      vec3 hz = mix(RED * 0.82, RED_DARK, chev * 0.78);
      col = hz * (0.8 + 0.3 * rad) * pulse;
      col *= 1.0 - 0.5 * cut;
      emit = (1.0 - chev) * 0.4 * pulse; emitC = RED;
      // (a red that MOVES: a bright edge all round it)
      float edge = 1.0 - smoothstep(0.022 - aas, 0.022 + aas, min(dSide, min(dOut, rad * uRing)));
      col = mix(col, vec3(1.0, 0.55, 0.55), edge * step(1.5, vKind) * 0.9);
      rim *= 1.0; base = RED;
    }
    // (a red slice's rim is HOT RED — never the safe slices' white line: danger has its own edge)
    vec3 rimC = red > 0.5 ? vec3(1.0, 0.2, 0.24) * 1.7 : mix(rimHue, vec3(1.0), 0.22) * 1.75;
    col = mix(col, rimC, rim);
    // (the halo behind the line is the RIM's own colour: on THE DEEP's dark indigo it is the ultraviolet glow — a red slice's stays red)
    vec3 haloC = red > 0.5 ? base : rimHue;
    col += haloC * halo * 0.42;
    emit += rim * 1.0 + halo * 0.3; emitC = mix(emitC, rimC, rim);
    if (emit > 0.0 && red < 0.5) emitC = mix(haloC, rimC, rim);
    // THE WARNING (the moving red steps onto this slice next): red hatching that blinks
    float warn = vF.y * (0.55 + 0.45 * sin(uTime * 12.0));
    float hx = rad * 2.6 - abs(ang) * 0.9 + 0.15, hatch = 1.0 - smoothstep(-fwidth(hx) * 1.2 - 1e-4, fwidth(hx) * 1.2 + 1e-4, abs(fract(hx) - 0.81) - 0.19);
    col = mix(col, RED, warn * (0.25 + 0.6 * hatch));
    // CRACKED (the landing right after a shatter came down on red): dark cracks run out from its middle
    if (vF.z > 0.5) {
      vec2 q = vec2(ang, rad * 2.0 - 1.0);
      float c1 = abs(q.y - 0.55 * q.x - 0.1 * sin(q.x * 9.0)), c2 = abs(q.y + 0.8 * q.x + 0.12 * sin(q.x * 7.0 + 1.0)), c3 = abs(q.x - 0.15 * sin(q.y * 8.0) + 0.1);
      float crack = 1.0 - smoothstep(0.0, 0.07, min(c1, min(c2, c3)));
      col = mix(col, vec3(0.02, 0.0, 0.01), crack * 0.9);
    }
    // F5B — THE WATER SWAP: UNDER THE HARBOR by night the slices wear the day's faint caustic shimmer, in cyan (the night's uCaust)
    if (uCaust + uCaustB > 0.001) {
      float zbN = 1.0 - smoothstep(-0.3, 0.3, vW.y - uFogSeam);
      col += vec3(0.1, 0.55, 0.65) * caust(vW.xz * 3.2 + vW.y, uTime) * 0.1 * mix(uCaust, uCaustB, zbN) * (1.0 - red * 0.6);
    }
    // THE BALL's LIGHT on its own floor (never under it by more than a floor: the eye goes to where the ball is)
    float pool = exp(-dot(vW.xz - vec2(0.0, 0.66), vW.xz - vec2(0.0, 0.66)) / 0.2) * smoothstep(1.2, 0.0, depth);
    col += base * pool * 0.3;
  } else if (face < 1.5) {
    // THE OUTER WALL: darker than the top; the rim seen from the side = a bright line along its top edge
    float topEdge = 1.0 - smoothstep(0.012, 0.03, vE.w * 0.2);   // (0.2 = the slab's thickness: night.js SHAPE.THICK)
    col = base * mix(0.5, 0.2, vE.w);
    if (red > 0.5) { float sx = ang * 1.5 + vE.w * 0.5, sw = fwidth(sx) * 1.2 + 1e-4, chev = 1.0 - smoothstep(-sw, sw, abs(fract(sx) - 0.75) - 0.25); col = mix(RED * 0.5, RED_DARK, chev * 0.6); emit = (1.0 - chev) * 0.15; emitC = RED; base = RED; }
    vec3 rimC = mix(rimHue, vec3(1.0), 0.18) * 1.5;
    if (red > 0.5) rimC = vec3(1.0, 0.2, 0.24) * 1.5;
    col = mix(col, rimC, topEdge);
    emit += topEdge * 0.9; emitC = mix(emitC, rimC, topEdge);
  } else {
    // A CUT SIDE: in shade
    col = base * 0.22;
    if (red > 0.5) col = RED * 0.3;
  }
  col *= dim;
  float flash = vF.x;
  col += vec3(1.0, 0.9, 0.95) * flash * (face < 0.5 ? 0.7 : 0.25);
  if (uGrey > 0.5) { float g = dot(col, vec3(0.2126, 0.7152, 0.0722)); col = vec3(g); }   // (the review's shot: red must read with the colour removed)
  if (uBloom > 0.5) col = (emitC * emit * 0.85 * mix(1.0, 0.3, far) + vec3(1.0, 0.9, 0.95) * flash * 0.3);
  }
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE PILLAR: the tower's dark core (a soft light down its front, a ring of light where each floor meets it)
export const PILLAR_V = /* glsl */`
varying vec3 vW, vN;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
export const PILLAR_F = /* glsl */`
uniform float uBloom, uTopY, uDay, uFogK, uFogKB, uFogSeam, uCutY, uFogS, uFogSB;
uniform vec3 uCol, uFog, uFogB;
varying vec3 vW, vN;
void main() {
  if (vW.y < uCutY) discard;   // (F3B: THE ROOF is shut until the skylight breaks — the pillar is not seen under it)
  vec3 V = normalize(cameraPosition - vW);
  float nv = max(dot(normalize(vN), V), 0.0);
  float far = clamp((uTopY - vW.y) / 7.0, 0.0, 1.0);
  vec3 col = uCol * (0.3 + 1.1 * nv * nv) * mix(1.0, 0.25, far) + vec3(0.5, 0.2, 1.0) * pow(1.0 - nv, 2.0) * 0.55 * (1.0 - far);
  col *= step(vN.y, 0.5) + 0.35 * step(0.5, vN.y);   // (its cap: the dark eye in the middle of the top ring)
  if (uDay > 0.5) {
    // BY DAY: BRUSHED STEEL — a bright band down its front, cool shade at its sides, fine brushing round it; its cap a dark teal eye
    vec3 N = normalize(vN);
    float brush = 0.975 + 0.025 * sin(atan(N.x, N.z) * 60.0 + sin(vW.y * 3.0) * 2.0);   // (the brushing runs DOWN it: fine upright streaks — rings round it read as a screw's thread)
    float band = pow(max(dot(N, normalize(vec3(-0.35, 0.25, 1.0))), 0.0), 6.0);
    col = mix(vec3(0.26, 0.36, 0.48), vec3(0.78, 0.87, 0.96), nv) * brush + vec3(1.0) * band * 0.45;
    col = mix(col, vec3(0.1, 0.3, 0.42), step(0.5, vN.y));
    float zb = 1.0 - smoothstep(-0.3, 0.3, vW.y - uFogSeam);   // (F4A: under the border in sight — that area's own haze)
    float fs = mix(uFogS, uFogSB, zb), hz = clamp((far - fs) / (1.0 - fs), 0.0, 1.0);   // (F5A's add-on: the area's haze starts fs of the way down)
    col = mix(col, mix(uFog, uFogB, zb), hz * 0.62 * mix(uFogK, uFogKB, zb));
  }
  if (uBloom > 0.5) col = vec3(0.0);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE BALL: a white-hot core (its CENTRE decides — the hottest point IS the centre), a warm edge; THE BLAZE turns it to fire
export const BALL_V = /* glsl */`
uniform vec3 uSquash;
varying vec3 vN, vW;
void main() {
  vec3 p = position * uSquash;
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * (normal / uSquash));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
export const BALL_F = /* glsl */`
uniform float uBloom, uBlaze, uTime, uOut, uDay;
uniform vec3 uEdge;
varying vec3 vN, vW;
${FIRE_RAMP}
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float nv = max(dot(N, V), 0.0);
  vec3 core = vec3(1.0, 0.985, 0.96) * 1.12;
  float k = smoothstep(0.1, 0.9, nv);
  vec3 col = mix(uEdge * 1.1, core, k * k);
  // F3 (the owner): a PINK-WHITE RIM round the unlit ball + a small WHITE DOT at its centre in a thin pink ring — the centre decides, and
  // it shows (the white-hot core + the glow stay)
  col = mix(col, vec3(1.0, 0.42, 0.78), 1.0 - smoothstep(0.34, 0.6, nv));
  col = mix(col, vec3(1.0, 0.2, 0.62), smoothstep(0.9, 0.93, nv) * (1.0 - smoothstep(0.958, 0.978, nv)) * 0.9);
  col = mix(col, vec3(1.25), smoothstep(0.962, 0.982, nv));
  if (uDay > 0.5) {
    // BY DAY: a PINK ball (#ff50aa), lighter where the light meets it, the same white rim + white centre dot
    col = mix(vec3(1.0, 0.08, 0.4), vec3(1.0, 0.4, 0.7), k * k);
    col = mix(col, vec3(1.0), 1.0 - smoothstep(0.3, 0.5, nv));
    col = mix(col, vec3(0.86, 0.02, 0.3), smoothstep(0.9, 0.93, nv) * (1.0 - smoothstep(0.958, 0.978, nv)) * 0.6);
    col = mix(col, vec3(1.0), smoothstep(0.962, 0.982, nv));
  }
  // THE BLAZE: the ball IS the fire's heart — white-yellow through its middle, orange, a neon-pink rim that flickers
  vec3 burn = fire(clamp(0.12 + nv * 1.05 + 0.06 * sin(uTime * 22.0 + N.y * 9.0), 0.0, 1.0)) * (1.15 + 0.5 * k);
  col = mix(col, burn, uBlaze);
  col = mix(col, vec3(0.2, 0.2, 0.26) * (0.4 + 0.6 * nv), uOut);   // (the lights took it: a dead grey ball)
  if (uBloom > 0.5) col *= mix(mix(0.34, 0.12, uDay), 0.9, uBlaze) * (1.0 - uOut);   // (unlit: a soft glow — its rim + its centre dot must stay read through its own bloom)
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE LIGHTS (one instanced quad, added light): aP = (its place, its half size) · aQ = (its kind, its strength, stretch up — a (→ §5, docs/freefall.md MODULE NOTES)
export const LIGHT_V = /* glsl */`
attribute vec4 aP, aQ;
attribute vec3 aC;
uniform float uAspect;
varying vec2 vQ; varying vec4 vK; varying vec3 vC;
void main() {
  float kind = aQ.x;
  vec4 c;
  if (kind > 1.5) {
    // flat on a floor: a quad in the world's XZ plane
    c = projectionMatrix * viewMatrix * vec4(aP.xyz + vec3(position.x, 0.0, position.y) * 2.0 * aP.w, 1.0);
  } else {
    c = projectionMatrix * viewMatrix * vec4(aP.xyz, 1.0);
    float sx = projectionMatrix[0][0], sy = projectionMatrix[1][1];
    vec2 off = vec2(position.x * 2.0 * aP.w, kind > 0.5 ? (position.y + 0.5) * aQ.z : position.y * 2.0 * aP.w);
    c.xy += vec2(off.x * sx, off.y * sy);
  }
  gl_Position = c;
  vQ = position.xy * 2.0; vK = aQ; vC = aC;
}`;
export const LIGHT_F = /* glsl */`
uniform float uTime, uBloom, uCover, uOnBed, uHalo;
varying vec2 vQ; varying vec4 vK; varying vec3 vC;
${FIRE_RAMP}
void main() {
  float kind = vK.x, a = 0.0, heart = 0.0, isRing = 0.0;
  vec3 ring = vec3(0.0);
  if (kind < 0.5) {
    float r = min(1.0, length(vQ)); a = exp(-r * r * 5.5) * (1.0 - r * r) * (1.0 - r * r); heart = a * a * 0.6;
    // (F5A — the review: a FINISH — the ball rests on the seabed, and the sand under it sliced its halo flat along a straight line: there
    //  its lower part fades out softly before the sand does; the sand wears the ball's own pool of light. uOnBed: only there)
    a *= mix(1.0, smoothstep(-0.46, -0.1, vQ.y), uOnBed);
    a *= uHalo; heart *= uHalo;   // (F5B: 1 — THE BOTTOM's share picture alone holds it down: night.js#SHOT_HALO)
  }
  else if (kind < 1.5) {
    // THE TRAIL: t = 0 at the ball … 1 at its tip
    float t = vQ.y * 0.5 + 0.5, w = mix(1.0, 0.08, pow(t, 0.7));
    float wob = sin(t * 13.0 - uTime * 17.0 + vK.w) * 0.16 * t + sin(t * 29.0 - uTime * 31.0) * 0.07 * t;
    float x = abs(vQ.x + wob) / w;
    a = smoothstep(1.0, 0.0, x) * (1.0 - t) * (1.0 - t * 0.35) * smoothstep(0.0, 0.04, t);
    heart = smoothstep(0.5, 0.0, x) * (1.0 - t) * 0.7;
  }
  else if (kind < 2.5) { float r = length(vQ); a = exp(-r * r * 5.0) * 0.55 + (1.0 - smoothstep(0.0, 0.07, abs(r - 0.62))) * 0.9 + (1.0 - smoothstep(0.08, 0.2, r)) * 1.2; a *= smoothstep(1.0, 0.85, r); heart = (1.0 - smoothstep(0.08, 0.2, r)); }
  else {
    // THE FIRE SHOCKWAVE: a ring running out from the shatter — white-yellow at its inner lip, orange, neon pink at its outer edge
    float r = length(vQ), k = vK.z, rr = 0.12 + 0.84 * (1.0 - (1.0 - k) * (1.0 - k)), wd = 0.06 + 0.1 * k, d = (r - rr) / wd;
    a = exp(-d * d) * (1.0 - k) * (1.0 - k) + exp(-r * r * 6.0) * (1.0 - k) * 0.7 * step(k, 0.5);
    ring = fire(clamp(0.78 - 0.34 * d - 0.3 * k, 0.0, 1.0)); isRing = 1.0; heart = 0.0;
  }
  a *= vK.y;
  vec3 col = mix(mix(vC, vec3(1.0), min(1.0, heart)), ring, isRing) * a;
  if (uBloom > 0.5) col *= 0.55;
  // (BY DAY added light is lost on a bright ground: a light COVERS what is behind it — uCover; by night it is 0: light is added)
  gl_FragColor = vec4(col, min(1.0, a) * uCover);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// THE FLAMES: billowing flame SPRITES (Kenney's Particle Pack — assets/freefall/fx/blaze.webp: two flames, the hot speckle, the smoke), (→ §6, docs/freefall.md MODULE NOTES)
export const FLAME_V = /* glsl */`
attribute vec3 aO, aV;
attribute vec4 aT;
uniform float uTime;
varying vec2 vUv; varying vec3 vK;
void main() {
  float age = uTime - aT.x, k = age / aT.y, seed = aT.w;
  if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vUv = vec2(0.0); vK = vec3(1.0, 0.0, 0.0); return; }
  float s6 = seed * 6.2832;
  vec3 curl = vec3(sin(age * 7.3 + s6 * 3.0) + 0.5 * sin(age * 13.1 + s6), 0.4 * sin(age * 5.1 + s6 * 2.0), cos(age * 6.1 + s6 * 5.0)) * (0.11 * k);
  vec4 c = projectionMatrix * viewMatrix * vec4(aO + aV * age + curl, 1.0);
  float size = aT.z * (0.42 + 1.35 * k), a = s6 + age * 2.4 * (seed - 0.5), ca = cos(a), sa = sin(a);
  vec2 q = vec2(position.x * ca - position.y * sa, position.x * sa + position.y * ca) * size;
  c.xy += q * vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
  gl_Position = c;
  vUv = position.xy + 0.5; vK = vec3(k, seed, 0.0);
}`;
export const FLAME_F = /* glsl */`
uniform sampler2D tFx;
uniform float uHave, uFlip, uBloom, uCover;
varying vec2 vUv; varying vec3 vK;
${FIRE_RAMP}
float cell(float i, vec2 uv) { return texture2D(tFx, vec2((i + clamp(uv.x, 0.02, 0.98)) * 0.25, mix(uv.y, 1.0 - uv.y, uFlip))).r; }
void main() {
  float k = vK.x, seed = vK.y;
  // (no picture yet: a soft round puff — the fire still burns)
  float r = length(vUv - 0.5) * 2.0, puff = (1.0 - smoothstep(0.2, 1.0, r));
  float fl = mix(puff, mix(cell(step(0.5, seed), vUv), cell(2.0, vUv), 0.35), uHave), sm = mix(puff, cell(3.0, vUv), uHave);
  float body = mix(fl, sm, smoothstep(0.4, 1.0, k)) * (1.0 - smoothstep(0.85, 1.0, r));
  // its heat: white-hot when it is born, down the ramp as it ages — the thick of the sprite is hotter than its wisps
  // (the review: the first fire was a blown-out white column — the flames summed to white. A flame is white only while it is small
  //  and new; it cools FAST to yellow, sits ORANGE through its middle age, and is a saturated NEON PINK for its last third)
  float cool = pow(1.0 - k, 1.7);
  float heat = clamp(cool * (0.55 + 0.6 * body), 0.0, 1.0);
  float a = body * smoothstep(0.0, 0.08, k) * pow(1.0 - k, 0.85);
  // (BY DAY the SAME fire must COVER — added light is lost on a bright sky: a flame is thicker there and a shade cooler, so its orange +
  //  its neon pink stand against the pale ground round the white-yellow heart)
  a = mix(a, pow(a, 0.5) * pow(1.0 - k, 0.6), uCover); heat *= mix(1.0, 0.74, uCover);
  vec3 col = fire(heat) * a * mix(1.15, 0.85, smoothstep(0.5, 1.0, heat));
  if (uBloom > 0.5) col *= 0.5;
  // (light that also COVERS a little of what is behind it: a flame over another keeps its own colour — the yellow + the orange bands stay)
  gl_FragColor = vec4(col, a * mix(0.7, 0.96, uCover));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
// THE RIBBON: the fire's tail behind the ball — a strip that waves like a flame (it bends more towards its tip), in the same ramp:
// white along its heart at the ball, yellow, orange, neon pink at its edges + its tip
export const RIBBON_V = /* glsl */`
uniform vec3 uAt;
uniform float uLen, uWid, uTime;
varying vec2 vQ;
void main() {
  float t = position.y + 0.5;
  float w = uWid * mix(1.0, 0.1, pow(t, 0.75));
  float wave = (sin(t * 8.0 - uTime * 15.0) * 0.6 + sin(t * 17.0 - uTime * 26.0) * 0.3) * t * uWid;
  vec4 c = projectionMatrix * viewMatrix * vec4(uAt + vec3(0.0, t * uLen, 0.0), 1.0);
  c.x += (position.x * 2.0 * w + wave) * projectionMatrix[0][0];
  gl_Position = c;
  vQ = vec2(position.x * 2.0, t);
}`;
export const RIBBON_F = /* glsl */`
uniform float uOn, uBloom, uTime, uCover;
varying vec2 vQ;
${FIRE_RAMP}
void main() {
  float x = abs(vQ.x), t = vQ.y, core = 1.0 - x;
  float flick = 0.88 + 0.12 * sin(t * 31.0 - uTime * 40.0);
  float heat = clamp(pow(core, 1.5) * (1.0 - t) * 1.12 * flick, 0.0, 1.0);   // (white only at the ball: yellow by a third of its length, orange past half, pink at its tip + its edges)
  float a = smoothstep(0.0, 0.35, core) * (1.0 - t) * smoothstep(0.0, 0.03, t) * uOn;
  a = mix(a, pow(a, 0.55), uCover); heat *= mix(1.0, 0.86, uCover);
  vec3 col = fire(heat) * a * mix(1.25, 1.0, uCover);
  if (uBloom > 0.5) col *= 0.5;
  gl_FragColor = vec4(col, min(1.0, a) * uCover);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SHARDS: a shattered slice's pieces — real 3D chips thrown out + down, tumbling, flown HERE (a shard = its start, its throw,
// its tumble axis, (its birth, its life, its size, its spin), its colour: nothing is stepped on the CPU)
export const SHARD_V = /* glsl */`
attribute vec3 aO, aV, aAx, aC;
attribute vec4 aT;
uniform float uTime;
varying vec3 vC, vN; varying float vK;
vec3 rot(vec3 p, vec3 ax, float a) { float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1.0 - c); }
void main() {
  float age = uTime - aT.x, k = age / aT.y;
  if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vK = 1.0; vC = vec3(0.0); vN = vec3(0.0, 1.0, 0.0); return; }
  vec3 ax = normalize(aAx);
  vec3 p = rot(position * aT.z, ax, age * aT.w) + aO + aV * age + vec3(0.0, -6.5 * age * age, 0.0);
  vN = rot(normal, ax, age * aT.w); vC = aC; vK = k;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
export const SHARD_F = /* glsl */`
uniform float uBloom;
varying vec3 vC, vN; varying float vK;
void main() {
  float ny = abs(normalize(vN).y), l = 0.45 + 0.55 * ny;
  float fade = 1.0 - vK * vK, lit = 1.0 - vK;
  // LIT BY THE FIRE (a shard only ever flies from THE BLAZE's shatter): gold glints on the faces turned to it, a neon-pink rim
  vec3 col = vC * l * 1.1 + vec3(1.0, 0.8, 0.32) * pow(ny, 6.0) * 1.2 * lit + vec3(1.0, 0.16, 0.62) * pow(1.0 - ny, 2.5) * 0.5 * lit;
  if (uBloom > 0.5) col = vC * 0.35 + vec3(1.0, 0.7, 0.3) * pow(ny, 6.0) * 0.6 * lit;
  gl_FragColor = vec4(col * fade, fade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SPARKS (HIGH RISE's): a spark = its start (aO), its throw (aV), (its birth s, its life s, its width) in aT, its colour — a
// streak from where it was 35 ms ago to where it is, under gravity. Added light.
export const SPARK_V = /* glsl */`
attribute vec3 aO, aV, aT, aC;
uniform float uTime, uAspect, uGrav;
varying float vK; varying vec2 vQ; varying vec3 vC;
vec3 at(float t) { return aO + aV * t + vec3(0.0, uGrav * t * t, 0.0); }
void main() {
  float age = uTime - aT.x, k = age / aT.y;
  if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vK = 1.0; vQ = vec2(0.0); vC = vec3(0.0); return; }
  vec4 c1 = projectionMatrix * viewMatrix * vec4(at(age), 1.0);
  vec4 c0 = projectionMatrix * viewMatrix * vec4(at(max(0.0, age - 0.035)), 1.0);
  vec2 p1 = c1.xy / c1.w, p0 = c0.xy / c0.w;
  vec2 dir = (p1 - p0) * vec2(uAspect, 1.0);
  float len = length(dir);
  dir = len > 1e-5 ? dir / len : vec2(0.0, 1.0);
  float wid = aT.z * (1.0 - 0.6 * k) * 1.1;
  vec2 off = dir * position.y * (len + wid) + vec2(dir.y, -dir.x) * position.x * wid;
  off.x /= uAspect;
  gl_Position = vec4(((p0 + p1) * 0.5 + off) * c1.w, c1.z, c1.w);
  vK = k; vQ = position.xy * 2.0; vC = aC;
}`;
export const SPARK_F = /* glsl */`
uniform float uCover;
varying float vK; varying vec2 vQ; varying vec3 vC;
void main() {
  float a = (1.0 - abs(vQ.x)) * (1.0 - vQ.y * vQ.y) * (1.0 - vK * vK);
  vec3 hue = mix(vec3(1.0, 0.97, 0.92), vC, smoothstep(0.0, 0.55, vK));
  gl_FragColor = vec4(hue * a * 1.7, min(1.0, a * 1.4) * uCover);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- YOUR BEST's GOLD TAPE (HIGH RISE's idea, round a ring): ONE thin line of gold light round the rim of your best floor + a soft glow
// off it — never a fill. The line covers what is behind it (its gold stays gold on a pink floor); held down in the bloom pass.
export const TAPE_V = /* glsl */`
varying float vY;
void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const TAPE_F = /* glsl */`
uniform vec3 uCol;
uniform float uGlow, uBloom, uHalf, uDark;
varying float vY;
void main() {
  float px = fwidth(vY) + 1e-6, a = abs(vY);
  float hw = max(1.2 * px, uHalf * 0.2);
  float line = 1.0 - smoothstep(hw - 0.75 * px, hw + 0.75 * px, a);
  float halo = exp(-a / (uHalf * 0.5)) * 0.5 * smoothstep(uHalf, uHalf * 0.6, a) * (1.0 - uDark);
  float k = uGlow * (uBloom > 0.5 ? 0.45 : 1.0);
  vec3 c = (uCol * line + uCol * halo * (1.0 - line)) * k + vec3(1.0, 0.95, 0.8) * line * 0.25 * k;
  // (F3B — ON GOLD FLOORS the tape is WHITE WITH A DARK EDGE: a dark band each side of the line covers the gold behind it)
  float hw2 = hw * 2.6 + px, edge = (1.0 - smoothstep(hw2 - 0.75 * px, hw2 + 0.75 * px, a)) * (1.0 - line) * uDark * (1.0 - uBloom);
  gl_FragColor = vec4(c * (1.0 - edge) + vec3(0.03, 0.02, 0.06) * edge, max(min(1.0, line + halo * 0.6) * k, edge));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE HALF-RES BLOOM (HIGH RISE's — tier 2 only): the scene's LIGHTS again (every material's uBloom pass) → a half-res target →
// blurred at a quarter → added back over the picture
const QUAD_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const BLUR_F = `precision highp float; uniform sampler2D tMap; uniform vec2 uStep; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.227027;
  c += (texture2D(tMap, vUv + uStep * 1.3846).rgb + texture2D(tMap, vUv - uStep * 1.3846).rgb) * 0.316216;
  c += (texture2D(tMap, vUv + uStep * 3.2308).rgb + texture2D(tMap, vUv - uStep * 3.2308).rgb) * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`;
const ADD_F = 'precision highp float; uniform sampler2D tMap; uniform float uK; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tMap, vUv).rgb * uK, 1.0); }';
export const BLOOM_K = 0.7;
export function createBloom(renderer, uBloom) {
  const opt = { depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const a = new THREE.WebGLRenderTarget(4, 4, opt), b = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false }), c = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qs = new THREE.Scene(), qc = new THREE.Camera();
  quad.frustumCulled = false; qs.add(quad);
  const blur = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: BLUR_F, uniforms: { tMap: { value: null }, uStep: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
  const add = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: ADD_F, uniforms: { tMap: { value: null }, uK: { value: BLOOM_K } }, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending });
  const black = new THREE.Color(0x000000), keep = new THREE.Color();
  return {
    size(w, h) { a.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); b.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); c.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); },
    /** after the main picture: the lights again → blur → add. `twins` = [mesh, its material for THIS pass, (a slot)] — a material drawn
     *  to the screen AND into a target changes program each time in three.js (HIGH RISE's LAG RULES 2): a twin is only ever drawn here. */
    render(scene, cam, twins, k = 1) {
      const auto = renderer.autoClear;
      renderer.getClearColor(keep); const alpha = renderer.getClearAlpha();
      renderer.setClearColor(black, 1);
      uBloom.value = 1;
      for (let i = 0; i < twins.length; i++) { const t = twins[i]; t[2] = t[0].material; t[0].material = t[1]; }
      renderer.setRenderTarget(a); renderer.clear(); renderer.render(scene, cam);
      for (let i = 0; i < twins.length; i++) { const t = twins[i]; t[0].material = t[2]; }
      uBloom.value = 0;
      quad.material = blur;
      blur.uniforms.tMap.value = a.texture; blur.uniforms.uStep.value.set(1 / b.width, 0); renderer.setRenderTarget(b); renderer.render(qs, qc);
      blur.uniforms.tMap.value = b.texture; blur.uniforms.uStep.value.set(0, 1 / c.height); renderer.setRenderTarget(c); renderer.render(qs, qc);
      renderer.setRenderTarget(null); renderer.setClearColor(keep, alpha);
      quad.material = add; add.uniforms.tMap.value = c.texture; add.uniforms.uK.value = BLOOM_K * k;
      renderer.autoClear = false; renderer.render(qs, qc); renderer.autoClear = auto;
    },
    dispose() { a.dispose(); b.dispose(); c.dispose(); quad.geometry.dispose(); blur.dispose(); add.dispose(); },
  };
}
