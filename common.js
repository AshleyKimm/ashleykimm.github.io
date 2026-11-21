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

async function loadGitHub() {
    const [user, repos, pinned] = await Promise.all([
        getJSON(`https://api.github.com/users/${GH_USER}`),
        getJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`),
        getJSON(PINNED_URL).catch(() => []) // no pins is fine; just skip them
    ]);
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
// GitHub Pages serves arcade.html at /arcade. Files opened straight from disk need the .html names.
const LOCAL = location.protocol === "file:";
const PAGES = { home: LOCAL ? "index.html" : "./", arcade: LOCAL ? "arcade.html" : "arcade" };
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
