// Intentionally minimal: no Node APIs are exposed to the remote app.
// Kept so the window can be hardened with contextIsolation + sandbox.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-trawe-desktop', 'true');
});