type Listener = (active: boolean) => void;

let active = false;
const listeners = new Set<Listener>();

export function getNavigationPending() {
  return active;
}

export function setNavigationPending(next: boolean) {
  if (active === next) return;
  active = next;
  for (const listener of listeners) {
    listener(active);
  }
}

export function subscribeNavigationPending(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
