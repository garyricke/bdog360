#!/usr/bin/env python3
"""
Bulldog 360 — page encryption script.

Reads source HTML from _source/, encrypts the <body> content with AES-GCM
using a PBKDF2-derived key from the password, and emits gated HTML files
at the project root. The gated pages include a styled password prompt and
a client-side decryption routine using the Web Crypto API.

Usage:
    python3 encrypt.py [password]

If no password is given, prompts interactively.
"""

import argparse
import base64
import getpass
import json
import os
import re
import sys
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


ROOT = Path(__file__).resolve().parent
SOURCE_DIR = ROOT / "_source"

PBKDF2_ITERATIONS = 250_000

PAGES = [
    {
        "src": "brand-guide.html",
        "out": "brand-guide.html",
        "stylesheet": "brand-guide.css",
        "title": "Bulldog 360 — Brand Guide",
        "sub": "Access required to view the Bulldog 360 brand guide.",
    },
    {
        "src": "budget-proposal.html",
        "out": "budget-proposal.html",
        "stylesheet": "budget-proposal.css",
        "extra_css": "brand-guide.css",
        "title": "Bulldog 360 — Growth Plan",
        "sub": "Access required to view the Bulldog 360 market analysis & growth proposal.",
    },
]


def extract_body(html: str) -> str:
    m = re.search(r"<body[^>]*>(.*)</body>", html, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        raise ValueError("Could not find <body>...</body> in source HTML")
    return m.group(1)


def encrypt_body(plaintext: str, password: str) -> dict:
    salt = os.urandom(16)
    nonce = os.urandom(12)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    key = kdf.derive(password.encode("utf-8"))
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return {
        "salt": base64.b64encode(salt).decode("ascii"),
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "ct": base64.b64encode(ct).decode("ascii"),
        "iter": PBKDF2_ITERATIONS,
    }


GATE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Montserrat:wght@700;800;900&family=Roboto:wght@400;500;700&display=swap">
{stylesheet_links}
  <style>
    :root {{
      --crimson: #e63946;
      --crimson-deep: #c01f2c;
      --onyx: #1e1e24;
      --pearl: #f8f9fa;
      --pearl-2: #eceef1;
      --ink: #14141a;
      --ink-soft: #4a4a55;
    }}
    html, body {{ margin: 0; padding: 0; }}
    body.gate-mode {{
      min-height: 100vh;
      background:
        radial-gradient(circle at 78% 28%, rgba(230, 57, 70, 0.14), transparent 55%),
        radial-gradient(circle at 18% 80%, rgba(43, 76, 126, 0.20), transparent 55%),
        var(--onyx);
      color: var(--pearl);
      display: grid;
      place-items: center;
      font-family: "Inter", system-ui, sans-serif;
      padding: 2rem 1.25rem;
      box-sizing: border-box;
    }}
    .gate-card {{
      width: 100%;
      max-width: 460px;
      background: rgba(248, 249, 250, 0.04);
      border: 1px solid rgba(248, 249, 250, 0.15);
      border-radius: 16px;
      padding: 2.5rem 2rem 2rem;
      text-align: center;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }}
    .gate-logo {{
      max-width: 220px;
      width: 100%;
      height: auto;
      margin: 0 auto 1.75rem;
      display: block;
    }}
    .gate-pill {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.8rem;
      border: 1px solid rgba(248, 249, 250, 0.22);
      border-radius: 999px;
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--pearl);
      margin-bottom: 1.4rem;
      font-weight: 600;
    }}
    .gate-pill::before {{
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--crimson);
    }}
    .gate-title {{
      font-family: "Montserrat", system-ui, sans-serif;
      font-weight: 900;
      font-size: 1.5rem;
      letter-spacing: -0.01em;
      color: var(--pearl);
      margin: 0 0 0.6rem;
      line-height: 1.2;
    }}
    .gate-sub {{
      font-size: 0.92rem;
      color: rgba(248, 249, 250, 0.7);
      margin: 0 0 1.8rem;
      line-height: 1.5;
    }}
    .gate-form {{ display: grid; gap: 0.7rem; }}
    .gate-input {{
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(248, 249, 250, 0.06);
      border: 1px solid rgba(248, 249, 250, 0.25);
      border-radius: 8px;
      color: var(--pearl);
      font-family: inherit;
      font-size: 1rem;
      letter-spacing: 0.02em;
      box-sizing: border-box;
      transition: border-color 0.18s ease, background 0.18s ease;
    }}
    .gate-input:focus {{
      outline: none;
      border-color: var(--crimson);
      background: rgba(248, 249, 250, 0.09);
    }}
    .gate-input::placeholder {{ color: rgba(248, 249, 250, 0.45); }}
    .gate-btn {{
      padding: 0.9rem 1rem;
      background: var(--crimson);
      color: var(--pearl);
      border: none;
      border-radius: 8px;
      font-family: "Montserrat", system-ui, sans-serif;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s ease;
    }}
    .gate-btn:hover {{ background: var(--crimson-deep); }}
    .gate-btn:active {{ transform: translateY(1px); }}
    .gate-btn[disabled] {{ opacity: 0.6; cursor: progress; }}
    .gate-err {{
      margin: 1rem 0 0;
      font-size: 0.85rem;
      color: #ff8a93;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0.02em;
    }}
    .gate-foot {{
      margin: 1.6rem 0 0;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(248, 249, 250, 0.45);
    }}
    .gate-foot a {{ color: rgba(248, 249, 250, 0.7); text-decoration: none; }}
    .gate-foot a:hover {{ color: var(--pearl); }}
  </style>
