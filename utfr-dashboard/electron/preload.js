// Safe bridge to expose a minimal API to the renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('utfr', {
  openInMotec: async (payload) => {
    try {
      return await ipcRenderer.invoke('utfr:open-in-motec', payload);
    } catch {
      return false;
    }
  },
});


