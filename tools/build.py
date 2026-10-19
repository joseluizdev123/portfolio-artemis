#!/usr/bin/env python
"""
Monta index.html (página Portfólio) a partir das partes:

  src/template.html                   → documento (head, fontes, CSS, JS)
  src/partials/header.html            → header (variante Portfólio)
  src/partials/portfolio-NN-*.html    → seções, em ordem de nome
  src/partials/footer.html            → footer
  src/partials/card.html              → modelo do cartão da grade; {{CARDS}} na seção 04 recebe um por projeto
  src/projetos.json                   → dados dos cartões
  assets/css/base.css + assets/css/sections/<parte>.css, assets/js/portfolio.js

Caminhos relativos (assets/…): a página funciona na raiz de um domínio ou numa subpasta (GitHub Pages de projeto).

Também sincroniza o tema WordPress (wordpress/artemis-portfolio/): assets/ → tema/assets/ (cópia exata, sem editar
à mão no tema) e src/projetos.json → tema/data/projetos.json (dados do seeder).

Uso:  python tools/build.py
"""
import glob
import html
import json
import os
import shutil
import struct
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TITLE = 'Portfólio — Sites e plataformas do Studio Artemis'
DESCRIPTION = ('Sites institucionais, plataformas, onepages e blogs feitos para empresas implementarem estratégias '
               'de marketing e vendas. Cada projeto abre a versão publicada.')


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def ver(rel):
    """?v=<mtime>: o navegador não reaproveita CSS/JS antigo depois de cada build."""
    return '%s?v=%d' % (rel, int(os.path.getmtime(os.path.join(ROOT, rel))))


def jpeg_size(rel):
    """(largura, altura) de um JPEG — vira width/height do <img> (reserva o espaço antes de carregar)."""
    d = open(os.path.join(ROOT, rel), 'rb').read()
    i = 2
    while i < len(d):
        if d[i] != 0xFF:
            i += 1
            continue
        if d[i + 1] in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', d[i + 5:i + 9])
            return w, h
        i += 2 + struct.unpack('>H', d[i + 2:i + 4])[0]
    sys.exit('não consegui ler o tamanho de ' + rel)


def cards():
    tpl = read('src/partials/card.html')
    out = []
    for i, p in enumerate(json.loads(read('src/projetos.json'))['projetos']):
        img = p.get('imagem')
        if img:
            if not os.path.exists(os.path.join(ROOT, img)):
                sys.exit('imagem não encontrada: ' + img)
            w, h = jpeg_size(img)
            midia = '<img class="pf-shot__img" src="%s" width="%d" height="%d" alt="" loading="lazy" decoding="async">' % (html.escape(img), w, h)
        else:
            midia = '<p class="pf-shot__label">Captura do site</p>'
        esc = lambda s: html.escape(s, quote=True)  # noqa: E731
        values = {
            'alt': esc(('Captura de tela do projeto ' if img else 'Espaço para a captura de tela do projeto ') + p['nome']),
            'dominio': esc(p['dominio']), 'n': '%02d' % (i + 2), 'nome': esc(p['nome']),
            # url "#" = link ainda não existe: <a> sem href (não clicável, sem seta — portfolio-04-projetos.css)
            'href': '' if p['url'] == '#' else ' href="%s"' % esc(p['url']),
            'cta': esc(p.get('cta_sem_link', 'Protótipo em breve') if p['url'] == '#' else (p.get('cta') or 'Ver site no ar')),
            'midia': midia,
            'categorias': esc(' '.join(p.get('categorias') or [])),  # abas do filtro (assets/js/portfolio.js)
            'alvo': '' if p['url'] == '#' else ' target="_blank" rel="noopener noreferrer"',
        }
        card = tpl
        for k, v in values.items():
            card = card.replace('{{%s}}' % k, v)
        out.append(card.rstrip('\n'))
    return '\n'.join(out)


TEMA = os.path.join(ROOT, 'wordpress', 'artemis-portfolio')


def sincroniza_tema():
    """assets/ e src/projetos.json → tema WordPress (o tema usa os mesmos CSS, JS e imagens do estático)."""
    if not os.path.isdir(TEMA):
        return
    destino = os.path.join(TEMA, 'assets')
    if os.path.isdir(destino):
        shutil.rmtree(destino)
    shutil.copytree(os.path.join(ROOT, 'assets'), destino)
    os.makedirs(os.path.join(TEMA, 'data'), exist_ok=True)
    shutil.copyfile(os.path.join(ROOT, 'src', 'projetos.json'), os.path.join(TEMA, 'data', 'projetos.json'))
    n = sum(len(f) for _, _, f in os.walk(destino))
    print('wordpress/artemis-portfolio/assets (%d arquivos) + data/projetos.json' % n)


def main():
    sections = sorted(glob.glob(os.path.join(ROOT, 'src', 'partials', 'portfolio-[0-9][0-9]-*.html')))
    slugs = [os.path.splitext(os.path.basename(s))[0] for s in sections]
    main_html = '\n\n'.join(read('src/partials/%s.html' % s).rstrip('\n') for s in slugs).replace('{{CARDS}}', cards())

    css = ['assets/css/base.css'] + ['assets/css/sections/%s.css' % s for s in ['header'] + slugs + ['footer']
                                     if os.path.exists(os.path.join(ROOT, 'assets/css/sections/%s.css' % s))]
    out = read('src/template.html')
    out = out.replace('{{TITLE}}', TITLE).replace('{{DESCRIPTION}}', DESCRIPTION)
    out = out.replace('{{CSS}}', '\n'.join('<link rel="stylesheet" href="%s">' % ver(c) for c in css))
    out = out.replace('{{JS}}', '<script src="%s" defer></script>' % ver('assets/js/portfolio.js'))
    out = out.replace('{{HEADER}}', read('src/partials/header.html').rstrip('\n'))
    out = out.replace('{{FOOTER}}', read('src/partials/footer.html').rstrip('\n'))
    out = out.replace('{{MAIN}}', main_html)
    if '{{' in out:
        sys.exit('placeholder sem valor: ' + out[out.index('{{'):out.index('{{') + 40])
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    print('index.html (%d seções: %s · %d cartões)' % (len(slugs), ', '.join(slugs), out.count('class="pf-card"')))
    sincroniza_tema()


if __name__ == '__main__':
    main()
