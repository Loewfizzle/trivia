// PRISM DROP worlds: one full-screen WebGL shader per song world, three palette variants each, rendered at a
// fraction of the screen resolution (they're soft backgrounds — a 0.3–0.6 scale costs little and looks the same)
// and stretched behind the board. Shared post: beat pulse, combo bloom + hue drift, colour-wash waves from big
// clears, the danger drain (cooler, greyer, vignette), the final-duel intensity, a junk glitch. A song change
// crossfades the old world into the new one. WebGL1 only, no libraries; if WebGL is missing the CSS gradient
// behind the canvas shows instead.
export const WORLDS = {
  aurora: {
    name: 'AURORA OCEAN',
    variants: [
      { name: 'EMERALD NIGHT', c: ['#0d3442', '#02040c', '#3dffb4', '#7a6cff', '#01070d'], v: 0 },
      { name: 'VIOLET STORM', c: ['#240f3d', '#03020b', '#ff58d6', '#6f7dff', '#05030c'], v: 1 },
      { name: 'POLAR DAWN', c: ['#ff9a7c', '#151a44', '#8dffd6', '#ffd47e', '#0b1224'], v: 2 },
    ],
  },
  city: {
    name: 'NEON CITY',
    variants: [
      { name: 'DUSK', c: ['#ff7f5c', '#2a1648', '#ff3fa4', '#36e2ff', '#0c0718'], v: 0 },
      { name: 'MIDNIGHT', c: ['#2a1250', '#020309', '#ff2fb8', '#2ff3ff', '#05040c'], v: 1 },
      { name: 'RAIN', c: ['#1e3352', '#04070e', '#ff5577', '#4df2ff', '#03060c'], v: 2 },
    ],
  },
  nebula: {
    name: 'DEEP NEBULA',
    variants: [
      { name: 'CRIMSON CORE', c: ['#ff3d5e', '#ffb347', '#5a1a7a', '#120612', '#fff1d0'], v: 0 },
      { name: 'TIDAL BLUE', c: ['#2fb8ff', '#3dffd8', '#2a2a8a', '#030814', '#e8fbff'], v: 1 },
      { name: 'ROSE VOID', c: ['#ff6ad5', '#a77bff', '#3b1466', '#09040f', '#fff0fb'], v: 2 },
    ],
  },
  crystal: {
    name: 'CRYSTAL CAVE',
    variants: [
      { name: 'SAPPHIRE', c: ['#2f7bff', '#6ff0ff', '#0a1640', '#02040c', '#e6f6ff'], v: 0 },
      { name: 'AMETHYST', c: ['#a55bff', '#ff8af0', '#1c0b3d', '#05020c', '#f5e9ff'], v: 1 },
      { name: 'EMERALD', c: ['#20d68a', '#c7ff6f', '#06301f', '#020a06', '#eafff2'], v: 2 },
    ],
  },
  sunset: {
    name: 'SYNTH SUNSET',
    variants: [
      { name: 'GOLDEN HOUR', c: ['#ffcf4a', '#ff4f8b', '#3a1466', '#0b0820', '#ff2fd0'], v: 0 },
      { name: 'MIDNIGHT DRIVE', c: ['#ff5ad9', '#7a3cff', '#120a3a', '#03030f', '#3fe0ff'], v: 1 },
      { name: 'PASTEL DAWN', c: ['#ffe2a8', '#ff9cc2', '#6fa8ff', '#24305e', '#7affe6'], v: 2 },
    ],
  },
};
export const WORLD_IDS = Object.keys(WORLDS);

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const HEAD = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uBeat, uEnergy, uBloom, uHue, uDanger, uGlitch, uDuel, uAlpha, uV, uQ;
uniform vec3 uWave; // x: wave front height (0..1.4), y: strength, z: hue
uniform vec3 uC0, uC1, uC2, uC3, uC4;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float hash1(float x){ return fract(sin(x*127.1)*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ if(float(i)>=uQ+2.) break; v+=a*noise(p); p=p*2.03+vec2(17.,9.); a*=.5; } return v; }
vec3 hueRot(vec3 c, float h){ const vec3 k=vec3(.57735); float ca=cos(h); return c*ca+cross(k,c)*sin(h)+k*dot(k,c)*(1.-ca); }
vec3 spectrum(float x){ return .5+.5*cos(6.2832*(x+vec3(0.,.33,.67))); }
float stars(vec2 p, float dens, float tw){ vec2 i=floor(p), f=fract(p); float h=hash(i); if(h>dens) return 0.;
  vec2 c=vec2(hash(i+3.1),hash(i+7.7))*.8+.1; float d=length(f-c); float s=smoothstep(.09,0.,d);
  return s*(.55+.45*sin(uTime*(1.+h*3.)*tw+h*40.)); }
