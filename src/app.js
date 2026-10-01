'use strict';

const http = require('node:http');
const { TaskStore, ValidationError } = require('./store');

const MAX_BODY_BYTES = 1024 * 10;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new ValidationError('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(new ValidationError('Request body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Creates the HTTP server. Pass a store to share state, or let it create one.
 * @param {TaskStore} [store]
 * @returns {http.Server}
 */
function createApp(store = new TaskStore()) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const idMatch = path.match(/^\/tasks\/(\d+)$/);

    try {
      if (req.method === 'GET' && path === '/health') {
        return sendJson(res, 200, { status: 'healthy' });
      }

      if (path === '/tasks') {
        if (req.method === 'GET') {
          return sendJson(res, 200, store.list());
        }
        if (req.method === 'POST') {
          const body = await readJsonBody(req);
          return sendJson(res, 201, store.create(body));
        }
      }

      if (idMatch) {
        const id = Number(idMatch[1]);
        if (req.method === 'GET') {
          const task = store.get(id);
          return task
            ? sendJson(res, 200, task)
            : sendJson(res, 404, { error: 'Task not found' });
        }
        if (req.method === 'PUT') {
          const body = await readJsonBody(req);
          const task = store.update(id, body);
          return task
            ? sendJson(res, 200, task)
            : sendJson(res, 404, { error: 'Task not found' });
        }
        if (req.method === 'DELETE') {
          return store.delete(id)
            ? sendJson(res, 200, { deleted: true })
            : sendJson(res, 404, { error: 'Task not found' });
        }
      }

      return sendJson(res, 404, { error: 'Route not found' });
    } catch (err) {
      if (err instanceof ValidationError) {
        return sendJson(res, 400, { error: err.message });
      }
      return sendJson(res, 500, { error: 'Internal server error' });
    }
  });
}

module.exports = { createApp };
