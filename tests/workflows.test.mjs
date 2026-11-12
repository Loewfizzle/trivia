// FR6 FIXES A (G5) — THE CLOUD TRIGGER. LOBBY 2.0 B's tagged final push was ONE docs commit (every code group had gone up untagged
// earlier): GitHub's `paths:` / `paths-ignore` filter judged that push's diff, matched nothing and created NO run at all — before the
// `if:` could read the tag. The fix: no path filter on push; the TAG decides (the top commit's message, like Vercel's ignoreCommand, or any
// commit's in the push). This test reads the two workflows and EVALUATES their own `if:` + concurrency expressions (a small evaluator for the
// GitHub expression syntax they use) against simulated events — no cloud minutes spent to prove it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(`.github/workflows/${f}`, root), 'utf8');

// ── a tiny evaluator for GitHub's expressions (identifiers with . and .*., 'strings', ( ), ||, &&, ==, !=, !, contains(), join(), format())
function tokens(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") { let j = i + 1, s = ''; for (;;) { if (src[j] === "'" && src[j + 1] === "'") { s += "'"; j += 2; continue; } if (src[j] === "'") break; s += src[j++]; } out.push({ t: 'str', v: s }); i = j + 1; continue; }
    const two = src.slice(i, i + 2);
    if (['||', '&&', '==', '!='].includes(two)) { out.push({ t: 'op', v: two }); i += 2; continue; }
    if ('()!,'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    const m = /^[A-Za-z_][\w-]*(?:\.(?:\*|[A-Za-z_][\w-]*))*/.exec(src.slice(i));
    if (!m) throw new Error(`can't read the expression at: ${src.slice(i, i + 30)}`);
    out.push({ t: 'id', v: m[0] }); i += m[0].length;
  }
  return out;
}
function evaluate(src, ctx) {
  const tk = tokens(src); let k = 0;
  const peek = () => tk[k], eat = (v) => { const t = tk[k++]; if (v && t?.v !== v) throw new Error(`wanted ${v}, got ${t?.v}`); return t; };
  const lookup = (path) => {
    if (path === 'true') return true; if (path === 'false') return false;
    let vals = [ctx], spread = false;
    for (const part of path.split('.')) {
      if (part === '*') { vals = vals.flatMap(v => (Array.isArray(v) ? v : [])); spread = true; continue; }
      vals = vals.map(v => (v == null ? undefined : v[part]));
    }
    return spread ? vals : vals[0];
  };
  const fns = {
    contains: (a, b) => Array.isArray(a) ? a.includes(b) : String(a ?? '').toLowerCase().includes(String(b).toLowerCase()),
    join: (a, sep = ',') => (Array.isArray(a) ? a.join(sep) : String(a ?? '')),
    format: (f, ...a) => f.replace(/\{(\d+)\}/g, (_, n) => a[n]),
    fromJSON: (s) => JSON.parse(s),
  };
  const primary = () => {
    const t = eat();
    if (t.t === 'str') return t.v;
    if (t.v === '(') { const v = or(); eat(')'); return v; }
    if (t.v === '!') return !primary();
    if (t.t === 'id' && peek()?.v === '(') {
      eat('('); const args = [];
      while (peek()?.v !== ')') { args.push(or()); if (peek()?.v === ',') eat(','); }
      eat(')');
      assert.ok(fns[t.v], `unknown function ${t.v}`);
      return fns[t.v](...args);
    }
    return lookup(t.v);
  };
  const cmp = () => { let a = primary(); while (['==', '!='].includes(peek()?.v)) { const o = eat().v, b = primary(); a = o === '==' ? a === b : a !== b; } return a; };
  const and = () => { let a = cmp(); while (peek()?.v === '&&') { eat(); const b = cmp(); a = a ? b : a; } return a; };
  const or = () => { let a = and(); while (peek()?.v === '||') { eat(); const b = and(); a = a || b; } return a; };
  const v = or();
  assert.equal(k, tk.length, `unread tokens in ${src}`);
  return v;
}
const ifs = (yml) => [...yml.matchAll(/^\s+if: (github\..+)$/gm)].map(m => m[1]);
const group = (yml) => /group: [\w-]+\$\{\{ github\.ref \}\}-\$\{\{ (.+) \}\}\s*$/m.exec(yml)[1];
const pushBlock = (yml) => /^ {2}push:\n((?: {4}.*\n|\s*#.*\n)*)/m.exec(yml)[1];

// the events
const push = (...messages) => ({
  event_name: 'push',
  event: { head_commit: { message: messages.at(-1) }, commits: messages.map(message => ({ message })) },
});
const TAG = { ci: '[' + 'ci]', harbor: '[' + 'harbor]' };       // (built, so this file never carries a tag by accident)
const B2_FINAL = push(`LOBBY 2.0 B: the end — docs/harbor/passes/lobby-2b.md ${TAG.harbor}`);   // the push that never ran
const UNTAGGED_CODE = push('FR6 FIXES A — Group 1: the dogs keep one look');
const UNTAGGED_DOCS = push('docs: plan.md — the owner\'s notes');
const CI_PASS = push('a game pass, its code', `the end ${TAG.ci}`);
const HARBOR_DEEP = push(`an early commit ${TAG.harbor}`, 'then an untagged one on top');
const DISPATCH = { event_name: 'workflow_dispatch', event: {} };
const PR = { event_name: 'pull_request', event: {} };
const runs = (yml, ev) => ifs(yml).every(e => evaluate(e, { github: ev }));

for (const f of ['harbor.yml', 'tests.yml']) {
  test(`${f}: no path filter on push (it drops a tagged docs-only push before the tag is read)`, () => {
    const block = pushBlock(read(f));
    assert.doesNotMatch(block, /^\s+paths(-ignore)?:/m, `${f}'s push trigger still filters by path:\n${block}`);
  });
}

test('harbor.yml: a tagged push runs whatever it touched — LOBBY 2.0 B\'s docs-only final push included', () => {
  const y = read('harbor.yml');
  assert.ok(ifs(y).length >= 1);
  assert.equal(runs(y, B2_FINAL), true, '2B\'s final push must run the harbor suite');
  assert.equal(runs(y, HARBOR_DEEP), true, 'a tag on any commit of the push still counts');
  assert.equal(runs(y, DISPATCH), true, 'Run workflow by hand');
  assert.equal(runs(y, UNTAGGED_CODE), false, 'an untagged push = skipped (0 minutes)');
  assert.equal(runs(y, UNTAGGED_DOCS), false);
  assert.equal(runs(y, CI_PASS), false, 'the game tag runs tests.yml only');
  assert.equal(evaluate(group(y), { github: B2_FINAL }), 'full', 'a tagged push is a FULL run (a skipped push never cancels it)');
  assert.equal(evaluate(group(y), { github: UNTAGGED_CODE }), 'skip');
});

test('tests.yml: either tag runs it, docs-only or not; an untagged push skips; a PR + by hand always run', () => {
  const y = read('tests.yml');
  assert.ok(ifs(y).length >= 2);
  assert.equal(runs(y, B2_FINAL), true);
  assert.equal(runs(y, CI_PASS), true);
  assert.equal(runs(y, HARBOR_DEEP), true);
  assert.equal(runs(y, PR), true);
  assert.equal(runs(y, DISPATCH), true);
  assert.equal(runs(y, UNTAGGED_CODE), false);
  assert.equal(runs(y, UNTAGGED_DOCS), false);
  assert.equal(evaluate(group(y), { github: B2_FINAL }), 'full');
  assert.equal(evaluate(group(y), { github: UNTAGGED_DOCS }), 'skip');
});

test('the evaluator itself: the OLD harbor rule + its path filter really dropped 2B\'s push', () => {
  // the old if: alone would have said "run" — it was the path filter (no run created) that lost it; the old filter matched no file of it
  const oldIf = "github.event_name == 'workflow_dispatch' || contains(join(github.event.commits.*.message, ' '), '" + TAG.harbor + "')";
  assert.equal(evaluate(oldIf, { github: B2_FINAL }), true);
  const oldPaths = ['js/screens/harbor/**', 'js/core/harbor-*.js', 'index.html', 'database.rules.json', 'tests/integration/harbor-e2e/**'];
  const glob = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*') + '$');
  assert.equal(oldPaths.some(g => glob(g).test('docs/harbor/passes/lobby-2b.md')), false);
});

// FR7 FIXES B — THE PRIVATE-REPO WORKFLOW (D1, the owner: no self-hosted runner): the workflows read the repo's OWN visibility. PUBLIC =
// exactly as before; PRIVATE = a pass's final push runs only the LIGHT tests workflow (unit → rules → /api → smoke), the harbor workflow
// skips itself on a push (by hand still runs it).
const vis = (ev, priv) => ({ ...ev, event: { ...ev.event, repository: { private: priv } } });
test('THE PRIVATE-REPO WORKFLOW — public: exactly as before (both workflows, both tags)', () => {
  const h = read('harbor.yml'), t = read('tests.yml');
  for (const ev of [B2_FINAL, HARBOR_DEEP]) { assert.equal(runs(h, vis(ev, false)), true); assert.equal(runs(t, vis(ev, false)), true); }
  assert.equal(runs(t, vis(CI_PASS, false)), true);
  assert.equal(runs(h, vis(UNTAGGED_CODE, false)), false);
  assert.equal(evaluate(group(h), { github: vis(B2_FINAL, false) }), 'full');
});
test('THE PRIVATE-REPO WORKFLOW — private: the harbor workflow never runs on a push (by hand it does); the light tests workflow does', () => {
  const h = read('harbor.yml'), t = read('tests.yml');
  assert.equal(runs(h, vis(B2_FINAL, true)), false, 'a harbor-tagged push of a PRIVATE repo: no cloud Harbor run');
  assert.equal(runs(h, vis(HARBOR_DEEP, true)), false);
  assert.equal(runs(h, vis(DISPATCH, true)), true, 'gh workflow run harbor still works');
  assert.equal(evaluate(group(h), { github: vis(B2_FINAL, true) }), 'skip', 'a skipped push never cancels a by-hand run');
  assert.equal(runs(t, vis(B2_FINAL, true)), true, 'the harbor tag runs the LIGHT tests workflow instead');
  assert.equal(runs(t, vis(CI_PASS, true)), true);
  assert.equal(runs(t, vis(UNTAGGED_CODE, true)), false, 'an untagged push still skips');
  // the light set: CONN + presence only while public (the step's shell reads the visibility)
  assert.match(t, /PRIVATE_REPO: \$\{\{ github\.event\.repository\.private \}\}/);
  assert.match(t, /if \[ "\$PRIVATE_REPO" != "true" \]; then\n\s+node e2e-conn\.mjs[^\n]*\n\s+SHOTS=0 node e2e-presence\.mjs[^\n]*\n\s+fi/);
  for (const f of ['harbor.yml', 'tests.yml']) assert.match(read(f), /^permissions:\n {2}contents: read$/m, `${f}: read-only token`);
});
