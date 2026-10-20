/* Studio Artemis — main.js */
(function () {
  'use strict';

  /* Sem palavra viúva no site todo (pedido do cliente, 2026-10-19): a última linha de um texto nunca fica com uma
     palavra só. O text-wrap: pretty (main.css, no body) resolve a maior parte; este reforço pega o resto (o pretty do
     Chrome é heurístico e o Firefox não tem). Para cada bloco de texto com a última linha de uma palavra só:
       1. junta as duas últimas palavras (espaço não separável; com hífen no par, o par vira nowrap);
       2. se ainda não couber, aperta o espaçamento entre letras do bloco em até 0,015em (ajuste de tipógrafo);
       3. confere de novo (viúva some, o bloco não ganha linha nem estoura); se não deu, desfaz tudo.
     Roda com as fontes prontas, ao mudar a largura (desfaz e mede de novo) e quando uma entrada do motion.js termina
     (window.ArtemisWidows(el)): o motion devolve o HTML guardado no fim de títulos, contadores e digitação.
     Trechos de 2 palavras ficam como estão (juntar estouraria a caixa). Verificação: tools/widow_check.mjs. */
  var widowBound = []; // ajustes feitos: { block, undo } — desfeitos ao mudar a largura
  var widowSkip = 'script,style,noscript,svg,textarea,select,option,template,code,pre,.m-sr';
  function widowInline(el) { var d = getComputedStyle(el).display; return d === 'inline' || d === 'contents'; }
  function widowBlockOf(el) {
    while (el && el !== document.body) { if (!widowInline(el)) return el; el = el.parentElement; }
    return document.body;
  }
  function widowPrepared(el) { // o motion.js está com o HTML guardado: mexer agora se perderia na devolução
    for (; el && el !== document.body; el = el.parentElement) if (el.__mOriginal != null) return true;
    return false;
  }
  function widowOverflow(block) { return Math.max(0, block.scrollWidth - block.clientWidth); } // texto que já passa da caixa (itálico) não conta como estouro novo
  function widowTail(block, nodes) { // só o trecho depois do último <br> do bloco (antes dele a quebra é forçada)
    var brs = Array.prototype.filter.call(block.querySelectorAll('br'), function (x) { return widowBlockOf(x.parentElement) === block; });
    var lastBr = brs[brs.length - 1];
    return lastBr ? nodes.filter(function (t) { return lastBr.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING; }) : nodes;
  }
  function widowNodes(block) { // nós de texto do próprio bloco (sem os de blocos internos)
    var out = [], tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    for (var n = tw.nextNode(); n; n = tw.nextNode()) {
      if (/\S/.test(n.data) && n.parentElement && !n.parentElement.closest(widowSkip) && widowBlockOf(n.parentElement) === block) out.push(n);
    }
    return widowTail(block, out);
  }
  function widowWords(nodes) { // tokens; um token colado entre dois nós de texto é a mesma palavra
    var words = [], glued = false;
    nodes.forEach(function (t) {
      var re = /\S+/g, m;
      while ((m = re.exec(t.data))) {
        if (glued && m.index === 0 && words.length) { var w = words[words.length - 1]; w.endNode = t; w.end = m.index + m[0].length; }
        else words.push({ startNode: t, start: m.index, endNode: t, end: m.index + m[0].length });
      }
      glued = t.data.length > 0 && !/\s$/.test(t.data);
    });
    return words;
  }
  var widowRange = document.createRange();
  function widowMeasure(words) { // { measured, onLast, widow }: a última linha = palavras que se sobrepõem na vertical à última palavra
    words.forEach(function (w) {
      widowRange.setStart(w.startNode, w.start);
      widowRange.setEnd(w.endNode, w.end);
      var rs = widowRange.getClientRects(), r = rs[rs.length - 1]; // palavra quebrada no hífen: vale o pedaço de baixo
      w.r = r && r.width ? r : null;
    });
    var measured = words.filter(function (w) { return w.r; });
    var L = measured[measured.length - 1];
    if (!L) return { measured: measured, onLast: [], widow: false };
    var cy = function (r) { return (r.top + r.bottom) / 2; };
    var onLast = measured.filter(function (w) { // tamanhos diferentes na mesma linha ("R$", "/MÊS" menores) contam como a mesma linha
      return (cy(w.r) >= L.r.top && cy(w.r) <= L.r.bottom) || (cy(L.r) >= w.r.top && cy(L.r) <= w.r.bottom);
    });
    return { measured: measured, onLast: onLast, widow: onLast.length === 1 && measured.length > 1 };
  }
  function widowBind(prev, last, nodes) { // junta prev e last; devolve a função que desfaz (ou null)
    var saves = [], put = false, inRun = false, extra = [];
    nodes.forEach(function (t) {
      if (t === prev.endNode) inRun = true;
      if (!inRun) return;
      var from = t === prev.endNode ? prev.end : 0;
      var to = t === last.startNode ? last.start : t.data.length;
      if (to > from && /^\s+$/.test(t.data.slice(from, to))) {
        saves.push({ node: t, data: t.data });
        t.data = t.data.slice(0, from) + (put ? '' : ' ') + t.data.slice(to);
        put = true;
      }
      if (t === last.startNode) inRun = false;
    });
    if (!put) return null;
    // hífen no par ("0000-0000", "follow-up"): o navegador quebraria nele — o par inteiro vira nowrap
    if (prev.startNode === last.endNode) {
      var t = prev.startNode, a = prev.start, b = last.end - (last.start - prev.end) + 1;
      if (/[-‐]/.test(t.data.slice(a, b))) {
        var span = document.createElement('span');
        span.style.whiteSpace = 'nowrap';
        span.textContent = t.data.slice(a, b);
        var after = document.createTextNode(t.data.slice(b));
        if (!saves.some(function (s) { return s.node === t; })) saves.push({ node: t, data: t.data });
        t.data = t.data.slice(0, a);
        t.parentNode.insertBefore(after, t.nextSibling);
        t.parentNode.insertBefore(span, after);
        extra.push(span, after);
      }
    }
    return function () {
      extra.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
      saves.forEach(function (s) { s.node.data = s.data; });
    };
  }
  function widowFix(block) {
    var nodes = widowNodes(block);
    var words = widowWords(nodes);
    if (words.length < 3) return;
    var m = widowMeasure(words);
    if (!m.widow) return;
    var last = m.onLast[0], prev = m.measured[m.measured.indexOf(last) - 1];
    if (!prev) return;
    var over = widowOverflow(block), h = block.getBoundingClientRect().height;
    var undo = widowBind(prev, last, nodes);
    if (!undo) return;
    var good = function () {
      return !widowMeasure(widowWords(widowNodes(block))).widow && block.getBoundingClientRect().height <= h + 0.5 && widowOverflow(block) <= over + 1;
    };
    var ok = good(), ls0 = block.style.letterSpacing;
    if (!ok) {
      var cs = getComputedStyle(block), fs = parseFloat(cs.fontSize) || 16;
      var base = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) || 0;
      for (var k = 1; k <= 3 && !ok; k++) { block.style.letterSpacing = (base - 0.005 * k * fs).toFixed(3) + 'px'; ok = good(); }
      if (!ok) block.style.letterSpacing = ls0;
    }
    if (!ok) { undo(); return; }
    widowBound.push({ block: block, undo: function () { block.style.letterSpacing = ls0; undo(); } });
  }
  function fixWidows(root) {
    var scope = root && root.nodeType === 1 && root !== document.body ? widowBlockOf(root) : document.body;
    var blocks = [];
    var tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    for (var n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!/\S/.test(n.data) || !n.parentElement || n.parentElement.closest(widowSkip)) continue;
      var b = widowBlockOf(n.parentElement);
      if (blocks.indexOf(b) < 0) blocks.push(b);
    }
    blocks.forEach(function (block) {
      var cs = getComputedStyle(block);
      if (cs.visibility === 'hidden' || cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre' || block.clientWidth <= 2 || widowPrepared(block)) return; // caixa de 1px: texto só para leitor de tela
      if (block.querySelector && Array.prototype.some.call(block.children, function (c) { return c.__mOriginal != null; })) return;
      widowFix(block);
    });
  }
  window.ArtemisWidows = fixWidows;
  function widowRedo() { // o texto mudou de medida (largura, fonte que chegou): desfaz os ajustes e mede tudo de novo
    widowBound.splice(0).reverse().forEach(function (b) { if (b.block.isConnected) b.undo(); });
    fixWidows();
  }
  var widowT;
  function widowLater(ms) { clearTimeout(widowT); widowT = setTimeout(widowRedo, ms); }
  var widowFontsDone = false;
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { widowFontsDone = true; fixWidows(); });
  setTimeout(function () { if (!widowFontsDone) fixWidows(); }, 1000); // mesmo teto do motion.js
  // fonts.ready pode resolver antes de a página pedir a fonte: quando ela chega (ou a página termina de carregar), mede de novo
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { widowLater(50); });
  window.addEventListener('load', function () { widowLater(0); });
  var widowW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === widowW) return;
    widowW = window.innerWidth;
    widowLater(200);
  });

  /* Header: após o scroll fica fixo, com logo e padding menores (8165:2339) */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Menu mobile (8662:2946): gaveta em overlay que entra da esquerda.
     Abre no botão "Menu"; fecha em "Fechar", Esc, clique fora ou ao seguir um link.
     Enquanto aberta: rolagem da página travada, resto da página inerte e foco preso na gaveta. */
  var drawer = document.querySelector('[data-menu]');
  var opener = document.querySelector('[data-menu-open]');
  if (drawer && opener) {
    var root = document.documentElement;
    var mobile = window.matchMedia('(max-width: 767px)');
    var inerted = [];
    var focusable = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    var setInert = function (on) {
      if (on) {
        inerted = Array.prototype.filter.call(document.body.children, function (el) {
          return el !== header && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert');
        });
        var bar = opener.parentElement; // barra do header (logo + botão "Menu")
        if (bar && bar !== header) inerted.push(bar);
      }
      inerted.forEach(function (el) {
        if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
      if (!on) inerted = [];
    };

    var isOpen = function () { return drawer.classList.contains('is-open'); };

    var open = function () {
      if (isOpen()) return;
      drawer.classList.add('is-open');
      opener.setAttribute('aria-expanded', 'true');
      root.classList.add('has-menu-open');
      setInert(true);
      var first = drawer.querySelector(focusable);
      if (first) first.focus({ preventScroll: true });
    };

    var close = function (restoreFocus) {
      if (!isOpen()) return;
      drawer.classList.remove('is-open');
      opener.setAttribute('aria-expanded', 'false');
      root.classList.remove('has-menu-open');
      setInert(false);
      if (restoreFocus !== false) opener.focus({ preventScroll: true });
    };

    opener.addEventListener('click', function () {
      if (isOpen()) close(); else open();
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-menu-close]')) {
        close();
        return;
      }
      var link = e.target.closest('a[href]');
      if (link && !link.hasAttribute('data-copy-email')) close(false); // o destino do link recebe o foco
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') { // mantém o Tab dentro da gaveta
        var items = Array.prototype.filter.call(drawer.querySelectorAll(focusable), function (el) {
          return el.offsetParent !== null || el === document.activeElement;
        });
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* Passou para o layout desktop (≥768) com a gaveta aberta: fecha sem mover o foco */
    var onBreakpoint = function (mq) { if (!mq.matches) close(false); };
    if (mobile.addEventListener) mobile.addEventListener('change', onBreakpoint);
    else if (mobile.addListener) mobile.addListener(onBreakpoint);

    /* E-mail de contato (8662:2967): o clique copia o endereço; sem Clipboard API segue o mailto: */
    var email = drawer.querySelector('[data-copy-email]');
    var status = drawer.querySelector('[data-copy-status]');
    if (email && navigator.clipboard && window.isSecureContext) {
      var label = status ? status.textContent : '';
      var timer;
      email.addEventListener('click', function (e) {
        e.preventDefault();
        var href = email.getAttribute('href');
        navigator.clipboard.writeText(email.textContent.trim()).then(function () {
          if (!status) return;
          status.textContent = status.getAttribute('data-copied') || label;
          clearTimeout(timer);
          timer = setTimeout(function () { status.textContent = label; }, 2400);
        }, function () {
          window.location.href = href;
        });
      });
    }
  }
})();
