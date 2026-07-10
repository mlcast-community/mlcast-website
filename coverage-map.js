/*
 * Shared coverage-map renderer.
 *
 * Draws the flag markers and the Countries / Years / Cadence overlays on the
 * "Dataset Catalog" world maps (home.html and contributing.html) from the
 * build-time `catalog-data.json` (producer: scripts/fetch-catalog-stats.py).
 *
 * Which countries appear, where their markers sit, and the overlay numbers are
 * all data-driven, so a new dataset in the catalog updates the maps with no
 * HTML edit. Presentation-only tooltip detail (provider, resolution, data
 * range) is NOT in the catalog and lives in COUNTRY_META below; a covered
 * country missing from COUNTRY_META still renders a marker, just with a
 * reduced tooltip.
 *
 * DOM contract, per map (scoped to the viewport element passed in):
 *   - one `[data-coverage-markers]` container whose `data-coverage-variant`
 *     is "rich" (hover tooltip, home) or "plain" (flag only, contributing);
 *     its static children are the fallback markers and are replaced on success.
 *   - up to three `[data-coverage-stat="countries|years|cadence"]` elements.
 *
 * On any fetch/parse failure the static HTML fallback is left untouched.
 */
(function () {
  "use strict";

  // ISO 3166-1 alpha-2 -> presentation detail for marker tooltips. Not derived
  // from the catalog; keep in sync with real dataset providers as coverage
  // grows. Country codes/positions/flags themselves come from catalog-data.json.
  var COUNTRY_META = {
    gb: { name: "United Kingdom", provider: "Met Office", range: "2005–2025", cadence: "5 min", resolution: "1 km" },
    dk: { name: "Denmark", provider: "DMI", range: "2016–2025", cadence: "10 min", resolution: "2 km" },
    be: { name: "Belgium", provider: "RMI", range: "2017–2023", cadence: "5 min", resolution: "600 m" },
    de: { name: "Germany", provider: "DWD", range: "2001–2023", cadence: "5 min", resolution: "1 km" },
    it: { name: "Italy", provider: "DPC", range: "2010–2025", cadence: "5 min", resolution: "1 km" }
  };

  var DATA_URL = "catalog-data.json";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }

  function tooltipHtml(meta) {
    var rows = [];
    if (meta.provider) rows.push(["Provider", meta.provider]);
    if (meta.range) rows.push(["Data range", meta.range]);
    if (meta.cadence) rows.push(["Sampling rate", meta.cadence]);
    if (meta.resolution) rows.push(["Resolution", meta.resolution]);
    if (!rows.length && meta.name) rows.push(["Country", meta.name]);
    if (!rows.length) return "";
    var inner = rows.map(function (r) {
      return '<span class="block text-[9px] leading-tight text-on-surface-variant">' +
        '<span class="text-primary-fixed font-semibold">' + escapeHtml(r[0]) + ':</span> ' +
        escapeHtml(r[1]) + "</span>";
    }).join("");
    return '<span class="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 z-30 w-max ' +
      'rounded border border-primary-fixed/40 bg-surface-creme px-1.5 py-1 text-left opacity-0 ' +
      'shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover:opacity-100">' +
      inner + "</span>";
  }

  function markerHtml(marker, index, variant) {
    var code = escapeHtml(marker.flag || marker.country || "");
    var meta = COUNTRY_META[marker.country] || {};
    var alt = escapeHtml(meta.name || (marker.country || "").toUpperCase());
    var pos = "left:" + Number(marker.x) + "%;top:" + Number(marker.y) + "%";
    var delay = index ? ' style="animation-delay:' + (index * 0.4).toFixed(1) + 's"' : "";
    var badge =
      '<span class="relative flex h-4 w-4 items-center justify-center">' +
      '<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-fixed/40"' + delay + "></span>" +
      '<span class="relative inline-flex h-4 w-4 overflow-hidden rounded-full border border-primary-fixed/60 ' +
      'bg-surface-creme shadow-[0_4px_16px_rgba(0,0,0,0.5)]">' +
      '<img src="https://flagcdn.com/' + code + '.svg" alt="' + alt + '" loading="lazy" class="h-full w-full object-cover">' +
      "</span></span>";

    if (variant === "rich") {
      return '<div class="group absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-20 map-marker" style="' + pos + '">' +
        tooltipHtml(meta) + badge + "</div>";
    }
    return '<div class="absolute -translate-x-1/2 -translate-y-1/2" style="' + pos + '">' + badge + "</div>";
  }

  function formatCadence(min) {
    if (min == null) return null;
    return min >= 60 && min % 60 === 0 ? min / 60 + "h" : min + "m";
  }

  function setStat(root, key, value) {
    if (value == null) return; // keep static fallback
    var el = root.querySelector('[data-coverage-stat="' + key + '"]');
    if (el) el.textContent = value;
  }

  // Hide any static "wanted" (+) marker whose country is now covered, so a
  // freshly-added catalog country shows only its flag instead of a flag plus a
  // stale "help us" pin on the same spot. Codes are matched case-insensitively
  // against each marker's ISO alpha-2 (country, falling back to flag).
  function hideCoveredWanted(root, markers) {
    var covered = {};
    markers.forEach(function (m) {
      var code = String(m.country || m.flag || "").toLowerCase();
      if (code) covered[code] = true;
    });
    root.querySelectorAll("[data-wanted-code]").forEach(function (el) {
      var code = (el.getAttribute("data-wanted-code") || "").toLowerCase();
      el.hidden = !!covered[code];
    });
  }

  function apply(root, data) {
    var container = root.querySelector("[data-coverage-markers]");
    if (container && Array.isArray(data.markers) && data.markers.length) {
      var variant = container.getAttribute("data-coverage-variant") || "plain";
      container.innerHTML = data.markers.map(function (m, i) {
        return markerHtml(m, i, variant);
      }).join("");
      hideCoveredWanted(root, data.markers);
    }
    setStat(root, "countries", data.countries);
    setStat(root, "years", data.cumulative_years == null ? null : "~" + data.cumulative_years);
    setStat(root, "cadence", formatCadence(data.best_cadence_minutes));
  }

  window.renderCoverageMap = function (viewportId) {
    var root = document.getElementById(viewportId);
    if (!root) return;
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (data) { apply(root, data); })
      .catch(function () { /* keep static fallback markers and numbers */ });
  };
})();
