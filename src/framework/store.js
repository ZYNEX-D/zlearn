/**
 * Chemia Framework - Reactive Micro-Store
 * Zero-overhead state primitives providing fine-grained reactivity
 * without virtual DOM reconciliation overhead.
 */

export function createSignal(initialValue) {
  let val = initialValue;
  const subscribers = new Set();
  
  const get = () => val;
  
  const set = (next) => {
    const resolved = typeof next === 'function' ? next(val) : next;
    if (resolved !== val) {
      val = resolved;
      subscribers.forEach(fn => fn(val));
    }
    return val;
  };
  
  const subscribe = (fn, runImmediately = true) => {
    subscribers.add(fn);
    if (runImmediately) fn(val);
    return () => subscribers.delete(fn);
  };
  
  return [get, set, subscribe];
}

export function createStore(initialState) {
  const state = { ...initialState };
  const listeners = new Map();
  
  return {
    get: (key) => state[key],
    getAll: () => ({ ...state }),
    set: (key, value) => {
      if (state[key] !== value) {
        state[key] = value;
        const setForSub = listeners.get(key);
        if (setForSub) setForSub.forEach(fn => fn(value, state));
      }
    },
    update: (updates) => {
      let changed = false;
      for (const [key, value] of Object.entries(updates)) {
        if (state[key] !== value) {
          state[key] = value;
          changed = true;
          const setForSub = listeners.get(key);
          if (setForSub) setForSub.forEach(fn => fn(value, state));
        }
      }
      return changed;
    },
    subscribe: (key, fn, runImmediately = true) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(fn);
      if (runImmediately) fn(state[key], state);
      return () => listeners.get(key)?.delete(fn);
    }
  };
}
