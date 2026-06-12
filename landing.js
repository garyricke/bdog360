/*
 * Bulldog 360 — landing page interactions (SAMPLE)
 * Vanilla JS, no dependencies, no network calls.
 *  - Multi-step savings calculator with live estimate
 *  - Eligibility lead form with client-side validation + confirmation
 *  - Reveal-on-scroll for [data-reveal] elements
 * All math is illustrative only; see on-page disclosures.
 */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ============================================================
     Savings calculator
     ============================================================ */
  function initCalculator() {
    var calc = document.getElementById("calculator");
    if (!calc) return;

    var range = document.getElementById("calcRange");
    var amountEl = document.getElementById("calcAmount");
    var stepNum = document.getElementById("calcStepNum");
    var steps = calc.querySelectorAll(".calc__step");
    var creditors = document.getElementById("calcCreditors");
    var situationWrap = document.getElementById("calcSituation");

    var state = { debt: 22000, creditors: 3, situation: "current", step: 1 };

    function showStep(n) {
      state.step = clamp(n, 1, steps.length);
      steps.forEach(function (s) {
        s.classList.toggle("is-active", Number(s.getAttribute("data-step")) === state.step);
      });
      if (stepNum) stepNum.textContent = String(state.step);
      if (state.step === steps.length) computeResult();
    }

    function computeResult() {
      // Illustrative model: settle enrolled debt to ~52% of balance + ~22% performance
      // fee on the original balance, spread over an estimated term.
      var debt = state.debt;

      // Current min-payment pressure ~ 3% of balance / month.
      var currentMonthly = debt * 0.03;

      // Term scales gently with balance size; bounded to the 24-48mo program window.
      var term = clamp(Math.round(24 + (debt - 5000) / 2600), 24, 48);

      // Situation nudges the achievable settlement (more distress -> deeper settlement).
      var settleRate = state.situation === "collections" ? 0.45
                     : state.situation === "behind" ? 0.50 : 0.55;

      var feeRate = 0.22; // performance fee on enrolled balance
      var programTotal = debt * settleRate + debt * feeRate;
      var monthly = programTotal / term;
      var saved = clamp(debt - debt * settleRate, 0, debt); // creditor savings vs. balance

      var monthlyEl = document.getElementById("calcMonthly");
      var currentEl = document.getElementById("calcCurrent");
      var savedEl = document.getElementById("calcSaved");
      var termEl = document.getElementById("calcTerm");
      if (monthlyEl) monthlyEl.textContent = money(monthly);
      if (currentEl) currentEl.textContent = money(currentMonthly);
      if (savedEl) savedEl.textContent = money(saved);
      if (termEl) termEl.textContent = term + " mo";
    }

    if (range) {
      range.addEventListener("input", function () {
        state.debt = Number(range.value);
        if (amountEl) amountEl.textContent = state.debt.toLocaleString("en-US");
      });
    }
    if (creditors) {
      creditors.addEventListener("change", function () {
        state.creditors = Number(creditors.value);
      });
    }
    if (situationWrap) {
      situationWrap.addEventListener("click", function (e) {
        var chip = e.target.closest(".calc__chip");
        if (!chip) return;
        situationWrap.querySelectorAll(".calc__chip").forEach(function (c) {
          c.classList.remove("is-on");
        });
        chip.classList.add("is-on");
        state.situation = chip.getAttribute("data-val");
      });
    }

    calc.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) showStep(state.step + 1);
      else if (e.target.closest("[data-back]")) showStep(state.step - 1);
    });

    showStep(1);
  }

  /* ============================================================
     Eligibility lead form
     ============================================================ */
  function initLeadForm() {
    var form = document.getElementById("leadForm");
    var success = document.getElementById("leadSuccess");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // SAMPLE: no data is sent anywhere.
      form.style.display = "none";
      success.classList.add("is-on");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ============================================================
     Reveal on scroll
     ============================================================ */
  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ============================================================
     Reels — tap a card to open the fullscreen vertical "player"
     ============================================================ */
  function initReels() {
    var reels = Array.prototype.slice.call(document.querySelectorAll(".reel"));
    var box = document.getElementById("reelbox");
    if (!reels.length || !box) return;

    var imgEl = box.querySelector(".reelbox__img");
    var tagEl = box.querySelector(".reelbox__tag");
    var capEl = box.querySelector(".reelbox__cap");
    var barEl = box.querySelector(".reelbox__progress i");
    var toggle = box.querySelector(".reelbox__toggle");
    var icPause = toggle.querySelector(".ic-pause");
    var icPlay = toggle.querySelector(".ic-play");

    var current = 0;
    var duration = 18000;     // ms, from each card's data-dur
    var elapsed = 0;
    var lastTs = 0;
    var raf = null;
    var playing = false;

    function parseDur(s) {
      var p = (s || "0:18").split(":");
      return (Number(p[0]) * 60 + Number(p[1])) * 1000 || 18000;
    }

    function setPlaying(on) {
      playing = on;
      box.classList.toggle("is-playing", on);
      box.classList.toggle("is-paused", !on);
      if (icPause) icPause.hidden = !on;
      if (icPlay) icPlay.hidden = on;
      toggle.setAttribute("aria-label", on ? "Pause" : "Play");
      if (on) { lastTs = 0; raf = requestAnimationFrame(tick); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    function tick(ts) {
      if (!playing) return;
      if (!lastTs) lastTs = ts;
      elapsed += ts - lastTs;
      lastTs = ts;
      var pct = Math.min(elapsed / duration, 1);
      if (barEl) barEl.style.width = (pct * 100) + "%";
      if (pct >= 1) { go(1); return; }   // auto-advance like a real feed
      raf = requestAnimationFrame(tick);
    }

    function load(i) {
      current = (i + reels.length) % reels.length;
      var r = reels[current];
      imgEl.src = r.getAttribute("data-frame");
      imgEl.alt = r.getAttribute("data-cap") || "";
      tagEl.textContent = r.getAttribute("data-tag") || "";
      capEl.textContent = r.getAttribute("data-cap") || "";
      duration = parseDur(r.getAttribute("data-dur"));
      elapsed = 0; lastTs = 0;
      if (barEl) barEl.style.width = "0%";
      // restart the Ken Burns motion for the new frame
      imgEl.style.animation = "none";
      void imgEl.offsetWidth;
      imgEl.style.animation = "";
    }

    function go(step) { load(current + step); setPlaying(true); }

    function open(i) {
      load(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setPlaying(true);
    }

    function close() {
      setPlaying(false);
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    reels.forEach(function (reel, i) {
      reel.addEventListener("click", function () { open(i); });
      reel.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });

    toggle.addEventListener("click", function () { setPlaying(!playing); });
    box.querySelector(".reelbox__nav--next").addEventListener("click", function () { go(1); });
    box.querySelector(".reelbox__nav--prev").addEventListener("click", function () { go(-1); });
    box.querySelector(".reelbox__close").addEventListener("click", close);
    box.querySelector("[data-reelbox-cta]").addEventListener("click", close);

    // Click the dim backdrop (outside the stage / controls) to close.
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); setPlaying(!playing); }
    });
  }

  /* ============================================================
     Podcast card — inline play/pause with progress
     ============================================================ */
  function initPodcast() {
    var audio = document.getElementById("podAudio");
    var btn = document.getElementById("podPlay");
    var fill = document.getElementById("podFill");
    if (!audio || !btn) return;

    var icPlay = btn.querySelector(".ic-play");
    var icPause = btn.querySelector(".ic-pause");
    var lbl = btn.querySelector(".lbl");

    function setUI(playing) {
      if (icPlay) icPlay.hidden = playing;
      if (icPause) icPause.hidden = !playing;
      if (lbl) lbl.textContent = playing ? "Pause" : "Play episode";
      btn.setAttribute("aria-label", playing ? "Pause episode" : "Play episode");
    }

    btn.addEventListener("click", function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener("play", function () { setUI(true); });
    audio.addEventListener("pause", function () { setUI(false); });
    audio.addEventListener("ended", function () { setUI(false); });
    audio.addEventListener("timeupdate", function () {
      if (fill && isFinite(audio.duration)) {
        fill.style.width = (audio.currentTime / audio.duration * 100) + "%";
      }
    });
  }

  function init() {
    initCalculator();
    initLeadForm();
    initReveal();
    initReels();
    initPodcast();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
