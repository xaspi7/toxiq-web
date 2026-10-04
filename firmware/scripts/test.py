import pathlib
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[1]
arduino_json = pathlib.Path(sys.argv[1]).resolve()
output = root / "build" / "config-test"
output.parent.mkdir(exist_ok=True)
subprocess.run(["g++", "-std=c++11", "-Wall", "-Wextra", "-Werror", "-I", str(arduino_json), "-I", str(root / "toxiq_v0"), str(root / "tests/config.cpp"), "-o", str(output)], check=True)
subprocess.run([str(output)], check=True)
