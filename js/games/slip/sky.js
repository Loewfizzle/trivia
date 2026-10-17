// SLIPSTREAM skies: one WebGL fragment shader per biome, three palette variants each, rendered at a fraction of the
// screen's pixels (soft backgrounds) behind the 2D world. Biomes crossfade as the rider passes from one to the next.
// Uniforms: camera x (slow parallax), the beat / energy of the song, a lightning flash, the gravity flip (the sky
// turns over with the world), a "boost" bloom. WebGL1, no libraries; if WebGL is missing the CSS gradient shows.
export const SKIES = {
  dunes: {
    name: 'DUSK DUNES',
    variants: [
      { name: 'GOLDEN DUSK', c: ['#ffcf73', '#ff7a59', '#8a3a7a', '#1d1442', '#fff1c4'], v: 0 },
      { name: 'ROSE SUNSET', c: ['#ffd0b0', '#ff5f8f', '#6a2a8a', '#140f33', '#ffe8f0'], v: 1 },
      { name: 'EMBER HAZE', c: ['#ffb347', '#e0482f', '#5a1f3a', '#120a1a', '#ffe0a0'], v: 2 },
    ],
  },
  crystal: {
    name: 'CRYSTAL CANYON',
    variants: [
      { name: 'SAPPHIRE GLOW', c: ['#7fe8ff', '#3a6dff', '#1a1c5a', '#05061a', '#e6fbff'], v: 0 },
      { name: 'AMETHYST CAVERN', c: ['#e3a8ff', '#8a4dff', '#2a1458', '#08041a', '#fbefff'], v: 1 },
      { name: 'JADE LIGHT', c: ['#a6ffd6', '#2fbf9a', '#0f3a4a', '#03101a', '#eafff6'], v: 2 },
    ],
  },
  city: {
    name: 'FLOATING CITY',
    variants: [
      { name: 'TWILIGHT', c: ['#ff9ad0', '#6a7dff', '#2a2f7a', '#0b0c2a', '#ffe6ff'], v: 0 },
      { name: 'NEON NIGHT', c: ['#ff3fb0', '#3fe0ff', '#1a1450', '#050414', '#d6f7ff'], v: 1 },
      { name: 'CLOUD DAWN', c: ['#ffe2b8', '#8fb8ff', '#4a5aa0', '#16183a', '#ffffff'], v: 2 },
    ],
  },
  storm: {
    name: 'LIGHTNING STORM',
    variants: [
      { name: 'THUNDERHEAD', c: ['#9aa8ff', '#3a3f7a', '#161a33', '#05060c', '#e8eeff'], v: 0 },
      { name: 'VIOLET SQUALL', c: ['#d09aff', '#4a2a7a', '#1a1030', '#05030c', '#f4e8ff'], v: 1 },
      { name: 'STEEL RAIN', c: ['#a8e0ff', '#2a4a6a', '#101c2a', '#030609', '#e8f8ff'], v: 2 },
    ],
  },
  space: {
    name: 'OPEN SPACE',
    variants: [
      { name: 'AURORA', c: ['#5dffb0', '#7a6cff', '#0d1a3a', '#020309', '#ffffff'], v: 0 },
      { name: 'NEBULA', c: ['#ff6ad5', '#ffb36a', '#2a1258', '#030208', '#fff4e8'], v: 1 },
      { name: 'DEEP FIELD', c: ['#6ad8ff', '#a58bff', '#0a1030', '#010206', '#e8f6ff'], v: 2 },
    ],
  },
};

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const HEAD = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uCam, uBeat, uEnergy, uFlash, uFlip, uAlpha, uV, uQ, uBoost, uDanger, uHor;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ if(float(i)>=uQ+2.) break; v+=a*noise(p); p=p*2.03+vec2(17.,9.); a*=.5; } return v; }
float stars(vec2 p, float dens){ vec2 i=floor(p), f=fract(p); float h=hash(i); if(h>dens) return 0.;
  vec2 c=vec2(hash(i+3.1),hash(i+7.7))*.8+.1; return smoothstep(.08,0.,length(f-c))*(.6+.4*sin(uTime*(1.+h*3.)+h*40.)); }
`;
const BODY = {
  dunes: `
