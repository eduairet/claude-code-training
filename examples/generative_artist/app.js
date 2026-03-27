(() => {
  const gallery = document.getElementById("gallery");
  const viewer = document.getElementById("viewer");
  const viewerClose = document.getElementById("viewer-close");
  const sketchContainer = document.getElementById("sketch-container");

  let currentP5 = null;
  let loadedScript = null;
  let openingSlug = null;

  // ── Load Gallery ───────────────────────────────────────

  async function loadGallery() {
    gallery.innerHTML = '<p class="gallery-loading">Loading sketches...</p>';

    let slugs;
    try {
      const res = await fetch("sketches/index.json");
      if (!res.ok) throw new Error(res.status);
      slugs = await res.json();
    } catch {
      gallery.innerHTML =
        '<p class="gallery-empty">No sketches found. Use the Generative Artist agent to create some!</p>';
      return;
    }

    if (!slugs.length) {
      gallery.innerHTML =
        '<p class="gallery-empty">No sketches yet. Use the Generative Artist agent to create some!</p>';
      return;
    }

    gallery.innerHTML = "";

    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        const res = await fetch(`sketches/${slug}/meta.json`);
        if (!res.ok) throw new Error(res.status);
        return { slug, meta: await res.json() };
      })
    );

    const cardsToCapture = [];
    const cards = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        const { slug, meta } = r.value;
        const card = createCard(slug, meta);
        card.style.viewTransitionName = `card-${slug}`;
        cards.push(card);
        if (!meta.thumbnail) {
          cardsToCapture.push({ slug, card });
        }
      } else {
        console.warn("Skipping sketch — could not load meta.json:", r.reason);
      }
    }

    // Add cards with staggered view transitions
    if (document.startViewTransition) {
      for (const card of cards) {
        const t = document.startViewTransition(() => {
          gallery.appendChild(card);
        });
        // Small delay between each card for stagger effect
        await new Promise(r => setTimeout(r, 60));
      }
    } else {
      for (const card of cards) gallery.appendChild(card);
    }

    // Generate live thumbnails for cards without a static image
    for (const { slug, card } of cardsToCapture) {
      await captureThumbnail(slug, card);
    }
  }

  // ── Create Card ────────────────────────────────────────

  function createCard(slug, meta) {
    const card = document.createElement("article");
    card.className = "card";
    card.role = "listitem";
    card.tabIndex = 0;
    card.setAttribute("aria-label", `Open sketch: ${meta.title}`);
    card.dataset.slug = slug;

    const thumbnail = document.createElement("div");
    thumbnail.className = "card-thumbnail";

    if (meta.thumbnail) {
      const img = document.createElement("img");
      img.src = `sketches/${slug}/${meta.thumbnail}`;
      img.alt = `Preview of ${meta.title}`;
      img.loading = "lazy";
      thumbnail.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      thumbnail.appendChild(placeholder);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = meta.title;

    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = meta.description;

    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(thumbnail);
    card.appendChild(body);

    card.addEventListener("click", () => openSketch(slug));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openSketch(slug);
      }
    });

    return card;
  }

  // ── Thumbnail Capture ─────────────────────────────────

  const THUMB_W = 400;
  const THUMB_H = 300;
  const THUMB_FRAMES = 120;

  async function captureThumbnail(slug, card) {
    const container = document.createElement("div");
    container.style.cssText =
      `position:fixed;left:-9999px;top:-9999px;width:${THUMB_W}px;height:${THUMB_H}px;overflow:hidden;`;
    document.body.appendChild(container);

    let script = null;
    let instance = null;

    try {
      script = await appendScript(`sketches/${slug}/sketch.js`);

      if (typeof createSketch !== "function") return;

      const sketchFn = createSketch;
      delete window.createSketch;

      // Wrap to force thumbnail-sized canvas
      const dataUrl = await new Promise((resolve) => {
        let frameCount = 0;

        instance = new p5((p) => {
          sketchFn(p);

          const originalSetup = p.setup;
          p.setup = () => {
            p.createCanvas(THUMB_W, THUMB_H);
            // Run the original setup but skip its createCanvas
            const origCreateCanvas = p.createCanvas;
            p.createCanvas = () => {};
            if (originalSetup) originalSetup.call(p);
            p.createCanvas = origCreateCanvas;
          };

          const originalDraw = p.draw;
          p.draw = () => {
            if (originalDraw) originalDraw.call(p);
            frameCount++;
            if (frameCount >= THUMB_FRAMES) {
              p.noLoop();
              const canvas = container.querySelector("canvas");
              resolve(canvas ? canvas.toDataURL("image/png") : null);
            }
          };

          // Override windowWidth/Height for proportional sizing
          Object.defineProperty(p, "windowWidth", { get: () => THUMB_W });
          Object.defineProperty(p, "windowHeight", { get: () => THUMB_H });
        }, container);
      });

      if (dataUrl) {
        const thumbDiv = card.querySelector(".card-thumbnail");
        thumbDiv.innerHTML = "";
        const img = document.createElement("img");
        img.src = dataUrl;
        img.alt = "Sketch preview";
        thumbDiv.appendChild(img);
      }
    } catch (err) {
      console.warn(`Could not capture thumbnail for "${slug}":`, err);
    } finally {
      if (instance) instance.remove();
      if (script) script.remove();
      if (window.createSketch) delete window.createSketch;
      container.remove();
    }
  }

  // ── Open Sketch ────────────────────────────────────────

  async function openSketch(slug, pushHash = true) {
    closeSketch(false);
    openingSlug = slug;

    if (pushHash) {
      history.pushState({ sketch: slug }, "", `?sketch=${slug}`);
    }

    // Find the clicked card's thumbnail and tag it for the transition
    const card = gallery.querySelector(`.card[data-slug="${slug}"]`);
    const thumb = card ? card.querySelector(".card-thumbnail") : null;
    if (thumb) thumb.style.viewTransitionName = "sketch-expand";

    // The viewer takes over the same name so the browser morphs between them
    sketchContainer.style.viewTransitionName = "sketch-expand";

    const showViewer = () => {
      // Remove the name from the thumbnail so only the viewer owns it
      if (thumb) thumb.style.viewTransitionName = "";
      viewer.classList.remove("hidden");
      viewer.setAttribute("aria-hidden", "false");
      viewerClose.focus();
    };

    if (document.startViewTransition) {
      await document.startViewTransition(showViewer).finished;
    } else {
      showViewer();
    }

    try {
      loadedScript = await appendScript(`sketches/${slug}/sketch.js`);

      // Guard against a second openSketch call superseding this one
      if (openingSlug !== slug) return;

      if (typeof createSketch === "function") {
        currentP5 = new p5(createSketch, sketchContainer);
      } else {
        console.warn("Sketch script loaded but did not define createSketch()");
        sketchContainer.innerHTML = '<p class="sketch-error">Could not load sketch.</p>';
      }
    } catch (err) {
      console.error(`Failed to load sketch "${slug}":`, err);
      sketchContainer.innerHTML = '<p class="sketch-error">Error loading sketch.</p>';
    }
  }

  function appendScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve(el);
      el.onerror = reject;
      document.body.appendChild(el);
    });
  }

  // ── Close Sketch ───────────────────────────────────────

  function closeSketch(pushHash = true) {
    const wasOpen = !viewer.classList.contains("hidden");
    const slug = openingSlug;

    if (currentP5) {
      currentP5.remove();
      currentP5 = null;
    }

    if (loadedScript) {
      loadedScript.remove();
      loadedScript = null;
    }

    if (window.createSketch) {
      delete window.createSketch;
    }

    // Find the card to transition back to
    const card = slug ? gallery.querySelector(`.card[data-slug="${slug}"]`) : null;
    const thumb = card ? card.querySelector(".card-thumbnail") : null;

    const hideViewer = () => {
      sketchContainer.innerHTML = "";
      sketchContainer.style.viewTransitionName = "";
      viewer.classList.add("hidden");
      viewer.setAttribute("aria-hidden", "true");
      if (thumb) {
        thumb.style.viewTransitionName = "sketch-expand";
        // Clean up after transition
        requestAnimationFrame(() => { thumb.style.viewTransitionName = ""; });
      }
    };

    if (wasOpen && document.startViewTransition) {
      document.startViewTransition(hideViewer);
    } else {
      hideViewer();
    }

    if (pushHash) {
      history.pushState({}, "", window.location.pathname);
    }
  }

  // ── Event Listeners ────────────────────────────────────

  viewerClose.addEventListener("click", closeSketch);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !viewer.classList.contains("hidden")) {
      closeSketch();
    }
  });

  // ── URL Routing ───────────────────────────────────────

  function getSlugFromURL() {
    return new URLSearchParams(window.location.search).get("sketch") || "";
  }

  function handleRoute() {
    const slug = getSlugFromURL();
    if (slug) {
      openSketch(slug, false);
    } else {
      closeSketch(false);
    }
  }

  window.addEventListener("popstate", handleRoute);

  // ── Init ───────────────────────────────────────────────

  loadGallery().then(() => {
    const slug = getSlugFromURL();
    if (slug) {
      openSketch(slug, false);
    }
  });
})();
