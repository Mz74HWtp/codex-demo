import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/index.js';

test('HTTP app returns Hello DevSecOps as plain text', async (t) => {
  const server = createApp();
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await response.text(), 'Hello DevSecOps');
});
