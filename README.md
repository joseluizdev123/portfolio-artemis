# Portfólio — Studio Artemis (prévia separada do site)

Página **Portfólio** do Studio Artemis, implementada pixel a pixel a partir do design feito no Claude Design
(artefato *Portfólio Artemis — nova página*, cópia em [`design/`](design/)).

Esta pasta é **independente do site oficial** (`site_artemis`): nada aqui altera o site. A página fica publicada
num GitHub Pages próprio só para aprovação. Se for aprovada, o caminho para entrar no site está em
[`INTEGRACAO.md`](INTEGRACAO.md).

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | página montada (gerada — não editar à mão) |
| `src/template.html` | documento: head, fontes, CSS, JS |
| `src/partials/` | `header`, `portfolio-01-hero` … `portfolio-05-cta`, `footer` e `card` (modelo do cartão da grade) |
| `src/projetos.json` | os 22 cartões da grade: nome, domínio, link, captura e **categorias** do filtro |
| `assets/css/base.css` | tokens + componentes compartilhados (`.pf-wrap`, `.pf-btn`, `.pf-shot`…) |
| `assets/css/sections/` | um CSS por parte (header, seções, footer) — todas as classes com prefixo `pf-` |
| `assets/js/portfolio.js` | campo de pontos do hero, efeito do destaque, filtro, menu do celular, aviso da newsletter |
| `assets/images/` | logo, ícones, padrões e as 20 capturas dos projetos (baixados do artefato) |
| `design/` | fonte do design (`Main.dc.html`) e o mapa dos assets do artefato |
| `tools/` | build, gabarito do design e validação pixel a pixel |

## Rodar localmente

```bash
python tools/build.py
```

```bash
python -m http.server 5600
```

Abra http://localhost:5600/. Para mudar um projeto, edite `src/projetos.json` e rode o build de novo.

## Validação pixel a pixel

```bash
python tools/referencia.py
```

```bash
node tools/medir.mjs referencia/medidas 1440 design=http://localhost:5600/referencia/design.html pagina=http://localhost:5600/index.html
```

```bash
python tools/comparar.py referencia/medidas 1440
```

```bash
node tools/testar.mjs
```

`referencia.py` renderiza o design original como HTML (o gabarito). `medir.mjs` mede todos os elementos das duas
páginas no Chrome headless e captura a página inteira. `comparar.py` aponta toda diferença de caixa, estilo e pixel,
seção por seção. `testar.mjs` testa o comportamento: filtro, menu, redimensionar a janela, rolagem lateral de 320 a
1920 e erros de console e de rede.

Resultado (2026-10-19): com o aumento da hero neutralizado, **0 pixel diferente** do design em todas as seções a
1440 e a 390, exceto o rodapé a 1440 (correção abaixo). Sem rolagem lateral de 320 a 1920.

## Diferenças em relação ao design

1. **Hero maior** (pedido do Studio): a caixa ocupa a primeira tela, e a faixa do filtro começa na dobra.
2. **Filtro funcionando, com seleção múltipla:** no design as abas eram só visuais. Agora Site, Onepage e Blog
   ligam e desligam (a aba Plataforma do design foi retirada a pedido do Studio), e "Todos" limpa a seleção. O projeto em destaque some quando não entra no filtro, e o
   endereço guarda a seleção (`#site+blog`). As categorias de cada projeto ficam em `src/projetos.json` (aprovadas
   pelo Studio em 2026-10-19).
3. **Rodapé:** a coluna de contato tem a largura do e-mail. No design o e-mail vazava 20px da tela e criava rolagem
   lateral.
4. **Menu do celular:** o design só mostra o botão "Menu" fechado. O painel abre abaixo do header. Ele vale até
   1000px e não só até 900px, porque de 901 a 981 a nav do design quebrava em duas linhas.
5. **Newsletter:** sem servidor nesta prévia, o envio mostra um aviso em vez de enviar.
6. **Telas de 320px** (o design vai até 390): os espaçamentos do header diminuem e os ícones sociais podem quebrar linha.
7. `noindex`: a prévia não aparece no Google.
8. **Pequenas correções de defeitos do próprio design:** o botão "Enviar" saía em Arial (agora Cabin), o logo do
   rodapé não mostrava o anel de foco, o anel de foco das abas ficava coberto pela aba vizinha, o hover dos cartões
   não respeitava o movimento reduzido, e o cartão "Próximo projeto" ganhou o arranjo compacto quando fica numa
   coluna só.
9. **oithe:** sem link do protótipo ainda (`#` no design), o cartão mostra "Protótipo em breve", sem link.

## Publicação

O workflow `.github/workflows/pages.yml` publica `index.html` + `assets/` no GitHub Pages a cada push na `main`.

## WordPress local (Playground)

O tema `wordpress/artemis-portfolio/` roda num WordPress local feito com o
[WordPress Playground](https://wordpress.github.io/wordpress-playground/) (`@wp-playground/cli` 3.1.59, PHP 8.2 em
WebAssembly, SQLite): sem Docker, sem MySQL, sem Apache. Requisitos: Node 22.13+ e rede na primeira execução.

```bash
node tools/wordpress.mjs            # sobe em http://127.0.0.1:9400 (Ctrl+C para parar)
node tools/wordpress.mjs --reset    # apaga o WordPress local e instala do zero
node tools/wordpress.mjs --popular  # roda o seeder de novo ao subir (sobrescreve o conteúdo pelo data/projetos.json)
```

| Endereço | O que é |
|---|---|
| http://127.0.0.1:9400/ | site (a página Portfólio é a página inicial) |
| http://127.0.0.1:9400/wp-admin/ | painel — usuário `admin`, senha `admin` (só local) |

- **WordPress 7.1.3 em português**, sem atualização automática. A primeira instalação leva uns 5 minutos (baixa o
  WordPress e grava cerca de 4 mil arquivos). Depois disso, subir leva uns 30 segundos.
- **O tema é montado ao vivo:** basta editar um arquivo em `wordpress/artemis-portfolio/` e recarregar a página.
- **O conteúdo fica salvo** em `wordpress/.playground/` (core, banco SQLite, mídia), fora do Git. O que se edita no
  painel continua lá depois de reiniciar. `--reset` apaga tudo.
- Na primeira instalação, `wordpress/blueprint.json` define o título, o idioma e a senha, ativa o tema e chama
  `artemis_pf_seed( true )`. Se o tema ainda estiver incompleto, o seeder fica pendente e roda sozinho na próxima
  vez que o WordPress subir. Para popular de novo a qualquer momento: **Aparência → Portfólio: popular conteúdo**
  (ou `--popular`).
- **O site abre deslogado** (sem a barra do admin), também para o Chrome headless de `tools/medir.mjs`. Para entrar,
  use `/wp-login.php`.
- **Cada página leva de 3 a 8 segundos** (PHP em WebAssembly com tradução MySQL → SQLite). Para validar,
  use um timeout generoso.
