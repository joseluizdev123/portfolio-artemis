// Teste de edição de ponta a ponta no WordPress local (tools/wordpress.mjs): entra no painel como admin, edita
// cada tipo de conteúdo pela interface, confere na página e DESFAZ tudo no fim (o conteúdo volta ao do seeder).
//
//   node tools/testar_edicao_wp.mjs [url-base]      (padrão: http://127.0.0.1:9400 · login admin/admin)
//
// Cobre: textos da página (caixas da página Portfólio), projeto (domínio), destaque (troca de projeto),
// categoria (nome e plural da aba), Personalizar (selo do header e linha de direitos) e Menus (rótulo de um item).
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] || 'http://127.0.0.1:9400').replace(/\/$/, '');
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = mkdtempSync(join(tmpdir(), 'pf-edicao-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0',
  '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
let falhas = 0;
function ok(nome, cond, info) {
  console.log(`${cond ? 'OK     ' : 'FALHOU '} ${nome}${info !== undefined ? '  — ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`);
  if (!cond) falhas++;
}

let ws, S, seq = 0;
const pending = new Map(), waiters = [];
const send = (method, params = {}, sessionId = S) => new Promise((res, rej) => {
  const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const once = (method) => new Promise((res) => waiters.push({ method, res }));
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
}
async function abre(path) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: path.startsWith('http') ? path : BASE + path });
  await loaded;
  await sleep(300);
}
// envia um formulário e espera a página seguinte carregar
async function envia(seletorBotao) {
  const loaded = once('Page.loadEventFired');
  await ev(`document.querySelector(${JSON.stringify(seletorBotao)}).click();`);
  await loaded;
  await sleep(300);
}
// preenche campos de formulário: {seletor: valor}; boolean = checkbox
const preenche = (campos) => ev(`
  const c = ${JSON.stringify(campos)}; const faltou = [];
  for (const [sel, v] of Object.entries(c)) {
    const el = document.querySelector(sel);
    if (!el) { faltou.push(sel); continue; }
    if (typeof v === 'boolean') el.checked = v; else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return faltou;`);
// página pública: textos que o teste confere
const pagina = async () => {
  await abre('/?t=' + Date.now());
  return ev(`
    const t = (s) => (document.querySelector(s) || {}).textContent?.trim() ?? null;
    return {
      heroTitulo: document.querySelector('.pf-hero__title')?.innerHTML.trim(),
      dica: t('[data-pf-contagem] p:nth-child(2)'), nota: t('.pf-list__note'), stat3: t('.pf-stat:nth-child(3) dd'),
      contagem: t('[data-pf-contagem] p'), rotulo: t('[data-pf-rotulo]'),
      ctaTitulo: t('.pf-cta__title'), selo: t('.pf-hdr .pf-tag'), copyright: t('.pf-ftr__legal p'),
      nav: [...document.querySelectorAll('.pf-nav > a:not(.pf-nav__cta)')].map(a => a.textContent.trim()),
      abas: [...document.querySelectorAll('[data-filtro]')].map(a => a.textContent.trim() + (a.dataset.plural ? '/' + a.dataset.plural : '')),
      destaque: t('.pf-feat__title'),
      cards: [...document.querySelectorAll('.pf-card')].map(c => c.querySelector('.pf-card__name').textContent + ' · ' + c.querySelector('.pf-shot__url').textContent),
      pageId: (document.body.className.match(/page-id-(\\d+)/) || [])[1],
    };`);
};
// link de edição de um item numa listagem do painel, pelo texto do título
const linkEdicao = (seletor, texto) => ev(`
  const a = [...document.querySelectorAll(${JSON.stringify(seletor)})].find(x => x.textContent.trim() === ${JSON.stringify(texto)});
  return a ? a.href : null;`);