vec3 sky(vec2 uv, vec2 p){
  float y=uv.y;
  vec3 c=mix(uC1, uC0, smoothstep(.55,.2,y));
  c=mix(c, uC2, smoothstep(.45,.8,y));
  c=mix(c, uC3, smoothstep(.75,1.,y));
  // the sun, low and soft, banded by haze
  vec2 sp=vec2(p.x+.18-uCam*.00002, uv.y-.36);
  float r=length(sp*vec2(1.,1.1));
  c+=uC4*smoothstep(.13,.11,r)*.9;
  c+=uC0*exp(-r*4.)*.55*(1.+.25*uBeat);
  float band=smoothstep(.0,.02,abs(fract((uv.y-.3)*26.)-.5)-.38);
  c=mix(c, c*.92, (1.-band)*smoothstep(.5,.3,y)*.4);
  // high wispy clouds catching the light
  float cl=fbm(vec2(p.x*2.+uCam*.0003, y*6.)+vec2(uTime*.01,0.));
  c+=uC0*smoothstep(.55,.85,cl)*smoothstep(.45,.85,y)*.18;
  c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*60.,.05))*smoothstep(.75,1.,y)*.6;
  return c;
}`,
  crystal: `
vec3 sky(vec2 uv, vec2 p){
  float y=uv.y;
  vec3 c=mix(uC2, uC3, smoothstep(.2,1.,y));
  // light shafts refracted through the crystals: prismatic, slowly turning
  float sh=0.;
  for(int i=0;i<4;i++){ float fi=float(i); float x=p.x+(1.-y)*(.3-fi*.18)+fi*.33-.5-uCam*.00004; sh+=exp(-x*x*30.)*(.5+.3*sin(uTime*.2+fi*2.)); }
  vec3 spec=.5+.5*cos(6.28*(p.x*.4+y*.3+vec3(0.,.33,.67)+uTime*.02));
  c+=mix(uC0, spec, .35)*sh*.32*(1.+.5*uEnergy);
  c+=uC1*exp(-(1.-y)*3.)*.25;
  float cl=fbm(vec2(p.x*3.+uCam*.0003, y*4.));
  c+=uC4*smoothstep(.62,.9,cl)*.08;
  c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*90.,.06))*.7*uC4;
  return c;
}`,
  city: `
vec3 sky(vec2 uv, vec2 p){
  float y=uv.y;
  vec3 c=mix(uC0*.8, uC1, smoothstep(.15,.55,y));
  c=mix(c, uC2, smoothstep(.5,.85,y));
  c=mix(c, uC3, smoothstep(.8,1.,y));
  // the sea of clouds below the floating city, lit from beneath
  float sea=fbm(vec2(p.x*1.6+uCam*.0005, y*3.-uTime*.02));
  float layer=smoothstep(.42,.2,y)*smoothstep(.35,.7,sea);
  c=mix(c, mix(uC0, uC4, .3), layer*.55);
  // a few big lit clouds higher up
  float hi=fbm(vec2(p.x*.9+uCam*.0002+3., y*2.5+1.));
  c+=uC1*smoothstep(.6,.85,hi)*smoothstep(.4,.8,y)*.2;
  c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*70.,.05))*smoothstep(.6,1.,y)*.7;
  return c;
}`,
  storm: `
vec3 sky(vec2 uv, vec2 p){
  float y=uv.y;
  vec3 c=mix(uC2, uC3, smoothstep(.1,1.,y));
  // churning cloud deck
  vec2 q=vec2(p.x*1.4+uCam*.0004, y*2.6);
  float w=fbm(q+vec2(uTime*.05, 0.));
  float d=fbm(q*2.+w*2.+vec2(-uTime*.04, uTime*.02));
  c=mix(c, uC1*1.15, smoothstep(.3,.75,d)*.9);
  c*=.8+.5*smoothstep(.2,.8,w);
  c+=uC1*exp(-max(y-.3,0.)*5.)*.35;           // a cold glow over the horizon
  // lightning: the whole sky lights up from inside the clouds
  c+=uC0*uFlash*(.6+.8*smoothstep(.3,.7,d));
  c+=uC4*uFlash*uFlash*.25;
  // rain veils
  float rain=step(.97, noise(vec2(p.x*90.+y*20., y*4.+uTime*8.)));
  c+=uC4*rain*.06*(uQ>0.5?1.:0.);
  return c;
}`,
  space: `