`;

// each world: vec3 world(vec2 uv, vec2 p) — uv 0..1 (y up), p = centred, aspect-correct
const BODY = {
  aurora: `
vec3 sky(vec2 uv){ return mix(uC0, uC1, smoothstep(.34, 1., uv.y)); }
vec3 aur(vec2 uv){
  vec3 acc=vec3(0.);
  for(int i=0;i<4;i++){
    float fi=float(i);
    float x=uv.x*(1.3+fi*.35)+fi*1.7;
    float y0=.58+fi*.075+.07*sin(x*2.2+uTime*.12*(1.+fi*.3))+.06*fbm(vec2(x*1.5,uTime*.05+fi));
    float d=uv.y-y0;
    // a curtain: a bright lower edge that fades upward, combed into vertical rays
    float band=d>0.?exp(-d*7.)*smoothstep(0.,.012,d):exp(-d*d*2500.);
    float rays=pow(noise(vec2(uv.x*90.+fi*13.+uTime*.15,uTime*.3)),1.6)*.9+.25;
    float fold=.6+.4*sin(x*9.+uTime*.25+fi*2.);
    vec3 col=mix(uC2,uC3,clamp(d*5.+fi*.12,0.,1.));
    acc+=col*band*rays*fold*(.9-fi*.15);
  }
  return acc*(.85+.6*uEnergy+.3*uBeat);
}
vec3 world(vec2 uv, vec2 p){
  float hz=.34;
  if(uv.y>hz){
    vec3 c=sky(uv);
    c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*70.,.12,1.))*(uV>1.5?.35:1.);
    c+=aur(uv);
    c+=uC0*exp(-(uv.y-hz)*14.)*.5;
    return c;
  }
  float dy=hz-uv.y;
  float w=noise(vec2(uv.x*18., dy*60.-uTime*.6))*.012+sin(uv.x*40.+uTime*.8+dy*80.)*.003;
  vec2 r=vec2(uv.x+w, hz+dy*1.4);
  vec3 refl=sky(r)+aur(r)*.8;
  float fres=.35+.5*exp(-dy*8.);
  vec3 c=mix(uC4, refl, fres*.75);
  c+=uC2*pow(noise(vec2(uv.x*80.,dy*200.-uTime*2.)),8.)*exp(-dy*10.)*.6;
  return c;
}`,
  city: `
float bld(float x, float seed, float hmin, float hmax, out float id, out float wx){
  float w=.035+.05*hash1(floor(x*12.+seed)*1.3+seed);
  float cx=floor(x/w); id=cx+seed*100.; wx=fract(x/w);
  return hmin+(hmax-hmin)*pow(hash1(id*.917+seed),1.4);
}
vec3 world(vec2 uv, vec2 p){
  vec3 c=mix(uC0, uC1, smoothstep(.2,1.,uv.y));
  c+=uC2*.18*exp(-abs(uv.y-.32)*9.);
  c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*80.,.05,1.))*smoothstep(.55,.9,uv.y)*(uV<.5?.3:.8);
  float street=.22;
  vec2 q=uv;
  bool refl=uv.y<street;
  if(refl){ q.y=street+(street-uv.y)*1.6; q.x+=noise(vec2(uv.x*30.,uv.y*90.+uTime*1.5))*.01; }
  vec3 layer=vec3(0.);
  float alpha=0.;
  for(int L=0;L<3;L++){
    float fl=float(L);
    float par=uTime*.004*(fl+1.);
    float x=q.x*(1.+fl*.6)+par+fl*3.7;
    float id, wx;
    float top=bld(x, fl*7.1, street+.08+.06*fl, street+.42-.07*fl, id, wx);
    if(q.y<top && q.y>street){
      float shade=.06+.05*(2.-fl);
      vec3 b=uC4*(1.+fl*.5)+uC1*shade;
      // windows
      vec2 g=vec2(wx*6., (q.y-street)*90.*(1.-fl*.2));
      vec2 gi=floor(g), gf=fract(g);
      float lit=step(.62-.15*uEnergy, hash(gi+id))*step(.25,gf.x)*step(gf.x,.75)*step(.3,gf.y)*step(gf.y,.8);
      float flick=.7+.3*sin(uTime*(.5+hash(gi)*2.)+id);
      vec3 wc=mix(vec3(1.,.82,.55), uC3, step(.8,hash(gi*1.7+id)));
      b+=wc*lit*flick*(.55-fl*.12);
      // neon sign
      float sign=step(.84,hash1(id*3.3))*step(.35,wx)*step(wx,.6)*step(top-.12,q.y)*step(q.y,top-.03);
      vec3 sc=mix(uC2,uC3,step(.5,hash1(id*5.1)));
      b+=sc*sign*(1.3+.9*uBeat);
      // rim light on the roofline
      b+=sc*.5*exp(-(top-q.y)*220.)*.6;
      layer=mix(layer,b,1.);
      alpha=1.;
    }
  }
  c=mix(c, layer, alpha);
  c+=uC2*.10*exp(-abs(uv.y-street-.05)*14.)*(1.+uEnergy);
  if(refl){ c*=.55; c+=uC3*.06; c=mix(c, uC4, .25+(street-uv.y)*1.5); }
  if(uV>1.5){
    vec2 rp=vec2(uv.x*uRes.x/uRes.y*60.+uv.y*14., uv.y*6.+uTime*4.);
    float rain=step(.965, noise(vec2(rp.x, floor(rp.y*4.))))*.35;
    c+=vec3(.6,.75,1.)*rain;
    c=mix(c, uC0*.6+vec3(.04,.06,.1), .18+.12*smoothstep(.4,0.,uv.y));
  }
  return c;
}`,
  nebula: `
