// Minimal SW registration helper
export function registerSW(opts = {}) {
  if (!('serviceWorker' in navigator)) return;
  const { url = '/sw.js' } = opts;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(url).catch(() => void 0);
  });
}

export function unregisterSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => void 0);
}

