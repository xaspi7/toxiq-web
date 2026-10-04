const { execFile } = require('node:child_process');

function layoutFromHandle(value) {
  if (!/^[0-9a-f]{1,16}$/i.test(value)) return null;
  const handle = Number(BigInt('0x' + value) & 0xffffffffn);
  if ((handle & 0xffff) === 0x0405) {
    if ((handle >>> 16) === 0xf001) return 'CZ_QWERTY';
    if ((handle >>> 16) === 0x0405) return 'CZ';
  }
  if (handle === 0x04090409) return 'US';
  return null;
}
function detectKeyboardLayout() {
  if (process.platform !== 'win32') return Promise.resolve(null);
  // Read the input layout of the foreground window, not the language of the UI.
  // This fixed command receives no user-controlled shell arguments.
  const script = `Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ToxiqInput {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window, IntPtr process);
  [DllImport("user32.dll")] static extern IntPtr GetKeyboardLayout(uint thread);
  public static string Read() { return GetKeyboardLayout(GetWindowThreadProcessId(GetForegroundWindow(),IntPtr.Zero)).ToInt64().ToString("X"); }
}
'@
[ToxiqInput]::Read()`;
  return new Promise(resolve => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, timeout: 8000, maxBuffer: 4096 }, (error, stdout) => {
      resolve(error ? null : layoutFromHandle(stdout.trim()));
    });
  });
}
module.exports = { detectKeyboardLayout, layoutFromHandle };
