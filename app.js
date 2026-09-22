if ('serviceWorker' in navigator) {
  const workerURL = new URL('./sw.js', document.currentScript.src);
  const previouslyControlled = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (previouslyControlled && !reloading) { reloading = true; window.location.reload(); }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(workerURL, { updateViaCache: 'none' })
      .then(registration => registration.update()).catch(() => {});
  });
}
