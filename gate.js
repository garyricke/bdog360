/*
 * Bulldog 360 — page gate
 *
 * Casual access deterrent for the brand-guide and growth-plan pages.
 * Page HTML is fully readable via view-source by design; this gate only
 * blocks the browser UI. The password literal is never stored here —
 * only its SHA-256 digest. When the visitor submits a password, the
 * digest of their input is compared to EXPECTED_HASH below.
 *
 * To change the password:
 *   1. echo -n "newpassword" | shasum -a 256
 *   2. Replace EXPECTED_HASH below with the new hex digest.
 */
(function () {
  // SHA-256 hex digest of the current access password.
  var EXPECTED_HASH =
    "25760077f5e1c14f0765982756d1e41b5b02328cfd5096227fc470324a5dcc6b";

  var SESSION_KEY = "bdog360-gate-v1";

  function bytesToHex(buf) {
    var a = new Uint8Array(buf);
    var s = "";
    for (var i = 0; i < a.length; i++) {
      var h = a[i].toString(16);
      s += h.length === 1 ? "0" + h : h;
    }
    return s;
  }

  async function hashPassword(pw) {
    var enc = new TextEncoder().encode(pw);
    var buf = await crypto.subtle.digest("SHA-256", enc);
    return bytesToHex(buf);
  }

  function unlock(persist) {
    document.documentElement.classList.remove("bdog-locked");
    if (persist) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
    }
  }

  function init() {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        unlock(false);
        return;
      }
    } catch (e) {}

    var form = document.getElementById("bdogGateForm");
    var input = document.getElementById("bdogGateInput");
    var err = document.getElementById("bdogGateErr");
    var btn = document.getElementById("bdogGateBtn");
    if (!form || !input || !err || !btn) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      err.hidden = true;
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Unlocking…";
      var hash = await hashPassword(input.value);
      if (hash === EXPECTED_HASH) {
        unlock(true);
        return;
      }
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = label;
      input.value = "";
      input.focus();
    });

    input.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