vec3 sky(vec2 uv, vec2 p){
  float y=uv.y;
  vec3 c=mix(uC2, uC3, smoothstep(.0,.9,y));
  vec2 q=p*1.6+vec2(uCam*.00005,0.);
  float n=fbm(q+vec2(fbm(q*1.3+uTime*.01), fbm(q*1.3-uTime*.01+5.)));
  if(uV<.5){
    // aurora curtains over the horizon
    for(int i=0;i<3;i++){ float fi=float(i); float x=p.x*(1.5+fi*.4)+fi*1.7+uCam*.00008;
      float y0=.5+fi*.08+.06*sin(x*2.+uTime*.15); float dd=y-y0;
      float b=dd>0.?exp(-dd*6.):exp(-dd*dd*900.);
      c+=mix(uC0,uC1,clamp(dd*4.,0.,1.))*b*(.5+.4*noise(vec2(x*40.,uTime*.3)))*(.7-fi*.15)*(1.+.4*uEnergy); }
  } else {
    // nebula clouds
    c=mix(c, uC2*1.6, smoothstep(.3,.7,n));
    c=mix(c, uC0, smoothstep(.5,.85,n*fbm(q*3.))*.8);
    c=mix(c, uC1, smoothstep(.65,.95,fbm(q*2.5+3.))*.5);
  }
  vec2 sp=uv*vec2(uRes.x/uRes.y,1.);
  c+=vec3(stars(sp*70.+vec2(uCam*.0004,0.),.1))*.9;
  c+=vec3(stars(sp*150.+3.,.06))*.6;
  c+=uC4*stars(sp*20.+9.,.03)*1.2;
  return c;
}`,
};
const TAIL = `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  uv.y+=.36-uHor;                      // each sky is composed around a horizon at .36: move it to the terrain
  uv.y=mix(uv.y, 1.-uv.y, uFlip);
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 c=sky(uv,p);
  c*=1.+uBeat*.06*(.5+uEnergy);
  c+=c*uBoost*.35;
  float l=dot(c,vec3(.299,.587,.114));
  c=mix(c, vec3(l)*vec3(.7,.8,1.1), uDanger*.5);
  vec2 vq=uv-.5; c*=clamp(1.-dot(vq,vq)*.9,0.,1.);
  c=c/(1.+c*.3);
  gl_FragColor=vec4(c,uAlpha);
}`;

const hex3 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const TIERS = [0.22, 0.32, 0.42];

export function createSky(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  let buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const programs = {};
  let tier = 2, w = 0, hgt = 0, cssW = 0, cssH = 0, lost = false;
  const u = { hor: 0.36, cam: 0, beat: 0, energy: 0.5, flash: 0, flip: 0, boost: 0, danger: 0 };
  let a = null, b = null, mix = 0;
  const measure = () => { const r = canvas.getBoundingClientRect(); cssW = r.width; cssH = r.height; w = 0; };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(canvas);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; for (const k of Object.keys(programs)) delete programs[k];
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  });

  function compile(id) {
    if (programs[id]) return programs[id];
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('sky shader', id, gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, HEAD + BODY[id] + TAIL);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    const loc = {};
    for (const n of ['uRes', 'uTime', 'uCam', 'uBeat', 'uEnergy', 'uFlash', 'uFlip', 'uAlpha', 'uV', 'uQ', 'uBoost', 'uDanger', 'uHor', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4']) loc[n] = gl.getUniformLocation(p, n);
    programs[id] = { p, loc };
    return programs[id];
  }
  function size() {
    if (w) return;
    const s = TIERS[tier] * Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(64, Math.round(cssW * s)); hgt = Math.max(64, Math.round(cssH * s));
    canvas.width = w; canvas.height = hgt;
  }
  function draw(biome, alpha, time) {
    const pr = compile(biome.id);
    if (!pr) return;
    gl.useProgram(pr.p);
    const L = pr.loc;
    const v = SKIES[biome.id].variants[biome.variant];
    gl.uniform2f(L.uRes, w, hgt);
    gl.uniform1f(L.uTime, time % 3600);
    gl.uniform1f(L.uCam, u.cam % 100000);
    gl.uniform1f(L.uBeat, u.beat); gl.uniform1f(L.uEnergy, u.energy); gl.uniform1f(L.uFlash, biome.id === 'storm' ? u.flash : 0);
    gl.uniform1f(L.uFlip, u.flip); gl.uniform1f(L.uAlpha, alpha); gl.uniform1f(L.uV, v.v); gl.uniform1f(L.uQ, tier + 1);
    gl.uniform1f(L.uBoost, u.boost); gl.uniform1f(L.uDanger, u.danger); gl.uniform1f(L.uHor, u.hor);
    v.c.forEach((c, i) => gl.uniform3fv(L[`uC${i}`], hex3(c)));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return {
    /** biomes: { a, b, mix } from course.biomeAt */
    setBiomes(bi) { a = bi.a; b = bi.b; mix = bi.mix; },
    set(v) { Object.assign(u, v); },
    setTier(t) { tier = Math.max(0, Math.min(2, t)); w = 0; },
    render(time) {
      if (lost || !a) return;
      size();
      gl.viewport(0, 0, w, hgt);
      gl.disable(gl.BLEND);
      draw(a, 1, time);
      if (b && mix > 0.001) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        draw(b, mix * mix * (3 - 2 * mix), time);
        gl.disable(gl.BLEND);
      }
    },
    destroy() {
      ro.disconnect();
      for (const k of Object.keys(programs)) gl.deleteProgram(programs[k].p);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    },
  };
}
