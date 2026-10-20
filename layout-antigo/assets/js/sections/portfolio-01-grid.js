/* Portfólio · filtro por categoria (layout antigo).
   "Todos" é exclusivo; as demais somam (Site + Blog mostra o que tem qualquer uma das duas); desmarcar a última volta a "Todos".
   No celular as opções ficam numa lista suspensa ("Categoria: …"), que abre e fecha no botão e fecha com Esc. */
(function () {
  var root = document.querySelector('[data-portfolio]');
  if (!root) return;

  var side = root.querySelector('[data-pf-side]');
  var dd = root.querySelector('[data-pf-dd]');
  var label = root.querySelector('[data-pf-dd-label]');
  var status = root.querySelector('[data-pf-status]');
  var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-pf-filter]'));
  var items = Array.prototype.slice.call(root.querySelectorAll('[data-pf-cat]'));
  var on = { todos: true };

  function apply(announce) {
    var shown = 0;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', on[b.getAttribute('data-pf-filter')] ? 'true' : 'false');
    });
    items.forEach(function (li) {
      var cats = li.getAttribute('data-pf-cat').split(/\s+/);
      var show = !!on.todos || cats.some(function (c) { return on[c]; });
      li.hidden = !show;
      if (show) shown++;
    });
    if (label) {
      label.textContent = 'Categoria: ' + buttons.filter(function (b) {
        return on[b.getAttribute('data-pf-filter')];
      }).map(function (b) { return b.textContent.trim(); }).join(', ');
    }
    if (announce && status) status.textContent = shown + (shown === 1 ? ' projeto' : ' projetos');
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-pf-filter');
      if (key === 'todos') {
        on = { todos: true };
      } else {
        var next = {};
        Object.keys(on).forEach(function (k) { if (k !== 'todos') next[k] = true; });
        if (next[key]) delete next[key]; else next[key] = true;
        on = Object.keys(next).length ? next : { todos: true };
      }
      apply(true);
    });
  });

  function setOpen(open) {
    side.classList.toggle('is-open', open);
    dd.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (dd && side) {
    dd.addEventListener('click', function () { setOpen(!side.classList.contains('is-open')); });
    side.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && side.classList.contains('is-open')) {
        setOpen(false);
        dd.focus();
      }
    });
  }

  apply(false);
})();
