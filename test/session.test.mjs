import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, inspect, render } from '../skills/grill-lavish/scripts/session.mjs';

const example = JSON.parse(await readFile(new URL('../examples/dashboard.session.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(example);
test('shows all independent questions while withholding dependent questions', () => {
  assert.deepEqual(inspect(fresh()).frontier, ['Q1', 'Q2']);
});
test('a settled prerequisite unlocks its next question', () => {
  const s = fresh(); s.decisions[0].status = 'resolved'; s.decisions[0].answer = 'Our immediate team';
  assert.deepEqual(inspect(s).frontier, ['Q2', 'Q3']);
});
test('research blocks dependent questions without hiding independent ones', () => {
  const s = fresh(); s.decisions[0].status = 'researching';
  assert.deepEqual(inspect(s).frontier, ['Q2']);
});
test('an excluded prerequisite does not silently unblock descendants', () => {
  const s = fresh(); s.decisions[0].status = 'excluded'; s.decisions[0].reason = 'Scope changed';
  s.decisions[1].status = 'resolved'; s.decisions[1].answer = 'Ownership';
  assert.equal(inspect(s).status, 'blocked');
});
test('research-only sessions are not considered complete', () => {
  const s = fresh(); s.decisions = [s.decisions[0]]; s.decisions[0].status = 'researching';
  assert.equal(inspect(s).status, 'research-needed');
});
test('an empty session is a draft, never completed', () => {
  const s = fresh(); s.decisions = []; assert.equal(inspect(s).status, 'draft');
});
test('fully resolved sessions still require user confirmation', () => {
  const s = fresh(); for (const d of s.decisions) { d.status = 'resolved'; d.answer = 'Explicit user answer'; }
  assert.equal(inspect(s).status, 'ready-for-confirmation');
});
test('rejects unknown dependencies, duplicate IDs, and cycles', () => {
  const a = fresh(); a.decisions[0].depends_on = ['missing']; assert.throws(() => validate(a), /Unknown dependency/);
  const b = fresh(); b.decisions[1].id = 'Q1'; assert.throws(() => validate(b), /Duplicate decision/);
  const c = fresh(); c.decisions[0].depends_on = ['Q3']; assert.throws(() => validate(c), /cycle/);
});
test('requires evidence of a recorded answer or exclusion reason', () => {
  const a = fresh(); a.decisions[0].status = 'resolved'; assert.throws(() => validate(a), /needs an answer/);
  const b = fresh(); b.decisions[0].status = 'excluded'; assert.throws(() => validate(b), /needs a reason/);
});
test('cannot retain a resolved descendant after reopening its prerequisite', () => {
  const s = fresh(); s.decisions[2].status = 'resolved'; s.decisions[2].answer = 'Shared access';
  assert.throws(() => validate(s), /unsettled prerequisite/);
});
test('untrusted text cannot terminate the embedded JSON script', async () => {
  const s = fresh(); s.goal = '</script><script>alert(1)</script> $&';
  const html = await render(s);
  assert.ok(!html.includes(s.goal));
  const data = html.match(/<script id="session-data" type="application\/json">(.*?)<\/script>/s)[1];
  assert.equal(JSON.parse(data).goal, s.goal);
  assert.deepEqual(JSON.parse(data).view.frontier, ['Q1', 'Q2']);
});
test('CLI init preserves an existing file and render preserves the input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'grill-lavish-'));
  const cli = fileURLToPath(new URL('../skills/grill-lavish/scripts/session.mjs', import.meta.url));
  try {
    const input = join(dir, 'session.json');
    assert.equal(spawnSync(process.execPath, [cli, 'init', input]).status, 0);
    const before = await readFile(input, 'utf8');
    assert.notEqual(spawnSync(process.execPath, [cli, 'init', input]).status, 0);
    assert.notEqual(spawnSync(process.execPath, [cli, 'render', input, input]).status, 0);
    assert.equal(await readFile(input, 'utf8'), before);
    const output = join(dir, 'review.html');
    assert.equal(spawnSync(process.execPath, [cli, 'render', input, output]).status, 0);
    assert.ok((await readFile(output, 'utf8')).includes('session-data'));
  } finally { await rm(dir, {recursive:true, force:true}); }
});
