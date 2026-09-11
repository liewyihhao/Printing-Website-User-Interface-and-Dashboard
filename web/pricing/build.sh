#!/usr/bin/env bash
# Generates web/pricing/engine.js (browser global window.PricingEngine) from the
# pricing-calculator repo's engine. The calculator repo stays the source of truth.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/../../crawler/output/calculator_engine.cjs"
OUT="$DIR/engine.js"
python - "$SRC" "$OUT" <<'PY'
import sys
src, out = sys.argv[1], sys.argv[2]
code = open(src, encoding="utf-8").read()
code = code.replace(
  "module.exports={DATA,localQuote,localOptions,tiers};",
  "window.PricingEngine={DATA,localQuote,localOptions,tiers};")
code = code.replace(
  "const $ = id => document.getElementById(id);",
  "const $ = id => (typeof document!=='undefined'?document.getElementById(id):null);")
assert "window.PricingEngine=" in code, "export swap failed"
# Isolate every engine global (TIERS, DATA, $, etc.) so it never clashes with the app's own scope.
code = ";(function(){\n" + code + "\n})();\n"
open(out, "w", encoding="utf-8").write(code)
print("wrote", out, len(code), "bytes")
PY