</head>
<body class="gate-mode">
  <main class="gate-card" role="dialog" aria-labelledby="gateTitle">
    <picture>
      <source srcset="assets/bdog360-logo.avif" type="image/avif">
      <img src="assets/bdog360-logo.png" alt="Bulldog 360" class="gate-logo">
    </picture>
    <span class="gate-pill">Access Restricted</span>
    <h1 class="gate-title" id="gateTitle">{title}</h1>
    <p class="gate-sub">{sub}</p>
    <form id="gateForm" class="gate-form" novalidate>
      <input
        id="gateInput"
        class="gate-input"
        type="password"
        name="password"
        placeholder="Enter access password"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        required
      >
      <button id="gateBtn" type="submit" class="gate-btn">Unlock</button>
    </form>
    <p id="gateErr" class="gate-err" hidden>Wrong password — try again.</p>
    <p class="gate-foot">bdog360.com</p>
  </main>

  <script id="bdog360-payload" type="application/json">{payload_json}</script>

  <script>
    (function () {{
      var PAYLOAD = JSON.parse(document.getElementById("bdog360-payload").textContent);
      var SESSION_KEY = "bdog360-unlock-v1";

      function b64ToBytes(b64) {{
        var bin = atob(b64);
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      }}

      async function deriveKey(password) {{
        var enc = new TextEncoder();
        var passKey = await crypto.subtle.importKey(
          "raw",
          enc.encode(password),
          {{ name: "PBKDF2" }},
          false,
          ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
          {{
            name: "PBKDF2",
            salt: b64ToBytes(PAYLOAD.salt),
            iterations: PAYLOAD.iter,
            hash: "SHA-256"
          }},
          passKey,
          {{ name: "AES-GCM", length: 256 }},
          false,
          ["decrypt"]
        );
      }}

      async function decrypt(password) {{
        try {{
          var key = await deriveKey(password);
          var pt = await crypto.subtle.decrypt(
            {{ name: "AES-GCM", iv: b64ToBytes(PAYLOAD.nonce) }},
            key,
            b64ToBytes(PAYLOAD.ct)
          );
          return new TextDecoder().decode(pt);
        }} catch (e) {{
          return null;
        }}
      }}

      function rerunScripts(root) {{
        var scripts = root.querySelectorAll("script");
        scripts.forEach(function (old) {{
          var s = document.createElement("script");
          for (var i = 0; i < old.attributes.length; i++) {{
            s.setAttribute(old.attributes[i].name, old.attributes[i].value);
          }}
          s.text = old.textContent;
          old.parentNode.replaceChild(s, old);
        }});
      }}

      function render(html) {{
        document.body.classList.remove("gate-mode");
        document.body.innerHTML = html;
        rerunScripts(document.body);
        window.scrollTo(0, 0);
      }}

      var form = document.getElementById("gateForm");
      var input = document.getElementById("gateInput");
      var err = document.getElementById("gateErr");
      var btn = document.getElementById("gateBtn");

      form.addEventListener("submit", async function (e) {{
        e.preventDefault();
        err.hidden = true;
        btn.disabled = true;
        btn.textContent = "Unlocking…";
        var pw = input.value;
        var html = await decrypt(pw);
        if (html === null) {{
          err.hidden = false;
          btn.disabled = false;
          btn.textContent = "Unlock";
          input.value = "";
          input.focus();
          return;
        }}
        try {{ sessionStorage.setItem(SESSION_KEY, pw); }} catch (e) {{}}
        render(html);
      }});

      input.focus();

      (async function autoUnlock() {{
        var saved;
        try {{ saved = sessionStorage.getItem(SESSION_KEY); }} catch (e) {{ saved = null; }}
        if (!saved) return;
        var html = await decrypt(saved);
        if (html !== null) render(html);
      }})();
    }})();
  </script>
</body>
</html>
"""


def build_gate(page: dict, payload: dict) -> str:
    stylesheet_links = []
    if page.get("extra_css"):
        stylesheet_links.append(f'  <link rel="stylesheet" href="{page["extra_css"]}">')
    if page.get("stylesheet"):
        stylesheet_links.append(f'  <link rel="stylesheet" href="{page["stylesheet"]}">')
    return GATE_TEMPLATE.format(
        title=page["title"],
        sub=page["sub"],
        stylesheet_links="\n".join(stylesheet_links),
        payload_json=json.dumps(payload, separators=(",", ":")),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Encrypt Bulldog 360 HTML pages.")
    parser.add_argument(
        "password",
        nargs="?",
        default=None,
        help="Access password (prompts if omitted).",
    )
    args = parser.parse_args()

    password = args.password or getpass.getpass("Access password: ")
    if not password:
        print("error: password required", file=sys.stderr)
        sys.exit(1)

    if not SOURCE_DIR.exists():
        print(f"error: source directory not found at {SOURCE_DIR}", file=sys.stderr)
        sys.exit(1)

    for page in PAGES:
        src_path = SOURCE_DIR / page["src"]
        out_path = ROOT / page["out"]
        if not src_path.exists():
            print(f"skip: {src_path} missing", file=sys.stderr)
            continue
        html = src_path.read_text(encoding="utf-8")
        body = extract_body(html)
        payload = encrypt_body(body, password)
        out_path.write_text(build_gate(page, payload), encoding="utf-8")
        print(f"gated: {out_path.name}  ({len(payload['ct'])} chars ciphertext)")


if __name__ == "__main__":
    main()
