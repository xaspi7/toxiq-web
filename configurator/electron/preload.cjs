const { contextBridge, ipcRenderer } = require('electron');
const invoke = async (method, ...args) => {
  const result = await ipcRenderer.invoke(`toxiq:${method}`, ...args);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};
contextBridge.exposeInMainWorld('toxiq', Object.freeze({
  platform: process.platform,
  keyboardLayout: () => invoke('keyboardLayout'),
  setTheme: theme => invoke('setTheme', theme),
  list: () => invoke('list'),
  connect: path => invoke('connect', path),
  disconnect: () => invoke('disconnect'),
  read: () => invoke('read'),
  save: config => invoke('save', config),
  onEvent: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('toxiq:event', listener);
    return () => ipcRenderer.removeListener('toxiq:event', listener);
  },
}));
