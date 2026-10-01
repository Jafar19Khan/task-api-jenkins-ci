'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TaskStore, ValidationError } = require('../src/store');

test('create() adds a task with defaults', () => {
  const store = new TaskStore();
  const task = store.create({ title: '  Learn Jenkins  ' });
  assert.equal(task.id, 1);
  assert.equal(task.title, 'Learn Jenkins');
  assert.equal(task.done, false);
});

test('create() rejects an empty title', () => {
  const store = new TaskStore();
  assert.throws(() => store.create({ title: '   ' }), ValidationError);
  assert.throws(() => store.create({}), ValidationError);
});

test('update() changes title and done', () => {
  const store = new TaskStore();
  const { id } = store.create({ title: 'Write tests' });
  const updated = store.update(id, { title: 'Write more tests', done: true });
  assert.equal(updated.title, 'Write more tests');
  assert.equal(updated.done, true);
});

test('update() rejects a non-boolean done value', () => {
  const store = new TaskStore();
  const { id } = store.create({ title: 'Task' });
  assert.throws(() => store.update(id, { done: 'yes' }), ValidationError);
});

test('update() and delete() handle unknown ids', () => {
  const store = new TaskStore();
  assert.equal(store.update(99, { done: true }), null);
  assert.equal(store.delete(99), false);
});

test('delete() removes a task', () => {
  const store = new TaskStore();
  const { id } = store.create({ title: 'Temporary' });
  assert.equal(store.delete(id), true);
  assert.equal(store.list().length, 0);
});
