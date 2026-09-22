(() => {
  const scripts = ['./model.js?v=104-native-4', './core.js?v=104-native-4', './screens.js?v=104-native-4', './features.js?v=104-native-4', './admin.js?v=104-native-4', './dialogs.js?v=104-native-4', './runtime.js?v=104-native-4'];
  scripts.reduce(
    (chain, src) => chain.then(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Nepodařilo se načíst ${src}`));
      document.head.appendChild(script);
    })),
    Promise.resolve(),
  ).catch((error) => {
    const app = document.querySelector('#app');
    if (app) app.textContent = `UI preview se nepodařilo načíst: ${error.message}`;
  });
})();
