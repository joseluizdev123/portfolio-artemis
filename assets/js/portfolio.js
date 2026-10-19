/* Página Portfólio — comportamento.
   Os dois efeitos são os do design (design/Main.dc.html, componentDidMount/renderVals), com os mesmos números:
   1. Hero: campo de pontos em <canvas> (grade de 24px) com varredura, cintilação e brilho/repulsão perto do cursor.
   2. Destaque: luz radial e borda azul seguem o cursor; a captura inclina em 3D (±4° em Y, ±3° em X).
   Acréscimos desta implementação (o design não define): filtro por categoria funcionando, menu do celular,
   aviso da newsletter e pausa do <canvas> fora da tela. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Hero — campo de pontos */
  (function () {
    var box = document.querySelector('.pf-hero__box');
    var c = box && box.querySelector('.pf-hero__fx');
    if (!c || !c.getContext) return;
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999, on: false };
    var W = 0, H = 0, cols = [], gap = 24;
    var mx = -9999, my = -9999, glow = 0, raf = 0, visible = true;

    box.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    });
    box.addEventListener('mouseleave', function () { mouse.on = false; });

    function size() {
      var r = c.getBoundingClientRect();
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = [];
      for (var x = gap / 2; x < W; x += gap) {
        var col = [];
        for (var y = gap / 2; y < H; y += gap) col.push({ x: x, y: y, s: Math.random() * 6.28, b: Math.random() < 0.06 });
        cols.push(col);
      }
      if (reduce) draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      glow += ((mouse.on ? 1 : 0) - glow) * 0.08;
      if (mouse.on) {
        mx += (mouse.x - mx) * 0.18; my += (mouse.y - my) * 0.18;
        if (mx < -999) { mx = mouse.x; my = mouse.y; }
      }
      var R = 190, sweep = (t * 0.00012 % 1.4 - 0.2) * W;
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        for (var j = 0; j < col.length; j++) {
          var p = col[j];
          var dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy);
          var near = d < R ? (1 - d / R) * glow : 0;
          var wave = Math.max(0, 1 - Math.abs(p.x - sweep) / 90) * 0.35;
          var tw = p.b ? (Math.sin(t * 0.002 + p.s) * 0.5 + 0.5) * 0.5 : 0;
          var k = Math.min(1, near * 1.2 + wave + tw);
          var px = p.x, py = p.y;
          if (near > 0) { px -= dx * near * 0.12; py -= dy * near * 0.12; }
          if (k > 0.04) {
            ctx.fillStyle = 'rgba(' + Math.round(132 + (84 - 132) * k) + ',' + Math.round(132 + (153 - 132) * k) + ',' +
              Math.round(133 + (255 - 133) * k) + ',' + (0.18 + k * 0.82) + ')';
            var h = 2 + k * 10;
            ctx.fillRect(px - 0.6, py - h / 2, 1.2, h);
          } else {
            ctx.fillStyle = 'rgba(132,132,133,0.16)';
            ctx.fillRect(px - 0.6, py - 0.6, 1.2, 1.2);
          }
        }
      }
    }

    function loop(t) {
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }

    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(c);
    else window.addEventListener('resize', size);
    if (reduce) return;
    // fora da tela o desenho para (o design desenha sempre; o resultado na tela é o mesmo)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      }).observe(box);
    }
    raf = requestAnimationFrame(loop);
  })();

  /* 2. Destaque — luz, borda e inclinação seguem o cursor */
  (function () {
    var card = document.querySelector('.pf-feat__card');
    if (!card) return;
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      card.style.setProperty('--on', '1');
      card.style.setProperty('--ry', ((x / r.width - 0.5) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-(y / r.height - 0.5) * 6).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--on', '0');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  })();

  /* 3. Filtro por categoria — seleção múltipla. No design as abas são só visuais; aqui:
     - cada categoria (Site, Onepage, Blog — no WordPress, as categorias cadastradas) liga/desliga (aria-pressed); a grade
       mostra quem tem QUALQUER uma das categorias marcadas (data-categorias). "Todos" limpa a seleção; marcar todas = Todos
       (quando há mais de uma categoria e todo projeto tem alguma — senão "todas" e "Todos" mostrariam coisas diferentes);
     - todo texto que o filtro escreve vem de data-txt-* no [data-pf-contagem] (editáveis no WordPress), com o padrão abaixo
       de reserva, e entra na página como texto (nunca como HTML);
     - a contagem ("22 projetos em Site e Blog"), o rótulo da grade e o endereço (#site+blog) acompanham;
     - com filtro ativo, "Filtre por categoria" vira o link "Ver os projetos ↓" (a página não rola sozinha a cada
       clique, para dar tempo de marcar mais de uma aba); abrir a página com #site+blog já filtra e rola até a grade;
     - o cartão de chamada fecha a última linha da grade (ocupa as células que sobram). */
  (function () {
    var nav = document.querySelector('[data-pf-filtro]');
    var grid = document.getElementById('pf-grid');
    if (!nav || !grid) return;
    var tabs = [].slice.call(nav.querySelectorAll('[data-filtro]'));
    var cards = [].slice.call(grid.querySelectorAll('.pf-card'));
    var cta = grid.querySelector('.pf-cta-card');
    var box = document.querySelector('[data-pf-contagem]');
    var count = box && box.querySelector('p');
    var hint = box && box.querySelectorAll('p')[1];
    var rotulo = document.querySelector('[data-pf-rotulo]');
    var feat = document.querySelector('.pf-feat__card');
    var featSec = feat && feat.closest('.pf-feat');
    var list = document.getElementById('projetos');
    var CATS = tabs.map(function (t) { return t.getAttribute('data-filtro'); }).filter(function (c) { return c !== 'todos'; });
    var ABA = {}, PLURAL = { site: 'Sites', plataforma: 'Plataformas', onepage: 'Onepages', blog: 'Blogs' };
    tabs.forEach(function (t) { // nome da aba e plural (data-plural, editável no WordPress) para contagem e rótulo da grade
      var c = t.getAttribute('data-filtro');
      ABA[c] = t.textContent.trim();
      if (t.getAttribute('data-plural')) PLURAL[c] = t.getAttribute('data-plural');
    });
    var sel = [], empty = null;
    var hintTexto = hint ? hint.textContent : '';
    var rotuloTexto = rotulo ? rotulo.textContent : ''; // "Todos os projetos" (editável): o que veio no HTML
    function txt(nome, padrao) {
      var v = box && box.getAttribute('data-txt-' + nome);
      return v === null || v === undefined || v === '' ? padrao : v;
    }
    var T = {
      todos: txt('todos', 'no portfólio'), projeto: txt('projeto', 'projeto'), projetos: txt('projetos', 'projetos'),
      em: txt('em', 'em'), e: txt('e', 'e'), ver: txt('ver', 'Ver os projetos ↓'),
      vazio: txt('vazio', 'Ainda não há projetos em %s publicados no portfólio.'),
      vazioTodos: txt('vazio-todos', 'Ainda não há projetos publicados no portfólio.'),
    };
    // marcar todas as categorias = "Todos" só quando isso não esconde nada (mais de uma aba e todo projeto categorizado)
    var reduz = CATS.length > 1 && !cards.concat(feat ? [feat] : []).some(function (el) {
      return !(el.getAttribute('data-categorias') || '').trim();
    });

    // as abas viram botões de liga/desliga (sem JS continuam links para âncoras)
    tabs.forEach(function (t) {
      t.setAttribute('role', 'button');
      t.removeAttribute('aria-current');
    });

    function lista(itens) { // "Site", "Site e Blog", "Site, Onepage e Blog"
      return itens.length < 2 ? itens.join('') : itens.slice(0, -1).join(', ') + ' ' + T.e + ' ' + itens[itens.length - 1];
    }

    function passa(el) {
      if (!sel.length) return true;
      var cs = ' ' + (el.getAttribute('data-categorias') || '') + ' ';
      return sel.some(function (c) { return cs.indexOf(' ' + c + ' ') > -1; });
    }

    // o cartão de chamada completa a última linha: colunas − (cartões % colunas); com a linha cheia, ocupa a linha inteira
    function fechaLinha() {
      if (!cta) return;
      cta.style.gridColumn = ''; // o span anterior criaria colunas implícitas e falsearia a contagem
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      var n = cards.filter(function (c) { return !c.hidden; }).length + (empty ? cols : 0);
      var resto = n % cols;
      cta.style.gridColumn = 'span ' + (resto ? cols - resto : cols);
    }

    function aplica() {
      var n = 0;
      cards.forEach(function (c, i) {
        var on = passa(c);
        if (on && c.hidden && !reduce) {
          c.classList.add('is-entrando'); // sair de display:none reinicia a animação
          c.style.animationDelay = Math.min(i, 8) * 30 + 'ms';
        }
        c.hidden = !on;
        if (on) n++;
      });
      var nomes = sel.map(function (c) { return ABA[c]; });
      var featOn = !feat || passa(feat);
      if (featSec) featSec.hidden = !featOn;
      var total = n + (feat && featOn ? 1 : 0);
      if (count) { // nós de texto: os textos vêm do painel e nunca viram HTML
        var forte = document.createElement('strong');
        forte.textContent = total + ' ' + (total === 1 ? T.projeto : T.projetos);
        count.textContent = '';
        count.appendChild(forte);
        count.appendChild(document.createTextNode(' ' + (sel.length ? T.em + ' ' + lista(nomes) : T.todos)));
      }
      if (hint) {
        hint.textContent = sel.length ? '' : hintTexto;
        if (sel.length) {
          var ver = document.createElement('a');
          ver.href = '#projetos';
          ver.setAttribute('data-pf-ver', '');
          ver.textContent = T.ver;
          hint.appendChild(ver);
        }
      }
      if (rotulo) rotulo.textContent = sel.length ? lista(sel.map(function (c) { return PLURAL[c] || ABA[c]; })) : rotuloTexto;
      if (!total) { // nem a grade nem o destaque têm projetos desta seleção
        if (!empty) {
          empty = document.createElement('p');
          empty.className = 'pf-grid__empty';
          empty.setAttribute('data-extra', '');
        }
        empty.textContent = sel.length ? T.vazio.replace('%s', lista(nomes)) : T.vazioTodos;
        grid.insertBefore(empty, cta);
      } else if (empty) {
        empty.remove();
        empty = null;
      }
      tabs.forEach(function (t) {
        var c = t.getAttribute('data-filtro');
        var on = c === 'todos' ? !sel.length : sel.indexOf(c) > -1;
        t.classList.toggle('pf-tab--on', on);
        t.setAttribute('aria-pressed', String(on));
      });
      fechaLinha();
    }

    function hashAtual() {
      return location.hash.slice(1).split(/[+,]/).filter(function (c) { return CATS.indexOf(c) > -1; });
    }

    function rolaAteGrade() {
      if (list) list.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }

    function alterna(c) {
      if (c === 'todos') sel = [];
      else if (sel.indexOf(c) > -1) sel = sel.filter(function (x) { return x !== c; });
      else sel = CATS.filter(function (x) { return x === c || sel.indexOf(x) > -1; }); // mantém a ordem das abas
      if (reduz && sel.length === CATS.length) sel = []; // todas marcadas = Todos
      if (history.replaceState) history.replaceState(null, '', sel.length ? '#' + sel.join('+') : location.pathname + location.search);
      aplica();
    }

    nav.addEventListener('click', function (e) {
      var t = e.target.closest('[data-filtro]');
      if (!t) return;
      e.preventDefault();
      alterna(t.getAttribute('data-filtro'));
    });
    nav.addEventListener('keydown', function (e) { // role="button": Espaço também aciona
      var t = e.target.closest('[data-filtro]');
      if (t && (e.key === ' ' || e.key === 'Spacebar')) { e.preventDefault(); alterna(t.getAttribute('data-filtro')); }
    });
    if (box) {
      box.addEventListener('click', function (e) {
        if (!e.target.closest('[data-pf-ver]')) return;
        e.preventDefault();
        rolaAteGrade();
      });
    }
    window.addEventListener('hashchange', function () { // voltar/avançar do navegador ou link externo
      var h = hashAtual();
      // "Voltar ao topo" (#pf-title), ícones (#) e outras âncoras: rolagem nativa, filtro mantido.
      // Sem fragmento (voltou à URL limpa) ou #todos: limpa o filtro.
      // (href="#" deixa location.hash vazio: o que distingue da URL limpa é o "#" no endereço)
      if (!h.length && location.href.indexOf('#') > -1 && location.hash !== '#todos') return;
      sel = reduz && h.length === CATS.length ? [] : h;
      aplica();
      if (sel.length) rolaAteGrade();
    });
    if ('ResizeObserver' in window) new ResizeObserver(fechaLinha).observe(grid);
    else window.addEventListener('resize', fechaLinha);

    sel = hashAtual();
    if (reduz && sel.length === CATS.length) sel = [];
    aplica();
    if (sel.length) (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(rolaAteGrade);
  })();

  /* 4. Menu do celular/tablet (≤1000) — painel abaixo do header (Esc ou clique num link fecha) */
  (function () {
    var btn = document.querySelector('[data-pf-menu-btn]');
    var menu = document.getElementById('pf-menu');
    if (!btn || !menu) return;
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Fechar' : 'Menu';
      menu.hidden = !open;
    }
    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', function (e) { if (e.matches) set(false); });
  })();

  /* 5. Newsletter — prévia sem servidor: não envia, avisa */
  (function () {
    var form = document.querySelector('[data-pf-newsletter]');
    var msg = document.querySelector('.pf-ftr__msg');
    if (!form || !msg) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = form.getAttribute('data-aviso') || 'Prévia: o cadastro na newsletter ainda não está ligado nesta página.';
    });
  })();
})();
