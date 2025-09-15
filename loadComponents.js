// loadComponents.js
(function () {
  function run() {
    const origin = window.location.origin;           // e.g. http://localhost:5500
    const baseRoot = origin + "/";                   // force root-base for resolving links
    const sidebarHtmlUrl = baseRoot + "navSidebar/Sidebar.html";
    const sidebarCssUrl  = baseRoot + "navSidebar/sidebar.css";

    // insert CSS only once
    function ensureCss(href) {
      const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .some(link => link.href === href);
      if (!exists) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    }

    // get placeholder
    const container = document.getElementById("sidebar");
    if (!container) {
      console.error('Sidebar placeholder not found. Add <div id="sidebar"></div> to your page.');
      return;
    }

    // load CSS (so sidebar looks correct once injected)
    ensureCss(sidebarCssUrl);

    // fetch the sidebar HTML (Sidebar.html must contain only the fragment: header/aside markup — no <html>/<head>/<body>)
    fetch(sidebarHtmlUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Sidebar not found at ${sidebarHtmlUrl} (status ${res.status})`);
        return res.text();
      })
      .then(html => {
        container.innerHTML = html;

        // ---- normalize helper ----
        function normalizedPath(pathname) {
          // strip trailing slashes
          let p = (pathname || "").replace(/\/+$/, "");
          if (p === "") p = "/";            // root -> '/'
          // treat root as index.html for matching if your links point to index.html
          if (p === "/") return "/index.html";
          return p;
        }

        // convert all sidebar links to absolute (root-based) and compute active
        const links = container.querySelectorAll("a[href]");
        const currentPath = normalizedPath(window.location.pathname);

        links.forEach(link => {
          const rawHref = link.getAttribute("href") || "";
          // resolve relative href against site root so "../pages/..." becomes "/pages/..."
          let resolved;
          try {
            resolved = new URL(rawHref, baseRoot); // IMPORTANT: baseRoot forces root resolution
          } catch (e) {
            // fallback: if URL fails, skip
            return;
          }

          // set link to absolute URL (so clicks always go to correct place from any page)
          link.href = resolved.href;

          // active highlighting based on pathname only (ignore origin)
          const linkPath = normalizedPath(resolved.pathname);

          if (linkPath === currentPath) {
            link.classList.add("active");
            if (link.parentElement) link.parentElement.classList.add("active");
          } else {
            link.classList.remove("active");
            if (link.parentElement) link.parentElement.classList.remove("active");
          }
        });

        // dispatch event if other scripts need to know
        window.dispatchEvent(new CustomEvent("sidebarLoaded", { detail: { url: sidebarHtmlUrl } }));
      })
      .catch(err => {
        console.error("Error loading sidebar:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
