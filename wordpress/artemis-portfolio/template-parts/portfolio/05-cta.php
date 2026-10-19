<?php
/**
 * Seção 05 — Chamada final (= src/partials/portfolio-05-cta.html). Campos: caixa "Portfólio — 5. Chamada final".
 * "[ Projetos: 23 ]" = rótulo + total calculado. Padrão de traços: imagens fixas do tema.
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_sig = '<span class="pf-sig{n}"><img src="' . esc_url( artemis_pf_asset( 'images/cta/signal-icon.svg' ) ) . '" width="37" height="14" alt=""><span class="pf-sig__lines"></span><img src="' . esc_url( artemis_pf_asset( 'images/cta/signal-icon-wide.svg' ) ) . '" width="55" height="14" alt=""></span>';
$artemis_pf_inicio = array( array( 0, '610.5px' ), array( 1, '610.5px' ), array( 2, '610.5px' ), array( 3, '702px' ), array( 4, '702px' ), array( 5, '1038px' ) );
$artemis_pf_fim    = array( array( 6, '519px', '516.75px' ), array( 7, '610.5px', '605.25px' ), array( 8, '610.5px', '605.25px' ), array( 9, '610.5px', '516px' ), array( 10, '428.25px', '339px' ), array( 11, '522px', '251.25px' ) );
?>
<!-- Seção 05 — Chamada final: barra de status + padrão de traços -->
<section class="pf-cta" aria-labelledby="cta-title">
<div class="pf-cta__bar" aria-hidden="true">
<div class="pf-wrap pf-cta__status">
<p class="pf-cta__st"><span class="pf-cta__led"></span><?php artemis_pf_e( 'pf_cta_status1' ); ?></p>
<?php echo str_replace( '{n}', '', $artemis_pf_sig ); // phpcs:ignore WordPress.Security.EscapeOutput -- URLs escapadas acima ?>
<p class="pf-cta__st pf-cta__status-mid"><?php artemis_pf_e( 'pf_cta_status2' ); ?></p>
<?php echo str_replace( '{n}', ' pf-sig--2', $artemis_pf_sig ); // phpcs:ignore WordPress.Security.EscapeOutput -- URLs escapadas acima ?>
<p class="pf-cta__st pf-cta__status-end"><?php echo esc_html( '[ ' . artemis_pf_txt( 'pf_cta_status3_rotulo' ) . ': ' . artemis_pf_total() . ' ]' ); ?></p>
</div>
</div>
<div class="pf-wrap pf-cta__main">
<div class="pf-dash" aria-hidden="true">
<div class="pf-dash__g">
<?php foreach ( $artemis_pf_inicio as $artemis_pf_l ) : ?>
<img src="<?php echo esc_url( artemis_pf_asset( 'images/cta/dash-row-' . $artemis_pf_l[0] . '.svg' ) ); ?>" style="width: <?php echo esc_attr( $artemis_pf_l[1] ); ?>" alt="">
<?php endforeach; ?>
</div>
<div class="pf-dash__g pf-dash__g--end">
<?php foreach ( $artemis_pf_fim as $artemis_pf_l ) : ?>
<span style="width: <?php echo esc_attr( $artemis_pf_l[1] ); ?>"><img src="<?php echo esc_url( artemis_pf_asset( 'images/cta/dash-row-' . $artemis_pf_l[0] . '.svg' ) ); ?>" style="width: <?php echo esc_attr( $artemis_pf_l[2] ); ?>" alt=""></span>
<?php endforeach; ?>
</div>
</div>
<p class="pf-cta__aside pf-eyebrow"><?php artemis_pf_e( 'pf_cta_nota' ); ?></p>
<div class="pf-cta__body">
<h2 class="pf-cta__title" id="cta-title"><?php artemis_pf_e( 'pf_cta_titulo' ); ?></h2>
<p class="pf-cta__text"><?php artemis_pf_e( 'pf_cta_texto' ); ?></p>
<a class="pf-btn pf-btn--pri" href="<?php artemis_pf_url( 'pf_cta_botao_url' ); ?>"><?php artemis_pf_e( 'pf_cta_botao_texto' ); ?></a>
</div>
</div>
</section>
