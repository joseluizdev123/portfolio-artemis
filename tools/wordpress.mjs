// WordPress local para testar o tema wordpress/artemis-portfolio (WordPress Playground: PHP em WebAssembly + SQLite,
// sem Docker, sem MySQL, sem Apache).
//
//   node tools/wordpress.mjs            sobe http://127.0.0.1:9400 (Ctrl+C para parar)
//   node tools/wordpress.mjs --reset    apaga o WordPress local (conteúdo, mídia, banco) e instala do zero
//   node tools/wordpress.mjs --popular  roda de novo o seeder (artemis_pf_seed( true )) ao subir
//   node tools/wordpress.mjs --port=9500
//
// - O tema é montado ao vivo em /wordpress/wp-content/themes/artemis-portfolio: editar um arquivo e recarregar a
//   página basta, sem reiniciar.
// - Tudo o que o WordPress grava (arquivos do core, banco SQLite em wp-content/database/.ht.sqlite, uploads,
//   traduções) fica em wordpress/.playground/wordpress, então o que se edita no painel sobrevive ao reinício.
// - Na primeira instalação roda wordpress/blueprint.json: título, pt_BR, admin/admin, ativa o tema e chama o seeder.
//   Enquanto o seeder não tiver rodado com sucesso (tema incompleto, função ausente, erro), os passos de tema e
//   seeder rodam de novo a cada início. Depois disso, nunca mais: o conteúdo editado no painel não é sobrescrito.
// - Sem --login: o Playground com --login entra como admin em todo navegador novo, e o Chrome headless de
//   tools/medir.mjs precisa ver a página deslogada (sem barra do admin). Para entrar: /wp-login.php, admin/admin.
// - WordPress fixo (sem atualização automática). Antes de subir, o banco volta para journal_mode=DELETE se tiver
//   ficado em WAL (senão o Playground não conecta). Se a subida falhar, o fim do wp-content/debug.log é mostrado.
// - Parar: Ctrl+C. De outro terminal/script: taskkill /PID <pid deste node> /T /F (a árvore toda: npx → CLI → worker).
//
// Requisitos: Node 22.13+ (node:sqlite) e rede na primeira execução (baixa o WordPress e a tradução pt_BR; o CLI
// fica no cache do npx e o zip do WordPress em ~/.wordpress-playground).
import { spawn, spawnSync } from 'node:child_process';
import {
  closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = '@wp-playground/cli@3.1.59';
const WP = '7.1.3';
const PHP = '8.2';
const HOST = '127.0.0.1';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMA = join(RAIZ, 'wordpress', 'artemis-portfolio');
const BLUEPRINT = join(RAIZ, 'wordpress', 'blueprint.json');
const ESTADO = join(RAIZ, 'wordpress', '.playground');
const SITE = join(ESTADO, 'wordpress');
const MARCA = join(ESTADO, 'provisionado.json');
const PENDENTE = join(ESTADO, 'blueprint-pendente.json');
const STATUS = join(SITE, 'wp-content', 'artemis-provisionamento.json');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0].replace(/^\/\/ ?/gm, ''));
  process.exit(0);
}
const desconhecidos = args.filter((a) => !/^--(reset|popular|seed|port=\d+)$/.test(a));
if (desconhecidos.length) {
  console.error(`opção desconhecida: ${desconhecidos.join(' ')}  (use --help)`);
  process.exit(2);
}
const RESET = args.includes('--reset');
const POPULAR = args.includes('--popular') || args.includes('--seed');
const PORTA = Number((args.find((a) => a.startsWith('--port=')) || '--port=9400').slice(7));
const URL_SITE = `http://${HOST}:${PORTA}`;

