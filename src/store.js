'use strict';

/** Error thrown when task input fails validation. */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('"title" must be a non-empty string');
  }
  return title.trim();
}

/** A tiny in-memory task store. Data is lost when the process stops. */
class TaskStore {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
  }

  list() {
    return Array.from(this.tasks.values());
  }

  get(id) {
    return this.tasks.get(id) || null;
  }

  create(input = {}) {
    const task = {
      id: this.nextId++,
      title: validateTitle(input.title),
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id, changes = {}) {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }
    if ('title' in changes) {
      task.title = validateTitle(changes.title);
    }
    if ('done' in changes) {
      if (typeof changes.done !== 'boolean') {
        throw new ValidationError('"done" must be a boolean');
      }
      task.done = changes.done;
    }
    return task;
  }

  delete(id) {
    return this.tasks.delete(id);
  }
}

module.exports = { TaskStore, ValidationError };
