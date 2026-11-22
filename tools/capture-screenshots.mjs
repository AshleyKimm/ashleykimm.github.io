// Captures screenshots and an animated GIF tour of the site for the README.
//
// Usage (from the repo folder, with the site served locally or live):
//   node tools/capture-screenshots.mjs <site URL> <output folder>
//   e.g. node tools/capture-screenshots.mjs https://ashleykimm.github.io/ screenshots/2026-11-22
//
// Needs Microsoft Edge (or set EDGE to a Chrome/Edge path) and Python with Pillow (to build the GIF).
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "https://ashleykimm.github.io/").replace(/\/?$/, "/");
const OUT = resolve(process.argv[3] || "screenshots/latest");
const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9360;
mkdirSync(OUT, { recursive: true });
const frameDir = join(tmpdir(), "site-gif-frames-" + Date.now());
mkdirSync(frameDir, { recursive: true });

const browser = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(frameDir, "profile")}`,
    "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60 && !targets?.length; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { } await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => Promise.race([
    new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
    sleep(8000).then(() => ({}))]);
const ev = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
const png = async (clip) => { const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); return r.result ? Buffer.from(r.result.data, "base64") : null; };
const save = async (name, clip) => { const b = await png(clip); if (b) { writeFileSync(join(OUT, name), b); console.log("saved", name); } };
const size = (w, h, mobile = false) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
const go = async (path, wait) => { await send("Page.navigate", { url: BASE + path }); await sleep(wait); };
const key = (type, code, k, vk) => send("Input.dispatchKeyEvent", { type, code, key: k, windowsVirtualKeyCode: vk });
const center = sel => ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await send("Page.enable");

// ---------- Still screenshots ----------
await size(1280, 800);
await go("", 800);
await ev(`localStorage.setItem("theme", "light")`);
await go("", 11000);                                   // sky intro + walk-in + greeting
await save("home-day.png");
await ev(`localStorage.setItem("theme", "dark")`);
await go("", 11000);
await save("home-night.png");
await ev(`localStorage.setItem("theme", "light")`);
await go("experience", 2500); await save("experience.png");
await go("projects", 4000); await save("projects.png");
await go("arcade", 6000); await save("arcade.png");
await size(390, 844, true);
await go("", 11000); await save("phone-home.png");

// ---------- GIF tour: intro, greeting, walking, then down into Projects ----------
await size(960, 600);
await go("", 600);
await ev(`sessionStorage.clear()`);
await send("Page.navigate", { url: BASE });
const frames = [];
const grab = async (ms) => {                          // capture frames for `ms` milliseconds
    const end = Date.now() + ms;
    while (Date.now() < end) { const t = Date.now(); const b = await png(); if (b) frames.push({ t, b }); }
};
await grab(10500);                                     // sky pans down, Ashley walks in and says hi
await key("rawKeyDown", "ArrowRight", "ArrowRight", 39);
await grab(1400);                                      // walks right
await key("keyUp", "ArrowRight", "ArrowRight", 39);
await grab(500);
const slot = await center('.slot[data-nav="projects"]');
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: slot.x, y: slot.y });
await grab(500);                                       // hover shows the "Projects" label
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: slot.x, y: slot.y, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: slot.x, y: slot.y, button: "left", clickCount: 1 });
await grab(2600);                                      // the ground rises into Projects
frames.forEach((f, i) => writeFileSync(join(frameDir, `f${String(i).padStart(4, "0")}.png`), f.b));
const durations = frames.map((f, i) => (frames[i + 1]?.t ?? f.t + 1200) - f.t);
writeFileSync(join(frameDir, "durations.json"), JSON.stringify(durations));
ws.close(); browser.kill();

// Build the GIF with Pillow: scaled to 640px wide, nearest-neighbour so the pixel art stays crisp
const py = `
import json, os, sys
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
durs = json.load(open(os.path.join(d, "durations.json")))
files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
frames = []
for f in files:
    im = Image.open(os.path.join(d, f)).convert("RGB")
    im = im.resize((640, round(im.height * 640 / im.width)), Image.NEAREST)
    frames.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
frames[0].save(out, save_all=True, append_images=frames[1:], duration=[max(40, int(x)) for x in durs], loop=0, optimize=True)
print("saved tour.gif:", len(frames), "frames,", os.path.getsize(out) // 1024, "KB")
`;
const r = spawnSync("python", ["-I", "-c", py, frameDir, join(OUT, "tour.gif")], { encoding: "utf8" });
console.log(r.stdout || r.stderr);
rmSync(frameDir, { recursive: true, force: true });
process.exit(0);
