/* Studio Artemis — motion.js: entradas e microinterações do site inteiro (estilos em assets/css/motion.css;
   catálogo e regras em MODEL.md › Motion).

   Princípio: em repouso a página é o Figma. Toda animação parte de um estado escondido e TERMINA sem deixar estilo
   (classe .is-done; spans auxiliares removidos). Toda entrada toca de novo quando o elemento sai da tela por inteiro e
   volta (pedido do cliente, 2026-10-18). Sem JS, com prefers-reduced-motion: reduce e na impressão nada é
   escondido. O <head> liga html.motion-on antes da primeira pintura (script inline, com volta automática em 4 s se
   este arquivo não carregar); só com .motion-on o CSS esconde alguma coisa.

   API por atributo (vale no estático e no tema WordPress — os atributos ficam no markup):
     data-reveal="up|diag|fade|pop|rise|grow-x|grow-y"   entra uma vez ao chegar na tela (padrão up)
       data-origin="left|right|top|bottom|center"        origem do grow-x/grow-y (padrão left / top)
     data-split="lines"                                  título revelado linha por linha (máscara por palavra)
     data-wipe="right|left|up|down|out" [data-wipe-zoom] imagem/faixa revelada por recorte (+ assentamento 1,06→1)
     data-count                                          número conta de 0 até o valor do texto (formato BR)
     data-type                                           texto digitado caractere a caractere (barra de status)
     data-parallax="0.12" [data-parallax-max="24"]       desloca na rolagem; 0 com a página no topo
     data-loop [data-loop-max="5"]                       liga .is-looping enquanto está na tela (para sempre; com
                                                         data-loop-max, por até N s a cada entrada)
     data-reveal-group[="variante"] [data-stagger="90"]  o pai dispara os itens dentro dele em sequência (no máximo
                                                         1,2 s de atraso acumulado); com valor, os filhos diretos sem
                                                         data-reveal recebem essa variante
     data-type-group                                     barra de status: digita os textos e acende os traços em ordem
     data-motion-delay="ms"                              atraso extra
     data-motion-start="load"                            toca ao carregar (topo da página), sem esperar a rolagem
   Hover: todo .btn ganha o rótulo que rola (só com mouse); links de texto com data-hover="line" ganham sublinhado
   (só CSS). Nada aqui reage ao cursor em elemento que não seja link ou botão (Regra de hover).
   window.ArtemisMotion.refresh(raiz) arma conteúdo inserido depois; .finish() leva tudo ao repouso. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var api = window.ArtemisMotion = { refresh: function () {}, finish: function () {} };

  if (reduceMQ.matches || !('IntersectionObserver' in window)) {
    root.classList.remove('motion-on');
    return;
  }
  root.classList.add('motion-on');

  var STAGGER = 90;          // ms entre itens de um grupo
  var STAGGER_MAX = 1200;    // atraso acumulado máximo num grupo
  var LINE_STEP = 80;        // ms entre linhas de um título
  var CHAR_STEP = 18;        // ms por caractere digitado
  var TARGETS = '[data-reveal],[data-split],[data-wipe],[data-count],[data-type]';

  var fontsReady = new Promise(function (resolve) {
    if (!document.fonts || !document.fonts.ready) { resolve(); return; }
    document.fonts.ready.then(resolve);
    setTimeout(resolve, 1000); // nunca segura a entrada por mais de 1 s
  });

  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function extraDelay(el) { return num(el.getAttribute('data-motion-delay'), 0); }

  /* ---------------------------------------------------------------------------
     Configuração automática das partes compartilhadas (header, CTA, newsletter, rodapé, botões):
     assim os templates do WordPress não precisam repetir os atributos.
     --------------------------------------------------------------------------- */
  function set(el, attr, val) { if (el && !el.hasAttribute(attr)) el.setAttribute(attr, val == null ? '' : val); }
  function each(scope, sel, fn) { Array.prototype.forEach.call(scope.querySelectorAll(sel), fn); }
  function hasOwn(el) { return el.matches(TARGETS) || !!el.closest('[data-reveal-group]'); }

  function autoConfig(scope) {
    // Barras de status do CTA e da newsletter: digita os textos e acende os traços de sinal em ordem
    each(scope, '.cta__status-inner, .newsletter__status-inner', function (bar) {
      set(bar, 'data-type-group');
      each(bar, '.cta__status-text, .newsletter__status-text', function (t) { set(t, 'data-type'); });
      each(bar, '.cta__signal-icon, .cta__signal-line, .newsletter__signal-icon, .newsletter__signal-line', function (s) { set(s, 'data-reveal', 'fade'); });
    });
    // Chamadas finais (10-cta da Home e de Serviços, Artemis SEO, MktOps): nota, título, texto e botões
    each(scope, '.cta__main', function (m) {
      each(m, '.cta__note', function (n) { if (!hasOwn(n)) set(n, 'data-reveal', 'fade'); });
      each(m, '.cta__title', function (h) { if (!hasOwn(h)) set(h, 'data-split', 'lines'); });
      each(m, '.cta__text, .body-lg', function (p) { if (!hasOwn(p)) set(p, 'data-reveal', 'up'); });
      each(m, '.btn', function (b) { if (!hasOwn(b)) set(b, 'data-reveal', 'up'); });
    });
    // Newsletter (Blog e artigo): eyebrow, título, texto e formulário
    each(scope, '.newsletter__main', function (m) {
      each(m, '.eyebrow', function (e) { if (!hasOwn(e)) set(e, 'data-reveal', 'fade'); });
      each(m, '.newsletter__title', function (h) { if (!hasOwn(h)) set(h, 'data-split', 'lines'); });
      each(m, '.body-lg', function (p) { if (!hasOwn(p)) set(p, 'data-reveal', 'up'); });
      each(m, '.newsletter__form', function (f) { if (!hasOwn(f)) set(f, 'data-reveal', 'up'); });
    });
    // Loops que já existiam (LED do status, traços que piscam no CTA): só alguns segundos a cada entrada na tela
    each(scope, '.cta__status, .newsletter__status, .cta__pattern', function (el) { set(el, 'data-loop'); });
    // Rodapé: os traços diagonais acendem da esquerda para a direita
    each(scope, '.site-footer__pattern-track', function (t) { set(t, 'data-reveal-group', 'fade'); set(t, 'data-stagger', '8'); });
  }

  /* ---------------------------------------------------------------------------
     Estado
     --------------------------------------------------------------------------- */
  var live = [];       // elementos com animação em andamento ou armada (para finish)

  function done(el) {
    el.classList.remove('is-in');
    el.classList.add('is-done');
    el.style.removeProperty('--m-delay');
    // título, contador e digitação devolvem o HTML guardado: o main.js tira a palavra viúva de novo
    if (window.ArtemisWidows && (el.hasAttribute('data-split') || el.hasAttribute('data-count') || el.hasAttribute('data-type'))) window.ArtemisWidows(el);
  }

  function afterAnim(el, ms, cb) {
    var fired = false;
    function end(e) {
      if (e && e.target !== el) return;
      if (fired) return;
      fired = true;
      el.removeEventListener('animationend', end);
      cb();
    }
    el.addEventListener('animationend', end);
    setTimeout(end, ms + 250); // garantia: elemento sem animação (display: none, etc.)
  }

  /* ---------------------------------------------------------------------------
     data-reveal
     --------------------------------------------------------------------------- */
  var REVEAL_MS = { up: 900, diag: 900, fade: 700, pop: 800, rise: 1100, 'grow-x': 900, 'grow-y': 900 };

  function playReveal(el, delay) {
    var v = el.getAttribute('data-reveal') || 'up';
    el.style.setProperty('--m-delay', delay + 'ms');
    el.classList.add('is-in');
    var g = el.__mGen;
    afterAnim(el, delay + (REVEAL_MS[v] || 900), function () { if (el.__mGen === g) done(el); });
  }

  /* ---------------------------------------------------------------------------
     data-split="lines": cada palavra numa máscara; as palavras da mesma linha sobem juntas.
     As quebras de linha são medidas ANTES de envolver (Range) e fixadas com <br>, então durante a
     animação as linhas são exatamente as do repouso; no fim o HTML original volta.
     --------------------------------------------------------------------------- */
  function prepareSplit(el) {
    if (el.__mSplit) return el.__mSplit;
    var g = el.__mGen;
    el.__mSplit = fontsReady.then(function () {
      // preparação vencida (o elemento voltou ao início e foi preparado de novo) ou já em repouso: não embrulha 2 vezes
      if (el.__mGen !== g || el.classList.contains('is-done') || el.__mOriginal != null) return;
      el.__mOriginal = el.innerHTML;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      for (var n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      var range = document.createRange();
      var pieces = []; // { node, parts: [{ text, word, top }] }
      nodes.forEach(function (node) {
        var parts = [];
        var re = /\s+|[^\s-]+-?|-/g, m;
        while ((m = re.exec(node.data))) {
          var text = m[0];
          var word = !/^\s+$/.test(text);
          var top = null;
          if (word) {
            range.setStart(node, m.index);
            range.setEnd(node, m.index + text.length);
            var r = range.getClientRects()[0];
            top = r ? r.top : null;
          }
          parts.push({ text: text, word: word, top: top });
        }
        pieces.push({ node: node, parts: parts });
      });
      var line = -1, lastTop = null, words = [];
      pieces.forEach(function (p) {
        var frag = document.createDocumentFragment();
        p.parts.forEach(function (part) {
          if (!part.word) { frag.appendChild(document.createTextNode(part.text)); return; }
          if (part.top !== null && (lastTop === null || part.top > lastTop + 2)) {
            line++;
            if (line > 0) frag.appendChild(document.createElement('br')).className = 'm-br';
            lastTop = part.top;
          }
          var w = document.createElement('span');
          w.className = 'm-w';
          var i = document.createElement('span');
          i.className = 'm-w__i';
          i.textContent = part.text;
          i.style.setProperty('--m-line', Math.max(line, 0));
          w.appendChild(i);
          frag.appendChild(w);
          words.push(i);
        });
        p.node.parentNode.replaceChild(frag, p.node);
      });
      el.__mWords = words;
      el.__mLines = line + 1;
      el.classList.add('is-split');
    });
    return el.__mSplit;
  }

  function restoreSplit(el) {
    if (el.__mOriginal != null) el.innerHTML = el.__mOriginal;
    el.__mOriginal = null;
    el.__mWords = null;
    el.classList.remove('is-split');
    done(el);
  }

  /* Janela redimensionada antes de o título tocar: as quebras medidas não valem mais — refaz */
  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      each(document, '[data-split].is-split:not(.is-in)', function (el) {
        if (el.__mOriginal == null) return;
        el.innerHTML = el.__mOriginal;
        el.__mOriginal = null;
        el.__mSplit = null;
        el.classList.remove('is-split');
        prepareSplit(el);
      });
    }, 150);
  });

  function playSplit(el, delay) {
    prepareSplit(el).then(function () {
      if (el.classList.contains('is-done')) return;
      var words = el.__mWords || [];
      el.style.setProperty('--m-delay', delay + 'ms');
      el.classList.add('is-in');
      var last = words[words.length - 1];
      if (!last) { restoreSplit(el); return; }
      var g = el.__mGen;
      afterAnim(last, delay + (el.__mLines || 1) * LINE_STEP + 900, function () { if (el.__mGen === g) restoreSplit(el); });
    });
  }

  /* ---------------------------------------------------------------------------
     data-wipe: recorte (clip-path) que abre na direção pedida; data-wipe-zoom assenta a 1ª imagem de 1,06 para 1
     --------------------------------------------------------------------------- */
  function playWipe(el, delay) {
    el.style.setProperty('--m-delay', delay + 'ms');
    el.classList.add('is-in');
    var g = el.__mGen;
    afterAnim(el, delay + 1100, function () { if (el.__mGen === g) done(el); });
  }

  /* ---------------------------------------------------------------------------
     data-count: o primeiro número do texto conta de 0 até o valor, no formato do próprio texto (40.000 · 97 · 86,3).
     O número visível é aria-hidden; o valor real fica num span só para leitor de tela; a largura é travada com a
     fonte carregada para o sufixo não andar. No fim volta o HTML original.
     --------------------------------------------------------------------------- */
  function findNumber(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentNode.closest('small')) continue;
      var m = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/.exec(n.data);
      if (m) return { node: n, index: m.index, raw: m[0] };
    }
    return null;
  }

  function prepareCount(el) {
    if (el.__mCount) return el.__mCount;
    var g = el.__mGen;
    el.__mCount = fontsReady.then(function () {
      if (el.__mGen !== g || el.classList.contains('is-done') || el.__mOriginal != null) return;
      var f = findNumber(el);
      if (!f) { done(el); return; }
      el.__mOriginal = el.innerHTML;
      var dec = (f.raw.split(',')[1] || '').length;
      var value = parseFloat(f.raw.replace(/\./g, '').replace(',', '.'));
      var before = f.node.data.slice(0, f.index);
      var after = f.node.data.slice(f.index + f.raw.length);
      var vis = document.createElement('span');
      vis.className = 'm-count';
      vis.setAttribute('aria-hidden', 'true');
      vis.textContent = f.raw;
      var sr = document.createElement('span');
      sr.className = 'm-sr';
      sr.textContent = f.raw;
      var frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(vis);
      frag.appendChild(sr);
      if (after) frag.appendChild(document.createTextNode(after));
      f.node.parentNode.replaceChild(frag, f.node);
      var em = parseFloat(getComputedStyle(vis).fontSize) || 16;
      vis.style.minWidth = (vis.getBoundingClientRect().width / em).toFixed(3) + 'em';
      vis.textContent = format(0, dec);
      el.__mCountState = { vis: vis, value: value, dec: dec };
    });
    return el.__mCount;
  }

  function format(v, dec) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function playCount(el, delay) {
    var g = el.__mGen;
    prepareCount(el).then(function () {
      var s = el.__mCountState;
      if (!s || el.classList.contains('is-done') || el.__mGen !== g) return;
      var dur = num(el.getAttribute('data-count-duration'), 2000);
      setTimeout(function () {
        if (el.__mGen !== g) return;
        var t0 = performance.now();
        (function tick(now) {
          if (el.__mGen !== g) return;
          var p = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          s.vis.textContent = format(s.value * e, s.dec);
          if (p < 1 && !el.classList.contains('is-done')) requestAnimationFrame(tick);
          else finishCount(el);
        })(t0);
      }, delay);
    });
  }

  function finishCount(el) {
    if (el.__mOriginal != null) el.innerHTML = el.__mOriginal;
    el.__mOriginal = null;
    el.__mCountState = null;
    done(el);
  }

  /* ---------------------------------------------------------------------------
     data-type: cada caractere aparece em sequência, já na posição final (largura não muda)
     --------------------------------------------------------------------------- */
  function prepareType(el) {
    if (el.__mType) return;
    el.__mType = true;
    el.__mOriginal = el.innerHTML;
    var text = el.textContent;
    var vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < text.length; i++) {
      var c = document.createElement('span');
      c.className = 'm-c';
      c.textContent = text[i];
      c.style.setProperty('--m-i', i);
      vis.appendChild(c);
    }
    var sr = document.createElement('span');
    sr.className = 'm-sr';
    sr.textContent = text;
    el.textContent = '';
    el.appendChild(vis);
    el.appendChild(sr);
    el.__mChars = text.length;
    el.classList.add('is-typing-ready');
  }

  function typeDuration(el) { return (el.__mChars || el.textContent.length) * CHAR_STEP + 200; }

  function playType(el, delay) {
    prepareType(el);
    el.style.setProperty('--m-delay', delay + 'ms');
    el.classList.add('is-in');
    var g = el.__mGen;
    setTimeout(function () { if (el.__mGen === g) finishType(el); }, delay + typeDuration(el) + 250);
  }

  function finishType(el) {
    if (el.__mOriginal != null) el.innerHTML = el.__mOriginal;
    el.__mOriginal = null;
    el.classList.remove('is-typing-ready');
    done(el);
  }

  /* ---------------------------------------------------------------------------
     Disparo
     --------------------------------------------------------------------------- */
  function play(el, delay) {
    if (el.classList.contains('is-done') || el.__mPlayed) return;
    el.__mPlayed = true;
    delay = (delay || 0) + extraDelay(el);
    if (el.hasAttribute('data-split')) playSplit(el, delay);
    else if (el.hasAttribute('data-wipe')) playWipe(el, delay);
    else if (el.hasAttribute('data-count')) playCount(el, delay);
    else if (el.hasAttribute('data-type')) playType(el, delay);
    else playReveal(el, delay);
  }

  function groupItems(group) {
    return Array.prototype.filter.call(group.querySelectorAll(TARGETS), function (el) {
      return el.parentElement.closest('[data-reveal-group],[data-type-group]') === group;
    });
  }

  function playGroup(group, delay) {
    if (group.__mPlayed) return;
    group.__mPlayed = true;
    delay = (delay || 0) + extraDelay(group);
    var items = groupItems(group);
    if (group.hasAttribute('data-type-group')) {
      var t = 0;
      items.forEach(function (el) {
        if (el.hasAttribute('data-type')) { prepareType(el); play(el, delay + t); t += typeDuration(el) * 0.6; }
        else { play(el, delay + t); t += 25; }
        t = Math.min(t, 2500);
      });
      return;
    }
    var step = num(group.getAttribute('data-stagger'), STAGGER);
    items.forEach(function (el, i) { play(el, delay + Math.min(i * step, STAGGER_MAX)); });
    group.classList.add('is-done');
  }

  function finishNow(el) {
    el.__mPlayed = true;
    if (el.hasAttribute('data-split')) { if (el.__mOriginal != null) restoreSplit(el); else done(el); }
    else if (el.hasAttribute('data-count')) finishCount(el);
    else if (el.hasAttribute('data-type')) finishType(el);
    else done(el);
  }

  function trigger(el) {
    if (el.hasAttribute('data-reveal-group') || el.hasAttribute('data-type-group')) playGroup(el, 0);
    else play(el, 0);
  }

  var watching = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      watching.delete(e.target);
      trigger(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  function watch(el) { watching.add(el); io.observe(el); }

  /* Fim da página: o que está nos últimos 12% da tela (ex.: traços do rodapé) nunca passaria da margem do
     observador — com a rolagem no fim, toca o que já está visível */
  var endTick = false;
  window.addEventListener('scroll', function () {
    if (endTick || !watching.size) return;
    endTick = true;
    requestAnimationFrame(function () {
      endTick = false;
      if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 2) return;
      watching.forEach(function (el) {
        var r = el.getBoundingClientRect(); // só o que está visível (não o que ficou acima da tela)
        if (r.top < window.innerHeight && r.bottom > 0) { io.unobserve(el); watching.delete(el); trigger(el); }
      });
    });
  }, { passive: true });

  /* ---------------------------------------------------------------------------
     Repetição: quando o elemento (ou grupo) já tocado sai da tela por inteiro, volta ao estado inicial (fora da tela,
     sem piscar) e é observado de novo — a entrada toca outra vez quando ele volta.
     --------------------------------------------------------------------------- */
  function resetItem(it) {
    it.__mGen = (it.__mGen || 0) + 1; // invalida timers e quadros da execução anterior
    it.__mPlayed = false;
    it.classList.remove('is-in', 'is-done');
    it.style.removeProperty('--m-delay');
    if (it.hasAttribute('data-split')) {
      if (it.__mOriginal != null) it.innerHTML = it.__mOriginal;
      it.__mOriginal = null; it.__mWords = null; it.__mSplit = null;
      it.classList.remove('is-split');
      prepareSplit(it);
    } else if (it.hasAttribute('data-count')) {
      if (it.__mOriginal != null) it.innerHTML = it.__mOriginal;
      it.__mOriginal = null; it.__mCountState = null; it.__mCount = null;
      prepareCount(it);
    } else if (it.hasAttribute('data-type')) {
      if (it.__mOriginal != null) it.innerHTML = it.__mOriginal;
      it.__mOriginal = null; it.__mType = false;
      it.classList.remove('is-typing-ready');
      prepareType(it);
    }
  }
  function resetRoot(el) {
    var isGroup = el.hasAttribute('data-reveal-group') || el.hasAttribute('data-type-group');
    if (isGroup) {
      el.__mPlayed = false;
      el.classList.remove('is-done');
      groupItems(el).forEach(resetItem);
    } else resetItem(el);
  }
  var replayIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting || reduceMQ.matches || !el.__mPlayed || watching.has(el)) return;
      // No Chrome a interseção considera o clip-path do próprio alvo: no início do data-wipe (inset 100%) ela zera e a
      // imagem "sairia da tela" a cada quadro, reiniciando sem parar. Vale a caixa: ainda na tela, não reinicia.
      // Só para alvo com clip-path próprio (a cortina usa máscara desde ddff5cd): conferir a caixa de qualquer alvo
      // impedia a repetição do que passa da borda de um ancestral com overflow (círculos do Sobre) ou tem parallax
      var r = e.boundingClientRect;
      if (r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(el).clipPath !== 'none') return;
      resetRoot(el);
      watch(el);
    });
  }, { threshold: 0 });

  function arm(scope) {
    scope = scope || document;
    autoConfig(scope);
    // grupos com variante: filhos diretos sem atributo recebem a variante
    each(scope, '[data-reveal-group]', function (g) {
      var v = g.getAttribute('data-reveal-group');
      if (v) Array.prototype.forEach.call(g.children, function (c) { if (!c.matches(TARGETS) && !c.hasAttribute('data-reveal-group')) c.setAttribute('data-reveal', v); });
    });
    var roots = Array.prototype.filter.call(scope.querySelectorAll(TARGETS + ',[data-reveal-group],[data-type-group]'), function (el) {
      if (el.__mArmed) return false;
      var parentGroup = el.parentElement && el.parentElement.closest('[data-reveal-group],[data-type-group]');
      return !parentGroup;
    });
    roots.forEach(function (el) {
      el.__mArmed = true;
      live.push(el);
      var isGroup = el.hasAttribute('data-reveal-group') || el.hasAttribute('data-type-group');
      var items = isGroup ? groupItems(el) : [el];
      items.forEach(function (it) {
        if (it !== el) { it.__mArmed = true; live.push(it); }
        if (it.hasAttribute('data-split')) prepareSplit(it);
        if (it.hasAttribute('data-count')) prepareCount(it);
        if (it.hasAttribute('data-type')) prepareType(it);
      });
      var r = el.getBoundingClientRect();
      // Topo: tudo que toca ao carregar começa junto, depois das fontes (no máx. 1 s) — senão o lead (reveal)
      // aparecia antes do título (split, que espera a Exo para medir as linhas) num primeiro acesso
      replayIO.observe(el);
      if (el.getAttribute('data-motion-start') === 'load') { fontsReady.then(function () { trigger(el); }); return; }
      if (r.bottom <= 0) { items.forEach(finishNow); if (isGroup) { el.__mPlayed = true; el.classList.add('is-done'); } return; } // já passou: pronto agora; toca quando voltar
      watch(el);
    });
    armLoops(scope);
    armParallax(scope);
  }

  /* ---------------------------------------------------------------------------
     data-loop: animação infinita ligada (.is-looping) enquanto o elemento está na tela e a aba está visível
     --------------------------------------------------------------------------- */
  var loopIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting && !document.hidden && !reduceMQ.matches) startLoop(el);
      else stopLoop(el);
    });
  }, { threshold: 0 });

  function startLoop(el) {
    if (el.__mLoopOn) return;
    el.__mLoopOn = true;
    el.classList.add('is-looping');
    el.dispatchEvent(new CustomEvent('motion:loop-start'));
    clearTimeout(el.__mLoopT);
    // Para sempre enquanto estiver na tela (pedido do cliente); data-loop-max limita a N s por entrada
    if (el.hasAttribute('data-loop-max')) el.__mLoopT = setTimeout(function () { stopLoop(el); }, num(el.getAttribute('data-loop-max'), 5) * 1000);
  }
  function stopLoop(el) {
    clearTimeout(el.__mLoopT);
    if (!el.__mLoopOn) return;
    el.__mLoopOn = false;
    el.classList.remove('is-looping');
    el.dispatchEvent(new CustomEvent('motion:loop-stop'));
  }
  function armLoops(scope) {
    each(scope, '[data-loop]', function (el) { if (!el.__mLoopArmed) { el.__mLoopArmed = true; loopIO.observe(el); } });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { each(document, '[data-loop]', stopLoop); return; }
    if (reduceMQ.matches) return;
    each(document, '[data-loop]', function (el) { // aba visível de novo: religa o que está na tela
      var r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) startLoop(el);
    });
  });

  /* ---------------------------------------------------------------------------
     data-parallax: translate Y = min(scrollY × fator, máximo) — 0 com a página no topo
     --------------------------------------------------------------------------- */
  var px = [], pxNear = new Set(), pxTick = false;
  var pxIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) pxNear.add(e.target); else pxNear.delete(e.target); });
    schedulePx();
  }, { rootMargin: '20% 0px 20% 0px' });
  function schedulePx() { if (!pxTick) { pxTick = true; requestAnimationFrame(updatePx); } }
  function updatePx() {
    pxTick = false;
    var y = window.scrollY;
    pxNear.forEach(function (el) {
      var f = num(el.getAttribute('data-parallax'), 0.12);
      var max = num(el.getAttribute('data-parallax-max'), 24);
      el.style.translate = '0 ' + Math.min(y * f, max).toFixed(2) + 'px';
    });
  }
  function armParallax(scope) {
    each(scope, '[data-parallax]', function (el) { if (px.indexOf(el) < 0) { px.push(el); pxIO.observe(el); } });
  }
  window.addEventListener('scroll', schedulePx, { passive: true });

  /* ---------------------------------------------------------------------------
     Hover de botão: o rótulo rola e a cópia (text-shadow) ocupa o lugar — só com mouse
     --------------------------------------------------------------------------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function armButtons(scope) {
    if (!fine.matches) return;
    each(scope, '.btn', function (b) {
      if (b.__mRoll || b.getAttribute('data-hover') === 'none') return;
      var kids = Array.prototype.slice.call(b.childNodes).filter(function (n) { return n.nodeType === 1 || n.data.trim(); });
      if (kids.length !== 1) return;
      var holder = kids[0].nodeType === 1 ? kids[0] : b;
      if (holder !== b && (holder.children.length || holder.tagName !== 'SPAN')) return;
      b.__mRoll = true;
      var roll = document.createElement('span');
      roll.className = 'm-roll';
      var inner = document.createElement('span');
      inner.className = 'm-roll__in';
      while (holder.firstChild) inner.appendChild(holder.firstChild);
      roll.appendChild(inner);
      holder.appendChild(roll);
    });
  }

  /* ---------------------------------------------------------------------------
     Repouso imediato: movimento reduzido ligado com a página aberta, impressão
     --------------------------------------------------------------------------- */
  function finishAll() {
    live.forEach(function (el) {
      try { io.unobserve(el); } catch (e) { /* ok */ }
      watching.delete(el);
      if (!el.classList.contains('is-done')) finishNow(el);
    });
    each(document, '[data-reveal-group],[data-type-group]', function (g) { g.classList.add('is-done'); });
    each(document, '[data-loop]', stopLoop);
    px.forEach(function (el) { el.style.removeProperty('translate'); });
    pxNear.clear();
  }

  // Movimento reduzido ligado com a página aberta: tudo ao repouso e nenhum loop/parallax volta a ligar
  function onReduce() { if (reduceMQ.matches) { finishAll(); loopIO.disconnect(); pxIO.disconnect(); replayIO.disconnect(); root.classList.remove('motion-on'); } }
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce);
  window.addEventListener('beforeprint', finishAll);

  api.refresh = function (scope) { arm(scope || document); armButtons(scope || document); };
  api.finish = finishAll;

  arm(document);
  armButtons(document);
})();
