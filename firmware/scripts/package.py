import argparse
import hashlib
import pathlib
import shutil
import struct
import subprocess
import sys
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("--core", required=True, type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1]
build = root / "build"
hex_file = build / "TOXIQ_V0.ino.hex"
uf2_file = build / "TOXIQ-V0-0.5.0.uf2"
subprocess.run([sys.executable, str(args.core / "tools/uf2conv/uf2conv.py"), "-f", "0xADA52840", "-c", "-o", str(uf2_file), str(hex_file)], check=True)
data = uf2_file.read_bytes()
assert data and len(data) % 512 == 0
for offset in range(0, len(data), 512):
    magic1, magic2, flags, address, size, number, count, family = struct.unpack_from("<8I", data, offset)
    assert magic1 == 0x0A324655 and magic2 == 0x9E5D5157 and family == 0xADA52840 and flags & 0x2000
    assert 0x27000 <= address < 0xED000 and address + size <= 0xED000, "UF2 must contain only the application, never storage/bootloader"
    assert struct.unpack_from("<I", data, offset + 508)[0] == 0x0AB16F30
bundle = build / "TOXIQ-V0-0.5.0-Firmware.zip"
with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as archive:
    archive.write(uf2_file, uf2_file.name)
    archive.write(root / "README.md", "README.md")
    archive.write(root / "PROTOCOL.md", "PROTOCOL.md")
    source = build / "TOXIQ_V0/TOXIQ_V0.ino"
    archive.write(source, "TOXIQ_V0/TOXIQ_V0.ino")
    checksums = "".join(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n" for p in [uf2_file, hex_file])
    archive.writestr("SHA256SUMS.txt", checksums)
shutil.copyfile(hex_file, build / "TOXIQ-V0-0.5.0.hex")
print(f"Verified application-only UF2: {len(data) // 512} blocks. Packaged {bundle.name}")
