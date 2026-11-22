// Shared by index.html and arcade.html: helpers, pixel icons, day/night toggle, GitHub data, arcade demos.

const GH_USER = "AshleyKimm";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);

/* ---------- Pixel icons: each letter is one pixel, "." is empty ---------- */
function px(rows, colors, scale = 3) {
    let rects = "";
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (colors[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`;
    }));
    const w = rows[0].length, h = rows.length;
    return `<svg class="px" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
const STAR_ROWS = ["....o....", "...oyo...", "oooyyyooo", "oyyyyyyyo", ".oyyyyyo.", "..oyyyo..", ".oyyoyyo.", ".oyo.oyo.", ".oo...oo."];
const ICONS = {
    star: px(STAR_ROWS, { o: "#7a4a12", y: "#ffd23f" }, 2),
    bigStar: px(STAR_ROWS, { o: "#7a4a12", y: "#ffd23f" }, 3),
    heart: px([".oo.oo.", "owrorro", "orrrrro", ".orrro.", "..oro..", "...o..."],
        { o: "#5b1a1a", r: "#e5484d", w: "#ffffff" }, 3),
    chest: px([".ooooooo.", "obbbbbbbo", "obbbbbbbo", "ooooyoooo", "obbbybbbo", "obbbbbbbo", "ooooooooo"],
        { o: "#5b3417", b: "#b86b2e", y: "#ffd23f" }, 3),
    sprout: px(["ll...ll", "lgl.lgl", ".lgggl.", "...g...", "...g...", ".ddddd.", "ddddddd"],
        { l: "#7cc243", g: "#3f7f25", d: "#8b5a2b" }, 5),
    play: px(["c....", "cc...", "ccc..", "cccc.", "ccc..", "cc...", "c...."], { c: "currentColor" }, 3),
    bigPlay: px([".ooooooooo.", "ogggggggggo", "ogggwgggggo", "ogggwwggggo", "ogggwwwgggo", "ogggwwwwggo",
                 "ogggwwwgggo", "ogggwwggggo", "ogggwgggggo", "ogggggggggo", ".ooooooooo."],
        { o: "#4a2a12", g: "#5aa83a", w: "#fff5d6" }, 6),
    pin: px([".rrr.", "rwrrr", "rrrrr", ".rrr.", "..g..", "..g..", "..g.."],
        { r: "#e5484d", w: "#ffb3b3", g: "#6b6b6b" }, 3),
    arrow: px(["..cccc", "....cc", "...c.c", "..c..c", ".c....", "c....."], { c: "currentColor" }, 3),
    fullscreen: px(["ccc.ccc", "c.....c", "c.....c", ".......", "c.....c", "c.....c", "ccc.ccc"], { c: "currentColor" }, 3),
    sun: px(["....y....", ".y.....y.", "...yyy...", "..yyyyy..", "y.yyyyy.y", "..yyyyy..", "...yyy...", ".y.....y.", "....y...."],
        { y: "#ffd23f" }, 3),
    // Inventory slots
    house: px([".....oo.....", "....orro....", "...orrrro...", "..orrrrrro..", ".orrrrrrrro.", "oooooooooooo",
               ".owwwwwwwwo.", ".owbbwwddwo.", ".owbbwwddwo.", ".owwwwwddwo.", ".oooooooooo."],
        { o: "#4a2a12", r: "#c8453f", w: "#f3d9a4", b: "#6ec6f0", d: "#8a5424" }, 4),
    briefcase: px(["....oooo....", "...o....o...", "oooooooooooo", "obbbbbbbbbbo", "obbbbbbbbbbo", "ooooooyyoooo",
                   "obbbbbyybbbo", "obbbbbbbbbbo", "obbbbbbbbbbo", "oooooooooooo"],
        { o: "#4a2a12", b: "#9c5f27", y: "#ffd23f" }, 4),
    chestBig: px(["..oooooooo..", ".obbbbbbbbo.", "obbbbbbbbbbo", "oggggggggggo", "oooooyyooooo", "obbbbyybbbbo",
                  "obbbbbbbbbbo", "oggggggggggo", "obbbbbbbbbbo", "oooooooooooo"],
        { o: "#4a2a12", b: "#b86b2e", g: "#d9a441", y: "#ffd23f" }, 4),
    joystick: px(["....rrrr....", "...rwrrrr...", "...rrrrrr...", "....rrrr....", ".....oo.....", ".....oo.....",
                  ".oooooooooo.", "oggggggggggo", "ogyggggbgggo", "oggggggggggo", "oooooooooooo"],
        { r: "#e5484d", w: "#ffb3b3", o: "#4a2a12", g: "#4b4b6e", y: "#ffd23f", b: "#5aa83a" }, 4),
    moon: px(["...mmmm..", "..mmm....", ".mmm.....", ".mmm.....", ".mmm.....", ".mmmm....", "..mmmmmm.", "...mmmm.."],
        { m: "#f4ecc2" }, 3)
};
document.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ""; });

/* ---------- Day / night ---------- */
const root = document.documentElement;
function paintThemeBtn() {
    const night = root.dataset.theme === "dark";
    $("theme").innerHTML = night ? ICONS.sun : ICONS.moon;
    $("theme").setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
}
$("theme").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    paintThemeBtn();
});
paintThemeBtn();