const lerJson = (arq) => {
  try { return JSON.parse(readFileSync(arq, 'utf8')); } catch { return null; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inicio = Date.now();
const segundos = () => `${((Date.now() - inicio) / 1000).toFixed(1)} s`;

// ---------------------------------------------------------------------------------------------------------------
// 1. Estado: --reset, instalação nova ou reaproveitada

if (!existsSync(TEMA)) {
  console.error(`tema não encontrado: ${TEMA}`);
  process.exit(1);
}
if (!existsSync(join(TEMA, 'style.css'))) {
  console.warn('aviso: o tema ainda não tem style.css — o WordPress sobe com o tema padrão e o seeder fica pendente.');
}
// Antes do --reset: nunca apagar os arquivos de um WordPress que ainda está rodando.
const portaOcupada = await new Promise((ok) => {
  const s = net.connect({ host: HOST, port: PORTA });
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('error', () => ok(false));
});
if (portaOcupada) {
  console.error(`a porta ${PORTA} já está em uso (outro WordPress local rodando?). Pare o outro ou use --port=N.`);
  process.exit(1);
}
if (RESET && existsSync(ESTADO)) {
  console.log(`--reset: apagando ${ESTADO}`);
  rmSync(ESTADO, { recursive: true, force: true });
}

let marca = lerJson(MARCA);
let modo;
let blueprint = null;
if (!marca) {
  // Primeira instalação (ou uma anterior que não terminou): começa do zero.
  if (existsSync(SITE) && readdirSync(SITE).length) {
    console.log('instalação anterior incompleta: começando do zero.');
    rmSync(SITE, { recursive: true, force: true });
  }
  mkdirSync(SITE, { recursive: true });
  modo = 'download-and-install';
  blueprint = BLUEPRINT;
} else {
  modo = 'install-from-existing-files-if-needed';
  if (POPULAR || marca.seed !== 'ok') {
    // Só os passos de tema e seeder do blueprint (os marcados "artemis:tema" e "artemis:seed").
    const bp = JSON.parse(readFileSync(BLUEPRINT, 'utf8'));
    bp.steps = bp.steps.filter((s) => typeof s.code === 'string' && /artemis:(tema|seed)/.test(s.code));
    writeFileSync(PENDENTE, JSON.stringify(bp, null, '\t'));
    blueprint = PENDENTE;
  }
}
if (blueprint) rmSync(STATUS, { force: true });

// O Playground abre o SQLite com journal_mode=DELETE (WAL não funciona entre os workers WebAssembly). Se o banco
// ficar em WAL (visto uma vez neste ambiente, sem causa identificada), a troca WAL → DELETE falha com "database is
// locked" e o WordPress não sobe mais ("Cannot escape data without an active database connection"). Com o servidor
// parado, converte de volta aqui (node:sqlite, Node 22.13+).
async function garantirJournalDelete() {
  const dir = join(SITE, 'wp-content', 'database');
  if (!existsSync(dir)) return;
  const bancos = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && e.name === '.ht.sqlite') bancos.push(join(dir, e.name));
    if (e.isDirectory() && existsSync(join(dir, e.name, '.ht.sqlite'))) bancos.push(join(dir, e.name, '.ht.sqlite'));
  }
  for (const arq of bancos) {
    const cab = Buffer.alloc(20);
    const fd = openSync(arq, 'r');
    readSync(fd, cab, 0, 20, 0);
    closeSync(fd);
    if (cab[18] !== 2 && !existsSync(`${arq}-wal`)) continue; // 1 = rollback journal (ok), 2 = WAL
    try {
      const { DatabaseSync } = await import('node:sqlite');
      const db = new DatabaseSync(arq);
      const modoNovo = db.prepare('PRAGMA journal_mode = DELETE').get().journal_mode;
      db.close();
      console.log(`banco SQLite estava em WAL: convertido para ${modoNovo} (${arq})`);
    } catch (e) {
      console.warn(`aviso: o banco está em WAL e não deu para converter (${e.message}). Se o WordPress não subir,`);
      console.warn('       rode com Node 22.13+ ou use --reset.');
    }
  }
}
await garantirJournalDelete();

// ---------------------------------------------------------------------------------------------------------------
// 2. Playground CLI (server, com as montagens explícitas)

const cliArgs = [
  'server',
  `--port=${PORTA}`,
  `--site-url=${URL_SITE}`,
  `--php=${PHP}`,
  `--wp=${WP}`,
  `--wordpress-install-mode=${modo}`,
  // --mount-dir (e não --mount=host:vfs) porque o caminho do Windows tem ":" (C:\...)
  '--mount-dir-before-install', SITE, '/wordpress',
  '--mount-dir', TEMA, '/wordpress/wp-content/themes/artemis-portfolio',
  // WordPress fixo na versão acima: sem atualização automática do core, plugins, temas e traduções
  '--define-bool', 'AUTOMATIC_UPDATER_DISABLED', 'true',
  ...(blueprint ? [`--blueprint=${blueprint}`] : []),
];

