const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('psb', {
  compile: (source, opts) => ipcRenderer.invoke('compile', source, opts),
  exportSb3: (source, opts, name) => ipcRenderer.invoke('export-sb3', source, opts, name),
  openSource: () => ipcRenderer.invoke('open-source'),
  saveSource: (text, currentPath) => ipcRenderer.invoke('save-source', text, currentPath),
  example: name => ipcRenderer.invoke('example', name),
  pickMedia: () => ipcRenderer.invoke('pick-media'),
  syntax: lang => ipcRenderer.invoke('syntax', lang),
  i18n: () => ipcRenderer.invoke('i18n'),
  setLang: lang => ipcRenderer.invoke('set-lang', lang),
  onMenu: cb => ipcRenderer.on('menu', (event, action) => cb(action))
});
