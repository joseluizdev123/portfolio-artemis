<?php
/**
 * Studio Artemis — Portfólio (prévia): setup do tema.
 *
 * Espelha a página estática (index.html):
 *   inc/cpt-projeto.php                 → CPT art_projeto + taxonomia art_projeto_cat (abas do filtro) + caixas de edição
 *   inc/pagina.php                      → textos da página (caixas na tela da página com o template "Portfólio")
 *   inc/customizer.php                  → header e rodapé (Personalizar) e menus
 *   inc/seeder.php                      → Aparência → Portfólio: popular conteúdo
 *   templates/portfolio.php             → template da página → template-parts/portfolio/NN-slug.php
 *   assets/                             → cópia de assets/ do estático (tools/build.py), sem edição à mão
 */

defined( 'ABSPATH' ) || exit;

define( 'ARTEMIS_PF_VERSION', '0.1.0' );
define( 'ARTEMIS_PF_DIR', get_template_directory() );
define( 'ARTEMIS_PF_URI', get_template_directory_uri() );

require_once ARTEMIS_PF_DIR . '/inc/helpers.php';
require_once ARTEMIS_PF_DIR . '/inc/pagina.php';
require_once ARTEMIS_PF_DIR . '/inc/cpt-projeto.php';
require_once ARTEMIS_PF_DIR . '/inc/customizer.php';
if ( file_exists( ARTEMIS_PF_DIR . '/inc/seeder.php' ) ) {
	require_once ARTEMIS_PF_DIR . '/inc/seeder.php';
}

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	register_nav_menus( array(
		'pf_principal'      => __( 'Portfólio — menu principal (header e celular)', 'artemis' ),
		'pf_rodape_artemis' => __( 'Portfólio — rodapé, coluna "Artemis"', 'artemis' ),
		'pf_rodape_linhas'  => __( 'Portfólio — rodapé, coluna "Outras linhas"', 'artemis' ),
		'pf_legal'          => __( 'Portfólio — rodapé, links legais', 'artemis' ),
	) );
} );

/** CSS e JS da página — os mesmos arquivos e a mesma ordem do index.html estático. */
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'artemis-pf-fonts', 'https://fonts.googleapis.com/css2?family=Cabin:wdth,wght@75..100,400..700&family=Exo:wght@400..700&family=Instrument+Serif:ital@0;1&display=swap', array(), null );
	$css = array( 'base' => 'css/base.css' );
	foreach ( artemis_pf_partes() as $parte ) {
		$css[ $parte ] = 'css/sections/' . $parte . '.css';
	}
	$prev = array( 'artemis-pf-fonts' );
	foreach ( $css as $slug => $rel ) {
		$file = ARTEMIS_PF_DIR . '/assets/' . $rel;
		if ( ! file_exists( $file ) ) {
			continue;
		}
		wp_enqueue_style( 'artemis-pf-' . $slug, artemis_pf_asset( $rel ), $prev, (string) filemtime( $file ) );
		$prev = array( 'artemis-pf-' . $slug );
	}
	$js = ARTEMIS_PF_DIR . '/assets/js/portfolio.js';
	if ( file_exists( $js ) ) {
		wp_enqueue_script( 'artemis-pf', artemis_pf_asset( 'js/portfolio.js' ), array(), (string) filemtime( $js ), array( 'in_footer' => true, 'strategy' => 'defer' ) );
	}
}, 20 );

/*
 * Página idêntica ao estático: sem os estilos de blocos do WordPress (a página não usa blocos), sem emojis.
 * Fica restrito ao front-end; o editor continua com tudo.
 */
add_action( 'wp_enqueue_scripts', function () {
	foreach ( array( 'wp-block-library', 'wp-block-library-theme', 'classic-theme-styles', 'global-styles' ) as $handle ) {
		wp_dequeue_style( $handle );
	}
}, 100 );
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_enqueue_global_styles', 1 );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );
remove_action( 'wp_head', 'wp_print_auto_sizes_contain_css_fix', 1 );

add_filter( 'wp_resource_hints', function ( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
	}
	return $urls;
}, 10, 2 );

/* Favicon: a marca "A" enquanto o Ícone do site não é definido no Personalizar. */
add_action( 'wp_head', function () {
	if ( ! has_site_icon() ) {
		printf( '<link rel="icon" href="%s" type="image/svg+xml">' . "\n", esc_url( artemis_pf_asset( 'images/favicon.svg' ) ) );
	}
} );
