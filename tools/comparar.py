#!/usr/bin/env python
"""
Diff numérico + diff de pixels entre o design (referência) e a página montada.

  python tools/comparar.py <dir-medidas> <largura> [--ref design] [--pag pagina] [--sem-links]

--sem-links: não compara src de imagens nem href de links (WordPress × estático: as imagens vêm do tema e da Mídia,
e o item "Portfólio" do menu aponta para a própria página) — todo o resto continua comparado.

Lê <dir>/<ref>-<largura>.json/.png e <dir>/<pag>-<largura>.json/.png (gerados por tools/medir.mjs) e imprime:
  1. estrutura: mesma sequência de elementos (tag + classes sem o prefixo pf-)
  2. diff numérico: toda diferença de caixa (x, y, w, h > 0,05 px) e de estilo computado, agrupada por seção.
     y é medido a partir do topo da PRÓPRIA seção: uma seção mais alta não acusa diferença nas de baixo.
  3. diff de pixels: % de pixels diferentes por seção, cada uma recortada a partir do próprio topo nas duas
     capturas (o <canvas> do hero é sorteado a cada carga: mascarado)
Sai com código 1 se houver qualquer diferença.
"""
import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

TOL = 0.05
SKIP = {'sec', 'tag', 'cls', 'x', 'y', 'w', 'h'}


def load(d, name, w):
    with open(os.path.join(d, '%s-%s.json' % (name, w)), encoding='utf-8') as f:
        return json.load(f)


def main():
    a = sys.argv[1:]
    d, w = a[0], a[1]
    ref = a[a.index('--ref') + 1] if '--ref' in a else 'design'
    pag = a[a.index('--pag') + 1] if '--pag' in a else 'pagina'
    if '--sem-links' in a:
        SKIP.update({'src', 'href'})
    R, P = load(d, ref, w), load(d, pag, w)
    bad = 0
    print('== %spx — %s × %s' % (w, ref, pag))
    print('documento: %s %s×%s · %s %s×%s · altura .pf %s vs %s' % (ref, R['docW'], R['docH'], pag, P['docW'], P['docH'], R['rootH'], P['rootH']))
    if set(R.get('fonts', [])) != set(P.get('fonts', [])):  # ex.: rede falhou e a Google Fonts não carregou
        print('!! fontes carregadas diferentes — meça de novo: %s × %s' % (sorted(set(R.get('fonts', []))), sorted(set(P.get('fonts', [])))))
        bad += 1
    if P['docW'] > P['vw']:
        print('!! rolagem lateral na página: docW %s > viewport %s' % (P['docW'], P['vw']))
        bad += 1
    for k in ('broken',):
        if P[k]:
            print('!! imagens quebradas na página:', P[k])
            bad += 1

    rn, pn = R['nodes'], P['nodes']
    n = min(len(rn), len(pn))
    for i in range(n):
        if (rn[i]['tag'], rn[i]['cls']) != (pn[i]['tag'], pn[i]['cls']):
            print('!! estrutura diverge no elemento %d: design <%s.%s> × página <%s.%s>' % (i, rn[i]['tag'], rn[i]['cls'], pn[i]['tag'], pn[i]['cls']))
            n = i
            bad += 1
            break
    if len(rn) != len(pn):
        print('!! número de elementos: design %d × página %d' % (len(rn), len(pn)))
        bad += 1

    def tops(nodes):
        t = {}
        for x in nodes:
            if x['tag'] in ('header', 'section', 'footer') and x['sec'] not in t:
                t[x['sec']] = x['y']
        return t
    rt, pt = tops(rn), tops(pn)
    by_sec = {}
    for i in range(n):
        r, p = dict(rn[i]), dict(pn[i])
        if r.get('display') == 'none' and p.get('display') == 'none':
            continue  # oculto nos dois: posição não significa nada
        r['y'] = round(r['y'] - rt.get(r['sec'], 0), 2)
        p['y'] = round(p['y'] - pt.get(p['sec'], 0), 2)
        diffs = []
        for k in ('x', 'y', 'w', 'h'):
            if abs(r[k] - p[k]) > TOL:
                diffs.append('%s %s→%s (Δ%+.2f)' % (k, r[k], p[k], p[k] - r[k]))
        for k in sorted(set(r) | set(p)):
            if k in SKIP:
                continue
            if r.get(k) != p.get(k):
                diffs.append('%s: %r → %r' % (k, r.get(k), p.get(k)))
        if diffs:
            by_sec.setdefault(r['sec'], []).append('<%s.%s>%s  %s' % (r['tag'], r['cls'], (' "' + r['text'][:30] + '"') if r.get('text') else '', ' · '.join(diffs)))
    total = sum(len(v) for v in by_sec.values())
    print('elementos comparados: %d · com diferença: %d' % (n, total))
    for sec, items in by_sec.items():
        print('-- %s (%d)' % (sec, len(items)))
        for it in items[:40]:
            print('   ' + it)
        if len(items) > 40:
            print('   … +%d' % (len(items) - 40))
    bad += total

    try:
        from PIL import Image, ImageChops
    except ImportError:
        print('(PIL ausente: sem diff de pixels)')
        sys.exit(1 if bad else 0)
    A = Image.open(os.path.join(d, '%s-%s.png' % (ref, w))).convert('RGB')
    B = Image.open(os.path.join(d, '%s-%s.png' % (pag, w))).convert('RGB')
    for img, nodes in ((A, rn), (B, pn)):  # pontos do <canvas> sorteados a cada carga: mascarados nas duas
        c = next((x for x in nodes if x['cls'] == 'hero__fx'), None)
        if c:
            img.paste((0, 0, 0), (int(c['x']), int(c['y']), int(c['x'] + c['w']) + 1, int(c['y'] + c['h']) + 1))
    print('pixels diferentes (Δ>8 em 0–255), por seção (cada uma alinhada pelo próprio topo):')
    rs = {x['sec']: x for x in rn if x['tag'] in ('header', 'section', 'footer')}
    ps = {x['sec']: x for x in pn if x['tag'] in ('header', 'section', 'footer')}
    for sec, r in rs.items():
        p = ps.get(sec)
        if not p:
            continue
        hgt = int(min(r['h'], p['h']))
        a = A.crop((0, int(r['y']), A.size[0], int(r['y']) + hgt))
        b = B.crop((0, int(p['y']), B.size[0], int(p['y']) + hgt))
        dm = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 8 else 0)
        hist = dm.histogram()
        pct = 100.0 * hist[255] / max(1, a.size[0] * a.size[1])
        extra = '' if abs(r['h'] - p['h']) < 0.5 else '  (altura %s → %s: comparado o trecho comum)' % (r['h'], p['h'])
        print('   %-10s %6.3f%%  (%d px)%s' % (sec, pct, hist[255], extra))
        if hist[255]:
            bad += 1
            dm.save(os.path.join(d, 'diff-%s-%s.png' % (w, sec)))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
