// SPLIT A CLOSURE (CITY 1.0 OUT, Group 3 — the big files' split): moves a run of whole statements out of a big closure (title.js's
// createTitle, scene.js's createHarbor) into a factory in its own file, WITHOUT a behaviour change. The body moves as-is; only names are
// rewired, through live accessors (a getter per name read, a setter per name written), so every read and write sees the same variable
// it did before:
//   · a name the section reads from the rest of the closure (or from the module's own top: its consts, helpers)  →  T.name
//     (T = the context the closure hands the factory at the section's old place: { get name() { return name; }, set name(v) { … } })
//   · a name the section declares that the rest of the closure uses                                              →  <inst>.name
//   · the imports the section uses are copied into the new file (paths re-pointed from the new file's folder)
// Scope-exact: every identifier is resolved through a scope chain (function + block scopes, params, catch, var hoisting) built on acorn —
// a local `st` inside a moved function stays local. Refuses a cut that splits a statement, and an outside use that runs at the closure's
// own top level BEFORE the section (it would meet the factory's const before it exists).
//   node scripts/split-closure.mjs <file> <fnName> <fromLine> <toLine> <newFile> <factoryName> <instName> [--dry]
// Needs tests/integration's node_modules (acorn) — a dev tool, never shipped. Review the diff; run the tests + pixdiff after.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { posix as P } from 'node:path';
const require = createRequire(new URL('../tests/integration/package.json', import.meta.url));
const acorn = require('acorn');
const [file, fnName, a, b, newFile, factory, inst] = process.argv.slice(2), DRY = process.argv.includes('--dry');
const from = +a, to = +b;
const src = readFileSync(file, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true, ranges: true });
const lineOf = n => n.loc.start.line, endLine = n => n.loc.end.line;

// ---- scopes
const KEYS = n => Object.keys(n).filter(k => k !== 'loc' && k !== 'range' && n[k] && typeof n[k] === 'object');
function children(n) { const out = []; for (const k of KEYS(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && out.push(x)); else if (typeof v.type === 'string') out.push(v); } return out; }
const parents = new Map();
(function link(n, p) { parents.set(n, p); for (const c of children(n)) link(c, n); })(ast, null);
const isFn = n => /Function/.test(n.type);
const patIds = (p, out = []) => { if (!p) return out; if (p.type === 'Identifier') out.push(p); else if (p.type === 'ObjectPattern') p.properties.forEach(q => patIds(q.type === 'RestElement' ? q.argument : q.value, out)); else if (p.type === 'ArrayPattern') p.elements.forEach(e => patIds(e, out)); else if (p.type === 'RestElement') patIds(p.argument, out); else if (p.type === 'AssignmentPattern') patIds(p.left, out); return out; };
const scopes = new Map();   // node → Map(name → declaring Identifier)
const scopeOf = n => { if (!scopes.has(n)) scopes.set(n, new Map()); return scopes.get(n); };
const fnScopeNode = n => { let x = parents.get(n); while (x && !isFn(x) && x.type !== 'Program') x = parents.get(x); return x; };
const blockScopeNode = n => { let x = parents.get(n); while (x && !(x.type === 'BlockStatement' || x.type === 'Program' || isFn(x) || x.type === 'ForStatement' || x.type === 'ForInStatement' || x.type === 'ForOfStatement' || x.type === 'SwitchStatement' || x.type === 'CatchClause' || x.type === 'StaticBlock')) x = parents.get(x); return x; };
const declIds = new Set();
(function declare(n) {
  if (n.type === 'VariableDeclaration') {
    const target = n.kind === 'var' ? fnScopeNode(n) : blockScopeNode(n);
    for (const d of n.declarations) for (const id of patIds(d.id)) { scopeOf(target).set(id.name, id); declIds.add(id); }
  } else if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') {
    if (n.id) { scopeOf(blockScopeNode(n)).set(n.id.name, n.id); declIds.add(n.id); }
  }
  if (isFn(n)) { for (const p of n.params) for (const id of patIds(p)) { scopeOf(n).set(id.name, id); declIds.add(id); } if (n.type === 'FunctionExpression' && n.id) { scopeOf(n).set(n.id.name, n.id); declIds.add(n.id); } }
  if (n.type === 'CatchClause' && n.param) for (const id of patIds(n.param)) { scopeOf(n).set(id.name, id); declIds.add(id); }
  if (n.type === 'ImportDeclaration') for (const s of n.specifiers) { scopeOf(ast).set(s.local.name, s.local); declIds.add(s.local); }
  for (const c of children(n)) declare(c);
})(ast);
// a function's body block shares the function's scope for params; resolve walks every ancestor with a scope map
function resolve(id) { let x = parents.get(id); while (x) { const m = scopes.get(x); if (m && m.has(id.name)) return m.get(id.name); x = parents.get(x); } return null; }
// a reference = an Identifier that isn't a declaration's own name, a property key, a member's name, a label
function isRef(id) {
  if (declIds.has(id)) return false;
  const p = parents.get(id);
  if (!p) return false;
  if (p.type === 'MemberExpression' && p.property === id && !p.computed) return false;
  if ((p.type === 'Property' || p.type === 'MethodDefinition' || p.type === 'PropertyDefinition') && p.key === id && !p.computed && !(p.type === 'Property' && p.shorthand)) return false;
  if (p.type === 'LabeledStatement' || p.type === 'BreakStatement' || p.type === 'ContinueStatement') return false;
  if (p.type === 'ImportSpecifier' || p.type === 'ImportDefaultSpecifier' || p.type === 'ImportNamespaceSpecifier' || p.type === 'ExportSpecifier') return false;
  if (p.type === 'MetaProperty') return false;
  return true;
}
const isWrite = id => { const p = parents.get(id); return (p.type === 'AssignmentExpression' && p.left === id) || p.type === 'UpdateExpression'
  || (p.type === 'ArrayPattern' || p.type === 'ObjectPattern' || (p.type === 'Property' && parents.get(p) && parents.get(p).type === 'ObjectPattern')); };

