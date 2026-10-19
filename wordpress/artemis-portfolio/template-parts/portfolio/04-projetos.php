<?php
/**
 * Seção 04 — Todos os projetos (= src/partials/portfolio-04-projetos.html).
 * Cartões = projetos publicados menos o destaque, na ordem do campo "Ordem" (numerados a partir de 02: o 01 é o destaque).
 * Campos: caixas "Portfólio — 4. Todos os projetos" e "4b. Cartão Próximo projeto". Números 1 e 2 calculados.
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_n = artemis_pf_destaque() ? 2 : 1;
?>
<!-- Seção 04 — Todos os projetos: um cartão por projeto + cartão de chamada no fim da grade -->
<section class="pf-list" id="projetos" aria-labelledby="list-title">
<div class="pf-wrap">
<div class="pf-list__head">
<div style="display: flex; flex-direction: column; gap: 16px">
<p class="pf-eyebrow" data-pf-rotulo><?php artemis_pf_e( 'pf_lista_eyebrow' ); ?></p>
<h2 class="pf-list__title" id="list-title"><?php artemis_pf_rico_e( 'pf_lista_titulo' ); ?></h2>
</div>
<p class="pf-list__note"><?php artemis_pf_e( 'pf_lista_nota' ); ?></p>
</div>
<div class="pf-grid" id="pf-grid">
<?php
foreach ( artemis_pf_projetos() as $artemis_pf_p ) {
	echo artemis_pf_cartao( $artemis_pf_p, $artemis_pf_n++ ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput -- escapado em artemis_pf_cartao()
}
?>
<aside class="pf-cta-card" aria-labelledby="cta-card-title">
<div class="pf-cta-card__body">
<div class="pf-cta-card__top">
<div>
<p class="pf-eyebrow"><?php artemis_pf_e( 'pf_chamada_eyebrow' ); ?></p>
<h2 class="pf-cta-card__title" id="cta-card-title" style="margin-top: 16px"><?php artemis_pf_rico_e( 'pf_chamada_titulo' ); ?></h2>
</div>
<a class="pf-go" href="<?php artemis_pf_url( 'pf_chamada_seta_url' ); ?>" aria-label="<?php echo esc_attr( artemis_pf_txt( 'pf_chamada_seta_rotulo' ) ); ?>">
<?php echo artemis_pf_seta( 28, '1.25' ); // phpcs:ignore WordPress.Security.EscapeOutput -- SVG fixo ?>
</a>
</div>
<p class="pf-cta-card__text"><?php artemis_pf_e( 'pf_chamada_texto' ); ?></p>
<div class="pf-btns">
<a class="pf-btn pf-btn--pri" href="<?php artemis_pf_url( 'pf_chamada_botao1_url' ); ?>"><?php artemis_pf_e( 'pf_chamada_botao1_texto' ); ?></a>
<a class="pf-btn" href="<?php artemis_pf_url( 'pf_chamada_botao2_url' ); ?>"><?php artemis_pf_e( 'pf_chamada_botao2_texto' ); ?></a>
</div>
</div>
<dl class="pf-stats">
<div class="pf-stat"><dt><?php artemis_pf_e( 'pf_stat1_rotulo' ); ?></dt><dd><?php echo esc_html( artemis_pf_total() ); ?></dd></div>
<div class="pf-stat"><dt><?php artemis_pf_e( 'pf_stat2_rotulo' ); ?></dt><dd><?php echo esc_html( sprintf( '%02d', count( artemis_pf_categorias() ) ) ); ?></dd></div>
<div class="pf-stat"><dt><?php artemis_pf_e( 'pf_stat3_rotulo' ); ?></dt><dd><?php artemis_pf_e( 'pf_stat3_valor' ); ?> <span><?php artemis_pf_e( 'pf_stat3_sufixo' ); ?></span></dd></div>
</dl>
<div class="pf-diag" aria-hidden="true"></div>
</aside>
</div>
</div>
</section>
