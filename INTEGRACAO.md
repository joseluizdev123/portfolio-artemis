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

## WordPress

O WordPress **já está pronto** num tema próprio: `wordpress/artemis-portfolio/`. Modelo de dados em [`MODEL.md`](MODEL.md).

- **Projetos:** post type `art_projeto` (Portfólio → Projetos), com captura, link, textos, ordem e "Em destaque".
- **Abas do filtro:** taxonomia `art_projeto_cat` (Portfólio → Categorias), com nome, plural e ordem.
- **Textos da página:** todos editáveis na própria página Portfólio (Páginas → Portfólio), uma caixa por seção.
- **Header e rodapé:** Personalizar → Portfólio: header e rodapé, e Aparência → Menus.
- **Números** ("23 projetos", "Formatos 03"…): calculados.
- **Mesmo HTML, CSS e JS do estático.** O WordPress renderiza a página com 0 pixel de diferença (`tools/comparar.py`).

Para testar localmente: `node tools/wordpress.mjs` (WordPress Playground; ver README).

### Levar para o tema oficial (`site_artemis/theme/artemis`)

O tema oficial já tem header, rodapé, Customizer ("Dados do site") e seeder. Do tema de prévia entram só as peças da página:

| Do tema de prévia | No tema oficial | Ajuste |
|---|---|---|
| `inc/cpt-projeto.php` | `inc/section-portfolio.php` (ou `inc/cpt-projeto.php`) | nenhum (prefixos `art_projeto`/`artemis_pf_` não colidem com o tema) |
| `inc/pagina.php` | junto, no mesmo arquivo ou em `inc/portfolio-pagina.php` | nenhum |
| `inc/helpers.php` (funções `artemis_pf_*`) | junto | `artemis_pf_asset()` → `artemis_asset()` do tema; os menus `pf_*` podem virar os menus do tema |
| `templates/portfolio.php` + `template-parts/portfolio/` | iguais | `get_header()`/`get_footer()` do tema oficial com a variante Portfólio (selo, item atual) |
| `inc/seeder.php` | um `add_filter( 'artemis_seed', … )` no padrão do tema | reaproveitar `artemis_pf_seed_*()` |
| `assets/css/sections/portfolio-*.css`, `assets/js/portfolio.js` | `assets/css/sections/`, `assets/js/sections/` | o tema carrega todas as folhas em todas as páginas: o CSS é todo prefixado e o JS não faz nada fora da página |

Não levar `header.php`, `footer.php`, `inc/customizer.php` nem `assets/css/sections/header.css`/`footer.css`: o
tema oficial já tem os seus, vindos do Figma.

## Pendências de conteúdo (revisar com o Studio Artemis)

- **Categorias dos projetos:** aprovadas pelo Studio em 2026-10-19. São 18 Site (mais o destaque Expo Usipa),
  3 Onepage (Zeros à Direita, ebrain, FaleUp) e 4 Blog (3Neuron, Voxy, Bolsa de terras e Global Supply, que também
  são Site). A aba Plataforma foi retirada a pedido do Studio: o oithe ficou sem categoria e aparece só em "Todos".
- **Sem captura:** Lebensart – Porsche (ambiente de teste), oithe (protótipo) e Nivéro mostram "Captura do site".
- **oithe:** o link do protótipo no Figma ainda é `#`, e o cartão mostra "Protótipo em breve". Para ativar, coloque a URL em
  `src/projetos.json`.
- **Redes sociais do rodapé:** links `#` (iguais ao design e ao site).
- **WhatsApp do rodapé:** `+55 (48) 0000-0000` é um número de exemplo (igual ao site).
