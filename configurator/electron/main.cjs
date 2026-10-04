const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { UsbController } = require('./usb.cjs');
const path = require('node:path');
const { detectKeyboardLayout } = require('./keyboard.cjs');
const { pathToFileURL } = require('node:url');
const entry = path.resolve(__dirname, '../dist/index.html');
const usb = new UsbController();
let mainWindow;

function createWindow() {
  const window = new BrowserWindow({
    width: 1120, height: 760, minWidth: 900, minHeight: 640,
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: { color: '#090A0C', symbolColor: '#F4F4F0', height: 48 } } : { trafficLightPosition: { x: 16, y: 17 } }),
    backgroundColor: '#090A0C', title: 'TOXIQ Configurator',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow = window;
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== pathToFileURL(entry).href) event.preventDefault();
  });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.loadFile(entry);
  if (process.argv.includes('--smoke-test')) {
    window.webContents.once('did-finish-load', async () => {
      try {
        const ok = await window.webContents.executeJavaScript(`(async () => {
          const ports = await window.toxiq.list();
          for (let retry = 0; retry < 50; retry++) {
            if (document.querySelectorAll('.macro-key').length === 6) {
              const overlay = navigator.windowControlsOverlay;
              return Boolean(Array.isArray(ports) && document.documentElement.lang === 'en' && document.querySelector('.app-chrome') && document.querySelector('#action-type') && window.toxiq.setTheme && window.toxiq.keyboardLayout && (window.toxiq.platform !== 'win32' || overlay?.visible));
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return false;
        })()`);
        app.exit(ok ? 0 : 1);
      } catch { app.exit(1); }
    });
  }
  window.on('closed', () => { usb.disconnect(); mainWindow = null; });
}

const operations = {
  ...Object.fromEntries(['list', 'connect', 'disconnect', 'read', 'save'].map(method => [method, (...args) => usb[method](...args)])),
  keyboardLayout: () => detectKeyboardLayout(),
  setTheme: theme => {
    if (theme !== 'black' && theme !== 'white') throw new Error('operation_failed');
    mainWindow.setBackgroundColor(theme === 'black' ? '#090A0C' : '#F4F4F0');
    if (process.platform !== 'darwin') mainWindow.setTitleBarOverlay({ color: theme === 'black' ? '#090A0C' : '#F4F4F0', symbolColor: theme === 'black' ? '#F4F4F0' : '#090A0C', height: 48 });
  },
};
for (const method of Object.keys(operations)) {
  ipcMain.handle(`toxiq:${method}`, async (event, ...args) => {
    if (event.sender !== mainWindow?.webContents || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== pathToFileURL(entry).href) return { ok: false, error: 'unauthorized' };
    try { return { ok: true, value: await operations[method](...args) }; }
    catch (error) { return { ok: false, error: error.message || 'operation_failed' }; }
  });
}
usb.on('event', event => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('toxiq:event', event); });
app.on('before-quit', () => usb.disconnect());

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
