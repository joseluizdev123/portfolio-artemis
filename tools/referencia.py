#!/usr/bin/env python
"""
Gera referencia/design.html — o design do artefato (design/Main.dc.html) renderizado como HTML comum,
SEM nenhuma adaptação: mesmo CSS, mesma marcação, mesmo comportamento. É o gabarito da validação
pixel a pixel (tools/medir.mjs compara a página montada com ele, elemento por elemento).

  design/Main.dc.html     → artboard "Portfólio — Desktop 1440" do Claude Design (o mobile 390 é o mesmo arquivo)
  design/assets-map.json  → /_blob/<id> do artefato → arquivo em assets/images/
  src/projetos.json       → os cartões que o <sc-for> do design gera (mesmos dados do renderVals())

Uso:  python tools/referencia.py      (depois: http://localhost:5600/referencia/design.html)
"""
import html
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def design_parts():
    """(helmet, marcação) do .dc.html, com os /_blob/ trocados pelos arquivos locais (relativos à raiz)."""
    src = read('design/Main.dc.html')
    blobs = json.loads(read('design/assets-map.json'))
    helmet = src.split('<helmet>', 1)[1].split('</helmet>', 1)[0]
    markup = src.split('</helmet>', 1)[1].split('</x-dc>', 1)[0]

    def blob(m):
        if m.group(1) not in blobs:
            sys.exit('asset sem mapeamento em design/assets-map.json: %s' % m.group(1))
        return blobs[m.group(1)]
    markup = re.sub(r'/_blob/([0-9a-f]{32})', blob, markup)
    markup = re.sub(r'\s+on[A-Z]\w*="\{\{\s*\w+\s*\}\}"', '', markup)  # handlers do DCLogic → viram JS comum
    return helmet.strip('\n'), markup.strip('\n')


def projects():
    """Os mesmos objetos que o renderVals() do design monta (n começa em 02: o 01 é o destaque)."""
    out = []
    for i, p in enumerate(json.loads(read('src/projetos.json'))['projetos']):
        img = p.get('imagem', '')
        out.append({
            'img': img, 'hasImg': bool(img), 'noImg': not img,
            'n': '%02d' % (i + 2), 'name': p['nome'], 'domain': p['dominio'], 'href': p['url'],
            'cta': p.get('cta') or 'Ver site no ar',
            'alt': ('Captura de tela do projeto ' if img else 'Espaço para a captura de tela do projeto ') + p['nome'],
        })
    return out


def expand_loop(markup, prefix_path=''):
    """<sc-for list="{{projects}}" as="p"> … </sc-for> → um <article> por projeto (sc-if resolvido)."""
    m = re.search(r'<sc-for list="\{\{projects\}\}" as="p"[^>]*>\n?(.*?)</sc-for>\n?', markup, re.S)
    tpl = m.group(1)
    cards = []
    for p in projects():
        card = tpl
        card = re.sub(r'<sc-if value="\{\{p\.hasImg\}\}"[^>]*>(.*?)</sc-if>', lambda x: x.group(1) if p['hasImg'] else '', card, flags=re.S)
        card = re.sub(r'<sc-if value="\{\{p\.noImg\}\}"[^>]*>(.*?)</sc-if>', lambda x: x.group(1) if p['noImg'] else '', card, flags=re.S)
        card = re.sub(r'\{\{p\.(\w+)\}\}', lambda x: html.escape(prefix_path + p[x.group(1)] if x.group(1) == 'img' else str(p[x.group(1)]), quote=True), card)
        cards.append(card)
    return markup[:m.start()] + ''.join(cards) + markup[m.end():]


# Comportamento do componentDidMount/renderVals do design, em JS comum (mesmos números)
DESIGN_JS = r"""
(function () {
  var box = document.querySelector('.hero__box'), c = document.querySelector('.hero__fx');
  var mouse = { x: -9999, y: -9999, on: false };
  box.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
  box.addEventListener('mouseleave', function () { mouse.on = false; });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, cols = [], gap = 24;
  var size = function () {
    var r = c.getBoundingClientRect(); W = r.width; H = r.height;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = [];
    for (var x = gap / 2; x < W; x += gap) { var col = []; for (var y = gap / 2; y < H; y += gap) col.push({ x: x, y: y, s: Math.random() * 6.28, b: Math.random() < 0.06 }); cols.push(col); }
  };
  size(); new ResizeObserver(size).observe(c);
  var mx = -9999, my = -9999, glow = 0;
  var draw = function (t) {
    ctx.clearRect(0, 0, W, H);
    glow += ((mouse.on ? 1 : 0) - glow) * 0.08;
    if (mouse.on) { mx += (mouse.x - mx) * 0.18; my += (mouse.y - my) * 0.18; if (mx < -999) { mx = mouse.x; my = mouse.y; } }
    var R = 190, sweep = (t * 0.00012 % 1.4 - 0.2) * W;
    for (var i = 0; i < cols.length; i++) for (var j = 0; j < cols[i].length; j++) {
      var p = cols[i][j], dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy);
      var near = d < R ? (1 - d / R) * glow : 0, wave = Math.max(0, 1 - Math.abs(p.x - sweep) / 90) * 0.35;
      var tw = p.b ? (Math.sin(t * 0.002 + p.s) * 0.5 + 0.5) * 0.5 : 0, k = Math.min(1, near * 1.2 + wave + tw);
      var px = p.x, py = p.y;
      if (near > 0) { px -= dx * near * 0.12; py -= dy * near * 0.12; }
      if (k > 0.04) {
        ctx.fillStyle = 'rgba(' + Math.round(132 + (84 - 132) * k) + ',' + Math.round(132 + (153 - 132) * k) + ',' + Math.round(133 + (255 - 133) * k) + ',' + (0.18 + k * 0.82) + ')';
        var h = 2 + k * 10; ctx.fillRect(px - 0.6, py - h / 2, 1.2, h);
      } else { ctx.fillStyle = 'rgba(132,132,133,0.16)'; ctx.fillRect(px - 0.6, py - 0.6, 1.2, 1.2); }
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  if (reduce) draw(0); else requestAnimationFrame(draw);

  var card = document.querySelector('.feat__card');
  card.addEventListener('mousemove', function (e) {
    var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty('--mx', x + 'px'); card.style.setProperty('--my', y + 'px'); card.style.setProperty('--on', '1');
    card.style.setProperty('--ry', ((x / r.width - 0.5) * 8).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (-(y / r.height - 0.5) * 6).toFixed(2) + 'deg');
  });
  card.addEventListener('mouseleave', function () {
    card.style.setProperty('--on', '0'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
  });
})();
"""


def main():
    helmet, markup = design_parts()
    markup = re.sub(r'(src|href)="(assets/)', r'\1="../\2', markup)  # referencia/ fica um nível abaixo da raiz
    markup = expand_loop(markup, prefix_path='../')
    doc = '\n'.join([
        '<!doctype html>',
        '<html lang="pt-BR">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<meta name="robots" content="noindex">',
        '<title>Referência — design do Portfólio (Claude Design)</title>',
        helmet,
        '</head>',
        '<body>',
        markup,
        '<script>' + DESIGN_JS + '</script>',
        '</body>',
        '</html>',
        '',
    ])
    os.makedirs(os.path.join(ROOT, 'referencia'), exist_ok=True)
    with open(os.path.join(ROOT, 'referencia', 'design.html'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(doc)
    print('referencia/design.html (%d projetos na grade)' % len(projects()))


if __name__ == '__main__':
    main()
