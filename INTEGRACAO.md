# Como levar o Portfólio para o site oficial (quando for aprovado)

Esta página foi construída **fora** do `site_artemis` para que o site não fosse alterado durante a aprovação. Ela já
segue as convenções dele, então a integração é mais mover arquivos do que reescrever código. Este guia é o roteiro.
Nada aqui foi feito no site ainda.

## O que já está pronto para encaixar

| Aqui (portfolio_artemis) | No site (site_artemis) | Observação |
|---|---|---|
| `src/partials/portfolio-01-hero.html` … `portfolio-05-cta.html` | `partials/` (mesmos nomes) | trocar `assets/…` por `/assets/…` (o site usa caminhos absolutos) |
| `assets/css/sections/portfolio-0N-*.css` | `assets/css/sections/` | o build do site carrega `sections/<slug>.css` sozinho |
| `assets/css/base.css` | `assets/css/sections/portfolio-00-base.css` | tirar a regra `body {…}`: o `main.css` do site já tem |
| `assets/js/portfolio.js` | `assets/js/sections/portfolio-00-base.js` | não faz nada se a página não for o Portfólio (seguro no WordPress, que carrega tudo em todas as páginas) |
| `assets/images/projetos/` | `assets/images/portfolio/` | atualizar os caminhos em `src/projetos.json` |
| `src/projetos.json` + `src/partials/card.html` | gerador dos cartões | o `build.py` do site ainda não gera cartões a partir de JSON: ver o passo 3 |

Classes com prefixo `pf-`, keyframes `pf-…` e tokens declarados em `.pf`, não em `:root`. Por isso o CSS não colide com
o do site, nem quando o WordPress carrega todas as folhas em todas as páginas.

## Passo a passo no static (`site_artemis`)

1. **Branch próprio** no `site_artemis`, por exemplo `claude/pg-portfolio`.
2. **Copiar os arquivos** da tabela acima e trocar os caminhos (`src="assets/` → `src="/assets/`).
3. **Cartões da grade:** gerar os 22 `<article class="pf-card">` uma vez a partir do `index.html` desta pasta (eles já
   saem prontos do `tools/build.py`) e colar em `partials/portfolio-04-projetos.html` no lugar do marcador `CARDS`. Outra
   opção é ensinar o `tools/build.py` do site a ler `projetos.json`.
4. **`src/pages.json`** do site, nova página:
   ```json
   "portfolio": {
     "out": "portfolio-artemis/index.html",
     "title": "Portfólio — Sites e plataformas do Studio Artemis",
     "description": "Sites institucionais, plataformas, onepages e blogs…",
     "assets": ["portfolio-00-base"],
     "sections": ["portfolio-01-hero", "portfolio-02-filtro", "portfolio-03-destaque", "portfolio-04-projetos", "portfolio-05-cta"]
   }
   ```
   O endereço `/portfolio-artemis/` é o que o design usa nos links do menu.
5. **Contêiner `.pf`:** os estilos da página valem dentro de `.pf`, então envolva as seções num `<div class="pf">` (no
   primeiro e no último partial) ou dê `class="pf"` ao `<main>` desta página.
6. **Header e footer:** usar os do site (`partials/header.html` e `footer.html`), não os desta pasta. Eles são
   equivalentes e vêm do Figma oficial. Acrescentar a variante `<!--@if page=portfolio-->`, com selo "Portfólio" ao lado
   do logo (como o selo "Blog"), "Portfólio" como item atual e o CTA "Comece um projeto". Para lançar a página, colocar
   "Portfólio" no menu e no rodapé de todas as páginas.
7. **Chamada final:** o site já tem a `10-cta` com o mesmo padrão de traços. Dá para usar a seção daqui
   (`portfolio-05-cta`) ou a `10-cta` com condicionais para o texto do Portfólio.
8. **Antes da aprovação final no site:** em `tools/build_pages.py`, `EXCLUDE = {'seo': […], 'portfolio': ['images/portfolio']}`
   mantém a página fora do GitHub Pages do site mesmo depois do merge.
9. **Validar:** `python tools/diff.py`/`page_check.mjs` do site e as ferramentas daqui (`tools/medir.mjs` +
   `tools/comparar.py`, apontando `design` para esta prévia e `pagina` para a página no site).

## WordPress (tema `theme/artemis`)

Modelo de dados proposto, no mesmo padrão dos CPTs do tema (`inc/cpt-cliente.php`):

| Conteúdo | Tipo | Slug WP | Campos |
|---|---|---|---|
| Projetos do portfólio | CPT | `art_projeto` | título (nome), domínio exibido, URL, texto do botão (padrão "Ver site no ar"), imagem destacada (captura 16:10), ordem (`menu_order`) |
| Categorias | taxonomia | `art_projeto_cat` | Site, Plataforma, Onepage, Blog (as abas do filtro) |
| Projeto em destaque | meta no CPT | `_art_destaque` | marcar 1 projeto + descrição, 3 fatos (Formato/Destaque/Acesso) |
| Textos da página | Customizer | `art_portfolio_*` | eyebrow, título e texto do hero, títulos da grade e da chamada |
| Página | Page | `portfolio-artemis` | template `page-portfolio-artemis.php` → `template-parts/portfolio/NN-slug.php` |

O seeder do tema (`inc/seeder.php`) importaria `src/projetos.json` e as 20 capturas para a Mídia. Os números da
página ("23 projetos", "Projetos 23", "[ Projetos: 23 ]") passariam a ser calculados pela quantidade de projetos
publicados.

## Pendências de conteúdo (revisar com o Studio Artemis)

- **Categorias dos projetos:** aprovadas pelo Studio em 2026-10-19. São 18 Site (mais o destaque Expo Usipa),
  3 Onepage (Zeros à Direita, ebrain, FaleUp), 1 Plataforma (oithe) e 4 Blog (3Neuron, Voxy, Bolsa de terras e
  Global Supply, que também são Site).
- **Sem captura:** Lebensart – Porsche (ambiente de teste), oithe (protótipo) e Nivéro mostram "Captura do site".
- **oithe:** o link do protótipo no Figma ainda é `#`, e o cartão mostra "Protótipo em breve". Para ativar, coloque a URL em
  `src/projetos.json`.
- **Redes sociais do rodapé:** links `#` (iguais ao design e ao site).
- **WhatsApp do rodapé:** `+55 (48) 0000-0000` é um número de exemplo (igual ao site).