vec3 world(vec2 uv, vec2 p){
  float t=uTime*.012;
  float a=t*.6; mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 q=R*(p*1.6)+vec2(0.,.25);
  vec2 w=vec2(fbm(q*1.3+t), fbm(q*1.3-t+5.2));
  float n=fbm(q*1.8+w*1.6+vec2(t*2.,0.));
  float m=fbm(q*3.5+w*2.4-t);
  vec3 c=uC3;
  c=mix(c, uC2*1.4, smoothstep(.2,.65,n));
  c=mix(c, uC0, smoothstep(.45,.85,n*m*1.6));
  c=mix(c, uC1, smoothstep(.62,.95,m)*.8);
  float dust=smoothstep(.45,.7,fbm(q*5.+w*3.));
  c*=1.-dust*.45;
  float core=exp(-length(p-vec2(.15,.35))*3.2);
  c+=uC4*core*.35*(1.+.6*uBeat*uEnergy);
  c=pow(c,vec3(.85))*1.35;
  c*=.85+.35*uEnergy;
  vec2 sp=uv*vec2(uRes.x/uRes.y,1.);
  c+=vec3(stars(sp*55.,.10,1.4))*.9;
  c+=vec3(stars(sp*140.+3.,.05,2.))*.6;
  float big=stars(sp*16.+11.,.03,.6); c+=uC4*big*1.2;
  return c;
}`,
  crystal: `
vec2 vor(vec2 x){ vec2 n=floor(x), f=fract(x); float d1=8., d2=8.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(i,j); vec2 o=vec2(hash(n+g),hash(n+g+19.));
    o=.5+.45*sin(uTime*.15+6.28*o); float d=length(g+o-f); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
  return vec2(d1,d2); }
vec3 world(vec2 uv, vec2 p){
  vec3 c=mix(uC3, uC2, smoothstep(0.,1.,uv.y)*.8);
  // crystal walls: faceted voronoi, brighter toward the edges of the screen
  vec2 v=vor(p*vec2(3.2,2.4)+vec2(0.,uTime*.01));
  float edge=smoothstep(.06,0.,v.y-v.x);
  float facet=hash(floor((p*vec2(3.2,2.4))*1.)+floor(v.x*4.));
  float side=smoothstep(.15,.95,abs(p.x)*1.4+ (1.-uv.y)*.4);
  vec3 cr=mix(uC0,uC1,facet)*(.3+.7*v.x)*side;
  c+=cr*1.15;
  c+=uC0*.15*smoothstep(.0,.6,1.-uv.y);
  c+=uC1*edge*side*(.55+.5*uBeat);
  // light shafts from above
  float sh=0.;
  for(int i=0;i<3;i++){ float fi=float(i); float x=p.x+ (1.-uv.y)*(.35-fi*.25)+fi*.3-.3;
    sh+=exp(-x*x*40.)*(.45+.25*sin(uTime*.3+fi*2.)); }
  c+=mix(uC1,uC4,.4)*sh*smoothstep(.0,1.,uv.y)*.35*(1.+uEnergy);
  // caustics on the floor
  float ca=pow(abs(sin(p.x*9.+sin(p.y*7.+uTime*.6))*sin(p.y*11.+uTime*.4)),6.);
  c+=uC1*ca*.18*smoothstep(.4,0.,uv.y);
  // floating sparkles
  vec2 sp=uv*vec2(uRes.x/uRes.y,1.)*40.+vec2(0.,-uTime*.6);
  c+=uC4*stars(sp,.05,3.)*1.1;
  return c;
}`,
  sunset: `
