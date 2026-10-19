<?php
/**
 * Documento + header (variante Portfólio) — mesma marcação de src/partials/header.html.
 * Textos: Personalizar → Portfólio: header. Links: Aparência → Menus → "Portfólio — menu principal" (sem menu: links do design).
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_menu = artemis_pf_menu_itens( 'pf_principal', artemis_pf_menu_principal_reserva() );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="pf">

<!-- Header · variante Portfólio (design/Main.dc.html .hdr): logo + selo, item atual, CTA -->
<header class="pf-hdr">
<div class="pf-wrap pf-hdr__in">
<div style="display: flex; align-items: center; gap: 24px">
<a href="<?php echo esc_url( artemis_pf_mod( 'art_pf_logo_url' ) ); ?>" aria-label="<?php esc_attr_e( 'Studio Artemis — página inicial', 'artemis' ); ?>"><img src="<?php echo esc_url( artemis_pf_asset( 'images/header/logo-artemis.svg' ) ); ?>" width="137" height="32" alt="Artemis"></a>
<span class="pf-tag"><?php echo esc_html( artemis_pf_mod( 'art_pf_selo' ) ); ?></span>
</div>
<nav class="pf-nav" aria-label="<?php esc_attr_e( 'Principal', 'artemis' ); ?>">
<?php foreach ( $artemis_pf_menu as $artemis_pf_item ) : ?>
<?php if ( $artemis_pf_item[2] ) : ?>
<a class="pf-nav__cur" href="<?php echo esc_url( $artemis_pf_item[1] ); ?>" aria-current="page"><?php echo esc_html( $artemis_pf_item[0] ); ?></a>
<?php else : ?>
<a href="<?php echo esc_url( $artemis_pf_item[1] ); ?>"><?php echo esc_html( $artemis_pf_item[0] ); ?></a>
<?php endif; ?>
<?php endforeach; ?>
<span class="pf-nav__sep" aria-hidden="true"></span>
<a class="pf-nav__cta" href="<?php echo esc_url( artemis_pf_mod( 'art_pf_cta_url' ) ); ?>"><?php echo esc_html( artemis_pf_mod( 'art_pf_cta_texto' ) ); ?></a>
</nav>
<button class="pf-menu-btn" type="button" aria-expanded="false" aria-controls="pf-menu" data-pf-menu-btn><?php esc_html_e( 'Menu', 'artemis' ); ?></button>
</div>
<!-- Menu do celular/tablet (≤1000): os mesmos links do menu principal + o botão do topo -->
<nav class="pf-menu" id="pf-menu" aria-label="<?php esc_attr_e( 'Principal', 'artemis' ); ?>" hidden data-extra>
<?php foreach ( $artemis_pf_menu as $artemis_pf_item ) : ?>
<a href="<?php echo esc_url( $artemis_pf_item[1] ); ?>"<?php echo $artemis_pf_item[2] ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $artemis_pf_item[0] ); ?></a>
<?php endforeach; ?>
<a class="pf-menu__cta" href="<?php echo esc_url( artemis_pf_mod( 'art_pf_cta_url' ) ); ?>"><?php echo esc_html( artemis_pf_mod( 'art_pf_cta_texto' ) ); ?></a>
</nav>
</header>
