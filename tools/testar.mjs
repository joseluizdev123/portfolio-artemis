// Testes de comportamento da página no Chrome headless (DevTools Protocol). Cada caso imprime OK/FALHOU.
//
//   node tools/testar.mjs [url-base]        (padrão: http://127.0.0.1:5600/index.html)
//
// Cobre: filtro (seleção múltipla, destaque some, cartão de chamada fecha a linha sem criar colunas, redimensionar
// depois de filtrar, abrir com #site+blog, "Voltar ao topo" mantém o filtro), menu ≤1000, header numa linha ≥1001,
// rodapé sem quebra em 1101, rolagem lateral de 320 a 1920 e erros de console/rede.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:5600/index.html';
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = mkdtempSync(join(tmpdir(), 'pf-testar-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=0', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
let falhas = 0;
const erros = [];

function ok(nome, cond, info) {
  console.log(`${cond ? 'OK     ' : 'FALHOU '} ${nome}${info !== undefined ? '  — ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`);
  if (!cond) falhas++;
}

try {
  let port, path;
  for (let i = 0; i < 200 && !port; i++) {
    const f = join(prof, 'DevToolsActivePort');
    try { if (existsSync(f)) [port, path] = readFileSync(f, 'utf8').split('\n').map((s) => s.trim()); } catch { /* escrevendo */ }
    if (!port) await sleep(50);
  }
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const pending = new Map(), waiters = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + m.params.exceptionDetails.exception?.description?.split('\n')[0]);
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) erros.push('console.' + m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) erros.push(m.params.response.status + ' ' + m.params.response.url);
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) erros.push('falhou: ' + m.params.errorText);
    for (const w of [...waiters]) if (w.method === m.method && w.sessionId === m.sessionId) { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const once = (method, sessionId) => new Promise((res) => waiters.push({ method, sessionId, res }));
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: S } = await send('Target.attachToTarget', { targetId, flatten: true });
  for (const d of ['Page', 'Runtime', 'Network']) await send(d + '.enable', {}, S);

  const size = (w, h = 900) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 }, S);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true }, S);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result.value;
  };
  let nav = 0;
  const abre = async (url, w, h) => {
    await size(w, h);
    // ?n=… força um carregamento novo (só trocar o #fragmento não dispara load)
    const [semHash, hash = ''] = url.split('#');
    url = semHash + (semHash.includes('?') ? '&' : '?') + 'n=' + (++nav) + (hash ? '#' + hash : '');
    const loaded = once('Page.loadEventFired', S);
    await send('Page.navigate', { url }, S);
    await loaded;
    await ev('await document.fonts.ready; await new Promise(r => setTimeout(r, 900));');
  };
  const estado = () => ev(`
    const g = document.getElementById('pf-grid'), cta = document.querySelector('.pf-cta-card');
    return {
      vw: innerWidth, docW: document.documentElement.scrollWidth,
      cols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
      cardsW: [...document.querySelectorAll('.pf-card')].filter(c => !c.hidden).map(c => Math.round(c.getBoundingClientRect().width)),
      cartoes: [...document.querySelectorAll('.pf-card')].filter(c => !c.hidden).length,
      span: cta.style.gridColumn, ctaW: Math.round(cta.getBoundingClientRect().width), ctaH: Math.round(cta.getBoundingClientRect().height),
      ctaTitulo: getComputedStyle(document.querySelector('.pf-cta-card__title')).fontSize,
      contagem: document.querySelector('[data-pf-contagem] p').textContent,
      destaque: !document.querySelector('.pf-feat').hidden,
      ativas: [...document.querySelectorAll('.pf-tab--on')].map(t => t.textContent).join('+'),
      hash: location.hash, y: Math.round(scrollY),
      topoGrade: Math.round(document.getElementById('projetos').getBoundingClientRect().top),
    };`);
  const clica = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).click(); await new Promise(r => setTimeout(r, 150));`);

  // 1. Seleção múltipla + destaque some fora do filtro
  await abre(BASE, 1440);
  let s = await estado();
  ok('início: 22 cartões, destaque visível, "23 projetos no portfólio"', s.cartoes === 22 && s.destaque && s.contagem === '23 projetos no portfólio', s.contagem);
  ok('início: cartão de chamada fecha a linha (22 % 3 = 1 → span 2)', s.span === 'span 2' && s.cols === 3, s.span);
  await clica('[data-filtro="blog"]');
  s = await estado();
  ok('Blog: 4 cartões, destaque (site) some, página não rola', s.cartoes === 4 && !s.destaque && s.y === 0, s);
  await clica('[data-filtro="onepage"]');
  s = await estado();
  ok('Blog + Onepage: 7 cartões, "7 projetos em Onepage e Blog", #onepage+blog', s.cartoes === 7 && s.contagem === '7 projetos em Onepage e Blog' && s.hash === '#onepage+blog', s.contagem + ' ' + s.hash);
  ok('Blog + Onepage: chamada fecha a linha (7 % 3 = 1 → span 2), grade com 3 colunas', s.span === 'span 2' && s.cols === 3);
  await clica('[data-filtro="blog"]');
  s = await estado();
  ok('desmarcar Blog: só Onepage (3 cartões)', s.ativas === 'Onepage' && s.cartoes === 3, s.ativas);
  await clica('[data-filtro="site"]');
  s = await estado();
  ok('Onepage + Site: destaque volta, 21 cartões', s.destaque && s.ativas === 'Site+Onepage' && s.cartoes === 21, s.ativas);
  await clica('[data-filtro="blog"]');
  s = await estado();
  ok('as três categorias marcadas: 21 cartões (o oithe, sem categoria, só aparece em Todos)', s.ativas === 'Site+Onepage+Blog' && s.cartoes === 21, s.ativas + ' · ' + s.cartoes);
  await clica('[data-filtro="todos"]');
  s = await estado();
  ok('Todos: volta aos 22 cartões e limpa o endereço', s.ativas === 'Todos' && s.cartoes === 22 && s.hash === '', s.ativas);
  const abas = await ev(`return [...document.querySelectorAll('[data-filtro]')].map(t => t.textContent.trim()).join(',');`);
  ok('abas: Todos, Site, Onepage, Blog (sem Plataforma)', abas === 'Todos,Site,Onepage,Blog', abas);

  // 2. Redimensionar depois de filtrar não cria colunas implícitas (achado INT-1)
  await clica('[data-filtro="site"]');
  s = await estado();
  ok('Site em 1440: 18 cartões, 18 % 3 = 0 → chamada ocupa a linha (span 3)', s.cartoes === 18 && s.span === 'span 3', s.span);
  for (const w of [1000, 767, 390, 320]) {
    await size(w); await sleep(300);
    s = await estado();
    const esperado = w > 1100 ? 3 : w > 767 ? 2 : 1;
    ok(`Site, reduzido para ${w}: ${esperado} coluna(s) explícitas, sem rolagem lateral, cartões de largura igual`,
      s.cols === esperado && s.docW <= s.vw && new Set(s.cardsW).size === 1, { cols: s.cols, docW: s.docW, larguras: [...new Set(s.cardsW)] });
  }
  await abre(BASE, 844, 390);
  await size(390, 844); await sleep(300);
  s = await estado();
  ok('girar o celular (844×390 → 390×844): 1 coluna, sem rolagem lateral', s.cols === 1 && s.docW <= s.vw, { cols: s.cols, docW: s.docW });

  // 3. Chamada em 1 coluna usa o arranjo compacto (achado V1)
  await abre(BASE + '#onepage', 768);
  s = await estado();
  ok('768 #onepage (3 cartões, 2 colunas): chamada em 1 coluna com título 28px e altura < 700', s.span === 'span 1' && s.ctaTitulo === '28px' && s.ctaH < 700, { span: s.span, titulo: s.ctaTitulo, h: s.ctaH });
  await abre(BASE + '#plataforma', 1440);
  s = await estado();
  ok('#plataforma (aba removida) no endereço: abre em Todos', s.ativas === 'Todos' && s.cartoes === 22, s.ativas);

  // 4. Abrir filtrado rola até a grade, depois das fontes (achado INT-4)
  await abre(BASE + '#site+blog', 1440);
  s = await estado();
  ok('abrir com #site+blog: Site e Blog marcados, grade no topo da tela (±2 px)', s.ativas === 'Site+Blog' && Math.abs(s.topoGrade) <= 2, { ativas: s.ativas, topo: s.topoGrade });

  // 5. "Voltar ao topo" e links "#" não desfazem o filtro (achado INT-2)
  await abre(BASE + '#blog', 1440);
  await clica('.pf-ftr__mid > a');
  await sleep(1200);
  s = await estado();
  ok('#blog + "Voltar ao topo": filtro continua (4 projetos em Blog)', s.contagem === '4 projetos em Blog' && s.cartoes === 4, s.contagem);
  await clica('.pf-ico[aria-label="Instagram"]');
  await sleep(300);
  s = await estado();
  ok('#blog + ícone com href="#": filtro continua', s.cartoes === 4, s.contagem);
  await ev('history.back(); await new Promise(r => setTimeout(r, 600));');

  // 6. Header: "Menu" até 1000, nav numa linha a partir de 1001 (achado V2)
  for (const w of [950, 1000, 1001, 1100]) {
    await abre(BASE, w);
    const h = await ev(`const n = document.querySelector('.pf-nav'), b = document.querySelector('.pf-menu-btn');
      return { nav: getComputedStyle(n).display, navH: Math.round(n.getBoundingClientRect().height), botao: getComputedStyle(b).display };`);
    ok(`header em ${w}: ${w <= 1000 ? 'botão Menu, nav escondida' : 'nav numa linha só (24 px)'}`,
      w <= 1000 ? h.nav === 'none' && h.botao !== 'none' : h.nav !== 'none' && h.navH === 24 && h.botao === 'none', h);
  }
  await abre(BASE, 950);
  await clica('[data-pf-menu-btn]');
  let m = await ev(`return { aberto: !document.getElementById('pf-menu').hidden, exp: document.querySelector('[data-pf-menu-btn]').getAttribute('aria-expanded') };`);
  ok('menu em 950 abre (aria-expanded=true)', m.aberto && m.exp === 'true', m);
  await size(1200); await sleep(300);
  m = await ev(`return { aberto: !document.getElementById('pf-menu').hidden };`);
  ok('menu fecha ao passar de 1000', !m.aberto, m);

  // 7. Rodapé em 1101: "Estudos de impacto" numa linha (achado V4)
  await abre(BASE, 1101);
  const f = await ev(`const a = [...document.querySelectorAll('.pf-ftr__links a')].find(x => x.textContent.includes('Estudos'));
    return { h: Math.round(a.getBoundingClientRect().height), docW: document.documentElement.scrollWidth, vw: innerWidth };`);
  ok('rodapé em 1101: "Estudos de impacto" numa linha, sem rolagem lateral', f.h <= 24 && f.docW <= f.vw, f);

  // 8. Sem rolagem lateral de 320 a 1920
  const larg = [320, 360, 375, 390, 414, 600, 767, 768, 900, 1000, 1001, 1024, 1100, 1101, 1170, 1280, 1366, 1440, 1600, 1920];
  const vaza = [];
  for (const w of larg) {
    await abre(BASE, w);
    const d = await ev('return { docW: document.documentElement.scrollWidth, vw: innerWidth };');
    if (d.docW > d.vw) vaza.push(`${w}: ${d.docW}`);
  }
  ok(`sem rolagem lateral em ${larg.length} larguras (320–1920)`, !vaza.length, vaza.join(', ') || undefined);

  ok('console e rede sem erros (exceções, console.error/warn, 4xx/5xx)', !erros.length, erros.slice(0, 5).join(' | ') || undefined);
  ws.close();
} catch (e) {
  console.error(e.message || e);
  falhas++;
} finally {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    else chrome.kill('SIGKILL');
  } catch { /* já saiu */ }
  for (let i = 0; i < 10; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { await sleep(100); } }
  console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo OK');
  process.exitCode = falhas ? 1 : 0;
}