/* ---------- GitHub data (cached for 10 min to stay under GitHub's rate limit) ---------- */
const HIDDEN = new Set([`${GH_USER}.github.io`, GH_USER].map(n => n.toLowerCase()));
// pinned.json is kept up to date by .github/workflows/sync-pinned.yml.
// Read from raw.githubusercontent so it works without waiting for a Pages rebuild.
const PINNED_URL = `https://raw.githubusercontent.com/${GH_USER}/${GH_USER.toLowerCase()}.github.io/main/pinned.json`;

async function getJSON(url) {
    const key = "gh:" + url;
    try {
        const c = JSON.parse(sessionStorage.getItem(key));
        if (c && Date.now() - c.t < 10 * 60 * 1000) return c.d;
    } catch (e) {}
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
    return d;
}

// data/github.json is a daily snapshot of the profile and project list, saved by the same workflow.
// Loading it avoids GitHub's limit of 60 API requests an hour per network (e.g. shared Wi-Fi).
const DATA_URL = `https://raw.githubusercontent.com/${GH_USER}/${GH_USER.toLowerCase()}.github.io/main/data/github.json`;

async function loadGitHub() {
    const [saved, pinned] = await Promise.all([
        getJSON(DATA_URL).catch(() => null),
        getJSON(PINNED_URL).catch(() => []) // no pins is fine; just skip them
    ]);
    let user, repos;
    if (saved && saved.user && Array.isArray(saved.repos)) {
        ({ user, repos } = saved);
    } else { // no snapshot yet: ask GitHub's API directly
        [user, repos] = await Promise.all([
            getJSON(`https://api.github.com/users/${GH_USER}`),
            getJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`)
        ]);
    }
    return {
        user,
        repos: repos.filter(r => !r.fork && !r.archived && !HIDDEN.has(r.name.toLowerCase())),
        pinned: Array.isArray(pinned) ? pinned.map(n => String(n).toLowerCase()) : []
    };
}

// Position in the pinned list, or Infinity if not pinned
const rankIn = (pinned, name) => { const i = pinned.indexOf(String(name).toLowerCase()); return i === -1 ? Infinity : i; };

/* ---------- Arcade demos ---------- */
// Only allow web links or paths inside this site
const safeUrl = u => /^https?:\/\//i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : "#";

// A project is playable automatically if its repo publishes a GitHub Pages site.
function pagesUrl(r) {
    if (!r.has_pages) return null;
    if (r.homepage && /^https:\/\//i.test(r.homepage)) return r.homepage;
    return `https://${GH_USER.toLowerCase()}.github.io/${r.name}/`;
}

// Every demo: GitHub Pages projects, plus anything listed in arcade.js.
// An arcade.js entry with the same repo as a Pages project changes how that demo looks;
// further entries for the same repo are added as extra demos.
function buildDemos(repos = [], pinned = []) {
    const extras = (Array.isArray(window.ARCADE) ? window.ARCADE : []).filter(d => d && typeof d === "object");
    const byRepo = new Map(repos.map(r => [r.name.toLowerCase(), r]));
    const demos = [];
    repos.forEach(r => {
        const url = pagesUrl(r);
        if (url) demos.push({ repo: r.name, title: r.name, url, description: r.description || "", order: Infinity });
    });
    const merged = new Set();
    extras.forEach((x, i) => {
        const key = String(x.repo || "").toLowerCase();
        const auto = key && !merged.has(key) ? demos.find(d => d.order === Infinity && d.repo.toLowerCase() === key) : null;
        if (auto) {
            merged.add(key);
            Object.assign(auto, Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined && v !== "")), { order: i });
        } else if (x.url) {
            demos.push({ title: x.repo, ...x, order: i });
        }
    });
    const pushed = d => { const r = byRepo.get(String(d.repo || "").toLowerCase()); return r ? new Date(r.pushed_at) : 0; };
    demos.sort((a, b) =>
        (rankIn(pinned, a.repo || "") - rankIn(pinned, b.repo || "") || 0) ||   // pinned projects first
        (a.order - b.order || 0) ||                                             // then arcade.js order
        pushed(b) - pushed(a));                                                 // then recently updated
    // Unique ids (demo-minesweeper-qt, ...) used by "Play demo" to scroll to the right game
    const seen = {};
    demos.forEach(d => {
        const base = "demo-" + (String(d.repo || d.title || "demo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "demo");
        seen[base] = (seen[base] || 0) + 1;
        d.id = seen[base] > 1 ? `${base}-${seen[base]}` : base;
    });
    return demos;
}
const demoForRepo = (demos, name) => demos.find(d => String(d.repo || "").toLowerCase() === name.toLowerCase());

/* ---------- Clean URLs: ashleykimm.github.io/arcade, no "#" ---------- */
// GitHub Pages serves arcade.html at /arcade (and so on). Files opened straight from disk need the .html names.
const LOCAL = location.protocol === "file:";
const PAGES = {
    home: LOCAL ? "index.html" : "./",
    experience: LOCAL ? "experience.html" : "experience",
    projects: LOCAL ? "projects.html" : "projects",
    arcade: LOCAL ? "arcade.html" : "arcade"
};
document.querySelectorAll("a[data-page]").forEach(a => { a.href = PAGES[a.dataset.page]; });

// Links with data-target scroll to that part of the page without adding "#..." to the address.
// If the target is on another page, remember it and scroll there once that page loads.
document.addEventListener("click", e => {
    const a = e.target.closest("a[data-target]");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    const el = document.getElementById(a.dataset.target);
    if (el) {
        e.preventDefault();
        el.scrollIntoView();
    } else {
        try { sessionStorage.setItem("jump", a.dataset.target); } catch (err) {}
    }
});

// Call after the page's content exists. Also handles old links that still have "#..." in them.
function jumpToPending() {
    let id = null;
    try { id = sessionStorage.getItem("jump"); } catch (e) {}
    if (!id && location.hash) id = decodeURIComponent(location.hash.slice(1));
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    try { sessionStorage.removeItem("jump"); } catch (e) {}
    el.scrollIntoView();
}

/* ---------- Night sky: stars that twinkle on their own, and the odd shooting star ---------- */
(() => {
    const sky = document.querySelector(".stars");
    if (!sky) return;
    const count = Math.round(Math.min(70, Math.max(25, innerWidth / 22)));
    let stars = "";
    for (let i = 0; i < count; i++) {
        const big = Math.random() < 0.18;
        stars += `<i class="star${big ? " big" : ""}" style="left:${(Math.random() * 100).toFixed(2)}%;` +
            `top:${(Math.random() * 82).toFixed(2)}%;--dur:${(2 + Math.random() * 4).toFixed(2)}s;` +
            `--delay:-${(Math.random() * 6).toFixed(2)}s"></i>`;
    }
    sky.innerHTML = stars;
    // On the home page the sky is taller than the screen; shooting stars go in the part seen from the ground
    let zone = sky;
    if (document.querySelector(".home-scene")) {
        zone = document.createElement("div");
        zone.className = "shoot-zone";
        sky.appendChild(zone);
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function shootingStar() {
        // Only at night, and not while the tab is in the background
        if (root.dataset.theme === "dark" && !document.hidden) {
            const s = document.createElement("i");
            s.className = "shooting";
            const tilt = 15 + Math.random() * 25;               // degrees below horizontal
            const toRight = Math.random() < 0.5;
            const dist = 250 + Math.random() * 250;
            const dy = Math.round(dist * Math.tan(tilt * Math.PI / 180));
            s.style.cssText = `left:${(toRight ? 5 : 30) + Math.random() * 60}%;top:${Math.random() * 22}%;` +
                `--a:${toRight ? tilt : 180 - tilt}deg;--dx:${toRight ? dist : -dist}px;--dy:${dy}px`;
            s.addEventListener("animationend", () => s.remove());
            zone.appendChild(s);
        }
        setTimeout(shootingStar, 4000 + Math.random() * 8000);  // every 4-12 seconds
    }
    setTimeout(shootingStar, 1500 + Math.random() * 2500);
})();

/* ---------- Day sky: a bird (or a few) flies across now and then ---------- */
(() => {
    const hero = document.querySelector(".hero");
    if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const flock = document.createElement("div");
    flock.className = "birds";
    flock.setAttribute("aria-hidden", "true");
    // In front of the sun/moon, behind the clouds and the sign
    (hero.querySelector(".orb") || hero.querySelector(".stars") || hero.firstChild).after(flock);

    function birds() {
        // Only during the day, and not while the tab is in the background
        if (root.dataset.theme !== "dark" && !document.hidden) {
            const toLeft = Math.random() < 0.5;
            const top = 4 + Math.random() * 10;                     // % down the sky: the open sky above the sign
            const dur = 13 + Math.random() * 8;                     // seconds to cross
            const n = 1 + Math.floor(Math.random() * 3);            // 1-3 birds
            for (let i = 0; i < n; i++) {
                const b = document.createElement("i");
                b.className = "bird" + (toLeft ? " to-left" : "");
                b.style.cssText = `top:calc(${top}% + ${i % 2 ? -10 : i * 8}px);--dur:${(dur + i * 0.4).toFixed(1)}s;` +
                    `animation-delay:${(i * 0.5).toFixed(1)}s;--flap:-${(Math.random() * 0.36).toFixed(2)}s`;
                b.innerHTML = "<i></i>";
                b.addEventListener("animationend", e => { if (e.target === b) b.remove(); });
                flock.appendChild(b);
            }
        }
        setTimeout(birds, 8000 + Math.random() * 10000);         // every 8-18 seconds
    }
    setTimeout(birds, 2000 + Math.random() * 3000);
})();

/* ---------- Inventory hotbar: the site's navigation, at the bottom of every page ---------- */
(() => {
    const SLOTS = [
        { page: "home", label: "Home", icon: ICONS.house },
        { page: "experience", label: "Experience", icon: ICONS.briefcase },
        { page: "projects", label: "Projects", icon: ICONS.chestBig },
        { page: "arcade", label: "Arcade", icon: ICONS.joystick }
    ];
    const EMPTY = 4;  // empty slots, just for the inventory look (hidden on phones)
    const here = document.body.dataset.page;
    const bar = document.createElement("div");
    bar.className = "inventory";
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", "Site");
    bar.innerHTML = SLOTS.map((s, i) =>
        `<a class="slot" href="${PAGES[s.page]}" data-label="${s.label}" aria-label="${s.label}"` +
        `${s.page === here ? ' aria-current="page"' : ""}><span class="key" aria-hidden="true">${i + 1}</span>${s.icon}</a>`
    ).join("") + '<span class="slot empty" aria-hidden="true"></span>'.repeat(EMPTY);
    document.body.appendChild(bar);

    // Number keys 1-4 jump to a slot, like a game hotbar
    addEventListener("keydown", e => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.target.isContentEditable || /^(input|textarea|select)$/i.test(e.target.tagName)) return;
        const slot = SLOTS[Number(e.key) - 1];
        if (slot && slot.page !== here) location.href = PAGES[slot.page];
    });
})();

/* ---------- Home intro: start high in the sky, then slowly pan down to the ground ---------- */
(() => {
    const world = $("world");
    if (!world) return;
    let navType = "navigate", fromSite = false;
    try { navType = performance.getEntriesByType("navigation")[0].type; } catch (e) {}
    try { fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Plays on a fresh visit or a reload; skipped when moving between this site's pages
    if (reduce || navType === "back_forward" || (fromSite && navType !== "reload")) {
        world.classList.add("instant", "landed");
        return;
    }
    let done = false;
    world.addEventListener("transitionend", () => { done = true; });
    const land = () => world.classList.add("landed");
    const skip = () => {
        if (done) return;
        // Jump from wherever the camera is to the ground, quickly
        const now = getComputedStyle(world).transform;
        world.classList.add("instant");
        world.style.transform = now;
        void world.offsetHeight;
        world.classList.remove("instant");
        world.classList.add("fast", "landed");
        world.style.transform = "";
    };
    setTimeout(land, 700);  // a moment in the sky first
    // Any click, scroll, key or touch skips ahead
    ["pointerdown", "wheel", "keydown", "touchstart"].forEach(ev =>
        addEventListener(ev, skip, { once: true, passive: true }));
})();

/* ---------- Home: walk the avatar with the arrow keys or A / D ---------- */
// Hold Left/A or Right/D to walk; each step cycles walk 1 -> stand -> walk 2 -> stand.
// Let go and it stops and faces forward. It always stays inside the window.
(() => {
    const el = $("walker");
    if (!el) return;
    const img = el.querySelector("img");
    const FRAMES = {
        front: "images/avatar-full_body.png",
        left: ["images/walk-left-1.png", "images/stand-left_1.png", "images/walk-left-2.png", "images/stand-left_1.png"],
        right: ["images/walk-right-1.png", "images/stand-right_1.png", "images/walk-right-2.png", "images/stand-right_1.png"]
    };
    [FRAMES.front, ...FRAMES.left, ...FRAMES.right].forEach(src => { new Image().src = src; });  // preload: no flicker

    const SPEED = 160;     // pixels per second while a key is held
    const STEP_MS = 140;   // how long each frame of the walk cycle shows
    const show = src => { if (img.getAttribute("src") !== src) img.setAttribute("src", src); };
    const range = () => Math.max(0, el.parentElement.clientWidth - el.offsetWidth);  // keeps it in the window

    let x = range() * 0.72;  // start to the right of the sign
    const held = { left: false, right: false };
    const KEYS = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    addEventListener("keydown", e => {
        const dir = KEYS[e.code];
        if (!dir || e.ctrlKey || e.metaKey || e.altKey || /^(input|textarea|select)$/i.test(e.target.tagName)) return;
        held[dir] = true;
        e.preventDefault();  // arrow keys walk instead of scrolling the page
    });
    addEventListener("keyup", e => { const dir = KEYS[e.code]; if (dir) held[dir] = false; });
    addEventListener("blur", () => { held.left = held.right = false; });  // don't keep walking after switching windows

    // Hop while the mouse is over the avatar (it doesn't take clicks, so this checks the position)
    let mouse = null;
    addEventListener("pointermove", e => { mouse = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null; }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse = null; });
    const overAvatar = () => {
        if (!mouse) return false;
        const r = el.getBoundingClientRect();  // the figure fills roughly the middle of the image
        return mouse.x > r.left + r.width * .24 && mouse.x < r.right - r.width * .22 &&
               mouse.y > r.top + r.height * .12 && mouse.y < r.bottom - r.height * .06;
    };

    let walking = null, frame = 0, frameAt = 0, last = 0;
    function tick(t) {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        // Both keys held (or neither): stand still
        const dir = held.left === held.right ? null : (held.left ? "left" : "right");
        if (dir) {
            if (dir !== walking) { walking = dir; frame = 0; frameAt = t; }  // start a fresh step
            else if (t - frameAt >= STEP_MS) { frame = (frame + 1) % 4; frameAt = t; }
            x += (dir === "left" ? -1 : 1) * SPEED * dt;
            show(FRAMES[dir][frame]);
        } else {
            walking = null;
            show(FRAMES.front);
        }
        x = Math.min(range(), Math.max(0, x));
        el.style.transform = `translateX(${Math.round(x)}px)`;
        el.classList.toggle("hop", overAvatar());
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();
