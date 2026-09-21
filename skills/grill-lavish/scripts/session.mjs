import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const idPattern = /^[A-Za-z0-9_-]+$/;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

export function validate(state) {
  requireThat(state && typeof state === 'object', 'State must be an object');
  requireThat(state.schema_version === 2, 'Unsupported schema_version');
  requireThat(typeof state.session_id === 'string' && idPattern.test(state.session_id), 'Invalid session_id');
  for (const field of ['revision', 'round']) {
    requireThat(Number.isSafeInteger(state[field]) && state[field] > 0, `${field} must be a positive integer`);
  }
  requireThat(state.discussion_only === undefined || typeof state.discussion_only === 'boolean', 'discussion_only must be a boolean');
  requireThat(nonempty(state.goal), 'goal is required');
  requireThat(typeof state.summary === 'string', 'summary must be text');
  requireThat(Array.isArray(state.facts), 'facts must be an array');
  for (const fact of state.facts) {
    requireThat(fact && nonempty(fact.statement) && nonempty(fact.source), 'Facts need statement and source');
  }
  requireThat(Array.isArray(state.decisions), 'decisions must be an array');
  const byId = new Map();
  for (const decision of state.decisions) {
    requireThat(decision && typeof decision.id === 'string' && idPattern.test(decision.id), 'Invalid decision ID');
    requireThat(!byId.has(decision.id), `Duplicate decision ${decision.id}`);
    byId.set(decision.id, decision);
    for (const field of ['question', 'why', 'recommendation']) {
      requireThat(nonempty(decision[field]), `${decision.id}: ${field} is required`);
    }
    requireThat(['open', 'researching', 'resolved', 'excluded'].includes(decision.status), `${decision.id}: invalid status`);
    requireThat(Array.isArray(decision.depends_on) && decision.depends_on.every(x => typeof x === 'string'), `${decision.id}: invalid dependencies`);
    requireThat(new Set(decision.depends_on).size === decision.depends_on.length, `${decision.id}: duplicate dependency`);
    requireThat(Array.isArray(decision.options), `${decision.id}: options must be an array`);
    const optionIds = new Set();
    for (const option of decision.options) {
      requireThat(option && typeof option.id === 'string' && idPattern.test(option.id), `${decision.id}: invalid option ID`);
      requireThat(!optionIds.has(option.id), `${decision.id}: duplicate option ID`);
      optionIds.add(option.id);
      requireThat(nonempty(option.label) && typeof option.detail === 'string', `${decision.id}: invalid option text`);
    }
    requireThat(decision.answer === null || typeof decision.answer === 'string', `${decision.id}: answer must be null or text`);
    if (decision.status === 'resolved') requireThat(nonempty(decision.answer), `${decision.id}: resolved decision needs an answer`);
    if (decision.status === 'excluded') requireThat(nonempty(decision.reason), `${decision.id}: excluded decision needs a reason`);
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    requireThat(byId.has(id), `Unknown dependency ${id}`);
    requireThat(!visiting.has(id), `Dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const decision = byId.get(id);
    for (const dep of decision.depends_on) {
      visit(dep);
      if (decision.status === 'resolved') {
        requireThat(byId.get(dep).status === 'resolved', `${id}: resolved decision has an unsettled prerequisite`);
      }
    }
    visiting.delete(id); visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return state;
}

export function inspect(state) {
  validate(state);
  const byId = new Map(state.decisions.map(d => [d.id, d]));
  const frontier = state.decisions.filter(d => d.status === 'open' && d.depends_on.every(id => byId.get(id).status === 'resolved'));
  const unresolved = state.decisions.filter(d => ['open', 'researching'].includes(d.status));
  const status = !state.decisions.length ? 'draft'
    : frontier.length ? 'questions-ready'
    : state.decisions.some(d => d.status === 'researching') ? 'research-needed'
    : unresolved.length ? 'blocked' : 'ready-for-confirmation';
  return { status, frontier: frontier.map(d => d.id), unresolved: unresolved.map(d => d.id) };
}

export function serializeForHtml(state) {
  return JSON.stringify(state).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

export async function render(state) {
  const view = inspect(state);
  const template = await readFile(new URL('../assets/review.html', import.meta.url), 'utf8');
  return template.replace('__SESSION_JSON__', () => serializeForHtml({ ...state, view }));
}

export async function atomicWrite(path, text) {
  await mkdir(dirname(resolve(path)), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, text, { flag: 'wx' }); await rename(temp, path); }
  finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

async function main(args) {
  const [command, input, output] = args;
  if (!['init', 'check', 'render'].includes(command) || !input || (command === 'render' && !output)) {
    throw new Error('Usage: session.mjs init <state.json> | check <state.json> | render <state.json> <review.html>');
  }
  if (command === 'init') {
    const draft = { schema_version: 2, session_id: randomUUID(), revision: 1, round: 1, discussion_only: false, goal: 'Replace with the user\'s actual goal', summary: '', facts: [], decisions: [] };
    await mkdir(dirname(resolve(input)), { recursive: true });
    await writeFile(input, JSON.stringify(draft, null, 2) + '\n', { flag: 'wx' });
    console.log(`Created draft: ${input}`); return;
  }
  const state = JSON.parse(await readFile(input, 'utf8'));
  const view = inspect(state);
  if (command === 'render') {
    requireThat(resolve(input) !== resolve(output), 'Output must not overwrite the session JSON');
    await atomicWrite(output, await render(state));
  }
  console.log(JSON.stringify({ ...view, ...(command === 'render' ? { output: resolve(output) } : {}) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