// ---- the function + the cut
let fn = null;
(function find(n) { if (fn) return; if (n.type === 'FunctionDeclaration' && n.id && n.id.name === fnName) { fn = n; return; } for (const c of children(n)) find(c); })(ast);
if (!fn) throw new Error(`no function ${fnName}`);
const body = fn.body.body;
for (const s of body) { const l0 = lineOf(s), l1 = endLine(s); if ((l0 < from && l1 >= from) || (l0 <= to && l1 > to)) throw new Error(`a statement crosses the cut: lines ${l0}–${l1}`); }
const sec = body.filter(s => lineOf(s) >= from && endLine(s) <= to);
if (!sec.length) throw new Error('no whole statements in the range');
// the cut runs from the end of the statement before (keeps the comments above the first moved statement with it) to the last's end
const firstIdx = body.indexOf(sec[0]), prevEnd = firstIdx ? body[firstIdx - 1].end : fn.body.start + 1;
const secStart = (() => { const i = src.indexOf('\n', prevEnd); return i < 0 ? prevEnd : i + 1; })(), secEnd = sec[sec.length - 1].end;
const inSec = pos => pos >= secStart && pos < secEnd;
const fnScope = scopes.get(fn.body) || new Map(), modScope = scopes.get(ast);
const closureDecl = id => [...fnScope.values()].includes(id);
const moduleDecl = id => modScope && [...modScope.values()].includes(id) && !(parents.get(id) && /^Import/.test(parents.get(id).type));
const importDecl = id => parents.get(id) && /^Import/.test(parents.get(id).type);