// npx pelo próprio Node (sem shell: os caminhos vão como argumentos, sem problema de aspas)
const NPX = [
  join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'),
  join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'),
].find(existsSync);
const [cmd, cmdArgs, opcoes] = NPX
  ? [process.execPath, [NPX, '--yes', CLI, ...cliArgs], {}]
  : ['npx', ['--yes', CLI, ...cliArgs].map((a) => (/[\s"&|<>^]/.test(a) ? `"${a}"` : a)),
    { shell: process.platform === 'win32' }];

console.log(`${marca ? 'WordPress local existente' : 'Instalando o WordPress local'} (WP ${WP}, PHP ${PHP}, ${CLI})`);
console.log(`estado: ${SITE}`);
if (blueprint) console.log(`blueprint: ${blueprint === BLUEPRINT ? 'wordpress/blueprint.json' : 'passos de tema + seeder'}`);

// stdout/stderr passam adiante; o "Ready!" do CLI marca o fim do blueprint (o HTTP já responde 200 antes dele).
const filho = spawn(cmd, cmdArgs, {
  cwd: RAIZ,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.stdout.isTTY ? { ...process.env, FORCE_COLOR: '1' } : process.env,
  ...opcoes,
});
let cliPronto = false;
let ultimas = '';
filho.stdout.on('data', (b) => {
  process.stdout.write(b);
  ultimas = (ultimas + b.toString()).replace(/\x1b\[[0-9;]*m/g, '').slice(-4000);
  if (/Ready!/.test(ultimas)) cliPronto = true;
});
filho.stderr.on('data', (b) => process.stderr.write(b));
let saindo = false;
const parar = () => {
  if (saindo || filho.exitCode !== null) return;
  saindo = true;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    filho.kill('SIGTERM');
  }
};
for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sinal, parar);
process.on('exit', parar);
let pronto = false;
filho.on('exit', (codigo) => {
  if (!pronto && !saindo) {
    console.error(`\no Playground parou antes de ficar pronto (código ${codigo}).`);
    // O "PHP.run() failed with exit code 255" do CLI não diz nada; o motivo fica no log do WordPress.
    const log = join(SITE, 'wp-content', 'debug.log');
    if (existsSync(log) && statSync(log).mtimeMs >= inicio) {
      const linhas = readFileSync(log, 'utf8').trimEnd().split('\n');
      console.error(`últimas linhas de ${log}:\n  ${linhas.slice(-12).join('\n  ')}`);
    }
    if (!marca) console.error('a instalação não terminou; a próxima execução começa do zero.');
  }
  process.exit(saindo ? 0 : codigo ?? 1);
});

// ---------------------------------------------------------------------------------------------------------------
// 3. Espera o WordPress responder, registra o provisionamento e mostra os endereços

const LIMITE = 15 * 60 * 1000;
while (!pronto) {
  if (Date.now() - inicio > LIMITE) {
    console.error('o WordPress não respondeu em 15 min.');
    parar();
    process.exit(1);
  }
  if (cliPronto) {
    try {
      const r = await fetch(`${URL_SITE}/wp-login.php`, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
      if (r.status === 200) pronto = true;
    } catch { /* ainda subindo */ }
  }
  if (!pronto) await sleep(1000);
}

if (blueprint) {
  const st = lerJson(STATUS) || {};
  marca = {
    ...(marca || { instalado_em: new Date().toISOString(), wp: WP, php: PHP, cli: CLI }),
    tema: st.tema || 'desconhecido',
    seed: st.seed || 'desconhecido',
    seed_em: st.seed === 'ok' ? new Date().toISOString() : marca?.seed_em,
  };
  writeFileSync(MARCA, JSON.stringify(marca, null, 2));
  const detalhe = Array.isArray(st.seed_detalhe) ? `${st.seed_detalhe.length} linhas de log` : st.seed_detalhe;
  console.log(`\ntema: ${st.tema || '?'}${st.tema_detalhe ? ` (${st.tema_detalhe})` : ''}`);
  console.log(`seeder: ${st.seed || '?'}${detalhe ? ` (${detalhe})` : ''}`);
  if (st.seed !== 'ok') {
    console.log('  → roda de novo no próximo início, ou no painel: Aparência → Portfólio: popular conteúdo.');
  }
  if (Array.isArray(st.seed_detalhe)) console.log(`  log completo: ${STATUS}`);
}

console.log(`
WordPress local pronto em ${segundos()}
  Site      ${URL_SITE}/   (página inicial = Portfólio; /portfolio-artemis/ redireciona para cá)
  Painel    ${URL_SITE}/wp-admin/   (login: admin / senha: admin — só local)
  Dados     ${SITE}
Ctrl+C para parar.`);
