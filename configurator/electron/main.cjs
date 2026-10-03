const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { UsbController } = require('./usb.cjs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const entry = path.resolve(__dirname, '../dist/index.html');
const usb = new UsbController();
let mainWindow;

function createWindow() {
  const window = new BrowserWindow({
    width: 1240, height: 820, minWidth: 940, minHeight: 640,
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
            if (document.querySelectorAll('.macro-key').length === 6) return Array.isArray(ports) && document.querySelector('.demo-label')?.textContent === 'USB';
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

for (const method of ['list', 'connect', 'disconnect', 'read', 'save']) {
  ipcMain.handle(`toxiq:${method}`, async (event, ...args) => {
    if (event.sender !== mainWindow?.webContents || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== pathToFileURL(entry).href) return { ok: false, error: 'Nepovolený požadavek.' };
    try { return { ok: true, value: await usb[method](...args) }; }
    catch (error) { return { ok: false, error: error.message || 'USB operace selhala.' }; }
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
