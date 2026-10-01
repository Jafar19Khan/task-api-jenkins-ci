'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

async function withServer(fn) {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function postJson(url, body, method = 'POST') {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('GET /health returns healthy', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'healthy' });
  });
});

test('POST /tasks creates a task and GET /tasks lists it', async () => {
  await withServer(async (base) => {
    const created = await postJson(`${base}/tasks`, { title: 'Set up CI' });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.title, 'Set up CI');

    const list = await (await fetch(`${base}/tasks`)).json();
    assert.equal(list.length, 1);
  });
});

test('POST /tasks with invalid input returns 400', async () => {
  await withServer(async (base) => {
    const res = await postJson(`${base}/tasks`, { title: '' });
    assert.equal(res.status, 400);
  });
});

test('PUT /tasks/:id updates and DELETE /tasks/:id removes', async () => {
  await withServer(async (base) => {
    await postJson(`${base}/tasks`, { title: 'Deploy app' });

    const put = await postJson(`${base}/tasks/1`, { done: true }, 'PUT');
    assert.equal(put.status, 200);
    assert.equal((await put.json()).done, true);

    const del = await fetch(`${base}/tasks/1`, { method: 'DELETE' });
    assert.equal(del.status, 200);

    const missing = await fetch(`${base}/tasks/1`);
    assert.equal(missing.status, 404);
  });
});

test('unknown routes return 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
