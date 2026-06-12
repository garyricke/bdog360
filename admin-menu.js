/*
 * Bulldog 360 — Admin Menu
 *
 * Auto-injects a floating "A" trigger button (bottom-right) and a
 * popover panel listing every admin page. Current page auto-
 * highlights based on the URL. To add a new admin page, append an
 * entry to PAGES below.
 */
(function () {
  var PAGES = [
    {
      href: "index.html",
      title: "Growth Plan",
      sub: "Market analysis & budget",
      icon: "chart"
    },
    {
      href: "brand-guide.html",
      title: "Brand Guide",
      sub: "Identity system",
      icon: "palette"
    },
    {
      href: "price-justification.html",
      title: "Price Justification",
      sub: "Internal · for Gary & Tyler",
      icon: "clipboard"
    },
    {
      href: "landing.html",
      title: "Landing Page",
      sub: "Consumer debt-relief sample",
      icon: "window"
    },
    {
      href: "email-sample.html",
      title: "Email Sample",
      sub: "Consumer outreach",
      icon: "chat"
    },
    {
      href: "postcard-sample.html",
      title: "Postcard Sample",
      sub: "6×9 direct mail",
      icon: "clipboard"
    },
    {
      href: "quote-estimate.html",
      title: "Quote Estimate",
      sub: "Website · email · print design",
      icon: "receipt"
    },
    {
      href: "videos.html",
      title: "Video Strategy",
      sub: "Short-form content plan",
      icon: "video"
    },
    {
      href: "podcast.html",
      title: "Podcast Strategy",
      sub: "Episodes + sample audio",
      icon: "mic"
    },
    {
      href: "episode-27-year-trap.html",
      title: "Ep. 01 — Interactive",
      sub: "The 27-Year Trap · player + extras",
      icon: "headphones"
    }
  ];

  // Inline SVG icon set — outlines, 24x24 viewBox, currentColor stroke
  var ICONS = {
    chart:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 21h18"/>' +
      '<path d="M6 17v-6"/>' +
      '<path d="M12 17V6"/>' +
      '<path d="M18 17v-9"/>' +
      "</svg>",
    palette:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.886.523 3.65 1.434 5.156A2 2 0 0 0 5.31 19h.94a2 2 0 0 1 0 4z"/>' +
      '<circle cx="7.5" cy="10.5" r="1.4" fill="currentColor" stroke="none"/>' +
      '<circle cx="12" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>' +
      '<circle cx="16.5" cy="10.5" r="1.4" fill="currentColor" stroke="none"/>' +
      '<circle cx="14.5" cy="15" r="1.4" fill="currentColor" stroke="none"/>' +
      "</svg>",
    window:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
      '<path d="M3 9h18"/>' +
      '<circle cx="6.5" cy="6.5" r="0.5" fill="currentColor"/>' +
      '<circle cx="8.5" cy="6.5" r="0.5" fill="currentColor"/>' +
      "</svg>",
    clipboard:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="6" y="4" width="12" height="17" rx="2"/>' +
      '<rect x="9" y="2" width="6" height="4" rx="1"/>' +
      '<path d="M9.5 13l2 2 4-4"/>' +
      "</svg>",
    chat:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M21 12a9 9 0 1 1-3.5-7.1L21 4l-1 3.5A9 9 0 0 1 21 12z"/>' +
      "</svg>",
    people:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="9" cy="8" r="3"/>' +
      '<path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>' +
      '<circle cx="17" cy="9" r="2.5"/>' +
      '<path d="M21 20c0-2.5-2-4.5-4.5-4.5"/>' +
      "</svg>",
    key:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="8" cy="14" r="4"/>' +
      '<path d="M11 12l9-9"/>' +
      '<path d="M16 7l3 3"/>' +
      "</svg>",
    ribbon:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="9" r="6"/>' +
      '<path d="M9 14l-2 7 5-3 5 3-2-7"/>' +
      "</svg>",
    receipt:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3l-2.5 1.5L14 3l-2 1.5L10 3 7.5 4.5 5 3z"/>' +
      '<path d="M9 8h6"/>' +
      '<path d="M9 12h6"/>' +
      "</svg>",
    video:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="3" y="6" width="13" height="12" rx="2"/>' +
      '<path d="M16 10l5-3v10l-5-3z"/>' +
      "</svg>",
    mic:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
      '<path d="M6 11a6 6 0 0 0 12 0"/>' +
      '<path d="M12 17v4M9 21h6"/>' +
      "</svg>",
    headphones:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/>' +
      '<rect x="3" y="14" width="4" height="6" rx="1.5"/>' +
      '<rect x="17" y="14" width="4" height="6" rx="1.5"/>' +
      "</svg>"
  };

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentPage() {
    var path = location.pathname.split("/").pop() || "";
    if (!path) return "index.html";
    return path;
  }

  function buildItem(page, current) {
    var isCurrent = current === page.href;
    var icon = ICONS[page.icon] || "";
    return (
      '<a class="admin-menu__item" href="' + page.href + '"' +
      (isCurrent ? ' aria-current="page"' : "") +
      ' role="menuitem">' +
      '<div class="admin-menu__icon">' + icon + "</div>" +
      '<div class="admin-menu__text">' +
      '<p class="admin-menu__title">' + escapeHTML(page.title) + "</p>" +
      '<p class="admin-menu__sub">' + escapeHTML(page.sub) + "</p>" +
      "</div>" +
      "</a>"
    );
  }

  function build() {
    if (document.querySelector(".admin-menu")) return;
    var current = currentPage();

    var menu = document.createElement("div");
    menu.className = "admin-menu";
    menu.setAttribute("data-open", "false");
    menu.innerHTML =
      '<div class="admin-menu__panel" role="menu" aria-label="Admin pages">' +
      '<p class="admin-menu__heading">Admin Pages</p>' +
      '<div class="admin-menu__list">' +
      PAGES.map(function (p) { return buildItem(p, current); }).join("") +
      "</div>" +
      "</div>" +
      '<button class="admin-menu__trigger" type="button" aria-label="Toggle admin menu" aria-expanded="false" aria-haspopup="menu">A</button>';

    document.body.appendChild(menu);

    var trigger = menu.querySelector(".admin-menu__trigger");

    function setOpen(state) {
      menu.setAttribute("data-open", state ? "true" : "false");
      trigger.setAttribute("aria-expanded", state ? "true" : "false");
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.getAttribute("data-open") === "true";
      setOpen(!open);
    });

    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