vec3 world(vec2 uv, vec2 p){
  float hz=.38;
  vec3 c;
  if(uv.y>hz){
    float y=(uv.y-hz)/(1.-hz);
    c=mix(uC1, uC2, smoothstep(0.,.55,y));
    c=mix(c, uC3, smoothstep(.45,1.,y));
    c+=vec3(stars(uv*vec2(uRes.x/uRes.y,1.)*70.,.08,1.))*smoothstep(.35,.8,y)*(uV==1.?1.:.45);
    // sun
    vec2 sc=vec2(p.x, uv.y-hz-.17);
    float r=length(sc*vec2(1.,1.15));
    float sun=smoothstep(.215,.205,r);
    float band=step(.5, fract((sc.y+.2)*28.-uTime*.25)) + step(.0,sc.y);
    sun*=clamp(band,0.,1.)*step(-.2,sc.y);
    vec3 suncol=mix(uC1, uC0, smoothstep(-.2,.2,sc.y));
    c=mix(c, suncol*1.15, sun);
    c+=uC0*exp(-r*5.)*.45*(1.+.5*uBeat);
    // mountains
    float m1=hz+.06+.10*fbm(vec2(p.x*2.2+3., 1.))*(1.-.4*abs(p.x));
    float m2=hz+.03+.07*fbm(vec2(p.x*4.+11., 2.));
    if(uv.y<m1){ c=mix(uC3*.6, uC2*.25, .4); c+=uC4*exp(-(m1-uv.y)*90.)*.7; }
    if(uv.y<m2){ c=uC3*.35; c+=uC4*exp(-(m2-uv.y)*120.)*.5; }
  } else {
    // perspective grid floor
    float d=max(hz-uv.y,.0005);
    float z=.32/d;                       // distance into the screen
    float gx=p.x*z*1.6;                  // lines across
    float gz=z*.9+uTime*1.4;             // lines toward you, rolling in
    float wx=z*1.6/uRes.y*1.6, wz=.32*.9/(d*d)/uRes.y*1.6; // one pixel in grid units
    float lx=abs(fract(gx+.5)-.5), lz=abs(fract(gz)-.5);
    float line=max(1.-smoothstep(wx*.6,wx*1.8+.015,lx), 1.-smoothstep(wz*.6,wz*1.8+.015,lz));
    line*=smoothstep(.0,.05,d)*(1.-smoothstep(.6,2.,wz));
    c=mix(uC3*.35, uC3*.8, clamp(d*2.,0.,1.));
    c+=uC4*line*(1.1+.9*uBeat);
    c+=uC4*.12*exp(-d*30.);
    c+=uC0*exp(-d*14.)*.5;
  }
  return c;
}`,
};

// fwidth needs an extension in WebGL1; a cheap stand-in for the grid's line width
const FWIDTH = 'float fwidthFallback(float x){ return 0.02; }\n';

const TAIL = `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  if(uGlitch>0.){ float b=floor(uv.y*14.+floor(uTime*30.)); uv.x+=(hash1(b)-.5)*.06*uGlitch*step(.6,hash1(b*1.7)); }
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 c=world(uv,p);
  c*=1.+uBeat*.10*(.4+uEnergy);
  float wv=exp(-pow((uv.y-uWave.x)*5.,2.))*uWave.y;
  c+=wv*spectrum(uv.x*.8+uWave.z+uTime*.05)*.55;
  c+=c*uBloom*.55+spectrum(uv.y*.5+uTime*.03)*uBloom*.06;
  c=hueRot(c,uHue);
  float l=dot(c,vec3(.299,.587,.114));
  c=mix(c, vec3(l)*vec3(.62,.8,1.15), uDanger*.7);
  vec2 vq=uv-.5;
  float vig=1.-dot(vq,vq)*(1.1+uDanger*2.6+uDuel*1.4);
  c*=clamp(vig,0.,1.);
  c=mix(c, pow(max(c,0.),vec3(1.3))*1.25, uDuel*.6);
  c=c/(1.+c*.35);
  gl_FragColor=vec4(c,uAlpha);
}`;

const hex3 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
// world resolution per tier, as a fraction of the screen's real pixels (DPR capped at 2): soft backgrounds
// don't need full resolution, but on a 3× phone the old CSS-pixel scale came out blurry
const TIERS = [0.24, 0.34, 0.45];

export function createWorlds(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const programs = {};
  let tier = 2;
  let cur = null;   // { id, variant, prog }
  let prev = null;  // fading out
  let mixT = 1;
  let mixStart = 0;
  const MIX_S = 3.2;
  const u = { beat: 0, energy: 0.5, bloom: 0, hue: 0, danger: 0, glitch: 0, duel: 0, wave: [0, 0, 0] };
  let w = 0, hgt = 0;
  let lost = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; for (const k of Object.keys(programs)) delete programs[k]; gl.bindBuffer(gl.ARRAY_BUFFER, buf = gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); });

  function compile(id) {
    if (programs[id]) return programs[id];
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('world shader', id, gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, HEAD + FWIDTH + BODY[id] + TAIL);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('world link', gl.getProgramInfoLog(p)); return null; }
    const loc = {};
    for (const n of ['uRes', 'uTime', 'uBeat', 'uEnergy', 'uBloom', 'uHue', 'uDanger', 'uGlitch', 'uDuel', 'uAlpha', 'uV', 'uQ', 'uWave', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4']) loc[n] = gl.getUniformLocation(p, n);
    programs[id] = { p, loc };
    return programs[id];
  }

  // measured once and on resize — never per frame (reading layout every frame forces a style + layout pass)
  let cssW = 0, cssH = 0;
  const measure = () => { const r = canvas.getBoundingClientRect(); cssW = r.width; cssH = r.height; w = 0; };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(canvas);
  function resize() {
    if (w) return;
    const s = TIERS[tier] * Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(64, Math.round(cssW * s));
    hgt = Math.max(64, Math.round(cssH * s));
    canvas.width = w; canvas.height = hgt;
  }

  function draw(world, alpha, time) {
    const pr = world.prog;
    if (!pr) return;
    gl.useProgram(pr.p);
    const L = pr.loc;
    const v = WORLDS[world.id].variants[world.variant];
    gl.uniform2f(L.uRes, w, hgt);
    gl.uniform1f(L.uTime, time % 3600);
    gl.uniform1f(L.uBeat, u.beat);
    gl.uniform1f(L.uEnergy, u.energy);
    gl.uniform1f(L.uBloom, u.bloom);
    gl.uniform1f(L.uHue, u.hue);
    gl.uniform1f(L.uDanger, u.danger);
    gl.uniform1f(L.uGlitch, u.glitch);
    gl.uniform1f(L.uDuel, u.duel);
    gl.uniform1f(L.uAlpha, alpha);
    gl.uniform1f(L.uV, v.v);
    gl.uniform1f(L.uQ, tier + 1);
    gl.uniform3f(L.uWave, u.wave[0], u.wave[1], u.wave[2]);
    v.c.forEach((c, i) => gl.uniform3fv(L[`uC${i}`], hex3(c)));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    /** worldId + variant index; crossfades from the current one */
    setWorld(id, variant = 0, time = 0) {
      if (!WORLDS[id]) id = 'aurora';
      if (cur && cur.id === id && cur.variant === variant) return;
      const next = { id, variant, prog: compile(id) };
      if (cur) { prev = cur; mixT = 0; mixStart = time; } else mixT = 1;
      cur = next;
    },
    set(v) { Object.assign(u, v); },
    setTier(t) { tier = Math.max(0, Math.min(2, t)); w = 0; },
    get tier() { return tier; },
    current: () => cur && { id: cur.id, variant: cur.variant, mixing: mixT < 1 },
    render(time) {
      if (lost || !cur) return;
      resize();
      gl.viewport(0, 0, w, hgt);
      if (prev && mixT < 1) {
        mixT = Math.min(1, (time - mixStart) / MIX_S);
        gl.disable(gl.BLEND);
        draw(prev, 1, time);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        const e = mixT * mixT * (3 - 2 * mixT);
        draw(cur, e, time);
        gl.disable(gl.BLEND);
        if (mixT >= 1) prev = null;
      } else {
        gl.disable(gl.BLEND);
        draw(cur, 1, time);
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

/** Seeded variant (0–2) for a song in a match: everyone sees the same one. */
export function variantFor(seed, songIndex, hashFn) {
  return hashFn(`${seed}:world:${songIndex}`) % 3;
}