// ---- the rewiring
const edits = [], needT = new Map(), needOut = new Map(), importsUsed = new Map(), early = [];
const bump = (map, name, w) => { const m = map.get(name) || { r: 0, w: 0 }; if (w) m.w++; else m.r++; map.set(name, m); };
(function visit(n) {
  if (n.type === 'Identifier' && isRef(n)) {
    const d = resolve(n), p = parents.get(n), shorthand = p.type === 'Property' && p.shorthand && p.value === n;
    const text = obj => (shorthand ? `${n.name}: ${obj}.${n.name}` : `${obj}.${n.name}`);
    const at = shorthand ? { pos: p.start, end: p.end } : { pos: n.start, end: n.end };
    if (inSec(n.start)) {
      if (d && importDecl(d)) { const decl = parents.get(parents.get(d)); if (!importsUsed.has(decl)) importsUsed.set(decl, new Set()); importsUsed.get(decl).add(n.name); }
      else if (d && !inSec(d.start) && (closureDecl(d) || moduleDecl(d))) {
        bump(needT, n.name, isWrite(n)); edits.push({ ...at, text: text('T') });
        // runs at the factory's own top level (no function between) and reads a closure let / const declared AFTER the section → TDZ
        let x = parents.get(n), inner = false; while (x && x !== fn.body) { if (isFn(x)) { inner = true; break; } x = parents.get(x); }
        const lexical = closureDecl(d) && parents.get(d) && parents.get(d).type === 'VariableDeclarator';
        if (!inner && lexical && d.start > secEnd) early.push(`T.${n.name} @ line ${lineOf(n)} (declared later, at line ${lineOf(d)})`);
      }
    } else if (n.start > fn.body.start && n.start < fn.body.end && d && closureDecl(d) && inSec(d.start)) {
      bump(needOut, n.name, isWrite(n)); edits.push({ ...at, text: text(inst) });
      // runs at the closure's top level (no function between it and the closure) before the section → it would meet the factory's TDZ
      let x = parents.get(n), inner = false; while (x && x !== fn.body) { if (isFn(x)) { inner = true; break; } x = parents.get(x); }
      if (!inner && n.start < secStart) early.push(`${n.name} @ line ${lineOf(n)}`);
    }
  }
  for (const c of children(n)) visit(c);
})(ast);
if (early.length) throw new Error(`used at the closure's top level BEFORE the section (TDZ): ${early.join(', ')}`);
// a moved declaration that collides with a T name can't happen (T only holds names declared outside); a moved name used outside + also
// declared in the section's nested scope is fine (the resolver tells them apart)
const apply = (text, base, list) => { let out = text; for (const e of [...list].sort((x, y) => y.pos - x.pos)) out = out.slice(0, e.pos - base) + e.text + out.slice(e.end - base); return out; };
const secText = apply(src.slice(secStart, secEnd), secStart, edits.filter(e => inSec(e.pos)));
const acc = (map, obj) => [...map.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([k, m]) => `get ${k}() { return ${obj}${k}; }${m.w ? `, set ${k}(v) { ${obj}${k} = v; }` : ''}`);
const ctx = `  // (${P.basename(newFile)}: moved out by scripts/split-closure.mjs — T carries the names it shares with this closure, live)\n  const ${inst} = ${factory}({\n${acc(needT, '').map(x => `    ${x},`).join('\n')}\n  });\n`;
const relSpec = spec => { if (!spec.startsWith('.')) return spec; const r = P.relative(P.dirname(newFile), P.join(P.dirname(file), spec)); return r.startsWith('.') ? r : `./${r}`; };
const importLines = [...importsUsed.entries()].map(([decl, names]) => {
  const def = decl.specifiers.find(s => s.type === 'ImportDefaultSpecifier' && names.has(s.local.name));
  const ns = decl.specifiers.find(s => s.type === 'ImportNamespaceSpecifier' && names.has(s.local.name));
  const named = decl.specifiers.filter(s => s.type === 'ImportSpecifier' && names.has(s.local.name)).map(s => (s.imported.name === s.local.name ? s.local.name : `${s.imported.name} as ${s.local.name}`));
  const parts = [def && def.local.name, ns && `* as ${ns.local.name}`, named.length && `{ ${named.join(', ')} }`].filter(Boolean);
  return `import ${parts.join(', ')} from '${relSpec(decl.source.value)}';`;
});
const dedent = t => t.split('\n').map(l => (l.startsWith('  ') ? l.slice(2) : l)).join('\n');
const newSrc = `${importLines.join('\n')}\n\n/** ${factory}(T) — moved out of ${P.basename(file)}#${fnName} by scripts/split-closure.mjs (no behaviour change): T carries the names it shares\n *  with that closure, live (getters + setters); what it returns, the closure reads as ${inst}.<name>. */\nexport function ${factory}(T) {\n${dedent(secText).split('\n').map(l => (l ? `  ${l}` : l)).join('\n')}\n  return {\n${acc(needOut, '').map(x => `    ${x},`).join('\n')}\n  };\n}\n`;
let out = apply(src, 0, edits.filter(e => !inSec(e.pos)).concat([{ pos: secStart, end: secEnd, text: ctx.replace(/\n$/, '') }]));
const lastImport = ast.body.filter(s => s.type === 'ImportDeclaration').pop();
const ls = (() => { const i = src.indexOf('\n', lastImport.end); return i < 0 ? src.length : i + 1; })();
out = out.slice(0, ls) + `import { ${factory} } from './${P.basename(newFile)}';\n` + out.slice(ls);
console.log(`lines ${lineOf(sec[0])}–${endLine(sec[sec.length - 1])} (${sec.length} statements, ${secText.split('\n').length} lines) → ${newFile} ${factory}(T)`);
console.log(`T (${needT.size}): ${[...needT.entries()].map(([k, m]) => `${k}${m.w ? '(w)' : ''}`).join(' ')}`);
console.log(`${inst}.* (${needOut.size}): ${[...needOut.entries()].map(([k, m]) => `${k}${m.w ? '(w)' : ''}`).join(' ')}`);
console.log(`imports: ${importLines.join(' | ')}`);
if (!DRY) { writeFileSync(newFile, newSrc); writeFileSync(file, out); }
