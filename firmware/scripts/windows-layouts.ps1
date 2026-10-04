param([string]$Output = "firmware/build/windows-layouts.json", [string]$Verify = "")
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class ToxiqLayouts {
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern IntPtr LoadKeyboardLayout(string name, uint flags);
  [DllImport("user32.dll")] static extern uint MapVirtualKeyEx(uint code, uint type, IntPtr layout);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int ToUnicodeEx(uint key, uint scan, byte[] state, StringBuilder text, int length, uint flags, IntPtr layout);
  public class Stroke { public int modifier; public int usage; public uint scan; public uint key; }
  static readonly int[] letterScans = {0x1e,0x30,0x2e,0x20,0x12,0x21,0x22,0x23,0x17,0x24,0x25,0x26,0x32,0x31,0x18,0x19,0x10,0x13,0x1f,0x14,0x16,0x2f,0x11,0x2d,0x15,0x2c};
  static readonly int[] symbolScans = {0x1c,0x01,0x0e,0x0f,0x39,0x0c,0x0d,0x1a,0x1b,0x2b,0x2b,0x27,0x28,0x29,0x33,0x34,0x35};
  static uint Scan(int usage) { return (uint)(usage < 30 ? letterScans[usage-4] : usage < 40 ? usage-28 : usage == 100 ? 0x56 : symbolScans[usage-40]); }
  static byte[] State(int modifier) {
    var state = new byte[256];
    if ((modifier & 2) != 0) state[0x10] = state[0xa0] = 0x80;
    if ((modifier & 64) != 0) { state[0x11] = state[0xa2] = state[0x12] = state[0xa5] = 0x80; }
    return state;
  }
  static int Type(Stroke stroke, IntPtr layout, uint flags, out string text) {
    var buffer = new StringBuilder(8);
    int count = ToUnicodeEx(stroke.key, stroke.scan, State(stroke.modifier), buffer, 8, flags, layout);
    text = buffer.ToString(); return count;
  }
  static void Clear(IntPtr layout) {
    string ignored;
    var space = new Stroke { modifier=0, usage=44, key=0x20, scan=0x39 };
    for (int i=0; i<4 && Type(space,layout,0,out ignored)<0; i++) {}
  }
  public static int[][] Generate(string id, string characters) {
    IntPtr layout = LoadKeyboardLayout(id,0);
    if (layout == IntPtr.Zero) throw new Exception("Cannot load keyboard layout " + id);
    var all = new List<Stroke>(); var dead = new List<Stroke>();
    var found = new Dictionary<int,int[]>();
    foreach (int modifier in new int[] {0,2,64,66}) {
      for (int usage=4; usage<=100; usage++) {
        if (usage > 56 && usage != 100 || usage==41 || usage==42 || usage==50) continue;
        uint scan=Scan(usage);
        var stroke = new Stroke {modifier=modifier,usage=usage,scan=scan,key=MapVirtualKeyEx(scan,3,layout)};
        string text; int count=Type(stroke,layout,4,out text);
        all.Add(stroke);
        if (count<0) dead.Add(stroke);
        if (count==1 && text.Length==1 && !found.ContainsKey(text[0])) found[text[0]]=new int[] {text[0],modifier,usage,0,0};
      }
    }
    foreach (var first in dead) foreach (var second in all) {
      Clear(layout); string ignored,text;
      Type(first,layout,0,out ignored);
      int count=Type(second,layout,0,out text);
      if (count==1 && text.Length==1 && !found.ContainsKey(text[0])) found[text[0]]=new int[] {text[0],first.modifier,first.usage,second.modifier,second.usage};
      Clear(layout);
    }
    var result = new List<int[]>();
    foreach (char character in characters) {
      char target=character=='\n' ? '\r' : character;
      if (!found.ContainsKey(target)) throw new Exception("Unmappable U+"+((int)character).ToString("X4")+" for "+id);
      int[] row=(int[])found[target].Clone(); row[0]=character; result.Add(row);
    }
    result.Sort((a,b)=>a[0].CompareTo(b[0]));
    return result.ToArray();
  }
}
'@
$ascii = -join (32..126 | ForEach-Object {[char]$_})
$czech = "ěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÓ€"
$layouts = [ordered]@{
  US = [ToxiqLayouts]::Generate("00000409", "$ascii`n`t")
  CZ = [ToxiqLayouts]::Generate("00000405", "$ascii$czech`n`t")
  CZ_QWERTY = [ToxiqLayouts]::Generate("00010405", "$ascii$czech`n`t")
}
$json = ConvertTo-Json -InputObject $layouts -Depth 5 -Compress
if ($Verify) {
  $expected = Get-Content -Raw $Verify | ConvertFrom-Json
  foreach ($name in $layouts.Keys) {
    $a = ConvertTo-Json -InputObject $layouts[$name] -Depth 5 -Compress
    $b = ConvertTo-Json -InputObject $expected.$name -Depth 5 -Compress
    if ($a -ne $b) { throw "Keyboard mappings changed for $name" }
  }
  Write-Output "Verified US, Czech QWERTZ and Czech QWERTY against Windows ToUnicodeEx."
}
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Output))) | Out-Null
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Output), $json, [Text.UTF8Encoding]::new($false))
Write-Output "Exported Windows keyboard mappings to $Output."
