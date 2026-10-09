import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { randomUUID } from 'node:crypto';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL('../' + specifier.slice(2) + '.ts', import.meta.url).href, context);
  try { return next(specifier, context); }
  catch (error) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return next(specifier + '.ts', context);
    throw error;
  }
} });
const sessions = new Map();
let dbCalls = 0;
mock.module('@neondatabase/serverless', { namedExports: { neon: () => async (parts, ...values) => {
  dbCalls++;
  if (parts.join('').includes('JOIN users')) return sessions.has(values[0]) ? [sessions.get(values[0])] : [];
  return [];
} } });
process.env.DATABASE_URL = 'mock';
process.env.APP_URL = 'https://nova.example';
process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = 'test'; process.env.GOOGLE_CLIENT_SECRET = 'test';
const { identity, hash, checkOrigin } = await import('../lib/server.ts');
const { POST } = await import('../app/api/mobile-auth/route.ts');
const token = () => randomUUID() + randomUUID();
const alice = { id: 'alice', name: 'Alice', email: 'alice@example.test' };
const browserSession = token(); const phoneSession = token(); const bobSession = token();
sessions.set(await hash(browserSession), alice); sessions.set(await hash(phoneSession), alice);
sessions.set(await hash(bobSession), { id: 'bob', name: 'Bob', email: 'bob@example.test' });

test('different browser and Android sessions for one Google user resolve to one cart', async () => {
  const web = await identity(new Request('https://nova.example/api/shop', { headers: { cookie: `form_visitor=${token()}; form_session=${browserSession}` } }));
  const phone = await identity(new Request('https://nova.example/api/shop', { headers: { Authorization: 'Bearer ' + phoneSession } }));
  assert.equal(web.owner, phone.owner); assert.equal(web.user.id, 'alice');
  const other = await identity(new Request('https://nova.example/api/shop', { headers: { Authorization: 'Bearer ' + bobSession } }));
  assert.notEqual(web.owner, other.owner);
});
test('invalid or revoked native credentials never become a guest identity', async () => {
  for (const authorization of ['Bearer ' + token(), 'Bearer garbage', 'Basic anything']) {
    await assert.rejects(identity(new Request('https://nova.example', { headers: { authorization } })), /Unauthorized/);
  }
});
test('guest carts remain isolated and cookie POSTs still require the exact origin', async () => {
  const a = await identity(new Request('https://nova.example'));
  const b = await identity(new Request('https://nova.example'));
  assert.notEqual(a.owner, b.owner);
  assert.throws(() => checkOrigin(new Request('https://nova.example', { headers: { origin: 'https://evil.example' } })), /reload/);
  assert.doesNotThrow(() => checkOrigin(new Request('https://nova.example', { headers: { authorization: 'Bearer ' + phoneSession } })));
});
const post = body => POST(new Request('https://nova.example/api/mobile-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
test('pairing ticket requires the original device proof before accessing the database', async () => {
  const verifier = token();
  const begin = await post({ action: 'begin', challenge: await hash(verifier) });
  assert.equal(begin.status, 200);
  const { ticket, code, url } = await begin.json();
  assert.match(code, /^[A-F0-9]{8}$/); assert.ok(url.startsWith('https://nova.example/mobile-connect?ticket='));
  const before = dbCalls;
  const wrong = await post({ action: 'redeem', ticket, verifier: token() });
  assert.equal(wrong.status, 401); assert.equal(dbCalls, before);
  const good = await post({ action: 'redeem', ticket, verifier });
  assert.equal(good.status, 202); assert.equal((await good.json()).pending, true);
});
test('forged pairing tickets and unauthenticated approval are rejected', async () => {
  const { ticket } = await (await post({ action: 'begin', challenge: await hash(token()) })).json();
  assert.equal((await post({ action: 'redeem', ticket: ticket + 'x', verifier: token() })).status, 400);
  const approval = await POST(new Request('https://nova.example/api/mobile-auth', { method: 'POST', headers: { origin: 'https://nova.example' }, body: JSON.stringify({ action: 'authorize', ticket }) }));
  assert.equal(approval.status, 401);
});
