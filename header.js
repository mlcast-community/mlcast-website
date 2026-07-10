// Shared site chrome: header + mobile menu, footer, and copy-on-select.
// Usage: put <div id="site-header"></div> and <div id="site-footer"></div>
// where each should render, then load with <script src="header.js" defer></script>.
// Injecting markup here (instead of fetch) keeps it working on file:// too.
(function () {
    "use strict";

    var GITHUB_ICON =
        '<path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.38 6.84 9.74.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.33 9.33 0 0 1 12 7.01c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.08 10.08 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>';

    var GITHUB_URL = "https://github.com/mlcast-community";
    // Relative so it follows whatever origin/base path serves the site
    // (project Pages subpath, custom domain, or file://). Docs are staged into
    // /docs at deploy time. All pages live at the site root, so "docs/" resolves
    // to <site-base>/docs/ everywhere.
    var DOCS_URL = "docs/";
    var SLACK_URL = "https://mlcast.slack.com/join/shared_invite/zt-42iu8odsi-lim6KkEULzZt_KbcxoiTZg#/shared-invite/email";

    // Single source of truth for the primary nav.
    var NAV_LINKS = [
        { href: "software.html", label: "Software" },
        { href: "data.html", label: "Data" },
        { href: "community.html", label: "Community" },
        { href: "contributing.html", label: "Contributing" },
        { href: "faq.html", label: "FAQ" }
    ];

    var current = (location.pathname.split("/").pop() || "home.html").toLowerCase();

    function isActive(href) {
        return href.split("#")[0].toLowerCase() === current;
    }

    var desktopLinks = NAV_LINKS.map(function (l) {
        return (
            '<a class="text-on-surface-variant text-sm uppercase tracking-wider hover:text-primary transition-colors' +
            (isActive(l.href) ? " text-primary" : "") +
            '" href="' + l.href + '">' + l.label + "</a>"
        );
    }).join("\n");

    var mobileLinks = NAV_LINKS.map(function (l) {
        return '<a href="' + l.href + '">' + l.label + "</a>";
    }).join("\n");

    var markup =
        '<header class="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/80 backdrop-blur-xl">' +
        '  <div class="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-md w-full max-w-[1440px] mx-auto">' +
        '    <a href="home.html" class="flex items-center hover:opacity-80 transition-opacity shrink-0">' +
        '      <img src="img/Logo_linea.svg" alt="MLCast Community" class="h-8 w-auto" />' +
        "    </a>" +
        '    <nav class="hidden md:flex items-center gap-lg">' + desktopLinks + "</nav>" +
        '    <div class="navbar-actions" aria-label="Project links">' +
        '      <a class="navbar-icon-link navbar-icon-link--labeled" href="' + GITHUB_URL + '" target="_blank" rel="noreferrer" aria-label="MLCast GitHub community" title="GitHub community">' +
        '        <svg viewBox="0 0 24 24" aria-hidden="true">' + GITHUB_ICON + "</svg>" +
        '        <span class="max-sm:hidden">GitHub</span>' +
        "      </a>" +
        '      <a class="navbar-icon-link navbar-icon-link--labeled" href="' + DOCS_URL + '" target="_blank" rel="noreferrer" aria-label="MLCast documentation" title="Documentation">' +
        '        <span class="material-symbols-outlined" aria-hidden="true">description</span>' +
        '        <span class="max-sm:hidden">Docs</span>' +
        "      </a>" +
        "    </div>" +
        '    <button id="hamburger-btn" class="hamburger-btn md:hidden" aria-label="Menu" aria-expanded="false">' +
        '      <span class="material-symbols-outlined">menu</span>' +
        "    </button>" +
        "  </div>" +
        "</header>" +
        '<div id="mobile-menu-overlay" class="mobile-menu-overlay" aria-hidden="true"></div>' +
        '<nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation">' +
        mobileLinks +
        '  <div class="mobile-menu-actions">' +
        '    <a href="' + GITHUB_URL + '" target="_blank" rel="noreferrer" aria-label="GitHub">' +
        '      <svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px;fill:currentColor">' + GITHUB_ICON + "</svg>GitHub</a>" +
        '    <a href="' + DOCS_URL + '" target="_blank" rel="noreferrer" aria-label="Documentation">' +
        '      <span class="material-symbols-outlined" style="font-size:16px">description</span>Docs</a>' +
        "  </div>" +
        "</nav>";

    var mount = document.getElementById("site-header");
    if (mount) mount.outerHTML = markup;

    // --- Shared footer ---
    var footerMarkup =
        '<footer class="border-t border-outline-variant/20 bg-surface-creme py-xl mt-24">' +
        '  <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-lg text-sm">' +
        '    <div class="col-span-2 md:col-span-1">' +
        '      <img src="img/Logo_linea.svg" alt="MLCast Community" class="h-7 w-auto mb-md" />' +
        '      <p class="text-on-surface-variant leading-relaxed">Advancing meteorological intelligence through open-source collaboration and high-resolution data.</p>' +
        "    </div>" +
        "    <div>" +
        '      <h4 class="font-bold text-primary mb-md">Resources</h4>' +
        '      <ul class="space-y-sm text-on-surface-variant">' +
        '        <li><a href="' + DOCS_URL + '" class="hover:text-primary-fixed">Documentation</a></li>' +
        '        <li><a href="' + DOCS_URL + 'api-reference/" class="hover:text-primary-fixed">API Reference</a></li>' +
        '        <li><a href="' + DOCS_URL + 'data/" class="hover:text-primary-fixed">Dataset Catalog</a></li>' +
        '        <li><a href="' + DOCS_URL + 'validator/" class="hover:text-primary-fixed">Validation Tool</a></li>' +
        "      </ul>" +
        "    </div>" +
        "    <div>" +
        '      <h4 class="font-bold text-primary mb-md">Community</h4>' +
        '      <ul class="space-y-sm text-on-surface-variant">' +
        '        <li><a href="' + GITHUB_URL + '" class="hover:text-primary-fixed">GitHub</a></li>' +
        '        <li><a href="' + SLACK_URL + '" class="hover:text-primary-fixed">Discussions</a></li>' +
        '        <li><a href="mailto:mlcastcommunity%2Bsubscribe@googlegroups.com" class="hover:text-primary-fixed">Newsletter</a></li>' +
        '        <li><a href="https://github.com/orgs/mlcast-community/people" class="hover:text-primary-fixed">Contributors</a></li>' +
        "      </ul>" +
        "    </div>" +
        "    <div>" +
        '      <h4 class="font-bold text-primary mb-md">Legal</h4>' +
        '      <p class="text-on-surface-variant text-xs italic">© 2026 MLCast Community. Released under MIT License.</p>' +
        '      <p class="mt-lg font-bold text-primary text-xs uppercase tracking-widest">Get in touch</p>' +
        '      <a class="footer-cta mt-sm inline-flex items-center justify-center gap-2 bg-primary-fixed text-on-primary-fixed px-8 py-4 min-h-[44px] rounded-lg font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity" href="' + SLACK_URL + '" target="_blank" rel="noreferrer">' +
        '        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>' +
        "        Join Slack" +
        "      </a>" +
        "    </div>" +
        "  </div>" +
        "</footer>";

    var footerMount = document.getElementById("site-footer");
    if (footerMount) footerMount.outerHTML = footerMarkup;

    // --- Copy-on-select for terminal windows ---
    // Selecting text inside a .terminal-window copies it and shows a toast.
    // Delegated on document so it also covers terminals injected later.
    (function () {
        var toast = null;
        var timer = null;

        function showToast(msg) {
            if (!toast) {
                toast = document.createElement("div");
                toast.className = "copy-toast";
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.classList.add("show");
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
        }

        function copyText(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            }
            return new Promise(function (resolve, reject) {
                var ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                var ok = document.execCommand("copy");
                document.body.removeChild(ta);
                ok ? resolve() : reject();
            });
        }

        function handleSelection(e) {
            if (!e.target.closest(".terminal-window")) return;
            setTimeout(function () {
                var sel = window.getSelection();
                if (!sel || sel.isCollapsed) return;
                var text = sel.toString().trim();
                if (!text) return;
                copyText(text).then(
                    function () { showToast("Copied to clipboard"); },
                    function () { showToast("Copy failed"); }
                );
            }, 10);
        }

        document.addEventListener("mouseup", handleSelection);
        // touchend needs a longer delay so the text selection settles on mobile.
        document.addEventListener("touchend", function (e) {
            if (!e.target.closest(".terminal-window")) return;
            setTimeout(function () {
                var sel = window.getSelection();
                if (!sel || sel.isCollapsed) return;
                var text = sel.toString().trim();
                if (!text) return;
                copyText(text).then(
                    function () { showToast("Copied to clipboard"); },
                    function () { showToast("Copy failed"); }
                );
            }, 300);
        });
    })();

    // Hamburger menu
    var btn = document.getElementById("hamburger-btn");
    var menu = document.getElementById("mobile-menu");
    var overlay = document.getElementById("mobile-menu-overlay");
    if (!btn || !menu || !overlay) return;

    function open() {
        menu.classList.add("open");
        overlay.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".material-symbols-outlined").textContent = "close";
        document.body.style.overflow = "hidden";
    }
    function close() {
        menu.classList.remove("open");
        overlay.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector(".material-symbols-outlined").textContent = "menu";
        document.body.style.overflow = "";
    }
    btn.addEventListener("click", function () {
        menu.classList.contains("open") ? close() : open();
    });
    overlay.addEventListener("click", close);
    menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", close);
    });
})();
