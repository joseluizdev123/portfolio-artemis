<?php
/**
 * Seção 03 — Projeto em destaque (= src/partials/portfolio-03-destaque.html).
 * Dados: o projeto marcado "Em destaque" (Portfólio → Projetos). Nenhum marcado = a seção não aparece.
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_d = artemis_pf_destaque();
if ( ! $artemis_pf_d ) {
	return;
}
$artemis_pf_link = '' !== $artemis_pf_d['url'];
$artemis_pf_alvo = $artemis_pf_link ? ' href="' . esc_url( $artemis_pf_d['url'] ) . '" target="_blank" rel="noopener noreferrer"' : '';
?>
<!-- Seção 03 — Projeto em destaque: luz e inclinação 3D seguem o cursor (assets/js/portfolio.js) -->
<section class="pf-feat" aria-labelledby="feat-title">
<div class="pf-wrap">
<article class="pf-feat__card" data-categorias="<?php echo esc_attr( implode( ' ', $artemis_pf_d['categorias'] ) ); ?>">
<a class="pf-feat__media"<?php echo $artemis_pf_alvo; // phpcs:ignore WordPress.Security.EscapeOutput -- escapado acima ?> aria-label="<?php /* translators: %s: nome do projeto */ echo esc_attr( sprintf( __( 'Abrir o site da %s', 'artemis' ), $artemis_pf_d['nome'] ) ); ?>">
<div class="pf-shot" role="img" aria-label="<?php /* translators: %s: nome do projeto */ echo esc_attr( sprintf( __( 'Captura de tela do site %s', 'artemis' ), $artemis_pf_d['nome'] ) ); ?>">
<div class="pf-shot__bar" aria-hidden="true"><span class="pf-shot__dot"></span><span class="pf-shot__dot"></span><span class="pf-shot__dot"></span><span class="pf-shot__url"><?php echo esc_html( $artemis_pf_d['dominio'] ); ?></span></div>
<?php if ( $artemis_pf_d['imagem'] ) : ?>
<img class="pf-shot__img" src="<?php echo esc_url( $artemis_pf_d['imagem']['src'] ); ?>" alt="">
<?php else : ?>
<p class="pf-shot__label"><?php esc_html_e( 'Captura do site', 'artemis' ); ?></p>
<?php endif; ?>
<span class="pf-feat__scan" aria-hidden="true"></span>
</div>
<span class="pf-feat__open" aria-hidden="true"><?php esc_html_e( 'Abrir site', 'artemis' ); ?>
<?php echo artemis_pf_seta(); // phpcs:ignore WordPress.Security.EscapeOutput -- SVG fixo ?>
</span>
</a>
<div class="pf-feat__text">
<span class="pf-tag" style="align-self: flex-start"><?php echo esc_html( $artemis_pf_d['selo'] ); ?></span>
<p class="pf-meta"><span class="pf-meta__lead"><?php echo esc_html( $artemis_pf_d['formato'] ); ?></span><span aria-hidden="true">·</span><span><?php echo esc_html( $artemis_pf_d['dominio'] ); ?></span></p>
<h2 class="pf-feat__title" id="feat-title"><?php echo esc_html( $artemis_pf_d['nome'] ); ?></h2>
<p class="pf-feat__desc"><?php echo esc_html( $artemis_pf_d['descricao'] ); ?></p>
<?php if ( $artemis_pf_d['fatos'] ) : ?>
<dl class="pf-facts">
<?php foreach ( $artemis_pf_d['fatos'] as $artemis_pf_fato ) : ?>
<div class="pf-fact"><dt><?php echo esc_html( $artemis_pf_fato[0] ); ?></dt><dd><?php echo esc_html( $artemis_pf_fato[1] ); ?></dd></div>
<?php endforeach; ?>
</dl>
<?php endif; ?>
<?php if ( $artemis_pf_link ) : ?>
<div class="pf-btns">
<a class="pf-btn pf-btn--pri"<?php echo $artemis_pf_alvo; // phpcs:ignore WordPress.Security.EscapeOutput -- escapado acima ?>><?php echo esc_html( $artemis_pf_d['botao'] ); ?>
<?php echo artemis_pf_seta(); // phpcs:ignore WordPress.Security.EscapeOutput -- SVG fixo ?>
</a>
</div>
<?php endif; ?>
</div>
</article>
</div>
</section>
