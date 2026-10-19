// Mede páginas no Chrome headless (DevTools Protocol), com o viewport emulado na largura exata.
//
//   node tools/medir.mjs <saida-dir> <largura> <nome=url> [<nome=url> …]
//
// Para cada url grava em <saida-dir>:
//   <nome>-<largura>.json  → todos os elementos dentro de .pf, em ordem de documento: caixa (x, y, w, h relativos
//                            a .pf) + estilos computados + texto das folhas. Classes com o prefixo "pf-" removido,
//                            para comparar a página montada (pf-hero__title) com o design (hero__title).
//                            Elementos com [data-extra] (acréscimos que o design não tem) ficam de fora.
//   <nome>-<largura>.png   → captura da página inteira
// Movimento reduzido ligado (prefers-reduced-motion): animações paradas → medidas estáveis.
// Requisitos: Node 22+ (WebSocket nativo), Chrome ou Edge instalado, servidor servindo as páginas.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [outDir, widthArg, ...targets] = process.argv.slice(2);
const width = Number(widthArg);
if (!outDir || !width || !targets.length) {
  console.error('uso: node tools/medir.mjs <saida-dir> <largura> <nome=url> […]');
  process.exit(2);
}
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
if (!CHROME) { console.error('Chrome/Edge não encontrado'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = mkdtempSync(join(tmpdir(), 'pf-medir-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--force-color-profile=srgb', '--font-render-hinting=none',
  '--remote-debugging-port=0', '--user-data-dir=' + prof, 'about:blank',
], { stdio: 'ignore' });

function cleanup() {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    else chrome.kill('SIGKILL');
  } catch { /* já saiu */ }
  for (let i = 0; i < 10; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { /* EBUSY */ } }
}

// Roda dentro da página: espera fontes e imagens e devolve a árvore medida
const COLLECT = `(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })));
  // decoding="async" fora da tela: sem decode() a captura sai sem a imagem
  await Promise.all([...document.images].map((i) => { i.decoding = 'sync'; return i.decode ? i.decode().catch(() => {}) : 0; }));
  await new Promise((r) => setTimeout(r, 400));
  const root = document.querySelector('.pf');
  const rb = root.getBoundingClientRect();
  const props = ['display', 'fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform',
    'textAlign', 'whiteSpace', 'color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'paddingTop', 'paddingRight',
    'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'rowGap', 'columnGap',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderBottomColor',
    'borderRadius', 'boxShadow', 'opacity', 'objectFit', 'objectPosition', 'transform', 'overflow', 'gridTemplateColumns'];
  const out = [];
  const walk = (el, sec) => {
    if (el.hasAttribute('data-extra')) return;
    const cls = (el.getAttribute('class') || '').split(/\\s+/).filter(Boolean).map((c) => c.replace(/^pf-/, '')).join('.');
    const tag = el.tagName.toLowerCase();
    if (['header', 'section', 'footer'].includes(tag) && el.parentElement && el.closest('.pf')) sec = cls.split('.')[0] || tag;
    const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const rec = { sec, tag, cls, x: +(b.left - rb.left).toFixed(2), y: +(b.top - rb.top).toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) };
    for (const p of props) rec[p] = cs[p];
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== 'none' && ps.content !== 'normal') rec[pseudo] = [ps.content, ps.position, ps.left, ps.right, ps.top, ps.bottom, ps.height, ps.width, ps.backgroundColor, ps.backgroundImage, ps.opacity].join(' | ');
    }
    if (!el.children.length) rec.text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
    if (tag === 'img') rec.src = (el.getAttribute('src') || '').replace(/^(\\.\\.\\/)+/, '');
    if (tag === 'a') rec.href = el.getAttribute('href');
    out.push(rec);
    for (const ch of el.children) walk(ch, sec);
  };
  walk(root, 'pf');
  return JSON.stringify({
    url: location.href, vw: innerWidth, docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    rootH: +rb.height.toFixed(2), fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight + ' ' + f.style),
    broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')), nodes: out,
  });
})()`;

try {
  let port, path;
  for (let i = 0; i < 200 && !port; i++) {
    const f = join(prof, 'DevToolsActivePort');
    try { if (existsSync(f)) [port, path] = readFileSync(f, 'utf8').split('\n').map((s) => s.trim()); } catch { /* ainda escrevendo */ }
    if (!port) await sleep(50);
  }
  if (!port) throw new Error('Chrome não abriu a porta de depuração');
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const pending = new Map(), waiters = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) for (const w of [...waiters]) if (w.method === m.method && w.sessionId === m.sessionId) { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const once = (method, sessionId) => new Promise((res) => waiters.push({ method, sessionId, res }));

  for (const t of targets) {
    const [name, url] = [t.slice(0, t.indexOf('=')), t.slice(t.indexOf('=') + 1)];
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 }, sessionId);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    const loaded = once('Page.loadEventFired', sessionId);
    await send('Page.navigate', { url }, sessionId);
    await loaded;
    const r = await send('Runtime.evaluate', { expression: COLLECT, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(name + ': ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
    const data = JSON.parse(r.result.value);
    writeFileSync(join(outDir, `${name}-${width}.json`), JSON.stringify(data, null, 1));
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: data.docH, scale: 1 } }, sessionId);
    writeFileSync(join(outDir, `${name}-${width}.png`), Buffer.from(shot.data, 'base64'));
    console.log(`${name} @${width}: ${data.nodes.length} elementos · doc ${data.docW}×${data.docH} · imagens quebradas: ${data.broken.length}`);
    await send('Target.closeTarget', { targetId });
  }
  ws.close();
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  cleanup();
}
