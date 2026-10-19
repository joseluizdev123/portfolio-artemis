<?php
/**
 * Seção 02 — Filtro (= src/partials/portfolio-02-filtro.html).
 * Contagem = projetos publicados. Abas = Todos + categorias (Portfólio → Categorias (abas): nome, plural, ordem).
 * Campos: caixa "Portfólio — 2. Filtro".
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_faixa = '<div class="pf-wrap"><div class="pf-band__pattern{flip}"><img class="pf-band__ell pf-band__ell--mirror" src="' . esc_url( artemis_pf_asset( 'images/faixa/ellipse-a.svg' ) ) . '" alt=""><img class="pf-band__ell" src="' . esc_url( artemis_pf_asset( 'images/faixa/ellipse-b.svg' ) ) . '" alt=""></div></div>';
?>
<!-- Seção 02 — Filtro: faixas de elipses, contagem e abas de categoria (seleção múltipla: assets/js/portfolio.js) -->
<section class="pf-filter" aria-label="<?php esc_attr_e( 'Filtro do portfólio', 'artemis' ); ?>">
<div class="pf-band" aria-hidden="true">
<?php echo str_replace( '{flip}', '', $artemis_pf_faixa ); // phpcs:ignore WordPress.Security.EscapeOutput -- URLs escapadas acima ?>
</div>
<div class="pf-wrap">
<div class="pf-filter__in">
<div class="pf-hero__count" aria-live="polite" data-pf-contagem data-pf-todos="<?php echo esc_attr( artemis_pf_txt( 'pf_filtro_contagem' ) ); ?>">
<p><strong><?php echo esc_html( artemis_pf_n_projetos( artemis_pf_total() ) ); ?></strong> <?php artemis_pf_e( 'pf_filtro_contagem' ); ?></p>
<p><?php artemis_pf_e( 'pf_filtro_dica' ); ?></p>
</div>
<nav class="pf-tabs" aria-label="<?php esc_attr_e( 'Categorias do portfólio', 'artemis' ); ?>" data-pf-filtro>
<a class="pf-tab pf-tab--on" href="#todos" aria-current="true" aria-controls="pf-grid" data-filtro="todos"><?php artemis_pf_e( 'pf_filtro_todos' ); ?></a>
<?php foreach ( artemis_pf_categorias() as $artemis_pf_cat ) : ?>
<a class="pf-tab" href="#<?php echo esc_attr( $artemis_pf_cat['slug'] ); ?>" aria-controls="pf-grid" data-filtro="<?php echo esc_attr( $artemis_pf_cat['slug'] ); ?>" data-plural="<?php echo esc_attr( $artemis_pf_cat['plural'] ); ?>"><?php echo esc_html( $artemis_pf_cat['nome'] ); ?></a>
<?php endforeach; ?>
</nav>
</div>
</div>
<div class="pf-band pf-band--bottom" aria-hidden="true">
<?php echo str_replace( '{flip}', ' pf-band__pattern--flip', $artemis_pf_faixa ); // phpcs:ignore WordPress.Security.EscapeOutput -- URLs escapadas acima ?>
</div>
</section>
