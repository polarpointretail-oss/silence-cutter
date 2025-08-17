const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('CleanerAPI', {
  pickAndCleanMany: () => ipcRenderer.invoke('pick-and-clean-many')
});
