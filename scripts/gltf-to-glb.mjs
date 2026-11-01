// A .gltf (+ its .bin + texture files) → ONE .glb (the bake harness serves single .glb files — scripts/bake-model.mjs). No deps: the
// buffers + images are packed into the GLB's binary chunk (images as bufferView-backed PNG / JPEG), the JSON re-pointed.
//   node scripts/gltf-to-glb.mjs <in.gltf> <out.glb>
import fs from 'node:fs';
import path from 'node:path';

const [inp, out] = process.argv.slice(2);
if (!inp || !out) { console.error('usage: node scripts/gltf-to-glb.mjs <in.gltf> <out.glb>'); process.exit(1); }
const dir = path.dirname(inp), g = JSON.parse(fs.readFileSync(inp, 'utf8'));
const pad4 = n => (n + 3) & ~3;
const chunks = [];
let off = 0;
const add = buf => { const at = off; chunks.push(buf); const p = pad4(buf.length) - buf.length; if (p) chunks.push(Buffer.alloc(p)); off += pad4(buf.length); return at; };
// every buffer → one place in the binary chunk; its bufferViews shifted by where it landed
const bufAt = (g.buffers || []).map(b => add(b.uri.startsWith('data:') ? Buffer.from(b.uri.split(',')[1], 'base64') : fs.readFileSync(path.join(dir, decodeURIComponent(b.uri)))));
for (const v of g.bufferViews || []) { v.byteOffset = (v.byteOffset || 0) + bufAt[v.buffer]; v.buffer = 0; }
// every image with a uri → a bufferView of its own
for (const im of g.images || []) {
  if (!im.uri) continue;
  const file = path.join(dir, decodeURIComponent(im.uri)), data = fs.readFileSync(file), at = add(data);
  g.bufferViews.push({ buffer: 0, byteOffset: at, byteLength: data.length });
  im.bufferView = g.bufferViews.length - 1; im.mimeType = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png'; delete im.uri;
}
const bin = Buffer.concat(chunks);
g.buffers = [{ byteLength: bin.length }];
let json = Buffer.from(JSON.stringify(g), 'utf8');
json = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)]);
const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([head, jh, json, bh, bin]));
console.log(out, (12 + 16 + json.length + bin.length), 'bytes');