try {
  let port, path;
  for (let i = 0; i < 200 && !port; i++) {
    const f = join(prof, 'DevToolsActivePort');
    try { if (existsSync(f)) [port, path] = readFileSync(f, 'utf8').split('\n').map((s) => s.trim()); } catch { /* escrevendo */ }
    if (!port) await sleep(50);
  }
  ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
    for (const w of [...waiters]) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }
  };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, undefined);
  ({ sessionId: S } = await send('Target.attachToTarget', { targetId, flatten: true }, undefined));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  const antes = await pagina();
  ok('página pública carrega (seeder)', antes.cards.length === 22 && antes.destaque === 'Expo Usipa', { cards: antes.cards.length, destaque: antes.destaque });

  // login
  await abre('/wp-login.php');
  await preenche({ '#user_login': 'admin', '#user_pass': 'admin' });
  await envia('#wp-submit');
  ok('login no painel', await ev('return location.pathname.includes("/wp-admin")'));

  /* 1. Textos da página — caixas na tela de edição da página Portfólio */
  const editarPagina = `/wp-admin/post.php?post=${antes.pageId}&action=edit`;
  await abre(editarPagina);
  const tela = await ev(`return { caixas: [...document.querySelectorAll('.postbox h2')].map(h => h.textContent.trim()).filter(t => t.startsWith('Portfólio')),
    editor: !!document.querySelector('#postdivrich, .block-editor') };`);
  ok('página Portfólio no painel: 7 caixas de seção, sem o editor de texto', tela.caixas.length === 7 && !tela.editor, tela);
  const campos = {
    '[name="pf_hero_titulo"]': 'Projetos que o Studio Artemis {colocou no ar}',
    '[name="pf_filtro_dica"]': 'Escolha as categorias',
    '[name="pf_lista_nota"]': 'Nota editada pelo teste.',
    '[name="pf_stat3_valor"]': '2 dias',
    '[name="pf_cta_titulo"]': 'Fale com a gente',
    '[name="pf_lista_eyebrow"]': 'Cases publicados',
    '[name="pf_filtro_projetos"]': 'cases',
  };
  ok('campos da página encontrados', !(await preenche(campos)).length);
  await envia('#publish');
  let p = await pagina();
  ok('hero: título editado, {trecho} em cinza', p.heroTitulo === 'Projetos que o Studio Artemis <em>colocou no ar</em>', p.heroTitulo);
  ok('filtro, grade, número e chamada final editados', p.dica === 'Escolha as categorias' && p.nota === 'Nota editada pelo teste.' && p.stat3 === '2 dias útil' && p.ctaTitulo === 'Fale com a gente', p);
  ok('rótulo da grade editado continua depois que o JS carrega', p.rotulo === 'Cases publicados', p.rotulo);
  ok('palavra do filtro editada na contagem', p.contagem === '23 cases no portfólio', p.contagem);

  /* 2. Projeto: domínio do ARV; 3. destaque: Zeros à Direita no lugar da Expo Usipa */
  await abre('/wp-admin/edit.php?post_type=art_projeto');
  const links = {
    arv: await linkEdicao('a.row-title', 'ARV Incorporação & Tecnologia'),
    zeros: await linkEdicao('a.row-title', 'Zeros à Direita'),
    expo: await linkEdicao('a.row-title', 'Expo Usipa'),
  };
  ok('projetos na listagem do painel', links.arv && links.zeros && links.expo, links);
  await abre(links.arv);
  await preenche({ '[name="pf_dominio"]': 'arv-editado.com.br' });
  await envia('#publish');
  await abre(links.zeros);
  await preenche({ '#artemis_pf_destaque': true, '[name="pf_formato"]': 'Onepage', '[name="pf_descricao"]': 'Destaque trocado pelo teste.' });
  await envia('#publish');
  await abre(links.expo);
  await preenche({ '#artemis_pf_destaque': false });
  await envia('#publish');
  p = await pagina();
  ok('projeto: domínio editado aparece no cartão', p.cards.some((c) => c === 'ARV Incorporação & Tecnologia · arv-editado.com.br'), p.cards[0]);
  ok('destaque trocado: Zeros à Direita no bloco grande, Expo Usipa na grade', p.destaque === 'Zeros à Direita' && p.cards.some((c) => c.startsWith('Expo Usipa')) && p.cards.length === 22, { destaque: p.destaque, cards: p.cards.length });

  /* 4. Categoria: Onepage → Landing (plural Landings) */
  await abre('/wp-admin/edit-tags.php?taxonomy=art_projeto_cat&post_type=art_projeto');
  const linkCat = await linkEdicao('a.row-title', 'Onepage');
  await abre(linkCat);
  await preenche({ '#name': 'Landing', '#pf_plural': 'Landings' });
  await envia('#edittag input[type="submit"]');
  p = await pagina();
  ok('categoria renomeada: aba "Landing", plural "Landings"', p.abas.includes('Landing/Landings'), p.abas);

  /* 5. Personalizar: selo do header e linha de direitos */
  await abre('/wp-admin/customize.php');
  for (let i = 0; i < 60 && !(await ev('return !!(window.wp && wp.customize && wp.customize.state && wp.customize.state("processing") !== undefined && wp.customize("art_pf_selo"))')); i++) await sleep(500);
  await ev(`wp.customize('art_pf_selo').set('Cases'); wp.customize('art_pf_rod_copyright').set('© 2026 Teste de edição.');
    await new Promise((r, j) => wp.customize.previewer.save().done(r).fail(j));`);
  p = await pagina();
  ok('Personalizar: selo do header e rodapé editados', p.selo === 'Cases' && p.copyright === '© 2026 Teste de edição.', { selo: p.selo, copyright: p.copyright });

  /* 6. Menus: "Blog" → "Blog do Studio" no menu principal */
  await abre('/wp-admin/nav-menus.php');
  const menuUrl = await ev(`const o = [...document.querySelectorAll('#select-menu-to-edit option')].find(x => x.textContent.includes('principal'));
    return o ? location.pathname + '?action=edit&menu=' + o.value : null;`);
  if (menuUrl) await abre(menuUrl);
  const achou = await ev(`const i = [...document.querySelectorAll('.edit-menu-item-title')].find(x => x.value === 'Blog');
    if (!i) return false; i.value = 'Blog do Studio'; i.dispatchEvent(new Event('change', { bubbles: true })); return true;`);
  ok('item "Blog" no menu principal', achou);
  await envia('#save_menu_footer, #save_menu_header');
  p = await pagina();
  ok('Menus: rótulo editado no header', p.nav.includes('Blog do Studio'), p.nav);

  /* Desfaz tudo */
  await abre(editarPagina);
  await preenche(Object.fromEntries(Object.keys(campos).map((k) => [k, ''])));
  await envia('#publish');
  await abre(links.arv);
  await preenche({ '[name="pf_dominio"]': 'arvinc.com.br' });
  await envia('#publish');
  await abre(links.expo);
  await preenche({ '#artemis_pf_destaque': true });
  await envia('#publish');
  await abre(links.zeros);
  await preenche({ '#artemis_pf_destaque': false, '[name="pf_formato"]': '', '[name="pf_descricao"]': '' });
  await envia('#publish');
  await abre(linkCat);
  await preenche({ '#name': 'Onepage', '#pf_plural': 'Onepages' });
  await envia('#edittag input[type="submit"]');
  await abre('/wp-admin/customize.php');
  for (let i = 0; i < 60 && !(await ev('return !!(window.wp && wp.customize && wp.customize("art_pf_selo"))')); i++) await sleep(500);
  await ev(`wp.customize('art_pf_selo').set('Portfólio'); wp.customize('art_pf_rod_copyright').set('© 2026 Studio Artemis. Todos os direitos reservados.');
    await new Promise((r, j) => wp.customize.previewer.save().done(r).fail(j));`);
  if (menuUrl) await abre(menuUrl);
  await ev(`const i = [...document.querySelectorAll('.edit-menu-item-title')].find(x => x.value === 'Blog do Studio');
    if (i) { i.value = 'Blog'; i.dispatchEvent(new Event('change', { bubbles: true })); }`);
  await envia('#save_menu_footer, #save_menu_header');
  await abre('/wp-login.php?action=logout');
  await ev(`const a = document.querySelector('a[href*="action=logout"]'); if (a) a.click();`);
  await sleep(2000);
  const depois = await pagina();
  const igual = JSON.stringify({ ...depois, pageId: 0 }) === JSON.stringify({ ...antes, pageId: 0 });
  ok('tudo desfeito: a página voltou a ser a do seeder', igual, igual ? undefined : { antes, depois });
  ws.close();
} catch (e) {
  console.error(e.stack || e.message || e);
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
