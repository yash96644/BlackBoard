const { contextBridge, ipcRenderer } = require('electron');

// Expose safe platform info to React
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // 'darwin'  = macOS
  // 'win32'   = Windows
  // 'linux'   = Linux

  // Listen for deep link events from main process
  onDeepLink: (callback) => {
    ipcRenderer.on('deep-link', (_event, url) => callback(url));
  },

  // Remove deep link listener
  removeDeepLinkListener: () => {
    ipcRenderer.removeAllListeners('deep-link');
  },
});
